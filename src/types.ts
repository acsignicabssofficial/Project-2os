/**
 * Comprehensive Type Definitions for 2OS Accounting & BIR System
 * Combining user's exact 10-table schema guide with all legacy helper and alias properties.
 */

export interface Company {
  id: number;
  company_name?: string;
  last_name?: string;
  first_name?: string;
  middle_name?: string;
  suffix?: string;
  civil_status?: string;
  birthday_or_incorporation_date?: string;
  personal_address?: string;
  entity_type?: string;
  company_tin?: string;
  tin_branch_code?: string;
  rdo?: string;
  rdo_code?: string;
  trade_name?: string;
  line_of_business?: string;
  company_address?: string;
  company_email?: string;
  company_contact?: string;
  client_status?: string;
  date_of_entry?: string;
  // Compatibility properties
  registered_address?: string;
  business_address?: string;
  secondary_email?: string;
  registration_fee?: boolean | string;
  income_tax?: boolean | string;
  vat_or_non_vat?: string;
  form_0619f?: boolean | string;
  withholding_expanded?: boolean | string;
  withholding_compensation?: boolean | string;
  withholding_fringe_benefit?: boolean | string;
  withholding_final_comp?: boolean | string;
  service_bookkeeping?: boolean | string;
  service_tax_filing?: boolean | string;
  service_bir_attachments?: boolean | string;
  branches?: CompanyBranch[];
}

export interface ActivityList {
  id: number;
  company_tin?: string;
  tin_branch_code?: string;
  vat_type?: string;
  Registration_Fee?: string;
  Income_Tax?: string;
  Final_Withholding_Tax?: string;
  Expanded_Withholding_Tax?: string;
  Withholding_on_Compensation?: string;
  Fringe_Benefits_Tax?: string;
  Related_party_transactions?: string;
  Monthly_documentary_stamp?: string;
}

export interface OtherParty {
  id: number;
  company_name?: string;
  trade_name?: string;
  tin_number?: string;
  tin_branch_code?: string;
  entity_type?: string;
  vat_type?: string;
  address?: string;
  contact_number?: string;
  contact_person?: string;
  email?: string;
  // Compatibility properties
  registered_name?: string;
  customer_name?: string;
  client_TIN?: string;
  customer_tin?: string;
  tax_type?: string;
  client_Address?: string;
  customer_address?: string;
  phone?: string;
  service_provider_name?: string;
  service_provider_TIN?: string;
  sp_tin?: string;
  sp_branch_code?: string;
  vat_status?: string;
  service_provider_Address?: string;
  sp_address?: string;
  atc_code?: string;
}

export type Customer = OtherParty;
export type Contractor = OtherParty;
export type ServiceProvider = OtherParty;

export interface ChartOfAccounts {
  id: number;
  account_code?: string;
  account_title?: string;
  description?: string;
  account_type?: string;
  account_sub_type?: string;
  debit_balance?: number;
  credit_balance?: number;
  current_balance?: number;
  // Compatibility
  code?: string;
  title?: string;
  type?: string;
  normal_balance?: string;
  category?: string;
  initial_balance?: number;
  is_active?: boolean;
  isCustom?: boolean;
  financial_statement_classification?: string;
  company_name?: string;
}

export interface AccountTitle extends ChartOfAccounts {}

export interface Payroll {
  id: number;
  company_name?: string;
  employee_code?: string;
  employee_id?: number | string;
  last_name?: string;
  first_name?: string;
  full_name?: string;
  tin?: string;
  sss_no?: string;
  philhealth_no?: string;
  pagibig_no?: string;
  position?: string;
  monthly_rate?: number;
  subject_to_contributions?: boolean;
  tax_status?: string;
  // Compatibility
  middle_name?: string;
  semi_monthly_rate?: number;
  daily_rate?: number;
  employment_status?: string;
  date_hired?: string;
}

export interface Employee extends Payroll {}

