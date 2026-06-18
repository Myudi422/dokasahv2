<?php
// backend-php/api/upload/index.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

try {
    require_once __DIR__ . '/../../config/database.php';
    require_once __DIR__ . '/../../helpers/backblaze.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server config error: ' . $e->getMessage()]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$slug      = trim($_POST['slug'] ?? '');
$fieldName = trim($_POST['fieldName'] ?? '');

if (!$slug || !$fieldName) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'slug dan fieldName wajib diisi.']);
    exit();
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File tidak valid atau gagal diupload.']);
    exit();
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id FROM form_configurations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Formulir tidak ditemukan.']);
        exit();
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit();
}

$file        = $_FILES['file'];
$extension   = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedExts = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];

if (!in_array($extension, $allowedExts)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format tidak didukung. Gunakan: ' . implode(', ', $allowedExts)]);
    exit();
}

if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ukuran file maksimal 5MB.']);
    exit();
}

$remotePath  = "dokasah/berkas/$slug/$fieldName.$extension";
$fileContent = file_get_contents($file['tmp_name']);
$contentType = $file['type'];

// Remove Content-Type JSON header for upload response (multipart already sent)
$result = uploadToB2($fileContent, $contentType, $remotePath);

if ($result['success']) {
    echo json_encode([
        'success'  => true,
        'message'  => 'File berhasil diupload.',
        'fileUrl'  => $result['url'],
        'fileName' => "$fieldName.$extension",
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal upload: ' . ($result['error'] ?? 'Unknown error')]);
}
