/**
 * SINGLE SOURCE OF TRUTH FOR CREDITABLE / EXPANDED WITHHOLDING TAX (BIR 2307)
 *
 * PURCHASES / EXPENSES (company is the withholding agent)
 *   expense with EWT ─► normalizeTransactions()      one line per expense
 *                    ─► buildCertificates()          BIR 2307 per payee per quarter (issued)
 *                    ─► build0619E()                 months 1 & 2 of each quarter
 *                    ─► build1601EQ()                quarter total less 0619-E remittances
 *                    ─► buildQAP()                   quarterly alphalist of payees
 *
 * SALES (company is the payee; customers issue 2307 to the company)
 *   sale with CWT    ─► normalizeTransactions()
 *                    ─► buildCertificates()          BIR 2307 per payor per quarter (received)
 *                    ─► creditableForITR()           credit on 1701/1702 (quarterly & annual)
 *                    ─► buildSAWT()                  summary alphalist of withholding tax at source
 *
 * Every report is a sum of the same normalized lines, so they always reconcile.
 */

const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
export const r2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;

export type Direction = 'issued' | 'received';

/* ------------------------------------------------------------------ */
/* ATC catalog (only codes whose description is certain)                */
/* ------------------------------------------------------------------ */
export const ATC_CATALOG: Record<string, { rate: number; nature: string }> = {
  WI010: { rate: 5, nature: 'Professional fees paid to individuals (gross income for the current year did not exceed ₱3M)' },
  WI011: { rate: 10, nature: 'Professional fees paid to individuals (gross income for the current year exceeded ₱3M)' },
  WC010: { rate: 5, nature: 'Professional fees paid to non-individuals (gross income for the current year did not exceed ₱720,000)' },
  WC011: { rate: 10, nature: 'Professional fees paid to non-individuals (gross income for the current year exceeded ₱720,000)' },
  WI100: { rate: 5, nature: 'Rentals: real or personal property, poles, satellites, transmission facilities (individual payee)' },
  WC100: { rate: 5, nature: 'Rentals: real or personal property, poles, satellites, transmission facilities (non-individual payee)' },
  WI120: { rate: 2, nature: 'Income payments to certain contractors (individual payee)' },
  WC120: { rate: 2, nature: 'Income payments to certain contractors (non-individual payee)' },
  WI158: { rate: 1, nature: 'Income payments made by top withholding agents to local/resident supplier of goods other than those covered by other rates of withholding tax' },
  WC158: { rate: 1, nature: 'Income payments made by top withholding agents to local/resident supplier of goods other than those covered by other rates of withholding tax' },
  WI160: { rate: 2, nature: 'Income payment made by top withholding agents to their local/resident supplier of services other than those covered by other rates of withholding tax' },
  WC160: { rate: 2, nature: 'Income payment made by top withholding agents to their local/resident supplier of services other than those covered by other rates of withholding tax' }
};

export function atcNature(atc: string, ratePct: number): string {
  return ATC_CATALOG[atc]?.nature || `Income payment subject to withholding tax (ATC ${atc}, ${ratePct}%)`;
}

const NON_INDIVIDUAL_RE = /\b(corp|corporation|inc|incorporated|co|company|ltd|llc|opc|trading|enterprises?|logistics|services|foundation|cooperative|coop|association|bank)\b/i;

