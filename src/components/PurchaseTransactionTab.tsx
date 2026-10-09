import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  PlusCircle, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Search, 
  Clock, 
  FileText,
  BadgePercent,
  Check,
  CreditCard,
  Layers,
  ArrowDownRight,
  Eye
} from 'lucide-react';
import InvoiceReceiptPreviewModal from './InvoiceReceiptPreviewModal';
import { UniformBookRecord, Contractor, Company } from '../types';
import { computeExpenseVAT } from '../utils/accounting';

interface PurchaseTransactionTabProps {
  subsidiaryPurchases: UniformBookRecord[];
  setSubsidiaryPurchases: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  cashDisbursements: UniformBookRecord[];
  setCashDisbursements: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  payments: UniformBookRecord[];
  setPayments: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  contractors: Contractor[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
  onNavigateToTab?: (tabKey: string) => void;
}

export default function PurchaseTransactionTab({
  subsidiaryPurchases,
  setSubsidiaryPurchases,
  cashDisbursements,
  setCashDisbursements,
  payments,
  setPayments,
  contractors,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch = '',
  onNavigateToTab
}: PurchaseTransactionTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  // Tab mode: 'new_purchase' or 'disburse_open'
  const [hubTab, setHubTab] = useState<'new_purchase' | 'disburse_open'>('new_purchase');

  // Form State
  const [providerName, setProviderName] = useState('');
  const [vatStatus, setVatStatus] = useState<'VAT' | 'NONVAT'>('VAT');
  const [tin, setTin] = useState('');
  const [address, setAddress] = useState('');
  const [invoiceType, setInvoiceType] = useState('OFFICIAL RECEIPT');
  const [voucherNo, setVoucherNo] = useState(`PV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-4)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [particulars, setParticulars] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('15000');
  const [zeroRated, setZeroRated] = useState('0');
  const [vatExempt, setVatExempt] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [taxWithheld, setTaxWithheld] = useState('0');

  // Transaction Mode: 'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'
  const [purchaseMode, setPurchaseMode] = useState<'ON CASH' | 'ON ACCOUNT' | 'ON PARTIAL'>('ON CASH');

  // Partial mode fields
  const [downPaymentAmount, setDownPaymentAmount] = useState('5000');
  const [downPaymentWithholding, setDownPaymentWithholding] = useState('0');
  const [disbursementRef, setDisbursementRef] = useState(`CD-${Date.now().toString().slice(-4)}`);

  // Quick payment modal for open payables
  const [selectedPayableToPay, setSelectedPayableToPay] = useState<UniformBookRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payWtax, setPayWtax] = useState('0');
  const [payRefNo, setPayRefNo] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Preview modal state
  const [previewRecord, setPreviewRecord] = useState<UniformBookRecord | null>(null);

  // Search filter for open payables
  const [openSearch, setOpenSearch] = useState('');

  // Auto-fill TIN & Provider details
  const handleSelectProvider = (provName: string) => {
    setProviderName(provName);
    const found = contractors.find(c => 
      (c.registered_name || c.service_provider_name || c.company_name || '').toLowerCase() === provName.toLowerCase()
    );
    if (found) {
      setTin(found.sp_tin || found.client_TIN || '');
      setAddress(found.address || found.sp_address || '');
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

    if (digits.length >= 9) {
      const found = contractors.find(c => (c.sp_tin || c.client_TIN || '').replace(/\D/g, '').startsWith(digits.slice(0, 9)));
      if (found) {
        if (!providerName) setProviderName(found.registered_name || found.service_provider_name || found.company_name || '');
        if (!address) setAddress(found.address || found.sp_address || '');
      }
    }
  };

  // Live Formula Calculations for Purchases/Expenses
  const liveFormulas = useMemo(() => {
    const rawQty = parseFloat(qty) || 1;
    const rawPrice = parseFloat(unitPrice) || 0;
    const grossAmt = rawQty * rawPrice;
    const disc = parseFloat(discount) || 0;
    const wtax = parseFloat(taxWithheld) || 0;
    const isVat = vatStatus === 'VAT';

    const vatResult = computeExpenseVAT(grossAmt, disc, isVat);

    return {
      amount: grossAmt,
      vatable_purchases: isVat ? vatResult.vatable_expense_amount : 0,
      input_vat: isVat ? vatResult.vat_input_amount : 0,
      nonvat_purchases: !isVat ? vatResult.nonvat_expense_amount : 0,
      net_of_discount: vatResult.net_of_discount,
      total_amount_due: Math.max(0, vatResult.net_of_discount - wtax),
      total_amount_vat_inclusive: grossAmt - disc,
      discount: disc,
      tax_withheld: wtax
    };
  }, [qty, unitPrice, discount, taxWithheld, vatStatus]);

  // Open / Unpaid / Partial Purchases for current company
  const openPayables = useMemo(() => {
    return subsidiaryPurchases.filter(p => {
      if (p.is_cancelled) return false;
      if (activeCompanyName && p.company_name && p.company_name !== activeCompanyName) return false;
      // Calculate how much has been paid across the payments book for this voucher/purchase
      const matchingPayments = payments.filter(pm => 
        !pm.is_cancelled && 
        ((pm.voucher_number && p.voucher_number && pm.voucher_number.trim().toLowerCase() === p.voucher_number.trim().toLowerCase()) ||
         (pm.invoice_number && p.invoice_number && pm.invoice_number.trim().toLowerCase() === p.invoice_number.trim().toLowerCase()))
      );
      const totalPaid = matchingPayments.reduce((sum, pm) => sum + (Number(pm.amount_paid || pm.amount) || 0), 0);
      const purchaseDue = Number(p.total_amount_due || p.amount) || 0;
      const isPaid = (p.status === 'Cash' || p.status === 'Paid') && totalPaid >= purchaseDue;
      return !isPaid && (p.status === 'On Account' || p.status === 'Partial' || totalPaid < purchaseDue);
    });
  }, [subsidiaryPurchases, payments, activeCompanyName]);

  const filteredOpenPayables = useMemo(() => {
    const q = (openSearch || globalSearch).toLowerCase().trim();
    if (!q) return openPayables;
    return openPayables.filter(p => 
      (p.voucher_number || '').toLowerCase().includes(q) ||
      (p.invoice_number || '').toLowerCase().includes(q) ||
      p.registered_name.toLowerCase().includes(q) ||
      p.tin.includes(q) ||
      (p.particulars || '').toLowerCase().includes(q)
    );
  }, [openPayables, openSearch, globalSearch]);

  // SUBMIT NEW PURCHASE TRANSACTION
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerName.trim()) {
      triggerAlert('Please enter or select a Service Provider / Vendor Name.', 'error');
      return;
    }
    if (!voucherNo.trim()) {
      triggerAlert('Voucher Number is required.', 'error');
      return;
    }

    const totalDue = liveFormulas.total_amount_due;
    const nowIso = new Date().toISOString();
    const commonId = Date.now();

    // 1. Prepare Base Record for Subsidiary Purchases
    let assignedStatus: 'Cash' | 'On Account' | 'Partial' = 'On Account';
    let assignedTransactionType: 'CASH' | 'ON ACCOUNT' = 'ON ACCOUNT';

    if (purchaseMode === 'ON CASH') {
      assignedStatus = 'Cash';
      assignedTransactionType = 'CASH';
    } else if (purchaseMode === 'ON PARTIAL') {
      assignedStatus = 'Partial';
      assignedTransactionType = 'ON ACCOUNT';
    }

    const purchaseRecord: UniformBookRecord = {
      id: commonId,
      company_name: activeCompanyName,
      registered_name: providerName.trim(),
      vat_or_nonvat: vatStatus,
      tin: tin.trim() || '000-000-000-00000',
      address: address.trim(),
      type_of_transaction: assignedTransactionType,
      date: date,
      invoice_type: invoiceType,
      voucher_number: voucherNo.trim(),
      invoice_number: invoiceNo.trim() || `EXP-${voucherNo.trim()}`,
      particulars: particulars.trim() || 'Purchases & Operating Expenses',
      qty: parseFloat(qty) || 1,
      unit_price: parseFloat(unitPrice) || 0,
      amount: liveFormulas.amount,
      vatable_amount: liveFormulas.vatable_purchases,
      vat_amount: liveFormulas.input_vat,
      zero_rated_amount: parseFloat(zeroRated) || 0,
      vat_exempt_amount: parseFloat(vatExempt) || 0,
      total_amount_vat_inclusive: liveFormulas.total_amount_vat_inclusive,
      total_amount_net_of_vat: liveFormulas.net_of_discount,
      discount: liveFormulas.discount,
      tax_withheld: liveFormulas.tax_withheld,
      total_amount_due: totalDue,
      status: assignedStatus,
      amount_paid: purchaseMode === 'ON PARTIAL' ? parseFloat(downPaymentAmount) || 0 : undefined,
      is_cancelled: false,
      created_at: nowIso
    };

    // 2. Routing Logic based on user specification:
    // 3.1 If ON ACCOUNT:
    //     Record the transaction to subsidiary purchases only.
    if (purchaseMode === 'ON ACCOUNT') {
      setSubsidiaryPurchases(prev => [purchaseRecord, ...prev]);
      triggerAlert(`Purchase ${voucherNo} recorded to Subsidiary Purchases on Account (Payable: ₱${totalDue.toLocaleString()}).`, 'success');
    }

    // 3.2 If ON CASH:
    //     Record transaction to BOTH subsidiary purchases AND cash disbursements (and payments).
    else if (purchaseMode === 'ON CASH') {
      // Record to Subsidiary Purchases
      setSubsidiaryPurchases(prev => [purchaseRecord, ...prev]);

      // Record to Cash Disbursements (Strictly cash-only book)
      const cashDisbursementRecord: UniformBookRecord = {
        id: commonId + 1,
        company_name: activeCompanyName,
        registered_name: providerName.trim(),
        vat_or_nonvat: vatStatus,
        tin: tin.trim() || '000-000-000-00000',
        address: address.trim(),
        type_of_transaction: 'CASH',
        date: date,
        invoice_type: 'OFFICIAL RECEIPT',
        voucher_number: voucherNo.trim(),
        invoice_number: invoiceNo.trim() || `EXP-${voucherNo.trim()}`,
        particulars: `Cash Disbursement for Voucher #${voucherNo.trim()} - ${particulars || 'Purchases'}`,
        qty: parseFloat(qty) || 1,
        unit_price: parseFloat(unitPrice) || 0,
        amount: liveFormulas.amount,
        vatable_amount: liveFormulas.vatable_purchases,
        vat_amount: liveFormulas.input_vat,
        zero_rated_amount: parseFloat(zeroRated) || 0,
        vat_exempt_amount: parseFloat(vatExempt) || 0,
        total_amount_vat_inclusive: liveFormulas.total_amount_vat_inclusive,
        total_amount_net_of_vat: liveFormulas.net_of_discount,
        discount: liveFormulas.discount,
        tax_withheld: liveFormulas.tax_withheld,
        total_amount_due: totalDue,
        amount_paid: totalDue,
        withholding_tax_2307: liveFormulas.tax_withheld,
        status: 'Cash',
        is_cancelled: false,
        created_at: nowIso
      };
      setCashDisbursements(prev => [cashDisbursementRecord, ...prev]);

      // Record to Payments book
      const paymentRecord: UniformBookRecord = {
        ...cashDisbursementRecord,
        id: commonId + 2,
        status: 'Paid'
      };
      setPayments(prev => [paymentRecord, ...prev]);

      triggerAlert(`Cash Purchase ${voucherNo} recorded to BOTH Subsidiary Purchases & Cash Disbursements (₱${totalDue.toLocaleString()})!`, 'success');
    }

