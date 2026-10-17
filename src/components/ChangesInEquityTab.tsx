import React, { useMemo } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { Sale, Expense, PPEAsset, PayrollRecord, SpecialEntry, Company } from '../types';
import { computeAccountingSummaries } from '../utils/accounting';
import { getRecordDate } from '../utils/taxProfiles';

interface ChangesInEquityTabProps {
  /** Records must be CUMULATIVE up to the period end; the tab splits opening vs. movements using periodStart */
  sales: Sale[];
  expenses: Expense[];
  collections?: any[];
  payments?: any[];
  cashReceipts?: any[];
  cashDisbursements?: any[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  specialEntries?: SpecialEntry[];
  /** First day (YYYY-MM-DD) of the reporting period. Everything dated before it forms the opening balance. */
  periodStart?: string;
  periodEnd?: string;
  activeCompany: Company | null;
  theme: any;
}

const fmt = (n: number) => `₱${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));

export default function ChangesInEquityTab({
  sales,
  expenses,
  collections = [],
  payments = [],
  cashReceipts = [],
  cashDisbursements = [],
  ppeAssets = [],
  payrollRecords = [],
  specialEntries = [],
  periodStart,
  periodEnd,
  activeCompany,
  theme
}: ChangesInEquityTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';

  const eq = useMemo(() => {
    const before = <T,>(rows: T[]): T[] =>
      periodStart ? rows.filter(r => { const d = getRecordDate(r); return !!d && d < periodStart; }) : [];

    const summarize = (pick: <T>(rows: T[]) => T[]) =>
      computeAccountingSummaries({
        sales: pick(sales),
        collections: pick(collections),
        expenses: pick(expenses),
        payments: pick(payments),
        cashReceipts: pick(cashReceipts),
        cashDisbursements: pick(cashDisbursements),
        ppeAssets,
        payrollRecords: pick(payrollRecords),
        specialEntries: pick(specialEntries),
        companyName
      } as any);

    const open = summarize(before);
    const close = summarize(rows => rows);

    const re3020 = (x: typeof close) => x.accountMap['3020']?.netBalance || 0;
    const r2 = (n: number) => Math.round(n * 100) / 100;

    // Opening balances (closed prior years are rolled into opening Retained Earnings: prior profit + earlier prior-period adjustments)
    const openingCapital = open.capitalStock;
    const openingRE = open.retainedEarnings;
    const openingOCI = open.totalOCI;
    const openingEquity = open.totalEquity;

    // Movements during the period
    const contributions = r2((close.capitalStock + close.ownerDrawings) - (open.capitalStock + open.ownerDrawings));
    const drawings = r2(close.ownerDrawings - open.ownerDrawings);
    const netIncome = r2(close.netIncome - open.netIncome);
    // PAS 8: omitted transactions of CLOSED years are booked straight to Retained Earnings of the present year, never to P&L
    const priorPeriodAdjustment = r2(re3020(close) - re3020(open));
    const oci = r2(close.totalOCI - open.totalOCI);
    const endingEquity = close.totalEquity;
    const computedEnding = r2(openingEquity + contributions - drawings + netIncome + priorPeriodAdjustment + oci);

    return {
      openingCapital, openingRE, openingOCI, openingEquity,
      contributions, drawings, netIncome, priorPeriodAdjustment, oci,
      endingEquity, foots: Math.abs(computedEnding - endingEquity) < 0.02
    };
  }, [sales, expenses, collections, payments, cashReceipts, cashDisbursements, ppeAssets, payrollRecords, specialEntries, periodStart, companyName]);

  const row = (label: string, value: number, tone = '', parens = false) => (
    <div className={`flex justify-between text-xs py-2 border-b border-zinc-800/30 font-semibold ${tone}`}>
      <span>{label}</span>
      <span className="font-mono">{parens ? `(${fmt(value)})` : signed(value)}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-4 max-w-3xl mx-auto`}>
        <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted || ''}`}>
          Opening balance{periodStart ? ` (as of ${periodStart})` : ''}
        </div>
        {row('Capital Stock / Paid-in Capital (Beginning)', eq.openingCapital, theme.textTitle)}
        {row('Retained Earnings (Beginning) - includes closed prior years', eq.openingRE, theme.textTitle)}
        {eq.openingOCI !== 0 && row('Other Comprehensive Income Reserves (Beginning)', eq.openingOCI, theme.textTitle)}
        {row('Total Equity (Beginning)', eq.openingEquity, `${theme.textTitle} bg-zinc-500/5 px-2`)}

        <div className={`pt-2 text-[10px] font-bold uppercase tracking-wider ${theme.textMuted || ''}`}>Changes during the period</div>
        {row('Add: Owner Contributions (recorded via Special Entries)', eq.contributions, 'text-emerald-400')}
        {row('Add: Net Income for the Period', eq.netIncome, eq.netIncome < 0 ? 'text-rose-400' : 'text-emerald-400')}
        {eq.priorPeriodAdjustment !== 0 &&
          row('Add / (Less): Prior-Period Adjustments - omitted transactions of closed years (PAS 8)', eq.priorPeriodAdjustment, eq.priorPeriodAdjustment < 0 ? 'text-rose-400' : 'text-amber-400')}
        {eq.oci !== 0 && row('Add / (Less): Other Comprehensive Income', eq.oci, 'text-cyan-400')}
        {row("Less: Owner's Withdrawals / Dividends Declared", eq.drawings, 'text-rose-400', true)}
        <div className="flex justify-between text-sm font-bold p-4 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300">
          <span>STOCKHOLDERS' EQUITY (ENDING BALANCE)</span>
          <span className="font-mono text-base">{signed(eq.endingEquity)}</span>
        </div>

        {eq.priorPeriodAdjustment !== 0 && (
          <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>The prior-period adjustment comes from transactions omitted from fiscal years that are already CLOSED. Under PAS 8 they are corrected through Retained Earnings of the present period (Dr Cash / A/R, Cr Retained Earnings - or Dr Retained Earnings, Cr A/P / Cash); the closed years' Income Statements stay unchanged and the present-year Sales / Expenses are not affected.</span>
          </div>
        )}
        {!eq.foots && (
          <div className="flex items-start gap-2 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Equity roll-forward does not foot to the ending balance - check for entries posted directly to equity accounts.</span>
          </div>
        )}
        {eq.openingCapital === 0 && eq.contributions === 0 && (
          <div className="flex items-start gap-2 text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>No owner capital has been recorded yet. Record the owner's initial cash/asset contribution as a Special Entry (Debit: Cash 1010, Credit: Capital Stock 3010) to reflect actual paid-in capital here.</span>
          </div>
        )}
      </div>
    </div>
  );
}
