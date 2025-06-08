<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $notification_id = $data['notification_id'] ?? null;

    if (!$notification_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE notification SET notification_resolved = 1, date_resolved = NOW() WHERE notification_id = ?");
    $stmt->bind_param("i", $notification_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => 'Notification resolved']);
        http_response_code(200);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update notification']);
    }

    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
}

$conn->close();
?>
