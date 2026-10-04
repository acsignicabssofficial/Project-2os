-- =============================================================================
-- 2OS ACCOUNTING SYSTEM (PHILIPPINE BIR & PFRS COMPLIANCE SUITE)
-- SQL DATABASE: ALL TRANSACTIONS, JOURNALS, MASTER DATA & LEDGER
-- Compatible with: SQLite, MySQL, MariaDB, PostgreSQL
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. COMPANIES / ENTITIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_tin TEXT NOT NULL,
  rdo_code TEXT,
  line_of_business TEXT,
  address TEXT,
  zip_code TEXT,
  email TEXT,
  phone TEXT,
  is_vat_registered INTEGER DEFAULT 1,
  tax_regime TEXT DEFAULT 'Regular Corporate Income Tax (25% RCIT)',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (id, company_name, company_tin, rdo_code, line_of_business, address, zip_code, email, phone, is_vat_registered, tax_regime)
VALUES (1, 'Active Workspace Demo Corp.', '009-876-543-00000', '044 - Taguig / Pateros', 'Software Development & IT Consultancy', 'Unit 1204, High Street Corporate Tower, BGC, Taguig City, Metro Manila', '1634', 'accounting@activeworkspace.ph', '+63 2 8888 1234', 1, 'Regular Corporate Income Tax (25% RCIT)');

