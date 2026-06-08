'use client';

import type { Task } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

// ─── Colour maps ──────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  overdue:   'Overdue',
  completed: 'Done',
};

const TYPE_EMOJI: Record<string, string> = {
  call:     '📞',
  email:    '✉️',
  whatsapp: '💬',
  meeting:  '🤝',
  document: '📄',
  other:    '🔖',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dueDateText(task: Task): { label: string; late: boolean } {
  if (task.status === 'completed') return { label: 'Completed', late: false };

  const diff = new Date(task.dueDate).getTime() - Date.now();
  const days = Math.floor(Math.abs(diff) / 86_400_000);

  if (diff < 0)     return { label: `${days + 1}d overdue`, late: true };
  if (days === 0)   return { label: 'Due today',            late: true };
  if (days === 1)   return { label: 'Due tomorrow',         late: false };
  return              { label: `In ${days}d`,               late: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskTableRowProps {
  task: Task;
  onClick: () => void;
}

export function TaskTableRow({ task, onClick }: TaskTableRowProps) {
  const due   = dueDateText(task);
  const emoji = TYPE_EMOJI[task.type] ?? '🔖';

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer transition-colors hover:bg-muted/40"
      tabIndex={0}
      role="button"
      aria-label={`Open task: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* ── Title + Type + Lead (all visible on mobile) ───────────────── */}
      <td className="px-4 py-3 sm:px-5">
        <div className="min-w-0">
          {/* Row 1: type emoji + title */}
          <div className="flex items-start gap-2">
            {/* Priority dot */}
            <span
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                PRIORITY_DOT[task.priority] ?? 'bg-slate-400',
              )}
              aria-label={`Priority: ${task.priority}`}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                <span className="mr-1.5 select-none" aria-hidden="true">{emoji}</span>
                {task.title}
              </p>
              {/* Row 2: "For: [lead name]" — always visible, even on mobile */}
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">For:</span>
                <span className="truncate">{task.leadName}</span>
              </p>
            </div>
          </div>

          {/* Row 3 (mobile-only): due date badge */}
          <div className="mt-1.5 sm:hidden">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                due.late
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : task.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {due.label}
            </span>
          </div>
        </div>
      </td>

      {/* ── Assignee (hidden on small screens) ───────────────────────── */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell sm:px-5">
        <span className="truncate">{task.assignedToName}</span>
      </td>

      {/* ── Due date (hidden on small screens — shown inline above) ──── */}
      <td className="hidden px-4 py-3 text-sm lg:table-cell lg:px-5">
        <span
          className={cn(
            'font-medium',
            task.status === 'overdue' || due.late
              ? 'text-red-600 dark:text-red-400'
              : task.status === 'completed'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground',
          )}
        >
          {due.label}
        </span>
      </td>

      {/* ── Status badge ─────────────────────────────────────────────── */}
      <td className="px-4 py-3 sm:px-5">
        <span
          className={cn(
            'inline-block rounded-full px-2.5 py-1 text-xs font-medium',
            STATUS_BADGE[task.status] ?? STATUS_BADGE.pending,
          )}
        >
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
      </td>
    </tr>
  );
}