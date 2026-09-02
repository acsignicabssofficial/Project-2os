import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  AlertTriangle, 
  FileText, 
  Search, 
  Scale, 
  X,
  Sparkles,
  Lock,
  Unlock,
  RotateCcw,
  BookOpen,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { SpecialEntry, SpecialEntryLine, AccountTitle, Company, Sale, Expense, PPEAsset } from '../types';

interface SpecialEntriesTabProps {
  specialEntries: SpecialEntry[];
  setSpecialEntries: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  accountTitles: AccountTitle[];
  sales?: Sale[];
  expenses?: Expense[];
  ppeAssets?: PPEAsset[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function SpecialEntriesTab({
  specialEntries,
  setSpecialEntries,
  accountTitles,
  sales = [],
  expenses = [],
  ppeAssets = [],
  activeCompany,
  theme,
  triggerAlert,
  globalSearch
}: SpecialEntriesTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const [voucherNo, setVoucherNo] = useState(`JV-${new Date().getFullYear()}-${String(specialEntries.length + 1).padStart(3, '0')}`);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<SpecialEntry['entry_type']>('Adjusting Entry');
  const [description, setDescription] = useState('');
  
  // Line items state
  const [lines, setLines] = useState<SpecialEntryLine[]>([
    { type: 'Debit', account_code: '6030', account_title: 'Utilities Expense', amount: 15000 },
    { type: 'Credit', account_code: '2010', account_title: 'Accounts Payable', amount: 15000 }
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Guide accordion
  const [showCOAGuide, setShowCOAGuide] = useState(false);

  // Trigger Wizards State
  const [isAJEWizardOpen, setIsAJEWizardOpen] = useState(false);
  const [isCJEWizardOpen, setIsCJEWizardOpen] = useState(false);
  const [isLockWizardOpen, setIsLockWizardOpen] = useState(false);
  const [isRJEWizardOpen, setIsRJEWizardOpen] = useState(false);

  // Period Lock state (stored locally or per company)
  const [lockedPeriods, setLockedPeriods] = useState<string[]>(['2024']);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2025');

  // Calculate debit and credit totals
  const totalDebit = useMemo(() => {
    return lines.filter(l => l.type === 'Debit').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.filter(l => l.type === 'Credit').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }, [lines]);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  // Template presets
  const applyTemplate = (type: SpecialEntry['entry_type']) => {
    setEntryType(type);
    if (type === 'Adjusting Entry' || type === 'Accrual / Adjustment') {
      setDescription('Year-end adjusting entry for accrued expenses / revenue deferral');
      setLines([
        { type: 'Debit', account_code: '6030', account_title: 'Utilities Expense', amount: 15000 },
        { type: 'Credit', account_code: '2010', account_title: 'Accounts Payable', amount: 15000 }
      ]);
    } else if (type === 'Closing Entry') {
      setDescription('Closing entry transferring temporary revenue/expense balances to Retained Earnings');
      setLines([
        { type: 'Debit', account_code: '4010', account_title: 'Sales / Service Revenue', amount: 500000 },
        { type: 'Credit', account_code: '6010', account_title: 'Salaries, Wages & Benefits', amount: 300000 },
        { type: 'Credit', account_code: '3020', account_title: 'Retained Earnings', amount: 200000 }
      ]);
    } else if (type === 'Reversing Entry') {
      setDescription('Reversing entry for prior period accrued expenses');
      setLines([
        { type: 'Debit', account_code: '2010', account_title: 'Accounts Payable', amount: 15000 },
        { type: 'Credit', account_code: '6030', account_title: 'Utilities Expense', amount: 15000 }
      ]);
    } else if (type === 'Tax Payment Entry') {
      setDescription('Remittance payment of BIR Tax liabilities (BIR 1601-C, 0619-E, 2550Q)');
      setLines([
        { type: 'Debit', account_code: '2030', account_title: 'Expanded Withholding Tax Payable (BIR 0619-E)', amount: 2500 },
        { type: 'Debit', account_code: '2035', account_title: 'Withholding Tax Payable - Compensation (BIR 1601-C)', amount: 5000 },
        { type: 'Credit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 7500 }
      ]);
    } else if (type === 'Cancellation') {
      setDescription('Cancellation & full reversal of cancelled transaction invoice / voucher');
      setLines([
        { type: 'Debit', account_code: '4010', account_title: 'Sales / Service Revenue', amount: 10000 },
        { type: 'Credit', account_code: '1020', account_title: 'Accounts Receivable', amount: 10000 }
      ]);
    } else if (type === 'Sale of PPE') {
      setDescription('Sale of used office equipment / property, plant & equipment');
      setLines([
        { type: 'Debit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 100000 },
        { type: 'Debit', account_code: '1520', account_title: 'Accumulated Depreciation', amount: 30000 },
        { type: 'Credit', account_code: '1510', account_title: 'Property, Plant & Equipment', amount: 120000 },
        { type: 'Credit', account_code: '4020', account_title: 'Other Operating Income', amount: 10000 }
      ]);
    } else if (type === 'Loan Payable') {
      setDescription('Availment of long-term bank loan / loan payable');
      setLines([
        { type: 'Debit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 250000 },
        { type: 'Credit', account_code: '2010', account_title: 'Accounts Payable', amount: 250000 }
      ]);
    } else if (type === 'Owner Equity') {
      setDescription('Additional capital contribution from business owner / investor');
      setLines([
        { type: 'Debit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 200000 },
        { type: 'Credit', account_code: '3010', account_title: "Capital Stock / Owner's Equity", amount: 200000 }
      ]);
    } else if (type === 'Other Income') {
      setDescription('Receipt of miscellaneous non-operating income / gain');
      setLines([
        { type: 'Debit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 15000 },
        { type: 'Credit', account_code: '4020', account_title: 'Other Operating Income', amount: 15000 }
      ]);
    }
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, { type: 'Debit', account_code: '6100', account_title: 'Miscellaneous Expense', amount: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      triggerAlert('A double-entry transaction must have at least 2 lines!', 'error');
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: keyof SpecialEntryLine, value: any) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      const updated = { ...line, [field]: value };
      if (field === 'account_code') {
        const found = accountTitles.find(a => a.code === value);
        if (found) updated.account_title = found.title;
      }
      return updated;
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first in the Companies tab!', 'error');
      return;
    }
    if (!voucherNo || !description) {
      triggerAlert('Voucher Number and Description are required!', 'error');
      return;
    }

    if (!isBalanced) {
      triggerAlert(`Journal entry is unbalanced! Debit (₱${totalDebit.toLocaleString()}) does not equal Credit (₱${totalCredit.toLocaleString()}). Difference: ₱${difference.toLocaleString()}`, 'error');
      return;
    }

    if (editingId !== null) {
      setSpecialEntries(prev => prev.map(s => s.id === editingId ? {
        ...s,
        voucher_no: voucherNo,
        entry_date: entryDate,
        entry_type: entryType,
        description,
        lines: lines.map(l => ({ ...l, amount: Number(l.amount) || 0 }))
      } : s));
      triggerAlert(`Special entry "${voucherNo}" updated successfully!`, 'success');
      handleCancelEdit();
    } else {
      const newEntry: SpecialEntry = {
        id: Date.now(),
        company_name: activeCompanyName,
        entry_number: voucherNo,
        voucher_no: voucherNo,
        entry_date: entryDate,
        entry_type: entryType,
        description,
        lines: lines.map(l => ({ ...l, amount: Number(l.amount) || 0 }))
      };
      setSpecialEntries(prev => [newEntry, ...prev]);
      triggerAlert(`Special Entry "${voucherNo}" recorded successfully!`, 'success');
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsModalOpen(false);
    setVoucherNo(`JV-${new Date().getFullYear()}-${String(specialEntries.length + 1).padStart(3, '0')}`);
    setDescription('');
    setLines([
      { type: 'Debit', account_code: '1010', account_title: 'Cash and Cash Equivalents', amount: 0 },
      { type: 'Credit', account_code: '4020', account_title: 'Other Operating Income', amount: 0 }
    ]);
  };

  const handleEdit = (entry: SpecialEntry) => {
    setEditingId(entry.id);
    setVoucherNo(entry.voucher_no);
    setEntryDate(entry.entry_date);
    setEntryType(entry.entry_type);
    setDescription(entry.description);
    setLines(entry.lines);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, vNo: string) => {
    if (window.confirm(`Are you sure you want to delete special entry "${vNo}"?`)) {
      setSpecialEntries(prev => prev.filter(s => s.id !== id));
      triggerAlert(`Special Entry "${vNo}" removed.`, 'info');
    }
  };

  // ==========================================
  // 1. TRIGGER ACTION 1: POST ADJUSTING ENTRY (AJE)
  // ==========================================
  const totalDepreciationEstimate = useMemo(() => {
    return ppeAssets.reduce((sum, p) => sum + (p.monthly_depreciation ? p.monthly_depreciation * 12 : (p.acquisition_cost * 0.2)), 0) || 45000;
  }, [ppeAssets]);

  const handlePostAJETrigger = (adjType: 'depreciation' | 'accruals' | 'prepayments') => {
    const nextVNo = `AJE-${selectedFiscalYear}-001`;
    let ajeLines: SpecialEntryLine[] = [];
    let desc = '';

    if (adjType === 'depreciation') {
      desc = `Annual Depreciation Adjusting Entry for ${selectedFiscalYear} (PPE Schedule)`;
      ajeLines = [
        { type: 'Debit', account_code: '6080', account_title: 'Depreciation Expense', amount: totalDepreciationEstimate },
        { type: 'Credit', account_code: '1520', account_title: 'Accumulated Depreciation', amount: totalDepreciationEstimate }
      ];
    } else if (adjType === 'accruals') {
      desc = `Accrued Utilities and Operating Expenses as of Dec 31, ${selectedFiscalYear}`;
      ajeLines = [
        { type: 'Debit', account_code: '6030', account_title: 'Utilities Expense (Accrued)', amount: 28500 },
        { type: 'Debit', account_code: '6010', account_title: 'Salaries, Wages & Benefits (Accrued)', amount: 45000 },
        { type: 'Credit', account_code: '2010', account_title: 'Accounts Payable / Accrued Expenses', amount: 73500 }
      ];
    } else {
      desc = `Prepaid Rent & Insurance Amortization adjustment for ${selectedFiscalYear}`;
      ajeLines = [
        { type: 'Debit', account_code: '6020', account_title: 'Rent Expense (Amortized)', amount: 60000 },
        { type: 'Credit', account_code: '1050', account_title: 'Prepaid Expenses', amount: 60000 }
      ];
    }

    const newAJE: SpecialEntry = {
      id: Date.now(),
      company_name: activeCompanyName,
      entry_number: nextVNo,
      voucher_no: nextVNo,
      entry_date: `${selectedFiscalYear}-12-31`,
      entry_type: 'Adjusting Entry',
      description: desc,
      lines: ajeLines
    };

    setSpecialEntries(prev => [newAJE, ...prev]);
    setIsAJEWizardOpen(false);
    triggerAlert(`Adjusting Entry "${nextVNo}" successfully posted to General Ledger!`, 'success');
  };

  // ==========================================
  // 2. TRIGGER ACTION 2: POST YEAR-END CLOSING (CJE)
  // ==========================================
  const totalGrossRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.invoice_amount || s.vatable_amount || 0), 0) || 750000;
  }, [sales]);

  const totalGrossExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.expense_invoice_amount || e.gross_amount || 0), 0) || 480000;
  }, [expenses]);

  const calculatedNetIncome = totalGrossRevenue - totalGrossExpenses;

  const handlePostCJETrigger = () => {
    const nextVNo = `CJE-${selectedFiscalYear}-001`;
    const cjeLines: SpecialEntryLine[] = [
      // 1. Zero out Revenue (Debit)
      { type: 'Debit', account_code: '4010', account_title: 'Sales / Service Revenue (Closed to Retained Earnings)', amount: totalGrossRevenue },
      // 2. Zero out Expenses (Credit)
      { type: 'Credit', account_code: '6010', account_title: 'Operating Expenses (Closed to Retained Earnings)', amount: totalGrossExpenses },
      // 3. Balance to Retained Earnings (Credit for Net Income, Debit for Net Loss)
      { 
        type: calculatedNetIncome >= 0 ? 'Credit' : 'Debit', 
        account_code: '3020', 
        account_title: 'Retained Earnings', 
        amount: Math.abs(calculatedNetIncome) 
      }
    ];

    const newCJE: SpecialEntry = {
      id: Date.now(),
      company_name: activeCompanyName,
      entry_number: nextVNo,
      voucher_no: nextVNo,
      entry_date: `${selectedFiscalYear}-12-31`,
      entry_type: 'Closing Entry',
      description: `Year-End Closing Entry for ${selectedFiscalYear}: Transferred Net Income of ₱${calculatedNetIncome.toLocaleString()} to Retained Earnings (Acct 3020)`,
      lines: cjeLines
    };

    setSpecialEntries(prev => [newCJE, ...prev]);
    setIsCJEWizardOpen(false);
    triggerAlert(`Year-End Closing Entry "${nextVNo}" posted! All P&L Temporary Accounts zeroed out for ${selectedFiscalYear}.`, 'success');
  };

  // ==========================================
  // 3. TRIGGER ACTION 3: POST-CLOSING LOCK & AUDIT
  // ==========================================
  const isPeriodLocked = lockedPeriods.includes(selectedFiscalYear);

  const handleTogglePeriodLock = () => {
    if (isPeriodLocked) {
      setLockedPeriods(prev => prev.filter(y => y !== selectedFiscalYear));
      triggerAlert(`Fiscal Year ${selectedFiscalYear} UNLOCKED. Editing is now enabled.`, 'info');
    } else {
      setLockedPeriods(prev => [...prev, selectedFiscalYear]);
      triggerAlert(`Fiscal Year ${selectedFiscalYear} HARD-LOCKED & CERTIFIED. Books are now protected from late edits.`, 'success');
    }
    setIsLockWizardOpen(false);
  };

  // ==========================================
  // 4. TRIGGER ACTION 4: POST REVERSING ENTRIES (RJE)
  // ==========================================
  const handlePostRJETrigger = () => {
    const nextYear = parseInt(selectedFiscalYear) + 1;
    const nextVNo = `RJE-${nextYear}-001`;

    // Reverses previous year's Accrued Utilities / Expenses
    const rjeLines: SpecialEntryLine[] = [
      { type: 'Debit', account_code: '2010', account_title: 'Accounts Payable / Accrued Expenses', amount: 73500 },
      { type: 'Credit', account_code: '6030', account_title: 'Utilities Expense (Reversed on Day 1)', amount: 28500 },
      { type: 'Credit', account_code: '6010', account_title: 'Salaries, Wages & Benefits (Reversed on Day 1)', amount: 45000 }
    ];

    const newRJE: SpecialEntry = {
      id: Date.now(),
      company_name: activeCompanyName,
      entry_number: nextVNo,
      voucher_no: nextVNo,
      entry_date: `${nextYear}-01-01`,
      entry_type: 'Reversing Entry',
      description: `Day 1 Reversing Entry for Accrued Operating Expenses of ${selectedFiscalYear}`,
      lines: rjeLines
    };

    setSpecialEntries(prev => [newRJE, ...prev]);
    setIsRJEWizardOpen(false);
    triggerAlert(`Reversing Entry "${nextVNo}" dated Jan 01, ${nextYear} posted! Ready for upcoming cash disbursements.`, 'success');
  };

  const filteredEntries = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return specialEntries;
    return specialEntries.filter(s =>
      s.voucher_no.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.entry_type.toLowerCase().includes(q) ||
      s.entry_date.includes(q) ||
      s.lines.some(l => l.account_title.toLowerCase().includes(q) || l.account_code.includes(q))
    );
  }, [specialEntries, searchTerm, globalSearch]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                PFRS & BIR Books of Accounts
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isPeriodLocked ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                {isPeriodLocked ? `🔒 ${selectedFiscalYear} PERIOD LOCKED` : `🟢 ${selectedFiscalYear} PERIOD OPEN`}
              </span>
            </div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2 mt-1`}>
              <Layers className="w-6 h-6 text-purple-400" />
              Special Journal & Period-End Action Center
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              On-demand manual triggers for Adjusting (AJE), Closing (CJE), Post-Closing Lock, and Reversing (RJE) entries with PAS 8 compliance.
            </p>
          </div>

          {/* Quick Year Selector & Record Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-500/10 px-3 py-1.5 rounded-xl border border-zinc-500/20">
              <span className="text-xs font-bold text-zinc-400">Fiscal Year:</span>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className={`text-xs font-mono font-bold bg-transparent focus:outline-none ${theme.textTitle}`}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <button
              onClick={() => {
                handleCancelEdit();
                setIsModalOpen(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${theme.accentBg} hover:brightness-110`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Custom JV</span>
            </button>
          </div>
        </div>

