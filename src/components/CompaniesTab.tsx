import React, { useState, useMemo } from 'react';
import { Building2, Landmark, Check, Info, Pencil, Trash2, Plus, X, Search, CheckCircle2, ShieldCheck, Mail, Phone, Calendar, MapPin, FolderTree, Folder, AlertTriangle, ChevronRight, ChevronDown, GitBranch } from 'lucide-react';
import { Company } from '../types';

interface CompaniesTabProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  activeCompany: Company | null;
  setActiveCompany: (c: Company | null) => void;
  activeBranchCode?: string;
  onSelectBranch?: (code: string) => void;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

export default function CompaniesTab({
  companies,
  setCompanies,
  activeCompany,
  setActiveCompany,
  activeBranchCode = '00000',
  onSelectBranch,
  theme,
  triggerAlert,
  globalSearch = ''
}: CompaniesTabProps) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDirectoryCompany, setSelectedDirectoryCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [expandedMainTins, setExpandedMainTins] = useState<Record<string, boolean>>({});

  // 2 Clean Sub-tabs: 'company' (Profile / Information) and 'bir' (BIR 2303 Tax Obligations)
  const [formSubTab, setFormSubTab] = useState<'company' | 'bir'>('company');

  // Fields strictly aligned with Table Company
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [sameTradeName, setSameTradeName] = useState(false);
  const [entityType, setEntityType] = useState('CORPORATION');
  const [companyTin, setCompanyTin] = useState('');
  const [tinBranchCode, setTinBranchCode] = useState('00000');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [incorporationDate, setIncorporationDate] = useState('');
  const [rdo, setRdo] = useState('');
  const [lineOfBusiness, setLineOfBusiness] = useState('');

  // BIR 2303 Certificate of Registration (YES / NO fields)
  const [vatType, setVatType] = useState<'VATABLE' | 'NON-VAT' | 'EXEMPT'>('VATABLE');
  const [regFee, setRegFee] = useState<'Yes' | 'No'>('Yes');
  const [incomeTax, setIncomeTax] = useState<'Yes' | 'No'>('Yes');
  const [finalWithholding, setFinalWithholding] = useState<'Yes' | 'No'>('No');
  const [expandedWithholding, setExpandedWithholding] = useState<'Yes' | 'No'>('Yes');
  const [withholdingComp, setWithholdingComp] = useState<'Yes' | 'No'>('Yes');
  const [fringeBenefits, setFringeBenefits] = useState<'Yes' | 'No'>('No');
  const [relatedParty, setRelatedParty] = useState<'Yes' | 'No'>('No');
  const [documentaryStamp, setDocumentaryStamp] = useState<'Yes' | 'No'>('No');

  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);

  // Extract 9-digit TIN base and 5-digit branch code
  const extractBaseTin9 = (c: Company): string => {
    const raw = (c.company_tin || '').replace(/\D/g, '');
    return raw.slice(0, 9);
  };

  const extractBranch5 = (c: Company): string => {
    if (c.tin_branch_code && c.tin_branch_code.trim()) {
      return c.tin_branch_code.replace(/\D/g, '').padStart(5, '0').slice(0, 5);
    }
    const raw = (c.company_tin || '').replace(/\D/g, '');
    if (raw.length > 9) {
      return raw.slice(9, 14).padStart(5, '0').slice(0, 5);
    }
    return '00000';
  };

  const formatBranchRoleLabel = (branchCode: string): string => {
    const clean = (branchCode || '00000').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
    if (clean === '00000') return 'Head Office - Main';
    const num = parseInt(clean, 10);
    return `Branch ${isNaN(num) ? clean : num}`;
  };

  // Mask TIN (first 9 digits)
  const handleTinChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += '-' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 9);
    setCompanyTin(formatted);
  };

  const handleBranchCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setTinBranchCode(digits);
  };

  const resetForm = () => {
    setEditingCompanyId(null);
    setFormSubTab('company');
    setCompanyName('');
    setTradeName('');
    setSameTradeName(false);
    setEntityType('CORPORATION');
    setCompanyTin('');
    setTinBranchCode('00000');
    setCompanyAddress('');
    setCompanyEmail('');
    setCompanyContact('');
    setIncorporationDate('');
    setRdo('');
    setLineOfBusiness('');
    setVatType('VATABLE');
    setRegFee('Yes');
    setIncomeTax('Yes');
    setFinalWithholding('No');
    setExpandedWithholding('Yes');
    setWithholdingComp('Yes');
    setFringeBenefits('No');
    setRelatedParty('No');
    setDocumentaryStamp('No');
  };

  const openNewCompanyModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompName = companyName.trim();
    const finalTradeName = (sameTradeName ? finalCompName : tradeName.trim());
    const cleanTinDigits = companyTin.replace(/\D/g, '');
    const rawBranchDigits = tinBranchCode.replace(/\D/g, '');
    const cleanBranch = rawBranchDigits ? rawBranchDigits.padStart(5, '0').slice(0, 5) : '';

    if (!finalCompName) {
      triggerAlert('Company Name is required.', 'error');
      return;
    }
    if (!finalTradeName) {
      triggerAlert('Trade Name is required (or check "Same with Company Name").', 'error');
      return;
    }
    if (!entityType) {
      triggerAlert('Entity Type is required.', 'error');
      return;
    }
    if (cleanTinDigits.length !== 9) {
      triggerAlert('Company TIN (9 Digits) is required.', 'error');
      return;
    }
    if (!cleanBranch) {
      triggerAlert('Branch Code is required (e.g. 00000 for Main, 00001 for Branch 1).', 'error');
      return;
    }
    if (!incorporationDate) {
      triggerAlert('Birthday / Incorporation Date is required.', 'error');
      return;
    }
    if (!rdo.trim()) {
      triggerAlert('RDO Code / District is required.', 'error');
      return;
    }

    const formattedTin9 = `${cleanTinDigits.slice(0, 3)}-${cleanTinDigits.slice(3, 6)}-${cleanTinDigits.slice(6, 9)}`;
    const formattedFullTin = `${formattedTin9}-${cleanBranch}`;

    const savedCompany: Company = {
      id: editingCompanyId !== null ? editingCompanyId : Date.now(),
      company_name: finalCompName,
      trade_name: finalTradeName,
      entity_type: entityType,
      company_tin: formattedFullTin,
      tin_branch_code: cleanBranch,
      company_address: companyAddress.trim(),
      registered_address: companyAddress.trim(),
      company_email: companyEmail.trim(),
      company_contact: companyContact.trim(),
      birthday_or_incorporation_date: incorporationDate,
      rdo: rdo.trim(),
      rdo_code: rdo.trim(),
      line_of_business: lineOfBusiness.trim(),
      vat_or_non_vat: vatType,
      registration_fee: regFee === 'Yes',
      income_tax: incomeTax === 'Yes',
      form_0619f: finalWithholding === 'Yes',
      withholding_expanded: expandedWithholding === 'Yes',
      withholding_compensation: withholdingComp === 'Yes',
      withholding_fringe_benefit: fringeBenefits === 'Yes',
      date_of_entry: new Date().toISOString().split('T')[0]
    };

    const createdYear = incorporationDate ? incorporationDate.slice(0, 4) : 2026;

    // Trigger local desktop & server filesystem entity directory creation
    fetch('/api/create-entity-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: finalCompName,
        branch_code: cleanBranch,
        year: createdYear
      })
    })
      .then(r => r.json())
      .then(res => {
        console.log("Entity directory created:", res);
      })
      .catch(err => {
        console.error("Entity directory error:", err);
      });

    // Automatically expand this TIN group in the Directory table if it has branches
    setExpandedMainTins(prev => ({ ...prev, [cleanTinDigits]: true }));

    if (editingCompanyId !== null) {
      setCompanies(prev => prev.map(c => {
        if (c.id === editingCompanyId) {
          if (activeCompany && activeCompany.id === editingCompanyId) {
            setActiveCompany(savedCompany);
            if (onSelectBranch) onSelectBranch(cleanBranch);
          }
          return savedCompany;
        }
        return c;
      }));
      triggerAlert(`Entity profile "${finalCompName}" (${formatBranchRoleLabel(cleanBranch)}) updated!`, 'success');
      resetForm();
      setIsModalOpen(false);
    } else {
      setCompanies(prev => [...prev, savedCompany]);
      setActiveCompany(savedCompany);
      if (onSelectBranch) onSelectBranch(cleanBranch);
      triggerAlert(`Entity profile "${finalCompName}" (${formatBranchRoleLabel(cleanBranch)}) registered!`, 'success');
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
  };

  const confirmDeleteCompany = () => {
    if (!companyToDelete) return;
    const { id, company_name } = companyToDelete;
    const remaining = companies.filter(c => c.id !== id);
    setCompanies(remaining);
    if (activeCompany && activeCompany.id === id) {
      const nextComp = remaining.length > 0 ? remaining[0] : null;
      setActiveCompany(nextComp);
      if (nextComp && onSelectBranch) {
        onSelectBranch(extractBranch5(nextComp));
      }
    }
    if (selectedDirectoryCompany && selectedDirectoryCompany.id === id) {
      setSelectedDirectoryCompany(null);
    }
    triggerAlert(`Deleted Company profile "${company_name || 'Entity'}" successfully!`, 'info');
    setCompanyToDelete(null);
  };

  const handleEditClick = (c: Company) => {
    setEditingCompanyId(c.id);
    setFormSubTab('company');
    const cName = c.company_name || '';
    const tName = c.trade_name || cName;
    setCompanyName(cName);
    setTradeName(tName);
    setSameTradeName(Boolean(cName && tName && cName === tName));
    setEntityType(c.entity_type || 'CORPORATION');
    
    const tinStr = (c.company_tin || '');
    const splitIndex = tinStr.lastIndexOf('-');
    if (splitIndex !== -1 && splitIndex > 5) {
      setCompanyTin(tinStr.slice(0, splitIndex));
      setTinBranchCode(tinStr.slice(splitIndex + 1));
    } else {
      setCompanyTin(tinStr);
      setTinBranchCode(c.tin_branch_code || '00000');
    }

    setCompanyAddress(c.company_address || c.registered_address || '');
    setCompanyEmail(c.company_email || '');
    setCompanyContact(c.company_contact || '');
    setIncorporationDate(c.birthday_or_incorporation_date || '');
    setRdo(c.rdo || c.rdo_code || '');
    setLineOfBusiness(c.line_of_business || '');

    // BIR 2303
    setVatType((c.vat_or_non_vat as any) || 'VATABLE');
    setRegFee(c.registration_fee ? 'Yes' : 'No');
    setIncomeTax(c.income_tax ? 'Yes' : 'No');
    setFinalWithholding(c.form_0619f ? 'Yes' : 'No');
    setExpandedWithholding(c.withholding_expanded ? 'Yes' : 'No');
    setWithholdingComp(c.withholding_compensation ? 'Yes' : 'No');
    setFringeBenefits(c.withholding_fringe_benefit ? 'Yes' : 'No');
    setRelatedParty('No');
    setDocumentaryStamp('No');

    setIsModalOpen(true);
  };

  const filteredCompanies = companies.filter(c => {
    const q = (localSearch || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return (
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.trade_name && c.trade_name.toLowerCase().includes(q)) ||
      (c.company_tin && c.company_tin.toLowerCase().includes(q)) ||
      (c.entity_type && c.entity_type.toLowerCase().includes(q)) ||
      (c.rdo && c.rdo.toLowerCase().includes(q))
    );
  });

  // Group entities by 9-digit TIN so Main (00000) is the parent row with a collapse/expand arrow for its branches (00001, 00009, etc.)
  const groupedEntityHierarchy = useMemo(() => {
    const groupsMap = new Map<string, { main: Company | null; branches: Company[]; tinKey: string }>();

    filteredCompanies.forEach(c => {
      const baseTin = extractBaseTin9(c) || `id_${c.id}`;
      const branchCode = extractBranch5(c);
      if (!groupsMap.has(baseTin)) {
        groupsMap.set(baseTin, { main: null, branches: [], tinKey: baseTin });
      }
      const grp = groupsMap.get(baseTin)!;
      if (branchCode === '00000' && !grp.main) {
        grp.main = c;
      } else {
        grp.branches.push(c);
      }
    });

    // Sort branches numerically by branch code (00001 -> Branch 1, 00009 -> Branch 9, etc.)
    const result: Array<{ parent: Company; children: Company[]; tinKey: string }> = [];
    groupsMap.forEach((grp) => {
      const sortedBranches = [...grp.branches].sort((a, b) => {
        const numA = parseInt(extractBranch5(a), 10) || 0;
        const numB = parseInt(extractBranch5(b), 10) || 0;
        return numA - numB;
      });
      if (grp.main) {
        result.push({
          parent: grp.main,
          children: sortedBranches,
          tinKey: grp.tinKey
        });
      } else if (sortedBranches.length > 0) {
        // Fallback if a branch exists before a 00000 main is created
        result.push({
          parent: sortedBranches[0],
          children: sortedBranches.slice(1),
          tinKey: grp.tinKey
        });
      }
    });

    return result;
  }, [filteredCompanies]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* REGISTERED COMPANIES MASTERLIST DATABASE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
        {/* HEADER & CONTROLS */}
        <div className={`p-5 border-b ${theme.borderCard} flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-lg ${theme.textTitle}`}>
                  Company Profiles & Registration Database
                </h2>
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-mono font-bold">
                  {companies.length} {companies.length === 1 ? 'entity' : 'entities'}
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Official registered companies, entity classification, contact information, and BIR 2303 tax obligations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search company, TIN, or RDO..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className={`pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent w-56 font-sans ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-pink-500`}
              />
            </div>

            {/* REGISTER COMPANY BUTTON (OPENS POPUP MODAL) */}
            <button
              type="button"
              onClick={openNewCompanyModal}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Register Company Profile / Entity
            </button>
          </div>
        </div>

        {/* DATABASE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3.5">Company TIN & Role</th>
                <th className="p-3.5">Company Name</th>
                <th className="p-3.5">Trade Name</th>
                <th className="p-3.5">Entity Type</th>
                <th className="p-3.5">RDO Code</th>
                <th className="p-3.5">Birthday / Incorp Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {groupedEntityHierarchy.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Company Entities Found</p>
                    <p className="text-xs mt-1">Click "Register Company Profile / Entity" above to register your first workspace.</p>
                  </td>
                </tr>
              ) : (
                groupedEntityHierarchy.map(({ parent, children, tinKey }) => {
                  const hasBranches = children.length > 0;
                  const isExpanded = expandedMainTins[tinKey] ?? true;

                  const renderRow = (c: Company, isChildBranch: boolean) => {
                    const branchCode = extractBranch5(c);
                    const roleLabel = formatBranchRoleLabel(branchCode);
                    const isMainEntity = branchCode === '00000';
                    const isActive = activeCompany?.id === c.id;

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-zinc-500/10 transition-colors ${
                          isActive ? 'bg-pink-500/5' : isChildBranch ? 'bg-cyan-500/[0.03]' : ''
                        }`}
                      >
                        <td className="p-3.5 font-mono font-bold">
                          <div className={`flex items-center gap-2 ${isChildBranch ? 'pl-6' : ''}`}>
                            {!isChildBranch && hasBranches ? (
                              <button
                                type="button"
                                onClick={() => setExpandedMainTins(prev => ({ ...prev, [tinKey]: !isExpanded }))}
                                className="p-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition cursor-pointer flex items-center justify-center"
                                title={isExpanded ? 'Collapse Branches' : `Expand ${children.length} Branch(es)`}
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            ) : isChildBranch ? (
                              <GitBranch className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                            ) : (
                              <span className="w-5 inline-block" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-cyan-600 dark:text-cyan-400">{c.company_tin}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold uppercase ${
                                  isMainEntity
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                }`}>
                                  {roleLabel}
                                </span>
                                {!isChildBranch && hasBranches && (
                                  <span className="text-[10px] font-sans font-bold text-cyan-600 dark:text-cyan-400">
                                    ({children.length} {children.length === 1 ? 'Branch' : 'Branches'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${theme.textTitle}`}>{c.company_name}</span>
                            {isActive && (
                              <span className="bg-pink-500/15 text-pink-500 dark:text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/20 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 inline" /> Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">
                          <span className={`text-xs font-semibold ${theme.textMain}`}>
                            {c.trade_name || c.company_name || '—'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold text-[11px]">
                            {c.entity_type || 'CORPORATION'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-xs">
                          {c.rdo || c.rdo_code || '—'}
                        </td>
                        <td className="p-3.5 font-mono text-zinc-500 dark:text-zinc-400">
                          {c.birthday_or_incorporation_date || '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCompany(c);
                                  if (onSelectBranch) {
                                    onSelectBranch(branchCode);
                                  }
                                  triggerAlert(`Switched active workspace to "${c.company_name}" (${roleLabel}).`, 'info');
                                }}
                                className="px-2.5 py-1 text-xs rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-500 dark:text-pink-400 hover:bg-pink-500/20 transition cursor-pointer font-bold"
                              >
                                Select
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDirectoryCompany(c);
                                fetch('/api/create-entity-directory', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    company_name: c.company_name,
                                    branch_code: c.tin_branch_code || '00000',
                                    year: c.birthday_or_incorporation_date ? c.birthday_or_incorporation_date.slice(0, 4) : 2026
                                  })
                                }).catch(() => {});
                              }}
                              className="p-1.5 rounded-lg border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
                              title="View / Sync Entity Directory Folder Structure"
                            >
                              <FolderTree className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(c)}
                              className="p-1.5 rounded-lg border border-zinc-400/40 dark:border-zinc-700 hover:bg-zinc-500/10 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
                              title="Edit Entity Profile"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCompany(c)}
                              className="p-1.5 rounded-lg border border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Delete Entity Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  };

                  return (
                    <React.Fragment key={tinKey}>
                      {renderRow(parent, false)}
                      {hasBranches && isExpanded && children.map(branch => renderRow(branch, true))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: REGISTER / EDIT COMPANY PROFILE ENTITY                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingCompanyId !== null ? "Update Company Profile" : "Register Company Profile / Entity"}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Branch code <span className="font-mono font-bold text-emerald-500">00000</span> = Main (Head Office). Any non-00000 branch code (<span className="font-mono font-bold text-sky-500">00001</span> = Branch 1, <span className="font-mono font-bold text-sky-500">00009</span> = Branch 9) is a Branch under the same TIN.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingCompanyId !== null && (
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider">
                    Editing mode
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2 CLEAN MODAL SUB-TABS: Company Information & BIR 2303 */}
            <div className="flex gap-2 px-6 pt-4 pb-2 border-b border-zinc-800/40 bg-zinc-500/5">
              <button
                type="button"
                onClick={() => setFormSubTab('company')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formSubTab === 'company'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Building2 className="w-4 h-4" />
                1. Company Profile & Tax Details
              </button>
              <button
                type="button"
                onClick={() => setFormSubTab('bir')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formSubTab === 'bir'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Landmark className="w-4 h-4" />
                2. BIR 2303 (Certificate of Registration)
              </button>
            </div>

            {/* MODAL SCROLLABLE BODY (FORM) */}
            <form onSubmit={handleSaveCompany} className="flex flex-col flex-1 overflow-y-auto p-6">
              {/* TAB 1: COMPANY INFORMATION */}
              {formSubTab === 'company' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. ABC Corporation"
                        value={companyName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCompanyName(val);
                          if (sameTradeName) {
                            setTradeName(val);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-pink-500`}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`block text-xs font-bold ${theme.textMuted}`}>Trade Name *</label>
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pink-500 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sameTradeName}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSameTradeName(checked);
                              if (checked) {
                                setTradeName(companyName);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded accent-pink-600 cursor-pointer"
                          />
                          <span>Same with Company Name</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. ABC Store / Brand Name"
                        value={sameTradeName ? companyName : tradeName}
                        onChange={(e) => {
                          setSameTradeName(false);
                          setTradeName(e.target.value);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-pink-500`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Entity Type *</label>
                      <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                        required
                      >
                        <option value="SOLE PROPRIETORSHIP" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Sole Proprietorship</option>
                        <option value="PARTNERSHIP" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Partnership</option>
                        <option value="CORPORATION" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Corporation</option>
                        <option value="OPC" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>One Person Corporation (OPC)</option>
                        <option value="COOPERATIVE" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Cooperative</option>
                        <option value="NON-PROFIT / FOUNDATION" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-Profit / Foundation</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company TIN (9 Digits) *</label>
                      <input
                        type="text"
                        placeholder="111-111-111"
                        value={companyTin}
                        onChange={(e) => handleTinChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`block text-xs font-bold ${theme.textMuted}`}>Branch Code (5 Digits) *</label>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          (tinBranchCode.replace(/\D/g, '').padStart(5, '0') === '00000')
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-sky-500/15 text-sky-500'
                        }`}>
                          {formatBranchRoleLabel(tinBranchCode)}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="00000"
                        value={tinBranchCode}
                        onChange={(e) => handleBranchCodeChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Birthday / Incorporation Date *</label>
                      <input
                        type="date"
                        value={incorporationDate}
                        onChange={(e) => setIncorporationDate(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>RDO Code / District *</label>
                      <input
                        type="text"
                        placeholder="e.g. 044 - Taguig"
                        value={rdo}
                        onChange={(e) => setRdo(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Address (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 15F Tower 1, Ayala Avenue, Makati City, Metro Manila"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="accounting@company.com"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Company Contact (Optional)</label>
                      <input
                        type="text"
                        placeholder="0917-123-4567"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Line of Business (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. General Wholesale & IT Consulting"
                        value={lineOfBusiness}
                        onChange={(e) => setLineOfBusiness(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-medium ${theme.borderInput} ${theme.textMain}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BIR 2303 (Certificate of Registration) */}
              {formSubTab === 'bir' && (
                <div className="flex flex-col gap-5 animate-fadeIn">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>VAT Registration Type (BIR Form 2303)</label>
                    <select
                      value={vatType}
                      onChange={(e) => setVatType(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-bold cursor-pointer ${theme.borderInput} ${theme.textMain}`}
                    >
                      <option value="VATABLE" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>VAT Registered (12%)</option>
                      <option value="NON-VAT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Non-VAT / Percentage Tax (1% or 3%)</option>
                      <option value="EXEMPT" className={theme.isLight ? "text-zinc-900 bg-white" : "text-white bg-[#121215]"}>Tax Exempt / PEZA / BOI Registered</option>
                    </select>
                  </div>

                  {/* YES / NO BIR 2303 REGISTERED TAX OBLIGATIONS */}
                  <div className={`p-4 rounded-xl border ${theme.borderCard} bg-zinc-500/5`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textTitle} flex items-center gap-2`}>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      BIR Registered Tax Types & Obligations (Yes / No Selectors)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* 1. Registration Fee */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Registration Fee</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 0605</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setRegFee('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              regFee === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegFee('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              regFee === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 2. Income Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Income Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 1701 / 1702 (ITR)</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setIncomeTax('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              incomeTax === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncomeTax('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              incomeTax === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 3. Final Withholding Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Final Withholding Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 0619F / 1601FQ</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setFinalWithholding('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              finalWithholding === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setFinalWithholding('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              finalWithholding === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 4. Expanded Withholding Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Expanded Withholding Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 0619E / 1601EQ</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setExpandedWithholding('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              expandedWithholding === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedWithholding('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              expandedWithholding === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 5. Withholding on Compensation */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Withholding on Compensation</p>
                          <p className="text-[10px] text-zinc-500">BIR 1601-C (Payroll Tax)</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setWithholdingComp('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              withholdingComp === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setWithholdingComp('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              withholdingComp === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 6. Fringe Benefits Tax */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Fringe Benefits Tax</p>
                          <p className="text-[10px] text-zinc-500">BIR 1603Q</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setFringeBenefits('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              fringeBenefits === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setFringeBenefits('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              fringeBenefits === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 7. Related Party Transactions */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Related Party Transactions</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 1709</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setRelatedParty('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              relatedParty === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setRelatedParty('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              relatedParty === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* 8. Monthly Documentary Stamp */}
                      <div className="p-3 rounded-xl border border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200">Monthly Documentary Stamp</p>
                          <p className="text-[10px] text-zinc-500">BIR Form 2000 / 2000-OT</p>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 p-0.5 bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setDocumentaryStamp('Yes')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              documentaryStamp === 'Yes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocumentaryStamp('No')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                              documentaryStamp === 'No' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER CONTROLS */}
              <div className={`mt-6 pt-4 border-t ${theme.borderCard} flex items-center justify-between`}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editingCompanyId !== null ? "Update Company Profile" : "Register Company Profile"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* POPUP MODAL: VIEW ENTITY DIRECTORY TREE STRUCTURE                         */}
      {/* ========================================================================= */}
      {selectedDirectoryCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/20">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    Entity Directory: {selectedDirectoryCompany.company_name}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Auto-generated local desktop filesystem hierarchy under <span className="font-mono text-cyan-400">entity directory/</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDirectoryCompany(null)}
                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TREE BODY */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">
{`.
└── parent folder/
    └── entity directory/
        └── ${selectedDirectoryCompany.company_name}/
            ├── main (if branch code is 00000)/
            │   ├── main documents/
            │   │   ├── dti/sec
            │   │   ├── bir
            │   │   ├── lgu
            │   │   └── other documents
            │   └── ${selectedDirectoryCompany.birthday_or_incorporation_date ? selectedDirectoryCompany.birthday_or_incorporation_date.slice(0, 4) : '2026'} transactions (year created)/
            │       ├── sales
            │       ├── expenses
            │       ├── 2307
            │       ├── 2316
            │       └── tax compliances/
            │           ├── attachments
            │           └── filings          
            └── branch 1 (depending on branch code other than 00000)/
                ├── main documents/
                │   ├── dti/sec
                │   ├── bir
                │   ├── lgu
                │   └── other documents
                └── ${selectedDirectoryCompany.birthday_or_incorporation_date ? selectedDirectoryCompany.birthday_or_incorporation_date.slice(0, 4) : '2026'} transactions (year created)/
                    ├── sales
                    ├── expenses
                    ├── 2307
                    ├── 2316
                    └── tax compliances/
                        ├── attachments
                        └── filings`}
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold">Filesystem Status: </span>
                  <span>Synchronized in Desktop App & Local Database Engine</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/api/create-entity-directory', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        company_name: selectedDirectoryCompany.company_name,
                        branch_code: selectedDirectoryCompany.tin_branch_code || '00000',
                        year: selectedDirectoryCompany.birthday_or_incorporation_date ? selectedDirectoryCompany.birthday_or_incorporation_date.slice(0, 4) : 2026
                      })
                    })
                      .then(() => triggerAlert(`Filesystem folders re-verified for "${selectedDirectoryCompany.company_name}"!`, 'success'))
                      .catch(() => triggerAlert("Could not reach local server filesystem.", "error"));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Re-Verify Local Folders
                </button>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className={`p-4 border-t ${theme.borderCard} flex justify-end bg-zinc-500/5`}>
              <button
                type="button"
                onClick={() => setSelectedDirectoryCompany(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: DELETE COMPANY WARNING & CONFIRMATION                        */}
      {/* ========================================================================= */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div
            className={`relative w-full max-w-md flex flex-col ${theme.bgCard} border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-rose-500/20 flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500/20 text-rose-400 p-2.5 rounded-xl border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    Warning: Delete Company Profile?
                  </h3>
                  <p className="text-xs text-rose-400 font-medium mt-0.5">
                    This action will remove the entity from your masterlist.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className={`p-3.5 rounded-xl border ${theme.borderCard} bg-zinc-500/5 flex flex-col gap-1`}>
                <span className={`text-sm font-bold ${theme.textTitle}`}>
                  {companyToDelete.company_name}
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  TIN: {companyToDelete.company_tin || '000-000-000-00000'}
                </span>
                {activeCompany?.id === companyToDelete.id && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    This is currently your Active Workspace. Deleting it will switch the active workspace to another registered entity (or clear it if none remain).
                  </span>
                )}
              </div>

              <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                Are you sure you want to permanently delete this company profile? Please confirm to proceed.
              </p>
            </div>

            <div className={`p-4 border-t ${theme.borderCard} flex items-center justify-end gap-2.5 bg-zinc-500/5`}>
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCompany}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
