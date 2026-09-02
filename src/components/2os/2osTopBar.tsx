import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  User, 
  Minus, 
  Square, 
  X, 
  Palette, 
  Sparkles, 
  Save, 
  RotateCcw, 
  RotateCw, 
  Check,
  Server,
  Database
} from 'lucide-react';
import { Company } from '../../types';

interface TwoOSTopBarProps {
  activeCompany: Company | null;
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  globalSearch: string;
  onSearchChange: (val: string) => void;
  onSave: () => void;
  onExportAll: () => void;
  onOpenInfinityFreeModal?: () => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  theme: any;
  themeMode: 'neon_light' | 'clean' | 'dark';
  setThemeMode: (mode: 'neon_light' | 'clean' | 'dark') => void;
}

export default function TwoOSTopBar({
  activeCompany,
  companies,
  onSelectCompany,
  globalSearch,
  onSearchChange,
  onSave,
  onExportAll,
  onOpenInfinityFreeModal,
  triggerAlert,
  theme,
  themeMode,
  setThemeMode
}: TwoOSTopBarProps) {
  const [showCompanyMenu, setShowCompanyMenu] = useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  // Container styling
  const topBarBg = isNeon
    ? 'bg-[#edf6fc] border-b border-sky-200 text-slate-900'
    : themeMode === 'clean'
    ? 'bg-[#fafaff] border-b border-zinc-200 text-zinc-900'
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-100';

  const entityBoxBg = isNeon
    ? 'bg-white border-sky-200 text-slate-900 hover:border-cyan-400 shadow-2xs'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-300 text-zinc-900 hover:border-violet-400 shadow-2xs'
    : 'bg-[#091228] border-[#182F63] text-cyan-200 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]';

  const dropdownBg = isNeon
    ? 'bg-white border-sky-200 shadow-xl text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-200 shadow-xl text-zinc-900'
    : 'bg-[#091228] border-[#1c356f] shadow-2xl text-cyan-100';

  return (
    <header className={`${topBarBg} select-none transition-colors duration-200`}>
      {/* 1. TOP WINDOW BAR: 2OS ACCOUNTING SYSTEM | SELECTED ENTITY | USER NAME & THEMES */}
      <div className="flex items-center justify-between px-4 py-2 gap-3 text-xs">
        
        {/* LEFT: 2OS ACCOUNTING SYSTEM LOGO & TITLE */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm tracking-tighter transition-all ${
              isNeon 
                ? 'logo-chromatic-light text-white font-black' 
                : themeMode === 'clean' 
                ? 'logo-chromatic-clean text-white font-black' 
                : 'logo-chromatic text-white font-black'
            }`}>
              2OS
            </div>
            <div>
              <h1 className={`font-black text-sm tracking-tight leading-none uppercase ${
                isNeon
                  ? 'text-slate-950 font-black'
                  : themeMode === 'clean'
                  ? 'text-zinc-950 font-black'
                  : 'neon-text-cyan font-mono font-black'
              }`}>
                2OS Accounting System
              </h1>
              <span className={`text-[10px] font-semibold tracking-normal ${
                isNeon 
                  ? 'text-sky-700' 
                  : themeMode === 'clean' 
                  ? 'text-violet-900/70' 
                  : 'text-blue-300/80 font-mono'
              }`}>
                Philippine Tax & PFRS Books of Accounts
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: SELECTED ENTITY SELECTOR */}
        <div className="relative flex items-center gap-2 flex-1 max-w-md justify-center">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider hidden sm:inline ${
              isNeon ? 'text-sky-700/70' : themeMode === 'clean' ? 'text-zinc-400' : 'text-cyan-400/70 font-mono'
            }`}>
              SELECTED ENTITY:
            </span>

            {/* Dropdown Pill for Company */}
            <div className="relative">
              <button
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${entityBoxBg}`}
                title="Switch Active Company / Taxpayer"
              >
                <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400'
                }`} />
                <span className="truncate max-w-[200px] md:max-w-[260px]">
                  {activeCompany?.company_name || 'Select Entity'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {/* Company Picker Dropdown */}
              {showCompanyMenu && (
                <div className={`absolute top-full mt-1 left-0 z-50 w-72 rounded-xl border p-1.5 ${dropdownBg}`}>
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 ${
                    isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-zinc-400' : 'text-cyan-400 font-mono'
                  }`}>
                    Registered Tax Entities ({companies.length})
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
                              ? (isNeon 
                                  ? 'bg-sky-100 text-sky-950 font-bold' 
                                  : themeMode === 'clean' 
                                  ? 'bg-violet-50 text-violet-950 font-bold' 
                                  : 'bg-cyan-950/80 text-cyan-300 font-mono font-bold border border-cyan-500/40')
                              : (isNeon 
                                  ? 'hover:bg-sky-50 text-slate-700' 
                                  : themeMode === 'clean' 
                                  ? 'hover:bg-zinc-100 text-zinc-700' 
                                  : 'hover:bg-[#0f1d3d] text-blue-200')
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold truncate">{comp.company_name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">TIN: {comp.company_tin || 'N/A'}</div>
                          </div>
                          {isSelected && <Check className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'
                          }`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: INFINITYFREE DEPLOYMENT & USER NAME & WINDOW CONTROLS */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* INFINITYFREE & CLOUD DB BUTTON */}
          {onOpenInfinityFreeModal && (
            <button
              onClick={onOpenInfinityFreeModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isNeon
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : themeMode === 'clean'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-[0_0_10px_rgba(16,185,129,0.25)] font-mono'
              }`}
              title="Open InfinityFree Web Host & MySQL Deployment Center"
            >
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">InfinityFree & MySQL</span>
            </button>
          )}

          {/* USER NAME BADGE */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              isNeon 
                ? 'bg-sky-100 text-cyan-800 border border-sky-300 font-bold' 
                : themeMode === 'clean' 
                ? 'bg-violet-100 text-violet-950 border border-violet-300 font-bold' 
                : 'bg-[#0b1736] text-cyan-300 border border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
            }`}>
              AC
            </div>
            <div className="hidden lg:block text-left">
              <span className={`font-black text-xs block leading-tight ${
                themeMode === 'dark' ? 'neon-text-blue font-mono' : ''
              }`}>USER NAME</span>
              <span className={`text-[10px] block leading-none truncate max-w-[140px] ${
                isNeon ? 'text-sky-700' : themeMode === 'clean' ? 'text-zinc-500' : 'text-blue-300 font-mono'
              }`}>
                acsignicabss.official
              </span>
            </div>
          </div>

          {/* WINDOW CONTROL BUTTONS: MINIMIZE, MAXIMIZE, CLOSE */}
          <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-400 pl-1 border-l border-black/10 dark:border-white/10">
            <button
              onClick={() => triggerAlert('Application minimized to taskbar', 'info')}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer transition"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  triggerAlert('Fullscreen window mode active', 'info');
                } else {
                  document.exitFullscreen().catch(() => {});
                  triggerAlert('Exited fullscreen', 'info');
                }
              }}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer transition"
              title="Maximize / Fullscreen"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => triggerAlert('2OS Workspace locked securely', 'info')}
              className="p-1 hover:bg-red-500 hover:text-white rounded cursor-pointer transition"
              title="Close Workspace"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
