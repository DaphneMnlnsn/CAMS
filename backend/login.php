<?php

$allowed_origins = [
    "http://localhost:3000",
    "http://192.168.254.116",
    "http://192.168.25.2",
    "http://192.168.152.2"
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

$sql = "";

if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $data = json_decode(file_get_contents("php://input"), true);
    $emailOrId = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');
} else {
    $emailOrId = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
}

$sql = "SELECT * FROM user WHERE (user_email = ? OR user_id = ?) AND archived = 0";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $emailOrId, $emailOrId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['user_password'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_firstname'] = $user['user_firstname'];
        $_SESSION['user_lastname'] = $user['user_lastname'];
        $_SESSION['email'] = $user['user_email'];
        $_SESSION['user_role'] = $user['user_role'];

        logAction($conn, $_SESSION['user_id'], 'Log In', "Logged in");

        echo json_encode([
            "message" => "Success",
            "student_id" => $_SESSION['user_id'],
            "role" => $user['user_role']
        ]);
    } else {
        echo json_encode(["message" => "Failed"]);
    }
} else {
    echo json_encode(["message" => "Failed"]);
}

$stmt->close();
$conn->close();
?>