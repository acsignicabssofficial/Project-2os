import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Line,
  PieChart,
  Pie,
  Cell
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
  Activity,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Pencil,
  ArrowRight,
  HelpCircle,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Landmark,
  FileCheck,
  Clock,
  AlertTriangle,
  ListChecks,
  CheckSquare,
  Square,
  Target,
  CircleDot,
  Award
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
  IncomeTaxRecord,
  ThemeMode
} from '../types';
import ActivitiesWorkflow from './ActivitiesWorkflow';
import { computeAccountingSummaries } from '../utils/accounting';

interface ExecutiveDashboardProps {
  sales: Sale[];
  collections: Collection[];
  cashReceipts?: any[];
  expenses: Expense[];
  payments: Payment[];
  cashDisbursements?: any[];
  companies: Company[];
  customers: Customer[];
  serviceProviders: ServiceProvider[];
  payrollRecords?: PayrollRecord[];
  employees?: Employee[];
  ppeAssets?: PPEAsset[];
  specialEntries?: SpecialEntry[];
  accountTitles?: any[];
  incomeTaxRecords?: IncomeTaxRecord[];
  activeCompany: Company | null;
  theme: any;
  themeMode?: ThemeMode;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  selectedMonthIdx?: number;
  selectedYear?: number;
  selectedPrefix?: string;
  onMonthYearChange?: (monthIdx: number, year: number, prefix: string) => void;
}

