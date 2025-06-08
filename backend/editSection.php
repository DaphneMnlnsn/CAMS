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
$sectionName = $data['sectionName'];
$sectionSemester = $data['sectionSemester'];
$sectionYear = $data['sectionYear'];
$sectionMajor = $data['sectionMajor'];

if (!$sectionName || !$sectionSemester || !$sectionYear || !$sectionMajor) {
    echo json_encode(["error" => "Missing fields"]);
    exit();
}

$stmt = $conn->prepare("UPDATE section SET section_name=?, section_semester=?, section_year=?, section_major=? WHERE section_id=?");
$stmt->bind_param("sssss", $sectionName, $sectionSemester, $sectionYear, $sectionMajor, $id);

if ($stmt->execute()) {
    logAction($conn, $_SESSION['user_id'], 'Update Section', "Updated section: $sectionName ($id)");
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Failed to update section"]);
}

$stmt->close();
$conn->close();
?>
