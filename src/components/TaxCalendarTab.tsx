import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, Building2 } from 'lucide-react';
import { Company } from '../types';

interface TaxCalendarTabProps {
  activeCompany: Company | null;
  theme: any;
  triggerAlert?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

interface FilingCard {
  id: string;
  category: string;
  title: string;
  form: string;
  period: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
  dueDate: string;
  dueMonth: number; // 0-11
  dueDay: number;
}

export default function TaxCalendarTab({ activeCompany, theme, triggerAlert }: TaxCalendarTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filingStatuses, setFilingStatuses] = useState<Record<string, 'Pending' | 'Filed' | 'Overdue'>>({});

  const companyName = activeCompany?.company_name || 'Consolidated Entity';
  const companyTin = activeCompany?.company_tin || (activeCompany as any)?.tin || '000-000-000-00000';
  const entityType = (activeCompany?.entity_type || 'CORPORATION').toUpperCase();
  const vatStatus = (activeCompany?.vat_or_non_vat || 'VATABLE').toUpperCase();
  const isSoleProp = entityType.includes('SOLE') || entityType.includes('INDIVIDUAL') || entityType.includes('PROFESSIONAL');
  const isVat = vatStatus.includes('VAT');

  const checkCondition = (condNum: number, c: Company | null): boolean => {
    if (!c) return true;
    const status = (c.client_status || 'Active').toUpperCase();
    const isAct = status === 'ACTIVE' || status === '';
    const regFee = Boolean(c.registration_fee);
    const incTax = Boolean(c.income_tax !== false);
    const ewt = Boolean(c.withholding_expanded);
    const compTax = Boolean(c.withholding_compensation);
    const bk = Boolean(c.service_bookkeeping !== false);
    const taxFiling = Boolean(c.service_tax_filing !== false || c.service_bir_attachments !== false);
    const att = Boolean(c.service_bir_attachments !== false);

    switch (condNum) {
      case 1: return isAct;
      case 2: return bk;
      case 3: return taxFiling;
      case 4: return att;
      case 5: return isSoleProp;
      case 6: return !isSoleProp;
      case 7: return isVat;
      case 8: return !isVat;
      case 11: return regFee || true;
      case 12: return ewt || true;
      case 13: return compTax || true;
      case 17: return incTax || true;
      case 18: return true;
      default: return true;
    }
  };

  const evaluateConditions = (conditions: number[], c: Company | null): boolean => {
    return conditions.every(cond => checkCondition(cond, c));
  };

