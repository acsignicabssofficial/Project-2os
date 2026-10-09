import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Receipt, 
  Coins, 
  FileSpreadsheet, 
  Users, 
  Truck, 
  Download, 
  Plus, 
  Layers, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Settings, 
  Building2,
  DollarSign,
  PieChart,
  BookOpen,
  BookMarked,
  Calendar,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Activity,
  FileText,
  FileCheck,
  FileCheck2,
  FileCode,
  Palette,
  Scale,
  Table,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

import { 
  Customer, 
  Contractor, 
  Sale, 
  Collection, 
  Expense, 
  Payment, 
  Company, 
  AccountTitle, 
  PPEAsset, 
  NoteToFS,
  SpecialEntry,
  IncomeTaxRecord,
  SssBracket,
  PhilHealthConfig,
  PagIbigConfig,
  TaxBracket,
  UniformBookRecord
} from './types';

import { 
  INITIAL_COMPANIES, 
  INITIAL_CUSTOMERS, 
  INITIAL_CONTRACTORS, 
  INITIAL_SALES, 
  INITIAL_COLLECTIONS, 
  INITIAL_EXPENSES, 
  INITIAL_PAYMENTS,
  INITIAL_ACCOUNT_TITLES,
  INITIAL_PPE,
  INITIAL_SPECIAL_ENTRIES,
  INITIAL_INCOME_TAX_RECORDS,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL_RECORDS,
  INITIAL_SSS_TABLE,
  INITIAL_PHILHEALTH_CONFIG,
  INITIAL_PAGIBIG_CONFIG,
  INITIAL_WITHHOLDING_TAX_TABLE
} from './data';

import UniformBookTab from './components/UniformBookTab';
import SalesTransactionTab from './components/SalesTransactionTab';
import PurchaseTransactionTab from './components/PurchaseTransactionTab';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import SalesTab from './components/SalesTab';
import CollectionsTab from './components/CollectionsTab';
import ExpensesTab from './components/ExpensesTab';
import PaymentsTab from './components/PaymentsTab';
import CompaniesTab from './components/CompaniesTab';
import ReportsTab from './components/ReportsTab';
import AccountTitlesTab from './components/AccountTitlesTab';
import GeneralJournalTab from './components/GeneralJournalTab';
import GeneralLedgerTab from './components/GeneralLedgerTab';
import TaxCalendarTab from './components/TaxCalendarTab';
import PPETab from './components/PPETab';
import IncomeTaxTab from './components/IncomeTaxTab';
import TaxReportsTab from './components/TaxReportsTab';
import CWTFromCustomersTab from './components/CWTFromCustomersTab';
import CWTForProvidersTab from './components/CWTForProvidersTab';
import FinancialPositionTab from './components/FinancialPositionTab';
import IncomeStatementTab from './components/IncomeStatementTab';
import ChangesInEquityTab from './components/ChangesInEquityTab';
import CashFlowsTab from './components/CashFlowsTab';
import NotesToFSTab from './components/NotesToFSTab';
import BIR2316Tab from './components/BIR2316Tab';
import SLSPTab from './components/SLSPTab';
import QAPTab from './components/QAPTab';
import SAWTTab from './components/SAWTTab';
import SpecialEntriesTab from './components/SpecialEntriesTab';
import BankReconTab from './components/BankReconTab';
import RelatedPartiesTab from './components/RelatedPartiesTab';
import EmployeeProfilesTab from './components/EmployeeProfilesTab';
import PayrollTab from './components/PayrollTab';
import ContributionTablesTab from './components/ContributionTablesTab';
import ActivitiesWorkflow from './components/ActivitiesWorkflow';
import AboutAppTab from './components/AboutAppTab';
import TabDescriptionBanner from './components/TabDescriptionBanner';
import TwoOSTopBar from './components/2os/2osTopBar';
import TwoOSRibbon from './components/2os/2osRibbon';
import TwoOSSheetBar from './components/2os/2osSheetBar';
import InfinityFreeModal from './components/InfinityFreeModal';
import AuditTrailModal from './components/2os/AuditTrailModal';
import ImportModal from './components/2os/ImportModal';
import ExportModal from './components/2os/ExportModal';
import { 
  ImportableDataType, 
  CSV_TEMPLATES, 
  mapRowsToSales, 
  mapRowsToExpenses, 
  mapRowsToCollections, 
  mapRowsToPayments, 
  mapRowsToCustomers, 
  mapRowsToProviders, 
  mapRowsToAccountTitles, 
  mapRowsToEmployees, 
  mapRowsToSpecialEntries, 
  mapRowsToPPE 
} from './utils/csvImportExport';
import { exportActiveSheetTo2OS, exportFullAccountingWorkbookTo2OS } from './utils/2osExportHelper';
import { ThemeMode } from './types';

const themeConfigs = {
  neon_light: {
    isLight: true,
    bgMain: 'bg-[#f0f8ff]',
    bgCard: 'bg-white border border-sky-200/90 shadow-xs shadow-sky-400/10',
    bgInput: 'bg-sky-50/40 border-sky-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
    textMain: 'text-slate-900',
    textMuted: 'text-sky-700',
    textMutedLight: 'text-slate-500',
    textTitle: 'text-slate-950 font-bold',
    borderCard: 'border-sky-200',
    borderInput: 'border-sky-300',
    accentText: 'text-cyan-600 font-bold',
    accentBg: 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 hover:from-cyan-400 hover:to-sky-400 text-white font-extrabold shadow-sm shadow-cyan-400/30',
    accentBorder: 'border-cyan-400/50',
    accentFocus: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
    accentBadge: 'bg-cyan-500/15 text-cyan-900 border border-cyan-400/50 font-bold',
    accentLight: 'text-cyan-600 font-medium',
    gradientFrom: 'from-cyan-400/15',
    bannerBg: 'bg-sky-50/90 text-sky-950 border border-sky-300/80 font-medium',
    headerBg: 'bg-white border-b border-sky-200 shadow-xs text-slate-900',
    headerIsDark: false,
    headerTextTitle: 'text-slate-950',
    headerTextMuted: 'text-sky-700 font-medium',
    tableHeaderBg: 'bg-sky-50/70',
    tableRowHover: 'hover:bg-sky-50/40',
    tableBorder: 'border-sky-100',
  },
  trial_layout: {
    isLight: true,
    bgMain: 'bg-[#f1f5f9]',
    bgCard: 'bg-white border border-slate-200/90 shadow-xs shadow-slate-400/10',
    bgInput: 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-600',
    textMutedLight: 'text-slate-400',
    textTitle: 'text-slate-950 font-bold',
    borderCard: 'border-slate-200',
    borderInput: 'border-slate-300',
    accentText: 'text-[#00a8ff] font-bold',
    accentBg: 'bg-gradient-to-r from-[#00a8ff] to-[#7c3aed] hover:from-[#0096e6] hover:to-[#6d28d9] text-white font-extrabold shadow-sm',
    accentBorder: 'border-[#00a8ff]/50',
    accentFocus: 'focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]',
    accentBadge: 'bg-[#00a8ff]/15 text-[#0284c7] border border-[#00a8ff]/40 font-bold',
    accentLight: 'text-[#00a8ff] font-medium',
    gradientFrom: 'from-cyan-400/15',
    bannerBg: 'bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white font-medium shadow-sm',
    headerBg: 'bg-white border-b border-slate-200 shadow-xs text-slate-900',
    headerIsDark: false,
    headerTextTitle: 'text-slate-950',
    headerTextMuted: 'text-[#0284c7] font-medium',
    tableHeaderBg: 'bg-slate-100/90',
    tableRowHover: 'hover:bg-sky-50/50',
    tableBorder: 'border-slate-200',
  },
  clean: {
    isLight: true,
    bgMain: 'bg-[#fafaff]',
    bgCard: 'bg-white border border-zinc-200 shadow-xs shadow-violet-500/5',
    bgInput: 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-violet-600 focus:ring-1 focus:ring-violet-600',
    textMain: 'text-zinc-900',
    textMuted: 'text-violet-900/70',
    textMutedLight: 'text-zinc-500',
    textTitle: 'text-zinc-950 font-bold',
    borderCard: 'border-zinc-200',
    borderInput: 'border-zinc-300',
    accentText: 'text-violet-700 font-semibold',
    accentBg: 'bg-gradient-to-r from-zinc-950 via-violet-900 to-blue-900 hover:from-zinc-800 hover:to-violet-800 text-white font-extrabold shadow-sm shadow-violet-900/20',
    accentBorder: 'border-violet-300',
    accentFocus: 'focus:border-violet-600 focus:ring-1 focus:ring-violet-600',
    accentBadge: 'bg-violet-100 text-violet-950 border border-violet-300 font-bold',
    accentLight: 'text-violet-700 font-medium',
    gradientFrom: 'from-violet-500/10',
    bannerBg: 'bg-violet-50/70 text-violet-950 border border-violet-200 font-medium',
    headerBg: 'bg-white border-b border-zinc-200 text-zinc-900',
    headerIsDark: false,
    headerTextTitle: 'text-zinc-950',
    headerTextMuted: 'text-violet-800/80',
    tableHeaderBg: 'bg-zinc-50/80',
    tableRowHover: 'hover:bg-violet-50/30',
    tableBorder: 'border-zinc-100',
  },
  dark: {
    isLight: false,
    bgMain: 'bg-[#040814]',
    bgCard: 'bg-[#091124] border border-[#14264F] shadow-xs shadow-cyan-950/40',
    bgInput: 'bg-[#070D1D] border-[#182C5A] text-cyan-100 placeholder:text-blue-400/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400',
    textMain: 'text-[#D8E6F8]',
    textMuted: 'text-[#7094C4]',
    textMutedLight: 'text-[#4F73A3]',
    textTitle: 'text-white font-bold',
    borderCard: 'border-[#14264F]',
    borderInput: 'border-[#182C5A]',
    accentText: 'text-cyan-400 font-mono tracking-wide',
    accentBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-[#040814] font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    accentBorder: 'border-cyan-500/40',
    accentFocus: 'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400',
    accentBadge: 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]',
    accentLight: 'text-cyan-300',
    gradientFrom: 'from-cyan-500/15',
    bannerBg: 'bg-[#0B1736] text-cyan-200 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]',
    headerBg: 'bg-[#060D1F] border-b border-[#14264F] text-white',
    headerIsDark: true,
    headerTextTitle: 'text-white',
    headerTextMuted: 'text-cyan-400/80 font-mono',
    tableHeaderBg: 'bg-[#0B1630]',
    tableRowHover: 'hover:bg-[#0E1E42]',
    tableBorder: 'border-[#14264F]',
  }
};

