/**
 * Single Source of Truth for BIR Tax Math & Double-Entry Accounting Calculations
 */

import { Sale, Expense, Collection, Payment, SpecialEntry, AccountTitle, PPEAsset, PayrollRecord, JournalEntry, UniformBookRecord } from '../types';

export function safeNum(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'nan') return 0;
  const cleaned = str.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

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

// ============================================================================
// SETTLEMENT ENGINE — SINGLE SOURCE OF TRUTH FOR A/R & A/P CLEARING
// ----------------------------------------------------------------------------
// Rules (used by the journal engine, the Sales/Purchase hubs, the books and the
// dashboards so that every screen agrees):
//
//  1. TRADE DISCOUNT is booked at invoice time. It contrasts the Sales (Dr Sales
//     Discounts) / the Expense (expense is recorded net), so the A/R (A/P) that
//     is booked is already NET of the trade discount.
//        booked (A/R or A/P)  = gross VAT-inclusive − trade discount
//  2. WITHHOLDING TAX (CWT 2307 on sales / EWT on purchases) is NOT cash. It
//     contrasts the A/R (A/P) when the settlement is completed.
//        cash due             = booked − withholding
//        (total_amount_due on the records is ALREADY net of discount AND tax)
//  3. A settlement-time (prompt-payment) discount given on a collection also
//     counters A/R, and counts toward the cash due.
//  4. An invoice is PAID when  cash + settlement discount + withholding = booked.
//     If the cash due is fully settled the withholding is recognised
//     automatically (the "plug"), so a fully-paid invoice can never leave an
//     A/R (A/P) residual behind.
// ============================================================================

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const numOf = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};
/** first value that is not undefined/null/'' (mirrors the `??` chains used across the app) */
const firstDefined = (...vals: any[]): any => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

export interface SettlementEvent {
  date: string;
  cash: number;
  discount: number;
  withholding: number;
  sourceId: number;
  seq: number;
  installmentNo: number;
}

export interface SettlementSummary {
  booked: number;               // A/R (A/P) booked at recognition (net of trade discount)
  withholdingExpected: number;  // CWT / EWT on the invoice
  cashDue: number;              // booked − withholding
  cash: number;                 // cash collected / paid
  discount: number;             // settlement-time discounts
  withholdingExplicit: number;  // CWT / EWT already carried on payment rows
  withholdingRecognized: number;// CWT / EWT counted against A/R (A/P)
  withholdingPlug: number;      // CWT / EWT that still needs its own journal entry
  offset: number;               // total credited to A/R (A/P)
  remaining: number;            // open A/R (A/P)
  remainingCash: number;        // cash still to collect / pay
  isPaid: boolean;
  status: 'Paid' | 'Partial' | 'On Account';
  events: SettlementEvent[];
}

export function summarizeSettlement(bookedIn: number, withholdingIn: number, events: SettlementEvent[]): SettlementSummary {
  const booked = r2(Math.max(0, bookedIn));
  const withholdingExpected = r2(Math.min(Math.max(0, withholdingIn), booked));
  const cashDue = r2(booked - withholdingExpected);

  const cash = r2(events.reduce((s, e) => s + e.cash, 0));
  const discount = r2(events.reduce((s, e) => s + e.discount, 0));
  const withholdingExplicit = r2(events.reduce((s, e) => s + e.withholding, 0));
  const settledCash = r2(cash + discount);

  const hasActivity = events.length > 0 && (cash + discount + withholdingExplicit) > 0;
  const cashFullySettled = hasActivity && settledCash >= cashDue - 0.05;

  const withholdingRecognized = cashFullySettled
    ? Math.max(withholdingExplicit, r2(Math.max(0, booked - settledCash)))
    : withholdingExplicit;
  const withholdingPlug = Math.max(0, r2(withholdingRecognized - withholdingExplicit));

  const offset = r2(settledCash + withholdingRecognized);
  const remaining = Math.max(0, r2(booked - offset));
  const isPaid = hasActivity && remaining <= 0.05;
  const status: 'Paid' | 'Partial' | 'On Account' = isPaid ? 'Paid' : (offset > 0 ? 'Partial' : 'On Account');
  const remainingCash = isPaid ? 0 : Math.max(0, r2(cashDue - settledCash));

  return {
    booked, withholdingExpected, cashDue, cash, discount, withholdingExplicit,
    withholdingRecognized, withholdingPlug, offset, remaining, remainingCash,
    isPaid, status, events
  };
}

// ---------------------------------------------------------------------------
// SALES — what the Subsidiary Sales book recognises (A/R after trade discount)
// ---------------------------------------------------------------------------
export function getSaleBookedAmounts(s: any) {
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
  const netReceivable = Math.max(0, Math.round((totalGrossSales - discounts) * 100) / 100);

  return { isVat, zeroRated, vatExempt, discounts, w2307, rawInvoiceAmt, vatableSales, vatOutput, totalGrossSales, netReceivable };
}

/** A collection row that merely mirrors the invoice (placeholder / down-payment / cash copy). */
const SALE_COPY_PARTICULARS_RX = /down payment|receivable tracking|full cash settlement|full settlement completed|reverted/i;

export function getSaleSettlementEvents(sale: any, collections: any[]): SettlementEvent[] {
  const normInv = normalizeDocNo(sale.invoice_number);
  if (!normInv) return [];
  const tradeDiscount = getSaleBookedAmounts(sale).discounts;

  const rows = collections
    .filter(c => !c.is_cancelled && normalizeDocNo(c.invoice_number) === normInv)
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const events: SettlementEvent[] = [];
  rows.forEach(c => {
    const particulars = String(c.particulars || '');
    // Zero-amount "Receivable Tracking" placeholders never settle anything
    if (/receivable tracking/i.test(particulars)) return;
    const colDate = c.date || c.collection_date || '';

    if (Array.isArray(c.installments) && c.installments.length > 0) {
      c.installments.forEach((inst: any, i: number) => {
        const cash = numOf(inst.cash_amount);
        const discount = numOf(inst.discount);
        const withholding = numOf(inst.wtax_2307);
        if (cash <= 0 && discount <= 0 && withholding <= 0) return;
        events.push({
          date: inst.date || colDate,
          cash, discount, withholding,
          sourceId: Number(c.id) || 0,
          seq: i,
          installmentNo: Number(inst.payment_no) || i + 1
        });
      });
      return;
    }

    const cash = c.amount_collected !== undefined ? numOf(c.amount_collected) : numOf(c.amount);
    const rawDiscount = numOf(firstDefined(c.discount, c.discounts));
    // The invoice trade discount was already booked at sale recognition. Rows that just mirror it must not discount again.
    const idOffset = (Number(c.id) || 0) - (Number(sale.id) || 0);
    const isTradeDiscountCopy =
      rawDiscount > 0 &&
      Math.abs(rawDiscount - tradeDiscount) < 0.005 &&
      (cash <= 0 || SALE_COPY_PARTICULARS_RX.test(particulars) || idOffset === 1 || idOffset === 2);
    const discount = isTradeDiscountCopy ? 0 : rawDiscount;
    const withholding = numOf(firstDefined(c.amount_withheld_2307, c.tax_withheld, c.wtax_2307));

    if (cash <= 0 && discount <= 0 && withholding <= 0) return;
    events.push({
      date: colDate,
      cash, discount, withholding,
      sourceId: Number(c.id) || 0,
      seq: 0,
      installmentNo: events.length + 1
    });
  });
  return events;
}

