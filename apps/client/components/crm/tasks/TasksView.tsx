'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { TASKS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/lib/crm/types';
import { TaskDrawer }      from './TaskDrawer';
import { TaskTableRow }    from './TaskTableRow';
import { TaskCard }        from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import {
  FilterDropdown,
  FilterOption,
  SortDropdown,
} from '@/components/crm/shared/FilterDropdown';
import { FilterSheet } from '@/components/crm/shared/FilterSheet';

// ─── Filter + sort option lists ───────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending'   },
  { value: 'overdue',   label: 'Overdue'   },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
];

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'call',     label: 'Call'     },
  { value: 'email',    label: 'Email'    },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting',  label: 'Meeting'  },
  { value: 'document', label: 'Document' },
  { value: 'other',    label: 'Other'    },
];

const SORT_OPTIONS: { value: 'due' | 'priority' | 'created'; label: string }[] = [
  { value: 'due',      label: 'Due Date'         },
  { value: 'priority', label: 'Priority'          },
  { value: 'created',  label: 'Recently Created'  },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};

// ─── Label lookups for active chips ───────────────────────────────────────────

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending', overdue: 'Overdue', completed: 'Completed', in_progress: 'In Progress', cancelled: 'Cancelled', 
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
};
const TYPE_LABEL: Record<TaskType, string> = {
  call: 'Call', email: 'Email', whatsapp: 'WhatsApp',
  meeting: 'Meeting', document: 'Document', other: 'Other',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksView() {
  const { currentUserId, can } = useCRMRole();

  const [createdTasks,       setCreatedTasks]       = useState<Task[]>([]);
  const [searchQuery,        setSearchQuery]         = useState('');
  const [selectedStatuses,   setSelectedStatuses]   = useState<TaskStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedTypes,      setSelectedTypes]      = useState<TaskType[]>([]);
  const [selectedAssignee,   setSelectedAssignee]   = useState<string | null>(null);
  const [sortBy,             setSortBy]             = useState<'due' | 'priority' | 'created'>('due');
  const [selectedTask,       setSelectedTask]       = useState<Task | null>(null);
  const [showCreateModal,    setShowCreateModal]     = useState(false);

  // ── Derived counts ────────────────────────────────────────────────────────
  const activeFilterCount =
    selectedStatuses.length +
    selectedPriorities.length +
    selectedTypes.length +
    (selectedAssignee ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // ── Filtered + sorted tasks ───────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const allTasks = [...createdTasks, ...TASKS];
    let base = can('tasks.view_all')
      ? allTasks
      : allTasks.filter((t) => t.assignedTo === currentUserId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (t) =>
          t.title.toLowerCase().includes(q)            ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.leadName.toLowerCase().includes(q)         ||
          t.assignedToName.toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length   > 0) base = base.filter((t) => selectedStatuses.includes(t.status));
    if (selectedPriorities.length > 0) base = base.filter((t) => selectedPriorities.includes(t.priority));
    if (selectedTypes.length      > 0) base = base.filter((t) => selectedTypes.includes(t.type));
    if (selectedAssignee)              base = base.filter((t) => t.assignedTo === selectedAssignee);

    return [...base].sort((a, b) => {
      if (sortBy === 'due')      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [createdTasks, can, currentUserId, searchQuery,
      selectedStatuses, selectedPriorities, selectedTypes, selectedAssignee, sortBy]);

  const overdueCount   = filteredTasks.filter((t) => t.status === 'overdue').length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;

  const toggleStatus   = (v: TaskStatus)   => setSelectedStatuses((p)   => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const togglePriority = (v: TaskPriority) => setSelectedPriorities((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleType     = (v: TaskType)     => setSelectedTypes((p)      => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleAssignee = (id: string)      => setSelectedAssignee((p)   => p === id ? null : id);
  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedTypes([]);
    setSelectedAssignee(null);
  };

  const handleTaskUpdate = (updated: Task) => {
    setCreatedTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            {overdueCount   > 0 && <span className="ml-2 font-semibold text-red-600 dark:text-red-400">· {overdueCount} overdue</span>}
            {completedCount > 0 && <span className="ml-2 text-muted-foreground">· {completedCount} done</span>}
          </p>
        </div>

        {can('tasks.create') && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Task
          </button>
        )}
      </div>

      {/* ── Overdue alert banner ─────────────────────────────────────────── */}
      {overdueCount > 0 && selectedStatuses.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {overdueCount} task{overdueCount > 1 ? 's are' : ' is'} overdue — action required
        </div>
      )}

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">

        {/* Search — always visible on all screen sizes */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="search"
            placeholder="Search by title, lead, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* ── Mobile: single FilterSheet button + sort ──────────────────── */}
        <div className="flex items-center gap-2 md:hidden">
          <FilterSheet activeCount={activeFilterCount} onClear={clearAllFilters}>

            <FilterSheet.Section title="Status">
              {STATUS_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedStatuses.includes(opt.value)}
                  onChange={() => toggleStatus(opt.value)} />
              ))}
            </FilterSheet.Section>

            <FilterSheet.Section title="Priority">
              {PRIORITY_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedPriorities.includes(opt.value)}
                  onChange={() => togglePriority(opt.value)} />
              ))}
            </FilterSheet.Section>

            <FilterSheet.Section title="Type">
              {TYPE_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedTypes.includes(opt.value)}
                  onChange={() => toggleType(opt.value)} />
              ))}
            </FilterSheet.Section>

            {can('tasks.view_all') && (
              <FilterSheet.Section title="Assignee">
                {TEAM_MEMBERS.filter((m) => m.role !== 'student').map((m) => (
                  <FilterSheet.Option key={m.id} label={m.name}
                    checked={selectedAssignee === m.id}
                    onChange={() => toggleAssignee(m.id)} />
                ))}
              </FilterSheet.Section>
            )}

          </FilterSheet>

          <SortDropdown value={sortBy} options={SORT_OPTIONS}
            onChange={setSortBy} className="ml-auto" />
        </div>

        {/* ── Desktop: inline filter row (unchanged) ────────────────────── */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">

          <FilterDropdown label="Status" count={selectedStatuses.length}>
            {STATUS_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedStatuses.includes(opt.value)}
                onChange={() => toggleStatus(opt.value)} />
            ))}
          </FilterDropdown>

          <FilterDropdown label="Priority" count={selectedPriorities.length}>
            {PRIORITY_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedPriorities.includes(opt.value)}
                onChange={() => togglePriority(opt.value)} />
            ))}
          </FilterDropdown>

          <FilterDropdown label="Type" count={selectedTypes.length}>
            {TYPE_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedTypes.includes(opt.value)}
                onChange={() => toggleType(opt.value)} />
            ))}
          </FilterDropdown>

          {can('tasks.view_all') && (
            <FilterDropdown label="Assignee" count={selectedAssignee ? 1 : 0}>
              <FilterOption label="All" checked={selectedAssignee === null}
                onChange={() => setSelectedAssignee(null)} />
              {TEAM_MEMBERS.filter((m) => m.role !== 'student').map((m) => (
                <FilterOption key={m.id} label={m.name}
                  checked={selectedAssignee === m.id}
                  onChange={() => toggleAssignee(m.id)} />
              ))}
            </FilterDropdown>
          )}

          <SortDropdown value={sortBy} options={SORT_OPTIONS}
            onChange={setSortBy} className="ml-auto" />
        </div>

        {/* Active filter chips — proper labels, not raw enum values */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {selectedStatuses.map((s) => (
              <button key={s} type="button" onClick={() => toggleStatus(s)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {STATUS_LABEL[s]} ×
              </button>
            ))}
            {selectedPriorities.map((p) => (
              <button key={p} type="button" onClick={() => togglePriority(p)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {PRIORITY_LABEL[p]} ×
              </button>
            ))}
            {selectedTypes.map((t) => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {TYPE_LABEL[t]} ×
              </button>
            ))}
            {selectedAssignee && (
              <button type="button" onClick={() => setSelectedAssignee(null)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {TEAM_MEMBERS.find((m) => m.id === selectedAssignee)?.name} ×
              </button>
            )}
            <button type="button" onClick={clearAllFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-base font-medium text-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground">
              {can('tasks.create')
                ? 'Create your first task using the button above.'
                : 'Try adjusting your filters or search query.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card list (< md) */}
            <div className="divide-y divide-border md:hidden">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>

            {/* Desktop: table (≥ md) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                      Task / Lead
                    </th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                      Assigned To
                    </th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">
                      Due
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.map((task) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Drawer / Modal ───────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(task) => {
          setCreatedTasks((prev) => [task, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}