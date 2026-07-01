<?php
// backend-php/api/social-media/media-upload.php
// Upload media files (images/videos) - stored locally

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$postId = (int)($_POST['post_id'] ?? 0);

if (!$postId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'post_id wajib diisi.']);
    exit();
}

// Verify post ownership
try {
    $check = $pdo->prepare('SELECT id FROM sm_posts WHERE id = ? AND user_id = ?');
    $check->execute([$postId, $user['id']]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Post tidak ditemukan.']);
        exit();
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit();
}

// Allowed file types
$allowedImage = ['jpg', 'jpeg', 'png', 'webp'];
$allowedVideo = ['mp4', 'mov'];
$allowedExts  = array_merge($allowedImage, $allowedVideo);
$maxImageSize = 10 * 1024 * 1024;  // 10MB
$maxVideoSize = 100 * 1024 * 1024; // 100MB

// Handle multiple file uploads
$files = $_FILES['files'] ?? $_FILES['file'] ?? null;
if (!$files) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tidak ada file yang diupload.']);
    exit();
}

// Normalize to array format
if (!is_array($files['name'])) {
    $files = [
        'name'     => [$files['name']],
        'type'     => [$files['type']],
        'tmp_name' => [$files['tmp_name']],
        'error'    => [$files['error']],
        'size'     => [$files['size']],
    ];
}

// Create upload directory
$uploadDir = __DIR__ . '/../../uploads/social-media/' . $postId;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Get current max sort_order
$sortStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM sm_post_media WHERE post_id = ?');
$sortStmt->execute([$postId]);
$sortOrder = (int)$sortStmt->fetch()['max_order'] + 1;

$uploaded = [];
$errors   = [];

for ($i = 0; $i < count($files['name']); $i++) {
    $name    = $files['name'][$i];
    $tmpName = $files['tmp_name'][$i];
    $error   = $files['error'][$i];
    $size    = $files['size'][$i];

    if ($error !== UPLOAD_ERR_OK) {
        $errors[] = "File '$name' gagal diupload (error code: $error).";
        continue;
    }

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExts)) {
        $errors[] = "File '$name' format tidak didukung. Gunakan: " . implode(', ', $allowedExts);
        continue;
    }

    $isVideo  = in_array($ext, $allowedVideo);
    $maxSize  = $isVideo ? $maxVideoSize : $maxImageSize;

    if ($size > $maxSize) {
        $maxMb = $maxSize / 1024 / 1024;
        $errors[] = "File '$name' terlalu besar. Maksimal {$maxMb}MB.";
        continue;
    }

    // Generate unique filename
    $mediaType   = $isVideo ? 'video' : 'image';
    $uniqueName  = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $name);
    $destination = $uploadDir . '/' . $uniqueName;

    if (!move_uploaded_file($tmpName, $destination)) {
        $errors[] = "File '$name' gagal disimpan.";
        continue;
    }

    // Relative path for DB storage
    $relativePath = 'uploads/social-media/' . $postId . '/' . $uniqueName;

    try {
        $stmt = $pdo->prepare('
            INSERT INTO sm_post_media (post_id, media_url, media_type, original_name, sort_order, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$postId, $relativePath, $mediaType, $name, $sortOrder, $size]);

        $uploaded[] = [
            'id'            => (int)$pdo->lastInsertId(),
            'media_url'     => $relativePath,
            'media_type'    => $mediaType,
            'original_name' => $name,
            'sort_order'    => $sortOrder,
            'file_size'     => $size,
        ];
        $sortOrder++;
    } catch (Throwable $e) {
        // Remove file if DB insert fails
        if (file_exists($destination)) unlink($destination);
        $errors[] = "File '$name' gagal disimpan ke database: " . $e->getMessage();
    }
}

// Auto-detect post_type based on media
if (!empty($uploaded)) {
    $mediaCount = count($uploaded);
    $hasVideo   = false;
    foreach ($uploaded as $m) {
        if ($m['media_type'] === 'video') $hasVideo = true;
    }

    // Count total media for this post
    $totalStmt = $pdo->prepare('SELECT COUNT(*) as total, SUM(media_type = "video") as videos FROM sm_post_media WHERE post_id = ?');
    $totalStmt->execute([$postId]);
    $totals = $totalStmt->fetch();

    $newType = 'image';
    if ((int)$totals['videos'] > 0) {
        $newType = 'video';
    } elseif ((int)$totals['total'] > 1) {
        $newType = 'carousel';
    }

    $pdo->prepare('UPDATE sm_posts SET post_type = ? WHERE id = ?')->execute([$newType, $postId]);
}

$response = ['success' => true, 'uploaded' => $uploaded];
if (!empty($errors)) {
    $response['errors'] = $errors;
}

echo json_encode($response);
