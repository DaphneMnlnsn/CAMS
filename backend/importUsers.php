<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method (must be POST).']);
    exit();
}

if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'CSV file not uploaded or invalid.']);
    exit();
}

require_once 'config.php';
require_once 'auditLog.php';

$tmpName = $_FILES['csv_file']['tmp_name'];
$handle = fopen($tmpName, 'r');
if (!$handle) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to open uploaded file for reading.']);
    exit();
}

$stmt = $conn->prepare("
    INSERT INTO user 
      (user_id, user_firstname, user_middlename, user_lastname, user_email, user_role, user_password, user_birthdate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
    exit();
}

$errors = [];
$successfulCount = 0;
$rowNumber = 0;

$firstRow = fgetcsv($handle, 1000, ",");

$isHeader = false;
if (isset($firstRow[0]) && strcasecmp(trim($firstRow[0]), 'idNumber') === 0) {
    $isHeader = true;
}

if (!$isHeader && $firstRow !== false) {
    $rowNumber++;
    $rowsToProcess = [$firstRow];
} else {
    $rowsToProcess = [];
}

while (($next = fgetcsv($handle, 1000, ",")) !== false) {
    $rowsToProcess[] = $next;
}

fclose($handle);

foreach ($rowsToProcess as $row) {
    if ($rowNumber > 0) {
    } else {
        $rowNumber++;
    }

    $allEmpty = true;
    foreach ($row as $cell) {
        if (trim($cell) !== '') {
            $allEmpty = false;
            break;
        }
    }
    if ($allEmpty) {
        continue;
    }

    if (count($row) < 6) {
        $errors[] = "Row {$rowNumber}: Not enough columns (found " . count($row) . ").";
        continue;
    }

    $rawId    = preg_replace('/^\xEF\xBB\xBF/', '', $row[0]);
    $idNumber = trim($rawId);

    $firstName  = trim($row[1]);
    $middleName = trim($row[2]);
    $lastName   = trim($row[3]);
    $email      = trim($row[4]);
    $birthRaw   = trim($row[5]);
    $role       = (isset($row[6])) ? trim($row[6]) : '';

    if ($idNumber === '' ||
        $firstName === '' ||
        $lastName === '' ||
        $email === '' ||
        $birthRaw === '') 
    {
        $errors[] = "Row {$rowNumber}: Missing required field.";
        continue;
    }

    $birthdate = null;
    $dt = DateTime::createFromFormat('n/j/Y', $birthRaw);
    if ($dt && $dt->format('n/j/Y') === $birthRaw) {
        $birthdate = $dt->format('Y-m-d');
    } else {
        $dt2 = DateTime::createFromFormat('Y-m-d', $birthRaw);
        if ($dt2 && $dt2->format('Y-m-d') === $birthRaw) {
            $birthdate = $birthRaw;
        }
    }
    if (!$birthdate) {
        $errors[] = "Row {$rowNumber}: Invalid birthdate (‘{$birthRaw}’). Use M/D/YYYY or YYYY-MM-DD.";
        continue;
    }

    $by = substr($birthdate, 0, 4);
    $bm = substr($birthdate, 5, 2);
    $bd = substr($birthdate, 8, 2);
    $cleanLast = str_replace(' ', '', $lastName);

    if (strcasecmp($role, 'Instructor') === 0) {
        $last6 = substr($idNumber, -6);
        $rawPassword = $cleanLast . $last6 . $by . $bm . $bd;
    } else {
        $rawPassword = $cleanLast . $by . $bm . $bd;
    }
    $hashedPassword = password_hash($rawPassword, PASSWORD_DEFAULT);

    $stmt->bind_param(
        "ssssssss",
        $idNumber,
        $firstName,
        $middleName,
        $lastName,
        $email,
        $role,
        $hashedPassword,
        $birthdate
    );
    if ($stmt->execute()) {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        $actor = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        logAction(
            $conn,
            $actor,
            'Import User',
            "Imported user {$firstName} {$middleName} {$lastName} ({$idNumber})"
        );
        $successfulCount++;
    } else {
        $errors[] = "Row {$rowNumber} (ID {$idNumber}): " . $stmt->error;
    }
}

$stmt->close();
$conn->close();

if ($successfulCount > 0 && empty($errors)) {
    echo json_encode(['success' => "Imported {$successfulCount} user(s) successfully."]);
    http_response_code(201);

} elseif ($successfulCount > 0 && !empty($errors)) {
    echo json_encode([
        'success' => "Imported {$successfulCount} user(s).",
        'errors'  => $errors
    ]);
    http_response_code(206);

} else {
    echo json_encode(['errors' => $errors]);
    http_response_code(400);
}
