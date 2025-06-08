<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

function generateRandomCode($length = 8) {
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

function generateUniqueCode($conn, $length = 8) {
    do {
        $code = generateRandomCode($length);
        $count = 0;

        $stmt = $conn->prepare("SELECT COUNT(*) FROM course_assignment WHERE enrollment_code = ?");
        $stmt->bind_param("s", $code);
        $stmt->execute();
        $stmt->bind_result($count);
        $stmt->fetch();
        $stmt->close();
    } while ($count > 0);

    return $code;
}


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $courseID = isset($data['courseID']) ? $data['courseID'] : '';
    $courseTime = isset($data['courseTime']) ? $data['courseTime'] : '';
    $courseRoom = isset($data['courseRoom']) ? $data['courseRoom'] : '';
    $courseDays = isset($data['courseDays']) ? $data['courseDays'] : '';
    $courseSection = isset($data['courseSection']) ? $data['courseSection'] : '';
    $enrollmentCode = generateUniqueCode($conn, 8);

    if (empty($courseID) || empty($courseSection)) {
        echo json_encode(['error' => 'Missing required fields']);
        http_response_code(400);
        exit();
    }

    $sectionSchedule = implode(', ', $courseDays) . ' : ' . $courseTime;

    $stmt = $conn->prepare("INSERT INTO course_assignment (course_id, section_id, instructor_id, section_schedule, section_room, enrollment_code) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $courseID, $courseSection, $_SESSION['user_id'], $sectionSchedule, $courseRoom, $enrollmentCode);

    if ($stmt->execute()) {
        $insertedID = $conn->insert_id;
        logAction($conn, $_SESSION['user_id'], 'Add Handled Course', "Added handled course: $courseID to section $courseSection");
        echo json_encode(['success' => 'Handled course added successfully', 'courseassign_id' => $insertedID]);
        http_response_code(201);
    } else {
        echo json_encode(['error' => 'Error adding handled course']);
        http_response_code(500);
    }

    $stmt->close();
} else {
    echo json_encode(['error' => 'Invalid request method']);
    http_response_code(405);
}

$conn->close();

?>