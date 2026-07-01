<?php
// backend-php/api/social-media/posts.php
// CRUD untuk social media posts

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: List posts ───────────────────────────────────────────
if ($method === 'GET') {
    try {
        $status = $_GET['status'] ?? '';
        $month  = (int)($_GET['month'] ?? 0);
        $year   = (int)($_GET['year'] ?? 0);

        $sql = '
            SELECT p.id, p.caption, p.post_type, p.status, p.scheduled_at,
                   p.published_at, p.error_message, p.created_at, p.updated_at
            FROM sm_posts p
            WHERE p.user_id = ?
        ';
        $params = [$user['id']];

        if ($status) {
            $sql .= ' AND p.status = ?';
            $params[] = $status;
        }

        if ($month && $year) {
            $sql .= ' AND (
                (p.scheduled_at IS NOT NULL AND MONTH(p.scheduled_at) = ? AND YEAR(p.scheduled_at) = ?)
                OR (p.scheduled_at IS NULL AND MONTH(p.created_at) = ? AND YEAR(p.created_at) = ?)
            )';
            $params[] = $month;
            $params[] = $year;
            $params[] = $month;
            $params[] = $year;
        }

        $sql .= ' ORDER BY COALESCE(p.scheduled_at, p.created_at) DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll();

        // Fetch media and targets for each post
        foreach ($posts as &$post) {
            // Media
            $mStmt = $pdo->prepare('SELECT id, media_url, media_type, original_name, sort_order, file_size FROM sm_post_media WHERE post_id = ? ORDER BY sort_order ASC');
            $mStmt->execute([$post['id']]);
            $post['media'] = $mStmt->fetchAll();

            // Targets with account info
            $tStmt = $pdo->prepare('
                SELECT t.id, t.account_id, t.status, t.published_at, t.error_message,
                       a.platform, a.username, a.profile_picture
                FROM sm_post_targets t
                JOIN sm_accounts a ON a.id = t.account_id
                WHERE t.post_id = ?
            ');
            $tStmt->execute([$post['id']]);
            $post['targets'] = $tStmt->fetchAll();
        }

        echo json_encode(['success' => true, 'posts' => $posts]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// ── POST: Create post ─────────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $caption     = trim($body['caption'] ?? '');
    $postType    = trim($body['post_type'] ?? 'image');
    $scheduledAt = trim($body['scheduled_at'] ?? '');
    $accountIds  = $body['account_ids'] ?? [];
    $status      = $scheduledAt ? 'scheduled' : 'draft';

    if (!in_array($postType, ['image', 'carousel', 'video', 'reel'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'post_type tidak valid.']);
        exit();
    }

    try {
        $pdo->beginTransaction();

        // Insert post
        $stmt = $pdo->prepare('
            INSERT INTO sm_posts (user_id, caption, post_type, status, scheduled_at)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $user['id'], $caption, $postType, $status,
            $scheduledAt ?: null
        ]);
        $postId = (int)$pdo->lastInsertId();

        // Insert targets
        if (!empty($accountIds)) {
            $tStmt = $pdo->prepare('INSERT INTO sm_post_targets (post_id, account_id) VALUES (?, ?)');
            foreach ($accountIds as $accId) {
                $tStmt->execute([$postId, (int)$accId]);
            }
        }

        // Insert platform settings if provided
        $platformSettings = $body['platform_settings'] ?? [];
        if (!empty($platformSettings)) {
            $psStmt = $pdo->prepare('
                INSERT INTO sm_post_platform_settings (post_target_id, setting_key, setting_value)
                VALUES (?, ?, ?)
            ');
            foreach ($platformSettings as $targetId => $settings) {
                foreach ($settings as $key => $value) {
                    $psStmt->execute([$targetId, $key, $value]);
                }
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Post berhasil dibuat.', 'id' => $postId]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// ── PUT: Update post ──────────────────────────────────────────
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);

    $postId      = (int)($body['id'] ?? 0);
    $caption     = $body['caption'] ?? null;
    $postType    = $body['post_type'] ?? null;
    $scheduledAt = $body['scheduled_at'] ?? null;
    $status      = $body['status'] ?? null;
    $accountIds  = $body['account_ids'] ?? null;

    if (!$postId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID post diperlukan.']);
        exit();
    }

    try {
        // Verify ownership
        $check = $pdo->prepare('SELECT id, status FROM sm_posts WHERE id = ? AND user_id = ?');
        $check->execute([$postId, $user['id']]);
        $existing = $check->fetch();

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Post tidak ditemukan.']);
            exit();
        }

        $pdo->beginTransaction();

        // Build dynamic update
        $updates = [];
        $params  = [];

        if ($caption !== null)     { $updates[] = 'caption = ?';      $params[] = $caption; }
        if ($postType !== null)    { $updates[] = 'post_type = ?';    $params[] = $postType; }
        if ($scheduledAt !== null) {
            $updates[] = 'scheduled_at = ?';
            $params[]  = $scheduledAt ?: null;
            if ($scheduledAt && $existing['status'] === 'draft') {
                $updates[] = 'status = ?';
                $params[]  = 'scheduled';
            }
        }
        if ($status !== null)      { $updates[] = 'status = ?';       $params[] = $status; }

        if (!empty($updates)) {
            $params[] = $postId;
            $sql = 'UPDATE sm_posts SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Update targets if provided
        if ($accountIds !== null) {
            // Remove old targets
            $pdo->prepare('DELETE FROM sm_post_targets WHERE post_id = ?')->execute([$postId]);
            // Insert new
            $tStmt = $pdo->prepare('INSERT INTO sm_post_targets (post_id, account_id) VALUES (?, ?)');
            foreach ($accountIds as $accId) {
                $tStmt->execute([$postId, (int)$accId]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Post berhasil diperbarui.']);
    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// ── DELETE: Hapus post ────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Parameter id diperlukan.']);
        exit();
    }

    try {
        // Get media files to delete
        $mStmt = $pdo->prepare('
            SELECT m.media_url FROM sm_post_media m
            JOIN sm_posts p ON p.id = m.post_id
            WHERE m.post_id = ? AND p.user_id = ?
        ');
        $mStmt->execute([$id, $user['id']]);
        $mediaFiles = $mStmt->fetchAll();

        // Delete post (cascades to media, targets, etc.)
        $stmt = $pdo->prepare('DELETE FROM sm_posts WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Post tidak ditemukan.']);
            exit();
        }

        // Delete media files from disk
        foreach ($mediaFiles as $mf) {
            $filePath = __DIR__ . '/../../' . $mf['media_url'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Post berhasil dihapus.']);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
