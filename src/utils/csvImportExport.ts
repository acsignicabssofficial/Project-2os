import * as XLSX from 'xlsx';
import { 
  Sale, 
  Expense, 
  Collection, 
  Payment, 
  Customer, 
  Contractor, 
  AccountTitle, 
  SpecialEntry, 
  PPEAsset 
} from '../types';

export type ImportableDataType = 
  | 'sales'
  | 'expenses'
  | 'collections'
  | 'payments'
  | 'customers'
  | 'providers'
  | 'account_titles'
  | 'employees'
  | 'special_entries'
  | 'ppe';

export interface ColumnSummary {
  name: string;
  dataType: 'numeric' | 'text' | 'date';
  sum: number | null;
  count: number;
  blankCount: number;
  sampleValues: string[];
}

export interface ImportPreview {
  headers: string[];
  rows: Record<string, string>[];
  columnSummaries: ColumnSummary[];
  totalRows: number;
  totalColumns: number;
  numericTotals: { column: string; sum: number }[];
}

// -------------------------------------------------------------
// CSV TEMPLATES & SAMPLES
// -------------------------------------------------------------
export const CSV_TEMPLATES: Record<ImportableDataType, {
  label: string;
  description: string;
  filename: string;
  headers: string[];
  sampleRows: string[][];
}> = {
  sales: {
    label: 'Sales Invoices / Sales Register',
    description: 'Customer invoices, sales amounts, 12% output VAT, withholding tax 2307, and client TIN',
    filename: '2OS_Sales_Invoices_Template.csv',
    headers: [
      'Invoice Date',
      'Invoice Number',
      'Customer Name',
      'Customer TIN',
      'Gross Amount',
      'Vatable Sales',
      'Output VAT',
      'VAT Exempt Amount',
      'Withholding 2307',
      'Status',
      'Description'
    ],
    sampleRows: [
      ['2026-08-05', 'SI-2026-001', 'Metro Retail Corp', '123-456-789-00000', '112000.00', '100000.00', '12000.00', '0.00', '2000.00', 'Paid', 'Consulting & software services'],
      ['2026-08-12', 'SI-2026-002', 'Luzon Trading Inc', '987-654-321-00000', '56000.00', '50000.00', '6000.00', '0.00', '1000.00', 'Unpaid', 'Quarterly retainer fee']
    ]
  },
  expenses: {
    label: 'Expenses / Accounts Payable Vouchers',
    description: 'Supplier expenses, input VAT, withholding tax 2307/2306, and supplier TIN',
    filename: '2OS_Expenses_Voucher_Template.csv',
    headers: [
      'Expense Date',
      'Voucher Number',
      'Supplier Name',
      'Supplier TIN',
      'Expense Category',
      'Gross Amount',
      'Input VAT',
      'Withholding Tax',
      'VAT Type',
      'Status',
      'Description'
    ],
    sampleRows: [
      ['2026-08-03', 'APV-2026-001', 'PLDT Enterprise', '000-525-545-00000', 'Utilities', '11200.00', '1200.00', '200.00', 'VAT', 'Paid', 'Office high-speed fiber internet'],
      ['2026-08-10', 'APV-2026-002', 'Ayala Land Properties', '222-333-444-00000', 'Rental', '56000.00', '6000.00', '2500.00', 'VAT', 'Unpaid', 'Monthly office commercial rental']
    ]
  },
  collections: {
    label: 'Collections / Cash Receipts',
    description: 'Customer payment receipts, OR/PR numbers, collected amounts, and BIR 2307 deductions',
    filename: '2OS_Collections_Receipts_Template.csv',
    headers: [
      'Collection Date',
      'OR/PR Number',
      'Invoice Matched',
      'Customer Name',
      'Amount Collected',
      'Amount Withheld 2307',
      'Payment Method',
      'Notes'
    ],
    sampleRows: [
      ['2026-08-06', 'OR-10021', 'SI-2026-001', 'Metro Retail Corp', '110000.00', '2000.00', 'Bank Transfer', 'BDO online transfer ref #772910'],
      ['2026-08-15', 'OR-10022', 'SI-2026-002', 'Luzon Trading Inc', '55000.00', '1000.00', 'Check', 'Metrobank Check #003841']
    ]
  },
  payments: {
    label: 'Supplier Payments / Check Disbursements',
    description: 'Check disbursements, payment vouchers, bank disbursement records, and supplier payments',
    filename: '2OS_Disbursements_Payments_Template.csv',
    headers: [
      'Payment Date',
      'Voucher Number',
      'Check/Ref Number',
      'Supplier Name',
      'Amount Paid',
      'Withholding Tax Deducted',
      'Payment Method',
      'Particulars'
    ],
    sampleRows: [
      ['2026-08-04', 'APV-2026-001', 'CHK-99120', 'PLDT Enterprise', '11000.00', '200.00', 'Check', 'Settlement of PLDT office internet bill'],
      ['2026-08-11', 'APV-2026-002', 'TRF-55821', 'Ayala Land Properties', '53500.00', '2500.00', 'Bank Transfer', 'Rent payment net of 5% EWT']
    ]
  },
  customers: {
    label: 'Customers / Clients Directory',
    description: 'Customer registered business names, 9-to-12 digit TIN, address, and contact details',
    filename: '2OS_Customers_Directory_Template.csv',
    headers: [
      'Customer Name',
      'TIN',
      'Address',
      'Contact Person',
      'Email',
      'Phone',
      'Line of Business'
    ],
    sampleRows: [
      ['Metro Retail Corp', '123-456-789-00000', 'Ayala Ave, Makati City', 'Juan Santos', 'billing@metroretail.ph', '+63 917 123 4567', 'Retail & Distribution'],
      ['Luzon Trading Inc', '987-654-321-00000', 'Ortigas Center, Pasig City', 'Maria Reyes', 'accounts@luzontrading.com', '+63 918 987 6543', 'Wholesale Merchandise']
    ]
  },
  providers: {
    label: 'Service Providers / Vendors Directory',
    description: 'Suppliers, contractors, registered TIN, ATC codes, and contact info',
    filename: '2OS_Service_Providers_Template.csv',
    headers: [
      'Provider Name',
      'TIN',
      'Address',
      'Service Type',
      'ATC Code',
      'Email',
      'Phone'
    ],
    sampleRows: [
      ['PLDT Enterprise', '000-525-545-00000', 'Makati City', 'Telecommunications', 'WI100', 'enterprise@pldt.com.ph', '+63 2 8888 171'],
      ['Ayala Land Properties', '222-333-444-00000', 'Taguig City', 'Commercial Rental', 'WI100', 'leasing@ayalaland.com.ph', '+63 2 7908 3000']
    ]
  },
  account_titles: {
    label: 'Chart of Accounts',
    description: 'Account code, account title name, type, financial classification, and normal balance',
    filename: '2OS_Chart_of_Accounts_Template.csv',
    headers: [
      'Account Code',
      'Account Title',
      'Account Type',
      'Classification',
      'Normal Balance'
    ],
    sampleRows: [
      ['1010', 'Cash in Bank - BDO', 'Asset', 'Current Asset', 'Debit'],
      ['4010', 'Service Revenue', 'Revenue', 'Operating Revenue', 'Credit'],
      ['5010', 'Salaries and Wages', 'Expense', 'Operating Expense', 'Debit']
    ]
  },
  employees: {
    label: 'Employee Profiles',
    description: 'Employee ID, full name, TIN, SSS, PhilHealth, Pag-IBIG, position, and monthly basic pay',
    filename: '2OS_Employee_Profiles_Template.csv',
    headers: [
      'Employee ID',
      'Full Name',
      'TIN',
      'SSS Number',
      'PhilHealth Number',
      'PagIBIG Number',
      'Position',
      'Department',
      'Monthly Rate'
    ],
    sampleRows: [
      ['EMP-001', 'Juan Dela Cruz', '111-222-333-00000', '34-1234567-8', '12-345678901-2', '1234-5678-9012', 'Senior Accountant', 'Finance', '45000.00'],
      ['EMP-002', 'Maria Clara Santos', '444-555-666-00000', '34-8765432-1', '98-765432109-8', '9876-5432-1098', 'Operations Manager', 'Operations', '55000.00']
    ]
  },
  special_entries: {
    label: 'General Journal / Special Entries',
    description: 'Adjusting, closing, and reclassification journal entries with debit and credit balance',
    filename: '2OS_General_Journal_Template.csv',
    headers: [
      'Entry Date',
      'Entry Number',
      'Account Code',
      'Account Title',
      'Debit Amount',
      'Credit Amount',
      'Explanation'
    ],
    sampleRows: [
      ['2026-08-31', 'JV-2026-001', '5050', 'Depreciation Expense', '15000.00', '0.00', 'Monthly depreciation on office equipment'],
      ['2026-08-31', 'JV-2026-001', '1550', 'Accumulated Depreciation - Office Equipment', '0.00', '15000.00', 'Monthly depreciation on office equipment']
    ]
  },
  ppe: {
    label: 'Property, Plant & Equipment (PPE)',
    description: 'Fixed asset registry, acquisition date, acquisition cost, salvage value, and useful life',
    filename: '2OS_PPE_Fixed_Assets_Template.csv',
    headers: [
      'Asset Name',
      'Category',
      'Acquisition Date',
      'Acquisition Cost',
      'Salvage Value',
      'Useful Life (Years)',
      'Depreciation Method'
    ],
    sampleRows: [
      ['MacBook Pro M3 Workstation', 'Office Equipment', '2026-01-15', '145000.00', '10000.00', '3', 'Straight-Line'],
      ['Conference Room Furniture', 'Furniture & Fixtures', '2026-02-01', '68000.00', '5000.00', '5', 'Straight-Line']
    ]
  }
};

