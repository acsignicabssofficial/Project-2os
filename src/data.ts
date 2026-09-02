import { 
  Company, 
  Customer, 
  Contractor, 
  Sale, 
  Collection, 
  Expense, 
  Payment, 
  PPEAsset, 
  AccountTitle, 
  SpecialEntry, 
  IncomeTaxRecord 
} from './types';

export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_CONTRACTORS: Contractor[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_COLLECTIONS: Collection[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_PPE: PPEAsset[] = [];

export const INITIAL_ACCOUNT_TITLES: AccountTitle[] = [
  { id: 1, code: "1010", title: "Cash and Cash Equivalents", type: "Asset", category: "Current Assets", description: "Cash on hand and bank deposits" },
  { id: 2, code: "1020", title: "Accounts Receivable", type: "Asset", category: "Current Assets", description: "Trade receivables from clients" },
  { id: 3, code: "1030", title: "Input VAT", type: "Asset", category: "Current Assets", description: "12% Creditable Input VAT from purchases" },
  { id: 4, code: "1040", title: "Creditable Withholding Tax (BIR 2307)", type: "Asset", category: "Current Assets", description: "Prepaid income tax withheld by customers" },
  { id: 5, code: "1050", title: "Prepaid Expenses", type: "Asset", category: "Current Assets", description: "Advance payments for rent, insurance, etc." },
  { id: 6, code: "1510", title: "Property, Plant & Equipment", type: "Asset", category: "Non-Current Assets", description: "Office furniture, computers, vehicles, machineries" },
  { id: 7, code: "1520", title: "Accumulated Depreciation", type: "Asset", category: "Non-Current Assets", description: "Contra-asset for cumulative depreciation" },
  { id: 8, code: "2010", title: "Accounts Payable", type: "Liability", category: "Current Liabilities", description: "Trade payables to suppliers and service providers" },
  { id: 9, code: "2020", title: "Output VAT Payable", type: "Liability", category: "Current Liabilities", description: "12% Output VAT collected on sales" },
  { id: 10, code: "2030", title: "Expanded Withholding Tax Payable (BIR 0619-E)", type: "Liability", category: "Current Liabilities", description: "Withholding tax payable to BIR for vendors" },
  { id: 11, code: "2040", title: "Income Tax Payable (BIR 1702/1701)", type: "Liability", category: "Current Liabilities", description: "Income tax payable provision due to BIR" },
  { id: 22, code: "2035", title: "Withholding Tax Payable - Compensation (BIR 1601-C)", type: "Liability", category: "Current Liabilities", description: "Withholding tax deducted from employee payroll" },
  { id: 23, code: "2041", title: "SSS Premium Payable", type: "Liability", category: "Current Liabilities", description: "SSS contributions payable to Social Security System (EE & ER Share)" },
  { id: 24, code: "2042", title: "PhilHealth Premium Payable", type: "Liability", category: "Current Liabilities", description: "PhilHealth premiums payable to PHIC (EE & ER Share)" },
  { id: 25, code: "2043", title: "Pag-IBIG Premium Payable", type: "Liability", category: "Current Liabilities", description: "HDMF contributions payable to Pag-IBIG Fund (EE & ER Share)" },
  { id: 26, code: "2050", title: "Other Employee Payables & Deductions", type: "Liability", category: "Current Liabilities", description: "Other employee payroll deductions and advances" },
  { id: 12, code: "3010", title: "Capital Stock / Owner's Equity", type: "Equity", category: "Equity", description: "Contributed capital by stockholders or owner" },
  { id: 13, code: "3020", title: "Retained Earnings", type: "Equity", category: "Equity", description: "Cumulative net earnings retained in business" },
  { id: 14, code: "4010", title: "Sales / Service Revenue", type: "Revenue", category: "Operating Revenue", description: "Gross revenues from sales and services" },
  { id: 15, code: "4015", title: "Sales Discounts", type: "Revenue", category: "Operating Revenue", description: "Contra-revenue: trade/cash discounts granted to customers" },
  { id: 16, code: "4020", title: "Other Operating Income", type: "Revenue", category: "Operating Revenue", description: "Miscellaneous income and gains" },
  { id: 17, code: "6010", title: "Salaries, Wages & Benefits", type: "Expense", category: "Operating Expenses", description: "Employee gross compensation and allowances" },
  { id: 27, code: "6015", title: "Employer SSS Contribution Expense", type: "Expense", category: "Operating Expenses", description: "Employer share of SSS & EC contributions" },
  { id: 28, code: "6016", title: "Employer PhilHealth Contribution Expense", type: "Expense", category: "Operating Expenses", description: "Employer share of PhilHealth premiums" },
  { id: 29, code: "6017", title: "Employer Pag-IBIG Contribution Expense", type: "Expense", category: "Operating Expenses", description: "Employer share of Pag-IBIG HDMF contributions" },
  { id: 18, code: "6020", title: "Rent Expense", type: "Expense", category: "Operating Expenses", description: "Office and warehouse space rental" },
  { id: 19, code: "6030", title: "Utilities Expense", type: "Expense", category: "Operating Expenses", description: "Electricity, water, internet, telephone" },
  { id: 20, code: "6080", title: "Depreciation Expense", type: "Expense", category: "Operating Expenses", description: "Periodic depreciation of fixed assets" },
  { id: 21, code: "7010", title: "Provision for Income Tax Expense", type: "Expense", category: "Tax Provision", description: "Income tax expense provision" }
];

export const INITIAL_SPECIAL_ENTRIES: SpecialEntry[] = [];

export const INITIAL_INCOME_TAX_RECORDS: IncomeTaxRecord[] = [];

export const INITIAL_EMPLOYEES: any[] = [
  {
    id: 1,
    company_name: 'Active Workspace',
    employee_id: 'EMP-001',
    full_name: 'Juan Dela Cruz',
    tin: '123-456-789-00000',
    position: 'Senior Accountant',
    daily_rate: 1000,
    monthly_rate: 25000,
    sss_no: '34-1234567-8',
    philhealth_no: '12-345678901-2',
    pagibig_no: '1212-3434-5656',
    tax_status: 'Single',
    subject_to_contributions: true
  },
  {
    id: 2,
    company_name: 'Active Workspace',
    employee_id: 'EMP-002',
    full_name: 'Maria Clara Santos',
    tin: '987-654-321-00000',
    position: 'Operations Manager',
    daily_rate: 1400,
    monthly_rate: 35000,
    sss_no: '34-9876543-1',
    philhealth_no: '98-765432109-8',
    pagibig_no: '9898-7676-5454',
    tax_status: 'Married',
    subject_to_contributions: true
  }
];

export const INITIAL_PAYROLL_RECORDS: any[] = [
  {
    id: 1,
    company_name: 'Active Workspace',
    employee_id: 'EMP-001',
    full_name: 'Juan Dela Cruz',
    payroll_period: '2026-01',
    subject_to_contributions: true,
    basic_pay: 25000,
    overtime_pay: 2500,
    allowances: 1000,
    gross_pay: 28500,
    sss_deduction: 1237.50,
    philhealth_deduction: 625,
    pagibig_deduction: 200,
    withholding_tax: 1500,
    other_deductions: 0,
    total_deductions: 3562.50,
    net_pay: 24937.50,
    status: 'Processed'
  }
];

export const INITIAL_SSS_TABLE: any[] = [
  { id: 1, min_salary: 0, max_salary: 4249.99, msc: 4000, ee_share: 180.00, er_share: 380.00 },
  { id: 2, min_salary: 4250, max_salary: 4749.99, msc: 4500, ee_share: 202.50, er_share: 427.50 },
  { id: 3, min_salary: 4750, max_salary: 5249.99, msc: 5000, ee_share: 225.00, er_share: 475.00 },
  { id: 4, min_salary: 5250, max_salary: 5749.99, msc: 5500, ee_share: 247.50, er_share: 522.50 },
  { id: 5, min_salary: 5750, max_salary: 6249.99, msc: 6000, ee_share: 270.00, er_share: 570.00 },
  { id: 6, min_salary: 6250, max_salary: 6749.99, msc: 6500, ee_share: 292.50, er_share: 617.50 },
  { id: 7, min_salary: 6750, max_salary: 7249.99, msc: 7000, ee_share: 315.00, er_share: 665.00 },
  { id: 8, min_salary: 7250, max_salary: 7749.99, msc: 7500, ee_share: 337.50, er_share: 712.50 },
  { id: 9, min_salary: 7750, max_salary: 8249.99, msc: 8000, ee_share: 360.00, er_share: 760.00 },
  { id: 10, min_salary: 8250, max_salary: 8749.99, msc: 8500, ee_share: 382.50, er_share: 807.50 },
  { id: 11, min_salary: 8750, max_salary: 9249.99, msc: 9000, ee_share: 405.00, er_share: 855.00 },
  { id: 12, min_salary: 9250, max_salary: 9749.99, msc: 9500, ee_share: 427.50, er_share: 902.50 },
  { id: 13, min_salary: 9750, max_salary: 10249.99, msc: 10000, ee_share: 450.00, er_share: 950.00 },
  { id: 14, min_salary: 10250, max_salary: 14749.99, msc: 12500, ee_share: 562.50, er_share: 1187.50 },
  { id: 15, min_salary: 14750, max_salary: 19749.99, msc: 17500, ee_share: 787.50, er_share: 1662.50 },
  { id: 16, min_salary: 19750, max_salary: 24749.99, msc: 22500, ee_share: 1012.50, er_share: 2137.50 },
  { id: 17, min_salary: 24750, max_salary: 29749.99, msc: 27500, ee_share: 1237.50, er_share: 2612.50 },
  { id: 18, min_salary: 29750, max_salary: 999999, msc: 30000, ee_share: 1350.00, er_share: 2850.00 },
];

export const INITIAL_PHILHEALTH_CONFIG = {
  premium_rate: 0.05,
  ee_share_percent: 0.50,
  min_monthly_salary: 10000,
  max_monthly_salary: 100000
};

export const INITIAL_PAGIBIG_CONFIG = {
  ee_rate: 0.02,
  er_rate: 0.02,
  max_salary_cap: 10000,
  max_ee_contribution: 200
};

export const INITIAL_WITHHOLDING_TAX_TABLE: any[] = [
  // ANNUAL TAX TABLE (BIR TRAIN Law 2023 - Present)
  { id: 1, period: 'Annual', min_income: 0, max_income: 250000, base_tax: 0, excess_rate: 0 },
  { id: 2, period: 'Annual', min_income: 250000.01, max_income: 400000, base_tax: 0, excess_rate: 0.15 },
  { id: 3, period: 'Annual', min_income: 400000.01, max_income: 800000, base_tax: 22500, excess_rate: 0.20 },
  { id: 4, period: 'Annual', min_income: 800000.01, max_income: 2000000, base_tax: 102500, excess_rate: 0.25 },
  { id: 5, period: 'Annual', min_income: 2000000.01, max_income: 8000000, base_tax: 402500, excess_rate: 0.30 },
  { id: 6, period: 'Annual', min_income: 8000000.01, max_income: 99999999, base_tax: 2202500, excess_rate: 0.35 },

  // MONTHLY WITHHOLDING TAX TABLE (BIR TRAIN Law 2023 - Present)
  { id: 7, period: 'Monthly', min_income: 0, max_income: 20833.33, base_tax: 0, excess_rate: 0 },
  { id: 8, period: 'Monthly', min_income: 20833.34, max_income: 33333.33, base_tax: 0, excess_rate: 0.15 },
  { id: 9, period: 'Monthly', min_income: 33333.34, max_income: 66666.67, base_tax: 1875.00, excess_rate: 0.20 },
  { id: 10, period: 'Monthly', min_income: 66666.68, max_income: 166666.67, base_tax: 8541.67, excess_rate: 0.25 },
  { id: 11, period: 'Monthly', min_income: 166666.68, max_income: 666666.67, base_tax: 33541.67, excess_rate: 0.30 },
  { id: 12, period: 'Monthly', min_income: 666666.68, max_income: 9999999, base_tax: 183541.67, excess_rate: 0.35 }
];
