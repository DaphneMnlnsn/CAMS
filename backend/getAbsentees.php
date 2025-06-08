<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';

$schoolYear = $_GET['schoolYear'] ?? '';
$semester = $_GET['semester'] ?? '';

$sql = "
    WITH last_absences AS (
        SELECT
            a.student_id,
            MAX(a.session_date) AS last_absent_date
        FROM attendance a
        GROUP BY a.student_id
    )
    SELECT 
        u.user_id AS student_id,
        CONCAT(u.user_firstname, ' ', u.user_lastname) AS student_name,
        sec.section_year AS schoolYear,
        sec.section_semester AS semester,
        sec.section_name AS section_name,
        SUM(CASE WHEN a.attendance_status = 'Absent' THEN 1 ELSE 0 END) AS total_absent,
        la.last_absent_date,
        ROUND(
        (SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END) * 100.0) / 
        NULLIF(COUNT(a.attendance_id), 0), 2
        ) AS attendance_rate
    FROM attendance a
    INNER JOIN user u ON a.student_id = u.user_id
    INNER JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
    INNER JOIN section sec ON ca.section_id = sec.section_id
    INNER JOIN last_absences la ON la.student_id = u.user_id
    WHERE u.user_role = 'Student'
    GROUP BY u.user_id, student_name, sec.section_year, sec.section_semester, sec.section_name, la.last_absent_date
    HAVING total_absent >= 3
    AND NOT EXISTS (
        SELECT 1 FROM notification n
        WHERE n.user_id = u.user_id
        AND n.notification_type = 'Absentee Call'
        AND n.notification_date >= la.last_absent_date
    )
    ORDER BY student_name;
";

$params = [];
$types = '';

if (!empty($schoolYear)) {
    $sql .= " AND sec.school_year = ?";
    $params[] = $schoolYear;
    $types .= 's';
}
if (!empty($semester)) {
    $sql .= " AND sec.semester = ?";
    $params[] = $semester;
    $types .= 's';
}

$stmt = $conn->prepare($sql);

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$absentees = [];
while ($row = $result->fetch_assoc()) {
    $absentees[] = $row;
}

echo json_encode($absentees);

$stmt->close();
$conn->close();

?>