import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/lib/crm/types';

// ─── Display maps ─────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  low:    'bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-300',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending:   'bg-blue-100    text-blue-700    dark:bg-blue-900/40    dark:text-blue-300',
  overdue:   'bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  cancelled: 'bg-gray-100  text-gray-700  dark:bg-gray-800     dark:text-gray-300',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending:   'Pending',
  overdue:   'Overdue',
  completed: 'Done',
  in_progress: 'In Progress',
  cancelled: 'Cancelled',
};

// CSS capitalize gives "Whatsapp" not "WhatsApp" — use lookup
const TYPE_LABEL: Record<TaskType, string> = {
  call:     'Call',
  email:    'Email',
  whatsapp: 'WhatsApp',
  meeting:  'Meeting',
  document: 'Document',
  other:    'Other',
};

const TYPE_EMOJI: Record<TaskType, string> = {
  call:     '📞',
  email:    '✉️',
  whatsapp: '💬',
  meeting:  '🤝',
  document: '📄',
  other:    '🔖',
};

// ─── Due date helper ──────────────────────────────────────────────────────────

function dueDateInfo(task: Task): { label: string; late: boolean } {
  if (task.status === 'completed') return { label: 'Completed', late: false };

  const diff = new Date(task.dueDate).getTime() - Date.now();
  const days = Math.floor(Math.abs(diff) / 86_400_000);

  if (diff < 0)   return { label: `${days + 1}d overdue`, late: true  };
  if (days === 0) return { label: 'Due today',             late: true  };
  if (days === 1) return { label: 'Due tomorrow',          late: false };
  return              { label: `In ${days}d`,              late: false };
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const TaskCard = memo(function TaskCard({ task, onClick }: TaskCardProps) {
  const due = dueDateInfo(task);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open task: ${task.title}`}
      className="flex cursor-pointer flex-col gap-2.5 border-b border-border px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-primary/5"
    >
      {/* ── Row 1: priority dot + emoji + title + status ─────────────────── */}
      <div className="flex items-start gap-2.5">
        <span
          aria-label={`Priority: ${PRIORITY_LABEL[task.priority]}`}
          className={cn(
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            PRIORITY_DOT[task.priority],
          )}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            <span className="mr-1.5 select-none" aria-hidden="true">
              {TYPE_EMOJI[task.type]}
            </span>
            {task.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">For:</span>{' '}
            {task.leadName}
          </p>
        </div>

        {/* Status — always visible */}
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
            STATUS_BADGE[task.status] ?? STATUS_BADGE.pending,
          )}
        >
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
      </div>

      {/* ── Row 2: type + priority + due date ───────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {TYPE_LABEL[task.type]}
          </span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              PRIORITY_BADGE[task.priority],
            )}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {/* Due date — red when late */}
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
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

      {/* ── Row 3: assigned to ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <div
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground"
        >
          {task.assignedToName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {task.assignedToName}
        </p>
      </div>
    </div>
  );
});