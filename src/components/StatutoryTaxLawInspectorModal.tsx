import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Receipt
} from 'lucide-react';
import { 
  getAllStatutoryTaxRules, 
  getStatutoryTaxRule, 
  computeGraduatedIndividualTax, 
  computeCorporateTaxRates, 
  getStatutoryPercentageTaxRate,
  getTaxpayerClassification,
  saveCustomTaxLaw,
  deleteCustomTaxLaw
} from '../utils/statutoryTaxEngine';
import { StatutoryTaxRule, CustomTaxLaw } from '../types';

interface StatutoryTaxLawInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  theme?: any;
}

export default function StatutoryTaxLawInspectorModal({
  isOpen,
  onClose,
  initialDate,
  theme
}: StatutoryTaxLawInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'simulator' | 'future_laws'>('timeline');
  const [testDate, setTestDate] = useState<string>(initialDate || new Date().toISOString().slice(0, 10));
  const [testIncome, setTestIncome] = useState<number>(750000);
  const [testSales, setTestSales] = useState<number>(2500000);
  
  // Custom law form state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newLawName, setNewLawName] = useState('');
  const [newLawShortName, setNewLawShortName] = useState('');
  const [newLawCitation, setNewLawCitation] = useState('');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState('2027-01-01');
  const [newEffectiveTo, setNewEffectiveTo] = useState('');
  const [newPercentageRate, setNewPercentageRate] = useState<number>(3);
  const [newRcitRegular, setNewRcitRegular] = useState<number>(20);
  const [newRcitMsme, setNewRcitMsme] = useState<number>(15);
  const [newMcit, setNewMcit] = useState<number>(1);
  const [newVatThreshold, setNewVatThreshold] = useState<number>(3000000);
  const [newFeatures, setNewFeatures] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!isOpen) return null;

  const allRules = getAllStatutoryTaxRules();
  const simulatedRule = getStatutoryTaxRule(testDate);
  const graduatedSim = computeGraduatedIndividualTax(testIncome, testDate);
  const corpSim = computeCorporateTaxRates(testDate);
  const pctSim = getStatutoryPercentageTaxRate(testDate);
  const classSim = getTaxpayerClassification(testSales, testDate);

  const handleCreateCustomLaw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLawName || !newEffectiveFrom) return;

    saveCustomTaxLaw({
      name: newLawName,
      shortName: newLawShortName || newLawName.slice(0, 20),
      citation: newLawCitation || 'Statutory Amendment',
      effectiveFrom: newEffectiveFrom,
      effectiveTo: newEffectiveTo || undefined,
      percentageTaxRate: newPercentageRate,
      rcitRateRegular: newRcitRegular / 100,
      rcitRateMsme: newRcitMsme / 100,
      mcitRate: newMcit / 100,
      vatThreshold: newVatThreshold,
      eightPercentOptionAllowed: true,
      eightPercentExemptionAmount: 250000,
      primaryDocumentType: 'INVOICE',
      microSmallPenaltyReduction: true,
      microExemptionWithholding: true,
      keyFeatures: newFeatures ? newFeatures.split('\n').map(s => s.trim()).filter(Boolean) : ['Custom Tax Law Rule']
    });

    // Reset
    setNewLawName('');
    setNewLawShortName('');
    setNewLawCitation('');
    setNewFeatures('');
    setShowAddCustom(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteCustom = (id: string) => {
    if (confirm('Delete this custom future tax law rule?')) {
      deleteCustomTaxLaw(id);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 text-white">
                Philippine Statutory Tax Law Engine
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  TRAIN · CREATE · EOPT · Future
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Date-based statutory rule resolver ensuring 100% legal consistency across historical, current, and future accounting periods.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Statutory Eras Timeline
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Date Rule Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('future_laws')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'future_laws'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Future Law & Custom Extensibility</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">

          {/* TAB 1: STATUTORY ERAS TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 leading-relaxed">
                <strong>Legal Evolution Architecture:</strong> Philippine tax regulations apply distinct rates, brackets, and documentation rules depending on the exact date of the transaction. The engine guarantees that reconstructing historical records (e.g. 2018–2023) preserves original statutory rules without retroactive breakage.
              </div>

              <div className="space-y-3">
                {allRules.map((rule) => {
                  const isCurrent = !rule.effectiveTo || (rule.effectiveFrom <= new Date().toISOString().slice(0, 10) && rule.effectiveTo >= new Date().toISOString().slice(0, 10));
                  const isRelief = rule.code === 'CREATE_RELIEF';
                  const isEopt = rule.code === 'EOPT';

                  return (
                    <div
                      key={rule.code + rule.effectiveFrom}
                      className={`p-4 rounded-xl border transition ${
                        isCurrent 
                          ? 'border-violet-500/50 bg-slate-800/80 shadow-md ring-1 ring-violet-500/20' 
                          : 'border-slate-800 bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{rule.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {rule.effectiveFrom} {rule.effectiveTo ? `to ${rule.effectiveTo}` : 'to PRESENT'}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500 text-white">
                              ACTIVE ERA
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 italic">
                          {rule.citation}
                        </span>
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Percentage Tax (116)</span>
                          <p className={`text-base font-bold font-mono mt-0.5 ${isRelief ? 'text-amber-400' : 'text-slate-100'}`}>
                            {rule.percentageTaxRate}%
                            {isRelief && <span className="text-[10px] ml-1 font-normal text-amber-300">(COVID Relief)</span>}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Corporate RCIT</span>
                          <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                            {(rule.rcitRateRegular * 100).toFixed(0)}% <span className="text-[11px] text-slate-400 font-normal">/ {(rule.rcitRateMsme * 100).toFixed(0)}% MSME</span>
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">MCIT Rate</span>
                          <p className={`text-base font-bold font-mono mt-0.5 ${isRelief ? 'text-amber-400' : 'text-slate-100'}`}>
                            {(rule.mcitRate * 100).toFixed(0)}%
                            {isRelief && <span className="text-[10px] ml-1 font-normal text-amber-300">(COVID Relief)</span>}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Sales Doc</span>
                          <p className={`text-xs font-bold font-mono mt-1 ${isEopt ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {rule.primaryDocumentType === 'INVOICE' ? 'Invoice (Goods & Services)' : 'Invoice (Goods) / OR (Services)'}
                          </p>
                        </div>
                      </div>

                      {/* Key Legal Features */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Statutory Highlights:</span>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                          {rule.keyFeatures.map((kf, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{kf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE DATE RULE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Simulate Transaction Date
                  </label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => setTestDate('2019-06-15')}
                      className="px-2 py-0.5 text-[9px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      2019 (TRAIN)
                    </button>
                    <button
                      onClick={() => setTestDate('2021-10-15')}
                      className="px-2 py-0.5 text-[9px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      2021 (CREATE 1%)
                    </button>
                    <button
                      onClick={() => setTestDate('2023-08-15')}
                      className="px-2 py-0.5 text-[9px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      2023 (Restored)
                    </button>
                    <button
                      onClick={() => setTestDate('2026-03-15')}
                      className="px-2 py-0.5 text-[9px] rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40"
                    >
                      2026 (EOPT)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Test Annual Taxable Income (₱)
                  </label>
                  <input
                    type="number"
                    value={testIncome}
                    onChange={(e) => setTestIncome(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">For 1701 Individual Graduated bracket check</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Test Annual Gross Sales (₱)
                  </label>
                  <input
                    type="number"
                    value={testSales}
                    onChange={(e) => setTestSales(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">For EOPT Taxpayer Classification check</span>
                </div>
              </div>

              {/* Resolved Statutory Badge */}
              <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Governing Statutory Law For {testDate}</div>
                  <h3 className="text-base font-bold text-white mt-0.5">{simulatedRule.name}</h3>
                  <p className="text-xs text-slate-400 italic mt-0.5">{simulatedRule.citation}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Era: {simulatedRule.code}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Effective: {simulatedRule.effectiveFrom} to {simulatedRule.effectiveTo || 'Present'}
                  </p>
                </div>
              </div>

              {/* Output Simulation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Individual Graduated Tax */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Individual Graduated Tax (1701)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      Eff: {graduatedSim.effectiveRate}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxable Net Income:</span>
                      <span className="font-mono font-bold">₱{testIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Statutory Tax Bracket:</span>
                      <span className="font-mono text-emerald-300 text-[11px]">{graduatedSim.bracketText}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 text-sm font-bold text-emerald-400">
                      <span>Graduated Tax Due:</span>
                      <span className="font-mono">₱{graduatedSim.taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Corporate Income Tax */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-blue-400" />
                      Corporate Tax Rates (1702RT)
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      CIT Rates
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Regular RCIT:</span>
                      <span className="font-mono font-bold text-white">{corpSim.rcitRegularPct}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">MSME Domestic RCIT:</span>
                      <span className="font-mono font-bold text-emerald-400">{corpSim.rcitMsmePct}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">Minimum Corporate Tax (MCIT):</span>
                      <span className={`font-mono font-bold ${corpSim.mcitRate === 0.01 ? 'text-amber-400' : 'text-white'}`}>
                        {corpSim.mcitPct} {corpSim.mcitRate === 0.01 && '(Pandemic Relief)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Percentage Tax (2551Q) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      Section 116 Percentage Tax (2551Q)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pctSim.isReducedRelief ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {pctSim.rate}% Rate
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    <p>{pctSim.explanation}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      *Note: If entity elected 8% Gross Income Tax, 2551Q Percentage Tax is <strong>0% (100% Exempt)</strong>.
                    </p>
                  </div>
                </div>

                {/* 4. EOPT Classification */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <BadgeCheck className="w-4 h-4 text-violet-400" />
                      EOPT Classification & Privileges
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {classSim.label}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bracket:</span>
                      <span className="text-slate-200">{classSim.thresholdDesc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Withholding at Source:</span>
                      <span className={classSim.withholdingExemption ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {classSim.withholdingExemption ? 'EXEMPT (No CWT obligation)' : 'Required Withholding Agent'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">Civil Penalties:</span>
                      <span className={classSim.reducedPenalties ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {classSim.reducedPenalties ? 'Reduced (10% surcharge, 50% interest)' : 'Standard (25% surcharge)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUTURE LAWS & CUSTOM EXTENSIBILITY */}
          {activeTab === 'future_laws' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Extensibility for Future Philippine Tax Reforms</h3>
                  <p className="text-xs text-slate-400">
                    Register upcoming legislative updates (e.g. 2027+ amendments, CREATE MORE, digital tax reforms). New rules take effect strictly based on their configured dates without altering past computations.
                  </p>
                </div>
                {!showAddCustom && (
                  <button
                    onClick={() => setShowAddCustom(true)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-1.5 transition text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Tax Law</span>
                  </button>
                )}
              </div>

              {showAddCustom && (
                <form onSubmit={handleCreateCustomLaw} className="p-4 rounded-xl bg-slate-950 border border-violet-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-violet-300">New Statutory Tax Law Registration</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tax Law Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CREATE MORE Act (RA 12066)"
                        value={newLawName}
                        onChange={(e) => setNewLawName(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Short Badge Label</label>
                      <input
                        type="text"
                        placeholder="e.g. CREATE MORE"
                        value={newLawShortName}
                        onChange={(e) => setNewLawShortName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Effective Date (From)</label>
                      <input
                        type="date"
                        value={newEffectiveFrom}
                        onChange={(e) => setNewEffectiveFrom(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Effective Date (To - Optional)</label>
                      <input
                        type="date"
                        value={newEffectiveTo}
                        onChange={(e) => setNewEffectiveTo(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Section 116 Percentage Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newPercentageRate}
                        onChange={(e) => setNewPercentageRate(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Corporate RCIT Regular (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={newRcitRegular}
                        onChange={(e) => setNewRcitRegular(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Corporate RCIT MSME (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={newRcitMsme}
                        onChange={(e) => setNewRcitMsme(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum Corporate Tax MCIT (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newMcit}
                        onChange={(e) => setNewMcit(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Key Features / Highlights (One per line)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Export enterprise 20% flat tax&#10;Digital withholding deduction mechanism"
                      value={newFeatures}
                      onChange={(e) => setNewFeatures(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Future Statutory Law</span>
                    </button>
                  </div>
                </form>
              )}

              {/* List of Custom Laws */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase">User-Registered Future Laws</span>
                {allRules.filter(r => (r as any).isUserDefined).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    No custom or future statutory laws registered yet. Built-in Philippine tax laws (Pre-TRAIN, TRAIN, CREATE Relief, CREATE Permanent, EOPT) are fully active.
                  </div>
                ) : (
                  allRules
                    .filter(r => (r as any).isUserDefined)
                    .map((customLaw: any) => (
                      <div
                        key={customLaw.id}
                        className="p-3.5 rounded-xl border border-violet-500/30 bg-slate-950 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{customLaw.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300">
                              {customLaw.effectiveFrom} {customLaw.effectiveTo ? `to ${customLaw.effectiveTo}` : 'onwards'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Pct Tax: {customLaw.percentageTaxRate}% · RCIT: {(customLaw.rcitRateRegular * 100).toFixed(0)}% / {(customLaw.rcitRateMsme * 100).toFixed(0)}% · MCIT: {(customLaw.mcitRate * 100).toFixed(0)}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCustom(customLaw.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                          title="Delete custom statutory law"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Complies with BIR Revenue Regulations (RR 8-2018, RR 4-2021, RR 3-2024, RR 8-2024).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
