'use client';

import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import type { ImportJob } from '@/lib/crm/types';

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; badge: string; label: string }> = {
  imported: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    label: 'Imported',
  },
  pending_approval: {
    icon: Clock,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    label: 'Pending Approval',
  },
  validation_failed: {
    icon: AlertCircle,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: 'Validation Failed',
  },
  in_progress: {
    icon: Clock,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    label: 'In Progress',
  },
  failed: {
    icon: XCircle,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: 'Failed',
  },
};

interface ImportJobRowProps {
  job: ImportJob;
  onClick: () => void;
}

export function ImportJobRow({ job, onClick }: ImportJobRowProps) {
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.failed;
  const StatusIcon = config.icon;

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
      {/* Filename */}
      <td className="px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {job.filename}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Uploaded by {job.uploadedBy}
          </p>
        </div>
      </td>

      {/* Row count */}
      <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell sm:px-5">
        <span>{job.rowCount} rows</span>
      </td>

      {/* Uploaded date */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell lg:px-5">
        {new Date(job.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
        })}
      </td>

      {/* Status badge */}
      <td className="px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${config.badge}`}
          >
            {config.label}
          </span>
        </div>
      </td>
    </tr>
  );
}