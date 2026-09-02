import React, { useState } from 'react';
import { 
  X, 
  History, 
  User, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Eye, 
  Filter, 
  Download,
  Search,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Company } from '../../types';
import { getTabInfo } from './2osTypes';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  activeCompany: Company | null;
  themeMode: 'neon_light' | 'clean' | 'dark';
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'EXPORT';
  submenu: string;
  submenuKey: string;
  entityName: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  status: 'COMPLIANT' | 'VERIFIED' | 'RECORDED';
}

export default function AuditTrailModal({
  isOpen,
  onClose,
  activeTab,
  activeCompany,
  themeMode
}: AuditTrailModalProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const currentTabInfo = getTabInfo(activeTab);

  // Dynamic audit logs tailored to active company and selected submenu
  const mockAuditLogs: AuditLogItem[] = [
    {
      id: 'LOG-8842',
      timestamp: '2026-08-14 13:45:12',
      user: 'AC Signica Admin',
      userEmail: 'acsignicabss.official@gmail.com',
      action: 'UPDATE',
      submenu: currentTabInfo.label,
      submenuKey: activeTab,
      entityName: activeCompany?.company_name || 'AC Signica BSS Inc.',
      details: `Updated record values in ${currentTabInfo.label} with real-time PFRS double-entry reconciliation.`,
      oldValue: 'Tax Status: Pending Verification | Amount: ₱145,000.00',
      newValue: 'Tax Status: BIR Form 2550Q Reconciled | Amount: ₱152,400.00',
      status: 'VERIFIED'
    },
    {
      id: 'LOG-8841',
      timestamp: '2026-08-14 11:20:05',
      user: 'Chief Accountant',
      userEmail: 'acsignicabss.official@gmail.com',
      action: 'CREATE',
      submenu: currentTabInfo.label,
      submenuKey: activeTab,
      entityName: activeCompany?.company_name || 'AC Signica BSS Inc.',
      details: `Inserted new verified entry with automatic Chart of Accounts ledger mapping.`,
      oldValue: 'None (New Entry Initialization)',
      newValue: 'Voucher Ref: 2OS-2026-0091 | Debit/Credit Balanced',
      status: 'COMPLIANT'
    },
    {
      id: 'LOG-8839',
      timestamp: '2026-08-13 16:30:22',
      user: 'Compliance Auditor',
      userEmail: 'auditor@2os-systems.ph',
      action: 'VALIDATE',
      submenu: currentTabInfo.label,
      submenuKey: activeTab,
      entityName: activeCompany?.company_name || 'AC Signica BSS Inc.',
      details: `Automated BIR withholding tax and PFRS presentation integrity audit executed.`,
      oldValue: 'PFRS Check: In Progress',
      newValue: 'PFRS Check: PAS 1 / PFRS for SMEs Fully Compliant',
      status: 'COMPLIANT'
    },
    {
      id: 'LOG-8835',
      timestamp: '2026-08-13 09:15:44',
      user: 'Finance Manager',
      userEmail: 'acsignicabss.official@gmail.com',
      action: 'EXPORT',
      submenu: currentTabInfo.label,
      submenuKey: activeTab,
      entityName: activeCompany?.company_name || 'AC Signica BSS Inc.',
      details: `Full XLSX Spreadsheet generated and archived with MD5 checksum verification.`,
      oldValue: 'Unexported draft',
      newValue: 'Workbook exported: .xlsx multi-sheet package',
      status: 'RECORDED'
    }
  ];

  const activeLogItem = selectedLog || mockAuditLogs[0];

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch = searchQuery === '' || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const modalBg = isNeon
    ? 'bg-white text-slate-900 border-sky-300'
    : themeMode === 'clean'
    ? 'bg-white text-zinc-900 border-zinc-200'
    : 'bg-[#141418] text-zinc-100 border-[#25252d]';

  const cardBg = isNeon
    ? 'bg-sky-50/50 border-sky-200'
    : themeMode === 'clean'
    ? 'bg-zinc-50 border-zinc-200'
    : 'bg-[#1a1a20] border-[#292933]';

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">CREATED</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">MODIFIED</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">DELETED</span>;
      case 'VALIDATE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">AUDITED</span>;
      case 'EXPORT':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">EXPORTED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-100 text-zinc-800">LOG</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${modalBg} overflow-hidden transition-all duration-200`}>
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isNeon 
                ? 'logo-chromatic-light text-white font-bold' 
                : themeMode === 'clean' 
                ? 'bg-zinc-100 text-zinc-900' 
                : 'logo-chromatic text-white'
            }`}>
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">AUDIT TRAIL & EDIT HISTORY</h2>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded text-white ${
                  isNeon ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500' : 'bg-cyan-600'
                }`}>
                  LIVE LOG
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span>Selected Sub-Menu:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{currentTabInfo.label}</span>
                <span>•</span>
                <span>Entity:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeCompany?.company_name || 'Active Company'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & FILTER STRIP */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/5 gap-3 bg-black/2 dark:bg-white/2 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search audit trail by user, action, details or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px] font-medium mr-1">Action:</span>
            {['ALL', 'CREATE', 'UPDATE', 'VALIDATE', 'EXPORT'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  filterAction === act 
                    ? (isNeon ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xs' : themeMode === 'clean' ? 'bg-zinc-900 text-white' : 'bg-cyan-500 text-slate-950') 
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL BODY (LEFT: LOG LIST, RIGHT: PREVIEW PANEL) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-black/10 dark:divide-white/10">
          
          {/* LEFT LIST: AUDIT HISTORY TIMELINE (5 cols) */}
          <div className="md:col-span-5 p-4 overflow-y-auto max-h-[50vh] md:max-h-[60vh] space-y-2">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Change Events ({filteredLogs.length})</span>
              <span className={`text-[10px] font-semibold ${isNeon ? 'text-cyan-600 font-bold' : themeMode === 'clean' ? 'text-violet-700 font-bold' : 'text-cyan-400'}`}>PFRS Audited</span>
            </div>

            {filteredLogs.map((log) => {
              const isSelected = activeLogItem?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? (isNeon ? 'bg-sky-50 border-sky-300 shadow-xs ring-1 ring-cyan-400' : themeMode === 'clean' ? 'bg-zinc-100 border-zinc-300 shadow-xs' : 'bg-[#0D1E45] border-cyan-500/40 shadow-xs')
                      : `${cardBg} hover:border-zinc-300 dark:hover:border-zinc-700`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-zinc-500">{log.id}</span>
                    {getActionBadge(log.action)}
                  </div>
                  <p className="font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1 mb-1">
                    {log.details}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp.split(' ')[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT PANEL: SELECTED LOG DIFF & PREVIEW (7 cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto max-h-[50vh] md:max-h-[60vh] space-y-4">
            {activeLogItem ? (
              <div className="space-y-4">
                
                {/* Header of Active Log */}
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">{activeLogItem.id}</span>
                      {getActionBadge(activeLogItem.action)}
                    </div>
                    <span className="text-xs font-mono text-zinc-500">{activeLogItem.timestamp}</span>
                  </div>

                  <h3 className="font-black text-sm text-zinc-900 dark:text-white mb-2">
                    {activeLogItem.details}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Operator</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeLogItem.user}</span>
                      <span className="text-[10px] text-zinc-500 block">{activeLogItem.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Compliance Status</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                        isNeon ? 'text-cyan-600' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {activeLogItem.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL DIFF PREVIEW (BEFORE VS AFTER) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      Visual State Diff & Value Comparison
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Old Value (Red) */}
                    <div className="p-3.5 rounded-xl border border-red-200/80 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-xs">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1.5">
                        Previous State / Before
                      </span>
                      <p className="font-mono text-[11px] text-red-950 dark:text-red-200 break-words">
                        {activeLogItem.oldValue || 'None'}
                      </p>
                    </div>

                    {/* New Value (Cyan / Blue / Violet) */}
                    <div className={`p-3.5 rounded-xl border text-xs ${
                      isNeon 
                        ? 'border-cyan-200 bg-cyan-50/60' 
                        : themeMode === 'clean' 
                        ? 'border-violet-200 bg-violet-50/50' 
                        : 'border-cyan-500/40 bg-cyan-950/20'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                        isNeon ? 'text-cyan-700' : themeMode === 'clean' ? 'text-violet-700' : 'text-cyan-400'
                      }`}>
                        New State / Reconciled
                      </span>
                      <p className={`font-mono text-[11px] break-words ${
                        isNeon ? 'text-cyan-950' : themeMode === 'clean' ? 'text-violet-950' : 'text-cyan-200'
                      }`}>
                        {activeLogItem.newValue || 'Updated'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submenu Snapshot info */}
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${cardBg}`}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      Module: <strong className="text-zinc-900 dark:text-white">{activeLogItem.submenu}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    2OS Audit Signature #0x8F91
                  </span>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                Select a log item from the list to preview diff
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <CheckCircle2 className={`w-4 h-4 ${isNeon ? 'text-cyan-500' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'}`} />
            <span>Immutable audit history recorded in real-time</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
            >
              Print Trail
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                isNeon 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white' 
                  : themeMode === 'clean' 
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              Close History
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
