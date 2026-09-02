import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Table, FileText, Calendar, RefreshCw, CheckSquare, Sparkles, Calculator } from 'lucide-react';
import { PayrollRecord, Employee, Company, SssBracket, PhilHealthConfig, PagIbigConfig, TaxBracket, SpecialEntry, SpecialEntryLine } from '../types';
import { 
  computeSssDeduction, 
  computePhilHealthDeduction, 
  computePagIbigDeduction, 
  computeWithholdingTax,
  computeSssErShare,
  computePhilHealthErShare,
  computePagIbigErShare
} from '../utils/statutoryCalc';

interface PayrollTabProps {
  payrollRecords: PayrollRecord[];
  setPayrollRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  specialEntries?: SpecialEntry[];
  setSpecialEntries?: React.Dispatch<React.SetStateAction<SpecialEntry[]>>;
  employees: Employee[];
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
  sssBrackets?: SssBracket[];
  philhealthConfig?: PhilHealthConfig;
  pagibigConfig?: PagIbigConfig;
  taxBrackets?: TaxBracket[];
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

export default function PayrollTab({
  payrollRecords,
  setPayrollRecords,
  specialEntries = [],
  setSpecialEntries,
  employees,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch,
  sssBrackets = [],
  philhealthConfig,
  pagibigConfig,
  taxBrackets = []
}: PayrollTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'register' | 'annual_summary'>('entry');

  // Header & Period State
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.employee_id || '');
  const [payYear, setPayYear] = useState('2024');
  const [periodFrom, setPeriodFrom] = useState('01/01');
  const [periodTo, setPeriodTo] = useState('12/31');
  const [payPeriodDate, setPayPeriodDate] = useState('2024-12-31');

  // Statutory Checkbox
  const [isSubjectToContributions, setIsSubjectToContributions] = useState<boolean>(true);
  const [isMwe, setIsMwe] = useState<boolean>(false);
  const [smwDay, setSmwDay] = useState('0');
  const [smwMonth, setSmwMonth] = useState('0');
  const [isMainEmployer, setIsMainEmployer] = useState<boolean>(true);

  // Previous Employer Info
  const [prevEmployerTin, setPrevEmployerTin] = useState('');
  const [prevEmployerName, setPrevEmployerName] = useState('');
  const [item22TaxablePrev, setItem22TaxablePrev] = useState('0');

  // --- BIR 2316 EXACT ITEM FIELDS ---
  // A. NON-TAXABLE / EXEMPT COMPENSATION INCOME (Part IV-B)
  const [item29BasicExempt, setItem29BasicExempt] = useState('0'); // Basic Salary (≤250k / MWE)
  const [item30HolidayPay, setItem30HolidayPay] = useState('0'); // Holiday Pay
  const [item31OvertimeExempt, setItem31OvertimeExempt] = useState('0'); // Overtime Pay (MWE)
  const [item32NightDiff, setItem32NightDiff] = useState('0'); // Night Shift Differential (MWE)
  const [item33HazardPay, setItem33HazardPay] = useState('0'); // Hazard Pay (MWE)
  const [item34ThirteenthMonthExempt, setItem34ThirteenthMonthExempt] = useState('0'); // 13th Month ≤ P90,000
  const [item35DeMinimis, setItem35DeMinimis] = useState('0'); // De Minimis Benefits
  const [item36SssDeduction, setItem36SssDeduction] = useState('0'); // SSS/GSIS/PHIC/PagIBIG (EE Share)
  const [item36PhilHealthDeduction, setItem36PhilHealthDeduction] = useState('0');
  const [item36PagIbigDeduction, setItem36PagIbigDeduction] = useState('0');
  const [item37OtherNonTaxable, setItem37OtherNonTaxable] = useState('0'); // Salaries & Other Non-Taxable

  // B. TAXABLE COMPENSATION INCOME (Part IV-B)
  // Regular
  const [item39BasicTaxable, setItem39BasicTaxable] = useState('0'); // Basic Salary
  const [item40Representation, setItem40Representation] = useState('0');
  const [item41Transportation, setItem41Transportation] = useState('0');
  const [item42Cola, setItem42Cola] = useState('0');
  const [item43HousingAllowance, setItem43HousingAllowance] = useState('0');
  const [item44aLabel, setItem44aLabel] = useState('');
  const [item44aVal, setItem44aVal] = useState('0');
  const [item44bLabel, setItem44bLabel] = useState('');
  const [item44bVal, setItem44bVal] = useState('0');

  // Supplementary
  const [item45Commission, setItem45Commission] = useState('0');
  const [item46ProfitSharing, setItem46ProfitSharing] = useState('0');
  const [item47DirectorsFees, setItem47DirectorsFees] = useState('0');
  const [item48ThirteenthMonthTaxable, setItem48ThirteenthMonthTaxable] = useState('0'); // Taxable 13th Month Benefits
  const [item49HazardPayTaxable, setItem49HazardPayTaxable] = useState('0'); // Hazard Pay Taxable
  const [item50OvertimeTaxable, setItem50OvertimeTaxable] = useState('0'); // Overtime Pay
  const [item51aLabel, setItem51aLabel] = useState('');
  const [item51aVal, setItem51aVal] = useState('0');
  const [item51bLabel, setItem51bLabel] = useState('');
  const [item51bVal, setItem51bVal] = useState('0'); // Others (Specify 51B)

  // Taxes & Deductions & Credits
  const [withholdingTax, setWithholdingTax] = useState('0');
  const [item27PeraCredit, setItem27PeraCredit] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');

  // Loans & Additional Non-Taxable Breakdown (Feeds Item 37)
  const [sssLoan, setSssLoan] = useState('0'); // SSS Loan
  const [pagibigLoan, setPagIbigLoan] = useState('0'); // Pag-IBIG Loan
  const [otherNonTaxableItems, setOtherNonTaxableItems] = useState('0'); // Other Non-Taxable Compensation

