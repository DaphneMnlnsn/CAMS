<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "loggedIn" => true,
        "user_id" => $_SESSION['user_id'],
        "user_firstname" => $_SESSION['user_firstname'],
        "user_lastname" => $_SESSION['user_lastname'],
        "user_email" => $_SESSION['email'],
        "user_role" => $_SESSION['user_role']
    ]);
} else {
    echo json_encode(["loggedIn" => false]);
}