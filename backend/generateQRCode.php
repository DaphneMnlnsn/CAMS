<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['courseassign_id']) || empty($_GET['courseassign_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing courseassign_id']);
        exit();
    }
    
    $courseassign_id = intval($_GET['courseassign_id']);
    if ($courseassign_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid courseassign_id']);
        exit();
    }

    $checkSql = "SELECT * FROM qrcode_session 
                 WHERE courseassign_id = ? 
                   AND expiration_time > NOW() 
                 ORDER BY expiration_time DESC 
                 LIMIT 1";

    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('i', $courseassign_id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {
        $existing = $result->fetch_assoc();

        echo json_encode([
            'status' => 'existing',
            'message' => 'A valid QR code already exists.',
            'qr_image' => $existing['qr_image'],
            'code' => $existing['code'],
            'expiration_time' => $existing['expiration_time'],
            'late_time' => $existing['late_time']
        ]);
    } else {
        echo json_encode(['status' => 'not_found']);
    }
    exit();
}


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'phpqrcode/qrlib.php';

$data = json_decode(file_get_contents('php://input'), true);
$courseassign_id = $data['courseassign_id'] ?? null;
$expiration_time = $data['expiration_time'] ?? null;
$late_time = $data['late_time'] ?? null;

if (!$courseassign_id || !$expiration_time || !$late_time) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

function generateRandomCode($length = 8) {
    return substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, $length);
}

$code = generateRandomCode();
$qrText = "attendance:$courseassign_id:$code";

$qrDir = __DIR__ . '/qr_images/';
if (!file_exists($qrDir)) {
    mkdir($qrDir, 0777, true);
}

$qrFileName = 'qr_' . $courseassign_id . '_' . time() . '.png';
$qrFilePath = $qrDir . $qrFileName;

QRcode::png($qrText, $qrFilePath, QR_ECLEVEL_L, 4);
if (!file_exists($qrFilePath)) {
    error_log("QR code generation failed for path: " . $qrFilePath);
    http_response_code(500);
    echo json_encode(['error' => 'QR code generation failed']);
    exit();
}

$sql = "INSERT INTO qrcode_session (courseassign_id, qr_image, code, expiration_time, late_time, date_created)
        VALUES (?, ?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
    exit();
}

$stmt->bind_param('issss', $courseassign_id, $qrFileName, $code, $expiration_time, $late_time);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'qr_image' => $qrFileName, 'code' => $code]);
    $user_id = $_SESSION['user_id'] ?? null;
    if ($user_id) {
        logAction($conn, $user_id,'Generate QR', "Generated a QR Code for courseassign_id $courseassign_id");
    }
}else{
    http_response_code(500);
    echo json_encode(['error' => 'Execute failed: ' . $stmt->error]);
    exit();
}
$conn->close();
?>