<?php
// backend-php/config/social-media.php
// Configuration for Facebook/Instagram and TikTok OAuth

define('FB_APP_ID', '1563659408483185');
define('FB_APP_SECRET', '8f507f573f7c6ce83e23b92d22e42942');
define('FB_REDIRECT_URI', 'http://localhost:3000/dashboard/social-accounts'); // Or production URL
define('FB_CONFIG_ID', '874991050683132'); // Required for Facebook Login for Business

define('TIKTOK_CLIENT_KEY', 'YOUR_TIKTOK_CLIENT_KEY');
define('TIKTOK_CLIENT_SECRET', 'YOUR_TIKTOK_CLIENT_SECRET');
define('TIKTOK_REDIRECT_URI', 'http://localhost:3000/dashboard/social-accounts'); // Or production URL
