<?php
// backend-php/config/database.php

$host    = '163.223.227.37';
$db      = 'iqdyjeaz_papunda';
$user    = 'iqdyjeaz_papunda';
$pass    = 'Cinangka3_';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

function getDB(): PDO {
    global $dsn, $user, $pass, $options;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO($dsn, $user, $pass, $options);
    }
    return $pdo;
}
