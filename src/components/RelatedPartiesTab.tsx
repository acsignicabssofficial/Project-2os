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
  expenses?: Expense[];
  payments?: Payment[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
  accountTitles?: AccountTitle[];
  globalSearch?: string;
  initialSubTab?: 'customers' | 'providers' | 'various';
  subsidiarySales?: UniformBookRecord[];
  setSubsidiarySales?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
  collectionsRecords?: UniformBookRecord[];
  setCollectionsRecords?: (updater: (prev: UniformBookRecord[]) => UniformBookRecord[]) => void;
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
  expenses = [],
  payments = [],
  setExpenses,
  setPayments,
  accountTitles = [],
  globalSearch,
  initialSubTab = 'customers',
  subsidiarySales = [],
  setSubsidiarySales,
  collectionsRecords = [],
  setCollectionsRecords
}: RelatedPartiesTabProps) {
  const [subTab, setSubTab] = useState<'customers' | 'providers' | 'various'>(initialSubTab);

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
      <div className={`p-4 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-200`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${theme.textTitle}`}>Related Parties Masterlist</h2>
            <p className={`text-xs ${theme.textMuted}`}>Manage profile records for Customers, Clients, Various Customers, and Service Providers</p>
          </div>
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
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{customers.length}</span>
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
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{contractors.length}</span>
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
          globalSearch={globalSearch}
        />
      ) : subTab === 'various' ? (
        <VariousCustomersTab
          subsidiarySales={subsidiarySales}
          setSubsidiarySales={setSubsidiarySales || (() => {})}
          collections={collectionsRecords}
          setCollections={setCollectionsRecords || (() => {})}
          customers={customers}
          setCustomers={setCustomers}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          globalSearch={globalSearch}
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
        />
      )}
    </div>
  );
}

