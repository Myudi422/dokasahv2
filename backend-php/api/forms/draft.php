<?php
// backend-php/api/forms/draft.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT'])) {
    http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit();
}

$BASE = dirname(dirname(dirname(__FILE__)));
require_once $BASE . '/config/database.php';

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$slug = trim($body['slug'] ?? $_GET['slug'] ?? '');
$data = $body['data'] ?? [];

if (!$slug) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Slug wajib disertakan.']); exit(); }

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id FROM form_configurations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $form = $stmt->fetch();
    if (!$form) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'Formulir tidak ditemukan.']); exit(); }

    $formId = $form['id'];
    $stmt = $pdo->prepare('SELECT id, status FROM form_submissions WHERE form_config_id = ? LIMIT 1');
    $stmt->execute([$formId]);
    $existing = $stmt->fetch();

    if ($existing) {
        if ($existing['status'] === 'submitted') {
            http_response_code(400); echo json_encode(['success'=>false,'message'=>'Formulir sudah disubmit.']); exit();
        }
        $pdo->prepare("UPDATE form_submissions SET data = ?, status = 'draft', updated_at = NOW() WHERE id = ?")->execute([json_encode($data), $existing['id']]);
    } else {
        $pdo->prepare("INSERT INTO form_submissions (form_config_id, data, status, updated_at) VALUES (?, ?, 'draft', NOW())")->execute([$formId, json_encode($data)]);
    }
    echo json_encode(['success'=>true,'message'=>'Draft tersimpan.']);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Gagal menyimpan draft: '.$e->getMessage()]);
}
