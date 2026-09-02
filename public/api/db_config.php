<?php
/**
 * ==============================================================================
 * InfinityFree MySQL Database Configuration & PDO Helper
 * ==============================================================================
 * Update the 4 credentials below with your InfinityFree MySQL details from:
 * InfinityFree Control Panel -> MySQL Databases
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -----------------------------------------------------------------------------
// CONFIGURE YOUR INFINITYFREE MYSQL CREDENTIALS HERE:
// -----------------------------------------------------------------------------
define('DB_HOST', getenv('DB_HOST') ?: 'sql207.infinityfree.com'); 
define('DB_USER', getenv('DB_USER') ?: 'if0_42718715');           
define('DB_PASS', getenv('DB_PASS') ?: 'Your_vPanel_Password');  // Ilagay dito ang vPanel / account password mo
define('DB_NAME', getenv('DB_NAME') ?: 'if0_42718715_2os_database');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

/**
 * Returns active PDO MySQL Connection
 */
function getDatabaseConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Return null if not connected, allowing caller to handle gracefully
        return null;
    }
}

/**
 * Standard JSON Response helper
 */
function sendJsonResponse($success, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'data'      => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
?>
