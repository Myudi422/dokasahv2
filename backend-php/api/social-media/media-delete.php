<?php
// backend-php/api/social-media/media-delete.php
require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$mediaId = (int)($_GET['id'] ?? 0);
if (!$mediaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter id diperlukan.']);
    exit();
}

try {
    $stmt = $pdo->prepare('
        SELECT m.id, m.media_url, m.post_id FROM sm_post_media m
        JOIN sm_posts p ON p.id = m.post_id WHERE m.id = ? AND p.user_id = ?
    ');
    $stmt->execute([$mediaId, $user['id']]);
    $media = $stmt->fetch();

    if (!$media) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Media tidak ditemukan.']);
        exit();
    }

    $filePath = __DIR__ . '/../../' . $media['media_url'];
    if (file_exists($filePath)) unlink($filePath);

    $pdo->prepare('DELETE FROM sm_post_media WHERE id = ?')->execute([$mediaId]);

    // Reorder & update post_type
    $reorder = $pdo->prepare('SELECT id FROM sm_post_media WHERE post_id = ? ORDER BY sort_order ASC');
    $reorder->execute([$media['post_id']]);
    $upd = $pdo->prepare('UPDATE sm_post_media SET sort_order = ? WHERE id = ?');
    foreach ($reorder->fetchAll() as $idx => $row) $upd->execute([$idx, $row['id']]);

    $ts = $pdo->prepare('SELECT COUNT(*) as total, SUM(media_type="video") as videos FROM sm_post_media WHERE post_id = ?');
    $ts->execute([$media['post_id']]);
    $t = $ts->fetch();
    $newType = ((int)$t['videos'] > 0) ? 'video' : (((int)$t['total'] > 1) ? 'carousel' : 'image');
    $pdo->prepare('UPDATE sm_posts SET post_type = ? WHERE id = ?')->execute([$newType, $media['post_id']]);

    echo json_encode(['success' => true, 'message' => 'Media berhasil dihapus.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
