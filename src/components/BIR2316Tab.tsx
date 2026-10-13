import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Info, Layers } from 'lucide-react';
import { PayrollRecord, Employee, Company, TaxBracket } from '../types';
import { translatePayrollRecords, build2316 } from '../utils/payroll2316';
import AutoSuggestInput from './AutoSuggestInput';

interface BIR2316TabProps {
  payrollRecords?: PayrollRecord[];
  employees?: Employee[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: any;
  initialEmployeeId?: string;
  initialYear?: string;
  taxBrackets?: TaxBracket[];
  onClose?: () => void;
}

export default function BIR2316Tab({
  payrollRecords = [],
  employees = [],
  activeCompany,
  theme,
  triggerAlert,
  initialEmployeeId,
  initialYear,
  taxBrackets,
  onClose
}: BIR2316TabProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmployeeId || employees[0]?.employee_id || '');
  const [empSearchName, setEmpSearchName] = useState<string>('');
  const [taxYear, setTaxYear] = useState<string>(initialYear || '2024');

  useEffect(() => {
    if (initialYear) setTaxYear(initialYear);
  }, [initialYear]);

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  useEffect(() => {
    const found = employees.find(e => e.employee_id === selectedEmpId);
    if (found && found.full_name) {
      setEmpSearchName(found.full_name);
    }
  }, [selectedEmpId, employees]);
  const selectedEmp = useMemo(() => {
    return employees.find(e => e.employee_id === selectedEmpId) || employees[0] || null;
  }, [employees, selectedEmpId]);

  // Payroll -> 2316 translation (shared engine: same lines feed 1601-C and the Alphalist)
  const translated = useMemo(() => translatePayrollRecords(payrollRecords), [payrollRecords]);

  const form = useMemo(() => {
    if (!selectedEmp) return null;
    return build2316(selectedEmp.employee_id as any, taxYear, translated, taxBrackets);
  }, [selectedEmp, taxYear, translated, taxBrackets]);

  const empPayroll = useMemo(() => {
    if (!selectedEmp) return [];
    return translated.filter(t => t.employeeId === String(selectedEmp.employee_id) && t.year === taxYear).map(t => t.record);
  }, [translated, selectedEmp, taxYear]);

  const periodFrom = form?.periodFrom || '01/01';
  const periodTo = form?.periodTo || '12/31';

  // Additional payroll deductions are informational only (not part of the 2316 computation)
  const sumRec = (k: string) => empPayroll.reduce((a, r: any) => a + (Number(r[k]) || 0), 0);

  const comp = useMemo(() => {
    const f: any = form || build2316('', taxYear, [], taxBrackets);
    const advances = sumRec('advances');
    const absentsTardiness = sumRec('absents_tardiness');
    const sssLoan = sumRec('sss_loan');
    const pagibigLoan = sumRec('pagibig_loan');
    const otherSalaryDeductions = sumRec('other_salary_deductions');
    const totalSalaryDeductions = advances + absentsTardiness + sssLoan + pagibigLoan + otherSalaryDeductions;
    const totalAllDeductions = f.i36 + f.item28 + totalSalaryDeductions;
    return {
      recordCount: f.recordCount,
      isModelDefault: false,
      item29_basicExempt: f.i29, item30_holidayPay: f.i30, item31_overtimeExempt: f.i31,
      item32_nightDiff: f.i32, item33_hazardPay: f.i33, item34_13thMonthExempt: f.i34,
      item35_deMinimis: f.i35, item36_statDeductions: f.i36, item37_otherNonTaxable: f.i37,
      item38_totalNonTaxable: f.item38,
      item39_basicTaxable: f.i39, item40_representation: f.i40, item41_transportation: f.i41,
      item42_cola: f.i42, item43_housingAllowance: f.i43,
      item44a_label: f.labels.i44a, item44a_val: f.i44a, item44b_label: f.labels.i44b, item44b_val: f.i44b,
      item45_commission: f.i45, item46_profitSharing: f.i46, item47_directorsFees: f.i47,
      item48_taxable13thMonth: f.i48, item49_hazardPayTaxable: f.i49, item50_overtimeTaxable: f.i50,
      item51a_label: f.labels.i51a, item51a_val: f.i51a, item51b_label: f.labels.i51b, item51b_val: f.i51b,
      item52_totalTaxable: f.item52,
      item19_grossCompensation: f.item19, item20_nonTaxable: f.item20, item21_taxablePresent: f.item21,
      item22_taxablePrev: f.i22, item23_grossTaxable: f.item23, item24_taxDue: f.item24,
      item25a_withheldPresent: f.i25a, item25b_withheldPrev: f.item25b,
      item26_totalWithheldAdjusted: f.item26, item27_peraTaxCredit: f.i27, item28_totalTaxesWithheld: f.item28,
      taxOverUnder: f.taxOverUnder,
      advances, absentsTardiness, sssLoan, pagibigLoan, otherSalaryDeductions,
      totalSalaryDeductions, totalAllDeductions,
      netPayReceived: f.item19 - totalAllDeductions
    };
  }, [form, empPayroll, taxYear, taxBrackets]);

