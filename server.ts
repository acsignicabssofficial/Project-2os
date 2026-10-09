import express from "express";
import path from "path";
import fs from "fs";
import initSqlJs, { Database } from "sql.js";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_COMPANIES,
  INITIAL_CUSTOMERS,
  INITIAL_CONTRACTORS,
  INITIAL_SALES,
  INITIAL_COLLECTIONS,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_PPE,
  INITIAL_ACCOUNT_TITLES,
  INITIAL_SPECIAL_ENTRIES,
  INITIAL_INCOME_TAX_RECORDS
} from "./src/data";

const app = express();
const PORT = 3000;
const DB_SQLITE_FILE = path.join(process.cwd(), "2os_database.db");
const DB_JSON_BACKUP = path.join(process.cwd(), "2os_database.json");

app.use(express.json({ limit: "50mb" }));

let db: Database;

async function initSqliteDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_SQLITE_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_SQLITE_FILE);
      db = new SQL.Database(fileBuffer);
      console.log("Loaded existing SQLite database file: 2os_database.db");
    } catch (e) {
      console.error("Failed to load existing 2os_database.db, creating new database instance:", e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log("Initialized new SQLite database instance");
  }

  // Create SQLite Tables for all accounting aspects
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      company_tin TEXT,
      rdo_code TEXT,
      line_of_business TEXT,
      address TEXT,
      zip_code TEXT,
      email TEXT,
      phone TEXT,
      is_vat_registered INTEGER,
      tax_regime TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      customer_name TEXT,
      customer_tin TEXT,
      address TEXT,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      contractor_name TEXT,
      contractor_tin TEXT,
      address TEXT,
      service_type TEXT,
      atc_code TEXT,
      email TEXT,
      phone TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      customer_name TEXT,
      customer_tin TEXT,
      invoice_amount REAL,
      withholding_2307 REAL,
      vat_exempt_amount REAL,
      discounts REAL,
      down_payment REAL,
      output_vat REAL,
      sales_status TEXT,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      invoice_number TEXT,
      collection_date TEXT,
      customer_name TEXT,
      amount_collected REAL,
      amount_withheld_2307 REAL,
      payment_method TEXT,
      OR_PR_number TEXT,
      entry_number TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      voucher_number TEXT,
      expense_date TEXT,
      service_provider_name TEXT,
      service_provider_tin TEXT,
      expense_type TEXT,
      expense_invoice_amount REAL,
      vat_input_amount REAL,
      withholding_2307_2306 REAL,
      discounts REAL,
      nonvat_or_vat TEXT,
      expense_status TEXT,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      voucher_number TEXT,
      payment_date TEXT,
      service_provider_name TEXT,
      amount_paid REAL,
      withholding_tax_2307 REAL,
      payment_method TEXT,
      check_voucher_number TEXT,
      entry_number TEXT,
      created_at TEXT
    );

    -- 2OS UNIFORM 21-HEADER BOOKS OF ACCOUNTS TABLES
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
      is_cancelled INTEGER,
      created_at TEXT
    );

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
      is_cancelled INTEGER,
      created_at TEXT
    );

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
      is_cancelled INTEGER,
      created_at TEXT
    );

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
      is_cancelled INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ppe_assets (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      asset_code TEXT,
      asset_name TEXT,
      category TEXT,
      acquisition_date TEXT,
      acquisition_cost REAL,
      salvage_value REAL,
      useful_life_years REAL,
      depreciation_method TEXT,
      accumulated_depreciation REAL,
      net_book_value REAL,
      status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS account_titles (
      id INTEGER PRIMARY KEY,
      code TEXT,
      title TEXT,
      category TEXT,
      type TEXT,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS special_entries (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      entry_number TEXT,
      voucher_no TEXT,
      entry_date TEXT,
      entry_type TEXT,
      description TEXT,
      lines_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS income_tax_records (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      taxable_year TEXT,
      quarter_period TEXT,
      entity_type TEXT,
      tax_regime TEXT,
      deduction_method TEXT,
      gross_sales REAL,
      cost_of_sales REAL,
      itemized_expenses REAL,
      allowable_deductions REAL,
      taxable_income REAL,
      computed_tax_due REAL,
      creditable_tax_2307 REAL,
      quarterly_tax_payments REAL,
      net_tax_payable REAL,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      employee_id TEXT,
      employee_name TEXT,
      payroll_period TEXT,
      basic_pay REAL,
      overtime_pay REAL,
      allowances REAL,
      gross_pay REAL,
      sss_deduction REAL,
      philhealth_deduction REAL,
      pagibig_deduction REAL,
      withholding_tax REAL,
      other_deductions REAL,
      net_pay REAL,
      status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      employee_id TEXT,
      full_name TEXT,
      tin TEXT,
      sss_number TEXT,
      philhealth_number TEXT,
      pagibig_number TEXT,
      position TEXT,
      department TEXT,
      monthly_rate REAL,
      daily_rate REAL,
      tax_status TEXT,
      is_subject_to_contributions INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );
  `);

  // Seed Standard Chart of Accounts if account_titles table is empty
  const acctRes = db.exec("SELECT COUNT(*) as cnt FROM account_titles");
  const acctCount = acctRes[0]?.values[0]?.[0] || 0;
  if (acctCount === 0 && Array.isArray(INITIAL_ACCOUNT_TITLES) && INITIAL_ACCOUNT_TITLES.length > 0) {
    const stmt = db.prepare(`INSERT INTO account_titles VALUES (?, ?, ?, ?, ?, ?, ?)`);
    INITIAL_ACCOUNT_TITLES.forEach((a: any) => {
      stmt.run([
        a.id || Math.floor(Math.random() * 1000000), a.code, a.title, a.category,
        a.type, a.description || "", new Date().toISOString()
      ]);
    });
    stmt.free();
  }
  persistSqliteBuffer();
}

function persistSqliteBuffer() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_SQLITE_FILE, buffer);
    } catch (e) {
      console.error("Error writing 2os_database.db to disk:", e);
    }
  }
}

function queryTableRows(tableName: string) {
  try {
    const res = db.exec(`SELECT * FROM ${tableName}`);
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } catch (e) {
    return [];
  }
}

function getLedgerDataFromSqlite() {
  const companies = queryTableRows("companies").map(c => ({
    ...c,
    is_vat_registered: Boolean(c.is_vat_registered)
  }));
  const customers = queryTableRows("customers");
  const contractors = queryTableRows("contractors");
  const sales = queryTableRows("sales");
  const collections = queryTableRows("collections");
  const expenses = queryTableRows("expenses");
  const payments = queryTableRows("payments");
  const ppeAssets = queryTableRows("ppe_assets");
  const accountTitles = queryTableRows("account_titles");
  const specialEntries = queryTableRows("special_entries").map(s => {
    let lines = [];
    try {
      lines = s.lines_json ? JSON.parse(s.lines_json) : [];
    } catch (e) {}
    return {
      ...s,
      lines
    };
  });
  const incomeTaxRecords = queryTableRows("income_tax_records");
  const payrollRecords = queryTableRows("payroll_records");
  const employees = queryTableRows("employees").map(e => ({
    ...e,
    is_subject_to_contributions: Boolean(e.is_subject_to_contributions)
  }));

  // Query 2OS Uniform Books of Accounts Tables
  let subsidiarySales = queryTableRows("subsidiary_sales");
  let subsidiaryPurchases = queryTableRows("subsidiary_purchases");
  let cashReceipts = queryTableRows("cash_receipts");
  let cashDisbursements = queryTableRows("cash_disbursements");

  // Migration/Fallback: If uniform tables are empty, convert from legacy tables
  if (subsidiarySales.length === 0 && sales.length > 0) {
    subsidiarySales = sales.map(s => ({
      id: s.id,
      company_name: s.company_name,
      registered_name: s.customer_name || "Customer",
      vat_or_nonvat: (s.output_vat > 0 ? "VAT" : "NONVAT"),
      tin: s.customer_tin || "000-000-000-00000",
      address: s.address || "",
      type_of_transaction: (s.sales_status === "Paid" ? "CASH" : "ON ACCOUNT"),
      date: s.invoice_date || new Date().toISOString().split("T")[0],
      invoice_type: "SALES INVOICE",
      voucher_number: "",
      invoice_number: s.invoice_number,
      particulars: s.description || "Sales Invoice Item",
      qty: s.qty || 1,
      unit_price: s.unit_price || s.invoice_amount || 0,
      amount: s.invoice_amount || 0,
      vatable_amount: s.output_vat > 0 ? Math.round(((s.invoice_amount || 0) / 1.12) * 100) / 100 : 0,
      vat_amount: s.output_vat || 0,
      zero_rated_amount: 0,
      vat_exempt_amount: s.vat_exempt_amount || 0,
      total_amount_vat_inclusive: s.invoice_amount || 0,
      total_amount_net_of_vat: Math.round(((s.invoice_amount || 0) - (s.output_vat || 0)) * 100) / 100,
      discount: s.discounts || 0,
      tax_withheld: s.withholding_2307 || 0,
      total_amount_due: Math.round(((s.invoice_amount || 0) - (s.discounts || 0) - (s.withholding_2307 || 0)) * 100) / 100,
      is_cancelled: s.sales_status === "Cancelled" ? 1 : 0,
      created_at: s.created_at || new Date().toISOString()
    }));
  }

  if (subsidiaryPurchases.length === 0 && expenses.length > 0) {
    subsidiaryPurchases = expenses.map(e => ({
      id: e.id,
      company_name: e.company_name,
      registered_name: e.service_provider_name || "Vendor",
      vat_or_nonvat: e.nonvat_or_vat === "NON-VATABLE" ? "NONVAT" : "VAT",
      tin: e.service_provider_tin || "000-000-000-00000",
      address: "",
      type_of_transaction: (e.expense_status === "Paid" ? "CASH" : "ON ACCOUNT"),
      date: e.expense_date || new Date().toISOString().split("T")[0],
      invoice_type: "OFFICIAL RECEIPT",
      voucher_number: e.voucher_number || "",
      invoice_number: e.invoice_number || e.voucher_number || "EXP-001",
      particulars: e.description || e.expense_type || "Purchases Item",
      qty: 1,
      unit_price: e.expense_invoice_amount || 0,
      amount: e.expense_invoice_amount || 0,
      vatable_amount: e.vat_input_amount > 0 ? Math.round(((e.expense_invoice_amount || 0) / 1.12) * 100) / 100 : 0,
      vat_amount: e.vat_input_amount || 0,
      zero_rated_amount: 0,
      vat_exempt_amount: 0,
      total_amount_vat_inclusive: e.expense_invoice_amount || 0,
      total_amount_net_of_vat: Math.round(((e.expense_invoice_amount || 0) - (e.vat_input_amount || 0)) * 100) / 100,
      discount: e.discounts || 0,
      tax_withheld: e.withholding_2307_2306 || 0,
      total_amount_due: Math.round(((e.expense_invoice_amount || 0) - (e.discounts || 0) - (e.withholding_2307_2306 || 0)) * 100) / 100,
      is_cancelled: e.expense_status === "Cancelled" ? 1 : 0,
      created_at: e.created_at || new Date().toISOString()
    }));
  }

  if (cashReceipts.length === 0 && collections.length > 0) {
    cashReceipts = collections.map(c => ({
      id: c.id,
      company_name: c.company_name,
      registered_name: c.customer_name || "Customer",
      vat_or_nonvat: "VAT",
      tin: "000-000-000-00000",
      address: "",
      type_of_transaction: "CASH",
      date: c.collection_date || new Date().toISOString().split("T")[0],
      invoice_type: "OFFICIAL RECEIPT",
      voucher_number: c.entry_number || "",
      invoice_number: c.invoice_number || c.OR_PR_number || "CR-001",
      particulars: `Collection for Invoice #${c.invoice_number}`,
      qty: 1,
      unit_price: c.amount_collected || 0,
      amount: c.amount_collected || 0,
      vatable_amount: Math.round(((c.amount_collected || 0) / 1.12) * 100) / 100,
      vat_amount: Math.round(((c.amount_collected || 0) - ((c.amount_collected || 0) / 1.12)) * 100) / 100,
      zero_rated_amount: 0,
      vat_exempt_amount: 0,
      total_amount_vat_inclusive: c.amount_collected || 0,
      total_amount_net_of_vat: Math.round(((c.amount_collected || 0) / 1.12) * 100) / 100,
      discount: 0,
      tax_withheld: c.amount_withheld_2307 || 0,
      total_amount_due: (c.amount_collected || 0) - (c.amount_withheld_2307 || 0),
      is_cancelled: 0,
      created_at: c.created_at || new Date().toISOString()
    }));
  }

  if (cashDisbursements.length === 0 && payments.length > 0) {
    cashDisbursements = payments.map(p => ({
      id: p.id,
      company_name: p.company_name,
      registered_name: p.service_provider_name || "Payee",
      vat_or_nonvat: "VAT",
      tin: "000-000-000-00000",
      address: "",
      type_of_transaction: "CASH",
      date: p.payment_date || new Date().toISOString().split("T")[0],
      invoice_type: "OFFICIAL RECEIPT",
      voucher_number: p.voucher_number || p.check_voucher_number || "",
      invoice_number: p.voucher_number || "CD-001",
      particulars: `Disbursement / Payment for Voucher #${p.voucher_number}`,
      qty: 1,
      unit_price: p.amount_paid || 0,
      amount: p.amount_paid || 0,
      vatable_amount: Math.round(((p.amount_paid || 0) / 1.12) * 100) / 100,
      vat_amount: Math.round(((p.amount_paid || 0) - ((p.amount_paid || 0) / 1.12)) * 100) / 100,
      zero_rated_amount: 0,
      vat_exempt_amount: 0,
      total_amount_vat_inclusive: p.amount_paid || 0,
      total_amount_net_of_vat: Math.round(((p.amount_paid || 0) / 1.12) * 100) / 100,
      discount: 0,
      tax_withheld: p.withholding_tax_2307 || 0,
      total_amount_due: (p.amount_paid || 0) - (p.withholding_tax_2307 || 0),
      is_cancelled: 0,
      created_at: p.created_at || new Date().toISOString()
    }));
  }

  const activeCompSetting = queryTableRows("app_settings").find(s => s.setting_key === "activeCompanyId");
  const themeSetting = queryTableRows("app_settings").find(s => s.setting_key === "theme");

  const activeCompanyId = activeCompSetting ? Number(activeCompSetting.setting_value) : (companies[0]?.id || null);
  const theme = themeSetting ? themeSetting.setting_value : "neon_light";

  return {
    companies,
    activeCompanyId,
    customers,
    contractors,
    // Uniform Books
    subsidiarySales,
    subsidiaryPurchases,
    cashReceipts,
    cashDisbursements,
    collectionsRecords: cashReceipts,
    paymentsRecords: cashDisbursements,
    // Legacy properties for existing tabs
    sales: subsidiarySales.length > 0 ? subsidiarySales : sales,
    collections: cashReceipts.length > 0 ? cashReceipts : collections,
    expenses: subsidiaryPurchases.length > 0 ? subsidiaryPurchases : expenses,
    payments: cashDisbursements.length > 0 ? cashDisbursements : payments,
    ppeAssets,
    accountTitles,
    specialEntries,
    incomeTaxRecords,
    payrollRecords,
    employees,
    theme
  };
}

