import React, { useState } from 'react';
import { Building2, Landmark, Check, Info, Pencil, Trash2, Plus, X, Search, CheckCircle2, ShieldCheck, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Company } from '../types';

interface CompaniesTabProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  activeCompany: Company | null;
  setActiveCompany: (c: Company | null) => void;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

export default function CompaniesTab({
  companies,
  setCompanies,
  activeCompany,
  setActiveCompany,
  theme,
  triggerAlert,
  globalSearch = ''
}: CompaniesTabProps) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // 2 Clean Sub-tabs: 'company' (Profile / Information) and 'bir' (BIR 2303 Tax Obligations)
  const [formSubTab, setFormSubTab] = useState<'company' | 'bir'>('company');

  // Fields strictly aligned with Table Company
  const [companyName, setCompanyName] = useState('');
  const [entityType, setEntityType] = useState('CORPORATION');
  const [companyTin, setCompanyTin] = useState('');
  const [tinBranchCode, setTinBranchCode] = useState('00000');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [incorporationDate, setIncorporationDate] = useState('');
  const [rdo, setRdo] = useState('');
  const [lineOfBusiness, setLineOfBusiness] = useState('');

  // BIR 2303 Certificate of Registration (YES / NO fields)
  const [vatType, setVatType] = useState<'VATABLE' | 'NON-VAT' | 'EXEMPT'>('VATABLE');
  const [regFee, setRegFee] = useState<'Yes' | 'No'>('Yes');
  const [incomeTax, setIncomeTax] = useState<'Yes' | 'No'>('Yes');
  const [finalWithholding, setFinalWithholding] = useState<'Yes' | 'No'>('No');
  const [expandedWithholding, setExpandedWithholding] = useState<'Yes' | 'No'>('Yes');
  const [withholdingComp, setWithholdingComp] = useState<'Yes' | 'No'>('Yes');
  const [fringeBenefits, setFringeBenefits] = useState<'Yes' | 'No'>('No');
  const [relatedParty, setRelatedParty] = useState<'Yes' | 'No'>('No');
  const [documentaryStamp, setDocumentaryStamp] = useState<'Yes' | 'No'>('No');

  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);

  // Mask TIN (first 9 digits)
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    setCompanyTin(formatted);
  };

  const handleBranchCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setTinBranchCode(digits);
  };

  const resetForm = () => {
    setEditingCompanyId(null);
    setFormSubTab('company');
    setCompanyName('');
    setEntityType('CORPORATION');
    setCompanyTin('');
    setTinBranchCode('00000');
    setCompanyAddress('');
    setCompanyEmail('');
    setCompanyContact('');
    setIncorporationDate('');
    setRdo('');
    setLineOfBusiness('');
    setVatType('VATABLE');
    setRegFee('Yes');
    setIncomeTax('Yes');
    setFinalWithholding('No');
    setExpandedWithholding('Yes');
    setWithholdingComp('Yes');
    setFringeBenefits('No');
    setRelatedParty('No');
    setDocumentaryStamp('No');
  };

  const openNewCompanyModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompName = companyName.trim();
    if (!finalCompName) {
      triggerAlert('Please enter a valid Company / Business Name.', 'error');
      return;
    }

    const cleanTinDigits = companyTin.replace(/\D/g, '');
    const cleanBranch = tinBranchCode.trim() || '00000';
    const formattedFullTin = cleanTinDigits ? `${companyTin}-${cleanBranch}` : '000-000-000-00000';

    const savedCompany: Company = {
      id: editingCompanyId !== null ? editingCompanyId : Date.now(),
      company_name: finalCompName,
      trade_name: finalCompName,
      entity_type: entityType,
      company_tin: formattedFullTin,
      tin_branch_code: cleanBranch,
      company_address: companyAddress.trim(),
      registered_address: companyAddress.trim(),
      company_email: companyEmail.trim(),
      company_contact: companyContact.trim(),
      birthday_or_incorporation_date: incorporationDate,
      rdo: rdo.trim(),
      rdo_code: rdo.trim(),
      line_of_business: lineOfBusiness.trim(),
      vat_or_non_vat: vatType,
      registration_fee: regFee === 'Yes',
      income_tax: incomeTax === 'Yes',
      form_0619f: finalWithholding === 'Yes',
      withholding_expanded: expandedWithholding === 'Yes',
      withholding_compensation: withholdingComp === 'Yes',
      withholding_fringe_benefit: fringeBenefits === 'Yes',
      date_of_entry: new Date().toISOString().split('T')[0]
    };

    if (editingCompanyId !== null) {
      setCompanies(prev => prev.map(c => {
        if (c.id === editingCompanyId) {
          if (activeCompany && activeCompany.id === editingCompanyId) {
            setActiveCompany(savedCompany);
          }
          return savedCompany;
        }
        return c;
      }));
      triggerAlert(`Company profile "${finalCompName}" updated successfully!`, 'success');
      resetForm();
      setIsModalOpen(false);
    } else {
      setCompanies(prev => [...prev, savedCompany]);
      if (!activeCompany) {
        setActiveCompany(savedCompany);
      }
      triggerAlert(`Company profile "${finalCompName}" registered successfully!`, 'success');
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleDeleteCompany = (id: number, name: string) => {
    if (activeCompany && activeCompany.id === id) {
      triggerAlert("Cannot delete the active workspace company. Switch active workspace first.", "error");
      return;
    }
    if (window.confirm(`Delete Company Profile for ${name}?`)) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      triggerAlert(`Deleted Company profile successfully!`, 'info');
    }
  };

  const handleEditClick = (c: Company) => {
    setEditingCompanyId(c.id);
    setFormSubTab('company');
    setCompanyName(c.company_name || c.trade_name || '');
    setEntityType(c.entity_type || 'CORPORATION');
    
    const tinStr = (c.company_tin || '');
    const splitIndex = tinStr.lastIndexOf('-');
    if (splitIndex !== -1 && splitIndex > 5) {
      setCompanyTin(tinStr.slice(0, splitIndex));
      setTinBranchCode(tinStr.slice(splitIndex + 1));
    } else {
      setCompanyTin(tinStr);
      setTinBranchCode(c.tin_branch_code || '00000');
    }

    setCompanyAddress(c.company_address || c.registered_address || '');
    setCompanyEmail(c.company_email || '');
    setCompanyContact(c.company_contact || '');
    setIncorporationDate(c.birthday_or_incorporation_date || '');
    setRdo(c.rdo || c.rdo_code || '');
    setLineOfBusiness(c.line_of_business || '');

    // BIR 2303
    setVatType((c.vat_or_non_vat as any) || 'VATABLE');
    setRegFee(c.registration_fee ? 'Yes' : 'No');
    setIncomeTax(c.income_tax ? 'Yes' : 'No');
    setFinalWithholding(c.form_0619f ? 'Yes' : 'No');
    setExpandedWithholding(c.withholding_expanded ? 'Yes' : 'No');
    setWithholdingComp(c.withholding_compensation ? 'Yes' : 'No');
    setFringeBenefits(c.withholding_fringe_benefit ? 'Yes' : 'No');
    setRelatedParty('No');
    setDocumentaryStamp('No');

    setIsModalOpen(true);
  };

  const filteredCompanies = companies.filter(c => {
    const q = (localSearch || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return (
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.company_tin && c.company_tin.toLowerCase().includes(q)) ||
      (c.entity_type && c.entity_type.toLowerCase().includes(q)) ||
      (c.rdo && c.rdo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* REGISTERED COMPANIES MASTERLIST DATABASE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
        {/* HEADER & CONTROLS */}
        <div className={`p-5 border-b ${theme.borderCard} flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-lg ${theme.textTitle}`}>
                  Company Profiles & Registration Database
                </h2>
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-mono font-bold">
                  {companies.length} {companies.length === 1 ? 'entity' : 'entities'}
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Official registered companies, entity classification, contact information, and BIR 2303 tax obligations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search company, TIN, or RDO..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className={`pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent w-56 font-sans ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-pink-500`}
              />
            </div>

            {/* REGISTER COMPANY BUTTON (OPENS POPUP MODAL) */}
            <button
              type="button"
              onClick={openNewCompanyModal}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Register Company Profile / Entity
            </button>
          </div>
        </div>

        {/* DATABASE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3.5">Company TIN</th>
                <th className="p-3.5">Company Name</th>
                <th className="p-3.5">Entity Type</th>
                <th className="p-3.5">Company Address</th>
                <th className="p-3.5">Email & Contact</th>
                <th className="p-3.5">Birthday / Incorp Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Company Entities Found</p>
                    <p className="text-xs mt-1">Click "Register Company Profile / Entity" above to register your first workspace.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const isActive = activeCompany?.id === c.id;
                  return (
                    <tr key={c.id} className={`hover:bg-zinc-800/30 transition-colors ${isActive ? 'bg-pink-500/5' : ''}`}>
                      <td className="p-3.5 font-mono font-bold text-cyan-400">
                        {c.company_tin}
                      </td>
                      <td className="p-3.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${theme.textTitle}`}>{c.company_name}</span>
                          {isActive && (
                            <span className="bg-pink-500/15 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/20 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 inline" /> Active Workspace
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[11px]">
                          {c.entity_type || 'CORPORATION'}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-300 max-w-xs truncate" title={c.company_address}>
                        {c.company_address || '—'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-300 font-mono text-[11px]">{c.company_email || '—'}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">{c.company_contact || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">
                        {c.birthday_or_incorporation_date || '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCompany(c);
                                triggerAlert(`Switched active workspace to "${c.company_name}".`, 'info');
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition cursor-pointer font-bold"
                            >
                              Select
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEditClick(c)}
                            className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                            title="Edit Entity Profile"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isActive}
                            onClick={() => handleDeleteCompany(c.id, c.company_name || 'Entity')}
                            className={`p-1.5 rounded-lg border transition ${
                              isActive 
                                ? 'border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
                                : 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                            title={isActive ? "Cannot delete active entity" : "Delete Entity Profile"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      {/* POPUP MODAL: REGISTER / EDIT COMPANY PROFILE ENTITY                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingCompanyId !== null ? "Update Company Profile" : "Register Company Profile / Entity"}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Fill in complete legal entity details and BIR Form 2303 registration requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingCompanyId !== null && (
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider">
                    Editing mode
                  </span>
                )}
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
            </div>

            {/* 2 CLEAN MODAL SUB-TABS: Company Information & BIR 2303 */}
            <div className="flex gap-2 px-6 pt-4 pb-2 border-b border-zinc-800/40 bg-zinc-500/5">
              <button
                type="button"
                onClick={() => setFormSubTab('company')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formSubTab === 'company'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Building2 className="w-4 h-4" />
                1. Company Profile & Tax Details
              </button>
              <button
                type="button"
                onClick={() => setFormSubTab('bir')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formSubTab === 'bir'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Landmark className="w-4 h-4" />
                2. BIR 2303 (Certificate of Registration)
              </button>
            </div>

            {/* MODAL SCROLLABLE BODY (FORM) */}
            <form onSubmit={handleSaveCompany} className="flex flex-col flex-1 overflow-y-auto p-6">
              {/* TAB 1: COMPANY INFORMATION */}
              {formSubTab === 'company' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Philippines Holdings Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-pink-500`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Entity Type *</label>
                      <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                      >
                        <option value="SOLE PROPRIETORSHIP" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Sole Proprietorship</option>
                        <option value="PARTNERSHIP" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Partnership</option>
                        <option value="CORPORATION" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Corporation</option>
                        <option value="OPC" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>One Person Corporation (OPC)</option>
                        <option value="COOPERATIVE" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cooperative</option>
                        <option value="NON-PROFIT / FOUNDATION" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-Profit / Foundation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company TIN (9 Digits) *</label>
                      <input
                        type="text"
                        placeholder="123-456-789"
                        value={companyTin}
                        onChange={(e) => handleTinChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Branch Code (5 Digits)</label>
                      <input
                        type="text"
                        placeholder="00000"
                        value={tinBranchCode}
                        onChange={(e) => handleBranchCodeChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Birthday / Incorporation Date</label>
                      <input
                        type="date"
                        value={incorporationDate}
                        onChange={(e) => setIncorporationDate(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. 15F Tower 1, Ayala Avenue, Makati City, Metro Manila"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Email</label>
                      <input
                        type="email"
                        placeholder="accounting@company.com"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Contact</label>
                      <input
                        type="text"
                        placeholder="0917-123-4567"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>RDO Code / District</label>
                      <input
                        type="text"
                        placeholder="e.g. 044 - Taguig"
                        value={rdo}
                        onChange={(e) => setRdo(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Line of Business (PSIC / Nature)</label>
                    <input
                      type="text"
                      placeholder="e.g. General Wholesale & IT Consulting Services"
                      value={lineOfBusiness}
                      onChange={(e) => setLineOfBusiness(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BIR 2303 (Certificate of Registration) */}
              {formSubTab === 'bir' && (
                <div className="flex flex-col gap-5 animate-fadeIn">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>VAT Registration Type (BIR Form 2303)</label>
                    <select
                      value={vatType}
                      onChange={(e) => setVatType(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                    >
                      <option value="VATABLE" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>VAT Registered (12%)</option>
                      <option value="NON-VAT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-VAT / Percentage Tax (1% or 3%)</option>
                      <option value="EXEMPT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Tax Exempt / PEZA / BOI Registered</option>
                    </select>
                  </div>

                  {/* YES / NO BIR 2303 REGISTERED TAX OBLIGATIONS */}
                  <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/5`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textTitle} flex items-center gap-2`}>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      BIR Registered Tax Types & Obligations (Yes / No Selectors)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* 1. Registration Fee */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Registration Fee</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 0605</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setRegFee('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              regFee === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegFee('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              regFee === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 2. Income Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Income Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 1701 / 1702 (ITR)</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setIncomeTax('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              incomeTax === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncomeTax('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              incomeTax === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 3. Final Withholding Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Final Withholding Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 0619F / 1601FQ</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setFinalWithholding('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              finalWithholding === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setFinalWithholding('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              finalWithholding === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 4. Expanded Withholding Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Expanded Withholding Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 0619E / 1601EQ</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setExpandedWithholding('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              expandedWithholding === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedWithholding('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              expandedWithholding === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 5. Withholding on Compensation */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Withholding on Compensation</p>
                          <p className="text-[10px] text-zinc-500">BIR 1601-C (Payroll Tax)</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setWithholdingComp('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              withholdingComp === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setWithholdingComp('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              withholdingComp === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 6. Fringe Benefits Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Fringe Benefits Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 1603Q</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setFringeBenefits('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              fringeBenefits === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setFringeBenefits('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              fringeBenefits === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 7. Related Party Transactions */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Related Party Transactions</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 1709</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setRelatedParty('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              relatedParty === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setRelatedParty('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              relatedParty === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 8. Monthly Documentary Stamp */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Monthly Documentary Stamp</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 2000 / 2000-OT</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setDocumentaryStamp('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              documentaryStamp === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocumentaryStamp('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              documentaryStamp === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER CONTROLS */}
              <div className={`mt-6 pt-4 border-t ${theme.borderCard} flex items-center justify-between`}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editingCompanyId !== null ? "Update Company Profile" : "Register Company Profile"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
