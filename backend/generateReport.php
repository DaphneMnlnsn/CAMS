<?php
require_once 'config.php';
require_once 'auditLog.php';
require_once __DIR__ . '/dompdf/dompdf/autoload.inc.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$options = new Options();
$options->set('isRemoteEnabled', true);
$dompdf = new Dompdf($options);

$reportType = $_GET['type'] ?? 'attendance';
$timeRange = $_GET['timeRange'] ?? 'all_time';

ob_start();

if ($reportType === 'attendance') {
    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
    $courseID = $_GET['courseID'] ?? null;

    $whereClauses = [];

    if ($startDate) $whereClauses[] = "a.session_date >= '$startDate'";
    if ($endDate)   $whereClauses[] = "a.session_date <= '$endDate'";
    if ($courseID && $courseID !== 'All') $whereClauses[] = "ca.course_id = '$courseID'";

    $whereSQL = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

    $query = "
        SELECT 
            u.user_id,
            CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
            a.session_date,
            a.attendance_status
        FROM attendance a
        LEFT JOIN user u ON a.student_id = u.user_id
        LEFT JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
        $whereSQL
        ORDER BY a.session_date DESC
        LIMIT 100
    ";
    $result = $conn->query($query);

    echo "<h2 style='text-align:center;'>Attendance Report</h2>";

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>{$row['user_id']}</td>
                <td>{$row['name']}</td>
                <td>{$row['session_date']}</td>
                <td>{$row['attendance_status']}</td>
              </tr>";
    }
    echo "</tbody></table>";

} elseif ($reportType === 'log') {
    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
    $activity = $_GET['activity'] ?? null;

    $whereClauses = [];

    if ($startDate) $whereClauses[] = "a.timestamp >= '$startDate'";
    if ($endDate)   $whereClauses[] = "a.timestamp <= '$endDate'";
    if ($activity && $activity !== 'All') $whereClauses[] = "a.action_type = '$activity'";

    $whereSQL = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
    
    echo "<h2 style='text-align:center;'>Activity Log Report</h2>";

    $query = "SELECT * FROM audit_log a JOIN user u ON a.user_id = u.user_id $whereSQL ORDER BY timestamp DESC LIMIT 100";
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>{$row['user_firstname']} {$row['user_lastname']}</td>
                <td>{$row['description']}</td>
                <td>{$row['timestamp']}</td>
              </tr>";
    }
    echo "</tbody></table>";
} elseif ($reportType === 'instructor') {

    $whereClauses = ["u.user_role = 'Instructor'"];

    $timeCondition = '';
    switch ($timeRange) {
        case 'this_week':
            $timeCondition = "AND YEARWEEK(DATE(a.session_date), 1) = YEARWEEK(CURDATE(), 1)";
            break;
        case 'this_month':
            $timeCondition = "AND YEAR(DATE(a.session_date)) = YEAR(CURDATE()) AND MONTH(DATE(a.session_date)) = MONTH(CURDATE())";
            break;
        case 'this_year':
            $timeCondition = "AND YEAR(DATE(a.session_date)) = YEAR(CURDATE())";
            break;
        default:
            $timeCondition = '';
    }

    $whereSQL = 'WHERE ' . implode(' AND ', $whereClauses);

    echo "<h2 style='text-align:center;'>Instructor Report</h2>";

    $query = "SELECT 
                u.user_id AS id,
                CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
                COUNT(a.attendance_id) AS sessions
                FROM user u
                LEFT JOIN course_assignment ca
                    ON ca.instructor_id = u.user_id
                LEFT JOIN attendance a
                    ON a.courseassign_id = ca.courseassign_id $timeCondition
                $whereSQL
                GROUP BY u.user_id
                ORDER BY u.user_id";
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>Instructor ID</th>
                    <th>Name</th>
                    <th>Sessions Conducted</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>{$row['id']}</td>
                <td>{$row['name']}</td>
                <td>{$row['sessions']}</td>
              </tr>";
    }
    echo "</tbody></table>";
} elseif ($reportType === 'student') {

    $timeCondition = '';
    switch ($timeRange) {
        case 'this_week':
            $timeCondition = "AND YEARWEEK(DATE(a.session_date), 1) = YEARWEEK(CURDATE(), 1)";
            break;
        case 'this_month':
            $timeCondition = "AND YEAR(DATE(a.session_date)) = YEAR(CURDATE()) AND MONTH(DATE(a.session_date)) = MONTH(CURDATE())";
            break;
        case 'this_year':
            $timeCondition = "AND YEAR(DATE(a.session_date)) = YEAR(CURDATE())";
            break;
    }

    $whereClauses = ["u.user_role = 'Student'"];
    $whereSQL = 'WHERE ' . implode(' AND ', $whereClauses);

    echo "<h2 style='text-align:center;'>Student Report</h2>";

    $query = "
                SELECT
                    u.user_id AS id,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
                    SUM(a.attendance_status = 'Present') AS present,
                    SUM(a.attendance_status = 'Absent')  AS absent,
                    SUM(a.attendance_status = 'Late')    AS late
                FROM user u
                LEFT JOIN attendance a
                    ON a.student_id = u.user_id $timeCondition
                $whereSQL
                GROUP BY u.user_id
                ORDER BY u.user_id
                ";
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Total Present</th>
                    <th>Total Absent</th>
                    <th>Total Lates</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        $present = $row['present'] ?? 0;
        $absent  = $row['absent'] ?? 0;
        $late    = $row['late'] ?? 0;

        echo "<tr>
                <td>{$row['id']}</td>
                <td>{$row['name']}</td>
                <td style='text-align='center''>{$present}</td>
                <td style='text-align='center''>{$absent}</td>
                <td style='text-align='center''>{$late}</td>
              </tr>";
    }
    echo "</tbody></table>";
} elseif ($reportType === 'instructorChart') {

    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate   = isset($_GET['endDate'])   ? $_GET['endDate']   : null;
    $courseId  = isset($_GET['courseId'])  ? $_GET['courseId']  : null;
    $today = date('Y-m-d');
    $chartWhere = "WHERE 1=1 AND ca.instructor_id = {$_SESSION['user_id']} AND ca.archived = 0";
    if ($startDate && $endDate) {
        $chartWhere .= " AND session_date BETWEEN '$startDate' AND '$endDate'";
    }
    if ($courseId) {
        $chartWhere .= " AND c.course_id = " . intval($courseId);
    }

    echo "<h2 style='text-align:center;'>Attendance Report</h2>";

    $query = "
            SELECT 
                u.user_id,
                CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
                a.session_date,
                a.attendance_status
            FROM attendance a
            LEFT JOIN user u ON a.student_id = u.user_id
            LEFT JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
            LEFT JOIN course c ON ca.course_id = c.course_id
            $chartWhere
            ORDER BY a.session_date DESC
            LIMIT 100
                ";
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>
                    <td>{$row['user_id']}</td>
                    <td>{$row['name']}</td>
                    <td>{$row['session_date']}</td>
                    <td>{$row['attendance_status']}</td>
                </tr>";
        }
        echo "</tbody></table>";
} elseif ($reportType === 'instructorAttendance') {

    $joinCondition = "ON a.courseassign_id = ca.courseassign_id";
    switch ($timeRange) {
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

    echo "<h2 style='text-align:center;'>Attendance Summary Report</h2>";

    $query = "
      SELECT
          c.course_name AS name,
          COUNT(DISTINCT a.attendance_id) AS total_sessions,
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
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Total Sessions</th>
                    <th>Presents</th>
                    <th>Absents</th>
                    <th>Lates</th>
                    <th>Attendance Rate</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        $session = $row['total_sessions'] ?? 0;
        $present = $row['total_present'] ?? 0;
        $absent  = $row['total_absent'] ?? 0;
        $late    = $row['total_late'] ?? 0;
        $rate    = (float)$row['attendance_rate'] ?? 0;

        echo "<tr>
                <td>{$row['name']}</td>
                <td style='text-align='center''>{$session}</td>
                <td style='text-align='center''>{$present}</td>
                <td style='text-align='center''>{$absent}</td>
                <td style='text-align='center''>{$late}</td>
                <td style='text-align='center''>{$rate}%</td>
              </tr>";
    }
    echo "</tbody></table>";
} elseif ($reportType === 'instructorStudents') {

    $attJoin = "ON a.courseassign_id = ca.courseassign_id AND a.student_id = u.user_id";
    switch ($timeRange) {
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

    echo "<h2 style='text-align:center;'>Student Report</h2>";

    $query = "
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
    $result = $conn->query($query);

    echo "<table border='1' width='100%' cellspacing='0' cellpadding='5'>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Total Present</th>
                    <th>Total Absents</th>
                    <th>Total Lates</th>
                    <th>Attendance Rate</th>
                </tr>
            </thead>
            <tbody>";
    while ($row = $result->fetch_assoc()) {
        $present = $row['present'] ?? 0;
        $absent  = $row['absent'] ?? 0;
        $late    = $row['late'] ?? 0;
        $rate    = (float)$row['attendance_rate'] ?? 0;

        echo "<tr>
                <td>{$row['id']}</td>
                <td style='text-align='center''>{$row['name']}</td>
                <td style='text-align='center''>{$present}</td>
                <td style='text-align='center''>{$absent}</td>
                <td style='text-align='center''>{$late}</td>
                <td style='text-align='center''>{$rate}%</td>
              </tr>";
    }
    echo "</tbody></table>";
}

$html = ob_get_clean();
$dompdf->loadHtml($html);

$dompdf->setPaper('A4', 'portrait');

$dompdf->render();

$dompdf->stream("report-{$reportType}.pdf", ["Attachment" => 0]);

$conn->close();
?>