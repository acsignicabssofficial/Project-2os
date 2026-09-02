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
  TaxBracket
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
import AboutAppTab from './components/AboutAppTab';
import TabDescriptionBanner from './components/TabDescriptionBanner';
import TwoOSDocumentHeader from './components/2os/2osDocumentHeader';
import TwoOSTopBar from './components/2os/2osTopBar';
import TwoOSRibbon from './components/2os/2osRibbon';
import TwoOSSheetBar from './components/2os/2osSheetBar';
import InfinityFreeModal from './components/InfinityFreeModal';
import { exportActiveSheetTo2OS, exportFullAccountingWorkbookTo2OS } from './utils/2osExportHelper';

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

export default function App() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [activeCompany, setActiveCompany] = useState<Company | null>(INITIAL_COMPANIES[0] || null);
  const [activeBranchCode, setActiveBranchCode] = useState<string>('ALL');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
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

  const [theme, setTheme] = useState<'neon_light' | 'clean' | 'dark'>('neon_light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInfinityFreeModalOpen, setIsInfinityFreeModalOpen] = useState(false);

  // Load backend data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/ledger-data');
        if (res.ok) {
          const data = await res.json();
          if (data.companies && data.companies.length > 0) {
            setCompanies(data.companies);
            let found = null;
            if (data.activeCompanyId) {
              found = data.companies.find((c: any) => String(c.id) === String(data.activeCompanyId));
            }
            setActiveCompany(found || data.companies[0]);
          }
          if (data.customers) setCustomers(data.customers);
          if (data.contractors) setContractors(data.contractors);
          if (data.sales) setSales(data.sales);
          if (data.collections) setCollections(data.collections);
          if (data.expenses) setExpenses(data.expenses);
          if (data.payments) setPayments(data.payments);
          if (data.ppeAssets) setPpeAssets(data.ppeAssets);
          if (data.employees) setEmployees(data.employees);
          if (data.payrollRecords) setPayrollRecords(data.payrollRecords);
          if (data.sssBrackets) setSssBrackets(data.sssBrackets);
          if (data.philhealthConfig) setPhilhealthConfig(data.philhealthConfig);
          if (data.pagibigConfig) setPagibigConfig(data.pagibigConfig);
          if (data.taxBrackets) setTaxBrackets(data.taxBrackets);
          if (data.accountTitles) setAccountTitles(data.accountTitles);
          if (data.specialEntries) setSpecialEntries(data.specialEntries);
          if (data.incomeTaxRecords) setIncomeTaxRecords(data.incomeTaxRecords);
          if (data.theme && ['neon_light', 'clean', 'dark'].includes(data.theme)) {
            setTheme(data.theme);
          }
        }
      } catch (e) {
        console.warn("API load failed, using initial state:", e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save to Express backend
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
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
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, companies, activeCompany, customers, contractors, sales, collections, expenses, payments, ppeAssets, employees, payrollRecords, sssBrackets, philhealthConfig, pagibigConfig, taxBrackets, accountTitles, specialEntries, incomeTaxRecords, theme]);

  // NAVIGATION ACTIVE TAB
  const [activeTab, setActiveTab] = useState<
    | 'sales' | 'collections' | 'expenses' | 'payments' | 'general_journal' | 'general_ledger' // Group 1
    | 'companies' | 'customers' | 'providers' | 'related_parties' | 'employees' // Group 2
    | 'dashboard' | 'account_titles' | 'tax_calendar' | 'about_app' // Group 3
    | 'tax_reports' | 'income_tax' | 'ppe' | 'payroll' | 'contribution_tables' | 'cwt_customers' | 'cwt_providers' | 'special_entries' // Group 4
    | 'fs_position' | 'fs_income' | 'fs_equity' | 'fs_cashflows' | 'fs_notes' // Group 5
    | 'bir_2316' | 'bir_slsp' | 'bir_qap' | 'bir_sawt' // Group 6
    | 'reports' // Group 7
  >('dashboard');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

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

  const handleExportAllSheets = () => {
    exportFullAccountingWorkbookTo2OS({
      companyName: activeCompanyName,
      sales: companySales,
      collections: companyCollections,
      expenses: companyExpenses,
      payments: companyPayments,
      specialEntries: companySpecialEntries,
      ppeAssets: companyPpeAssets,
      customers,
      contractors,
      employees: companyEmployees,
      payrollRecords: companyPayrollRecords,
      accountTitles
    });
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
          globalSearch={globalSearch}
          onSearchChange={setGlobalSearch}
          onSave={handleManualSave}
          onExportAll={handleExportAllSheets}
          onOpenInfinityFreeModal={() => setIsInfinityFreeModalOpen(true)}
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
          onExportActiveSheet={handleExportActiveSheet}
          onExportAllSheets={handleExportAllSheets}
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
          
          {/* CENTERED 2OS DOCUMENT HEADER (COMPANY, PERIOD, JOURNAL TITLE, BRANCH BADGE) */}
          <TwoOSDocumentHeader 
            activeTab={activeTab} 
            activeCompany={activeCompany}
            companies={companies}
            setActiveCompany={setActiveCompany}
            activeBranchCode={activeBranchCode}
            theme={activeTheme} 
            themeMode={theme}
            triggerAlert={triggerAlert}
          />

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
                  triggerAlert={triggerAlert}
                />
              )}

              {activeTab === 'sales' && (
                <SalesTab 
                  sales={companySales}
                  setSales={setSales}
                  setCollections={setCollections}
                  customers={customers}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  setShowAddCustomerPrompt={setShowAddCustomerPrompt}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'collections' && (
                <CollectionsTab 
                  collections={companyCollections}
                  setCollections={setCollections}
                  sales={sales}
                  setSales={setSales}
                  customers={customers}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  setShowAddCustomerPrompt={setShowAddCustomerPrompt}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesTab 
                  expenses={companyExpenses}
                  setExpenses={setExpenses}
                  setPayments={setPayments}
                  serviceProviders={contractors as any}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  setShowAddProviderPrompt={setShowAddProviderPrompt}
                  globalSearch={globalSearch}
                />
              )}

              {activeTab === 'payments' && (
                <PaymentsTab 
                  payments={companyPayments}
                  setPayments={setPayments}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  serviceProviders={contractors as any}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  setShowAddProviderPrompt={setShowAddProviderPrompt}
                  globalSearch={globalSearch}
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

              {activeTab === 'about_app' && (
                <AboutAppTab theme={activeTheme} />
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
                  payrollRecords={[]}
                  accountTitles={accountTitles}
                  activeCompany={activeCompany}
                  theme={activeTheme}
                  triggerAlert={triggerAlert}
                  initialSubTab={
                    activeTab === 'reports_horizontal' ? 'horizontal' :
                    activeTab === 'reports_vertical' ? 'vertical' :
                    activeTab === 'reports_ratios' ? 'ratios' : 'turnovers'
                  }
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

    </div>
  );
}
