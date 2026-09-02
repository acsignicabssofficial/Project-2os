import React, { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle2, Calendar, FileText, Trash2, Pencil } from 'lucide-react';
import { AccountTitle, Company, Sale, Collection, Expense, Payment, SpecialEntry } from '../types';
import { INITIAL_ACCOUNT_TITLES } from '../data';
import { computeSalesVAT, computeExpenseVAT } from '../utils/accounting';

interface AccountTitlesTabProps {
  accountTitles: AccountTitle[];
  setAccountTitles: React.Dispatch<React.SetStateAction<AccountTitle[]>>;
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  specialEntries?: SpecialEntry[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function AccountTitlesTab({
  accountTitles = [],
  setAccountTitles,
  sales = [],
  collections = [],
  expenses = [],
  payments = [],
  specialEntries = [],
  activeCompany,
  theme,
  triggerAlert,
  globalSearch
}: AccountTitlesTabProps) {
  // Ensure we always have account titles
  const effectiveAccountTitles = useMemo(() => {
    if (accountTitles && accountTitles.length > 0) return accountTitles;
    return INITIAL_ACCOUNT_TITLES as AccountTitle[];
  }, [accountTitles]);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AccountTitle['type']>('Expense');
  const [category, setCategory] = useState('Operating Expenses');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Period Filter: 'all' | 'custom_date' | 'month' | 'quarter' | 'year'
  const [periodType, setPeriodType] = useState<'all' | 'custom_date' | 'month' | 'quarter' | 'year'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedQuarter, setSelectedQuarter] = useState('Q3');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveAccountTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) {
      triggerAlert('Account Code and Title are required fields!', 'error');
      return;
    }

    if (editingId !== null) {
      setAccountTitles(prev => prev.map(a => a.id === editingId ? {
        ...a,
        code: code.trim(),
        title: title.trim(),
        type,
        category: category.trim(),
        description: description.trim()
      } : a));
      triggerAlert(`Account Title "${title}" updated.`, 'success');
      setEditingId(null);
    } else {
      if (effectiveAccountTitles.some(a => a.code.toLowerCase().trim() === code.toLowerCase().trim())) {
        triggerAlert(`Account code "${code}" already exists!`, 'error');
        return;
      }
      const newAcc: AccountTitle = {
        id: Date.now(),
        code: code.trim(),
        title: title.trim(),
        type,
        category: category.trim() || 'General',
        description: description.trim(),
        company_name: activeCompany?.company_name || '',
        isCustom: true
      };
      setAccountTitles(prev => [...prev, newAcc]);
      triggerAlert(`Account Title "${title}" created successfully!`, 'success');
    }

