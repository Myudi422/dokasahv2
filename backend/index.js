require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken"); // Tambahkan library jsonwebtoken

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Izinkan hanya frontend
  methods: ["GET", "POST", "PUT", "DELETE"], // Metode HTTP yang diizinkan
  allowedHeaders: ["Content-Type", "Authorization"], // Header yang diizinkan
}));
app.use(express.json());

// Koneksi ke database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Secret key untuk JWT (simpan di .env)
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Tambahkan di backend
function generateUniqueSlug() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

// Fungsi untuk menghasilkan token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name }, // Payload
    JWT_SECRET, // Secret key
    { expiresIn: "1h" } // Token valid selama 1 jam
  );
}

// API untuk menyimpan data pengguna dan menghasilkan token
app.post("/api/auth", async (req, res) => {
  const { name, email } = req.body;

  try {
    // Cek apakah pengguna sudah ada
    const [rows] = await pool.execute("SELECT * FROM users_legal WHERE email = ?", [email]);

    let user;
    if (rows.length > 0) {
      // Jika pengguna sudah ada, update data
      await pool.execute(
        "UPDATE users_legal SET name = ?, updated_at = NOW() WHERE email = ?",
        [name, email]
      );
      user = rows[0];
    } else {
      // Jika pengguna belum ada, tambahkan data baru
      const [result] = await pool.execute(
        "INSERT INTO users_legal (name, email, role, created_at, updated_at) VALUES (?, ?, 'user', NOW(), NOW())",
        [name, email]
      );
      user = { id: result.insertId, name, email, role: "user" };
    }

    // Generate JWT token
    const token = generateToken(user);

    // Kirim token ke frontend
    res.status(200).json({ message: "Login berhasil.", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan data pengguna." });
  }
});

// Middleware untuk memverifikasi token
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
    req.user = user; // Simpan data pengguna dari token
    next();
  });
}

// Contoh API yang dilindungi oleh token
app.get("/api/protected", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Ini adalah data terlindungi.", user: req.user });
});

// Create new form configuration (Admin only)
app.post('/api/forms', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
  
    const { email, formType } = req.body;
    const slug = generateUniqueSlug(); // Implement a slug generation function
  
    try {
      const [result] = await pool.execute(
        'INSERT INTO form_configurations (form_type, assigned_email, slug) VALUES (?, ?, ?)',
        [formType, email, slug]
      );
  
      res.status(201).json({
        message: 'Form created successfully',
        link: `http://localhost:3000/form/${slug}`
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to create form' });
    }
  });
  
// Get form data dan validasi akses
app.get('/api/forms/:slug', authenticateToken, async (req, res) => {
    try {
      const [forms] = await pool.execute(
        'SELECT * FROM form_configurations WHERE slug = ?',
        [req.params.slug]
      );
  
      if (forms.length === 0) {
        return res.status(404).json({ message: 'Form tidak ditemukan' });
      }
  
      const form = forms[0];
      
      // Validasi email pengguna
      if (form.assigned_email !== req.user.email) {
        return res.status(403).json({ message: 'Form tidak untuk Anda' });
      }
      
      // Ambil submission jika ada
      const [submissions] = await pool.execute(
        'SELECT * FROM form_submissions WHERE form_config_id = ? AND user_id = ?',
        [form.id, req.user.id]
      );
  
      res.status(200).json({
        form: {
          type: form.form_type,
          slug: form.slug
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

// Jalankan server
app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});