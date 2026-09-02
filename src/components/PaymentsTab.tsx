import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Pencil, Trash2, Ban, RotateCcw, Plus, Search, X, CreditCard } from 'lucide-react';
import { Payment, Expense, Contractor, Company } from '../types';

interface PaymentsTabProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  serviceProviders: Contractor[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  setShowAddProviderPrompt: (val: { tin: string, type: 'expenses' | 'payments' } | null) => void;
  globalSearch: string;
}

export default function PaymentsTab({
  payments,
  setPayments,
  expenses,
  setExpenses,
  serviceProviders,
  activeCompany,
  theme,
  triggerAlert,
  setShowAddProviderPrompt,
  globalSearch
}: PaymentsTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  const [payTin, setPayTin] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [providerName, setProviderName] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [withheld2307, setWithheld2307] = useState('0');
  const [voucherAmount, setVoucherAmount] = useState('');
  const [disbursementNo, setDisbursementNo] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-generate Disbursement Entry #
  useEffect(() => {
    if (!disbursementNo && editingId === null) {
      const nextNum = payments.length + 1;
      setDisbursementNo(`DISB-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`);
    }
  }, [payments, disbursementNo, editingId]);

  // Mask TIN
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setPayTin(formatted);
  };

  const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Voucher autofill
  useEffect(() => {
    if (voucherNo) {
      const normInput = normalizeDocNo(voucherNo);
      const foundExp = expenses.find(e => normalizeDocNo(e.invoice_number) === normInput && (!activeCompanyName || e.company_name === activeCompanyName));
      if (foundExp) {
        setVoucherAmount(foundExp.total_amount_due.toString());
        setPayTin(foundExp.service_provider_TIN);
        setProviderName(foundExp.registered_name);

        const prevPayments = payments.filter(p => normalizeDocNo(p.voucher_number) === normalizeDocNo(foundExp.invoice_number));
        const totalPrevPaid = prevPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        const totalPrevWithheld = prevPayments.reduce((sum, p) => sum + (Number(p.withholding_tax_2307) || 0), 0);

        const outstanding = Math.max(0, foundExp.total_amount_due - totalPrevPaid - totalPrevWithheld);
        setAmountPaid(outstanding.toString());

        triggerAlert(`Found Voucher ${foundExp.invoice_number}. Total Amount Due: ₱${foundExp.total_amount_due.toLocaleString()}`, 'info');
      }
    }
  }, [voucherNo, expenses, payments, activeCompanyName, triggerAlert]);

  const selectedExpense = useMemo(() => {
    if (!voucherNo) return null;
    const normInput = normalizeDocNo(voucherNo);
    return expenses.find(e => normalizeDocNo(e.invoice_number) === normInput);
  }, [voucherNo, expenses]);

  const vAmount = selectedExpense ? selectedExpense.total_amount_due : (parseFloat(voucherAmount) || 0);
  const thisPaid = parseFloat(amountPaid) || 0;
  const thisWithheld = parseFloat(withheld2307) || 0;

  const handleEditClick = (item: Payment) => {
    setEditingId(item.id);
    setPayTin(item.service_provider_TIN);
    setVoucherNo(item.voucher_number);
    setProviderName(item.registered_name);
    setPaymentDate(item.payment_date);
    setAmountPaid(item.amount_paid.toString());
    setWithheld2307((item.withholding_tax_2307 || 0).toString());
    setVoucherAmount((item.voucher_amount || item.invoice_amount || item.amount_paid).toString());
    setDisbursementNo(item.entry_number || `DISB-${item.id}`);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPayTin('');
    setVoucherNo('');
    setProviderName('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmountPaid('');
    setWithheld2307('0');
    setVoucherAmount('');
    setDisbursementNo('');
  };

  const handleDeletePayment = (id: number, entryNo: string) => {
    if (window.confirm(`Are you sure you want to delete payment record ${entryNo || ''}?`)) {
      setPayments(prev => prev.filter(p => p.id !== id));
      triggerAlert(`Payment record deleted.`, "info");
    }
  };

  const handleToggleCancelPayment = (p: Payment) => {
    const isCurrentlyCancelled = p.is_cancelled;
    if (isCurrentlyCancelled) {
      if (window.confirm(`Uncancel and restore disbursement record #${p.entry_number}?`)) {
        setPayments(prev => prev.map(item => item.id === p.id ? { ...item, is_cancelled: false } : item));
        triggerAlert(`Restored payment record #${p.entry_number}`, 'success');
      }
    } else {
      const reason = window.prompt(`Are you sure you want to CANCEL disbursement record #${p.entry_number}? Optional reason:`, 'Disbursement Voided / Payment Stopped');
      if (reason !== null) {
        setPayments(prev => prev.map(item => {
          if (item.id === p.id) {
            return {
              ...item,
              is_cancelled: true,
              cancel_reason: reason || 'Cancelled by user',
              cancel_date: new Date().toISOString().split('T')[0]
            };
          }
          return item;
        }));
        // Revert linked expense back to Unpaid
        const linkedExpense = expenses.find(e => normalizeDocNo(e.invoice_number) === normalizeDocNo(p.voucher_number));
        if (linkedExpense) {
          setExpenses(prev => prev.map(e => e.id === linkedExpense.id ? { ...e, payment_status: 'Unpaid' } : e));
        }
        triggerAlert(`Payment #${p.entry_number} marked as CANCELLED.`, 'info');
      }
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      return;
    }
    if (!payTin || !voucherNo || !paymentDate || !amountPaid) {
      triggerAlert("Provider TIN, Voucher Number, Payment Date, and Amount Paid are required fields!", "error");
      return;
    }

    const amtP = parseFloat(amountPaid) || 0;
    const w2307 = parseFloat(withheld2307) || 0;
    const remBalance = Math.max(0, vAmount - amtP - w2307);

    const newPaymentItem: Payment = {
      id: editingId !== null ? editingId : Date.now(),
      company_name: activeCompanyName,
      service_provider_TIN: payTin,
      voucher_number: voucherNo,
      registered_name: providerName || `Provider (${voucherNo})`,
      payment_date: paymentDate,
      amount_paid: amtP,
      withholding_tax_2307: w2307,
      invoice_amount: vAmount,
      voucher_amount: vAmount,
      balance: remBalance,
      entry_number: disbursementNo
    };

    if (editingId !== null) {
      setPayments(prev => prev.map(p => p.id === editingId ? newPaymentItem : p));
      triggerAlert(`Updated Payment Entry #${disbursementNo} successfully!`, 'success');
      handleCancelEdit();
      setIsModalOpen(false);
    } else {
      setPayments(prev => [newPaymentItem, ...prev]);

      if (selectedExpense) {
        const newStatus = remBalance <= 0.01 ? 'Paid' : 'Unpaid';
        setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? { ...e, payment_status: newStatus } : e));
      }

      triggerAlert(`Recorded Payment Entry #${disbursementNo} successfully!`, 'success');
      setVoucherNo('');
      setAmountPaid('');
      setWithheld2307('0');
      setVoucherAmount('');
      setIsModalOpen(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(p => 
      p.entry_number.toLowerCase().includes(q) ||
      p.voucher_number.toLowerCase().includes(q) ||
      p.registered_name.toLowerCase().includes(q) ||
      p.service_provider_TIN.includes(q)
    );
  }, [payments, searchTerm, globalSearch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PAYMENTS SPREADSHEET TABLE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Cash Disbursements & Payments Book ({filteredPayments.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Summary and register of cash & check disbursements, bank withdrawals, payment vouchers, and liquidation of accounts payable.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter entry, voucher, provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
            <button
              onClick={() => {
                handleCancelEdit();
                setIsModalOpen(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${theme.accentBg} hover:brightness-110`}
            >
              <Plus className="w-4 h-4" />
              <span>Record a Payment</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 font-mono">Entry #</th>
                <th className="p-3 font-mono">Voucher #</th>
                <th className="p-3 font-mono">Date</th>
                <th className="p-3">Provider Name</th>
                <th className="p-3 text-right font-mono">Amount Paid</th>
                <th className="p-3 text-right font-mono">Withheld 2307</th>
                <th className="p-3 text-right font-mono">Remaining Balance</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredPayments.map((p) => {
                const isCancelled = p.is_cancelled;
                return (
                  <tr key={p.id} className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-cyan-400'}`}>
                      {p.entry_number || `DISB-${p.id}`}
                    </td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{p.voucher_number}</td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-400'}`}>{p.payment_date}</td>
                    <td className={`p-3 font-semibold ${isCancelled ? 'line-through text-zinc-500' : theme.textTitle}`}>{p.registered_name}</td>
                    <td className={`p-3 text-right font-mono font-bold ${isCancelled ? 'line-through text-zinc-500' : 'text-rose-400'}`}>
                      ₱{p.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-amber-400'}`}>
                      ₱{p.withholding_tax_2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-400'}`}>
                      ₱{(p.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleToggleCancelPayment(p)} 
                          title={isCancelled ? "Restore Payment" : "Cancel Payment"}
                          className={`p-1 px-2 rounded border cursor-pointer ${isCancelled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                        >
                          {isCancelled ? <RotateCcw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        </button>
                        {!isCancelled && (
                          <button onClick={() => handleEditClick(p)} title="Edit Payment" className="p-1 px-2 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => handleDeletePayment(p.id, p.entry_number || '')} title="Delete Record" className="p-1 px-2 rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-4xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? `Edit Disbursement #${disbursementNo}` : 'Record Vendor Payment'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>Select unpaid expense voucher to autofill supplier details, or enter disbursement manually.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleCancelEdit();
                }}
                className={`p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePayment} className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Voucher & Entry</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Disbursement Entry # *
                  </label>
                  <input 
                    type="text"
                    value={disbursementNo}
                    onChange={(e) => setDisbursementNo(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Select Unpaid Expense Voucher
                  </label>
                  <select
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="" className="text-zinc-900 bg-white">-- Select Unpaid Voucher --</option>
                    {expenses.filter(e => e.payment_status !== 'Paid' || e.invoice_number === voucherNo).map(e => (
                      <option key={e.id} value={e.invoice_number} className="text-zinc-900 bg-white">
                        {e.invoice_number} ({e.registered_name}) - ₱{e.total_amount_due.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Provider TIN *
                  </label>
                  <input 
                    type="text"
                    value={payTin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Disbursement Reference & Amounts</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Provider Name
                  </label>
                  <input 
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Payment Date *</label>
                    <input 
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Amount Paid (₱) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">EWT 2307 Remitted (₱)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={withheld2307}
                    onChange={(e) => setWithheld2307(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-3 h-full justify-between self-stretch">
                <div className="p-3.5 rounded-xl border font-mono text-xs space-y-1.5 bg-zinc-500/5 border-zinc-700/30">
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Total Voucher Due:</span>
                    <span className="font-bold">₱{vAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 text-[10px]">
                    <span>Cash Paid Out:</span>
                    <span className="font-bold">₱{thisPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 text-[10px]">
                    <span>EWT Withheld:</span>
                    <span>₱{thisWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-zinc-800/40 my-1"></div>
                  <div className="flex justify-between font-bold text-xs text-cyan-400">
                    <span>Remaining Liability:</span>
                    <span>₱{Math.max(0, vAmount - thisPaid - thisWithheld).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="lg:col-span-10 flex justify-end gap-3 pt-4 border-t border-zinc-800/40 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleCancelEdit();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800/40 border border-zinc-700/50 cursor-pointer transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md ${editingId !== null ? 'bg-cyan-600 hover:bg-cyan-500' : theme.accentBg}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingId !== null ? 'Update Payment Record' : 'Save Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
