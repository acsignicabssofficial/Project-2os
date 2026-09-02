import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  Building2, 
  Trash2, 
  Scale 
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

interface IncomeTaxTabProps {
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

export default function IncomeTaxTab({
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
}: IncomeTaxTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';
  const rawEntityType = activeCompany?.entity_type || 'CORPORATION';

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
  const [taxPeriod, setTaxPeriod] = useState<string>(`Annual ${new Date().getFullYear()}`);

  // 1. Calculate Books Income Up To Net Income Before Tax
  const booksData = useMemo(() => {
    // Gross sales revenue (vatable_sales + vat_exempt)
    let grossSales = sales.reduce((sum, s) => sum + (Number(s.vatable_sales) || 0) + (Number(s.vat_exempt) || 0), 0);
    
    // Total itemized expenses (vatable_expense + vat_exempt)
    let itemizedExpenses = expenses.reduce((sum, e) => 
      sum + (Number(e.vatable_expense) || 0) + (Number(e.vat_exempt) || 0), 0);

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

  // 3. Post / Save Income Tax Transaction as Special Journal Entry
  const handleRecordIncomeTax = () => {
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first in the Companies tab!', 'error');
      return;
    }

    if (taxCalculation.computed_tax_due <= 0) {
      triggerAlert('Computed income tax due is ₱0.00. No tax provision needed to be posted.', 'info');
      return;
    }

    const confirmMsg = `Do you want to record / save the Income Tax Provision of ₱${taxCalculation.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })} to your official books?\n\nThis will generate a Special Journal Entry:\n• Debit: Provision for Income Tax Expense (#7010) ₱${taxCalculation.computed_tax_due.toLocaleString()}\n• Credit: Income Tax Payable (#2040) ₱${taxCalculation.computed_tax_due.toLocaleString()}\n\nThis will update Net Income After Tax and keep your Statement of Financial Position 100% balanced.`;

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
        tax_year: new Date().getFullYear(),
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

      triggerAlert(`Income Tax Provision #${vNo} posted! SFP & Financial Statements are updated and 100% balanced.`, 'success');
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
              <Calculator className="w-6 h-6 text-cyan-400" />
              Income Tax Computation & Provision Engine
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Computes Net Income Before Tax from books, applies BIR entity-specific tax regimes (Graduated Individual, 8% Flat, RCIT 20%/25%, MCIT 2%, OSD vs Itemized), and posts balanced special tax entries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Selected Company:</span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              {companyName}
            </span>
          </div>
        </div>
      </div>

      {/* TAX COMPUTATION FORM & LIVE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Parameters & Configuration */}
        <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm space-y-4`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2 border-b border-zinc-800/30 pb-3`}>
            <Building2 className="w-4 h-4 text-cyan-400" />
            Tax Entity & Regime Parameters
          </h3>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Taxable Period</label>
            <input
              type="text"
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
              placeholder="Annual 2026 or Q1 2026"
            />
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Entity Type *</label>
            <select
              value={entityType}
              onChange={(e) => {
                const val = e.target.value;
                setEntityType(val);
                if (val === 'SOLE PROPRIETOR') {
                  setTaxRegime('Graduated Tax Table');
                } else {
                  setTaxRegime('RCIT 20% (Small Corp)');
                }
              }}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="SOLE PROPRIETOR" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Sole Proprietorship / Individual / Professional</option>
              <option value="PARTNERSHIP" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Partnership</option>
              <option value="CORPORATION" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Corporation (CREATE Act)</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Tax Rate Regime *</label>
            <select
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              {entityType === 'SOLE PROPRIETOR' ? (
                <>
                  <option value="Graduated Tax Table" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Graduated Individual Tax Table (TRAIN Law)</option>
                  <option value="8% Flat Tax" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>8% Flat Tax on Gross Sales/Receipts</option>
                </>
              ) : (
                <>
                  <option value="RCIT 20% (Small Corp)" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>CREATE 20% RCIT (Micro & Small Corp: Taxable Inc ≤ ₱5M & Assets ≤ ₱100M)</option>
                  <option value="RCIT 25%" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>CREATE 25% Regular Corporate RCIT</option>
                  <option value="MCIT 2%" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2% Minimum Corporate Income Tax (MCIT)</option>
                </>
              )}
            </select>
          </div>

          {taxRegime !== '8% Flat Tax' && (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Deduction Method *</label>
              <select
                value={deductionMethod}
                onChange={(e) => setDeductionMethod(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Itemized" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Itemized Deductions (Actual Books Expenses)</option>
                <option value="OSD 40%" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Optional Standard Deduction (40% OSD)</option>
              </select>
            </div>
          )}

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Quarterly Tax Payments Made (Form 1701Q/1702Q)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-zinc-500 font-mono">₱</span>
              <input
                type="number"
                step="0.01"
                value={quarterlyPayments}
                onChange={(e) => setQuarterlyPayments(e.target.value)}
                className={`w-full pl-7 pr-3 py-2 text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Itemized Computation & Action */}
        <div className={`lg:col-span-2 p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm space-y-5 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/30 pb-3 mb-4">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <Scale className="w-4 h-4 text-emerald-400" />
                Live BIR Tax Return Breakdown ({taxPeriod})
              </h3>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                {entityType} • {taxRegime}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-zinc-500/5">
                <span className="text-zinc-400">Gross Sales / Revenue:</span>
                <span className={`font-bold ${theme.textTitle}`}>₱{booksData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-zinc-500/5">
                <span className="text-zinc-400">Less: Allowable Deductions ({deductionMethod}):</span>
                <span className="text-rose-400 font-bold">(₱{taxCalculation.allowable_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-bold">
                <span className="text-cyan-300">NET TAXABLE INCOME:</span>
                <span className="text-cyan-300">₱{taxCalculation.taxable_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-bold text-sm">
                <span className="text-amber-300">GROSS COMPUTED INCOME TAX DUE:</span>
                <span className="text-amber-300">₱{taxCalculation.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800/30 space-y-1.5">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Less: Creditable Tax Withheld (BIR Form 2307):</span>
                  <span>-₱{booksData.creditable2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Less: Quarterly Income Tax Payments (Form 1701Q/1702Q):</span>
                  <span>-₱{(parseFloat(quarterlyPayments) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${taxCalculation.net_tax_payable >= 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'}`}>
                <div>
                  <span className="font-bold text-sm block">
                    {taxCalculation.net_tax_payable >= 0 ? 'NET INCOME TAX PAYABLE:' : 'TAX OVERPAYMENT / CREDITABLE REFUND:'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-sans">{taxCalculation.tax_explanation}</span>
                </div>
                <span className="text-lg font-extrabold">
                  ₱{Math.abs(taxCalculation.net_tax_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON TO RECORD TAX PROVISION */}
          <div className="pt-4 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-400 font-sans">
              Clicking below generates a Special Journal Entry (Dr #7010 Income Tax Expense / Cr #2040 Tax Payable) that updates Net Income After Tax and keeps SFP balanced.
            </p>

            <button
              type="button"
              onClick={handleRecordIncomeTax}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${theme.accentBg}`}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Record Income Tax Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECORDED / POSTED INCOME TAX PROVISIONS LIST */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5 flex justify-between items-center`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>
            Posted Income Tax Provisions & Records ({incomeTaxRecords.length})
          </h3>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">
            Audit Trail
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Period / Ref #</th>
                <th className="p-3 font-sans">Entity & Tax Regime</th>
                <th className="p-3 font-sans">Method</th>
                <th className="p-3 text-right">Taxable Income</th>
                <th className="p-3 text-right">Tax Due</th>
                <th className="p-3 text-right">Credits (2307/1701Q)</th>
                <th className="p-3 text-right">Net Tax Payable</th>
                <th className="p-3 text-center font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {incomeTaxRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 font-sans">
                    No posted income tax provisions recorded yet. Configure parameters above and click "Record Income Tax Transaction".
                  </td>
                </tr>
              ) : (
                incomeTaxRecords.map((r) => (
                  <tr key={r.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3">
                      <span className="font-bold text-cyan-400 block">{r.period}</span>
                      <span className="text-[10px] text-zinc-500">{r.posted_entry_no || 'Ref-N/A'}</span>
                    </td>
                    <td className="p-3 font-sans font-medium text-zinc-300">
                      <div>{r.entity_type}</div>
                      <div className="text-[10px] text-zinc-500">{r.tax_regime}</div>
                    </td>
                    <td className="p-3 font-sans text-zinc-400">{r.deduction_method}</td>
                    <td className="p-3 text-right font-bold text-zinc-300">₱{r.taxable_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-amber-400">₱{r.computed_tax_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-emerald-400">₱{(r.less_creditable_tax_2307 + r.less_quarterly_tax_payments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-rose-400">₱{r.net_tax_payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => handleDeleteTaxRecord(r.id, r.posted_entry_no)}
                        className="p-1 px-2.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        title="Delete Tax Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
