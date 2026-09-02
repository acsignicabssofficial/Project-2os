import React, { useState, useMemo } from 'react';
import { FileText, Printer, Info, Layers, Sparkles } from 'lucide-react';
import { PayrollRecord, Employee, Company } from '../types';

interface BIR2316TabProps {
  payrollRecords?: PayrollRecord[];
  employees?: Employee[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
}

export default function BIR2316Tab({
  payrollRecords = [],
  employees = [],
  activeCompany,
  theme,
  triggerAlert
}: BIR2316TabProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.employee_id || '');
  const [taxYear, setTaxYear] = useState<string>('2024');
  const [periodFrom, setPeriodFrom] = useState<string>('01/01');
  const [periodTo, setPeriodTo] = useState<string>('05/08');
  const [useModelDefaults, setUseModelDefaults] = useState<boolean>(payrollRecords.length === 0);

  const selectedEmp = useMemo(() => {
    return employees.find(e => e.employee_id === selectedEmpId) || employees[0] || null;
  }, [employees, selectedEmpId]);

  // Aggregate payroll records for the employee in the chosen tax year
  const empPayroll = useMemo(() => {
    if (!selectedEmp) return [];
    return payrollRecords.filter(p => 
      p.employee_id === selectedEmp.employee_id && 
      (p.tax_year === taxYear || p.payroll_period.startsWith(taxYear))
    );
  }, [payrollRecords, selectedEmp, taxYear]);

