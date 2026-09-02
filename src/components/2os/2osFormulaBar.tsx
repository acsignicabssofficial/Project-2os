import React from 'react';
import { 
  X, 
  Check, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { getTabInfo } from './2osTypes';

interface TwoOSFormulaBarProps {
  activeTab: string;
  globalSearch: string;
  onSearchChange: (val: string) => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  themeMode: 'neon_light' | 'clean' | 'dark';
}

export default function TwoOSFormulaBar({
  activeTab,
  globalSearch,
  onSearchChange,
  triggerAlert,
  themeMode
}: TwoOSFormulaBarProps) {
  const tabInfo = getTabInfo(activeTab);

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const containerBg = isNeon
    ? 'bg-[#edf6fc] border-b border-sky-200 text-slate-900'
    : themeMode === 'clean'
    ? 'bg-[#fafaff] border-b border-zinc-200 text-zinc-900'
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-100';

  const nameBoxClass = isNeon
    ? 'bg-white border border-sky-200 text-slate-800 font-mono font-bold'
    : themeMode === 'clean'
    ? 'bg-white border border-zinc-300 text-zinc-900 font-mono font-bold'
    : 'bg-[#091228] border border-[#182F63] text-cyan-300 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]';

  const formulaInputClass = isNeon
    ? 'bg-white border border-sky-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
    : themeMode === 'clean'
    ? 'bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
    : 'bg-[#091228] border border-[#182F63] text-cyan-100 placeholder:text-blue-300/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 text-xs select-none transition-colors duration-200 ${containerBg}`}>
      
      {/* 1. CELL NAME BOX (e.g. A1 / SALES!A1) */}
      <div className="flex items-center gap-1">
        <div 
          className={`px-2.5 py-1 text-center min-w-[54px] rounded text-xs tracking-tight ${nameBoxClass}`}
          title="Active Cell Reference"
        >
          A1
        </div>
      </div>

      {/* 2. FORMULA ACTION CONTROLS (CANCEL, ACCEPT, FX) */}
      <div className="flex items-center text-zinc-400 dark:text-zinc-500 gap-0.5">
        <button
          onClick={() => onSearchChange('')}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500 rounded cursor-pointer transition"
          title="Clear search / formula filter"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => triggerAlert(`PFRS Formula validated: ${tabInfo.formula}`, 'success')}
          className={`p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer transition ${
            isNeon ? 'hover:text-cyan-600' : themeMode === 'clean' ? 'hover:text-violet-600' : 'hover:text-cyan-400'
          }`}
          title="Confirm / Recompute Formula"
        >
          <Check className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-0.5" />

        <div 
          className="font-serif italic font-bold text-xs px-1.5 text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5"
          title="Formula Bar"
        >
          <span>fx</span>
        </div>
      </div>

      {/* 3. FORMULA BAR / SEARCH INPUT BOX */}
      <div className="flex-1 flex items-center relative">
        <input
          type="text"
          value={globalSearch ? globalSearch : tabInfo.formula}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Formula: ${tabInfo.formula} or filter data...`}
          className={`w-full px-3 py-1 rounded text-xs font-mono tracking-tight transition ${formulaInputClass}`}
        />
        {globalSearch && (
          <span className={`absolute right-2.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
            isNeon 
              ? 'text-cyan-800 bg-sky-100 border-sky-300' 
              : themeMode === 'clean' 
              ? 'text-violet-800 bg-violet-100 border-violet-300' 
              : 'text-cyan-300 bg-[#0C1E40] border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
          }`}>
            FILTER ACTIVE
          </span>
        )}
      </div>

    </div>
  );
}
