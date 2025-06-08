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
$ca_id      = isset($_GET['courseassign_id']) && is_numeric($_GET['courseassign_id'])
                ? intval($_GET['courseassign_id'])
                : null;

if (!$ca_id) {
    http_response_code(400);
    echo json_encode(['error'=>'Missing or invalid courseassign_id']);
    exit;
}

$sql1 = "
  SELECT 
    c.course_name,
    c.course_code,
    s.section_name
  FROM course_assignment ca
  JOIN course c  ON ca.course_id  = c.course_id
  JOIN section s ON ca.section_id = s.section_id
  WHERE ca.courseassign_id = ?
";
$stmt1 = $conn->prepare($sql1);
$stmt1->bind_param('i', $ca_id);
$stmt1->execute();
$res1 = $stmt1->get_result();
if ($res1->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error'=>'Course assignment not found']);
    exit;
}
$info = $res1->fetch_assoc();
$stmt1->close();

$sql2 = "
  SELECT
    SUM(a.attendance_status = 'Present') AS presents,
    SUM(a.attendance_status = 'Late')    AS lates,
    SUM(a.attendance_status = 'Absent')  AS absents,
    COUNT(*)                             AS total,
    IF(COUNT(*) = 0, 0,
       ROUND(100 * SUM(a.attendance_status = 'Present') / COUNT(*), 2)
    ) AS attendance_rate
  FROM attendance a
  WHERE a.student_id        = ?
    AND a.courseassign_id   = ?
";
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param('ii', $student_id, $ca_id);
$stmt2->execute();
$res2 = $stmt2->get_result();
$aggr = $res2->fetch_assoc();
$stmt2->close();

$sql3 = "
  SELECT 
    a.session_date,
    a.attendance_status
  FROM attendance a
  WHERE a.student_id      = ?
    AND a.courseassign_id = ?
  ORDER BY a.session_date DESC
";
$stmt3 = $conn->prepare($sql3);
$stmt3->bind_param('ii', $student_id, $ca_id);
$stmt3->execute();
$res3 = $stmt3->get_result();
$history = [];
while ($row = $res3->fetch_assoc()) {
    $history[] = $row;
}
$stmt3->close();
$conn->close();

$response = [
    'summary' => [
        'course_name'     => $info['course_name'],
        'course_code'     => $info['course_code'],
        'section_name'    => $info['section_name'],
        'presents'        => intval($aggr['presents']),
        'lates'           => intval($aggr['lates']),
        'absents'         => intval($aggr['absents']),
        'attendance_rate' => floatval($aggr['attendance_rate'])
    ],
    'history' => $history
];

echo json_encode($response, JSON_PRETTY_PRINT);
