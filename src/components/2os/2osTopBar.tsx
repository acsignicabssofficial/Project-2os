import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Server, 
  Calendar
} from 'lucide-react';
import { Company, ThemeMode } from '../../types';
import PeriodModal from './PeriodModal';

interface TwoOSTopBarProps {
  activeCompany: Company | null;
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  activeBranchCode?: string;
  selectedMonthIdx?: number;
  selectedYear?: number;
  selectedPrefix?: string;
  onMonthYearChange?: (monthIdx: number, year: number, prefix: string) => void;
  globalSearch?: string;
  onSearchChange?: (val: string) => void;
  onSave?: () => void;
  onExportAll?: () => void;
  onExportActiveSheet?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenConvertModal?: () => void;
  onOpenSettings?: () => void;
  activeTab?: string;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  theme: any;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TwoOSTopBar({
  activeCompany,
  companies,
  onSelectCompany,
  activeBranchCode = 'ALL',
  selectedMonthIdx: propMonthIdx,
  selectedYear: propYear,
  selectedPrefix: propPrefix,
  onMonthYearChange,
  onOpenInfinityFreeModal,
  onOpenAuditTrail,
  activeTab = 'dashboard',
  triggerAlert,
  themeMode
}: TwoOSTopBarProps) {
  const [showCompanyMenu, setShowCompanyMenu] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Local date fallback if props not directly passed
  const [localPrefix, setLocalPrefix] = useState<string>('FOR THE MONTH OF');
  const [localMonthIdx, setLocalMonthIdx] = useState<number>(7); // August
  const [localYear, setLocalYear] = useState<number>(2026);

  const selectedPrefix = propPrefix !== undefined ? propPrefix : localPrefix;
  const selectedMonthIdx = propMonthIdx !== undefined ? propMonthIdx : localMonthIdx;
  const selectedYear = propYear !== undefined ? propYear : localYear;

  const handleUpdateDate = (newMonth: number, newYear: number, newPrefix: string) => {
    setLocalMonthIdx(newMonth);
    setLocalYear(newYear);
    setLocalPrefix(newPrefix);
    if (onMonthYearChange) {
      onMonthYearChange(newMonth, newYear, newPrefix);
    }
  };

  const isDark = themeMode === 'dark';
  const isNeon = themeMode === 'neon_light';
  const isTrial = themeMode === 'trial_layout';

  const topBarBg = isTrial
    ? 'bg-[#f8fafc] border-b border-slate-200 text-slate-900 shadow-2xs'
    : isNeon
    ? 'bg-[#EBF5FF] border-b border-sky-200 text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-200 text-zinc-900'
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-100';

  const dropdownBg = (isTrial || isNeon)
    ? 'bg-white border-sky-200 shadow-xl text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-200 shadow-xl text-zinc-900'
    : 'bg-[#091228] border-[#1c356f] shadow-2xl text-cyan-100';

  const branchLabel = activeBranchCode === 'ALL'
    ? 'CONSOLIDATED (ALL BRANCHES)'
    : activeBranchCode === '00000'
    ? 'HEAD OFFICE / MAIN (00000)'
    : `BRANCH CODE ${activeBranchCode}`;

  const periodDisplayText = `${selectedPrefix} ${MONTH_NAMES[selectedMonthIdx].toUpperCase()} ${selectedYear}`;
  const companyDisplayName = activeCompany?.company_name 
    ? activeCompany.company_name.toUpperCase() 
    : 'SELECTED ENTITY';

  // Formal Philippine Accounting & Tax Register Title
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
      case 'activities':
      case 'activity_lists':
      case 'about_app':
        return 'ACTIVITY LISTS & WORKFLOWS (GANTT, KANBAN, TASKS & DEPARTMENTS)';
      case 'system_specs':
      case 'about':
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
      case 'bir_2550m':
        return 'BIR FORM 2550M MONTHLY VAT DECLARATION';
      case 'bir_2550q':
        return 'BIR FORM 2550Q QUARTERLY VAT RETURN';
      case 'bir_1702':
        return 'BIR FORM 1702 ANNUAL INCOME TAX RETURN';
      case 'bir_1601c':
        return 'BIR FORM 1601-C MONTHLY WITHHOLDING TAX ON COMPENSATION';
      case 'bir_0605':
        return 'BIR FORM 0605 PAYMENT FORM';
      case 'bank_recon':
        return 'BANK RECONCILIATION STATEMENT';
      default:
        return `${key.replace(/_/g, ' ').toUpperCase()} REGISTER`;
    }
  };

  return (
    <header className={`${topBarBg} select-none transition-colors duration-200 px-3 py-1.5 border-b`}>
      <div className="flex items-center justify-between gap-3">
        
        {/* ========================================================================= */}
        {/* 1. LEFT SECTION: 2OS LOGO + BRANDING                                      */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm tracking-tighter transition-all flex-shrink-0 ${
            isNeon 
              ? 'logo-chromatic-light text-white font-black shadow-sm' 
              : themeMode === 'clean' 
              ? 'logo-chromatic-clean text-white font-black shadow-sm' 
              : 'logo-chromatic text-white font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
          }`}>
            2OS
          </div>
          <div>
            <h1 className={`font-black text-sm tracking-tight leading-tight uppercase ${
              isDark ? 'text-white' : 'text-slate-950 font-black'
            }`}>
              2OS ACCOUNTING SYSTEM
            </h1>
            <span className={`text-[11px] font-semibold tracking-normal block leading-tight ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}>
              Philippine Tax & PFRS Books of Accounts
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER SECTION: SELECTED ENTITY HEADER CARD (REPLACING OLD DROPDOWN)   */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center flex-1 max-w-[480px] mx-2">
          <div className={`rounded-xl border px-3 py-1 shadow-2xs flex items-center gap-3 w-full transition-all duration-150 ${
            isTrial
              ? 'bg-white/95 border-sky-300 text-slate-900 shadow-xs'
              : isNeon
              ? 'bg-white/95 border-sky-200/90 text-slate-900 shadow-xs'
              : themeMode === 'clean'
              ? 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
              : 'bg-[#08132B] border-[#182F63] text-cyan-100 shadow-xs'
          }`}>
            
            {/* Prominent Cyan Calendar Tile on the left (matching reference image) */}
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-9 h-9 rounded-xl bg-[#00a8ff] hover:bg-[#0096e6] flex items-center justify-center text-white flex-shrink-0 shadow-xs cursor-pointer transition"
              title="Click to open reporting period configuration screen"
            >
              <Calendar className="w-4.5 h-4.5 text-white" />
            </button>

            <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
              {/* 1. SELECTED ENTITY + CONSOLIDATED BADGE */}
              <div className="relative flex items-center justify-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                  className="group flex items-center gap-1 hover:opacity-80 transition cursor-pointer"
                  title="Click to switch active taxpayer entity"
                >
                  <span className={`text-xs font-black tracking-tight uppercase leading-tight ${
                    isTrial ? 'text-slate-950 font-black' : isNeon ? 'text-slate-950 font-black' : themeMode === 'clean' ? 'text-zinc-950 font-black' : 'text-white'
                  }`}>
                    {companyDisplayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-sky-600 dark:text-cyan-400" />
                </button>

                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border flex-shrink-0 ${
                  activeBranchCode === 'ALL'
                    ? (isTrial ? 'bg-sky-100 text-sky-900 border-sky-300' : isNeon ? 'bg-sky-100/90 text-sky-900 border-sky-300' : themeMode === 'clean' ? 'bg-violet-100 text-violet-900 border-violet-300' : 'bg-[#0D1E45] text-cyan-300 border-cyan-500/40')
                    : (isTrial ? 'bg-slate-100 text-slate-800 border-slate-300' : isNeon ? 'bg-sky-50 text-cyan-800 border-sky-200' : themeMode === 'clean' ? 'bg-zinc-100 text-zinc-900 border-zinc-300' : 'bg-[#091533] text-cyan-300 border-cyan-500/40')
                }`}>
                  {branchLabel}
                </span>

                {/* ENTITY DROPDOWN */}
                {showCompanyMenu && (
                  <div className={`absolute top-full mt-2 z-50 w-72 rounded-xl border p-1.5 shadow-2xl text-left ${dropdownBg}`}>
                    <div className="text-[10px] uppercase font-bold px-2 py-1 text-cyan-700 dark:text-cyan-400">
                      Select Registered Tax Entity ({companies.length})
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {companies.map((comp) => {
                        const isSelected = activeCompany?.id === comp.id;
                        return (
                          <button
                            key={comp.id}
                            onClick={() => {
                              onSelectCompany(comp);
                              setShowCompanyMenu(false);
                              triggerAlert(`Switched entity to ${comp.company_name}`, 'success');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected 
                                ? 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-700'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-bold truncate">{comp.company_name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">TIN: {comp.company_tin || 'N/A'}</div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. DYNAMIC TAB / JOURNAL TITLE (SECONDARY FONT SIZE) */}
              <h2 className={`text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-center leading-tight mt-0.5 truncate max-w-[360px] ${
                isTrial ? 'text-sky-700' : isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400'
              }`}>
                {getFormalJournalTitle(activeTab || '')}
              </h2>

              {/* 3. PERIOD DROPDOWN BUTTON (FOR THE MONTH OF AUGUST 2026) */}
              <div className="mt-0.5">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className={`group flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9.5px] font-bold tracking-wider uppercase transition cursor-pointer border shadow-2xs ${
                    isTrial
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                      : isNeon
                      ? 'bg-white hover:bg-sky-50 border-sky-300 text-cyan-900'
                      : themeMode === 'clean'
                      ? 'bg-white hover:bg-violet-50/50 border-zinc-200 text-zinc-800'
                      : 'bg-[#0A1633] hover:bg-[#0E204A] border-[#182F63] text-cyan-200'
                  }`}
                  title="Click to open reporting period configuration screen"
                >
                  <Calendar className="w-3 h-3 text-[#00a8ff]" />
                  <span>{periodDisplayText}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT SECTION: AUDIT TRAIL + INFINITYFREE + USER                       */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-4 flex-shrink-0">
          
          {/* AUDIT TRAIL LINK/BUTTON (MATCHING SCREENSHOT) */}
          <button
            onClick={() => {
              if (onOpenAuditTrail) onOpenAuditTrail();
              else triggerAlert('Opening Audit Trail & Activity Logs...', 'info');
            }}
            className={`font-bold text-xs transition cursor-pointer px-1 py-1 hover:underline ${
              isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-[#0284c7] hover:text-[#0369a1]'
            }`}
            title="Open Audit Trail, Change Logs & History"
          >
            Audit Trail
          </button>

          {/* INFINITYFREE BUTTON (PURPLE GRADIENT IN TRIAL LAYOUT TO MATCH IMAGE) */}
          <button
            onClick={() => {
              if (onOpenInfinityFreeModal) onOpenInfinityFreeModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
              isTrial
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#6366f1] hover:from-[#6d28d9] hover:to-[#4f46e5] text-white border-0 shadow-xs'
                : isDark
                ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border'
                : 'border-emerald-500 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 border'
            }`}
            title="InfinityFree & MySQL Cloud Database Connection"
          >
            <Server className={`w-3.5 h-3.5 ${isTrial ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>InfinityFree & MySQL</span>
          </button>

          {/* USER PROFILE: (AC) USER NAME \n acsignicabss.official */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-[#0F172A] text-white border border-slate-700 flex-shrink-0">
              AC
            </div>
            <div className="text-left">
              <span className={`font-black text-xs block leading-tight uppercase ${
                isDark ? 'text-slate-100' : 'text-slate-950 font-black'
              }`}>
                USER NAME
              </span>
              <span className={`text-[10px] block leading-none font-semibold ${
                isTrial ? 'text-[#00a8ff]' : isDark ? 'text-cyan-300' : 'text-cyan-600'
              }`}>
                acsignicabss.official
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* REPORTING PERIOD POP-OUT SCREEN */}
      <PeriodModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedMonthIdx={selectedMonthIdx}
        selectedYear={selectedYear}
        selectedPrefix={selectedPrefix}
        onApply={(newMonth, newYear, newPrefix) => {
          handleUpdateDate(newMonth, newYear, newPrefix);
          setShowDatePicker(false);
          triggerAlert(`Reporting period updated: ${newPrefix} ${MONTH_NAMES[newMonth].toUpperCase()} ${newYear}`, 'success');
        }}
        themeMode={themeMode}
      />
    </header>
  );
}

