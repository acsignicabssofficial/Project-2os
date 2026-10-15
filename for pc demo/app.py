#!/usr/bin/env python3
"""
2OS Accounting System - Desktop Engine & Local Database Server
100% Offline Desktop Application for Windows / PC Demo
Embedded SQLite database (2os_database.db) + Active SQL Sync (transactions.sql)
"""

import os
import sys
import json
import sqlite3
import socket
import threading
import subprocess
import webbrowser
import time
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler

# Base Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")
DB_PATH = os.path.join(BASE_DIR, "2os_database.db")
SQL_DUMP_PATH = os.path.join(BASE_DIR, "transactions.sql")
ENTITY_DIR = os.path.join(BASE_DIR, "entity directory")

# Ensure entity directory exists
os.makedirs(ENTITY_DIR, exist_ok=True)

# Standard Philippine Chart of Accounts
INITIAL_ACCOUNT_TITLES = [
    {"id": 1, "code": "1010", "title": "Cash and Cash Equivalents", "type": "Asset", "category": "Current Assets", "description": "Cash on hand and bank deposits"},
    {"id": 2, "code": "1020", "title": "Accounts Receivable", "type": "Asset", "category": "Current Assets", "description": "Trade receivables from clients"},
    {"id": 3, "code": "1030", "title": "Input VAT", "type": "Asset", "category": "Current Assets", "description": "12% Creditable Input VAT from purchases"},
    {"id": 4, "code": "1040", "title": "Creditable Withholding Tax (BIR 2307)", "type": "Asset", "category": "Current Assets", "description": "Prepaid income tax withheld by customers"},
    {"id": 5, "code": "1050", "title": "Prepaid Expenses", "type": "Asset", "category": "Current Assets", "description": "Advance payments for rent, insurance, etc."},
    {"id": 6, "code": "1510", "title": "Property, Plant & Equipment", "type": "Asset", "category": "Non-Current Assets", "description": "Office furniture, computers, vehicles, machineries"},
    {"id": 7, "code": "1520", "title": "Accumulated Depreciation", "type": "Asset", "category": "Non-Current Assets", "description": "Contra-asset for cumulative depreciation"},
    {"id": 8, "code": "2010", "title": "Accounts Payable", "type": "Liability", "category": "Current Liabilities", "description": "Trade payables to suppliers and service providers"},
    {"id": 9, "code": "2020", "title": "Output VAT Payable", "type": "Liability", "category": "Current Liabilities", "description": "12% Output VAT collected on sales"},
    {"id": 10, "code": "2030", "title": "Expanded Withholding Tax Payable (BIR 0619-E)", "type": "Liability", "category": "Current Liabilities", "description": "Withholding tax payable to BIR for vendors"},
    {"id": 11, "code": "2040", "title": "Income Tax Payable (BIR 1702/1701)", "type": "Liability", "category": "Current Liabilities", "description": "Income tax payable provision due to BIR"},
    {"id": 22, "code": "2035", "title": "Withholding Tax Payable - Compensation (BIR 1601-C)", "type": "Liability", "category": "Current Liabilities", "description": "Withholding tax deducted from employee payroll"},
    {"id": 23, "code": "2041", "title": "SSS Premium Payable", "type": "Liability", "category": "Current Liabilities", "description": "SSS contributions payable to Social Security System (EE & ER Share)"},
    {"id": 24, "code": "2042", "title": "PhilHealth Premium Payable", "type": "Liability", "category": "Current Liabilities", "description": "PhilHealth premiums payable to PHIC (EE & ER Share)"},
    {"id": 25, "code": "2043", "title": "Pag-IBIG Premium Payable", "type": "Liability", "category": "Current Liabilities", "description": "HDMF contributions payable to Pag-IBIG Fund (EE & ER Share)"},
    {"id": 26, "code": "2050", "title": "Other Employee Payables & Deductions", "type": "Liability", "category": "Current Liabilities", "description": "Other employee payroll deductions and advances"},
    {"id": 12, "code": "3010", "title": "Capital Stock / Owner's Equity", "type": "Equity", "category": "Equity", "description": "Contributed capital by stockholders or owner"},
    {"id": 13, "code": "3020", "title": "Retained Earnings", "type": "Equity", "category": "Equity", "description": "Cumulative net earnings retained in business"},
    {"id": 14, "code": "4010", "title": "Sales / Service Revenue", "type": "Revenue", "category": "Operating Revenue", "description": "Gross revenues from sales and services"},
    {"id": 15, "code": "4015", "title": "Sales Discounts", "type": "Revenue", "category": "Operating Revenue", "description": "Contra-revenue: trade/cash discounts granted to customers"},
    {"id": 16, "code": "4020", "title": "Other Operating Income", "type": "Revenue", "category": "Operating Revenue", "description": "Miscellaneous income and gains"},
    {"id": 17, "code": "6010", "title": "Salaries, Wages & Benefits", "type": "Expense", "category": "Operating Expenses", "description": "Employee gross compensation and allowances"},
    {"id": 27, "code": "6015", "title": "Employer SSS Contribution Expense", "type": "Expense", "category": "Operating Expenses", "description": "Employer share of SSS & EC contributions"},
    {"id": 28, "code": "6016", "title": "Employer PhilHealth Contribution Expense", "type": "Expense", "category": "Operating Expenses", "description": "Employer share of PhilHealth premiums"},
    {"id": 29, "code": "6017", "title": "Employer Pag-IBIG Contribution Expense", "type": "Expense", "category": "Operating Expenses", "description": "Employer share of Pag-IBIG HDMF contributions"},
    {"id": 18, "code": "6020", "title": "Rent Expense", "type": "Expense", "category": "Operating Expenses", "description": "Office and warehouse space rental"},
    {"id": 19, "code": "6030", "title": "Utilities Expense", "type": "Expense", "category": "Operating Expenses", "description": "Electricity, water, internet, telephone"},
    {"id": 20, "code": "6080", "title": "Depreciation Expense", "type": "Expense", "category": "Operating Expenses", "description": "Periodic depreciation of fixed assets"},
    {"id": 21, "code": "7010", "title": "Provision for Income Tax Expense", "type": "Expense", "category": "Tax Provision", "description": "Income tax expense provision"}
]

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".sql": "application/sql; charset=utf-8",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite schema matching 2OS specification."""
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
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
    """)

    # Seed Standard Chart of Accounts if empty
    c.execute("SELECT COUNT(*) FROM account_titles")
    if c.fetchone()[0] == 0:
        for a in INITIAL_ACCOUNT_TITLES:
            c.execute(
                "INSERT INTO account_titles VALUES (?, ?, ?, ?, ?, ?, ?)",
                (a["id"], a["code"], a["title"], a["category"], a["type"], a.get("description", ""), "2026-01-01T00:00:00.000Z")
            )

    conn.commit()
    conn.close()
    export_sql_dump()