-- -----------------------------------------------------------------------------
-- 2. CUSTOMERS (CLIENT DIRECTORY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_tin TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (id, company_name, customer_name, customer_tin, address, contact_person, email, phone) VALUES
(1, 'Active Workspace Demo Corp.', 'Ayala Tech Holdings Inc.', '102-345-678-00000', 'Tower One, Ayala Avenue, Makati City', 'Mark Villar', 'mvillar@ayalatech.ph', '0917-111-2222'),
(2, 'Active Workspace Demo Corp.', 'BDO Prime Commerce Corp.', '204-567-890-00000', 'Ortigas Center, Pasig City', 'Grace Tan', 'gtan@bdoprime.ph', '0918-333-4444'),
(3, 'Active Workspace Demo Corp.', 'Megaworld Digital Logistics', '305-678-901-00000', 'Uptown Mall Tower, BGC, Taguig City', 'Carlos Romero', 'cromero@megalogistics.ph', '0920-555-6666');

-- -----------------------------------------------------------------------------
-- 3. CONTRACTORS & SUPPLIERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractors (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  contractor_tin TEXT NOT NULL,
  address TEXT,
  service_type TEXT,
  atc_code TEXT,
  email TEXT,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO contractors (id, company_name, contractor_name, contractor_tin, address, service_type, atc_code, email, phone) VALUES
(1, 'Active Workspace Demo Corp.', 'Converge ICT Solutions Inc.', '004-987-123-00000', 'Pasig City, Metro Manila', 'Internet & Telecommunications', 'WI160', 'support@convergeict.com', '02-8667-0888'),
(2, 'Active Workspace Demo Corp.', 'SyCip Salazar Hernandez & Gatmaitan', '001-234-567-00000', 'Makati City, Metro Manila', 'Legal & Professional Retainer', 'WI010', 'info@syciplaw.com', '02-8988-6000'),
(3, 'Active Workspace Demo Corp.', 'SM Prime Commercial Leasing', '000-456-789-00000', 'Mall of Asia Complex, Pasay City', 'Office Rental & Utilities', 'WI100', 'leasing@smprime.com', '02-8831-1000');

-- -----------------------------------------------------------------------------
-- 4. SALES TRANSACTIONS (ACCOUNTS RECEIVABLE / REVENUE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_tin TEXT NOT NULL,
  invoice_amount REAL NOT NULL,
  withholding_2307 REAL DEFAULT 0,
  vat_exempt_amount REAL DEFAULT 0,
  discounts REAL DEFAULT 0,
  down_payment REAL DEFAULT 0,
  output_vat REAL DEFAULT 0,
  sales_status TEXT DEFAULT 'Unpaid',
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sales (id, company_name, invoice_number, invoice_date, customer_name, customer_tin, invoice_amount, withholding_2307, vat_exempt_amount, discounts, down_payment, output_vat, sales_status, description) VALUES
(1, 'Active Workspace Demo Corp.', 'SI-2026-001', '2026-01-15', 'Ayala Tech Holdings Inc.', '102-345-678-00000', 168000.00, 3000.00, 0, 0, 0, 18000.00, 'Fully Paid', 'Enterprise Accounting Software Implementation - Phase 1'),
(2, 'Active Workspace Demo Corp.', 'SI-2026-002', '2026-01-28', 'BDO Prime Commerce Corp.', '204-567-890-00000', 280000.00, 5000.00, 0, 0, 0, 30000.00, 'Partially Paid', 'Custom Fintech API Integration & Cloud Setup'),
(3, 'Active Workspace Demo Corp.', 'SI-2026-003', '2026-02-10', 'Megaworld Digital Logistics', '305-678-901-00000', 112000.00, 2000.00, 0, 0, 0, 12000.00, 'Unpaid', 'Monthly Retainer & System Maintenance (February 2026)');

-- -----------------------------------------------------------------------------
-- 5. COLLECTIONS TRANSACTIONS (CASH RECEIPTS / BIR 2307)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  collection_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  amount_collected REAL NOT NULL,
  amount_withheld_2307 REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'Bank Transfer',
  OR_PR_number TEXT NOT NULL,
  entry_number TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO collections (id, company_name, invoice_number, collection_date, customer_name, amount_collected, amount_withheld_2307, payment_method, OR_PR_number, entry_number) VALUES
(1, 'Active Workspace Demo Corp.', 'SI-2026-001', '2026-01-25', 'Ayala Tech Holdings Inc.', 165000.00, 3000.00, 'Bank Transfer (BDO)', 'OR-2026-101', 'CRJ-001'),
(2, 'Active Workspace Demo Corp.', 'SI-2026-002', '2026-02-05', 'BDO Prime Commerce Corp.', 140000.00, 2500.00, 'Check (Metrobank)', 'OR-2026-102', 'CRJ-002');

-- -----------------------------------------------------------------------------
-- 6. EXPENSE TRANSACTIONS (PURCHASES / OPERATING COSTS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  voucher_number TEXT NOT NULL,
  expense_date TEXT NOT NULL,
  service_provider_name TEXT NOT NULL,
  service_provider_tin TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  expense_invoice_amount REAL NOT NULL,
  vat_input_amount REAL DEFAULT 0,
  withholding_2307_2306 REAL DEFAULT 0,
  discounts REAL DEFAULT 0,
  nonvat_or_vat TEXT DEFAULT 'VAT',
  expense_status TEXT DEFAULT 'Unpaid',
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO expenses (id, company_name, voucher_number, expense_date, service_provider_name, service_provider_tin, expense_type, expense_invoice_amount, vat_input_amount, withholding_2307_2306, discounts, nonvat_or_vat, expense_status, description) VALUES
(1, 'Active Workspace Demo Corp.', 'APV-2026-001', '2026-01-05', 'SM Prime Commercial Leasing', '000-456-789-00000', 'Rent Expense', 56000.00, 6000.00, 2500.00, 0, 'VAT', 'Fully Paid', 'Office Space Rental - January 2026'),
(2, 'Active Workspace Demo Corp.', 'APV-2026-002', '2026-01-12', 'Converge ICT Solutions Inc.', '004-987-123-00000', 'Utilities Expense', 11200.00, 1200.00, 200.00, 0, 'VAT', 'Fully Paid', 'Dedicated Fiber Leased Line 1Gbps'),
(3, 'Active Workspace Demo Corp.', 'APV-2026-003', '2026-01-20', 'SyCip Salazar Hernandez & Gatmaitan', '001-234-567-00000', 'Professional Fees', 44800.00, 4800.00, 4000.00, 0, 'VAT', 'Unpaid', 'Corporate Legal & Retainer Advisory Services');

-- -----------------------------------------------------------------------------
-- 7. PAYMENT DISBURSEMENT TRANSACTIONS (CASH OUTFLOWS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  voucher_number TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  service_provider_name TEXT NOT NULL,
  amount_paid REAL NOT NULL,
  withholding_tax_2307 REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'Check',
  check_voucher_number TEXT NOT NULL,
  entry_number TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payments (id, company_name, voucher_number, payment_date, service_provider_name, amount_paid, withholding_tax_2307, payment_method, check_voucher_number, entry_number) VALUES
(1, 'Active Workspace Demo Corp.', 'APV-2026-001', '2026-01-10', 'SM Prime Commercial Leasing', 53500.00, 2500.00, 'Check', 'CV-2026-051', 'CDJ-001'),
(2, 'Active Workspace Demo Corp.', 'APV-2026-002', '2026-01-18', 'Converge ICT Solutions Inc.', 11000.00, 200.00, 'Online Banking (BDO)', 'CV-2026-052', 'CDJ-002');

-- -----------------------------------------------------------------------------
-- 7.1 SUBSIDIARY SALES (UNIFORM 21-HEADER REGISTER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subsidiary_sales (
  id INTEGER PRIMARY KEY,
  company_name TEXT,
  registered_name TEXT,
  vat_or_nonvat TEXT,
  tin TEXT,
  address TEXT,
  type_of_transaction TEXT,
  date TEXT,
  invoice_type TEXT,
  voucher_number TEXT,
  invoice_number TEXT,
  particulars TEXT,
  qty REAL,
  unit_price REAL,
  amount REAL,
  vatable_amount REAL,
  vat_amount REAL,
  zero_rated_amount REAL,
  vat_exempt_amount REAL,
  total_amount_vat_inclusive REAL,
  total_amount_net_of_vat REAL,
  discount REAL,
  tax_withheld REAL,
  total_amount_due REAL,
  is_cancelled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subsidiary_sales (id, company_name, registered_name, vat_or_nonvat, tin, address, type_of_transaction, date, invoice_type, voucher_number, invoice_number, particulars, qty, unit_price, amount, vatable_amount, vat_amount, zero_rated_amount, vat_exempt_amount, total_amount_vat_inclusive, total_amount_net_of_vat, discount, tax_withheld, total_amount_due) VALUES
(1, 'Active Workspace Demo Corp.', 'Ayala Tech Holdings Inc.', 'VAT', '102-345-678-00000', 'Tower One, Ayala Avenue, Makati City', 'CASH', '2026-01-15', 'SALES INVOICE', '', 'SI-2026-001', 'Enterprise Software Implementation', 1, 168000.00, 168000.00, 150000.00, 18000.00, 0, 0, 168000.00, 150000.00, 0, 3000.00, 165000.00),
(2, 'Active Workspace Demo Corp.', 'BDO Prime Commerce Corp.', 'VAT', '204-567-890-00000', 'Ortigas Center, Pasig City', 'ON ACCOUNT', '2026-01-28', 'SALES INVOICE', '', 'SI-2026-002', 'Fintech API Integration', 1, 280000.00, 280000.00, 250000.00, 30000.00, 0, 0, 280000.00, 250000.00, 0, 5000.00, 275000.00);

-- -----------------------------------------------------------------------------
-- 7.2 SUBSIDIARY PURCHASES (UNIFORM 21-HEADER REGISTER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subsidiary_purchases (
  id INTEGER PRIMARY KEY,
  company_name TEXT,
  registered_name TEXT,
  vat_or_nonvat TEXT,
  tin TEXT,
  address TEXT,
  type_of_transaction TEXT,
  date TEXT,
  invoice_type TEXT,
  voucher_number TEXT,
  invoice_number TEXT,
  particulars TEXT,
  qty REAL,
  unit_price REAL,
  amount REAL,
  vatable_amount REAL,
  vat_amount REAL,
  zero_rated_amount REAL,
  vat_exempt_amount REAL,
  total_amount_vat_inclusive REAL,
  total_amount_net_of_vat REAL,
  discount REAL,
  tax_withheld REAL,
  total_amount_due REAL,
  is_cancelled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subsidiary_purchases (id, company_name, registered_name, vat_or_nonvat, tin, address, type_of_transaction, date, invoice_type, voucher_number, invoice_number, particulars, qty, unit_price, amount, vatable_amount, vat_amount, zero_rated_amount, vat_exempt_amount, total_amount_vat_inclusive, total_amount_net_of_vat, discount, tax_withheld, total_amount_due) VALUES
(1, 'Active Workspace Demo Corp.', 'SM Prime Commercial Leasing', 'VAT', '000-456-789-00000', 'Mall of Asia Complex, Pasay City', 'CASH', '2026-01-05', 'OFFICIAL RECEIPT', 'APV-2026-001', 'OR-78912', 'Office Space Rental - January 2026', 1, 56000.00, 56000.00, 50000.00, 6000.00, 0, 0, 56000.00, 50000.00, 0, 2500.00, 53500.00),
(2, 'Active Workspace Demo Corp.', 'Converge ICT Solutions Inc.', 'VAT', '009-876-123-00000', 'Reliance St., Mandaluyong City', 'ON ACCOUNT', '2026-01-12', 'SALES INVOICE', 'APV-2026-002', 'INV-44556', 'Dedicated Leased Line Internet 500Mbps', 1, 11200.00, 11200.00, 10000.00, 1200.00, 0, 0, 11200.00, 10000.00, 0, 200.00, 11000.00);

-- -----------------------------------------------------------------------------
-- 7.3 CASH RECEIPTS (UNIFORM 21-HEADER REGISTER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_receipts (
  id INTEGER PRIMARY KEY,
  company_name TEXT,
  registered_name TEXT,
  vat_or_nonvat TEXT,
  tin TEXT,
  address TEXT,
  type_of_transaction TEXT,
  date TEXT,
  invoice_type TEXT,
  voucher_number TEXT,
  invoice_number TEXT,
  particulars TEXT,
  qty REAL,
  unit_price REAL,
  amount REAL,
  vatable_amount REAL,
  vat_amount REAL,
  zero_rated_amount REAL,
  vat_exempt_amount REAL,
  total_amount_vat_inclusive REAL,
  total_amount_net_of_vat REAL,
  discount REAL,
  tax_withheld REAL,
  total_amount_due REAL,
  is_cancelled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cash_receipts (id, company_name, registered_name, vat_or_nonvat, tin, address, type_of_transaction, date, invoice_type, voucher_number, invoice_number, particulars, qty, unit_price, amount, vatable_amount, vat_amount, zero_rated_amount, vat_exempt_amount, total_amount_vat_inclusive, total_amount_net_of_vat, discount, tax_withheld, total_amount_due) VALUES
(1, 'Active Workspace Demo Corp.', 'Ayala Tech Holdings Inc.', 'VAT', '102-345-678-00000', 'Tower One, Ayala Avenue, Makati City', 'CASH', '2026-01-25', 'OFFICIAL RECEIPT', 'CRJ-001', 'SI-2026-001', 'Settlement of SI-2026-001 via BDO Transfer', 1, 168000.00, 168000.00, 150000.00, 18000.00, 0, 0, 168000.00, 150000.00, 0, 3000.00, 165000.00);

-- -----------------------------------------------------------------------------
-- 7.4 CASH DISBURSEMENTS (UNIFORM 21-HEADER REGISTER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_disbursements (
  id INTEGER PRIMARY KEY,
  company_name TEXT,
  registered_name TEXT,
  vat_or_nonvat TEXT,
  tin TEXT,
  address TEXT,
  type_of_transaction TEXT,
  date TEXT,
  invoice_type TEXT,
  voucher_number TEXT,
  invoice_number TEXT,
  particulars TEXT,
  qty REAL,
  unit_price REAL,
  amount REAL,
  vatable_amount REAL,
  vat_amount REAL,
  zero_rated_amount REAL,
  vat_exempt_amount REAL,
  total_amount_vat_inclusive REAL,
  total_amount_net_of_vat REAL,
  discount REAL,
  tax_withheld REAL,
  total_amount_due REAL,
  is_cancelled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cash_disbursements (id, company_name, registered_name, vat_or_nonvat, tin, address, type_of_transaction, date, invoice_type, voucher_number, invoice_number, particulars, qty, unit_price, amount, vatable_amount, vat_amount, zero_rated_amount, vat_exempt_amount, total_amount_vat_inclusive, total_amount_net_of_vat, discount, tax_withheld, total_amount_due) VALUES
(1, 'Active Workspace Demo Corp.', 'SM Prime Commercial Leasing', 'VAT', '000-456-789-00000', 'Mall of Asia Complex, Pasay City', 'CASH', '2026-01-10', 'OFFICIAL RECEIPT', 'CV-2026-051', 'APV-2026-001', 'Rental payment check disbursement', 1, 56000.00, 56000.00, 50000.00, 6000.00, 0, 0, 56000.00, 50000.00, 0, 2500.00, 53500.00);

-- -----------------------------------------------------------------------------
-- 8. PROPERTY, PLANT & EQUIPMENT (PPE / FIXED ASSETS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ppe_assets (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  asset_code TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  category TEXT NOT NULL,
  acquisition_date TEXT NOT NULL,
  acquisition_cost REAL NOT NULL,
  salvage_value REAL DEFAULT 0,
  useful_life_years REAL NOT NULL,
  depreciation_method TEXT DEFAULT 'Straight Line',
  accumulated_depreciation REAL DEFAULT 0,
  net_book_value REAL NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ppe_assets (id, company_name, asset_code, asset_name, category, acquisition_date, acquisition_cost, salvage_value, useful_life_years, depreciation_method, accumulated_depreciation, net_book_value, status) VALUES
(1, 'Active Workspace Demo Corp.', 'PPE-2026-01', 'Apple MacBook Pro M3 Max 16"', 'IT Equipment', '2026-01-05', 185000.00, 15000.00, 3.0, 'Straight Line', 4722.22, 180277.78, 'Active'),
(2, 'Active Workspace Demo Corp.', 'PPE-2026-02', 'Ergonomic Executive Office Chairs (Set of 6)', 'Furniture & Fixtures', '2026-01-10', 72000.00, 5000.00, 5.0, 'Straight Line', 1116.67, 70883.33, 'Active');

-- -----------------------------------------------------------------------------
-- 9. ACCOUNT TITLES (PHILIPPINE CHART OF ACCOUNTS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_titles (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO account_titles (id, code, title, category, type, description) VALUES
(1, '1010', 'Cash and Cash Equivalents', 'Current Assets', 'Asset', 'Cash on hand and bank deposits'),
(2, '1020', 'Accounts Receivable', 'Current Assets', 'Asset', 'Trade receivables from clients'),
(3, '1030', 'Input VAT', 'Current Assets', 'Asset', '12% Creditable Input VAT from purchases'),
(4, '1040', 'Creditable Withholding Tax (BIR 2307)', 'Current Assets', 'Asset', 'Prepaid income tax withheld by customers'),
(5, '1050', 'Prepaid Expenses', 'Current Assets', 'Asset', 'Advance payments for rent, insurance, etc.'),
(6, '1510', 'Property, Plant & Equipment', 'Non-Current Assets', 'Asset', 'Office furniture, computers, vehicles, machineries'),
(7, '1520', 'Accumulated Depreciation', 'Non-Current Assets', 'Asset', 'Contra-asset for cumulative depreciation'),
(8, '2010', 'Accounts Payable', 'Current Liabilities', 'Liability', 'Trade payables to suppliers and service providers'),
(9, '2020', 'Output VAT Payable', 'Current Liabilities', 'Liability', '12% Output VAT collected on sales'),
(10, '2030', 'Expanded Withholding Tax Payable (BIR 0619-E)', 'Current Liabilities', 'Liability', 'Withholding tax payable to BIR for vendors'),
(11, '2040', 'Income Tax Payable (BIR 1702/1701)', 'Current Liabilities', 'Liability', 'Income tax payable provision due to BIR'),
(12, '3010', 'Capital Stock / Owner Equity', 'Equity', 'Equity', 'Contributed capital by stockholders or owner'),
(13, '3020', 'Retained Earnings', 'Equity', 'Equity', 'Cumulative net earnings retained in business'),
(14, '4010', 'Sales / Service Revenue', 'Operating Revenue', 'Revenue', 'Gross revenues from sales and services'),
(15, '4015', 'Sales Discounts', 'Operating Revenue', 'Revenue', 'Contra-revenue: trade/cash discounts granted to customers'),
(16, '6010', 'Salaries, Wages & Benefits', 'Operating Expenses', 'Expense', 'Employee gross compensation and allowances'),
(17, '6020', 'Rent Expense', 'Operating Expenses', 'Expense', 'Office and warehouse space rental'),
(18, '6030', 'Utilities Expense', 'Operating Expenses', 'Expense', 'Electricity, water, internet, telephone'),
(19, '6080', 'Depreciation Expense', 'Operating Expenses', 'Expense', 'Periodic depreciation of fixed assets'),
(20, '7010', 'Provision for Income Tax Expense', 'Tax Provision', 'Expense', 'Income tax expense provision');

-- -----------------------------------------------------------------------------
-- 10. SPECIAL ENTRIES (GENERAL JOURNAL VOUCHERS / ADJUSTMENTS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS special_entries (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  entry_number TEXT NOT NULL,
  voucher_no TEXT,
  entry_date TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  description TEXT,
  lines_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO special_entries (id, company_name, entry_number, voucher_no, entry_date, entry_type, description, lines_json) VALUES
(1, 'Active Workspace Demo Corp.', 'JV-2026-001', 'JV-001', '2026-01-31', 'Depreciation', 'To record monthly depreciation of fixed assets for January 2026', '[{"account_code":"6080","account_title":"Depreciation Expense","debit":5838.89,"credit":0},{"account_code":"1520","account_title":"Accumulated Depreciation","debit":0,"credit":5838.89}]');

-- -----------------------------------------------------------------------------
-- 11. EMPLOYEES & PAYROLL RECORDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  tin TEXT,
  sss_number TEXT,
  philhealth_number TEXT,
  pagibig_number TEXT,
  position TEXT,
  department TEXT,
  monthly_rate REAL DEFAULT 0,
  daily_rate REAL DEFAULT 0,
  tax_status TEXT DEFAULT 'Single',
  is_subject_to_contributions INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (id, company_name, employee_id, full_name, tin, sss_number, philhealth_number, pagibig_number, position, department, monthly_rate, daily_rate, tax_status, is_subject_to_contributions) VALUES
(1, 'Active Workspace Demo Corp.', 'EMP-001', 'Juan Dela Cruz', '123-456-789-00000', '34-1234567-8', '12-345678901-2', '1212-3434-5656', 'Lead Fullstack Architect', 'Engineering', 45000.00, 1800.00, 'Single', 1),
(2, 'Active Workspace Demo Corp.', 'EMP-002', 'Maria Clara Santos', '987-654-321-00000', '34-9876543-1', '98-765432109-8', '9898-7676-5454', 'Senior CPA & Financial Officer', 'Finance', 38000.00, 1520.00, 'Married', 1);

CREATE TABLE IF NOT EXISTS payroll_records (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  payroll_period TEXT NOT NULL,
  basic_pay REAL NOT NULL,
  overtime_pay REAL DEFAULT 0,
  allowances REAL DEFAULT 0,
  gross_pay REAL NOT NULL,
  sss_deduction REAL DEFAULT 0,
  philhealth_deduction REAL DEFAULT 0,
  pagibig_deduction REAL DEFAULT 0,
  withholding_tax REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  net_pay REAL NOT NULL,
  status TEXT DEFAULT 'Processed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payroll_records (id, company_name, employee_id, employee_name, payroll_period, basic_pay, overtime_pay, allowances, gross_pay, sss_deduction, philhealth_deduction, pagibig_deduction, withholding_tax, other_deductions, net_pay, status) VALUES
(1, 'Active Workspace Demo Corp.', 'EMP-001', 'Juan Dela Cruz', '2026-01', 45000.00, 3500.00, 2000.00, 50500.00, 1350.00, 1125.00, 200.00, 4825.00, 0, 43000.00, 'Processed'),
(2, 'Active Workspace Demo Corp.', 'EMP-002', 'Maria Clara Santos', '2026-01', 38000.00, 0, 1500.00, 39500.00, 1350.00, 950.00, 200.00, 2750.00, 0, 34250.00, 'Processed');

-- -----------------------------------------------------------------------------
-- 12. INCOME TAX RECORDS (BIR FORM 1702Q / 1702-RT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS income_tax_records (
  id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  taxable_year TEXT NOT NULL,
  quarter_period TEXT NOT NULL,
  entity_type TEXT DEFAULT 'Corporation',
  tax_regime TEXT DEFAULT 'Regular Corporate Income Tax (25%)',
  deduction_method TEXT DEFAULT 'Itemized Deductions',
  gross_sales REAL DEFAULT 0,
  cost_of_sales REAL DEFAULT 0,
  itemized_expenses REAL DEFAULT 0,
  allowable_deductions REAL DEFAULT 0,
  taxable_income REAL DEFAULT 0,
  computed_tax_due REAL DEFAULT 0,
  creditable_tax_2307 REAL DEFAULT 0,
  quarterly_tax_payments REAL DEFAULT 0,
  net_tax_payable REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO income_tax_records (id, company_name, taxable_year, quarter_period, entity_type, tax_regime, deduction_method, gross_sales, cost_of_sales, itemized_expenses, allowable_deductions, taxable_income, computed_tax_due, creditable_tax_2307, quarterly_tax_payments, net_tax_payable) VALUES
(1, 'Active Workspace Demo Corp.', '2026', 'Q1 (First Quarter)', 'Corporation', 'Regular Corporate Income Tax (25%)', 'Itemized Deductions', 560000.00, 120000.00, 180000.00, 180000.00, 260000.00, 65000.00, 10000.00, 0, 55000.00);

-- -----------------------------------------------------------------------------
-- 13. APP SETTINGS & METADATA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT
);

INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES
('activeCompanyId', '1'),
('theme', 'neon_light'),
('currency', 'PHP'),
('last_export_timestamp', CURRENT_TIMESTAMP);

-- =============================================================================
-- END OF SQL SCHEMA & TRANSACTIONS INITIALIZATION
-- =============================================================================