const DASH_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExecutiveDashboard({
  sales,
  collections,
  cashReceipts = [],
  expenses,
  payments,
  cashDisbursements = [],
  companies,
  customers,
  serviceProviders,
  payrollRecords = [],
  employees = [],
  ppeAssets = [],
  specialEntries = [],
  accountTitles = [],
  incomeTaxRecords = [],
  activeCompany,
  theme,
  themeMode,
  triggerAlert,
  selectedMonthIdx: propMonthIdx = 7,
  selectedYear: propYear = 2026,
  selectedPrefix: propPrefix = 'FOR THE MONTH OF',
  onMonthYearChange
}: ExecutiveDashboardProps) {
  const isTrial = themeMode === 'trial_layout';

  // Executive Dashboard Controls
  const [privacyMode, setPrivacyMode] = useState(false);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(propMonthIdx);
  const [currentYear, setCurrentYear] = useState(propYear);
  const [periodFilterMode, setPeriodFilterMode] = useState<'month' | 'year'>(
    propPrefix.includes('YEAR') ? 'year' : 'month'
  );

  useEffect(() => {
    setCurrentMonthIdx(propMonthIdx);
    setCurrentYear(propYear);
    if (propPrefix.includes('YEAR')) {
      setPeriodFilterMode('year');
    }
  }, [propMonthIdx, propYear, propPrefix]);

  const handlePeriodChange = (month: number, year: number, mode: 'month' | 'year') => {
    setCurrentMonthIdx(month);
    setCurrentYear(year);
    setPeriodFilterMode(mode);
    const prefix = mode === 'year' ? 'FOR THE YEAR ENDED' : 'FOR THE MONTH OF';
    if (onMonthYearChange) {
      onMonthYearChange(month, year, prefix);
    }
    triggerAlert(`Dashboard period synchronized to ${mode === 'year' ? `Full Year ${year}` : `${DASH_MONTH_NAMES[month]} ${year}`}`, 'info');
  };

  const [expensePeriod, setExpensePeriod] = useState<'Last month' | 'This Quarter' | 'This Year' | 'All time'>('Last month');
  const [pnlPeriod, setPnlPeriod] = useState<'Last month' | 'This Quarter' | 'This Year' | 'All time'>('Last month');
  const [salesPeriod, setSalesPeriod] = useState<'Last month' | 'Quarterly' | 'Annual'>('Quarterly');
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Activity Tasks Summary State (synchronized with ActivitiesWorkflow)
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    completedPercent: 0
  });

  // Tabulated Dashboard state: TRANSACTIONS, TOP, ACTIVITIES
  const [activeDashTab, setActiveDashTab] = useState<'TRANSACTIONS' | 'TOP' | 'ACTIVITIES'>('TRANSACTIONS');

  // Helper to mask or format currency based on Privacy Mode
  const fmtMoney = (val: number, options?: { minimumFractionDigits?: number, maximumFractionDigits?: number }) => {
    if (privacyMode) return '••••••';
    const num = Number(val) || 0;
    const max = options?.maximumFractionDigits !== undefined ? Math.max(0, options.maximumFractionDigits) : 2;
    const min = options?.minimumFractionDigits !== undefined 
      ? Math.min(options.minimumFractionDigits, max) 
      : Math.min(2, max);
    return `₱${num.toLocaleString('en-PH', {
      minimumFractionDigits: min,
      maximumFractionDigits: max
    })}`;
  };

  const fmtShortMoney = (val: number) => {
    if (privacyMode) return '••••';
    if (Math.abs(val) >= 1000000) {
      return `₱${(val / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `₱${(val / 1000).toFixed(0)}k`;
    }
    return `₱${val.toLocaleString()}`;
  };

  const compName = activeCompany?.company_name || '';

  const isDateMatch = useCallback((dateStr?: string) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    if (currentYear !== undefined && d.getFullYear() !== currentYear) return false;
    if (periodFilterMode === 'month' && currentMonthIdx !== undefined && d.getMonth() !== currentMonthIdx) return false;
    return true;
  }, [currentYear, periodFilterMode, currentMonthIdx]);

  // Company-scoped transactions
  const companyRawSales = useMemo(() => sales.filter(s => !compName || s.company_name === compName), [sales, compName]);
  const companyRawColls = useMemo(() => collections.filter(c => !compName || c.company_name === compName), [collections, compName]);
  const companyRawExp = useMemo(() => expenses.filter(e => !compName || e.company_name === compName), [expenses, compName]);
  const companyRawPay = useMemo(() => payments.filter(p => !compName || p.company_name === compName), [payments, compName]);

  // Selected period transactions (month or year)
  const compSales = useMemo(() => companyRawSales.filter(s => isDateMatch(s.invoice_date || s.issue_date)), [companyRawSales, isDateMatch]);
  const compColls = useMemo(() => companyRawColls.filter(c => isDateMatch(c.collection_date)), [companyRawColls, isDateMatch]);
  const compExp = useMemo(() => companyRawExp.filter(e => isDateMatch(e.expense_date || e.issue_date)), [companyRawExp, isDateMatch]);
  const compPay = useMemo(() => companyRawPay.filter(p => isDateMatch(p.payment_date)), [companyRawPay, isDateMatch]);

  // Entire active year transactions for multi-period line and area charts
  const compYearSales = useMemo(() => companyRawSales.filter(s => {
    if (currentYear === undefined) return true;
    const d = s.invoice_date || s.issue_date;
    if (!d) return true;
    const dt = new Date(d);
    return !isNaN(dt.getTime()) ? dt.getFullYear() === currentYear : true;
  }), [companyRawSales, currentYear]);

  const compYearColls = useMemo(() => companyRawColls.filter(c => {
    if (currentYear === undefined) return true;
    const d = c.collection_date || c.date;
    if (!d) return true;
    const dt = new Date(d);
    return !isNaN(dt.getTime()) ? dt.getFullYear() === currentYear : true;
  }), [companyRawColls, currentYear]);

  const compYearExp = useMemo(() => companyRawExp.filter(e => {
    if (currentYear === undefined) return true;
    const d = e.expense_date || e.issue_date;
    if (!d) return true;
    const dt = new Date(d);
    return !isNaN(dt.getTime()) ? dt.getFullYear() === currentYear : true;
  }), [companyRawExp, currentYear]);

  const compPayroll = useMemo(() => payrollRecords.filter(p => !compName || p.company_name === compName), [payrollRecords, compName]);
  const compEmps = useMemo(() => employees.filter(e => !compName || e.company_name === compName), [employees, compName]);
  const compPpe = useMemo(() => ppeAssets.filter(p => !compName || p.company_name === compName), [ppeAssets, compName]);
  const compTax = useMemo(() => incomeTaxRecords.filter(t => !compName || t.company_name === compName), [incomeTaxRecords, compName]);

  // Master double-entry accounting summary strictly synchronized from books of accounts
  const masterSummary = useMemo(() => {
    return computeAccountingSummaries({
      sales: compSales,
      collections: compColls,
      cashReceipts,
      expenses: compExp,
      payments: compPay,
      cashDisbursements,
      specialEntries,
      accountTitles,
      ppeAssets: compPpe,
      payrollRecords: compPayroll,
      companyName: compName
    });
  }, [compSales, compColls, cashReceipts, compExp, compPay, cashDisbursements, specialEntries, accountTitles, compPpe, compPayroll, compName]);

  // 1. Comprehensive Calculations across all accounting aspects
  const stats = useMemo(() => {
    // Sales & AR derived directly from master double-entry books
    const grossSales = masterSummary.grossRevenue;
    const outputVat = masterSummary.outputVat;
    const cashCollected = masterSummary.cashInflowsFromCustomers;
    const withholdingCollected = masterSummary.cwt2307;
    const totalCollected = Math.round((cashCollected + withholdingCollected) * 100) / 100;
    const outstandingAR = masterSummary.ar;

    // Overdue vs Not Due calculation
    const today = new Date();
    let rawOverdueAR = 0;
    let rawNotDueAR = 0;

    compSales.forEach(s => {
      const invDate = new Date(s.invoice_date || s.issue_date || (s as any).date);
      const daysPast = !isNaN(invDate.getTime()) ? Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const amt = Number(s.invoice_amount || (s as any).total_amount_vat_inclusive || s.amount) || 0;
      if (daysPast > 30) {
        rawOverdueAR += amt;
      } else {
        rawNotDueAR += amt;
      }
    });

    const overdueAR = outstandingAR <= 0 ? 0 : (rawOverdueAR + rawNotDueAR > 0 ? Math.round((rawOverdueAR / (rawOverdueAR + rawNotDueAR)) * outstandingAR * 100) / 100 : 0);
    const notDueAR = outstandingAR <= 0 ? 0 : Math.round((outstandingAR - overdueAR) * 100) / 100;

    // Invoices Paid Section
    const paidLast30Days = cashCollected;
    const deposited = masterSummary.cash;
    const notDeposited = Math.max(0, Math.round((cashCollected - deposited) * 100) / 100);

    // Expenses & AP
    const grossExpenses = masterSummary.totalOperatingExp;
    const inputVat = masterSummary.inputVat;
    const cashPaid = masterSummary.cashOutflowsToSuppliersAndExpenses;
    const withholdingPaid = masterSummary.ewtPayable;
    const totalPaid = Math.round((cashPaid + withholdingPaid) * 100) / 100;
    const outstandingAP = masterSummary.ap;

    // Expense Categorization for Compact Donut Chart
    const categoryMap: Record<string, number> = {};
    compExp.forEach(e => {
      const cat = e.expense_category || e.expense_type || 'Operations';
      categoryMap[cat] = (categoryMap[cat] || 0) + (e.expense_invoice_amount - (e.discounts || 0));
    });

    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    let topExpensePieData: { name: string; value: number; color: string; percent: number }[] = [];
    const colors = ['#02B8AC', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

    if (sortedCategories.length > 0) {
      const top4 = sortedCategories.slice(0, 4);
      const others = sortedCategories.slice(4);
      const othersTotal = others.reduce((acc, curr) => acc + curr[1], 0);
      const totalPeriodExp = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;

      topExpensePieData = top4.map((item, idx) => ({
        name: item[0],
        value: item[1],
        color: colors[idx % colors.length],
        percent: (item[1] / totalPeriodExp) * 100
      }));

      if (othersTotal > 0) {
        topExpensePieData.push({
          name: 'Other Expenses',
          value: othersTotal,
          color: '#64748B',
          percent: (othersTotal / totalPeriodExp) * 100
        });
      }
    } else {
      topExpensePieData = [];
    }

    const currentTotalExpensePeriod = topExpensePieData.reduce((acc, curr) => acc + curr.value, 0);

    // Top Customers Ranking
    const customerMap: Record<string, { totalInvoiced: number; totalCollected: number; invoiceCount: number; tin: string }> = {};
    compSales.forEach(s => {
      const cName = s.customer_name || 'General Client';
      if (!customerMap[cName]) {
        customerMap[cName] = { totalInvoiced: 0, totalCollected: 0, invoiceCount: 0, tin: s.customer_tin || 'N/A' };
      }
      const invAmt = s.invoice_amount - (s.discounts || 0);
      customerMap[cName].totalInvoiced += invAmt;
      customerMap[cName].invoiceCount += 1;
      
      const colMatches = compColls.filter(c => c.invoice_number.toLowerCase() === s.invoice_number.toLowerCase());
      const colAmt = colMatches.length > 0 
        ? colMatches.reduce((a, b) => a + b.amount_collected + b.amount_withheld_2307, 0) + s.down_payment
        : (s.sales_status === 'Paid' ? invAmt : (s.sales_status === 'Partial' ? s.down_payment : 0));
      customerMap[cName].totalCollected += colAmt;
    });

    const topCustomersList = Object.entries(customerMap)
      .map(([name, data]) => ({
        name,
        tin: data.tin,
        totalInvoiced: data.totalInvoiced,
        totalCollected: data.totalCollected,
        outstanding: Math.max(0, data.totalInvoiced - data.totalCollected),
        invoiceCount: data.invoiceCount,
        collectionRate: data.totalInvoiced > 0 ? (data.totalCollected / data.totalInvoiced) * 100 : 0
      }))
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
      .slice(0, 5);

    // Payroll Summary
    const payrollGross = compPayroll.reduce((sum, p) => sum + p.gross_pay, 0);
    const payrollSssEE = compPayroll.reduce((sum, p) => sum + p.sss_deduction, 0);
    const payrollPhicEE = compPayroll.reduce((sum, p) => sum + p.philhealth_deduction, 0);
    const payrollHdmfEE = compPayroll.reduce((sum, p) => sum + p.pagibig_deduction, 0);
    const payrollTaxEE = compPayroll.reduce((sum, p) => sum + p.withholding_tax, 0);
    const payrollNet = compPayroll.reduce((sum, p) => sum + p.net_pay, 0);

    const erSss = compPayroll.reduce((sum, p) => sum + Math.round((p.basic_pay || 0) * 0.095 * 100) / 100, 0);
    const erPhic = compPayroll.reduce((sum, p) => sum + p.philhealth_deduction, 0);
    const erHdmf = compPayroll.reduce((sum, p) => sum + p.pagibig_deduction, 0);
    const totalERContributions = erSss + erPhic + erHdmf;

    // PPE Net Book Value
    const ppeTotalCost = compPpe.reduce((sum, asset) => sum + asset.acquisition_cost, 0);
    const ppeAccumulatedDep = compPpe.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0);
    const ppeNetBookValue = compPpe.reduce((sum, asset) => sum + asset.net_book_value, 0);

    // Unpaid Tax Liabilities
    const netVatPayable = Math.max(0, outputVat - inputVat);
    const withholdingTaxCompPayable = payrollTaxEE;
    const expandedWithholdingTaxPayable = compPay.reduce((sum, p) => sum + p.withholding_tax_2307, 0);
    const statutoryPayable = totalERContributions + payrollSssEE + payrollPhicEE + payrollHdmfEE;
    const totalUnpaidTaxLiabilities = netVatPayable + withholdingTaxCompPayable + expandedWithholdingTaxPayable + statutoryPayable;

    // Breakeven Analysis (BEP)
    const estimatedFixedCosts = (grossExpenses * 0.35) + payrollGross + totalERContributions;
    const estimatedVariableCosts = grossExpenses * 0.65;
    const totalRevenueForBEP = grossSales;
    const variableCostRatio = totalRevenueForBEP > 0 ? Math.min(0.85, Math.max(0.20, estimatedVariableCosts / totalRevenueForBEP)) : 0;
    const contributionMarginRatio = variableCostRatio > 0 ? 1 - variableCostRatio : 0;
    const breakevenSales = (contributionMarginRatio > 0 && estimatedFixedCosts > 0) ? (estimatedFixedCosts / contributionMarginRatio) : 0;
    const marginOfSafety = Math.max(0, totalRevenueForBEP - breakevenSales);
    const marginOfSafetyPercent = (totalRevenueForBEP > 0 && breakevenSales > 0) ? (marginOfSafety / totalRevenueForBEP) * 100 : 0;
    const isAboveBreakeven = totalRevenueForBEP >= breakevenSales && totalRevenueForBEP > 0;

    // Cash Position & Working Capital
    const netOperatingCashFlow = cashCollected - cashPaid - payrollNet;
    const totalOperatingCost = grossExpenses + payrollGross + totalERContributions;
    const netIncomePnl = grossSales - totalOperatingCost;
    const pnlIncomeDisplay = grossSales;
    const pnlExpenseDisplay = totalOperatingCost;

    return {
      grossSales,
      outputVat,
      cashCollected,
      withholdingCollected,
      totalCollected,
      overdueAR,
      notDueAR,
      totalUnpaidAR: overdueAR + notDueAR,
      paidLast30Days,
      notDeposited,
      deposited,
      outstandingAR,
      grossExpenses,
      inputVat,
      cashPaid,
      withholdingPaid,
      totalPaid,
      outstandingAP,
      topExpensePieData,
      currentTotalExpensePeriod,
      topCustomersList,
      payrollGross,
      payrollSssEE,
      payrollPhicEE,
      payrollHdmfEE,
      payrollTaxEE,
      payrollNet,
      totalERContributions,
      ppeTotalCost,
      ppeAccumulatedDep,
      ppeNetBookValue,
      netVatPayable,
      withholdingTaxCompPayable,
      expandedWithholdingTaxPayable,
      statutoryPayable,
      totalUnpaidTaxLiabilities,
      estimatedFixedCosts,
      estimatedVariableCosts,
      contributionMarginRatio,
      breakevenSales,
      marginOfSafety,
      marginOfSafetyPercent,
      isAboveBreakeven,
      netOperatingCashFlow,
      netIncomePnl,
      pnlIncomeDisplay,
      pnlExpenseDisplay,
      cashOnHand: masterSummary.cash,
      salesCount: compSales.length,
      expensesCount: compExp.length
    };
  }, [compSales, compColls, compExp, compPay, compPayroll, compEmps, compPpe, compTax, activeCompany, currentMonthIdx, currentYear, periodFilterMode, masterSummary]);

  // Quarterly Line Trend Data for Card 3
  const quarterlySalesTrend = useMemo(() => {
    const qData = [
      { quarter: 'Q1', sales: 0, collections: 0, expenses: 0 },
      { quarter: 'Q2', sales: 0, collections: 0, expenses: 0 },
      { quarter: 'Q3', sales: 0, collections: 0, expenses: 0 },
      { quarter: 'Q4', sales: 0, collections: 0, expenses: 0 },
    ];
    
    compYearSales.forEach(s => {
      const d = s.invoice_date || s.issue_date;
      if (d) {
        const m = new Date(d).getMonth();
        const qIdx = Math.floor(m / 3);
        if (qIdx >= 0 && qIdx < 4) {
          qData[qIdx].sales += Number(s.invoice_amount || s.amount) || 0;
        }
      }
    });
    compYearColls.forEach(c => {
      const d = c.collection_date || c.date;
      if (d) {
        const m = new Date(d).getMonth();
        const qIdx = Math.floor(m / 3);
        if (qIdx >= 0 && qIdx < 4) {
          qData[qIdx].collections += Number(c.amount_collected) || 0;
        }
      }
    });
    compYearExp.forEach(e => {
      const d = e.expense_date || e.issue_date;
      if (d) {
        const m = new Date(d).getMonth();
        const qIdx = Math.floor(m / 3);
        if (qIdx >= 0 && qIdx < 4) {
          qData[qIdx].expenses += Number(e.expense_invoice_amount || e.amount) || 0;
        }
      }
    });

    return qData;
  }, [compYearSales, compYearColls, compYearExp]);

  // Multi-period Area chart comparison
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((name, mIdx) => {
      const monthSales = compYearSales
        .filter(s => {
          const d = s.invoice_date || s.issue_date;
          return d && new Date(d).getMonth() === mIdx;
        })
        .reduce((sum, s) => sum + (Number(s.invoice_amount || s.amount) || 0), 0);
      const monthColls = compYearColls
        .filter(c => {
          const d = c.collection_date || c.date;
          return d && new Date(d).getMonth() === mIdx;
        })
        .reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
      const monthExp = compYearExp
        .filter(e => {
          const d = e.expense_date || e.issue_date;
          return d && new Date(d).getMonth() === mIdx;
        })
        .reduce((sum, e) => sum + (Number(e.expense_invoice_amount || e.amount) || 0), 0);

      return {
        name,
        Sales: monthSales,
        Collections: monthColls,
        Expenses: monthExp
      };
    });
  }, [compYearSales, compYearColls, compYearExp]);

  // Promotional Carousel Items for Card 6
  const promoInsights = [
    {
      title: "Fee Optimization",
      subtitle: "Save with card transaction fees starting at 1.7% + ₱10.00 with integrated corporate gateways.",
      badgeColor: "bg-amber-400",
      actionText: "Fee Details",
      icon: <Coins className="w-5 h-5 text-amber-400" />
    },
    {
      title: "BIR 2307 Creditable",
      subtitle: `₱${stats.withholdingCollected.toLocaleString()} in CWT certificates. Credit against quarterly tax.`,
      badgeColor: "bg-teal-400",
      actionText: "Form 2307",
      icon: <FileCheck className="w-5 h-5 text-teal-400" />
    },
    {
      title: "Automated Banking",
      subtitle: "Direct API feed with BDO & BPI for instant reconciliation of invoice deposits.",
      badgeColor: "bg-cyan-400",
      actionText: "Link Feed",
      icon: <Landmark className="w-5 h-5 text-cyan-400" />
    }
  ];

  return (
    <div className="space-y-3.5 pb-6">
      
      {/* 1. COMPACT TOP HEADER & CONTROLS */}
      <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-2.5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                {activeCompany?.company_name || 'NO ENTITY SELECTED'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-500 font-bold">
                TABULATED DASHBOARD
              </span>
            </div>
            <h1 className={`text-lg font-black font-display tracking-tight ${theme.textTitle}`}>
              Executive Financial Command Center
            </h1>
          </div>
        </div>

        {/* Right Controls: PERIOD SELECTOR & PRIVACY SWITCH */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-zinc-400 font-mono hidden sm:inline">PERIOD:</span>
            <div className="flex items-center bg-black/10 dark:bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => handlePeriodChange(currentMonthIdx, currentYear, 'month')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  periodFilterMode === 'month' ? 'bg-cyan-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => handlePeriodChange(currentMonthIdx, currentYear, 'year')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  periodFilterMode === 'year' ? 'bg-cyan-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Full Year
              </button>
            </div>

            {periodFilterMode === 'month' && (
              <select
                value={currentMonthIdx}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value), currentYear, 'month')}
                aria-label="Filter dashboard by month"
                className={`text-xs px-2 py-0.5 rounded-md border ${theme.borderCard} bg-black/5 dark:bg-white/5 font-semibold ${theme.textMain} cursor-pointer outline-none focus:border-cyan-500`}
              >
                {DASH_MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={currentYear}
              onChange={(e) => handlePeriodChange(currentMonthIdx, parseInt(e.target.value), periodFilterMode)}
              aria-label="Filter dashboard by year"
              className={`text-xs px-2 py-0.5 rounded-md border ${theme.borderCard} bg-black/5 dark:bg-white/5 font-semibold ${theme.textMain} cursor-pointer outline-none focus:border-cyan-500`}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/3 dark:bg-white/3 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              {privacyMode ? <EyeOff className="w-3 h-3 text-cyan-500" /> : <Eye className="w-3 h-3 text-zinc-400" />}
              Privacy
            </span>
            <button
              onClick={() => {
                setPrivacyMode(!privacyMode);
                triggerAlert(
                  !privacyMode ? 'Privacy Mode Activated' : 'Privacy Mode Deactivated',
                  'info'
                );
              }}
              title="Toggle Privacy Mode to mask confidential financial figures"
              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                privacyMode ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform duration-200 ${
                  privacyMode ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TABULATED NAVIGATION CONTROLS: TRANSACTIONS | TOP | ACTIVITIES */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-black/5 dark:border-white/5 pb-2.5">
        <div className={`flex items-center gap-1.5 p-1 rounded-xl ${isTrial ? 'bg-slate-200/70 border border-slate-300' : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5'}`}>
          <button
            onClick={() => {
              setActiveDashTab('TRANSACTIONS');
              triggerAlert('Viewing TRANSACTIONS tab', 'info');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isTrial
                ? activeDashTab === 'TRANSACTIONS'
                  ? 'bg-[#00a8ff] text-white shadow-xs font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold'
                : activeDashTab === 'TRANSACTIONS'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${theme.textMuted} hover:text-cyan-600 hover:bg-black/5 dark:hover:bg-white/5`
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>TRANSACTIONS</span>
          </button>

          <button
            onClick={() => {
              setActiveDashTab('TOP');
              triggerAlert('Viewing TOP metrics tab', 'info');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isTrial
                ? activeDashTab === 'TOP'
                  ? 'bg-[#00a8ff] text-white shadow-xs font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold'
                : activeDashTab === 'TOP'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${theme.textMuted} hover:text-cyan-600 hover:bg-black/5 dark:hover:bg-white/5`
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>TOP</span>
          </button>

          <button
            onClick={() => {
              setActiveDashTab('ACTIVITIES');
              triggerAlert('Viewing ACTIVITIES workflow tab', 'info');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isTrial
                ? activeDashTab === 'ACTIVITIES'
                  ? 'bg-[#7c3aed] text-white shadow-xs font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold'
                : activeDashTab === 'ACTIVITIES'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${theme.textMuted} hover:text-cyan-600 hover:bg-black/5 dark:hover:bg-white/5`
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>ACTIVITIES</span>
            {taskCounts.pending > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isTrial
                  ? 'bg-white/25 text-white'
                  : activeDashTab === 'ACTIVITIES' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {taskCounts.pending}
              </span>
            )}
          </button>
        </div>

        <div className={`flex items-center gap-3 text-[11px] font-mono ${isTrial ? 'text-slate-600 font-semibold' : 'text-zinc-400'}`}>
          <span>Completed: <strong className="text-emerald-500 font-bold">{taskCounts.completedPercent}%</strong></span>
          <span>•</span>
          <span>Uncollected AR: <strong className={isTrial ? 'text-amber-600 font-bold' : 'text-amber-500 font-bold'}>{fmtShortMoney(stats.outstandingAR)}</strong></span>
          <span>•</span>
          <span>Unpaid Taxes: <strong className={isTrial ? 'text-purple-600 font-bold' : 'text-purple-400 font-bold'}>{fmtShortMoney(stats.totalUnpaidTaxLiabilities)}</strong></span>
        </div>
      </div>

      {/* TAB 1: TRANSACTIONS */}
      {activeDashTab === 'TRANSACTIONS' && (
        <div className="space-y-3.5">
          {/* FINANCIAL HEALTH PILLARS (UNCOLLECTED SALES, UNPAID EXPENSES, UNPAID TAX, BREAKEVEN) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* PILLAR 1: UNCOLLECTED SALES (AR) */}
            <div className={`p-3 rounded-xl transition flex flex-col justify-between ${
              isTrial
                ? 'bg-[#f97316] text-white border-0 shadow-sm'
                : `border ${theme.borderCard} ${theme.bgCard} shadow-xs hover:border-amber-500/40`
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isTrial ? 'text-white' : 'text-amber-500'
                }`}>
                  <AlertCircle className="w-3 h-3" />
                  Uncollected Sales
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isTrial ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  AR
                </span>
              </div>
              
              <div className="my-1.5">
                <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                  isTrial ? 'text-white' : 'text-amber-500'
                }`}>
                  {fmtMoney(stats.outstandingAR)}
                </div>
                <div className={`flex justify-between items-center text-[10px] font-mono mt-0.5 ${
                  isTrial ? 'text-white/80' : 'text-zinc-400'
                }`}>
                  <span>Overdue: <strong className={isTrial ? 'text-white underline font-bold' : 'text-rose-500'}>{fmtShortMoney(stats.overdueAR)}</strong></span>
                  <span>Current: <strong className={isTrial ? 'text-white font-bold' : ''}>{fmtShortMoney(stats.notDueAR)}</strong></span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: UNPAID EXPENSES (AP) */}
            <div className={`p-3 rounded-xl transition flex flex-col justify-between ${
              isTrial
                ? 'bg-[#e11d48] text-white border-0 shadow-sm'
                : `border ${theme.borderCard} ${theme.bgCard} shadow-xs hover:border-rose-500/40`
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isTrial ? 'text-white' : 'text-rose-500'
                }`}>
                  <Receipt className="w-3 h-3" />
                  Unpaid Expenses
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isTrial ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  AP
                </span>
              </div>
              
              <div className="my-1.5">
                <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                  isTrial ? 'text-white' : 'text-rose-500'
                }`}>
                  {fmtMoney(stats.outstandingAP)}
                </div>
                <div className={`flex justify-between items-center text-[10px] font-mono mt-0.5 ${
                  isTrial ? 'text-white/80' : 'text-zinc-400'
                }`}>
                  <span>Incurred: <strong className={isTrial ? 'text-white font-bold' : ''}>{fmtShortMoney(stats.grossExpenses)}</strong></span>
                  <span>Paid: <strong className={isTrial ? 'text-white underline font-bold' : 'text-emerald-500'}>{fmtShortMoney(stats.cashPaid)}</strong></span>
                </div>
              </div>
            </div>

            {/* PILLAR 3: UNPAID TAX LIABILITIES */}
            <div className={`p-3 rounded-xl transition flex flex-col justify-between ${
              isTrial
                ? 'bg-[#7c3aed] text-white border-0 shadow-sm'
                : `border ${theme.borderCard} ${theme.bgCard} shadow-xs hover:border-purple-500/40`
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isTrial ? 'text-white' : 'text-purple-400'
                }`}>
                  <ShieldAlert className="w-3 h-3" />
                  Unpaid Taxes
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isTrial ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  BIR
                </span>
              </div>
              
              <div className="my-1.5">
                <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                  isTrial ? 'text-white' : 'text-purple-400'
                }`}>
                  {fmtMoney(stats.totalUnpaidTaxLiabilities)}
                </div>
                <div className={`flex justify-between items-center text-[10px] font-mono mt-0.5 ${
                  isTrial ? 'text-white/80' : 'text-zinc-400'
                }`}>
                  <span>VAT: <strong className={isTrial ? 'text-white font-bold' : ''}>{fmtShortMoney(stats.netVatPayable)}</strong></span>
                  <span>1601C/SSS: <strong className={isTrial ? 'text-white font-bold' : ''}>{fmtShortMoney(stats.withholdingTaxCompPayable + stats.statutoryPayable)}</strong></span>
                </div>
              </div>
            </div>

            {/* PILLAR 4: BREAKEVEN POINT (BEP) */}
            <div className={`p-3 rounded-xl transition flex flex-col justify-between ${
              isTrial
                ? 'bg-[#10b981] text-white border-0 shadow-sm'
                : `border ${theme.borderCard} ${theme.bgCard} shadow-xs hover:border-cyan-500/40`
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isTrial ? 'text-white' : 'text-cyan-500'
                }`}>
                  <Target className="w-3 h-3" />
                  Breakeven (BEP)
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isTrial 
                    ? 'bg-white/20 text-white' 
                    : stats.isAboveBreakeven ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {stats.isAboveBreakeven ? 'Profitable' : 'Below BEP'}
                </span>
              </div>
              
              <div className="my-1.5">
                <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                  isTrial ? 'text-white' : theme.textTitle
                }`}>
                  {fmtMoney(stats.breakevenSales, { maximumFractionDigits: 0 })}
                </div>
                <div className={`flex justify-between items-center text-[10px] font-mono mt-0.5 ${
                  isTrial ? 'text-white/80' : 'text-zinc-400'
                }`}>
                  <span>Safety: <strong className={isTrial ? 'text-white font-bold' : 'text-emerald-500'}>+{stats.marginOfSafetyPercent.toFixed(0)}%</strong></span>
                  <span>CMR: <strong className={isTrial ? 'text-white font-bold' : ''}>{(stats.contributionMarginRatio * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>

          </div>

          {/* 4 CORE TRANSACTION CARDS IN A 2x2 or 4-COL GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* CARD 1: INVOICES & COLLECTIONS */}
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-teal-500/30 transition`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    INVOICES & AR
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Aging</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <div className={`text-base font-bold font-mono ${theme.textTitle}`}>
                        {fmtMoney(stats.overdueAR)}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-sans">Overdue</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-bold font-mono ${theme.textTitle}`}>
                        {fmtMoney(stats.notDueAR)}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-sans">Not due yet</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-l-full" 
                      style={{ width: `${stats.totalUnpaidAR > 0 ? Math.min(100, Math.max(0, (stats.overdueAR / stats.totalUnpaidAR) * 100)) : 0}%` }}
                    />
                    <div className="bg-zinc-300 dark:bg-zinc-600 h-full flex-1 rounded-r-full" />
                  </div>
                </div>

                <div className="my-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <div className={`text-base font-bold font-mono ${theme.textTitle}`}>
                        {fmtMoney(stats.notDeposited)}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-sans">Undeposited</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-bold font-mono ${theme.textTitle}`}>
                        {fmtMoney(stats.deposited)}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-sans">Deposited (30d)</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                    <div 
                      className="bg-gradient-to-r from-lime-400 to-emerald-500 h-full rounded-l-full" 
                      style={{ width: `${stats.paidLast30Days > 0 ? Math.min(100, Math.max(0, (stats.notDeposited / stats.paidLast30Days) * 100)) : 0}%` }}
                    />
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full flex-1 rounded-r-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PROFIT & LOSS */}
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    PROFIT & LOSS
                  </span>
                  <select
                    value={pnlPeriod}
                    onChange={(e) => setPnlPeriod(e.target.value as any)}
                    className={`text-[10px] font-semibold py-0.5 px-1.5 rounded border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="Last month" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Last month</option>
                    <option value="This Quarter" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Quarter</option>
                    <option value="This Year" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Year</option>
                  </select>
                </div>

                <div className="mb-2">
                  <div className="text-base font-black font-mono tracking-tight text-emerald-500">
                    {fmtMoney(stats.netIncomePnl, { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-zinc-400">Net income for {pnlPeriod}</span>
                </div>

                <div className="space-y-2 font-mono text-[10px]">
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-0.5">
                      <span>Income: <strong className={theme.textTitle}>{fmtMoney(stats.pnlIncomeDisplay, { maximumFractionDigits: 0 })}</strong></span>
                      <span className="text-cyan-500 cursor-pointer" onClick={() => triggerAlert(`${stats.salesCount} transactions recorded`, "info")}>
                        {stats.salesCount} recorded
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-sm overflow-hidden flex">
                      <div className="h-full bg-emerald-500 rounded-sm transition-all" style={{ width: stats.pnlIncomeDisplay > 0 ? '100%' : '0%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-0.5">
                      <span>Expenses: <strong className={theme.textTitle}>{fmtMoney(stats.pnlExpenseDisplay, { maximumFractionDigits: 0 })}</strong></span>
                      <span className="text-cyan-500 cursor-pointer" onClick={() => triggerAlert(`${stats.expensesCount} vouchers recorded`, "info")}>
                        {stats.expensesCount} recorded
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-sm overflow-hidden flex">
                      <div className="h-full bg-cyan-500 rounded-sm transition-all" style={{ width: stats.pnlExpenseDisplay > 0 ? '100%' : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: SALES TREND */}
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-lime-500/30 transition`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    SALES TREND
                  </span>
                  <select
                    value={salesPeriod}
                    onChange={(e) => setSalesPeriod(e.target.value as any)}
                    className={`text-[10px] font-semibold py-0.5 px-1.5 rounded border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="Quarterly" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Quarterly</option>
                    <option value="Annual" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Annual</option>
                  </select>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-base font-black font-mono tracking-tight ${theme.textTitle}`}>
                    {fmtMoney(stats.grossSales)}
                  </div>
                  <span className="text-[9px] text-zinc-400">{salesPeriod} trend</span>
                </div>

                <div className="h-28 w-full font-mono text-[9px] -ml-3">
                  <ResponsiveContainer width="106%" height={110}>
                    <LineChart data={quarterlySalesTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke={theme.isLight ? "#e2e8f0" : "#1e293b"} opacity={0.5} />
                      <XAxis dataKey="quarter" stroke="#94a3b8" tickLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(val: any) => [fmtMoney(Number(val)), 'Sales']}
                        contentStyle={{
                          backgroundColor: theme.isLight ? '#ffffff' : '#070D1D',
                          borderColor: theme.isLight ? '#e2e8f0' : '#182C5A',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CARD 4: BANK ACCOUNTS */}
            <div className={`${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    BANK ACCOUNTS
                  </span>
                  <button 
                    onClick={() => setShowBankModal(true)}
                    title="Manage Banking Integration"
                    className="p-1 rounded text-zinc-400 hover:text-cyan-400 transition"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2 font-mono text-[10.5px]">
                  <div className="p-1.5 rounded-lg border border-black/5 dark:border-white/5 space-y-0.5">
                    <div className="flex items-center justify-between font-sans">
                      <span className={`font-bold flex items-center gap-1 ${theme.textTitle}`}>
                        <Landmark className="w-3 h-3 text-blue-500" />
                        BDO Commercial
                      </span>
                      <span 
                        onClick={() => triggerAlert("No pending reconciliation items", "info")}
                        className="text-[9.5px] text-zinc-400 font-mono"
                      >
                        {stats.cashCollected > 0 ? '1 linked' : '0 review'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Bank: <strong className={theme.textTitle}>{fmtMoney(stats.cashOnHand)}</strong></span>
                      <span>Ledger: {fmtMoney(stats.cashOnHand)}</span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg border border-black/5 dark:border-white/5 space-y-0.5">
                    <div className="flex items-center justify-between font-sans">
                      <span className={`font-bold flex items-center gap-1 ${theme.textTitle}`}>
                        <Coins className="w-3 h-3 text-rose-500" />
                        BPI Payroll
                      </span>
                      <span 
                        onClick={() => triggerAlert("No pending payroll card items", "info")}
                        className="text-[9.5px] text-zinc-400 font-mono"
                      >
                        0 review
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Bank: <strong className={theme.textTitle}>{fmtMoney(0)}</strong></span>
                      <span>Ledger: {fmtMoney(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10.5px]">
                <button
                  onClick={() => setShowBankModal(true)}
                  className="text-cyan-500 font-bold hover:underline cursor-pointer"
                >
                  Connect feeds
                </button>
                <button
                  onClick={() => triggerAlert("Navigating to General Ledger", "info")}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Registers &rarr;
                </button>
              </div>
            </div>

          </div>

          {/* MONTHLY REVENUE VS COLLECTIONS FLOW (PFRS 15) */}
          <div className={`p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-2`}>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-teal-500/10 text-teal-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h3 className={`text-xs font-bold ${theme.textTitle}`}>
                  Revenue vs Collections Flow (Monthly Billing vs Realized Cash)
                </h3>
              </div>
              <span className="text-[9px] font-mono text-teal-500 bg-teal-500/10 px-1.5 py-0.2 rounded font-bold">
                PFRS 15
              </span>
            </div>

            <div className="h-52 w-full text-[9px] font-mono -ml-2">
              <ResponsiveContainer width="102%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyberColorSalesGrid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#02B8AC" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#02B8AC" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cyberColorCollsGrid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 3" stroke={theme.isLight ? "#f1f5f9" : "#1e293b"} />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(v) => fmtShortMoney(v)} />
                  <Tooltip 
                    formatter={(val: any) => [fmtMoney(Number(val)), 'Amount']}
                    contentStyle={{ 
                      backgroundColor: theme.isLight ? '#ffffff' : '#070D1D', 
                      borderColor: theme.isLight ? '#e2e8f0' : '#182C5A',
                      borderRadius: '8px',
                      fontSize: '10px'
                    }} 
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Sales" stroke="#02B8AC" fillOpacity={1} fill="url(#cyberColorSalesGrid)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Collections" stroke="#10b981" fillOpacity={1} fill="url(#cyberColorCollsGrid)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between text-[10.5px] font-mono text-zinc-400 pt-1 border-t border-black/5 dark:border-white/5">
              <span>Total Cash Inflow: <strong className="text-emerald-500">{fmtMoney(stats.cashCollected)}</strong></span>
              <span>Total Open AR: <strong className="text-amber-500">{fmtMoney(stats.outstandingAR)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP METRICS (TOP EXPENSES & OTHERS, TOP CUSTOMERS, EXPENSES HUD) */}
      {activeDashTab === 'TOP' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* PIE CHART: TOP EXPENSES AND OTHERS (COL-SPAN-6) */}
            <div className={`lg:col-span-6 p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-2.5`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <h3 className={`text-xs font-bold ${theme.textTitle}`}>
                    Top Expenses & Others (Share of Costs)
                  </h3>
                </div>
                <span className="text-[9px] font-mono font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                  Cost Breakdown
                </span>
              </div>

              {stats.topExpensePieData.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-bold ${theme.textTitle}`}>No Expenses Recorded Yet</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
                    Record purchases and expense vouchers in the Purchases ledger to display cost distributions and category share.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative flex items-center justify-center h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.topExpensePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={1.5}
                          stroke={theme.isLight ? "#ffffff" : "#091124"}
                        >
                          {stats.topExpensePieData.map((entry, index) => (
                            <Cell key={`top-exp-grid-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val: any) => [fmtMoney(Number(val)), 'Expense']}
                          contentStyle={{
                            backgroundColor: theme.isLight ? '#ffffff' : '#070D1D',
                            borderColor: theme.isLight ? '#e2e8f0' : '#182C5A',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-mono text-zinc-400">TOTAL COST</span>
                      <span className="text-xs font-bold font-mono text-cyan-500">
                        {fmtShortMoney(stats.currentTotalExpensePeriod)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10.5px] max-h-48 overflow-y-auto pr-1">
                    {stats.topExpensePieData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-black/3 dark:border-white/3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-zinc-700 dark:text-zinc-300 text-xs font-sans">{item.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="font-bold">{fmtMoney(item.value)}</span>
                          <span className="text-[9.5px] text-zinc-400 ml-1.5">({item.percent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* TOP CUSTOMERS LEADERBOARD (COL-SPAN-6) */}
            <div className={`lg:col-span-6 p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-2.5`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h3 className={`text-xs font-bold ${theme.textTitle}`}>
                    Top Customers by Revenue & Collections
                  </h3>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  Top 5 Clients
                </span>
              </div>

              {stats.topCustomersList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                    <Award className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-bold ${theme.textTitle}`}>No Customer Sales Recorded</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
                    Issue and record sales invoices to populate your customer revenue leaderboard.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {stats.topCustomersList.map((customer, idx) => (
                    <div key={idx} className="p-2 rounded-xl border border-black/5 dark:border-white/5 space-y-1.5 hover:border-emerald-500/30 transition">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ${
                            idx === 0 ? 'bg-amber-400/20 text-amber-500' : 'bg-black/5 dark:bg-white/5 text-zinc-500'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className={`font-bold truncate text-xs ${theme.textTitle}`}>{customer.name}</span>
                        </div>
                        <div className="text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {fmtMoney(customer.totalInvoiced)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>{customer.invoiceCount} invoices issued</span>
                        <span>{customer.outstanding > 0 ? `${fmtMoney(customer.outstanding)} uncollected` : '100% Fully Settled'}</span>
                      </div>

                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${customer.collectionRate >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(100, customer.collectionRate)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* SECONDARY ROW: EXPENSES PERIOD HUD + INSIGHTS & ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* EXPENSES DONUT HUD */}
            <div className={`lg:col-span-6 ${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-cyan-500/30 transition`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    EXPENSES PERIOD HUD
                  </span>
                  <select
                    value={expensePeriod}
                    onChange={(e) => setExpensePeriod(e.target.value as any)}
                    className={`text-[10px] font-semibold py-0.5 px-1.5 rounded border bg-transparent cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                  >
                    <option value="Last month" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Last month</option>
                    <option value="This Quarter" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Quarter</option>
                    <option value="This Year" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#0B1630]"}>Year</option>
                  </select>
                </div>

                <div className="flex items-center justify-between mb-2 font-mono">
                  <div className={`text-base font-black tracking-tight ${theme.textTitle}`}>
                    {fmtMoney(stats.currentTotalExpensePeriod, { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-zinc-400">{expensePeriod}</span>
                </div>

                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-5 relative flex items-center justify-center h-28">
                    <ResponsiveContainer width="100%" height={110}>
                      <PieChart>
                        <Pie
                          data={stats.topExpensePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={46}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={1.5}
                          stroke={theme.isLight ? "#ffffff" : "#091124"}
                        >
                          {stats.topExpensePieData.map((entry, index) => (
                            <Cell key={`cell-mini-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val: any) => [fmtMoney(Number(val)), 'Expense']}
                          contentStyle={{
                            backgroundColor: theme.isLight ? '#ffffff' : '#070D1D',
                            borderColor: theme.isLight ? '#e2e8f0' : '#182C5A',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: theme.isLight ? '#0f172a' : '#22D3EE'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-mono text-zinc-400">TOTAL</span>
                      <span className="text-[10px] font-bold font-mono text-cyan-500">
                        {fmtShortMoney(stats.currentTotalExpensePeriod)}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-7 space-y-1 font-mono text-[9.5px]">
                    {stats.topExpensePieData.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-zinc-400">{item.name}</span>
                        </div>
                        <span className="font-bold flex-shrink-0">{item.percent.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DISCOVER MORE & ACTIONS */}
            <div className={`lg:col-span-6 ${theme.bgCard} border ${theme.borderCard} rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-amber-500/30 transition relative overflow-hidden`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    EXECUTIVE DISCOVERY & RECOMMENDATIONS
                  </span>
                  <div className="flex items-center gap-1">
                    {promoInsights.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setActivePromoIndex(dotIdx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                          activePromoIndex === dotIdx ? 'bg-emerald-500 w-3' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`text-xs font-bold ${theme.textTitle}`}>
                        {promoInsights[activePromoIndex].title}
                      </h4>
                      <div className={`w-6 h-0.5 ${promoInsights[activePromoIndex].badgeColor} rounded-full mt-0.5`} />
                    </div>
                    <div className="p-1 rounded-lg bg-black/5 dark:bg-white/5 flex-shrink-0">
                      {promoInsights[activePromoIndex].icon}
                    </div>
                  </div>

                  <p className="text-[10.5px] text-zinc-400 leading-relaxed line-clamp-2">
                    {promoInsights[activePromoIndex].subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <button
                  onClick={() => triggerAlert(`Action launched: ${promoInsights[activePromoIndex].actionText}`, "success")}
                  className="text-[10.5px] font-bold text-cyan-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {promoInsights[activePromoIndex].actionText}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITIES (GANTT CHART, KANBAN, ACCOUNTING PIPELINE & QUEUE) */}
      {activeDashTab === 'ACTIVITIES' && (
        <ActivitiesWorkflow
          theme={theme}
          triggerAlert={triggerAlert}
          privacyMode={privacyMode}
          fmtShortMoney={fmtShortMoney}
          fmtMoney={fmtMoney}
          stats={stats}
          employees={employees}
          activeCompanyName={activeCompany?.company_name}
          onStatsUpdate={setTaskCounts}
        />
      )}

      {/* BANK INTEGRATION MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${theme.bgCard} ${theme.borderCard} ${theme.textMain}`}>
            <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${theme.textTitle}`}>Banking & Financial Registers</h3>
              </div>
              <button 
                onClick={() => setShowBankModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <p className="text-zinc-400 text-[11px]">
                Link active bank accounts to enable automated transaction synchronization and electronic reconciliation against Official Receipts and Check Vouchers.
              </p>

              <div className="space-y-2 font-mono">
                <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">BDO Commercial Operating</div>
                    <div className="text-[10px] text-zinc-400">Acct: •••• 9821 • Synced</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">BPI Corporate Payroll</div>
                    <div className="text-[10px] text-zinc-400">Acct: •••• 4410 • Synced</div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-black/5 dark:border-white/5 flex justify-end">
              <button
                onClick={() => {
                  setShowBankModal(false);
                  triggerAlert("Banking feed preferences saved", "success");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${theme.accentBg} cursor-pointer`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
