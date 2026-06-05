'use client';

import type { ImportJob } from '@/lib/crm/types';

const STATUS_BADGE: Record<string, string> = {
  imported:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pendingapproval:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  validationfailed:
    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  inprogress:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  failed:
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const STATUS_LABEL: Record<string, string> = {
  imported: 'Imported',
  pendingapproval: 'Pending Approval',
  validationfailed: 'Validation Failed',
  inprogress: 'In Progress',
  failed: 'Failed',
};

interface ImportJobRowProps {
  job: ImportJob;
  onClick: () => void;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ImportJobRow({ job, onClick }: ImportJobRowProps) {
  const badgeClass =
    STATUS_BADGE[job.status] ??
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const statusLabel = STATUS_LABEL[job.status] ?? job.status;

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-muted/40"
      tabIndex={0}
      aria-label={`Open import job ${job.fileName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <td className="px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{job.fileName}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {formatFileSize(job.fileSize)} · Uploaded by {job.uploadedByName}
          </p>
        </div>
      </td>

      <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell sm:px-5">
        <div className="flex flex-col">
          <span>{job.totalRows} rows</span>
          <span className="text-xs text-muted-foreground">
            {job.validRows} valid · {job.invalidRows} invalid · {job.duplicateRows}{' '}
            duplicates
          </span>
        </div>
      </td>

      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell lg:px-5">
        {formatDate(job.createdAt)}
      </td>

      <td className="px-4 py-3 sm:px-5">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}
        >
          {statusLabel}
        </span>
      </td>
    </tr>
  );
}