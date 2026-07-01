<?php
// backend-php/api/social-media/oauth-url.php
// Mendapatkan URL OAuth untuk Instagram (Facebook) dan TikTok

require_once __DIR__ . '/../../config/cors.php';
setCorsHeaders();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/social-media.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$platform = $_GET['platform'] ?? '';
if (!in_array($platform, ['instagram', 'tiktok'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Platform harus instagram atau tiktok.']);
    exit();
}

$state = json_encode([
    'user_id' => $user['id'],
    'platform' => $platform,
    'random' => bin2hex(random_bytes(8))
]);
$stateEncoded = base64_encode($state);

if ($platform === 'instagram') {
    // Check if FB_CONFIG_ID is configured
    if (defined('FB_CONFIG_ID') && FB_CONFIG_ID && FB_CONFIG_ID !== 'YOUR_FB_CONFIG_ID') {
        // Facebook Login for Business flow
        $url = 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query([
            'client_id' => FB_APP_ID,
            'redirect_uri' => FB_REDIRECT_URI,
            'state' => $stateEncoded,
            'config_id' => FB_CONFIG_ID,
            'response_type' => 'code',
            'override_default_response_type' => 'true'
        ]);
    } else {
        // Classic Facebook Login flow (fallback)
        $scopes = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_show_list'];
        $url = 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query([
            'client_id' => FB_APP_ID,
            'redirect_uri' => FB_REDIRECT_URI,
            'state' => $stateEncoded,
            'scope' => implode(',', $scopes),
            'response_type' => 'code'
        ]);
    }
} else {
    // URL TikTok Login Kit
    $scopes = ['user.info.basic', 'video.publish'];
    $url = 'https://www.tiktok.com/v2/auth/authorize/?' . http_build_query([
        'client_key' => TIKTOK_CLIENT_KEY,
        'scope' => implode(',', $scopes),
        'response_type' => 'code',
        'redirect_uri' => TIKTOK_REDIRECT_URI,
        'state' => $stateEncoded
    ]);
}

echo json_encode([
    'success' => true,
    'url' => $url
]);
