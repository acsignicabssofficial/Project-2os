<?php
/**
 * ==============================================================================
 * InfinityFree MySQL Connection & Health Check Endpoint
 * ==============================================================================
 */
require_once __DIR__ . '/db_config.php';

$pdo = getDatabaseConnection();

if (!$pdo) {
    sendJsonResponse(false, [
        'connected' => false,
        'host'      => DB_HOST,
        'database'  => DB_NAME,
        'user'      => DB_USER,
        'error'     => 'Could not connect to MySQL server. Please verify your credentials in /api/db_config.php'
    ], 'Database connection failed', 500);
}

// Check tables
$tables = [];
$expectedTables = [
    'Company', 'bir_2303', 'Customers', 'Sales', 'Collections', 
    'Service_Providers', 'Expenses', 'Payments', 'General_Journal', 
    'Chart_of_Accounts', 'Payroll_and_Employees'
];

try {
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    $missingTables = array_diff($expectedTables, $tables);

    sendJsonResponse(true, [
        'connected'       => true,
        'host'            => DB_HOST,
        'database'        => DB_NAME,
        'existing_tables' => $tables,
        'missing_tables'  => array_values($missingTables),
        'is_schema_ready' => count($missingTables) === 0
    ], 'Successfully connected to InfinityFree MySQL database!');
} catch (Exception $e) {
    sendJsonResponse(false, null, 'Error querying database: ' . $e->getMessage(), 500);
}
?>
