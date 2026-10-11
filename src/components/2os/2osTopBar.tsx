import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Calendar,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Printer,
  Settings as SettingsIcon
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
  onOpenImportModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenNewEntryModal?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenConvertModal?: () => void;
  onOpenSettings?: () => void;
  isSettingsOpen?: boolean;
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
  onExportAll,
  onExportActiveSheet,
  onOpenImportModal,
  onOpenExportModal,
  onOpenNewEntryModal,
  onOpenAuditTrail,
  onOpenSettings,
  isSettingsOpen = false,
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

  const topBarBg = isDark
    ? 'bg-[#060D1F] border-b border-[#14264F] text-cyan-100'
    : 'bg-[#eff7ff] border-b border-sky-200/80 text-slate-900';

  const dropdownBg = isDark
    ? 'bg-[#091228] border-[#1c356f] shadow-2xl text-cyan-100'
    : 'bg-white border-sky-200 shadow-xl text-slate-900';

  const branchLabel = activeBranchCode === 'ALL'
    ? 'CONSOLIDATED (ALL BRANCHES)'
    : activeBranchCode === '00000'
    ? 'HEAD OFFICE / MAIN (00000)'
    : `BRANCH CODE ${activeBranchCode}`;

  const periodDisplayText = `${selectedPrefix} ${MONTH_NAMES[selectedMonthIdx].toUpperCase()} ${selectedYear}`;

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
      case 'special_ledger':
        return 'SPECIAL LEDGER (T-ACCOUNTS & ENDING BALANCES)';
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
    <header className={`${topBarBg} select-none transition-colors duration-200 px-3 pt-1.5 pb-1.5 border-b`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-1">
        
        {/* ========================================================================= */}
        {/* ROW 1, COL 1: 2OS LOGO + BRANDING (LEFT)                                  */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2.5 justify-self-start">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm tracking-tighter transition-all flex-shrink-0 logo-chromatic-light text-white shadow-sm">
            2OS
          </div>
          <div>
            <h1 className={`font-black text-sm tracking-tight leading-tight uppercase ${
              isDark ? 'text-white' : 'text-slate-950 font-black'
            }`}>
              2OS ACCOUNTING SYSTEM
            </h1>
            <span className={`text-[11px] font-semibold tracking-normal block leading-tight ${
              isDark ? 'text-cyan-400' : 'text-[#0284c7]'
            }`}>
              Philippine Tax & PFRS Books of Accounts
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 1 & 2, COL 2: CENTER STACK (SELECT ENTITY + TITLE + FOR THE MONTH OF) */}
        {/* ========================================================================= */}
        <div className="row-span-2 flex flex-col items-center justify-center text-center justify-self-center px-2">
          {/* 1. SELECT ENTITY + BRANCH BADGE */}
          <div className="relative flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition cursor-pointer ${
                isDark 
                  ? 'hover:bg-white/10 text-cyan-200' 
                  : 'hover:bg-sky-100/80 text-slate-900'
              }`}
              title="Click to switch active taxpayer entity"
            >
              <Building2 className={`w-3.5 h-3.5 ${
                isDark ? 'text-cyan-400' : 'text-[#0284c7]'
              }`} />
              <span className={`text-xs font-black tracking-tight uppercase leading-tight ${
                isDark ? 'text-white' : 'text-slate-950 font-black'
              }`}>
                {activeCompany?.company_name ? activeCompany.company_name.toUpperCase() : 'SELECT ENTITY'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#0284c7] dark:text-cyan-400" />
            </button>

            <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase border flex-shrink-0 ${
              isDark
                ? 'bg-[#0D1E45] text-cyan-300 border-cyan-500/40'
                : 'bg-[#e0f2fe] text-[#0369a1] border-sky-300/80'
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
                  {companies.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No entities registered yet.<br/>
                      <span className="text-[11px] text-sky-600 dark:text-cyan-400 font-semibold">
                        Add an entity in the Entities Register.
                      </span>
                    </div>
                  ) : (
                    companies.map((comp) => {
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
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. DYNAMIC TAB / JOURNAL TITLE */}
          <h2 className={`text-[11px] font-extrabold tracking-wide uppercase text-center leading-tight mt-0.5 truncate max-w-[460px] ${
            isDark ? 'text-cyan-400' : 'text-[#0369a1]'
          }`}>
            {getFormalJournalTitle(activeTab || '')}
          </h2>

          {/* 3. REPORTING PERIOD BUTTON (ALIGNED DIRECTLY UNDER SELECT ENTITY & TITLE) */}
          <div className="mt-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase transition cursor-pointer ${
                isDark
                  ? 'text-cyan-200/90 hover:bg-white/10'
                  : 'text-slate-700 hover:bg-sky-100/80'
              }`}
              title="Click to open reporting period configuration screen"
            >
              <Calendar className="w-3 h-3 text-[#0284c7] dark:text-cyan-400" />
              <span>{periodDisplayText}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 1, COL 3: USER PROFILE (AC) + AUDIT TRAIL + SETTINGS (RIGHT)          */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-4 justify-self-end">
          
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
                isDark ? 'text-cyan-300' : 'text-[#0284c7]'
              }`}>
                acsignicabss.official
              </span>
            </div>
          </div>

          {/* AUDIT TRAIL LINK/BUTTON */}
          <button
            onClick={() => {
              if (onOpenAuditTrail) onOpenAuditTrail();
              else triggerAlert('Opening Audit Trail & Activity Logs...', 'info');
            }}
            className={`font-bold text-xs transition cursor-pointer px-1.5 py-1 hover:underline ${
              isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-[#0284c7] hover:text-[#0369a1]'
            }`}
            title="Open Audit Trail, Change Logs & History"
          >
            Audit Trail
          </button>

          {/* SETTINGS BUTTON */}
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              isSettingsOpen
                ? (isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-slate-900 font-bold')
                : (isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-sky-100/70')
            }`}
            title="Open System Settings, Themes, About & Architecture"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Settings</span>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* ROW 2, COL 1: CREATE ENTITY PROFILE (LEFT)                                */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-self-start">
          <button
            onClick={() => {
              if (onOpenNewEntryModal) {
                onOpenNewEntryModal();
              }
            }}
            className="px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer transition bg-[#06b6d4] hover:bg-[#0891b2] text-slate-950 shadow-2xs"
            title="Create Entity Profile"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Entity Profile</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ROW 2, COL 3: EXPORT, IMPORT, WORKBOOK, PRINT (RIGHT)                     */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 justify-self-end">
          {/* Export */}
          <button
            onClick={() => {
              if (onOpenExportModal) {
                onOpenExportModal();
              } else if (onExportActiveSheet) {
                onExportActiveSheet();
              }
            }}
            className={`px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition ${
              isDark ? 'text-cyan-300 hover:bg-white/10' : 'text-[#0f4c81] hover:bg-sky-100/80'
            }`}
            title="Export Data (Select dataset, CSV, Excel, or SQL)"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-[#0284c7]'}`} />
            <span>Export</span>
          </button>

          {/* Import */}
          <button
            onClick={() => {
              if (onOpenImportModal) {
                onOpenImportModal();
              }
            }}
            className={`px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition ${
              isDark ? 'text-rose-300 hover:bg-white/10' : 'text-[#9f1239] hover:bg-rose-50'
            }`}
            title="Import Data (CSV, Templates, Column Summary, DB Update)"
          >
            <Upload className="w-3.5 h-3.5 text-[#e11d48]" />
            <span>Import</span>
          </button>

          {/* Workbook */}
          <button
            onClick={() => {
              if (onExportAll) {
                onExportAll();
              }
            }}
            className={`px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition ${
              isDark ? 'text-blue-300 hover:bg-white/10' : 'text-[#1e3a8a] hover:bg-blue-50'
            }`}
            title="Export Full Multi-Sheet 2OS Workbook (.xlsx)"
          >
            <Download className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-[#0284c7]'}`} />
            <span>Workbook</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className={`px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition ${
              isDark ? 'text-violet-300 hover:bg-white/10' : 'text-[#5b21b6] hover:bg-violet-50'
            }`}
            title="Print Current View"
          >
            <Printer className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>Print</span>
          </button>
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

