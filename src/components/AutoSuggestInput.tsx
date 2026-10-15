import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Sparkles, Building2, User, Briefcase, ChevronRight } from 'lucide-react';

export interface AutoSuggestInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  items: T[];
  getItemLabel: (item: T) => string;
  getItemSublabel?: (item: T) => string | undefined;
  getItemBadge?: (item: T) => string | undefined;
  getSearchFields?: (item: T) => string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  theme?: any;
  categoryLabel?: 'Customer' | 'Provider' | 'Employee' | string;
  minQueryLength?: number;
  autoFocus?: boolean;
  onBlur?: () => void;
  name?: string;
  id?: string;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${cleanQ})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span key={i} className="font-black text-amber-400 bg-amber-500/25 px-0.5 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function AutoSuggestInput<T>({
  value,
  onChange,
  onSelect,
  items,
  getItemLabel,
  getItemSublabel,
  getItemBadge,
  getSearchFields,
  placeholder,
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  theme,
  categoryLabel = 'Party',
  minQueryLength = 1,
  autoFocus = false,
  onBlur,
  name,
  id
}: AutoSuggestInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter items based on substring query (matches anywhere in the name/fields: e.g. "AB" -> "ABC", "BAB", "DAB")
  const filteredSuggestions = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (q.length < minQueryLength) return [];

    return items.filter(item => {
      const primary = getItemLabel(item).toLowerCase();
      if (primary.includes(q)) return true;

      if (getSearchFields) {
        const extraFields = getSearchFields(item);
        if (extraFields.some(f => f && f.toLowerCase().includes(q))) return true;
      }

      if (getItemSublabel) {
        const sub = getItemSublabel(item);
        if (sub && sub.toLowerCase().includes(q)) return true;
      }

      return false;
    });
  }, [value, items, getItemLabel, getSearchFields, getItemSublabel, minQueryLength]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    setHighlightedIndex(-1);
    if (newVal.trim().length >= minQueryLength) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (item: T) => {
    const label = getItemLabel(item);
    onChange(label);
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.trim().length >= minQueryLength && filteredSuggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < filteredSuggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const isDark = !theme || !theme.isLight;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if ((value || '').trim().length >= minQueryLength && filteredSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          className={inputClassName}
        />
        {value.trim().length >= minQueryLength && (
          <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none text-zinc-400 text-[10px]">
            {filteredSuggestions.length > 0 ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                <Sparkles className="w-2.5 h-2.5" />
                {filteredSuggestions.length}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {isOpen && (value || '').trim().length >= minQueryLength && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
            isDark
              ? 'bg-[#18181b]/98 border-zinc-700/80 text-white shadow-black/80'
              : 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/80'
          }`}
          style={{ minWidth: 'max(100%, 320px)', maxWidth: '520px' }}
        >
          {/* Header count */}
          <div
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b flex items-center justify-between ${
              isDark ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {categoryLabel.toLowerCase().includes('employee') ? (
                <User className="w-3 h-3 text-cyan-400" />
              ) : categoryLabel.toLowerCase().includes('provider') || categoryLabel.toLowerCase().includes('vendor') ? (
                <Briefcase className="w-3 h-3 text-purple-400" />
              ) : (
                <Building2 className="w-3 h-3 text-emerald-400" />
              )}
              <span>
                Matching {categoryLabel}s ({filteredSuggestions.length})
              </span>
            </div>
            <span className="text-[9px] text-zinc-400 font-normal">Use ↑↓ keys + Enter</span>
          </div>

          {/* List of matched items */}
          {filteredSuggestions.length > 0 ? (
            <div ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-zinc-800/30">
              {filteredSuggestions.map((item, idx) => {
                const isSelected = idx === highlightedIndex;
                const label = getItemLabel(item);
                const sublabel = getItemSublabel ? getItemSublabel(item) : undefined;
                const badge = getItemBadge ? getItemBadge(item) : undefined;

                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(item);
                    }}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition flex items-center justify-between gap-2 group cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-600/20 text-white font-semibold'
                          : 'bg-blue-50 text-blue-900 font-semibold'
                        : isDark
                        ? 'hover:bg-zinc-800/60 text-zinc-200'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">
                          <HighlightMatch text={label} query={value} />
                        </span>
                        {badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      {sublabel && (
                        <div
                          className={`text-[10px] truncate mt-0.5 ${
                            isDark ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          <HighlightMatch text={sublabel} query={value} />
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isSelected ? 'opacity-100 text-blue-400' : 'text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-zinc-400">
              <p>
                No registered {categoryLabel.toLowerCase()} matching &quot;<span className="text-amber-400 font-semibold">{value}</span>&quot;
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                You may continue typing to record as a new {categoryLabel.toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
