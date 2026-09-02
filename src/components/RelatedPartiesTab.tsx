import React, { useState } from 'react';
import CustomersTab from './CustomersTab';
import ProvidersTab from './ProvidersTab';
import { Customer, Contractor, Sale, Collection, Company } from '../types';
import { Users, Truck, Handshake } from 'lucide-react';

interface RelatedPartiesTabProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  contractors: Contractor[];
  setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (msg: string) => void;
  sales: Sale[];
  collections: Collection[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  globalSearch?: string;
  initialSubTab?: 'customers' | 'providers';
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
  globalSearch,
  initialSubTab = 'customers'
}: RelatedPartiesTabProps) {
  const [subTab, setSubTab] = useState<'customers' | 'providers'>(initialSubTab);

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
            <p className={`text-xs ${theme.textMuted}`}>Manage profile records for Customers, Clients, Contractors, and Service Providers</p>
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
      ) : (
        <ProvidersTab
          serviceProviders={contractors}
          setServiceProviders={setContractors}
          activeCompany={activeCompany}
          theme={theme}
          triggerAlert={triggerAlert}
          globalSearch={globalSearch}
        />
      )}
    </div>
  );
}
