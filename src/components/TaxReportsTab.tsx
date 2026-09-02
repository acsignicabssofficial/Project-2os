import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  Building2, 
  Trash2, 
  Scale,
  FileText,
  FileSpreadsheet,
  FileCheck,
  Printer,
  ChevronDown
} from 'lucide-react';
import { 
  Company, 
  Sale, 
  Expense, 
  PPEAsset, 
  SpecialEntry, 
  IncomeTaxRecord, 
  AccountTitle 
} from '../types';
import { computeIncomeTaxEngine } from '../utils/accounting';

interface TaxReportsTabProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  incomeTaxRecords: IncomeTaxRecord[];
  setIncomeTaxRecords: React.Dispatch<React.SetStateAction<IncomeTaxRecord[]>>;
  setSpecialEntries: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  activeCompany: Company | null;
  accountTitles: AccountTitle[];
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TaxReportsTab({
  sales = [],
  expenses = [],
  ppeAssets = [],
  specialEntries = [],
  incomeTaxRecords = [],
  setIncomeTaxRecords,
  setSpecialEntries,
  activeCompany,
  accountTitles = [],
  theme,
  triggerAlert
}: TaxReportsTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';
  const companyTin = activeCompany?.company_tin || '000-000-000-00000';
  const rawEntityType = activeCompany?.entity_type || 'CORPORATION';

  // Active Tax Report Form Subtab
  const [activeFormTab, setActiveFormTab] = useState<'1701_1702' | '2550Q' | '1601EQ'>('1701_1702');

  // Normalize entity default
  const defaultEntity = rawEntityType.toUpperCase().includes('SOLE') || rawEntityType.toUpperCase().includes('INDIVIDUAL') || rawEntityType.toUpperCase().includes('PROFESSIONAL')
    ? 'SOLE PROPRIETOR'
    : rawEntityType.toUpperCase().includes('PARTNER')
    ? 'PARTNERSHIP'
    : 'CORPORATION';

  const [entityType, setEntityType] = useState<string>(defaultEntity);
  const [taxRegime, setTaxRegime] = useState<string>(
    defaultEntity === 'SOLE PROPRIETOR' ? 'Graduated Tax Table' : 'RCIT 20% (Small Corp)'
  );
  const [deductionMethod, setDeductionMethod] = useState<'Itemized' | 'OSD 40%'>('Itemized');
  const [quarterlyPayments, setQuarterlyPayments] = useState<string>('0');
  const [taxPeriod, setTaxPeriod] = useState<string>('Q1 2026');
  const [taxYear, setTaxYear] = useState<string>('2026');

  // 1. Calculate Books Income Up To Net Income Before Tax
  const booksData = useMemo(() => {
    // Gross sales revenue
    let grossSales = sales.reduce((sum, s) => sum + (Number(s.vatable_sales) || 0) + (Number(s.zero_rated) || 0) + (Number(s.vat_exempt) || 0), 0);
    
    // Total itemized expenses
    let itemizedExpenses = expenses.reduce((sum, e) => 
      sum + (Number(e.vatable_expense) || 0) + (Number(e.zero_rated) || 0) + (Number(e.vat_exempt) || 0), 0);

    // Add PPE Depreciation
    const ppeDepreciation = ppeAssets.reduce((sum, a) => sum + (Number(a.accumulated_depreciation) || 0), 0);
    itemizedExpenses += ppeDepreciation;

    // Adjust for Special Entries (excluding existing Income Tax Expense lines #7010 to avoid self-referential loop)
    specialEntries.forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.account_code.startsWith('4')) {
          if (l.type === 'Credit') grossSales += amt;
          else grossSales -= amt;
        } else if ((l.account_code.startsWith('5') || l.account_code.startsWith('6')) && l.account_code !== '7010') {
          if (l.type === 'Debit') itemizedExpenses += amt;
          else itemizedExpenses -= amt;
        }
      });
    });

    // Creditable Withholding Tax (2307)
    const creditable2307 = sales.reduce((sum, s) => sum + (Number(s.less_withholding_tax) || 0), 0);

    const netIncomeBeforeTax = grossSales - itemizedExpenses;

    return {
      grossSales,
      itemizedExpenses,
      netIncomeBeforeTax,
      creditable2307
    };
  }, [sales, expenses, ppeAssets, specialEntries]);

  // 2. Compute Tax using Logic Engine
  const taxCalculation = useMemo(() => {
    return computeIncomeTaxEngine({
      entity_type: entityType,
      tax_regime: taxRegime,
      deduction_method: deductionMethod,
      gross_sales: booksData.grossSales,
      itemized_expenses: booksData.itemizedExpenses,
      creditable_tax_2307: booksData.creditable2307,
      quarterly_tax_payments: parseFloat(quarterlyPayments) || 0
    });
  }, [entityType, taxRegime, deductionMethod, booksData, quarterlyPayments]);

  // 3. Compute 2550Q Quarterly VAT Return Data
  const vat2550QData = useMemo(() => {
    const vatableSales = sales.reduce((sum, s) => sum + (Number(s.vatable_sales) || 0), 0);
    const zeroRatedSales = sales.reduce((sum, s) => sum + (Number(s.zero_rated) || 0), 0);
    const exemptSales = sales.reduce((sum, s) => sum + (Number(s.vat_exempt) || 0), 0);
    const totalSales = vatableSales + zeroRatedSales + exemptSales;
    const outputVat = sales.reduce((sum, s) => sum + (Number(s.vat) || 0), 0);

    // Uncollected receivables output vat adjustment
    const uncollectedVat = sales.filter(s => s.collection_status !== 'Paid').reduce((sum, s) => sum + (Number(s.vat) || 0), 0);
    const adjustedOutputVat = Math.max(0, outputVat - uncollectedVat);

    // Input Tax
    const domesticPurchases = expenses.reduce((sum, e) => sum + (Number(e.vatable_expense) || 0), 0);
    const inputVat = expenses.reduce((sum, e) => sum + (Number(e.vat) || 0), 0);

    const netVatPayable = Math.max(0, adjustedOutputVat - inputVat);
    const excessInputTax = Math.max(0, inputVat - adjustedOutputVat);

    return {
      vatableSales,
      zeroRatedSales,
      exemptSales,
      totalSales,
      outputVat,
      uncollectedVat,
      adjustedOutputVat,
      domesticPurchases,
      inputVat,
      netVatPayable,
      excessInputTax
    };
  }, [sales, expenses]);

  // 4. Post / Save Income Tax Transaction as Special Journal Entry
  const handleRecordIncomeTax = () => {
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first in the Companies tab!', 'error');
      return;
    }

    if (taxCalculation.computed_tax_due <= 0) {
      triggerAlert('Computed income tax due is ₱0.00. No tax provision needed to be posted.', 'info');
      return;
    }

    const confirmMsg = `Do you want to record / save the Income Tax Provision of ₱${taxCalculation.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })} to your official books?\n\nThis will generate a Special Journal Entry:\n• Debit: Provision for Income Tax Expense (#7010) ₱${taxCalculation.computed_tax_due.toLocaleString()}\n• Credit: Income Tax Payable (#2040) ₱${taxCalculation.computed_tax_due.toLocaleString()}\n\nThis will update Net Income After Tax in your financial statements and keep SFP 100% balanced.`;

    if (window.confirm(confirmMsg)) {
      const vNo = `TAX-PROV-${Date.now().toString().slice(-4)}`;

      // Create Special Entry
      const taxSpecialEntry: SpecialEntry = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        entry_number: vNo,
        voucher_no: vNo,
        entry_date: new Date().toISOString().split('T')[0],
        entry_type: 'Income Tax Provision',
        description: `Income Tax Provision (${taxPeriod}) - ${entityType} under ${taxRegime}`,
        lines: [
          {
            id: '1',
            type: 'Debit',
            account_code: '7010',
            account_title: 'Provision for Income Tax Expense',
            amount: taxCalculation.computed_tax_due
          },
          {
            id: '2',
            type: 'Credit',
            account_code: '2040',
            account_title: 'Income Tax Payable (BIR 1702/1701)',
            amount: taxCalculation.computed_tax_due
          }
        ]
      };

      setSpecialEntries(prev => [taxSpecialEntry, ...prev]);

      // Save Tax Record
      const newRecord: IncomeTaxRecord = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        tax_year: parseInt(taxYear) || new Date().getFullYear(),
        period: taxPeriod,
        entity_type: entityType,
        tax_regime: taxRegime,
        deduction_method: deductionMethod,
        gross_income: taxCalculation.gross_income,
        allowable_deductions: taxCalculation.allowable_deductions,
        taxable_income: taxCalculation.taxable_income,
        computed_tax_due: taxCalculation.computed_tax_due,
        less_creditable_tax_2307: booksData.creditable2307,
        less_quarterly_tax_payments: parseFloat(quarterlyPayments) || 0,
        net_tax_payable: taxCalculation.net_tax_payable,
        is_posted: true,
        posted_entry_no: vNo,
        created_at: new Date().toISOString().split('T')[0]
      };

      setIncomeTaxRecords(prev => [newRecord, ...prev]);

      triggerAlert(`Income Tax Provision #${vNo} posted! SFP & Financial Statements updated to Net Income After Tax.`, 'success');
    }
  };

  const handleDeleteTaxRecord = (id: number, entryNo?: string) => {
    if (window.confirm('Are you sure you want to remove this Income Tax Record?')) {
      setIncomeTaxRecords(prev => prev.filter(r => r.id !== id));
      if (entryNo) {
        setSpecialEntries(prev => prev.filter(s => s.voucher_no !== entryNo));
      }
      triggerAlert('Income tax record and matching journal entry removed.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
              BIR Official Tax Reports Suite
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Generate BIR Forms 1701Q/1702Q (Income Tax Return), 2550Q (VAT Return), and 1601-EQ directly from your transaction ledgers.
            </p>
          </div>

          {/* Form Selector Sub-navigation */}
          <div className="flex items-center gap-2 bg-zinc-800/40 p-1.5 rounded-xl border border-zinc-700/30">
            <button
              onClick={() => setActiveFormTab('1701_1702')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                activeFormTab === '1701_1702' ? 'bg-cyan-600 text-white shadow-sm' : `${theme.textMuted} hover:text-white`
              }`}
            >
              BIR 1701Q / 1702Q (Income Tax)
            </button>
            <button
              onClick={() => setActiveFormTab('2550Q')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                activeFormTab === '2550Q' ? 'bg-cyan-600 text-white shadow-sm' : `${theme.textMuted} hover:text-white`
              }`}
            >
              BIR 2550Q (Value-Added Tax)
            </button>
            <button
              onClick={() => setActiveFormTab('1601EQ')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                activeFormTab === '1601EQ' ? 'bg-cyan-600 text-white shadow-sm' : `${theme.textMuted} hover:text-white`
              }`}
            >
              BIR 1601-EQ (Withholding Tax)
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- SUBTAB 1: BIR FORM 1701Q / 1702Q ----------------- */}
      {activeFormTab === '1701_1702' && (
        <div className="space-y-6">
          {/* Configuration Banner */}
          <div className={`p-5 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end`}>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Taxable Quarter / Year</label>
              <input
                type="text"
                value={taxPeriod}
                onChange={(e) => setTaxPeriod(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Entity Classification</label>
              <select
                value={entityType}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntityType(val);
                  setTaxRegime(val === 'SOLE PROPRIETOR' ? 'Graduated Tax Table' : 'RCIT 20% (Small Corp)');
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="SOLE PROPRIETOR" className="text-zinc-900 bg-white">Sole Proprietor / Individual</option>
                <option value="PARTNERSHIP" className="text-zinc-900 bg-white">Partnership</option>
                <option value="CORPORATION" className="text-zinc-900 bg-white">Corporation (CREATE Act)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Tax Regime</label>
              <select
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                {entityType === 'SOLE PROPRIETOR' ? (
                  <>
                    <option value="Graduated Tax Table" className="text-zinc-900 bg-white">Graduated IT Rate (TRAIN Table)</option>
                    <option value="8% Flat Tax" className="text-zinc-900 bg-white">8% Flat Income Tax Rate</option>
                  </>
                ) : (
                  <>
                    <option value="RCIT 20% (Small Corp)" className="text-zinc-900 bg-white">RCIT 20% (Micro/Small Corp)</option>
                    <option value="RCIT 25%" className="text-zinc-900 bg-white">RCIT 25% Regular Corporate Tax</option>
                    <option value="MCIT 2%" className="text-zinc-900 bg-white">MCIT 2% Minimum Corp Tax</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Deduction Method</label>
              <select
                value={deductionMethod}
                onChange={(e) => setDeductionMethod(e.target.value as any)}
                disabled={taxRegime === '8% Flat Tax'}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Itemized" className="text-zinc-900 bg-white">Itemized Deductions</option>
                <option value="OSD 40%" className="text-zinc-900 bg-white">OSD 40% (Optional Standard)</option>
              </select>
            </div>

            <button
              onClick={handleRecordIncomeTax}
              className={`py-2 px-4 rounded-lg font-bold text-xs text-white transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${theme.accentBg}`}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Record & Post Tax Entry</span>
            </button>
          </div>

          {/* OFFICIAL BIR FORM 1701Q / 1702Q SCHEDULE LAYOUT */}
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 shadow-md font-mono text-xs space-y-6">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold uppercase font-sans tracking-wide">
                  BIR Form No. {entityType === 'SOLE PROPRIETOR' ? '1701Q' : '1702Q'} - PART V Computation of Tax Due
                </h3>
                <p className="text-[11px] text-slate-600 font-sans">
                  Quarterly Income Tax Return for {companyName} (TIN: {companyTin})
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-slate-800 text-[11px]">
                {taxPeriod} • {entityType}
              </span>
            </div>

            {/* SCHEDULE 1 / SCHEDULE II SCHEMATIC - 8% FLAT vs GRADUATED/CORPORATE */}
            {taxRegime === '8% Flat Tax' ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold text-xs uppercase font-sans">
                  Schedule II - For 8% IT Rate (Self-Employed / Professionals)
                </div>
                <div className="p-3 space-y-2 bg-slate-50 divide-y divide-slate-200">
                  <div className="flex justify-between pt-1">
                    <span>47 Sales/Revenues/Receipts/Fees (net of sales returns and discounts)</span>
                    <span className="font-bold">₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-600">
                    <span>48 Add: Non-Operating Income</span>
                    <span>₱0.00</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold">
                    <span>49 Total Income for the quarter (Sum of Items 47 & 48)</span>
                    <span>₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-600">
                    <span>50 Add: Total Taxable Income Previous Quarter/s</span>
                    <span>₱0.00</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-blue-900">
                    <span>51 Cumulative Taxable Income As of This Quarter</span>
                    <span>₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-emerald-800 font-semibold">
                    <span>52 Less: Allowable reduction for purely self-employed/professionals</span>
                    <span>(₱250,000.00)</span>
                  </div>
                  <div className="flex justify-between pt-1 font-extrabold text-slate-900 bg-amber-100 p-1.5 rounded">
                    <span>53 Taxable Income To Date (Item 51 Less Item 52)</span>
                    <span>₱{taxCalculation.taxable_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-extrabold text-blue-900 bg-blue-100 p-1.5 rounded text-sm">
                    <span>54 Tax Due (Item 53 x 8% Tax Rate)</span>
                    <span>₱{taxCalculation.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold text-xs uppercase font-sans">
                  Schedule I - Declaration This Quarter - Regular / Normal Rate ({taxRegime})
                </div>
                <div className="p-3 space-y-2 bg-slate-50 divide-y divide-slate-200">
                  <div className="flex justify-between pt-1">
                    <span>1 Sales/Receipts/Revenues/Fees</span>
                    <span className="font-bold">₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-600">
                    <span>2 Less: Cost of Sales/Services</span>
                    <span>₱0.00</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold">
                    <span>3 Gross Income from Operation (Item 1 Less Item 2)</span>
                    <span>₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-semibold text-rose-800">
                    <span>6 Less: Total Allowable Deductions ({deductionMethod})</span>
                    <span>(₱{taxCalculation.allowable_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                  <div className="flex justify-between pt-1 font-extrabold text-slate-900 bg-amber-100 p-1.5 rounded">
                    <span>7 Taxable Income This Quarter (Item 3 Less Item 6)</span>
                    <span>₱{taxCalculation.taxable_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>10 Applicable Income Tax Rate</span>
                    <span className="font-bold">{taxRegime}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-extrabold text-blue-900 bg-blue-100 p-1.5 rounded text-sm">
                    <span>11/13 Income Tax Due</span>
                    <span>₱{taxCalculation.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDULE III / SCHEDULE 4 - TAX CREDITS & PAYMENTS */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-800 text-white px-3 py-2 font-bold text-xs uppercase font-sans">
                Schedule III / Schedule 4 - Tax Credits / Payments
              </div>
              <div className="p-3 space-y-2 bg-slate-50 divide-y divide-slate-200">
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>55/1 Prior Year's Excess Credits</span>
                  <span>₱0.00</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>56/2 Tax Payment/s for Previous Quarter/s</span>
                  <span>₱{(parseFloat(quarterlyPayments) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>58/5 Creditable Tax Withheld per BIR Form No. 2307 for this Quarter</span>
                  <span className="font-bold text-emerald-700">₱{booksData.creditable2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-slate-900 border-t-2 border-slate-400">
                  <span>62 Total Tax Credits/Payments</span>
                  <span>₱{(booksData.creditable2307 + (parseFloat(quarterlyPayments) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 font-extrabold text-base bg-emerald-100 text-emerald-900 p-2 rounded">
                  <span>63 NET TAX PAYABLE / (OVERPAYMENT)</span>
                  <span>₱{Math.abs(taxCalculation.net_tax_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 2: BIR FORM 2550Q ----------------- */}
      {activeFormTab === '2550Q' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 shadow-md font-mono text-xs space-y-6">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold uppercase font-sans tracking-wide">
                  BIR Form No. 2550Q - Quarterly Value-Added Tax Return
                </h3>
                <p className="text-[11px] text-slate-600 font-sans">
                  Part IV Details of VAT Computation for {companyName} (TIN: {companyTin})
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-slate-800 text-[11px]">
                {taxPeriod} • VATABLE (12%)
              </span>
            </div>

            {/* PART IV - DETAILS OF VAT COMPUTATION */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-3 py-2 font-bold text-xs uppercase font-sans">
                Part IV - Details of VAT Computation
              </div>
              <div className="p-3 space-y-2 bg-slate-50 divide-y divide-slate-200">
                <div className="flex justify-between pt-1">
                  <span>31 VATable Sales</span>
                  <span className="font-bold">₱{vat2550QData.vatableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>32 Zero-Rated Sales</span>
                  <span>₱{vat2550QData.zeroRatedSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>33 Exempt Sales</span>
                  <span>₱{vat2550QData.exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-blue-900 bg-blue-50 p-1.5 rounded">
                  <span>34 Total Sales and Output Tax Due</span>
                  <span>₱{vat2550QData.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span>35 Less: Output VAT on Uncollected Receivables</span>
                  <span>(₱{vat2550QData.uncollectedVat.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-slate-900 bg-amber-100 p-1.5 rounded">
                  <span>37 Total Adjusted Output Tax Due</span>
                  <span>₱{vat2550QData.adjustedOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-3 font-bold uppercase font-sans text-slate-800">
                  Current Purchases & Input Tax:
                </div>
                <div className="flex justify-between pt-1">
                  <span>44 Domestic Purchases / Services</span>
                  <span className="font-bold">₱{vat2550QData.domesticPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-emerald-900 bg-emerald-50 p-1.5 rounded">
                  <span>50 Total Current Purchases / Input Tax</span>
                  <span>₱{vat2550QData.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between pt-3 font-extrabold text-base bg-blue-900 text-white p-2.5 rounded">
                  <span>61 NET VAT PAYABLE / (EXCESS INPUT TAX)</span>
                  <span>
                    {vat2550QData.netVatPayable > 0 
                      ? `₱${vat2550QData.netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                      : `(₱${vat2550QData.excessInputTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}) Excess Input`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 3: BIR FORM 1601-EQ ----------------- */}
      {activeFormTab === '1601EQ' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 shadow-md font-mono text-xs space-y-6">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold uppercase font-sans tracking-wide">
                  BIR Form No. 1601-EQ - Quarterly Remittance Return of Creditable Income Taxes Withheld
                </h3>
                <p className="text-[11px] text-slate-600 font-sans">
                  Expanded Withholding Tax summary for {companyName} (TIN: {companyTin})
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-slate-800 text-[11px]">
                {taxPeriod}
              </span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-3 py-2 font-bold text-xs uppercase font-sans">
                Part II - Computation of Tax
              </div>
              <div className="p-3 space-y-2 bg-slate-50 divide-y divide-slate-200">
                <div className="flex justify-between pt-1">
                  <span>1 Total Amount of Income Payments Subject to Expanded Withholding</span>
                  <span className="font-bold">₱{expenses.reduce((s, e) => s + e.expense_invoice_amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-rose-900">
                  <span>2 Total Taxes Withheld for the Quarter</span>
                  <span>₱{expenses.reduce((s, e) => s + e.withholding_2307_2306, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 font-extrabold text-base bg-rose-100 text-rose-900 p-2 rounded">
                  <span>3 TOTAL AMOUNT OF TAX REMITTANCE DUE</span>
                  <span>₱{expenses.reduce((s, e) => s + e.withholding_2307_2306, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
