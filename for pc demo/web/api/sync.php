<?php
/**
 * ==============================================================================
 * InfinityFree Full Two-Way Data Sync REST API
 * Handles GET (fetch all tables from MySQL) and POST (save/sync tables to MySQL)
 * ==============================================================================
 */
require_once __DIR__ . '/db_config.php';

$pdo = getDatabaseConnection();

if (!$pdo) {
    sendJsonResponse(false, null, 'MySQL Database not connected. Check /api/db_config.php', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

// -----------------------------------------------------------------------------
// GET: Fetch all active records across all 10 core tables
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    try {
        $data = [
            'companies'        => fetchAllTable($pdo, 'Company'),
            'bir2303'          => fetchAllTable($pdo, 'bir_2303'),
            'customers'        => fetchAllTable($pdo, 'Customers'),
            'sales'            => fetchAllTable($pdo, 'Sales'),
            'collections'      => fetchAllTable($pdo, 'Collections'),
            'serviceProviders' => fetchAllTable($pdo, 'Service_Providers'),
            'expenses'         => fetchAllTable($pdo, 'Expenses'),
            'payments'         => fetchAllTable($pdo, 'Payments'),
            'generalJournal'   => fetchAllTable($pdo, 'General_Journal'),
            'chartOfAccounts'  => fetchAllTable($pdo, 'Chart_of_Accounts'),
            'payroll'          => fetchAllTable($pdo, 'Payroll_and_Employees'),
        ];

        sendJsonResponse(true, $data, 'Successfully retrieved all records from InfinityFree MySQL.');
    } catch (Exception $e) {
        sendJsonResponse(false, null, 'Failed to fetch data: ' . $e->getMessage(), 500);
    }
}

// -----------------------------------------------------------------------------
// POST: Push and synchronize full state to MySQL
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload || !is_array($payload)) {
        sendJsonResponse(false, null, 'Invalid JSON payload provided', 400);
    }

    try {
        $pdo->beginTransaction();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

        // Sync Companies
        if (isset($payload['companies']) && is_array($payload['companies'])) {
            $pdo->exec("TRUNCATE TABLE `Company`");
            $stmt = $pdo->prepare("INSERT INTO `Company` (id, company_name, trade_name, entity_type, company_tin, tin_branch_code, company_address, company_email, company_contact, birthday_or_incorporation_date, rdo, rdo_code, line_of_business, vat_or_non_vat, registration_fee, income_tax, form_0619f, withholding_expanded, withholding_compensation, withholding_fringe_benefit, date_of_entry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['companies'] as $c) {
                $stmt->execute([
                    $c['id'] ?? null,
                    $c['company_name'] ?? 'Unnamed Entity',
                    $c['trade_name'] ?? $c['company_name'] ?? '',
                    $c['entity_type'] ?? 'CORPORATION',
                    $c['company_tin'] ?? '000-000-000-00000',
                    $c['tin_branch_code'] ?? '00000',
                    $c['company_address'] ?? $c['registered_address'] ?? '',
                    $c['company_email'] ?? '',
                    $c['company_contact'] ?? '',
                    $c['birthday_or_incorporation_date'] ?? null,
                    $c['rdo'] ?? '',
                    $c['rdo_code'] ?? '',
                    $c['line_of_business'] ?? '',
                    $c['vat_or_non_vat'] ?? 'VATABLE',
                    (!empty($c['registration_fee']) && $c['registration_fee'] !== 'No') ? 'Yes' : 'No',
                    (!empty($c['income_tax']) && $c['income_tax'] !== 'No') ? 'Yes' : 'No',
                    (!empty($c['form_0619f']) && $c['form_0619f'] !== 'No') ? 'Yes' : 'No',
                    (!empty($c['withholding_expanded']) && $c['withholding_expanded'] !== 'No') ? 'Yes' : 'No',
                    (!empty($c['withholding_compensation']) && $c['withholding_compensation'] !== 'No') ? 'Yes' : 'No',
                    (!empty($c['withholding_fringe_benefit']) && $c['withholding_fringe_benefit'] !== 'No') ? 'Yes' : 'No',
                    $c['date_of_entry'] ?? date('Y-m-d')
                ]);
            }
        }

        // Sync Customers
        if (isset($payload['customers']) && is_array($payload['customers'])) {
            $pdo->exec("TRUNCATE TABLE `Customers`");
            $stmt = $pdo->prepare("INSERT INTO `Customers` (id, customer_name, trade_name, entity_type, customer_tin, tin_branch_code, customer_address, customer_email, customer_contact, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['customers'] as $cust) {
                $stmt->execute([
                    $cust['id'] ?? null,
                    $cust['customer_name'] ?? $cust['name'] ?? '',
                    $cust['trade_name'] ?? '',
                    $cust['entity_type'] ?? 'CORPORATION',
                    $cust['customer_tin'] ?? $cust['tin'] ?? '',
                    $cust['tin_branch_code'] ?? '00000',
                    $cust['customer_address'] ?? $cust['address'] ?? '',
                    $cust['customer_email'] ?? $cust['email'] ?? '',
                    $cust['customer_contact'] ?? $cust['contact'] ?? '',
                    $cust['company_name'] ?? ''
                ]);
            }
        }

        // Sync Sales
        if (isset($payload['sales']) && is_array($payload['sales'])) {
            $pdo->exec("TRUNCATE TABLE `Sales`");
            $stmt = $pdo->prepare("INSERT INTO `Sales` (id, transaction_date, invoice_no, customer_name, customer_tin, customer_address, description_of_goods_or_services, amount, vat_amount, net_amount, cwt_rate, cwt_amount, sales_terms, amount_due, account_code, account_title, status, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['sales'] as $s) {
                $stmt->execute([
                    $s['id'] ?? null,
                    $s['transaction_date'] ?? $s['date'] ?? date('Y-m-d'),
                    $s['invoice_no'] ?? $s['invoice_number'] ?? '',
                    $s['customer_name'] ?? '',
                    $s['customer_tin'] ?? '',
                    $s['customer_address'] ?? '',
                    $s['description_of_goods_or_services'] ?? $s['description'] ?? '',
                    floatval($s['amount'] ?? $s['gross_amount'] ?? 0),
                    floatval($s['vat_amount'] ?? 0),
                    floatval($s['net_amount'] ?? 0),
                    floatval($s['cwt_rate'] ?? 0),
                    floatval($s['cwt_amount'] ?? 0),
                    $s['sales_terms'] ?? '30 Days',
                    floatval($s['amount_due'] ?? $s['net_amount'] ?? $s['amount'] ?? 0),
                    $s['account_code'] ?? '4010',
                    $s['account_title'] ?? 'Service Revenue',
                    $s['status'] ?? 'Open',
                    $s['company_name'] ?? ''
                ]);
            }
        }

        // Sync Collections
        if (isset($payload['collections']) && is_array($payload['collections'])) {
            $pdo->exec("TRUNCATE TABLE `Collections`");
            $stmt = $pdo->prepare("INSERT INTO `Collections` (id, collection_date, reference_no, invoice_no, customer_name, customer_tin, amount_collected, cwt_withheld, net_cash_received, payment_method, account_code, account_title, remarks, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['collections'] as $col) {
                $stmt->execute([
                    $col['id'] ?? null,
                    $col['collection_date'] ?? $col['date'] ?? date('Y-m-d'),
                    $col['reference_no'] ?? $col['ref_no'] ?? '',
                    $col['invoice_no'] ?? '',
                    $col['customer_name'] ?? '',
                    $col['customer_tin'] ?? '',
                    floatval($col['amount_collected'] ?? $col['gross_amount'] ?? 0),
                    floatval($col['cwt_withheld'] ?? 0),
                    floatval($col['net_cash_received'] ?? $col['amount_collected'] ?? 0),
                    $col['payment_method'] ?? 'Bank Transfer',
                    $col['account_code'] ?? '1010',
                    $col['account_title'] ?? 'Cash in Bank',
                    $col['remarks'] ?? '',
                    $col['company_name'] ?? ''
                ]);
            }
        }

        // Sync Service Providers
        if (isset($payload['serviceProviders']) && is_array($payload['serviceProviders'])) {
            $pdo->exec("TRUNCATE TABLE `Service_Providers`");
            $stmt = $pdo->prepare("INSERT INTO `Service_Providers` (id, provider_name, trade_name, provider_tin, tin_branch_code, provider_address, vat_type, entity_type, atc_code, ewt_rate, provider_email, provider_contact, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['serviceProviders'] as $sp) {
                $stmt->execute([
                    $sp['id'] ?? null,
                    $sp['provider_name'] ?? $sp['name'] ?? '',
                    $sp['trade_name'] ?? '',
                    $sp['provider_tin'] ?? $sp['tin'] ?? '',
                    $sp['tin_branch_code'] ?? '00000',
                    $sp['provider_address'] ?? $sp['address'] ?? '',
                    $sp['vat_type'] ?? 'VATABLE',
                    $sp['entity_type'] ?? 'CORPORATION',
                    $sp['atc_code'] ?? 'WC100',
                    floatval($sp['ewt_rate'] ?? 2.0),
                    $sp['provider_email'] ?? '',
                    $sp['provider_contact'] ?? '',
                    $sp['company_name'] ?? ''
                ]);
            }
        }

        // Sync Expenses
        if (isset($payload['expenses']) && is_array($payload['expenses'])) {
            $pdo->exec("TRUNCATE TABLE `Expenses`");
            $stmt = $pdo->prepare("INSERT INTO `Expenses` (id, transaction_date, invoice_no, provider_name, provider_tin, provider_address, description_of_expense, gross_amount, vat_amount, net_amount, ewt_rate, ewt_amount, amount_payable, account_code, account_title, atc_code, status, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['expenses'] as $exp) {
                $stmt->execute([
                    $exp['id'] ?? null,
                    $exp['transaction_date'] ?? $exp['date'] ?? date('Y-m-d'),
                    $exp['invoice_no'] ?? $exp['invoice_number'] ?? '',
                    $exp['provider_name'] ?? $exp['supplier_name'] ?? '',
                    $exp['provider_tin'] ?? '',
                    $exp['provider_address'] ?? '',
                    $exp['description_of_expense'] ?? $exp['description'] ?? '',
                    floatval($exp['gross_amount'] ?? $exp['amount'] ?? 0),
                    floatval($exp['vat_amount'] ?? 0),
                    floatval($exp['net_amount'] ?? 0),
                    floatval($exp['ewt_rate'] ?? 0),
                    floatval($exp['ewt_amount'] ?? 0),
                    floatval($exp['amount_payable'] ?? $exp['gross_amount'] ?? 0),
                    $exp['account_code'] ?? '6010',
                    $exp['account_title'] ?? 'Operating Expenses',
                    $exp['atc_code'] ?? '',
                    $exp['status'] ?? 'Open',
                    $exp['company_name'] ?? ''
                ]);
            }
        }

        // Sync Payments
        if (isset($payload['payments']) && is_array($payload['payments'])) {
            $pdo->exec("TRUNCATE TABLE `Payments`");
            $stmt = $pdo->prepare("INSERT INTO `Payments` (id, payment_date, voucher_no, invoice_no, provider_name, provider_tin, amount_paid, ewt_deducted, net_cash_disbursed, payment_method, account_code, account_title, remarks, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['payments'] as $p) {
                $stmt->execute([
                    $p['id'] ?? null,
                    $p['payment_date'] ?? $p['date'] ?? date('Y-m-d'),
                    $p['voucher_no'] ?? $p['ref_no'] ?? '',
                    $p['invoice_no'] ?? '',
                    $p['provider_name'] ?? $p['payee'] ?? '',
                    $p['provider_tin'] ?? '',
                    floatval($p['amount_paid'] ?? $p['gross_amount'] ?? 0),
                    floatval($p['ewt_deducted'] ?? 0),
                    floatval($p['net_cash_disbursed'] ?? $p['amount_paid'] ?? 0),
                    $p['payment_method'] ?? 'Check / Online Transfer',
                    $p['account_code'] ?? '1010',
                    $p['account_title'] ?? 'Cash in Bank',
                    $p['remarks'] ?? '',
                    $p['company_name'] ?? ''
                ]);
            }
        }

        // Sync General Journal
        if (isset($payload['generalJournal']) && is_array($payload['generalJournal'])) {
            $pdo->exec("TRUNCATE TABLE `General_Journal`");
            $stmt = $pdo->prepare("INSERT INTO `General_Journal` (id, entry_date, entry_number, reference_no, ref_type, source_module, account_code, account_title, debit, credit, explanation, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['generalJournal'] as $gj) {
                $stmt->execute([
                    $gj['id'] ?? null,
                    $gj['entry_date'] ?? $gj['date'] ?? date('Y-m-d'),
                    $gj['entry_number'] ?? $gj['entry_no'] ?? '',
                    $gj['reference_no'] ?? $gj['ref_no'] ?? '',
                    $gj['ref_type'] ?? 'General',
                    $gj['source_module'] ?? 'General Journal',
                    $gj['account_code'] ?? '1010',
                    $gj['account_title'] ?? 'Cash and Cash Equivalents',
                    floatval($gj['debit'] ?? 0),
                    floatval($gj['credit'] ?? 0),
                    $gj['explanation'] ?? $gj['description'] ?? '',
                    $gj['company_name'] ?? ''
                ]);
            }
        }

        // Sync Chart of Accounts
        if (isset($payload['chartOfAccounts']) && is_array($payload['chartOfAccounts'])) {
            $pdo->exec("TRUNCATE TABLE `Chart_of_Accounts`");
            $stmt = $pdo->prepare("INSERT INTO `Chart_of_Accounts` (id, account_code, account_title, account_category, financial_statement, normal_balance, description) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($payload['chartOfAccounts'] as $coa) {
                $stmt->execute([
                    $coa['id'] ?? null,
                    $coa['account_code'] ?? $coa['code'] ?? '',
                    $coa['account_title'] ?? $coa['title'] ?? '',
                    $coa['account_category'] ?? $coa['category'] ?? 'Current Assets',
                    $coa['financial_statement'] ?? $coa['fs_type'] ?? 'Financial Position',
                    $coa['normal_balance'] ?? $coa['balance_type'] ?? 'Debit',
                    $coa['description'] ?? ''
                ]);
            }
        }

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        $pdo->commit();

        sendJsonResponse(true, null, 'Successfully synchronized all records to InfinityFree MySQL database!');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(false, null, 'Database synchronization error: ' . $e->getMessage(), 500);
    }
}

/**
 * Helper to fetch all rows safely
 */
function fetchAllTable($pdo, $tableName) {
    try {
        $stmt = $pdo->query("SELECT * FROM `{$tableName}` ORDER BY `id` ASC");
        return $stmt->fetchAll();
    } catch (Exception $e) {
        return [];
    }
}
?>