  const fmt = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* CONTROLS (REDUNDANT TITLE REMOVED PER REQ 4) */}
      <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm transition-colors duration-200`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Certificate Controls
          </span>

          <div className="flex flex-wrap items-center gap-3">
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
              <div className="w-56">
                <AutoSuggestInput<Employee>
                  value={empSearchName}
                  onChange={setEmpSearchName}
                  onSelect={(emp) => {
                    setEmpSearchName(emp.full_name || '');
                    if (emp.employee_id) setSelectedEmpId(String(emp.employee_id));
                  }}
                  items={employees}
                  categoryLabel="Employee"
                  theme={theme}
                  placeholder="Type name (e.g. AB)..."
                  getItemLabel={(emp) => emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || String(emp.employee_id)}
                  getItemSublabel={(emp) => `ID: ${emp.employee_id} • TIN: ${emp.tin || 'N/A'}`}
                  getItemBadge={(emp) => emp.position || 'Staff'}
                  getSearchFields={(emp) => [
                    emp.full_name || '',
                    emp.first_name || '',
                    emp.last_name || '',
                    String(emp.employee_id || ''),
                    emp.tin || ''
                  ]}
                  inputClassName={`w-full text-xs px-3 py-1.5 rounded-lg border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                />
              </div>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className={`text-xs px-2 py-1.5 rounded-lg border bg-transparent font-semibold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
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

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 text-xs font-semibold rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
              >
                Back to Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className={`p-4 border rounded-xl flex items-center justify-between text-xs font-mono ${
        'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>
            {`Auto-summarized from ${comp.recordCount} payroll record(s) for ${selectedEmp?.full_name || 'Selected Employee'} — feeds BIR 1601-C (monthly) and the Alphalist (annual). Gross: ₱${fmt(comp.item19_grossCompensation)} | Non-Taxable: ₱${fmt(comp.item38_totalNonTaxable)} | Taxable: ₱${fmt(comp.item52_totalTaxable)} | Tax Due: ₱${fmt(comp.item24_taxDue)}.`}
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
            <span>Tax Due (Item 24): ₱{fmt(comp.item24_taxDue)} | Withheld (Item 28): ₱{fmt(comp.item28_totalTaxesWithheld)} | {comp.taxOverUnder >= 0 ? 'Still to withhold' : 'Refundable'}: ₱{fmt(Math.abs(comp.taxOverUnder))}</span>
            <span>Total Deductions & Taxes: (₱{fmt(comp.totalAllDeductions)})</span>
            <span className="text-emerald-900 text-xs font-extrabold">NET PAY RECEIVED: ₱{fmt(comp.netPayReceived)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
