import React, { useState } from 'react';
import { Landmark, Plus, CheckCircle2, Pencil, Trash2, Search, Calendar, Table, X } from 'lucide-react';
import { PPEAsset, Company } from '../types';
import { computePPEDepreciationSchedule } from '../utils/accounting';

interface PPETabProps {
  ppeAssets: PPEAsset[];
  setPpeAssets: React.Dispatch<React.SetStateAction<PPEAsset[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function PPETab({
  ppeAssets,
  setPpeAssets,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch
}: PPETabProps) {
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Office Equipment');
  const [acqDate, setAcqDate] = useState('2026-01-15');
  const [acqCost, setAcqCost] = useState('');
  const [lifeYears, setLifeYears] = useState('5');
  const [salvageVal, setSalvageVal] = useState('0');
  const [measurementModel, setMeasurementModel] = useState<'Cost' | 'Revaluation'>('Cost');
  const [revaluationSurplus, setRevaluationSurplus] = useState('0');
  const [impairmentLoss, setImpairmentLoss] = useState('0');
  const [isHeldForSale, setIsHeldForSale] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCancelEdit = () => {
    setEditingId(null);
    setAssetCode('');
    setAssetName('');
    setAcqCost('');
    setSalvageVal('0');
    setMeasurementModel('Cost');
    setRevaluationSurplus('0');
    setImpairmentLoss('0');
    setIsHeldForSale(false);
    setIsModalOpen(false);
  };

  // Schedule Modal State
  const [selectedScheduleAsset, setSelectedScheduleAsset] = useState<PPEAsset | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('annual');

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert('Please select or create an Entity Profile first in the Entity Profiles tab!', 'error');
      return;
    }
    if (!assetName || !acqCost) {
      triggerAlert('Asset Description and Acquisition Cost are required fields!', 'error');
      return;
    }

    const cost = parseFloat(acqCost) || 0;
    const life = parseFloat(lifeYears) || 5;
    const salvage = parseFloat(salvageVal) || 0;
    const revSurplus = measurementModel === 'Revaluation' ? Math.max(0, parseFloat(revaluationSurplus) || 0) : 0;
    const impLoss = Math.max(0, parseFloat(impairmentLoss) || 0);

    // PAS 16.51 Guardrail: Salvage (residual) value cannot exceed acquisition cost
    if (salvage >= cost && cost > 0) {
      triggerAlert('PAS 16.54 Guardrail: Residual (Salvage) Value equals or exceeds Acquisition Cost. Depreciable amount is ₱0.00.', 'info');
    }

    const depreciableBase = Math.max(0, cost + revSurplus - salvage);
    const annualDep = isHeldForSale ? 0 : Math.round((depreciableBase / life) * 100) / 100;
    const monthlyDep = Math.round((annualDep / 12) * 100) / 100;

    // PAS 16.55 Pro-Rata Time-Apportioned Accumulated Depreciation from acquisition_date to current reporting date
    const acqD = new Date(acqDate || new Date().toISOString().split('T')[0]);
    const nowD = new Date();
    const monthsElapsed = Math.max(
      1,
      (nowD.getFullYear() - acqD.getFullYear()) * 12 + (nowD.getMonth() - acqD.getMonth()) + 1
    );
    const maxMonths = Math.round(life * 12);
    const effectiveMonths = Math.min(monthsElapsed, maxMonths);
    // PFRS 5.25: Cease depreciation while classified as Held for Sale
    const computedAccumDep = isHeldForSale
      ? 0
      : Math.min(depreciableBase, Math.round(monthlyDep * effectiveMonths * 100) / 100);
    const carryingBookValue = Math.max(0, Math.round((cost + revSurplus - computedAccumDep - impLoss) * 100) / 100);

    if (editingId !== null) {
      setPpeAssets(prev => prev.map(a => a.id === editingId ? {
        ...a,
        asset_code: assetCode || `PPE-${Date.now()}`,
        asset_name: assetName.trim(),
        category,
        acquisition_date: acqDate,
        acquisition_cost: cost,
        useful_life_years: life,
        salvage_value: salvage,
        annual_depreciation: annualDep,
        monthly_depreciation: monthlyDep,
        accumulated_depreciation: computedAccumDep,
        book_value: carryingBookValue,
        net_book_value: carryingBookValue,
        measurement_model: measurementModel,
        revaluation_surplus: revSurplus,
        impairment_loss: impLoss,
        is_held_for_sale: isHeldForSale,
        status: isHeldForSale ? 'Held for Sale' : 'Active'
      } : a));
      triggerAlert(`Asset "${assetName}" updated under PAS 16 (${effectiveMonths} mos pro-rata dep: ₱${computedAccumDep.toLocaleString()}).`, 'success');
      setEditingId(null);
    } else {
      const newAsset: PPEAsset = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        asset_code: assetCode || `PPE-2026-${String(ppeAssets.length + 1).padStart(3, '0')}`,
        asset_name: assetName.trim(),
        category,
        acquisition_date: acqDate,
        acquisition_cost: cost,
        useful_life_years: life,
        salvage_value: salvage,
        annual_depreciation: annualDep,
        monthly_depreciation: monthlyDep,
        accumulated_depreciation: computedAccumDep,
        book_value: carryingBookValue,
        net_book_value: carryingBookValue,
        measurement_model: measurementModel,
        revaluation_surplus: revSurplus,
        impairment_loss: impLoss,
        is_held_for_sale: isHeldForSale,
        status: isHeldForSale ? 'Held for Sale' : 'Active'
      };

      setPpeAssets(prev => [...prev, newAsset]);
      triggerAlert(
        isHeldForSale
          ? `Asset "${assetName}" classified as Held for Sale (PFRS 5.25 — Depreciation Frozen).`
          : `Asset "${assetName}" capitalized (PAS 16 Pro-Rata ${effectiveMonths} mos Accum. Dep.: ₱${computedAccumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`,
        'success'
      );
    }

