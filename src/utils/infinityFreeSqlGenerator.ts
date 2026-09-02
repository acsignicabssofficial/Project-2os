/**
 * Escapes a string safely for MySQL syntax
 */
function escapeSqlString(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  const val = String(str);
  return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function escapeSqlNumber(num: any, defaultVal = 0): string {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? String(defaultVal) : String(parsed.toFixed(2));
}

function escapeSqlDate(dateStr: any): string {
  if (!dateStr) return 'NULL';
  const clean = String(dateStr).trim();
  if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `'${clean}'`;
  }
  return `'${new Date().toISOString().split('T')[0]}'`;
}

/**
 * Generates a full, 100% compliant InfinityFree MySQL / MariaDB SQL dump
 * containing all 10 core tables and the current in-app records.
 */
export function generateInfinityFreeSql(data: {
  companies: any[];
  customers: any[];
  sales: any[];
  collections: any[];
  serviceProviders: any[];
  expenses: any[];
  payments: any[];
  generalJournal: any[];
  chartOfAccounts: any[];
  payroll: any[];
}): string {
  const timestamp = new Date().toISOString();
  
  let sql = `-- ==============================================================================
-- InfinityFree MySQL / MariaDB Production Dump
-- 2OS Philippine Accounting & BIR Compliance System
-- Generated on: ${timestamp}
-- Compatible with phpMyAdmin, MySQL 5.7+, MariaDB 10.3+
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";

-- -----------------------------------------------------------------------------
-- 1. Table: Company
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Company\`;
CREATE TABLE \`Company\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`company_name\` VARCHAR(255) NOT NULL,
  \`trade_name\` VARCHAR(255) DEFAULT NULL,
  \`entity_type\` VARCHAR(100) DEFAULT 'CORPORATION',
  \`company_tin\` VARCHAR(50) NOT NULL UNIQUE,
  \`tin_branch_code\` VARCHAR(10) DEFAULT '00000',
  \`company_address\` TEXT DEFAULT NULL,
  \`company_email\` VARCHAR(255) DEFAULT NULL,
  \`company_contact\` VARCHAR(100) DEFAULT NULL,
  \`birthday_or_incorporation_date\` DATE DEFAULT NULL,
  \`rdo\` VARCHAR(50) DEFAULT NULL,
  \`rdo_code\` VARCHAR(50) DEFAULT NULL,
  \`line_of_business\` VARCHAR(255) DEFAULT NULL,
  \`vat_or_non_vat\` VARCHAR(50) DEFAULT 'VATABLE',
  \`registration_fee\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`income_tax\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`form_0619f\` ENUM('Yes', 'No') DEFAULT 'No',
  \`withholding_expanded\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`withholding_compensation\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`withholding_fringe_benefit\` ENUM('Yes', 'No') DEFAULT 'No',
  \`date_of_entry\` DATE DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  // Insert Companies
  if (data.companies && data.companies.length > 0) {
    sql += `-- Dumping records for Company\n`;
    for (const c of data.companies) {
      const regFee = (c.registration_fee === true || c.registration_fee === 'Yes') ? 'Yes' : 'No';
      const incTax = (c.income_tax !== false && c.income_tax !== 'No') ? 'Yes' : 'No';
      const f0619 = (c.form_0619f === true || c.form_0619f === 'Yes') ? 'Yes' : 'No';
      const wExp = (c.withholding_expanded !== false && c.withholding_expanded !== 'No') ? 'Yes' : 'No';
      const wComp = (c.withholding_compensation !== false && c.withholding_compensation !== 'No') ? 'Yes' : 'No';
      const wFringe = (c.withholding_fringe_benefit === true || c.withholding_fringe_benefit === 'Yes') ? 'Yes' : 'No';

      sql += `INSERT INTO \`Company\` (\`id\`, \`company_name\`, \`trade_name\`, \`entity_type\`, \`company_tin\`, \`tin_branch_code\`, \`company_address\`, \`company_email\`, \`company_contact\`, \`birthday_or_incorporation_date\`, \`rdo\`, \`rdo_code\`, \`line_of_business\`, \`vat_or_non_vat\`, \`registration_fee\`, \`income_tax\`, \`form_0619f\`, \`withholding_expanded\`, \`withholding_compensation\`, \`withholding_fringe_benefit\`, \`date_of_entry\`) VALUES (${c.id}, ${escapeSqlString(c.company_name)}, ${escapeSqlString(c.trade_name || c.company_name)}, ${escapeSqlString(c.entity_type || 'CORPORATION')}, ${escapeSqlString(c.company_tin)}, ${escapeSqlString(c.tin_branch_code || '00000')}, ${escapeSqlString(c.company_address || c.registered_address)}, ${escapeSqlString(c.company_email)}, ${escapeSqlString(c.company_contact)}, ${escapeSqlDate(c.birthday_or_incorporation_date)}, ${escapeSqlString(c.rdo || '044')}, ${escapeSqlString(c.rdo_code || '044')}, ${escapeSqlString(c.line_of_business || 'General Business')}, ${escapeSqlString(c.vat_or_non_vat || 'VATABLE')}, '${regFee}', '${incTax}', '${f0619}', '${wExp}', '${wComp}', '${wFringe}', ${escapeSqlDate(c.date_of_entry)});\n`;
    }
    sql += `\n`;
  }

  // Table bir_2303
  sql += `-- -----------------------------------------------------------------------------
-- 2. Table: bir_2303 (Tax Compliance Obligations)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`bir_2303\`;
CREATE TABLE \`bir_2303\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`company_tin\` VARCHAR(50) NOT NULL,
  \`tin_branch_code\` VARCHAR(10) DEFAULT '00000',
  \`vat_type\` VARCHAR(50) DEFAULT 'VATABLE',
  \`Registration_Fee\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`Income_Tax\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`Final_Withholding_Tax\` ENUM('Yes', 'No') DEFAULT 'No',
  \`Expanded_Withholding_Tax\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`Withholding_on_Compensation\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`Fringe_Benefits_Tax\` ENUM('Yes', 'No') DEFAULT 'No',
  \`Related_party_transactions\` ENUM('Yes', 'No') DEFAULT 'No',
  \`Monthly_documentary_stamp\` ENUM('Yes', 'No') DEFAULT 'No',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_2303_tin\` (\`company_tin\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.companies && data.companies.length > 0) {
    sql += `-- Dumping records for bir_2303\n`;
    for (const c of data.companies) {
      const regFee = (c.registration_fee === true || c.registration_fee === 'Yes') ? 'Yes' : 'No';
      const incTax = (c.income_tax !== false && c.income_tax !== 'No') ? 'Yes' : 'No';
      const f0619 = (c.form_0619f === true || c.form_0619f === 'Yes') ? 'Yes' : 'No';
      const wExp = (c.withholding_expanded !== false && c.withholding_expanded !== 'No') ? 'Yes' : 'No';
      const wComp = (c.withholding_compensation !== false && c.withholding_compensation !== 'No') ? 'Yes' : 'No';
      const wFringe = (c.withholding_fringe_benefit === true || c.withholding_fringe_benefit === 'Yes') ? 'Yes' : 'No';

      sql += `INSERT INTO \`bir_2303\` (\`company_tin\`, \`tin_branch_code\`, \`vat_type\`, \`Registration_Fee\`, \`Income_Tax\`, \`Final_Withholding_Tax\`, \`Expanded_Withholding_Tax\`, \`Withholding_on_Compensation\`, \`Fringe_Benefits_Tax\`, \`Related_party_transactions\`, \`Monthly_documentary_stamp\`) VALUES (${escapeSqlString(c.company_tin)}, ${escapeSqlString(c.tin_branch_code || '00000')}, ${escapeSqlString(c.vat_or_non_vat || 'VATABLE')}, '${regFee}', '${incTax}', '${f0619}', '${wExp}', '${wComp}', '${wFringe}', 'No', 'No');\n`;
    }
    sql += `\n`;
  }

  // Table Customers
  sql += `-- -----------------------------------------------------------------------------
-- 3. Table: Customers
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Customers\`;
CREATE TABLE \`Customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`trade_name\` VARCHAR(255) DEFAULT NULL,
  \`customer_tin\` VARCHAR(50) DEFAULT NULL,
  \`tin_branch_code\` VARCHAR(10) DEFAULT '00000',
  \`customer_address\` TEXT DEFAULT NULL,
  \`vat_type\` VARCHAR(50) DEFAULT 'VATABLE',
  \`entity_type\` VARCHAR(100) DEFAULT 'CORPORATION',
  \`customer_email\` VARCHAR(255) DEFAULT NULL,
  \`customer_contact\` VARCHAR(100) DEFAULT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_cust_name\` (\`customer_name\`),
  INDEX \`idx_cust_tin\` (\`customer_tin\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.customers && data.customers.length > 0) {
    sql += `-- Dumping records for Customers\n`;
    for (const cust of data.customers) {
      sql += `INSERT INTO \`Customers\` (\`id\`, \`customer_name\`, \`trade_name\`, \`customer_tin\`, \`tin_branch_code\`, \`customer_address\`, \`vat_type\`, \`entity_type\`, \`customer_email\`, \`customer_contact\`, \`company_name\`) VALUES (${cust.id}, ${escapeSqlString(cust.customer_name || cust.name || cust.registered_name)}, ${escapeSqlString(cust.trade_name || cust.customer_name || cust.name || cust.registered_name)}, ${escapeSqlString(cust.customer_tin || cust.tin || cust.client_TIN)}, ${escapeSqlString(cust.tin_branch_code || '00000')}, ${escapeSqlString(cust.customer_address || cust.address || cust.client_Address)}, ${escapeSqlString(cust.vat_type || cust.tax_type || 'VATABLE')}, ${escapeSqlString(cust.entity_type || 'CORPORATION')}, ${escapeSqlString(cust.email || cust.customer_email)}, ${escapeSqlString(cust.contact || cust.contact_number || cust.phone || cust.customer_contact)}, ${escapeSqlString(cust.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Sales
  sql += `-- -----------------------------------------------------------------------------
