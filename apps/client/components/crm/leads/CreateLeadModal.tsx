'use client';

import { useState, useMemo } from 'react';
import { X, User, Phone, Mail, BookOpen, Building2, Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMRole } from '@/lib/crm/role-context';
import { TEAM_MEMBERS } from '@/lib/crm/data';
import type { Lead, LeadPriority, LeadSource, LeadStatus } from '@/lib/crm/types';

// ─── Static Options ───────────────────────────────────────────────────────────

const PROGRAMS = [
  'MBA', 'PGDM', 'BBA',
  'B.Tech (Computer Science)', 'B.Tech (Data Science)', 'B.Tech (AI & ML)',
  'M.Tech (Artificial Intelligence)', 'M.Tech (Data Science)',
  'MCA', 'BCA', 'B.Sc IT',
  'B.Com', 'M.Com',
  'BA LLB', 'LLM',
  'MBBS', 'MD',
  'Other',
];

const DEGREE_OPTIONS = ['Undergraduate', 'Postgraduate', 'Diploma', 'Doctoral'];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'website',        label: 'Website' },
  { value: 'google_ads',     label: 'Google Ads' },
  { value: 'referral',       label: 'Referral' },
  { value: 'social_media',   label: 'Social Media' },
  { value: 'whatsapp',       label: 'WhatsApp' },
  { value: 'walk_in',        label: 'Walk-in' },
  { value: 'event',          label: 'Event / Expo' },
  { value: 'phone',          label: 'Inbound Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'other',          label: 'Other' },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string; dot: string }[] = [
  { value: 'high',   label: 'High',   dot: 'bg-red-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-slate-400' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

type FormErrors = Partial<Record<keyof typeof INITIAL_STATE, string>>;

const INITIAL_STATE = {
  name:       '',
  mobile:     '',
  email:      '',
  program:    '',
  degree:     'Undergraduate',
  college:    '',
  source:     'website' as LeadSource,
  priority:   'medium' as LeadPriority,
  assignedTo: '',
  notes:      '',
};

export function CreateLeadModal({ open, onClose, onCreated }: CreateLeadModalProps) {
  const { can, currentUserId, activeRole } = useCRMRole();

  const [form,   setForm]   = useState({ ...INITIAL_STATE, assignedTo: currentUserId });
  const [errors, setErrors] = useState<FormErrors>({});

  const assignableMembers = useMemo(
    () =>
      can('leads.assign')
        ? TEAM_MEMBERS.filter(
            (m) =>
              m.status === 'active' &&
              ['sales_executive', 'support_agent', 'team_lead'].includes(m.role),
          )
        : TEAM_MEMBERS.filter((m) => m.id === currentUserId),
    [can, currentUserId],
  );

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim())    errs.name    = 'Name is required';
    if (!form.mobile.trim())  errs.mobile  = 'Mobile is required';
    if (!/^\+?[\d\s\-]{8,}$/.test(form.mobile.trim()))
                              errs.mobile  = 'Enter a valid mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              errs.email   = 'Enter a valid email';
    if (!form.program.trim()) errs.program = 'Program is required';
    if (!form.college.trim()) errs.college = 'College is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const member = TEAM_MEMBERS.find((m) => m.id === form.assignedTo);
    const now    = new Date().toISOString();

    const lead: Lead = {
      id:             `lead-new-${Date.now()}`,
      name:           form.name.trim(),
      mobile:         form.mobile.trim(),
      email:          form.email.trim(),
      program:        form.program,
      degree:         form.degree,
      college:        form.college.trim(),
      source:         form.source,
      status:         'new' as LeadStatus,
      priority:       form.priority,
      assignedTo:     form.assignedTo,
      assignedToName: member?.name ?? '',
      nextFollowUp:   null,
      notes:          form.notes.trim() || undefined,
      createdAt:      now,
      updatedAt:      now,
    };

    onCreated(lead);
    setForm({ ...INITIAL_STATE, assignedTo: currentUserId });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm({ ...INITIAL_STATE, assignedTo: currentUserId });
    setErrors({});
    onClose();
  };

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
        aria-label="Add New Lead"
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
            <h2 className="text-lg font-semibold text-foreground">New Lead</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Add a lead to the admissions pipeline</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto overscroll-contain px-5 py-5 space-y-4">

          {/* Name + Mobile */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" required error={errors.name}>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ananya Sharma"
                  className={cn(
                    'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                    errors.name
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                  )}
                />
              </div>
            </Field>

            <Field label="Mobile" required error={errors.mobile}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={cn(
                    'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                    errors.mobile
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                  )}
                />
              </div>
            </Field>
          </div>

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ananya.sharma@gmail.com"
                className={cn(
                  'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                  errors.email
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                )}
              />
            </div>
          </Field>

          {/* Program + Degree */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Program / Course" required error={errors.program}>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <select
                  value={form.program}
                  onChange={(e) => set('program', e.target.value)}
                  className={cn(
                    'w-full appearance-none rounded-xl border bg-background py-2.5 pl-9 pr-8 text-sm focus:outline-none',
                    errors.program
                      ? 'border-red-400'
                      : 'border-border focus:border-primary',
                    !form.program && 'text-muted-foreground',
                  )}
                >
                  <option value="" disabled>Select program</option>
                  {PROGRAMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              </div>
            </Field>

            <Field label="Level">
              <select
                value={form.degree}
                onChange={(e) => set('degree', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* College */}
          <Field label="College / Institution" required error={errors.college}>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={form.college}
                onChange={(e) => set('college', e.target.value)}
                placeholder="VIT University, Vellore"
                className={cn(
                  'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2',
                  errors.college
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                )}
              />
            </div>
          </Field>

          {/* Source + Priority */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lead Source">
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value as LeadSource)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('priority', opt.value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-all active:scale-95',
                      form.priority === opt.value
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', opt.dot)} aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Assignee */}
          <Field label="Assign To">
            <select
              value={form.assignedTo}
              onChange={(e) => set('assignedTo', e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              {assignableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </Field>

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any initial context about this lead…"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
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
            Add Lead
          </button>
        </div>
      </div>
    </>
  );
}