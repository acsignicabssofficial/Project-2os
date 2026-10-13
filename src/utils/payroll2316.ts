/**
 * SINGLE SOURCE OF TRUTH FOR COMPENSATION TAX REPORTING
 *
 *   Payroll record (per employee, per period)
 *        │  translatePayrollRecords()       -> BIR 2316 line items (items 29-52)
 *        ▼
 *   BIR 2316 (per employee, per year)       build2316()
 *        │  (monthly slice of the same translated lines)
 *        ▼
 *   BIR 1601-C Part II (per month)          build1601C()   items 14-36
 *        │  (annual roll-up of the same 2316 certificates)
 *        ▼
 *   Alphalist of Employees (annual)         buildAlphalist()   one row per 2316
 *
 * Every figure in 1601-C and the Alphalist is a sum of the same translated 2316
 * lines, so the three reports always reconcile with each other.
 */
import { PayrollRecord, TaxBracket } from '../types';

const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
export const r2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;

export const THIRTEENTH_MONTH_EXEMPT_CAP = 90000;
export const ANNUAL_NON_WITHHOLDING_THRESHOLD = 250000;

/* ------------------------------------------------------------------ */
/* Annual tax due (BIR 2316 Item 24) – TRAIN Law Sec. 24(A), 2023+      */
/* ------------------------------------------------------------------ */
export function computeAnnualTaxDue(taxable: number, taxBrackets?: TaxBracket[]): number {
  const t = n(taxable);
  if (t <= ANNUAL_NON_WITHHOLDING_THRESHOLD) return 0;

  const annual = (taxBrackets || []).filter(b => b.period === 'Annual');
  if (annual.length > 0) {
    const sorted = [...annual].sort((a, b) => a.min_income - b.min_income);
    // pick the highest bracket whose lower bound is below the income
    let match = sorted[0];
    for (const b of sorted) if (t >= b.min_income) match = b;
    // brackets store min as 250,000.01 etc.; excess is measured from the whole-peso floor
    const floor = Math.floor(match.min_income);
    return r2(match.base_tax + (t - floor) * match.excess_rate);
  }

  if (t <= 400000) return r2((t - 250000) * 0.15);
  if (t <= 800000) return r2(22500 + (t - 400000) * 0.2);
  if (t <= 2000000) return r2(102500 + (t - 800000) * 0.25);
  if (t <= 8000000) return r2(402500 + (t - 2000000) * 0.3);
  return r2(2202500 + (t - 8000000) * 0.35);
}

/* ------------------------------------------------------------------ */
/* Period helpers                                                       */
/* ------------------------------------------------------------------ */
export function getRecordYear(r: PayrollRecord): string {
  const ty = String(r.tax_year || '');
  if (/^\d{4}$/.test(ty)) return ty;
  const m = String(r.payroll_period || '').match(/\d{4}/);
  return m ? m[0] : '';
}

/** Month (1-12) a payroll record is reported under in 1601-C. Uses the period start, as saved by Payroll. */
export function getRecordMonth(r: PayrollRecord): number {
  const from = String(r.period_from || '');
  if (from.includes('/')) {
    const mm = parseInt(from.split('/')[0], 10);
    if (mm >= 1 && mm <= 12) return mm;
  }
  const p = String(r.payroll_period || '');
  const m1 = p.match(/^\d{4}-(\d{2})/); // 2024-0101 or 2024-01-31
  if (m1) {
    const mm = parseInt(m1[1], 10);
    if (mm >= 1 && mm <= 12) return mm;
  }
  return 12;
}

