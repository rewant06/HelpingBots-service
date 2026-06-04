'use client';

import type { Task } from '@/lib/crm/types';

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

interface TaskTableRowProps {
  task: Task;
  onClick: () => void;
}

export function TaskTableRow({ task, onClick }: TaskTableRowProps) {
  const dueDateObj = new Date(task.dueDate);
  const now = new Date();
  const daysUntilDue = Math.floor(
    (dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

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
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-muted/40"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Task title + type */}
      <td className="px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{task.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground capitalize">
            {task.type}
          </p>
        </div>
      </td>

      {/* Lead name */}
      <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell sm:px-5">
        <span className="truncate">{task.leadName}</span>
      </td>

      {/* Due date */}
      <td className="hidden px-4 py-3 text-sm lg:table-cell lg:px-5">
        <span
          className={
            task.status === 'overdue'
              ? 'text-red-600 dark:text-red-400 font-medium'
              : task.status === 'completed'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground'
          }
        >
          {dueDateStr}
        </span>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3 sm:px-5">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[task.status]}`}
        >
          {task.status === 'pending'
            ? 'Pending'
            : task.status === 'overdue'
            ? 'Overdue'
            : 'Completed'}
        </span>
      </td>
    </tr>
  );
}