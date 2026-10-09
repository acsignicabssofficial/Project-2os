import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  FileSpreadsheet, 
  HelpCircle, 
  Database,
  Building2,
  Receipt,
  CreditCard,
  Users,
  Briefcase,
  Layers,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  ImportableDataType, 
  CSV_TEMPLATES, 
  downloadCsvTemplate, 
  parseCsvText, 
  computeColumnSummaries,
  ColumnSummary
} from '../../utils/csvImportExport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompanyName: string;
  defaultType?: ImportableDataType;
  onConfirmImport: (
    dataType: ImportableDataType, 
    parsedRows: Record<string, string>[],
    headers: string[]
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function ImportModal({
  isOpen,
  onClose,
  activeCompanyName,
  defaultType = 'sales',
  onConfirmImport
}: ImportModalProps) {
  // Step state: 1 = Choose Type, 2 = CSV Format Question & File Upload, 3 = Preview & Column Summary, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<ImportableDataType>(defaultType);
  
  // Step 2 sub-state: "yes" = have CSV, "no" = need template, null = not chosen yet
  const [hasCsv, setHasCsv] = useState<boolean | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 3 preview data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnSummaries, setColumnSummaries] = useState<ColumnSummary[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setHasCsv(null);
    setUploadedFileName('');
    setParseError(null);
    setHeaders([]);
    setRows([]);
    setColumnSummaries([]);
    setIsImporting(false);
    setSuccessMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Handle File Chosen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadedFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          setParseError('The uploaded file is empty. Please select a valid CSV file with data.');
          return;
        }

        const { headers: parsedHeaders, rows: parsedRows } = parseCsvText(text);
        if (parsedHeaders.length === 0 || parsedRows.length === 0) {
          setParseError('No readable rows found in the CSV file. Please make sure the file contains a header row and at least 1 record.');
          return;
        }

        const summaries = computeColumnSummaries(parsedHeaders, parsedRows);
        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setColumnSummaries(summaries);
        setStep(3); // Advance to Preview & Summary
      } catch (err: any) {
        setParseError(`Failed to parse CSV file: ${err.message || 'Invalid format'}`);
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Perform Final Commit
  const handleCommitImport = async () => {
    setIsImporting(true);
    setParseError(null);
    try {
      const result = await onConfirmImport(selectedType, rows, headers);
      if (result.success) {
        setSuccessMessage(result.message || `Successfully imported ${rows.length} records into ${CSV_TEMPLATES[selectedType].label}. Database updated.`);
        setStep(4);
      } else {
        setParseError(result.message || 'Import failed. Please check your data and retry.');
      }
    } catch (e: any) {
      setParseError(`Import failed: ${e.message || 'Database sync error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // List of data types to choose from
  const dataTypesList: { key: ImportableDataType; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'sales', label: 'Sales Invoices', icon: <Receipt className="w-5 h-5 text-emerald-500" />, desc: 'Invoices, VAT breakdown, withholding 2307, customers' },
    { key: 'expenses', label: 'Expenses & APV', icon: <CreditCard className="w-5 h-5 text-rose-500" />, desc: 'Expense vouchers, input VAT, 2307/2306, vendors' },
    { key: 'collections', label: 'Collections / Cash Receipts', icon: <Building2 className="w-5 h-5 text-blue-500" />, desc: 'Customer payments, OR/PR numbers, 2307 deducted' },
    { key: 'payments', label: 'Disbursements & Payments', icon: <Briefcase className="w-5 h-5 text-amber-500" />, desc: 'Check payments, disbursement vouchers, supplier payouts' },
    { key: 'customers', label: 'Customers Directory', icon: <Users className="w-5 h-5 text-cyan-500" />, desc: 'Client registered names, TIN, address, contact persons' },
    { key: 'providers', label: 'Service Providers / Vendors', icon: <Users className="w-5 h-5 text-indigo-500" />, desc: 'Supplier profiles, TIN, ATC codes, contact details' },
    { key: 'account_titles', label: 'Chart of Accounts', icon: <Layers className="w-5 h-5 text-teal-500" />, desc: 'Account codes, title names, classifications, normal balance' },
    { key: 'employees', label: 'Employees Directory', icon: <Users className="w-5 h-5 text-purple-500" />, desc: 'Staff profiles, TIN, SSS, PhilHealth, Pag-IBIG, salaries' },
    { key: 'special_entries', label: 'General Journal Entries', icon: <FileSpreadsheet className="w-5 h-5 text-violet-500" />, desc: 'Adjusting, closing, and special debit/credit entries' },
    { key: 'ppe', label: 'Property, Plant & Equipment', icon: <Database className="w-5 h-5 text-orange-500" />, desc: 'Fixed asset registers, acquisition costs, useful life' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Import Data Wizard</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Company: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{activeCompanyName}</span>
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex items-center justify-center text-[11px] font-bold w-6 h-6 rounded-full transition ${
                  step === s 
                    ? 'bg-violet-600 text-white shadow-xs' 
                    : step > s 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
            <button 
              onClick={handleClose} 
              className="ml-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: WHICH FILE / DATA TYPE DO YOU WANT TO IMPORT? */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Step 1 of 3</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">Which file or data type do you want to import?</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Select the accounting module or directory you are importing into.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                {dataTypesList.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedType(item.key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedType === item.key
                        ? 'border-violet-600 dark:border-violet-500 bg-violet-50/70 dark:bg-violet-950/30 shadow-xs ring-1 ring-violet-500/50'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.label}</span>
                        {selectedType === item.key && (
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: DO YOU HAVE A CSV FORMAT READY? */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Step 2 of 3</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Do you have your {CSV_TEMPLATES[selectedType].label} in CSV format?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Import files must be comma-separated (.csv) with recognized column headers.
                </p>
              </div>

              {/* Initial Choice: Yes vs No */}
              {hasCsv === null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* YES OPTION */}
                  <div 
                    onClick={() => setHasCsv(true)}
                    className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Yes, I have a CSV file</h4>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                        I already prepared my file in CSV format and want to browse and choose it for upload.
                      </p>
                    </div>
                    <button 
                      type="button"
                      className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <span>Proceed to Browse File</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* NO OPTION */}
                  <div 
                    onClick={() => setHasCsv(false)}
                    className="p-5 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                        <Download className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">No, I need a template</h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                        Download the official 2OS CSV template first so my columns and headers match the application correctly.
                      </p>
                    </div>
                    <button 
                      type="button"
                      className="mt-5 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Get CSV Template</span>
                    </button>
                  </div>
                </div>
              )}

              {/* IF NO: SHOW DOWNLOADABLE TEMPLATE CARD */}
              {hasCsv === false && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                          Official CSV Template: {CSV_TEMPLATES[selectedType].label}
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
                          This template contains standard Philippine BIR & PFRS headers, formatting rules, and sample demo rows. Download it, fill in your records using Microsoft Excel, Google Sheets, or any spreadsheet tool, and export as CSV.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadCsvTemplate(selectedType)}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download {CSV_TEMPLATES[selectedType].filename}</span>
                          </button>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400">
                            Headers: {CSV_TEMPLATES[selectedType].headers.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Once you have filled out your template:</p>
                    <button
                      type="button"
                      onClick={() => setHasCsv(true)}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Proceed to Browse and Choose File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* IF YES: FILE UPLOAD BROWSER */}
              {hasCsv === true && (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-violet-300 dark:border-violet-700/70 hover:border-violet-500 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 hover:bg-violet-50/70 dark:hover:bg-violet-950/30 text-center transition cursor-pointer flex flex-col items-center justify-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Click to Browse or Drag & Drop your CSV file
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                      Upload your formatted <code className="font-mono text-violet-600 dark:text-violet-400">.csv</code> file for {CSV_TEMPLATES[selectedType].label}.
                    </p>
                    <span className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-xs">
                      Choose File to Upload
                    </span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,text/csv" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setHasCsv(false)}
                      className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Need the template first? Download here</span>
                    </button>
                    <span>UTF-8 Comma-Separated Values (.csv)</span>
                  </div>

                  {parseError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW DATA WITH COLUMN SUMMARY (SUM, COUNT, BLANK) & CONFIRM */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Step 3 of 3</span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    Data Preview & Column Summary Verification
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    File: <span className="font-medium text-zinc-800 dark:text-zinc-200">{uploadedFileName}</span> • Total Rows: <span className="font-bold text-emerald-600 dark:text-emerald-400">{rows.length}</span> • Total Columns: <span className="font-bold">{headers.length}</span>
                  </p>
                </div>
              </div>

              {/* COLUMN SUMMARY MATRIX (SUM, COUNT, BLANK) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <span>Summary Per Column (Sum, Count, or Blank)</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">Auto-detected data types & metrics</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {columnSummaries.map((col, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={col.name}>
                            {col.name}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                            col.dataType === 'numeric' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                              : col.dataType === 'date'
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}>
                            {col.dataType === 'numeric' ? 'SUM/NUM' : 'COUNT'}
                          </span>
                        </div>

                        {/* METRICS: SUM OR COUNT, AND BLANK */}
                        {col.dataType === 'numeric' && col.sum !== null ? (
                          <div className="mt-1">
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              ₱{col.sum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>Sum Total</span>
                              <span>•</span>
                              <span>{col.count} values</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                              {col.count} populated
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Count of entries
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BLANK COUNT */}
                      <div className="mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500">Blank:</span>
                        <span className={`font-mono font-semibold ${col.blankCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>
                          {col.blankCount} {col.blankCount === 1 ? 'blank' : 'blanks'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATA PREVIEW TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Data Preview (First {Math.min(rows.length, 10)} of {rows.length} rows)
                  </h4>
                  <span className="text-[11px] text-zinc-500 font-mono">Scroll horizontally to view all columns</span>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto max-h-52">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase border-r border-zinc-200 dark:border-zinc-800">#</th>
                        {headers.map((h, i) => (
                          <th key={i} className="py-2 px-3 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {rows.slice(0, 10).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-violet-50/40 dark:hover:bg-violet-950/20">
                          <td className="py-1.5 px-3 font-mono text-[10px] text-zinc-400 border-r border-zinc-200 dark:border-zinc-800">{rIdx + 1}</td>
                          {headers.map((h, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">
                              {row[h] || <span className="text-zinc-400 italic font-mono text-[10px]">(blank)</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONFIRMATION PROMPT */}
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Are these summary figures and columns correct?
                    </h5>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Confirming will import {rows.length} records into your active ledger and update the local SQLite (.db) database file.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setHasCsv(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  >
                    No, Re-upload
                  </button>
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleCommitImport}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving to .db...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes, Import Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS PROMPT & .DB FILE CONFIRMATION */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  import data successful
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 max-w-md mx-auto">
                  {successMessage}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Target Module:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{CSV_TEMPLATES[selectedType].label}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Records Imported:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{rows.length} records</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Database State:</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>2os_database.db Updated</span>
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition cursor-pointer"
                >
                  Done & View Ledger
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        {step < 3 && (
          <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setHasCsv(null);
                }}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Modules</span>
              </button>
            ) : (
              <div></div>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Next: CSV Format Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