    // 3.3 If ON PARTIAL:
    //     Record transaction to both subsidiary purchases and payments.
    //     If payments for a purchase reach full payment, that's when it will record to cash disbursements.
    else if (purchaseMode === 'ON PARTIAL') {
      const downPmt = parseFloat(downPaymentAmount) || 0;
      const downWtax = parseFloat(downPaymentWithholding) || 0;

      if (downPmt <= 0) {
        triggerAlert('Please enter a valid Partial Payment amount.', 'error');
        return;
      }

      const isFull = downPmt >= totalDue;

      if (isFull) {
        purchaseRecord.status = 'Paid';
      }

      setSubsidiaryPurchases(prev => [purchaseRecord, ...prev]);

      // Record partial payment in Payments
      const partialPaymentRecord: UniformBookRecord = {
        id: commonId + 1,
        company_name: activeCompanyName,
        registered_name: providerName.trim(),
        vat_or_nonvat: vatStatus,
        tin: tin.trim() || '000-000-000-00000',
        address: address.trim(),
        type_of_transaction: 'ON ACCOUNT',
        date: date,
        invoice_type: 'OFFICIAL RECEIPT',
        voucher_number: voucherNo.trim(),
        invoice_number: invoiceNo.trim() || `EXP-${voucherNo.trim()}`,
        particulars: `Partial Disbursement for Voucher #${voucherNo.trim()} (${isFull ? '100% Full' : 'Partial'})`,
        qty: 1,
        unit_price: downPmt,
        amount: downPmt,
        vatable_amount: Math.round((downPmt / 1.12) * 100) / 100,
        vat_amount: Math.round((downPmt - downPmt / 1.12) * 100) / 100,
        zero_rated_amount: 0,
        vat_exempt_amount: 0,
        total_amount_vat_inclusive: downPmt,
        total_amount_net_of_vat: Math.round((downPmt / 1.12) * 100) / 100,
        discount: 0,
        tax_withheld: downWtax,
        total_amount_due: totalDue,
        amount_paid: downPmt,
        withholding_tax_2307: downWtax,
        status: isFull ? 'Paid' : 'Partial',
        is_cancelled: false,
        created_at: nowIso
      };

      setPayments(prev => [partialPaymentRecord, ...prev]);

      if (isFull) {
        // Automatically records to Cash Disbursements as full payment
        setCashDisbursements(prev => [{ ...partialPaymentRecord, id: commonId + 2, type_of_transaction: 'CASH', status: 'Cash' }, ...prev]);
        triggerAlert(`Purchase ${voucherNo} was fully covered! Recorded to Subsidiary Purchases, Payments, and Cash Disbursements.`, 'success');
      } else {
        triggerAlert(`Partial Purchase ${voucherNo} recorded to Subsidiary Purchases & Payments. Disbursed: ₱${downPmt.toLocaleString()} (Remaining payable: ₱${(totalDue - downPmt).toLocaleString()}).`, 'info');
      }
    }

