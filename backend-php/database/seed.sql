-- =============================================================
-- backend-php/database/seed.sql
-- Run AFTER schema.sql
-- Creates: 1 admin user + NIB Perorangan form structure
-- =============================================================

-- -------------------------------------------------------
-- Admin user
-- Email: admin@dokasah.web.id
-- Password: Dokasah@Admin2024
-- IMPORTANT: Change password after first login!
-- Hash generated with: password_hash('Dokasah@Admin2024', PASSWORD_BCRYPT)
-- -------------------------------------------------------
INSERT INTO `users_legal` (`name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`)
VALUES (
  'Administrator',
  'admin@dokasah.web.id',
  '$2y$12$LqxPWHELQJRaSUCh4Kd/3OFLGdYYSxs8w.Q6rLi4o5p.9g.EhFn4G',
  'admin',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `role` = 'admin',
  `updated_at` = NOW();

-- -------------------------------------------------------
-- NIB Perorangan Form Structure
-- -------------------------------------------------------
INSERT INTO `form_structures` (`form_type`, `label`, `description`, `form_structure`, `is_active`)
VALUES (
  'nib_pribadi',
  'Pembuatan NIB Pribadi',
  'Formulir Pendaftaran NIB (Nomor Induk Berusaha) Perorangan melalui sistem OSS RBA.',
  JSON_OBJECT(
    'sections', JSON_ARRAY(
      JSON_OBJECT(
        'id', 'data_pribadi',
        'title', 'A. Data Pribadi (Sesuai KTP)',
        'note', 'Sertakan foto KTP & NPWP yang jelas dan masih berlaku.',
        'fields', JSON_ARRAY(
          JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE,'maxLength',16,'placeholder','16 digit nomor KTP'),
          JSON_OBJECT('name','nama_lengkap','label','Nama Lengkap','type','text','required',TRUE,'placeholder','Sesuai KTP'),
          JSON_OBJECT('name','jenis_kelamin','label','Jenis Kelamin','type','select','required',TRUE,'options',JSON_ARRAY('Laki-laki','Perempuan')),
          JSON_OBJECT('name','tempat_tgl_lahir','label','Tempat, Tgl Lahir','type','text','required',TRUE,'placeholder','Contoh: Jakarta, 01 Januari 1990'),
          JSON_OBJECT('name','alamat_ktp','label','Alamat KTP','type','textarea','required',TRUE,'placeholder','Alamat lengkap sesuai KTP'),
          JSON_OBJECT('name','email','label','Email Aktif','type','email','required',TRUE,'placeholder','email@contoh.com'),
          JSON_OBJECT('name','no_hp','label','No. HP / WhatsApp','type','tel','required',TRUE,'placeholder','08xxxxxxxxxx'),
          JSON_OBJECT('name','npwp','label','NPWP (Jika ada)','type','text','required',FALSE,'placeholder','Kosongkan jika belum memiliki NPWP')
        )
      ),
      JSON_OBJECT(
        'id', 'data_usaha',
        'title', 'B. Data Usaha',
        'note', NULL,
        'fields', JSON_ARRAY(
          JSON_OBJECT('name','nama_usaha','label','Nama Usaha','type','text','required',TRUE,'placeholder','Nama usaha/bisnis Anda'),
          JSON_OBJECT('name','bidang_usaha','label','Bidang Usaha','type','text','required',TRUE,'placeholder','Contoh: Perdagangan Eceran, Jasa Konsultasi, dll'),
          JSON_OBJECT('name','alamat_usaha','label','Alamat Lokasi Usaha','type','textarea','required',TRUE,'placeholder','Alamat lengkap tempat usaha'),
          JSON_OBJECT('name','modal_usaha','label','Modal Usaha (Rp)','type','number','required',TRUE,'placeholder','Contoh: 5000000','prefix','Rp'),
          JSON_OBJECT('name','jumlah_tk','label','Jumlah Tenaga Kerja','type','number','required',TRUE,'placeholder','Jumlah karyawan termasuk pemilik'),
          JSON_OBJECT('name','kbli','label','Request KBLI','type','textarea','required',FALSE,'placeholder','Contoh: 47111 - Perdagangan Eceran. Bisa kita sesuaikan bersama.')
        )
      ),
      JSON_OBJECT(
        'id', 'upload_dokumen',
        'title', 'C. Upload Dokumen',
        'note', 'Format: JPG, PNG, atau PDF. Maksimal 5MB per file.',
        'fields', JSON_ARRAY(
          JSON_OBJECT('name','foto_ktp','label','Foto KTP','type','file','required',TRUE,'accept','image/*,.pdf','description','Upload foto KTP yang jelas dan tidak buram'),
          JSON_OBJECT('name','foto_npwp','label','Foto NPWP','type','file','required',FALSE,'accept','image/*,.pdf','description','Upload foto NPWP jika sudah memiliki')
        )
      )
    )
  ),
  1
)
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `form_structure` = VALUES(`form_structure`),
  `updated_at` = NOW();

-- -------------------------------------------------------
-- Other form types (structure to be filled later)
-- -------------------------------------------------------
INSERT IGNORE INTO `form_structures` (`form_type`, `label`, `description`, `form_structure`, `is_active`)
VALUES 
  ('pt_perorangan', 'Pendirian PT Perorangan',   'Formulir pendirian Perseroan Terbatas Perorangan.', '{"sections":[]}', 0),
  ('pt_umum',       'Pendirian PT Umum',          'Formulir pendirian Perseroan Terbatas Umum.',        '{"sections":[]}', 0),
  ('cv',            'Pendirian CV',               'Formulir pendirian Commanditaire Vennootschap.',     '{"sections":[]}', 0),
  ('yayasan',       'Pendirian Yayasan',           'Formulir pendirian Yayasan.',                        '{"sections":[]}', 0),
  ('koperasi',      'Pendirian Koperasi',          'Formulir pendirian Koperasi.',                       '{"sections":[]}', 0),
  ('npwp_pribadi',  'Pembuatan NPWP Pribadi',     'Formulir pembuatan NPWP Perorangan.',               '{"sections":[]}', 0),
  ('npwp_badan',    'Pembuatan NPWP Badan',       'Formulir pembuatan NPWP Badan Usaha.',              '{"sections":[]}', 0),
  ('nib_badan',     'Pembuatan NIB Badan',        'Formulir pendaftaran NIB untuk badan usaha.',       '{"sections":[]}', 0);