/** A sale that was paid in full at the time of sale (Cash Receipts Book posts the compound entry). */
export function isDirectFullCashSale(s: any, collections: any[]): boolean {
  const { netReceivable } = getSaleBookedAmounts(s);
  const normInv = normalizeDocNo(s.invoice_number);
  const matchingColls = collections.filter(c => !c.is_cancelled && normalizeDocNo(c.invoice_number) === normInv);

  const isExplicitCashType = (s.type_of_transaction || '').toUpperCase().includes('CASH') || (s.payment_type || '').toLowerCase() === 'cash';
  const isExplicitOnAccount = (s.type_of_transaction || '').toUpperCase().includes('ACCOUNT') || (s.payment_type || '').toLowerCase() === 'on_account' || (s.payment_type || '').toLowerCase() === 'partial';

  const isPartialOrInstallment =
    isExplicitOnAccount ||
    s.settled_via_collections === true ||
    (s.status || '').toLowerCase() === 'partial' ||
    (s.status || '').toLowerCase() === 'on account' ||
    (s.sales_status || '').toLowerCase() === 'partial' ||
    (s.sales_status || '').toLowerCase() === 'on account' ||
    (Number(s.down_payment) > 0 && Number(s.down_payment) < netReceivable - 0.5) ||
    matchingColls.some(c => Array.isArray(c.installments) && c.installments.length > 1) ||
    matchingColls.some(c => (c.type_of_transaction || '').toUpperCase().includes('ACCOUNT')) ||
    matchingColls.filter(c => !/receivable tracking/i.test(String(c.particulars || ''))).length > 1;

  return isExplicitCashType && !isPartialOrInstallment && !s.settled_via_collections;
}

export function computeSaleSettlement(sale: any, collections: any[]): SettlementSummary {
  const b = getSaleBookedAmounts(sale);
  if (isDirectFullCashSale(sale, collections)) {
    const cashDue = Math.max(0, r2(b.netReceivable - b.w2307));
    return summarizeSettlement(b.netReceivable, b.w2307, [{
      date: sale.date || '', cash: cashDue, discount: 0, withholding: b.w2307, sourceId: Number(sale.id) || 0, seq: 0, installmentNo: 1
    }]);
  }
  return summarizeSettlement(b.netReceivable, b.w2307, getSaleSettlementEvents(sale, collections));
}

// ---------------------------------------------------------------------------
// PURCHASES — what the Subsidiary Purchases book recognises (A/P after trade discount)
// ---------------------------------------------------------------------------
export function getPurchaseBookedAmounts(e: any) {
  const isVat = e.vat_or_nonvat === 'VAT' || e.nonvat_or_vat === 'VAT' || e.business_tax_type === 'vatable' || (Number(e.vat_amount || e.vat_input_amount) > 0);
  const discounts = Number(e.discount ?? e.discounts ?? e.less_discount) || 0;
  const w2307 = Number(e.tax_withheld ?? e.withholding_2307_2306 ?? e.less_withholding_tax) || 0;
  const due = Number(e.total_amount_due) || 0;
  const rawGross = Number(e.amount ?? e.expense_invoice_amount ?? e.total_amount_vat_inclusive) || 0;

  // total_amount_due is already (gross − trade discount − EWT) → add the EWT back to get the A/P that is booked
  const netPayable = due > 0
    ? r2(due + w2307)
    : Math.max(0, r2(rawGross - discounts));

  let expBase = netPayable;
  let inputVat = 0;
  if (isVat) {
    expBase = r2(netPayable / 1.12);
    inputVat = r2(netPayable - expBase);
  }
  return { isVat, discounts, w2307, netPayable, expBase, inputVat };
}

export function purchasePaymentMatches(p: any, e: any): boolean {
  const vNo = normalizeDocNo(e.voucher_number || e.invoice_number || `EXP-${e.id}`);
  const vOnly = normalizeDocNo(e.voucher_number);
  const iOnly = normalizeDocNo(e.invoice_number);
  const pv = normalizeDocNo(p.voucher_number);
  const pi = normalizeDocNo(p.invoice_number);
  const keys = [vNo, vOnly, iOnly].filter(Boolean);
  return keys.some(k => k === pv || k === pi);
}

export function getPurchaseSettlementEvents(exp: any, payments: any[]): SettlementEvent[] {
  const tradeDiscount = getPurchaseBookedAmounts(exp).discounts;
  const rows = payments
    .filter(p => !p.is_cancelled && purchasePaymentMatches(p, exp))
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const events: SettlementEvent[] = [];
  rows.forEach(p => {
    const payDate = p.date || p.payment_date || '';
    if (Array.isArray(p.installments) && p.installments.length > 0) {
      p.installments.forEach((inst: any, i: number) => {
        const cash = numOf(inst.cash_amount);
        const discount = numOf(inst.discount);
        const withholding = numOf(inst.wtax_2307);
        if (cash <= 0 && discount <= 0 && withholding <= 0) return;
        events.push({
          date: inst.date || payDate,
          cash, discount, withholding,
          sourceId: Number(p.id) || 0,
          seq: i,
          installmentNo: Number(inst.payment_no) || i + 1
        });
      });
      return;
    }
    const cash = p.amount_paid !== undefined ? numOf(p.amount_paid) : numOf(p.amount);
    const rawDiscount = numOf(firstDefined(p.discount, p.discounts, p.less_discount));
    // Payment rows only mirror the invoice trade discount (already booked as a reduced expense) — never discount twice
    const isTradeDiscountCopy = rawDiscount > 0 && Math.abs(rawDiscount - tradeDiscount) < 0.005;
    const discount = isTradeDiscountCopy ? 0 : rawDiscount;
    const withholding = numOf(firstDefined(p.withholding_tax_2307, p.tax_withheld, p.amount_withheld_2307));
    if (cash <= 0 && discount <= 0 && withholding <= 0) return;
    events.push({
      date: payDate, cash, discount, withholding,
      sourceId: Number(p.id) || 0, seq: 0, installmentNo: events.length + 1
    });
  });
  return events;
}

