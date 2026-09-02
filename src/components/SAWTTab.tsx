import React from 'react';
import { FileCheck2 } from 'lucide-react';
import { Sale, Collection, Company } from '../types';

interface SAWTTabProps {
  sales: Sale[];
  collections: Collection[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
}


export default function SAWTTab({ sales, collections, activeCompany, theme }: SAWTTabProps) {
  const sawtList = sales.filter(s => s.withholding_2307 > 0);

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <FileCheck2 className="w-6 h-6 text-cyan-400" />
          SAWT - Summary Alphalist of Withholding Tax (BIR Attachment)
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Mandatory attachment to BIR Form 1701Q/1702Q reporting creditable withholding taxes withheld by clients.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Summary Alphalist of Withholding Tax ({sawtList.length} Payors)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Payor TIN</th>
                <th className="p-3">Payor Registered Name</th>
                <th className="p-3">ATC Code</th>
                <th className="p-3 text-right">Income Base Amount</th>
                <th className="p-3 text-right">Creditable Tax Withheld</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {sawtList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No creditable withholding tax claims recorded for SAWT.
                  </td>
                </tr>
              ) : (
                sawtList.map((s, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono text-zinc-400">{s.customer_tin}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{s.customer_name}</td>
                    <td className="p-3 font-mono text-amber-400">WI010</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{s.vatable_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">₱{s.withholding_2307.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
