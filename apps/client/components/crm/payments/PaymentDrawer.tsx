'use client';

import { useMemo } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, PAYMENT_TRANSACTIONS } from '@/lib/crm/data';
import type { Payment, PaymentTransaction } from '@/lib/crm/types';

interface PaymentDrawerProps {
  payment: Payment;
  onClose: () => void;
  onUpdate: (payment: Payment) => void;
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  refunded: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  not_started: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  partially_paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  partiallypaid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

function getStatusLabel(status: Payment['status']) {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'pending':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    case 'refunded':
      return 'Refunded';
    case 'cancelled':
      return 'Cancelled';
    case 'not_started':
      return 'Not Started';
    case 'partially_paid':
      return 'Partially Paid';
    default:
      return String(status).replace(/_/g, ' ');
  }
}

function getProgressPercent(payment: Payment) {
  if (payment.status === 'paid') return 100;
  if (payment.totalAmount <= 0) return 0;
  return Math.min(100, (payment.paidAmount / payment.totalAmount) * 100);
}

function formatAmount(amount: number) {
  return `₹${(amount / 100_000).toFixed(1)}L`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaymentDrawer({ payment, onClose, onUpdate }: PaymentDrawerProps) {
  const { can } = useCRMRole();

  const lead = useMemo(() => {
    return LEADS.find((item) => item.id === payment.leadId);
  }, [payment.leadId]);

  const transactions = useMemo<PaymentTransaction[]>(() => {
    return PAYMENT_TRANSACTIONS
      .filter((txn: PaymentTransaction) => txn.paymentId === payment.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payment.id]);

  const latestTransaction = transactions[0];

  const handleStatusChange = (newStatus: Payment['status']) => {
    onUpdate({ ...payment, status: newStatus });
  };

  const progressPercent = getProgressPercent(payment);
  const pendingAmount = Math.max(0, payment.totalAmount - payment.paidAmount);
  const statusClass =
    STATUS_STYLES[payment.status] ??
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Close payment details"
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />

      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-drawer-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 id="payment-drawer-title" className="text-lg font-semibold text-foreground">
              Payment
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lead?.name ?? payment.leadName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>

            <span
              className={`mb-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
            >
              {getStatusLabel(payment.status)}
            </span>

            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment Progress</span>
                <span className="text-xs font-semibold text-foreground">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-semibold text-foreground">
                {formatAmount(payment.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatAmount(payment.paidAmount)}
              </span>
            </div>

            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-foreground">Pending</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatAmount(pendingAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment Method
              </p>
              <p className="text-sm font-medium capitalize text-foreground">
                {latestTransaction
                  ? String(latestTransaction.method).replace(/_/g, ' ')
                  : '—'}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Due Date
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(payment.dueDate)}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Program
              </p>
              <p className="text-sm font-medium text-foreground">
                {payment.program ?? lead?.program ?? '—'}
              </p>
            </div>

            {'invoiceNumber' in payment && payment.invoiceNumber && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Invoice Number
                </p>
                <p className="text-sm font-medium text-foreground">
                  {payment.invoiceNumber}
                </p>
              </div>
            )}
          </div>

          {can('payments.edit') && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mark as
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('pending')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    payment.status === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'border border-border bg-background hover:bg-muted'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Pending
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('paid')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    payment.status === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-border bg-background hover:bg-muted'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Paid
                </button>
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-3 font-semibold text-foreground">Transaction History</h4>

            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No transactions yet
                </p>
              ) : (
                transactions.map((txn: PaymentTransaction) => (
                  <div
                    key={txn.id}
                    className="flex items-start gap-3 rounded-lg bg-muted/30 p-2.5"
                  >
                    <CreditCard
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">
                        +{formatAmount(txn.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateTime(txn.date)}
                      </p>
                      {txn.reference ? (
                        <p className="text-[10px] text-muted-foreground">
                          {txn.reference}
                        </p>
                      ) : null}
                    </div>

                    <span className="shrink-0 text-[10px] font-medium uppercase text-muted-foreground">
                      {String(txn.method).replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}