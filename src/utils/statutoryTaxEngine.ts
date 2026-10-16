import { 
  StatutoryTaxRule, 
  StatutoryTaxEraCode, 
  CustomTaxLaw, 
  TaxpayerClassificationInfo 
} from '../types';

/**
 * BUILT-IN STATUTORY TAX ERAS ACCORDING TO PHILIPPINE TAX REGULATIONS:
 * - Pre-TRAIN (Prior to 2018-01-01): Old NIRC 7 brackets, 30% RCIT, 3% percentage tax, dual Invoices/ORs.
 * - TRAIN Law (RA 10963, 2018-01-01 to 2020-06-30): 8% option introduced, 2018-2022 graduated brackets, 3% percentage tax.
 * - CREATE Relief (RA 11534 & RR 4-2021, 2020-07-01 to 2023-06-30): Temporary 1% percentage tax, 1% MCIT, 25%/20% RCIT.
 * - CREATE Permanent / TRAIN Adjusted (2023-07-01 to 2024-01-21): Restored 3% percentage tax, restored 2% MCIT, 2023+ graduated brackets.
 * - EOPT Act (RA 11976 & RR 3/4/8/11-2024, 2024-01-22 to present/2026+): Single Invoicing for Goods & Services, 
 *   Taxpayer Categorization (Micro/Small/Medium/Large), Withholding exemption for Micro, reduced civil penalties, file/pay anywhere.
 */