  const allFilings: Array<FilingCard & { conditions: number[] }> = [
    // Annual Filings
    { id: '0605-ANNUAL', category: 'ANNUAL FILINGS', title: 'BIR Registration Fee', form: '0605', period: 'Annual', dueDate: 'JAN 31', dueMonth: 0, dueDay: 31, conditions: [1, 3, 11, 18] },
    { id: '1604E-ANNUAL', category: 'ANNUAL FILINGS', title: 'Expanded Withholding Annual Info', form: '1604E', period: 'Annual', dueDate: 'FEB 28', dueMonth: 1, dueDay: 28, conditions: [1, 3, 12, 18] },
    { id: '1604C-ANNUAL', category: 'ANNUAL FILINGS', title: 'Compensation Withholding Annual', form: '1604C', period: 'Annual', dueDate: 'JAN 30', dueMonth: 0, dueDay: 30, conditions: [1, 3, 13, 18] },
    { id: 'ITR-ANNUAL', category: 'ANNUAL FILINGS', title: isSoleProp ? 'INDIVIDUAL ITR' : 'CORPORATE ITR', form: isSoleProp ? '1701 | 1701A' : '1702RT', period: 'Annual', dueDate: 'APR 15', dueMonth: 3, dueDay: 15, conditions: isSoleProp ? [1, 3, 5, 17, 18] : [1, 3, 6, 17, 18] },
    { id: 'SAWT-ANNUAL', category: 'ANNUAL FILINGS', title: 'ANNUAL SAWT', form: 'SAWT', period: 'Annual', dueDate: 'APR 15', dueMonth: 3, dueDay: 15, conditions: [1, 3, 4, 17, 18] },

    // Income Tax - Individual / Corporate
    { id: 'ITR-Q1', category: isSoleProp ? 'INCOME TAX - INDIVIDUAL' : 'CORPORATE INCOME TAX', title: 'Q1 Income Tax', form: isSoleProp ? '1701Q' : '1702Q', period: 'Q1', dueDate: isSoleProp ? 'MAY 15' : 'MAY 25', dueMonth: 4, dueDay: isSoleProp ? 15 : 25, conditions: isSoleProp ? [1, 3, 5, 17, 18] : [1, 3, 6, 17, 18] },
    { id: 'ITR-Q2', category: isSoleProp ? 'INCOME TAX - INDIVIDUAL' : 'CORPORATE INCOME TAX', title: 'Q2 Income Tax', form: isSoleProp ? '1701Q' : '1702Q', period: 'Q2', dueDate: isSoleProp ? 'AUG 15' : 'AUG 25', dueMonth: 7, dueDay: isSoleProp ? 15 : 25, conditions: isSoleProp ? [1, 3, 5, 17, 18] : [1, 3, 6, 17, 18] },
    { id: 'ITR-Q3', category: isSoleProp ? 'INCOME TAX - INDIVIDUAL' : 'CORPORATE INCOME TAX', title: 'Q3 Income Tax', form: isSoleProp ? '1701Q' : '1702Q', period: 'Q3', dueDate: isSoleProp ? 'NOV 15' : 'NOV 25', dueMonth: 10, dueDay: isSoleProp ? 15 : 25, conditions: isSoleProp ? [1, 3, 5, 17, 18] : [1, 3, 6, 17, 18] },

    // VAT
    { id: 'VAT-Q1', category: 'VAT', title: 'Q1 VAT Return', form: '2550Q', period: 'Q1', dueDate: 'APR 25', dueMonth: 3, dueDay: 25, conditions: [1, 3, 7, 18] },
    { id: 'VAT-Q2', category: 'VAT', title: 'Q2 VAT Return', form: '2550Q', period: 'Q2', dueDate: 'JUL 25', dueMonth: 6, dueDay: 25, conditions: [1, 3, 7, 18] },
    { id: 'VAT-Q3', category: 'VAT', title: 'Q3 VAT Return', form: '2550Q', period: 'Q3', dueDate: 'OCT 25', dueMonth: 9, dueDay: 25, conditions: [1, 3, 7, 18] },
    { id: 'VAT-Q4', category: 'VAT', title: 'Q4 VAT Return', form: '2550Q', period: 'Q4', dueDate: 'JAN 25', dueMonth: 0, dueDay: 25, conditions: [1, 3, 7, 18] },
    { id: 'SLSP-Q1', category: 'VAT', title: 'Q1 SLSP', form: 'SLSP', period: 'Q1', dueDate: 'APR 25', dueMonth: 3, dueDay: 25, conditions: [1, 3, 4, 7, 18] },
    { id: 'SLSP-Q2', category: 'VAT', title: 'Q2 SLSP', form: 'SLSP', period: 'Q2', dueDate: 'JUL 25', dueMonth: 6, dueDay: 25, conditions: [1, 3, 4, 7, 18] },
    { id: 'SLSP-Q3', category: 'VAT', title: 'Q3 SLSP', form: 'SLSP', period: 'Q3', dueDate: 'OCT 25', dueMonth: 9, dueDay: 25, conditions: [1, 3, 4, 7, 18] },
    { id: 'SLSP-Q4', category: 'VAT', title: 'Q4 SLSP', form: 'SLSP', period: 'Q4', dueDate: 'JAN 25', dueMonth: 0, dueDay: 25, conditions: [1, 3, 4, 7, 18] },

    // Percentage Tax (Non-VAT)
    { id: 'PT-Q1', category: 'PERCENTAGE TAX', title: 'Q1 Percentage Tax', form: '2551Q', period: 'Q1', dueDate: 'APR 25', dueMonth: 3, dueDay: 25, conditions: [1, 3, 8, 18] },
    { id: 'PT-Q2', category: 'PERCENTAGE TAX', title: 'Q2 Percentage Tax', form: '2551Q', period: 'Q2', dueDate: 'JUL 25', dueMonth: 6, dueDay: 25, conditions: [1, 3, 8, 18] },
    { id: 'PT-Q3', category: 'PERCENTAGE TAX', title: 'Q3 Percentage Tax', form: '2551Q', period: 'Q3', dueDate: 'OCT 25', dueMonth: 9, dueDay: 25, conditions: [1, 3, 8, 18] },
    { id: 'PT-Q4', category: 'PERCENTAGE TAX', title: 'Q4 Percentage Tax', form: '2551Q', period: 'Q4', dueDate: 'JAN 25', dueMonth: 0, dueDay: 25, conditions: [1, 3, 8, 18] },

    // QAP
    { id: 'QAP-Q1', category: 'QAP', title: 'Q1 QAP Alphalist', form: 'QAP', period: 'Q1', dueDate: 'APR 30', dueMonth: 3, dueDay: 30, conditions: [1, 3, 4, 12, 18] },
    { id: 'QAP-Q2', category: 'QAP', title: 'Q2 QAP Alphalist', form: 'QAP', period: 'Q2', dueDate: 'JUL 30', dueMonth: 6, dueDay: 30, conditions: [1, 3, 4, 12, 18] },
    { id: 'QAP-Q3', category: 'QAP', title: 'Q3 QAP Alphalist', form: 'QAP', period: 'Q3', dueDate: 'OCT 30', dueMonth: 9, dueDay: 30, conditions: [1, 3, 4, 12, 18] },
    { id: 'QAP-Q4', category: 'QAP', title: 'Q4 QAP Alphalist', form: 'QAP', period: 'Q4', dueDate: 'JAN 30', dueMonth: 0, dueDay: 30, conditions: [1, 3, 4, 12, 18] },

    // Withholding Tax - Compensation
    ...([
      { mo: 'JAN', day: 10, m: 0 }, { mo: 'FEB', day: 10, m: 1 }, { mo: 'MAR', day: 10, m: 2 },
      { mo: 'APR', day: 10, m: 3 }, { mo: 'MAY', day: 10, m: 4 }, { mo: 'JUN', day: 10, m: 5 },
      { mo: 'JUL', day: 10, m: 6 }, { mo: 'AUG', day: 10, m: 7 }, { mo: 'SEP', day: 10, m: 8 },
      { mo: 'OCT', day: 10, m: 9 }, { mo: 'NOV', day: 10, m: 10 }, { mo: 'DEC', day: 10, m: 11 }
    ] as const).map(x => ({
      id: `1601C-${x.mo}`,
      category: 'WITHHOLDING TAX - COMPENSATION',
      title: `${x.mo} Compensation Withholding`,
      form: '1601C',
      period: x.mo as any,
      dueDate: `${x.mo} ${x.day}`,
      dueMonth: x.m,
      dueDay: x.day,
      conditions: [1, 3, 13, 18]
    })),

    // Monthly Alphalist (MAP)
    ...([
      { mo: 'JAN', day: 10, m: 0 }, { mo: 'FEB', day: 10, m: 1 }, { mo: 'MAR', day: 10, m: 2 },
      { mo: 'APR', day: 10, m: 3 }, { mo: 'MAY', day: 10, m: 4 }, { mo: 'JUN', day: 10, m: 5 },
      { mo: 'JUL', day: 10, m: 6 }, { mo: 'AUG', day: 10, m: 7 }, { mo: 'SEP', day: 10, m: 8 },
      { mo: 'OCT', day: 10, m: 9 }, { mo: 'NOV', day: 10, m: 10 }, { mo: 'DEC', day: 10, m: 11 }
    ] as const).map(x => ({
      id: `MAP-${x.mo}`,
      category: 'MONTHLY ALPHALIST',
      title: `${x.mo} Alphalist`,
      form: 'MAP',
      period: x.mo as any,
      dueDate: `${x.mo} ${x.day}`,
      dueMonth: x.m,
      dueDay: x.day,
      conditions: [1, 3, 4, 12, 18]
    })),

    // Withholding Tax Expanded (0619E monthly + 1601EQ quarterly)
    ...([
      { mo: 'JAN', day: 10, m: 0 }, { mo: 'FEB', day: 10, m: 1 }, { mo: 'MAR', day: 10, m: 2 },
      { mo: 'APR', day: 10, m: 3 }, { mo: 'MAY', day: 10, m: 4 }, { mo: 'JUN', day: 10, m: 5 },
      { mo: 'JUL', day: 10, m: 6 }, { mo: 'AUG', day: 10, m: 7 }, { mo: 'SEP', day: 10, m: 8 },
      { mo: 'OCT', day: 10, m: 9 }, { mo: 'NOV', day: 10, m: 10 }, { mo: 'DEC', day: 10, m: 11 }
    ] as const).map(x => ({
      id: `0619E-${x.mo}`,
      category: 'WITHHOLDING TAX EXPANDED',
      title: `${x.mo} Expanded Remittance`,
      form: '0619E',
      period: x.mo as any,
      dueDate: `${x.mo} ${x.day}`,
      dueMonth: x.m,
      dueDay: x.day,
      conditions: [1, 3, 12, 18]
    })),
    { id: '1601EQ-Q1', category: 'WITHHOLDING TAX EXPANDED', title: 'Q1 Expanded Quarterly', form: '1601EQ', period: 'Q1' as const, dueDate: 'APR 30', dueMonth: 3, dueDay: 30, conditions: [1, 3, 12, 18] },
    { id: '1601EQ-Q2', category: 'WITHHOLDING TAX EXPANDED', title: 'Q2 Expanded Quarterly', form: '1601EQ', period: 'Q2' as const, dueDate: 'JUL 30', dueMonth: 6, dueDay: 30, conditions: [1, 3, 12, 18] },
    { id: '1601EQ-Q3', category: 'WITHHOLDING TAX EXPANDED', title: 'Q3 Expanded Quarterly', form: '1601EQ', period: 'Q3' as const, dueDate: 'OCT 30', dueMonth: 9, dueDay: 30, conditions: [1, 3, 12, 18] },
    { id: '1601EQ-Q4', category: 'WITHHOLDING TAX EXPANDED', title: 'Q4 Expanded Quarterly', form: '1601EQ', period: 'Q4' as const, dueDate: 'JAN 30', dueMonth: 0, dueDay: 30, conditions: [1, 3, 12, 18] }
  ];

