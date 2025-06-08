<?php

function logAction($conn, $userId, $actionType, $description) {
    $stmt = $conn->prepare("INSERT INTO audit_log (user_id, action_type, description, timestamp) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("iss", $userId, $actionType, $description);
    $stmt->execute();
    $stmt->close();
}

?>