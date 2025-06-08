<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $idNumber = isset($data['idNumber']) ? $data['idNumber'] : '';
    $firstName = isset($data['firstName']) ? $data['firstName'] : '';
    $middleName = isset($data['middleName']) ? $data['middleName'] : '';
    $lastName = isset($data['lastName']) ? $data['lastName'] : '';
    $email = isset($data['email']) ? $data['email'] : '';
    $birthdate = isset($data['birthdate']) ? $data['birthdate'] : '';
    $role = isset($data['role']) ? $data['role'] : 'Student';

    if (empty($idNumber) || empty($firstName) || empty($lastName) || empty($email) || empty($birthdate)) {
        echo json_encode(['error' => 'Missing required fields']);
        http_response_code(400);
        exit();
    }

    $birthYear = substr($birthdate, 0, 4);
    $birthMonth = substr($birthdate, 5, 2);
    $birthDay = substr($birthdate, 8, 2);
    $cleanLastName = str_replace(' ', '', $lastName);
    $rawPassword='';

    if($data['role'] == 'Instructor'){
        $last6Digits = substr($data['idNumber'], -6);
        $rawPassword = $cleanLastName . $last6Digits . $birthYear . $birthMonth . $birthDay;
    }
    else{
        $rawPassword = $cleanLastName . $birthYear . $birthMonth . $birthDay;
    }
    $password = password_hash($rawPassword, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO user (user_id, user_firstname, user_middlename, user_lastname, user_email, user_role, user_password, user_birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $idNumber, $firstName, $middleName, $lastName, $email, $role, $password, $birthdate);

    if ($stmt->execute()) {
        logAction($conn, $_SESSION['user_id'], 'Add User', "Added user: $firstName $middleName $lastName ($idNumber)");
        echo json_encode(['success' => 'User added successfully']);
        http_response_code(201);
    } else {
        echo json_encode(['error' => 'Error adding user']);
        http_response_code(500);
    }

    $stmt->close();
} else {
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
}

$conn->close();

?>