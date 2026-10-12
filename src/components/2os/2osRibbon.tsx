import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  PlusCircle, 
  Plus,
  Printer, 
  History, 
  Upload, 
  SlidersHorizontal,
  ChevronDown, 
  ChevronUp,
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
  HardDrive,
  Eye 
} from 'lucide-react';
import { 
  RIBBON_CATEGORIES, 
  RibbonCategoryKey, 
  getCategoryForTab,
  getTabInfo
} from './2osTypes';
import { Company, ThemeMode } from '../../types';
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
  onOpenImportModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenNewEntryModal?: () => void;
  showPromptModal?: boolean;
  setShowPromptModal?: (val: boolean) => void;
  isSettingsCategoryOpen?: boolean;
  setIsSettingsCategoryOpen?: (val: boolean) => void;
  activeBranchCode?: string;
  selectedMonthIdx?: number;
  selectedYear?: number;
  selectedPrefix?: string;
  onMonthYearChange?: (monthIdx: number, year: number, prefix: string) => void;
  theme: any;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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
  onOpenImportModal,
  onOpenExportModal,
  onOpenNewEntryModal,
  showPromptModal: propShowPromptModal,
  setShowPromptModal: propSetShowPromptModal,
  isSettingsCategoryOpen,
  setIsSettingsCategoryOpen,
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
  const [isToolsCollapsed, setIsToolsCollapsed] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [localShowPromptModal, setLocalShowPromptModal] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [pfrsValidationEnabled, setPfrsValidationEnabled] = useState<boolean>(true);

  const showPromptModal = propShowPromptModal !== undefined ? propShowPromptModal : localShowPromptModal;
  const setShowPromptModal = propSetShowPromptModal || setLocalShowPromptModal;

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
    if (isSettingsCategoryOpen) {
      setSelectedCategory('SETTINGS');
      setIsToolsCollapsed(false);
    } else if (selectedCategory !== 'SETTINGS') {
      setSelectedCategory(getCategoryForTab(activeTab));
    }
  }, [activeTab, isSettingsCategoryOpen]);

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

  const isDark = themeMode === 'dark';

  const hasEntityProfile = Boolean(
    companies.length > 0 &&
    activeCompany &&
    activeCompany.company_name &&
    activeCompany.company_name.trim().length > 0 &&
    activeCompany.company_name !== 'Select Company...'
  );
  const REQUIRES_ENTITY_CATEGORIES: RibbonCategoryKey[] = ['HOME', 'FINANCIAL STATEMENTS', 'BIR COMPUTATIONS'];

  // Theming colors matching the uploaded reference header image
  const menuBarBg = isDark
    ? 'bg-[#060D1F] border-b border-[#14264F] text-cyan-200'
    : 'bg-[#ebf5ff] border-b border-sky-200/80 text-slate-800';

  const menuTabActive = isDark
    ? 'text-cyan-300 bg-[#0C1938] font-mono font-black border-b-2 border-b-cyan-400 shadow-[0_2px_10px_rgba(6,182,212,0.3)]'
    : 'text-slate-950 bg-white font-black border-b-2 border-b-[#00a8ff] shadow-2xs';

  const menuTabInactive = isDark
    ? 'text-blue-300/70 hover:text-cyan-200 hover:bg-[#0A1633] font-mono font-semibold'
    : 'text-slate-700 hover:text-slate-950 hover:bg-sky-100/60 font-semibold';

  const ribbonBodyBg = isDark
    ? 'bg-[#081226] border-b border-[#14264F] text-cyan-100'
    : 'bg-white border-b border-sky-200/80 text-slate-800';

  const dividerBorder = isDark
    ? 'border-[#14264F]'
    : 'border-sky-200/80';

  const groupLabelColor = isDark
    ? 'text-cyan-400/80 font-mono font-semibold'
    : 'text-[#0284c7] font-semibold';

  // Helper for ribbon button styling (matches exact image: active = light blue rounded square with sky border, inactive = clean transparent square)
  const getToolBtnStyle = (isActive: boolean = false) => {
    if (isActive) {
      return isDark
        ? 'bg-[#0D1E45] text-cyan-300 border border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
        : 'bg-[#e0f2fe] text-[#0369a1] border border-sky-300/90 font-semibold shadow-2xs';
    }
    return isDark
      ? 'hover:bg-[#0D1B3B] text-blue-200/80 hover:text-cyan-300 border border-transparent font-mono'
      : 'hover:bg-sky-50/80 text-slate-700 hover:text-[#0369a1] border border-transparent';
  };

  return (
    <div className="select-none transition-colors duration-200 font-sans">
      
      {/* 1. TOP MENU TABS BAR (MATCHING REFERENCE IMAGE: Home, Directory, Books of Accounts, Other Transactions, Financial Statements, BIR Computations) */}
      <div className={`flex items-center justify-between px-3 pt-1 transition-colors duration-200 ${menuBarBg}`}>
        
        {/* LEFT SIDE: MAIN CATEGORY TABS */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {RIBBON_CATEGORIES.map((cat) => {
                  const isCategoryActive = selectedCategory === cat.key;
                  const containsCurrentTab = cat.subTabs.some(st => st.key === activeTab);
                  const CatIcon = cat.icon || Layers;

                  const tabClass = isCategoryActive ? menuTabActive : menuTabInactive;

                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setIsToolsCollapsed(false);
                        if (setIsSettingsCategoryOpen) setIsSettingsCategoryOpen(false);
                        if (!cat.subTabs.some(st => st.key === activeTab)) {
                          onSelectTab(cat.subTabs[0].key);
                        }
                      }}
                className={`px-3.5 py-1.5 text-xs tracking-tight transition-all duration-150 relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 rounded-t-lg ${tabClass}`}
              >
                <CatIcon className={`w-3.5 h-3.5 ${isCategoryActive ? (isDark ? 'text-cyan-300' : 'text-slate-900') : 'opacity-70'}`} />
                <span>{cat.label}</span>
                {containsCurrentTab && !isCategoryActive && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isDark ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-[#00a8ff]'
                  }`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT SIDE: +REGISTER ENTITY PROFILE BUTTON + COLLAPSE / EXPAND TOOLS ARROW BUTTON */}
        <div className="flex items-center flex-shrink-0 gap-2 pb-1 pl-2">
          {/* REGISTER ENTITY PROFILE */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNewEntryModal) {
                onOpenNewEntryModal();
              } else if (onSelectTab) {
                onSelectTab('companies');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-md shadow-xs transition cursor-pointer whitespace-nowrap"
            title="Register Entity Profile"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Register Entity Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsToolsCollapsed(prev => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              isDark
                ? 'text-cyan-300 hover:bg-white/10 border border-cyan-500/30 bg-[#0C1938]/80'
                : 'text-[#0369a1] hover:bg-sky-200/70 border border-sky-200 bg-white/80 shadow-2xs'
            }`}
            title={isToolsCollapsed ? 'Expand Ribbon Tools' : 'Collapse Ribbon Tools'}
          >
            {isToolsCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. 2OS GROUPED RIBBON TOOLBAR (COLLAPSIBLE) */}
      {!isToolsCollapsed && (
      <div className={`w-full px-3 py-2 flex items-stretch overflow-hidden transition-colors duration-200 ${ribbonBodyBg}`}>
        
        {/* ========================================================= */}
        {/* VIEW A: IF SETTINGS TAB IS ACTIVE                         */}
        {/* ========================================================= */}
        {selectedCategory === 'SETTINGS' ? (
          <div className="flex-1 min-w-0 overflow-x-auto flex items-stretch gap-3 scrollbar-thin pr-3">
            {/* SETTINGS GROUP 1: THEMES */}
            <div className={`flex flex-col justify-between pr-3 border-r ${dividerBorder} flex-shrink-0`}>
              <div className="flex items-center gap-1.5">
                
                {/* Trial layout Theme */}
                <button
                  onClick={() => {
                    setThemeMode('trial_layout');
                    triggerAlert('Theme set to: Default Light Layout', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[70px] text-center ${getToolBtnStyle(themeMode === 'trial_layout')}`}
                  title="Default Light Layout"
                >
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#00a8ff]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#7c3aed]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                  </div>
                  <span className="text-[9px] leading-tight font-bold">Default Light</span>
                </button>

                {/* Neon Light Theme */}
                <button
                  onClick={() => {
                    setThemeMode('neon_light');
                    triggerAlert('Theme set to: Neon Light (Light Blue Neon Chromatic)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[70px] text-center ${getToolBtnStyle(themeMode === 'neon_light')}`}
                  title="Neon Light: Light Blue Neon Chromatic"
                >
                  <Sparkles className="w-4 h-4 text-cyan-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-bold">Neon Light</span>
                </button>

                {/* Clean White Theme */}
                <button
                  onClick={() => {
                    setThemeMode('clean');
                    triggerAlert('Theme set to: Clean White (Black-White-Violet-Blue)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[70px] text-center ${getToolBtnStyle(themeMode === 'clean')}`}
                  title="Clean White: Black-White-Violet-Blue"
                >
                  <Palette className="w-4 h-4 text-violet-600 mb-0.5" />
                  <span className="text-[9px] leading-tight font-bold">Clean White</span>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => {
                    setThemeMode('dark');
                    triggerAlert('Theme set to: Hacker Dark Blue (Blue Neon & Chromatic Logo)', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[70px] text-center ${getToolBtnStyle(themeMode === 'dark')}`}
                  title="Dark Mode: Hacker Dark Blue (Blue Neon & Chromatic Logo)"
                >
                  <Moon className="w-4 h-4 text-cyan-400 mb-0.5" />
                  <span className="text-[9px] leading-tight font-bold">Dark Hacker</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
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
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[64px] text-center ${getToolBtnStyle(activeTab === 'system_specs')}`}
                  title="View About 2OS Application & System Specs"
                >
                  <Info className="w-4 h-4 text-blue-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">About 2OS</span>
                </button>

                {/* Tax Calendar */}
                <button
                  onClick={() => {
                    onSelectTab('tax_calendar');
                    triggerAlert('Navigated to BIR Tax Calendar', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[64px] text-center ${getToolBtnStyle(activeTab === 'tax_calendar')}`}
                  title="View BIR Philippine Tax Calendar & Deadlines"
                >
                  <Calendar className="w-4 h-4 text-amber-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">Tax Calendar</span>
                </button>

                {/* Chart of Accounts */}
                <button
                  onClick={() => {
                    onSelectTab('account_titles');
                    triggerAlert('Navigated to Master Chart of Accounts', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[64px] text-center ${getToolBtnStyle(activeTab === 'account_titles')}`}
                  title="View Master Account Titles & Balances"
                >
                  <BookMarked className="w-4 h-4 text-teal-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">Chart of Accts</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
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
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[66px] text-center ${
                    isDark
                      ? 'bg-[#0D1E45] hover:bg-[#142A5C] text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold shadow-2xs'
                  }`}
                  title="Open Complete Audit Trail, Edit History & Visual Diff Preview"
                >
                  <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-0.5" />
                  <span className="text-[9px] leading-tight font-black">Audit Log</span>
                </button>

                {/* Validation Controls */}
                <div className="flex flex-col justify-center gap-1.5 px-2 py-0.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
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

                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
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
                <span className={`text-[9px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
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
                    if (onOpenExportModal) {
                      onOpenExportModal();
                    } else {
                      onExportAllSheets();
                      triggerAlert('Exporting full multi-sheet 2OS accounting workbook (.xlsx)...', 'success');
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[60px] text-center ${getToolBtnStyle()}`}
                  title="Export Data (Select dataset, CSV, Excel, or SQL)"
                >
                  <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">Export</span>
                </button>

                {/* Print View */}
                <button
                  onClick={() => window.print()}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[54px] text-center ${getToolBtnStyle()}`}
                  title="Print Current Sheet"
                >
                  <Printer className="w-4 h-4 text-violet-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">Print</span>
                </button>

                {/* Import Data */}
                <button
                  onClick={() => {
                    if (onOpenImportModal) {
                      onOpenImportModal();
                    } else {
                      triggerAlert('Import data dialog: Select CSV file to restore records', 'info');
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[54px] text-center ${getToolBtnStyle()}`}
                  title="Import Data from CSV / Template"
                >
                  <Upload className="w-4 h-4 text-blue-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium">Import</span>
                </button>

                {/* 2OS Architecture & Specs */}
                <button
                  onClick={() => onSelectTab('system_specs')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer min-w-[62px] text-center ${getToolBtnStyle(activeTab === 'system_specs')}`}
                  title="View 2OS Accounting System Architecture, Principles & Specs"
                >
                  <Info className="w-4 h-4 text-indigo-500 mb-0.5" />
                  <span className="text-[9px] leading-tight font-medium whitespace-pre-line">System{"\n"}Specs</span>
                </button>

              </div>

              <div className="text-center mt-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
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
            {/* GROUP 1: CATEGORY MODULES & BOOKS */}
            <div className="flex flex-col justify-between flex-shrink-0 h-full py-0.5">
              <div className="flex items-center gap-2">
                {currentCategory.subTabs.map((subTab) => {
                  const isActive = activeTab === subTab.key;
                  const SubIcon = subTab.icon;

                  const toolStyle = getToolBtnStyle(isActive);

                  return (
                    <button
                      key={subTab.key}
                      onClick={() => {
                        onSelectTab(subTab.key);
                      }}
                      className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all cursor-pointer min-w-[68px] max-w-[130px] text-center h-[62px] ${toolStyle}`}
                      title={subTab.description}
                    >
                      <SubIcon className={`w-4 h-4 mb-1.5 flex-shrink-0 ${
                        isActive 
                          ? (isDark ? 'text-cyan-300 font-bold' : 'text-[#0369a1] font-bold') 
                          : (isDark ? 'text-zinc-400' : 'text-slate-600')
                      }`} />
                      <span className={`text-[9.5px] leading-[1.15] whitespace-pre-line text-center ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}>
                        {subTab.shortLabel || subTab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-left mt-1.5 pl-0.5">
                <span className={`text-[8.5px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                  {currentCategory.label} Tools
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
      )}

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