    setCode('');
    setTitle('');
    setDescription('');
  };

  const handleEdit = (acc: AccountTitle) => {
    setEditingId(acc.id);
    setCode(acc.code);
    setTitle(acc.title);
    setType(acc.type);
    setCategory(acc.category || 'Operating Expenses');
    setDescription(acc.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number, accTitle: string) => {
    if (window.confirm(`Are you sure you want to delete account title "${accTitle}"?`)) {
      setAccountTitles(prev => prev.filter(a => a.id !== id));
      triggerAlert(`Account title "${accTitle}" deleted.`, 'info');
    }
  };

  // Filter transactions by period
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    if (periodType === 'all') return true;
    if (periodType === 'custom_date') return dateStr === selectedDate;
    if (periodType === 'month') return dateStr.startsWith(selectedMonth);
    if (periodType === 'year') return dateStr.startsWith(selectedYear);
    if (periodType === 'quarter') {
      const year = selectedYear;
      const d = new Date(dateStr);
      const m = d.getMonth() + 1;
      const q = Math.ceil(m / 3);
      const qStr = `Q${q}`;
      return d.getFullYear().toString() === year && qStr === selectedQuarter;
    }
    return true;
  };

  // Calculate Account Balances dynamically
  const accountBalances = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number; balance: number }>();

    // Init
    effectiveAccountTitles.forEach(acc => {
      map.set(acc.code, { debit: 0, credit: 0, balance: 0 });
    });

    // Helper to add safely
    const addVal = (code: string, dr: number, cr: number) => {
      const cleanDr = Number(dr) || 0;
      const cleanCr = Number(cr) || 0;
      if (!map.has(code)) map.set(code, { debit: 0, credit: 0, balance: 0 });
      const cur = map.get(code)!;
      cur.debit += cleanDr;
      cur.credit += cleanCr;
    };

    // Sales
    // CWT (2307) is only recognized here for sales already "Paid" at
    // invoicing AND that have no separate Collection entries logged against
    // them yet. For Partial/Pending sales - and any "Paid" sale that
    // unexpectedly already has Collections against it - CWT is recognized
    // later via the matching Collection (below) instead.
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    sales.filter(s => isDateInPeriod(s.invoice_date)).forEach(s => {
      const invAmt = Number(s.invoice_amount) || 0;
      const w2307 = Number(s.withholding_2307) || 0;
      const vatExempt = Number(s.vat_exempt_amount) || 0;
      const discounts = Number(s.discounts) || 0;
      const { vatable_amount: vatableCalc, output_vat: outVatCalc, net_of_discount: netInvoice } = computeSalesVAT(invAmt, vatExempt, discounts);
      const vatable = Number(s.vatable_amount) || vatableCalc;
      const outVat = Number(s.output_vat) || outVatCalc;
      const hasCollections = collections.some(c => normalizeDocNo(c.invoice_number) === normalizeDocNo(s.invoice_number));

      // 4010 Sales Revenue (Cr) - booked gross, discount shown separately below
      addVal('4010', 0, vatable + vatExempt + discounts);
      // 4015 Sales Discounts (Dr, contra-revenue)
      if (discounts > 0) addVal('4015', discounts, 0);
      // 2020 Output VAT (Cr)
      if (outVat > 0) addVal('2020', 0, outVat);

      if (s.sales_status === 'Paid' && !hasCollections) {
        // 1010 Cash (Dr)
        addVal('1010', Math.max(0, netInvoice - w2307), 0);
        // 1040 2307 CWT (Dr)
        if (w2307 > 0) addVal('1040', w2307, 0);
      } else {
        const dp = Number(s.down_payment) || 0;
        if (dp > 0) {
          addVal('1010', Math.min(dp, netInvoice), 0);
          addVal('1020', Math.max(0, netInvoice - dp), 0);
        } else {
          // 1020 AR (Dr)
          addVal('1020', netInvoice, 0);
        }
      }
    });

    // Collections
    collections.filter(c => isDateInPeriod(c.collection_date)).forEach(c => {
      const colAmt = Number(c.amount_collected) || 0;
      const w2307 = Number(c.amount_withheld_2307) || 0;
      // 1010 Cash (Dr)
      addVal('1010', colAmt, 0);
      // 1040 2307 CWT (Dr)
      if (w2307 > 0) addVal('1040', w2307, 0);
      // 1020 AR (Cr)
      addVal('1020', 0, colAmt + w2307);
    });

    // Expenses
    // EWT payable is only recognized here for vouchers already "Paid". For
    // unpaid vouchers, it is recognized later via the matching Payment.
    expenses.filter(e => isDateInPeriod(e.expense_date)).forEach(e => {
      const expInvAmt = Number(e.expense_invoice_amount) || 0;
      const w2307 = Number(e.withholding_2307_2306) || 0;
      const discounts = Number(e.discounts) || 0;
      const isVat = e.nonvat_or_vat === 'VAT';
      const { vatable_expense_amount, vat_input_amount, nonvat_expense_amount, net_of_discount: netInvoice } = computeExpenseVAT(expInvAmt, discounts, isVat);
      const inputVat = Number(e.vat_input_amount) || vat_input_amount;
      const expAmt = isVat ? (Number(e.vatable_expense_amount) || vatable_expense_amount) : (Number(e.nonvat_expense_amount) || nonvat_expense_amount);

      const matched = effectiveAccountTitles.find(a => a.title.toLowerCase() === e.expense_type.toLowerCase() || a.category === e.expense_type);
      const expCode = matched ? matched.code : '6100';

      addVal(expCode, expAmt, 0);

      // 1030 Input VAT (Dr)
      if (inputVat > 0) addVal('1030', inputVat, 0);

      if (e.expense_status === 'Paid') {
        // 1010 Cash (Cr)
        addVal('1010', 0, netInvoice - w2307);
        // 2030 Expanded Withholding (Cr)
        if (w2307 > 0) addVal('2030', 0, w2307);
      } else {
        // 2010 AP (Cr)
        addVal('2010', 0, netInvoice);
      }
    });

    // Payments
    payments.filter(p => isDateInPeriod(p.payment_date)).forEach(p => {
      const amtPaid = Number(p.amount_paid) || 0;
      const w2307 = Number(p.withholding_tax_2307) || 0;
      // 2010 AP (Dr)
      addVal('2010', amtPaid + w2307, 0);
      // 1010 Cash (Cr)
      addVal('1010', 0, amtPaid);
      // 2030 Expanded Withholding Tax Payable (Cr)
      if (w2307 > 0) addVal('2030', 0, w2307);
    });

    // Special Entries
    specialEntries.filter(s => isDateInPeriod(s.entry_date)).forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.type === 'Debit') {
          addVal(l.account_code, amt, 0);
        } else {
          addVal(l.account_code, 0, amt);
        }
      });
    });

    // Compute net balance based on normal balance rule
    map.forEach((val, key) => {
      const acc = effectiveAccountTitles.find(a => a.code === key);
      const type = acc ? acc.type : 'Asset';
      if (type === 'Asset' || type === 'Cost of Sales' || type === 'Expense') {
        val.balance = val.debit - val.credit;
      } else {
        val.balance = val.credit - val.debit;
      }
    });

    return map;
  }, [effectiveAccountTitles, sales, collections, expenses, payments, specialEntries, periodType, selectedDate, selectedMonth, selectedQuarter, selectedYear]);

  const filteredTitles = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return effectiveAccountTitles;
    return effectiveAccountTitles.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.category && a.category.toLowerCase().includes(q))
    );
  }, [effectiveAccountTitles, searchTerm, globalSearch]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <FileText className="w-6 h-6 text-cyan-400" />
              Account Titles & Chart of Accounts
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Manage expense account titles, custom financial accounts, and monitor real-time ledger balances by date, month, quarter, or year.
            </p>
          </div>

          {/* PERIOD FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2 bg-zinc-500/10 p-2 rounded-xl border border-zinc-700/20">
            <Calendar className="w-4 h-4 text-cyan-400 ml-1" />
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="all" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>All Time</option>
              <option value="custom_date" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>By Specific Date</option>
              <option value="month" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Monthly</option>
              <option value="quarter" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Quarterly</option>
              <option value="year" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Annual</option>
            </select>

            {periodType === 'custom_date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`text-xs px-2 py-1 rounded border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              />
            )}

            {periodType === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`text-xs px-2 py-1 rounded border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              />
            )}

            {(periodType === 'quarter' || periodType === 'year') && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`text-xs px-2 py-1 rounded border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2026" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2026</option>
                <option value="2025" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2025</option>
                <option value="2024" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2024</option>
              </select>
            )}

            {periodType === 'quarter' && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className={`text-xs px-2 py-1 rounded border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Q1" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Q1 (Jan-Mar)</option>
                <option value="Q2" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Q2 (Apr-Jun)</option>
                <option value="Q3" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Q3 (Jul-Sep)</option>
                <option value="Q4" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Q4 (Oct-Dec)</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h3 className={`text-sm font-semibold mb-4 ${theme.textTitle} flex items-center gap-2`}>
          <Plus className="w-4 h-4 text-cyan-400" />
          {editingId !== null ? 'Edit Account Title' : 'Add New Custom Account Title'}
        </h3>
        <form onSubmit={handleSaveAccountTitle} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Account Code *</label>
            <input
              type="text"
              placeholder="e.g. 6110"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              required
            />
          </div>
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Account Title Name *</label>
            <input
              type="text"
              placeholder="e.g. Software & Subscriptions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              required
            />
          </div>
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="Asset" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Asset</option>
              <option value="Liability" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Liability</option>
              <option value="Equity" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Equity</option>
              <option value="Revenue" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Revenue</option>
              <option value="Cost of Sales" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cost of Sales</option>
              <option value="Expense" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Expense</option>
            </select>
          </div>
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Category</label>
            <input
              type="text"
              placeholder="e.g. Operating Expenses"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${editingId !== null ? 'bg-cyan-600 hover:bg-cyan-500' : theme.accentBg}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingId !== null ? 'Update Title' : 'Add Title'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setCode(''); setTitle(''); setDescription(''); }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border ${theme.borderCard} text-zinc-400 hover:bg-zinc-800`}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CHART OF ACCOUNTS TABLE LIST */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-500/5`}>
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Chart of Accounts ({filteredTitles.length})</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search account code/title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Code</th>
                <th className="p-3">Account Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Accounting Cycle Classification</th>
                <th className="p-3 text-right">Debit Movement</th>
                <th className="p-3 text-right">Credit Movement</th>
                <th className="p-3 text-right">Net Balance</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredTitles.map((acc) => {
                const bal = accountBalances.get(acc.code) || { debit: 0, credit: 0, balance: 0 };
                const drVal = Number(bal.debit) || 0;
                const crVal = Number(bal.credit) || 0;
                const netVal = Number(bal.balance) || 0;

                const isTemporary = ['Revenue', 'Expense', 'Cost of Sales'].includes(acc.type) || parseInt(acc.code) >= 4000;
                const isAccrual = acc.code === '2010' || acc.code === '2055' || acc.title.toLowerCase().includes('accrued');
                const isDepreciation = acc.code === '1520' || acc.code === '6080';
                const isPrepayment = acc.code === '1050' || acc.code === '6020';

                return (
                  <tr key={acc.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-mono font-bold ${theme.textTitle}`}>{acc.code}</td>
                    <td className={`p-3 font-semibold ${theme.textMain}`}>
                      <div>{acc.title}</div>
                      <div className="text-[10px] text-zinc-500">{acc.category || 'General'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        acc.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        acc.type === 'Liability' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        acc.type === 'Equity' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        acc.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3">
                      {isTemporary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          🔒 Temporary (CJE - Zeroed to 3020)
                        </span>
                      ) : isAccrual ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🔄 Accrual (AJE / RJE Reversible)
                        </span>
                      ) : isDepreciation ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          ⚡ PPE (AJE Non-Reversible)
                        </span>
                      ) : isPrepayment ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚡ Deferral (AJE Amortization)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-500/10 border border-zinc-500/20">
                          🛡️ Real Account (Permanent Balance)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-400">₱{drVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">₱{crVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right font-mono font-bold ${netVal > 0 ? 'text-cyan-400' : 'text-zinc-400'}`}>
                      ₱{netVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(acc)}
                          className={`p-1 px-2 rounded-md border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100' : 'bg-zinc-900 hover:bg-zinc-800'} text-cyan-400 transition cursor-pointer`}
                          title="Edit Title"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {acc.isCustom && (
                          <button
                            onClick={() => handleDelete(acc.id, acc.title)}
                            className="p-1 px-2 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Delete Title"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
