import React, { useState, useMemo } from 'react';
import { FileCheck2, Download, Eye, FileText, CheckCircle2, AlertCircle, Copy, HelpCircle } from 'lucide-react';
import { Sale, Collection, Company } from '../types';
import { 
  parseSawtRecords, 
  generateSawtDatContent, 
  getSawtFileName, 
  SawtRecord 
} from '../utils/sawtGenerator';

interface SAWTTabProps {
  sales: Sale[];
  collections: Collection[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SAWTTab({ sales, collections, activeCompany, theme, triggerAlert }: SAWTTabProps) {
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [year, setYear] = useState('2026');
  const [selectedForm, setSelectedForm] = useState<'1701Q' | '1702Q' | '2550Q' | '1702RT'>('1702Q');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Parse and filter valid SAWT claims
  const sawtRecords: SawtRecord[] = useMemo(() => {
    return parseSawtRecords(sales);
  }, [sales]);

  const totalBase = useMemo(() => sawtRecords.reduce((sum, r) => sum + r.taxBase, 0), [sawtRecords]);
  const totalWithheld = useMemo(() => sawtRecords.reduce((sum, r) => sum + r.taxWithheld, 0), [sawtRecords]);

  const datContent = useMemo(() => {
    return generateSawtDatContent(selectedForm, activeCompany, sawtRecords, quarter, year);
  }, [selectedForm, activeCompany, sawtRecords, quarter, year]);

  const datFileName = useMemo(() => {
    return getSawtFileName(activeCompany, selectedForm, quarter, year);
  }, [activeCompany, selectedForm, quarter, year]);

  const handleDownloadDAT = () => {
    if (sawtRecords.length === 0) {
      if (triggerAlert) {
        triggerAlert('Cannot generate SAWT .DAT: No creditable withholding tax (BIR 2307) claims recorded on sales.', 'error');
      }
      return;
    }

    const blob = new Blob([datContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = datFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (triggerAlert) {
      triggerAlert(`Downloaded BIR-compliant SAWT attachment file: ${datFileName}`, 'success');
    }
  };

  const handleCopyDat = () => {
    navigator.clipboard.writeText(datContent);
    if (triggerAlert) {
      triggerAlert('SAWT .DAT content copied to clipboard!', 'success');
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP CONTROL BAR */}
      <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${theme.textTitle} flex items-center gap-2`}>
                <span>Summary Alphalist of Withholding Tax (SAWT)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  BIR RR 2-2006 Compliant
                </span>
              </h2>
              <p className={`text-xs ${theme.textMuted}`}>
                Generates statutory .DAT files for BIR eSubmission portal accompanying quarterly and annual tax returns.
              </p>
            </div>
          </div>

          {/* Action buttons and filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">Return:</span>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value as any)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer ${theme.borderInput} ${theme.textMain} ${theme.bgInput}`}
              >
                <option value="1702Q">Form 1702Q (Corp Income Tax)</option>
                <option value="1701Q">Form 1701Q (Indiv Income Tax)</option>
                <option value="2550Q">Form 2550Q (Quarterly VAT)</option>
                <option value="1702RT">Form 1702-RT (Annual Corp)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">Period:</span>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as any)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer ${theme.borderInput} ${theme.textMain} ${theme.bgInput}`}
              >
                <option value="Q1">Q1 (Jan - Mar)</option>
                <option value="Q2">Q2 (Apr - Jun)</option>
                <option value="Q3">Q3 (Jul - Sep)</option>
                <option value="Q4">Q4 (Oct - Dec)</option>
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={`text-xs px-2 py-1.5 rounded-lg border font-bold cursor-pointer ${theme.borderInput} ${theme.textMain} ${theme.bgInput}`}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <button
              onClick={() => setShowPreviewModal(true)}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${theme.borderCard} hover:bg-zinc-500/10 ${theme.textMain}`}
              title="Inspect raw .DAT text formatting"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              Preview DAT
            </button>

            <button
              onClick={handleDownloadDAT}
              className={`py-1.5 px-4 text-xs font-bold rounded-lg text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500`}
            >
              <Download className="w-4 h-4" />
              Download SAWT .DAT
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Payors with Withheld Tax
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-mono ${theme.textTitle}`}>
              {sawtRecords.length} Customers
            </span>
            <span className="text-xs text-zinc-400">Claims for {selectedForm}</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Total Income Base (Gross Sales)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">
              ₱{totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-zinc-400">Vatable / Base</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-xs`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Creditable Tax Claimed (CWT 2307)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              ₱{totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-500/80 font-semibold">Deductible from Tax Due</span>
          </div>
        </div>
      </div>

      {/* 3. SAWT DATA TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5 flex flex-wrap items-center justify-between gap-2`}>
          <div>
            <h3 className={`font-semibold text-sm ${theme.textTitle}`}>
              Summary Alphalist of Withholding Tax ({sawtRecords.length} Records)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Target File: <span className="font-mono text-emerald-400 font-bold">{datFileName}</span>
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20">
            eSubmission Standard Format
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Payor Registered TIN</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Withholding Agent / Customer</th>
                <th className="p-3">ATC</th>
                <th className="p-3 text-right">Income Payment Base</th>
                <th className="p-3 text-right">Creditable Tax Withheld</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {sawtRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400 opacity-60" />
                    <p className="font-semibold text-sm">No creditable withholding tax claims recorded for SAWT.</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Add Sales Invoices with Form 2307 Withholding Tax deducted by customers to populate this schedule.
                    </p>
                  </td>
                </tr>
              ) : (
                sawtRecords.map((r, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 text-center font-mono text-zinc-400">{r.seqNo}</td>
                    <td className="p-3 font-mono text-zinc-300 font-semibold">{r.payorTin}</td>
                    <td className="p-3 font-mono text-zinc-400">{r.payorBranch}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.payorName}</td>
                    <td className="p-3 font-mono text-amber-400 font-bold">{r.atcCode}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">
                      ₱{r.taxBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sawtRecords.length > 0 && (
              <tfoot>
                <tr className={`border-t-2 ${theme.borderCard} bg-zinc-500/10 font-bold`}>
                  <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-xs">
                    Total Declared in Return:
                  </td>
                  <td className="p-3 text-right font-mono text-cyan-400">
                    ₱{totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-400 font-extrabold text-sm">
                    ₱{totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 4. PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>BIR SAWT Raw .DAT File Preview</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Filename: {datFileName}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/90 p-3.5 rounded-xl border border-zinc-800 font-mono text-xs overflow-x-auto max-h-72 select-all text-emerald-400 whitespace-pre">
              {datContent}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
              <span>Lines: {sawtRecords.length + 2} (1 Header + {sawtRecords.length} Detail + 1 Control)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDat}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>
                <button
                  onClick={handleDownloadDAT}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .DAT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
