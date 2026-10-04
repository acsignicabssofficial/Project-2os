#!/usr/bin/env python3
"""
=============================================================================
2OS ACCOUNTING SYSTEM - PC DEMO APPLICATION & SQL DATABASE MANAGER
=============================================================================
This Python application:
1. Runs a local HTTP server and transaction management engine.
2. Creates and manages an active SQLite database ('2os_database.db').
3. Generates and automatically synchronizes 'transactions.sql', containing
   the complete SQL schema (DDL) and all transaction records (DML).
4. Opens the 2OS Accounting System in its own dedicated, native desktop window.
=============================================================================
"""

import os
import sys
import json
import sqlite3
import shutil
import socket
import threading
import time
import subprocess
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_FILE = os.path.join(SCRIPT_DIR, "transactions.sql")
DB_FILE = os.path.join(SCRIPT_DIR, "2os_database.db")
WEB_DIR = os.path.join(SCRIPT_DIR, "web")
PARENT_DIR = os.path.dirname(SCRIPT_DIR)
PARENT_DIST = os.path.join(PARENT_DIR, "dist")

# ANSI terminal colors (if supported)
GREEN = "\033[92m" if sys.platform != "win32" else ""
CYAN = "\033[96m" if sys.platform != "win32" else ""
YELLOW = "\033[93m" if sys.platform != "win32" else ""
BOLD = "\033[1m" if sys.platform != "win32" else ""
RESET = "\033[0m" if sys.platform != "win32" else ""


# =============================================================================
# DATABASE & SQL FILE SYNCHRONIZATION
# =============================================================================

def get_db_connection():
    """Connect to SQLite database."""
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize SQLite database from transactions.sql or default seed."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if companies table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='companies'")
    table_exists = cursor.fetchone()

    if not table_exists:
        if os.path.exists(SQL_FILE):
            print(f"[DATABASE] Initializing database from {os.path.basename(SQL_FILE)}...")
            try:
                with open(SQL_FILE, "r", encoding="utf-8") as f:
                    sql_script = f.read()
                cursor.executescript(sql_script)
                conn.commit()
                print(f"[DATABASE] Database successfully loaded from {os.path.basename(SQL_FILE)}.")
            except Exception as e:
                print(f"[DATABASE ERROR] Failed executing SQL file: {e}")
                create_default_schema(conn)
        else:
            print("[DATABASE] No existing SQL file found. Creating default schema and seed data...")
            create_default_schema(conn)
            export_database_to_sql()
    else:
        # Tables exist, make sure SQL file is up to date
        if not os.path.exists(SQL_FILE):
            export_database_to_sql()

    conn.close()


