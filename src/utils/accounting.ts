/**
 * Single Source of Truth for BIR Tax Math & Double-Entry Accounting Calculations
 */

import { Sale, Expense, Collection, Payment, SpecialEntry, AccountTitle, PPEAsset, PayrollRecord, JournalEntry, UniformBookRecord } from '../types';

export interface SalesCalculationInput {
  qty: number;
  unit_price: number;
  zero_rated?: number;
  vat_exempt?: number;
  less_discount?: number;
  less_withholding_tax?: number;
  is_vat_registered?: boolean;
}

export interface SalesCalculationResult {
  amount: number; // qty * unit_price
  total_sale_vat_inclusive: number;
  vatable_sales: number;
  vat: number;
  zero_rated: number;
  vat_exempt: number;
  less_vat: number;
  amount_net_of_vat: number;
  less_discount: number;
  add_vat: number;
  less_withholding_tax: number;
  total_amount_due: number;
}

export function computeSaleFormulas(input: SalesCalculationInput): SalesCalculationResult {
  const qty = Number(input.qty) || 0;
  const unitPrice = Number(input.unit_price) || 0;
  const amount = Math.round(qty * unitPrice * 100) / 100;
  
  const total_sale_vat_inclusive = amount;
  const zero_rated = Number(input.zero_rated) || 0;
  const vat_exempt = Number(input.vat_exempt) || 0;
  const less_discount = Number(input.less_discount) || 0;
  const less_withholding_tax = Number(input.less_withholding_tax) || 0;
  const isVat = input.is_vat_registered !== false; // Default true

  let vatable_sales = 0;
  let vat = 0;

  if (isVat) {
    const baseSubjectToVat = Math.max(0, total_sale_vat_inclusive - zero_rated - vat_exempt);
    vatable_sales = Math.round((baseSubjectToVat / 1.12) * 100) / 100;
    vat = Math.round((baseSubjectToVat - vatable_sales) * 100) / 100;
  } else {
    vatable_sales = 0;
    vat = 0;
  }

  const less_vat = vat;
  const amount_net_of_vat = Math.round((total_sale_vat_inclusive - vat) * 100) / 100;
  const add_vat = vat;
  const total_amount_due = Math.round((amount_net_of_vat - less_discount + add_vat - less_withholding_tax) * 100) / 100;

  return {
    amount,
    total_sale_vat_inclusive,
    vatable_sales,
    vat,
    zero_rated,
    vat_exempt,
    less_vat,
    amount_net_of_vat,
    less_discount,
    add_vat,
    less_withholding_tax,
    total_amount_due
  };
}

export interface ExpenseCalculationInput {
  qty: number;
  unit_price: number;
  zero_rated?: number;
  vat_exempt?: number;
  less_discount?: number;
  less_withholding_tax?: number;
  is_vat_registered?: boolean;
}

export interface ExpenseCalculationResult {
  amount: number;
  total_expenses_vat_inclusive: number;
  vatable_expense: number;
  vat: number;
  zero_rated: number;
  vat_exempt: number;
  less_vat: number;
  amount_net_of_vat: number;
  less_discount: number;
  add_vat: number;
  less_withholding_tax: number;
  total_amount_due: number;
}

export function computeExpenseFormulas(input: ExpenseCalculationInput): ExpenseCalculationResult {
  const qty = Number(input.qty) || 0;
  const unitPrice = Number(input.unit_price) || 0;
  const amount = Math.round(qty * unitPrice * 100) / 100;

  const total_expenses_vat_inclusive = amount;
  const zero_rated = Number(input.zero_rated) || 0;
  const vat_exempt = Number(input.vat_exempt) || 0;
  const less_discount = Number(input.less_discount) || 0;
  const less_withholding_tax = Number(input.less_withholding_tax) || 0;
  const isVat = input.is_vat_registered !== false;

  let vatable_expense = 0;
  let vat = 0;

  if (isVat) {
    const baseSubjectToVat = Math.max(0, total_expenses_vat_inclusive - zero_rated - vat_exempt);
    vatable_expense = Math.round((baseSubjectToVat / 1.12) * 100) / 100;
    vat = Math.round((baseSubjectToVat - vatable_expense) * 100) / 100;
  } else {
    vatable_expense = 0;
    vat = 0;
  }

  const less_vat = vat;
  const amount_net_of_vat = Math.round((total_expenses_vat_inclusive - vat) * 100) / 100;
  const add_vat = vat;
  const total_amount_due = Math.round((amount_net_of_vat - less_discount + add_vat - less_withholding_tax) * 100) / 100;

  return {
    amount,
    total_expenses_vat_inclusive,
    vatable_expense,
    vat,
    zero_rated,
    vat_exempt,
    less_vat,
    amount_net_of_vat,
    less_discount,
    add_vat,
    less_withholding_tax,
    total_amount_due
  };
}

/**
 * Philippine Graduated Income Tax Table (TRAIN Law / BIR 2023 - 2026 Table)
 */
export function computeGraduatedIndividualTax(taxableIncome: number): number {
  if (taxableIncome <= 250000) {
    return 0;
  } else if (taxableIncome <= 400000) {
    return (taxableIncome - 250000) * 0.15;
  } else if (taxableIncome <= 800000) {
    return 22500 + (taxableIncome - 400000) * 0.20;
  } else if (taxableIncome <= 2000000) {
    return 102500 + (taxableIncome - 800000) * 0.25;
  } else if (taxableIncome <= 8000000) {
    return 402500 + (taxableIncome - 2000000) * 0.30;
  } else {
    return 2202500 + (taxableIncome - 8000000) * 0.35;
  }
}

/**
 * Income Tax Computation Logic Engine
 */
export interface IncomeTaxComputeInput {
  entity_type: string; // 'SOLE PROPRIETOR', 'PARTNERSHIP', 'CORPORATION'
  tax_regime: string; // 'Graduated Tax Table', '8% Flat Tax', 'RCIT 20% (Small Corp)', 'RCIT 25%', 'MCIT 2%'
  deduction_method: 'Itemized' | 'OSD 40%';
  gross_sales: number;
  cost_of_sales?: number;
  itemized_expenses: number;
  creditable_tax_2307: number;
  quarterly_tax_payments: number;
}

export interface IncomeTaxComputeOutput {
  gross_income: number;
  allowable_deductions: number;
  taxable_income: number;
  computed_tax_due: number;
  total_tax_credits: number;
  net_tax_payable: number;
  tax_explanation: string;
}

