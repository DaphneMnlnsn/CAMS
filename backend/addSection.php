<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

    $sectionName = isset($data['sectionName']) ? $data['sectionName'] : '';
    $sectionSemester = isset($data['sectionSemester']) ? $data['sectionSemester'] : '';
    $sectionYear = isset($data['sectionYear']) ? $data['sectionYear'] : '';
    $sectionMajor = isset($data['sectionMajor']) ? $data['sectionMajor'] : '';

    if (empty($sectionName) || empty($sectionSemester) || empty($sectionYear) || empty($sectionMajor)) {
        echo json_encode(['error' => 'Missing required fields']);
        http_response_code(400);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO section (section_name, section_semester, section_year, section_major) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $sectionName, $sectionSemester, $sectionYear, $sectionMajor);

    if ($stmt->execute()) {
        logAction($conn, $_SESSION['user_id'], 'Add Section', "Added section: $sectionName ($sectionYear - $sectionSemester)");
        echo json_encode(['success' => 'Section added successfully']);
        http_response_code(201);
    } else {
        echo json_encode(['error' => 'Error adding section']);
        http_response_code(500);
    }

    $stmt->close();
} else {
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
}

$conn->close();

?>