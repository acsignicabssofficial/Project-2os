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
  customers?: Customer[];
  contractors?: Contractor[];
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
  // Callback when records change to sync back to legacy states if needed
  onSyncLegacy?: (updated: UniformBookRecord[]) => void;
  accountTitles?: AccountTitle[];
}

export default function UniformBookTab({
  bookType,
  records,
  setRecords,
  activeCompany,
  customers = [],
  contractors = [],
  theme,
  triggerAlert,
  globalSearch = '',
  onSyncLegacy,
  accountTitles = []
}: UniformBookTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const labels = getBookDisplayLabel(bookType);
  const isDisbursementOrPurchase = bookType === 'cash_disbursement' || bookType === 'subsidiary_purchases';

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

  // Filtered records
  const filteredRecords = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    return records.filter(r => {
      if (activeCompanyName && r.company_name && r.company_name !== activeCompanyName) {
        return false;
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
  }, [records, activeCompanyName, searchTerm, globalSearch, filterVat, filterType]);

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
    if (!confirm('Are you sure you want to permanently delete this record from the database?')) return;
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
      {/* HEADER BANNER & SUMMARY KPI CARDS */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-xs`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-200/60 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${theme.accentBadge}`}>
                Uniform Database Book
              </span>
              <span className="text-xs font-mono text-zinc-500">Table: {bookType}</span>
            </div>
            <h2 className={`text-xl font-bold tracking-tight mt-1 ${theme.textTitle}`}>{labels.title}</h2>
            <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{labels.subtitle}</p>
          </div>

          {/* ACTION BUTTONS: Viewing Notice, Import CSV, Template, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Viewing & Audit Mode • Encode via <strong>Other Transactions</strong></span>
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

      {/* SPREADSHEET TABLE: EXACT 21 UNIFORM HEADERS */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-xs overflow-hidden`}>
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className={`bg-zinc-100 dark:bg-zinc-900 ${theme.textMuted} uppercase font-bold text-[10px] tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 min-w-[120px]">STATUS</th>
                <th className="p-3 min-w-[200px]">1. REGISTERED NAME</th>
                <th className="p-3 min-w-[110px]">2. VAT OR NONVAT</th>
                <th className="p-3 min-w-[130px] font-mono">3. TIN</th>
                <th className="p-3 min-w-[180px]">4. ADDRESS</th>
                <th className="p-3 min-w-[140px]">5. TYPE OF TRANSACTION</th>
                <th className="p-3 min-w-[100px] font-mono">6. DATE</th>
                <th className="p-3 min-w-[140px]">7. INVOICE TYPE</th>
                <th className={`p-3 min-w-[120px] font-mono ${isDisbursementOrPurchase ? 'text-amber-500 font-extrabold' : ''}`}>
                  7.1 VOUCHER #
                </th>
                {isDisbursementOrPurchase && (
                  <>
                    <th className="p-3 min-w-[140px] text-purple-400 font-bold">BUSINESS TAX TYPE</th>
                    <th className="p-3 min-w-[150px] text-indigo-400 font-bold">EXPENSE TYPE</th>
                  </>
                )}
                <th className="p-3 min-w-[110px] font-mono font-bold text-cyan-500">8. INVOICE #</th>
                <th className="p-3 min-w-[200px]">9. PARTICULARS</th>
                <th className="p-3 min-w-[70px] text-right font-mono">10. QTY</th>
                <th className="p-3 min-w-[100px] text-right font-mono">11. UNIT PRICE</th>
                <th className="p-3 min-w-[110px] text-right font-mono font-bold">12. AMOUNT</th>
                <th className="p-3 min-w-[120px] text-right font-mono text-emerald-500">13. VATABLE AMOUNT</th>
                <th className="p-3 min-w-[110px] text-right font-mono text-cyan-500">14. VAT AMOUNT</th>
                <th className="p-3 min-w-[110px] text-right font-mono">15. ZERO RATED</th>
                <th className="p-3 min-w-[110px] text-right font-mono">16. VAT EXEMPT</th>
                <th className="p-3 min-w-[130px] text-right font-mono">17. VAT INCLUSIVE</th>
                <th className="p-3 min-w-[130px] text-right font-mono">18. NET OF VAT</th>
                <th className="p-3 min-w-[90px] text-right font-mono text-rose-400">19. DISCOUNT</th>
                <th className="p-3 min-w-[100px] text-right font-mono text-amber-500">20. TAX WITHHELD</th>
                <th className="p-3 min-w-[130px] text-right font-mono font-extrabold text-amber-500">21. TOTAL DUE</th>
                <th className="p-3 text-center min-w-[100px] sticky right-0 bg-zinc-100 dark:bg-zinc-900 border-l ${theme.borderCard}">ACTIONS</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isDisbursementOrPurchase ? 27 : 25} className="p-8 text-center text-zinc-400">
                    No records found in this register. Encode new transactions via &quot;Other Transactions&quot; ➔ &quot;Sales / Purchase Transaction&quot;.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isCancelled = r.is_cancelled;
                  return (
                    <tr 
                      key={r.id} 
                      className={`${isCancelled ? 'bg-rose-950/20 text-zinc-500 line-through' : theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/40'} transition-colors`}
                    >
                      <td className="p-3 text-center text-zinc-400 text-[10px] font-mono">{idx + 1}</td>
                      <td className="p-3">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            VOID / CANCELLED
                          </span>
                        ) : r.status === 'Cash' || r.status === 'Paid' || r.type_of_transaction === 'CASH' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {r.status || 'CASH / PAID'}
                          </span>
                        ) : r.status === 'Partial' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {r.vat_or_nonvat}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-400">{r.tin}</td>
                      <td className="p-3 text-zinc-400 max-w-[200px] truncate" title={r.address}>{r.address || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.type_of_transaction === 'CASH'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {r.type_of_transaction}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-400">{r.date}</td>
                      <td className="p-3 text-zinc-300">{r.invoice_type}</td>
                      <td className={`p-3 font-mono font-semibold ${r.voucher_number ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {r.voucher_number || '-'}
                      </td>
                      {isDisbursementOrPurchase && (
                        <>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (r.business_tax_type || '').toLowerCase() === 'vatable' || r.vat_or_nonvat === 'VAT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : (r.business_tax_type || '').toLowerCase() === 'zero-rated'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : (r.business_tax_type || '').toLowerCase() === 'vat-exempt'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {r.business_tax_type || (r.vat_or_nonvat === 'VAT' ? 'vatable' : 'non-vatable')}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-indigo-300">
                            {r.expense_type || 'Operating Expense'}
                          </td>
                        </>
                      )}
                      <td className="p-3 font-mono font-bold text-cyan-400">
                        <button
                          type="button"
                          onClick={() => setPreviewRecord(r)}
                          className="hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left text-cyan-400 hover:text-cyan-300"
                          title="Click to preview official BIR Invoice / Receipt (VAT or Non-VAT)"
                        >
                          <span>{r.invoice_number}</span>
                          <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className="p-3 text-zinc-300 max-w-[240px] truncate" title={r.particulars}>{r.particulars}</td>
                      <td className="p-3 text-right font-mono">{r.qty}</td>
                      <td className="p-3 text-right font-mono">₱{(r.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-200">
                        ₱{(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                        ₱{(r.vatable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-cyan-400 font-semibold">
                        ₱{(r.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-400">
                        ₱{(r.zero_rated_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-400">
                        ₱{(r.vat_exempt_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-300">
                        ₱{(r.total_amount_vat_inclusive || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-300">
                        ₱{(r.total_amount_net_of_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        ₱{(r.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-400">
                        ₱{(r.tax_withheld || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-amber-500">
                        ₱{(r.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center sticky right-0 bg-zinc-950/80 backdrop-blur-xs border-l border-zinc-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewRecord(r)}
                            title="Preview Official BIR Invoice / Receipt (VAT or Non-VAT)"
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Edit Record"
                            className="p-1 rounded text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleCancel(r.id)}
                            title={isCancelled ? "Restore" : "Cancel"}
                            className="p-1 rounded text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                          >
                            {isCancelled ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            title="Delete"
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* SUMMARY FOOTER: Totals for all numeric columns */}
            {filteredRecords.length > 0 && (
              <tfoot className="bg-zinc-100 dark:bg-zinc-900/90 font-mono font-bold text-xs border-t-2 border-zinc-300 dark:border-zinc-700">
                <tr>
                  <td colSpan={13} className="p-3 text-right uppercase tracking-wider text-zinc-400 font-bold">
                    SUMMARY TOTAL OF RECORDS:
                  </td>
                  <td className="p-3 text-right text-zinc-100 font-extrabold">
                    ₱{summaryTotals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-extrabold">
                    ₱{summaryTotals.totalVatableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-cyan-400 font-extrabold">
                    ₱{summaryTotals.totalVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-zinc-400">
                    ₱{summaryTotals.totalZeroRatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-zinc-400">
                    ₱{summaryTotals.totalVatExemptAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-zinc-300">
                    ₱{summaryTotals.totalAmountVatInclusive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-zinc-300">
                    ₱{summaryTotals.totalAmountNetOfVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-rose-400">
                    ₱{summaryTotals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-amber-400">
                    ₱{summaryTotals.totalTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-amber-400 font-black text-sm">
                    ₱{summaryTotals.totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 sticky right-0 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-700"></td>
                </tr>
              </tfoot>
            )}
          </table>
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
