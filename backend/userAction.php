<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];
$action = $data['action'];

if (!$id || !$action) {
    echo json_encode(["error" => "Missing ID or action"]);
    exit();
}

switch ($action) {
    case 'archive':
        $stmt = $conn->prepare("UPDATE user SET archived = 1 WHERE user_id = ?");
        break;
    case 'restore':
        $stmt = $conn->prepare("UPDATE user SET archived = 0 WHERE user_id = ?");
        break;
    case 'delete':
        $stmt = $conn->prepare("DELETE FROM user WHERE user_id = ?");
        break;
    default:
        echo json_encode(["error" => "Invalid action"]);
        $conn->close();
        exit();
}

$stmt->bind_param("s", $id);
if ($stmt->execute()) {
    $desc = ucfirst($action) . "d user ID $id";
    logAction($conn, $_SESSION['user_id'], ucfirst($action), $desc);
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Failed to execute action"]);
}

$stmt->close();
$conn->close();
?>
