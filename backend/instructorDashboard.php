<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
    exit();
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}
$instructorId = (int) $_SESSION['user_id'];

try {
    $statsSql = "
      SELECT
        (SELECT COUNT(*) FROM course_assignment WHERE instructor_id = ? AND archived = 0) AS totalCourses,
        (SELECT COUNT(DISTINCT sc.student_id)
           FROM course_assignment ca
           JOIN student_course sc ON ca.courseassign_id = sc.courseassign_id
          WHERE ca.instructor_id = ? AND ca.archived = 0) AS totalStudents,
        (SELECT COUNT(DISTINCT a.session_date) FROM attendance a
        JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
        WHERE ca.instructor_id = ? AND ca.archived = 0 AND DATE(a.session_date) = CURDATE()) AS totalSessions
    ";
    $stmt = $conn->prepare($statsSql);
    $stmt->bind_param("iii", $instructorId, $instructorId, $instructorId);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $dayFilter = $_GET['day'] ?? 'All';
    if (strtolower($dayFilter) === 'today') {
        $dayFilter = date('l');
    }

    $schedSql = "
      SELECT
        c.course_name AS subject,
        section_schedule,
        section_room AS room
      FROM course_assignment ca JOIN course c ON ca.course_id = c.course_id
      WHERE instructor_id = ? AND ca.archived = 0
    ";
    $stmt = $conn->prepare($schedSql);
    $stmt->bind_param("i", $instructorId);
    $stmt->execute();
    $result = $stmt->get_result();

    $schedule = [];
    $currentDay = date('l'); // e.g., "Monday"

    while ($row = $result->fetch_assoc()) {
        $scheduleStr = $row['section_schedule']; // "Monday, Friday : 1:00PM-4:00PM"
        if (strpos($scheduleStr, ':') !== false) {
            [$daysStr, $time] = explode(':', $scheduleStr, 2);
            $days = array_map('trim', explode(',', $daysStr));
            foreach ($days as $day) {
                $schedule[] = [
                  'subject' => $row['subject'],
                  'day' => $day,
                  'time' => trim($time),
                  'room' => $row['room']
                ];
            }
        }
    }
    $stmt->close();

    $lowSql = "
      SELECT 
        u.user_firstname AS studentFirst,
        u.user_lastname  AS studentLast,
        s.section_name AS section,
        ROUND(
          SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END)
          / COUNT(a.attendance_id) * 100, 0
        ) AS percent
      FROM attendance a
      JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
      JOIN user u      ON a.student_id = u.user_id
      JOIN section s ON ca.section_id = s.section_id
      WHERE ca.instructor_id = ? AND ca.archived = 0
      GROUP BY a.student_id
      HAVING percent <= 50
      ORDER BY percent ASC
      LIMIT 5
    ";
    $stmt = $conn->prepare($lowSql);
    $stmt->bind_param("i", $instructorId);
    $stmt->execute();
    $raw = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $lowAttendance = array_map(function($r){
      return [
        'student' => $r['studentFirst'] . ' ' . $r['studentLast'],
        'section' => $r['section'],
        'percent' => (int)$r['percent']
      ];
    }, $raw);

    echo json_encode([
      'stats'            => $stats,
      'schedule'         => $schedule,
      'lowAttendance'    => $lowAttendance,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>