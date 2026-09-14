import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  Check, 
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonthIdx: number;
  selectedYear: number;
  selectedPrefix: string;
  onApply: (monthIdx: number, year: number, prefix: string) => void;
  themeMode: 'neon_light' | 'clean' | 'dark';
}

const MONTHS = [
  { idx: 0, name: 'January', short: 'Jan', qtr: 'Q1' },
  { idx: 1, name: 'February', short: 'Feb', qtr: 'Q1' },
  { idx: 2, name: 'March', short: 'Mar', qtr: 'Q1' },
  { idx: 3, name: 'April', short: 'Apr', qtr: 'Q2' },
  { idx: 4, name: 'May', short: 'May', qtr: 'Q2' },
  { idx: 5, name: 'June', short: 'Jun', qtr: 'Q2' },
  { idx: 6, name: 'July', short: 'Jul', qtr: 'Q3' },
  { idx: 7, name: 'August', short: 'Aug', qtr: 'Q3' },
  { idx: 8, name: 'September', short: 'Sep', qtr: 'Q3' },
  { idx: 9, name: 'October', short: 'Oct', qtr: 'Q4' },
  { idx: 10, name: 'November', short: 'Nov', qtr: 'Q4' },
  { idx: 11, name: 'December', short: 'Dec', qtr: 'Q4' },
];

const PREFIX_OPTIONS = [
  { 
    id: 'FOR THE MONTH OF', 
    label: 'FOR THE MONTH OF', 
    desc: 'Monthly Registers (Sales, Purchases, Cash Receipts, Disbursements, 2550M, 0619-E)' 
  },
  { 
    id: 'AS OF', 
    label: 'AS OF', 
    desc: 'Balance Sheet, Statement of Financial Position, Trial Balance, Aging' 
  },
  { 
    id: 'FOR THE QUARTER ENDED', 
    label: 'FOR THE QUARTER ENDED', 
    desc: 'Quarterly FS (Q1, Q2, Q3, Q4), BIR 1702Q, BIR 1601-EQ QAP' 
  },
  { 
    id: 'FOR THE YEAR ENDED', 
    label: 'FOR THE YEAR ENDED', 
    desc: 'Annual Income Statement, Cash Flows, BIR 1702-RT, BIR 2316' 
  },
  { 
    id: 'FOR THE PERIOD ENDED', 
    label: 'FOR THE PERIOD ENDED', 
    desc: 'Special Audits, BIR Tax Investigations, Interim Financials' 
  },
];

const COMMON_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function PeriodModal({
  isOpen,
  onClose,
  selectedMonthIdx,
  selectedYear,
  selectedPrefix,
  onApply,
  themeMode
}: PeriodModalProps) {
  const [tempMonth, setTempMonth] = useState<number>(selectedMonthIdx);
  const [tempYear, setTempYear] = useState<number>(selectedYear);
  const [tempPrefix, setTempPrefix] = useState<string>(selectedPrefix || 'FOR THE MONTH OF');

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setTempMonth(selectedMonthIdx);
      setTempYear(selectedYear);
      setTempPrefix(selectedPrefix || 'FOR THE MONTH OF');
    }
  }, [isOpen, selectedMonthIdx, selectedYear, selectedPrefix]);

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';
  const isNeon = themeMode === 'neon_light';

  const modalBg = isNeon
    ? 'bg-white border-sky-300 text-slate-900 shadow-2xl'
    : themeMode === 'clean'
    ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
    : 'bg-[#0A1633] border-[#1C356F] text-cyan-100 shadow-2xl';

  const previewText = `${tempPrefix} ${MONTHS[tempMonth]?.name.toUpperCase()} ${tempYear}`;

  const handleSetCurrentDate = () => {
    const now = new Date();
    setTempMonth(now.getMonth());
    setTempYear(now.getFullYear());
    setTempPrefix('FOR THE MONTH OF');
  };

  const handleConfirm = () => {
    onApply(tempMonth, tempYear, tempPrefix);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-xl rounded-2xl border p-5 sm:p-6 transition-all shadow-2xl relative ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-700 dark:text-cyan-400 border border-sky-300 dark:border-cyan-800">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Select Reporting Period
              </h2>
              <p className="text-xs text-slate-500 dark:text-cyan-400">
                Configure Statement Period, Reporting Phrase, Month, and Fiscal Year
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. REPORTING PHRASE / PREFIX */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-600" />
            <span>Reporting Phrase / Statement Prefix</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PREFIX_OPTIONS.map((opt) => {
              const isSelected = tempPrefix === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTempPrefix(opt.id)}
                  className={`text-left p-2 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? (isNeon 
                          ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold shadow-xs'
                          : themeMode === 'clean'
                          ? 'bg-violet-50 border-violet-500 text-violet-950 font-bold'
                          : 'bg-[#0D214F] border-cyan-400 text-cyan-100 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]')
                      : 'border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-cyan-400/70 mt-0.5 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MONTH SELECTOR (12-MONTH GRID) */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 mb-1.5 block">
            Select Month
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected = tempMonth === m.idx;
              return (
                <button
                  key={m.idx}
                  type="button"
                  onClick={() => setTempMonth(m.idx)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition cursor-pointer text-center flex items-center justify-between ${
                    isSelected
                      ? (isNeon
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : themeMode === 'clean'
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]')
                      : 'border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {m.qtr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. YEAR SELECTOR */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 block">
              Fiscal / Calendar Year
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTempYear(prev => prev - 1)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                -1
              </button>
              <input 
                type="number"
                value={tempYear}
                onChange={(e) => setTempYear(parseInt(e.target.value) || 2026)}
                className="w-16 px-1.5 py-0.5 text-center text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => setTempYear(prev => prev + 1)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                +1
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {COMMON_YEARS.map((yr) => {
              const isSelected = tempYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setTempYear(yr)}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? (isNeon
                          ? 'bg-sky-100 text-sky-900 border-sky-400 shadow-xs'
                          : themeMode === 'clean'
                          ? 'bg-violet-100 text-violet-950 border-violet-400'
                          : 'bg-[#0E2352] text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]')
                      : 'border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. LIVE PREVIEW CARD */}
        <div className="mb-5 p-3 rounded-xl border border-sky-200 dark:border-cyan-800/60 bg-sky-50/70 dark:bg-cyan-950/30">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Document Header Preview:</span>
          </div>
          <div className="text-sm font-black tracking-wide uppercase text-slate-900 dark:text-white">
            {previewText}
          </div>
        </div>

        {/* 5. FOOTER BUTTONS */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={handleSetCurrentDate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-slate-600 dark:text-zinc-300 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Current Date</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-sm ${
                isNeon
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-300'
                  : themeMode === 'clean'
                  ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-300'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Period</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
