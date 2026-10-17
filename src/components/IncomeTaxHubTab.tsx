import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  ShieldCheck, 
  FileCheck2, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Building2,
  Calendar,
  Scale,
  DollarSign,
  Search,
  BookOpen,
  CalendarClock
} from 'lucide-react';
import AnnualTaxRegimesModal from './AnnualTaxRegimesModal';
import StatutoryTaxLawInspectorModal from './StatutoryTaxLawInspectorModal';
import { 
  getEntityTaxProfileForYear, 
  getAvailableTaxYears 
} from '../utils/taxProfiles';
import { 
  getStatutoryTaxRule, 
  computeGraduatedIndividualTax, 
  computeCorporateTaxRates,
  getTaxpayerClassification 
} from '../utils/statutoryTaxEngine';
import BIR2307CertificateView from './BIR2307CertificateView';
import BookToTaxSchedule from './BookToTaxSchedule';
import {
  normalizeTransactions,
  latestPeriod,
  buildCertificates,
  buildSAWT,
  creditableForITR,
  isWithinItrPeriod,
  ItrPeriod,
  Cert2307
} from '../utils/cwt2307';
import { 
  Company, 
  Sale, 
  Expense, 
  PPEAsset, 
  SpecialEntry, 
  IncomeTaxRecord, 
  AccountTitle 
} from '../types';

export type IncomeTaxSubTab = 
  | 'itax_1701' 
  | 'itax_1702rt' 
  | 'itax_1702ex' 
  | 'itax_sawt'
  | 'itax_book_to_tax';

/**
 * Individuals strictly means: Sole Proprietor and Professionals only.
 * Other than that are Non-Individuals (Corporations, Partnerships, Cooperatives, OPC, Non-Profits, etc.)
 */
export function isIndividualEntity(entityType?: string): boolean {
  if (!entityType) return false;
  const t = entityType.toUpperCase().trim();
  return t.includes('SOLE') || t.includes('PROFESSIONAL') || t.includes('INDIVIDUAL');
}

interface IncomeTaxHubTabProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  incomeTaxRecords: IncomeTaxRecord[];
  setIncomeTaxRecords?: React.Dispatch<React.SetStateAction<IncomeTaxRecord[]>>;
  setSpecialEntries?: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  activeCompany: Company | null;
  setCompanies?: React.Dispatch<React.SetStateAction<Company[]>>;
  onUpdateCompany?: (updatedCompany: Company) => void;
  accountTitles?: AccountTitle[];
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: IncomeTaxSubTab;
}

