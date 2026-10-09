import React, { useState, useMemo } from 'react';
import { Truck, Plus, Pencil, Trash2, Search, X, Check, Eye, Receipt, FileText } from 'lucide-react';
import { ServiceProvider, Company, Expense, Payment, AccountTitle } from '../types';

interface ProvidersTabProps {
  serviceProviders: ServiceProvider[];
  setServiceProviders: React.Dispatch<React.SetStateAction<ServiceProvider[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
  expenses?: Expense[];
  payments?: Payment[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
  accountTitles?: AccountTitle[];
}

export default function ProvidersTab({
  serviceProviders,
  setServiceProviders,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch,
  expenses = [],
  payments = [],
  setExpenses,
  setPayments,
  accountTitles = []
}: ProvidersTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [providerName, setProviderName] = useState('');
  const [tin, setTin] = useState('');
  const [branchCode, setBranchCode] = useState('00000');
  const [address, setAddress] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [atcCode, setAtcCode] = useState('WC120');
  const [businessTaxType, setBusinessTaxType] = useState<'vatable' | 'non-vatable' | 'vat-exempt' | 'zero-rated'>('vatable');
  const [expenseType, setExpenseType] = useState('Operating Expense');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Drilldown state for selected provider
  const [drilldownProv, setDrilldownProv] = useState<ServiceProvider | null>(null);

  // Dynamic Chart of Accounts Expenses options
  const selectableExpenseAccounts = useMemo(() => {
    if (!accountTitles || accountTitles.length === 0) {
      return [
        'Operating Expense',
        'Cost of Goods Sold',
        'Rent Expense',
        'Utilities Expense',
        'Salaries & Wages',
        'Office Supplies',
        'Professional Fees',
        'Advertising & Promotion',
        'Taxes & Licenses',
        'Communication Expense',
        'Depreciation Expense',
        'Repairs & Maintenance',
        'Miscellaneous Expense'
      ];
    }
    const filtered = accountTitles
      .filter(a => {
        const type = (a.type || a.account_type || '').toLowerCase();
        const cat = (a.category || a.account_sub_type || '').toLowerCase();
        return type.includes('expense') || type.includes('cost') || cat.includes('expense') || cat.includes('cost');
      })
      .map(a => a.account_title || a.title || '')
      .filter(Boolean);
    return filtered.length > 0 ? Array.from(new Set(filtered)) : [
      'Operating Expense',
      'Rent Expense',
      'Utilities Expense',
      'Salaries & Wages',
      'Office Supplies',
      'Professional Fees',
      'Miscellaneous Expense'
    ];
  }, [accountTitles]);

  const resetForm = () => {
    setEditingId(null);
    setProviderName('');
    setTin('');
    setBranchCode('00000');
    setAddress('');
    setContactNo('');
    setEmail('');
    setAtcCode('WC120');
    setBusinessTaxType('vatable');
    setExpenseType('Operating Expense');
  };

  const openNewProviderModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    setTin(formatted);
  };

  const handleBranchCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setBranchCode(digits);
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !activeCompany.company_name || activeCompany.company_name.trim() === '' || activeCompany.company_name === 'Select Company...') {
      triggerAlert('Please select or create an Entity Profile first before adding vendors!', 'error');
      return;
    }
    const cleanTinDigits = tin.replace(/\D/g, '');
    if (cleanTinDigits.length !== 9) {
      triggerAlert('Provider TIN must be exactly 9 digits (e.g. 123-456-789)!', 'error');
      return;
    }
    const cleanBranch = branchCode.replace(/\D/g, '').padStart(5, '0').slice(0, 5);
    if (!providerName.trim()) {
      triggerAlert('Provider Name is required!', 'error');
      return;
    }

