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
  const [method, setMethod] = React.useState<'direct' | 'indirect'>('direct');

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
      endingCash,
      // PAS 7 Indirect Method components
      netIncomeBeforeTax: s.netIncomeBeforeTax,
      depreciationExpense: s.depreciationExpense,
      impairmentExpense: s.impairmentExpense,
      financeCosts: s.financeCosts,
      incomeTaxProvision: s.incomeTaxProvision,
      wcChangeInAR: s.wcChangeInAR,
      wcChangeInPrepaidsAndTaxAssets: s.wcChangeInPrepaidsAndTaxAssets,
      wcChangeInAPAndAccruals: s.wcChangeInAPAndAccruals,
      wcChangeInTaxAndStatutoryPayables: s.wcChangeInTaxAndStatutoryPayables,
      apBalance: s.ap
    };
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, ppeAssets, payrollRecords, specialEntries, accountTitles, companyName]);

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Activity className="w-6 h-6 text-teal-400" />
              Statement of Cash Flows (PAS 7)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              PAS 7 compliant statement of cash flows classified into Operating, Investing, and Financing activities under Direct &amp; Indirect methods for {activeCompany?.company_name || 'No Company Selected'}.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-500/10 border border-zinc-700/30 text-xs">
            <button
              type="button"
              onClick={() => setMethod('direct')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                method === 'direct' ? 'bg-teal-500 text-slate-950' : theme.textMuted
              }`}
            >
              Direct Method (PAS 7.18a)
            </button>
            <button
              type="button"
              onClick={() => setMethod('indirect')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                method === 'indirect' ? 'bg-teal-500 text-slate-950' : theme.textMuted
              }`}
            >
              Indirect Method (PAS 7.18b)
            </button>
          </div>
        </div>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-6 max-w-3xl mx-auto`}>
        {/* OPERATING */}
        {method === 'direct' ? (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-teal-400 border-b border-zinc-800/40 pb-1">
              I. CASH FLOWS FROM OPERATING ACTIVITIES — DIRECT METHOD (PAS 7.18a)
            </h3>
            <div className="flex justify-between text-xs py-1">
              <span className={theme.textMain}>Cash Receipts from Customers (Sales &amp; Collections)</span>
              <span className="font-mono text-emerald-400">₱{cf.totalOperatingInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className={theme.textMain}>Cash Paid to Suppliers, Employees &amp; Operating Expenses</span>
              <span className="font-mono text-rose-400">(₱{cf.totalOperatingOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-teal-300">
              <span>Net Cash Provided by (Used in) Operating Activities</span>
              <span className="font-mono">₱{cf.netOperatingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-teal-400 border-b border-zinc-800/40 pb-1">
              I. CASH FLOWS FROM OPERATING ACTIVITIES — INDIRECT METHOD (PAS 7.18b)
            </h3>
            <div className="flex justify-between text-xs py-1 font-semibold">
              <span className={theme.textMain}>Profit / (Loss) Before Income Tax</span>
              <span className="font-mono text-cyan-400">₱{cf.netIncomeBeforeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-400 pt-1">Adjustments for Non-Cash Items:</div>
            <div className="flex justify-between text-xs py-0.5 pl-4">
              <span className={theme.textMain}>Add: Depreciation &amp; Amortization Expense (PAS 16 / PFRS 16)</span>
              <span className="font-mono text-emerald-400">₱{cf.depreciationExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {cf.impairmentExpense > 0 && (
              <div className="flex justify-between text-xs py-0.5 pl-4">
                <span className={theme.textMain}>Add: Impairment &amp; Expected Credit Losses (PAS 36 / PFRS 9)</span>
                <span className="font-mono text-emerald-400">₱{cf.impairmentExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {cf.financeCosts > 0 && (
              <div className="flex justify-between text-xs py-0.5 pl-4">
                <span className={theme.textMain}>Add: Finance &amp; Interest Expense (PAS 23 / PFRS 16)</span>
                <span className="font-mono text-emerald-400">₱{cf.financeCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="text-[11px] font-bold text-zinc-400 pt-1">Changes in Working Capital (Operating Assets &amp; Liabilities):</div>
            <div className="flex justify-between text-xs py-0.5 pl-4">
              <span className={theme.textMain}>(Increase) / Decrease in Trade Receivables &amp; Contract Assets</span>
              <span className={`font-mono ${cf.wcChangeInAR < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₱{cf.wcChangeInAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5 pl-4">
              <span className={theme.textMain}>(Increase) / Decrease in Input VAT, CWT 2307 &amp; Prepayments</span>
              <span className={`font-mono ${cf.wcChangeInPrepaidsAndTaxAssets < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₱{cf.wcChangeInPrepaidsAndTaxAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5 pl-4">
              <span className={theme.textMain}>Increase / (Decrease) in Trade Accounts Payable &amp; Customer Advances</span>
              <span className={`font-mono ${cf.wcChangeInAPAndAccruals < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₱{cf.wcChangeInAPAndAccruals.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5 pl-4">
              <span className={theme.textMain}>Increase / (Decrease) in Output VAT, EWT &amp; Statutory Payables</span>
              <span className={`font-mono ${cf.wcChangeInTaxAndStatutoryPayables < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₱{cf.wcChangeInTaxAndStatutoryPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {cf.incomeTaxProvision > 0 && (
              <div className="flex justify-between text-xs py-0.5 pl-4 text-rose-400">
                <span>Less: Income Taxes Paid / Provision</span>
                <span className="font-mono">(₱{cf.incomeTaxProvision.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-teal-300">
              <span>Net Cash Provided by (Used in) Operating Activities</span>
              <span className="font-mono">₱{cf.netOperatingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

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
