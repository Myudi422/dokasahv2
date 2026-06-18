<?php
// backend-php/api/forms/status.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
catch (Exception $e) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid.']); exit(); }
if (($decoded['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Hanya admin.']); exit(); }

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$slug   = trim($body['slug']   ?? $_GET['slug']   ?? '');
$status = trim($body['status'] ?? $_GET['status'] ?? '');
$validStatuses = ['draft','submitted','proses','review','selesai'];

if (!$slug || !$status || !in_array($status, $validStatuses)) {
    http_response_code(400); echo json_encode(['success'=>false,'message'=>'Slug dan status valid wajib disertakan.']); exit();
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id FROM form_configurations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]); $form = $stmt->fetch();
    if (!$form) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'Formulir tidak ditemukan.']); exit(); }

    $upd = $pdo->prepare("UPDATE form_submissions SET status = ?, updated_at = NOW() WHERE form_config_id = ?");
    $upd->execute([$status, $form['id']]);
    if ($upd->rowCount() === 0) {
        $pdo->prepare("INSERT INTO form_submissions (form_config_id, data, status, updated_at) VALUES (?, '{}', ?, NOW())")->execute([$form['id'], $status]);
    }
    echo json_encode(['success'=>true,'message'=>"Status berhasil diubah ke '$status'."]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
