<?php
// backend-php/api/auth/me.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

$BASE = dirname(dirname(dirname(__FILE__)));
require_once $BASE . '/config/database.php';
require_once $BASE . '/helpers/jwt.php';

// Inline auth check
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $h = apache_request_headers();
    $authHeader = $h['Authorization'] ?? $h['authorization'] ?? '';
}
if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}
if (!$authHeader) {
    http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak ditemukan.']); exit();
}

try {
    $decoded = jwtDecode(trim(str_ireplace('bearer', '', $authHeader)));
} catch (Exception $e) {
    http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid.']); exit();
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, email, name, role, profile_pictures, created_at FROM users_legal WHERE id = ? LIMIT 1');
    $stmt->execute([$decoded['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404); echo json_encode(['success'=>false,'message'=>'User tidak ditemukan.']); exit();
    }
    echo json_encode(['success'=>true,'user'=>$user]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
