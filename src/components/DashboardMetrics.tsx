import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Coins, 
  Receipt, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Tag, 
  FileText 
} from 'lucide-react';
import { Sale, Collection, Expense, Payment } from '../types';

interface DashboardMetricsProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  theme: any;
  activeTab: string;
}

export default function DashboardMetrics({
  sales,
  collections,
  expenses,
  payments,
  theme,
  activeTab
}: DashboardMetricsProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('dashboard_totals_collapsed');
    return saved === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      localStorage.setItem('dashboard_totals_collapsed', String(!prev));
      return !prev;
    });
  };

  // 1. Calculations - Sales Tab
  const salesMetrics = React.useMemo(() => {
    const totalInvoice = sales.reduce((sum, s) => sum + (Number(s.invoice_amount) || 0), 0);
    const totalOutputVat = sales.reduce((sum, s) => sum + (Number(s.output_vat) || 0), 0);
    
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // Total collected cash
    const baseColl = sales.reduce((sum, s) => {
      const invNo = normalizeDocNo(s.invoice_number);
      const collsForSale = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo);
      if (collsForSale.length > 0) {
        return sum + collsForSale.reduce((a, b) => a + (Number(b.amount_collected) || 0), 0) + (Number(s.down_payment) || 0);
      } else {
        if (s.sales_status === 'Paid') {
          return sum + (Number(s.invoice_amount) || 0);
        } else if (s.sales_status === 'Partial') {
          return sum + (Number(s.down_payment) || 0);
        } else {
          return sum;
        }
      }
    }, 0);

    // Add orphan collections
    const saleInvoiceNos = new Set(sales.map(s => normalizeDocNo(s.invoice_number)));
    const orphanColls = collections.filter(c => !saleInvoiceNos.has(normalizeDocNo(c.invoice_number)));
    const totalOrphanColl = orphanColls.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
    const totalColl = baseColl + totalOrphanColl;
    
    // Uncollected (Outstanding AR)
    const totalUncollected = sales.reduce((sum, s) => {
      const invAmt = Number(s.invoice_amount) || 0;
      const disc = Number(s.discounts) || 0;
      const dp = Number(s.down_payment) || 0;
      const invNo = normalizeDocNo(s.invoice_number);
      const collsForSale = collections.filter(c => normalizeDocNo(c.invoice_number) === invNo);

      if (collsForSale.length > 0) {
        const paid = collsForSale.reduce((a, b) => a + (Number(b.amount_collected) || 0) + (Number(b.amount_withheld_2307) || 0), 0) + dp;
        const rem = Math.max(0, invAmt - disc - paid);
        return sum + (isNaN(rem) ? 0 : rem);
      } else {
        if (s.sales_status === 'Paid') {
          return sum;
        } else if (s.sales_status === 'Partial') {
          const rem = Math.max(0, invAmt - disc - dp);
          return sum + (isNaN(rem) ? 0 : rem);
        } else {
          const rem = Math.max(0, invAmt - disc);
          return sum + (isNaN(rem) ? 0 : rem);
        }
      }
    }, 0);

    const total2307 = collections.reduce((sum, c) => sum + (Number(c.amount_withheld_2307) || 0), 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + (Number(s.discounts) || 0), 0);
    const totalNonVat = sales.reduce((sum, s) => sum + (Number(s.vat_exempt_amount) || 0), 0);

    return { totalInvoice, totalOutputVat, totalColl, totalUncollected, total2307, totalDiscounts, totalNonVat };
  }, [sales, collections]);

  // 2. Calculations - Collections Tab
  const collectionsMetrics = React.useMemo(() => {
    const totalColl = collections.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
    const total2307 = collections.reduce((sum, c) => sum + (Number(c.amount_withheld_2307) || 0), 0);
    const totalRemaining = collections.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    return { totalColl, total2307, totalRemaining };
  }, [collections]);

  // 3. Calculations - Expenses Tab
  const expensesMetrics = React.useMemo(() => {
    const totalInvoice = expenses.reduce((sum, e) => sum + (Number(e.expense_invoice_amount) || 0), 0);
    const totalInputVat = expenses.reduce((sum, e) => sum + (Number(e.vat_input_amount) || 0), 0);
    
    const normalizeDocNo = (num: string) => (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const basePayments = expenses.reduce((sum, e) => {
      const vNo = normalizeDocNo(e.voucher_number);
      const paymentsForExp = payments.filter(p => normalizeDocNo(p.voucher_number) === vNo);
      if (paymentsForExp.length > 0) {
        return sum + paymentsForExp.reduce((a, b) => a + (Number(b.amount_paid) || 0), 0);
      } else {
        if (e.expense_status === 'Paid') {
          return sum + (Number(e.expense_invoice_amount) || 0);
        } else {
          return sum;
        }
      }
    }, 0);
    
    // Add orphan payments
    const expenseVouchers = new Set(expenses.map(e => normalizeDocNo(e.voucher_number)));
    const orphanPayments = payments.filter(p => !expenseVouchers.has(normalizeDocNo(p.voucher_number)));
    const totalOrphanPayments = orphanPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const totalPayments = basePayments + totalOrphanPayments;

    const totalUnpaid = expenses.reduce((sum, e) => {
      const invAmt = Number(e.expense_invoice_amount) || 0;
      const disc = Number(e.discounts) || 0;
      const vNo = normalizeDocNo(e.voucher_number);
      const paymentsForExp = payments.filter(p => normalizeDocNo(p.voucher_number) === vNo);

      if (paymentsForExp.length > 0) {
        const paid = paymentsForExp.reduce((a, b) => a + (Number(b.amount_paid) || 0) + (Number(b.withholding_tax_2307) || 0), 0);
        const rem = Math.max(0, invAmt - disc - paid);
        return sum + (isNaN(rem) ? 0 : rem);
      } else {
        if (e.expense_status === 'Paid') {
          return sum;
        } else {
          const rem = Math.max(0, invAmt - disc);
          return sum + (isNaN(rem) ? 0 : rem);
        }
      }
    }, 0);

    const totalDiscounts = expenses.reduce((sum, e) => sum + (Number(e.discounts) || 0), 0);
    const totalNonVat = expenses.reduce((sum, e) => sum + (Number(e.nonvat_expense_amount) || 0), 0);

    return { totalInvoice, totalInputVat, totalPayments, totalUnpaid, totalDiscounts, totalNonVat };
  }, [expenses, payments]);

  // 4. Calculations - Payments Tab
  const paymentsMetrics = React.useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const total2307 = payments.reduce((sum, p) => sum + (Number(p.withholding_tax_2307) || 0), 0);
    const totalRemaining = payments.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
    return { totalPaid, total2307, totalRemaining };
  }, [payments]);

  // Render metric helper
  const renderCard = (title: string, value: number, sub: string, icon: React.ReactNode, isHighlighted = false) => (
    <div className={`p-3 rounded-xl border transition-all duration-200 shadow-xs flex flex-col justify-between ${
      isHighlighted 
        ? `${theme.accentBorder} bg-zinc-500/8` 
        : `${theme.borderInput} ${theme.bgInput}`
    }`}>
      <div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} flex items-center gap-1.5 mb-1`}>
          {icon}
          {title}
        </span>
        <p className={`font-display text-base font-extrabold ${isHighlighted ? theme.accentText : theme.textTitle} tracking-tight leading-none my-1`}>
          ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      <span className={`text-[9px] font-mono ${theme.isLight ? 'text-zinc-500 font-medium' : 'text-zinc-400 opacity-85'}`}>{sub}</span>
    </div>
  );

  return (
    <section className={`${theme.bgCard} border-b ${theme.borderCard} transition-all duration-200`}>
      <div className="max-w-[97%] mx-auto px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} font-mono`}>
            {activeTab.toUpperCase()} METRICS
          </span>
          <span className={`text-[10px] ${theme.isLight ? 'text-zinc-500 bg-slate-150' : 'bg-[#18181c] text-zinc-400'} border ${theme.borderCard} px-2 py-0.5 rounded-full font-mono`}>
            Dynamic Workspace Summaries
          </span>
        </div>
        <button 
          onClick={toggleCollapse}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${theme.borderCard} hover:bg-zinc-500/10 ${theme.textMuted} transition cursor-pointer select-none`}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show Workspace Totals</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
              <span>Collapse Panel</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="max-w-[97%] mx-auto px-6 pb-5 pt-1.5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 transition-all duration-300">
          
          {/* Sales Workspace */}
          {activeTab === 'sales' && (
            <>
              {renderCard("Gross Invoice", salesMetrics.totalInvoice, "Total invoice amount", <TrendingUp className="w-3.5 h-3.5 text-blue-500" />)}
              {renderCard("Output VAT", salesMetrics.totalOutputVat, "12% Output VAT", <Percent className="w-3.5 h-3.5 text-cyan-500" />)}
              {renderCard("Total Collected", salesMetrics.totalColl, "Settled sales", <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />)}
              {renderCard("Outstanding AR", salesMetrics.totalUncollected, "Uncollected receivables", <Coins className="w-3.5 h-3.5 text-amber-500" />, true)}
              {renderCard("Form 2307 Tax", salesMetrics.total2307, "1% Withheld tax", <FileText className="w-3.5 h-3.5 text-violet-500" />)}
              {renderCard("Sales Discounts", salesMetrics.totalDiscounts, "Applied discounts", <Tag className="w-3.5 h-3.5 text-rose-500" />)}
              {renderCard("Non-VAT Sales", salesMetrics.totalNonVat, "Zero rated / exempt", <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />)}
            </>
          )}

          {/* Collections Workspace */}
          {activeTab === 'collections' && (
            <>
              {renderCard("Cash Collections", collectionsMetrics.totalColl, "Total cash received", <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />, true)}
              {renderCard("Withheld 2307", collectionsMetrics.total2307, "Tax credits collected", <FileText className="w-3.5 h-3.5 text-violet-500" />)}
              {renderCard("Outstanding Balance", collectionsMetrics.totalRemaining, "Auto compute", <Coins className="w-3.5 h-3.5 text-amber-500" />)}
              <div className={`p-3 rounded-xl border ${theme.borderInput} bg-zinc-500/2 flex items-center justify-center text-center text-zinc-500 font-mono text-[10px]`}>
                Cash Collected + 2307 Tax Credit matches Invoice Amount
              </div>
            </>
          )}

          {/* Expenses Workspace */}
          {activeTab === 'expenses' && (
            <>
              {renderCard("Gross Expenses", expensesMetrics.totalInvoice, "Invoiced vouchers", <TrendingUp className="w-3.5 h-3.5 text-rose-500" />)}
              {renderCard("Input VAT", expensesMetrics.totalInputVat, "12% Input VAT", <Percent className="w-3.5 h-3.5 text-cyan-500" />)}
              {renderCard("Total Disbursed", expensesMetrics.totalPayments, "Settled payables", <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />)}
              {renderCard("Accounts Payable", expensesMetrics.totalUnpaid, "Outstanding liabilities", <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />, true)}
              {renderCard("Discounts", expensesMetrics.totalDiscounts, "Expense discounts", <Tag className="w-3.5 h-3.5 text-slate-400" />)}
              {renderCard("Non-VAT Expenses", expensesMetrics.totalNonVat, "Exempt/Non-VAT providers", <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />)}
              <div className={`p-3 rounded-xl border ${theme.borderInput} bg-zinc-500/2 flex items-center justify-center text-center text-zinc-500 font-mono text-[10px]`}>
                Liabilities track AP balances
              </div>
            </>
          )}

          {/* Payments Workspace */}
          {activeTab === 'payments' && (
            <>
              {renderCard("Cash Disbursements", paymentsMetrics.totalPaid, "Cash settled to providers", <DollarSign className="w-3.5 h-3.5 text-rose-500" />, true)}
              {renderCard("Withheld 2307", paymentsMetrics.total2307, "Creditable tax certificates", <FileText className="w-3.5 h-3.5 text-violet-500" />)}
              {renderCard("Remaining Liability", paymentsMetrics.totalRemaining, "Liability outstanding balance", <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />)}
              <div className={`p-3 rounded-xl border ${theme.borderInput} bg-zinc-500/2 flex items-center justify-center text-center text-zinc-500 font-mono text-[10px]`}>
                Cash Disbursed + Withholding matches Gross Expense
              </div>
            </>
          )}

          {/* Fallback & Other workspaces (Companies, Customers, Providers, Dashboard) */}
          {!['sales', 'collections', 'expenses', 'payments'].includes(activeTab) && (
            <>
              {renderCard("Gross Sales", salesMetrics.totalInvoice, "Total revenue invoiced", <TrendingUp className="w-3.5 h-3.5 text-blue-500" />)}
              {renderCard("Collections", salesMetrics.totalColl, "Cash collected", <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />)}
              {renderCard("Gross Expenses", expensesMetrics.totalInvoice, "Incurred operating costs", <Receipt className="w-3.5 h-3.5 text-rose-500" />)}
              {renderCard("Disbursements", expensesMetrics.totalPayments, "Settled payments", <DollarSign className="w-3.5 h-3.5 text-violet-500" />)}
              {renderCard("Outstanding AR", salesMetrics.totalUncollected, "Uncollected receivables", <Coins className="w-3.5 h-3.5 text-amber-500" />, true)}
              {renderCard("Accounts Payable", expensesMetrics.totalUnpaid, "Outstanding liabilities", <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />)}
              {renderCard("Net Cash Flow", (salesMetrics.totalColl - expensesMetrics.totalPayments), "Inward cash vs Outward cash", <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />)}
            </>
          )}

        </div>
      )}
    </section>
  );
}
