import React, { useMemo } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { Sale, Expense, PPEAsset, PayrollRecord, SpecialEntry, Company } from '../types';
import { computeAccountingSummaries } from '../utils/accounting';

interface ChangesInEquityTabProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  specialEntries?: SpecialEntry[];
  activeCompany: Company | null;
  theme: any;
}

export default function ChangesInEquityTab({
  sales,
  expenses,
  ppeAssets = [],
  payrollRecords = [],
  specialEntries = [],
  activeCompany,
  theme
}: ChangesInEquityTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';

  const eq = useMemo(() => {
    const s = computeAccountingSummaries({
      sales,
      collections: [],
      expenses,
      payments: [],
      ppeAssets,
      payrollRecords,
      specialEntries,
      companyName
    });

    const beginningCapital = 0;
    const capitalContributions = s.capitalStock;
    const ownerDrawings = s.ownerDrawings;
    const netIncome = s.netIncome;
    const endingEquity = s.totalEquity;

    return { beginningCapital, capitalContributions, netIncome, ownerDrawings, endingEquity };
  }, [sales, expenses, ppeAssets, payrollRecords, specialEntries, companyName]);

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          Statement of Changes in Equity
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Reconciliation of opening capital stock, owner contributions, cumulative retained earnings, and ending stockholders' equity for {companyName}.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-4 max-w-3xl mx-auto`}>
        <div className="flex justify-between text-xs py-2 border-b border-zinc-800/30 font-semibold">
          <span className={theme.textTitle}>Capital Stock / Paid-in Capital (Beginning)</span>
          <span className="font-mono">₱{eq.beginningCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-zinc-800/30 text-emerald-400 font-semibold">
          <span>Add: Owner Contributions (recorded via Special Entries)</span>
          <span className="font-mono">₱{eq.capitalContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-zinc-800/30 text-emerald-400 font-semibold">
          <span>Add: Net Income for the Period</span>
          <span className={`font-mono ${eq.netIncome < 0 ? 'text-rose-400' : ''}`}>₱{eq.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-zinc-800/30 text-rose-400 font-semibold">
          <span>Less: Owner's Withdrawals / Dividends Declared</span>
          <span className="font-mono">(₱{eq.ownerDrawings.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
        </div>
        <div className="flex justify-between text-sm font-bold p-4 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300">
          <span>STOCKHOLDERS' EQUITY (ENDING BALANCE)</span>
          <span className="font-mono text-base">₱{eq.endingEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        {eq.beginningCapital === 0 && eq.capitalContributions === 0 && (
          <div className="flex items-start gap-2 text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>No owner capital has been recorded yet. Record the owner's initial cash/asset contribution as a Special Entry (Debit: Cash 1010, Credit: Capital Stock 3010) to reflect actual paid-in capital here.</span>
          </div>
        )}
      </div>
    </div>
  );
}
