import React from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  FileCheck, 
  CheckCircle2, 
  Sparkles, 
  Scale, 
  Users, 
  Compass, 
  LifeBuoy,
  Building2,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';

interface AboutAppTabProps {
  theme?: any;
}

export default function AboutAppTab({ theme }: AboutAppTabProps) {
  const isLight = theme?.isLight ?? false;
  const bgCard = theme?.bgCard || 'bg-[#18181b]';
  const borderCard = theme?.borderCard || 'border-zinc-800';
  const textTitle = theme?.textTitle || 'text-white';
  const textMuted = theme?.textMuted || 'text-zinc-400';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* HERO BANNER & CREED */}
      <div className={`p-8 rounded-2xl border ${borderCard} ${bgCard} relative overflow-hidden shadow-xl`}>
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Bridge & The Foundation of Business Accounting</span>
              </div>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${textTitle} flex items-center gap-3`}>
                <span className="text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-xl shadow-inner">2OS</span>
                <span>Accounting System</span>
              </h1>
              <p className={`text-base ${textMuted} leading-relaxed`}>
                An ultra-affordable accounting platform engineered to aid <strong>micro businesses to large enterprises</strong> monitor, analyze, and better understand their business accounting.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs text-cyan-400/80 font-mono font-semibold uppercase tracking-wider">Root Word</div>
                <div className={`text-lg font-bold font-mono ${textTitle}`}>Tuos • Pagtutuos</div>
                <div className={`text-xs ${textMuted}`}>Tagalog for "to calculate & reconcile"</div>
              </div>
            </div>
          </div>

          {/* CREED QUOTE BLOCK */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#0c1b3d]/40 to-blue-950/40 border border-cyan-500/30">
            <p className="text-amber-300 font-serif italic text-base sm:text-lg text-center font-bold">
              "Because every progress is always supported by a strong foundation, and 2OS will not only be the bridge but also the foundation."
            </p>
          </div>
        </div>
      </div>

      {/* 2OS ACRONYM & PHILIPPINE HERITAGE BREAKDOWN */}
      <div>
        <h2 className={`text-xl font-bold ${textTitle} mb-4 flex items-center gap-2`}>
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Decoding 2OS: Root Word & Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ROOT: TUOS */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-cyan-500/40 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wider">Filipino Etymology</div>
              <h3 className={`text-lg font-black ${textTitle} mt-0.5`}>
                "TUOS" (Accounting)
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Derived directly from the Filipino word <strong>"Tuos"</strong> (pagtutuos), which signifies computing, reconciling, and settling accounts with absolute honesty and transparency. Brings cultural resonance and clarity to business finances.
            </p>
          </div>

          {/* 2OS: 2-PARTIES ORIENTED & SYNCHRONIZED */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-blue-500/40 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-blue-400 font-mono font-bold uppercase tracking-wider">Bilateral Synchronization</div>
              <h3 className={`text-lg font-black ${textTitle} mt-0.5`}>
                2-Parties O-riented & S-ynchronized
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Synchronizes <strong>Internal Parties</strong> (owners, management, in-house accountants, employees) and <strong>External Parties</strong> (BIR, banks, clients, suppliers, external auditors) so everyone sees one immutable, verifiable truth.
            </p>
          </div>

          {/* THE BRIDGE & THE FOUNDATION */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-emerald-500/40 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider">Dual Role</div>
              <h3 className={`text-lg font-black ${textTitle} mt-0.5`}>
                The Bridge & The Foundation
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              <strong>The Bridge:</strong> Delivers simplicity, visual convenience, and zero fear between users and their accounting.<br />
              <strong>The Foundation:</strong> Delivers strict double-entry balancing, PFRS financial statements, and BIR regulatory compliance.
            </p>
          </div>
        </div>
      </div>

      {/* INTERNAL VS EXTERNAL PARTIES SYNCHRONIZATION DIAGRAM */}
      <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${textTitle} flex items-center gap-2`}>
            <Users className="w-5 h-5 text-cyan-400" />
            <span>How 2OS Synchronizes Your Business Ecosystem</span>
          </h2>
          <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
            Micro to Enterprise
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
            <div className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
              <span>1. Internal Parties</span>
            </div>
            <ul className={`space-y-1.5 ${textMuted}`}>
              <li>• <strong>Founders & Owners:</strong> Executive KPIs and profit visibility</li>
              <li>• <strong>Bookkeepers & Staff:</strong> Rapid journal entry and auto-ledgers</li>
              <li>• <strong>Employees:</strong> Accurate payroll & BIR 2316 withholding slips</li>
              <li>• <strong>Operations:</strong> Real-time expenses and cost tracking</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 flex flex-col justify-center text-center">
            <div className="font-bold text-amber-400 text-sm">
              The 2OS Nexus
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Continuous automated double-entry verification ensures internal books immediately match external tax returns and invoices.
            </p>
            <div className="text-[11px] font-mono font-bold text-cyan-400 mt-2">
              ZERO DISCREPANCIES
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              <span>2. External Parties</span>
            </div>
            <ul className={`space-y-1.5 ${textMuted}`}>
              <li>• <strong>BIR Tax Authority:</strong> Ready 2307, SLSP, SAWT, QAP forms</li>
              <li>• <strong>Banks & Lenders:</strong> Certified PFRS Financial Statements</li>
              <li>• <strong>Suppliers & Vendors:</strong> Auditable Accounts Payable</li>
              <li>• <strong>External CPAs:</strong> Clean, synchronized audit working papers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CORE MODULES OVERVIEW */}
      <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-6 shadow-sm`}>
        <h2 className={`text-xl font-bold ${textTitle} flex items-center gap-2`}>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Core 2OS System Modules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-500/5 border border-zinc-700/20 space-y-2">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              1. Books of Accounts
            </div>
            <p className={textMuted}>
              Sales, Purchases, Cash Receipts, Cash Disbursements, Special Vouchers, and General Ledger T-Accounts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-500/5 border border-zinc-700/20 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              2. Payroll & 2316 Sync
            </div>
            <p className={textMuted}>
              Auto-calculates SSS, PhilHealth, Pag-IBIG & withholding tax. Syncs directly into BIR Form 2316.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-500/5 border border-zinc-700/20 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              3. BIR Tax Compliance
            </div>
            <p className={textMuted}>
              BIR 2307 certificates, SLSP, QAP, SAWT, and interactive BIR Tax Calendar with compliance deadlines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-500/5 border border-zinc-700/20 space-y-2">
            <div className="font-bold text-purple-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              4. PFRS Financial Statements
            </div>
            <p className={textMuted}>
              Statement of Financial Position, P&L Income Statement, Changes in Equity, Cash Flows, and Notes.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER ACKNOWLEDGEMENT */}
      <div className="text-center space-y-1 pt-4">
        <p className={`text-xs ${textMuted}`}>
          <strong>2OS Accounting System</strong> • The Bridge & Foundation of Business Accounting
        </p>
        <p className="text-[11px] text-zinc-500 font-mono">
          Strictly compliant with BIR Regulations (EOPT, TRAIN Law, RA 9504) and Philippine Financial Reporting Standards (PFRS).
        </p>
      </div>
    </div>
  );
}

