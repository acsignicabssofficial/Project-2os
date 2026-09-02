import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Coins, Pencil, Trash2, Ban, RotateCcw, Plus, Search, X } from 'lucide-react';
import { Collection, Sale, Customer, Company } from '../types';

interface CollectionsTabProps {
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  customers: Customer[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  setShowAddCustomerPrompt: (val: { tin: string, type: 'sales' | 'collections' } | null) => void;
  globalSearch: string;
}

export default function CollectionsTab({
  collections,
  setCollections,
  sales,
  setSales,
  customers,
  activeCompany,
  theme,
  triggerAlert,
  setShowAddCustomerPrompt,
  globalSearch
}: CollectionsTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const [collTin, setCollTin] = useState('');
  const [collInvNo, setCollInvNo] = useState('');
  const [collCustName, setCollCustName] = useState('');
  const [collDate, setCollDate] = useState(new Date().toISOString().split('T')[0]);
  const [collAmt, setCollAmt] = useState('');
  const [collWithheld, setCollWithheld] = useState('0');
  const [collInvoiceAmt, setCollInvoiceAmt] = useState<string>('');
  const [collEntryNo, setCollEntryNo] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-generate Collection Entry #
  useEffect(() => {
    if (!collEntryNo && editingId === null) {
      const nextNum = collections.length + 1;
      setCollEntryNo(`COLL-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`);
    }
  }, [collections, collEntryNo, editingId]);

  // Mask TIN
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setCollTin(formatted);
  };

  const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Invoice autofill
  useEffect(() => {
    if (collInvNo) {
      const normInput = normalizeDocNo(collInvNo);
      const foundSale = sales.find(s => normalizeDocNo(s.invoice_number) === normInput && (!activeCompanyName || s.company_name === activeCompanyName));
      if (foundSale) {
        setCollInvoiceAmt(foundSale.total_amount_due.toString());
        setCollTin(foundSale.client_TIN);
        setCollCustName(foundSale.registered_name);
        
        // Find previous collections on this invoice
        const prevColls = collections.filter(c => normalizeDocNo(c.invoice_number) === normalizeDocNo(foundSale.invoice_number));
        const totalPrevCollected = prevColls.reduce((sum, col) => sum + (Number(col.amount_collected) || 0), 0);
        const totalPrevWithheld = prevColls.reduce((sum, col) => sum + (Number(col.amount_withheld_2307) || 0), 0);

        const outstanding = Math.max(0, foundSale.total_amount_due - (foundSale.down_payment || 0) - totalPrevCollected - totalPrevWithheld);
        setCollAmt(outstanding.toString());

        triggerAlert(`Found Invoice ${foundSale.invoice_number}. Total Amount Due: ₱${foundSale.total_amount_due.toLocaleString()}`, 'info');
      }
    }
  }, [collInvNo, sales, collections, activeCompanyName, triggerAlert]);

  const selectedSale = useMemo(() => {
    if (!collInvNo) return null;
    const normInput = normalizeDocNo(collInvNo);
    return sales.find(s => normalizeDocNo(s.invoice_number) === normInput);
  }, [collInvNo, sales]);

  const invoiceAmt = selectedSale ? selectedSale.total_amount_due : (parseFloat(collInvoiceAmt) || 0);
  const thisCollected = parseFloat(collAmt) || 0;
  const thisWithheld = parseFloat(collWithheld) || 0;

  const handleEditClick = (item: Collection) => {
    setEditingId(item.id);
    setCollTin(item.client_TIN);
    setCollInvNo(item.invoice_number);
    setCollCustName(item.registered_name);
    setCollDate(item.collection_date);
    setCollAmt(item.amount_collected.toString());
    setCollWithheld(item.amount_withheld_2307.toString());
    setCollInvoiceAmt(item.invoice_amount.toString());
    setCollEntryNo(item.entry_number);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCollTin('');
    setCollInvNo('');
    setCollCustName('');
    setCollDate(new Date().toISOString().split('T')[0]);
    setCollAmt('');
    setCollWithheld('0');
    setCollInvoiceAmt('');
    setCollEntryNo('');
  };

