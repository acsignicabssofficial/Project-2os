import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Pencil, X } from 'lucide-react';
import { Sale, Collection, Expense, Payment, SpecialEntry, AccountTitle, Company, JournalEntry, PPEAsset, PayrollRecord } from '../types';
import { computeSalesVAT, computeExpenseVAT } from '../utils/accounting';

interface GeneralJournalTabProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
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
  expenses,
  payments,
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
    const entries: JournalEntry[] = [];
    let idCounter = 1;

    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 1. Sales Entries
    // Note: Creditable Withholding Tax (2307) is only realized/recognized once
    // actually withheld by the customer at the time of collection. For sales
    // that are already fully "Paid" at invoicing (and have no separate
    // Collection entries logged against them), that happens concurrently, so
    // CWT is booked directly here. For "Partial"/"Pending" sales - and for any
    // "Paid" sale that unexpectedly already has Collection entries recorded
    // against it - CWT is recognized later via the matching Collection entry
    // (see below) instead, so it is not double-counted here.
    sales.forEach(s => {
      const invAmt = Number(s.invoice_amount) || 0;
      const w2307 = Number(s.withholding_2307) || 0;
      const vatExempt = Number(s.vat_exempt_amount) || 0;
      const discounts = Number(s.discounts) || 0;
      const downPayment = Number(s.down_payment) || 0;
      const hasCollections = collections.some(c => normalizeDocNo(c.invoice_number) === normalizeDocNo(s.invoice_number));

      const { vatable_amount: vatable, output_vat: outVat, net_of_discount: netInvoice } = computeSalesVAT(invAmt, vatExempt, discounts);

      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: `GJ-SLS-${s.invoice_number}`,
        date: s.invoice_date || new Date().toISOString().split('T')[0],
        ref_type: 'Sales',
        ref_no: s.invoice_number,
        description: `Sales Invoice #${s.invoice_number} - Customer: ${s.customer_name}`,
        debits: [],
        credits: []
      };

      if (s.sales_status === 'Paid' && !hasCollections) {
        entry.debits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: Math.max(0, netInvoice - w2307) });
        if (w2307 > 0) {
          entry.debits.push({ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307 });
        }
      } else if (s.sales_status === 'Partial' && downPayment > 0) {
        entry.debits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents (Down Payment)', amount: Math.min(downPayment, netInvoice) });
        entry.debits.push({ account_code: '1020', account_title: 'Accounts Receivable', amount: Math.max(0, netInvoice - downPayment) });
      } else {
        entry.debits.push({ account_code: '1020', account_title: 'Accounts Receivable', amount: netInvoice });
      }

      // Sales Revenue is booked gross (before the trade discount), and the
      // discount is posted as its own contra-revenue debit line so it stays
      // visible in the books instead of being silently netted away.
      entry.credits.push({ account_code: '4010', account_title: 'Sales / Service Revenue', amount: vatable + vatExempt + discounts });

      if (discounts > 0) {
        entry.debits.push({ account_code: '4015', account_title: 'Sales Discounts', amount: discounts });
      }

      if (outVat > 0) {
        entry.credits.push({ account_code: '2020', account_title: 'Output VAT Payable', amount: outVat });
      }

      entries.push(entry);
    });

    // 2. Cash Receipt / Collections Entries
    collections.forEach(c => {
      const amtCol = Number(c.amount_collected) || 0;
      const w2307 = Number(c.amount_withheld_2307) || 0;

      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: `GJ-COL-${c.entry_number || c.id}`,
        date: c.collection_date || new Date().toISOString().split('T')[0],
        ref_type: 'Collection',
        ref_no: c.invoice_number,
        description: `Cash Collection for Invoice #${c.invoice_number} - Customer: ${c.customer_name}`,
        debits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: amtCol }
        ],
        credits: [
          { account_code: '1020', account_title: 'Accounts Receivable', amount: amtCol + w2307 }
        ]
      };

      if (w2307 > 0) {
        entry.debits.push({ account_code: '1040', account_title: 'Creditable Withholding Tax (BIR 2307)', amount: w2307 });
      }

      entries.push(entry);
    });

    // 3. Expense Entries
    // Note: mirrors the Sales logic above - Expanded Withholding Tax is only
    // actually withheld from the provider once the voucher is actually paid.
    // For "Unpaid" vouchers, EWT payable is recognized later via the matching
    // Payment entry (see below) to avoid double-counting.
    expenses.forEach(e => {
      const expInvAmt = Number(e.expense_invoice_amount) || 0;
      const w2307 = Number(e.withholding_2307_2306) || 0;
      const discounts = Number(e.discounts) || 0;
      const isVat = e.nonvat_or_vat === 'VAT';

      const { vatable_expense_amount: vatableAmt, vat_input_amount: inputVat, nonvat_expense_amount: nonvatAmt, net_of_discount: netInvoice } = computeExpenseVAT(expInvAmt, discounts, isVat);
      const expBase = isVat ? vatableAmt : nonvatAmt;

      const matched = accountTitles.find(a => a.title.toLowerCase() === e.expense_type.toLowerCase() || a.category === e.expense_type);
      const expCode = matched ? matched.code : '6100';

      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: `GJ-EXP-${e.voucher_number}`,
        date: e.expense_date || new Date().toISOString().split('T')[0],
        ref_type: 'Expense',
        ref_no: e.voucher_number,
        description: `Expense Voucher #${e.voucher_number} - Provider: ${e.service_provider_name} (${e.expense_type})`,
        debits: [],
        credits: []
      };

      entry.debits.push({ account_code: expCode, account_title: `Expense: ${e.expense_type}`, amount: expBase });

      if (inputVat > 0) {
        entry.debits.push({ account_code: '1030', account_title: 'Input VAT', amount: inputVat });
      }

      if (e.expense_status === 'Paid') {
        entry.credits.push({ account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: netInvoice - w2307 });
        if (w2307 > 0) {
          entry.credits.push({ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 });
        }
      } else {
        entry.credits.push({ account_code: '2010', account_title: 'Accounts Payable', amount: netInvoice });
      }

      entries.push(entry);
    });

    // 4. Cash Disbursement / Payment Entries
    payments.forEach(p => {
      const amtPaid = Number(p.amount_paid) || 0;
      const w2307 = Number(p.withholding_tax_2307) || 0;

      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: `GJ-PAY-${p.entry_number || p.id}`,
        date: p.payment_date || new Date().toISOString().split('T')[0],
        ref_type: 'Payment',
        ref_no: p.voucher_number,
        description: `Payment Disbursement for Voucher #${p.voucher_number} - Provider: ${p.service_provider_name}`,
        debits: [
          { account_code: '2010', account_title: 'Accounts Payable', amount: amtPaid + w2307 }
        ],
        credits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: amtPaid }
        ]
      };

      if (w2307 > 0) {
        entry.credits.push({ account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: w2307 });
      }

      entries.push(entry);
    });

    // 5. PPE Asset & Depreciation Entries
    ppeAssets.forEach(p => {
      const dep = Number(p.accumulated_depreciation) || 0;
      if (dep > 0) {
        entries.push({
          id: idCounter++,
          company_name: activeCompany?.company_name || '',
          entry_no: `GJ-DEP-${p.asset_code}`,
          date: p.acquisition_date || new Date().toISOString().split('T')[0],
          ref_type: 'Depreciation',
          ref_no: p.asset_code,
          description: `Depreciation Expense for PPE Asset: ${p.asset_name} (${p.asset_code})`,
          debits: [
            { account_code: '6080', account_title: 'Depreciation Expense', amount: dep }
          ],
          credits: [
            { account_code: '1520', account_title: 'Accumulated Depreciation', amount: dep }
          ]
        });
      }
    });

    // 6. Payroll Entries
    payrollRecords.forEach(pr => {
      const gross = Number(pr.gross_pay) || 0;
      const sssEE = Number(pr.sss_deduction) || 0;
      const phicEE = Number(pr.philhealth_deduction) || 0;
      const hdmfEE = Number(pr.pagibig_deduction) || 0;
      const taxEE = Number(pr.withholding_tax) || 0;
      const otherDed = Number(pr.other_deductions) || 0;
      const netPay = Number(pr.net_pay) || (gross - sssEE - phicEE - hdmfEE - taxEE - otherDed);

      // Employer match / contributions
      const sssER = Math.round((Number(pr.basic_pay) || 0) * 0.095 * 100) / 100;
      const phicER = phicEE;
      const hdmfER = hdmfEE;

      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: `GJ-PAYROLL-${pr.employee_id}-${pr.payroll_period}`,
        date: new Date().toISOString().split('T')[0],
        ref_type: 'Payroll',
        ref_no: String(pr.employee_id || ''),
        description: `Payroll Processing for ${pr.full_name || pr.employee_name || pr.employee_id} (${pr.payroll_period})`,
        debits: [
          { account_code: '6010', account_title: 'Salaries, Wages & Benefits', amount: gross },
          { account_code: '6015', account_title: 'Employer SSS Contribution Expense', amount: sssER },
          { account_code: '6016', account_title: 'Employer PhilHealth Contribution Expense', amount: phicER },
          { account_code: '6017', account_title: 'Employer Pag-IBIG Contribution Expense', amount: hdmfER }
        ],
        credits: [
          { account_code: '1010', account_title: 'Cash and Cash Equivalents (Net Payroll)', amount: netPay },
          { account_code: '2041', account_title: 'SSS Premium Payable (EE+ER)', amount: sssEE + sssER },
          { account_code: '2042', account_title: 'PhilHealth Premium Payable (EE+ER)', amount: phicEE + phicER },
          { account_code: '2043', account_title: 'Pag-IBIG Premium Payable (EE+ER)', amount: hdmfEE + hdmfER },
          { account_code: '2035', account_title: 'Withholding Tax Payable - Compensation (BIR 1601-C)', amount: taxEE }
        ]
      };

      if (otherDed > 0) {
        entry.credits.push({ account_code: '2050', account_title: 'Other Employee Payables & Deductions', amount: otherDed });
      }

      entries.push(entry);
    });

    // 7. Special Entries
    specialEntries.forEach(s => {
      const entry: JournalEntry = {
        id: idCounter++,
        company_name: activeCompany?.company_name || '',
        entry_no: s.voucher_no,
        date: s.entry_date,
        ref_type: s.entry_type || 'Manual',
        ref_no: s.voucher_no,
        description: `[${s.entry_type}] ${s.description}`,
        debits: s.lines.filter(l => l.type === 'Debit').map(l => ({ account_code: l.account_code, account_title: l.account_title, amount: Number(l.amount) || 0 })),
        credits: s.lines.filter(l => l.type === 'Credit').map(l => ({ account_code: l.account_code, account_title: l.account_title, amount: Number(l.amount) || 0 }))
      };
      entries.push(entry);
    });

    return entries;
  }, [sales, collections, expenses, payments, specialEntries, accountTitles, ppeAssets, payrollRecords, activeCompany]);

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
