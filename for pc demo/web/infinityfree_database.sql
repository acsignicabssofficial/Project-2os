-- ==============================================================================
-- InfinityFree MySQL / MariaDB Database Schema & Seed Script
-- Compatible with phpMyAdmin, InfinityFree vPanel, and standard MySQL 5.7+ / 8.0+
-- Database: 2OS Philippine Accounting & BIR Compliance System
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";

-- -----------------------------------------------------------------------------
-- 1. Table: Company (Company Profiles & Workspaces)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Company`;
CREATE TABLE `Company` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL,
  `trade_name` VARCHAR(255) DEFAULT NULL,
  `entity_type` VARCHAR(100) DEFAULT 'CORPORATION',
  `company_tin` VARCHAR(50) NOT NULL UNIQUE,
  `tin_branch_code` VARCHAR(10) DEFAULT '00000',
  `company_address` TEXT DEFAULT NULL,
  `company_email` VARCHAR(255) DEFAULT NULL,
  `company_contact` VARCHAR(100) DEFAULT NULL,
  `birthday_or_incorporation_date` DATE DEFAULT NULL,
  `rdo` VARCHAR(50) DEFAULT NULL,
  `rdo_code` VARCHAR(50) DEFAULT NULL,
  `line_of_business` VARCHAR(255) DEFAULT NULL,
  `vat_or_non_vat` VARCHAR(50) DEFAULT 'VATABLE',
  `registration_fee` ENUM('Yes', 'No') DEFAULT 'Yes',
  `income_tax` ENUM('Yes', 'No') DEFAULT 'Yes',
  `form_0619f` ENUM('Yes', 'No') DEFAULT 'No',
  `withholding_expanded` ENUM('Yes', 'No') DEFAULT 'Yes',
  `withholding_compensation` ENUM('Yes', 'No') DEFAULT 'Yes',
  `withholding_fringe_benefit` ENUM('Yes', 'No') DEFAULT 'No',
  `date_of_entry` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: bir_2303 (BIR Certificate of Registration Obligations - YES/NO)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bir_2303`;
