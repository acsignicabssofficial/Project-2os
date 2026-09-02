/**
 * Single Source of Truth for BIR Tax Math & Double-Entry Accounting Calculations
 */

import { Sale, Expense } from '../types';

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