-- 4. Table: Sales
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Sales\`;
CREATE TABLE \`Sales\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transaction_date\` DATE NOT NULL,
  \`invoice_no\` VARCHAR(100) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_tin\` VARCHAR(50) DEFAULT NULL,
  \`customer_address\` TEXT DEFAULT NULL,
  \`description_of_goods_or_services\` TEXT DEFAULT NULL,
  \`amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`vat_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`net_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`cwt_rate\` DECIMAL(5, 2) DEFAULT 0.00,
  \`cwt_amount\` DECIMAL(15, 2) DEFAULT 0.00,
  \`sales_terms\` VARCHAR(100) DEFAULT '30 Days',
  \`amount_due\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`account_code\` VARCHAR(50) DEFAULT '4010',
  \`account_title\` VARCHAR(255) DEFAULT 'Service Revenue',
  \`status\` VARCHAR(50) DEFAULT 'Open',
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_sales_inv\` (\`invoice_no\`),
  INDEX \`idx_sales_date\` (\`transaction_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.sales && data.sales.length > 0) {
    sql += `-- Dumping records for Sales\n`;
    for (const s of data.sales) {
      const grossAmt = s.gross_amount || s.amount || s.invoice_amount || 0;
      const vatAmt = s.vat_amount || s.output_vat || s.vat || 0;
      const netAmt = s.net_amount || s.vatable_amount || s.vatable_sales || (grossAmt - vatAmt);
      const cwtRate = s.cwt_rate || 0;
      const cwtAmt = s.cwt_amount || s.ewt_amount || s.withholding_2307 || 0;
      const amtDue = s.amount_due || s.total_amount_due || (grossAmt - cwtAmt);

      sql += `INSERT INTO \`Sales\` (\`id\`, \`transaction_date\`, \`invoice_no\`, \`customer_name\`, \`customer_tin\`, \`customer_address\`, \`description_of_goods_or_services\`, \`amount\`, \`vat_amount\`, \`net_amount\`, \`cwt_rate\`, \`cwt_amount\`, \`sales_terms\`, \`amount_due\`, \`account_code\`, \`account_title\`, \`status\`, \`company_name\`) VALUES (${s.id}, ${escapeSqlDate(s.date || s.transaction_date || s.invoice_date || s.issue_date)}, ${escapeSqlString(s.invoice_no || s.invoice_number)}, ${escapeSqlString(s.customer_name || s.registered_name)}, ${escapeSqlString(s.customer_tin || s.client_TIN)}, ${escapeSqlString(s.customer_address || s.client_Address)}, ${escapeSqlString(s.description || s.particulars || s.description_of_goods_or_services)}, ${escapeSqlNumber(grossAmt)}, ${escapeSqlNumber(vatAmt)}, ${escapeSqlNumber(netAmt)}, ${escapeSqlNumber(cwtRate)}, ${escapeSqlNumber(cwtAmt)}, ${escapeSqlString(s.sales_terms || '30 Days')}, ${escapeSqlNumber(amtDue)}, ${escapeSqlString(s.account_code || '4010')}, ${escapeSqlString(s.account_title || 'Service Revenue')}, ${escapeSqlString(s.status || s.sales_status || 'Open')}, ${escapeSqlString(s.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Collections
  sql += `-- -----------------------------------------------------------------------------