/* ------------------------------------------------------------------ */
/* Step 1: Payroll record -> 2316 line items                            */
/* ------------------------------------------------------------------ */
export interface Lines2316 {
  // Part IV-B A. Non-taxable / exempt
  i29: number; i30: number; i31: number; i32: number; i33: number;
  i34: number; i35: number; i36: number; i37: number;
  // Part IV-B B. Taxable regular
  i39: number; i40: number; i41: number; i42: number; i43: number; i44a: number; i44b: number;
  // Supplementary
  i45: number; i46: number; i47: number; i48: number; i49: number; i50: number; i51a: number; i51b: number;
  // Part IVA
  i22: number;          // taxable comp. from previous employer
  i25a: number;         // taxes withheld (present employer) incl. adjustments
  i25aBase: number;     // withheld per payroll run only (1601-C item 25)
  i25aAdj: number;      // adjustment of previously withheld (1601-C item 26)
  i27: number;          // 5% PERA credit
}

export interface TranslatedRecord {
  record: PayrollRecord;
  employeeId: string;
  year: string;
  month: number;
  isMwe: boolean;
  lines: Lines2316;
}

const emptyLines = (): Lines2316 => ({
  i29: 0, i30: 0, i31: 0, i32: 0, i33: 0, i34: 0, i35: 0, i36: 0, i37: 0,
  i39: 0, i40: 0, i41: 0, i42: 0, i43: 0, i44a: 0, i44b: 0,
  i45: 0, i46: 0, i47: 0, i48: 0, i49: 0, i50: 0, i51a: 0, i51b: 0,
  i22: 0, i25a: 0, i25aBase: 0, i25aAdj: 0, i27: 0
});

const LINE_KEYS = Object.keys(emptyLines()) as (keyof Lines2316)[];
const addLines = (a: Lines2316, b: Lines2316): Lines2316 => {
  const out = emptyLines();
  LINE_KEYS.forEach(k => { out[k] = a[k] + b[k]; });
  return out;
};

function recordToLines(p: PayrollRecord): Lines2316 {
  const sss = n(p.sss_deduction), phic = n(p.philhealth_deduction), hdmf = n(p.pagibig_deduction);
  const stat = sss + phic + hdmf > 0 ? sss + phic + hdmf : n(p.total_statutory);
  const base = n(p.withholding_tax);
  const adj = n(p.withholding_adjustment);
  return {
    i29: n(p.basic_pay), i30: n(p.holiday_pay), i31: n(p.overtime_pay), i32: n(p.night_differential),
    i33: n(p.hazard_pay), i34: n(p.thirteenth_month_pay), i35: n(p.de_minimis_benefits),
    i36: stat, i37: n(p.other_non_taxable),
    i39: n(p.taxable_basic), i40: n(p.representation), i41: n(p.transportation), i42: n(p.cola),
    i43: n(p.housing_allowance), i44a: n(p.item44a_val), i44b: n(p.item44b_val),
    i45: n(p.commission), i46: n(p.profit_sharing), i47: n(p.directors_fees),
    i48: n(p.taxable_thirteenth_month), i49: n(p.item49_hazard_pay_taxable), i50: n(p.taxable_overtime),
    i51a: n(p.item51a_val), i51b: n(p.item51b_val),
    i22: n(p.item22_taxable_prev_employer),
    i25a: base + adj, i25aBase: base, i25aAdj: adj,
    i27: n(p.item27_pera_tax_credit)
  };
}

/**
 * Translates every payroll record into BIR 2316 line items.
 * Enforces the ₱90,000 cap on exempt 13th month & other benefits (Item 34) cumulatively
 * per employee per year; any excess is moved to Item 48 (Taxable 13th Month Benefits).
 */
export function translatePayrollRecords(records: PayrollRecord[]): TranslatedRecord[] {
  const list: TranslatedRecord[] = (records || []).map(r => ({
    record: r,
    employeeId: String(r.employee_id),
    year: getRecordYear(r),
    month: getRecordMonth(r),
    isMwe: r.is_mwe === true,
    lines: recordToLines(r)
  }));

  const sorted = [...list].sort((a, b) =>
    a.employeeId.localeCompare(b.employeeId) || a.year.localeCompare(b.year) ||
    a.month - b.month || n(a.record.id) - n(b.record.id));

  const cum = new Map<string, number>();
  sorted.forEach(t => {
    const key = `${t.employeeId}|${t.year}`;
    const used = cum.get(key) || 0;
    const room = Math.max(0, THIRTEENTH_MONTH_EXEMPT_CAP - used);
    const exempt = Math.min(Math.max(t.lines.i34, 0), room);
    const excess = Math.max(t.lines.i34, 0) - exempt;
    t.lines = { ...t.lines, i34: exempt, i48: t.lines.i48 + excess };
    cum.set(key, used + exempt);
  });
  return list;
}

