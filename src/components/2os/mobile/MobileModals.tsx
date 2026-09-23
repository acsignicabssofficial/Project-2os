import React, { useState } from 'react';
import { X, Check, Plus, AlertCircle, Upload, FileText } from 'lucide-react';
import { Customer, Contractor, Sale, Collection, Expense, Payment, SpecialEntry, AccountTitle } from '../../../types';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

// -------------------------------------------------------------
// 1. ADD SALE / INVOICE MODAL
// -------------------------------------------------------------
interface AddSaleModalProps extends ModalBaseProps {
  activeCompanyName?: string;
  customers: Customer[];
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  defaultPeriod?: string;
}

export function AddSaleModal({
  isOpen,
  onClose,
  triggerAlert,
  activeCompanyName,
  customers,
  setSales,
  setCustomers,
  defaultPeriod
}: AddSaleModalProps) {
  const [invNum, setInvNum] = useState(`SI-${Date.now().toString().slice(-6)}`);
  const [custName, setCustName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [particulars, setParticulars] = useState('Professional Services / Sale of Goods');
  const [grossAmount, setGrossAmount] = useState<number | string>(10000);
  const [taxType, setTaxType] = useState<'vatable' | 'exempt' | 'zero_rated'>('vatable');
  const [ewtRate, setEwtRate] = useState<number>(0.02); // 2% CWT 2307 default for services

  if (!isOpen) return null;

  const gross = Number(grossAmount) || 0;
  const netOfVat = taxType === 'vatable' ? Math.round((gross / 1.12) * 100) / 100 : gross;
  const outputVat = taxType === 'vatable' ? Math.round((gross - netOfVat) * 100) / 100 : 0;
  const cwtAmount = Math.round(netOfVat * ewtRate * 100) / 100;
  const netDue = Math.round((gross - cwtAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      triggerAlert('Please enter or select a customer name', 'error');
      return;
    }
    if (gross <= 0) {
      triggerAlert('Please enter a valid invoice amount', 'error');
      return;
    }

    const newSale: Sale = {
      id: Date.now(),
      invoice_number: invNum,
      customer_name: custName.trim(),
      registered_name: custName.trim(),
      company_name: activeCompanyName,
      invoice_date: date,
      issue_date: date,
      particulars,
      description: particulars,
      invoice_amount: gross,
      amount: gross,
      vatable_amount: taxType === 'vatable' ? netOfVat : 0,
      vatable_sales: taxType === 'vatable' ? netOfVat : 0,
      output_vat: outputVat,
      vat: outputVat,
      vat_exempt_amount: taxType === 'exempt' ? gross : 0,
      vat_exempt: taxType === 'exempt' ? gross : 0,
      zero_rated: taxType === 'zero_rated' ? gross : 0,
      ewt_amount: cwtAmount,
      withholding_2307: cwtAmount,
      total_amount_due: netDue,
      sales_status: 'Uncollected',
      nonvat_or_vat: taxType === 'vatable' ? 'VAT' : 'NON-VAT'
    };

    if (setSales) {
      setSales(prev => [newSale, ...prev]);
    }

    // Auto add customer if new
    if (setCustomers && !customers.some(c => (c.registered_name || c.trade_name || '').toLowerCase() === custName.trim().toLowerCase())) {
      setCustomers(prev => [{
        id: Date.now(),
        registered_name: custName.trim(),
        trade_name: custName.trim(),
        company_name: activeCompanyName,
        customer_tin: '000-000-000-000',
        tin_number: '000-000-000-000',
        type: 'Customer'
      }, ...prev]);
    }

    triggerAlert(`Sales Invoice ${invNum} created successfully!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">New Sales Invoice</h3>
            <p className="text-[10px] text-slate-500">Live 12% Output VAT & 2307 CWT Calculation</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Invoice Number</label>
            <input 
              type="text" 
              value={invNum} 
              onChange={e => setInvNum(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-blue-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer / Client Name</label>
            <input 
              type="text" 
              value={custName} 
              onChange={e => setCustName(e.target.value)}
              placeholder="e.g. Acme Philippines Corp"
              list="customer-suggestions"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
            <datalist id="customer-suggestions">
              {customers.map((c, i) => (
                <option key={i} value={c.registered_name || c.trade_name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Gross Amount (₱)</label>
              <input 
                type="number" 
                step="any" 
                value={grossAmount} 
                onChange={e => setGrossAmount(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tax Classification</label>
              <select 
                value={taxType} 
                onChange={e => setTaxType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
              >
                <option value="vatable">VATable (12%)</option>
                <option value="exempt">VAT-Exempt</option>
                <option value="zero_rated">Zero-Rated (0%)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Creditable CWT (2307)</label>
              <select 
                value={ewtRate} 
                onChange={e => setEwtRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
              >
                <option value={0}>None (0%)</option>
                <option value={0.01}>1% (Goods)</option>
                <option value={0.02}>2% (Services)</option>
                <option value={0.05}>5% (Rentals)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Particulars / Description</label>
            <input 
              type="text" 
              value={particulars} 
              onChange={e => setParticulars(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Real-time Breakdown */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Net of VAT:</span>
              <span className="font-semibold text-slate-800">₱{netOfVat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>12% Output VAT:</span>
              <span className="font-semibold text-blue-700">₱{outputVat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Less: 2307 CWT ({ewtRate * 100}%):</span>
              <span className="font-semibold text-rose-600">-₱{cwtAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-blue-200 pt-1 flex justify-between font-bold text-slate-900 text-xs">
              <span>Net Receivable:</span>
              <span className="text-emerald-700">₱{netDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 rounded-xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-500 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. ADD EXPENSE / PURCHASE MODAL
// -------------------------------------------------------------
interface AddExpenseModalProps extends ModalBaseProps {
  activeCompanyName?: string;
  contractors: Contractor[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  setContractors?: React.Dispatch<React.SetStateAction<Contractor[]>>;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  triggerAlert,
  activeCompanyName,
  contractors,
  setExpenses,
  setContractors
}: AddExpenseModalProps) {
  const [invNum, setInvNum] = useState(`PI-${Date.now().toString().slice(-6)}`);
  const [suppName, setSuppName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Operating Expenses / Utilities');
  const [grossAmount, setGrossAmount] = useState<number | string>(5000);
  const [taxType, setTaxType] = useState<'vatable' | 'nonvat'>('vatable');
  const [ewtRate, setEwtRate] = useState<number>(0.02);

  if (!isOpen) return null;

  const gross = Number(grossAmount) || 0;
  const netOfVat = taxType === 'vatable' ? Math.round((gross / 1.12) * 100) / 100 : gross;
  const inputVat = taxType === 'vatable' ? Math.round((gross - netOfVat) * 100) / 100 : 0;
  const ewtAmount = Math.round(netOfVat * ewtRate * 100) / 100;
  const netPayable = Math.round((gross - ewtAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim()) {
      triggerAlert('Please enter or select a supplier name', 'error');
      return;
    }
    if (gross <= 0) {
      triggerAlert('Please enter a valid expense amount', 'error');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      invoice_number: invNum,
      voucher_number: invNum,
      service_provider_name: suppName.trim(),
      registered_name: suppName.trim(),
      company_name: activeCompanyName,
      expense_date: date,
      issue_date: date,
      expense_type: category,
      description: category,
      expense_invoice_amount: gross,
      amount: gross,
      vatable_expense_amount: taxType === 'vatable' ? netOfVat : 0,
      vat_input_amount: inputVat,
      input_vat: inputVat,
      nonvat_expense_amount: taxType === 'nonvat' ? gross : 0,
      ewt_amount: ewtAmount,
      total_amount_due: netPayable,
      expense_status: 'Unpaid',
      nonvat_or_vat: taxType === 'vatable' ? 'VAT' : 'NON-VAT'
    };

    if (setExpenses) {
      setExpenses(prev => [newExpense, ...prev]);
    }

    // Auto add contractor
    if (setContractors && !contractors.some(c => (c.registered_name || c.trade_name || '').toLowerCase() === suppName.trim().toLowerCase())) {
      setContractors(prev => [{
        id: Date.now(),
        registered_name: suppName.trim(),
        trade_name: suppName.trim(),
        company_name: activeCompanyName,
        service_provider_TIN: '000-000-000-000',
        tin_number: '000-000-000-000',
        type: 'Supplier'
      }, ...prev]);
    }

    triggerAlert(`Purchase Invoice ${invNum} recorded successfully!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">New Purchase / Expense</h3>
            <p className="text-[10px] text-slate-500">Live 12% Input VAT & EWT Deduction</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Invoice / Voucher #</label>
            <input 
              type="text" 
              value={invNum} 
              onChange={e => setInvNum(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier / Vendor Name</label>
            <input 
              type="text" 
              value={suppName} 
              onChange={e => setSuppName(e.target.value)}
              placeholder="e.g. Meralco / PLDT / Office Supplies"
              list="supplier-suggestions"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
              required
            />
            <datalist id="supplier-suggestions">
              {contractors.map((c, i) => (
                <option key={i} value={c.registered_name || c.trade_name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Gross Amount (₱)</label>
              <input 
                type="number" 
                step="any" 
                value={grossAmount} 
                onChange={e => setGrossAmount(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tax Status</label>
              <select 
                value={taxType} 
                onChange={e => setTaxType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
              >
                <option value="vatable">VATable (12% Input)</option>
                <option value="nonvat">Non-VAT / Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Expanded W/Tax (EWT)</label>
              <select 
                value={ewtRate} 
                onChange={e => setEwtRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
              >
                <option value={0}>None (0%)</option>
                <option value={0.01}>1% (Goods / Suppliers)</option>
                <option value={0.02}>2% (Services / Contractors)</option>
                <option value={0.05}>5% (Rent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category / Account</label>
            <input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Real-time Calculation */}
          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Net Purchases:</span>
              <span className="font-semibold text-slate-800">₱{netOfVat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Input VAT (Creditable):</span>
              <span className="font-semibold text-emerald-700">+₱{inputVat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Less: EWT Withheld ({ewtRate * 100}%):</span>
              <span className="font-semibold text-rose-600">-₱{ewtAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-rose-200 pt-1 flex justify-between font-bold text-slate-900 text-xs">
              <span>Net Payable / Cash Outflow:</span>
              <span className="text-rose-700">₱{netPayable.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 rounded-xl bg-rose-600 font-bold text-white shadow-md hover:bg-rose-500 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. ADD COLLECTION (CASH RECEIPT / OR) MODAL
// -------------------------------------------------------------
interface AddCollectionModalProps extends ModalBaseProps {
  activeCompanyName?: string;
  customers: Customer[];
  sales: Sale[];
  setCollections?: React.Dispatch<React.SetStateAction<Collection[]>>;
}

export function AddCollectionModal({
  isOpen,
  onClose,
  triggerAlert,
  activeCompanyName,
  customers,
  sales,
  setCollections
}: AddCollectionModalProps) {
  const [orNum, setOrNum] = useState(`OR-${Date.now().toString().slice(-5)}`);
  const [custName, setCustName] = useState('');
  const [invRef, setInvRef] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | string>(5000);
  const [payMode, setPayMode] = useState('Bank Transfer');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const collAmount = Number(amount) || 0;
    if (collAmount <= 0) {
      triggerAlert('Please enter a valid collection amount', 'error');
      return;
    }

    const newCollection: Collection = {
      id: Date.now(),
      receipt_number: orNum,
      entry_number: orNum,
      company_name: activeCompanyName,
      customer_name: custName || 'Valued Customer',
      registered_name: custName || 'Valued Customer',
      invoice_number: invRef || 'N/A',
      collection_date: date,
      amount_collected: collAmount,
      total_collected: collAmount,
      bank_name: payMode
    };

    if (setCollections) {
      setCollections(prev => [newCollection, ...prev]);
    }

    triggerAlert(`Official Receipt ${orNum} saved for ₱${collAmount.toLocaleString()}!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Record Cash Receipt / OR</h3>
            <p className="text-[10px] text-slate-500">Post collection to Cash Receipts Book</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Receipt / OR Number</label>
            <input 
              type="text" 
              value={orNum} 
              onChange={e => setOrNum(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer</label>
            <input 
              type="text" 
              value={custName} 
              onChange={e => setCustName(e.target.value)} 
              placeholder="Select or enter customer"
              list="cust-list"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
            <datalist id="cust-list">
              {customers.map((c, i) => (
                <option key={i} value={c.registered_name || c.trade_name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Collected (₱)</label>
              <input 
                type="number" 
                step="any" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-emerald-700 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Mode</label>
              <select 
                value={payMode} 
                onChange={e => setPayMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="GCash / Maya">GCash / Maya</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Invoice Ref #</label>
              <input 
                type="text" 
                value={invRef} 
                onChange={e => setInvRef(e.target.value)} 
                placeholder="SI-0001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 rounded-xl bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-500 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. ADD PAYMENT (DISBURSEMENT / VOUCHER) MODAL
// -------------------------------------------------------------
interface AddPaymentModalProps extends ModalBaseProps {
  activeCompanyName?: string;
  contractors: Contractor[];
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  triggerAlert,
  activeCompanyName,
  contractors,
  setPayments
}: AddPaymentModalProps) {
  const [voucherNum, setVoucherNum] = useState(`DV-${Date.now().toString().slice(-5)}`);
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | string>(3500);
  const [payMode, setPayMode] = useState('Check');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paid = Number(amount) || 0;
    if (paid <= 0) {
      triggerAlert('Please enter a valid disbursement amount', 'error');
      return;
    }

    const newPayment: Payment = {
      id: Date.now(),
      voucher_number: voucherNum,
      entry_number: voucherNum,
      company_name: activeCompanyName,
      payee_name: payee || 'Service Provider',
      service_provider_name: payee || 'Service Provider',
      payment_date: date,
      amount_paid: paid,
      net_paid: paid,
      bank_name: payMode
    };

    if (setPayments) {
      setPayments(prev => [newPayment, ...prev]);
    }

    triggerAlert(`Disbursement Voucher ${voucherNum} recorded!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Record Cash Disbursement</h3>
            <p className="text-[10px] text-slate-500">Post payment to Cash Disbursements Book</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Disbursement Voucher #</label>
            <input 
              type="text" 
              value={voucherNum} 
              onChange={e => setVoucherNum(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Payee / Supplier</label>
            <input 
              type="text" 
              value={payee} 
              onChange={e => setPayee(e.target.value)} 
              placeholder="Select or enter payee"
              list="supp-list"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              required
            />
            <datalist id="supp-list">
              {contractors.map((c, i) => (
                <option key={i} value={c.registered_name || c.trade_name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Paid (₱)</label>
              <input 
                type="number" 
                step="any" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-rose-700 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
            <select 
              value={payMode} 
              onChange={e => setPayMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="Check">Check / Corporate Check</option>
              <option value="Bank Transfer">Bank Transfer (Online)</option>
              <option value="Petty Cash">Petty Cash</option>
              <option value="Direct Cash">Cash on Hand</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 rounded-xl bg-rose-600 font-bold text-white shadow-md hover:bg-rose-500 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Disbursement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. ADD CONTACT / DIRECTORY MODAL
// -------------------------------------------------------------
interface AddPartyModalProps extends ModalBaseProps {
  activeCompanyName?: string;
  defaultType?: 'Customer' | 'Supplier';
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  setContractors?: React.Dispatch<React.SetStateAction<Contractor[]>>;
}

export function AddPartyModal({
  isOpen,
  onClose,
  triggerAlert,
  activeCompanyName,
  defaultType = 'Customer',
  setCustomers,
  setContractors
}: AddPartyModalProps) {
  const [type, setType] = useState<'Customer' | 'Supplier'>(defaultType);
  const [tradeName, setTradeName] = useState('');
  const [regName, setRegName] = useState('');
  const [tin, setTin] = useState('000-000-000-000');
  const [address, setAddress] = useState('Metro Manila, Philippines');
  const [rdo, setRdo] = useState('044');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() && !tradeName.trim()) {
      triggerAlert('Please provide at least a Registered or Trade Name', 'error');
      return;
    }

    const name = regName.trim() || tradeName.trim();
    const newParty: any = {
      id: Date.now(),
      registered_name: name,
      trade_name: tradeName.trim() || name,
      company_name: activeCompanyName,
      tin_number: tin,
      customer_tin: tin,
      service_provider_TIN: tin,
      address,
      customer_address: address,
      sp_address: address,
      rdo_code: rdo,
      type
    };

    if (type === 'Customer' && setCustomers) {
      setCustomers(prev => [newParty, ...prev]);
      triggerAlert(`Customer ${name} registered in Directory!`, 'success');
    } else if (type === 'Supplier' && setContractors) {
      setContractors(prev => [newParty, ...prev]);
      triggerAlert(`Supplier ${name} registered in Directory!`, 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Add Directory Contact</h3>
            <p className="text-[10px] text-slate-500">Register new Customer or Supplier</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Customer')}
                className={`py-1.5 rounded-xl font-bold text-xs border ${
                  type === 'Customer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Customer / Client
              </button>
              <button
                type="button"
                onClick={() => setType('Supplier')}
                className={`py-1.5 rounded-xl font-bold text-xs border ${
                  type === 'Supplier' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Supplier / Vendor
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Registered Legal Name</label>
            <input 
              type="text" 
              value={regName} 
              onChange={e => setRegName(e.target.value)} 
              placeholder="e.g. Acme Philippines Enterprises Inc."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Trade / Doing Business As Name</label>
            <input 
              type="text" 
              value={tradeName} 
              onChange={e => setTradeName(e.target.value)} 
              placeholder="e.g. Acme Tech"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">BIR TIN (9-12 digits)</label>
              <input 
                type="text" 
                value={tin} 
                onChange={e => setTin(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">RDO Code</label>
              <input 
                type="text" 
                value={rdo} 
                onChange={e => setRdo(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Registered Address</label>
            <input 
              type="text" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 rounded-xl bg-slate-900 font-bold text-white shadow-md hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. IMPORT DATA MODAL (JSON / CSV)
// -------------------------------------------------------------
interface ImportDataModalProps extends ModalBaseProps {
  onImportData: (data: { sales?: Sale[]; expenses?: Expense[]; customers?: Customer[] }) => void;
}

export function ImportDataModal({
  isOpen,
  onClose,
  triggerAlert,
  onImportData
}: ImportDataModalProps) {
  const [jsonText, setJsonText] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onImportData(parsed);
      triggerAlert('Data imported successfully!', 'success');
      onClose();
    } catch (e) {
      triggerAlert('Invalid JSON format. Please paste valid 2OS records.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Import Mobile Data</h3>
            <p className="text-[10px] text-slate-500">Paste JSON records or accounting sync data</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Paste JSON array containing sales, expenses, or customer records to merge into your active accounting workbook.
          </p>

          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            rows={7}
            placeholder='{"sales": [{"invoice_number": "SI-101", "invoice_amount": 15000, "customer_name": "ABC Corp"}]}'
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[10px] text-slate-900 focus:outline-none focus:border-blue-500"
          />

          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleImport}
              className="flex-1 py-2 rounded-xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-500 flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Import Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
