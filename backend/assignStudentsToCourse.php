<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auditLog.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_start();

    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? 'assign';
    $courseassign_id = $data['handledID'] ?? null;
    $students = $data['students']   ?? [];

    if (!$courseassign_id) {
        echo json_encode(['error' => 'Missing course assignment ID']);
        http_response_code(400);
        exit();
    }

    if (empty($students) && $action === 'assign') {
        echo json_encode(['success' => 'No students to assign (skipped)']);
        http_response_code(200);
        exit();
    }

    if ($action === 'assign') {
        $stmt = $conn->prepare("
            INSERT IGNORE INTO student_course (courseassign_id, student_id)
            VALUES (?, ?)
        ");
        foreach ($students as $student_id) {
            $stmt->bind_param("ss", $courseassign_id, $student_id);
            $stmt->execute();
        }
        $stmt->close();

        $studentCount = count($students);
        logAction(
          $conn,
          $_SESSION['user_id'],
          'Assign Students',
          "Assigned $studentCount student(s) to handled course ID $courseassign_id"
        );

        echo json_encode(['success' => 'Students assigned successfully']);
        http_response_code(200);

    } elseif ($action === 'delete') {
        $stmt = $conn->prepare("
            DELETE FROM student_course
             WHERE courseassign_id = ?
               AND student_id       = ?
        ");
        foreach ($students as $student_id) {
            $stmt->bind_param("ss", $courseassign_id, $student_id);
            $stmt->execute();
        }
        $stmt->close();

        $studentCount = count($students);
        logAction(
          $conn,
          $_SESSION['user_id'],
          'Remove Students',
          "Removed $studentCount student(s) from handled course ID $courseassign_id"
        );

        echo json_encode(['success' => true]);
        http_response_code(200);

    } else {
        echo json_encode(['error' => 'Invalid action']);
        http_response_code(400);
    }
}

$conn->close();
?>