export function isDirectFullCashPurchase(e: any, payments: any[]): boolean {
  const { netPayable } = getPurchaseBookedAmounts(e);
  const vNo = e.voucher_number || e.invoice_number || `EXP-${e.id}`;
  const matchingPmts = payments.filter(p => !p.is_cancelled && purchasePaymentMatches(p, e));
  const isExplicitExpCash = (e.type_of_transaction || '').toUpperCase().includes('CASH') || (e.payment_type || '').toLowerCase() === 'cash';
  const isExplicitExpOnAccount = (e.type_of_transaction || '').toUpperCase().includes('ACCOUNT') || (e.payment_type || '').toLowerCase() === 'on_account' || (e.payment_type || '').toLowerCase() === 'partial';

  const isExpPartial =
    isExplicitExpOnAccount ||
    e.settled_via_collections === true ||
    (e.status || '').toLowerCase() === 'partial' ||
    (e.status || '').toLowerCase() === 'on account' ||
    (e.expense_status || '').toLowerCase() === 'partial' ||
    (e.expense_status || '').toLowerCase() === 'on account' ||
    (Number(e.down_payment) > 0 && Number(e.down_payment) < netPayable - 0.5) ||
    matchingPmts.some(p => Array.isArray(p.installments) && p.installments.length > 1) ||
    matchingPmts.some(p => (p.type_of_transaction || '').toUpperCase().includes('ACCOUNT')) ||
    matchingPmts.length > 1;

  void vNo;
  return isExplicitExpCash && !isExpPartial && !e.settled_via_collections;
}

export function computePurchaseSettlement(exp: any, payments: any[]): SettlementSummary {
  const b = getPurchaseBookedAmounts(exp);
  if (isDirectFullCashPurchase(exp, payments)) {
    const cashDue = Math.max(0, r2(b.netPayable - b.w2307));
    return summarizeSettlement(b.netPayable, b.w2307, [{
      date: exp.date || '', cash: cashDue, discount: 0, withholding: b.w2307, sourceId: Number(exp.id) || 0, seq: 0, installmentNo: 1
    }]);
  }
  return summarizeSettlement(b.netPayable, b.w2307, getPurchaseSettlementEvents(exp, payments));
}

