import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  PlusCircle, 
  Printer, 
  History, 
  Upload, 
  SlidersHorizontal,
  ChevronDown, 
  Sparkles, 
  Layers, 
  Database, 
  Receipt, 
  Coins, 
  DollarSign, 
  BookOpen, 
  Building2, 
  Users, 
  Truck, 
  Calculator, 
  Calendar, 
  BookMarked, 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  FileText, 
  FileCheck, 
  FileCheck2, 
  FileCode, 
  Table, 
  Settings as SettingsIcon, 
  Info, 
  CheckSquare, 
  FilePlus, 
  Save, 
  Check, 
  FolderOpen, 
  PieChart, 
  RefreshCw, 
  Search, 
  FileEdit, 
  Tag, 
  Sun, 
  Moon, 
  Palette, 
  ShieldAlert, 
  HardDrive 
} from 'lucide-react';
import { 
  RIBBON_CATEGORIES, 
  RibbonCategoryKey, 
  getCategoryForTab,
  getTabInfo
} from './2osTypes';
import { Company } from '../../types';
import AuditTrailModal from './AuditTrailModal';
import ModalPromptEntry from './ModalPromptEntry';
import PeriodModal from './PeriodModal';

interface TwoOSRibbonProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  activeCompany: Company | null;
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onExportActiveSheet: () => void;
  onExportAllSheets: () => void;
  onOpenNewEntryModal?: () => void;
  activeBranchCode?: string;
  selectedMonthIdx?: number;
  selectedYear?: number;
  selectedPrefix?: string;
  onMonthYearChange?: (monthIdx: number, year: number, prefix: string) => void;
  theme: any;
  themeMode: 'neon_light' | 'clean' | 'dark';
  setThemeMode: (mode: 'neon_light' | 'clean' | 'dark') => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  customersCount?: number;
  providersCount?: number;
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

