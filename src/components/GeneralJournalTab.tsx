import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Pencil, X } from 'lucide-react';
import { Sale, Collection, Expense, Payment, SpecialEntry, AccountTitle, Company, JournalEntry, PPEAsset, PayrollRecord } from '../types';
import { computeSalesVAT, computeExpenseVAT, buildMasterJournalEntries } from '../utils/accounting';

interface GeneralJournalTabProps {
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
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function GeneralJournalTab({
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
  triggerAlert,
  globalSearch
}: GeneralJournalTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'GENERAL' | 'SPECIAL'>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterBalance, setFilterBalance] = useState<'ALL' | 'BALANCED' | 'UNBALANCED'>('ALL');

  // Custom overrides for edited journal entries
  const [editedEntries, setEditedEntries] = useState<Record<string, JournalEntry>>({});
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Compute double-entry journal entries automatically
  const baseJournalEntries = useMemo(() => {
    return buildMasterJournalEntries({
      sales,
      collections,
      cashReceipts,
      expenses,
      payments,
      cashDisbursements,
      specialEntries,
      accountTitles,
      ppeAssets,
      payrollRecords,
      companyName: activeCompany?.company_name || ''
    });
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, specialEntries, accountTitles, ppeAssets, payrollRecords, activeCompany]);

  // Merge base entries with edited overrides
  const journalEntries = useMemo(() => {
    return baseJournalEntries.map(e => editedEntries[e.entry_no] || e).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [baseJournalEntries, editedEntries]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    return journalEntries.filter(entry => {
      const isSpecial = ['Sales', 'Collection', 'Expense', 'Payment', 'Cancellation'].includes(entry.ref_type);
      const isGeneral = !isSpecial;

      if (filterCategory === 'GENERAL' && !isGeneral) return false;
      if (filterCategory === 'SPECIAL' && !isSpecial) return false;

      const matchesType = filterType === 'ALL' || entry.ref_type.toLowerCase() === filterType.toLowerCase();

      const matchesAccount = filterAccount === 'ALL' ||
        entry.debits.some(d => d.account_code === filterAccount || d.account_title.toLowerCase().includes(filterAccount.toLowerCase())) ||
        entry.credits.some(c => c.account_code === filterAccount || c.account_title.toLowerCase().includes(filterAccount.toLowerCase()));

      const matchesSearch = !q ||
        entry.entry_no.toLowerCase().includes(q) ||
        entry.ref_no.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.date.includes(q) ||
        entry.debits.some(d => d.account_title.toLowerCase().includes(q) || d.account_code.includes(q)) ||
        entry.credits.some(c => c.account_title.toLowerCase().includes(q) || c.account_code.includes(q));

      const matchesStart = !startDate || entry.date >= startDate;
      const matchesEnd = !endDate || entry.date <= endDate;

      // Check balance
      const totalDr = entry.debits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const totalCr = entry.credits.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const isBal = Math.abs(totalDr - totalCr) < 0.01;

      const matchesBalance = filterBalance === 'ALL' || (filterBalance === 'BALANCED' && isBal) || (filterBalance === 'UNBALANCED' && !isBal);

      return matchesType && matchesAccount && matchesSearch && matchesStart && matchesEnd && matchesBalance;
    });
  }, [journalEntries, searchTerm, globalSearch, filterType, filterCategory, filterAccount, startDate, endDate, filterBalance]);

