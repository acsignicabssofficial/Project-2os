import React, { useState, useMemo } from 'react';
import { Landmark, CheckCircle, AlertTriangle, Layers, Search, Scale } from 'lucide-react';
import { Sale, Collection, Expense, Payment, PPEAsset, SpecialEntry, PayrollRecord, AccountTitle, Company } from '../types';

interface FinancialPositionTabProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  ppeAssets: PPEAsset[];
  specialEntries?: SpecialEntry[];
  payrollRecords?: PayrollRecord[];
  accountTitles?: AccountTitle[];
  incomeTaxRecords?: any[];
  activeCompany: Company | null;
  theme: any;
}


export default function FinancialPositionTab({
  sales = [],
  collections = [],
  expenses = [],
  payments = [],
  ppeAssets = [],
  specialEntries = [],
  payrollRecords = [],
  accountTitles = [],
  activeCompany,
  theme
}: FinancialPositionTabProps) {
  const companyName = activeCompany?.company_name || 'No Active Company';
  const [showAuditPanel, setShowAuditPanel] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Compute Balance Sheet Items with Accounting Integrity
  const bs = useMemo(() => {
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 1. Calculate Customer Balances (Receivables vs Customer Credit Balances/Advances)
    const uniqueCustTins = new Set<string>();
    sales.forEach(s => uniqueCustTins.add(s.customer_tin));
    collections.forEach(c => uniqueCustTins.add(c.customer_tin));

    let ar = 0; // Accounts Receivable (Asset)
    let customerAdvances = 0; // Customer Credit Balance (Liability)

    uniqueCustTins.forEach(tin => {
      const custSales = sales.filter(s => s.customer_tin === tin);
      // Net of discount: the actual amount owed by the customer for these invoices
      const custInvoiced = custSales.reduce((sum, s) => sum + Math.max(0, (Number(s.invoice_amount) || 0) - (Number(s.discounts) || 0)), 0);

      let custCollected = 0;
      custSales.forEach(s => {
        const invNo = normalizeDocNo(s.invoice_number);
        const colls = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo);
        if (colls.length > 0) {
          custCollected += colls.reduce((sum, col) => sum + (Number(col.amount_collected) || 0) + (Number(col.amount_withheld_2307) || 0), 0) + (Number(s.down_payment) || 0);
        } else {
          if (s.sales_status === 'Paid') {
            custCollected += Math.max(0, (Number(s.invoice_amount) || 0) - (Number(s.discounts) || 0));
          } else if (s.sales_status === 'Partial') {
            custCollected += (Number(s.down_payment) || 0);
          }
        }
      });

      // Orphan collections for customer
      const custSaleInvoiceNos = new Set(custSales.map(s => normalizeDocNo(s.invoice_number)));
      const orphanColls = collections.filter(c => c.customer_tin === tin && !custSaleInvoiceNos.has(normalizeDocNo(c.invoice_number)));
      const orphanCollected = orphanColls.reduce((sum, col) => sum + (Number(col.amount_collected) || 0) + (Number(col.amount_withheld_2307) || 0), 0);

      custCollected += orphanCollected;

      const custNetBalance = custInvoiced - custCollected;
      if (custNetBalance > 0) {
        ar += custNetBalance;
      } else if (custNetBalance < 0) {
        customerAdvances += Math.abs(custNetBalance);
      }
    });

    // 2. Calculate Supplier Balances (Payables vs Supplier Debit Balances/Advances)
    const uniqueProvTins = new Set<string>();
    expenses.forEach(e => uniqueProvTins.add(e.sp_tin));
    payments.forEach(p => uniqueProvTins.add(p.sp_tin));

    let ap = 0; // Accounts Payable (Liability)
    let supplierAdvances = 0; // Supplier Debit Balance (Asset)

    uniqueProvTins.forEach(tin => {
      const provExpenses = expenses.filter(e => e.sp_tin === tin);
      // Net of discount: the actual amount owed to the provider for these vouchers
      const provInvoiced = provExpenses.reduce((sum, e) => sum + Math.max(0, (Number(e.expense_invoice_amount) || 0) - (Number(e.discounts) || 0)), 0);

      let provPaid = 0;
      provExpenses.forEach(e => {
        const vNo = normalizeDocNo(e.voucher_number);
        const pmts = payments.filter(p => normalizeDocNo(p.voucher_number) === vNo);
        if (pmts.length > 0) {
          provPaid += pmts.reduce((sum, p) => sum + (Number(p.amount_paid) || 0) + (Number(p.withholding_tax_2307) || 0), 0);
        } else {
          if (e.expense_status === 'Paid') {
            provPaid += Math.max(0, (Number(e.expense_invoice_amount) || 0) - (Number(e.discounts) || 0));
          }
        }
      });

      // Orphan payments for supplier
      const provVouchers = new Set(provExpenses.map(e => normalizeDocNo(e.voucher_number)));
      const orphanPmts = payments.filter(p => p.sp_tin === tin && !provVouchers.has(normalizeDocNo(p.voucher_number)));
      const orphanPaid = orphanPmts.reduce((sum, p) => sum + (Number(p.amount_paid) || 0) + (Number(p.withholding_tax_2307) || 0), 0);

      provPaid += orphanPaid;

      const provNetBalance = provInvoiced - provPaid;
      if (provNetBalance > 0) {
        ap += provNetBalance;
      } else if (provNetBalance < 0) {
        supplierAdvances += Math.abs(provNetBalance);
      }
    });

    // Special entries cash & capital impact
    // (This is also how a fresh company records its actual starting capital/cash -
    // there is no hardcoded seed balance; everything must be entered as a real transaction.)
    let specialCashImpact = 0;
    let capitalStock = 0;
    specialEntries.forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.account_code === '1010' || l.account_title.toLowerCase().includes('cash')) {
          if (l.type === 'Debit') specialCashImpact += amt;
          else specialCashImpact -= amt;
        }
        if (l.account_code === '3010') {
          if (l.type === 'Credit') capitalStock += amt;
          else capitalStock -= amt;
        }
      });
    });

    // 3. Cash & Cash Equivalents
    const cashFromColls = collections.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
    const cashPaidDirectSales = sales.reduce((sum, s) => {
      const invNo = normalizeDocNo(s.invoice_number);
      const collsForSale = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo);
      if (collsForSale.length === 0) {
        if (s.sales_status === 'Paid') {
          return sum + Math.max(0, (Number(s.invoice_amount) || 0) - (Number(s.discounts) || 0)) - (Number(s.withholding_2307) || 0);
        } else if (s.sales_status === 'Partial') {
          return sum + (Number(s.down_payment) || 0);
        }
      } else {
        return sum + (Number(s.down_payment) || 0);
      }
      return sum;
    }, 0);

    const cashPaidDirectExpenses = expenses.reduce((sum, e) => {
      const vNo = normalizeDocNo(e.voucher_number);
      const pmtsForExp = payments.filter(p => normalizeDocNo(p.voucher_number) === vNo);
      if (pmtsForExp.length === 0 && e.expense_status === 'Paid') {
        return sum + Math.max(0, (Number(e.expense_invoice_amount) || 0) - (Number(e.discounts) || 0)) - (Number(e.withholding_2307_2306) || 0);
      }
      return sum;
    }, 0);

    const cashPaymentsDisbursed = payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const ppeCashPaid = ppeAssets.reduce((sum, a) => sum + (Number(a.acquisition_cost) || 0), 0);

    // Net pay actually disbursed to employees (gross pay minus all statutory/other deductions)
    const netPayDisbursed = payrollRecords.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);
    const payrollDeductionsPayable = payrollRecords.reduce((sum, p) =>
      sum + (Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0) + (Number(p.withholding_tax) || 0) + (Number(p.other_deductions) || 0), 0);

    const cash = cashFromColls + cashPaidDirectSales + specialCashImpact - cashPaidDirectExpenses - cashPaymentsDisbursed - ppeCashPaid - netPayDisbursed;

    // 4. Other Assets
    const inputVat = expenses.reduce((sum, e) => sum + (Number(e.vat_input_amount) || 0), 0);
    // CWT asset: recognized either at invoicing (only for "Paid" sales that
    // have no Collection entries logged against them) or at collection time
    // (via the Collections module). Without the "no collections yet" check,
    // a Paid sale that also has Collections recorded against it (e.g. an
    // invoice marked Paid but still tracked via installment collections)
    // would have its withholding_2307 counted here AND again via the
    // matching Collection's own withheld amount below - double-counting it.
    const cwt2307 = sales.filter(s => {
      if (s.sales_status !== 'Paid') return false;
      const invNo = normalizeDocNo(s.invoice_number);
      return !collections.some(c => normalizeDocNo(c.invoice_number) === invNo);
    }).reduce((sum, s) => sum + (Number(s.withholding_2307) || 0), 0)
      + collections.reduce((sum, c) => sum + (Number(c.amount_withheld_2307) || 0), 0);

    const totalCurrentAssets = cash + ar + supplierAdvances + inputVat + cwt2307;

    // PPE Assets
    const ppeCost = ppeAssets.reduce((sum, a) => sum + (Number(a.acquisition_cost) || 0), 0);
    const accumDep = ppeAssets.reduce((sum, a) => sum + (Number(a.accumulated_depreciation) || 0), 0);
    const netPPE = ppeCost - accumDep;

    const totalAssets = totalCurrentAssets + netPPE;

    // 5. Liabilities
    const outputVat = sales.reduce((sum, s) => sum + (Number(s.output_vat) || 0), 0);
    // EWT payable: same recognition rule as CWT above, mirrored for expenses/payments -
    // only recognized here for "Paid" vouchers that have no Payment entries logged
    // against them yet, to avoid double-counting against the matching Payment's own
    // withheld amount.
    const ewtPayable = expenses.filter(e => {
      if (e.expense_status !== 'Paid') return false;
      const vNo = normalizeDocNo(e.voucher_number);
      return !payments.some(p => normalizeDocNo(p.voucher_number) === vNo);
    }).reduce((sum, e) => sum + (Number(e.withholding_2307_2306) || 0), 0)
      + payments.reduce((sum, p) => sum + (Number(p.withholding_tax_2307) || 0), 0);

    // 6. Net Profit Calculation (Revenues - Expenses - Depreciation - Payroll + Special Entries Net)
    const revenue = sales.reduce((sum, s) => sum + (Number(s.vatable_amount) || Number(s.vatable_sales) || 0) + (Number(s.vat_exempt_amount) || Number(s.vat_exempt) || 0) + (Number(s.zero_rated) || 0), 0);
    const totalOperatingExp = expenses.reduce((sum, e) => sum + (e.nonvat_or_vat === 'VAT' ? (Number(e.vatable_expense_amount) || Number(e.vatable_expense) || 0) : (Number(e.nonvat_expense_amount) || Number(e.expense_invoice_amount) || Number(e.amount) || 0)) + (Number(e.zero_rated) || 0) + (Number(e.vat_exempt) || 0), 0);
    const depreciationExpense = accumDep; // PPE Depreciation Expense
    const payrollExpense = payrollRecords.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0);

    // Special Entries Net Profit impact (excluding tax provision #7010)
    let specialRev = 0;
    let specialExp = 0;
    let provisionForTax = 0;
    let hasManualTaxEntry = false;

    specialEntries.forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.account_code === '7010') {
          hasManualTaxEntry = true;
          if (l.type === 'Debit') provisionForTax += amt;
          else provisionForTax -= amt;
        } else if (l.account_code.startsWith('4')) {
          if (l.type === 'Credit') specialRev += amt;
          else specialRev -= amt;
        } else if (l.account_code.startsWith('5') || l.account_code.startsWith('6') || l.account_code.startsWith('7')) {
          if (l.type === 'Debit') specialExp += amt;
          else specialExp -= amt;
        }
      });
    });

    const netIncomeBeforeTax = (revenue + specialRev) - (totalOperatingExp + depreciationExpense + payrollExpense + specialExp);
    
    if (!hasManualTaxEntry && netIncomeBeforeTax > 0) {
      provisionForTax = Math.round(netIncomeBeforeTax * 0.20 * 100) / 100;
    }

    const netIncome = netIncomeBeforeTax - provisionForTax;
    const incomeTaxProvision = provisionForTax;
    const incomeTaxPayable = provisionForTax;
    const totalLiabilities = ap + customerAdvances + outputVat + ewtPayable + payrollDeductionsPayable + incomeTaxPayable;

    const retainedEarnings = netIncome;
    const totalEquity = capitalStock + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    // Diagnostic only - should be ~0 if every module posts consistent double entries.
    // Not folded into Equity: a real discrepancy should be visible and investigated,
    // never silently plugged into the books.
    const unrealizedGainLoss = totalAssets - totalLiabilitiesAndEquity;

    return {
      cash,
      ar,
      supplierAdvances,
      inputVat,
      cwt2307,
      totalCurrentAssets,
      ppeCost,
      accumDep,
      netPPE,
      totalAssets,
      ap,
      customerAdvances,
      outputVat,
      ewtPayable,
      payrollDeductionsPayable,
      totalLiabilities,
      revenue,
      totalOperatingExp,
      depreciationExpense,
      payrollExpense,
      specialRev,
      specialExp,
      netIncomeBeforeTax,
      incomeTaxProvision,
      netIncome,
      capitalStock,
      retainedEarnings,
      unrealizedGainLoss,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01
    };
  }, [sales, collections, expenses, payments, ppeAssets, specialEntries, payrollRecords]);

  // Account Titles Auto-Arrangement Calculation for Audit Panel
  const arrangedAccounts = useMemo(() => {
    const list = accountTitles.length > 0 ? accountTitles : [
      { code: '1010', title: 'Cash and Cash Equivalents', type: 'Asset' },
      { code: '1020', title: 'Accounts Receivable', type: 'Asset' },
      { code: '1030', title: 'Creditable Input VAT', type: 'Asset' },
      { code: '1040', title: 'Creditable Withholding Tax (2307)', type: 'Asset' },
      { code: '1510', title: 'Property, Plant & Equipment', type: 'Asset' },
      { code: '1520', title: 'Accumulated Depreciation', type: 'Asset' },
      { code: '2010', title: 'Accounts Payable', type: 'Liability' },
      { code: '2020', title: 'Output VAT Payable', type: 'Liability' },
      { code: '2030', title: 'Expanded Withholding Tax Payable', type: 'Liability' },
      { code: '2050', title: 'SSS, PhilHealth & Pag-IBIG Payables', type: 'Liability' },
      { code: '3010', title: "Capital Stock / Owner's Equity", type: 'Equity' },
      { code: '3020', title: 'Retained Earnings', type: 'Equity' },
      { code: '4010', title: 'Sales Revenue', type: 'Revenue' },
      { code: '6010', title: 'Depreciation Expense', type: 'Expense' },
      { code: '6020', title: 'Salaries & Wages Expense', type: 'Expense' }
    ];

    // Assign computed balances
    return list.map(acc => {
      let dr = 0;
      let cr = 0;

      if (acc.code === '1010') { dr = bs.cash; }
      else if (acc.code === '1020') { dr = bs.ar; }
      else if (acc.code === '1030') { dr = bs.inputVat; }
      else if (acc.code === '1040') { dr = bs.cwt2307; }
      else if (acc.code === '1510') { dr = bs.ppeCost; }
      else if (acc.code === '1520') { cr = bs.accumDep; }
      else if (acc.code === '2010') { cr = bs.ap; }
      else if (acc.code === '2020') { cr = bs.outputVat; }
      else if (acc.code === '2030') { cr = bs.ewtPayable; }
      else if (acc.code === '2050') { cr = bs.payrollDeductionsPayable; }
      else if (acc.code === '3010') { cr = bs.capitalStock; }
      else if (acc.code === '3020') { cr = Math.max(0, bs.retainedEarnings); if (bs.retainedEarnings < 0) dr = Math.abs(bs.retainedEarnings); }
      else if (acc.code === '4010') { cr = bs.revenue + bs.specialRev; }
      else if (acc.code === '6010') { dr = bs.depreciationExpense; }
      else if (acc.code === '6020') { dr = bs.payrollExpense; }

      const net = (acc.type === 'Asset' || acc.type === 'Expense') ? (dr - cr) : (cr - dr);

      return {
        ...acc,
        debit: dr,
        credit: cr,
        netBalance: net
      };
    });
  }, [accountTitles, bs]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return arrangedAccounts;
    return arrangedAccounts.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    );
  }, [arrangedAccounts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Landmark className="w-6 h-6 text-cyan-400" />
              Statement of Financial Position (Balance Sheet)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Official statement of financial condition presenting Assets, Liabilities, and Equity for {companyName}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-cyan-400" />
              {showAuditPanel ? 'Hide Account Title Audit' : 'Auto-Compute & Trace Discrepancy'}
            </button>

            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
              bs.isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>BALANCE SHEET EQUATION PERFECTLY BALANCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* BALANCE SHEET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ASSETS */}
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
          <h3 className={`text-base font-bold font-display border-b ${theme.borderCard} pb-2 text-cyan-400 uppercase tracking-wider`}>
            ASSETS
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Assets</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Cash and Cash Equivalents</span>
              <span className="font-mono font-semibold">₱{bs.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Accounts Receivable (Net)</span>
              <span className="font-mono font-semibold">₱{bs.ar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.supplierAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-purple-400">
                <span>Advances to Suppliers (Supplier Debit Balance)</span>
                <span className="font-mono font-semibold">₱{bs.supplierAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Input VAT</span>
              <span className="font-mono font-semibold">₱{bs.inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Creditable Withholding Tax (2307)</span>
              <span className="font-mono font-semibold">₱{bs.cwt2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Total Current Assets</span>
              <span className="font-mono">₱{bs.totalCurrentAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Non-Current Assets</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Property, Plant & Equipment (Gross)</span>
              <span className="font-mono font-semibold">₱{bs.ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-rose-400">
              <span>Less: Accumulated Depreciation</span>
              <span className="font-mono font-semibold">(₱{bs.accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-cyan-400">
              <span>Net Fixed Assets (PPE)</span>
              <span className="font-mono">₱{bs.netPPE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-300 pt-3">
            <span>TOTAL ASSETS</span>
            <span className="font-mono">₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden p-5 space-y-4`}>
          <h3 className={`text-base font-bold font-display border-b ${theme.borderCard} pb-2 text-amber-400 uppercase tracking-wider`}>
            LIABILITIES & EQUITY
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Current Liabilities</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Accounts Payable</span>
              <span className="font-mono font-semibold">₱{bs.ap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.customerAdvances > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20 text-cyan-400 font-semibold">
                <span>Customer Advances (Customer Credit Balance)</span>
                <span className="font-mono">₱{bs.customerAdvances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Output VAT Payable</span>
              <span className="font-mono font-semibold">₱{bs.outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Expanded Withholding Tax Payable (0619-E)</span>
              <span className="font-mono font-semibold">₱{bs.ewtPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {bs.payrollDeductionsPayable > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
                <span className={theme.textMain}>SSS, PhilHealth, Pag-IBIG & Tax Withheld (Payroll)</span>
                <span className="font-mono font-semibold">₱{bs.payrollDeductionsPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-amber-400">
              <span>Total Current Liabilities</span>
              <span className="font-mono">₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Stockholders' Equity</span>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Capital Stock / Paid-in Capital</span>
              <span className="font-mono font-semibold">₱{bs.capitalStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-zinc-800/20">
              <span className={theme.textMain}>Retained Earnings (Net Income After Depreciation & Tax)</span>
              <span className={`font-mono font-semibold ${bs.retainedEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₱{bs.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold py-1.5 bg-zinc-500/10 px-2 rounded-lg text-purple-400">
              <span>Total Stockholders' Equity</span>
              <span className="font-mono">₱{bs.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 pt-3">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span className="font-mono">₱{bs.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {Math.abs(bs.unrealizedGainLoss) >= 0.01 && (
            <div className="flex justify-between text-xs font-semibold p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Out of Balance - Review Entries</span>
              <span className="font-mono">
                {bs.unrealizedGainLoss >= 0 ? `₱${bs.unrealizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `(₱${Math.abs(bs.unrealizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AUTO-COMPUTE & DISCREPANCY TRACEABILITY AUDIT PANEL */}
      {showAuditPanel && (
        <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-5 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/30 pb-4">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                <Layers className="w-4 h-4 text-cyan-400" />
                Auto-Compute & Account Title Discrepancy Traceability Breakdown
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Automatic arrangement of account codes and postings to easily trace and audit any variance between Assets and Liabilities + Equity.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search account title or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>
          </div>

          {/* TRACE DISCREPANCY ORIGIN SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-cyan-300 uppercase">1. Gross Assets</span>
              <div className="text-base font-bold font-mono text-cyan-400">₱{bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">Cash + Receivables + PPE Net + VAT/CWT</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-amber-300 uppercase">2. Total Liabilities</span>
              <div className="text-base font-bold font-mono text-amber-400">₱{bs.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">AP + Customer Advances + Output VAT + EWT</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase">3. Operating Net Income</span>
              <div className="text-base font-bold font-mono text-emerald-400">₱{bs.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-zinc-400">Sales - Expenses - Depreciation - Tax</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-purple-300 uppercase">4. Out-of-Balance Check</span>
              <div className={`text-base font-bold font-mono ${Math.abs(bs.unrealizedGainLoss) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bs.unrealizedGainLoss >= 0 ? `₱${bs.unrealizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `(₱${Math.abs(bs.unrealizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
              </div>
              <p className="text-[10px] text-zinc-400">{Math.abs(bs.unrealizedGainLoss) < 0.01 ? 'Books are balanced' : 'Assets vs. Liabilities + Equity - review entries'}</p>
            </div>
          </div>

          {/* ARRANGED ACCOUNT TITLES TABLE */}
          <div className="overflow-x-auto border border-zinc-800/40 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit Posting (Dr)</th>
                  <th className="p-3 text-right">Credit Posting (Cr)</th>
                  <th className="p-3 text-right">Net Financial Position</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {filteredAccounts.map((acc, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono font-bold text-cyan-400">{acc.code}</td>
                    <td className={`p-3 font-semibold ${theme.textMain}`}>{acc.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        acc.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400' :
                        acc.type === 'Liability' ? 'bg-amber-500/10 text-amber-400' :
                        acc.type === 'Equity' ? 'bg-purple-500/10 text-purple-400' :
                        acc.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-400">
                      ₱{acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-400">
                      ₱{acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${acc.netBalance > 0 ? 'text-cyan-400' : 'text-zinc-300'}`}>
                      ₱{acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
