import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  ArrowRight,
  Clock,
  FileText,
  RefreshCw,
  Plus,
  HelpCircle,
  ExternalLink,
  History,
  TrendingUp,
  Coins,
  Building2,
  FileCheck2,
  AlertOctagon,
  Eye,
  Check,
  X,
  FilePlus,
  ArrowUpRight,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import {
  Company,
  UniformBookRecord,
  SpecialEntry,
  AccountTitle,
  FiscalYearBookStatus,
  MissingInvoiceRecord,
  TaxComplianceStatusRecord
} from '../types';
import { buildMasterJournalEntries, getJournalImbalances } from '../utils/accounting';

interface EntityStatusTabProps {
  activeCompany: Company | null;
  companies: Company[];
  sales: UniformBookRecord[];
  collections: UniformBookRecord[];
  expenses: UniformBookRecord[];
  payments: UniformBookRecord[];
  cashReceipts: UniformBookRecord[];
  cashDisbursements: UniformBookRecord[];
  specialEntries: SpecialEntry[];
  accountTitles: AccountTitle[];
  closedFiscalYears: string[];
  onUpdateClosedFiscalYears: (years: string[]) => void;
  onSelectTab: (tabKey: string) => void;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function EntityStatusTab({
  activeCompany,
  companies,
  sales = [],
  collections = [],
  expenses = [],
  payments = [],
  cashReceipts = [],
  cashDisbursements = [],
  specialEntries = [],
  accountTitles = [],
  closedFiscalYears = [],
  onUpdateClosedFiscalYears,
  onSelectTab,
  theme,
  triggerAlert
}: EntityStatusTabProps) {
  // Active sub-section within Entity Status
  const [activeSection, setActiveSection] = useState<'ALL' | 'BOOKS' | 'INVOICES' | 'IMBALANCES' | 'TAX' | 'OMISSIONS'>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state for manually voided invoices with BIR affidavits
  const [voidedInvoices, setVoidedInvoices] = useState<Record<string, { reason: string; date: string; affidavitRef: string }>>(() => {
    const saved = localStorage.getItem('2os_voided_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {};
  });

  // Modal for Voiding / Documenting a missing invoice
  const [voidModalData, setVoidModalData] = useState<{ invoiceNo: string; type: string } | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [affidavitRef, setAffidavitRef] = useState<string>('');

  // Modal for Closing or Reopening a Fiscal Year
  const [yearActionModal, setYearActionModal] = useState<{ year: string; action: 'CLOSE' | 'REOPEN' } | null>(null);
  const [yearActionNotes, setYearActionNotes] = useState<string>('');

  // Add Prior Fiscal Year Modal
  const [showAddYearModal, setShowAddYearModal] = useState<boolean>(false);
  const [newYearInput, setNewYearInput] = useState<string>('2015');

  // Quick Declaration / Tax Payment Adjustment Modal
  const [taxModalData, setTaxModalData] = useState<{
    taxType: string;
    taxName: string;
    year: string;
    quarter: string;
    computedTax: number;
    declaredTax: number;
    paidTax: number;
  } | null>(null);
  const [customDeclaredTax, setCustomDeclaredTax] = useState<string>('');
  const [customPaidTax, setCustomPaidTax] = useState<string>('');

  // Persisted tax declaration overrides
  const [taxDeclarations, setTaxDeclarations] = useState<Record<string, { declared: number; paid: number; dateUpdated: string }>>(() => {
    const saved = localStorage.getItem('2os_tax_declarations_map');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      '2550Q-2025-Q1': { declared: 6000, paid: 6000, dateUpdated: '2025-04-20' },
      '2550Q-2026-Q1': { declared: 6000, paid: 6000, dateUpdated: '2026-04-20' }
    };
  });

  const saveTaxDeclarations = (newMap: Record<string, { declared: number; paid: number; dateUpdated: string }>) => {
    setTaxDeclarations(newMap);
    localStorage.setItem('2os_tax_declarations_map', JSON.stringify(newMap));
  };

  const companyName = activeCompany?.company_name || activeCompany?.entity_name || 'No Active Entity';
  const rawTin = activeCompany?.company_tin || '000-000-000-00000';
  const cleanTin = (rawTin.replace(/\D/g, '') || '000000000').slice(0, 9);
  const formattedTin = `${cleanTin.slice(0, 3)}-${cleanTin.slice(3, 6)}-${cleanTin.slice(6, 9)}`;
  const branchCode = activeCompany?.tin_branch_code || '00000';
  const isVat = (activeCompany?.vat_or_non_vat || '').toUpperCase().includes('VAT') && !(activeCompany?.vat_or_non_vat || '').toUpperCase().includes('NON');

  /* ========================================================================= */
  /* 1. EXTRACT ALL RECORDED FISCAL YEARS                                      */
  /* ========================================================================= */
  const allRecordedYears = useMemo(() => {
    const setYears = new Set<string>();
    // Default baseline years
    ['2015', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].forEach(y => setYears.add(y));

    // Extract from sales
    sales.forEach(s => {
      const d = s.invoice_date || (s as any).date || (s as any).transaction_date;
      if (d && d.length >= 4) {
        const y = d.slice(0, 4);
        if (/^\d{4}$/.test(y)) setYears.add(y);
      }
    });

    // Extract from expenses
    expenses.forEach(e => {
      const d = e.expense_date || (e as any).date || (e as any).transaction_date;
      if (d && d.length >= 4) {
        const y = d.slice(0, 4);
        if (/^\d{4}$/.test(y)) setYears.add(y);
      }
    });

    // Extract from special entries
    specialEntries.forEach(se => {
      const d = se.entry_date;
      if (d && d.length >= 4) {
        const y = d.slice(0, 4);
        if (/^\d{4}$/.test(y)) setYears.add(y);
      }
    });

    closedFiscalYears.forEach(y => setYears.add(y));

    return Array.from(setYears).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [sales, expenses, specialEntries, closedFiscalYears]);

  /* ========================================================================= */
  /* 2. BOOKS OF ACCOUNTS STATUS PER FISCAL YEAR (OPEN vs CLOSED)              */
  /* ========================================================================= */
  const booksPerYear = useMemo(() => {
    return allRecordedYears.map(year => {
      const isClosed = closedFiscalYears.includes(year);
      
      // Transactions count in this year
      const yearSales = sales.filter(s => {
        const d = s.invoice_date || (s as any).date;
        return d && d.startsWith(year);
      });
      const yearExpenses = expenses.filter(e => {
        const d = e.expense_date || (e as any).date;
        return d && d.startsWith(year);
      });
      const yearReceipts = cashReceipts.filter(r => {
        const d = r.collection_date || (r as any).date;
        return d && d.startsWith(year);
      });
      const yearDisbursements = cashDisbursements.filter(d => {
        const dt = d.expense_date || (d as any).date;
        return dt && dt.startsWith(year);
      });

      const totalSalesAmt = yearSales.reduce((acc, s) => acc + (Number(s.total_amount_due) || Number(s.invoice_amount) || Number((s as any).total_sale_vat_inclusive) || 0), 0);
      const totalExpenseAmt = yearExpenses.reduce((acc, e) => acc + (Number(e.total_amount_due) || Number(e.expense_invoice_amount) || Number((e as any).total_expenses_vat_inclusive) || 0), 0);
      const netIncome = totalSalesAmt - totalExpenseAmt;

      return {
        year,
        isClosed,
        status: isClosed ? ('CLOSED' as const) : ('OPEN' as const),
        salesCount: yearSales.length,
        expensesCount: yearExpenses.length,
        receiptsCount: yearReceipts.length,
        disbursementsCount: yearDisbursements.length,
        totalTransactions: yearSales.length + yearExpenses.length + yearReceipts.length + yearDisbursements.length,
        totalSalesAmt,
        totalExpenseAmt,
        netIncome,
        books: [
          { name: 'General Journal', code: 'GJ', isClosed, icon: FileText },
          { name: 'General Ledger', code: 'GL', isClosed, icon: BookOpenIcon },
          { name: 'Sales Journal', code: 'SJ', isClosed, icon: TrendingUp },
          { name: 'Purchase Journal', code: 'PJ', isClosed, icon: Coins },
          { name: 'Cash Receipts Journal', code: 'CRJ', isClosed, icon: FileSpreadsheet },
          { name: 'Cash Disbursements Journal', code: 'CDJ', isClosed, icon: FileSpreadsheet }
        ],
        closedDate: isClosed ? `Dec 31, ${year}` : undefined,
        closingVoucher: isClosed ? `RJE-${year}-001` : undefined
      };
    });
  }, [allRecordedYears, closedFiscalYears, sales, expenses, cashReceipts, cashDisbursements]);

  /* ========================================================================= */
  /* 3. MISSING INVOICES & GAP AUDITOR                                         */
  /* ========================================================================= */
  const missingInvoicesData = useMemo(() => {
    const list: MissingInvoiceRecord[] = [];

    // Group sales invoices by prefix pattern
    const prefixMap: Record<string, { num: number; full: string; date: string; recordDate?: string; year: string; separator: string; numDigits: number; prefix: string }[]> = {};

    sales.forEach(s => {
      const invNo = (s.invoice_number || (s as any).invoice_no || '').trim();
      const dateStr = s.invoice_date || (s as any).date || '';
      const recDate = s.record_date || (s as any).created_at?.slice(0, 10) || dateStr;
      const year = dateStr.slice(0, 4) || '2026';

      if (!invNo) {
        // Unnumbered invoice flag!
        list.push({
          id: `blank-sale-${s.id}`,
          seriesPrefix: 'UNNUMBERED',
          missingNumber: 0,
          formattedInvoiceNo: `[BLANK INVOICE NUMBER] (Sale ID: ${s.id})`,
          type: 'SALES_INVOICE',
          year,
          detectedAt: dateStr || new Date().toISOString(),
          status: 'MISSING',
          reason: 'Transaction was booked without a valid Sales Invoice sequence number.'
        });
        return;
      }

      // Match prefix / invoice type and numeric portion (e.g. "Sales Invoice 001", "Sales Invoice_001", "INV-0001", "SI-1002", "005")
      let prefix = '';
      let separator = ' ';
      let num = 0;
      let numDigits = 3;

      const spaceMatch = invNo.match(/^(.*?)([\s_-]+)0*(\d+)$/);
      if (spaceMatch) {
        prefix = spaceMatch[1].trim();
        separator = spaceMatch[2];
        num = parseInt(spaceMatch[3], 10);
        numDigits = (invNo.match(/\d+$/) || ['000'])[0].length;
      } else {
        const simpleMatch = invNo.match(/^([A-Za-z_-]*?)0*(\d+)$/);
        if (simpleMatch) {
          prefix = simpleMatch[1] || 'Sales Invoice';
          separator = simpleMatch[1] ? '' : ' ';
          num = parseInt(simpleMatch[2], 10);
          numDigits = (invNo.match(/\d+$/) || ['000'])[0].length;
        }
      }

      if (num > 0) {
        const groupKey = prefix || 'Sales Invoice';
        if (!prefixMap[groupKey]) prefixMap[groupKey] = [];
        prefixMap[groupKey].push({ num, full: invNo, date: dateStr, recordDate: recDate, year, separator, numDigits, prefix: groupKey });
      }
    });

    // Detect integer gaps in each prefix series
    Object.keys(prefixMap).forEach(groupKey => {
      const entries = prefixMap[groupKey].sort((a, b) => a.num - b.num);
      if (entries.length < 2) return;

      const minNum = entries[0].num;
      const maxNum = entries[entries.length - 1].num;
      const existingNums = new Set(entries.map(e => e.num));

      // Limit search range to prevent infinite loops if numbers are wildly apart
      if (maxNum - minNum > 500) return;

      for (let n = minNum; n <= maxNum; n++) {
        if (!existingNums.has(n)) {
          const sample = entries[0];
          const formattedMissing = `${sample.prefix}${sample.separator}${String(n).padStart(sample.numDigits, '0')}`;
          const isVoided = Boolean(voidedInvoices[formattedMissing]);

          list.push({
            id: `gap-${groupKey}-${n}`,
            seriesPrefix: groupKey,
            missingNumber: n,
            formattedInvoiceNo: formattedMissing,
            type: 'SALES_INVOICE',
            year: entries[0].year,
            detectedAt: entries[0].date || new Date().toISOString(),
            status: isVoided ? 'VOIDED_WITH_AFFIDAVIT' : 'MISSING',
            reason: isVoided
              ? `Voided/Cancelled with BIR Affidavit: ${voidedInvoices[formattedMissing].reason} (Ref: ${voidedInvoices[formattedMissing].affidavitRef})`
              : `Numerical sequence skip: Invoice #${n} is absent between ${entries[0].full} and ${entries[entries.length - 1].full}.`
          });
        }
      }
    });

    // Duplicate invoice number detector across transactions
    const invoiceOccurrenceMap = new Map<string, Array<{ id: number; date: string; customer: string; full: string }>>();
    sales.forEach(s => {
      const invNo = (s.invoice_number || (s as any).invoice_no || '').trim();
      if (!invNo) return;
      const key = invNo.toLowerCase();
      if (!invoiceOccurrenceMap.has(key)) {
        invoiceOccurrenceMap.set(key, []);
      }
      invoiceOccurrenceMap.get(key)!.push({
        id: s.id,
        date: s.invoice_date || (s as any).date || '',
        customer: s.customer_name || s.registered_name || 'Customer',
        full: invNo
      });
    });

    invoiceOccurrenceMap.forEach((occurrences) => {
      if (occurrences.length > 1) {
        list.push({
          id: `dup-${occurrences[0].full}`,
          seriesPrefix: 'DUPLICATE',
          missingNumber: 0,
          formattedInvoiceNo: `[DUPLICATE INVOICE] ${occurrences[0].full}`,
          type: 'SALES_INVOICE',
          year: occurrences[0].date.slice(0, 4) || '2026',
          detectedAt: occurrences[0].date || new Date().toISOString(),
          status: 'MISSING',
          reason: `Invoice #${occurrences[0].full} is duplicated across ${occurrences.length} transactions (${occurrences.map(o => `${o.customer} on ${o.date}`).join(', ')}). BIR invoices must be strictly unique.`
        });
      }
    });

    // Also check unnumbered purchase expenses
    expenses.forEach(e => {
      const invNo = (e.invoice_number || e.voucher_number || (e as any).invoice_no || '').trim();
      const dateStr = e.expense_date || (e as any).date || '';
      const year = dateStr.slice(0, 4) || '2026';

      if (!invNo) {
        list.push({
          id: `blank-expense-${e.id}`,
          seriesPrefix: 'UNNUMBERED',
          missingNumber: 0,
          formattedInvoiceNo: `[MISSING SUPPLIER INVOICE/VOUCHER] (Expense ID: ${e.id})`,
          type: 'PURCHASE_VOUCHER',
          year,
          detectedAt: dateStr || new Date().toISOString(),
          status: 'MISSING',
          reason: 'Purchased goods/services recorded without supplier official invoice or voucher number.'
        });
      }
    });

    return list;
  }, [sales, expenses, voidedInvoices]);

  /* ========================================================================= */
  /* 4. GENERAL LEDGER TRIAL BALANCE & IMBALANCES AUDITOR                      */
  /* ========================================================================= */
  const masterJournalEntries = useMemo(() => {
    return buildMasterJournalEntries({
      sales,
      collections,
      cashReceipts,
      expenses,
      payments,
      cashDisbursements,
      specialEntries,
      accountTitles,
      companyName
    });
  }, [sales, collections, cashReceipts, expenses, payments, cashDisbursements, specialEntries, accountTitles, companyName]);

  const ledgerImbalanceAudit = useMemo(() => {
    let totalDebits = 0;
    let totalCredits = 0;
    const accountBalances: Record<string, { code: string; title: string; debits: number; credits: number }> = {};

    masterJournalEntries.forEach(entry => {
      (entry.debits || []).forEach(l => {
        const amt = Number(l.amount) || 0;
        totalDebits += amt;
        const code = l.account_code || '9999';
        if (!accountBalances[code]) {
          accountBalances[code] = { code, title: l.account_title || 'Unknown Account', debits: 0, credits: 0 };
        }
        accountBalances[code].debits += amt;
      });

      (entry.credits || []).forEach(l => {
        const amt = Number(l.amount) || 0;
        totalCredits += amt;
        const code = l.account_code || '9999';
        if (!accountBalances[code]) {
          accountBalances[code] = { code, title: l.account_title || 'Unknown Account', debits: 0, credits: 0 };
        }
        accountBalances[code].credits += amt;
      });
    });

    totalDebits = Math.round(totalDebits * 100) / 100;
    totalCredits = Math.round(totalCredits * 100) / 100;
    const discrepancy = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);
    const isBalanced = discrepancy < 0.01;

    // Check individual voucher-level imbalances
    const voucherImbalances = getJournalImbalances(masterJournalEntries);

    // Sub-ledger vs GL Reconciliations:
    // 1. Accounts Receivable [1020]
    const glArDebits = accountBalances['1020']?.debits || 0;
    const glArCredits = accountBalances['1020']?.credits || 0;
    const glArBalance = Math.max(0, Math.round((glArDebits - glArCredits) * 100) / 100);

    const subSalesArBalance = Math.round(
      sales
        .filter(s => s.status !== 'Paid' && !s.is_cancelled)
        .reduce((acc, s) => {
          const due = Number(s.total_amount_due) || 0;
          const collected = Number(s.amount_collected) || 0;
          const withheld = Number(s.tax_withheld) || Number(s.withholding_2307) || 0;
          return acc + Math.max(0, due - collected - withheld);
        }, 0) * 100
    ) / 100;

    const arVariance = Math.abs(Math.round((glArBalance - subSalesArBalance) * 100) / 100);

    // 2. Accounts Payable [2010]
    const glApDebits = accountBalances['2010']?.debits || 0;
    const glApCredits = accountBalances['2010']?.credits || 0;
    const glApBalance = Math.max(0, Math.round((glApCredits - glApDebits) * 100) / 100);

    const subPurchasesApBalance = Math.round(
      expenses
        .filter(e => e.status !== 'Paid' && !e.is_cancelled)
        .reduce((acc, e) => {
          const due = Number(e.total_amount_due) || 0;
          const paid = Number(e.amount_paid) || 0;
          return acc + Math.max(0, due - paid);
        }, 0) * 100
    ) / 100;

    const apVariance = Math.abs(Math.round((glApBalance - subPurchasesApBalance) * 100) / 100);

    // 3. Cash balance checks
    const cashOnHand = (accountBalances['1010']?.debits || 0) - (accountBalances['1010']?.credits || 0);
    const cashInBank = (accountBalances['1011']?.debits || 0) - (accountBalances['1011']?.credits || 0);
    const hasNegativeCash = cashOnHand < -0.01 || cashInBank < -0.01;

    const issuesCount = (isBalanced ? 0 : 1) + voucherImbalances.length + (arVariance > 0.05 ? 1 : 0) + (apVariance > 0.05 ? 1 : 0) + (hasNegativeCash ? 1 : 0);

    return {
      totalDebits,
      totalCredits,
      discrepancy,
      isBalanced,
      voucherImbalances,
      glArBalance,
      subSalesArBalance,
      arVariance,
      glApBalance,
      subPurchasesApBalance,
      apVariance,
      cashOnHand,
      cashInBank,
      hasNegativeCash,
      issuesCount,
      accountBalances: Object.values(accountBalances)
    };
  }, [masterJournalEntries, sales, expenses]);

  /* ========================================================================= */
  /* 4. TAX COMPUTED vs DECLARED vs PAID MONITOR                               */
  /* ========================================================================= */
  const taxComplianceList = useMemo(() => {
    const list: TaxComplianceStatusRecord[] = [];

    // Filter years for tax calculation
    const yearsToCompute = selectedYearFilter === 'ALL'
      ? allRecordedYears.slice(0, 5) // Last 5 years
      : [selectedYearFilter];

    yearsToCompute.forEach(year => {
      const quarters: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4'];

      quarters.forEach(q => {
        const key = `2550Q-${year}-${q}`;
        const override = taxDeclarations[key];

        // Sales in this quarter
        const qSales = sales.filter(s => {
          const d = s.invoice_date || (s as any).date;
          if (!d || !d.startsWith(year)) return false;
          const m = parseInt(d.slice(5, 7), 10);
          if (q === 'Q1') return m >= 1 && m <= 3;
          if (q === 'Q2') return m >= 4 && m <= 6;
          if (q === 'Q3') return m >= 7 && m <= 9;
          return m >= 10 && m <= 12;
        });

        // Expenses in this quarter
        const qExpenses = expenses.filter(e => {
          const d = e.expense_date || (e as any).date;
          if (!d || !d.startsWith(year)) return false;
          const m = parseInt(d.slice(5, 7), 10);
          if (q === 'Q1') return m >= 1 && m <= 3;
          if (q === 'Q2') return m >= 4 && m <= 6;
          if (q === 'Q3') return m >= 7 && m <= 9;
          return m >= 10 && m <= 12;
        });

        // Computed vatable sales & output VAT
        let actualVatableSales = 0;
        let actualOutputVat = 0;
        qSales.forEach(s => {
          const gross = Number((s as any).total_amount_vat_inclusive) || Number((s as any).total_sale_vat_inclusive) || Number(s.invoice_amount) || Number(s.amount) || Number(s.total_amount_due) || 0;
          const vatable = Number((s as any).vatable_sales) || (isVat ? Math.round((gross / 1.12) * 100) / 100 : gross);
          const vAmount = Number((s as any).add_vat) || Number(s.output_vat) || (isVat ? Math.round((vatable * 0.12) * 100) / 100 : 0);
          actualVatableSales += vatable;
          actualOutputVat += vAmount;
        });

        // Computed Input VAT
        let totalInputVat = 0;
        qExpenses.forEach(e => {
          const inVat = Number((e as any).add_vat) || Number(e.vat_input_amount) || 0;
          totalInputVat += inVat;
        });

        const computedNetVat = Math.max(0, actualOutputVat - totalInputVat);
        const excessInputVat = Math.max(0, totalInputVat - actualOutputVat);

        // Fallbacks or overrides
        const declaredTax = override ? override.declared : actualOutputVat;
        const paidTax = override ? override.paid : declaredTax;

        const isUnderdeclared = actualOutputVat > declaredTax;
        const varianceSales = isUnderdeclared ? Math.round((actualOutputVat - declaredTax) / 0.12 * 100) / 100 : 0;
        const varianceTax = Math.max(0, actualOutputVat - declaredTax);
        const isOverpaymentCredit = excessInputVat > 0 || paidTax > actualOutputVat;
        const creditCarriedOver = excessInputVat > 0 ? excessInputVat : Math.max(0, paidTax - actualOutputVat);

        let status: 'PAID' | 'UNDERDECLARED' | 'OVERPAID_CREDIT' | 'UNFILED' = 'PAID';
        if (isUnderdeclared) status = 'UNDERDECLARED';
        else if (isOverpaymentCredit) status = 'OVERPAID_CREDIT';
        else if (paidTax < declaredTax) status = 'UNFILED';

        list.push({
          taxType: isVat ? '2550Q' : '2551Q',
          taxName: isVat ? 'Quarterly Value-Added Tax (BIR Form 2550Q)' : 'Quarterly Percentage Tax (BIR Form 2551Q)',
          year,
          quarter: q,
          computedTax: Math.round(actualOutputVat * 100) / 100,
          declaredTax: Math.round(declaredTax * 100) / 100,
          paidTax: Math.round(paidTax * 100) / 100,
          varianceSales,
          varianceTax,
          isUnderdeclared,
          isOverpaymentCredit,
          creditCarriedOver,
          status,
          filingDeadline: q === 'Q1' ? `April 25, ${year}` : q === 'Q2' ? `July 25, ${year}` : q === 'Q3' ? `October 25, ${year}` : `January 25, ${parseInt(year, 10) + 1}`
        });
      });
    });

    return list;
  }, [allRecordedYears, selectedYearFilter, sales, expenses, isVat, taxDeclarations]);

  /* ========================================================================= */
  /* 5. PRIOR YEAR OMISSIONS (OPTION B AUDIT LOGS)                             */
  /* ========================================================================= */
  const priorYearOmissions = useMemo(() => {
    const list: any[] = [];

    // Omissions from sales
    sales.forEach(s => {
      if (s.is_prior_year_omission || (s as any).is_prior_year_omission) {
        list.push({
          id: s.id,
          docType: 'SALES INVOICE',
          docNo: s.invoice_number || `SALE-${s.id}`,
          date: s.invoice_date || (s as any).date,
          recordDate: s.record_date || (s as any).created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          originalYear: s.original_year || (s.invoice_date ? s.invoice_date.slice(0, 4) : 'Unknown'),
          effectiveYear: s.effective_year || '2026',
          partyName: s.customer_name || s.registered_name || 'Customer',
          amount: Number(s.total_amount_due) || Number(s.invoice_amount) || 0,
          taxAmount: Number(s.output_vat) || 0,
          status: 'Recognized in Present Year (PAS 8)',
          notes: 'Fiscal Year closed. Adjustment posted to current active year Retained Earnings [3020] (Option B - PAS 8).'
        });
      }
    });

    // Omissions from expenses
    expenses.forEach(e => {
      if (e.is_prior_year_omission || (e as any).is_prior_year_omission) {
        list.push({
          id: e.id,
          docType: 'PURCHASE / EXPENSE',
          docNo: e.invoice_number || e.voucher_number || `EXP-${e.id}`,
          date: e.expense_date || (e as any).date,
          recordDate: e.record_date || (e as any).created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          originalYear: e.original_year || (e.expense_date ? e.expense_date.slice(0, 4) : 'Unknown'),
          effectiveYear: e.effective_year || '2026',
          partyName: e.service_provider_name || 'Vendor',
          amount: Number(e.total_amount_due) || Number(e.expense_invoice_amount) || 0,
          taxAmount: Number(e.vat_input_amount) || 0,
          status: 'Recognized in Present Year (PAS 8)',
          notes: 'Fiscal Year closed. Prior-period expense recognized in present year without modifying closed audited books (Option B - PAS 8).'
        });
      }
    });

    return list;
  }, [sales, expenses]);

  /* ========================================================================= */
  /* ACTIONS: CLOSE / REOPEN FISCAL YEAR                                       */
  /* ========================================================================= */
  const handleExecuteYearAction = () => {
    if (!yearActionModal) return;
    const { year, action } = yearActionModal;

    if (action === 'CLOSE') {
      if (!closedFiscalYears.includes(year)) {
        const updated = [...closedFiscalYears, year];
        onUpdateClosedFiscalYears(updated);
        triggerAlert(`Fiscal Year ${year} Books of Accounts are now officially CLOSED & REVERSED. All nominal revenue and expense accounts transferred to Retained Earnings (3020). Direct additions to ${year} are now locked under Option B.`, 'success');
      }
    } else {
      const updated = closedFiscalYears.filter(y => y !== year);
      onUpdateClosedFiscalYears(updated);
      triggerAlert(`Fiscal Year ${year} has been REOPENED upon supervisory authorization. Books are once again active.`, 'info');
    }

    setYearActionModal(null);
    setYearActionNotes('');
  };

  /* ========================================================================= */
  /* ACTIONS: VOID MISSING INVOICE WITH BIR AFFIDAVIT                          */
  /* ========================================================================= */
  const handleSaveVoidInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalData) return;
    if (!voidReason.trim() || !affidavitRef.trim()) {
      triggerAlert('Reason and BIR Affidavit Reference are required to void a sequential invoice gap!', 'error');
      return;
    }

