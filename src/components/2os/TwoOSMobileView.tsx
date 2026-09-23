import React, { useState } from 'react';
import {
  Home,
  Users,
  BookOpen,
  Layers,
  Landmark,
  ShieldCheck,
  Share2,
  Download,
  Calendar,
  Printer,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Building2,
  User,
  ArrowLeft,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Package,
  X,
  Trash2,
  Save,
  Upload
} from 'lucide-react';
import {
  Company,
  Customer,
  Contractor,
  Sale,
  Collection,
  Expense,
  Payment,
  AccountTitle,
  PPEAsset,
  SpecialEntry,
  IncomeTaxRecord
} from '../../types';
import {
  AddSaleModal,
  AddExpenseModal,
  AddCollectionModal,
  AddPaymentModal,
  AddPartyModal,
  ImportDataModal
} from './mobile/MobileModals';
import { MobileBirModal } from './mobile/MobileBirModal';
import { MobileFsModal } from './mobile/MobileFsModal';

interface TwoOSMobileViewProps {
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  contractors: Contractor[];
  setContractors?: React.Dispatch<React.SetStateAction<Contractor[]>>;
  sales: Sale[];
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
  collections: Collection[];
  setCollections?: React.Dispatch<React.SetStateAction<Collection[]>>;
  expenses: Expense[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  payments: Payment[];
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
  accountTitles: AccountTitle[];
  setAccountTitles?: React.Dispatch<React.SetStateAction<AccountTitle[]>>;
  ppeAssets: PPEAsset[];
  setPpeAssets?: React.Dispatch<React.SetStateAction<PPEAsset[]>>;
  specialEntries: SpecialEntry[];
  setSpecialEntries?: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  incomeTaxRecords: IncomeTaxRecord[];
  setIncomeTaxRecords?: React.Dispatch<React.SetStateAction<IncomeTaxRecord[]>>;
  employees: any[];
  setEmployees?: React.Dispatch<React.SetStateAction<any[]>>;
  payrollRecords: any[];
  setPayrollRecords?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedMonthIdx: number;
  selectedYear: number;
  selectedPrefix: string;
  onMonthYearChange?: (m: number, y: number, p: string) => void;
  onOpenPeriodModal: () => void;
  onOpenAuditTrail: () => void;
  onOpenInfinityFreeModal: () => void;
  onExportAllSheets: () => void;
  onExportActiveSheet: () => void;
  onManualSave?: () => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchToDesktop: () => void;
}

type MobileScreen = 'home' | 'dashboard' | 'directory' | 'books' | 'other' | 'bir' | 'financial_statements' | 'settings';

export default function TwoOSMobileView({
  companies,
  activeCompany,
  onSelectCompany,
  customers,
  setCustomers,
  contractors,
  setContractors,
  sales,
  setSales,
  collections,
  setCollections,
  expenses,
  setExpenses,
  payments,
  setPayments,
  accountTitles,
  setAccountTitles,
  ppeAssets,
  setPpeAssets,
  specialEntries,
  setSpecialEntries,
  incomeTaxRecords,
  setIncomeTaxRecords,
  employees,
  setEmployees,
  payrollRecords,
  setPayrollRecords,
  selectedMonthIdx,
  selectedYear,
  selectedPrefix,
  onMonthYearChange,
  onOpenPeriodModal,
  onOpenAuditTrail,
  onOpenInfinityFreeModal,
  onExportAllSheets,
  onExportActiveSheet,
  onManualSave,
  triggerAlert,
  onSwitchToDesktop
}: TwoOSMobileViewProps) {
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home');
  const [dashboardTab, setDashboardTab] = useState<'transactions' | 'top' | 'activities'>('transactions');
  const [activeBranch, setActiveBranch] = useState<'consolidated' | 'head_office' | 'main'>('consolidated');
  const [showApkGuideModal, setShowApkGuideModal] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [transactionSearch, setTransactionSearch] = useState<string>('');
  const [selectedBookCategory, setSelectedBookCategory] = useState<string | null>(null);
  const [selectedBirForm, setSelectedBirForm] = useState<string | null>(null);

  // Mobile Function Modals & State
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [partyModalType, setPartyModalType] = useState<'Customer' | 'Supplier'>('Customer');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBirModal, setShowBirModal] = useState(false);
  const [selectedBirFormType, setSelectedBirFormType] = useState<'2550Q' | '1702Q' | '1701Q' | '2307' | '1601C' | 'BIR Forms'>('2550Q');
  const [showFsModal, setShowFsModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [selectedDirectoryTab, setSelectedDirectoryTab] = useState<'All' | 'Customers' | 'Suppliers' | 'Employees'>('All');

  // Delete helpers with confirmation
  const handleDeleteSale = (saleId: number) => {
    if (window.confirm('Are you sure you want to delete this sales invoice?')) {
      if (setSales) {
        setSales(prev => prev.filter(s => s.id !== saleId));
        triggerAlert('Sales invoice removed.', 'info');
      }
    }
  };

  const handleDeleteExpense = (expId: number) => {
    if (window.confirm('Are you sure you want to delete this expense voucher?')) {
      if (setExpenses) {
        setExpenses(prev => prev.filter(e => e.id !== expId));
        triggerAlert('Expense voucher removed.', 'info');
      }
    }
  };

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const activeMonthName = monthNames[selectedMonthIdx] || 'AUGUST';

  // Calculations for current company
  const activeCompanyName = activeCompany?.company_name || '';
  const companySales = sales.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
  const companyCollections = collections.filter(c => !activeCompanyName || c.company_name === activeCompanyName);
  const companyExpenses = expenses.filter(e => !activeCompanyName || e.company_name === activeCompanyName);
  const companyPayments = payments.filter(p => !activeCompanyName || p.company_name === activeCompanyName);

  const totalSalesAmount = companySales.reduce((sum, s) => sum + (Number(s.invoice_amount) || 0), 0);
  const totalCollectionsAmount = companyCollections.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
  const totalExpensesAmount = companyExpenses.reduce((sum, e) => sum + (Number(e.expense_invoice_amount) || 0), 0);
  const totalPaymentsAmount = companyPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const overdueAR = Math.max(0, totalSalesAmount - totalCollectionsAmount);
  const unpaidAP = Math.max(0, totalExpensesAmount - totalPaymentsAmount);

  const totalOutputVat = companySales.reduce((sum, s) => sum + (Number(s.output_vat) || 0), 0);
  const totalInputVat = companyExpenses.reduce((sum, e) => sum + (Number(e.vat_input_amount) || 0), 0);
  const netVatPayable = Math.max(0, totalOutputVat - totalInputVat);
  const withholdingTax = companySales.reduce((sum, s) => sum + (Number(s.ewt_amount || s.withholding_2307) || 0), 0);
  const incomeTaxEst = Math.max(0, (totalSalesAmount - totalExpensesAmount) * 0.20);

  const bepAmount = totalExpensesAmount > 0 ? totalExpensesAmount * 1.35 : 83077;
  const netProfit = totalSalesAmount - totalExpensesAmount;

  const fmt = (n: number) => '₱' + (Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtShort = (n: number) => {
    const val = Number(n) || 0;
    if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₱${(val / 1000).toFixed(1)}k`;
    return `₱${val.toFixed(0)}`;
  };

  // Header Title mapping
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home': return '2OS ACCOUNTING SYSTEM';
      case 'dashboard': return 'Dashboard';
      case 'directory': return 'Directory';
      case 'books': return 'Books of Accounts';
      case 'other': return 'Other Transactions';
      case 'bir': return 'BIR Computations';
      case 'financial_statements': return 'Financial Statements';
      case 'settings': return 'Settings & Sync';
      default: return '2OS Accounting';
    }
  };

  // Switch helper
  const navigateTo = (screen: MobileScreen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-24 select-none max-w-md mx-auto relative shadow-2xl border-x border-slate-200">
      
      {/* 1. TOP MOBILE APP BAR (ANDROID COMPLIANT SAFE AREA) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          {currentScreen !== 'home' ? (
            <button
              onClick={() => navigateTo('home')}
              className="p-1.5 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              2OS
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
              {getScreenTitle()}
            </h1>
            {currentScreen === 'home' && (
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                Philippine Tax & PFRS Books
              </span>
            )}
          </div>
        </div>

        {/* Top Right Actions: Desktop Switcher, APK info, and Home */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowApkGuideModal(true)}
            title="APK Packaging Guide"
            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-100 cursor-pointer shadow-2xs"
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>APK</span>
          </button>

          <button
            onClick={onSwitchToDesktop}
            title="Switch to Desktop Spreadsheet View"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
          </button>

          {currentScreen !== 'home' && (
            <button
              onClick={() => navigateTo('home')}
              title="Home Springboard"
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. SUB-HEADER CARD: ENTITY SELECTOR & USER BADGE */}
      <div className="p-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-xs flex items-center justify-between gap-2">
          {/* Entity Dropdown */}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold tracking-wider uppercase text-slate-600 block">
              SELECTED ENTITY
            </span>
            <div className="relative mt-0.5">
              <select
                value={activeCompany?.company_name || ''}
                onChange={(e) => {
                  const found = companies.find(c => c.company_name === e.target.value);
                  if (found) {
                    onSelectCompany(found);
                    triggerAlert(`Switched entity to: ${found.company_name}`, 'success');
                  }
                }}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 pr-6 appearance-none truncate focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.company_name}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
              AC
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[8px] font-bold uppercase text-slate-600 block">
                USER NAME
              </span>
              <span className="text-[10px] font-bold text-slate-700 leading-none">
                acsignicabss
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: HOME SPRINGBOARD (11 VIBRANT LAUNCHER TILES & EXECUTIVE BANNER) */}
      {/* ========================================================================= */}
      {currentScreen === 'home' && (
        <div className="px-3 space-y-4">
          
          {/* Springboard Tiles Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Tile 1: Home */}
            <button
              onClick={() => navigateTo('home')}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 aspect-square cursor-pointer"
            >
              <Home className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center">Home</span>
            </button>

            {/* Tile 2: Directory */}
            <button
              onClick={() => navigateTo('directory')}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-purple-500/20 aspect-square cursor-pointer"
            >
              <Users className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center">Directory</span>
            </button>

            {/* Tile 3: Books of Accounts */}
            <button
              onClick={() => navigateTo('books')}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 aspect-square cursor-pointer"
            >
              <BookOpen className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center leading-tight">Books of Accounts</span>
            </button>

            {/* Tile 4: Other Transactions */}
            <button
              onClick={() => navigateTo('other')}
              className="bg-orange-500 hover:bg-orange-400 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 aspect-square cursor-pointer"
            >
              <Layers className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center leading-tight">Other Transactions</span>
            </button>

            {/* Tile 5: Financial Statements */}
            <button
              onClick={() => setShowFsModal(true)}
              className="bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-sky-500/20 aspect-square cursor-pointer"
            >
              <Landmark className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center leading-tight">Financial Statements</span>
            </button>

            {/* Tile 6: BIR Computations */}
            <button
              onClick={() => {
                setSelectedBirFormType('2550Q');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-rose-500/20 aspect-square cursor-pointer"
            >
              <ShieldCheck className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center leading-tight">BIR Computations</span>
            </button>

            {/* Tile 7: Export */}
            <button
              onClick={onExportActiveSheet}
              className="bg-teal-600 hover:bg-teal-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-teal-500/20 aspect-square cursor-pointer"
            >
              <Share2 className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center">Export</span>
            </button>

            {/* Tile 8: Import */}
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-pink-600 hover:bg-pink-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-pink-500/20 aspect-square cursor-pointer"
            >
              <Download className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center">Import</span>
            </button>

            {/* Tile 9: Workbook */}
            <button
              onClick={onExportAllSheets}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/20 aspect-square cursor-pointer"
            >
              <Calendar className="w-6 h-6 text-white stroke-[2.2]" />
              <span className="text-[11px] font-bold tracking-tight text-center">Workbook</span>
            </button>
          </div>

          {/* Bottom Pair: Print & Settings */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => window.print()}
              className="bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs font-bold">Print</span>
            </button>

            <button
              onClick={() => navigateTo('settings')}
              className="bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs font-bold">Settings</span>
            </button>
          </div>

          {/* Executive Financial Monitoring Dashboard Banner */}
          <div 
            onClick={() => navigateTo('dashboard')}
            className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  SELECTED ENTITY: CONSOLIDATED (ALL BRANCHES)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <h2 className="text-sm font-extrabold tracking-tight mt-1">
              EXECUTIVE FINANCIAL MONITORING DASHBOARD
            </h2>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                onOpenPeriodModal();
              }}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold mt-3 text-white transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedPrefix} {activeMonthName} {selectedYear}</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Quick Stats Teaser */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Receivables</span>
              <p className="text-sm font-black text-amber-600 mt-0.5">{fmt(overdueAR)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">VAT Liability</span>
              <p className="text-sm font-black text-purple-600 mt-0.5">{fmt(netVatPayable)}</p>
            </div>
          </div>

          {/* Bottom Swipe Hint */}
          <div className="text-center py-2 text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1">
            <span>Tap any tile or dashboard banner to navigate</span>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: DASHBOARD (4 FINANCIAL HEALTH PILLARS, INVOICES, P&L, FLOW)     */}
      {/* ========================================================================= */}
      {currentScreen === 'dashboard' && (
        <div className="px-3 space-y-3.5">
          
          {/* Navigation Filter Tabs: TRANSACTIONS, TOP, ACTIVITIES */}
          <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setDashboardTab('transactions')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                dashboardTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>TRANSACTIONS</span>
            </button>
            <button
              onClick={() => setDashboardTab('top')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                dashboardTab === 'top'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>TOP</span>
            </button>
            <button
              onClick={() => {
                setDashboardTab('activities');
                onOpenAuditTrail();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                dashboardTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ACTIVITIES</span>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 rounded-full">
                6
              </span>
            </button>
          </div>

          {/* 4 Financial Health Pillars (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* Pillar 1: Uncollected Sales (AR) */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-3 text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-white/90" />
                  <span className="text-[10px] font-black tracking-wider uppercase">UNCOLLECTED SALES</span>
                </div>
                <span className="bg-white/25 px-1.5 py-0.5 rounded text-[9px] font-black">AR</span>
              </div>
              <div className="my-1">
                <p className="text-base font-black tracking-tight">{fmt(overdueAR)}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/90 font-medium">
                <span>Overdue: {fmtShort(overdueAR * 0.4)}</span>
                <span>Current: {fmtShort(overdueAR * 0.6)}</span>
              </div>
            </div>

            {/* Pillar 2: Unpaid Expenses (AP) */}
            <div className="bg-gradient-to-br from-rose-600 to-red-600 rounded-2xl p-3 text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-white/90" />
                  <span className="text-[10px] font-black tracking-wider uppercase">UNPAID EXPENSES</span>
                </div>
                <span className="bg-white/25 px-1.5 py-0.5 rounded text-[9px] font-black">AP</span>
              </div>
              <div className="my-1">
                <p className="text-base font-black tracking-tight">{fmt(unpaidAP)}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/90 font-medium">
                <span>Incurred: {fmtShort(totalExpensesAmount)}</span>
                <span>Paid: {fmtShort(totalPaymentsAmount)}</span>
              </div>
            </div>

            {/* Pillar 3: Unpaid Taxes (BIR) */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-3 text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/90" />
                  <span className="text-[10px] font-black tracking-wider uppercase">UNPAID TAXES</span>
                </div>
                <span className="bg-white/25 px-1.5 py-0.5 rounded text-[9px] font-black">BIR</span>
              </div>
              <div className="my-1">
                <p className="text-base font-black tracking-tight">{fmt(netVatPayable + withholdingTax)}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/90 font-medium">
                <span>VAT: {fmtShort(netVatPayable)}</span>
                <span>1601C: {fmtShort(withholdingTax)}</span>
              </div>
            </div>

            {/* Pillar 4: Breakeven (BEP) */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-3 text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-white/90" />
                  <span className="text-[10px] font-black tracking-wider uppercase">BREAKEVEN (BEP)</span>
                </div>
                <span className="bg-white/25 px-1.5 py-0.5 rounded text-[9px] font-black">Profitable</span>
              </div>
              <div className="my-1">
                <p className="text-base font-black tracking-tight">{fmt(bepAmount)}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/90 font-medium">
                <span>Safety: +31%</span>
                <span>CMR: 54%</span>
              </div>
            </div>

          </div>

          {/* Invoices & AR Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                INVOICES & AR
              </span>
              <span className="text-xs font-black text-slate-900">{fmt(totalSalesAmount)}</span>
            </div>
            
            {/* Visual Aging Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 my-2 overflow-hidden flex">
              <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
              <div className="bg-blue-500 h-full" style={{ width: '60%' }}></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Overdue: <b className="text-amber-600">{fmt(overdueAR)}</b></span>
              <span>Not due yet: <b className="text-blue-600">{fmt(totalSalesAmount - overdueAR)}</b></span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Undeposited</span>
                <span className="font-bold text-slate-800">{fmt(overdueAR * 0.55)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Deposited (30d)</span>
                <span className="font-bold text-slate-800">{fmt(totalCollectionsAmount)}</span>
              </div>
            </div>
          </div>

          {/* Profit & Loss Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                PROFIT & LOSS
              </span>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Last month ▾
              </span>
            </div>

            <div className="my-2">
              <span className="text-xs text-slate-500">Net Income for {activeMonthName}</span>
              <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmt(netProfit)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Gross Income</span>
                <span className="font-bold text-emerald-700">{fmt(totalSalesAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Expenses</span>
                <span className="font-bold text-rose-700">{fmt(totalExpensesAmount)}</span>
              </div>
            </div>
          </div>

          {/* Revenue vs Collections Flow Banner */}
          <div 
            onClick={() => triggerAlert("Real-time Cash Flow Model synchronized with PFRS 15 Cash Receipts & Disbursements.", "info")}
            className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Revenue vs Collections Flow
                </h3>
                <p className="text-[10px] text-slate-500">
                  Monthly Billing vs Realized Cash
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>

          {/* Branch Selector Pill Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBranch('consolidated')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeBranch === 'consolidated'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Consolidated</span>
            </button>
            <button
              onClick={() => setActiveBranch('head_office')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeBranch === 'head_office'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Head Office</span>
            </button>
            <button
              onClick={() => setActiveBranch('main')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeBranch === 'main'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Main</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: DIRECTORY (EMPLOYEES, CUSTOMERS, SUPPLIERS, CONTACTS, BRANCHES) */}
      {/* ========================================================================= */}
      {currentScreen === 'directory' && (
        <div className="px-3 space-y-3.5">
          
          {/* Quick Sub-tiles Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setSelectedDirectoryTab('Employees')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all ${
                selectedDirectoryTab === 'Employees' ? 'bg-purple-800 ring-2 ring-purple-300 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'
              }`}
            >
              <Users className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">Employees</span>
            </button>
            <button 
              onClick={() => setSelectedDirectoryTab('Customers')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all ${
                selectedDirectoryTab === 'Customers' ? 'bg-blue-800 ring-2 ring-blue-300 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              <User className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">Customers</span>
            </button>
            <button 
              onClick={() => setSelectedDirectoryTab('Suppliers')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all ${
                selectedDirectoryTab === 'Suppliers' ? 'bg-sky-800 ring-2 ring-sky-300 text-white' : 'bg-sky-600 text-white hover:bg-sky-500'
              }`}
            >
              <Building2 className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">Suppliers</span>
            </button>
            <button 
              onClick={() => setSelectedDirectoryTab('All')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all ${
                selectedDirectoryTab === 'All' ? 'bg-indigo-800 ring-2 ring-indigo-300 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              <FileText className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">All Contacts</span>
            </button>
            <button 
              onClick={() => {
                setPartyModalType('Customer');
                setShowAddPartyModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">+ Customer</span>
            </button>
            <button 
              onClick={() => {
                setPartyModalType('Supplier');
                setShowAddPartyModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold">+ Supplier</span>
            </button>
          </div>

          {/* Directory Overview Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              DIRECTORY OVERVIEW
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => setSelectedDirectoryTab('Employees')}
                className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 flex items-center gap-2 cursor-pointer hover:bg-purple-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-purple-700 font-semibold block">Employees</span>
                  <span className="text-base font-black text-purple-950">{employees.length || 24}</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedDirectoryTab('Customers')}
                className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 font-semibold block">Customers</span>
                  <span className="text-base font-black text-blue-950">{customers.length || 58}</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedDirectoryTab('Suppliers')}
                className="bg-sky-50 p-2.5 rounded-xl border border-sky-100 flex items-center gap-2 cursor-pointer hover:bg-sky-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-sky-700 font-semibold block">Suppliers</span>
                  <span className="text-base font-black text-sky-950">{contractors.length || 32}</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedDirectoryTab('All')}
                className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2 cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700 font-semibold block">Branches</span>
                  <span className="text-base font-black text-indigo-950">{companies.length || 3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Contacts Bar & Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contacts, TIN, or company..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
            <button
              onClick={() => {
                setPartyModalType('Customer');
                setShowAddPartyModal(true);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-500 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          {/* Contacts List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {selectedDirectoryTab.toUpperCase()} DIRECTORY
              </span>
              <span className="text-[11px] font-bold text-blue-600">
                {selectedDirectoryTab === 'Customers' ? customers.length : selectedDirectoryTab === 'Suppliers' ? contractors.length : customers.length + contractors.length} Records
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {(selectedDirectoryTab === 'All' || selectedDirectoryTab === 'Customers') &&
                customers
                  .filter(c => {
                    if (!directorySearch) return true;
                    const query = directorySearch.toLowerCase();
                    return (
                      (c.registered_name || '').toLowerCase().includes(query) ||
                      (c.trade_name || '').toLowerCase().includes(query) ||
                      (c.tin_number || c.client_TIN || '').toLowerCase().includes(query)
                    );
                  })
                  .map((cust, idx) => (
                    <div key={cust.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(cust.registered_name || cust.trade_name || 'CU').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {cust.registered_name || cust.trade_name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Customer • <span className="text-emerald-600 font-bold">Active</span> • TIN: {cust.tin_number || cust.client_TIN || cust.customer_tin || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        Customer
                      </span>
                    </div>
                  ))}

              {(selectedDirectoryTab === 'All' || selectedDirectoryTab === 'Suppliers') &&
                contractors
                  .filter(s => {
                    if (!directorySearch) return true;
                    const query = directorySearch.toLowerCase();
                    return (
                      (s.registered_name || '').toLowerCase().includes(query) ||
                      (s.trade_name || '').toLowerCase().includes(query) ||
                      (s.tin_number || s.sp_tin || '').toLowerCase().includes(query)
                    );
                  })
                  .map((supp, idx) => (
                    <div key={supp.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(supp.registered_name || supp.trade_name || 'SU').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {supp.registered_name || supp.trade_name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Supplier • <span className="text-emerald-600 font-bold">Active</span> • TIN: {supp.tin_number || supp.sp_tin || supp.service_provider_TIN || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full">
                        Supplier
                      </span>
                    </div>
                  ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: BOOKS OF ACCOUNTS (GENERAL LEDGER, JOURNAL, CASH, SUMMARY)      */}
      {/* ========================================================================= */}
      {currentScreen === 'books' && (
        <div className="px-3 space-y-3.5">
          {selectedBookCategory ? (
            /* Selected Book Journal / Ledger Detailed View */
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setSelectedBookCategory(null)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> All Books
                </button>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  {selectedBookCategory}
                </span>
                {selectedBookCategory === 'Sales' && (
                  <button
                    onClick={() => setShowAddSaleModal(true)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500"
                  >
                    <Plus className="w-3.5 h-3.5" /> Sale
                  </button>
                )}
                {selectedBookCategory === 'Purchases' && (
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500"
                  >
                    <Plus className="w-3.5 h-3.5" /> Expense
                  </button>
                )}
                {selectedBookCategory === 'Cash Receipts' && (
                  <button
                    onClick={() => setShowAddCollectionModal(true)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500"
                  >
                    <Plus className="w-3.5 h-3.5" /> Receipt
                  </button>
                )}
                {selectedBookCategory === 'Cash Disbursements' && (
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500"
                  >
                    <Plus className="w-3.5 h-3.5" /> Payment
                  </button>
                )}
                {(selectedBookCategory === 'General Ledger' || selectedBookCategory === 'Journal Entries') && (
                  <button
                    onClick={onExportActiveSheet}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                )}
              </div>

              {/* Items List based on Category */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {selectedBookCategory === 'Sales' && companySales.map((s, idx) => (
                    <div key={s.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-blue-600">{s.invoice_number}</span>
                          <span className="text-[10px] text-slate-500">{s.invoice_date || s.issue_date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{s.customer_name || s.registered_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{fmt(s.invoice_amount)}</span>
                        <button onClick={() => handleDeleteSale(s.id)} className="text-slate-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedBookCategory === 'Purchases' && companyExpenses.map((e, idx) => (
                    <div key={e.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-rose-600">{e.invoice_number || e.voucher_number || `PI-${idx+1}`}</span>
                          <span className="text-[10px] text-slate-500">{e.expense_date || e.issue_date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{e.service_provider_name || e.registered_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600">{fmt(e.expense_invoice_amount)}</span>
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedBookCategory === 'Cash Receipts' && companyCollections.map((c, idx) => (
                    <div key={c.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-emerald-600">{c.receipt_number || c.invoice_number || `OR-${idx+1}`}</span>
                          <span className="text-[10px] text-slate-500">{c.collection_date || '2026-08-27'}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{c.customer_name || c.registered_name || 'Customer'}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-700">{fmt(c.amount_collected || c.total_collected)}</span>
                    </div>
                  ))}

                  {selectedBookCategory === 'Cash Disbursements' && companyPayments.map((p, idx) => (
                    <div key={p.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-purple-600">{p.voucher_number || p.check_number || `DV-${idx+1}`}</span>
                          <span className="text-[10px] text-slate-500">{p.payment_date || '2026-08-27'}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{p.service_provider_name || p.payee_name || 'Payee'}</p>
                      </div>
                      <span className="text-xs font-black text-purple-700">{fmt(p.amount_paid || p.net_paid)}</span>
                    </div>
                  ))}

                  {(selectedBookCategory === 'General Ledger' || selectedBookCategory === 'Journal Entries') && accountTitles.map((acc, idx) => (
                    <div key={acc.code || idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">{acc.code || acc.account_code}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">{acc.category || acc.account_type || 'Asset'}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{acc.title || acc.account_title}</p>
                      </div>
                      <span className="text-xs font-black text-slate-900">{fmt(idx === 0 ? totalCollectionsAmount : 45000 * (idx % 3 + 1))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 6 Large Tiles Grid (Emerald Themed) */
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedBookCategory('General Ledger')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <BookOpen className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">General Ledger</span>
                </button>

                <button
                  onClick={() => setSelectedBookCategory('Journal Entries')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <FileText className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">Journal Entries</span>
                </button>

                <button
                  onClick={() => setSelectedBookCategory('Cash Receipts')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <DollarSign className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">Cash Receipts</span>
                </button>

                <button
                  onClick={() => setSelectedBookCategory('Cash Disbursements')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <CreditCard className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">Cash Disbursements</span>
                </button>

                <button
                  onClick={() => setSelectedBookCategory('Sales')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">Sales</span>
                </button>

                <button
                  onClick={() => setSelectedBookCategory('Purchases')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Receipt className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-bold text-center leading-tight">Purchases</span>
                </button>
              </div>

              {/* Account Summary Card */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>ACCOUNT SUMMARY</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">PFRS Standard</span>
                </h3>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Cash and Cash Equivalents</span>
                    <span className="font-bold text-slate-900">{fmt(totalCollectionsAmount || 250000)}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Accounts Receivable</span>
                    <span className="font-bold text-amber-600">{fmt(overdueAR || 180450)}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Accounts Payable</span>
                    <span className="font-bold text-rose-600">{fmt(unpaidAP || 95320)}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Property, Plant & Equipment</span>
                    <span className="font-bold text-slate-900">{fmt(420000)}</span>
                  </div>
                </div>
              </div>

              {/* Chart of Accounts Teaser */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">CHART OF ACCOUNTS CODES</span>
                  <span className="text-[10px] font-bold text-blue-600">{accountTitles.length} Titles</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {accountTitles.slice(0, 6).map((acc) => (
                    <div key={acc.code || acc.account_code} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{acc.code || acc.account_code}</span>
                        <span className="text-slate-800 truncate">{acc.title || acc.account_title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{acc.category || acc.account_type || 'Asset'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: OTHER TRANSACTIONS (INVOICES, BILLS, JV, ADJUSTMENTS)           */}
      {/* ========================================================================= */}
      {currentScreen === 'other' && (
        <div className="px-3 space-y-3.5">
          
          {/* 6 Large Tiles (Orange/Amber Themed) */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setShowAddSaleModal(true)}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">Sales Invoice</span>
              <span className="text-[9px] text-orange-100">+ Add SI</span>
            </button>

            <button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Receipt className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">Purchase Invoice</span>
              <span className="text-[9px] text-orange-100">+ Add PI</span>
            </button>

            <button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Layers className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">JV</span>
              <span className="text-[9px] text-orange-100">+ Journal</span>
            </button>

            <button 
              onClick={() => triggerAlert("Year-end & Month-end Accounting Adjustments Ready.", "info")}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">Adjustments</span>
            </button>

            <button 
              onClick={() => setShowAddPaymentModal(true)}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <DollarSign className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">Petty Cash</span>
              <span className="text-[9px] text-orange-100">+ Voucher</span>
            </button>

            <button 
              onClick={() => setShowAddCollectionModal(true)}
              className="bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Layers className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">Collections</span>
              <span className="text-[9px] text-orange-100">+ Add OR</span>
            </button>
          </div>

          {/* Search Transaction Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference #, customer, or description..."
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TRANSACTIONS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSaleModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Sale
                </button>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Expense
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {companySales
                .filter(s => {
                  if (!transactionSearch) return true;
                  const query = transactionSearch.toLowerCase();
                  return (
                    (s.invoice_number || '').toLowerCase().includes(query) ||
                    (s.customer_name || s.registered_name || '').toLowerCase().includes(query) ||
                    (s.particulars || s.description || '').toLowerCase().includes(query)
                  );
                })
                .slice(0, 5)
                .map((sale, idx) => (
                  <div key={sale.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-blue-600">
                          {sale.invoice_number || `SI-000${idx + 1}`}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                          Sales Invoice
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {sale.invoice_date || sale.issue_date || 'Aug 27, 2026'} • {sale.customer_name || sale.registered_name || 'Customer'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {fmt(sale.invoice_amount || 12500)}
                      </span>
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete sale"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {companyExpenses
                .filter(e => {
                  if (!transactionSearch) return true;
                  const query = transactionSearch.toLowerCase();
                  return (
                    (e.invoice_number || e.voucher_number || '').toLowerCase().includes(query) ||
                    (e.service_provider_name || e.registered_name || '').toLowerCase().includes(query) ||
                    (e.expense_type || e.description || '').toLowerCase().includes(query)
                  );
                })
                .slice(0, 5)
                .map((exp, idx) => (
                  <div key={exp.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-rose-600">
                          {exp.invoice_number || exp.voucher_number || exp.voucher_no || `PI-000${idx + 1}`}
                        </span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                          Purchase
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {exp.expense_date || exp.issue_date || 'Aug 26, 2026'} • {exp.service_provider_name || exp.registered_name || 'Vendor'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600">
                        {fmt(exp.expense_invoice_amount || 8750)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 6: BIR COMPUTATIONS (1701Q, 1702Q, 2550Q, 2307, 1601C, FORMS)     */}
      {/* ========================================================================= */}
      {currentScreen === 'bir' && (
        <div className="px-3 space-y-3.5">
          
          {/* 6 Large Tiles (Pink/Crimson/Rose Themed) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setSelectedBirFormType('1701Q');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">1701Q</span>
              <span className="text-[9px] text-rose-200">Quarterly ITR</span>
            </button>

            <button
              onClick={() => {
                setSelectedBirFormType('1702Q');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">1702Q</span>
              <span className="text-[9px] text-rose-200">Corporate ITR</span>
            </button>

            <button
              onClick={() => {
                setSelectedBirFormType('2550Q');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">2550Q</span>
              <span className="text-[9px] text-rose-200">VAT Return</span>
            </button>

            <button
              onClick={() => {
                setSelectedBirFormType('2307');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">2307</span>
              <span className="text-[9px] text-rose-200">Withholding Tax</span>
            </button>

            <button
              onClick={() => {
                setSelectedBirFormType('1601C');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">1601C</span>
              <span className="text-[9px] text-rose-200">SSS / PhilHealth</span>
            </button>

            <button
              onClick={() => {
                setSelectedBirFormType('BIR Forms');
                setShowBirModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Layers className="w-5 h-5 text-white" />
              <span className="text-[11px] font-bold text-center leading-tight">BIR Forms</span>
              <span className="text-[9px] text-rose-200">Others</span>
            </button>
          </div>

          {/* Tax Summary Card (Current Period) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TAX SUMMARY <span className="text-slate-400 font-normal">({activeMonthName} {selectedYear})</span>
              </h3>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                TRAIN / CREATE
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Output VAT (12%)</span>
                <span className="font-bold text-slate-900">{fmt(totalOutputVat || 120500)}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Input VAT (Creditable)</span>
                <span className="font-bold text-emerald-600">-{fmt(totalInputVat || 78200)}</span>
              </div>
              <div className="py-2 flex items-center justify-between bg-rose-50/60 px-2 -mx-2 rounded-lg">
                <span className="font-bold text-rose-800">VAT Payable</span>
                <span className="font-black text-rose-600 text-sm">{fmt(netVatPayable || 42300)}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Withholding Tax (Creditable / 2307)</span>
                <span className="font-bold text-slate-900">{fmt(withholdingTax || 18750)}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Estimated Income Tax (20%)</span>
                <span className="font-bold text-slate-900">{fmt(incomeTaxEst || 35000)}</span>
              </div>
            </div>
          </div>

          {/* BIR Compliance Deadlines Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Next BIR Filing Due Date:</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                2550Q / 1601C due on the 10th-25th of the following month. All audit trails and SLSP attachments are ready.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 7: FINANCIAL STATEMENTS (FS POSITION, INCOME, CASH FLOW, NOTES)     */}
      {/* ========================================================================= */}
      {currentScreen === 'financial_statements' && (
        <div className="px-3 space-y-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-sky-600" />
              Philippine Financial Statements (PFRS)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidated financial reports compliant with Philippine Accounting Standards (PAS) and BIR annexes.
            </p>

            <div className="space-y-2 pt-2">
              <div 
                onClick={() => setShowFsModal(true)}
                className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Statement of Financial Position</h4>
                  <p className="text-[10px] text-slate-500">Balance Sheet (Assets, Liabilities & Equity)</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFsModal(true);
                  }}
                  className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-500"
                >
                  View / Export
                </button>
              </div>

              <div 
                onClick={() => setShowFsModal(true)}
                className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Statement of Comprehensive Income</h4>
                  <p className="text-[10px] text-slate-500">Revenue, Cost of Sales & Net Operating Profit</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFsModal(true);
                  }}
                  className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-500"
                >
                  View / Export
                </button>
              </div>

              <div 
                onClick={() => setShowFsModal(true)}
                className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Statement of Cash Flows</h4>
                  <p className="text-[10px] text-slate-500">Operating, Investing & Financing Activities</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFsModal(true);
                  }}
                  className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-500"
                >
                  View / Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 8: SETTINGS & APK BUILDER                                          */}
      {/* ========================================================================= */}
      {currentScreen === 'settings' && (
        <div className="px-3 space-y-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-700" />
              Mobile App & Cloud Configuration
            </h2>

            <div className="divide-y divide-slate-100">
              <div 
                onClick={onOpenInfinityFreeModal}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">InfinityFree & MySQL Deployment</p>
                  <p className="text-[10px] text-slate-500">Sync databases and FTP deployment credentials</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>

              <div 
                onClick={onOpenAuditTrail}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Audit Trail & Security Logs</p>
                  <p className="text-[10px] text-slate-500">View user logins, transaction timestamps, and integrity hashes</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>

              <div 
                onClick={() => setShowApkGuideModal(true)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-700">Packaging to Android APK</p>
                  <p className="text-[10px] text-slate-500">Capacitor, PWA Builder & 1-click APK release steps</p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </div>

              <div 
                onClick={onSwitchToDesktop}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="text-xs font-bold text-blue-700">Switch to Desktop Mode</p>
                  <p className="text-[10px] text-slate-500">Full 2OS Office Ribbon & Excel-grade spreadsheet grid</p>
                </div>
                <Monitor className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BOTTOM NAVIGATION BAR (FIXED ON SMARTPHONE/APK SCREEN)                 */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        
        {/* Nav 1: Home */}
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentScreen === 'home' ? 'text-blue-600 scale-105' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Nav 2: Directory */}
        <button
          onClick={() => navigateTo('directory')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentScreen === 'directory' ? 'text-purple-600 scale-105' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">Directory</span>
        </button>

        {/* Nav 3: Books */}
        <button
          onClick={() => navigateTo('books')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentScreen === 'books' ? 'text-emerald-600 scale-105' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">Books</span>
        </button>

        {/* Nav 4: Other Transactions */}
        <button
          onClick={() => navigateTo('other')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentScreen === 'other' ? 'text-orange-500 scale-105' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">Other</span>
        </button>

        {/* Nav 5: BIR Computations */}
        <button
          onClick={() => navigateTo('bir')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentScreen === 'bir' ? 'text-rose-600 scale-105' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">BIR</span>
        </button>

      </nav>

      {/* ========================================================================= */}
      {/* 4. FLOATING ACTION BUTTON (QUICK ADD MENU)                                */}
      {/* ========================================================================= */}
      <div className="fixed bottom-16 right-4 z-40 max-w-md mx-auto">
        {showFabMenu && (
          <div className="mb-3 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddSaleModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Sales Invoice</span>
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddExpenseModal(true);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Purchase / Expense</span>
              <Receipt className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddCollectionModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Cash Receipt (OR)</span>
              <DollarSign className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddPaymentModal(true);
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Payment (DV)</span>
              <CreditCard className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setPartyModalType('Customer');
                setShowAddPartyModal(true);
              }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>+ Contact / Directory</span>
              <User className="w-4 h-4" />
            </button>

            {onManualSave && (
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  onManualSave();
                }}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>Save to Cloud</span>
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
            showFabMenu ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ring-4 ring-blue-500/20'
          }`}
          title="Quick Actions"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. APK PACKAGING GUIDE MODAL                                              */}
      {/* ========================================================================= */}
      {showApkGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Package to Android APK</h3>
                  <p className="text-[10px] text-slate-500">2 Easy Ways to generate your .apk</p>
                </div>
              </div>
              <button 
                onClick={() => setShowApkGuideModal(false)}
                className="text-slate-600 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5 text-xs text-slate-700">
              
              {/* Direct PWA Install Tip - Highlighted First */}
              <div className="bg-emerald-500 text-white rounded-xl p-3.5 shadow-md">
                <div className="flex items-center gap-1.5 font-bold text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center text-xs font-black">✓</span>
                  <span className="text-sm">Easiest: Install directly on your Android phone (NO APK needed!)</span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Hindi mo na kailangan dumaan sa PWABuilder! Ang app na ito ay <b>PWA ready</b> na.
                </p>
                <ol className="list-decimal list-inside text-xs text-white space-y-1 mt-2 bg-emerald-600/60 p-2.5 rounded-lg">
                  <li>Buksan ang link na ito sa <b>Google Chrome sa iyong Android phone</b>.</li>
                  <li>Pindutin ang <b>tatlong tuldok (⋮)</b> sa itaas sa kanan ng Chrome.</li>
                  <li>Piliin ang <b>"Install app"</b> o <b>"Add to Home screen"</b>.</li>
                  <li>May icon na ito agad sa iyong cellphone at gagana nang buong-buo na parang app mula sa Play Store!</li>
                </ol>
              </div>

              {/* PWABuilder note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">!</span>
                  <span>Bakit nag-timeout / ayaw sa PWABuilder?</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Ang Google Cloud preview environment (`run.app`) ay may <b>automated bot security cookie verification</b>. Hindi ito mabuksan ng web robot ng PWABuilder kaya sinasabi nitong "timed out / missing manifest".
                </p>
                <div className="mt-2 text-[11px] text-slate-700 bg-white border border-amber-200 p-2 rounded-lg">
                  <b>Solusyon para sa PWABuilder:</b>
                  <p className="mt-1">
                    Sa PWABuilder page na bukas mo, i-click ang <b>"Edit Your Manifest"</b> button sa ilalim, i-type ang name: <b>2OS Accounting</b>, short name: <b>2OS</b>, at pindutin ang <b>Save</b>. Agad nang magiging berde ang <b>"Package for Stores"</b>!
                  </p>
                </div>
              </div>

              {/* Method 2: Capacitor CLI */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Paraan 2: Capacitor (Local APK Build)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                  Kung kailangan mo ng aktwal na `.apk` file na maipapadala sa iba:
                </p>
                <pre className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                  npm i @capacitor/core @capacitor/cli<br />
                  npx cap init "2OS Accounting" "com.twos.accounting"<br />
                  npx cap add android<br />
                  npm run build<br />
                  npx cap copy<br />
                  npx cap open android
                </pre>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Magbubukas ang Android Studio → I-click ang <b>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK</b>.
                </p>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowApkGuideModal(false)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE TRANSACTION, CONTACT, BIR & FINANCIAL STATEMENT MODALS     */}
      {/* ========================================================================= */}
      <AddSaleModal
        isOpen={showAddSaleModal}
        onClose={() => setShowAddSaleModal(false)}
        triggerAlert={triggerAlert}
        activeCompanyName={activeCompanyName}
        customers={customers}
        setSales={setSales}
        setCustomers={setCustomers}
      />

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        triggerAlert={triggerAlert}
        activeCompanyName={activeCompanyName}
        contractors={contractors}
        setExpenses={setExpenses}
        setContractors={setContractors}
      />

      <AddCollectionModal
        isOpen={showAddCollectionModal}
        onClose={() => setShowAddCollectionModal(false)}
        triggerAlert={triggerAlert}
        activeCompanyName={activeCompanyName}
        customers={customers}
        sales={companySales}
        setCollections={setCollections}
      />

      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        triggerAlert={triggerAlert}
        activeCompanyName={activeCompanyName}
        contractors={contractors}
        setPayments={setPayments}
      />

      <AddPartyModal
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
        triggerAlert={triggerAlert}
        activeCompanyName={activeCompanyName}
        defaultType={partyModalType}
        setCustomers={setCustomers}
        setContractors={setContractors}
      />

      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        triggerAlert={triggerAlert}
        onImportData={(data) => {
          if (data.sales && setSales) setSales(prev => [...data.sales!, ...prev]);
          if (data.expenses && setExpenses) setExpenses(prev => [...data.expenses!, ...prev]);
          if (data.customers && setCustomers) setCustomers(prev => [...data.customers!, ...prev]);
        }}
      />

      <MobileBirModal
        isOpen={showBirModal}
        onClose={() => setShowBirModal(false)}
        formType={selectedBirFormType}
        activeCompany={activeCompany}
        sales={companySales}
        expenses={companyExpenses}
        monthName={activeMonthName}
        year={selectedYear}
      />

      <MobileFsModal
        isOpen={showFsModal}
        onClose={() => setShowFsModal(false)}
        activeCompany={activeCompany}
        sales={companySales}
        collections={companyCollections}
        expenses={companyExpenses}
        payments={companyPayments}
        ppeAssets={ppeAssets}
        monthName={activeMonthName}
        year={selectedYear}
        onExport={onExportActiveSheet}
      />

    </div>
  );
}