export function computeIncomeTaxEngine(input: IncomeTaxComputeInput): IncomeTaxComputeOutput {
  const grossSales = Math.max(0, input.gross_sales);
  const costOfSales = Math.max(0, input.cost_of_sales || 0);
  const grossIncome = Math.max(0, grossSales - costOfSales);
  const itemizedExp = Math.max(0, input.itemized_expenses);

  let allowableDeductions = 0;
  let taxableIncome = 0;
  let computedTaxDue = 0;
  let explanation = '';

  const isSoleProp = input.entity_type.toUpperCase().includes('SOLE') || input.entity_type.toUpperCase().includes('INDIVIDUAL') || input.entity_type.toUpperCase().includes('PROFESSIONAL');

  if (isSoleProp && input.tax_regime === '8% Flat Tax') {
    // 8% Flat Tax option on Gross Sales/Receipts
    // Deduct 250,000 allowance for purely self-employed/professionals
    allowableDeductions = 250000;
    taxableIncome = Math.max(0, grossSales - allowableDeductions);
    computedTaxDue = Math.round(taxableIncome * 0.08 * 100) / 100;
    explanation = '8% Flat Income Tax Rate applied on Gross Sales in excess of ₱250,000 threshold.';
  } else {
    // Itemized vs OSD
    if (input.deduction_method === 'OSD 40%') {
      if (isSoleProp) {
        // 40% of Gross Sales
        allowableDeductions = Math.round(grossSales * 0.40 * 100) / 100;
      } else {
        // 40% of Gross Income (Gross Sales - Cost of Sales for Corporations)
        allowableDeductions = Math.round(grossIncome * 0.40 * 100) / 100;
      }
    } else {
      allowableDeductions = itemizedExp;
    }

    taxableIncome = Math.max(0, (isSoleProp ? grossSales : grossIncome) - allowableDeductions);

    if (isSoleProp) {
      computedTaxDue = Math.round(computeGraduatedIndividualTax(taxableIncome) * 100) / 100;
      explanation = `Individual Graduated Tax Table applied on Net Taxable Income of ₱${taxableIncome.toLocaleString()}.`;
    } else {
      // Corporations & Partnerships
      if (input.tax_regime === 'RCIT 20% (Small Corp)') {
        computedTaxDue = Math.round(taxableIncome * 0.20 * 100) / 100;
        explanation = 'CREATE Act Micro & Small Corporate Income Tax Rate (20% RCIT applied as Taxable Income <= ₱5,000,000 and Assets <= ₱100M).';
      } else if (input.tax_regime === 'MCIT 2%') {
        computedTaxDue = Math.round(grossIncome * 0.02 * 100) / 100;
        explanation = 'Minimum Corporate Income Tax (2% MCIT on Gross Income).';
      } else {
        // Regular Corporate RCIT 25%
        computedTaxDue = Math.round(taxableIncome * 0.25 * 100) / 100;
        explanation = 'Regular Corporate Income Tax Rate (25% RCIT applied on Net Taxable Income).';
      }
    }
  }

  const totalTaxCredits = Math.round((input.creditable_tax_2307 + input.quarterly_tax_payments) * 100) / 100;
  const netTaxPayable = Math.round((computedTaxDue - totalTaxCredits) * 100) / 100;

  return {
    gross_income: grossIncome,
    allowable_deductions: allowableDeductions,
    taxable_income: taxableIncome,
    computed_tax_due: computedTaxDue,
    total_tax_credits: totalTaxCredits,
    net_tax_payable: netTaxPayable,
    tax_explanation: explanation
  };
}

/**
 * PPE Straight-Line Depreciation Schedule Calculator
 */
export interface DepreciationScheduleRow {
  period_num: number;
  period_label: string; // e.g., "Month 1", "Q1", "Year 1"
  beginning_nbv: number;
  depreciation_expense: number;
  accumulated_depreciation: number;
  ending_nbv: number;
}

export function computePPEDepreciationSchedule(
  acquisitionCost: number,
  salvageValue: number,
  usefulLifeYears: number,
  frequency: 'monthly' | 'quarterly' | 'annual' = 'annual'
): DepreciationScheduleRow[] {
  const cost = Math.max(0, acquisitionCost);
  const salvage = Math.max(0, salvageValue);
  const years = Math.max(0.1, usefulLifeYears);
  const depreciableAmount = Math.max(0, cost - salvage);

  let totalPeriods = 0;
  let depPerPeriod = 0;

  if (frequency === 'monthly') {
    totalPeriods = Math.round(years * 12);
    depPerPeriod = depreciableAmount / totalPeriods;
  } else if (frequency === 'quarterly') {
    totalPeriods = Math.round(years * 4);
    depPerPeriod = depreciableAmount / totalPeriods;
  } else {
    totalPeriods = Math.round(years);
    depPerPeriod = depreciableAmount / totalPeriods;
  }

  const schedule: DepreciationScheduleRow[] = [];
  let currentBegNBV = cost;
  let accumDep = 0;

  for (let i = 1; i <= totalPeriods; i++) {
    // For last period, handle rounding cents cleanly
    let periodDep = Math.round(depPerPeriod * 100) / 100;
    if (i === totalPeriods) {
      periodDep = Math.max(0, Math.round((currentBegNBV - salvage) * 100) / 100);
    }

    accumDep = Math.round((accumDep + periodDep) * 100) / 100;
    const endingNBV = Math.round((cost - accumDep) * 100) / 100;

    let periodLabel = '';
    if (frequency === 'monthly') {
      const yearNum = Math.ceil(i / 12);
      const mNum = ((i - 1) % 12) + 1;
      periodLabel = `Year ${yearNum} - Month ${mNum}`;
    } else if (frequency === 'quarterly') {
      const yearNum = Math.ceil(i / 4);
      const qNum = ((i - 1) % 4) + 1;
      periodLabel = `Year ${yearNum} - Q${qNum}`;
    } else {
      periodLabel = `Year ${i}`;
    }

    schedule.push({
      period_num: i,
      period_label: periodLabel,
      beginning_nbv: currentBegNBV,
      depreciation_expense: periodDep,
      accumulated_depreciation: accumDep,
      ending_nbv: endingNBV
    });

    currentBegNBV = endingNBV;
  }

  return schedule;
}

export function computeSalesVAT(invAmt: number, vatExempt: number = 0, discounts: number = 0) {
  const netInvoice = Math.max(0, invAmt - discounts);
  const baseVatable = Math.max(0, netInvoice - vatExempt);
  const vatable_amount = Math.round((baseVatable / 1.12) * 100) / 100;
  const output_vat = Math.round((baseVatable - vatable_amount) * 100) / 100;
  return {
    vatable_amount,
    output_vat,
    net_of_discount: netInvoice
  };
}

export function computeExpenseVAT(expInvAmt: number, discounts: number = 0, isVat: boolean = true) {
  const netInvoice = Math.max(0, expInvAmt - discounts);
  let vatable_expense_amount = 0;
  let vat_input_amount = 0;
  let nonvat_expense_amount = 0;

  if (isVat) {
    vatable_expense_amount = Math.round((netInvoice / 1.12) * 100) / 100;
    vat_input_amount = Math.round((netInvoice - vatable_expense_amount) * 100) / 100;
  } else {
    nonvat_expense_amount = netInvoice;
  }

  return {
    vatable_expense_amount,
    vat_input_amount,
    nonvat_expense_amount,
    net_of_discount: netInvoice
  };
}

