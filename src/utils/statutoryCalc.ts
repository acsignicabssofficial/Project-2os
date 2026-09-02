import { SssBracket, PhilHealthConfig, PagIbigConfig, TaxBracket } from '../types';

export function computeSssDeduction(monthlySalary: number, sssBrackets: SssBracket[]): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!sssBrackets || sssBrackets.length === 0) return 0;

  const match = sssBrackets.find(b => monthlySalary >= b.min_salary && monthlySalary <= b.max_salary);
  if (match) {
    return match.ee_share;
  }
  // If higher than max bracket
  const maxBracket = [...sssBrackets].sort((a, b) => b.max_salary - a.max_salary)[0];
  if (maxBracket && monthlySalary > maxBracket.max_salary) {
    return maxBracket.ee_share;
  }
  return 0;
}

export function computePhilHealthDeduction(monthlySalary: number, config: PhilHealthConfig): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!config) return 0;

  const boundedSalary = Math.min(Math.max(monthlySalary, config.min_monthly_salary), config.max_monthly_salary);
  const totalPremium = boundedSalary * config.premium_rate;
  const eeShare = totalPremium * config.ee_share_percent;
  return Math.round(eeShare * 100) / 100;
}

export function computePagIbigDeduction(monthlySalary: number, config: PagIbigConfig): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!config) return 0;

  const cappedSalary = Math.min(monthlySalary, config.max_salary_cap);
  const calculated = cappedSalary * config.ee_rate;
  const eeShare = Math.min(calculated, config.max_ee_contribution);
  return Math.round(eeShare * 100) / 100;
}

export function computeSssErShare(monthlySalary: number, sssBrackets: SssBracket[]): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!sssBrackets || sssBrackets.length === 0) return 0;

  const match = sssBrackets.find(b => monthlySalary >= b.min_salary && monthlySalary <= b.max_salary);
  if (match) {
    return match.er_share;
  }
  const maxBracket = [...sssBrackets].sort((a, b) => b.max_salary - a.max_salary)[0];
  if (maxBracket && monthlySalary > maxBracket.max_salary) {
    return maxBracket.er_share;
  }
  return 0;
}

export function computePhilHealthErShare(monthlySalary: number, config: PhilHealthConfig): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!config) return 0;

  const boundedSalary = Math.min(Math.max(monthlySalary, config.min_monthly_salary), config.max_monthly_salary);
  const totalPremium = boundedSalary * config.premium_rate;
  const eeShare = totalPremium * config.ee_share_percent;
  const erShare = totalPremium - eeShare;
  return Math.round(erShare * 100) / 100;
}

export function computePagIbigErShare(monthlySalary: number, config: PagIbigConfig): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  if (!config) return 0;

  const cappedSalary = Math.min(monthlySalary, config.max_salary_cap);
  const calculated = cappedSalary * config.er_rate;
  const erShare = Math.min(calculated, config.max_ee_contribution || 200);
  return Math.round(erShare * 100) / 100;
}

export function computeWithholdingTax(taxableIncome: number, taxTable: TaxBracket[], period?: 'Monthly' | 'Semi-Monthly' | 'Annual', isMwe: boolean = false): number {
  if (isMwe) return 0;
  if (!taxableIncome || taxableIncome <= 0) return 0;
  if (!taxTable || taxTable.length === 0) return 0;

  // Auto-detect period if not explicitly given: amounts > 100,000 are treated as Annual gross taxable compensation
  const effectivePeriod = period || (taxableIncome > 100000 ? 'Annual' : 'Monthly');

  let periodBrackets = taxTable.filter(b => b.period === effectivePeriod);
  if (periodBrackets.length === 0) {
    periodBrackets = taxTable;
  }

  const match = periodBrackets.find(b => taxableIncome >= b.min_income && taxableIncome <= b.max_income);
  if (match) {
    const excess = taxableIncome - match.min_income;
    const tax = match.base_tax + (excess * match.excess_rate);
    return Math.round(tax * 100) / 100;
  }

  // If above highest range
  const highest = [...periodBrackets].sort((a, b) => b.max_income - a.max_income)[0];
  if (highest && taxableIncome > highest.max_income) {
    const excess = taxableIncome - highest.min_income;
    const tax = highest.base_tax + (excess * highest.excess_rate);
    return Math.round(tax * 100) / 100;
  }

  return 0;
}
