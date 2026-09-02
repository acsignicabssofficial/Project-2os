import React, { useState } from 'react';
import { Truck, Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react';
import { ServiceProvider, Company } from '../types';

interface ProvidersTabProps {
  serviceProviders: ServiceProvider[];
  setServiceProviders: React.Dispatch<React.SetStateAction<ServiceProvider[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function ProvidersTab({
  serviceProviders,
  setServiceProviders,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch
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
  const [vatStatus, setVatStatus] = useState<'VAT' | 'NON-VAT'>('VAT');
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setProviderName('');
    setTin('');
    setBranchCode('00000');
    setAddress('');
    setContactNo('');
    setEmail('');
    setAtcCode('WC120');
    setVatStatus('VAT');
  };

  const openNewProviderModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first in the Companies tab!', 'error');
      return;
    }
    if (!providerName || !tin) {
      triggerAlert('Provider Name and TIN are required fields!', 'error');
      return;
    }

    if (editingId !== null) {
      setServiceProviders(prev => prev.map(p => p.id === editingId ? {
        ...p,
        service_provider_name: providerName.trim(),
        registered_name: providerName.trim(),
        service_provider_TIN: tin.trim(),
        sp_tin: tin.trim(),
        sp_branch_code: branchCode.trim(),
        sp_address: address.trim(),
        service_provider_Address: address.trim(),
        contact_number: contactNo.trim(),
        email: email.trim(),
        atc_code: atcCode,
        vat_status: vatStatus,
        tax_type: vatStatus === 'VAT' ? 'VAT' : 'Non-VAT'
      } : p));
      triggerAlert(`Service provider "${providerName}" updated successfully.`, 'success');
      resetForm();
      setIsModalOpen(false);
    } else {
      const newProvider: ServiceProvider = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        registered_name: providerName.trim(),
        service_provider_name: providerName.trim(),
        service_provider_TIN: tin.trim(),
        sp_tin: tin.trim(),
        sp_branch_code: branchCode.trim(),
        tax_type: vatStatus === 'VAT' ? 'VAT' : 'Non-VAT',
        vat_status: vatStatus,
        service_provider_Address: address.trim(),
        sp_address: address.trim(),
        contact_number: contactNo.trim(),
        email: email.trim(),
        atc_code: atcCode
      };

      setServiceProviders(prev => [...prev, newProvider]);
      triggerAlert(`Service provider "${providerName}" registered.`, 'success');
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleEdit = (provider: ServiceProvider) => {
    setEditingId(provider.id);
    setProviderName(provider.service_provider_name);
    setTin(provider.sp_tin || provider.service_provider_TIN || '');
    setBranchCode(provider.sp_branch_code || '00000');
    setAddress(provider.sp_address || provider.service_provider_Address || '');
    setContactNo(provider.contact_number || '');
    setEmail(provider.email || '');
    setAtcCode(provider.atc_code || 'WC120');
    setVatStatus(provider.vat_status || 'VAT');
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
    return p.service_provider_name.toLowerCase().includes(q) ||
      (p.sp_tin && p.sp_tin.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q));
  });

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
                Master vendor database for purchase invoicing, BIR 2307 withholding certificates, and ATC tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search vendor, TIN, or email..."
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
                <th className="p-3.5">Vendor / Provider Name</th>
                <th className="p-3.5">TIN & Branch</th>
                <th className="p-3.5">Address</th>
                <th className="p-3.5">Contact Info</th>
                <th className="p-3.5">Default ATC</th>
                <th className="p-3.5">Tax Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Service Providers Found</p>
                    <p className="text-xs mt-1">Click "Register Provider / Vendor" above to add your first supplier profile.</p>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((p) => (
                  <tr key={p.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3.5 font-bold ${theme.textTitle}`}>{p.service_provider_name}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      {p.sp_tin || p.service_provider_TIN}
                      <span className="text-[10px] text-zinc-500 ml-1">({p.sp_branch_code || '00000'})</span>
                    </td>
                    <td className={`p-3.5 ${theme.isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{p.sp_address || p.service_provider_Address || '-'}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col text-[11px]">
                        <span className={theme.textMain}>{p.contact_number || '-'}</span>
                        <span className="text-zinc-500">{p.email || ''}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{p.atc_code || 'WC120'}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.vat_status === 'VAT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.vat_status || 'VAT'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                          onClick={() => handleDelete(p.id, p.service_provider_name)}
                          className="p-1.5 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs"
                          title="Delete Provider"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
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

      {/* ========================================================================= */}
      {/* POPUP MODAL: REGISTER / EDIT VENDOR PROFILE                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-2xl ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? 'Update Service Provider Profile' : 'Register Service Provider / Vendor'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Enter vendor tax profile, default expanded withholding ATC, and contact information.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProvider} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Provider / Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Globe Telecom, Inc."
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-emerald-500`}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>TIN (9 Digits) *</label>
                    <input
                      type="text"
                      placeholder="000-000-000"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-emerald-500`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Branch</label>
                    <input
                      type="text"
                      placeholder="00000"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Business Address</label>
                <input
                  type="text"
                  placeholder="Street, Barangay, City, Province"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Tax Status</label>
                  <select
                    value={vatStatus}
                    onChange={(e) => setVatStatus(e.target.value as 'VAT' | 'NON-VAT')}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="VAT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>VAT Registered (12%)</option>
                    <option value="NON-VAT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-VAT / Percentage Tax</option>
                  </select>
                </div>
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
