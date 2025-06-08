<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = array(
    "absent_today" => array(),
    "absence_warnings" => array(),
    "upcoming_classes" => array()
);

if (!isset($_GET['student_id'])) {
    echo json_encode(array("error" => "Missing student_id"));
    exit();
}

$student_id = $_GET['student_id'];
$today = date('Y-m-d');
$day_name = date('l');
$day_tomorrow = date('l', strtotime('+1 day'));

$current_datetime = date('Y-m-d H:i:s');
$current_time = strtotime(date('H:i'));

$sql1 = "SELECT a.attendance_id, a.session_date, ca.section_schedule 
         FROM attendance a 
         JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
         WHERE a.student_id = '$student_id' 
           AND a.attendance_status = 'Absent' 
           AND DATE(a.session_date) = CURDATE()";
$result1 = mysqli_query($conn, $sql1);
while ($row = mysqli_fetch_assoc($result1)) {
    $response['absent_today'][] = $row;

    $message = "You were marked absent on " . date('Y-m-d', strtotime($row['session_date'])) . ".";
    $type = "Marked Absent";

    $check_sql = "SELECT notification_id FROM notification WHERE user_id = '$student_id' AND notification_message = '" . mysqli_real_escape_string($conn, $message) . "' LIMIT 1";
    $check_res = mysqli_query($conn, $check_sql);

    if (mysqli_num_rows($check_res) == 0) {
        $insert_sql = "INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read)
                       VALUES ('$student_id', '" . mysqli_real_escape_string($conn, $message) . "', '$type', '$current_datetime', 0)";
        mysqli_query($conn, $insert_sql);
    }
}

$sql2 = "SELECT a.courseassign_id, COUNT(*) as total_absences, ca.section_schedule
         FROM attendance a
         JOIN course_assignment ca ON a.courseassign_id = ca.courseassign_id
         WHERE a.student_id = '$student_id' 
           AND a.attendance_status = 'Absent'
         GROUP BY a.courseassign_id
         HAVING total_absences = 2";
$result2 = mysqli_query($conn, $sql2);
while ($row = mysqli_fetch_assoc($result2)) {
    $response['absence_warnings'][] = $row;

    $message = "Warning: You have 2 absences in course ID " . $row['courseassign_id'] . ". Please improve attendance.";
    $type = "Absence Warning";

    $check_sql = "SELECT notification_id FROM notification WHERE user_id = '$student_id' AND notification_message = '" . mysqli_real_escape_string($conn, $message) . "' LIMIT 1";
    $check_res = mysqli_query($conn, $check_sql);

    if (mysqli_num_rows($check_res) == 0) {
        $insert_sql = "INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read)
                       VALUES ('$student_id', '" . mysqli_real_escape_string($conn, $message) . "', '$type', '$current_datetime', 0)";
        mysqli_query($conn, $insert_sql);
    }
}

$sql3 = "SELECT courseassign_id, section_schedule 
         FROM course_assignment 
         WHERE section_schedule LIKE '%$day_name%'";
$result3 = mysqli_query($conn, $sql3);

while ($row = mysqli_fetch_assoc($result3)) {
    $schedule = $row['section_schedule'];

    if (preg_match('/:\s*(\d{1,2}:\d{2}[AP]M)/i', $schedule, $matches)) {
        $start_time_str = $matches[1];
        $start_time = strtotime($start_time_str);

        $minutes_until = ($start_time - $current_time) / 60;

        if ($minutes_until >= 0 && $minutes_until <= 60) {
            $response['upcoming_classes'][] = $row;

            $message = "Your class for course ID " . $row['courseassign_id'] . " starts at " . date('g:i A', $start_time) . " today.";
            $type = "Upcoming Class";

            $check_sql = "SELECT notification_id FROM notification WHERE user_id = '$student_id' AND notification_message = '" . mysqli_real_escape_string($conn, $message) . "' LIMIT 1";
            $check_res = mysqli_query($conn, $check_sql);

            if (mysqli_num_rows($check_res) == 0) {
                $insert_sql = "INSERT INTO notification (user_id, notification_message, notification_type, notification_date, notification_read)
                               VALUES ('$student_id', '" . mysqli_real_escape_string($conn, $message) . "', '$type', '$current_datetime', 0)";
                mysqli_query($conn, $insert_sql);
            }
        }
    }
}

echo json_encode($response);

$conn->close();
?>
