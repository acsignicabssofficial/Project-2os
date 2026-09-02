import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  FileText, 
  Layers, 
  ChevronDown, 
  Check, 
  Filter, 
  Sparkles,
  GitBranch,
  ShieldCheck
} from 'lucide-react';
import { Company } from '../../types';
import { getTabInfo } from './2osTypes';

interface TwoOSDocumentHeaderProps {
  activeTab: string;
  activeCompany: Company | null;
  companies?: Company[];
  setActiveCompany?: (comp: Company) => void;
  activeBranchCode?: string;
  theme: any;
  themeMode: 'neon_light' | 'clean' | 'dark';
  triggerAlert?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PERIOD_PREFIXES = [
  'FOR THE MONTH OF',
  'FOR THE QUARTER ENDED',
  'FOR THE YEAR ENDED',
  'AS OF',
  'FOR THE PERIOD ENDED'
];

export default function TwoOSDocumentHeader({
  activeTab,
  activeCompany,
  companies = [],
  setActiveCompany,
  activeBranchCode = 'ALL',
  theme,
  themeMode,
  triggerAlert
}: TwoOSDocumentHeaderProps) {
  const isNeon = themeMode === 'neon_light';
  const isDark = themeMode === 'dark';

  // Current branch label helper
  const branchLabel = activeBranchCode === 'ALL'
    ? 'CONSOLIDATED (ALL BRANCHES)'
    : activeBranchCode === '00000'
    ? 'HEAD OFFICE / MAIN (00000)'
    : `BRANCH CODE ${activeBranchCode}`;

  // Current date states
  const [selectedPrefix, setSelectedPrefix] = useState<string>('FOR THE MONTH OF');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(7); // 7 = August
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState<boolean>(false);

  const tabInfo = getTabInfo(activeTab);

  // Map sub-tab key to its formal Philippine standard journal/report title
  const getFormalJournalTitle = (key: string): string => {
    switch (key) {
      case 'sales':
        return 'SALES JOURNAL / REVENUE REGISTER';
      case 'collections':
        return 'CASH RECEIPTS BOOK / COLLECTIONS REGISTER';
      case 'expenses':
        return 'PURCHASE BOOK / VENDOR EXPENSES REGISTER';
      case 'payments':
        return 'CASH DISBURSEMENTS BOOK / CHECK REGISTER';
      case 'general_journal':
        return 'GENERAL JOURNAL / VOUCHER REGISTER';
      case 'general_ledger':
        return 'GENERAL LEDGER (T-ACCOUNTS & ENDING BALANCES)';
      case 'special_entries':
        return 'SPECIAL JOURNAL VOUCHERS (ADJUSTING & ACCRUAL ENTRIES)';
      case 'dashboard':
        return 'EXECUTIVE FINANCIAL MONITORING DASHBOARD';
      case 'about_app':
        return '2OS ACCOUNTING SYSTEM ARCHITECTURE & STANDARDS';
      case 'companies':
        return 'TAXPAYER ENTITY MASTER REGISTER & BRANCHES';
      case 'customers':
        return 'CUSTOMER MASTERLIST & RECEIVABLES SCHEDULE';
      case 'providers':
        return 'SERVICE PROVIDERS & SUPPLIERS REGISTER';
      case 'related_parties':
        return 'RELATED PARTIES (CUSTOMERS, SUPPLIERS & CONTRACTORS)';
      case 'account_titles':
        return 'CHART OF ACCOUNTS & REAL-TIME BALANCES';
      case 'tax_calendar':
        return 'BIR COMPLIANCE FILING SCHEDULE & TAX CALENDAR';
      case 'employees':
        return 'EMPLOYEE MASTERLIST & COMPENSATION PROFILES';
      case 'payroll':
        return 'PAYROLL REGISTER & STATUTORY REMITTANCES';
      case 'bir_2316':
        return 'BIR FORM 2316 COMPENSATION & TAX WITHHELD';
      case 'contribution_tables':
        return 'SSS, PHILHEALTH, PAG-IBIG & TRAIN TAX MATRIX';
      case 'ppe':
        return 'PROPERTY, PLANT & EQUIPMENT DEPRECIATION SCHEDULE';
      case 'cwt_customers':
        return 'BIR FORM 2307 CREDITABLE WITHHOLDING TAX (CLAIMS)';
      case 'cwt_providers':
        return 'BIR FORM 2307 CREDITABLE WITHHOLDING TAX (ISSUED)';
      case 'bir_slsp':
        return 'SUMMARY LIST OF SALES & PURCHASES (SLSP)';
      case 'bir_qap':
        return 'QUARTERLY ALPHALIST OF PAYEES (QAP / 1601-EQ)';
      case 'bir_sawt':
        return 'SUMMARY ALPHALIST OF WITHHOLDING AGENTS (SAWT)';
      case 'tax_reports':
        return 'BIR TAX COMPUTATION & COMPLIANCE SUITE';
      case 'reports':
        return 'REPORTING CENTER & AUDIT WORKBOOK EXPORT';
      case 'fs_position':
        return 'STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)';
      case 'fs_income':
        return 'STATEMENT OF COMPREHENSIVE INCOME (INCOME STATEMENT)';
      case 'fs_equity':
        return 'STATEMENT OF CHANGES IN EQUITY';
      case 'fs_cashflows':
        return 'STATEMENT OF CASH FLOWS (INDIRECT METHOD)';
      case 'fs_notes':
        return 'NOTES TO FINANCIAL STATEMENTS & DISCLOSURES';
      default:
        return `${tabInfo.label.toUpperCase()} REGISTER`;
    }
  };

  const companyDisplayName = activeCompany?.company_name 
    ? activeCompany.company_name.toUpperCase() 
    : 'SELECTED ENTITY';

  const periodDisplayText = `${selectedPrefix} ${MONTH_NAMES[selectedMonthIdx].toUpperCase()} ${selectedYear}`;

  // Theme styling rules
  const containerBg = isNeon
    ? 'bg-white/95 border border-sky-200 shadow-xs backdrop-blur-xs'
    : themeMode === 'clean'
    ? 'bg-white border border-zinc-200 shadow-xs'
    : 'bg-[#060D1F] border border-[#14264F] shadow-[0_0_15px_rgba(6,182,212,0.15)]';

  const titleColor = isNeon
    ? 'text-slate-900'
    : themeMode === 'clean'
    ? 'text-zinc-950'
    : 'text-white font-mono';

  const journalColor = isNeon
    ? 'text-sky-700'
    : themeMode === 'clean'
    ? 'text-violet-800'
    : 'neon-text-blue font-mono';

  const periodColor = isNeon
    ? 'text-slate-600'
    : themeMode === 'clean'
    ? 'text-zinc-600'
    : 'text-cyan-300/80 font-mono';

  return (
    <div className="w-full pt-1 pb-2 select-none">
      <div className={`max-w-4xl mx-auto rounded-xl px-6 py-4 transition-all duration-200 ${containerBg}`}>
        
        {/* ========================================================================= */}
        {/* 1. TOP LINE: COMPANY LEGAL NAME (DYNAMIC BASED ON SELECTED ENTITY)        */}
        {/* ========================================================================= */}
        <div className="relative group flex items-center justify-center gap-2 flex-wrap">
          <h1 className={`text-base sm:text-lg md:text-xl font-black tracking-wider uppercase ${titleColor}`}>
            {companyDisplayName}
          </h1>

          {/* Branch / Consolidation Indicator Pill */}
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${
            activeBranchCode === 'ALL'
              ? (isNeon 
                  ? 'bg-sky-100 text-sky-900 border-sky-300' 
                  : themeMode === 'clean' 
                  ? 'bg-violet-100 text-violet-900 border-violet-300' 
                  : 'bg-[#0D1E45] text-cyan-300 border-cyan-500/40')
              : (isNeon 
                  ? 'bg-sky-50 text-cyan-800 border-sky-200' 
                  : themeMode === 'clean' 
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-300' 
                  : 'bg-[#091533] text-cyan-300 border-cyan-500/40')
          }`}>
            {branchLabel}
          </span>

          {/* Quick Company Switcher if multiple companies exist */}
          {companies.length > 1 && setActiveCompany && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyPicker(!showCompanyPicker)}
                className={`p-1 rounded-md transition cursor-pointer opacity-70 hover:opacity-100 ${
                  isNeon ? 'hover:bg-sky-100 text-sky-800' : themeMode === 'clean' ? 'hover:bg-violet-100 text-zinc-700' : 'hover:bg-[#0D1E45] text-cyan-300'
                }`}
                title="Quick Switch Entity"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showCompanyPicker && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-xl border p-1.5 z-50 shadow-2xl ${
                  isNeon ? 'bg-white border-sky-200 text-slate-900' : themeMode === 'clean' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#091228] border-[#14264F] text-cyan-100'
                }`}>
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 ${
                    isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-zinc-400' : 'text-cyan-400 font-mono'
                  }`}>
                    Select Active Taxpayer Entity
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveCompany(c);
                          setShowCompanyPicker(false);
                          if (triggerAlert) triggerAlert(`Switched header to ${c.company_name}`, 'success');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          activeCompany?.id === c.id 
                            ? (isNeon ? 'bg-sky-100 text-sky-900 font-bold' : themeMode === 'clean' ? 'bg-violet-50 text-violet-950 font-bold' : 'bg-[#0D1E45] text-cyan-300 font-bold border border-cyan-500/40') 
                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{c.company_name}</span>
                        {activeCompany?.id === c.id && <Check className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isNeon ? 'text-sky-600' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'
                        }`} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. MIDDLE LINE: SPECIFIC SPREADSHEET / JOURNAL / STATEMENT NAME           */}
        {/* ========================================================================= */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <h2 className={`text-xs sm:text-sm md:text-base font-black tracking-wide uppercase text-center ${journalColor}`}>
            {getFormalJournalTitle(activeTab)}
          </h2>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM LINE: FINANCIAL PERIOD & MONTH (EDITABLE DROPDOWN)              */}
        {/* ========================================================================= */}
        <div className="mt-1.5 flex items-center justify-center">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase transition cursor-pointer border ${
                isNeon 
                  ? 'bg-slate-50 hover:bg-sky-50 border-sky-200 hover:border-sky-300 text-slate-700' 
                  : themeMode === 'clean'
                  ? 'bg-zinc-50 hover:bg-violet-50/50 border-zinc-200 hover:border-violet-300 text-zinc-700'
                  : 'bg-[#081226] hover:bg-[#0D1E45] border-[#14264F] hover:border-cyan-500 text-cyan-200 font-mono'
              }`}
              title="Click to adjust reporting period date"
            >
              <Calendar className={`w-3 h-3 opacity-80 group-hover:opacity-100 ${
                isNeon ? 'text-cyan-500' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'
              }`} />
              <span>{periodDisplayText}</span>
              <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </button>

            {/* INTERACTIVE PERIOD PICKER POPOVER */}
            {showDatePicker && (
              <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl border p-3.5 z-50 shadow-2xl text-xs transition-all ${
                isNeon 
                  ? 'bg-white border-sky-200 text-slate-900' 
                  : themeMode === 'clean'
                  ? 'bg-white border-zinc-200 text-zinc-900'
                  : 'bg-[#091228] border-[#14264F] text-cyan-100'
              }`}>
                
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-black/10 dark:border-white/10">
                  <span className={`font-black text-[11px] uppercase tracking-wider ${
                    isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400 font-mono'
                  }`}>
                    Adjust Period Header
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">PFRS / BIR</span>
                </div>

                {/* Period Prefix Selector */}
                <div className="space-y-1 mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Statement Frequency
                  </label>
                  <select
                    value={selectedPrefix}
                    onChange={(e) => setSelectedPrefix(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                      isNeon 
                        ? 'bg-slate-50 border-sky-200 text-slate-900' 
                        : themeMode === 'clean'
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        : 'bg-[#0D1E45] border-[#14264F] text-cyan-100 font-mono'
                    }`}
                  >
                    {PERIOD_PREFIXES.map((prefix) => (
                      <option key={prefix} value={prefix}>{prefix}</option>
                    ))}
                  </select>
                </div>

                {/* Month & Year Selectors */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Month
                    </label>
                    <select
                      value={selectedMonthIdx}
                      onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                        isNeon 
                          ? 'bg-slate-50 border-sky-200 text-slate-900' 
                          : themeMode === 'clean'
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          : 'bg-[#0D1E45] border-[#14264F] text-cyan-100 font-mono'
                      }`}
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Fiscal Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                        isNeon 
                          ? 'bg-slate-50 border-slate-200 text-slate-900' 
                          : themeMode === 'clean'
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          : 'bg-[#1f1f27] border-[#31313e] text-zinc-100'
                      }`}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => {
                    setShowDatePicker(false);
                    if (triggerAlert) triggerAlert(`Header period updated: ${periodDisplayText}`, 'success');
                  }}
                  className={`w-full py-1.5 rounded-lg text-white font-bold text-xs cursor-pointer transition shadow-xs ${
                    isNeon 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                      : themeMode === 'clean' 
                      ? 'bg-violet-700 hover:bg-violet-800' 
                      : 'bg-[#0D214D] hover:bg-[#142D66] border border-cyan-400 text-cyan-300'
                  }`}
                >
                  Apply Period Header
                </button>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
