/**
 * Book-to-Tax Reconciliation Engine (PFRS / PAS vs. NIRC BIR Tax Rules)
 * Bridges Accounting Net Income per Books to Net Taxable Income for BIR Form 1701 & 1702-RT
 * 
 * Statutory References:
 * - NIRC Sec. 34 (Allowable Deductions)
 * - RR 10-2002 (Ceiling on Representation and Entertainment Expenses)
 * - Sec. 34(B) / RA 11534 CREATE Act (Interest Expense Limitation / 20% Arbitrage)
 * - Sec. 34(E) vs PFRS 9 (Bad Debts Write-off vs Expected Credit Loss Provisions)
 * - Sec. 34(C) (Disallowance of Tax Penalties, Surcharges, and Compromise)
 * - Sec. 24(B)(1) & Sec. 27(D)(1) (Exclusion of Passive Bank Interest Subject to 20% Final Tax)
 * - Sec. 27(D)(4) (Exclusion of Tax-Exempt Intercorporate Dividends)
 * - PAS 12 / PFRS for SMEs Sec. 29 (Income Taxes: Temporary Differences & Deferred Tax)
 */

import { Company, Sale, Expense, PPEAsset, SpecialEntry, AccountTitle } from '../types';
import { getEntityTaxProfileForYear } from './taxProfiles';
import { computeCorporateTaxRates, computeGraduatedIndividualTax, getStatutoryTaxRule } from './statutoryTaxEngine';

export type ReconcilingCategory = 
  | 'PERMANENT_ADDITION' 
  | 'TEMPORARY_ADDITION' 
  | 'PERMANENT_DEDUCTION' 
  | 'TEMPORARY_DEDUCTION';

export interface BookToTaxItem {
  id: string;
  category: ReconcilingCategory;
  code: string;
  title: string;
  legalBasis: string;
  accountingAmount: number;
  taxAllowableAmount: number;
  reconcilingAdjustment: number; // positive = adds to net income; negative = subtracts
  isTemporary: boolean;
  notes: string;
  userOverridden?: boolean;
}

export interface BookToTaxSummary {
  taxYear: number;
  companyName: string;
  companyTin: string;
  entityType: string;
  isIndividual: boolean;
  incomeTaxType: string;
  expenseDeductionType: string;
  isVat: boolean;
  
  // PFRS / PAS Books Section
  grossSales: number;
  salesDiscounts: number;
  netSales: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  depreciationBooks: number;
  otherIncomeBooks: number; // interest, dividends, etc.
  netIncomeBeforeTaxBooks: number; // PFRS Accounting Net Income

  // Reconciling Sections
  permanentAdditions: number;
  temporaryAdditions: number;
  totalAdditions: number;

  permanentDeductions: number;
  temporaryDeductions: number;
  totalDeductions: number;

  netReconcilingDifference: number;

  // NIRC Tax Return Section (Form 1701 / 1702)
  netTaxableIncome: number;
  statutoryTaxRateText: string;
  effectiveTaxRate: number;
  incomeTaxDue: number;
  creditable2307: number;
  netTaxPayable: number;

  // PAS 12 / PFRS for SMEs Deferred Tax
  deferredTaxAsset: number;
  deferredTaxLiability: number;
  netDeferredTax: number;

  // Reconciling Line Items
  items: BookToTaxItem[];
}

export interface UserReconciliationOverrides {
  customInterestIncomeFinal?: number;
  customEntertainmentActual?: number;
  customEntertainmentCeilingRate?: number; // 0.005 (0.5%) for goods or 0.01 (1.0%) for services
  customBadDebtsProvision?: number;
  customPenaltiesActual?: number;
  customTaxExemptDividends?: number;
  additionalItems?: BookToTaxItem[];
}

/**
 * Computes the complete Book-to-Tax Reconciliation schedule
 */
