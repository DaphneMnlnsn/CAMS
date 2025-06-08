<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

date_default_timezone_set('Asia/Manila');

$data = json_decode(file_get_contents('php://input'), true);
$student_id = $data['student_id'] ?? null;
$code = $data['code'] ?? null;

$sql = "SELECT * FROM qrcode_session 
        WHERE code = ? 
        ORDER BY date_created DESC 
        LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'QR code not found']);
    exit();
}

$session = $result->fetch_assoc();
$now = new DateTime('now', new DateTimeZone('Asia/Manila'));
$expiration = new DateTime($session['expiration_time'], new DateTimeZone('Asia/Manila'));
$late_cutoff = new DateTime($session['late_time'], new DateTimeZone('Asia/Manila'));

if ($now > $expiration) {
    http_response_code(410);
    echo json_encode(['error' => 'QR code expired']);
    exit();
}

$checkSql = "SELECT * FROM attendance 
             WHERE student_id = ? AND courseassign_id = ? AND session_date = ? AND attendance_status IN ('Present', 'Late')";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("iis", $student_id, $session['courseassign_id'], $session['date_created']);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Attendance already recorded']);
    exit();
}

$enrollSql = "SELECT * FROM student_course WHERE student_id = ? AND courseassign_id = ?";
$enrollStmt = $conn->prepare($enrollSql);
$enrollStmt->bind_param("ii", $student_id, $session['courseassign_id']);
$enrollStmt->execute();
$enrollResult = $enrollStmt->get_result();

if ($enrollResult->num_rows === 0) {
    http_response_code(403);
    echo json_encode(['error' => 'You are not enrolled in this course']);
    exit();
}

$status = ($now <= $late_cutoff) ? 'Present' : 'Late';

$insertSql = "INSERT INTO attendance 
              (student_id, courseassign_id, attendance_status, session_date, marked_on)
              VALUES (?, ?, ?, ?, NOW())";
$insertStmt = $conn->prepare($insertSql);
$insertStmt->bind_param("iiss", $student_id, $session['courseassign_id'], $status, $session['date_created']);

if ($insertStmt->execute()) {
    echo json_encode([
        'success' => true,
        'status' => $status,
        'marked_on' => date('Y-m-d H:i:s'),
        'courseassign_id' => $session['courseassign_id']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to mark attendance']);
}

$conn->close();
?>