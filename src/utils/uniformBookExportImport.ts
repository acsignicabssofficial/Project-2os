import * as XLSX from 'xlsx';
import { UniformBookRecord, UniformBookType, UNIFORM_BOOK_HEADERS } from '../types';

export interface SummaryTotals {
  totalRecords: number;
  totalAmount: number;
  totalVatableAmount: number;
  totalVatAmount: number;
  totalZeroRatedAmount: number;
  totalVatExemptAmount: number;
  totalAmountVatInclusive: number;
  totalAmountNetOfVat: number;
  totalDiscount: number;
  totalTaxWithheld: number;
  totalAmountDue: number;
  vatCount: number;
  nonVatCount: number;
  cashCount: number;
  onAccountCount: number;
}

export function computeSummaryTotals(records: UniformBookRecord[]): SummaryTotals {
  const activeRecords = records.filter(r => !r.is_cancelled);
  
  return {
    totalRecords: activeRecords.length,
    totalAmount: activeRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    totalVatableAmount: activeRecords.reduce((sum, r) => sum + (Number(r.vatable_amount) || 0), 0),
    totalVatAmount: activeRecords.reduce((sum, r) => sum + (Number(r.vat_amount) || 0), 0),
    totalZeroRatedAmount: activeRecords.reduce((sum, r) => sum + (Number(r.zero_rated_amount) || 0), 0),
    totalVatExemptAmount: activeRecords.reduce((sum, r) => sum + (Number(r.vat_exempt_amount) || 0), 0),
    totalAmountVatInclusive: activeRecords.reduce((sum, r) => sum + (Number(r.total_amount_vat_inclusive) || 0), 0),
    totalAmountNetOfVat: activeRecords.reduce((sum, r) => sum + (Number(r.total_amount_net_of_vat) || 0), 0),
    totalDiscount: activeRecords.reduce((sum, r) => sum + (Number(r.discount) || 0), 0),
    totalTaxWithheld: activeRecords.reduce((sum, r) => sum + (Number(r.tax_withheld) || 0), 0),
    totalAmountDue: activeRecords.reduce((sum, r) => sum + (Number(r.total_amount_due) || 0), 0),
    vatCount: activeRecords.filter(r => (r.vat_or_nonvat || '').toUpperCase().includes('VAT') && !(r.vat_or_nonvat || '').toUpperCase().includes('NON')).length,
    nonVatCount: activeRecords.filter(r => (r.vat_or_nonvat || '').toUpperCase().includes('NON')).length,
    cashCount: activeRecords.filter(r => (r.type_of_transaction || '').toUpperCase().includes('CASH')).length,
    onAccountCount: activeRecords.filter(r => (r.type_of_transaction || '').toUpperCase().includes('ACCOUNT') || (r.type_of_transaction || '').toUpperCase().includes('CREDIT')).length
  };
}

export function getBookDisplayLabel(bookType: UniformBookType): { title: string; subtitle: string; singular: string } {
  switch (bookType) {
    case 'cash_receipt':
      return {
        title: 'Cash Receipt Register',
        subtitle: 'Cash Receipts / Collections Book matching uniform database schema',
        singular: 'Cash Receipt'
      };
    case 'cash_disbursement':
      return {
        title: 'Cash Disbursement Register',
        subtitle: 'Cash Disbursements / Payments Book matching uniform database schema',
        singular: 'Cash Disbursement'
      };
    case 'subsidiary_sales':
      return {
        title: 'Subsidiary Sales Register',
        subtitle: 'Subsidiary Sales & Invoices Book matching uniform database schema',
        singular: 'Subsidiary Sale'
      };
    case 'subsidiary_purchases':
      return {
        title: 'Subsidiary Purchases Register',
        subtitle: 'Subsidiary Purchases & Expenses Book matching uniform database schema',
        singular: 'Subsidiary Purchase'
      };
    case 'collections':
    case 'collections_book':
      return {
        title: 'Collections Register',
        subtitle: 'Cross-Matching Collections Book (On Account & Cash Transactions)',
        singular: 'Collection'
      };
    case 'payments':
    case 'payments_book':
      return {
        title: 'Payments Register',
        subtitle: 'Cross-Matching Payments Book (On Account & Cash Transactions)',
        singular: 'Payment'
      };
    default:
      return {
        title: 'Uniform Database Register',
        subtitle: 'Uniform 21-Header Database Table',
        singular: 'Record'
      };
  }
}

/**
 * Maps a UniformBookRecord to an exact row object matching the 21 uniform database headers
 */