def create_default_schema(conn):
    """Creates the tables and inserts default initial Philippine accounting data."""
    cursor = conn.cursor()
    cursor.executescript("""
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
          is_cancelled INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
          is_cancelled INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
          is_cancelled INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
          is_cancelled INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS account_titles (
          id INTEGER PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS app_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT
        );
    """)

    # Seed Company
    cursor.execute("""
        INSERT OR IGNORE INTO companies (id, company_name, company_tin, rdo_code, line_of_business, address, zip_code, email, phone, is_vat_registered, tax_regime)
        VALUES (1, 'Active Workspace Demo Corp.', '009-876-543-00000', '044 - Taguig / Pateros', 'Software Development & IT Consultancy', 'Unit 1204, High Street Corporate Tower, BGC, Taguig City, Metro Manila', '1634', 'accounting@activeworkspace.ph', '+63 2 8888 1234', 1, 'Regular Corporate Income Tax (25% RCIT)')
    """)

    # Seed Customers
    cursor.execute("""
        INSERT OR IGNORE INTO customers (id, company_name, customer_name, customer_tin, address, contact_person, email, phone) VALUES
        (1, 'Active Workspace Demo Corp.', 'Ayala Tech Holdings Inc.', '102-345-678-00000', 'Tower One, Ayala Avenue, Makati City', 'Mark Villar', 'mvillar@ayalatech.ph', '0917-111-2222'),
        (2, 'Active Workspace Demo Corp.', 'BDO Prime Commerce Corp.', '204-567-890-00000', 'Ortigas Center, Pasig City', 'Grace Tan', 'gtan@bdoprime.ph', '0918-333-4444')
    """)

    # Seed Contractors
    cursor.execute("""
        INSERT OR IGNORE INTO contractors (id, company_name, contractor_name, contractor_tin, address, service_type, atc_code, email, phone) VALUES
        (1, 'Active Workspace Demo Corp.', 'Converge ICT Solutions Inc.', '004-987-123-00000', 'Pasig City, Metro Manila', 'Internet & Telecommunications', 'WI160', 'support@convergeict.com', '02-8667-0888'),
        (2, 'Active Workspace Demo Corp.', 'SM Prime Commercial Leasing', '000-456-789-00000', 'Mall of Asia Complex, Pasay City', 'Office Rental & Utilities', 'WI100', 'leasing@smprime.com', '02-8831-1000')
    """)

    # Seed Sales
    cursor.execute("""
        INSERT OR IGNORE INTO sales (id, company_name, invoice_number, invoice_date, customer_name, customer_tin, invoice_amount, withholding_2307, vat_exempt_amount, discounts, down_payment, output_vat, sales_status, description) VALUES
        (1, 'Active Workspace Demo Corp.', 'SI-2026-001', '2026-01-15', 'Ayala Tech Holdings Inc.', '102-345-678-00000', 168000.00, 3000.00, 0, 0, 0, 18000.00, 'Fully Paid', 'Enterprise Accounting Software Implementation - Phase 1'),
        (2, 'Active Workspace Demo Corp.', 'SI-2026-002', '2026-01-28', 'BDO Prime Commerce Corp.', '204-567-890-00000', 280000.00, 5000.00, 0, 0, 0, 30000.00, 'Partially Paid', 'Custom Fintech API Integration & Cloud Setup')
    """)

    # Seed Collections
    cursor.execute("""
        INSERT OR IGNORE INTO collections (id, company_name, invoice_number, collection_date, customer_name, amount_collected, amount_withheld_2307, payment_method, OR_PR_number, entry_number) VALUES
        (1, 'Active Workspace Demo Corp.', 'SI-2026-001', '2026-01-25', 'Ayala Tech Holdings Inc.', 165000.00, 3000.00, 'Bank Transfer (BDO)', 'OR-2026-101', 'CRJ-001'),
        (2, 'Active Workspace Demo Corp.', 'SI-2026-002', '2026-02-05', 'BDO Prime Commerce Corp.', 140000.00, 2500.00, 'Check (Metrobank)', 'OR-2026-102', 'CRJ-002')
    """)

    # Seed Expenses
    cursor.execute("""
        INSERT OR IGNORE INTO expenses (id, company_name, voucher_number, expense_date, service_provider_name, service_provider_tin, expense_type, expense_invoice_amount, vat_input_amount, withholding_2307_2306, discounts, nonvat_or_vat, expense_status, description) VALUES
        (1, 'Active Workspace Demo Corp.', 'APV-2026-001', '2026-01-05', 'SM Prime Commercial Leasing', '000-456-789-00000', 'Rent Expense', 56000.00, 6000.00, 2500.00, 0, 'VAT', 'Fully Paid', 'Office Space Rental - January 2026'),
        (2, 'Active Workspace Demo Corp.', 'APV-2026-002', '2026-01-12', 'Converge ICT Solutions Inc.', '004-987-123-00000', 'Utilities Expense', 11200.00, 1200.00, 200.00, 0, 'VAT', 'Fully Paid', 'Dedicated Fiber Leased Line 1Gbps')
    """)

    # Seed Payments
    cursor.execute("""
        INSERT OR IGNORE INTO payments (id, company_name, voucher_number, payment_date, service_provider_name, amount_paid, withholding_tax_2307, payment_method, check_voucher_number, entry_number) VALUES
        (1, 'Active Workspace Demo Corp.', 'APV-2026-001', '2026-01-10', 'SM Prime Commercial Leasing', 53500.00, 2500.00, 'Check', 'CV-2026-051', 'CDJ-001'),
        (2, 'Active Workspace Demo Corp.', 'APV-2026-002', '2026-01-18', 'Converge ICT Solutions Inc.', 11000.00, 200.00, 'Online Banking (BDO)', 'CV-2026-052', 'CDJ-002')
    """)

    # Seed Chart of Accounts
    accounts = [
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
        (20, '7010', 'Provision for Income Tax Expense', 'Tax Provision', 'Expense', 'Income tax expense provision')
    ]
    cursor.executemany("INSERT OR IGNORE INTO account_titles VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", accounts)

    # Seed Employees & Payroll
    cursor.execute("""
        INSERT OR IGNORE INTO employees (id, company_name, employee_id, full_name, tin, sss_number, philhealth_number, pagibig_number, position, department, monthly_rate, daily_rate, tax_status, is_subject_to_contributions) VALUES
        (1, 'Active Workspace Demo Corp.', 'EMP-001', 'Juan Dela Cruz', '123-456-789-00000', '34-1234567-8', '12-345678901-2', '1212-3434-5656', 'Lead Fullstack Architect', 'Engineering', 45000.00, 1800.00, 'Single', 1),
        (2, 'Active Workspace Demo Corp.', 'EMP-002', 'Maria Clara Santos', '987-654-321-00000', '34-9876543-1', '98-765432109-8', '9898-7676-5454', 'Senior CPA & Financial Officer', 'Finance', 38000.00, 1520.00, 'Married', 1)
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO payroll_records (id, company_name, employee_id, employee_name, payroll_period, basic_pay, overtime_pay, allowances, gross_pay, sss_deduction, philhealth_deduction, pagibig_deduction, withholding_tax, other_deductions, net_pay, status) VALUES
        (1, 'Active Workspace Demo Corp.', 'EMP-001', 'Juan Dela Cruz', '2026-01', 45000.00, 3500.00, 2000.00, 50500.00, 1350.00, 1125.00, 200.00, 4825.00, 0, 43000.00, 'Processed'),
        (2, 'Active Workspace Demo Corp.', 'EMP-002', 'Maria Clara Santos', '2026-01', 38000.00, 0, 1500.00, 39500.00, 1350.00, 950.00, 200.00, 2750.00, 0, 34250.00, 'Processed')
    """)

    cursor.execute("""
        INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES
        ('activeCompanyId', '1'),
        ('theme', 'neon_light')
    """)

    conn.commit()


