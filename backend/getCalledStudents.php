<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "
        SELECT 
            n.notification_id AS id,
            u.user_id,
            CONCAT(u.user_firstname, ' ', u.user_lastname) AS name,
            sec.section_name,
            sec.section_year,
            sec.section_semester,
            n.date_resolved,
            n.notification_resolved
        FROM notification n
        LEFT JOIN user u ON n.user_id = u.user_id
        LEFT JOIN attendance a ON a.student_id = u.user_id
        LEFT JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
        LEFT JOIN section sec ON ca.section_id = sec.section_id
        WHERE n.notification_type = 'Absentee Call'
        GROUP BY n.notification_id
        ORDER BY n.notification_date DESC
    ";

    $result = $conn->query($sql);

    if ($result) {
        $students = [];
        while ($row = $result->fetch_assoc()) {
            $students[] = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'name' => $row['name'],
                'section' => $row['section_name'] ?? 'N/A',
                'year' => $row['section_year'] ?? 'N/A',
                'semester' => $row['section_semester'] ?? 'N/A',
                'date_resolved' => $row['date_resolved'],
                'status' => $row['notification_resolved']
            ];
        }
        echo json_encode($students);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch data']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
}

$conn->close();
?>