/** Lists every journal entry whose debits and credits differ by more than a centavo (for audit / UI warnings). */
export function getJournalImbalances(entries: JournalEntry[]) {
  const out: Array<{ entry_no: string; description: string; debit: number; credit: number; difference: number }> = [];
  entries.forEach(e => {
    const dr = r2((e.debits || []).reduce((s, l) => s + (Number(l.amount) || 0), 0));
    const cr = r2((e.credits || []).reduce((s, l) => s + (Number(l.amount) || 0), 0));
    if (Math.abs(dr - cr) > 0.009) {
      out.push({ entry_no: (e as any).entry_no, description: (e as any).description, debit: dr, credit: cr, difference: r2(dr - cr) });
    }
  });
  return out;
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
  let sjCounter = 1;
  let gjCounter = 1;

  const getSjNo = () => {
    return `GJ${sjCounter++}`;
  };

  const getGjNo = () => {
    return `GJ${sjCounter++}`;
  };

  // Direct full cash sales / purchases are journalized by the Cash Receipts / Cash Disbursements books and are
  // skipped by the Collections / Payments books through isDirectFullCashSale() / isDirectFullCashPurchase()
  // (Clarifications 5.4 & 6.3: no duplicate journal entry).

  // Filter out any legacy auto-generated SJ-SLS / SJ-COL / SJ-PUR / SJ-DIS special entries to prevent double-counting
  const manualSpecialEntries = [...specialEntries].filter(s => {
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
  }).sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  // Sort sales & expenses chronologically (oldest first, by id / created_at) so Invoice #1 is always GJ1 and Invoice #2 is GJ2
  const sortedSales = [...sales].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  const sortedExpenses = [...expenses].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  // 1. SUBSIDIARY SALES -> Always generates Sales Recognition Journal Entry:
  // Dr Accounts Receivable (Gross VAT-inclusive less trade discount), Dr Sales Discounts
  // Cr Vatable Sales, Cr Output VAT Payable (and Zero-Rated / VAT-Exempt)
  // The trade discount contrasts SALES here; the A/R that is booked is therefore already net of discount.
  const recognizedSaleInvoices = new Set<string>();

  sortedSales.forEach(s => {
    if (s.is_cancelled || s.sales_status === 'Cancelled') return;

    const customerName = s.registered_name || s.customer_name || s.client_name || 'Customer';
    const booked = getSaleBookedAmounts(s);
    const { isVat, zeroRated, vatExempt, discounts, vatableSales, vatOutput, totalGrossSales, netReceivable } = booked;
    const w2307 = Math.min(booked.w2307, netReceivable);
    if (totalGrossSales <= 0) return;

    const normInvRecognized = normalizeDocNo(s.invoice_number);
    if (normInvRecognized) recognizedSaleInvoices.add(normInvRecognized);

    const saleDate = s.date || s.invoice_date || s.issue_date || new Date().toISOString().split('T')[0];

    const entry1Credits: Array<{ account_code: string; account_title: string; amount: number }> = [];
    if (vatableSales > 0) {
      entry1Credits.push({ account_code: '4010', account_title: isVat ? 'Vatable Sales' : 'Sales Revenue', amount: vatableSales });
    }
    if (vatOutput > 0) {
      entry1Credits.push({ account_code: '2020', account_title: 'Output VAT Payable', amount: vatOutput });
    }
    if (zeroRated > 0) {
      entry1Credits.push({ account_code: '4020', account_title: 'Zero-Rated Sales', amount: zeroRated });
    }
    if (vatExempt > 0) {
      entry1Credits.push({ account_code: '4030', account_title: 'VAT-Exempt Sales', amount: vatExempt });
    }
    if (entry1Credits.length === 0) {
      entry1Credits.push({ account_code: '4010', account_title: 'Sales Revenue', amount: totalGrossSales });
    }

    const saleDebits: Array<{ account_code: string; account_title: string; amount: number }> = [
      { account_code: '1020', account_title: 'Accounts Receivable', amount: netReceivable }
    ];
    if (discounts > 0) {
      saleDebits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: Math.min(discounts, totalGrossSales) });
    }

    entries.push({
      id: idCounter++,
      _sortKey: Number(s.id) || 0,
      company_name: s.company_name || companyName,
      entry_no: '',
      date: saleDate,
      ref_type: 'Sales',
      ref_no: s.invoice_number,
      description: `Subsidiary Sales: Invoice #${s.invoice_number} - ${customerName} (${s.status || s.sales_status || 'Recorded'})`,
      debits: saleDebits,
      credits: entry1Credits
    } as any);

    // 5.3 Direct full cash sale -> Cash Receipts Book posts ONE compound entry:
    // Dr Cash (net received), Dr Creditable Withholding Tax (2307), Cr Accounts Receivable
    if (isDirectFullCashSale(s, collections)) {
      const cashReceived = Math.max(0, Math.round((netReceivable - w2307) * 100) / 100);
      const crDebits: Array<{ account_code: string; account_title: string; amount: number }> = [];
      if (cashReceived > 0) {
        crDebits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashReceived });
      }
      if (w2307 > 0) {
        crDebits.push({ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307 });
      }
      if (crDebits.length > 0) {
        entries.push({
          id: idCounter++,
          _sortKey: (Number(s.id) || 0) + 0.1,
          company_name: s.company_name || companyName,
          entry_no: '',
          date: saleDate,
          ref_type: 'Collection',
          ref_no: s.invoice_number,
          description: `Cash Receipts Book: Full Cash Collection for Invoice #${s.invoice_number} - ${customerName}`,
          debits: crDebits,
          credits: [{ account_code: '1020', account_title: 'Accounts Receivable', amount: netReceivable }]
        } as any);
      }
    }
  });

  // 2. COLLECTIONS BOOK -> Journalizes installment / partial / on-account payments (6.4)
  //   Entry 2a (each collection):      Dr Cash, (Dr Sales Discounts), Cr Accounts Receivable
  //   Entry 2b (CWT 2307 recognition): Dr Creditable Withholding Tax, Cr Accounts Receivable
  // Every invoice is settled through computeSaleSettlement(), so A/R always clears to zero once the invoice is paid.
  const ordinalOf = (n: number, word: string) =>
    n === 1 ? 'first payment/down payment' : n === 2 ? `for 2nd ${word}` : `for #${n} ${word}`;

  const emitSaleSettlementEntries = (
    invoiceNo: string,
    customerName: string,
    entryCompany: string,
    events: SettlementEvent[],
    cwtPlug: number
  ) => {
    events.forEach((ev, i) => {
      const n = i + 1;
      const base = (Number(ev.sourceId) || 0) + ev.seq * 0.001;
      const date = ev.date || new Date().toISOString().split('T')[0];
      const colDebits: Array<{ account_code: string; account_title: string; amount: number }> = [];
      if (ev.cash > 0) colDebits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: ev.cash });
      if (ev.discount > 0) colDebits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: ev.discount });
      const arOffset = Math.round((ev.cash + ev.discount) * 100) / 100;
      if (arOffset > 0) {
        entries.push({
          id: idCounter++,
          _sortKey: base + 0.1,
          company_name: entryCompany,
          entry_no: '',
          date,
          ref_type: 'Collection',
          ref_no: invoiceNo,
          description: `Collections Book — Journal entry ${n} (${ordinalOf(n, 'collection')}): Invoice #${invoiceNo} - ${customerName}`,
          debits: colDebits,
          credits: [{ account_code: '1020', account_title: 'Accounts Receivable', amount: arOffset }]
        } as any);
      }
      if (ev.withholding > 0) {
        entries.push({
          id: idCounter++,
          _sortKey: base + 0.102,
          company_name: entryCompany,
          entry_no: '',
          date,
          ref_type: 'Collection',
          ref_no: invoiceNo,
          description: `Collections Book — Journal entry ${n} (to recognize CWT 2307): Invoice #${invoiceNo} - ${customerName}`,
          debits: [{ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: ev.withholding }],
          credits: [{ account_code: '1020', account_title: 'Accounts Receivable', amount: ev.withholding }]
        } as any);
      }
    });

    if (cwtPlug > 0.005 && events.length > 0) {
      const last = events[events.length - 1];
      entries.push({
        id: idCounter++,
        _sortKey: (Number(last.sourceId) || 0) + last.seq * 0.001 + 0.104,
        company_name: entryCompany,
        entry_no: '',
        date: last.date || new Date().toISOString().split('T')[0],
        ref_type: 'Collection',
        ref_no: invoiceNo,
        description: `Collections Book — Journal entry ${events.length} (to recognize full payment CWT 2307): Invoice #${invoiceNo} - ${customerName}`,
        debits: [{ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: cwtPlug }],
        credits: [{ account_code: '1020', account_title: 'Accounts Receivable', amount: cwtPlug }]
      } as any);
    }
  };

  sortedSales.forEach(s => {
    if (s.is_cancelled || s.sales_status === 'Cancelled') return;
    const normInv = normalizeDocNo(s.invoice_number);
    if (!normInv || !recognizedSaleInvoices.has(normInv)) return;
    if (isDirectFullCashSale(s, collections)) return; // already posted by the Cash Receipts Book (5.4: no duplicate)

    const settlement = computeSaleSettlement(s, collections);
    if (settlement.events.length === 0) return;
    const customerName = s.registered_name || s.customer_name || s.client_name || 'Customer';
    emitSaleSettlementEntries(
      s.invoice_number,
      customerName,
      s.company_name || companyName,
      settlement.events,
      settlement.withholdingPlug
    );
  });

  // Collections whose invoice is not in Subsidiary Sales (stand-alone / imported collections): post them as recorded
  const sortedCollections = [...collections].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  const orphanGroups = new Map<string, any[]>();
  sortedCollections.forEach(c => {
    if (c.is_cancelled) return;
    const normInv = normalizeDocNo(c.invoice_number);
    if (normInv && recognizedSaleInvoices.has(normInv)) return;
    const key = normInv || `row-${c.id}`;
    if (!orphanGroups.has(key)) orphanGroups.set(key, []);
    orphanGroups.get(key)!.push(c);
  });
  orphanGroups.forEach(rows => {
    const first = rows[0];
    const pseudoSale = { invoice_number: first.invoice_number, id: -1, discount: 0 };
    const events: SettlementEvent[] = [];
    rows.forEach(c => {
      const evs = getSaleSettlementEvents({ ...pseudoSale, invoice_number: c.invoice_number || `ROW-${c.id}` }, [c]);
      evs.forEach(ev => events.push({ ...ev, installmentNo: events.length + 1 }));
    });
    if (events.length === 0) return;
    emitSaleSettlementEntries(
      first.invoice_number,
      first.registered_name || first.customer_name || first.client_name || 'Customer',
      first.company_name || companyName,
      events,
      0
    );
  });

  // 3. SUBSIDIARY PURCHASES / EXPENSES -> Always generates Expense Recognition Journal Entry:
  // Dr Expense (net of VAT & trade discount), Dr Input VAT, Cr Accounts Payable
  // The trade discount contrasts the EXPENSE (it is recorded net), so A/P that is booked is already net of discount.
  const recognizedExpenseKeys: any[] = [];

  sortedExpenses.forEach(e => {
    if (e.is_cancelled || e.expense_status === 'Cancelled') return;

    const providerName = e.registered_name || e.service_provider_name || 'Vendor';
    const pb = getPurchaseBookedAmounts(e);
    const grossPayable = pb.netPayable;
    const expBase = pb.expBase;
    const inputVat = pb.inputVat;
    const w2307 = Math.min(pb.w2307, grossPayable);

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
      _sortKey: Number(e.id) || 0,
      company_name: e.company_name || companyName,
      entry_no: '',
      date: expDate,
      ref_type: 'Expense',
      ref_no: vNo,
      description: `Subsidiary Purchases: Voucher #${vNo} - ${providerName} (${expType})`,
      debits: expDebits,
      credits: [{ account_code: '2010', account_title: 'Accounts Payable', amount: grossPayable }]
    } as any);
    recognizedExpenseKeys.push(e);

    // Direct full cash purchase -> Cash Disbursements Book posts ONE compound entry
    if (isDirectFullCashPurchase(e, payments)) {
      const cashPaid = Math.max(0, Math.round((grossPayable - w2307) * 100) / 100);
      const cdCredits: Array<{ account_code: string; account_title: string; amount: number }> = [
        { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cashPaid }
      ];
      if (w2307 > 0) {
        cdCredits.push({ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 });
      }
      entries.push({
        id: idCounter++,
        _sortKey: (Number(e.id) || 0) + 0.1,
        company_name: e.company_name || companyName,
        entry_no: '',
        date: expDate,
        ref_type: 'Payment',
        ref_no: vNo,
        description: `Cash Disbursements Book: Full Payment for Voucher #${vNo} - ${providerName}`,
        debits: [{ account_code: '2010', account_title: 'Accounts Payable', amount: grossPayable }],
        credits: cdCredits
      } as any);
    }
  });

  // 4. PAYMENTS BOOK -> Journalizes partial / on-account payments
  //   Entry 2a (each payment):          Dr Accounts Payable, Cr Cash, (Cr Purchase Discounts)
  //   Entry 2b (EWT recognition):       Dr Accounts Payable, Cr Expanded Withholding Tax Payable
  const emitPurchaseSettlementEntries = (
    vNo: string,
    providerName: string,
    entryCompany: string,
    events: SettlementEvent[],
    ewtPlug: number
  ) => {
    events.forEach((ev, i) => {
      const n = i + 1;
      const base = (Number(ev.sourceId) || 0) + ev.seq * 0.001;
      const date = ev.date || new Date().toISOString().split('T')[0];
      const apOffset = Math.round((ev.cash + ev.discount) * 100) / 100;
      if (apOffset > 0) {
        const credits: Array<{ account_code: string; account_title: string; amount: number }> = [];
        if (ev.cash > 0) credits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: ev.cash });
        if (ev.discount > 0) credits.push({ account_code: '5015', account_title: 'Purchase Discounts', amount: ev.discount });
        entries.push({
          id: idCounter++,
          _sortKey: base + 0.1,
          company_name: entryCompany,
          entry_no: '',
          date,
          ref_type: 'Payment',
          ref_no: vNo,
          description: `Payments Book — Journal entry ${n} (${ordinalOf(n, 'payment')}): Voucher #${vNo} - ${providerName}`,
          debits: [{ account_code: '2010', account_title: 'Accounts Payable', amount: apOffset }],
          credits
        } as any);
      }
      if (ev.withholding > 0) {
        entries.push({
          id: idCounter++,
          _sortKey: base + 0.102,
          company_name: entryCompany,
          entry_no: '',
          date,
          ref_type: 'Payment',
          ref_no: vNo,
          description: `Payments Book — Journal entry ${n} (to recognize EWT): Voucher #${vNo} - ${providerName}`,
          debits: [{ account_code: '2010', account_title: 'Accounts Payable', amount: ev.withholding }],
          credits: [{ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: ev.withholding }]
        } as any);
      }
    });

    if (ewtPlug > 0.005 && events.length > 0) {
      const last = events[events.length - 1];
      entries.push({
        id: idCounter++,
        _sortKey: (Number(last.sourceId) || 0) + last.seq * 0.001 + 0.104,
        company_name: entryCompany,
        entry_no: '',
        date: last.date || new Date().toISOString().split('T')[0],
        ref_type: 'Payment',
        ref_no: vNo,
        description: `Payments Book — Journal entry ${events.length} (to recognize full payment EWT): Voucher #${vNo} - ${providerName}`,
        debits: [{ account_code: '2010', account_title: 'Accounts Payable', amount: ewtPlug }],
        credits: [{ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: ewtPlug }]
      } as any);
    }
  };

  recognizedExpenseKeys.forEach(e => {
    if (isDirectFullCashPurchase(e, payments)) return; // already posted by Cash Disbursements Book (no duplicate)
    const settlement = computePurchaseSettlement(e, payments);
    if (settlement.events.length === 0) return;
    const vNo = e.voucher_number || e.invoice_number || `EXP-${e.id}`;
    emitPurchaseSettlementEntries(
      vNo,
      e.registered_name || e.service_provider_name || 'Vendor',
      e.company_name || companyName,
      settlement.events,
      settlement.withholdingPlug
    );
  });

  // Payments whose voucher is not in Subsidiary Purchases (stand-alone / imported payments): post them as recorded
  const sortedPayments = [...payments].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  sortedPayments.forEach(p => {
    if (p.is_cancelled) return;
    if (recognizedExpenseKeys.some(e => purchasePaymentMatches(p, e))) return;
    const vNo = p.voucher_number || p.invoice_number || `PAY-${p.id}`;
    const pseudoExp = { voucher_number: p.voucher_number, invoice_number: p.invoice_number, id: -1, total_amount_due: 0, discount: 0 };
    const events = getPurchaseSettlementEvents(pseudoExp, [p]);
    if (events.length === 0) return;
    emitPurchaseSettlementEntries(
      vNo,
      p.registered_name || p.service_provider_name || 'Vendor',
      p.company_name || companyName,
      events,
      0
    );
  });

  // 5. PPE Asset Acquisition, Pro-Rata Depreciation (PAS 16), Revaluation Surplus (PAS 16), Impairment (PAS 36) & Held-for-Sale Freeze (PFRS 5)
  const sortedPpe = [...ppeAssets].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  sortedPpe.forEach(p => {
    const cost = Number(p.acquisition_cost) || 0;
    const dep = Number(p.accumulated_depreciation) || 0;
    const revSurplus = Number(p.revaluation_surplus) || 0;
    const impLoss = Number(p.impairment_loss) || 0;
    const isHeldForSale = Boolean(p.is_held_for_sale || p.status === 'Held for Sale');
    const acqDate = p.acquisition_date || new Date().toISOString().split('T')[0];

    if (cost > 0) {
      // PFRS 5.25: If classified as Held for Sale, classify under Current Asset 1090; otherwise Non-Current PPE 1510
      const targetAssetCode = isHeldForSale ? '1090' : '1510';
      const targetAssetTitle = isHeldForSale ? 'Non-Current Assets Held for Sale (PFRS 5)' : 'Property, Plant & Equipment';
      entries.push({
        id: idCounter++,
        _sortKey: Number(p.id) || 0,
        company_name: p.company_name || companyName,
        entry_no: '',
        date: acqDate,
        ref_type: 'PPE Acquisition',
        ref_no: p.asset_code || String(p.id),
        description: `Acquisition of ${isHeldForSale ? 'Asset Held for Sale (PFRS 5)' : 'Property, Plant & Equipment (PAS 16)'}: ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: targetAssetCode, account_title: targetAssetTitle, amount: cost }
        ],
        credits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: cost }
        ]
      } as any);
    }

    // PFRS 5.25: Cease depreciation while asset is classified as Held for Sale; only record accumulated depreciation prior to HFS
    if (dep > 0 && !isHeldForSale) {
      entries.push({
        id: idCounter++,
        _sortKey: (Number(p.id) || 0) + 0.1,
        company_name: p.company_name || companyName,
        entry_no: '',
        date: acqDate,
        ref_type: 'Depreciation',
        ref_no: p.asset_code || String(p.id),
        description: `PAS 16 Pro-Rata Depreciation Expense for PPE Asset: ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: '6080', account_title: 'Depreciation Expense', amount: dep }
        ],
        credits: [
          { account_code: '1520', account_title: 'Accumulated Depreciation', amount: dep }
        ]
      } as any);
    }

    // PAS 16.39: Revaluation Model Surplus routed to Other Comprehensive Income (OCI #3040)
    if (revSurplus > 0 && p.measurement_model === 'Revaluation') {
      entries.push({
        id: idCounter++,
        _sortKey: (Number(p.id) || 0) + 0.15,
        company_name: p.company_name || companyName,
        entry_no: '',
        date: acqDate,
        ref_type: 'PAS 16 Revaluation',
        ref_no: p.asset_code || String(p.id),
        description: `PAS 16 Revaluation Increase to Fair Value (OCI): ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: '1510', account_title: 'Property, Plant & Equipment', amount: revSurplus }
        ],
        credits: [
          { account_code: '3040', account_title: 'Revaluation Surplus (OCI - PAS 16)', amount: revSurplus }
        ]
      } as any);
    }

    // PAS 36.60: Impairment Loss recognition when Recoverable Amount < Carrying Amount
    if (impLoss > 0) {
      entries.push({
        id: idCounter++,
        _sortKey: (Number(p.id) || 0) + 0.2,
        company_name: p.company_name || companyName,
        entry_no: '',
        date: acqDate,
        ref_type: 'PAS 36 Impairment',
        ref_no: p.asset_code || String(p.id),
        description: `PAS 36 Impairment Write-Down on Asset: ${p.asset_name} (${p.asset_code})`,
        debits: [
          { account_code: '6085', account_title: 'Impairment Loss (PAS 36 / PFRS 9 ECL)', amount: impLoss }
        ],
        credits: [
          { account_code: '1520', account_title: 'Accumulated Depreciation & Impairment', amount: impLoss }
        ]
      } as any);
    }
  });

  // 6. Payroll Entries
  const sortedPayroll = [...payrollRecords].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  sortedPayroll.forEach(pr => {
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
      _sortKey: Number(pr.id) || 0,
      company_name: pr.company_name || companyName,
      entry_no: '',
      date: new Date().toISOString().split('T')[0],
      ref_type: 'Payroll',
      ref_no: String(pr.employee_id || ''),
      description: `Payroll Processing for ${pr.full_name || pr.employee_name || pr.employee_id} (${pr.payroll_period || 'Current'})`,
      debits,
      credits
    } as any);
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
      _sortKey: Number(s.id) || 0,
      company_name: s.company_name || companyName,
      entry_no: '',
      date: s.entry_date || new Date().toISOString().split('T')[0],
      ref_type: s.entry_type || 'Adjusting Entry',
      ref_no: s.voucher_no || s.entry_number || `SJ-${s.id}`,
      description: s.description ? (s.description.startsWith('[') ? s.description : `[${s.entry_type || 'Special'}] ${s.description}`) : `Special Entry #${s.voucher_no || s.id}`,
      debits,
      credits
    } as any);
  });

  // Rounding guard: absorb centavo-level rounding differences (<= 5 centavos) so no entry is ever out of balance
  entries.forEach((entry: any) => {
    const dr = Math.round(entry.debits.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0) * 100) / 100;
    const cr = Math.round(entry.credits.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0) * 100) / 100;
    const diff = Math.round((dr - cr) * 100) / 100;
    if (diff !== 0 && Math.abs(diff) <= 0.05) {
      const side = diff > 0 ? entry.credits : entry.debits;
      if (side.length > 0) {
        side[side.length - 1].amount = Math.round(((Number(side[side.length - 1].amount) || 0) + Math.abs(diff)) * 100) / 100;
      }
    }
  });

  // Sort strictly chronologically by _sortKey so GJ1, GJ2, GJ3... never swap or change when new transactions are added
  entries.sort((a: any, b: any) => (a._sortKey || 0) - (b._sortKey || 0));
  entries.forEach((entry: any, idx) => {
    entry.id = idx + 1;
    entry.entry_no = `GJ${idx + 1}`;
    delete entry._sortKey;
  });

  return entries;
}

