<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

if (empty($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Instructor') {
    http_response_code(response_code: 403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

try {
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate   = isset($_GET['endDate'])   ? $_GET['endDate']   : null;
    $courseId  = isset($_GET['courseId'])  ? $_GET['courseId']  : null;
    $today = date('Y-m-d');
    $attendanceTimeRange = $_GET['attendanceTimeRange'] ?? 'all_time';
    $studentTimeRange = $_GET['studentTimeRange'] ?? 'all_time';
    $statsSql = "
      SELECT
        (SELECT COUNT(*) FROM student_course sc JOIN course_assignment ca
        ON sc.courseassign_id = ca.courseassign_id
        WHERE ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0) AS totalStudents,
        (SELECT COUNT(*) FROM course_assignment WHERE instructor_id = {$_SESSION['user_id']} AND archived = 0) AS totalCourses,
        (SELECT COUNT(DISTINCT a.session_date) FROM attendance a JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id 
        WHERE ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0) AS totalSessions,
        (SELECT COUNT(*) FROM attendance a JOIN course_assignment ca 
        ON a.courseassign_id = ca.courseassign_id
        WHERE a.attendance_status = 'Absent' AND ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0) AS absentees,
        (SELECT COUNT(*) FROM attendance a JOIN course_assignment ca 
        ON a.courseassign_id = ca.courseassign_id 
        WHERE a.attendance_status = 'Late' AND ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0) AS lateArrivals,
        (SELECT COUNT(*) FROM attendance a JOIN course_assignment ca 
        ON a.courseassign_id = ca.courseassign_id 
        WHERE attendance_status = 'Present' AND ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0) AS presentStudents
    ";
    $stmt = $conn->prepare($statsSql);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    $chartWhere = "WHERE 1=1 AND ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0";
    if ($startDate && $endDate) {
        $chartWhere .= " AND session_date BETWEEN '$startDate' AND '$endDate'";
    }
    if ($courseId) {
        $chartWhere .= " AND c.course_id = " . intval($courseId);
    }

    $chartSql = "
        SELECT
            DATE(session_date) AS date,
            SUM(attendance_status = 'Present' OR attendance_status = 'Late') AS presentCount,
            SUM(attendance_status = 'Absent') AS absentCount
        FROM attendance a
        LEFT JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
        LEFT JOIN course c ON ca.course_id = c.course_id
        $chartWhere
        GROUP BY DATE(a.session_date)
        ORDER BY DATE(a.session_date) ASC
    ";
    $chartResult = $conn->query($chartSql);
    $labels = $presentData = $absentData = [];
    while ($row = $chartResult->fetch_assoc()) {
        $labels[]      = $row['date'];
        $presentData[] = (int)$row['presentCount'];
        $absentData[]  = (int)$row['absentCount'];
    }

    $joinCondition = "ON a.courseassign_id = ca.courseassign_id";
    switch ($attendanceTimeRange) {
      case 'this_week':
          $joinCondition .= " AND YEARWEEK(a.session_date, 1) = YEARWEEK(CURDATE(), 1)";
          break;
      case 'this_month':
          $joinCondition .= " AND YEAR(a.session_date) = YEAR(CURDATE()) AND MONTH(a.session_date) = MONTH(CURDATE())";
          break;
      case 'this_year':
          $joinCondition .= " AND YEAR(a.session_date) = YEAR(CURDATE())";
          break;
    }
    $attendanceSql = "
      SELECT
          c.course_name AS name,
          COUNT(DISTINCT a.session_date) AS total_sessions,
          SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END) AS total_present,
          SUM(CASE WHEN a.attendance_status = 'Late' THEN 1 ELSE 0 END) AS total_late,
          SUM(CASE WHEN a.attendance_status = 'Absent' THEN 1 ELSE 0 END) AS total_absent,
          ROUND(
              (SUM(CASE WHEN a.attendance_status IN ('Present', 'Late') THEN 1 ELSE 0 END) /
              NULLIF(COUNT(a.attendance_id), 0)) * 100,
              2
          ) AS attendance_rate
      FROM course_assignment ca
      JOIN course c ON ca.course_id = c.course_id
      LEFT JOIN qrcode_session qs 
        ON qs.courseassign_id = ca.courseassign_id
      LEFT JOIN attendance a 
        $joinCondition
      WHERE ca.instructor_id = {$_SESSION['user_id']}
        AND ca.archived = 0
      GROUP BY c.course_id, c.course_name
    ";
    $attendanceResult = $conn->query($attendanceSql);
    $attendance = [];
    while ($row = $attendanceResult->fetch_assoc()) {
        $attendance[] = [
          'name'       => $row['name'],
          'sessions'     => $row['total_sessions'],
          'presents' => (int)$row['total_present'],
          'absents' => (int)$row['total_absent'],
          'lates' => (int)$row['total_late'],
          'rates' => (int)$row['attendance_rate']
        ];
    }

    $attJoin = "ON a.courseassign_id = ca.courseassign_id AND a.student_id = u.user_id";
    switch ($studentTimeRange) {
      case 'this_week':
          $attJoin .= " AND YEARWEEK(a.session_date, 1) = YEARWEEK(CURDATE(), 1)";
          break;
      case 'this_month':
          $attJoin .= " AND YEAR(a.session_date) = YEAR(CURDATE()) AND MONTH(a.session_date) = MONTH(CURDATE())";
          break;
      case 'this_year':
          $attJoin .= " AND YEAR(a.session_date) = YEAR(CURDATE())";
          break;
    }
    $studSql = "
      SELECT
        u.user_id AS id,
        CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
        SUM(a.attendance_status = 'Present') AS present,
        SUM(a.attendance_status = 'Absent')  AS absent,
        SUM(a.attendance_status = 'Late')    AS late,
        COUNT(a.attendance_id) AS total,
        ROUND(
          (
            SUM(a.attendance_status = 'Present' OR a.attendance_status = 'Late')
            / NULLIF(COUNT(a.attendance_id), 0)
          ) * 100, 2
        ) AS attendance_rate
      FROM user u
      LEFT JOIN student_course sc 
        ON sc.student_id = u.user_id
      LEFT JOIN course_assignment ca 
        ON sc.courseassign_id = ca.courseassign_id
      LEFT JOIN attendance a 
        $attJoin
      WHERE u.user_role = 'Student'
        AND ca.instructor_id = {$_SESSION['user_id']}
      GROUP BY u.user_id
      ORDER BY u.user_id
      LIMIT 100
    ";
    $studResult = $conn->query($studSql);
    $students = [];
    while ($row = $studResult->fetch_assoc()) {
        $students[] = [
          'id'      => $row['id'],
          'name'    => $row['name'],
          'present' => (int)$row['present'],
          'absent'  => (int)$row['absent'],
          'late'    => (int)$row['late'],
          'rate' => (float)$row['attendance_rate']
        ];
    }

    $courseResult = $conn->query("
    SELECT c.course_id AS id, c.course_name AS name FROM course c 
    INNER JOIN course_assignment ca ON c.course_id = ca.course_id 
    WHERE ca.archived = 0 AND ca.instructor_id = {$_SESSION['user_id']}
    ORDER BY c.course_name");
    $courses = [];
    while ($row = $courseResult->fetch_assoc()) {
        $courses[] = $row;
    }

    echo json_encode([
      'stats'       => $stats,
      'chart'       => [
        'labels'      => $labels,
        'presentData' => $presentData,
        'absentData'  => $absentData
      ],
      'attendance' => $attendance,
      'students'    => $students,
      'courses'     => $courses
    ], JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
