import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check, 
  FileText, 
  Layers, 
  Eye, 
  Building2, 
  Copy, 
  Sparkles,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';
import { Company, UniformBookRecord, Sale, Collection, Expense, Payment } from '../types';

export interface DocumentPreviewRecord {
  id?: number | string;
  invoice_number?: string;
  voucher_number?: string;
  date?: string;
  registered_name?: string;
  customer_name?: string;
  service_provider_name?: string;
  payee_name?: string;
  tin?: string;
  customer_tin?: string;
  sp_tin?: string;
  service_provider_TIN?: string;
  client_TIN?: string;
  address?: string;
  client_Address?: string;
  sp_address?: string;
  type_of_transaction?: string; // 'CASH' | 'ON ACCOUNT' | 'CHARGE'
  status?: string;
  sales_status?: string;
  invoice_type?: string;
  particulars?: string;
  description?: string;
  expense_type?: string;
  qty?: number;
  unit_price?: number;
  amount?: number;
  invoice_amount?: number;
  expense_invoice_amount?: number;
  amount_collected?: number;
  amount_paid?: number;
  vatable_amount?: number;
  vatable_sales?: number;
  vatable_expense?: number;
  vat_amount?: number;
  output_vat?: number;
  vat_input_amount?: number;
  zero_rated_amount?: number;
  zero_rated?: number;
  vat_exempt_amount?: number;
  vat_exempt?: number;
  total_amount_vat_inclusive?: number;
  total_sale_vat_inclusive?: number;
  total_expenses_vat_inclusive?: number;
  total_amount_net_of_vat?: number;
  amount_net_of_vat?: number;
  discount?: number;
  discounts?: number;
  less_discount?: number;
  tax_withheld?: number;
  withholding_2307?: number;
  withholding_2307_2306?: number;
  less_withholding_tax?: number;
  total_amount_due?: number;
  vat_or_nonvat?: 'VAT' | 'NONVAT' | string;
  is_cancelled?: boolean | number;
  items?: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }>;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  activeCompany: Company | null;
  theme?: any;
  themeMode?: 'neon_light' | 'clean' | 'dark' | string;
  initialVatMode?: 'VAT' | 'NONVAT';
  bookType?: string;
  transactionCategory?: 'sales' | 'purchases';
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  record,
  activeCompany,
  theme,
  themeMode = 'neon_light',
  initialVatMode,
  bookType,
  transactionCategory
}: DocumentPreviewModalProps) {
  // Determine if this transaction is Purchases/Disbursements vs Sales/Receipts
  const detectedIsPurchase = Boolean(
    transactionCategory === 'purchases' ||
    bookType === 'subsidiary_purchases' ||
    bookType === 'expenses' ||
    bookType === 'cash_disbursement' ||
    bookType === 'payments' ||
    record?.service_provider_name ||
    record?.sp_tin ||
    record?.expense_type ||
    record?.expense_invoice_amount ||
    record?.amount_paid ||
    (typeof record?.voucher_number === 'string' && (record.voucher_number.startsWith('PV') || record.voucher_number.startsWith('CV') || record.voucher_number.startsWith('CD'))) ||
    (typeof record?.invoice_number === 'string' && (record.invoice_number.startsWith('PI') || record.invoice_number.startsWith('EXP')))
  );

  const [isPurchaseTransaction, setIsPurchaseTransaction] = useState<boolean>(detectedIsPurchase);

  // Determine VAT vs NON-VAT mode
  const detectedVatMode: 'VAT' | 'NONVAT' = 
    initialVatMode ||
    (record?.vat_or_nonvat === 'NONVAT' || record?.vat_or_nonvat === 'NON-VATABLE' || activeCompany?.vat_or_non_vat === 'NON-VATABLE'
      ? 'NONVAT' 
      : 'VAT');

  const [vatMode, setVatMode] = useState<'VAT' | 'NONVAT'>(detectedVatMode);

  // Document Title: Sales Invoice, Service Invoice, Official Receipt, etc.
  const getInitialDocTitle = (): string => {
    if (record?.invoice_type && typeof record.invoice_type === 'string') {
      const it = record.invoice_type.toUpperCase();
      if (it.includes('OFFICIAL RECEIPT') || it.includes('COLLECTION') || it.includes('RECEIPT')) return 'OFFICIAL RECEIPT';
      if (it.includes('SERVICE')) return 'SERVICE INVOICE';
      if (it.includes('SALES')) return 'SALES INVOICE';
      if (it.includes('BILLING')) return 'BILLING STATEMENT';
      return it;
    }
    if (detectedIsPurchase) {
      if (bookType === 'cash_disbursement' || bookType === 'payments' || record?.amount_paid) return 'OFFICIAL RECEIPT';
      return 'SALES INVOICE';
    } else {
      if (bookType === 'cash_receipt' || bookType === 'collections' || record?.amount_collected) return 'OFFICIAL RECEIPT';
      return 'SALES INVOICE';
    }
  };

  const [docTitle, setDocTitle] = useState<string>(getInitialDocTitle());
  const [isCashSales, setIsCashSales] = useState<boolean>(true);
  const [isChargeSales, setIsChargeSales] = useState<boolean>(false);
  const [isReceivedChecked, setIsReceivedChecked] = useState<boolean>(false);

  // Sync state whenever record, activeCompany, or modal opens
  useEffect(() => {
    if (isOpen) {
      const isPurch = Boolean(
        transactionCategory === 'purchases' ||
        bookType === 'subsidiary_purchases' ||
        bookType === 'expenses' ||
        bookType === 'cash_disbursement' ||
        bookType === 'payments' ||
        record?.service_provider_name ||
        record?.sp_tin ||
        record?.expense_type ||
        record?.expense_invoice_amount ||
        record?.amount_paid ||
        (typeof record?.voucher_number === 'string' && (record.voucher_number.startsWith('PV') || record.voucher_number.startsWith('CV') || record.voucher_number.startsWith('CD'))) ||
        (typeof record?.invoice_number === 'string' && (record.invoice_number.startsWith('PI') || record.invoice_number.startsWith('EXP')))
      );
      setIsPurchaseTransaction(isPurch);

      const mode = initialVatMode || 
        (record?.vat_or_nonvat === 'NONVAT' || record?.vat_or_nonvat === 'NON-VATABLE' || activeCompany?.vat_or_non_vat === 'NON-VATABLE'
          ? 'NONVAT'
          : 'VAT');
      setVatMode(mode);

      // Check transaction type: CASH vs CHARGE
      const typeStr = (record?.type_of_transaction || record?.status || record?.sales_status || '').toString().toUpperCase();
      if (typeStr.includes('CHARGE') || typeStr.includes('ACCOUNT') || typeStr.includes('CREDIT') || typeStr.includes('UNPAID')) {
        setIsCashSales(false);
        setIsChargeSales(true);
      } else {
        setIsCashSales(true);
        setIsChargeSales(false);
      }

      // Title
      if (record?.invoice_type) {
        const it = record.invoice_type.toUpperCase();
        if (it.includes('OFFICIAL RECEIPT') || it.includes('COLLECTION') || it.includes('RECEIPT')) setDocTitle('OFFICIAL RECEIPT');
        else if (it.includes('SERVICE')) setDocTitle('SERVICE INVOICE');
        else if (it.includes('SALES')) setDocTitle('SALES INVOICE');
        else if (it.includes('BILLING')) setDocTitle('BILLING STATEMENT');
        else setDocTitle(it);
      } else {
        if (isPurch) {
          setDocTitle(bookType === 'cash_disbursement' || bookType === 'payments' ? 'OFFICIAL RECEIPT' : 'SALES INVOICE');
        } else {
          setDocTitle(bookType === 'cash_receipt' || bookType === 'collections' ? 'OFFICIAL RECEIPT' : 'SALES INVOICE');
        }
      }
    }
  }, [isOpen, record, initialVatMode, activeCompany, bookType, transactionCategory]);

  if (!isOpen) return null;

  // =========================================================================
  // 1. UPPER LEFT INFO & "SOLD TO:" RESOLUTION
  // Rule:
  // - Sales & Cash Receipts: Upper Left = Selected Entity (Company); Sold To = Customer Detail
  // - Purchases & Cash Disbursements: Upper Left = Service Provider; Sold To = Selected Entity (Company)
  // =========================================================================

  // Company Details
  const companyTradeName = activeCompany?.trade_name || activeCompany?.line_of_business || 'SANDBOX';
  const companyLegalName = activeCompany?.company_name || 'ANNYEONG SEYOH & CO';
  const companyTin = activeCompany?.company_tin || '123-456-789-00000';
  const companyAddress = activeCompany?.company_address || activeCompany?.registered_address || activeCompany?.business_address || activeCompany?.address || '4TH FLOOR, BIR BLDG, SEN. MIRIAM P. DEFENSOR-SANTIAGO AVE., PINYAHAN, QUEZON CITY 1000';

  // Provider / Vendor Details
  const providerTradeName = record?.service_provider_name || record?.registered_name || 'SERVICE PROVIDER CORP.';
  const providerLegalName = record?.registered_name || record?.service_provider_name || record?.payee_name || 'ANNYEONG SEYOH & CO';
  const providerTin = record?.tin || record?.sp_tin || record?.service_provider_TIN || '987-654-321-00000';
  const providerAddress = record?.address || record?.sp_address || 'MAKATI CITY, METRO MANILA, PHILIPPINES';

  // Customer / Client Details
  const customerName = record?.registered_name || record?.customer_name || record?.client_name || 'CLIENT TRADING ENTERPRISES INC.';
  const customerTin = record?.tin || record?.customer_tin || record?.client_TIN || '000-123-456-00000';
  const customerAddress = record?.address || record?.client_Address || 'QUEZON CITY, METRO MANILA';

  // Upper Left Info depending on transaction type
  const upperLeftTradeName = isPurchaseTransaction ? providerTradeName : companyTradeName;
  const upperLeftLegalName = isPurchaseTransaction ? providerLegalName : companyLegalName;
  const upperLeftTin = isPurchaseTransaction ? providerTin : companyTin;
  const upperLeftAddress = isPurchaseTransaction ? providerAddress : companyAddress;

  // "SOLD TO:" info depending on transaction type
  const soldToName = isPurchaseTransaction ? companyLegalName : customerName;
  const soldToTin = isPurchaseTransaction ? companyTin : customerTin;
  const soldToAddress = isPurchaseTransaction ? companyAddress : customerAddress;

  // Invoice / Reference No. & Date
  const invoiceNo = record?.invoice_number || record?.voucher_number || record?.OR_PR_number || '001';
  const rawDate = record?.date || record?.invoice_date || record?.expense_date || record?.collection_date || record?.payment_date || record?.issue_date || new Date().toISOString().split('T')[0];

  // =========================================================================
  // 2. STRICT BIR FORMULA COMPUTATIONS
  // Formula 1: vatable sales (+) vat (+) zero-rated sales (+) vat-exempt sales = total sales (vat inclusive)
  // Formula 2: total sales (vat inclusive) (-) vat = amount net of vat
  // Formula 3: amount net of vat (-) discounts (+) vat (-) withholding tax = total amount due
  // =========================================================================

  const itemQty = Number(record?.qty) || 1;
  const itemUnitPrice = Number(record?.unit_price) || 0;
  const rawBaseAmount = Number(record?.amount) || 
    (itemQty * itemUnitPrice) || 
    Number(record?.invoice_amount) || 
    Number(record?.expense_invoice_amount) || 
    Number(record?.amount_collected) || 
    Number(record?.amount_paid) || 
    25000;

  const itemDescription = record?.particulars || record?.description || record?.expense_type || 'Professional Accounting, Bookkeeping & Compliance Services';

  // Zero-rated & Exempt
  const zeroRatedSales = Number(record?.zero_rated_amount ?? record?.zero_rated) || 0;
  const vatExemptSales = Number(record?.vat_exempt_amount ?? record?.vat_exempt) || 0;

  // Deductions
  const discounts = Number(record?.discount ?? record?.discounts ?? record?.less_discount) || 0;
  const withholdingTax = Number(record?.tax_withheld ?? record?.withholding_2307 ?? record?.withholding_2307_2306 ?? record?.less_withholding_tax) || 0;

  let vatableSales = 0;
  let vat = 0;

  if (vatMode === 'VAT') {
    if (record?.vatable_amount !== undefined && record?.vatable_amount !== null && Number(record.vatable_amount) > 0) {
      vatableSales = Number(record.vatable_amount);
      vat = Number(record?.vat_amount ?? record?.output_vat ?? record?.vat_input_amount ?? Math.round((vatableSales * 0.12) * 100) / 100);
    } else {
      // Deconstruct 12% VAT from gross base amount
      const grossSubjectToVat = Math.max(0, rawBaseAmount - zeroRatedSales - vatExemptSales);
      vatableSales = Math.round((grossSubjectToVat / 1.12) * 100) / 100;
      vat = Math.round((grossSubjectToVat - vatableSales) * 100) / 100;
    }
  } else {
    // In NON-VAT regime, VAT is 0.
    vatableSales = rawBaseAmount;
    vat = 0;
  }

  // --- FORMULA 1 ---
  // vatable sales (+) vat (+) zero-rated sales (+) vat-exempt sales = total sales (vat inclusive)
  const totalSalesVatInclusive = Math.round((vatableSales + vat + zeroRatedSales + vatExemptSales) * 100) / 100;

  // --- FORMULA 2 ---
  // total sales (vat inclusive) (-) vat = amount net of vat
  const amountNetOfVat = Math.round((totalSalesVatInclusive - vat) * 100) / 100;

  // --- FORMULA 3 ---
  // amount net of vat (-) discounts (+) vat (-) withholding tax = total amount due
  const totalAmountDue = Math.round((amountNetOfVat - discounts + vat - withholdingTax) * 100) / 100;

  // Items table display (typically ~9 rows)
  const displayItems = record?.items && record.items.length > 0 
    ? record.items 
    : [
        {
          description: itemDescription,
          qty: itemQty,
          unitPrice: itemUnitPrice > 0 ? itemUnitPrice : rawBaseAmount,
          amount: rawBaseAmount
        }
      ];

  const totalEmptyRows = Math.max(0, 9 - displayItems.length);

  // Currency Formatter
  const fmt = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Modal Dialog Card: PURE CLEAN WHITE THEME (NO DARK LEAKS) */}
      <div className="relative w-full max-w-4xl bg-white text-zinc-900 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* ========================================================================= */}
        {/* 1. TOP MODAL TOOLBAR: MODE SWITCHERS, CONTROLS & PRINT                     */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Official BIR Document Preview</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  vatMode === 'VAT' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {vatMode}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase bg-slate-200 text-slate-700">
                  {isPurchaseTransaction ? 'PURCHASE / DISBURSEMENT' : 'SALES / RECEIPT'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                BIR-Compliant Standard Invoice / Receipt Layout • Pure White Hardcopy Replica
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Perspective Switcher (Sales/Receipt vs Purchase/Disbursement) */}
            <button
              type="button"
              onClick={() => setIsPurchaseTransaction(!isPurchaseTransaction)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Switch header between Company (Sales/Receipt) and Provider (Purchase/Disbursement)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>{isPurchaseTransaction ? 'Provider Issued' : 'Company Issued'}</span>
            </button>

            {/* VAT Mode Toggle */}
            <div className="inline-flex rounded-lg bg-slate-200 p-0.5 border border-slate-300">
              <button
                type="button"
                onClick={() => setVatMode('VAT')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  vatMode === 'VAT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                VAT
              </button>
              <button
                type="button"
                onClick={() => setVatMode('NONVAT')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  vatMode === 'NONVAT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NON-VAT
              </button>
            </div>

            {/* Document Title Selector */}
            <select
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer hover:border-blue-500"
            >
              <option value="SALES INVOICE">SALES INVOICE</option>
              <option value="SERVICE INVOICE">SERVICE INVOICE</option>
              <option value="OFFICIAL RECEIPT">OFFICIAL RECEIPT</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="BILLING STATEMENT">BILLING STATEMENT</option>
              <option value="COLLECTION RECEIPT">COLLECTION RECEIPT</option>
            </select>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition shadow-xs"
              title="Print official document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DOCUMENT PREVIEW CANVAS (PURE WHITE BACKGROUND, ALL CRISP BLACK)        */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          
          {/* Paper Container: 100% PURE WHITE WITH CRISP BLACK BORDERS */}
          <div 
            id="bir-printable-invoice"
            className="w-full max-w-[720px] bg-white text-black p-8 sm:p-10 shadow-xl relative select-none font-sans text-xs border-[1.5px] border-black"
            style={{ 
              fontFamily: 'Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif',
              backgroundColor: '#ffffff',
              color: '#000000'
            }}
          >
            
            {/* Top Blue Accent Line (matching preview style) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#004aad]"></div>

            {/* --------------------------------------------------------------------- */}
            {/* A. UPPER LEFT: ISSUING ENTITY INFO                                    */}
            {/* For Sales/Cash Receipts = Selected Company                            */}
            {/* For Purchases/Disbursements = Service Provider                        */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex justify-between items-start pt-2 mb-4 bg-white text-black">
              
              {/* Upper Left Header */}
              <div className="max-w-[420px] leading-tight bg-white text-black">
                <div className="font-black text-sm uppercase tracking-wide text-black">
                  {upperLeftTradeName}
                </div>
                <div className="font-bold text-xs uppercase text-black mt-0.5">
                  {upperLeftLegalName}
                </div>
                <div className="font-bold text-[11px] uppercase tracking-wide text-black mt-0.5">
                  {vatMode === 'VAT' ? 'VAT' : 'NON-VAT'} REG TIN NO. {upperLeftTin}
                </div>
                <div className="text-[10px] text-black uppercase mt-0.5 leading-snug">
                  {upperLeftAddress}
                </div>
              </div>

              {/* Upper Right Header: Document Title & Date Box */}
              <div className="flex flex-col items-end bg-white text-black">
                <div className="font-black text-2xl tracking-tight uppercase text-black">
                  {docTitle}
                </div>
                <div className="font-bold text-xs text-black mt-2">
                  Invoice No. <span className="font-black text-sm text-black">{invoiceNo}</span>
                </div>

                {/* Date Box: 2-column bordered table (100% white & black) */}
                <div className="mt-2 border-[1.5px] border-black bg-white flex items-stretch h-7 w-36">
                  <div className="px-2 font-medium text-[11px] flex items-center border-r-[1.5px] border-black text-black bg-white">
                    Date:
                  </div>
                  <div className="px-2 font-bold text-xs flex items-center justify-center flex-1 text-black font-mono bg-white">
                    {rawDate}
                  </div>
                </div>
              </div>

            </div>

            {/* --------------------------------------------------------------------- */}
            {/* B. TRANSACTION TYPE CHECKBOXES (CASH SALES / CHARGE SALES)            */}
            {/* Checked based on whether transaction is cash sales or on account      */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-1 mb-2.5 text-[11px] font-bold text-black bg-white">
              <label className="flex items-center gap-2 cursor-pointer bg-white text-black">
                <input 
                  type="checkbox" 
                  checked={isCashSales} 
                  onChange={(e) => {
                    setIsCashSales(e.target.checked);
                    if (e.target.checked) setIsChargeSales(false);
                  }}
                  className="w-3.5 h-3.5 bg-white border-[1.5px] border-black rounded-none text-black accent-black focus:ring-0 cursor-pointer"
                />
                <span className="text-black">CASH SALES</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white text-black">
                <input 
                  type="checkbox" 
                  checked={isChargeSales} 
                  onChange={(e) => {
                    setIsChargeSales(e.target.checked);
                    if (e.target.checked) setIsCashSales(false);
                  }}
                  className="w-3.5 h-3.5 bg-white border-[1.5px] border-black rounded-none text-black accent-black focus:ring-0 cursor-pointer"
                />
                <span className="text-black">CHARGE SALES</span>
              </label>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* C. "SOLD TO:" BLOCK WITH DOTTED UNDERLINES                             */}
            {/* For Sales/Cash Receipts = Customer Detail                             */}
            {/* For Purchases/Disbursements = Selected Company Detail                 */}
            {/* --------------------------------------------------------------------- */}
            <div className="border-[1.5px] border-black bg-white mb-4">
              {/* Header strip: light grey background #e5e5e5 with black text */}
              <div className="bg-[#e5e5e5] px-2.5 py-0.5 border-b-[1.5px] border-black font-black text-[11px] uppercase tracking-wider text-black">
                SOLD TO:
              </div>

              {/* Rows with dotted underlines */}
              <div className="p-2 space-y-1.5 text-[11px] text-black bg-white">
                <div className="flex items-baseline bg-white">
                  <span className="font-medium whitespace-nowrap mr-2 text-black">Registered Name :</span>
                  <div className="flex-1 font-bold text-black border-b border-dotted border-black min-h-[16px] px-1 bg-white">
                    {soldToName}
                  </div>
                </div>

                <div className="flex items-baseline bg-white">
                  <span className="font-medium whitespace-nowrap mr-2 text-black">TIN :</span>
                  <div className="flex-1 font-semibold text-black border-b border-dotted border-black min-h-[16px] px-1 font-mono bg-white">
                    {soldToTin}
                  </div>
                </div>

                <div className="flex items-baseline bg-white">
                  <span className="font-medium whitespace-nowrap mr-2 text-black">Business Address :</span>
                  <div className="flex-1 font-medium text-black border-b border-dotted border-black min-h-[16px] px-1 truncate bg-white">
                    {soldToAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* D. ITEMS GRID TABLE (4 COLUMNS, BORDERED, WHITE BACKGROUND)           */}
            {/* --------------------------------------------------------------------- */}
            <div className="border-[1.5px] border-black bg-white mb-4">
              <table className="w-full border-collapse text-left text-xs bg-white text-black">
                <thead>
                  <tr className="border-b-[1.5px] border-black font-bold text-[11px] text-center text-black bg-white">
                    <th className="p-2 border-r-[1.5px] border-black w-[44%] font-bold text-center text-black bg-white">
                      Item Description/<br />Nature of Service
                    </th>
                    <th className="p-2 border-r-[1.5px] border-black w-[16%] font-bold text-center text-black bg-white">
                      Quantity
                    </th>
                    <th className="p-2 border-r-[1.5px] border-black w-[20%] font-bold text-center text-black bg-white">
                      Unit Cost/<br />Price
                    </th>
                    <th className="p-2 w-[20%] font-bold text-center text-black bg-white">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black">
                  {/* Encoded Item Rows */}
                  {displayItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-black h-7 text-[11px] text-black bg-white">
                      <td className="px-2 py-1 border-r-[1.5px] border-black font-medium text-black bg-white">
                        {item.description}
                      </td>
                      <td className="px-2 py-1 border-r-[1.5px] border-black text-center font-mono text-black bg-white">
                        {item.qty || ''}
                      </td>
                      <td className="px-2 py-1 border-r-[1.5px] border-black text-right font-mono text-black bg-white">
                        {fmt(item.unitPrice)}
                      </td>
                      <td className="px-2 py-1 text-right font-bold font-mono text-black bg-white">
                        {fmt(item.amount)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows to complete standard official BIR invoice height */}
                  {Array.from({ length: totalEmptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="border-b border-black h-7 text-[11px] bg-white text-black">
                      <td className="px-2 py-1 border-r-[1.5px] border-black bg-white">&nbsp;</td>
                      <td className="px-2 py-1 border-r-[1.5px] border-black bg-white">&nbsp;</td>
                      <td className="px-2 py-1 border-r-[1.5px] border-black bg-white">&nbsp;</td>
                      <td className="px-2 py-1 bg-white">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* E. BOTTOM SECTION: STRICT BIR FORMULAS FOR VAT & NON-VAT              */}
            {/* --------------------------------------------------------------------- */}
            
            {/* ===================================================================== */}
            {/* CASE 1: NON-VAT PREVIEW (MATCHES SCREENSHOT 122825)                   */}
            {/* ===================================================================== */}
            {vatMode === 'NONVAT' ? (
              <div className="grid grid-cols-2 gap-4 items-start mb-6 bg-white text-black">
                
                {/* NON-VAT LEFT COLUMN: Received line & RED WARNING                     */}
                <div className="flex flex-col justify-between pt-8 pr-4 bg-white text-black">
                  <div className="space-y-4 bg-white text-black">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-black bg-white">
                      <input 
                        type="checkbox" 
                        checked={isReceivedChecked}
                        onChange={(e) => setIsReceivedChecked(e.target.checked)}
                        className="w-3.5 h-3.5 bg-white border-[1.5px] border-black rounded-none text-black accent-black focus:ring-0 cursor-pointer"
                      />
                      <span className="text-black">Received the amount of</span>
                    </label>

                    <div className="w-48 border-b border-black bg-white"></div>
                  </div>

                  {/* Non-VAT BIR Mandatory Warning Text in BOLD RED */}
                  <div className="mt-12 text-[#dc2626] font-black text-center text-xs tracking-tight uppercase leading-snug bg-white">
                    &ldquo;THIS DOCUMENT IS<br />NOT VALID FOR CLAIM<br />OF INPUT TAX.&rdquo;
                  </div>
                </div>

                {/* NON-VAT RIGHT COLUMN: 4-Row Calculation Table & ID/Signature boxes */}
                <div className="bg-white text-black">
                  <div className="border-[1.5px] border-black bg-white">
                    <table className="w-full text-[11px] border-collapse bg-white text-black">
                      <tbody className="bg-white text-black">
                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            Total Sales
                          </td>
                          <td className="px-2.5 text-right font-mono font-bold text-black w-[40%] bg-white">
                            {fmt(totalSalesVatInclusive)}
                          </td>
                        </tr>

                        <tr className="border-b border-black h-8 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black leading-tight text-[10px] bg-white">
                            Less: Discount<br />[SC/PWD/NAAC/MOV/SP]
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(discounts)}
                          </td>
                        </tr>

                        <tr className="border-b-[1.5px] border-black h-7 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            Less: Withholding Tax
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(withholdingTax)}
                          </td>
                        </tr>

                        <tr className="h-8 bg-white">
                          <td className="px-2.5 font-black text-black text-center w-[60%] border-r-[1.5px] border-black text-xs bg-white">
                            TOTAL AMOUNT DUE
                          </td>
                          <td className="px-2.5 text-right font-mono font-black text-black w-[40%] text-xs bg-white">
                            {fmt(totalAmountDue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SC/PWD/NAAC/MOV/ Solo Parent Signature Blocks */}
                  <div className="mt-2 space-y-1 text-[9.5px] bg-white text-black">
                    <div className="flex items-center justify-end gap-1.5 bg-white">
                      <span className="font-semibold text-right leading-tight text-black">
                        SC/PWD/NAAC/MOV/<br />Solo Parent ID No.:
                      </span>
                      <div className="w-28 h-6 border-[1.5px] border-black bg-white"></div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 bg-white">
                      <span className="font-semibold text-right leading-tight text-black">
                        SC/PWD/NAAC/MOV/<br />Signature:
                      </span>
                      <div className="w-28 h-6 border-[1.5px] border-black bg-white"></div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ===================================================================== */
              /* CASE 2: VAT PREVIEW (MATCHES SCREENSHOT 122751 & STRICT USER FORMULAS) */
              /* ===================================================================== */
              <div className="grid grid-cols-2 gap-4 items-start mb-6 bg-white text-black">
                
                {/* VAT LEFT COLUMN: 4-Row VAT Breakdown Table + Received Line          */}
                <div className="bg-white text-black">
                  <div className="border-[1.5px] border-black mb-4 bg-white">
                    <table className="w-full text-[11px] border-collapse bg-white text-black">
                      <tbody className="bg-white text-black">
                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            VATable Sales
                          </td>
                          <td className="px-2.5 text-right font-mono font-bold text-black w-[40%] bg-white">
                            {fmt(vatableSales)}
                          </td>
                        </tr>

                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            VAT
                          </td>
                          <td className="px-2.5 text-right font-mono font-bold text-black w-[40%] bg-white">
                            {fmt(vat)}
                          </td>
                        </tr>

                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            Zero-Rated Sales
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(zeroRatedSales)}
                          </td>
                        </tr>

                        <tr className="h-7 bg-white">
                          <td className="px-2.5 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black bg-white">
                            VAT-Exempt Sales
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(vatExemptSales)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4 pt-2 bg-white text-black">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-black bg-white">
                      <input 
                        type="checkbox" 
                        checked={isReceivedChecked}
                        onChange={(e) => setIsReceivedChecked(e.target.checked)}
                        className="w-3.5 h-3.5 bg-white border-[1.5px] border-black rounded-none text-black accent-black focus:ring-0 cursor-pointer"
                      />
                      <span className="text-black">Received the amount of</span>
                    </label>

                    <div className="w-48 border-b border-black bg-white"></div>
                  </div>
                </div>

                {/* VAT RIGHT COLUMN: 7-Row Calculation Table (FOLLOWS EXACT FORMULA 1, 2, 3) */}
                <div className="bg-white text-black">
                  <div className="border-[1.5px] border-black bg-white">
                    <table className="w-full text-[11px] border-collapse bg-white text-black">
                      <tbody className="bg-white text-black">
                        {/* 1. Total Sales (VAT Inclusive) = VATable + VAT + Zero-Rated + Exempt */}
                        <tr className="border-b border-black h-8 bg-white">
                          <td className="px-2 font-bold text-black text-center w-[60%] border-r-[1.5px] border-black leading-tight text-[10px] bg-white">
                            Total Sales<br />(VAT Inclusive)
                          </td>
                          <td className="px-2.5 text-right font-mono font-bold text-black w-[40%] bg-white">
                            {fmt(totalSalesVatInclusive)}
                          </td>
                        </tr>

                        {/* 2. Less: VAT */}
                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black text-[10.5px] bg-white">
                            Less: VAT
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(vat)}
                          </td>
                        </tr>

                        {/* 3. Amount : Net of VAT = Total Sales (VAT Inclusive) - VAT */}
                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black text-[10.5px] bg-white">
                            Amount : Net of VAT
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(amountNetOfVat)}
                          </td>
                        </tr>

                        {/* 4. Less: Discount [SC/PWD/NAAC/MOV/SP] */}
                        <tr className="border-b border-black h-8 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black leading-tight text-[10px] bg-white">
                            Less: Discount<br />[SC/PWD/NAAC/MOV/SP]
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(discounts)}
                          </td>
                        </tr>

                        {/* 5. Add: VAT */}
                        <tr className="border-b border-black h-7 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black text-[10.5px] bg-white">
                            Add: VAT
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(vat)}
                          </td>
                        </tr>

                        {/* 6. Less: Withholding Tax */}
                        <tr className="border-b-[1.5px] border-black h-7 bg-white">
                          <td className="px-2.5 font-medium text-black text-center w-[60%] border-r-[1.5px] border-black text-[10.5px] bg-white">
                            Less: Withholding Tax
                          </td>
                          <td className="px-2.5 text-right font-mono text-black w-[40%] bg-white">
                            {fmt(withholdingTax)}
                          </td>
                        </tr>

                        {/* 7. TOTAL AMOUNT DUE = Amount Net of VAT - Discount + VAT - Withholding Tax */}
                        <tr className="h-8 bg-white">
                          <td className="px-2.5 font-black text-black text-center w-[60%] border-r-[1.5px] border-black text-xs bg-white">
                            TOTAL AMOUNT DUE
                          </td>
                          <td className="px-2.5 text-right font-mono font-black text-black w-[40%] text-xs bg-white">
                            {fmt(totalAmountDue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SC/PWD/NAAC/MOV/ Solo Parent Signature Blocks */}
                  <div className="mt-2 space-y-1 text-[9.5px] bg-white text-black">
                    <div className="flex items-center justify-end gap-1.5 bg-white">
                      <span className="font-semibold text-right leading-tight text-black">
                        SC/PWD/NAAC/MOV/<br />Solo Parent ID No.:
                      </span>
                      <div className="w-28 h-6 border-[1.5px] border-black bg-white"></div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 bg-white">
                      <span className="font-semibold text-right leading-tight text-black">
                        SC/PWD/NAAC/MOV/<br />Signature:
                      </span>
                      <div className="w-28 h-6 border-[1.5px] border-black bg-white"></div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* F. BOTTOM DIVIDER & OFFICIAL BIR PRINTER FOOTER                        */}
            {/* --------------------------------------------------------------------- */}
            <div className="border-t-[1.5px] border-black pt-2 text-[10px] text-black bg-white">
              <div className="flex flex-col items-end leading-tight font-medium bg-white text-black">
                <div>BIR AUTHORITY TO PRINT NO.: XXXXXXXXXXXXXX</div>
                <div>DATE ISSUED: XX-XXX-XXXX</div>
                <div className="font-bold">APPROVED SERIES: 10 BKLTS 50x2 001-500</div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Bar: Crisp White/Slate background */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Document Preview • <b>All White Receipt Background</b> with Official BIR Borders</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold cursor-pointer transition"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
