require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer  = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Setup untuk menyimpan file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Ambil slug dan field name dari req.body (pastikan dikirim dari frontend)
    const formSlug = req.body.slug;
    const fieldName = req.body.fieldName || file.fieldname;
    // Dapatkan ekstensi file
    const ext = path.extname(file.originalname);
    // Optional: format field name (misal: ubah spasi jadi underscore dan lowercase)
    const formattedFieldName = fieldName.toLowerCase().replace(/\s+/g, '_');
    // Gabungkan field name dan slug
    const newFilename = `${formattedFieldName}_${formSlug}${ext}`;
    cb(null, newFilename);
  }
});


const upload = multer({ storage });

// Serve folder uploads sebagai static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Koneksi ke database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Secret key untuk JWT
const JWT_SECRET = process.env.JWT_SECRET

// Fungsi untuk menghasilkan slug unik
function generateUniqueSlug() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Fungsi untuk menghasilkan token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, profile_pictures: user.profile_pictures },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

app.post("/api/auth", async (req, res) => {
  const { name, email } = req.body;
  try {
    const [rows] = await pool.execute("SELECT * FROM users_legal WHERE email = ?", [email]);
    let user;
    if (rows.length > 0) {
      // Update data pengguna jika sudah ada
      await pool.execute(
        "UPDATE users_legal SET name = ?, updated_at = NOW() WHERE email = ?",
        [name, email]
      );
      user = rows[0];
    } else {
      // Insert data pengguna baru
      const [result] = await pool.execute(
        "INSERT INTO users_legal (name, email, role, created_at, updated_at) VALUES (?, ?, 'user', NOW(), NOW())",
        [name, email]
      );
      user = { id: result.insertId, name, email, role: "user" };
    }

    // Jika ada gambar profil dari Google, simpan ke database
    if (req.body.profile_picture) {
      await pool.execute(
        "UPDATE users_legal SET profile_pictures = ? WHERE email = ?",
        [req.body.profile_picture, email]
      );
      user.profile_pictures = req.body.profile_picture;
    }

    const token = generateToken(user);
    res.status(200).json({ message: "Login berhasil.", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan data pengguna." });
  }
});

// Middleware untuk verifikasi token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token tidak valid atau telah kedaluwarsa." });
    }
    req.user = user;
    next();
  });
}

// Endpoint untuk upload file
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diupload' });
  }
  // Kembalikan path file yang dapat diakses secara publik
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ message: 'File berhasil diupload', filePath });
});



// Contoh API yang dilindungi oleh token
app.get("/api/protected", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Ini adalah data terlindungi.", user: req.user });
});