    if (editingId !== null) {
      setServiceProviders(prev => prev.map(p => p.id === editingId ? {
        ...p,
        service_provider_name: providerName.trim(),
        registered_name: providerName.trim(),
        service_provider_TIN: tin.trim(),
        sp_tin: tin.trim(),
        sp_branch_code: cleanBranch,
        provider_branch_code: cleanBranch,
        sp_address: address.trim(),
        service_provider_Address: address.trim(),
        business_tax_type: businessTaxType,
        expense_type: expenseType,
        tax_type: businessTaxType === 'vatable' ? 'VAT' : 'Non-VAT',
        vat_status: businessTaxType === 'vatable' ? 'VAT' : 'NON-VAT',
        contact_number: contactNo.trim(),
        email: email.trim(),
        atc_code: atcCode
      } : p));
      triggerAlert(`Service provider "${providerName}" updated successfully.`, 'success');
      resetForm();
      setIsModalOpen(false);
    } else {
      const nextIdNum = serviceProviders.filter(p => p.company_name === activeCompany.company_name).length + 1;
      const newProvId = `PROV-${String(nextIdNum).padStart(4, '0')}`;

      const newProvider: ServiceProvider = {
        id: Date.now(),
        provider_id: newProvId,
        company_name: activeCompany.company_name,
        registered_name: providerName.trim(),
        service_provider_name: providerName.trim(),
        service_provider_TIN: tin.trim(),
        sp_tin: tin.trim(),
        sp_branch_code: cleanBranch,
        provider_branch_code: cleanBranch,
        business_tax_type: businessTaxType,
        expense_type: expenseType,
        tax_type: businessTaxType === 'vatable' ? 'VAT' : 'Non-VAT',
        vat_status: businessTaxType === 'vatable' ? 'VAT' : 'NON-VAT',
        service_provider_Address: address.trim(),
        sp_address: address.trim(),
        contact_number: contactNo.trim(),
        email: email.trim(),
        atc_code: atcCode
      };

      setServiceProviders(prev => [...prev, newProvider]);
      triggerAlert(`Service provider "${providerName}" registered with ID: ${newProvId}.`, 'success');
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleEdit = (provider: ServiceProvider) => {
    setEditingId(provider.id);
    setProviderName(provider.service_provider_name || provider.registered_name || '');
    setTin(provider.sp_tin || provider.service_provider_TIN || '');
    setBranchCode(provider.provider_branch_code || provider.sp_branch_code || '00000');
    setAddress(provider.sp_address || provider.service_provider_Address || '');
    setContactNo(provider.contact_number || '');
    setEmail(provider.email || '');
    setAtcCode(provider.atc_code || 'WC120');
    setBusinessTaxType((provider.business_tax_type as any) || (provider.vat_status === 'VAT' ? 'vatable' : 'non-vatable'));
    setExpenseType(provider.expense_type || 'Operating Expense');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}"?`)) {
      setServiceProviders(prev => prev.filter(p => p.id !== id));
      triggerAlert(`Provider "${name}" deleted.`, 'info');
    }
  };

  const filteredProviders = serviceProviders.filter(p => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return (p.service_provider_name || '').toLowerCase().includes(q) ||
      (p.sp_tin && p.sp_tin.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.expense_type && p.expense_type.toLowerCase().includes(q));
  });

  // Calculate stats for drilldown provider
  const drilldownData = useMemo(() => {
    if (!drilldownProv) return null;
    const provName = (drilldownProv.service_provider_name || drilldownProv.registered_name || '').toLowerCase();
    const provTin = (drilldownProv.sp_tin || drilldownProv.service_provider_TIN || '').replace(/\D/g, '');

    const matchingExpenses = expenses.filter(e => {
      const eName = (e.registered_name || e.service_provider_name || '').toLowerCase();
      const eTin = (e.service_provider_TIN || e.sp_tin || '').replace(/\D/g, '');
      return (provTin && eTin.startsWith(provTin.slice(0, 9))) || (provName && eName === provName);
    });

    const matchingPayments = payments.filter(p => {
      const pName = (p.registered_name || p.service_provider_name || p.payee_name || '').toLowerCase();
      const pTin = (p.sp_tin || p.service_provider_TIN || '').replace(/\D/g, '');
      return (provTin && pTin.startsWith(provTin.slice(0, 9))) || (provName && pName === provName);
    });

    const totalPurchases = matchingExpenses.reduce((sum, e) => sum + (Number(e.total_amount_due || e.expense_invoice_amount || e.amount) || 0), 0);
    const totalPaid = matchingPayments.reduce((sum, p) => sum + (Number(p.amount_paid || p.net_paid || p.voucher_amount) || 0), 0);
    const balance = Math.max(0, totalPurchases - totalPaid);

    return {
      expenses: matchingExpenses,
      payments: matchingPayments,
      totalPurchases,
      totalPaid,
      balance
    };
  }, [drilldownProv, expenses, payments]);

  if (!activeCompany || !activeCompany.company_name || activeCompany.company_name.trim() === '' || activeCompany.company_name === 'Select Company...') {
    return (
      <div className={`p-8 md:p-12 rounded-2xl border ${theme.borderCard} ${theme.bgCard} text-center space-y-4 max-w-2xl mx-auto my-8 shadow-sm`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${theme.textTitle}`}>
            Entity Profile Required Before Managing Service Providers
          </h3>
          <p className={`text-xs ${theme.textMuted} mt-1.5 max-w-md mx-auto leading-relaxed`}>
            Bago ka makapag-enter ng transactions at service providers, kailangan mo munang mag-setup ng entity profile. Saan mapupunta ang provider at expense transactions kung wala naman itong designated entity?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* VENDORS & SERVICE PROVIDERS MASTERLIST */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
        {/* HEADER & CONTROLS */}
        <div className={`p-5 border-b ${theme.borderCard} flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-lg ${theme.textTitle}`}>
                  Service Providers & Vendors Directory
                </h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                  {serviceProviders.length} {serviceProviders.length === 1 ? 'vendor' : 'vendors'}
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Master vendor database with 9-digit TIN, branch code, business tax type, and primary expense category.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search vendor, TIN, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent w-56 font-sans ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-emerald-500`}
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              type="button"
              onClick={openNewProviderModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Register Provider / Vendor
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3.5">Provider ID</th>
                <th className="p-3.5">Vendor / Provider Name</th>
                <th className="p-3.5 font-mono">TIN (9 Digits)</th>
                <th className="p-3.5 font-mono">Branch Code</th>
                <th className="p-3.5">Business Tax Type</th>
                <th className="p-3.5">Expense Type (COA)</th>
                <th className="p-3.5">Address</th>
                <th className="p-3.5">Default ATC</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-500">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Service Providers Found</p>
                    <p className="text-xs mt-1">Click "Register Provider / Vendor" above to add your first supplier profile.</p>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((p, pIdx) => {
                  const provId = p.provider_id || `PROV-${String(pIdx + 1).padStart(4, '0')}`;
                  const taxType = p.business_tax_type || (p.vat_status === 'VAT' ? 'vatable' : 'non-vatable');
                  const expCategory = p.expense_type || 'Operating Expense';
                  return (
                    <tr key={p.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className="p-3.5 font-mono font-bold text-violet-400">{provId}</td>
                      <td className={`p-3.5 font-bold ${theme.textTitle}`}>{p.service_provider_name || p.registered_name}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {p.sp_tin || p.service_provider_TIN}
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">
                        {p.provider_branch_code || p.sp_branch_code || '00000'}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          taxType === 'vatable' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : taxType === 'zero-rated'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : taxType === 'vat-exempt'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {taxType}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-indigo-400">
                        {expCategory}
                      </td>
                      <td className={`p-3.5 ${theme.isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{p.sp_address || p.service_provider_Address || '-'}</td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{p.atc_code || 'WC120'}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrilldownProv(p)}
                            className={`p-1.5 px-2 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'} hover:border-cyan-500 transition cursor-pointer inline-flex items-center gap-1 font-semibold text-xs`}
                            title="View Provider Expenses & Subsidiary Ledger"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Expenses</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className={`p-1.5 px-2.5 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'} hover:border-emerald-500 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs`}
                            title="Edit Provider"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.service_provider_name || p.registered_name || '')}
                            className="p-1.5 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs"
                            title="Delete Provider"
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
      {/* DRILLDOWN MODAL: PROVIDER EXPENSES & SUBSIDIARY LEDGER                     */}
      {/* ========================================================================= */}
      {drilldownProv && drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`${theme.bgCard} border ${theme.borderCard} w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className={`p-4 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${theme.textTitle} font-display`}>
                    Vendor Subsidiary Ledger & Expenses — {drilldownProv.service_provider_name || drilldownProv.registered_name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    TIN: {drilldownProv.sp_tin || drilldownProv.service_provider_TIN} • Branch: {drilldownProv.provider_branch_code || drilldownProv.sp_branch_code || '00000'} • Tax Type: {(drilldownProv.business_tax_type || 'vatable').toUpperCase()} • Default Category: {drilldownProv.expense_type || 'Operating Expense'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDrilldownProv(null)}
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
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Invoiced Expenses</span>
                  <span className={`text-lg font-bold font-mono ${theme.textTitle} mt-1 block`}>
                    ₱{drilldownData.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">From {drilldownData.expenses.length} expense vouchers</span>
                </div>
                <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/2`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Paid / Disbursed</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                    ₱{drilldownData.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">From {drilldownData.payments.length} payment settlements</span>
                </div>
                <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/2`}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Outstanding Accounts Payable
                  </span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${
                    drilldownData.balance > 0 ? 'text-amber-500' : 'text-zinc-400'
                  }`}>
                    ₱{drilldownData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {drilldownData.balance > 0 ? "Pending Vendor Obligation" : "Account Fully Settled"}
                  </span>
                </div>
              </div>

              {/* Expense Transactions Table with additional headers: business tax type and expense type */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-bold ${theme.textTitle} uppercase tracking-wider flex items-center gap-1.5`}>
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    Expense Vouchers & Purchases for this Provider ({drilldownData.expenses.length})
                  </h5>
                </div>

                {drilldownData.expenses.length === 0 ? (
                  <div className={`p-8 border ${theme.borderCard} rounded-xl text-center text-zinc-500 text-xs`}>
                    No expense transactions encoded for this service provider yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-700/40 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead className="bg-zinc-800/60 text-zinc-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-3">Voucher #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">1. Business Tax Type</th>
                          <th className="p-3">2. Expense Type (COA)</th>
                          <th className="p-3">Particulars</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Input VAT</th>
                          <th className="p-3 text-right">Total Due</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {drilldownData.expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-zinc-800/30">
                            <td className="p-3 font-mono font-bold text-amber-400">{exp.invoice_number || exp.voucher_number}</td>
                            <td className="p-3 font-mono text-zinc-400">{exp.issue_date || exp.expense_date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {exp.business_tax_type || (exp.nonvat_or_vat === 'VAT' ? 'vatable' : 'non-vatable')}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-indigo-300">
                              {exp.expense_type || 'Operating Expense'}
                            </td>
                            <td className="p-3 text-zinc-300 max-w-[200px] truncate">{exp.description || 'Purchases of Goods & Services'}</td>
                            <td className="p-3 text-right font-mono">₱{(exp.amount || exp.expense_invoice_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-cyan-400">₱{(exp.vat || exp.vat_input_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">₱{(exp.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                exp.payment_status === 'Paid' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {exp.payment_status || 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-4 border-t ${theme.borderCard} flex justify-end bg-zinc-500/5`}>
              <button
                type="button"
                onClick={() => setDrilldownProv(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: REGISTER / EDIT VENDOR PROFILE                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`relative w-full max-w-xl ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden p-6`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-4 border-b ${theme.borderCard} mb-5`}>
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? 'Edit Vendor / Provider Profile' : 'Register New Vendor / Provider'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Enter official vendor details with TIN, branch code, business tax type, and primary expense category.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className={`p-1.5 rounded-lg border ${theme.borderCard} text-zinc-400 hover:text-white transition cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProvider} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                  Provider / Vendor Registered Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meralco / PLDT / Office Supplies Co."
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                    Provider TIN (9 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123-456-789"
                    value={tin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">9-digit primary TIN</p>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                    Branch Code (5 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00000"
                    value={branchCode}
                    onChange={(e) => handleBranchCodeChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">e.g. 00000 for Head Office</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                    1. Business Tax Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={businessTaxType}
                    onChange={(e) => setBusinessTaxType(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="vatable" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Vatable (12% VAT)</option>
                    <option value="non-vatable" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-Vatable (3% / None)</option>
                    <option value="vat-exempt" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>VAT-Exempt</option>
                    <option value="zero-rated" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Zero-Rated (0%)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                    2. Primary Expense Type (COA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    {selectableExpenseAccounts.map((cat) => (
                      <option key={cat} value={cat} className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Registered Address</label>
                <input
                  type="text"
                  placeholder="Unit, Street, Barangay, City, Province"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Contact Number</label>
                  <input
                    type="text"
                    placeholder="0917-000-0000"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Email Address</label>
                  <input
                    type="email"
                    placeholder="billing@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Default ATC (BIR 2307)</label>
                <select
                  value={atcCode}
                  onChange={(e) => setAtcCode(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="WC100" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>WC100 - Prof Fees (Individual) 5%/10%</option>
                  <option value="WC120" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>WC120 - Rentals (Real/Personal Property) 5%</option>
                  <option value="WC158" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>WC158 - Contractors / Services 2%</option>
                  <option value="WC160" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>WC160 - Top Withholding Agents Goods 1%</option>
                  <option value="WC010" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>WC010 - Prof Fees (Juridical) 10%/15%</option>
                </select>
              </div>

              <div className={`mt-4 pt-4 border-t ${theme.borderCard} flex items-center justify-between`}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingId !== null ? 'Update Vendor' : 'Save Vendor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
