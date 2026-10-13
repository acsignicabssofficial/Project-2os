import React, { useState, useMemo } from 'react';
import { Printer, Download, Sparkles, Building2, User, FileText, CheckCircle2 } from 'lucide-react';
import { safeNum } from '../utils/accounting';

export interface BIR2307Row {
  nature: string;
  atc: string;
  month1: number;
  month2: number;
  month3: number;
  totalAmount: number;
  taxWithheld: number;
}

export interface BIR2307CertificateProps {
  periodFrom?: string;
  periodTo?: string;
  payeeTin?: string;
  payeeName?: string;
  payeeAddress?: string;
  payeeZip?: string;
  payorTin?: string;
  payorName?: string;
  payorAddress?: string;
  payorZip?: string;
  rows?: BIR2307Row[];
  theme: any;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function BIR2307CertificateView({
  periodFrom = '01/01/2025',
  periodTo = '03/31/2025',
  payeeTin = '008-622-147-000',
  payeeName = 'PROFICERE TRANSPORT LOGISTICS CORP.',
  payeeAddress = '0468 Niugan, Angat Bulacan',
  payeeZip = '3012',
  payorTin = '008-287-044-000',
  payorName = 'NIPPON HASHA INC. (FORMERLY THE REAL RAMEN NAZI, INC.)',
  payorAddress = 'U20 C3 MOLITO LIFESTYLE BLDG., ZAPOTE RD, MADRIGAL AVE, MUNTINLUPA CITY',
  payorZip = '1780',
  rows = [],
  theme,
  title = 'BIR Form No. 2307',
  subtitle = 'Certificate of Creditable Tax Withheld at Source',
  onClose
}: BIR2307CertificateProps) {
  const [useReferenceModel, setUseReferenceModel] = useState<boolean>(rows.length === 0);

  // Reference Model from Screenshot 2026-10-13 175249.png
  const activeData = useMemo(() => {
    if (useReferenceModel || rows.length === 0) {
      return {
        periodFrom: '01/01/2025',
        periodTo: '03/31/2025',
        payeeTin: '008-622-147-000',
        payeeName: 'PROFICERE TRANSPORT LOGISTICS CORP.',
        payeeAddress: '0468 Niugan, Angat Bulacan',
        payeeZip: '3012',
        payorTin: '008-287-044-000',
        payorName: 'NIPPON HASHA INC. (FORMERLY THE REAL RAMEN NAZI, INC.)',
        payorAddress: 'U20 C3 MOLITO LIFESTYLE BLDG., ZAPOTE RD, MADRIGAL AVE, MUNTINLUPA CITY',
        payorZip: '1780',
        rows: [
          {
            nature: 'Income payment made by top withholding agents to their local/resident supplier of services other than those covered by other rates of withholding tax',
            atc: 'WC160',
            month1: 0,
            month2: 0,
            month3: 11607.14,
            totalAmount: 11607.14,
            taxWithheld: 232.14
          }
        ]
      };
    }

    return {
      periodFrom,
      periodTo,
      payeeTin,
      payeeName,
      payeeAddress,
      payeeZip,
      payorTin,
      payorName,
      payorAddress,
      payorZip,
      rows
    };
  }, [useReferenceModel, rows, periodFrom, periodTo, payeeTin, payeeName, payeeAddress, payeeZip, payorTin, payorName, payorAddress, payorZip]);

  const totalIncomePayments = activeData.rows.reduce((sum, r) => sum + safeNum(r.totalAmount), 0);
  const totalTaxWithheld = activeData.rows.reduce((sum, r) => sum + safeNum(r.taxWithheld), 0);

  const fmt = (num: number) => {
    if (num === 0) return '-';
    return safeNum(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTinBoxes = (tinStr: string) => {
    const clean = (tinStr || '').replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    const p1 = clean.slice(0, 3);
    const p2 = clean.slice(3, 6);
    const p3 = clean.slice(6, 9);
    const p4 = clean.slice(9, 12);

    return (
      <div className="flex items-center gap-1 font-mono font-bold text-xs">
        <span className="border border-black px-1.5 py-0.5 bg-white tracking-widest">{p1.split('').join(' ')}</span>
        <span>-</span>
        <span className="border border-black px-1.5 py-0.5 bg-white tracking-widest">{p2.split('').join(' ')}</span>
        <span>-</span>
        <span className="border border-black px-1.5 py-0.5 bg-white tracking-widest">{p3.split('').join(' ')}</span>
        <span>-</span>
        <span className="border border-black px-1.5 py-0.5 bg-white tracking-widest">{p4.split('').join(' ')}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className={`p-3 rounded-xl border ${theme.borderCard} ${theme.bgCard} flex flex-wrap items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500 text-slate-950 uppercase text-[10px]">
            BIR FORM 2307
          </span>
          <span className="font-bold text-zinc-300">
            {subtitle}
          </span>
          {useReferenceModel && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ⚡ Reference Sample Model
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setUseReferenceModel(!useReferenceModel)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              useReferenceModel
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : `border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white`
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useReferenceModel ? 'Active: Image 4 Model Data' : 'Load Image 4 Reference Model'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Form 2307</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition cursor-pointer"
            >
              Back to Schedule
            </button>
          )}
        </div>
      </div>

      {/* BIR FORM 2307 1:1 REPLICA CONTAINER (MATCHING SCREENSHOT 2026-10-13 175249.png) */}
      <div className="bg-white text-black border-2 border-black rounded p-5 shadow-2xl font-sans text-[11px] leading-tight max-w-5xl mx-auto selection:bg-amber-200">
        
        {/* Top Note */}
        <div className="text-[10px] italic font-semibold text-slate-800 border-b border-black pb-1 mb-2">
          Fill in all applicable spaces. Mark all appropriate boxes with an "X".
        </div>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-2 mb-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Republika ng Pilipinas • Kagawaran ng Pananalapi • Kawanihan ng Rentas Internas</div>
            <div className="text-base sm:text-lg font-black uppercase tracking-wide">Certificate of Creditable Tax Withheld at Source</div>
          </div>
          <div className="text-right shrink-0 mt-1 sm:mt-0">
            <div className="text-xs font-black bg-black text-white px-2 py-0.5 rounded font-mono">BIR Form No. 2307</div>
            <div className="text-[10px] text-slate-700">January 2018 (ENCS)</div>
          </div>
        </div>

        {/* 1. Period Header */}
        <div className="grid grid-cols-2 border border-black bg-slate-50 divide-x border-b-2 divide-black font-mono mb-2">
          <div className="p-1.5 flex items-center justify-between">
            <span className="font-bold font-sans text-[10px]">1 For the Period From (MM/DD/YYYY)</span>
            <span className="border border-black bg-white px-2 py-0.5 font-bold text-xs">{activeData.periodFrom}</span>
          </div>
          <div className="p-1.5 flex items-center justify-between">
            <span className="font-bold font-sans text-[10px]">To (MM/DD/YYYY)</span>
            <span className="border border-black bg-white px-2 py-0.5 font-bold text-xs">{activeData.periodTo}</span>
          </div>
        </div>

        {/* PART I - PAYEE INFORMATION */}
        <div className="border border-black bg-slate-50/70 p-2 mb-2 space-y-1.5">
          <div className="font-black bg-black text-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            Part I - Payee Information
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-bold text-[10px]">2 Taxpayer Identification Number (TIN)</div>
            {renderTinBoxes(activeData.payeeTin)}
          </div>

          <div>
            <div className="font-bold text-[10px]">3 Payee's Name (Last Name, First Name, Middle Name for Individual OR Registered Name for Non-Individual)</div>
            <div className="font-bold text-xs uppercase bg-white border border-black p-1">
              {activeData.payeeName}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <div className="font-bold text-[10px]">4 Registered Address</div>
              <div className="bg-white border border-black p-1 text-[10px] truncate">
                {activeData.payeeAddress}
              </div>
            </div>
            <div>
              <div className="font-bold text-[10px]">4A ZIP Code</div>
              <div className="bg-white border border-black p-1 text-[10px] font-mono text-center font-bold">
                {activeData.payeeZip}
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold text-[10px]">5 Foreign Address, if applicable</div>
            <div className="bg-white border border-black p-1 text-[10px] text-zinc-400">N/A</div>
          </div>
        </div>

        {/* PART II - PAYOR INFORMATION */}
        <div className="border border-black bg-slate-50/70 p-2 mb-2 space-y-1.5">
          <div className="font-black bg-black text-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            Part II - Payor Information
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-bold text-[10px]">6 Taxpayer Identification Number (TIN)</div>
            {renderTinBoxes(activeData.payorTin)}
          </div>

          <div>
            <div className="font-bold text-[10px]">7 Payor's Name (Last Name, First Name, Middle Name for Individual OR Registered Name for Non-Individual)</div>
            <div className="font-bold text-xs uppercase bg-white border border-black p-1">
              {activeData.payorName}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <div className="font-bold text-[10px]">8 Registered Address</div>
              <div className="bg-white border border-black p-1 text-[10px] truncate">
                {activeData.payorAddress}
              </div>
            </div>
            <div>
              <div className="font-bold text-[10px]">8A ZIP Code</div>
              <div className="bg-white border border-black p-1 text-[10px] font-mono text-center font-bold">
                {activeData.payorZip}
              </div>
            </div>
          </div>
        </div>

        {/* PART III - DETAILS OF MONTHLY INCOME PAYMENTS AND TAXES WITHHELD */}
        <div className="border-2 border-black">
          <div className="font-black bg-black text-white px-2 py-1 text-[10px] uppercase tracking-wide text-center">
            Part III - Details of Monthly Income Payments and Taxes Withheld
          </div>

          <div className="overflow-x-auto font-mono text-[10px]">
            <table className="w-full border-collapse border-t border-black text-left">
              <thead>
                <tr className="bg-slate-200 divide-x divide-black border-b border-black text-center font-bold">
                  <th className="p-1 w-2/5 font-sans">Income Payments Subject to Expanded Withholding Tax</th>
                  <th className="p-1 w-16">ATC</th>
                  <th className="p-1 w-24">1st Month of Quarter</th>
                  <th className="p-1 w-24">2nd Month of Quarter</th>
                  <th className="p-1 w-24">3rd Month of Quarter</th>
                  <th className="p-1 w-24">Total</th>
                  <th className="p-1 w-28">Tax Withheld for Quarter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {activeData.rows.map((row, idx) => (
                  <tr key={idx} className="divide-x divide-black hover:bg-amber-50/50">
                    <td className="p-1 font-sans text-[10px] leading-tight text-slate-800">
                      {row.nature}
                    </td>
                    <td className="p-1 text-center font-bold">{row.atc}</td>
                    <td className="p-1 text-right">{fmt(row.month1)}</td>
                    <td className="p-1 text-right">{fmt(row.month2)}</td>
                    <td className="p-1 text-right font-semibold">{fmt(row.month3)}</td>
                    <td className="p-1 text-right font-bold bg-slate-50">{fmt(row.totalAmount)}</td>
                    <td className="p-1 text-right font-black bg-amber-100/50">{fmt(row.taxWithheld)}</td>
                  </tr>
                ))}

                {/* Empty Filler Rows if fewer than 4 items */}
                {Array.from({ length: Math.max(0, 3 - activeData.rows.length) }).map((_, fIdx) => (
                  <tr key={`fill-${fIdx}`} className="divide-x divide-black h-5">
                    <td className="p-1"></td>
                    <td className="p-1"></td>
                    <td className="p-1 text-right">-</td>
                    <td className="p-1 text-right">-</td>
                    <td className="p-1 text-right">-</td>
                    <td className="p-1 text-right">-</td>
                    <td className="p-1 text-right">-</td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="divide-x divide-black bg-slate-200 border-t-2 border-black font-bold">
                  <td className="p-1 font-sans text-right uppercase" colSpan={2}>
                    Total
                  </td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">{fmt(totalIncomePayments)}</td>
                  <td className="p-1 text-right font-black">{fmt(totalIncomePayments)}</td>
                  <td className="p-1 text-right font-black text-rose-950 bg-amber-200/60">{fmt(totalTaxWithheld)}</td>
                </tr>

                {/* Business Tax Withholding Section */}
                <tr className="divide-x divide-black border-t border-black bg-slate-100">
                  <td className="p-1 font-sans italic text-[9px]" colSpan={2}>
                    Money Payments Subject to Withholding of Business Tax (Government & Private)
                  </td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">-</td>
                  <td className="p-1 text-right">-</td>
                </tr>

                {/* Grand Total */}
                <tr className="divide-x divide-black bg-slate-300 border-t-2 border-black font-black">
                  <td className="p-1.5 font-sans text-right uppercase" colSpan={2}>
                    Grand Total
                  </td>
                  <td className="p-1.5 text-right">-</td>
                  <td className="p-1.5 text-right">-</td>
                  <td className="p-1.5 text-right">{fmt(totalIncomePayments)}</td>
                  <td className="p-1.5 text-right">{fmt(totalIncomePayments)}</td>
                  <td className="p-1.5 text-right text-rose-950 bg-amber-300/80">{fmt(totalTaxWithheld)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Declaration & Signature Block */}
        <div className="border border-black p-2 mt-2 text-[10px] space-y-3 bg-slate-50/50">
          <p className="italic text-[9px] leading-snug">
            We declare, under the penalties of perjury, that this certificate has been made in good faith, verified by us, and to the best of our knowledge and belief, is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority thereof.
          </p>
          <div className="grid grid-cols-2 gap-4 text-center pt-3">
            <div className="border-t border-black pt-1">
              <span className="font-bold uppercase text-[9px]">Payor / Authorized Representative (Signature over Printed Name)</span>
            </div>
            <div className="border-t border-black pt-1">
              <span className="font-bold uppercase text-[9px]">Title / Position of Signatory & Date Signed</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
