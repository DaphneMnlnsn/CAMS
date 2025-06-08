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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
    exit();
}

$studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

if ($studentId === 0) {
    echo json_encode(['error' => 'Missing or invalid student_id']);
    http_response_code(400);
    exit();
}

try {
    $sql = "SELECT 
                ca.courseassign_id,
                c.course_name,
                c.course_code,
                s.section_name,
                s.section_year,
                s.section_semester,
                ca.section_schedule AS schedule,
                ca.section_room,
                (
                    SELECT COUNT(*) 
                    FROM attendance a 
                    WHERE a.student_id = sc.student_id 
                      AND a.courseassign_id = ca.courseassign_id 
                      AND a.attendance_status = 'Present'
                ) AS present_count,
                (
                    SELECT COUNT(*) 
                    FROM attendance a 
                    WHERE a.student_id = sc.student_id 
                      AND a.courseassign_id = ca.courseassign_id 
                      AND a.attendance_status = 'Absent'
                ) AS absent_count,
                (
                    SELECT MAX(a.session_date) 
                    FROM attendance a 
                    WHERE a.student_id = sc.student_id 
                      AND a.courseassign_id = ca.courseassign_id
                ) AS last_attendance_date
            FROM student_course sc
            JOIN course_assignment ca ON sc.courseassign_id = ca.courseassign_id
            JOIN course c ON ca.course_id = c.course_id
            JOIN section s ON ca.section_id = s.section_id
            WHERE sc.student_id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();

    $scheduleByDay = [];
    $upcomingClass = null;
    $recentAttendance = [];

    $today = date('l'); // e.g., 'Monday'
    $now = new DateTime();

    while ($row = $result->fetch_assoc()) {
        $total = $row['present_count'] + $row['absent_count'];
        $rate = $total > 0 ? round(($row['present_count'] / $total) * 100, 2) : 0;

        $rawSchedule = str_replace('–', '-', $row['schedule']); // Replace en dash
        if (preg_match('/^(.+?)\s*:\s*(\d{1,2}:\d{2}[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}[APMapm]{2})$/', $rawSchedule, $matches)) {
            $daysString = trim($matches[1]);
            $startTime = DateTime::createFromFormat('g:iA', strtoupper($matches[2]));
            $endTime = DateTime::createFromFormat('g:iA', strtoupper($matches[3]));

            $dayList = array_map('trim', explode(',', $daysString));

            foreach ($dayList as $dayName) {
                $classData = [
                    'courseassign_id' => (int)$row['courseassign_id'],
                    'course_name' => $row['course_name'],
                    'course_code' => $row['course_code'],
                    'section_name' => $row['section_name'],
                    'section_year' => (int)$row['section_year'],
                    'section_semester' => $row['section_semester'],
                    'schedule' => $dayName . " : " . $startTime->format('g:i A') . "-" . $endTime->format('g:i A'),
                    'start_time' => $startTime->format('g:i A'),
                    'end_time' => $endTime->format('g:i A'),
                    'room' => $row['section_room'],
                    'attendance_rate' => $rate,
                    'last_attendance_date' => $row['last_attendance_date']
                ];

                if (!isset($scheduleByDay[$dayName])) {
                    $scheduleByDay[$dayName] = [];
                }
                $scheduleByDay[$dayName][] = $classData;

                // Check for upcoming class
                if ($dayName === $today && $startTime > $now) {
                    if (!$upcomingClass || $startTime < DateTime::createFromFormat('g:i A', $upcomingClass['start_time'])) {
                        $upcomingClass = [
                            'course_name' => $row['course_name'],
                            'section_name' => $row['section_name'],
                            'start_time' => $startTime->format('g:i A'),
                            'end_time' => $endTime->format('g:i A'),
                            'room' => $row['section_room']
                        ];
                    }
                }
            }

            // Recent attendance logs
            $attQuery = $conn->prepare("
                SELECT session_date, attendance_status 
                FROM attendance 
                WHERE student_id = ? AND courseassign_id = ? 
                ORDER BY session_date DESC 
                LIMIT 5
            ");
            $attQuery->bind_param("ii", $studentId, $row['courseassign_id']);
            $attQuery->execute();
            $attResult = $attQuery->get_result();

            while ($attRow = $attResult->fetch_assoc()) {
                $recentAttendance[] = [
                    'course_name' => $row['course_name'],
                    'session_date' => $attRow['session_date'],
                    'status' => $attRow['attendance_status']
                ];
            }

            $attQuery->close();
        } else {
            error_log("Invalid schedule format: " . $row['schedule']);
        }
    }

    $response = [
        'upcoming_class' => $upcomingClass,
        'schedule_by_day' => $scheduleByDay,
        'recent_attendance' => $recentAttendance
    ];

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}

$conn->close();
?>