<?php
/**
 * ==============================================================================
 * InfinityFree MySQL Live Database Dump & Export Script
 * Generates ready-to-import .sql backup directly from the database
 * ==============================================================================
 */
require_once __DIR__ . '/db_config.php';

$pdo = getDatabaseConnection();

if (!$pdo) {
    header('Content-Type: text/plain');
    die("-- Error: Could not connect to MySQL server. Check api/db_config.php");
}

$filename = "infinityfree_backup_" . date('Y_m_d_His') . ".sql";

header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . $filename . '"');

echo "-- ==============================================================================\n";
echo "-- InfinityFree MySQL Live Export\n";
echo "-- Generated at: " . date('Y-m-d H:i:s') . "\n";
echo "-- ==============================================================================\n\n";
echo "SET NAMES utf8mb4;\n";
echo "SET FOREIGN_KEY_CHECKS = 0;\n\n";

$tables = ['Company', 'bir_2303', 'Customers', 'Sales', 'Collections', 'Service_Providers', 'Expenses', 'Payments', 'General_Journal', 'Chart_of_Accounts', 'Payroll_and_Employees'];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
        $row = $stmt->fetch(PDO::FETCH_NUM);
        if ($row) {
            echo "-- Table structure for `{$table}`\n";
            echo "DROP TABLE IF EXISTS `{$table}`;\n";
            echo $row[1] . ";\n\n";

            // Export rows
            $dataStmt = $pdo->query("SELECT * FROM `{$table}`");
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                echo "-- Dumping data for `{$table}`\n";
                foreach ($rows as $r) {
                    $keys = array_map(function($k) { return "`" . $k . "`"; }, array_keys($r));
                    $values = array_map(function($v) use ($pdo) {
                        if ($v === null) return "NULL";
                        return $pdo->quote($v);
                    }, array_values($r));

                    echo "INSERT INTO `{$table}` (" . implode(", ", $keys) . ") VALUES (" . implode(", ", $values) . ");\n";
                }
                echo "\n";
            }
        }
    } catch (Exception $e) {
        echo "-- Warning: Could not dump table `{$table}`: " . $e->getMessage() . "\n";
    }
}

echo "SET FOREIGN_KEY_CHECKS = 1;\n";
exit;
?>
