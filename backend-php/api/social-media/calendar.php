<?php
// backend-php/api/social-media/calendar.php
// Get posts grouped by date for calendar view

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

$month = (int)($_GET['month'] ?? date('n'));
$year  = (int)($_GET['year'] ?? date('Y'));

try {
    $stmt = $pdo->prepare("
        SELECT p.id, p.caption, p.post_type, p.status, p.scheduled_at, p.published_at, p.created_at,
               DATE(COALESCE(p.scheduled_at, p.created_at)) as post_date
        FROM sm_posts p
        WHERE p.user_id = ?
          AND (
            (p.scheduled_at IS NOT NULL AND MONTH(p.scheduled_at) = ? AND YEAR(p.scheduled_at) = ?)
            OR (p.scheduled_at IS NULL AND MONTH(p.created_at) = ? AND YEAR(p.created_at) = ?)
          )
        ORDER BY COALESCE(p.scheduled_at, p.created_at) ASC
    ");
    $stmt->execute([$user['id'], $month, $year, $month, $year]);
    $posts = $stmt->fetchAll();

    // Attach first media thumbnail per post
    foreach ($posts as &$post) {
        $mStmt = $pdo->prepare('SELECT media_url, media_type FROM sm_post_media WHERE post_id = ? ORDER BY sort_order ASC LIMIT 1');
        $mStmt->execute([$post['id']]);
        $post['thumbnail'] = $mStmt->fetch() ?: null;

        // Target count
        $tStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM sm_post_targets WHERE post_id = ?');
        $tStmt->execute([$post['id']]);
        $post['target_count'] = (int)$tStmt->fetch()['cnt'];
    }

    // Group by date
    $grouped = [];
    foreach ($posts as $post) {
        $date = $post['post_date'];
        if (!isset($grouped[$date])) $grouped[$date] = [];
        $grouped[$date][] = $post;
    }

    echo json_encode([
        'success' => true,
        'month'   => $month,
        'year'    => $year,
        'posts'   => $grouped,
        'total'   => count($posts)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