export const STATUTORY_TAX_RULES: StatutoryTaxRule[] = [
  {
    code: 'PRE_TRAIN',
    name: 'Pre-TRAIN NIRC Era (Pre-2018)',
    shortName: 'Pre-TRAIN',
    citation: 'National Internal Revenue Code (NIRC of 1997 as amended)',
    effectiveFrom: '1997-01-01',
    effectiveTo: '2017-12-31',
    percentageTaxRate: 3,
    rcitRateRegular: 0.30,
    rcitRateMsme: 0.30,
    mcitRate: 0.02,
    vatThreshold: 1919500,
    eightPercentOptionAllowed: false,
    eightPercentExemptionAmount: 0,
    primaryDocumentType: 'INVOICE_AND_OR',
    microSmallPenaltyReduction: false,
    microExemptionWithholding: false,
    keyFeatures: [
      'Old 7-tier individual graduated tax brackets (5% up to 32%)',
      'Personal exemption (₱50k) and dependent exemptions (₱25k/dependent)',
      'Regular Corporate Income Tax at 30%',
      'Minimum Corporate Income Tax at 2%',
      'Section 116 Percentage Tax at 3%',
      'VAT threshold pegged at ₱1,919,500',
      'Sales Invoice for Goods; Official Receipt for Services'
    ]
  },
  {
    code: 'TRAIN_ERA1',
    name: 'TRAIN Law Initial Era (RA 10963)',
    shortName: 'TRAIN (2018–2020)',
    citation: 'Republic Act No. 10963 / RR 8-2018, RR 11-2018',
    effectiveFrom: '2018-01-01',
    effectiveTo: '2020-06-30',
    percentageTaxRate: 3,
    rcitRateRegular: 0.30,
    rcitRateMsme: 0.30,
    mcitRate: 0.02,
    vatThreshold: 3000000,
    eightPercentOptionAllowed: true,
    eightPercentExemptionAmount: 250000,
    primaryDocumentType: 'INVOICE_AND_OR',
    microSmallPenaltyReduction: false,
    microExemptionWithholding: false,
    keyFeatures: [
      'Enacted 8% Gross Income Tax option for Non-VAT Individuals with <= ₱3M gross sales',
      '₱250,000 annual business exemption for 8% purely self-employed',
      'Exemption from Sec 116 Percentage Tax for 8% individuals',
      'Individual graduated brackets 2018–2022 (top rate 35% on > ₱8M)',
      'VAT threshold raised to ₱3,000,000',
      'Sales Invoice for Goods; Official Receipt for Services'
    ]
  },
  {
    code: 'CREATE_RELIEF',
    name: 'CREATE Law Relief Period (RA 11534)',
    shortName: 'CREATE Relief (2020–2023)',
    citation: 'Republic Act No. 11534 / RR 4-2021, RR 5-2021',
    effectiveFrom: '2020-07-01',
    effectiveTo: '2023-06-30',
    percentageTaxRate: 1, // Reduced to 1% from July 1, 2020 to June 30, 2023
    rcitRateRegular: 0.25,
    rcitRateMsme: 0.20,
    mcitRate: 0.01, // Reduced to 1% from July 1, 2020 to June 30, 2023
    vatThreshold: 3000000,
    eightPercentOptionAllowed: true,
    eightPercentExemptionAmount: 250000,
    primaryDocumentType: 'INVOICE_AND_OR',
    microSmallPenaltyReduction: false,
    microExemptionWithholding: false,
    keyFeatures: [
      'TEMPORARY RELIEF: Section 116 Percentage Tax slashed from 3% to 1%',
      'TEMPORARY RELIEF: Minimum Corporate Income Tax (MCIT) slashed from 2% to 1%',
      'Permanent reduction of RCIT to 25% (Regular) or 20% (MSME with <= ₱5M net income & <= ₱100M assets)',
      'Individual tax brackets: 2018-2022 tier up to Dec 31, 2022; adjusted lowered rates starting Jan 1, 2023',
      '8% Gross Income Tax option maintained'
    ]
  },
  {
    code: 'CREATE_PERMANENT',
    name: 'CREATE Permanent Rates & TRAIN Tier 2',
    shortName: 'CREATE Post-Relief (2023–2024)',
    citation: 'Republic Act No. 11534 & RA 10963 Sec 24(A)',
    effectiveFrom: '2023-07-01',
    effectiveTo: '2024-01-21',
    percentageTaxRate: 3, // Restored back to 3%
    rcitRateRegular: 0.25,
    rcitRateMsme: 0.20,
    mcitRate: 0.02, // Restored back to 2%
    vatThreshold: 3000000,
    eightPercentOptionAllowed: true,
    eightPercentExemptionAmount: 250000,
    primaryDocumentType: 'INVOICE_AND_OR',
    microSmallPenaltyReduction: false,
    microExemptionWithholding: false,
    keyFeatures: [
      'Percentage Tax restored from 1% back to standard 3% effective July 1, 2023',
      'MCIT restored from 1% back to standard 2% effective July 1, 2023',
      'RCIT maintained at 25% (regular) or 20% (MSME)',
      'TRAIN Tier 2 graduated tax rates (15%, 20%, 25%, 30%, 35%)',
      '8% Gross Income Tax option maintained'
    ]
  },
  {
    code: 'EOPT',
    name: 'Ease of Paying Taxes (EOPT) Act (RA 11976)',
    shortName: 'EOPT Act (2024–Present)',
    citation: 'Republic Act No. 11976 / RR 3-2024, RR 4-2024, RR 8-2024, RR 11-2024',
    effectiveFrom: '2024-01-22',
    effectiveTo: '2024-12-31',
    percentageTaxRate: 3,
    rcitRateRegular: 0.25,
    rcitRateMsme: 0.20,
    mcitRate: 0.02,
    vatThreshold: 3000000,
    eightPercentOptionAllowed: true,
    eightPercentExemptionAmount: 250000,
    primaryDocumentType: 'INVOICE',
    microSmallPenaltyReduction: true,
    microExemptionWithholding: true,
    keyFeatures: [
      'HARMONIZED INVOICING: "Invoice" is now the sole primary substantiation for BOTH Goods AND Services (replaces Official Receipts)',
      'SERVICE ACCRUAL BASIS: Output VAT and revenue recognition on services align with invoice issuance (not collection)',
      'UNCOLLECTED RECEIVABLES: Output VAT credit deduction allowed for uncollected sales under RR 3-2024',
      'TAXPAYER CATEGORIZATION: Micro (< ₱3M), Small (₱3M–₱20M), Medium (₱20M–₱1B), Large (₱1B+)',
      'MICRO WITHHOLDING RELIEF: Micro taxpayers are exempt from withholding tax obligation at source (RR 4-2024 & RR 8-2024)',
      'CIVIL PENALTY REDUCTION: Micro & Small enjoy 10% surcharge (vs 25%) and 50% interest rate reduction',
      'FILE & PAY ANYWHERE: Tax returns may be filed and taxes paid at ANY authorized agent bank/RDO nationwide without 25% surcharge',
      'SIMPLIFIED RETURNS: Maximum 2-page return for Micro and Small taxpayers'
    ]
  },
  {
    code: 'CREATE_MORE',
    name: 'CREATE MORE Act & EOPT Regime (RA 12066)',
    shortName: 'CREATE MORE (2025–Present)',
    citation: 'Republic Act No. 12066 & RA 11976 (Enacted Nov 2024, effective 2025+)',
    effectiveFrom: '2025-01-01',
    percentageTaxRate: 3,
    rcitRateRegular: 0.25,
    rcitRateMsme: 0.20,
    mcitRate: 0.02,
    vatThreshold: 3000000,
    eightPercentOptionAllowed: true,
    eightPercentExemptionAmount: 250000,
    primaryDocumentType: 'INVOICE',
    microSmallPenaltyReduction: true,
    microExemptionWithholding: true,
    keyFeatures: [
      'RBE INCENTIVES: Refined 20% corporate income tax rate on registered business enterprises under enhanced deductions',
      'VAT ZERO-RATING & REFUND: Streamlined electronic processing and 90-day BIR decision timeline for VAT refunds',
      'CONTINUATION OF EOPT: Harmonized Invoice substantiation, 4-tier taxpayer categorization, reduced penalties for Micro/Small',
      'RIT & OSD RULES: 40% OSD retained, 8% Gross Income Tax option preserved for eligible non-VAT individuals',
      'ENHANCED DEDUCTIONS: Additional 50% power expense deduction, trade exhibition expenses, and local tax ceilings'
    ]
  }
];

