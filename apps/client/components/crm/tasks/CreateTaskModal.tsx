'use client';

import { useMemo, useState } from 'react';
import {
  X,
  Search,
  Phone,
  Mail,
  MessageCircle,
  CalendarDays,
  FileText,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Lead, Task, TaskPriority, TaskType } from '@/lib/crm/types';

// ─── Constants ────────────────────────────────────────────────────────────────

interface TaskTypeOption {
  value: TaskType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const TASK_TYPES: TaskTypeOption[] = [
  { value: 'call',      label: 'Call',     icon: Phone,         color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' },
  { value: 'email',     label: 'Email',    icon: Mail,          color: 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800' },
  { value: 'whatsapp',  label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' },
  { value: 'meeting',   label: 'Meeting',  icon: CalendarDays,  color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' },
  { value: 'document',  label: 'Docs',     icon: FileText,      color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800' },
  { value: 'other',     label: 'Other',    icon: Tag,           color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
  { value: 'high',   label: 'High',   dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-slate-400' },
];

// Smart title templates — auto-fill a human-readable title
const TITLE_TPL: Record<TaskType, (lead: Lead) => string> = {
  call:     (l) => `Call ${l.name} — ${l.program}`,
  email:    (l) => `Email ${l.name} — ${l.program} brochure & fee structure`,
  whatsapp: (l) => `WhatsApp ${l.name} — ${l.program} follow-up`,
  meeting:  (l) => `Meeting with ${l.name} re: ${l.program} admission`,
  document: (l) => `Collect documents from ${l.name} — ${l.program}`,
  other:    (l) => `Follow up with ${l.name}`,
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  follow_up: 'Follow-up', application_started: 'App Started',
  application_submitted: 'Submitted', admission_confirmed: 'Confirmed',
  enrolled: 'Enrolled', lost: 'Lost', on_hold: 'On Hold',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the newly created task object */
  onCreated: (task: Task) => void;
  /** Pre-select a lead when opening from a lead detail drawer */
  defaultLeadId?: string;
}

export function CreateTaskModal({
  open,
  onClose,
  onCreated,
  defaultLeadId,
}: CreateTaskModalProps) {
  const { can, currentUserId, currentUserName, activeRole } = useCRMRole();

  // ── Form state ────────────────────────────────────────────────────────────
  const [leadSearch,   setLeadSearch]   = useState('');
  const [leadDropOpen, setLeadDropOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    () => LEADS.find((l) => l.id === defaultLeadId) ?? null,
  );

  const [taskType,    setTaskType]    = useState<TaskType>('call');
  const [title,       setTitle]       = useState(() =>
    defaultLeadId ? TITLE_TPL.call(LEADS.find((l) => l.id === defaultLeadId)!) : '',
  );
  const [autoTitle,   setAutoTitle]   = useState(!!defaultLeadId);
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<TaskPriority>('medium');
  const [dueDate,     setDueDate]     = useState('');
  const [assignedTo,  setAssignedTo]  = useState(currentUserId);

  // ── Derived data ──────────────────────────────────────────────────────────
  const visibleLeads = useMemo(() => {
    const base = can('leads.view_all')
      ? LEADS
      : LEADS.filter((l) => l.assignedTo === currentUserId);
    const q = leadSearch.toLowerCase().trim();
    if (!q) return base.slice(0, 8);
    return base
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.program.toLowerCase().includes(q) ||
          l.mobile.includes(q) ||
          l.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [leadSearch, can, currentUserId]);

  const assignableMembers = useMemo(
    () =>
      can('tasks.view_all')
        ? TEAM_MEMBERS.filter((m) => m.status === 'active' && m.role !== 'student')
        : TEAM_MEMBERS.filter((m) => m.id === currentUserId),
    [can, currentUserId],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDropOpen(false);
    setLeadSearch('');
    if (!title || autoTitle) {
      setTitle(TITLE_TPL[taskType](lead));
      setAutoTitle(true);
    }
  };

  const clearLead = () => {
    setSelectedLead(null);
    setTitle('');
    setAutoTitle(false);
  };

  const handleTypeChange = (type: TaskType) => {
    setTaskType(type);
    if (selectedLead && (!title || autoTitle)) {
      setTitle(TITLE_TPL[type](selectedLead));
      setAutoTitle(true);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setAutoTitle(false); // user is typing — stop auto-fill
  };

  const isValid = !!selectedLead && title.trim().length > 0 && dueDate.length > 0;

  const handleSubmit = () => {
    if (!isValid || !selectedLead) return;
    const member = TEAM_MEMBERS.find((m) => m.id === assignedTo);
    const task: Task = {
      id:             `task-new-${Date.now()}`,
      leadId:         selectedLead.id,
      leadName:       selectedLead.name,
      title:          title.trim(),
      description:    description.trim() || undefined,
      type:           taskType,
      status:         'pending',
      priority,
      assignedTo,
      assignedToName: member?.name ?? currentUserName,
      dueDate:        new Date(dueDate).toISOString(),
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    };
    onCreated(task);
    reset();
    onClose();
  };

  const reset = () => {
    setSelectedLead(null);
    setLeadSearch('');
    setTaskType('call');
    setTitle('');
    setAutoTitle(false);
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setAssignedTo(currentUserId);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, centered card on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Task"
        className={cn(
          'fixed z-50 bg-background shadow-2xl',
          // Mobile: full-width bottom sheet
          'inset-x-0 bottom-0 rounded-t-2xl',
          // Desktop: centered modal
          'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-full sm:max-w-lg sm:rounded-2xl',
          'animate-in slide-in-from-bottom sm:zoom-in-95 duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Link an action item to a lead
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain px-5 py-4 space-y-5">

          {/* ── 1. Lead Selector (CRITICAL) ──────────────────────────────── */}
          <section>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              For which student / lead?{' '}
              <span className="text-red-500" aria-hidden>*</span>
            </p>

            {selectedLead ? (
              /* Selected state — show lead card */
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {selectedLead.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {selectedLead.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedLead.program} · {selectedLead.mobile}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                    {STATUS_LABEL[selectedLead.status] ?? selectedLead.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearLead}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Remove selected lead"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Search state */
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  inputMode="search"
                  placeholder="Search name, program, mobile…"
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    setLeadDropOpen(true);
                  }}
                  onFocus={() => setLeadDropOpen(true)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {leadDropOpen && visibleLeads.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
                    {visibleLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => selectLead(lead)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {lead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {lead.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lead.program} ·{' '}
                            {STATUS_LABEL[lead.status] ?? lead.status}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 2. Task Type ─────────────────────────────────────────────── */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Task Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map((opt) => {
                const Icon = opt.icon;
                const isActive = taskType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTypeChange(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-all active:scale-95',
                      isActive
                        ? cn('border-2', opt.color)
                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && opt.color.split(' ')[0])} aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 3. Title ─────────────────────────────────────────────────── */}
          <section>
            <label
              htmlFor="task-title"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Task Title <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Call Ananya about M.Tech fees"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {autoTitle && (
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden="true" />
                Auto-filled — edit as needed
              </p>
            )}
          </section>

          {/* ── 4. Description ───────────────────────────────────────────── */}
          <section>
            <label
              htmlFor="task-desc"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Description (optional)
            </label>
            <textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context — e.g. student asked about scholarship, fee deadline approaching"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </section>

          {/* ── 5. Priority + Due Date (side-by-side on mobile too) ──────── */}
          <div className="grid grid-cols-2 gap-3">
            <section>
              <label
                htmlFor="task-priority"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <label
                htmlFor="task-due"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Due Date <span className="text-red-500" aria-hidden>*</span>
              </label>
              <input
                id="task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </section>
          </div>

          {/* ── 6. Assignee (admin+ only) ────────────────────────────────── */}
          {can('tasks.view_all') && (
            <section>
              <label
                htmlFor="task-assignee"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Assign To
              </label>
              <select
                id="task-assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Task
          </button>
        </div>
      </div>
    </>
  );
}