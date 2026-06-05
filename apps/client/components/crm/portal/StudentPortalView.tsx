'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Award,
  FileText,
} from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { STUDENT_PROFILE, PAYMENTS, PAYMENT_TRANSACTIONS } from '@/lib/crm/data';

const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  enrolled: 'Enrolled',
  fee_pending: 'Fee Pending',
  fee_paid: 'Fee Paid',
  completed: 'Completed',
};

const STAGE_ORDER = [
  'draft',
  'submitted',
  'approved',
  'enrolled',
  'fee_pending',
  'fee_paid',
  'completed',
];

export function StudentPortalView() {
  const router = useRouter();
  const { isStudent } = useCRMRole();

  useEffect(() => {
    if (!isStudent) {
      router.replace('/crm/dashboard');
    }
  }, [isStudent, router]);

  if (!isStudent) return null;

  const student = STUDENT_PROFILE;

  const studentPayments = PAYMENTS.filter((p) => p.leadId === student.leadId);
  const studentTransactions = PAYMENT_TRANSACTIONS.filter((t) =>
    studentPayments.some((p) => p.id === t.paymentId),
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentStageIdx = STAGE_ORDER.indexOf(student.applicationStage);
  const progressPercent =
    currentStageIdx >= 0
      ? ((currentStageIdx + 1) / STAGE_ORDER.length) * 100
      : 0;

  const totalFeeAmount = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaidAmount = studentPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPendingAmount = totalFeeAmount - totalPaidAmount;

  const milestones = [...(student.milestones ?? [])].sort((a, b) => {
    if (!a.completedAt && !b.completedAt) return 0;
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  const emailHref = `mailto:${student.email}`;
  const phoneHref = student.mobile ? `tel:${student.mobile}` : '#';
  const supportEmailHref = 'mailto:support@helpingbots.com';
  const feesDueDate = studentPayments.find((p) => p.dueAmount > 0)?.dueDate;
  const enrollmentDate = student.createdAt;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {student.name}!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {student.program} · Enrolled{' '}
              {new Date(enrollmentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {student.name
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <a
            href={emailHref}
            className="block truncate text-sm font-medium text-primary hover:underline"
          >
            {student.email}
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Phone
          </p>
          <a href={phoneHref} className="text-sm font-medium text-primary hover:underline">
            {student.mobile}
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <p className="text-sm font-medium text-foreground">
            {student.paymentStatus === 'paid' ? '✓ Fully Paid' : '◌ Payment Pending'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Application Progress</h2>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {STAGE_LABELS[student.applicationStage] ?? student.applicationStage}
            </p>
            <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {STAGE_ORDER.map((stage, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = stage === student.applicationStage;

            return (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>

                <p
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
          Fee Payment Status
        </h2>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Fee
            </p>
            <p className="text-xl font-bold text-foreground">
              ₹{(totalFeeAmount / 100_000).toFixed(1)}L
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Paid
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{(totalPaidAmount / 100_000).toFixed(1)}L
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Pending
            </p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              ₹{(totalPendingAmount / 100_000).toFixed(1)}L
            </p>
          </div>
        </div>

        {totalFeeAmount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-foreground">Payment Progress</p>
              <p className="text-muted-foreground">
                {Math.round((totalPaidAmount / totalFeeAmount) * 100)}%
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.round((totalPaidAmount / totalFeeAmount) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {totalPendingAmount > 0 && feesDueDate && (
          <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Please clear pending fees by{' '}
              <strong>
                {new Date(feesDueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
              .
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Payment History</h2>

        {studentTransactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments yet</p>
        ) : (
          <div className="space-y-2">
            {studentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    ₹{(txn.amount / 100_000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(txn.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </p>
                </div>

                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {txn.method}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Award className="h-5 w-5 text-primary" aria-hidden="true" />
          Milestones
        </h2>

        {milestones.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No milestones yet</p>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, idx) => (
              <div key={milestone.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      milestone.isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  {idx < milestones.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                </div>

                <div className="flex-1 pb-3">
                  <p className="text-sm font-semibold text-foreground">{milestone.title}</p>

                  {milestone.completedAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(milestone.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}

                  {milestone.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
    <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
    Documents
  </h2>

  {student.paymentStatus === 'paid' ? (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted"
    >
      <span className="text-sm font-medium text-foreground">
        Certificate of Enrollment
      </span>
      <span className="text-xs text-muted-foreground">↓ Download</span>
    </button>
  ) : (
    <p className="py-4 text-center text-sm text-muted-foreground">
      Documents will be available after fee payment is completed.
    </p>
  )}
</div>

      <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Need help? Contact us at{' '}
          <a href={supportEmailHref} className="text-primary hover:underline">
            support@helpingbots.com
          </a>
        </p>
      </div>
    </div>
  );
}