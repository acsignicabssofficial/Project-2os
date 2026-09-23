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
const DB_SQLITE_FILE = path.join(process.cwd(), "ledger.db");
const DB_JSON_BACKUP = path.join(process.cwd(), "ledger_db.json");

app.use(express.json({ limit: "50mb" }));

let db: Database;

async function initSqliteDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_SQLITE_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_SQLITE_FILE);
      db = new SQL.Database(fileBuffer);
      console.log("Loaded existing SQLite database file: ledger.db");
    } catch (e) {
      console.error("Failed to load existing ledger.db, creating new database instance:", e);
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

  // Check if companies table has data. If not, seed initial data.
  const compRes = db.exec("SELECT COUNT(*) as cnt FROM companies");
  const count = compRes[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    console.log("Seeding initial dataset into SQLite database...");
    const seedData = {
      companies: INITIAL_COMPANIES,
      activeCompanyId: INITIAL_COMPANIES[0]?.id || null,
      customers: INITIAL_CUSTOMERS,
      contractors: INITIAL_CONTRACTORS,
      sales: INITIAL_SALES,
      collections: INITIAL_COLLECTIONS,
      expenses: INITIAL_EXPENSES,
      payments: INITIAL_PAYMENTS,
      ppeAssets: INITIAL_PPE,
      accountTitles: INITIAL_ACCOUNT_TITLES,
      specialEntries: INITIAL_SPECIAL_ENTRIES,
      incomeTaxRecords: INITIAL_INCOME_TAX_RECORDS,
      payrollRecords: [],
      employees: [],
      theme: "neon_light"
    };
    saveLedgerToSqlite(seedData);
  } else {
    persistSqliteBuffer();
  }
}

function persistSqliteBuffer() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_SQLITE_FILE, buffer);
    } catch (e) {
      console.error("Error writing ledger.db to disk:", e);
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

  const activeCompSetting = queryTableRows("app_settings").find(s => s.setting_key === "activeCompanyId");
  const themeSetting = queryTableRows("app_settings").find(s => s.setting_key === "theme");

  const activeCompanyId = activeCompSetting ? Number(activeCompSetting.setting_value) : (companies[0]?.id || null);
  const theme = themeSetting ? themeSetting.setting_value : "neon_light";

  return {
    companies,
    activeCompanyId,
    customers,
    contractors,
    sales,
    collections,
    expenses,
    payments,
    ppeAssets,
    accountTitles,
    specialEntries,
    incomeTaxRecords,
    payrollRecords,
    employees,
    theme
  };
}

function saveLedgerToSqlite(data: any) {
  db.run("BEGIN TRANSACTION;");

  // Clear existing rows
  [
    "companies", "customers", "contractors", "sales", "collections",
    "expenses", "payments", "ppe_assets", "account_titles", "special_entries",
    "income_tax_records", "payroll_records", "employees", "app_settings"
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

  // 4. Sales
  if (Array.isArray(data.sales)) {
    const stmt = db.prepare(`INSERT INTO sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.sales.forEach((s: any) => {
      stmt.run([
        s.id, s.company_name, s.invoice_number, s.invoice_date, s.customer_name,
        s.customer_tin, s.invoice_amount, s.withholding_2307, s.vat_exempt_amount || 0,
        s.discounts || 0, s.down_payment || 0, s.output_vat, s.sales_status, s.description || "",
        s.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 5. Collections
  if (Array.isArray(data.collections)) {
    const stmt = db.prepare(`INSERT INTO collections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.collections.forEach((c: any) => {
      stmt.run([
        c.id, c.company_name, c.invoice_number, c.collection_date, c.customer_name,
        c.amount_collected, c.amount_withheld_2307, c.payment_method, c.OR_PR_number,
        c.entry_number || "", c.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 6. Expenses
  if (Array.isArray(data.expenses)) {
    const stmt = db.prepare(`INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.expenses.forEach((e: any) => {
      stmt.run([
        e.id, e.company_name, e.voucher_number, e.expense_date, e.service_provider_name,
        e.service_provider_tin, e.expense_type, e.expense_invoice_amount, e.vat_input_amount,
        e.withholding_2307_2306, e.discounts || 0, e.nonvat_or_vat, e.expense_status,
        e.description || "", e.created_at || new Date().toISOString()
      ]);
    });
    stmt.free();
  }

  // 7. Payments
  if (Array.isArray(data.payments)) {
    const stmt = db.prepare(`INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    data.payments.forEach((p: any) => {
      stmt.run([
        p.id, p.company_name, p.voucher_number, p.payment_date, p.service_provider_name,
        p.amount_paid, p.withholding_tax_2307, p.payment_method, p.check_voucher_number,
        p.entry_number || "", p.created_at || new Date().toISOString()
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
    res.json({ success: true, message: "Persisted to SQLite database ledger.db successfully" });
  } catch (e) {
    console.error("Failed to write SQLite database:", e);
    res.status(500).json({ error: "Failed to persist data to SQLite database" });
  }
});

async function start() {
  await initSqliteDatabase();

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
    console.log(`Server running on http://localhost:${PORT} with SQLite ledger.db engine`);
  });
}

start();