// -------------------------------------------------------------
// DOWNLOAD TEMPLATE HELPER
// -------------------------------------------------------------
export function downloadCsvTemplate(type: ImportableDataType) {
  const tmpl = CSV_TEMPLATES[type];
  if (!tmpl) return;

  const escapeCell = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = tmpl.headers.map(escapeCell).join(',');
  const rowLines = tmpl.sampleRows.map(row => row.map(escapeCell).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerLine + '\n' + rowLines; // UTF-8 BOM for Excel compatibility

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', tmpl.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// CSV PARSER
// -------------------------------------------------------------
export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  // Normalize line breaks
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[][] = [];
  
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Push last field if exists
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // First line is headers
  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h, idx) => h.trim() || `Column_${idx + 1}`);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowValues = lines[i];
    // Skip empty lines
    if (rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0])) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = rowValues[colIdx] !== undefined ? rowValues[colIdx].trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// -------------------------------------------------------------
// SUMMARY CALCULATION PER COLUMN
// -------------------------------------------------------------
export function computeColumnSummaries(headers: string[], rows: Record<string, string>[]): ColumnSummary[] {
  return headers.map(header => {
    let count = 0;
    let blankCount = 0;
    let sum = 0;
    let numericCount = 0;
    const sampleValues: string[] = [];

    rows.forEach(row => {
      const val = row[header];
      if (val === undefined || val === null || val === '') {
        blankCount++;
      } else {
        count++;
        if (sampleValues.length < 3 && val) {
          sampleValues.push(val);
        }

        // Clean numeric string (e.g. "₱1,200.50", "1,200.50", " -150.00 ")
        const cleanVal = val.replace(/[₱$,]/g, '').trim();
        const num = Number(cleanVal);
        if (!isNaN(num) && cleanVal !== '' && !cleanVal.includes('-') && cleanVal.length < 16) {
          // Check if it's truly a number and not a phone/TIN/date
          sum += num;
          numericCount++;
        }
      }
    });

    // Check if column is predominantly numeric:
    // Exclude columns known to be TIN, phone, codes, dates, account numbers
    const isCodeOrId = /date|tin|id|code|number|phone|sss|philhealth|pagibig/i.test(header);
    const isAmountCol = /amount|sales|vat|tax|total|cost|price|balance|due|rate|debit|credit|discounts|withheld|salvage/i.test(header);
    
    const isNumeric = (isAmountCol || (numericCount > 0 && numericCount === count)) && !isCodeOrId;

    return {
      name: header,
      dataType: isNumeric ? 'numeric' : (/date/i.test(header) ? 'date' : 'text'),
      sum: isNumeric ? Math.round(sum * 100) / 100 : null,
      count,
      blankCount,
      sampleValues
    };
  });
}

