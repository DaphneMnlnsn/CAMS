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
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
    exit();
}

try {
    $statsSql = "SELECT
        (SELECT COUNT(*) FROM user WHERE user_role = 'Student') AS totalStudents,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Present' AND DATE(session_date) = CURDATE()) AS present,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Absent' AND DATE(session_date) = CURDATE()) AS absent,
        (SELECT COUNT(*) FROM attendance WHERE attendance_status = 'Late' AND DATE(session_date) = CURDATE()) AS late";
    
    $statsResult = $conn->query($statsSql);
    $stats = $statsResult->fetch_assoc();

    $chartSql = "SELECT
        DATE(session_date) as attendance_date,
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN attendance_status = 'Absent' THEN 1 ELSE 0 END) as absentCount
        FROM attendance
        WHERE attendance.session_date BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE()
        GROUP BY attendance_date
        ORDER BY attendance_date ASC";
    
    $chartResult = $conn->query($chartSql);

    $labels = [];
    $presentData = [];
    $absentData = [];
    while ($row = $chartResult->fetch_assoc()) {
        $labels[] = $row['attendance_date'];
        $presentData[] = (int)$row['presentCount'];
        $absentData[] = (int)$row['absentCount'];
    }

    $activitySql = "SELECT user.user_firstname, user.user_lastname, audit_log.description 
                    FROM audit_log
                    JOIN user ON audit_log.user_id = user.user_id
                    WHERE DATE(audit_log.timestamp) = CURDATE()
                    ORDER BY audit_log.timestamp DESC
                    LIMIT 10";
    $activityResult = $conn->query($activitySql);

    $activityLog = [];
    while ($row = $activityResult->fetch_assoc()) {
        $activityLog[] = [
            'user' => $row['user_firstname'] . ' ' . $row['user_lastname'],
            'action' => $row['description']
        ];
    }

    echo json_encode([
        'stats' => $stats,
        'attendanceChart' => [
            'labels' => $labels,
            'presentData' => $presentData,
            'absentData' => $absentData
        ],
        'activityLog' => $activityLog
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}

$conn->close();
?>