-- 5. Table: Collections
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Collections\`;
CREATE TABLE \`Collections\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`collection_date\` DATE NOT NULL,
  \`reference_no\` VARCHAR(100) NOT NULL,
  \`invoice_no\` VARCHAR(100) DEFAULT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_tin\` VARCHAR(50) DEFAULT NULL,
  \`amount_collected\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`cwt_withheld\` DECIMAL(15, 2) DEFAULT 0.00,
  \`net_cash_received\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`payment_method\` VARCHAR(100) DEFAULT 'Bank Transfer',
  \`account_code\` VARCHAR(50) DEFAULT '1010',
  \`account_title\` VARCHAR(255) DEFAULT 'Cash in Bank',
  \`remarks\` TEXT DEFAULT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_coll_ref\` (\`reference_no\`),
  INDEX \`idx_coll_date\` (\`collection_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.collections && data.collections.length > 0) {
    sql += `-- Dumping records for Collections\n`;
    for (const col of data.collections) {
      const amtCollected = col.amount_collected || col.total_collected || col.gross_amount || 0;
      const cwtWithheld = col.cwt_withheld || col.amount_withheld_2307 || col.wtax_2307 || 0;
      const netCash = col.net_cash_received || (amtCollected - cwtWithheld);

      sql += `INSERT INTO \`Collections\` (\`id\`, \`collection_date\`, \`reference_no\`, \`invoice_no\`, \`customer_name\`, \`customer_tin\`, \`amount_collected\`, \`cwt_withheld\`, \`net_cash_received\`, \`payment_method\`, \`account_code\`, \`account_title\`, \`remarks\`, \`company_name\`) VALUES (${col.id}, ${escapeSqlDate(col.date || col.collection_date)}, ${escapeSqlString(col.ref_no || col.reference_no || col.receipt_number || col.entry_number)}, ${escapeSqlString(col.invoice_no || col.invoice_number)}, ${escapeSqlString(col.customer_name || col.registered_name)}, ${escapeSqlString(col.customer_tin || col.client_TIN)}, ${escapeSqlNumber(amtCollected)}, ${escapeSqlNumber(cwtWithheld)}, ${escapeSqlNumber(netCash)}, ${escapeSqlString(col.payment_method || col.bank_name || 'Bank Transfer')}, ${escapeSqlString(col.account_code || '1010')}, ${escapeSqlString(col.account_title || 'Cash in Bank')}, ${escapeSqlString(col.remarks || col.notes)}, ${escapeSqlString(col.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Service_Providers
  sql += `-- -----------------------------------------------------------------------------
