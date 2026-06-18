<?php
// backend-php/api/form-structures/create.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit();
}

$BASE = dirname(dirname(dirname(__FILE__)));
require_once $BASE . '/config/database.php';
require_once $BASE . '/helpers/jwt.php';

// Inline admin auth
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) { $h = apache_request_headers(); $authHeader = $h['Authorization'] ?? $h['authorization'] ?? ''; }
if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
if (!$authHeader) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak ditemukan.']); exit(); }
try { $decoded = jwtDecode(trim(str_ireplace('bearer', '', $authHeader))); }
catch (Exception $e) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid: '.$e->getMessage()]); exit(); }
if (($decoded['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Akses ditolak. Hanya admin yang diperbolehkan.']); exit(); }

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$form_type = trim($body['form_type'] ?? '');
$label = trim($body['label'] ?? '');
$description = trim($body['description'] ?? '');
$form_structure = $body['form_structure'] ?? null;
$is_active = isset($body['is_active']) ? (int)$body['is_active'] : 1;

if (!$form_type || !$label) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Key Formulir (form_type) dan Nama Formulir (label) wajib diisi.']);
    exit();
}

// Validasi format form_type: hanya huruf kecil, angka, dan underscore
if (!preg_match('/^[a-z0-9_]+$/', $form_type)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Key Formulir hanya boleh berisi huruf kecil, angka, dan underscore (contoh: nib_pribadi, pt_umum).']);
    exit();
}

// Pastikan form_structure dalam format yang benar (JSON array/object)
if (is_string($form_structure)) {
    $structure_test = json_decode($form_structure, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format struktur formulir harus berupa JSON valid.']);
        exit();
    }
} else if (is_array($form_structure)) {
    $structure_test = $form_structure;
    $form_structure = json_encode($form_structure);
} else {
    // Default struktur kosong
    $structure_test = ['sections' => []];
    $form_structure = json_encode($structure_test);
}

try {
    $pdo = getDB();
    
    // Cek duplikasi form_type
    $stmt = $pdo->prepare("SELECT id FROM form_structures WHERE form_type = ? LIMIT 1");
    $stmt->execute([$form_type]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Key Formulir '$form_type' sudah terdaftar. Gunakan key lain."]);
        exit();
    }
    
    // Insert data baru
    $insert = $pdo->prepare("
        INSERT INTO form_structures (form_type, label, description, form_structure, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $insert->execute([$form_type, $label, $description, $form_structure, $is_active]);
    $new_id = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Template formulir berhasil dibuat.',
        'id' => (int)$new_id,
        'form_type' => $form_type
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
