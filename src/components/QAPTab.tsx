import React, { useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Layers } from 'lucide-react';
import { Expense, Payment, ServiceProvider, Company } from '../types';

interface QAPTabProps {
  expenses: Expense[];
  payments: Payment[];
  serviceProviders: ServiceProvider[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function QAPTab({
  expenses,
  payments,
  serviceProviders,
  activeCompany,
  theme,
  triggerAlert
}: QAPTabProps) {
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [year, setYear] = useState('2026');

  // Aggregate Quarterly Alphalist of Payees (QAP) data for Form 1601-EQ
  const qapRows = expenses.filter(e => e.withholding_2307_2306 > 0).map(e => ({
    id: e.id,
    tin: e.sp_tin,
    branch: '00000',
    payeeName: e.service_provider_name,
    atc: 'WC120',
    gross: e.expense_invoice_amount,
    taxRate: '1%',
    taxWithheld: e.withholding_2307_2306
  }));

  const totalGross = qapRows.reduce((sum, r) => sum + r.gross, 0);
  const totalTaxWithheld = qapRows.reduce((sum, r) => sum + r.taxWithheld, 0);

  const handleDownloadDAT = () => {
    const header = `H1601EQ,${activeCompany?.company_tin || '000000000000'},${year},${quarter}\n`;
    const details = qapRows.map(r => `D1601EQ,${r.tin},${r.branch},"${r.payeeName}",${r.atc},${r.gross.toFixed(2)},${r.taxWithheld.toFixed(2)}`).join('\n');
    const content = header + details;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QAP_${activeCompany?.company_tin}_${quarter}_${year}.DAT`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAlert(`Downloaded BIR QAP .DAT Attachment file for ${quarter} ${year}!`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
              Quarterly Alphalist of Payees (QAP) - BIR Form 1601-EQ
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Mandatory BIR attachment listing all vendors and payees subjected to Expanded Withholding Tax (EWT) for submission via BIR eSubmission tool.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as any)}
              className={`text-xs px-3 py-2 rounded-lg border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
            >
              <option value="Q1" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>1st Quarter (Jan - Mar)</option>
              <option value="Q2" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2nd Quarter (Apr - Jun)</option>
              <option value="Q3" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>3rd Quarter (Jul - Sep)</option>
              <option value="Q4" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>4th Quarter (Oct - Dec)</option>
            </select>

            <button
              onClick={handleDownloadDAT}
              className={`py-2 px-4 text-xs font-semibold rounded-lg text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm ${theme.accentBg}`}
            >
              <Download className="w-4 h-4" />
              Download BIR .DAT File
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Payees / Vendors Logged</span>
          <span className={`text-xl font-extrabold font-mono ${theme.textTitle}`}>{qapRows.length} Payees</span>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Gross Income Payment</span>
          <span className="text-xl font-extrabold font-mono text-cyan-400">₱{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.borderCard} ${theme.bgCard}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Expanded Tax Remitted</span>
          <span className="text-xl font-extrabold font-mono text-rose-400">₱{totalTaxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* QAP TABLE */}
      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5 flex items-center justify-between`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Quarterly Alphalist Schedule ({quarter} {year})</h3>
          <span className="text-[10px] font-mono text-zinc-400">BIR Form 1601-EQ Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Payee Registered TIN</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Registered Name of Service Provider</th>
                <th className="p-3">ATC Code</th>
                <th className="p-3 text-right">Gross Income Payment</th>
                <th className="p-3 text-right">Tax Rate</th>
                <th className="p-3 text-right">Expanded Tax Withheld</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {qapRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No payees subjected to withholding tax recorded for {quarter} {year}.
                  </td>
                </tr>
              ) : (
                qapRows.map((r, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono font-bold text-cyan-400">{r.tin}</td>
                    <td className="p-3 font-mono text-zinc-400">{r.branch}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{r.payeeName}</td>
                    <td className="p-3 font-mono text-amber-400 font-bold">{r.atc}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{r.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">{r.taxRate}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">₱{r.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
