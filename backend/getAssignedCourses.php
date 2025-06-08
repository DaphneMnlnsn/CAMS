<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

require_once 'config.php';

$sql = "SELECT * FROM course_assignment 
        JOIN course ON course_assignment.course_id = course.course_id 
        JOIN section ON course_assignment.section_id = section.section_id 
        WHERE course_assignment.instructor_id = {$_SESSION['user_id']} AND course_assignment.archived = 0";
$result = $conn->query($sql);

$courses = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $courses[] = $row;
    }
}

echo json_encode($courses);

$conn->close();
?>