-- 6. Table: Service_Providers
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Service_Providers\`;
CREATE TABLE \`Service_Providers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`provider_name\` VARCHAR(255) NOT NULL,
  \`trade_name\` VARCHAR(255) DEFAULT NULL,
  \`provider_tin\` VARCHAR(50) DEFAULT NULL,
  \`tin_branch_code\` VARCHAR(10) DEFAULT '00000',
  \`provider_address\` TEXT DEFAULT NULL,
  \`vat_type\` VARCHAR(50) DEFAULT 'VATABLE',
  \`entity_type\` VARCHAR(100) DEFAULT 'CORPORATION',
  \`atc_code\` VARCHAR(50) DEFAULT 'WC100',
  \`ewt_rate\` DECIMAL(5, 2) DEFAULT 2.00,
  \`provider_email\` VARCHAR(255) DEFAULT NULL,
  \`provider_contact\` VARCHAR(100) DEFAULT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_provider_name\` (\`provider_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.serviceProviders && data.serviceProviders.length > 0) {
    sql += `-- Dumping records for Service_Providers\n`;
    for (const sp of data.serviceProviders) {
      sql += `INSERT INTO \`Service_Providers\` (\`id\`, \`provider_name\`, \`trade_name\`, \`provider_tin\`, \`tin_branch_code\`, \`provider_address\`, \`vat_type\`, \`entity_type\`, \`atc_code\`, \`ewt_rate\`, \`provider_email\`, \`provider_contact\`, \`company_name\`) VALUES (${sp.id}, ${escapeSqlString(sp.provider_name || sp.name || sp.service_provider_name || sp.registered_name)}, ${escapeSqlString(sp.trade_name || sp.provider_name || sp.service_provider_name || sp.name)}, ${escapeSqlString(sp.provider_tin || sp.tin || sp.service_provider_TIN || sp.sp_tin)}, ${escapeSqlString(sp.tin_branch_code || sp.sp_branch_code || '00000')}, ${escapeSqlString(sp.provider_address || sp.address || sp.service_provider_Address || sp.sp_address)}, ${escapeSqlString(sp.vat_type || sp.vat_status || 'VATABLE')}, ${escapeSqlString(sp.entity_type || 'CORPORATION')}, ${escapeSqlString(sp.atc_code || 'WC100')}, ${escapeSqlNumber(sp.ewt_rate, 2.0)}, ${escapeSqlString(sp.email || sp.provider_email)}, ${escapeSqlString(sp.contact || sp.provider_contact || sp.phone || sp.contact_number)}, ${escapeSqlString(sp.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Expenses
  sql += `-- -----------------------------------------------------------------------------
