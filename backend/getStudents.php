<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';

$sql = "
        SELECT *,
            COUNT(CASE WHEN a.attendance_status = 'Present' THEN 1 END) AS present_count,
            COUNT(CASE WHEN a.attendance_status = 'Late' THEN 1 END) AS late_count,
            COUNT(CASE WHEN a.attendance_status = 'Absent' THEN 1 END) AS absent_count,
            COUNT(a.attendance_id) AS total_sessions
        FROM course_assignment ca
        JOIN section sec ON ca.section_id = sec.section_id
        JOIN student_course sc ON ca.courseassign_id = sc.courseassign_id
        JOIN user s ON sc.student_id = s.user_id
        JOIN course c ON ca.course_id = c.course_id
        LEFT JOIN attendance a 
            ON a.student_id = s.user_id AND a.courseassign_id = ca.courseassign_id
        WHERE ca.instructor_id = ? 
        AND s.archived != 1 
        AND ca.archived != 1
        GROUP BY s.user_id, c.course_id
        ";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();

$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $present = (int)$row['present_count'];
    $late = (int)$row['late_count'];
    $absent = (int)$row['absent_count'];
    $total = (int)$row['total_sessions'];

    $rate = $total > 0 ? round((($present + $late) / $total) * 100, 2) : 0;

    $row['attendance_rate'] = $rate;
    
    $students[] = $row;
}

echo json_encode($students);

$conn->close();

?>
