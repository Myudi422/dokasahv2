<?php
// backend-php/api/form-structures/delete.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter ID wajib disertakan untuk menghapus.']);
    exit();
}

try {
    $pdo = getDB();
    
    // Cek apakah data template ada
    $stmt = $pdo->prepare("SELECT form_type, label FROM form_structures WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $structure = $stmt->fetch();
    
    if (!$structure) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Template formulir tidak ditemukan.']);
        exit();
    }
    
    $form_type = $structure['form_type'];
    
    // Cek apakah form_type sedang digunakan di form_configurations
    $checkUsage = $pdo->prepare("SELECT COUNT(*) AS total FROM form_configurations WHERE form_type = ?");
    $checkUsage->execute([$form_type]);
    $usage = $checkUsage->fetch();
    
    if ($usage && (int)$usage['total'] > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Template '{$structure['label']}' tidak dapat dihapus karena sedang digunakan oleh {$usage['total']} formulir klien. Anda dapat menonaktifkan template ini agar tidak digunakan lagi tanpa menghapusnya."
        ]);
        exit();
    }
    
    // Lakukan penghapusan
    $delete = $pdo->prepare("DELETE FROM form_structures WHERE id = ?");
    $delete->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => "Template '{$structure['label']}' berhasil dihapus."
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