-- 7. Table: Expenses
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Expenses\`\`;
CREATE TABLE \`Expenses\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transaction_date\` DATE NOT NULL,
  \`invoice_no\` VARCHAR(100) NOT NULL,
  \`provider_name\` VARCHAR(255) NOT NULL,
  \`provider_tin\` VARCHAR(50) DEFAULT NULL,
  \`provider_address\` TEXT DEFAULT NULL,
  \`description_of_expense\` TEXT DEFAULT NULL,
  \`gross_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`vat_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`net_amount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`ewt_rate\` DECIMAL(5, 2) DEFAULT 0.00,
  \`ewt_amount\` DECIMAL(15, 2) DEFAULT 0.00,
  \`amount_payable\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`account_code\` VARCHAR(50) DEFAULT '6010',
  \`account_title\` VARCHAR(255) DEFAULT 'Operating Expenses',
  \`atc_code\` VARCHAR(50) DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT 'Open',
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_exp_inv\` (\`invoice_no\`),
  INDEX \`idx_exp_date\` (\`transaction_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.expenses && data.expenses.length > 0) {
    sql += `-- Dumping records for Expenses\n`;
    for (const exp of data.expenses) {
      const grossAmt = exp.gross_amount || exp.amount || exp.expense_invoice_amount || exp.total_expenses_vat_inclusive || 0;
      const vatAmt = exp.vat_amount || exp.vat_input_amount || exp.input_vat || exp.vat || 0;
      const netAmt = exp.net_amount || exp.vatable_expense_amount || exp.vatable_purchases || (grossAmt - vatAmt);
      const ewtRate = exp.ewt_rate || 0;
      const ewtAmt = exp.ewt_amount || exp.withholding_2307_2306 || 0;
      const amtPayable = exp.amount_payable || exp.total_amount_due || (grossAmt - ewtAmt);

      sql += `INSERT INTO \`Expenses\` (\`id\`, \`transaction_date\`, \`invoice_no\`, \`provider_name\`, \`provider_tin\`, \`provider_address\`, \`description_of_expense\`, \`gross_amount\`, \`vat_amount\`, \`net_amount\`, \`ewt_rate\`, \`ewt_amount\`, \`amount_payable\`, \`account_code\`, \`account_title\`, \`atc_code\`, \`status\`, \`company_name\`) VALUES (${exp.id}, ${escapeSqlDate(exp.date || exp.transaction_date || exp.expense_date || exp.issue_date)}, ${escapeSqlString(exp.invoice_no || exp.invoice_number || exp.voucher_no || exp.voucher_number)}, ${escapeSqlString(exp.provider_name || exp.service_provider_name || exp.supplier_name || exp.registered_name)}, ${escapeSqlString(exp.provider_tin || exp.service_provider_TIN || exp.sp_tin || exp.tin_number)}, ${escapeSqlString(exp.provider_address || exp.service_provider_Address || exp.sp_address)}, ${escapeSqlString(exp.description || exp.description_of_expense)}, ${escapeSqlNumber(grossAmt)}, ${escapeSqlNumber(vatAmt)}, ${escapeSqlNumber(netAmt)}, ${escapeSqlNumber(ewtRate)}, ${escapeSqlNumber(ewtAmt)}, ${escapeSqlNumber(amtPayable)}, ${escapeSqlString(exp.account_code || '6010')}, ${escapeSqlString(exp.account_title || 'Operating Expenses')}, ${escapeSqlString(exp.atc_code)}, ${escapeSqlString(exp.status || exp.expense_status || 'Open')}, ${escapeSqlString(exp.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Payments
  sql += `-- -----------------------------------------------------------------------------
