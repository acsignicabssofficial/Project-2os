import React from 'react';
import { FileText, Building2, Info, CheckCircle2 } from 'lucide-react';
import { Sale, Collection, Expense, Payment, PPEAsset, Company } from '../types';

interface NotesToFSTabProps {
  sales?: Sale[];
  collections?: Collection[];
  expenses?: Expense[];
  payments?: Payment[];
  ppeAssets?: PPEAsset[];
  activeCompany: Company | null;
  theme: any;
}

export default function NotesToFSTab({
  sales = [],
  collections = [],
  expenses = [],
  payments = [],
  ppeAssets = [],
  activeCompany,
  theme
}: NotesToFSTabProps) {

  const companyName = activeCompany?.company_name || 'Active Workspace';
  const tin = activeCompany?.company_tin || '000-000-000-00000';
  const rdo = activeCompany?.rdo || 'RDO 050';
  const address = activeCompany?.business_address || 'Metro Manila, Philippines';

  const grossSales = sales.reduce((sum, s) => sum + s.invoice_amount, 0);
  const vatSales = sales.reduce((sum, s) => sum + s.vatable_amount, 0);
  const exemptSales = sales.reduce((sum, s) => sum + s.vat_exempt_amount, 0);
  const outputVat = sales.reduce((sum, s) => sum + s.output_vat, 0);

  const grossExpenses = expenses.reduce((sum, e) => sum + e.expense_invoice_amount, 0);
  const inputVat = expenses.reduce((sum, e) => sum + e.vat_input_amount, 0);

  const ppeCost = ppeAssets.reduce((sum, a) => sum + a.acquisition_cost, 0);
  const ppeDepr = ppeAssets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);

  return (
    <div className="space-y-6">
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
          <FileText className="w-6 h-6 text-cyan-400" />
          Notes to Financial Statements & Statutory Disclosures
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>
          Integral part of the financial statements providing qualitative accounting policies and mandatory BIR RR 15-2010 tax disclosures.
        </p>
      </div>

      <div className={`border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm p-6 space-y-6`}>
        {/* Note 1: Corporate Information */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <Building2 className="w-4 h-4" />
            Note 1 - Corporate & Registration Information
          </h3>
          <p className={`text-xs ${theme.textMain} leading-relaxed`}>
            <span className="font-semibold">{companyName}</span> (TIN: <span className="font-mono">{tin}</span>) is a registered business entity under Bureau of Internal Revenue (BIR) Revenue District Office <span className="font-mono">{rdo}</span> located at {address}. The company is primarily engaged in commercial trading and service delivery operations in the Philippines.
          </p>
        </section>

        {/* Note 2: Summary of Accounting Policies */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <Info className="w-4 h-4" />
            Note 2 - Summary of Significant Accounting Policies
          </h3>
          <ul className={`text-xs ${theme.textMain} space-y-2 list-disc pl-5 leading-relaxed`}>
            <li><strong>Basis of Financial Statements:</strong> Prepared in compliance with Philippine Financial Reporting Standards (PFRS) for Small and Medium-sized Entities (SMEs) under the historical cost convention.</li>
            <li><strong>Revenue Recognition:</strong> Revenue is recognized upon issuance of official sales invoices and delivery of services/goods to clients under the accrual method.</li>
            <li><strong>Property, Plant & Equipment:</strong> Recorded at acquisition cost less accumulated depreciation computed using the straight-line method over estimated useful life.</li>
            <li><strong>Income Tax & Value-Added Tax:</strong> Computed pursuant to the CREATE Act (RA 11534) and National Internal Revenue Code (NIRC) regulations.</li>
          </ul>
        </section>

        {/* Note 3: Revenue & Sales Breakdown */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <CheckCircle2 className="w-4 h-4" />
            Note 3 - Revenue & Sales Classification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-3 rounded-xl bg-zinc-500/5 border border-zinc-700/30">
              <span className="text-zinc-400 block text-[10px]">VATABLE SALES (12%)</span>
              <span className="text-cyan-400 font-bold text-sm">₱{vatSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-500/5 border border-zinc-700/30">
              <span className="text-zinc-400 block text-[10px]">VAT-EXEMPT SALES</span>
              <span className="text-emerald-400 font-bold text-sm">₱{exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-500/5 border border-zinc-700/30">
              <span className="text-zinc-400 block text-[10px]">TOTAL GROSS SALES</span>
              <span className="text-cyan-300 font-bold text-sm">₱{grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Note 4: BIR RR 15-2010 Mandatory Tax Disclosures */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <FileText className="w-4 h-4" />
            Note 4 - Supplementary Information Required under BIR Revenue Regulations 15-2010
          </h3>
          <p className={`text-xs ${theme.textMuted} mb-2`}>
            In compliance with the requirements set forth by RR 15-2010, the taxes, duties, and license fees paid or accrued during the taxable period are as follows:
          </p>

          <div className="overflow-x-auto border border-zinc-800/40 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`bg-zinc-500/10 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                  <th className="p-3">Tax Category</th>
                  <th className="p-3">Applicable BIR Form</th>
                  <th className="p-3 text-right">Tax Base / Gross Amount</th>
                  <th className="p-3 text-right">Tax Amount Output / Withheld</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.borderCard}`}>
                <tr>
                  <td className={`p-3 font-semibold ${theme.textTitle}`}>Output Value-Added Tax (12%)</td>
                  <td className="p-3 font-mono text-cyan-400">BIR Form 2550Q</td>
                  <td className="p-3 text-right font-mono text-zinc-300">₱{vatSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono font-bold text-cyan-400">₱{outputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className={`p-3 font-semibold ${theme.textTitle}`}>Creditable Input VAT (12%)</td>
                  <td className="p-3 font-mono text-cyan-400">BIR Form 2550Q</td>
                  <td className="p-3 text-right font-mono text-zinc-300">₱{grossExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">₱{inputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className={`p-3 font-semibold ${theme.textTitle}`}>Expanded Withholding Tax (EWT)</td>
                  <td className="p-3 font-mono text-amber-400">BIR Form 0619-E / 1601-EQ</td>
                  <td className="p-3 text-right font-mono text-zinc-300">₱{grossExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-mono font-bold text-purple-400">
                    ₱{expenses.reduce((s, e) => s + (Number(e.withholding_2307_2306 ?? e.tax_withheld) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Note 5: PFRS 15, PFRS 16, PFRS 9, PAS 12 & PFRS 13 Fair Value Hierarchy Disclosures */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <CheckCircle2 className="w-4 h-4" />
            Note 5 - PFRS 9 Financial Instruments, PFRS 13 Fair Value Hierarchy, PFRS 16 Leases &amp; PAS 37 Contingencies
          </h3>
          <ul className={`text-xs ${theme.textMain} space-y-2 list-disc pl-5 leading-relaxed`}>
            <li><strong>PFRS 9 Expected Credit Loss (ECL) Staging:</strong> Trade receivables (#1020) are evaluated under the simplified lifetime ECL approach, netted against Allowance for Expected Credit Losses (#1025).</li>
            <li><strong>PFRS 13 Fair Value Hierarchy:</strong> Revalued Property, Plant &amp; Equipment (#1510 / #3040 OCI) and financial instruments are categorized across Level 1 (Quoted prices), Level 2 (Observable market inputs), and Level 3 (Unobservable valuation inputs).</li>
            <li><strong>PAS 7 Supplier Finance Arrangements &amp; PFRS 16 Leases:</strong> Carrying amounts of Trade Payables (#2010) and Right-of-Use Lease Liabilities (#2070 Current / #2520 Non-Current) are separately presented from bank borrowings (#2510).</li>
            <li><strong>PAS 10 Events After the Reporting Period &amp; PAS 37 Provisions:</strong> Adjusting events prior to authorization of financial statements are recognized in the ledger; non-adjusting events and contingent liabilities are disclosed herein without retroactive balance sheet adjustment.</li>
          </ul>
        </section>

        {/* Note 6: PFRS S1 & PFRS S2 Sustainability & Climate-Related Disclosures */}
        <section className="space-y-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 border-b ${theme.borderCard} pb-2`}>
            <Info className="w-4 h-4" />
            Note 6 - PFRS S1 &amp; PFRS S2 Sustainability &amp; Climate-Related Financial Disclosures
          </h3>
          <p className={`text-xs ${theme.textMuted}`}>
            In alignment with SEC Philippines adoption of PFRS S1 (General Requirements for Disclosure of Sustainability-related Financial Information) and PFRS S2 (Climate-related Disclosures), utility and fuel expenditures recorded in the ledger are linked to Greenhouse Gas (GHG) Protocol Scope 1, Scope 2, and Scope 3 emissions tracking:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-zinc-400 block text-[10px]">SCOPE 1 (DIRECT FUEL / FLEET)</span>
              <span className="text-emerald-400 font-bold text-sm">Tracked via Expense &amp; Special Vouchers</span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <span className="text-zinc-400 block text-[10px]">SCOPE 2 (PURCHASED ELECTRICITY #6030)</span>
              <span className="text-cyan-400 font-bold text-sm">Linked to Philippine Grid Factor (0.712 kg CO₂e/kWh)</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <span className="text-zinc-400 block text-[10px]">CAPITAL DEPLOYED TOWARD CLIMATE RESILIENCE</span>
              <span className="text-purple-400 font-bold text-sm">₱{ppeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} Gross PPE</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
