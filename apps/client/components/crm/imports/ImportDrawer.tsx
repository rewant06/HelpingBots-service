'use client';

import { X, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { IMPORT_PREVIEW_ROWS } from '@/lib/crm/data';
import type { ImportJob, ImportRowStatus } from '@/lib/crm/types';

const ROW_STATUS_CONFIG: Record<ImportRowStatus, { icon: typeof CheckCircle2; badge: string; label: string }> = {
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

  const previewRows = IMPORT_PREVIEW_ROWS.filter((r) => r.importId === job.id);

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
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-lg">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {job.filename}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {previewRows.length} rows · Uploaded by {job.uploadedBy}
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

          {/* Validation summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Valid
                </p>
                <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {validRows}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Warning
                </p>
                <p className="mt-0.5 text-lg font-bold text-amber-700 dark:text-amber-300">
                  {warningRows}
                </p>
              </div>
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Invalid
                </p>
                <p className="mt-0.5 text-lg font-bold text-red-700 dark:text-red-300">
                  {invalidRows}
                </p>
              </div>
            </div>
          </div>

          {/* Row preview */}
          <div>
            <h4 className="mb-3 font-semibold text-foreground">
              Row Preview
            </h4>
            <div className="space-y-2">
              {previewRows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No rows to preview
                </p>
              ) : (
                previewRows.map((row) => {
                  const config = ROW_STATUS_CONFIG[row.status];
                  const RowIcon = config.icon;
                  return (
                    <div
                      key={row.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      <RowIcon
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
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
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            Row {row.rowNumber}: {row.data.name || 'Unknown'}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badge}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        {row.error && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {row.error}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.data.email}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Approval buttons */}
          {job.status === 'pending_approval' && can('imports.approve') && (
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              >
                <XCircle className="h-4 w-4 inline mr-1" aria-hidden="true" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 inline mr-1" aria-hidden="true" />
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