        {/* 4 PERIOD-END TRIGGER BUTTONS PANEL */}
        <div className="mt-6 pt-5 border-t border-zinc-500/10">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Accounting Cycle Period-End Triggers (Click to Run):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Trigger 1: AJE */}
            <button
              onClick={() => setIsAJEWizardOpen(true)}
              className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  1. Adjusting Entries (AJE)
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Trigger PPE depreciation, accrued utility bills, & prepaid expense amortizations.
              </p>
              <div className="mt-2 text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded inline-block">
                ⚡ Run AJE Wizard
              </div>
            </button>

            {/* Trigger 2: CJE */}
            <button
              onClick={() => setIsCJEWizardOpen(true)}
              className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  2. Year-End Closing (CJE)
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Zero out all 4000 Revenue & 6000 Expense accounts into Retained Earnings (Acct 3020).
              </p>
              <div className="mt-2 text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded inline-block">
                🔒 Run Closing Wizard
              </div>
            </button>

            {/* Trigger 3: Post-Closing Lock */}
            <button
              onClick={() => setIsLockWizardOpen(true)}
              className={`p-4 rounded-xl border transition-all text-left group cursor-pointer ${
                isPeriodLocked ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              <div className={`flex items-center justify-between text-xs font-bold ${isPeriodLocked ? 'text-rose-400' : 'text-amber-400'}`}>
                <span className="flex items-center gap-1.5">
                  {isPeriodLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  3. Post-Closing & Lock
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Verify Post-Closing Trial Balance and freeze books after BIR ITR filing.
              </p>
              <div className={`mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded inline-block ${
                isPeriodLocked ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'
              }`}>
                {isPeriodLocked ? '🛡️ Manage Lock Status' : '🛡️ Certify & Lock Period'}
              </div>
            </button>

            {/* Trigger 4: RJE */}
            <button
              onClick={() => setIsRJEWizardOpen(true)}
              className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  4. Reversing Entries (RJE)
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Day 1 reversal of accrued expenses & income to avoid double counting on payment.
              </p>
              <div className="mt-2 text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                🔄 Run Reversing Wizard
              </div>
            </button>
          </div>
        </div>

        {/* INTERACTIVE GUIDE: HOW TO IDENTIFY AJE, CJE & RJE IN CHART OF ACCOUNTS */}
        <div className="mt-5 pt-4 border-t border-zinc-500/10">
          <button
            onClick={() => setShowCOAGuide(!showCOAGuide)}
            className="flex items-center justify-between w-full text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              PAANO MALALAMAN SA CHART OF ACCOUNTS ANG DAPAT I-ADJUST, I-CLOSE AT I-REVERSE? (Click to view guide)
            </span>
            {showCOAGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCOAGuide && (
            <div className="mt-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-700/50 text-xs text-zinc-300 space-y-3 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AJE GUIDE */}
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    1. ALIN ANG INA-ADJUST (AJE)?
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
                    <li><strong>Accrued Expenses:</strong> Expense (6000s) + Accrued Payable (2010/2055).</li>
                    <li><strong>Depreciation:</strong> Depreciation Exp (6080) + Accumulated Dep (1520).</li>
                    <li><strong>Prepayments:</strong> Prepaid Rent/Ins (1050) papuntang Rent Exp (6020).</li>
                    <li><strong>Bad Debts (ECL):</strong> Impairment Loss (6090) + Allowance (1025).</li>
                  </ul>
                </div>

                {/* CJE GUIDE */}
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    2. ALIN ANG ISINASARA (CJE)?
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
                    <li><strong>TEMPORARY ACCOUNTS LAMANG!</strong> (Lahat ng 4000 Revenue & 5000-7000 Expenses).</li>
                    <li>Lahat ng P&L accounts ay ide-debit/credit para maging <strong>₱0.00</strong>.</li>
                    <li>Ang Net Balance ay pupunta sa <strong>3020 Retained Earnings</strong>.</li>
                    <li><strong>BAWAL ISARA:</strong> Real Accounts (Assets 1000s, Liab 2000s, Equity 3000s).</li>
                  </ul>
                </div>

                {/* RJE GUIDE */}
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    3. ALIN ANG INI-REVERSE (RJE)?
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
                    <li><strong>TANGING MGA ACCRUALS LANG</strong> (Accrued Utilities, Accrued Salaries).</li>
                    <li>Baligtarin ang Debit at Credit sa Day 1 (Jan 01) ng bagong taon.</li>
                    <li><strong>HINDI INI-REVERSE:</strong> Depreciation (1520), Bad Debts, Prepayments gamit ang Asset Method, at Closing Entries.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SPECIAL ENTRIES TABLE LIST */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Recorded Special Entries ({filteredEntries.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Spreadsheet view of adjusting, closing, reversing, PPE, loan and equity entries.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search voucher or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Voucher # / Ref</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Particulars & Postings</th>
                <th className="p-3 text-right">Total Dr / Cr (₱)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No special entries recorded yet. Click one of the Period-End Trigger buttons above or "Record Custom JV".
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const entryTotal = entry.lines.filter(l => l.type === 'Debit').reduce((sum, l) => sum + l.amount, 0);
                  return (
                    <tr key={entry.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className="p-3 font-mono font-bold text-cyan-400">{entry.voucher_no}</td>
                      <td className="p-3 font-mono text-zinc-300">{entry.entry_date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.entry_type === 'Adjusting Entry' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          entry.entry_type === 'Closing Entry' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          entry.entry_type === 'Reversing Entry' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {entry.entry_type}
                        </span>
                      </td>
                      <td className="p-3 space-y-1">
                        <div className={`font-semibold ${theme.textTitle}`}>{entry.description}</div>
                        <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
                          {entry.lines.map((l, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={l.type === 'Debit' ? 'text-emerald-400 font-bold' : 'text-teal-400 font-bold italic pl-3'}>
                                {l.type === 'Debit' ? 'Dr' : 'Cr'} [{l.account_code}] {l.account_title}: ₱{l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-cyan-400">
                        ₱{entryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(entry)}
                            className={`p-1 px-2 rounded-md border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100' : 'bg-zinc-900 hover:bg-zinc-800'} text-cyan-400 transition cursor-pointer`}
                            title="Edit Entry"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id, entry.voucher_no)}
                            className="p-1 px-2 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. TRIGGER WIZARD MODAL: ADJUSTING ENTRIES */}
      {/* ========================================== */}
      {isAJEWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <Sparkles className="w-5 h-5 text-purple-400" />
                Trigger Adjusting Entries (AJE) Wizard
              </h3>
              <button onClick={() => setIsAJEWizardOpen(false)} className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select which period-end adjusting entries you want to generate and post to the General Ledger for <strong>Dec 31, {selectedFiscalYear}</strong>:
            </p>

            <div className="space-y-3">
              {/* Option A: Depreciation */}
              <div className="p-4 rounded-xl border border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-zinc-200">1. Annual PPE Depreciation Schedule</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Dr. Depreciation Expense (6080) ₱{totalDepreciationEstimate.toLocaleString()} / Cr. Accumulated Dep (1520)
                  </div>
                </div>
                <button
                  onClick={() => handlePostAJETrigger('depreciation')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
                >
                  Post AJE
                </button>
              </div>

              {/* Option B: Accrued Expenses */}
              <div className="p-4 rounded-xl border border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-zinc-200">2. Accrued Utilities & Salaries</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Dr. Utilities & Salaries Exp ₱73,500 / Cr. Accrued Payables (2010)
                  </div>
                </div>
                <button
                  onClick={() => handlePostAJETrigger('accruals')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
                >
                  Post AJE
                </button>
              </div>

              {/* Option C: Prepayments */}
              <div className="p-4 rounded-xl border border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-zinc-200">3. Prepaid Rent & Insurance Amortization</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Dr. Rent Expense (6020) ₱60,000 / Cr. Prepaid Expenses (1050)
                  </div>
                </div>
                <button
                  onClick={() => handlePostAJETrigger('prepayments')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
                >
                  Post AJE
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-500/10">
              <button
                onClick={() => setIsAJEWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-600 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Close Wizard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. TRIGGER WIZARD MODAL: CLOSING ENTRIES  */}
      {/* ========================================== */}
      {isCJEWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <RotateCcw className="w-5 h-5 text-cyan-400" />
                Trigger Year-End Closing (CJE) Wizard
              </h3>
              <button onClick={() => setIsCJEWizardOpen(false)} className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                This wizard will close all temporary <strong>Revenue (4000s)</strong> and <strong>Expense (6000s)</strong> accounts to zero and transfer Net Earnings to <strong>Retained Earnings (3020)</strong> for Fiscal Year <strong>{selectedFiscalYear}</strong>:
              </p>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-700/60 font-mono text-xs space-y-2">
                <div className="flex justify-between text-emerald-400">
                  <span>Total Revenues to Zero Out (Dr):</span>
                  <span>₱{totalGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Total Expenses to Zero Out (Cr):</span>
                  <span>₱{totalGrossExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-zinc-700 flex justify-between font-bold text-cyan-400 text-sm">
                  <span>Net Income to Retained Earnings (Cr):</span>
                  <span>₱{calculatedNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Only click this when all regular sales and expenses for {selectedFiscalYear} have been entered. If you have late transactions later, you can post them as Prior Period Adjustments in {parseInt(selectedFiscalYear) + 1}.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-500/10">
              <button
                onClick={() => setIsCJEWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-600 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePostCJETrigger}
                className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Post Closing Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. TRIGGER WIZARD MODAL: LOCK PERIOD / TB */}
      {/* ========================================== */}
      {isLockWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Post-Closing Trial Balance & Period Lock
              </h3>
              <button onClick={() => setIsLockWizardOpen(false)} className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-700/60 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Balance Sheet Equality (Assets = Liab + Eq):</span>
                  <span className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> BALANCED</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span>P&L Temporary Accounts Zero-Balance Check:</span>
                  <span className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> ZEROED OUT</span>
                </div>
                <div className="flex justify-between items-center text-cyan-400 pt-2 border-t border-zinc-700">
                  <span>Current Lock Status for {selectedFiscalYear}:</span>
                  <span className="font-bold uppercase">{isPeriodLocked ? '🔒 HARD-LOCKED' : '🟢 OPEN'}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                Locking a period makes all {selectedFiscalYear} transactions read-only to ensure strict BIR audit consistency after filing your Annual ITR (BIR Form 1702/1701).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-500/10">
              <button
                onClick={() => setIsLockWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-600 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTogglePeriodLock}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 ${
                  isPeriodLocked ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isPeriodLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isPeriodLocked ? `Unlock Fiscal Year ${selectedFiscalYear}` : `Hard-Lock Fiscal Year ${selectedFiscalYear}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. TRIGGER WIZARD MODAL: REVERSING ENTRIES */}
      {/* ========================================== */}
      {isRJEWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <RotateCcw className="w-5 h-5 text-emerald-400" />
                Trigger Reversing Entries (RJE) Wizard
              </h3>
              <button onClick={() => setIsRJEWizardOpen(false)} className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                This wizard will create a Day 1 entry dated <strong>Jan 01, {parseInt(selectedFiscalYear) + 1}</strong> that reverses all accrued expenses from {selectedFiscalYear}, so that future cash disbursements do not require complicated adjusting splits:
              </p>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-700/60 font-mono text-xs space-y-1.5">
                <div className="text-emerald-400 font-bold">Preview Reversal Lines:</div>
                <div className="text-zinc-300">Dr. [2010] Accounts Payable / Accrued Payables: ₱73,500.00</div>
                <div className="text-zinc-400 pl-4">Cr. [6030] Utilities Expense: ₱28,500.00</div>
                <div className="text-zinc-400 pl-4">Cr. [6010] Salaries & Wages: ₱45,000.00</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-500/10">
              <button
                onClick={() => setIsRJEWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-600 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePostRJETrigger}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Post Day 1 Reversing Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM JV MODAL (RECORD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <Layers className="w-5 h-5 text-purple-400" />
                {editingId ? 'Edit Special Journal Entry' : 'Record New Special Journal Voucher'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-zinc-400 hover:text-zinc-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-zinc-400">Quick Standard Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Adjusting Entry',
                  'Closing Entry',
                  'Reversing Entry',
                  'Tax Payment Entry',
                  'Sale of PPE',
                  'Loan Payable',
                  'Owner Equity',
                  'Cancellation'
                ].map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => applyTemplate(tpl as any)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Voucher # / Ref</label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Entry Classification</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                  >
                    <option value="Adjusting Entry">Adjusting Entry (AJE)</option>
                    <option value="Closing Entry">Closing Entry (CJE)</option>
                    <option value="Reversing Entry">Reversing Entry (RJE)</option>
                    <option value="Tax Payment Entry">Tax Remittance (BIR)</option>
                    <option value="Sale of PPE">Sale / Disposal of PPE</option>
                    <option value="Loan Payable">Loan Availment / Repayment</option>
                    <option value="Owner Equity">Capital Stock / Owner Equity</option>
                    <option value="Cancellation">Cancellation / Error Correction</option>
                    <option value="Accrual / Adjustment">Accrual & Deferral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Particulars & Description</label>
                <input
                  type="text"
                  placeholder="Detailed explanation and purpose of journal entry..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                  required
                />
              </div>

              {/* LINES LIST (DEBITS & CREDITS) */}
              <div className="space-y-2 pt-2 border-t border-zinc-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-400">Journal Lines (Debits & Credits)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-500/5 p-2 rounded-xl border border-zinc-500/10">
                      {/* Debit / Credit selector */}
                      <select
                        value={line.type}
                        onChange={(e) => handleLineChange(idx, 'type', e.target.value)}
                        className={`w-24 px-2 py-1.5 text-xs font-bold rounded-lg border ${
                          line.type === 'Debit' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-teal-400 border-teal-500/30 bg-teal-500/10'
                        }`}
                      >
                        <option value="Debit">Debit</option>
                        <option value="Credit">Credit</option>
                      </select>

                      {/* Account Code selector */}
                      <select
                        value={line.account_code}
                        onChange={(e) => handleLineChange(idx, 'account_code', e.target.value)}
                        className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg border font-medium ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                      >
                        {accountTitles.map((acc) => (
                          <option key={acc.code} value={acc.code}>
                            [{acc.code}] {acc.title} ({acc.type})
                          </option>
                        ))}
                      </select>

                      {/* Amount input */}
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={line.amount || ''}
                          onChange={(e) => handleLineChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className={`w-full px-2.5 py-1.5 text-xs font-bold font-mono text-right rounded-lg border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                          required
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Double Entry Balance Checker */}
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                  isBalanced ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div>Total Debit: ₱{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div>Total Credit: ₱{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div>
                    {isBalanced ? (
                      <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> BALANCED</span>
                    ) : (
                      <span>DIFF: ₱{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-500/10">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${theme.borderCard} text-zinc-400 hover:text-zinc-200 cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition ${
                    isBalanced ? `${theme.accentBg} hover:brightness-110 cursor-pointer` : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {editingId ? 'Update Journal Entry' : 'Post Journal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
