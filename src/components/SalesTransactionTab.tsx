import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  PlusCircle, 
  Coins, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Search, 
  Clock, 
  DollarSign,
  FileText,
  BadgePercent,
  Check,
  CreditCard,
  Layers,
  ArrowUpRight,
  Eye,
  UserPlus,
  Trash2,
  X
} from 'lucide-react';
import InvoiceReceiptPreviewModal from './InvoiceReceiptPreviewModal';
import AutoSuggestInput from './AutoSuggestInput';
import { UniformBookRecord, Customer, Company, SpecialEntry, SpecialEntryLine } from '../types';
import { computeSaleFormulas } from '../utils/accounting';

interface SalesTransactionTabProps {
  subsidiarySales: UniformBookRecord[];
  setSubsidiarySales: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  cashReceipts: UniformBookRecord[];
  setCashReceipts: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  collections: UniformBookRecord[];
  setCollections: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
  onNavigateToTab?: (tabKey: string) => void;
  specialEntries?: SpecialEntry[];
  setSpecialEntries?: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  onDeleteRecord?: (bookType: string, record: UniformBookRecord) => void;
}

export default function SalesTransactionTab({
  subsidiarySales,
  setSubsidiarySales,
  cashReceipts,
  setCashReceipts,
  collections,
  setCollections,
  customers,
  setCustomers,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch = '',
  onNavigateToTab,
  specialEntries = [],
  setSpecialEntries,
  onDeleteRecord
}: SalesTransactionTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';
  const isDark = !theme || !theme.isLight;

  // Tab mode: 'new_sale' or 'collect_open'
  const [hubTab, setHubTab] = useState<'new_sale' | 'collect_open'>('new_sale');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [businessTaxType, setBusinessTaxType] = useState<'vatable' | 'non-vatable' | 'vat-exempt' | 'zero-rated'>(
    activeCompany?.vat_or_non_vat === 'NON-VATABLE' ? 'non-vatable' : 'vatable'
  );
  const [vatStatus, setVatStatus] = useState<'VAT' | 'NONVAT'>(
    activeCompany?.vat_or_non_vat === 'NON-VATABLE' ? 'NONVAT' : 'VAT'
  );
  const [tin, setTin] = useState('');
  const [branchCode, setBranchCode] = useState('00000');
  const [address, setAddress] = useState('');
  const [invoiceType, setInvoiceType] = useState('INVOICE');

  // Helper to extract sequential integer from invoice number
  const extractInvoiceSeqNum = (invStr?: string): number | null => {
    if (!invStr) return null;
    const trimmed = invStr.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const match = trimmed.match(/(\d+)$/);
    if (match) return parseInt(match[1], 10);
    return null;
  };

  // Compute next sequential invoice number (starting at 1, or filling/continuing the sequence)
  const nextSequentialInvoiceNo = useMemo(() => {
    const companyRecords = subsidiarySales.filter(
      s => !activeCompanyName || !s.company_name || s.company_name === activeCompanyName
    );
    const nums = companyRecords
      .map(s => extractInvoiceSeqNum(s.invoice_number))
      .filter((n): n is number => n !== null && n > 0 && n < 1000000);
    if (nums.length === 0) return '1';
    const maxNum = Math.max(...nums);
    return String(maxNum + 1);
  }, [subsidiarySales, activeCompanyName]);

  const [invoiceNo, setInvoiceNo] = useState(() => nextSequentialInvoiceNo);

  // Sync default invoiceNo to next sequential number when company changes or records update (if untouched)
  React.useEffect(() => {
    setInvoiceNo(prev => {
      if (!prev || prev.startsWith('INV #') || /^\d+$/.test(prev.trim())) {
        return nextSequentialInvoiceNo;
      }
      return prev;
    });
  }, [nextSequentialInvoiceNo]);

  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [particulars, setParticulars] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [zeroRated, setZeroRated] = useState('0');
  const [vatExempt, setVatExempt] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [taxWithheld, setTaxWithheld] = useState('0');

  // Transaction Mode: 'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'
  const [saleMode, setSaleMode] = useState<'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'>('ON CASH');

  // Partial mode fields (Requirement 6: ask only for down payment, no default amount)
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [downPaymentWithholding, setDownPaymentWithholding] = useState('0');
  const [collectionRef, setCollectionRef] = useState(`COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);

  // Prompt modal to add new customer with TIN to database (Requirement 3)
  const [newCustomerPrompt, setNewCustomerPrompt] = useState<{
    isOpen: boolean;
    customerName: string;
    tin: string;
    branchCode: string;
    address: string;
    taxType: 'VAT' | 'Non-VAT';
    pendingSaleData?: any;
  } | null>(null);

  // Prompt modal when customer name already exists in Directory > Customers
  const [existingCustomerMatchPrompt, setExistingCustomerMatchPrompt] = useState<{
    isOpen: boolean;
    matchedCustomer: Customer;
    step: 'ask_same' | 'verify_tin';
    verifyTinInput: string;
    verifyBranchInput: string;
    errorText?: string;
  } | null>(null);

  // Quick collection modal for open invoices
  const [selectedInvoiceToCollect, setSelectedInvoiceToCollect] = useState<UniformBookRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDiscount, setCollectDiscount] = useState('0');
  const [collectWtax, setCollectWtax] = useState('0');
  const [collectRefNo, setCollectRefNo] = useState(`COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0]);

  // Preview modal state
  const [previewRecord, setPreviewRecord] = useState<UniformBookRecord | null>(null);

  // Search filter for open invoices
  const [openSearch, setOpenSearch] = useState('');

  // ---- Matching helpers (name normalisation, company scoping) ----
  const normName = (v?: string) => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const customerNameKeys = (c: Customer) => {
    const list = [c.registered_name, c.customer_name, c.trade_name].filter(Boolean) as string[];
    const norms = list.map(normName);
    const rawLowers = list.map(s => s.trim().toLowerCase());
    return Array.from(new Set([...norms, ...rawLowers]));
  };
  const isActiveCompanyRow = (row: { company_name?: string }) =>
    !activeCompanyName || !row.company_name || row.company_name.trim().toLowerCase() === activeCompanyName.trim().toLowerCase();
  const sameInvoiceNo = (a?: string, b?: string) =>
    (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
  const tin9Of = (c: Customer) =>
    (c.client_TIN || c.customer_tin || (c as any).tin_number || (c as any).tin || '').replace(/\D/g, '').slice(0, 9);
  const customerDisplayName = (c: Customer) =>
    (c.registered_name || c.customer_name || c.trade_name || '').trim();

  // Live TIN Conflict Check (Requirement 2)
  const tinMatchCustomer = useMemo(() => {
    const digits = tin.replace(/\D/g, '');
    if (digits.length < 9 || /^0+$/.test(digits)) return null;
    return customers.find(c => {
      const cDigits = (c.client_TIN || c.customer_tin || '').replace(/\D/g, '');
      return cDigits.length >= 9 && cDigits.startsWith(digits.slice(0, 9));
    }) || null;
  }, [tin, customers]);

  const hasTinNameConflict = useMemo(() => {
    if (!tinMatchCustomer || !customerName.trim()) return false;
    return !customerNameKeys(tinMatchCustomer).includes(normName(customerName));
  }, [tinMatchCustomer, customerName]);

  // Auto-fill TIN & Customer details
  const handleSelectCustomer = (custName: string) => {
    setCustomerName(custName);
    const norm = normName(custName);
    const rawLower = custName.trim().toLowerCase();
    const found = customers.find(c => 
      customerNameKeys(c).includes(norm) ||
      customerNameKeys(c).includes(rawLower) ||
      (c.registered_name || c.customer_name || c.trade_name || '').trim().toLowerCase() === rawLower
    );
    if (found) {
      const rawDigits = (found.client_TIN || found.customer_tin || (found as any).tin_number || (found as any).tin || '').replace(/\D/g, '').slice(0, 9);
      const formatted9 = rawDigits.length === 9 ? `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 6)}-${rawDigits.slice(6, 9)}` : (found.client_TIN || found.customer_tin || '');
      setTin(formatted9);
      setBranchCode((found.customer_branch_code || found.tin_branch_code || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5));
      setAddress(found.address || found.client_Address || found.customer_address || '');
      if (found.vat_status) {
        const isNonVat = (found.vat_status || '').toUpperCase().includes('NON');
        setVatStatus(isNonVat ? 'NONVAT' : 'VAT');
        setBusinessTaxType(isNonVat ? 'non-vatable' : 'vatable');
      }
    }
  };

  // 9-digit TIN handler (aligned with Directory > Customers format)
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    setTin(formatted);

    if (digits.length === 9 && !/^0+$/.test(digits)) {
      const found = customers.find(c => (c.client_TIN || c.customer_tin || '').replace(/\D/g, '').startsWith(digits));
      if (found) {
        if (!customerName) setCustomerName(found.registered_name || found.customer_name || found.trade_name || '');
        if (!address) setAddress(found.address || found.client_Address || found.customer_address || '');
        if (found.customer_branch_code || found.tin_branch_code) {
          setBranchCode((found.customer_branch_code || found.tin_branch_code || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5));
        }
      }
    }
  };

  const handleBranchCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setBranchCode(digits);
  };

  // Live notification if entered customer name matches an existing customer in Directory > Customers
  const nameMatchedCustomer = useMemo(() => {
    if (!customerName.trim()) return null;
    const norm = normName(customerName);
    return customers.find(c => isActiveCompanyRow(c) && customerNameKeys(c).includes(norm)) || null;
  }, [customerName, customers, activeCompanyName]);

  // Live Formula Calculations
  const liveFormulas = useMemo(() => {
    return computeSaleFormulas({
      qty: parseFloat(qty) || 0,
      unit_price: parseFloat(unitPrice) || 0,
      zero_rated: parseFloat(zeroRated) || 0,
      vat_exempt: parseFloat(vatExempt) || 0,
      less_discount: parseFloat(discount) || 0,
      less_withholding_tax: parseFloat(taxWithheld) || 0,
      is_vat_registered: vatStatus === 'VAT'
    });
  }, [qty, unitPrice, zeroRated, vatExempt, discount, taxWithheld, vatStatus]);

  // Open / Unpaid / Partial Sales for current company
  const openInvoices = useMemo(() => {
    return subsidiarySales.filter(s => {
      if (s.is_cancelled) return false;
      if (activeCompanyName && s.company_name && s.company_name.trim().toLowerCase() !== activeCompanyName.trim().toLowerCase()) return false;
      
      // If already explicitly marked as Cash or Paid
      if (s.status === 'Cash' || s.status === 'Paid' || s.sales_status === 'Paid') return false;

      const grossInv = Number(s.total_amount_vat_inclusive || s.amount) || 0;
      const invDisc = Number(s.discount ?? s.less_discount ?? s.discounts) || 0;
      const invWtax = Number(s.tax_withheld ?? s.withholding_2307 ?? s.amount_withheld_2307 ?? s.less_withholding_tax) || 0;
      const netReceivable = Math.max(0, Math.round((grossInv - invDisc) * 100) / 100);
      const netCashDue = Number(s.total_amount_due) > 0 ? Number(s.total_amount_due) : Math.max(0, Math.round((netReceivable - invWtax) * 100) / 100);

      // Find all matching collections
      const matchingCollections = collections.filter(c => 
        !c.is_cancelled && 
        c.invoice_number && 
        isActiveCompanyRow(c) &&
        sameInvoiceNo(c.invoice_number, s.invoice_number)
      );

      let totalCashCollected = 0;
      let totalDiscountSettled = invDisc;
      let totalWtaxSettled = 0;

      matchingCollections.forEach(c => {
        const cashVal = c.amount_collected !== undefined ? Number(c.amount_collected) : 0;
        totalCashCollected += cashVal;
        const discVal = Number(c.discount ?? c.discounts) || 0;
        if (discVal > 0) totalDiscountSettled += discVal;
        const wtaxVal = Number(c.amount_withheld_2307 ?? c.tax_withheld ?? c.wtax_2307) || 0;
        if (wtaxVal > 0) totalWtaxSettled += wtaxVal;
      });

      const effectiveWtax = totalWtaxSettled > 0 ? totalWtaxSettled : invWtax;
      const totalOffsetCreditedToAR = Math.round((totalCashCollected + effectiveWtax) * 100) / 100;
      const remainingAR = Math.max(0, Math.round((netReceivable - totalOffsetCreditedToAR) * 100) / 100);
      const remainingCash = Math.max(0, Math.round((netCashDue - totalCashCollected) * 100) / 100);

      const isPaid = remainingAR <= 0.05 || remainingCash <= 0.05;
      return !isPaid;
    });
  }, [subsidiarySales, collections, activeCompanyName]);

  const filteredOpenInvoices = useMemo(() => {
    const q = (openSearch || globalSearch).toLowerCase().trim();
    if (!q) return openInvoices;
    return openInvoices.filter(i => 
      i.invoice_number.toLowerCase().includes(q) ||
      i.registered_name.toLowerCase().includes(q) ||
      i.tin.includes(q) ||
      (i.particulars || '').toLowerCase().includes(q)
    );
  }, [openInvoices, openSearch, globalSearch]);

  // EXECUTE SALE RECORDING (Called directly or after Customer confirmation)
  const executeRecordSale = (
    saveAsCustomer: boolean = false,
    isVariousCustomer: boolean = false,
    overrideTin9?: string,
    overrideBranch5?: string,
    overrideAddress?: string,
    overrideName?: string
  ) => {
    const effectiveName = (overrideName !== undefined ? overrideName : customerName).trim();
    const effectiveTinStr = overrideTin9 !== undefined ? overrideTin9 : tin;
    const effectiveBranchStr = overrideBranch5 !== undefined ? overrideBranch5 : branchCode;
    const effectiveAddressStr = overrideAddress !== undefined ? overrideAddress : address;

    const rawTinDigits = effectiveTinStr.replace(/\D/g, '').slice(0, 9);
    const hasValidTin = rawTinDigits.length === 9 && !/^0+$/.test(rawTinDigits);
    const finalIsVarious = isVariousCustomer || !hasValidTin;

    const formattedTin9 = hasValidTin
      ? `${rawTinDigits.slice(0, 3)}-${rawTinDigits.slice(3, 6)}-${rawTinDigits.slice(6, 9)}`
      : '000-000-000';
    const cleanBranch5 = (effectiveBranchStr || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
    const fullTin14 = finalIsVarious ? '000-000-000-00000' : `${formattedTin9}-${cleanBranch5}`;

    // Requirement 3: Save customer to database if user chose to add new customer
    const alreadyRegistered = customers.find(c => isActiveCompanyRow(c) && tin9Of(c) === rawTinDigits);
    if (saveAsCustomer && alreadyRegistered) {
      // Customer with this TIN already exists -> reuse it instead of creating a duplicate entity
      triggerAlert(`Customer "${customerDisplayName(alreadyRegistered)}" already exists in the Customer Masterlist - transaction routed to the existing record.`, 'info');
    } else if (saveAsCustomer && setCustomers && hasValidTin) {
      const custNameToSave = (newCustomerPrompt?.customerName || effectiveName).trim();
      const branchToSave = (newCustomerPrompt?.branchCode || cleanBranch5).replace(/\D/g, '').padStart(5, '0').slice(0, 5);
      const nextIdNum = customers.filter(c => c.company_name === activeCompanyName).length + 1;
      const newCustId = `CUST-${String(nextIdNum).padStart(4, '0')}`;

      const newCust: Customer = {
        id: Date.now(),
        customer_id: newCustId,
        company_name: activeCompanyName,
        registered_name: custNameToSave,
        customer_name: custNameToSave,
        trade_name: custNameToSave,
        client_TIN: formattedTin9,
        customer_tin: formattedTin9,
        tin_number: formattedTin9,
        customer_branch_code: branchToSave,
        tin_branch_code: branchToSave,
        client_Address: (newCustomerPrompt?.address || effectiveAddressStr).trim(),
        customer_address: (newCustomerPrompt?.address || effectiveAddressStr).trim(),
        address: (newCustomerPrompt?.address || effectiveAddressStr).trim(),
        tax_type: newCustomerPrompt?.taxType || (vatStatus === 'VAT' ? 'VAT' : 'Non-VAT'),
        vat_status: newCustomerPrompt?.taxType || (vatStatus === 'VAT' ? 'VAT' : 'Non-VAT'),
        client_status: 'Active'
      };
      setCustomers(prev => [newCust, ...prev]);
      triggerAlert(`Customer "${custNameToSave}" (TIN: ${formattedTin9} • Branch: ${branchToSave}) added to Customer Masterlist successfully.`, 'success');
    }

    const totalDue = liveFormulas.total_amount_due;
    const nowIso = new Date().toISOString();
    const commonId = Date.now();

    // 1. Prepare Base Record for Subsidiary Sales
    let assignedStatus: 'Cash' | 'On Account' | 'Partial' | 'Paid' = 'On Account';
    let assignedTransactionType: 'CASH' | 'ON ACCOUNT' = 'ON ACCOUNT';

    if (saleMode === 'ON CASH') {
      assignedStatus = 'Paid';
      assignedTransactionType = 'CASH';
    } else if (saleMode === 'ON PARTIAL') {
      const downPmt = parseFloat(downPaymentAmount) || 0;
      assignedStatus = downPmt >= totalDue ? 'Paid' : 'Partial';
      assignedTransactionType = 'ON ACCOUNT';
    }

    const saleRecord: UniformBookRecord = {
      id: commonId,
      company_name: activeCompanyName,
      registered_name: effectiveName,
      customer_name: effectiveName,
      vat_or_nonvat: vatStatus,
      business_tax_type: businessTaxType,
      tin: fullTin14,
      customer_tin: finalIsVarious ? '000-000-000' : formattedTin9,
      address: effectiveAddressStr.trim(),
      type_of_transaction: assignedTransactionType,
      date: date,
      invoice_type: invoiceType,
      voucher_number: voucherNo.trim() || `CR #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      invoice_number: invoiceNo.trim(),
      particulars: particulars.trim(),
      qty: parseFloat(qty) || 1,
      unit_price: parseFloat(unitPrice) || 0,
      amount: liveFormulas.amount,
      vatable_amount: liveFormulas.vatable_sales,
      vat_amount: liveFormulas.vat,
      zero_rated_amount: liveFormulas.zero_rated,
      vat_exempt_amount: liveFormulas.vat_exempt,
      total_amount_vat_inclusive: liveFormulas.total_sale_vat_inclusive,
      total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
      discount: liveFormulas.less_discount,
      tax_withheld: liveFormulas.less_withholding_tax,
      total_amount_due: totalDue,
      status: assignedStatus,
      down_payment: saleMode === 'ON PARTIAL' ? parseFloat(downPaymentAmount) || 0 : undefined,
      is_cancelled: false,
      is_various: finalIsVarious,
      created_at: nowIso,
      // Compatibility aliases for BIR tools, Reports, Notes to FS
      invoice_date: date,
      issue_date: date,
      invoice_amount: liveFormulas.total_sale_vat_inclusive || liveFormulas.amount,
      vatable_sales: liveFormulas.vatable_sales,
      output_vat: liveFormulas.vat,
      add_vat: liveFormulas.vat,
      withholding_2307: liveFormulas.less_withholding_tax,
      amount_withheld_2307: liveFormulas.less_withholding_tax,
      less_withholding_tax: liveFormulas.less_withholding_tax,
      ewt_amount: liveFormulas.less_withholding_tax,
      zero_rated: liveFormulas.zero_rated,
      vat_exempt: liveFormulas.vat_exempt,
      discounts: liveFormulas.less_discount,
      less_discount: liveFormulas.less_discount
    };

    // 2. Routing Logic based on user specification:
    // 5.1 / 6.1 Sales (other transaction) single-entry method -> recorded in Subsidiary Sales
    setSubsidiarySales(prev => [saleRecord, ...prev]);

    if (saleMode === 'ON ACCOUNT') {
      // Record in Collections Book as 'On Account' with pending balance so Collections Book tracks pending receivables
      const onAccountTrackingRecord: UniformBookRecord = {
        ...saleRecord,
        id: commonId + 1,
        invoice_type: invoiceType,
        particulars: `Receivable Tracking for Invoice #${invoiceNo.trim()} (Pending Balance: ₱${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
        amount_collected: 0,
        pending_balance: totalDue,
        amount_withheld_2307: liveFormulas.less_withholding_tax,
        status: 'On Account',
        installments: []
      };
      setCollections(prev => [onAccountTrackingRecord, ...prev]);
      triggerAlert(`Sale ${invoiceNo} recorded to Subsidiary Sales & tracked in Collections Book (Pending Receivable: ₱${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`, 'success');
    } else if (saleMode === 'ON CASH') {
      // 5.3 Record to Cash Receipts (Fully paid sales only -> Journalizes Dr Cash, Dr CWT 2307, Cr A/R)
      const cashReceiptRecord: UniformBookRecord = {
        id: commonId + 1,
        company_name: activeCompanyName,
        registered_name: effectiveName,
        customer_name: effectiveName,
        vat_or_nonvat: vatStatus,
        business_tax_type: businessTaxType,
        tin: fullTin14,
        customer_tin: finalIsVarious ? '000-000-000' : formattedTin9,
        address: effectiveAddressStr.trim(),
        type_of_transaction: 'CASH',
        date: date,
        invoice_type: invoiceType,
        voucher_number: voucherNo.trim() || `CR #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        invoice_number: invoiceNo.trim(),
        particulars: `Full Cash Settlement for Invoice #${invoiceNo.trim()}${particulars.trim() ? ` - ${particulars.trim()}` : ''}`,
        qty: parseFloat(qty) || 1,
        unit_price: parseFloat(unitPrice) || 0,
        amount: liveFormulas.amount,
        vatable_amount: liveFormulas.vatable_sales,
        vat_amount: liveFormulas.vat,
        zero_rated_amount: liveFormulas.zero_rated,
        vat_exempt_amount: liveFormulas.vat_exempt,
        total_amount_vat_inclusive: liveFormulas.total_sale_vat_inclusive,
        total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
        discount: liveFormulas.less_discount,
        tax_withheld: liveFormulas.less_withholding_tax,
        total_amount_due: totalDue,
        amount_collected: totalDue,
        pending_balance: 0,
        amount_withheld_2307: liveFormulas.less_withholding_tax,
        status: 'Paid',
        is_cancelled: false,
        is_various: finalIsVarious,
        created_at: nowIso
      };
      setCashReceipts(prev => [cashReceiptRecord, ...prev]);

      // 5.4 Record to Collections Book (tracks vatable sales, cash received, 2307, vat output -> no duplicate journal entry)
      const collectionRecord: UniformBookRecord = {
        ...cashReceiptRecord,
        id: commonId + 2,
        status: 'Paid',
        pending_balance: 0
      };
      setCollections(prev => [collectionRecord, ...prev]);

      triggerAlert(`Full Cash Sale ${invoiceNo} recorded to Subsidiary Sales, Cash Receipts & Collections Book (Cash Received: ₱${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })})!`, 'success');
    } else if (saleMode === 'ON PARTIAL') {
      // Requirement 6: Simply ask for Down Payment (do not auto-calculate 2nd payment)
      const downPmt = parseFloat(downPaymentAmount) || 0;
      if (downPmt <= 0) {
        triggerAlert('Please enter a valid Down Payment amount.', 'error');
        return;
      }
      if (downPmt > totalDue + 0.01) {
        triggerAlert(`Overpayment Precaution: Down payment (₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the Total Amount Due (₱${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Customer overpayment is blocked.`, 'error');
        return;
      }

      const pendingBal = Math.max(0, Math.round((totalDue - downPmt) * 100) / 100);

      // Record COLLECTION 1 in Collections Book as its own individual payment row
      const partialCollectionRecord: UniformBookRecord = {
        id: commonId + 1,
        company_name: activeCompanyName,
        registered_name: effectiveName,
        customer_name: effectiveName,
        vat_or_nonvat: vatStatus,
        business_tax_type: businessTaxType,
        tin: fullTin14,
        customer_tin: finalIsVarious ? '000-000-000' : formattedTin9,
        address: effectiveAddressStr.trim(),
        type_of_transaction: 'ON ACCOUNT',
        date: date,
        invoice_type: invoiceType,
        voucher_number: collectionRef.trim() || `COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        invoice_number: invoiceNo.trim(),
        particulars: `COLLECTION 1 (Down Payment) for Invoice #${invoiceNo.trim()} — ₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        qty: parseFloat(qty) || 1,
        unit_price: parseFloat(unitPrice) || 0,
        amount: liveFormulas.amount,
        vatable_amount: liveFormulas.vatable_sales,
        vat_amount: liveFormulas.vat,
        zero_rated_amount: liveFormulas.zero_rated,
        vat_exempt_amount: liveFormulas.vat_exempt,
        total_amount_vat_inclusive: liveFormulas.total_sale_vat_inclusive,
        total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
        discount: 0, // Invoice trade discount is already booked in Sales recognition (dr 4015); collections only track subsequent cash settlement discounts
        tax_withheld: liveFormulas.less_withholding_tax,
        total_amount_due: totalDue,
        amount_collected: downPmt,
        pending_balance: pendingBal,
        amount_withheld_2307: 0,
        status: pendingBal <= 0.01 ? 'Paid' : 'Partial',
        is_cancelled: false,
        is_various: finalIsVarious,
        is_initial_downpayment: true as any,
        created_at: nowIso
      };

      setCollections(prev => [partialCollectionRecord, ...prev]);

      // If Down Payment equals full amount due, also record to Cash Receipts
      if (pendingBal <= 0.01) {
        const fullCashReceipt: UniformBookRecord = {
          ...saleRecord,
          id: commonId + 2,
          type_of_transaction: 'ON ACCOUNT',
          date: date,
          invoice_type: invoiceType,
          voucher_number: collectionRef.trim() || `COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          amount_collected: downPmt,
          pending_balance: 0,
          amount_withheld_2307: liveFormulas.less_withholding_tax,
          tax_withheld: liveFormulas.less_withholding_tax,
          status: 'Paid',
          settled_via_collections: true,
          particulars: `Full Settlement Completed via Collections Book: Invoice #${invoiceNo.trim()}`
        };
        setCashReceipts(prev => [fullCashReceipt, ...prev]);
      }

      triggerAlert(`Partial Sale ${invoiceNo} recorded to Subsidiary Sales & Collections Book (COLLECTION 1: ₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Pending Balance: ₱${pendingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`, 'info');
    }

    // Reset Form for next entry (advance sequential invoice number: 1, 2, 3...)
    const currentSeq = extractInvoiceSeqNum(invoiceNo);
    const nextSeq = currentSeq !== null ? String(currentSeq + 1) : String(( parseInt(nextSequentialInvoiceNo, 10) || 1) + 1);
    setInvoiceNo(nextSeq);
    setCollectionRef(`COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    setParticulars('');
    setUnitPrice('');
    setDownPaymentAmount('');
    setNewCustomerPrompt(null);
    setExistingCustomerMatchPrompt(null);
  };

  // SUBMIT NEW SALE TRANSACTION
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeCompany || !activeCompany.company_name || activeCompany.company_name.trim() === '' || activeCompany.company_name === 'Select Company...') {
      triggerAlert('Strict Validation: Please setup or select an Entity Profile first before entering sales transactions! (Saan mapupunta ang transaction kung walang designated entity?)', 'error');
      if (onNavigateToTab) onNavigateToTab('companies');
      return;
    }

    if (!customerName.trim()) {
      triggerAlert('Please enter or select a Customer Name.', 'error');
      return;
    }
    if (!invoiceNo.trim()) {
      triggerAlert('Invoice Number is required.', 'error');
      return;
    }
    if ((parseFloat(unitPrice) || 0) <= 0) {
      triggerAlert('Please enter a valid Unit Price greater than ₱0.00.', 'error');
      return;
    }

    // Overpayment Precaution check on Partial Sale Down Payment
    if (saleMode === 'ON PARTIAL') {
      const dpVal = parseFloat(downPaymentAmount) || 0;
      if (dpVal <= 0) {
        triggerAlert('Please enter a valid Down Payment amount greater than ₱0.00.', 'error');
        return;
      }
      if (dpVal > liveFormulas.total_amount_due + 0.01) {
        triggerAlert(
          `Overpayment Precaution: Down payment (₱${dpVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds Total Amount Due (₱${liveFormulas.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Please reduce the down payment or use ON CASH mode.`,
          'error'
        );
        return;
      }
    }

    const rawTinDigits = tin.replace(/\D/g, '').slice(0, 9);
    const hasValidTin = rawTinDigits.length === 9 && !/^0+$/.test(rawTinDigits);
    const cleanCustomerName = customerName.trim().toLowerCase();
    const normalizedCustomer = normName(customerName);

    // Existing customer search: check active company first, then fallback to all registered customers
    const matchCustomerInList = (list: Customer[]) => {
      return list.find(c => {
        const keys = customerNameKeys(c);
        if (keys.includes(normalizedCustomer) || keys.some(k => k === cleanCustomerName)) return true;
        const disp = customerDisplayName(c).toLowerCase();
        if (disp === cleanCustomerName) return true;
        if (cleanCustomerName.length >= 3 && disp.includes(cleanCustomerName)) return true;
        if (disp.length >= 3 && cleanCustomerName.includes(disp)) return true;
        return false;
      });
    };

    const existingCustomerByName = 
      matchCustomerInList(customers.filter(c => isActiveCompanyRow(c))) ||
      matchCustomerInList(customers);

    if (hasValidTin) {
      const existingCustomerWithTin = customers.find(c => tin9Of(c) === rawTinDigits);

      if (existingCustomerWithTin) {
        // TIN belongs to an already-registered customer -> ROUTE to that customer directly
        const registeredName = customerDisplayName(existingCustomerWithTin);
        const onFileBranch = (existingCustomerWithTin.customer_branch_code || existingCustomerWithTin.tin_branch_code || branchCode || '00000')
          .replace(/\D/g, '').padStart(5, '0').slice(0, 5);
        const onFileAddress =
          existingCustomerWithTin.address || existingCustomerWithTin.client_Address || existingCustomerWithTin.customer_address || address;
        const formattedExisting = `${rawTinDigits.slice(0, 3)}-${rawTinDigits.slice(3, 6)}-${rawTinDigits.slice(6, 9)}`;

        if (!customerNameKeys(existingCustomerWithTin).includes(normName(customerName))) {
          triggerAlert(`TIN ${formattedExisting} belongs to customer "${registeredName}". Transaction was routed to that customer record.`, 'info');
        }
        setCustomerName(registeredName);
        setTin(formattedExisting);
        setBranchCode(onFileBranch);
        if (!address && onFileAddress) setAddress(onFileAddress);
        executeRecordSale(false, false, formattedExisting, onFileBranch, onFileAddress, registeredName);
        return;
      }

      // Valid TIN, check if customer name matches an existing profile
      const formattedTin9 = `${rawTinDigits.slice(0, 3)}-${rawTinDigits.slice(3, 6)}-${rawTinDigits.slice(6, 9)}`;
      const cleanBranch5 = (branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);

      if (existingCustomerByName) {
        const onFileTin9 = tin9Of(existingCustomerByName);
        if (onFileTin9.length === 9 && onFileTin9 === rawTinDigits) {
          // Matches on-file TIN -> route directly
          const registeredName = customerDisplayName(existingCustomerByName);
          const onFileBranch = (existingCustomerByName.customer_branch_code || existingCustomerByName.tin_branch_code || cleanBranch5).replace(/\D/g, '').padStart(5, '0').slice(0, 5);
          const onFileAddress = existingCustomerByName.address || existingCustomerByName.client_Address || address;
          executeRecordSale(false, false, formattedTin9, onFileBranch, onFileAddress, registeredName);
          return;
        }

        if (onFileTin9.length === 9 && onFileTin9 !== rawTinDigits) {
          // Name matches an existing customer, but entered TIN is different
          setExistingCustomerMatchPrompt({
            isOpen: true,
            matchedCustomer: existingCustomerByName,
            step: 'ask_same',
            verifyTinInput: formattedTin9,
            verifyBranchInput: cleanBranch5,
            errorText: undefined
          });
          return;
        }

        // Registered customer has NO TIN on file yet -> attach this TIN to the existing entity
        if (setCustomers) {
          setCustomers(prev =>
            prev.map(c =>
              c.id === existingCustomerByName.id
                ? {
                    ...c,
                    client_TIN: formattedTin9,
                    customer_tin: formattedTin9,
                    tin_number: formattedTin9,
                    customer_branch_code: cleanBranch5,
                    tin_branch_code: cleanBranch5
                  }
                : c
            )
          );
        }
        triggerAlert(`TIN ${formattedTin9} saved to existing customer "${customerDisplayName(existingCustomerByName)}".`, 'success');
        executeRecordSale(false, false, formattedTin9, cleanBranch5, address, customerDisplayName(existingCustomerByName));
        return;
      }

      // Brand-new customer with a valid TIN
      setNewCustomerPrompt({
        isOpen: true,
        customerName: customerName.trim(),
        tin: formattedTin9,
        branchCode: cleanBranch5,
        address: address.trim(),
        taxType: vatStatus === 'VAT' ? 'VAT' : 'Non-VAT'
      });
      return;
    } else {
      // NO VALID TIN ENTERED (user entered name manually or blank TIN):
      // If name matches an existing customer -> AUTOMATICALLY ROUTE TO EXISTING CUSTOMER DIRECTLY
      if (existingCustomerByName) {
        const onFileTin9 = tin9Of(existingCustomerByName);
        const registeredName = customerDisplayName(existingCustomerByName);
        const onFileBranch = (existingCustomerByName.customer_branch_code || existingCustomerByName.tin_branch_code || branchCode || '00000')
          .replace(/\D/g, '').padStart(5, '0').slice(0, 5);
        const onFileAddress =
          existingCustomerByName.address || existingCustomerByName.client_Address || existingCustomerByName.customer_address || address;

        const formattedOnFile = onFileTin9.length === 9
          ? `${onFileTin9.slice(0, 3)}-${onFileTin9.slice(3, 6)}-${onFileTin9.slice(6, 9)}`
          : '000-000-000';

        setCustomerName(registeredName);
        setTin(formattedOnFile);
        setBranchCode(onFileBranch);
        if (!address && onFileAddress) setAddress(onFileAddress);
        triggerAlert(`Transaction automatically linked and routed to existing customer "${registeredName}".`, 'info');
        executeRecordSale(false, false, formattedOnFile, onFileBranch, onFileAddress, registeredName);
        return;
      }

      // Unknown name and no TIN -> offer to register as Regular Customer or Various Customer
      setNewCustomerPrompt({
        isOpen: true,
        customerName: customerName.trim(),
        tin: '',
        branchCode: (branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5),
        address: address.trim(),
        taxType: vatStatus === 'VAT' ? 'VAT' : 'Non-VAT'
      });
      return;
    }
  };

  // EXECUTE COLLECTION ON AN OPEN INVOICE
  const handleExecuteCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToCollect) return;

    const paymentAmt = parseFloat(collectAmount) || 0;
    const discountAmt = parseFloat(collectDiscount) || 0;
    const manualWtaxAmt = parseFloat(collectWtax) || 0;

    if (paymentAmt <= 0 && discountAmt <= 0 && manualWtaxAmt <= 0) {
      triggerAlert('Please enter a valid collection, discount, or withholding tax amount.', 'error');
      return;
    }

    const inv = selectedInvoiceToCollect;
    const invGross = Number(inv.total_amount_vat_inclusive || inv.amount) || 0;
    const invTradeDiscount = Number(inv.discount ?? inv.less_discount ?? inv.discounts) || 0;
    const netReceivable = Math.max(0, Math.round((invGross - invTradeDiscount) * 100) / 100);
    const invWtax = Number(inv.tax_withheld ?? inv.withholding_2307 ?? inv.amount_withheld_2307 ?? inv.less_withholding_tax) || 0;
    const netCashDue = Number(inv.total_amount_due) > 0 ? Number(inv.total_amount_due) : Math.max(0, Math.round((netReceivable - invWtax) * 100) / 100);

    // Check existing collection record(s) for this invoice
    const existingMatching = collections.filter(c => 
      !c.is_cancelled && 
      c.invoice_number && 
      isActiveCompanyRow(c) &&
      sameInvoiceNo(c.invoice_number, inv.invoice_number)
    );

    const prevCashCollected = existingMatching.reduce((sum, c) => {
      const cashVal = c.amount_collected !== undefined ? Number(c.amount_collected) : 0;
      return sum + cashVal;
    }, 0);
    const prevCollectionDiscounts = existingMatching.reduce((sum, c) => {
      const isInitial = c.particulars?.includes('Down Payment') || c.id === inv.id + 1;
      const dVal = Number(c.discount ?? c.discounts) || 0;
      return sum + (isInitial ? 0 : dVal);
    }, 0);
    const prevInstallmentWtax = existingMatching.reduce((sum, c) => {
      return sum + (Number(c.amount_withheld_2307 ?? c.tax_withheld) || 0);
    }, 0);

    // Remaining cash that the customer needs to pay
    const remainingCashBeforeThis = Math.max(0, Math.round((netCashDue - prevCashCollected - prevCollectionDiscounts) * 100) / 100);

    if (paymentAmt > remainingCashBeforeThis + 0.05) {
      triggerAlert(
        `Overpayment Precaution: Collection cash amount (₱${paymentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the remaining cash balance of ₱${remainingCashBeforeThis.toLocaleString(undefined, { minimumFractionDigits: 2 })} for Invoice #${inv.invoice_number}. Customer overpayment is blocked.`,
        'error'
      );
      return;
    }

    const newTotalCashCollected = Math.round((prevCashCollected + paymentAmt) * 100) / 100;
    const newTotalSettled = Math.round((newTotalCashCollected + prevCollectionDiscounts + discountAmt) * 100) / 100;
    const isNowFullyCollected = newTotalSettled >= (netCashDue - 0.05);

    // Upon full collection completion, recognize the remaining invoice 2307 CWT (or manualWtaxAmt)
    const wtaxForThisInstallment = manualWtaxAmt > 0
      ? manualWtaxAmt
      : (isNowFullyCollected ? Math.max(0, Math.round((invWtax - prevInstallmentWtax) * 100) / 100) : 0);

    const commonId = Date.now();
    const nowIso = new Date().toISOString();
    const pendingBal = Math.max(0, Math.round((netCashDue - newTotalSettled) * 100) / 100);

    // Count existing actual payments (where amount_collected > 0) to determine COLLECTION 1, COLLECTION 2, COLLECTION 3...
    const existingActualPayments = existingMatching.filter(c => (c.amount_collected !== undefined ? Number(c.amount_collected) : 0) > 0);
    const nextPaymentNo = existingActualPayments.length + 1;

    // 1. Add a NEW separate collection record per payment in Collections Book (NEVER overwrite previous 50k collection to 60k!)
    const newCollectionRec: UniformBookRecord = {
      id: commonId,
      company_name: activeCompanyName,
      registered_name: inv.registered_name,
      vat_or_nonvat: inv.vat_or_nonvat,
      tin: inv.tin,
      address: inv.address,
      type_of_transaction: 'ON ACCOUNT',
      date: collectDate,
      invoice_type: 'OFFICIAL RECEIPT',
      voucher_number: collectRefNo.trim() || `COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      invoice_number: inv.invoice_number,
      particulars: `COLLECTION ${nextPaymentNo} for Invoice #${inv.invoice_number} — ₱${paymentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${isNowFullyCollected ? 'Full Settlement' : `Remaining: ₱${pendingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`})`,
      qty: inv.qty || 1,
      unit_price: inv.unit_price || inv.amount,
      amount: inv.amount,
      vatable_amount: inv.vatable_amount,
      vat_amount: inv.vat_amount,
      zero_rated_amount: inv.zero_rated_amount,
      vat_exempt_amount: inv.vat_exempt_amount,
      total_amount_vat_inclusive: inv.total_amount_vat_inclusive,
      total_amount_net_of_vat: inv.total_amount_net_of_vat,
      discount: discountAmt,
      tax_withheld: wtaxForThisInstallment,
      amount_withheld_2307: wtaxForThisInstallment,
      total_amount_due: inv.total_amount_due || netCashDue,
      amount_collected: paymentAmt,
      pending_balance: pendingBal,
      status: isNowFullyCollected ? 'Paid' : 'Partial',
      is_cancelled: false,
      created_at: nowIso
    };

    setCollections(prev => {
      // Remove any 0-amount "On Account" placeholder row for this invoice, keep all actual payment rows intact with their original amounts, and add the new payment row
      const withoutZeroPlaceholder = prev.filter(c => {
        const isSameInv = !c.is_cancelled && c.invoice_number && isActiveCompanyRow(c) && sameInvoiceNo(c.invoice_number, inv.invoice_number);
        if (!isSameInv) return true;
        const cashVal = c.amount_collected !== undefined ? Number(c.amount_collected) : 0;
        return cashVal > 0;
      });
      // Update status on sibling rows of the same invoice if now Paid, while strictly preserving each row's individual amount_collected!
      const updatedSiblings = withoutZeroPlaceholder.map(c => {
        const isSameInv = !c.is_cancelled && c.invoice_number && isActiveCompanyRow(c) && sameInvoiceNo(c.invoice_number, inv.invoice_number);
        if (isSameInv && isNowFullyCollected) {
          return { ...c, status: 'Paid' as const };
        }
        return c;
      });
      return [newCollectionRec, ...updatedSiblings];
    });

    // 2. Update status and pending balance in Subsidiary Sales (6.2: status "Paid" when full payment is completed)
    setSubsidiarySales(prev => prev.map(s => {
      if (sameInvoiceNo(s.invoice_number, inv.invoice_number) && isActiveCompanyRow(s)) {
        return {
          ...s,
          status: isNowFullyCollected ? 'Paid' : 'Partial',
          sales_status: isNowFullyCollected ? 'Paid' : 'Partial',
          amount_collected: newTotalCashCollected,
          pending_balance: isNowFullyCollected ? 0 : pendingBal
        };
      }
      return s;
    }));

    // 3. 6.3 If collection for this invoice has reached FULL collection:
    // Record the fully paid sale into Cash Receipts Book (with full sale vatable_amount, vat_amount, 2307, total_amount_due; no duplicate journal entry)
    if (isNowFullyCollected) {
      const fullCashReceipt: UniformBookRecord = {
        ...inv,
        id: commonId + 1,
        type_of_transaction: 'ON ACCOUNT',
        date: collectDate,
        invoice_type: 'OFFICIAL RECEIPT',
        voucher_number: collectRefNo.trim() || `CR-${Date.now().toString().slice(-4)}`,
        amount_collected: newTotalCashCollected,
        pending_balance: 0,
        amount_withheld_2307: invWtax || wtaxForThisInstallment,
        tax_withheld: invWtax || wtaxForThisInstallment,
        status: 'Paid',
        settled_via_collections: true,
        particulars: `Full Settlement Completed via Collections Book: Invoice #${inv.invoice_number} (${inv.registered_name})`
      };
      setCashReceipts(prev => {
        const filtered = prev.filter(cr => !(isActiveCompanyRow(cr) && sameInvoiceNo(cr.invoice_number, inv.invoice_number)));
        return [fullCashReceipt, ...filtered];
      });

      triggerAlert(
        `COLLECTION ${nextPaymentNo} (₱${paymentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}) recorded! Invoice #${inv.invoice_number} is now PAID IN FULL and recorded to Cash Receipts.`,
        'success'
      );
    } else {
      triggerAlert(
        `Recorded COLLECTION ${nextPaymentNo} of ₱${paymentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} for Invoice #${inv.invoice_number}. Remaining Balance: ₱${pendingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`,
        'info'
      );
    }

    setSelectedInvoiceToCollect(null);
    setCollectAmount('');
    setCollectDiscount('0');
    setCollectWtax('0');
  };

  if (!activeCompany || !activeCompany.company_name || activeCompany.company_name.trim() === '' || activeCompany.company_name === 'Select Company...') {
    return (
      <div className={`p-8 md:p-12 rounded-2xl border ${theme.borderCard} ${theme.bgCard} text-center space-y-4 max-w-2xl mx-auto my-8 shadow-sm`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${theme.textTitle}`}>
            Entity Profile Required Before Entering Transactions
          </h3>
          <p className={`text-xs ${theme.textMuted} mt-1.5 max-w-md mx-auto leading-relaxed`}>
            Bago ka makapag-enter ng transactions, kailangan mo munang mag-setup ng entity profile kasi saan mapupunta ang transaction kung wala naman itong designated entity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToTab && onNavigateToTab('companies')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md cursor-pointer inline-flex items-center gap-2 transition"
        >
          <span>Set Up Entity Profile Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* FUNCTIONAL CONTROLS: SUB-TABS & JUMP LINKS (REDUNDANT TITLE BANNER REMOVED PER REQ 4) */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3`}>
        {/* SUB-TABS: Record Sale vs Collect Payment */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHubTab('new_sale')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'new_sale'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>1. Record New Sale Transaction</span>
          </button>

          <button
            type="button"
            onClick={() => setHubTab('collect_open')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'collect_open'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>2. Collect Payment for Existing Invoices</span>
            {openInvoices.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {openInvoices.length} open
              </span>
            )}
          </button>
        </div>

        {/* QUICK LINKS TO BOOKS */}
        {onNavigateToTab && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigateToTab('sales')}
              className="px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Subsidiary Sales</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('collections')}
              className="px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>Cash Receipts</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. RECORD NEW SALE TRANSACTION FORM                                       */}
      {/* ========================================================================= */}
      {hubTab === 'new_sale' && (
        <form onSubmit={handleSubmitSale} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: FORM INPUTS */}
          <div className={`lg:col-span-2 ${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-6`}>
            
            {/* 1. TRANSACTION SETTLEMENT MODE */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>1. Settlement Mode</span>
                </label>
                <span className="text-[10px] font-semibold text-zinc-400">
                  Select payment terms for automatic book routing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSaleMode('ON CASH')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    saleMode === 'ON CASH'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase tracking-wide">ON CASH</span>
                    {saleMode === 'ON CASH' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Full payment &rarr; <strong className="text-zinc-300">Sales & Cash Receipts</strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleMode('ON ACCOUNT')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    saleMode === 'ON ACCOUNT'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase tracking-wide">ON ACCOUNT</span>
                    {saleMode === 'ON ACCOUNT' ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Credit / Receivable &rarr; <strong className="text-zinc-300">Subsidiary Sales Only</strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleMode('ON PARTIAL')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    saleMode === 'ON PARTIAL'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase tracking-wide">ON PARTIAL</span>
                    {saleMode === 'ON PARTIAL' ? (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Down payment &rarr; <strong className="text-zinc-300">Sales & Collections</strong>
                  </span>
                </button>
              </div>

              {/* PARTIAL DOWN PAYMENT SUB-PANEL */}
              {saleMode === 'ON PARTIAL' && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/25 flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs border-b border-cyan-900/50 pb-2">
                    <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <Coins className="w-3.5 h-3.5 text-cyan-400" />
                      Partial Payment Details
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Max: ₱{liveFormulas.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        Down Payment Amount (₱) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        max={liveFormulas.total_amount_due}
                        placeholder="0.00"
                        value={downPaymentAmount}
                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-zinc-900 text-white font-mono font-bold ${
                          (parseFloat(downPaymentAmount) || 0) > liveFormulas.total_amount_due + 0.01
                            ? 'border-rose-500 ring-1 ring-rose-500'
                            : 'border-cyan-500/40 focus:ring-1 focus:ring-cyan-400'
                        }`}
                        required
                      />
                      {(parseFloat(downPaymentAmount) || 0) > liveFormulas.total_amount_due + 0.01 ? (
                        <div className="mt-1.5 p-2 rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-300 text-[11px] flex items-center gap-1.5 font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>Overpayment: Down payment exceeds Total Amount Due!</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Remaining A/R: <span className="font-mono text-cyan-300 font-semibold">₱{Math.max(0, liveFormulas.total_amount_due - (parseFloat(downPaymentAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                        1st Collection Reference / OR #
                      </label>
                      <input
                        type="text"
                        placeholder="OR # / Voucher ref"
                        value={collectionRef}
                        onChange={(e) => setCollectionRef(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-cyan-500/40 bg-zinc-900 text-white font-mono font-bold focus:ring-1 focus:ring-cyan-400"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Recorded as 1st Collection entry in Collections Book
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. INVOICE & DOCUMENT DETAILS */}
            <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/60">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>2. Document & Invoice Schedule</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>
                    Document Type
                  </label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  >
                    <option value="INVOICE" className="bg-zinc-900 text-white">INVOICE</option>
                    <option value="SALES INVOICE" className="bg-zinc-900 text-white">SALES INVOICE</option>
                    <option value="OFFICIAL RECEIPT" className="bg-zinc-900 text-white">OFFICIAL RECEIPT</option>
                    <option value="BILLING STATEMENT" className="bg-zinc-900 text-white">BILLING STATEMENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1 text-cyan-400">
                    Invoice Number (Unique) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SI-2026-0001"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold text-cyan-400 ${theme.borderInput} focus:ring-1 focus:ring-cyan-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>
                    Voucher # / Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. V-2026-001"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  />
                </div>
              </div>
            </div>

            {/* 3. CUSTOMER & TAXPAYER IDENTITY */}
            <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/60">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>3. Customer & Taxpayer Identity</span>
              </label>

              {/* Row A: Customer Name & Quick Pick */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>
                    Customer Registered Name <span className="text-rose-500">*</span>
                    <span className="text-[10px] text-cyan-400 font-normal ml-2">
                      (Type e.g. &quot;AB&quot; to auto-suggest &quot;ABC&quot;, &quot;BAB&quot;, &quot;DAB&quot;)
                    </span>
                  </label>
                  <AutoSuggestInput<Customer>
                    value={customerName}
                    onChange={(val) => {
                      setCustomerName(val);
                      const clean = val.trim().toLowerCase();
                      if (clean.length >= 2) {
                        const match = customers.find(c => {
                          const names = [c.registered_name, c.customer_name, c.trade_name].filter(Boolean).map(s => s!.toLowerCase());
                          return names.some(n => n === clean || (clean.length >= 3 && n.includes(clean)));
                        });
                        if (match) {
                          handleSelectCustomer(customerDisplayName(match));
                        }
                      }
                    }}
                    onSelect={(c) => {
                      const name = customerDisplayName(c);
                      setCustomerName(name);
                      handleSelectCustomer(name);
                    }}
                    items={customers}
                    categoryLabel="Customer"
                    theme={theme}
                    required
                    placeholder="Enter customer registered trade name (e.g. ABC, BAB, DAB)..."
                    getItemLabel={(c) => customerDisplayName(c)}
                    getItemSublabel={(c) => `TIN: ${c.client_TIN || c.customer_tin || 'N/A'} • ${c.address || c.client_Address || 'No address'}`}
                    getItemBadge={(c) => c.customer_branch_code || 'Customer'}
                    getSearchFields={(c) => [
                      c.registered_name || '',
                      c.customer_name || '',
                      c.trade_name || '',
                      c.client_TIN || '',
                      c.customer_tin || ''
                    ]}
                    inputClassName={`w-full px-3.5 py-2 text-xs rounded-xl border font-medium ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900 shadow-xs'} ${theme.borderInput} focus:ring-1 focus:ring-cyan-500`}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>
                    Quick Pick from Directory
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectCustomer(e.target.value);
                    }}
                    value=""
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-white text-slate-800 shadow-xs'} ${theme.borderInput} cursor-pointer focus:ring-1 focus:ring-cyan-500`}
                  >
                    <option value="" className={isDark ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-slate-500'}>
                      {customers.length > 0 ? `Select Customer (${customers.length})` : 'No Customers Saved'}
                    </option>
                    {customers.map((c, idx) => (
                      <option key={idx} value={customerDisplayName(c)} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                        {customerDisplayName(c)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row B: TIN & Branch Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-bold ${theme.textMuted}`}>Customer TIN (9 Digits)</label>
                    <span className="text-[10px] text-zinc-500">Format: 000-000-000</span>
                  </div>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="000-000-000"
                    value={tin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  />
                  {!tin.replace(/\D/g, '') ? (
                    <p className="text-[10px] text-amber-400/90 mt-1">Leave blank if Various / Non-TIN walk-in</p>
                  ) : (
                    <p className="text-[10px] text-zinc-500 mt-1">9-digit primary TIN</p>
                  )}
                </div>

                <div className="md:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-bold ${theme.textMuted}`}>Branch Code (5 Digits)</label>
                    <span className="text-[10px] text-zinc-500">Default: 00000</span>
                  </div>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="00000"
                    value={branchCode}
                    onChange={(e) => handleBranchCodeChange(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">00000 indicates Head Office</p>
                </div>
              </div>

              {/* Customer Match / Conflict Alerts */}
              {nameMatchedCustomer && !tin.replace(/\D/g, '') && (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong>Existing Customer Profile Detected:</strong> &quot;{nameMatchedCustomer.customer_name || nameMatchedCustomer.registered_name}&quot; exists in Customer Masterlist.
                  </div>
                </div>
              )}

              {hasTinNameConflict && tinMatchCustomer && (
                <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    <strong>TIN Conflict:</strong> TIN {tin} belongs to <strong>{tinMatchCustomer.registered_name || tinMatchCustomer.customer_name}</strong>.
                  </span>
                </div>
              )}

              {/* Row C: Address & Particulars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Registered Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 502 Ayala Tower, Makati City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Particulars / Description of Sale</label>
                  <input
                    type="text"
                    placeholder="e.g. Professional consulting, merchandise goods..."
                    value={particulars}
                    onChange={(e) => setParticulars(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  />
                </div>
              </div>
            </div>

            {/* 4. PRICING, QUANTITY & TAX COMPUTATION */}
            <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/60">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>4. Pricing, Line Amounts & Tax Classification</span>
              </label>

              {/* Row A: Tax Classification, Qty, Price, Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Tax Classification</label>
                  <select
                    value={businessTaxType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setBusinessTaxType(val);
                      setVatStatus(val === 'vatable' ? 'VAT' : 'NONVAT');
                      if (val !== 'zero-rated') setZeroRated('0');
                      if (val !== 'vat-exempt') setVatExempt('0');
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                  >
                    <option value="vatable" className="bg-zinc-900 text-white">Vatable (12% Output VAT)</option>
                    <option value="non-vatable" className="bg-zinc-900 text-white">Non-Vatable / Percentage</option>
                    <option value="vat-exempt" className="bg-zinc-900 text-white">VAT-Exempt</option>
                    <option value="zero-rated" className="bg-zinc-900 text-white">Zero-Rated (0% VAT)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Quantity</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Unit Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain} focus:ring-1 focus:ring-cyan-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Trade Discount (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono text-rose-400 ${theme.borderInput} focus:ring-1 focus:ring-rose-500`}
                  />
                </div>
              </div>

              {/* Row B: CWT 2307, Zero-Rated & VAT-Exempt in a balanced 3-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Column 1: CWT 2307 */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/80'}`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-bold ${theme.textMuted}`}>CWT 2307 Withheld (₱)</label>
                    <span className="text-[10px] text-amber-500 font-mono">
                      {liveFormulas.vatable_sales > 0 && `(10% = ₱${(Math.round(liveFormulas.vatable_sales * 0.10 * 100) / 100).toFixed(2)})`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={taxWithheld}
                    onChange={(e) => setTaxWithheld(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono font-bold ${
                      isDark ? 'bg-zinc-900 text-amber-400 border-zinc-700' : 'bg-white text-amber-700 border-slate-300 shadow-xs'
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Rate:</span>
                    <button
                      type="button"
                      onClick={() => setTaxWithheld('0')}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      0%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.01 * 100) / 100).toFixed(2))}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      }`}
                    >
                      1%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.02 * 100) / 100).toFixed(2))}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      }`}
                    >
                      2%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.05 * 100) / 100).toFixed(2))}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      }`}
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.10 * 100) / 100).toFixed(2))}
                      className="px-1.5 py-0.5 rounded text-[9.5px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/40 transition cursor-pointer"
                    >
                      10%
                    </button>
                  </div>
                </div>

                {/* Column 2: Zero-Rated */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/80'}`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-bold ${theme.textMuted}`}>Zero-Rated Amount (₱)</label>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>0% VAT</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={zeroRated}
                    onChange={(e) => setZeroRated(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono ${
                      isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Export sales / PEZA registered</p>
                </div>

                {/* Column 3: VAT-Exempt */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/80'}`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-bold ${theme.textMuted}`}>VAT-Exempt Amount (₱)</label>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Sec. 109</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={vatExempt}
                    onChange={(e) => setVatExempt(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono ${
                      isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Exempt goods &amp; services under law</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: LIVE COMPUTATION & SUBMISSION */}
          <div className="flex flex-col gap-5">
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-4 sticky top-4`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2 border-b ${isDark ? 'border-zinc-800' : 'border-slate-200'} pb-3`}>
                <BadgePercent className="w-4 h-4 text-emerald-400" />
                <span>Live Tax &amp; Financial Math</span>
              </h3>

              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-zinc-800/40' : 'border-slate-200'}`}>
                  <span className={theme.textMuted}>Gross Amount:</span>
                  <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>₱{liveFormulas.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-zinc-800/40' : 'border-slate-200'}`}>
                  <span className={theme.textMuted}>Vatable Sales (Base):</span>
                  <span className="font-bold text-emerald-500">₱{liveFormulas.vatable_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-zinc-800/40' : 'border-slate-200'}`}>
                  <span className={theme.textMuted}>Output VAT (12%):</span>
                  <span className="font-bold text-cyan-500">₱{liveFormulas.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {liveFormulas.less_discount > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isDark ? 'border-zinc-800/40' : 'border-slate-200'} text-rose-500`}>
                    <span>Less Discount:</span>
                    <span>-₱{liveFormulas.less_discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {liveFormulas.less_withholding_tax > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isDark ? 'border-zinc-800/40' : 'border-slate-200'} text-amber-500`}>
                    <span>Less Withheld (2307):</span>
                    <span>-₱{liveFormulas.less_withholding_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className={`flex justify-between items-baseline py-2.5 px-3 rounded-xl border mt-1 ${
                  isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>TOTAL DUE:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₱{liveFormulas.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {saleMode === 'ON PARTIAL' && (
                  <div className={`p-3 rounded-xl border flex flex-col gap-1 text-[11px] mt-1 ${
                    isDark ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                  }`}>
                    <div className={`flex justify-between ${isDark ? 'text-cyan-300' : 'text-cyan-900 font-semibold'}`}>
                      <span>Initial Down Payment:</span>
                      <span className="font-bold">₱{(parseFloat(downPaymentAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className={`flex justify-between font-bold border-t pt-1 ${
                      isDark ? 'text-amber-300 border-cyan-800/50' : 'text-amber-800 border-cyan-200'
                    }`}>
                      <span>Remaining A/R Balance:</span>
                      <span>₱{Math.max(0, liveFormulas.total_amount_due - (parseFloat(downPaymentAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ROUTING SUMMARY BOX */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-[11px] ${
                isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-200 bg-slate-50'
              }`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Destination Books:</span>
                <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Subsidiary Sales ({saleMode === 'ON CASH' ? 'Paid' : saleMode === 'ON PARTIAL' ? 'Partial' : 'On Account'})</span>
                </div>
                {saleMode === 'ON CASH' && (
                  <>
                    <div className="flex items-center gap-1.5 text-cyan-500 font-medium">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Cash Receipts Book (Cash Sales Settlement)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Collections Book (Payment Audit Tracking)</span>
                    </div>
                  </>
                )}
                {saleMode === 'ON PARTIAL' && (
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Collections Book (1st Down Payment Logged)</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const rawTin9 = tin.replace(/\D/g, '').slice(0, 9);
                    const formatted9 = rawTin9.length === 9 ? `${rawTin9.slice(0, 3)}-${rawTin9.slice(3, 6)}-${rawTin9.slice(6, 9)}` : '000-000-000';
                    const cleanBranch5 = (branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
                    const tempRecord: UniformBookRecord = {
                      id: 0,
                      company_name: activeCompanyName,
                      registered_name: customerName || 'Valued Client / Customer',
                      vat_or_nonvat: businessTaxType === 'vatable' ? 'VAT' : 'NONVAT',
                      business_tax_type: businessTaxType,
                      tin: `${formatted9}-${cleanBranch5}`,
                      address: address || 'Metro Manila, Philippines',
                      type_of_transaction: saleMode === 'ON CASH' ? 'CASH' : 'ON ACCOUNT',
                      date: date,
                      invoice_type: invoiceType,
                      voucher_number: voucherNo,
                      invoice_number: invoiceNo,
                      particulars: particulars || 'Sales Invoice',
                      qty: parseFloat(qty) || 1,
                      unit_price: parseFloat(unitPrice) || 0,
                      amount: liveFormulas.amount,
                      vatable_amount: liveFormulas.vatable_sales,
                      vat_amount: liveFormulas.vat,
                      zero_rated_amount: parseFloat(zeroRated) || 0,
                      vat_exempt_amount: parseFloat(vatExempt) || 0,
                      total_amount_vat_inclusive: liveFormulas.amount,
                      total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
                      discount: liveFormulas.less_discount,
                      tax_withheld: liveFormulas.less_withholding_tax,
                      total_amount_due: liveFormulas.total_amount_due,
                      status: saleMode === 'ON CASH' ? 'Cash' : (saleMode === 'ON PARTIAL' ? 'Partial' : 'On Account')
                    };
                    setPreviewRecord(tempRecord);
                  }}
                  className="w-1/2 py-3 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Route</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. COLLECT PAYMENT FOR EXISTING UNPAID / PARTIAL INVOICES                 */}
      {/* ========================================================================= */}
      {hubTab === 'collect_open' && (
        <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className={`text-base font-bold ${theme.textTitle} flex items-center gap-2`}>
                <Coins className="w-5 h-5 text-emerald-400" />
                <span>Open & Partially Paid Invoices (Accounts Receivable)</span>
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Select an open invoice to record collection. When cumulative collections reach 100%, the invoice is <strong>automatically recorded into Cash Receipts</strong>!
              </p>
            </div>

            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search invoice #, customer name..."
                value={openSearch}
                onChange={(e) => setOpenSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>

          {filteredOpenInvoices.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
              <p className="font-bold text-sm text-zinc-300">No Outstanding Invoices Found</p>
              <p className="text-xs mt-1">All sales transactions for {activeCompanyName || 'this company'} are fully collected or on cash basis!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3 text-right">Invoice Total</th>
                    <th className="p-3 text-right">Collected to Date</th>
                    <th className="p-3 text-right text-amber-400">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredOpenInvoices.map((inv) => {
                    const invDue = Number(inv.total_amount_due || inv.amount) || 0;
                    const matchingColls = collections.filter(c => 
                      !c.is_cancelled && 
                      c.invoice_number && 
                      isActiveCompanyRow(c) &&
                      sameInvoiceNo(c.invoice_number, inv.invoice_number)
                    );
                    const collectedSoFar = matchingColls.reduce((sum, c) => {
                      const cashVal = c.amount_collected !== undefined ? Number(c.amount_collected) : 0;
                      return sum + cashVal;
                    }, 0);
                    const balance = Math.max(0, Math.round((invDue - collectedSoFar) * 100) / 100);
                    const actualPaymentCount = matchingColls.filter(c => (c.amount_collected !== undefined ? Number(c.amount_collected) : 0) > 0).length;

                    return (
                      <tr key={inv.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3 font-mono font-bold text-cyan-400">{inv.invoice_number}</td>
                        <td className="p-3 font-mono text-zinc-400">{inv.date}</td>
                        <td className="p-3 font-medium text-zinc-200">
                          <div>{inv.registered_name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{inv.tin}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-200">
                          ₱{invDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          <div>₱{collectedSoFar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          {actualPaymentCount > 0 && (
                            <div className="text-[10px] text-zinc-400">{actualPaymentCount} collection(s)</div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-amber-400">
                          ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'Partial' || collectedSoFar > 0
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {collectedSoFar > 0 ? 'Partial' : (inv.status || 'On Account')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(inv)}
                              title="Preview Official BIR Invoice (VAT or Non-VAT)"
                              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceToCollect(inv);
                                setCollectAmount(String(balance));
                                setCollectDiscount('0');
                                setCollectWtax('0');
                                setCollectRefNo(`COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Collect Payment #{actualPaymentCount + 1}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteRecord) {
                                  onDeleteRecord('subsidiary_sales', inv);
                                } else {
                                  setSubsidiarySales(prev => prev.filter(s => s.id !== inv.id));
                                  setCollections(prev => prev.filter(c => !(c.invoice_number && isActiveCompanyRow(c) && sameInvoiceNo(c.invoice_number, inv.invoice_number))));
                                  setCashReceipts(prev => prev.filter(cr => !(cr.invoice_number && isActiveCompanyRow(cr) && sameInvoiceNo(cr.invoice_number, inv.invoice_number))));
                                  triggerAlert(`Deleted sale transaction Invoice #${inv.invoice_number} and all related collections.`, 'info');
                                }
                              }}
                              title="Delete Sales Invoice and all related Collections, Cash Receipts, Journal & Ledger entries"
                              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUICK COLLECTION MODAL */}
      {selectedInvoiceToCollect && (() => {
        const invDueModal = Number(selectedInvoiceToCollect.total_amount_due || selectedInvoiceToCollect.amount) || 0;
        const matchingCollsModal = collections.filter(c =>
          !c.is_cancelled &&
          c.invoice_number &&
          isActiveCompanyRow(c) &&
          sameInvoiceNo(c.invoice_number, selectedInvoiceToCollect.invoice_number) &&
          (c.amount_collected !== undefined ? Number(c.amount_collected) : 0) > 0
        );
        const collectedSoFarModal = matchingCollsModal.reduce((sum, c) => sum + (Number(c.amount_collected) || 0) + (Number(c.discount) || 0), 0);
        const remainingBalanceModal = Math.max(0, Math.round((invDueModal - collectedSoFarModal) * 100) / 100);
        const enteredTotalModal = Math.round(((parseFloat(collectAmount) || 0) + (parseFloat(collectDiscount) || 0)) * 100) / 100;
        const isOverpaymentModal = enteredTotalModal > remainingBalanceModal + 0.01;
        const nextCollectionNum = matchingCollsModal.length + 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
            <div className={`relative w-full max-w-lg ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col gap-4`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Record COLLECTION {nextCollectionNum}</h3>
                    <p className="text-[11px] text-zinc-400">Invoice #{selectedInvoiceToCollect.invoice_number} • Listed as Separate Payment Entry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceToCollect(null)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteCollection} className="flex flex-col gap-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Customer:</span>
                    <span className="font-bold text-zinc-200">{selectedInvoiceToCollect.registered_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Invoice Due:</span>
                    <span className="font-mono font-bold text-zinc-200">₱{invDueModal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {matchingCollsModal.length > 0 && (
                    <div className="pt-1 border-t border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-cyan-400 block">Previous Collections Made:</span>
                      {matchingCollsModal.slice().reverse().map((prevCol, idx) => (
                        <div key={prevCol.id} className="flex justify-between font-mono text-[11px] text-emerald-400">
                          <span>COLLECTION {idx + 1} ({prevCol.date}):</span>
                          <span>₱{(Number(prevCol.amount_collected) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-zinc-800">
                    <span className="text-amber-400 font-bold">Remaining Pending Balance:</span>
                    <span className="font-mono font-extrabold text-amber-400">₱{remainingBalanceModal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* OVERPAYMENT PRECAUTION BANNER */}
                {isOverpaymentModal && (
                  <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/15 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-rose-200">Customer Overpayment Precaution</div>
                      <div>
                        Entered collection (₱{enteredTotalModal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the remaining balance due (₱{remainingBalanceModal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) by <strong>₱{(enteredTotalModal - remainingBalanceModal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCollectAmount(String(Math.max(0, remainingBalanceModal - (parseFloat(collectDiscount) || 0))));
                        }}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-white font-bold text-[10px] cursor-pointer transition"
                      >
                        Set to Exact Remaining Balance (₱{remainingBalanceModal.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Cash Collected (₱) *</label>
                    <input
                      type="number"
                      step="any"
                      max={remainingBalanceModal}
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent text-white font-mono font-bold ${
                        isOverpaymentModal ? 'border-rose-500 ring-1 ring-rose-500' : 'border-zinc-700'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Discounts (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={collectDiscount}
                      onChange={(e) => setCollectDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Withholding Tax (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={collectWtax}
                      onChange={(e) => setCollectWtax(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono"
                    />
                  </div>
                </div>

                {/* LIVE JOURNAL ENTRY 2 PREVIEW */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-amber-400">
                    <span>COLLECTION {nextCollectionNum} Journal Preview:</span>
                    <span className="font-mono">
                      Total A/R Credit: ₱{((parseFloat(collectAmount) || 0) + (parseFloat(collectDiscount) || 0) + (parseFloat(collectWtax) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] space-y-0.5 text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-emerald-400">(dr) Cash and Cash Equivalents [1010]</span>
                      <span>₱{(parseFloat(collectAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {(parseFloat(collectDiscount) || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-rose-400">(dr) Sales Discounts [4015]</span>
                        <span>₱{(parseFloat(collectDiscount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {(parseFloat(collectWtax) || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-cyan-400">(dr) Withholding Tax 2307 [1040]</span>
                        <span>₱{(parseFloat(collectWtax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-zinc-800 text-amber-300 font-bold">
                      <span>(cr) Accounts Receivable [1020]</span>
                      <span>₱{((parseFloat(collectAmount) || 0) + (parseFloat(collectDiscount) || 0) + (parseFloat(collectWtax) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Collection Date</label>
                    <input
                      type="date"
                      value={collectDate}
                      onChange={(e) => setCollectDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Official Receipt (OR) / Ref #</label>
                    <input
                      type="text"
                      value={collectRefNo}
                      onChange={(e) => setCollectRefNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceToCollect(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOverpaymentModal}
                    className={`px-4 py-2 rounded-xl font-bold ${
                      isOverpaymentModal
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                  >
                    Confirm COLLECTION {nextCollectionNum}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* EXISTING CUSTOMER NAME MATCH CONFIRMATION & TIN VERIFICATION MODAL */}
      {existingCustomerMatchPrompt && existingCustomerMatchPrompt.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-2xl space-y-4 animate-scaleUp`}>
            <div className="flex items-center justify-between border-b border-zinc-700/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme.textTitle}`}>
                    Existing Customer Name Found in Directory
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Customer &quot;{existingCustomerMatchPrompt.matchedCustomer.customer_name || existingCustomerMatchPrompt.matchedCustomer.registered_name}&quot; is already recorded
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExistingCustomerMatchPrompt(null)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {existingCustomerMatchPrompt.step === 'ask_same' ? (
              <>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5">
                  <p className={theme.textMain}>
                    A registered customer named <strong>&quot;{existingCustomerMatchPrompt.matchedCustomer.customer_name || existingCustomerMatchPrompt.matchedCustomer.registered_name}&quot;</strong> already exists in <strong>Directory &gt; Customers</strong>.
                  </p>
                  <p className="text-zinc-400">
                    Is this the <strong>same customer</strong> as the one recorded in your Customer Directory?
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const matched = existingCustomerMatchPrompt.matchedCustomer;
                      const regName = customerDisplayName(matched);
                      const onFileTin = tin9Of(matched);
                      const fmt = onFileTin.length === 9
                        ? `${onFileTin.slice(0, 3)}-${onFileTin.slice(3, 6)}-${onFileTin.slice(6, 9)}`
                        : (tin.replace(/\D/g, '').length === 9 ? tin : '000-000-000');
                      const br5 = (matched.customer_branch_code || matched.tin_branch_code || branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
                      const addr = matched.address || matched.client_Address || matched.customer_address || address;

                      setCustomerName(regName);
                      setTin(fmt);
                      setBranchCode(br5);
                      if (!address && addr) setAddress(addr);
                      setExistingCustomerMatchPrompt(null);
                      executeRecordSale(false, false, fmt, br5, addr, regName);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm cursor-pointer"
                  >
                    ✓ Yes, Same Customer (Route & Record to Existing Profile)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Treated differently even if same name -> goes strictly to Various Customers without duplicating in Registered Customers
                      executeRecordSale(false, true, '000-000-000', '00000');
                    }}
                    className="w-full px-4 py-2.5 text-xs font-bold rounded-xl text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition cursor-pointer"
                  >
                    ✕ No, Different Customer (Record as Various Customer Only)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExistingCustomerMatchPrompt(null)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white border border-zinc-700/40 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs space-y-2">
                  <p className={theme.textMain}>
                    Please enter the <strong>9-digit Customer TIN</strong> and <strong>5-digit Branch Code</strong> of <strong>&quot;{existingCustomerMatchPrompt.matchedCustomer.customer_name || existingCustomerMatchPrompt.matchedCustomer.registered_name}&quot;</strong> to confirm that this customer is the same as the one recorded in the directory:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Confirm Customer TIN (9 Digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. 222-222-222"
                      value={existingCustomerMatchPrompt.verifyTinInput}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 9);
                        let fmt = '';
                        if (d.length > 0) fmt += d.slice(0, 3);
                        if (d.length > 3) fmt += '-' + d.slice(3, 6);
                        if (d.length > 6) fmt += '-' + d.slice(6, 9);
                        setExistingCustomerMatchPrompt({
                          ...existingCustomerMatchPrompt,
                          verifyTinInput: fmt,
                          errorText: undefined
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-cyan-500/40 bg-zinc-900 font-mono font-bold text-cyan-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Branch Code (5 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="00000"
                      value={existingCustomerMatchPrompt.verifyBranchInput}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setExistingCustomerMatchPrompt({
                          ...existingCustomerMatchPrompt,
                          verifyBranchInput: d,
                          errorText: undefined
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 font-mono font-bold text-white text-xs"
                    />
                  </div>
                </div>

                {existingCustomerMatchPrompt.errorText && (
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{existingCustomerMatchPrompt.errorText}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const enteredDigits = existingCustomerMatchPrompt.verifyTinInput.replace(/\D/g, '').slice(0, 9);
                      const expectedDigits = tin9Of(existingCustomerMatchPrompt.matchedCustomer);

                      if (enteredDigits.length !== 9) {
                        setExistingCustomerMatchPrompt({
                          ...existingCustomerMatchPrompt,
                          errorText: 'Please enter the 9-digit TIN to confirm.'
                        });
                        return;
                      }

                      const matchedCust = existingCustomerMatchPrompt.matchedCustomer;
                      if (expectedDigits.length !== 9 && setCustomers) {
                        // Registered customer has no usable TIN on file: adopt the entered TIN (and keep the same entity)
                        const fmtNew = `${enteredDigits.slice(0, 3)}-${enteredDigits.slice(3, 6)}-${enteredDigits.slice(6, 9)}`;
                        const brNew = (existingCustomerMatchPrompt.verifyBranchInput || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
                        setCustomers(prev => prev.map(c => c.id === matchedCust.id ? {
                          ...c,
                          client_TIN: fmtNew,
                          customer_tin: fmtNew,
                          tin_number: fmtNew,
                          customer_branch_code: brNew,
                          tin_branch_code: brNew
                        } : c));
                        setTin(fmtNew);
                        setBranchCode(brNew);
                        executeRecordSale(false, false, fmtNew, brNew, matchedCust.customer_address || matchedCust.client_Address || matchedCust.address || address, customerDisplayName(matchedCust));
                        return;
                      }

                      if (enteredDigits !== expectedDigits) {
                        setExistingCustomerMatchPrompt({
                          ...existingCustomerMatchPrompt,
                          errorText: `Entered TIN (${existingCustomerMatchPrompt.verifyTinInput}) does not match the registered TIN on file for "${existingCustomerMatchPrompt.matchedCustomer.customer_name || existingCustomerMatchPrompt.matchedCustomer.registered_name}". If this is a different customer, click "Record as Various Customer Only".`
                        });
                        return;
                      }

                      const fmt9 = `${enteredDigits.slice(0, 3)}-${enteredDigits.slice(3, 6)}-${enteredDigits.slice(6, 9)}`;
                      const br5 = (existingCustomerMatchPrompt.verifyBranchInput || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
                      const matchedAddr = existingCustomerMatchPrompt.matchedCustomer.customer_address || existingCustomerMatchPrompt.matchedCustomer.client_Address || address;
                      setTin(fmt9);
                      setBranchCode(br5);
                      if (!address && matchedAddr) setAddress(matchedAddr);
                      executeRecordSale(false, false, fmt9, br5, matchedAddr, customerDisplayName(existingCustomerMatchPrompt.matchedCustomer));
                    }}
                    className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm cursor-pointer"
                  >
                    ✓ Confirm TIN & Record to Registered Customer
                  </button>

                  <button
                    type="button"
                    onClick={() => executeRecordSale(false, true, '000-000-000', '00000')}
                    className="px-3 py-2.5 text-xs font-bold rounded-xl text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition cursor-pointer"
                  >
                    Record as Various Customer Only
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExistingCustomerMatchPrompt({
                        ...existingCustomerMatchPrompt,
                        step: 'ask_same',
                        errorText: undefined
                      })
                    }
                    className="px-3 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white border border-zinc-700/40 transition cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* NEW CUSTOMER CONFIRMATION / ADD TO REGULAR CUSTOMERS MODAL */}
      {newCustomerPrompt && newCustomerPrompt.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-2xl space-y-4 animate-scaleUp`}>
            <div className="flex items-center justify-between border-b border-zinc-700/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme.textTitle}`}>Confirm Customer Details</h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Customer &quot;{newCustomerPrompt.customerName}&quot; is not yet in your Registered Customer Directory
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setNewCustomerPrompt(null)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${theme.textMain}`}>
              Would you like to add <strong>&quot;{newCustomerPrompt.customerName}&quot;</strong> to your <strong>Regular Customers Directory</strong> (requires 9-digit TIN &amp; 5-digit Branch Code), or record this transaction under <strong>Various Customers</strong>?
            </p>

            <div className="space-y-3 p-3.5 bg-zinc-800/30 rounded-xl border border-zinc-700/30 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Registered Trade Name</label>
                <input 
                  type="text"
                  value={newCustomerPrompt.customerName}
                  onChange={(e) => setNewCustomerPrompt({ ...newCustomerPrompt, customerName: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border bg-zinc-900 ${theme.borderInput} ${theme.textMain} text-xs`}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Customer TIN (9 Digits)</label>
                  <input 
                    type="text"
                    maxLength={11}
                    placeholder="000-000-000"
                    value={newCustomerPrompt.tin}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 9);
                      let fmt = '';
                      if (d.length > 0) fmt += d.slice(0, 3);
                      if (d.length > 3) fmt += '-' + d.slice(3, 6);
                      if (d.length > 6) fmt += '-' + d.slice(6, 9);
                      setNewCustomerPrompt({ ...newCustomerPrompt, tin: fmt });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border bg-zinc-950 font-mono text-cyan-400 font-bold border-zinc-700/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Branch (5 Digits)</label>
                  <input 
                    type="text"
                    maxLength={5}
                    placeholder="00000"
                    value={newCustomerPrompt.branchCode}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setNewCustomerPrompt({ ...newCustomerPrompt, branchCode: d });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border bg-zinc-950 font-mono text-white font-bold border-zinc-700/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tax Classification</label>
                  <select
                    value={newCustomerPrompt.taxType}
                    onChange={(e) => setNewCustomerPrompt({ ...newCustomerPrompt, taxType: e.target.value as any })}
                    className={`w-full px-3 py-1.5 rounded-lg border bg-zinc-900 ${theme.borderInput} ${theme.textMain} text-xs`}
                  >
                    <option value="VAT">VAT Registered (12%)</option>
                    <option value="Non-VAT">Non-VAT / Percentage</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Business Address</label>
                <input 
                  type="text"
                  placeholder="Enter customer business address..."
                  value={newCustomerPrompt.address}
                  onChange={(e) => setNewCustomerPrompt({ ...newCustomerPrompt, address: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border bg-zinc-900 ${theme.borderInput} ${theme.textMain} text-xs`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const raw9 = newCustomerPrompt.tin.replace(/\D/g, '').slice(0, 9);
                  if (raw9.length !== 9 || /^0+$/.test(raw9)) {
                    triggerAlert('Please enter a valid 9-digit TIN (e.g. 222-222-222) to add this customer to Regular Customers, or choose "Track as Various Customer Only".', 'error');
                    return;
                  }
                  const fmt9 = `${raw9.slice(0, 3)}-${raw9.slice(3, 6)}-${raw9.slice(6, 9)}`;
                  const br5 = (newCustomerPrompt.branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
                  setTin(fmt9);
                  setBranchCode(br5);
                  executeRecordSale(true, false, fmt9, br5, newCustomerPrompt.address, newCustomerPrompt.customerName);
                }}
                className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-sm cursor-pointer"
              >
                ✓ Add to Regular Customers &amp; Record Sale
              </button>
              <button
                type="button"
                onClick={() => executeRecordSale(false, true, '000-000-000', '00000')}
                className="px-4 py-2.5 text-xs font-bold rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
              >
                Track as Various Customer Only
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerPrompt(null)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white border border-zinc-700/40 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
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
