<?php

$allowed_origins = [
    "http://localhost:3000",
    "http://192.168.254.116",
    "http://10.200.24.51",
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

$rawPassword = 'Ho26784220010206';
$newPass = password_hash($rawPassword, PASSWORD_DEFAULT);

echo $newPass;