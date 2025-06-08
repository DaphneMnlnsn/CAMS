<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method === 'GET') {
    $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    if (!$student_id) {
        echo json_encode(["status"=>"error","message"=>"Missing student_id"]);
        exit;
    }
    $sql = "SELECT
                notification_id,
                notification_message AS message,
                notification_type    AS type,
                notification_date    AS date,
                notification_read    AS is_read
            FROM notification
            WHERE user_id = ?
            ORDER BY notification_date DESC
            LIMIT 50";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $res = $stmt->get_result();

    $notes = [];
    while ($row = $res->fetch_assoc()) {
        $row['is_read'] = (bool)$row['is_read'];
        $notes[] = $row;
    }
    echo json_encode(["status"=>"ok","notifications"=>$notes]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['notification_id']) ? intval($input['notification_id']) : 0;
    if (!$id) {
        echo json_encode(["status"=>"error","message"=>"Missing notification_id"]);
        exit;
    }
    $sql = "UPDATE notification SET notification_read = 1 WHERE notification_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    if ($ok) {
        echo json_encode(["status"=>"ok","message"=>"Marked as read"]);
    } else {
        echo json_encode(["status"=>"error","message"=>"Update failed"]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["status"=>"error","message"=>"Method not allowed"]);

$conn->close();
?>