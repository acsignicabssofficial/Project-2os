import React from 'react';
import { Calculator, ShieldCheck, Layers, BookOpen, FileCheck, CheckCircle2, Sparkles, Scale, Users, Compass, LifeBuoy } from 'lucide-react';

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
      {/* HERO BANNER */}
      <div className={`p-8 rounded-2xl border ${borderCard} ${bgCard} relative overflow-hidden shadow-xl`}>
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official System Architecture</span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textTitle} flex items-center gap-3`}>
              <span className="text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-xl shadow-inner">2OS</span>
              <span>Accounting System</span>
            </h1>
            <p className={`text-sm ${textMuted} leading-relaxed`}>
              The complete Philippine double-entry bookkeeping and BIR/PFRS tax compliance engine. Built for absolute precision, bilateral clarity, and continuous financial alignment.
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
      </div>

      {/* 2OS ACRONYM BREAKDOWN GRID */}
      <div>
        <h2 className={`text-xl font-bold ${textTitle} mb-4 flex items-center gap-2`}>
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Decoding the 2OS Framework</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 2: 2 PARTIES */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-cyan-500/30 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono text-xl">
              2
            </div>
            <div>
              <div className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wider">First Pillar</div>
              <h3 className={`text-lg font-bold ${textTitle} flex items-center gap-2 mt-0.5`}>
                <Users className="w-4 h-4 text-cyan-400" />
                2 Parties
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Focuses on <strong>bilateral clarity</strong> between the two contracting parties in every financial transaction — Buyer & Seller, Employer & Employee, Taxpayer & Bureau of Internal Revenue (BIR). Eliminates discrepancy between accounts.
            </p>
          </div>

          {/* O: ORIENT */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-indigo-500/30 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold font-mono text-xl">
              O
            </div>
            <div>
              <div className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-wider">Second Pillar</div>
              <h3 className={`text-lg font-bold ${textTitle} flex items-center gap-2 mt-0.5`}>
                <Compass className="w-4 h-4 text-indigo-400" />
                Orient
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Aligns and orientates all financial records with standard Account Titles, double-entry General Ledgers, T-Accounts, BIR Tax Calendars, and PFRS-compliant Financial Statements with zero ledger imbalance.
            </p>
          </div>

          {/* S: SUPPORT */}
          <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-4 hover:border-emerald-500/30 transition shadow-sm`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono text-xl">
              S
            </div>
            <div>
              <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider">Third Pillar</div>
              <h3 className={`text-lg font-bold ${textTitle} flex items-center gap-2 mt-0.5`}>
                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                Support
              </h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Provides total computational support for automated payroll registers, statutory deductions (SSS, PhilHealth, Pag-IBIG), BIR Forms (2316, 2307, SLSP, QAP, SAWT), PPE depreciation tables, and tax provisions.
            </p>
          </div>
        </div>
      </div>

      {/* CORE MODULES OVERVIEW */}
      <div className={`p-6 rounded-2xl border ${borderCard} ${bgCard} space-y-6 shadow-sm`}>
        <h2 className={`text-xl font-bold ${textTitle} flex items-center gap-2`}>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Core System Features</span>
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
          <strong>2OS Accounting System</strong> • Built for Philippine Corporate, Small Business, and Tax Accounting
        </p>
        <p className="text-[11px] text-zinc-500 font-mono">
          Strictly compliant with BIR Regulations (RA 9504, TRAIN Law, EOPT) and Philippine Financial Reporting Standards (PFRS).
        </p>
      </div>
    </div>
  );
}
