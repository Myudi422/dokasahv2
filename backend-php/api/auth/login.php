<?php
// backend-php/api/auth/login.php
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

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($body['email']    ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Email dan password wajib diisi.']); exit();
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT * FROM users_legal WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401); echo json_encode(['success'=>false,'message'=>'Email tidak terdaftar.']); exit();
    }
    if (empty($user['password_hash'])) {
        http_response_code(401); echo json_encode(['success'=>false,'message'=>'Akun belum memiliki password. Hubungi admin.']); exit();
    }
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401); echo json_encode(['success'=>false,'message'=>'Password salah.']); exit();
    }

    $token = jwtEncode([
        'id'               => (int)$user['id'],
        'email'            => $user['email'],
        'name'             => $user['name'],
        'role'             => $user['role'],
        'profile_pictures' => $user['profile_pictures'] ?? null,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil.',
        'token'   => $token,
        'user'    => [
            'id'               => (int)$user['id'],
            'email'            => $user['email'],
            'name'             => $user['name'],
            'role'             => $user['role'],
            'profile_pictures' => $user['profile_pictures'] ?? null,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