function mapSaleToUniform(s: any): UniformBookRecord {
  const isVat = s.output_vat > 0 || (s.vat_or_nonvat && !s.vat_or_nonvat.includes('NON'));
  const amount = Number(s.amount || s.invoice_amount) || 0;
  const vatable = Number(s.vatable_amount || s.vatable_sales) || (isVat ? Math.round((amount / 1.12) * 100) / 100 : 0);
  const vat = Number(s.vat_amount || s.output_vat || s.vat) || (isVat ? Math.round((amount - vatable) * 100) / 100 : 0);
  const netOfVat = Number(s.total_amount_net_of_vat || s.amount_net_of_vat) || (amount - vat);
  const discount = Number(s.discount || s.discounts || s.less_discount) || 0;
  const withheld = Number(s.tax_withheld || s.withholding_2307 || s.less_withholding_tax) || 0;
  const totalDue = Number(s.total_amount_due) || (amount - discount - withheld);

  return {
    id: s.id || Date.now(),
    company_name: s.company_name,
    registered_name: s.registered_name || s.customer_name || 'Customer',
    vat_or_nonvat: isVat ? 'VAT' : 'NONVAT',
    tin: s.tin || s.customer_tin || s.client_TIN || '000-000-000-00000',
    address: s.address || s.client_Address || '',
    type_of_transaction: (s.type_of_transaction || (s.sales_status === 'Paid' ? 'CASH' : 'ON ACCOUNT')) as any,
    date: s.date || s.invoice_date || s.issue_date || new Date().toISOString().split('T')[0],
    invoice_type: s.invoice_type || 'SALES INVOICE',
    voucher_number: s.voucher_number || '',
    invoice_number: s.invoice_number || `SI-${s.id}`,
    particulars: s.particulars || s.description || 'Sales Transaction',
    qty: Number(s.qty) || 1,
    unit_price: Number(s.unit_price) || amount,
    amount: amount,
    vatable_amount: vatable,
    vat_amount: vat,
    zero_rated_amount: Number(s.zero_rated_amount || s.zero_rated) || 0,
    vat_exempt_amount: Number(s.vat_exempt_amount || s.vat_exempt) || 0,
    total_amount_vat_inclusive: Number(s.total_amount_vat_inclusive || s.total_sale_vat_inclusive) || amount,
    total_amount_net_of_vat: netOfVat,
    discount: discount,
    tax_withheld: withheld,
    total_amount_due: totalDue,
    is_cancelled: Boolean(s.is_cancelled || s.sales_status === 'Cancelled'),
    created_at: s.created_at || new Date().toISOString(),
    customer_name: s.registered_name || s.customer_name,
    customer_tin: s.tin || s.customer_tin || s.client_TIN,
    client_TIN: s.tin || s.customer_tin || s.client_TIN,
    client_Address: s.address || s.client_Address,
    invoice_amount: amount,
    vatable_sales: vatable,
    output_vat: vat,
    withholding_2307: withheld
  };
}

function mapExpenseToUniform(e: any): UniformBookRecord {
  const isVat = e.vat_input_amount > 0 || (e.nonvat_or_vat !== 'NON-VATABLE' && e.vat_or_nonvat !== 'NONVAT');
  const amount = Number(e.amount || e.expense_invoice_amount) || 0;
  const vatable = Number(e.vatable_amount || e.vatable_expense) || (isVat ? Math.round((amount / 1.12) * 100) / 100 : 0);
  const vat = Number(e.vat_amount || e.vat_input_amount || e.vat) || (isVat ? Math.round((amount - vatable) * 100) / 100 : 0);
  const netOfVat = Number(e.total_amount_net_of_vat || e.amount_net_of_vat) || (amount - vat);
  const discount = Number(e.discount || e.discounts || e.less_discount) || 0;
  const withheld = Number(e.tax_withheld || e.withholding_2307_2306 || e.less_withholding_tax) || 0;
  const totalDue = Number(e.total_amount_due) || (amount - discount - withheld);

  return {
    id: e.id || Date.now(),
    company_name: e.company_name,
    registered_name: e.registered_name || e.service_provider_name || 'Vendor',
    vat_or_nonvat: isVat ? 'VAT' : 'NONVAT',
    tin: e.tin || e.service_provider_tin || e.sp_tin || '000-000-000-00000',
    address: e.address || e.sp_address || '',
    type_of_transaction: (e.type_of_transaction || (e.expense_status === 'Paid' ? 'CASH' : 'ON ACCOUNT')) as any,
    date: e.date || e.expense_date || new Date().toISOString().split('T')[0],
    invoice_type: e.invoice_type || 'OFFICIAL RECEIPT',
    voucher_number: e.voucher_number || e.voucher_no || '',
    invoice_number: e.invoice_number || e.voucher_number || `EXP-${e.id}`,
    particulars: e.particulars || e.description || e.expense_type || 'Purchases / Expenses',
    qty: Number(e.qty) || 1,
    unit_price: Number(e.unit_price) || amount,
    amount: amount,
    vatable_amount: vatable,
    vat_amount: vat,
    zero_rated_amount: Number(e.zero_rated_amount || e.zero_rated) || 0,
    vat_exempt_amount: Number(e.vat_exempt_amount || e.vat_exempt) || 0,
    total_amount_vat_inclusive: Number(e.total_amount_vat_inclusive || e.total_expenses_vat_inclusive) || amount,
    total_amount_net_of_vat: netOfVat,
    discount: discount,
    tax_withheld: withheld,
    total_amount_due: totalDue,
    is_cancelled: Boolean(e.is_cancelled || e.expense_status === 'Cancelled'),
    created_at: e.created_at || new Date().toISOString(),
    service_provider_name: e.registered_name || e.service_provider_name,
    service_provider_tin: e.tin || e.service_provider_tin || e.sp_tin,
    sp_tin: e.tin || e.service_provider_tin || e.sp_tin,
    expense_invoice_amount: amount,
    vat_input_amount: vat,
    withholding_2307_2306: withheld
  };
}

