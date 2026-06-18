<?php
// backend-php/api/form-structures/update.php
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
catch (Exception $e) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Token tidak valid: '.$e->getMessage()]); exit(); }
if (($decoded['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Akses ditolak. Hanya admin yang diperbolehkan.']); exit(); }

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$id = isset($body['id']) ? (int)$body['id'] : 0;
$form_type = isset($body['form_type']) ? trim($body['form_type']) : '';
$label = isset($body['label']) ? trim($body['label']) : '';
$description = isset($body['description']) ? trim($body['description']) : '';
$form_structure = $body['form_structure'] ?? null;
$is_active = isset($body['is_active']) ? (int)$body['is_active'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter ID wajib disertakan untuk melakukan update.']);
    exit();
}

try {
    $pdo = getDB();
    
    // Cek apakah data ada
    $check = $pdo->prepare("SELECT form_type FROM form_structures WHERE id = ? LIMIT 1");
    $check->execute([$id]);
    $current = $check->fetch();
    if (!$current) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Template formulir tidak ditemukan.']);
        exit();
    }
    
    // Siapkan data update
    $fieldsToUpdate = [];
    $params = [];
    
    if ($label !== '') {
        $fieldsToUpdate[] = "label = ?";
        $params[] = $label;
    }
    
    if ($description !== '') {
        $fieldsToUpdate[] = "description = ?";
        $params[] = $description;
    }
    
    if ($form_type !== '') {
        // Validasi format form_type
        if (!preg_match('/^[a-z0-9_]+$/', $form_type)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Key Formulir hanya boleh berisi huruf kecil, angka, dan underscore.']);
            exit();
        }
        
        // Cek duplikasi form_type dengan baris lain
        $dup = $pdo->prepare("SELECT id FROM form_structures WHERE form_type = ? AND id != ? LIMIT 1");
        $dup->execute([$form_type, $id]);
        if ($dup->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Key Formulir '$form_type' sudah terdaftar pada template lain."]);
            exit();
        }
        
        $fieldsToUpdate[] = "form_type = ?";
        $params[] = $form_type;
    }
    
    if ($form_structure !== null) {
        if (is_string($form_structure)) {
            $structure_test = json_decode($form_structure, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Format struktur formulir harus berupa JSON valid.']);
                exit();
            }
        } else if (is_array($form_structure)) {
            $form_structure = json_encode($form_structure);
        } else {
            $form_structure = json_encode(['sections' => []]);
        }
        $fieldsToUpdate[] = "form_structure = ?";
        $params[] = $form_structure;
    }
    
    if ($is_active !== null) {
        $fieldsToUpdate[] = "is_active = ?";
        $params[] = (int)$is_active;
    }
    
    if (empty($fieldsToUpdate)) {
        echo json_encode(['success' => true, 'message' => 'Tidak ada perubahan data yang dikirim.']);
        exit();
    }
    
    $params[] = $id;
    $sql = "UPDATE form_structures SET " . implode(", ", $fieldsToUpdate) . ", updated_at = NOW() WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Template formulir berhasil diperbarui.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
