<?php
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
header("Content-Type: application/json");

require_once 'config.php';

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
if (!$student_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing student_id']);
    exit;
}
$year       = isset($_GET['year']) ? $conn->real_escape_string($_GET['year'])      : null;
$semester   = isset($_GET['semester'])  ? $conn->real_escape_string($_GET['semester']) : null;

$sql = "
SELECT
    ca.courseassign_id,
    c.course_name,
    c.course_code,
    s.section_name,
    s.section_year,
    s.section_semester,
    IF(COUNT(a.attendance_id) = 0, 0,
       ROUND(100 * SUM(a.attendance_status = 'Present') / COUNT(a.attendance_id), 2)
    ) AS attendance_rate,
    MAX(a.session_date) AS last_attendance_date
FROM student_course sc
JOIN course_assignment ca 
    ON sc.courseassign_id = ca.courseassign_id
JOIN course c 
    ON ca.course_id = c.course_id
JOIN section s
    ON ca.section_id = s.section_id
LEFT JOIN attendance a 
    ON a.student_id = sc.student_id
   AND a.courseassign_id = ca.courseassign_id
WHERE sc.student_id = ?
";

$params = [];
$types  = 'i';
$params[] = $student_id;

if ($year !== null) {
    $sql .= " AND s.section_year = ? ";
    $types    .= 'i';
    $params[]  = $year;
}
if ($semester !== null) {
    $sql .= " AND RIGHT(s.section_semester, 7) = ? ";
    $types    .= 's';
    $params[]  = $semester;
}

$sql .= "
GROUP BY 
    c.course_name,
    c.course_code,
    s.section_name,
    s.section_year,
    s.section_semester
ORDER BY 
    s.section_year DESC,
    s.section_semester,
    c.course_name
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$courses = [];
while ($row = $result->fetch_assoc()) {
    $courses[] = $row;
}

echo json_encode($courses);

$stmt->close();
$conn->close();
?>