export function recordToDatabaseRow(record: UniformBookRecord): Record<string, string | number> {
  return {
    'REGISTERED NAME': record.registered_name || '',
    'VAT OR NONVAT': record.vat_or_nonvat || 'VAT',
    'TIN': record.tin || '',
    'ADDRESS': record.address || '',
    'TYPE OF TRANSACTION (CASH OR ON ACCOUNT)': record.type_of_transaction || 'CASH',
    'DATE': record.date || '',
    'INVOICE TYPE (SALES INVOICE OR OFFICIAL RECEIPT)': record.invoice_type || 'SALES INVOICE',
    'VOUCHER #': record.voucher_number || '',
    'INVOICE #': record.invoice_number || '',
    'PARTICULARS': record.particulars || '',
    'QTY': Number(record.qty) || 0,
    'UNIT PRICE': Number(record.unit_price) || 0,
    'AMOUNT': Number(record.amount) || 0,
    'VATABLE AMOUNT': Number(record.vatable_amount) || 0,
    'VAT AMOUNT': Number(record.vat_amount) || 0,
    'ZERO RATED AMOUNT': Number(record.zero_rated_amount) || 0,
    'VAT EXEMPT AMOUNT': Number(record.vat_exempt_amount) || 0,
    'TOTAL AMOUNT-VAT INCLUSIVE': Number(record.total_amount_vat_inclusive) || 0,
    'TOTAL AMOUNT-NET OF VAT': Number(record.total_amount_net_of_vat) || 0,
    'DISCOUNT': Number(record.discount) || 0,
    'TAX WITHHELD': Number(record.tax_withheld) || 0,
    'TOTAL AMOUNT DUE': Number(record.total_amount_due) || 0
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Downloads a pre-formatted CSV template in line with the database headers
 */
export function generateUniformCsvTemplate(bookType: UniformBookType, companyName: string = '2OS_Entity') {
  const isExpenseOrDisbursement = bookType === 'cash_disbursement' || bookType === 'subsidiary_purchases' || bookType === 'payments' || bookType === 'payments_book';
  
  const sample1: Record<string, any> = {
    'REGISTERED NAME': isExpenseOrDisbursement ? 'Meralco Electric Distribution Corp.' : 'Acme Global Philippines Corp.',
    'VAT OR NONVAT': 'VAT',
    'TIN': isExpenseOrDisbursement ? '000-101-202-00000' : '001-234-567-00000',
    'ADDRESS': isExpenseOrDisbursement ? 'Ortigas Ave, Pasig City' : 'Ayala Ave, Makati City',
    'TYPE OF TRANSACTION (CASH OR ON ACCOUNT)': 'CASH',
    'DATE': new Date().toISOString().split('T')[0],
    'INVOICE TYPE (SALES INVOICE OR OFFICIAL RECEIPT)': isExpenseOrDisbursement ? 'OFFICIAL RECEIPT' : 'SALES INVOICE',
    'VOUCHER #': isExpenseOrDisbursement ? 'CV-2026-0001' : '',
    'INVOICE #': isExpenseOrDisbursement ? 'OR-98765' : 'SI-1001',
    'PARTICULARS': isExpenseOrDisbursement ? 'Monthly Office Electricity Utilities' : 'Professional Consulting Services',
    'QTY': 1,
    'UNIT PRICE': 25000,
    'AMOUNT': 25000,
    'VATABLE AMOUNT': 22321.43,
    'VAT AMOUNT': 2678.57,
    'ZERO RATED AMOUNT': 0,
    'VAT EXEMPT AMOUNT': 0,
    'TOTAL AMOUNT-VAT INCLUSIVE': 25000,
    'TOTAL AMOUNT-NET OF VAT': 22321.43,
    'DISCOUNT': 0,
    'TAX WITHHELD': 446.43,
    'TOTAL AMOUNT DUE': 24553.57
  };

  const sample2: Record<string, any> = {
    'REGISTERED NAME': isExpenseOrDisbursement ? 'PLDT Enterprise Telecommunications' : 'Starlight Retailers Inc.',
    'VAT OR NONVAT': 'VAT',
    'TIN': isExpenseOrDisbursement ? '000-333-444-00000' : '002-888-999-00000',
    'ADDRESS': isExpenseOrDisbursement ? 'Makati City, Metro Manila' : 'Bonifacio Global City, Taguig',
    'TYPE OF TRANSACTION (CASH OR ON ACCOUNT)': 'ON ACCOUNT',
    'DATE': new Date().toISOString().split('T')[0],
    'INVOICE TYPE (SALES INVOICE OR OFFICIAL RECEIPT)': 'SALES INVOICE',
    'VOUCHER #': isExpenseOrDisbursement ? 'PV-2026-0002' : '',
    'INVOICE #': isExpenseOrDisbursement ? 'INV-55443' : 'SI-1002',
    'PARTICULARS': isExpenseOrDisbursement ? 'Fiber Internet Dedicated Line' : 'Commercial Merchandise Supply',
    'QTY': 2,
    'UNIT PRICE': 15000,
    'AMOUNT': 30000,
    'VATABLE AMOUNT': 26785.71,
    'VAT AMOUNT': 3214.29,
    'ZERO RATED AMOUNT': 0,
    'VAT EXEMPT AMOUNT': 0,
    'TOTAL AMOUNT-VAT INCLUSIVE': 30000,
    'TOTAL AMOUNT-NET OF VAT': 26785.71,
    'DISCOUNT': 1000,
    'TAX WITHHELD': 535.71,
    'TOTAL AMOUNT DUE': 28464.29
  };

  const rows = [
    UNIFORM_BOOK_HEADERS as unknown as string[],
    UNIFORM_BOOK_HEADERS.map(h => sample1[h] ?? ''),
    UNIFORM_BOOK_HEADERS.map(h => sample2[h] ?? '')
  ];

  const csvContent = rows
    .map(r => r.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${companyName.replace(/[\s/\\:]/g, '_')}_${bookType}_TEMPLATE.csv`;
  downloadBlob(blob, filename);
}

/**
 * Export to Excel (.xlsx) with:
 * Sheet 1 = Table identical to database
 * Sheet 2 = Summary total of records
 */
export function exportUniformBookToExcel(params: {
  bookType: UniformBookType;
  companyName: string;
  records: UniformBookRecord[];
}) {
  const { bookType, companyName, records } = params;
  const labels = getBookDisplayLabel(bookType);
  const summary = computeSummaryTotals(records);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Table identical to database
  const sheet1Data = records.map(r => recordToDatabaseRow(r));
  const ws1 = sheet1Data.length > 0
    ? XLSX.utils.json_to_sheet(sheet1Data, { header: [...UNIFORM_BOOK_HEADERS] })
    : XLSX.utils.aoa_to_sheet([[...UNIFORM_BOOK_HEADERS]]);

  ws1['!cols'] = [
    { wch: 32 }, // REGISTERED NAME
    { wch: 14 }, // VAT OR NONVAT
    { wch: 20 }, // TIN
    { wch: 35 }, // ADDRESS
    { wch: 22 }, // TYPE OF TRANSACTION
    { wch: 12 }, // DATE
    { wch: 22 }, // INVOICE TYPE
    { wch: 16 }, // VOUCHER #
    { wch: 16 }, // INVOICE #
    { wch: 35 }, // PARTICULARS
    { wch: 8 },  // QTY
    { wch: 14 }, // UNIT PRICE
    { wch: 14 }, // AMOUNT
    { wch: 16 }, // VATABLE AMOUNT
    { wch: 14 }, // VAT AMOUNT
    { wch: 16 }, // ZERO RATED AMOUNT
    { wch: 16 }, // VAT EXEMPT AMOUNT
    { wch: 22 }, // TOTAL AMOUNT-VAT INCLUSIVE
    { wch: 20 }, // TOTAL AMOUNT-NET OF VAT
    { wch: 12 }, // DISCOUNT
    { wch: 14 }, // TAX WITHHELD
    { wch: 18 }  // TOTAL AMOUNT DUE
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Database Table');

  // Sheet 2: Summary total of records
  const sheet2Rows: any[][] = [
    ['2OS ACCOUNTING SYSTEM - EXECUTIVE SUMMARY REPORT'],
    [`Register: ${labels.title}`],
    [`Company: ${companyName}`],
    [`Export Date: ${new Date().toLocaleString()}`],
    [],
    ['METRIC / SUMMARY INDICATOR', 'TOTAL / VALUE'],
    ['Total Number of Records', summary.totalRecords],
    ['VAT-Registered Transactions', summary.vatCount],
    ['NON-VAT Transactions', summary.nonVatCount],
    ['Cash Transactions', summary.cashCount],
    ['On-Account / Credit Transactions', summary.onAccountCount],
    [],
    ['FINANCIAL SUMMARIES (PHP)', 'TOTAL AMOUNT (PHP)'],
    ['12. Total Gross Amount (Qty × Unit Price)', summary.totalAmount],
    ['13. Total Vatable Amount', summary.totalVatableAmount],
    ['14. Total Output/Input VAT (12%)', summary.totalVatAmount],
    ['15. Total Zero-Rated Amount', summary.totalZeroRatedAmount],
    ['16. Total VAT-Exempt Amount', summary.totalVatExemptAmount],
    ['17. Total Amount - VAT Inclusive', summary.totalAmountVatInclusive],
    ['18. Total Amount - Net of VAT', summary.totalAmountNetOfVat],
    ['19. Total Discounts Deducted', summary.totalDiscount],
    ['20. Total Tax Withheld (BIR 2307 / EWT)', summary.totalTaxWithheld],
    ['21. TOTAL NET AMOUNT DUE', summary.totalAmountDue]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  ws2['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary Total');

  const filename = `${companyName.replace(/[\s/\\:]/g, '_')}_${bookType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export to CSV with:
 * Sheet 1 section = table identical to database
 * Sheet 2 section = summary total of records
 */
export function exportUniformBookToCsv(params: {
  bookType: UniformBookType;
  companyName: string;
  records: UniformBookRecord[];
  includeSummarySection?: boolean;
}) {
  const { bookType, companyName, records, includeSummarySection = true } = params;
  const labels = getBookDisplayLabel(bookType);
  const summary = computeSummaryTotals(records);

  const lines: string[] = [];

  lines.push(`"=== SHEET 1: DATABASE TABLE (${labels.title.toUpperCase()}) ==="`);
  lines.push(UNIFORM_BOOK_HEADERS.map(h => `"${h}"`).join(','));

  records.forEach(r => {
    const rowObj = recordToDatabaseRow(r);
    const rowStr = UNIFORM_BOOK_HEADERS.map(h => `"${String(rowObj[h] ?? '').replace(/"/g, '""')}"`).join(',');
    lines.push(rowStr);
  });

  if (includeSummarySection) {
    lines.push('');
    lines.push(`"=== SHEET 2: SUMMARY TOTAL OF RECORDS ==="`);
    lines.push('"METRIC / INDICATOR","TOTAL VALUE"');
    lines.push(`"Total Number of Records","${summary.totalRecords}"`);
    lines.push(`"VAT-Registered Transactions","${summary.vatCount}"`);
    lines.push(`"NON-VAT Transactions","${summary.nonVatCount}"`);
    lines.push(`"Cash Transactions","${summary.cashCount}"`);
    lines.push(`"On-Account Transactions","${summary.onAccountCount}"`);
    lines.push(`"12. Total Gross Amount","${summary.totalAmount.toFixed(2)}"`);
    lines.push(`"13. Total Vatable Amount","${summary.totalVatableAmount.toFixed(2)}"`);
    lines.push(`"14. Total VAT Amount","${summary.totalVatAmount.toFixed(2)}"`);
    lines.push(`"15. Total Zero Rated Amount","${summary.totalZeroRatedAmount.toFixed(2)}"`);
    lines.push(`"16. Total VAT Exempt Amount","${summary.totalVatExemptAmount.toFixed(2)}"`);
    lines.push(`"17. Total Amount - VAT Inclusive","${summary.totalAmountVatInclusive.toFixed(2)}"`);
    lines.push(`"18. Total Amount - Net of VAT","${summary.totalAmountNetOfVat.toFixed(2)}"`);
    lines.push(`"19. Total Discount","${summary.totalDiscount.toFixed(2)}"`);
    lines.push(`"20. Total Tax Withheld","${summary.totalTaxWithheld.toFixed(2)}"`);
    lines.push(`"21. TOTAL AMOUNT DUE","${summary.totalAmountDue.toFixed(2)}"`);
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${companyName.replace(/[\s/\\:]/g, '_')}_${bookType}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(blob, filename);
}

/**
 * Parses uploaded CSV / Excel file and converts into UniformBookRecord[]
 */
export function parseUniformImportFile(file: File, companyName: string): Promise<UniformBookRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonRows: any[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const wb = XLSX.read(data, { type: 'binary' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          jsonRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        } else {
          const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data as ArrayBuffer);
          const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

          let headerLineIdx = 0;
          for (let i = 0; i < rawLines.length; i++) {
            const lineUpper = rawLines[i].toUpperCase();
            if (lineUpper.includes('REGISTERED NAME') || lineUpper.includes('INVOICE #') || lineUpper.includes('CUSTOMER') || lineUpper.includes('TIN')) {
              headerLineIdx = i;
              break;
            }
          }

          const tableLines: string[] = [];
          for (let i = headerLineIdx; i < rawLines.length; i++) {
            if (rawLines[i].toUpperCase().includes('=== SHEET 2') || rawLines[i].toUpperCase().includes('SUMMARY TOTAL OF RECORDS')) {
              break;
            }
            tableLines.push(rawLines[i]);
          }

          if (tableLines.length === 0) {
            resolve([]);
            return;
          }

          const parseCsvLine = (line: string): string[] => {
            const cells: string[] = [];
            let inQuotes = false;
            let current = '';
            for (let c = 0; c < line.length; c++) {
              const ch = line[c];
              if (ch === '"') {
                inQuotes = !inQuotes;
              } else if (ch === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
              } else {
                current += ch;
              }
            }
            cells.push(current.trim());
            return cells;
          };

          const headerCols = parseCsvLine(tableLines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toUpperCase());
          for (let i = 1; i < tableLines.length; i++) {
            const rowCols = parseCsvLine(tableLines[i]);
            const rowObj: any = {};
            headerCols.forEach((colName, idx) => {
              rowObj[colName] = rowCols[idx] !== undefined ? rowCols[idx].replace(/^["']|["']$/g, '').trim() : '';
            });
            jsonRows.push(rowObj);
          }
        }

        const parsedRecords: UniformBookRecord[] = jsonRows.map((row, idx) => {
          const getVal = (keyPattern: string) => {
            const foundKey = Object.keys(row).find(k => k.toUpperCase().includes(keyPattern.toUpperCase()));
            return foundKey ? row[foundKey] : undefined;
          };

          const registeredName = getVal('REGISTERED') || getVal('CUSTOMER') || getVal('VENDOR') || getVal('NAME') || 'Imported Entity';
          const vatStatus = (getVal('VAT OR') || getVal('TAX TYPE') || 'VAT').toUpperCase().includes('NON') ? 'NONVAT' : 'VAT';
          const tin = getVal('TIN') || '000-000-000-00000';
          const address = getVal('ADDRESS') || '';
          const transType = (getVal('TYPE OF') || getVal('TERMS') || 'CASH').toUpperCase().includes('ACCOUNT') ? 'ON ACCOUNT' : 'CASH';
          const date = getVal('DATE') || new Date().toISOString().split('T')[0];
          const invoiceType = (getVal('INVOICE TYPE') || 'SALES INVOICE').toUpperCase().includes('OFFICIAL') ? 'OFFICIAL RECEIPT' : 'SALES INVOICE';
          const voucherNumber = getVal('VOUCHER') || '';
          const invoiceNumber = getVal('INVOICE #') || getVal('INV #') || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
          const particulars = getVal('PARTICULARS') || getVal('DESCRIPTION') || 'Imported Transaction';

          const qty = Number(getVal('QTY')) || 1;
          const unitPrice = Number(getVal('UNIT PRICE')) || Number(getVal('AMOUNT')) || 0;
          const amount = Number(getVal('AMOUNT')) || (qty * unitPrice);
          const vatable = Number(getVal('VATABLE')) || (vatStatus === 'VAT' ? Math.round((amount / 1.12) * 100) / 100 : 0);
          const vat = Number(getVal('VAT AMOUNT')) || (vatStatus === 'VAT' ? Math.round((amount - vatable) * 100) / 100 : 0);
          const zeroRated = Number(getVal('ZERO RATED')) || 0;
          const vatExempt = Number(getVal('VAT EXEMPT')) || 0;
          const totalVatInclusive = Number(getVal('VAT INCLUSIVE')) || amount;
          const totalNetOfVat = Number(getVal('NET OF VAT')) || (amount - vat);
          const discount = Number(getVal('DISCOUNT')) || 0;
          const taxWithheld = Number(getVal('WITHHELD')) || Number(getVal('2307')) || 0;
          const totalDue = Number(getVal('DUE')) || (amount - discount - taxWithheld);

          return {
            id: Date.now() + idx,
            company_name: companyName,
            registered_name: registeredName,
            vat_or_nonvat: vatStatus as any,
            tin,
            address,
            type_of_transaction: transType as any,
            date,
            invoice_type: invoiceType,
            voucher_number: voucherNumber,
            invoice_number: invoiceNumber,
            particulars,
            qty,
            unit_price: unitPrice,
            amount,
            vatable_amount: vatable,
            vat_amount: vat,
            zero_rated_amount: zeroRated,
            vat_exempt_amount: vatExempt,
            total_amount_vat_inclusive: totalVatInclusive,
            total_amount_net_of_vat: totalNetOfVat,
            discount,
            tax_withheld: taxWithheld,
            total_amount_due: totalDue,
            is_cancelled: false,
            created_at: new Date().toISOString()
          };
        });

        resolve(parsedRecords);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  });
}