CREATE TABLE `bir_2303` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_tin` VARCHAR(50) NOT NULL,
  `tin_branch_code` VARCHAR(10) DEFAULT '00000',
  `vat_type` VARCHAR(50) DEFAULT 'VATABLE',
  `Registration_Fee` ENUM('Yes', 'No') DEFAULT 'Yes',
  `Income_Tax` ENUM('Yes', 'No') DEFAULT 'Yes',
  `Final_Withholding_Tax` ENUM('Yes', 'No') DEFAULT 'No',
  `Expanded_Withholding_Tax` ENUM('Yes', 'No') DEFAULT 'Yes',
  `Withholding_on_Compensation` ENUM('Yes', 'No') DEFAULT 'Yes',
  `Fringe_Benefits_Tax` ENUM('Yes', 'No') DEFAULT 'No',
  `Related_party_transactions` ENUM('Yes', 'No') DEFAULT 'No',
  `Monthly_documentary_stamp` ENUM('Yes', 'No') DEFAULT 'No',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tin` (`company_tin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: Customers (Clients Masterlist)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Customers`;
CREATE TABLE `Customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `trade_name` VARCHAR(255) DEFAULT NULL,
  `entity_type` VARCHAR(100) DEFAULT 'CORPORATION',
  `customer_tin` VARCHAR(50) DEFAULT NULL,
  `tin_branch_code` VARCHAR(10) DEFAULT '00000',
  `customer_address` TEXT DEFAULT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `customer_contact` VARCHAR(100) DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_customer_name` (`customer_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: Sales (Sales Journal & Invoicing)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Sales`;
CREATE TABLE `Sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_date` DATE NOT NULL,
  `invoice_no` VARCHAR(100) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_tin` VARCHAR(50) DEFAULT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `description_of_goods_or_services` TEXT DEFAULT NULL,
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `vat_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `cwt_rate` DECIMAL(5, 2) DEFAULT 0.00,
  `cwt_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `sales_terms` VARCHAR(100) DEFAULT '30 Days',
  `amount_due` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `account_code` VARCHAR(50) DEFAULT '4010',
  `account_title` VARCHAR(255) DEFAULT 'Service Revenue',
  `status` VARCHAR(50) DEFAULT 'Open',
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sales_inv` (`invoice_no`),
  INDEX `idx_sales_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: Collections (Cash Receipts & Payment Collections)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Collections`;
CREATE TABLE `Collections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_date` DATE NOT NULL,
  `reference_no` VARCHAR(100) NOT NULL,
  `invoice_no` VARCHAR(100) DEFAULT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_tin` VARCHAR(50) DEFAULT NULL,
  `amount_collected` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `cwt_withheld` DECIMAL(15, 2) DEFAULT 0.00,
  `net_cash_received` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(100) DEFAULT 'Bank Transfer',
  `account_code` VARCHAR(50) DEFAULT '1010',
  `account_title` VARCHAR(255) DEFAULT 'Cash in Bank',
  `remarks` TEXT DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coll_ref` (`reference_no`),
  INDEX `idx_coll_date` (`collection_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: Service_Providers (Vendors & Suppliers)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Service_Providers`;
CREATE TABLE `Service_Providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider_name` VARCHAR(255) NOT NULL,
  `trade_name` VARCHAR(255) DEFAULT NULL,
  `provider_tin` VARCHAR(50) DEFAULT NULL,
  `tin_branch_code` VARCHAR(10) DEFAULT '00000',
  `provider_address` TEXT DEFAULT NULL,
  `vat_type` VARCHAR(50) DEFAULT 'VATABLE',
  `entity_type` VARCHAR(100) DEFAULT 'CORPORATION',
  `atc_code` VARCHAR(50) DEFAULT 'WC100',
  `ewt_rate` DECIMAL(5, 2) DEFAULT 2.00,
  `provider_email` VARCHAR(255) DEFAULT NULL,
  `provider_contact` VARCHAR(100) DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_provider_name` (`provider_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: Expenses (Purchase Journal & Expenses)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Expenses`;
CREATE TABLE `Expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_date` DATE NOT NULL,
  `invoice_no` VARCHAR(100) NOT NULL,
  `provider_name` VARCHAR(255) NOT NULL,
  `provider_tin` VARCHAR(50) DEFAULT NULL,
  `provider_address` TEXT DEFAULT NULL,
  `description_of_expense` TEXT DEFAULT NULL,
  `gross_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `vat_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `ewt_rate` DECIMAL(5, 2) DEFAULT 0.00,
  `ewt_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `amount_payable` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `account_code` VARCHAR(50) DEFAULT '6010',
  `account_title` VARCHAR(255) DEFAULT 'Operating Expenses',
  `atc_code` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Open',
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exp_inv` (`invoice_no`),
  INDEX `idx_exp_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: Payments (Cash Disbursements & Check Voucher Records)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Payments`;
CREATE TABLE `Payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_date` DATE NOT NULL,
  `voucher_no` VARCHAR(100) NOT NULL,
  `invoice_no` VARCHAR(100) DEFAULT NULL,
  `provider_name` VARCHAR(255) NOT NULL,
  `provider_tin` VARCHAR(50) DEFAULT NULL,
  `amount_paid` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `ewt_deducted` DECIMAL(15, 2) DEFAULT 0.00,
  `net_cash_disbursed` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(100) DEFAULT 'Check / Online Transfer',
  `account_code` VARCHAR(50) DEFAULT '1010',
  `account_title` VARCHAR(255) DEFAULT 'Cash in Bank',
  `remarks` TEXT DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pay_vouch` (`voucher_no`),
  INDEX `idx_pay_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: General_Journal (Double Entry Journal Entries)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `General_Journal`;
CREATE TABLE `General_Journal` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entry_date` DATE NOT NULL,
  `entry_number` VARCHAR(100) NOT NULL,
  `reference_no` VARCHAR(100) DEFAULT NULL,
  `ref_type` VARCHAR(50) DEFAULT 'General',
  `source_module` VARCHAR(100) DEFAULT 'General Journal',
  `account_code` VARCHAR(50) NOT NULL,
  `account_title` VARCHAR(255) NOT NULL,
  `debit` DECIMAL(15, 2) DEFAULT 0.00,
  `credit` DECIMAL(15, 2) DEFAULT 0.00,
  `explanation` TEXT DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_gj_no` (`entry_number`),
  INDEX `idx_gj_date` (`entry_date`),
  INDEX `idx_gj_acc` (`account_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Table: Chart_of_Accounts (Standard Chart of Accounts)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Chart_of_Accounts`;
CREATE TABLE `Chart_of_Accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account_code` VARCHAR(50) NOT NULL UNIQUE,
  `account_title` VARCHAR(255) NOT NULL,
  `account_category` VARCHAR(100) NOT NULL,
  `financial_statement` VARCHAR(100) NOT NULL,
  `normal_balance` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coa_code` (`account_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: Payroll_and_Employees (Payroll Ledger & 2316 Line Items)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Payroll_and_Employees`;
CREATE TABLE `Payroll_and_Employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(100) NOT NULL,
  `employee_name` VARCHAR(255) NOT NULL,
  `tin` VARCHAR(50) DEFAULT NULL,
  `civil_status` VARCHAR(50) DEFAULT 'Single',
  `employment_status` VARCHAR(50) DEFAULT 'Regular',
  `is_mwe` ENUM('Yes', 'No') DEFAULT 'No',
  `statutory_mwe_day` DECIMAL(15, 2) DEFAULT 0.00,
  `statutory_mwe_month` DECIMAL(15, 2) DEFAULT 0.00,
  `is_main_employer` ENUM('Yes', 'No') DEFAULT 'Yes',
  `payroll_period` VARCHAR(100) NOT NULL,
  `period_from` DATE DEFAULT NULL,
  `period_to` DATE DEFAULT NULL,
  `basic_pay` DECIMAL(15, 2) DEFAULT 0.00,
  `holiday_pay` DECIMAL(15, 2) DEFAULT 0.00,
  `overtime_pay` DECIMAL(15, 2) DEFAULT 0.00,
  `night_diff` DECIMAL(15, 2) DEFAULT 0.00,
  `hazard_pay` DECIMAL(15, 2) DEFAULT 0.00,
  `thirteenth_month_pay` DECIMAL(15, 2) DEFAULT 0.00,
  `de_minimis` DECIMAL(15, 2) DEFAULT 0.00,
  `sss_deduction` DECIMAL(15, 2) DEFAULT 0.00,
  `philhealth_deduction` DECIMAL(15, 2) DEFAULT 0.00,
  `pagibig_deduction` DECIMAL(15, 2) DEFAULT 0.00,
  `taxable_basic` DECIMAL(15, 2) DEFAULT 0.00,
  `taxable_overtime` DECIMAL(15, 2) DEFAULT 0.00,
  `withholding_tax` DECIMAL(15, 2) DEFAULT 0.00,
  `gross_pay` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_deductions` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `net_pay` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pay_emp` (`employee_id`),
  INDEX `idx_pay_period` (`payroll_period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- SEED DATA: Standard Chart of Accounts (COA)
-- -----------------------------------------------------------------------------
INSERT INTO `Chart_of_Accounts` (`account_code`, `account_title`, `account_category`, `financial_statement`, `normal_balance`, `description`) VALUES
('1010', 'Cash and Cash Equivalents', 'Current Assets', 'Financial Position', 'Debit', 'Cash on hand and petty cash fund'),
('1020', 'Cash in Bank - Primary Operating', 'Current Assets', 'Financial Position', 'Debit', 'Main business checking and savings accounts'),
('1030', 'Accounts Receivable - Trade', 'Current Assets', 'Financial Position', 'Debit', 'Receivables from sales of services or goods'),
('1040', 'Allowance for Doubtful Accounts', 'Current Assets', 'Financial Position', 'Credit', 'Contra-asset account for estimated uncollectible accounts'),
('1050', 'Creditable Withholding Tax (2307 Asset)', 'Current Assets', 'Financial Position', 'Debit', 'Prepaid tax withheld by customers supported by BIR Form 2307'),
('1060', 'Input VAT (12% Purchases & Expenses)', 'Current Assets', 'Financial Position', 'Debit', 'Value added tax paid on allowable business purchases and services'),
('1070', 'Prepaid Expenses and Deposits', 'Current Assets', 'Financial Position', 'Debit', 'Prepaid insurance, advance rent, security deposits'),
('1510', 'Office & Computer Equipment', 'Non-Current Assets', 'Financial Position', 'Debit', 'Hardware, laptops, servers, office machines'),
('1515', 'Accumulated Depreciation - Equipment', 'Non-Current Assets', 'Financial Position', 'Credit', 'Contra-asset for cumulative depreciation on equipment'),
('2010', 'Accounts Payable - Trade', 'Current Liabilities', 'Financial Position', 'Credit', 'Unpaid vendor invoices for goods and services'),
('2020', 'Output VAT (12% Sales & Services)', 'Current Liabilities', 'Financial Position', 'Credit', 'Value added tax collected from clients on taxable sales'),
('2030', 'Expanded Withholding Tax Payable (1601-EQ)', 'Current Liabilities', 'Financial Position', 'Credit', 'Withholding tax deducted from vendor payments payable to BIR'),
('2035', 'Withholding Tax Payable - Compensation (1601-C)', 'Current Liabilities', 'Financial Position', 'Credit', 'Withholding tax on employee salaries payable to BIR'),
('2041', 'SSS Premiums Payable (EE + ER)', 'Current Liabilities', 'Financial Position', 'Credit', 'Social Security System contributions payable'),
('2042', 'PhilHealth Premiums Payable (EE + ER)', 'Current Liabilities', 'Financial Position', 'Credit', 'Philippine Health Insurance Corp contributions payable'),
('2043', 'Pag-IBIG / HDMF Premiums Payable (EE + ER)', 'Current Liabilities', 'Financial Position', 'Credit', 'Home Development Mutual Fund contributions payable'),
('2050', 'Income Tax Payable', 'Current Liabilities', 'Financial Position', 'Credit', 'Corporate / Individual income tax due for current period'),
('3010', 'Owner / Paid-in Capital', 'Equity', 'Financial Position', 'Credit', 'Contributed capital by shareholders / business owner'),
('3020', 'Retained Earnings / Accumulated Profit', 'Equity', 'Financial Position', 'Credit', 'Cumulative earnings retained in the business'),
('4010', 'Service & Consulting Revenue', 'Revenue', 'Income Statement', 'Credit', 'Professional, accounting, audit, management, or IT fees'),
('4020', 'Sales Revenue - Products / Merchandise', 'Revenue', 'Income Statement', 'Credit', 'Gross revenue from sale of inventory / merchandise'),
('4030', 'Interest and Other Income', 'Revenue', 'Income Statement', 'Credit', 'Bank interest earned and miscellaneous income'),
('5010', 'Cost of Services / Direct Labor', 'Cost of Sales', 'Income Statement', 'Debit', 'Direct billable consultant compensation and direct service costs'),
('6010', 'Salaries, Wages & Employee Benefits', 'Operating Expenses', 'Income Statement', 'Debit', 'Gross compensation, 13th month, allowances for staff'),
('6015', 'Employer SSS Contribution Expense', 'Operating Expenses', 'Income Statement', 'Debit', 'Employer share of Social Security contributions'),
('6016', 'Employer PhilHealth Contribution Expense', 'Operating Expenses', 'Income Statement', 'Debit', 'Employer share of PhilHealth contributions'),
('6017', 'Employer Pag-IBIG Contribution Expense', 'Operating Expenses', 'Income Statement', 'Debit', 'Employer share of Pag-IBIG contributions'),
('6020', 'Office Rent & Utilities Expense', 'Operating Expenses', 'Income Statement', 'Debit', 'Office space lease, electricity, water, internet'),
('6030', 'Professional & Legal Fees', 'Operating Expenses', 'Income Statement', 'Debit', 'Outside legal, advisory, audit, retainers'),
('6040', 'Taxes, Licenses & BIR Registration', 'Operating Expenses', 'Income Statement', 'Debit', 'Mayor permit, barangay clearance, BIR annual reg fee'),
('6050', 'Depreciation Expense', 'Operating Expenses', 'Income Statement', 'Debit', 'Periodic depreciation of fixed assets');

-- -----------------------------------------------------------------------------
-- SEED DATA: Default Registered Company & BIR 2303
-- -----------------------------------------------------------------------------
INSERT INTO `Company` (`id`, `company_name`, `trade_name`, `entity_type`, `company_tin`, `tin_branch_code`, `company_address`, `company_email`, `company_contact`, `birthday_or_incorporation_date`, `rdo`, `rdo_code`, `line_of_business`, `vat_or_non_vat`, `registration_fee`, `income_tax`, `form_0619f`, `withholding_expanded`, `withholding_compensation`, `withholding_fringe_benefit`, `date_of_entry`) VALUES
(1, '2OS Enterprise Philippines Inc.', '2OS Solutions', 'CORPORATION', '009-876-543-00000', '00000', 'Unit 1204 Ayala Tower One, Ayala Avenue, Makati City, Metro Manila', 'compliance@2osaccounting.ph', '0917-888-2677', '2024-01-15', '047 - East Makati', '047', 'Accounting, Tax Advisory, and IT Solutions', 'VATABLE', 'Yes', 'Yes', 'No', 'Yes', 'Yes', 'No', '2024-01-15');

INSERT INTO `bir_2303` (`id`, `company_tin`, `tin_branch_code`, `vat_type`, `Registration_Fee`, `Income_Tax`, `Final_Withholding_Tax`, `Expanded_Withholding_Tax`, `Withholding_on_Compensation`, `Fringe_Benefits_Tax`, `Related_party_transactions`, `Monthly_documentary_stamp`) VALUES
(1, '009-876-543-00000', '00000', 'VATABLE', 'Yes', 'Yes', 'No', 'Yes', 'Yes', 'No', 'No', 'No');

-- -----------------------------------------------------------------------------
-- SEED DATA: Customers
-- -----------------------------------------------------------------------------
INSERT INTO `Customers` (`id`, `customer_name`, `trade_name`, `entity_type`, `customer_tin`, `tin_branch_code`, `customer_address`, `customer_email`, `customer_contact`, `company_name`) VALUES
(1, 'Metro Commercial Distribution Corp.', 'Metro Distro', 'CORPORATION', '201-987-654-00000', '00000', 'Ortigas Center, Pasig City, Metro Manila', 'billing@metrodistro.ph', '0917-123-4567', '2OS Enterprise Philippines Inc.'),
(2, 'Summit Horizon Logistics Inc.', 'Summit Logistics', 'CORPORATION', '302-876-543-00000', '00000', 'BGC, Taguig City, Metro Manila', 'accounting@summitlogistics.ph', '0918-234-5678', '2OS Enterprise Philippines Inc.');

-- -----------------------------------------------------------------------------
-- SEED DATA: Service Providers
-- -----------------------------------------------------------------------------
INSERT INTO `Service_Providers` (`id`, `provider_name`, `trade_name`, `provider_tin`, `tin_branch_code`, `provider_address`, `vat_type`, `entity_type`, `atc_code`, `ewt_rate`, `provider_email`, `provider_contact`, `company_name`) VALUES
(1, 'CloudNet High-Speed Fiber Corp.', 'CloudNet', '105-654-321-00000', '00000', 'Makati City, Metro Manila', 'VATABLE', 'CORPORATION', 'WC100', 2.00, 'billing@cloudnet.ph', '02-8888-1234', '2OS Enterprise Philippines Inc.'),
(2, 'Ayala Properties Leasing Corp.', 'Ayala Land', '101-234-567-00000', '00000', 'Ayala Triangle, Makati City', 'VATABLE', 'CORPORATION', 'WC100', 5.00, 'leasing@ayalaland.ph', '02-8999-0000', '2OS Enterprise Philippines Inc.');

SET FOREIGN_KEY_CHECKS = 1;