export interface Sale {
  id: number;
  invoice_number?: string;
  tin_branch_code?: string;
  customer_name?: string;
  customer_address?: string;
  nonvat_or_vat?: string;
  invoice_type?: string;
  invoice_date?: string;
  particulars?: string;
  invoice_amount?: number;
  vat_exempt_amount?: number;
  discounts?: number;
  vatable_amount?: number;
  output_vat?: number;
  ewt_amount?: number;
  total_amount_due?: number;
  sales_status?: string;
  mode_of_payment?: string;
  cheque_date?: string;
  cheque_number?: string;
  collection_status?: string;
  // Compatibility aliases
  company_name?: string;
  registered_name?: string;
  client_TIN?: string;
  customer_tin?: string;
  client_Address?: string;
  issue_date?: string;
  description?: string;
  payment_type?: string;
  qty?: number;
  unit_price?: number;
  amount?: number;
  vatable_sales?: number;
  vat?: number;
  zero_rated?: number;
  vat_exempt?: number;
  total_sale_vat_inclusive?: number;
  less_vat?: number;
  amount_net_of_vat?: number;
  less_discount?: number;
  add_vat?: number;
  less_withholding_tax?: number;
  withholding_2307?: number;
  down_payment?: number;
  is_cancelled?: boolean;
  cancel_reason?: string;
  cancel_date?: string;
}

export interface Expense {
  id: number;
  tin_number?: string;
  tin_branch_code?: string;
  service_provider_name?: string;
  sp_address?: string;
  service_provider_Address?: string;
  nonvat_or_vat?: string;
  invoice_type?: string;
  expense_date?: string;
  voucher_number?: string;
  invoice_number?: string;
  expense_type?: string;
  expense_invoice_amount?: number;
  nonvat_expense_amount?: number;
  discounts?: number;
  vatable_expense_amount?: number;
  vat_input_amount?: number;
  ewt_amount?: number;
  total_amount_due?: number;
  expense_status?: string;
  mode_of_payment?: string;
  payment_type?: string;
  unit_price?: number;
  less_discount?: number;
  add_vat?: number;
  is_cancelled?: boolean;
  cheque_date?: string;
  cheque_number?: string;
  payment_status?: string;
  total_expenses_vat_inclusive?: number;
  less_vat?: number;
  // Compatibility aliases
  company_name?: string;
  registered_name?: string;
  service_provider_TIN?: string;
  sp_tin?: string;
  voucher_no?: string;
  issue_date?: string;
  description?: string;
  expense_category?: string;
  atc_code?: string;
  qty?: number;
  unit_cost?: number;
  gross_amount?: number;
  vatable_purchases?: number;
  input_vat?: number;
  vat_exempt_purchases?: number;
  zero_rated_purchases?: number;
  net_of_vat?: number;
  ewt_rate?: number;
  net_payment?: number;
  vat?: number;
  vatable_expense?: number;
  withholding_2307_2306?: number;
  amount?: number;
  amount_net_of_vat?: number;
  less_withholding_tax?: number;
  zero_rated?: number;
  vat_exempt?: number;
}

export interface Collection {
  id: number;
  customer_tin?: string;
  client_TIN?: string;
  invoice_number?: string;
  invoice_amount?: number;
  customer_name?: string;
  amount_collected?: number;
  amount_withheld_2307?: number;
  check_number?: string;
  bank_name?: string;
  is_cancelled?: boolean;
  // Compatibility
  company_name?: string;
  receipt_number?: string;
  collection_date?: string;
  total_collected?: number;
  wtax_2307?: number;
  notes?: string;
  entry_number?: string;
  registered_name?: string;
  balance?: number;
}

export interface Payment {
  id: number;
  sp_tin?: string;
  voucher_number?: string;
  service_provider_name?: string;
  payment_date?: string;
  amount_paid?: number;
  voucher_amount?: number;
  invoice_amount?: number;
  withholding_tax_2307?: number;
  check_number?: string;
  bank_account?: string;
  is_cancelled?: boolean;
  // Compatibility
  company_name?: string;
  payee_name?: string;
  payee_tin?: string;
  service_provider_TIN?: string;
  expense_reference?: string;
  cash_disbursed?: number;
  check_disbursed?: number;
  bank_name?: string;
  gross_amount?: number;
  ewt_withheld?: number;
  net_paid?: number;
  notes?: string;
  registered_name?: string;
  balance?: number;
  entry_number?: string;
}

export interface GeneralJournal {
  id: number;
  entry_date?: string;
  date?: string;
  reference_no?: string;
  ref_no?: string;
  ref_type?: string;
  source_module?: string;
  account_code?: string;
  account_title?: string;
  debit?: any;
  credit?: any;
  debits?: any;
  credits?: any;
  explanation?: string;
  description?: string;
  company_name?: string;
  entry_number?: string;
  entry_no?: string;
  voucher_no?: string;
  entry_type?: string;
}

