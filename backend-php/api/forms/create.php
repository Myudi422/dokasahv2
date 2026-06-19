<?php
// backend-php/api/forms/create.php
// Self-contained: tidak butuh middleware/auth.php terpisah

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit();
}

// ── Gunakan path absolut berdasarkan posisi file ini ─────────────────────────
$BASE = dirname(dirname(dirname(__FILE__))); // /home/.../v2/android/dokasah

// ── Load dependencies ─────────────────────────────────────────────────────────
if (!file_exists($BASE . '/config/database.php')) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'config/database.php tidak ditemukan di: '.$BASE]);
    exit();
}
if (!file_exists($BASE . '/helpers/jwt.php')) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'helpers/jwt.php tidak ditemukan di: '.$BASE]);
    exit();
}

require_once $BASE . '/config/database.php';
require_once $BASE . '/helpers/jwt.php';

// ── Inline JWT Auth (tidak butuh middleware/auth.php) ─────────────────────────
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $h = apache_request_headers();
    $authHeader = $h['Authorization'] ?? $h['authorization'] ?? '';
}
// cPanel CGI fallback
if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

if (!$authHeader) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Token tidak ditemukan. Silakan login kembali.']);
    exit();
}

$token = trim(str_ireplace('bearer', '', $authHeader));
try {
    $decoded = jwtDecode($token);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Token tidak valid: '.$e->getMessage()]);
    exit();
}

if (($decoded['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success'=>false,'message'=>'Akses ditolak. Hanya admin yang bisa membuat formulir.']);
    exit();
}

$adminId = (int)($decoded['id'] ?? 0);

// ── Parse request body ────────────────────────────────────────────────────────
$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$wa       = trim($body['wa'] ?? $body['email'] ?? '');
$formType = trim($body['formType'] ?? '');
$note     = trim($body['note']     ?? '');

if (!$wa || !$formType) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Nomor WhatsApp dan jenis formulir wajib diisi.']);
    exit();
}
if (!preg_match('/^[0-9+ -]{9,20}$/', $wa)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Format nomor WhatsApp tidak valid. Gunakan format angka saja (contoh: 08123456789).']);
    exit();
}

// ── DB Operations ─────────────────────────────────────────────────────────────
try {
    $pdo = getDB();

    // Cek apakah form_structures table ada
    $tables = $pdo->query("SHOW TABLES LIKE 'form_structures'")->fetchAll();
    if (empty($tables)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Tabel form_structures belum dibuat. Jalankan setup.php terlebih dahulu!',
            'hint'    => 'https://dev.legalpilar.id/v2/android/dokasah/setup.php?key=DokasahSetup2024',
        ]);
        exit();
    }

    // Cek form type valid
    $stmt = $pdo->prepare('SELECT form_type, label FROM form_structures WHERE form_type = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$formType]);
    $formStructure = $stmt->fetch();

    if (!$formStructure) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>"Jenis formulir '$formType' tidak valid atau belum aktif."]);
        exit();
    }

    // Generate slug unik
    do {
        $slug = bin2hex(random_bytes(8));
        $check = $pdo->prepare('SELECT id FROM form_configurations WHERE slug = ? LIMIT 1');
        $check->execute([$slug]);
    } while ($check->fetch());

    // Insert form configuration
    $stmt = $pdo->prepare(
        'INSERT INTO form_configurations (form_type, assigned_wa, slug, note, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())'
    );
    $stmt->execute([$formType, $wa, $slug, $note, $adminId]);
    $formId = $pdo->lastInsertId();

    $link = "https://dokasah.web.id/form/$slug";

    echo json_encode([
        'success'   => true,
        'message'   => 'Formulir berhasil dibuat!',
        'form_id'   => (int)$formId,
        'slug'      => $slug,
        'link'      => $link,
        'form_type' => $formStructure,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'DB error: '.$e->getMessage()]);
}
