import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  ShieldCheck, 
  LayoutGrid, 
  Columns3, 
  FileText,
  Building2,
  GitBranch,
  Layers,
  Sparkles
} from 'lucide-react';
import { Company, CompanyBranch } from '../../types';
import { RIBBON_CATEGORIES, getCategoryForTab } from './2osTypes';

interface TwoOSSheetBarProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  recordCount?: number;
  activeCompany: Company | null;
  activeBranchCode: string; // 'ALL' (Consolidated), '00000' (Main/Head Office), or branch_code
  onSelectBranch: (branchCode: string) => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  themeMode?: 'neon_light' | 'clean' | 'dark';
}

export default function TwoOSSheetBar({
  activeTab,
  onSelectTab,
  zoomLevel,
  setZoomLevel,
  recordCount,
  activeCompany,
  activeBranchCode,
  onSelectBranch,
  triggerAlert,
  themeMode = 'neon_light'
}: TwoOSSheetBarProps) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const sheetBarBg = isNeon
    ? 'bg-[#edf6fc]/95 border-t border-sky-200 text-slate-800 backdrop-blur-xs'
    : themeMode === 'clean'
    ? 'bg-[#fafaff] border-t border-zinc-200 text-zinc-800'
    : 'bg-[#060D1F] border-t border-[#14264F] text-cyan-200';

  const statusBarBg = isNeon
    ? 'bg-sky-700 text-white'
    : themeMode === 'clean'
    ? 'bg-zinc-950 text-white border-t border-violet-950'
    : 'bg-[#040914] text-cyan-300 border-t border-[#0F1E3D] font-mono';

  // Build the list of branch sheet tabs for the active company
  // Options: 
  // 1. Consolidated (Combined All Branches & Main)
  // 2. Head Office / Main (00000)
  // 3. Registered Branches (Branch 1, Branch 2, etc.)
  const companyBranches: CompanyBranch[] = (activeCompany?.branches && activeCompany.branches.length > 0)
    ? activeCompany.branches
    : [
        { id: 'main', branch_name: 'Head Office (Main)', branch_code: '00000', address: '', is_head_office: true }
      ];

  // Head office code
  const headOfficeBranch = companyBranches.find(b => b.is_head_office || b.branch_code === '00000') || companyBranches[0];
  const otherBranches = companyBranches.filter(b => b !== headOfficeBranch);

  const sheetTabs = [
    {
      code: 'ALL',
      label: 'Consolidated (All Branches)',
      shortLabel: 'Consolidated',
      icon: Layers,
      description: 'View consolidated books and reports aggregated across all branches and head office',
      badge: 'Aggregated'
    },
    {
      code: headOfficeBranch ? headOfficeBranch.branch_code : '00000',
      label: headOfficeBranch ? `${headOfficeBranch.branch_name} (${headOfficeBranch.branch_code})` : 'Main / Head Office (00000)',
      shortLabel: headOfficeBranch ? headOfficeBranch.branch_name.replace(/\(Main\)/i, '').trim() || 'Main' : 'Main',
      icon: Building2,
      description: `Head Office / Main Books (${headOfficeBranch?.rdo_code ? `RDO ${headOfficeBranch.rdo_code}` : 'Code 00000'})`,
      badge: 'Main'
    },
    ...otherBranches.map((br, idx) => ({
      code: br.branch_code,
      label: `${br.branch_name} (${br.branch_code})`,
      shortLabel: br.branch_name || `Branch ${idx + 1}`,
      icon: GitBranch,
      description: `${br.branch_name} - TIN Branch Code ${br.branch_code} ${br.rdo_code ? `• RDO ${br.rdo_code}` : ''}`,
      badge: `Br. ${br.branch_code}`
    }))
  ];

  return (
    <footer className={`sticky bottom-0 z-30 select-none text-xs shadow-lg transition-colors duration-200 ${sheetBarBg}`}>
      
      {/* 1. SPREADSHEET SHEET TABS ROW (ENTITIES / BRANCHES: CONSOLIDATED, MAIN, BRANCH 1, BRANCH 2...) */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-black/5 dark:border-white/5 gap-2">
        
        {/* LEFT: Scroll Controls & Branch Sheet Tabs */}
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          
          {/* Scroll Arrows */}
          <div className="flex items-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
            <button 
              onClick={scrollLeft}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition cursor-pointer"
              title="Scroll sheet tabs left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={scrollRight}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition cursor-pointer"
              title="Scroll sheet tabs right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Label indicator for Branch / Entity Sheet Tabs */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-black/5 dark:bg-white/5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex-shrink-0">
            <GitBranch className={`w-3 h-3 ${isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'}`} />
            <span>SHEETS:</span>
          </div>

          {/* Dynamic Branch Sheet Tabs */}
          <div 
            ref={tabsScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1 flex-1"
          >
            {sheetTabs.map((tab) => {
              const isActive = activeBranchCode === tab.code;
              const Icon = tab.icon;

              const activeTabClass = isNeon
                ? 'bg-sky-600 text-white font-bold shadow-xs border border-cyan-500'
                : themeMode === 'clean'
                ? 'bg-zinc-900 text-white font-bold shadow-xs border border-violet-600'
                : 'bg-[#0D214D] text-cyan-300 font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] border border-cyan-400';

              const inactiveTabClass = isNeon
                ? 'bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-950 border border-sky-200 font-semibold shadow-2xs'
                : themeMode === 'clean'
                ? 'bg-white hover:bg-violet-50/50 text-zinc-800 hover:text-violet-950 border border-zinc-200 font-semibold shadow-2xs'
                : 'bg-[#081226] hover:bg-[#0D1E45] text-blue-200 hover:text-cyan-200 border border-[#14264F] font-mono font-semibold shadow-2xs';

              return (
                <button
                  key={tab.code}
                  onClick={() => {
                    onSelectBranch(tab.code);
                    triggerAlert(`Switched books view to: ${tab.label}`, 'info');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-150 flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive ? activeTabClass : inactiveTabClass
                  }`}
                  title={tab.description}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
                  <span>{tab.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : (isNeon ? 'bg-slate-100 text-slate-600' : 'bg-black/20 text-zinc-400')
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* RIGHT: Quick switch to add/manage branches or view active company */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onSelectTab('companies')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              isNeon
                ? 'bg-sky-100 text-sky-900 hover:bg-sky-200 border border-sky-300'
                : themeMode === 'clean'
                ? 'bg-violet-100 text-violet-950 hover:bg-violet-200 border border-violet-300'
                : 'bg-[#0D214D] hover:bg-[#142A5C] text-cyan-300 border border-cyan-500/40'
            }`}
            title="Manage Company Profiles & Branches"
          >
            <Building2 className="w-3 h-3" />
            <span>Manage Branches</span>
          </button>
        </div>

      </div>

      {/* 2. SPREADSHEET BOTTOM STATUS BAR (Ready, Entity Name, Active Branch, Zoom Slider) */}
      <div className={`px-3.5 py-1 flex items-center justify-between text-[11px] gap-3 transition-colors duration-200 ${statusBarBg}`}>
        
        {/* Left: Status, Active Entity & Current Branch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isNeon ? 'bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : themeMode === 'clean' ? 'bg-violet-400' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]'}`}></span>
            <span className="tracking-wide">Ready</span>
          </div>

          <span className="opacity-40">|</span>

          <div className="hidden sm:flex items-center gap-1 font-medium opacity-90">
            <ShieldCheck className={`w-3 h-3 ${isNeon ? 'text-cyan-200' : themeMode === 'clean' ? 'text-violet-300' : 'text-cyan-300'}`} />
            <span>PFRS & BIR Compliant</span>
          </div>

          {activeCompany && (
            <>
              <span className="opacity-40 hidden md:inline">|</span>
              <span className="hidden md:inline truncate max-w-[220px] font-semibold opacity-90">
                {activeCompany.company_name}
              </span>
            </>
          )}

          <span className="opacity-40 hidden lg:inline">|</span>
          <span className="hidden lg:inline font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded opacity-90">
            Branch: {activeBranchCode === 'ALL' ? 'Consolidated' : activeBranchCode}
          </span>

          {recordCount !== undefined && (
            <>
              <span className="opacity-40 hidden lg:inline">|</span>
              <span className="hidden lg:inline opacity-90">{recordCount} records loaded</span>
            </>
          )}
        </div>

        {/* Right: Layout Views & Zoom Slider */}
        <div className="flex items-center gap-3">
          
          {/* View Mode Icons */}
          <div className="hidden sm:flex items-center gap-1 opacity-70">
            <button className="p-0.5 hover:opacity-100 cursor-pointer" title="Normal View">
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button className="p-0.5 hover:opacity-100 cursor-pointer" title="Page Layout">
              <Columns3 className="w-3 h-3" />
            </button>
            <button className="p-0.5 hover:opacity-100 cursor-pointer" title="Page Break Preview">
              <FileText className="w-3 h-3" />
            </button>
          </div>

          <span className="opacity-40 hidden sm:inline">|</span>

          {/* Interactive Zoom Slider & Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 5))}
              className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
              title="Zoom out (-5%)"
            >
              <Minus className="w-3 h-3" />
            </button>
            
            <input 
              type="range" 
              min="75" 
              max="125" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className={`w-16 sm:w-20 h-1 bg-white/25 rounded-lg appearance-none cursor-pointer ${isNeon ? 'accent-cyan-300' : themeMode === 'clean' ? 'accent-violet-400' : 'accent-cyan-400'}`}
              title={`Zoom Scale: ${zoomLevel}%`}
            />

            <button 
              onClick={() => setZoomLevel(Math.min(125, zoomLevel + 5))}
              className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
              title="Zoom in (+5%)"
            >
              <Plus className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => setZoomLevel(100)}
              className="font-mono text-[10px] w-9 text-right font-bold hover:underline cursor-pointer"
              title="Click to reset to 100%"
            >
              {zoomLevel}%
            </button>
          </div>

        </div>

      </div>

    </footer>
  );
}
