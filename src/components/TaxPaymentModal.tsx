import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Check, 
  Scale, 
  DollarSign, 
  Calendar, 
  Building2, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Company, SpecialEntry, SpecialEntryLine, AccountTitle, Sale, Expense } from '../types';
import { getAvailableTaxYears } from '../utils/taxProfiles';

export type TaxFormType = 
  | '2550Q' 
  | '2551Q' 
  | '1701Q' 
  | '1702Q' 
  | '1701_ANNUAL' 
  | '1702_ANNUAL' 
  | '1601EQ' 
  | '0619E' 
  | '1601C';

interface TaxPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company | null;
  sales: Sale[];
  expenses: Expense[];
  accountTitles?: AccountTitle[];
  onPostJournalEntry: (entry: SpecialEntry) => void;
  triggerAlert?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialFormType?: TaxFormType;
  initialYear?: number;
  initialQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';
  theme?: any;
}

export default function TaxPaymentModal({
  isOpen,
  onClose,
  activeCompany,
  sales,
  expenses,
  accountTitles = [],
  onPostJournalEntry,
  triggerAlert,
  initialFormType = '2550Q',
  initialYear,
  initialQuarter = 'Q1',
  theme
}: TaxPaymentModalProps) {
  // Available tax years strictly restricted to present year + years with transactions
  const availableYears = useMemo(() => {
    return getAvailableTaxYears(activeCompany, [...sales, ...expenses]);
  }, [activeCompany, sales, expenses]);

  const defaultYear = initialYear || (availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());

  const [formType, setFormType] = useState<TaxFormType>(initialFormType);
  const [taxYear, setTaxYear] = useState<number>(defaultYear);
  const [period, setPeriod] = useState<string>(initialQuarter);

  // Sync if props change
  useEffect(() => {
    if (initialFormType) setFormType(initialFormType);
    if (initialYear) setTaxYear(initialYear);
    if (initialQuarter) setPeriod(initialQuarter);
  }, [initialFormType, initialYear, initialQuarter, isOpen]);

  // Payment Details
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [bankChannel, setBankChannel] = useState<string>('LandBank of the Philippines (AAB)');
  const [bankAccountCode, setBankAccountCode] = useState<string>('1010');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>(`eFPS-${Date.now().toString().slice(-6)}`);
  
  // Declared vs Auto-computed financial figures
  const yearSales = useMemo(() => {
    const yrStr = String(taxYear);
    return sales.filter(s => {
      if (activeCompany?.company_name && s.company_name && s.company_name !== activeCompany.company_name) return false;
      const d = s.invoice_date || s.issue_date || (s as any).date || '';
      return d.startsWith(yrStr);
    });
  }, [sales, activeCompany, taxYear]);

  const yearExpenses = useMemo(() => {
    const yrStr = String(taxYear);
    return expenses.filter(e => {
      if (activeCompany?.company_name && e.company_name && e.company_name !== activeCompany.company_name) return false;
      const d = e.expense_date || (e as any).date || '';
      return d.startsWith(yrStr);
    });
  }, [expenses, activeCompany, taxYear]);

  // Baseline auto-computations
  const autoComputed = useMemo(() => {
    const totalSalesVatInc = yearSales.reduce((acc, s) => acc + (Number(s.total_sale_vat_inclusive ?? (s as any).total_amount_vat_inclusive ?? s.amount) || 0), 0);
    const vatableSales = Math.round((totalSalesVatInc / 1.12) * 100) / 100;
    const outputVat = Math.round((vatableSales * 0.12) * 100) / 100;

    const totalPurchasesVatInc = yearExpenses.reduce((acc, e) => acc + (Number((e as any).vatable_amount ?? (e as any).vatable_expense ?? e.expense_invoice_amount ?? e.amount) || 0), 0);
    const inputVat = Math.round(((totalPurchasesVatInc / 1.12) * 0.12) * 100) / 100;
    
    const creditable2307 = yearSales.reduce((acc, s) => acc + (Number(s.withholding_2307 ?? (s as any).tax_withheld ?? (s as any).amount_withheld_2307) || 0), 0);

    const netVatPayable = Math.max(0, Math.round((outputVat - inputVat) * 100) / 100);
    const percentageTaxPayable = Math.round((vatableSales * 0.03) * 100) / 100;
    const incomeTaxQuarterEstimate = Math.max(0, Math.round(((vatableSales - totalPurchasesVatInc) * 0.20) * 100) / 100);

    return {
      grossSales: totalSalesVatInc,
      vatableSales,
      outputVat,
      inputVat,
      creditable2307,
      netVatPayable,
      percentageTaxPayable,
      incomeTaxQuarterEstimate
    };
  }, [yearSales, yearExpenses]);

  // Declared figures (User editable)
  const [declaredSales, setDeclaredSales] = useState<number>(0);
  const [declaredOutputTax, setDeclaredOutputTax] = useState<number>(0);
  const [declaredInputCredits, setDeclaredInputCredits] = useState<number>(0);
  const [declaredCwtCredits, setDeclaredCwtCredits] = useState<number>(0);
  const [penaltiesSurcharges, setPenaltiesSurcharges] = useState<number>(0);
  const [actualTaxPaid, setActualTaxPaid] = useState<number>(0);

  // Initialize declared figures when form or auto-compute changes
  useEffect(() => {
    if (formType === '2550Q') {
      setDeclaredSales(autoComputed.vatableSales);
      setDeclaredOutputTax(autoComputed.outputVat);
      setDeclaredInputCredits(autoComputed.inputVat);
      setDeclaredCwtCredits(0);
      setPenaltiesSurcharges(0);
      setActualTaxPaid(autoComputed.netVatPayable);
    } else if (formType === '2551Q') {
      setDeclaredSales(autoComputed.vatableSales);
      setDeclaredOutputTax(autoComputed.percentageTaxPayable);
      setDeclaredInputCredits(0);
      setDeclaredCwtCredits(0);
      setPenaltiesSurcharges(0);
      setActualTaxPaid(autoComputed.percentageTaxPayable);
    } else if (formType === '1701Q' || formType === '1702Q') {
      setDeclaredSales(autoComputed.grossSales);
      setDeclaredOutputTax(autoComputed.incomeTaxQuarterEstimate);
      setDeclaredInputCredits(0);
      setDeclaredCwtCredits(autoComputed.creditable2307);
      setPenaltiesSurcharges(0);
      setActualTaxPaid(Math.max(0, autoComputed.incomeTaxQuarterEstimate - autoComputed.creditable2307));
    } else {
      setDeclaredSales(autoComputed.grossSales);
      setDeclaredOutputTax(autoComputed.netVatPayable || 5000);
      setDeclaredInputCredits(0);
      setDeclaredCwtCredits(0);
      setPenaltiesSurcharges(0);
      setActualTaxPaid(autoComputed.netVatPayable || 5000);
    }
  }, [formType, autoComputed]);

  // Derived Double-Entry lines
  const journalLines = useMemo((): SpecialEntryLine[] => {
    const lines: SpecialEntryLine[] = [];

    if (formType === '2550Q') {
      // VAT Return Payment
      // Debit Output VAT (to close liability)
      if (declaredOutputTax > 0) {
        lines.push({
          type: 'Debit',
          account_code: '2020',
          account_title: 'Output VAT Payable',
          amount: Math.round(declaredOutputTax * 100) / 100
        });
      }
      // Debit Penalties if late
      if (penaltiesSurcharges > 0) {
        lines.push({
          type: 'Debit',
          account_code: '6090',
          account_title: 'Penalties, Surcharges & Fines (Non-Deductible)',
          amount: Math.round(penaltiesSurcharges * 100) / 100
        });
      }
      // Credit Input VAT (closed against output)
      if (declaredInputCredits > 0) {
        lines.push({
          type: 'Credit',
          account_code: '1030',
          account_title: 'Input VAT',
          amount: Math.round(declaredInputCredits * 100) / 100
        });
      }
      // Credit CWT 2307 (VAT withheld if applicable)
      if (declaredCwtCredits > 0) {
        lines.push({
          type: 'Credit',
          account_code: '1040',
          account_title: 'Creditable Withholding Tax (BIR 2307)',
          amount: Math.round(declaredCwtCredits * 100) / 100
        });
      }
      // Credit Cash in Bank (actual cash paid)
      if (actualTaxPaid > 0) {
        lines.push({
          type: 'Credit',
          account_code: bankAccountCode,
          account_title: 'Cash and Cash Equivalents',
          amount: Math.round(actualTaxPaid * 100) / 100
        });
      }
    } else if (formType === '2551Q') {
      // Percentage Tax Payment
      // Debit Percentage Tax Payable
      if (declaredOutputTax > 0) {
        lines.push({
          type: 'Debit',
          account_code: '2020',
          account_title: 'Percentage Tax Payable (Sec 116)',
          amount: Math.round(declaredOutputTax * 100) / 100
        });
      }
      if (penaltiesSurcharges > 0) {
        lines.push({
          type: 'Debit',
          account_code: '6090',
          account_title: 'Penalties, Surcharges & Fines',
          amount: Math.round(penaltiesSurcharges * 100) / 100
        });
      }
      if (actualTaxPaid > 0) {
        lines.push({
          type: 'Credit',
          account_code: bankAccountCode,
          account_title: 'Cash and Cash Equivalents',
          amount: Math.round(actualTaxPaid * 100) / 100
        });
      }
    } else if (formType === '1701Q' || formType === '1702Q' || formType === '1701_ANNUAL' || formType === '1702_ANNUAL') {
      // Income Tax Payment
      // Debit Income Tax Provision / Payable
      const taxDue = declaredOutputTax;
      if (taxDue > 0) {
        lines.push({
          type: 'Debit',
          account_code: '2040',
          account_title: 'Income Tax Payable (BIR 1702/1701)',
          amount: Math.round(taxDue * 100) / 100
        });
      }
      if (penaltiesSurcharges > 0) {
        lines.push({
          type: 'Debit',
          account_code: '6090',
          account_title: 'Penalties, Surcharges & Fines',
          amount: Math.round(penaltiesSurcharges * 100) / 100
        });
      }
      // Credit 2307 Tax Credits
      if (declaredCwtCredits > 0) {
        lines.push({
          type: 'Credit',
          account_code: '1040',
          account_title: 'Creditable Withholding Tax (BIR 2307)',
          amount: Math.round(declaredCwtCredits * 100) / 100
        });
      }
      // Credit Cash in Bank
      if (actualTaxPaid > 0) {
        lines.push({
          type: 'Credit',
          account_code: bankAccountCode,
          account_title: 'Cash and Cash Equivalents',
          amount: Math.round(actualTaxPaid * 100) / 100
        });
      }
    } else {
      // Withholding Tax Remittance (1601EQ, 0619E, 1601C)
      const wtaxCode = formType === '1601C' ? '2035' : '2030';
      const wtaxTitle = formType === '1601C' ? 'Withholding Tax Payable - Compensation (BIR 1601-C)' : 'Expanded Withholding Tax Payable (BIR 0619-E)';

      if (declaredOutputTax > 0) {
        lines.push({
          type: 'Debit',
          account_code: wtaxCode,
          account_title: wtaxTitle,
          amount: Math.round(declaredOutputTax * 100) / 100
        });
      }
      if (penaltiesSurcharges > 0) {
        lines.push({
          type: 'Debit',
          account_code: '6090',
          account_title: 'Penalties, Surcharges & Fines',
          amount: Math.round(penaltiesSurcharges * 100) / 100
        });
      }
      if (actualTaxPaid > 0) {
        lines.push({
          type: 'Credit',
          account_code: bankAccountCode,
          account_title: 'Cash and Cash Equivalents',
          amount: Math.round(actualTaxPaid * 100) / 100
        });
      }
    }

    return lines;
  }, [formType, declaredOutputTax, declaredInputCredits, declaredCwtCredits, penaltiesSurcharges, actualTaxPaid, bankAccountCode]);

  const totalDebits = useMemo(() => {
    return journalLines.filter(l => l.type === 'Debit').reduce((s, l) => s + l.amount, 0);
  }, [journalLines]);

  const totalCredits = useMemo(() => {
    return journalLines.filter(l => l.type === 'Credit').reduce((s, l) => s + l.amount, 0);
  }, [journalLines]);

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.05;

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      if (triggerAlert) {
        triggerAlert(`Journal entry is not balanced! Debits (₱${totalDebits.toFixed(2)}) must equal Credits (₱${totalCredits.toFixed(2)}).`, 'error');
      }
      return;
    }

    const formLabel = 
      formType === '2550Q' ? 'BIR Form 2550Q (Quarterly VAT)' :
      formType === '2551Q' ? 'BIR Form 2551Q (Percentage Tax)' :
      formType === '1701Q' ? 'BIR Form 1701Q (Individual Qtr Income Tax)' :
      formType === '1702Q' ? 'BIR Form 1702Q (Corp Qtr Income Tax)' :
      formType === '1701_ANNUAL' ? 'BIR Form 1701 (Annual Income Tax)' :
      formType === '1702_ANNUAL' ? 'BIR Form 1702-RT (Annual Income Tax)' :
      formType === '1601EQ' ? 'BIR Form 1601-EQ (Expanded WTax)' :
      formType === '0619E' ? 'BIR Form 0619-E (Monthly Remittance)' :
      'BIR Form 1601-C (Compensation WTax)';

    const description = `Settlement of ${formLabel} for ${period} ${taxYear}. Declared Sales: ₱${declaredSales.toLocaleString()}, Tax Paid: ₱${actualTaxPaid.toLocaleString()} via ${bankChannel} (Ref: ${paymentRefNumber})`;

    const jvNumber = `JV-TAX-${taxYear}-${String(Date.now()).slice(-4)}`;

    const newSpecialEntry: SpecialEntry = {
      id: Date.now(),
      jv_number: jvNumber,
      voucher_no: paymentRefNumber,
      entry_number: jvNumber,
      entry_date: paymentDate,
      description,
      entry_type: 'TAX_SETTLEMENT',
      company_name: activeCompany?.company_name || '',
      created_at: new Date().toISOString(),
      total_debit: Math.round(totalDebits * 100) / 100,
      total_credit: Math.round(totalCredits * 100) / 100,
      lines: journalLines,
      accounting_treatment: 'Standard'
    };

    onPostJournalEntry(newSpecialEntry);

    if (triggerAlert) {
      triggerAlert(`Tax payment of ₱${actualTaxPaid.toLocaleString()} for ${formLabel} posted to General Journal (${jvNumber}) successfully!`, 'success');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Record BIR Tax Payment & Settlement</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  General Journal Auto-Post
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Compare declared vs. auto-computed figures, enter actual tax paid, and record double-entry journal vouchers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handlePostEntry} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. SELECTION CONTROLS: TAX FORM & TAX YEAR */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tax Form */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                BIR Tax Return Form
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as TaxFormType)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden cursor-pointer"
              >
                <option value="2550Q">BIR Form 2550Q — Quarterly Value-Added Tax</option>
                <option value="2551Q">BIR Form 2551Q — Quarterly Percentage Tax (Sec 116)</option>
                <option value="1701Q">BIR Form 1701Q — Quarterly Income Tax (Individuals)</option>
                <option value="1702Q">BIR Form 1702Q — Quarterly Income Tax (Corporations)</option>
                <option value="1701_ANNUAL">BIR Form 1701 / 1701A — Annual Income Tax</option>
                <option value="1702_ANNUAL">BIR Form 1702-RT — Annual Corporate Income Tax</option>
                <option value="1601EQ">BIR Form 1601-EQ — Expanded Withholding Tax (Quarterly)</option>
                <option value="0619E">BIR Form 0619-E — Monthly Remittance (Expanded WTax)</option>
                <option value="1601C">BIR Form 1601-C — Monthly Compensation Withholding</option>
              </select>
            </div>

            {/* Tax Year (Restricted to present year + years with transactions) */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                Taxable Year (Transactions Present)
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono font-bold focus:border-purple-500 focus:outline-hidden cursor-pointer"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      Fiscal Year {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quarter / Period */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                Reporting Quarter / Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold focus:border-purple-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Q1">1st Quarter (Q1: Jan - Mar)</option>
                <option value="Q2">2nd Quarter (Q2: Apr - Jun)</option>
                <option value="Q3">3rd Quarter (Q3: Jul - Sep)</option>
                <option value="Q4">4th Quarter (Q4: Oct - Dec)</option>
                <option value="ANNUAL">Full Calendar Year (Annual Return)</option>
              </select>
            </div>
          </div>

          {/* 2. AUTO-COMPUTED VS. DECLARED COMPARISON TABLE */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">
                Declared on BIR Return vs. System Auto-Computed Books
              </span>
              <span className="text-[10px] text-zinc-400">
                You can adjust declared amounts to match the exact filed BIR form
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Declared */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-zinc-300 font-semibold text-[11px]">
                    Sales / Receipts Declared on Return
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Auto-Books: ₱{autoComputed.vatableSales.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={declaredSales}
                  onChange={(e) => setDeclaredSales(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Output Tax / Gross Tax Due */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-zinc-300 font-semibold text-[11px]">
                    Output Tax / Gross Tax Due
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Auto-Books: ₱{(formType === '2550Q' ? autoComputed.outputVat : autoComputed.percentageTaxPayable).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={declaredOutputTax}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDeclaredOutputTax(val);
                    setActualTaxPaid(Math.max(0, val - declaredInputCredits - declaredCwtCredits + penaltiesSurcharges));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Input Tax Credits / Tax Deductions */}
              {formType === '2550Q' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-semibold text-[11px]">
                      Creditable Input VAT Claimed (Line 21)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Auto-Books: ₱{autoComputed.inputVat.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={declaredInputCredits}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDeclaredInputCredits(val);
                      setActualTaxPaid(Math.max(0, declaredOutputTax - val - declaredCwtCredits + penaltiesSurcharges));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Creditable Withholding Tax (2307) Credits */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-zinc-300 font-semibold text-[11px]">
                    Creditable Withholding Tax (Form 2307 Credits Claimed)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Auto-Books: ₱{autoComputed.creditable2307.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={declaredCwtCredits}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDeclaredCwtCredits(val);
                    setActualTaxPaid(Math.max(0, declaredOutputTax - declaredInputCredits - val + penaltiesSurcharges));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Penalties & Surcharges (if late) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-zinc-300 font-semibold text-[11px]">
                    Penalties, Surcharges & Compromise (if paid late)
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    EOPT: 10% for Micro/Small (vs 25% standard)
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={penaltiesSurcharges}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPenaltiesSurcharges(val);
                    setActualTaxPaid(Math.max(0, declaredOutputTax - declaredInputCredits - declaredCwtCredits + val));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Actual Tax Paid */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-emerald-400 font-bold text-[11px]">
                    Actual Tax Paid to BIR / Authorized Agent Bank (PHP)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Exact Bank Debit Amount
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={actualTaxPaid}
                  onChange={(e) => setActualTaxPaid(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-mono font-bold text-sm focus:border-emerald-400 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. PAYMENT SETTLEMENT DETAILS */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-medium focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                Authorized Agent Bank (AAB) / Payment Channel
              </label>
              <select
                value={bankChannel}
                onChange={(e) => setBankChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-medium focus:border-purple-500 focus:outline-hidden cursor-pointer"
              >
                <option value="LandBank of the Philippines (AAB)">LandBank of the Philippines (eFPS / OTC)</option>
                <option value="Development Bank of the Philippines (DBP)">Development Bank of the Philippines (DBP)</option>
                <option value="BDO Unibank (eFPS / OTC)">BDO Unibank</option>
                <option value="Bank of the Philippine Islands (BPI)">Bank of the Philippine Islands (BPI)</option>
                <option value="Metrobank (eFPS / OTC)">Metrobank</option>
                <option value="UnionBank of the Philippines">UnionBank of the Philippines</option>
                <option value="Maya / GCash e-Payment">Maya / GCash Digital Tax Payment</option>
                <option value="BIR Revenue District Office (RDO) Cashier">BIR Revenue District Office (RDO) Cashier</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                Reference No. / eFPS Confirmation / Bank Ref
              </label>
              <input
                type="text"
                value={paymentRefNumber}
                onChange={(e) => setPaymentRefNumber(e.target.value)}
                placeholder="e.g. eFPS-2026-992144"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* 4. LIVE COMPOUND JOURNAL ENTRY PREVIEW */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 overflow-hidden">
            <div className="p-3 bg-purple-950/40 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-purple-200 text-xs">
                  Automated Double-Entry General Journal Voucher Preview
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isBalanced ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isBalanced ? 'Balanced (Debits = Credits)' : 'Out of Balance'}
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                    <th className="pb-2">Account Code</th>
                    <th className="pb-2">Account Title</th>
                    <th className="pb-2 text-right">Debit (PHP)</th>
                    <th className="pb-2 text-right">Credit (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {journalLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-purple-500/5">
                      <td className="py-2 text-purple-400 font-bold">{line.account_code}</td>
                      <td className={`py-2 ${line.type === 'Credit' ? 'pl-6 text-zinc-300' : 'text-zinc-100 font-semibold'}`}>
                        {line.account_title}
                      </td>
                      <td className="py-2 text-right text-emerald-400">
                        {line.type === 'Debit' ? `₱${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2 text-right text-cyan-400">
                        {line.type === 'Credit' ? `₱${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-purple-500/40 font-bold bg-black/20 text-xs">
                    <td colSpan={2} className="py-2.5 text-zinc-200">TOTAL BALANCING SUM</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">
                      ₱{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono text-cyan-400">
                      ₱{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-500 text-[11px]">
              Entry will be automatically inserted into the General Journal as an official tax settlement voucher.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isBalanced || actualTaxPaid <= 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Post to General Journal</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