def export_sql_dump():
    """Generates transactions.sql with schema and current records."""
    try:
        conn = get_db()
        c = conn.cursor()
        tables = [
            "companies", "customers", "contractors", "subsidiary_sales",
            "subsidiary_purchases", "cash_receipts", "cash_disbursements",
            "ppe_assets", "account_titles", "special_entries",
            "income_tax_records", "payroll_records", "employees"
        ]
        sql_lines = [
            "-- =============================================================================",
            "-- 2OS Accounting System - Relational SQL Transactions Dump",
            f"-- Auto-generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "-- Compatible with SQLite, PostgreSQL, and MySQL/MariaDB",
            "-- =============================================================================\n"
        ]

        for tbl in tables:
            c.execute(f"SELECT * FROM {tbl}")
            rows = c.fetchall()
            if rows:
                col_names = [description[0] for description in c.description]
                sql_lines.append(f"-- Table: {tbl} ({len(rows)} records)")
                for row in rows:
                    vals = []
                    for v in row:
                        if v is None:
                            vals.append("NULL")
                        elif isinstance(v, (int, float)):
                            vals.append(str(v))
                        else:
                            escaped = str(v).replace("'", "''")
                            vals.append(f"'{escaped}'")
                    sql_lines.append(f"INSERT INTO {tbl} ({', '.join(col_names)}) VALUES ({', '.join(vals)});")
                sql_lines.append("")

        with open(SQL_DUMP_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(sql_lines))
        conn.close()
    except Exception as e:
        print(f"[Warning] Failed writing transactions.sql: {e}", file=sys.stderr)

