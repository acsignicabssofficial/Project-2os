import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Info,
  Scale,
  Sparkles
} from 'lucide-react';
import { Company, EntityTaxYearProfile } from '../types';
import { 
  isIndividualEntity, 
  upsertEntityTaxProfile, 
  removeEntityTaxProfile 
} from '../utils/taxProfiles';

interface AnnualTaxRegimesModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onSaveCompany: (updatedCompany: Company) => void;
  triggerAlert?: (msg: string, type: 'success' | 'error' | 'info') => void;
  theme?: any;
}

export const AnnualTaxRegimesModal: React.FC<AnnualTaxRegimesModalProps> = ({
  company,
  isOpen,
  onClose,
  onSaveCompany,
  triggerAlert,
  theme
}) => {
  if (!isOpen) return null;

  const isIndiv = isIndividualEntity(company.entity_type);
  const profiles = company.tax_year_profiles ? [...company.tax_year_profiles].sort((a, b) => a.year - b.year) : [];

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (profiles.length > 0) {
      return profiles[profiles.length - 1].year + 1;
    }
    return currentYear;
  });

  const [incomeTaxType, setIncomeTaxType] = useState<'GRADUATED' | 'EIGHT_PERCENT'>(
    isIndiv ? 'EIGHT_PERCENT' : 'GRADUATED'
  );
  const [expenseDeduction, setExpenseDeduction] = useState<'ITEMIZED' | 'OSD_40'>('ITEMIZED');
  const [vatStatus, setVatStatus] = useState<'VATABLE' | 'NON-VAT' | 'EXEMPT'>(
    incomeTaxType === 'EIGHT_PERCENT' ? 'NON-VAT' : ((company.vat_or_non_vat as any) || 'VATABLE')
  );
  const [taxpayerClassification, setTaxpayerClassification] = useState<'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE'>('MICRO');
  const [allow250k, setAllow250k] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const handleSelectYearToEdit = (p: EntityTaxYearProfile) => {
    setSelectedYear(p.year);
    setIncomeTaxType(isIndiv && p.income_tax_type === 'EIGHT_PERCENT' ? 'EIGHT_PERCENT' : 'GRADUATED');
    setExpenseDeduction(p.expense_deduction_type || 'ITEMIZED');
    setVatStatus(p.vat_or_non_vat || 'NON-VAT');
    setTaxpayerClassification(p.taxpayer_classification || 'MICRO');
    setAllow250k(p.allow_250k_exemption !== false);
    setNotes(p.notes || '');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const profileToSave: EntityTaxYearProfile = {
      year: Number(selectedYear),
      income_tax_type: isIndiv && incomeTaxType === 'EIGHT_PERCENT' ? 'EIGHT_PERCENT' : 'GRADUATED',
      expense_deduction_type: incomeTaxType === 'EIGHT_PERCENT' ? 'ITEMIZED' : expenseDeduction,
      vat_or_non_vat: incomeTaxType === 'EIGHT_PERCENT' ? 'NON-VAT' : vatStatus,
      taxpayer_classification: taxpayerClassification,
      allow_250k_exemption: incomeTaxType === 'EIGHT_PERCENT' ? allow250k : true,
      notes: notes.trim()
    };

    const updated = upsertEntityTaxProfile(company, profileToSave);
    onSaveCompany(updated);
    if (triggerAlert) {
      triggerAlert(`Tax regime for Year ${selectedYear} saved successfully!`, 'success');
    }

    // Reset notes and suggest next year
    setNotes('');
    setSelectedYear(Number(selectedYear) + 1);
  };

  const handleDeleteProfile = (year: number) => {
    if (!confirm(`Are you sure you want to remove the annual tax profile for Year ${year}? It will revert to the entity's baseline registration.`)) {
      return;
    }
    const updated = removeEntityTaxProfile(company, year);
    onSaveCompany(updated);
    if (triggerAlert) {
      triggerAlert(`Tax regime for Year ${year} removed.`, 'info');
    }
  };

  const handleQuickAddYear = (year: number, defaultRegime: '8%' | 'OSD' | 'ITEMIZED') => {
    const newProfile: EntityTaxYearProfile = {
      year,
      income_tax_type: isIndiv && defaultRegime === '8%' ? 'EIGHT_PERCENT' : 'GRADUATED',
      expense_deduction_type: defaultRegime === 'OSD' ? 'OSD_40' : 'ITEMIZED',
      vat_or_non_vat: defaultRegime === '8%' ? 'NON-VAT' : 'VATABLE',
      allow_250k_exemption: true,
      notes: `Quick preset: ${defaultRegime}`
    };
    const updated = upsertEntityTaxProfile(company, newProfile);
    onSaveCompany(updated);
    if (triggerAlert) {
      triggerAlert(`Added Year ${year} (${defaultRegime}) to profile ledger.`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Annual Tax Regimes & Elections Ledger
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {company.company_tin || company.entity_tin || 'TIN-000'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {company.company_name} ({company.entity_type || 'Sole Proprietorship'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Statutory Context Banner */}
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-zinc-300">
              <p className="font-semibold text-purple-300">
                Year-by-Year Multi-Period Accounting Isolation
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                In Philippine taxation, an entity’s income tax election is locked per taxable year upon filing the 1st Quarter return (BIR Form 1701Q). 
                Reconstructing historical accounting (e.g., Year 1 = 8%, Year 2 = OSD, Year 3 = Itemized, Year 4 = 8%) maintains strict statutory integrity: transactions occurring in any year calculate strictly under that year’s elected rules without altering other years.
              </p>
            </div>
          </div>

          {/* Existing Configured Years Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Configured Annual Regimes ({profiles.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddYear(2022, '8%')}
                  className="px-2 py-1 text-[11px] rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono transition cursor-pointer"
                >
                  +2022 (8%)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddYear(2023, 'OSD')}
                  className="px-2 py-1 text-[11px] rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono transition cursor-pointer"
                >
                  +2023 (OSD)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddYear(2024, 'ITEMIZED')}
                  className="px-2 py-1 text-[11px] rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono transition cursor-pointer"
                >
                  +2024 (Itemized)
                </button>
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-500">
                <p>No custom tax year profiles configured yet.</p>
                <p className="text-[11px] mt-1">
                  The entity currently defaults to its baseline Certificate of Registration setting: 
                  <span className="text-zinc-300 font-bold ml-1">
                    {company.income_tax_type === 'EIGHT_PERCENT' ? '8% Gross Income Tax' : 'Graduated Rates'}
                  </span>
                  . Use the form below to lock specific elections for past or future years.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="p-3">Tax Year</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3">Income Tax Regime</th>
                      <th className="p-3">Deduction Method</th>
                      <th className="p-3">VAT Status</th>
                      <th className="p-3">₱250k Exemption</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {profiles.map(p => (
                      <tr 
                        key={p.year}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          p.year === selectedYear ? 'bg-purple-500/10' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-sm text-purple-400">
                          {p.year}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            {p.taxpayer_classification || 'MICRO'}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.income_tax_type === 'EIGHT_PERCENT' ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              8% Gross Income Tax
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Graduated Income Tax
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {p.income_tax_type === 'EIGHT_PERCENT' ? (
                            <span className="text-zinc-500 italic">Not Applicable (8% Flat)</span>
                          ) : p.expense_deduction_type === 'OSD_40' ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              40% Optional Standard (OSD)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Itemized Deductions
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          <span className={`text-[10px] font-bold ${
                            p.vat_or_non_vat === 'VATABLE' ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {p.vat_or_non_vat || 'NON-VAT'}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.income_tax_type === 'EIGHT_PERCENT' ? (
                            p.allow_250k_exemption !== false ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Deducted (₱250k)
                              </span>
                            ) : (
                              <span className="text-zinc-500">Mixed Income (None)</span>
                            )
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-400 max-w-xs truncate">
                          {p.notes || '—'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectYearToEdit(p)}
                              className="px-2 py-1 text-[11px] rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition cursor-pointer"
                              title="Edit Year Profile"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(p.year)}
                              className="p-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Delete Year Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form to Add / Update a Tax Year Election */}
          <form onSubmit={handleSaveProfile} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add / Update Election for Tax Year
              </h4>
              <span className="text-xs text-purple-400 font-bold">
                Target Year: {selectedYear}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Year Input */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Tax Year (Calendar Year)
                </label>
                <input
                  type="number"
                  min="2010"
                  max="2035"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10) || currentYear)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono font-bold focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Income Tax Regime */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Income Tax Regime
                </label>
                <select
                  value={incomeTaxType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setIncomeTaxType(val);
                    if (val === 'EIGHT_PERCENT') {
                      setVatStatus('NON-VAT');
                    }
                  }}
                  disabled={!isIndiv}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="GRADUATED">Graduated Income Tax Rates (Sec. 24(A))</option>
                  {isIndiv && (
                    <option value="EIGHT_PERCENT">8% Gross Income Tax (Sec. 24(A)(2)(b))</option>
                  )}
                </select>
                {!isIndiv && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    *8% is available only to Individual taxpayers (Sole Proprietors & Professionals).
                  </p>
                )}
              </div>

              {/* Deduction Method */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Deduction Method
                </label>
                <select
                  value={expenseDeduction}
                  onChange={(e) => setExpenseDeduction(e.target.value as any)}
                  disabled={incomeTaxType === 'EIGHT_PERCENT'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden disabled:opacity-40"
                >
                  <option value="ITEMIZED">Itemized Deductions (Actual Expenses)</option>
                  <option value="OSD_40">40% Optional Standard Deduction (OSD)</option>
                </select>
                {incomeTaxType === 'EIGHT_PERCENT' && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Under 8%, tax is computed on gross sales/receipts. No deductions are claimed.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Classification */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Classification (EOPT RA 11976)
                </label>
                <select
                  value={taxpayerClassification}
                  onChange={(e) => setTaxpayerClassification(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="MICRO">Micro (&lt; ₱3M Sales)</option>
                  <option value="SMALL">Small (₱3M to &lt; ₱20M)</option>
                  <option value="MEDIUM">Medium (₱20M to &lt; ₱1B)</option>
                  <option value="LARGE">Large (₱1B+)</option>
                </select>
              </div>

              {/* VAT Registration for that year */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  VAT Registration Status
                </label>
                <select
                  value={vatStatus}
                  onChange={(e) => setVatStatus(e.target.value as any)}
                  disabled={incomeTaxType === 'EIGHT_PERCENT'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="NON-VAT">Non-VAT (Below ₱3M Threshold)</option>
                  <option value="VATABLE">VAT Registered (12% VAT)</option>
                  <option value="EXEMPT">Exempt Entity</option>
                </select>
              </div>

              {/* ₱250k Business Exemption */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  ₱250k Exemption (for 8% Sole Prop)
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="allow250k"
                    checked={allow250k}
                    disabled={incomeTaxType !== 'EIGHT_PERCENT'}
                    onChange={(e) => setAllow250k(e.target.checked)}
                    className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <label htmlFor="allow250k" className="text-zinc-300 text-xs">
                    Allow ₱250k deduction
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Notes / BIR Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Switched to OSD per Q1 1701Q"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Tax Regime for Year {selectedYear}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
          <span className="text-[11px] text-zinc-500">
            Changes are saved immediately to the entity’s accounting and tax engine.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnualTaxRegimesModal;
