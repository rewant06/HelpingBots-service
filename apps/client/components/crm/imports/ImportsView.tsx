'use client';

import { useMemo, useRef, useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { IMPORT_JOBS } from '@/lib/crm/data';
import type { ImportJob } from '@/lib/crm/types';
import { ImportDrawer } from './ImportDrawer';
import { ImportJobRow } from './ImportJobRow';

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'imported', label: 'Imported' },
  { value: 'validation_failed', label: 'Validation Failed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'failed', label: 'Failed' },
];

export function ImportsView() {
  const { can } = useCRMRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const filteredJobs = useMemo(() => {
    const base =
      selectedStatuses.length > 0
        ? IMPORT_JOBS.filter((job) => selectedStatuses.includes(job.status))
        : IMPORT_JOBS;

    return [...base].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [selectedStatuses]);

  const stats = useMemo(() => {
    return {
      total: IMPORT_JOBS.length,
      pending: IMPORT_JOBS.filter((j) => j.status === 'pending_approval').length,
      failed: IMPORT_JOBS.filter((j) => j.status === 'validation_failed').length,
      imported: IMPORT_JOBS.filter((j) => j.status === 'imported').length,
    };
  }, []);

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(value)
        ? prev.filter((status) => status !== value)
        : [...prev, value],
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Import Center
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} import{stats.total !== 1 ? 's' : ''} · {stats.pending}{' '}
            pending approval · {stats.failed} failed
          </p>
        </div>

        {can('imports.upload') && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload CSV
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              aria-label="Upload CSV file"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats.total}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            Failed
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
            {stats.failed}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Imported
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.imported}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = selectedStatuses.includes(opt.value);

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background hover:bg-muted'
              }`}
              aria-pressed={isSelected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <FileUp
              className="h-12 w-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="text-base font-medium text-foreground">
              No imports found
            </p>
            <p className="text-sm text-muted-foreground">
              {can('imports.upload')
                ? 'Upload a CSV file to get started'
                : 'You do not have permission to upload files'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    File
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                    Rows
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredJobs.map((job) => (
                  <ImportJobRow
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedJob(job)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedJob && (
        <ImportDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={(updated) => setSelectedJob(updated)}
        />
      )}
    </div>
  );
}