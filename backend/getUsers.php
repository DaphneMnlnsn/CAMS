<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';

$courseassign_id = $_GET['courseassign_id'] ?? '';

if ($courseassign_id) {
    $sql = "
        SELECT 
            u.user_id, u.user_firstname, u.user_middlename, u.user_lastname, 
            u.user_email, u.user_birthdate, u.user_role, u.archived,
            sc.courseassign_id
        FROM user u
        LEFT JOIN student_course sc 
            ON u.user_id = sc.student_id AND sc.courseassign_id = ?
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $courseassign_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode($users);
    $stmt->close();
} else {
    $sql = "SELECT * FROM user";
    $result = $conn->query($sql);

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode($users);
}

$conn->close();
?>