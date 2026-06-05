'use client';

import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import type { Task } from '@/lib/crm/types';
import { useMemo } from 'react';


interface TaskDrawerProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export function TaskDrawer({ task, onClose, onUpdate }: TaskDrawerProps) {
  const { can } = useCRMRole();

  const handleStatusChange = (newStatus: 'pending' | 'overdue' | 'completed') => {
    const updated = { ...task, status: newStatus };
    onUpdate(updated);
  };

 const dueDateObj = useMemo(() => new Date(task.dueDate), [task.dueDate]);

const daysUntilDue = useMemo(() => {
  const now = new Date();
  return Math.floor(
    (dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}, [dueDateObj]);
  const dueDateStr =
    task.status === 'completed'
      ? 'Completed'
      : task.status === 'overdue'
      ? `${Math.abs(daysUntilDue) + 1}d overdue`
      : daysUntilDue === 0
      ? 'Due today'
      : daysUntilDue === 1
      ? 'Due tomorrow'
      : `Due in ${daysUntilDue}d`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-md">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {task.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
              {task.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 sm:p-6">

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Status
            </p>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                task.status === 'pending'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : task.status === 'overdue'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}
            >
              {task.status === 'pending'
                ? 'Pending'
                : task.status === 'overdue'
                ? 'Overdue'
                : 'Completed'}
            </span>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Priority
            </p>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                task.priority === 'urgent'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : task.priority === 'high'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : task.priority === 'medium'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Description
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Due Date */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Due Date</span>
              <span
                className={`text-sm font-medium ${
                  task.status === 'overdue'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground'
                }`}
              >
                {dueDateObj.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{dueDateStr}</p>
          </div>

          {/* Lead & Assignee */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Lead
              </p>
              <p className="text-sm font-medium text-foreground">
                {task.leadName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Assigned To
              </p>
              <p className="text-sm font-medium text-foreground">
                {task.assignedToName}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {can('tasks.create') && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mark as
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={task.status === 'completed'}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    task.status === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'border border-border bg-background hover:bg-muted disabled:opacity-50'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Pending
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    task.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-border bg-background hover:bg-muted'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Completed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}