export interface AccountingSummaryResult {
  // Balance Sheet Assets (PAS 1 Current vs Non-Current & Contra-Assets)
  cash: number;
  arGross: number;
  allowanceForECL: number;
  ar: number;
  customerAdvances: number;
  inputVat: number;
  cwt2307: number;
  prepaidExpenses: number;
  contractAssets: number;
  assetsHeldForSale: number;
  supplierAdvances: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  ppeCost: number;
  accumDep: number;
  netPPE: number;
  rouAssetNet: number;
  intangibleAssets: number;
  deferredTaxAsset: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  totalAssets: number;

  // Balance Sheet Liabilities (PAS 1 Current vs Non-Current)
  ap: number;
  outputVat: number;
  netVatPayable: number;
  ewtPayable: number;
  payrollDeductionsPayable: number;
  incomeTaxPayable: number;
  contractLiabilities: number;
  leaseLiabilityCurrent: number;
  provisionsCurrent: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  loansPayableNonCurrent: number;
  leaseLiabilityNonCurrent: number;
  deferredTaxLiability: number;
  retirementBenefitObligation: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  totalLiabilities: number;

  // Income Statement & OCI (PAS 1 / PFRS 18)
  vatableSales: number;
  zeroRatedSales: number;
  vatExemptSales: number;
  salesDiscounts: number;
  grossRevenue: number;
  totalOperatingExp: number;
  depreciationExpense: number;
  impairmentExpense: number;
  financeCosts: number;
  payrollExpense: number;
  specialRev: number;
  specialExp: number;
  operatingProfit: number;
  netIncomeBeforeTax: number;
  incomeTaxProvision: number;
  deferredTaxExpense: number;
  netIncome: number;
  // Other Comprehensive Income (OCI)
  revaluationSurplusOCI: number;
  actuarialRemeasurementOCI: number;
  fvociReserveOCI: number;
  totalOCI: number;
  totalComprehensiveIncome: number;

