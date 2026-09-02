import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Pencil, Trash2, Ban, RotateCcw, Plus, Search, X, Receipt, Calculator } from 'lucide-react';
import { Expense, Contractor, Company, Payment } from '../types';
import { computeExpenseFormulas } from '../utils/accounting';

interface ExpensesTabProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  serviceProviders: Contractor[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  setShowAddProviderPrompt: (val: { tin: string, type: 'expenses' | 'payments' } | null) => void;
  globalSearch: string;
}

export default function ExpensesTab({
  expenses,
  setExpenses,
  setPayments,
  serviceProviders,
  activeCompany,
  theme,
  triggerAlert,
  setShowAddProviderPrompt,
  globalSearch
}: ExpensesTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  // Form fields
  const [expTin, setExpTin] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [invoiceType, setInvoiceType] = useState('Service Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('EXP-001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState('Rent Expense');
  const [paymentType, setPaymentType] = useState<'paid' | 'on credit' | 'partial'>('paid');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('5000');
  const [zeroRated, setZeroRated] = useState('0');
  const [vatExempt, setVatExempt] = useState('0');
  const [lessDiscount, setLessDiscount] = useState('0');
  const [lessWithholdingTax, setLessWithholdingTax] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formula calculations
  const formulaResults = useMemo(() => {
    return computeExpenseFormulas({
      qty: parseFloat(qty) || 0,
      unit_price: parseFloat(unitPrice) || 0,
      zero_rated: parseFloat(zeroRated) || 0,
      vat_exempt: parseFloat(vatExempt) || 0,
      less_discount: parseFloat(lessDiscount) || 0,
      less_withholding_tax: parseFloat(lessWithholdingTax) || 0,
      is_vat_registered: activeCompany?.vat_or_non_vat !== 'NON-VATABLE'
    });
  }, [qty, unitPrice, zeroRated, vatExempt, lessDiscount, lessWithholdingTax, activeCompany]);

  // Masking TIN
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setExpTin(formatted);
  };

  const lastPromptedTinRef = useRef<string>('');

  // TIN Autofill
  useEffect(() => {
    const cleanTin = expTin.replace(/-/g, '');
    if (cleanTin.length >= 9) {
      const found = serviceProviders.find(p => p.service_provider_TIN === expTin && activeCompanyName && p.company_name === activeCompanyName);
      if (found) {
        if (registeredName !== found.registered_name || providerAddress !== found.service_provider_Address) {
          setRegisteredName(found.registered_name);
          setProviderAddress(found.service_provider_Address);
          triggerAlert(`Autofilled Provider: ${found.registered_name}`, 'info');
        }
      } else {
        if (registeredName !== '' || providerAddress !== '') {
          setRegisteredName('');
          setProviderAddress('');
        }
        if (lastPromptedTinRef.current !== expTin) {
          lastPromptedTinRef.current = expTin;
          setShowAddProviderPrompt({ tin: expTin, type: 'expenses' });
        }
      }
    } else {
      lastPromptedTinRef.current = '';
    }
  }, [expTin, serviceProviders, activeCompanyName, registeredName, providerAddress, triggerAlert, setShowAddProviderPrompt]);

  const handleEditClick = (item: Expense) => {
    setEditingId(item.id);
    setExpTin(item.service_provider_TIN);
    setRegisteredName(item.registered_name);
    setProviderAddress(item.service_provider_Address || '');
    setInvoiceType(item.invoice_type);
    setInvoiceNumber(item.invoice_number);
    setIssueDate(item.issue_date);
    setDescription(item.description || '');
    setExpenseType(item.expense_type || 'Operating Expense');
    setPaymentType(item.payment_type as any);
    setQty((item.qty || 1).toString());
    setUnitPrice((item.unit_price || item.amount).toString());
    setZeroRated((item.zero_rated || 0).toString());
    setVatExempt((item.vat_exempt || 0).toString());
    setLessDiscount((item.less_discount || 0).toString());
    setLessWithholdingTax((item.less_withholding_tax || 0).toString());
    setPaymentStatus(item.payment_status);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExpTin('');
    setRegisteredName('');
    setProviderAddress('');
    setInvoiceType('Service Invoice');
    setInvoiceNumber(`EXP-${Date.now().toString().slice(-4)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setExpenseType('Rent Expense');
    setPaymentType('paid');
    setQty('1');
    setUnitPrice('5000');
    setZeroRated('0');
    setVatExempt('0');
    setLessDiscount('0');
    setLessWithholdingTax('0');
    setPaymentStatus('Paid');
  };

  const handleDeleteExpense = (id: number, invNo: string) => {
    if (window.confirm(`Are you sure you want to delete expense voucher #${invNo}?`)) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      triggerAlert(`Expense voucher #${invNo} deleted.`, "info");
    }
  };

  const handleToggleCancelExpense = (e: Expense) => {
    const isCurrentlyCancelled = e.is_cancelled || e.payment_status === 'Cancelled';
    if (isCurrentlyCancelled) {
      if (window.confirm(`Uncancel and restore Expense Voucher #${e.invoice_number}?`)) {
        setExpenses(prev => prev.map(item => {
          if (item.id === e.id) {
            return {
              ...item,
              is_cancelled: false,
              payment_status: 'Unpaid'
            };
          }
          return item;
        }));
        triggerAlert(`Restored Expense Voucher #${e.invoice_number}`, 'success');
      }
    } else {
      const reason = window.prompt(`Are you sure you want to CANCEL Expense Voucher #${e.invoice_number}? Optional reason:`, 'Expense Cancelled / Returned');
      if (reason !== null) {
        setExpenses(prev => prev.map(item => {
          if (item.id === e.id) {
            return {
              ...item,
              is_cancelled: true,
              payment_status: 'Cancelled',
              cancel_reason: reason || 'Cancelled by user',
              cancel_date: new Date().toISOString().split('T')[0]
            };
          }
          return item;
        }));
        triggerAlert(`Expense Voucher #${e.invoice_number} marked as CANCELLED.`, 'info');
      }
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      return;
    }
    if (!expTin || !issueDate || !invoiceNumber || formulaResults.amount <= 0) {
      triggerAlert("Service Provider TIN, Date, Voucher Number, and Valid Amount are required!", "error");
      return;
    }

    const newExpenseItem: Expense = {
      id: editingId !== null ? editingId : Date.now(),
      company_name: activeCompanyName,
      registered_name: registeredName || `Provider (${invoiceNumber})`,
      service_provider_TIN: expTin,
      service_provider_Address: providerAddress,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      description: description || 'Expense Purchase',
      expense_type: expenseType,
      payment_type: paymentType,
      qty: parseFloat(qty) || 1,
      unit_price: parseFloat(unitPrice) || formulaResults.amount,
      amount: formulaResults.amount,
      vatable_expense: formulaResults.vatable_expense,
      vat: formulaResults.vat,
      zero_rated: formulaResults.zero_rated,
      vat_exempt: formulaResults.vat_exempt,
      total_expenses_vat_inclusive: formulaResults.total_expenses_vat_inclusive,
      less_vat: formulaResults.less_vat,
      amount_net_of_vat: formulaResults.amount_net_of_vat,
      less_discount: formulaResults.less_discount,
      add_vat: formulaResults.add_vat,
      less_withholding_tax: formulaResults.less_withholding_tax,
      total_amount_due: formulaResults.total_amount_due,
      payment_status: paymentStatus
    };

    if (editingId !== null) {
      setExpenses(prev => prev.map(e => e.id === editingId ? newExpenseItem : e));
      triggerAlert(`Updated Expense Voucher #${invoiceNumber} successfully!`, "success");
      handleCancelEdit();
      setIsModalOpen(false);
    } else {
      if (expenses.some(e => e.invoice_number.toLowerCase().trim() === invoiceNumber.toLowerCase().trim() && e.company_name === activeCompanyName)) {
        triggerAlert(`Voucher number "${invoiceNumber}" is already in use for this company.`, "error");
        return;
      }
      setExpenses(prev => [newExpenseItem, ...prev]);
      triggerAlert(`Recorded Expense Voucher #${invoiceNumber} successfully!`, "success");

      setInvoiceNumber(`EXP-${Date.now().toString().slice(-4)}`);
      setDescription('');
      setQty('1');
      setUnitPrice('5000');
      setIsModalOpen(false);
    }
  };

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const filteredExpenses = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return expenses;
    return expenses.filter(e =>
      e.invoice_number.toLowerCase().includes(q) ||
      e.registered_name.toLowerCase().includes(q) ||
      e.service_provider_TIN.includes(q) ||
      e.expense_type.toLowerCase().includes(q) ||
      e.payment_status.toLowerCase().includes(q)
    );
  }, [expenses, searchTerm, globalSearch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* EXPENSES SPREADSHEET TABLE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Expenses & Purchase Book Register ({filteredExpenses.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Purchase book and record of operating expenses, purchases of goods and services, supplier billings, and input VAT claims.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter voucher, provider, category..."
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
              <span>Record an Expense</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 font-mono">Voucher #</th>
                <th className="p-3 font-mono">Date</th>
                <th className="p-3">Provider Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right font-mono">Vatable Expense</th>
                <th className="p-3 text-right font-mono">Input VAT</th>
                <th className="p-3 text-right font-mono">Total Amount Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredExpenses.map((e) => {
                const isCancelled = e.is_cancelled || e.payment_status === 'Cancelled';
                return (
                  <tr key={e.id} className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-cyan-400'}`}>{e.invoice_number}</td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{e.issue_date}</td>
                    <td className={`p-3 font-semibold ${isCancelled ? 'line-through text-zinc-500' : theme.textTitle}`}>{e.registered_name}</td>
                    <td className={`p-3 ${isCancelled ? 'line-through text-zinc-500' : theme.textMuted}`}>{e.expense_type}</td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-emerald-400'}`}>
                      ₱{e.vatable_expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-cyan-400'}`}>
                      ₱{e.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-rose-400'}`}>
                      ₱{e.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Cancelled
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {e.payment_status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleToggleCancelExpense(e)} 
                          title={isCancelled ? "Restore / Uncancel Expense" : "Cancel Expense"}
                          className={`p-1 px-2 rounded border cursor-pointer ${isCancelled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                        >
                          {isCancelled ? <RotateCcw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        </button>
                        {!isCancelled && (
                          <button onClick={() => handleEditClick(e)} title="Edit Expense" className="p-1 px-2 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteExpense(e.id, e.invoice_number)} title="Delete Record" className="p-1 px-2 rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
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

      {/* RECORD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-5xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? `Edit Expense Voucher #${invoiceNumber}` : 'Record Expense Entry'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>Enter supplier voucher details, expense category, and automated input VAT formulas.</p>
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
            <form onSubmit={handleSaveExpense} className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
              {/* Col 1: Provider Details */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Provider Details</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Provider TIN *
                  </label>
                  <input 
                    type="text"
                    placeholder="000-000-000-00000"
                    value={expTin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Registered Provider Name *
                  </label>
                  <input 
                    type="text"
                    value={registeredName}
                    onChange={(e) => setRegisteredName(e.target.value)}
                    placeholder="e.g. Prime Realty Services"
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Provider Address
                  </label>
                  <input 
                    type="text"
                    value={providerAddress}
                    onChange={(e) => setProviderAddress(e.target.value)}
                    placeholder="Address..."
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Expense Account Category *
                  </label>
                  <input 
                    type="text"
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                    placeholder="Rent, Utilities, Office Supplies..."
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              {/* Col 2: Invoice & Pricing Breakdown */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Voucher Pricing & VAT</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date *</label>
                    <input 
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Invoice Type</label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    >
                      <option value="Sales Invoice" className="text-zinc-900 bg-white">Sales Invoice</option>
                      <option value="Service Invoice" className="text-zinc-900 bg-white">Service Invoice</option>
                      <option value="Official Receipt" className="text-zinc-900 bg-white">Official Receipt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Voucher # *</label>
                    <input 
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Qty</label>
                    <input 
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Unit Price (₱) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Zero-Rated (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={zeroRated}
                      onChange={(e) => setZeroRated(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">VAT-Exempt (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={vatExempt}
                      onChange={(e) => setVatExempt(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Less: Discount (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={lessDiscount}
                      onChange={(e) => setLessDiscount(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Less: EWT 2307/2306 (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={lessWithholdingTax}
                      onChange={(e) => setLessWithholdingTax(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>
              </div>

              {/* Col 3: Status & Live Formula Card */}
              <div className="lg:col-span-3 flex flex-col gap-3 h-full justify-between self-stretch">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Live Formula Audit</span>
                </div>

                <div className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${theme.borderInput} ${theme.bgInput}`}>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Total Expense (VAT Inclusive):</span>
                    <span className="font-bold">₱{formulaResults.total_expenses_vat_inclusive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Vatable Base (100%):</span>
                    <span className="font-bold text-emerald-400">₱{formulaResults.vatable_expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Input VAT (12%):</span>
                    <span className="font-bold text-cyan-400">₱{formulaResults.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Net Expense:</span>
                    <span>₱{formulaResults.amount_net_of_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-zinc-800/40 my-1"></div>
                  <div className="flex justify-between font-extrabold text-sm text-rose-400">
                    <span>TOTAL AMOUNT DUE:</span>
                    <span>₱{formulaResults.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Type / Status *</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setPaymentStatus(st);
                      if (st === 'Paid') setPaymentType('paid');
                      else setPaymentType('on credit');
                    }}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="Paid" className="text-zinc-900 bg-white">Fully Paid Expense Transaction</option>
                    <option value="Unpaid" className="text-zinc-900 bg-white">On Credit Expense Transaction (Unpaid A/P)</option>
                    <option value="Cancelled" className="text-zinc-900 bg-white">Cancelled Expense Transaction</option>
                  </select>
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
                  {editingId !== null ? 'Update Expense Record' : 'Post Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