function mapCollectionToUniform(c: any): UniformBookRecord {
  const amount = Number(c.amount || c.amount_collected) || 0;
  const isVat = c.vat_or_nonvat !== 'NONVAT';
  const vatable = Number(c.vatable_amount) || (isVat ? Math.round((amount / 1.12) * 100) / 100 : 0);
  const vat = Number(c.vat_amount) || (isVat ? Math.round((amount - vatable) * 100) / 100 : 0);
  const withheld = Number(c.tax_withheld || c.amount_withheld_2307) || 0;
  const discount = Number(c.discount) || 0;
  const totalDue = Number(c.total_amount_due) || (amount - discount - withheld);

  return {
    id: c.id || Date.now(),
    company_name: c.company_name,
    registered_name: c.registered_name || c.customer_name || 'Customer',
    vat_or_nonvat: isVat ? 'VAT' : 'NONVAT',
    tin: c.tin || c.customer_tin || c.client_TIN || '000-000-000-00000',
    address: c.address || '',
    type_of_transaction: (c.type_of_transaction || 'CASH') as any,
    date: c.date || c.collection_date || new Date().toISOString().split('T')[0],
    invoice_type: c.invoice_type || 'OFFICIAL RECEIPT',
    voucher_number: c.voucher_number || c.entry_number || '',
    invoice_number: c.invoice_number || c.OR_PR_number || `CR-${c.id}`,
    particulars: c.particulars || c.notes || `Collection for Invoice #${c.invoice_number || ''}`,
    qty: Number(c.qty) || 1,
    unit_price: Number(c.unit_price) || amount,
    amount: amount,
    vatable_amount: vatable,
    vat_amount: vat,
    zero_rated_amount: Number(c.zero_rated_amount) || 0,
    vat_exempt_amount: Number(c.vat_exempt_amount) || 0,
    total_amount_vat_inclusive: Number(c.total_amount_vat_inclusive) || amount,
    total_amount_net_of_vat: Number(c.total_amount_net_of_vat) || (amount - vat),
    discount: discount,
    tax_withheld: withheld,
    total_amount_due: totalDue,
    is_cancelled: Boolean(c.is_cancelled),
    created_at: c.created_at || new Date().toISOString(),
    amount_collected: amount,
    amount_withheld_2307: withheld
  };
}

function mapPaymentToUniform(p: any): UniformBookRecord {
  const amount = Number(p.amount || p.amount_paid) || 0;
  const isVat = p.vat_or_nonvat !== 'NONVAT';
  const vatable = Number(p.vatable_amount) || (isVat ? Math.round((amount / 1.12) * 100) / 100 : 0);
  const vat = Number(p.vat_amount) || (isVat ? Math.round((amount - vatable) * 100) / 100 : 0);
  const withheld = Number(p.tax_withheld || p.withholding_tax_2307) || 0;
  const discount = Number(p.discount) || 0;
  const totalDue = Number(p.total_amount_due) || (amount - discount - withheld);

  return {
    id: p.id || Date.now(),
    company_name: p.company_name,
    registered_name: p.registered_name || p.service_provider_name || p.payee_name || 'Payee',
    vat_or_nonvat: isVat ? 'VAT' : 'NONVAT',
    tin: p.tin || p.sp_tin || p.service_provider_TIN || '000-000-000-00000',
    address: p.address || p.sp_address || '',
    type_of_transaction: (p.type_of_transaction || 'CASH') as any,
    date: p.date || p.payment_date || new Date().toISOString().split('T')[0],
    invoice_type: p.invoice_type || 'OFFICIAL RECEIPT',
    voucher_number: p.voucher_number || p.check_voucher_number || '',
    invoice_number: p.invoice_number || p.voucher_number || `CD-${p.id}`,
    particulars: p.particulars || p.notes || `Disbursement for Voucher #${p.voucher_number || ''}`,
    qty: Number(p.qty) || 1,
    unit_price: Number(p.unit_price) || amount,
    amount: amount,
    vatable_amount: vatable,
    vat_amount: vat,
    zero_rated_amount: Number(p.zero_rated_amount) || 0,
    vat_exempt_amount: Number(p.vat_exempt_amount) || 0,
    total_amount_vat_inclusive: Number(p.total_amount_vat_inclusive) || amount,
    total_amount_net_of_vat: Number(p.total_amount_net_of_vat) || (amount - vat),
    discount: discount,
    tax_withheld: withheld,
    total_amount_due: totalDue,
    is_cancelled: Boolean(p.is_cancelled),
    created_at: p.created_at || new Date().toISOString(),
    amount_paid: amount,
    withholding_tax_2307: withheld
  };
}

