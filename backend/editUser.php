<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['idNumber'];
$firstName = $data['firstName'];
$middleName = $data['middleName'];
$lastName = $data['lastName'];
$email = $data['email'];
$birthdate = $data['birthdate'];
$role = $data['role'];

if (!$id || !$firstName || !$lastName || !$email || !$birthdate) {
    echo json_encode(["error" => "Missing fields"]);
    exit();
}

$stmt = $conn->prepare("UPDATE user SET user_firstname=?, user_middlename=?, user_lastname=?, user_email=?, user_birthdate=?, user_role=? WHERE user_id=?");
$stmt->bind_param("sssssss", $firstName, $middleName, $lastName, $email, $birthdate, $role, $id);

if ($stmt->execute()) {
    logAction($conn, $_SESSION['user_id'], 'Updated User', "Updated user: $firstName $middleName $lastName ($id)");
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Failed to update user"]);
}

$stmt->close();
$conn->close();
?>
