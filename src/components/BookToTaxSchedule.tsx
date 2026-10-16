import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  FileText, 
  Download, 
  Printer, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  Calendar, 
  Building2, 
  DollarSign, 
  Info, 
  Plus, 
  Trash2, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Company, Sale, Expense, PPEAsset, SpecialEntry, AccountTitle } from '../types';
import { 
  computeBookToTaxReconciliation, 
  BookToTaxSummary, 
  BookToTaxItem, 
  UserReconciliationOverrides 
} from '../utils/bookToTaxEngine';
import { getEntityTaxProfileForYear, getAvailableTaxYears } from '../utils/taxProfiles';
import { getStatutoryTaxRule } from '../utils/statutoryTaxEngine';

interface BookToTaxScheduleProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: (text: string, type?: 'success' | 'error' | 'info') => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export default function BookToTaxSchedule({
  sales,
  expenses,
  ppeAssets,
  specialEntries,
  activeCompany,
  theme,
  triggerAlert,
  selectedYear: propYear,
  onYearChange
}: BookToTaxScheduleProps) {
  // Available chronological tax years
  const availableYears = useMemo(() => {
    return getAvailableTaxYears(activeCompany, [...sales, ...expenses]);
  }, [activeCompany, sales, expenses]);

  const defaultYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState<number>(propYear || defaultYear);

  // Sync if prop changes
  React.useEffect(() => {
    if (propYear && propYear !== currentYear) {
      setCurrentYear(propYear);
    }
  }, [propYear]);

  const handleYearSelect = (yr: number) => {
    setCurrentYear(yr);
    if (onYearChange) onYearChange(yr);
  };

  // Tax Profile for Year (Phase 1)
  const currentProfile = useMemo(() => {
    return getEntityTaxProfileForYear(activeCompany, currentYear);
  }, [activeCompany, currentYear]);

  // Statutory Tax Law for Year (Phase 2)
  const statutoryRule = useMemo(() => {
    return getStatutoryTaxRule(currentYear);
  }, [currentYear]);

  // Overrides state
  const [showOverridePanel, setShowOverridePanel] = useState(false);
  const [showPas12Details, setShowPas12Details] = useState(false);
  
  const [overrideRoaRate, setOverrideRoaRate] = useState<number | undefined>(undefined);
  const [overrideBadDebtsECL, setOverrideBadDebtsECL] = useState<number>(0);
  const [overridePenalties, setOverridePenalties] = useState<number | undefined>(undefined);
  const [overrideDividends, setOverrideDividends] = useState<number>(0);
  const [customItems, setCustomItems] = useState<BookToTaxItem[]>([]);

  // New item draft
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemLegalBasis, setNewItemLegalBasis] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'PERMANENT_ADDITION' | 'TEMPORARY_ADDITION' | 'PERMANENT_DEDUCTION' | 'TEMPORARY_DEDUCTION'>('PERMANENT_ADDITION');
  const [newItemAmount, setNewItemAmount] = useState<number>(0);

  // Compute Reconciliation
  const overrides: UserReconciliationOverrides = useMemo(() => ({
    customEntertainmentCeilingRate: overrideRoaRate,
    customBadDebtsProvision: overrideBadDebtsECL > 0 ? overrideBadDebtsECL : undefined,
    customPenaltiesActual: overridePenalties,
    customTaxExemptDividends: overrideDividends > 0 ? overrideDividends : undefined,
    additionalItems: customItems
  }), [overrideRoaRate, overrideBadDebtsECL, overridePenalties, overrideDividends, customItems]);

  const summary: BookToTaxSummary = useMemo(() => {
    return computeBookToTaxReconciliation(
      sales,
      expenses,
      ppeAssets,
      specialEntries,
      activeCompany,
      currentYear,
      overrides
    );
  }, [sales, expenses, ppeAssets, specialEntries, activeCompany, currentYear, overrides]);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || newItemAmount <= 0) return;

    const isTemp = newItemCategory.startsWith('TEMPORARY');
    const isAdd = newItemCategory.includes('ADDITION');

    const item: BookToTaxItem = {
      id: `custom_${Date.now()}`,
      category: newItemCategory,
      code: 'CUSTOM_RECON',
      title: newItemTitle,
      legalBasis: newItemLegalBasis || 'Management Reconciliation Adjustment',
      accountingAmount: newItemAmount,
      taxAllowableAmount: isAdd ? 0 : newItemAmount,
      reconcilingAdjustment: isAdd ? newItemAmount : -newItemAmount,
      isTemporary: isTemp,
      notes: 'User-specified reconciling adjustment',
      userOverridden: true
    };

    setCustomItems(prev => [...prev, item]);
    setNewItemTitle('');
    setNewItemLegalBasis('');
    setNewItemAmount(0);

    if (triggerAlert) {
      triggerAlert(`Added custom reconciling item: "${item.title}"`, 'success');
    }
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(i => i.id !== id));
  };

  // CSV Export for BIR Form 1701 Schedule 4 / Form 1702-RT Part VI
  const handleExportCSV = () => {
    const rows = [
      ['BOOK-TO-TAX RECONCILIATION SCHEDULE (PFRS / PAS vs. NIRC TAX RULES)'],
      [`Company Name: ${summary.companyName}`],
      [`TIN: ${summary.companyTin}`],
      [`Taxable Year: ${summary.taxYear}`],
      [`Entity Classification: ${summary.entityType} | Profile: ${summary.incomeTaxType} (${summary.expenseDeductionType})`],
      [`Statutory Law Era: ${statutoryRule.name} (${statutoryRule.citation})`],
      [''],
      ['SECTION 1: ACCOUNTING INCOME PER BOOKS (PFRS / PAS ACCRUAL)'],
      ['Line Item', 'Amount (PHP)'],
      ['Gross Sales / Receipts', summary.grossSales.toFixed(2)],
      ['Less: Sales Discounts & Allowances', summary.salesDiscounts.toFixed(2)],
      ['Net Sales', summary.netSales.toFixed(2)],
      ['Less: Cost of Sales / Direct Services', summary.costOfSales.toFixed(2)],
      ['Gross Profit per Books', summary.grossProfit.toFixed(2)],
      ['Less: Operating Expenses (excluding COGS)', (summary.operatingExpenses - summary.depreciationBooks).toFixed(2)],
      ['Less: Depreciation & Amortization (PAS 16)', summary.depreciationBooks.toFixed(2)],
      ['Add: Other Financial Income (Bank Interest, etc.)', summary.otherIncomeBooks.toFixed(2)],
      ['NET INCOME BEFORE INCOME TAX PER BOOKS', summary.netIncomeBeforeTaxBooks.toFixed(2)],
      [''],
      ['SECTION 2: RECONCILING ADDITIONS TO ACCOUNTING INCOME (NON-DEDUCTIBLE EXPENSES)'],
      ['Item Code', 'Description', 'Legal Basis', 'Type', 'Amount (PHP)'],
      ...summary.items
        .filter(i => i.category.includes('ADDITION'))
        .map(i => [
          i.code, 
          `"${i.title.replace(/"/g, '""')}"`, 
          `"${i.legalBasis.replace(/"/g, '""')}"`, 
          i.isTemporary ? 'Temporary' : 'Permanent', 
          i.reconcilingAdjustment.toFixed(2)
        ]),
      ['Total Permanent Additions', '', '', 'Permanent', summary.permanentAdditions.toFixed(2)],
      ['Total Temporary Additions', '', '', 'Temporary', summary.temporaryAdditions.toFixed(2)],
      ['TOTAL TAXABLE ADDITIONS', '', '', '', summary.totalAdditions.toFixed(2)],
      [''],
      ['SECTION 3: RECONCILING DEDUCTIONS FROM ACCOUNTING INCOME (NON-TAXABLE / SUBJECT TO FINAL TAX)'],
      ['Item Code', 'Description', 'Legal Basis', 'Type', 'Amount (PHP)'],
      ...summary.items
        .filter(i => i.category.includes('DEDUCTION'))
        .map(i => [
          i.code, 
          `"${i.title.replace(/"/g, '""')}"`, 
          `"${i.legalBasis.replace(/"/g, '""')}"`, 
          i.isTemporary ? 'Temporary' : 'Permanent', 
          Math.abs(i.reconcilingAdjustment).toFixed(2)
        ]),
      ['Total Permanent Deductions', '', '', 'Permanent', summary.permanentDeductions.toFixed(2)],
      ['Total Temporary Deductions', '', '', 'Temporary', summary.temporaryDeductions.toFixed(2)],
      ['TOTAL NON-TAXABLE DEDUCTIONS', '', '', '', summary.totalDeductions.toFixed(2)],
      [''],
      ['SECTION 4: NET TAXABLE INCOME & TAX LIABILITY (BIR FORM 1701 / 1702)'],
      ['Net Reconciling Difference (Additions - Deductions)', summary.netReconcilingDifference.toFixed(2)],
      ['NET TAXABLE INCOME PER TAX RETURN', summary.netTaxableIncome.toFixed(2)],
      [`Statutory Rate: ${summary.statutoryTaxRateText}`],
      ['Income Tax Due', summary.incomeTaxDue.toFixed(2)],
      ['Less: Creditable Withholding Tax (BIR Form 2307)', summary.creditable2307.toFixed(2)],
      ['NET TAX PAYABLE / (OVERPAYMENT)', summary.netTaxPayable.toFixed(2)],
      [''],
      ['SECTION 5: PAS 12 / PFRS FOR SMES DEFERRED TAX SCHEDULE'],
      ['Deferred Tax Asset (DTA) on Deductible Temporary Differences', summary.deferredTaxAsset.toFixed(2)],
      ['Deferred Tax Liability (DTL) on Taxable Temporary Differences', summary.deferredTaxLiability.toFixed(2)],
      ['NET DEFERRED TAX ASSET / (LIABILITY) ON BALANCE SHEET', summary.netDeferredTax.toFixed(2)]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Book_To_Tax_Reconciliation_${summary.taxYear}_${summary.companyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (triggerAlert) {
      triggerAlert('Book-to-Tax Reconciliation schedule downloaded as CSV.', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METADATA BANNER */}
      <div className={`p-5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-sm transition-all`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <span>Book-to-Tax Reconciliation Sheet</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Phase 3 PFRS vs. NIRC
                  </span>
                </h2>
                <p className={`text-xs ${theme.textMuted}`}>
                  Bridges Economic Net Income per Books (PAS / PFRS) to Statutory Net Taxable Income for BIR Form 1701 & 1702-RT
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Year Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 text-xs font-bold text-white shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-zinc-400 font-medium">Tax Year:</span>
              <select
                value={currentYear}
                onChange={(e) => handleYearSelect(Number(e.target.value))}
                className="bg-transparent text-purple-400 font-bold focus:outline-hidden cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className="bg-zinc-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Adjustments & Overrides Toggle */}
            <button
              onClick={() => setShowOverridePanel(!showOverridePanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                showOverridePanel 
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showOverridePanel ? 'Hide Adjustments' : 'Adjust Reconciling Items'}</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 transition shadow-xs cursor-pointer"
              title="Export official CSV reconciliation schedule"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition shadow-xs cursor-pointer"
              title="Print reconciliation schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Entity & Temporal Regime Badge Strip */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-300 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              {summary.companyName}
            </span>
            <span className="text-zinc-500 font-mono">({summary.companyTin})</span>

            <span className="text-zinc-600">•</span>

            {/* Classification */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {currentProfile.taxpayer_classification || 'MICRO'} Taxpayer
            </span>

            {/* Tax Regime for Current Year */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Year {currentYear}: {currentProfile.income_tax_type === 'EIGHT_PERCENT' ? '8% Gross Income Tax' : `Graduated (${currentProfile.expense_deduction_type === 'OSD_40' ? '40% OSD' : 'Itemized'})`}
            </span>

            {/* Statutory Law Era */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Governed by: {statutoryRule.shortName}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 italic">
            Schedule aligns with BIR Form 1701 Schedule 4 & Form 1702-RT Part VI
          </div>
        </div>
      </div>

      {/* 2. OVERRIDE & ADJUSTMENT SLIDER PANEL */}
      {showOverridePanel && (
        <div className="p-5 rounded-2xl border border-purple-500/40 bg-purple-950/20 backdrop-blur-sm shadow-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-purple-200">
                Interactive Reconciling Overrides & Statutory Limits
              </h3>
            </div>
            <span className="text-xs text-purple-300">
              Changes reflect immediately on the reconciliation bridge
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* ROA Ceiling Rate */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                ROA Ceiling Rate (RR 10-2002)
              </label>
              <select
                value={overrideRoaRate !== undefined ? overrideRoaRate : (summary.isIndividual ? 0.01 : 0.005)}
                onChange={(e) => setOverrideRoaRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-medium focus:border-purple-500 focus:outline-hidden"
              >
                <option value={0.005}>0.50% (Sellers of Goods)</option>
                <option value={0.010}>1.00% (Sellers of Services / Mixed)</option>
              </select>
              <p className="text-[10px] text-zinc-400 mt-1">
                Net Sales: ₱{summary.netSales.toLocaleString()} | Cap: ₱{((overrideRoaRate || (summary.isIndividual ? 0.01 : 0.005)) * summary.netSales).toLocaleString()}
              </p>
            </div>

            {/* Bad Debts ECL Provision (PFRS 9) */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                ECL / Bad Debts Provision (PFRS 9)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={overrideBadDebtsECL}
                onChange={(e) => setOverrideBadDebtsECL(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Creates Deferred Tax Asset (DTA) under PAS 12
              </p>
            </div>

            {/* Surcharges & Penalties */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Tax Penalties & Compromise (Sec. 34(C))
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={overridePenalties !== undefined ? overridePenalties : ''}
                onChange={(e) => setOverridePenalties(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Auto-detected from expenses"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Permanent disallowance (public policy)
              </p>
            </div>

            {/* Tax-Exempt Dividends */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Exempt Intercorporate Dividends (Sec. 27(D)(4))
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={overrideDividends}
                onChange={(e) => setOverrideDividends(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Permanent deduction (100% tax exempt)
              </p>
            </div>
          </div>

          {/* Add Custom Reconciling Item Form */}
          <form onSubmit={handleAddCustomItem} className="pt-3 border-t border-purple-500/20">
            <span className="block text-xs font-bold text-purple-300 mb-2">
              Add Custom Reconciling Line Item:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                placeholder="Item Title (e.g. Disallowed Leasehold Write-off)"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="md:col-span-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-hidden"
                required
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-hidden font-medium"
              >
                <option value="PERMANENT_ADDITION">+ Permanent Addition (Non-deductible)</option>
                <option value="TEMPORARY_ADDITION">+ Temporary Addition (Timing Diff / DTA)</option>
                <option value="PERMANENT_DEDUCTION">- Permanent Deduction (Non-taxable)</option>
                <option value="TEMPORARY_DEDUCTION">- Temporary Deduction (Timing Diff / DTL)</option>
              </select>
              <input
                type="number"
                min="1"
                step="10"
                placeholder="Amount (₱)"
                value={newItemAmount || ''}
                onChange={(e) => setNewItemAmount(Number(e.target.value) || 0)}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono focus:outline-hidden"
                required
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </form>

          {/* Display Custom Items if any */}
          {customItems.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Active Custom Items:</span>
              <div className="mt-1 space-y-1.5">
                {customItems.map(ci => (
                  <div key={ci.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ci.category.includes('ADDITION') ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {ci.category.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-zinc-200">{ci.title}</span>
                      <span className="text-zinc-500 font-mono">₱{ci.accountingAmount.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomItem(ci.id)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CORE 5-KPI BRIDGING SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Books Net Income */}
        <div className={`p-4 rounded-xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Net Income per Books</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-cyan-400">
              ₱{summary.netIncomeBeforeTaxBooks.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
            PFRS / PAS Accrual Accounting
          </div>
        </div>

        {/* Card 2: Reconciling Additions */}
        <div className={`p-4 rounded-xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Taxable Additions (+)</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-amber-400">
              +₱{summary.totalAdditions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
            Perm: ₱{summary.permanentAdditions.toLocaleString()} | Temp: ₱{summary.temporaryAdditions.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Reconciling Deductions */}
        <div className={`p-4 rounded-xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Non-Taxable Deductions (-)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-emerald-400">
              -₱{summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
            Perm: ₱{summary.permanentDeductions.toLocaleString()} | Temp: ₱{summary.temporaryDeductions.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Net Taxable Income */}
        <div className={`p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold mb-1">
              <span>Net Taxable Income</span>
              <Scale className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-purple-300">
              ₱{summary.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-purple-500/30 text-[11px] text-purple-200">
            Per BIR Return (Form 1701 / 1702)
          </div>
        </div>

        {/* Card 5: Tax Due & Payable */}
        <div className={`p-4 rounded-xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
              <span>Net Tax Payable</span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-rose-400">
              ₱{summary.netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
            Tax Due: ₱{summary.incomeTaxDue.toLocaleString()} (Less 2307: ₱{summary.creditable2307.toLocaleString()})
          </div>
        </div>
      </div>

      {/* 4. MAIN RECONCILIATION BRIDGE TABLE */}
      <div className={`rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-sm overflow-hidden`}>
        {/* Table Title Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-zinc-100">
              Complete Book-to-Tax Reconciliation Schedule
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              [Taxable Year {summary.taxYear}]
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-medium hidden sm:block">
            Strict NIRC Sec. 34 Compliance & PAS 12 Deferred Tax Accounting
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-bold tracking-wider text-[10px]">
                <th className="p-3.5">Line Particulars / Reconciling Items</th>
                <th className="p-3.5">Statutory Basis / Accounting Standard</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5 text-right">Amount per Books</th>
                <th className="p-3.5 text-right">Tax Allowable</th>
                <th className="p-3.5 text-right">Reconciling Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {/* --- PART 1: BOOKS SECTION --- */}
              <tr className="bg-zinc-900/50 font-bold text-zinc-300">
                <td colSpan={6} className="p-2.5 px-4 text-cyan-400 uppercase text-[11px] tracking-wide">
                  Part I: Financial Accounting Net Income per Books (PAS / PFRS Accrual)
                </td>
              </tr>
              <tr className="hover:bg-zinc-800/30">
                <td className="p-3 pl-6 font-medium text-zinc-200">Gross Sales / Receipts</td>
                <td className="p-3 text-zinc-400">PFRS 15 Revenue from Contracts</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-zinc-200">₱{summary.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-400">₱{summary.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
              </tr>
              {summary.salesDiscounts > 0 && (
                <tr className="hover:bg-zinc-800/30">
                  <td className="p-3 pl-6 font-medium text-zinc-200">Less: Sales Discounts & Allowances</td>
                  <td className="p-3 text-zinc-400">PFRS 15 Variable Consideration</td>
                  <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                  <td className="p-3 text-right font-mono text-rose-400">-₱{summary.salesDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono text-rose-400">-₱{summary.salesDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
                </tr>
              )}
              <tr className="hover:bg-zinc-800/30 bg-black/10 font-semibold">
                <td className="p-3 pl-6 text-zinc-200">Net Sales</td>
                <td className="p-3 text-zinc-400">Subtotal per Books</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-zinc-100">₱{summary.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-100">₱{summary.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
              </tr>
              <tr className="hover:bg-zinc-800/30">
                <td className="p-3 pl-6 font-medium text-zinc-200">Less: Cost of Sales / Direct Services</td>
                <td className="p-3 text-zinc-400">PAS 2 Inventories / Direct Cost Matching</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-rose-400">-₱{summary.costOfSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-rose-400">-₱{summary.costOfSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
              </tr>
              <tr className="hover:bg-zinc-800/30 bg-black/10 font-semibold">
                <td className="p-3 pl-6 text-zinc-200">Gross Profit</td>
                <td className="p-3 text-zinc-400">Subtotal per Books</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-zinc-100">₱{summary.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-100">₱{summary.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
              </tr>
              <tr className="hover:bg-zinc-800/30">
                <td className="p-3 pl-6 font-medium text-zinc-200">Less: Operating Expenses (excl. COGS & Dep)</td>
                <td className="p-3 text-zinc-400">PAS 1 Presentation of Financial Statements</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-rose-400">-₱{(summary.operatingExpenses - summary.depreciationBooks).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
              </tr>
              <tr className="hover:bg-zinc-800/30">
                <td className="p-3 pl-6 font-medium text-zinc-200">Less: PPE Depreciation (PAS 16)</td>
                <td className="p-3 text-zinc-400">PAS 16 Property, Plant and Equipment</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                <td className="p-3 text-right font-mono text-rose-400">-₱{summary.depreciationBooks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-rose-400">-₱{summary.depreciationBooks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono text-zinc-500">₱0.00</td>
              </tr>
              {summary.otherIncomeBooks > 0 && (
                <tr className="hover:bg-zinc-800/30">
                  <td className="p-3 pl-6 font-medium text-zinc-200">Add: Other Financial Income (Interest, etc.)</td>
                  <td className="p-3 text-zinc-400">PFRS 9 Financial Instruments</td>
                  <td className="p-3"><span className="text-zinc-500 font-mono">—</span></td>
                  <td className="p-3 text-right font-mono text-emerald-400">+₱{summary.otherIncomeBooks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono text-zinc-400">₱0.00</td>
                  <td className="p-3 text-right font-mono text-zinc-400">—</td>
                </tr>
              )}
              <tr className="bg-cyan-950/20 font-bold border-t-2 border-cyan-500/40 text-cyan-300">
                <td className="p-3.5 pl-6 text-sm">NET INCOME BEFORE TAX PER BOOKS (PFRS)</td>
                <td className="p-3.5 text-zinc-400 font-normal">Economic Accounting Baseline</td>
                <td className="p-3.5"><span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">PFRS Baseline</span></td>
                <td className="p-3.5 text-right font-mono text-sm font-bold text-cyan-300">₱{summary.netIncomeBeforeTaxBooks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3.5 text-right font-mono text-zinc-400">—</td>
                <td className="p-3.5 text-right font-mono text-cyan-300">₱{summary.netIncomeBeforeTaxBooks.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>

              {/* --- PART 2: TAXABLE ADDITIONS --- */}
              <tr className="bg-zinc-900/50 font-bold text-zinc-300">
                <td colSpan={6} className="p-2.5 px-4 text-amber-400 uppercase text-[11px] tracking-wide">
                  Part II: Reconciling Additions to Accounting Income (Non-Deductible Expenses per NIRC)
                </td>
              </tr>
              {summary.items.filter(i => i.category.includes('ADDITION')).map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30">
                  <td className="p-3 pl-6">
                    <div className="font-semibold text-zinc-100">{item.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{item.notes}</div>
                  </td>
                  <td className="p-3 text-zinc-400 font-mono text-[11px]">{item.legalBasis}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.isTemporary 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.isTemporary ? 'Temporary (DTA)' : 'Permanent'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-300">₱{item.accountingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono text-zinc-400">₱{item.taxAllowableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">
                    +₱{item.reconcilingAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-950/20 font-bold border-t border-amber-500/30 text-amber-300">
                <td colSpan={3} className="p-3 pl-6">TOTAL TAXABLE ADDITIONS TO INCOME</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-sm font-bold text-amber-400">
                  +₱{summary.totalAdditions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* --- PART 3: NON-TAXABLE DEDUCTIONS --- */}
              <tr className="bg-zinc-900/50 font-bold text-zinc-300">
                <td colSpan={6} className="p-2.5 px-4 text-emerald-400 uppercase text-[11px] tracking-wide">
                  Part III: Reconciling Deductions from Accounting Income (Non-Taxable & Final-Taxed Items)
                </td>
              </tr>
              {summary.items.filter(i => i.category.includes('DEDUCTION')).map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30">
                  <td className="p-3 pl-6">
                    <div className="font-semibold text-zinc-100">{item.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{item.notes}</div>
                  </td>
                  <td className="p-3 text-zinc-400 font-mono text-[11px]">{item.legalBasis}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.isTemporary 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.isTemporary ? 'Temporary (DTL)' : 'Permanent'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-300">₱{item.accountingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono text-zinc-400">₱{item.taxAllowableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    -₱{Math.abs(item.reconcilingAdjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-950/20 font-bold border-t border-emerald-500/30 text-emerald-300">
                <td colSpan={3} className="p-3 pl-6">TOTAL NON-TAXABLE DEDUCTIONS FROM INCOME</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-sm font-bold text-emerald-400">
                  -₱{summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* --- PART 4: NET TAXABLE INCOME BRIDGE --- */}
              <tr className="bg-purple-950/30 font-bold border-t-2 border-purple-500/60 text-purple-200">
                <td colSpan={3} className="p-4 pl-6 text-sm">
                  <div className="font-bold text-purple-300 uppercase tracking-wide">
                    NET TAXABLE INCOME (BIR FORM 1701 / 1702)
                  </div>
                  <div className="text-[11px] text-purple-400 font-normal mt-0.5">
                    = Net Income per Books (₱{summary.netIncomeBeforeTaxBooks.toLocaleString()}) + Additions (₱{summary.totalAdditions.toLocaleString()}) - Deductions (₱{summary.totalDeductions.toLocaleString()})
                  </div>
                </td>
                <td className="p-4 text-right font-mono text-zinc-400">—</td>
                <td className="p-4 text-right font-mono text-zinc-400">—</td>
                <td className="p-4 text-right font-mono text-base font-extrabold text-purple-300">
                  ₱{summary.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Tax Computation Details */}
              <tr className="hover:bg-zinc-800/30 bg-black/20 text-xs">
                <td className="p-3 pl-6 font-medium text-zinc-300">
                  Statutory Income Tax Due
                </td>
                <td className="p-3 text-zinc-400">{summary.statutoryTaxRateText}</td>
                <td className="p-3"><span className="text-zinc-500 font-mono">Effective: {summary.effectiveTaxRate}%</span></td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono text-zinc-400">—</td>
                <td className="p-3 text-right font-mono font-bold text-zinc-200">
                  ₱{summary.incomeTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {summary.creditable2307 > 0 && (
                <tr className="hover:bg-zinc-800/30 bg-black/20 text-xs">
                  <td className="p-3 pl-6 font-medium text-zinc-300">
                    Less: Creditable Withholding Tax (BIR Form 2307 Certificates)
                  </td>
                  <td className="p-3 text-zinc-400">NIRC Sec. 58 / RR 2-98 as amended</td>
                  <td className="p-3"><span className="text-emerald-400 font-bold">Tax Credit</span></td>
                  <td className="p-3 text-right font-mono text-zinc-400">—</td>
                  <td className="p-3 text-right font-mono text-zinc-400">—</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    -₱{summary.creditable2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr className="bg-rose-950/20 font-bold border-t border-rose-500/30 text-rose-300">
                <td colSpan={3} className="p-3.5 pl-6 text-sm">
                  NET INCOME TAX PAYABLE / (REFUNDABLE OVERPAYMENT)
                </td>
                <td className="p-3.5 text-right font-mono text-zinc-400">—</td>
                <td className="p-3.5 text-right font-mono text-zinc-400">—</td>
                <td className="p-3.5 text-right font-mono text-sm font-extrabold text-rose-300">
                  ₱{summary.netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PAS 12 / PFRS DEFERRED TAX SCHEDULE ACCORDION */}
      <div className={`rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-sm overflow-hidden`}>
        <button
          onClick={() => setShowPas12Details(!showPas12Details)}
          className="w-full p-4 flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-800/60 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <span>PAS 12 / PFRS for Small Entities & SMEs: Deferred Tax Position</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Financial Statement Presentation
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Separation of Permanent vs. Timing (Temporary) Differences for Balance Sheet Accounting
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-300 hidden sm:inline">
              Net DTA / (DTL): ₱{summary.netDeferredTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            {showPas12Details ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </div>
        </button>

        {showPas12Details && (
          <div className="p-5 border-t border-zinc-800 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DTA Card */}
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20">
                <span className="text-zinc-400 font-semibold block mb-1">Deferred Tax Asset (DTA)</span>
                <div className="text-lg font-bold font-mono text-blue-400">
                  ₱{summary.deferredTaxAsset.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Derived from deductible temporary additions (e.g. Bad debts provisions: ₱{summary.temporaryAdditions.toLocaleString()})
                </div>
              </div>

              {/* DTL Card */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <span className="text-zinc-400 font-semibold block mb-1">Deferred Tax Liability (DTL)</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  ₱{summary.deferredTaxLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Derived from taxable temporary differences (₱{summary.temporaryDeductions.toLocaleString()})
                </div>
              </div>

              {/* Net Deferred Tax Card */}
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20">
                <span className="text-zinc-400 font-semibold block mb-1">Net Balance Sheet Impact</span>
                <div className="text-lg font-bold font-mono text-purple-300">
                  {summary.netDeferredTax >= 0 ? '+' : ''}₱{summary.netDeferredTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-purple-200 mt-1">
                  {summary.netDeferredTax >= 0 ? 'Non-current Asset (Net DTA)' : 'Non-current Liability (Net DTL)'}
                </div>
              </div>
            </div>

            {/* Explanatory Note on Temporary vs. Permanent Differences */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 leading-relaxed text-xs">
              <div className="font-bold text-zinc-100 mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Accounting Theory Note (PAS 12 vs. NIRC):
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                <li>
                  <strong className="text-zinc-300">Permanent Differences:</strong> Items such as Excess Entertainment (RR 10-2002), Surcharges & Penalties (Sec. 34(C)), and Tax-Exempt Dividends (Sec. 27(D)(4)) never reverse in future periods. They permanently increase or decrease the effective tax rate.
                </li>
                <li>
                  <strong className="text-zinc-300">Temporary Differences:</strong> Items such as Bad Debts provisions (PFRS 9) are not yet deductible under NIRC Sec. 34(E) because BIR requires an actual substantiated write-off. When the uncollectible debt is formally written off in a future year, the deduction reverses, giving rise to a <strong>Deferred Tax Asset</strong> today.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