  const handleDeleteCollection = (id: number, entryNo: string) => {
    if (window.confirm(`Are you sure you want to delete collection record ${entryNo || ''}?`)) {
      setCollections(prev => prev.filter(c => c.id !== id));
      triggerAlert(`Collection record deleted.`, "info");
    }
  };

  const handleToggleCancelCollection = (c: Collection) => {
    const isCurrentlyCancelled = c.is_cancelled;
    if (isCurrentlyCancelled) {
      if (window.confirm(`Uncancel and restore collection record #${c.entry_number}?`)) {
        setCollections(prev => prev.map(item => item.id === c.id ? { ...item, is_cancelled: false } : item));
        triggerAlert(`Restored collection record #${c.entry_number}`, 'success');
      }
    } else {
      const reason = window.prompt(`Are you sure you want to CANCEL collection record #${c.entry_number}? Optional reason:`, 'Collection Voided / Payment Bounced');
      if (reason !== null) {
        setCollections(prev => prev.map(item => {
          if (item.id === c.id) {
            return {
              ...item,
              is_cancelled: true,
              cancel_reason: reason || 'Cancelled by user',
              cancel_date: new Date().toISOString().split('T')[0]
            };
          }
          return item;
        }));
        // Update linked sale back to On Account if needed
        const linkedSale = sales.find(s => normalizeDocNo(s.invoice_number) === normalizeDocNo(c.invoice_number));
        if (linkedSale) {
          setSales(prev => prev.map(s => s.id === linkedSale.id ? { ...s, collection_status: 'On Account' } : s));
        }
        triggerAlert(`Collection #${c.entry_number} marked as CANCELLED.`, 'info');
      }
    }
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      return;
    }
    if (!collTin || !collInvNo || !collDate || !collAmt) {
      triggerAlert("Customer TIN, Invoice Number, Collection Date, and Amount are required fields!", "error");
      return;
    }

    const amtCol = parseFloat(collAmt) || 0;
    const w2307 = parseFloat(collWithheld) || 0;
    const remBalance = Math.max(0, invoiceAmt - amtCol - w2307);

    const newCollItem: Collection = {
      id: editingId !== null ? editingId : Date.now(),
      company_name: activeCompanyName,
      client_TIN: collTin,
      invoice_number: collInvNo,
      registered_name: collCustName || `Customer (${collInvNo})`,
      collection_date: collDate,
      amount_collected: amtCol,
      amount_withheld_2307: w2307,
      invoice_amount: invoiceAmt,
      balance: remBalance,
      entry_number: collEntryNo
    };

