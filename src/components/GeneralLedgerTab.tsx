import React, { useState, useMemo } from 'react';
import { Book, Search, Filter } from 'lucide-react';
import { Sale, Collection, Expense, Payment, SpecialEntry, AccountTitle, Company, PPEAsset, PayrollRecord } from '../types';

interface GeneralLedgerTabProps {
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  specialEntries?: SpecialEntry[];
  accountTitles?: AccountTitle[];
  ppeAssets?: PPEAsset[];
  payrollRecords?: PayrollRecord[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
  globalSearch?: string;
}


export default function GeneralLedgerTab({
  sales,
  collections,
  expenses,
  payments,
  specialEntries = [],
  accountTitles = [],
  ppeAssets = [],
  payrollRecords = [],
  activeCompany,
  theme
}: GeneralLedgerTabProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [ledgerCategory, setLedgerCategory] = useState<'ALL' | 'GENERAL' | 'SPECIAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Default Chart of Accounts list if none provided
  const coaList = useMemo(() => {
    if (accountTitles.length > 0) return accountTitles;
    return [
      { code: '1010', title: 'Cash and Cash Equivalents', category: 'Current Assets', type: 'Asset' },
      { code: '1020', title: 'Accounts Receivable', category: 'Current Assets', type: 'Asset' },
      { code: '1030', title: 'Creditable Input VAT', category: 'Current Assets', type: 'Asset' },
      { code: '1040', title: 'Creditable Withholding Tax (2307)', category: 'Current Assets', type: 'Asset' },
      { code: '1510', title: 'Property, Plant & Equipment', category: 'Non-Current Assets', type: 'Asset' },
      { code: '1520', title: 'Accumulated Depreciation', category: 'Non-Current Assets', type: 'Asset' },
      { code: '2010', title: 'Accounts Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '2020', title: 'Output VAT Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '2030', title: 'Expanded Withholding Tax Payable', category: 'Current Liabilities', type: 'Liability' },
      { code: '3010', title: "Capital Stock / Owner's Equity", category: "Owner's Equity", type: 'Equity' },
      { code: '3020', title: 'Retained Earnings', category: "Owner's Equity", type: 'Equity' },
      { code: '4010', title: 'Sales Revenue', category: 'Revenue', type: 'Revenue' },
      { code: '6010', title: 'Depreciation Expense', category: 'Operating Expense', type: 'Expense' }
    ];
  }, [accountTitles]);

  // Aggregate postings by account title code
  const ledgerMap = useMemo(() => {
    const map: Record<string, {
      code: string;
      title: string;
      type: string;
      postings: Array<{
        date: string;
        ref: string;
        particulars: string;
        debit: number;
        credit: number;
        runningBalance: number;
        bookType: 'GENERAL' | 'SPECIAL';
      }>;
      totalDebit: number;
      totalCredit: number;
      netBalance: number;
    }> = {};

    // Initialize map
    coaList.forEach(a => {
      map[a.code] = {
        code: a.code,
        title: a.title,
        type: a.type,
        postings: [],
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0
      };
    });

    const addPosting = (
      code: string,
      title: string,
      date: string,
      ref: string,
      particulars: string,
      dr: number,
      cr: number,
      bookType: 'GENERAL' | 'SPECIAL' = 'GENERAL'
    ) => {
      if (!map[code]) {
        map[code] = {
          code,
          title,
          type: 'Asset',
          postings: [],
          totalDebit: 0,
          totalCredit: 0,
          netBalance: 0
        };
      }

      // Check ledgerCategory filter
      if (ledgerCategory !== 'ALL' && bookType !== ledgerCategory) {
        return;
      }

      map[code].postings.push({
        date,
        ref,
        particulars,
        debit: dr,
        credit: cr,
        runningBalance: 0,
        bookType
      });
      map[code].totalDebit += dr;
      map[code].totalCredit += cr;
    };

    // 1. Post Sales (SPECIAL LEDGER)
    sales.forEach(s => {
      const invAmt = Number(s.invoice_amount) || 0;
      const w2307 = Number(s.withholding_2307) || 0;
      const outVat = Number(s.output_vat) || 0;
      const date = s.invoice_date || '';

      if (s.sales_status === 'Paid') {
        addPosting('1010', 'Cash and Cash Equivalents', date, s.invoice_number, `Paid Sale #${s.invoice_number} - ${s.customer_name}`, Math.max(0, invAmt - w2307), 0, 'SPECIAL');
        if (w2307 > 0) addPosting('1040', 'Creditable Withholding Tax (2307)', date, s.invoice_number, `CWT Withheld #${s.invoice_number}`, w2307, 0, 'SPECIAL');
      } else {
        addPosting('1020', 'Accounts Receivable', date, s.invoice_number, `Uncollected Invoice #${s.invoice_number} - ${s.customer_name}`, invAmt, 0, 'SPECIAL');
      }

      addPosting('4010', 'Sales Revenue', date, s.invoice_number, `Sales Revenue #${s.invoice_number}`, 0, Math.max(0, invAmt - outVat), 'SPECIAL');
      if (outVat > 0) addPosting('2020', 'Output VAT Payable', date, s.invoice_number, `Output VAT #${s.invoice_number}`, 0, outVat, 'SPECIAL');
    });

    // 2. Post Collections (SPECIAL LEDGER)
    collections.forEach(c => {
      const date = c.collection_date || '';
      const amt = Number(c.amount_collected) || 0;
      const w2307 = Number(c.amount_withheld_2307) || 0;

      addPosting('1010', 'Cash and Cash Equivalents', date, c.invoice_number, `Collection Receipt - ${c.customer_name}`, amt, 0, 'SPECIAL');
      if (w2307 > 0) addPosting('1040', 'Creditable Withholding Tax (2307)', date, c.invoice_number, `2307 Received - ${c.customer_name}`, w2307, 0, 'SPECIAL');
      addPosting('1020', 'Accounts Receivable', date, c.invoice_number, `AR Settlement - ${c.customer_name}`, 0, amt + w2307, 'SPECIAL');
    });

    // 3. Post Expenses (SPECIAL LEDGER)
    expenses.forEach(e => {
      const expAmt = Number(e.expense_invoice_amount) || 0;
      const w2307 = Number(e.withholding_2307_2306) || 0;
      const inputVat = Number(e.vat_input_amount) || 0;
      const date = e.expense_date || '';

      const matched = coaList.find(a => a.title.toLowerCase() === e.expense_type.toLowerCase());
      const expCode = matched ? matched.code : '6100';

      addPosting(expCode, `Expense: ${e.expense_type}`, date, e.voucher_number, `Voucher #${e.voucher_number} - ${e.service_provider_name}`, Math.max(0, expAmt - inputVat), 0, 'SPECIAL');
      if (inputVat > 0) addPosting('1030', 'Creditable Input VAT', date, e.voucher_number, `Input VAT #${e.voucher_number}`, inputVat, 0, 'SPECIAL');

      if (e.expense_status === 'Paid') {
        addPosting('1010', 'Cash and Cash Equivalents', date, e.voucher_number, `Paid Expense #${e.voucher_number}`, 0, Math.max(0, expAmt - w2307), 'SPECIAL');
        if (w2307 > 0) addPosting('2030', 'Expanded Withholding Tax Payable', date, e.voucher_number, `EWT Payable #${e.voucher_number}`, 0, w2307, 'SPECIAL');
      } else {
        addPosting('2010', 'Accounts Payable', date, e.voucher_number, `AP Voucher #${e.voucher_number}`, 0, expAmt, 'SPECIAL');
      }
    });

    // 4. Post Payments (SPECIAL LEDGER)
    payments.forEach(p => {
      const date = p.payment_date || '';
      const amt = Number(p.amount_paid) || 0;
      const w2307 = Number(p.withholding_tax_2307) || 0;

      addPosting('2010', 'Accounts Payable', date, p.voucher_number, `AP Settlement - ${p.service_provider_name}`, amt + w2307, 0, 'SPECIAL');
      addPosting('1010', 'Cash and Cash Equivalents', date, p.voucher_number, `Disbursement - ${p.service_provider_name}`, 0, amt, 'SPECIAL');
      if (w2307 > 0) addPosting('2030', 'Expanded Withholding Tax Payable', date, p.voucher_number, `EWT Tax - ${p.service_provider_name}`, 0, w2307, 'SPECIAL');
    });

    // 5. Post PPE Depreciation (GENERAL LEDGER)
    ppeAssets.forEach(p => {
      const dep = Number(p.accumulated_depreciation) || 0;
      if (dep > 0) {
        const date = p.acquisition_date || new Date().toISOString().split('T')[0];
        addPosting('6080', 'Depreciation Expense', date, p.asset_code, `PPE Depreciation - ${p.asset_name}`, dep, 0, 'GENERAL');
        addPosting('1520', 'Accumulated Depreciation', date, p.asset_code, `PPE Accum. Dep. - ${p.asset_name}`, 0, dep, 'GENERAL');
      }
    });

    // 6. Post Payroll (GENERAL LEDGER)
    payrollRecords.forEach(pr => {
      const gross = Number(pr.gross_pay) || 0;
      const sssEE = Number(pr.sss_deduction) || 0;
      const phicEE = Number(pr.philhealth_deduction) || 0;
      const hdmfEE = Number(pr.pagibig_deduction) || 0;
      const taxEE = Number(pr.withholding_tax) || 0;
      const otherDed = Number(pr.other_deductions) || 0;
      const netPay = Number(pr.net_pay) || (gross - sssEE - phicEE - hdmfEE - taxEE - otherDed);

      const sssER = Math.round((Number(pr.basic_pay) || 0) * 0.095 * 100) / 100;
      const phicER = phicEE;
      const hdmfER = hdmfEE;
      const date = new Date().toISOString().split('T')[0];

      const empName = pr.full_name || pr.employee_name || pr.employee_id;
      const empIdStr = String(pr.employee_id || '');

      addPosting('6010', 'Salaries, Wages & Benefits', date, empIdStr, `Gross Salaries - ${empName}`, gross, 0, 'GENERAL');
      if (sssER > 0) addPosting('6015', 'Employer SSS Contribution Expense', date, empIdStr, `ER SSS Share - ${empName}`, sssER, 0, 'GENERAL');
      if (phicER > 0) addPosting('6016', 'Employer PhilHealth Contribution Expense', date, empIdStr, `ER PHIC Share - ${empName}`, phicER, 0, 'GENERAL');
      if (hdmfER > 0) addPosting('6017', 'Employer Pag-IBIG Contribution Expense', date, empIdStr, `ER HDMF Share - ${empName}`, hdmfER, 0, 'GENERAL');

      addPosting('1010', 'Cash and Cash Equivalents', date, empIdStr, `Net Payroll Paid - ${empName}`, 0, netPay, 'GENERAL');
      if (sssEE + sssER > 0) addPosting('2041', 'SSS Premium Payable', date, empIdStr, `SSS Contributions (EE+ER) - ${empName}`, 0, sssEE + sssER, 'GENERAL');
      if (phicEE + phicER > 0) addPosting('2042', 'PhilHealth Premium Payable', date, empIdStr, `PhilHealth Premiums (EE+ER) - ${empName}`, 0, phicEE + phicER, 'GENERAL');
      if (hdmfEE + hdmfER > 0) addPosting('2043', 'Pag-IBIG Premium Payable', date, empIdStr, `Pag-IBIG Contributions (EE+ER) - ${empName}`, 0, hdmfEE + hdmfER, 'GENERAL');
      if (taxEE > 0) addPosting('2035', 'Withholding Tax Payable - Compensation', date, empIdStr, `1601-C Tax Withheld - ${empName}`, 0, taxEE, 'GENERAL');
      if (otherDed > 0) addPosting('2050', 'Other Employee Payables & Deductions', date, empIdStr, `Other Deductions - ${empName}`, 0, otherDed, 'GENERAL');
    });

    // 7. Post Special & General Entries
    specialEntries.forEach(s => {
      const isSpecialType = ['Sales', 'Collection', 'Expense', 'Payment', 'Cancellation', 'Sales Voucher', 'Collection Voucher', 'Expense Voucher', 'Payment Voucher'].includes(s.entry_type);
      const entryBook: 'GENERAL' | 'SPECIAL' = isSpecialType ? 'SPECIAL' : 'GENERAL';

      s.lines.forEach(l => {
        const amt = Number(l.amount) || 0;
        if (l.type === 'Debit') {
          addPosting(l.account_code, l.account_title, s.entry_date, s.voucher_no, s.description, amt, 0, entryBook);
        } else {
          addPosting(l.account_code, l.account_title, s.entry_date, s.voucher_no, s.description, 0, amt, entryBook);
        }
      });
    });

    // Calculate running balance per account
    Object.keys(map).forEach(code => {
      const item = map[code];
      item.postings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let run = 0;
      item.postings.forEach(p => {
        if (item.type === 'Asset' || item.type === 'Expense') {
          run += (p.debit - p.credit);
        } else {
          run += (p.credit - p.debit);
        }
        p.runningBalance = run;
      });

      item.netBalance = run;
    });

    return map;
  }, [sales, collections, expenses, payments, specialEntries, ppeAssets, payrollRecords, coaList]);

  // Accounts list for select dropdown & table view
  const displayAccounts = useMemo(() => {
    let keys = Object.keys(ledgerMap);
    if (selectedAccount !== 'ALL') {
      keys = keys.filter(k => k === selectedAccount);
    }
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      keys = keys.filter(k =>
        k.toLowerCase().includes(q) ||
        ledgerMap[k].title.toLowerCase().includes(q)
      );
    }
    return keys.map(k => ledgerMap[k]);
  }, [ledgerMap, selectedAccount, searchTerm]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <Book className="w-6 h-6 text-cyan-400" />
              General Ledger (T-Accounts & Running Balances)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Complete master record of all financial accounts (Assets, Liabilities, Equity, Revenue, and Expenses) showing cumulative debit and credit postings and real-time ending balances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search account code/title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none ${theme.borderInput} ${theme.textMain}`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="ALL" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>All Account Cards ({coaList.length})</option>
                {coaList.map(a => (
                  <option key={a.code} value={a.code} className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>
                    [{a.code}] {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LEDGER CATEGORY TOGGLE TABS */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLedgerCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              ledgerCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📖 All Account Ledgers
          </button>
          <button
            type="button"
            onClick={() => setLedgerCategory('GENERAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              ledgerCategory === 'GENERAL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📒 General Ledger (Payroll, Tax, Depreciation, Adjusting, Closing, Reversing)
          </button>
          <button
            type="button"
            onClick={() => setLedgerCategory('SPECIAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              ledgerCategory === 'SPECIAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            📗 Special Ledger (Sales, Collections, Expenses, Payments, Cancellations)
          </button>
        </div>
      </div>

      {/* T-ACCOUNT CARDS */}
      <div className="space-y-6">
        {displayAccounts.map((acc) => (
          <div key={acc.code} className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm overflow-hidden`}>
            {/* Account Card Header */}
            <div className={`p-4 border-b ${theme.borderCard} bg-zinc-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                  CODE: {acc.code}
                </span>
                <h3 className={`font-bold text-sm ${theme.textTitle}`}>{acc.title}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  acc.type === 'Asset' ? 'bg-cyan-500/10 text-cyan-400' :
                  acc.type === 'Liability' ? 'bg-amber-500/10 text-amber-400' :
                  acc.type === 'Equity' ? 'bg-purple-500/10 text-purple-400' :
                  acc.type === 'Revenue' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-rose-500/10 text-rose-400'
                }`}>
                  {acc.type}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-zinc-400">Total Dr: <span className="text-emerald-400 font-bold">₱{acc.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="text-zinc-400">Total Cr: <span className="text-teal-400 font-bold">₱{acc.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="text-zinc-300 bg-zinc-500/10 px-3 py-1 rounded-lg border border-zinc-700/30">
                  Ending Balance: <span className="text-cyan-300 font-bold">₱{acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Postings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                    <th className="p-3 w-28">Posting Date</th>
                    <th className="p-3 w-32">Ref / Voucher #</th>
                    <th className="p-3">Particulars & Transaction Details</th>
                    <th className="p-3 text-right w-32">Debit (Dr)</th>
                    <th className="p-3 text-right w-32">Credit (Cr)</th>
                    <th className="p-3 text-right w-36">Running Balance</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.borderCard}`}>
                  {acc.postings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-zinc-500">
                        No transactions posted to this account title yet.
                      </td>
                    </tr>
                  ) : (
                    acc.postings.map((p, idx) => (
                      <tr key={idx} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                        <td className="p-3 font-mono text-zinc-300">{p.date}</td>
                        <td className="p-3 font-mono font-bold text-cyan-400">{p.ref}</td>
                        <td className={`p-3 font-medium ${theme.textMain}`}>{p.particulars}</td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                          {p.debit > 0 ? `₱${p.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-teal-400">
                          {p.credit > 0 ? `₱${p.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-cyan-300">
                          ₱{p.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