def create_entity_directory_tree(company_name, branch_code="00000", year="2026"):
    """Creates the standardized folder structure for registered companies."""
    if not company_name or not company_name.strip():
        return []
    safe_name = "".join(c if c.isalnum() or c in " ._-" else "_" for c in company_name.strip())
    yr = str(year)[:4] if year and len(str(year)) >= 4 else "2026"

    branches = ["main", "branch 1"]
    if branch_code and branch_code not in ("00000", "0", ""):
        branches = [f"branch {branch_code}", "main"]

    created = []
    base_dirs = [ENTITY_DIR, os.path.join(os.path.dirname(BASE_DIR), "entity directory")]
    for b_dir in base_dirs:
        if not os.path.exists(os.path.dirname(b_dir)):
            continue
        comp_dir = os.path.join(b_dir, safe_name)
        for br in branches:
            branch_dir = os.path.join(comp_dir, br)
            sub_dirs = [
                os.path.join(branch_dir, "main documents", "dti"),
                os.path.join(branch_dir, "main documents", "sec"),
                os.path.join(branch_dir, "main documents", "bir"),
                os.path.join(branch_dir, "main documents", "lgu"),
                os.path.join(branch_dir, "main documents", "other documents"),
                os.path.join(branch_dir, f"{yr} transactions", "sales"),
                os.path.join(branch_dir, f"{yr} transactions", "expenses"),
                os.path.join(branch_dir, f"{yr} transactions", "2307"),
                os.path.join(branch_dir, f"{yr} transactions", "2316"),
                os.path.join(branch_dir, f"{yr} transactions", "tax compliances", "attachments"),
                os.path.join(branch_dir, f"{yr} transactions", "tax compliances", "filings"),
            ]
            for s in sub_dirs:
                os.makedirs(s, exist_ok=True)
                keep_file = os.path.join(s, ".gitkeep")
                if not os.path.exists(keep_file):
                    try:
                        open(keep_file, "a").close()
                    except Exception:
                        pass
            created.append(branch_dir)
    return created

def query_rows(conn, table_name):
    c = conn.cursor()
    try:
        c.execute(f"SELECT * FROM {table_name}")
        return [dict(row) for row in c.fetchall()]
    except Exception:
        return []

