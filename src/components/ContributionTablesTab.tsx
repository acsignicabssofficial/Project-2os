import React, { useState } from 'react';
import { Table, Save, RotateCcw, Plus, Trash2, ShieldCheck, Heart, Home, FileText, Calculator, AlertCircle } from 'lucide-react';
import { SssBracket, PhilHealthConfig, PagIbigConfig, TaxBracket } from '../types';
import { INITIAL_SSS_TABLE, INITIAL_PHILHEALTH_CONFIG, INITIAL_PAGIBIG_CONFIG, INITIAL_WITHHOLDING_TAX_TABLE } from '../data';
import { computeSssDeduction, computePhilHealthDeduction, computePagIbigDeduction, computeWithholdingTax } from '../utils/statutoryCalc';

interface ContributionTablesTabProps {
  theme: any;
  triggerAlert?: (text: string, type?: 'success' | 'error' | 'info') => void;
  sssBrackets: SssBracket[];
  setSssBrackets: React.Dispatch<React.SetStateAction<SssBracket[]>>;
  philhealthConfig: PhilHealthConfig;
  setPhilhealthConfig: React.Dispatch<React.SetStateAction<PhilHealthConfig>>;
  pagibigConfig: PagIbigConfig;
  setPagibigConfig: React.Dispatch<React.SetStateAction<PagIbigConfig>>;
  taxBrackets: TaxBracket[];
  setTaxBrackets: React.Dispatch<React.SetStateAction<TaxBracket[]>>;
}

