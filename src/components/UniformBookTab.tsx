import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Search, 
  Pencil, 
  Trash2, 
  Ban, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Calculator,
  FileText,
  Eye
} from 'lucide-react';
import InvoiceReceiptPreviewModal from './InvoiceReceiptPreviewModal';
import { 
  UniformBookRecord, 
  UniformBookType, 
  UNIFORM_BOOK_HEADERS, 
  Company, 
  Customer, 
  Contractor,
  AccountTitle
} from '../types';
import { 
  getBookDisplayLabel, 
  computeSummaryTotals, 
  generateUniformCsvTemplate, 
  exportUniformBookToExcel, 
  exportUniformBookToCsv, 
  parseUniformImportFile 
} from '../utils/uniformBookExportImport';
import { computeSaleFormulas } from '../utils/accounting';

interface UniformBookTabProps {
  bookType: UniformBookType;
  records: UniformBookRecord[];
  setRecords: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  activeCompany: Company | null;
  allowedCompanyNames?: string[];
  customers?: Customer[];
  contractors?: Contractor[];
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
  // Callback when records change to sync back to legacy states if needed
  onSyncLegacy?: (updated: UniformBookRecord[]) => void;
  accountTitles?: AccountTitle[];
  onDeleteRecord?: (bookType: UniformBookType, record: UniformBookRecord) => void;
  subsidiarySales?: UniformBookRecord[];
}

