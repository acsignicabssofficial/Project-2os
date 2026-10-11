import React, { useState, useMemo } from 'react';
import { Book, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Sale, Collection, Expense, Payment, SpecialEntry, AccountTitle, Company, PPEAsset, PayrollRecord } from '../types';
import { buildMasterJournalEntries } from '../utils/accounting';

interface GeneralLedgerTabProps {
  sales: Sale[];
  collections: Collection[];
  cashReceipts?: any[];
  expenses: Expense[];
  payments: Payment[];
  cashDisbursements?: any[];
  specialEntries?: SpecialEntry[];
  accountTitles?: AccountTitle[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
  globalSearch?: string;
  mode?: 'GENERAL' | 'SPECIAL';
}


export default function GeneralLedgerTab({
  sales,
  collections,
  cashReceipts = [],
  expenses,
  payments,
  cashDisbursements = [],
  specialEntries = [],
  accountTitles = [],
  ppeAssets = [],
  payrollRecords = [],
  activeCompany,
  theme,
  mode = 'GENERAL'
}: GeneralLedgerTabProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Requirement 5: Collapsible Account Titles in Ledger
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  const toggleExpandAccount = (code: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const toggleExpandAllAccounts = () => {
    const allExpanded = displayAccounts.every(a => expandedAccounts[a.code]);
    const nextState: Record<string, boolean> = {};
    displayAccounts.forEach(a => {
      nextState[a.code] = !allExpanded;
    });
    setExpandedAccounts(nextState);
  };

  // Default Chart of Accounts list if none provided
  const coaList = useMemo(() => {
    if (accountTitles.length > 0) return accountTitles;
    return [
      { code: '1010', title: 'Cash and Cash Equivalents', category: 'Current Assets', type: 'Asset' },
      { code: '1020', title: 'Accounts Receivable', category: 'Current Assets', type: 'Asset' },
      { code: '1030', title: 'Creditable Input VAT', category: 'Current Assets', type: 'Asset' },
      { code: '1040', title: 'Creditable Withholding Tax (2307)', category: 'Current Assets', type: 'Asset' },
      { code: '1510', title: 'Property, Plant & Equipment', category: 'Non-Current Assets', type: 'Asset' },
      { code: '1520', title: 'Accumulated Depreciation', category: 'Non-Current Assets', type: 'Asset' },
      { code: '2010', title: 'Accounts Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '2020', title: 'Output VAT Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '2030', title: 'Expanded Withholding Tax Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '3010', title: "Capital Stock / Owner's Equity", category: "Owner's Equity", type: 'Equity' },
      { code: '3020', title: 'Retained Earnings', category: "Owner's Equity", type: 'Equity' },
      { code: '4010', title: 'Sales Revenue', category: 'Revenue', type: 'Revenue' },
      { code: '6010', title: 'Depreciation Expense', category: 'Operating Expense', type: 'Expense' }
    ];
  }, [accountTitles]);

  // Aggregate postings by account title code
  const ledgerMap = useMemo(() => {
    const map: Record<string, {
      code: string;
      title: string;
      type: string;
      postings: Array<{
        date: string;
        ref: string;
        particulars: string;
        debit: number;
        credit: number;
        runningBalance: number;
        bookType: 'GENERAL' | 'SPECIAL';
      }>;
      totalDebit: number;
      totalCredit: number;
      netBalance: number;
    }> = {};

    // Initialize map
    coaList.forEach(a => {
      map[a.code] = {
        code: a.code,
        title: a.title,
        type: a.type,
        postings: [],
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0
      };
    });

    const addPosting = (
      code: string,
      title: string,
      date: string,
      ref: string,
      particulars: string,
      dr: number,
      cr: number,
      bookType: 'GENERAL' | 'SPECIAL' = 'GENERAL'
    ) => {
      if (!map[code]) {
        map[code] = {
          code,
          title,
          type: 'Asset',
          postings: [],
          totalDebit: 0,
          totalCredit: 0,
          netBalance: 0
        };
      }

      // Strictly post General Journal entries ONLY to General Ledger, and Special Journal entries ONLY to Special Ledger
      if (bookType !== mode) {
        return;
      }

      map[code].postings.push({
        date,
        ref,
        particulars,
        debit: dr,
        credit: cr,
        runningBalance: 0,
        bookType
      });
      map[code].totalDebit += dr;
      map[code].totalCredit += cr;
    };

    // Master Double-Entry Postings strictly synchronized from Books of Accounts
    const masterEntries = buildMasterJournalEntries({
      sales,
      collections,
      cashReceipts,
      expenses,
      payments,
      cashDisbursements,
      specialEntries,
      accountTitles: coaList,
      ppeAssets,
      payrollRecords,
      companyName: activeCompany?.company_name || ''
    });

    masterEntries.forEach(entry => {
      // Special Journal & Special Ledger = All transactions related to Sales & Purchases (Sales, Collections, Cash Receipts, Purchases/Expenses, Cash Disbursements, Payments)
      // General Journal & General Ledger = Other transactions (Adjusting, Closing, Reversing, Payroll, PPE Acquisition, Depreciation, Tax Payment, etc.)
      const isSalesOrPurchasesType = ['Sales', 'Collection', 'Expense', 'Payment'].includes(entry.ref_type);
      const bookType: 'GENERAL' | 'SPECIAL' = isSalesOrPurchasesType ? 'SPECIAL' : 'GENERAL';

      entry.debits.forEach(d => {
        addPosting(d.account_code, d.account_title, entry.date, entry.ref_no || entry.entry_no, entry.description, Number(d.amount) || 0, 0, bookType);
      });
      entry.credits.forEach(c => {
        addPosting(c.account_code, c.account_title, entry.date, entry.ref_no || entry.entry_no, entry.description, 0, Number(c.amount) || 0, bookType);
      });
    });

    // Calculate running balance per account
    Object.keys(map).forEach(code => {
      const item = map[code];
      item.postings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let run = 0;
      item.postings.forEach(p => {
        if (item.type === 'Asset' || item.type === 'Expense' || item.type === 'Cost of Sales') {
          run += (p.debit - p.credit);
        } else {
          run += (p.credit - p.debit);
        }
        p.runningBalance = run;
      });

      item.netBalance = run;
    });

    return map;
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, specialEntries, ppeAssets, payrollRecords, coaList, activeCompany, mode]);

  // Accounts that actually have posted transactions in this ledger
  const activeAccountsWithTransactions = useMemo(() => {
    return Object.keys(ledgerMap)
      .filter(k => ledgerMap[k].postings.length > 0)
      .map(k => ledgerMap[k]);
  }, [ledgerMap]);

  // Accounts list for select dropdown & table view (only show accounts with transactions)
  const displayAccounts = useMemo(() => {
    let list = activeAccountsWithTransactions;
    if (selectedAccount !== 'ALL') {
      list = list.filter(a => a.code === selectedAccount);
    }
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(a =>
        a.code.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeAccountsWithTransactions, selectedAccount, searchTerm]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Book className="w-6 h-6 text-cyan-400" />
              {mode === 'GENERAL'
                ? 'General Ledger (Other Transactions, Adjusting Entries, Payroll, PPE — Posted from General Journal)'
                : 'Special Ledger (All Sales & Purchases Transactions — Posted from Special Journal)'}
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              {mode === 'GENERAL'
                ? 'General Ledger: T-Accounts and running balances posted exclusively from the General Journal (Adjusting Entries, Payroll, PPE Acquisition & Depreciation, Closing, Reversing, and Other Transactions).'
                : 'Special Ledger: T-Accounts and running balances posted exclusively from the Special Journal (Subsidiary Sales, Cash Receipts, Collections, Subsidiary Purchases, Cash Disbursements, and Payments).'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search account code/title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ALL" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>All Accounts with Transactions ({activeAccountsWithTransactions.length})</option>
                {activeAccountsWithTransactions.map(a => (
                  <option key={a.code} value={a.code} className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>
                    [{a.code}] {a.title} ({a.postings.length})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleExpandAllAccounts}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              {displayAccounts.every(a => expandedAccounts[a.code]) ? '▲ Collapse All Accounts' : '▼ Expand All Accounts'}
            </button>
          </div>
        </div>
      </div>

      {/* T-ACCOUNT CARDS (Requirement 5: Shows list of account titles with sum Dr/Cr/Running Balance, collapsible on click) */}
      <div className="space-y-4">
        {displayAccounts.length === 0 ? (
          <div className={`p-8 border ${theme.borderCard} ${theme.bgCard} rounded-2xl text-center text-xs ${theme.textMuted}`}>
            No accounts with posted transactions found for this ledger.
          </div>
        ) : displayAccounts.map((acc) => {
          const isExpanded = !!expandedAccounts[acc.code];

          return (
            <div key={acc.code} className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden transition-all duration-150`}>
              {/* Account Card Header (Click to toggle postings list) */}
              <div 
                onClick={() => toggleExpandAccount(acc.code)}
                className={`p-4 ${isExpanded ? 'border-b ' + theme.borderCard : ''} bg-zinc-500/5 hover:bg-zinc-500/10 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    aria-label="Toggle account transactions"
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                    CODE: {acc.code}
                  </span>
                  <h3 className={`font-bold text-sm ${theme.textTitle}`}>{acc.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    acc.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400' :
                    acc.type === 'Liability' ? 'bg-amber-500/10 text-amber-400' :
                    acc.type === 'Equity' ? 'bg-purple-500/10 text-purple-400' :
                    acc.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {acc.type}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({acc.postings.length} {acc.postings.length === 1 ? 'entry' : 'entries'})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
                  <div className="text-zinc-400">Total Dr: <span className="text-emerald-400 font-bold">₱{acc.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="text-zinc-400">Total Cr: <span className="text-teal-400 font-bold">₱{acc.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="text-zinc-300 bg-zinc-500/10 px-3 py-1 rounded-lg border border-zinc-700/30">
                    Running Balance: <span className="text-cyan-300 font-bold">₱{acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Postings Table (Shown when expanded) */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                        <th className="p-3 w-28">Posting Date</th>
                        <th className="p-3 w-32">Ref / Voucher #</th>
                        <th className="p-3">Particulars & Transaction Details</th>
                        <th className="p-3 text-right w-32">Debit (Dr)</th>
                        <th className="p-3 text-right w-32">Credit (Cr)</th>
                        <th className="p-3 text-right w-36">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.borderCard}`}>
                      {acc.postings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-500">
                            No transactions posted to this account title yet.
                          </td>
                        </tr>
                      ) : (
                        acc.postings.map((p, idx) => (
                          <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                            <td className="p-3 font-mono text-zinc-300">{p.date}</td>
                            <td className="p-3 font-mono font-bold text-cyan-400">{p.ref}</td>
                            <td className={`p-3 font-medium ${theme.textMain}`}>{p.particulars}</td>
                            <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                              {p.debit > 0 ? `₱${p.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-teal-400">
                              {p.credit > 0 ? `₱${p.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-cyan-300">
                              ₱{p.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
