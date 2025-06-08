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

    $courseName = isset($data['courseName']) ? $data['courseName'] : '';
    $courseCode = isset($data['courseCode']) ? $data['courseCode'] : '';
    $courseYear = isset($data['courseYear']) ? $data['courseYear'] : '';
    $courseTerm = isset($data['courseTerm']) ? $data['courseTerm'] : '';
    $courseDesc = isset($data['courseDesc']) ? $data['courseDesc'] : '';

    if (empty($courseName) || empty($courseCode) || empty($courseYear) || empty($courseTerm)) {
        echo json_encode(['error' => 'Missing required fields']);
        http_response_code(400);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO course (course_name, course_code, course_year, course_term, course_desc) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $courseName, $courseCode, $courseYear, $courseTerm, $courseDesc);

    if ($stmt->execute()) {
        logAction($conn, $_SESSION['user_id'], 'Add Course', "Added course: $courseName ($courseCode)");
        echo json_encode(['success' => 'Course added successfully']);
        http_response_code(201);
    } else {
        echo json_encode(['error' => 'Error adding course']);
        http_response_code(500);
    }

    $stmt->close();
} else {
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
}

$conn->close();

?>