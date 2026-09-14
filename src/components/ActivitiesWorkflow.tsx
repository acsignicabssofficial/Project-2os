import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Flag, 
  Calendar,
  CheckSquare, 
  Square, 
  ArrowRight,
  ArrowLeft,
  DollarSign,
  TrendingUp, 
  FileCheck,
  ShieldCheck,
  Users,
  ChevronRight,
  X,
  Sparkles,
  Award,
  MessageSquare,
  Send,
  UserCheck,
  Building2,
  Briefcase,
  CornerDownRight,
  UserPlus,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { Employee } from '../types';

export type TaskCategory = 'Tax' | 'Receivables' | 'Payables' | 'Banking' | 'Payroll' | 'Compliance' | 'Audit';
export type TaskColumn = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskPhase = 'Stage 1: Billing' | 'Stage 2: Payables' | 'Stage 3: Tax' | 'Stage 4: Banking' | 'Stage 5: Close';

export type Department = 
  | 'Sales Dept' 
  | 'Payroll Dept' 
  | 'Purchasing Dept' 
  | 'Accounting Dept' 
  | 'Management / Executive';

export interface CompanyUser {
  id: string;
  name: string;
  role: string;
  department: Department;
  avatarInitials: string;
  email: string;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  department?: Department;
  text: string;
  timestamp: string;
  isSystemNote?: boolean;
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  column: TaskColumn;
  priority: TaskPriority;
  department: Department;
  assignee: {
    id?: string;
    name: string;
    role: string;
    avatarInitials: string;
    email?: string;
    department?: Department;
  };
  dueDate: string;
  startDay: number; // Day of month (1-30) for Gantt
  endDay: number;   // Day of month (1-30) for Gantt
  progress: number; // 0 - 100
  amount?: number;
  isOverdue?: boolean;
  phase: TaskPhase;
  milestone?: boolean;
  comments: TaskComment[];
}

interface ActivitiesWorkflowProps {
  theme: any;
  triggerAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  privacyMode: boolean;
  fmtShortMoney: (val: number) => string;
  fmtMoney: (val: number) => string;
  stats: {
    withholdingTaxCompPayable?: number;
    overdueAR?: number;
    outstandingAP?: number;
    statutoryPayable?: number;
    netVatPayable?: number;
  };
  employees?: Employee[];
  activeCompanyName?: string;
  onStatsUpdate?: (summary: { total: number; pending: number; overdue: number; completed: number; completedPercent: number }) => void;
}

const STORAGE_KEY = 'bolt_activities_workflow_tasks_v3';

// Standard company operational users with access to the entity
export const DEFAULT_COMPANY_USERS: CompanyUser[] = [
  { id: 'usr-1', name: 'Maria Santos', role: 'Senior Tax & Compliance Officer', department: 'Accounting Dept', avatarInitials: 'MS', email: 'maria.santos@company.ph' },
  { id: 'usr-2', name: 'Juan Dela Cruz', role: 'Chief General Accountant', department: 'Accounting Dept', avatarInitials: 'JC', email: 'juan.delacruz@company.ph' },
  { id: 'usr-3', name: 'John Perez', role: 'Credit & Collections Lead', department: 'Sales Dept', avatarInitials: 'JP', email: 'john.perez@company.ph' },
  { id: 'usr-4', name: 'Elena Gomez', role: 'Sales Invoicing Specialist', department: 'Sales Dept', avatarInitials: 'EG', email: 'elena.gomez@company.ph' },
  { id: 'usr-5', name: 'Sofia Lim', role: 'Accounts Payable Specialist', department: 'Purchasing Dept', avatarInitials: 'SL', email: 'sofia.lim@company.ph' },
  { id: 'usr-6', name: 'Ana Lim', role: 'Procurement & Vendor Lead', department: 'Purchasing Dept', avatarInitials: 'AL', email: 'ana.lim@company.ph' },
  { id: 'usr-7', name: 'Mark David', role: 'Payroll Operations Officer', department: 'Payroll Dept', avatarInitials: 'MD', email: 'mark.david@company.ph' },
  { id: 'usr-8', name: 'Robert Tan', role: 'Compensation & Benefits Specialist', department: 'Payroll Dept', avatarInitials: 'RT', email: 'robert.tan@company.ph' },
  { id: 'usr-9', name: 'Carlos Reyes', role: 'Treasury & Bank Recon Analyst', department: 'Accounting Dept', avatarInitials: 'CR', email: 'carlos.reyes@company.ph' },
  { id: 'usr-10', name: 'Elena Cruz', role: 'Comptroller & Auditor', department: 'Management / Executive', avatarInitials: 'EC', email: 'elena.cruz@company.ph' }
];

export const DEPARTMENTS_LIST: { id: Department; name: string; icon: any; colorClass: string; borderClass: string; bgClass: string; description: string }[] = [
  { 
    id: 'Sales Dept', 
    name: 'Sales Dept', 
    icon: TrendingUp, 
    colorClass: 'text-emerald-500 dark:text-emerald-400', 
    borderClass: 'border-emerald-500/30', 
    bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    description: 'Customer billings, invoices, collections & 2307 claims'
  },
  { 
    id: 'Payroll Dept', 
    name: 'Payroll Dept', 
    icon: Users, 
    colorClass: 'text-purple-500 dark:text-purple-400', 
    borderClass: 'border-purple-500/30', 
    bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    description: 'Salaries, SSS, PhilHealth, Pag-IBIG & 1601-C withholding'
  },
  { 
    id: 'Purchasing Dept', 
    name: 'Purchasing Dept', 
    icon: Briefcase, 
    colorClass: 'text-amber-500 dark:text-amber-400', 
    borderClass: 'border-amber-500/30', 
    bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    description: 'Vendor vouchers, POs, disbursements & 2307 certificates'
  },
  { 
    id: 'Accounting Dept', 
    name: 'Accounting Dept', 
    icon: Layers, 
    colorClass: 'text-cyan-500 dark:text-cyan-400', 
    borderClass: 'border-cyan-500/30', 
    bgClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    description: 'Bank recon, general journal, PPE depreciation & financial close'
  },
  { 
    id: 'Management / Executive', 
    name: 'Management / Executive', 
    icon: ShieldCheck, 
    colorClass: 'text-indigo-500 dark:text-indigo-400', 
    borderClass: 'border-indigo-500/30', 
    bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    description: 'Tax audits, board presentations & statutory oversight'
  }
];