app.post('/api/forms', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { email, formType } = req.body; // Tidak perlu formStructure
  const slug = generateUniqueSlug();

  try {
    // Cek apakah form type valid
    const [formTypeCheck] = await pool.execute(
      'SELECT * FROM form_structures WHERE form_type = ?',
      [formType]
    );
    
    if (formTypeCheck.length === 0) {
      return res.status(400).json({ message: 'Jenis formulir tidak valid' });
    }

    // Insert ke form_configurations tanpa form_structure
    const [result] = await pool.execute(
      'INSERT INTO form_configurations (form_type, assigned_email, slug) VALUES (?, ?, ?)',
      [formType, email, slug]
    );

    res.status(201).json({
      message: 'Form created successfully',
      link: `https://improved-lamp-vq6j9gjvjpxfp6jx-3000.app.github.dev/form/${slug}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat form' });
  }
});

  
app.get('/api/forms/:slug', authenticateToken, async (req, res) => {
  try {
    // Join dengan form_structures untuk ambil struktur
    const [forms] = await pool.execute(
      `SELECT fc.*, fs.form_structure 
       FROM form_configurations fc
       JOIN form_structures fs ON fc.form_type = fs.form_type
       WHERE slug = ?`,
      [req.params.slug]
    );

    if (forms.length === 0) return res.status(404).json({ message: 'Form tidak ditemukan' });

    const form = forms[0];
    if (form.assigned_email !== req.user.email) return res.status(403).json({ message: 'Akses ditolak' });

    // Ambil submission
    const [submissions] = await pool.execute(
      'SELECT * FROM form_submissions WHERE form_config_id = ? AND user_id = ?',
      [form.id, req.user.id]
    );

    res.json({
      form: {
        ...form,
        form_structure: form.form_structure // Ambil dari join
      },
      submission: submissions[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
  
  
  // Save draft
  app.put('/api/forms/:slug/draft', authenticateToken, async (req, res) => {
    try {
      const { slug } = req.params;
      const { data } = req.body;
  
      const [forms] = await pool.execute(
        'SELECT * FROM form_configurations WHERE slug = ?',
        [slug]
      );
  
      if (forms.length === 0) {
        return res.status(404).json({ message: 'Form not found' });
      }
  
      const form = forms[0];
  
      // Check email match
      if (form.assigned_email !== req.user.email) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      // Check if submission exists
      const [submissions] = await pool.execute(
        'SELECT * FROM form_submissions WHERE form_config_id = ? AND user_id = ?',
        [form.id, req.user.id]
      );
  
      if (submissions.length > 0) {
        // Update existing draft
        await pool.execute(
          'UPDATE form_submissions SET data = ?, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(data), submissions[0].id]
        );
      } else {
        // Create new draft
        await pool.execute(
          'INSERT INTO form_submissions (form_config_id, user_id, data) VALUES (?, ?, ?)',
          [form.id, req.user.id, JSON.stringify(data)]
        );
      }
  
      res.status(200).json({ message: 'Draft saved successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to save draft' });
    }
  });
  
  // Submit form
  app.post('/api/forms/:slug/submit', authenticateToken, async (req, res) => {
    try {
      const { slug } = req.params;
      const { data } = req.body;
  
      const [forms] = await pool.execute(
        'SELECT * FROM form_configurations WHERE slug = ?',
        [slug]
      );
  
      if (forms.length === 0) {
        return res.status(404).json({ message: 'Form not found' });
      }
  
      const form = forms[0];
  
      // Check email match
      if (form.assigned_email !== req.user.email) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      // Check if submission exists
      const [submissions] = await pool.execute(
        'SELECT * FROM form_submissions WHERE form_config_id = ? AND user_id = ?',
        [form.id, req.user.id]
      );
  
      if (submissions.length > 0) {
        // Update existing submission
        await pool.execute(
          'UPDATE form_submissions SET data = ?, status = "submitted", updated_at = NOW() WHERE id = ?',
          [JSON.stringify(data), submissions[0].id]
        );
      } else {
        // Create new submission
        await pool.execute(
          'INSERT INTO form_submissions (form_config_id, user_id, data, status) VALUES (?, ?, ?, "submitted")',
          [form.id, req.user.id, JSON.stringify(data)]
        );
      }
  
      res.status(200).json({ message: 'Form submitted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to submit form' });
    }
  });

  // PUT: Update submission status
app.put('/api/forms/:slug/status', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { status } = req.body;

    // Dapatkan form configuration
    const [forms] = await pool.execute(
      'SELECT * FROM form_configurations WHERE slug = ?',
      [slug]
    );
    
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Form tidak ditemukan' });
    }

    const form = forms[0];
    
    // Validasi kepemilikan form
    if (form.assigned_email !== req.user.email) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Dapatkan submission yang ada
    const [submissions] = await pool.execute(
      'SELECT * FROM form_submissions WHERE form_config_id = ? AND user_id = ?',
      [form.id, req.user.id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission tidak ditemukan' });
    }

    // Update status submission
    await pool.execute(
      'UPDATE form_submissions SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, submissions[0].id]
    );

    res.status(200).json({ message: 'Status berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengupdate status' });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
