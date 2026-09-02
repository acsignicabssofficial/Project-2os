import React, { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Sale, Expense, Company } from '../types';

interface SLSPTabProps {
  sales: Sale[];
  expenses: Expense[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
}


export default function SLSPTab({ sales, expenses, activeCompany, theme }: SLSPTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'purchases'>('sales');

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
              SLSP - Summary List of Sales & Purchases (BIR eSubmission)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Quarterly summary list required for VAT compliance under BIR RELIEF format.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-500/10 p-1.5 rounded-xl border border-zinc-700/20">
            <button
              onClick={() => setActiveSubTab('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeSubTab === 'sales' ? theme.accentBg + ' text-white' : theme.textMuted
              }`}
            >
              Summary List of Sales (SLS)
            </button>
            <button
              onClick={() => setActiveSubTab('purchases')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeSubTab === 'purchases' ? theme.accentBg + ' text-white' : theme.textMuted
              }`}
            >
              Summary List of Purchases (SLP)
            </button>
          </div>
        </div>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>
            {activeSubTab === 'sales' ? `SLS Schedule (${sales.length} Sales Transactions)` : `SLP Schedule (${expenses.length} Purchase Vouchers)`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'sales' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Customer TIN</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Inv #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Gross Sales</th>
                  <th className="p-3 text-right">Vatable Base</th>
                  <th className="p-3 text-right">Output VAT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {sales.map((s) => (
                  <tr key={s.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono text-zinc-400">{s.customer_tin}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{s.customer_name}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{s.invoice_number}</td>
                    <td className="p-3 font-mono text-zinc-300">{s.invoice_date}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{s.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">₱{s.vatable_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-teal-400 font-semibold">₱{s.output_vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Vendor TIN</th>
                  <th className="p-3">Vendor Name</th>
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Gross Purchase</th>
                  <th className="p-3 text-right">Vatable Base</th>
                  <th className="p-3 text-right">Input VAT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                {expenses.map((e) => (
                  <tr key={e.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3 font-mono text-zinc-400">{e.sp_tin}</td>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{e.service_provider_name}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{e.voucher_number}</td>
                    <td className="p-3 font-mono text-zinc-300">{e.expense_date}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{e.expense_invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">₱{e.vatable_expense_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-rose-400 font-semibold">₱{e.vat_input_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
