<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = [
    'success' => false,
    'deleted' => 0,
    'message' => ''
];

date_default_timezone_set('Asia/Manila');
$now = date('Y-m-d H:i:s');

$sql = "SELECT qrsession_id, qr_image, courseassign_id, date_created FROM qrcode_session WHERE expiration_time < ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $now);
$stmt->execute();
$result = $stmt->get_result();

$deletedCount = 0;

while ($row = $result->fetch_assoc()) {
    $qrsessionId = $row['qrsession_id'];
    $imagePath = $row['qr_image'];
    $courseAssignId = $row['courseassign_id'];
    $sessionDate = $row['date_created'];

    $studentsStmt = $conn->prepare("SELECT student_id FROM student_course WHERE courseassign_id = ?");
    $studentsStmt->bind_param("i", $courseAssignId);
    $studentsStmt->execute();
    $studentsResult = $studentsStmt->get_result();

    while ($studentRow = $studentsResult->fetch_assoc()) {
        $studentId = $studentRow['student_id'];

        $checkStmt = $conn->prepare("SELECT attendance_id FROM attendance WHERE student_id = ? AND courseassign_id = ? AND DATE(session_date) = DATE(?)");
        $checkStmt->bind_param("iis", $studentId, $courseAssignId, $sessionDate);
        $checkStmt->execute();
        $checkStmt->store_result();

        if ($checkStmt->num_rows === 0) {
            $insertStmt = $conn->prepare("INSERT INTO attendance (student_id, courseassign_id, session_date, attendance_status, marked_on) VALUES (?, ?, ?, 'Absent', NOW())");
            $insertStmt->bind_param("iis", $studentId, $courseAssignId, $sessionDate);
            $insertStmt->execute();
            $insertStmt->close();
        }

        $checkStmt->close();
    }

    $studentsStmt->close();

    if ($imagePath && file_exists($imagePath)) {
        unlink($imagePath);
    }

    $deleteStmt = $conn->prepare("DELETE FROM qrcode_session WHERE qrsession_id = ?");
    $deleteStmt->bind_param("i", $qrsessionId);
    $deleteStmt->execute();
    $deleteStmt->close();

    $deletedCount++;

    $response['success'] = true;
    $response['deleted'] = $deletedCount;
    $response['message'] = "$deletedCount expired QR code(s) deleted and absentees marked";
}

$stmt->close();
$conn->close();

echo json_encode($response);
?>
