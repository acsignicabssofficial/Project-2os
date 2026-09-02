import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Trash2, 
  Pencil, 
  ArrowRightLeft, 
  DollarSign, 
  FileText,
  Search,
  Printer,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Company, Collection, Payment, SpecialEntry, AccountTitle } from '../types';

export interface BankReconItem {
  id: number;
  date: string;
  type: 'deposit_in_transit' | 'outstanding_check' | 'bank_service_charge' | 'interest_income' | 'nsf_check' | 'book_error' | 'bank_error';
  reference_no: string;
  payee_payer: string;
  amount: number;
  cleared: boolean;
  notes?: string;
}

interface BankReconTabProps {
  collections: Collection[];
  payments: Payment[];
  specialEntries: SpecialEntry[];
  setSpecialEntries: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  accountTitles: AccountTitle[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

const INITIAL_SAMPLE_RECON_ITEMS: BankReconItem[] = [
  {
    id: 1,
    date: '2026-03-30',
    type: 'deposit_in_transit',
    reference_no: 'CR-2026-088',
    payee_payer: 'Acme Commercial Customer',
    amount: 145000,
    cleared: false,
    notes: 'Collections deposited on March 31 afternoon cut-off'
  },
  {
    id: 2,
    date: '2026-03-29',
    type: 'outstanding_check',
    reference_no: 'CHK-90412',
    payee_payer: 'Prime Office Space Leasing Inc.',
    amount: 65000,
    cleared: false,
    notes: 'Rent check issued, not yet presented by landlord'
  },
  {
    id: 3,
    date: '2026-03-31',
    type: 'outstanding_check',
    reference_no: 'CHK-90415',
    payee_payer: 'Meralco Utility Billing',
    amount: 28450,
    cleared: false,
    notes: 'Check released to courier on end-of-month'
  },
  {
    id: 4,
    date: '2026-03-31',
    type: 'bank_service_charge',
    reference_no: 'DM-9941',
    payee_payer: 'BDO Unibank - Main',
    amount: 500,
    cleared: true,
    notes: 'Monthly account maintenance & checkbook fees'
  },
  {
    id: 5,
    date: '2026-03-31',
    type: 'interest_income',
    reference_no: 'CM-0124',
    payee_payer: 'BDO Interest Crediting',
    amount: 1250.75,
    cleared: true,
    notes: 'Gross savings/deposit interest earned net of final tax'
  }
];

export default function BankReconTab({
  collections = [],
  payments = [],
  specialEntries = [],
  setSpecialEntries,
  accountTitles = [],
  activeCompany,
  theme,
  triggerAlert,
  globalSearch = ''
}: BankReconTabProps) {
  const [selectedBank, setSelectedBank] = useState('BDO Unibank - CA #0012-3456-7890');
  const [statementDate, setStatementDate] = useState('2026-03-31');
  const [bankStatementBalance, setBankStatementBalance] = useState<number>(452700.75);
  const [bookBalance, setBookBalance] = useState<number>(400000.00);
  const [reconItems, setReconItems] = useState<BankReconItem[]>(INITIAL_SAMPLE_RECON_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemType, setItemType] = useState<BankReconItem['type']>('deposit_in_transit');
  const [itemRef, setItemRef] = useState('');
  const [itemParty, setItemParty] = useState('');
  const [itemAmount, setItemAmount] = useState<string>('');
  const [itemNotes, setItemNotes] = useState('');

  // Calculations
  const depositsInTransit = useMemo(() => 
    reconItems.filter(i => i.type === 'deposit_in_transit' && !i.cleared)
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const outstandingChecks = useMemo(() => 
    reconItems.filter(i => i.type === 'outstanding_check' && !i.cleared)
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const bankErrors = useMemo(() => 
    reconItems.filter(i => i.type === 'bank_error' && !i.cleared)
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const adjustedBankBalance = useMemo(() => {
    return bankStatementBalance + depositsInTransit - outstandingChecks + bankErrors;
  }, [bankStatementBalance, depositsInTransit, outstandingChecks, bankErrors]);

  const interestIncome = useMemo(() => 
    reconItems.filter(i => i.type === 'interest_income')
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const bankServiceCharges = useMemo(() => 
    reconItems.filter(i => i.type === 'bank_service_charge')
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const nsfChecks = useMemo(() => 
    reconItems.filter(i => i.type === 'nsf_check')
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const bookErrors = useMemo(() => 
    reconItems.filter(i => i.type === 'book_error')
      .reduce((sum, i) => sum + i.amount, 0)
  , [reconItems]);

  const adjustedBookBalance = useMemo(() => {
    return bookBalance + interestIncome - bankServiceCharges - nsfChecks + bookErrors;
  }, [bookBalance, interestIncome, bankServiceCharges, nsfChecks, bookErrors]);

  const discrepancy = useMemo(() => {
    return Math.abs(adjustedBankBalance - adjustedBookBalance);
  }, [adjustedBankBalance, adjustedBookBalance]);

  const isReconciled = discrepancy < 0.01;

  // Filtered Items
  const filteredItems = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return reconItems;
    return reconItems.filter(i => 
      i.reference_no.toLowerCase().includes(q) ||
      i.payee_payer.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }, [reconItems, searchTerm, globalSearch]);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(itemAmount);
    if (isNaN(val) || val <= 0) {
      triggerAlert('Please enter a valid positive amount!', 'error');
      return;
    }
    if (!itemRef || !itemParty) {
      triggerAlert('Reference Number and Payee/Payer are required!', 'error');
      return;
    }

    if (editingItemId !== null) {
      setReconItems(prev => prev.map(item => item.id === editingItemId ? {
        ...item,
        date: itemDate,
        type: itemType,
        reference_no: itemRef,
        payee_payer: itemParty,
        amount: val,
        notes: itemNotes
      } : item));
      triggerAlert('Reconciling item updated successfully.', 'success');
    } else {
      const newItem: BankReconItem = {
        id: Date.now(),
        date: itemDate,
        type: itemType,
        reference_no: itemRef,
        payee_payer: itemParty,
        amount: val,
        cleared: false,
        notes: itemNotes
      };
      setReconItems(prev => [...prev, newItem]);
      triggerAlert('New reconciling item added.', 'success');
    }

    handleCancelModal();
  };

  const handleCancelModal = () => {
    setIsItemModalOpen(false);
    setEditingItemId(null);
    setItemDate(new Date().toISOString().split('T')[0]);
    setItemType('deposit_in_transit');
    setItemRef('');
    setItemParty('');
    setItemAmount('');
    setItemNotes('');
  };

  const handleEditItem = (item: BankReconItem) => {
    setEditingItemId(item.id);
    setItemDate(item.date);
    setItemType(item.type);
    setItemRef(item.reference_no);
    setItemParty(item.payee_payer);
    setItemAmount(item.amount.toString());
    setItemNotes(item.notes || '');
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    setReconItems(prev => prev.filter(i => i.id !== id));
    triggerAlert('Reconciling item removed.', 'info');
  };

  // Generate Bank Recon Adjusting Entry directly into Special Journal
  const handleGenerateBankAJE = () => {
    if (!activeCompany) {
      triggerAlert('Please select an active Company Profile first!', 'error');
      return;
    }

    if (bankServiceCharges === 0 && interestIncome === 0 && nsfChecks === 0) {
      triggerAlert('No unrecorded book reconciling items (Bank Charges, Interest, NSF) to adjust!', 'info');
      return;
    }

    const nextVoucherNo = `AJE-BRECON-${statementDate.replace(/-/g, '').slice(0, 6)}-01`;

    const lines: any[] = [];
    
    // 1. Bank Service Charges Entry: Dr. Bank Charges (6030/5010), Cr. Cash in Bank (1010)
    if (bankServiceCharges > 0) {
      lines.push({
        type: 'Debit',
        account_code: '6030',
        account_title: 'Bank Service Charges & Fees',
        amount: bankServiceCharges
      });
    }

    // 2. NSF Bounced Checks Entry: Dr. Accounts Receivable (1020), Cr. Cash in Bank (1010)
    if (nsfChecks > 0) {
      lines.push({
        type: 'Debit',
        account_code: '1020',
        account_title: 'Accounts Receivable (Restored NSF Check)',
        amount: nsfChecks
      });
    }

    // 3. Interest Income Entry: Dr. Cash in Bank (1010), Cr. Interest Income (4020/4030)
    if (interestIncome > 0) {
      lines.push({
        type: 'Debit',
        account_code: '1010',
        account_title: 'Cash and Cash Equivalents (Cash in Bank)',
        amount: interestIncome
      });
      lines.push({
        type: 'Credit',
        account_code: '4020',
        account_title: 'Interest Income from Bank Deposits',
        amount: interestIncome
      });
    }

    // Credit Cash for bank charges & NSF
    const totalCreditCash = bankServiceCharges + nsfChecks;
    if (totalCreditCash > 0) {
      lines.push({
        type: 'Credit',
        account_code: '1010',
        account_title: 'Cash and Cash Equivalents (Cash in Bank)',
        amount: totalCreditCash
      });
    }

    const newAJE: SpecialEntry = {
      id: Date.now(),
      company_name: activeCompany.company_name || 'Active Company',
      entry_number: nextVoucherNo,
      voucher_no: nextVoucherNo,
      entry_date: statementDate,
      entry_type: 'Adjusting Entry',
      description: `AJE: Bank Reconciliation Adjustments for ${selectedBank} (Charges ₱${bankServiceCharges.toLocaleString()}, Interest ₱${interestIncome.toLocaleString()})`,
      lines
    };

    setSpecialEntries(prev => [newAJE, ...prev]);
    triggerAlert(`Bank Reconciliation Adjusting Entry "${nextVoucherNo}" posted to Special Journal & General Ledger!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PFRS / PAS 7 & PAS 1 Cash Audit
              </span>
              <span className="text-xs text-zinc-400">Monthly Proof of Cash</span>
            </div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2 mt-1`}>
              <Landmark className="w-6 h-6 text-cyan-400" />
              Bank Reconciliation & Proof of Cash
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Match Cash in Bank general ledger balances with official bank statements, identify Deposits in Transit (DIT), Outstanding Checks (OC), and post AJE book adjustments.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                handleCancelModal();
                setIsItemModalOpen(true);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer ${theme.accentBg} hover:brightness-110`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Reconciling Item</span>
            </button>

            <button
              onClick={handleGenerateBankAJE}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
              title="Post Adjusting Entry (AJE) for Bank Charges and Interest directly into Special Journal"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Post Bank AJE to Journal</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${theme.borderCard} ${theme.isLight ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} flex items-center gap-1.5 transition cursor-pointer`}
            >
              <Printer className="w-4 h-4" />
              <span>Print Recon</span>
            </button>
          </div>
        </div>

        {/* BANK ACCOUNT & STATEMENT SETTINGS BAR */}
        <div className="mt-6 pt-5 border-t border-zinc-500/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Depository Bank & Account
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${theme.borderInput} ${theme.bgInput} ${theme.textMain} focus:outline-none`}
            >
              <option value="BDO Unibank - CA #0012-3456-7890">BDO Unibank - CA #0012-3456-7890</option>
              <option value="BPI - Checking #1920-8831-22">BPI - Checking #1920-8831-22</option>
              <option value="Metrobank - CA #554-123-9988">Metrobank - CA #554-123-9988</option>
              <option value="UnionBank - Business Account #1098-7744-12">UnionBank - Business Account #1098-7744-12</option>
              <option value="Security Bank - Corporate #0034-9912-44">Security Bank - Corporate #0034-9912-44</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Statement Cut-off Date
            </label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-medium font-mono ${theme.borderInput} ${theme.bgInput} ${theme.textMain} focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Bank Statement Ending Balance (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={bankStatementBalance}
              onChange={(e) => setBankStatementBalance(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-bold font-mono ${theme.borderInput} ${theme.bgInput} text-cyan-400 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              General Ledger Book Balance (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={bookBalance}
              onChange={(e) => setBookBalance(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-bold font-mono ${theme.borderInput} ${theme.bgInput} text-emerald-400 focus:outline-none`}
            />
          </div>
        </div>
      </div>

      {/* RECONCILIATION SUMMARY SCORECARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Adjusted Bank Balance Card */}
        <div className={`p-5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-sm relative overflow-hidden`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider">Adjusted Bank Balance</span>
            <ArrowDownRight className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            ₱{adjustedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span>Unadjusted Bank Balance:</span>
              <span>₱{bankStatementBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>+ Deposits in Transit (DIT):</span>
              <span>₱{depositsInTransit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>- Outstanding Checks (OC):</span>
              <span>(₱{outstandingChecks.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
          </div>
        </div>

        {/* Adjusted Book Balance Card */}
        <div className={`p-5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-sm relative overflow-hidden`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider">Adjusted Book Balance</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            ₱{adjustedBookBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span>Unadjusted Book Balance:</span>
              <span>₱{bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>+ Interest Income Credited:</span>
              <span>₱{interestIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>- Bank Charges / NSF / Errors:</span>
              <span>(₱{(bankServiceCharges + nsfChecks).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
          </div>
        </div>

        {/* Reconciliation Status Card */}
        <div className={`p-5 rounded-2xl border ${isReconciled ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'} shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-zinc-400">Reconciliation Status</span>
              {isReconciled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> BALANCED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> OUT OF BALANCE
                </span>
              )}
            </div>
            <div className={`mt-2 text-2xl font-bold font-mono ${isReconciled ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₱{discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {isReconciled 
                ? 'Adjusted Bank Balance exactly equals Adjusted Book Balance. Ready for Month-End Closing.' 
                : 'Difference between Adjusted Bank and Adjusted Book. Please check outstanding checks or unrecorded deposits.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-500/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Cut-off: {statementDate}</span>
            <span>Items: {reconItems.length} listed</span>
          </div>
        </div>
      </div>

      {/* FORMAL 2-COLUMN BANK RECONCILIATION STATEMENT */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5 flex items-center justify-between`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle} flex items-center gap-2`}>
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Formal Bank Reconciliation Statement (Bank-to-Book Method)
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>Standard Philippine AFS & BIR Audit schedule format.</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">{activeCompany?.company_name || 'Active Company'} • {selectedBank}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-500/10">
          {/* LEFT COLUMN: BANK SIDE */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-cyan-400">1. Bank Statement Adjustments</span>
              <span className="font-mono font-bold text-xs text-zinc-300">₱{bankStatementBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Deposits in Transit */}
            <div>
              <div className="text-[11px] font-bold uppercase text-emerald-400 flex items-center justify-between">
                <span>Add: Deposits in Transit (DIT)</span>
                <span>+ ₱{depositsInTransit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 space-y-1">
                {reconItems.filter(i => i.type === 'deposit_in_transit').length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic">No pending deposits in transit</div>
                ) : (
                  reconItems.filter(i => i.type === 'deposit_in_transit').map(i => (
                    <div key={i.id} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-zinc-500/5">
                      <div>
                        <span className="font-bold text-zinc-300">{i.reference_no}</span>
                        <span className="text-zinc-500 ml-2">({i.payee_payer})</span>
                      </div>
                      <span className="text-emerald-400">₱{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Outstanding Checks */}
            <div>
              <div className="text-[11px] font-bold uppercase text-rose-400 flex items-center justify-between">
                <span>Less: Outstanding Checks (OC)</span>
                <span>- ₱{outstandingChecks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 space-y-1">
                {reconItems.filter(i => i.type === 'outstanding_check').length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic">No outstanding checks</div>
                ) : (
                  reconItems.filter(i => i.type === 'outstanding_check').map(i => (
                    <div key={i.id} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-zinc-500/5">
                      <div>
                        <span className="font-bold text-zinc-300">{i.reference_no}</span>
                        <span className="text-zinc-500 ml-2">({i.payee_payer})</span>
                      </div>
                      <span className="text-rose-400">₱{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Adjusted Bank Total */}
            <div className="pt-3 border-t-2 border-cyan-500/30 flex items-center justify-between text-xs font-mono font-bold bg-cyan-500/5 p-2 rounded-lg">
              <span className="text-cyan-400 uppercase">Adjusted Bank Balance</span>
              <span className="text-cyan-400 text-sm">₱{adjustedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* RIGHT COLUMN: BOOK SIDE */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">2. Book / Ledger Adjustments</span>
              <span className="font-mono font-bold text-xs text-zinc-300">₱{bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Interest & Direct Credits */}
            <div>
              <div className="text-[11px] font-bold uppercase text-emerald-400 flex items-center justify-between">
                <span>Add: Interest Income & Bank Credits</span>
                <span>+ ₱{interestIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 space-y-1">
                {reconItems.filter(i => i.type === 'interest_income').length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic">No credit memos / interest</div>
                ) : (
                  reconItems.filter(i => i.type === 'interest_income').map(i => (
                    <div key={i.id} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-zinc-500/5">
                      <div>
                        <span className="font-bold text-zinc-300">{i.reference_no}</span>
                        <span className="text-zinc-500 ml-2">({i.payee_payer})</span>
                      </div>
                      <span className="text-emerald-400">₱{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bank Charges, NSF & Debit Memos */}
            <div>
              <div className="text-[11px] font-bold uppercase text-rose-400 flex items-center justify-between">
                <span>Less: Bank Service Charges & NSF Checks</span>
                <span>- ₱{(bankServiceCharges + nsfChecks).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 space-y-1">
                {reconItems.filter(i => i.type === 'bank_service_charge' || i.type === 'nsf_check').length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic">No debit memos / service charges</div>
                ) : (
                  reconItems.filter(i => i.type === 'bank_service_charge' || i.type === 'nsf_check').map(i => (
                    <div key={i.id} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-zinc-500/5">
                      <div>
                        <span className="font-bold text-zinc-300">{i.reference_no}</span>
                        <span className="text-zinc-500 ml-2">({i.payee_payer})</span>
                      </div>
                      <span className="text-rose-400">₱{i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Adjusted Book Total */}
            <div className="pt-3 border-t-2 border-emerald-500/30 flex items-center justify-between text-xs font-mono font-bold bg-emerald-500/5 p-2 rounded-lg">
              <span className="text-emerald-400 uppercase">Adjusted Book Balance</span>
              <span className="text-emerald-400 text-sm">₱{adjustedBookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECONCILING ITEMS REGISTER TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Reconciling Items Register ({filteredItems.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Individual listings of deposits in transit, outstanding checks, bank charges, and corrections.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search reference or party..."
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
                <th className="p-3">Date</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Ref / Check #</th>
                <th className="p-3">Payee / Payer</th>
                <th className="p-3">Notes & Explanation</th>
                <th className="p-3 text-right">Amount (₱)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No reconciling items found. Click "Add Reconciling Item" above to add one.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono text-zinc-300">{item.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === 'deposit_in_transit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.type === 'outstanding_check' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        item.type === 'bank_service_charge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.type === 'interest_income' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-200">{item.reference_no}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{item.payee_payer}</td>
                    <td className="p-3 text-zinc-400 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      item.type === 'deposit_in_transit' || item.type === 'interest_income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditItem(item)}
                          className={`p-1 px-2 rounded-md border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100' : 'bg-zinc-900 hover:bg-zinc-800'} text-cyan-400 transition cursor-pointer`}
                          title="Edit Item"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 px-2 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT RECON ITEM MODAL */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-3">
              <h3 className={`font-bold text-base ${theme.textTitle} flex items-center gap-2`}>
                <Plus className="w-5 h-5 text-cyan-400" />
                {editingItemId ? 'Edit Reconciling Item' : 'Add Bank Reconciling Item'}
              </h3>
              <button
                onClick={handleCancelModal}
                className="text-zinc-400 hover:text-zinc-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={itemDate}
                    onChange={(e) => setItemDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                  >
                    <option value="deposit_in_transit">Deposit in Transit (DIT) (+ Bank)</option>
                    <option value="outstanding_check">Outstanding Check (OC) (- Bank)</option>
                    <option value="bank_service_charge">Bank Service Charge (- Book)</option>
                    <option value="interest_income">Interest Income Earned (+ Book)</option>
                    <option value="nsf_check">NSF / Bounced Check (- Book)</option>
                    <option value="bank_error">Bank Error (+/- Bank)</option>
                    <option value="book_error">Book / Recording Error (+/- Book)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reference / Check #</label>
                  <input
                    type="text"
                    placeholder="e.g. CHK-10293, CR-883"
                    value={itemRef}
                    onChange={(e) => setItemRef(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemAmount}
                    onChange={(e) => setItemAmount(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-bold font-mono text-cyan-400 ${theme.borderInput} ${theme.bgInput}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Payee / Payer</label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Name, Customer Name, or Depository Bank"
                  value={itemParty}
                  onChange={(e) => setItemParty(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Notes & Particulars</label>
                <textarea
                  rows={2}
                  placeholder="Additional context, bank remarks, check clearance status..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${theme.borderInput} ${theme.bgInput} ${theme.textMain}`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-500/10">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${theme.borderCard} text-zinc-400 hover:text-zinc-200 cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md ${theme.accentBg} hover:brightness-110 cursor-pointer`}
                >
                  {editingItemId ? 'Update Item' : 'Save Reconciling Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
