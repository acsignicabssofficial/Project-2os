import React, { useState } from 'react';
import { Users, Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react';
import { Employee, Company } from '../types';

interface EmployeeProfilesTabProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  activeCompany: Company | null;
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
}

export default function EmployeeProfilesTab({
  employees,
  setEmployees,
  activeCompany,
  theme,
  triggerAlert,
  globalSearch
}: EmployeeProfilesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [tin, setTin] = useState('');
  const [position, setPosition] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [sssNo, setSssNo] = useState('');
  const [philhealthNo, setPhilhealthNo] = useState('');
  const [pagibigNo, setPagibigNo] = useState('');
  const [taxStatus, setTaxStatus] = useState('Single / S');
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setEmpId('');
    setFullName('');
    setTin('');
    setPosition('');
    setDailyRate('');
    setMonthlyRate('');
    setSssNo('');
    setPhilhealthNo('');
    setPagibigNo('');
    setTaxStatus('Single / S');
  };

  const openNewEmployeeModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      triggerAlert('Please select or create a Company Profile first in the Companies tab!', 'error');
      return;
    }
    if (!fullName || !monthlyRate) {
      triggerAlert('Full Name and Monthly Rate are required fields!', 'error');
      return;
    }

    if (editingId !== null) {
      setEmployees(prev => prev.map(emp => emp.id === editingId ? {
        ...emp,
        employee_id: empId || `EMP-${Date.now()}`,
        full_name: fullName.trim(),
        tin: tin.trim(),
        position: position.trim(),
        daily_rate: parseFloat(dailyRate) || (parseFloat(monthlyRate) / 22),
        monthly_rate: parseFloat(monthlyRate) || 0,
        sss_no: sssNo,
        philhealth_no: philhealthNo,
        pagibig_no: pagibigNo,
        tax_status: taxStatus
      } : emp));
      triggerAlert(`Employee "${fullName}" updated successfully.`, 'success');
      resetForm();
      setIsModalOpen(false);
    } else {
      const newEmp: Employee = {
        id: Date.now(),
        company_name: activeCompany.company_name,
        employee_id: empId || `EMP-2026-${String(employees.length + 1).padStart(3, '0')}`,
        full_name: fullName.trim(),
        tin: tin.trim(),
        position: position.trim(),
        daily_rate: parseFloat(dailyRate) || (parseFloat(monthlyRate) / 22),
        monthly_rate: parseFloat(monthlyRate) || 0,
        sss_no: sssNo,
        philhealth_no: philhealthNo,
        pagibig_no: pagibigNo,
        tax_status: taxStatus
      };
      setEmployees(prev => [...prev, newEmp]);
      triggerAlert(`Employee "${fullName}" registered successfully!`, 'success');
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEmpId(emp.employee_id);
    setFullName(emp.full_name);
    setTin(emp.tin);
    setPosition(emp.position);
    setDailyRate(emp.daily_rate?.toString() || '');
    setMonthlyRate(emp.monthly_rate?.toString() || '');
    setSssNo(emp.sss_no || '');
    setPhilhealthNo(emp.philhealth_no || '');
    setPagibigNo(emp.pagibig_no || '');
    setTaxStatus(emp.tax_status || 'Single / S');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete employee "${name}"?`)) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      triggerAlert(`Employee "${name}" deleted.`, 'info');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return (emp.full_name || '').toLowerCase().includes(q) ||
      String(emp.employee_id || '').toLowerCase().includes(q) ||
      (emp.position || '').toLowerCase().includes(q) ||
      String(emp.tin || '').includes(q);
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* EMPLOYEE MASTERLIST & PROFILES DATABASE */}
      <div className={`${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
        {/* HEADER & CONTROLS */}
        <div className={`p-5 border-b ${theme.borderCard} flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-500/5`}>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-lg ${theme.textTitle}`}>
                  Employee Masterlist & Profiles
                </h2>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono font-bold">
                  {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Manage personnel master records, TIN, salary rates, and mandatory government contributions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search employee, ID, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-2 text-xs rounded-xl border bg-transparent w-56 font-sans ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-indigo-500`}
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              type="button"
              onClick={openNewEmployeeModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Register Employee Profile
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`bg-zinc-500/5 ${theme.textMuted} uppercase font-bold tracking-wider border-b ${theme.borderCard}`}>
                <th className="p-3.5">Emp ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Position</th>
                <th className="p-3.5">TIN</th>
                <th className="p-3.5 text-right">Monthly Rate</th>
                <th className="p-3.5 text-right">Daily Rate</th>
                <th className="p-3.5">Govt IDs (SSS/PH/PAGIBIG)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderCard}`}>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Employees Registered</p>
                    <p className="text-xs mt-1">Click "Register Employee Profile" above to populate your payroll directory.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className={`${theme.isLight ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/30'} transition-colors`}>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{emp.employee_id}</td>
                    <td className={`p-3.5 font-bold ${theme.textTitle}`}>{emp.full_name}</td>
                    <td className={`p-3.5 ${theme.isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{emp.position || '-'}</td>
                    <td className="p-3.5 font-mono text-zinc-400">{emp.tin || 'No TIN'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      ₱{(emp.monthly_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-mono text-zinc-400">
                      ₱{(emp.daily_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col text-[10px] font-mono text-zinc-500">
                        <span>SSS: {emp.sss_no || '-'}</span>
                        <span>PH: {emp.philhealth_no || '-'}</span>
                        <span>PAGIBIG: {emp.pagibig_no || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(emp)}
                          className={`p-1.5 px-2.5 rounded-lg border ${theme.borderCard} ${theme.isLight ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'} hover:border-indigo-500 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs`}
                          title="Edit Employee"
                        >
                          <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id, emp.full_name)}
                          className="p-1.5 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: REGISTER / EDIT EMPLOYEE PROFILE                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div 
            className={`relative w-full max-w-2xl ${theme.bgCard} border ${theme.borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 border-b ${theme.borderCard} flex items-center justify-between bg-zinc-500/5`}>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-base ${theme.textTitle}`}>
                    {editingId !== null ? 'Update Employee Profile' : 'Register Employee Profile'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Enter employee credentials, compensation rates, and government contribution IDs.
                  </p>
                </div>
              </div>
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

            {/* Form Body */}
            <form onSubmit={handleSaveEmployee} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Employee ID</label>
                  <input
                    type="text"
                    placeholder="EMP-001"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Maria Santos Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-semibold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-indigo-500`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Designation / Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Accountant"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Employee TIN</label>
                  <input
                    type="text"
                    placeholder="000-000-000"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Monthly Basic Salary (PHP) *</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={monthlyRate}
                    onChange={(e) => {
                      setMonthlyRate(e.target.value);
                      if (e.target.value) {
                        setDailyRate((parseFloat(e.target.value) / 22).toFixed(2));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono font-bold ${theme.borderInput} ${theme.textMain} focus:outline-hidden focus:ring-1 focus:ring-indigo-500`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Daily Equivalent Rate (PHP)</label>
                  <input
                    type="number"
                    placeholder="1136.36"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>SSS Number</label>
                  <input
                    type="text"
                    placeholder="00-0000000-0"
                    value={sssNo}
                    onChange={(e) => setSssNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>PhilHealth Number</label>
                  <input
                    type="text"
                    placeholder="00-000000000-0"
                    value={philhealthNo}
                    onChange={(e) => setPhilhealthNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>Pag-IBIG / HDMF</label>
                  <input
                    type="text"
                    placeholder="0000-0000-0000"
                    value={pagibigNo}
                    onChange={(e) => setPagibigNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent font-mono ${theme.borderInput} ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className={`mt-4 pt-4 border-t ${theme.borderCard} flex items-center justify-between`}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingId !== null ? 'Update Employee' : 'Save Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