    handleCancelEdit();
  };

  const handleEdit = (asset: PPEAsset) => {
    setEditingId(asset.id);
    setAssetCode(asset.asset_code || '');
    setAssetName(asset.asset_name);
    setCategory(asset.category || 'Office Equipment');
    setAcqDate(asset.acquisition_date);
    setAcqCost(asset.acquisition_cost.toString());
    setLifeYears((asset.useful_life_years || 5).toString());
    setSalvageVal((asset.salvage_value || 0).toString());
    setMeasurementModel(asset.measurement_model || 'Cost');
    setRevaluationSurplus((asset.revaluation_surplus || 0).toString());
    setImpairmentLoss((asset.impairment_loss || 0).toString());
    setIsHeldForSale(Boolean(asset.is_held_for_sale || asset.status === 'Held for Sale'));
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    setPpeAssets(prev => prev.filter(a => a.id !== id));
    if (selectedScheduleAsset && selectedScheduleAsset.id === id) {
      setSelectedScheduleAsset(null);
    }
    triggerAlert(`Asset "${name}" deleted.`, 'info');
  };

  const filteredAssets = ppeAssets.filter(a => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return a.asset_name.toLowerCase().includes(q) ||
      a.asset_code.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* PPE ASSETS REGISTER TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Fixed Assets Register ({filteredAssets.length})</h3>
            <p className={`text-xs ${theme.textMuted}`}>Spreadsheet view of capitalized Property, Plant & Equipment assets and carrying values.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search fixed asset description/code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
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
              <span>Record an Asset</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Asset Code</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Acq Date</th>
                <th className="p-3 text-right">Cost</th>
                <th className="p-3 text-right">Annual Depreciation</th>
                <th className="p-3 text-right">Accumulated Dep.</th>
                <th className="p-3 text-right">Book Value</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    No fixed assets recorded yet. Click "Record an Asset" above to capitalize one.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono font-bold text-cyan-400">{asset.asset_code}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{asset.asset_name}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300">{asset.category}</span></td>
                    <td className="p-3 font-mono text-zinc-300">{asset.acquisition_date}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{asset.acquisition_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-rose-400">₱{asset.annual_depreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-rose-500 font-bold">₱{asset.accumulated_depreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">₱{asset.book_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => {
                            setSelectedScheduleAsset(asset);
                            setScheduleFrequency('annual');
                          }} 
                          title="View Depreciation Table Schedule"
                          className="p-1 px-2.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Table className="w-3 h-3" />
                          <span>Table</span>
                        </button>
                        <button
                          onClick={() => handleEdit(asset)}
                          className={`p-1 px-2 rounded-md border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100' : 'bg-zinc-900 hover:bg-zinc-800'} text-cyan-400 transition cursor-pointer`}
                          title="Edit Asset"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, asset.asset_name)}
                          className="p-1 px-2 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* ADD / EDIT ASSET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-3xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? 'Edit Fixed Asset Record' : 'Capitalize New Fixed Asset'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>Enter asset acquisition details and depreciation parameters.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCancelEdit()}
                className={`p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Asset Code / Tag #</label>
                <input
                  type="text"
                  placeholder="e.g. PPE-2026-001"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Asset Description *</label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro M3 Max 16-inch"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="Office Equipment" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Office Equipment</option>
                  <option value="Computer Hardware" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Computer Hardware</option>
                  <option value="Furniture & Fixtures" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Furniture & Fixtures</option>
                  <option value="Transportation Equipment" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Transportation Equipment</option>
                  <option value="Leasehold Improvements" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Leasehold Improvements</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Acquisition Date</label>
                <input
                  type="date"
                  value={acqDate}
                  onChange={(e) => setAcqDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Acquisition Cost (₱) *</label>
                <input
                  type="number"
                  placeholder="150000"
                  value={acqCost}
                  onChange={(e) => setAcqCost(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Useful Life (Years)</label>
                <input
                  type="number"
                  placeholder="5"
                  value={lifeYears}
                  onChange={(e) => setLifeYears(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Salvage / Residual Value (₱) — PAS 16.51</label>
                <input
                  type="number"
                  placeholder="0"
                  value={salvageVal}
                  onChange={(e) => setSalvageVal(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Measurement Model (PAS 16.29)</label>
                <select
                  value={measurementModel}
                  onChange={(e) => setMeasurementModel(e.target.value as 'Cost' | 'Revaluation')}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="Cost" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cost Model (PAS 16.30)</option>
                  <option value="Revaluation" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Revaluation Model — OCI Surplus (PAS 16.31)</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Revaluation Surplus in OCI (₱) — PAS 16.39</label>
                <input
                  type="number"
                  placeholder="0"
                  disabled={measurementModel !== 'Revaluation'}
                  value={revaluationSurplus}
                  onChange={(e) => setRevaluationSurplus(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono disabled:opacity-40 ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${theme.textMuted}`}>Impairment Write-Down Loss (₱) — PAS 36</label>
                <input
                  type="number"
                  placeholder="0"
                  value={impairmentLoss}
                  onChange={(e) => setImpairmentLoss(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-amber-400">
                  <input
                    type="checkbox"
                    checked={isHeldForSale}
                    onChange={(e) => setIsHeldForSale(e.target.checked)}
                    className="rounded border-amber-500/40"
                  />
                  <span>Classify as Non-Current Asset Held for Sale (PFRS 5.25 — Freezes Depreciation)</span>
                </label>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/40 mt-2">
                <button
                  type="button"
                  onClick={() => handleCancelEdit()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800/40 border border-zinc-700/50 cursor-pointer transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`py-2 px-5 text-xs font-bold rounded-xl text-white transition cursor-pointer flex items-center gap-1.5 shadow-md ${editingId !== null ? 'bg-cyan-600 hover:bg-cyan-500' : theme.accentBg}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingId !== null ? 'Update Asset Record' : 'Capitalize & Save Fixed Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPRECIATION SCHEDULE MODAL */}
      {selectedScheduleAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className={`w-full max-w-3xl p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col`}>
            
            <div className="flex items-center justify-between border-b border-zinc-700/40 pb-3">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className={`text-sm font-bold ${theme.textTitle}`}>
                    Depreciation Table Schedule: {selectedScheduleAsset.asset_name}
                  </h3>
                  <p className={`text-[11px] ${theme.textMuted} font-mono`}>
                    Code: <span className="text-cyan-400 font-bold">{selectedScheduleAsset.asset_code}</span> | Cost: <span className="text-emerald-400 font-bold">₱{selectedScheduleAsset.acquisition_cost.toLocaleString()}</span> | Salvage: ₱{selectedScheduleAsset.salvage_value.toLocaleString()} | Life: {selectedScheduleAsset.useful_life_years} Yrs
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedScheduleAsset(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Frequency Selector */}
            <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/30">
              <span className={`text-xs font-bold ${theme.textTitle} uppercase font-mono`}>Schedule Breakdown Frequency:</span>
              <div className="flex items-center gap-2">
                {(['monthly', 'quarterly', 'annual'] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => setScheduleFrequency(freq)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg uppercase cursor-pointer transition ${
                      scheduleFrequency === freq 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Table */}
            <div className="overflow-y-auto flex-1 border border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#16161a] border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Period</th>
                    <th className="p-2.5 text-right">Beginning Book Value</th>
                    <th className="p-2.5 text-right text-rose-400">Depreciation Expense</th>
                    <th className="p-2.5 text-right text-rose-500">Accumulated Dep.</th>
                    <th className="p-2.5 text-right text-emerald-400">Ending Net Book Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {computePPEDepreciationSchedule(
                    selectedScheduleAsset.acquisition_cost,
                    selectedScheduleAsset.salvage_value,
                    selectedScheduleAsset.useful_life_years,
                    scheduleFrequency
                  ).map((row, idx) => (
                    <tr key={row.period_label || idx} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-2.5 font-bold text-purple-300">{row.period_label}</td>
                      <td className="p-2.5 text-right text-zinc-300">₱{row.beginning_nbv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-bold text-rose-400">₱{row.depreciation_expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right text-rose-500">₱{row.accumulated_depreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">₱{row.ending_nbv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedScheduleAsset(null)}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
              >
                Close Schedule
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
