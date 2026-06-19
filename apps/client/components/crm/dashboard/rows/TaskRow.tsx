import { memo } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/crm/types';
import { PRIORITY_DOT, TASK_ICON, fmtDue } from '../helpers';

interface TaskRowProps {
  task: Task;
}

export const TaskRow = memo(function TaskRow({ task }: TaskRowProps) {
  const Icon   = TASK_ICON[task.type] ?? FileText;
  const due    = fmtDue(task.dueDate);
  const isLate = due.late || task.status === 'overdue';

  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-background',
            PRIORITY_DOT[task.priority],
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">{task.leadName}</p>
      </div>

      <span
        className={cn(
          'shrink-0 whitespace-nowrap text-xs font-medium',
          isLate ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
        )}
      >
        {due.label}
      </span>
    </div>
  );
});