def export_database_to_sql():
    """
    Exports the current state of all SQLite tables and transaction records
    directly to 'transactions.sql' file with standard SQL formatting.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        tables = [
            "companies", "customers", "contractors", "sales", "collections",
            "expenses", "payments", "subsidiary_sales", "subsidiary_purchases",
            "cash_receipts", "cash_disbursements", "ppe_assets", "account_titles",
            "special_entries", "income_tax_records", "payroll_records", "employees", "app_settings"
        ]

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        lines = [
            "-- =============================================================================",
            "-- 2OS ACCOUNTING SYSTEM - DATABASE OF ALL TRANSACTIONS",
            f"-- Synchronized at: {now_str}",
            "-- Engine: SQLite / MySQL / PostgreSQL Compatible DDL & DML",
            "-- Target File: transactions.sql",
            "-- =============================================================================",
            "",
            "PRAGMA foreign_keys = ON;",
            ""
        ]

        total_transactions = 0

        for table in tables:
            cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'")
            table_sql = cursor.fetchone()
            if not table_sql:
                continue

            lines.append(f"-- -----------------------------------------------------------------------------")
            lines.append(f"-- TABLE: {table.upper()}")
            lines.append(f"-- -----------------------------------------------------------------------------")
            lines.append(table_sql[0] + ";")
            lines.append("")

            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            col_names = [description[0] for description in cursor.description]

            if table in ["sales", "collections", "expenses", "payments", "special_entries", "payroll_records"]:
                total_transactions += len(rows)

            if rows:
                cols_str = ", ".join(col_names)
                lines.append(f"-- Records for {table} ({len(rows)} rows):")
                for row in rows:
                    vals = []
                    for val in row:
                        if val is None:
                            vals.append("NULL")
                        elif isinstance(val, (int, float)):
                            vals.append(str(val))
                        else:
                            # Escape single quotes
                            escaped = str(val).replace("'", "''")
                            vals.append(f"'{escaped}'")
                    lines.append(f"INSERT OR REPLACE INTO {table} ({cols_str}) VALUES ({', '.join(vals)});")
                lines.append("")

        lines.append("-- =============================================================================")
        lines.append(f"-- SUMMARY: {total_transactions} active accounting transactions in database.")
        lines.append("-- END OF FILE")
        lines.append("-- =============================================================================")

        with open(SQL_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        conn.close()
        print(f"[SQL SYNC] Successfully updated {os.path.basename(SQL_FILE)} ({total_transactions} transactions logged).")
        return True
    except Exception as e:
        print(f"[SQL SYNC ERROR] Failed exporting to SQL file: {e}")
        return False


def get_ledger_data_json():
    """Fetches all records from SQLite and formats them for the React App."""
    conn = get_db_connection()
    cursor = conn.cursor()

    def fetch_all(table):
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

    companies = fetch_all("companies")
    for c in companies:
        c["is_vat_registered"] = bool(c.get("is_vat_registered"))

    customers = fetch_all("customers")
    contractors = fetch_all("contractors")
    sales = fetch_all("sales")
    collections = fetch_all("collections")
    expenses = fetch_all("expenses")
    payments = fetch_all("payments")
    subsidiarySales = fetch_all("subsidiary_sales")
    subsidiaryPurchases = fetch_all("subsidiary_purchases")
    cashReceipts = fetch_all("cash_receipts")
    cashDisbursements = fetch_all("cash_disbursements")
    ppeAssets = fetch_all("ppe_assets")
    accountTitles = fetch_all("account_titles")
    
    specialEntries = fetch_all("special_entries")
    for s in specialEntries:
        try:
            s["lines"] = json.loads(s.get("lines_json") or "[]")
        except Exception:
            s["lines"] = []

    incomeTaxRecords = fetch_all("income_tax_records")
    payrollRecords = fetch_all("payroll_records")
    employees = fetch_all("employees")
    for e in employees:
        e["is_subject_to_contributions"] = bool(e.get("is_subject_to_contributions"))

    appSettings = fetch_all("app_settings")
    active_comp = next((s["setting_value"] for s in appSettings if s["setting_key"] == "activeCompanyId"), None)
    theme = next((s["setting_value"] for s in appSettings if s["setting_key"] == "theme"), "neon_light")

    activeCompanyId = int(active_comp) if active_comp and active_comp.isdigit() else (companies[0]["id"] if companies else None)

    conn.close()

    return {
        "companies": companies,
        "activeCompanyId": activeCompanyId,
        "customers": customers,
        "contractors": contractors,
        "subsidiarySales": subsidiarySales if subsidiarySales else sales,
        "subsidiaryPurchases": subsidiaryPurchases if subsidiaryPurchases else expenses,
        "cashReceipts": cashReceipts if cashReceipts else collections,
        "cashDisbursements": cashDisbursements if cashDisbursements else payments,
        "sales": subsidiarySales if subsidiarySales else sales,
        "collections": cashReceipts if cashReceipts else collections,
        "expenses": subsidiaryPurchases if subsidiaryPurchases else expenses,
        "payments": cashDisbursements if cashDisbursements else payments,
        "ppeAssets": ppeAssets,
        "accountTitles": accountTitles,
        "specialEntries": specialEntries,
        "incomeTaxRecords": incomeTaxRecords,
        "payrollRecords": payrollRecords,
        "employees": employees,
        "theme": theme
    }


def save_ledger_data_json(data):
    """Receives JSON from React App, updates SQLite database, and regenerates transactions.sql."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN TRANSACTION")

        # Clear existing
        tables = [
            "companies", "customers", "contractors", "sales", "collections",
            "expenses", "payments", "subsidiary_sales", "subsidiary_purchases",
            "cash_receipts", "cash_disbursements", "ppe_assets", "account_titles",
            "special_entries", "income_tax_records", "payroll_records", "employees", "app_settings"
        ]
        for t in tables:
            cursor.execute(f"DELETE FROM {t}")

        # Insert Companies
        for c in data.get("companies", []):
            cursor.execute("""
                INSERT INTO companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c.get("id"), c.get("company_name"), c.get("company_tin"), c.get("rdo_code"),
                c.get("line_of_business"), c.get("address"), c.get("zip_code"), c.get("email"),
                c.get("phone"), 1 if c.get("is_vat_registered") else 0, c.get("tax_regime"),
                c.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Customers
        for cu in data.get("customers", []):
            cursor.execute("""
                INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cu.get("id"), cu.get("company_name"), cu.get("customer_name"), cu.get("customer_tin"),
                cu.get("address"), cu.get("contact_person"), cu.get("email"), cu.get("phone"),
                cu.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Contractors
        for co in data.get("contractors", []):
            cursor.execute("""
                INSERT INTO contractors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                co.get("id"), co.get("company_name"), co.get("contractor_name"), co.get("contractor_tin"),
                co.get("address"), co.get("service_type"), co.get("atc_code"), co.get("email"),
                co.get("phone"), co.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Sales
        for s in data.get("sales", []):
            cursor.execute("""
                INSERT INTO sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s.get("id"), s.get("company_name"), s.get("invoice_number"), s.get("invoice_date"),
                s.get("customer_name"), s.get("customer_tin"), float(s.get("invoice_amount") or 0),
                float(s.get("withholding_2307") or 0), float(s.get("vat_exempt_amount") or 0),
                float(s.get("discounts") or 0), float(s.get("down_payment") or 0),
                float(s.get("output_vat") or 0), s.get("sales_status") or "Unpaid",
                s.get("description") or "", s.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Collections
        for col in data.get("collections", []):
            cursor.execute("""
                INSERT INTO collections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                col.get("id"), col.get("company_name"), col.get("invoice_number"), col.get("collection_date"),
                col.get("customer_name"), float(col.get("amount_collected") or 0),
                float(col.get("amount_withheld_2307") or 0), col.get("payment_method") or "Cash",
                col.get("OR_PR_number"), col.get("entry_number") or "",
                col.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Expenses
        for e in data.get("expenses", []):
            cursor.execute("""
                INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                e.get("id"), e.get("company_name"), e.get("voucher_number"), e.get("expense_date"),
                e.get("service_provider_name"), e.get("service_provider_tin"), e.get("expense_type"),
                float(e.get("expense_invoice_amount") or 0), float(e.get("vat_input_amount") or 0),
                float(e.get("withholding_2307_2306") or 0), float(e.get("discounts") or 0),
                e.get("nonvat_or_vat") or "VAT", e.get("expense_status") or "Unpaid",
                e.get("description") or "", e.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Payments
        for p in data.get("payments", []):
            cursor.execute("""
                INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.get("id"), p.get("company_name"), p.get("voucher_number"), p.get("payment_date"),
                p.get("service_provider_name"), float(p.get("amount_paid") or 0),
                float(p.get("withholding_tax_2307") or 0), p.get("payment_method") or "Check",
                p.get("check_voucher_number"), p.get("entry_number") or "",
                p.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Subsidiary Sales (Uniform 21-header table)
        for s in data.get("subsidiarySales", data.get("sales", [])):
            cursor.execute("""
                INSERT INTO subsidiary_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s.get("id"), s.get("company_name"), s.get("registered_name") or s.get("customer_name") or "Customer",
                s.get("vat_or_nonvat") or ("VAT" if (s.get("output_vat") or 0) > 0 else "NONVAT"),
                s.get("tin") or s.get("customer_tin") or "000-000-000-00000",
                s.get("address") or "", s.get("type_of_transaction") or ("CASH" if s.get("sales_status") == "Paid" else "ON ACCOUNT"),
                s.get("date") or s.get("invoice_date") or datetime.now().strftime("%Y-%m-%d"),
                s.get("invoice_type") or "SALES INVOICE", s.get("voucher_number") or "",
                s.get("invoice_number") or "", s.get("particulars") or s.get("description") or "",
                float(s.get("qty") or 1), float(s.get("unit_price") or s.get("invoice_amount") or 0),
                float(s.get("amount") or s.get("invoice_amount") or 0),
                float(s.get("vatable_amount") or s.get("vatable_sales") or 0),
                float(s.get("vat_amount") or s.get("output_vat") or 0),
                float(s.get("zero_rated_amount") or s.get("zero_rated") or 0),
                float(s.get("vat_exempt_amount") or 0),
                float(s.get("total_amount_vat_inclusive") or s.get("invoice_amount") or 0),
                float(s.get("total_amount_net_of_vat") or s.get("amount_net_of_vat") or 0),
                float(s.get("discount") or s.get("discounts") or 0),
                float(s.get("tax_withheld") or s.get("withholding_2307") or 0),
                float(s.get("total_amount_due") or 0),
                1 if s.get("is_cancelled") else 0,
                s.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Subsidiary Purchases (Uniform 21-header table)
        for e in data.get("subsidiaryPurchases", data.get("expenses", [])):
            cursor.execute("""
                INSERT INTO subsidiary_purchases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                e.get("id"), e.get("company_name"), e.get("registered_name") or e.get("service_provider_name") or "Vendor",
                e.get("vat_or_nonvat") or ("NONVAT" if e.get("nonvat_or_vat") == "NON-VATABLE" else "VAT"),
                e.get("tin") or e.get("service_provider_tin") or "000-000-000-00000",
                e.get("address") or "", e.get("type_of_transaction") or ("CASH" if e.get("expense_status") == "Paid" else "ON ACCOUNT"),
                e.get("date") or e.get("expense_date") or datetime.now().strftime("%Y-%m-%d"),
                e.get("invoice_type") or "OFFICIAL RECEIPT", e.get("voucher_number") or e.get("voucher_no") or "",
                e.get("invoice_number") or e.get("voucher_number") or "", e.get("particulars") or e.get("description") or "",
                float(e.get("qty") or 1), float(e.get("unit_price") or e.get("expense_invoice_amount") or 0),
                float(e.get("amount") or e.get("expense_invoice_amount") or 0),
                float(e.get("vatable_amount") or e.get("vatable_expense") or 0),
                float(e.get("vat_amount") or e.get("vat_input_amount") or 0),
                float(e.get("zero_rated_amount") or 0),
                float(e.get("vat_exempt_amount") or 0),
                float(e.get("total_amount_vat_inclusive") or e.get("expense_invoice_amount") or 0),
                float(e.get("total_amount_net_of_vat") or e.get("amount_net_of_vat") or 0),
                float(e.get("discount") or e.get("discounts") or 0),
                float(e.get("tax_withheld") or e.get("withholding_2307_2306") or 0),
                float(e.get("total_amount_due") or 0),
                1 if e.get("is_cancelled") else 0,
                e.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Cash Receipts (Uniform 21-header table)
        for c in data.get("cashReceipts", data.get("collections", [])):
            cursor.execute("""
                INSERT INTO cash_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c.get("id"), c.get("company_name"), c.get("registered_name") or c.get("customer_name") or "Customer",
                c.get("vat_or_nonvat") or "VAT", c.get("tin") or "000-000-000-00000",
                c.get("address") or "", c.get("type_of_transaction") or "CASH",
                c.get("date") or c.get("collection_date") or datetime.now().strftime("%Y-%m-%d"),
                c.get("invoice_type") or "OFFICIAL RECEIPT", c.get("voucher_number") or c.get("entry_number") or "",
                c.get("invoice_number") or c.get("OR_PR_number") or "", c.get("particulars") or c.get("notes") or "",
                float(c.get("qty") or 1), float(c.get("unit_price") or c.get("amount_collected") or 0),
                float(c.get("amount") or c.get("amount_collected") or 0),
                float(c.get("vatable_amount") or 0), float(c.get("vat_amount") or 0),
                float(c.get("zero_rated_amount") or 0), float(c.get("vat_exempt_amount") or 0),
                float(c.get("total_amount_vat_inclusive") or c.get("amount_collected") or 0),
                float(c.get("total_amount_net_of_vat") or 0), float(c.get("discount") or 0),
                float(c.get("tax_withheld") or c.get("amount_withheld_2307") or 0),
                float(c.get("total_amount_due") or 0),
                1 if c.get("is_cancelled") else 0,
                c.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Cash Disbursements (Uniform 21-header table)
        for p in data.get("cashDisbursements", data.get("payments", [])):
            cursor.execute("""
                INSERT INTO cash_disbursements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.get("id"), p.get("company_name"), p.get("registered_name") or p.get("service_provider_name") or "Payee",
                p.get("vat_or_nonvat") or "VAT", p.get("tin") or "000-000-000-00000",
                p.get("address") or "", p.get("type_of_transaction") or "CASH",
                p.get("date") or p.get("payment_date") or datetime.now().strftime("%Y-%m-%d"),
                p.get("invoice_type") or "OFFICIAL RECEIPT", p.get("voucher_number") or p.get("check_voucher_number") or "",
                p.get("invoice_number") or p.get("voucher_number") or "", p.get("particulars") or p.get("notes") or "",
                float(p.get("qty") or 1), float(p.get("unit_price") or p.get("amount_paid") or 0),
                float(p.get("amount") or p.get("amount_paid") or 0),
                float(p.get("vatable_amount") or 0), float(p.get("vat_amount") or 0),
                float(p.get("zero_rated_amount") or 0), float(p.get("vat_exempt_amount") or 0),
                float(p.get("total_amount_vat_inclusive") or p.get("amount_paid") or 0),
                float(p.get("total_amount_net_of_vat") or 0), float(p.get("discount") or 0),
                float(p.get("tax_withheld") or p.get("withholding_tax_2307") or 0),
                float(p.get("total_amount_due") or 0),
                1 if p.get("is_cancelled") else 0,
                p.get("created_at") or datetime.now().isoformat()
            ))

        # Insert PPE
        for ppe in data.get("ppeAssets", []):
            cursor.execute("""
                INSERT INTO ppe_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ppe.get("id"), ppe.get("company_name"), ppe.get("asset_code"), ppe.get("asset_name"),
                ppe.get("category"), ppe.get("acquisition_date"), float(ppe.get("acquisition_cost") or 0),
                float(ppe.get("salvage_value") or 0), float(ppe.get("useful_life_years") or 0),
                ppe.get("depreciation_method") or "Straight Line",
                float(ppe.get("accumulated_depreciation") or 0),
                float(ppe.get("net_book_value") or 0), ppe.get("status") or "Active",
                ppe.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Account Titles
        for a in data.get("accountTitles", []):
            cursor.execute("""
                INSERT OR IGNORE INTO account_titles VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                a.get("id"), a.get("code"), a.get("title"), a.get("category"),
                a.get("type"), a.get("description") or "",
                a.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Special Entries
        for se in data.get("specialEntries", []):
            lines_json = json.dumps(se.get("lines") or [])
            cursor.execute("""
                INSERT INTO special_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                se.get("id"), se.get("company_name"), se.get("entry_number"), se.get("voucher_no"),
                se.get("entry_date"), se.get("entry_type"), se.get("description") or "",
                lines_json, se.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Employees
        for emp in data.get("employees", []):
            cursor.execute("""
                INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                emp.get("id"), emp.get("company_name"), emp.get("employee_id"), emp.get("full_name"),
                emp.get("tin"), emp.get("sss_number"), emp.get("philhealth_number"),
                emp.get("pagibig_number"), emp.get("position"), emp.get("department"),
                float(emp.get("monthly_rate") or 0), float(emp.get("daily_rate") or 0),
                emp.get("tax_status") or "Single",
                1 if emp.get("is_subject_to_contributions") else 0,
                emp.get("created_at") or datetime.now().isoformat()
            ))

        # Insert Payroll
        for pay in data.get("payrollRecords", []):
            cursor.execute("""
                INSERT INTO payroll_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pay.get("id"), pay.get("company_name"), pay.get("employee_id"), pay.get("employee_name"),
                pay.get("payroll_period"), float(pay.get("basic_pay") or 0),
                float(pay.get("overtime_pay") or 0), float(pay.get("allowances") or 0),
                float(pay.get("gross_pay") or 0), float(pay.get("sss_deduction") or 0),
                float(pay.get("philhealth_deduction") or 0), float(pay.get("pagibig_deduction") or 0),
                float(pay.get("withholding_tax") or 0), float(pay.get("other_deductions") or 0),
                float(pay.get("net_pay") or 0), pay.get("status") or "Processed",
                pay.get("created_at") or datetime.now().isoformat()
            ))

        # App Settings
        active_id = str(data.get("activeCompanyId") or "")
        theme = str(data.get("theme") or "neon_light")
        cursor.execute("INSERT OR REPLACE INTO app_settings VALUES ('activeCompanyId', ?)", (active_id,))
        cursor.execute("INSERT OR REPLACE INTO app_settings VALUES ('theme', ?)", (theme,))

        conn.commit()
        conn.close()

        # Update SQL file immediately
        export_database_to_sql()
        return True, "Transactions saved to SQLite database and synced to transactions.sql"
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[SAVE ERROR] Failed saving transactions: {e}")
        return False, str(e)


# =============================================================================
# HTTP REQUEST HANDLER
# =============================================================================

class AppRequestHandler(SimpleHTTPRequestHandler):
    """Handles static web files, /api/ledger-data GET/POST, and /api/export-sql."""

    def __init__(self, *args, **kwargs):
        # Choose directory for static files: check web/, then ../dist
        if os.path.exists(WEB_DIR) and os.path.exists(os.path.join(WEB_DIR, "index.html")):
            self.serve_dir = WEB_DIR
        elif os.path.exists(PARENT_DIST) and os.path.exists(os.path.join(PARENT_DIST, "index.html")):
            self.serve_dir = PARENT_DIST
        else:
            self.serve_dir = SCRIPT_DIR
        super().__init__(*args, directory=self.serve_dir, **kwargs)

    def end_headers(self):
        # Add CORS and no-cache headers for API
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # API: Return all ledger data from SQLite
        if path == "/api/ledger-data":
            data = get_ledger_data_json()
            payload = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        # API: Export SQL file
        if path == "/api/export-sql" or path == "/transactions.sql":
            export_database_to_sql()
            if os.path.exists(SQL_FILE):
                with open(SQL_FILE, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/sql")
                self.send_header("Content-Disposition", 'attachment; filename="transactions.sql"')
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        # Handle GitHub Pages subpath routing (/Project-2os/...)
        if path.startswith("/Project-2os"):
            subpath = path[len("/Project-2os"):]
            if not subpath or subpath == "/":
                subpath = "/index.html"
            self.path = subpath

        # If requesting root, serve index.html
        if self.path == "/" or self.path == "":
            self.path = "/index.html"

        # Check if local file exists, otherwise fallback to index.html for SPA routing
        target_path = os.path.join(self.serve_dir, self.path.lstrip("/"))
        if not os.path.exists(target_path):
            index_path = os.path.join(self.serve_dir, "index.html")
            if os.path.exists(index_path):
                self.path = "/index.html"
            else:
                # If no index.html is available, render built-in landing dashboard
                self.render_fallback_page()
                return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/ledger-data":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                post_body = self.rfile.read(content_len)
                data = json.loads(post_body.decode("utf-8"))

                success, msg = save_ledger_data_json(data)
                res_payload = json.dumps({"success": success, "message": msg}).encode("utf-8")

                self.send_response(200 if success else 500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(res_payload)))
                self.end_headers()
                self.wfile.write(res_payload)
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
            return

        self.send_response(404)
        self.end_headers()

    def render_fallback_page(self):
        """Render a clean desktop fallback viewer if static bundle is compiling."""
        data = get_ledger_data_json()
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>2OS Accounting System - Desktop Engine</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070e22; color: #e2e8f0; margin: 0; padding: 24px; }}
        .header {{ display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }}
        .badge {{ background: #0284c7; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }}
        .card {{ background: #0d1636; border: 1px solid #1e3a8a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }}
        th, td {{ border: 1px solid #1e293b; padding: 8px 12px; text-align: left; }}
        th {{ background: #0b1736; color: #38bdf8; }}
        .btn {{ display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; margin-right: 8px; }}
        .btn-green {{ background: #10b981; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <span class="badge">2OS PC DEMO ENGINE</span>
            <h1 style="margin: 6px 0 0 0; color: #38bdf8;">2OS Accounting System</h1>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 14px;">Desktop Window &amp; SQL Database Synchronization Manager</p>
        </div>
        <div>
            <a href="/api/export-sql" class="btn btn-green">Download transactions.sql</a>
            <a href="https://acsignicabssofficial.github.io/Project-2os/" target="_blank" class="btn">Open Cloud Web App</a>
        </div>
    </div>

    <div class="card">
        <h3 style="color: #38bdf8; margin-top: 0;">Active SQL Database Status</h3>
        <p>Target SQL File: <code>{os.path.basename(SQL_FILE)}</code> (Auto-synchronized on every transaction save)</p>
        <p>Active Company: <strong>{data['companies'][0]['company_name'] if data['companies'] else 'None'}</strong> (TIN: {data['companies'][0]['company_tin'] if data['companies'] else ''})</p>
        <p>Total Sales Invoices: <strong>{len(data.get('sales', []))}</strong> | Collections: <strong>{len(data.get('collections', []))}</strong> | Expenses: <strong>{len(data.get('expenses', []))}</strong> | Disbursements: <strong>{len(data.get('payments', []))}</strong></p>
    </div>

    <div class="card">
        <h3 style="color: #38bdf8; margin-top: 0;">Recent Sales Transactions (Logged in SQLite &amp; transactions.sql)</h3>
        <table>
            <thead>
                <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Gross Amount (PHP)</th>
                    <th>Withholding 2307</th>
                    <th>Output VAT</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {''.join(f"<tr><td>{s['invoice_number']}</td><td>{s['invoice_date']}</td><td>{s['customer_name']}</td><td>₱{float(s['invoice_amount']):,.2f}</td><td>₱{float(s['withholding_2307']):,.2f}</td><td>₱{float(s['output_vat']):,.2f}</td><td>{s['sales_status']}</td></tr>" for s in data.get('sales', []))}
            </tbody>
        </table>
    </div>
</body>
</html>"""
        encoded = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


# =============================================================================
# DEDICATED WINDOW LAUNCHER
# =============================================================================

def find_free_port(start_port=5000, max_attempts=50):
    """Finds an available local port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return 8080


def open_dedicated_window(url):
    """
    Opens the app in its own dedicated window:
    1. pywebview (native OS WebView2 window) if installed.
    2. Microsoft Edge or Google Chrome '--app' mode (dedicated standalone app window with its own frame & taskbar icon).
    3. Standard browser window as fallback.
    """
    time.sleep(0.8)

    # Strategy 1: pywebview
    try:
        import webview
        print(f"{CYAN}[WINDOW] Launching native desktop window via pywebview...{RESET}")
        webview.create_window(
            title="2OS Accounting System",
            url=url,
            width=1366,
            height=850,
            resizable=True,
            min_size=(1024, 600)
        )
        webview.start()
        return True
    except ImportError:
        pass
    except Exception as e:
        print(f"[WINDOW] pywebview notice: {e}")

    # Strategy 2: Standalone App Mode (Edge / Chrome)
    # Edge is pre-installed on every Windows 10 & 11 PC.
    # '--app=URL' removes address bar, tabs, and bookmarks, creating a true desktop window!
    browser_executables = [
        # Microsoft Edge
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        # Google Chrome
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        # Brave / Chromium
        os.path.expandvars(r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    ]

    for exe in browser_executables:
        if os.path.exists(exe):
            print(f"{GREEN}[WINDOW] Launching dedicated application window via {os.path.basename(exe)}...{RESET}")
            try:
                subprocess.Popen([
                    exe,
                    f"--app={url}",
                    "--window-size=1366,850",
                    "--start-maximized"
                ])
                return True
            except Exception as e:
                print(f"[WINDOW] Error launching app mode: {e}")

    # Strategy 3: Standard Browser Fallback
    print(f"{YELLOW}[WINDOW] Opening application in default web browser...{RESET}")
    webbrowser.open(url)
    return True


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main():
    print("=" * 70)
    print(f"{BOLD}2OS ACCOUNTING SYSTEM - PC DEMO & SQL DATABASE MANAGER{RESET}")
    print("=" * 70)

    # 1. Initialize SQLite Database & SQL File
    init_database()
    export_database_to_sql()

    # 2. Start HTTP Server
    port = find_free_port(5000)
    server_address = ("127.0.0.1", port)
    app_url = f"http://127.0.0.1:{port}"

    try:
        httpd = HTTPServer(server_address, AppRequestHandler)
    except Exception as e:
        print(f"[ERROR] Could not bind server to port {port}: {e}")
        port = find_free_port(8000)
        server_address = ("127.0.0.1", port)
        app_url = f"http://127.0.0.1:{port}"
        httpd = HTTPServer(server_address, AppRequestHandler)

    print(f"{GREEN}[SERVER] Local Server running at: {app_url}{RESET}")
    print(f"{CYAN}[DATABASE] SQLite DB: {os.path.basename(DB_FILE)}{RESET}")
    print(f"{CYAN}[SQL FILE] Active Transactions Script: {os.path.basename(SQL_FILE)}{RESET}")
    print("=" * 70)
    print("All transaction creates, updates, and disbursements will automatically")
    print(f"synchronize into '{os.path.basename(SQL_FILE)}'.")
    print("=" * 70)

    # 3. Launch dedicated window in background thread
    window_thread = threading.Thread(target=open_dedicated_window, args=(app_url,), daemon=True)
    window_thread.start()

    # 4. Keep HTTP server serving until interrupted
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down gracefully...")
        export_database_to_sql()
        httpd.server_close()
        print("[SERVER] Goodbye!")


if __name__ == "__main__":
    main()
