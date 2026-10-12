import React, { useMemo } from 'react';
import { TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { Sale, Expense, PPEAsset, SpecialEntry, PayrollRecord, Company } from '../types';
import { computeAccountingSummaries } from '../utils/accounting';

interface IncomeStatementTabProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  payrollRecords?: PayrollRecord[];
  activeCompany: Company | null;
  theme: any;
}

export default function IncomeStatementTab({
  sales,
  expenses,
  ppeAssets,
  specialEntries,
  payrollRecords = [],
  activeCompany,
  theme
}: IncomeStatementTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const [presentationMode, setPresentationMode] = React.useState<'single' | 'two_statement'>('single');

  const incomeStatementData = useMemo(() => {
    const compSales = sales.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
    const compExp = expenses.filter(e => !activeCompanyName || e.company_name === activeCompanyName);
    const compPpe = ppeAssets.filter(p => !activeCompanyName || p.company_name === activeCompanyName);
    const compSpecial = specialEntries.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
    const compPayroll = payrollRecords.filter(p => !activeCompanyName || p.company_name === activeCompanyName);

    const s = computeAccountingSummaries({
      sales: compSales,
      collections: [],
      expenses: compExp,
      payments: [],
      ppeAssets: compPpe,
      specialEntries: compSpecial,
      payrollRecords: compPayroll,
      companyName: activeCompanyName
    });

    const grossSales = Math.round((s.vatableSales + s.zeroRatedSales + s.vatExemptSales + s.specialRev) * 100) / 100;

    return {
      grossSales,
      salesDiscounts: s.salesDiscounts,
      netRevenue: s.grossRevenue,
      operatingExpenses: Math.round((s.totalOperatingExp + s.depreciationExpense + s.impairmentExpense + s.payrollExpense) * 100) / 100,
      depreciationExpense: s.depreciationExpense,
      impairmentExpense: s.impairmentExpense,
      payrollExpense: s.payrollExpense,
      operatingProfit: s.operatingProfit,
      financeCosts: s.financeCosts,
      netIncomeBeforeTax: s.netIncomeBeforeTax,
      provisionForTax: s.incomeTaxProvision,
      deferredTaxExpense: s.deferredTaxExpense,
      netIncomeAfterTax: s.netIncome,
      revaluationSurplusOCI: s.revaluationSurplusOCI,
      actuarialRemeasurementOCI: s.actuarialRemeasurementOCI,
      fvociReserveOCI: s.fvociReserveOCI,
      totalOCI: s.totalOCI,
      totalComprehensiveIncome: s.totalComprehensiveIncome
    };
  }, [sales, expenses, ppeAssets, specialEntries, payrollRecords, activeCompanyName]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm p-4 transition-colors duration-200`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-500/10 border border-zinc-700/30 text-xs">
              <button
                type="button"
                onClick={() => setPresentationMode('single')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  presentationMode === 'single' ? 'bg-cyan-500 text-slate-950' : theme.textMuted
                }`}
              >
                Single-Statement (PAS 1.81A)
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode('two_statement')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  presentationMode === 'two_statement' ? 'bg-cyan-500 text-slate-950' : theme.textMuted
                }`}
              >
                Two-Statement Setup (PAS 1.81B)
              </button>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-mono text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Comprehensive Income:</span>
              <span className="text-lg font-extrabold text-emerald-400">
                ₱{incomeStatementData.totalComprehensiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      {/* STATEMENT 1: PROFIT OR LOSS */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto w-full`}>
        <div className="border-b border-zinc-800/40 pb-3 flex justify-between items-center">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle}`}>
            {presentationMode === 'single'
              ? 'Part I — Profit or Loss Section (PAS 1 / PFRS 18)'
              : 'Statement 1 — Separate Statement of Profit or Loss (PAS 1.81B)'}
          </h3>
          <span className="text-xs font-mono text-cyan-400">PAS 1.87 Extraordinary Items Prohibited</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between p-2.5 rounded-lg bg-zinc-500/5">
            <span className={`font-bold ${theme.textMain}`}>GROSS REVENUE FROM CONTRACTS WITH CUSTOMERS (#4010-4030):</span>
            <span className="font-bold text-cyan-400">₱{incomeStatementData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {incomeStatementData.salesDiscounts > 0 && (
            <div className="flex justify-between pl-6 text-rose-400 text-[11px]">
              <span>Less: Sales Discounts &amp; Variable Consideration — PFRS 15 (#4015):</span>
              <span>(₱{incomeStatementData.salesDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
          )}

          <div className="flex justify-between p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 font-bold text-cyan-300">
            <span>NET REVENUE (PFRS 15):</span>
            <span>₱{incomeStatementData.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-lg bg-zinc-500/5 text-rose-400">
            <span className="font-bold">LESS: OPERATING EXPENSES (#5010 / #6010-6100):</span>
            <span className="font-bold">(₱{incomeStatementData.operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>

          <div className="flex justify-between pl-6 text-zinc-400 text-[11px]">
            <span>• Employee Benefits &amp; Statutory Contributions — PAS 19 (#6010-6017):</span>
            <span>₱{incomeStatementData.payrollExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between pl-6 text-zinc-400 text-[11px]">
            <span>• Depreciation Expense — PAS 16 / PFRS 16 (#6080):</span>
            <span>₱{incomeStatementData.depreciationExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {incomeStatementData.impairmentExpense > 0 && (
            <div className="flex justify-between pl-6 text-rose-400 text-[11px]">
              <span>• Impairment Losses &amp; ECL Provision — PAS 36 / PFRS 9 (#6085):</span>
              <span>₱{incomeStatementData.impairmentExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 font-bold text-xs text-purple-300">
            <span>OPERATING PROFIT / (LOSS) — PFRS 18 MANDATORY SUBTOTAL:</span>
            <span>₱{incomeStatementData.operatingProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {incomeStatementData.financeCosts > 0 && (
            <div className="flex justify-between p-2.5 rounded-lg bg-rose-500/10 text-rose-300">
              <span>LESS: FINANCE &amp; LEASE INTEREST COSTS — PAS 23 / PFRS 16 (#6090):</span>
              <span>(₱{incomeStatementData.financeCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
          )}

          <div className="flex justify-between p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 font-bold text-sm text-cyan-300">
            <span>PROFIT / (LOSS) BEFORE INCOME TAX:</span>
            <span>₱{incomeStatementData.netIncomeBeforeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <div>
              <span className="font-bold block">LESS: INCOME TAX EXPENSE — PAS 12 (#7010 Current / #7020 Deferred):</span>
              <span className="text-[10px] text-zinc-400 font-sans italic">Current &amp; Deferred Tax provision under CREATE Act &amp; PAS 12</span>
            </div>
            <span className="font-bold text-amber-300">
              (₱{incomeStatementData.provisionForTax.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </span>
          </div>

          <div className="flex justify-between p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-extrabold text-base text-emerald-300 mt-4">
            <span>PROFIT / (LOSS) FOR THE PERIOD (NET INCOME AFTER TAX):</span>
            <span>₱{incomeStatementData.netIncomeAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {presentationMode === 'single' && (
            <div className="pt-4 mt-4 border-t border-zinc-800/50 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Part II — Other Comprehensive Income (PAS 1.82A)
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">
                Items that will not be reclassified subsequently to profit or loss:
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span className={theme.textMain}>Revaluation Surplus on PPE — PAS 16 (#3040):</span>
                <span className="text-cyan-400">₱{incomeStatementData.revaluationSurplusOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span className={theme.textMain}>Remeasurement of Defined Benefit Plan — PAS 19 (#3050):</span>
                <span className="text-cyan-400">₱{incomeStatementData.actuarialRemeasurementOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span className={theme.textMain}>Fair Value Reserve on FVOCI Financial Assets — PFRS 9 (#3060):</span>
                <span className="text-cyan-400">₱{incomeStatementData.fvociReserveOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 font-bold text-purple-300">
                <span>OTHER COMPREHENSIVE INCOME FOR THE PERIOD, NET OF TAX:</span>
                <span>₱{incomeStatementData.totalOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 font-extrabold text-base text-cyan-300">
                <span>TOTAL COMPREHENSIVE INCOME FOR THE PERIOD:</span>
                <span>₱{incomeStatementData.totalComprehensiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEPARATE SECOND STATEMENT WHEN TWO-STATEMENT MODE IS SELECTED (PAS 1.81B) */}
      {presentationMode === 'two_statement' && (
        <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto w-full`}>
          <div className="border-b border-zinc-800/40 pb-3 flex justify-between items-center">
            <h3 className={`text-sm font-bold uppercase tracking-wider text-purple-400`}>
              Statement 2 — Separate Statement of Comprehensive Income (PAS 1.81B)
            </h3>
            <span className="text-xs font-mono text-zinc-500">Starts with Profit/Loss for the Period</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-300">
              <span>PROFIT / (LOSS) FOR THE PERIOD:</span>
              <span>₱{incomeStatementData.netIncomeAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="text-[11px] text-zinc-400 font-sans pt-1">
              Other Comprehensive Income — Items that will not be reclassified to Profit or Loss (PAS 1.82A):
            </div>

            <div className="flex justify-between pl-4">
              <span className={theme.textMain}>Gain on Property Revaluation — PAS 16 (#3040):</span>
              <span className="text-cyan-400">₱{incomeStatementData.revaluationSurplusOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className={theme.textMain}>Actuarial Remeasurement of Defined Benefit Liability — PAS 19 (#3050):</span>
              <span className="text-cyan-400">₱{incomeStatementData.actuarialRemeasurementOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className={theme.textMain}>Net Fair Value Change on FVOCI Equity Investments — PFRS 9 (#3060):</span>
              <span className="text-cyan-400">₱{incomeStatementData.fvociReserveOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 font-bold text-purple-300">
              <span>OTHER COMPREHENSIVE INCOME FOR THE PERIOD:</span>
              <span>₱{incomeStatementData.totalOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between p-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 font-extrabold text-base text-cyan-300">
              <span>TOTAL COMPREHENSIVE INCOME FOR THE PERIOD:</span>
              <span>₱{incomeStatementData.totalComprehensiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
