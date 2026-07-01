<?php
// backend-php/api/social-media/accounts.php
// CRUD untuk akun sosial media terkoneksi

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: List semua akun user ─────────────────────────────────
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare('
            SELECT id, platform, platform_user_id, username, display_name,
                   profile_picture, is_active, connected_at, updated_at,
                   token_expires_at,
                   CASE
                     WHEN token_expires_at IS NULL THEN "active"
                     WHEN token_expires_at > NOW() THEN "active"
                     ELSE "expired"
                   END AS token_status
            FROM sm_accounts
            WHERE user_id = ?
            ORDER BY platform ASC, connected_at DESC
        ');
        $stmt->execute([$user['id']]);
        $accounts = $stmt->fetchAll();

        echo json_encode(['success' => true, 'accounts' => $accounts]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// ── POST: Tambah akun baru ────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $platform        = trim($body['platform'] ?? '');
    $platformUserId  = trim($body['platform_user_id'] ?? '');
    $username        = trim($body['username'] ?? '');
    $displayName     = trim($body['display_name'] ?? '');
    $profilePicture  = trim($body['profile_picture'] ?? '');
    $accessToken     = trim($body['access_token'] ?? '');
    $refreshToken    = trim($body['refresh_token'] ?? '');
    $tokenExpiresAt  = trim($body['token_expires_at'] ?? '');

    if (!$platform || !$platformUserId || !$username || !$accessToken) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'platform, platform_user_id, username, dan access_token wajib diisi.']);
        exit();
    }

    if (!in_array($platform, ['instagram', 'tiktok'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Platform harus instagram atau tiktok.']);
        exit();
    }

    try {
        // Check if account already exists
        $check = $pdo->prepare('SELECT id FROM sm_accounts WHERE user_id = ? AND platform = ? AND platform_user_id = ?');
        $check->execute([$user['id'], $platform, $platformUserId]);
        $existing = $check->fetch();

        if ($existing) {
            // Update existing
            $stmt = $pdo->prepare('
                UPDATE sm_accounts SET
                    username = ?, display_name = ?, profile_picture = ?,
                    access_token = ?, refresh_token = ?,
                    token_expires_at = ?, is_active = 1
                WHERE id = ?
            ');
            $stmt->execute([
                $username, $displayName, $profilePicture,
                $accessToken, $refreshToken ?: null,
                $tokenExpiresAt ?: null, $existing['id']
            ]);
            echo json_encode(['success' => true, 'message' => 'Akun berhasil diperbarui.', 'id' => (int)$existing['id']]);
        } else {
            // Insert new
            $stmt = $pdo->prepare('
                INSERT INTO sm_accounts (user_id, platform, platform_user_id, username, display_name, profile_picture, access_token, refresh_token, token_expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $user['id'], $platform, $platformUserId,
                $username, $displayName, $profilePicture,
                $accessToken, $refreshToken ?: null,
                $tokenExpiresAt ?: null
            ]);
            echo json_encode(['success' => true, 'message' => 'Akun berhasil ditambahkan.', 'id' => (int)$pdo->lastInsertId()]);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// ── DELETE: Disconnect akun ───────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Parameter id diperlukan.']);
        exit();
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM sm_accounts WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan.']);
        } else {
            echo json_encode(['success' => true, 'message' => 'Akun berhasil dihapus.']);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
