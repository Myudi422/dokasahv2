<?php
// backend-php/setup.php
// Setup otomatis: buat semua tabel + seed data
// Akses: https://dev.legalpilar.id/v2/android/dokasah/setup.php?key=DokasahSetup2024
// HAPUS FILE INI SETELAH SETUP!

header("Content-Type: text/html; charset=UTF-8");

$setupKey = $_GET['key'] ?? '';
if ($setupKey !== 'DokasahSetup2024') {
    die('<h2 style="color:red">403 Forbidden</h2><p>Tambahkan <code>?key=DokasahSetup2024</code> di URL.</p>');
}

require_once __DIR__ . '/config/database.php';

$logs   = [];
$errors = [];

function runSQL(PDO $pdo, string $label, string $sql): void {
    global $logs, $errors;
    try {
        $pdo->exec($sql);
        $logs[] = "✅ $label";
    } catch (PDOException $e) {
        $errors[] = "❌ $label: " . $e->getMessage();
    }
}

try {
    $pdo = getDB();
    $logs[] = "✅ Database connected";
} catch (Exception $e) {
    die('<h2 style="color:red">DB Error: ' . $e->getMessage() . '</h2>');
}

// ── 1. users_legal ────────────────────────────────────────────────────────────
runSQL($pdo, "CREATE TABLE users_legal", "
CREATE TABLE IF NOT EXISTS `users_legal` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`             VARCHAR(255)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL UNIQUE,
  `password_hash`    VARCHAR(255)  NULL,
  `role`             ENUM('admin','user') NOT NULL DEFAULT 'user',
  `profile_pictures` TEXT          NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (`email`),
  INDEX idx_role  (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// Add password_hash column if table already existed without it
try {
    $cols = array_column($pdo->query("SHOW COLUMNS FROM users_legal")->fetchAll(), 'Field');
    if (!in_array('password_hash', $cols)) {
        $pdo->exec("ALTER TABLE `users_legal` ADD COLUMN `password_hash` VARCHAR(255) NULL AFTER `email`");
        $logs[] = "✅ ALTER TABLE users_legal — added password_hash";
    } else {
        $logs[] = "ℹ️  users_legal.password_hash already exists";
    }
} catch (Exception $e) {
    $errors[] = "❌ ALTER users_legal: " . $e->getMessage();
}

// ── 2. form_structures ────────────────────────────────────────────────────────
runSQL($pdo, "CREATE TABLE form_structures", "
CREATE TABLE IF NOT EXISTS `form_structures` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_type`      VARCHAR(100) NOT NULL UNIQUE,
  `label`          VARCHAR(255) NOT NULL,
  `description`    TEXT         NULL,
  `form_structure` JSON         NOT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_form_type (`form_type`),
  INDEX idx_active    (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// ── 3. form_configurations ────────────────────────────────────────────────────
runSQL($pdo, "CREATE TABLE form_configurations", "
CREATE TABLE IF NOT EXISTS `form_configurations` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_type`      VARCHAR(100) NOT NULL,
  `assigned_email` VARCHAR(255) NOT NULL,
  `slug`           VARCHAR(64)  NOT NULL UNIQUE,
  `note`           TEXT         NULL,
  `created_by`     INT UNSIGNED NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug           (`slug`),
  INDEX idx_assigned_email (`assigned_email`),
  INDEX idx_form_type      (`form_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// ── 4. form_submissions ───────────────────────────────────────────────────────
runSQL($pdo, "CREATE TABLE form_submissions", "
CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_config_id` INT UNSIGNED NOT NULL,
  `user_id`        INT UNSIGNED NULL,
  `data`           JSON         NOT NULL,
  `status`         ENUM('draft','submitted','proses','review','selesai') NOT NULL DEFAULT 'draft',
  `submitted_at`   DATETIME     NULL,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_config (`form_config_id`),
  INDEX idx_status (`status`),
  FOREIGN KEY (`form_config_id`) REFERENCES `form_configurations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// ── 5. Seed NIB Pribadi form structure ────────────────────────────────────────
$nibStructure = json_encode([
    'sections' => [
        [
            'id'     => 'data_pribadi',
            'title'  => 'A. Data Pribadi (Sesuai KTP)',
            'note'   => 'Sertakan foto KTP & NPWP yang jelas dan masih berlaku.',
            'fields' => [
                ['name'=>'nik',            'label'=>'NIK',                  'type'=>'text',     'required'=>true,  'maxLength'=>16,  'placeholder'=>'16 digit nomor KTP'],
                ['name'=>'nama_lengkap',   'label'=>'Nama Lengkap',         'type'=>'text',     'required'=>true,  'placeholder'=>'Sesuai KTP'],
                ['name'=>'jenis_kelamin',  'label'=>'Jenis Kelamin',        'type'=>'select',   'required'=>true,  'options'=>['Laki-laki','Perempuan']],
                ['name'=>'tempat_tgl_lahir','label'=>'Tempat, Tgl Lahir',   'type'=>'text',     'required'=>true,  'placeholder'=>'Contoh: Jakarta, 01 Januari 1990'],
                ['name'=>'alamat_ktp',     'label'=>'Alamat KTP',           'type'=>'textarea', 'required'=>true,  'placeholder'=>'Alamat lengkap sesuai KTP'],
                ['name'=>'email',          'label'=>'Email Aktif',          'type'=>'email',    'required'=>true,  'placeholder'=>'email@contoh.com'],
                ['name'=>'no_hp',          'label'=>'No. HP / WhatsApp',    'type'=>'tel',      'required'=>true,  'placeholder'=>'08xxxxxxxxxx'],
                ['name'=>'npwp',           'label'=>'NPWP (Jika ada)',      'type'=>'text',     'required'=>false, 'placeholder'=>'Kosongkan jika belum memiliki NPWP'],
            ]
        ],
        [
            'id'     => 'data_usaha',
            'title'  => 'B. Data Usaha',
            'note'   => null,
            'fields' => [
                ['name'=>'nama_usaha',    'label'=>'Nama Usaha',           'type'=>'text',     'required'=>true,  'placeholder'=>'Nama usaha/bisnis Anda'],
                ['name'=>'bidang_usaha',  'label'=>'Bidang Usaha',         'type'=>'text',     'required'=>true,  'placeholder'=>'Contoh: Perdagangan Eceran, Jasa Konsultasi'],
                ['name'=>'alamat_usaha',  'label'=>'Alamat Lokasi Usaha',  'type'=>'textarea', 'required'=>true,  'placeholder'=>'Alamat lengkap tempat usaha'],
                ['name'=>'modal_usaha',   'label'=>'Modal Usaha (Rp)',     'type'=>'number',   'required'=>true,  'placeholder'=>'Contoh: 5000000', 'prefix'=>'Rp'],
                ['name'=>'jumlah_tk',     'label'=>'Jumlah Tenaga Kerja',  'type'=>'number',   'required'=>true,  'placeholder'=>'Jumlah karyawan termasuk pemilik'],
                ['name'=>'kbli',          'label'=>'Request KBLI',         'type'=>'textarea', 'required'=>false, 'placeholder'=>'Contoh: 47111 - Perdagangan Eceran. Bisa kita sesuaikan bersama.'],
            ]
        ],
        [
            'id'     => 'upload_dokumen',
            'title'  => 'C. Upload Dokumen',
            'note'   => 'Format: JPG, PNG, atau PDF. Maksimal 5MB per file.',
            'fields' => [
                ['name'=>'foto_ktp',  'label'=>'Foto KTP',  'type'=>'file', 'required'=>true,  'accept'=>'image/*,.pdf', 'description'=>'Upload foto KTP yang jelas dan tidak buram'],
                ['name'=>'foto_npwp', 'label'=>'Foto NPWP', 'type'=>'file', 'required'=>false, 'accept'=>'image/*,.pdf', 'description'=>'Upload foto NPWP jika sudah memiliki'],
            ]
        ],
    ]
]);

$formTypes = [
    ['nib_pribadi',   'Pembuatan NIB Pribadi',    'Formulir Pendaftaran NIB (Nomor Induk Berusaha) Perorangan melalui sistem OSS RBA.', $nibStructure, 1],
    ['pt_perorangan', 'Pendirian PT Perorangan',  'Formulir pendirian Perseroan Terbatas Perorangan.',  '{"sections":[]}', 0],
    ['pt_umum',       'Pendirian PT Umum',         'Formulir pendirian Perseroan Terbatas Umum.',         '{"sections":[]}', 0],
    ['cv',            'Pendirian CV',              'Formulir pendirian Commanditaire Vennootschap.',      '{"sections":[]}', 0],
    ['yayasan',       'Pendirian Yayasan',          'Formulir pendirian Yayasan.',                         '{"sections":[]}', 0],
    ['koperasi',      'Pendirian Koperasi',         'Formulir pendirian Koperasi.',                        '{"sections":[]}', 0],
    ['npwp_pribadi',  'Pembuatan NPWP Pribadi',    'Formulir pembuatan NPWP Perorangan.',                '{"sections":[]}', 0],
    ['npwp_badan',    'Pembuatan NPWP Badan',      'Formulir pembuatan NPWP Badan Usaha.',               '{"sections":[]}', 0],
    ['nib_badan',     'Pembuatan NIB Badan',       'Formulir pendaftaran NIB untuk badan usaha.',        '{"sections":[]}', 0],
];

foreach ($formTypes as [$type, $label, $desc, $structure, $active]) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO form_structures (form_type, label, description, form_structure, is_active)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description), form_structure=VALUES(form_structure), updated_at=NOW()
        ");
        $stmt->execute([$type, $label, $desc, $structure, $active]);
        $logs[] = "✅ Seed form_structure: $label";
    } catch (Exception $e) {
        $errors[] = "❌ Seed $type: " . $e->getMessage();
    }
}

// ── 6. Seed admin user ────────────────────────────────────────────────────────
$adminEmail    = $_GET['admin_email'] ?? 'admin@dokasah.web.id';
$adminPassword = $_GET['admin_pass']  ?? 'Dokasah123';
$adminName     = $_GET['admin_name']  ?? 'Administrator';
$adminHash     = password_hash($adminPassword, PASSWORD_BCRYPT, ['cost' => 12]);

try {
    $stmt = $pdo->prepare("
        INSERT INTO users_legal (name, email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', NOW(), NOW())
        ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role='admin', updated_at=NOW()
    ");
    $stmt->execute([$adminName, $adminEmail, $adminHash]);
    $logs[] = "✅ Admin user: $adminEmail / $adminPassword";
} catch (Exception $e) {
    $errors[] = "❌ Admin user: " . $e->getMessage();
}

// ── Output ────────────────────────────────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Dokasah Setup</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; background: #f8fafc; }
  h1 { color: #1e40af; }
  .log { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; }
  .log p { margin: 4px 0; font-size: 14px; font-family: monospace; }
  .error { color: #dc2626; }
  .success { color: #16a34a; }
  .box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .warning { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body>
<h1>🚀 Dokasah Setup</h1>

<div class="log">
<?php foreach ($logs as $log): ?>
  <p class="success"><?= htmlspecialchars($log) ?></p>
<?php endforeach; ?>
<?php foreach ($errors as $err): ?>
  <p class="error"><?= htmlspecialchars($err) ?></p>
<?php endforeach; ?>
</div>

<?php if (empty($errors)): ?>
<div class="box">
  <strong>✅ Setup Selesai!</strong><br><br>
  <b>Admin Login:</b><br>
  Email: <code><?= htmlspecialchars($adminEmail) ?></code><br>
  Password: <code><?= htmlspecialchars($adminPassword) ?></code>
</div>
<?php else: ?>
<div class="box" style="background:#fef2f2;border-color:#fca5a5">
  <strong>⚠️ Ada error. Cek pesan di atas.</strong>
</div>
<?php endif; ?>

<div class="warning">
  ⚠️ <strong>PENTING:</strong> Hapus file <code>setup.php</code> dari server setelah setup selesai!
</div>

<p>Kustomisasi password admin:<br>
<code>?key=DokasahSetup2024&admin_email=email@kamu.com&admin_pass=PasswordKamu&admin_name=NamaKamu</code></p>
</body>
</html>
