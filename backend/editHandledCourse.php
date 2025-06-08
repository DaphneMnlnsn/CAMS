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
$courseTime = $data['courseTime'];
$courseRoom = $data['courseRoom'];
$courseDays = $data['courseDays'];

$sectionSchedule = implode(', ', $courseDays) . ' : ' . $courseTime;

$stmt = $conn->prepare("UPDATE course_assignment SET section_schedule=?, section_room=? WHERE courseassign_id=?");
$stmt->bind_param("sss", $sectionSchedule, $courseRoom, $id);

if ($stmt->execute()) {
    logAction($conn, $_SESSION['user_id'], 'Update Handled Course', "Updated course: $id");
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Failed to update handled course"]);
}

$stmt->close();
$conn->close();
?>