  // Equity (PAS 1)
  capitalStock: number;
  ownerDrawings: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  unrealizedGainLoss: number;
  isBalanced: boolean;
  hasRetrospectiveRestatement: boolean;

  // Cash Flow Metrics (PAS 7 Direct & Indirect Method)
  cashInflowsFromCustomers: number;
  cashOutflowsToSuppliersAndExpenses: number;
  cashOutflowsToPayroll: number;
  netOperatingCashFlow: number;
  netInvestingCashFlow: number;
  netFinancingCashFlow: number;
  // PAS 7 Indirect Method Working Capital Adjustments
  wcChangeInAR: number;
  wcChangeInPrepaidsAndTaxAssets: number;
  wcChangeInAPAndAccruals: number;
  wcChangeInTaxAndStatutoryPayables: number;

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

  // 1. Assets (PAS 1 Current vs Non-Current & Contra-Assets)
  const cash = getNet('1010');
  const rawAr = getNet('1020');
  const arGross = rawAr > 0 ? rawAr : 0;
  const customerAdvances = rawAr < 0 ? Math.abs(rawAr) : 0;
  // PFRS 9 Contra-Asset: Allowance for Expected Credit Losses (#1025)
  const allowanceForECL = Math.max(0, getCr('1025') - getDr('1025'));
  const ar = Math.max(0, Math.round((arGross - allowanceForECL) * 100) / 100);

