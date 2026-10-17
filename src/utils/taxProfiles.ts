import { Company, EntityTaxYearProfile } from '../types';

export function isIndividualEntity(entityType?: string): boolean {
  if (!entityType) return true;
  const t = entityType.toUpperCase().trim();
  return (
    t.includes('INDIVIDUAL') ||
    t.includes('SOLE') ||
    t.includes('PROP') ||
    t.includes('PROFESSIONAL') ||
    t.includes('SINGLE') ||
    t.includes('FREELANCE') ||
    t.includes('SELF-EMPLOYED') ||
    t.includes('ESTATE') ||
    t.includes('TRUST')
  );
}

/**
 * Returns the effective tax profile for a given calendar year for an entity.
 * If no specific year record is configured in company.tax_year_profiles,
 * it falls back cleanly to the company's root BIR registration settings.
 */
export function getEntityTaxProfileForYear(
  company: Company | null | undefined,
  year: number | string
): EntityTaxYearProfile {
  const yrNum = typeof year === 'string' ? parseInt(year, 10) : year;
  const safeYear = !isNaN(yrNum) && yrNum > 1900 ? yrNum : new Date().getFullYear();
  const isIndiv = company ? isIndividualEntity(company.entity_type) : true;

  // Root fallback settings from company
  const defaultIncomeTaxType: 'GRADUATED' | 'EIGHT_PERCENT' =
    isIndiv && company?.income_tax_type === 'EIGHT_PERCENT' ? 'EIGHT_PERCENT' : 'GRADUATED';
  const defaultExpenseDeduction: 'ITEMIZED' | 'OSD_40' =
    company?.expense_deduction_type === 'OSD_40' ? 'OSD_40' : 'ITEMIZED';
  const defaultVat: 'VATABLE' | 'NON-VAT' | 'EXEMPT' =
    (company?.vat_or_non_vat as any) || 'VATABLE';

  const defaultProfile: EntityTaxYearProfile = {
    year: safeYear,
    income_tax_type: defaultIncomeTaxType,
    expense_deduction_type: defaultIncomeTaxType === 'EIGHT_PERCENT' ? 'ITEMIZED' : defaultExpenseDeduction,
    vat_or_non_vat: defaultVat,
    allow_250k_exemption: true,
    notes: 'Default registration profile',
    taxpayer_classification: 'MICRO'
  };

  if (!company || !company.tax_year_profiles || company.tax_year_profiles.length === 0) {
    return defaultProfile;
  }

  const match = company.tax_year_profiles.find(p => Number(p.year) === safeYear);
  if (match) {
    const finalTaxType: 'GRADUATED' | 'EIGHT_PERCENT' =
      isIndiv && match.income_tax_type === 'EIGHT_PERCENT' ? 'EIGHT_PERCENT' : 'GRADUATED';
    return {
      year: safeYear,
      income_tax_type: finalTaxType,
      expense_deduction_type: finalTaxType === 'EIGHT_PERCENT' ? 'ITEMIZED' : (match.expense_deduction_type || 'ITEMIZED'),
      vat_or_non_vat: match.vat_or_non_vat || defaultVat,
      allow_250k_exemption: match.allow_250k_exemption !== false,
      notes: match.notes || '',
      taxpayer_classification: match.taxpayer_classification || 'MICRO'
    };
  }

  return defaultProfile;
}

/**
 * Upserts (inserts or updates) a yearly tax profile for a company and returns a new Company object.
 */
export function upsertEntityTaxProfile(
  company: Company,
  profile: EntityTaxYearProfile
): Company {
  const currentProfiles = company.tax_year_profiles ? [...company.tax_year_profiles] : [];
  const idx = currentProfiles.findIndex(p => Number(p.year) === Number(profile.year));

  const sanitizedProfile: EntityTaxYearProfile = {
    ...profile,
    year: Number(profile.year),
    income_tax_type: profile.income_tax_type,
    expense_deduction_type: profile.income_tax_type === 'EIGHT_PERCENT' ? 'ITEMIZED' : profile.expense_deduction_type,
    vat_or_non_vat: profile.vat_or_non_vat || 'NON-VAT',
    allow_250k_exemption: profile.allow_250k_exemption !== false,
    notes: (profile.notes || '').trim(),
    taxpayer_classification: profile.taxpayer_classification || 'MICRO'
  };

  if (idx >= 0) {
    currentProfiles[idx] = sanitizedProfile;
  } else {
    currentProfiles.push(sanitizedProfile);
  }

  // Sort profiles chronologically
  currentProfiles.sort((a, b) => Number(a.year) - Number(b.year));

  return {
    ...company,
    tax_year_profiles: currentProfiles
  };
}

/**
 * Removes a specific year's profile from a company.
 */
export function removeEntityTaxProfile(company: Company, year: number): Company {
  const currentProfiles = company.tax_year_profiles || [];
  return {
    ...company,
    tax_year_profiles: currentProfiles.filter(p => Number(p.year) !== Number(year))
  };
}

/**
/**
 * Extracts the starting entity registration year from date_of_registration or incorporation date
 */
export function getEntityRegistrationYear(company?: Company | null): number | null {
  if (!company) return null;
  const rawDate = company.date_of_registration || company.birthday_or_incorporation_date;
  if (typeof rawDate === 'string' && rawDate.length >= 4) {
    const yr = parseInt(rawDate.slice(0, 4), 10);
    if (!isNaN(yr) && yr > 1900 && yr < 2100) return yr;
  }
  return null;
}

/**
 * Generates an array of available tax years containing:
 * 1. The present year (current calendar year)
 * 2. Entity books starting from the Date of Registration (BIR Form 2303 / COR) onwards up to present year
 * 3. Any other years that have actual input transactions or configured tax profiles.
 * Example: If registration starts at October 2014, then available books start from 2014 onwards (2014...2026).
 */
export function getAvailableTaxYears(
  company?: Company | null,
  transactions?: any[]
): number[] {
  const yearsSet = new Set<number>();

  // 1. Present calendar year is always included
  const presentYear = new Date().getFullYear();
  yearsSet.add(presentYear);

  // 2. Entity books start on the Date of Registration from BIR 2303 / COR
  const regYear = getEntityRegistrationYear(company);
  if (regYear && regYear <= presentYear) {
    for (let y = regYear; y <= presentYear; y++) {
      yearsSet.add(y);
    }
  } else if (regYear) {
    yearsSet.add(regYear);
  }

  // 3. Include any years found in actual input transactions
  if (Array.isArray(transactions)) {
    transactions.forEach(t => {
      const d = t?.invoice_date || t?.expense_date || t?.date || t?.transaction_date || t?.issue_date || t?.collection_date || t?.payment_date;
      if (typeof d === 'string' && d.length >= 4) {
        const yr = parseInt(d.slice(0, 4), 10);
        if (!isNaN(yr) && yr > 1900 && yr < 2100) yearsSet.add(yr);
      }
    });
  }

  // 4. Include any years configured in company tax profiles
  if (company?.tax_year_profiles) {
    company.tax_year_profiles.forEach(p => {
      const yr = Number(p.year);
      if (!isNaN(yr) && yr > 1900 && yr < 2100) yearsSet.add(yr);
    });
  }

  return Array.from(yearsSet).sort((a, b) => b - a); // Descending (e.g. 2026, 2025... 2014)
}