export function normalizeDocNo(num?: string): string {
  return (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export interface MasterJournalInput {
  sales: any[];
  collections: any[];
  cashReceipts?: any[];
  expenses: any[];
  payments: any[];
  cashDisbursements?: any[];
  specialEntries?: SpecialEntry[];
  accountTitles?: AccountTitle[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  companyName?: string;
}

/**
 * Generates the authoritative double-entry Journal Entries from the Books of Accounts
 * strictly adhering to the user's specification:
 *
 * SALES:
 * - Subsidiary Sales -> Journal Entry: Dr Accounts Receivable (gross VAT-inclusive), Cr Vatable Sales, Cr Output VAT Payable (and Zero-Rated / VAT-Exempt)
 * - Case A: Paid in Full at time of sale (Cash Sale):
 *   Cash Receipts Book -> Journal Entry: Dr Cash (net received), Dr Sales Discounts, Dr Creditable Withholding Tax (2307), Cr Accounts Receivable (gross)
 *   Collections Book -> No duplicate journal entry (tracked for payment history)
 * - Case B: Paid in Partial / Installments (On Account or Partial):
 *   Collections Book ->
 *     1st / Partial Payments: Dr Cash, Cr Accounts Receivable
 *     Final / Completion Payment:
 *       Entry 2a (Collection): Dr Cash, (Dr Discount), Cr Accounts Receivable
 *       Entry 2b (To recognize full payment CWT 2307): Dr Creditable Withholding Tax (2307), Cr Accounts Receivable
 *   Cash Receipts Book -> No journal entry since it was already journalized in Collections Book upon completion of payment.
 *
 * PURCHASES / EXPENSES:
 * - Subsidiary Purchases -> Journal Entry: Dr Expense, Dr Input VAT, Cr Accounts Payable (gross net of discount)
 * - Cash Disbursements / Payments -> Journal Entry: Dr Accounts Payable, Cr Cash, Cr Expanded Withholding Tax Payable (2307/0619-E)
 */
export function buildMasterJournalEntries(input: MasterJournalInput): JournalEntry[] {
  const {
    sales = [],
    collections = [],
    cashReceipts = [],
    expenses = [],
    payments = [],
    cashDisbursements = [],
    specialEntries = [],
    accountTitles = [],
    ppeAssets = [],
    payrollRecords = [],
    companyName = ''
  } = input;

  const entries: JournalEntry[] = [];
  let idCounter = 1;

  // Filter out any legacy auto-generated SJ-SLS / SJ-COL / SJ-PUR / SJ-DIS special entries to prevent double-counting
  const manualSpecialEntries = specialEntries.filter(s => {
    const vNo = (s.voucher_no || s.entry_number || '').toUpperCase();
    const eType = (s.entry_type || '');
    if (
      vNo.startsWith('SJ-SLS-') ||
      vNo.startsWith('SJ-COL-') ||
      vNo.startsWith('SJ-PUR-') ||
      vNo.startsWith('SJ-DIS-') ||
      eType === 'Sales Recognition' ||
      eType === 'Cash Collection & Settlement' ||
      eType === 'Partial Collection & Settlement' ||
      eType === 'Collection / Receivable Settlement' ||
      eType === 'Purchases / Expense Recognition' ||
      eType === 'Cash Disbursement / Settlement'
    ) {
      return false;
    }
    return true;
  });

  // 1. SUBSIDIARY SALES -> Always generates Sales Recognition Journal Entry:
  // Dr Accounts Receivable (Gross VAT-inclusive)
  // Cr Vatable Sales, Cr Output VAT Payable (and Zero-Rated / VAT-Exempt)
  sales.forEach(s => {
    if (s.is_cancelled || s.sales_status === 'Cancelled') return;

    const customerName = s.registered_name || s.customer_name || s.client_name || 'Customer';
    const isVat = s.vat_or_nonvat === 'VAT' || s.vat_status === 'VAT' || (s.output_vat !== undefined && Number(s.output_vat) > 0) || (s.vat_amount !== undefined && Number(s.vat_amount) > 0);

    const zeroRated = Number(s.zero_rated_amount ?? s.zero_rated) || 0;
    const vatExempt = Number(s.vat_exempt_amount ?? s.vat_exempt) || 0;
    const discounts = Number(s.discount ?? s.discounts ?? s.less_discount) || 0;
    const w2307 = Number(s.tax_withheld ?? s.withholding_2307 ?? s.amount_withheld_2307 ?? s.less_withholding_tax) || 0;

    const rawInvoiceAmt = Number(s.total_amount_vat_inclusive ?? s.amount ?? s.invoice_amount) || 0;
    let vatableSales = Number(s.vatable_amount ?? s.vatable_sales) || 0;
    let vatOutput = Number(s.vat_amount ?? s.output_vat ?? s.vat) || 0;

    if (isVat) {
      if (!vatableSales && rawInvoiceAmt > 0) {
        const grossSubjectToVat = Math.max(0, rawInvoiceAmt - zeroRated - vatExempt);
        vatableSales = Math.round((grossSubjectToVat / 1.12) * 100) / 100;
        vatOutput = Math.round((grossSubjectToVat - vatableSales) * 100) / 100;
      }
    } else {
      vatableSales = Math.max(0, rawInvoiceAmt - zeroRated - vatExempt);
      vatOutput = 0;
    }

    const totalGrossSales = Math.round((vatableSales + vatOutput + zeroRated + vatExempt) * 100) / 100 || rawInvoiceAmt;
    if (totalGrossSales <= 0) return;

    const saleDate = s.date || s.invoice_date || s.issue_date || new Date().toISOString().split('T')[0];

    const entry1Credits: Array<{ account_code: string; account_title: string; amount: number }> = [];
    if (vatableSales > 0) {
      entry1Credits.push({
        account_code: '4010',
        account_title: isVat ? 'Vatable Sales' : 'Sales Revenue',
        amount: vatableSales
      });
    }
    if (vatOutput > 0) {
      entry1Credits.push({
        account_code: '2020',
        account_title: 'Output VAT Payable',
        amount: vatOutput
      });
    }
    if (zeroRated > 0) {
      entry1Credits.push({
        account_code: '4020',
        account_title: 'Zero-Rated Sales',
        amount: zeroRated
      });
    }
    if (vatExempt > 0) {
      entry1Credits.push({
        account_code: '4030',
        account_title: 'VAT-Exempt Sales',
        amount: vatExempt
      });
    }
    if (entry1Credits.length === 0) {
      entry1Credits.push({
        account_code: '4010',
        account_title: 'Sales Revenue',
        amount: totalGrossSales
      });
    }

    entries.push({
      id: idCounter++,
      company_name: s.company_name || companyName,
      entry_no: `GJ-SLS-${s.invoice_number}`,
      date: saleDate,
      ref_type: 'Sales',
      ref_no: s.invoice_number,
      description: `Subsidiary Sales: Invoice #${s.invoice_number} - ${customerName} (${s.status || s.sales_status || 'Recorded'})`,
      debits: [
        { account_code: '1020', account_title: 'Accounts Receivable', amount: totalGrossSales }
      ],
      credits: entry1Credits
    });

    // Check how this sale is paid/collected:
    const normInv = normalizeDocNo(s.invoice_number);
    const matchingColls = collections.filter(c => !c.is_cancelled && normalizeDocNo(c.invoice_number) === normInv);

    // Determine if this was a direct Full Cash Sale (5.3) vs Partial/Installment Sale (6.4)
    const isDirectFullCashSale =
      s.type_of_transaction === 'CASH' &&
      matchingColls.length <= 1 &&
      (matchingColls.length === 0 || matchingColls[0].type_of_transaction === 'CASH');

    if (isDirectFullCashSale && (s.status === 'Paid' || s.status === 'Cash' || s.sales_status === 'Paid' || s.type_of_transaction === 'CASH')) {
      // 5.3 Cash Receipts Book records the journal entry for direct full cash sales:
      // Dr Cash (22,767.86), Dr Creditable Withholding Tax (2,232.14), (Dr Discount), Cr Accounts Receivable (25,000)
      const cashReceived = Math.max(0, Math.round((totalGrossSales - discounts - w2307) * 100) / 100);
      const crDebits: Array<{ account_code: string; account_title: string; amount: number }> = [];
      if (cashReceived > 0) {
        crDebits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashReceived });
      }
      if (discounts > 0) {
        crDebits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: discounts });
      }
      if (w2307 > 0) {
        crDebits.push({ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307 });
      }

      entries.push({
        id: idCounter++,
        company_name: s.company_name || companyName,
        entry_no: `GJ-CR-${s.invoice_number}`,
        date: saleDate,
        ref_type: 'Collection',
        ref_no: s.invoice_number,
        description: `Cash Receipts Book: Full Payment for Invoice #${s.invoice_number} - ${customerName}`,
        debits: crDebits,
        credits: [
          { account_code: '1020', account_title: 'Accounts Receivable', amount: totalGrossSales }
        ]
      });
    }
  });

  // 2. COLLECTIONS BOOK -> Journalizes installment / partial / on-account payments (6.4)
  // Note: Direct full-cash sales already journalized by Cash Receipts Book above are skipped here (5.4).
  const sortedCollections = [...collections].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  const cwtRecognizedForInvoice = new Set<string>();

  sortedCollections.forEach((c, idx) => {
    if (c.is_cancelled) return;
    const normInv = normalizeDocNo(c.invoice_number);
    const matchingSale = sales.find(s => !s.is_cancelled && normalizeDocNo(s.invoice_number) === normInv);

    if (matchingSale) {
      const matchingColls = sortedCollections.filter(col => !col.is_cancelled && normalizeDocNo(col.invoice_number) === normInv);
      const isDirectFullCashSale =
        matchingSale.type_of_transaction === 'CASH' &&
        matchingColls.length <= 1 &&
        (c.type_of_transaction === 'CASH') &&
        (!Array.isArray(c.installments) || c.installments.length <= 1);
      if (isDirectFullCashSale) {
        // 5.4 Collections book also records a cash sale, but NO journal entry (already journalized in 5.3 Cash Receipts)
        return;
      }
    }

    const customerName = c.registered_name || c.customer_name || c.client_name || matchingSale?.registered_name || matchingSale?.customer_name || 'Customer';
    const colDate = c.date || c.collection_date || new Date().toISOString().split('T')[0];

    // If this Collection Book record tracks installments (1st payment/down payment, 2nd payment, etc.)
    if (Array.isArray(c.installments) && c.installments.length > 0) {
      c.installments.forEach((inst: any, instIdx: number) => {
        const cashAmt = Number(inst.cash_amount) || 0;
        const discountAmt = Number(inst.discount) || 0;
        const w2307Amt = Number(inst.wtax_2307) || 0;
        const instDate = inst.date || colDate;
        const pmtNo = inst.payment_no || (instIdx + 1);
        const ordinal = pmtNo === 1 ? 'first payment/down payment' : pmtNo === 2 ? 'for 2nd collection' : `for #${pmtNo} collection`;

        const cashAndDisc = Math.round((cashAmt + discountAmt) * 100) / 100;
        if (cashAndDisc > 0) {
          const colDebits: Array<{ account_code: string; account_title: string; amount: number }> = [];
          if (cashAmt > 0) {
            colDebits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashAmt });
          }
          if (discountAmt > 0) {
            colDebits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: discountAmt });
          }
          entries.push({
            id: idCounter++,
            company_name: c.company_name || companyName,
            entry_no: `GJ-COL-${c.invoice_number}-${pmtNo}`,
            date: instDate,
            ref_type: 'Collection',
            ref_no: c.invoice_number,
            description: `Collections Book — Journal entry ${pmtNo} (${ordinal}): Invoice #${c.invoice_number} - ${customerName}`,
            debits: colDebits,
            credits: [
              { account_code: '1020', account_title: 'Accounts Receivable', amount: cashAndDisc }
            ]
          });
        }

        // Recognize CWT 2307 upon completion of full payment
        if (w2307Amt > 0 && (inst.is_final || c.status === 'Paid')) {
          entries.push({
            id: idCounter++,
            company_name: c.company_name || companyName,
            entry_no: `GJ-CWT-${c.invoice_number}-${pmtNo}`,
            date: instDate,
            ref_type: 'Collection',
            ref_no: c.invoice_number,
            description: `Collections Book — Journal entry ${pmtNo} (to recognize full payment): Invoice #${c.invoice_number} - ${customerName}`,
            debits: [
              { account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307Amt }
            ],
            credits: [
              { account_code: '1020', account_title: 'Accounts Receivable', amount: w2307Amt }
            ]
          });
          if (normInv) cwtRecognizedForInvoice.add(normInv);
        }
      });
      return;
    }

    // Fallback for multi-row or single-row collection records without installments array
    const sameInvColls = sortedCollections.filter(col => !col.is_cancelled && normalizeDocNo(col.invoice_number) === normInv);
    const pmtOrder = sameInvColls.findIndex(col => col.id === c.id) + 1 || (idx + 1);
    const ordinal = pmtOrder === 1 ? 'first payment/down payment' : pmtOrder === 2 ? 'for 2nd collection' : `for #${pmtOrder} collection`;

    const cashAmt = Number(c.amount_collected ?? c.amount) || 0;
    const discountAmt = Number(c.discount ?? c.discounts) || 0;
    const totalCollectedForInv = sameInvColls.reduce((s, col) => s + (Number(col.amount_collected ?? col.amount) || 0) + (Number(col.discount ?? col.discounts) || 0), 0);
    const invDue = Number(matchingSale?.total_amount_due ?? c.total_amount_due ?? matchingSale?.amount) || 0;
    const isInvoiceFullyPaid = c.status === 'Paid' || matchingSale?.status === 'Paid' || (invDue > 0 && totalCollectedForInv >= invDue - 0.05);
    const isLastPaymentRow = sameInvColls.length === 0 || sameInvColls[sameInvColls.length - 1].id === c.id;

    // 6.4 Journal Entry 1 / 2a (for collection of cash / discount):
    // Dr Cash (amount received), (Dr Discount), Cr Accounts Receivable
    const cashAndDisc = Math.round((cashAmt + discountAmt) * 100) / 100;
    if (cashAndDisc > 0) {
      const colDebits: Array<{ account_code: string; account_title: string; amount: number }> = [];
      if (cashAmt > 0) {
        colDebits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashAmt });
      }
      if (discountAmt > 0) {
        colDebits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: discountAmt });
      }
      entries.push({
        id: idCounter++,
        company_name: c.company_name || companyName,
        entry_no: `GJ-COL-${c.voucher_number || c.entry_number || c.id || idx + 1}`,
        date: colDate,
        ref_type: 'Collection',
        ref_no: c.invoice_number,
        description: `Collections Book — Journal entry ${pmtOrder} (${ordinal}): Invoice #${c.invoice_number} - ${customerName}`,
        debits: colDebits,
        credits: [
          { account_code: '1020', account_title: 'Accounts Receivable', amount: cashAndDisc }
        ]
      });
    }

    // 6.4 Journal Entry (to recognize full payment / CWT 2307):
    // Dr Creditable Withholding Tax (2307), Cr Accounts Receivable
    const w2307Amt = Number(c.amount_withheld_2307 ?? c.tax_withheld ?? c.wtax_2307 ?? matchingSale?.tax_withheld ?? matchingSale?.withholding_2307) || 0;
    if (w2307Amt > 0 && isInvoiceFullyPaid && isLastPaymentRow && (!normInv || !cwtRecognizedForInvoice.has(normInv))) {
      entries.push({
        id: idCounter++,
        company_name: c.company_name || companyName,
        entry_no: `GJ-CWT-${c.voucher_number || c.entry_number || c.id || idx + 1}`,
        date: colDate,
        ref_type: 'Collection',
        ref_no: c.invoice_number,
        description: `Collections Book — Journal entry ${pmtOrder} (to recognize full payment): Invoice #${c.invoice_number} - ${customerName}`,
        debits: [
          { account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307Amt }
        ],
        credits: [
          { account_code: '1020', account_title: 'Accounts Receivable', amount: w2307Amt }
        ]
      });
      if (normInv) cwtRecognizedForInvoice.add(normInv);
    }
  });

  // 3. SUBSIDIARY PURCHASES / EXPENSES -> Always generates Expense Recognition Journal Entry:
  // Dr Expense (net of VAT), Dr Input VAT, Cr Accounts Payable (gross net of discount)
  expenses.forEach(e => {
    if (e.is_cancelled || e.expense_status === 'Cancelled') return;

    const providerName = e.registered_name || e.service_provider_name || 'Vendor';
    const isVat = e.vat_or_nonvat === 'VAT' || e.nonvat_or_vat === 'VAT' || e.business_tax_type === 'vatable' || (Number(e.vat_amount || e.vat_input_amount) > 0);
    const rawExpAmt = Number(e.total_amount_vat_inclusive ?? e.amount ?? e.expense_invoice_amount) || 0;
    const discounts = Number(e.discount ?? e.discounts ?? e.less_discount) || 0;
    const w2307 = Number(e.tax_withheld ?? e.withholding_2307_2306 ?? e.less_withholding_tax) || 0;

    const { vatable_expense_amount, vat_input_amount, nonvat_expense_amount, net_of_discount: netInvoice } = computeExpenseVAT(rawExpAmt, discounts, isVat);
    const expBase = Number(e.vatable_amount ?? e.vatable_expense_amount) || (isVat ? vatable_expense_amount : nonvat_expense_amount);
    const inputVat = Number(e.vat_amount ?? e.vat_input_amount) || (isVat ? vat_input_amount : 0);
    const grossPayable = Math.round((expBase + inputVat) * 100) / 100 || netInvoice;

    if (grossPayable <= 0) return;

    const expType = e.expense_type || e.particulars || 'Operating Expense';
    const matched = accountTitles.find(a => a.title.toLowerCase() === expType.toLowerCase() || a.category === expType);
    const expCode = matched ? matched.code : '6100';
    const expDate = e.date || e.expense_date || new Date().toISOString().split('T')[0];
    const vNo = e.voucher_number || e.invoice_number || `EXP-${e.id}`;

    const expDebits: Array<{ account_code: string; account_title: string; amount: number }> = [
      { account_code: expCode, account_title: matched ? matched.title : `Expense: ${expType}`, amount: expBase }
    ];
    if (inputVat > 0) {
      expDebits.push({ account_code: '1030', account_title: 'Input VAT', amount: inputVat });
    }

    entries.push({
      id: idCounter++,
      company_name: e.company_name || companyName,
      entry_no: `GJ-EXP-${vNo}`,
      date: expDate,
      ref_type: 'Expense',
      ref_no: vNo,
      description: `Subsidiary Purchases: Voucher #${vNo} - ${providerName} (${expType})`,
      debits: expDebits,
      credits: [
        { account_code: '2010', account_title: 'Accounts Payable', amount: grossPayable }
      ]
    });

    // Check if paid in full directly without separate payment records, or via direct cash purchase
    const normVoucher = normalizeDocNo(vNo);
    const matchingPmts = payments.filter(p => !p.is_cancelled && (normalizeDocNo(p.voucher_number) === normVoucher || normalizeDocNo(p.invoice_number) === normVoucher));
    const isDirectCashPurchase =
      e.type_of_transaction === 'CASH' &&
      matchingPmts.length <= 1 &&
      (matchingPmts.length === 0 || (matchingPmts[0].type_of_transaction === 'CASH' && (!Array.isArray(matchingPmts[0].installments) || matchingPmts[0].installments.length <= 1)));

    if (isDirectCashPurchase) {
      const cashPaid = Math.max(0, Math.round((grossPayable - w2307) * 100) / 100);
      const cdCredits: Array<{ account_code: string; account_title: string; amount: number }> = [
        { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashPaid }
      ];
      if (w2307 > 0) {
        cdCredits.push({ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 });
      }
      entries.push({
        id: idCounter++,
        company_name: e.company_name || companyName,
        entry_no: `GJ-CD-${vNo}`,
        date: expDate,
        ref_type: 'Payment',
        ref_no: vNo,
        description: `Cash Disbursements Book: Full Payment for Voucher #${vNo} - ${providerName}`,
        debits: [
          { account_code: '2010', account_title: 'Accounts Payable', amount: grossPayable }
        ],
        credits: cdCredits
      });
    }
  });

  // 4. PAYMENTS BOOK -> Journalizes partial / on-account payments
  const sortedPayments = [...payments].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  const ewtRecognizedForVoucher = new Set<string>();

  sortedPayments.forEach((p, idx) => {
    if (p.is_cancelled) return;
    const vNo = p.voucher_number || p.invoice_number || `PAY-${p.id}`;
    const normVoucher = normalizeDocNo(vNo);
    const matchingExp = expenses.find(e => !e.is_cancelled && (normalizeDocNo(e.voucher_number) === normVoucher || normalizeDocNo(e.invoice_number) === normVoucher));

    if (matchingExp) {
      const matchingPmts = sortedPayments.filter(pm => !pm.is_cancelled && (normalizeDocNo(pm.voucher_number) === normVoucher || normalizeDocNo(pm.invoice_number) === normVoucher));
      const isDirectCashPurchase =
        matchingExp.type_of_transaction === 'CASH' &&
        matchingPmts.length <= 1 &&
        p.type_of_transaction === 'CASH' &&
        (!Array.isArray(p.installments) || p.installments.length <= 1);
      if (isDirectCashPurchase) {
        return; // Already journalized in Cash Disbursements above
      }
    }

    const providerName = p.registered_name || p.service_provider_name || matchingExp?.registered_name || matchingExp?.service_provider_name || 'Vendor';
    const payDate = p.date || p.payment_date || new Date().toISOString().split('T')[0];

    if (Array.isArray(p.installments) && p.installments.length > 0) {
      p.installments.forEach((inst: any, instIdx: number) => {
        const cashPaid = Number(inst.cash_amount) || 0;
        const w2307 = Number(inst.wtax_2307) || 0;
        const instDate = inst.date || payDate;
        const pmtNo = inst.payment_no || (instIdx + 1);
        const ordinal = pmtNo === 1 ? 'first payment/down payment' : pmtNo === 2 ? 'for 2nd payment' : `for #${pmtNo} payment`;

        if (cashPaid > 0) {
          entries.push({
            id: idCounter++,
            company_name: p.company_name || companyName,
            entry_no: `GJ-PAY-${vNo}-${pmtNo}`,
            date: instDate,
            ref_type: 'Payment',
            ref_no: vNo,
            description: `Payments Book — Journal entry ${pmtNo} (${ordinal}): Voucher #${vNo} - ${providerName}`,
            debits: [
              { account_code: '2010', account_title: 'Accounts Payable', amount: cashPaid }
            ],
            credits: [
              { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashPaid }
            ]
          });
        }

        if (w2307 > 0 && (inst.is_final || p.status === 'Paid')) {
          entries.push({
            id: idCounter++,
            company_name: p.company_name || companyName,
            entry_no: `GJ-EWT-${vNo}-${pmtNo}`,
            date: instDate,
            ref_type: 'Payment',
            ref_no: vNo,
            description: `Payments Book — Journal entry ${pmtNo} (to recognize full payment): Voucher #${vNo} - ${providerName}`,
            debits: [
              { account_code: '2010', account_title: 'Accounts Payable', amount: w2307 }
            ],
            credits: [
              { account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 }
            ]
          });
          if (normVoucher) ewtRecognizedForVoucher.add(normVoucher);
        }
      });
      return;
    }

    const sameVoucherPmts = sortedPayments.filter(pm => !pm.is_cancelled && (normalizeDocNo(pm.voucher_number) === normVoucher || normalizeDocNo(pm.invoice_number) === normVoucher));
    const pmtOrder = sameVoucherPmts.findIndex(pm => pm.id === p.id) + 1 || (idx + 1);
    const ordinal = pmtOrder === 1 ? 'first payment/down payment' : pmtOrder === 2 ? 'for 2nd payment' : `for #${pmtOrder} payment`;

    const cashPaid = Number(p.amount_paid ?? p.amount) || 0;
    const totalPaidForVoucher = sameVoucherPmts.reduce((s, pm) => s + (Number(pm.amount_paid ?? pm.amount) || 0), 0);
    const expDue = Number(matchingExp?.total_amount_due ?? p.total_amount_due ?? matchingExp?.amount) || 0;
    const isVoucherFullyPaid = p.status === 'Paid' || matchingExp?.status === 'Paid' || (expDue > 0 && totalPaidForVoucher >= expDue - 0.05);
    const isLastPmtRow = sameVoucherPmts.length === 0 || sameVoucherPmts[sameVoucherPmts.length - 1].id === p.id;

    if (cashPaid > 0) {
      entries.push({
        id: idCounter++,
        company_name: p.company_name || companyName,
        entry_no: `GJ-PAY-${p.id || idx + 1}`,
        date: payDate,
        ref_type: 'Payment',
        ref_no: vNo,
        description: `Payments Book — Journal entry ${pmtOrder} (${ordinal}): Voucher #${vNo} - ${providerName}`,
        debits: [
          { account_code: '2010', account_title: 'Accounts Payable', amount: cashPaid }
        ],
        credits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashPaid }
        ]
      });
    }

    const w2307 = Number(p.withholding_tax_2307 ?? p.tax_withheld ?? matchingExp?.tax_withheld ?? matchingExp?.withholding_2307_2306) || 0;
    if (w2307 > 0 && isVoucherFullyPaid && isLastPmtRow && (!normVoucher || !ewtRecognizedForVoucher.has(normVoucher))) {
      entries.push({
        id: idCounter++,
        company_name: p.company_name || companyName,
        entry_no: `GJ-EWT-${p.id || idx + 1}`,
        date: payDate,
        ref_type: 'Payment',
        ref_no: vNo,
        description: `Payments Book — Journal entry ${pmtOrder} (to recognize full payment): Voucher #${vNo} - ${providerName}`,
        debits: [
          { account_code: '2010', account_title: 'Accounts Payable', amount: w2307 }
        ],
        credits: [
          { account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 }
        ]
      });
      if (normVoucher) ewtRecognizedForVoucher.add(normVoucher);
    }
  });

  // 5. PPE Asset Acquisition & Depreciation Entries
  ppeAssets.forEach(p => {
    const cost = Number(p.acquisition_cost) || 0;
    const dep = Number(p.accumulated_depreciation) || 0;
    const acqDate = p.acquisition_date || new Date().toISOString().split('T')[0];
    if (cost > 0) {
      entries.push({
        id: idCounter++,
        company_name: p.company_name || companyName,
        entry_no: `GJ-PPE-${p.asset_code || p.id}`,
        date: acqDate,
        ref_type: 'PPE Acquisition',
        ref_no: p.asset_code || String(p.id),
        description: `Acquisition of Property, Plant & Equipment: ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: '1510', account_title: 'Property, Plant & Equipment', amount: cost }
        ],
        credits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cost }
        ]
      });
    }
    if (dep > 0) {
      entries.push({
        id: idCounter++,
        company_name: p.company_name || companyName,
        entry_no: `GJ-DEP-${p.asset_code || p.id}`,
        date: acqDate,
        ref_type: 'Depreciation',
        ref_no: p.asset_code || String(p.id),
        description: `Depreciation Expense for PPE Asset: ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: '6080', account_title: 'Depreciation Expense', amount: dep }
        ],
        credits: [
          { account_code: '1520', account_title: 'Accumulated Depreciation', amount: dep }
        ]
      });
    }
  });

  // 6. Payroll Entries
  payrollRecords.forEach(pr => {
    const gross = Number(pr.gross_pay) || 0;
    if (gross <= 0) return;
    const sssEE = Number(pr.sss_deduction) || 0;
    const phicEE = Number(pr.philhealth_deduction) || 0;
    const hdmfEE = Number(pr.pagibig_deduction) || 0;
    const taxEE = Number(pr.withholding_tax) || 0;
    const otherDed = Number(pr.other_deductions) || 0;
    const netPay = Number(pr.net_pay) || Math.max(0, gross - sssEE - phicEE - hdmfEE - taxEE - otherDed);

    const sssER = Math.round((Number(pr.basic_pay) || 0) * 0.095 * 100) / 100;
    const phicER = phicEE;
    const hdmfER = hdmfEE;

    const debits: Array<{ account_code: string; account_title: string; amount: number }> = [
      { account_code: '6010', account_title: 'Salaries, Wages & Benefits', amount: gross }
    ];
    if (sssER > 0) debits.push({ account_code: '6015', account_title: 'Employer SSS Contribution Expense', amount: sssER });
    if (phicER > 0) debits.push({ account_code: '6016', account_title: 'Employer PhilHealth Contribution Expense', amount: phicER });
    if (hdmfER > 0) debits.push({ account_code: '6017', account_title: 'Employer Pag-IBIG Contribution Expense', amount: hdmfER });

    const credits: Array<{ account_code: string; account_title: string; amount: number }> = [
      { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: netPay }
    ];
    if (sssEE + sssER > 0) credits.push({ account_code: '2041', account_title: 'SSS Premium Payable (EE+ER)', amount: sssEE + sssER });
    if (phicEE + phicER > 0) credits.push({ account_code: '2042', account_title: 'PhilHealth Premium Payable (EE+ER)', amount: phicEE + phicER });
    if (hdmfEE + hdmfER > 0) credits.push({ account_code: '2043', account_title: 'Pag-IBIG Premium Payable (EE+ER)', amount: hdmfEE + hdmfER });
    if (taxEE > 0) credits.push({ account_code: '2035', account_title: 'Withholding Tax Payable - Compensation (BIR 1601-C)', amount: taxEE });
    if (otherDed > 0) credits.push({ account_code: '2050', account_title: 'Other Employee Payables & Deductions', amount: otherDed });

    entries.push({
      id: idCounter++,
      company_name: pr.company_name || companyName,
      entry_no: `GJ-PAYROLL-${pr.employee_id}-${pr.payroll_period || pr.id}`,
      date: new Date().toISOString().split('T')[0],
      ref_type: 'Payroll',
      ref_no: String(pr.employee_id || ''),
      description: `Payroll Processing for ${pr.full_name || pr.employee_name || pr.employee_id} (${pr.payroll_period || 'Current'})`,
      debits,
      credits
    });
  });

  // 7. Manual Special Entries (Adjusting, Closing, Reversing, Capital Contributions, Tax Provisions, etc.)
  manualSpecialEntries.forEach(s => {
    const debits = (s.lines || [])
      .filter(l => l.type?.toLowerCase() === 'debit')
      .map(l => ({ account_code: l.account_code, account_title: l.account_title, amount: Number(l.amount) || 0 }));
    const credits = (s.lines || [])
      .filter(l => l.type?.toLowerCase() === 'credit')
      .map(l => ({ account_code: l.account_code, account_title: l.account_title, amount: Number(l.amount) || 0 }));

    entries.push({
      id: idCounter++,
      company_name: s.company_name || companyName,
      entry_no: s.voucher_no || s.entry_number || `SJ-${s.id}`,
      date: s.entry_date || new Date().toISOString().split('T')[0],
      ref_type: s.entry_type || 'Adjusting Entry',
      ref_no: s.voucher_no || s.entry_number || `SJ-${s.id}`,
      description: s.description ? (s.description.startsWith('[') ? s.description : `[${s.entry_type || 'Special'}] ${s.description}`) : `Special Entry #${s.voucher_no || s.id}`,
      debits,
      credits
    });
  });

  return entries;
}

