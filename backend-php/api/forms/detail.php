<?php
// backend-php/api/forms/detail.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

$BASE = dirname(dirname(dirname(__FILE__)));
require_once $BASE . '/config/database.php';

$slug = trim($_GET['slug'] ?? '');
if (!$slug) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Slug wajib disertakan.']); exit(); }

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare("
        SELECT fc.id, fc.form_type, fc.assigned_wa, fc.slug, fc.note, fc.created_at,
               fs.label AS form_label, fs.form_structure, fs.description AS form_description
        FROM form_configurations fc
        JOIN form_structures fs ON fc.form_type = fs.form_type
        WHERE fc.slug = ? LIMIT 1
    ");
    $stmt->execute([$slug]);
    $form = $stmt->fetch();

    if (!$form) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'Formulir tidak ditemukan.']); exit(); }

    $stmt = $pdo->prepare("SELECT data, status, submitted_at, updated_at FROM form_submissions WHERE form_config_id = ? ORDER BY updated_at DESC LIMIT 1");
    $stmt->execute([$form['id']]);
    $submission = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'form' => [
            'id'               => (int)$form['id'],
            'form_type'        => $form['form_type'],
            'form_label'       => $form['form_label'],
            'form_description' => $form['form_description'],
            'assigned_wa'      => $form['assigned_wa'],
            'assigned_email'   => $form['assigned_wa'], // fallback compatibility
            'slug'             => $form['slug'],
            'note'             => $form['note'],
            'form_structure'   => json_decode($form['form_structure'], true),
            'created_at'       => $form['created_at'],
        ],
        'submission' => $submission ? [
            'data'         => json_decode($submission['data'], true),
            'status'       => $submission['status'],
            'submitted_at' => $submission['submitted_at'],
            'updated_at'   => $submission['updated_at'],
        ] : null,
    ]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Server error: '.$e->getMessage()]);
}
