import React from 'react';
import { FileCheck } from 'lucide-react';
import { Certificate2307, Expense, Payment, Company } from '../types';

interface CWTForProvidersTabProps {
  certificates?: Certificate2307[];
  expenses: Expense[];
  payments: Payment[];
  activeCompany: Company | null;
  theme: any;
}

export default function CWTForProvidersTab({ certificates = [], expenses = [], payments = [], activeCompany, theme }: CWTForProvidersTabProps) {

  // Aggregate 2307 withheld for vendors/suppliers from expenses
  const provider2307List = expenses.filter(e => e.withholding_2307_2306 > 0).map(e => ({
    id: e.id,
    provider: e.service_provider_name,
    tin: e.sp_tin,
    voucherNo: e.voucher_number,
    date: e.expense_date,
    gross: e.expense_invoice_amount,
    taxWithheld: e.withholding_2307_2306,
    atc: 'WC120'
  }));

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <FileCheck className="w-6 h-6 text-cyan-400" />
          BIR Form 2307 Certificates Issued to Service Providers
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Certificates generated and issued to vendors/suppliers for expanded withholding tax deducted from expense vouchers. Remitted to BIR via monthly 0619-E.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5`}>
          <h3 className={`font-semibold text-sm ${theme.textTitle}`}>Expanded Tax Withheld Certificates Log ({provider2307List.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3">Vendor / Payee</th>
                <th className="p-3">Vendor TIN</th>
                <th className="p-3">Voucher Ref #</th>
                <th className="p-3">Date</th>
                <th className="p-3">ATC Code</th>
                <th className="p-3 text-right">Gross Amount</th>
                <th className="p-3 text-right">Expanded Tax Withheld</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {provider2307List.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No 2307 certificates issued to providers recorded.
                  </td>
                </tr>
              ) : (
                provider2307List.map((c, idx) => (
                  <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className={`p-3 font-semibold ${theme.textTitle}`}>{c.provider}</td>
                    <td className="p-3 font-mono text-zinc-400">{c.tin}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{c.voucherNo}</td>
                    <td className="p-3 font-mono text-zinc-300">{c.date}</td>
                    <td className="p-3 font-mono text-amber-400">{c.atc}</td>
                    <td className="p-3 text-right font-mono text-zinc-300">₱{c.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">₱{c.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