def get_ledger_payload():
    """Builds complete JSON payload expected by 2OS React frontend."""
    conn = get_db()
    c = conn.cursor()

    # Check for full_ledger_json in app_settings
    c.execute("SELECT setting_value FROM app_settings WHERE setting_key = 'full_ledger_json'")
    row = c.fetchone()
    if row and row[0]:
        try:
            full = json.loads(row[0])
            if isinstance(full, dict):
                conn.close()
                return full
        except Exception:
            pass

    companies = [dict(r) for r in query_rows(conn, "companies")]
    for comp in companies:
        comp["rdo"] = comp.get("rdo_code", "")
        comp["company_address"] = comp.get("address", "")
        comp["registered_address"] = comp.get("address", "")
        comp["company_email"] = comp.get("email", "")
        comp["company_contact"] = comp.get("phone", "")
        comp["vat_or_non_vat"] = "VATABLE" if comp.get("is_vat_registered") else "NON-VAT"
        comp["entity_type"] = comp.get("tax_regime", "CORPORATION")
        comp["is_vat_registered"] = bool(comp.get("is_vat_registered"))

    customers = [dict(r) for r in query_rows(conn, "customers")]
    for cust in customers:
        cust["registered_name"] = cust.get("customer_name", "")
        cust["client_TIN"] = cust.get("customer_tin", "")
        cust["client_Address"] = cust.get("address", "")
        cust["customer_address"] = cust.get("address", "")

    contractors = [dict(r) for r in query_rows(conn, "contractors")]
    for cont in contractors:
        cont["registered_name"] = cont.get("contractor_name", "")
        cont["service_provider_name"] = cont.get("contractor_name", "")
        cont["service_provider_TIN"] = cont.get("contractor_tin", "")
        cont["sp_tin"] = cont.get("contractor_tin", "")
        cont["service_provider_Address"] = cont.get("address", "")
        cont["sp_address"] = cont.get("address", "")

    sales = query_rows(conn, "sales")
    collections = query_rows(conn, "collections")
    expenses = query_rows(conn, "expenses")
    payments = query_rows(conn, "payments")
    subsidiary_sales = query_rows(conn, "subsidiary_sales")
    subsidiary_purchases = query_rows(conn, "subsidiary_purchases")
    cash_receipts = query_rows(conn, "cash_receipts")
    cash_disbursements = query_rows(conn, "cash_disbursements")
    ppe_assets = query_rows(conn, "ppe_assets")
    account_titles = query_rows(conn, "account_titles") or INITIAL_ACCOUNT_TITLES

    special_entries_raw = query_rows(conn, "special_entries")
    special_entries = []
    for se in special_entries_raw:
        lines = []
        try:
            lines = json.loads(se.get("lines_json") or "[]")
        except Exception:
            lines = []
        se["lines"] = lines
        special_entries.append(se)

    income_tax_records = query_rows(conn, "income_tax_records")
    payroll_records = query_rows(conn, "payroll_records")
    employees = [dict(r) for r in query_rows(conn, "employees")]
    for emp in employees:
        emp["sss_no"] = emp.get("sss_number", "")
        emp["philhealth_no"] = emp.get("philhealth_number", "")
        emp["pagibig_no"] = emp.get("pagibig_number", "")
        emp["is_subject_to_contributions"] = bool(emp.get("is_subject_to_contributions"))
        emp["subject_to_contributions"] = bool(emp.get("is_subject_to_contributions"))

    c.execute("SELECT setting_value FROM app_settings WHERE setting_key = 'activeCompanyId'")
    act_row = c.fetchone()
    active_company_id = act_row[0] if act_row and act_row[0] else (companies[0]["id"] if companies else None)

    c.execute("SELECT setting_value FROM app_settings WHERE setting_key = 'theme'")
    theme_row = c.fetchone()
    theme = theme_row[0] if theme_row and theme_row[0] else "neon_light"

    conn.close()

    return {
        "companies": companies,
        "activeCompanyId": active_company_id,
        "customers": customers,
        "contractors": contractors,
        "subsidiarySales": subsidiary_sales,
        "subsidiaryPurchases": subsidiary_purchases,
        "cashReceipts": cash_receipts,
        "cashDisbursements": cash_disbursements,
        "collectionsRecords": cash_receipts,
        "paymentsRecords": cash_disbursements,
        "sales": subsidiary_sales if subsidiary_sales else sales,
        "collections": cash_receipts if cash_receipts else collections,
        "expenses": subsidiary_purchases if subsidiary_purchases else expenses,
        "payments": cash_disbursements if cash_disbursements else payments,
        "ppeAssets": ppe_assets,
        "accountTitles": account_titles,
        "specialEntries": special_entries,
        "incomeTaxRecords": income_tax_records,
        "payrollRecords": payroll_records,
        "employees": employees,
        "theme": theme
    }

