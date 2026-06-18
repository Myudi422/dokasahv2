<?php
// backend-php/api/dashboard/stats.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

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

try {
    $pdo    = getDB();
    $counts = $pdo->query("
        SELECT
            COUNT(fc.id) AS total,
            SUM(CASE WHEN COALESCE(fs.status,'draft') = 'draft'     THEN 1 ELSE 0 END) AS draft,
            SUM(CASE WHEN fs.status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
            SUM(CASE WHEN fs.status = 'proses'    THEN 1 ELSE 0 END) AS proses,
            SUM(CASE WHEN fs.status = 'review'    THEN 1 ELSE 0 END) AS review,
            SUM(CASE WHEN fs.status = 'selesai'   THEN 1 ELSE 0 END) AS selesai
        FROM form_configurations fc
        LEFT JOIN form_submissions fs ON fc.id = fs.form_config_id
    ")->fetch();

    echo json_encode([
        'success' => true,
        'counts'  => [
            'total'     => (int)$counts['total'],
            'draft'     => (int)$counts['draft'],
            'submitted' => (int)$counts['submitted'],
            'proses'    => (int)$counts['proses'],
            'review'    => (int)$counts['review'],
            'selesai'   => (int)$counts['selesai'],
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