  // Handle Editing Entry
  const handleStartEdit = (entry: JournalEntry) => {
    setEditingEntry(JSON.parse(JSON.stringify(entry)));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const totalDr = editingEntry.debits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalCr = editingEntry.credits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    if (Math.abs(totalDr - totalCr) >= 0.01) {
      alert(`Transaction rejected: Journal entry is unbalanced! Total Debit (₱${totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}) does not equal Total Credit (₱${totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Difference: ₱${Math.abs(totalDr - totalCr).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
      return;
    }

    setEditedEntries(prev => ({
      ...prev,
      [editingEntry.entry_no]: editingEntry
    }));

    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <BookOpen className="w-6 h-6 text-cyan-400" />
              General Journal (Books of Original Entry)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              General Journal: Chronological recording of all accounting transactions and double-entry debits and credits from Sales, Collections, Expenses, Payments, Payroll, and Special Entries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Total Posted Entries:</span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              {filteredEntries.length} Entries
            </span>
          </div>
        </div>

        {/* CATEGORY SELECTOR TABS */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📖 All Books & Entries ({journalEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('GENERAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              filterCategory === 'GENERAL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📒 General Journal (Tax, Payroll, Depreciation, Adjusting, Closing, Reversing)
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('SPECIAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              filterCategory === 'SPECIAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📗 Special Journal (Sales, Collections, Expenses, Payments, Cancellations)
          </button>
        </div>

        {/* COMPREHENSIVE FILTERING CONTROLS */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Filter Type */}
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Specific Entry Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="ALL" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>All Types</option>
              <optgroup label="General Journal Types">
                <option value="Payroll" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Payroll Entries</option>
                <option value="Tax Provision" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Tax Payment Entries</option>
                <option value="Depreciation" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>PPE Depreciation</option>
                <option value="Adjusting Entry" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Adjusting Entries</option>
                <option value="Closing Entry" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Closing Entries</option>
                <option value="Reversing Entry" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Reversing Entries</option>
              </optgroup>
              <optgroup label="Special Journal Types">
                <option value="Sales" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Sales Invoices</option>
                <option value="Collection" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cash Collections</option>
                <option value="Expense" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Expense Vouchers</option>
                <option value="Payment" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Disbursements</option>
                <option value="Cancellation" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cancellations</option>
              </optgroup>
            </select>
          </div>

          {/* Filter Account */}
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Account Title / Code</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="ALL" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>All Account Codes</option>
              {accountTitles.map(a => (
                <option key={a.code} value={a.code} className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>
                  [{a.code}] {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
            />
          </div>

          {/* Search input */}
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Search Entries</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search entry #, desc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ENTRY MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-2xl p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-zinc-800/20 pb-3">
              <h3 className={`text-base font-bold ${theme.textTitle} flex items-center gap-2`}>
                <Pencil className="w-4 h-4 text-cyan-400" />
                Edit Journal Entry: {editingEntry.entry_no}
              </h3>
              <button onClick={() => setEditingEntry(null)} className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Date</label>
                  <input
                    type="date"
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Ref No</label>
                  <input
                    type="text"
                    value={editingEntry.ref_no}
                    onChange={(e) => setEditingEntry({ ...editingEntry, ref_no: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Description</label>
                <input
                  type="text"
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              {/* Debit Lines */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Debit Postings (Dr)</span>
                {editingEntry.debits.map((d, idx) => (
                  <div key={`dr-${idx}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Account Title"
                      value={d.account_title}
                      onChange={(e) => {
                        const updated = [...editingEntry.debits];
                        updated[idx].account_title = e.target.value;
                        setEditingEntry({ ...editingEntry, debits: updated });
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs rounded border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={d.amount}
                      onChange={(e) => {
                        const updated = [...editingEntry.debits];
                        updated[idx].amount = parseFloat(e.target.value) || 0;
                        setEditingEntry({ ...editingEntry, debits: updated });
                      }}
                      className={`w-36 px-3 py-1.5 text-xs font-mono font-bold rounded border bg-transparent ${theme.borderInput} text-emerald-400`}
                    />
                  </div>
                ))}
              </div>

              {/* Credit Lines */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Credit Postings (Cr)</span>
                {editingEntry.credits.map((c, idx) => (
                  <div key={`cr-${idx}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Account Title"
                      value={c.account_title}
                      onChange={(e) => {
                        const updated = [...editingEntry.credits];
                        updated[idx].account_title = e.target.value;
                        setEditingEntry({ ...editingEntry, credits: updated });
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs rounded border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={c.amount}
                      onChange={(e) => {
                        const updated = [...editingEntry.credits];
                        updated[idx].amount = parseFloat(e.target.value) || 0;
                        setEditingEntry({ ...editingEntry, credits: updated });
                      }}
                      className={`w-36 px-3 py-1.5 text-xs font-mono font-bold rounded border bg-transparent ${theme.borderInput} text-teal-400`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/20">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border ${theme.borderCard} text-zinc-400`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-semibold rounded-lg text-white ${theme.accentBg}`}
                >
                  Save Entry Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOURNAL ENTRIES TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Entry # / Ref</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description & Particulars</th>
                <th className="p-3">Account Title & Code</th>
                <th className="p-3 text-right">Debit (₱)</th>
                <th className="p-3 text-right">Credit (₱)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No journal entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const totalDr = entry.debits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                  const totalCr = entry.credits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const isBal = Math.abs(totalDr - totalCr) < 0.01;

                  return (
                    <React.Fragment key={entry.entry_no}>
                      {/* Entry Header Row */}
                      <tr className={`${theme.isLight ? 'bg-slate-100/50' : 'bg-zinc-800/40'} font-semibold border-t ${theme.borderCard}`}>
                        <td className="p-3 font-mono text-cyan-400 font-bold">{entry.entry_no}</td>
                        <td className="p-3 font-mono text-zinc-300">{entry.date}</td>
                        <td colSpan={2} className={`p-3 ${theme.textTitle}`}>
                          <div className="flex items-center gap-2">
                            <span>{entry.description}</span>
                            {!isBal && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Unbalanced (Diff: ₱{Math.abs(totalDr - totalCr).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                              </span>
                            )}
                          </div>
                        </td>
                        <td colSpan={2} className="p-3 text-right text-[10px] uppercase font-bold text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-cyan-300 mr-2">
                            {entry.ref_type}
                          </span>
                          <span className={isBal ? 'text-emerald-400' : 'text-rose-400'}>
                            {isBal ? '✓ Balanced' : '⚠ Unbalanced'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="p-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 inline mr-1" /> Edit
                          </button>
                        </td>
                      </tr>

                      {/* Debits */}
                      {entry.debits.map((d, idx) => {
                        const drAmt = Number(d.amount) || 0;
                        return (
                          <tr key={`dr-${idx}`} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className={`p-2 pl-6 font-medium ${theme.textMain}`}>{d.account_title}</td>
                            <td className="p-2 font-mono text-zinc-400">[{d.account_code}]</td>
                            <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                              ₱{drAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-mono text-zinc-500">-</td>
                            <td className="p-2"></td>
                          </tr>
                        );
                      })}

                      {/* Credits */}
                      {entry.credits.map((c, idx) => {
                        const crAmt = Number(c.amount) || 0;
                        return (
                          <tr key={`cr-${idx}`} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}`}>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className={`p-2 pl-12 font-medium ${theme.textMuted} italic`}>{c.account_title}</td>
                            <td className="p-2 font-mono text-zinc-400">[{c.account_code}]</td>
                            <td className="p-2 text-right font-mono text-zinc-500">-</td>
                            <td className="p-2 text-right font-mono font-semibold text-teal-400">
                              ₱{crAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2"></td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
