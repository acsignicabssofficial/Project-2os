import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Sale, Collection, Expense, Payment, PPEAsset, PayrollRecord, SpecialEntry, Company, AccountTitle } from '../types';
import { computeAccountingSummaries } from '../utils/accounting';

interface CashFlowsTabProps {
  sales: Sale[];
  collections: Collection[];
  cashReceipts?: any[];
  expenses: Expense[];
  payments: Payment[];
  cashDisbursements?: any[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  specialEntries?: SpecialEntry[];
  accountTitles?: AccountTitle[];
  activeCompany: Company | null;
  theme: any;
}

export default function CashFlowsTab({
  sales,
  collections,
  cashReceipts = [],
  expenses,
  payments,
  cashDisbursements = [],
  ppeAssets = [],
  payrollRecords = [],
  specialEntries = [],
  accountTitles = [],
  activeCompany,
  theme
}: CashFlowsTabProps) {
  const companyName = activeCompany?.company_name || '';

  const cf = useMemo(() => {
    const s = computeAccountingSummaries({
      sales,
      collections,
      cashReceipts,
      expenses,
      payments,
      cashDisbursements,
      ppeAssets,
      specialEntries,
      payrollRecords,
      accountTitles,
      companyName
    });

    const totalOperatingInflows = s.cashInflowsFromCustomers;
    const totalOperatingOutflows = Math.round((s.cashOutflowsToSuppliersAndExpenses + s.cashOutflowsToPayroll) * 100) / 100;
    const netOperatingCashFlow = s.netOperatingCashFlow;
    const netInvestingCashFlow = s.netInvestingCashFlow;
    const netFinancingCashFlow = s.netFinancingCashFlow;
    const netChangeInCash = Math.round((netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow) * 100) / 100;
    const beginningCash = 0;
    const endingCash = s.cash;

    return {
      totalOperatingInflows,
      totalOperatingOutflows,
      netOperatingCashFlow,
      netInvestingCashFlow,
      netFinancingCashFlow,
      netChangeInCash,
      beginningCash,
      endingCash
    };
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, ppeAssets, payrollRecords, specialEntries, accountTitles, companyName]);

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <Activity className="w-6 h-6 text-teal-400" />
          Statement of Cash Flows
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Statement of cash receipts and disbursements classified into Operating, Investing, and Financing activities for {activeCompany?.company_name || 'No Company Selected'}.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-6 max-w-3xl mx-auto`}>
        {/* OPERATING */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-teal-400 border-b border-zinc-800/40 pb-1">
            I. CASH FLOWS FROM OPERATING ACTIVITIES
          </h3>
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>Cash Receipts from Sales & Collections</span>
            <span className="font-mono text-emerald-400">₱{cf.totalOperatingInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>Cash Payments for Operating Expenses & Suppliers</span>
            <span className="font-mono text-rose-400">(₱{cf.totalOperatingOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>
          <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-teal-300">
            <span>Net Cash Provided by (Used in) Operating Activities</span>
            <span className="font-mono">₱{cf.netOperatingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* INVESTING */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-cyan-400 border-b border-zinc-800/40 pb-1">
            II. CASH FLOWS FROM INVESTING ACTIVITIES
          </h3>
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>Acquisition of Property, Plant & Equipment</span>
            <span className="font-mono text-rose-400">(₱{Math.abs(cf.netInvestingCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>
          <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-300">
            <span>Net Cash Used in Investing Activities</span>
            <span className="font-mono">(₱{Math.abs(cf.netInvestingCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>
        </div>

        {/* FINANCING */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-purple-400 border-b border-zinc-800/40 pb-1">
            III. CASH FLOWS FROM FINANCING ACTIVITIES
          </h3>
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>Owner's Capital Contribution (net of withdrawals)</span>
            <span className={`font-mono ${cf.netFinancingCashFlow < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₱{cf.netFinancingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-purple-300">
            <span>Net Cash Provided by Financing Activities</span>
            <span className="font-mono">₱{cf.netFinancingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* RECONCILIATION */}
        <div className="pt-4 border-t border-zinc-800/60 space-y-2">
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>NET INCREASE (DECREASE) IN CASH</span>
            <span className="font-mono font-bold text-teal-400">₱{cf.netChangeInCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className={theme.textMain}>CASH BALANCE AT BEGINNING OF PERIOD</span>
            <span className="font-mono font-semibold">₱{cf.beginningCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-bold p-3 bg-teal-500/15 border border-teal-500/30 rounded-xl text-teal-300">
            <span>CASH BALANCE AT END OF PERIOD</span>
            <span className="font-mono text-base">₱{cf.endingCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
