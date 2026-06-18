<?php
// backend-php/api/forms/test-create.php
// Diagnostic: cek step by step apa yang gagal di create.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

$result = ['steps' => [], 'errors' => []];

// Capture PHP fatal errors
register_shutdown_function(function() use (&$result) {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $result['fatal_error'] = $error['message'] . ' in ' . $error['file'] . ':' . $error['line'];
        echo json_encode($result, JSON_PRETTY_PRINT);
    }
});

// Step 1: database.php
try {
    require_once __DIR__ . '/../../config/database.php';
    $result['steps'][] = "✅ config/database.php loaded";
} catch (Throwable $e) {
    $result['errors'][] = "❌ database.php: " . $e->getMessage();
    echo json_encode($result); exit();
}

// Step 2: jwt.php
try {
    require_once __DIR__ . '/../../helpers/jwt.php';
    $result['steps'][] = "✅ helpers/jwt.php loaded";
} catch (Throwable $e) {
    $result['errors'][] = "❌ jwt.php: " . $e->getMessage();
    echo json_encode($result); exit();
}

// Step 3: middleware/auth.php
try {
    require_once __DIR__ . '/../../middleware/auth.php';
    $result['steps'][] = "✅ middleware/auth.php loaded";
} catch (Throwable $e) {
    $result['errors'][] = "❌ auth.php: " . $e->getMessage();
    echo json_encode($result); exit();
}

// Step 4: DB Connection
try {
    $pdo = getDB();
    $result['steps'][] = "✅ Database connected";
} catch (Throwable $e) {
    $result['errors'][] = "❌ getDB(): " . $e->getMessage();
    echo json_encode($result); exit();
}

// Step 5: Check tables exist
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $result['all_tables'] = $tables;
    $result['has_form_structures']    = in_array('form_structures', $tables);
    $result['has_form_configurations'] = in_array('form_configurations', $tables);
    $result['has_form_submissions']    = in_array('form_submissions', $tables);
    $result['has_users_legal']         = in_array('users_legal', $tables);

    if (in_array('form_structures', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM form_structures")->fetchColumn();
        $result['form_structures_count'] = $count;
        $result['steps'][] = "✅ form_structures exists ($count rows)";
    } else {
        $result['errors'][] = "❌ TABLE form_structures TIDAK ADA → Jalankan setup.php!";
    }

    if (in_array('form_configurations', $tables)) {
        $result['steps'][] = "✅ form_configurations exists";
    } else {
        $result['errors'][] = "❌ TABLE form_configurations TIDAK ADA → Jalankan setup.php!";
    }
} catch (Throwable $e) {
    $result['errors'][] = "❌ SHOW TABLES: " . $e->getMessage();
}

// Step 6: Check Authorization header
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? '';
}
$result['auth_header_present'] = !empty($authHeader);
$result['auth_header_preview']  = $authHeader ? substr($authHeader, 0, 25) . '...' : 'MISSING';

if (!$authHeader) {
    $result['errors'][] = "❌ Authorization header tidak ada → cek proxy/frontend";
    $result['steps'][]  = "⚠️  Token tidak diterima PHP (umum di CGI hosting)";
} else {
    // Try decode JWT
    try {
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = jwtDecode($token);
        $result['steps'][] = "✅ JWT valid: role=" . ($decoded['role'] ?? 'unknown');
        $result['jwt_payload'] = $decoded;
    } catch (Throwable $e) {
        $result['errors'][] = "❌ JWT decode: " . $e->getMessage();
    }
}

$result['status'] = empty($result['errors']) ? 'ALL OK — create.php seharusnya berjalan' : 'Ada masalah';
echo json_encode($result, JSON_PRETTY_PRINT);
