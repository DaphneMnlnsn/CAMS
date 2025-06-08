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

if (empty($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Administrator') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

try {
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate   = isset($_GET['endDate'])   ? $_GET['endDate']   : null;
    $courseId  = isset($_GET['courseId'])  ? $_GET['courseId']  : null;
    $today = date('Y-m-d');
    $instructorTimeRange = $_GET['instructorTimeRange'] ?? 'all_time';
    $studentTimeRange = $_GET['studentTimeRange'] ?? 'all_time';
    $statsSql = "
      SELECT
        (SELECT COUNT(*) FROM user WHERE user_role = 'Student') AS totalStudents,
        (SELECT COUNT(*) FROM user WHERE user_role = 'Instructor') AS totalInstructors,
        (SELECT COUNT(*) FROM section) AS totalSections,
        (SELECT COUNT(*) FROM course) AS totalCourses,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Absent') AS absentees,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Late') AS lateArrivals,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Present') AS presentStudents
    ";
    $stmt = $conn->prepare($statsSql);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    $chartWhere = "WHERE 1=1";
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

    $instructorDateCondition = "";
    switch ($instructorTimeRange) {
        case 'this_week':
            $instructorDateCondition = "AND YEARWEEK(a.session_date, 1) = YEARWEEK(CURDATE(), 1)";
            break;
        case 'this_month':
            $instructorDateCondition = "AND YEAR(a.session_date) = YEAR(CURDATE()) AND MONTH(a.session_date) = MONTH(CURDATE())";
            break;
        case 'this_year':
            $instructorDateCondition = "AND YEAR(a.session_date) = YEAR(CURDATE())";
            break;
        default:
            break;
    }
    $instSql = "
      SELECT 
        u.user_id AS id,
        CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
        COUNT(a.attendance_id) AS sessions
      FROM user u
      LEFT JOIN course_assignment ca
        ON ca.instructor_id = u.user_id
      LEFT JOIN attendance a
        ON a.courseassign_id = ca.courseassign_id
      $instructorDateCondition
      WHERE u.user_role = 'Instructor'
      GROUP BY u.user_id
      ORDER BY u.user_id
    ";
    $instResult = $conn->query($instSql);
    $instructors = [];
    while ($row = $instResult->fetch_assoc()) {
        $instructors[] = [
          'id'       => $row['id'],
          'name'     => $row['name'],
          'sessions' => (int)$row['sessions'],
        ];
    }

    $studentDateCondition = "";
    switch ($studentTimeRange) {
        case 'this_week':
            $studentDateCondition = "AND YEARWEEK(a.session_date, 1) = YEARWEEK(CURDATE(), 1)";
            break;
        case 'this_month':
            $studentDateCondition = "AND YEAR(a.session_date) = YEAR(CURDATE()) AND MONTH(a.session_date) = MONTH(CURDATE())";
            break;
        case 'this_year':
            $studentDateCondition = "AND YEAR(a.session_date) = YEAR(CURDATE())";
            break;
        default:
            break;
    }
    $studSql = "
      SELECT
        u.user_id AS id,
        CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
        SUM(a.attendance_status = 'Present') AS present,
        SUM(a.attendance_status = 'Absent')  AS absent,
        SUM(a.attendance_status = 'Late')    AS late
      FROM user u
      LEFT JOIN attendance a
        ON a.student_id = u.user_id 
      $studentDateCondition
      WHERE u.user_role = 'Student'
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
        ];
    }

    $courseResult = $conn->query("SELECT course_id AS id, course_name AS name FROM course WHERE archived=0 ORDER BY course_name");
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
      'instructors' => $instructors,
      'students'    => $students,
      'courses'     => $courses
    ], JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
