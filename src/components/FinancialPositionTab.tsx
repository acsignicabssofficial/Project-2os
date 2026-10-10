import React, { useState, useMemo } from 'react';
import { Landmark, CheckCircle, AlertTriangle, Layers, Search, Scale } from 'lucide-react';
import { Sale, Collection, Expense, Payment, PPEAsset, SpecialEntry, PayrollRecord, AccountTitle, Company } from '../types';
import { computeAccountingSummaries } from '../utils/accounting';

interface FinancialPositionTabProps {
  sales: Sale[];
  collections: Collection[];
  cashReceipts?: any[];
  expenses: Expense[];
  payments: Payment[];
  cashDisbursements?: any[];
  ppeAssets: PPEAsset[];
  specialEntries?: SpecialEntry[];
  payrollRecords?: PayrollRecord[];
  accountTitles?: AccountTitle[];
  incomeTaxRecords?: any[];
  activeCompany: Company | null;
  theme: any;
}


export default function FinancialPositionTab({
  sales = [],
  collections = [],
  cashReceipts = [],
  expenses = [],
  payments = [],
  cashDisbursements = [],
  ppeAssets = [],
  specialEntries = [],
  payrollRecords = [],
  accountTitles = [],
  activeCompany,
  theme
}: FinancialPositionTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';
  const [showAuditPanel, setShowAuditPanel] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statementLayout, setStatementLayout] = useState<'dr_cr_table' | 'cards'>('dr_cr_table');

  // Compute Balance Sheet Items with Accounting Integrity strictly synchronized with Master Journal
  const bs = useMemo(() => {
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

    return {
      cash: s.cash,
      ar: s.ar,
      supplierAdvances: s.supplierAdvances,
      inputVat: s.inputVat,
      cwt2307: s.cwt2307,
      totalCurrentAssets: s.totalCurrentAssets,
      ppeCost: s.ppeCost,
      accumDep: s.accumDep,
      netPPE: s.netPPE,
      totalAssets: s.totalAssets,
      ap: s.ap,
      customerAdvances: s.customerAdvances,
      outputVat: s.outputVat,
      ewtPayable: s.ewtPayable,
      payrollDeductionsPayable: s.payrollDeductionsPayable,
      totalLiabilities: s.totalLiabilities,
      revenue: s.grossRevenue,
      totalOperatingExp: s.totalOperatingExp,
      depreciationExpense: s.depreciationExpense,
      payrollExpense: s.payrollExpense,
      specialRev: s.specialRev,
      specialExp: s.specialExp,
      netIncomeBeforeTax: s.netIncomeBeforeTax,
      incomeTaxProvision: s.incomeTaxProvision,
      netIncome: s.netIncome,
      capitalStock: s.capitalStock,
      retainedEarnings: s.retainedEarnings,
      unrealizedGainLoss: s.unrealizedGainLoss,
      totalEquity: s.totalEquity,
      totalLiabilitiesAndEquity: s.totalLiabilitiesAndEquity,
      isBalanced: s.isBalanced
    };
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, ppeAssets, specialEntries, payrollRecords, accountTitles, companyName]);

  // Account Titles Auto-Arrangement Calculation for Audit Panel
  const arrangedAccounts = useMemo(() => {
    const list = accountTitles.length > 0 ? accountTitles : [
      { code: '1010', title: 'Cash and Cash Equivalents', type: 'Asset' },
      { code: '1020', title: 'Accounts Receivable', type: 'Asset' },
      { code: '1030', title: 'Creditable Input VAT', type: 'Asset' },
      { code: '1040', title: 'Creditable Withholding Tax (2307)', type: 'Asset' },
      { code: '1510', title: 'Property, Plant & Equipment', type: 'Asset' },
      { code: '1520', title: 'Accumulated Depreciation', type: 'Asset' },
      { code: '2010', title: 'Accounts Payable', type: 'Liability' },
      { code: '2020', title: 'Output VAT Payable', type: 'Liability' },
      { code: '2030', title: 'Expanded Withholding Tax Payable', type: 'Liability' },
      { code: '2050', title: 'SSS, PhilHealth & Pag-IBIG Payables', type: 'Liability' },
      { code: '3010', title: "Capital Stock / Owner's Equity", type: 'Equity' },
      { code: '3020', title: 'Retained Earnings', type: 'Equity' },
      { code: '4010', title: 'Sales Revenue', type: 'Revenue' },
      { code: '6010', title: 'Depreciation Expense', type: 'Expense' },
      { code: '6020', title: 'Salaries & Wages Expense', type: 'Expense' }
    ];

    // Assign computed balances
    return list.map(acc => {
      let dr = 0;
      let cr = 0;

      if (acc.code === '1010') { dr = bs.cash; }
      else if (acc.code === '1020') { dr = bs.ar; }
      else if (acc.code === '1030') { dr = bs.inputVat; }
      else if (acc.code === '1040') { dr = bs.cwt2307; }
      else if (acc.code === '1510') { dr = bs.ppeCost; }
      else if (acc.code === '1520') { cr = bs.accumDep; }
      else if (acc.code === '2010') { cr = bs.ap; }
      else if (acc.code === '2020') { cr = bs.outputVat; }
      else if (acc.code === '2030') { cr = bs.ewtPayable; }
      else if (acc.code === '2050') { cr = bs.payrollDeductionsPayable; }
      else if (acc.code === '3010') { cr = bs.capitalStock; }
      else if (acc.code === '3020') { cr = Math.max(0, bs.retainedEarnings); if (bs.retainedEarnings < 0) dr = Math.abs(bs.retainedEarnings); }
      else if (acc.code === '4010') { cr = bs.revenue + bs.specialRev; }
      else if (acc.code === '6010') { dr = bs.depreciationExpense; }
      else if (acc.code === '6020') { dr = bs.payrollExpense; }

      const net = (acc.type === 'Asset' || acc.type === 'Expense') ? (dr - cr) : (cr - dr);

      return {
        ...acc,
        debit: dr,
        credit: cr,
        netBalance: net
      };
    });
  }, [accountTitles, bs]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return arrangedAccounts;
    return arrangedAccounts.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    );
  }, [arrangedAccounts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Landmark className="w-6 h-6 text-cyan-400" />
              Statement of Financial Position (Balance Sheet)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Official statement of financial condition presenting Assets, Liabilities, and Equity for {companyName}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-800/30 border border-zinc-700/40 text-xs font-semibold">
              <button
                onClick={() => setStatementLayout('dr_cr_table')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statementLayout === 'dr_cr_table'
                    ? 'bg-cyan-500 text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Debit / Credit Format
              </button>
              <button
                onClick={() => setStatementLayout('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statementLayout === 'cards'
                    ? 'bg-cyan-500 text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Card Summary
              </button>
            </div>

            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-cyan-400" />
              {showAuditPanel ? 'Hide Audit Panel' : 'Audit Breakdown'}
            </button>

            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
              bs.isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>{bs.isBalanced ? 'BALANCE SHEET IN EQUILIBRIUM' : 'OUT OF BALANCE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. DEBIT / CREDIT TWO-COLUMN REPORT FORMAT (EXACT USER SPECIFICATION) */}
      {statementLayout === 'dr_cr_table' ? (
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-6 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/40">
            <div>
              <h3 className={`text-base font-bold font-display ${theme.textTitle} tracking-wide`}>
                STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
              </h3>
              <p className={`text-xs ${theme.textMuted}`}>
                Report presentation showing ending balances classified in Debit and Credit columns
              </p>
            </div>
            <div className="text-right text-xs font-mono text-zinc-400">
              Currency: <span className="font-bold text-cyan-400">Philippine Peso (₱)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/10 ${theme.textTitle} uppercase font-bold tracking-wider border-b-2 border-zinc-700/60`}>
                  <th className="p-3 w-1/2">Account Title / Classification</th>
                  <th className="p-3 w-28 text-center">Account Code</th>
                  <th className="p-3 w-40 text-right font-mono text-emerald-400">DEBIT (₱)</th>
                  <th className="p-3 w-40 text-right font-mono text-teal-400">CREDIT (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20 font-sans">
                {/* ================= ASSETS ================= */}
                <tr className="bg-cyan-500/10 font-bold border-t border-cyan-500/30">
                  <td colSpan={4} className="p-2.5 text-cyan-300 uppercase tracking-wider text-xs">
                    Assets
                  </td>
                </tr>

                {/* Current Assets Section */}
                <tr className="font-semibold text-zinc-300 bg-zinc-800/10">
                  <td className="p-2 pl-4 text-zinc-300">Current Assets</td>
                  <td className="p-2 text-center font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Line: Cash and Cash Equivalents */}
                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Cash and Cash Equivalents</td>
                  <td className="p-2 text-center font-mono text-cyan-400">1010</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₱{bs.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Line: Accounts Receivable (Net) */}
                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Accounts Receivable (Net)</td>
                  <td className="p-2 text-center font-mono text-cyan-400">1020</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₱{bs.ar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Line: Advances to Suppliers */}
                {bs.supplierAdvances > 0 && (
                  <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                    <td className="p-2 pl-8 font-medium text-purple-400">Advances to Suppliers (Supplier Debit Balance)</td>
                    <td className="p-2 text-center font-mono text-purple-400">1028</td>
                    <td className="p-2 text-right font-mono font-semibold text-purple-400">
                      ₱{bs.supplierAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  </tr>
                )}

                {/* Line: Creditable Input VAT */}
                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Creditable Input VAT</td>
                  <td className="p-2 text-center font-mono text-cyan-400">1030</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₱{bs.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Line: Creditable Withholding Tax (2307) */}
                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Creditable Withholding Tax (2307)</td>
                  <td className="p-2 text-center font-mono text-cyan-400">1040</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₱{bs.cwt2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Subtotal Current Assets */}
                <tr className="font-bold bg-cyan-500/5 text-cyan-300 border-t border-b border-cyan-500/20">
                  <td className="p-2.5 pl-6">Total Current Assets</td>
                  <td className="p-2.5 text-center font-mono">-</td>
                  <td className="p-2.5 text-right font-mono">
                    ₱{bs.totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2.5 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* Non-Current Assets Section */}
                <tr className="font-semibold text-zinc-300 bg-zinc-800/10">
                  <td className="p-2 pl-4 text-zinc-300">Non-Current Assets</td>
                  <td className="p-2 text-center font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Property, Plant & Equipment (Gross)</td>
                  <td className="p-2 text-center font-mono text-cyan-400">1510</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className="p-2 pl-8 font-medium text-rose-400">Less: Accumulated Depreciation</td>
                  <td className="p-2 text-center font-mono text-rose-400">1520</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono font-semibold text-rose-400">
                    ₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Net PPE Subtotal */}
                <tr className="font-bold bg-cyan-500/5 text-cyan-300 border-t border-b border-cyan-500/20">
                  <td className="p-2.5 pl-6">Net Fixed Assets (PPE)</td>
                  <td className="p-2.5 text-center font-mono">-</td>
                  <td className="p-2.5 text-right font-mono">
                    ₱{bs.netPPE.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2.5 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* TOTAL ASSETS */}
                <tr className="bg-cyan-500/20 font-bold border-t-2 border-b-2 border-cyan-400 text-cyan-300 text-sm">
                  <td className="p-3 pl-4 tracking-wider uppercase">TOTAL ASSETS</td>
                  <td className="p-3 text-center font-mono text-xs">-</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* ================= LIABILITIES ================= */}
                <tr className="bg-amber-500/10 font-bold border-t-2 border-amber-500/30">
                  <td colSpan={4} className="p-2.5 text-amber-300 uppercase tracking-wider text-xs">
                    Liabilities
                  </td>
                </tr>

                <tr className="font-semibold text-zinc-300 bg-zinc-800/10">
                  <td className="p-2 pl-4 text-zinc-300">Current Liabilities</td>
                  <td className="p-2 text-center font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Accounts Payable</td>
                  <td className="p-2 text-center font-mono text-amber-400">2010</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono font-semibold text-teal-400">
                    ₱{bs.ap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {bs.customerAdvances > 0 && (
                  <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                    <td className="p-2 pl-8 font-medium text-cyan-400">Customer Advances (Customer Credit Balance)</td>
                    <td className="p-2 text-center font-mono text-cyan-400">2018</td>
                    <td className="p-2 text-right font-mono text-zinc-500">-</td>
                    <td className="p-2 text-right font-mono font-semibold text-cyan-400">
                      ₱{bs.customerAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Output VAT Payable</td>
                  <td className="p-2 text-center font-mono text-amber-400">2020</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono font-semibold text-teal-400">
                    ₱{bs.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Expanded Withholding Tax Payable (0619-E)</td>
                  <td className="p-2 text-center font-mono text-amber-400">2030</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono font-semibold text-teal-400">
                    ₱{bs.ewtPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {bs.payrollDeductionsPayable > 0 && (
                  <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                    <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>SSS, PhilHealth, Pag-IBIG & Tax Withheld (Payroll)</td>
                    <td className="p-2 text-center font-mono text-amber-400">2050</td>
                    <td className="p-2 text-right font-mono text-zinc-500">-</td>
                    <td className="p-2 text-right font-mono font-semibold text-teal-400">
                      ₱{bs.payrollDeductionsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Subtotal Current Liabilities */}
                <tr className="font-bold bg-amber-500/5 text-amber-300 border-t border-b border-amber-500/20">
                  <td className="p-2.5 pl-6">Total Current Liabilities</td>
                  <td className="p-2.5 text-center font-mono">-</td>
                  <td className="p-2.5 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2.5 text-right font-mono">
                    ₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* TOTAL LIABILITIES */}
                <tr className="bg-amber-500/15 font-bold border-t border-b border-amber-400 text-amber-300">
                  <td className="p-3 pl-4 tracking-wider uppercase">TOTAL LIABILITIES</td>
                  <td className="p-3 text-center font-mono text-xs">-</td>
                  <td className="p-3 text-right font-mono text-zinc-500">-</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* ================= EQUITY ================= */}
                <tr className="bg-purple-500/10 font-bold border-t-2 border-purple-500/30">
                  <td colSpan={4} className="p-2.5 text-purple-300 uppercase tracking-wider text-xs">
                    Stockholders' Equity
                  </td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Capital Stock / Paid-in Capital</td>
                  <td className="p-2 text-center font-mono text-purple-400">3010</td>
                  <td className="p-2 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2 text-right font-mono font-semibold text-purple-400">
                    ₱{bs.capitalStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                  <td className={`p-2 pl-8 font-medium ${theme.textMain}`}>Retained Earnings (Net Income After Depreciation & Tax)</td>
                  <td className="p-2 text-center font-mono text-purple-400">3020</td>
                  {bs.retainedEarnings < 0 ? (
                    <>
                      <td className="p-2 text-right font-mono font-semibold text-rose-400">
                        ₱{Math.abs(bs.retainedEarnings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-zinc-500">-</td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 text-right font-mono text-zinc-500">-</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        ₱{bs.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}
                </tr>

                {/* Subtotal Stockholders' Equity */}
                <tr className="font-bold bg-purple-500/5 text-purple-300 border-t border-b border-purple-500/20">
                  <td className="p-2.5 pl-6">Total Stockholders' Equity</td>
                  <td className="p-2.5 text-center font-mono">-</td>
                  <td className="p-2.5 text-right font-mono text-zinc-500">-</td>
                  <td className="p-2.5 text-right font-mono">
                    ₱{bs.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* TOTAL LIABILITIES & EQUITY */}
                <tr className="bg-amber-500/20 font-bold border-t-2 border-b-2 border-amber-400 text-amber-300 text-sm">
                  <td className="p-3 pl-4 tracking-wider uppercase">TOTAL LIABILITIES & STOCKHOLDERS' EQUITY</td>
                  <td className="p-3 text-center font-mono text-xs">-</td>
                  <td className="p-3 text-right font-mono text-zinc-500">-</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₱{bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* EQUILIBRIUM CHECK ROW */}
                <tr className={`font-mono text-xs font-bold ${
                  bs.isBalanced ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  <td className="p-3 pl-4">
                    {bs.isBalanced ? '✓ Equation Proof: Assets = Liabilities + Equity' : '⚠ Out of Balance Difference:'}
                  </td>
                  <td className="p-3 text-center">CHECK</td>
                  <td className="p-3 text-right">
                    ₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right">
                    ₱{bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. CARD VIEW (SIDE-BY-SIDE SUMMARY CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ASSETS */}
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
          <h3 className={`text-base font-bold font-display border-b ${theme.borderCard} pb-2 text-cyan-400 uppercase tracking-wider`}>
            ASSETS
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Assets</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Cash and Cash Equivalents</span>
              <span className="font-mono font-semibold">₱{bs.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Accounts Receivable (Net)</span>
              <span className="font-mono font-semibold">₱{bs.ar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.supplierAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-purple-400">
                <span>Advances to Suppliers (Supplier Debit Balance)</span>
                <span className="font-mono font-semibold">₱{bs.supplierAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Input VAT</span>
              <span className="font-mono font-semibold">₱{bs.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Withholding Tax (2307)</span>
              <span className="font-mono font-semibold">₱{bs.cwt2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Total Current Assets</span>
              <span className="font-mono">₱{bs.totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Non-Current Assets</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Property, Plant & Equipment (Gross)</span>
              <span className="font-mono font-semibold">₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-rose-400">
              <span>Less: Accumulated Depreciation</span>
              <span className="font-mono font-semibold">(₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Net Fixed Assets (PPE)</span>
              <span className="font-mono">₱{bs.netPPE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-300 pt-3">
            <span>TOTAL ASSETS</span>
            <span className="font-mono">₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
          <h3 className={`text-base font-bold font-display border-b ${theme.borderCard} pb-2 text-amber-400 uppercase tracking-wider`}>
            LIABILITIES & EQUITY
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Liabilities</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Accounts Payable</span>
              <span className="font-mono font-semibold">₱{bs.ap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.customerAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400 font-semibold">
                <span>Customer Advances (Customer Credit Balance)</span>
                <span className="font-mono">₱{bs.customerAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Output VAT Payable</span>
              <span className="font-mono font-semibold">₱{bs.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Expanded Withholding Tax Payable (0619-E)</span>
              <span className="font-mono font-semibold">₱{bs.ewtPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.payrollDeductionsPayable > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>SSS, PhilHealth, Pag-IBIG & Tax Withheld (Payroll)</span>
                <span className="font-mono font-semibold">₱{bs.payrollDeductionsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-amber-400">
              <span>Total Current Liabilities</span>
              <span className="font-mono">₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Stockholders' Equity</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Capital Stock / Paid-in Capital</span>
              <span className="font-mono font-semibold">₱{bs.capitalStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Retained Earnings (Net Income After Depreciation & Tax)</span>
              <span className={`font-mono font-semibold ${bs.retainedEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₱{bs.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-purple-400">
              <span>Total Stockholders' Equity</span>
              <span className="font-mono">₱{bs.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 pt-3">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span className="font-mono">₱{bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {Math.abs(bs.unrealizedGainLoss) >= 0.01 && (
            <div className="flex justify-between text-xs font-semibold p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Out of Balance - Review Entries</span>
              <span className="font-mono">
                {bs.unrealizedGainLoss >= 0 ? `₱${bs.unrealizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `(₱${Math.abs(bs.unrealizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
              </span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* AUTO-COMPUTE & DISCREPANCY TRACEABILITY AUDIT PANEL */}
      {showAuditPanel && (
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-5 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/30 pb-4">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <Layers className="w-4 h-4 text-cyan-400" />
                Auto-Compute & Account Title Discrepancy Traceability Breakdown
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Automatic arrangement of account codes and postings to easily trace and audit any variance between Assets and Liabilities + Equity.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search account title or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>

          {/* TRACE DISCREPANCY ORIGIN SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-cyan-300 uppercase">1. Gross Assets</span>
              <div className="text-base font-bold font-mono text-cyan-400">₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">Cash + Receivables + PPE Net + VAT/CWT</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-amber-300 uppercase">2. Total Liabilities</span>
              <div className="text-base font-bold font-mono text-amber-400">₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">AP + Customer Advances + Output VAT + EWT</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase">3. Operating Net Income</span>
              <div className="text-base font-bold font-mono text-emerald-400">₱{bs.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">Sales - Expenses - Depreciation - Tax</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-purple-300 uppercase">4. Out-of-Balance Check</span>
              <div className={`text-base font-bold font-mono ${Math.abs(bs.unrealizedGainLoss) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bs.unrealizedGainLoss >= 0 ? `₱${bs.unrealizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `(₱${Math.abs(bs.unrealizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
              </div>
              <p className="text-[10px] text-zinc-400">{Math.abs(bs.unrealizedGainLoss) < 0.01 ? 'Books are balanced' : 'Assets vs. Liabilities + Equity - review entries'}</p>
            </div>
          </div>

          {/* ARRANGED ACCOUNT TITLES TABLE */}
          <div className="overflow-x-auto border border-zinc-800/40 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit Posting (Dr)</th>
                  <th className="p-3 text-right">Credit Posting (Cr)</th>
                  <th className="p-3 text-right">Net Financial Position</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {filteredAccounts.map((acc, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono font-bold text-cyan-400">{acc.code}</td>
                    <td className={`p-3 font-semibold ${theme.textMain}`}>{acc.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        acc.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400' :
                        acc.type === 'Liability' ? 'bg-amber-500/10 text-amber-400' :
                        acc.type === 'Equity' ? 'bg-purple-500/10 text-purple-400' :
                        acc.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-400">
                      ₱{acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-400">
                      ₱{acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${acc.netBalance > 0 ? 'text-cyan-400' : 'text-zinc-300'}`}>
                      ₱{acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
