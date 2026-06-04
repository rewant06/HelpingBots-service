'use client';

import { X, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, PAYMENT_TRANSACTIONS } from '@/lib/crm/data';
import type { Payment } from '@/lib/crm/types';

interface PaymentDrawerProps {
  payment: Payment;
  onClose: () => void;
  onUpdate: (payment: Payment) => void;
}

export function PaymentDrawer({ payment, onClose, onUpdate }: PaymentDrawerProps) {
  const { can } = useCRMRole();
  const lead = LEADS.find((l) => l.id === payment.leadId);

  const transactions = PAYMENT_TRANSACTIONS.filter(
    (t) => t.paymentId === payment.id,
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleStatusChange = (newStatus: Payment['status']) => {
    const updated = { ...payment, status: newStatus };
    onUpdate(updated);
  };

  const progressPercent =
    payment.status === 'paid'
      ? 100
      : payment.status === 'partially_paid'
      ? (payment.paidAmount / payment.totalAmount) * 100
      : 0;

  const pendingAmount = payment.totalAmount - payment.paidAmount;

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
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-md">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Payment
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lead?.name}
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

          {/* Status & Amount */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Status
            </p>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium mb-3 ${
                payment.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : payment.status === 'partially_paid'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : payment.status === 'pending'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : payment.status === 'failed'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {payment.status === 'paid'
                ? 'Paid'
                : payment.status === 'partially_paid'
                ? 'Partially Paid'
                : payment.status === 'pending'
                ? 'Pending'
                : payment.status === 'failed'
                ? 'Failed'
                : payment.status === 'refunded'
                ? 'Refunded'
                : payment.status === 'cancelled'
                ? 'Cancelled'
                : 'Disputed'}
            </span>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Payment Progress</span>
                <span className="text-xs font-semibold text-foreground">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-semibold text-foreground">
                ₹{(payment.totalAmount / 100_000).toFixed(1)}L
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{(payment.paidAmount / 100_000).toFixed(1)}L
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">
                Pending
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                ₹{(pendingAmount / 100_000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Payment Method
              </p>
              <p className="text-sm font-medium text-foreground capitalize">
                {payment.method.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Due Date
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(payment.dueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Program
              </p>
              <p className="text-sm font-medium text-foreground">
                {lead?.program}
              </p>
            </div>
          </div>

          {/* Status change buttons */}
          {can('payments.edit') && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mark as
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
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

          {/* Transaction history */}
          <div>
            <h4 className="mb-3 font-semibold text-foreground">
              Transaction History
            </h4>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              ) : (
                transactions.map((txn) => (
                  <div key={txn.id} className="flex items-start gap-3 rounded-lg bg-muted/30 p-2.5">
                    <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">
                        +₹{(txn.amount / 100_000).toFixed(1)}L
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(txn.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {txn.method}
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