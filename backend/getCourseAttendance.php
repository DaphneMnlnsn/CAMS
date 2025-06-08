<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$courseassign_id = $data['courseassign_id'];

$response = [
    'course' => null,
    'attendance' => [],
    'students' => []
];

$courseSql = "
    SELECT c.course_name, c.course_code, ca.enrollment_code
    FROM course_assignment ca
    JOIN course c ON ca.course_id = c.course_id
    WHERE ca.courseassign_id = ?
";
$courseStmt = $conn->prepare($courseSql);
$courseStmt->bind_param("i", $courseassign_id);
$courseStmt->execute();
$courseResult = $courseStmt->get_result();

if ($courseResult && $courseResult->num_rows > 0) {
    $response['course'] = $courseResult->fetch_assoc();
}

$attendanceSql = "
    SELECT 
        a.student_id, 
        CONCAT(s.user_firstname, ' ', s.user_lastname) AS student_name, 
        a.attendance_status, 
        a.session_date, 
        a.marked_on
    FROM attendance a
    JOIN user s ON a.student_id = s.user_id
    WHERE a.courseassign_id = ?
    ORDER BY a.session_date DESC, a.marked_on DESC
";
$attendanceStmt = $conn->prepare($attendanceSql);
$attendanceStmt->bind_param("i", $courseassign_id);
$attendanceStmt->execute();
$attendanceResult = $attendanceStmt->get_result();

if ($attendanceResult && $attendanceResult->num_rows > 0) {
    while ($row = $attendanceResult->fetch_assoc()) {
        $response['attendance'][] = $row;
    }
}

$studentsSql = "
                SELECT 
                    s.user_id AS student_id,
                    CONCAT (s.user_firstname, ' ', s.user_middlename, ' ', s.user_lastname) AS student_name,
                    s.user_email AS student_email
                FROM student_course sc JOIN user s ON sc.student_id = s.user_id
                WHERE sc.courseassign_id = ?";
$studentsStmt = $conn->prepare($studentsSql);
$studentsStmt->bind_param("i", $courseassign_id);
$studentsStmt->execute();
$studentsResult = $studentsStmt->get_result();

if ($studentsResult && $studentsResult->num_rows > 0) {
    while ($row = $studentsResult->fetch_assoc()) {
        $response['students'][] = $row;
    }
}

echo json_encode($response);

$conn->close();
?>
