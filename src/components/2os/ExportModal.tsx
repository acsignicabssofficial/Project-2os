import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  CheckCircle2, 
  X, 
  Receipt, 
  CreditCard, 
  Building2, 
  Briefcase, 
  Users, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToCsv } from '../../utils/csvImportExport';
import { exportActiveSheetTo2OS, exportFullAccountingWorkbookTo2OS } from '../../utils/2osExportHelper';

export type ExportTarget = 
  | 'active'
  | 'sales'
  | 'expenses'
  | 'collections'
  | 'payments'
  | 'customers'
  | 'providers'
  | 'account_titles'
  | 'employees'
  | 'special_entries'
  | 'ppe'
  | 'full_workbook'
  | 'sql_dump';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  activeTabLabel: string;
  activeCompanyName: string;
  // Datasets
  data: {
    sales: any[];
    expenses: any[];
    collections: any[];
    payments: any[];
    customers: any[];
    providers: any[];
    accountTitles: any[];
    employees: any[];
    payrollRecords: any[];
    specialEntries: any[];
    ppeAssets: any[];
  };
}

export default function ExportModal({
  isOpen,
  onClose,
  activeTab,
  activeTabLabel,
  activeCompanyName,
  data
}: ExportModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget>('active');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'sql'>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedSuccess, setExportedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setExportedSuccess(null);
    onClose();
  };

  const getRecordCount = (target: ExportTarget): number => {
    switch (target) {
      case 'active':
        if (activeTab === 'sales') return data.sales.length;
        if (activeTab === 'expenses') return data.expenses.length;
        if (activeTab === 'collections') return data.collections.length;
        if (activeTab === 'payments') return data.payments.length;
        if (activeTab === 'customers') return data.customers.length;
        if (activeTab === 'providers') return data.providers.length;
        if (activeTab === 'account_titles') return data.accountTitles.length;
        if (activeTab === 'employees') return data.employees.length;
        if (activeTab === 'special_entries') return data.specialEntries.length;
        if (activeTab === 'ppe') return data.ppeAssets.length;
        return data.sales.length;
      case 'sales': return data.sales.length;
      case 'expenses': return data.expenses.length;
      case 'collections': return data.collections.length;
      case 'payments': return data.payments.length;
      case 'customers': return data.customers.length;
      case 'providers': return data.providers.length;
      case 'account_titles': return data.accountTitles.length;
      case 'employees': return data.employees.length;
      case 'special_entries': return data.specialEntries.length;
      case 'ppe': return data.ppeAssets.length;
      case 'full_workbook': 
        return data.sales.length + data.expenses.length + data.collections.length + data.payments.length;
      case 'sql_dump':
        return data.sales.length + data.expenses.length;
      default: return 0;
    }
  };

  const targetsList: { id: ExportTarget; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
      id: 'active', 
      label: `Current Active Sheet (${activeTabLabel})`, 
      desc: `Export only the data you are currently viewing (${getRecordCount('active')} items)`, 
      icon: <FileSpreadsheet className="w-5 h-5 text-violet-500" /> 
    },
    { 
      id: 'sales', 
      label: 'Sales Invoices / Sales Register', 
      desc: `Customer billing, VAT breakdown, 2307 deductions (${data.sales.length} items)`, 
      icon: <Receipt className="w-5 h-5 text-emerald-500" /> 
    },
    { 
      id: 'expenses', 
      label: 'Expenses & Accounts Payable Vouchers', 
      desc: `Vendor invoices, input VAT, 2307/2306 withholding (${data.expenses.length} items)`, 
      icon: <CreditCard className="w-5 h-5 text-rose-500" /> 
    },
    { 
      id: 'collections', 
      label: 'Collections / Cash Receipts', 
      desc: `Official receipts, cash collections, 2307 withheld (${data.collections.length} items)`, 
      icon: <Building2 className="w-5 h-5 text-blue-500" /> 
    },
    { 
      id: 'payments', 
      label: 'Supplier Payments / Check Disbursements', 
      desc: `Check disbursement vouchers, bank payouts (${data.payments.length} items)`, 
      icon: <Briefcase className="w-5 h-5 text-amber-500" /> 
    },
    { 
      id: 'customers', 
      label: 'Customers / Clients Directory', 
      desc: `Customer masterfile, TIN, addresses (${data.customers.length} items)`, 
      icon: <Users className="w-5 h-5 text-cyan-500" /> 
    },
    { 
      id: 'providers', 
      label: 'Service Providers / Vendors Directory', 
      desc: `Supplier masterfile, TIN, ATC codes (${data.providers.length} items)`, 
      icon: <Users className="w-5 h-5 text-indigo-500" /> 
    },
    { 
      id: 'account_titles', 
      label: 'Chart of Accounts', 
      desc: `Account codes, classifications, normal balances (${data.accountTitles.length} items)`, 
      icon: <Layers className="w-5 h-5 text-teal-500" /> 
    },
    { 
      id: 'employees', 
      label: 'Employees & Payroll', 
      desc: `Employee masterfile, SSS, PhilHealth, Pag-IBIG (${data.employees.length} items)`, 
      icon: <Users className="w-5 h-5 text-purple-500" /> 
    },
    { 
      id: 'special_entries', 
      label: 'General Journal Entries', 
      desc: `Journal vouchers, adjustments, debits & credits (${data.specialEntries.length} items)`, 
      icon: <FileText className="w-5 h-5 text-violet-500" /> 
    },
    { 
      id: 'ppe', 
      label: 'Property, Plant & Equipment (PPE)', 
      desc: `Fixed asset registry, depreciation schedules (${data.ppeAssets.length} items)`, 
      icon: <Database className="w-5 h-5 text-orange-500" /> 
    },
    { 
      id: 'full_workbook', 
      label: 'Complete Multi-Sheet Accounting Workbook', 
      desc: `All 11 modules combined into one comprehensive multi-tab Excel file`, 
      icon: <Sparkles className="w-5 h-5 text-fuchsia-500" /> 
    },
    { 
      id: 'sql_dump', 
      label: 'Database SQL Backup (transactions.sql)', 
      desc: `Raw relational SQL insert statements compatible with MySQL / PostgreSQL / SQLite`, 
      icon: <Database className="w-5 h-5 text-sky-500" /> 
    }
  ];

  const handleExecuteExport = () => {
    setIsExporting(true);
    setExportedSuccess(null);

    try {
      const safeCompanyName = (activeCompanyName || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);

      // Handle Full Workbook
      if (selectedTarget === 'full_workbook') {
        exportFullAccountingWorkbookTo2OS({
          companyName: activeCompanyName,
          sales: data.sales,
          collections: data.collections,
          expenses: data.expenses,
          payments: data.payments,
          specialEntries: data.specialEntries,
          ppeAssets: data.ppeAssets,
          customers: data.customers,
          contractors: data.providers,
          employees: data.employees,
          payrollRecords: data.payrollRecords,
          accountTitles: data.accountTitles
        });
        setExportedSuccess(`Exported Full Multi-Sheet 2OS Workbook (.xlsx) successfully!`);
        setIsExporting(false);
        return;
      }

      // Handle SQL Dump
      if (selectedTarget === 'sql_dump' || format === 'sql') {
        const a = document.createElement('a');
        a.href = '/api/export-sql';
        a.download = `${safeCompanyName}_transactions_${dateStr}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportedSuccess(`Exported transactions.sql backup script successfully!`);
        setIsExporting(false);
        return;
      }

      // Determine dataset
      let dataset: any[] = [];
      let filenameBase = '';

      switch (selectedTarget) {
        case 'active':
          filenameBase = `${safeCompanyName}_${activeTabLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}`;
          if (activeTab === 'sales') dataset = data.sales;
          else if (activeTab === 'expenses') dataset = data.expenses;
          else if (activeTab === 'collections') dataset = data.collections;
          else if (activeTab === 'payments') dataset = data.payments;
          else if (activeTab === 'customers') dataset = data.customers;
          else if (activeTab === 'providers') dataset = data.providers;
          else if (activeTab === 'account_titles') dataset = data.accountTitles;
          else if (activeTab === 'employees') dataset = data.employees;
          else if (activeTab === 'special_entries') dataset = data.specialEntries;
          else if (activeTab === 'ppe') dataset = data.ppeAssets;
          else dataset = data.sales;
          break;
        case 'sales':
          filenameBase = `${safeCompanyName}_Sales_Register_${dateStr}`;
          dataset = data.sales;
          break;
        case 'expenses':
          filenameBase = `${safeCompanyName}_Expenses_APV_${dateStr}`;
          dataset = data.expenses;
          break;
        case 'collections':
          filenameBase = `${safeCompanyName}_Collections_Receipts_${dateStr}`;
          dataset = data.collections;
          break;
        case 'payments':
          filenameBase = `${safeCompanyName}_Disbursements_Payments_${dateStr}`;
          dataset = data.payments;
          break;
        case 'customers':
          filenameBase = `${safeCompanyName}_Customers_${dateStr}`;
          dataset = data.customers;
          break;
        case 'providers':
          filenameBase = `${safeCompanyName}_Service_Providers_${dateStr}`;
          dataset = data.providers;
          break;
        case 'account_titles':
          filenameBase = `${safeCompanyName}_Chart_of_Accounts_${dateStr}`;
          dataset = data.accountTitles;
          break;
        case 'employees':
          filenameBase = `${safeCompanyName}_Employees_${dateStr}`;
          dataset = data.employees;
          break;
        case 'special_entries':
          filenameBase = `${safeCompanyName}_General_Journal_${dateStr}`;
          dataset = data.specialEntries;
          break;
        case 'ppe':
          filenameBase = `${safeCompanyName}_PPE_Assets_${dateStr}`;
          dataset = data.ppeAssets;
          break;
      }

      if (format === 'xlsx') {
        exportActiveSheetTo2OS(selectedTarget, dataset, activeCompanyName);
        setExportedSuccess(`Exported ${dataset.length} records to Excel (.xlsx) successfully!`);
      } else {
        // CSV format
        if (dataset.length === 0) {
          dataset = [{ Info: 'No records available' }];
        }
        const headers = Object.keys(dataset[0] || {}).filter(k => typeof dataset[0][k] !== 'object');
        exportToCsv(`${filenameBase}.csv`, headers, dataset);
        setExportedSuccess(`Exported ${dataset.length} records to CSV (.csv) successfully!`);
      }
    } catch (err: any) {
      setExportedSuccess(`Export warning: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Export Data Center</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Company: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{activeCompanyName}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose} 
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* QUESTION: WHICH DO YOU WANT TO EXPORT? */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Which data do you want to export?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select the dataset, register, or full workbook you wish to download.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {targetsList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedTarget(item.id);
                    if (item.id === 'full_workbook') setFormat('xlsx');
                    if (item.id === 'sql_dump') setFormat('sql');
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedTarget === item.id
                      ? 'border-cyan-600 dark:border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/30 shadow-xs ring-1 ring-cyan-500/50'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.label}</span>
                      {selectedTarget === item.id && (
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-0.5 rounded-full shrink-0">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FORMAT SELECTION */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Select Export Format:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={selectedTarget === 'full_workbook'}
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                  format === 'csv'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                } ${selectedTarget === 'full_workbook' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-xs font-bold">CSV (.csv)</div>
                  <div className="text-[10px] text-zinc-500">Universal standard</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                  format === 'xlsx'
                    ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 font-bold text-cyan-700 dark:text-cyan-300'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className="text-xs font-bold">Excel (.xlsx)</div>
                  <div className="text-[10px] text-zinc-500">Spreadsheet table</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormat('sql');
                  setSelectedTarget('sql_dump');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                  format === 'sql'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 font-bold text-sky-700 dark:text-sky-300'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Database className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="text-xs font-bold">SQL Script (.sql)</div>
                  <div className="text-[10px] text-zinc-500">Database dump</div>
                </div>
              </button>
            </div>
          </div>

          {exportedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{exportedSuccess}</span>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExecuteExport}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Generating Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Selected Data Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
