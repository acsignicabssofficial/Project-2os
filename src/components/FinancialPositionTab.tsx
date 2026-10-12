import React, { useState, useMemo } from 'react';
import { Landmark, CheckCircle, AlertTriangle, Layers, Search, Scale, Plus, Trash2, Check, X } from 'lucide-react';
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
  setSpecialEntries?: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  payrollRecords?: PayrollRecord[];
  accountTitles?: AccountTitle[];
  setAccountTitles?: React.Dispatch<React.SetStateAction<AccountTitle[]>>;
  incomeTaxRecords?: any[];
  activeCompany: Company | null;
  theme: any;
  mode?: 'balance_sheet' | 'financial_position';
  triggerAlert?: (msg: string, type?: 'success' | 'error' | 'info') => void;
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
  setSpecialEntries,
  payrollRecords = [],
  accountTitles = [],
  activeCompany,
  theme,
  mode = 'balance_sheet',
  triggerAlert
}: FinancialPositionTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';
  const [showAuditPanel, setShowAuditPanel] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'worksheet' | 'debit_credit' | 'coa_summary'>('worksheet');
  const isBalanceSheetMode = mode === 'balance_sheet';

  // State for Adding Adjusting Entries in Trial Balance
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjRefNo, setAdjRefNo] = useState(`ADJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
  const [adjDescription, setAdjDescription] = useState('');
  const [adjDebitCode, setAdjDebitCode] = useState('6010');
  const [adjCreditCode, setAdjCreditCode] = useState('2010');
  const [adjAmount, setAdjAmount] = useState('');

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
      arGross: s.arGross,
      allowanceForECL: s.allowanceForECL,
      ar: s.ar,
      supplierAdvances: s.supplierAdvances,
      inputVat: s.inputVat,
      cwt2307: s.cwt2307,
      prepaidExpenses: s.prepaidExpenses,
      contractAssets: s.contractAssets,
      assetsHeldForSale: s.assetsHeldForSale,
      otherCurrentAssets: s.otherCurrentAssets,
      totalCurrentAssets: s.totalCurrentAssets,
      ppeCost: s.ppeCost,
      accumDep: s.accumDep,
      netPPE: s.netPPE,
      rouAssetNet: s.rouAssetNet,
      intangibleAssets: s.intangibleAssets,
      deferredTaxAsset: s.deferredTaxAsset,
      otherNonCurrentAssets: s.otherNonCurrentAssets,
      totalNonCurrentAssets: s.totalNonCurrentAssets,
      totalAssets: s.totalAssets,
      ap: s.ap,
      customerAdvances: s.customerAdvances,
      outputVat: s.outputVat,
      ewtPayable: s.ewtPayable,
      payrollDeductionsPayable: s.payrollDeductionsPayable,
      incomeTaxPayable: s.incomeTaxPayable,
      contractLiabilities: s.contractLiabilities,
      leaseLiabilityCurrent: s.leaseLiabilityCurrent,
      provisionsCurrent: s.provisionsCurrent,
      otherCurrentLiabilities: s.otherCurrentLiabilities,
      totalCurrentLiabilities: s.totalCurrentLiabilities,
      loansPayableNonCurrent: s.loansPayableNonCurrent,
      leaseLiabilityNonCurrent: s.leaseLiabilityNonCurrent,
      deferredTaxLiability: s.deferredTaxLiability,
      retirementBenefitObligation: s.retirementBenefitObligation,
      otherNonCurrentLiabilities: s.otherNonCurrentLiabilities,
      totalNonCurrentLiabilities: s.totalNonCurrentLiabilities,
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
      totalOCI: s.totalOCI,
      totalComprehensiveIncome: s.totalComprehensiveIncome,
      capitalStock: s.capitalStock,
      retainedEarnings: s.retainedEarnings,
      unrealizedGainLoss: s.unrealizedGainLoss,
      totalEquity: s.totalEquity,
      totalLiabilitiesAndEquity: s.totalLiabilitiesAndEquity,
      isBalanced: s.isBalanced,
      hasRetrospectiveRestatement: s.hasRetrospectiveRestatement,
      accountMap: s.accountMap
    };
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, ppeAssets, specialEntries, payrollRecords, accountTitles, companyName]);

  // Compute Unadjusted Summary (excluding adjusting entries) vs Adjusted Summary (including adjusting entries)
  const unadjustedSummaries = useMemo(() => {
    const nonAdjustingSpecial = specialEntries.filter(se => {
      const et = (se.entry_type || '').toLowerCase();
      return !et.includes('adjust');
    });
    return computeAccountingSummaries({
      sales,
      collections,
      cashReceipts,
      expenses,
      payments,
      cashDisbursements,
      ppeAssets,
      specialEntries: nonAdjustingSpecial,
      payrollRecords,
      accountTitles,
      companyName
    });
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, ppeAssets, specialEntries, payrollRecords, accountTitles, companyName]);

  const adjustingEntriesList = useMemo(() => {
    return specialEntries.filter(se => {
      if (companyName && companyName !== 'No Active Company' && se.company_name && se.company_name !== companyName) return false;
      const et = (se.entry_type || '').toLowerCase();
      return et.includes('adjust');
    });
  }, [specialEntries, companyName]);

  // Compute Trial Balance rows with Unadjusted (Dr/Cr), Adjustments (Dr/Cr), and Adjusted Trial Balance (Dr/Cr)
  const trialBalanceData = useMemo(() => {
    const defaultList: AccountTitle[] = accountTitles.length > 0 ? accountTitles : [
      { id: 1, code: '1010', title: 'Cash and Cash Equivalents', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit' },
      { id: 2, code: '1020', title: 'Accounts Receivable', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit' },
      { id: 3, code: '1030', title: 'Creditable Input VAT', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit' },
      { id: 4, code: '1040', title: 'Creditable Withholding Tax (2307)', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit' },
      { id: 5, code: '1510', title: 'Property, Plant & Equipment', type: 'Asset', category: 'Non-Current Assets', normal_balance: 'Debit' },
      { id: 6, code: '1520', title: 'Accumulated Depreciation', type: 'Asset', category: 'Non-Current Assets', normal_balance: 'Credit' },
      { id: 7, code: '2010', title: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit' },
      { id: 8, code: '2020', title: 'Output VAT Payable', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit' },
      { id: 9, code: '2030', title: 'Expanded Withholding Tax Payable', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit' },
      { id: 10, code: '2050', title: 'SSS, PhilHealth & Pag-IBIG Payables', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit' },
      { id: 11, code: '3010', title: "Capital Stock / Owner's Equity", type: 'Equity', category: 'Equity', normal_balance: 'Credit' },
      { id: 12, code: '3020', title: 'Retained Earnings', type: 'Equity', category: 'Equity', normal_balance: 'Credit' },
      { id: 13, code: '4010', title: 'Sales Revenue', type: 'Revenue', category: 'Operating Revenue', normal_balance: 'Credit' },
      { id: 14, code: '5010', title: 'Cost of Sales / Services', type: 'Cost of Sales', category: 'Cost of Sales', normal_balance: 'Debit' },
      { id: 15, code: '6010', title: 'Salaries, Wages & Benefits', type: 'Expense', category: 'Operating Expenses', normal_balance: 'Debit' },
      { id: 16, code: '6080', title: 'Depreciation Expense', type: 'Expense', category: 'Operating Expenses', normal_balance: 'Debit' },
      { id: 17, code: '6100', title: 'Operating Expenses', type: 'Expense', category: 'Operating Expenses', normal_balance: 'Debit' }
    ];

    const map: Record<string, {
      code: string;
      title: string;
      type: string;
      unadjDr: number;
      unadjCr: number;
      adjDr: number;
      adjCr: number;
      finalDr: number;
      finalCr: number;
    }> = {};

    defaultList.forEach(a => {
      map[a.code] = {
        code: a.code,
        title: a.title,
        type: a.type,
        unadjDr: 0,
        unadjCr: 0,
        adjDr: 0,
        adjCr: 0,
        finalDr: 0,
        finalCr: 0
      };
    });

    // Populate Unadjusted balances from unadjustedSummaries.accountMap
    Object.values(unadjustedSummaries.accountMap).forEach((acc: any) => {
      if (!map[acc.code]) {
        map[acc.code] = {
          code: acc.code,
          title: acc.title,
          type: acc.type,
          unadjDr: 0,
          unadjCr: 0,
          adjDr: 0,
          adjCr: 0,
          finalDr: 0,
          finalCr: 0
        };
      }
      const net = Math.round((acc.debit - acc.credit) * 100) / 100;
      if (net > 0) {
        map[acc.code].unadjDr = net;
      } else if (net < 0) {
        map[acc.code].unadjCr = Math.abs(net);
      }
    });

    // Populate Adjustments from adjustingEntriesList
    adjustingEntriesList.forEach(se => {
      (se.lines || []).forEach(line => {
        const code = line.account_code || '6100';
        if (!map[code]) {
          map[code] = {
            code,
            title: line.account_title || 'Adjustment Account',
            type: code.startsWith('1') ? 'Asset' : code.startsWith('2') ? 'Liability' : code.startsWith('3') ? 'Equity' : code.startsWith('4') ? 'Revenue' : code.startsWith('5') ? 'Cost of Sales' : 'Expense',
            unadjDr: 0,
            unadjCr: 0,
            adjDr: 0,
            adjCr: 0,
            finalDr: 0,
            finalCr: 0
          };
        }
        const amt = Number(line.amount) || 0;
        if ((line.type || '').toLowerCase() === 'debit') {
          map[code].adjDr = Math.round((map[code].adjDr + amt) * 100) / 100;
        } else {
          map[code].adjCr = Math.round((map[code].adjCr + amt) * 100) / 100;
        }
      });
    });

    // Compute Final Adjusted Trial Balance per account
    const rows = Object.values(map).map(r => {
      const netTotal = Math.round(((r.unadjDr - r.unadjCr) + (r.adjDr - r.adjCr)) * 100) / 100;
      return {
        ...r,
        finalDr: netTotal > 0 ? netTotal : 0,
        finalCr: netTotal < 0 ? Math.abs(netTotal) : 0
      };
    }).sort((a, b) => a.code.localeCompare(b.code));

    const totals = rows.reduce((acc, r) => ({
      unadjDr: Math.round((acc.unadjDr + r.unadjDr) * 100) / 100,
      unadjCr: Math.round((acc.unadjCr + r.unadjCr) * 100) / 100,
      adjDr: Math.round((acc.adjDr + r.adjDr) * 100) / 100,
      adjCr: Math.round((acc.adjCr + r.adjCr) * 100) / 100,
      finalDr: Math.round((acc.finalDr + r.finalDr) * 100) / 100,
      finalCr: Math.round((acc.finalCr + r.finalCr) * 100) / 100,
    }), { unadjDr: 0, unadjCr: 0, adjDr: 0, adjCr: 0, finalDr: 0, finalCr: 0 });

    return { rows, totals };
  }, [accountTitles, unadjustedSummaries, adjustingEntriesList]);

  const handleAddAdjustingEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setSpecialEntries) return;
    const amt = parseFloat(adjAmount) || 0;
    if (amt <= 0) {
      if (triggerAlert) triggerAlert('Please enter a valid adjusting entry amount greater than 0.', 'error');
      return;
    }
    if (adjDebitCode === adjCreditCode) {
      if (triggerAlert) triggerAlert('Debit and Credit accounts must be different.', 'error');
      return;
    }

    const allCoa = accountTitles.length > 0 ? accountTitles : trialBalanceData.rows;
    const drAcc = allCoa.find(a => a.code === adjDebitCode);
    const crAcc = allCoa.find(a => a.code === adjCreditCode);

    const newEntry: SpecialEntry = {
      id: Date.now(),
      company_name: companyName === 'No Active Company' ? '' : companyName,
      voucher_no: adjRefNo.trim() || `ADJ-${Date.now().toString().slice(-4)}`,
      entry_date: adjDate,
      entry_type: 'Adjusting Entry',
      description: adjDescription.trim() || `Adjusting Entry: Dr ${drAcc?.title || adjDebitCode} / Cr ${crAcc?.title || adjCreditCode}`,
      lines: [
        {
          account_code: adjDebitCode,
          account_title: drAcc?.title || 'Account',
          type: 'Debit',
          amount: amt
        },
        {
          account_code: adjCreditCode,
          account_title: crAcc?.title || 'Account',
          type: 'Credit',
          amount: amt
        }
      ],
      total_debit: amt,
      total_credit: amt
    };

    setSpecialEntries(prev => [...prev, newEntry]);
    if (triggerAlert) triggerAlert(`Adjusting Entry ${newEntry.voucher_no} (₱${amt.toLocaleString()}) added to Trial Balance!`, 'success');
    setAdjAmount('');
    setAdjDescription('');
    setAdjRefNo(`ADJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
    setShowAdjustmentForm(false);
  };

  const handleDeleteAdjustingEntry = (id: number) => {
    if (!setSpecialEntries) return;
    setSpecialEntries(prev => prev.filter(s => s.id !== id));
    if (triggerAlert) triggerAlert('Adjusting entry removed from Trial Balance.', 'info');
  };
  // Chart of Accounts Summary Calculation (showing only accounts with amounts)
  const arrangedAccounts = useMemo(() => {
    const map: Record<string, { code: string; title: string; type: string; debit: number; credit: number; netBalance: number }> = {};

    trialBalanceData.rows.forEach(r => {
      const dr = r.finalDr;
      const cr = r.finalCr;
      const net = (r.type === 'Asset' || r.type === 'Expense' || r.type === 'Cost of Sales') ? (dr - cr) : (cr - dr);
      map[r.code] = {
        code: r.code,
        title: r.title,
        type: r.type,
        debit: dr,
        credit: cr,
        netBalance: net
      };
    });

    // Ensure Retained Earnings reflects computed net retained earnings if not already in map
    if (Math.abs(bs.retainedEarnings) >= 0.01) {
      const reDr = bs.retainedEarnings < 0 ? Math.abs(bs.retainedEarnings) : 0;
      const reCr = bs.retainedEarnings > 0 ? bs.retainedEarnings : 0;
      if (!map['3020'] || (map['3020'].debit === 0 && map['3020'].credit === 0)) {
        map['3020'] = {
          code: '3020',
          title: 'Retained Earnings',
          type: 'Equity',
          debit: reDr,
          credit: reCr,
          netBalance: bs.retainedEarnings
        };
      }
    }

    // Filter to show ONLY Chart of Accounts with amounts (non-zero debit, credit, or netBalance)
    return Object.values(map)
      .filter(acc => Math.abs(acc.debit) >= 0.01 || Math.abs(acc.credit) >= 0.01 || Math.abs(acc.netBalance) >= 0.01)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [trialBalanceData.rows, bs.retainedEarnings]);

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
              {isBalanceSheetMode ? 'Trial Balance & Adjusting Entries Worksheet' : 'Statement of Financial Position (Card Summary)'}
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              {isBalanceSheetMode
                ? `Tabulated Trial Balance featuring Unadjusted-Adjustments-Adjusted Worksheet, Debit-Credit View, and Chart of Accounts Summary for ${companyName}.`
                : `Official Statement of Financial Position presenting Assets, Liabilities, and Equity in Card Summary format for ${companyName}.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isBalanceSheetMode && setSpecialEntries && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('worksheet');
                  setShowAdjustmentForm(!showAdjustmentForm);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{showAdjustmentForm ? 'Close Adjustment Form' : 'Add Adjusting Entry'}</span>
              </button>
            )}

            <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isBalanceSheetMode
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
            }`}>
              {isBalanceSheetMode ? 'Trial Balance (Tabulated)' : 'Card Summary Format Only'}
            </span>

            {!isBalanceSheetMode && (
              <button
                onClick={() => setShowAuditPanel(!showAuditPanel)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-4 h-4 text-cyan-400" />
                {showAuditPanel ? 'Hide Chart of Accounts Summary' : 'Chart of Accounts Summary'}
              </button>
            )}

            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
              bs.isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>{bs.isBalanced ? 'IN EQUILIBRIUM (BALANCED)' : 'OUT OF BALANCE'}</span>
            </div>
          </div>
        </div>

        {/* 3 SUB-TABS NAVIGATION BAR FOR TRIAL BALANCE MODE */}
        {isBalanceSheetMode && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-zinc-800/40">
            <button
              type="button"
              onClick={() => setActiveSubTab('worksheet')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'worksheet'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : `${theme.textMuted} hover:bg-zinc-800/30`
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>1. Unadjusted - Adjustments - Adjusted</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('debit_credit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'debit_credit'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : `${theme.textMuted} hover:bg-zinc-800/30`
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>2. Debit - Credit View</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('coa_summary')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'coa_summary'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : `${theme.textMuted} hover:bg-zinc-800/30`
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Chart of Accounts Summary</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeSubTab === 'coa_summary'
                  ? 'bg-slate-950/20 text-slate-950 font-extrabold'
                  : 'bg-cyan-500/15 text-cyan-400'
              }`}>
                {arrangedAccounts.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 1. TRIAL BALANCE WORKSHEET WITH ROOM FOR ADJUSTING ENTRIES */}
      {isBalanceSheetMode ? (
        <div className="space-y-6">
          {/* TAB 1: UNADJUSTED - ADJUSTMENTS - ADJUSTED WORKSHEET */}
          {activeSubTab === 'worksheet' && (
            <div className="space-y-6">
          {/* ROOM FOR ADJUSTING ENTRIES PANEL */}
          {(showAdjustmentForm || adjustingEntriesList.length > 0) && (
            <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-5 space-y-4`}>
              <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>Adjustments &amp; Adjusting Journal Entries Room ({adjustingEntriesList.length})</span>
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Record period-end accruals, deferrals, depreciation, or reclassifications. Adjustments automatically flow into the Trial Balance &quot;Adjustments&quot; and &quot;Adjusted Trial Balance&quot; columns.
                  </p>
                </div>
                {!showAdjustmentForm && setSpecialEntries && (
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentForm(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Adjustment</span>
                  </button>
                )}
              </div>

              {showAdjustmentForm && (
                <form onSubmit={handleAddAdjustingEntry} className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/30 grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-amber-300 mb-1">Adjustment Ref #</label>
                    <input
                      type="text"
                      value={adjRefNo}
                      onChange={(e) => setAdjRefNo(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono font-bold bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={adjDate}
                      onChange={(e) => setAdjDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-400 mb-1">Debit Account (Dr)</label>
                    <select
                      value={adjDebitCode}
                      onChange={(e) => setAdjDebitCode(e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-lg border bg-zinc-900 text-white font-semibold ${theme.borderInput}`}
                    >
                      {trialBalanceData.rows.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-teal-400 mb-1">Credit Account (Cr)</label>
                    <select
                      value={adjCreditCode}
                      onChange={(e) => setAdjCreditCode(e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-lg border bg-zinc-900 text-white font-semibold ${theme.borderInput}`}
                    >
                      {trialBalanceData.rows.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-300 mb-1">Amount (₱) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="0.00"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono font-bold bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Post</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdjustmentForm(false)}
                      className="py-2 px-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="md:col-span-6">
                    <label className="block font-bold text-zinc-400 mb-1">Particulars / Explanation of Adjusting Entry</label>
                    <input
                      type="text"
                      placeholder="e.g. To record accrued utilities, prepaid rent expiration, or supplies used..."
                      value={adjDescription}
                      onChange={(e) => setAdjDescription(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </form>
              )}

              {adjustingEntriesList.length > 0 && (
                <div className="overflow-x-auto border border-zinc-800/50 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/40 text-zinc-400 uppercase text-[10px] font-bold">
                        <th className="p-2.5">Ref #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Debit Account</th>
                        <th className="p-2.5">Credit Account</th>
                        <th className="p-2.5 text-right">Amount (₱)</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {adjustingEntriesList.map(adj => {
                        const drLine = (adj.lines || []).find(l => l.type?.toLowerCase() === 'debit');
                        const crLine = (adj.lines || []).find(l => l.type?.toLowerCase() === 'credit');
                        return (
                          <tr key={adj.id} className="hover:bg-zinc-800/20">
                            <td className="p-2.5 font-mono font-bold text-amber-400">{adj.voucher_no || `ADJ-${adj.id}`}</td>
                            <td className="p-2.5 font-mono text-zinc-400">{adj.entry_date}</td>
                            <td className={`p-2.5 ${theme.textMain}`}>{adj.description}</td>
                            <td className="p-2.5 font-semibold text-emerald-400">
                              {drLine ? `${drLine.account_code} - ${drLine.account_title}` : '-'}
                            </td>
                            <td className="p-2.5 font-semibold text-teal-400">
                              {crLine ? `${crLine.account_code} - ${crLine.account_title}` : '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-amber-300">
                              ₱{(Number(adj.total_debit || drLine?.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right">
                              {setSpecialEntries && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdjustingEntry(adj.id)}
                                  className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                  title="Delete Adjusting Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COMPLETE 6-COLUMN TRIAL BALANCE TABLE (UNADJUSTED, ADJUSTMENTS, ADJUSTED TRIAL BALANCE) */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${theme.borderCard} pb-3`}>
              <div>
                <h3 className="text-base font-bold font-display text-cyan-400 uppercase tracking-wider">
                  TRIAL BALANCE WORKSHEET (UNADJUSTED • ADJUSTMENTS • ADJUSTED)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  All active accounts with Unadjusted Trial Balance, Adjusting Entries room, and Adjusted Trial Balance in Debit / Credit format.
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Currency: ₱ (PHP)</span>
            </div>

            <div className="overflow-x-auto border border-zinc-800/50 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900/90 text-zinc-300 uppercase font-bold tracking-wider border-b border-zinc-700 text-[10px]">
                    <th rowSpan={2} className="p-3 border-r border-zinc-800 w-24">Code</th>
                    <th rowSpan={2} className="p-3 border-r border-zinc-800">Account Title</th>
                    <th rowSpan={2} className="p-3 border-r border-zinc-800 w-28">Type</th>
                    <th colSpan={2} className="p-2 text-center border-r border-zinc-800 bg-cyan-500/10 text-cyan-300">
                      Unadjusted Trial Balance
                    </th>
                    <th colSpan={2} className="p-2 text-center border-r border-zinc-800 bg-amber-500/10 text-amber-300">
                      Adjustments (Adjusting Entries)
                    </th>
                    <th colSpan={2} className="p-2 text-center bg-emerald-500/10 text-emerald-300">
                      Adjusted Trial Balance
                    </th>
                  </tr>
                  <tr className="bg-zinc-900/60 text-[10px] uppercase font-mono font-bold border-b-2 border-zinc-700">
                    <th className="p-2.5 text-right text-emerald-400 border-r border-zinc-800/60 w-28">Debit</th>
                    <th className="p-2.5 text-right text-teal-400 border-r border-zinc-800 w-28">Credit</th>
                    <th className="p-2.5 text-right text-amber-400 border-r border-zinc-800/60 w-28">Debit</th>
                    <th className="p-2.5 text-right text-amber-300 border-r border-zinc-800 w-28">Credit</th>
                    <th className="p-2.5 text-right text-emerald-400 border-r border-zinc-800/60 w-28">Debit</th>
                    <th className="p-2.5 text-right text-teal-400 w-28">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {trialBalanceData.rows.map((r) => (
                    <tr key={r.code} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/25'} transition-colors`}>
                      <td className="p-2.5 font-mono font-bold text-cyan-400 border-r border-zinc-800/40">{r.code}</td>
                      <td className={`p-2.5 font-semibold ${theme.textMain} border-r border-zinc-800/40`}>{r.title}</td>
                      <td className="p-2.5 border-r border-zinc-800/40">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400' :
                          r.type === 'Liability' ? 'bg-amber-500/10 text-amber-400' :
                          r.type === 'Equity' ? 'bg-purple-500/10 text-purple-400' :
                          r.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      {/* Unadjusted */}
                      <td className="p-2.5 text-right font-mono font-semibold text-emerald-400 border-r border-zinc-800/30">
                        {r.unadjDr > 0 ? `₱${r.unadjDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-teal-400 border-r border-zinc-800/60">
                        {r.unadjCr > 0 ? `₱${r.unadjCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      {/* Adjustments */}
                      <td className="p-2.5 text-right font-mono font-semibold text-amber-400 bg-amber-500/5 border-r border-zinc-800/30">
                        {r.adjDr > 0 ? `₱${r.adjDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-amber-300 bg-amber-500/5 border-r border-zinc-800/60">
                        {r.adjCr > 0 ? `₱${r.adjCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      {/* Adjusted */}
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400 bg-emerald-500/5 border-r border-zinc-800/30">
                        {r.finalDr > 0 ? `₱${r.finalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-teal-400 bg-emerald-500/5">
                        {r.finalCr > 0 ? `₱${r.finalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-900 font-bold text-xs border-t-2 border-cyan-500/40">
                    <td colSpan={3} className="p-3 uppercase tracking-wider text-cyan-300 border-r border-zinc-800">
                      TOTAL TRIAL BALANCE
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 border-r border-zinc-800/40">
                      ₱{trialBalanceData.totals.unadjDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-teal-400 border-r border-zinc-800">
                      ₱{trialBalanceData.totals.unadjCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400 border-r border-zinc-800/40">
                      ₱{trialBalanceData.totals.adjDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-300 border-r border-zinc-800">
                      ₱{trialBalanceData.totals.adjCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 border-r border-zinc-800/40">
                      ₱{trialBalanceData.totals.finalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-teal-400">
                      ₱{trialBalanceData.totals.finalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
            </div>
          )}

          {/* TAB 2: SIDE-BY-SIDE DEBIT / CREDIT CARD SUMMARY (LEFT = ASSETS, RIGHT = LIABILITIES & EQUITY) */}
          {activeSubTab === 'debit_credit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT CARD: ASSETS (WITH DEBIT & CREDIT COLUMNS) */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col justify-between space-y-4`}>
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b ${theme.borderCard} pb-3`}>
                <h3 className="text-base font-bold font-display text-cyan-400 uppercase tracking-wider">
                  ASSETS
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">Currency: ₱ (PHP)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`bg-zinc-500/10 ${theme.textTitle} uppercase font-bold tracking-wider border-b-2 border-zinc-700/60`}>
                      <th className="p-2.5">ASSETS</th>
                      <th className="p-2.5 w-32 text-right font-mono text-emerald-400">DEBIT</th>
                      <th className="p-2.5 w-32 text-right font-mono text-teal-400">CREDIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20 font-sans">
                    {/* CURRENT ASSETS */}
                    <tr className="bg-cyan-500/10 font-bold">
                      <td className="p-2 text-cyan-300 uppercase tracking-wider">CURRENT ASSETS</td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>CASH AND CASH EQ.</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        {bs.cash >= 0 ? `₱${bs.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2 text-right font-mono text-rose-400">
                        {bs.cash < 0 ? `₱${Math.abs(bs.cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>A/R (ACCOUNTS RECEIVABLE)</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        ₱{bs.ar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>CREDITABLE INPUT VAT</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        ₱{bs.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>CREDITABLE WITHHOLDING TAX (2307)</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        ₱{bs.cwt2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    {bs.supplierAdvances > 0 && (
                      <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                        <td className="p-2 pl-5 font-medium text-purple-400">ADVANCES TO SUPPLIERS</td>
                        <td className="p-2 text-right font-mono font-semibold text-purple-400">
                          ₱{bs.supplierAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      </tr>
                    )}

                    <tr className="font-bold bg-cyan-500/5 text-cyan-400 border-t border-b border-cyan-500/20">
                      <td className="p-2.5 uppercase">TOTAL CURRENT ASSETS</td>
                      <td className="p-2.5 text-right font-mono">
                        ₱{bs.totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    {/* NON-CURRENT ASSETS */}
                    <tr className="bg-cyan-500/10 font-bold">
                      <td className="p-2 text-cyan-300 uppercase tracking-wider pt-3">NON-CURRENT ASSETS</td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>PPE (PROPERTY, PLANT & EQUIPMENT)</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        ₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className="p-2 pl-5 font-medium text-rose-400">LESS: ACCUMULATED DEPRECIATION</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-rose-400">
                        ₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>A/R NON-CURRENT PORTION</td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">₱0.00</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                    </tr>

                    <tr className="font-bold bg-cyan-500/5 text-cyan-400 border-t border-b border-cyan-500/20">
                      <td className="p-2.5 uppercase">TOTAL NON-CURRENT ASSETS</td>
                      <td className="p-2.5 text-right font-mono">
                        ₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono text-rose-400">
                        ₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTAL ASSETS FOOTER */}
            <div className="p-3.5 bg-cyan-500/15 border border-cyan-500/30 rounded-xl">
              <div className="grid grid-cols-12 items-center text-xs font-bold text-cyan-300">
                <span className="col-span-6 uppercase tracking-wider text-sm">TOTAL ASSETS (NET)</span>
                <span className="col-span-3 text-right font-mono text-emerald-400">
                  ₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="col-span-3 text-right font-mono text-zinc-400">
                  ₱0.00
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT CARD: LIABILITIES & OWNER'S EQUITY (WITH DEBIT & CREDIT COLUMNS) */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col justify-between space-y-4`}>
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b ${theme.borderCard} pb-3`}>
                <h3 className="text-base font-bold font-display text-amber-400 uppercase tracking-wider">
                  LIABILITIES &amp; OWNER&apos;S EQUITY
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">Currency: ₱ (PHP)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`bg-zinc-500/10 ${theme.textTitle} uppercase font-bold tracking-wider border-b-2 border-zinc-700/60`}>
                      <th className="p-2.5">LIABILITIES &amp; EQUITY</th>
                      <th className="p-2.5 w-32 text-right font-mono text-emerald-400">DEBIT</th>
                      <th className="p-2.5 w-32 text-right font-mono text-teal-400">CREDIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20 font-sans">
                    {/* CURRENT LIABILITIES */}
                    <tr className="bg-amber-500/10 font-bold">
                      <td className="p-2 text-amber-300 uppercase tracking-wider">CURRENT LIABILITIES</td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>VAT OUTPUT PAYABLE</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-teal-400">
                        ₱{bs.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>ACCOUNTS PAYABLE</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-teal-400">
                        ₱{bs.ap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>EXPANDED WITHHOLDING TAX PAYABLE</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-teal-400">
                        ₱{bs.ewtPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {bs.customerAdvances > 0 && (
                      <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                        <td className="p-2 pl-5 font-medium text-cyan-400">CUSTOMER ADVANCES (OVERPAYMENT CREDIT)</td>
                        <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                        <td className="p-2 text-right font-mono font-semibold text-cyan-400">
                          ₱{bs.customerAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}

                    {bs.payrollDeductionsPayable > 0 && (
                      <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                        <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>STATUTORY &amp; PAYROLL PAYABLES</td>
                        <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                        <td className="p-2 text-right font-mono font-semibold text-teal-400">
                          ₱{bs.payrollDeductionsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}

                    <tr className="font-bold bg-amber-500/5 text-amber-400 border-t border-b border-amber-500/20">
                      <td className="p-2.5 uppercase">TOTAL CURRENT LIAB</td>
                      <td className="p-2.5 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2.5 text-right font-mono">
                        ₱{bs.totalCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* NON-CURRENT LIABILITIES */}
                    <tr className="bg-amber-500/10 font-bold">
                      <td className="p-2 text-amber-300 uppercase tracking-wider pt-3">NON-CURRENT LIABILITIES (PAS 1.60)</td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>LOANS &amp; LEASE LIABILITIES (NON-CURRENT)</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-teal-400">
                        ₱{(bs.loansPayableNonCurrent + bs.leaseLiabilityNonCurrent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>DEFERRED TAX &amp; RETIREMENT OBLIGATIONS (PAS 12 / 19)</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-teal-400">
                        ₱{(bs.deferredTaxLiability + bs.retirementBenefitObligation + bs.otherNonCurrentLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className="font-bold bg-amber-500/5 text-amber-400 border-t border-b border-amber-500/20">
                      <td className="p-2.5 uppercase">TOTAL NON CURRENT LIAB</td>
                      <td className="p-2.5 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2.5 text-right font-mono">
                        ₱{bs.totalNonCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* OWNER'S EQUITY */}
                    <tr className="bg-purple-500/10 font-bold">
                      <td className="p-2 text-purple-300 uppercase tracking-wider pt-3">OWNER&apos;S EQUITY &amp; OCI</td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                      <td className="p-2 text-right font-mono text-zinc-500"></td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>CAPITAL SHARES</td>
                      <td className="p-2 text-right font-mono text-zinc-400">₱0.00</td>
                      <td className="p-2 text-right font-mono font-semibold text-purple-400">
                        ₱{bs.capitalStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                      <td className={`p-2 pl-5 font-medium ${theme.textMain}`}>RETAINED EARNINGS</td>
                      <td className="p-2 text-right font-mono text-rose-400">
                        {bs.retainedEarnings < 0 ? `₱${Math.abs(bs.retainedEarnings).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                        {bs.retainedEarnings >= 0 ? `₱${bs.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                    </tr>

                    {bs.totalOCI !== 0 && (
                      <tr className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                        <td className={`p-2 pl-5 font-medium text-cyan-400`}>ACCUMULATED OCI RESERVES (PAS 16 / 19 / PFRS 9)</td>
                        <td className="p-2 text-right font-mono text-rose-400">
                          {bs.totalOCI < 0 ? `₱${Math.abs(bs.totalOCI).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-cyan-400">
                          {bs.totalOCI >= 0 ? `₱${bs.totalOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                        </td>
                      </tr>
                    )}

                    <tr className="font-bold bg-purple-500/5 text-purple-400 border-t border-b border-purple-500/20">
                      <td className="p-2.5 uppercase">TOTAL OWNER&apos;S EQUITY</td>
                      <td className="p-2.5 text-right font-mono text-rose-400">
                        {bs.totalEquity < 0 ? `₱${Math.abs(bs.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        {bs.totalEquity >= 0 ? `₱${bs.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₱0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY FOOTER */}
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl">
              <div className="grid grid-cols-12 items-center text-xs font-bold text-amber-300">
                <span className="col-span-6 uppercase tracking-wider text-sm">TOTAL LIABILITIES &amp; EQUITY</span>
                <span className="col-span-3 text-right font-mono text-zinc-400">
                  ₱0.00
                </span>
                <span className="col-span-3 text-right font-mono text-teal-400">
                  ₱{bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          </div>
          )}
        </div>
      ) : (
        /* 2. STATEMENT OF FINANCIAL POSITION: CARD SUMMARY FORMAT ONLY (PAS 1 COMPLIANT) */
        <div className="space-y-4">
          {bs.hasRetrospectiveRestatement && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
              <div>
                <span className="font-bold uppercase tracking-wider block">PAS 1.40A Third Balance Sheet Trigger Active (Retrospective Restatement Detected)</span>
                <span className="text-zinc-300">A retrospective accounting policy change or prior-period error restatement (PAS 8) was recorded. PAS 1.40A requires presenting an opening Third Statement of Financial Position as at the beginning of the preceding comparative period.</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 font-mono font-bold whitespace-nowrap">PAS 1.40A / PAS 8</span>
            </div>
          )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ASSETS */}
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
          <h3 className={`text-base font-bold font-display border-b ${theme.borderCard} pb-2 text-cyan-400 uppercase tracking-wider`}>
            ASSETS (PAS 1 CURRENT / NON-CURRENT)
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Assets (PAS 1.66)</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Cash and Cash Equivalents (#1010)</span>
              <span className="font-mono font-semibold">₱{bs.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Trade &amp; Accounts Receivable — Gross (#1020)</span>
              <span className="font-mono font-semibold">₱{bs.arGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.allowanceForECL > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-rose-400 pl-3">
                <span>Less: Allowance for Expected Credit Losses — PFRS 9 ECL (#1025)</span>
                <span className="font-mono font-semibold">(₱{bs.allowanceForECL.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>
            )}
            {bs.contractAssets > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400">
                <span>Contract Assets — PFRS 15 (#1060)</span>
                <span className="font-mono font-semibold">₱{bs.contractAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.supplierAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-purple-400">
                <span>Advances to Suppliers (PAS 1.32 No Offsetting)</span>
                <span className="font-mono font-semibold">₱{bs.supplierAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Input VAT (#1030)</span>
              <span className="font-mono font-semibold">₱{bs.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Withholding Tax — BIR 2307 (#1040)</span>
              <span className="font-mono font-semibold">₱{bs.cwt2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(bs.prepaidExpenses > 0 || bs.otherCurrentAssets > 0) && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Prepaid Expenses &amp; Other Current Assets (#1050)</span>
                <span className="font-mono font-semibold">₱{(bs.prepaidExpenses + bs.otherCurrentAssets).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.assetsHeldForSale > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-amber-400 font-semibold">
                <span>Non-Current Assets Held for Sale — PFRS 5 (#1090)</span>
                <span className="font-mono">₱{bs.assetsHeldForSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Total Current Assets</span>
              <span className="font-mono">₱{bs.totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Non-Current Assets (PAS 1.66 / PAS 16 / PFRS 16 / PAS 12)</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Property, Plant &amp; Equipment — Gross (#1510)</span>
              <span className="font-mono font-semibold">₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-rose-400 pl-3">
              <span>Less: Accumulated Depreciation &amp; Impairment (#1520)</span>
              <span className="font-mono font-semibold">(₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            {bs.rouAssetNet > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Right-of-Use (ROU) Lease Assets — Net (PFRS 16 #1530)</span>
                <span className="font-mono font-semibold">₱{bs.rouAssetNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.intangibleAssets > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Intangible Assets (PAS 38 #1540)</span>
                <span className="font-mono font-semibold">₱{bs.intangibleAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.deferredTaxAsset > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-emerald-400">
                <span>Deferred Tax Asset — Non-Current (PAS 1.56 / PAS 12 #1550)</span>
                <span className="font-mono font-semibold">₱{bs.deferredTaxAsset.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.otherNonCurrentAssets > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Other Non-Current Financial &amp; Biological Assets</span>
                <span className="font-mono font-semibold">₱{bs.otherNonCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Total Non-Current Assets</span>
              <span className="font-mono">₱{bs.totalNonCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
            LIABILITIES &amp; EQUITY (PAS 1)
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Liabilities (PAS 1.69)</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Trade &amp; Accounts Payable (#2010)</span>
              <span className="font-mono font-semibold">₱{bs.ap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.customerAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400 font-semibold">
                <span>Customer Advances (PAS 1.32 No Offsetting)</span>
                <span className="font-mono">₱{bs.customerAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.contractLiabilities > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400">
                <span>Contract Liabilities / Unearned Revenue — PFRS 15 (#2060)</span>
                <span className="font-mono font-semibold">₱{bs.contractLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Output VAT Payable (#2020)</span>
              <span className="font-mono font-semibold">₱{bs.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Expanded Withholding Tax Payable — 0619-E (#2030)</span>
              <span className="font-mono font-semibold">₱{bs.ewtPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.incomeTaxPayable > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-amber-300">
                <span>Current Income Tax Payable — PAS 12 (#2040)</span>
                <span className="font-mono font-semibold">₱{bs.incomeTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {bs.payrollDeductionsPayable > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>SSS, PhilHealth, Pag-IBIG &amp; Tax Withheld (#2035-2050)</span>
                <span className="font-mono font-semibold">₱{bs.payrollDeductionsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {(bs.leaseLiabilityCurrent > 0 || bs.provisionsCurrent > 0 || bs.otherCurrentLiabilities > 0) && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Current Lease Liabilities (PFRS 16) &amp; Provisions (PAS 37)</span>
                <span className="font-mono font-semibold">₱{(bs.leaseLiabilityCurrent + bs.provisionsCurrent + bs.otherCurrentLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-amber-400">
              <span>Total Current Liabilities</span>
              <span className="font-mono">₱{bs.totalCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Non-Current Liabilities (PAS 1.69 / PFRS 16 / PAS 12 / PAS 19)</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Long-Term Loans &amp; Non-Current Lease Liabilities (#2510 / #2520)</span>
              <span className="font-mono font-semibold">₱{(bs.loansPayableNonCurrent + bs.leaseLiabilityNonCurrent).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(bs.deferredTaxLiability > 0 || bs.retirementBenefitObligation > 0 || bs.otherNonCurrentLiabilities > 0) && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>Deferred Tax Liability (PAS 12) &amp; Retirement Obligation (PAS 19)</span>
                <span className="font-mono font-semibold">₱{(bs.deferredTaxLiability + bs.retirementBenefitObligation + bs.otherNonCurrentLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-amber-400">
              <span>Total Non-Current Liabilities</span>
              <span className="font-mono">₱{bs.totalNonCurrentLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Stockholders&apos; Equity &amp; OCI Reserves</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Capital Stock / Paid-in Capital (#3010)</span>
              <span className="font-mono font-semibold">₱{bs.capitalStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Retained Earnings (#3020)</span>
              <span className={`font-mono font-semibold ${bs.retainedEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₱{bs.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {bs.totalOCI !== 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400">
                <span>Accumulated Other Comprehensive Income — OCI (#3040-3060)</span>
                <span className="font-mono font-semibold">₱{bs.totalOCI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-purple-400">
              <span>Total Stockholders&apos; Equity</span>
              <span className="font-mono">₱{bs.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 pt-3">
            <span>TOTAL LIABILITIES &amp; EQUITY</span>
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
      </div>
      )}

      {/* TAB 3 (IN TRIAL BALANCE) OR OPTIONAL PANEL (IN STATEMENT OF FINANCIAL POSITION): CHART OF ACCOUNTS SUMMARY */}
      {((isBalanceSheetMode && activeSubTab === 'coa_summary') || (!isBalanceSheetMode && showAuditPanel)) && (
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-5 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/30 pb-4">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <Layers className="w-4 h-4 text-cyan-400" />
                Chart of Accounts Summary
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Summary of active Chart of Accounts with non-zero balances and postings for {companyName}.
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

          {/* SUMMARY CARDS */}
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

          {/* ARRANGED ACCOUNT TITLES TABLE (ONLY ACCOUNTS WITH AMOUNTS) */}
          <div className="overflow-x-auto border border-zinc-800/40 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit Posting (Dr)</th>
                  <th className="p-3 text-right">Credit Posting (Cr)</th>
                  <th className="p-3 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 font-medium">
                      No chart of accounts with non-zero amounts found.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc, idx) => (
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
                      <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                        ₱{acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-teal-400 font-semibold">
                        ₱{acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${acc.netBalance >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                        ₱{acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
