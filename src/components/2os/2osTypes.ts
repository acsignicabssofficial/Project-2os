import React from 'react';
import { 
  PieChart, 
  Calendar, 
  BookMarked, 
  Info, 
  Building2, 
  Users, 
  UserCheck,
  Receipt, 
  Coins, 
  DollarSign, 
  BookOpen, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  Table, 
  Calculator, 
  FileCheck, 
  FileCheck2, 
  FileCode, 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Settings,
  Paperclip,
  FolderKanban,
  Truck,
  Scale
} from 'lucide-react';

export type RibbonCategoryKey = 
  | 'HOME'
  | 'DIRECTORY'
  | 'BOOKS OF ACCOUNTS'
  | 'OTHER TRANSACTIONS'
  | 'FINANCIAL STATEMENTS'
  | 'BIR COMPUTATIONS'
  | 'SETTINGS';

export interface RibbonSubTab {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  formula: string;
  cellRef: string;
  isBookOfAccount?: boolean;
}

export interface RibbonCategory {
  key: RibbonCategoryKey;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  subTabs: RibbonSubTab[];
}

export const RIBBON_CATEGORIES: RibbonCategory[] = [
  // 1. HOME
  {
    key: 'HOME',
    label: 'Home',
    icon: PieChart,
    subTabs: [
      {
        key: 'dashboard',
        label: 'Executive Dashboard & Overview',
        shortLabel: 'Dashboard',
        icon: PieChart,
        cellRef: 'HOME!A1',
        description: 'Dashboard: Visual KPI metrics, revenue summary, collections, expense monitoring, cash position, and live operational stats.',
        formula: '=EXECUTIVE_DASHBOARD(Revenue, Expenses, Collections, CashPosition)'
      },
      {
        key: 'reports',
        label: 'Financial Reports & Analysis (Turnovers, Trends & Ratios)',
        shortLabel: 'Reports &\nAnalysis',
        icon: Calculator,
        cellRef: 'REPORTS!A1',
        description: 'Reports & Analysis: Financial turnovers, horizontal trend comparison, common-size vertical analysis, and PFRS ratio benchmarks.',
        formula: '=REPORTS_AND_ANALYSIS(Turnovers, Horizontal, Vertical, Ratios)'
      },
      {
        key: 'account_titles',
        label: 'Chart of Accounts & Balances',
        shortLabel: 'Chart of\nAccounts',
        icon: BookMarked,
        cellRef: 'COA!A1',
        description: 'Chart of Accounts: Master list of financial accounts, codes, descriptions, normal balances, and current ledger balances.',
        formula: '=CHART_OF_ACCOUNTS(AccountTitle, Description, AccountType, CurrentBalance)'
      },
      {
        key: 'tax_calendar',
        label: 'BIR Tax & Statutory Calendar',
        shortLabel: 'Calendar',
        icon: Calendar,
        cellRef: 'CALENDAR!A1',
        description: 'Calendar: Monthly, quarterly, and annual Philippine BIR statutory tax filing deadlines, reminders, and return schedules.',
        formula: '=TAX_CALENDAR(FilingDate, FormType, Description, TaxPeriod)'
      },
      {
        key: 'about_app',
        label: 'Activity Lists & System Specs',
        shortLabel: 'Activity\nLists',
        icon: Activity,
        cellRef: 'ACTIVITY!A1',
        description: 'Activity Lists: Registered BIR 2303 primary and secondary business activities, transaction logs, and 2OS architectural specifications.',
        formula: '=ACTIVITY_LISTS(PSIC_Code, LineOfBusiness, TaxType, ActivityStatus)'
      }
    ]
  },

  // 2. DIRECTORY
  {
    key: 'DIRECTORY',
    label: 'Directory',
    icon: Building2,
    subTabs: [
      {
        key: 'companies',
        label: 'Entity Profiles & Branches (formerly Companies)',
        shortLabel: 'Entity',
        icon: Building2,
        cellRef: 'ENTITY!A1',
        description: 'Entity: Registered taxpayer legal entity profiles, branch codes (00000 Head Office, 00001 Branch 1), registered address, and RDO.',
        formula: '=ENTITY_PROFILES(CompanyName, TIN, BranchCode, RDO, VatStatus)'
      },
      {
        key: 'customers',
        label: 'Customers Masterlist',
        shortLabel: 'Customers',
        icon: Users,
        cellRef: 'CUSTOMERS!A1',
        description: 'Customers: Client master directory with registered trade names, customer TIN, business address, and billing terms.',
        formula: '=CUSTOMERS_TABLE(CustomerName, CustomerTIN, CustomerAddress)'
      },
      {
        key: 'providers',
        label: 'Service Providers & Vendors',
        shortLabel: 'Service\nProviders',
        icon: Truck,
        cellRef: 'PROVIDERS!A1',
        description: 'Service Providers: Registered vendors, contractors, and suppliers with TIN, branch code, address, and VAT registration.',
        formula: '=SERVICE_PROVIDERS_TABLE(ProviderName, TIN, BranchCode, Address, VAT_Status)'
      },
      {
        key: 'employees',
        label: 'Employees Masterlist',
        shortLabel: 'Employees',
        icon: UserCheck,
        cellRef: 'EMPLOYEES!A1',
        description: 'Employees: Employee directory with compensation rate, TIN, SSS, PhilHealth, Pag-IBIG numbers, and tax exemption settings.',
        formula: '=EMPLOYEES_TABLE(EmployeeCode, Name, MonthlyRate, TIN, SSS, PhilHealth, PagIBIG)'
      },
      {
        key: 'inventory_services',
        label: 'Product Inventory & Services List',
        shortLabel: 'Product/Services\nList',
        icon: FolderKanban,
        cellRef: 'INVENTORY!A1',
        description: 'Product Inventory / Services List: Catalog of merchandise goods, billable services, unit prices, SKU, and default revenue accounts.',
        formula: '=PRODUCTS_SERVICES_LIST(ItemCode, Description, UnitPrice, Type, DefaultAccount)'
      }
    ]
  },

  // 3. BOOKS OF ACCOUNTS
  {
    key: 'BOOKS OF ACCOUNTS',
    label: 'Books of Accounts',
    icon: BookOpen,
    subTabs: [
      {
        key: 'sales',
        label: 'Subsidiary Sales & Invoices Register',
        shortLabel: 'Subsidiary\nSales',
        icon: Receipt,
        isBookOfAccount: true,
        cellRef: 'SALES!A1',
        description: 'Subsidiary Sales: Detailed register of cash sales, on account sales, invoices, VATable amounts, exempt sales, and output VAT.',
        formula: '=SUBSIDIARY_SALES(InvoiceNo, CustomerTIN, CustomerName, InvoiceAmount, OutputVat)'
      },
      {
        key: 'expenses',
        label: 'Subsidiary Purchases & Expenses Book',
        shortLabel: 'Subsidiary\nPurchases',
        icon: Receipt,
        isBookOfAccount: true,
        cellRef: 'PURCHASES!A1',
        description: 'Subsidiary Purchases: Detailed register of purchases, expense vouchers, vendor TIN, input VAT claims, and payment status.',
        formula: '=SUBSIDIARY_PURCHASES(VoucherNo, ProviderTIN, ProviderName, ExpenseAmount, InputVat)'
      },
      {
        key: 'collections',
        label: 'Cash Receipts / Collections Book',
        shortLabel: 'Cash\nReceipts',
        icon: Coins,
        isBookOfAccount: true,
        cellRef: 'RECEIPTS!A1',
        description: 'Cash Receipts: Register of customer collections, payment modes, official receipt numbers, 2307 withholding tax, and deposit records.',
        formula: '=CASH_RECEIPTS(CollectionDate, InvoiceNo, CustomerName, AmountCollected, Withholding2307)'
      },
      {
        key: 'payments',
        label: 'Cash Disbursements / Payments Book',
        shortLabel: 'Cash\nDisbursements',
        icon: DollarSign,
        isBookOfAccount: true,
        cellRef: 'DISBURSEMENTS!A1',
        description: 'Cash Disbursements: Summary of check and cash disbursement vouchers, payee TIN, amount paid, and EWT deductions at source.',
        formula: '=CASH_DISBURSEMENTS(PaymentDate, VoucherNo, PayeeName, AmountPaid, WithholdingTax)'
      },
      {
        key: 'general_journal',
        label: 'General Journal Entries',
        shortLabel: 'General\nJournal',
        icon: BookOpen,
        isBookOfAccount: true,
        cellRef: 'GEN_JOURNAL!A1',
        description: 'General Journal: Chronological double-entry debits and credits from Sales, Purchases, Cash Receipts, Disbursements, and Payroll.',
        formula: '=GENERAL_JOURNAL(EntryDate, ReferenceNo, AccountTitle, Debit, Credit, Explanation)'
      },
      {
        key: 'special_entries',
        label: 'Special Journal & Adjusting Entries',
        shortLabel: 'Special\nJournal',
        icon: Layers,
        isBookOfAccount: true,
        cellRef: 'SPEC_JOURNAL!A1',
        description: 'Special Journal: Specialized accounting adjustments, depreciation journal, tax provisions, prepayments, and accrual entries.',
        formula: '=SPECIAL_JOURNAL(EntryDate, Description, DebitAccount, CreditAccount, Amount)'
      },
      {
        key: 'general_ledger',
        label: 'General Ledger T-Accounts & Balances',
        shortLabel: 'General\nLedger',
        icon: Table,
        isBookOfAccount: true,
        cellRef: 'GEN_LEDGER!A1',
        description: 'General Ledger: Aggregated running ledger balances and posting history for all balance sheet and income statement accounts.',
        formula: '=GENERAL_LEDGER(AccountCode, AccountTitle, BeginningBalance, TotalDebits, TotalCredits, EndingBalance)'
      },
      {
        key: 'special_ledger',
        label: 'Special Ledger & Subsidiary Accounts',
        shortLabel: 'Special\nLedger',
        icon: FileSpreadsheet,
        isBookOfAccount: true,
        cellRef: 'SPEC_LEDGER!A1',
        description: 'Special Ledger: Specialized subsidiary ledger breakdown for Accounts Receivable, Accounts Payable, and Withholding Tax accounts.',
        formula: '=SPECIAL_LEDGER(SubAccount, Debits, Credits, NetBalance)'
      }
    ]
  },

  // 4. OTHER TRANSACTIONS
  {
    key: 'OTHER TRANSACTIONS',
    label: 'Other Transactions',
    icon: Layers,
    subTabs: [
      {
        key: 'payroll',
        label: 'Payroll Computation & Contribution Slips',
        shortLabel: 'Payroll',
        icon: DollarSign,
        cellRef: 'PAYROLL!A1',
        description: 'Payroll: Automated employee compensation computation, SSS, PhilHealth, Pag-IBIG contributions, and withholding tax on wages.',
        formula: '=PAYROLL_COMPUTATIONS(EmployeeCode, BasicPay, Overtime, SSS, PhilHealth, PagIBIG, WithholdingTax, NetPay)'
      },
      {
        key: 'ppe',
        label: 'PPE Depreciation & Fixed Asset Register',
        shortLabel: 'PPE\nDepreciation',
        icon: TrendingUp,
        cellRef: 'PPE!A1',
        description: 'PPE Depreciation: Property, plant, and equipment asset tracking, straight-line depreciation schedules, accumulated depreciation, and net book value.',
        formula: '=PPE_DEPRECIATION(AssetCode, Description, AcquisitionCost, UsefulLife, MonthlyDepreciation, NetBookValue)'
      },
      {
        key: 'inventory_list',
        label: 'Inventory List & Stock Valuation',
        shortLabel: 'Inventory\nList',
        icon: FolderKanban,
        cellRef: 'INVENTORY_LIST!A1',
        description: 'Inventory List: Periodic inventory register, beginning inventory, purchases, cost of goods sold, and ending valuation.',
        formula: '=INVENTORY_LIST(ItemSKU, ItemName, QtyOnHand, UnitCost, TotalValuation)'
      },
      {
        key: 'bank_recon',
        label: 'Bank Reconciliation & Proof of Cash',
        shortLabel: 'Bank\nRecon',
        icon: Landmark,
        cellRef: 'BANK_RECON!A1',
        description: 'Bank Reconciliation: Monthly matching of Cash in Bank ledger vs. Bank Statement balance, Deposits in Transit (DIT), Outstanding Checks (OC), and reconciling adjusting entries.',
        formula: '=BANK_RECONCILIATION(BankEndingBalance, BookEndingBalance, DepositsInTransit, OutstandingChecks, BankCharges, InterestEarned)'
      }
    ]
  },

  // 5. FINANCIAL STATEMENTS
  {
    key: 'FINANCIAL STATEMENTS',
    label: 'Financial Statements',
    icon: Landmark,
    subTabs: [
      {
        key: 'fs_balance_sheet',
        label: 'Balance Sheet (Comparative)',
        shortLabel: 'Balance\nSheet',
        icon: Scale,
        cellRef: 'BALANCE_SHEET!A1',
        description: 'Balance Sheet: Summary of Total Assets, Liabilities, and Owner Equity with balance validation.',
        formula: '=BALANCE_SHEET(TotalAssets, TotalLiabilities, TotalEquity)'
      },
      {
        key: 'fs_income',
        label: 'Statement of Comprehensive Income (P&L)',
        shortLabel: 'Statement of\nComp. Income',
        icon: TrendingUp,
        cellRef: 'INCOME_STMT!A1',
        description: 'Statement of Comprehensive Income: Revenues, Cost of Sales, Gross Profit, Operating Expenses, and Net Comprehensive Income.',
        formula: '=COMPREHENSIVE_INCOME(GrossRevenue, CostOfSales, OperatingExpenses, NetIncome)'
      },
      {
        key: 'fs_position',
        label: 'Statement of Financial Position (PFRS Standard)',
        shortLabel: 'Statement of\nFinancial Position',
        icon: Landmark,
        cellRef: 'FIN_POSITION!A1',
        description: 'Statement of Financial Position: Current & Non-Current Assets, Current & Non-Current Liabilities, and Shareholders Equity.',
        formula: '=FINANCIAL_POSITION(CurrentAssets, NonCurrentAssets, CurrentLiabilities, NonCurrentLiabilities, Equity)'
      },
      {
        key: 'fs_equity',
        label: 'Statement of Changes in Equity',
        shortLabel: 'Statement of\nChanges in Equity',
        icon: Layers,
        cellRef: 'EQUITY!A1',
        description: 'Statement of Changes in Equity: Beginning equity, capital contributions, net income, dividends/drawings, and ending equity.',
        formula: '=CHANGES_IN_EQUITY(BeginningCapital, Additions, NetIncome, Drawings, EndingCapital)'
      },
      {
        key: 'fs_cashflows',
        label: 'Statement of Cash Flows (Indirect Method)',
        shortLabel: 'Statement of\nCash Flows',
        icon: Coins,
        cellRef: 'CASH_FLOWS!A1',
        description: 'Statement of Cash Flows: Cash flows from Operating, Investing, and Financing activities, and ending cash reconciliations.',
        formula: '=CASH_FLOWS(OperatingActivities, InvestingActivities, FinancingActivities, NetCashFlow)'
      },
      {
        key: 'fs_notes',
        label: 'Notes to Financial Statements',
        shortLabel: 'Notes to\nFS',
        icon: FileText,
        cellRef: 'NOTES_FS!A1',
        description: 'Notes to FS: Summary of significant accounting policies, revenue recognition, tax contingencies, and breakdown schedules.',
        formula: '=NOTES_TO_FS(NoteNumber, Title, BreakdownTable, AccountingPolicy)'
      }
    ]
  },

  // 6. BIR COMPUTATIONS
  {
    key: 'BIR COMPUTATIONS',
    label: 'BIR Computations',
    icon: ShieldCheck,
    subTabs: [
      {
        key: 'bir_2316',
        label: 'Withholding Tax Compensation (BIR 1601-C & 2316)',
        shortLabel: 'Withholding Tax\nCompensation',
        icon: FileCheck,
        cellRef: 'WTC!A1',
        description: 'Withholding Tax Compensation: Computation of monthly compensation taxes (BIR Form 1601-C) and annual employee Certificate 2316.',
        formula: '=BIR_1601C_2316(GrossCompensation, NonTaxableBenefits, TaxableCompensation, TaxWithheld)'
      },
      {
        key: 'cwt_providers',
        label: 'Expanded Withholding Tax (BIR 1601-EQ & 2307)',
        shortLabel: 'Expanded\nWithholding Tax',
        icon: FileCheck2,
        cellRef: 'EWT!A1',
        description: 'Expanded Withholding Tax: EWT schedule on payments to vendors/lessors/professionals (Form 1601-EQ) and 2307 Certificates.',
        formula: '=BIR_1601EQ_2307(PayeeTIN, ATCCode, TaxBase, TaxRate, WithheldAmount)'
      },
      {
        key: 'tax_reports',
        label: 'Business Tax (VAT 2550Q / Percentage Tax 2551Q)',
        shortLabel: 'Business\nTax',
        icon: ShieldCheck,
        cellRef: 'BUSINESS_TAX!A1',
        description: 'Business Tax: Quarterly Value-Added Tax (BIR 2550Q) Output vs Input VAT computation or 1%/3% Percentage Tax (BIR 2551Q).',
        formula: '=BUSINESS_TAX(OutputVAT, InputVAT, VATPayable, PercentageTax)'
      },
      {
        key: 'income_tax',
        label: 'Income Tax Provision (BIR 1701Q / 1702Q / 1702-RT)',
        shortLabel: 'Income\nTax',
        icon: Calculator,
        cellRef: 'INCOME_TAX!A1',
        description: 'Income Tax: Corporate & Individual quarterly and annual income tax calculation, Regular Corporate Income Tax (20%/25%) vs MCIT (1%/2%).',
        formula: '=INCOME_TAX(GrossTaxableIncome, AllowableDeductions, TaxableIncome, RCIT, MCIT, TaxDue)'
      },
      {
        key: 'bir_slsp',
        label: 'Summary List of Sales and Purchases (SLSP)',
        shortLabel: 'SLSP',
        icon: FileCode,
        cellRef: 'SLSP!A1',
        description: 'SLSP: BIR eSubmission compliant Summary List of Sales (SLS) and Summary List of Purchases (SLP) export modules.',
        formula: '=BIR_SLSP(CustomerTIN, VendorTIN, GrossSales, GrossPurchases, OutputVAT, InputVAT)'
      },
      {
        key: 'bir_sawt',
        label: 'Summary Alphalist of Withholding Taxes (SAWT)',
        shortLabel: 'SAWT',
        icon: FileSpreadsheet,
        cellRef: 'SAWT!A1',
        description: 'SAWT: Quarterly Schedule of Withholding Agents of Income Payments under BIR Form 1702Q and 2550Q.',
        formula: '=BIR_SAWT(WithholdingAgentTIN, ATC, IncomePayment, TaxWithheld)'
      },
      {
        key: 'bir_qap',
        label: 'Quarterly Alphabetical List of Payees (QAP)',
        shortLabel: 'QAP',
        icon: FileText,
        cellRef: 'QAP!A1',
        description: 'QAP: Alphabetical list of payees subjected to expanded withholding tax attached to quarterly BIR Form 1601-EQ.',
        formula: '=BIR_QAP(PayeeTIN, PayeeName, ATC, NatureOfPayment, Amount, TaxWithheld)'
      },
      {
        key: 'bir_alphalist',
        label: 'Alphalist of Employees (Annual Schedule)',
        shortLabel: 'Alphalist of\nEmployees',
        icon: Users,
        cellRef: 'ALPHALIST!A1',
        description: 'Alphalist of Employees: Year-end alphabetical list of employees (Schedule 7.1, 7.3, 7.4) for BIR Form 1604-C submission.',
        formula: '=BIR_ALPHALIST_EMPLOYEES(EmployeeTIN, Name, GrossPay, TaxWithheld, YearEndAdjustment)'
      }
    ]
  }
];