const CUSTOM_LAWS_STORAGE_KEY = 'ph_custom_tax_laws_registry_v1';

/**
 * Loads any custom or future tax laws saved in localStorage.
 */
export function getCustomTaxLaws(): CustomTaxLaw[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LAWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom tax laws:', err);
    return [];
  }
}

/**
 * Saves or updates a custom tax law in localStorage.
 */
export function saveCustomTaxLaw(
  customLaw: Omit<CustomTaxLaw, 'id' | 'createdAt' | 'isUserDefined' | 'code'> & { id?: string; code?: StatutoryTaxEraCode }
): CustomTaxLaw {
  const current = getCustomTaxLaws();
  const id = customLaw.id || `custom_law_${Date.now()}`;
  const record: CustomTaxLaw = {
    ...customLaw,
    id,
    code: 'CUSTOM',
    createdAt: new Date().toISOString(),
    isUserDefined: true
  };

  const idx = current.findIndex(c => c.id === id);
  if (idx >= 0) {
    current[idx] = record;
  } else {
    current.push(record);
  }

  localStorage.setItem(CUSTOM_LAWS_STORAGE_KEY, JSON.stringify(current));
  return record;
}

/**
 * Deletes a custom tax law by ID.
 */
export function deleteCustomTaxLaw(id: string): void {
  const current = getCustomTaxLaws();
  const filtered = current.filter(c => c.id !== id);
  localStorage.setItem(CUSTOM_LAWS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Returns all statutory tax rules (built-in + any custom future laws), ordered chronologically.
 */
export function getAllStatutoryTaxRules(): StatutoryTaxRule[] {
  const custom = getCustomTaxLaws();
  const combined = [...STATUTORY_TAX_RULES, ...custom];
  return combined.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
}

/**
 * Resolves the exact Statutory Tax Rule governing a specific transaction date or tax year.
 * Examples:
 * - '2019-05-15' -> TRAIN Law (RA 10963)
 * - '2021-08-10' -> CREATE Law Relief Period (1% Percentage Tax, 1% MCIT)
 * - '2023-09-01' -> CREATE Permanent Rates (3% Percentage Tax restored)
 * - '2024-03-15' -> EOPT Act (RA 11976)
 * - 2026 -> EOPT Act
 * - Future years matching custom laws if defined, otherwise latest active statutory law.
 */
export function getStatutoryTaxRule(dateOrYear: string | number): StatutoryTaxRule {
  let targetDateStr = '';

  if (typeof dateOrYear === 'number') {
    targetDateStr = `${dateOrYear}-07-01`; // Mid-year approximation if only year is passed
  } else if (typeof dateOrYear === 'string') {
    const trimmed = dateOrYear.trim();
    if (trimmed.length === 4 && !isNaN(Number(trimmed))) {
      targetDateStr = `${trimmed}-07-01`;
    } else if (trimmed.includes('T')) {
      targetDateStr = trimmed.split('T')[0];
    } else {
      targetDateStr = trimmed.slice(0, 10);
    }
  }

  if (!targetDateStr || targetDateStr.length < 10) {
    targetDateStr = new Date().toISOString().slice(0, 10);
  }

  const allRules = getAllStatutoryTaxRules();

  // 1. Check custom laws first (so user-defined future enactments take precedence if dates match)
  const matchingCustom = allRules
    .filter(r => (r as any).isUserDefined)
    .find(r => {
      const fromMatch = r.effectiveFrom <= targetDateStr;
      const toMatch = !r.effectiveTo || r.effectiveTo >= targetDateStr;
      return fromMatch && toMatch;
    });

  if (matchingCustom) {
    return matchingCustom;
  }

  // 2. Exact date bracket match among built-in rules
  const matchingBuiltIn = STATUTORY_TAX_RULES.find(r => {
    const fromMatch = r.effectiveFrom <= targetDateStr;
    const toMatch = !r.effectiveTo || r.effectiveTo >= targetDateStr;
    return fromMatch && toMatch;
  });

  if (matchingBuiltIn) {
    return matchingBuiltIn;
  }

  // 3. If targetDate is earlier than oldest rule (before 1997)
  if (targetDateStr < STATUTORY_TAX_RULES[0].effectiveFrom) {
    return STATUTORY_TAX_RULES[0];
  }

  // 4. Default to latest active statutory rule (EOPT)
  return STATUTORY_TAX_RULES[STATUTORY_TAX_RULES.length - 1];
}

/**
 * Computes individual graduated income tax according to the statutory era governing the tax year.
 * - Pre-2018: Old NIRC 7 brackets (up to 32%)
 * - 2018-2022: TRAIN Initial Tier 1 (up to 35% on > ₱8M, 20% on 250k-400k)
 * - 2023 onwards: TRAIN Tier 2 / CREATE / EOPT (15% on 250k-400k, 20% on 400k-800k, 25% on 800k-2M, 30% on 2M-8M, 35% on > 8M)
 */
export function computeGraduatedIndividualTax(
  taxableIncome: number,
  dateOrYear: number | string
): {
  taxDue: number;
  bracketText: string;
  effectiveRate: number;
  statutoryEraName: string;
  statutoryCode: StatutoryTaxEraCode;
} {
  const rule = getStatutoryTaxRule(dateOrYear);
  const income = Math.max(0, taxableIncome);
  const yr = typeof dateOrYear === 'number' ? dateOrYear : parseInt(String(dateOrYear).slice(0, 4), 10);
  const safeYear = !isNaN(yr) ? yr : new Date().getFullYear();

  let taxDue = 0;
  let bracketText = '';

  if (safeYear < 2018) {
    // Old Pre-TRAIN graduated tax table (Sec 24(A)(1) of NIRC 1997)
    if (income <= 10000) {
      taxDue = income * 0.05;
      bracketText = '5% on first ₱10,000';
    } else if (income <= 30000) {
      taxDue = 500 + (income - 10000) * 0.10;
      bracketText = '₱500 + 10% of excess over ₱10,000';
    } else if (income <= 70000) {
      taxDue = 2500 + (income - 30000) * 0.15;
      bracketText = '₱2,500 + 15% of excess over ₱30,000';
    } else if (income <= 140000) {
      taxDue = 8500 + (income - 70000) * 0.20;
      bracketText = '₱8,500 + 20% of excess over ₱70,000';
    } else if (income <= 250000) {
      taxDue = 22500 + (income - 140000) * 0.25;
      bracketText = '₱22,500 + 25% of excess over ₱140,000';
    } else if (income <= 500000) {
      taxDue = 50000 + (income - 250000) * 0.30;
      bracketText = '₱50,000 + 30% of excess over ₱250,000';
    } else {
      taxDue = 125000 + (income - 500000) * 0.32;
      bracketText = '₱125,000 + 32% of excess over ₱500,000';
    }
  } else if (safeYear >= 2018 && safeYear <= 2022) {
    // TRAIN Initial Tier 1 (effective Jan 1, 2018 to Dec 31, 2022)
    if (income <= 250000) {
      taxDue = 0;
      bracketText = '₱0 (Exempt: Income not over ₱250,000)';
    } else if (income <= 400000) {
      taxDue = (income - 250000) * 0.20;
      bracketText = '20% of excess over ₱250,000';
    } else if (income <= 800000) {
      taxDue = 30000 + (income - 400000) * 0.25;
      bracketText = '₱30,000 + 25% of excess over ₱400,000';
    } else if (income <= 2000000) {
      taxDue = 130000 + (income - 800000) * 0.30;
      bracketText = '₱130,000 + 30% of excess over ₱800,000';
    } else if (income <= 8000000) {
      taxDue = 490000 + (income - 2000000) * 0.32;
      bracketText = '₱490,000 + 32% of excess over ₱2,000,000';
    } else {
      taxDue = 2410000 + (income - 8000000) * 0.35;
      bracketText = '₱2,410,000 + 35% of excess over ₱8,000,000';
    }
  } else {
    // TRAIN Tier 2 / CREATE / EOPT (effective Jan 1, 2023 onwards)
    if (income <= 250000) {
      taxDue = 0;
      bracketText = '₱0 (Exempt: Income not over ₱250,000)';
    } else if (income <= 400000) {
      taxDue = (income - 250000) * 0.15;
      bracketText = '15% of excess over ₱250,000';
    } else if (income <= 800000) {
      taxDue = 22500 + (income - 400000) * 0.20;
      bracketText = '₱22,500 + 20% of excess over ₱400,000';
    } else if (income <= 2000000) {
      taxDue = 102500 + (income - 800000) * 0.25;
      bracketText = '₱102,500 + 25% of excess over ₱800,000';
    } else if (income <= 8000000) {
      taxDue = 402500 + (income - 2000000) * 0.30;
      bracketText = '₱402,500 + 30% of excess over ₱2,000,000';
    } else {
      taxDue = 2202500 + (income - 8000000) * 0.35;
      bracketText = '₱2,202,500 + 35% of excess over ₱8,000,000';
    }
  }

  const effectiveRate = income > 0 ? (taxDue / income) * 100 : 0;

  return {
    taxDue: Math.round(taxDue * 100) / 100,
    bracketText,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    statutoryEraName: rule.name,
    statutoryCode: rule.code
  };
}

/**
 * Returns Corporate Income Tax rates for a given year or transaction date:
 * - Pre-CREATE (< July 1, 2020): RCIT 30%, MCIT 2%
 * - CREATE Relief (July 1, 2020 to June 30, 2023): RCIT 25% (Regular) / 20% (MSME), MCIT 1%
 * - CREATE Permanent / EOPT (July 1, 2023 onwards): RCIT 25% (Regular) / 20% (MSME), MCIT 2%
 */
export function computeCorporateTaxRates(dateOrYear: number | string): {
  rcitRegularRate: number;
  rcitMsmeRate: number;
  mcitRate: number;
  rcitRegularPct: string;
  rcitMsmePct: string;
  mcitPct: string;
  statutoryRule: StatutoryTaxRule;
} {
  const rule = getStatutoryTaxRule(dateOrYear);
  return {
    rcitRegularRate: rule.rcitRateRegular,
    rcitMsmeRate: rule.rcitRateMsme,
    mcitRate: rule.mcitRate,
    rcitRegularPct: `${(rule.rcitRateRegular * 100).toFixed(0)}%`,
    rcitMsmePct: `${(rule.rcitRateMsme * 100).toFixed(0)}%`,
    mcitPct: `${(rule.mcitRate * 100).toFixed(0)}%`,
    statutoryRule: rule
  };
}

/**
 * Returns the statutory Percentage Tax (Section 116) rate for non-VAT entities.
 * Automatically handles the 1% temporary pandemic rate under CREATE (July 1, 2020 to June 30, 2023)
 * vs the 3% standard rate under TRAIN, CREATE permanent, and EOPT.
 */
export function getStatutoryPercentageTaxRate(dateOrYear: number | string): {
  rate: number;
  rateDecimal: number;
  isReducedRelief: boolean;
  explanation: string;
  statutoryRule: StatutoryTaxRule;
} {
  const rule = getStatutoryTaxRule(dateOrYear);
  const isReduced = rule.percentageTaxRate === 1;

  const explanation = isReduced
    ? 'Temporary 1% reduced rate under CREATE Law (RA 11534 & RR 4-2021) for taxable periods July 1, 2020 to June 30, 2023'
    : 'Standard 3% percentage tax rate under Section 116 of the NIRC as amended';

  return {
    rate: rule.percentageTaxRate,
    rateDecimal: rule.percentageTaxRate / 100,
    isReducedRelief: isReduced,
    explanation,
    statutoryRule: rule
  };
}

/**
 * Classifies an entity according to the Ease of Paying Taxes (EOPT) Act (RA 11976 Sec. 21 / RR 8-2024):
 * - Micro: Gross sales < ₱3,000,000
 * - Small: ₱3,000,000 to < ₱20,000,000
 * - Medium: ₱20,000,000 to < ₱1,000,000,000
 * - Large: ₱1,000,000,000 and above
 */
export function getTaxpayerClassification(
  annualGrossSales: number,
  dateOrYear?: number | string
): TaxpayerClassificationInfo {
  const rule = getStatutoryTaxRule(dateOrYear || new Date().toISOString());
  const isEopt = rule.code === 'EOPT' || rule.code === 'CUSTOM';
  const sales = Math.max(0, annualGrossSales || 0);

  if (sales < 3000000) {
    return {
      category: 'MICRO',
      label: 'Micro Taxpayer',
      thresholdDesc: 'Gross sales less than ₱3,000,000',
      withholdingExemption: isEopt, // Exempt from withholding tax obligation at source under RR 4-2024
      reducedPenalties: isEopt,     // 10% surcharge (vs 25%), 50% discount on interest
      maxItrPages: 2
    };
  } else if (sales < 20000000) {
    return {
      category: 'SMALL',
      label: 'Small Taxpayer',
      thresholdDesc: 'Gross sales ₱3,000,000 to less than ₱20,000,000',
      withholdingExemption: false,
      reducedPenalties: isEopt,     // 10% surcharge, 50% discount on interest
      maxItrPages: 2
    };
  } else if (sales < 1000000000) {
    return {
      category: 'MEDIUM',
      label: 'Medium Taxpayer',
      thresholdDesc: 'Gross sales ₱20,000,000 to less than ₱1,000,000,000',
      withholdingExemption: false,
      reducedPenalties: false,
      maxItrPages: 8
    };
  } else {
    return {
      category: 'LARGE',
      label: 'Large Taxpayer',
      thresholdDesc: 'Gross sales ₱1,000,000,000 and above (LTS)',
      withholdingExemption: false,
      reducedPenalties: false,
      maxItrPages: 8
    };
  }
}