  // Calculate BIR 2316 Exact Values
  const comp = useMemo(() => {
    // If toggle model defaults is active, use the exact image model numbers!
    if (useModelDefaults) {
      return {
        recordCount: empPayroll.length,
        isModelDefault: true,
        // Part IV-B Non-Taxable
        item29_basicExempt: 0.00,
        item30_holidayPay: 0.00,
        item31_overtimeExempt: 0.00,
        item32_nightDiff: 0.00,
        item33_hazardPay: 0.00,
        item34_13thMonthExempt: 90000.00,
        item35_deMinimis: 0.00,
        item36_statDeductions: 12010.00,
        item37_otherNonTaxable: 0.00,
        item38_totalNonTaxable: 102010.00,

        // Part IV-B Taxable Regular & Supplementary
        item39_basicTaxable: 155697.54,
        item40_representation: 0.00,
        item41_transportation: 0.00,
        item42_cola: 0.00,
        item43_housingAllowance: 0.00,
        item44a_label: '',
        item44a_val: 0.00,
        item44b_label: '',
        item44b_val: 0.00,

        item45_commission: 0.00,
        item46_profitSharing: 0.00,
        item47_directorsFees: 0.00,
        item48_taxable13thMonth: 54432.08,
        item49_hazardPayTaxable: 0.00,
        item50_overtimeTaxable: -80.84,
        item51a_label: '',
        item51a_val: 0.00,
        item51b_label: 'Adjustments',
        item51b_val: 13631.83,
        item52_totalTaxable: 223680.61,

        // Part IVA Summary
        item19_grossCompensation: 325690.61,
        item20_nonTaxable: 102010.00,
        item21_taxablePresent: 223680.61,
        item22_taxablePrev: 0.00,
        item23_grossTaxable: 223680.61,
        item24_taxDue: 0.00,
        item25a_withheldPresent: 0.00,
        item25b_withheldPrev: 0.00,
        item26_totalWithheldAdjusted: 0.00,
        item27_peraTaxCredit: 0.00,
        item28_totalTaxesWithheld: 0.00,

        // Additional Deductions
        advances: 0.00,
        absentsTardiness: 0.00,
        sssLoan: 0.00,
        pagibigLoan: 0.00,
        otherSalaryDeductions: 0.00,
        totalSalaryDeductions: 0.00,
        totalAllDeductions: 12010.00,
        netPayReceived: 313680.61
      };
    }

    // Otherwise aggregate from logged payroll records
    const recordCount = empPayroll.length;

    const item29_basicExempt = empPayroll.reduce((sum, r) => sum + (Number(r.basic_pay) || 0), 0);
    const item30_holidayPay = empPayroll.reduce((sum, r) => sum + (Number(r.holiday_pay) || 0), 0);
    const item31_overtimeExempt = empPayroll.reduce((sum, r) => sum + (Number(r.overtime_pay) || 0), 0);
    const item32_nightDiff = empPayroll.reduce((sum, r) => sum + (Number(r.night_differential) || 0), 0);
    const item33_hazardPay = empPayroll.reduce((sum, r) => sum + (Number(r.hazard_pay) || 0), 0);
    const item34_13thMonthExempt = empPayroll.reduce((sum, r) => sum + (Number(r.thirteenth_month_pay) || 0), 0);
    const item35_deMinimis = empPayroll.reduce((sum, r) => sum + (Number(r.de_minimis_benefits) || 0), 0);
    
    const sss = empPayroll.reduce((sum, r) => sum + (Number(r.sss_deduction) || 0), 0);
    const phic = empPayroll.reduce((sum, r) => sum + (Number(r.philhealth_deduction) || 0), 0);
    const hdmf = empPayroll.reduce((sum, r) => sum + (Number(r.pagibig_deduction) || 0), 0);
    const item36_statDeductions = sss + phic + hdmf;
    const item37_otherNonTaxable = empPayroll.reduce((sum, r) => sum + (Number(r.other_non_taxable) || 0), 0);

    const item38_totalNonTaxable = item29_basicExempt + item30_holidayPay + item31_overtimeExempt + item32_nightDiff + item33_hazardPay + item34_13thMonthExempt + item35_deMinimis + item36_statDeductions + item37_otherNonTaxable;

    const item39_basicTaxable = empPayroll.reduce((sum, r) => sum + (Number(r.taxable_basic) || 0), 0);
    const item40_representation = empPayroll.reduce((sum, r) => sum + (Number(r.representation) || 0), 0);
    const item41_transportation = empPayroll.reduce((sum, r) => sum + (Number(r.transportation) || 0), 0);
    const item42_cola = empPayroll.reduce((sum, r) => sum + (Number(r.cola) || 0), 0);
    const item43_housingAllowance = empPayroll.reduce((sum, r) => sum + (Number(r.housing_allowance) || 0), 0);
    
    const item44a_val = empPayroll.reduce((sum, r) => sum + (Number(r.item44a_val) || 0), 0);
    const item44b_val = empPayroll.reduce((sum, r) => sum + (Number(r.item44b_val) || 0), 0);

    const item45_commission = empPayroll.reduce((sum, r) => sum + (Number(r.commission) || 0), 0);
    const item46_profitSharing = empPayroll.reduce((sum, r) => sum + (Number(r.profit_sharing) || 0), 0);
    const item47_directorsFees = empPayroll.reduce((sum, r) => sum + (Number(r.directors_fees) || 0), 0);
    const item48_taxable13thMonth = empPayroll.reduce((sum, r) => sum + (Number(r.taxable_thirteenth_month) || 0), 0);
    const item49_hazardPayTaxable = empPayroll.reduce((sum, r) => sum + (Number(r.item49_hazard_pay_taxable) || 0), 0);
    const item50_overtimeTaxable = empPayroll.reduce((sum, r) => sum + (Number(r.taxable_overtime) || 0), 0);
    const item51a_val = empPayroll.reduce((sum, r) => sum + (Number(r.item51a_val) || 0), 0);
    const item51b_val = empPayroll.reduce((sum, r) => sum + (Number(r.item51b_val) || 0), 0);

    const item52_totalTaxable = item39_basicTaxable + item40_representation + item41_transportation + item42_cola + item43_housingAllowance + item44a_val + item44b_val + item45_commission + item46_profitSharing + item47_directorsFees + item48_taxable13thMonth + item49_hazardPayTaxable + item50_overtimeTaxable + item51a_val + item51b_val;

    const item19_grossCompensation = item38_totalNonTaxable + item52_totalTaxable;
    const item20_nonTaxable = item38_totalNonTaxable;
    const item21_taxablePresent = item52_totalTaxable;

    const item22_taxablePrev = empPayroll.reduce((sum, r) => sum + (Number(r.item22_taxable_prev_employer) || 0), 0);
    const item23_grossTaxable = item21_taxablePresent + item22_taxablePrev;

    const item25a_withheldPresent = empPayroll.reduce((sum, r) => sum + (Number(r.withholding_tax) || 0), 0);
    const item25b_withheldPrev = 0.00;
    const item26_totalWithheldAdjusted = item25a_withheldPresent + item25b_withheldPrev;
    const item27_peraTaxCredit = empPayroll.reduce((sum, r) => sum + (Number(r.item27_pera_tax_credit) || 0), 0);
    const item28_totalTaxesWithheld = item26_totalWithheldAdjusted + item27_peraTaxCredit;

    const advances = empPayroll.reduce((sum, r) => sum + (Number(r.advances) || 0), 0);
    const absentsTardiness = empPayroll.reduce((sum, r) => sum + (Number(r.absents_tardiness) || 0), 0);
    const sssLoan = empPayroll.reduce((sum, r) => sum + (Number(r.sss_loan) || 0), 0);
    const pagibigLoan = empPayroll.reduce((sum, r) => sum + (Number(r.pagibig_loan) || 0), 0);
    const otherSalaryDeductions = empPayroll.reduce((sum, r) => sum + (Number(r.other_salary_deductions) || 0), 0);
    const totalSalaryDeductions = advances + absentsTardiness + sssLoan + pagibigLoan + otherSalaryDeductions;
    const totalAllDeductions = item36_statDeductions + item28_totalTaxesWithheld + totalSalaryDeductions;
    const netPayReceived = item19_grossCompensation - totalAllDeductions;

    return {
      recordCount,
      isModelDefault: false,
      item29_basicExempt,
      item30_holidayPay,
      item31_overtimeExempt,
      item32_nightDiff,
      item33_hazardPay,
      item34_13thMonthExempt,
      item35_deMinimis,
      item36_statDeductions,
      item37_otherNonTaxable,
      item38_totalNonTaxable,

      item39_basicTaxable,
      item40_representation,
      item41_transportation,
      item42_cola,
      item43_housingAllowance,
      item44a_label: empPayroll[0]?.item44a_label || '',
      item44a_val,
      item44b_label: empPayroll[0]?.item44b_label || '',
      item44b_val,

      item45_commission,
      item46_profitSharing,
      item47_directorsFees,
      item48_taxable13thMonth,
      item49_hazardPayTaxable,
      item50_overtimeTaxable,
      item51a_label: empPayroll[0]?.item51a_label || '',
      item51a_val,
      item51b_label: empPayroll[0]?.item51b_label || '',
      item51b_val,
      item52_totalTaxable,

      item19_grossCompensation,
      item20_nonTaxable,
      item21_taxablePresent,
      item22_taxablePrev,
      item23_grossTaxable,
      item24_taxDue: item28_totalTaxesWithheld,
      item25a_withheldPresent,
      item25b_withheldPrev,
      item26_totalWithheldAdjusted,
      item27_peraTaxCredit,
      item28_totalTaxesWithheld,

      advances,
      absentsTardiness,
      sssLoan,
      pagibigLoan,
      otherSalaryDeductions,
      totalSalaryDeductions,
      totalAllDeductions,
      netPayReceived
    };
  }, [empPayroll, taxYear, useModelDefaults]);

