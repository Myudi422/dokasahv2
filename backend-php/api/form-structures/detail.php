<?php
// backend-php/api/form-structures/detail.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$form_type = isset($_GET['form_type']) ? trim($_GET['form_type']) : '';

if (!$id && !$form_type) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter ID atau Form Type wajib disertakan.']);
    exit();
}

try {
    $pdo = getDB();
    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT id, form_type, label, description, form_structure, is_active, created_at, updated_at FROM form_structures WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare("SELECT id, form_type, label, description, form_structure, is_active, created_at, updated_at FROM form_structures WHERE form_type = ? LIMIT 1");
        $stmt->execute([$form_type]);
    }
    
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Template formulir tidak ditemukan.']);
        exit();
    }
    
    $structure = [
        'id' => (int)$row['id'],
        'form_type' => $row['form_type'],
        'label' => $row['label'],
        'description' => $row['description'],
        'form_structure' => json_decode($row['form_structure'], true) ?? ['sections' => []],
        'is_active' => (int)$row['is_active'] === 1,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
    
    echo json_encode(['success' => true, 'structure' => $structure]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
