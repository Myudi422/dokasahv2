<?php
// backend-php/api/forms/list.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

$BASE = dirname(dirname(dirname(__FILE__)));
require_once $BASE . '/config/database.php';
require_once $BASE . '/helpers/jwt.php';

// Inline auth
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $h = apache_request_headers(); $authHeader = $h['Authorization'] ?? $h['authorization'] ?? '';
}
if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
if (!$authHeader) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak ditemukan.']); exit(); }
try { $decoded = jwtDecode(trim(str_ireplace('bearer', '', $authHeader))); }
catch (Exception $e) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid.']); exit(); }

try {
    $pdo = getDB();
    if ($decoded['role'] === 'admin') {
        $stmt = $pdo->prepare("
            SELECT fc.id, fc.form_type, fc.assigned_wa, fc.slug, fc.note, fc.created_at,
                   COALESCE(fs.label, fc.form_type) AS form_label,
                   fsub.status, fsub.updated_at AS last_updated
            FROM form_configurations fc
            LEFT JOIN form_structures fs ON fc.form_type = fs.form_type
            LEFT JOIN form_submissions fsub ON fc.id = fsub.form_config_id
            ORDER BY fc.created_at DESC
        ");
        $stmt->execute();
    } else {
        $stmt = $pdo->prepare("
            SELECT fc.id, fc.form_type, fc.assigned_wa, fc.slug, fc.note, fc.created_at,
                   COALESCE(fs.label, fc.form_type) AS form_label,
                   fsub.status, fsub.updated_at AS last_updated
            FROM form_configurations fc
            LEFT JOIN form_structures fs ON fc.form_type = fs.form_type
            LEFT JOIN form_submissions fsub ON fc.id = fsub.form_config_id
            WHERE fc.assigned_wa = ?
            ORDER BY fc.created_at DESC
        ");
        $stmt->execute([$decoded['email']]);
    }

    $forms = array_map(function($f) {
        return [
            'id'             => (int)$f['id'],
            'form_type'      => $f['form_type'],
            'form_label'     => $f['form_label'],
            'assigned_wa'    => $f['assigned_wa'],
            'assigned_email' => $f['assigned_wa'], // fallback compatibility
            'slug'           => $f['slug'],
            'note'           => $f['note'],
            'status'         => $f['status'] ?? 'draft',
            'link'           => "https://dokasah.web.id/form/{$f['slug']}",
            'created_at'     => $f['created_at'],
            'last_updated'   => $f['last_updated'],
        ];
    }, $stmt->fetchAll());

    echo json_encode(['success'=>true,'forms'=>$forms,'total'=>count($forms)]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
