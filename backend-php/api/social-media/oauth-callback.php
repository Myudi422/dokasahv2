<?php
// backend-php/api/social-media/oauth-callback.php
// Menangani pertukaran code dengan access token dari platform sosial media

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/social-media.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true);
$code = trim($body['code'] ?? '');
$platform = trim($body['platform'] ?? '');

if (!$code || !$platform) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'code dan platform wajib diisi.']);
    exit();
}

if ($platform === 'instagram') {
    try {
        // Step 1: Exchange code for Facebook User Access Token
        $tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token?' . http_build_query([
            'client_id' => FB_APP_ID,
            'client_secret' => FB_APP_SECRET,
            'redirect_uri' => FB_REDIRECT_URI,
            'code' => $code
        ]);

        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $tokenData = json_decode($res, true);
        if ($httpCode !== 200 || !isset($tokenData['access_token'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Gagal menukar code dengan FB access token: ' . ($tokenData['error']['message'] ?? 'Unknown error')]);
            exit();
        }

        $userAccessToken = $tokenData['access_token'];

        // Step 2: Exchange for Long-lived Access Token (lasts ~60 days)
        $longLivedUrl = 'https://graph.facebook.com/v18.0/oauth/access_token?' . http_build_query([
            'grant_type' => 'fb_exchange_token',
            'client_id' => FB_APP_ID,
            'client_secret' => FB_APP_SECRET,
            'fb_exchange_token' => $userAccessToken
        ]);

        $ch = curl_init($longLivedUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $longLivedData = json_decode($res, true);
        if ($httpCode === 200 && isset($longLivedData['access_token'])) {
            $userAccessToken = $longLivedData['access_token'];
        }

        // Step 3: Get Connected Instagram Business Accounts
        // A. List Facebook pages connected to the user
        $pagesUrl = 'https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account,name,access_token&access_token=' . $userAccessToken;
        $ch = curl_init($pagesUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        curl_close($ch);
        $pagesData = json_decode($res, true);

        $connectedAccounts = [];
        if (isset($pagesData['data'])) {
            foreach ($pagesData['data'] as $page) {
                if (isset($page['instagram_business_account']['id'])) {
                    $igAccountId = $page['instagram_business_account']['id'];
                    $pageAccessToken = $page['access_token']; // Page token is needed sometimes or user token can publish

                    // B. Fetch detailed info of Instagram business account
                    $igUserUrl = "https://graph.facebook.com/v18.0/{$igAccountId}?fields=username,name,profile_picture_url&access_token={$userAccessToken}";
                    $ch = curl_init($igUserUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    $igRes = curl_exec($ch);
                    curl_close($ch);
                    $igUserData = json_decode($igRes, true);

                    if (isset($igUserData['username'])) {
                        // Store / Update in DB
                        $connectedAccounts[] = [
                            'platform_user_id' => $igAccountId,
                            'username' => $igUserData['username'],
                            'display_name' => $igUserData['name'] ?? null,
                            'profile_picture' => $igUserData['profile_picture_url'] ?? null,
                            'access_token' => $userAccessToken, // User access token is standard for Content Publish API
                            'token_expires_at' => date('Y-m-d H:i:s', time() + 60 * 24 * 60 * 60) // approx 60 days
                        ];
                    }
                }
            }
        }

        if (empty($connectedAccounts)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Tidak ditemukan akun Instagram Professional yang terhubung ke Facebook Page Anda. Pastikan akun Instagram Anda sudah bertipe Professional (Business/Creator) dan terhubung dengan Facebook Page.',
                'debug_info' => [
                    'pages_received' => $pagesData,
                    'token_preview' => substr($userAccessToken, 0, 15) . '...'
                ]
            ]);
            exit();
        }

        // Save first connected account to database
        $acc = $connectedAccounts[0];
        $check = $pdo->prepare('SELECT id FROM sm_accounts WHERE user_id = ? AND platform = "instagram" AND platform_user_id = ?');
        $check->execute([$user['id'], $acc['platform_user_id']]);
        $existing = $check->fetch();

        if ($existing) {
            $stmt = $pdo->prepare('
                UPDATE sm_accounts SET
                    username = ?, display_name = ?, profile_picture = ?,
                    access_token = ?, token_expires_at = ?, is_active = 1
                WHERE id = ?
            ');
            $stmt->execute([
                $acc['username'], $acc['display_name'], $acc['profile_picture'],
                $acc['access_token'], $acc['token_expires_at'], $existing['id']
            ]);
            $accId = (int)$existing['id'];
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO sm_accounts (user_id, platform, platform_user_id, username, display_name, profile_picture, access_token, token_expires_at)
                VALUES (?, "instagram", ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $user['id'], $acc['platform_user_id'], $acc['username'],
                $acc['display_name'], $acc['profile_picture'], $acc['access_token'],
                $acc['token_expires_at']
            ]);
            $accId = (int)$pdo->lastInsertId();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Akun Instagram berhasil terhubung!',
            'account' => [
                'id' => $accId,
                'username' => $acc['username'],
                'platform' => 'instagram'
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error: ' . $e->getMessage()]);
    }
} else if ($platform === 'tiktok') {
    try {
        // Exchange code for TikTok access token
        $ch = curl_init('https://open.tiktokapis.com/v2/oauth/token/');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'client_key' => TIKTOK_CLIENT_KEY,
            'client_secret' => TIKTOK_CLIENT_SECRET,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => TIKTOK_REDIRECT_URI
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $tokenData = json_decode($res, true);
        if ($httpCode !== 200 || !isset($tokenData['access_token'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Gagal menukar code dengan TikTok access token: ' . ($tokenData['error_description'] ?? 'Unknown error')]);
            exit();
        }

        $accessToken = $tokenData['access_token'];
        $refreshToken = $tokenData['refresh_token'] ?? null;
        $expiresIn = $tokenData['expires_in'] ?? 86400; // default 24h
        $openId = $tokenData['open_id'] ?? '';

        // Fetch TikTok User Info
        $ch = curl_init('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}"
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        $userData = json_decode($res, true);

        if (!isset($userData['data']['user']['username'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Gagal mengambil informasi profil dari TikTok API.']);
            exit();
        }

        $userInfo = $userData['data']['user'];
        $username = $userInfo['username'];
        $displayName = $userInfo['display_name'] ?? null;
        $avatarUrl = $userInfo['avatar_url'] ?? null;

        // Save / Update in DB
        $check = $pdo->prepare('SELECT id FROM sm_accounts WHERE user_id = ? AND platform = "tiktok" AND platform_user_id = ?');
        $check->execute([$user['id'], $openId]);
        $existing = $check->fetch();

        $expiresAt = date('Y-m-d H:i:s', time() + $expiresIn);

        if ($existing) {
            $stmt = $pdo->prepare('
                UPDATE sm_accounts SET
                    username = ?, display_name = ?, profile_picture = ?,
                    access_token = ?, refresh_token = ?, token_expires_at = ?, is_active = 1
                WHERE id = ?
            ');
            $stmt->execute([
                $username, $displayName, $avatarUrl,
                $accessToken, $refreshToken, $expiresAt, $existing['id']
            ]);
            $accId = (int)$existing['id'];
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO sm_accounts (user_id, platform, platform_user_id, username, display_name, profile_picture, access_token, refresh_token, token_expires_at)
                VALUES (?, "tiktok", ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $user['id'], $openId, $username,
                $displayName, $avatarUrl, $accessToken, $refreshToken, $expiresAt
            ]);
            $accId = (int)$pdo->lastInsertId();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Akun TikTok berhasil terhubung!',
            'account' => [
                'id' => $accId,
                'username' => $username,
                'platform' => 'tiktok'
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error: ' . $e->getMessage()]);
    }
}
