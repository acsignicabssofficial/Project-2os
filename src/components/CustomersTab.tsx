import React, { useState, useMemo, useRef } from 'react';
import { Plus, Eye, X, Receipt, Pencil, Trash2, ChevronDown, ChevronRight, Download, Upload, Users, Search } from 'lucide-react';
import { Customer, Company, Sale, Collection } from '../types';
import { downloadTemplate, parseImportFile, pickField, formatTin } from '../utils/importExport';

interface CustomersTabProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  sales: Sale[];
  collections: Collection[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  globalSearch?: string;
}

export default function CustomersTab({
  customers,
  setCustomers,
  activeCompany,
  theme,
  triggerAlert,
  sales,
  collections,
  setSales,
  setCollections,
  globalSearch = ''
}: CustomersTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Form State
  const [directCustTin, setDirectCustTin] = useState('');
  const [directCustName, setDirectCustName] = useState('');
  const [directCustAddr, setDirectCustAddr] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Drilldown Modal
  const [drilldownCust, setDrilldownCust] = useState<Customer | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadTemplate(
      ['Customer TIN', 'Customer Name', 'Address', 'VAT Status (VAT/Non-VAT)'],
      'customer_import_template.csv'
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      e.target.value = '';
      return;
    }
    setIsImporting(true);
    try {
      const rows = await parseImportFile(file);
      let added = 0;
      let skippedDuplicate = 0;
      let skippedInvalid = 0;
      const existingTins = new Set(customers.filter(c => c.company_name === activeCompanyName).map(c => c.customer_tin || c.client_TIN));
      const newCustomers: Customer[] = [];

      rows.forEach((row, idx) => {
        const name = pickField(row, ['Customer Name', 'Name', 'Customer', 'customer_name']);
        const rawTin = pickField(row, ['Customer TIN', 'TIN', 'customer_tin']);
        const address = pickField(row, ['Address', 'Customer Address', 'customer_address']);
        const vatRaw = pickField(row, ['VAT Status (VAT/Non-VAT)', 'VAT Status', 'vat_status']).toLowerCase();
        const tin = formatTin(rawTin);

        if (!name || !tin) {
          skippedInvalid++;
          return;
        }
        if (existingTins.has(tin) || newCustomers.some(c => c.customer_tin === tin || c.client_TIN === tin)) {
          skippedDuplicate++;
          return;
        }

        newCustomers.push({
          id: Date.now() + idx,
          company_name: activeCompanyName,
          registered_name: name,
          customer_name: name,
          client_TIN: tin,
          customer_tin: tin,
          client_Address: address,
          customer_address: address,
          tax_type: vatRaw.startsWith('non') ? 'Non-VAT' : 'VAT'
        });
        added++;
      });

      if (newCustomers.length > 0) {
        setCustomers(prev => [...prev, ...newCustomers]);
      }

      triggerAlert(
        `Import complete: ${added} customer(s) added${skippedDuplicate > 0 ? `, ${skippedDuplicate} duplicate(s) skipped` : ''}${skippedInvalid > 0 ? `, ${skippedInvalid} invalid row(s) skipped` : ''}.`,
        added > 0 ? 'success' : 'error'
      );
      setIsImportModalOpen(false);
    } catch (err) {
      triggerAlert('Could not read that file. Please use the downloadable template format (.xlsx, .xls, or .csv).', 'error');
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleEditClick = (item: Customer) => {
    setEditingId(item.id);
    setDirectCustTin(item.customer_tin);
    setDirectCustName(item.customer_name);
    setDirectCustAddr(item.customer_address || '');
    setIsModalOpen(true);
  };

  const openNewCustomerModal = () => {
    setEditingId(null);
    setDirectCustTin('');
    setDirectCustName('');
    setDirectCustAddr('');
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDirectCustTin('');
    setDirectCustName('');
    setDirectCustAddr('');
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer profile "${name}"?`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      triggerAlert(`Customer profile "${name}" deleted.`, "info");
    }
  };

  // Mask TIN
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setDirectCustTin(formatted);
  };

  const handleAddCustomerDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert("Please select or create a Company Profile first in the Companies tab!", "error");
      return;
    }
    if (!directCustTin || !directCustName) {
      triggerAlert("Customer TIN and Customer Name are required!", "error");
      return;
    }

    if (editingId !== null) {
      if (customers.some(c => c.id !== editingId && c.customer_tin === directCustTin && c.company_name === activeCompanyName)) {
        triggerAlert(`Customer TIN ${directCustTin} is already registered to another profile!`, "error");
        return;
      }
    } else {
      if (customers.some(c => c.customer_tin === directCustTin && c.company_name === activeCompanyName)) {
        triggerAlert(`Customer TIN ${directCustTin} is already registered!`, "error");
        return;
      }
    }

    if (editingId !== null) {
      const oldCust = customers.find(c => c.id === editingId);
      const oldTin = oldCust?.customer_tin;

      setCustomers(prev => prev.map(c => {
        if (c.id === editingId) {
          return {
            ...c,
            customer_name: directCustName,
            customer_tin: directCustTin,
            customer_address: directCustAddr
          };
        }
        return c;
      }));

      // Cascade updates to Sales and Collections
      if (oldTin) {
        setSales(prev => prev.map(s => {
          if (s.customer_tin === oldTin && s.company_name === activeCompanyName) {
            return {
              ...s,
              customer_tin: directCustTin,
              customer_name: directCustName
            };
          }
          return s;
        }));

        setCollections(prev => prev.map(col => {
          if (col.customer_tin === oldTin && col.company_name === activeCompanyName) {
            return {
              ...col,
              customer_tin: directCustTin,
              customer_name: directCustName
            };
          }
          return col;
        }));
      }

      triggerAlert(`Customer profile updated successfully!`, 'success');
      handleCancelEdit();
    } else {
      const newCust: Customer = {
        id: Date.now(),
        company_name: activeCompanyName,
        registered_name: directCustName,
        customer_name: directCustName,
        client_TIN: directCustTin,
        customer_tin: directCustTin,
        client_Address: directCustAddr,
        customer_address: directCustAddr,
        tax_type: 'VAT'
      };

      setCustomers(prev => [...prev, newCust]);
      triggerAlert(`Customer profile "${directCustName}" registered successfully!`, 'success');
      handleCancelEdit();
    }
  };

  const companyCustomers = customers.filter(c => activeCompanyName && c.company_name === activeCompanyName);

  // Calculate statistics per customer profile
  const customerStats = useMemo(() => {
    const stats: Record<string, { totalSales: number; totalCollected: number; balance: number }> = {};
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    const uniqueTins = new Set<string>();
    companyCustomers.forEach(c => uniqueTins.add(c.customer_tin));
    sales.filter(s => activeCompanyName && s.company_name === activeCompanyName).forEach(s => uniqueTins.add(s.customer_tin));
    collections.filter(c => activeCompanyName && c.company_name === activeCompanyName).forEach(c => uniqueTins.add(c.customer_tin));

    uniqueTins.forEach(tin => {
      const customerSales = sales.filter(s => s.customer_tin === tin && activeCompanyName && s.company_name === activeCompanyName);
      const totalSales = customerSales.reduce((sum, s) => sum + (Number(s.invoice_amount) || 0), 0);

      let totalCollected = 0;
      customerSales.forEach(s => {
        const invNo = normalizeDocNo(s.invoice_number);
        const collsForInvoice = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo && activeCompanyName && c.company_name === activeCompanyName);
        if (collsForInvoice.length > 0) {
          totalCollected += collsForInvoice.reduce((sum, col) => sum + (Number(col.amount_collected) || 0) + (Number(col.amount_withheld_2307) || 0), 0) + (Number(s.down_payment) || 0);
        } else {
          if (s.sales_status === 'Paid') {
            totalCollected += (Number(s.invoice_amount) || 0);
          } else {
            totalCollected += (Number(s.down_payment) || 0);
          }
        }
      });

      const orphanColls = collections.filter(c => {
        if (c.customer_tin !== tin || !activeCompanyName || c.company_name !== activeCompanyName) return false;
        const normInv = normalizeDocNo(c.invoice_number);
        return !customerSales.some(s => normalizeDocNo(s.invoice_number) === normInv);
      });
      totalCollected += orphanColls.reduce((sum, col) => sum + (Number(col.amount_collected) || 0) + (Number(col.amount_withheld_2307) || 0), 0);

      stats[tin] = {
        totalSales,
        totalCollected,
        balance: totalSales - totalCollected
      };
    });

    return stats;
  }, [customers, sales, collections, activeCompanyName, companyCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = (localSearch || globalSearch).toLowerCase().trim();
    if (!q) return companyCustomers;
    return companyCustomers.filter(c => 
      (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
      (c.customer_tin && c.customer_tin.toLowerCase().includes(q)) ||
      (c.customer_address && c.customer_address.toLowerCase().includes(q))
    );
  }, [companyCustomers, localSearch, globalSearch]);

  // Drilldown helper data
  const drilldownData = useMemo(() => {
    if (!drilldownCust) return null;
    const tin = drilldownCust.customer_tin;
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const customerSales = sales.filter(s => s.customer_tin === tin && activeCompanyName && s.company_name === activeCompanyName);
    const customerCollections = collections.filter(c => c.customer_tin === tin && activeCompanyName && c.company_name === activeCompanyName);

    const totals = customerStats[tin] || { totalSales: 0, totalCollected: 0, balance: 0 };

    const actuals = customerCollections.map(c => ({
      id: c.id,
      collection_date: c.collection_date,
      entry_number: c.entry_number || `CR-${c.id}`,
      invoice_number: c.invoice_number,
      type: 'Collection' as const,
      amount_collected: c.amount_collected,
      amount_withheld_2307: c.amount_withheld_2307,
      balance: c.balance ?? 0
    }));

    const downPayments = customerSales
      .filter(s => s.down_payment > 0)
      .map(s => ({
        id: `down-${s.id}`,
        collection_date: s.invoice_date,
        entry_number: "DOWN-PAYMENT",
        invoice_number: s.invoice_number,
        type: 'Down Payment' as const,
        amount_collected: s.down_payment,
        amount_withheld_2307: 0,
        balance: s.invoice_amount - s.down_payment
      }));

    const combinedCollections = [...downPayments, ...actuals].sort((a, b) => {
      return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
    });
    
    return {
      sales: customerSales,
      collections: customerCollections,
      combinedCollections,
      ...totals
    };
  }, [drilldownCust, sales, collections, activeCompany, customerStats, activeCompanyName]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* CUSTOMER PROFILES MASTERLIST DATABASE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
        {/* HEADER & CONTROLS */}
        <div className={`p-5 border-b ${theme.borderCard} flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-lg ${theme.textTitle}`}>
                  Registered Customers Database
                </h2>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono font-bold">
                  {companyCustomers.length} {companyCustomers.length === 1 ? 'customer' : 'customers'}
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Customer master directory with integrated subsidiary ledger, live sales invoicing, and collection tracking.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search name, TIN, or address..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className={`pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent w-52 font-sans ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-blue-500`}
              />
            </div>

            {/* Bulk Import Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition ${theme.borderCard} ${theme.textMain} hover:bg-zinc-500/10`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Bulk Import</span>
            </button>

            {/* REGISTER CUSTOMER BUTTON (OPENS MODAL) */}
            <button
              type="button"
              onClick={openNewCustomerModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Register Customer Profile
            </button>
          </div>
        </div>

        {/* DATABASE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3.5">Customer TIN</th>
                <th className="p-3.5">Full Legal Name</th>
                <th className="p-3.5">Registered Address</th>
                <th className="p-3.5 text-right">Total Invoiced Sales</th>
                <th className="p-3.5 text-right">Total Collected</th>
                <th className="p-3.5 text-right">Net Balance (A/R or Credit)</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Customer Profiles Found</p>
                    <p className="text-xs mt-1">Click "Register Customer Profile" above or use Bulk Import to populate your customer directory.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const stats = customerStats[c.customer_tin] || { totalSales: 0, totalCollected: 0, balance: 0 };
                  return (
                    <tr key={c.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className={`p-3.5 font-mono font-bold text-blue-400`}>{c.customer_tin}</td>
                      <td className={`p-3.5 font-bold ${theme.textTitle}`}>{c.customer_name}</td>
                      <td className={`p-3.5 ${theme.isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{c.customer_address || "No address on file"}</td>
                      <td className={`p-3.5 text-right font-mono ${theme.isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">₱{stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3.5 text-right font-mono">
                        {stats.balance > 0 ? (
                          <span className="font-bold text-amber-500">₱{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal text-amber-500/80 block">A/R Due</span></span>
                        ) : stats.balance < 0 ? (
                          <span className="font-bold text-cyan-400">₱{Math.abs(stats.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal text-cyan-400/80 block">Credit Balance</span></span>
                        ) : (
                          <span className="text-zinc-400">₱0.00 <span className="text-[10px] font-sans font-normal text-zinc-500 block">Settled</span></span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setDrilldownCust(c)}
                            className={`p-1.5 px-2.5 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'} hover:border-blue-500 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs`}
                            title="View Subsidiary Ledger"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ledger</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleEditClick(c)}
                            className={`p-1.5 px-2.5 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'} hover:border-cyan-500 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs`}
                            title="Edit Customer Profile"
                          >
                            <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Edit</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id, c.customer_name)}
                            className={`p-1.5 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs`}
                            title="Delete Customer Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
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

      {/* ========================================================================= */}
      {/* POPUP MODAL: REGISTER / EDIT CUSTOMER PROFILE                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-xl ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? 'Update Customer Profile' : 'Register Customer Profile'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Enter official customer details for sales invoicing and BIR 2307 tracking.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCustomerDirect} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Customer TIN <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="000-000-000-00000"
                  value={directCustTin}
                  onChange={(e) => handleTinChange(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs bg-transparent focus:outline-hidden ${theme.accentFocus} font-mono font-bold placeholder-zinc-500 ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Customer Legal Entity Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Corporation / Juan Dela Cruz"
                  value={directCustName}
                  onChange={(e) => setDirectCustName(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs bg-transparent focus:outline-hidden ${theme.accentFocus} font-semibold placeholder-zinc-500 ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Full Registered BIR Address
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Unit 123 Tower 1, Makati City, Metro Manila"
                  value={directCustAddr}
                  onChange={(e) => setDirectCustAddr(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs bg-transparent focus:outline-hidden ${theme.accentFocus} placeholder-zinc-500 ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div className={`mt-4 pt-4 border-t ${theme.borderCard} flex items-center justify-between`}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  {editingId !== null ? 'Update Customer Profile' : 'Save Customer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: BULK IMPORT CUSTOMER PROFILES                                */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-lg ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    Bulk Import Customers
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Upload spreadsheet to batch-register multiple customer records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/5 flex items-center justify-between`}>
                <div>
                  <h4 className={`text-xs font-bold ${theme.textTitle}`}>Step 1: Download Standard Template</h4>
                  <p className={`text-[11px] ${theme.textMuted} mt-0.5`}>Pre-formatted with Customer TIN, Legal Name, Address, and VAT Status.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Template
                </button>
              </div>

              <div className={`p-6 rounded-xl border-2 border-dashed ${theme.borderCard} text-center flex flex-col items-center justify-center gap-3`}>
                <Upload className="w-8 h-8 text-blue-400 opacity-60" />
                <div>
                  <p className={`text-xs font-bold ${theme.textTitle}`}>Step 2: Upload Completed Spreadsheet</p>
                  <p className={`text-[11px] ${theme.textMuted} mt-0.5`}>Supports Excel (.xlsx, .xls) or CSV format</p>
                </div>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => importInputRef.current?.click()}
                  className={`mt-1 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition flex items-center gap-2 cursor-pointer ${isImporting ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Parsing & Importing...' : 'Choose File to Import'}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>

            <div className={`p-4 border-t ${theme.borderCard} flex justify-end bg-zinc-500/5`}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILL DOWN MODAL */}
      {drilldownCust && drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${theme.bgCard} border ${theme.borderCard} w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className={`p-4 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div>
                <h4 className={`text-sm font-bold ${theme.textTitle} font-display`}>Customer Subsidiary Ledger</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{drilldownCust.customer_name} • TIN: {drilldownCust.customer_tin}</p>
              </div>
              <button 
                onClick={() => setDrilldownCust(null)}
                className={`p-1.5 rounded-lg border ${theme.borderCard} hover:bg-zinc-500/20 text-zinc-400 hover:text-white transition cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/2`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Invoiced Sales</span>
                  <span className={`text-lg font-bold font-mono ${theme.textTitle} mt-1 block`}>
                    ₱{drilldownData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">From {drilldownData.sales.length} issued invoices</span>
                </div>
                <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/2`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Collections + 2307</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                    ₱{drilldownData.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">From {drilldownData.combinedCollections.length} collection entries</span>
                </div>
                <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/2`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {drilldownData.balance > 0 ? "Outstanding A/R Receivable" : drilldownData.balance < 0 ? "Total Credit Balance (Advance)" : "Net Ledger Balance"}
                  </span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${
                    drilldownData.balance > 0 ? 'text-amber-500' : drilldownData.balance < 0 ? 'text-cyan-400' : 'text-zinc-400'
                  }`}>
                    ₱{Math.abs(drilldownData.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {drilldownData.balance > 0 ? "Collectable Customer Due" : drilldownData.balance < 0 ? "Over-collected / Customer Advance" : "Account Fully Settled"}
                  </span>
                </div>
              </div>

              {/* Collapsible Issued Sales Invoices & Collection Breakdown */}
              <div className="flex flex-col gap-4">
                <h5 className={`text-xs font-bold ${theme.accentText} uppercase tracking-wider flex items-center justify-between`}>
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    Issued Sales Invoices & Collection Breakdown ({drilldownData.sales.length})
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Click an invoice row to collapse/expand collection breakdown</span>
                </h5>

                {drilldownData.sales.length === 0 ? (
                  <div className={`p-6 border ${theme.borderCard} rounded-xl text-center text-zinc-500 text-xs`}>
                    No sales invoices issued for this customer profile.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drilldownData.sales.map((sale) => {
                      const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                      const invNo = normalizeDocNo(sale.invoice_number);
                      
                      // Find collections linked to this sale
                      const actualsForSale = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo && activeCompanyName && c.company_name === activeCompanyName);
                      
                      const hasDP = Number(sale.down_payment) > 0;
                      const totalCollectedOnInvoice = actualsForSale.reduce((a, b) => a + (Number(b.amount_collected) || 0) + (Number(b.amount_withheld_2307) || 0), 0) + (hasDP ? Number(sale.down_payment) : 0);
                      const invoiceBalance = (Number(sale.invoice_amount) || 0) - totalCollectedOnInvoice;

                      const isExpanded = expandedInvoices[sale.invoice_number] !== false; // default open
                      const actualStatus = invoiceBalance <= 0.01 ? 'Paid' : (totalCollectedOnInvoice > 0 ? 'Partial' : 'Unpaid');

                      return (
                        <div key={sale.id} className={`border ${theme.borderCard} rounded-xl overflow-hidden shadow-sm transition-colors ${theme.bgCard}`}>
                          {/* Invoice Summary Bar */}
                          <div 
                            onClick={() => setExpandedInvoices(prev => ({ ...prev, [sale.invoice_number]: !isExpanded }))}
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition ${
                              theme.isLight ? 'bg-slate-100/80 hover:bg-slate-200/60' : 'bg-zinc-800/40 hover:bg-zinc-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <button className="p-1 rounded bg-zinc-500/10 text-zinc-400">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold text-sm ${theme.textTitle}`}>
                                    Invoice #{sale.invoice_number}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    actualStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                                    actualStatus === 'Partial' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {actualStatus}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono">Issued: {sale.invoice_date}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono">
                              <div>
                                <span className="text-[9px] text-zinc-400 uppercase block">Invoice Amount</span>
                                <span className="font-bold">₱{(Number(sale.invoice_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-zinc-400 uppercase block">Total Collections</span>
                                <span className="font-bold text-emerald-400">₱{totalCollectedOnInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-zinc-400 uppercase block">Invoice Balance</span>
                                {invoiceBalance > 0 ? (
                                  <span className="font-bold text-amber-500">₱{invoiceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                ) : invoiceBalance < 0 ? (
                                  <span className="font-bold text-cyan-400">₱{Math.abs(invoiceBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Credit)</span>
                                ) : (
                                  <span className="font-bold text-zinc-500">₱0.00</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Payment Collections Breakdown */}
                          {isExpanded && (
                            <div className={`p-4 border-t ${theme.borderCard} bg-zinc-500/5 space-y-2`}>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1">
                                <span>-- Payment Collections Breakdown</span>
                                <span className="font-mono text-[10px]">{actualsForSale.length + (hasDP ? 1 : 0)} collection record(s)</span>
                              </div>

                              <div className="overflow-x-auto border border-zinc-800/20 rounded-lg">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-zinc-500/10 text-zinc-400 uppercase font-bold text-[10px]">
                                      <th className="p-2 font-mono">Date</th>
                                      <th className="p-2 font-mono">Ref / CR #</th>
                                      <th className="p-2">Collection Type</th>
                                      <th className="p-2 text-right">Cash Collected</th>
                                      <th className="p-2 text-right">BIR 2307</th>
                                      <th className="p-2 text-right">Running Balance</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/10">
                                    {hasDP && (
                                      <tr className="bg-amber-500/5">
                                        <td className="p-2 font-mono">{sale.invoice_date}</td>
                                        <td className="p-2 font-mono font-semibold text-amber-500">DOWN-PAYMENT</td>
                                        <td className="p-2 font-sans font-medium text-amber-400">Advance Down Payment</td>
                                        <td className="p-2 text-right font-mono text-emerald-400 font-bold">₱{(Number(sale.down_payment) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2 text-right font-mono text-zinc-500">₱0.00</td>
                                        <td className="p-2 text-right font-mono text-amber-500 font-bold">₱{(Number(sale.invoice_amount) - Number(sale.down_payment)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}

                                    {actualsForSale.length === 0 && !hasDP ? (
                                      <tr>
                                        <td colSpan={6} className="p-3 text-center text-zinc-500 text-[10px]">
                                          No collections logged for this invoice yet.
                                        </td>
                                      </tr>
                                    ) : (
                                      actualsForSale.map((col, idx) => {
                                        const collsUpToCurrent = actualsForSale.slice(0, idx + 1);
                                        const collectedUpToCurrent = collsUpToCurrent.reduce((sum, c) => sum + (Number(c.amount_collected) || 0) + (Number(c.amount_withheld_2307) || 0), 0) + (hasDP ? Number(sale.down_payment) : 0);
                                        const runningBal = (Number(sale.invoice_amount) || 0) - collectedUpToCurrent;

                                        return (
                                          <tr key={col.id} className={theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/20'}>
                                            <td className="p-2 font-mono">{col.collection_date}</td>
                                            <td className={`p-2 font-mono font-bold ${theme.textTitle}`}>{col.entry_number || `CR-${col.id}`}</td>
                                            <td className="p-2 text-zinc-400">Collection Receipt</td>
                                            <td className="p-2 text-right font-mono text-emerald-400 font-bold">
                                              ₱{(Number(col.amount_collected) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-2 text-right font-mono text-zinc-400">
                                              ₱{(Number(col.amount_withheld_2307) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className={`p-2 text-right font-mono font-bold ${
                                              runningBal > 0 ? 'text-amber-500' : runningBal < 0 ? 'text-cyan-400' : 'text-zinc-500'
                                            }`}>
                                              {runningBal < 0 ? `₱${Math.abs(runningBal).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Credit)` : `₱${runningBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${theme.borderCard} flex justify-end bg-zinc-500/5`}>
              <button 
                onClick={() => setDrilldownCust(null)}
                className={`px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer`}
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
