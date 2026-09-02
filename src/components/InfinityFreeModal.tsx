import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  FileCode, 
  ExternalLink, 
  Layers, 
  Terminal,
  ShieldCheck,
  FolderArchive,
  HardDrive
} from 'lucide-react';
import { 
  generateInfinityFreeSql, 
  downloadInfinityFreeSqlFile 
} from '../utils/infinityFreeSqlGenerator';
import { 
  checkInfinityFreeConnection, 
  triggerInfinityFreeSetup, 
  syncAllToInfinityFree, 
  InfinityFreeDbStatus 
} from '../utils/infinityFreeSync';

interface InfinityFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
  appData: {
    companies: any[];
    customers: any[];
    sales: any[];
    collections: any[];
    serviceProviders: any[];
    expenses: any[];
    payments: any[];
    generalJournal: any[];
    chartOfAccounts: any[];
    payroll: any[];
  };
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function InfinityFreeModal({
  isOpen,
  onClose,
  theme,
  appData,
  triggerAlert
}: InfinityFreeModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'guide' | 'status'>('overview');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<InfinityFreeDbStatus | null>(null);

  // Generate dynamic live SQL with current data
  const liveSql = React.useMemo(() => {
    return generateInfinityFreeSql(appData);
  }, [appData]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(liveSql);
    setCopiedSql(true);
    triggerAlert('MySQL script copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadLiveSql = () => {
    downloadInfinityFreeSqlFile(liveSql, `infinityfree_2os_data_${new Date().toISOString().split('T')[0]}.sql`);
    triggerAlert('Downloaded live MySQL database dump (.sql)!', 'success');
  };

  const handleTestConnection = async () => {
    setIsCheckingDb(true);
    const status = await checkInfinityFreeConnection();
    setDbStatus(status);
    setIsCheckingDb(false);
    if (status.connected) {
      triggerAlert('Connected to InfinityFree MySQL successfully!', 'success');
    } else {
      triggerAlert(status.error || 'Could not connect to InfinityFree PHP API.', 'info');
    }
  };

  const handleSyncToInfinityFree = async () => {
    setIsSyncing(true);
    const result = await syncAllToInfinityFree(appData);
    setIsSyncing(false);
    if (result.success) {
      triggerAlert('Synchronized all 10 tables to InfinityFree MySQL!', 'success');
    } else {
      triggerAlert(result.message, 'error');
    }
  };

  const handleRunSetup = async () => {
    setIsSyncing(true);
    const result = await triggerInfinityFreeSetup();
    setIsSyncing(false);
    if (result.success) {
      triggerAlert(result.message, 'success');
      handleTestConnection();
    } else {
      triggerAlert(result.message, 'error');
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                  InfinityFree Web Host & MySQL Deployment Center
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  LAMP / phpMyAdmin Ready
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Deploy this full-stack accounting webapp directly to InfinityFree's Apache, PHP, and MySQL hosting.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 px-6 pt-3 pb-2 border-b border-zinc-800/40 bg-zinc-500/5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            1. Deployment & Downloads
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Database className="w-4 h-4" />
            2. InfinityFree MySQL Schema (.sql)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Terminal className="w-4 h-4" />
            3. Step-by-Step InfinityFree Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'status'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            4. Live API & DB Status
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* TAB 1: OVERVIEW & DOWNLOADS */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              {/* SPECIAL HERO CARD: 1-FILE DIRECT UPLOAD FOR INFINITYFREE */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-cyan-950/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <FileCode className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 uppercase tracking-wider">
                        Recommended
                      </span>
                      <h4 className="font-display font-extrabold text-base text-emerald-300">
                        All-in-One Standalone Web App (1 Single `index.html` File)
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Lahat ng React code, Tailwind styles, at features ay naka-package sa <strong>isang pirasong <code>index.html</code> lamang</strong>. Hindi mo na kailangang mag-upload ng hiwalay na `.js` o `.css` o `assets/` folder. I-drop lang sa <code>htdocs/</code> at gagana agad sa iyong domain (<code>2os.ifree.page</code>)!
                    </p>
                  </div>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                  <a
                    href="/api/download-singlefile-html"
                    download="index.html"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-5 h-5" />
                    Download Standalone index.html
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CARD 1: EXPORT MYSQL DUMP */}
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Database className="w-5 h-5" />
                      <h4 className="font-bold text-sm">MySQL Database Dump (.sql)</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Complete MySQL schema with all 10 tables, BIR 2303 compliance, and current active records ready to import into phpMyAdmin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadLiveSql}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download MySQL (.sql)
                  </button>
                </div>

                {/* CARD 2: APACHE .HTACCESS */}
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <FileCode className="w-5 h-5" />
                      <h4 className="font-bold text-sm">Apache .htaccess Router</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Pre-configured rewrite rules for InfinityFree Apache server so page reloads, routes, and `/api/` PHP endpoints work seamlessly.
                    </p>
                  </div>
                  <a
                    href="/.htaccess"
                    download=".htaccess"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download .htaccess
                  </a>
                </div>

                {/* CARD 3: PHP BACKEND REST API & DB CONFIG */}
                <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-pink-400 mb-2">
                      <FolderArchive className="w-5 h-5" />
                      <h4 className="font-bold text-sm">PHP db_config.php & API</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ang configuration file kung saan ilalagay ang iyong MySQL Hostname, Username, Password, at Database Name.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <a
                      href="/api/db_config.php"
                      download="db_config.php"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download db_config.php
                    </a>
                  </div>
                </div>
              </div>

              {/* SCHEMA HIGHLIGHTS */}
              <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/5 flex flex-col gap-3`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textTitle} flex items-center gap-2`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  10-Table MySQL Architecture (Fully Compatible with InfinityFree & phpMyAdmin)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-emerald-400">1. Company</span>
                    <p className="text-[10px] text-zinc-500">Corporate & Workspace Entities</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-emerald-400">2. bir_2303</span>
                    <p className="text-[10px] text-zinc-500">YES/NO Tax Obligations</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-cyan-400">3. Customers</span>
                    <p className="text-[10px] text-zinc-500">Clients Masterlist</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-cyan-400">4. Sales</span>
                    <p className="text-[10px] text-zinc-500">Sales Invoices & VAT</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-cyan-400">5. Collections</span>
                    <p className="text-[10px] text-zinc-500">Cash Receipts & 2307 CWT</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-amber-400">6. Service_Providers</span>
                    <p className="text-[10px] text-zinc-500">Suppliers & Contractors</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-amber-400">7. Expenses</span>
                    <p className="text-[10px] text-zinc-500">Purchase Journal & EWT</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-amber-400">8. Payments</span>
                    <p className="text-[10px] text-zinc-500">Check Vouchers & Cash Out</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-indigo-400">9. General_Journal</span>
                    <p className="text-[10px] text-zinc-500">Debit / Credit Double-Entry</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40">
                    <span className="font-mono font-bold text-indigo-400">10. Chart_of_Accounts</span>
                    <p className="text-[10px] text-zinc-500">Standard PH COA Titles</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCHEMA VIEWER */}
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${theme.textTitle}`}>InfinityFree MySQL / MariaDB SQL Script</h4>
                  <p className="text-xs text-zinc-400">Contains table definitions, constraints, indexes, and current record inserts.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold transition cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadLiveSql}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .sql
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-emerald-300 max-h-96 overflow-y-auto select-all leading-relaxed">
                <pre>{liveSql}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP INFINITYFREE GUIDE */}
          {activeTab === 'guide' && (
            <div className="flex flex-col gap-4 animate-fadeIn text-xs leading-relaxed text-zinc-300">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm text-emerald-400">How InfinityFree Hosting Works</h5>
                  <p className="text-xs text-zinc-300 mt-1">
                    InfinityFree runs on a classic <strong>LAMP stack</strong> (Linux, Apache, MySQL/MariaDB, PHP). It hosts client-side static web apps (React) in <code>htdocs/</code> and executes backend PHP scripts inside <code>htdocs/api/</code> connected to its MySQL databases.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* STEP 1 */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-pink-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center text-xs">1</span>
                    Create MySQL Database in InfinityFree
                  </div>
                  <p className="text-zinc-400">
                    Log in to InfinityFree vPanel &gt; Under <strong>Databases</strong>, click <strong>MySQL Databases</strong> &gt; Create a database (e.g. <code>epiz_xxxxxx_accounting</code>).
                  </p>
                </div>

                {/* STEP 2 */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                    Import infinityfree_database.sql in phpMyAdmin
                  </div>
                  <p className="text-zinc-400">
                    In InfinityFree vPanel, click <strong>phpMyAdmin</strong> &gt; select your database &gt; click <strong>Import</strong> &gt; select <code>infinityfree_database.sql</code> and click <strong>Go</strong>.
                  </p>
                </div>

                {/* STEP 3 */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">3</span>
                    Update Credentials in api/db_config.php
                  </div>
                  <p className="text-zinc-400">
                    Open <code>api/db_config.php</code> and put your InfinityFree MySQL host, username, password, and database name.
                  </p>
                </div>

                {/* STEP 4 */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-extrabold">4</span>
                    Upload Standalone index.html to htdocs/ (1 Single File)
                  </div>
                  <p className="text-zinc-300">
                    I-download ang <strong>Standalone index.html</strong> mula sa Tab 1, at i-upload lang ito sa loob ng <code>htdocs/</code> gamit ang File Manager. Hindi na kailangan ng hiwalay na JS/CSS files o folders!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATUS & TWO-WAY SYNC */}
          {activeTab === 'status' && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-200">Backend MySQL Connection Diagnostics</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {dbStatus?.connected 
                      ? `Connected to ${dbStatus.host} (${dbStatus.database})` 
                      : 'Running in Standalone Offline-First / Preview Mode.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isCheckingDb}
                  onClick={handleTestConnection}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                  {isCheckingDb ? 'Checking...' : 'Test Connection'}
                </button>
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleRunSetup}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  1-Click Initialize Tables (/api/setup_db.php)
                </button>

                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncToInfinityFree}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Sync In-App Data to InfinityFree MySQL
                </button>
              </div>

              {dbStatus?.error && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Notice:</p>
                    <p className="mt-0.5">{dbStatus.error}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      When uploaded to InfinityFree's <code>htdocs/</code>, this endpoint connects directly to your live MySQL database!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for InfinityFree Apache / PHP 7.4-8.2 / MariaDB-MySQL</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadLiveSql}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .SQL Dump
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