export function deriveAtc(name: string, text: string, ratePct: number): string {
  const p = NON_INDIVIDUAL_RE.test(name || '') ? 'WC' : 'WI';
  const t = (text || '').toLowerCase();
  if (/\b(rent|rental|lease)\b/.test(t)) return `${p}100`;
  if (/(professional|consult|legal|audit|accounting|attorney|architect|engineer)/.test(t)) return ratePct >= 10 ? `${p}011` : `${p}010`;
  if (/(contractor|subcontract|construction)/.test(t)) return `${p}120`;
  if (ratePct >= 10) return `${p}011`;
  if (ratePct >= 5) return `${p}100`;
  if (ratePct >= 2) return `${p}160`;
  return `${p}158`;
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                         */
/* ------------------------------------------------------------------ */
export function parseYMD(raw: any): { y: number; m: number; d: number } | null {
  const s = String(raw || '').trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return { y: +m[3], m: +m[1], d: +m[2] };
  return null;
}
export const quarterOfMonth = (m: number) => Math.ceil(m / 3);
export const quarterLabel = (q: number) => `Q${q}`;
export const parseQuarter = (q: string | number): number => (typeof q === 'number' ? q : parseInt(String(q).replace(/\D/g, ''), 10) || 1);

const pad2 = (v: number) => String(v).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();
export const quarterPeriod = (year: string | number, q: number) => {
  const y = +year;
  const m1 = (q - 1) * 3 + 1, m3 = q * 3;
  return { from: `${pad2(m1)}/01/${y}`, to: `${pad2(m3)}/${pad2(lastDay(y, m3))}/${y}` };
};

/* ------------------------------------------------------------------ */
/* Step 1: normalize every expense / sale that carries withholding tax  */
/* ------------------------------------------------------------------ */
export interface CwtTxn {
  id: number | string;
  direction: Direction;
  date: string;
  year: string;            // '' when the record has no usable date
  month: number;           // 1-12
  quarter: number;         // 1-4
  monthInQuarter: 1 | 2 | 3;
  ref: string;
  partyName: string;
  partyTin: string;        // formatted 000-000-000-00000
  partyTin9: string;
  partyBranch: string;
  partyAddress: string;
  base: number;            // income payment (net of VAT)
  tax: number;
  ratePct: number;
  atc: string;
  atcDerived: boolean;
  nature: string;
}

const pickTax = (r: any): number =>
  n(r.tax_withheld ?? r.withholding_2307_2306 ?? r.withholding_2307 ?? r.amount_withheld_2307 ?? r.less_withholding_tax ?? r.ewt_amount);

function pickBase(r: any): number {
  const v = n(r.vatable_amount ?? r.vatable_purchases ?? r.vatable_sales ?? r.vatable_expense_amount ?? r.vatable_expense);
  const z = n(r.zero_rated_amount ?? r.zero_rated);
  const x = n(r.vat_exempt_amount ?? r.vat_exempt);
  if (v + z + x > 0) return v + z + x;
  const amt = n(r.amount ?? r.total_amount_net_of_vat ?? r.amount_net_of_vat);
  if (amt > 0) return amt;
  const incl = n(r.expense_invoice_amount ?? r.invoice_amount ?? r.total_amount_vat_inclusive);
  const isVat = String(r.vat_or_nonvat || r.nonvat_or_vat || r.vat_status || '').toUpperCase() === 'VAT';
  return isVat && incl > 0 ? r2(incl / 1.12) : incl;
}

const splitTin = (raw: any): { tin: string; tin9: string; branch: string } => {
  const digits = String(raw || '').replace(/\D/g, '');
  const tin9 = digits.slice(0, 9).padEnd(9, '0');
  const branch = (digits.length > 9 ? digits.slice(9, 14) : '').padEnd(5, '0').slice(0, 5) || '00000';
  const tin = `${tin9.slice(0, 3)}-${tin9.slice(3, 6)}-${tin9.slice(6, 9)}-${branch}`;
  return { tin, tin9, branch };
};

export interface NormalizeOptions {
  exclude?: (rec: any) => boolean;
  /** Directory lookup (providers / customers): supplies address and default ATC when the record has none. */
  partyLookup?: (tin9: string, name: string) => { address?: string; atc?: string } | undefined;
}

export function normalizeTransactions(records: any[], direction: Direction, opts: NormalizeOptions = {}): CwtTxn[] {
  const out: CwtTxn[] = [];
  (records || []).forEach(r => {
    if (!r || r.is_cancelled) return;
    if (opts.exclude && opts.exclude(r)) return;
    const tax = pickTax(r);
    if (tax <= 0) return;

    const name = String(
      direction === 'issued'
        ? (r.service_provider_name || r.registered_name || r.supplier_name || 'Vendor / Contractor')
        : (r.customer_name || r.registered_name || 'Customer / Payor')
    );
    const { tin, tin9, branch } = splitTin(
      direction === 'issued' ? (r.sp_tin || r.tin || r.service_provider_TIN) : (r.customer_tin || r.client_TIN || r.tin)
    );
    const date = String(
      direction === 'issued' ? (r.expense_date || r.date || r.issue_date || '') : (r.invoice_date || r.date || r.issue_date || '')
    );
    const ymd = parseYMD(date);
    const base = pickBase(r);
    const ratePct = base > 0 ? r2((tax / base) * 100) : 0;

    const dir = opts.partyLookup?.(tin9, name);
    const explicit = String(r.atc_code || r.atc || dir?.atc || '').trim().toUpperCase();
    const text = [r.expense_type, r.particulars, r.description, r.expense_category].filter(Boolean).join(' ');
    const atc = explicit || deriveAtc(name, text, ratePct);

    out.push({
      id: r.id,
      direction,
      date,
      year: ymd ? String(ymd.y) : '',
      month: ymd ? ymd.m : 0,
      quarter: ymd ? quarterOfMonth(ymd.m) : 0,
      monthInQuarter: (ymd ? ((ymd.m - 1) % 3) + 1 : 1) as 1 | 2 | 3,
      ref: String(direction === 'issued' ? (r.voucher_number || r.invoice_number || `VCH-${r.id}`) : (r.invoice_number || `INV-${r.id}`)),
      partyName: name,
      partyTin: tin,
      partyTin9: tin9,
      partyBranch: branch,
      partyAddress: String(r.address || r.sp_address || r.service_provider_Address || r.customer_address || r.client_Address
        || dir?.address || ''),
      base: r2(base),
      tax: r2(tax),
      ratePct,
      atc,
      atcDerived: !explicit,
      nature: atcNature(atc, ratePct)
    });
  });
  return out;
}

export const txnsForQuarter = (txns: CwtTxn[], year: string, quarter: number) =>
  txns.filter(t => t.year === String(year) && t.quarter === quarter);

/* ------------------------------------------------------------------ */
/* Step 2: BIR 2307 certificates (one per counterparty per quarter)     */
/* ------------------------------------------------------------------ */
export interface Cert2307Line {
  atc: string;
  atcDerived: boolean;
  nature: string;
  ratePct: number;
  month1: number; month2: number; month3: number;   // income payments per month of the quarter
  tax1: number; tax2: number; tax3: number;         // tax withheld per month of the quarter
  totalAmount: number;
  taxWithheld: number;
}
export interface Cert2307 {
  certNo: string;
  direction: Direction;
  year: string;
  quarter: number;
  periodFrom: string;       // MM/DD/YYYY
  periodTo: string;
  partyTin: string;
  partyBranch: string;
  partyName: string;
  partyAddress: string;
  lines: Cert2307Line[];
  totalAmount: number;
  totalTax: number;
  monthTax: [number, number, number];
  txnIds: (number | string)[];
}

export function buildCertificates(txns: CwtTxn[], year: string, quarter: number): Cert2307[] {
  const rows = txnsForQuarter(txns, year, quarter);
  const groups = new Map<string, CwtTxn[]>();
  rows.forEach(t => {
    const key = t.partyTin9 !== '000000000' ? `${t.partyTin9}|${t.partyBranch}` : `name:${t.partyName.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const period = quarterPeriod(year, quarter);
  let seq = 0;
  return Array.from(groups.values())
    .map(list => {
      const byAtc = new Map<string, Cert2307Line>();
      list.forEach(t => {
        let L = byAtc.get(t.atc);
        if (!L) {
          L = { atc: t.atc, atcDerived: t.atcDerived, nature: t.nature, ratePct: t.ratePct,
                month1: 0, month2: 0, month3: 0, tax1: 0, tax2: 0, tax3: 0, totalAmount: 0, taxWithheld: 0 };
          byAtc.set(t.atc, L);
        }
        const k = t.monthInQuarter;
        (L as any)[`month${k}`] += t.base;
        (L as any)[`tax${k}`] += t.tax;
        L.totalAmount += t.base;
        L.taxWithheld += t.tax;
        if (t.atcDerived === false) L.atcDerived = false;
      });
      const lines = Array.from(byAtc.values()).map(L => ({
        ...L,
        month1: r2(L.month1), month2: r2(L.month2), month3: r2(L.month3),
        tax1: r2(L.tax1), tax2: r2(L.tax2), tax3: r2(L.tax3),
        totalAmount: r2(L.totalAmount), taxWithheld: r2(L.taxWithheld),
        ratePct: L.totalAmount > 0 ? r2((L.taxWithheld / L.totalAmount) * 100) : L.ratePct
      }));
      const first = list[0];
      seq += 1;
      return {
        certNo: `2307-${year}Q${quarter}-${first.partyTin9}-${String(seq).padStart(3, '0')}`,
        direction: first.direction,
        year: String(year), quarter,
        periodFrom: period.from, periodTo: period.to,
        partyTin: first.partyTin, partyBranch: first.partyBranch,
        partyName: first.partyName,
        partyAddress: list.find(t => t.partyAddress)?.partyAddress || '',
        lines,
        totalAmount: r2(lines.reduce((s, l) => s + l.totalAmount, 0)),
        totalTax: r2(lines.reduce((s, l) => s + l.taxWithheld, 0)),
        monthTax: [
          r2(lines.reduce((s, l) => s + l.tax1, 0)),
          r2(lines.reduce((s, l) => s + l.tax2, 0)),
          r2(lines.reduce((s, l) => s + l.tax3, 0))
        ] as [number, number, number],
        txnIds: list.map(t => t.id)
      } as Cert2307;
    })
    .sort((a, b) => a.partyName.localeCompare(b.partyName));
}

/* ------------------------------------------------------------------ */
/* Step 3a: BIR 0619-E (monthly remittance, months 1 and 2 only)        */
/* ------------------------------------------------------------------ */
export interface Form0619E {
  year: string;
  quarter: number;
  monthInQuarter: 1 | 2 | 3;
  calendarMonth: number;
  applicable: boolean;      // false for the 3rd month (covered by 1601-EQ)
  payeeCount: number;
  item14: number;           // Amount of Remittance
  item15: number;           // Less: amount remitted from previously filed form (amended)
  item16: number;           // Net Amount of Remittance (14 less 15)
  item17a: number; item17b: number; item17c: number;
  item17d: number;          // Total Penalties
  item18: number;           // Total Amount of Remittance (16 + 17D)
}
export interface Form0619EOptions { prevRemitted?: number; surcharge?: number; interest?: number; compromise?: number; }

export function build0619E(certs: Cert2307[], year: string, quarter: number, monthInQuarter: 1 | 2 | 3, opts: Form0619EOptions = {}): Form0619E {
  const applicable = monthInQuarter !== 3;
  const relevant = certs.filter(c => c.year === String(year) && c.quarter === quarter);
  const withheld = applicable ? relevant.reduce((s, c) => s + c.monthTax[monthInQuarter - 1], 0) : 0;
  const item14 = r2(withheld);
  const item15 = applicable ? r2(n(opts.prevRemitted)) : 0;
  const item16 = r2(item14 - item15);
  const a = applicable ? r2(n(opts.surcharge)) : 0, b = applicable ? r2(n(opts.interest)) : 0, c = applicable ? r2(n(opts.compromise)) : 0;
  const item17d = r2(a + b + c);
  return {
    year: String(year), quarter, monthInQuarter,
    calendarMonth: (quarter - 1) * 3 + monthInQuarter,
    applicable,
    payeeCount: applicable ? relevant.filter(x => x.monthTax[monthInQuarter - 1] > 0).length : 0,
    item14, item15, item16, item17a: a, item17b: b, item17c: c, item17d,
    item18: r2(item16 + item17d)
  };
}

/* ------------------------------------------------------------------ */
/* Step 3b: BIR 1601-EQ (quarterly) – ties to the two 0619-E returns    */
/* ------------------------------------------------------------------ */
export interface Form1601EQ {
  year: string;
  quarter: number;
  payeeCount: number;
  item14: number;           // Total taxes withheld for the quarter (Σ QAP)
  item15a: number;          // Remitted – 1st month (0619-E net amount, item 16)
  item15b: number;          // Remitted – 2nd month (0619-E net amount, item 16)
  item15c: number;          // Tax remitted in return previously filed (amended)
  item15d: number;          // Over-remittance from previous quarter / other credits
  item16: number;           // Total remittances made
  item17: number;           // Tax still due / (over-remittance)
  item18a: number; item18b: number; item18c: number;
  item18d: number;          // Total penalties
  item19: number;           // Total amount still due / (over-remittance)
}
export interface Form1601EQOptions {
  m1?: Form0619EOptions; m2?: Form0619EOptions;
  prevRemitted?: number; prevOverRemittance?: number;
  surcharge?: number; interest?: number; compromise?: number;
}

export function build1601EQ(certs: Cert2307[], year: string, quarter: number, opts: Form1601EQOptions = {}): Form1601EQ {
  const relevant = certs.filter(c => c.year === String(year) && c.quarter === quarter);
  const item14 = r2(relevant.reduce((s, c) => s + c.totalTax, 0));
  const f1 = build0619E(certs, year, quarter, 1, opts.m1);
  const f2 = build0619E(certs, year, quarter, 2, opts.m2);
  const item15a = f1.item16, item15b = f2.item16;
  const item15c = r2(n(opts.prevRemitted)), item15d = r2(n(opts.prevOverRemittance));
  const item16 = r2(item15a + item15b + item15c + item15d);
  const item17 = r2(item14 - item16);
  const a = r2(n(opts.surcharge)), b = r2(n(opts.interest)), c = r2(n(opts.compromise));
  const item18d = r2(a + b + c);
  return {
    year: String(year), quarter, payeeCount: relevant.length,
    item14, item15a, item15b, item15c, item15d, item16, item17,
    item18a: a, item18b: b, item18c: c, item18d, item19: r2(item17 + item18d)
  };
}

/* ------------------------------------------------------------------ */
/* Step 4a: QAP – Quarterly Alphalist of Payees (from issued 2307)      */
/* ------------------------------------------------------------------ */
export interface AlphalistWhtRow {
  seq: number;
  tin: string;
  branch: string;
  name: string;
  atc: string;
  atcDerived: boolean;
  nature: string;
  ratePct: number;
  month1: number; month2: number; month3: number;
  incomePayment: number;
  taxWithheld: number;
  certNos: string[];
}

export function buildQAP(certs: Cert2307[], year: string, quarter: number) {
  const rows: AlphalistWhtRow[] = [];
  certs.filter(c => c.year === String(year) && c.quarter === quarter).forEach(c => {
    c.lines.forEach(l => {
      rows.push({
        seq: 0, tin: c.partyTin, branch: c.partyBranch, name: c.partyName,
        atc: l.atc, atcDerived: l.atcDerived, nature: l.nature, ratePct: l.ratePct,
        month1: l.month1, month2: l.month2, month3: l.month3,
        incomePayment: l.totalAmount, taxWithheld: l.taxWithheld, certNos: [c.certNo]
      });
    });
  });
  rows.sort((a, b) => a.name.localeCompare(b.name) || a.atc.localeCompare(b.atc));
  rows.forEach((r, i) => { r.seq = i + 1; });
  return {
    rows,
    totalIncome: r2(rows.reduce((s, r) => s + r.incomePayment, 0)),
    totalTax: r2(rows.reduce((s, r) => s + r.taxWithheld, 0))
  };
}

/* ------------------------------------------------------------------ */
/* Step 4b: SAWT – Summary Alphalist of Withholding Tax at Source       */
/* ------------------------------------------------------------------ */
export type ItrPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';

export function buildSAWT(txns: CwtTxn[], year: string, period: ItrPeriod | 'ALL') {
  const wanted = (period === 'ALL' || period === 'ANNUAL') ? [1, 2, 3, 4] : [parseQuarter(period)];
  const map = new Map<string, AlphalistWhtRow>();
  const certNos = new Set<string>();
  wanted.forEach(q => {
    buildCertificates(txns, year, q).forEach(c => {
      certNos.add(c.certNo);
      c.lines.forEach(l => {
        const unknownTin = c.partyTin.replace(/\D/g, '').slice(0, 9) === '000000000';
        const key = `${unknownTin ? c.partyName : c.partyTin}|${c.partyName}|${l.atc}`;
        const ex = map.get(key);
        if (ex) {
          ex.month1 += l.month1; ex.month2 += l.month2; ex.month3 += l.month3;
          ex.incomePayment += l.totalAmount; ex.taxWithheld += l.taxWithheld; ex.certNos.push(c.certNo);
        } else {
          map.set(key, {
            seq: 0, tin: c.partyTin, branch: c.partyBranch, name: c.partyName,
            atc: l.atc, atcDerived: l.atcDerived, nature: l.nature, ratePct: l.ratePct,
            month1: l.month1, month2: l.month2, month3: l.month3,
            incomePayment: l.totalAmount, taxWithheld: l.taxWithheld, certNos: [c.certNo]
          });
        }
      });
    });
  });
  const rows = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name) || a.atc.localeCompare(b.atc));
  rows.forEach((r, i) => {
    r.seq = i + 1;
    r.incomePayment = r2(r.incomePayment); r.taxWithheld = r2(r.taxWithheld);
    r.ratePct = r.incomePayment > 0 ? r2((r.taxWithheld / r.incomePayment) * 100) : r.ratePct;
  });
  return {
    rows,
    certificateCount: certNos.size,
    totalIncome: r2(rows.reduce((s, r) => s + r.incomePayment, 0)),
    totalTax: r2(rows.reduce((s, r) => s + r.taxWithheld, 0))
  };
}

/* ------------------------------------------------------------------ */
/* Step 5: Credit on the income tax return (quarterly and annual)       */
/* ------------------------------------------------------------------ */
export interface ItrCredit {
  period: ItrPeriod;
  year: string;
  byQuarter: [number, number, number, number];
  current: number;          // 2307 for the quarter being filed (annual: 4th quarter)
  previous: number;         // 2307 of preceding quarters of the same year
  cumulative: number;       // Σ Q1..Qn  == amount credited in the return (annual: Q1..Q4)
  certificateCount: number;
}

export function creditableForITR(receivedTxns: CwtTxn[], year: string, period: ItrPeriod): ItrCredit {
  const byQuarter: [number, number, number, number] = [0, 0, 0, 0];
  let count = 0;
  [1, 2, 3, 4].forEach(q => {
    const certs = buildCertificates(receivedTxns, year, q);
    byQuarter[q - 1] = r2(certs.reduce((s, c) => s + c.totalTax, 0));
    if (period === 'ANNUAL' || q <= parseQuarter(period)) count += certs.length;
  });
  const upTo = period === 'ANNUAL' ? 4 : parseQuarter(period);
  const cumulative = r2(byQuarter.slice(0, upTo).reduce((s, v) => s + v, 0));
  const current = byQuarter[upTo - 1];
  return { period, year: String(year), byQuarter, current, previous: r2(cumulative - current), cumulative, certificateCount: count };
}

/** End date (inclusive) of the ITR period, used to cut off income & expenses for the same period. */
export function itrPeriodCutoff(year: string, period: ItrPeriod): { y: number; m: number } {
  const q = period === 'ANNUAL' ? 4 : parseQuarter(period);
  return { y: +year, m: q * 3 };
}
export function isWithinItrPeriod(rawDate: any, year: string, period: ItrPeriod): boolean {
  const d = parseYMD(rawDate);
  if (!d) return true;      // undated records stay in (unchanged legacy behaviour)
  if (d.y !== +year) return false;
  return d.m <= itrPeriodCutoff(year, period).m;
}

/* ------------------------------------------------------------------ */
/* Reconciliation proof for one quarter of issued certificates          */
/* ------------------------------------------------------------------ */
export function reconcileQuarter(txns: CwtTxn[], year: string, quarter: number) {
  const certs = buildCertificates(txns, year, quarter);
  const txTotal = r2(txnsForQuarter(txns, year, quarter).reduce((s, t) => s + t.tax, 0));
  const certTotal = r2(certs.reduce((s, c) => s + c.totalTax, 0));
  const qap = buildQAP(certs, year, quarter).totalTax;
  const eq = build1601EQ(certs, year, quarter).item14;
  const m1 = build0619E(certs, year, quarter, 1).item14;
  const m2 = build0619E(certs, year, quarter, 2).item14;
  const m3 = r2(certs.reduce((s, c) => s + c.monthTax[2], 0));
  const monthsTotal = r2(m1 + m2 + m3);
  return {
    txTotal, certTotal, qap, eq1601: eq, monthsTotal, m1, m2, m3,
    balanced: [certTotal, qap, eq, monthsTotal].every(v => Math.abs(v - txTotal) < 0.01)
  };
}

/** Latest year / quarter that has a dated record (used to default period selectors to where the data is). */
export function latestPeriod(records: any[], dateKeys: string[] = ['expense_date', 'invoice_date', 'date']): { year: string; quarter: number } | null {
  let best: { y: number; m: number } | null = null;
  (records || []).forEach(r => {
    if (!r || r.is_cancelled) return;
    for (const k of dateKeys) {
      const d = parseYMD(r[k]);
      if (d) { if (!best || d.y > best.y || (d.y === best.y && d.m > best.m)) best = { y: d.y, m: d.m }; break; }
    }
  });
  return best ? { year: String(best.y), quarter: quarterOfMonth(best.m) } : null;
}