export type JournalEntry = GeneralJournal;

export interface CompanyBranch {
  id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  company_id?: number | string;
  rdo_code?: string;
  is_head_office?: boolean;
  contact_number?: string;
  email?: string;
}

export interface PPEAsset {
  id: number;
  asset_tag?: string;
  asset_name: string;
  acquisition_date: string;
  acquisition_cost: number;
  net_book_value: number;
  category?: string;
  salvage_value?: number;
  useful_life_years?: number;
  depreciation_method?: string;
  accumulated_depreciation?: number;
  status?: string;
  asset_code?: string;
  company_name?: string;
  annual_depreciation?: number;
  monthly_depreciation?: number;
  book_value?: number;
}

export interface IncomeTaxRecord {
  id: number;
  quarter?: string;
  tax_due?: number;
  company_name?: string;
  tax_year?: number;
  period?: string;
  posted_entry_no?: string;
  entity_type?: string;
  tax_regime?: string;
  deduction_method?: string;
  taxable_income?: number;
  gross_income?: number;
  allowable_deductions?: number;
  computed_tax_due?: number;
  less_creditable_tax_2307?: number;
  less_quarterly_tax_payments?: number;
  net_tax_payable?: number;
  is_posted?: boolean;
  created_at?: string;
}

export interface SpecialEntryLine {
  id?: string | number;
  type: string;
  account_code: string;
  account_title: string;
  amount: number;
}

export interface SpecialEntry {
  id: number;
  jv_number?: string;
  lines?: SpecialEntryLine[];
  voucher_no?: string;
  description?: string;
  entry_type?: string;
  entry_date?: string;
  entry_number?: string;
  company_name?: string;
  created_at?: string;
}

export interface SssBracket {
  id?: number;
  min?: number;
  max?: number;
  credit?: number;
  ee?: number;
  er?: number;
  msc?: number;
  min_salary?: number;
  max_salary?: number;
  ee_share?: number;
  er_share?: number;
}

export interface PhilHealthConfig {
  id?: number;
  rate: number;
  min_monthly_salary?: number;
  max_monthly_salary?: number;
  premium_rate?: number;
  ee_share_percent?: number;
}

export interface PagIbigConfig {
  id?: number;
  max: number;
  rate: number;
  max_salary_cap?: number;
  ee_rate?: number;
  er_rate?: number;
  max_ee_contribution?: number;
}

export interface TaxBracket {
  id?: number;
  limit?: number;
  base?: number;
  rate?: number;
  period?: string;
  min_income?: number;
  max_income?: number;
  base_tax?: number;
  excess_rate?: number;
}

export interface PayrollRecord {
  id: number;
  payroll_period: string;
  employee_id: number | string;
  employee_name?: string;
  full_name?: string;
  gross_pay: number;
  total_statutory?: number;
  withholding_tax: number;
  net_pay: number;
  company_name?: string;
  created_at?: string;
  basic_pay?: number;
  thirteenth_month_pay?: number;
  sss_deduction?: number;
  philhealth_deduction?: number;
  pagibig_deduction?: number;
  other_deductions?: number;
  taxable_basic?: number;
  taxable_thirteenth_month?: number;
  item51b_val?: number;
  taxable_overtime?: number;
  tax_year?: number;
  period_from?: string;
  period_to?: string;
  subject_to_contributions?: boolean;
  is_mwe?: boolean;
  statutory_mwe_day?: number;
  statutory_mwe_month?: number;
  is_main_employer?: boolean;
  [key: string]: any;
}

export interface Certificate2307 {
  id: number;
  quarter: string;
  tax_withheld: number;
}

export interface NoteToFS {
  id: number;
  note_number: string;
  title: string;
  content: string;
}

export interface BankReconTransaction {
  id: number;
  company_name?: string;
  bank_name: string;
  account_number: string;
  date: string;
  type: 'deposit_in_transit' | 'outstanding_check' | 'bank_service_charge' | 'interest_income' | 'nsf_check' | 'book_error' | 'bank_error';
  reference_no: string;
  payee_payer: string;
  amount: number;
  cleared: boolean;
  notes?: string;
}

export interface BankReconSession {
  id: number;
  company_name: string;
  bank_name: string;
  account_number: string;
  statement_date: string;
  bank_statement_ending_balance: number;
  book_ending_balance: number;
  status: 'Draft' | 'Reconciled' | 'Posted';
  reconciliation_notes?: string;
}
