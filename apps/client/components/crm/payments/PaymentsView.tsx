'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { PAYMENTS, LEADS } from '@/lib/crm/data';
import type { Payment, PaymentStatus, PaymentMethod } from '@/lib/crm/types';
import { PaymentDrawer } from './PaymentDrawer';
import { PaymentTableRow } from './PaymentTableRow';

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' },
];

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'upi', label: 'UPI' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
];

export function PaymentsView() {
  const { activeRole, currentUserId, can } = useCRMRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<PaymentStatus[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'created'>('dueDate');

  // ─── Data filtering & search ───────────────────────────────────────────────

  const filteredPayments = useMemo(() => {
    // Base: role-filtered payments
    let base = can('payments.view_all')
      ? PAYMENTS
      : activeRole === 'support_agent'
      ? PAYMENTS.filter((p) => {
          const lead = LEADS.find((l) => l.id === p.leadId);
          return lead?.status === 'enrolled' && lead?.assignedTo === currentUserId;
        })
      : PAYMENTS.filter((p) => {
          const lead = LEADS.find((l) => l.id === p.leadId);
          return lead?.assignedTo === currentUserId;
        });

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((p) => {
        const lead = LEADS.find((l) => l.id === p.leadId);
        return (
          lead?.name.toLowerCase().includes(q) ||
          lead?.email.toLowerCase().includes(q) ||
          lead?.phone.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      base = base.filter((p) => selectedStatuses.includes(p.status));
    }

    // Payment method filter
    if (selectedMethods.length > 0) {
      base = base.filter((p) => selectedMethods.includes(p.method));
    }

    // Sorting
    base.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return (
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      } else if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      } else {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
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

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const paidAmount = filteredPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingAmount = filteredPayments
    .filter((p) => ['pending', 'partially_paid'].includes(p.status))
    .reduce((sum, p) => sum + p.totalAmount, 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Payments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} · Total: ₹{(totalAmount / 100_000).toFixed(1)}L
          </p>
        </div>
        {can('payments.create') && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Payment
          </button>
        )}
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total
          </p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
            ₹{(totalAmount / 100_000).toFixed(1)}L
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Paid
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300 sm:text-2xl">
            ₹{(paidAmount / 100_000).toFixed(1)}L
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Pending
          </p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300 sm:text-2xl">
            ₹{(pendingAmount / 100_000).toFixed(1)}L
          </p>
        </div>
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">

        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by student name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">

          {/* Status filter */}
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-48 max-h-72 overflow-y-auto">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses([...selectedStatuses, opt.value]);
                      } else {
                        setSelectedStatuses(
                          selectedStatuses.filter((s) => s !== opt.value),
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

          {/* Payment method filter */}
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Method {selectedMethods.length > 0 && `(${selectedMethods.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-2 min-w-48 max-h-72 overflow-y-auto">
              {METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMethods([...selectedMethods, opt.value]);
                      } else {
                        setSelectedMethods(
                          selectedMethods.filter((m) => m !== opt.value),
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

          {/* Sort dropdown */}
          <div className="relative group ml-auto">
            <button className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
              Sort:{' '}
              {sortBy === 'dueDate'
                ? 'Due Date'
                : sortBy === 'amount'
                ? 'Amount'
                : 'Created'}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg z-10 p-1 min-w-40">
              {[
                { value: 'dueDate' as const, label: 'Due Date' },
                { value: 'amount' as const, label: 'Amount (High to Low)' },
                { value: 'created' as const, label: 'Recently Created' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary/10 text-primary font-medium'
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

      {/* ── Payments Table ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <p className="text-base font-medium text-foreground">
              No payments found
            </p>
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

      {/* ── Payment Detail Drawer ───────────────────────────────────────────── */}
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