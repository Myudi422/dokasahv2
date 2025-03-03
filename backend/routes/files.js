// routes/files.js
const express = require('express');
const router = express.Router();
const { b2, createPresignedPost } = require('../b2Client');
const pool = require('../db'); // Perbaiki path import


// Generate presigned URL
router.post('/presigned-url', async (req, res) => {
  const { fileName, fileType } = req.body;
  
  try {
    const key = `uploads/${Date.now()}_${fileName}`;
    
    const { url, fields } = await createPresignedPost(b2, {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10485760], // 10MB
        ['starts-with', '$Content-Type', fileType]
      ],
      Expires: 3600, // 1 jam
      Fields: {
        'Content-Type': fileType
      }
    });

    // Simpan metadata ke database
    const [result] = await pool.execute(
      `INSERT INTO uploaded_files 
      (file_name, file_key, status) 
      VALUES (?, ?, 'pending')`,
      [fileName, key]
    );

    res.json({
      presignedUrl: url,
      fields,
      fileId: result.insertId,
      fileUrl: `${process.env.B2_ENDPOINT_URL}/${process.env.BUCKET_NAME}/${key}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal generate URL' });
  }
});

// Konfirmasi upload selesai
router.post('/confirm-upload', async (req, res) => {
  const { fileId, formId } = req.body;
  
  try {
    await pool.execute(
      `UPDATE uploaded_files SET
      status = 'uploaded',
      form_id = ?,
      uploaded_at = NOW()
      WHERE id = ?`,
      [formId, fileId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal konfirmasi upload' });
  }
});

module.exports = router;