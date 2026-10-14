import React, { useState, useMemo } from 'react';
import { 
  FileCheck, 
  FileText, 
  Users, 
  Download, 
  Printer, 
  Layers, 
  Coins, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Calculator,
  Info,
  HelpCircle,
  Bookmark,
  Check,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { safeNum } from '../utils/accounting';
import BIR2316Tab from './BIR2316Tab';
import BIR2307CertificateView from './BIR2307CertificateView';
import {
  normalizeTransactions,
  txnsForQuarter,
  buildCertificates,
  build0619E,
  build1601EQ,
  buildQAP,
  reconcileQuarter,
  parseQuarter,
  latestPeriod,
  Cert2307
} from '../utils/cwt2307';
import {
  translatePayrollRecords,
  build1601C,
  buildAlphalist,
  reconcileYear,
  getRecordYear,
  getRecordMonth
} from '../utils/payroll2316';
import { 
  PayrollRecord, 
  Employee, 
  Company, 
  Expense, 
  Payment, 
  ServiceProvider,
  TaxBracket
} from '../types';

export type WithholdingTaxSubTab = 
  | 'wtx_compensation' 
  | 'wtx_expanded' 
  | 'wtx_alphalist' 
  | 'wtx_2316' 
  | 'wtx_qap';

interface WithholdingTaxHubTabProps {
  payrollRecords?: PayrollRecord[];
  taxBrackets?: TaxBracket[];
  employees?: Employee[];
  expenses?: Expense[];
  payments?: Payment[];
  serviceProviders?: ServiceProvider[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: WithholdingTaxSubTab;
}

export default function WithholdingTaxHubTab({
  payrollRecords = [],
  taxBrackets,
  employees = [],
  expenses = [],
  payments = [],
  serviceProviders = [],
  activeCompany,
  theme,
  triggerAlert,
  initialSubTab = 'wtx_compensation'
}: WithholdingTaxHubTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<WithholdingTaxSubTab>(initialSubTab);

  // Sync initialSubTab if changed externally
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const companyName = activeCompany?.company_name || 'No Active Entity';
  const companyTin = activeCompany?.company_tin || '000-000-000-00000';
  const branchCode = activeCompany?.tin_branch_code || '00000';

  // State for Withholding Tax Compensation (BIR Form 1601-C Part II Computation of Tax)
  // ALL AMOUNTS ARE AUTOMATIC FROM TRANSACTIONS > PAYROLL
  const [compMonth, setCompMonth] = useState<string>('08');
  const [compYear, setCompYear] = useState<string>('2026');

  // THE ONLY USER-TYPED VALUES: Surcharge, Interest, Compromise Penalties
  const [penaltySurcharge, setPenaltySurcharge] = useState<number>(0);
  const [penaltyInterest, setPenaltyInterest] = useState<number>(0);
  const [penaltyCompromise, setPenaltyCompromise] = useState<number>(0);

  // Auto-detect and align compMonth and compYear to latest payroll record if available
  React.useEffect(() => {
    if (payrollRecords && payrollRecords.length > 0) {
      const latest = payrollRecords[0];
      const pPeriod = String(latest.payroll_period || '');
      const pYear = String(latest.tax_year || (pPeriod.match(/\d{4}/)?.[0] || ''));
      const pFrom = String(latest.period_from || '');
      
      let detectedMonth = '';
      if (pFrom && pFrom.includes('/')) {
        detectedMonth = pFrom.split('/')[0].padStart(2, '0');
      } else if (pPeriod && pPeriod.includes('-')) {
        const afterHyphen = pPeriod.split('-')[1];
        if (afterHyphen && afterHyphen.length >= 2) detectedMonth = afterHyphen.slice(0, 2);
      }

      if (pYear && ['2024', '2025', '2026', '2027'].includes(pYear)) {
        setCompYear(pYear);
        setAlphaYear(pYear);
        setCertYear(pYear);
      }
      if (detectedMonth && ['01','02','03','04','05','06','07','08','09','10','11','12'].includes(detectedMonth)) {
        setCompMonth(detectedMonth);
      }
    }
  }, [payrollRecords]);

  // ---- SHARED ENGINE: payroll -> BIR 2316 lines (same lines feed 1601-C, 2316 and Alphalist) ----
  const companyPayroll = useMemo(() => {
    return (payrollRecords || []).filter(p =>
      !(activeCompany?.company_name && p.company_name && p.company_name !== activeCompany.company_name));
  }, [payrollRecords, activeCompany]);

  const translated = useMemo(() => translatePayrollRecords(companyPayroll), [companyPayroll]);

  // Items 28 and 29 only apply to amended returns / other remittances; 32-34 are penalties.
  const [prevRemitted, setPrevRemitted] = useState<number>(0);
  const [otherRemitted, setOtherRemitted] = useState<number>(0);

  const form1601 = useMemo(() => build1601C(compYear, parseInt(compMonth, 10), translated, {
    taxBrackets,
    prevRemitted,
    otherRemittances: otherRemitted,
    surcharge: penaltySurcharge,
    interest: penaltyInterest,
    compromise: penaltyCompromise
  }), [compYear, compMonth, translated, taxBrackets, prevRemitted, otherRemitted, penaltySurcharge, penaltyInterest, penaltyCompromise]);

  const payrollAggregates = { recordsCount: form1601.recordCount, employeeCount: form1601.employeeCount };

  // Cross-report proof: sum of 12 monthly 1601-C == sum of employee 2316 certificates
  const reconciliation = useMemo(
    () => reconcileYear(compYear, employees, translated, taxBrackets),
    [compYear, employees, translated, taxBrackets]
  );

  const handleResetPenalties = () => {
    setPenaltySurcharge(0);
    setPenaltyInterest(0);
    setPenaltyCompromise(0);
    triggerAlert('Penalties (Surcharge, Interest, Compromise) reset to ₱0.00', 'info');
  };

  const fmtPhp = (num: number) => {
    return safeNum(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // BIR 1601-C PART II — exact item numbering/wording of the official form (items 14 to 36)
  type Row1601 = {
    no: string; label: string; value?: number; formula?: string;
    kind: 'auto' | 'input' | 'total' | 'header' | 'sub';
    input?: 'prev' | 'other' | 'sur' | 'int' | 'comp';
  };
  const f1601 = form1601;
  const rows1601: Row1601[] = [
    { no: '14', label: 'Total Amount of Compensation', value: f1601.item14, kind: 'auto', formula: 'Σ BIR 2316 Item 19 of all employees for the month' },
    { no: '', label: 'Less: Non Taxable Compensation', kind: 'header' },
    { no: '15', label: 'Statutory Minimum Wage (MWEs)', value: f1601.item15, kind: 'auto', formula: 'Σ 2316 Item 29 of MWE employees' },
    { no: '16', label: 'Holiday Pay, Overtime Pay, Night Shift Differential Pay, Hazard Pay (Minimum Wage Earner)', value: f1601.item16, kind: 'auto', formula: 'Σ 2316 Items 30 to 33' },
    { no: '17', label: '13th Month Pay and Other Benefits', value: f1601.item17, kind: 'auto', formula: 'Σ 2316 Item 34 (₱90,000 cap per employee per year)' },
    { no: '18', label: 'De Minimis Benefits', value: f1601.item18, kind: 'auto', formula: 'Σ 2316 Item 35' },
    { no: '19', label: "SSS, GSIS, PHIC, HDMF Mandatory Contributions and Union Dues (employee's share only)", value: f1601.item19, kind: 'auto', formula: 'Σ 2316 Item 36' },
    { no: '20', label: 'Other Non-Taxable Compensation (specify)', value: f1601.item20, kind: 'auto', formula: 'Σ 2316 Item 37 + Item 29 of non-MWE employees' },
    { no: '21', label: 'Total Non-Taxable Compensation (Sum of Items 15 to 20)', value: f1601.item21, kind: 'total', formula: '= Σ 2316 Item 38' },
    { no: '22', label: 'Total Taxable Compensation (Item 14 Less Item 21)', value: f1601.item22, kind: 'total', formula: '= Σ 2316 Item 52' },
    { no: '23', label: 'Less: Taxable compensation not subject to withholding tax (for employees, other than MWEs, receiving P250,000 and below for the year)', value: f1601.item23, kind: 'auto', formula: 'Taxable pay of employees whose 2316 Item 23 ≤ ₱250,000' },
    { no: '24', label: 'Net Taxable Compensation', value: f1601.item24, kind: 'total', formula: 'Item 22 less Item 23' },
    { no: '25', label: 'Total Taxes Withheld', value: f1601.item25, kind: 'auto', formula: 'Σ payroll withholding tax for the month (2316 Item 25A)' },
    { no: '26', label: 'Add/(Less): Adjustment of Taxes Withheld from Previous Month/s (From Part IV-Schedule 1, Item 4)', value: f1601.item26, kind: 'auto', formula: 'Σ payroll withholding adjustments' },
    { no: '27', label: 'Tax Required to be Withheld for Remittance', value: f1601.item27, kind: 'total', formula: 'Item 25 + Item 26' },
    { no: '28', label: 'Less: Tax Remitted in Return Previously Filed, if this is an amended return', value: f1601.item28, kind: 'input', input: 'prev' },
    { no: '29', label: 'Other Remittances Made (specify)', value: f1601.item29, kind: 'input', input: 'other' },
    { no: '30', label: 'Total Tax Remittances Made (Sum of Items 28 and 29)', value: f1601.item30, kind: 'total' },
    { no: '31', label: 'Tax Still Due/(Over-remittance) (Item 27 Less Item 30)', value: f1601.item31, kind: 'total' },
    { no: '', label: 'Add: Penalties', kind: 'header' },
    { no: '32', label: 'Surcharge', value: f1601.item32, kind: 'input', input: 'sur' },
    { no: '33', label: 'Interest', value: f1601.item33, kind: 'input', input: 'int' },
    { no: '34', label: 'Compromise', value: f1601.item34, kind: 'input', input: 'comp' },
    { no: '35', label: 'Total Penalties (Sum of Items 32 to 34)', value: f1601.item35, kind: 'total' },
    { no: '36', label: 'TOTAL AMOUNT STILL DUE/(Over-remittance) (Sum of Items 31 and 35)', value: f1601.item36, kind: 'total' }
  ];
  const setInput1601 = (k: Row1601['input'], v: number) => {
    if (k === 'prev') setPrevRemitted(v);
    else if (k === 'other') setOtherRemitted(v);
    else if (k === 'sur') setPenaltySurcharge(v);
    else if (k === 'int') setPenaltyInterest(v);
    else if (k === 'comp') setPenaltyCompromise(v);
  };

  // State for Expanded Withholding Tax (1601-EQ / 0619-E)
  const lastExp = latestPeriod(expenses, ['expense_date', 'date']);
  const [ewtQuarter, setEwtQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(lastExp ? (`Q${lastExp.quarter}` as any) : 'Q3');
  const [ewtYear, setEwtYear] = useState<string>(lastExp?.year || '2026');
  const [ewtSearch, setEwtSearch] = useState<string>('');

  // State for Alphalist of Employees (1604-C)
  const [alphaYear, setAlphaYear] = useState<string>('2026');
  const [alphaCategory, setAlphaCategory] = useState<'ALL' | 'REGULAR' | 'MWE'>('ALL');
  const [alphaSearch, setAlphaSearch] = useState<string>('');

  // BIR 2316 certificate selection (opened from the Alphalist row or the 2316 tab)
  const [certEmpId, setCertEmpId] = useState<string>('');
  const [certYear, setCertYear] = useState<string>('2026');

  // State for QAP (1601-EQ Attachment)
  const [qapQuarter, setQapQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(lastExp ? (`Q${lastExp.quarter}` as any) : 'Q3');
  const [qapYear, setQapYear] = useState<string>(lastExp?.year || '2026');
  const [qapSearch, setQapSearch] = useState<string>('');

function isSampleTransaction(record: any): boolean {
  if (!record) return true;
  if (record.is_sample === true || record.isSample === true) return true;
  if (Number(record.id) > 100000 || record.created_at) return false;
  const name = String(record.payeeName || record.service_provider_name || record.supplier_name || record.registered_name || record.name || '').toLowerCase().trim();
  if (name === 'vendor / contractor' || name === 'sample vendor') return true;
  return false;
}

  /* ========================================================================= */
  /* TAB 2: EXPANDED WITHHOLDING TAX DATA & CALCULATIONS (1601-EQ / 0619-E)     */
  /* ========================================================================= */
  // SHARED ENGINE: every expense with EWT -> normalized line -> BIR 2307 -> 0619-E / 1601-EQ -> QAP
  const issuedTxns = useMemo(() => normalizeTransactions(expenses, 'issued', {
    exclude: isSampleTransaction,
    partyLookup: (tin9, name) => {
      const sp: any = (serviceProviders || []).find((p: any) => {
        const t = String(p.tin_number || p.sp_tin || p.service_provider_TIN || '').replace(/\D/g, '').slice(0, 9);
        if (tin9 !== '000000000' && t === tin9) return true;
        return String(p.registered_name || p.company_name || p.service_provider_name || '').toLowerCase() === name.toLowerCase();
      });
      return sp ? { address: sp.address || sp.sp_address || sp.service_provider_Address, atc: sp.atc_code } : undefined;
    }
  }), [expenses, serviceProviders]);

  const ewtQ = parseQuarter(ewtQuarter);
  const ewtCerts = useMemo(() => buildCertificates(issuedTxns, ewtYear, ewtQ), [issuedTxns, ewtYear, ewtQ]);

  const ewtRows = useMemo(() => {
    return txnsForQuarter(issuedTxns, ewtYear, ewtQ)
      .map(t => ({
        id: t.id,
        date: t.date,
        voucherNo: t.ref,
        payeeName: t.partyName,
        payeeTin: t.partyTin,
        branch: t.partyBranch,
        nature: t.nature,
        atc: t.atc,
        atcDerived: t.atcDerived,
        ratePct: `${t.ratePct}%`,
        taxBase: t.base,
        taxWithheld: t.tax
      }))
      .filter(r => {
        if (!ewtSearch) return true;
        const q = ewtSearch.toLowerCase();
        return r.payeeName.toLowerCase().includes(q) || r.payeeTin.includes(q) || r.voucherNo.toLowerCase().includes(q);
      });
  }, [issuedTxns, ewtYear, ewtQ, ewtSearch]);

  // Penalty / amendment inputs for 0619-E (month 1 & 2) and 1601-EQ, kept per quarter
  const [wInputs, setWInputs] = useState<Record<string, number>>({});
  const wKey = (k: string) => `${ewtYear}.${ewtQ}.${k}`;
  const wv = (k: string) => wInputs[wKey(k)] || 0;
  const setWv = (k: string, v: number) => setWInputs(prev => ({ ...prev, [wKey(k)]: v }));
  const [ewtFormMonth, setEwtFormMonth] = useState<1 | 2>(1);
  const [viewCert, setViewCert] = useState<Cert2307 | null>(null);

  const mOpts = (m: 1 | 2) => ({ prevRemitted: wv(`m${m}.prev`), surcharge: wv(`m${m}.sur`), interest: wv(`m${m}.int`), compromise: wv(`m${m}.comp`) });
  const form0619E = useMemo(
    () => build0619E(ewtCerts, ewtYear, ewtQ, ewtFormMonth, mOpts(ewtFormMonth)),
    [ewtCerts, ewtYear, ewtQ, ewtFormMonth, wInputs]
  );
  const form1601EQ = useMemo(() => build1601EQ(ewtCerts, ewtYear, ewtQ, {
    m1: mOpts(1), m2: mOpts(2),
    prevRemitted: wv('eq.prev'), prevOverRemittance: wv('eq.over'),
    surcharge: wv('eq.sur'), interest: wv('eq.int'), compromise: wv('eq.comp')
  }), [ewtCerts, ewtYear, ewtQ, wInputs]);
  const ewtRecon = useMemo(() => reconcileQuarter(issuedTxns, ewtYear, ewtQ), [issuedTxns, ewtYear, ewtQ]);

  const ewtSummary = useMemo(() => {
    const totalTaxBase = ewtRows.reduce((sum, r) => sum + r.taxBase, 0);
    const totalTaxWithheld = ewtRows.reduce((sum, r) => sum + r.taxWithheld, 0);
    return {
      totalTaxBase,
      totalTaxWithheld,
      payeeCount: ewtRows.length,
      month1: ewtRecon.m1,
      month2: ewtRecon.m2,
      month3: ewtRecon.m3
    };
  }, [ewtRows, ewtRecon]);

  /* ========================================================================= */
  /* TAB 3: ALPHALIST OF EMPLOYEES DATA (1604-C / 2316 ATTACHMENT)             */
  /* ========================================================================= */
  // One alphalist row per BIR 2316 certificate (same engine as the 2316 tab and 1601-C)
  const alphalistRows = useMemo(() => {
    return buildAlphalist(alphaYear, employees, translated, taxBrackets).filter(row => {
      if (alphaCategory === 'MWE' && !row.isMwe) return false;
      if (alphaCategory === 'REGULAR' && row.isMwe) return false;
      if (!alphaSearch) return true;
      const q = alphaSearch.toLowerCase();
      return String(row.name).toLowerCase().includes(q) || String(row.tin).includes(q) || String(row.empId).toLowerCase().includes(q);
    });
  }, [employees, translated, taxBrackets, alphaYear, alphaCategory, alphaSearch]);

  const alphalistSummary = useMemo(() => {
    const totalGross = alphalistRows.reduce((sum, r) => sum + r.gross, 0);
    const totalNonTaxable = alphalistRows.reduce((sum, r) => sum + r.totalNonTaxable, 0);
    const totalTaxable = alphalistRows.reduce((sum, r) => sum + r.totalTaxable, 0);
    const totalTaxDue = alphalistRows.reduce((sum, r) => sum + r.annualTaxDue, 0);
    const totalTaxWithheld = alphalistRows.reduce((sum, r) => sum + r.taxWithheld, 0);

    return {
      totalGross,
      totalNonTaxable,
      totalTaxable,
      totalTaxDue,
      totalTaxWithheld,
      employeeCount: alphalistRows.length
    };
  }, [alphalistRows]);

  /* ========================================================================= */
  /* TAB 4: QAP DATA (ATTACHMENT TO 1601EQ)                                    */
  /* ========================================================================= */
  // QAP = one row per payee per ATC, taken from the same BIR 2307 certificates (per quarter)
  const qapCerts = useMemo(() => buildCertificates(issuedTxns, qapYear, parseQuarter(qapQuarter)), [issuedTxns, qapYear, qapQuarter]);
  const qapData = useMemo(() => buildQAP(qapCerts, qapYear, parseQuarter(qapQuarter)), [qapCerts, qapYear, qapQuarter]);
  const qapEq = useMemo(() => build1601EQ(qapCerts, qapYear, parseQuarter(qapQuarter)), [qapCerts, qapYear, qapQuarter]);

  const qapRows = useMemo(() => {
    return qapData.rows.map(r => ({
      id: `${r.seq}`,
      tin: r.tin,
      branch: r.branch,
      payeeName: r.name,
      atc: r.atc,
      atcDerived: r.atcDerived,
      month1: r.month1, month2: r.month2, month3: r.month3,
      taxBase: r.incomePayment,
      taxRate: `${r.ratePct}%`,
      taxWithheld: r.taxWithheld
    })).filter(r => {
      if (!qapSearch) return true;
      const q = qapSearch.toLowerCase();
      return r.payeeName.toLowerCase().includes(q) || r.tin.includes(q) || r.atc.toLowerCase().includes(q);
    });
  }, [qapData, qapSearch]);

  const qapSummary = useMemo(() => {
    const totalBase = qapRows.reduce((sum, r) => sum + r.taxBase, 0);
    const totalWithheld = qapRows.reduce((sum, r) => sum + r.taxWithheld, 0);
    return {
      totalBase,
      totalWithheld,
      count: qapRows.length
    };
  }, [qapRows]);

  const handleDownloadQAPDat = () => {
    const validRows = qapRows;
    if (validRows.length === 0) {
      triggerAlert(`Cannot generate QAP .DAT: No real expanded withholding tax transactions found for ${qapQuarter} ${qapYear}. Sample or dummy data is prohibited in BIR files.`, 'error');
      return;
    }
    const cleanTin = (companyTin || '').replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
    const header = `H1601EQ,${cleanTin},${branchCode},${qapYear},${qapQuarter}\n`;
    const details = validRows.map((r, idx) => {
      const cleanPayeeTin = (r.tin || '').replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
      return `D1601EQ,${idx + 1},${cleanPayeeTin},${r.branch},"${r.payeeName}",${r.atc},${r.taxBase.toFixed(2)},${r.taxWithheld.toFixed(2)}`;
    }).join('\n');
    const content = header + details;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QAP_${cleanTin}_${branchCode}_${qapQuarter}_${qapYear}.DAT`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAlert(`Downloaded BIR Form 1601-EQ QAP Attachment (.DAT file) for ${qapQuarter} ${qapYear}!`, 'success');
  };

  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert(`Exported ${filename}.csv successfully!`, 'success');
  };

  return (
    <div className="space-y-4 select-none">
      
      {/* TAB SELECTION BAR (4 EXACT REQUIRED TABS) */}
      <div className={`p-1.5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-wrap gap-1.5 transition-colors duration-200`}>
        <button
          onClick={() => setActiveSubTab('wtx_compensation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wtx_compensation'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>withholding tax compensation</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wtx_expanded')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wtx_expanded'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>expanded withholding tax</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wtx_2316')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wtx_2316'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>BIR 2316</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wtx_alphalist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wtx_alphalist'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alphalist of Employees</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wtx_qap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wtx_qap'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>QAP[attachment to 1601EQ]</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: WITHHOLDING TAX COMPENSATION (BIR FORM 1601-C)         */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_compensation' && (
        <div className="space-y-3">
          
          {/* ================================================================= */}
          {/* PART II: COMPUTATION OF TAX ONLY (COMPACT FINANCIAL POSITION SIZE)*/}
          {/* ================================================================= */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs overflow-hidden text-xs`}>
            
            {/* Header: Compact Controls & Actions */}
            <div className={`px-3 py-2 bg-amber-500/10 border-b ${theme.borderCard} flex flex-wrap items-center justify-between gap-2`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-slate-950 uppercase">
                  BIR 1601-C
                </span>
                <span className={`text-xs sm:text-sm font-bold tracking-wide uppercase ${theme.textTitle} flex items-center gap-1.5`}>
                  <Coins className="w-4 h-4 text-amber-500" />
                  Part II — Computation of Tax
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  ⚡ From BIR 2316 ← Payroll ({payrollAggregates.employeeCount} employee{payrollAggregates.employeeCount === 1 ? '' : 's'}, {payrollAggregates.recordsCount} record{payrollAggregates.recordsCount === 1 ? '' : 's'})
                </span>
              </div>

              {/* Actions & Period */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 border border-zinc-700/40 rounded-lg px-2 py-0.5 text-xs font-mono">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <select
                    value={compMonth}
                    onChange={(e) => setCompMonth(e.target.value)}
                    className="bg-transparent text-[11px] font-mono font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="01">01 - Jan</option>
                    <option value="02">02 - Feb</option>
                    <option value="03">03 - Mar</option>
                    <option value="04">04 - Apr</option>
                    <option value="05">05 - May</option>
                    <option value="06">06 - Jun</option>
                    <option value="07">07 - Jul</option>
                    <option value="08">08 - Aug</option>
                    <option value="09">09 - Sep</option>
                    <option value="10">10 - Oct</option>
                    <option value="11">11 - Nov</option>
                    <option value="12">12 - Dec</option>
                  </select>
                  <select
                    value={compYear}
                    onChange={(e) => setCompYear(e.target.value)}
                    className="bg-transparent text-[11px] font-mono font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                {(penaltySurcharge > 0 || penaltyInterest > 0 || penaltyCompromise > 0) && (
                  <button
                    type="button"
                    onClick={handleResetPenalties}
                    className="px-2 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Clear Surcharge, Interest, Compromise"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Penalties</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const headers = ['Item', 'Description', 'Type', 'Source / Formula', 'Amount (PHP)'];
                    const rows = rows1601.filter(r => r.kind !== 'header').map(r => [r.no, r.label, r.kind === 'input' ? 'User Input' : 'AUTOMATIC', r.formula || '', (r.value || 0).toFixed(2)]);
                    handleExportCSV(`BIR_Form_1601C_Part_II_${compYear}_${compMonth}`, headers, rows);
                  }}
                  className={`p-1.5 rounded-lg border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                  title="Export Form 1601-C Part II to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`p-1.5 rounded-lg border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                  title="Print Part II Computation of Tax"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </div>
            </div>

            {/* PART II TABLE — items 14 to 36, exact order of the BIR form */}
            <div className="font-mono text-xs divide-y divide-zinc-800/30">
              {rows1601.map((r, i) => {
                if (r.kind === 'header') {
                  return (
                    <div key={i} className="px-3 py-1 bg-zinc-900/60 dark:bg-zinc-900/90 text-zinc-300 font-bold text-[10px] uppercase tracking-wide">
                      {r.label}
                    </div>
                  );
                }
                const isTotal = r.kind === 'total';
                const isFinal = r.no === '36';
                return (
                  <div
                    key={i}
                    className={`px-3 py-1.5 flex items-center justify-between gap-3 ${
                      isFinal ? 'bg-amber-500/15 border-t-2 border-amber-500' : isTotal ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={`w-7 text-center py-0.5 rounded font-bold text-[10px] shrink-0 ${isFinal ? 'bg-amber-500 text-slate-950' : 'bg-zinc-500/20 text-zinc-300'}`}>
                        {r.no}
                      </span>
                      <div className="min-w-0">
                        <span className={`font-sans text-[11px] ${isTotal ? 'font-bold' : 'font-medium'} ${theme.textTitle}`}>{r.label}</span>
                        {r.formula && <span className="text-[10px] text-zinc-400 block font-sans">{r.formula}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {r.kind === 'input' && r.input ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(r.value || 0) === 0 ? '' : r.value}
                          placeholder="0.00"
                          onChange={(e) => setInput1601(r.input, parseFloat(e.target.value) || 0)}
                          className={`w-32 h-6 px-2 text-right font-mono text-[11px] rounded border bg-black/10 dark:bg-white/5 ${theme.borderInput} ${theme.textMain}`}
                        />
                      ) : (
                        <span className={`font-mono text-[11px] ${isFinal ? 'font-black text-amber-400 text-sm' : isTotal ? 'font-bold' : ''} ${theme.textTitle} px-2 py-0.5 rounded bg-black/20 dark:bg-white/5 border border-zinc-700/40 inline-block`}>
                          ₱{fmtPhp(r.value || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reconciliation with BIR 2316 / Alphalist */}
            <div className={`px-3 py-2 border-t ${theme.borderCard} text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 ${reconciliation.balanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>
                {reconciliation.balanced ? '✔ Year ' + compYear + ' reconciled:' : '✖ Year ' + compYear + ' NOT reconciled:'} Σ 12 monthly 1601-C vs Σ BIR 2316 certificates —
                Gross ₱{fmtPhp(reconciliation.gross.c1601)} / ₱{fmtPhp(reconciliation.gross.f2316)} · Withheld ₱{fmtPhp(reconciliation.withheld.c1601)} / ₱{fmtPhp(reconciliation.withheld.f2316)}
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('wtx_alphalist')}
                className="underline underline-offset-2 cursor-pointer"
              >
                View Alphalist (annual)
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: EXPANDED WITHHOLDING TAX (1601-EQ & 0619-E)             */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_expanded' && viewCert && (
        <BIR2307CertificateView
          certNo={viewCert.certNo}
          periodFrom={viewCert.periodFrom}
          periodTo={viewCert.periodTo}
          payeeTin={viewCert.partyTin}
          payeeName={viewCert.partyName}
          payeeAddress={viewCert.partyAddress}
          payorTin={companyTin}
          payorName={activeCompany?.company_name || ''}
          payorAddress={(activeCompany as any)?.company_address || (activeCompany as any)?.address || ''}
          rows={viewCert.lines.map(l => ({
            nature: l.nature, atc: l.atc, month1: l.month1, month2: l.month2, month3: l.month3,
            totalAmount: l.totalAmount, taxWithheld: l.taxWithheld
          }))}
          theme={theme}
          onClose={() => setViewCert(null)}
        />
      )}

      {activeSubTab === 'wtx_expanded' && !viewCert && (
        <div className="space-y-4">
          
          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Tax Quarter:</span>
              <select
                value={ewtQuarter}
                onChange={(e) => setEwtQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Q1">Q1 (Jan - Mar)</option>
                <option value="Q2">Q2 (Apr - Jun)</option>
                <option value="Q3">Q3 (Jul - Sep)</option>
                <option value="Q4">Q4 (Oct - Dec)</option>
              </select>

              <select
                value={ewtYear}
                onChange={(e) => setEwtYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter payee or TIN..."
                  value={ewtSearch}
                  onChange={(e) => setEwtSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <button
                onClick={() => {
                  const headers = ['Voucher #', 'Date', 'Payee Name', 'TIN', 'ATC', 'Nature', 'Rate', 'Tax Base', 'Expanded Tax Withheld'];
                  const rows = ewtRows.map(r => [
                    r.voucherNo,
                    r.date,
                    r.payeeName,
                    r.payeeTin,
                    r.atc,
                    r.nature,
                    r.ratePct,
                    r.taxBase.toFixed(2),
                    r.taxWithheld.toFixed(2)
                  ]);
                  handleExportCSV(`BIR_Expanded_Withholding_${ewtQuarter}_${ewtYear}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export Expanded Withholding Schedule CSV"
              >
                <Download className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Income Payments</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{ewtSummary.totalTaxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{ewtSummary.payeeCount} payments subject to EWT</span>
            </div>

            <div className={`p-4 rounded-2xl border border-amber-500/30 ${theme.bgCard} shadow-xs bg-amber-500/5`}>
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Total Expanded Tax Withheld</span>
              <p className="text-xl font-bold font-mono mt-1 text-amber-500">
                ₱{ewtSummary.totalTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-500/80 mt-0.5 block">Form 1601-EQ Total Remittance</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Form 0619-E (Month 1 + Month 2)</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{(form1601EQ.item15a + form1601EQ.item15b).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Remitted via 0619-E (actual withholdings of months 1 &amp; 2)</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Quarterly Balance (1601-EQ)</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{form1601EQ.item17.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Tax still due with 1601-EQ (3rd month withholdings)</span>
            </div>
          </div>

          {/* BIR 0619-E (Part II – Tax Remittance, items 14-18) and 1601-EQ (quarterly) */}
          {(() => {
            const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const fmtN = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            type PR = { no: string; label: string; value: number; kind: 'auto' | 'input' | 'total'; key?: string; sub?: boolean; note?: string };
            const mk = `m${ewtFormMonth}`;
            const f = form0619E;
            const rows0619: PR[] = [
              { no: '14', label: 'Amount of Remittance', value: f.item14, kind: 'auto', note: 'Σ tax withheld on BIR 2307 certificates for this month' },
              { no: '15', label: 'Less: Amount Remitted from Previously Filed Form, if this is an amended form', value: f.item15, kind: 'input', key: `${mk}.prev` },
              { no: '16', label: 'Net Amount of Remittance (Item 14 Less Item 15)', value: f.item16, kind: 'total' },
              { no: '17', label: 'Add: Penalties', value: 0, kind: 'auto' },
              { no: '17A', label: 'Surcharge', value: f.item17a, kind: 'input', key: `${mk}.sur`, sub: true },
              { no: '17B', label: 'Interest', value: f.item17b, kind: 'input', key: `${mk}.int`, sub: true },
              { no: '17C', label: 'Compromise', value: f.item17c, kind: 'input', key: `${mk}.comp`, sub: true },
              { no: '17D', label: 'Total Penalties (Sum of Items 17A to 17C)', value: f.item17d, kind: 'total', sub: true },
              { no: '18', label: 'Total Amount of Remittance (Sum of Items 16 and 17D)', value: f.item18, kind: 'total' }
            ];
            const q = form1601EQ;
            const rowsEQ: PR[] = [
              { no: '14', label: 'Total Taxes Withheld for the Quarter', value: q.item14, kind: 'auto', note: 'Σ QAP = Σ BIR 2307 certificates' },
              { no: '15A', label: 'Less: Remitted – 1st Month (Form 0619-E, Item 16)', value: q.item15a, kind: 'auto', sub: true },
              { no: '15B', label: 'Less: Remitted – 2nd Month (Form 0619-E, Item 16)', value: q.item15b, kind: 'auto', sub: true },
              { no: '15C', label: 'Less: Tax Remitted in Return Previously Filed, if amended', value: q.item15c, kind: 'input', key: 'eq.prev', sub: true },
              { no: '15D', label: 'Less: Over-remittance from Previous Quarter', value: q.item15d, kind: 'input', key: 'eq.over', sub: true },
              { no: '16', label: 'Total Remittances Made (Sum of Items 15A to 15D)', value: q.item16, kind: 'total' },
              { no: '17', label: 'Tax Still Due / (Over-remittance) (Item 14 Less Item 16)', value: q.item17, kind: 'total' },
              { no: '18A', label: 'Surcharge', value: q.item18a, kind: 'input', key: 'eq.sur', sub: true },
              { no: '18B', label: 'Interest', value: q.item18b, kind: 'input', key: 'eq.int', sub: true },
              { no: '18C', label: 'Compromise', value: q.item18c, kind: 'input', key: 'eq.comp', sub: true },
              { no: '18D', label: 'Total Penalties', value: q.item18d, kind: 'total', sub: true },
              { no: '19', label: 'TOTAL AMOUNT STILL DUE / (Over-remittance) (Sum of Items 17 and 18D)', value: q.item19, kind: 'total' }
            ];
            const renderRows = (rows: PR[]) => rows.map((r, i) => (
              <div key={i} className={`px-3 py-1.5 flex items-center justify-between gap-3 text-xs ${r.kind === 'total' ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                <div className={`flex items-start gap-2 min-w-0 ${r.sub ? 'pl-5' : ''}`}>
                  <span className="w-8 text-center py-0.5 rounded font-bold text-[10px] shrink-0 bg-zinc-500/20 text-zinc-300 font-mono">{r.no}</span>
                  <div className="min-w-0">
                    <span className={`font-sans text-[11px] ${r.kind === 'total' ? 'font-bold' : 'font-medium'} ${theme.textTitle}`}>{r.label}</span>
                    {r.note && <span className="text-[10px] text-zinc-400 block">{r.note}</span>}
                  </div>
                </div>
                {r.label === 'Add: Penalties' ? null : r.kind === 'input' && r.key ? (
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={r.value === 0 ? '' : r.value}
                    onChange={(e) => setWv(r.key as string, parseFloat(e.target.value) || 0)}
                    className={`w-32 h-6 px-2 text-right font-mono text-[11px] rounded border bg-black/10 dark:bg-white/5 ${theme.borderInput} ${theme.textMain}`}
                  />
                ) : (
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded bg-black/20 dark:bg-white/5 border border-zinc-700/40 ${r.kind === 'total' ? 'font-bold' : ''} ${theme.textTitle}`}>₱{fmtN(r.value)}</span>
                )}
              </div>
            ));
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl overflow-hidden`}>
                  <div className={`p-3 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex flex-wrap items-center justify-between gap-2`}>
                    <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>BIR Form 0619-E • Part II – Tax Remittance</h3>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => m !== 3 && setEwtFormMonth(m as 1 | 2)}
                          disabled={m === 3}
                          title={m === 3 ? 'Third month is covered by Form 1601-EQ' : ''}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${m === ewtFormMonth ? 'bg-amber-500 text-slate-950 border-amber-500' : `${theme.borderCard} ${theme.textMuted}`} ${m === 3 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {MONTHS[(ewtQ - 1) * 3 + m - 1].slice(0, 3)}{m === 3 ? ' (1601-EQ)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-800/30 font-mono">{renderRows(rows0619)}</div>
                  <div className="px-3 py-1.5 text-[10px] text-zinc-400 border-t border-zinc-800/30">
                    For the month of {MONTHS[f.calendarMonth - 1]} {ewtYear} · {f.payeeCount} payee(s) · Source: BIR 2307 certificates issued
                  </div>
                </div>

                <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl overflow-hidden`}>
                  <div className={`p-3 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5`}>
                    <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>BIR Form 1601-EQ • Part II – Computation of Tax ({ewtQuarter} {ewtYear})</h3>
                  </div>
                  <div className="divide-y divide-zinc-800/30 font-mono">{renderRows(rowsEQ)}</div>
                  <div className={`px-3 py-1.5 text-[10px] font-mono border-t border-zinc-800/30 ${ewtRecon.balanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ewtRecon.balanced ? '✔ Reconciled' : '✖ Not reconciled'}: ledger ₱{fmtN(ewtRecon.txTotal)} = 2307 ₱{fmtN(ewtRecon.certTotal)} = QAP ₱{fmtN(ewtRecon.qap)} = 1601-EQ ₱{fmtN(ewtRecon.eq1601)} = months 1+2+3 ₱{fmtN(ewtRecon.monthsTotal)}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                Expanded Withholding Tax Ledger & Payee Certificates ({ewtRows.length} transactions)
              </h3>
              <span className="text-[11px] text-amber-500 font-mono font-bold">
                BIR Form 2307 Creditable Certificates Issued
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Ref / Voucher</th>
                    <th className="p-3">Payee / Vendor</th>
                    <th className="p-3">Payee TIN</th>
                    <th className="p-3">ATC Code</th>
                    <th className="p-3">Nature of Income Payment</th>
                    <th className="p-3 text-right">Tax Base</th>
                    <th className="p-3 text-center">Rate</th>
                    <th className="p-3 text-right">Tax Withheld</th>
                    <th className="p-3 text-center">BIR 2307</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {ewtRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400">
                        No purchase or expense transactions with expanded withholding tax recorded. Enter purchases with withholding tax in Purchase Hub to populate.
                      </td>
                    </tr>
                  ) : (
                    ewtRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-500">{r.voucherNo}</td>
                        <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.payeeName}</td>
                        <td className="p-3 font-mono text-zinc-400">{r.payeeTin}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.atc}{r.atcDerived && <span className="text-[9px] text-zinc-400 font-normal"> (derived)</span>}</td>
                        <td className={`p-3 ${theme.textMuted}`}>{r.nature}</td>
                        <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                          ₱{r.taxBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-500">{r.ratePct}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-500">
                          ₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => { const c = ewtCerts.find(cc => cc.txnIds.includes(r.id)); if (c) setViewCert(c); }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer"
                          >
                            View 2307
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT: BIR 2316 (per employee, summarized from payroll)         */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_2316' && (
        <BIR2316Tab
          payrollRecords={companyPayroll}
          employees={employees}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          initialEmployeeId={certEmpId || undefined}
          initialYear={certYear}
          taxBrackets={taxBrackets}
          onClose={() => setActiveSubTab('wtx_alphalist')}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 3: ALPHALIST OF EMPLOYEES (1604-C / 2316 ATTACHMENT)       */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_alphalist' && (
        <div className="space-y-4">
          
          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Tax Year:</span>
              <select
                value={alphaYear}
                onChange={(e) => setAlphaYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>

              <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-zinc-700/20">
                <button
                  onClick={() => setAlphaCategory('ALL')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    alphaCategory === 'ALL' ? 'bg-amber-500 text-slate-950' : theme.textMuted
                  }`}
                >
                  All ({alphalistRows.length})
                </button>
                <button
                  onClick={() => setAlphaCategory('REGULAR')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    alphaCategory === 'REGULAR' ? 'bg-amber-500 text-slate-950' : theme.textMuted
                  }`}
                >
                  Regular
                </button>
                <button
                  onClick={() => setAlphaCategory('MWE')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    alphaCategory === 'MWE' ? 'bg-amber-500 text-slate-950' : theme.textMuted
                  }`}
                >
                  MWE (Exempt)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter name, TIN or ID..."
                  value={alphaSearch}
                  onChange={(e) => setAlphaSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <button
                onClick={() => {
                  const headers = ['Seq', 'TIN', 'Employee Name', 'MWE?', 'Gross Income', 'Total Non-Taxable', 'Taxable Income', 'Annual Tax Due', 'Tax Withheld', 'Adjustment'];
                  const rows = alphalistRows.map(r => [
                    r.seq,
                    r.tin,
                    r.name,
                    r.isMwe ? 'YES' : 'NO',
                    r.gross.toFixed(2),
                    r.totalNonTaxable.toFixed(2),
                    r.totalTaxable.toFixed(2),
                    r.annualTaxDue.toFixed(2),
                    r.taxWithheld.toFixed(2),
                    r.adjustment.toFixed(2)
                  ]);
                  handleExportCSV(`BIR_1604C_Alphalist_Employees_${alphaYear}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export Alphalist CSV"
              >
                <Download className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Compensation</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{alphalistSummary.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{alphalistSummary.employeeCount} active employees</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Exempt / Non-Taxable</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{alphalistSummary.totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Statutory & 13th Month exempt</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Annual Tax Due</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{alphalistSummary.totalTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Annualized Graduated Tax</span>
            </div>

            <div className={`p-4 rounded-2xl border border-amber-500/30 ${theme.bgCard} shadow-xs bg-amber-500/5`}>
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Total Tax Withheld</span>
              <p className="text-xl font-bold font-mono mt-1 text-amber-500">
                ₱{alphalistSummary.totalTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-500/80 mt-0.5 block">Remitted under Form 1601-C</span>
            </div>
          </div>

          {/* Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                Annual Alphalist of Employees Schedule (Form 1604-C & 2316 Certificate Register)
              </h3>
              <span className="text-[11px] text-amber-500 font-mono font-bold">
                Annual Filing Due: January 31 · Source: BIR 2316 ← Payroll
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Seq</th>
                    <th className="p-3">Employee TIN</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3 text-right">Gross Pay</th>
                    <th className="p-3 text-right">Non-Taxable</th>
                    <th className="p-3 text-right">Taxable Pay</th>
                    <th className="p-3 text-right">Annual Tax Due</th>
                    <th className="p-3 text-right">Tax Withheld</th>
                    <th className="p-3 text-right">Year-End Adjustment</th>
                    <th className="p-3 text-center">2316</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {alphalistRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-400">
                        No employee alphalist records found for {alphaYear}. Add employees in Directory → Employees.
                      </td>
                    </tr>
                  ) : (
                    alphalistRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-zinc-400">{r.seq}</td>
                        <td className="p-3 font-mono font-bold text-amber-500">{r.tin}</td>
                        <td className={`p-3 font-semibold ${theme.textTitle}`}>
                          {r.name}
                          {r.isMwe && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              MWE
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                          ₱{r.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-500">
                          ₱{r.totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${theme.textTitle}`}>
                          ₱{r.totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                          ₱{r.annualTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          ₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${r.adjustment >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {r.adjustment >= 0 ? `+₱${r.adjustment.toFixed(2)} (Refund)` : `-₱${Math.abs(r.adjustment).toFixed(2)} (Due)`}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => { setCertEmpId(String(r.empId)); setCertYear(alphaYear); setActiveSubTab('wtx_2316'); }}
                            className="px-2 py-0.5 rounded border border-amber-500/40 text-amber-500 text-[10px] font-bold hover:bg-amber-500/10 cursor-pointer"
                          >
                            View 2316
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 4: QAP [ATTACHMENT TO 1601EQ]                              */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_qap' && (
        <div className="space-y-4">
          
          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Tax Quarter:</span>
              <select
                value={qapQuarter}
                onChange={(e) => setQapQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Q1">Q1 (1st Quarter)</option>
                <option value="Q2">Q2 (2nd Quarter)</option>
                <option value="Q3">Q3 (3rd Quarter)</option>
                <option value="Q4">Q4 (4th Quarter)</option>
              </select>

              <select
                value={qapYear}
                onChange={(e) => setQapYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter payee, TIN or ATC..."
                  value={qapSearch}
                  onChange={(e) => setQapSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <button
                onClick={handleDownloadQAPDat}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Download BIR eSubmission QAP .DAT Attachment File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .DAT</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Total Payees in QAP</span>
              <p className={`text-xl font-bold font-mono mt-1 ${theme.textTitle}`}>
                {qapSummary.count} Payees
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Expanded withholding suppliers</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Amount of Payment</span>
              <p className={`text-xl font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{qapSummary.totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Income base subjected to withholding</span>
            </div>

            <div className={`p-4 rounded-2xl border border-amber-500/30 ${theme.bgCard} shadow-xs bg-amber-500/5`}>
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Total Tax Withheld (1601-EQ Attachment)</span>
              <p className="text-xl font-bold font-mono mt-1 text-amber-500">
                ₱{qapSummary.totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-500/80 mt-0.5 block">Creditable withholding tax for quarter</span>
            </div>
          </div>

          {/* Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                Quarterly Alphalist of Payees (QAP) Detail Records ({qapRows.length} payees)
              </h3>
              <span className="text-[11px] text-amber-500 font-mono font-bold">
                Mandatory Attachment to Form 1601-EQ
              </span>
            </div>
            <div className={`px-4 py-2 text-[11px] font-mono border-b ${theme.borderCard} ${Math.abs(qapSummary.totalWithheld - qapEq.item14) < 0.01 || qapSearch ? 'text-emerald-400' : 'text-rose-400'}`}>
              Σ QAP ₱{qapData.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} = Form 1601-EQ Item 14 ₱{qapEq.item14.toLocaleString(undefined, { minimumFractionDigits: 2 })} · Source: BIR 2307 certificates issued ({qapCerts.length}) ← Purchases / Expenses
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Seq #</th>
                    <th className="p-3">Payee TIN</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Registered Payee Name</th>
                    <th className="p-3">ATC Code</th>
                    <th className="p-3 text-right">1st Month</th>
                    <th className="p-3 text-right">2nd Month</th>
                    <th className="p-3 text-right">3rd Month</th>
                    <th className="p-3 text-right">Gross Income Base</th>
                    <th className="p-3 text-center">Tax Rate</th>
                    <th className="p-3 text-right">Tax Withheld</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {qapRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-zinc-400">
                        No creditable withholding tax payees found for QAP in {qapQuarter} {qapYear}.
                      </td>
                    </tr>
                  ) : (
                    qapRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-zinc-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-amber-500">{r.tin}</td>
                        <td className="p-3 font-mono text-zinc-400">{r.branch}</td>
                        <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.payeeName}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.atc}{r.atcDerived && <span className="text-[9px] text-zinc-400 font-normal"> (derived)</span>}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">{r.month1 ? r.month1.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">{r.month2 ? r.month2.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">{r.month3 ? r.month3.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                          ₱{r.taxBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-500">{r.taxRate}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-500">
                          ₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