-- 8. Table: Payments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Payments\`;
CREATE TABLE \`Payments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`payment_date\` DATE NOT NULL,
  \`voucher_no\` VARCHAR(100) NOT NULL,
  \`invoice_no\` VARCHAR(100) DEFAULT NULL,
  \`provider_name\` VARCHAR(255) NOT NULL,
  \`provider_tin\` VARCHAR(50) DEFAULT NULL,
  \`amount_paid\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`ewt_deducted\` DECIMAL(15, 2) DEFAULT 0.00,
  \`net_cash_disbursed\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`payment_method\` VARCHAR(100) DEFAULT 'Check / Online Transfer',
  \`account_code\` VARCHAR(50) DEFAULT '1010',
  \`account_title\` VARCHAR(255) DEFAULT 'Cash in Bank',
  \`remarks\` TEXT DEFAULT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_pay_vouch\` (\`voucher_no\`),
  INDEX \`idx_pay_date\` (\`payment_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.payments && data.payments.length > 0) {
    sql += `-- Dumping records for Payments\n`;
    for (const p of data.payments) {
      const amtPaid = p.amount_paid || p.voucher_amount || p.gross_amount || 0;
      const ewtDeducted = p.ewt_deducted || p.withholding_tax_2307 || p.ewt_withheld || 0;
      const netCash = p.net_cash_disbursed || p.cash_disbursed || p.check_disbursed || (amtPaid - ewtDeducted);

      sql += `INSERT INTO \`Payments\` (\`id\`, \`payment_date\`, \`voucher_no\`, \`invoice_no\`, \`provider_name\`, \`provider_tin\`, \`amount_paid\`, \`ewt_deducted\`, \`net_cash_disbursed\`, \`payment_method\`, \`account_code\`, \`account_title\`, \`remarks\`, \`company_name\`) VALUES (${p.id}, ${escapeSqlDate(p.date || p.payment_date)}, ${escapeSqlString(p.voucher_no || p.voucher_number || p.ref_no || p.expense_reference || p.entry_number)}, ${escapeSqlString(p.invoice_no)}, ${escapeSqlString(p.provider_name || p.service_provider_name || p.payee || p.payee_name || p.registered_name)}, ${escapeSqlString(p.provider_tin || p.service_provider_TIN || p.sp_tin || p.payee_tin)}, ${escapeSqlNumber(amtPaid)}, ${escapeSqlNumber(ewtDeducted)}, ${escapeSqlNumber(netCash)}, ${escapeSqlString(p.payment_method || p.bank_name || 'Check / Online Transfer')}, ${escapeSqlString(p.account_code || '1010')}, ${escapeSqlString(p.account_title || 'Cash in Bank')}, ${escapeSqlString(p.remarks || p.notes)}, ${escapeSqlString(p.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table General_Journal
  sql += `-- -----------------------------------------------------------------------------