    // Reset Form for next entry
    setVoucherNo(`PV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    setInvoiceNo(`INV-${Date.now().toString().slice(-4)}`);
    setParticulars('');
    setUnitPrice('15000');
    setDownPaymentAmount('5000');
  };

  // EXECUTE PAYMENT ON AN OPEN PAYABLE
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayableToPay) return;

    const paymentAmt = parseFloat(payAmount) || 0;
    const wtaxAmt = parseFloat(payWtax) || 0;

    if (paymentAmt <= 0) {
      triggerAlert('Please enter a valid disbursement amount.', 'error');
      return;
    }

    const payRec = selectedPayableToPay;
    const payTotalDue = Number(payRec.total_amount_due || payRec.amount) || 0;

    // Calculate previous disbursements
    const existingMatching = payments.filter(pm => 
      !pm.is_cancelled && 
      ((pm.voucher_number && payRec.voucher_number && pm.voucher_number.trim().toLowerCase() === payRec.voucher_number.trim().toLowerCase()) ||
       (pm.invoice_number && payRec.invoice_number && pm.invoice_number.trim().toLowerCase() === payRec.invoice_number.trim().toLowerCase()))
    );
    const prevPaid = existingMatching.reduce((sum, pm) => sum + (Number(pm.amount_paid || pm.amount) || 0), 0);
    const newTotalPaid = prevPaid + paymentAmt;
    const isNowFullyPaid = newTotalPaid >= payTotalDue;

    const commonId = Date.now();
    const nowIso = new Date().toISOString();

    // 1. Add record to Payments
    const newPaymentRec: UniformBookRecord = {
      id: commonId,
      company_name: activeCompanyName,
      registered_name: payRec.registered_name,
      vat_or_nonvat: payRec.vat_or_nonvat,
      tin: payRec.tin,
      address: payRec.address,
      type_of_transaction: 'ON ACCOUNT',
      date: payDate,
      invoice_type: 'OFFICIAL RECEIPT',
      voucher_number: payRec.voucher_number,
      invoice_number: payRec.invoice_number,
      particulars: `Payment for Voucher #${payRec.voucher_number} (${isNowFullyPaid ? 'Final Full Payment' : 'Installment'})`,
      qty: 1,
      unit_price: paymentAmt,
      amount: paymentAmt,
      vatable_amount: Math.round((paymentAmt / 1.12) * 100) / 100,
      vat_amount: Math.round((paymentAmt - paymentAmt / 1.12) * 100) / 100,
      zero_rated_amount: 0,
      vat_exempt_amount: 0,
      total_amount_vat_inclusive: paymentAmt,
      total_amount_net_of_vat: Math.round((paymentAmt / 1.12) * 100) / 100,
      discount: 0,
      tax_withheld: wtaxAmt,
      total_amount_due: payTotalDue,
      amount_paid: paymentAmt,
      withholding_tax_2307: wtaxAmt,
      status: isNowFullyPaid ? 'Paid' : 'Partial',
      is_cancelled: false,
      created_at: nowIso
    };

