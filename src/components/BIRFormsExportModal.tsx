import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2, 
  Building2, 
  Printer, 
  ShieldCheck, 
  Layers, 
  FileSpreadsheet, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Company, Sale, Expense, PPEAsset, SpecialEntry, AccountTitle } from '../types';

export type BIRFormType = '1701Q' | '1702Q' | '2550Q' | '1601EQ';

interface BIRFormsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company | null;
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function BIRFormsExportModal({
  isOpen,
  onClose,
  activeCompany,
  sales = [],
  expenses = [],
  ppeAssets = [],
  specialEntries = [],
  theme,
  triggerAlert
}: BIRFormsExportModalProps) {
  const [selectedForm, setSelectedForm] = useState<BIRFormType>('1702Q');
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [year, setYear] = useState('2026');
  const [deductionMethod, setDeductionMethod] = useState<'Itemized' | 'OSD 40%'>('Itemized');
  const [taxRateType, setTaxRateType] = useState<'RCIT_20' | 'RCIT_25' | 'MCIT_2' | 'EIGHT_PERCENT'>('RCIT_20');
  const [priorQuarterPayments, setPriorQuarterPayments] = useState<number>(0);

  if (!isOpen) return null;

  const companyName = activeCompany?.company_name || 'Philippine Enterprise';
  const companyTin = activeCompany?.company_tin || '000-000-000-00000';
  const branchCode = activeCompany?.tin_branch_code || '00000';
  const rdoCode = activeCompany?.rdo_code || '044';
  const rawTin = companyTin.replace(/[^0-9]/g, '');

  // 1. Calculations for Sales & Output
  const grossSales = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.vatable_sales) || Number(s.amount) || 0), 0);
  }, [sales]);

  const outputVat = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.output_vat) || 0), 0);
  }, [sales]);

  const cwt2307WithheldByCustomers = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.withholding_2307) || 0), 0);
  }, [sales]);

  // 2. Calculations for Expenses & Input
  const rawPurchases = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.vatable_expense) || Number(e.amount) || 0), 0);
  }, [expenses]);

  const ppeDepreciation = useMemo(() => {
    return ppeAssets.reduce((sum, a) => sum + (Number(a.accumulated_depreciation) || 0), 0);
  }, [ppeAssets]);

  const totalItemizedExpenses = rawPurchases + ppeDepreciation;

  const inputVat = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.vat_input_amount) || 0), 0);
  }, [expenses]);

  const ewtWithheldFromSuppliers = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.withholding_2307_2306) || 0), 0);
  }, [expenses]);

  // Income Tax Computations
  const osdDeductions = grossSales * 0.40;
  const allowableDeductions = deductionMethod === 'OSD 40%' ? osdDeductions : totalItemizedExpenses;
  const netTaxableIncome = Math.max(0, grossSales - allowableDeductions);

  let calculatedTaxDue = 0;
  if (taxRateType === 'RCIT_20') {
    calculatedTaxDue = netTaxableIncome * 0.20;
  } else if (taxRateType === 'RCIT_25') {
    calculatedTaxDue = netTaxableIncome * 0.25;
  } else if (taxRateType === 'MCIT_2') {
    calculatedTaxDue = grossSales * 0.02;
  } else if (taxRateType === 'EIGHT_PERCENT') {
    const taxableBase = Math.max(0, grossSales - 250000);
    calculatedTaxDue = taxableBase * 0.08;
  }

  const netTaxPayable = Math.max(0, calculatedTaxDue - priorQuarterPayments - cwt2307WithheldByCustomers);

  // VAT Computations (2550Q)
  const netVatPayable = Math.max(0, outputVat - inputVat);
  const excessInputTax = Math.max(0, inputVat - outputVat);

  // Line-by-Line Form Data Mapping for Official eBIRForms
  const formDataLines = useMemo(() => {
    if (selectedForm === '1702Q') {
      return [
        { line: 'Part I - Line 1', label: 'Taxable Year', value: year },
        { line: 'Part I - Line 2', label: 'Quarter', value: quarter },
        { line: 'Part I - Line 5', label: 'Taxpayer Identification Number (TIN)', value: companyTin },
        { line: 'Part I - Line 6', label: 'RDO Code', value: rdoCode },
        { line: 'Part I - Line 7', label: 'Registered Name', value: companyName },
        { line: 'Part IV - Line 29', label: 'Gross Sales / Revenues', value: `PHP ${grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 30', label: 'Less: Cost of Sales / Services', value: `PHP ${(rawPurchases * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 31', label: 'Gross Income from Operation', value: `PHP ${(grossSales - (rawPurchases * 0.5)).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 33', label: `Total Allowable Deductions (${deductionMethod})`, value: `PHP ${allowableDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 34', label: 'Net Taxable Income', value: `PHP ${netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 35', label: `Income Tax Rate`, value: taxRateType === 'RCIT_20' ? '20% (CREATE Micro/Small Corp)' : '25% (Regular Corp)' },
        { line: 'Part IV - Line 36', label: 'Income Tax Due (RCIT)', value: `PHP ${calculatedTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 38A', label: 'Prior Quarters Tax Payments', value: `PHP ${priorQuarterPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 38B', label: 'Creditable Tax Withheld (SAWT / BIR Form 2307)', value: `PHP ${cwt2307WithheldByCustomers.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 40', label: 'NET TAX PAYABLE / (REFUNDABLE)', value: `PHP ${netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
      ];
    } else if (selectedForm === '1701Q') {
      return [
        { line: 'Part I - Line 1', label: 'Taxable Year', value: year },
        { line: 'Part I - Line 2', label: 'Quarter', value: quarter },
        { line: 'Part I - Line 5', label: 'Taxpayer TIN', value: companyTin },
        { line: 'Part I - Line 6', label: 'RDO Code', value: rdoCode },
        { line: 'Part I - Line 7', label: 'Taxpayer Name', value: companyName },
        { line: 'Part IV - Line 26', label: 'Gross Sales / Receipts', value: `PHP ${grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 28', label: `Allowable Deductions (${deductionMethod})`, value: `PHP ${allowableDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 29', label: 'Net Taxable Income', value: `PHP ${netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 30', label: 'Tax Due', value: `PHP ${calculatedTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 31A', label: 'Tax Withheld per BIR Form 2307 (SAWT)', value: `PHP ${cwt2307WithheldByCustomers.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 33', label: 'NET TAX PAYABLE', value: `PHP ${netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
      ];
    } else if (selectedForm === '2550Q') {
      return [
        { line: 'Part I - Line 1', label: 'Return Period', value: `${quarter} ${year}` },
        { line: 'Part I - Line 5', label: 'Taxpayer TIN', value: companyTin },
        { line: 'Part I - Line 7', label: 'Registered Name', value: companyName },
        { line: 'Part IV - Line 31', label: 'Vatable Sales', value: `PHP ${grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 34', label: 'Total Output Tax Due (12%)', value: `PHP ${outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 44', label: 'Total Domestic Purchases of Goods/Services', value: `PHP ${rawPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 50', label: 'Total Current Purchases / Input Tax', value: `PHP ${inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part IV - Line 61', label: 'NET VAT PAYABLE / (EXCESS INPUT TAX)', value: netVatPayable > 0 ? `PHP ${netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `(PHP ${excessInputTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}) EXCESS INPUT` }
      ];
    } else {
      return [
        { line: 'Part I - Line 1', label: 'Return Period', value: `${quarter} ${year}` },
        { line: 'Part I - Line 5', label: 'Withholding Agent TIN', value: companyTin },
        { line: 'Part I - Line 7', label: 'Registered Name', value: companyName },
        { line: 'Part II - Line 1', label: 'Total Amount of Income Payments Subject to Expanded Withholding', value: `PHP ${rawPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part II - Line 2', label: 'Total Taxes Withheld for the Quarter (QAP)', value: `PHP ${ewtWithheldFromSuppliers.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { line: 'Part II - Line 3', label: 'TOTAL AMOUNT OF TAX REMITTANCE DUE', value: `PHP ${ewtWithheldFromSuppliers.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
      ];
    }
  }, [selectedForm, year, quarter, companyTin, rdoCode, companyName, grossSales, rawPurchases, allowableDeductions, deductionMethod, netTaxableIncome, taxRateType, calculatedTaxDue, priorQuarterPayments, cwt2307WithheldByCustomers, netTaxPayable, outputVat, inputVat, netVatPayable, excessInputTax, ewtWithheldFromSuppliers]);

  // Export handlers
  const handleCopyClipboard = () => {
    const textBlock = [
      `=======================================================`,
      `BIR FORM ${selectedForm} - ${quarter} ${year} DATA PACKAGE`,
      `Taxpayer: ${companyName} (TIN: ${companyTin}-${branchCode})`,
      `RDO: ${rdoCode} | Generated via Philippine Tax Engine`,
      `=======================================================`,
      ...formDataLines.map(item => `[${item.line}] ${item.label}: ${item.value}`),
      `=======================================================`
    ].join('\n');

    navigator.clipboard.writeText(textBlock);
    triggerAlert(`Copied BIR Form ${selectedForm} data breakdown to clipboard! Ready to paste into eBIRForms Package.`, 'success');
  };

  const handleDownloadCsv = () => {
    const csvContent = [
      'Line Item,Field Description,Value',
      ...formDataLines.map(item => `"${item.line}","${item.label.replace(/"/g, '""')}","${String(item.value).replace(/"/g, '""')}"`)
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_${selectedForm}_${quarter}_${year}_${rawTin}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert(`Downloaded BIR Form ${selectedForm} CSV dataset!`, 'success');
  };

  const handleDownloadJson = () => {
    const payload = {
      formType: selectedForm,
      quarter,
      year,
      timestamp: new Date().toISOString(),
      taxpayer: {
        companyName,
        tin: companyTin,
        branchCode,
        rdoCode
      },
      scheduleItems: formDataLines,
      summary: {
        grossSales,
        allowableDeductions,
        netTaxableIncome,
        taxDue: calculatedTaxDue,
        cwt2307Claimed: cwt2307WithheldByCustomers,
        netTaxPayable
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_${selectedForm}_${quarter}_${year}_payload.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert(`Downloaded BIR Form ${selectedForm} JSON payload!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">eBIR Forms Export Hub</h2>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  v7.9.4 Ready
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Generate, validate, and export pre-filled statutory BIR tax return payloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTROLS & SUB-NAV */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Select BIR Form Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            {(['1702Q', '1701Q', '2550Q', '1601EQ'] as BIRFormType[]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedForm(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedForm === f 
                    ? 'bg-blue-900 text-white shadow-xs' 
                    : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                BIR {f}
              </button>
            ))}
          </div>

          {/* Period Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as any)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs cursor-pointer focus:outline-hidden"
            >
              <option value="Q1">Q1 (1st Quarter)</option>
              <option value="Q2">Q2 (2nd Quarter)</option>
              <option value="Q3">Q3 (3rd Quarter)</option>
              <option value="Q4">Q4 (4th Quarter)</option>
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs cursor-pointer focus:outline-hidden"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {selectedForm === '1702Q' && (
              <select
                value={taxRateType}
                onChange={(e) => setTaxRateType(e.target.value as any)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-950 shadow-xs cursor-pointer focus:outline-hidden"
              >
                <option value="RCIT_20">RCIT 20% (CREATE Micro/Small)</option>
                <option value="RCIT_25">RCIT 25% (Regular Corp)</option>
                <option value="MCIT_2">MCIT 2% (Gross Income)</option>
              </select>
            )}

            {(selectedForm === '1702Q' || selectedForm === '1701Q') && (
              <select
                value={deductionMethod}
                onChange={(e) => setDeductionMethod(e.target.value as any)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs cursor-pointer focus:outline-hidden"
              >
                <option value="Itemized">Itemized Deductions</option>
                <option value="OSD 40%">40% Optional Standard Deduction</option>
              </select>
            )}
          </div>
        </div>

        {/* MODAL BODY: LINE-BY-LINE SCHEDULE PREVIEW */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 space-y-0.5">
              <span className="font-extrabold text-sm block">{companyName}</span>
              <p className="text-blue-800">
                TIN: <span className="font-mono font-bold">{companyTin}</span> • Branch Code: <span className="font-mono font-bold">{branchCode}</span> • RDO: <span className="font-mono font-bold">{rdoCode}</span>
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
              <span>Official BIR Form {selectedForm} Schedule Mapping</span>
              <span className="font-mono text-amber-300 text-[11px]">{quarter} {year}</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {formDataLines.map((row, idx) => (
                <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-mono font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded text-[10px]">
                      {row.line}
                    </span>
                    <span className="ml-2 font-medium text-slate-800">{row.label}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-950 text-right whitespace-nowrap">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER & EXPORT BUTTONS */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for submission or copy-paste into BIR Offline Package</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              Copy to Clipboard
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 text-xs font-extrabold rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Download eBIR Payload
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