-- 9. Table: General_Journal
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`General_Journal\`;
CREATE TABLE \`General_Journal\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`entry_date\` DATE NOT NULL,
  \`entry_number\` VARCHAR(100) NOT NULL,
  \`reference_no\` VARCHAR(100) DEFAULT NULL,
  \`ref_type\` VARCHAR(50) DEFAULT 'General',
  \`source_module\` VARCHAR(100) DEFAULT 'General Journal',
  \`account_code\` VARCHAR(50) NOT NULL,
  \`account_title\` VARCHAR(255) NOT NULL,
  \`debit\` DECIMAL(15, 2) DEFAULT 0.00,
  \`credit\` DECIMAL(15, 2) DEFAULT 0.00,
  \`explanation\` TEXT DEFAULT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_gj_no\` (\`entry_number\`),
  INDEX \`idx_gj_date\` (\`entry_date\`),
  INDEX \`idx_gj_acc\` (\`account_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.generalJournal && data.generalJournal.length > 0) {
    sql += `-- Dumping records for General_Journal\n`;
    for (const gj of data.generalJournal) {
      sql += `INSERT INTO \`General_Journal\` (\`id\`, \`entry_date\`, \`entry_number\`, \`reference_no\`, \`ref_type\`, \`source_module\`, \`account_code\`, \`account_title\`, \`debit\`, \`credit\`, \`explanation\`, \`company_name\`) VALUES (${gj.id}, ${escapeSqlDate(gj.date || gj.entry_date)}, ${escapeSqlString(gj.entry_number || gj.entry_no)}, ${escapeSqlString(gj.reference_no || gj.ref_no)}, ${escapeSqlString(gj.ref_type || 'General')}, ${escapeSqlString(gj.source_module || 'General Journal')}, ${escapeSqlString(gj.account_code || '1010')}, ${escapeSqlString(gj.account_title || 'Cash and Cash Equivalents')}, ${escapeSqlNumber(gj.debit)}, ${escapeSqlNumber(gj.credit)}, ${escapeSqlString(gj.explanation || gj.description)}, ${escapeSqlString(gj.company_name)});\n`;
    }
    sql += `\n`;
  }

  // Table Chart_of_Accounts
  sql += `-- -----------------------------------------------------------------------------
-- 10. Table: Chart_of_Accounts
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Chart_of_Accounts\`;
CREATE TABLE \`Chart_of_Accounts\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`account_code\` VARCHAR(50) NOT NULL UNIQUE,
  \`account_title\` VARCHAR(255) NOT NULL,
  \`account_category\` VARCHAR(100) NOT NULL,
  \`financial_statement\` VARCHAR(100) NOT NULL,
  \`normal_balance\` VARCHAR(50) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_coa_code\` (\`account_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.chartOfAccounts && data.chartOfAccounts.length > 0) {
    sql += `-- Dumping records for Chart_of_Accounts\n`;
    for (const coa of data.chartOfAccounts) {
      sql += `INSERT INTO \`Chart_of_Accounts\` (\`id\`, \`account_code\`, \`account_title\`, \`account_category\`, \`financial_statement\`, \`normal_balance\`, \`description\`) VALUES (${coa.id}, ${escapeSqlString(coa.code || coa.account_code)}, ${escapeSqlString(coa.title || coa.account_title)}, ${escapeSqlString(coa.category || coa.account_category || 'Current Assets')}, ${escapeSqlString(coa.fs_type || coa.financial_statement || 'Financial Position')}, ${escapeSqlString(coa.balance_type || coa.normal_balance || 'Debit')}, ${escapeSqlString(coa.description)});\n`;
    }
    sql += `\n`;
  }

  // Table Payroll_and_Employees
  sql += `-- -----------------------------------------------------------------------------
-- 11. Table: Payroll_and_Employees
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`Payroll_and_Employees\`;
CREATE TABLE \`Payroll_and_Employees\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`employee_id\` VARCHAR(100) NOT NULL,
  \`employee_name\` VARCHAR(255) NOT NULL,
  \`tin\` VARCHAR(50) DEFAULT NULL,
  \`civil_status\` VARCHAR(50) DEFAULT 'Single',
  \`employment_status\` VARCHAR(50) DEFAULT 'Regular',
  \`is_mwe\` ENUM('Yes', 'No') DEFAULT 'No',
  \`statutory_mwe_day\` DECIMAL(15, 2) DEFAULT 0.00,
  \`statutory_mwe_month\` DECIMAL(15, 2) DEFAULT 0.00,
  \`is_main_employer\` ENUM('Yes', 'No') DEFAULT 'Yes',
  \`payroll_period\` VARCHAR(100) NOT NULL,
  \`period_from\` DATE DEFAULT NULL,
  \`period_to\` DATE DEFAULT NULL,
  \`basic_pay\` DECIMAL(15, 2) DEFAULT 0.00,
  \`holiday_pay\` DECIMAL(15, 2) DEFAULT 0.00,
  \`overtime_pay\` DECIMAL(15, 2) DEFAULT 0.00,
  \`night_diff\` DECIMAL(15, 2) DEFAULT 0.00,
  \`hazard_pay\` DECIMAL(15, 2) DEFAULT 0.00,
  \`thirteenth_month_pay\` DECIMAL(15, 2) DEFAULT 0.00,
  \`de_minimis\` DECIMAL(15, 2) DEFAULT 0.00,
  \`sss_deduction\` DECIMAL(15, 2) DEFAULT 0.00,
  \`philhealth_deduction\` DECIMAL(15, 2) DEFAULT 0.00,
  \`pagibig_deduction\` DECIMAL(15, 2) DEFAULT 0.00,
  \`taxable_basic\` DECIMAL(15, 2) DEFAULT 0.00,
  \`taxable_overtime\` DECIMAL(15, 2) DEFAULT 0.00,
  \`withholding_tax\` DECIMAL(15, 2) DEFAULT 0.00,
  \`gross_pay\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`total_deductions\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`net_pay\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_pay_emp\` (\`employee_id\`),
  INDEX \`idx_pay_period\` (\`payroll_period\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (data.payroll && data.payroll.length > 0) {
    sql += `-- Dumping records for Payroll_and_Employees\n`;
    for (const pr of data.payroll) {
      const isMwe = (pr.is_mwe === true || pr.is_mwe === 'Yes') ? 'Yes' : 'No';
      const isMain = (pr.is_main_employer !== false && pr.is_main_employer !== 'No') ? 'Yes' : 'No';
      sql += `INSERT INTO \`Payroll_and_Employees\` (\`id\`, \`employee_id\`, \`employee_name\`, \`tin\`, \`civil_status\`, \`employment_status\`, \`is_mwe\`, \`statutory_mwe_day\`, \`statutory_mwe_month\`, \`is_main_employer\`, \`payroll_period\`, \`period_from\`, \`period_to\`, \`basic_pay\`, \`holiday_pay\`, \`overtime_pay\`, \`night_diff\`, \`hazard_pay\`, \`thirteenth_month_pay\`, \`de_minimis\`, \`sss_deduction\`, \`philhealth_deduction\`, \`pagibig_deduction\`, \`taxable_basic\`, \`taxable_overtime\`, \`withholding_tax\`, \`gross_pay\`, \`total_deductions\`, \`net_pay\`, \`company_name\`) VALUES (${pr.id}, ${escapeSqlString(pr.employee_id || pr.employee_code)}, ${escapeSqlString(pr.employee_name || pr.full_name || `${pr.first_name || ''} ${pr.last_name || ''}`.trim())}, ${escapeSqlString(pr.tin)}, ${escapeSqlString(pr.civil_status || 'Single')}, ${escapeSqlString(pr.employment_status || 'Regular')}, '${isMwe}', ${escapeSqlNumber(pr.statutory_mwe_day)}, ${escapeSqlNumber(pr.statutory_mwe_month)}, '${isMain}', ${escapeSqlString(pr.payroll_period || 'Period 1')}, ${escapeSqlDate(pr.period_from)}, ${escapeSqlDate(pr.period_to)}, ${escapeSqlNumber(pr.basic_pay || pr.monthly_rate)}, ${escapeSqlNumber(pr.holiday_pay)}, ${escapeSqlNumber(pr.overtime_pay)}, ${escapeSqlNumber(pr.night_diff || pr.night_differential)}, ${escapeSqlNumber(pr.hazard_pay)}, ${escapeSqlNumber(pr.thirteenth_month_pay)}, ${escapeSqlNumber(pr.de_minimis || pr.de_minimis_benefits)}, ${escapeSqlNumber(pr.sss_deduction)}, ${escapeSqlNumber(pr.philhealth_deduction)}, ${escapeSqlNumber(pr.pagibig_deduction)}, ${escapeSqlNumber(pr.taxable_basic)}, ${escapeSqlNumber(pr.taxable_overtime)}, ${escapeSqlNumber(pr.withholding_tax)}, ${escapeSqlNumber(pr.gross_pay || pr.monthly_rate)}, ${escapeSqlNumber(pr.total_deductions || pr.total_statutory)}, ${escapeSqlNumber(pr.net_pay)}, ${escapeSqlString(pr.company_name)});\n`;
    }
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sql += `-- End of InfinityFree MySQL Dump\n`;

  return sql;
}

/**
 * Triggers a browser download of the generated SQL file
 */
export function downloadInfinityFreeSqlFile(sqlContent: string, filename = 'infinityfree_database.sql') {
  const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