// -------------------------------------------------------------
// ROW MAPPERS FOR DATABASE COMMIT
// -------------------------------------------------------------
export function mapRowsToSales(rows: Record<string, string>[], companyName: string): Partial<Sale>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    const gross = getNumber(['grossamount', 'totalamount', 'invoiceamount', 'amount']);
    const outputVat = getNumber(['outputvat', 'vatamount', 'vat']);
    const vatable = getNumber(['vatablesales', 'vatableamount']) || (gross > 0 && outputVat > 0 ? gross - outputVat : 0);
    const exempt = getNumber(['vatexempt', 'exempt']);
    const withholding = getNumber(['withholding', '2307', 'cwt', 'taxwithheld']);

    return {
      id: Date.now() + idx,
      company_name: companyName,
      invoice_number: getValue(['invoicenumber', 'invoiceno', 'invoiceref', 'invno']) || `SI-${Date.now() + idx}`,
      invoice_date: getValue(['invoicedate', 'date', 'issuedate']) || new Date().toISOString().split('T')[0],
      issue_date: getValue(['invoicedate', 'date', 'issuedate']) || new Date().toISOString().split('T')[0],
      customer_name: getValue(['customername', 'customer', 'clientname', 'client', 'registeredname']) || 'Walk-in Customer',
      registered_name: getValue(['customername', 'customer', 'clientname', 'client', 'registeredname']) || 'Walk-in Customer',
      customer_tin: getValue(['customertin', 'clienttin', 'tin']) || '000-000-000-00000',
      client_TIN: getValue(['customertin', 'clienttin', 'tin']) || '000-000-000-00000',
      invoice_amount: gross,
      total_amount_due: gross,
      amount: gross,
      vatable_sales: vatable,
      output_vat: outputVat,
      vat: outputVat,
      vat_exempt_amount: exempt,
      vat_exempt: exempt,
      withholding_2307: withholding,
      less_withholding_tax: withholding,
      sales_status: (getValue(['status', 'salesstatus']) || 'Unpaid') as any,
      collection_status: (getValue(['status', 'salesstatus']) || 'Unpaid') as any,
      description: getValue(['description', 'particulars', 'notes']) || 'Imported Sales Invoice',
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToExpenses(rows: Record<string, string>[], companyName: string): Partial<Expense>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    const gross = getNumber(['grossamount', 'totalamount', 'expenseamount', 'amount']);
    const inputVat = getNumber(['inputvat', 'vatamount', 'vat']);
    const withholding = getNumber(['withholding', '2307', '2306', 'taxwithheld']);

    return {
      id: Date.now() + idx,
      company_name: companyName,
      voucher_number: getValue(['vouchernumber', 'voucherno', 'voucheref', 'apvno']) || `APV-${Date.now() + idx}`,
      expense_date: getValue(['expensedate', 'date', 'issuedate']) || new Date().toISOString().split('T')[0],
      issue_date: getValue(['expensedate', 'date', 'issuedate']) || new Date().toISOString().split('T')[0],
      service_provider_name: getValue(['suppliername', 'serviceprovidername', 'supplier', 'vendor', 'payee']) || 'General Supplier',
      registered_name: getValue(['suppliername', 'serviceprovidername', 'supplier', 'vendor', 'payee']) || 'General Supplier',
      service_provider_tin: getValue(['suppliertin', 'serviceprovidertin', 'tin']) || '000-000-000-00000',
      service_provider_TIN: getValue(['suppliertin', 'serviceprovidertin', 'tin']) || '000-000-000-00000',
      expense_type: getValue(['expensecategory', 'expensetype', 'category']) || 'General Expenses',
      expense_invoice_amount: gross,
      amount: gross,
      total_amount_due: gross,
      vat_input_amount: inputVat,
      vat: inputVat,
      withholding_2307_2306: withholding,
      less_withholding_tax: withholding,
      nonvat_or_vat: (getValue(['vattype', 'nonvatorvat']) || (inputVat > 0 ? 'VAT' : 'NONVAT')) as any,
      expense_status: (getValue(['status', 'expensestatus']) || 'Unpaid') as any,
      description: getValue(['description', 'particulars', 'notes']) || 'Imported Expense Voucher',
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToCollections(rows: Record<string, string>[], companyName: string): Partial<Collection>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    const collected = getNumber(['amountcollected', 'collectedamount', 'amount']);
    const withheld = getNumber(['amountwithheld', 'withheld', '2307']);

    return {
      id: Date.now() + idx,
      company_name: companyName,
      entry_number: getValue(['entrynumber', 'entryno', 'receiptno']) || `CR-${Date.now() + idx}`,
      invoice_number: getValue(['invoicematched', 'invoicenumber', 'invoiceno']) || '',
      collection_date: getValue(['collectiondate', 'date', 'receiptdate']) || new Date().toISOString().split('T')[0],
      customer_name: getValue(['customername', 'customer', 'clientname', 'client']) || 'Customer',
      registered_name: getValue(['customername', 'customer', 'clientname', 'client']) || 'Customer',
      amount_collected: collected,
      amount: collected,
      amount_withheld_2307: withheld,
      tax_withheld: withheld,
      payment_method: getValue(['paymentmethod', 'method']) || 'Cash/Bank',
      OR_PR_number: getValue(['orprnumber', 'orno', 'prno', 'officialreceipt']) || `OR-${Date.now() + idx}`,
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToPayments(rows: Record<string, string>[], companyName: string): Partial<Payment>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    const paid = getNumber(['amountpaid', 'paidamount', 'amount']);
    const withheld = getNumber(['withholding', '2307', 'withheld']);

    return {
      id: Date.now() + idx,
      company_name: companyName,
      voucher_number: getValue(['vouchernumber', 'voucherno', 'apvno']) || '',
      payment_date: getValue(['paymentdate', 'date', 'disbursementdate']) || new Date().toISOString().split('T')[0],
      service_provider_name: getValue(['suppliername', 'serviceprovidername', 'payee', 'vendor']) || 'Payee',
      registered_name: getValue(['suppliername', 'serviceprovidername', 'payee', 'vendor']) || 'Payee',
      amount_paid: paid,
      amount: paid,
      withholding_tax_2307: withheld,
      tax_withheld: withheld,
      payment_method: getValue(['paymentmethod', 'method']) || 'Check',
      check_voucher_number: getValue(['checkrefnumber', 'checknumber', 'checkno', 'refno']) || `CV-${Date.now() + idx}`,
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToCustomers(rows: Record<string, string>[]): Partial<Customer>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    return {
      id: Date.now() + idx,
      name: getValue(['customername', 'name', 'registeredname']) || `Customer ${idx + 1}`,
      tin: getValue(['tin', 'customertin']) || '000-000-000-00000',
      address: getValue(['address', 'businessaddress']) || 'Philippines',
      contact_person: getValue(['contactperson', 'contact']) || '',
      email: getValue(['email', 'emailaddress']) || '',
      phone: getValue(['phone', 'contactnumber', 'tel']) || '',
      line_of_business: getValue(['lineofbusiness', 'industry', 'businessline']) || 'Commercial Trade',
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToProviders(rows: Record<string, string>[]): Partial<Contractor>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    return {
      id: Date.now() + idx,
      name: getValue(['providername', 'suppliername', 'name']) || `Provider ${idx + 1}`,
      tin: getValue(['tin', 'suppliertin']) || '000-000-000-00000',
      address: getValue(['address', 'businessaddress']) || 'Philippines',
      service_type: getValue(['servicetype', 'services', 'category']) || 'Professional Services',
      atc_code: getValue(['atccode', 'atc']) || 'WI100',
      email: getValue(['email']) || '',
      phone: getValue(['phone', 'contactnumber']) || '',
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToAccountTitles(rows: Record<string, string>[]): Partial<AccountTitle>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    return {
      id: Date.now() + idx,
      code: getValue(['accountcode', 'code']) || `${1000 + idx}`,
      name: getValue(['accounttitle', 'name', 'accountname']) || `Account ${idx + 1}`,
      type: (getValue(['accounttype', 'type']) || 'Asset') as any,
      classification: getValue(['classification', 'category']) || 'Current Asset',
      normal_balance: (getValue(['normalbalance', 'balance']) || 'Debit') as any,
      is_active: true
    };
  });
}

export function mapRowsToEmployees(rows: Record<string, string>[], companyName: string): any[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    return {
      id: Date.now() + idx,
      company_name: companyName,
      employee_id: getValue(['employeeid', 'id', 'empno']) || `EMP-${100 + idx}`,
      name: getValue(['fullname', 'name', 'employeename']) || `Employee ${idx + 1}`,
      tin: getValue(['tin']) || '000-000-000-00000',
      sss_number: getValue(['sssnumber', 'sss']) || '',
      philhealth_number: getValue(['philhealthnumber', 'philhealth', 'phic']) || '',
      pagibig_number: getValue(['pagibignumber', 'pagibig', 'hdmf']) || '',
      position: getValue(['position', 'designation', 'role']) || 'Staff',
      department: getValue(['department', 'dept']) || 'General',
      monthly_rate: getNumber(['monthlyrate', 'salary', 'basicpay'], 30000),
      is_active: true,
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToSpecialEntries(rows: Record<string, string>[], companyName: string): Partial<SpecialEntry>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    return {
      id: Date.now() + idx,
      company_name: companyName,
      entry_date: getValue(['entrydate', 'date']) || new Date().toISOString().split('T')[0],
      entry_number: getValue(['entrynumber', 'entryno', 'jvno']) || `JV-${Date.now() + idx}`,
      account_code: getValue(['accountcode', 'code']) || '1010',
      account_title: getValue(['accounttitle', 'title', 'account']) || 'Cash in Bank',
      debit: getNumber(['debitamount', 'debit']),
      credit: getNumber(['creditamount', 'credit']),
      explanation: getValue(['explanation', 'description', 'notes']) || 'Imported Journal Entry',
      created_at: new Date().toISOString()
    };
  });
}

export function mapRowsToPPE(rows: Record<string, string>[], companyName: string): Partial<PPEAsset>[] {
  return rows.map((r, idx) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        for (const [col, val] of Object.entries(r)) {
          if (col.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return val;
          }
        }
      }
      return '';
    };

    const getNumber = (keys: string[], def: number = 0) => {
      const raw = getValue(keys).replace(/[₱$,]/g, '').trim();
      const n = parseFloat(raw);
      return isNaN(n) ? def : n;
    };

    const cost = getNumber(['acquisitioncost', 'cost', 'amount'], 50000);
    const salvage = getNumber(['salvagevalue', 'salvage'], 5000);
    const life = getNumber(['usefullife', 'life', 'years'], 5);

    return {
      id: Date.now() + idx,
      company_name: companyName,
      asset_name: getValue(['assetname', 'name', 'asset']) || `Asset ${idx + 1}`,
      asset_category: getValue(['category', 'assetcategory']) || 'Office Equipment',
      acquisition_date: getValue(['acquisitiondate', 'date']) || new Date().toISOString().split('T')[0],
      acquisition_cost: cost,
      salvage_value: salvage,
      useful_life_years: life,
      depreciation_method: (getValue(['depreciationmethod', 'method']) || 'Straight-Line') as any,
      created_at: new Date().toISOString()
    };
  });
}

// -------------------------------------------------------------
// EXPORT HELPER (CSV & XLSX)
// -------------------------------------------------------------
export function exportToCsv(filename: string, headers: string[], rows: Record<string, any>[]) {
  const escapeCell = (val: any) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(row => headers.map(h => escapeCell(row[h])).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerLine + '\n' + rowLines;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