export interface AccountingSummaryResult {
  // Balance Sheet Assets
  cash: number;
  ar: number;
  customerAdvances: number;
  inputVat: number;
  cwt2307: number;
  prepaidExpenses: number;
  supplierAdvances: number;
  totalCurrentAssets: number;
  ppeCost: number;
  accumDep: number;
  netPPE: number;
  totalAssets: number;

  // Balance Sheet Liabilities
  ap: number;
  outputVat: number;
  netVatPayable: number;
  ewtPayable: number;
  payrollDeductionsPayable: number;
  incomeTaxPayable: number;
  otherLiabilities: number;
  totalLiabilities: number;

  // Income Statement
  vatableSales: number;
  zeroRatedSales: number;
  vatExemptSales: number;
  salesDiscounts: number;
  grossRevenue: number;
  totalOperatingExp: number;
  depreciationExpense: number;
  payrollExpense: number;
  specialRev: number;
  specialExp: number;
  netIncomeBeforeTax: number;
  incomeTaxProvision: number;
  netIncome: number;

  // Equity
  capitalStock: number;
  ownerDrawings: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  unrealizedGainLoss: number;
  isBalanced: boolean;

  // Cash Flow Metrics
  cashInflowsFromCustomers: number;
  cashOutflowsToSuppliersAndExpenses: number;
  cashOutflowsToPayroll: number;
  netOperatingCashFlow: number;
  netInvestingCashFlow: number;
  netFinancingCashFlow: number;

