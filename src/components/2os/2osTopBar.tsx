import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Server, 
  Minus, 
  Square, 
  X,
  ChevronUp
} from 'lucide-react';
import { Company } from '../../types';

interface TwoOSTopBarProps {
  activeCompany: Company | null;
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  globalSearch?: string;
  onSearchChange?: (val: string) => void;
  onSave?: () => void;
  onExportAll?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenSettings?: () => void;
  activeTab?: string;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  theme: any;
  themeMode: 'neon_light' | 'clean' | 'dark';
  setThemeMode: (mode: 'neon_light' | 'clean' | 'dark') => void;
}

export default function TwoOSTopBar({
  activeCompany,
  companies,
  onSelectCompany,
  onOpenInfinityFreeModal,
  triggerAlert,
  themeMode
}: TwoOSTopBarProps) {
  const [showCompanyMenu, setShowCompanyMenu] = useState<boolean>(false);

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const topBarBg = isNeon
    ? 'bg-[#EBF5FF] border-b border-sky-200 text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white border-b border-zinc-200 text-zinc-900'
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-100';

  const selectBtnBg = isNeon
    ? 'bg-white border-sky-300 text-slate-900 hover:border-cyan-500 shadow-2xs'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-300 text-zinc-900 hover:border-violet-400 shadow-2xs'
    : 'bg-[#091228] border-[#182F63] text-cyan-200 hover:border-cyan-400';

  const dropdownBg = isNeon
    ? 'bg-white border-sky-200 shadow-xl text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-200 shadow-xl text-zinc-900'
    : 'bg-[#091228] border-[#1c356f] shadow-2xl text-cyan-100';

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
            <h1 className="font-black text-sm tracking-tight leading-tight uppercase text-slate-950 dark:text-white">
              2OS ACCOUNTING SYSTEM
            </h1>
            <span className="text-[11px] font-semibold tracking-normal block leading-tight text-cyan-600 dark:text-cyan-400">
              Philippine Tax & PFRS Books of Accounts
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER SECTION: SELECTED ENTITY: [ Select Entity v ]                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            SELECTED ENTITY:
          </span>

          <div className="relative">
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className={`flex items-center justify-between gap-2 px-3 py-1 rounded-md border text-xs font-bold transition cursor-pointer min-w-[140px] max-w-[220px] ${selectBtnBg}`}
              title="Switch Active Company / Taxpayer Entity"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <span className="truncate">
                  {activeCompany?.company_name || 'Select Entity'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
            </button>

            {/* ENTITY DROPDOWN */}
            {showCompanyMenu && (
              <div className={`absolute top-full mt-1 left-0 z-50 w-72 rounded-xl border p-1.5 shadow-2xl ${dropdownBg}`}>
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
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT SECTION: INFINITYFREE PILL + USER NAME + WINDOW CONTROLS         */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* GREEN OUTLINED INFINITYFREE BUTTON */}
          <button
            onClick={() => {
              if (onOpenInfinityFreeModal) onOpenInfinityFreeModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-500 bg-white dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
            title="InfinityFree & MySQL Cloud Database Connection"
          >
            <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>InfinityFree & MySQL</span>
          </button>

          {/* USER PROFILE: (AC) USER NAME \n acsiqnicabss.official */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-sky-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-sky-300 dark:border-cyan-800 flex-shrink-0">
              AC
            </div>
            <div className="text-left">
              <span className="font-black text-xs block leading-tight text-slate-950 dark:text-white uppercase">
                USER NAME
              </span>
              <span className="text-[10px] block leading-none text-cyan-600 dark:text-cyan-400">
                acsiqnicabss.official
              </span>
            </div>
          </div>

          {/* WINDOW CONTROLS (- [] X) */}
          <div className="flex items-center gap-2 pl-1 text-slate-500 dark:text-slate-400">
            <button className="hover:text-slate-900 dark:hover:text-white transition p-0.5 cursor-pointer" title="Minimize">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="hover:text-slate-900 dark:hover:text-white transition p-0.5 cursor-pointer" title="Maximize">
              <Square className="w-3 h-3" />
            </button>
            <button className="hover:text-rose-600 transition p-0.5 cursor-pointer" title="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FAR RIGHT COLLAPSE / CARET TOGGLE */}
          <button 
            className="w-5 h-5 rounded bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer"
            title="Collapse / Expand Ribbon"
          >
            <ChevronUp className="w-3 h-3" />
          </button>

        </div>

      </div>
    </header>
  );
}