export default function IncomeTaxHubTab({
  sales = [],
  expenses = [],
  ppeAssets = [],
  specialEntries = [],
  incomeTaxRecords = [],
  setIncomeTaxRecords,
  setSpecialEntries,
  activeCompany,
  setCompanies,
  onUpdateCompany,
  accountTitles = [],
  theme,
  triggerAlert,
  initialSubTab = 'itax_1701'
}: IncomeTaxHubTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<IncomeTaxSubTab>(initialSubTab);
  const [isTaxRegimesModalOpen, setIsTaxRegimesModalOpen] = useState(false);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const companyName = activeCompany?.company_name || 'No Active Entity';
  const companyTin = activeCompany?.company_tin || '000-000-000-00000';
  const branchCode = activeCompany?.tin_branch_code || '00000';
  const rawEntityType = activeCompany?.entity_type || 'CORPORATION';
  const isIndividual = isIndividualEntity(rawEntityType);

  // General period state
  const [taxYear, setTaxYear] = useState<string>(latestPeriod([...sales, ...expenses], ['invoice_date', 'expense_date', 'date'])?.year || '2026');
  const [taxQuarter, setTaxQuarter] = useState<'ANNUAL' | 'Q1' | 'Q2' | 'Q3'>('ANNUAL');

  // Available chronological tax years (2018–2028 + transactions)
  const availableTaxYears = useMemo(() => {
    return getAvailableTaxYears(activeCompany, [...sales, ...expenses]);
  }, [activeCompany, sales, expenses]);

  // Current year statutory tax election profile
  const currentTaxProfile = useMemo(() => {
    return getEntityTaxProfileForYear(activeCompany, taxYear);
  }, [activeCompany, taxYear]);

  // Statutory Law Engine state & resolution
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const currentStatutoryRule = useMemo(() => {
    return getStatutoryTaxRule(taxYear);
  }, [taxYear]);

  // 1701 Individual State
  const [regime1701, setRegime1701] = useState<'GRADUATED' | 'EIGHT_PERCENT'>('GRADUATED');
  const [deduction1701, setDeduction1701] = useState<'ITEMIZED' | 'OSD_40'>('ITEMIZED');
  const [quarterlyPayments1701, setQuarterlyPayments1701] = useState<number>(0);

  // 1702RT Non-Individual State
  const [corpRate1702, setCorpRate1702] = useState<'RCIT_20' | 'RCIT_25'>('RCIT_20');
  const [deduction1702, setDeduction1702] = useState<'ITEMIZED' | 'OSD_40'>('ITEMIZED');
  const [quarterlyPayments1702, setQuarterlyPayments1702] = useState<number>(0);

  // Default regime / deduction method synced to the selected year's profile
  React.useEffect(() => {
    const profile = getEntityTaxProfileForYear(activeCompany, taxYear);
    setRegime1701(isIndividual && profile.income_tax_type === 'EIGHT_PERCENT' ? 'EIGHT_PERCENT' : 'GRADUATED');
    setDeduction1701(profile.expense_deduction_type === 'OSD_40' ? 'OSD_40' : 'ITEMIZED');
    setDeduction1702(profile.expense_deduction_type === 'OSD_40' ? 'OSD_40' : 'ITEMIZED');
  }, [activeCompany, taxYear, isIndividual]);

  // 1702EX Exempted Non-Individual State
  const [exemptionBasis, setExemptionBasis] = useState<string>('Sec. 30(E) - Non-stock, Non-profit Charitable Organization');
  const [rulingNumber, setRulingNumber] = useState<string>('BIR-RULING-2024-089');
  const [preferentialTaxRate, setPreferentialTaxRate] = useState<number>(0); // 0% standard or 5% special

  // SAWT State
  const [sawtQuarter, setSawtQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [sawtSearch, setSawtSearch] = useState<string>('');

  // SHARED ENGINE (sales side): sale with CWT -> normalized line -> BIR 2307 received -> ITR credit / SAWT
  const receivedTxns = useMemo(
    () => normalizeTransactions(sales, 'received', { exclude: isSampleTransaction }),
    [sales]
  );
  const itrPeriod: ItrPeriod = taxQuarter as ItrPeriod;
  const itrCredit = useMemo(() => creditableForITR(receivedTxns, taxYear, itrPeriod), [receivedTxns, taxYear, itrPeriod]);

  /* ========================================================================= */
  /* COMMON FINANCIAL BASE COMPUTATION                                         */
  /* ========================================================================= */
  const booksData = useMemo(() => {
    // Income and expenses are cut off at the same ITR period as the 2307 credits
    // (quarterly ITR = year-to-date up to the quarter end; annual ITR = whole year).
    const salesP = sales.filter(s => isWithinItrPeriod(s.invoice_date || (s as any).date || (s as any).issue_date, taxYear, itrPeriod));
    const expP = expenses.filter(e => isWithinItrPeriod(e.expense_date || (e as any).date || (e as any).issue_date, taxYear, itrPeriod));

    // Gross sales revenue (vatable + zero rated + vat exempt)
    let grossSales = salesP.reduce((sum, s) => {
      const vatable = Number((s as any).vatable_amount ?? (s as any).vatable_sales) || 0;
      const zero = Number((s as any).zero_rated_amount ?? (s as any).zero_rated) || 0;
      const exempt = Number((s as any).vat_exempt_amount ?? (s as any).vat_exempt) || 0;
      const gross = vatable + zero + exempt;
      if (gross > 0) return sum + gross;
      const fallbackGross = Number(s.invoice_amount ?? (s as any).total_amount_vat_inclusive ?? (s as any).amount) || 0;
      const isVat = s.nonvat_or_vat === 'VAT' || (s as any).vat_or_nonvat === 'VAT';
      return sum + (isVat && fallbackGross > 0 ? Math.round((fallbackGross / 1.12) * 100) / 100 : fallbackGross);
    }, 0);
    
    // Total itemized expenses
    let itemizedExpenses = expP.reduce((sum, e) => {
      const vatable = Number((e as any).vatable_amount ?? (e as any).vatable_expense ?? (e as any).vatable_purchases) || 0;
      const zero = Number((e as any).zero_rated_amount ?? (e as any).zero_rated) || 0;
      const exempt = Number((e as any).vat_exempt_amount ?? (e as any).vat_exempt) || 0;
      const gross = vatable + zero + exempt;
      if (gross > 0) return sum + gross;
      const fallbackGross = Number(e.expense_invoice_amount ?? (e as any).total_amount_vat_inclusive ?? (e as any).amount) || 0;
      const isVat = (e as any).vat_or_nonvat === 'VAT' || (e as any).vat_status === 'VAT';
      return sum + (isVat && fallbackGross > 0 ? Math.round((fallbackGross / 1.12) * 100) / 100 : fallbackGross);
    }, 0);

    // PPE Depreciation
    const ppeDepreciation = ppeAssets.reduce((sum, a) => sum + (Number(a.accumulated_depreciation) || 0), 0);
    itemizedExpenses += ppeDepreciation;

    // Adjust for Special Entries (excluding existing 7010 income tax expense)
    specialEntries.forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.account_code.startsWith('4')) {
          if (l.type === 'Credit') grossSales += amt;
          else grossSales -= amt;
        } else if ((l.account_code.startsWith('5') || l.account_code.startsWith('6')) && l.account_code !== '7010') {
          if (l.type === 'Debit') itemizedExpenses += amt;
          else itemizedExpenses -= amt;
        }
      });
    });

    // Creditable Withholding Tax (2307)
    // = Σ BIR 2307 received (Q1..Qn cumulative; annual = Q1..Q4), same lines as the SAWT
    const creditable2307 = itrCredit.cumulative;

    // Cost of Sales (strictly from actual cost of goods / purchases expenses)
    const costOfSales = expP
      .filter(e => {
        const cat = ((e.expense_category || (e as any).category || (e as any).expense_type || (e as any).particulars || '') + '').toLowerCase();
        const desc = ((e.description || (e as any).particulars || '') + '').toLowerCase();
        return cat.includes('cost') || cat.includes('cogs') || cat.includes('merchandise') || desc.includes('purchases') || desc.includes('cost of');
      })
      .reduce((sum, e) => sum + (Number((e as any).vatable_amount ?? (e as any).vatable_expense ?? e.expense_invoice_amount ?? (e as any).amount) || 0), 0);

    const grossProfit = Math.max(0, grossSales - costOfSales);
    const operatingExpenses = Math.max(0, itemizedExpenses - costOfSales);

    return {
      grossSales,
      costOfSales,
      grossProfit,
      operatingExpenses,
      itemizedExpenses,
      ppeDepreciation,
      creditable2307
    };
  }, [sales, expenses, ppeAssets, specialEntries, taxYear, itrPeriod, itrCredit]);

  // Ease of Paying Taxes (EOPT) Act Taxpayer Classification (Micro, Small, Medium, Large)
  const taxpayerClassification = useMemo(() => {
    return getTaxpayerClassification(booksData.grossSales, taxYear);
  }, [booksData.grossSales, taxYear]);

  /* ========================================================================= */
  /* TAB 1: 1701 [FOR INDIVIDUALS] CALCULATIONS                                */
  /* ========================================================================= */
  const comp1701 = useMemo(() => {
    const { grossSales, itemizedExpenses, creditable2307 } = booksData;

    let allowableDeductions = 0;
    let netTaxableIncome = 0;
    let taxDue = 0;

    if (regime1701 === 'EIGHT_PERCENT') {
      // 8% Flat Tax on gross sales in excess of 250,000 (if pure business income)
      allowableDeductions = currentTaxProfile.allow_250k_exemption !== false ? 250000 : 0;
      netTaxableIncome = Math.max(0, grossSales - allowableDeductions);
      taxDue = netTaxableIncome * 0.08;
    } else {
      // Graduated Table
      if (deduction1701 === 'OSD_40') {
        allowableDeductions = grossSales * 0.40;
      } else {
        allowableDeductions = itemizedExpenses;
      }
      netTaxableIncome = Math.max(0, grossSales - allowableDeductions);

      // Statutory date-based calculation for graduated brackets (Pre-TRAIN, TRAIN 2018-2022, 2023+ TRAIN/CREATE/EOPT)
      const gradResult = computeGraduatedIndividualTax(netTaxableIncome, taxYear);
      taxDue = gradResult.taxDue;
    }

    const totalCredits = creditable2307 + quarterlyPayments1701;
    const netTaxPayable = Math.max(0, taxDue - totalCredits);
    const overpayment = Math.max(0, totalCredits - taxDue);

    return {
      grossSales,
      allowableDeductions,
      netTaxableIncome,
      taxDue,
      creditable2307,
      totalCredits,
      netTaxPayable,
      overpayment
    };
  }, [booksData, regime1701, deduction1701, quarterlyPayments1701, currentTaxProfile, taxYear]);

  /* ========================================================================= */
  /* TAB 2: 1702RT [FOR NON INDIVIDUALS] CALCULATIONS                          */
  /* ========================================================================= */
  const comp1702rt = useMemo(() => {
    const { grossSales, grossProfit, itemizedExpenses, creditable2307 } = booksData;

    let allowableDeductions = 0;
    if (deduction1702 === 'OSD_40') {
      allowableDeductions = grossProfit * 0.40;
    } else {
      allowableDeductions = itemizedExpenses;
    }

    const netTaxableIncome = Math.max(0, grossSales - allowableDeductions);

    // Statutory date-based corporate tax rates for the selected year
    const corpRates = computeCorporateTaxRates(taxYear);
    const rcitRate = corpRate1702 === 'RCIT_20' ? corpRates.rcitMsmeRate : corpRates.rcitRegularRate;
    const rcitAmount = netTaxableIncome * rcitRate;

    // MCIT: Evaluated from statutory rule (1% for CREATE relief period 2020.07-2023.06, 2% standard)
    const mcitAmount = grossProfit * corpRates.mcitRate;

    // Higher of RCIT or MCIT
    const taxDue = Math.max(rcitAmount, mcitAmount);
    const isMcitApplied = mcitAmount > rcitAmount && grossProfit > 0;

    const totalCredits = creditable2307 + quarterlyPayments1702;
    const netTaxPayable = Math.max(0, taxDue - totalCredits);
    const overpayment = Math.max(0, totalCredits - taxDue);

    return {
      grossSales,
      grossProfit,
      allowableDeductions,
      netTaxableIncome,
      rcitAmount,
      rcitRate: `${(rcitRate * 100).toFixed(0)}%`,
      mcitAmount,
      mcitRate: `${(corpRates.mcitRate * 100).toFixed(0)}%`,
      taxDue,
      isMcitApplied,
      creditable2307,
      totalCredits,
      netTaxPayable,
      overpayment,
      statutoryRule: corpRates.statutoryRule
    };
  }, [booksData, corpRate1702, deduction1702, quarterlyPayments1702, taxYear]);

  /* ========================================================================= */
  /* TAB 3: 1702EX [FOR EXEMPTED NON INDIVIDUALS] CALCULATIONS                 */
  /* ========================================================================= */
  const comp1702ex = useMemo(() => {
    const { grossSales, itemizedExpenses } = booksData;
    const directCosts = Math.round(grossSales * 0.45 * 100) / 100;
    const operatingExpenses = Math.max(0, itemizedExpenses - directCosts);
    const totalExpenses = directCosts + operatingExpenses;
    const netIncome = grossSales - totalExpenses;

    const taxDue = preferentialTaxRate > 0 ? (grossSales * preferentialTaxRate) / 100 : 0.00;

    return {
      grossSales,
      directCosts,
      operatingExpenses,
      totalExpenses,
      netIncome,
      taxDue
    };
  }, [booksData, preferentialTaxRate]);

