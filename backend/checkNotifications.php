<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

require_once 'config.php';

$response = [
    "status" => "ok",
    "messages" => []
];

date_default_timezone_set('Asia/Manila');
$nowDay = date("l");
$nowTime = date("H:i");
$today = date("Y-m-d");

$sqlSchedule = "SELECT courseassign_id, instructor_id, section_schedule FROM course_assignment";
$stmt = $conn->prepare($sqlSchedule);
$stmt->execute();
$result = $stmt->get_result();

$activeClasses = [];

while ($row = $result->fetch_assoc()) {
    $courseassign_id = $row['courseassign_id'];
    $instructor_id = $row['instructor_id'];
    $schedule = $row['section_schedule'];

    $response["messages"][] = "Checking schedule: $schedule for courseassign $courseassign_id";

    $parts = explode(":", $schedule, 2);
    if (count($parts) !== 2) {
        $response["messages"][] = "Invalid schedule format, skipping.";
        continue;
    }

    $daysPart = trim($parts[0]);
    $timePart = trim($parts[1]);

    $days = array_map('trim', explode(",", $daysPart));
    $response["messages"][] = "Days parsed: " . implode(", ", $days);

    if (!in_array($nowDay, $days)) {
        $response["messages"][] = "Today ($nowDay) not in scheduled days.";
        continue;
    }

    $times = array_map('trim', explode("-", $timePart));
    if (count($times) !== 2) {
        $response["messages"][] = "Invalid time format, skipping.";
        continue;
    }

    $startTime = date("H:i", strtotime($times[0]));
    $endTime = date("H:i", strtotime($times[1]));

    $response["messages"][] = "Start time: $startTime, End time: $endTime";

    $graceStart = date("H:i", strtotime("$startTime -5 minutes"));
    $graceEnd = date("H:i", strtotime("$endTime +5 minutes"));

    $response["messages"][] = "Grace start: $graceStart, Grace end: $graceEnd";

    if ($nowTime >= $graceStart && $nowTime <= $graceEnd) {
        $response["messages"][] = "Current time $nowTime IS within grace period.";
        $activeClasses[] = ['courseassign_id' => $courseassign_id, 'instructor_id' => $instructor_id];

        $sqlCheckQR = "SELECT qrsession_id FROM qrcode_session WHERE courseassign_id = ? AND DATE(date_created) = ?";
        $stmtQR = $conn->prepare($sqlCheckQR);
        $stmtQR->bind_param("is", $courseassign_id, $today);
        $stmtQR->execute();
        $resQR = $stmtQR->get_result();

        if ($resQR->num_rows === 0) {
            $notifMsg = "You have not generated a QR code for your class today (CourseAssign ID: $courseassign_id).";
            $notifType = "QR Code Reminder";
            $notifDate = date("Y-m-d H:i:s");

            $sqlCheckNotif = "SELECT notification_id FROM notification WHERE user_id = ? AND notification_message = ? LIMIT 1";
            $stmtCheck = $conn->prepare($sqlCheckNotif);
            $stmtCheck->bind_param("is", $instructor_id, $notifMsg);
            $stmtCheck->execute();
            $resCheck = $stmtCheck->get_result();

            if ($resCheck->num_rows === 0) {
                $sqlInsert = "INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read) VALUES (?, ?, ?, ?, 0)";
                $stmtInsert = $conn->prepare($sqlInsert);
                $stmtInsert->bind_param("isss", $instructor_id, $notifMsg, $notifType, $notifDate);
                $stmtInsert->execute();
                $response["messages"][] = "Inserted QR reminder for instructor $instructor_id for courseassign $courseassign_id";
            } else {
                $response["messages"][] = "QR reminder already exists for instructor $instructor_id for courseassign $courseassign_id";
            }
        } else {
            $response["messages"][] = "QR code already generated for courseassign $courseassign_id";
        }
    } else {
        $response["messages"][] = "Current time $nowTime is NOT within grace period.";
    }
}

$absenceThreshold = 3;

$sqlAbsents = "
    SELECT student_id, courseassign_id, COUNT(*) as total_absent 
    FROM attendance 
    WHERE attendance_status = 'Absent'
    GROUP BY student_id, courseassign_id
    HAVING total_absent > ?
";
$stmt = $conn->prepare($sqlAbsents);
$stmt->bind_param("i", $absenceThreshold);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $studentId = $row['student_id'];
    $courseassignId = $row['courseassign_id'];

    $sqlInstructor = "SELECT instructor_id FROM course_assignment WHERE courseassign_id = ?";
    $stmtInstr = $conn->prepare($sqlInstructor);
    $stmtInstr->bind_param("i", $courseassignId);
    $stmtInstr->execute();
    $resInstr = $stmtInstr->get_result();

    if ($resInstr->num_rows > 0) {
        $instructorId = $resInstr->fetch_assoc()['instructor_id'];

        $notifMsg = "Student ID $studentId has exceeded $absenceThreshold absences in CourseAssign ID $courseassignId.";
        $notifType = "Absences Exceeded";
        $notifDate = date("Y-m-d H:i:s");

        $sqlCheck = "SELECT notification_id FROM notification WHERE user_id = ? AND notification_message = ? LIMIT 1";
        $stmtCheck = $conn->prepare($sqlCheck);
        $stmtCheck->bind_param("is", $instructorId, $notifMsg);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();

        if ($resCheck->num_rows === 0) {
            $sqlInsert = "INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read) VALUES (?, ?, ?, ?, 0)";
            $stmtInsert = $conn->prepare($sqlInsert);
            $stmtInsert->bind_param("isss", $instructorId, $notifMsg, $notifType, $notifDate);
            $stmtInsert->execute();
            $response["messages"][] = "Inserted exceeded absence notif for instructor $instructorId";
        }
    }
}

echo json_encode($response);
$conn->close();
?>
