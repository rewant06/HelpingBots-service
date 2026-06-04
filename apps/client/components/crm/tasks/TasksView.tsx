'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { TASKS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/crm/types';
import { TaskDrawer } from './TaskDrawer';
import { TaskTableRow } from './TaskTableRow';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

export function TasksView() {
  const { activeRole, currentUserId, can } = useCRMRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TaskType[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<'due' | 'priority' | 'created'>('due');

  // ─── Data filtering & search ───────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    // Base: role-filtered tasks
    let base = can('tasks.view_all')
      ? TASKS
      : TASKS.filter((t) => t.assignedTo === currentUserId);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.leadName.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      base = base.filter((t) => selectedStatuses.includes(t.status));
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      base = base.filter((t) => selectedPriorities.includes(t.priority));
    }

    // Type filter
    if (selectedTypes.length > 0) {
      base = base.filter((t) => selectedTypes.includes(t.type));
    }

    // Assignee filter
    if (selectedAssignee) {
      base = base.filter((t) => t.assignedTo === selectedAssignee);
    }

    // Sorting
    base.sort((a, b) => {
      if (sortBy === 'due') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<TaskPriority, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });

    return base;
  }, [
    activeRole,
    currentUserId,
    can,
    searchQuery,
    selectedStatuses,
    selectedPriorities,
    selectedTypes,
    selectedAssignee,
    sortBy,
  ]);

  const overdueCount = filteredTasks.filter((t) => t.status === 'overdue').length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} · {overdueCount} overdue · {completedCount} completed
          </p>
        </div>
        {can('tasks.create') && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Task
          </button>
        )}
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">

        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by title, description, or lead name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">

          {/* Status filter */}
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-48">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses([...selectedStatuses, opt.value]);
                      } else {
                        setSelectedStatuses(
                          selectedStatuses.filter((s) => s !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Priority {selectedPriorities.length > 0 && `(${selectedPriorities.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-40">
              {PRIORITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPriorities.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriorities([...selectedPriorities, opt.value]);
                      } else {
                        setSelectedPriorities(
                          selectedPriorities.filter((p) => p !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-40">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, opt.value]);
                      } else {
                        setSelectedTypes(
                          selectedTypes.filter((t) => t !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Assignee filter (admin+ only) */}
          {can('tasks.view_all') && (
            <div className="relative group">
              <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
                Assignee {selectedAssignee && '(1)'}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-48 max-h-72 overflow-y-auto">
                <label className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAssignee === null}
                    onChange={() => setSelectedAssignee(null)}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  All
                </label>
                {TEAM_MEMBERS.map((tm) => (
                  <label
                    key={tm.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignee === tm.id}
                      onChange={() =>
                        setSelectedAssignee(
                          selectedAssignee === tm.id ? null : tm.id,
                        )
                      }
                      className="h-4 w-4 rounded cursor-pointer"
                    />
                    {tm.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sort dropdown */}
          <div className="relative group ml-auto">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Sort:{' '}
              {sortBy === 'due'
                ? 'Due Date'
                : sortBy === 'priority'
                ? 'Priority'
                : 'Created'}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-1 min-w-40">
              {[
                { value: 'due' as const, label: 'Due Date' },
                { value: 'priority' as const, label: 'Priority' },
                { value: 'created' as const, label: 'Recently Created' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tasks Table ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <p className="text-base font-medium text-foreground">
              No tasks found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Task
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                    Lead
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
        )}
      </div>

      {/* ── Task Detail Drawer ─────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => setSelectedTask(updated)}
        />
      )}
    </div>
  );
}