/* ------------------------------------------------------------------ */
/* Step 2: BIR 2316 (per employee, per year)                            */
/* ------------------------------------------------------------------ */
export interface Form2316 extends Lines2316 {
  employeeId: string;
  year: string;
  recordCount: number;
  isMwe: boolean;
  periodFrom: string;
  periodTo: string;
  item38: number;   // Total non-taxable/exempt
  item52: number;   // Total taxable compensation
  item19: number;   // Gross compensation (38 + 52)
  item20: number;   // Less non-taxable (from 38)
  item21: number;   // Taxable comp. present employer (19 - 20)
  item23: number;   // Gross taxable comp. (21 + 22)
  item24: number;   // Tax due
  item25b: number;  // Withheld by previous employer (not captured by payroll)
  item26: number;   // 25A + 25B
  item28: number;   // 26 + 27
  taxOverUnder: number; // item24 - item26  (positive = still to withhold, negative = refundable)
  labels: { i44a: string; i44b: string; i51a: string; i51b: string };
}

export function build2316(
  employeeId: string | number,
  year: string,
  translated: TranslatedRecord[],
  taxBrackets?: TaxBracket[]
): Form2316 {
  const id = String(employeeId);
  const rows = translated.filter(t => t.employeeId === id && t.year === year);
  const L = rows.reduce((acc, t) => addLines(acc, t.lines), emptyLines());
  const isMwe = rows.some(t => t.isMwe);

  const item38 = L.i29 + L.i30 + L.i31 + L.i32 + L.i33 + L.i34 + L.i35 + L.i36 + L.i37;
  const item52 = L.i39 + L.i40 + L.i41 + L.i42 + L.i43 + L.i44a + L.i44b +
                 L.i45 + L.i46 + L.i47 + L.i48 + L.i49 + L.i50 + L.i51a + L.i51b;
  const item19 = item38 + item52;
  const item20 = item38;
  const item21 = item19 - item20;
  const item23 = item21 + L.i22;
  const item24 = isMwe ? 0 : computeAnnualTaxDue(item23, taxBrackets);
  const item25b = 0;
  const item26 = L.i25a + item25b;
  const item28 = item26 + L.i27;

  const froms = rows.map(t => String(t.record.period_from || '')).filter(Boolean).sort();
  const tos = rows.map(t => String(t.record.period_to || '')).filter(Boolean).sort();
  const first = rows[0]?.record;

  return {
    ...L,
    employeeId: id, year, recordCount: rows.length, isMwe,
    periodFrom: froms[0] || '01/01', periodTo: tos[tos.length - 1] || '12/31',
    item38: r2(item38), item52: r2(item52), item19: r2(item19), item20: r2(item20),
    item21: r2(item21), item23: r2(item23), item24: r2(item24), item25b, item26: r2(item26),
    item28: r2(item28), taxOverUnder: r2(item24 - item26),
    labels: {
      i44a: first?.item44a_label || '', i44b: first?.item44b_label || '',
      i51a: first?.item51a_label || '', i51b: first?.item51b_label || ''
    }
  };
}

/* ------------------------------------------------------------------ */
/* Step 3: BIR 1601-C Part II (per month) – items 14 to 36              */
/* ------------------------------------------------------------------ */
export interface Form1601C {
  year: string;
  month: number;
  employeeCount: number;
  recordCount: number;
  item14: number; item15: number; item16: number; item17: number; item18: number;
  item19: number; item20: number; item21: number; item22: number; item23: number;
  item24: number; item25: number; item26: number; item27: number; item28: number;
  item29: number; item30: number; item31: number;
  item32: number; item33: number; item34: number; item35: number; item36: number;
}

