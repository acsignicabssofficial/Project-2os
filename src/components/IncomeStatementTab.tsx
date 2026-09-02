import React, { useMemo } from 'react';
import { TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { Sale, Expense, PPEAsset, SpecialEntry, PayrollRecord, Company } from '../types';

interface IncomeStatementTabProps {
  sales: Sale[];
  expenses: Expense[];
  ppeAssets: PPEAsset[];
  specialEntries: SpecialEntry[];
  payrollRecords?: PayrollRecord[];
  activeCompany: Company | null;
  theme: any;
}

export default function IncomeStatementTab({
  sales,
  expenses,
  ppeAssets,
  specialEntries,
  payrollRecords = [],
  activeCompany,
  theme
}: IncomeStatementTabProps) {
  const activeCompanyName = activeCompany?.company_name || '';

  const isVat = activeCompany?.vat_or_non_vat !== 'NON-VATABLE';

  const incomeStatementData = useMemo(() => {
    const compSales = sales.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
    const compExp = expenses.filter(e => !activeCompanyName || e.company_name === activeCompanyName);
    const compPpe = ppeAssets.filter(p => !activeCompanyName || p.company_name === activeCompanyName);
    const compSpecial = specialEntries.filter(s => !activeCompanyName || s.company_name === activeCompanyName);
    const compPayroll = payrollRecords.filter(p => !activeCompanyName || p.company_name === activeCompanyName);

    // Gross Revenue (net of discounts)
    let grossRevenue = compSales.reduce((sum, s) => sum + (Number(s.vatable_sales) || 0) + (Number(s.zero_rated) || 0) + (Number(s.vat_exempt) || 0), 0);

    // Operating Expenses
    let operatingExpenses = compExp.reduce((sum, e) => sum + (e.nonvat_or_vat === 'VAT' ? (Number(e.vatable_expense) || 0) : (Number(e.nonvat_expense_amount || e.expense_invoice_amount || e.amount) || 0)) + (Number(e.zero_rated) || 0) + (Number(e.vat_exempt) || 0), 0);

    // Depreciation Expense from PPE
    const depreciationExpense = compPpe.reduce((sum, p) => sum + (Number(p.accumulated_depreciation) || 0), 0);
    operatingExpenses += depreciationExpense;

    // Payroll Expense
    const payrollExpense = compPayroll.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0);
    operatingExpenses += payrollExpense;

    // Special journal entries adjustments (excluding tax expense #7010)
    compSpecial.forEach(s => {
      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.account_code.startsWith('4')) {
          if (l.type === 'Credit') grossRevenue += amt;
          else grossRevenue -= amt;
        } else if ((l.account_code.startsWith('5') || l.account_code.startsWith('6')) && l.account_code !== '7010') {
          if (l.type === 'Debit') operatingExpenses += amt;
          else operatingExpenses -= amt;
        }
      });
    });

    const netIncomeBeforeTax = grossRevenue - operatingExpenses;

    // Provision for Income Tax Expense (Account #7010 or 20% estimated provision)
    let provisionForTax = 0;
    let hasManualTaxEntry = false;
    compSpecial.forEach(s => {
      s.lines.forEach(l => {
        if (l.account_code === '7010') {
          hasManualTaxEntry = true;
          if (l.type === 'Debit') provisionForTax += Number(l.amount) || 0;
          else provisionForTax -= Number(l.amount) || 0;
        }
      });
    });

    if (!hasManualTaxEntry && netIncomeBeforeTax > 0) {
      provisionForTax = Math.round(netIncomeBeforeTax * 0.20 * 100) / 100;
    }

    const netIncomeAfterTax = netIncomeBeforeTax - provisionForTax;

    return {
      grossRevenue,
      operatingExpenses,
      depreciationExpense,
      payrollExpense,
      netIncomeBeforeTax,
      provisionForTax,
      netIncomeAfterTax
    };
  }, [sales, expenses, ppeAssets, specialEntries, payrollRecords, activeCompanyName]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm p-5 transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-base font-bold ${theme.textTitle} font-display flex items-center gap-2`}>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Statement of Comprehensive Income (Income Statement)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Official financial report for <span className="text-cyan-400 font-bold">{activeCompanyName || 'Active Company'}</span> computing Net Income Before Tax & Provision for Income Tax.
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-mono text-right">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Net Income After Tax:</span>
            <span className="text-lg font-extrabold text-emerald-400">
              ₱{incomeStatementData.netIncomeAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto w-full`}>
        <div className="border-b border-zinc-800/40 pb-3 flex justify-between items-center">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textTitle}`}>
            Financial Performance Breakdown
          </h3>
          <span className="text-xs font-mono text-zinc-500">PFRS / BIR Compliant</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between p-2.5 rounded-lg bg-zinc-500/5">
            <span className="font-bold text-zinc-300">GROSS SALES / SERVICE REVENUE (#4010):</span>
            <span className="font-bold text-cyan-400">₱{incomeStatementData.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-lg bg-zinc-500/5 text-rose-400">
            <span className="font-bold">LESS: OPERATING EXPENSES (#6010):</span>
            <span className="font-bold">(₱{incomeStatementData.operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>

          <div className="flex justify-between pl-6 text-zinc-400 text-[11px]">
            <span>Including Depreciation Expense (#6020):</span>
            <span>₱{incomeStatementData.depreciationExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 font-bold text-sm text-cyan-300">
            <span>NET INCOME BEFORE INCOME TAX:</span>
            <span>₱{incomeStatementData.netIncomeBeforeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <div>
              <span className="font-bold block">LESS: PROVISION FOR INCOME TAX EXPENSE (#7010):</span>
              <span className="text-[10px] text-zinc-400 font-sans italic">Posted via Income Tax Tab special journal entry</span>
            </div>
            <span className="font-bold text-amber-300">
              (₱{incomeStatementData.provisionForTax.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </span>
          </div>

          <div className="flex justify-between p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-extrabold text-base text-emerald-300 mt-6">
            <span>NET INCOME AFTER TAX:</span>
            <span>₱{incomeStatementData.netIncomeAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
