'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { PAYMENTS, LEADS, PAYMENT_TRANSACTIONS } from '@/lib/crm/data';
import type { Payment, PaymentStatus, PaymentMethod } from '@/lib/crm/types';
import { PaymentDrawer } from './PaymentDrawer';
import { PaymentTableRow } from './PaymentTableRow';

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
];

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export function PaymentsView() {
  const { activeRole, currentUserId, can } = useCRMRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<PaymentStatus[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'created'>('dueDate');

  const filteredPayments = useMemo(() => {
    let base = can('payments.view_all')
      ? [...PAYMENTS]
      : activeRole === 'support_agent'
      ? PAYMENTS.filter((payment) => {
          const lead = LEADS.find((leadItem) => leadItem.id === payment.leadId);
          return lead?.status === 'enrolled' && lead?.assignedTo === currentUserId;
        })
      : PAYMENTS.filter((payment) => {
          const lead = LEADS.find((leadItem) => leadItem.id === payment.leadId);
          return lead?.assignedTo === currentUserId;
        });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      base = base.filter((payment) => {
        const lead = LEADS.find((leadItem) => leadItem.id === payment.leadId);

        return (
          payment.leadName.toLowerCase().includes(q) ||
          payment.program.toLowerCase().includes(q) ||
          payment.invoiceNumber?.toLowerCase().includes(q) ||
          lead?.name.toLowerCase().includes(q) ||
          lead?.email.toLowerCase().includes(q) ||
          lead?.mobile.toLowerCase().includes(q)
        );
      });
    }

    if (selectedStatuses.length > 0) {
      base = base.filter((payment) => selectedStatuses.includes(payment.status));
    }

    if (selectedMethods.length > 0) {
      base = base.filter((payment) => {
        const paymentMethods = PAYMENT_TRANSACTIONS
          .filter((txn) => txn.paymentId === payment.id)
          .map((txn) => txn.method);

        return paymentMethods.some((method) => selectedMethods.includes(method));
      });
    }

    base.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return base;
  }, [
    activeRole,
    currentUserId,
    can,
    searchQuery,
    selectedStatuses,
    selectedMethods,
    sortBy,
  ]);

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

  const paidAmount = filteredPayments.reduce(
    (sum, payment) => sum + payment.paidAmount,
    0,
  );

  const pendingAmount = filteredPayments.reduce(
    (sum, payment) => sum + Math.max(0, payment.totalAmount - payment.paidAmount),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} · Total:
            ₹{(totalAmount / 100_000).toFixed(1)}L
          </p>
        </div>

        {can('payments.edit') && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
            ₹{(totalAmount / 100_000).toFixed(1)}L
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Paid
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300 sm:text-2xl">
            ₹{(paidAmount / 100_000).toFixed(1)}L
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300 sm:text-2xl">
            ₹{(pendingAmount / 100_000).toFixed(1)}L
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by student name, email, mobile, program, or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80">
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>

            <div className="absolute left-0 top-full z-10 mt-1 hidden max-h-72 min-w-48 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses([...selectedStatuses, opt.value]);
                      } else {
                        setSelectedStatuses(
                          selectedStatuses.filter((status) => status !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80">
              Method {selectedMethods.length > 0 && `(${selectedMethods.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>

            <div className="absolute left-0 top-full z-10 mt-1 hidden max-h-72 min-w-48 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
              {METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMethods([...selectedMethods, opt.value]);
                      } else {
                        setSelectedMethods(
                          selectedMethods.filter((method) => method !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="group relative ml-auto">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80">
              Sort:{' '}
              {sortBy === 'dueDate'
                ? 'Due Date'
                : sortBy === 'amount'
                ? 'Amount'
                : 'Created'}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>

            <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-40 rounded-lg border border-border bg-popover p-1 shadow-lg group-hover:block">
              {[
                { value: 'dueDate' as const, label: 'Due Date' },
                { value: 'amount' as const, label: 'Amount (High to Low)' },
                { value: 'created' as const, label: 'Recently Created' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <p className="text-base font-medium text-foreground">No payments found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Student
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                    Amount
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredPayments.map((payment) => (
                  <PaymentTableRow
                    key={payment.id}
                    payment={payment}
                    onClick={() => setSelectedPayment(payment)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayment && (
        <PaymentDrawer
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdate={(updated) => setSelectedPayment(updated)}
        />
      )}
    </div>
  );
}