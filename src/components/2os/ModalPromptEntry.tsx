import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Receipt, 
  Coins, 
  DollarSign, 
  BookOpen, 
  Users, 
  Building2, 
  Calculator, 
  Layers, 
  Sparkles,
  Paperclip,
  FileCheck,
  FileSpreadsheet,
  FileCode,
  FileCheck2,
  Calendar,
  BookMarked
} from 'lucide-react';
import { Company } from '../../types';
import { getTabInfo } from './2osTypes';

interface ModalPromptEntryProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  activeCompany: Company | null;
  onSelectTab: (tabKey: string) => void;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  themeMode: 'neon_light' | 'clean' | 'dark';
}

export default function ModalPromptEntry({
  isOpen,
  onClose,
  activeTab,
  activeCompany,
  onSelectTab,
  triggerAlert,
  themeMode
}: ModalPromptEntryProps) {
  if (!isOpen) return null;

  const currentTabInfo = getTabInfo(activeTab);

  const entryTypes = [
    {
      key: 'sales',
      title: 'Sales Invoice / Revenue',
      category: 'Books of Accounts',
      icon: Receipt,
      desc: 'Record a new sales invoice, VAT breakdown, and accounts receivable entry.'
    },
    {
      key: 'collections',
      title: 'Collection Receipt / Cash In',
      category: 'Books of Accounts',
      icon: Coins,
      desc: 'Record official receipt collections, 2307 CWT withholding, and bank deposit.'
    },
    {
      key: 'expenses',
      title: 'Vendor Bill / Purchases',
      category: 'Books of Accounts',
      icon: DollarSign,
      desc: 'Record supplier invoice, input VAT, and accounts payable obligation.'
    },
    {
      key: 'payments',
      title: 'Check / Cash Disbursement',
      category: 'Books of Accounts',
      icon: Calculator,
      desc: 'Record payment check voucher, withholding tax remittance, and AP settlement.'
    },
    {
      key: 'general_journal',
      title: 'Journal Voucher (JV)',
      category: 'Books of Accounts',
      icon: BookOpen,
      desc: 'Record multi-line adjusting, closing, or reclassification journal entries.'
    },
    {
      key: 'cwt_customers',
      title: 'BIR Form 2307 (from Customers)',
      category: 'BIR Attachments',
      icon: FileCheck,
      desc: 'Claim creditable withholding tax certificates received from client payments.'
    },
    {
      key: 'cwt_providers',
      title: 'BIR Form 2307 (for Providers)',
      category: 'BIR Attachments',
      icon: FileCheck2,
      desc: 'Generate creditable withholding tax certificates issued to vendors and payees.'
    },
    {
      key: 'bir_slsp',
      title: 'SLSP (Summary List of Sales/Purchases)',
      category: 'BIR Attachments',
      icon: FileSpreadsheet,
      desc: 'Quarterly VAT reconciliation schedules for sales and purchase ledgers.'
    },
    {
      key: 'bir_qap',
      title: 'QAP (Quarterly Alphalist of Payees)',
      category: 'BIR Attachments',
      icon: FileCode,
      desc: 'Consolidated alphalist of withholding payees attached to Form 1601-EQ.'
    },
    {
      key: 'bir_sawt',
      title: 'SAWT (Summary Alphalist Withholding)',
      category: 'BIR Attachments',
      icon: Paperclip,
      desc: 'Schedule of tax credits claimed for attachment to BIR Form 1701/1702.'
    },
    {
      key: 'related_parties',
      title: 'Related Parties Masterlist',
      category: 'Directory',
      icon: Users,
      desc: 'Register a new customer entity, supplier, or professional service provider.'
    },
    {
      key: 'companies',
      title: 'Company Entity Profile',
      category: 'Directory',
      icon: Building2,
      desc: 'Register or update company details, branches, TIN, RDO, and VAT classification.'
    },
    {
      key: 'account_titles',
      title: 'Chart of Accounts (COA)',
      category: 'Directory',
      icon: BookMarked,
      desc: 'Set up master account codes, balance types, and view real-time account balances.'
    },
    {
      key: 'tax_calendar',
      title: 'BIR Tax Calendar & Deadlines',
      category: 'Directory',
      icon: Calendar,
      desc: 'Review upcoming Philippine tax filing schedules, BIR forms, and compliance dates.'
    },
    {
      key: 'special_entries',
      title: 'Special / Complex Entry',
      category: 'Books of Accounts',
      icon: Layers,
      desc: 'Foreign currency revaluation, bad debt provision, or year-end accruals.'
    }
  ];

  const isLight = themeMode !== 'dark';
  const isNeon = themeMode === 'neon_light';

  const modalBg = isNeon
    ? 'bg-white text-slate-900 border-sky-300'
    : themeMode === 'clean'
    ? 'bg-white text-zinc-900 border-zinc-300'
    : 'bg-[#141418] text-zinc-100 border-[#2b2b35]';

  const cardBg = isNeon
    ? 'bg-white hover:bg-sky-50/80 border-sky-200 hover:border-cyan-500 shadow-xs text-slate-900'
    : themeMode === 'clean'
    ? 'bg-white hover:bg-zinc-100 border-zinc-200 hover:border-zinc-400 shadow-xs text-zinc-900'
    : 'bg-[#1c1c24] hover:bg-[#23232e] border-[#2c2c38] hover:border-cyan-500/50 text-zinc-100';

  const titleColor = isLight ? 'text-slate-900' : 'text-white';
  const descColor = isLight ? 'text-slate-600' : 'text-zinc-400';
  const categoryColor = isNeon
    ? 'text-cyan-700 font-bold'
    : isLight
    ? 'text-violet-700 font-bold'
    : 'text-cyan-400 font-mono';

  const handleLaunch = (key: string, title: string) => {
    onSelectTab(key);
    onClose();
    triggerAlert(`Opened modal entry workspace for ${title}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${modalBg} overflow-hidden transition-all duration-200`}>
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isNeon 
                ? 'logo-chromatic-light text-white font-bold' 
                : themeMode === 'clean' 
                ? 'bg-zinc-900 text-white' 
                : 'logo-chromatic text-white'
            } shadow-xs`}>
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-black tracking-tight ${titleColor}`}>MODAL PROMPTS — ADD NEW ENTRY</h2>
                <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded text-white ${
                  isNeon ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500' : 'bg-cyan-600'
                }`}>
                  FAST ENTRY
                </span>
              </div>
              <p className={`text-xs ${descColor} mt-0.5`}>
                Select transaction type to initialize double-entry modal voucher for <strong className={`${titleColor}`}>{activeCompany?.company_name || 'Active Entity'}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE SUBMENU DIRECT QUICK-ADD SHORTCUT */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-xs ${
          isNeon
            ? 'bg-sky-50/90 border-sky-200'
            : themeMode === 'clean'
            ? 'bg-violet-50/60 border-violet-200'
            : 'bg-[#091533] border-[#14264F]'
        }`}>
          <div className={`flex items-center gap-2 font-bold ${
            isNeon ? 'text-sky-950' : themeMode === 'clean' ? 'text-violet-950' : 'text-cyan-200'
          }`}>
            <Sparkles className={`w-4 h-4 ${isNeon ? 'text-cyan-500' : themeMode === 'clean' ? 'text-violet-600' : 'text-cyan-400'}`} />
            <span>Currently on Submenu: <span className={`underline underline-offset-2 ${isNeon ? 'decoration-cyan-500 font-black' : 'decoration-violet-500'}`}>{currentTabInfo.label}</span></span>
          </div>

          <button
            onClick={() => handleLaunch(activeTab, currentTabInfo.label)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition text-white shadow-xs ${
              isNeon 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                : themeMode === 'clean'
                ? 'bg-violet-700 hover:bg-violet-800'
                : 'bg-[#0D214D] hover:bg-[#142D66] border border-cyan-400 text-cyan-300'
            }`}
          >
            + Add to {currentTabInfo.shortLabel}
          </button>
        </div>

        {/* GRID OF MODAL ENTRY OPTIONS */}
        <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/30 dark:bg-transparent">
          {entryTypes.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.key;

            // Chromatic cycle for neon light: cyan, blue, violet, red, yellow
            const chromaticAccents = [
              { bg: 'bg-cyan-100 text-cyan-800', border: 'border-cyan-300' },
              { bg: 'bg-blue-100 text-blue-800', border: 'border-blue-300' },
              { bg: 'bg-violet-100 text-violet-800', border: 'border-violet-300' },
              { bg: 'bg-rose-100 text-rose-800', border: 'border-rose-300' },
              { bg: 'bg-amber-100 text-amber-900', border: 'border-amber-300' },
            ];
            const chromatic = chromaticAccents[idx % chromaticAccents.length];

            return (
              <div
                key={item.key}
                onClick={() => handleLaunch(item.key, item.title)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 ${cardBg} ${
                  isCurrent 
                    ? (isNeon ? 'ring-2 ring-cyan-500 border-cyan-400' : themeMode === 'clean' ? 'ring-2 ring-violet-600 border-violet-500' : 'ring-2 ring-cyan-400 border-cyan-400')
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${
                      isNeon 
                        ? `${chromatic.bg} ${chromatic.border} border font-bold` 
                        : themeMode === 'clean'
                        ? 'bg-zinc-100 text-zinc-800'
                        : 'bg-[#0D1E45] text-cyan-300 border border-cyan-500/30'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${categoryColor}`}>
                      {item.category}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white shadow-2xs ${
                      isNeon ? 'bg-cyan-600' : themeMode === 'clean' ? 'bg-violet-700' : 'bg-cyan-500 text-slate-950'
                    }`}>
                      Active
                    </span>
                  )}
                </div>

                <h3 className={`font-black text-sm mb-1 ${titleColor}`}>
                  {item.title}
                </h3>
                <p className={`text-xs leading-relaxed ${descColor}`}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end bg-slate-100 dark:bg-black/40">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
