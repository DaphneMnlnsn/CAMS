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

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['idNumber'];
$courseName = $data['courseName'];
$courseCode = $data['courseCode'];
$courseYear = $data['courseYear'];
$courseTerm = $data['courseTerm'];
$courseDesc = $data['courseDesc'];

if (!$courseName || !$courseCode || !$courseYear || !$courseTerm) {
    echo json_encode(["error" => "Missing fields"]);
    exit();
}

$stmt = $conn->prepare("UPDATE course SET course_name=?, course_code=?, course_year=?, course_term=?, course_desc=? WHERE course_id=?");
$stmt->bind_param("ssssss", $courseName, $courseCode, $courseYear, $courseTerm, $courseDesc, $id);

if ($stmt->execute()) {
    logAction($conn, $_SESSION['user_id'], 'Update Course', "Updated course: $courseName ($courseCode)");
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Failed to update course"]);
}

$stmt->close();
$conn->close();
?>
