import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Coins, 
  Receipt, 
  DollarSign, 
  Users, 
  Truck, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Scale,
  Calculator,
  ShieldCheck,
  HardDrive,
  Percent,
  PieChart,
  Activity,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Sale, 
  Collection, 
  Expense, 
  Payment, 
  Company, 
  Customer, 
  ServiceProvider,
  PayrollRecord,
  Employee,
  PPEAsset,
  SpecialEntry,
  IncomeTaxRecord
} from '../types';
import TaxCalendarTab from './TaxCalendarTab';

interface ExecutiveDashboardProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  companies: Company[];
  customers: Customer[];
  serviceProviders: ServiceProvider[];
  payrollRecords?: PayrollRecord[];
  employees?: Employee[];
  ppeAssets?: PPEAsset[];
  specialEntries?: SpecialEntry[];
  incomeTaxRecords?: IncomeTaxRecord[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ExecutiveDashboard({
  sales,
  collections,
  expenses,
  payments,
  companies,
  customers,
  serviceProviders,
  payrollRecords = [],
  employees = [],
  ppeAssets = [],
  specialEntries = [],
  incomeTaxRecords = [],
  activeCompany,
  theme,
  triggerAlert
}: ExecutiveDashboardProps) {

  // 1. Comprehensive Calculations across all accounting aspects
  const stats = useMemo(() => {
    const compName = activeCompany?.company_name || '';
    
    // Filtered by active company
    const compSales = sales.filter(s => s.company_name === compName);
    const compColls = collections.filter(c => c.company_name === compName);
    const compExp = expenses.filter(e => e.company_name === compName);
    const compPay = payments.filter(p => p.company_name === compName);
    const compPayroll = payrollRecords.filter(p => p.company_name === compName);
    const compEmps = employees.filter(e => e.company_name === compName);
    const compPpe = ppeAssets.filter(p => p.company_name === compName);
    const compTax = incomeTaxRecords.filter(t => t.company_name === compName);

    // Sales & AR
    const grossSales = compSales.reduce((sum, s) => sum + (s.invoice_amount - (s.discounts || 0)), 0);
    const outputVat = compSales.reduce((sum, s) => sum + s.output_vat, 0);
    
    // Collections & Cash In
    const baseCashCollected = compSales.reduce((sum, s) => {
      const collsForSale = compColls.filter(c => c.invoice_number.toLowerCase() === s.invoice_number.toLowerCase());
      if (collsForSale.length > 0) {
        return sum + collsForSale.reduce((a, b) => a + b.amount_collected, 0) + s.down_payment;
      } else {
        if (s.sales_status === 'Paid') {
          return sum + s.invoice_amount - (s.discounts || 0);
        } else if (s.sales_status === 'Partial') {
          return sum + s.down_payment;
        } else {
          return sum;
        }
      }
    }, 0);

    const saleInvoiceNos = new Set(compSales.map(s => s.invoice_number.toLowerCase()));
    const orphanColls = compColls.filter(c => !saleInvoiceNos.has(c.invoice_number.toLowerCase()));
    const orphanCashCollected = orphanColls.reduce((sum, c) => sum + c.amount_collected, 0);
    const cashCollected = baseCashCollected + orphanCashCollected;

    const withholdingCollected = compColls.reduce((sum, c) => sum + c.amount_withheld_2307, 0);
    const totalCollected = cashCollected + withholdingCollected;

    const outstandingAR = compSales.reduce((sum, s) => {
      const colMatches = compColls.filter(c => c.invoice_number.toLowerCase() === s.invoice_number.toLowerCase());
      if (colMatches.length > 0) {
        const paid = colMatches.reduce((a, b) => a + b.amount_collected + b.amount_withheld_2307, 0) + s.down_payment;
        return sum + Math.max(0, s.invoice_amount - (s.discounts || 0) - paid);
      } else {
        if (s.sales_status === 'Paid') {
          return sum;
        } else if (s.sales_status === 'Partial') {
          return sum + Math.max(0, s.invoice_amount - (s.discounts || 0) - s.down_payment);
        } else {
          return sum + s.invoice_amount - (s.discounts || 0);
        }
      }
    }, 0);

    // Expenses & AP
    const grossExpenses = compExp.reduce((sum, e) => sum + (e.expense_invoice_amount - (e.discounts || 0)), 0);
    const inputVat = compExp.reduce((sum, e) => sum + e.vat_input_amount, 0);
    
    const baseCashPaid = compExp.reduce((sum, e) => {
      const payMatches = compPay.filter(p => p.voucher_number.toLowerCase() === e.voucher_number.toLowerCase());
      if (payMatches.length > 0) {
        return sum + payMatches.reduce((a, b) => a + b.amount_paid, 0);
      } else {
        if (e.expense_status === 'Paid') {
          return sum + e.expense_invoice_amount - (e.discounts || 0);
        } else {
          return sum;
        }
      }
    }, 0);

    const expenseVouchers = new Set(compExp.map(e => e.voucher_number.toLowerCase()));
    const orphanPayments = compPay.filter(p => !expenseVouchers.has(p.voucher_number.toLowerCase()));
    const orphanCashPaid = orphanPayments.reduce((sum, p) => sum + p.amount_paid, 0);
    const cashPaid = baseCashPaid + orphanCashPaid;

    const withholdingPaid = compPay.reduce((sum, p) => sum + p.withholding_tax_2307, 0);
    const totalPaid = cashPaid + withholdingPaid;

    const outstandingAP = compExp.reduce((sum, e) => {
      const payMatches = compPay.filter(p => p.voucher_number.toLowerCase() === e.voucher_number.toLowerCase());
      if (payMatches.length > 0) {
        const paid = payMatches.reduce((a, b) => a + b.amount_paid + b.withholding_tax_2307, 0);
        return sum + Math.max(0, e.expense_invoice_amount - (e.discounts || 0) - paid);
      } else {
        if (e.expense_status === 'Paid') {
          return sum;
        } else {
          return sum + e.expense_invoice_amount - (e.discounts || 0);
        }
      }
    }, 0);

    // Payroll Summary
    const payrollGross = compPayroll.reduce((sum, p) => sum + p.gross_pay, 0);
    const payrollSssEE = compPayroll.reduce((sum, p) => sum + p.sss_deduction, 0);
    const payrollPhicEE = compPayroll.reduce((sum, p) => sum + p.philhealth_deduction, 0);
    const payrollHdmfEE = compPayroll.reduce((sum, p) => sum + p.pagibig_deduction, 0);
    const payrollTaxEE = compPayroll.reduce((sum, p) => sum + p.withholding_tax, 0);
    const payrollNet = compPayroll.reduce((sum, p) => sum + p.net_pay, 0);
    const payrollOtherDeductions = compPayroll.reduce((sum, p) => sum + (p.other_deductions || 0), 0);
    const totalEEDeductions = payrollSssEE + payrollPhicEE + payrollHdmfEE + payrollTaxEE + payrollOtherDeductions;

    // Estimated Employer Statutory Contributions (approx 9.5% SSS + 2.5% PHIC + HDMF)
    const erSss = compPayroll.reduce((sum, p) => sum + Math.round((p.basic_pay || 0) * 0.095 * 100) / 100, 0);
    const erPhic = compPayroll.reduce((sum, p) => sum + p.philhealth_deduction, 0); // Equal match
    const erHdmf = compPayroll.reduce((sum, p) => sum + p.pagibig_deduction, 0); // Equal match
    const totalERContributions = erSss + erPhic + erHdmf;

    // Property, Plant & Equipment (PPE)
    const ppeTotalCost = compPpe.reduce((sum, asset) => sum + asset.acquisition_cost, 0);
    const ppeAccumulatedDep = compPpe.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0);
    const ppeNetBookValue = compPpe.reduce((sum, asset) => sum + asset.net_book_value, 0);

    // Taxation
    const netVatPosition = outputVat - inputVat; // Positive = VAT Payable, Negative = Input VAT Credit
    const totalIncomeTaxProvision = compTax.reduce((sum, t) => sum + (t.computed_tax_due || 0), 0);

    // Cash Position & Working Capital
    const netOperatingCashFlow = cashCollected - cashPaid - payrollNet;
    const currentAssets = cashCollected + outstandingAR + (netVatPosition < 0 ? Math.abs(netVatPosition) : 0);
    const currentLiabilities = outstandingAP + (netVatPosition > 0 ? netVatPosition : 0) + payrollTaxEE + (payrollSssEE + payrollPhicEE + payrollHdmfEE);

    // Accounting Ratios
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 10.0 : 1.0);
    const quickRatio = currentLiabilities > 0 ? ((cashCollected + outstandingAR) / currentLiabilities) : 1.0;
    const grossProfitMargin = grossSales > 0 ? (((grossSales - grossExpenses) / grossSales) * 100) : 0;
    const netOperatingMargin = grossSales > 0 ? (((grossSales - grossExpenses - payrollGross - totalERContributions) / grossSales) * 100) : 0;
    const collectionEfficiency = grossSales > 0 ? ((totalCollected / grossSales) * 100) : 0;
    const paymentSettlementRate = grossExpenses > 0 ? ((totalPaid / grossExpenses) * 100) : 0;
    const assetTurnover = ppeNetBookValue > 0 ? (grossSales / ppeNetBookValue) : 0;

    return {
      grossSales,
      outputVat,
      cashCollected,
      withholdingCollected,
      totalCollected,
      outstandingAR,
      grossExpenses,
      inputVat,
      cashPaid,
      withholdingPaid,
      totalPaid,
      outstandingAP,
      payrollGross,
      payrollSssEE,
      payrollPhicEE,
      payrollHdmfEE,
      payrollTaxEE,
      payrollNet,
      totalEEDeductions,
      totalERContributions,
      erSss,
      erPhic,
      erHdmf,
      ppeTotalCost,
      ppeAccumulatedDep,
      ppeNetBookValue,
      ppeCount: compPpe.length,
      netVatPosition,
      totalIncomeTaxProvision,
      netOperatingCashFlow,
      currentAssets,
      currentLiabilities,
      // Ratios
      currentRatio,
      quickRatio,
      grossProfitMargin,
      netOperatingMargin,
      collectionEfficiency,
      paymentSettlementRate,
      assetTurnover,
      // Counts
      salesCount: compSales.length,
      expensesCount: compExp.length,
      payrollCount: compPayroll.length,
      employeesCount: compEmps.length,
      customersCount: customers.filter(c => c.company_name === compName).length,
      providersCount: serviceProviders.filter(p => p.company_name === compName).length
    };
  }, [sales, collections, expenses, payments, payrollRecords, employees, ppeAssets, incomeTaxRecords, activeCompany, customers, serviceProviders]);

  // 2. Prepare Monthly Trend Chart Data
  const chartData = useMemo(() => {
    const compName = activeCompany?.company_name || '';
    const compSales = sales.filter(s => s.company_name === compName);
    const compColls = collections.filter(c => c.company_name === compName);
    const compExp = expenses.filter(e => e.company_name === compName);
    const compPay = payments.filter(p => p.company_name === compName);
    const compPayroll = payrollRecords.filter(p => p.company_name === compName);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return months.map((month, idx) => {
      const monthStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
      
      const salesInMonth = compSales.filter(s => (s.invoice_date || '').includes(`-${monthStr}-`));
      const collsInMonth = compColls.filter(c => (c.collection_date || '').includes(`-${monthStr}-`));
      const expInMonth = compExp.filter(e => (e.expense_date || '').includes(`-${monthStr}-`));
      const payInMonth = compPay.filter(p => (p.payment_date || '').includes(`-${monthStr}-`));
      const payrollInMonth = compPayroll.filter(p => (p.payroll_period || '').includes(`-${monthStr}-`));

      const salesVal = salesInMonth.reduce((sum, s) => sum + s.invoice_amount, 0);
      const collectionsVal = collsInMonth.reduce((sum, c) => sum + c.amount_collected, 0);
      const expensesVal = expInMonth.reduce((sum, e) => sum + e.expense_invoice_amount, 0);
      const paymentsVal = payInMonth.reduce((sum, p) => sum + p.amount_paid, 0);
      const payrollVal = payrollInMonth.reduce((sum, p) => sum + p.net_pay, 0);

      const netCash = collectionsVal - paymentsVal - payrollVal;

      return {
        name: month,
        Sales: Math.round(salesVal),
        Collections: Math.round(collectionsVal),
        Expenses: Math.round(expensesVal),
        Disbursements: Math.round(paymentsVal),
        Payroll: Math.round(payrollVal),
        NetCash: Math.round(netCash)
      };
    });
  }, [sales, collections, expenses, payments, payrollRecords, activeCompany]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* HEADER BANNER */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-sm`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.accentText} bg-zinc-500/10 px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5`}>
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Executive Intelligence & Master Ledger
              </span>
            </div>
            <h2 className={`font-display font-extrabold text-xl ${theme.textTitle} mt-2 flex items-center gap-2`}>
              Executive Financial & Operational Summary
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Consolidated real-time analytics, accounting ratios, and aspect summaries for <span className="font-semibold text-cyan-400">{activeCompany?.company_name || "No Company Selected"}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-xl font-mono border ${theme.borderCard} ${theme.bgInput} ${theme.textMain} shadow-xs`}>
              TIN: <span className="font-bold text-amber-400">{activeCompany?.company_tin || "N/A"}</span>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Synced
            </span>
          </div>
        </div>
      </div>

      {!activeCompany && (
        <div className={`${theme.bgCard} border border-amber-500/30 rounded-2xl p-5 shadow-sm flex items-center gap-3`}>
          <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className={`text-xs ${theme.textMuted}`}>
            No company profile is selected. Head to the <span className="font-semibold text-amber-400">Companies</span> tab to activate a workspace - your metrics will calculate automatically.
          </p>
        </div>
      )}

      {/* SECTION 1: CORE ACCOUNTING RATIOS & LIQUIDITY MATRIX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`font-display font-bold text-xs uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
            <Scale className="w-4 h-4 text-cyan-400" />
            Key Accounting Ratios & Financial Indicators
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">Evaluated on current ledger balances</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Ratio */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4 shadow-sm relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current Ratio</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stats.currentRatio >= 1.5 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
                {stats.currentRatio >= 1.5 ? 'Strong Liquidity' : 'Adequate'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-mono ${theme.textTitle}`}>
                {stats.currentRatio.toFixed(2)}x
              </span>
              <span className="text-xs text-zinc-500 font-mono">CA / CL</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              Current Assets ₱{stats.currentAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs Liabilities ₱{stats.currentLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Quick Ratio */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4 shadow-sm relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Ratio (Acid Test)</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stats.quickRatio >= 1.0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                {stats.quickRatio >= 1.0 ? 'High Solvent' : 'Tight Solvent'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-mono ${theme.textTitle}`}>
                {stats.quickRatio.toFixed(2)}x
              </span>
              <span className="text-xs text-zinc-500 font-mono">Quick Assets / CL</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              Cash & AR ₱{(stats.cashCollected + stats.outstandingAR).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Gross Profit Margin */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4 shadow-sm relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gross Profit Margin</span>
              <span className="text-teal-400 font-mono text-[10px] font-bold bg-teal-400/10 px-2 py-0.5 rounded-full">Revenue Spread</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-mono ${stats.grossProfitMargin >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {stats.grossProfitMargin.toFixed(1)}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">(Sales - Exp) / Sales</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              Gross Revenue Spread: ₱{(stats.grossSales - stats.grossExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Net Operating Margin */}
          <div className={`${theme.bgCard} border ${theme.accentBorder} rounded-2xl p-4 shadow-sm relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Operating Margin</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stats.netOperatingMargin >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                {stats.netOperatingMargin >= 0 ? 'Profitable' : 'Deficit'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-mono ${stats.netOperatingMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.netOperatingMargin.toFixed(1)}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">Net Operating Spread</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              Net Surplus: ₱{(stats.grossSales - stats.grossExpenses - stats.payrollGross - stats.totalERContributions).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPREHENSIVE ASPECT SUMMARY REPORTS GRID */}
      <div className="space-y-3">
        <h3 className={`font-display font-bold text-xs uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
          <Layers className="w-4 h-4 text-teal-400" />
          Consolidated Aspect Summaries & Ledger Reports
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* ASPECT 1: Sales & Accounts Receivable */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-teal-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>1. Sales & Revenue Aspect</h4>
              </div>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full font-bold">
                {stats.salesCount} Invoices
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Gross Invoiced Sales:</span>
                <span className={`font-bold ${theme.textMain}`}>₱{stats.grossSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Output VAT (12%):</span>
                <span className="text-cyan-400">₱{stats.outputVat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Total Cash Collected:</span>
                <span className="text-emerald-400 font-bold">₱{stats.cashCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Form 2307 Withheld:</span>
                <span className="text-purple-400">₱{stats.withholdingCollected.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">Uncollected AR Balance:</span>
              <span className="text-amber-400 font-bold">₱{stats.outstandingAR.toLocaleString()}</span>
            </div>
          </div>

          {/* ASPECT 2: Procurement & Operating Expenses */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-rose-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>2. Expenses & Procurement</h4>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full font-bold">
                {stats.expensesCount} Vouchers
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Incurred Expenses:</span>
                <span className={`font-bold ${theme.textMain}`}>₱{stats.grossExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Input VAT (12%):</span>
                <span className="text-cyan-400">₱{stats.inputVat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Disbursements Settled:</span>
                <span className="text-rose-400 font-bold">₱{stats.cashPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>EWT 2307 Deduction:</span>
                <span className="text-purple-400">₱{stats.withholdingPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">Outstanding AP Balance:</span>
              <span className="text-rose-400 font-bold">₱{stats.outstandingAP.toLocaleString()}</span>
            </div>
          </div>

          {/* ASPECT 3: Payroll & Statutory Contributions */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-amber-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>3. Payroll & Statutory</h4>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-bold">
                {stats.employeesCount} Employees
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Gross Compensation:</span>
                <span className={`font-bold ${theme.textMain}`}>₱{stats.payrollGross.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>EE Statutory Deductions:</span>
                <span className="text-amber-400">₱{stats.totalEEDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>ER Contribution Expense:</span>
                <span className="text-rose-400 font-bold">₱{stats.totalERContributions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Net Pay Disbursed:</span>
                <span className="text-emerald-400 font-bold">₱{stats.payrollNet.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">ER Statutory Breakdown:</span>
              <span className="text-zinc-300 text-[10px]">SSS ₱{stats.erSss.toLocaleString()} | PHIC ₱{stats.erPhic.toLocaleString()}</span>
            </div>
          </div>

          {/* ASPECT 4: Capital Assets & PPE Depreciation */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-cyan-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>4. Capital Assets (PPE)</h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-bold">
                {stats.ppeCount} Assets
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Asset Acquisition Cost:</span>
                <span className={`font-bold ${theme.textMain}`}>₱{stats.ppeTotalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Accumulated Depreciation:</span>
                <span className="text-rose-400">₱{stats.ppeAccumulatedDep.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Asset Efficiency Ratio:</span>
                <span className="text-cyan-400 font-bold">{stats.assetTurnover.toFixed(2)}x</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">Net Book Value (NBV):</span>
              <span className="text-cyan-400 font-bold">₱{stats.ppeNetBookValue.toLocaleString()}</span>
            </div>
          </div>

          {/* ASPECT 5: Taxation & BIR Compliance */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-purple-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>5. BIR Tax Compliance</h4>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full font-bold">
                Form 2550Q / 1702
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Output VAT Collected:</span>
                <span className="text-cyan-400 font-bold">₱{stats.outputVat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Input VAT Claimable:</span>
                <span className="text-emerald-400 font-bold">₱{stats.inputVat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Withholding Tax Compensation:</span>
                <span className="text-amber-400">₱{stats.payrollTaxEE.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">Net VAT Position:</span>
              <span className={`font-bold ${stats.netVatPosition >= 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                {stats.netVatPosition >= 0 ? `₱${stats.netVatPosition.toLocaleString()} Payable` : `₱${Math.abs(stats.netVatPosition).toLocaleString()} Credit`}
              </span>
            </div>
          </div>

          {/* ASPECT 6: Cash Flow & Liquidity */}
          <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-emerald-500/40 transition-all`}>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold ${theme.textTitle} uppercase`}>6. Operating Cash Flow</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-bold">
                Liquidity
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Total Cash In (Collections):</span>
                <span className="text-emerald-400 font-bold">₱{stats.cashCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Vendor Disbursements:</span>
                <span className="text-rose-400 font-bold">₱{stats.cashPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Net Payroll Disbursements:</span>
                <span className="text-amber-400 font-bold">₱{stats.payrollNet.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center text-[11px] font-mono">
              <span className="text-zinc-400 font-semibold">Net Cash Surplus/Deficit:</span>
              <span className={`font-bold ${stats.netOperatingCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₱{stats.netOperatingCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: VISUAL TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Collections Chart */}
        <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-sm`}>
          <h3 className={`font-display font-semibold text-xs ${theme.textTitle} uppercase tracking-wider mb-4 flex items-center gap-1.5`}>
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Monthly Revenue Invoiced vs Cash Collections
          </h3>
          <div className="h-72 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorColls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" opacity={0.3} />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.isLight ? '#ffffff' : '#121215', 
                    borderColor: theme.isLight ? '#e4e4e7' : '#27272a',
                    color: theme.isLight ? '#09090b' : '#f4f4f5' 
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="Sales" stroke="#14b8a6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Collections" stroke="#10b981" fillOpacity={1} fill="url(#colorColls)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses vs Disbursements & Payroll Chart */}
        <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-5 shadow-sm`}>
          <h3 className={`font-display font-semibold text-xs ${theme.textTitle} uppercase tracking-wider mb-4 flex items-center gap-1.5`}>
            <Receipt className="w-4 h-4 text-rose-400" />
            Expenses Incurred vs Disbursements & Payroll
          </h3>
          <div className="h-72 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" opacity={0.3} />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.isLight ? '#ffffff' : '#121215', 
                    borderColor: theme.isLight ? '#e4e4e7' : '#27272a',
                    color: theme.isLight ? '#09090b' : '#f4f4f5' 
                  }} 
                />
                <Legend />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Disbursements" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Payroll" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* QUICK OPERATIONAL QUICK METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${theme.bgCard} border ${theme.borderCard} p-4 rounded-xl flex items-center gap-3`}>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">Customers Registered</span>
            <span className={`text-base font-bold ${theme.textTitle}`}>{stats.customersCount} Profiles</span>
          </div>
        </div>

        <div className={`${theme.bgCard} border ${theme.borderCard} p-4 rounded-xl flex items-center gap-3`}>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">Providers Connected</span>
            <span className={`text-base font-bold ${theme.textTitle}`}>{stats.providersCount} Providers</span>
          </div>
        </div>

        <div className={`${theme.bgCard} border ${theme.borderCard} p-4 rounded-xl flex items-center gap-3`}>
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">Active Company</span>
            <span className={`text-sm font-bold ${theme.textTitle} truncate max-w-[130px] block`}>{activeCompany?.company_name || 'None'}</span>
          </div>
        </div>

        <div className={`${theme.bgCard} border ${theme.borderCard} p-4 rounded-xl flex items-center gap-3`}>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">System Sync</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              Live Ledger Synced
            </span>
          </div>
        </div>
      </div>

      {/* EMBEDDED TAX CALENDAR & FILING SCHEDULE PREVIEW */}
      <div className="mt-6 pt-6 border-t border-zinc-800/40">
        <TaxCalendarTab activeCompany={activeCompany} theme={theme} triggerAlert={triggerAlert} />
      </div>
    </div>
  );
}

