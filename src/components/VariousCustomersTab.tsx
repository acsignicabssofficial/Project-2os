import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  ArrowRightLeft, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  X, 
  FileText, 
  DollarSign, 
  Calendar,
  Building,
  Tag
} from 'lucide-react';
import { UniformBookRecord, Customer, Company } from '../types';

interface VariousCustomersTabProps {
  subsidiarySales: UniformBookRecord[];
  setSubsidiarySales: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  collections: UniformBookRecord[];
  setCollections: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

export default function VariousCustomersTab({
  subsidiarySales,
  setSubsidiarySales,
  collections,
  setCollections,
  customers,
  setCustomers,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch = ''
}: VariousCustomersTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Partial' | 'On Account'>('ALL');

  // Edit Transaction Modal
  const [editingRecord, setEditingRecord] = useState<UniformBookRecord | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editParticulars, setEditParticulars] = useState('');
  const [editDate, setEditDate] = useState('');

  // Reroute Modal
  const [reroutingRecord, setReroutingRecord] = useState<UniformBookRecord | null>(null);
  const [rerouteMode, setRerouteMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // New customer fields for reroute
  const [newCustName, setNewCustName] = useState('');
  const [newCustTin, setNewCustTin] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTaxType, setNewCustTaxType] = useState<'VAT' | 'Non-VAT'>('VAT');

