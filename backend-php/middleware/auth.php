<?php
// backend-php/middleware/auth.php

require_once __DIR__ . '/../helpers/jwt.php';

/**
 * Validate Authorization header and return user payload.
 * Sends 401 and exits if token is missing or invalid.
 */
function requireAuth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? '';
    }

    if (!str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token tidak ditemukan. Silakan login.']);
        exit();
    }

    $token = substr($authHeader, 7);
    $payload = jwtDecode($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token tidak valid atau sudah kedaluwarsa.']);
        exit();
    }

    return $payload;
}

/**
 * Validate and require admin role.
 */
function requireAdmin(): array {
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya admin yang diizinkan.']);
        exit();
    }
    return $user;
}

/**
 * Optionally get user from token (returns null if no/invalid token).
 */
function optionalAuth(): ?array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? '';
    }

    if (!str_starts_with($authHeader, 'Bearer ')) return null;

    $token = substr($authHeader, 7);
    return jwtDecode($token);
}