  const applicableFilings = useMemo(() => {
    return allFilings.filter(f => evaluateConditions(f.conditions, activeCompany));
  }, [activeCompany, isSoleProp, isVat]);

  const orderedCategories = [
    'ANNUAL FILINGS',
    isSoleProp ? 'INCOME TAX - INDIVIDUAL' : 'CORPORATE INCOME TAX',
    !isSoleProp ? 'INCOME TAX - INDIVIDUAL' : 'CORPORATE INCOME TAX',
    'WITHHOLDING TAX - COMPENSATION',
    'VAT',
    'MONTHLY ALPHALIST',
    'PERCENTAGE TAX',
    'WITHHOLDING TAX EXPANDED',
    'QAP'
  ];

  const categoriesMap = useMemo(() => {
    const map = new Map<string, typeof applicableFilings>();
    orderedCategories.forEach(cat => map.set(cat, []));
    applicableFilings.forEach(f => {
      if (!map.has(f.category)) {
        map.set(f.category, []);
      }
      map.get(f.category)!.push(f);
    });
    return map;
  }, [applicableFilings, isSoleProp]);

  const currentMonthNum = new Date().getMonth();

  const handleToggleStatus = (id: string) => {
    setFilingStatuses(prev => {
      const current = prev[id] || 'Pending';
      let next: 'Pending' | 'Filed' | 'Overdue' = 'Pending';
      if (current === 'Pending') next = 'Filed';
      else if (current === 'Filed') next = 'Overdue';
      else next = 'Pending';

      if (triggerAlert) {
        triggerAlert(`Filing [${id}] status updated to: ${next}`, next === 'Filed' ? 'success' : 'info');
      }
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="space-y-4">
      {/* COMPACT HEADER BANNER */}
      <div className={`px-4 py-3 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <h2 className={`text-sm font-bold font-display ${theme.textTitle} flex items-center gap-2`}>
              BIR Tax Calendar & Filing Compliance Matrix
            </h2>
            <p className={`text-[11px] ${theme.textMuted}`}>
              Active Entity: <strong className="text-cyan-400">{companyName} ({companyTin})</strong> • <span className="text-cyan-400 font-semibold">Glowing cards = Due this month</span>. Click any card to toggle status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Filed
          </div>
          <div className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Pending
          </div>
          <div className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Overdue
          </div>
        </div>
      </div>

      {/* COMPACT SMALL-BOXES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from(categoriesMap.entries()).map(([categoryName, filings]) => {
          if (filings.length === 0) return null;
          return (
            <div 
              key={categoryName}
              className={`p-3 border rounded-xl shadow-xs space-y-2 flex flex-col justify-between ${theme.bgCard} ${theme.borderCard}`}
            >
              {/* Category Title Header */}
              <div className="flex items-center justify-between border-b border-zinc-700/30 pb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 truncate max-w-[180px]">
                  {categoryName}
                </span>
                <span className="text-[9px] text-zinc-400 font-mono bg-slate-500/10 px-1.5 py-0.5 rounded">
                  {filings.length} {filings.length === 1 ? 'return' : 'returns'}
                </span>
              </div>

              {/* Compact Small Cards Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {filings.map((f) => {
                  const userStatus = filingStatuses[f.id];
                  let effectiveStatus = userStatus;
                  if (!effectiveStatus) {
                    if (f.dueMonth < currentMonthNum) effectiveStatus = 'Overdue';
                    else effectiveStatus = 'Pending';
                  }

                  const isCurrentMonthDue = f.dueMonth === currentMonthNum;

                  let statusBg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
                  if (effectiveStatus === 'Filed') {
                    statusBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
                  } else if (effectiveStatus === 'Overdue') {
                    statusBg = 'bg-rose-500/15 border-rose-500/40 text-rose-300';
                  }

                  return (
                    <div
                      key={f.id}
                      onClick={() => handleToggleStatus(f.id)}
                      className={`p-1 rounded border flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-150 select-none ${statusBg} ${
                        isCurrentMonthDue 
                          ? 'ring-1.5 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse scale-105 z-10' 
                          : 'hover:scale-[1.02]'
                      }`}
                      title={`${f.title} (${f.form}) - Due: ${f.dueDate} [Status: ${effectiveStatus}]`}
                    >
                      <div className="w-full">
                        <span className="text-[7px] font-mono font-bold uppercase opacity-80 block truncate leading-none">
                          {f.period}
                        </span>
                        <span className="font-mono font-black text-[10px] tracking-tighter block truncate my-0.5 leading-tight">
                          {f.form}
                        </span>
                      </div>

                      <div className="w-full pt-0.5 border-t border-black/10 dark:border-white/10">
                        <span className="font-mono font-semibold text-[7px] block leading-none">
                          {f.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
