import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Company } from '../types';
import { getEntityRegistrationYear, FsPeriodScope } from '../utils/taxProfiles';

interface FsPeriodBarProps {
  activeCompany: Company | null;
  year: number;
  monthIdx: number;
  scope: FsPeriodScope;
  onChange: (year: number, monthIdx: number, scope: FsPeriodScope) => void;
  theme?: any;
  cumulativeNote?: boolean; // true for Trial Balance / Balance Sheet ("as of")
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function FsPeriodBar({ activeCompany, year, monthIdx, scope, onChange, theme, cumulativeNote }: FsPeriodBarProps) {
  const regYear = getEntityRegistrationYear(activeCompany);
  const presentYear = new Date().getFullYear();
  const [typed, setTyped] = useState(String(year));
  const [error, setError] = useState('');

  useEffect(() => { setTyped(String(year)); setError(''); }, [year]);

  const apply = () => {
    const yr = parseInt(typed, 10);
    if (!/^\d{4}$/.test(typed.trim()) || isNaN(yr)) {
      setError('Enter a 4-digit year (YYYY).');
      setTyped(String(year));
      return;
    }
    if (regYear && yr < regYear) {
      setError(`Year must start at the year of registration (${regYear}).`);
      setTyped(String(year));
      return;
    }
    if (yr > presentYear + 1) {
      setError(`Year cannot be later than ${presentYear + 1}.`);
      setTyped(String(year));
      return;
    }
    setError('');
    onChange(yr, monthIdx, scope);
  };

  const scopeBtn = (s: FsPeriodScope, label: string) => (
    <button
      key={s}
      type="button"
      onClick={() => onChange(year, monthIdx, s)}
      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
        scope === s ? 'bg-cyan-500 text-slate-950' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`${theme?.bgCard || 'bg-zinc-900'} border ${theme?.borderCard || 'border-zinc-800'} rounded-2xl shadow-sm p-3 mb-4`}>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 font-bold text-white">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-400 font-medium">Year (YYYY):</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={typed}
            onChange={(e) => { setTyped(e.target.value.replace(/\D/g, '')); setError(''); }}
            onBlur={apply}
            onKeyDown={(e) => { if (e.key === 'Enter') apply(); }}
            aria-label="Type year YYYY"
            title={regYear ? `Books start ${regYear}` : 'Type a year'}
            className="w-14 bg-transparent text-cyan-400 font-bold text-center focus:outline-hidden border-b border-cyan-700"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-500/10 border border-zinc-700/30">
          {scopeBtn('year', 'Full Year')}
          {scopeBtn('quarter', 'Quarter')}
          {scopeBtn('month', 'Month')}
        </div>

        {scope !== 'year' && (
          <select
            value={monthIdx}
            onChange={(e) => onChange(year, parseInt(e.target.value, 10), scope)}
            aria-label="Select month"
            className="px-2 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-cyan-400 font-bold"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {scope === 'quarter' ? `Q${Math.floor(i / 3) + 1} – ${m}` : m}
              </option>
            ))}
          </select>
        )}

        <span className="text-zinc-400">
          {cumulativeNote ? 'As of end of ' : 'For '}
          <strong className="text-cyan-400">
            {scope === 'year' ? `Year ${year}` : scope === 'quarter' ? `Q${Math.floor(monthIdx / 3) + 1} ${year}` : `${MONTHS[monthIdx]} ${year}`}
          </strong>
          {regYear ? <span className="ml-2 text-zinc-500">(books start {regYear})</span> : null}
        </span>
      </div>
      {error && (
        <div className="mt-2 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