export default function App() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [activeCompany, setActiveCompany] = useState<Company | null>(INITIAL_COMPANIES[0] || null);
  const [activeBranchCode, setActiveBranchCode] = useState<string>('ALL');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);

  // Legacy arrays kept in sync
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);

  // 2OS Uniform Books of Accounts (Exact 21 uniform database headers)
  const [subsidiarySales, setSubsidiarySales] = useState<UniformBookRecord[]>(() => INITIAL_SALES.map(mapSaleToUniform));
  const [subsidiaryPurchases, setSubsidiaryPurchases] = useState<UniformBookRecord[]>(() => INITIAL_EXPENSES.map(mapExpenseToUniform));
  const [cashReceipts, setCashReceipts] = useState<UniformBookRecord[]>(() => INITIAL_COLLECTIONS.map(mapCollectionToUniform));
  const [cashDisbursements, setCashDisbursements] = useState<UniformBookRecord[]>(() => INITIAL_PAYMENTS.map(mapPaymentToUniform));
  const [collectionsRecords, setCollectionsRecords] = useState<UniformBookRecord[]>(() => INITIAL_COLLECTIONS.map(mapCollectionToUniform));
  const [paymentsRecords, setPaymentsRecords] = useState<UniformBookRecord[]>(() => INITIAL_PAYMENTS.map(mapPaymentToUniform));

  const handleUpdateSubsidiarySales = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setSubsidiarySales(prev => {
      const next = updater(prev);
      setSales(next as any);
      return next;
    });
  };

  const handleUpdateSubsidiaryPurchases = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setSubsidiaryPurchases(prev => {
      const next = updater(prev);
      setExpenses(next as any);
      return next;
    });
  };

  const handleUpdateCashReceipts = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setCashReceipts(prev => {
      const next = updater(prev);
      setCollections(next as any);
      return next;
    });
  };

  const handleUpdateCashDisbursements = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setCashDisbursements(prev => {
      const next = updater(prev);
      setPayments(next as any);
      return next;
    });
  };

  const handleUpdateCollectionsRecords = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setCollectionsRecords(prev => {
      const next = updater(prev);
      setCollections(next as any);
      return next;
    });
  };

  const handleUpdatePaymentsRecords = (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => {
    setPaymentsRecords(prev => {
      const next = updater(prev);
      setPayments(next as any);
      return next;
    });
  };
  const [accountTitles, setAccountTitles] = useState<AccountTitle[]>(INITIAL_ACCOUNT_TITLES);
  const [ppeAssets, setPpeAssets] = useState<PPEAsset[]>(INITIAL_PPE);
  const [specialEntries, setSpecialEntries] = useState<SpecialEntry[]>(INITIAL_SPECIAL_ENTRIES);
  const [incomeTaxRecords, setIncomeTaxRecords] = useState<IncomeTaxRecord[]>(INITIAL_INCOME_TAX_RECORDS);
  const [employees, setEmployees] = useState<any[]>(INITIAL_EMPLOYEES);
  const [payrollRecords, setPayrollRecords] = useState<any[]>(INITIAL_PAYROLL_RECORDS);
  const [sssBrackets, setSssBrackets] = useState<SssBracket[]>(INITIAL_SSS_TABLE);
  const [philhealthConfig, setPhilhealthConfig] = useState<PhilHealthConfig>(INITIAL_PHILHEALTH_CONFIG);
  const [pagibigConfig, setPagibigConfig] = useState<PagIbigConfig>(INITIAL_PAGIBIG_CONFIG);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>(INITIAL_WITHHOLDING_TAX_TABLE);
  const [notesToFS, setNotesToFS] = useState<NoteToFS[]>([]);

  const [theme, setTheme] = useState<ThemeMode>('trial_layout');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInfinityFreeModalOpen, setIsInfinityFreeModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importDefaultType, setImportDefaultType] = useState<ImportableDataType>('sales');

  // Load backend data (with localStorage fallback for static hosting like GitHub Pages)
  useEffect(() => {
    async function loadData() {
      let loaded = false;
      try {
        const res = await fetch('/api/ledger-data');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            applyData(data);
            loaded = true;
          }
        }
      } catch (e) {
        console.warn("API load unavailable (static host), falling back to browser storage:", e);
      }

      // If backend API wasn't available (e.g. GitHub Pages), load from localStorage
      if (!loaded) {
        try {
          const localSaved = localStorage.getItem('2os_accounting_ledger_data');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            applyData(parsed);
          }
        } catch (err) {
          console.warn("Failed to load from localStorage:", err);
        }
      }

      setIsLoaded(true);
    }

    function applyData(data: any) {
      if (Array.isArray(data.companies)) {
        setCompanies(data.companies);
        let found = null;
        if (data.activeCompanyId) {
          found = data.companies.find((c: any) => String(c.id) === String(data.activeCompanyId));
        }
        setActiveCompany(found || data.companies[0] || null);
      }
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.contractors)) setContractors(data.contractors);

      if (Array.isArray(data.subsidiarySales)) {
        const mapped = data.subsidiarySales.map(mapSaleToUniform);
        setSubsidiarySales(mapped);
        setSales(mapped as any);
      } else if (Array.isArray(data.sales)) {
        const mapped = data.sales.map(mapSaleToUniform);
        setSubsidiarySales(mapped);
        setSales(data.sales);
      } else {
        setSubsidiarySales([]);
        setSales([]);
      }

      if (Array.isArray(data.subsidiaryPurchases)) {
        const mapped = data.subsidiaryPurchases.map(mapExpenseToUniform);
        setSubsidiaryPurchases(mapped);
        setExpenses(mapped as any);
      } else if (Array.isArray(data.expenses)) {
        const mapped = data.expenses.map(mapExpenseToUniform);
        setSubsidiaryPurchases(mapped);
        setExpenses(data.expenses);
      } else {
        setSubsidiaryPurchases([]);
        setExpenses([]);
      }

      if (Array.isArray(data.cashReceipts)) {
        const mapped = data.cashReceipts.map(mapCollectionToUniform);
        setCashReceipts(mapped);
        setCollections(mapped as any);
      } else if (Array.isArray(data.collections)) {
        const mapped = data.collections.map(mapCollectionToUniform);
        setCashReceipts(mapped);
        setCollections(data.collections);
      } else {
        setCashReceipts([]);
        setCollections([]);
      }

      if (Array.isArray(data.collectionsRecords)) {
        const mapped = data.collectionsRecords.map(mapCollectionToUniform);
        setCollectionsRecords(mapped);
      } else if (Array.isArray(data.collections)) {
        const mapped = data.collections.map(mapCollectionToUniform);
        setCollectionsRecords(mapped);
      } else {
        setCollectionsRecords([]);
      }

      if (Array.isArray(data.cashDisbursements)) {
        const mapped = data.cashDisbursements.map(mapPaymentToUniform);
        setCashDisbursements(mapped);
        setPayments(mapped as any);
      } else if (Array.isArray(data.payments)) {
        const mapped = data.payments.map(mapPaymentToUniform);
        setCashDisbursements(mapped);
        setPayments(data.payments);
      } else {
        setCashDisbursements([]);
        setPayments([]);
      }

      if (Array.isArray(data.paymentsRecords)) {
        const mapped = data.paymentsRecords.map(mapPaymentToUniform);
        setPaymentsRecords(mapped);
      } else if (Array.isArray(data.payments)) {
        const mapped = data.payments.map(mapPaymentToUniform);
        setPaymentsRecords(mapped);
      } else {
        setPaymentsRecords([]);
      }

      if (Array.isArray(data.ppeAssets)) setPpeAssets(data.ppeAssets);
      if (Array.isArray(data.employees)) setEmployees(data.employees);
      if (Array.isArray(data.payrollRecords)) setPayrollRecords(data.payrollRecords);
      if (data.sssBrackets) setSssBrackets(data.sssBrackets);
      if (data.philhealthConfig) setPhilhealthConfig(data.philhealthConfig);
      if (data.pagibigConfig) setPagibigConfig(data.pagibigConfig);
      if (data.taxBrackets) setTaxBrackets(data.taxBrackets);
      if (data.accountTitles) setAccountTitles(data.accountTitles);
      if (Array.isArray(data.specialEntries)) setSpecialEntries(data.specialEntries);
      if (Array.isArray(data.incomeTaxRecords)) setIncomeTaxRecords(data.incomeTaxRecords);
      if (data.theme && ['neon_light', 'clean', 'dark', 'trial_layout'].includes(data.theme)) {
        setTheme(data.theme);
      }
    }

    loadData();
  }, []);

  // Save to Express backend AND localStorage (ensures offline/GitHub Pages persistence)
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      const payload = {
        companies,
        activeCompanyId: activeCompany?.id,
        customers,
        contractors,
        subsidiarySales,
        subsidiaryPurchases,
        cashReceipts,
        cashDisbursements,
        collectionsRecords,
        paymentsRecords,
        sales: subsidiarySales,
        collections: cashReceipts,
        expenses: subsidiaryPurchases,
        payments: cashDisbursements,
        ppeAssets,
        employees,
        payrollRecords,
        sssBrackets,
        philhealthConfig,
        pagibigConfig,
        taxBrackets,
        accountTitles,
        specialEntries,
        incomeTaxRecords,
        theme,
      };

      try {
        localStorage.setItem('2os_accounting_ledger_data', JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }

      fetch('/api/ledger-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Backend optional in static hosting like GitHub Pages
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, companies, activeCompany, customers, contractors, sales, collections, expenses, payments, ppeAssets, employees, payrollRecords, sssBrackets, philhealthConfig, pagibigConfig, taxBrackets, accountTitles, specialEntries, incomeTaxRecords, theme]);

  // NAVIGATION ACTIVE TAB
  const [activeTab, setActiveTab] = useState<
    | 'sales' | 'collections' | 'expenses' | 'payments' | 'general_journal' | 'general_ledger' // Group 1
    | 'subsidiary_sales' | 'subsidiary_purchases' | 'cash_receipts' | 'cash_disbursements' | 'cash_receipt' | 'cash_disbursement' | 'special_ledger'
    | 'sales_transaction' | 'purchase_transaction'
    | 'companies' | 'customers' | 'providers' | 'related_parties' | 'employees' // Group 2
    | 'dashboard' | 'account_titles' | 'tax_calendar' | 'activities' | 'activity_lists' | 'about_app' | 'system_specs' | 'about' // Group 3
    | 'tax_reports' | 'income_tax' | 'ppe' | 'payroll' | 'contribution_tables' | 'cwt_customers' | 'cwt_providers' | 'special_entries' // Group 4
    | 'fs_position' | 'fs_income' | 'fs_equity' | 'fs_cashflows' | 'fs_notes' // Group 5
    | 'bir_2316' | 'bir_slsp' | 'bir_qap' | 'bir_sawt' // Group 6
    | 'reports' // Group 7
  >('dashboard');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Global Period Selection (Month / Year / Prefix) synchronized across Document Header, Dashboard, Reports, and Journals
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(7); // 7 = August
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedPrefix, setSelectedPrefix] = useState<string>('FOR THE MONTH OF');

  const handleMonthYearChange = (newMonth: number, newYear: number, newPrefix?: string) => {
    setSelectedMonthIdx(newMonth);
    setSelectedYear(newYear);
    if (newPrefix) {
      setSelectedPrefix(newPrefix);
    }
  };

  // Accordion State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    group1: true,
    group2: true,
    group3: true,
    group4: true,
    group5: true,
    group6: true,
    group7: true,
    group8: true
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const [globalSearch, setGlobalSearch] = useState('');
  const [showAddCustomerPrompt, setShowAddCustomerPrompt] = useState<{ tin: string, type: 'sales' | 'collections' } | null>(null);
  const [showAddProviderPrompt, setShowAddProviderPrompt] = useState<{ tin: string, type: 'expenses' | 'payments' } | null>(null);

  const [alertMsg, setAlertMsg] = useState<{ 
    text: string; 
    type: 'success' | 'error' | 'info'; 
    action?: { label: string; href: string; download: string };
  } | null>(null);

  const triggerAlert = (
    text: string, 
    type: 'success' | 'error' | 'info' = 'success',
    action?: { label: string; href: string; download: string }
  ) => {
    setAlertMsg({ text, type, action });
    setTimeout(() => {
      setAlertMsg(null);
    }, action ? 12000 : 4500);
  };

  const activeTheme = themeConfigs[theme] || themeConfigs.neon_light;

  // Filter Data by Selected Company
  const activeCompanyName = activeCompany?.company_name || '';

  const companySales = sales.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
  const companyCollections = collections.filter(c => !activeCompanyName || c.company_name === activeCompanyName);
  const companyExpenses = expenses.filter(e => !activeCompanyName || e.company_name === activeCompanyName);
  const companyPayments = payments.filter(p => !activeCompanyName || p.company_name === activeCompanyName);
  const companySpecialEntries = specialEntries.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
  const companyIncomeTaxRecords = incomeTaxRecords.filter(r => !activeCompanyName || r.company_name === activeCompanyName);
  const companyPpeAssets = ppeAssets.filter(a => !activeCompanyName || a.company_name === activeCompanyName);
  const companyPayrollRecords = payrollRecords.filter(r => !activeCompanyName || r.company_name === activeCompanyName);
  const companyEmployees = employees.filter(e => !activeCompanyName || e.company_name === activeCompanyName);

  // Currency & Statistical Formatting Helpers for Operational Views
  const fmtMoney = (val: number) => {
    return '₱' + (Number(val) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtShortMoney = (val: number) => {
    const num = Math.abs(Number(val) || 0);
    const sign = val < 0 ? '-' : '';
    if (num >= 1000000) return `${sign}₱${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${sign}₱${(num / 1000).toFixed(0)}k`;
    return `${sign}₱${num.toFixed(0)}`;
  };

  const totalSalesDue = companySales.reduce((sum, s) => sum + (Number(s.invoice_amount) || 0), 0);
  const totalColls = companyCollections.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
  const overdueAR = Math.max(0, totalSalesDue - totalColls);

  const totalExpDue = companyExpenses.reduce((sum, e) => sum + (Number(e.expense_invoice_amount) || 0), 0);
  const totalPaid = companyPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  const outstandingAP = Math.max(0, totalExpDue - totalPaid);
  
  const netVatPayable = Math.max(0, 
    companySales.reduce((sum, s) => sum + (Number(s.output_vat) || 0), 0) - 
    companyExpenses.reduce((sum, e) => sum + (Number(e.vat_input_amount) || 0), 0)
  );

  const withholdingTaxCompPayable = companyPayrollRecords.reduce((sum, p) => sum + (Number(p.withholding_tax) || 0), 0);
  const statutoryPayable = companyPayrollRecords.reduce((sum, p) => sum + (Number(p.sss_deduction) || 0) + (Number(p.philhealth_deduction) || 0) + (Number(p.pagibig_deduction) || 0), 0);
  const payrollNet = companyPayrollRecords.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);

  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const getActiveTabRecordCount = (): number => {
    switch (activeTab) {
      case 'sales': return companySales.length;
      case 'collections': return companyCollections.length;
      case 'expenses': return companyExpenses.length;
      case 'payments': return companyPayments.length;
      case 'special_entries': return companySpecialEntries.length;
      case 'ppe': return companyPpeAssets.length;
      case 'income_tax': return companyIncomeTaxRecords.length;
      case 'employees': return companyEmployees.length;
      case 'payroll': return companyPayrollRecords.length;
      case 'companies': return companies.length;
      case 'related_parties': return customers.length + contractors.length;
      case 'customers': return customers.length;
      case 'providers': return contractors.length;
      case 'account_titles': return accountTitles.length;
      default: return 0;
    }
  };

  const handleExportActiveSheet = () => {
    let sheetData: any[] = [];
    if (activeTab === 'sales') sheetData = companySales;
    else if (activeTab === 'collections') sheetData = companyCollections;
    else if (activeTab === 'expenses') sheetData = companyExpenses;
    else if (activeTab === 'payments') sheetData = companyPayments;
    else if (activeTab === 'special_entries') sheetData = companySpecialEntries;
    else if (activeTab === 'ppe') sheetData = companyPpeAssets;
    else if (activeTab === 'employees') sheetData = companyEmployees;
    else if (activeTab === 'payroll') sheetData = companyPayrollRecords;
    else if (activeTab === 'companies') sheetData = companies;
    else if (activeTab === 'customers') sheetData = customers;
    else if (activeTab === 'providers') sheetData = contractors;
    else if (activeTab === 'account_titles') sheetData = accountTitles;
    else sheetData = companySales;
    exportActiveSheetTo2OS(activeTab, sheetData, activeCompanyName);
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'sales': return 'Sales Invoices';
      case 'expenses': return 'Expenses & APV';
      case 'collections': return 'Collections / Cash Receipts';
      case 'payments': return 'Disbursements & Payments';
      case 'companies': return 'Entity Profiles';
      case 'customers': return 'Customers Directory';
      case 'providers': return 'Service Providers Directory';
      case 'account_titles': return 'Chart of Accounts';
      case 'general_journal':
      case 'special_entries': return 'General Journal';
      case 'general_ledger': return 'General Ledger';
      case 'ppe': return 'Property, Plant & Equipment';
      case 'employees': return 'Employee Profiles';
      case 'payroll': return 'Payroll Register';
      case 'income_tax': return 'Income Tax';
      case 'dashboard': return 'Executive Dashboard';
      default: return tab.toUpperCase().replace(/_/g, ' ');
    }
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleOpenImportModal = () => {
    let defType: ImportableDataType = 'sales';
    if (activeTab === 'expenses') defType = 'expenses';
    else if (activeTab === 'collections') defType = 'collections';
    else if (activeTab === 'payments') defType = 'payments';
    else if (activeTab === 'customers') defType = 'customers';
    else if (activeTab === 'providers') defType = 'providers';
    else if (activeTab === 'account_titles') defType = 'account_titles';
    else if (activeTab === 'employees' || activeTab === 'payroll') defType = 'employees';
    else if (activeTab === 'special_entries' || activeTab === 'general_journal') defType = 'special_entries';
    else if (activeTab === 'ppe') defType = 'ppe';
    setImportDefaultType(defType);
    setIsImportModalOpen(true);
  };

  const handleConfirmImport = async (
    dataType: ImportableDataType,
    parsedRows: Record<string, string>[],
    headers: string[]
  ): Promise<{ success: boolean; message?: string }> => {
    const currentCompanyName = activeCompany?.company_name || 'ABC Corporation';

    let updatedSales = [...sales];
    let updatedExpenses = [...expenses];
    let updatedCollections = [...collections];
    let updatedPayments = [...payments];
    let updatedCustomers = [...customers];
    let updatedContractors = [...contractors];
    let updatedAccountTitles = [...accountTitles];
    let updatedEmployees = [...employees];
    let updatedSpecialEntries = [...specialEntries];
    let updatedPpeAssets = [...ppeAssets];

    let importedCount = 0;

    switch (dataType) {
      case 'sales': {
        const mapped = mapRowsToSales(parsedRows, currentCompanyName) as Sale[];
        updatedSales = [...mapped, ...updatedSales];
        setSales(updatedSales);
        setSubsidiarySales(updatedSales.map(mapSaleToUniform));
        importedCount = mapped.length;
        break;
      }
      case 'expenses': {
        const mapped = mapRowsToExpenses(parsedRows, currentCompanyName) as Expense[];
        updatedExpenses = [...mapped, ...updatedExpenses];
        setExpenses(updatedExpenses);
        setSubsidiaryPurchases(updatedExpenses.map(mapExpenseToUniform));
        importedCount = mapped.length;
        break;
      }
      case 'collections': {
        const mapped = mapRowsToCollections(parsedRows, currentCompanyName) as Collection[];
        updatedCollections = [...mapped, ...updatedCollections];
        setCollections(updatedCollections);
        setCashReceipts(updatedCollections.map(mapCollectionToUniform));
        setCollectionsRecords(updatedCollections.map(mapCollectionToUniform));
        importedCount = mapped.length;
        break;
      }
      case 'payments': {
        const mapped = mapRowsToPayments(parsedRows, currentCompanyName) as Payment[];
        updatedPayments = [...mapped, ...updatedPayments];
        setPayments(updatedPayments);
        setCashDisbursements(updatedPayments.map(mapPaymentToUniform));
        setPaymentsRecords(updatedPayments.map(mapPaymentToUniform));
        importedCount = mapped.length;
        break;
      }
      case 'customers': {
        const mapped = mapRowsToCustomers(parsedRows) as Customer[];
        updatedCustomers = [...mapped, ...updatedCustomers];
        setCustomers(updatedCustomers);
        importedCount = mapped.length;
        break;
      }
      case 'providers': {
        const mapped = mapRowsToProviders(parsedRows) as Contractor[];
        updatedContractors = [...mapped, ...updatedContractors];
        setContractors(updatedContractors);
        importedCount = mapped.length;
        break;
      }
      case 'account_titles': {
        const mapped = mapRowsToAccountTitles(parsedRows) as AccountTitle[];
        updatedAccountTitles = [...mapped, ...updatedAccountTitles];
        setAccountTitles(updatedAccountTitles);
        importedCount = mapped.length;
        break;
      }
      case 'employees': {
        const mapped = mapRowsToEmployees(parsedRows, currentCompanyName);
        updatedEmployees = [...mapped, ...updatedEmployees];
        setEmployees(updatedEmployees);
        importedCount = mapped.length;
        break;
      }
      case 'special_entries': {
        const mapped = mapRowsToSpecialEntries(parsedRows, currentCompanyName) as SpecialEntry[];
        updatedSpecialEntries = [...mapped, ...updatedSpecialEntries];
        setSpecialEntries(updatedSpecialEntries);
        importedCount = mapped.length;
        break;
      }
      case 'ppe': {
        const mapped = mapRowsToPPE(parsedRows, currentCompanyName) as PPEAsset[];
        updatedPpeAssets = [...mapped, ...updatedPpeAssets];
        setPpeAssets(updatedPpeAssets);
        importedCount = mapped.length;
        break;
      }
    }

    // Immediately update the .db files via /api/ledger-data
    const syncPayload = {
      companies,
      activeCompanyId: activeCompany?.id,
      customers: updatedCustomers,
      contractors: updatedContractors,
      sales: updatedSales,
      collections: updatedCollections,
      expenses: updatedExpenses,
      payments: updatedPayments,
      ppeAssets: updatedPpeAssets,
      employees: updatedEmployees,
      payrollRecords,
      sssBrackets,
      philhealthConfig,
      pagibigConfig,
      taxBrackets,
      accountTitles: updatedAccountTitles,
      specialEntries: updatedSpecialEntries,
      incomeTaxRecords,
      theme,
    };

    try {
      await fetch('/api/ledger-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload),
      });
    } catch (e) {
      console.warn('Backend SQLite sync warning:', e);
    }

    try {
      localStorage.setItem('2os_ledger_data', JSON.stringify(syncPayload));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    triggerAlert('import data successful', 'success');
    return {
      success: true,
      message: `import data successful. ${importedCount} records added and local .db files updated.`
    };
  };

  const handleManualSave = () => {
    fetch('/api/ledger-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies,
        activeCompanyId: activeCompany?.id,
        customers,
        contractors,
        sales,
        collections,
        expenses,
        payments,
        ppeAssets,
        employees,
        payrollRecords,
        sssBrackets,
        philhealthConfig,
        pagibigConfig,
        taxBrackets,
        accountTitles,
        specialEntries,
        incomeTaxRecords,
        theme,
      }),
    }).catch((e) => console.warn('Failed to sync to backend file database:', e));
  };

  return (
    <div className={`min-h-screen ${activeTheme.bgMain} flex flex-col font-sans antialiased ${activeTheme.textMain} transition-colors duration-200`}>
      
      {/* ALERTS */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-2xl flex flex-col sm:flex-row items-center gap-3.5 px-5 py-3.5 rounded-xl border max-w-xl ${activeTheme.bgCard} ${activeTheme.borderCard} ${activeTheme.textMain}`}
          >
            <div className="flex items-center gap-2.5">
              {alertMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
              {alertMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
              {alertMsg.type === 'info' && <Layers className="w-5 h-5 text-sky-500 flex-shrink-0" />}
              <span className="text-sm font-medium leading-normal">{alertMsg.text}</span>
            </div>
            {alertMsg.action && (
              <a
                href={alertMsg.action.href}
                download={alertMsg.action.download}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition whitespace-nowrap"
              >
                {alertMsg.action.label}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1 & 2. FROZEN TOP BAR & NAVIGATION RIBBON (STICKY ON SCROLL) */}
      <div className="sticky top-0 z-40 w-full flex-shrink-0 shadow-md">
        <TwoOSTopBar 
          activeCompany={activeCompany}
          companies={companies}
          onSelectCompany={(c) => {
            setActiveCompany(c);
            triggerAlert(`Active Company switched to: ${c.company_name}`, 'success');
          }}
          activeBranchCode={activeBranchCode}
          selectedMonthIdx={selectedMonthIdx}
          selectedYear={selectedYear}
          selectedPrefix={selectedPrefix}
          onMonthYearChange={handleMonthYearChange}
          globalSearch={globalSearch}
          onSearchChange={setGlobalSearch}
          onSave={handleManualSave}
          onExportAll={handleOpenExportModal}
          onExportActiveSheet={handleOpenExportModal}
          onOpenInfinityFreeModal={() => setIsInfinityFreeModalOpen(true)}
          onOpenAuditTrail={() => setIsAuditModalOpen(true)}
          onOpenSettings={() => {
            setActiveTab('system_specs');
          }}
          activeTab={activeTab}
          triggerAlert={triggerAlert}
          theme={activeTheme}
          themeMode={theme}
          setThemeMode={(m) => setTheme(m as any)}
        />

        <TwoOSRibbon 
          activeTab={activeTab}
          onSelectTab={(k) => setActiveTab(k as any)}
          activeCompany={activeCompany}
          companies={companies}
          onSelectCompany={(c) => {
            setActiveCompany(c);
            triggerAlert(`Active Company switched to: ${c.company_name}`, 'success');
          }}
          onExportActiveSheet={handleOpenExportModal}
          onExportAllSheets={handleOpenExportModal}
          onOpenImportModal={handleOpenImportModal}
          onOpenExportModal={handleOpenExportModal}
          activeBranchCode={activeBranchCode}
          selectedMonthIdx={selectedMonthIdx}
          selectedYear={selectedYear}
          selectedPrefix={selectedPrefix}
          onMonthYearChange={handleMonthYearChange}
          theme={activeTheme}
          themeMode={theme}
          setThemeMode={(m) => setTheme(m as any)}
          triggerAlert={triggerAlert}
          customersCount={customers.length}
          providersCount={contractors.length}
        />
      </div>

      {/* 3. MAIN SPREADSHEET WORKSPACE (TAB CONTENT DISPLAY) */}
      <main className={`flex-grow w-full flex flex-col px-3 sm:px-6 py-4 overflow-x-hidden ${
        theme === 'dark' 
          ? 'bg-[#0a0a0d]' 
          : theme === 'trial_layout'
          ? 'bg-[#f1f5f9]'
          : theme === 'neon_light'
          ? 'bg-slate-50'
          : 'bg-zinc-50'
      }`}>
        
        {/* SPREADSHEET CANVAS WITH ZOOM SUPPORT */}
        <div 
          style={{ 
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, 
            transformOrigin: 'top left',
            width: zoomLevel !== 100 ? `${(100 / zoomLevel) * 100}%` : '100%' 
          }}
          className="flex-grow flex flex-col gap-4 transition-transform duration-100"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.12 }}
              className="w-full"
            >
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard 
                  sales={sales}
                  collections={collections}
                  expenses={expenses}
                  payments={payments}
                  companies={companies}
                  customers={customers}
                  serviceProviders={contractors as any}
                  payrollRecords={payrollRecords}
                  employees={employees}
                  ppeAssets={ppeAssets}
                  specialEntries={specialEntries}
                  incomeTaxRecords={incomeTaxRecords}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  themeMode={theme}
                  triggerAlert={triggerAlert}
                  selectedMonthIdx={selectedMonthIdx}
                  selectedYear={selectedYear}
                  selectedPrefix={selectedPrefix}
                  onMonthYearChange={handleMonthYearChange}
                />
              )}

              {(activeTab === 'sales' || activeTab === 'subsidiary_sales') && (
                <UniformBookTab 
                  bookType="subsidiary_sales"
                  records={subsidiarySales}
                  setRecords={handleUpdateSubsidiarySales}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setSales(list as any)}
                />
              )}

              {(activeTab === 'cash_receipt' || activeTab === 'cash_receipts') && (
                <UniformBookTab 
                  bookType="cash_receipt"
                  records={cashReceipts}
                  setRecords={handleUpdateCashReceipts}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setCollections(list as any)}
                />
              )}

              {activeTab === 'collections' && (
                <UniformBookTab 
                  bookType="collections"
                  records={collectionsRecords}
                  setRecords={handleUpdateCollectionsRecords}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setCollections(list as any)}
                />
              )}

              {(activeTab === 'expenses' || activeTab === 'subsidiary_purchases') && (
                <UniformBookTab 
                  bookType="subsidiary_purchases"
                  records={subsidiaryPurchases}
                  setRecords={handleUpdateSubsidiaryPurchases}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setExpenses(list as any)}
                  accountTitles={accountTitles}
                />
              )}

              {(activeTab === 'cash_disbursement' || activeTab === 'cash_disbursements') && (
                <UniformBookTab 
                  bookType="cash_disbursement"
                  records={cashDisbursements}
                  setRecords={handleUpdateCashDisbursements}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setPayments(list as any)}
                  accountTitles={accountTitles}
                />
              )}

              {activeTab === 'payments' && (
                <UniformBookTab 
                  bookType="payments"
                  records={paymentsRecords}
                  setRecords={handleUpdatePaymentsRecords}
                  activeCompany={activeCompany}
                  customers={customers}
                  contractors={contractors}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onSyncLegacy={(list) => setPayments(list as any)}
                  accountTitles={accountTitles}
                />
              )}

              {activeTab === 'sales_transaction' && (
                <SalesTransactionTab 
                  subsidiarySales={subsidiarySales}
                  setSubsidiarySales={handleUpdateSubsidiarySales}
                  cashReceipts={cashReceipts}
                  setCashReceipts={handleUpdateCashReceipts}
                  collections={collectionsRecords}
                  setCollections={handleUpdateCollectionsRecords}
                  customers={customers}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onNavigateToTab={(tab) => setActiveTab(tab as any)}
                  specialEntries={specialEntries}
                  setSpecialEntries={setSpecialEntries}
                />
              )}

              {activeTab === 'purchase_transaction' && (
                <PurchaseTransactionTab 
                  subsidiaryPurchases={subsidiaryPurchases}
                  setSubsidiaryPurchases={handleUpdateSubsidiaryPurchases}
                  cashDisbursements={cashDisbursements}
                  setCashDisbursements={handleUpdateCashDisbursements}
                  payments={paymentsRecords}
                  setPayments={handleUpdatePaymentsRecords}
                  contractors={contractors}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  onNavigateToTab={(tab) => setActiveTab(tab as any)}
                  accountTitles={accountTitles}
                  specialEntries={specialEntries}
                  setSpecialEntries={setSpecialEntries}
                />
              )}

              {activeTab === 'general_journal' && (
                <GeneralJournalTab 
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  ppeAssets={companyPpeAssets}
                  payrollRecords={companyPayrollRecords}
                  specialEntries={companySpecialEntries}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {(activeTab === 'general_ledger' || activeTab === 'special_ledger') && (
                <GeneralLedgerTab 
                  accountTitles={accountTitles}
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  ppeAssets={companyPpeAssets}
                  payrollRecords={companyPayrollRecords}
                  specialEntries={companySpecialEntries}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'companies' && (
                <CompaniesTab 
                  companies={companies}
                  setCompanies={setCompanies}
                  activeCompany={activeCompany!}
                  setActiveCompany={setActiveCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {(activeTab === 'related_parties' || activeTab === 'customers' || activeTab === 'providers' || activeTab === 'inventory_services') && (
                <RelatedPartiesTab 
                  customers={customers}
                  setCustomers={setCustomers}
                  contractors={contractors}
                  setContractors={setContractors}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  sales={sales}
                  collections={collections}
                  setSales={setSales}
                  setCollections={setCollections}
                  globalSearch={globalSearch}
                  initialSubTab={activeTab === 'providers' ? 'providers' : 'customers'}
                />
              )}

              {activeTab === 'employees' && (
                <EmployeeProfilesTab 
                  employees={employees}
                  setEmployees={setEmployees}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'payroll' && (
                <PayrollTab 
                  payrollRecords={payrollRecords}
                  setPayrollRecords={setPayrollRecords}
                  specialEntries={specialEntries}
                  setSpecialEntries={setSpecialEntries}
                  employees={employees}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                  sssBrackets={sssBrackets}
                  philhealthConfig={philhealthConfig}
                  pagibigConfig={pagibigConfig}
                  taxBrackets={taxBrackets}
                />
              )}

              {activeTab === 'contribution_tables' && (
                <ContributionTablesTab 
                  sssBrackets={sssBrackets}
                  setSssBrackets={setSssBrackets}
                  philhealthConfig={philhealthConfig}
                  setPhilhealthConfig={setPhilhealthConfig}
                  pagibigConfig={pagibigConfig}
                  setPagibigConfig={setPagibigConfig}
                  taxBrackets={taxBrackets}
                  setTaxBrackets={setTaxBrackets}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'account_titles' && (
                <AccountTitlesTab 
                  accountTitles={accountTitles}
                  setAccountTitles={setAccountTitles}
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  specialEntries={companySpecialEntries}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'special_entries' && (
                <SpecialEntriesTab 
                  specialEntries={specialEntries}
                  setSpecialEntries={setSpecialEntries}
                  accountTitles={accountTitles}
                  sales={companySales}
                  expenses={companyExpenses}
                  ppeAssets={companyPpeAssets}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'bank_recon' && (
                <BankReconTab 
                  collections={companyCollections}
                  payments={companyPayments}
                  specialEntries={companySpecialEntries}
                  setSpecialEntries={setSpecialEntries}
                  accountTitles={accountTitles}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {(activeTab === 'tax_reports' || activeTab === 'income_tax') && (
                <TaxReportsTab 
                  sales={companySales}
                  expenses={companyExpenses}
                  ppeAssets={companyPpeAssets}
                  specialEntries={companySpecialEntries}
                  incomeTaxRecords={companyIncomeTaxRecords}
                  setIncomeTaxRecords={setIncomeTaxRecords}
                  setSpecialEntries={setSpecialEntries}
                  activeCompany={activeCompany}
                  accountTitles={accountTitles}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'tax_calendar' && (
                <TaxCalendarTab 
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {(activeTab === 'ppe' || activeTab === 'inventory_list') && (
                <PPETab 
                  ppeAssets={companyPpeAssets}
                  setPpeAssets={setPpeAssets}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'cwt_customers' && (
                <CWTFromCustomersTab 
                  sales={companySales}
                  collections={companyCollections}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {activeTab === 'cwt_providers' && (
                <CWTForProvidersTab 
                  expenses={companyExpenses}
                  payments={companyPayments}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {(activeTab === 'fs_position' || activeTab === 'fs_balance_sheet' || activeTab === 'fs_position_pfrs') && (
                <FinancialPositionTab 
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  ppeAssets={companyPpeAssets}
                  specialEntries={companySpecialEntries}
                  payrollRecords={companyPayrollRecords}
                  incomeTaxRecords={companyIncomeTaxRecords}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {activeTab === 'fs_income' && (
                <IncomeStatementTab 
                  sales={companySales}
                  expenses={companyExpenses}
                  ppeAssets={companyPpeAssets}
                  specialEntries={companySpecialEntries}
                  payrollRecords={companyPayrollRecords}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {activeTab === 'fs_equity' && (
                <ChangesInEquityTab 
                  sales={companySales}
                  expenses={companyExpenses}
                  ppeAssets={companyPpeAssets}
                  payrollRecords={companyPayrollRecords}
                  specialEntries={companySpecialEntries}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {activeTab === 'fs_cashflows' && (
                <CashFlowsTab 
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  ppeAssets={companyPpeAssets}
                  payrollRecords={companyPayrollRecords}
                  specialEntries={companySpecialEntries}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {activeTab === 'fs_notes' && (
                <NotesToFSTab 
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  ppeAssets={companyPpeAssets}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                />
              )}

              {(activeTab === 'bir_2316' || activeTab === 'bir_alphalist') && (
                <BIR2316Tab 
                  employees={companyEmployees}
                  payrollRecords={companyPayrollRecords}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'bir_slsp' && (
                <SLSPTab 
                  sales={companySales}
                  expenses={companyExpenses}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'bir_qap' && (
                <QAPTab 
                  expenses={companyExpenses}
                  payments={companyPayments}
                  serviceProviders={contractors as any}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'bir_sawt' && (
                <SAWTTab 
                  sales={companySales}
                  collections={companyCollections}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                />
              )}

              {(activeTab === 'reports' || activeTab === 'reports_turnovers' || activeTab === 'reports_horizontal' || activeTab === 'reports_vertical' || activeTab === 'reports_ratios') && (
                <ReportsTab 
                  sales={companySales}
                  collections={companyCollections}
                  expenses={companyExpenses}
                  payments={companyPayments}
                  specialEntries={companySpecialEntries}
                  ppeAssets={companyPpeAssets}
                  payrollRecords={companyPayrollRecords as any}
                  accountTitles={accountTitles}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  initialSubTab={
                    activeTab === 'reports_horizontal' ? 'horizontal' :
                    activeTab === 'reports_vertical' ? 'vertical' :
                    activeTab === 'reports_ratios' ? 'ratios' : 'turnovers'
                  }
                  selectedMonthIdx={selectedMonthIdx}
                  selectedYear={selectedYear}
                  selectedPrefix={selectedPrefix}
                  onMonthYearChange={handleMonthYearChange}
                />
              )}

              {(activeTab === 'activities' || activeTab === 'activity_lists' || activeTab === 'about_app') && (
                <ActivitiesWorkflow 
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  privacyMode={false}
                  fmtShortMoney={fmtShortMoney}
                  fmtMoney={fmtMoney}
                  stats={{
                    withholdingTaxCompPayable,
                    overdueAR,
                    outstandingAP,
                    statutoryPayable,
                    netVatPayable,
                    payrollNet
                  }}
                  employees={companyEmployees}
                  activeCompanyName={activeCompany?.company_name}
                />
              )}

              {(activeTab === 'system_specs' || activeTab === 'about') && (
                <AboutAppTab 
                  theme={activeTheme}
                />
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {/* 4. 2OS SHEET TABS & STATUS BAR (CONSOLIDATED, MAIN, BRANCH 1, BRANCH 2...) */}
      <TwoOSSheetBar 
        activeTab={activeTab}
        onSelectTab={(k) => setActiveTab(k as any)}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        recordCount={getActiveTabRecordCount()}
        activeCompany={activeCompany}
        activeBranchCode={activeBranchCode}
        onSelectBranch={(code) => setActiveBranchCode(code)}
        triggerAlert={triggerAlert}
        themeMode={theme}
      />

      {/* POP-UP MODAL: ADD UNREGISTERED CUSTOMER PROMPT */}
      {showAddCustomerPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 border ${activeTheme.borderCard} ${activeTheme.bgCard} rounded-2xl shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-700/30 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className={`text-sm font-bold ${activeTheme.textTitle}`}>Register New Customer Profile?</h3>
              </div>
              <button 
                onClick={() => setShowAddCustomerPrompt(null)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${activeTheme.textMuted} leading-relaxed`}>
              Customer TIN <span className="font-mono font-bold text-cyan-400">{showAddCustomerPrompt.tin}</span> is not yet registered under <span className="font-bold">{activeCompanyName || 'Active Company'}</span>. Enter the details below to add them to Customer Details now:
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const nameInput = (form.elements.namedItem('custName') as HTMLInputElement).value;
              const addrInput = (form.elements.namedItem('custAddr') as HTMLInputElement).value;
              
              if (!nameInput.trim()) {
                triggerAlert('Customer Legal Name is required!', 'error');
                return;
              }

              const newCust: Customer = {
                id: Date.now(),
                company_name: activeCompanyName,
                registered_name: nameInput.trim(),
                customer_name: nameInput.trim(),
                client_TIN: showAddCustomerPrompt.tin,
                customer_tin: showAddCustomerPrompt.tin,
                client_Address: addrInput.trim(),
                customer_address: addrInput.trim(),
                tax_type: 'VAT'
              };

              setCustomers(prev => [...prev, newCust]);
              triggerAlert(`Registered & autofilled new customer: ${nameInput.trim()}`, 'success');
              setShowAddCustomerPrompt(null);
            }} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Registered Customer Name *
                </label>
                <input 
                  name="custName"
                  type="text" 
                  placeholder="e.g. Acme Philippines Corp."
                  required
                  autoFocus
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-medium ${activeTheme.borderInput} ${activeTheme.textMain}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Business Address
                </label>
                <input 
                  name="custAddr"
                  type="text" 
                  placeholder="e.g. Ayala Ave, Makati City"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${activeTheme.borderInput} ${activeTheme.textMain}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700/20">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerPrompt(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border ${activeTheme.borderCard} text-zinc-400 hover:bg-zinc-800 cursor-pointer`}
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold rounded-lg text-white cursor-pointer ${activeTheme.accentBg}`}
                >
                  Register Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: ADD UNREGISTERED PROVIDER PROMPT */}
      {showAddProviderPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 border ${activeTheme.borderCard} ${activeTheme.bgCard} rounded-2xl shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-zinc-700/30 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className={`text-sm font-bold ${activeTheme.textTitle}`}>Register New Service Provider?</h3>
              </div>
              <button 
                onClick={() => setShowAddProviderPrompt(null)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${activeTheme.textMuted} leading-relaxed`}>
              Provider TIN <span className="font-mono font-bold text-cyan-400">{showAddProviderPrompt.tin}</span> is not registered under <span className="font-bold">{activeCompanyName || 'Active Company'}</span>. Enter vendor details to register now:
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const nameInput = (form.elements.namedItem('provName') as HTMLInputElement).value;
              const addrInput = (form.elements.namedItem('provAddr') as HTMLInputElement).value;
              
              if (!nameInput.trim()) {
                triggerAlert('Vendor Name is required!', 'error');
                return;
              }

              const newProv: Contractor = {
                id: Date.now(),
                company_name: activeCompanyName,
                registered_name: nameInput.trim(),
                service_provider_name: nameInput.trim(),
                service_provider_TIN: showAddProviderPrompt.tin,
                sp_tin: showAddProviderPrompt.tin,
                sp_branch_code: '00000',
                tax_type: 'VAT',
                vat_status: 'VAT',
                service_provider_Address: addrInput.trim(),
                sp_address: addrInput.trim(),
                atc_code: 'WC120'
              };

              setContractors(prev => [...prev, newProv]);
              triggerAlert(`Registered & autofilled new vendor: ${nameInput.trim()}`, 'success');
              setShowAddProviderPrompt(null);
            }} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Registered Vendor / Provider Name *
                </label>
                <input 
                  name="provName"
                  type="text" 
                  placeholder="e.g. Meralco / PLDT"
                  required
                  autoFocus
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent font-medium ${activeTheme.borderInput} ${activeTheme.textMain}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Vendor Address
                </label>
                <input 
                  name="provAddr"
                  type="text" 
                  placeholder="e.g. Ortigas Ave, Pasig City"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-transparent ${activeTheme.borderInput} ${activeTheme.textMain}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700/20">
                <button
                  type="button"
                  onClick={() => setShowAddProviderPrompt(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border ${activeTheme.borderCard} text-zinc-400 hover:bg-zinc-800 cursor-pointer`}
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold rounded-lg text-white cursor-pointer ${activeTheme.accentBg}`}
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFINITYFREE WEB HOST & MYSQL DEPLOYMENT CENTER MODAL */}
      <InfinityFreeModal
        isOpen={isInfinityFreeModalOpen}
        onClose={() => setIsInfinityFreeModalOpen(false)}
        theme={activeTheme}
        triggerAlert={triggerAlert}
        appData={{
          companies,
          customers,
          sales,
          collections,
          serviceProviders: contractors,
          expenses,
          payments,
          generalJournal: specialEntries as any,
          chartOfAccounts: accountTitles,
          payroll: payrollRecords
        }}
      />

      {/* 2OS AUDIT TRAIL & ACTIVITY LOGS MODAL */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        activeTab={activeTab}
        activeCompany={activeCompany}
        themeMode={theme}
      />

      {/* IMPORT DATA WIZARD MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeCompanyName={activeCompanyName || 'Company'}
        defaultType={importDefaultType}
        onConfirmImport={handleConfirmImport}
      />

      {/* EXPORT DATA WIZARD MODAL */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        activeTabLabel={getTabLabel(activeTab)}
        activeCompanyName={activeCompanyName || 'Company'}
        data={{
          sales: companySales,
          expenses: companyExpenses,
          collections: companyCollections,
          payments: companyPayments,
          customers,
          providers: contractors,
          accountTitles,
          employees: companyEmployees,
          payrollRecords: companyPayrollRecords,
          specialEntries: companySpecialEntries,
          ppeAssets: companyPpeAssets
        }}
      />

    </div>
  );
}
