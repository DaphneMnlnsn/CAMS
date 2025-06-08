<?php
header("Content-Type: application/json");

$allowed_origins = [
    "http://localhost:3000",
    "http://192.168.254.116",
    "http://192.168.25.2"
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$student_id = isset($input['student_id']) ? intval($input['student_id']) : 0;
$enrollment_code = $input['enrollment_code'] ?? '';

if (!$student_id || empty($enrollment_code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing student_id or enrollment_code']);
    exit;
}

$sql = "SELECT courseassign_id FROM course_assignment WHERE enrollment_code = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $enrollment_code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Invalid enrollment code']);
    exit;
}

$course = $result->fetch_assoc();
$courseassign_id = $course['courseassign_id'];
$stmt->close();

$check_sql = "SELECT * FROM student_course WHERE student_id = ? AND courseassign_id = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("ii", $student_id, $courseassign_id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows > 0) {
    echo json_encode(['message' => 'Already enrolled in this course']);
    exit;
}
$check_stmt->close();

$insert_sql = "INSERT INTO student_course (student_id, courseassign_id) VALUES (?, ?)";
$insert_stmt = $conn->prepare($insert_sql);
$insert_stmt->bind_param("ii", $student_id, $courseassign_id);

if ($insert_stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Student enrolled successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to enroll student']);
}

$insert_stmt->close();
$conn->close();
?>