// Entity Directory Hierarchy Generator
// Strictly adhering to Philippine Corporate / Branch document filing structure:
// entity directory/
//   └── <company name>/
//       ├── main (if branch code is 00000)/
//       │   ├── main documents/ (dti/sec, bir, lgu, other documents)
//       │   └── <year> transactions/ (sales, expenses, 2307, 2316, tax compliances/attachments, tax compliances/filings)
//       └── branch 1 (depending on the branch code other than 00000)/
//           ├── main documents/ (dti/sec, bir, lgu, other documents)
//           └── <year> transactions/ (sales, expenses, 2307, 2316, tax compliances/attachments, tax compliances/filings)

export function createEntityDirectoryTree(companyName: string, branchCode?: string, year?: string | number) {
  if (!companyName || !companyName.trim()) return [];
  const cleanCompName = companyName.trim();
  // Safe directory name for OS filesystems (Windows & POSIX)
  const safeCompDir = cleanCompName.replace(/[\\/:*?"<>|]/g, "_").trim();

  // Year defaults to current year (2026)
  const yr = year ? String(year).trim().slice(0, 4) : new Date().getFullYear().toString();
  const validYear = /^\d{4}$/.test(yr) ? yr : new Date().getFullYear().toString();

  // Branch folder determination:
  // "main (if branch code is 00000)"
  // "branch 1 (depending on the branch code other than 00000)"
  const branchFolders: string[] = [];
  const cleanBranch = branchCode ? String(branchCode).trim() : "00000";

  if (cleanBranch === "00000" || cleanBranch === "0" || cleanBranch === "") {
    branchFolders.push("main");
    // Also include branch 1 to provide the full tree matching sample diagram
    branchFolders.push("branch 1");
  } else {
    const branchNum = parseInt(cleanBranch, 10);
    const branchName = !isNaN(branchNum) ? `branch ${branchNum}` : `branch ${cleanBranch}`;
    branchFolders.push(branchName);
    branchFolders.push("main");
  }

  const createdPaths: string[] = [];

  // Targets:
  // 1. Root ./entity directory
  // 2. ./for pc demo/entity directory
  const baseDirectories = [
    path.join(process.cwd(), "entity directory"),
    path.join(process.cwd(), "for pc demo", "entity directory")
  ];

  for (const baseDir of baseDirectories) {
    const compDir = path.join(baseDir, safeCompDir);

    for (const branch of branchFolders) {
      const branchDir = path.join(compDir, branch);

      const subDirs = [
        path.join(branchDir, "main documents", "dti", "sec"),
        path.join(branchDir, "main documents", "dti-sec"),
        path.join(branchDir, "main documents", "dti"),
        path.join(branchDir, "main documents", "sec"),
        path.join(branchDir, "main documents", "bir"),
        path.join(branchDir, "main documents", "lgu"),
        path.join(branchDir, "main documents", "other documents"),
        path.join(branchDir, `${validYear} transactions`, "sales"),
        path.join(branchDir, `${validYear} transactions`, "expenses"),
        path.join(branchDir, `${validYear} transactions`, "2307"),
        path.join(branchDir, `${validYear} transactions`, "2316"),
        path.join(branchDir, `${validYear} transactions`, "tax compliances", "attachments"),
        path.join(branchDir, `${validYear} transactions`, "tax compliances", "filings")
      ];

      for (const dir of subDirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const gitKeep = path.join(dir, ".gitkeep");
        if (!fs.existsSync(gitKeep)) {
          try {
            fs.writeFileSync(gitKeep, "");
          } catch (_) {}
        }
      }

      createdPaths.push(branchDir);
    }
  }

  return createdPaths;
}

function saveLedgerToSqlite(data: any) {
  db.run("BEGIN TRANSACTION;");

  // Clear existing rows
  [
    "companies", "customers", "contractors", "sales", "collections",
    "expenses", "payments", "subsidiary_sales", "subsidiary_purchases",
    "cash_receipts", "cash_disbursements", "ppe_assets", "account_titles",
    "special_entries", "income_tax_records", "payroll_records", "employees", "app_settings"
  ].forEach(tbl => {
    db.run(`DELETE FROM ${tbl}`);
  });

  // 1. Companies
  if (Array.isArray(data.companies)) {
    const stmt = db.prepare(`INSERT INTO companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.companies.forEach((c: any) => {
      stmt.run([
        c.id, c.company_name, c.company_tin, c.rdo_code, c.line_of_business,
        c.address, c.zip_code, c.email, c.phone, c.is_vat_registered ? 1 : 0,
        c.tax_regime, c.created_at || new Date().toISOString()
      ]);
      try {
        createEntityDirectoryTree(c.company_name, c.tin_branch_code || "00000", c.created_at || c.birthday_or_incorporation_date);
      } catch (err) {
        console.error("Failed creating entity directory for company:", c.company_name, err);
      }
    });
    stmt.free();
  }

  // 2. Customers
  if (Array.isArray(data.customers)) {
    const stmt = db.prepare(`INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.customers.forEach((c: any) => {
      stmt.run([
        c.id, c.company_name, c.customer_name, c.customer_tin, c.address,
        c.contact_person, c.email, c.phone, c.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 3. Contractors
  if (Array.isArray(data.contractors)) {
    const stmt = db.prepare(`INSERT INTO contractors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.contractors.forEach((c: any) => {
      stmt.run([
        c.id, c.company_name, c.contractor_name, c.contractor_tin, c.address,
        c.service_type, c.atc_code, c.email, c.phone, c.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 4. Subsidiary Sales (Uniform Table)
  const salesList = Array.isArray(data.subsidiarySales) ? data.subsidiarySales : (Array.isArray(data.sales) ? data.sales : []);
  if (salesList.length > 0) {
    const stmt = db.prepare(`INSERT INTO subsidiary_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    salesList.forEach((s: any) => {
      stmt.run([
        s.id,
        s.company_name || "",
        s.registered_name || s.customer_name || "",
        s.vat_or_nonvat || (s.output_vat > 0 ? "VAT" : "NONVAT"),
        s.tin || s.customer_tin || s.client_TIN || "",
        s.address || s.client_Address || "",
        s.type_of_transaction || (s.sales_status === "Paid" ? "CASH" : "ON ACCOUNT"),
        s.date || s.invoice_date || s.issue_date || "",
        s.invoice_type || "SALES INVOICE",
        s.voucher_number || "",
        s.invoice_number || "",
        s.particulars || s.description || "",
        Number(s.qty) || 1,
        Number(s.unit_price) || 0,
        Number(s.amount || s.invoice_amount) || 0,
        Number(s.vatable_amount || s.vatable_sales) || 0,
        Number(s.vat_amount || s.output_vat) || 0,
        Number(s.zero_rated_amount || s.zero_rated) || 0,
        Number(s.vat_exempt_amount || s.vat_exempt) || 0,
        Number(s.total_amount_vat_inclusive || s.total_sale_vat_inclusive || s.invoice_amount) || 0,
        Number(s.total_amount_net_of_vat || s.amount_net_of_vat) || 0,
        Number(s.discount || s.discounts || s.less_discount) || 0,
        Number(s.tax_withheld || s.withholding_2307 || s.less_withholding_tax) || 0,
        Number(s.total_amount_due) || 0,
        s.is_cancelled ? 1 : 0,
        s.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // Also populate legacy sales table for backwards compatibility
  if (salesList.length > 0) {
    const stmt = db.prepare(`INSERT INTO sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    salesList.forEach((s: any) => {
      stmt.run([
        s.id,
        s.company_name || "",
        s.invoice_number || "",
        s.date || s.invoice_date || "",
        s.registered_name || s.customer_name || "",
        s.tin || s.customer_tin || "",
        Number(s.amount || s.invoice_amount) || 0,
        Number(s.tax_withheld || s.withholding_2307) || 0,
        Number(s.vat_exempt_amount) || 0,
        Number(s.discount || s.discounts) || 0,
        Number(s.down_payment) || 0,
        Number(s.vat_amount || s.output_vat) || 0,
        s.type_of_transaction === "CASH" ? "Paid" : "On Account",
        s.particulars || s.description || "",
        s.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 5. Subsidiary Purchases (Uniform Table)
  const purchasesList = Array.isArray(data.subsidiaryPurchases) ? data.subsidiaryPurchases : (Array.isArray(data.expenses) ? data.expenses : []);
  if (purchasesList.length > 0) {
    const stmt = db.prepare(`INSERT INTO subsidiary_purchases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    purchasesList.forEach((e: any) => {
      stmt.run([
        e.id,
        e.company_name || "",
        e.registered_name || e.service_provider_name || "",
        e.vat_or_nonvat || (e.nonvat_or_vat === "NON-VATABLE" ? "NONVAT" : "VAT"),
        e.tin || e.service_provider_tin || e.sp_tin || "",
        e.address || e.sp_address || "",
        e.type_of_transaction || (e.expense_status === "Paid" ? "CASH" : "ON ACCOUNT"),
        e.date || e.expense_date || "",
        e.invoice_type || "OFFICIAL RECEIPT",
        e.voucher_number || e.voucher_no || "",
        e.invoice_number || e.voucher_number || "",
        e.particulars || e.description || e.expense_type || "",
        Number(e.qty) || 1,
        Number(e.unit_price) || 0,
        Number(e.amount || e.expense_invoice_amount) || 0,
        Number(e.vatable_amount || e.vatable_expense) || 0,
        Number(e.vat_amount || e.vat_input_amount) || 0,
        Number(e.zero_rated_amount || e.zero_rated) || 0,
        Number(e.vat_exempt_amount || e.vat_exempt) || 0,
        Number(e.total_amount_vat_inclusive || e.total_expenses_vat_inclusive || e.expense_invoice_amount) || 0,
        Number(e.total_amount_net_of_vat || e.amount_net_of_vat) || 0,
        Number(e.discount || e.discounts || e.less_discount) || 0,
        Number(e.tax_withheld || e.withholding_2307_2306 || e.less_withholding_tax) || 0,
        Number(e.total_amount_due) || 0,
        e.is_cancelled ? 1 : 0,
        e.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // Also populate legacy expenses table for backwards compatibility
  if (purchasesList.length > 0) {
    const stmt = db.prepare(`INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    purchasesList.forEach((e: any) => {
      stmt.run([
        e.id,
        e.company_name || "",
        e.voucher_number || "",
        e.date || e.expense_date || "",
        e.registered_name || e.service_provider_name || "",
        e.tin || e.service_provider_tin || "",
        e.particulars || e.expense_type || "Expense",
        Number(e.amount || e.expense_invoice_amount) || 0,
        Number(e.vat_amount || e.vat_input_amount) || 0,
        Number(e.tax_withheld || e.withholding_2307_2306) || 0,
        Number(e.discount || e.discounts) || 0,
        e.vat_or_nonvat || "VAT",
        e.type_of_transaction === "CASH" ? "Paid" : "Unpaid",
        e.particulars || e.description || "",
        e.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 6. Cash Receipts (Uniform Table)
  const receiptsList = Array.isArray(data.cashReceipts) ? data.cashReceipts : (Array.isArray(data.collections) ? data.collections : []);
  if (receiptsList.length > 0) {
    const stmt = db.prepare(`INSERT INTO cash_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    receiptsList.forEach((c: any) => {
      stmt.run([
        c.id,
        c.company_name || "",
        c.registered_name || c.customer_name || "",
        c.vat_or_nonvat || "VAT",
        c.tin || c.customer_tin || "",
        c.address || "",
        c.type_of_transaction || "CASH",
        c.date || c.collection_date || "",
        c.invoice_type || "OFFICIAL RECEIPT",
        c.voucher_number || c.entry_number || "",
        c.invoice_number || c.OR_PR_number || "",
        c.particulars || c.notes || "",
        Number(c.qty) || 1,
        Number(c.unit_price) || 0,
        Number(c.amount || c.amount_collected) || 0,
        Number(c.vatable_amount) || 0,
        Number(c.vat_amount) || 0,
        Number(c.zero_rated_amount) || 0,
        Number(c.vat_exempt_amount) || 0,
        Number(c.total_amount_vat_inclusive || c.amount_collected) || 0,
        Number(c.total_amount_net_of_vat) || 0,
        Number(c.discount) || 0,
        Number(c.tax_withheld || c.amount_withheld_2307) || 0,
        Number(c.total_amount_due) || 0,
        c.is_cancelled ? 1 : 0,
        c.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // Also populate legacy collections table
  if (receiptsList.length > 0) {
    const stmt = db.prepare(`INSERT INTO collections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    receiptsList.forEach((c: any) => {
      stmt.run([
        c.id,
        c.company_name || "",
        c.invoice_number || "",
        c.date || c.collection_date || "",
        c.registered_name || c.customer_name || "",
        Number(c.amount || c.amount_collected) || 0,
        Number(c.tax_withheld || c.amount_withheld_2307) || 0,
        "Cash / Bank",
        c.invoice_number || "",
        c.voucher_number || "",
        c.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 7. Cash Disbursements (Uniform Table)
  const disbList = Array.isArray(data.cashDisbursements) ? data.cashDisbursements : (Array.isArray(data.payments) ? data.payments : []);
  if (disbList.length > 0) {
    const stmt = db.prepare(`INSERT INTO cash_disbursements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    disbList.forEach((p: any) => {
      stmt.run([
        p.id,
        p.company_name || "",
        p.registered_name || p.service_provider_name || "",
        p.vat_or_nonvat || "VAT",
        p.tin || p.sp_tin || "",
        p.address || "",
        p.type_of_transaction || "CASH",
        p.date || p.payment_date || "",
        p.invoice_type || "OFFICIAL RECEIPT",
        p.voucher_number || p.check_voucher_number || "",
        p.invoice_number || p.voucher_number || "",
        p.particulars || p.notes || "",
        Number(p.qty) || 1,
        Number(p.unit_price) || 0,
        Number(p.amount || p.amount_paid) || 0,
        Number(p.vatable_amount) || 0,
        Number(p.vat_amount) || 0,
        Number(p.zero_rated_amount) || 0,
        Number(p.vat_exempt_amount) || 0,
        Number(p.total_amount_vat_inclusive || p.amount_paid) || 0,
        Number(p.total_amount_net_of_vat) || 0,
        Number(p.discount) || 0,
        Number(p.tax_withheld || p.withholding_tax_2307) || 0,
        Number(p.total_amount_due) || 0,
        p.is_cancelled ? 1 : 0,
        p.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // Also populate legacy payments table
  if (disbList.length > 0) {
    const stmt = db.prepare(`INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    disbList.forEach((p: any) => {
      stmt.run([
        p.id,
        p.company_name || "",
        p.voucher_number || "",
        p.date || p.payment_date || "",
        p.registered_name || p.service_provider_name || "",
        Number(p.amount || p.amount_paid) || 0,
        Number(p.tax_withheld || p.withholding_tax_2307) || 0,
        "Cash / Check",
        p.voucher_number || "",
        p.voucher_number || "",
        p.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 8. PPE Assets
  if (Array.isArray(data.ppeAssets)) {
    const stmt = db.prepare(`INSERT INTO ppe_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.ppeAssets.forEach((p: any) => {
      stmt.run([
        p.id, p.company_name, p.asset_code, p.asset_name, p.category, p.acquisition_date,
        p.acquisition_cost, p.salvage_value, p.useful_life_years, p.depreciation_method,
        p.accumulated_depreciation, p.net_book_value, p.status, p.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 9. Account Titles
  if (Array.isArray(data.accountTitles)) {
    const stmt = db.prepare(`INSERT INTO account_titles VALUES (?, ?, ?, ?, ?, ?, ?)`);
    data.accountTitles.forEach((a: any) => {
      stmt.run([
        a.id || Math.floor(Math.random() * 1000000), a.code, a.title, a.category,
        a.type, a.description || "", a.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 10. Special Entries
  if (Array.isArray(data.specialEntries)) {
    const stmt = db.prepare(`INSERT INTO special_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.specialEntries.forEach((s: any) => {
      stmt.run([
        s.id, s.company_name, s.entry_number, s.voucher_no, s.entry_date, s.entry_type,
        s.description || "", JSON.stringify(s.lines || []), s.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 11. Income Tax Records
  if (Array.isArray(data.incomeTaxRecords)) {
    const stmt = db.prepare(`INSERT INTO income_tax_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.incomeTaxRecords.forEach((t: any) => {
      stmt.run([
        t.id, t.company_name, t.taxable_year, t.quarter_period, t.entity_type, t.tax_regime,
        t.deduction_method, t.gross_sales, t.cost_of_sales || 0, t.itemized_expenses,
        t.allowable_deductions, t.taxable_income, t.computed_tax_due, t.creditable_tax_2307,
        t.quarterly_tax_payments, t.net_tax_payable, t.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 12. Payroll Records
  if (Array.isArray(data.payrollRecords)) {
    const stmt = db.prepare(`INSERT INTO payroll_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.payrollRecords.forEach((p: any) => {
      stmt.run([
        p.id, p.company_name, p.employee_id, p.employee_name, p.payroll_period,
        p.basic_pay, p.overtime_pay || 0, p.allowances || 0, p.gross_pay,
        p.sss_deduction, p.philhealth_deduction, p.pagibig_deduction, p.withholding_tax,
        p.other_deductions || 0, p.net_pay, p.status || "Processed", p.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 13. Employees
  if (Array.isArray(data.employees)) {
    const stmt = db.prepare(`INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.employees.forEach((e: any) => {
      stmt.run([
        e.id, e.company_name, e.employee_id, e.full_name, e.tin, e.sss_number,
        e.philhealth_number, e.pagibig_number, e.position, e.department,
        e.monthly_rate || 0, e.daily_rate || 0, e.tax_status || "S",
        e.is_subject_to_contributions ? 1 : 0, e.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 14. App Settings
  const stmtSettings = db.prepare(`INSERT INTO app_settings VALUES (?, ?)`);
  stmtSettings.run(["activeCompanyId", String(data.activeCompanyId || "")]);
  stmtSettings.run(["theme", String(data.theme || "neon_light")]);
  stmtSettings.free();

  db.run("COMMIT;");

  // Save SQLite binary db file to disk
  persistSqliteBuffer();

  // Also write JSON backup file for safety
  try {
    fs.writeFileSync(DB_JSON_BACKUP, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed writing JSON backup:", e);
  }
}

app.get("/api/ledger-data", (req, res) => {
  try {
    const data = getLedgerDataFromSqlite();
    res.json(data);
  } catch (e) {
    console.error("Error reading from SQLite database:", e);
    res.status(500).json({ error: "Failed to read database" });
  }
});

// Download standalone single-file index.html for direct upload to InfinityFree / cPanel
// Dedicated standalone download landing page with auto-download and offline blob fallback
app.get("/download", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "2OS_Accounting_Pitch_Deck.pptx");
  let b64 = "";
  if (fs.existsSync(filePath)) {
    b64 = fs.readFileSync(filePath).toString("base64");
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download 2OS Accounting Pitch Deck</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #070E22;
      color: #F8FAFC;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #0D1636;
      border: 1px solid rgba(2, 184, 172, 0.3);
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(2, 184, 172, 0.15);
      border: 1px solid #02B8AC;
      color: #38BDF8;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    p {
      color: #94A3B8;
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #02B8AC;
      color: #070E22;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: #38BDF8;
      transform: translateY(-1px);
    }
    .status {
      margin-top: 18px;
      font-size: 13px;
      color: #02B8AC;
    }
    .info {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">2OS ACCOUNTING SYSTEM • LIGHT EXECUTIVE EDITION</div>
    <h1>2OS Pitch Deck (PowerPoint)</h1>
    <p>11-slide Widescreen (16:9) presentation sa <strong>Light Theme</strong> na may mga <strong>Visual Aids ng MS Office-Style Toolbars, Ribbon Tools, Formula Bar, at Worksheets</strong> (Home Dashboard, Directory, Books of Accounts, Payroll, PFRS Statements, at BIR 2307).</p>
    
    <button id="downloadBtn" class="btn" onclick="triggerDownload()">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      I-download ang 2OS_Accounting_Pitch_Deck.pptx
    </button>

    <div id="status" class="status">Nagsisimula na ang download...</div>

    <div class="info">
      File size: 491 KB • Format: Microsoft PowerPoint (.pptx)<br/>
      Widescreen 16:9 • Light Executive Theme • Compatible with PowerPoint, Google Slides, Keynote
    </div>
  </div>

  <script>
    const b64Data = "${b64}";

    function triggerDownload() {
      try {
        const byteCharacters = atob(b64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "2OS_Accounting_Pitch_Deck.pptx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        document.getElementById("status").textContent = "Matagumpay na nai-download ang file!";
      } catch (e) {
        // Fallback to direct HTTP endpoint
        window.location.href = "/api/download-pitch-deck";
      }
    }

    // Auto-trigger on page load
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(triggerDownload, 300);
    });
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/api/download-pitch-deck", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "2OS_Accounting_Pitch_Deck.pptx");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="2OS_Accounting_Pitch_Deck.pptx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Presentation file not found.");
  }
});

app.get("/2OS_Accounting_Pitch_Deck.pptx", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "2OS_Accounting_Pitch_Deck.pptx");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="2OS_Accounting_Pitch_Deck.pptx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Presentation file not found.");
  }
});

app.get("/api/download-singlefile-html", (req, res) => {
  const distHtmlPath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(distHtmlPath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="index.html"');
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(distHtmlPath);
  } else {
    res.status(404).send("Build index.html not found. Please run build first.");
  }
});

app.post("/api/ledger-data", (req, res) => {
  const data = req.body;
  try {
    saveLedgerToSqlite(data);
    res.json({ success: true, message: "Persisted to SQLite database 2os_database.db successfully" });
  } catch (e) {
    console.error("Failed to write SQLite database:", e);
    res.status(500).json({ error: "Failed to persist data to SQLite database" });
  }
});

app.post("/api/ledger-data/clear", (req, res) => {
  try {
    saveLedgerToSqlite({
      companies: [],
      activeCompanyId: null,
      customers: [],
      contractors: [],
      sales: [],
      collections: [],
      expenses: [],
      payments: [],
      subsidiarySales: [],
      subsidiaryPurchases: [],
      cashReceipts: [],
      cashDisbursements: [],
      ppeAssets: [],
      accountTitles: INITIAL_ACCOUNT_TITLES,
      specialEntries: [],
      incomeTaxRecords: [],
      payrollRecords: [],
      employees: [],
      theme: "trial_layout"
    });
    res.json({ success: true, message: "All transactions and data cleared from database" });
  } catch (e) {
    console.error("Failed to clear SQLite database:", e);
    res.status(500).json({ error: "Failed to clear database" });
  }
});

app.post("/api/create-entity-directory", (req, res) => {
  try {
    const { company_name, branch_code, year } = req.body;
    if (!company_name || !String(company_name).trim()) {
      res.status(400).json({ error: "company_name is required" });
      return;
    }
    const paths = createEntityDirectoryTree(company_name, branch_code, year);
    res.json({
      success: true,
      message: `Entity directory for "${company_name}" created successfully`,
      createdPaths: paths
    });
  } catch (e: any) {
    console.error("Failed creating entity directory:", e);
    res.status(500).json({ error: e.message || "Failed to create entity directory" });
  }
});

app.get("/api/entity-directories", (req, res) => {
  try {
    const baseDir = path.join(process.cwd(), "entity directory");
    if (!fs.existsSync(baseDir)) {
      res.json({ entities: [] });
      return;
    }
    const entities = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const compPath = path.join(baseDir, dirent.name);
        const branches = fs.existsSync(compPath) 
          ? fs.readdirSync(compPath, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
          : [];
        return {
          company_name: dirent.name,
          branches
        };
      });
    res.json({ entities });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed reading entity directories" });
  }
});

async function start() {
  await initSqliteDatabase();

  // Ensure entity directories exist for all stored companies on startup
  try {
    const companies = queryTableRows("companies");
    for (const c of companies) {
      if (c.company_name) {
        createEntityDirectoryTree(c.company_name, c.tin_branch_code || "00000", c.created_at || c.birthday_or_incorporation_date);
      }
    }
  } catch (err) {
    console.error("Error creating initial entity directories:", err);
  }

  // Explicitly serve public assets for PWA, manifest, and icons
  app.use("/sw.js", (req, res, next) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path.join(process.cwd(), "public", "sw.js"));
  });
  app.use("/manifest.json", (req, res, next) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
  });
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with SQLite 2os_database.db engine`);
  });
}

start();

