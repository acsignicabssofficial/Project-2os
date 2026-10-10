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
  Eye
} from 'lucide-react';
import InvoiceReceiptPreviewModal from './InvoiceReceiptPreviewModal';
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
  setSpecialEntries
}: SalesTransactionTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  // Tab mode: 'new_sale' or 'collect_open'
  const [hubTab, setHubTab] = useState<'new_sale' | 'collect_open'>('new_sale');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [vatStatus, setVatStatus] = useState<'VAT' | 'NONVAT'>(
    activeCompany?.vat_or_non_vat === 'NON-VATABLE' ? 'NONVAT' : 'VAT'
  );
  const [tin, setTin] = useState('');
  const [address, setAddress] = useState('');
  const [invoiceType, setInvoiceType] = useState('SALES INVOICE');
  const [invoiceNo, setInvoiceNo] = useState(`INV #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [particulars, setParticulars] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('25000');
  const [zeroRated, setZeroRated] = useState('0');
  const [vatExempt, setVatExempt] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [taxWithheld, setTaxWithheld] = useState('0');

  // Transaction Mode: 'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'
  const [saleMode, setSaleMode] = useState<'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'>('ON CASH');

  // Partial mode fields (Requirement 6: ask only for down payment)
  const [downPaymentAmount, setDownPaymentAmount] = useState('15000');
  const [downPaymentWithholding, setDownPaymentWithholding] = useState('0');
  const [collectionRef, setCollectionRef] = useState(`COLL #${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);

  // Prompt modal to add new customer with TIN to database (Requirement 3)
  const [newCustomerPrompt, setNewCustomerPrompt] = useState<{
    isOpen: boolean;
    customerName: string;
    tin: string;
    address: string;
    taxType: 'VAT' | 'Non-VAT';
    pendingSaleData?: any;
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
    const registeredName = (tinMatchCustomer.registered_name || tinMatchCustomer.customer_name || tinMatchCustomer.trade_name || '').trim();
    return registeredName.toLowerCase() !== customerName.trim().toLowerCase();
  }, [tinMatchCustomer, customerName]);

  // Auto-fill TIN & Customer details
  const handleSelectCustomer = (custName: string) => {
    setCustomerName(custName);
    const found = customers.find(c => 
      (c.registered_name || c.customer_name || c.trade_name || '').toLowerCase() === custName.toLowerCase()
    );
    if (found) {
      setTin(found.client_TIN || found.customer_tin || '');
      setAddress(found.address || found.client_Address || '');
      if (found.vat_status) {
        setVatStatus((found.vat_status || '').toUpperCase().includes('NON') ? 'NONVAT' : 'VAT');
      }
    }
  };

  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 14);
    setTin(formatted);

    if (digits.length >= 9 && !/^0+$/.test(digits)) {
      const found = customers.find(c => (c.client_TIN || c.customer_tin || '').replace(/\D/g, '').startsWith(digits.slice(0, 9)));
      if (found) {
        if (!customerName) setCustomerName(found.registered_name || found.customer_name || found.trade_name || '');
        if (!address) setAddress(found.address || found.client_Address || '');
      }
    }
  };

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
      if (activeCompanyName && s.company_name && s.company_name !== activeCompanyName) return false;
      // Calculate how much has been collected across the collections book for this invoice
      const matchingCollections = collections.filter(c => 
        !c.is_cancelled && 
        c.invoice_number && 
        c.invoice_number.trim().toLowerCase() === s.invoice_number.trim().toLowerCase()
      );
      const totalCollected = matchingCollections.reduce((sum, c) => sum + (Number(c.amount_collected || c.amount) || 0), 0);
      const invoiceDue = Number(s.total_amount_due || s.amount) || 0;
      const isPaid = (s.status === 'Cash' || s.status === 'Paid') && totalCollected >= invoiceDue;
      return !isPaid && (s.status === 'On Account' || s.status === 'Partial' || totalCollected < invoiceDue);
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

    const totalDue = liveFormulas.total_amount_due;
    const nowIso = new Date().toISOString();
    const commonId = Date.now();

    const isVat = vatStatus === 'VAT';
    const zeroRatedVal = parseFloat(zeroRated) || 0;
    const vatExemptVal = parseFloat(vatExempt) || 0;
    const discountsVal = parseFloat(discount) || 0;
    const wtaxVal = parseFloat(taxWithheld) || 0;
    const vatableSalesVal = liveFormulas.vatable_sales;
    const vatOutputVal = liveFormulas.vat;
    const totalGrossSales = Math.round((vatableSalesVal + vatOutputVal + zeroRatedVal + vatExemptVal) * 100) / 100 || liveFormulas.total_sale_vat_inclusive;

    // 1. Prepare Base Record for Subsidiary Sales
    let assignedStatus: 'Cash' | 'On Account' | 'Partial' | 'Paid' = 'On Account';
    let assignedTransactionType: 'CASH' | 'ON ACCOUNT' = 'ON ACCOUNT';

    if (saleMode === 'ON CASH') {
      assignedStatus = 'Paid';
      assignedTransactionType = 'CASH';
    } else if (saleMode === 'ON PARTIAL') {
      const downPmt = parseFloat(downPaymentAmount) || 0;
      assignedStatus = (recordSecondPaymentNow || downPmt >= totalDue) ? 'Paid' : 'Partial';
      assignedTransactionType = 'ON ACCOUNT';
    }

    const saleRecord: UniformBookRecord = {
      id: commonId,
      company_name: activeCompanyName,
      registered_name: customerName.trim(),
      vat_or_nonvat: vatStatus,
      tin: tin.trim() || '000-000-000-00000',
      address: address.trim(),
      type_of_transaction: assignedTransactionType,
      date: date,
      invoice_type: invoiceType,
      voucher_number: voucherNo.trim(),
      invoice_number: invoiceNo.trim(),
      particulars: particulars.trim() || 'Sales of Goods & Services',
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
      created_at: nowIso
    };

    // 2. Routing Logic based on user specification:
    // 5.1 / 6.1 Sales (other transaction) is single-entry method -> NO journal entry created directly here.
    // 5.2 / 6.2 Subsidiary Sales records the sale (and General Journal derives the A/R & Sales entry from Subsidiary Sales).
    setSubsidiarySales(prev => [saleRecord, ...prev]);

    if (saleMode === 'ON ACCOUNT') {
      // Also record in Collections Book as 'On Account' with pending balance so Collections Book tracks all pending receivables (Clarification #4)
      const onAccountTrackingRecord: UniformBookRecord = {
        ...saleRecord,
        id: commonId + 1,
        invoice_type: 'SALES INVOICE',
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
        registered_name: customerName.trim(),
        vat_or_nonvat: vatStatus,
        tin: tin.trim() || '000-000-000-00000',
        address: address.trim(),
        type_of_transaction: 'CASH',
        date: date,
        invoice_type: 'OFFICIAL RECEIPT',
        voucher_number: voucherNo.trim() || `CR-${Date.now().toString().slice(-4)}`,
        invoice_number: invoiceNo.trim(),
        particulars: `Full Cash Settlement for Invoice #${invoiceNo.trim()} - ${particulars || 'Sales'}`,
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
      const downPmt = parseFloat(downPaymentAmount) || 0;
      const downWtax = parseFloat(downPaymentWithholding) || 0;

      if (downPmt <= 0) {
        triggerAlert('Please enter a valid Down Payment / 1st Collection amount.', 'error');
        return;
      }

      const remainingCashBalance = Math.max(0, Math.round((totalDue - downPmt) * 100) / 100);
      const isCompletedWithSecondPayment = recordSecondPaymentNow || remainingCashBalance <= 0.01;

      const installments = [
        {
          payment_no: 1,
          date: date,
          ref_no: collectionRef.trim() || `OR-1ST-${Date.now().toString().slice(-4)}`,
          cash_amount: downPmt,
          discount: 0,
          wtax_2307: remainingCashBalance <= 0.01 ? liveFormulas.less_withholding_tax : downWtax,
          is_final: remainingCashBalance <= 0.01
        }
      ];

      if (recordSecondPaymentNow && remainingCashBalance > 0.01) {
        installments.push({
          payment_no: 2,
          date: secondPaymentDate || date,
          ref_no: secondPaymentRef.trim() || `OR-2ND-${Date.now().toString().slice(-4)}`,
          cash_amount: remainingCashBalance,
          discount: 0,
          wtax_2307: Math.max(0, Math.round((liveFormulas.less_withholding_tax - downWtax) * 100) / 100),
          is_final: true
        });
      }

      const totalCashCollected = isCompletedWithSecondPayment ? totalDue : downPmt;
      const pendingBal = isCompletedWithSecondPayment ? 0 : remainingCashBalance;

      // 6.4 Record in Collections Book with full sale figures (vatable sales 22,321.43, vat output 2,678.57, 2307 2,232.14, cash received 22,767.86) and installments
      const partialCollectionRecord: UniformBookRecord = {
        id: commonId + 1,
        company_name: activeCompanyName,
        registered_name: customerName.trim(),
        vat_or_nonvat: vatStatus,
        tin: tin.trim() || '000-000-000-00000',
        address: address.trim(),
        type_of_transaction: 'ON ACCOUNT',
        date: isCompletedWithSecondPayment ? (secondPaymentDate || date) : date,
        invoice_type: 'OFFICIAL RECEIPT',
        voucher_number: collectionRef.trim() || `COL-${Date.now().toString().slice(-4)}`,
        invoice_number: invoiceNo.trim(),
        particulars: isCompletedWithSecondPayment
          ? `Paid in Partial (1st Down Payment: ₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} | 2nd Payment: ₱${remainingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})`
          : `1st Payment / Down Payment for Invoice #${invoiceNo.trim()} (Collected: ₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Pending: ₱${remainingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
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
        amount_collected: totalCashCollected,
        pending_balance: pendingBal,
        amount_withheld_2307: liveFormulas.less_withholding_tax,
        status: isCompletedWithSecondPayment ? 'Paid' : 'Partial',
        installments,
        is_cancelled: false,
        created_at: nowIso
      };

      setCollections(prev => [partialCollectionRecord, ...prev]);

      if (isCompletedWithSecondPayment) {
        // 6.3 Cash Receipts also records the fully paid sale (no duplicate journal entry since journalized in Collections Book)
        setCashReceipts(prev => [{
          ...partialCollectionRecord,
          id: commonId + 2,
          type_of_transaction: 'ON ACCOUNT',
          status: 'Paid',
          settled_via_collections: true,
          particulars: `Full Settlement Completed via Collections Book for Invoice #${invoiceNo.trim()} (1st: ₱${downPmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} + 2nd: ₱${remainingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})`
        }, ...prev]);
        triggerAlert(`Partial Sale ${invoiceNo} (1st: ₱${downPmt.toLocaleString()} + 2nd: ₱${remainingCashBalance.toLocaleString()}) recorded to Subsidiary Sales, Collections Book, and Cash Receipts!`, 'success');
      } else {
        triggerAlert(`Partial Sale ${invoiceNo} recorded to Subsidiary Sales & Collections Book. 1st Payment: ₱${downPmt.toLocaleString()} (Pending Balance: ₱${remainingCashBalance.toLocaleString()}).`, 'info');
      }
    }

    // Reset Form for next entry
    setInvoiceNo(`SI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    setParticulars('');
    setUnitPrice('25000');
    setDownPaymentAmount('15000');
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
    const invTotalDue = Number(inv.total_amount_due || inv.amount) || 0;
    const invWtax = Number(inv.tax_withheld || inv.withholding_2307) || 0;

    // Check existing collection record(s) for this invoice
    const existingMatching = collections.filter(c => 
      !c.is_cancelled && 
      c.invoice_number && 
      c.invoice_number.trim().toLowerCase() === inv.invoice_number.trim().toLowerCase()
    );

    const prevCashCollected = existingMatching.reduce((sum, c) => sum + (Number(c.amount_collected || 0)), 0);
    const prevDiscount = existingMatching.reduce((sum, c) => {
      if (Array.isArray(c.installments) && c.installments.length > 0) {
        return sum + c.installments.reduce((s, inst) => s + (Number(inst.discount) || 0), 0);
      }
      return sum;
    }, 0);
    const prevInstallmentWtax = existingMatching.reduce((sum, c) => {
      if (Array.isArray(c.installments) && c.installments.length > 0) {
        return sum + c.installments.reduce((s, inst) => s + (Number(inst.wtax_2307) || 0), 0);
      }
      return sum + (Number(c.amount_withheld_2307) || 0);
    }, 0);

    const newTotalCashCollected = Math.round((prevCashCollected + paymentAmt) * 100) / 100;
    const newTotalSettledTowardsDue = Math.round((newTotalCashCollected + prevDiscount + discountAmt + (invWtax === 0 ? manualWtaxAmt : 0)) * 100) / 100;
    const isNowFullyCollected = newTotalSettledTowardsDue >= (invTotalDue - 0.05);

    // Upon full collection completion, recognize the invoice's 2307 withholding tax (or manualWtaxAmt)
    const wtaxForThisInstallment = manualWtaxAmt > 0
      ? manualWtaxAmt
      : (isNowFullyCollected ? Math.max(0, Math.round((invWtax - prevInstallmentWtax) * 100) / 100) : 0);

    const commonId = Date.now();
    const nowIso = new Date().toISOString();
    const pendingBal = Math.max(0, Math.round((invTotalDue - newTotalSettledTowardsDue) * 100) / 100);

    // 1. Update or add consolidated record in Collections Book (with installments array)
    setCollections(prev => {
      const existingIdx = prev.findIndex(c => !c.is_cancelled && c.invoice_number && c.invoice_number.trim().toLowerCase() === inv.invoice_number.trim().toLowerCase());
      if (existingIdx !== -1) {
        const existingRec = prev[existingIdx];
        const prevInsts = Array.isArray(existingRec.installments) && existingRec.installments.length > 0
          ? existingRec.installments
          : (Number(existingRec.amount_collected) > 0 ? [{
              payment_no: 1,
              date: existingRec.date || inv.date,
              ref_no: existingRec.voucher_number || `OR-1ST`,
              cash_amount: Number(existingRec.amount_collected) || 0,
              discount: 0,
              wtax_2307: 0,
              is_final: false
            }] : []);

        const nextPaymentNo = prevInsts.length + 1;
        const nextInst = {
          payment_no: nextPaymentNo,
          date: collectDate,
          ref_no: collectRefNo.trim() || `CR-${Date.now().toString().slice(-4)}`,
          cash_amount: paymentAmt,
          discount: discountAmt,
          wtax_2307: wtaxForThisInstallment,
          is_final: isNowFullyCollected
        };

        const updatedInsts = [...prevInsts, nextInst];
        const breakdownStr = updatedInsts.map(i => `#${i.payment_no}: ₱${i.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join(' + ');

        const updatedRec: UniformBookRecord = {
          ...existingRec,
          date: collectDate,
          voucher_number: collectRefNo.trim() || existingRec.voucher_number,
          vatable_amount: inv.vatable_amount,
          vat_amount: inv.vat_amount,
          zero_rated_amount: inv.zero_rated_amount,
          vat_exempt_amount: inv.vat_exempt_amount,
          total_amount_vat_inclusive: inv.total_amount_vat_inclusive,
          total_amount_net_of_vat: inv.total_amount_net_of_vat,
          discount: Math.round(((Number(inv.discount) || 0) + discountAmt) * 100) / 100,
          tax_withheld: invWtax || wtaxForThisInstallment,
          amount_withheld_2307: invWtax || wtaxForThisInstallment,
          total_amount_due: invTotalDue,
          amount_collected: newTotalCashCollected,
          pending_balance: pendingBal,
          status: isNowFullyCollected ? 'Paid' : 'Partial',
          particulars: `Collections for Invoice #${inv.invoice_number} (${breakdownStr})`,
          installments: updatedInsts
        };

        const copy = [...prev];
        copy[existingIdx] = updatedRec;
        return copy;
      } else {
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
          voucher_number: collectRefNo.trim() || `CR-${Date.now().toString().slice(-4)}`,
          invoice_number: inv.invoice_number,
          particulars: `Collection for Invoice #${inv.invoice_number} (${isNowFullyCollected ? 'Full Settlement' : 'Partial'})`,
          qty: inv.qty || 1,
          unit_price: inv.unit_price || inv.amount,
          amount: inv.amount,
          vatable_amount: inv.vatable_amount,
          vat_amount: inv.vat_amount,
          zero_rated_amount: inv.zero_rated_amount,
          vat_exempt_amount: inv.vat_exempt_amount,
          total_amount_vat_inclusive: inv.total_amount_vat_inclusive,
          total_amount_net_of_vat: inv.total_amount_net_of_vat,
          discount: Math.round(((Number(inv.discount) || 0) + discountAmt) * 100) / 100,
          tax_withheld: invWtax || wtaxForThisInstallment,
          amount_withheld_2307: invWtax || wtaxForThisInstallment,
          total_amount_due: invTotalDue,
          amount_collected: newTotalCashCollected,
          pending_balance: pendingBal,
          status: isNowFullyCollected ? 'Paid' : 'Partial',
          installments: [{
            payment_no: 1,
            date: collectDate,
            ref_no: collectRefNo.trim() || `CR-${Date.now().toString().slice(-4)}`,
            cash_amount: paymentAmt,
            discount: discountAmt,
            wtax_2307: wtaxForThisInstallment,
            is_final: isNowFullyCollected
          }],
          is_cancelled: false,
          created_at: nowIso
        };
        return [newCollectionRec, ...prev];
      }
    });

    // 2. Update status in Subsidiary Sales (6.2: status "Paid" when full payment is completed)
    setSubsidiarySales(prev => prev.map(s => {
      if (s.invoice_number === inv.invoice_number) {
        return {
          ...s,
          status: isNowFullyCollected ? 'Paid' : 'Partial'
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
        const filtered = prev.filter(cr => cr.invoice_number.trim().toLowerCase() !== inv.invoice_number.trim().toLowerCase());
        return [fullCashReceipt, ...filtered];
      });

      triggerAlert(
        `Invoice #${inv.invoice_number} is now PAID IN FULL (Cash Collected: ₱${newTotalCashCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })} | 2307: ₱${(invWtax || wtaxForThisInstallment).toLocaleString(undefined, { minimumFractionDigits: 2 })}) and recorded to Cash Receipts!`,
        'success'
      );
    } else {
      triggerAlert(
        `Recorded collection of ₱${paymentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} for Invoice #${inv.invoice_number}. Remaining Balance: ₱${pendingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`,
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
    <div className="flex flex-col gap-5 w-full">
      {/* HEADER BANNER */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-xs`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold tracking-tight ${theme.textTitle}`}>
                  Sales Transaction Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Primary Encoding Tool
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${theme.textMuted}`}>
                Record new sales transactions. Routes automatically to <strong>Subsidiary Sales</strong>, <strong>Cash Receipts</strong> (Cash only), and <strong>Collections</strong>.
              </p>
            </div>
          </div>

          {/* QUICK LINKS TO BOOKS */}
          <div className="flex items-center gap-2 text-xs">
            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('sales')}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Subsidiary Sales</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('collections')}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Cash Receipts</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* SUB-TABS: Record Sale vs Collect Payment */}
        <div className="flex gap-2 mt-5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setHubTab('new_sale')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'new_sale'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>1. Record New Sale Transaction</span>
          </button>

          <button
            type="button"
            onClick={() => setHubTab('collect_open')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'collect_open'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>2. Collect Payment for Existing Invoices</span>
            {openInvoices.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {openInvoices.length} open
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RECORD NEW SALE TRANSACTION FORM                                       */}
      {/* ========================================================================= */}
      {hubTab === 'new_sale' && (
        <form onSubmit={handleSubmitSale} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: FORM INPUTS */}
          <div className={`lg:col-span-2 ${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-5`}>
            {/* STEP 1: TRANSACTION MODE SELECTOR */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme.textTitle} flex items-center gap-2`}>
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Select Transaction Mode (Cash, On Account, or Partial)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSaleMode('ON CASH')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    saleMode === 'ON CASH'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON CASH</span>
                    {saleMode === 'ON CASH' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Full payment received. Recorded to <strong>Subsidiary Sales & Cash Receipts</strong>.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleMode('ON ACCOUNT')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    saleMode === 'ON ACCOUNT'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON ACCOUNT</span>
                    {saleMode === 'ON ACCOUNT' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Credit / Receivable. Recorded to <strong>Subsidiary Sales ONLY</strong>.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleMode('ON PARTIAL')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    saleMode === 'ON PARTIAL'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON PARTIAL</span>
                    {saleMode === 'ON PARTIAL' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Down payment. Recorded to <strong>Subsidiary Sales & Collections</strong>.
                  </span>
                </button>
              </div>
            </div>

            {/* PARTIAL DOWN PAYMENT DETAILS IF SELECTED */}
            {saleMode === 'ON PARTIAL' && (
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col gap-3 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                      1st Payment / Down Payment (₱) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={downPaymentAmount}
                      onChange={(e) => setDownPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-cyan-500/40 bg-zinc-900 text-white font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      2nd Payment / Balance Due (₱)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`₱${Math.max(0, liveFormulas.total_amount_due - (parseFloat(downPaymentAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-500/40 bg-zinc-950 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                      1st Payment OR # / Ref
                    </label>
                    <input
                      type="text"
                      value={collectionRef}
                      onChange={(e) => setCollectionRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-cyan-500/40 bg-zinc-900 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-cyan-200 font-medium">
                    <input
                      type="checkbox"
                      checked={recordSecondPaymentNow}
                      onChange={(e) => setRecordSecondPaymentNow(e.target.checked)}
                      className="rounded border-cyan-500 bg-zinc-900 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>
                      2nd Payment (Balance of <strong>₱{Math.max(0, liveFormulas.total_amount_due - (parseFloat(downPaymentAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>) is also paid / collected
                    </span>
                  </label>

                  {recordSecondPaymentNow && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-cyan-300 font-bold whitespace-nowrap">2nd OR # / Ref:</span>
                      <input
                        type="text"
                        value={secondPaymentRef}
                        onChange={(e) => setSecondPaymentRef(e.target.value)}
                        className="w-36 px-2.5 py-1 text-xs rounded-lg border border-cyan-500/40 bg-zinc-900 text-white font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CUSTOMER & INVOICE DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Customer / Client Registered Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter customer trade name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                    required
                  />
                  {customers.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSelectCustomer(e.target.value);
                      }}
                      className={`px-2 text-xs rounded-xl border bg-transparent text-zinc-400 ${theme.borderInput}`}
                    >
                      <option value="">Quick Pick</option>
                      {customers.map((c, idx) => (
                        <option key={idx} value={c.registered_name || c.customer_name || c.trade_name} className="bg-zinc-900 text-white">
                          {c.registered_name || c.customer_name || c.trade_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Customer TIN (Masked 000-000-000-00000) *</label>
                <input
                  type="text"
                  placeholder="123-456-789-00000"
                  value={tin}
                  onChange={(e) => handleTinChange(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Tax Classification</label>
                <select
                  value={vatStatus}
                  onChange={(e) => setVatStatus(e.target.value as any)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="VAT" className="bg-zinc-900 text-white">VAT Registered (12%)</option>
                  <option value="NONVAT" className="bg-zinc-900 text-white">Non-VAT / Percentage Tax</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Invoice Document Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="SALES INVOICE" className="bg-zinc-900 text-white">SALES INVOICE</option>
                  <option value="OFFICIAL RECEIPT" className="bg-zinc-900 text-white">OFFICIAL RECEIPT</option>
                  <option value="BILLING STATEMENT" className="bg-zinc-900 text-white">BILLING STATEMENT</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Transaction Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1 text-cyan-400`}>Invoice Number (Unique #) *</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold text-cyan-400 ${theme.borderInput}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Voucher # / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. V-2026-001"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Registered Address</label>
              <input
                type="text"
                placeholder="e.g. Unit 502 Ayala Tower, Makati City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Particulars / Description of Sale *</label>
              <input
                type="text"
                placeholder="e.g. Professional Consulting & Web Development Services"
                value={particulars}
                onChange={(e) => setParticulars(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                required
              />
            </div>

            {/* FINANCIAL LINE AMOUNTS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Quantity</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Unit Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Discount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono text-rose-400 ${theme.borderInput}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs font-bold ${theme.textMuted}`}>CWT 2307 Withheld (₱)</label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {liveFormulas.vatable_sales > 0 && `(10% = ₱${(Math.round(liveFormulas.vatable_sales * 0.10 * 100) / 100).toFixed(2)})`}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={taxWithheld}
                  onChange={(e) => setTaxWithheld(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono text-amber-400 ${theme.borderInput}`}
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTaxWithheld('0')}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
                  >
                    0%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.01 * 100) / 100).toFixed(2))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono transition"
                  >
                    1% Goods
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.02 * 100) / 100).toFixed(2))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono transition"
                  >
                    2% Services
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.05 * 100) / 100).toFixed(2))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono transition"
                  >
                    5% Rent
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxWithheld((Math.round(liveFormulas.vatable_sales * 0.10 * 100) / 100).toFixed(2))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono font-bold border border-amber-500/40 transition"
                  >
                    10% (₱{(Math.round(liveFormulas.vatable_sales * 0.10 * 100) / 100).toFixed(2)})
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Zero-Rated Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={zeroRated}
                  onChange={(e) => setZeroRated(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>VAT-Exempt Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={vatExempt}
                  onChange={(e) => setVatExempt(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: LIVE COMPUTATION & SUBMISSION */}
          <div className="flex flex-col gap-5">
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-4`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2 border-b border-zinc-800 pb-3`}>
                <BadgePercent className="w-4 h-4 text-emerald-400" />
                <span>Live Tax & Financial Math</span>
              </h3>

              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Gross Amount:</span>
                  <span className="font-bold text-zinc-200">₱{liveFormulas.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Vatable Sales (Base):</span>
                  <span className="font-bold text-emerald-400">₱{liveFormulas.vatable_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Output VAT (12%):</span>
                  <span className="font-bold text-cyan-400">₱{liveFormulas.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {liveFormulas.less_discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/40 text-rose-400">
                    <span>Less Discount:</span>
                    <span>-₱{liveFormulas.less_discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {liveFormulas.less_withholding_tax > 0 && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/40 text-amber-400">
                    <span>Less Withheld (2307):</span>
                    <span>-₱{liveFormulas.less_withholding_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t-2 border-zinc-700 text-sm font-bold">
                  <span className="text-zinc-200">TOTAL AMOUNT DUE:</span>
                  <span className="text-amber-400 font-extrabold">₱{liveFormulas.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {saleMode === 'ON PARTIAL' && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-cyan-300">
                      <span>Initial Down Payment:</span>
                      <span className="font-bold">₱{(parseFloat(downPaymentAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold border-t border-cyan-800/50 pt-1">
                      <span>Remaining A/R Balance:</span>
                      <span>₱{Math.max(0, liveFormulas.total_amount_due - (parseFloat(downPaymentAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ROUTING SUMMARY BOX */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col gap-1.5 text-[11px]">
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Destination Books:</span>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Subsidiary Sales Register (Status: {saleMode === 'ON CASH' ? 'Paid' : saleMode === 'ON PARTIAL' ? (recordSecondPaymentNow ? 'Paid' : 'Partial') : 'On Account'})</span>
                </div>
                {saleMode === 'ON CASH' && (
                  <>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Cash Receipts Book (Fully Paid Entry)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Collections Book (Paid Settlement)</span>
                    </div>
                  </>
                )}
                {saleMode === 'ON PARTIAL' && (
                  <>
                    {recordSecondPaymentNow && (
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Cash Receipts Book (Completed Payment)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Collections Book ({recordSecondPaymentNow ? '1st & 2nd Payments Recorded' : '1st Down Payment Recorded'})</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempRecord: UniformBookRecord = {
                      id: 0,
                      company_name: activeCompanyName,
                      registered_name: customerName || 'Valued Client / Customer',
                      vat_or_nonvat: vatStatus,
                      tin: tin || '000-000-000-00000',
                      address: address || 'Metro Manila, Philippines',
                      type_of_transaction: saleMode === 'ON CASH' ? 'CASH' : 'ON ACCOUNT',
                      date: date,
                      invoice_type: invoiceType,
                      voucher_number: voucherNo,
                      invoice_number: invoiceNo,
                      particulars: particulars || 'Sales of goods/services',
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
                  className="w-1/2 py-3.5 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview ({vatStatus})</span>
                </button>

                <button
                  type="submit"
                  className="w-1/2 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-2"
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
                      c.invoice_number.trim().toLowerCase() === inv.invoice_number.trim().toLowerCase()
                    );
                    const collectedSoFar = matchingColls.reduce((sum, c) => sum + (Number(c.amount_collected || c.amount) || 0), 0);
                    const balance = Math.max(0, invDue - collectedSoFar);

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
                          ₱{collectedSoFar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-amber-400">
                          ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'Partial' 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.status || 'On Account'}
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
                                setCollectRefNo(`OR-${Date.now().toString().slice(-4)}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Collect Payment</span>
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
      {selectedInvoiceToCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`relative w-full max-w-lg ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col gap-4`}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Record Collection</h3>
                  <p className="text-[11px] text-zinc-400">Invoice #{selectedInvoiceToCollect.invoice_number}</p>
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
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Customer:</span>
                  <span className="font-bold text-zinc-200">{selectedInvoiceToCollect.registered_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Invoice Amount:</span>
                  <span className="font-mono font-bold text-zinc-200">₱{(Number(selectedInvoiceToCollect.total_amount_due) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Cash Collected (₱) *</label>
                  <input
                    type="number"
                    step="any"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono font-bold"
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
                  <span>Entry 2 / A/R Settlement Preview:</span>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Confirm Collection
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
