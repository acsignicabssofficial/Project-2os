import React from 'react';
import { FileCheck } from 'lucide-react';
import { Certificate2307, Sale, Collection, Company } from '../types';

interface CWTFromCustomersTabProps {
  certificates?: Certificate2307[];
  sales: Sale[];
  collections: Collection[];
  activeCompany: Company | null;
  theme: any;
}

export default function CWTFromCustomersTab({ certificates = [], sales = [], collections = [], activeCompany, theme }: CWTFromCustomersTabProps) {

  // Aggregate 2307 withheld by clients from sales & collections
  const cust2307List = sales.filter(s => s.withholding_2307 > 0).map(s => ({
    id: s.id,
    client: s.customer_name,
    tin: s.customer_tin,
    invNo: s.invoice_number,
    date: s.invoice_date,
    gross: s.invoice_amount,
    taxWithheld: s.withholding_2307,
    atc: 'WI010'
  }));

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <FileCheck className="w-6 h-6 text-cyan-400" />
          BIR Form 2307 Certificates Received from Customers
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Creditable withholding tax certificates issued by clients for sales transactions. These constitute prepaid income tax claimable in quarterly 1701Q/1702Q filings.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Creditable Tax Withheld Certificates Log ({cust2307List.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Client / Payor</th>
                <th className="p-3">Client TIN</th>
                <th className="p-3">Invoice Ref #</th>
                <th className="p-3">Date</th>
                <th className="p-3">ATC Code</th>
                <th className="p-3 text-right">Gross Amount</th>
                <th className="p-3 text-right">Creditable Tax Withheld</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {cust2307List.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No 2307 certificates received from customers recorded.
                  </td>
                </tr>
              ) : (
                cust2307List.map((c, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{c.client}</td>
                    <td className="p-3 font-mono text-zinc-400">{c.tin}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{c.invNo}</td>
                    <td className="p-3 font-mono text-zinc-300">{c.date}</td>
                    <td className="p-3 font-mono text-amber-400">{c.atc}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{c.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">₱{c.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