export interface Form1601COptions {
  taxBrackets?: TaxBracket[];
  prevRemitted?: number;        // item 28
  otherRemittances?: number;    // item 29
  surcharge?: number;           // item 32
  interest?: number;            // item 33
  compromise?: number;          // item 34
}

export function build1601C(
  year: string,
  month: number,
  translated: TranslatedRecord[],
  opts: Form1601COptions = {}
): Form1601C {
  const rows = translated.filter(t => t.year === year && t.month === month);

  let i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i25 = 0, i26 = 0;
  rows.forEach(t => {
    const L = t.lines;
    const nonTax = L.i29 + L.i30 + L.i31 + L.i32 + L.i33 + L.i34 + L.i35 + L.i36 + L.i37;
    const taxable = L.i39 + L.i40 + L.i41 + L.i42 + L.i43 + L.i44a + L.i44b +
                    L.i45 + L.i46 + L.i47 + L.i48 + L.i49 + L.i50 + L.i51a + L.i51b;
    i14 += nonTax + taxable;                                  // = Σ 2316 item 19
    i15 += t.isMwe ? L.i29 : 0;                               // statutory minimum wage of MWEs
    i16 += L.i30 + L.i31 + L.i32 + L.i33;                     // holiday, OT, night diff, hazard
    i17 += L.i34;                                             // 13th month & other benefits
    i18 += L.i35;                                             // de minimis
    i19 += L.i36;                                             // SSS/GSIS/PHIC/HDMF + union dues (EE share)
    i20 += (t.isMwe ? 0 : L.i29) + L.i37;                     // other non-taxable
    i25 += L.i25aBase;
    i26 += L.i25aAdj;
  });

  const i21 = i15 + i16 + i17 + i18 + i19 + i20;              // Sum of items 15 to 20
  const i22 = i14 - i21;                                      // Item 14 less item 21

  // Item 23: taxable compensation of non-MWE employees whose annual taxable compensation
  // is P250,000 and below (tax due = 0 on their 2316), thus not subject to withholding.
  const certCache = new Map<string, Form2316>();
  let i23 = 0;
  rows.forEach(t => {
    if (t.isMwe) return;
    const key = t.employeeId;
    if (!certCache.has(key)) certCache.set(key, build2316(key, year, translated, opts.taxBrackets));
    const cert = certCache.get(key)!;
    if (cert.item23 <= ANNUAL_NON_WITHHOLDING_THRESHOLD) {
      const L = t.lines;
      i23 += L.i39 + L.i40 + L.i41 + L.i42 + L.i43 + L.i44a + L.i44b +
             L.i45 + L.i46 + L.i47 + L.i48 + L.i49 + L.i50 + L.i51a + L.i51b;
    }
  });

  const i24 = i22 - i23;
  const i27 = i25 + i26;
  const i28 = n(opts.prevRemitted);
  const i29 = n(opts.otherRemittances);
  const i30 = i28 + i29;
  const i31 = i27 - i30;
  const i32 = n(opts.surcharge), i33 = n(opts.interest), i34 = n(opts.compromise);
  const i35 = i32 + i33 + i34;
  const i36 = i31 + i35;

  return {
    year, month,
    employeeCount: new Set(rows.map(t => t.employeeId)).size,
    recordCount: rows.length,
    item14: r2(i14), item15: r2(i15), item16: r2(i16), item17: r2(i17), item18: r2(i18),
    item19: r2(i19), item20: r2(i20), item21: r2(i21), item22: r2(i22), item23: r2(i23),
    item24: r2(i24), item25: r2(i25), item26: r2(i26), item27: r2(i27), item28: r2(i28),
    item29: r2(i29), item30: r2(i30), item31: r2(i31),
    item32: r2(i32), item33: r2(i33), item34: r2(i34), item35: r2(i35), item36: r2(i36)
  };
}