def save_ledger_payload(data):
    """Persists frontend payload into SQLite tables."""
    conn = get_db()
    c = conn.cursor()
    c.execute("BEGIN TRANSACTION")

    # Clear tables
    tables = [
        "companies", "customers", "contractors", "sales", "collections",
        "expenses", "payments", "subsidiary_sales", "subsidiary_purchases",
        "cash_receipts", "cash_disbursements", "ppe_assets", "account_titles",
        "special_entries", "income_tax_records", "payroll_records", "employees", "app_settings"
    ]
    for tbl in tables:
        c.execute(f"DELETE FROM {tbl}")

    # 1. Companies
    for comp in data.get("companies", []):
        is_vat = 1 if comp.get("is_vat_registered") or comp.get("vat_or_non_vat") == "VATABLE" else 0
        c.execute(
            "INSERT INTO companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                comp.get("id"),
                comp.get("company_name") or comp.get("trade_name") or "",
                comp.get("company_tin") or "",
                comp.get("rdo_code") or comp.get("rdo") or "",
                comp.get("line_of_business") or "",
                comp.get("address") or comp.get("company_address") or "",
                comp.get("zip_code") or "",
                comp.get("email") or comp.get("company_email") or "",
                comp.get("phone") or comp.get("company_contact") or "",
                is_vat,
                comp.get("tax_regime") or comp.get("entity_type") or "CORPORATION",
                comp.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        try:
            create_entity_directory_tree(comp.get("company_name"), comp.get("tin_branch_code", "00000"), comp.get("created_at", "2026"))
        except Exception:
            pass

    # 2. Customers
    for cust in data.get("customers", []):
        c.execute(
            "INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                cust.get("id"),
                cust.get("company_name") or "",
                cust.get("customer_name") or cust.get("registered_name") or "",
                cust.get("customer_tin") or cust.get("client_TIN") or "",
                cust.get("address") or cust.get("client_Address") or "",
                cust.get("contact_person") or "",
                cust.get("email") or "",
                cust.get("phone") or cust.get("contact_number") or "",
                cust.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 3. Contractors
    for cont in data.get("contractors", []):
        c.execute(
            "INSERT INTO contractors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                cont.get("id"),
                cont.get("company_name") or "",
                cont.get("contractor_name") or cont.get("registered_name") or cont.get("service_provider_name") or "",
                cont.get("contractor_tin") or cont.get("service_provider_TIN") or cont.get("sp_tin") or "",
                cont.get("address") or cont.get("service_provider_Address") or "",
                cont.get("service_type") or "",
                cont.get("atc_code") or "",
                cont.get("email") or "",
                cont.get("phone") or "",
                cont.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 4. Subsidiary Sales
    for s in data.get("subsidiarySales", []):
        c.execute(
            "INSERT INTO subsidiary_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                s.get("id"), s.get("company_name"), s.get("registered_name"), s.get("vat_or_nonvat"),
                s.get("tin"), s.get("address"), s.get("type_of_transaction"), s.get("date"),
                s.get("invoice_type"), s.get("voucher_number"), s.get("invoice_number"),
                s.get("particulars"), float(s.get("qty", 1)), float(s.get("unit_price", 0)),
                float(s.get("amount", 0)), float(s.get("vatable_amount", 0)), float(s.get("vat_amount", 0)),
                float(s.get("zero_rated_amount", 0)), float(s.get("vat_exempt_amount", 0)),
                float(s.get("total_amount_vat_inclusive", 0)), float(s.get("total_amount_net_of_vat", 0)),
                float(s.get("discount", 0)), float(s.get("tax_withheld", 0)), float(s.get("total_amount_due", 0)),
                1 if s.get("is_cancelled") else 0, s.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 5. Subsidiary Purchases
    for p in data.get("subsidiaryPurchases", []):
        c.execute(
            "INSERT INTO subsidiary_purchases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                p.get("id"), p.get("company_name"), p.get("registered_name"), p.get("vat_or_nonvat"),
                p.get("tin"), p.get("address"), p.get("type_of_transaction"), p.get("date"),
                p.get("invoice_type"), p.get("voucher_number"), p.get("invoice_number"),
                p.get("particulars"), float(p.get("qty", 1)), float(p.get("unit_price", 0)),
                float(p.get("amount", 0)), float(p.get("vatable_amount", 0)), float(p.get("vat_amount", 0)),
                float(p.get("zero_rated_amount", 0)), float(p.get("vat_exempt_amount", 0)),
                float(p.get("total_amount_vat_inclusive", 0)), float(p.get("total_amount_net_of_vat", 0)),
                float(p.get("discount", 0)), float(p.get("tax_withheld", 0)), float(p.get("total_amount_due", 0)),
                1 if p.get("is_cancelled") else 0, p.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 6. Cash Receipts
    for r in data.get("cashReceipts", []):
        c.execute(
            "INSERT INTO cash_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                r.get("id"), r.get("company_name"), r.get("registered_name"), r.get("vat_or_nonvat"),
                r.get("tin"), r.get("address"), r.get("type_of_transaction"), r.get("date"),
                r.get("invoice_type"), r.get("voucher_number"), r.get("invoice_number"),
                r.get("particulars"), float(r.get("qty", 1)), float(r.get("unit_price", 0)),
                float(r.get("amount", 0)), float(r.get("vatable_amount", 0)), float(r.get("vat_amount", 0)),
                float(r.get("zero_rated_amount", 0)), float(r.get("vat_exempt_amount", 0)),
                float(r.get("total_amount_vat_inclusive", 0)), float(r.get("total_amount_net_of_vat", 0)),
                float(r.get("discount", 0)), float(r.get("tax_withheld", 0)), float(r.get("total_amount_due", 0)),
                1 if r.get("is_cancelled") else 0, r.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 7. Cash Disbursements
    for d in data.get("cashDisbursements", []):
        c.execute(
            "INSERT INTO cash_disbursements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                d.get("id"), d.get("company_name"), d.get("registered_name"), d.get("vat_or_nonvat"),
                d.get("tin"), d.get("address"), d.get("type_of_transaction"), d.get("date"),
                d.get("invoice_type"), d.get("voucher_number"), d.get("invoice_number"),
                d.get("particulars"), float(d.get("qty", 1)), float(d.get("unit_price", 0)),
                float(d.get("amount", 0)), float(d.get("vatable_amount", 0)), float(d.get("vat_amount", 0)),
                float(d.get("zero_rated_amount", 0)), float(d.get("vat_exempt_amount", 0)),
                float(d.get("total_amount_vat_inclusive", 0)), float(d.get("total_amount_net_of_vat", 0)),
                float(d.get("discount", 0)), float(d.get("tax_withheld", 0)), float(d.get("total_amount_due", 0)),
                1 if d.get("is_cancelled") else 0, d.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 8. PPE Assets
    for a in data.get("ppeAssets", []):
        c.execute(
            "INSERT INTO ppe_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                a.get("id"), a.get("company_name"), a.get("asset_code"), a.get("asset_name"),
                a.get("category"), a.get("acquisition_date"), float(a.get("acquisition_cost", 0)),
                float(a.get("salvage_value", 0)), float(a.get("useful_life_years", 5)),
                a.get("depreciation_method", "Straight Line"), float(a.get("accumulated_depreciation", 0)),
                float(a.get("net_book_value", 0)), a.get("status", "Active"),
                a.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 9. Account Titles
    for act in data.get("accountTitles", INITIAL_ACCOUNT_TITLES):
        c.execute(
            "INSERT INTO account_titles VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                act.get("id"), act.get("code"), act.get("title"), act.get("category"),
                act.get("type"), act.get("description", ""), act.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 10. Special Entries
    for se in data.get("specialEntries", []):
        lines_json = json.dumps(se.get("lines") or [])
        c.execute(
            "INSERT INTO special_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                se.get("id"), se.get("company_name"), se.get("entry_number"), se.get("voucher_no"),
                se.get("entry_date"), se.get("entry_type"), se.get("description"), lines_json,
                se.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 11. Income Tax Records
    for it in data.get("incomeTaxRecords", []):
        c.execute(
            "INSERT INTO income_tax_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                it.get("id"), it.get("company_name"), it.get("taxable_year"), it.get("quarter_period"),
                it.get("entity_type"), it.get("tax_regime"), it.get("deduction_method"),
                float(it.get("gross_sales", 0)), float(it.get("cost_of_sales", 0)),
                float(it.get("itemized_expenses", 0)), float(it.get("allowable_deductions", 0)),
                float(it.get("taxable_income", 0)), float(it.get("computed_tax_due", 0)),
                float(it.get("creditable_tax_2307", 0)), float(it.get("quarterly_tax_payments", 0)),
                float(it.get("net_tax_payable", 0)), it.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 12. Payroll Records
    for pr in data.get("payrollRecords", []):
        c.execute(
            "INSERT INTO payroll_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                pr.get("id"), pr.get("company_name"), pr.get("employee_id"), pr.get("employee_name"),
                pr.get("payroll_period"), float(pr.get("basic_pay", 0)), float(pr.get("overtime_pay", 0)),
                float(pr.get("allowances", 0)), float(pr.get("gross_pay", 0)), float(pr.get("sss_deduction", 0)),
                float(pr.get("philhealth_deduction", 0)), float(pr.get("pagibig_deduction", 0)),
                float(pr.get("withholding_tax", 0)), float(pr.get("other_deductions", 0)),
                float(pr.get("net_pay", 0)), pr.get("status", "Approved"),
                pr.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 13. Employees
    for emp in data.get("employees", []):
        is_sub = 1 if emp.get("is_subject_to_contributions", True) else 0
        c.execute(
            "INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                emp.get("id"), emp.get("company_name"), str(emp.get("employee_id") or ""),
                emp.get("full_name") or f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip(),
                emp.get("tin") or "", emp.get("sss_number") or emp.get("sss_no") or "",
                emp.get("philhealth_number") or emp.get("philhealth_no") or "",
                emp.get("pagibig_number") or emp.get("pagibig_no") or "",
                emp.get("position") or "", emp.get("department") or "",
                float(emp.get("monthly_rate", 0)), float(emp.get("daily_rate", 0)),
                emp.get("tax_status", "S"), is_sub,
                emp.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    # 14. App Settings
    c.execute("INSERT INTO app_settings VALUES (?, ?)", ("activeCompanyId", str(data.get("activeCompanyId") or "")))
    c.execute("INSERT INTO app_settings VALUES (?, ?)", ("theme", str(data.get("theme") or "neon_light")))

    conn.commit()
    conn.close()

    export_sql_dump()

class AccountingRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silent logger for clean console
        pass

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/ledger-data":
            try:
                data = get_ledger_payload()
                resp = json.dumps(data).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_error(500, f"Error: {e}")
            return

        if path == "/api/export-sql":
            try:
                export_sql_dump()
                if os.path.exists(SQL_DUMP_PATH):
                    with open(SQL_DUMP_PATH, "rb") as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/sql; charset=utf-8")
                    self.send_header("Content-Disposition", 'attachment; filename="transactions.sql"')
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(content)
                    return
                else:
                    self.send_error(404, "SQL dump not generated")
                    return
            except Exception as e:
                self.send_error(500, f"Error exporting SQL: {e}")
                return

        if path == "/api/entity-directories":
            try:
                entities = []
                if os.path.exists(ENTITY_DIR):
                    for name in os.listdir(ENTITY_DIR):
                        p = os.path.join(ENTITY_DIR, name)
                        if os.path.isdir(p):
                            branches = [b for b in os.listdir(p) if os.path.isdir(os.path.join(p, b))]
                            entities.append({"company_name": name, "branches": branches})
                resp = json.dumps({"entities": entities}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_error(500, str(e))
            return

        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"status":"ok","mode":"offline_desktop"}')
            return

        # Static File Serving from WEB_DIR
        rel_path = path.lstrip("/")
        if not rel_path:
            rel_path = "index.html"
        target_path = os.path.join(WEB_DIR, rel_path)

        # SPA Routing: Fall back to index.html if file doesn't exist
        if not os.path.exists(target_path) or os.path.isdir(target_path):
            target_path = os.path.join(WEB_DIR, "index.html")

        if os.path.exists(target_path) and os.path.isfile(target_path):
            ext = os.path.splitext(target_path)[1].lower()
            content_type = MIME_TYPES.get(ext, "application/octet-stream")
            try:
                with open(target_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(content)))
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_error(500, f"Error reading file: {e}")
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        if path == "/api/ledger-data":
            try:
                payload = json.loads(body.decode("utf-8"))
                save_ledger_payload(payload)
                resp = json.dumps({"success": True, "message": "Saved to 2os_database.db and transactions.sql"}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_error(500, f"Error saving ledger: {e}")
            return

        if path == "/api/ledger-data/clear":
            try:
                save_ledger_payload({
                    "companies": [],
                    "activeCompanyId": None,
                    "customers": [],
                    "contractors": [],
                    "sales": [],
                    "collections": [],
                    "expenses": [],
                    "payments": [],
                    "subsidiarySales": [],
                    "subsidiaryPurchases": [],
                    "cashReceipts": [],
                    "cashDisbursements": [],
                    "ppeAssets": [],
                    "accountTitles": INITIAL_ACCOUNT_TITLES,
                    "specialEntries": [],
                    "incomeTaxRecords": [],
                    "payrollRecords": [],
                    "employees": [],
                    "theme": "neon_light"
                })
                resp = json.dumps({"success": True, "message": "Database cleared successfully"}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_error(500, f"Error clearing ledger: {e}")
            return

        if path == "/api/create-entity-directory":
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
                c_name = payload.get("company_name", "")
                b_code = payload.get("branch_code", "00000")
                yr = payload.get("year", "2026")
                paths = create_entity_directory_tree(c_name, b_code, yr)
                resp = json.dumps({"success": True, "createdPaths": paths}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_error(500, str(e))
            return

        self.send_error(404, "Unknown endpoint")

def find_available_port(start_port=8080):
    for p in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return 8080

def find_standalone_browser():
    """Finds installed modern browser capable of standalone --app window mode on Windows."""
    candidates = [
        # Microsoft Edge (Installed on every Windows 10/11)
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        # Google Chrome
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        # Brave Browser
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def launch_desktop_window(url):
    """
    Launches the application in its own native window without browser bars:
    1. pywebview if installed (True native WebView2)
    2. Microsoft Edge / Chrome in --app mode (Built-in to Windows, 100% offline, zero pip packages)
    3. Default system browser fallback
    """
    # 1. Try pywebview
    try:
        import webview
        webview.create_window(
            title="2OS Accounting System - Desktop",
            url=url,
            width=1400,
            height=900,
            resizable=True
        )
        webview.start()
        return
    except ImportError:
        pass
    except Exception as e:
        print(f"[Notice] PyWebView failed: {e}. Falling back to App Mode.")

    # 2. Try Windows App Mode (Edge/Chrome)
    browser_exe = find_standalone_browser()
    if browser_exe:
        try:
            cmd = [browser_exe, f"--app={url}", "--window-size=1400,900"]
            proc = subprocess.Popen(cmd)
            proc.wait()
            return
        except Exception as e:
            print(f"[Notice] Browser app mode failed: {e}")

    # 3. Fallback: System browser
    try:
        webbrowser.open(url)
    except Exception:
        pass

    # Keep server running until user terminates
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

def main():
    print("=================================================================")
    print("       2OS PHILIPPINE ACCOUNTING SYSTEM - DESKTOP ENGINE         ")
    print("=================================================================")
    print(" [✓] Initializing SQLite database (2os_database.db)...")
    init_db()

    port = find_available_port(8080)
    url = f"http://127.0.0.1:{port}"
    server = HTTPServer(("127.0.0.1", port), AccountingRequestHandler)

    print(f" [✓] Offline Local Server running at {url}")
    print(" [✓] Launching Desktop Application Window...")

    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    # Small delay to ensure server socket is listening
    time.sleep(0.3)

    try:
        launch_desktop_window(url)
    finally:
        print("\n [✓] Closing 2OS Desktop Engine...")
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