    if (editingId !== null) {
      setCollections(prev => prev.map(c => c.id === editingId ? newCollItem : c));
      triggerAlert(`Updated Collection Entry #${collEntryNo} successfully!`, 'success');
      handleCancelEdit();
      setIsModalOpen(false);
    } else {
      setCollections(prev => [newCollItem, ...prev]);

      // Update Sales collection status if fully paid
      if (selectedSale) {
        const newStatus = remBalance <= 0.01 ? 'Paid' : 'Partial';
        setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, collection_status: newStatus } : s));
      }

      triggerAlert(`Recorded Collection with Entry #${collEntryNo} successfully!`, 'success');
      setCollInvNo('');
      setCollAmt('');
      setCollWithheld('0');
      setCollInvoiceAmt('');
      setIsModalOpen(false);
    }
  };

  const filteredCollections = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return collections;
    return collections.filter(c => 
      c.entry_number.toLowerCase().includes(q) ||
      c.invoice_number.toLowerCase().includes(q) ||
      c.registered_name.toLowerCase().includes(q) ||
      c.client_TIN.includes(q)
    );
  }, [collections, searchTerm, globalSearch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* COLLECTIONS SPREADSHEET TABLE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Cash Receipts & Collections Register ({filteredCollections.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Spreadsheet list and record of customer payments received, cash & check collections, official receipts (OR), and matching against sales invoices.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter entry, invoice, customer..."
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
              <span>Record a Collection</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 font-mono">Entry #</th>
                <th className="p-3 font-mono">Invoice #</th>
                <th className="p-3 font-mono">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3 text-right font-mono">Amount Collected</th>
                <th className="p-3 text-right font-mono">Withheld 2307</th>
                <th className="p-3 text-right font-mono">Remaining Balance</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredCollections.map((c) => {
                const isCancelled = c.is_cancelled;
                return (
                  <tr key={c.id} className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-mono font-bold ${isCancelled ? 'line-through text-rose-400/70' : 'text-cyan-400'}`}>
                      {c.entry_number || `COLL-${c.id}`}
                    </td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{c.invoice_number}</td>
                    <td className={`p-3 font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-400'}`}>{c.collection_date}</td>
                    <td className={`p-3 font-semibold ${isCancelled ? 'line-through text-zinc-500' : theme.textTitle}`}>{c.registered_name}</td>
                    <td className={`p-3 text-right font-mono font-bold ${isCancelled ? 'line-through text-zinc-500' : 'text-emerald-400'}`}>
                      ₱{c.amount_collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-amber-400'}`}>
                      ₱{c.amount_withheld_2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono ${isCancelled ? 'line-through text-zinc-500' : 'text-zinc-400'}`}>
                      ₱{(c.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleToggleCancelCollection(c)} 
                          title={isCancelled ? "Restore Collection" : "Cancel Collection"}
                          className={`p-1 px-2 rounded border cursor-pointer ${isCancelled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                        >
                          {isCancelled ? <RotateCcw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        </button>
                        {!isCancelled && (
                          <button onClick={() => handleEditClick(c)} title="Edit Collection" className="p-1 px-2 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteCollection(c.id, c.entry_number)} title="Delete Record" className="p-1 px-2 rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
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

      {/* RECORD COLLECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-4xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? `Edit Collection #${collEntryNo}` : 'Record Payment Collection'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>Select unpaid sales invoice to autofill customer details, or enter collection manually.</p>
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
            <form onSubmit={handleSaveCollection} className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Invoice & Entry</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Collection Entry # *
                  </label>
                  <input 
                    type="text"
                    value={collEntryNo}
                    onChange={(e) => setCollEntryNo(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Select Existing Invoice
                  </label>
                  <select
                    value={collInvNo}
                    onChange={(e) => setCollInvNo(e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="" className="text-zinc-900 bg-white">-- Select Unpaid Invoice --</option>
                    {sales.filter(s => s.collection_status !== 'Paid' || s.invoice_number === collInvNo).map(s => (
                      <option key={s.id} value={s.invoice_number} className="text-zinc-900 bg-white">
                        {s.invoice_number} ({s.registered_name}) - ₱{s.total_amount_due.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer TIN *
                  </label>
                  <input 
                    type="text"
                    value={collTin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/25 pb-2 mb-1">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Payer Reference & Amounts</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <input 
                    type="text"
                    value={collCustName}
                    onChange={(e) => setCollCustName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Collection Date *</label>
                    <input 
                      type="date"
                      value={collDate}
                      onChange={(e) => setCollDate(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Cash Collected (₱) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={collAmt}
                      onChange={(e) => setCollAmt(e.target.value)}
                      required
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Form 2307 Withheld (₱)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={collWithheld}
                    onChange={(e) => setCollWithheld(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-3 h-full justify-between self-stretch">
                <div className="p-3.5 rounded-xl border font-mono text-xs space-y-1.5 bg-zinc-500/5 border-zinc-700/30">
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Total Amount Due:</span>
                    <span className="font-bold">₱{invoiceAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 text-[10px]">
                    <span>Cash Received:</span>
                    <span className="font-bold">₱{thisCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 text-[10px]">
                    <span>2307 Tax Withheld:</span>
                    <span>₱{thisWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-zinc-800/40 my-1"></div>
                  <div className="flex justify-between font-bold text-xs text-cyan-400">
                    <span>Remaining Balance:</span>
                    <span>₱{Math.max(0, invoiceAmt - thisCollected - thisWithheld).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                  {editingId !== null ? 'Update Collection Record' : 'Save Collection Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