export default function UniformBookTab({
  bookType,
  records,
  setRecords,
  activeCompany,
  allowedCompanyNames,
  customers = [],
  contractors = [],
  theme,
  triggerAlert,
  globalSearch = '',
  onSyncLegacy,
  accountTitles = [],
  onDeleteRecord,
  subsidiarySales = []
}: UniformBookTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const effectiveCompanyNames = useMemo(() => {
    if (allowedCompanyNames && allowedCompanyNames.length > 0) {
      return allowedCompanyNames;
    }
    return activeCompanyName ? [activeCompanyName] : [];
  }, [allowedCompanyNames, activeCompanyName]);

  const matchesActiveScope = (recCompName?: string) => {
    if (effectiveCompanyNames.length === 0) return true;
    if (!recCompName) return true;
    return effectiveCompanyNames.includes(recCompName);
  };
  const labels = getBookDisplayLabel(bookType);
  const isDisbursementOrPurchase = bookType === 'cash_disbursement' || bookType === 'subsidiary_purchases' || bookType === 'payments' || bookType === 'payments_book';
  const isCollectionsOrPaymentsBook = bookType === 'collections' || bookType === 'collections_book' || bookType === 'payments' || bookType === 'payments_book';

  // Dynamic Chart of Accounts Expenses options
  const selectableExpenseAccounts = useMemo(() => {
    if (!accountTitles || accountTitles.length === 0) {
      return [
        'Operating Expense',
        'Cost of Goods Sold',
        'Rent Expense',
        'Utilities Expense',
        'Salaries & Wages',
        'Office Supplies',
        'Professional Fees',
        'Advertising & Promotion',
        'Taxes & Licenses',
        'Communication Expense',
        'Depreciation Expense',
        'Repairs & Maintenance',
        'Miscellaneous Expense'
      ];
    }
    const filtered = accountTitles
      .filter(a => {
        const type = (a.type || a.account_type || '').toLowerCase();
        const cat = (a.category || a.account_sub_type || '').toLowerCase();
        return type.includes('expense') || type.includes('cost') || cat.includes('expense') || cat.includes('cost');
      })
      .map(a => a.account_title || a.title || '')
      .filter(Boolean);
    return filtered.length > 0 ? Array.from(new Set(filtered)) : [
      'Operating Expense',
      'Rent Expense',
      'Utilities Expense',
      'Salaries & Wages',
      'Office Supplies',
      'Professional Fees',
      'Miscellaneous Expense'
    ];
  }, [accountTitles]);

  const [formBusinessTaxType, setFormBusinessTaxType] = useState<'vatable' | 'non-vatable' | 'vat-exempt' | 'zero-rated'>('vatable');
  const [formExpenseType, setFormExpenseType] = useState('Operating Expense');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVat, setFilterVat] = useState<'ALL' | 'VAT' | 'NONVAT'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'CASH' | 'ON ACCOUNT'>('ALL');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [previewRecord, setPreviewRecord] = useState<UniformBookRecord | null>(null);
  const [collectionsDisplayMode, setCollectionsDisplayMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  // Import State
  const [importedPreview, setImportedPreview] = useState<UniformBookRecord[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isParsingImport, setIsParsingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State (matching uniform headers)
  const [formRegisteredName, setFormRegisteredName] = useState('');
  const [formVatOrNonVat, setFormVatOrNonVat] = useState<'VAT' | 'NONVAT'>(activeCompany?.vat_or_non_vat === 'NON-VATABLE' ? 'NONVAT' : 'VAT');
  const [formTin, setFormTin] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTypeOfTransaction, setFormTypeOfTransaction] = useState<'CASH' | 'ON ACCOUNT'>('CASH');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInvoiceType, setFormInvoiceType] = useState(isDisbursementOrPurchase ? 'OFFICIAL RECEIPT' : 'SALES INVOICE');
  const [formVoucherNo, setFormVoucherNo] = useState('');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formParticulars, setFormParticulars] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnitPrice, setFormUnitPrice] = useState('10000');
  const [formZeroRated, setFormZeroRated] = useState('0');
  const [formVatExempt, setFormVatExempt] = useState('0');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formTaxWithheld, setFormTaxWithheld] = useState('0');

  // Auto-fill TIN formatting
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setFormTin(formatted);

    // Try autofilling customer/provider
    if (digits.length >= 9) {
      if (isDisbursementOrPurchase) {
        const found = contractors.find(c => (c.sp_tin || c.client_TIN || '').replace(/\D/g, '').startsWith(digits.slice(0, 9)));
        if (found) {
          if (!formRegisteredName) setFormRegisteredName(found.registered_name || found.service_provider_name || found.company_name || '');
          if (!formAddress) setFormAddress(found.address || found.sp_address || '');
        }
      } else {
        const found = customers.find(c => (c.client_TIN || c.customer_tin || '').replace(/\D/g, '').startsWith(digits.slice(0, 9)));
        if (found) {
          if (!formRegisteredName) setFormRegisteredName(found.registered_name || found.customer_name || found.company_name || '');
          if (!formAddress) setFormAddress(found.address || found.client_Address || '');
        }
      }
    }
  };

  // Live Formula Calculations
  const liveFormulas = useMemo(() => {
    return computeSaleFormulas({
      qty: parseFloat(formQty) || 0,
      unit_price: parseFloat(formUnitPrice) || 0,
      zero_rated: parseFloat(formZeroRated) || 0,
      vat_exempt: parseFloat(formVatExempt) || 0,
      less_discount: parseFloat(formDiscount) || 0,
      less_withholding_tax: parseFloat(formTaxWithheld) || 0,
      is_vat_registered: formVatOrNonVat === 'VAT'
    });
  }, [formQty, formUnitPrice, formZeroRated, formVatExempt, formDiscount, formTaxWithheld, formVatOrNonVat]);

  // Helper to extract numeric invoice sequence (1, 2, 3...) for Subsidiary Sales sequence tracking
  const extractInvoiceSeq = (invStr?: string): number | null => {
    if (!invStr) return null;
    const trimmed = invStr.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    // Avoid matching 4-digit years like 2026-0001 as 2026; take the trailing number
    const trailingMatch = trimmed.match(/(\d+)\s*$/);
    if (trailingMatch) return parseInt(trailingMatch[1], 10);
    const anyMatch = trimmed.match(/(\d+)/);
    if (anyMatch) return parseInt(anyMatch[1], 10);
    return null;
  };

  // Filtered records (Sorted in strict ascending sequence for Subsidiary Sales so missing invoices are easy to spot)
  const filteredRecords = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    const list = records.filter(r => {
      if (!matchesActiveScope(r.company_name)) {
        return false;
      }
      // Cash Receipts & Cash Disbursements strictly list fully paid transactions only
      if (bookType === 'cash_receipt' || bookType === 'cash_disbursement') {
        const st = String(r.status || '').toLowerCase();
        if (st === 'partial' || st === 'on account') {
          return false;
        }
      }
      if (filterVat !== 'ALL' && r.vat_or_nonvat !== filterVat) {
        return false;
      }
      if (filterType !== 'ALL' && r.type_of_transaction !== filterType) {
        return false;
      }
      if (!q) return true;
      return (
        (r.registered_name || '').toLowerCase().includes(q) ||
        (r.tin || '').includes(q) ||
        (r.invoice_number || '').toLowerCase().includes(q) ||
        (r.voucher_number || '').toLowerCase().includes(q) ||
        (r.particulars || '').toLowerCase().includes(q)
      );
    });

    if (bookType === 'subsidiary_sales') {
      return [...list].sort((a, b) => {
        const seqA = extractInvoiceSeq(a.invoice_number);
        const seqB = extractInvoiceSeq(b.invoice_number);
        if (seqA !== null && seqB !== null && seqA !== seqB) {
          return seqA - seqB;
        }
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });
    }

    return list;
  }, [records, effectiveCompanyNames, bookType, searchTerm, globalSearch, filterVat, filterType]);

  // Missing Invoice Sequence Audit for Subsidiary Sales (checks from Invoice 1 up to max invoice number)
  const invoiceSequenceAudit = useMemo(() => {
    if (bookType !== 'subsidiary_sales') return null;
    const companyRecords = records.filter(r => matchesActiveScope(r.company_name));
    const seqNumbers = companyRecords
      .map(r => extractInvoiceSeq(r.invoice_number))
      .filter((n): n is number => n !== null && n > 0 && n < 100000);

    if (seqNumbers.length === 0) return { min: 0, max: 0, missing: [] as number[], totalTracked: 0 };
    const uniqueSorted = Array.from(new Set(seqNumbers)).sort((a, b) => a - b);
    const maxInv = uniqueSorted[uniqueSorted.length - 1];
    const presentSet = new Set(uniqueSorted);
    const missing: number[] = [];
    // Check sequence starting from Invoice 1 up to maxInv
    for (let i = 1; i <= maxInv; i++) {
      if (!presentSet.has(i)) {
        missing.push(i);
      }
    }
    return {
      min: 1,
      max: maxInv,
      missing,
      totalTracked: uniqueSorted.length
    };
  }, [records, activeCompanyName, bookType]);

  // Totals of currently filtered records
  const summaryTotals = useMemo(() => {
    return computeSummaryTotals(filteredRecords);
  }, [filteredRecords]);

  // Open Add modal with fresh defaults
  const handleOpenAddModal = () => {
    setEditingRecordId(null);
    setFormRegisteredName('');
    setFormVatOrNonVat(activeCompany?.vat_or_non_vat === 'NON-VATABLE' ? 'NONVAT' : 'VAT');
    setFormBusinessTaxType('vatable');
    setFormExpenseType('Operating Expense');
    setFormTin('');
    setFormAddress('');
    setFormTypeOfTransaction('CASH');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormInvoiceType(isDisbursementOrPurchase ? 'OFFICIAL RECEIPT' : 'SALES INVOICE');
    setFormVoucherNo(isDisbursementOrPurchase ? `V-${new Date().getFullYear()}-${String(records.length + 1).padStart(4, '0')}` : '');
    setFormInvoiceNo(`${bookType === 'subsidiary_sales' ? 'SI' : bookType === 'cash_receipt' ? 'CR' : bookType === 'subsidiary_purchases' ? 'PUR' : 'CD'}-${Date.now().toString().slice(-4)}`);
    setFormParticulars('');
    setFormQty('1');
    setFormUnitPrice('10000');
    setFormZeroRated('0');
    setFormVatExempt('0');
    setFormDiscount('0');
    setFormTaxWithheld('0');
    setIsEntryModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (rec: UniformBookRecord) => {
    setEditingRecordId(rec.id);
    setFormRegisteredName(rec.registered_name || '');
    setFormVatOrNonVat(rec.vat_or_nonvat || 'VAT');
    setFormBusinessTaxType((rec.business_tax_type as any) || (rec.vat_or_nonvat === 'VAT' ? 'vatable' : 'non-vatable'));
    setFormExpenseType(rec.expense_type || 'Operating Expense');
    setFormTin(rec.tin || '');
    setFormAddress(rec.address || '');
    setFormTypeOfTransaction(rec.type_of_transaction || 'CASH');
    setFormDate(rec.date || new Date().toISOString().split('T')[0]);
    setFormInvoiceType(rec.invoice_type || 'SALES INVOICE');
    setFormVoucherNo(rec.voucher_number || '');
    setFormInvoiceNo(rec.invoice_number || '');
    setFormParticulars(rec.particulars || '');
    setFormQty(String(rec.qty ?? 1));
    setFormUnitPrice(String(rec.unit_price ?? 0));
    setFormZeroRated(String(rec.zero_rated_amount ?? 0));
    setFormVatExempt(String(rec.vat_exempt_amount ?? 0));
    setFormDiscount(String(rec.discount ?? 0));
    setFormTaxWithheld(String(rec.tax_withheld ?? 0));
    setIsEntryModalOpen(true);
  };

  // Save Add/Edit Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRegisteredName.trim()) {
      triggerAlert('Registered Name is required.', 'error');
      return;
    }
    if (!formInvoiceNo.trim()) {
      triggerAlert('Invoice # is required.', 'error');
      return;
    }

    if (bookType === 'collections') {
      const amtCol = liveFormulas.amount || parseFloat(formUnitPrice) || 0;
      const totDue = liveFormulas.total_amount_due || parseFloat(formUnitPrice) || 0;
      
      // Calculate prior collections for this invoice
      const cleanInv = formInvoiceNo.trim().toLowerCase();
      const priorCols = records.filter(r => 
        r.id !== editingRecordId && 
        !r.is_cancelled && 
        r.invoice_number && 
        r.invoice_number.trim().toLowerCase() === cleanInv
      );
      const prevPaid = priorCols.reduce((sum, r) => sum + (Number(r.amount_collected) || (Number(r.amount) || 0)), 0);

      if (totDue > 0) {
        const remainingDue = Math.max(0, Math.round((totDue - prevPaid) * 100) / 100);
        if (amtCol > remainingDue + 0.01) {
          triggerAlert(`Overpayment Precaution: Collection amount (₱${amtCol.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the remaining balance due of ₱${remainingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} for Invoice #${formInvoiceNo.trim()} (Prior collections: ₱${prevPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} of total due ₱${totDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Customer overpayment is blocked.`, 'error');
          return;
        }
      }
    }

    const newRecord: UniformBookRecord = {
      id: editingRecordId !== null ? editingRecordId : Date.now(),
      company_name: activeCompanyName,
      registered_name: formRegisteredName.trim(),
      vat_or_nonvat: formVatOrNonVat,
      business_tax_type: isDisbursementOrPurchase ? formBusinessTaxType : undefined,
      expense_type: isDisbursementOrPurchase ? formExpenseType : undefined,
      tin: formTin.trim(),
      address: formAddress.trim(),
      type_of_transaction: formTypeOfTransaction,
      date: formDate,
      invoice_type: formInvoiceType,
      voucher_number: formVoucherNo.trim(),
      invoice_number: formInvoiceNo.trim(),
      particulars: formParticulars.trim() || 'General Business Transaction',
      qty: parseFloat(formQty) || 1,
      unit_price: parseFloat(formUnitPrice) || 0,
      amount: liveFormulas.amount,
      vatable_amount: liveFormulas.vatable_sales,
      vat_amount: liveFormulas.vat,
      zero_rated_amount: liveFormulas.zero_rated,
      vat_exempt_amount: liveFormulas.vat_exempt,
      total_amount_vat_inclusive: liveFormulas.total_sale_vat_inclusive,
      total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
      discount: liveFormulas.less_discount,
      tax_withheld: liveFormulas.less_withholding_tax,
      total_amount_due: liveFormulas.total_amount_due,
      is_cancelled: false,
      created_at: new Date().toISOString()
    };

    let updatedList: UniformBookRecord[] = [];
    if (editingRecordId !== null) {
      updatedList = records.map(r => r.id === editingRecordId ? { ...r, ...newRecord } : r);
      triggerAlert(`Updated record ${formInvoiceNo} successfully!`, 'success');
    } else {
      updatedList = [newRecord, ...records];
      triggerAlert(`Added new record ${formInvoiceNo} to database!`, 'success');
    }

    setRecords(() => updatedList);
    if (onSyncLegacy) onSyncLegacy(updatedList);
    setIsEntryModalOpen(false);
  };

  // Toggle Cancel / Active
  const handleToggleCancel = (id: number) => {
    const updated = records.map(r => {
      if (r.id === id) {
        return { ...r, is_cancelled: !r.is_cancelled };
      }
      return r;
    });
    setRecords(() => updated);
    if (onSyncLegacy) onSyncLegacy(updated);
    triggerAlert('Record status updated.', 'info');
  };

  // Delete
  const handleDeleteRecord = (id: number) => {
    const targetRecord = records.find(r => r.id === id);
    if (!targetRecord) return;

    if (onDeleteRecord) {
      onDeleteRecord(bookType, targetRecord);
      return;
    }

    const updated = records.filter(r => r.id !== id);
    setRecords(() => updated);
    if (onSyncLegacy) onSyncLegacy(updated);
    triggerAlert('Record deleted from database.', 'info');
  };

  // Import file handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsParsingImport(true);

    try {
      const parsed = await parseUniformImportFile(file, activeCompanyName);
      setImportedPreview(parsed);
      triggerAlert(`Detected ${parsed.length} records matching uniform database headers!`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerAlert(`Failed to parse file: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsParsingImport(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = (mode: 'append' | 'replace') => {
    if (importedPreview.length === 0) {
      triggerAlert('No valid records to import.', 'error');
      return;
    }

    let updatedList: UniformBookRecord[] = [];
    if (mode === 'replace') {
      updatedList = [...importedPreview];
    } else {
      updatedList = [...importedPreview, ...records];
    }

    setRecords(() => updatedList);
    if (onSyncLegacy) onSyncLegacy(updatedList);
    triggerAlert(`Successfully imported ${importedPreview.length} records into ${labels.title}!`, 'success');
    setIsImportModalOpen(false);
    setImportedPreview([]);
    setImportFileName('');
  };

  if (!activeCompany || !activeCompany.company_name || activeCompany.company_name.trim() === '' || activeCompany.company_name === 'Select Company...') {
    return (
      <div className={`p-8 md:p-12 rounded-2xl border ${theme.borderCard} ${theme.bgCard} text-center space-y-4 max-w-2xl mx-auto my-8 shadow-sm`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${theme.textTitle}`}>
            Entity Profile Required Before Entering Transactions
          </h3>
          <p className={`text-xs ${theme.textMuted} mt-1.5 max-w-md mx-auto leading-relaxed`}>
            Bago ka makapag-enter ng transactions, kailangan mo munang mag-setup ng entity profile kasi saan mapupunta ang transaction kung wala naman itong designated entity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ACTION CONTROLS & SUMMARY KPI CARDS (REDUNDANT TITLE REMOVED PER REQ 4) */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4 shadow-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">Book Table: {bookType}</span>
          </div>

          {/* ACTION BUTTONS: Viewing Notice, Import CSV, Template, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Viewing & Audit Mode • Encode via <strong>Transactions</strong></span>
            </div>

            <button
              onClick={() => {
                setImportedPreview([]);
                setImportFileName('');
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              title="Import CSV or Excel identical to database table"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => generateUniformCsvTemplate(bookType, activeCompanyName)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Download CSV template matching database headers"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>CSV Template</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>

              {isExportMenuOpen && (
                <div 
                  className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl z-30 p-2 text-xs flex flex-col gap-1 ${theme.isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-zinc-900 border-zinc-700 text-zinc-200'}`}
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Export Formats</div>
                  <button
                    onClick={() => {
                      exportUniformBookToExcel({ bookType, companyName: activeCompanyName, records: filteredRecords });
                      setIsExportMenuOpen(false);
                      triggerAlert('Exported multi-sheet Excel (.xlsx) successfully! Sheet 1: Records, Sheet 2: Summary Totals', 'success');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="font-bold">Excel (.xlsx Workbook)</div>
                      <div className="text-[10px] opacity-75">Sheet 1: Table, Sheet 2: Summary Total</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      exportUniformBookToCsv({ bookType, companyName: activeCompanyName, records: filteredRecords, includeSummarySection: true });
                      setIsExportMenuOpen(false);
                      triggerAlert('Exported uniform CSV file with Sheet 1 & Sheet 2 sections!', 'success');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-500 font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-500" />
                    <div>
                      <div className="font-bold">CSV (.csv File)</div>
                      <div className="text-[10px] opacity-75">Sheet 1: Database Table + Sheet 2 Summary</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Records</span>
            <div className="text-xl font-extrabold font-mono mt-0.5 text-zinc-800 dark:text-zinc-100">
              {summaryTotals.totalRecords}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 flex gap-2">
              <span>VAT: <strong className="text-emerald-500">{summaryTotals.vatCount}</strong></span>
              <span>Non-VAT: <strong>{summaryTotals.nonVatCount}</strong></span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Vatable Amount</span>
            <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₱{summaryTotals.totalVatableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Base 100% Net of 12% VAT</div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total 12% VAT Amount</span>
            <div className="text-xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
              ₱{summaryTotals.totalVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Output / Input Tax Due</div>
          </div>

          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Total Net Amount Due</span>
            <div className="text-xl font-extrabold font-mono text-amber-500 mt-0.5">
              ₱{summaryTotals.totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Net of Discounts & Withholding</div>
          </div>
        </div>
      </div>

      {/* SUBSIDIARY SALES: INVOICE SEQUENCE & MISSING INVOICE TRACKER BANNER */}
      {bookType === 'subsidiary_sales' && invoiceSequenceAudit && (
        <div className={`p-3.5 rounded-xl border ${
          invoiceSequenceAudit.missing.length > 0
            ? 'border-rose-500/40 bg-rose-500/10'
            : 'border-emerald-500/30 bg-emerald-500/10'
        } flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <AlertCircle className={`w-4 h-4 shrink-0 ${
              invoiceSequenceAudit.missing.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`} />
            <div>
              <div className={`text-xs font-bold ${
                invoiceSequenceAudit.missing.length > 0 ? 'text-rose-300' : 'text-emerald-300'
              }`}>
                {invoiceSequenceAudit.totalTracked === 0
                  ? 'Invoice Sequence Tracker (Starts at Invoice #1)'
                  : invoiceSequenceAudit.missing.length === 0
                  ? `Invoice Sequence Complete: Invoice #1 to Invoice #${invoiceSequenceAudit.max} (No Missing Invoices)`
                  : `Missing Invoice Alert: ${invoiceSequenceAudit.missing.length} Missing Invoice Number(s) Detected in Sequence (1 to ${invoiceSequenceAudit.max})!`}
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                {invoiceSequenceAudit.totalTracked === 0 ? (
                  <span>Subsidiary Sales tracks all invoices in strict numerical sequence starting from Invoice 1 so any skipped or missing invoice is immediately identified.</span>
                ) : invoiceSequenceAudit.missing.length > 0 ? (
                  <span>
                    Missing Invoice #(s):{' '}
                    <strong className="font-mono text-rose-300 underline">
                      {invoiceSequenceAudit.missing.slice(0, 20).map(n => `#${n}`).join(', ')}
                      {invoiceSequenceAudit.missing.length > 20 ? ` ...and ${invoiceSequenceAudit.missing.length - 20} more` : ''}
                    </strong>
                  </span>
                ) : (
                  <span>All {invoiceSequenceAudit.totalTracked} invoice(s) are accounted for in unbroken sequence.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTIONS BOOK COLLAPSIBLE INVOICE GROUPING VIEW */}
      {bookType === 'collections' && (
        <div className={`p-3 rounded-xl border ${theme.borderCard} ${theme.bgCard} flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400">Collections Book Display Mode:</span>
            <span className="text-[11px] text-zinc-400">Click any Invoice row below to collapse or expand all individual collections (COLLECTION 1, COLLECTION 2, etc.) made for that sale.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCollectionsDisplayMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                collectionsDisplayMode === 'grouped'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Group by Invoice (Collapsible)
            </button>
            <button
              type="button"
              onClick={() => setCollectionsDisplayMode('flat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                collectionsDisplayMode === 'flat'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Show All Payments (Flat List)
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className={`p-3 rounded-xl border ${theme.borderCard} ${theme.bgCard} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 ml-1" />
          <input
            type="text"
            placeholder="Search registered name, TIN, invoice #, voucher #, particulars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-2 py-1 text-xs bg-transparent border rounded-lg focus:outline-none ${theme.borderInput} ${theme.textMain}`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterVat}
            onChange={(e) => setFilterVat(e.target.value as any)}
            className={`text-xs px-2.5 py-1 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
          >
            <option value="ALL">All Tax Status</option>
            <option value="VAT">VAT Only</option>
            <option value="NONVAT">NON-VAT Only</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={`text-xs px-2.5 py-1 rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
          >
            <option value="ALL">All Transaction Types</option>
            <option value="CASH">Cash</option>
            <option value="ON ACCOUNT">On Account</option>
          </select>

          {(searchTerm || filterVat !== 'ALL' || filterType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterVat('ALL');
                setFilterType('ALL');
              }}
              className="text-xs text-rose-500 hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* SPREADSHEET TABLE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-xs overflow-hidden`}>
        <div className="overflow-x-auto max-h-[640px]">
          {bookType === 'cash_receipt' ? (
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className={`${theme.isLight ? 'bg-slate-100 text-slate-600' : 'bg-zinc-900 text-zinc-400'} uppercase font-bold text-[10px] tracking-wider border-b ${theme.borderCard}`}>
                  <th className={`p-3 text-center min-w-[105px] sticky left-0 z-20 ${theme.isLight ? 'bg-slate-100 border-r border-slate-200 text-slate-700' : 'bg-zinc-900 border-r border-zinc-800 text-zinc-300'}`}>ACTIONS</th>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3 min-w-[110px] font-mono">DATE</th>
                  <th className="p-3 min-w-[200px]">CUSTOMER NAME</th>
                  <th className="p-3 min-w-[240px]">PARTICULARS</th>
                  <th className="p-3 min-w-[130px] font-mono text-cyan-600 dark:text-cyan-400">INVOICE NUMBER</th>
                  <th className="p-3 min-w-[160px] text-right font-mono text-emerald-600 dark:text-emerald-400">CASH - DEBIT (CASH RECEIVED)</th>
                  <th className="p-3 min-w-[210px] text-right font-mono text-amber-600 dark:text-amber-400">CREDITABLE WITHHOLDING TAX - DEBIT</th>
                  <th className="p-3 min-w-[140px] text-right font-mono text-rose-600 dark:text-rose-400">DISCOUNTS - DEBIT</th>
                  <th className="p-3 min-w-[170px] text-right font-mono text-cyan-600 dark:text-cyan-400">SALES (A/R) - CREDIT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-zinc-400">
                      No fully paid invoices recorded in Cash Receipts yet.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => {
                    const isCancelled = r.is_cancelled;
                    const grossSalesCredit = Number(r.total_amount_vat_inclusive || r.amount) || 0;
                    const discountDebit = Number(r.discount) || 0;
                    const cwtDebit = Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0;
                    const cashDebit = r.amount_collected !== undefined && Number(r.amount_collected) > 0
                      ? Number(r.amount_collected)
                      : Math.max(0, Math.round((grossSalesCredit - discountDebit - cwtDebit) * 100) / 100);

                    return (
                      <tr
                        key={r.id}
                        className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500 line-through' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'} transition-colors`}
                      >
                        <td className={`p-2.5 text-center sticky left-0 z-10 border-r ${
                          theme.isLight
                            ? 'bg-white border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                            : 'bg-zinc-950/95 border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setPreviewRecord(r)}
                              title="Preview Official Receipt / Invoice"
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                theme.isLight
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              title="Edit Record"
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                theme.isLight
                                  ? 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100'
                                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(r.id)}
                              title="Delete Cash Receipt"
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                theme.isLight
                                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className={`p-3 text-center text-[10px] font-mono ${theme.textMuted}`}>{idx + 1}</td>
                        <td className={`p-3 font-mono ${theme.textMain}`}>{r.date}</td>
                        <td className={`p-3 font-semibold ${isCancelled ? 'text-zinc-500' : theme.textTitle}`}>
                          {r.registered_name}
                        </td>
                        <td className={`p-3 max-w-[280px] truncate ${theme.textMain}`} title={r.particulars}>
                          {r.particulars || `Full Settlement for Invoice #${r.invoice_number}`}
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(r)}
                            className="hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left text-cyan-600 dark:text-cyan-400 hover:opacity-80"
                            title="Click to preview official BIR Invoice / Receipt"
                          >
                            <span>{r.invoice_number}</span>
                            <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                          </button>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₱{cashDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                          ₱{cwtDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          ₱{discountDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                          ₱{grossSalesCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredRecords.length > 0 && (
                <tfoot className={`${theme.isLight ? 'bg-slate-100 border-t-2 border-slate-300' : 'bg-zinc-900/90 border-t-2 border-zinc-700'} font-mono font-bold text-xs`}>
                  <tr>
                    <td className={`p-3 sticky left-0 ${theme.isLight ? 'bg-slate-100 border-r border-slate-200' : 'bg-zinc-900 border-r border-zinc-800'}`}></td>
                    <td colSpan={5} className={`p-3 text-right uppercase tracking-wider font-bold ${theme.textMuted}`}>
                      TOTAL CASH RECEIPTS (DEBIT = CREDIT):
                    </td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                      ₱{filteredRecords
                        .filter(r => !r.is_cancelled)
                        .reduce((sum, r) => {
                          const gross = Number(r.total_amount_vat_inclusive || r.amount) || 0;
                          const disc = Number(r.discount) || 0;
                          const cwt = Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0;
                          const cash = r.amount_collected !== undefined && Number(r.amount_collected) > 0
                            ? Number(r.amount_collected)
                            : Math.max(0, Math.round((gross - disc - cwt) * 100) / 100);
                          return sum + cash;
                        }, 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-extrabold">
                      ₱{filteredRecords
                        .filter(r => !r.is_cancelled)
                        .reduce((sum, r) => sum + (Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0), 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-extrabold">
                      ₱{filteredRecords
                        .filter(r => !r.is_cancelled)
                        .reduce((sum, r) => sum + (Number(r.discount) || 0), 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-cyan-600 dark:text-cyan-400 font-black text-sm">
                      ₱{filteredRecords
                        .filter(r => !r.is_cancelled)
                        .reduce((sum, r) => sum + (Number(r.total_amount_vat_inclusive || r.amount) || 0), 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className={`${theme.isLight ? 'bg-slate-100 text-slate-600' : 'bg-zinc-900 text-zinc-400'} uppercase font-bold text-[10px] tracking-wider border-b ${theme.borderCard}`}>
                <th className={`p-3 text-center min-w-[115px] sticky left-0 z-20 ${theme.isLight ? 'bg-slate-100 border-r border-slate-200 text-slate-700' : 'bg-zinc-900 border-r border-zinc-800 text-zinc-300'}`}>ACTIONS</th>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 min-w-[120px]">STATUS</th>
                <th className="p-3 min-w-[200px]">1. REGISTERED NAME</th>
                <th className="p-3 min-w-[110px]">2. VAT OR NONVAT</th>
                <th className="p-3 min-w-[130px] font-mono">3. TIN</th>
                <th className="p-3 min-w-[180px]">4. ADDRESS</th>
                <th className="p-3 min-w-[140px]">5. TYPE OF TRANSACTION</th>
                <th className="p-3 min-w-[100px] font-mono">6. DATE</th>
                <th className="p-3 min-w-[140px]">7. INVOICE TYPE</th>
                <th className={`p-3 min-w-[120px] font-mono ${isDisbursementOrPurchase ? 'text-amber-600 dark:text-amber-500 font-extrabold' : ''}`}>
                  7.1 VOUCHER #
                </th>
                {isDisbursementOrPurchase && (
                  <>
                    <th className="p-3 min-w-[140px] text-purple-600 dark:text-purple-400 font-bold">BUSINESS TAX TYPE</th>
                    <th className="p-3 min-w-[150px] text-indigo-600 dark:text-indigo-400 font-bold">EXPENSE TYPE</th>
                  </>
                )}
                <th className="p-3 min-w-[110px] font-mono font-bold text-cyan-600 dark:text-cyan-500">8. INVOICE #</th>
                <th className="p-3 min-w-[200px]">9. PARTICULARS</th>
                <th className="p-3 min-w-[70px] text-right font-mono">10. QTY</th>
                <th className="p-3 min-w-[100px] text-right font-mono">11. UNIT PRICE</th>
                <th className="p-3 min-w-[110px] text-right font-mono font-bold">12. AMOUNT</th>
                <th className="p-3 min-w-[120px] text-right font-mono text-emerald-600 dark:text-emerald-500">13. VATABLE AMOUNT</th>
                <th className="p-3 min-w-[110px] text-right font-mono text-cyan-600 dark:text-cyan-500">14. VAT AMOUNT</th>
                <th className="p-3 min-w-[110px] text-right font-mono">15. ZERO RATED</th>
                <th className="p-3 min-w-[110px] text-right font-mono">16. VAT EXEMPT</th>
                <th className="p-3 min-w-[130px] text-right font-mono">17. VAT INCLUSIVE</th>
                <th className="p-3 min-w-[130px] text-right font-mono">18. NET OF VAT</th>
                <th className="p-3 min-w-[90px] text-right font-mono text-rose-600 dark:text-rose-400">19. DISCOUNT</th>
                <th className="p-3 min-w-[100px] text-right font-mono text-amber-600 dark:text-amber-500">20. TAX WITHHELD</th>
                <th className="p-3 min-w-[130px] text-right font-mono font-extrabold text-amber-600 dark:text-amber-500">21. TOTAL DUE</th>
                {isCollectionsOrPaymentsBook && (
                  <>
                    <th className="p-3 min-w-[140px] text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {isDisbursementOrPurchase ? '22. CASH PAID' : '22. CASH RECEIVED'}
                    </th>
                    <th className="p-3 min-w-[140px] text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                      23. PENDING BALANCE
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={(isDisbursementOrPurchase ? 27 : 25) + (isCollectionsOrPaymentsBook ? 2 : 0)} className="p-8 text-center text-zinc-400">
                    No records found in this register. Encode new transactions via &quot;Other Transactions&quot; ➔ &quot;Sales / Purchase Transaction&quot;.
                  </td>
                </tr>
              ) : bookType === 'collections' && collectionsDisplayMode === 'grouped' ? (
                (() => {
                  const groupsMap = new Map<string, UniformBookRecord[]>();

                  // Seed with all sales on account / partial sales from subsidiarySales matching active scope
                  if (subsidiarySales && subsidiarySales.length > 0) {
                    subsidiarySales.forEach(s => {
                      if (!matchesActiveScope(s.company_name) || s.is_cancelled) return;
                      const isSaleOnAccountOrPartial = (s.type_of_transaction || '').toUpperCase().includes('ACCOUNT') ||
                        (s.status || '').toLowerCase().includes('account') ||
                        (s.status || '').toLowerCase().includes('partial') ||
                        (Number(s.down_payment) > 0);
                      if (isSaleOnAccountOrPartial && s.invoice_number) {
                        const key = s.invoice_number.trim().toUpperCase();
                        if (!groupsMap.has(key)) {
                          groupsMap.set(key, []);
                        }
                      }
                    });
                  }

                  filteredRecords.forEach(r => {
                    const key = (r.invoice_number || `NO-INV-${r.id}`).trim().toUpperCase();
                    if (!groupsMap.has(key)) groupsMap.set(key, []);
                    groupsMap.get(key)!.push(r);
                  });

                  const groups = Array.from(groupsMap.entries());
                  return groups.map(([invKey, groupRows], groupIdx) => {
                    // Sort collections chronologically (oldest first: COLLECTION 1, COLLECTION 2, etc.)
                    const sortedPayments = [...groupRows].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
                    const matchingSale = subsidiarySales?.find(s => s.invoice_number && s.invoice_number.trim().toUpperCase() === invKey);
                    const primary = matchingSale || sortedPayments[sortedPayments.length - 1] || sortedPayments[0] || {} as UniformBookRecord;
                    const isExpanded = expandedInvoices[invKey] !== undefined ? expandedInvoices[invKey] : true;

                    const totalDueVal = Number(primary.total_amount_due || primary.amount) || 0;
                    const withheldVal = Number(primary.tax_withheld || primary.amount_withheld_2307 || primary.withholding_tax_2307) || 0;
                    const netCashTarget = Math.max(0, Math.round((totalDueVal - withheldVal) * 100) / 100);

                    const activePayments = sortedPayments.filter(p => !p.is_cancelled && (p.amount_collected !== undefined ? Number(p.amount_collected) : 0) > 0);
                    const totalCashCollectedForInvoice = sortedPayments
                      .filter(p => !p.is_cancelled)
                      .reduce((sum, p) => {
                        const cVal = p.amount_collected !== undefined
                          ? Number(p.amount_collected)
                          : (p.status === 'Paid' || p.status === 'Cash' ? netCashTarget : 0);
                        return sum + cVal;
                      }, 0);

                    const invoicePendingBalance = Math.max(0, Math.round((netCashTarget - totalCashCollectedForInvoice) * 100) / 100);
                    const isFullyPaid = invoicePendingBalance <= 0.01 && totalCashCollectedForInvoice > 0;
                    const isPartial = !isFullyPaid && totalCashCollectedForInvoice > 0;

                    return (
                      <React.Fragment key={invKey}>
                        {/* PARENT INVOICE ROW (CLICK TO COLLAPSE/EXPAND) */}
                        <tr
                          onClick={() => setExpandedInvoices(prev => ({ ...prev, [invKey]: !isExpanded }))}
                          className={`cursor-pointer border-t-2 ${
                            theme.isLight ? 'border-slate-200 bg-slate-100/90 hover:bg-slate-200/70' : 'border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/80'
                          } transition-colors`}
                          title="Click to collapse/expand all collections made for this Invoice"
                        >
                          <td
                            className={`p-2.5 text-center sticky left-0 z-10 border-r ${
                              theme.isLight
                                ? 'bg-slate-100 border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                                : 'bg-zinc-900 border-zinc-800'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPreviewRecord(primary)}
                                title="Preview Invoice"
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  theme.isLight
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(primary.id)}
                                title="Delete Collection Record"
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  theme.isLight
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            {isExpanded ? '▼' : '▶'} {groupIdx + 1}
                          </td>
                          <td className="p-3">
                            {isFullyPaid ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                PAID ({activePayments.length} {activePayments.length === 1 ? 'COLLECTION' : 'COLLECTIONS'})
                              </span>
                            ) : isPartial ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                                PARTIAL ({activePayments.length} {activePayments.length === 1 ? 'COLLECTION' : 'COLLECTIONS'})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                ON ACCOUNT (0 COLLECTIONS)
                              </span>
                            )}
                          </td>
                          <td className={`p-3 font-bold ${theme.textTitle}`}>{primary.registered_name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              primary.vat_or_nonvat === 'VAT'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20'
                            }`}>
                              {primary.vat_or_nonvat}
                            </span>
                          </td>
                          <td className={`p-3 font-mono ${theme.textMuted}`}>{primary.tin}</td>
                          <td className={`p-3 max-w-[200px] truncate ${theme.textMuted}`}>{primary.address || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              INVOICE SUMMARY
                            </span>
                          </td>
                          <td className={`p-3 font-mono ${theme.textMuted}`}>{primary.date}</td>
                          <td className={`p-3 ${theme.textMain}`}>{primary.invoice_type}</td>
                          <td className="p-3 font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {activePayments.length} payment(s)
                          </td>
                          <td className="p-3 font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{primary.invoice_number}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                                {isExpanded ? 'Hide Collections' : `Show ${activePayments.length} Collection(s)`}
                              </span>
                            </span>
                          </td>
                          <td className={`p-3 font-semibold max-w-[240px] truncate ${theme.textMain}`}>
                            Invoice #{primary.invoice_number} — Click to {isExpanded ? 'collapse' : 'view'} collections
                          </td>
                          <td className="p-3 text-right font-mono">{primary.qty}</td>
                          <td className="p-3 text-right font-mono">₱{(primary.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`p-3 text-right font-mono font-bold ${theme.textTitle}`}>
                            ₱{(primary.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            ₱{(primary.vatable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                            ₱{(primary.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono ${theme.textMuted}`}>
                            ₱{(primary.zero_rated_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono ${theme.textMuted}`}>
                            ₱{(primary.vat_exempt_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono ${theme.textMain}`}>
                            ₱{(primary.total_amount_vat_inclusive || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono ${theme.textMain}`}>
                            ₱{(primary.total_amount_net_of_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                            ₱{(primary.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            ₱{(primary.tax_withheld || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-500">
                            ₱{(primary.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₱{totalCashCollectedForInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                            ₱{invoicePendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {/* CHILD COLLECTION ROWS (COLLECTION 1, COLLECTION 2, COLLECTION 3...) */}
                        {isExpanded && (() => {
                          let runningCollected = 0;
                          return sortedPayments.map((payment, pIdx) => {
                            const payAmt = payment.amount_collected !== undefined
                              ? Number(payment.amount_collected)
                              : (payment.status === 'Paid' || payment.status === 'Cash' ? netCashTarget : 0);
                            if (!payment.is_cancelled) {
                              runningCollected += payAmt;
                            }
                            const runningPending = Math.max(0, Math.round((netCashTarget - runningCollected) * 100) / 100);
                            const isZeroPlaceholder = payAmt === 0 && sortedPayments.length === 1;

                            return (
                              <tr
                                key={payment.id}
                                className={`${
                                  payment.is_cancelled
                                    ? 'bg-rose-950/20 text-zinc-500 line-through'
                                    : theme.isLight ? 'bg-cyan-50/40 hover:bg-cyan-50/80' : 'bg-cyan-950/15 hover:bg-cyan-950/25'
                                } text-[11px] border-l-4 border-l-cyan-500 transition-colors`}
                              >
                                <td className={`p-2 text-center sticky left-0 z-10 border-r ${
                                  theme.isLight
                                    ? 'bg-white border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                                    : 'bg-zinc-950/90 border-zinc-800'
                                }`}>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditModal(payment)}
                                      title="Edit Collection"
                                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                        theme.isLight
                                          ? 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100'
                                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                                      }`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(payment.id)}
                                      title="Delete Collection"
                                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                        theme.isLight
                                          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                      }`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-mono text-cyan-600 dark:text-cyan-400 pl-3">
                                  ↳ #{pIdx + 1}
                                </td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isZeroPlaceholder
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    {isZeroPlaceholder ? 'NO PAYMENT YET' : `COLLECTION ${pIdx + 1}`}
                                  </span>
                                </td>
                                <td className={`p-2.5 pl-4 font-medium ${theme.textTitle}`}>
                                  {isZeroPlaceholder ? 'Awaiting 1st Collection' : `COLLECTION ${pIdx + 1} — ${payment.registered_name}`}
                                </td>
                                <td className={`p-2.5 ${theme.textMuted}`}>{payment.vat_or_nonvat}</td>
                                <td className={`p-2.5 font-mono ${theme.textMuted}`}>{payment.tin}</td>
                                <td className={`p-2.5 truncate max-w-[160px] ${theme.textMuted}`}>{payment.address || '-'}</td>
                                <td className="p-2.5 font-mono text-cyan-600 dark:text-cyan-300">{payment.type_of_transaction}</td>
                                <td className={`p-2.5 font-mono font-bold ${theme.textTitle}`}>{payment.date}</td>
                                <td className={`p-2.5 ${theme.textMuted}`}>{payment.invoice_type}</td>
                                <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">{payment.voucher_number || `COLL-${pIdx + 1}`}</td>
                                <td className="p-2.5 font-mono text-cyan-600 dark:text-cyan-400">{payment.invoice_number}</td>
                                <td className={`p-2.5 font-medium max-w-[240px] truncate ${theme.textMain}`} title={payment.particulars}>
                                  {payment.particulars}
                                </td>
                                <td className="p-2.5 text-right font-mono text-zinc-400">-</td>
                                <td className="p-2.5 text-right font-mono text-zinc-400">-</td>
                                <td className={`p-2.5 text-right font-mono ${theme.textMuted}`}>
                                  ₱{(payAmt > 0 ? payAmt : (payment.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-2.5 text-right font-mono ${theme.textMuted}`}>
                                  ₱{(payment.vatable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-2.5 text-right font-mono ${theme.textMuted}`}>
                                  ₱{(payment.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono text-zinc-400">-</td>
                                <td className="p-2.5 text-right font-mono text-zinc-400">-</td>
                                <td className={`p-2.5 text-right font-mono ${theme.textMuted}`}>
                                  ₱{(payAmt > 0 ? payAmt : (payment.total_amount_vat_inclusive || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-2.5 text-right font-mono ${theme.textMuted}`}>
                                  ₱{(payment.total_amount_net_of_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                                  ₱{(payment.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                                  ₱{(payment.tax_withheld || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono text-amber-600/80 dark:text-amber-400/80">
                                  ₱{(payment.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                  ₱{payAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                  ₱{runningPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </React.Fragment>
                    );
                  });
                })()
              ) : (
                filteredRecords.map((r, idx) => {
                  const isCancelled = r.is_cancelled;
                  const totalDueVal = Number(r.total_amount_due || r.amount) || 0;
                  const withheldVal = Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0;
                  const netCashTarget = Math.max(0, Math.round((totalDueVal - withheldVal) * 100) / 100);
                  const cashReceivedOrPaid = isDisbursementOrPurchase
                    ? (r.amount_paid !== undefined ? Number(r.amount_paid) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0))
                    : (r.amount_collected !== undefined ? Number(r.amount_collected) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0));
                  const pendingBalanceVal = r.pending_balance !== undefined
                    ? Number(r.pending_balance)
                    : (r.status === 'Paid' || r.status === 'Cash' ? 0 : Math.max(0, Math.round((netCashTarget - cashReceivedOrPaid) * 100) / 100));

                  return (
                    <tr 
                      key={r.id} 
                      className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500 line-through' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'} transition-colors`}
                    >
                      <td className={`p-2.5 text-center sticky left-0 z-10 border-r ${
                        theme.isLight
                          ? 'bg-white border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]'
                          : 'bg-zinc-950/90 border-zinc-800'
                      }`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewRecord(r)}
                            title="Preview Official BIR Invoice / Receipt (VAT or Non-VAT)"
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              theme.isLight
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Edit Record"
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              theme.isLight
                                ? 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100'
                                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleCancel(r.id)}
                            title={isCancelled ? "Restore" : "Cancel"}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              theme.isLight
                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            {isCancelled ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            title="Delete"
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              theme.isLight
                                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className={`p-3 text-center text-[10px] font-mono ${theme.textMuted}`}>{idx + 1}</td>
                      <td className="p-3">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            VOID / CANCELLED
                          </span>
                        ) : r.status === 'Paid' || r.status === 'Cash' || (r.type_of_transaction === 'CASH' && !r.status) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PAID
                          </span>
                        ) : r.status === 'Partial' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {r.status || 'ON ACCOUNT'}
                          </span>
                        )}
                      </td>
                      <td className={`p-3 font-semibold ${isCancelled ? 'text-zinc-500' : theme.textTitle}`}>
                        {r.registered_name}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.vat_or_nonvat === 'VAT' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20' 
                            : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {r.vat_or_nonvat}
                        </span>
                      </td>
                      <td className={`p-3 font-mono ${theme.textMuted}`}>{r.tin}</td>
                      <td className={`p-3 max-w-[200px] truncate ${theme.textMuted}`} title={r.address}>{r.address || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.type_of_transaction === 'CASH'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}>
                          {r.type_of_transaction}
                        </span>
                      </td>
                      <td className={`p-3 font-mono ${theme.textMuted}`}>{r.date}</td>
                      <td className={`p-3 ${theme.textMain}`}>{r.invoice_type}</td>
                      <td className={`p-3 font-mono font-semibold ${r.voucher_number ? 'text-amber-600 dark:text-amber-400' : theme.textMuted}`}>
                        {r.voucher_number || '-'}
                      </td>
                      {isDisbursementOrPurchase && (
                        <>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (r.business_tax_type || '').toLowerCase() === 'vatable' || r.vat_or_nonvat === 'VAT'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : (r.business_tax_type || '').toLowerCase() === 'zero-rated'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : (r.business_tax_type || '').toLowerCase() === 'vat-exempt'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {r.business_tax_type || (r.vat_or_nonvat === 'VAT' ? 'vatable' : 'non-vatable')}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-300">
                            {r.expense_type || 'Operating Expense'}
                          </td>
                        </>
                      )}
                      <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        <button
                          type="button"
                          onClick={() => setPreviewRecord(r)}
                          className="hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left text-cyan-600 dark:text-cyan-400 hover:opacity-80"
                          title="Click to preview official BIR Invoice / Receipt (VAT or Non-VAT)"
                        >
                          <span>{r.invoice_number}</span>
                          <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className={`p-3 max-w-[240px] truncate ${theme.textMain}`} title={r.particulars}>{r.particulars}</td>
                      <td className="p-3 text-right font-mono">{r.qty}</td>
                      <td className="p-3 text-right font-mono">₱{(r.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`p-3 text-right font-mono font-bold ${theme.textTitle}`}>
                        ₱{(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        ₱{(r.vatable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                        ₱{(r.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono ${theme.textMuted}`}>
                        ₱{(r.zero_rated_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono ${theme.textMuted}`}>
                        ₱{(r.vat_exempt_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono ${theme.textMain}`}>
                        ₱{(r.total_amount_vat_inclusive || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono ${theme.textMain}`}>
                        ₱{(r.total_amount_net_of_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        ₱{(r.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        ₱{(r.tax_withheld || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-500">
                        ₱{(r.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {isCollectionsOrPaymentsBook && (
                        <>
                          <td className="p-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₱{cashReceivedOrPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                            ₱{pendingBalanceVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* SUMMARY FOOTER: Totals for all numeric columns */}
            {filteredRecords.length > 0 && (
              <tfoot className={`${theme.isLight ? 'bg-slate-100 border-t-2 border-slate-300' : 'bg-zinc-900/90 border-t-2 border-zinc-700'} font-mono font-bold text-xs`}>
                <tr>
                  <td className={`p-3 sticky left-0 ${theme.isLight ? 'bg-slate-100 border-r border-slate-200' : 'bg-zinc-900 border-r border-zinc-800'}`}></td>
                  <td colSpan={isDisbursementOrPurchase ? 16 : 14} className={`p-3 text-right uppercase tracking-wider font-bold ${theme.textMuted}`}>
                    SUMMARY TOTAL OF RECORDS:
                  </td>
                  <td className={`p-3 text-right font-extrabold ${theme.textTitle}`}>
                    ₱{summaryTotals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                    ₱{summaryTotals.totalVatableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-cyan-600 dark:text-cyan-400 font-extrabold">
                    ₱{summaryTotals.totalVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right ${theme.textMuted}`}>
                    ₱{summaryTotals.totalZeroRatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right ${theme.textMuted}`}>
                    ₱{summaryTotals.totalVatExemptAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right ${theme.textMain}`}>
                    ₱{summaryTotals.totalAmountVatInclusive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right ${theme.textMain}`}>
                    ₱{summaryTotals.totalAmountNetOfVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                    ₱{summaryTotals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-amber-600 dark:text-amber-400">
                    ₱{summaryTotals.totalTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-black text-sm">
                    ₱{summaryTotals.totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {isCollectionsOrPaymentsBook && (
                    <>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        ₱{filteredRecords
                          .filter(r => !r.is_cancelled)
                          .reduce((sum, r) => {
                            const totalDueVal = Number(r.total_amount_due || r.amount) || 0;
                            const withheldVal = Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0;
                            const netCashTarget = Math.max(0, Math.round((totalDueVal - withheldVal) * 100) / 100);
                            const val = isDisbursementOrPurchase
                              ? (r.amount_paid !== undefined ? Number(r.amount_paid) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0))
                              : (r.amount_collected !== undefined ? Number(r.amount_collected) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0));
                            return sum + val;
                          }, 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-black text-sm">
                        ₱{filteredRecords
                          .filter(r => !r.is_cancelled)
                          .reduce((sum, r) => {
                            const totalDueVal = Number(r.total_amount_due || r.amount) || 0;
                            const withheldVal = Number(r.tax_withheld || r.amount_withheld_2307 || r.withholding_tax_2307) || 0;
                            const netCashTarget = Math.max(0, Math.round((totalDueVal - withheldVal) * 100) / 100);
                            const cashVal = isDisbursementOrPurchase
                              ? (r.amount_paid !== undefined ? Number(r.amount_paid) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0))
                              : (r.amount_collected !== undefined ? Number(r.amount_collected) : (r.status === 'Paid' || r.status === 'Cash' ? netCashTarget : 0));
                            const pendVal = r.pending_balance !== undefined
                              ? Number(r.pending_balance)
                              : (r.status === 'Paid' || r.status === 'Cash' ? 0 : Math.max(0, Math.round((netCashTarget - cashVal) * 100) / 100));
                            return sum + pendVal;
                          }, 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
          )}
        </div>
      </div>

      {/* IMPORT MODAL: WITH TEMPLATE GENERATOR & PREVIEW MATCHING DATABASE TABLE */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-5xl rounded-2xl border shadow-2xl p-6 relative max-h-[90vh] flex flex-col ${theme.isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold">Import CSV / Excel — {labels.title}</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Upload your file. The table below displays an exact match of the database headers (Sheet 1) for full accuracy and uniform alignment.
            </p>

            {/* Template generator banner */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Uniform CSV File Generator (In Line Sa Database)</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Download the blank pre-formatted CSV with the exact uniform headers matching the database schema.
                </div>
              </div>
              <button
                onClick={() => generateUniformCsvTemplate(bookType, activeCompanyName)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* File Upload Selector */}
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-5 text-center mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                id="uniform-file-upload"
              />
              <label 
                htmlFor="uniform-file-upload"
                className="cursor-pointer inline-flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  {importFileName ? `Selected: ${importFileName}` : 'Click here or drop your CSV or Excel file'}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Supports .csv, .xlsx, and .xls (Auto-detects Sheet 1 database table)
                </div>
              </label>
            </div>

            {/* Preview of Parsed Records */}
            {isParsingImport && (
              <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">
                Parsing data and aligning with uniform database columns...
              </div>
            )}

            {importedPreview.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-zinc-300">
                    Preview: {importedPreview.length} records parsed matching database schema
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Uniform Headers Validated</span>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto border border-zinc-700 rounded-xl max-h-60 text-[11px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-zinc-800 text-zinc-400 sticky top-0 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">VAT/Non</th>
                        <th className="p-2">TIN</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Voucher #</th>
                        <th className="p-2">Particulars</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-right">Vatable</th>
                        <th className="p-2 text-right">VAT</th>
                        <th className="p-2 text-right">Net Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {importedPreview.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50">
                          <td className="p-2 font-semibold">{item.registered_name}</td>
                          <td className="p-2">{item.vat_or_nonvat}</td>
                          <td className="p-2 font-mono text-zinc-400">{item.tin}</td>
                          <td className="p-2">{item.type_of_transaction}</td>
                          <td className="p-2 font-mono">{item.date}</td>
                          <td className="p-2 font-mono text-cyan-400">{item.invoice_number}</td>
                          <td className="p-2 font-mono text-amber-400">{item.voucher_number || '-'}</td>
                          <td className="p-2 text-zinc-400 max-w-[150px] truncate">{item.particulars}</td>
                          <td className="p-2 text-right font-mono">{item.qty}</td>
                          <td className="p-2 text-right font-mono">₱{(item.amount || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-mono text-emerald-400">₱{(item.vatable_amount || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-mono text-cyan-400">₱{(item.vat_amount || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-amber-400">₱{(item.total_amount_due || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>

              {importedPreview.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmImport('replace')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-rose-500/30 cursor-pointer"
                  >
                    Replace All with Imported
                  </button>
                  <button
                    onClick={() => handleConfirmImport('append')}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Append {importedPreview.length} Records to Database</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT RECORD MODAL (ALL 21 UNIFORM HEADERS) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto ${theme.isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}>
            <button
              onClick={() => setIsEntryModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold">
                {editingRecordId !== null ? `Edit ${labels.singular}` : `New Entry — ${labels.title}`}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5">
              Enter transaction details matching the uniform 21-header database schema with live BIR tax formulas.
            </p>

            <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. REGISTERED NAME */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  1. REGISTERED NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Miguel Corporation / ABC Retailers"
                  value={formRegisteredName}
                  onChange={(e) => setFormRegisteredName(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 2. VAT OR NONVAT */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  2. VAT OR NONVAT <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formVatOrNonVat}
                  onChange={(e) => setFormVatOrNonVat(e.target.value as any)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="VAT" className="text-zinc-900 bg-white">VAT Registered (12%)</option>
                  <option value="NONVAT" className="text-zinc-900 bg-white">NONVAT (Exempt / 0%)</option>
                </select>
              </div>

              {/* 3. TIN */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  3. TIN (14 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="000-000-000-00000"
                  value={formTin}
                  onChange={(e) => handleTinChange(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 4. ADDRESS */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  4. ADDRESS
                </label>
                <input
                  type="text"
                  placeholder="Unit, Building, Street, City / Municipality"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 5. TYPE OF TRANSACTION */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  5. TYPE OF TRANSACTION <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTypeOfTransaction}
                  onChange={(e) => setFormTypeOfTransaction(e.target.value as any)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="CASH" className="text-zinc-900 bg-white">CASH (Direct Payment)</option>
                  <option value="ON ACCOUNT" className="text-zinc-900 bg-white">ON ACCOUNT (Credit / Receivable)</option>
                </select>
              </div>

              {/* 6. DATE */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  6. DATE <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 7. INVOICE TYPE */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  7. INVOICE TYPE <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formInvoiceType}
                  onChange={(e) => setFormInvoiceType(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="SALES INVOICE" className="text-zinc-900 bg-white">SALES INVOICE</option>
                  <option value="OFFICIAL RECEIPT" className="text-zinc-900 bg-white">OFFICIAL RECEIPT</option>
                  <option value="SERVICE INVOICE" className="text-zinc-900 bg-white">SERVICE INVOICE</option>
                  <option value="BILLING INVOICE" className="text-zinc-900 bg-white">BILLING INVOICE</option>
                </select>
              </div>

              {/* 7.1 VOUCHER # [FOR EXPENSE AND CASH DISBURSEMENTS ONLY] */}
              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  7.1 VOUCHER # {isDisbursementOrPurchase && <span className="text-amber-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={isDisbursementOrPurchase ? "e.g. CV-2026-001" : "Optional (Disbursements)"}
                  value={formVoucherNo}
                  onChange={(e) => setFormVoucherNo(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {isDisbursementOrPurchase && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">
                      Business Tax Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formBusinessTaxType}
                      onChange={(e) => setFormBusinessTaxType(e.target.value as any)}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain}`}
                    >
                      <option value="vatable" className="text-zinc-900 bg-white">Vatable (12% VAT)</option>
                      <option value="non-vatable" className="text-zinc-900 bg-white">Non-Vatable (3% / None)</option>
                      <option value="vat-exempt" className="text-zinc-900 bg-white">VAT-Exempt</option>
                      <option value="zero-rated" className="text-zinc-900 bg-white">Zero-Rated (0%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      Expense Type (Chart of Accounts) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formExpenseType}
                      onChange={(e) => setFormExpenseType(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain}`}
                    >
                      {selectableExpenseAccounts.map((cat) => (
                        <option key={cat} value={cat} className="text-zinc-900 bg-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 8. INVOICE # */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  8. INVOICE # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SI-001 / OR-001"
                  value={formInvoiceNo}
                  onChange={(e) => setFormInvoiceNo(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 9. PARTICULARS */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  9. PARTICULARS
                </label>
                <input
                  type="text"
                  placeholder="Item description, merchandise, services rendered..."
                  value={formParticulars}
                  onChange={(e) => setFormParticulars(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              {/* 10. QTY & 11. UNIT PRICE */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    10. QTY
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    11. UNIT PRICE
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              {/* 15. ZERO RATED & 16. VAT EXEMPT */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    15. ZERO RATED
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formZeroRated}
                    onChange={(e) => setFormZeroRated(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    16. VAT EXEMPT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formVatExempt}
                    onChange={(e) => setFormVatExempt(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              {/* 19. DISCOUNT & 20. TAX WITHHELD */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    19. DISCOUNT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    20. TAX WITHHELD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTaxWithheld}
                    onChange={(e) => setFormTaxWithheld(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              {/* LIVE COMPUTATION CARD (HEADERS 12, 13, 14, 17, 18, 21) */}
              <div className="md:col-span-2 lg:col-span-3 p-3.5 rounded-xl border border-zinc-700 bg-zinc-950/60 font-mono text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  BIR Auto-Calculated Database Values:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">12. Amount:</span>
                    <strong className="text-zinc-200">₱{liveFormulas.amount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">13. Vatable:</span>
                    <strong className="text-emerald-400">₱{liveFormulas.vatable_sales.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">14. VAT Amount:</span>
                    <strong className="text-cyan-400">₱{liveFormulas.vat.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">17. Inclusive:</span>
                    <strong className="text-zinc-300">₱{liveFormulas.total_sale_vat_inclusive.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">18. Net of VAT:</span>
                    <strong className="text-zinc-300">₱{liveFormulas.amount_net_of_vat.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block">21. Total Due:</span>
                    <strong className="text-amber-400 text-sm font-black">₱{liveFormulas.total_amount_due.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer ${theme.accentBg}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingRecordId !== null ? 'Update Record in Database' : 'Post Record to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE / RECEIPT OFFICIAL PREVIEW MODAL (VAT & NON-VAT) */}
      <InvoiceReceiptPreviewModal
        isOpen={Boolean(previewRecord)}
        onClose={() => setPreviewRecord(null)}
        record={previewRecord}
        activeCompany={activeCompany}
      />
    </div>
  );
}
