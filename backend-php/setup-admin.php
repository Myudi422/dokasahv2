<?php
// backend-php/setup-admin.php
// ONE-TIME SETUP SCRIPT — delete after use!
// Access via: http://ccgnimex.my.id/v2/android/dokasah/setup-admin.php
// Protected by a setup key

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';

setCorsHeaders();

// Simple security: require a setup key in query string
$setupKey = $_GET['key'] ?? '';
if ($setupKey !== 'DokasahSetup2024') {
    http_response_code(403);
    echo json_encode(['error' => 'Setup key salah. Tambahkan ?key=DokasahSetup2024 di URL.']);
    exit();
}

$action = $_GET['action'] ?? 'info';

try {
    $pdo = getDB();

    if ($action === 'create-admin') {
        $email    = $_GET['email']    ?? 'admin@dokasah.web.id';
        $password = $_GET['password'] ?? 'Dokasah@Admin2024';
        $name     = $_GET['name']     ?? 'Administrator';

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $stmt = $pdo->prepare(
            "INSERT INTO users_legal (name, email, password_hash, role, created_at, updated_at)
             VALUES (?, ?, ?, 'admin', NOW(), NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin', updated_at = NOW()"
        );
        $stmt->execute([$name, $email, $hash, $hash]);

        echo json_encode([
            'success'  => true,
            'message'  => "Admin berhasil dibuat/diupdate.",
            'email'    => $email,
            'password' => $password,
            'hash'     => $hash,
            'warning'  => 'HAPUS FILE INI SETELAH SETUP!',
        ]);
    } elseif ($action === 'hash-password') {
        $password = $_GET['password'] ?? '';
        if (!$password) {
            echo json_encode(['error' => 'Tambahkan ?action=hash-password&password=YourPassword']);
            exit();
        }
        echo json_encode([
            'password' => $password,
            'hash'     => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
        ]);
    } elseif ($action === 'test-db') {
        $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM users_legal');
        $row  = $stmt->fetch();
        echo json_encode(['success' => true, 'users_count' => $row['cnt'], 'message' => 'Database connected!']);
    } else {
        echo json_encode([
            'actions' => [
                'test-db'       => '?key=DokasahSetup2024&action=test-db',
                'create-admin'  => '?key=DokasahSetup2024&action=create-admin&email=admin@dokasah.web.id&password=YourPassword&name=Administrator',
                'hash-password' => '?key=DokasahSetup2024&action=hash-password&password=YourPassword',
            ],
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