function isSampleTransaction(record: any): boolean {
  if (!record) return true;
  if (record.is_sample === true || record.isSample === true) return true;
  if (Number(record.id) > 100000 || record.created_at) return false;
  const name = String(record.customer_name || record.registered_name || record.client_name || record.name || '').toLowerCase().trim();
  if (name === 'customer / client' || name === 'sample customer') return true;
  return false;
}

  /* ========================================================================= */
  /* TAB 4: SAWT [ATTACHMENT TO ITR] DATA                                      */
  /* ========================================================================= */
  // SAWT = one row per payor per ATC from the BIR 2307 certificates received (same period as the ITR)
  const sawtData = useMemo(() => buildSAWT(receivedTxns, taxYear, itrPeriod), [receivedTxns, taxYear, itrPeriod]);

  const sawtRows = useMemo(() => {
    return sawtData.rows
      .map(r => ({
        seq: r.seq,
        tin: r.tin,
        branch: r.branch,
        name: r.name,
        atc: r.atc,
        atcDerived: r.atcDerived,
        nature: r.nature,
        ratePct: `${r.ratePct}%`,
        incomeBase: r.incomePayment,
        taxWithheld: r.taxWithheld,
        certCount: r.certNos.length
      }))
      .filter(r => {
        if (!sawtSearch) return true;
        const q = sawtSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tin.includes(q) || r.atc.toLowerCase().includes(q);
      });
  }, [sawtData, sawtSearch]);

  // Received BIR 2307 certificates behind the SAWT (one per payor per quarter)
  const receivedCerts = useMemo(() => {
    const qs = itrPeriod === 'ANNUAL' ? [1, 2, 3, 4] : [parseInt(itrPeriod.replace(/\D/g, ''), 10)];
    return qs.flatMap(q => buildCertificates(receivedTxns, taxYear, q));
  }, [receivedTxns, taxYear, itrPeriod]);
  const [viewCert, setViewCert] = useState<Cert2307 | null>(null);

  const sawtSummary = useMemo(() => {
    const totalBase = sawtRows.reduce((sum, r) => sum + r.incomeBase, 0);
    const totalWithheld = sawtRows.reduce((sum, r) => sum + r.taxWithheld, 0);
    return {
      totalBase,
      totalWithheld,
      count: sawtRows.length
    };
  }, [sawtRows]);

  const handleDownloadSAWTDat = () => {
    const validRows = sawtRows;
    if (validRows.length === 0) {
      triggerAlert(`Cannot generate SAWT .DAT: No real creditable withholding tax (BIR Form 2307) transactions found for ${taxYear}. Sample or dummy data is prohibited in BIR files.`, 'error');
      return;
    }
    const cleanTin = (companyTin || '').replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
    const header = `HSAWT,${cleanTin},${branchCode},"${companyName}",${taxYear},${taxQuarter === 'ANNUAL' ? '13' : taxQuarter}\n`;
    const details = validRows.map((r) => {
      const cleanPayorTin = (r.tin || '').replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
      return `DSAWT,${r.seq},${cleanPayorTin},${r.branch},"${r.name}",${r.atc},${r.incomeBase.toFixed(2)},${r.taxWithheld.toFixed(2)}`;
    }).join('\n');
    const totalBase = validRows.reduce((sum, r) => sum + r.incomeBase, 0);
    const totalWithheld = validRows.reduce((sum, r) => sum + r.taxWithheld, 0);
    const trailer = `\nTSAWT,${validRows.length},${totalBase.toFixed(2)},${totalWithheld.toFixed(2)}\n`;
    const content = header + details + trailer;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAWT_${cleanTin}_${taxYear}.DAT`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAlert(`Downloaded BIR Summary Alphalist of Withholding Tax (SAWT .DAT file) for ${taxYear}!`, 'success');
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

  const handlePostJournalEntry1702 = () => {
    if (!setSpecialEntries) {
      triggerAlert('Cannot post special entries in this view.', 'error');
      return;
    }
    const taxAmt = comp1702rt.netTaxPayable;
    if (taxAmt <= 0) {
      triggerAlert('No income tax payable to post (Tax Due is ₱0.00).', 'info');
      return;
    }

    const newEntry: SpecialEntry = {
      id: Date.now(),
      entry_date: new Date().toISOString().split('T')[0],
      entry_number: `AJE-ITAX-${taxYear}`,
      entry_type: 'Adjusting Entry',
      description: `Provision for Income Tax Expense (Form 1702-RT ${taxYear})`,
      company_name: companyName,
      lines: [
        {
          id: 1,
          account_code: '7010',
          account_title: 'Income Tax Expense',
          amount: taxAmt,
          type: 'Debit'
        },
        {
          id: 2,
          account_code: '2030',
          account_title: 'Income Tax Payable',
          amount: taxAmt,
          type: 'Credit'
        }
      ]
    };

    setSpecialEntries(prev => [...prev, newEntry]);
    triggerAlert(`Posted Adjusting Entry for Income Tax Provision: Dr. 7010 / Cr. 2030 (₱${taxAmt.toFixed(2)})!`, 'success');
  };

  return (
    <div className="space-y-5 select-none">
      
      {/* 1. CONTROLS BAR (REDUNDANT TITLE REMOVED PER REQ 4) */}
      <div className={`p-2.5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors duration-200`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
            isIndividual 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
          }`}>
            {isIndividual ? 'INDIVIDUAL (Sole Proprietor / Professional)' : `NON-INDIVIDUAL (${rawEntityType})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className={`px-3 py-1.5 rounded-xl border ${theme.borderCard} text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${theme.textTitle}`}
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTION BAR (4 EXACT REQUIRED TABS) */}
      <div className={`p-1.5 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs flex flex-wrap gap-1.5 transition-colors duration-200`}>
        <button
          onClick={() => setActiveSubTab('itax_1701')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'itax_1701'
              ? 'bg-violet-600 text-white shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1701[for individuals]</span>
          {isIndividual && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Entity is an Individual" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('itax_1702rt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'itax_1702rt'
              ? 'bg-violet-600 text-white shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1702RT[for non individuals]</span>
          {!isIndividual && (
            <span className="w-2 h-2 rounded-full bg-blue-400" title="Active Entity is a Non-Individual" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('itax_1702ex')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'itax_1702ex'
              ? 'bg-violet-600 text-white shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>1702EX[for exempted non individuals]</span>
        </button>

        <button
          onClick={() => setActiveSubTab('itax_sawt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'itax_sawt'
              ? 'bg-violet-600 text-white shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>SAWT[attachment to ITR]</span>
        </button>

        <button
          onClick={() => setActiveSubTab('itax_book_to_tax')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'itax_book_to_tax'
              ? 'bg-violet-600 text-white shadow-sm'
              : `${theme.textMuted} hover:${theme.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
          }`}
        >
          <Scale className="w-4 h-4 text-purple-400" />
          <span>Book-to-Tax Reconciliation</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Sch 4 / Part VI</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: 1701 [FOR INDIVIDUALS] (SOLE PROPRIETOR & PROFESSIONALS) */}
      {/* ===================================================================== */}
      {activeSubTab === 'itax_1701' && (
        <div className="space-y-4">
          
          {/* Entity Warning/Guidance Callout */}
          {!isIndividual ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Tax Entity Notice:</strong> Form 1701 is strictly for <strong>Individuals (Sole Proprietorships and Professionals only)</strong>. Active entity <span className="underline font-bold font-mono">{companyName}</span> is registered as <span className="font-bold uppercase font-mono">{rawEntityType}</span> (Non-Individual). For corporate filing, please use <strong>1702RT[for non individuals]</strong> or <strong>1702EX</strong>. Individual simulation mode is active below for reference.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2.5 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Active Taxpayer <strong className="font-bold">{companyName}</strong> is an Individual ({rawEntityType}) eligible for BIR Form 1701.</span>
            </div>
          )}

          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Period:</span>
              <select
                value={taxQuarter}
                onChange={(e) => setTaxQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ANNUAL">Annual Form 1701</option>
                <option value="Q1">1st Quarter (1701Q)</option>
                <option value="Q2">2nd Quarter (1701Q)</option>
                <option value="Q3">3rd Quarter (1701Q)</option>
              </select>

              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                {availableTaxYears.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsTaxRegimesModalOpen(true)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Configure Annual Tax Elections for each Year"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Annual Regimes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStatutoryModalOpen(true)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="View Philippine Statutory Tax Law Rules & Timeline"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{currentStatutoryRule.shortName}</span>
              </button>

              <span className={`text-xs font-bold ml-2 ${theme.textTitle}`}>Tax Regime:</span>
              <select
                value={regime1701}
                onChange={(e) => setRegime1701(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="GRADUATED">Graduated Income Tax Table ({currentStatutoryRule.shortName})</option>
                <option value="EIGHT_PERCENT">Optional 8% Gross Income Tax (Exceeding ₱250k)</option>
              </select>

              {regime1701 === 'GRADUATED' && (
                <>
                  <span className={`text-xs font-bold ml-2 ${theme.textTitle}`}>Deductions:</span>
                  <select
                    value={deduction1701}
                    onChange={(e) => setDeduction1701(e.target.value as any)}
                    className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="ITEMIZED">Itemized Deductions (Actual Books Expenses)</option>
                    <option value="OSD_40">Optional Standard Deduction (40% of Gross)</option>
                  </select>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs ${theme.textMuted}`}>Prior Payments:</span>
              <input
                type="number"
                placeholder="0.00"
                value={quarterlyPayments1701 || ''}
                onChange={(e) => setQuarterlyPayments1701(Number(e.target.value) || 0)}
                className={`w-28 px-2.5 py-1.5 text-xs font-mono text-right rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>

          {/* ANNUAL STATUTORY TAX ELECTION & STATUTORY ERA BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs text-purple-200">
                    Tax Election for {taxYear}:{' '}
                    <span className="text-white font-mono">
                      {regime1701 === 'EIGHT_PERCENT' ? '8% Flat Gross Income Tax (Non-VAT)' : 'Graduated Income Tax Table'}
                    </span>
                    {' '}•{' '}
                    <span className="text-purple-300">
                      {regime1701 === 'EIGHT_PERCENT'
                        ? 'NIRC Sec. 24(A)(2)(b) — Exempt from 3% Percentage Tax (Form 2551Q)'
                        : deduction1701 === 'OSD_40'
                        ? '40% Optional Standard Deduction (OSD)'
                        : 'Itemized Deductions'}
                    </span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Multi-year isolation: Year {taxYear} calculates strictly under this election without mutating historical or future accounting.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaxRegimesModalOpen(true)}
                className="text-xs px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer whitespace-nowrap"
              >
                Configure Regimes
              </button>
            </div>

            <div className="p-3.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-300 tracking-wider">Governing Statutory Law:</span>
                <p className="text-xs font-bold text-white mt-0.5">{currentStatutoryRule.name}</p>
                <p className="text-[10px] text-zinc-400">{currentStatutoryRule.citation}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatutoryModalOpen(true)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-violet-500/40 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 font-bold transition cursor-pointer whitespace-nowrap"
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Business Revenue</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1701.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Total Receipts from Profession</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Allowable Deductions</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1701.allowableDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {regime1701 === 'EIGHT_PERCENT' ? '₱250k Statutory Exclusion' : deduction1701 === 'OSD_40' ? 'OSD 40% of Gross' : 'Itemized Business Expenses'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Income Tax Due</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1701.taxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {regime1701 === 'EIGHT_PERCENT' ? '8% Flat Rate' : 'TRAIN Graduated Tax'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border border-violet-500/30 ${theme.bgCard} shadow-xs bg-violet-500/5`}>
              <span className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider">Net Tax Payable (1701)</span>
              <p className="text-xl font-bold font-mono mt-1 text-violet-500">
                ₱{comp1701.netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-violet-500/80 mt-0.5 block">After 2307 Creditable Tax</span>
            </div>
          </div>

          {/* Form 1701 Schedule Representation */}
          <div className={`p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs space-y-3 font-mono text-xs`}>
            <div className="border-b pb-3 flex items-center justify-between font-sans">
              <div>
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                  BIR Form 1701 Summary Schedule (Individuals — Sole Proprietors & Professionals)
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Annual / Quarterly Return for Individuals Earning Income from Business & Profession
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20">
                {taxQuarter} {taxYear} FORM 1701
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 36: Gross Sales / Receipts from Business / Profession</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1701.grossSales.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 39: Allowable Deductions ({regime1701 === 'EIGHT_PERCENT' ? '8% Exemption Base' : deduction1701})</span>
              <span className="font-bold text-emerald-500">(₱{comp1701.allowableDeductions.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 40: Net Taxable Income</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1701.netTaxableIncome.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 41: Income Tax Due</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1701.taxDue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 42A: Less: Creditable Withholding Tax (BIR Form 2307 / SAWT, {taxQuarter})</span>
              <span className="font-bold text-emerald-500">(₱{comp1701.creditable2307.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV-A Item 42B: Less: Prior Quarter Payments (1701Q)</span>
              <span className="font-bold text-emerald-500">(₱{quarterlyPayments1701.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-2.5 text-sm font-bold bg-violet-500/10 px-3 rounded-xl border border-violet-500/20 mt-2">
              <span className="text-violet-500">Part IV-A Item 45: Net Tax Payable / (Overpayment)</span>
              <span className="text-violet-500">
                {comp1701.netTaxPayable > 0 
                  ? `₱${comp1701.netTaxPayable.toFixed(2)}` 
                  : `₱0.00 (Overpayment ₱${comp1701.overpayment.toFixed(2)})`}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: 1702RT [FOR NON INDIVIDUALS] (CORPORATIONS, PARTNERSHIPS) */}
      {/* ===================================================================== */}
      {activeSubTab === 'itax_1702rt' && (
        <div className="space-y-4">
          
          {/* Entity Status Indicator */}
          {isIndividual ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Tax Entity Notice:</strong> Form 1702-RT is for <strong>Non-Individuals (Corporations, Partnerships, etc.)</strong>. Active entity <span className="underline font-bold font-mono">{companyName}</span> is registered as an <strong>Individual ({rawEntityType})</strong>. For individual tax filing, please use <strong>1701[for individuals]</strong>. Non-individual simulation is shown below.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center gap-2.5 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Active Taxpayer <strong className="font-bold">{companyName}</strong> is a Non-Individual ({rawEntityType}) subject to BIR Form 1702-RT.</span>
            </div>
          )}

          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Period:</span>
              <select
                value={taxQuarter}
                onChange={(e) => setTaxQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ANNUAL">Annual Form 1702-RT</option>
                <option value="Q1">1st Quarter (1702Q)</option>
                <option value="Q2">2nd Quarter (1702Q)</option>
                <option value="Q3">3rd Quarter (1702Q)</option>
              </select>

              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                {availableTaxYears.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsTaxRegimesModalOpen(true)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Configure Annual Tax Elections for each Year"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Annual Regimes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStatutoryModalOpen(true)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="View Philippine Statutory Tax Law Rules & Timeline"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{currentStatutoryRule.shortName}</span>
              </button>

              <span className={`text-xs font-bold ml-2 ${theme.textTitle}`}>Corporate Tax Rate:</span>
              <select
                value={corpRate1702}
                onChange={(e) => setCorpRate1702(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="RCIT_20">RCIT {comp1702rt.statutoryRule ? `${(comp1702rt.statutoryRule.rcitRateMsme * 100).toFixed(0)}%` : '20%'} (MSME Domestic Corp: Net Income ≤ ₱5M, Assets ≤ ₱100M)</option>
                <option value="RCIT_25">RCIT {comp1702rt.statutoryRule ? `${(comp1702rt.statutoryRule.rcitRateRegular * 100).toFixed(0)}%` : '25%'} (Standard Regular Corporate Income Tax)</option>
              </select>

              <span className={`text-xs font-bold ml-2 ${theme.textTitle}`}>Deductions:</span>
              <select
                value={deduction1702}
                onChange={(e) => setDeduction1702(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ITEMIZED">Itemized Deductions (Actual Books Expenses)</option>
                <option value="OSD_40">Optional Standard Deduction (40% of Gross Profit)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePostJournalEntry1702}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Post Adjusting Entry to General Journal (Dr. 7010 / Cr. 2030)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Post Provision AJE</span>
              </button>
            </div>
          </div>

          {/* EOPT TAXPAYER CLASSIFICATION & STATUTORY ERA BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs text-blue-200">
                      EOPT Classification (RA 11976): <strong className="text-white font-mono">{taxpayerClassification.label}</strong>
                    </p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {taxpayerClassification.thresholdDesc}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Withholding Obligation:{' '}
                    <span className={taxpayerClassification.withholdingExemption ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                      {taxpayerClassification.withholdingExemption ? 'EXEMPT from Income Tax Withholding at Source (RR 4-2024)' : 'Standard Withholding Agent'}
                    </span>
                    {' '}• Civil Penalties:{' '}
                    <span className={taxpayerClassification.reducedPenalties ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                      {taxpayerClassification.reducedPenalties ? 'Reduced 10% Surcharge & 50% Interest Discount' : 'Standard 25%'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-300 tracking-wider">Governing Law ({taxYear}):</span>
                <p className="text-xs font-bold text-white mt-0.5">{currentStatutoryRule.name}</p>
                <p className="text-[10px] text-zinc-400">RCIT {(currentStatutoryRule.rcitRateRegular*100).toFixed(0)}% / MCIT {(currentStatutoryRule.mcitRate*100).toFixed(0)}%</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatutoryModalOpen(true)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-violet-500/40 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 font-bold transition cursor-pointer whitespace-nowrap"
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Corporate Revenue</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1702rt.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Gross Sales / Receipts</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>RCIT ({comp1702rt.rcitRate}) vs MCIT ({comp1702rt.mcitRate})</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1702rt.rcitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                MCIT: ₱{comp1702rt.mcitAmount.toFixed(2)} {comp1702rt.isMcitApplied ? '(Higher MCIT Applied!)' : '(RCIT Higher)'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Withholding Credits (2307)</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{comp1702rt.creditable2307.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Prepaid tax withheld by clients</span>
            </div>

            <div className={`p-4 rounded-2xl border border-violet-500/30 ${theme.bgCard} shadow-xs bg-violet-500/5`}>
              <span className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider">Net Tax Payable (1702-RT)</span>
              <p className="text-xl font-bold font-mono mt-1 text-violet-500">
                ₱{comp1702rt.netTaxPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-violet-500/80 mt-0.5 block">Balance Due for Remittance</span>
            </div>
          </div>

          {/* Form 1702-RT Schedule */}
          <div className={`p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs space-y-3 font-mono text-xs`}>
            <div className="border-b pb-3 flex items-center justify-between font-sans">
              <div>
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                  BIR Form 1702-RT — Corporate Income Tax Return (Regular Non-Individuals)
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Applicable to Corporations, Partnerships, Associations subject to Regular Income Tax
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20">
                {taxQuarter} {taxYear} FORM 1702-RT
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 27: Gross Sales / Receipts / Revenues / Fees</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.grossSales.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 28: Less: Cost of Sales / Services</span>
              <span className="font-bold text-emerald-500">(₱{booksData.costOfSales.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 29: Gross Income from Operation</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.grossProfit.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 30: Less: Allowable Deductions ({deduction1702})</span>
              <span className="font-bold text-emerald-500">(₱{comp1702rt.allowableDeductions.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 31: Net Taxable Income</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.netTaxableIncome.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 32: Regular Corporate Income Tax (RCIT {comp1702rt.rcitRate})</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.rcitAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 33: Minimum Corporate Income Tax (MCIT 2% on Gross Profit)</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.mcitAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 34: Income Tax Due (Higher of RCIT or MCIT)</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702rt.taxDue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 35A: Less: Creditable Withholding Tax (2307 / SAWT, {taxQuarter})</span>
              <span className="font-bold text-emerald-500">(₱{comp1702rt.creditable2307.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-2.5 text-sm font-bold bg-violet-500/10 px-3 rounded-xl border border-violet-500/20 mt-2">
              <span className="text-violet-500">Part IV Item 38: Net Tax Payable / (Overpayment)</span>
              <span className="text-violet-500">
                {comp1702rt.netTaxPayable > 0 
                  ? `₱${comp1702rt.netTaxPayable.toFixed(2)}` 
                  : `₱0.00 (Overpayment ₱${comp1702rt.overpayment.toFixed(2)})`}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 3: 1702EX [FOR EXEMPTED NON INDIVIDUALS]                  */}
      {/* ===================================================================== */}
      {activeSubTab === 'itax_1702ex' && (
        <div className="space-y-4">
          
          {/* Statutory Exemption Header Banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>BIR Form 1702-EX (Exempted Non-Individuals):</strong> For Non-Stock Non-Profit Corporations, Foundations, General Professional Partnerships (GPP), Cooperatives (RA 9520), and PEZA/BOI entities under Income Tax Holiday (ITH) exempt from income tax under Sec. 30 of the National Internal Revenue Code (NIRC).
            </div>
          </div>

          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} space-y-3`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Tax Exemption Statutory Basis *</label>
                <select
                  value={exemptionBasis}
                  onChange={(e) => setExemptionBasis(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value="Sec. 30(E) - Non-stock, Non-profit Charitable Organization">Sec. 30(E) - Non-stock, Non-profit Charitable Org</option>
                  <option value="Sec. 30(H) - Non-stock, Non-profit Educational Institution">Sec. 30(H) - Non-stock Educational Institution</option>
                  <option value="Sec. 26 - General Professional Partnership (GPP)">Sec. 26 - General Professional Partnership (GPP)</option>
                  <option value="RA 9520 - Cooperative Registered with CDA">RA 9520 - Cooperative Registered with CDA</option>
                  <option value="PEZA RA 7916 - Ecozone Enterprise under Tax Holiday">PEZA RA 7916 - Ecozone Enterprise (5% GIT / ITH)</option>
                  <option value="Sec. 30(G) - Civic League or Social Welfare Org">Sec. 30(G) - Civic League / Social Welfare Org</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>BIR Ruling / Exemption Certificate Ref #</label>
                <input
                  type="text"
                  value={rulingNumber}
                  onChange={(e) => setRulingNumber(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${theme.textMuted}`}>Preferential Tax Rate (if any)</label>
                <select
                  value={preferentialTaxRate}
                  onChange={(e) => setPreferentialTaxRate(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                >
                  <option value={0}>0% — 100% Tax-Exempt (Sec. 30 / CDA)</option>
                  <option value={5}>5% Special Gross Income Tax (PEZA GIT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Receipts / Donations</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1702ex.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Total Revenues & Grants</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Operating & Program Costs</span>
              <p className={`text-lg font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{comp1702ex.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Actual operating expenses</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Excess of Revenue over Expense</span>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-500">
                ₱{comp1702ex.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Exempt Net Surplus</span>
            </div>

            <div className={`p-4 rounded-2xl border border-emerald-500/30 ${theme.bgCard} shadow-xs bg-emerald-500/5`}>
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Income Tax Due (1702-EX)</span>
              <p className="text-xl font-bold font-mono mt-1 text-emerald-500">
                ₱{comp1702ex.taxDue.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-500/80 mt-0.5 block">
                {preferentialTaxRate === 0 ? '100% Tax Exempt (₱0.00)' : `Preferential ${preferentialTaxRate}% Rate`}
              </span>
            </div>
          </div>

          {/* Form 1702-EX Schedule */}
          <div className={`p-6 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs space-y-3 font-mono text-xs`}>
            <div className="border-b pb-3 flex items-center justify-between font-sans">
              <div>
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>
                  BIR Form 1702-EX Schedule — Annual Return for Exempted Non-Individuals
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Legal Exemption Basis: <strong className="text-emerald-500">{exemptionBasis}</strong>
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                EXEMPT RETURN {taxYear}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 27: Gross Revenues / Receipts / Membership Dues / Donations</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702ex.grossSales.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 28: Less: Direct Operating & Program Costs</span>
              <span className="font-bold text-emerald-500">(₱{comp1702ex.directCosts.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 29: Less: Administrative & General Expenses</span>
              <span className="font-bold text-emerald-500">(₱{comp1702ex.operatingExpenses.toFixed(2)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-zinc-700/20">
              <span className={theme.textMuted}>Part IV Item 30: Net Excess of Revenues over Expenses</span>
              <span className={`font-bold ${theme.textTitle}`}>₱{comp1702ex.netIncome.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2.5 text-sm font-bold bg-emerald-500/10 px-3 rounded-xl border border-emerald-500/20 mt-2">
              <span className="text-emerald-500">Part IV Item 34: Total Income Tax Due (EXEMPT)</span>
              <span className="text-emerald-500">₱{comp1702ex.taxDue.toFixed(2)}</span>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 4: SAWT [ATTACHMENT TO ITR]                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'itax_sawt' && viewCert && (
        <BIR2307CertificateView
          certNo={viewCert.certNo}
          periodFrom={viewCert.periodFrom}
          periodTo={viewCert.periodTo}
          payeeTin={companyTin}
          payeeName={companyName}
          payeeAddress={(activeCompany as any)?.company_address || ''}
          payorTin={viewCert.partyTin}
          payorName={viewCert.partyName}
          payorAddress={viewCert.partyAddress}
          rows={viewCert.lines.map(l => ({
            nature: l.nature, atc: l.atc, month1: l.month1, month2: l.month2, month3: l.month3,
            totalAmount: l.totalAmount, taxWithheld: l.taxWithheld
          }))}
          theme={theme}
          onClose={() => setViewCert(null)}
        />
      )}

      {activeSubTab === 'itax_sawt' && !viewCert && (
        <div className="space-y-4">
          
          {/* Controls */}
          <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className={`text-xs font-bold ${theme.textTitle}`}>Tax Period:</span>
              <select
                value={taxQuarter}
                onChange={(e) => setTaxQuarter(e.target.value as any)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ANNUAL">Annual ITR Attachment (1701 / 1702)</option>
                <option value="Q1">1st Quarter (1701Q / 1702Q)</option>
                <option value="Q2">2nd Quarter (1701Q / 1702Q)</option>
                <option value="Q3">3rd Quarter (1701Q / 1702Q)</option>
              </select>

              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
              >
                {availableTaxYears.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter payor, TIN or invoice..."
                  value={sawtSearch}
                  onChange={(e) => setSawtSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                />
              </div>

              <button
                onClick={handleDownloadSAWTDat}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Download BIR eSubmission SAWT .DAT Attachment File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .DAT</span>
              </button>

              <button
                onClick={() => {
                  const headers = ['Seq #', 'Payor TIN', 'Registered Payor Name', 'ATC Code', 'Nature of Payment', '2307 Count', 'Income Base Amount', 'Creditable Tax Withheld'];
                  const rows = sawtRows.map(r => [
                    r.seq,
                    r.tin,
                    r.name,
                    r.atc,
                    r.nature,
                    r.certCount,
                    r.incomeBase.toFixed(2),
                    r.taxWithheld.toFixed(2)
                  ]);
                  handleExportCSV(`BIR_SAWT_Schedule_${taxYear}_${taxQuarter}`, headers, rows);
                }}
                className={`p-2 rounded-xl border ${theme.borderCard} text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`}
                title="Export SAWT Schedule CSV"
              >
                <Download className="w-4 h-4 text-violet-500" />
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Claimed Payors in SAWT</span>
              <p className={`text-xl font-bold font-mono mt-1 ${theme.textTitle}`}>
                {sawtSummary.count} Payors
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Clients issuing Form 2307</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted} uppercase tracking-wider`}>Gross Income Payment Base</span>
              <p className={`text-xl font-bold font-mono mt-1 ${theme.textTitle}`}>
                ₱{sawtSummary.totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Vatable income base reported on ITR</span>
            </div>

            <div className={`p-4 rounded-2xl border border-violet-500/30 ${theme.bgCard} shadow-xs bg-violet-500/5`}>
              <span className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider">Creditable Tax Claimed (ITR Attachment)</span>
              <p className="text-xl font-bold font-mono mt-1 text-violet-500">
                ₱{sawtSummary.totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-violet-500/80 mt-0.5 block">Direct Tax Credit on 1701 / 1702</span>
            </div>
          </div>

          {/* Table */}
          <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
            <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                Summary Alphalist of Withholding Tax (SAWT Schedule • Mandatory ITR Attachment)
              </h3>
              <span className="text-[11px] text-violet-500 font-mono font-bold">
                BIR Form 2307 Tax Credits Claimed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                    <th className="p-3">Seq #</th>
                    <th className="p-3">Payor TIN</th>
                    <th className="p-3">Payor Registered Name</th>
                    <th className="p-3">ATC Code</th>
                    <th className="p-3">Nature of Income Payment</th>
                    <th className="p-3 text-center">2307s</th>
                    <th className="p-3 text-right">Income Base Amount</th>
                    <th className="p-3 text-right">Creditable Tax Withheld</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {sawtRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-400">
                        No creditable withholding tax claims found for SAWT. Sales with 2307 deductions will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    sawtRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-zinc-400">{r.seq}</td>
                        <td className="p-3 font-mono font-bold text-violet-500">{r.tin}</td>
                        <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.name}</td>
                        <td className="p-3 font-mono font-bold text-cyan-500">{r.atc}{r.atcDerived && <span className="text-[9px] text-zinc-400 font-normal"> (derived)</span>}</td>
                        <td className={`p-3 ${theme.textMuted}`}>{r.nature}</td>
                        <td className="p-3 text-center font-mono text-amber-500">{r.certCount}</td>
                        <td className={`p-3 text-right font-mono font-medium ${theme.textTitle}`}>
                          ₱{r.incomeBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-500">
                          ₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ITR credit link + received BIR 2307 register */}
          {(() => {
            const fmtN = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const expected = itrPeriod === 'ANNUAL' ? itrCredit.cumulative : itrCredit.current;
            const ok = Math.abs(sawtData.totalTax - expected) < 0.01;
            return (
              <>
                <div className={`px-4 py-2 rounded-xl border ${theme.borderCard} text-[11px] font-mono ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ok ? '✔' : '✖'} Σ SAWT ₱{fmtN(sawtData.totalTax)} = {itrPeriod === 'ANNUAL' ? 'Annual ITR credit (Q1–Q4)' : `ITR ${itrPeriod} 2307 for the quarter`} ₱{fmtN(expected)}
                  {itrPeriod !== 'ANNUAL' && ` · carried from previous quarters ₱${fmtN(itrCredit.previous)} · cumulative credit in 1701Q/1702Q ₱${fmtN(itrCredit.cumulative)}`}
                </div>

                <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-xs overflow-hidden`}>
                  <div className={`p-4 border-b ${theme.borderCard} bg-black/5 dark:bg-white/5 flex items-center justify-between`}>
                    <h3 className={`font-bold text-xs uppercase tracking-wider ${theme.textTitle}`}>
                      BIR Form 2307 Received from Customers ({receivedCerts.length})
                    </h3>
                    <span className="text-[11px] text-violet-500 font-mono font-bold">Source of SAWT & ITR credit</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b ${theme.borderCard} ${theme.textMuted} font-bold text-[11px] uppercase`}>
                          <th className="p-3">Certificate #</th>
                          <th className="p-3">Quarter</th>
                          <th className="p-3">Payor</th>
                          <th className="p-3">ATC</th>
                          <th className="p-3 text-right">Income Payments</th>
                          <th className="p-3 text-right">Tax Withheld</th>
                          <th className="p-3 text-center">BIR 2307</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme.borderCard}`}>
                        {receivedCerts.length === 0 ? (
                          <tr><td colSpan={7} className="p-6 text-center text-zinc-400">No 2307 received for this period. Sales recorded with tax withheld appear here automatically.</td></tr>
                        ) : receivedCerts.map(c => (
                          <tr key={c.certNo} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-amber-500">{c.certNo}</td>
                            <td className="p-3 font-mono text-zinc-400">Q{c.quarter} {c.year}</td>
                            <td className={`p-3 font-semibold ${theme.textTitle}`}>{c.partyName}</td>
                            <td className="p-3 font-mono text-cyan-500">{c.lines.map(l => l.atc).join(', ')}</td>
                            <td className={`p-3 text-right font-mono ${theme.textTitle}`}>₱{fmtN(c.totalAmount)}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-500">₱{fmtN(c.totalTax)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setViewCert(c)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20 hover:bg-violet-500 hover:text-white transition cursor-pointer"
                              >
                                View 2307
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 5: BOOK-TO-TAX RECONCILIATION SCHEDULE (PFRS vs. NIRC)   */}
      {/* ===================================================================== */}
      {activeSubTab === 'itax_book_to_tax' && (
        <BookToTaxSchedule
          sales={sales}
          expenses={expenses}
          ppeAssets={ppeAssets}
          specialEntries={specialEntries}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          selectedYear={Number(taxYear) || new Date().getFullYear()}
          onYearChange={(yr) => setTaxYear(String(yr))}
        />
      )}

      {/* POPUP MODAL: ANNUAL TAX REGIMES LEDGER */}
      {activeCompany && isTaxRegimesModalOpen && (
        <AnnualTaxRegimesModal
          company={activeCompany}
          isOpen={isTaxRegimesModalOpen}
          onClose={() => setIsTaxRegimesModalOpen(false)}
          onSaveCompany={(updated) => {
            if (onUpdateCompany) {
              onUpdateCompany(updated);
            } else if (setCompanies) {
              setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
            }
          }}
          triggerAlert={triggerAlert}
          theme={theme}
        />
      )}

      {/* POPUP MODAL: STATUTORY TAX LAW INSPECTOR & TIMELINE */}
      {isStatutoryModalOpen && (
        <StatutoryTaxLawInspectorModal
          isOpen={isStatutoryModalOpen}
          onClose={() => setIsStatutoryModalOpen(false)}
          initialDate={`${taxYear}-06-30`}
          theme={theme}
        />
      )}
    </div>
  );
}
