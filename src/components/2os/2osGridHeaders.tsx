import React from 'react';

interface TwoOSGridHeadersProps {
  themeMode: 'neon_light' | 'clean' | 'dark';
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export default function TwoOSGridHeaders({ themeMode }: TwoOSGridHeadersProps) {
  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const containerBg = isNeon
    ? 'bg-[#edf6fc] border-b border-sky-200 text-sky-800'
    : themeMode === 'clean'
    ? 'bg-[#fafaff] border-b border-zinc-200 text-zinc-700'
    : 'bg-[#060D1F] border-b border-[#14264F] text-cyan-300/80';

  const cellBorder = isNeon
    ? 'border-r border-sky-200'
    : themeMode === 'clean'
    ? 'border-r border-zinc-200'
    : 'border-r border-[#14264F]';

  return (
    <div className={`flex items-center text-[10px] font-mono select-none overflow-x-hidden transition-colors duration-200 ${containerBg}`}>
      {/* Corner Select All Box */}
      <div className={`w-9 h-5 flex items-center justify-center flex-shrink-0 border-r border-black/10 dark:border-white/10 ${
        isNeon ? 'bg-sky-100' : themeMode === 'clean' ? 'bg-zinc-100' : 'bg-[#091228]'
      }`}>
        <span className="w-1.5 h-1.5 border-r border-b border-cyan-400 opacity-60"></span>
      </div>

      {/* Columns Strip */}
      <div className="flex items-center flex-1 overflow-x-hidden">
        {COLUMNS.map((col, idx) => (
          <div
            key={col}
            className={`h-5 min-w-[58px] flex-1 flex items-center justify-center font-semibold tracking-wider ${cellBorder} ${
              idx === 0 ? (
                isNeon 
                  ? 'bg-sky-200/80 text-sky-950 font-bold' 
                  : themeMode === 'clean' 
                  ? 'bg-violet-100 text-violet-950 font-bold' 
                  : 'bg-[#0D1E45] text-cyan-300 font-bold'
              ) : ''
            }`}
          >
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}
