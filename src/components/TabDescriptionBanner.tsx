import React, { useState } from 'react';
import { 
  BookOpen, 
  Receipt, 
  Coins, 
  DollarSign, 
  Layers, 
  FileSpreadsheet, 
  Building2, 
  Users, 
  Calculator, 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  FileText, 
  FileCheck, 
  FileCheck2, 
  FileCode, 
  Settings, 
  Info, 
  Calendar, 
  BookMarked,
  Table,
  PieChart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Paperclip
} from 'lucide-react';

export interface TabDescriptionItem {
  key: string;
  title: string;
  groupName: string;
  groupNumber: string;
  isBookOfAccount?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderAccent: string;
  badgeBg: string;
  badgeText: string;
  tagColor: string;
  description: string;
  details?: string;
  keyFeatures: string[];
}

export const TAB_DESCRIPTIONS: Record<string, TabDescriptionItem> = {
  // 1. DASHBOARD
  dashboard: {
    key: 'dashboard',
    title: 'Executive Financial Dashboard',
    groupName: 'DASHBOARD',
    groupNumber: 'Main Menu 1',
    icon: PieChart,
    accentColor: 'text-teal-400',
    borderAccent: 'border-teal-500/30',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    tagColor: 'bg-teal-950/60 border-teal-700/40 text-teal-300',
    description: 'Executive Dashboard: High-level visual summary and real-time monitoring of revenues, collections, expenses, cash position, profit margins, and key financial ratios.',
    details: 'Provides C-suite performance metrics, cash flow trends, receivables vs. payables aging, and corporate health indicators.',
    keyFeatures: ['Revenue & Expense Visuals', 'Cash Position Tracker', 'Collection Ratio KPI', 'Quick Action Hub']
  },
  tax_calendar: {
    key: 'tax_calendar',
    title: 'BIR Tax Calendar & Filing Deadlines',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Calendar,
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    tagColor: 'bg-amber-950/60 border-amber-700/40 text-amber-300',
    description: 'BIR Tax Calendar: Schedule of upcoming Philippine tax filing deadlines, BIR forms (Monthly, Quarterly, Annual), and statutory compliance reminders.',
    details: 'Displays exact deadline dates for 2550M/Q, 1601-C, 1601-EQ, 1701/1702, SLSP, and statutory employer contributions.',
    keyFeatures: ['Philippine BIR Form Deadlines', 'Monthly & Quarterly Schedules', 'Filing Checklist', 'Penalty Prevention']
  },
  account_titles: {
    key: 'account_titles',
    title: 'Account Titles & Chart of Accounts',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: BookMarked,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Account Titles & Balances: Comprehensive master chart of accounts, standard account codes, classification (Assets, Liabilities, Equity, Income, Expenses), and real-time balances.',
    details: 'Configure your company Chart of Accounts, set initial opening balances, and inspect total debits, credits, and net balances across all accounts.',
    keyFeatures: ['PFRS Standard Chart of Accounts', 'Account Code Hierarchy', 'Real-Time Debit/Credit Totals', 'Normal Balance Logic']
  },
  about_app: {
    key: 'about_app',
    title: 'About 2OS Accounting System',
    groupName: 'DASHBOARD',
    groupNumber: 'Main Menu 1',
    icon: Info,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'About 2OS Accounting System: System overview, core accounting standards, BIR compliance frameworks, and key architectural capabilities.',
    details: 'Explains double-entry bookkeeping engine, multi-entity support, Philippine tax compliance, and automated reporting workflows.',
    keyFeatures: ['Philippine Accounting Standards', 'Full BIR Tax Suite', 'Automated Journal Engine', 'Multi-Company Architecture']
  },

  // 2. DIRECTORY
  companies: {
    key: 'companies',
    title: 'Company Profiles & Settings',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Building2,
    accentColor: 'text-pink-400',
    borderAccent: 'border-pink-500/30',
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-400',
    tagColor: 'bg-pink-950/60 border-pink-700/40 text-pink-300',
    description: 'Company Profiles: Multi-entity company register, business names, TIN, RDO, VAT classification (VAT / Non-VAT), tax types, and active entity selection.',
    details: 'Manage multiple companies with isolated ledgers, tax configurations, line of business codes, and BIR registration details.',
    keyFeatures: ['Multi-Entity Management', 'TIN & RDO Registration', 'VAT vs. Non-VAT Settings', 'Active Company Switcher']
  },
  customers: {
    key: 'customers',
    title: 'Customer Profiles & Masterlist',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Users,
    accentColor: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    tagColor: 'bg-indigo-950/60 border-indigo-700/40 text-indigo-300',
    description: 'Customer Masterlist: Database of registered customer entities, TIN, RDO, contact details, and account receivable balances.',
    details: 'Stores customer billing details, registered addresses, and credit terms for fast invoice creation and 2307 matching.',
    keyFeatures: ['Customer Directory', 'TIN & RDO Records', 'Billing Contact Info', 'AR Tracking']
  },
  providers: {
    key: 'providers',
    title: 'Suppliers & Service Providers',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Building2,
    accentColor: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    tagColor: 'bg-indigo-950/60 border-indigo-700/40 text-indigo-300',
    description: 'Suppliers & Service Providers: Accredited vendor directory, business classification, TIN, ATC tax rate codes, and accounts payable.',
    details: 'Maintains accredited vendor records, standard withholding tax rates (ATC), and payment voucher histories.',
    keyFeatures: ['Vendor & Contractor List', 'ATC Code Settings', 'TIN Validation', 'AP Ledger Integration']
  },
  related_parties: {
    key: 'related_parties',
    title: 'Related Parties Masterlist',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Users,
    accentColor: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    tagColor: 'bg-indigo-950/60 border-indigo-700/40 text-indigo-300',
    description: 'Related Parties Masterlist: Master database of registered customers, suppliers, contractors, and affiliates with TIN, tax rates, contact details, and transaction history.',
    details: 'Unified directory for customer profiles and service provider details used for automatic TIN autofill, 2307 generation, and transaction validation.',
    keyFeatures: ['Customer & Supplier Masterlist', 'TIN & Address Autofill', 'Withholding Tax Rates', 'Transaction History Link']
  },
  employees: {
    key: 'employees',
    title: 'Employee Masterlist & Profiles',
    groupName: 'DIRECTORY',
    groupNumber: 'Main Menu 2',
    icon: Users,
    accentColor: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    tagColor: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300',
    description: 'Employee Masterlist & Profiles: Complete employee directory with employment status, compensation rates, TIN, SSS, PhilHealth, Pag-IBIG numbers, and tax exemption settings.',
    details: 'Stores employee compensation, basic salary, allowances, statutory registration IDs, and personal tax status for payroll calculation and BIR 2316 generation.',
    keyFeatures: ['Employee Directory', 'Statutory ID Numbers', 'Basic Salary & Allowances', 'Tax Exemption Status']
  },

  // 3. BOOKS OF ACCOUNTS
  sales: {
    key: 'sales',
    title: 'Sales & Invoices Register',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: Receipt,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Sales: Spreadsheet list of customer cash sales, on account sales, returns and cancellation of sales.',
    details: 'Covers sales invoices, service billing records, 12% vatable sales computations, zero-rated/exempt amounts, sales discounts, 2307 withholding tax deductions, and automatic double-entry posting to the General Ledger.',
    keyFeatures: [
      'Cash & On-Account (Credit) Sales',
      'Sales Returns & Invoice Cancellations',
      '12% Output VAT Calculation',
      'BIR 2307 Creditable Withholding',
      'Automatic General Journal Debits/Credits'
    ]
  },
  collections: {
    key: 'collections',
    title: 'Cash Receipts & Collections Book',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: Coins,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Cash Receipts / Collections: Spreadsheet list and record of customer payments received, cash & check collections, official receipts (OR), bank deposits, and matching against sales invoices.',
    details: 'Tracks customer accounts receivable settlements, partial payments, advance collections, cash vs. check bank clearances, and corresponding tax withheld at source.',
    keyFeatures: [
      'Customer Cash & Check Collections',
      'Official Receipt (OR) Numbering',
      'Invoice Balance Liquidation',
      'E-Payment & Bank Transfer Matching',
      'Real-Time Cash Asset Debiting'
    ]
  },
  expenses: {
    key: 'expenses',
    title: 'Expenses & Purchase Book Register',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: Receipt,
    accentColor: 'text-rose-400',
    borderAccent: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    tagColor: 'bg-rose-950/60 border-rose-700/40 text-rose-300',
    description: 'Expenses: Purchase book and record of operating expenses, purchases of goods and services, supplier billings, input VAT claims, voucher records, and provider accounts payable.',
    details: 'Categorizes administrative, operational, direct project costs, capitalizable purchases, computes 12% creditable input tax, and records expanded withholding taxes (EWT).',
    keyFeatures: [
      'Operating Expenses & Supplies Purchases',
      '12% Input VAT Credit Register',
      'Supplier Invoice & Billing Vouchers',
      'Expanded Withholding Tax (EWT) Tracking',
      'Accounts Payable Creation'
    ]
  },
  payments: {
    key: 'payments',
    title: 'Cash Disbursements & Payments Book',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: DollarSign,
    accentColor: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    tagColor: 'bg-purple-950/60 border-purple-700/40 text-purple-300',
    description: 'Cash Disbursements / Payments: Summary and register of cash & check disbursements, bank withdrawals, payment vouchers, liquidation of accounts payable, and withholding tax at source.',
    details: 'Logs check voucher numbers, payee names, bank accounts drawn, supplier invoice settlements, payment methods (Cash, Check, Online), and updates cash balances in real time.',
    keyFeatures: [
      'Check & Cash Disbursement Vouchers',
      'Accounts Payable Settlements',
      'Bank Account Deductions',
      'Supplier Payment Liquidation',
      'Withholding Tax Remittance Trail'
    ]
  },
  general_journal: {
    key: 'general_journal',
    title: 'General Journal (Master Book of Original Entry)',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: BookOpen,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'General Journal: Chronological recording of all accounting transactions and double-entry debits and credits from Sales, Collections, Expenses, Payments, Payroll, and Special Entries.',
    details: 'Serves as the central repository of chronological financial entries where every transaction maintains balanced Debit = Credit totals with audit trails linking to source documents.',
    keyFeatures: [
      'Strict Double-Entry Bookkeeping',
      'Debit & Credit Balance Validation',
      'Cross-Module Chronological Consolidation',
      'Journal Voucher (JV) Referencing',
      'Direct Source Document Trail'
    ]
  },
  general_ledger: {
    key: 'general_ledger',
    title: 'General Ledger (T-Accounts & Running Balances)',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: Layers,
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    tagColor: 'bg-amber-950/60 border-amber-700/40 text-amber-300',
    description: 'General Ledger: Complete master record of all financial accounts (Assets, Liabilities, Equity, Revenue, and Expenses) showing cumulative debit and credit postings and real-time ending balances.',
    details: 'Aggregates journal entries into distinct T-accounts with running balances, verifies the trial balance equation, and directly powers the Financial Statements.',
    keyFeatures: [
      'Comprehensive Master T-Accounts',
      'Real-Time Running Balances',
      'Assets, Liabilities, Equity, Income, Expense Ledgers',
      'Trial Balance Reconciliation',
      'Financial Statement Integration'
    ]
  },
  special_entries: {
    key: 'special_entries',
    title: 'Special Entries & Journal Vouchers',
    groupName: 'BOOKS OF ACCOUNTS',
    groupNumber: 'Main Menu 3',
    isBookOfAccount: true,
    icon: Layers,
    accentColor: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    tagColor: 'bg-purple-950/60 border-purple-700/40 text-purple-300',
    description: 'Special Entries: Manual journal vouchers, adjusting entries, accruals, prepayments, non-cash transactions, depreciation entries, and year-end closing entries.',
    details: 'Enables flexible multi-line compound journal entries with user-defined accounts, custom explanations, and automated debit/credit balancing verification.',
    keyFeatures: [
      'Compound Journal Vouchers',
      'Year-End & Period Adjusting Entries',
      'Accruals, Prepayments & Reversals',
      'Non-Cash Asset Transfers',
      'Multi-Line Balanced Posting'
    ]
  },

  // 4. OTHER TRANSACTIONS
  payroll: {
    key: 'payroll',
    title: 'Payroll Management & Register',
    groupName: 'OTHER TRANSACTIONS',
    groupNumber: 'Main Menu 4',
    icon: FileSpreadsheet,
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    tagColor: 'bg-amber-950/60 border-amber-700/40 text-amber-300',
    description: 'Payroll Management & Register: Semi-monthly and monthly payroll processing, gross pay calculations, statutory deductions (SSS, PhilHealth, Pag-IBIG), withholding taxes, and net pay slips.',
    details: 'Computes gross wages, overtime, late deductions, employer/employee statutory shares, graduated withholding taxes on compensation, and generates printable payslips.',
    keyFeatures: ['Automated Statutory Deductions', 'SSS, PhilHealth & Pag-IBIG Shares', 'TRAIN Act Withholding Tax', 'Payslip Generator']
  },
  bir_2316: {
    key: 'bir_2316',
    title: 'BIR Form 2316 (Certificate of Compensation)',
    groupName: 'OTHER TRANSACTIONS',
    groupNumber: 'Main Menu 4',
    icon: FileText,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'BIR Form 2316 (Certificate of Compensation): Certificate of compensation payment and tax withheld for individual employees at year-end or upon separation.',
    details: 'Generates BIR-standard Form 2316 certificates summarizing gross compensation income, non-taxable 13th month/exemptions, taxable income, and annualized tax withheld.',
    keyFeatures: ['Official BIR 2316 Layout', 'Annual Compensation Summary', 'Tax Withheld Reconciliation', 'Employee Signature Ready']
  },
  contribution_tables: {
    key: 'contribution_tables',
    title: 'Statutory Contribution & Tax Tables',
    groupName: 'OTHER TRANSACTIONS',
    groupNumber: 'Main Menu 4',
    icon: Table,
    accentColor: 'text-rose-400',
    borderAccent: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    tagColor: 'bg-rose-950/60 border-rose-700/40 text-rose-300',
    description: 'Statutory Contribution & Tax Tables: Official reference tables and contribution brackets for SSS, PhilHealth, Pag-IBIG, and graduated withholding tax (TRAIN Act).',
    details: 'Configure, update, or inspect contribution brackets, employer/employee sharing ratios, maximum salary caps, and graduated withholding tax ranges.',
    keyFeatures: ['SSS Contribution Brackets', 'PhilHealth Premium Rates', 'Pag-IBIG HDMF Settings', 'TRAIN Act Tax Brackets']
  },
  ppe: {
    key: 'ppe',
    title: 'Property, Plant & Equipment (PPE) & Depreciation Schedule',
    groupName: 'OTHER TRANSACTIONS',
    groupNumber: 'Main Menu 4',
    icon: Building2,
    accentColor: 'text-blue-400',
    borderAccent: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    tagColor: 'bg-blue-950/60 border-blue-700/40 text-blue-300',
    description: 'PPE & Depreciation: Fixed asset registry, acquisition costs, salvage values, useful life, and automatic depreciation schedules (Annual and Monthly straight-line).',
    details: 'Tracks capital asset acquisitions, category classifications, calculates accumulated depreciation and net book values, and outputs multi-year depreciation tables.',
    keyFeatures: ['Asset Register & Tagging', 'Straight-Line Depreciation Method', 'Annual & Monthly Schedules', 'Net Book Value Tracking']
  },

  // 5. BIR ATTACHMENTS (DEDICATED MAIN MENU)
  cwt_customers: {
    key: 'cwt_customers',
    title: 'BIR Form 2307 (from Customers)',
    groupName: 'BIR ATTACHMENTS',
    groupNumber: 'Main Menu 5',
    icon: FileCheck,
    accentColor: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    tagColor: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300',
    description: 'BIR Form 2307 (from Customers): Certificates of Creditable Withholding Tax at Source received from customers for claiming tax credits against quarterly income tax.',
    details: 'Log and track creditable withholding tax certificates received from clients to legally reduce quarterly and annual income tax liabilities.',
    keyFeatures: ['Customer 2307 Registry', 'Income Tax Credit Deductions', 'ATC Code Classification', 'Period Claim Monitoring']
  },
  cwt_providers: {
    key: 'cwt_providers',
    title: 'BIR Form 2307 (for Providers)',
    groupName: 'BIR ATTACHMENTS',
    groupNumber: 'Main Menu 5',
    icon: FileCheck,
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    tagColor: 'bg-amber-950/60 border-amber-700/40 text-amber-300',
    description: 'BIR Form 2307 (for Providers): Certificates of Creditable Tax Withheld generated for suppliers, service providers, and professional fee payees.',
    details: 'Generate official BIR Form 2307 certificates to issue to suppliers and contractors showing taxes withheld from their payments.',
    keyFeatures: ['Supplier 2307 Generation', 'Expanded Withholding Tax (EWT)', 'Printable BIR 2307 Certificate', 'Remittance Schedule Matching']
  },
  bir_slsp: {
    key: 'bir_slsp',
    title: 'Summary List of Sales & Purchases (SLSP)',
    groupName: 'BIR ATTACHMENTS',
    groupNumber: 'Main Menu 5',
    icon: FileSpreadsheet,
    accentColor: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    tagColor: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300',
    description: 'Summary List of Sales & Purchases (SLSP): Electronic BIR SLSP schedule matching customer sales and supplier purchases for quarterly VAT reconciliation.',
    details: 'Compiles Summary List of Sales (SLS) and Summary List of Purchases (SLP) for submission as mandatory attachments to quarterly VAT returns.',
    keyFeatures: ['Quarterly SLS & SLP Schedules', 'Customer/Supplier TIN Validation', 'Input & Output VAT Matching', 'BIR Relief Format Ready']
  },
  bir_qap: {
    key: 'bir_qap',
    title: 'Quarterly Alphalist of Payees (QAP)',
    groupName: 'BIR ATTACHMENTS',
    groupNumber: 'Main Menu 5',
    icon: FileCode,
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    tagColor: 'bg-amber-950/60 border-amber-700/40 text-amber-300',
    description: 'Quarterly Alphalist of Payees (QAP): Consolidated alphabetical list of payees subjected to expanded withholding taxes for attachment to BIR Form 1601-EQ.',
    details: 'Aggregates all income payments subjected to withholding tax by payee TIN, name, ATC code, tax base, and tax withheld.',
    keyFeatures: ['Consolidated Payee Alphalist', 'Form 1601-EQ Attachment', 'ATC Tax Breakdown', 'Quarterly Compliance Schedule']
  },
  bir_sawt: {
    key: 'bir_sawt',
    title: 'Summary Alphalist of Withholding Agents (SAWT)',
    groupName: 'BIR ATTACHMENTS',
    groupNumber: 'Main Menu 5',
    icon: FileCheck2,
    accentColor: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    tagColor: 'bg-purple-950/60 border-purple-700/40 text-purple-300',
    description: 'Summary Alphalist of Withholding Agents (SAWT): Schedule of creditable withholding taxes claimed as tax credits for attachment to BIR Form 1701/1702.',
    details: 'Itemizes withholding agents who deducted creditable taxes from company revenue, required as an attachment to quarterly and annual income tax returns.',
    keyFeatures: ['Withholding Agent Alphalist', 'Income Tax Return Attachment', 'Tax Credit Verification', 'BIR Form 1701/1702 Support']
  },

  // 6. REPORTS
  tax_reports: {
    key: 'tax_reports',
    title: 'BIR Tax Reports Suite',
    groupName: 'REPORTS',
    groupNumber: 'Main Menu 6',
    icon: Calculator,
    accentColor: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    tagColor: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300',
    description: 'BIR Tax Reports Suite: Consolidated tax computation and filing reports including BIR Forms 2550M/Q, 1701/1702, 1601-C, 1601-EQ, and 0605.',
    details: 'Instant calculation and form views for monthly VAT declarations, quarterly income tax returns, expanded withholding tax returns, and annual tax returns.',
    keyFeatures: ['BIR Form 2550M / 2550Q (VAT)', 'BIR Form 1701 / 1702 (Income Tax)', 'BIR Form 1601-C & 1601-EQ', 'Tax Due & Credit Matching']
  },
  reports: {
    key: 'reports',
    title: 'Reporting Center & Excel Export',
    groupName: 'REPORTS',
    groupNumber: 'Main Menu 6',
    icon: Settings,
    accentColor: 'text-zinc-300',
    borderAccent: 'border-zinc-500/30',
    badgeBg: 'bg-zinc-500/10',
    badgeText: 'text-zinc-300',
    tagColor: 'bg-zinc-900 border-zinc-700 text-zinc-300',
    description: 'Reporting Center: Comprehensive reporting suite for generating Excel workbooks, audit trails, account balances, and complete financial packages.',
    details: 'Export full accounting workbooks with separate sheets for Sales, Collections, Expenses, Payments, PPE, and Financial Statements with one click.',
    keyFeatures: ['Multi-Sheet Excel Export', 'Audit Trail Export', 'Backup & Restore Data', 'PDF / Print Formats']
  },

  // 7. FINANCIAL STATEMENTS
  fs_position: {
    key: 'fs_position',
    title: 'Statement of Financial Position (Balance Sheet)',
    groupName: 'FINANCIAL STATEMENTS',
    groupNumber: 'Main Menu 7',
    icon: Landmark,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Statement of Financial Position (Balance Sheet): PFRS-compliant balance sheet presenting total assets, liabilities, and owners\' equity as of the reporting date.',
    details: 'Displays current and non-current assets, current and non-current liabilities, equity accounts, and verifies the fundamental accounting equation (Assets = Liabilities + Equity).',
    keyFeatures: ['PFRS Compliant Balance Sheet', 'Current & Non-Current Segregation', 'Assets = Liabilities + Equity Check', 'Comparative Reporting']
  },
  fs_income: {
    key: 'fs_income',
    title: 'Statement of Comprehensive Income (P&L)',
    groupName: 'FINANCIAL STATEMENTS',
    groupNumber: 'Main Menu 7',
    icon: TrendingUp,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Statement of Comprehensive Income (P&L): Periodic financial performance showing gross revenues, cost of sales, operating expenses, and net operating profit.',
    details: 'Calculates Gross Profit, Operating Profit (EBIT), Net Income before and after income tax, and percentage breakdowns of operational expenditure.',
    keyFeatures: ['Gross Revenue & Cost of Sales', 'Operating Expenses Breakdown', 'Net Operating Income / Profit', 'Profit Margin Analysis']
  },
  fs_equity: {
    key: 'fs_equity',
    title: 'Statement of Changes in Equity',
    groupName: 'FINANCIAL STATEMENTS',
    groupNumber: 'Main Menu 7',
    icon: ShieldCheck,
    accentColor: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    tagColor: 'bg-purple-950/60 border-purple-700/40 text-purple-300',
    description: 'Statement of Changes in Equity: Movement and reconciliation of capital contributions, retained earnings, owner drawings, and net income over the accounting period.',
    details: 'Tracks beginning equity, additional capital invested, net profit or loss for the period, owner withdrawals/drawings, and ending equity balance.',
    keyFeatures: ['Owner\'s Capital Contributions', 'Retained Earnings Reconciliation', 'Owner Drawings & Dividends', 'Ending Equity Balance']
  },
  fs_cashflows: {
    key: 'fs_cashflows',
    title: 'Statement of Cash Flows',
    groupName: 'FINANCIAL STATEMENTS',
    groupNumber: 'Main Menu 7',
    icon: Activity,
    accentColor: 'text-teal-400',
    borderAccent: 'border-teal-500/30',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    tagColor: 'bg-teal-950/60 border-teal-700/40 text-teal-300',
    description: 'Statement of Cash Flows: Analysis of cash inflows and outflows categorized into Operating, Investing, and Financing activities using the indirect method.',
    details: 'Reconciles net income to net cash provided by operating activities, purchases/disposals of fixed assets, and equity financing flows.',
    keyFeatures: ['Operating Activities Flow', 'Investing Activities (PPE)', 'Financing Activities', 'Net Cash Position Reconciliation']
  },
  fs_notes: {
    key: 'fs_notes',
    title: 'Notes to Financial Statements',
    groupName: 'FINANCIAL STATEMENTS',
    groupNumber: 'Main Menu 7',
    icon: BookMarked,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: 'Notes to Financial Statements: Qualitative disclosures, accounting policies, itemized breakdowns, and supplementary financial statement schedules.',
    details: 'Provide comprehensive explanatory notes on accounting policies, basis of preparation, contingent liabilities, and itemized account schedules.',
    keyFeatures: ['PFRS Accounting Policies', 'Itemized Account Breakdown', 'Corporate Disclosures', 'Auditor & BIR Ready']
  }
};

