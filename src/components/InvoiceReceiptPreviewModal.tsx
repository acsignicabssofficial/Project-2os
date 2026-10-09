import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  FileText, 
  Receipt, 
  CheckCircle2, 
  AlertTriangle,
  BadgePercent,
  Calendar,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { UniformBookRecord, Company } from '../types';

interface InvoiceReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: UniformBookRecord | null;
  activeCompany: Company | null;
  defaultMode?: 'VAT' | 'NONVAT';
}

export default function InvoiceReceiptPreviewModal({
  isOpen,
  onClose,
  record,
  activeCompany,
  defaultMode
}: InvoiceReceiptPreviewModalProps) {
  if (!isOpen || !record) return null;

  // Determine whether this record is VAT or Non-VAT
  const isRecordNonVat = String(record.vat_or_nonvat || '').toUpperCase().includes('NON');
  const initialVatType: 'VAT' | 'NONVAT' = defaultMode || (isRecordNonVat ? 'NONVAT' : 'VAT');
  const [vatMode, setVatMode] = useState<'VAT' | 'NONVAT'>(initialVatType);
  const [copied, setCopied] = useState(false);

  // Determine doc title (Sales Invoice vs Official Receipt)
  const isReceipt = record.invoice_type?.toUpperCase().includes('RECEIPT') || 
                    record.type_of_transaction === 'CASH' ||
                    record.voucher_number?.startsWith('OR-') ||
                    record.voucher_number?.startsWith('CR-');

  const sellerName = activeCompany?.company_name || 'REGISTERED TAXPAYER CORP.';
  const sellerTin = activeCompany?.company_tin || '000-000-000-00000';
  const sellerAddress = activeCompany?.company_address || activeCompany?.registered_address || activeCompany?.business_address || 'Metro Manila, Philippines';
  const sellerRdo = activeCompany?.rdo_code || '044';
  const sellerLineOfBiz = activeCompany?.line_of_business || 'General Commercial & Professional Services';

  const buyerName = record.registered_name || 'VALUED CLIENT / CUSTOMER';
  const buyerTin = record.tin || '000-000-000-00000';
  const buyerAddress = record.address || 'Metro Manila, Philippines';

  const docNumber = record.invoice_number || record.voucher_number || `INV-${record.id}`;
  const docDate = record.date || new Date().toISOString().split('T')[0];

  const qty = Number(record.qty) || 1;
  const unitPrice = Number(record.unit_price) || Number(record.amount) || 0;
  const grossAmount = Number(record.amount) || (qty * unitPrice);
  const discount = Number(record.discount) || 0;
  const taxWithheld = Number(record.tax_withheld) || 0;

  // VAT calculations
  const vatableAmount = vatMode === 'VAT' 
    ? (Number(record.vatable_amount) || Math.round((grossAmount / 1.12) * 100) / 100)
    : 0;
  const vatAmount = vatMode === 'VAT'
    ? (Number(record.vat_amount) || Math.round((grossAmount - vatableAmount) * 100) / 100)
    : 0;
  const zeroRated = Number(record.zero_rated_amount) || 0;
  const vatExempt = Number(record.vat_exempt_amount) || 0;
  const totalAmountDue = vatMode === 'VAT'
    ? (Number(record.total_amount_due) || (grossAmount - discount - taxWithheld))
    : (grossAmount - discount - taxWithheld);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDetails = () => {
    const text = `Document: ${vatMode === 'VAT' ? 'VAT' : 'NON-VAT'} ${isReceipt ? 'Official Receipt' : 'Sales Invoice'}\n` +
      `No: ${docNumber}\nDate: ${docDate}\nSeller: ${sellerName} (TIN: ${sellerTin})\n` +
      `Buyer: ${buyerName} (TIN: ${buyerTin})\nTotal Due: ₱${totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden print:border-none print:shadow-none print:max-w-full">
        
        {/* ========================================================================= */}
        {/* MODAL CONTROLS BAR (HIDDEN IN PRINT)                                      */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tax Regime Preview:
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-700">
              <button
                type="button"
                onClick={() => setVatMode('VAT')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  vatMode === 'VAT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VAT Registered Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setVatMode('NONVAT')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  vatMode === 'NONVAT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>NON-VAT Registered Preview</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDetails}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Info'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT PREVIEW CONTAINER                                                */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto max-h-[80vh] font-serif print:p-4 print:max-h-none">
          
          {/* ======================================================================= */}
          {/* 1. VAT REGISTERED TAXPAYER STYLE                                        */}
          {/* ======================================================================= */}
          {vatMode === 'VAT' && (
            <div className="border-2 border-emerald-900 rounded-lg p-6 sm:p-8 relative bg-white text-slate-900 font-sans shadow-xs">
              
              {/* TOP HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-emerald-900 pb-5">
                <div className="space-y-1">
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-900 border border-emerald-300 mb-1">
                    VAT REGISTERED TAXPAYER
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-emerald-950 font-serif">
                    {sellerName}
                  </h1>
                  <p className="text-xs text-slate-600">{sellerAddress}</p>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-900">VAT Reg. TIN:</strong> <span className="font-mono">{sellerTin}</span> • <strong className="text-slate-900">RDO Code:</strong> {sellerRdo}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    Line of Business: {sellerLineOfBiz}
                  </p>
                </div>

                <div className="text-right sm:self-start space-y-1">
                  <div className="inline-block px-3 py-1 bg-emerald-900 text-white font-serif font-black text-sm tracking-wider uppercase rounded-xs">
                    {isReceipt ? 'VAT OFFICIAL RECEIPT' : 'VAT SALES INVOICE'}
                  </div>
                  <div className="text-rose-700 font-serif font-black text-lg tracking-wider">
                    № {docNumber}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Date:</strong> <span className="font-mono">{docDate}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Terms:</strong> <span className="uppercase font-semibold">{record.type_of_transaction || 'CASH'}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER / BUYER INFO BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-emerald-900/30 text-xs bg-emerald-50/40 px-3 rounded-md my-4">
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Sold To / Received From:</span>
                    <div className="font-black text-slate-900 text-sm uppercase">{buyerName}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">TIN:</span>
                    <span className="font-mono font-bold text-slate-900 ml-2">{buyerTin}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Registered Address:</span>
                    <div className="text-slate-800">{buyerAddress}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Business Style:</span>
                    <span className="text-slate-700 ml-2">Commercial / Trade</span>
                  </div>
                </div>
              </div>

              {/* PARTICULARS / LINE ITEMS TABLE */}
              <table className="w-full text-left text-xs border border-emerald-900/40 my-4">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border-r border-emerald-800 text-center w-16">Qty</th>
                    <th className="p-2 border-r border-emerald-800 w-20">Unit</th>
                    <th className="p-2 border-r border-emerald-800">Particulars / Description</th>
                    <th className="p-2 border-r border-emerald-800 text-right w-28">Unit Price</th>
                    <th className="p-2 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/20 font-sans">
                  <tr>
                    <td className="p-2.5 text-center font-mono font-semibold border-r border-emerald-900/20">{qty}</td>
                    <td className="p-2.5 text-slate-600 border-r border-emerald-900/20">Unit/Lot</td>
                    <td className="p-2.5 font-medium border-r border-emerald-900/20">
                      <div className="font-bold text-slate-900">{record.particulars || 'Professional Sales / Service Item'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Reference: {record.voucher_number || docNumber}</div>
                    </td>
                    <td className="p-2.5 text-right font-mono border-r border-emerald-900/20">
                      ₱{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      ₱{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* BIR STANDARD 2-COLUMN MANDATORY VAT BREAKDOWN BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-emerald-900 rounded-md p-3.5 bg-slate-50 text-xs">
                
                {/* LEFT COLUMN: VAT ANALYSIS SCHEDULE */}
                <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-300 md:pr-4 pb-3 md:pb-0 font-sans">
                  <div className="font-bold uppercase text-[10px] text-emerald-900 border-b border-emerald-900/20 pb-1">
                    VAT Breakdown Schedule (BIR Form 2550)
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">VATable Sales (12%):</span>
                    <span className="font-mono font-bold text-slate-900">₱{vatableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">VAT-Exempt Sales:</span>
                    <span className="font-mono text-slate-700">₱{vatExempt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Zero-Rated Sales:</span>
                    <span className="font-mono text-slate-700">₱{zeroRated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-t border-slate-200">
                    <span className="text-slate-700 font-semibold">12% Value Added Tax:</span>
                    <span className="font-mono font-bold text-emerald-800">₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t-2 border-slate-300 font-bold text-slate-900">
                    <span>Total Sales (VAT Inclusive):</span>
                    <span className="font-mono">₱{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* RIGHT COLUMN: COMPUTATION & TOTAL DUE */}
                <div className="space-y-1.5 font-sans">
                  <div className="font-bold uppercase text-[10px] text-emerald-900 border-b border-emerald-900/20 pb-1">
                    Settlement & Withholding
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Total Sales (VAT Inclusive):</span>
                    <span className="font-mono">₱{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between py-0.5 text-rose-700">
                      <span>Less: Trade / SC / PWD Discount:</span>
                      <span className="font-mono">-₱{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {taxWithheld > 0 && (
                    <div className="flex justify-between py-0.5 text-amber-700">
                      <span>Less: Withholding Tax (BIR Form 2307):</span>
                      <span className="font-mono">-₱{taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t-2 border-emerald-900 font-bold text-emerald-950 text-sm bg-emerald-100/60 px-2 rounded-xs mt-2">
                    <span className="uppercase">TOTAL AMOUNT DUE:</span>
                    <span className="font-mono font-black text-emerald-900">₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>

              {/* SIGNATURE & LEGAL FOOTER */}
              <div className="mt-8 pt-4 border-t border-emerald-900/30 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500 font-sans">
                <div className="space-y-0.5 max-w-sm">
                  <p className="font-bold text-slate-700">Ease of Paying Taxes (EOPT) Act (RA 11976) Compliant</p>
                  <p>BIR Authority to Print (ATP) No: ATP-2026-00912-VAT • Valid until: Dec 31, 2028</p>
                  <p>Printer Accreditation No: 044-PRT-2024-0012 • 50 Bks (50x2) 000001 - 002500</p>
                  <p className="font-semibold text-emerald-800">"THIS SALES INVOICE / OR SHALL BE VALID FOR CLAIMING INPUT TAX CREDIT"</p>
                </div>
                
                <div className="text-center w-56">
                  <div className="border-b border-slate-900 pb-1 mb-1">
                    <span className="font-signature text-base text-slate-700">Authorized Officer</span>
                  </div>
                  <span className="uppercase text-[9px] font-bold text-slate-700">Cashier / Authorized Representative</span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* 2. NON-VAT REGISTERED TAXPAYER STYLE                                    */}
          {/* ======================================================================= */}
          {vatMode === 'NONVAT' && (
            <div className="border-2 border-slate-800 rounded-lg p-6 sm:p-8 relative bg-white text-slate-900 font-sans shadow-xs">
              
              {/* STATUTORY MANDATORY NON-VAT WATERMARK BANNER ACROSS TOP */}
              <div className="bg-rose-700 text-white text-center py-1.5 px-3 rounded font-bold text-xs uppercase tracking-wider mb-4 shadow-xs">
                NON-VAT REGISTERED TAXPAYER • THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX
              </div>

              {/* TOP HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-900 border border-rose-300 mb-1">
                    NON-VAT ENTITY (SEC. 116 PERCENTAGE TAX)
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-serif">
                    {sellerName}
                  </h1>
                  <p className="text-xs text-slate-600">{sellerAddress}</p>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-900">NON-VAT Reg. TIN:</strong> <span className="font-mono">{sellerTin}</span> • <strong className="text-slate-900">RDO Code:</strong> {sellerRdo}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    Line of Business: {sellerLineOfBiz}
                  </p>
                </div>

                <div className="text-right sm:self-start space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-serif font-black text-sm tracking-wider uppercase rounded-xs">
                    {isReceipt ? 'NON-VAT OFFICIAL RECEIPT' : 'NON-VAT SALES INVOICE'}
                  </div>
                  <div className="text-rose-700 font-serif font-black text-lg tracking-wider">
                    № {docNumber}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Date:</strong> <span className="font-mono">{docDate}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Terms:</strong> <span className="uppercase font-semibold">{record.type_of_transaction || 'CASH'}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER / BUYER INFO BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs bg-slate-100/70 px-3 rounded-md my-4">
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Sold To / Received From:</span>
                    <div className="font-black text-slate-900 text-sm uppercase">{buyerName}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">TIN:</span>
                    <span className="font-mono font-bold text-slate-900 ml-2">{buyerTin}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Registered Address:</span>
                    <div className="text-slate-800">{buyerAddress}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px]">Business Style:</span>
                    <span className="text-slate-700 ml-2">Commercial / Trade</span>
                  </div>
                </div>
              </div>

              {/* PARTICULARS / LINE ITEMS TABLE */}
              <table className="w-full text-left text-xs border border-slate-400 my-4">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border-r border-slate-700 text-center w-16">Qty</th>
                    <th className="p-2 border-r border-slate-700 w-20">Unit</th>
                    <th className="p-2 border-r border-slate-700">Particulars / Description</th>
                    <th className="p-2 border-r border-slate-700 text-right w-28">Unit Price</th>
                    <th className="p-2 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-sans">
                  <tr>
                    <td className="p-2.5 text-center font-mono font-semibold border-r border-slate-300">{qty}</td>
                    <td className="p-2.5 text-slate-600 border-r border-slate-300">Unit/Lot</td>
                    <td className="p-2.5 font-medium border-r border-slate-300">
                      <div className="font-bold text-slate-900">{record.particulars || 'Non-VAT Goods / Services'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Reference: {record.voucher_number || docNumber}</div>
                    </td>
                    <td className="p-2.5 text-right font-mono border-r border-slate-300">
                      ₱{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      ₱{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* NON-VAT FINANCIAL SUMMARY BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-slate-800 rounded-md p-3.5 bg-slate-50 text-xs">
                
                {/* LEFT: NON-VAT TAX REGIME NOTICE */}
                <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-300 md:pr-4 pb-3 md:pb-0 font-sans">
                  <div className="font-bold uppercase text-[10px] text-slate-900 border-b border-slate-300 pb-1">
                    Tax Classification & Status
                  </div>
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] leading-tight space-y-1">
                    <p className="font-bold">⚠️ EXEMPT FROM VALUE ADDED TAX (0% VAT)</p>
                    <p>Issuer is registered under Non-VAT classification pursuant to Section 109 / 116 of the NIRC of 1997, as amended.</p>
                  </div>
                  <div className="text-[10px] text-slate-600 italic">
                    Value-Added Tax (12%): <strong>₱0.00</strong> (No Output Tax collected or passed on to buyer).
                  </div>
                </div>

                {/* RIGHT: COMPUTATION & NET DUE */}
                <div className="space-y-1.5 font-sans">
                  <div className="font-bold uppercase text-[10px] text-slate-900 border-b border-slate-300 pb-1">
                    Total Non-VAT Billing
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Gross Sales Amount:</span>
                    <span className="font-mono font-bold">₱{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-500">
                    <span>Value Added Tax (VAT):</span>
                    <span className="font-mono font-semibold">₱0.00</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between py-0.5 text-rose-700">
                      <span>Less: Discounts / Concessions:</span>
                      <span className="font-mono">-₱{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {taxWithheld > 0 && (
                    <div className="flex justify-between py-0.5 text-amber-700">
                      <span>Less: 1% Creditable Withholding (2307):</span>
                      <span className="font-mono">-₱{taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t-2 border-slate-800 font-bold text-slate-950 text-sm bg-slate-200/80 px-2 rounded-xs mt-2">
                    <span className="uppercase">TOTAL AMOUNT DUE:</span>
                    <span className="font-mono font-black text-slate-900">₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>

              {/* STATUTORY DISCLAIMER FOOTER */}
              <div className="mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500 font-sans">
                <div className="space-y-0.5 max-w-sm">
                  <p className="font-bold text-rose-700 uppercase">
                    "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX"
                  </p>
                  <p>BIR Authority to Print (ATP) No: ATP-2026-00445-NV • Valid until: Dec 31, 2028</p>
                  <p>Printer Accreditation: 044-PRT-2024-0012 • 50 Bks (50x2) 000001 - 002500</p>
                </div>
                
                <div className="text-center w-56">
                  <div className="border-b border-slate-900 pb-1 mb-1">
                    <span className="font-signature text-base text-slate-700">Authorized Officer</span>
                  </div>
                  <span className="uppercase text-[9px] font-bold text-slate-700">Cashier / Authorized Representative</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