  const fmt = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className={`p-6 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              <FileText className="w-6 h-6 text-cyan-400" />
              BIR Form 2316 Certificate Preview (September 2021 ENCS Replica)
            </h2>
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Certificate of Compensation Payment / Tax Withheld. Built as an <strong>exact 1:1 replica</strong> of the official BIR Form 2316.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setUseModelDefaults(!useModelDefaults)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                useModelDefaults 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {useModelDefaults ? 'Viewing Exact Image Model Data' : 'View Image Model Data'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Year:</span>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border bg-transparent font-mono cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                <option value="2024" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2024</option>
                <option value="2025" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2025</option>
                <option value="2026" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Employee:</span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
              >
                {employees.map(e => (
                  <option key={e.id} value={e.employee_id} className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>
                    {e.full_name} ({e.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className={`py-2 px-4 text-xs font-semibold rounded-lg text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm ${theme.accentBg}`}
            >
              <Printer className="w-4 h-4" />
              Print BIR 2316 Form
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className={`p-4 border rounded-xl flex items-center justify-between text-xs font-mono ${
        comp.isModelDefault 
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2">
          {comp.isModelDefault ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Layers className="w-4 h-4 text-emerald-400" />}
          <span>
            {comp.isModelDefault 
              ? `Displaying EXACT model values from the BIR 2316 image (Gross: ₱${fmt(comp.item19_grossCompensation)} | Non-Taxable: ₱${fmt(comp.item38_totalNonTaxable)} | Taxable: ₱${fmt(comp.item52_totalTaxable)}).`
              : `Summarizing ${comp.recordCount} logged payroll record(s) for ${selectedEmp?.full_name || 'Selected Employee'}. Gross: ₱${fmt(comp.item19_grossCompensation)} | Non-Taxable: ₱${fmt(comp.item38_totalNonTaxable)} | Taxable: ₱${fmt(comp.item52_totalTaxable)}.`}
          </span>
        </div>
        <span className="font-bold bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
          Year {taxYear}
        </span>
      </div>

      {/* EXACT BIR FORM 2316 1:1 REPLICA CONTAINER */}
      <div className="bg-white text-black border-2 border-black rounded-lg p-5 shadow-2xl font-sans text-[11px] leading-tight space-y-3 max-w-5xl mx-auto selection:bg-amber-200">
        
        {/* TOP NOTICE */}
        <div className="text-[10px] italic font-semibold text-slate-800 border-b border-black pb-1">
          Fill in all applicable spaces. Mark all appropriate boxes with an "X"
        </div>

        {/* YEAR & PERIOD HEADER */}
        <div className="grid grid-cols-2 border-2 border-black bg-slate-50 divide-x-2 divide-black font-mono">
          {/* Box 1 */}
          <div className="p-2 flex items-center justify-between">
            <span className="font-bold font-sans text-[10px]">1 For the year (YYYY)</span>
            <div className="flex gap-1">
              {taxYear.split('').map((char, i) => (
                <span key={i} className="border border-black bg-white px-2 py-0.5 font-bold text-xs">{char}</span>
              ))}
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-2 flex items-center justify-between">
            <span className="font-bold font-sans text-[10px]">2 For the Period From (MM/DD)</span>
            <div className="flex items-center gap-1">
              <span className="border border-black bg-white px-1.5 py-0.5 font-bold">{periodFrom.split('/')[0] || '01'}</span>
              <span className="border border-black bg-white px-1.5 py-0.5 font-bold">{periodFrom.split('/')[1] || '01'}</span>
              <span className="font-bold font-sans text-[10px] mx-1">To (MM/DD)</span>
              <span className="border border-black bg-white px-1.5 py-0.5 font-bold">{periodTo.split('/')[0] || '05'}</span>
              <span className="border border-black bg-white px-1.5 py-0.5 font-bold">{periodTo.split('/')[1] || '08'}</span>
            </div>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT MATCHING EXACT IMAGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* LEFT COLUMN: PART I, II, III & PART IVA SUMMARY */}
          <div className="space-y-3">
            
            {/* PART I - EMPLOYEE INFORMATION */}
            <div className="border-2 border-black rounded p-2 space-y-1.5 bg-slate-50/50">
              <div className="font-extrabold bg-black text-white p-1 text-[11px] uppercase tracking-wide">
                Part I - Employee Information
              </div>

              <div>
                <div className="font-bold text-[10px]">3 TIN</div>
                <div className="font-mono font-extrabold text-xs bg-white border border-black p-1 rounded tracking-wider">
                  {selectedEmp?.tin || '000-000-000-00000'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <div className="font-bold text-[10px]">4 Employee's Name (Last Name, First Name, Middle Name)</div>
                  <div className="font-bold uppercase text-xs border-b border-black py-0.5">
                    {selectedEmp?.full_name || 'DOE, JANE MARIE'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">5 RDO Code</div>
                  <div className="font-mono font-bold border-b border-black py-0.5">
                    {activeCompany?.rdo_code || '050'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <div className="font-bold text-[10px]">6 Registered Address</div>
                  <div className="border-b border-black py-0.5 text-[10px] truncate">
                    {activeCompany?.registered_address || 'METRO MANILA, PHILIPPINES'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">6A Zip Code</div>
                  <div className="font-mono border-b border-black py-0.5">1200</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <div className="font-bold text-[10px]">6B Local Home Address</div>
                  <div className="border-b border-black py-0.5 text-[10px]">N/A</div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">6C Zip Code</div>
                  <div className="font-mono border-b border-black py-0.5">1200</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-[10px]">6D Foreign Address</div>
                <div className="border-b border-black py-0.5 text-[10px]">N/A</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-bold text-[10px]">7 Date of Birth (MM/DD/YYYY)</div>
                  <div className="font-mono border-b border-black py-0.5">01/15/1992</div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">8 Contact Number</div>
                  <div className="font-mono border-b border-black py-0.5">0917-123-4567</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-bold text-[10px]">9 Statutory Minimum Wage rate per day</div>
                  <div className="font-mono border-b border-black py-0.5 text-right font-bold">0.00</div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">10 Statutory Minimum Wage rate per month</div>
                  <div className="font-mono border-b border-black py-0.5 text-right font-bold">0.00</div>
                </div>
              </div>

              <div className="pt-1 flex items-start gap-1.5 text-[10px]">
                <span className="font-bold">11</span>
                <input type="checkbox" className="mt-0.5 border-black" />
                <span>Minimum Wage Earner(MWE) whose compensation is exempt from withholding tax and not subject to income tax</span>
              </div>
            </div>

            {/* PART II - EMPLOYER INFORMATION (PRESENT) */}
            <div className="border-2 border-black rounded p-2 space-y-1.5 bg-slate-50/50">
              <div className="font-extrabold bg-black text-white p-1 text-[11px] uppercase tracking-wide">
                Part II - Employer Information (Present)
              </div>

              <div>
                <div className="font-bold text-[10px]">12 TIN</div>
                <div className="font-mono font-extrabold text-xs bg-white border border-black p-1 rounded tracking-wider">
                  {activeCompany?.company_tin || '000-000-000-00000'}
                </div>
              </div>

              <div>
                <div className="font-bold text-[10px]">13 Employer's Name</div>
                <div className="font-bold uppercase text-xs border-b border-black py-0.5">
                  {activeCompany?.company_name || 'ACTIVE WORKSPACE CORP'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <div className="font-bold text-[10px]">14 Registered Address</div>
                  <div className="border-b border-black py-0.5 text-[10px] truncate">
                    {activeCompany?.company_address || 'METRO MANILA, PHILIPPINES'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[10px]">14A Zip Code</div>
                  <div className="font-mono border-b border-black py-0.5">1200</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold pt-1">
                <span>15 Type of Employer</span>
                <span className="flex items-center gap-1 border border-black px-1.5 py-0.5 bg-white">
                  [X] Main Employer
                </span>
                <span className="flex items-center gap-1 border border-black px-1.5 py-0.5 bg-white text-slate-400">
                  [ ] Secondary Employer
                </span>
              </div>
            </div>

            {/* PART III - EMPLOYER INFORMATION (PREVIOUS) */}
            <div className="border-2 border-black rounded p-2 space-y-1 bg-slate-50/50 text-[10px]">
              <div className="font-extrabold bg-slate-800 text-white p-1 text-[11px] uppercase tracking-wide">
                Part III - Employer Information (Previous)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 font-bold">16 TIN: ---</div>
                <div>16A Zip Code: ---</div>
              </div>
              <div className="font-bold">17 Employer's Name: N/A</div>
              <div>18 Registered Address: N/A</div>
            </div>

            {/* PART IVA - SUMMARY */}
            <div className="border-2 border-black rounded p-2.5 space-y-1.5 bg-amber-50/50 font-mono">
              <div className="font-extrabold font-sans bg-black text-white p-1 text-[11px] uppercase tracking-wide">
                Part IVA - Summary
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px] font-bold">19 Gross Compensation Income from Present Employer (Sum of Items 38 and 52)</span>
                  <span className="font-extrabold text-black bg-white px-2 py-0.5 border border-black">{fmt(comp.item19_grossCompensation)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px]">20 Less: Total Non-Taxable/Exempt Compensation Income from Present Employer (From Item 38)</span>
                  <span className="font-bold text-black bg-white px-2 py-0.5 border border-black">{fmt(comp.item20_nonTaxable)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px] font-bold">21 Taxable Compensation Income from Present Employer (Item 19 Less Item 20) (From Item 52)</span>
                  <span className="font-extrabold text-black bg-white px-2 py-0.5 border border-black">{fmt(comp.item21_taxablePresent)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px]">22 Add: Taxable Compensation Income from Previous Employer, if applicable</span>
                  <span className="font-bold text-black bg-white px-2 py-0.5 border border-black">{fmt(comp.item22_taxablePrev)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5 font-bold">
                  <span className="font-sans text-[10px]">23 Gross Taxable Compensation Income (Sum of Items 21 and 22)</span>
                  <span className="font-extrabold text-black bg-amber-200 px-2 py-0.5 border border-black">{fmt(comp.item23_grossTaxable)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px]">24 Tax Due</span>
                  <span className="font-bold text-black bg-white px-2 py-0.5 border border-black">{fmt(comp.item24_taxDue)}</span>
                </div>

                <div className="flex justify-between items-center pl-2">
                  <span className="font-sans text-[10px]">25A Present Employer</span>
                  <span className="font-bold bg-white px-2 py-0.5 border border-black">{fmt(comp.item25a_withheldPresent)}</span>
                </div>

                <div className="flex justify-between items-center pl-2">
                  <span className="font-sans text-[10px]">25B Previous Employer, if applicable</span>
                  <span className="font-bold bg-white px-2 py-0.5 border border-black">{fmt(comp.item25b_withheldPrev)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px]">26 Total Amount of Taxes Withheld as adjusted (Sum of Items 25A and 25B)</span>
                  <span className="font-bold bg-white px-2 py-0.5 border border-black">{fmt(comp.item26_totalWithheldAdjusted)}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                  <span className="font-sans text-[10px]">27 5% Tax Credit (PERA Act of 2008)</span>
                  <span className="font-bold bg-white px-2 py-0.5 border border-black">{fmt(comp.item27_peraTaxCredit)}</span>
                </div>

                <div className="flex justify-between items-center font-extrabold bg-slate-200 p-1 border border-black">
                  <span className="font-sans text-[10px]">28 Total Taxes Withheld (Sum of Items 26 and 27)</span>
                  <span className="text-sm">{fmt(comp.item28_totalTaxesWithheld)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PART IV-B DETAILS OF COMPENSATION INCOME AND TAX WITHHELD FROM PRESENT EMPLOYER */}
          <div className="border-2 border-black rounded p-2.5 space-y-2 bg-slate-50/50 font-mono">
            
            <div className="font-extrabold font-sans bg-black text-white p-1 text-[11px] uppercase tracking-wide">
              Part IV-B Details of Compensation Income and Tax Withheld from Present Employer
            </div>

            {/* A. NON-TAXABLE / EXEMPT COMPENSATION INCOME */}
            <div className="space-y-1">
              <div className="font-extrabold font-sans text-[11px] bg-slate-200 p-1 border-b border-black uppercase text-black flex justify-between">
                <span>A. NON-TAXABLE/EXEMPT COMPENSATION INCOME</span>
                <span>Amount</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">29 Basic Salary (including the exempt P250,000 & below or the Statutory Minimum Wage of the MWE)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item29_basicExempt)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">30 Holiday Pay (MWE)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item30_holidayPay)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">31 Overtime Pay (MWE)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item31_overtimeExempt)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">32 Night Shift Differential (MWE)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item32_nightDiff)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">33 Hazard Pay (MWE)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item33_hazardPay)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">34 13th Month Pay and Other Benefits (maximum of P90,000)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item34_13thMonthExempt)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">35 De Minimis Benefits</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item35_deMinimis)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">36 SSS, GSIS, PHIC & PAG-IBIG Contributions and Union Dues (Employee share only)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item36_statDeductions)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">37 Salaries and Other Forms of Compensation</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item37_otherNonTaxable)}</span>
              </div>

              <div className="flex justify-between items-center font-extrabold text-[11px] bg-slate-200 p-1 border border-black mt-1">
                <span className="font-sans">38 Total Non-Taxable/Exempt Compensation Income (Sum of Items 29 to 37)</span>
                <span className="text-sm">{fmt(comp.item38_totalNonTaxable)}</span>
              </div>
            </div>

            {/* B. TAXABLE COMPENSATION INCOME REGULAR */}
            <div className="space-y-1 pt-1">
              <div className="font-extrabold font-sans text-[11px] bg-slate-200 p-1 border-b border-black uppercase text-black">
                B. TAXABLE COMPENSATION INCOME REGULAR
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">39 Basic Salary</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item39_basicTaxable)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">40 Representation</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item40_representation)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">41 Transportation</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item41_transportation)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">42 Cost of Living Allowance (COLA)</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item42_cola)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">43 Fixed Housing Allowance</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item43_housingAllowance)}</span>
              </div>

              <div className="space-y-0.5">
                <div className="font-sans text-[10px]">44 Others (Specify)</div>
                <div className="flex justify-between items-center gap-1 pl-3">
                  <span className="border border-black bg-white px-2 py-0.5 flex-1 font-sans text-[10px]">{comp.item44a_label || '44A'}</span>
                  <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item44a_val)}</span>
                </div>
                <div className="flex justify-between items-center gap-1 pl-3">
                  <span className="border border-black bg-white px-2 py-0.5 flex-1 font-sans text-[10px]">{comp.item44b_label || '44B'}</span>
                  <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item44b_val)}</span>
                </div>
              </div>

              {/* SUPPLEMENTARY */}
              <div className="font-extrabold font-sans text-[11px] bg-slate-200 p-1 border-b border-black uppercase text-black mt-2">
                SUPPLEMENTARY
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">45 Commission</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item45_commission)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">46 Profit Sharing</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item46_profitSharing)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">47 Fees Including Director's Fees</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item47_directorsFees)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">48 Taxable 13th Month Benefits</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item48_taxable13thMonth)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">49 Hazard Pay</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item49_hazardPayTaxable)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-sans">50 Overtime Pay</span>
                <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item50_overtimeTaxable)}</span>
              </div>

              <div className="space-y-0.5">
                <div className="font-sans text-[10px]">51 Others (Specify)</div>
                <div className="flex justify-between items-center gap-1 pl-3">
                  <span className="border border-black bg-white px-2 py-0.5 flex-1 font-sans text-[10px]">{comp.item51a_label || '51A'}</span>
                  <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item51a_val)}</span>
                </div>
                <div className="flex justify-between items-center gap-1 pl-3">
                  <span className="border border-black bg-white px-2 py-0.5 flex-1 font-sans text-[10px]">{comp.item51b_label || '51B'}</span>
                  <span className="border border-black bg-white px-2 py-0.5 font-bold">{fmt(comp.item51b_val)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center font-extrabold text-[11px] bg-amber-200 p-1 border border-black mt-2">
                <span className="font-sans">52 Total Taxable Compensation Income (Sum of Items 39 to 51B)</span>
                <span className="text-sm">{fmt(comp.item52_totalTaxable)}</span>
              </div>
            </div>

          </div>

        </div>

        {/* SIGNATURE SECTION */}
        <div className="border-t-2 border-black pt-3 grid grid-cols-2 gap-6 text-[10px] font-sans">
          <div className="text-center">
            <div className="border-b border-black pb-1 font-extrabold uppercase">
              {activeCompany?.company_name || 'AUTHORIZED EMPLOYER / AGENT'}
            </div>
            <p className="mt-1 text-slate-600">Present Employer / Authorized Agent Signature over Printed Name</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black pb-1 font-extrabold uppercase">
              {selectedEmp?.full_name || 'EMPLOYEE CONFORME'}
            </div>
            <p className="mt-1 text-slate-600">Employee Signature over Printed Name (Conforme)</p>
          </div>
        </div>

        {/* ADDITIONAL DEDUCTIONS & NET PAY RECEIVED SECTION */}
        <div className="border-t-2 border-black pt-3 mt-3 bg-slate-100 p-3 rounded border border-black space-y-2">
          <div className="flex justify-between items-center border-b border-black pb-1">
            <span className="font-extrabold text-xs uppercase text-slate-900">
              Additional Payroll Deductions & Net Pay Received (Annual Summary)
            </span>
            <span className="font-extrabold font-mono text-emerald-700 text-xs">
              NET PAY: ₱{fmt(comp.netPayReceived)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-mono">
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">Gross Compensation</span>
              <span className="font-bold text-black">₱{fmt(comp.item19_grossCompensation)}</span>
            </div>
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">Advances (Cash)</span>
              <span className="font-bold text-rose-700">(₱{fmt(comp.advances)})</span>
            </div>
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">Absents & Tardiness</span>
              <span className="font-bold text-rose-700">(₱{fmt(comp.absentsTardiness)})</span>
            </div>
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">SSS Loan</span>
              <span className="font-bold text-rose-700">(₱{fmt(comp.sssLoan)})</span>
            </div>
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">Pag-IBIG Loan</span>
              <span className="font-bold text-rose-700">(₱{fmt(comp.pagibigLoan)})</span>
            </div>
            <div className="bg-white p-1.5 border border-black rounded">
              <span className="text-slate-500 font-sans block text-[9px]">Other Deductions</span>
              <span className="font-bold text-rose-700">(₱{fmt(comp.otherSalaryDeductions)})</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] bg-emerald-100 p-2 border border-emerald-600 rounded font-bold font-mono">
            <span>Tax Compensated / Withheld (Item 28): ₱{fmt(comp.item28_totalTaxesWithheld)}</span>
            <span>Total Deductions & Taxes: (₱{fmt(comp.totalAllDeductions)})</span>
            <span className="text-emerald-900 text-xs font-extrabold">NET PAY RECEIVED: ₱{fmt(comp.netPayReceived)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
