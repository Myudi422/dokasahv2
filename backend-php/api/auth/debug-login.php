<?php
// backend-php/api/auth/debug-login.php
// TEMPORARY DEBUG FILE — hapus setelah debug selesai!

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); exit();
}

$debug = [
    'step'   => [],
    'error'  => null,
    'result' => null,
];

// Step 1: Read input
$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($body['email'] ?? $_GET['email'] ?? '');
$password = $body['password'] ?? $_GET['password'] ?? '';

$debug['step'][] = "input_ok: email=$email, pass_len=" . strlen($password);

// Step 2: Include files
try {
    require_once __DIR__ . '/../../config/database.php';
    $debug['step'][] = "database.php included";
} catch (Throwable $e) {
    echo json_encode(['error' => 'database.php failed: ' . $e->getMessage()]); exit();
}

try {
    require_once __DIR__ . '/../../helpers/jwt.php';
    $debug['step'][] = "jwt.php included";
} catch (Throwable $e) {
    echo json_encode(['error' => 'jwt.php failed: ' . $e->getMessage()]); exit();
}

// Step 3: DB connection
try {
    $pdo = getDB();
    $debug['step'][] = "db_connected";
} catch (Throwable $e) {
    echo json_encode(['error' => 'DB connect failed: ' . $e->getMessage(), 'debug' => $debug]); exit();
}

// Step 4: Check if table has password_hash column
try {
    $cols = $pdo->query("SHOW COLUMNS FROM users_legal")->fetchAll(PDO::FETCH_COLUMN);
    $debug['table_columns'] = $cols;
    $debug['has_password_hash_col'] = in_array('password_hash', $cols);
} catch (Throwable $e) {
    $debug['step'][] = "SHOW COLUMNS failed: " . $e->getMessage();
}

// Step 5: Find user
try {
    $stmt = $pdo->prepare('SELECT id, email, name, role, password_hash FROM users_legal WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    $debug['step'][] = $user ? "user_found: role={$user['role']}" : "user_NOT_found";

    if ($user) {
        $debug['user_id']              = $user['id'];
        $debug['user_role']            = $user['role'];
        $debug['password_hash_exists'] = !empty($user['password_hash']);
        $debug['password_hash_prefix'] = !empty($user['password_hash']) ? substr($user['password_hash'], 0, 12) . '...' : null;
        $debug['password_verify']      = !empty($user['password_hash']) ? password_verify($password, $user['password_hash']) : false;
    }
} catch (Throwable $e) {
    $debug['step'][] = "query_failed: " . $e->getMessage();
}

// Step 6: Generate token if login OK
if (!empty($debug['password_verify'])) {
    $token = jwtEncode(['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]);
    $debug['token_generated'] = strlen($token) > 0;
    $debug['token_preview']   = substr($token, 0, 30) . '...';
}

echo json_encode($debug, JSON_PRETTY_PRINT);
