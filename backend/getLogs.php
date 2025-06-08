<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

require_once 'config.php';

$startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
$endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;

$logs = [];

if ($startDate && $endDate) {
    $sql = "SELECT * FROM audit_log 
            INNER JOIN user ON audit_log.user_id = user.user_id 
            WHERE DATE(timestamp) BETWEEN ? AND ? ORDER BY audit_log.timestamp DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $sql = "SELECT * FROM audit_log 
            INNER JOIN user ON audit_log.user_id = user.user_id  ORDER BY audit_log.timestamp DESC";
    $result = $conn->query($sql);
}

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
}

echo json_encode($logs);

$conn->close();
?>
