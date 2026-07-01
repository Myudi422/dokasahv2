<?php
// backend-php/config/database.php

$db_host    = 'localhost';
$db_name    = 'legalpil_papunda';
$db_user    = 'legalpil_cvk39437';
$db_pass    = 'c3^([jMyJIT0pvy7';
$db_charset = 'utf8mb4';

$dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

function getDB(): PDO {
    global $dsn, $db_user, $db_pass, $options;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    }
    return $pdo;
}