/* ------------------------------------------------------------------ */
/* Step 4: Alphalist of Employees (annual) – one row per 2316           */
/* ------------------------------------------------------------------ */
export interface AlphalistRow {
  seq: number;
  empId: string;
  tin: string;
  name: string;
  isMwe: boolean;
  form: Form2316;
  gross: number;
  statutory: number;
  exempt13th: number;
  totalNonTaxable: number;
  totalTaxable: number;
  annualTaxDue: number;
  taxWithheld: number;
  adjustment: number;      // withheld - tax due (positive = refund, negative = to withhold)
  recordCount: number;
}

export function buildAlphalist(
  year: string,
  employees: any[],
  translated: TranslatedRecord[],
  taxBrackets?: TaxBracket[]
): AlphalistRow[] {
  const ids = new Set<string>();
  const empById = new Map<string, any>();
  (employees || []).forEach(e => { empById.set(String(e.employee_id), e); });
  translated.filter(t => t.year === year).forEach(t => ids.add(t.employeeId));
  // employees without payroll still appear with a zero 2316 (so the register is complete)
  empById.forEach((_e, id) => ids.add(id));

  return Array.from(ids).map((id, idx) => {
    const emp = empById.get(id);
    const f = build2316(id, year, translated, taxBrackets);
    const rec = translated.find(t => t.employeeId === id)?.record;
    const name = emp
      ? (`${emp.last_name || ''}, ${emp.first_name || ''} ${emp.middle_name || ''}`.trim().replace(/^,\s*/, '') || emp.full_name || id)
      : (rec?.full_name || rec?.employee_name || id);
    return {
      seq: idx + 1,
      empId: id,
      tin: emp?.tin || rec?.employee_tin || '000-000-000-000',
      name,
      isMwe: f.isMwe,
      form: f,
      gross: f.item19,
      statutory: f.i36,
      exempt13th: f.i34,
      totalNonTaxable: f.item38,
      totalTaxable: f.item23,
      annualTaxDue: f.item24,
      taxWithheld: f.item28,
      adjustment: r2(f.item28 - f.item24),
      recordCount: f.recordCount
    };
  });
}

/** Reconciliation proof: Σ monthly 1601-C == Σ employee 2316 (same translated lines). */
export function reconcileYear(
  year: string,
  employees: any[],
  translated: TranslatedRecord[],
  taxBrackets?: TaxBracket[]
) {
  let gross1601 = 0, nonTax1601 = 0, withheld1601 = 0;
  for (let m = 1; m <= 12; m++) {
    const f = build1601C(year, m, translated, { taxBrackets });
    gross1601 += f.item14; nonTax1601 += f.item21; withheld1601 += f.item27;
  }
  const rows = buildAlphalist(year, employees, translated, taxBrackets);
  const gross2316 = rows.reduce((s, r) => s + r.form.item19, 0);
  const nonTax2316 = rows.reduce((s, r) => s + r.form.item38, 0);
  const withheld2316 = rows.reduce((s, r) => s + r.form.item26, 0);
  const diff = (a: number, b: number) => r2(a - b);
  return {
    gross: { c1601: r2(gross1601), f2316: r2(gross2316), diff: diff(gross1601, gross2316) },
    nonTaxable: { c1601: r2(nonTax1601), f2316: r2(nonTax2316), diff: diff(nonTax1601, nonTax2316) },
    withheld: { c1601: r2(withheld1601), f2316: r2(withheld2316), diff: diff(withheld1601, withheld2316) },
    balanced:
      Math.abs(gross1601 - gross2316) < 0.01 &&
      Math.abs(nonTax1601 - nonTax2316) < 0.01 &&
      Math.abs(withheld1601 - withheld2316) < 0.01
  };
}
