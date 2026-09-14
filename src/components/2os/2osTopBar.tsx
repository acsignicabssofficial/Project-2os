import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Server, 
  History
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
  onExportActiveSheet?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenConvertModal?: () => void;
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
  onOpenAuditTrail,
  triggerAlert,
  themeMode
}: TwoOSTopBarProps) {
  const [showCompanyMenu, setShowCompanyMenu] = useState<boolean>(false);

  const isDark = themeMode === 'dark';
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
        {/* 2. CENTER SECTION: SELECTED ENTITY + AUDIT TRAIL                          */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-cyan-400' : 'text-cyan-800'
          }`}>
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

          {/* GREEN OUTLINED INFINITYFREE BUTTON */}
          <button
            onClick={() => {
              if (onOpenInfinityFreeModal) onOpenInfinityFreeModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs ${
              isDark
                ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'border-emerald-500 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="InfinityFree & MySQL Cloud Database Connection"
          >
            <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>InfinityFree & MySQL</span>
          </button>

          {/* USER PROFILE: (AC) USER NAME \n acsiqnicabss.official */}
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
                isDark ? 'text-cyan-300' : 'text-cyan-600'
              }`}>
                acsiqnicabss.official
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
