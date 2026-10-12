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
  ArrowRight
} from 'lucide-react';
import { 
  PayrollRecord, 
  Employee, 
  Company, 
  Expense, 
  Payment, 
  ServiceProvider 
} from '../types';

export type WithholdingTaxSubTab = 
  | 'wtx_compensation' 
  | 'wtx_expanded' 
  | 'wtx_alphalist' 
  | 'wtx_qap';

interface WithholdingTaxHubTabProps {
  payrollRecords?: PayrollRecord[];
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

  // State for Withholding Tax Compensation (1601-C)
  const [compMonth, setCompMonth] = useState<string>('08');
  const [compYear, setCompYear] = useState<string>('2026');
  const [compSearch, setCompSearch] = useState<string>('');

  // State for Expanded Withholding Tax (1601-EQ / 0619-E)
  const [ewtQuarter, setEwtQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const [ewtYear, setEwtYear] = useState<string>('2026');
  const [ewtSearch, setEwtSearch] = useState<string>('');

  // State for Alphalist of Employees (1604-C)
  const [alphaYear, setAlphaYear] = useState<string>('2026');
  const [alphaCategory, setAlphaCategory] = useState<'ALL' | 'REGULAR' | 'MWE'>('ALL');
  const [alphaSearch, setAlphaSearch] = useState<string>('');

  // State for QAP (1601-EQ Attachment)
  const [qapQuarter, setQapQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const [qapYear, setQapYear] = useState<string>('2026');
  const [qapSearch, setQapSearch] = useState<string>('');

  /* ========================================================================= */
  /* TAB 1: WITHHOLDING TAX COMPENSATION DATA & CALCULATIONS (1601-C)          */
  /* ========================================================================= */
  const compRecords = useMemo(() => {
    return payrollRecords.filter(p => {
      const matchPeriod = p.payroll_period ? p.payroll_period.includes(`${compYear}-${compMonth}`) || p.payroll_period.startsWith(compYear) : true;
      const matchSearch = !compSearch || 
        (p.employee_name && p.employee_name.toLowerCase().includes(compSearch.toLowerCase())) ||
        (p.employee_id !== undefined && String(p.employee_id).toLowerCase().includes(compSearch.toLowerCase()));
      return matchPeriod && matchSearch;
    });
  }, [payrollRecords, compYear, compMonth, compSearch]);

  const compSummary = useMemo(() => {
    const grossComp = compRecords.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0);
    const nonTaxableStatutory = compRecords.reduce((sum, p) => 
      sum + (Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0), 0);
    const nonTaxableBenefits = compRecords.reduce((sum, p) => sum + (Number(p.de_minimis_benefits) || 0) + (Number(p.thirteenth_month_pay) || 0), 0);
    const totalNonTaxable = nonTaxableStatutory + nonTaxableBenefits;
    const taxableComp = Math.max(0, grossComp - totalNonTaxable);
    const taxWithheld = compRecords.reduce((sum, p) => sum + (Number(p.withholding_tax) || 0), 0);

    return {
      grossComp,
      totalNonTaxable,
      nonTaxableStatutory,
      taxableComp,
      taxWithheld,
      employeeCount: compRecords.length
    };
  }, [compRecords]);

function isSampleTransaction(record: any): boolean {
  if (!record) return true;
  if (record.is_sample || record.isSample) return true;
  const name = String(record.payeeName || record.service_provider_name || record.supplier_name || record.registered_name || record.name || '').toLowerCase().trim();
  const desc = String(record.particulars || record.description || record.expense_type || '').toLowerCase().trim();
  const invoiceNo = String(record.voucher_number || record.voucherNo || record.invoice_number || '').toLowerCase().trim();
  if (/^(sample|demo|test)(\s|$)/i.test(name)) return true;
  if (/sample\s*transaction|demo\s*transaction|test\s*transaction/i.test(name)) return true;
  if (/sample\s*transaction|demo\s*transaction|test\s*transaction/i.test(desc)) return true;
  if (name === 'vendor / contractor' || name === 'sample vendor') return true;
  if ((name.includes('pldt enterprise') || name.includes('ayala land')) && (invoiceNo.includes('apv-2026') || invoiceNo.includes('001') || invoiceNo.includes('002'))) {
    return true;
  }
  return false;
}

  /* ========================================================================= */
  /* TAB 2: EXPANDED WITHHOLDING TAX DATA & CALCULATIONS (1601-EQ / 0619-E)     */
  /* ========================================================================= */
  const ewtRows = useMemo(() => {
    return expenses
      .filter(e => !isSampleTransaction(e))
      .filter(e => (Number(e.withholding_2307_2306) || 0) > 0 || (Number((e as any).tax_withheld) || 0) > 0)
      .map(e => {
        const taxWithheld = Number(e.withholding_2307_2306) || Number((e as any).tax_withheld) || 0;
        const grossAmount = Number(e.expense_invoice_amount) || Number((e as any).amount) || Number(e.vatable_expense) || 0;
        const ratePct = grossAmount > 0 ? Math.round((taxWithheld / grossAmount) * 100) : 1;
        const atc = ratePct >= 10 ? 'WI100' : ratePct === 5 ? 'WC157' : ratePct === 2 ? 'WC120' : 'WC158';
        const nature = ratePct >= 10 ? 'Professional Fees (Corp/Individual)' : ratePct === 5 ? 'Rental of Real/Personal Property' : ratePct === 2 ? 'Subcontractors / Contractors' : 'Purchase of Goods / Services';

        return {
          id: e.id,
          date: e.expense_date || (e as any).date || '',
          voucherNo: (e as any).voucher_number || (e as any).invoice_number || `VCH-${e.id}`,
          payeeName: e.service_provider_name || (e as any).supplier_name || 'Vendor / Contractor',
          payeeTin: e.sp_tin || (e as any).tin || '000-000-000-00000',
          branch: '00000',
          nature,
          atc,
          ratePct: `${ratePct}%`,
          taxBase: grossAmount,
          taxWithheld
        };
      })
      .filter(r => {
        if (!ewtSearch) return true;
        const q = ewtSearch.toLowerCase();
        return r.payeeName.toLowerCase().includes(q) || r.payeeTin.includes(q) || r.voucherNo.toLowerCase().includes(q);
      });
  }, [expenses, ewtSearch]);

  const ewtSummary = useMemo(() => {
    const totalTaxBase = ewtRows.reduce((sum, r) => sum + r.taxBase, 0);
    const totalTaxWithheld = ewtRows.reduce((sum, r) => sum + r.taxWithheld, 0);
    // Estimated breakdown across 3 months of the quarter
    const month1 = Math.round((totalTaxWithheld * 0.33) * 100) / 100;
    const month2 = Math.round((totalTaxWithheld * 0.33) * 100) / 100;
    const month3 = Math.max(0, Math.round((totalTaxWithheld - month1 - month2) * 100) / 100);

    return {
      totalTaxBase,
      totalTaxWithheld,
      payeeCount: ewtRows.length,
      month1,
      month2,
      month3
    };
  }, [ewtRows]);

  /* ========================================================================= */
  /* TAB 3: ALPHALIST OF EMPLOYEES DATA (1604-C / 2316 ATTACHMENT)             */
  /* ========================================================================= */
  const alphalistRows = useMemo(() => {
    const empMap = new Map<string, {
      emp: Employee;
      gross: number;
      statutory: number;
      exempt13th: number;
      taxableRegular: number;
      taxableSupplementary: number;
      taxWithheld: number;
      recordCount: number;
    }>();

    // Map all employees first
    employees.forEach(emp => {
      empMap.set(String(emp.employee_id), {
        emp,
        gross: 0,
        statutory: 0,
        exempt13th: 0,
        taxableRegular: 0,
        taxableSupplementary: 0,
        taxWithheld: 0,
        recordCount: 0
      });
    });

    // Accumulate from payroll records
    payrollRecords.forEach(p => {
      const existing = empMap.get(String(p.employee_id));
      const gross = Number(p.gross_pay) || 0;
      const stat = (Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0);
      const exempt13 = (Number(p.thirteenth_month_pay) || 0) + (Number(p.de_minimis_benefits) || 0);
      const wtax = Number(p.withholding_tax) || 0;
      const regular = Number(p.basic_pay) || gross;
      const supp = (Number(p.overtime_pay) || 0) + (Number(p.holiday_pay) || 0);

      if (existing) {
        existing.gross += gross;
        existing.statutory += stat;
        existing.exempt13th += exempt13;
        existing.taxableRegular += regular;
        existing.taxableSupplementary += supp;
        existing.taxWithheld += wtax;
        existing.recordCount += 1;
      } else {
        empMap.set(String(p.employee_id), {
          emp: {
            id: 0,
            employee_id: String(p.employee_id),
            first_name: p.employee_name || 'Employee',
            last_name: '',
            tin: p.employee_tin || '000-000-000',
            monthly_rate: 0,
            employment_status: 'Active'
          },
          gross,
          statutory: stat,
          exempt13th: exempt13,
          taxableRegular: regular,
          taxableSupplementary: supp,
          taxWithheld: wtax,
          recordCount: 1
        });
      }
    });

    return Array.from(empMap.values()).map(({ emp, gross, statutory, exempt13th, taxableRegular, taxableSupplementary, taxWithheld, recordCount }, index) => {
      const isMwe = (emp.monthly_rate || 0) > 0 && (emp.monthly_rate || 0) <= 15000;
      const totalNonTaxable = statutory + Math.min(90000, exempt13th);
      const totalTaxable = Math.max(0, gross - totalNonTaxable);
      
      // Annual tax due via TRAIN Law Section 24(A)
      let annualTaxDue = 0;
      if (!isMwe && totalTaxable > 250000) {
        if (totalTaxable <= 400000) {
          annualTaxDue = (totalTaxable - 250000) * 0.15;
        } else if (totalTaxable <= 800000) {
          annualTaxDue = 22500 + (totalTaxable - 400000) * 0.20;
        } else if (totalTaxable <= 2000000) {
          annualTaxDue = 102500 + (totalTaxable - 800000) * 0.25;
        } else if (totalTaxable <= 8000000) {
          annualTaxDue = 402500 + (totalTaxable - 2000000) * 0.30;
        } else {
          annualTaxDue = 2202500 + (totalTaxable - 8000000) * 0.35;
        }
      }

      const adjustment = taxWithheld - annualTaxDue; // Positive = refund, Negative = to withhold

      return {
        seq: index + 1,
        empId: emp.employee_id,
        tin: emp.tin || '000-000-000-000',
        name: `${emp.last_name || ''}, ${emp.first_name || ''} ${emp.middle_name || ''}`.trim() || emp.first_name || emp.employee_id,
        isMwe,
        gross,
        statutory,
        exempt13th,
        totalNonTaxable,
        totalTaxable,
        annualTaxDue,
        taxWithheld,
        adjustment,
        recordCount
      };
    }).filter(row => {
      if (alphaCategory === 'MWE' && !row.isMwe) return false;
      if (alphaCategory === 'REGULAR' && row.isMwe) return false;
      if (!alphaSearch) return true;
      const q = alphaSearch.toLowerCase();
      return String(row.name).toLowerCase().includes(q) || String(row.tin).includes(q) || String(row.empId).toLowerCase().includes(q);
    });
  }, [employees, payrollRecords, alphaCategory, alphaSearch]);

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
  const qapRows = useMemo(() => {
    return ewtRows.map(r => ({
      id: r.id,
      tin: r.payeeTin,
      branch: r.branch,
      payeeName: r.payeeName,
      atc: r.atc,
      taxBase: r.taxBase,
      taxRate: r.ratePct,
      taxWithheld: r.taxWithheld
    })).filter(r => {
      if (!qapSearch) return true;
      const q = qapSearch.toLowerCase();
      return r.payeeName.toLowerCase().includes(q) || r.tin.includes(q) || r.atc.toLowerCase().includes(q);
    });
  }, [ewtRows, qapSearch]);

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
    const validRows = qapRows.filter(r => !isSampleTransaction(r));
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
    <div className="space-y-5 select-none">
      
      {/* 1. HEADER BANNER */}
      <div className={`p-5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold font-display ${theme.textTitle}`}>
                Withholding Tax Hub
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                BIR TAX COMPLIANCE
              </span>
            </div>
            <p className={`text-xs ${theme.textMuted} mt-0.5`}>
              Entity: <strong className={theme.textTitle}>{companyName}</strong> • TIN: <span className="font-mono font-bold">{companyTin}</span> • Branch: <span className="font-mono">{branchCode}</span>
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${theme.textTitle}`}
            title="Print Current Withholding Tax Schedule"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTION BAR (4 EXACT REQUIRED TABS) */}
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
      {/* TAB CONTENT 1: WITHHOLDING TAX COMPENSATION (FORM 1601-C)             */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_compensation' && (
        <div className="space-y-4">
          
          {/* Controls & Filters */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Period:</span>
              <select
                value={compMonth}
                onChange={(e) => setCompMonth(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="01">January (Month 1)</option>
                <option value="02">February (Month 2)</option>
                <option value="03">March (Month 3)</option>
                <option value="04">April (Month 4)</option>
                <option value="05">May (Month 5)</option>
                <option value="06">June (Month 6)</option>
                <option value="07">July (Month 7)</option>
                <option value="08">August (Month 8)</option>
                <option value="09">September (Month 9)</option>
                <option value="10">October (Month 10)</option>
                <option value="11">November (Month 11)</option>
                <option value="12">December (Month 12)</option>
              </select>

              <select
                value={compYear}
                onChange={(e) => setCompYear(e.target.value)}
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
                  placeholder="Filter employee or ID..."
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <button
                onClick={() => {
                  const headers = ['Employee ID', 'Employee Name', 'Gross Pay', 'Statutory/Exempt', 'Taxable Pay', 'Withholding Tax'];
                  const rows = compRecords.map(p => [
                    p.employee_id,
                    p.employee_name || '',
                    Number(p.gross_pay || 0).toFixed(2),
                    ((Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0)).toFixed(2),
                    (Number(p.net_pay || 0) + Number(p.withholding_tax || 0)).toFixed(2),
                    Number(p.withholding_tax || 0).toFixed(2)
                  ]);
                  handleExportCSV(`BIR_1601C_Compensation_${compYear}_${compMonth}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export 1601-C Schedule CSV"
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
                ₱{compSummary.grossComp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{compSummary.employeeCount} employee records</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Non-Taxable / Exempt</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{compSummary.totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">SSS, PHIC, HDMF & 13th Mo.</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Taxable Compensation</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{compSummary.taxableComp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Net base subject to graduated tax</span>
            </div>

            <div className={`p-4 rounded-2xl border border-amber-500/30 ${theme.bgCard} shadow-xs bg-amber-500/5`}>
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Tax Required to be Withheld</span>
              <p className="text-xl font-bold font-mono mt-1 text-amber-500">
                ₱{compSummary.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-500/80 mt-0.5 block">BIR Form 1601-C Item 17 Remittance</span>
            </div>
          </div>

          {/* Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                BIR Form 1601-C Compensation Withholding Schedule ({compRecords.length} records)
              </h3>
              <span className="text-[11px] text-amber-500 font-mono font-bold">
                Remittance Deadline: 10th of following month
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Emp ID</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Pay Period</th>
                    <th className="p-3 text-right">Gross Pay</th>
                    <th className="p-3 text-right">Statutory Exemption</th>
                    <th className="p-3 text-right">Taxable Pay</th>
                    <th className="p-3 text-right">Withholding Tax</th>
                    <th className="p-3 text-center">Form 2316 Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {compRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400">
                        No payroll compensation records found for {compYear}-{compMonth}. Go to Other Transactions → Payroll to generate payslips.
                      </td>
                    </tr>
                  ) : (
                    compRecords.map((p, idx) => {
                      const gross = Number(p.gross_pay) || 0;
                      const stat = (Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0);
                      const tax = Number(p.withholding_tax) || 0;
                      const taxable = Math.max(0, gross - stat);

                      return (
                        <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-500">{p.employee_id}</td>
                          <td className={`p-3 font-semibold ${theme.textTitle}`}>{p.employee_name || 'Staff Member'}</td>
                          <td className="p-3 font-mono text-zinc-400">{p.payroll_period || `${compYear}-${compMonth}`}</td>
                          <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                            ₱{gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-500">
                            ₱{stat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${theme.textTitle}`}>
                            ₱{taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-500">
                            ₱{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Active Tracked
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: EXPANDED WITHHOLDING TAX (1601-EQ & 0619-E)             */}
      {/* ===================================================================== */}
      {activeSubTab === 'wtx_expanded' && (
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
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Form 0619-E (Month 1 & 2)</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{(ewtSummary.month1 + ewtSummary.month2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Monthly advance remittances</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Quarterly Balance (1601-EQ)</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{ewtSummary.month3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Net remittance on final quarter month</span>
            </div>
          </div>

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
                      <td colSpan={9} className="p-8 text-center text-zinc-400">
                        No purchase or expense transactions with expanded withholding tax recorded. Enter purchases with withholding tax in Purchase Hub to populate.
                      </td>
                    </tr>
                  ) : (
                    ewtRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-500">{r.voucherNo}</td>
                        <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.payeeName}</td>
                        <td className="p-3 font-mono text-zinc-400">{r.payeeTin}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.atc}</td>
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
                            onClick={() => triggerAlert(`Generated BIR Form 2307 certificate for ${r.payeeName} (₱${r.taxWithheld.toFixed(2)})!`, 'success')}
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
                Annual Filing Due: January 31
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Seq #</th>
                    <th className="p-3">Payee TIN</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Registered Payee Name</th>
                    <th className="p-3">ATC Code</th>
                    <th className="p-3 text-right">Gross Income Base</th>
                    <th className="p-3 text-center">Tax Rate</th>
                    <th className="p-3 text-right">Tax Withheld</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {qapRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400">
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
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.atc}</td>
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
