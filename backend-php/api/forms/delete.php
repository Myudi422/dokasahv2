<?php
// backend-php/api/forms/delete.php
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
catch (Exception $e) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid.']); exit(); }
if (($decoded['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Hanya admin.']); exit(); }

$slug = trim($_GET['slug'] ?? '');
if (!$slug) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Slug wajib disertakan.']); exit(); }

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id FROM form_configurations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]); $form = $stmt->fetch();
    if (!$form) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'Formulir tidak ditemukan.']); exit(); }

    $pdo->prepare('DELETE FROM form_submissions WHERE form_config_id = ?')->execute([$form['id']]);
    $pdo->prepare('DELETE FROM form_configurations WHERE id = ?')->execute([$form['id']]);
    echo json_encode(['success'=>true,'message'=>'Formulir berhasil dihapus.']);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
