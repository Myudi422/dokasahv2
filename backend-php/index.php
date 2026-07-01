<?php
// backend-php/index.php
// Root entry point - prevents Apache 403 error

require_once __DIR__ . '/config/cors.php';
setCorsHeaders();

echo json_encode([
    'status'  => 'ok',
    'service' => 'Dokasah API',
    'version' => '1.0.0',
    'endpoints' => [
        'login'         => '/api/auth/login.php',
        'me'            => '/api/auth/me.php',
        'forms_create'  => '/api/forms/create.php',
        'forms_list'    => '/api/forms/list.php',
        'forms_detail'  => '/api/forms/detail.php',
        'forms_draft'   => '/api/forms/draft.php',
        'forms_submit'  => '/api/forms/submit.php',
        'forms_status'  => '/api/forms/status.php',
        'forms_delete'  => '/api/forms/delete.php',
        'dashboard'     => '/api/dashboard/stats.php',
        'upload'        => '/api/upload/index.php',
        'setup'         => '/setup-admin.php',
        'sm_accounts'   => '/api/social-media/accounts.php',
        'sm_posts'      => '/api/social-media/posts.php',
        'sm_calendar'   => '/api/social-media/calendar.php',
        'sm_post_detail'=> '/api/social-media/post-detail.php',
        'sm_media_upload'  => '/api/social-media/media-upload.php',
        'sm_media_delete'  => '/api/social-media/media-delete.php',
        'sm_oauth_url'     => '/api/social-media/oauth-url.php',
        'sm_oauth_callback'=> '/api/social-media/oauth-callback.php',
    ]
]);