  // Account Ledger Map
  accountMap: Record<string, {
    code: string;
    title: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    debit: number;
    credit: number;
    netBalance: number;
  }>;
  journalEntries: JournalEntry[];
}

/**
 * Computes all Financial Statements, Trial Balance, and Dashboard metrics directly from buildMasterJournalEntries
 * so that General Journal, General Ledger, Statement of Financial Position, Income Statement, Changes in Equity,
 * Cash Flows, Financial Reports, and Executive Dashboard are 100% synchronized.
 */
export function computeAccountingSummaries(input: MasterJournalInput): AccountingSummaryResult {
  const journalEntries = buildMasterJournalEntries(input);
  const accountTitles = input.accountTitles || [];

  const getAccountType = (code: string, title: string): 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' => {
    const found = accountTitles.find(a => a.code === code);
    if (found) {
      if (found.type === 'Cost of Sales') return 'Expense';
      if (['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(found.type)) {
        return found.type as any;
      }
    }
    if (code === '4015') return 'Revenue'; // Sales Discounts (Contra-Revenue)
    if (code.startsWith('1')) return 'Asset';
    if (code.startsWith('2')) return 'Liability';
    if (code.startsWith('3')) return 'Equity';
    if (code.startsWith('4')) return 'Revenue';
    return 'Expense';
  };

  const accountMap: Record<string, {
    code: string;
    title: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    debit: number;
    credit: number;
    netBalance: number;
  }> = {};

  const ensureAccount = (code: string, title: string) => {
    if (!accountMap[code]) {
      accountMap[code] = {
        code,
        title,
        type: getAccountType(code, title),
        debit: 0,
        credit: 0,
        netBalance: 0
      };
    }
  };

  journalEntries.forEach(entry => {
    entry.debits.forEach(d => {
      ensureAccount(d.account_code, d.account_title);
      accountMap[d.account_code].debit = Math.round((accountMap[d.account_code].debit + (Number(d.amount) || 0)) * 100) / 100;
    });
    entry.credits.forEach(c => {
      ensureAccount(c.account_code, c.account_title);
      accountMap[c.account_code].credit = Math.round((accountMap[c.account_code].credit + (Number(c.amount) || 0)) * 100) / 100;
    });
  });

  Object.values(accountMap).forEach(acc => {
    if (acc.type === 'Asset' || acc.type === 'Expense') {
      acc.netBalance = Math.round((acc.debit - acc.credit) * 100) / 100;
    } else {
      acc.netBalance = Math.round((acc.credit - acc.debit) * 100) / 100;
    }
  });

  const getNet = (code: string) => accountMap[code]?.netBalance || 0;
  const getDr = (code: string) => accountMap[code]?.debit || 0;
  const getCr = (code: string) => accountMap[code]?.credit || 0;

  // 1. Assets
  const cash = getNet('1010');
  const rawAr = getNet('1020');
  const ar = rawAr > 0 ? rawAr : 0;
  const customerAdvances = rawAr < 0 ? Math.abs(rawAr) : 0;
  const inputVat = getNet('1030');
  const cwt2307 = getNet('1040');
  const prepaidExpenses = getNet('1050');

  // Check if AP has a debit balance (supplier advances)
  const rawAp = getNet('2010'); // Liability: Cr - Dr
  const ap = rawAp > 0 ? rawAp : 0;
  const supplierAdvances = rawAp < 0 ? Math.abs(rawAp) : 0;

  const ppeCost = getNet('1510');
  // 1520 is contra-asset (Cr > Dr), so its credit minus debit is positive accumulated depreciation
  const accumDep = Math.max(0, getCr('1520') - getDr('1520'));
  const netPPE = Math.round((ppeCost - accumDep) * 100) / 100;

  // Any other 1xxx accounts
  let otherCurrentAssets = 0;
  Object.values(accountMap).forEach(acc => {
    if (acc.code.startsWith('1') && !['1010', '1020', '1030', '1040', '1050', '1510', '1520'].includes(acc.code)) {
      otherCurrentAssets += acc.netBalance;
    }
  });

  const totalCurrentAssets = Math.round((cash + ar + supplierAdvances + inputVat + cwt2307 + prepaidExpenses + otherCurrentAssets) * 100) / 100;
  const totalAssets = Math.round((totalCurrentAssets + netPPE) * 100) / 100;

  // 2. Liabilities
  const outputVat = getNet('2020');
  const netVatPayable = Math.max(0, Math.round((outputVat - inputVat) * 100) / 100);
  const ewtPayable = getNet('2030');
  const payrollDeductionsPayable = Math.round((getNet('2035') + getNet('2041') + getNet('2042') + getNet('2043') + getNet('2050')) * 100) / 100;
  const recordedIncomeTaxPayable = getNet('2040');

  let otherLiabilities = 0;
  Object.values(accountMap).forEach(acc => {
    if (acc.code.startsWith('2') && !['2010', '2020', '2030', '2035', '2040', '2041', '2042', '2043', '2050'].includes(acc.code)) {
      otherLiabilities += acc.netBalance;
    }
  });

  // 3. Revenues & Expenses (Income Statement)
  const vatableSales = getNet('4010');
  const zeroRatedSales = getNet('4020');
  const vatExemptSales = getNet('4030');
  // 4015 Sales Discounts has Debit balance, so getDr - getCr
  const salesDiscounts = Math.max(0, getDr('4015') - getCr('4015'));

  let otherRev = 0;
  Object.values(accountMap).forEach(acc => {
    if (acc.code.startsWith('4') && !['4010', '4015', '4020', '4030'].includes(acc.code)) {
      otherRev += (acc.credit - acc.debit);
    }
  });

  const grossRevenue = Math.round((vatableSales + zeroRatedSales + vatExemptSales + otherRev - salesDiscounts) * 100) / 100;

  const depreciationExpense = getNet('6080');
  const payrollExpense = Math.round((getNet('6010') + getNet('6015') + getNet('6016') + getNet('6017')) * 100) / 100;

  let totalOperatingExp = 0;
  Object.values(accountMap).forEach(acc => {
    if ((acc.code.startsWith('5') || acc.code.startsWith('6')) && !['6010', '6015', '6016', '6017', '6080'].includes(acc.code)) {
      totalOperatingExp += (acc.debit - acc.credit);
    }
  });
  totalOperatingExp = Math.round(totalOperatingExp * 100) / 100;

  const netIncomeBeforeTax = Math.round((grossRevenue - totalOperatingExp - depreciationExpense - payrollExpense) * 100) / 100;

  // Check if a manual tax provision entry (#7010) was posted
  const recordedTaxExpense = getDr('7010') - getCr('7010');
  const incomeTaxProvision = recordedTaxExpense > 0 ? Math.round(recordedTaxExpense * 100) / 100 : 0;
  const incomeTaxPayable = Math.round((recordedIncomeTaxPayable + (recordedTaxExpense > 0 && recordedIncomeTaxPayable === 0 ? recordedTaxExpense : 0)) * 100) / 100;

  const netIncome = Math.round((netIncomeBeforeTax - incomeTaxProvision) * 100) / 100;

  const totalLiabilities = Math.round((ap + customerAdvances + outputVat + ewtPayable + payrollDeductionsPayable + incomeTaxPayable + otherLiabilities) * 100) / 100;

  // 4. Equity
  const capitalContributions = getCr('3010');
  const ownerDrawings = getDr('3010') + (getDr('3030') - getCr('3030'));
  const capitalStock = Math.round((capitalContributions - ownerDrawings) * 100) / 100;
  const priorRetainedEarnings = getNet('3020');
  const retainedEarnings = Math.round((priorRetainedEarnings + netIncome) * 100) / 100;

  const totalEquity = Math.round((capitalStock + retainedEarnings) * 100) / 100;
  const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
  const unrealizedGainLoss = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

  // 5. Cash Flow Classification from Journal Entries affecting Cash (1010)
  let cashInflowsFromCustomers = 0;
  let cashOutflowsToSuppliersAndExpenses = 0;
  let cashOutflowsToPayroll = 0;
  let netInvestingCashFlow = 0;
  let netFinancingCashFlow = 0;

  journalEntries.forEach(je => {
    const cashDr = je.debits.filter(d => d.account_code === '1010').reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const cashCr = je.credits.filter(c => c.account_code === '1010').reduce((s, c) => s + (Number(c.amount) || 0), 0);
    if (cashDr === 0 && cashCr === 0) return;

    const hasEquity = je.debits.some(d => d.account_code.startsWith('3')) || je.credits.some(c => c.account_code.startsWith('3'));
    const hasPPE = je.debits.some(d => d.account_code.startsWith('15')) || je.credits.some(c => c.account_code.startsWith('15'));

    if (hasEquity) {
      netFinancingCashFlow += (cashDr - cashCr);
    } else if (hasPPE || je.ref_type === 'PPE Acquisition') {
      netInvestingCashFlow += (cashDr - cashCr);
    } else if (je.ref_type === 'Payroll') {
      cashOutflowsToPayroll += (cashCr - cashDr);
    } else {
      cashInflowsFromCustomers += cashDr;
      cashOutflowsToSuppliersAndExpenses += cashCr;
    }
  });

  const netOperatingCashFlow = Math.round((cashInflowsFromCustomers - cashOutflowsToSuppliersAndExpenses - cashOutflowsToPayroll) * 100) / 100;

  return {
    cash,
    ar,
    customerAdvances,
    inputVat,
    cwt2307,
    prepaidExpenses,
    supplierAdvances,
    totalCurrentAssets,
    ppeCost,
    accumDep,
    netPPE,
    totalAssets,
    ap,
    outputVat,
    netVatPayable,
    ewtPayable,
    payrollDeductionsPayable,
    incomeTaxPayable,
    otherLiabilities,
    totalLiabilities,
    vatableSales,
    zeroRatedSales,
    vatExemptSales,
    salesDiscounts,
    grossRevenue,
    totalOperatingExp,
    depreciationExpense,
    payrollExpense,
    specialRev: otherRev,
    specialExp: 0,
    netIncomeBeforeTax,
    incomeTaxProvision,
    netIncome,
    capitalStock: capitalContributions,
    ownerDrawings,
    retainedEarnings,
    totalEquity,
    totalLiabilitiesAndEquity,
    unrealizedGainLoss,
    isBalanced: Math.abs(unrealizedGainLoss) < 0.05,
    cashInflowsFromCustomers: Math.round(cashInflowsFromCustomers * 100) / 100,
    cashOutflowsToSuppliersAndExpenses: Math.round(cashOutflowsToSuppliersAndExpenses * 100) / 100,
    cashOutflowsToPayroll: Math.round(cashOutflowsToPayroll * 100) / 100,
    netOperatingCashFlow,
    netInvestingCashFlow: Math.round(netInvestingCashFlow * 100) / 100,
    netFinancingCashFlow: Math.round(netFinancingCashFlow * 100) / 100,
    accountMap,
    journalEntries
  };
}