export default function TwoOSRibbon({
  activeTab,
  onSelectTab,
  activeCompany,
  companies,
  onSelectCompany,
  onExportActiveSheet,
  onExportAllSheets,
  onOpenNewEntryModal,
  activeBranchCode = 'ALL',
  selectedMonthIdx: propMonthIdx,
  selectedYear: propYear,
  selectedPrefix: propPrefix,
  onMonthYearChange,
  theme,
  themeMode,
  setThemeMode,
  triggerAlert,
  customersCount = 0,
  providersCount = 0
}: TwoOSRibbonProps) {
  const currentCategoryKey = getCategoryForTab(activeTab);
  const [selectedCategory, setSelectedCategory] = useState<RibbonCategoryKey>(currentCategoryKey);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [pfrsValidationEnabled, setPfrsValidationEnabled] = useState<boolean>(true);

  // Period / Date State for Ribbon Header Card
  const [localPrefix, setLocalPrefix] = useState<string>('FOR THE MONTH OF');
  const [localMonthIdx, setLocalMonthIdx] = useState<number>(7); // August
  const [localYear, setLocalYear] = useState<number>(2026);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

  // Sync category if activeTab changes externally (unless user explicitly viewing Settings tab)
  React.useEffect(() => {
    if (selectedCategory !== 'SETTINGS') {
      setSelectedCategory(getCategoryForTab(activeTab));
    }
  }, [activeTab]);

  const currentCategory = RIBBON_CATEGORIES.find(c => c.key === selectedCategory) || RIBBON_CATEGORIES[0];
  const activeTabInfo = getTabInfo(activeTab);

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
      default:
        return `${activeTabInfo.label.toUpperCase()} REGISTER`;
    }
  };

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  // Theming colors
  const menuBarBg = isNeon 
    ? 'bg-[#edf6fc] border-b border-sky-200 text-slate-800' 
    : themeMode === 'clean' 
    ? 'bg-[#fafaff] border-b border-zinc-200 text-zinc-800' 
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-200';

  const menuTabActive = isNeon
    ? 'text-sky-950 bg-white font-black border-b-2 border-b-cyan-500 shadow-2xs'
    : themeMode === 'clean'
    ? 'text-zinc-950 bg-white font-black border-b-2 border-b-violet-600 shadow-2xs'
    : 'text-cyan-300 bg-[#0C1938] font-mono font-black border-b-2 border-b-cyan-400 shadow-[0_2px_10px_rgba(6,182,212,0.3)]';

  const menuTabInactive = isNeon
    ? 'text-slate-600 hover:text-sky-950 hover:bg-sky-100/60 font-semibold'
    : themeMode === 'clean'
    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-semibold'
    : 'text-blue-300/70 hover:text-cyan-200 hover:bg-[#0A1633] font-mono font-semibold';

  const settingsTabActive = isNeon
    ? 'text-sky-950 bg-white font-black border-b-2 border-b-cyan-500 shadow-2xs'
    : themeMode === 'clean'
    ? 'text-zinc-950 bg-white font-black border-b-2 border-b-violet-600 shadow-2xs'
    : 'text-cyan-300 bg-[#0C1938] font-mono font-black border-b-2 border-b-cyan-400 shadow-[0_2px_10px_rgba(6,182,212,0.3)]';

  const settingsTabInactive = isNeon
    ? 'text-slate-700 hover:text-sky-950 hover:bg-sky-100 font-bold'
    : themeMode === 'clean'
    ? 'text-zinc-700 hover:text-violet-900 hover:bg-violet-50 font-bold'
    : 'text-blue-300/80 hover:text-cyan-300 hover:bg-[#0A1633] font-mono font-bold';

  const ribbonBodyBg = isNeon
    ? 'bg-white border-b border-sky-200 text-slate-800'
    : themeMode === 'clean'
    ? 'bg-white border-b border-zinc-200 text-zinc-900'
    : 'bg-[#081226] border-b border-[#14264F] text-cyan-100';

  const dividerBorder = isNeon
    ? 'border-sky-200/80'
    : themeMode === 'clean'
    ? 'border-zinc-200'
    : 'border-[#14264F]';

  const groupLabelColor = isNeon
    ? 'text-sky-700 font-semibold'
    : themeMode === 'clean'
    ? 'text-violet-800/70 font-semibold'
    : 'text-cyan-400/80 font-mono font-semibold';

  // Helper for ribbon button styling
  const getToolBtnStyle = (isActive: boolean = false) => {
    if (isActive) {
      return isNeon
        ? 'bg-sky-100 text-cyan-900 border border-sky-300 font-bold shadow-2xs'
        : themeMode === 'clean'
        ? 'bg-violet-100 text-violet-950 border border-violet-300 font-bold shadow-2xs'
        : 'bg-[#0D1E45] text-cyan-300 border border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]';
    }
    return isNeon
      ? 'hover:bg-sky-50 text-slate-700 hover:text-cyan-800 border border-transparent'
      : themeMode === 'clean'
      ? 'hover:bg-violet-50/60 text-zinc-700 hover:text-violet-950 border border-transparent'
      : 'hover:bg-[#0D1B3B] text-blue-200/80 hover:text-cyan-300 border border-transparent font-mono';
  };

  return (
    <div className="select-none transition-colors duration-200 font-sans">
      
      {/* 1. TOP MENU TABS BAR (2OS OFFICE STYLE) */}
      <div className={`flex items-center justify-between px-3 pt-1 border-b transition-colors duration-200 ${menuBarBg}`}>
        
        {/* LEFT SIDE: MAIN CATEGORY TABS (DASHBOARD, DIRECTORY, BOOKS, ETC.) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {RIBBON_CATEGORIES.map((cat) => {
            const isCategoryActive = selectedCategory === cat.key;
            const containsCurrentTab = cat.subTabs.some(st => st.key === activeTab);
            const CatIcon = cat.icon || Layers;

            return (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  if (!cat.subTabs.some(st => st.key === activeTab)) {
                    onSelectTab(cat.subTabs[0].key);
                  }
                }}
                className={`px-3.5 py-1.5 text-xs tracking-tight transition-all duration-150 relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 rounded-t-md ${
                  isCategoryActive 
                    ? menuTabActive 
                    : menuTabInactive
                }`}
              >
                <CatIcon className="w-3.5 h-3.5 opacity-80" />
                <span className="font-bold">{cat.label}</span>
                {containsCurrentTab && !isCategoryActive && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isNeon ? 'bg-cyan-500' : themeMode === 'clean' ? 'bg-violet-600' : 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                  }`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT SIDE: ACTION BUTTONS (EXPORT, IMPORT, WORKBOOK, PRINT, SETTINGS) */}
        <div className="flex items-center gap-1 flex-shrink-0 pl-2">
          {/* Export Active Sheet */}
          <button
            onClick={() => {
              onExportActiveSheet();
              triggerAlert(`Exported ${activeTabInfo.label} to 2OS spreadsheet`, 'success');
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition ${
              isNeon 
                ? 'text-sky-900 hover:bg-white/80 hover:text-cyan-800' 
                : themeMode === 'clean' 
                ? 'text-zinc-800 hover:bg-zinc-100' 
                : 'text-cyan-300 hover:bg-white/10'
            }`}
            title="Export Current Sheet to .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Export</span>
          </button>

          {/* Import Data */}
          <button
            onClick={() => triggerAlert('Import CSV/JSON data dialog: Select file to load', 'info')}
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition ${
              isNeon 
                ? 'text-rose-900 hover:bg-rose-50 hover:text-rose-700' 
                : themeMode === 'clean' 
                ? 'text-zinc-800 hover:bg-zinc-100' 
                : 'text-rose-300 hover:bg-white/10'
            }`}
            title="Import Data from CSV / Excel"
          >
            <Upload className="w-3.5 h-3.5 text-rose-500" />
            <span>Import</span>
          </button>

          {/* Workbook */}
          <button
            onClick={() => {
              onExportAllSheets();
              triggerAlert('Exporting full multi-sheet 2OS accounting workbook...', 'success');
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition ${
              isNeon 
                ? 'text-blue-900 hover:bg-blue-50 hover:text-blue-700' 
                : themeMode === 'clean' 
                ? 'text-zinc-800 hover:bg-zinc-100' 
                : 'text-blue-300 hover:bg-white/10'
            }`}
            title="Export Full Multi-Sheet 2OS Workbook (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Workbook</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition ${
              isNeon 
                ? 'text-violet-900 hover:bg-violet-50 hover:text-violet-700' 
                : themeMode === 'clean' 
                ? 'text-zinc-800 hover:bg-zinc-100' 
                : 'text-violet-300 hover:bg-white/10'
            }`}
            title="Print Current View"
          >
            <Printer className="w-3.5 h-3.5 text-violet-500" />
            <span>Print</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => {
              setSelectedCategory('SETTINGS');
            }}
            className={`px-3 py-1 text-xs tracking-tight transition-all duration-150 rounded cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'SETTINGS'
                ? settingsTabActive
                : settingsTabInactive
            }`}
            title="Open System Settings, Themes, About & Architecture"
          >
            <SettingsIcon className={`w-3.5 h-3.5 ${selectedCategory === 'SETTINGS' ? (isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400') : 'text-zinc-400'}`} />
            <span className="font-semibold text-[11px]">Settings</span>
          </button>
        </div>
      </div>

      {/* 2. 2OS GROUPED RIBBON TOOLBAR */}
      <div className={`w-full px-3 py-1.5 flex items-stretch overflow-hidden transition-colors duration-200 ${ribbonBodyBg}`}>
        
        {/* ========================================================= */}
        {/* VIEW A: IF SETTINGS TAB IS ACTIVE                         */}
        {/* ========================================================= */}
        {selectedCategory === 'SETTINGS' ? (
          <div className="flex-1 min-w-0 overflow-x-auto flex items-stretch gap-3 scrollbar-thin pr-3">
            {/* SETTINGS GROUP 1: THEMES */}
            <div className={`flex flex-col justify-between pr-3 border-r ${dividerBorder} flex-shrink-0`}>
              <div className="flex items-center gap-1.5">
                
                {/* Neon Light Theme (Light Blue Neon Chromatic) */}
                <button
                  onClick={() => {
                    setThemeMode('neon_light');
                    triggerAlert('Theme set to: Neon Light (Light Blue Neon Chromatic)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[72px] text-center ${getToolBtnStyle(themeMode === 'neon_light')}`}
                  title="Neon Light: Light Blue Neon Chromatic"
                >
                  <Sparkles className="w-5 h-5 text-cyan-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-bold">Neon Light</span>
                </button>

                {/* Clean White Theme (Black-White-Violet-Blue) */}
                <button
                  onClick={() => {
                    setThemeMode('clean');
                    triggerAlert('Theme set to: Clean White (Black-White-Violet-Blue)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[72px] text-center ${getToolBtnStyle(themeMode === 'clean')}`}
                  title="Clean White: Black-White-Violet-Blue"
                >
                  <Palette className="w-5 h-5 text-violet-600 mb-0.5" />
                  <span className="text-[10px] leading-tight font-bold">Clean White</span>
                </button>

                {/* Dark Theme (Hacking Dark Blue, Blue Neon, Chromatic Logo) */}
                <button
                  onClick={() => {
                    setThemeMode('dark');
                    triggerAlert('Theme set to: Hacker Dark Blue (Blue Neon & Chromatic Logo)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[72px] text-center ${getToolBtnStyle(themeMode === 'dark')}`}
                  title="Dark Mode: Hacker Dark Blue (Blue Neon & Chromatic Logo)"
                >
                  <Moon className="w-5 h-5 text-cyan-400 mb-0.5" />
                  <span className="text-[10px] leading-tight font-bold">Dark Hacker</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  Themes & Appearance
                </span>
              </div>
            </div>

            {/* SETTINGS GROUP 2: ABOUT & INFORMATION */}
            <div className={`flex flex-col justify-between pr-3 border-r ${dividerBorder} flex-shrink-0`}>
              <div className="flex items-center gap-1.5">
                
                {/* About 2OS App */}
                <button
                  onClick={() => {
                    onSelectTab('system_specs');
                    triggerAlert('Navigated to About 2OS Accounting System Specs', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[66px] text-center ${getToolBtnStyle(activeTab === 'system_specs')}`}
                  title="View About 2OS Application & System Specs"
                >
                  <Info className="w-5 h-5 text-blue-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">About 2OS</span>
                </button>

                {/* Tax Calendar */}
                <button
                  onClick={() => {
                    onSelectTab('tax_calendar');
                    triggerAlert('Navigated to BIR Tax Calendar', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[66px] text-center ${getToolBtnStyle(activeTab === 'tax_calendar')}`}
                  title="View BIR Philippine Tax Calendar & Deadlines"
                >
                  <Calendar className="w-5 h-5 text-amber-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">Tax Calendar</span>
                </button>

                {/* Chart of Accounts */}
                <button
                  onClick={() => {
                    onSelectTab('account_titles');
                    triggerAlert('Navigated to Master Chart of Accounts', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[66px] text-center ${getToolBtnStyle(activeTab === 'account_titles')}`}
                  title="View Master Account Titles & Balances"
                >
                  <BookMarked className="w-5 h-5 text-teal-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">Chart of Accts</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  About & Info
                </span>
              </div>
            </div>

            {/* SETTINGS GROUP 3: AUDIT TRAIL & INTEGRITY */}
            <div className={`flex flex-col justify-between pr-3 border-r ${dividerBorder} flex-shrink-0`}>
              <div className="flex items-center gap-1.5">
                
                {/* Audit Trail Log */}
                <button
                  onClick={() => setShowAuditModal(true)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[70px] text-center ${
                    isNeon
                      ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold shadow-2xs'
                      : themeMode === 'clean'
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 font-bold shadow-2xs'
                      : 'bg-[#0D1E45] hover:bg-[#142A5C] text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  }`}
                  title="Open Complete Audit Trail, Edit History & Visual Diff Preview"
                >
                  <History className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-0.5" />
                  <span className="text-[10px] leading-tight font-black">Audit Log</span>
                </button>

                {/* Validation Controls */}
                <div className="flex flex-col justify-center gap-1.5 px-2 py-0.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoSaveEnabled} 
                      onChange={(e) => {
                        setAutoSaveEnabled(e.target.checked);
                        triggerAlert(`Auto-Save & Verification ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                      }}
                      className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="whitespace-nowrap">Auto-Save State</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pfrsValidationEnabled} 
                      onChange={(e) => {
                        setPfrsValidationEnabled(e.target.checked);
                        triggerAlert(`PFRS Strict Double-Entry Balance Check ${e.target.checked ? 'Active' : 'Bypassed'}`, 'info');
                      }}
                      className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="whitespace-nowrap">PFRS Strict Balance</span>
                  </label>
                </div>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  Audit & Compliance
                </span>
              </div>
            </div>

            {/* SETTINGS GROUP 4: DATA & BACKUP */}
            <div className="flex flex-col justify-between flex-shrink-0">
              <div className="flex items-center gap-1">
                
                {/* Export Full Workbook */}
                <button
                  onClick={() => {
                    onExportAllSheets();
                    triggerAlert('Exporting full multi-sheet 2OS accounting workbook (.xlsx)...', 'success');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[62px] text-center ${getToolBtnStyle()}`}
                  title="Export Full 2OS Accounting Workbook (.xlsx)"
                >
                  <Download className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">Backup XLSX</span>
                </button>

                {/* Print View */}
                <button
                  onClick={() => window.print()}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[56px] text-center ${getToolBtnStyle()}`}
                  title="Print Current Sheet"
                >
                  <Printer className="w-5 h-5 text-violet-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">Print</span>
                </button>

                {/* Import Data */}
                <button
                  onClick={() => triggerAlert('Import data dialog: Select CSV/JSON file to restore records', 'info')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[56px] text-center ${getToolBtnStyle()}`}
                  title="Import / Restore Data from CSV or JSON"
                >
                  <Upload className="w-5 h-5 text-blue-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium">Restore</span>
                </button>

                {/* 2OS Architecture & Specs */}
                <button
                  onClick={() => onSelectTab('system_specs')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[64px] text-center ${getToolBtnStyle(activeTab === 'system_specs')}`}
                  title="View 2OS Accounting System Architecture, Principles & Specs"
                >
                  <Info className="w-5 h-5 text-indigo-500 mb-0.5" />
                  <span className="text-[10px] leading-tight font-medium whitespace-pre-line">System{"\n"}Specs</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  Data & Backup
                </span>
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* VIEW B: NORMAL CATEGORY RIBBON TOOLBAR                    */
          /* ========================================================= */
          <div className="flex-1 min-w-0 overflow-x-auto pr-3 flex items-stretch scrollbar-thin">
            {/* GROUP 1: CATEGORY MODULES & BOOKS (THE ONLY HORIZONTALLY SCROLLABLE TOOLS AREA) */}
            <div className="flex flex-col justify-between flex-shrink-0 h-full py-0.5">
              <div className="flex items-center gap-1.5">
                {currentCategory.subTabs.map((subTab) => {
                  const isActive = activeTab === subTab.key;
                  const SubIcon = subTab.icon;

                  return (
                    <button
                      key={subTab.key}
                      onClick={() => onSelectTab(subTab.key)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[76px] max-w-[140px] text-center h-[62px] ${getToolBtnStyle(isActive)}`}
                      title={subTab.description}
                    >
                      <SubIcon className={`w-4 h-4 mb-1 flex-shrink-0 ${
                        isActive 
                          ? (isNeon ? 'text-cyan-700 font-bold' : themeMode === 'clean' ? 'text-violet-700 font-bold' : 'text-cyan-300 font-bold') 
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`} />
                      <span className="text-[10px] leading-[1.15] whitespace-pre-line text-center font-medium">
                        {subTab.shortLabel || subTab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-left mt-1 pl-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  {currentCategory.label} Tools
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT SIDE FIXED: SELECTED ENTITY HEADER CARD (MATCHING IMAGE 2)          */}
        {/* ========================================================================= */}
        <div className="ml-auto flex items-center pl-3 flex-shrink-0">
          <div className={`rounded-xl border px-4 py-2 shadow-2xs flex flex-col items-center justify-center text-center min-w-[320px] max-w-[460px] transition-all duration-150 ${
            isNeon
              ? 'bg-white/95 border-sky-200/90 text-slate-900'
              : themeMode === 'clean'
              ? 'bg-white border-zinc-200 text-zinc-900'
              : 'bg-[#08132B] border-[#182F63] text-cyan-100'
          }`}>
            
            {/* 1. SELECTED ENTITY (HIGHEST FONT SIZE) + CONSOLIDATED BADGE */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className={`text-sm sm:text-base font-black tracking-tight uppercase leading-tight ${
                isNeon ? 'text-slate-950 font-black' : themeMode === 'clean' ? 'text-zinc-950 font-black' : 'text-white'
              }`}>
                {companyDisplayName}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border flex-shrink-0 ${
                activeBranchCode === 'ALL'
                  ? (isNeon ? 'bg-sky-100/90 text-sky-900 border-sky-300' : themeMode === 'clean' ? 'bg-violet-100 text-violet-900 border-violet-300' : 'bg-[#0D1E45] text-cyan-300 border-cyan-500/40')
                  : (isNeon ? 'bg-sky-50 text-cyan-800 border-sky-200' : themeMode === 'clean' ? 'bg-zinc-100 text-zinc-900 border-zinc-300' : 'bg-[#091533] text-cyan-300 border-cyan-500/40')
              }`}>
                {branchLabel}
              </span>
            </div>

            {/* 2. DYNAMIC TAB / JOURNAL TITLE (SECONDARY FONT SIZE) */}
            <h2 className={`text-xs sm:text-[13px] font-bold tracking-wide uppercase text-center leading-tight mt-0.5 ${
              isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400'
            }`}>
              {getFormalJournalTitle(activeTab)}
            </h2>

            {/* 3. PERIOD DROPDOWN BUTTON (FOR THE MONTH OF AUGUST 2026) */}
            <div className="mt-1">
              <button
                onClick={() => setShowDatePicker(true)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition cursor-pointer border shadow-2xs ${
                  isNeon
                    ? 'bg-white hover:bg-sky-50 border-sky-300 text-cyan-900'
                    : themeMode === 'clean'
                    ? 'bg-white hover:bg-violet-50/50 border-zinc-200 text-zinc-800'
                    : 'bg-[#0A1633] hover:bg-[#0E204A] border-[#182F63] text-cyan-200'
                }`}
                title="Click to open reporting period configuration screen"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                <span>{periodDisplayText}</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* POPUP MODAL 1: AUDIT TRAIL LOG & PREVIEW */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        activeTab={activeTab}
        activeCompany={activeCompany}
        themeMode={themeMode}
      />

      {/* POPUP MODAL 2: MODAL PROMPTS (ADD ENTRY) */}
      <ModalPromptEntry
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        activeTab={activeTab}
        activeCompany={activeCompany}
        onSelectTab={onSelectTab}
        triggerAlert={triggerAlert}
        themeMode={themeMode}
      />

      {/* POPUP MODAL 3: REPORTING PERIOD POP-OUT SCREEN */}
      <PeriodModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedMonthIdx={selectedMonthIdx}
        selectedYear={selectedYear}
        selectedPrefix={selectedPrefix}
        onApply={(newMonth, newYear, newPrefix) => {
          handleUpdateDate(newMonth, newYear, newPrefix);
          triggerAlert(`Reporting period updated: ${newPrefix} ${MONTH_NAMES[newMonth].toUpperCase()} ${newYear}`, 'success');
        }}
        themeMode={themeMode}
      />

    </div>
  );
}