interface TabDescriptionBannerProps {
  activeTab: string;
  theme: any;
  activeCompanyName?: string;
}

export default function TabDescriptionBanner({ activeTab, theme, activeCompanyName }: TabDescriptionBannerProps) {
  const [showExtended, setShowExtended] = useState<boolean>(true);

  const tabInfo = TAB_DESCRIPTIONS[activeTab] || {
    key: activeTab,
    title: activeTab.replace(/_/g, ' ').toUpperCase(),
    groupName: 'GENERAL',
    groupNumber: 'Module',
    isBookOfAccount: false,
    icon: Layers,
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    tagColor: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300',
    description: `${activeTab.replace(/_/g, ' ')}: Transaction overview and management ledger.`,
    details: 'Manage records and view financial computations.',
    keyFeatures: ['Real-Time Ledger Updates', 'Data Validation', 'Export Ready']
  };

  const Icon = tabInfo.icon;

  return (
    <div 
      className={`${theme.bgCard} border ${tabInfo.isBookOfAccount ? 'border-cyan-500/40 shadow-md' : theme.borderCard} rounded-2xl p-4 sm:p-5 transition-all duration-200`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl ${tabInfo.badgeBg} border ${tabInfo.borderAccent} flex-shrink-0 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${tabInfo.accentColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${tabInfo.badgeBg} ${tabInfo.badgeText} border ${tabInfo.borderAccent}`}>
                {tabInfo.groupName} • {tabInfo.groupNumber}
              </span>
              {tabInfo.isBookOfAccount && (
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  theme.isLight 
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-300' 
                    : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                }`}>
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  Official Book of Accounts
                </span>
              )}
              {activeCompanyName && (
                <span className={`text-[10px] font-medium ${theme.textMuted} hidden sm:inline-block`}>
                  • {activeCompanyName}
                </span>
              )}
            </div>

            {/* TAB DESCRIPTION: High-visibility formatting */}
            <p className={`text-xs sm:text-sm font-medium ${theme.textTitle} leading-relaxed`}>
              {tabInfo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            onClick={() => setShowExtended(!showExtended)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300'} transition flex items-center gap-1 cursor-pointer`}
            title="Toggle details"
          >
            <span>{showExtended ? 'Hide Details' : 'Show Details'}</span>
            {showExtended ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EXTENDED DETAILS & FEATURE TAGS */}
      {showExtended && (
        <div className={`mt-3.5 pt-3 border-t ${theme.borderCard} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
          {tabInfo.details && (
            <p className={`text-[11px] sm:text-xs ${theme.textMuted} flex-1 leading-normal`}>
              {tabInfo.details}
            </p>
          )}

          {tabInfo.keyFeatures && tabInfo.keyFeatures.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
              {tabInfo.keyFeatures.map((feat, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${theme.isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : tabInfo.tagColor}`}
                >
                  {feat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
