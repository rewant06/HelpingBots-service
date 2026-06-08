'use client';

import { useMemo, useState } from 'react';
import { X, Search, IndianRupee, Calendar, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Lead, Payment, PaymentMethod } from '@/lib/crm/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT / IMPS)' },
  { value: 'card',          label: 'Debit / Credit Card' },
  { value: 'cash',          label: 'Cash' },
  { value: 'cheque',        label: 'Cheque / DD' },
];

// Leads eligible for payment — those who have confirmed or enrolled
const ELIGIBLE_STATUSES = new Set([
  'admission_confirmed',
  'enrolled',
  'application_submitted',
  'application_started',
  'interested',
]);

function Field({
  label,
  required,
  hint,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (payment: Payment) => void;
}

const STATUS_LABEL: Record<string, string> = {
  admission_confirmed: 'Confirmed',
  enrolled:            'Enrolled',
  application_submitted: 'Submitted',
  application_started:   'App Started',
  interested:          'Interested',
};

export function CreatePaymentModal({
  open,
  onClose,
  onCreated,
}: CreatePaymentModalProps) {
  const { can, currentUserId } = useCRMRole();

  const [leadSearch,    setLeadSearch]    = useState('');
  const [leadDropOpen,  setLeadDropOpen]  = useState(false);
  const [selectedLead,  setSelectedLead]  = useState<Lead | null>(null);

  const [totalAmount,   setTotalAmount]   = useState('');
  const [dueDate,       setDueDate]       = useState('');
  const [notes,         setNotes]         = useState('');
  const [assignedTo,    setAssignedTo]    = useState(currentUserId);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only show leads that are relevant for payment
  const eligibleLeads = useMemo(() => {
    const base = can('payments.view_all')
      ? LEADS.filter((l) => ELIGIBLE_STATUSES.has(l.status))
      : LEADS.filter(
          (l) => ELIGIBLE_STATUSES.has(l.status) && l.assignedTo === currentUserId,
        );
    const q = leadSearch.toLowerCase().trim();
    if (!q) return base.slice(0, 8);
    return base
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.program.toLowerCase().includes(q) ||
          l.mobile.includes(q),
      )
      .slice(0, 8);
  }, [leadSearch, can, currentUserId]);

  const assignableMembers = useMemo(
    () =>
      can('payments.view_all')
        ? TEAM_MEMBERS.filter(
            (m) =>
              m.status === 'active' &&
              ['support_agent', 'team_lead', 'admin', 'super_admin'].includes(m.role),
          )
        : TEAM_MEMBERS.filter((m) => m.id === currentUserId),
    [can, currentUserId],
  );

  const autoInvoice = useMemo(
    () => `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    [],
  );

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDropOpen(false);
    setLeadSearch('');
    setErrors((prev) => ({ ...prev, lead: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedLead)            errs.lead   = 'Select a student/lead';
    if (!totalAmount.trim() || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0)
                                  errs.amount = 'Enter a valid amount';
    if (!dueDate)                 errs.due    = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !selectedLead) return;
    const member = TEAM_MEMBERS.find((m) => m.id === assignedTo);
    const now    = new Date().toISOString();
    const amount = Math.round(Number(totalAmount) * 100) / 100;

    const payment: Payment = {
      id:             `pay-new-${Date.now()}`,
      leadId:         selectedLead.id,
      leadName:       selectedLead.name,
      program:        selectedLead.program,
      totalAmount:    amount,
      paidAmount:     0,
      dueAmount:      amount,
      status:         'pending',
      dueDate:        new Date(dueDate).toISOString(),
      invoiceNumber:  autoInvoice,
      assignedTo,
      assignedToName: member?.name ?? '',
      notes:          notes.trim() || undefined,
      createdAt:      now,
      updatedAt:      now,
    };

    onCreated(payment);
    reset();
    onClose();
  };

  const reset = () => {
    setSelectedLead(null);
    setLeadSearch('');
    setTotalAmount('');
    setDueDate('');
    setNotes('');
    setAssignedTo(currentUserId);
    setErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Payment Record"
        className={cn(
          'fixed z-50 bg-background shadow-2xl',
          'inset-x-0 bottom-0 rounded-t-2xl',
          'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-full sm:max-w-lg sm:rounded-2xl',
          'animate-in slide-in-from-bottom sm:zoom-in-95 duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">New Payment Record</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Log a fee payment for an enrolled student
            </p>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain px-5 py-5 space-y-4">

          {/* ── Student selector ─────────────────────────────────────────── */}
          <Field label="Student / Lead" required error={errors.lead}>
            {selectedLead ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {selectedLead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{selectedLead.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedLead.program}
                  </p>
                  <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {STATUS_LABEL[selectedLead.status] ?? selectedLead.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search enrolled / confirmed students…"
                  value={leadSearch}
                  onChange={(e) => { setLeadSearch(e.target.value); setLeadDropOpen(true); }}
                  onFocus={() => setLeadDropOpen(true)}
                  className={cn(
                    'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                    errors.lead
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                  )}
                />
                {leadDropOpen && eligibleLeads.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
                    {eligibleLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => selectLead(lead)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {lead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{lead.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{lead.program}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {leadDropOpen && eligibleLeads.length === 0 && leadSearch && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-muted-foreground shadow-xl">
                    No eligible students found. Only confirmed / enrolled leads appear here.
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Auto-filled program */}
          {selectedLead && (
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span className="font-medium text-foreground">Program: </span>
              <span className="text-muted-foreground">{selectedLead.program}</span>
            </div>
          )}

          {/* Total Amount */}
          <Field label="Total Fee Amount (₹)" required error={errors.amount}>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="1000"
                value={totalAmount}
                onChange={(e) => { setTotalAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                placeholder="420000"
                className={cn(
                  'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                  errors.amount
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                )}
              />
            </div>
            {totalAmount && !isNaN(Number(totalAmount)) && Number(totalAmount) > 0 && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                ₹{Number(totalAmount).toLocaleString('en-IN')}
                {Number(totalAmount) >= 100_000 &&
                  ` = ₹${(Number(totalAmount) / 100_000).toFixed(2)}L`}
              </p>
            )}
          </Field>

          {/* Due Date + Invoice */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Payment Due Date" required error={errors.due}>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, due: '' })); }}
                  className={cn(
                    'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none',
                    errors.due ? 'border-red-400' : 'border-border focus:border-primary',
                  )}
                />
              </div>
            </Field>

            <Field label="Invoice No." hint="auto-generated">
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={autoInvoice}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/40 py-2.5 pl-9 pr-3 text-sm text-muted-foreground"
                />
              </div>
            </Field>
          </div>

          {/* Assign To */}
          {can('payments.view_all') && (
            <Field label="Handled By">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Notes */}
          <Field label="Notes (optional)">
            <div className="relative">
              <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Instalment 1 of 2, student confirmed June 30 deadline"
                className="w-full resize-none rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Payment
          </button>
        </div>
      </div>
    </>
  );
}