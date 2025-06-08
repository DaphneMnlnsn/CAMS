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

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
$year       = isset($_GET['year'])       ? $conn->real_escape_string($_GET['year'])     : null;
$semester   = isset($_GET['semester'])   ? $conn->real_escape_string($_GET['semester']) : null;

if (!$student_id || !$year || !$semester) {
    http_response_code(400);
    echo json_encode(['error'=>'Missing parameters']);
    exit;
}

$student_sql = "
SELECT
  s.user_id,
  s.user_firstname, s.user_middlename, s.user_lastname,
  sec.section_name
FROM user s
JOIN student_course sc   ON s.user_id = sc.student_id
JOIN course_assignment ca ON sc.courseassign_id = ca.courseassign_id
JOIN section sec          ON ca.section_id = sec.section_id
WHERE s.user_id = ?
ORDER BY sec.section_year DESC, 
         CASE 
           WHEN sec.section_semester LIKE '%1st Sem%' THEN 1
           WHEN sec.section_semester LIKE '%2nd Sem%' THEN 2
           ELSE 3
         END DESC
LIMIT 1";

$stmt1 = $conn->prepare($student_sql);
$stmt1->bind_param("i", $student_id);
$stmt1->execute();
$student_data = $stmt1->get_result()->fetch_assoc();
$stmt1->close();

if ($semester === '1st Sem') {
    // August → December
    $monthCondition = "MONTH(a.session_date) BETWEEN 8 AND 12";
    $startMonth     = 8;
} else {
    // January → May
    $monthCondition = "MONTH(a.session_date) BETWEEN 1 AND 5";
    $startMonth     = 1;
}

$attendance_sql = "
SELECT
  MONTH(a.session_date) AS month_num,
  ROUND(100 * SUM(a.attendance_status = 'Present') / COUNT(a.attendance_id), 2) AS rate
FROM attendance a
JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
JOIN section s            ON ca.section_id = s.section_id
WHERE a.student_id = ?
  AND s.section_year = ?
  AND RIGHT(s.section_semester, 7) = ?
  AND {$monthCondition}
GROUP BY MONTH(a.session_date)
";
$stmt2 = $conn->prepare($attendance_sql);
$stmt2->bind_param("iss", $student_id, $year, $semester);
$stmt2->execute();
$result2 = $stmt2->get_result();

$monthNames = [
    1=>'January',2=>'February',3=>'March',4=>'April',
    5=>'May',6=>'June',7=>'July',8=>'August',
    9=>'September',10=>'October',11=>'November',12=>'December'
];
$attendance = [];
for ($m = $startMonth; $m < $startMonth + 5; $m++) {
    $attendance[$monthNames[$m]] = 0.0;
}

while ($row = $result2->fetch_assoc()) {
    $num = intval($row['month_num']);
    if (isset($monthNames[$num])) {
        $attendance[$monthNames[$num]] = floatval($row['rate']);
    }
}
$stmt2->close();
$conn->close();

echo json_encode([
    'student'    => $student_data,
    'attendance' => $attendance
]);

?>
