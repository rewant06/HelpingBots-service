'use client';

import { X, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { IMPORT_PREVIEW_ROWS } from '@/lib/crm/data';
import type { ImportJob, ImportRowStatus } from '@/lib/crm/types';

const ROW_STATUS_CONFIG: Record<
  ImportRowStatus,
  { icon: typeof CheckCircle2; badge: string; label: string }
> = {
  valid: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    label: 'Valid',
  },
  warning: {
    icon: AlertCircle,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    label: 'Warning',
  },
  duplicate: {
    icon: AlertCircle,
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    label: 'Duplicate',
  },
  invalid: {
    icon: XCircle,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: 'Invalid',
  },
};

interface ImportDrawerProps {
  job: ImportJob;
  onClose: () => void;
  onUpdate: (job: ImportJob) => void;
}

export function ImportDrawer({ job, onClose, onUpdate }: ImportDrawerProps) {
  const { can } = useCRMRole();

  // Fixed: ImportRow has no importId in your data/type
  // Current preview data appears to be a single preview dataset, so use it directly
  const previewRows = IMPORT_PREVIEW_ROWS;

  const handleApprove = () => {
    const updated = { ...job, status: 'imported' as const };
    onUpdate(updated);
  };

  const handleReject = () => {
    const updated = { ...job, status: 'validation_failed' as const };
    onUpdate(updated);
  };

  const validRows = previewRows.filter((r) => r.status === 'valid').length;
  const warningRows = previewRows.filter((r) => r.status === 'warning').length;
  const invalidRows = previewRows.filter((r) => r.status === 'invalid').length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {job.fileName}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {previewRows.length} rows · Uploaded by {job.uploadedByName ?? job.uploadedBy}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                job.status === 'imported'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : job.status === 'pending_approval'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : job.status === 'validation_failed'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              }`}
            >
              {job.status === 'imported'
                ? 'Imported'
                : job.status === 'pending_approval'
                ? 'Pending Approval'
                : job.status === 'validation_failed'
                ? 'Validation Failed'
                : 'In Progress'}
            </span>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Valid
                </p>
                <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {validRows}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Warning
                </p>
                <p className="mt-0.5 text-lg font-bold text-amber-700 dark:text-amber-300">
                  {warningRows}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  Invalid
                </p>
                <p className="mt-0.5 text-lg font-bold text-red-700 dark:text-red-300">
                  {invalidRows}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-foreground">Row Preview</h4>
            <div className="space-y-2">
              {previewRows.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No rows to preview
                </p>
              ) : (
                previewRows.map((row) => {
                  const config = ROW_STATUS_CONFIG[row.status];
                  const RowIcon = config.icon;

                  const rowName = row.mappedData?.name || row.rawData?.Name || 'Unknown';
                  const rowEmail = row.mappedData?.email || row.rawData?.Email || 'No email';
                  const rowMessage =
                    row.errors?.[0] ||
                    row.warnings?.[0] ||
                    (row.isDuplicate ? 'Possible duplicate row detected' : '');

                  return (
                    <div
                      key={row.rowIndex}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      <RowIcon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          row.status === 'valid'
                            ? 'text-emerald-600'
                            : row.status === 'warning'
                            ? 'text-amber-600'
                            : row.status === 'duplicate'
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            Row {row.rowIndex}: {rowName}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badge}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        {rowMessage && (
                          <p
                            className={`text-xs ${
                              row.status === 'invalid'
                                ? 'text-red-600 dark:text-red-400'
                                : row.status === 'duplicate'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {rowMessage}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {rowEmail}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {job.status === 'pending_approval' && can('imports.approve') && (
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              >
                <XCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
                Approve & Import
              </button>
            </div>
          )}

          {job.status === 'imported' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                ✓ Import completed successfully
              </p>
            </div>
          )}

          {job.status === 'validation_failed' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                ✗ Import was rejected due to validation errors
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}