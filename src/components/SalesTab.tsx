import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Pencil, Trash2, Ban, RotateCcw, Plus, Search, X, Calculator } from 'lucide-react';
import { Sale, Customer, Company, Collection } from '../types';
import { computeSaleFormulas } from '../utils/accounting';

interface SalesTabProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  customers: Customer[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  setShowAddCustomerPrompt: (val: { tin: string, type: 'sales' | 'collections' } | null) => void;
  globalSearch: string;
}

export default function SalesTab({
  sales,
  setSales,
  setCollections,
  customers,
  activeCompany,
  theme,
  triggerAlert,
  setShowAddCustomerPrompt,
  globalSearch
}: SalesTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  // Form fields matching schema
  const [saleTin, setSaleTin] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [invoiceType, setInvoiceType] = useState<'Sales Invoice' | 'Service Invoice' | 'Official Receipt'>('Sales Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('SI-001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState<'paid' | 'on credit' | 'partial'>('paid');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('10000');
  const [zeroRated, setZeroRated] = useState('0');
  const [vatExempt, setVatExempt] = useState('0');
  const [lessDiscount, setLessDiscount] = useState('0');
  const [lessWithholdingTax, setLessWithholdingTax] = useState('0');
  const [collectionStatus, setCollectionStatus] = useState<'Paid' | 'Partial' | 'On Account'>('Paid');
  const [downPayment, setDownPayment] = useState('0');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute live formula values
  const formulaResults = useMemo(() => {
    return computeSaleFormulas({
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
    setSaleTin(formatted);
  };

  const lastPromptedTinRef = useRef<string>('');

  // TIN autofill from customer_details
  useEffect(() => {
    const cleanTin = saleTin.replace(/-/g, '');
    if (cleanTin.length >= 9) {
      const found = customers.find(c => c.client_TIN === saleTin && activeCompanyName && c.company_name === activeCompanyName);
      if (found) {
        if (registeredName !== found.registered_name || clientAddress !== found.client_Address) {
          setRegisteredName(found.registered_name);
          setClientAddress(found.client_Address);
          triggerAlert(`Autofilled Customer: ${found.registered_name}`, 'info');
        }
      } else {
        if (registeredName !== '' || clientAddress !== '') {
          setRegisteredName('');
          setClientAddress('');
        }
        if (lastPromptedTinRef.current !== saleTin) {
          lastPromptedTinRef.current = saleTin;
          setShowAddCustomerPrompt({ tin: saleTin, type: 'sales' });
        }
      }
    } else {
      lastPromptedTinRef.current = '';
    }
  }, [saleTin, customers, activeCompanyName, registeredName, clientAddress, triggerAlert, setShowAddCustomerPrompt]);

  const handleEditClick = (item: Sale) => {
    setEditingId(item.id);
    setSaleTin(item.client_TIN);
    setRegisteredName(item.registered_name);
    setClientAddress(item.client_Address || '');
    setInvoiceType(item.invoice_type as any);
    setInvoiceNumber(item.invoice_number);
    setIssueDate(item.issue_date);
    setDescription(item.description || '');
    setPaymentType(item.payment_type as any);
    setQty((item.qty || 1).toString());
    setUnitPrice((item.unit_price || item.amount).toString());
    setZeroRated((item.zero_rated || 0).toString());
    setVatExempt((item.vat_exempt || 0).toString());
    setLessDiscount((item.less_discount || 0).toString());
    setLessWithholdingTax((item.less_withholding_tax || 0).toString());
    setCollectionStatus(item.collection_status);
    setDownPayment((item.down_payment || 0).toString());
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSaleTin('');
    setRegisteredName('');
    setClientAddress('');
    setInvoiceType('Sales Invoice');
    setInvoiceNumber(`SI-${Date.now().toString().slice(-4)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setPaymentType('paid');
    setQty('1');
    setUnitPrice('10000');
    setZeroRated('0');
    setVatExempt('0');
    setLessDiscount('0');
    setLessWithholdingTax('0');
    setCollectionStatus('Paid');
    setDownPayment('0');
  };

  const handleDeleteSale = (id: number, invNo: string) => {
    if (window.confirm(`Are you sure you want to delete sales invoice #${invNo}?`)) {
      setSales(prev => prev.filter(s => s.id !== id));
      triggerAlert(`Sales invoice #${invNo} deleted.`, "info");
    }
  };

  const handleToggleCancelSale = (s: Sale) => {
    const isCurrentlyCancelled = s.is_cancelled || s.collection_status === 'Cancelled';
    if (isCurrentlyCancelled) {
      if (window.confirm(`Uncancel and restore Sales Invoice #${s.invoice_number}?`)) {
        setSales(prev => prev.map(item => {
          if (item.id === s.id) {
            return {
              ...item,
              is_cancelled: false,
              collection_status: 'On Account'
            };
          }
          return item;
        }));
        triggerAlert(`Restored Sales Invoice #${s.invoice_number}`, 'success');
      }
    } else {
      const reason = window.prompt(`Are you sure you want to CANCEL Sales Invoice #${s.invoice_number}? Optional reason:`, 'Sale Voided / Order Cancelled');
      if (reason !== null) {
        setSales(prev => prev.map(item => {
          if (item.id === s.id) {
            return {
              ...item,
              is_cancelled: true,
              collection_status: 'Cancelled',
              cancel_reason: reason || 'Cancelled by user',
              cancel_date: new Date().toISOString().split('T')[0]
            };
          }
          return item;
        }));
        triggerAlert(`Sales Invoice #${s.invoice_number} marked as CANCELLED.`, 'info');
      }
    }
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      return;
    }
    if (!saleTin || !issueDate || !invoiceNumber || formulaResults.amount <= 0) {
      triggerAlert("Customer TIN, Issue Date, Invoice Number, and Valid Amount are required!", "error");
      return;
    }

    const newSaleItem: Sale = {
      id: editingId !== null ? editingId : Date.now(),
      company_name: activeCompanyName,
      registered_name: registeredName || `Customer (${invoiceNumber})`,
      client_TIN: saleTin,
      client_Address: clientAddress,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      description: description || 'Sales / Service Item',
      payment_type: paymentType,
      qty: parseFloat(qty) || 1,
      unit_price: parseFloat(unitPrice) || formulaResults.amount,
      amount: formulaResults.amount,
      vatable_sales: formulaResults.vatable_sales,
      vat: formulaResults.vat,
      zero_rated: formulaResults.zero_rated,
      vat_exempt: formulaResults.vat_exempt,
      total_sale_vat_inclusive: formulaResults.total_sale_vat_inclusive,
      less_vat: formulaResults.less_vat,
      amount_net_of_vat: formulaResults.amount_net_of_vat,
      less_discount: formulaResults.less_discount,
      add_vat: formulaResults.add_vat,
      less_withholding_tax: formulaResults.less_withholding_tax,
      total_amount_due: formulaResults.total_amount_due,
      collection_status: collectionStatus,
      down_payment: paymentType === 'partial' ? (parseFloat(downPayment) || 0) : 0
    };

    if (editingId !== null) {
      setSales(prev => prev.map(s => s.id === editingId ? newSaleItem : s));
      triggerAlert(`Updated Sales Invoice #${invoiceNumber} successfully!`, "success");
      handleCancelEdit();
      setIsModalOpen(false);
    } else {
      if (sales.some(s => s.invoice_number.toLowerCase().trim() === invoiceNumber.toLowerCase().trim() && s.company_name === activeCompanyName)) {
        triggerAlert(`Invoice number "${invoiceNumber}" is already in use for this company.`, "error");
        return;
      }
      setSales(prev => [newSaleItem, ...prev]);
      triggerAlert(`Recorded Sales Invoice #${invoiceNumber} successfully!`, "success");
      
      // Reset form
      setInvoiceNumber(`SI-${Date.now().toString().slice(-4)}`);
      setDescription('');
      setQty('1');
      setUnitPrice('10000');
      setIsModalOpen(false);
    }
  };

  // Filter and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSales = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return sales;
    return sales.filter(s =>
      s.invoice_number.toLowerCase().includes(q) ||
      s.registered_name.toLowerCase().includes(q) ||
      s.client_TIN.includes(q) ||
      s.collection_status.toLowerCase().includes(q)
    );
  }, [sales, searchTerm, globalSearch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* SALES TABLE / SPREADSHEET VIEW */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Sales Transactions Register ({filteredSales.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Spreadsheet list of customer cash sales, on account sales, returns and cancellation of sales.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter invoice, customer, TIN..."
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
              <span>Record a Sale</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 font-mono">Invoice #</th>
                <th className="p-3 font-mono">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3 font-mono">TIN</th>
                <th className="p-3 text-right font-mono">Vatable Sales</th>
                <th className="p-3 text-right font-mono">VAT (12%)</th>
                <th className="p-3 text-right font-mono">Total Amount Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredSales.map((s) => {
                const isCancelled = s.is_cancelled || s.collection_status === 'Cancelled';
                return (
                  <tr key={s.id} className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-cyan-400'}`}>
                      {s.invoice_number}
                    </td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{s.issue_date}</td>
                    <td className={`p-3 font-semibold ${isCancelled ? 'line-through text-zinc-500' : theme.textTitle}`}>{s.registered_name}</td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-400'}`}>{s.client_TIN}</td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-emerald-400'}`}>
                      ₱{s.vatable_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-cyan-400'}`}>
                      ₱{s.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-amber-400'}`}>
                      ₱{s.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Cancelled
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.collection_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          s.collection_status === 'Partial' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {s.collection_status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleToggleCancelSale(s)} 
                          title={isCancelled ? "Restore / Uncancel Sale" : "Cancel Sale"}
                          className={`p-1 px-2 rounded border cursor-pointer ${isCancelled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                        >
                          {isCancelled ? <RotateCcw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        </button>
                        {!isCancelled && (
                          <button onClick={() => handleEditClick(s)} title="Edit Sale" className="p-1 px-2 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteSale(s.id, s.invoice_number)} title="Delete Record" className="p-1 px-2 rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
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

      {/* RECORD SALE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-5xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? `Edit Sales Invoice #${invoiceNumber}` : 'Record Sales Transaction'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>Enter customer invoice details, pricing, and automated BIR valuation formulas.</p>
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
            <form onSubmit={handleSaveSale} className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
              {/* Col 1: Customer Details */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Customer Details</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer TIN (14 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="000-000-000-00000"
                    value={saleTin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent focus:outline-none ${theme.accentFocus} font-mono placeholder-zinc-500 ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Registered Customer Name *
                  </label>
                  <input 
                    type="text"
                    value={registeredName}
                    onChange={(e) => setRegisteredName(e.target.value)}
                    placeholder="e.g. Apex Trading Corp."
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent focus:outline-none ${theme.accentFocus} ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer Address
                  </label>
                  <input 
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="123 Business Ave, Makati City"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent focus:outline-none ${theme.accentFocus} ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Description / Particulars
                  </label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Itemized goods or services rendered..."
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent focus:outline-none ${theme.accentFocus} ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              {/* Col 2: Invoice & Pricing Breakdown */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pricing & BIR Formulas</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Issue Date *</label>
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
                      onChange={(e) => setInvoiceType(e.target.value as any)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    >
                      <option value="Sales Invoice" className="text-zinc-900 bg-white">Sales Invoice</option>
                      <option value="Service Invoice" className="text-zinc-900 bg-white">Service Invoice</option>
                      <option value="Official Receipt" className="text-zinc-900 bg-white">Official Receipt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Invoice # *</label>
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
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Zero-Rated Sales (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={zeroRated}
                      onChange={(e) => setZeroRated(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">VAT-Exempt Sales (₱)</label>
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
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Less: Withholding Tax 2307 (₱)</label>
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

              {/* Col 3: Status & Live Calculation Card */}
              <div className="lg:col-span-3 flex flex-col gap-3 h-full justify-between self-stretch">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Live Formula Audit</span>
                </div>

                <div className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${theme.borderInput} ${theme.bgInput}`}>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Total Sales (VAT Inclusive):</span>
                    <span className="font-bold">₱{formulaResults.total_sale_vat_inclusive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Vatable Sales (Base 100%):</span>
                    <span className="font-bold text-emerald-400">₱{formulaResults.vatable_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>VAT (12%):</span>
                    <span className="font-bold text-cyan-400">₱{formulaResults.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Amount Net of VAT:</span>
                    <span>₱{formulaResults.amount_net_of_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-zinc-800/40 my-1"></div>
                  <div className="flex justify-between font-extrabold text-sm text-amber-400">
                    <span>TOTAL AMOUNT DUE:</span>
                    <span>₱{formulaResults.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Type / Status *</label>
                  <select
                    value={collectionStatus}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setCollectionStatus(st);
                      if (st === 'Paid') setPaymentType('paid');
                      else if (st === 'Partial') setPaymentType('partial');
                      else if (st === 'Cancelled') setPaymentType('on credit');
                      else setPaymentType('on credit');
                    }}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="Paid" className="text-zinc-900 bg-white">Fully Paid Sales Transaction</option>
                    <option value="Partial" className="text-zinc-900 bg-white">Partially Paid Sales Transaction</option>
                    <option value="On Account" className="text-zinc-900 bg-white">On Credit Sales Transaction (Unpaid A/R)</option>
                    <option value="Cancelled" className="text-zinc-900 bg-white">Cancelled Sales Transaction</option>
                  </select>
                </div>

                {collectionStatus === 'Partial' && (
                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Down Payment / Deposit (₱)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono text-amber-400 font-bold ${theme.borderInput}`}
                    />
                  </div>
                )}
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
                  {editingId !== null ? 'Update Sales Record' : 'Post Sales Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