  // Mask TIN helper
  const handleNewTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setNewCustTin(formatted);
  };

  // Identify Various Customer Transactions
  const variousTransactions = useMemo(() => {
    return subsidiarySales.filter(s => {
      if (s.is_cancelled) return false;
      if (activeCompanyName && s.company_name && s.company_name !== activeCompanyName) return false;

      const rawTinDigits = (s.tin || '').replace(/\D/g, '');
      const isDummyTin = !rawTinDigits || rawTinDigits.length < 9 || /^0+$/.test(rawTinDigits);
      const isVariousName = (s.registered_name || '').toLowerCase().includes('various');
      const isExplicitVarious = (s as any).is_various === true;

      // Check if this TIN exists in registered customer list
      const matchesRegisteredCustomer = !isDummyTin && customers.some(c => {
        const cDigits = (c.client_TIN || c.customer_tin || '').replace(/\D/g, '');
        return cDigits.length >= 9 && cDigits.startsWith(rawTinDigits.slice(0, 9));
      });

      return isDummyTin || isVariousName || isExplicitVarious || !matchesRegisteredCustomer;
    });
  }, [subsidiarySales, activeCompanyName, customers]);

  const filteredTransactions = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    return variousTransactions.filter(s => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.invoice_number.toLowerCase().includes(q) ||
        s.registered_name.toLowerCase().includes(q) ||
        (s.particulars || '').toLowerCase().includes(q) ||
        s.date.includes(q) ||
        (s.tin || '').includes(q)
      );
    });
  }, [variousTransactions, searchTerm, globalSearch, statusFilter]);

  const totalVariousRevenue = useMemo(() => {
    return variousTransactions.reduce((sum, s) => sum + (Number(s.total_amount_due || s.amount) || 0), 0);
  }, [variousTransactions]);

  const totalPendingReceivable = useMemo(() => {
    return variousTransactions
      .filter(s => s.status === 'On Account' || s.status === 'Partial')
      .reduce((sum, s) => sum + (Number(s.pending_balance || s.total_amount_due) || 0), 0);
  }, [variousTransactions]);

  // Handle Edit Transaction Info
  const handleOpenEdit = (rec: UniformBookRecord) => {
    setEditingRecord(rec);
    setEditCustName(rec.registered_name || 'Various Customers');
    setEditParticulars(rec.particulars || '');
    setEditDate(rec.date);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setSubsidiarySales(prev => prev.map(s => {
      if (s.id === editingRecord.id || s.invoice_number === editingRecord.invoice_number) {
        return {
          ...s,
          registered_name: editCustName.trim() || 'Various Customers',
          particulars: editParticulars.trim(),
          date: editDate
        };
      }
      return s;
    }));

    setCollections(prev => prev.map(c => {
      if (c.invoice_number && c.invoice_number.trim().toLowerCase() === editingRecord.invoice_number.trim().toLowerCase()) {
        return {
          ...c,
          registered_name: editCustName.trim() || 'Various Customers',
          date: editDate
        };
      }
      return c;
    }));

    triggerAlert(`Transaction ${editingRecord.invoice_number} information updated successfully.`, 'success');
    setEditingRecord(null);
  };

  // Handle Reroute
  const handleOpenReroute = (rec: UniformBookRecord) => {
    setReroutingRecord(rec);
    setRerouteMode('existing');
    setSelectedCustomerId(customers[0]?.registered_name || '');
    setNewCustName(rec.registered_name && !rec.registered_name.toLowerCase().includes('various') ? rec.registered_name : '');
    setNewCustTin('');
    setNewCustAddress(rec.address || '');
    setNewCustTaxType(rec.vat_or_nonvat === 'NONVAT' ? 'Non-VAT' : 'VAT');
  };

  const handleExecuteReroute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reroutingRecord) return;

    let targetCustName = '';
    let targetTin = '';
    let targetAddress = '';

    if (rerouteMode === 'existing') {
      const selected = customers.find(c => 
        (c.registered_name || c.customer_name || c.trade_name) === selectedCustomerId ||
        String(c.id) === selectedCustomerId
      );
      if (!selected) {
        triggerAlert('Please select an existing registered customer.', 'error');
        return;
      }
      targetCustName = (selected.registered_name || selected.customer_name || selected.trade_name || '').trim();
      targetTin = selected.client_TIN || selected.customer_tin || '000-000-000-00000';
      targetAddress = selected.address || selected.client_Address || selected.customer_address || '';
    } else {
      // New Customer Mode
      if (!newCustName.trim()) {
        triggerAlert('Please enter the customer registered name.', 'error');
        return;
      }
      const digits = newCustTin.replace(/\D/g, '');
      if (digits.length < 9) {
        triggerAlert('Please enter a valid 9 to 14 digit TIN for this regular customer.', 'error');
        return;
      }

      // Check if this TIN already exists under another name
      const conflict = customers.find(c => {
        const cDigits = (c.client_TIN || c.customer_tin || '').replace(/\D/g, '');
        return cDigits.length >= 9 && cDigits.startsWith(digits.slice(0, 9));
      });
      if (conflict) {
        const cName = conflict.registered_name || conflict.customer_name || '';
        if (cName.toLowerCase() !== newCustName.trim().toLowerCase()) {
          triggerAlert(`TIN ${newCustTin} is already registered to customer "${cName}". Please reroute using the existing customer or check the TIN.`, 'error');
          return;
        }
      }

      targetCustName = newCustName.trim();
      targetTin = newCustTin.trim();
      targetAddress = newCustAddress.trim();

      // Add new customer to database
      const newCustRecord: Customer = {
        id: Date.now(),
        company_name: activeCompanyName,
        registered_name: targetCustName,
        customer_name: targetCustName,
        trade_name: targetCustName,
        client_TIN: targetTin,
        customer_tin: targetTin,
        tin_number: targetTin,
        client_Address: targetAddress,
        customer_address: targetAddress,
        address: targetAddress,
        tax_type: newCustTaxType,
        vat_status: newCustTaxType,
        client_status: 'Active'
      };

      setCustomers(prev => [newCustRecord, ...prev]);
    }

    // Update Transaction across books
    setSubsidiarySales(prev => prev.map(s => {
      if (s.id === reroutingRecord.id || s.invoice_number === reroutingRecord.invoice_number) {
        return {
          ...s,
          registered_name: targetCustName,
          tin: targetTin,
          address: targetAddress || s.address,
          is_various: false
        };
      }
      return s;
    }));

    setCollections(prev => prev.map(c => {
      if (c.invoice_number && c.invoice_number.trim().toLowerCase() === reroutingRecord.invoice_number.trim().toLowerCase()) {
        return {
          ...c,
          registered_name: targetCustName,
          tin: targetTin,
          address: targetAddress || c.address
        };
      }
      return c;
    }));

    triggerAlert(
      `Transaction ${reroutingRecord.invoice_number} successfully rerouted from Various Customer to regular customer "${targetCustName}" (TIN: ${targetTin})!`,
      'success'
    );
    setReroutingRecord(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* HEADER SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} space-y-1`}>
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-4 h-4" /> Various Customers Count
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px]">
              {variousTransactions.length} records
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {variousTransactions.length}
          </div>
          <p className="text-[11px] text-zinc-400">
            Unregistered or no-TIN transactions tracked for future rerouting
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} space-y-1`}>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <DollarSign className="w-4 h-4" /> Total Various Revenue
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            ₱{totalVariousRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-400">
            Cumulative gross sales recorded under Various Customers
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} space-y-1`}>
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-4 h-4" /> Pending Receivables
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            ₱{totalPendingReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-400">
            Uncollected balance pending from various customers
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-zinc-400 font-semibold whitespace-nowrap">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-3 py-1.5 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
          >
            <option value="ALL" className="bg-zinc-900 text-white">All Statuses</option>
            <option value="Paid" className="bg-zinc-900 text-white">Paid</option>
            <option value="Partial" className="bg-zinc-900 text-white">Partial</option>
            <option value="On Account" className="bg-zinc-900 text-white">On Account</option>
          </select>
        </div>
      </div>

      {/* VARIOUS CUSTOMERS TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Date</th>
                <th className="p-3">Invoice # (INV #)</th>
                <th className="p-3">Customer / Client Display</th>
                <th className="p-3">Particulars</th>
                <th className="p-3 text-right">Gross Total (₱)</th>
                <th className="p-3 text-right">Pending Balance (₱)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No Various Customer transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(rec => (
                  <tr key={rec.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'} transition-colors`}>
                    <td className="p-3 font-mono text-zinc-300">{rec.date}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{rec.invoice_number}</td>
                    <td className="p-3">
                      <div className={`font-semibold ${theme.textMain}`}>
                        {rec.registered_name || 'Various Customers'}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        TIN: {rec.tin || '000-000-000-00000'} (Unregistered)
                      </div>
                    </td>
                    <td className={`p-3 max-w-xs truncate ${theme.textMuted}`}>{rec.particulars || 'Sales'}</td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                      ₱{(Number(rec.total_amount_due || rec.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-amber-400">
                      ₱{(Number(rec.pending_balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        rec.status === 'Partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer flex items-center gap-1"
                          title="Edit transaction info"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenReroute(rec)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer flex items-center gap-1"
                          title="Reroute to Regular Customer in Database"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Reroute
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

      {/* ======================================================== */}
      {/* 1. EDIT TRANSACTION INFO MODAL */}
      {/* ======================================================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-700/40 pb-3">
              <h3 className={`text-sm font-bold ${theme.textTitle} flex items-center gap-2`}>
                <Pencil className="w-4 h-4 text-cyan-400" />
                Edit Transaction: {editingRecord.invoice_number}
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  placeholder="e.g. Various Customers or Walk-in Customer"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Particulars / Description</label>
                <input
                  type="text"
                  value={editParticulars}
                  onChange={(e) => setEditParticulars(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-700/30">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className={`px-4 py-2 text-xs rounded-xl border ${theme.borderCard} text-zinc-400 cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REROUTE TRANSACTION MODAL */}
      {/* ======================================================== */}
      {reroutingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-700/40 pb-3">
              <div>
                <h3 className={`text-base font-bold ${theme.textTitle} flex items-center gap-2`}>
                  <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                  Reroute from Various Customer to Regular Customer
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Invoice #{reroutingRecord.invoice_number} (Amount: ₱{(Number(reroutingRecord.total_amount_due) || 0).toLocaleString()})
                </p>
              </div>
              <button onClick={() => setReroutingRecord(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection between existing vs new */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-xs">
              <button
                type="button"
                onClick={() => setRerouteMode('existing')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  rerouteMode === 'existing'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1. Select Registered Customer
              </button>
              <button
                type="button"
                onClick={() => setRerouteMode('new')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  rerouteMode === 'new'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2. Register New Customer with TIN
              </button>
            </div>

            <form onSubmit={handleExecuteReroute} className="space-y-3.5">
              {rerouteMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Select Customer from Database ({customers.length} available) *
                  </label>
                  {customers.length === 0 ? (
                    <div className="p-3 text-xs text-amber-400 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      No customers registered yet. Please switch to "Register New Customer with TIN".
                    </div>
                  ) : (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                      required
                    >
                      {customers.map((c, idx) => (
                        <option key={idx} value={c.registered_name || c.customer_name || c.trade_name} className="bg-zinc-900 text-white">
                          {c.registered_name || c.customer_name} (TIN: {c.client_TIN || c.customer_tin || 'No TIN'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Customer Registered Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DEF Enterprises Inc."
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Customer TIN (000-000-000-00000) *
                    </label>
                    <input
                      type="text"
                      placeholder="000-000-000-00000"
                      value={newCustTin}
                      onChange={(e) => handleNewTinChange(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Tax Type</label>
                      <select
                        value={newCustTaxType}
                        onChange={(e) => setNewCustTaxType(e.target.value as any)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                      >
                        <option value="VAT" className="bg-zinc-900 text-white">VAT</option>
                        <option value="Non-VAT" className="bg-zinc-900 text-white">Non-VAT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Address</label>
                      <input
                        type="text"
                        placeholder="Business address"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                💡 <strong>Notice:</strong> This action updates the invoice's customer details and moves it out of Various Customers into the regular customer's subsidiary sales and collections.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-700/30">
                <button
                  type="button"
                  onClick={() => setReroutingRecord(null)}
                  className={`px-4 py-2 text-xs rounded-xl border ${theme.borderCard} text-zinc-400 cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  Confirm & Reroute Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
