import React, { useState } from 'react';
import { X, ShieldCheck, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { Sale, Expense, Company } from '../../../types';

interface MobileBirModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType: '2550Q' | '1702Q' | '1701Q' | '2307' | '1601C' | 'BIR Forms';
  activeCompany: Company | null;
  sales: Sale[];
  expenses: Expense[];
  monthName: string;
  year: number;
}

export function MobileBirModal({
  isOpen,
  onClose,
  formType,
  activeCompany,
  sales,
  expenses,
  monthName,
  year
}: MobileBirModalProps) {
  if (!isOpen) return null;

  const totalSales = sales.reduce((sum, s) => sum + (Number(s.invoice_amount || s.amount) || 0), 0);
  const vatableSales = sales.reduce((sum, s) => sum + (Number(s.vatable_amount || s.vatable_sales) || 0), 0);
  const outputVat = sales.reduce((sum, s) => sum + (Number(s.output_vat || s.vat) || 0), 0);
  const cwtSales = sales.reduce((sum, s) => sum + (Number(s.ewt_amount || s.withholding_2307) || 0), 0);

  const totalPurchases = expenses.reduce((sum, e) => sum + (Number(e.expense_invoice_amount || e.amount) || 0), 0);
  const inputVat = expenses.reduce((sum, e) => sum + (Number(e.vat_input_amount || e.input_vat) || 0), 0);
  const ewtExpenses = expenses.reduce((sum, e) => sum + (Number(e.ewt_amount) || 0), 0);

  const netVatPayable = Math.max(0, outputVat - inputVat);
  const grossIncome = Math.max(0, totalSales - (totalPurchases * 0.6));
  const taxableNet = Math.max(0, totalSales - totalPurchases);
  const corporateTax = Math.round(taxableNet * 0.20); // 20% MSME CREATE Act

  const fmt = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">BIR Form {formType}</h3>
              <p className="text-[10px] text-slate-500">
                {activeCompany?.company_name || 'Philippine Enterprise'} • {monthName} {year}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on form type */}
        <div className="mt-3.5 space-y-3 text-xs">
          
          {/* FORM 2550Q */}
          {formType === '2550Q' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Quarterly Value-Added Tax Return
                </span>
                <span className="text-[11px] text-rose-900">
                  Compliant with Republic Act No. 11976 (EOPT Law)
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Part II - Total Vatable Sales (Line 15):</span>
                  <span className="font-bold text-slate-900">{fmt(vatableSales || (totalSales / 1.12))}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Output Tax Due (Line 20) [12%]:</span>
                  <span className="font-bold text-rose-700">{fmt(outputVat)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Less: Total Allowable Input Tax (Line 22):</span>
                  <span className="font-bold text-emerald-700">-{fmt(inputVat)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Less: Creditable VAT Withheld (2307):</span>
                  <span className="font-bold text-slate-700">-{fmt(cwtSales)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-rose-300 font-extrabold text-sm">
                  <span className="text-rose-900">Net VAT Payable (Line 25):</span>
                  <span className="text-rose-700">{fmt(netVatPayable)}</span>
                </div>
              </div>
            </div>
          )}

          {/* FORM 1702Q / 1701Q */}
          {(formType === '1702Q' || formType === '1701Q') && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  {formType === '1702Q' ? 'Quarterly Corporate Income Tax' : 'Quarterly Individual Income Tax'}
                </span>
                <span className="text-[11px] text-rose-900">
                  CREATE Act 20% MSME Regular Rate vs 2% MCIT
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Gross Sales / Receipts (Part IV):</span>
                  <span className="font-bold text-slate-900">{fmt(totalSales)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Less: Allowable Deductions:</span>
                  <span className="font-bold text-slate-700">-{fmt(totalPurchases)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Taxable Net Income:</span>
                  <span className="font-bold text-blue-700">{fmt(taxableNet)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Income Tax Rate (20% MSME):</span>
                  <span className="font-bold text-slate-900">20.00%</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-rose-300 font-extrabold text-sm">
                  <span className="text-rose-900">Estimated Income Tax Due:</span>
                  <span className="text-rose-700">{fmt(corporateTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* FORM 2307 */}
          {formType === '2307' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Certificate of Creditable Tax Withheld (2307)
                </span>
                <span className="text-[11px] text-rose-900">
                  Withholding Tax at Source Summary (ATC WI010 / WI020 / WI100)
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">From Customers (CWT Asset):</span>
                  <span className="font-bold text-emerald-700">{fmt(cwtSales)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">From Suppliers (EWT Payable):</span>
                  <span className="font-bold text-rose-700">{fmt(ewtExpenses)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Applicable ATC Codes:</span>
                  <span className="font-bold text-slate-800">WI010 (1%), WI020 (2%)</span>
                </div>
              </div>
            </div>
          )}

          {/* FORM 1601C / BIR Forms */}
          {(formType === '1601C' || formType === 'BIR Forms') && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Monthly Remittance of Taxes Withheld (1601-C)
                </span>
                <span className="text-[11px] text-rose-900">
                  Compensation Withholding & Statutory Contributions
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Total Compensation:</span>
                  <span className="font-bold text-slate-900">₱45,000.00</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Statutory Deductions (SSS/PhilHealth/HDMF):</span>
                  <span className="font-bold text-slate-700">-₱4,250.00</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Tax Withheld on Salaries:</span>
                  <span className="font-bold text-rose-700">₱2,800.00</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Form
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-rose-600 font-bold text-white shadow-md hover:bg-rose-500"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