export default function ActivitiesWorkflow({
  theme,
  triggerAlert,
  privacyMode,
  fmtShortMoney,
  fmtMoney,
  stats,
  employees = [],
  activeCompanyName,
  onStatsUpdate
}: ActivitiesWorkflowProps) {
  // Sub-board views: 'kanban' | 'gantt' | 'pipeline' | 'list'
  const [boardView, setBoardView] = useState<'kanban' | 'gantt' | 'pipeline' | 'list'>('kanban');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  // Interactive Task Drawer (Chat & Collaboration)
  const [activeChatTask, setActiveChatTask] = useState<WorkflowTask | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modal for creating custom task
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Tax');
  const [newTaskDepartment, setNewTaskDepartment] = useState<Department>('Accounting Dept');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('High');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('usr-1');
  const [newTaskAmount, setNewTaskAmount] = useState('');
  const [newTaskStartDay, setNewTaskStartDay] = useState('10');
  const [newTaskEndDay, setNewTaskEndDay] = useState('20');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Due in 5 days');

  // Combine default users with any company employees for rich assignable roster
  const companyUsersList = useMemo(() => {
    const list = [...DEFAULT_COMPANY_USERS];
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        const empName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Staff Member';
        if (!list.some(u => u.name.toLowerCase() === empName.toLowerCase())) {
          list.push({
            id: `emp-${emp.id}`,
            name: empName,
            role: emp.position || 'Operations Staff',
            department: 'Accounting Dept',
            avatarInitials: empName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            email: `${empName.toLowerCase().replace(/\s+/g, '.')}@company.ph`
          });
        }
      });
    }
    return list;
  }, [employees]);

  // Initial template tasks enriched with departments and initial comments
  const initialTasks: WorkflowTask[] = useMemo(() => [
    {
      id: 'task-1',
      title: 'Remit Monthly Withholding Tax (BIR 1601-C)',
      description: 'File electronic monthly return and remit payroll withholding tax through BIR eFPS portal.',
      category: 'Tax',
      column: 'in_progress',
      priority: 'High',
      department: 'Accounting Dept',
      assignee: { 
        id: 'usr-1',
        name: 'Maria Santos', 
        role: 'Senior Tax & Compliance Officer', 
        avatarInitials: 'MS',
        department: 'Accounting Dept'
      },
      dueDate: 'Due Sep 10',
      startDay: 4,
      endDay: 10,
      progress: 75,
      amount: stats.withholdingTaxCompPayable || 3450,
      phase: 'Stage 3: Tax',
      milestone: true,
      comments: [
        {
          id: 'c-1',
          authorName: 'Maria Santos',
          authorRole: 'Senior Tax Officer',
          authorAvatar: 'MS',
          department: 'Accounting Dept',
          text: 'Generated BIR eFPS monthly return draft. Awaiting final payroll total confirmation.',
          timestamp: 'Yesterday at 3:15 PM'
        },
        {
          id: 'c-2',
          authorName: 'Mark David',
          authorRole: 'Payroll Lead',
          authorAvatar: 'MD',
          department: 'Payroll Dept',
          text: 'Confirmed final 1601-C tax base with total compensation withholding of ₱3,450.00.',
          timestamp: 'Today at 9:30 AM'
        }
      ]
    },
    {
      id: 'task-2',
      title: 'Follow-up Overdue Receivables (>30 Days)',
      description: 'Dispatch formal collection letters and statement of accounts for high-aging client invoices.',
      category: 'Receivables',
      column: 'in_progress',
      priority: 'High',
      department: 'Sales Dept',
      assignee: { 
        id: 'usr-3',
        name: 'John Perez', 
        role: 'Credit & Collections Lead', 
        avatarInitials: 'JP',
        department: 'Sales Dept'
      },
      dueDate: '2 days overdue',
      startDay: 2,
      endDay: 14,
      progress: 45,
      amount: stats.overdueAR || 1525.50,
      isOverdue: true,
      phase: 'Stage 1: Billing',
      comments: [
        {
          id: 'c-3',
          authorName: 'John Perez',
          authorRole: 'Credit & Collections Lead',
          authorAvatar: 'JP',
          department: 'Sales Dept',
          text: 'Contacted client accounting department. They confirmed check preparation for Friday release.',
          timestamp: 'Yesterday at 4:40 PM'
        }
      ]
    },
    {
      id: 'task-3',
      title: 'Bank Statement Reconciliation (BDO & BPI)',
      description: 'Match unposted electronic deposits with official receipts and verify check disbursements.',
      category: 'Banking',
      column: 'done',
      priority: 'Medium',
      department: 'Accounting Dept',
      assignee: { 
        id: 'usr-9',
        name: 'Carlos Reyes', 
        role: 'Treasury & Bank Recon Analyst', 
        avatarInitials: 'CR',
        department: 'Accounting Dept'
      },
      dueDate: 'Completed Sep 8',
      startDay: 1,
      endDay: 8,
      progress: 100,
      phase: 'Stage 4: Banking',
      comments: [
        {
          id: 'c-4',
          authorName: 'Carlos Reyes',
          authorRole: 'Treasury Analyst',
          authorAvatar: 'CR',
          department: 'Accounting Dept',
          text: 'Both BDO Main and BPI Operating accounts reconciled to ₱0.00 variance with GL.',
          timestamp: 'Sep 8 at 5:00 PM'
        }
      ]
    },
    {
      id: 'task-4',
      title: 'Settle Subcontractor Progress Vouchers',
      description: 'Disburse progress billings and issue BIR Form 2307 Creditable Withholding certificates.',
      category: 'Payables',
      column: 'backlog',
      priority: 'High',
      department: 'Purchasing Dept',
      assignee: { 
        id: 'usr-5',
        name: 'Sofia Lim', 
        role: 'Accounts Payable Specialist', 
        avatarInitials: 'SL',
        department: 'Purchasing Dept'
      },
      dueDate: 'Due in 3 days',
      startDay: 12,
      endDay: 18,
      progress: 15,
      amount: stats.outstandingAP || 4200,
      phase: 'Stage 2: Payables',
      comments: [
        {
          id: 'c-5',
          authorName: 'Sofia Lim',
          authorRole: 'Accounts Payable Specialist',
          authorAvatar: 'SL',
          department: 'Purchasing Dept',
          text: 'Received Billing Statement from Contractor. 2307 Withholding certificate prepared.',
          timestamp: 'Today at 10:15 AM'
        }
      ]
    },
    {
      id: 'task-5',
      title: 'Post Monthly PPE Depreciation (PAS 16)',
      description: 'Compute straight-line depreciation for heavy construction machinery and office equipment.',
      category: 'Compliance',
      column: 'done',
      priority: 'Low',
      department: 'Accounting Dept',
      assignee: { 
        id: 'usr-10',
        name: 'Elena Cruz', 
        role: 'Comptroller & Auditor', 
        avatarInitials: 'EC',
        department: 'Management / Executive'
      },
      dueDate: 'Completed Sep 1',
      startDay: 1,
      endDay: 3,
      progress: 100,
      phase: 'Stage 5: Close',
      comments: []
    },
    {
      id: 'task-6',
      title: 'Remit SSS, PhilHealth & Pag-IBIG Contributions',
      description: 'Consolidate monthly employer and employee statutory contributions via payment portals.',
      category: 'Payroll',
      column: 'review',
      priority: 'Medium',
      department: 'Payroll Dept',
      assignee: { 
        id: 'usr-7',
        name: 'Mark David', 
        role: 'Payroll Operations Officer', 
        avatarInitials: 'MD',
        department: 'Payroll Dept'
      },
      dueDate: 'Due Sep 15',
      startDay: 9,
      endDay: 15,
      progress: 90,
      amount: stats.statutoryPayable || 6200,
      phase: 'Stage 3: Tax',
      milestone: true,
      comments: [
        {
          id: 'c-6',
          authorName: 'Mark David',
          authorRole: 'Payroll Officer',
          authorAvatar: 'MD',
          department: 'Payroll Dept',
          text: 'Payment reference numbers (PRN) generated for SSS and Pag-IBIG electronic portals.',
          timestamp: 'Yesterday at 2:20 PM'
        }
      ]
    },
    {
      id: 'task-7',
      title: 'Quarterly Value-Added Tax (BIR 2550Q)',
      description: 'Consolidate SLS (Sales) and SLP (Purchases) schedules and balance input vs output tax.',
      category: 'Tax',
      column: 'backlog',
      priority: 'High',
      department: 'Accounting Dept',
      assignee: { 
        id: 'usr-1',
        name: 'Maria Santos', 
        role: 'Senior Tax & Compliance Officer', 
        avatarInitials: 'MS',
        department: 'Accounting Dept'
      },
      dueDate: 'Due Sep 25',
      startDay: 18,
      endDay: 25,
      progress: 25,
      amount: stats.netVatPayable || 3200,
      phase: 'Stage 3: Tax',
      milestone: true,
      comments: []
    },
    {
      id: 'task-8',
      title: 'Mid-Month Payroll Verification & Disbursal',
      description: 'Audit employee time cards, compute gross pay, and upload electronic bank batch file.',
      category: 'Payroll',
      column: 'in_progress',
      priority: 'High',
      department: 'Payroll Dept',
      assignee: { 
        id: 'usr-7',
        name: 'Mark David', 
        role: 'Payroll Operations Officer', 
        avatarInitials: 'MD',
        department: 'Payroll Dept'
      },
      dueDate: 'Due Sep 15',
      startDay: 11,
      endDay: 15,
      progress: 60,
      amount: 45000,
      phase: 'Stage 2: Payables',
      milestone: true,
      comments: [
        {
          id: 'c-7',
          authorName: 'Robert Tan',
          authorRole: 'Benefits Lead',
          authorAvatar: 'RT',
          department: 'Payroll Dept',
          text: 'Uploaded batch payroll credit file to online banking portal. Awaiting executive token approval.',
          timestamp: 'Today at 11:00 AM'
        }
      ]
    },
    {
      id: 'task-9',
      title: 'Suppliers BIR Form 2307 Withholding Certificates',
      description: 'Distribute signed creditable withholding certificates to accredited vendors and contractors.',
      category: 'Payables',
      column: 'review',
      priority: 'Medium',
      department: 'Purchasing Dept',
      assignee: { 
        id: 'usr-6',
        name: 'Ana Lim', 
        role: 'Procurement & Vendor Lead', 
        avatarInitials: 'AL',
        department: 'Purchasing Dept'
      },
      dueDate: 'Due Sep 20',
      startDay: 14,
      endDay: 20,
      progress: 80,
      phase: 'Stage 2: Payables',
      comments: []
    },
    {
      id: 'task-10',
      title: 'Month-End General Ledger & Trial Balance Audit',
      description: 'Perform trial balance balance check, accrual adjustments, and executive financial review.',
      category: 'Audit',
      column: 'backlog',
      priority: 'High',
      department: 'Management / Executive',
      assignee: { 
        id: 'usr-10',
        name: 'Elena Cruz', 
        role: 'Comptroller & Auditor', 
        avatarInitials: 'EC',
        department: 'Management / Executive'
      },
      dueDate: 'Due Sep 30',
      startDay: 25,
      endDay: 30,
      progress: 0,
      phase: 'Stage 5: Close',
      milestone: true,
      comments: []
    }
  ], [stats]);

  // Persistent tasks state
  const [tasks, setTasks] = useState<WorkflowTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load saved workflow tasks", e);
    }
    return initialTasks;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to persist tasks", e);
    }
  }, [tasks]);

  // Keep activeChatTask in sync with tasks state
  useEffect(() => {
    if (activeChatTask) {
      const updated = tasks.find(t => t.id === activeChatTask.id);
      if (updated) {
        setActiveChatTask(updated);
      }
    }
  }, [tasks]);

  // Scroll chat to bottom when comments change
  useEffect(() => {
    if (activeChatTask) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatTask?.comments]);

  // Calculate summary metrics
  const taskSummary = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let completed = 0;

    tasks.forEach(t => {
      if (t.column === 'done') {
        completed++;
      } else if (t.isOverdue) {
        overdue++;
      } else {
        pending++;
      }
    });

    const total = tasks.length;
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, overdue, completed, completedPercent };
  }, [tasks]);

  // Inform parent of updated summary
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(taskSummary);
    }
  }, [taskSummary, onStatsUpdate]);

  // Filtering by search, category, priority, and DEPARTMENT
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
      const matchesDepartment = selectedDepartment === 'All' || task.department === selectedDepartment;

      return matchesSearch && matchesCategory && matchesPriority && matchesDepartment;
    });
  }, [tasks, searchQuery, selectedCategory, selectedPriority, selectedDepartment]);

  // Column move helper
  const moveTaskColumn = (taskId: string, targetCol: TaskColumn) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isDone = targetCol === 'done';
        const updatedTask = {
          ...t,
          column: targetCol,
          progress: isDone ? 100 : (targetCol === 'in_progress' && t.progress === 0 ? 50 : t.progress),
          comments: [
            ...t.comments,
            {
              id: `sys-${Date.now()}`,
              authorName: 'Workflow System',
              authorRole: 'Audit Log',
              authorAvatar: 'SYS',
              text: `Status updated to ${targetCol.replace('_', ' ').toUpperCase()}`,
              timestamp: 'Just now',
              isSystemNote: true
            }
          ]
        };
        return updatedTask;
      }
      return t;
    }));
    triggerAlert(`Task moved to ${targetCol.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Reassign task to another user with access to the company
  const reassignTaskToUser = (taskId: string, targetUser: CompanyUser) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assignee: {
            id: targetUser.id,
            name: targetUser.name,
            role: targetUser.role,
            avatarInitials: targetUser.avatarInitials,
            email: targetUser.email,
            department: targetUser.department
          },
          comments: [
            ...t.comments,
            {
              id: `sys-${Date.now()}`,
              authorName: 'Workflow System',
              authorRole: 'Assignment Audit',
              authorAvatar: 'SYS',
              text: `Reassigned task to ${targetUser.name} (${targetUser.department} • ${targetUser.role})`,
              timestamp: 'Just now',
              isSystemNote: true
            }
          ]
        };
      }
      return t;
    }));
    triggerAlert(`Task assigned to ${targetUser.name} (${targetUser.department})`, 'success');
  };

  // Reassign department of task
  const reassignTaskDepartment = (taskId: string, newDept: Department) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          department: newDept,
          comments: [
            ...t.comments,
            {
              id: `sys-${Date.now()}`,
              authorName: 'Workflow System',
              authorRole: 'Department Transfer',
              authorAvatar: 'SYS',
              text: `Department assigned to ${newDept}`,
              timestamp: 'Just now',
              isSystemNote: true
            }
          ]
        };
      }
      return t;
    }));
    triggerAlert(`Department assigned to ${newDept}`, 'info');
  };

  // Send a comment in active task chat
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChatTask || !newCommentText.trim()) return;

    const currentUserName = 'Controller / Finance Lead';
    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorName: currentUserName,
      authorRole: 'Authorized User',
      authorAvatar: 'ME',
      department: activeChatTask.department,
      text: newCommentText.trim(),
      timestamp: 'Just now'
    };

    setTasks(prev => prev.map(t => {
      if (t.id === activeChatTask.id) {
        return {
          ...t,
          comments: [...t.comments, comment]
        };
      }
      return t;
    }));

    setNewCommentText('');
    triggerAlert('Message posted to task activity feed', 'success');
  };

  // Quick reply prompt helper
  const handleQuickReply = (text: string) => {
    if (!activeChatTask) return;
    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorName: 'Finance Lead',
      authorRole: 'Authorized User',
      authorAvatar: 'ME',
      department: activeChatTask.department,
      text,
      timestamp: 'Just now'
    };

    setTasks(prev => prev.map(t => {
      if (t.id === activeChatTask.id) {
        return {
          ...t,
          comments: [...t.comments, comment]
        };
      }
      return t;
    }));
    triggerAlert(`Quick response recorded: "${text}"`, 'info');
  };

  // Quick toggle task completion
  const toggleComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const willBeDone = t.column !== 'done';
        return {
          ...t,
          column: willBeDone ? 'done' : 'in_progress',
          progress: willBeDone ? 100 : 50,
          comments: [
            ...t.comments,
            {
              id: `sys-${Date.now()}`,
              authorName: 'Workflow System',
              authorRole: 'Status Change',
              authorAvatar: 'SYS',
              text: willBeDone ? 'Marked task as COMPLETED & RECONCILED' : 'Reopened task into IN PROGRESS',
              timestamp: 'Just now',
              isSystemNote: true
            }
          ]
        };
      }
      return t;
    }));
    triggerAlert('Task status updated', 'success');
  };

  // Handle adding new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      triggerAlert('Please enter a task title', 'error');
      return;
    }

    const assignedUser = companyUsersList.find(u => u.id === newTaskAssigneeId) || companyUsersList[0];

    const newTask: WorkflowTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Custom workflow activity task created for active company.',
      category: newTaskCategory,
      department: newTaskDepartment,
      column: 'backlog',
      priority: newTaskPriority,
      assignee: {
        id: assignedUser.id,
        name: assignedUser.name,
        role: assignedUser.role,
        avatarInitials: assignedUser.avatarInitials,
        email: assignedUser.email,
        department: assignedUser.department
      },
      dueDate: newTaskDueDate || 'Upcoming',
      startDay: Math.max(1, Math.min(30, parseInt(newTaskStartDay) || 10)),
      endDay: Math.max(1, Math.min(30, parseInt(newTaskEndDay) || 20)),
      progress: 0,
      amount: newTaskAmount ? parseFloat(newTaskAmount) : undefined,
      phase: newTaskCategory === 'Tax' ? 'Stage 3: Tax' : 
             newTaskCategory === 'Receivables' ? 'Stage 1: Billing' : 
             newTaskCategory === 'Payables' ? 'Stage 2: Payables' : 
             newTaskCategory === 'Banking' ? 'Stage 4: Banking' : 'Stage 5: Close',
      comments: [
        {
          id: `comment-init-${Date.now()}`,
          authorName: 'Workflow System',
          authorRole: 'Task Created',
          authorAvatar: 'SYS',
          text: `Task initiated and assigned to ${assignedUser.name} (${newTaskDepartment}).`,
          timestamp: 'Just now',
          isSystemNote: true
        }
      ]
    };

    setTasks(prev => [newTask, ...prev]);
    setShowAddModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAmount('');
    triggerAlert(`New task created for ${newTaskDepartment} and assigned to ${assignedUser.name}`, 'success');
  };

  // Column config for Kanban
  const kanbanColumns: { id: TaskColumn; label: string; icon: any; color: string; border: string; bg: string }[] = [
    { 
      id: 'backlog', 
      label: 'To Do / Scheduled', 
      icon: Clock, 
      color: 'text-zinc-400 dark:text-zinc-300', 
      border: 'border-zinc-400/20', 
      bg: 'bg-zinc-500/5' 
    },
    { 
      id: 'in_progress', 
      label: 'In Progress', 
      icon: TrendingUp, 
      color: 'text-cyan-400', 
      border: 'border-cyan-500/30', 
      bg: 'bg-cyan-500/5' 
    },
    { 
      id: 'review', 
      label: 'Verification & Review', 
      icon: ShieldCheck, 
      color: 'text-amber-400', 
      border: 'border-amber-500/30', 
      bg: 'bg-amber-500/5' 
    },
    { 
      id: 'done', 
      label: 'Completed & Reconciled', 
      icon: CheckCircle2, 
      color: 'text-emerald-400', 
      border: 'border-emerald-500/30', 
      bg: 'bg-emerald-500/5' 
    }
  ];

  // Helper colors
  const getCategoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'Tax': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Receivables': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Payables': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Banking': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Payroll': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Compliance': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Audit': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'bg-rose-500/15 text-rose-400 font-bold border-rose-500/30';
      case 'Medium': return 'bg-amber-500/15 text-amber-400 font-bold border-amber-500/30';
      case 'Low': return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    }
  };

  const getDepartmentBadge = (dept: Department) => {
    switch (dept) {
      case 'Sales Dept':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'Payroll Dept':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
      case 'Purchasing Dept':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'Accounting Dept':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25';
      case 'Management / Executive':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP HEADER & WORKFLOW COMMAND BAR */}
      <div className={`p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className={`text-sm font-black font-display tracking-tight ${theme.textTitle}`}>
                Financial Operations & Department Activity Command
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold">
                {taskSummary.total} TASKS
              </span>
              {activeCompanyName && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">
                  {activeCompanyName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Multi-user task delegation, inter-department collaboration, real-time chat, and compliance workflow
            </p>
          </div>

          {/* Metric Badges & Add Task Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-black/3 dark:bg-white/3 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
              <div className="text-right">
                <div className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Completion</div>
                <div className="text-xs font-black font-mono text-emerald-500">
                  {taskSummary.completedPercent}%
                </div>
              </div>
              <div className="w-20 bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${taskSummary.completedPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-xs cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* 2. DEPARTMENT TABS (SALES DEPT, PAYROLL DEPT, PURCHASING DEPT, ACCOUNTING DEPT) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-cyan-400" />
              Filter by Department Workspace
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {companyUsersList.length} Authorized Team Members
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedDepartment('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                selectedDepartment === 'All'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Departments ({tasks.length})
            </button>

            {DEPARTMENTS_LIST.map(dept => {
              const count = tasks.filter(t => t.department === dept.id).length;
              const isSelected = selectedDepartment === dept.id;
              const DeptIcon = dept.icon;

              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? `${dept.bgClass} ${dept.borderClass} font-black shadow-xs`
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={dept.description}
                >
                  <DeptIcon className={`w-3 h-3 ${isSelected ? '' : dept.colorClass}`} />
                  <span>{dept.name}</span>
                  <span className="text-[10px] font-mono px-1 rounded-full bg-black/10 dark:bg-white/10 opacity-80">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SUB-BOARD TABS & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
          {/* Board Views: KANBAN | GANTT CHART | PIPELINE MATRIX | TASK LIST */}
          <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold self-start overflow-x-auto max-w-full">
            <button
              onClick={() => setBoardView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                boardView === 'kanban' 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : `${theme.textMuted} hover:text-cyan-500`
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setBoardView('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                boardView === 'gantt' 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : `${theme.textMuted} hover:text-cyan-500`
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Gantt Chart</span>
            </button>

            <button
              onClick={() => setBoardView('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                boardView === 'pipeline' 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : `${theme.textMuted} hover:text-cyan-500`
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Accounting Pipeline</span>
            </button>

            <button
              onClick={() => setBoardView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                boardView === 'list' 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : `${theme.textMuted} hover:text-cyan-500`
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Task Queue ({taskSummary.pending})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[150px] max-w-xs">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tasks, user, dept..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-7 pr-3 py-1 rounded-lg text-xs border ${theme.borderCard} bg-black/5 dark:bg-white/5 focus:outline-none focus:border-cyan-500 ${theme.textMain}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              aria-label="Filter tasks by category"
              className={`px-2.5 py-1 rounded-lg text-xs border ${theme.borderCard} bg-black/5 dark:bg-white/5 font-medium ${theme.textMain} focus:outline-none focus:border-cyan-500 cursor-pointer`}
            >
              <option value="All">All Categories</option>
              <option value="Tax">Tax Compliance</option>
              <option value="Receivables">Receivables</option>
              <option value="Payables">Payables</option>
              <option value="Banking">Banking</option>
              <option value="Payroll">Payroll</option>
              <option value="Compliance">Compliance</option>
              <option value="Audit">Audit & Close</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW RENDERER */}

      {/* VIEW A: KANBAN BOARD */}
      {boardView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {kanbanColumns.map(col => {
            const colTasks = filteredTasks.filter(t => t.column === col.id);
            const colTotalAmount = colTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
            const Icon = col.icon;

            return (
              <div 
                key={col.id} 
                className={`flex flex-col rounded-xl border ${col.border} ${theme.bgCard} p-3 min-h-[460px] shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                    <h3 className={`text-xs font-bold font-display ${theme.textTitle}`}>
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/5 font-bold text-zinc-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Financial Value Summary */}
                {colTotalAmount > 0 && (
                  <div className="mb-2 px-2 py-0.5 rounded-md bg-black/3 dark:bg-white/3 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">Total Value:</span>
                    <span className="font-bold text-zinc-300">
                      {fmtShortMoney(colTotalAmount)}
                    </span>
                  </div>
                )}

                {/* Task Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-black/10 dark:border-white/10 rounded-lg text-zinc-400 text-xs">
                      <span>No tasks in this lane</span>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isCompleted = task.column === 'done';
                      const commentsCount = task.comments?.length || 0;

                      return (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-xl border transition-all duration-200 space-y-2 shadow-xs group ${
                            isCompleted 
                              ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' 
                              : task.isOverdue 
                              ? 'border-rose-500/30 bg-rose-500/5' 
                              : `${theme.borderCard} hover:border-cyan-500/40 hover:shadow-sm bg-black/2 dark:bg-white/2`
                          }`}
                        >
                          {/* Top Badges: Department & Priority */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getDepartmentBadge(task.department)}`}>
                              {task.department}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h4 
                              onClick={() => setActiveChatTask(task)}
                              className={`text-xs font-bold leading-tight cursor-pointer hover:text-cyan-400 transition ${isCompleted ? 'line-through text-zinc-400' : theme.textTitle}`}
                            >
                              {task.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                              <span>Progress</span>
                              <span className="font-bold">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                }`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Financial Amount & Due Date */}
                          <div className="pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                            {task.amount !== undefined ? (
                              <span className="font-bold text-zinc-300">
                                {fmtShortMoney(task.amount)}
                              </span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}

                            <span className={`flex items-center gap-1 ${task.isOverdue ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{task.dueDate}</span>
                            </span>
                          </div>

                          {/* Bottom Row: Assignee Avatar + Chat Trigger + Lane Mover */}
                          <div className="pt-1 flex items-center justify-between gap-1.5">
                            {/* Assignee pill (clickable to reassign or chat) */}
                            <button
                              onClick={() => setActiveChatTask(task)}
                              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition text-left cursor-pointer"
                              title="Click to reassign or view communication"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                {task.assignee.avatarInitials}
                              </div>
                              <div className="truncate max-w-[85px]">
                                <div className="text-[10px] font-semibold text-zinc-300 truncate">
                                  {task.assignee.name}
                                </div>
                              </div>
                            </button>

                            {/* Chat & Fast Lane Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setActiveChatTask(task)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono transition cursor-pointer ${
                                  commentsCount > 0 
                                    ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30' 
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                title="Open Task Communication & Chat"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{commentsCount}</span>
                              </button>

                              {/* Column progression arrows */}
                              {col.id === 'backlog' && (
                                <button
                                  onClick={() => moveTaskColumn(task.id, 'in_progress')}
                                  className="p-1 text-zinc-400 hover:text-cyan-400 rounded cursor-pointer"
                                  title="Move to In Progress"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                              {col.id === 'in_progress' && (
                                <div className="flex items-center">
                                  <button
                                    onClick={() => moveTaskColumn(task.id, 'backlog')}
                                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
                                    title="Move back to Scheduled"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => moveTaskColumn(task.id, 'review')}
                                    className="p-1 text-zinc-400 hover:text-amber-400 rounded cursor-pointer"
                                    title="Move to Review"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {col.id === 'review' && (
                                <div className="flex items-center">
                                  <button
                                    onClick={() => moveTaskColumn(task.id, 'in_progress')}
                                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
                                    title="Return to In Progress"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => moveTaskColumn(task.id, 'done')}
                                    className="p-1 text-zinc-400 hover:text-emerald-400 rounded cursor-pointer"
                                    title="Complete & Reconcile"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  </button>
                                </div>
                              )}
                              {col.id === 'done' && (
                                <button
                                  onClick={() => moveTaskColumn(task.id, 'in_progress')}
                                  className="p-1 text-zinc-400 hover:text-cyan-400 rounded cursor-pointer"
                                  title="Reopen Task"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: GANTT SCHEDULE TIMELINE */}
      {boardView === 'gantt' && (
        <div className={`p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-3`}>
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
            <div>
              <h3 className={`text-xs font-bold ${theme.textTitle} flex items-center gap-2`}>
                <Calendar className="w-4 h-4 text-cyan-500" />
                Operational & Statutory Calendar Timeline (Days 1 - 30)
              </h3>
              <p className="text-[10px] text-zinc-400">
                Visual alignment of BIR deadlines, payroll cycles, and supplier settlements
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span> In Progress
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px] space-y-1.5">
              {/* Day Header Rulers */}
              <div className="grid grid-cols-12 gap-1 text-[10px] font-mono font-bold text-zinc-400 text-center pb-1 border-b border-black/5 dark:border-white/5">
                <div className="col-span-4 text-left pl-2">Task Title / Department</div>
                <div className="col-span-8 grid grid-cols-6 gap-1">
                  <div>Day 1-5</div>
                  <div>Day 6-10</div>
                  <div>Day 11-15</div>
                  <div>Day 16-20</div>
                  <div>Day 21-25</div>
                  <div>Day 26-30</div>
                </div>
              </div>

              {/* Task Gantt Rows */}
              {filteredTasks.map(task => {
                const isCompleted = task.column === 'done';
                const startPercent = Math.min(100, Math.max(0, ((task.startDay - 1) / 30) * 100));
                const widthPercent = Math.min(100 - startPercent, Math.max(8, ((task.endDay - task.startDay + 1) / 30) * 100));

                return (
                  <div 
                    key={task.id}
                    onClick={() => setActiveChatTask(task)}
                    className="grid grid-cols-12 gap-1 items-center p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-xs"
                  >
                    <div className="col-span-4 flex items-center gap-2 pr-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                        {task.assignee.avatarInitials}
                      </div>
                      <div className="truncate">
                        <div className={`font-semibold truncate text-[11px] ${isCompleted ? 'line-through text-zinc-500' : theme.textTitle}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                          <span className={`px-1 py-0.2 rounded ${getDepartmentBadge(task.department)}`}>
                            {task.department}
                          </span>
                          <span>{task.dueDate}</span>
                          {task.comments?.length > 0 && (
                            <span className="flex items-center gap-0.5 text-cyan-400">
                              <MessageSquare className="w-2.5 h-2.5" /> {task.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-8 relative h-6 bg-black/5 dark:bg-white/5 rounded-md overflow-hidden flex items-center">
                      {/* Gantt Bar */}
                      <div 
                        className={`absolute h-4 rounded-md flex items-center justify-between px-2 text-[9px] font-mono text-white shadow-xs transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-600'
                            : task.isOverdue
                            ? 'bg-rose-600'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600'
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`
                        }}
                      >
                        <span className="truncate">{task.progress}%</span>
                        {task.milestone && <Award className="w-2.5 h-2.5 flex-shrink-0" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: ACCOUNTING PIPELINE */}
      {boardView === 'pipeline' && (
        <div className={`p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-3`}>
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
            <div>
              <h3 className={`text-xs font-bold ${theme.textTitle} flex items-center gap-2`}>
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                PFRS Accounting Stage Progression Pipeline
              </h3>
              <p className="text-[10px] text-zinc-400">
                End-to-end flow from customer sales billing to period close & compliance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {[
              { phase: 'Stage 1: Billing', title: '1. Billing & Sales', desc: 'Invoicing & AR', icon: TrendingUp },
              { phase: 'Stage 2: Payables', title: '2. AP & Payroll', desc: 'Disbursements', icon: Briefcase },
              { phase: 'Stage 3: Tax', title: '3. Tax Returns', desc: 'BIR Remittances', icon: ShieldCheck },
              { phase: 'Stage 4: Banking', title: '4. Bank Recon', desc: 'Cash Flow Proof', icon: DollarSign },
              { phase: 'Stage 5: Close', title: '5. Financial Close', desc: 'Trial Balance & GL', icon: FileCheck }
            ].map(stage => {
              const stageTasks = filteredTasks.filter(t => t.phase === stage.phase);
              const completedCount = stageTasks.filter(t => t.column === 'done').length;
              const StageIcon = stage.icon;

              return (
                <div key={stage.phase} className="p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-bold font-display">{stage.title}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-zinc-400">
                      {completedCount}/{stageTasks.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {stageTasks.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setActiveChatTask(t)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                          t.column === 'done' 
                            ? 'border-emerald-500/20 bg-emerald-500/5' 
                            : 'border-black/5 dark:border-white/5 bg-black/3 dark:bg-white/3 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[8px] font-mono px-1 rounded ${getDepartmentBadge(t.department)}`}>
                            {t.department}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">{t.dueDate}</span>
                        </div>
                        <div className="font-semibold text-[11px] leading-tight line-clamp-2">
                          {t.title}
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-400 font-mono">
                          <span>{t.assignee.name.split(' ')[0]}</span>
                          <span className="font-bold text-cyan-400">{t.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW D: TASK QUEUE / LIST */}
      {boardView === 'list' && (
        <div className={`p-3.5 border ${theme.borderCard} ${theme.bgCard} rounded-xl shadow-xs space-y-3`}>
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <h3 className={`text-xs font-bold ${theme.textTitle} flex items-center gap-2`}>
              <CheckSquare className="w-4 h-4 text-cyan-500" />
              Full Activities Queue & Action Register
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Showing {filteredTasks.length} tasks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">Activity Task</th>
                  <th className="py-2 px-2.5">Department</th>
                  <th className="py-2 px-2.5">Assigned User</th>
                  <th className="py-2 px-2.5">Due Date</th>
                  <th className="py-2 px-2.5">Priority</th>
                  <th className="py-2 px-2.5 text-right">Progress</th>
                  <th className="py-2 px-2.5 text-center">Chat & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredTasks.map(task => {
                  const isDone = task.column === 'done';
                  const commentsCount = task.comments?.length || 0;

                  return (
                    <tr key={task.id} className="hover:bg-black/3 dark:hover:bg-white/3 transition">
                      <td className="py-2 px-2.5">
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="text-zinc-400 hover:text-emerald-400 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-2.5">
                        <div 
                          onClick={() => setActiveChatTask(task)}
                          className={`font-semibold cursor-pointer hover:text-cyan-400 ${isDone ? 'line-through text-zinc-500' : theme.textTitle}`}
                        >
                          {task.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">{task.description}</div>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getDepartmentBadge(task.department)}`}>
                          {task.department}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <div 
                          onClick={() => setActiveChatTask(task)}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-[9px]">
                            {task.assignee.avatarInitials}
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{task.assignee.name}</div>
                            <div className="text-[9px] text-zinc-400">{task.assignee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-zinc-400">
                        {task.dueDate}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold">
                        <span className={isDone ? 'text-emerald-400' : 'text-cyan-400'}>
                          {task.progress}%
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => setActiveChatTask(task)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{commentsCount} Messages</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE COLLABORATION DRAWER & TASK CHAT / REASSIGNMENT MODAL      */}
      {/* ========================================================================= */}
      {activeChatTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border ${theme.borderCard} ${theme.bgCard} shadow-2xl overflow-hidden`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2.5 pr-4 truncate">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getDepartmentBadge(activeChatTask.department)}`}>
                      {activeChatTask.department}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(activeChatTask.priority)}`}>
                      {activeChatTask.priority}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Due: {activeChatTask.dueDate}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold truncate mt-0.5 ${theme.textTitle}`}>
                    {activeChatTask.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveChatTask(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Delegation & Department Assignment Controls */}
            <div className="p-3 border-b border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* User Reassignment */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <UserPlus className="w-3 h-3 text-cyan-400" />
                  Assign to User (Access to Company)
                </label>
                <select
                  value={activeChatTask.assignee.id || ''}
                  onChange={(e) => {
                    const targetUser = companyUsersList.find(u => u.id === e.target.value);
                    if (targetUser) {
                      reassignTaskToUser(activeChatTask.id, targetUser);
                    }
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 font-semibold ${theme.textMain} cursor-pointer outline-none focus:border-cyan-500`}
                >
                  {companyUsersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Assignment */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  Assign Department
                </label>
                <select
                  value={activeChatTask.department}
                  onChange={(e) => reassignTaskDepartment(activeChatTask.id, e.target.value as Department)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 font-semibold ${theme.textMain} cursor-pointer outline-none focus:border-cyan-500`}
                >
                  {DEPARTMENTS_LIST.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Description & Meta Summary */}
            <div className="px-4 py-2 bg-black/3 dark:bg-white/3 border-b border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
              <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                "{activeChatTask.description}"
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-zinc-400">Status:</span>
                <select
                  value={activeChatTask.column}
                  onChange={(e) => moveTaskColumn(activeChatTask.id, e.target.value as TaskColumn)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${theme.borderCard} bg-black/5 dark:bg-white/5 cursor-pointer outline-none`}
                >
                  <option value="backlog">To Do / Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Verification & Review</option>
                  <option value="done">Completed & Reconciled</option>
                </select>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[360px]">
              {activeChatTask.comments && activeChatTask.comments.length > 0 ? (
                activeChatTask.comments.map(comment => {
                  if (comment.isSystemNote) {
                    return (
                      <div key={comment.id} className="flex items-center justify-center my-1.5">
                        <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                          <CornerDownRight className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{comment.text}</span>
                          <span className="text-zinc-500">• {comment.timestamp}</span>
                        </div>
                      </div>
                    );
                  }

                  const isMe = comment.authorAvatar === 'ME';

                  return (
                    <div 
                      key={comment.id} 
                      className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white shadow-xs ${
                        isMe 
                          ? 'bg-gradient-to-tr from-cyan-600 to-blue-600' 
                          : 'bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600'
                      }`}>
                        {comment.authorAvatar}
                      </div>

                      <div className={`max-w-[78%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <span className="font-bold text-zinc-200">{comment.authorName}</span>
                          {comment.department && (
                            <span className="text-[9px] px-1 rounded bg-black/10 dark:bg-white/10">
                              {comment.department}
                            </span>
                          )}
                          <span>• {comment.timestamp}</span>
                        </div>

                        <div className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-cyan-600 text-white rounded-tr-none' 
                            : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-200 rounded-tl-none'
                        }`}>
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-black/10 dark:border-white/10 rounded-xl text-zinc-400 text-xs">
                  <MessageSquare className="w-5 h-5 text-cyan-400 mb-1 opacity-70" />
                  <span>No communication logged yet.</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Post an operational note or update below.</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Response Suggestion Chips */}
            <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
              <span className="text-zinc-500 font-bold whitespace-nowrap">Quick Reply:</span>
              {[
                'Approved for payment',
                'BIR 2307 attached',
                'Transmitted eFPS payment',
                'Followed up client via phone',
                'Disbursement voucher prepared'
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleQuickReply(prompt)}
                  className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 text-zinc-400 whitespace-nowrap cursor-pointer transition border border-transparent hover:border-cyan-500/30"
                >
                  + {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendComment} className="p-3 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Message task team (${activeChatTask.department})... Press Enter to send`}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className={`flex-1 px-3 py-2 text-xs rounded-xl border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain} focus:outline-none focus:border-cyan-500`}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition shadow-xs ${
                  newCommentText.trim()
                    ? 'bg-cyan-600 hover:bg-cyan-500'
                    : 'bg-zinc-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE CUSTOM WORKFLOW TASK                                     */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-5 border ${theme.borderCard} ${theme.bgCard} rounded-2xl shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className={`text-sm font-bold ${theme.textTitle}`}>
                  Create Financial Activity & Assign Task
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Settle Bureau of Customs Import Duties"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain} focus:outline-none focus:border-cyan-500 font-medium`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Description / Operational Instruction
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, accounts involved, and compliance step instructions..."
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain} focus:outline-none focus:border-cyan-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Department *
                  </label>
                  <select
                    value={newTaskDepartment}
                    onChange={e => setNewTaskDepartment(e.target.value as Department)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain} font-semibold cursor-pointer`}
                  >
                    {DEPARTMENTS_LIST.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Assign to User (Access to Entity) *
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={e => setNewTaskAssigneeId(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain} font-semibold cursor-pointer`}
                  >
                    {companyUsersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as TaskCategory)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  >
                    <option value="Tax">Tax</option>
                    <option value="Receivables">Receivables</option>
                    <option value="Payables">Payables</option>
                    <option value="Banking">Banking</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Audit">Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Due Date Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Due Sep 20"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={newTaskAmount}
                    onChange={e => setNewTaskAmount(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Gantt Start Day (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newTaskStartDay}
                    onChange={e => setNewTaskStartDay(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Gantt End Day (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newTaskEndDay}
                    onChange={e => setNewTaskEndDay(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${theme.borderCard} bg-black/5 dark:bg-white/5 ${theme.textMain}`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs cursor-pointer"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