// Helper to get tab details
export function getTabInfo(tabKey: string): RibbonSubTab {
  for (const cat of RIBBON_CATEGORIES) {
    const found = cat.subTabs.find(st => st.key === tabKey);
    if (found) return found;
  }
  return {
    key: tabKey,
    label: tabKey.replace(/_/g, ' ').toUpperCase(),
    shortLabel: tabKey.replace(/_/g, ' '),
    icon: Layers,
    cellRef: `${tabKey.toUpperCase()}!A1`,
    description: `${tabKey.replace(/_/g, ' ')}: Transaction and ledger module.`,
    formula: `=SHEET("${tabKey}")`
  };
}

export function getCategoryForTab(tabKey: string): RibbonCategoryKey {
  // Check exact match
  for (const cat of RIBBON_CATEGORIES) {
    if (cat.subTabs.some(st => st.key === tabKey)) {
      return cat.key;
    }
  }

  // Check aliases
  if (['dashboard', 'reports', 'reports_turnovers', 'reports_horizontal', 'reports_vertical', 'reports_ratios', 'tax_calendar', 'about_app', 'account_titles'].includes(tabKey)) return 'HOME';
  if (['companies', 'customers', 'providers', 'employees', 'related_parties', 'inventory_services'].includes(tabKey)) return 'DIRECTORY';
  if (['sales', 'expenses', 'collections', 'payments', 'general_journal', 'special_entries', 'general_ledger', 'special_ledger'].includes(tabKey)) return 'BOOKS OF ACCOUNTS';
  if (['payroll', 'ppe', 'inventory_list', 'bank_recon', 'contribution_tables'].includes(tabKey)) return 'OTHER TRANSACTIONS';
  if (['fs_balance_sheet', 'fs_income', 'fs_position', 'fs_equity', 'fs_cashflows', 'fs_notes'].includes(tabKey)) return 'FINANCIAL STATEMENTS';
  if (['tax_reports', 'income_tax', 'cwt_customers', 'cwt_providers', 'bir_2316', 'bir_slsp', 'bir_qap', 'bir_sawt', 'bir_alphalist'].includes(tabKey)) return 'BIR COMPUTATIONS';

  return 'HOME';
}
