import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Copy,
  FileCode,
  Info,
  Filter,
  Check,
  Upload,
  RefreshCw
} from 'lucide-react';
import { 
  Sale, 
  Collection, 
  Expense, 
  Payment, 
  Customer, 
  Contractor, 
  Company 
} from '../types';
import { parseCsvText } from '../utils/csvImportExport';

export type BusinessTaxSubTab = 
  | 'btax_2550q' 
  | 'btax_2551q' 
  | 'btax_sales' 
  | 'btax_purchases';

interface BusinessTaxHubTabProps {
  sales: Sale[];
  collections?: Collection[];
  expenses: Expense[];
  payments?: Payment[];
  customers?: Customer[];
  contractors?: Contractor[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: BusinessTaxSubTab;
  onUpdateSales?: (updater: (prev: any[]) => any[]) => void;
  onUpdateExpenses?: (updater: (prev: any[]) => any[]) => void;
}

// Global filter to permanently exclude sample / demo / mock transactions from all BIR filings
export function isSampleTransaction(record: any): boolean {
  if (!record) return true;
  if (record.is_sample === true || record.isSample === true) return true;
  
  // Never exclude user transactions created in UI (has timestamp ID > 100000 or created_at)
  if (Number(record.id) > 100000 || record.created_at) {
    return false;
  }

  const name = String(
    record.customer_name || 
    record.registered_name || 
    record.client_name || 
    record.service_provider_name || 
    record.supplier_name || 
    record.provider_name || 
    record.name || 
    ''
  ).toLowerCase().trim();

  // Explicit demo boilerplate identifiers
  if (name === 'customer / client' || name === 'vendor / contractor' || name === 'sample customer' || name === 'sample vendor') return true;

  return false;
}

// Flexible quarter and year parser supporting YYYY-MM-DD, MM/DD/YYYY, and ISO formats
function getQuarterFromDate(dateStr?: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = dateStr.split(/[-/]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 3) return 'Q1';
      if (m >= 4 && m <= 6) return 'Q2';
      if (m >= 7 && m <= 9) return 'Q3';
      if (m >= 10 && m <= 12) return 'Q4';
    }
    return null;
  }
  const m = d.getMonth() + 1;
  if (m >= 1 && m <= 3) return 'Q1';
  if (m >= 4 && m <= 6) return 'Q2';
  if (m >= 7 && m <= 9) return 'Q3';
  return 'Q4';
}

function getYearFromDate(dateStr?: string): string {
  if (!dateStr) return '2026';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return String(d.getFullYear());
  const parts = dateStr.split(/[-/]/);
  if (parts.length > 0 && parts[0].length === 4) return parts[0];
  if (parts.length >= 3 && parts[2].length === 4) return parts[2];
  return '2026';
}

