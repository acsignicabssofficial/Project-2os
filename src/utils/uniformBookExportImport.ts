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
        title: 'Cash Receipts Book (Books of Accounts)',
        subtitle: 'Lists and tracks all fully paid sales transactions only',
        singular: 'Cash Receipt'
      };
    case 'cash_disbursement':
      return {
        title: 'Cash Disbursements Book (Books of Accounts)',
        subtitle: 'Lists and tracks all fully paid purchase & expense disbursements only',
        singular: 'Cash Disbursement'
      };
    case 'subsidiary_sales':
      return {
        title: 'Subsidiary Sales (Books of Accounts)',
        subtitle: 'Lists and tracks all sales transactions entered by Sales (Other Transaction)',
        singular: 'Subsidiary Sale'
      };
    case 'subsidiary_purchases':
      return {
        title: 'Subsidiary Purchases (Books of Accounts)',
        subtitle: 'Lists and tracks all purchase & expense transactions entered by Purchases (Other Transaction)',
        singular: 'Subsidiary Purchase'
      };
    case 'collections':
    case 'collections_book':
      return {
        title: 'Collections Book (Books of Accounts)',
        subtitle: 'Lists and tracks all payments made to identify fully paid, partially paid, and pending sales balances',
        singular: 'Collection'
      };
    case 'payments':
    case 'payments_book':
      return {
        title: 'Payments Book (Books of Accounts)',
        subtitle: 'Lists and tracks all vendor disbursements to identify fully paid, partially paid, and pending payable balances',
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

/**
 * Downloads a pre-formatted CSV template in line with the database headers
 */
export function generateUniformCsvTemplate(bookType: UniformBookType, companyName: string = '2OS_Entity') {
  const isExpenseOrDisbursement = bookType === 'cash_disbursement' || bookType === 'subsidiary_purchases';
  
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

  // Set column widths for Sheet 1
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

  // Sheet 2: Summary total of records (Available only for export)
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

  // Sheet 1 header banner
  lines.push(`"=== SHEET 1: DATABASE TABLE (${labels.title.toUpperCase()}) ==="`);
  lines.push(UNIFORM_BOOK_HEADERS.map(h => `"${h}"`).join(','));

  // Sheet 1 rows
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

        // Check if Excel or text CSV
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const wb = XLSX.read(data, { type: 'binary' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          jsonRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        } else {
          const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data as ArrayBuffer);
          const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

          // Find start of table (ignoring any top banner like "=== SHEET 1... ===")
          let headerLineIdx = 0;
          for (let i = 0; i < rawLines.length; i++) {
            const lineUpper = rawLines[i].toUpperCase();
            if (lineUpper.includes('REGISTERED NAME') || lineUpper.includes('INVOICE #') || lineUpper.includes('CUSTOMER') || lineUpper.includes('TIN')) {
              headerLineIdx = i;
              break;
            }
          }

          // Also stop reading if we hit SHEET 2 summary section
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

          const headers = parseCsvLine(tableLines[0]);
          for (let i = 1; i < tableLines.length; i++) {
            const rowValues = parseCsvLine(tableLines[i]);
            if (rowValues.every(v => v === '')) continue;
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              obj[h] = rowValues[idx] || '';
            });
            jsonRows.push(obj);
          }
        }

        // Map parsed rows to UniformBookRecord
        const records: UniformBookRecord[] = jsonRows.map((raw, idx) => {
          const findVal = (keywords: string[]): string => {
            for (const key of Object.keys(raw)) {
              const k = key.toUpperCase().trim();
              for (const kw of keywords) {
                if (k === kw || k.includes(kw)) {
                  return String(raw[key] ?? '').trim();
                }
              }
            }
            return '';
          };

          const registeredName = findVal(['REGISTERED NAME', 'CUSTOMER NAME', 'PROVIDER NAME', 'VENDOR', 'NAME']);
          const vatOrNonVatRaw = findVal(['VAT OR NONVAT', 'VAT STATUS', 'TAX TYPE', 'NONVAT', 'VAT']);
          const vatOrNonVat: 'VAT' | 'NONVAT' = vatOrNonVatRaw.toUpperCase().includes('NON') ? 'NONVAT' : 'VAT';
          const tin = findVal(['TIN', 'TAX IDENTIFICATION NUMBER']);
          const address = findVal(['ADDRESS', 'CUSTOMER ADDRESS', 'LOCATION']);
          const typeOfTransRaw = findVal(['TYPE OF TRANSACTION', 'TRANSACTION TYPE', 'PAYMENT MODE', 'CASH OR ON ACCOUNT']);
          const typeOfTransaction: 'CASH' | 'ON ACCOUNT' = (typeOfTransRaw.toUpperCase().includes('ACCOUNT') || typeOfTransRaw.toUpperCase().includes('CREDIT')) ? 'ON ACCOUNT' : 'CASH';
          const date = findVal(['DATE', 'INVOICE DATE', 'ISSUE DATE']) || new Date().toISOString().split('T')[0];
          const invoiceType = findVal(['INVOICE TYPE', 'SALES INVOICE OR OFFICIAL RECEIPT', 'DOC TYPE']) || 'SALES INVOICE';
          const voucherNumber = findVal(['VOUCHER #', 'VOUCHER NO', 'VOUCHER NUMBER', 'CV #', 'DISBURSEMENT #']);
          const invoiceNumber = findVal(['INVOICE #', 'INVOICE NO', 'INVOICE NUMBER', 'OR #', 'RECEIPT #', 'REF #']) || `INV-${idx + 1}`;
          const particulars = findVal(['PARTICULARS', 'DESCRIPTION', 'ITEM', 'DETAILS']) || 'Imported Transaction Item';

          const parseNum = (keywords: string[], fallback: number = 0): number => {
            const str = findVal(keywords).replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(str);
            return isNaN(parsed) ? fallback : parsed;
          };

          const qty = parseNum(['QTY', 'QUANTITY'], 1);
          let unitPrice = parseNum(['UNIT PRICE', 'PRICE', 'RATE'], 0);
          let amount = parseNum(['AMOUNT', 'GROSS AMOUNT', 'TOTAL SALES'], 0);

          if (amount === 0 && unitPrice > 0) {
            amount = Math.round(qty * unitPrice * 100) / 100;
          } else if (unitPrice === 0 && amount > 0 && qty > 0) {
            unitPrice = Math.round((amount / qty) * 100) / 100;
          }

          let zeroRated = parseNum(['ZERO RATED', 'ZERO-RATED AMOUNT', 'ZERO RATED SALES'], 0);
          let vatExempt = parseNum(['VAT EXEMPT', 'VAT-EXEMPT AMOUNT', 'EXEMPT SALES'], 0);
          let discount = parseNum(['DISCOUNT', 'LESS: DISCOUNT', 'DISCOUNTS'], 0);
          let taxWithheld = parseNum(['TAX WITHHELD', 'WITHHOLDING TAX', '2307', 'EWT'], 0);

          // Calculate BIR VAT breakdown if zero or missing
          let vatableAmount = parseNum(['VATABLE AMOUNT', 'VATABLE SALES', 'VATABLE PURCHASES'], 0);
          let vatAmount = parseNum(['VAT AMOUNT', 'OUTPUT VAT', 'INPUT VAT', 'VAT (12%)'], 0);

          if (vatOrNonVat === 'VAT') {
            if (vatableAmount === 0 && vatAmount === 0 && amount > 0) {
              const baseVat = Math.max(0, amount - zeroRated - vatExempt);
              vatableAmount = Math.round((baseVat / 1.12) * 100) / 100;
              vatAmount = Math.round((baseVat - vatableAmount) * 100) / 100;
            }
          } else {
            vatableAmount = 0;
            vatAmount = 0;
          }

          let totalAmountVatInclusive = parseNum(['TOTAL AMOUNT-VAT INCLUSIVE', 'VAT INCLUSIVE'], amount);
          let totalAmountNetOfVat = parseNum(['TOTAL AMOUNT-NET OF VAT', 'NET OF VAT', 'AMOUNT NET OF VAT'], 0);
          if (totalAmountNetOfVat === 0) {
            totalAmountNetOfVat = Math.round((totalAmountVatInclusive - vatAmount) * 100) / 100;
          }

          let totalAmountDue = parseNum(['TOTAL AMOUNT DUE', 'AMOUNT DUE', 'NET DUE'], 0);
          if (totalAmountDue === 0) {
            totalAmountDue = Math.round((amount - discount - taxWithheld) * 100) / 100;
          }

          const rec: UniformBookRecord = {
            id: Date.now() + idx + Math.floor(Math.random() * 1000),
            company_name: companyName,
            registered_name: registeredName || `Entity (${invoiceNumber})`,
            vat_or_nonvat: vatOrNonVat,
            tin: tin || '000-000-000-00000',
            address: address || '',
            type_of_transaction: typeOfTransaction,
            date: date,
            invoice_type: invoiceType,
            voucher_number: voucherNumber,
            invoice_number: invoiceNumber,
            particulars: particulars,
            qty: qty,
            unit_price: unitPrice,
            amount: amount,
            vatable_amount: vatableAmount,
            vat_amount: vatAmount,
            zero_rated_amount: zeroRated,
            vat_exempt_amount: vatExempt,
            total_amount_vat_inclusive: totalAmountVatInclusive,
            total_amount_net_of_vat: totalAmountNetOfVat,
            discount: discount,
            tax_withheld: taxWithheld,
            total_amount_due: totalAmountDue,
            is_cancelled: false,
            created_at: new Date().toISOString()
          };

          return rec;
        });

        resolve(records);
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
