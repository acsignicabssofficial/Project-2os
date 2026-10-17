import React, { useState, useMemo } from 'react';
import CustomersTab from './CustomersTab';
import ProvidersTab from './ProvidersTab';
import VariousCustomersTab from './VariousCustomersTab';
import { Customer, Contractor, Sale, Collection, Expense, Payment, AccountTitle, Company, UniformBookRecord } from '../types';
import { Users, Truck, Handshake, ShoppingBag } from 'lucide-react';

interface RelatedPartiesTabProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  contractors: Contractor[];
  setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  sales: Sale[];
  collections: Collection[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  setCashReceipts?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  expenses?: Expense[];
  payments?: Payment[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
  setCashDisbursements?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  accountTitles?: AccountTitle[];
  globalSearch?: string;
  initialSubTab?: 'customers' | 'providers' | 'various';
  subsidiarySales?: UniformBookRecord[];
  setSubsidiarySales?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  collectionsRecords?: UniformBookRecord[];
  setCollectionsRecords?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  onDeleteRecord?: (bookType: string, record: UniformBookRecord) => void;
}

export default function RelatedPartiesTab({
  customers,
  setCustomers,
  contractors,
  setContractors,
  activeCompany,
  theme,
  triggerAlert,
  sales,
  collections,
  setSales,
  setCollections,
  setCashReceipts,
  expenses = [],
  payments = [],
  setExpenses,
  setPayments,
  setCashDisbursements,
  accountTitles = [],
  globalSearch,
  initialSubTab = 'customers',
  subsidiarySales = [],
  setSubsidiarySales,
  collectionsRecords = [],
  setCollectionsRecords,
  onDeleteRecord
}: RelatedPartiesTabProps) {
  const [subTab, setSubTab] = useState<'customers' | 'providers' | 'various'>(initialSubTab);

  // Badge counts only the ACTIVE entity's directory (same rule the Customers / Providers lists use)
  const scopedCustomerCount = useMemo(() => {
    const name = (activeCompany?.company_name || '').trim().toLowerCase();
    return name ? customers.filter((c: any) => String(c.company_name || '').trim().toLowerCase() === name).length : 0;
  }, [customers, activeCompany]);
  const scopedProviderCount = useMemo(() => {
    const name = (activeCompany?.company_name || '').trim().toLowerCase();
    return name ? contractors.filter((c: any) => String(c.company_name || '').trim().toLowerCase() === name).length : 0;
  }, [contractors, activeCompany]);

  // Count various customer transactions
  const variousCount = useMemo(() => {
    const activeCompName = activeCompany?.company_name || '';
    const records = subsidiarySales.length > 0 ? subsidiarySales : (sales as any);
    return records.filter((s: any) => {
      if (s.is_cancelled) return false;
      if (activeCompName && s.company_name && s.company_name !== activeCompName) return false;
      const rawTinDigits = (s.tin || s.client_TIN || '').replace(/\D/g, '');
      const isDummyTin = !rawTinDigits || rawTinDigits.length < 9 || /^0+$/.test(rawTinDigits);
      const isVariousName = (s.registered_name || s.customer_name || '').toLowerCase().includes('various');
      return isDummyTin || isVariousName || s.is_various === true;
    }).length;
  }, [subsidiarySales, sales, activeCompany]);

  return (
    <div className="space-y-6">
      {/* Related Parties Sub-navigation Header */}
      <div className={`p-3 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-200`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Handshake className="w-5 h-5" />
          </div>
          <span className={`text-xs font-semibold ${theme.textMuted}`}>Select Directory Segment:</span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-800/20 p-1.5 rounded-xl border border-zinc-700/30 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('customers')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              subTab === 'customers'
                ? `${theme.accentBg} shadow-sm`
                : `${theme.textMuted} hover:text-zinc-200 hover:bg-zinc-800/40`
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer / Client Details</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{scopedCustomerCount}</span>
          </button>

          <button
            onClick={() => setSubTab('various')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              subTab === 'various'
                ? `${theme.accentBg} shadow-sm`
                : `${theme.textMuted} hover:text-zinc-200 hover:bg-zinc-800/40`
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Various Customers</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${variousCount > 0 ? 'bg-amber-500/30 text-amber-300' : 'bg-black/20'}`}>
              {variousCount}
            </span>
          </button>

          <button
            onClick={() => setSubTab('providers')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              subTab === 'providers'
                ? `${theme.accentBg} shadow-sm`
                : `${theme.textMuted} hover:text-zinc-200 hover:bg-zinc-800/40`
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Contractors / Providers</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{scopedProviderCount}</span>
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {subTab === 'customers' ? (
        <CustomersTab
          customers={customers}
          setCustomers={setCustomers}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          sales={sales}
          collections={collections}
          setSales={setSales}
          setCollections={setCollections}
          setCashReceipts={setCashReceipts as any}
          onDeleteRecord={onDeleteRecord}
          globalSearch={globalSearch}
        />
      ) : subTab === 'various' ? (
        <VariousCustomersTab
          subsidiarySales={subsidiarySales}
          setSubsidiarySales={setSubsidiarySales || (() => {})}
          collections={collectionsRecords}
          setCollections={setCollectionsRecords || (() => {})}
          setCashReceipts={setCashReceipts as any}
          customers={customers}
          setCustomers={setCustomers}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          globalSearch={globalSearch}
          onDeleteRecord={onDeleteRecord}
        />
      ) : (
        <ProvidersTab
          serviceProviders={contractors}
          setServiceProviders={setContractors}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          globalSearch={globalSearch}
          expenses={expenses}
          payments={payments}
          setExpenses={setExpenses}
          setPayments={setPayments}
          accountTitles={accountTitles}
          onDeleteRecord={onDeleteRecord}
        />
      )}
    </div>
  );
}