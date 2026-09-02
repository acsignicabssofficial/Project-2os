import * as XLSX from 'xlsx';
import { 
  Sale, 
  Collection, 
  Expense, 
  Payment, 
  Company, 
  Customer, 
  Contractor, 
  PPEAsset, 
  SpecialEntry,
  AccountTitle
} from '../types';

export function exportActiveSheetTo2OS(tabKey: string, data: any, companyName: string = 'Company') {
  const wb = XLSX.utils.book_new();
  let sheetName = tabKey.toUpperCase().substring(0, 31);
  let wsData: any[] = [];

  if (Array.isArray(data) && data.length > 0) {
    wsData = data.map(item => {
      const cleanItem: Record<string, any> = {};
      Object.keys(item).forEach(k => {
        if (typeof item[k] !== 'object' || item[k] === null) {
          cleanItem[k] = item[k];
        }
      });
      return cleanItem;
    });
  } else {
    wsData = [{ Info: `No records found for ${tabKey}` }];
  }

  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${companyName}_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportFullAccountingWorkbookTo2OS(params: {
  companyName: string;
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  payments: Payment[];
  specialEntries: SpecialEntry[];
  ppeAssets: PPEAsset[];
  customers: Customer[];
  contractors: Contractor[];
  employees: any[];
  payrollRecords: any[];
  accountTitles: AccountTitle[];
}) {
  const wb = XLSX.utils.book_new();
  const safeName = (params.companyName || '2OS_Accounting').replace(/[/\\?%*:|"<>]/g, '_');

  // 1. Sales Sheet
  if (params.sales.length > 0) {
    const wsSales = XLSX.utils.json_to_sheet(params.sales.map(s => ({
      Date: s.issue_date || s.invoice_date || '',
      Invoice_No: s.invoice_number || '',
      Customer: s.registered_name || s.customer_name || '',
      TIN: s.client_TIN || s.customer_tin || '',
      Gross_Sales: s.total_amount_due || s.amount || 0,
      Vatable_Sales: s.vatable_sales || 0,
      Output_VAT: s.vat || s.output_vat || 0,
      Vat_Exempt_Sales: s.vat_exempt || 0,
      Zero_Rated_Sales: s.zero_rated || 0,
      CWT_2307_Withheld: s.less_withholding_tax || s.withholding_2307 || 0,
      Net_Receivable: s.amount_net_of_vat || 0,
      Status: s.collection_status || s.sales_status || 'Unpaid'
    })));
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales_Register');
  }

  // 2. Collections Sheet
  if (params.collections.length > 0) {
    const wsCollections = XLSX.utils.json_to_sheet(params.collections.map(c => ({
      Date: c.collection_date || '',
      Entry_No: c.entry_number || '',
      Customer: c.registered_name || c.customer_name || '',
      Amount_Collected: c.amount_collected || 0,
      Invoice_Matched: c.invoice_number || '',
      CWT_2307_Deducted: c.amount_withheld_2307 || 0,
      Remaining_Balance: c.balance || 0
    })));
    XLSX.utils.book_append_sheet(wb, wsCollections, 'Cash_Receipts');
  }

  // 3. Expenses Sheet
  if (params.expenses.length > 0) {
    const wsExpenses = XLSX.utils.json_to_sheet(params.expenses.map(e => ({
      Date: e.issue_date || e.expense_date || '',
      Voucher_No: e.voucher_number || e.invoice_number || '',
      Supplier: e.registered_name || e.service_provider_name || '',
      TIN: e.service_provider_TIN || e.sp_tin || '',
      Description: e.description || '',
      Gross_Expense: e.total_amount_due || e.amount || 0,
      Vatable_Purchases: e.vatable_expense || 0,
      Input_VAT: e.vat || e.vat_input_amount || 0,
      EWT_Withheld: e.less_withholding_tax || e.withholding_2307_2306 || 0,
      Net_Payable: e.amount_net_of_vat || 0,
      Status: e.payment_status || 'Unpaid'
    })));
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Purchase_Book');
  }

  // 4. Disbursements Sheet
  if (params.payments.length > 0) {
    const wsPayments = XLSX.utils.json_to_sheet(params.payments.map(p => ({
      Date: p.payment_date || '',
      Check_Voucher: p.voucher_number || '',
      Payee: p.registered_name || p.service_provider_name || '',
      Amount_Paid: p.amount_paid || 0,
      EWT_Withheld: p.withholding_tax_2307 || 0,
      Remaining_Balance: p.balance || 0
    })));
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Cash_Disbursements');
  }

  // 5. General Ledger / Chart of Accounts
  if (params.accountTitles.length > 0) {
    const wsCOA = XLSX.utils.json_to_sheet(params.accountTitles.map(a => ({
      Account_Code: a.code || a.account_code || '',
      Account_Title: a.title || a.account_title || '',
      Classification: a.type || a.account_type || '',
      FS_Category: a.financial_statement_classification || a.category || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsCOA, 'Chart_of_Accounts');
  }

  // 6. Special Entries Sheet
  if (params.specialEntries.length > 0) {
    const wsSpecial = XLSX.utils.json_to_sheet(params.specialEntries.map(se => {
      const totalDebit = se.lines?.filter(l => l.type === 'Debit').reduce((sum, l) => sum + (Number(l.amount) || 0), 0) || 0;
      const totalCredit = se.lines?.filter(l => l.type === 'Credit').reduce((sum, l) => sum + (Number(l.amount) || 0), 0) || 0;
      return {
        Date: se.entry_date,
        Entry_Number: se.entry_number,
        Voucher_No: se.voucher_no,
        Type: se.entry_type,
        Description: se.description,
        Total_Debit: totalDebit,
        Total_Credit: totalCredit,
        Status: Math.abs(totalDebit - totalCredit) < 0.01 ? 'BALANCED' : 'UNBALANCED'
      };
    }));
    XLSX.utils.book_append_sheet(wb, wsSpecial, 'Special_Entries_JV');
  }

  // 7. PPE & Depreciation Schedule
  if (params.ppeAssets.length > 0) {
    const wsPPE = XLSX.utils.json_to_sheet(params.ppeAssets.map(a => ({
      Asset_Tag: a.asset_code || a.id,
      Asset_Name: a.asset_name,
      Acquisition_Date: a.acquisition_date,
      Acquisition_Cost: a.acquisition_cost,
      Salvage_Value: a.salvage_value,
      Useful_Life_Years: a.useful_life_years,
      Accumulated_Depreciation: a.accumulated_depreciation || 0,
      Net_Book_Value: a.net_book_value || (a.acquisition_cost - (a.accumulated_depreciation || 0))
    })));
    XLSX.utils.book_append_sheet(wb, wsPPE, 'PPE_Depreciation');
  }

  // 8. Employees & Payroll
  if (params.employees.length > 0) {
    const wsEmp = XLSX.utils.json_to_sheet(params.employees.map(emp => ({
      Employee_ID: emp.employee_id || emp.id,
      Full_Name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name,
      TIN: emp.tin || '',
      Monthly_Rate: emp.monthly_rate || emp.basic_salary || 0,
      SSS_No: emp.sss_number || '',
      PhilHealth_No: emp.philhealth_number || '',
      PagIBIG_No: emp.pagibig_number || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Employee_Masterlist');
  }

  XLSX.writeFile(wb, `${safeName}_Full_Accounting_Workbook_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