export function computeBookToTaxReconciliation(
  sales: Sale[],
  expenses: Expense[],
  ppeAssets: PPEAsset[],
  specialEntries: SpecialEntry[] = [],
  company: Company | null,
  taxYear: number,
  overrides?: UserReconciliationOverrides
): BookToTaxSummary {
  const cName = company?.company_name || 'Active Entity';
  const cTin = company?.company_tin || '000-000-000-00000';
  const rawEntityType = company?.entity_type || 'CORPORATION';
  const isIndiv = 
    rawEntityType.toUpperCase().includes('SOLE') ||
    rawEntityType.toUpperCase().includes('INDIVIDUAL') ||
    rawEntityType.toUpperCase().includes('PROFESSIONAL');

  const profile = getEntityTaxProfileForYear(company, taxYear);
  const isVat = profile.vat_or_non_vat === 'VATABLE' || company?.vat_or_non_vat === 'VAT';

  // 1. FILTER TRANSACTIONS FOR TARGET TAX YEAR
  const yearStr = String(taxYear);
  const yearSales = sales.filter(s => {
    if (!s || s.is_cancelled || (s as any).sales_status === 'Cancelled') return false;
    if (company?.company_name && s.company_name && s.company_name !== company.company_name) return false;
    const d = s.invoice_date || s.issue_date || (s as any).date || '';
    return d.startsWith(yearStr);
  });

  const yearExpenses = expenses.filter(e => {
    if (!e || e.is_cancelled || e.expense_status === 'Cancelled') return false;
    if (company?.company_name && e.company_name && e.company_name !== company.company_name) return false;
    const d = e.expense_date || (e as any).date || '';
    return d.startsWith(yearStr);
  });

  const yearSpecial = specialEntries.filter(s => {
    if (company?.company_name && s.company_name && s.company_name !== company.company_name) return false;
    const d = (s as any).date || (s as any).special_entry_date || (s as any).entry_date || '';
    return d.startsWith(yearStr);
  });

  // 2. COMPUTE PFRS REVENUE & EXPENSES PER BOOKS
  let grossSales = yearSales.reduce((sum, s) => {
    return sum + (Number(s.total_sale_vat_inclusive ?? (s as any).total_amount_vat_inclusive ?? s.amount ?? s.invoice_amount) || 0);
  }, 0);

  let salesDiscounts = yearSales.reduce((sum, s) => {
    return sum + (Number(s.discounts ?? (s as any).discount ?? s.less_discount) || 0);
  }, 0);

  let creditable2307 = yearSales.reduce((sum, s) => {
    return sum + (Number(s.withholding_2307 ?? (s as any).tax_withheld ?? (s as any).amount_withheld_2307 ?? s.less_withholding_tax) || 0);
  }, 0);

  // Parse Special Entries for sales / expenses accounts
  let specialOtherIncome = 0;
  yearSpecial.forEach(se => {
    se.lines.forEach(l => {
      const amt = Number(l.amount) || 0;
      if (l.account_code.startsWith('4')) {
        if (l.type === 'Credit') grossSales += amt;
        else grossSales -= amt;
      } else if (l.account_code === '7010' || l.account_code.startsWith('7')) {
        // Finance / other income
        if (l.type === 'Credit') specialOtherIncome += amt;
        else specialOtherIncome -= amt;
      }
    });
  });

  const netSales = Math.max(0, grossSales - salesDiscounts);

  // Cost of Goods Sold / Cost of Direct Services
  const costOfSales = yearExpenses
    .filter(e => {
      const cat = ((e.expense_category || (e as any).category || (e as any).expense_type || (e as any).particulars || '') + '').toLowerCase();
      const desc = ((e.description || (e as any).particulars || '') + '').toLowerCase();
      return cat.includes('cost') || cat.includes('cogs') || cat.includes('merchandise') || cat.includes('raw mat') || desc.includes('purchases') || desc.includes('cost of');
    })
    .reduce((sum, e) => {
      return sum + (Number((e as any).vatable_amount ?? (e as any).vatable_expense ?? e.expense_invoice_amount ?? e.amount) || 0);
    }, 0);

  const grossProfit = Math.max(0, netSales - costOfSales);

  // Total operating expenses per books (excluding COGS)
  const totalRawExpenses = yearExpenses.reduce((sum, e) => {
    return sum + (Number((e as any).vatable_amount ?? (e as any).vatable_expense ?? e.expense_invoice_amount ?? e.amount) || 0);
  }, 0);

  // PPE Depreciation per books (PAS 16)
  const depreciationBooks = ppeAssets.reduce((sum, asset) => {
    const cost = Number(asset.acquisition_cost) || 0;
    const salvage = Number(asset.salvage_value) || 0;
    const life = Math.max(1, Number(asset.useful_life_years) || 5);
    const annualDep = Math.max(0, (cost - salvage) / life);
    return sum + annualDep;
  }, 0);

  const operatingExpenses = Math.max(0, (totalRawExpenses - costOfSales)) + depreciationBooks;

  // Other financial income per books (bank interest, dividends)
  const bankInterestIncome = overrides?.customInterestIncomeFinal !== undefined 
    ? overrides.customInterestIncomeFinal 
    : Math.max(0, specialOtherIncome);

  const taxExemptDividends = overrides?.customTaxExemptDividends !== undefined
    ? overrides.customTaxExemptDividends
    : 0;

  const otherIncomeBooks = bankInterestIncome + taxExemptDividends;

  // Net Income per Books (PFRS / PAS)
  const netIncomeBeforeTaxBooks = Math.round((grossProfit - operatingExpenses + otherIncomeBooks) * 100) / 100;

  // 3. STATUTORY RECONCILING ITEMS (NIRC RULES)
  const items: BookToTaxItem[] = [];

  // ---------------------------------------------------------------------------
  // A. REPRESENTATION & ENTERTAINMENT (ROA) CEILING (RR 10-2002)
  // Ceiling: 0.50% of net sales of goods, or 1.00% of net receipts of services
  // ---------------------------------------------------------------------------
  const detectedEntertainment = yearExpenses
    .filter(e => {
      const cat = ((e.expense_category || (e as any).category || (e as any).expense_type || (e as any).particulars || '') + '').toLowerCase();
      const desc = ((e.description || (e as any).particulars || '') + '').toLowerCase();
      return (
        cat.includes('represent') || cat.includes('entertain') || cat.includes('roa') ||
        desc.includes('meals') || desc.includes('client din') || desc.includes('client gift') || desc.includes('entertainment')
      );
    })
    .reduce((sum, e) => sum + (Number(e.amount ?? e.expense_invoice_amount) || 0), 0);

  const actualEntertainment = overrides?.customEntertainmentActual !== undefined
    ? overrides.customEntertainmentActual
    : detectedEntertainment;

  // Default to 1.0% for service / sole prop, or 0.5% for general trading goods
  const roaCeilingRate = overrides?.customEntertainmentCeilingRate !== undefined
    ? overrides.customEntertainmentCeilingRate
    : (rawEntityType.includes('SERVICE') || isIndiv ? 0.01 : 0.005);

  const roaStatutoryCap = Math.round(netSales * roaCeilingRate * 100) / 100;
  const roaDisallowed = Math.max(0, Math.round((actualEntertainment - roaStatutoryCap) * 100) / 100);

  items.push({
    id: 'roa_ceiling',
    category: 'PERMANENT_ADDITION',
    code: 'ROA_CEILING',
    title: 'Excess Representation and Entertainment (ROA) over Statutory Cap',
    legalBasis: 'RR 10-2002 (Capped at 0.5% on sales of goods / 1.0% on services)',
    accountingAmount: actualEntertainment,
    taxAllowableAmount: roaStatutoryCap,
    reconcilingAdjustment: roaDisallowed,
    isTemporary: false,
    notes: `Actual: ₱${actualEntertainment.toLocaleString()} | Cap (${(roaCeilingRate * 100).toFixed(1)}% of Net Sales ₱${netSales.toLocaleString()}): ₱${roaStatutoryCap.toLocaleString()}`
  });

  // ---------------------------------------------------------------------------
  // B. INTEREST EXPENSE LIMITATION / TAX ARBITRAGE (NIRC Sec. 34(B) / CREATE Act)
  // Under CREATE Act RA 11534, interest expense deduction is reduced by 20% of
  // interest income subjected to final tax (reduced from 33% under TRAIN).
  // ---------------------------------------------------------------------------
  const detectedInterestExpense = yearExpenses
    .filter(e => {
      const cat = ((e.expense_category || (e as any).category || (e as any).expense_type || (e as any).particulars || '') + '').toLowerCase();
      const desc = ((e.description || (e as any).particulars || '') + '').toLowerCase();
      return cat.includes('interest') || desc.includes('loan interest') || desc.includes('finance cost');
    })
    .reduce((sum, e) => sum + (Number(e.amount ?? e.expense_invoice_amount) || 0), 0);

  const interestArbitrageDisallowed = Math.round(bankInterestIncome * 0.20 * 100) / 100;
  items.push({
    id: 'interest_arbitrage',
    category: 'PERMANENT_ADDITION',
    code: 'INTEREST_ARBITRAGE',
    title: 'Interest Expense Arbitrage Limitation (20% of Final-Taxed Interest)',
    legalBasis: 'NIRC Sec. 34(B) as amended by RA 11534 CREATE Act',
    accountingAmount: detectedInterestExpense,
    taxAllowableAmount: Math.max(0, detectedInterestExpense - interestArbitrageDisallowed),
    reconcilingAdjustment: interestArbitrageDisallowed,
    isTemporary: false,
    notes: `Disallowance = 20% × Bank Interest Income (₱${bankInterestIncome.toLocaleString()}) = ₱${interestArbitrageDisallowed.toLocaleString()}`
  });

  // ---------------------------------------------------------------------------
  // C. ALLOWANCE FOR IMPAIRMENT / BAD DEBTS (PFRS 9 vs NIRC Sec. 34(E))
  // PFRS 9 requires recognition of Expected Credit Loss (ECL) allowance.
  // NIRC Sec. 34(E) disallows provisions; deductible only upon actual write-off.
  // ---------------------------------------------------------------------------
  const badDebtsProvision = overrides?.customBadDebtsProvision !== undefined
    ? overrides.customBadDebtsProvision
    : 0;

  items.push({
    id: 'bad_debts_ecl',
    category: 'TEMPORARY_ADDITION',
    code: 'ECL_BAD_DEBTS',
    title: 'Provision for Expected Credit Loss / Bad Debts (PFRS 9)',
    legalBasis: 'PFRS 9 (Books) vs NIRC Sec. 34(E) (Requires actual write-off)',
    accountingAmount: badDebtsProvision,
    taxAllowableAmount: 0,
    reconcilingAdjustment: badDebtsProvision,
    isTemporary: true,
    notes: 'Temporary difference: provisions not deductible until specific accounts are proven uncollectible and written off.'
  });

  // ---------------------------------------------------------------------------
  // D. PENALTIES, SURCHARGES, AND FINES (NIRC Sec. 34(C))
  // Tax surcharges, interest penalties, and compromise fees are non-deductible.
  // ---------------------------------------------------------------------------
  const detectedPenalties = yearExpenses
    .filter(e => {
      const cat = ((e.expense_category || (e as any).category || (e as any).expense_type || (e as any).particulars || '') + '').toLowerCase();
      const desc = ((e.description || (e as any).particulars || '') + '').toLowerCase();
      return cat.includes('penalty') || cat.includes('surcharge') || desc.includes('compromise') || desc.includes('late filing');
    })
    .reduce((sum, e) => sum + (Number(e.amount ?? e.expense_invoice_amount) || 0), 0);

  const penaltiesActual = overrides?.customPenaltiesActual !== undefined
    ? overrides.customPenaltiesActual
    : detectedPenalties;

  items.push({
    id: 'tax_penalties',
    category: 'PERMANENT_ADDITION',
    code: 'TAX_PENALTIES',
    title: 'Tax Surcharges, Penalties, and Fines',
    legalBasis: 'NIRC Sec. 34(C) / BIR Rulings (Non-deductible public policy violation)',
    accountingAmount: penaltiesActual,
    taxAllowableAmount: 0,
    reconcilingAdjustment: penaltiesActual,
    isTemporary: false,
    notes: 'Permanent difference: penalties and fines imposed for statutory violations cannot reduce taxable income.'
  });

  // ---------------------------------------------------------------------------
  // E. EXCLUSION OF PASSIVE INCOME SUBJECTED TO FINAL TAX (Sec. 24(B)(1) / 27(D)(1))
  // Bank deposit interest already paid 20% final withholding tax at source.
  // ---------------------------------------------------------------------------
  items.push({
    id: 'interest_income_final',
    category: 'PERMANENT_DEDUCTION',
    code: 'INTEREST_INCOME_FINAL',
    title: 'Passive Interest Income Subjected to 20% Final Withholding Tax',
    legalBasis: 'NIRC Sec. 24(B)(1) [Individuals] / Sec. 27(D)(1) [Corporations]',
    accountingAmount: bankInterestIncome,
    taxAllowableAmount: 0, // 0 included in regular income tax
    reconcilingAdjustment: -bankInterestIncome,
    isTemporary: false,
    notes: 'Included in Accounting Income per books; excluded from Regular Income Tax Return (final tax paid).'
  });

  // ---------------------------------------------------------------------------
  // F. TAX-EXEMPT INTERCORPORATE DIVIDENDS (NIRC Sec. 27(D)(4))
  // ---------------------------------------------------------------------------
  if (!isIndiv && taxExemptDividends > 0) {
    items.push({
      id: 'exempt_dividends',
      category: 'PERMANENT_DEDUCTION',
      code: 'DIVIDENDS_EXEMPT',
      title: 'Tax-Exempt Intercorporate Dividends',
      legalBasis: 'NIRC Sec. 27(D)(4) (Dividends received from another domestic corporation)',
      accountingAmount: taxExemptDividends,
      taxAllowableAmount: 0,
      reconcilingAdjustment: -taxExemptDividends,
      isTemporary: false,
      notes: '100% exempt from income tax under the Tax Code.'
    });
  }

  // Include any extra user items
  if (overrides?.additionalItems && overrides.additionalItems.length > 0) {
    overrides.additionalItems.forEach(ai => items.push(ai));
  }

  // 4. TOTAL ADDITIONS & DEDUCTIONS
  const permanentAdditions = items
    .filter(i => i.category === 'PERMANENT_ADDITION')
    .reduce((s, i) => s + i.reconcilingAdjustment, 0);

  const temporaryAdditions = items
    .filter(i => i.category === 'TEMPORARY_ADDITION')
    .reduce((s, i) => s + i.reconcilingAdjustment, 0);

  const totalAdditions = permanentAdditions + temporaryAdditions;

  const permanentDeductions = items
    .filter(i => i.category === 'PERMANENT_DEDUCTION')
    .reduce((s, i) => s + Math.abs(i.reconcilingAdjustment), 0);

  const temporaryDeductions = items
    .filter(i => i.category === 'TEMPORARY_DEDUCTION')
    .reduce((s, i) => s + Math.abs(i.reconcilingAdjustment), 0);

  const totalDeductions = permanentDeductions + temporaryDeductions;
  const netReconcilingDifference = totalAdditions - totalDeductions;

  // 5. NET TAXABLE INCOME PER TAX RETURN
  let netTaxableIncome = 0;
  let incomeTaxDue = 0;
  let statutoryTaxRateText = '';
  let effectiveTaxRate = 0;

  if (isIndiv && profile.income_tax_type === 'EIGHT_PERCENT') {
    // Under 8% GIT, net taxable income is gross sales less ₱250k (no deductions)
    const allowance = profile.allow_250k_exemption !== false ? 250000 : 0;
    netTaxableIncome = Math.max(0, grossSales - allowance);
    incomeTaxDue = Math.round(netTaxableIncome * 0.08 * 100) / 100;
    statutoryTaxRateText = '8% Optional Gross Income Tax';
    effectiveTaxRate = grossSales > 0 ? (incomeTaxDue / grossSales) * 100 : 0;
  } else if (!isIndiv && profile.expense_deduction_type === 'OSD_40') {
    // Under Corporate OSD, 40% of Gross Profit
    const osd = Math.round(grossProfit * 0.40 * 100) / 100;
    netTaxableIncome = Math.max(0, grossProfit - osd);
    const corpRates = computeCorporateTaxRates(taxYear);
    incomeTaxDue = Math.round(netTaxableIncome * corpRates.rcitMsmeRate * 100) / 100;
    statutoryTaxRateText = `RCIT ${(corpRates.rcitMsmeRate * 100).toFixed(0)}% (Corporate OSD)`;
    effectiveTaxRate = netTaxableIncome > 0 ? (incomeTaxDue / netTaxableIncome) * 100 : 0;
  } else if (isIndiv) {
    // Individual Graduated Itemized
    netTaxableIncome = Math.max(0, netIncomeBeforeTaxBooks + netReconcilingDifference);
    const grad = computeGraduatedIndividualTax(netTaxableIncome, taxYear);
    incomeTaxDue = grad.taxDue;
    statutoryTaxRateText = `Graduated Rates (${grad.statutoryEraName})`;
    effectiveTaxRate = grad.effectiveRate;
  } else {
    // Corporate Itemized (1702-RT)
    netTaxableIncome = Math.max(0, netIncomeBeforeTaxBooks + netReconcilingDifference);
    const corpRates = computeCorporateTaxRates(taxYear);
    const rcit = Math.round(netTaxableIncome * corpRates.rcitMsmeRate * 100) / 100;
    const mcit = Math.round(grossProfit * corpRates.mcitRate * 100) / 100;
    incomeTaxDue = Math.max(rcit, mcit);
    statutoryTaxRateText = `RCIT ${(corpRates.rcitMsmeRate * 100).toFixed(0)}% vs MCIT ${(corpRates.mcitRate * 100).toFixed(0)}%`;
    effectiveTaxRate = netTaxableIncome > 0 ? (incomeTaxDue / netTaxableIncome) * 100 : 0;
  }

  // 6. DEFERRED TAX CALCULATION (PAS 12)
  const corpRates = computeCorporateTaxRates(taxYear);
  const applicableTaxRate = isIndiv ? (effectiveTaxRate / 100 || 0.20) : corpRates.rcitMsmeRate;
  const deferredTaxAsset = Math.round(temporaryAdditions * applicableTaxRate * 100) / 100;
  const deferredTaxLiability = Math.round(temporaryDeductions * applicableTaxRate * 100) / 100;
  const netDeferredTax = deferredTaxAsset - deferredTaxLiability;

  const netTaxPayable = Math.max(0, incomeTaxDue - creditable2307);

  return {
    taxYear,
    companyName: cName,
    companyTin: cTin,
    entityType: rawEntityType,
    isIndividual: isIndiv,
    incomeTaxType: profile.income_tax_type,
    expenseDeductionType: profile.expense_deduction_type,
    isVat,
    grossSales,
    salesDiscounts,
    netSales,
    costOfSales,
    grossProfit,
    operatingExpenses,
    depreciationBooks,
    otherIncomeBooks,
    netIncomeBeforeTaxBooks,
    permanentAdditions,
    temporaryAdditions,
    totalAdditions,
    permanentDeductions,
    temporaryDeductions,
    totalDeductions,
    netReconcilingDifference,
    netTaxableIncome,
    statutoryTaxRateText,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
    incomeTaxDue,
    creditable2307,
    netTaxPayable,
    deferredTaxAsset,
    deferredTaxLiability,
    netDeferredTax,
    items
  };
}