export default function ContributionTablesTab({
  theme,
  triggerAlert,
  sssBrackets,
  setSssBrackets,
  philhealthConfig,
  setPhilhealthConfig,
  pagibigConfig,
  setPagibigConfig,
  taxBrackets,
  setTaxBrackets
}: ContributionTablesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sss' | 'phic' | 'hdmf' | 'tax'>('sss');
  const [calcSalary, setCalcSalary] = useState<number>(30000);

  // New SSS Bracket form
  const [newSssMin, setNewSssMin] = useState<string>('');
  const [newSssMax, setNewSssMax] = useState<string>('');
  const [newSssMsc, setNewSssMsc] = useState<string>('');
  const [newSssEe, setNewSssEe] = useState<string>('');
  const [newSssEr, setNewSssEr] = useState<string>('');

  // New Tax Bracket form
  const [newTaxMin, setNewTaxMin] = useState<string>('');
  const [newTaxMax, setNewTaxMax] = useState<string>('');
  const [newTaxBase, setNewTaxBase] = useState<string>('');
  const [newTaxRate, setNewTaxRate] = useState<string>('');

  // Handlers for SSS
  const handleUpdateSss = (id: number, field: keyof SssBracket, val: number) => {
    setSssBrackets(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleAddSssBracket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSssMin || !newSssMax || !newSssEe) {
      if (triggerAlert) triggerAlert('Please complete all required SSS bracket fields.', 'error');
      return;
    }
    const newEntry: SssBracket = {
      id: Date.now(),
      min_salary: Number(newSssMin) || 0,
      max_salary: Number(newSssMax) || 0,
      msc: Number(newSssMsc) || Number(newSssMax) || 0,
      ee_share: Number(newSssEe) || 0,
      er_share: Number(newSssEr) || 0
    };
    setSssBrackets(prev => [...prev, newEntry].sort((a, b) => a.min_salary - b.min_salary));
    setNewSssMin('');
    setNewSssMax('');
    setNewSssMsc('');
    setNewSssEe('');
    setNewSssEr('');
    if (triggerAlert) triggerAlert('New SSS salary bracket added successfully.', 'success');
  };

  const handleDeleteSss = (id: number) => {
    setSssBrackets(prev => prev.filter(b => b.id !== id));
  };

  const handleResetSss = () => {
    setSssBrackets(INITIAL_SSS_TABLE);
    if (triggerAlert) triggerAlert('SSS Contribution Table restored to BIR/SSS standard defaults.', 'info');
  };

  // Handlers for Tax Brackets
  const handleUpdateTax = (id: number, field: keyof TaxBracket, val: any) => {
    setTaxBrackets(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleAddTaxBracket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxMin || !newTaxMax) {
      if (triggerAlert) triggerAlert('Please complete required Income Tax bracket fields.', 'error');
      return;
    }
    const newEntry: TaxBracket = {
      id: Date.now(),
      period: 'Monthly',
      min_income: Number(newTaxMin) || 0,
      max_income: Number(newTaxMax) || 0,
      base_tax: Number(newTaxBase) || 0,
      excess_rate: (Number(newTaxRate) || 0) / 100
    };
    setTaxBrackets(prev => [...prev, newEntry].sort((a, b) => a.min_income - b.min_income));
    setNewTaxMin('');
    setNewTaxMax('');
    setNewTaxBase('');
    setNewTaxRate('');
    if (triggerAlert) triggerAlert('New Income Tax Withholding bracket added.', 'success');
  };

  const handleDeleteTax = (id: number) => {
    setTaxBrackets(prev => prev.filter(t => t.id !== id));
  };

  const handleResetTax = () => {
    setTaxBrackets(INITIAL_WITHHOLDING_TAX_TABLE);
    if (triggerAlert) triggerAlert('Income Tax Table restored to BIR TRAIN Law defaults.', 'info');
  };

  // Preview computations based on current state tables
  const sampleSss = computeSssDeduction(calcSalary, sssBrackets);
  const samplePhic = computePhilHealthDeduction(calcSalary, philhealthConfig);
  const sampleHdmf = computePagIbigDeduction(calcSalary, pagibigConfig);
  const sampleTaxableIncome = Math.max(0, calcSalary - sampleSss - samplePhic - sampleHdmf);
  const sampleTax = computeWithholdingTax(sampleTaxableIncome, taxBrackets);
  const totalSampleDeductions = sampleSss + samplePhic + sampleHdmf + sampleTax;
  const sampleNetTakeHome = calcSalary - totalSampleDeductions;

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Table className="w-6 h-6 text-cyan-400" />
              Statutory Contribution & Tax Tables Management
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Customize official Philippine SSS, PhilHealth, Pag-IBIG, and BIR Income Tax withholding bracket tables used for automatic payroll computations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`p-2.5 px-4 rounded-xl border ${theme.borderCard} ${theme.isLight ? 'bg-slate-100' : 'bg-zinc-800/60'} flex items-center gap-3 text-xs`}>
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-zinc-400">Test Salary Calculator:</span>
              <div className="flex items-center gap-1 font-mono">
                <span>₱</span>
                <input
                  type="number"
                  value={calcSalary}
                  onChange={(e) => setCalcSalary(Number(e.target.value) || 0)}
                  className={`w-28 px-2 py-0.5 rounded border bg-transparent font-bold ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SAMPLE CALCULATION LIVE PREVIEW BANNER */}
        <div className="mt-4 p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">Monthly Salary</span>
            <span className="font-bold text-cyan-300">₱{calcSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">SSS EE Share</span>
            <span className="font-bold text-blue-400">₱{sampleSss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">PhilHealth EE Share</span>
            <span className="font-bold text-emerald-400">₱{samplePhic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">Pag-IBIG EE Share</span>
            <span className="font-bold text-amber-400">₱{sampleHdmf.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">BIR Tax Withheld</span>
            <span className="font-bold text-rose-400">₱{sampleTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-sans">Net Take Home Pay</span>
            <span className="font-extrabold text-emerald-300">₱{sampleNetTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-zinc-700/50 space-x-2">
        <button
          onClick={() => setActiveSubTab('sss')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'sss'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          SSS Contribution Table ({sssBrackets.length} Brackets)
        </button>

        <button
          onClick={() => setActiveSubTab('phic')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'phic'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          PhilHealth Parameters
        </button>

        <button
          onClick={() => setActiveSubTab('hdmf')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'hdmf'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-4 h-4" />
          Pag-IBIG (HDMF) Parameters
        </button>

        <button
          onClick={() => setActiveSubTab('tax')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'tax'
              ? 'border-purple-400 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          BIR Income Tax Brackets ({taxBrackets.length})
        </button>
      </div>

      {/* SUB-TAB CONTENT 1: SSS TABLE */}
      {activeSubTab === 'sss' && (
        <div className="space-y-6">
          <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              <span>You can modify salary ranges or employee shares directly in the table below. Changes apply automatically to payroll.</span>
            </div>
            <button
              onClick={handleResetSss}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset SSS to Standard Table
            </button>
          </div>

          {/* SSS TABLE */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard} font-sans`}>
                    <th className="p-3">Salary Range Min (₱)</th>
                    <th className="p-3">Salary Range Max (₱)</th>
                    <th className="p-3">Monthly Salary Credit (MSC)</th>
                    <th className="p-3 text-right">Employee Share (EE ₱)</th>
                    <th className="p-3 text-right">Employer Share (ER ₱)</th>
                    <th className="p-3 text-center font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {sssBrackets.map((row) => (
                    <tr key={row.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.min_salary}
                          onChange={(e) => handleUpdateSss(row.id, 'min_salary', Number(e.target.value))}
                          className={`w-32 p-1 rounded border bg-transparent text-xs ${theme.borderInput} ${theme.textMain}`}
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.max_salary}
                          onChange={(e) => handleUpdateSss(row.id, 'max_salary', Number(e.target.value))}
                          className={`w-32 p-1 rounded border bg-transparent text-xs ${theme.borderInput} ${theme.textMain}`}
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.msc}
                          onChange={(e) => handleUpdateSss(row.id, 'msc', Number(e.target.value))}
                          className={`w-28 p-1 rounded border bg-transparent text-xs font-bold text-cyan-400 ${theme.borderInput}`}
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={row.ee_share}
                          onChange={(e) => handleUpdateSss(row.id, 'ee_share', Number(e.target.value))}
                          className={`w-28 p-1 rounded border bg-transparent text-xs text-right font-bold text-emerald-400 ${theme.borderInput}`}
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={row.er_share}
                          onChange={(e) => handleUpdateSss(row.id, 'er_share', Number(e.target.value))}
                          className={`w-28 p-1 rounded border bg-transparent text-xs text-right text-zinc-300 ${theme.borderInput}`}
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteSss(row.id)}
                          className="p-1 px-2 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Delete Bracket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD NEW SSS BRACKET FORM */}
          <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl space-y-3`}>
            <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle} flex items-center gap-1.5`}>
              <Plus className="w-4 h-4 text-cyan-400" />
              Add Custom SSS Salary Bracket
            </h3>
            <form onSubmit={handleAddSssBracket} className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Min Salary (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 30000"
                  value={newSssMin}
                  onChange={(e) => setNewSssMin(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Max Salary (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 34999.99"
                  value={newSssMax}
                  onChange={(e) => setNewSssMax(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">MSC (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 35000"
                  value={newSssMsc}
                  onChange={(e) => setNewSssMsc(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">EE Share (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 1575"
                  value={newSssEe}
                  onChange={(e) => setNewSssEe(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">ER Share (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 3325"
                  value={newSssEr}
                  onChange={(e) => setNewSssEr(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`w-full py-2 text-xs font-semibold rounded-lg text-white ${theme.accentBg} cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Bracket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENT 2: PHILHEALTH PARAMETERS */}
      {activeSubTab === 'phic' && (
        <div className="space-y-6">
          <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl space-y-6 max-w-3xl`}>
            <div className="flex items-center justify-between border-b border-zinc-700/50 pb-4">
              <div>
                <h3 className={`font-bold text-sm ${theme.textTitle} flex items-center gap-2`}>
                  <Heart className="w-5 h-5 text-emerald-400" />
                  PhilHealth Contribution Rate & Salary Cap Settings
                </h3>
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                  Adjust statutory percentage rates, floor, and ceiling limits per PhilHealth Circular guidelines.
                </p>
              </div>
              <button
                onClick={() => {
                  setPhilhealthConfig(INITIAL_PHILHEALTH_CONFIG);
                  if (triggerAlert) triggerAlert('PhilHealth parameters restored to standard 5% rate and ₱10k-₱100k limits.', 'info');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Total PhilHealth Premium Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={philhealthConfig.premium_rate * 100}
                    onChange={(e) => setPhilhealthConfig(prev => ({ ...prev, premium_rate: (Number(e.target.value) || 0) / 100 }))}
                    className={`w-full p-2.5 rounded-xl border bg-transparent font-bold text-emerald-400 font-mono ${theme.borderInput}`}
                  />
                  <span className="font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-400">Current statutory total premium rate (e.g. 5.0%)</p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Employee Share Ratio (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={philhealthConfig.ee_share_percent * 100}
                    onChange={(e) => setPhilhealthConfig(prev => ({ ...prev, ee_share_percent: (Number(e.target.value) || 0) / 100 }))}
                    className={`w-full p-2.5 rounded-xl border bg-transparent font-bold text-emerald-400 font-mono ${theme.borderInput}`}
                  />
                  <span className="font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-400">50% share means 2.5% for EE and 2.5% for ER</p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Minimum Monthly Salary Floor (₱)</label>
                <input
                  type="number"
                  value={philhealthConfig.min_monthly_salary}
                  onChange={(e) => setPhilhealthConfig(prev => ({ ...prev, min_monthly_salary: Number(e.target.value) || 0 }))}
                  className={`w-full p-2.5 rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
                <p className="text-[10px] text-zinc-400">Salaries below this threshold pay the minimum floor premium</p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Maximum Monthly Salary Ceiling (₱)</label>
                <input
                  type="number"
                  value={philhealthConfig.max_monthly_salary}
                  onChange={(e) => setPhilhealthConfig(prev => ({ ...prev, max_monthly_salary: Number(e.target.value) || 0 }))}
                  className={`w-full p-2.5 rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
                <p className="text-[10px] text-zinc-400">Salaries above this cap pay the max capped contribution</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5 text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">Formula Summary:</span>
              <p className="text-zinc-300">
                • Capped Salary Basis = Math.min(Math.max(Basic Salary, ₱{philhealthConfig.min_monthly_salary.toLocaleString()}), ₱{philhealthConfig.max_monthly_salary.toLocaleString()})
              </p>
              <p className="text-zinc-300">
                • Employee Monthly Contribution = Capped Salary Basis × {(philhealthConfig.premium_rate * 100).toFixed(1)}% × {(philhealthConfig.ee_share_percent * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENT 3: PAG-IBIG PARAMETERS */}
      {activeSubTab === 'hdmf' && (
        <div className="space-y-6">
          <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl space-y-6 max-w-3xl`}>
            <div className="flex items-center justify-between border-b border-zinc-700/50 pb-4">
              <div>
                <h3 className={`font-bold text-sm ${theme.textTitle} flex items-center gap-2`}>
                  <Home className="w-5 h-5 text-amber-400" />
                  Pag-IBIG (HDMF) Contribution Parameters
                </h3>
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                  Configure HDMF employee rate, max salary basis cap, and mandatory contribution ceiling.
                </p>
              </div>
              <button
                onClick={() => {
                  setPagibigConfig(INITIAL_PAGIBIG_CONFIG);
                  if (triggerAlert) triggerAlert('Pag-IBIG parameters restored to standard 2% rate and ₱200 cap.', 'info');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Employee Contribution Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={pagibigConfig.ee_rate * 100}
                    onChange={(e) => setPagibigConfig(prev => ({ ...prev, ee_rate: (Number(e.target.value) || 0) / 100 }))}
                    className={`w-full p-2.5 rounded-xl border bg-transparent font-bold text-amber-400 font-mono ${theme.borderInput}`}
                  />
                  <span className="font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-400">Standard employee contribution rate (2.0%)</p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-300">Maximum Salary Cap (₱)</label>
                <input
                  type="number"
                  value={pagibigConfig.max_salary_cap}
                  onChange={(e) => setPagibigConfig(prev => ({ ...prev, max_salary_cap: Number(e.target.value) || 0 }))}
                  className={`w-full p-2.5 rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
                <p className="text-[10px] text-zinc-400">Max salary basis used to compute HDMF (e.g. ₱10,000)</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block font-semibold text-zinc-300">Max Monthly Employee Contribution Ceiling (₱)</label>
                <input
                  type="number"
                  value={pagibigConfig.max_ee_contribution}
                  onChange={(e) => setPagibigConfig(prev => ({ ...prev, max_ee_contribution: Number(e.target.value) || 0 }))}
                  className={`w-full p-2.5 rounded-xl border bg-transparent font-bold text-amber-300 font-mono ${theme.borderInput}`}
                />
                <p className="text-[10px] text-zinc-400">Standard max employee contribution cap per month (₱200.00)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider block">Formula Summary:</span>
              <p className="text-zinc-300">
                • Salary Basis = Math.min(Basic Salary, ₱{pagibigConfig.max_salary_cap.toLocaleString()})
              </p>
              <p className="text-zinc-300">
                • Employee Contribution = Math.min(Salary Basis × {(pagibigConfig.ee_rate * 100).toFixed(1)}%, ₱{pagibigConfig.max_ee_contribution.toLocaleString()})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENT 4: BIR INCOME TAX BRACKETS */}
      {activeSubTab === 'tax' && (
        <div className="space-y-6">
          <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <AlertCircle className="w-4 h-4 text-purple-400" />
              <span>BIR TRAIN Law graduated withholding tax brackets. Edit base tax amounts or percentage rates on excess income.</span>
            </div>
            <button
              onClick={handleResetTax}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Tax Table to TRAIN Law Defaults
            </button>
          </div>

          {/* TAX TABLE */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard} font-sans`}>
                    <th className="p-3">Period</th>
                    <th className="p-3">Income Range Min (₱)</th>
                    <th className="p-3">Income Range Max (₱)</th>
                    <th className="p-3 text-right">Base Tax (₱)</th>
                    <th className="p-3 text-right">Rate on Excess (%)</th>
                    <th className="p-3 text-center font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {taxBrackets.map((row) => (
                    <tr key={row.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className="p-2.5 font-bold text-purple-300 font-sans">{row.period}</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.min_income}
                          onChange={(e) => handleUpdateTax(row.id, 'min_income', Number(e.target.value))}
                          className={`w-32 p-1 rounded border bg-transparent text-xs ${theme.borderInput} ${theme.textMain}`}
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.max_income}
                          onChange={(e) => handleUpdateTax(row.id, 'max_income', Number(e.target.value))}
                          className={`w-32 p-1 rounded border bg-transparent text-xs ${theme.borderInput} ${theme.textMain}`}
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={row.base_tax}
                          onChange={(e) => handleUpdateTax(row.id, 'base_tax', Number(e.target.value))}
                          className={`w-28 p-1 rounded border bg-transparent text-xs text-right font-bold text-purple-400 ${theme.borderInput}`}
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={row.excess_rate * 100}
                            onChange={(e) => handleUpdateTax(row.id, 'excess_rate', (Number(e.target.value) || 0) / 100)}
                            className={`w-20 p-1 rounded border bg-transparent text-xs text-right font-bold text-emerald-400 ${theme.borderInput}`}
                          />
                          <span className="font-bold text-zinc-400">%</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteTax(row.id)}
                          className="p-1 px-2 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Delete Tax Bracket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD NEW TAX BRACKET FORM */}
          <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl space-y-3`}>
            <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle} flex items-center gap-1.5`}>
              <Plus className="w-4 h-4 text-purple-400" />
              Add Custom Income Tax Bracket
            </h3>
            <form onSubmit={handleAddTaxBracket} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Min Taxable Income (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 20833.34"
                  value={newTaxMin}
                  onChange={(e) => setNewTaxMin(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Max Taxable Income (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 33333.33"
                  value={newTaxMax}
                  onChange={(e) => setNewTaxMax(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Base Tax (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={newTaxBase}
                  onChange={(e) => setNewTaxBase(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-sans">Rate on Excess (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                  className={`w-full p-2 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`w-full py-2 text-xs font-semibold rounded-lg text-white ${theme.accentBg} cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tax Bracket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
