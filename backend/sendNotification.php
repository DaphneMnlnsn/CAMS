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

    $user_id = $data['user_id'] ?? null;
    $notif_type = $data['notif_type'] ?? null;
    $notif_message = $data['notif_message'] ?? null;
    $notif_read = 0;
    $notif_date = date("Y-m-d H:i:s");

    if (!$user_id || !$notif_type || !$notif_message) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read) VALUES (?, ?, ?, NOW(), ?)");
    $stmt->bind_param("issi", $user_id, $notif_message, $notif_type, $notif_read);

    if ($stmt->execute()) {
        logAction($conn, $_SESSION['user_id'], 'Send Notification', "Sent '$notif_type' to user_id $user_id");
        echo json_encode(['success' => 'Notification sent']);
        http_response_code(201);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to insert notification']);
    }

    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
}

$conn->close();
?>