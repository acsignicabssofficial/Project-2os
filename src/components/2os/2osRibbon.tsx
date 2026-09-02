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

interface TwoOSRibbonProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  activeCompany: Company | null;
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onExportActiveSheet: () => void;
  onExportAllSheets: () => void;
  onOpenNewEntryModal?: () => void;
  theme: any;
  themeMode: 'neon_light' | 'clean' | 'dark';
  setThemeMode: (mode: 'neon_light' | 'clean' | 'dark') => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  customersCount?: number;
  providersCount?: number;
}

export default function TwoOSRibbon({
  activeTab,
  onSelectTab,
  activeCompany,
  companies,
  onSelectCompany,
  onExportActiveSheet,
  onExportAllSheets,
  onOpenNewEntryModal,
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

  // Sync category if activeTab changes externally (unless user explicitly viewing Settings tab)
  React.useEffect(() => {
    if (selectedCategory !== 'SETTINGS') {
      setSelectedCategory(getCategoryForTab(activeTab));
    }
  }, [activeTab]);

  const currentCategory = RIBBON_CATEGORIES.find(c => c.key === selectedCategory) || RIBBON_CATEGORIES[0];
  const activeTabInfo = getTabInfo(activeTab);

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

        {/* RIGHT SIDE: SETTINGS TAB (POSITIONED AT RIGHT EDGE) */}
        <div className="flex items-center flex-shrink-0 pl-2">
          <button
            onClick={() => {
              setSelectedCategory('SETTINGS');
            }}
            className={`px-3.5 py-1.5 text-xs tracking-tight transition-all duration-150 rounded-t-md cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'SETTINGS'
                ? settingsTabActive
                : settingsTabInactive
            }`}
            title="Open System Settings, Themes, About, Audit Log & Compliance"
          >
            <SettingsIcon className={`w-3.5 h-3.5 ${selectedCategory === 'SETTINGS' ? (isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400') : ''}`} />
            <span className="font-bold">Settings</span>
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
                    onSelectTab('about_app');
                    triggerAlert('Navigated to About 2OS Accounting System', 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[66px] text-center ${getToolBtnStyle(activeTab === 'about_app')}`}
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

        {/* ========================================================= */}
        {/* RIGHT SIDE FIXED: EXPORT & CONVERT (BELOW SETTINGS TAB)   */}
        {/* ========================================================= */}
        <div className="ml-auto flex items-stretch pl-3 border-l flex-shrink-0" style={{ borderColor: isNeon ? '#bae6fd' : themeMode === 'clean' ? '#e4e4e7' : '#14264F' }}>
          
          {/* EXPORT & REPORTING CONVERT GROUP (POSITIONED FIXED AT RIGHT BELOW SETTINGS) */}
          <div className="flex flex-col justify-between flex-shrink-0 h-full py-0.5">
            <div className="flex items-center gap-1">
              
              {/* Export Current Sheet (.xlsx) */}
              <button
                onClick={() => {
                  onExportActiveSheet();
                  triggerAlert(`Exported ${activeTabInfo.label} to 2OS spreadsheet`, 'success');
                }}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[58px] text-center h-[62px] ${getToolBtnStyle()}`}
                title="Export Current Sheet to .xlsx"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-1" />
                <span className="text-[10px] leading-tight font-medium whitespace-pre-line text-center">Export{"\n"}Sheet</span>
              </button>

              {/* Export Full Workbook (.xlsx) */}
              <button
                onClick={() => {
                  onExportAllSheets();
                  triggerAlert('Exporting full multi-sheet 2OS accounting workbook...', 'success');
                }}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[62px] text-center h-[62px] ${getToolBtnStyle()}`}
                title="Export Full 2OS Accounting Workbook (.xlsx)"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-cyan-400 mb-1" />
                <span className="text-[10px] leading-tight font-medium whitespace-pre-line text-center">Work-{"\n"}book</span>
              </button>

              {/* Print View */}
              <button
                onClick={() => window.print()}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[56px] text-center h-[62px] ${getToolBtnStyle()}`}
                title="Print Current View / Form"
              >
                <Printer className="w-4 h-4 text-violet-500 mb-1" />
                <span className="text-[10px] leading-tight font-medium">Print</span>
              </button>

              {/* Import Data */}
              <button
                onClick={() => triggerAlert('Import CSV/JSON data dialog ready: Select file to load', 'info')}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition cursor-pointer min-w-[56px] text-center h-[62px] ${getToolBtnStyle()}`}
                title="Import Data from CSV / 2OS Workbook"
              >
                <Upload className="w-4 h-4 text-rose-500 mb-1" />
                <span className="text-[10px] leading-tight font-medium">Import</span>
              </button>

            </div>

            <div className="text-center mt-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${groupLabelColor}`}>
                Export & Convert
              </span>
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

    </div>
  );
}
