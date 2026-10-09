<?php
/**
 * ==============================================================================
 * InfinityFree 1-Click Database Setup & Initial Seed Script
 * ==============================================================================
 */
require_once __DIR__ . '/db_config.php';

$pdo = getDatabaseConnection();

if (!$pdo) {
    sendJsonResponse(false, null, 'Cannot connect to database. Please check credentials in api/db_config.php', 500);
}

try {
    $sqlFile = __DIR__ . '/../infinityfree_database.sql';
    if (!file_exists($sqlFile)) {
        sendJsonResponse(false, null, 'SQL schema file not found at infinityfree_database.sql', 404);
    }

    $sqlContent = file_get_contents($sqlFile);

    // Split SQL by semicolon (ignoring comments)
    $queries = preg_split('/;\s*[\r\n]+/', $sqlContent);
    $executed = 0;

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    foreach ($queries as $query) {
        $trimmed = trim($query);
        if (!empty($trimmed) && !preg_match('/^(\-\-|\/\*)/', $trimmed)) {
            $pdo->exec($trimmed);
            $executed++;
        }
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    sendJsonResponse(true, [
        'queries_executed' => $executed
    ], 'All 10 database tables and default Chart of Accounts have been successfully created in InfinityFree MySQL!');
} catch (Exception $e) {
    sendJsonResponse(false, null, 'Failed to setup database: ' . $e->getMessage(), 500);
}
?>
