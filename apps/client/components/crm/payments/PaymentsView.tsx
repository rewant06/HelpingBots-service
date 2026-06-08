'use client';

import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, PAYMENTS, PAYMENT_TRANSACTIONS } from '@/lib/crm/data';
import type { Payment, PaymentMethod, PaymentStatus } from '@/lib/crm/types';
import { PaymentDrawer }      from './PaymentDrawer';
import { PaymentTableRow }    from './PaymentTableRow';
import { CreatePaymentModal } from './CreatePaymentModal';
import {
  FilterDropdown,
  FilterOption,
  SortDropdown,
} from '@/components/crm/shared/FilterDropdown';

// ─── Filter / sort options ────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending',        label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid',           label: 'Paid' },
  { value: 'overdue',        label: 'Overdue' },
];

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card',          label: 'Card' },
  { value: 'cash',          label: 'Cash' },
  { value: 'cheque',        label: 'Cheque' },
];

const SORT_OPTIONS: { value: 'dueDate' | 'amount' | 'created'; label: string }[] = [
  { value: 'dueDate',  label: 'Due Date' },
  { value: 'amount',   label: 'Amount (High–Low)' },
  { value: 'created',  label: 'Recently Created' },
];

function fmt(amount: number) {
  return `₹${(amount / 100_000).toFixed(1)}L`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentsView() {
  const { activeRole, currentUserId, can } = useCRMRole();

  // ── Locally created payments ──────────────────────────────────────────────
  const [createdPayments, setCreatedPayments] = useState<Payment[]>([]);

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedStatuses,  setSelectedStatuses]  = useState<PaymentStatus[]>([]);
  const [selectedMethods,   setSelectedMethods]   = useState<PaymentMethod[]>([]);
  const [sortBy,            setSortBy]            = useState<'dueDate' | 'amount' | 'created'>('dueDate');

  // ── Drawer / modal state ──────────────────────────────────────────────────
  const [selectedPayment,  setSelectedPayment]  = useState<Payment | null>(null);
  const [showCreateModal,  setShowCreateModal]  = useState(false);

  // ── Filtered + sorted payments ────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    const allPayments = [...createdPayments, ...PAYMENTS];

    let base = can('payments.view_all')
      ? allPayments
      : activeRole === 'support_agent'
      ? allPayments.filter((p) => {
          const lead = LEADS.find((l) => l.id === p.leadId);
          return lead?.status === 'enrolled' && lead?.assignedTo === currentUserId;
        })
      : allPayments.filter((p) => {
          const lead = LEADS.find((l) => l.id === p.leadId);
          return lead?.assignedTo === currentUserId;
        });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (p) =>
          p.leadName.toLowerCase().includes(q) ||
          p.program.toLowerCase().includes(q) ||
          (p.invoiceNumber ?? '').toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length > 0)
      base = base.filter((p) => selectedStatuses.includes(p.status));

    if (selectedMethods.length > 0) {
      base = base.filter((p) => {
        const methods = PAYMENT_TRANSACTIONS
          .filter((t) => t.paymentId === p.id)
          .map((t) => t.method);
        return methods.some((m) => selectedMethods.includes(m));
      });
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'amount')  return b.totalAmount - a.totalAmount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [createdPayments, activeRole, currentUserId, can, searchQuery, selectedStatuses, selectedMethods, sortBy]);

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const totalAmount   = filteredPayments.reduce((s, p) => s + p.totalAmount, 0);
  const paidAmount    = filteredPayments.reduce((s, p) => s + p.paidAmount, 0);
  const pendingAmount = filteredPayments.reduce((s, p) => s + Math.max(0, p.totalAmount - p.paidAmount), 0);
  const overdueCount  = filteredPayments.filter((p) => p.status === 'overdue').length;

  const toggleStatus = (v: PaymentStatus) =>
    setSelectedStatuses((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleMethod = (v: PaymentMethod) =>
    setSelectedMethods((p)  => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const hasActiveFilters = selectedStatuses.length > 0 || selectedMethods.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''}
            {' · '}Total: {fmt(totalAmount)}
            {overdueCount > 0 && (
              <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                · {overdueCount} overdue
              </span>
            )}
          </p>
        </div>

        {can('payments.edit') && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Payment
          </button>
        )}
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{fmt(totalAmount)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Collected
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300 sm:text-2xl">
            {fmt(paidAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300 sm:text-2xl">
            {fmt(pendingAmount)}
          </p>
        </div>
      </div>

      {/* Collection progress bar */}
      {totalAmount > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Overall Collection Progress</p>
            <p className="text-xs font-semibold text-foreground">
              {Math.round((paidAmount / totalAmount) * 100)}%
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by student, program, invoice…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters — click-based, mobile-friendly */}
        <div className="flex flex-wrap items-center gap-2">

          <FilterDropdown label="Status" count={selectedStatuses.length}>
            {STATUS_OPTIONS.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                checked={selectedStatuses.includes(opt.value)}
                onChange={() => toggleStatus(opt.value)}
              />
            ))}
          </FilterDropdown>

          <FilterDropdown label="Method" count={selectedMethods.length}>
            {METHOD_OPTIONS.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                checked={selectedMethods.includes(opt.value)}
                onChange={() => toggleMethod(opt.value)}
              />
            ))}
          </FilterDropdown>

          <SortDropdown
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            className="ml-auto"
          />
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {selectedStatuses.map((s) => (
              <button key={s} type="button" onClick={() => toggleStatus(s)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {s.replace(/_/g, ' ')} ×
              </button>
            ))}
            {selectedMethods.map((m) => (
              <button key={m} type="button" onClick={() => toggleMethod(m)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {m.replace(/_/g, ' ')} ×
              </button>
            ))}
            <button type="button"
              onClick={() => { setSelectedStatuses([]); setSelectedMethods([]); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Payments table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <p className="text-base font-medium text-foreground">No payments found</p>
            <p className="text-sm text-muted-foreground">
              {can('payments.edit')
                ? 'Create a payment record with the button above.'
                : 'Try adjusting your filters.'}
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

      {/* ── Drawers / Modals ─────────────────────────────────────────────── */}
      {selectedPayment && (
        <PaymentDrawer
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdate={(updated) => setSelectedPayment(updated)}
        />
      )}

      <CreatePaymentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(payment) => {
          setCreatedPayments((prev) => [payment, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}