    setPayments(prev => [newPaymentRec, ...prev]);

    // 2. Update status in Subsidiary Purchases
    setSubsidiaryPurchases(prev => prev.map(p => {
      if (p.voucher_number === payRec.voucher_number) {
        return {
          ...p,
          status: isNowFullyPaid ? 'Paid' : 'Partial'
        };
      }
      return p;
    }));

    // 3. If payments for this purchase reach FULL payment:
    // That's when it will record to CASH DISBURSEMENTS!
    if (isNowFullyPaid) {
      const fullCashDisbursement: UniformBookRecord = {
        ...newPaymentRec,
        id: commonId + 1,
        type_of_transaction: 'CASH',
        status: 'Cash',
        particulars: `Full Cash Settlement Cleared: Voucher #${payRec.voucher_number} (${payRec.registered_name})`
      };
      setCashDisbursements(prev => [fullCashDisbursement, ...prev]);

      triggerAlert(
        `Voucher #${payRec.voucher_number} is now FULLY PAID (₱${newTotalPaid.toLocaleString()}) and has been automatically recorded to Cash Disbursements!`,
        'success'
      );
    } else {
      triggerAlert(
        `Recorded partial disbursement of ₱${paymentAmt.toLocaleString()} for Voucher #${payRec.voucher_number}. Remaining payable: ₱${(payTotalDue - newTotalPaid).toLocaleString()}.`,
        'info'
      );
    }

