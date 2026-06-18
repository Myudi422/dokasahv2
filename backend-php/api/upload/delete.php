<?php
// backend-php/api/upload/delete.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $BASE = dirname(dirname(dirname(__FILE__)));
    require_once $BASE . '/config/database.php';
    require_once $BASE . '/helpers/backblaze.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server config error: ' . $e->getMessage()]);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$slug      = trim($body['slug'] ?? '');
$fieldName = trim($body['fieldName'] ?? '');

if (!$slug || !$fieldName) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'slug dan fieldName wajib diisi.']);
    exit();
}

try {
    $pdo  = getDB();
    
    // Find the submission
    $stmt = $pdo->prepare('
        SELECT fs.id, fs.data 
        FROM form_submissions fs
        JOIN form_configurations fc ON fs.form_config_id = fc.id
        WHERE fc.slug = ? LIMIT 1
    ');
    $stmt->execute([$slug]);
    $submission = $stmt->fetch();
    
    if (!$submission) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengajuan tidak ditemukan.']);
        exit();
    }
    
    $data = json_decode($submission['data'], true) ?? [];
    
    if (!isset($data[$fieldName])) {
        // No file is stored in draft for this field, consider it already deleted/empty
        echo json_encode(['success' => true, 'message' => 'File sudah tidak ada.']);
        exit();
    }
    
    $fileUrl = $data[$fieldName];
    
    // Check if it's a Backblaze B2 CDN URL
    if (strpos($fileUrl, B2_CDN_URL) === 0) {
        $remotePath = str_replace(B2_CDN_URL, '', $fileUrl);
        $deleteResult = deleteFromB2($remotePath);
        
        if (!$deleteResult['success']) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Gagal menghapus file dari penyimpanan: ' . ($deleteResult['error'] ?? 'Unknown error')
            ]);
            exit();
        }
    }
    
    // Update the draft database record
    unset($data[$fieldName]);
    
    $stmt = $pdo->prepare('UPDATE form_submissions SET data = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([json_encode($data), $submission['id']]);
    
    echo json_encode(['success' => true, 'message' => 'File berhasil dihapus.']);
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit();
}
