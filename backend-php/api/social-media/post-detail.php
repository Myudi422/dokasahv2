<?php
// backend-php/api/social-media/post-detail.php
// Get full detail of a single post

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$postId = (int)($_GET['id'] ?? 0);
if (!$postId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter id diperlukan.']);
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT * FROM sm_posts WHERE id = ? AND user_id = ?');
    $stmt->execute([$postId, $user['id']]);
    $post = $stmt->fetch();

    if (!$post) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Post tidak ditemukan.']);
        exit();
    }

    // Media
    $mStmt = $pdo->prepare('SELECT * FROM sm_post_media WHERE post_id = ? ORDER BY sort_order ASC');
    $mStmt->execute([$postId]);
    $post['media'] = $mStmt->fetchAll();

    // Targets with account info
    $tStmt = $pdo->prepare('
        SELECT t.*, a.platform, a.username, a.display_name, a.profile_picture
        FROM sm_post_targets t
        JOIN sm_accounts a ON a.id = t.account_id
        WHERE t.post_id = ?
    ');
    $tStmt->execute([$postId]);
    $targets = $tStmt->fetchAll();

    // Platform settings per target
    foreach ($targets as &$target) {
        $psStmt = $pdo->prepare('SELECT setting_key, setting_value FROM sm_post_platform_settings WHERE post_target_id = ?');
        $psStmt->execute([$target['id']]);
        $target['settings'] = [];
        foreach ($psStmt->fetchAll() as $s) {
            $target['settings'][$s['setting_key']] = $s['setting_value'];
        }
    }
    $post['targets'] = $targets;

    echo json_encode(['success' => true, 'post' => $post]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