    const updated = {
      ...voidedInvoices,
      [voidModalData.invoiceNo]: {
        reason: voidReason.trim(),
        affidavitRef: affidavitRef.trim(),
        date: new Date().toISOString().slice(0, 10)
      }
    };
    setVoidedInvoices(updated);
    localStorage.setItem('2os_voided_invoices', JSON.stringify(updated));

    triggerAlert(`Invoice sequence ${voidModalData.invoiceNo} successfully recorded as Voided with BIR Affidavit of Spoilage/Loss.`, 'success');
    setVoidModalData(null);
    setVoidReason('');
    setAffidavitRef('');
  };

  /* ========================================================================= */
  /* ACTIONS: UPDATE TAX DECLARATION OVERRIDE                                  */
  /* ========================================================================= */
  const handleSaveTaxDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxModalData) return;

    const decVal = parseFloat(customDeclaredTax);
    const paidVal = parseFloat(customPaidTax);

    if (isNaN(decVal) || isNaN(paidVal)) {
      triggerAlert('Please enter valid numeric figures for declared and paid tax amounts.', 'error');
      return;
    }

    const key = `2550Q-${taxModalData.year}-${taxModalData.quarter}`;
    const updated = {
      ...taxDeclarations,
      [key]: {
        declared: decVal,
        paid: paidVal,
        dateUpdated: new Date().toISOString().slice(0, 10)
      }
    };
    saveTaxDeclarations(updated);

    triggerAlert(`Tax filing status for ${taxModalData.year} ${taxModalData.quarter} updated successfully! Variances recalculated.`, 'success');
    setTaxModalData(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. TOP HEADER & ENTITY SUMMARY BANNER */}
      <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm backdrop-blur-md relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-500">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className={`text-xl font-black tracking-tight ${theme.textTitle}`}>
                Entity Status &amp; Compliance Hub
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isVat ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                {isVat ? 'VAT Registered' : 'Non-VAT Entity'}
              </span>
            </div>
            <p className={`text-xs ${theme.textMuted} flex flex-wrap items-center gap-x-4 gap-y-1`}>
              <span>Active Taxpayer: <strong className={theme.textTitle}>{companyName}</strong></span>
              <span>•</span>
              <span>TIN: <strong className="font-mono text-cyan-400">{formattedTin}-{branchCode}</strong></span>
              <span>•</span>
              <span>RDO: <strong className="font-mono">{activeCompany?.rdo || '043'}</strong></span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddYearModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Fiscal Year</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('special_entries')}
              className={`px-3.5 py-2 rounded-xl border ${theme.borderCard} ${theme.bgCard} hover:bg-white/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer`}
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Closing Entries Wizard</span>
            </button>
          </div>
        </div>

        {/* COMPLIANCE HEALTH KPI METRICS */}
        {/* COMPLIANCE HEALTH KPI METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-zinc-800/40">
          
          {/* Metric 1: Books Closed */}
          <div className="p-3.5 rounded-2xl bg-black/20 dark:bg-black/40 border border-zinc-800/60">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Books Status</span>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg font-black font-mono text-zinc-100">
              {closedFiscalYears.length} / {allRecordedYears.length} <span className="text-xs font-normal text-zinc-400">Years Closed</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {allRecordedYears.length - closedFiscalYears.length} active open books
            </div>
          </div>

          {/* Metric 2: Missing Invoices */}
          <div className={`p-3.5 rounded-2xl border ${missingInvoicesData.filter(m => m.status === 'MISSING').length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-black/20 border-zinc-800/60'}`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Missing Invoices</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${missingInvoicesData.filter(m => m.status === 'MISSING').length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-lg font-black font-mono text-amber-400">
              {missingInvoicesData.filter(m => m.status === 'MISSING').length} <span className="text-xs font-normal text-zinc-400">Exceptions</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {missingInvoicesData.filter(m => m.status === 'VOIDED_WITH_AFFIDAVIT').length} voided with BIR affidavit
            </div>
          </div>

          {/* Metric 3: Ledger Imbalances */}
          <div className={`p-3.5 rounded-2xl border ${!ledgerImbalanceAudit.isBalanced || ledgerImbalanceAudit.issuesCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Ledger Parity</span>
              <Scale className={`w-3.5 h-3.5 ${ledgerImbalanceAudit.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <div className={`text-lg font-black font-mono ${ledgerImbalanceAudit.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ledgerImbalanceAudit.isBalanced ? 'Balanced' : `₱${ledgerImbalanceAudit.discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {ledgerImbalanceAudit.isBalanced ? 'Debits = Credits (₱0.00)' : `${ledgerImbalanceAudit.issuesCount} discrepancy alert(s)`}
            </div>
          </div>

          {/* Metric 4: Underdeclared Taxes */}
          <div className={`p-3.5 rounded-2xl border ${taxComplianceList.filter(t => t.isUnderdeclared).length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-black/20 border-zinc-800/60'}`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Underdeclarations</span>
              <AlertOctagon className={`w-3.5 h-3.5 ${taxComplianceList.filter(t => t.isUnderdeclared).length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-lg font-black font-mono text-rose-400">
              {taxComplianceList.filter(t => t.isUnderdeclared).length} <span className="text-xs font-normal text-zinc-400">Returns</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Reflecting into next quarters
            </div>
          </div>

          {/* Metric 5: Option B Prior Year Omissions */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Prior-Year Omissions</span>
              <History className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-black font-mono text-cyan-400">
              {priorYearOmissions.length} <span className="text-xs font-normal text-zinc-400">Transferred</span>
            </div>
            <div className="text-[11px] text-cyan-300 mt-0.5">
              Option B PAS 8 adjustments
            </div>
          </div>

        </div>
      </div>

      {/* 2. SECTION TABS & YEAR FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 dark:bg-zinc-900/80 border border-zinc-800 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Modules' },
            { id: 'BOOKS', label: 'Books of Accounts (Open/Closed)' },
            { id: 'INVOICES', label: `Missing Invoices (${missingInvoicesData.filter(m => m.status === 'MISSING').length})` },
            { id: 'IMBALANCES', label: `Ledger Imbalances (${ledgerImbalanceAudit.issuesCount})` },
            { id: 'TAX', label: 'Tax Computed vs Declared vs Paid' },
            { id: 'OMISSIONS', label: `Prior-Year Omissions (${priorYearOmissions.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : `${theme.textMuted} hover:text-white`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-bold text-cyan-400 cursor-pointer focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Recorded Years</option>
            {allRecordedYears.map(y => (
              <option key={y} value={y}>Fiscal Year {y} {closedFiscalYears.includes(y) ? '(Closed)' : '(Open)'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: BOOKS OF ACCOUNTS (PER YEAR RECORDED - OPEN & CLOSED)       */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'BOOKS') && (
        <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-cyan-500" />
                <h2 className={`font-black text-base ${theme.textTitle}`}>
                  Books of Accounts Status (Per Fiscal Year Recorded)
                </h2>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Official BIR Books of Accounts (General Journal, General Ledger, Sales Journal, Purchase Journal, Cash Receipts, Cash Disbursements).
                Once closed, backdated additions to that year will be rerouted to the present year under <strong>Option B (PAS 8)</strong>.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAddYearModal(true)}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Prior Year</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {booksPerYear
              .filter(b => selectedYearFilter === 'ALL' || b.year === selectedYearFilter)
              .map(b => (
                <div
                  key={b.year}
                  className={`p-5 rounded-2xl border transition-all ${
                    b.isClosed
                      ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                      : 'bg-cyan-950/10 border-cyan-500/30 hover:border-cyan-500/50 shadow-xs'
                  }`}
                >
                  {/* Card Header: Year & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-zinc-100">
                        FY {b.year}
                      </span>
                      {b.isClosed ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Closed &amp; Reversed</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Unlock className="w-2.5 h-2.5" />
                          <span>Open &amp; Active</span>
                        </span>
                      )}
                    </div>

                    {/* Close / Reopen Action Button */}
                    <button
                      type="button"
                      onClick={() => setYearActionModal({ year: b.year, action: b.isClosed ? 'REOPEN' : 'CLOSE' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        b.isClosed
                          ? 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                          : 'border border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      {b.isClosed ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Reopen Year</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Close Books</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Year Financial Summary */}
                  <div className="p-3 rounded-xl bg-black/20 text-xs space-y-1 font-mono mb-3">
                    <div className="flex justify-between text-zinc-400">
                      <span>Total Sales:</span>
                      <span className="text-zinc-200">₱{b.totalSalesAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Total Purchases/Exp:</span>
                      <span className="text-zinc-200">₱{b.totalExpenseAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-zinc-800 pt-1">
                      <span className="text-zinc-300">Net Operating Margin:</span>
                      <span className={b.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        ₱{b.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* 6 Official Books Mini Status Grid */}
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>6 Official Books of Accounts:</span>
                    <span className="text-[10px] lowercase text-zinc-500 font-mono">
                      {b.totalTransactions} recorded txns
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {b.books.map(bk => (
                      <div
                        key={bk.code}
                        className={`p-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
                          b.isClosed
                            ? 'bg-black/30 border-zinc-800 text-zinc-400'
                            : 'bg-black/10 border-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        <span className="truncate">{bk.name}</span>
                        <span className="font-mono text-[10px] px-1 rounded bg-black/40 text-zinc-400 shrink-0">
                          {b.isClosed ? 'LOCKED' : 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Notes */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>
                      {b.isClosed ? `Closing Ref: ${b.closingVoucher}` : 'Open for transaction posting'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTab('sales')}
                      className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <span>View Txns</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: MISSING INVOICES & SEQUENCE GAP AUDITOR                    */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'INVOICES') && (
        <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className={`font-black text-base ${theme.textTitle}`}>
                  Missing Invoices &amp; Sequential Gaps Detector
                </h2>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Scans for missing invoice numbers in the numerical series, skipped invoice sequences, and transactions recorded without official document numbers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                {missingInvoicesData.filter(m => m.status === 'MISSING').length} Unresolved Missing
              </span>
            </div>
          </div>

          {missingInvoicesData.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-emerald-400 text-sm">Perfect Document Continuity</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                No gaps detected in the sales invoice or purchase voucher series. Every invoice follows a continuous, uninterrupted numerical sequence.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Doc Type</th>
                    <th className="p-3">Missing Invoice #</th>
                    <th className="p-3">Detected Period</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Audit Details &amp; Reason</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-medium">
                  {missingInvoicesData.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'SALES_INVOICE' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}>
                          {m.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-300">
                        {m.formattedInvoiceNo}
                      </td>
                      <td className="p-3 font-mono text-zinc-400">
                        FY {m.year}
                      </td>
                      <td className="p-3">
                        {m.status === 'MISSING' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Missing / Skipped</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" />
                            <span>Voided w/ Affidavit</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-300 text-[11px] max-w-md">
                        {m.reason}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.status === 'MISSING' && (
                            <button
                              type="button"
                              onClick={() => setVoidModalData({ invoiceNo: m.formattedInvoiceNo, type: m.type })}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition cursor-pointer"
                              title="Mark as voided/cancelled with BIR affidavit of loss/spoilage"
                            >
                              Void w/ Affidavit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectTab(m.type === 'SALES_INVOICE' ? 'sales_transaction' : 'purchase_transaction')}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Add Txn</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: GENERAL LEDGER TRIAL BALANCE & IMBALANCES AUDITOR          */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'IMBALANCES') && (
        <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-500" />
                <h2 className={`font-black text-base ${theme.textTitle}`}>
                  General Ledger Trial Balance &amp; Book Imbalances Auditor
                </h2>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Verifies mathematical parity across double-entry books (Total Debits = Total Credits), individual journal voucher balancing, and reconciles subsidiary ledgers (A/R and A/P) against control accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border font-mono flex items-center gap-1.5 ${
                ledgerImbalanceAudit.isBalanced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {ledgerImbalanceAudit.isBalanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Balanced (Debits = Credits)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Imbalance: ₱{ledgerImbalanceAudit.discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 3 COMPARATIVE RECONCILIATION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Trial Balance Equality */}
            <div className="p-4 rounded-2xl bg-black/20 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>1. General Ledger Trial Balance</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ledgerImbalanceAudit.isBalanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {ledgerImbalanceAudit.isBalanced ? 'BALANCED' : 'IMBALANCE'}
                </span>
              </div>
              <div className="text-xs space-y-1 font-mono pt-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Debits:</span>
                  <span className="text-zinc-200 font-bold">₱{ledgerImbalanceAudit.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Credits:</span>
                  <span className="text-zinc-200 font-bold">₱{ledgerImbalanceAudit.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-300">
                  <span>Discrepancy:</span>
                  <span className={ledgerImbalanceAudit.isBalanced ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    ₱{ledgerImbalanceAudit.discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Accounts Receivable Sub-ledger Reconciled */}
            <div className="p-4 rounded-2xl bg-black/20 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>2. Accounts Receivable [1020]</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ledgerImbalanceAudit.arVariance <= 0.05 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {ledgerImbalanceAudit.arVariance <= 0.05 ? 'RECONCILED' : 'DISCREPANCY'}
                </span>
              </div>
              <div className="text-xs space-y-1 font-mono pt-1">
                <div className="flex justify-between text-zinc-400">
                  <span>GL Control Balance:</span>
                  <span className="text-zinc-200">₱{ledgerImbalanceAudit.glArBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Sub-Sales Unpaid:</span>
                  <span className="text-zinc-200">₱{ledgerImbalanceAudit.subSalesArBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-300">
                  <span>Variance:</span>
                  <span className={ledgerImbalanceAudit.arVariance <= 0.05 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    ₱{ledgerImbalanceAudit.arVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Accounts Payable Sub-ledger Reconciled */}
            <div className="p-4 rounded-2xl bg-black/20 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span>3. Accounts Payable [2010]</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ledgerImbalanceAudit.apVariance <= 0.05 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {ledgerImbalanceAudit.apVariance <= 0.05 ? 'RECONCILED' : 'DISCREPANCY'}
                </span>
              </div>
              <div className="text-xs space-y-1 font-mono pt-1">
                <div className="flex justify-between text-zinc-400">
                  <span>GL Control Balance:</span>
                  <span className="text-zinc-200">₱{ledgerImbalanceAudit.glApBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Sub-Purchases Unpaid:</span>
                  <span className="text-zinc-200">₱{ledgerImbalanceAudit.subPurchasesApBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-300">
                  <span>Variance:</span>
                  <span className={ledgerImbalanceAudit.apVariance <= 0.05 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    ₱{ledgerImbalanceAudit.apVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* VOUCHER-LEVEL IMBALANCE AUDIT TABLE */}
          {ledgerImbalanceAudit.voucherImbalances.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Detected {ledgerImbalanceAudit.voucherImbalances.length} Asymmetric / Out-of-Balance Journal Entry Voucher(s):</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-rose-500/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">Entry / Voucher #</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit (₱)</th>
                      <th className="p-2.5 text-right">Credit (₱)</th>
                      <th className="p-2.5 text-right">Difference (₱)</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono">
                    {ledgerImbalanceAudit.voucherImbalances.map((v, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="p-2.5 font-bold text-rose-400">{v.entry_no}</td>
                        <td className="p-2.5 font-sans text-zinc-200">{v.description}</td>
                        <td className="p-2.5 text-right text-zinc-300">₱{v.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2.5 text-right text-zinc-300">₱{v.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2.5 text-right font-bold text-rose-400">₱{v.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2.5 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => onSelectTab('general_journal')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
                          >
                            Inspect in GJ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LIQUIDITY / CASH INTEGRITY NOTICE */}
          {ledgerImbalanceAudit.hasNegativeCash && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Negative Cash Balance Alert:</strong> Cash on Hand (₱{ledgerImbalanceAudit.cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}) or Cash in Bank (₱{ledgerImbalanceAudit.cashInBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}) reflects a credit balance. Review recorded disbursements vs actual cash receipts.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('collections')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold transition cursor-pointer text-[11px] shrink-0"
              >
                Reconcile Cash
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: TAX COMPUTED vs DECLARED vs PAID                           */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'TAX') && (
        <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-cyan-500" />
                <h2 className={`font-black text-base ${theme.textTitle}`}>
                  Tax Computed vs. Declared vs. Paid Monitor
                </h2>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Diagnostic assessment distinguishing actual sales &amp; VAT per books from declared amounts. Underdeclarations flag a warning and carry over to the next quarter. Overpayments and negative tax (excess input VAT) are preserved as tax credits.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('business_tax')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Open Business Tax Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="p-3">Tax Form</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Computed (Books)</th>
                  <th className="p-3 text-right">Declared (Filed)</th>
                  <th className="p-3 text-right">Paid / Remitted</th>
                  <th className="p-3">Compliance Assessment &amp; Variances</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {taxComplianceList.map((t, idx) => (
                  <tr key={`${t.taxType}-${t.year}-${t.quarter}-${idx}`} className="hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="font-bold text-zinc-100">{t.taxType}</div>
                      <div className="text-[10px] text-zinc-400">{t.taxName}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-cyan-400">
                      {t.quarter} {t.year}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-200">
                      ₱{t.computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-300">
                      ₱{t.declaredTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₱{t.paidTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      {t.isUnderdeclared ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Underdeclaration Detected</span>
                          </span>
                          <p className="text-[11px] text-amber-400 leading-tight">
                            Underdeclared VAT of <strong>₱{t.varianceTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> (Sales diff: ₱{t.varianceSales?.toLocaleString(undefined, { minimumFractionDigits: 2 })}) carries over to next quarter&apos;s computation.
                          </p>
                        </div>
                      ) : t.isOverpaymentCredit ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>Excess Tax Credit / Overpayment</span>
                          </span>
                          <p className="text-[11px] text-cyan-300 leading-tight">
                            Credit of <strong>₱{t.creditCarriedOver.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> available to deduct against future quarterly tax due.
                          </p>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <Check className="w-3 h-3" />
                          <span>Fully Declared &amp; Paid</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setTaxModalData({
                            taxType: t.taxType,
                            taxName: t.taxName,
                            year: t.year,
                            quarter: t.quarter,
                            computedTax: t.computedTax,
                            declaredTax: t.declaredTax,
                            paidTax: t.paidTax
                          });
                          setCustomDeclaredTax(String(t.declaredTax));
                          setCustomPaidTax(String(t.paidTax));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition cursor-pointer"
                      >
                        Adjust / Remit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: PRIOR YEAR OMISSIONS (OPTION B AUDIT LOGS)                 */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'OMISSIONS') && (
        <div className={`p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-sm space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-500" />
                <h2 className={`font-black text-base ${theme.textTitle}`}>
                  Prior-Year Omission &amp; Adjustment Audit Ledger (Option B - PAS 8)
                </h2>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Transactions entered for a closed fiscal year that were recognized in the present year under Philippine Accounting Standards (PAS 8 Prior Period Adjustments) to keep closed audited books pristine.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              {priorYearOmissions.length} Rerouted Adjustments
            </span>
          </div>

          {priorYearOmissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center space-y-2">
              <History className="w-8 h-8 text-zinc-500 mx-auto" />
              <h3 className="font-bold text-zinc-300 text-sm">No Prior-Year Omissions Recorded</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Whenever a transaction is backdated to a closed fiscal year, Option B will warn the user and post the adjustment to the present active year without modifying the closed year. Those entries will be audited here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Doc #</th>
                    <th className="p-3">Original Invoice Date (Closed FY)</th>
                    <th className="p-3">System Record Date</th>
                    <th className="p-3">Effective Recognition FY</th>
                    <th className="p-3">Party / Particulars</th>
                    <th className="p-3 text-right">Amount (₱)</th>
                    <th className="p-3 text-right">Tax Impact (₱)</th>
                    <th className="p-3">PAS 8 Accounting Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-medium">
                  {priorYearOmissions.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">
                        {o.docNo}
                      </td>
                      <td className="p-3 font-mono text-rose-400">
                        {o.date} (FY {o.originalYear} - CLOSED)
                      </td>
                      <td className="p-3 font-mono text-zinc-300">
                        {o.recordDate || new Date().toISOString().slice(0, 10)}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        FY {o.effectiveYear} (PRESENT YEAR)
                      </td>
                      <td className="p-3 text-zinc-200">
                        {o.partyName}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-100">
                        ₱{o.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-cyan-400">
                        ₱{o.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-zinc-400 text-[11px]">
                        <span className="font-bold text-cyan-300">Option B:</span> {o.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CLOSE OR REOPEN FISCAL YEAR                                  */}
      {/* ===================================================================== */}
      {yearActionModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${yearActionModal.action === 'CLOSE' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {yearActionModal.action === 'CLOSE' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className={`text-base font-black ${theme.textTitle}`}>
                  {yearActionModal.action === 'CLOSE'
                    ? `Close & Lock Fiscal Year ${yearActionModal.year} Books`
                    : `Reopen Fiscal Year ${yearActionModal.year} Books`}
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  {yearActionModal.action === 'CLOSE'
                    ? 'Official year-end closing entries and period locking.'
                    : 'Supervisory override to allow direct backdated additions.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-zinc-800 text-xs space-y-2 leading-relaxed">
              {yearActionModal.action === 'CLOSE' ? (
                <>
                  <p className="text-zinc-200">
                    Closing the books for Fiscal Year <strong>{yearActionModal.year}</strong> will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Lock all 6 Books of Accounts for {yearActionModal.year} against direct changes.</li>
                    <li>Transfer nominal revenue (4000s) and expense (6000s) accounts to Retained Earnings (3020).</li>
                    <li>Enforce <strong>Option C</strong>: any subsequent transaction backdated to {yearActionModal.year} will show a warning and reflect in the present year rather than altering {yearActionModal.year}.</li>
                  </ul>
                </>
              ) : (
                <p className="text-amber-400">
                  Warning: Reopening Fiscal Year <strong>{yearActionModal.year}</strong> removes the lock. Any new transactions dated in {yearActionModal.year} will directly alter the {yearActionModal.year} audited financial statements.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Auditor / Accountant Notes (Optional)
              </label>
              <textarea
                value={yearActionNotes}
                onChange={(e) => setYearActionNotes(e.target.value)}
                rows={2}
                placeholder={yearActionModal.action === 'CLOSE' ? 'e.g. Audited financial statements finalized.' : 'e.g. Authorized reopening for post-audit adjustments.'}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setYearActionModal(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteYearAction}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white transition shadow-sm cursor-pointer ${
                  yearActionModal.action === 'CLOSE'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {yearActionModal.action === 'CLOSE' ? 'Confirm Book Closure' : 'Confirm Reopen Year'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: VOID MISSING INVOICE WITH BIR AFFIDAVIT                      */}
      {/* ===================================================================== */}
      {voidModalData && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveVoidInvoice}
            className={`w-full max-w-lg p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-black ${theme.textTitle}`}>
                  Record Missing Invoice as Voided w/ Affidavit
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Document why invoice #{voidModalData.invoiceNo} was spoiled, lost, or skipped in the sequence.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Reason for Sequence Skip / Cancellation *
              </label>
              <input
                type="text"
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Printer paper jam / Spoilage during issuance"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                BIR Affidavit of Loss / Spoilage Reference # *
              </label>
              <input
                type="text"
                required
                value={affidavitRef}
                onChange={(e) => setAffidavitRef(e.target.value)}
                placeholder="e.g. AFF-BIR-2025-0042 / Notarized Affidavit Doc 42"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalData(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Save BIR Affidavit Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADD PRIOR FISCAL YEAR                                        */}
      {/* ===================================================================== */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-black ${theme.textTitle}`}>
                  Register Prior Fiscal Year
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Add a historical fiscal year (e.g. 2015) to track open/closed books.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Fiscal Year (4 Digits)
              </label>
              <input
                type="number"
                min="1990"
                max="2099"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                placeholder="e.g. 2015"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddYearModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (/^\d{4}$/.test(newYearInput)) {
                    triggerAlert(`Fiscal Year ${newYearInput} successfully registered in Entity Status. Books are OPEN for entry.`, 'success');
                    setSelectedYearFilter(newYearInput);
                    setShowAddYearModal(false);
                  } else {
                    triggerAlert('Please enter a valid 4-digit fiscal year (e.g. 2015).', 'error');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Register Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ADJUST TAX DECLARATION / REMITTANCE                          */}
      {/* ===================================================================== */}
      {taxModalData && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTaxDeclaration}
            className={`w-full max-w-lg p-6 rounded-3xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl space-y-4`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-black ${theme.textTitle}`}>
                  Update {taxModalData.taxType} Declaration &amp; Payment
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  {taxModalData.quarter} {taxModalData.year} • {taxModalData.taxName}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-zinc-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Computed per Books of Accounts:</span>
                <span className="font-bold text-zinc-100">₱{taxModalData.computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                Declared Tax Due per Filed BIR Return (₱) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={customDeclaredTax}
                onChange={(e) => setCustomDeclaredTax(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full px-3 py-2 rounded-xl border border-amber-500/40 bg-zinc-900 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                If declared tax is less than computed tax, an underdeclaration warning is recorded and reflected in the next quarter.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                Actual Tax Paid / Remitted to BIR / Bank (₱) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={customPaidTax}
                onChange={(e) => setCustomPaidTax(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full px-3 py-2 rounded-xl border border-emerald-500/40 bg-zinc-900 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTaxModalData(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Save Compliance Status
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// Helper icon component for General Ledger
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
