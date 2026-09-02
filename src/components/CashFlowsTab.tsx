import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Sale, Collection, Expense, Payment, PPEAsset, PayrollRecord, SpecialEntry, Company } from '../types';

interface CashFlowsTabProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  specialEntries?: SpecialEntry[];
  activeCompany: Company | null;
  theme: any;
}

export default function CashFlowsTab({
  sales,
  collections,
  expenses,
  payments,
  ppeAssets = [],
  payrollRecords = [],
  specialEntries = [],
  activeCompany,
  theme
}: CashFlowsTabProps) {

  const cf = useMemo(() => {
    // Operating Cash Inflows
    const cashFromColls = collections.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
    const cashFromPaidSales = sales.filter(s => s.sales_status === 'Paid').reduce((sum, s) =>
      sum + Math.max(0, (Number(s.invoice_amount) || 0) - (Number(s.discounts) || 0)) - (Number(s.withholding_2307) || 0), 0);
    const totalOperatingInflows = cashFromColls + cashFromPaidSales;

    // Operating Cash Outflows
    const cashPaidExpenses = expenses.filter(e => e.expense_status === 'Paid').reduce((sum, e) =>
      sum + Math.max(0, (Number(e.expense_invoice_amount) || 0) - (Number(e.discounts) || 0)) - (Number(e.withholding_2307_2306) || 0), 0);
    const cashDisbursedPayments = payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const netPayDisbursed = payrollRecords.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);
    const totalOperatingOutflows = cashPaidExpenses + cashDisbursedPayments + netPayDisbursed;

    const netOperatingCashFlow = totalOperatingInflows - totalOperatingOutflows;

    // Investing Cash Outflows
    const ppeAdditions = ppeAssets.reduce((sum, a) => sum + (Number(a.acquisition_cost) || 0), 0);
    const netInvestingCashFlow = -ppeAdditions;

    // Financing Cash Flows - derived only from actual recorded transactions
    // (owner capital contributions/withdrawals recorded via Special Entries,
    // Debit/Credit account 3010). No hardcoded seed capital.
    let capitalContributions = 0;
    let ownerDrawings = 0;
    specialEntries.forEach(s => {
      s.lines.forEach(l => {
        if (l.account_code === '3010') {
          const amt = Number(l.amount) || 0;
          if (l.type === 'Credit') capitalContributions += amt;
          else ownerDrawings += amt;
        }
      });
    });
    const netFinancingCashFlow = capitalContributions - ownerDrawings;

    const netChangeInCash = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
    const beginningCash = 0;
    const endingCash = beginningCash + netChangeInCash;

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
  }, [sales, collections, expenses, payments, ppeAssets, payrollRecords, specialEntries]);

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