  // Additional Salary Deductions
  const [advances, setAdvances] = useState('0'); // Cash Advances
  const [absentsTardiness, setAbsentsTardiness] = useState('0'); // Absents & Tardiness
  const [otherSalaryDeductions, setOtherSalaryDeductions] = useState('0'); // Other Salary Deductions

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSummaryEmpId, setSelectedSummaryEmpId] = useState(employees[0]?.employee_id || '');
  const [selectedSummaryYear, setSelectedSummaryYear] = useState('2024');

  // Auto Compute Item 36 Total (SSS + PHIC + HDMF EE Shares)
  const totalItem36 = useMemo(() => {
    return (parseFloat(item36SssDeduction) || 0) + (parseFloat(item36PhilHealthDeduction) || 0) + (parseFloat(item36PagIbigDeduction) || 0);
  }, [item36SssDeduction, item36PhilHealthDeduction, item36PagIbigDeduction]);

  // Auto Compute Item 37 Total (SSS Loan + Pag-IBIG Loan + Other Non-Taxable)
  const totalItem37 = useMemo(() => {
    return (parseFloat(sssLoan) || 0) + (parseFloat(pagibigLoan) || 0) + (parseFloat(otherNonTaxableItems) || 0);
  }, [sssLoan, pagibigLoan, otherNonTaxableItems]);

  // Keep Item 37 state in sync with totalItem37 if loans/other non-taxable are specified
  const effectiveItem37 = useMemo(() => {
    const calc = totalItem37;
    const direct = parseFloat(item37OtherNonTaxable) || 0;
    return Math.max(calc, direct);
  }, [totalItem37, item37OtherNonTaxable]);

  // Load Model Sample values from User's Uploaded BIR 2316 Image
  const handleLoadModelImageValues = () => {
    setPayYear('2024');
    setPeriodFrom('01/01');
    setPeriodTo('05/08');
    setPayPeriodDate('2024-05-08');

    setItem29BasicExempt('0.00');
    setItem30HolidayPay('0.00');
    setItem31OvertimeExempt('0.00');
    setItem32NightDiff('0.00');
    setItem33HazardPay('0.00');
    setItem34ThirteenthMonthExempt('90000.00');
    setItem35DeMinimis('0.00');

    setItem36SssDeduction('12010.00');
    setItem36PhilHealthDeduction('0.00');
    setItem36PagIbigDeduction('0.00');
    setSssLoan('0.00');
    setPagIbigLoan('0.00');
    setOtherNonTaxableItems('0.00');
    setItem37OtherNonTaxable('0.00');

    setItem39BasicTaxable('155697.54');
    setItem40Representation('0.00');
    setItem41Transportation('0.00');
    setItem42Cola('0.00');
    setItem43HousingAllowance('0.00');
    setItem44aLabel('');
    setItem44aVal('0.00');
    setItem44bLabel('');
    setItem44bVal('0.00');

    setItem45Commission('0.00');
    setItem46ProfitSharing('0.00');
    setItem47DirectorsFees('0.00');
    setItem48ThirteenthMonthTaxable('54432.08');
    setItem49HazardPayTaxable('0.00');
    setItem50OvertimeTaxable('-80.84');
    setItem51aLabel('');
    setItem51aVal('0.00');
    setItem51bLabel('Adjustments');
    setItem51bVal('13631.83');

    setWithholdingTax('0.00');
    setItem27PeraCredit('0.00');
    setItem22TaxablePrev('0.00');
    setAdvances('0.00');
    setAbsentsTardiness('0.00');
    setOtherSalaryDeductions('0.00');

    triggerAlert('Loaded EXACT sample values from the BIR 2316 Form model image! (Gross: ₱325,690.61 | Non-Taxable: ₱102,010.00 | Taxable: ₱223,680.61)', 'success');
  };

  // Live Auto Calculations for Subtotals
  const totalNonTaxable = useMemo(() => {
    return (
      (parseFloat(item29BasicExempt) || 0) +
      (parseFloat(item30HolidayPay) || 0) +
      (parseFloat(item31OvertimeExempt) || 0) +
      (parseFloat(item32NightDiff) || 0) +
      (parseFloat(item33HazardPay) || 0) +
      (parseFloat(item34ThirteenthMonthExempt) || 0) +
      (parseFloat(item35DeMinimis) || 0) +
      totalItem36 +
      effectiveItem37
    );
  }, [item29BasicExempt, item30HolidayPay, item31OvertimeExempt, item32NightDiff, item33HazardPay, item34ThirteenthMonthExempt, item35DeMinimis, totalItem36, effectiveItem37]);

  const totalTaxable = useMemo(() => {
    return (
      (parseFloat(item39BasicTaxable) || 0) +
      (parseFloat(item40Representation) || 0) +
      (parseFloat(item41Transportation) || 0) +
      (parseFloat(item42Cola) || 0) +
      (parseFloat(item43HousingAllowance) || 0) +
      (parseFloat(item44aVal) || 0) +
      (parseFloat(item44bVal) || 0) +
      (parseFloat(item45Commission) || 0) +
      (parseFloat(item46ProfitSharing) || 0) +
      (parseFloat(item47DirectorsFees) || 0) +
      (parseFloat(item48ThirteenthMonthTaxable) || 0) +
      (parseFloat(item49HazardPayTaxable) || 0) +
      (parseFloat(item50OvertimeTaxable) || 0) +
      (parseFloat(item51aVal) || 0) +
      (parseFloat(item51bVal) || 0)
    );
  }, [item39BasicTaxable, item40Representation, item41Transportation, item42Cola, item43HousingAllowance, item44aVal, item44bVal, item45Commission, item46ProfitSharing, item47DirectorsFees, item48ThirteenthMonthTaxable, item49HazardPayTaxable, item50OvertimeTaxable, item51aVal, item51bVal]);

  const totalGrossCompensation = useMemo(() => {
    return totalNonTaxable + totalTaxable;
  }, [totalNonTaxable, totalTaxable]);

  const grossTaxableCompensation = useMemo(() => {
    return totalTaxable + (parseFloat(item22TaxablePrev) || 0);
  }, [totalTaxable, item22TaxablePrev]);

  // Tax Due following the Contribution Table / Graduated Income Tax Table
  const calculatedTaxFromTable = useMemo(() => {
    if (isMwe) return 0;
    return computeWithholdingTax(grossTaxableCompensation, taxBrackets, undefined, isMwe);
  }, [isMwe, grossTaxableCompensation, taxBrackets]);

  // AUTOMATIC REAL-TIME CALCULATION: Live sync Withholding Tax with Graduated Tax Brackets
  useEffect(() => {
    if (isMwe) {
      setWithholdingTax('0.00');
    } else {
      setWithholdingTax(calculatedTaxFromTable.toString());
    }
  }, [calculatedTaxFromTable, isMwe]);

  // AUTOMATIC REAL-TIME CALCULATION: Live sync Statutory Contributions (SSS, PhilHealth, Pag-IBIG)
  useEffect(() => {
    if (!isSubjectToContributions) {
      setItem36SssDeduction('0');
      setItem36PhilHealthDeduction('0');
      setItem36PagIbigDeduction('0');
      return;
    }
    const salary = parseFloat(item39BasicTaxable) || parseFloat(item29BasicExempt) || currentEmp?.monthly_rate || 0;
    if (salary > 0) {
      const sss = sssBrackets && sssBrackets.length > 0 ? computeSssDeduction(salary, sssBrackets) : 0;
      const phic = philhealthConfig ? computePhilHealthDeduction(salary, philhealthConfig) : 0;
      const hdmf = pagibigConfig ? computePagIbigDeduction(salary, pagibigConfig) : 0;
      setItem36SssDeduction(sss.toString());
      setItem36PhilHealthDeduction(phic.toString());
      setItem36PagIbigDeduction(hdmf.toString());
    }
  }, [item39BasicTaxable, item29BasicExempt, isSubjectToContributions, sssBrackets, philhealthConfig, pagibigConfig]);

  const totalStatDeductions = useMemo(() => {
    return totalItem36;
  }, [totalItem36]);

  const totalLoans = useMemo(() => {
    return (parseFloat(sssLoan) || 0) + (parseFloat(pagibigLoan) || 0);
  }, [sssLoan, pagibigLoan]);

  const totalSalaryDeductions = useMemo(() => {
    return (parseFloat(advances) || 0) + (parseFloat(absentsTardiness) || 0) + totalLoans + (parseFloat(otherSalaryDeductions) || 0);
  }, [advances, absentsTardiness, totalLoans, otherSalaryDeductions]);

  const totalAllDeductions = useMemo(() => {
    return totalStatDeductions + (parseFloat(withholdingTax) || 0) + (parseFloat(otherDeductions) || 0) + totalSalaryDeductions;
  }, [totalStatDeductions, withholdingTax, otherDeductions, totalSalaryDeductions]);

  const netPay = useMemo(() => {
    return totalGrossCompensation - totalAllDeductions;
  }, [totalGrossCompensation, totalAllDeductions]);

  const currentEmp = useMemo(() => {
    return employees.find(e => e.employee_id === selectedEmpId || e.id.toString() === selectedEmpId);
  }, [employees, selectedEmpId]);

  // Handle MWE Toggle explicitly
  const handleToggleMwe = (checked: boolean) => {
    setIsMwe(checked);
    if (checked) {
      const currentTaxable = parseFloat(item39BasicTaxable) || 0;
      if (currentTaxable > 0) {
        setItem29BasicExempt(currentTaxable.toString());
        setItem39BasicTaxable('0');
      }
      setWithholdingTax('0.00');
      triggerAlert('11 MWE Exempt enabled: Salary moved to Item 29 (Exempt Basic) and Withholding Tax set to ₱0.00.', 'info');
    }
  };

  // Auto Compute Statutory Contributions (SSS, PHIC, Pag-IBIG EE Shares)
  const handleAutoComputeStatutory = () => {
    const salary = parseFloat(item39BasicTaxable) || parseFloat(item29BasicExempt) || currentEmp?.monthly_rate || 0;
    if (salary <= 0) {
      triggerAlert('Please enter or select a basic salary first to auto compute statutory contributions.', 'error');
      return;
    }
    const sss = sssBrackets && sssBrackets.length > 0 ? computeSssDeduction(salary, sssBrackets) : 0;
    const phic = philhealthConfig ? computePhilHealthDeduction(salary, philhealthConfig) : 0;
    const hdmf = pagibigConfig ? computePagIbigDeduction(salary, pagibigConfig) : 0;

    setItem36SssDeduction(sss.toString());
    setItem36PhilHealthDeduction(phic.toString());
    setItem36PagIbigDeduction(hdmf.toString());

    triggerAlert(`Auto-computed Statutory EE Shares: SSS: ₱${sss.toFixed(2)}, PHIC: ₱${phic.toFixed(2)}, HDMF: ₱${hdmf.toFixed(2)} → Total Item 36: ₱${(sss + phic + hdmf).toFixed(2)}`, 'success');
  };

  // Auto Compute Tax Due from Graduated Tax Table
  const handleAutoComputeTax = () => {
    if (isMwe) {
      setWithholdingTax('0.00');
      triggerAlert('🛡️ Employee is MWE Statutory Tax Exempt under RA 9504 / TRAIN Law. Income Tax Due: ₱0.00', 'info');
      return;
    }
    const tax = calculatedTaxFromTable;
    setWithholdingTax(tax.toString());
    triggerAlert(`Auto-computed Income Tax Due from Graduated Tax Table: ₱${tax.toFixed(2)}`, 'success');
  };

  // Handle Employee Selection
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.employee_id === empId || e.id.toString() === empId);
    if (emp) {
      const monthly = emp.monthly_rate || 0;
      const empIsMwe = monthly > 0 && monthly <= 20833.33;
      setIsMwe(empIsMwe);

      if (empIsMwe) {
        setItem29BasicExempt(monthly.toString());
        setItem39BasicTaxable('0');
        setWithholdingTax('0.00');
      } else {
        setItem29BasicExempt('0');
        setItem39BasicTaxable(monthly.toString());
        const tax = computeWithholdingTax(monthly, taxBrackets, 'Monthly', false);
        setWithholdingTax(tax.toString());
      }
      setIsSubjectToContributions(emp.subject_to_contributions !== false);

      // Auto compute statutory for this employee
      if (monthly > 0) {
        const sss = sssBrackets && sssBrackets.length > 0 ? computeSssDeduction(monthly, sssBrackets) : 0;
        const phic = philhealthConfig ? computePhilHealthDeduction(monthly, philhealthConfig) : 0;
        const hdmf = pagibigConfig ? computePagIbigDeduction(monthly, pagibigConfig) : 0;

        setItem36SssDeduction(sss.toString());
        setItem36PhilHealthDeduction(phic.toString());
        setItem36PagIbigDeduction(hdmf.toString());
      }
    }
  };

  // Form submit
  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first!', 'error');
      return;
    }
    const emp = employees.find(e => e.employee_id === selectedEmpId || e.id.toString() === selectedEmpId);
    if (!emp) {
      triggerAlert('Please select a valid employee!', 'error');
      return;
    }

    const periodStr = `${payYear}-${periodFrom.replace('/', '')}`;

    const newRecord: PayrollRecord = {
      id: Date.now(),
      company_name: activeCompany.company_name,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      payroll_period: periodStr,
      tax_year: payYear,
      period_from: periodFrom,
      period_to: periodTo,
      subject_to_contributions: isSubjectToContributions,
      is_mwe: isMwe,
      statutory_mwe_day: parseFloat(smwDay) || 0,
      statutory_mwe_month: parseFloat(smwMonth) || 0,
      is_main_employer: isMainEmployer,

      prev_employer_tin: prevEmployerTin,
      prev_employer_name: prevEmployerName,
      item22_taxable_prev_employer: parseFloat(item22TaxablePrev) || 0,

      // Part IV-B (A) Non-Taxable
      basic_pay: parseFloat(item29BasicExempt) || 0,
      holiday_pay: parseFloat(item30HolidayPay) || 0,
      overtime_pay: parseFloat(item31OvertimeExempt) || 0,
      night_differential: parseFloat(item32NightDiff) || 0,
      hazard_pay: parseFloat(item33HazardPay) || 0,
      thirteenth_month_pay: parseFloat(item34ThirteenthMonthExempt) || 0,
      de_minimis_benefits: parseFloat(item35DeMinimis) || 0,
      sss_deduction: parseFloat(item36SssDeduction) || 0,
      philhealth_deduction: parseFloat(item36PhilHealthDeduction) || 0,
      pagibig_deduction: parseFloat(item36PagIbigDeduction) || 0,
      other_non_taxable: effectiveItem37,

      // Part IV-B (B) Taxable Regular
      taxable_basic: parseFloat(item39BasicTaxable) || 0,
      representation: parseFloat(item40Representation) || 0,
      transportation: parseFloat(item41Transportation) || 0,
      cola: parseFloat(item42Cola) || 0,
      housing_allowance: parseFloat(item43HousingAllowance) || 0,
      item44a_label: item44aLabel,
      item44a_val: parseFloat(item44aVal) || 0,
      item44b_label: item44bLabel,
      item44b_val: parseFloat(item44bVal) || 0,

      // Supplementary Taxable
      commission: parseFloat(item45Commission) || 0,
      profit_sharing: parseFloat(item46ProfitSharing) || 0,
      directors_fees: parseFloat(item47DirectorsFees) || 0,
      taxable_thirteenth_month: parseFloat(item48ThirteenthMonthTaxable) || 0,
      item49_hazard_pay_taxable: parseFloat(item49HazardPayTaxable) || 0,
      taxable_overtime: parseFloat(item50OvertimeTaxable) || 0,
      item51a_label: item51aLabel,
      item51a_val: parseFloat(item51aVal) || 0,
      item51b_label: item51bLabel,
      item51b_val: parseFloat(item51bVal) || 0,

      item27_pera_tax_credit: parseFloat(item27PeraCredit) || 0,

      allowances: (parseFloat(item40Representation) || 0) + (parseFloat(item41Transportation) || 0) + (parseFloat(item44aVal) || 0) + (parseFloat(item44bVal) || 0),
      gross_pay: totalGrossCompensation,
      withholding_tax: parseFloat(withholdingTax) || 0,
      other_deductions: parseFloat(otherDeductions) || 0,
      advances: parseFloat(advances) || 0,
      absents_tardiness: parseFloat(absentsTardiness) || 0,
      sss_loan: parseFloat(sssLoan) || 0,
      pagibig_loan: parseFloat(pagibigLoan) || 0,
      other_salary_deductions: parseFloat(otherSalaryDeductions) || 0,
      total_deductions: totalAllDeductions,
      net_pay: netPay,
      status: 'Processed'
    };

    setPayrollRecords(prev => {
      const filtered = prev.filter(p => !(p.employee_id === emp.employee_id && p.payroll_period === periodStr));
      return [newRecord, ...filtered];
    });

    // AUTO-LOG JOURNAL ENTRY
    if (setSpecialEntries) {
      const eeVoucherNo = `JV-PAY-${emp.employee_id}-${payYear}`;
      const sss = parseFloat(item36SssDeduction) || 0;
      const phic = parseFloat(item36PhilHealthDeduction) || 0;
      const hdmf = parseFloat(item36PagIbigDeduction) || 0;
      const tax = parseFloat(withholdingTax) || 0;
      const other = parseFloat(otherDeductions) || 0;

      const eeLines: SpecialEntryLine[] = [
        { id: '1', account_code: '6010', account_title: 'Salaries, Wages & Benefits', type: 'Debit', amount: totalGrossCompensation }
      ];

      if (sss > 0) eeLines.push({ id: '2', account_code: '2041', account_title: 'SSS Premium Payable', type: 'Credit', amount: sss });
      if (phic > 0) eeLines.push({ id: '3', account_code: '2042', account_title: 'PhilHealth Premium Payable', type: 'Credit', amount: phic });
      if (hdmf > 0) eeLines.push({ id: '4', account_code: '2043', account_title: 'Pag-IBIG Premium Payable', type: 'Credit', amount: hdmf });
      if (tax > 0) eeLines.push({ id: '5', account_code: '2035', account_title: 'Withholding Tax Payable - Compensation (BIR 1601-C)', type: 'Credit', amount: tax });
      if (other > 0) eeLines.push({ id: '6', account_code: '2050', account_title: 'Other Employee Payables & Deductions', type: 'Credit', amount: other });
      if (netPay > 0) eeLines.push({ id: '7', account_code: '1010', account_title: 'Cash and Cash Equivalents', type: 'Credit', amount: netPay });

      const eeEntry: SpecialEntry = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        entry_number: eeVoucherNo,
        voucher_no: eeVoucherNo,
        entry_date: payPeriodDate,
        entry_type: 'Payroll Entry',
        description: `Payroll Entry for ${emp.full_name} (${emp.employee_id}), Period: ${payYear} (${periodFrom}-${periodTo})`,
        lines: eeLines,
        created_at: new Date().toISOString()
      };

      setSpecialEntries(prev => [eeEntry, ...prev.filter(s => s.voucher_no !== eeVoucherNo)]);
    }

    triggerAlert(`Payroll saved for ${emp.full_name}! Gross Pay: ₱${totalGrossCompensation.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Synced directly to BIR Form 2316 Certificate.`, 'success');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this payroll record?')) {
      setPayrollRecords(prev => prev.filter(p => p.id !== id));
      triggerAlert('Payroll record removed.', 'info');
    }
  };

  const filteredPayroll = payrollRecords.filter(p => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return (p.full_name || p.employee_name || '').toLowerCase().includes(q) || 
      String(p.employee_id || '').toLowerCase().includes(q) || 
      String(p.payroll_period || '').includes(q);
  });

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              Payroll Management & Register (BIR Form 2316 Fillable Structure)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Fillable payroll records for Jan to Dec. Follows the <strong>EXACT structure & line numbers of BIR Form 2316 (September 2021 ENCS)</strong>. Every record feeds into <strong>6. BIR Attachments → BIR 2316 Certificate</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadModelImageValues}
              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Click to populate exact numbers from the uploaded sample BIR Form 2316 image"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Load Model Image Sample
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('entry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'entry' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Fillable BIR 2316 Entry
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('register')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'register' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Payroll Register Logs
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: EXACT FILLABLE BIR 2316 FORM (LIGHT THEME) */}
      {activeSubTab === 'entry' && (
        <form onSubmit={handleCreatePayroll} className="space-y-6">
          
          {/* HEADER SELECTION BOX & TOP ACTION BAR */}
          <div className="p-5 bg-slate-100 border border-slate-300 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-medium cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id}) - ₱{(emp.monthly_rate || 0).toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">1 For the Year (YYYY) *</label>
                <input
                  type="text"
                  value={payYear}
                  onChange={(e) => setPayYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center font-bold shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">2 For Period (MM/DD) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="01/01"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center shadow-sm"
                  />
                  <span className="self-center text-xs text-slate-500 font-semibold">To</span>
                  <input
                    type="text"
                    placeholder="12/31"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Posting Date *</label>
                <input
                  type="date"
                  value={payPeriodDate}
                  onChange={(e) => setPayPeriodDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono shadow-sm"
                  required
                />
              </div>
            </div>

            {/* NET PAY & SAVE BUTTON AT TOP */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-slate-800">
              <div className="flex flex-wrap items-center gap-5">
                <div className="bg-emerald-950/80 px-4 py-2 rounded-lg border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">Net Pay Received by Employee</span>
                  <span className="text-xl font-extrabold text-emerald-300 font-mono">₱{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="text-[11px] font-mono space-y-0.5">
                  <div className="text-slate-300">
                    Gross Pay: <span className="font-bold text-white">₱{totalGrossCompensation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-blue-300">
                    Statutory Deductions (Item 36): <span className="font-bold text-blue-200">(₱{totalStatDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                  <div className="text-amber-300">
                    Tax Withheld (Item 24/28): <span className="font-bold text-amber-200">(₱{(parseFloat(withholdingTax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                  <div className="text-rose-300">
                    Salary Deductions & Advances: <span className="font-bold text-rose-200">(₱{totalSalaryDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 text-xs font-extrabold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Save Payroll Record & Sync to BIR 2316 Certificate
              </button>
            </div>
          </div>

          {/* EXACT BIR FORM 2316 REPLICA CONTAINER (LIGHT THEME) */}
          <div className="border-2 border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xl font-mono text-xs">
            
            {/* FORM BANNER */}
            <div className="bg-slate-100 border-b-2 border-slate-300 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white font-extrabold px-3 py-1 rounded-lg text-lg font-sans shadow-sm">
                    BIR Form 2316
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase font-sans">
                      Certificate of Compensation Payment / Tax Withheld
                    </h3>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Official September 2021 (ENCS) Fillable Payroll Worksheet
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-sans">
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      checked={isMwe}
                      onChange={(e) => handleToggleMwe(e.target.checked)}
                      className="rounded border-slate-300 accent-amber-600"
                    />
                    <span>11 Minimum Wage Earner (MWE)</span>
                  </label>
                </div>
              </div>

              {/* FIELD HIGHLIGHT LEGEND */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-sans shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700">💡 Field Guide:</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-medium text-[10px]">
                    ✏️ White Box = Manual Input Field
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                    ⚡ Highlighted & Locked (🔒) = Auto-Computed / Read-Only Field
                  </span>
                </div>
                {isMwe && (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1">
                    🛡️ MWE Statutory Exempt (RA 9504) — Tax Withheld: ₱0.00
                  </span>
                )}
              </div>
            </div>

            {/* FORM BODY GRID */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50">

              {/* LEFT COLUMN: PART I, II, III & PART IVA SUMMARY */}
              <div className="space-y-5">
                
                {/* PART I - EMPLOYEE INFORMATION */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs shadow-sm">
                  <div className="font-bold text-blue-700 uppercase font-sans text-[11px] flex justify-between border-b border-slate-200 pb-1">
                    <span>Part I - Employee Information</span>
                    <span className="text-slate-500 font-mono">Items 3 - 11</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">3 Employee TIN</span>
                      <span className="font-mono font-bold text-slate-900 block bg-slate-100 p-1.5 rounded border border-slate-200">{currentEmp?.tin || '000-000-000-000'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">4 Employee Name</span>
                      <span className="font-bold text-slate-900 block bg-slate-100 p-1.5 rounded border border-slate-200 truncate">{currentEmp?.full_name || 'Select Employee'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">5 RDO Code</span>
                      <span className="font-mono text-slate-800 block bg-slate-100 p-1 rounded border border-slate-200">{activeCompany?.rdo_code || '050'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block">6 Registered Address</span>
                      <span className="text-slate-800 block bg-slate-100 p-1 rounded border border-slate-200 truncate">{activeCompany?.registered_address || 'METRO MANILA'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">9 SMW Rate per Day</label>
                      <input
                        type="number"
                        step="0.01"
                        value={smwDay}
                        onChange={(e) => setSmwDay(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">10 SMW Rate per Month</label>
                      <input
                        type="number"
                        step="0.01"
                        value={smwMonth}
                        onChange={(e) => setSmwMonth(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-sans text-[11px] gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-semibold">
                      <input
                        type="checkbox"
                        checked={isMwe}
                        onChange={(e) => setIsMwe(e.target.checked)}
                        className="rounded border-slate-300 accent-amber-600"
                      />
                      <span>11 MWE Exempt</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-blue-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={isMainEmployer}
                        onChange={(e) => setIsMainEmployer(e.target.checked)}
                        className="rounded border-slate-300 accent-blue-600"
                      />
                      <span>15 Main Employer</span>
                    </label>
                  </div>
                </div>

                {/* PART II - EMPLOYER INFORMATION (PRESENT) */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-sm">
                  <div className="font-bold text-blue-700 uppercase font-sans text-[11px] flex justify-between border-b border-slate-200 pb-1">
                    <span>Part II - Employer Information (Present)</span>
                    <span className="text-slate-500 font-mono">Items 12 - 15</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">12 Employer TIN</span>
                      <span className="font-mono font-bold text-slate-900 block bg-slate-100 p-1.5 rounded border border-slate-200">{activeCompany?.company_tin || '000-000-000-000'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">13 Employer Name</span>
                      <span className="font-bold text-slate-900 block bg-slate-100 p-1.5 rounded border border-slate-200 truncate">{activeCompany?.company_name || 'Active Employer'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">14 Registered Address</span>
                    <span className="text-slate-800 block bg-slate-100 p-1.5 rounded border border-slate-200 truncate">{activeCompany?.company_address || 'Registered Office Address'}</span>
                  </div>
                </div>

                {/* PART III - EMPLOYER INFORMATION (PREVIOUS) */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-sm">
                  <div className="font-bold text-blue-700 uppercase font-sans text-[11px] flex justify-between border-b border-slate-200 pb-1">
                    <span>Part III - Employer Information (Previous)</span>
                    <span className="text-slate-500 font-mono">Items 16 - 18</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">16 Previous Employer TIN</label>
                      <input
                        type="text"
                        placeholder="000-000-000-000"
                        value={prevEmployerTin}
                        onChange={(e) => setPrevEmployerTin(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">17 Previous Employer Name</label>
                      <input
                        type="text"
                        placeholder="Previous Co."
                        value={prevEmployerName}
                        onChange={(e) => setPrevEmployerName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* PART IVA - SUMMARY */}
                <div className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                    <div className="font-extrabold text-amber-900 uppercase font-sans text-xs flex items-center gap-1.5">
                      <span>Part IVA - Summary</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Auto-Calculated Totals</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoComputeTax}
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1 font-sans cursor-pointer shadow-sm"
                      title="Calculates tax due based on the Contribution Table graduated tax brackets"
                    >
                      <Calculator className="w-3 h-3" />
                      Auto-Compute Tax (BIR Table)
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Item 19 - Auto Computed */}
                    <div className="flex justify-between items-center bg-blue-100/80 border-2 border-blue-300 p-2 rounded-lg">
                      <div>
                        <span className="text-[11px] font-bold text-blue-900 block">19 Gross Compensation Income</span>
                        <span className="text-[10px] text-blue-700 font-sans block">⚡ Auto-Computed (Item 38 + Item 52) 🔒</span>
                      </div>
                      <span className="font-extrabold text-blue-900 text-sm font-mono">₱{totalGrossCompensation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Item 20 - Auto Computed */}
                    <div className="flex justify-between items-center bg-rose-100/80 border-2 border-rose-300 p-2 rounded-lg">
                      <div>
                        <span className="text-[11px] font-bold text-rose-900 block">20 Less: Total Non-Taxable Compensation</span>
                        <span className="text-[10px] text-rose-700 font-sans block">⚡ Auto-Computed (From Item 38) 🔒</span>
                      </div>
                      <span className="font-extrabold text-rose-800 text-sm font-mono">(₱{totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                    </div>

                    {/* Item 21 - Auto Computed */}
                    <div className="flex justify-between items-center bg-amber-100/90 border-2 border-amber-300 p-2 rounded-lg">
                      <div>
                        <span className="text-[11px] font-bold text-amber-950 block">21 Taxable Compensation Income</span>
                        <span className="text-[10px] text-amber-800 font-sans block">⚡ Auto-Computed (Item 19 - Item 20) 🔒</span>
                      </div>
                      <span className="font-extrabold text-amber-950 text-sm font-mono">₱{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Item 22 - Editable Input */}
                    <div className="flex justify-between items-center gap-2 pt-1 bg-white p-2 rounded-lg border border-slate-300">
                      <div>
                        <label className="text-[11px] font-bold text-slate-800 block">22 Add: Taxable Income from Previous Employer</label>
                        <span className="text-[10px] text-slate-500 font-sans block">✏️ Manual Input</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={item22TaxablePrev}
                        onChange={(e) => setItem22TaxablePrev(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold font-mono"
                      />
                    </div>

                    {/* Item 23 - Auto Computed */}
                    <div className="flex justify-between items-center bg-amber-200/90 border-2 border-amber-400 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-extrabold text-amber-950 block">23 Gross Taxable Compensation Income</span>
                        <span className="text-[10px] text-amber-900 font-sans block font-semibold">⚡ Auto-Computed (Item 21 + Item 22) 🔒</span>
                      </div>
                      <span className="font-extrabold text-amber-950 text-sm font-mono">₱{grossTaxableCompensation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Item 24 - Tax Due with Auto-Compute */}
                    <div className="p-2.5 bg-rose-50 border-2 border-rose-300 rounded-lg space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] text-rose-950 font-extrabold block">24 Tax Due (Graduated Income Tax Bracket)</label>
                          <span className="text-[10px] text-rose-700 font-sans block font-semibold">
                            {isMwe ? '🛡️ MWE Statutory Exempt (RA 9504 / TRAIN Law)' : '⚡ Auto-Computed from BIR Tax Table or Editable'}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={withholdingTax}
                          onChange={(e) => setWithholdingTax(e.target.value)}
                          className={`w-36 px-2.5 py-1 text-right rounded-lg border-2 font-mono font-extrabold text-sm shadow-sm ${
                            isMwe ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-white border-rose-500 text-rose-700'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Item 27 - Editable Input */}
                    <div className="flex justify-between items-center gap-2 bg-white p-2 rounded-lg border border-slate-300">
                      <div>
                        <label className="text-[11px] text-slate-700 flex-1 font-semibold">27 5% Tax Credit (PERA Act of 2008)</label>
                        <span className="text-[10px] text-slate-500 font-sans block">✏️ Manual Input</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={item27PeraCredit}
                        onChange={(e) => setItem27PeraCredit(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono"
                      />
                    </div>

                    {/* Item 28 - Auto Computed */}
                    <div className="flex justify-between items-center bg-emerald-100/90 border-2 border-emerald-400 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-extrabold text-emerald-950 block">28 Total Taxes Withheld</span>
                        <span className="text-[10px] text-emerald-800 font-sans block font-semibold">⚡ Auto-Computed Net Tax Withheld 🔒</span>
                      </div>
                      <span className="font-extrabold text-emerald-950 text-base font-mono">₱{(parseFloat(withholdingTax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM LEFT: ADVANCES, LOANS, ABSENTS & SALARY DEDUCTIONS BREAKDOWN */}
                <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-xl space-y-3 shadow-sm">
                  <div className="border-b border-slate-300 pb-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 font-sans uppercase tracking-wider flex items-center justify-between">
                      <span>Advances, Loans, Absents & Salary Deductions</span>
                      <span className="font-mono text-emerald-700 text-sm font-extrabold">Net: ₱{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </h4>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Deductions subtracted from Gross Compensation to calculate Net Pay.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <label className="font-bold text-rose-700 block text-[10px]">Advances (Cash Advances)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={advances}
                        onChange={(e) => setAdvances(e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <label className="font-bold text-rose-700 block text-[10px]">Absents & Tardiness</label>
                      <input
                        type="number"
                        step="0.01"
                        value={absentsTardiness}
                        onChange={(e) => setAbsentsTardiness(e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-200/90 border-2 border-slate-300 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 block text-[10px]">Employee Loans (SSS + HDMF)</label>
                        <span className="text-[9px] text-slate-600 font-bold">🔒 READ-ONLY</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={totalLoans}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-slate-100 text-slate-900 font-mono font-extrabold"
                      />
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <label className="font-bold text-rose-700 block text-[10px]">Other Salary Deductions</label>
                      <input
                        type="number"
                        step="0.01"
                        value={otherSalaryDeductions}
                        onChange={(e) => setOtherSalaryDeductions(e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-rose-900 bg-rose-100/90 p-2.5 rounded-lg border-2 border-rose-300">
                    <div>
                      <span>Total Additional Salary Deductions:</span>
                      <span className="text-[10px] text-rose-700 font-sans block font-semibold">⚡ Auto-Summed 🔒</span>
                    </div>
                    <span className="font-mono text-sm font-extrabold">₱{totalSalaryDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: PART IV-B DETAILS OF COMPENSATION INCOME */}
              <div className="space-y-4">
                
                {/* SECTION A: NON-TAXABLE / EXEMPT COMPENSATION INCOME */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="font-extrabold text-blue-800 uppercase font-sans text-xs border-b border-slate-200 pb-1.5 flex justify-between items-center">
                    <span>A. NON-TAXABLE / EXEMPT COMPENSATION INCOME</span>
                    <span className="text-[10px] text-slate-500 font-mono">Items 29 - 38</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">29 Basic Salary (≤ ₱250k or MWE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item29BasicExempt}
                        onChange={(e) => setItem29BasicExempt(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">30 Holiday Pay (MWE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item30HolidayPay}
                        onChange={(e) => setItem30HolidayPay(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">31 Overtime Pay (MWE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item31OvertimeExempt}
                        onChange={(e) => setItem31OvertimeExempt(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">32 Night Shift Differential (MWE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item32NightDiff}
                        onChange={(e) => setItem32NightDiff(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">33 Hazard Pay (MWE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item33HazardPay}
                        onChange={(e) => setItem33HazardPay(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">34 13th Month Pay & Other Benefits (max ₱90,000)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item34ThirteenthMonthExempt}
                        onChange={(e) => setItem34ThirteenthMonthExempt(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">35 De Minimis Benefits</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item35DeMinimis}
                        onChange={(e) => setItem35DeMinimis(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    {/* DEDICATED STATUTORY CONTRIBUTIONS SUBSECTION (ITEM 36) */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mt-2">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                        <span className="font-extrabold text-blue-900 text-[11px] font-sans uppercase">
                          36 SSS, GSIS, PHIC & PAG-IBIG (EE SHARE BREAKDOWN)
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoComputeStatutory}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 font-sans cursor-pointer"
                        >
                          <Calculator className="w-3 h-3" />
                          Auto-Compute Shares
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-600 block">SSS EE Share</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item36SssDeduction}
                            onChange={(e) => setItem36SssDeduction(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">PhilHealth EE Share</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item36PhilHealthDeduction}
                            onChange={(e) => setItem36PhilHealthDeduction(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Pag-IBIG EE Share</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item36PagIbigDeduction}
                            onChange={(e) => setItem36PagIbigDeduction(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-blue-900 pt-1 border-t border-blue-200/80">
                        <span>Total Item 36 SSS/GSIS/PHIC/Pag-IBIG EE Shares:</span>
                        <span className="font-mono text-blue-800">₱{totalItem36.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* DEDICATED LOANS & NON-TAXABLE SECTION (ITEM 37) */}
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-2 mt-2">
                      <div className="font-extrabold text-slate-800 text-[11px] font-sans uppercase border-b border-slate-200 pb-1">
                        37 SALARIES & OTHER NON-TAXABLE COMPENSATION (LOANS & OTHER NON-TAXABLE)
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-600 block">SSS Loan Deduction</label>
                          <input
                            type="number"
                            step="0.01"
                            value={sssLoan}
                            onChange={(e) => setSssLoan(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Pag-IBIG Loan Deduction</label>
                          <input
                            type="number"
                            step="0.01"
                            value={pagibigLoan}
                            onChange={(e) => setPagIbigLoan(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Other Non-Taxable</label>
                          <input
                            type="number"
                            step="0.01"
                            value={otherNonTaxableItems}
                            onChange={(e) => setOtherNonTaxableItems(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-1 border-t border-slate-200">
                        <span>Total Item 37 Salaries & Other Non-Taxable:</span>
                        <span className="font-mono text-slate-900">₱{effectiveItem37.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-bold text-blue-900 bg-blue-100 p-2.5 rounded-xl border border-blue-300 text-xs mt-3 shadow-sm">
                      <span>38 Total Non-Taxable/Exempt Compensation</span>
                      <span className="text-sm font-extrabold font-mono">₱{totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION B: TAXABLE COMPENSATION INCOME REGULAR & SUPPLEMENTARY */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
                  <div className="font-extrabold text-amber-800 uppercase font-sans text-xs border-b border-slate-200 pb-1 flex justify-between">
                    <span>B. TAXABLE COMPENSATION INCOME REGULAR & SUPPLEMENTARY</span>
                    <span className="text-[10px] text-slate-500 font-mono">Items 39 - 52</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Regular</div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">39 Basic Salary</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item39BasicTaxable}
                        onChange={(e) => setItem39BasicTaxable(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">40 Representation</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item40Representation}
                        onChange={(e) => setItem40Representation(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">41 Transportation</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item41Transportation}
                        onChange={(e) => setItem41Transportation(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">42 Cost of Living Allowance (COLA)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item42Cola}
                        onChange={(e) => setItem42Cola(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">43 Fixed Housing Allowance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item43HousingAllowance}
                        onChange={(e) => setItem43HousingAllowance(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider pt-1">Supplementary</div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">45 Commission</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item45Commission}
                        onChange={(e) => setItem45Commission(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">46 Profit Sharing</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item46ProfitSharing}
                        onChange={(e) => setItem46ProfitSharing(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">47 Fees Including Director's Fees</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item47DirectorsFees}
                        onChange={(e) => setItem47DirectorsFees(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">48 Taxable 13th Month Benefits</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item48ThirteenthMonthTaxable}
                        onChange={(e) => setItem48ThirteenthMonthTaxable(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">49 Hazard Pay</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item49HazardPayTaxable}
                        onChange={(e) => setItem49HazardPayTaxable(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-700 flex-1">50 Overtime Pay</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item50OvertimeTaxable}
                        onChange={(e) => setItem50OvertimeTaxable(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-700 w-10">51B:</span>
                      <input
                        type="text"
                        placeholder="Others label (e.g. Adjustments)"
                        value={item51bLabel}
                        onChange={(e) => setItem51bLabel(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-900"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item51bVal}
                        onChange={(e) => setItem51bVal(e.target.value)}
                        className="w-32 px-2 py-1 text-xs text-right rounded border border-slate-300 bg-white text-slate-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between font-bold text-amber-900 bg-amber-100 p-2.5 rounded-xl border border-amber-300 text-xs mt-3 shadow-sm">
                      <span>52 Total Taxable Compensation Income</span>
                      <span className="text-sm font-extrabold font-mono">₱{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 2: REGISTER LOGS */}
      {activeSubTab === 'register' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-900">Logged Payroll Records Register</h3>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-right">Non-Taxable (38)</th>
                  <th className="p-3 text-right">Taxable (52)</th>
                  <th className="p-3 text-right">Gross Pay (19)</th>
                  <th className="p-3 text-right">Statutory (36)</th>
                  <th className="p-3 text-right">Tax Withheld (28)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayroll.length > 0 ? (
                  filteredPayroll.map(r => {
                    const nonTax = (Number(r.basic_pay) || 0) + (Number(r.thirteenth_month_pay) || 0) + (Number(r.sss_deduction) || 0) + (Number(r.philhealth_deduction) || 0) + (Number(r.pagibig_deduction) || 0);
                    const tax = (Number(r.taxable_basic) || 0) + (Number(r.taxable_thirteenth_month) || 0) + (Number(r.item51b_val) || 0) + (Number(r.taxable_overtime) || 0);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-blue-700">{r.payroll_period}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">{r.full_name} <span className="text-slate-500 font-mono text-[10px]">({r.employee_id})</span></td>
                        <td className="p-3 text-right">₱{nonTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-amber-800">₱{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₱{(Number(r.gross_pay) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">₱{((Number(r.sss_deduction) || 0) + (Number(r.philhealth_deduction) || 0) + (Number(r.pagibig_deduction) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-rose-700 font-bold">₱{(Number(r.withholding_tax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-800 cursor-pointer p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                      No payroll records found. Create one in the Fillable BIR 2316 Entry tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