  const inputVat = getNet('1030');
  const cwt2307 = getNet('1040');
  const prepaidExpenses = getNet('1050');
  const contractAssets = getNet('1060');
  const assetsHeldForSale = getNet('1090');

  // Check if AP has a debit balance (supplier advances — PAS 1.32 No Offsetting)
  const rawAp = getNet('2010'); // Liability: Cr - Dr
  const ap = rawAp > 0 ? rawAp : 0;
  const supplierAdvances = rawAp < 0 ? Math.abs(rawAp) : 0;

  // Non-Current Assets (15xx+)
  const ppeCost = getNet('1510');
  const accumDep = Math.max(0, getCr('1520') - getDr('1520'));
  const netPPE = Math.round((ppeCost - accumDep) * 100) / 100;

  const rouAssetCost = getNet('1530');
  const rouAccumDep = Math.max(0, getCr('1535') - getDr('1535'));
  const rouAssetNet = Math.round((rouAssetCost - rouAccumDep) * 100) / 100;
  const intangibleAssets = getNet('1540');
  // PAS 1.56: Deferred Tax Assets must ALWAYS be classified as Non-Current
  const deferredTaxAsset = getNet('1550');

  let otherCurrentAssets = 0;
  let otherNonCurrentAssets = 0;
  const knownAssetCodes = ['1010', '1020', '1025', '1030', '1040', '1050', '1060', '1090', '1510', '1520', '1530', '1535', '1540', '1550'];

  Object.values(accountMap).forEach(acc => {
    if (acc.code.startsWith('1') && !knownAssetCodes.includes(acc.code)) {
      const meta = accountTitles.find(a => a.code === acc.code);
      const isNonCurrent =
        acc.code.startsWith('15') ||
        acc.code.startsWith('16') ||
        acc.code.startsWith('17') ||
        acc.code.startsWith('18') ||
        acc.code.startsWith('19') ||
        meta?.pfrs_classification === 'Non-Current Asset' ||
        (meta?.category || '').toLowerCase().includes('non-current');
      if (isNonCurrent) {
        otherNonCurrentAssets += acc.netBalance;
      } else {
        otherCurrentAssets += acc.netBalance;
      }
    }
  });

  otherCurrentAssets = Math.round(otherCurrentAssets * 100) / 100;
  otherNonCurrentAssets = Math.round(otherNonCurrentAssets * 100) / 100;

  const totalCurrentAssets = Math.round(
    (cash + ar + supplierAdvances + inputVat + cwt2307 + prepaidExpenses + contractAssets + assetsHeldForSale + otherCurrentAssets) * 100
  ) / 100;
  const totalNonCurrentAssets = Math.round(
    (netPPE + rouAssetNet + intangibleAssets + deferredTaxAsset + otherNonCurrentAssets) * 100
  ) / 100;
  const totalAssets = Math.round((totalCurrentAssets + totalNonCurrentAssets) * 100) / 100;

  // 2. Liabilities (PAS 1 Current vs Non-Current)
  const outputVat = getNet('2020');
  const netVatPayable = Math.max(0, Math.round((outputVat - inputVat) * 100) / 100);
  const ewtPayable = getNet('2030');
  const payrollDeductionsPayable = Math.round((getNet('2035') + getNet('2041') + getNet('2042') + getNet('2043') + getNet('2050')) * 100) / 100;
  const recordedIncomeTaxPayable = getNet('2040');
  const contractLiabilities = getNet('2060');
  const leaseLiabilityCurrent = getNet('2070');
  const provisionsCurrent = getNet('2080');

  // Non-Current Liabilities (25xx+)
  const loansPayableNonCurrent = getNet('2510');
  const leaseLiabilityNonCurrent = getNet('2520');
  // PAS 1.56: Deferred Tax Liabilities must ALWAYS be classified as Non-Current
  const deferredTaxLiability = getNet('2530');
  const retirementBenefitObligation = getNet('2540');

  let otherCurrentLiabilities = 0;
  let otherNonCurrentLiabilities = 0;
  const knownLiabCodes = [
    '2010', '2020', '2030', '2035', '2040', '2041', '2042', '2043', '2050',
    '2060', '2070', '2080', '2510', '2520', '2530', '2540'
  ];

  Object.values(accountMap).forEach(acc => {
    if (acc.code.startsWith('2') && !knownLiabCodes.includes(acc.code)) {
      const meta = accountTitles.find(a => a.code === acc.code);
      const isNonCurrent =
        acc.code.startsWith('25') ||
        acc.code.startsWith('26') ||
        acc.code.startsWith('27') ||
        acc.code.startsWith('28') ||
        acc.code.startsWith('29') ||
        meta?.pfrs_classification === 'Non-Current Liability' ||
        (meta?.category || '').toLowerCase().includes('non-current') ||
        acc.title.toLowerCase().includes('long-term') ||
        acc.title.toLowerCase().includes('non-current');
      if (isNonCurrent) {
        otherNonCurrentLiabilities += acc.netBalance;
      } else {
        otherCurrentLiabilities += acc.netBalance;
      }
    }
  });

  otherCurrentLiabilities = Math.round(otherCurrentLiabilities * 100) / 100;
  otherNonCurrentLiabilities = Math.round(otherNonCurrentLiabilities * 100) / 100;

  // 3. Revenues & Expenses (Income Statement — PAS 1 / PFRS 18)
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
  const impairmentExpense = getNet('6085');
  const financeCosts = getNet('6090');
  const payrollExpense = Math.round((getNet('6010') + getNet('6015') + getNet('6016') + getNet('6017')) * 100) / 100;

  let totalOperatingExp = 0;
  Object.values(accountMap).forEach(acc => {
    if ((acc.code.startsWith('5') || acc.code.startsWith('6')) && !['6010', '6015', '6016', '6017', '6080', '6085', '6090'].includes(acc.code)) {
      totalOperatingExp += (acc.debit - acc.credit);
    }
  });
  totalOperatingExp = Math.round(totalOperatingExp * 100) / 100;

  // PFRS 18 Operating Profit (before financing and income taxes)
  const operatingProfit = Math.round((grossRevenue - totalOperatingExp - depreciationExpense - impairmentExpense - payrollExpense) * 100) / 100;
  const netIncomeBeforeTax = Math.round((operatingProfit - financeCosts) * 100) / 100;

  // Check if a manual tax provision entry (#7010) or deferred tax (#7020) was posted
  const recordedTaxExpense = getDr('7010') - getCr('7010');
  const deferredTaxExpense = Math.round((getDr('7020') - getCr('7020')) * 100) / 100;
  const incomeTaxProvision = Math.round(((recordedTaxExpense > 0 ? recordedTaxExpense : 0) + deferredTaxExpense) * 100) / 100;
  const incomeTaxPayable = Math.round((recordedIncomeTaxPayable + (recordedTaxExpense > 0 && recordedIncomeTaxPayable === 0 ? recordedTaxExpense : 0)) * 100) / 100;

  const netIncome = Math.round((netIncomeBeforeTax - incomeTaxProvision) * 100) / 100;

