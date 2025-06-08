<?php
session_start();

$servername = "localhost";
$username = "root";
$password = "cams2025";
$dbname = "cams";
$port = "3307";

$conn = new mysqli($servername, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

?>