    setSelectedPayableToPay(null);
    setPayAmount('');
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* HEADER BANNER */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-xs`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold tracking-tight ${theme.textTitle}`}>
                  Purchase & Expense Transaction Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Primary Encoding Tool
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${theme.textMuted}`}>
                Record new vendor purchases & expenses. Routes automatically to <strong>Subsidiary Purchases</strong>, <strong>Cash Disbursements</strong> (Cash only), and <strong>Payments</strong>.
              </p>
            </div>
          </div>

          {/* QUICK LINKS TO BOOKS */}
          <div className="flex items-center gap-2 text-xs">
            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('expenses')}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>View Subsidiary Purchases</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('payments')}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                  <span>View Cash Disbursements</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* SUB-TABS: Record Purchase vs Disburse Payment */}
        <div className="flex gap-2 mt-5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setHubTab('new_purchase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'new_purchase'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>1. Record New Purchase / Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setHubTab('disburse_open')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              hubTab === 'disburse_open'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Disburse Payment for Existing Payables</span>
            {openPayables.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {openPayables.length} open
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RECORD NEW PURCHASE TRANSACTION FORM                                   */}
      {/* ========================================================================= */}
      {hubTab === 'new_purchase' && (
        <form onSubmit={handleSubmitPurchase} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: FORM INPUTS */}
          <div className={`lg:col-span-2 ${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-5`}>
            {/* STEP 1: TRANSACTION MODE SELECTOR */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme.textTitle} flex items-center gap-2`}>
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Select Purchase Mode (Cash, On Account, or Partial)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPurchaseMode('ON CASH')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    purchaseMode === 'ON CASH'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON CASH</span>
                    {purchaseMode === 'ON CASH' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Paid immediately. Recorded to <strong>Subsidiary Purchases & Cash Disbursements</strong>.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMode('ON ACCOUNT')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    purchaseMode === 'ON ACCOUNT'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON ACCOUNT</span>
                    {purchaseMode === 'ON ACCOUNT' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Payable / Utang. Recorded to <strong>Subsidiary Purchases ONLY</strong>.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMode('ON PARTIAL')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    purchaseMode === 'ON PARTIAL'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-xs'
                      : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">ON PARTIAL</span>
                    {purchaseMode === 'ON PARTIAL' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    Partial payment. Recorded to <strong>Subsidiary Purchases & Payments</strong>.
                  </span>
                </button>
              </div>
            </div>

            {/* PARTIAL DOWN PAYMENT DETAILS IF SELECTED */}
            {purchaseMode === 'ON PARTIAL' && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    Partial Payment Amount (₱) *
                  </label>
                  <input
                    type="number"
                    value={downPaymentAmount}
                    onChange={(e) => setDownPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-purple-500/40 bg-zinc-900 text-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    CWT 2307 Deducted (₱)
                  </label>
                  <input
                    type="number"
                    value={downPaymentWithholding}
                    onChange={(e) => setDownPaymentWithholding(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-purple-500/40 bg-zinc-900 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    Payment Voucher / Ref #
                  </label>
                  <input
                    type="text"
                    value={disbursementRef}
                    onChange={(e) => setDisbursementRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-purple-500/40 bg-zinc-900 text-white font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* PROVIDER & VOUCHER DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Vendor / Service Provider Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter vendor trade name..."
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                    required
                  />
                  {contractors.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSelectProvider(e.target.value);
                      }}
                      className={`px-2 text-xs rounded-xl border bg-transparent text-zinc-400 ${theme.borderInput}`}
                    >
                      <option value="">Quick Pick</option>
                      {contractors.map((c, idx) => (
                        <option key={idx} value={c.registered_name || c.service_provider_name || c.company_name} className="bg-zinc-900 text-white">
                          {c.registered_name || c.service_provider_name || c.company_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Provider TIN (Masked 000-000-000-00000) *</label>
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
                  <option value="VAT" className="bg-zinc-900 text-white">VAT Supplier (12% Input VAT)</option>
                  <option value="NONVAT" className="bg-zinc-900 text-white">Non-VAT Supplier</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Document Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="OFFICIAL RECEIPT" className="bg-zinc-900 text-white">OFFICIAL RECEIPT</option>
                  <option value="SALES INVOICE" className="bg-zinc-900 text-white">SALES INVOICE</option>
                  <option value="BILLING STATEMENT" className="bg-zinc-900 text-white">BILLING STATEMENT</option>
                  <option value="DISBURSEMENT VOUCHER" className="bg-zinc-900 text-white">DISBURSEMENT VOUCHER</option>
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
                <label className={`block text-xs font-bold mb-1 text-purple-400`}>Voucher Number (PV / DV #) *</label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono font-bold text-purple-400 ${theme.borderInput}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Vendor Invoice / OR Number</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Provider Registered Address</label>
              <input
                type="text"
                placeholder="e.g. Unit 302 Cyberpark, Cubao, Quezon City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>Particulars / Expense Description *</label>
              <input
                type="text"
                placeholder="e.g. Office Supplies, High-Speed Internet, Rent, Subcontractor Fees"
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
                <label className={`block text-xs font-bold mb-1 ${theme.textMuted}`}>CWT 2307 Withheld (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={taxWithheld}
                  onChange={(e) => setTaxWithheld(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent font-mono text-amber-400 ${theme.borderInput}`}
                />
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
                <BadgePercent className="w-4 h-4 text-purple-400" />
                <span>Live Tax & Financial Math</span>
              </h3>

              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Gross Amount:</span>
                  <span className="font-bold text-zinc-200">₱{liveFormulas.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Vatable Purchases (Base):</span>
                  <span className="font-bold text-emerald-400">₱{liveFormulas.vatable_purchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className={theme.textMuted}>Input VAT (12% Claim):</span>
                  <span className="font-bold text-cyan-400">₱{liveFormulas.input_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {liveFormulas.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/40 text-rose-400">
                    <span>Less Discount:</span>
                    <span>-₱{liveFormulas.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {liveFormulas.tax_withheld > 0 && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/40 text-amber-400">
                    <span>Less EWT Deducted (2307):</span>
                    <span>-₱{liveFormulas.tax_withheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t-2 border-zinc-700 text-sm font-bold">
                  <span className="text-zinc-200">TOTAL AMOUNT PAYABLE:</span>
                  <span className="text-rose-400 font-extrabold">₱{liveFormulas.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {purchaseMode === 'ON PARTIAL' && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-purple-300">
                      <span>Partial Amount Disbursed:</span>
                      <span className="font-bold">₱{(parseFloat(downPaymentAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold border-t border-purple-800/50 pt-1">
                      <span>Remaining A/P Payable:</span>
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
                  <span>Subsidiary Purchases Register (Status: {purchaseMode === 'ON CASH' ? 'Cash' : purchaseMode === 'ON PARTIAL' ? 'Partial' : 'On Account'})</span>
                </div>
                {purchaseMode === 'ON CASH' && (
                  <>
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Cash Disbursements Book (Cash-Only Entry)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Payments Book (Disbursement Cleared)</span>
                    </div>
                  </>
                )}
                {purchaseMode === 'ON PARTIAL' && (
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Payments Book (Partial Disbursement Logged)</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempRecord: UniformBookRecord = {
                      id: 0,
                      company_name: activeCompanyName,
                      registered_name: providerName || 'Valued Supplier / Contractor',
                      vat_or_nonvat: vatStatus,
                      tin: tin || '000-000-000-00000',
                      address: address || 'Metro Manila, Philippines',
                      type_of_transaction: purchaseMode === 'ON CASH' ? 'CASH' : 'ON ACCOUNT',
                      date: date,
                      invoice_type: invoiceType,
                      voucher_number: voucherNo,
                      invoice_number: invoiceNo,
                      particulars: particulars || 'Purchased goods/services',
                      qty: parseFloat(qty) || 1,
                      unit_price: parseFloat(unitPrice) || 0,
                      amount: liveFormulas.expense_amount,
                      vatable_amount: liveFormulas.vatable_expense,
                      vat_amount: liveFormulas.input_vat,
                      zero_rated_amount: parseFloat(zeroRated) || 0,
                      vat_exempt_amount: parseFloat(vatExempt) || 0,
                      total_amount_vat_inclusive: liveFormulas.expense_amount,
                      total_amount_net_of_vat: liveFormulas.amount_net_of_vat,
                      discount: liveFormulas.discounts,
                      tax_withheld: liveFormulas.ewt_amount,
                      total_amount_due: liveFormulas.total_amount_due,
                      status: purchaseMode === 'ON CASH' ? 'Cash' : (purchaseMode === 'ON PARTIAL' ? 'Partial' : 'On Account')
                    };
                    setPreviewRecord(tempRecord);
                  }}
                  className="w-1/2 py-3.5 rounded-xl border border-purple-500/40 hover:bg-purple-500/10 text-purple-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview ({vatStatus})</span>
                </button>

                <button
                  type="submit"
                  className="w-1/2 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/20 transition cursor-pointer flex items-center justify-center gap-2"
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
      {/* 2. DISBURSE PAYMENT FOR EXISTING UNPAID / PARTIAL PAYABLES                */}
      {/* ========================================================================= */}
      {hubTab === 'disburse_open' && (
        <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-xs flex flex-col gap-5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className={`text-base font-bold ${theme.textTitle} flex items-center gap-2`}>
                <DollarSign className="w-5 h-5 text-rose-400" />
                <span>Open & Partially Paid Payables (Accounts Payable)</span>
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Select an open payable voucher to record payment. When cumulative payments reach 100%, the voucher is <strong>automatically recorded into Cash Disbursements</strong>!
              </p>
            </div>

            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search voucher #, vendor name..."
                value={openSearch}
                onChange={(e) => setOpenSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>

          {filteredOpenPayables.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
              <p className="font-bold text-sm text-zinc-300">No Outstanding Payables Found</p>
              <p className="text-xs mt-1">All purchases and expense vouchers for {activeCompanyName || 'this company'} are fully paid or on cash basis!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Provider / Vendor</th>
                    <th className="p-3 text-right">Payable Total</th>
                    <th className="p-3 text-right">Paid to Date</th>
                    <th className="p-3 text-right text-rose-400">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredOpenPayables.map((p) => {
                    const pDue = Number(p.total_amount_due || p.amount) || 0;
                    const matchingPmts = payments.filter(pm => 
                      !pm.is_cancelled && 
                      ((pm.voucher_number && p.voucher_number && pm.voucher_number.trim().toLowerCase() === p.voucher_number.trim().toLowerCase()) ||
                       (pm.invoice_number && p.invoice_number && pm.invoice_number.trim().toLowerCase() === p.invoice_number.trim().toLowerCase()))
                    );
                    const paidSoFar = matchingPmts.reduce((sum, pm) => sum + (Number(pm.amount_paid || pm.amount) || 0), 0);
                    const balance = Math.max(0, pDue - paidSoFar);

                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3 font-mono font-bold text-purple-400">{p.voucher_number}</td>
                        <td className="p-3 font-mono text-zinc-400">{p.date}</td>
                        <td className="p-3 font-medium text-zinc-200">
                          <div>{p.registered_name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{p.tin}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-200">
                          ₱{pDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          ₱{paidSoFar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-rose-400">
                          ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Partial' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status || 'On Account'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(p)}
                              title="Preview Official BIR Voucher / Invoice (VAT or Non-VAT)"
                              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayableToPay(p);
                                setPayAmount(String(balance));
                                setPayRefNo(`PV-${Date.now().toString().slice(-4)}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Disburse Payment</span>
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

      {/* QUICK DISBURSEMENT MODAL */}
      {selectedPayableToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`relative w-full max-w-lg ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col gap-4`}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Record Cash Disbursement</h3>
                  <p className="text-[11px] text-zinc-400">Voucher #{selectedPayableToPay.voucher_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayableToPay(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Provider / Payee:</span>
                  <span className="font-bold text-zinc-200">{selectedPayableToPay.registered_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Voucher Payable:</span>
                  <span className="font-mono font-bold text-zinc-200">₱{(Number(selectedPayableToPay.total_amount_due) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Disbursement / Payment Amount (₱) *</label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Withholding Tax 2307 (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={payWtax}
                    onChange={(e) => setPayWtax(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Check # / Disbursement Voucher Ref</label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-transparent text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayableToPay(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Confirm Disbursement
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