  // Other Comprehensive Income (OCI — PAS 1.82A)
  const revaluationSurplusOCI = getNet('3040');
  const actuarialRemeasurementOCI = getNet('3050');
  const fvociReserveOCI = getNet('3060');
  let otherOCI = 0;
  Object.values(accountMap).forEach(acc => {
    const meta = accountTitles.find(a => a.code === acc.code);
    if (acc.code.startsWith('3') && !['3010', '3020', '3030', '3040', '3050', '3060'].includes(acc.code) && meta?.pfrs_classification === 'OCI') {
      otherOCI += acc.netBalance;
    }
  });
  const totalOCI = Math.round((revaluationSurplusOCI + actuarialRemeasurementOCI + fvociReserveOCI + otherOCI) * 100) / 100;
  const totalComprehensiveIncome = Math.round((netIncome + totalOCI) * 100) / 100;

  const totalCurrentLiabilities = Math.round(
    (ap + customerAdvances + outputVat + ewtPayable + payrollDeductionsPayable + incomeTaxPayable + contractLiabilities + leaseLiabilityCurrent + provisionsCurrent + otherCurrentLiabilities) * 100
  ) / 100;
  const totalNonCurrentLiabilities = Math.round(
    (loansPayableNonCurrent + leaseLiabilityNonCurrent + deferredTaxLiability + retirementBenefitObligation + otherNonCurrentLiabilities) * 100
  ) / 100;
  const otherLiabilities = Math.round((contractLiabilities + leaseLiabilityCurrent + provisionsCurrent + otherCurrentLiabilities + totalNonCurrentLiabilities) * 100) / 100;
  const totalLiabilities = Math.round((totalCurrentLiabilities + totalNonCurrentLiabilities) * 100) / 100;

  // 4. Equity (PAS 1)
  const capitalContributions = getCr('3010');
  const ownerDrawings = getDr('3010') + (getDr('3030') - getCr('3030'));
  const capitalStock = Math.round((capitalContributions - ownerDrawings) * 100) / 100;
  const priorRetainedEarnings = getNet('3020');
  const retainedEarnings = Math.round((priorRetainedEarnings + netIncome) * 100) / 100;

  const totalEquity = Math.round((capitalStock + retainedEarnings + totalOCI) * 100) / 100;
  const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
  const unrealizedGainLoss = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

  const hasRetrospectiveRestatement = (input.specialEntries || []).some(
    se => se.accounting_treatment === 'Retrospective Restatement' || (se.entry_type || '').toLowerCase().includes('retrospective')
  );

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

    const hasEquityOrBorrowing =
      je.debits.some(d => d.account_code.startsWith('3') || ['2070', '2510', '2520', '6090'].includes(d.account_code)) ||
      je.credits.some(c => c.account_code.startsWith('3') || ['2070', '2510', '2520', '6090'].includes(c.account_code));
    const hasPPEOrInvesting =
      je.debits.some(d => d.account_code.startsWith('15') || d.account_code === '1090') ||
      je.credits.some(c => c.account_code.startsWith('15') || c.account_code === '1090');

    if (hasEquityOrBorrowing) {
      netFinancingCashFlow += (cashDr - cashCr);
    } else if (hasPPEOrInvesting || je.ref_type === 'PPE Acquisition') {
      netInvestingCashFlow += (cashDr - cashCr);
    } else if (je.ref_type === 'Payroll') {
      cashOutflowsToPayroll += (cashCr - cashDr);
    } else {
      cashInflowsFromCustomers += cashDr;
      cashOutflowsToSuppliersAndExpenses += cashCr;
    }
  });

  const netOperatingCashFlow = Math.round((cashInflowsFromCustomers - cashOutflowsToSuppliersAndExpenses - cashOutflowsToPayroll) * 100) / 100;

  // PAS 7 Indirect Method Working Capital Adjustments
  const wcChangeInAR = Math.round(-(arGross + contractAssets) * 100) / 100;
  const wcChangeInPrepaidsAndTaxAssets = Math.round(-(inputVat + cwt2307 + prepaidExpenses + supplierAdvances + otherCurrentAssets) * 100) / 100;
  const wcChangeInAPAndAccruals = Math.round((ap + customerAdvances + contractLiabilities + provisionsCurrent + otherCurrentLiabilities) * 100) / 100;
  const wcChangeInTaxAndStatutoryPayables = Math.round((outputVat + ewtPayable + payrollDeductionsPayable + incomeTaxPayable) * 100) / 100;

  return {
    cash,
    arGross,
    allowanceForECL,
    ar,
    customerAdvances,
    inputVat,
    cwt2307,
    prepaidExpenses,
    contractAssets,
    assetsHeldForSale,
    supplierAdvances,
    otherCurrentAssets,
    totalCurrentAssets,
    ppeCost,
    accumDep,
    netPPE,
    rouAssetNet,
    intangibleAssets,
    deferredTaxAsset,
    otherNonCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    ap,
    outputVat,
    netVatPayable,
    ewtPayable,
    payrollDeductionsPayable,
    incomeTaxPayable,
    contractLiabilities,
    leaseLiabilityCurrent,
    provisionsCurrent,
    otherCurrentLiabilities,
    totalCurrentLiabilities,
    loansPayableNonCurrent,
    leaseLiabilityNonCurrent,
    deferredTaxLiability,
    retirementBenefitObligation,
    otherNonCurrentLiabilities,
    totalNonCurrentLiabilities,
    otherLiabilities,
    totalLiabilities,
    vatableSales,
    zeroRatedSales,
    vatExemptSales,
    salesDiscounts,
    grossRevenue,
    totalOperatingExp,
    depreciationExpense,
    impairmentExpense,
    financeCosts,
    payrollExpense,
    specialRev: otherRev,
    specialExp: 0,
    operatingProfit,
    netIncomeBeforeTax,
    incomeTaxProvision,
    deferredTaxExpense,
    netIncome,
    revaluationSurplusOCI,
    actuarialRemeasurementOCI,
    fvociReserveOCI,
    totalOCI,
    totalComprehensiveIncome,
    capitalStock: capitalContributions,
    ownerDrawings,
    retainedEarnings,
    totalEquity,
    totalLiabilitiesAndEquity,
    unrealizedGainLoss,
    isBalanced: Math.abs(unrealizedGainLoss) < 0.05,
    hasRetrospectiveRestatement,
    cashInflowsFromCustomers: Math.round(cashInflowsFromCustomers * 100) / 100,
    cashOutflowsToSuppliersAndExpenses: Math.round(cashOutflowsToSuppliersAndExpenses * 100) / 100,
    cashOutflowsToPayroll: Math.round(cashOutflowsToPayroll * 100) / 100,
    netOperatingCashFlow,
    netInvestingCashFlow: Math.round(netInvestingCashFlow * 100) / 100,
    netFinancingCashFlow: Math.round(netFinancingCashFlow * 100) / 100,
    wcChangeInAR,
    wcChangeInPrepaidsAndTaxAssets,
    wcChangeInAPAndAccruals,
    wcChangeInTaxAndStatutoryPayables,
    accountMap,
    journalEntries
  };
}


