'use client';

import { LEADS } from '@/lib/crm/data';
import type { Payment } from '@/lib/crm/types';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  partially_paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  refunded: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  disputed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  partially_paid: 'Partial',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

interface PaymentTableRowProps {
  payment: Payment;
  onClick: () => void;
}

export function PaymentTableRow({ payment, onClick }: PaymentTableRowProps) {
  const lead = LEADS.find((l) => l.id === payment.leadId);

  const progressPercent =
    payment.status === 'paid'
      ? 100
      : payment.status === 'partially_paid'
      ? (payment.paidAmount / payment.totalAmount) * 100
      : 0;

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
      {/* Student name */}
      <td className="px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {lead?.name || 'Unknown'}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="hidden px-4 py-3 font-semibold text-foreground sm:table-cell sm:px-5">
        ₹{(payment.totalAmount / 100_000).toFixed(1)}L
      </td>

      {/* Due Date */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell lg:px-5">
        {new Date(payment.dueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
        })}
      </td>

      {/* Status badge */}
      <td className="px-4 py-3 sm:px-5">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[payment.status]}`}
        >
          {STATUS_LABEL[payment.status]}
        </span>
      </td>
    </tr>
  );
}