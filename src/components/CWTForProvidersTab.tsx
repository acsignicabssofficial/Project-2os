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
  const provider2307List = expenses
    .filter(e => (Number(e.withholding_2307_2306 ?? (e as any).tax_withheld ?? (e as any).amount_withheld_2307 ?? (e as any).less_withholding_tax) || 0) > 0)
    .map(e => {
      const taxWithheld = Number(e.withholding_2307_2306 ?? (e as any).tax_withheld ?? (e as any).amount_withheld_2307 ?? (e as any).less_withholding_tax) || 0;
      const gross = Number(e.expense_invoice_amount ?? (e as any).total_amount_vat_inclusive ?? (e as any).amount) || 0;
      const vatable = Number((e as any).vatable_amount ?? (e as any).vatable_expense) || (gross > 0 ? Math.round((gross / 1.12) * 100) / 100 : gross);
      const ratePct = vatable > 0 ? Math.round((taxWithheld / vatable) * 100) : 2;
      const atc = ratePct >= 5 ? 'WC157' : (ratePct >= 2 ? 'WC120' : 'WI010');

      return {
        id: e.id,
        provider: e.service_provider_name || (e as any).registered_name || 'Vendor',
        tin: e.sp_tin || (e as any).tin || '000-000-000-00000',
        voucherNo: e.voucher_number || e.invoice_number || `EXP-${e.id}`,
        date: e.expense_date || (e as any).date || '',
        gross: vatable || gross,
        taxWithheld,
        atc
      };
    });

  return (
    <div className="space-y-4">
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
