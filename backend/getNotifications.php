<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "User ID not set in session"]);
    exit;
}

$notifications = [];

    $sql = "SELECT notification_id, user_id, notification_message, notification_type, 
                   notification_date, notification_read 
            FROM notification
            WHERE user_id = ? 
            ORDER BY notification_date DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            "id" => $row['notification_id'],
            "user_id" => $row['user_id'],
            "message" => $row['notification_message'],
            "type" => $row['notification_type'],
            "date" => $row['notification_date'],
            "status" => $row['notification_read'] == 0 ? "Unread" : "Read"
        ];
    }
}

echo json_encode(["notifications" => $notifications]);

$conn->close();