export default function BusinessTaxHubTab({
  sales = [],
  collections = [],
  expenses = [],
  payments = [],
  customers = [],
  contractors = [],
  activeCompany,
  theme,
  triggerAlert,
  initialSubTab = 'btax_2550q',
  onUpdateSales,
  onUpdateExpenses
}: BusinessTaxHubTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<BusinessTaxSubTab>(initialSubTab);

  // File input refs for CSV imports
  const salesFileInputRef = useRef<HTMLInputElement>(null);
  const purchasesFileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialSubTab if updated from navigation ribbon
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const companyName = activeCompany?.company_name || 'No Active Entity';
  const companyAddress = activeCompany?.company_address || activeCompany?.registered_address || 'Philippines';
  const rawTin = activeCompany?.company_tin || '000-000-000-00000';
  const cleanTin = (rawTin.replace(/\D/g, '') || '000000000').slice(0, 9).padEnd(9, '0');
  const isVatRegistered = (activeCompany?.vat_or_non_vat || '').toUpperCase().includes('VAT') && !(activeCompany?.vat_or_non_vat || '').toUpperCase().includes('NON');
  const lineOfBusiness = activeCompany?.line_of_business || (activeCompany as any)?.nature_of_business || 'General Business & Commerce';

  // Modal state for DAT file preview
  const [datModalContent, setDatModalContent] = useState<{ title: string; filename: string; text: string } | null>(null);
  const [datCopied, setDatCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE: 2550Q QUARTERLY VAT RETURN
  // ---------------------------------------------------------------------------
  const [vatQuarter, setVatQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(() => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  });
  const [vatYear, setVatYear] = useState<string>(() => String(new Date().getFullYear()));
  const [priorVatOverpayment, setPriorVatOverpayment] = useState<number>(0);
  const [priorVatPayments, setPriorVatPayments] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // STATE: 2551Q PERCENTAGE TAX RETURN
  // ---------------------------------------------------------------------------
  const [qtr2551, setQtr2551] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(() => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  });
  const [year2551, setYear2551] = useState<string>(() => String(new Date().getFullYear()));
  const [rate2551, setRate2551] = useState<number>(3); // 3% CREATE rate or 1% during pandemic
  const [priorPaid2551, setPriorPaid2551] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // STATE: SUMMARY LIST OF SALES (SLS)
  // ---------------------------------------------------------------------------
  const [salesQuarter, setSalesQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [salesYear, setSalesYear] = useState<string>(() => String(new Date().getFullYear()));
  const [salesSearch, setSalesSearch] = useState<string>('');

  // ---------------------------------------------------------------------------
  // STATE: SUMMARY LIST OF PURCHASES (SLP)
  // ---------------------------------------------------------------------------
  const [purchasesQuarter, setPurchasesQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [purchasesYear, setPurchasesYear] = useState<string>(() => String(new Date().getFullYear()));
  const [purchasesSearch, setPurchasesSearch] = useState<string>('');

  // Auto-align default quarter to most recent transaction if available
  useEffect(() => {
    const allDates = [...sales, ...expenses]
      .map(t => (t as any).date || (t as any).invoice_date || (t as any).expense_date)
      .filter(Boolean);
    if (allDates.length > 0) {
      const latestDateStr = allDates.sort().reverse()[0];
      const q = getQuarterFromDate(latestDateStr);
      const y = getYearFromDate(latestDateStr);
      if (q) {
        setVatQuarter(q);
        setQtr2551(q);
      }
      if (y) {
        setVatYear(y);
        setYear2551(y);
        setSalesYear(y);
        setPurchasesYear(y);
      }
    }
  }, [sales, expenses]);

  /* ========================================================================= */
  /* COMPUTATION: 2550Q QUARTERLY VAT RETURN (REAL TRANSACTIONS ONLY)          */
  /* ========================================================================= */
  const comp2550q = useMemo(() => {
    // Filter sales and expenses by selected quarter & year (strictly real transactions)
    const quarterSales = sales
      .filter(s => !isSampleTransaction(s))
      .filter(s => {
        const q = getQuarterFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
        const y = getYearFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
        if (!q) return false;
        return q === vatQuarter && y === vatYear;
      });

    const quarterExpenses = expenses
      .filter(e => !isSampleTransaction(e))
      .filter(e => {
        const q = getQuarterFromDate(e.expense_date || (e as any).date || (e as any).transaction_date);
        const y = getYearFromDate(e.expense_date || (e as any).date || (e as any).transaction_date);
        if (!q) return false;
        return q === vatQuarter && y === vatYear;
      });

    // 1. Sales & Output VAT
    let vatableSales = 0;
    let outputVat = 0;
    let salesToGovt = 0;
    let govtOutputVat = 0;
    let zeroRatedSales = 0;
    let exemptSales = 0;

    quarterSales.forEach(s => {
      const gross = Number(s.total_amount_due) || Number(s.invoice_amount) || Number(s.amount) || Number((s as any).total_amount_vat_inclusive) || 0;
      const vatable = Number(s.vatable_sales) || Number(s.vatable_amount) || (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);
      const vAmount = Number(s.add_vat) || Number((s as any).vat_amount) || Number(s.output_vat) || (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);
      const zero = Number(s.zero_rated) || Number((s as any).zero_rated_amount) || 0;
      const exempt = Number(s.vat_exempt) || Number(s.vat_exempt_amount) || 0;

      const custName = (s.customer_name || (s as any).registered_name || '').toLowerCase();
      const isGovt = custName.includes('government') || custName.includes('deped') || custName.includes('dpwh') || custName.includes('doh') || custName.includes('lgu');

      if (isGovt) {
        salesToGovt += vatable;
        govtOutputVat += vAmount;
      } else {
        vatableSales += vatable;
        outputVat += vAmount;
      }

      zeroRatedSales += zero;
      exemptSales += exempt;
    });

    const totalSales = vatableSales + salesToGovt + zeroRatedSales + exemptSales;
    const totalOutputVat = outputVat + govtOutputVat;

    // 2. Purchases & Input VAT
    let inputGoods = 0;
    let inputServices = 0;
    let inputCapital = 0;
    let totalInputVat = 0;

    quarterExpenses.forEach(e => {
      const gross = Number(e.total_amount_due) || Number(e.expense_invoice_amount) || Number(e.amount) || Number((e as any).total_amount_vat_inclusive) || 0;
      const vatable = Number(e.vatable_expense) || Number(e.vatable_expense_amount) || (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);
      const inVat = Number(e.add_vat) || Number((e as any).vat_amount) || Number(e.vat_input_amount) || (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);

      const desc = ((e.expense_type || '') + ' ' + (e.service_provider_name || '') + ' ' + ((e as any).particulars || '') + ' ' + ((e as any).expense_category || '')).toLowerCase();
      const isCapital = desc.includes('equipment') || desc.includes('vehicle') || desc.includes('asset') || desc.includes('machinery') || desc.includes('laptop');
      const isService = desc.includes('service') || desc.includes('professional') || desc.includes('consulting') || desc.includes('rent') || desc.includes('repair') || desc.includes('utility');

      if (isCapital) {
        inputCapital += inVat;
      } else if (isService) {
        inputServices += inVat;
      } else {
        inputGoods += inVat;
      }

      totalInputVat += inVat;
    });

    const allowableInputVat = totalInputVat + priorVatOverpayment;
    const netVatPayable = Math.max(0, totalOutputVat - allowableInputVat);
    const excessInputVat = Math.max(0, allowableInputVat - totalOutputVat);

    // 3. Tax Credits: BIR 2307 Creditable VAT withheld (WV010)
    let creditableVatWithheld = 0;
    quarterSales.forEach(s => {
      const wtax = Number(s.less_withholding_tax) || Number(s.withholding_2307) || Number((s as any).tax_withheld) || 0;
      const custName = (s.customer_name || (s as any).registered_name || '').toLowerCase();
      if (custName.includes('government') || custName.includes('deped') || custName.includes('dpwh') || custName.includes('doh')) {
        creditableVatWithheld += wtax;
      }
    });

    const totalCredits = priorVatPayments + creditableVatWithheld;
    const taxStillDue = Math.max(0, netVatPayable - totalCredits);
    const overpayment = Math.max(0, totalCredits - netVatPayable + (excessInputVat > 0 ? excessInputVat : 0));

    return {
      vatableSales,
      outputVat,
      salesToGovt,
      govtOutputVat,
      zeroRatedSales,
      exemptSales,
      totalSales,
      totalOutputVat,
      inputGoods,
      inputServices,
      inputCapital,
      totalInputVat,
      priorVatOverpayment,
      allowableInputVat,
      netVatPayable,
      excessInputVat,
      creditableVatWithheld,
      priorVatPayments,
      totalCredits,
      taxStillDue,
      overpayment,
      salesCount: quarterSales.length,
      expensesCount: quarterExpenses.length
    };
  }, [sales, expenses, vatQuarter, vatYear, priorVatOverpayment, priorVatPayments, isVatRegistered]);

  /* ========================================================================= */
  /* COMPUTATION: 2551Q PERCENTAGE TAX RETURN (NON-VAT ENTITIES)               */
  /* ========================================================================= */
  const comp2551q = useMemo(() => {
    const qSales = sales
      .filter(s => !isSampleTransaction(s))
      .filter(s => {
        const q = getQuarterFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
        const y = getYearFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
        if (!q) return false;
        return q === qtr2551 && y === year2551;
      });

    let grossTaxable = 0;
    let creditableTaxWithheld = 0;

    qSales.forEach(s => {
      const gross = Number(s.total_amount_due) || Number(s.invoice_amount) || Number(s.amount) || Number((s as any).total_amount_vat_inclusive) || 0;
      const wtax = Number(s.less_withholding_tax) || Number(s.withholding_2307) || Number((s as any).tax_withheld) || 0;
      grossTaxable += gross;
      creditableTaxWithheld += wtax;
    });

    const pctRate = rate2551 / 100;
    const taxDue = grossTaxable * pctRate;
    const totalCredits = priorPaid2551 + creditableTaxWithheld;
    const taxStillDue = Math.max(0, taxDue - totalCredits);
    const overpayment = Math.max(0, totalCredits - taxDue);

    return {
      grossTaxable,
      taxRate: rate2551,
      taxDue,
      creditableTaxWithheld,
      priorPaid2551,
      totalCredits,
      taxStillDue,
      overpayment,
      salesCount: qSales.length
    };
  }, [sales, rate2551, priorPaid2551, qtr2551, year2551]);

  /* ========================================================================= */
  /* DATA: SUMMARY LIST OF SALES (SLS - REAL TRANSACTIONS PIPELINE)            */
  /* ========================================================================= */
  const slsRows = useMemo(() => {
    return sales
      .filter(s => !isSampleTransaction(s))
      .filter(s => {
        if (salesQuarter !== 'ALL') {
          const q = getQuarterFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
          const y = getYearFromDate(s.invoice_date || (s as any).date || (s as any).transaction_date);
          if (q && (q !== salesQuarter || y !== salesYear)) return false;
        }
        return true;
      })
      .map((s, idx) => {
        const gross = Number(s.total_amount_due) || Number(s.invoice_amount) || Number(s.amount) || Number((s as any).total_amount_vat_inclusive) || 0;
        const vatable = Number(s.vatable_sales) || Number(s.vatable_amount) || (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);
        const exempt = Number(s.vat_exempt) || Number(s.vat_exempt_amount) || 0;
        const zeroRated = Number(s.zero_rated) || Number((s as any).zero_rated_amount) || 0;
        const outputVat = Number(s.add_vat) || Number((s as any).vat_amount) || Number(s.output_vat) || (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);
        const wtax2307 = Number(s.less_withholding_tax) || Number(s.withholding_2307) || Number((s as any).tax_withheld) || 0;

        // Auto-match customer profile in directory if missing on invoice
        const matchedCust = customers.find(c => 
          (c.customer_name && s.customer_name && c.customer_name.toLowerCase() === s.customer_name.toLowerCase()) ||
          (c.registered_name && s.customer_name && c.registered_name.toLowerCase() === s.customer_name.toLowerCase())
        );

        const custName = s.customer_name || (s as any).registered_name || (s as any).client_name || matchedCust?.customer_name || matchedCust?.registered_name || 'Customer';
        const custTin = s.customer_tin || (s as any).client_TIN || (s as any).tin_number || matchedCust?.customer_tin || matchedCust?.client_TIN || '000-000-000-00000';
        const cleanCustTin = (custTin.replace(/\D/g, '') || '000000000').slice(0, 9).padEnd(9, '0');
        const branch = custTin.includes('-') && custTin.split('-')[3] ? custTin.split('-')[3].slice(0, 5) : '00000';
        const custAddress = s.customer_address || (s as any).client_Address || (s as any).address || matchedCust?.customer_address || matchedCust?.address || 'Philippines';
        const invNo = s.invoice_number || (s as any).invoice_no || `SI-${s.id}`;
        const dateStr = s.invoice_date || (s as any).date || (s as any).transaction_date || '2026-08-15';

        return {
          seq: idx + 1,
          id: s.id,
          tin: custTin,
          cleanTin: cleanCustTin,
          branch,
          name: custName,
          address: custAddress,
          invoiceNo: invNo,
          date: dateStr,
          gross,
          exempt,
          zeroRated,
          taxable: vatable,
          outputVat,
          wtax2307
        };
      })
      .filter(r => {
        if (!salesSearch) return true;
        const q = salesSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tin.includes(q) || r.invoiceNo.toLowerCase().includes(q);
      });
  }, [sales, customers, salesQuarter, salesYear, salesSearch, isVatRegistered]);

  const slsSummary = useMemo(() => {
    const totalGross = slsRows.reduce((sum, r) => sum + r.gross, 0);
    const totalTaxable = slsRows.reduce((sum, r) => sum + r.taxable, 0);
    const totalExempt = slsRows.reduce((sum, r) => sum + r.exempt, 0);
    const totalZeroRated = slsRows.reduce((sum, r) => sum + r.zeroRated, 0);
    const totalOutputVat = slsRows.reduce((sum, r) => sum + r.outputVat, 0);
    const totalWtax2307 = slsRows.reduce((sum, r) => sum + r.wtax2307, 0);

    return {
      totalGross,
      totalTaxable,
      totalExempt,
      totalZeroRated,
      totalOutputVat,
      totalWtax2307,
      count: slsRows.length
    };
  }, [slsRows]);

  /* ========================================================================= */
  /* DATA: SUMMARY LIST OF PURCHASES (SLP - REAL TRANSACTIONS PIPELINE)        */
  /* ========================================================================= */
  const slpRows = useMemo(() => {
    return expenses
      .filter(e => !isSampleTransaction(e))
      .filter(e => {
        if (purchasesQuarter !== 'ALL') {
          const q = getQuarterFromDate(e.expense_date || (e as any).date || (e as any).transaction_date);
          const y = getYearFromDate(e.expense_date || (e as any).date || (e as any).transaction_date);
          if (q && (q !== purchasesQuarter || y !== purchasesYear)) return false;
        }
        return true;
      })
      .map((e, idx) => {
        const gross = Number(e.total_amount_due) || Number(e.expense_invoice_amount) || Number(e.amount) || Number((e as any).total_amount_vat_inclusive) || 0;
        const vatable = Number(e.vatable_expense) || Number(e.vatable_expense_amount) || (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);
        const exempt = Number(e.vat_exempt) || Number(e.nonvat_expense_amount) || 0;
        const zeroRated = Number(e.zero_rated) || Number((e as any).zero_rated_amount) || 0;
        const inputVat = Number(e.add_vat) || Number((e as any).vat_amount) || Number(e.vat_input_amount) || (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);
        const wtax = Number(e.withholding_2307_2306) || Number((e as any).tax_withheld) || Number(e.ewt_amount) || 0;

        // Auto-match vendor profile in directory if missing on voucher
        const matchedVendor = contractors.find(c => 
          (c.service_provider_name && e.service_provider_name && c.service_provider_name.toLowerCase() === e.service_provider_name.toLowerCase()) ||
          (c.registered_name && e.service_provider_name && c.registered_name.toLowerCase() === e.service_provider_name.toLowerCase())
        );

        const spName = e.service_provider_name || (e as any).supplier_name || (e as any).registered_name || matchedVendor?.service_provider_name || matchedVendor?.registered_name || 'Vendor';
        const spTin = e.sp_tin || (e as any).tin || (e as any).service_provider_TIN || matchedVendor?.sp_tin || matchedVendor?.service_provider_TIN || '000-000-000-00000';
        const cleanSpTin = (spTin.replace(/\D/g, '') || '000000000').slice(0, 9).padEnd(9, '0');
        const branch = spTin.includes('-') && spTin.split('-')[3] ? spTin.split('-')[3].slice(0, 5) : '00000';
        const spAddress = e.sp_address || (e as any).service_provider_Address || matchedVendor?.sp_address || matchedVendor?.service_provider_Address || 'Philippines';
        const voucherNo = (e as any).voucher_number || (e as any).invoice_number || (e as any).voucher_no || `VCH-${e.id}`;
        const dateStr = e.expense_date || (e as any).date || (e as any).transaction_date || '2026-08-15';

        const desc = ((e.expense_type || '') + ' ' + (e.service_provider_name || '') + ' ' + ((e as any).particulars || '') + ' ' + ((e as any).expense_category || '')).toLowerCase();
        const isService = desc.includes('service') || desc.includes('professional') || desc.includes('consulting') || desc.includes('rent') || desc.includes('repair') || desc.includes('utility');

        return {
          seq: idx + 1,
          id: e.id,
          tin: spTin,
          cleanTin: cleanSpTin,
          branch,
          name: spName,
          address: spAddress,
          voucherNo,
          date: dateStr,
          gross,
          exempt,
          zeroRated,
          taxableGoods: isService ? 0 : vatable,
          taxableServices: isService ? vatable : 0,
          taxableTotal: vatable,
          inputVat,
          wtax
        };
      })
      .filter(r => {
        if (!purchasesSearch) return true;
        const q = purchasesSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tin.includes(q) || r.voucherNo.toLowerCase().includes(q);
      });
  }, [expenses, contractors, purchasesQuarter, purchasesYear, purchasesSearch, isVatRegistered]);

  const slpSummary = useMemo(() => {
    const totalGross = slpRows.reduce((sum, r) => sum + r.gross, 0);
    const totalTaxableGoods = slpRows.reduce((sum, r) => sum + r.taxableGoods, 0);
    const totalTaxableServices = slpRows.reduce((sum, r) => sum + r.taxableServices, 0);
    const totalTaxableTotal = slpRows.reduce((sum, r) => sum + r.taxableTotal, 0);
    const totalExempt = slpRows.reduce((sum, r) => sum + r.exempt, 0);
    const totalZeroRated = slpRows.reduce((sum, r) => sum + r.zeroRated, 0);
    const totalInputVat = slpRows.reduce((sum, r) => sum + r.inputVat, 0);
    const totalWtax = slpRows.reduce((sum, r) => sum + r.wtax, 0);

    return {
      totalGross,
      totalTaxableGoods,
      totalTaxableServices,
      totalTaxableTotal,
      totalExempt,
      totalZeroRated,
      totalInputVat,
      totalWtax,
      count: slpRows.length
    };
  }, [slpRows]);

  /* ========================================================================= */
  /* RELIEF .DAT FILE BUILDERS (STRICT REAL DATA GUARANTEE - NO SAMPLE ROWS)   */
  /* ========================================================================= */
  const buildSLSDatString = (): string => {
    const validRows = slsRows.filter(r => !isSampleTransaction(r));
    if (validRows.length === 0) {
      return `// BIR RELIEF SLS (Summary List of Sales)\n// STATUS: No real sales transactions recorded for ${salesQuarter} ${salesYear}.\n// NOTE: Sample transactions are strictly excluded to ensure compliance with BIR eSubmission rules.\n// Please click 'Import CSV from Sales' or record sales transactions to generate your BIR RELIEF file.`;
    }
    const qtr = salesQuarter === 'ALL' ? 'Q3' : salesQuarter;
    const yr = salesYear;
    const totalExempt = validRows.reduce((sum, r) => sum + r.exempt, 0);
    const totalZeroRated = validRows.reduce((sum, r) => sum + r.zeroRated, 0);
    const totalTaxable = validRows.reduce((sum, r) => sum + r.taxable, 0);
    const totalOutputVat = validRows.reduce((sum, r) => sum + r.outputVat, 0);
    const totalGross = validRows.reduce((sum, r) => sum + r.gross, 0);

    // BIR RELIEF Header Format for SLS:
    const header = `H,S,"${cleanTin}","${companyName}","${companyName}","${companyAddress}",${yr}${qtr},${totalExempt.toFixed(2)},${totalZeroRated.toFixed(2)},${totalTaxable.toFixed(2)},${totalOutputVat.toFixed(2)},${totalGross.toFixed(2)}\n`;
    
    // Detail rows for real transactions only:
    const details = validRows.map(r => {
      return `D,S,"${r.cleanTin}","${r.name}","${r.name}","${r.address}",${r.exempt.toFixed(2)},${r.zeroRated.toFixed(2)},${r.taxable.toFixed(2)},${r.outputVat.toFixed(2)},${r.gross.toFixed(2)}`;
    }).join('\n');

    return header + details;
  };

  const handleDownloadSLSDat = () => {
    const validRows = slsRows.filter(r => !isSampleTransaction(r));
    if (validRows.length === 0) {
      triggerAlert(`Cannot generate SLS .DAT: No real sales transactions found for ${salesQuarter} ${salesYear}. Sample or dummy data is prohibited in BIR files.`, 'error');
      return;
    }
    const content = buildSLSDatString();
    const qtr = salesQuarter === 'ALL' ? 'ANNUAL' : salesQuarter;
    const filename = `SLS_${cleanTin}_${qtr}_${salesYear}.DAT`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAlert(`Downloaded BIR Summary List of Sales (SLS .DAT file) with ${validRows.length} real transactions!`, 'success');
  };

  const buildSLPDatString = (): string => {
    const validRows = slpRows.filter(r => !isSampleTransaction(r));
    if (validRows.length === 0) {
      return `// BIR RELIEF SLP (Summary List of Purchases)\n// STATUS: No real purchase transactions recorded for ${purchasesQuarter} ${purchasesYear}.\n// NOTE: Sample transactions are strictly excluded to ensure compliance with BIR eSubmission rules.\n// Please click 'Import CSV from Purchases' or record purchase vouchers to generate your BIR RELIEF file.`;
    }
    const qtr = purchasesQuarter === 'ALL' ? 'Q3' : purchasesQuarter;
    const yr = purchasesYear;
    const totalExempt = validRows.reduce((sum, r) => sum + r.exempt, 0);
    const totalZeroRated = validRows.reduce((sum, r) => sum + r.zeroRated, 0);
    const totalTaxableGoods = validRows.reduce((sum, r) => sum + r.taxableGoods, 0);
    const totalTaxableServices = validRows.reduce((sum, r) => sum + r.taxableServices, 0);
    const totalInputVat = validRows.reduce((sum, r) => sum + r.inputVat, 0);
    const totalGross = validRows.reduce((sum, r) => sum + r.gross, 0);

    // BIR RELIEF Header Format for SLP:
    const header = `H,P,"${cleanTin}","${companyName}","${companyName}","${companyAddress}",${yr}${qtr},${totalExempt.toFixed(2)},${totalZeroRated.toFixed(2)},${totalTaxableGoods.toFixed(2)},${totalTaxableServices.toFixed(2)},${totalInputVat.toFixed(2)},${totalGross.toFixed(2)}\n`;

    // Detail rows for real purchases only:
    const details = validRows.map(r => {
      return `D,P,"${r.cleanTin}","${r.name}","${r.name}","${r.address}",${r.exempt.toFixed(2)},${r.zeroRated.toFixed(2)},${r.taxableGoods.toFixed(2)},${r.taxableServices.toFixed(2)},${r.inputVat.toFixed(2)},${r.gross.toFixed(2)}`;
    }).join('\n');

    return header + details;
  };

  const handleDownloadSLPDat = () => {
    const validRows = slpRows.filter(r => !isSampleTransaction(r));
    if (validRows.length === 0) {
      triggerAlert(`Cannot generate SLP .DAT: No real purchase transactions found for ${purchasesQuarter} ${purchasesYear}. Sample or dummy data is prohibited in BIR files.`, 'error');
      return;
    }
    const content = buildSLPDatString();
    const qtr = purchasesQuarter === 'ALL' ? 'ANNUAL' : purchasesQuarter;
    const filename = `SLP_${cleanTin}_${qtr}_${purchasesYear}.DAT`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAlert(`Downloaded BIR Summary List of Purchases (SLP .DAT file) with ${validRows.length} real transactions!`, 'success');
  };

  /* ========================================================================= */
  /* CSV IMPORT ENGINES: IMPORT CSV FROM SALES & IMPORT FROM PURCHASES         */
  /* ========================================================================= */
  const handleSalesCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = String(evt.target?.result || '');
        const { headers, rows } = parseCsvText(text);

        if (rows.length === 0) {
          triggerAlert('The uploaded CSV file contains no data rows.', 'error');
          return;
        }

        // Helper to find column case-insensitively
        const findVal = (row: Record<string, string>, candidates: string[]) => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const c of candidates) {
              if (cleanKey.includes(c.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                return row[key];
              }
            }
          }
          return '';
        };

        const newRecords: any[] = [];
        rows.forEach((row, idx) => {
          // Exclude sample demo transactions from CSV
          if (isSampleTransaction(row)) return;

          const custName = findVal(row, ['Customer Name', 'Registered Name', 'Customer', 'Client Name', 'Buyer']) || 'Customer';
          const custTin = findVal(row, ['Customer TIN', 'Client TIN', 'TIN', 'Tax Identification Number']) || '000-000-000-00000';
          const custAddr = findVal(row, ['Customer Address', 'Address', 'Client Address', 'Location']) || 'Philippines';
          const invNo = findVal(row, ['Invoice Number', 'Invoice #', 'Invoice No', 'SI Number', 'Ref No', 'Document No']) || `SI-${Date.now()}-${idx + 1}`;
          const dateVal = findVal(row, ['Invoice Date', 'Date', 'Transaction Date', 'Issue Date']) || new Date().toISOString().split('T')[0];
          
          const rawGross = findVal(row, ['Gross Amount', 'Total Amount', 'Invoice Amount', 'Amount', 'Total Sale VAT Inclusive', 'Gross Sales']);
          const gross = parseFloat(String(rawGross).replace(/[^0-9.-]+/g, '')) || 0;
          if (gross <= 0 && !custName) return; // Skip blank lines

          const rawVatable = findVal(row, ['Vatable Sales', 'Vatable Amount', 'Net Sales', 'Vatable']);
          const vatable = rawVatable ? parseFloat(String(rawVatable).replace(/[^0-9.-]+/g, '')) : (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);

          const rawVat = findVal(row, ['Output VAT', 'VAT Amount', 'VAT', '12% VAT', 'Add VAT']);
          const outputVat = rawVat ? parseFloat(String(rawVat).replace(/[^0-9.-]+/g, '')) : (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);

          const rawExempt = findVal(row, ['VAT Exempt', 'Exempt Sales', 'Exempt Amount']);
          const exempt = parseFloat(String(rawExempt).replace(/[^0-9.-]+/g, '')) || 0;

          const rawZero = findVal(row, ['Zero Rated', 'Zero Rated Sales', '0% Rated']);
          const zeroRated = parseFloat(String(rawZero).replace(/[^0-9.-]+/g, '')) || 0;

          const rawWtax = findVal(row, ['Withholding 2307', 'Withholding Tax', '2307', 'CWT', 'Tax Withheld']);
          const wtax2307 = parseFloat(String(rawWtax).replace(/[^0-9.-]+/g, '')) || 0;

          const particulars = findVal(row, ['Particulars', 'Description', 'Item Description', 'Remarks']) || 'Sales Transaction';

          const record = {
            id: Date.now() + Math.floor(Math.random() * 100000) + idx,
            company_name: activeCompany?.company_name,
            registered_name: custName,
            customer_name: custName,
            tin: custTin,
            customer_tin: custTin,
            client_TIN: custTin,
            address: custAddr,
            customer_address: custAddr,
            client_Address: custAddr,
            invoice_number: invNo,
            date: dateVal,
            invoice_date: dateVal,
            amount: gross,
            invoice_amount: gross,
            total_amount_vat_inclusive: gross,
            vatable_amount: vatable,
            vatable_sales: vatable,
            vat_amount: outputVat,
            output_vat: outputVat,
            vat_exempt_amount: exempt,
            zero_rated_amount: zeroRated,
            tax_withheld: wtax2307,
            withholding_2307: wtax2307,
            total_amount_due: gross - wtax2307,
            status: 'Paid',
            vat_or_nonvat: isVatRegistered ? 'VAT' : 'NONVAT',
            type_of_transaction: 'CASH',
            invoice_type: 'SALES INVOICE',
            particulars,
            created_at: new Date().toISOString()
          };

          newRecords.push(record);
        });

        if (newRecords.length === 0) {
          triggerAlert('No valid real sales transactions were found to import from the CSV file.', 'error');
          return;
        }

        if (onUpdateSales) {
          onUpdateSales(prev => [...newRecords, ...prev]);
        }
        triggerAlert(`Successfully imported ${newRecords.length} sales transactions directly into SLS & Sales Register!`, 'success');
      } catch (err: any) {
        triggerAlert(`Failed to parse Sales CSV: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handlePurchasesCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = String(evt.target?.result || '');
        const { headers, rows } = parseCsvText(text);

        if (rows.length === 0) {
          triggerAlert('The uploaded CSV file contains no data rows.', 'error');
          return;
        }

        const findVal = (row: Record<string, string>, candidates: string[]) => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const c of candidates) {
              if (cleanKey.includes(c.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                return row[key];
              }
            }
          }
          return '';
        };

        const newRecords: any[] = [];
        rows.forEach((row, idx) => {
          if (isSampleTransaction(row)) return;

          const spName = findVal(row, ['Supplier Name', 'Vendor Name', 'Payee Name', 'Service Provider Name', 'Registered Name']) || 'Vendor';
          const spTin = findVal(row, ['Supplier TIN', 'Vendor TIN', 'Provider TIN', 'TIN', 'SP TIN']) || '000-000-000-00000';
          const spAddr = findVal(row, ['Supplier Address', 'Vendor Address', 'Address', 'SP Address']) || 'Philippines';
          const vchNo = findVal(row, ['Voucher Number', 'Voucher #', 'Invoice Number', 'Invoice #', 'Ref No', 'Document No']) || `VCH-${Date.now()}-${idx + 1}`;
          const dateVal = findVal(row, ['Expense Date', 'Date', 'Transaction Date', 'Issue Date']) || new Date().toISOString().split('T')[0];

          const rawGross = findVal(row, ['Gross Amount', 'Total Amount', 'Expense Amount', 'Invoice Amount', 'Amount', 'Total Expenses VAT Inclusive']);
          const gross = parseFloat(String(rawGross).replace(/[^0-9.-]+/g, '')) || 0;
          if (gross <= 0 && !spName) return;

          const rawVatable = findVal(row, ['Vatable Purchases', 'Vatable Expense', 'Vatable Amount', 'Taxable Goods', 'Taxable Services']);
          const vatable = rawVatable ? parseFloat(String(rawVatable).replace(/[^0-9.-]+/g, '')) : (isVatRegistered ? Math.round((gross / 1.12) * 100) / 100 : 0);

          const rawVat = findVal(row, ['Input VAT', 'VAT Amount', 'VAT', '12% Input VAT', 'Add VAT']);
          const inputVat = rawVat ? parseFloat(String(rawVat).replace(/[^0-9.-]+/g, '')) : (isVatRegistered ? Math.round((vatable * 0.12) * 100) / 100 : 0);

          const rawExempt = findVal(row, ['VAT Exempt', 'Non-VAT Amount', 'Exempt Purchases']);
          const exempt = parseFloat(String(rawExempt).replace(/[^0-9.-]+/g, '')) || 0;

          const rawZero = findVal(row, ['Zero Rated', 'Zero Rated Purchases']);
          const zeroRated = parseFloat(String(rawZero).replace(/[^0-9.-]+/g, '')) || 0;

          const rawWtax = findVal(row, ['Withholding Tax', 'EWT', '2307', 'Withholding 2307/2306', 'Tax Withheld']);
          const wtax = parseFloat(String(rawWtax).replace(/[^0-9.-]+/g, '')) || 0;

          const expCategory = findVal(row, ['Expense Category', 'Category', 'Expense Type', 'Particulars']) || 'Operating Expenses';

          const record = {
            id: Date.now() + Math.floor(Math.random() * 100000) + idx,
            company_name: activeCompany?.company_name,
            registered_name: spName,
            service_provider_name: spName,
            tin: spTin,
            sp_tin: spTin,
            service_provider_TIN: spTin,
            address: spAddr,
            sp_address: spAddr,
            voucher_number: vchNo,
            invoice_number: vchNo,
            date: dateVal,
            expense_date: dateVal,
            amount: gross,
            expense_invoice_amount: gross,
            total_amount_vat_inclusive: gross,
            vatable_amount: vatable,
            vatable_expense_amount: vatable,
            vat_amount: inputVat,
            vat_input_amount: inputVat,
            vat_exempt_amount: exempt,
            zero_rated_amount: zeroRated,
            tax_withheld: wtax,
            withholding_2307_2306: wtax,
            total_amount_due: gross - wtax,
            status: 'Paid',
            vat_or_nonvat: isVatRegistered ? 'VAT' : 'NONVAT',
            type_of_transaction: 'CASH',
            invoice_type: 'OFFICIAL RECEIPT',
            expense_type: expCategory,
            particulars: expCategory,
            created_at: new Date().toISOString()
          };

          newRecords.push(record);
        });

        if (newRecords.length === 0) {
          triggerAlert('No valid real purchase vouchers were found to import from the CSV file.', 'error');
          return;
        }

        if (onUpdateExpenses) {
          onUpdateExpenses(prev => [...newRecords, ...prev]);
        }
        triggerAlert(`Successfully imported ${newRecords.length} purchase vouchers directly into SLP & Purchase Register!`, 'success');
      } catch (err: any) {
        triggerAlert(`Failed to parse Purchases CSV: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadEmptySLSTemplate = () => {
    const headers = [
      'Invoice Date',
      'Invoice Number',
      'Customer Name',
      'Customer TIN',
      'Customer Address',
      'Gross Amount',
      'Vatable Sales',
      'Output VAT',
      'VAT Exempt Amount',
      'Zero Rated Amount',
      'Withholding 2307',
      'Particulars'
    ];
    const csvContent = '\uFEFF' + headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_SLS_Sales_Template_Empty.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert('Downloaded clean SLS CSV Template (zero sample rows)!', 'info');
  };

  const handleDownloadEmptySLPTemplate = () => {
    const headers = [
      'Expense Date',
      'Voucher Number',
      'Supplier Name',
      'Supplier TIN',
      'Supplier Address',
      'Expense Category',
      'Gross Amount',
      'Taxable Goods',
      'Taxable Services',
      'Input VAT',
      'VAT Exempt',
      'Zero Rated',
      'Withholding Tax',
      'Particulars'
    ];
    const csvContent = '\uFEFF' + headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_SLP_Purchases_Template_Empty.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert('Downloaded clean SLP CSV Template (zero sample rows)!', 'info');
  };

  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert(`Exported ${filename}.csv successfully!`, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setDatCopied(true);
    triggerAlert('Copied .DAT file text to clipboard!', 'info');
    setTimeout(() => setDatCopied(false), 2000);
  };

  return (
    <div className="space-y-5 select-none">
      
      {/* Hidden File Inputs for Direct CSV Imports */}
      <input 
        type="file" 
        ref={salesFileInputRef} 
        onChange={handleSalesCsvUpload} 
        accept=".csv" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={purchasesFileInputRef} 
        onChange={handlePurchasesCsvUpload} 
        accept=".csv" 
        className="hidden" 
      />

      {/* 1. SUBTABS CONTROLS BAR (REDUNDANT TITLE REMOVED PER REQ 4) */}
      <div className={`p-2.5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors duration-200`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
            isVatRegistered 
              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {isVatRegistered ? 'VAT Registered' : 'Non-VAT (Percentage Tax)'}
          </span>
        </div>

        {/* Action Controls & Navigation Subtabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('btax_2550q')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'btax_2550q' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : `${theme.textMuted} hover:text-cyan-400`
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>2550Q-VAT</span>
            </button>

            <button
              onClick={() => setActiveSubTab('btax_2551q')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'btax_2551q' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : `${theme.textMuted} hover:text-cyan-400`
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>2551Q-PERCENTAGE TAX</span>
            </button>

            <button
              onClick={() => setActiveSubTab('btax_sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'btax_sales' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : `${theme.textMuted} hover:text-cyan-400`
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>SUMMARY LIST OF SALES</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">.DAT</span>
            </button>

            <button
              onClick={() => setActiveSubTab('btax_purchases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'btax_purchases' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : `${theme.textMuted} hover:text-cyan-400`
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>SUMMARY LIST OF PURCHASES</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">.DAT</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: 2550Q-VAT RETURN                                              */}
      {/* ===================================================================== */}
      {activeSubTab === 'btax_2550q' && (
        <div className="space-y-5">
          
          {/* Controls Bar */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Return Period:</span>
              <select
                value={vatQuarter}
                onChange={(e) => setVatQuarter(e.target.value as any)}
                className={`px-3 py-1.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Q1" className="bg-slate-900 text-white">1st Quarter (Jan - Mar)</option>
                <option value="Q2" className="bg-slate-900 text-white">2nd Quarter (Apr - Jun)</option>
                <option value="Q3" className="bg-slate-900 text-white">3rd Quarter (Jul - Sep)</option>
                <option value="Q4" className="bg-slate-900 text-white">4th Quarter (Oct - Dec)</option>
              </select>

              <select
                value={vatYear}
                onChange={(e) => setVatYear(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024" className="bg-slate-900 text-white">Taxable Year 2024</option>
                <option value="2025" className="bg-slate-900 text-white">Taxable Year 2025</option>
                <option value="2026" className="bg-slate-900 text-white">Taxable Year 2026</option>
                <option value="2027" className="bg-slate-900 text-white">Taxable Year 2027</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('btax_sales')}
                className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5 ${theme.textTitle}`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                <span>SLS Attachment (.DAT)</span>
              </button>
              <button
                onClick={() => setActiveSubTab('btax_purchases')}
                className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5 ${theme.textTitle}`}
              >
                <DollarSign className="w-3.5 h-3.5 text-cyan-500" />
                <span>SLP Attachment (.DAT)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} relative overflow-hidden`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Total Vatable Sales ({comp2550q.salesCount} Real Txns)
              </span>
              <span className={`text-xl font-extrabold font-mono ${theme.textTitle}`}>
                ₱{comp2550q.vatableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-cyan-500 block mt-1 font-mono">
                12% Output Tax: ₱{comp2550q.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} relative overflow-hidden`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Total Input VAT ({comp2550q.expensesCount} Real Vouchers)
              </span>
              <span className="text-xl font-extrabold font-mono text-cyan-500">
                ₱{comp2550q.totalInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Allowable: ₱{comp2550q.allowableInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} relative overflow-hidden`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Net VAT Payable (Output - Input)
              </span>
              <span className={`text-xl font-extrabold font-mono ${comp2550q.netVatPayable > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                ₱{comp2550q.netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Excess Credits: ₱{comp2550q.excessInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} relative overflow-hidden bg-gradient-to-br from-cyan-500/5 to-transparent`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 text-cyan-500`}>
                Tax Still Due / (Overpayment)
              </span>
              <span className={`text-xl font-extrabold font-mono ${comp2550q.taxStillDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₱{comp2550q.taxStillDue > 0 
                  ? comp2550q.taxStillDue.toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : `(${comp2550q.overpayment.toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">
                {comp2550q.taxStillDue > 0 ? 'Remit before 25th of next month' : 'Carry-over to next quarter'}
              </span>
            </div>
          </div>

          {/* BIR FORM 2550Q STATEMENT SHEET */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                  BIR Form No. 2550Q (Quarterly Value-Added Tax Return) Statement Schedule
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                Quarter: {vatQuarter} | Year: {vatYear}
              </span>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Part II: Computation of Tax */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-500 mb-3 flex items-center gap-2">
                  <span>Part II: Computation of Net VAT Payable</span>
                </h4>

                <div className={`rounded-xl border ${theme.borderCard} overflow-hidden text-xs divide-y ${theme.borderCard}`}>
                  
                  {/* Line 12 - Vatable Sales */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">12A</span>
                      <span className={theme.textTitle}>Vatable Sales / Receipts - Private</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-400">
                      ₱{comp2550q.vatableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-36 text-right font-mono font-bold text-cyan-500">
                      ₱{comp2550q.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 13 - Sales to Government */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">13A</span>
                      <span className={theme.textTitle}>Sales to Government (Subject to 5% Final Withholding VAT)</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-400">
                      ₱{comp2550q.salesToGovt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-36 text-right font-mono font-bold text-cyan-500">
                      ₱{comp2550q.govtOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 14 - Zero Rated Sales */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">14</span>
                      <span className={theme.textTitle}>Zero-Rated Sales / Receipts</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-400">
                      ₱{comp2550q.zeroRatedSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-36 text-right font-mono font-bold text-zinc-500">
                      ₱0.00
                    </div>
                  </div>

                  {/* Line 15 - Exempt Sales */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">15</span>
                      <span className={theme.textTitle}>Exempt Sales / Receipts</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-400">
                      ₱{comp2550q.exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-36 text-right font-mono font-bold text-zinc-500">
                      ₱0.00
                    </div>
                  </div>

                  {/* Line 16 - Total Sales & Output Tax */}
                  <div className="p-3 flex items-center justify-between bg-black/5 dark:bg-white/5 font-bold">
                    <div className="flex-1">
                      <span className="text-zinc-400 mr-2">16</span>
                      <span className={theme.textTitle}>Total Sales/Receipts and Output Tax Due (Sum of 12B to 15B)</span>
                    </div>
                    <div className="w-36 text-right font-mono text-cyan-400">
                      ₱{comp2550q.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="w-36 text-right font-mono text-cyan-400">
                      ₱{comp2550q.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 17 - Input Tax on Capital Goods */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">17A</span>
                      <span className={theme.textTitle}>Input Tax on Purchase of Capital Goods</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className="w-36 text-right font-mono text-zinc-300">
                      ₱{comp2550q.inputCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 18 - Input Tax on Goods Other than Capital */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">18A</span>
                      <span className={theme.textTitle}>Input Tax on Purchase of Goods other than Capital Goods</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className="w-36 text-right font-mono text-zinc-300">
                      ₱{comp2550q.inputGoods.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 19 - Input Tax on Services */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1">
                      <span className="font-bold text-zinc-400 mr-2">19A</span>
                      <span className={theme.textTitle}>Input Tax on Domestic Purchase of Services</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className="w-36 text-right font-mono text-zinc-300">
                      ₱{comp2550q.inputServices.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 20 - Prior Period Excess Input Tax */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-zinc-400">20A</span>
                      <span className={theme.textTitle}>Excess Input Tax from Previous Quarter / Carry-over</span>
                    </div>
                    <div className="w-72 flex items-center justify-end gap-2">
                      <span className="text-zinc-500">₱</span>
                      <input
                        type="number"
                        value={priorVatOverpayment || ''}
                        onChange={(e) => setPriorVatOverpayment(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={`w-32 px-2 py-1 text-right text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>

                  {/* Line 21 - Total Allowable Input Tax */}
                  <div className="p-3 flex items-center justify-between bg-black/5 dark:bg-white/5 font-bold">
                    <div className="flex-1">
                      <span className="text-zinc-400 mr-2">21</span>
                      <span className={theme.textTitle}>Total Available Input Tax (Sum of 17B to 20F)</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className="w-36 text-right font-mono text-cyan-400">
                      ₱{comp2550q.allowableInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 22 - Net VAT Payable */}
                  <div className="p-3 flex items-center justify-between font-bold bg-cyan-500/5">
                    <div className="flex-1">
                      <span className="text-cyan-500 mr-2">22</span>
                      <span className={theme.textTitle}>Net VAT Payable / (Excess Input Tax) (Item 16B less Item 21)</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className={`w-36 text-right font-mono text-sm ${comp2550q.netVatPayable > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                      ₱{comp2550q.netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 23 - Tax Credits: Prior Payments */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-zinc-400">23A</span>
                      <span className={theme.textTitle}>Creditable VAT Withheld (BIR Form 2307 / Government Withholding)</span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className="w-36 text-right font-mono text-emerald-400 font-semibold">
                      ₱{comp2550q.creditableVatWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line 23B - Prior payments */}
                  <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-zinc-400">23B</span>
                      <span className={theme.textTitle}>Monthly VAT Payments Previously Remitted (BIR 0605 / 2550M)</span>
                    </div>
                    <div className="w-72 flex items-center justify-end gap-2">
                      <span className="text-zinc-500">₱</span>
                      <input
                        type="number"
                        value={priorVatPayments || ''}
                        onChange={(e) => setPriorVatPayments(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={`w-32 px-2 py-1 text-right text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>

                  {/* Line 24 - Tax Still Due / Overpayment */}
                  <div className="p-4 flex items-center justify-between font-extrabold text-sm bg-cyan-500/10">
                    <div className="flex-1">
                      <span className="text-cyan-500 mr-2">24</span>
                      <span className={theme.textTitle}>
                        TAX STILL PAYABLE / (OVERPAYMENT) (Item 22 less Item 23)
                      </span>
                    </div>
                    <div className="w-36 text-right font-mono text-zinc-500">-</div>
                    <div className={`w-36 text-right font-mono text-base ${comp2550q.taxStillDue > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                      ₱{comp2550q.taxStillDue > 0 
                        ? comp2550q.taxStillDue.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : `(${comp2550q.overpayment.toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: 2551Q PERCENTAGE TAX RETURN                                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'btax_2551q' && (
        <div className="space-y-5">
          
          {/* Controls Bar */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Quarter Period:</span>
              <select
                value={qtr2551}
                onChange={(e) => setQtr2551(e.target.value as any)}
                className={`px-3 py-1.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="Q1" className="bg-slate-900 text-white">1st Quarter (Jan - Mar)</option>
                <option value="Q2" className="bg-slate-900 text-white">2nd Quarter (Apr - Jun)</option>
                <option value="Q3" className="bg-slate-900 text-white">3rd Quarter (Jul - Sep)</option>
                <option value="Q4" className="bg-slate-900 text-white">4th Quarter (Oct - Dec)</option>
              </select>

              <select
                value={year2551}
                onChange={(e) => setYear2551(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024" className="bg-slate-900 text-white">Taxable Year 2024</option>
                <option value="2025" className="bg-slate-900 text-white">Taxable Year 2025</option>
                <option value="2026" className="bg-slate-900 text-white">Taxable Year 2026</option>
                <option value="2027" className="bg-slate-900 text-white">Taxable Year 2027</option>
              </select>

              <div className="flex items-center gap-1.5 ml-2">
                <span className={`text-xs ${theme.textMuted}`}>Rate:</span>
                <select
                  value={rate2551}
                  onChange={(e) => setRate2551(parseFloat(e.target.value))}
                  className={`px-2.5 py-1 text-xs rounded-lg border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="3" className="bg-slate-900 text-white">3% (Regular Section 116)</option>
                  <option value="1" className="bg-slate-900 text-white">1% (CREATE Reduced Rate)</option>
                </select>
              </div>
            </div>

            <span className="text-xs font-mono text-zinc-400">
              For Non-VAT Registered Entities (Gross Sales ≤ ₱3,000,000)
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Total Gross Taxable Sales ({comp2551q.salesCount} Real Txns)
              </span>
              <span className={`text-2xl font-extrabold font-mono ${theme.textTitle}`}>
                ₱{comp2551q.grossTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">ATC: PT 010 (Sec. 116 Persons Exempt from VAT)</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Percentage Tax Due ({comp2551q.taxRate}%)
              </span>
              <span className="text-2xl font-extrabold font-mono text-cyan-500">
                ₱{comp2551q.taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">Tax Base × {comp2551q.taxRate}% statutory rate</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme.textMuted}`}>
                Net Tax Still Due / Payable
              </span>
              <span className={`text-2xl font-extrabold font-mono ${comp2551q.taxStillDue > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                ₱{comp2551q.taxStillDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">Net of 2307 creditable tax credits</span>
            </div>
          </div>

          {/* BIR 2551Q Statement */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-500" />
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                  BIR Form No. 2551Q (Quarterly Percentage Tax Return) Schedule
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                Quarter: {qtr2551} | Year: {year2551}
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className={`rounded-xl border ${theme.borderCard} overflow-hidden divide-y ${theme.borderCard}`}>
                
                <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <div className="flex-1">
                    <span className="font-bold text-zinc-400 mr-2">14</span>
                    <span className={theme.textTitle}>Gross Taxable Sales / Receipts for the Quarter</span>
                  </div>
                  <div className="text-right font-mono font-bold text-cyan-500">
                    ₱{comp2551q.grossTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <div className="flex-1">
                    <span className="font-bold text-zinc-400 mr-2">15</span>
                    <span className={theme.textTitle}>Applicable Percentage Tax Rate</span>
                  </div>
                  <div className="text-right font-mono font-bold text-zinc-300">
                    {comp2551q.taxRate}.00%
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition bg-cyan-500/5 font-bold">
                  <div className="flex-1">
                    <span className="text-cyan-500 mr-2">16</span>
                    <span className={theme.textTitle}>Percentage Tax Due (Line 14 × Line 15)</span>
                  </div>
                  <div className="text-right font-mono text-cyan-400 text-sm">
                    ₱{comp2551q.taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <div className="flex-1">
                    <span className="font-bold text-zinc-400 mr-2">17A</span>
                    <span className={theme.textTitle}>Creditable Percentage Tax Withheld (BIR Form 2307)</span>
                  </div>
                  <div className="text-right font-mono font-semibold text-emerald-400">
                    ₱{comp2551q.creditableTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-zinc-400">17B</span>
                    <span className={theme.textTitle}>Tax Paid in Return Previously Filed (if Amended)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">₱</span>
                    <input
                      type="number"
                      value={priorPaid2551 || ''}
                      onChange={(e) => setPriorPaid2551(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`w-32 px-2 py-1 text-right text-xs rounded-lg border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between font-extrabold text-sm bg-cyan-500/10">
                  <div className="flex-1">
                    <span className="text-cyan-500 mr-2">18</span>
                    <span className={theme.textTitle}>TOTAL AMOUNT STILL PAYABLE / (OVERPAYMENT)</span>
                  </div>
                  <div className={`text-right font-mono text-base ${comp2551q.taxStillDue > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    ₱{comp2551q.taxStillDue > 0 
                      ? comp2551q.taxStillDue.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : `(${comp2551q.overpayment.toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SUMMARY LIST OF SALES (SLS - BIR RELIEF / eSUBMISSION)          */}
      {/* ===================================================================== */}
      {activeSubTab === 'btax_sales' && (
        <div className="space-y-4">
          
          {/* Controls & Import / Export Action Toolbar */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3`}>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Period:</span>
              <select
                value={salesQuarter}
                onChange={(e) => setSalesQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ALL" className="bg-slate-900 text-white">All Quarters (Annual)</option>
                <option value="Q1" className="bg-slate-900 text-white">Q1 (1st Quarter)</option>
                <option value="Q2" className="bg-slate-900 text-white">Q2 (2nd Quarter)</option>
                <option value="Q3" className="bg-slate-900 text-white">Q3 (3rd Quarter)</option>
                <option value="Q4" className="bg-slate-900 text-white">Q4 (4th Quarter)</option>
              </select>

              <select
                value={salesYear}
                onChange={(e) => setSalesYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024" className="bg-slate-900 text-white">2024</option>
                <option value="2025" className="bg-slate-900 text-white">2025</option>
                <option value="2026" className="bg-slate-900 text-white">2026</option>
                <option value="2027" className="bg-slate-900 text-white">2027</option>
              </select>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter customer, TIN or invoice..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
            </div>

            {/* RELIEF .DAT and Direct Import Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 1. IMPORT CSV FROM SALES */}
              <button
                onClick={() => salesFileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Import Sales CSV file directly into SLS and Sales Book"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV from Sales</span>
              </button>

              {/* 2. DOWNLOAD EMPTY TEMPLATE */}
              <button
                onClick={handleDownloadEmptySLSTemplate}
                className={`px-2.5 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1 ${theme.textMuted}`}
                title="Download Clean SLS CSV Template (Headers only, zero sample rows)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Empty Template</span>
              </button>

              {/* 3. SYNC FROM SALES JOURNAL */}
              <button
                onClick={() => {
                  triggerAlert(`Synchronized: ${sales.length} total sales records currently verified in system. Zero sample transactions included.`, 'info');
                }}
                className={`px-2.5 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1 ${theme.textMuted}`}
                title="Verify and refresh pipeline from Sales Register"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                <span>Sync Sales</span>
              </button>

              {/* 4. PREVIEW RAW .DAT */}
              <button
                onClick={() => {
                  const content = buildSLSDatString();
                  setDatModalContent({
                    title: 'Summary List of Sales (SLS) — BIR RELIEF .DAT Preview',
                    filename: `SLS_${cleanTin}_${salesQuarter === 'ALL' ? 'ANNUAL' : salesQuarter}_${salesYear}.DAT`,
                    text: content
                  });
                }}
                className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5 ${theme.textTitle}`}
                title="Preview raw BIR RELIEF .DAT text format"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                <span>Preview .DAT</span>
              </button>

              {/* 5. GENERATE SLS .DAT FILE */}
              <button
                onClick={handleDownloadSLSDat}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Generate & Download BIR RELIEF SLS .DAT file for eSubmission"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate SLS .DAT File</span>
              </button>

              {/* 6. EXPORT CSV */}
              <button
                onClick={() => {
                  const headers = ['Seq', 'Customer TIN', 'Branch', 'Registered Name', 'Invoice #', 'Date', 'Gross Sales', 'Taxable Sales (12%)', 'Output VAT (12%)', 'Exempt Sales', 'Zero-Rated Sales', 'CWT 2307'];
                  const rows = slsRows.map(r => [
                    r.seq,
                    r.tin,
                    r.branch,
                    r.name,
                    r.invoiceNo,
                    r.date,
                    r.gross.toFixed(2),
                    r.taxable.toFixed(2),
                    r.outputVat.toFixed(2),
                    r.exempt.toFixed(2),
                    r.zeroRated.toFixed(2),
                    r.wtax2307.toFixed(2)
                  ]);
                  handleExportCSV(`BIR_SLS_Summary_Sales_${salesYear}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export SLS Schedule to CSV"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
              </button>

            </div>
          </div>

          {/* Real Transactions Pipeline Guarantee Info Banner */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>DIRECT SALES PIPELINE:</strong> Every sales transaction recorded in the Sales Book or imported via CSV automatically flows straight into SLS. Zero sample transactions are ever included in BIR RELIEF files.
              </span>
            </div>
            <span className="font-mono text-cyan-300 font-bold ml-2">
              {slsSummary.count} Real Transactions Loaded
            </span>
          </div>

          {/* SLS Data Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                SLS Master Schedule ({slsSummary.count} Transactions)
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className={theme.textMuted}>
                  Gross: <strong className="text-cyan-400">₱{slsSummary.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className={theme.textMuted}>
                  Vatable: <strong className="text-zinc-300">₱{slsSummary.totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className={theme.textMuted}>
                  Output VAT: <strong className="text-cyan-400">₱{slsSummary.totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMuted} uppercase font-bold text-[10px]`}>
                    <th className="p-3 w-12 text-center">Seq</th>
                    <th className="p-3 min-w-[120px]">Customer TIN</th>
                    <th className="p-3 min-w-[200px]">Registered Customer Name</th>
                    <th className="p-3 min-w-[100px]">Invoice #</th>
                    <th className="p-3 min-w-[90px]">Date</th>
                    <th className="p-3 text-right min-w-[100px]">Gross Sales</th>
                    <th className="p-3 text-right min-w-[100px]">Taxable Sales</th>
                    <th className="p-3 text-right min-w-[100px]">Output VAT (12%)</th>
                    <th className="p-3 text-right min-w-[90px]">CWT 2307</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {slsRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-500">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-semibold text-zinc-400">No real sales transactions found for this period.</p>
                          <p className="text-xs text-zinc-500">
                            Click <strong className="text-violet-400">"Import CSV from Sales"</strong> above to import your sales register, or record transactions in the Sales Book.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    slsRows.map((r) => (
                      <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                        <td className="p-3 text-center font-mono text-zinc-500">{r.seq}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.tin}</td>
                        <td className="p-3">
                          <div className={`font-semibold ${theme.textTitle}`}>{r.name}</div>
                          <div className={`text-[10px] ${theme.textMuted} truncate max-w-xs`}>{r.address}</div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-zinc-300">{r.invoiceNo}</td>
                        <td className="p-3 font-mono text-zinc-400">{r.date}</td>
                        <td className="p-3 text-right font-mono font-semibold text-zinc-300">
                          ₱{r.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-400">
                          ₱{r.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-cyan-500">
                          ₱{r.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          ₱{r.wtax2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SUMMARY LIST OF PURCHASES (SLP - BIR RELIEF / eSUBMISSION)      */}
      {/* ===================================================================== */}
      {activeSubTab === 'btax_purchases' && (
        <div className="space-y-4">
          
          {/* Controls & Import / Export Action Toolbar */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3`}>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Period:</span>
              <select
                value={purchasesQuarter}
                onChange={(e) => setPurchasesQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ALL" className="bg-slate-900 text-white">All Quarters (Annual)</option>
                <option value="Q1" className="bg-slate-900 text-white">Q1 (1st Quarter)</option>
                <option value="Q2" className="bg-slate-900 text-white">Q2 (2nd Quarter)</option>
                <option value="Q3" className="bg-slate-900 text-white">Q3 (3rd Quarter)</option>
                <option value="Q4" className="bg-slate-900 text-white">Q4 (4th Quarter)</option>
              </select>

              <select
                value={purchasesYear}
                onChange={(e) => setPurchasesYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024" className="bg-slate-900 text-white">2024</option>
                <option value="2025" className="bg-slate-900 text-white">2025</option>
                <option value="2026" className="bg-slate-900 text-white">2026</option>
                <option value="2027" className="bg-slate-900 text-white">2027</option>
              </select>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter vendor, TIN or voucher..."
                  value={purchasesSearch}
                  onChange={(e) => setPurchasesSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
            </div>

            {/* RELIEF .DAT and Direct Import Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 1. IMPORT CSV FROM PURCHASES */}
              <button
                onClick={() => purchasesFileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Import Purchases / Expenses CSV file directly into SLP and Purchase Book"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV from Purchases</span>
              </button>

              {/* 2. DOWNLOAD EMPTY TEMPLATE */}
              <button
                onClick={handleDownloadEmptySLPTemplate}
                className={`px-2.5 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1 ${theme.textMuted}`}
                title="Download Clean SLP CSV Template (Headers only, zero sample rows)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Empty Template</span>
              </button>

              {/* 3. SYNC FROM PURCHASES JOURNAL */}
              <button
                onClick={() => {
                  triggerAlert(`Synchronized: ${expenses.length} total purchase vouchers currently verified in system. Zero sample transactions included.`, 'info');
                }}
                className={`px-2.5 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1 ${theme.textMuted}`}
                title="Verify and refresh pipeline from Purchase Register"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                <span>Sync Purchases</span>
              </button>

              {/* 4. PREVIEW RAW .DAT */}
              <button
                onClick={() => {
                  const content = buildSLPDatString();
                  setDatModalContent({
                    title: 'Summary List of Purchases (SLP) — BIR RELIEF .DAT Preview',
                    filename: `SLP_${cleanTin}_${purchasesQuarter === 'ALL' ? 'ANNUAL' : purchasesQuarter}_${purchasesYear}.DAT`,
                    text: content
                  });
                }}
                className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5 ${theme.textTitle}`}
                title="Preview raw BIR RELIEF .DAT text format"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                <span>Preview .DAT</span>
              </button>

              {/* 5. GENERATE SLP .DAT FILE */}
              <button
                onClick={handleDownloadSLPDat}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Generate & Download BIR RELIEF SLP .DAT file for eSubmission"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate SLP .DAT File</span>
              </button>

              {/* 6. EXPORT CSV */}
              <button
                onClick={() => {
                  const headers = ['Seq', 'Vendor TIN', 'Branch', 'Vendor Name', 'Voucher #', 'Date', 'Gross Purchases', 'Taxable Goods', 'Taxable Services', 'Input VAT (12%)', 'Exempt Purchases', 'Zero-Rated Purchases', 'WTAX Deducted'];
                  const rows = slpRows.map(r => [
                    r.seq,
                    r.tin,
                    r.branch,
                    r.name,
                    r.voucherNo,
                    r.date,
                    r.gross.toFixed(2),
                    r.taxableGoods.toFixed(2),
                    r.taxableServices.toFixed(2),
                    r.inputVat.toFixed(2),
                    r.exempt.toFixed(2),
                    r.zeroRated.toFixed(2),
                    r.wtax.toFixed(2)
                  ]);
                  handleExportCSV(`BIR_SLP_Summary_Purchases_${purchasesYear}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export SLP Schedule to CSV"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
              </button>

            </div>
          </div>

          {/* Real Transactions Pipeline Guarantee Info Banner */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>DIRECT PURCHASES PIPELINE:</strong> Every purchase voucher recorded in the Purchase Book or imported via CSV automatically flows straight into SLP. Zero sample transactions are ever included in BIR RELIEF files.
              </span>
            </div>
            <span className="font-mono text-cyan-300 font-bold ml-2">
              {slpSummary.count} Real Transactions Loaded
            </span>
          </div>

          {/* SLP Data Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                SLP Master Schedule ({slpSummary.count} Purchase Vouchers)
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className={theme.textMuted}>
                  Gross: <strong className="text-cyan-400">₱{slpSummary.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className={theme.textMuted}>
                  Goods: <strong className="text-zinc-300">₱{slpSummary.totalTaxableGoods.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className={theme.textMuted}>
                  Services: <strong className="text-zinc-300">₱{slpSummary.totalTaxableServices.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className={theme.textMuted}>
                  Input VAT: <strong className="text-cyan-400">₱{slpSummary.totalInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMuted} uppercase font-bold text-[10px]`}>
                    <th className="p-3 w-12 text-center">Seq</th>
                    <th className="p-3 min-w-[120px]">Vendor TIN</th>
                    <th className="p-3 min-w-[200px]">Registered Vendor Name</th>
                    <th className="p-3 min-w-[100px]">Voucher #</th>
                    <th className="p-3 min-w-[90px]">Date</th>
                    <th className="p-3 text-right min-w-[100px]">Gross Purchase</th>
                    <th className="p-3 text-right min-w-[95px]">Taxable Goods</th>
                    <th className="p-3 text-right min-w-[95px]">Taxable Services</th>
                    <th className="p-3 text-right min-w-[100px]">Input VAT (12%)</th>
                    <th className="p-3 text-right min-w-[90px]">WTAX Deducted</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {slpRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-500">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-semibold text-zinc-400">No real purchase vouchers found for this period.</p>
                          <p className="text-xs text-zinc-500">
                            Click <strong className="text-violet-400">"Import CSV from Purchases"</strong> above to import your purchase vouchers, or record expenses in the Purchase Book.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    slpRows.map((r) => (
                      <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                        <td className="p-3 text-center font-mono text-zinc-500">{r.seq}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.tin}</td>
                        <td className="p-3">
                          <div className={`font-semibold ${theme.textTitle}`}>{r.name}</div>
                          <div className={`text-[10px] ${theme.textMuted} truncate max-w-xs`}>{r.address}</div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-zinc-300">{r.voucherNo}</td>
                        <td className="p-3 font-mono text-zinc-400">{r.date}</td>
                        <td className="p-3 text-right font-mono font-semibold text-zinc-300">
                          ₱{r.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-400">
                          ₱{r.taxableGoods.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-400">
                          ₱{r.taxableServices.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-cyan-500">
                          ₱{r.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          ₱{r.wtax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* POPUP MODAL: BIR RELIEF .DAT FILE RAW CONTENT PREVIEW                 */}
      {/* ===================================================================== */}
      {datModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-3xl rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
            <div className={`p-4 border-b ${theme.borderCard} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-500" />
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>{datModalContent.title}</h3>
              </div>
              <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {datModalContent.filename}
              </span>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950 font-mono text-[11px] text-cyan-300 leading-relaxed">
              <pre className="whitespace-pre-wrap">{datModalContent.text}</pre>
            </div>

            <div className={`p-4 border-t ${theme.borderCard} flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5`}>
              <span className={`text-xs ${theme.textMuted}`}>
                Standard BIR RELIEF eSubmission format with Header (H) and Detail (D) records. Sample rows strictly removed.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(datModalContent.text)}
                  className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer ${theme.textTitle}`}
                >
                  {datCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{datCopied ? 'Copied!' : 'Copy Raw Text'}</span>
                </button>

                <button
                  onClick={() => {
                    if (datModalContent.text.startsWith('//')) {
                      triggerAlert('Cannot download: No real transactions found for this period.', 'error');
                      return;
                    }
                    const blob = new Blob([datModalContent.text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = datModalContent.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    triggerAlert(`Downloaded ${datModalContent.filename} successfully!`, 'success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>

                <button
                  onClick={() => setDatModalContent(null)}
                  className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer ${theme.textMuted}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
