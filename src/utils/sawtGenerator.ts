import { Sale, Company } from '../types';

export interface SawtRecord {
  id: string | number;
  seqNo: number;
  payorTin: string;
  payorBranch: string;
  payorName: string;
  atcCode: string;
  taxBase: number;
  taxWithheld: number;
  invoiceDate?: string;
  refInvoice?: string;
}

export function filterValidSawtSales(sales: Sale[]): Sale[] {
  return sales.filter(s => {
    if (!s) return false;
    const withholding = Number(s.withholding_2307) || 0;
    if (withholding <= 0) return false;

    // Filter sample/demo data per BIR guidelines
    const customer = String(s.customer_name || '').toLowerCase().trim();
    const tin = String(s.customer_tin || '').replace(/[^0-9]/g, '');
    if (/^(sample|demo|test)(\s|$)/i.test(customer)) return false;
    if (/sample|test customer|demo customer/i.test(customer)) return false;
    if (tin.startsWith('000000000') || tin === '') {
      // allow if real customer name
      if (customer.length === 0) return false;
    }
    return true;
  });
}

export function parseSawtRecords(sales: Sale[]): SawtRecord[] {
  const valid = filterValidSawtSales(sales);
  return valid.map((s, idx) => {
    const rawTin = String(s.customer_tin || '000-000-000-00000').replace(/[^0-9]/g, '');
    const payorTin = rawTin.length >= 9 ? rawTin.substring(0, 9) : rawTin.padEnd(9, '0');
    const payorBranch = rawTin.length >= 12 ? rawTin.substring(9, 14) : '00000';

    const baseAmount = Number(s.vatable_sales || s.vatable_amount || s.amount || 0);
    const taxWithheld = Number(s.withholding_2307 || 0);

    return {
      id: s.id,
      seqNo: idx + 1,
      payorTin,
      payorBranch,
      payorName: s.customer_name || 'Customer Payor',
      atcCode: 'WI010', // Creditable Income Tax Withheld at Source
      taxBase: baseAmount,
      taxWithheld: taxWithheld,
      invoiceDate: s.invoice_date || (s as any).sale_date,
      refInvoice: s.invoice_number
    };
  });
}

export function generateSawtDatContent(
  formType: '1701Q' | '1702Q' | '2550Q' | '1701' | '1702RT',
  company: Company | null,
  records: SawtRecord[],
  quarter: string,
  year: string
): string {
  const rawCompTin = String(company?.company_tin || '000000000000').replace(/[^0-9]/g, '');
  const compTin = rawCompTin.length >= 9 ? rawCompTin.substring(0, 9) : rawCompTin.padEnd(9, '0');
  const compBranch = rawCompTin.length >= 12 ? rawCompTin.substring(9, 14) : '00000';

  // BIR Standard SAWT Header Record (HSAWT)
  const header = `HSAWT,${formType},${compTin},${compBranch},${year},${quarter}\r\n`;

  // Detail Records (DSAWT)
  const details = records.map((r, i) => {
    const cleanName = r.payorName.replace(/["\r\n]/g, '').trim();
    return `DSAWT,${i + 1},${r.payorTin},${r.payorBranch},"${cleanName}",${r.atcCode},${r.taxBase.toFixed(2)},${r.taxWithheld.toFixed(2)}`;
  }).join('\r\n');

  // Control / Summary Record (TSAWT)
  const totalBase = records.reduce((sum, r) => sum + r.taxBase, 0);
  const totalWithheld = records.reduce((sum, r) => sum + r.taxWithheld, 0);
  const trailer = `\r\nTSAWT,${records.length},${totalBase.toFixed(2)},${totalWithheld.toFixed(2)}\r\n`;

  return header + details + trailer;
}

export function getSawtFileName(
  company: Company | null,
  formType: string,
  quarter: string,
  year: string
): string {
  const rawCompTin = String(company?.company_tin || '000000000').replace(/[^0-9]/g, '');
  const compTin = rawCompTin.length >= 9 ? rawCompTin.substring(0, 9) : rawCompTin.padEnd(9, '0');
  const branch = rawCompTin.length >= 12 ? rawCompTin.substring(9, 14) : '000';
  return `${compTin}${branch}${quarter}${year}${formType}.DAT`;
}
