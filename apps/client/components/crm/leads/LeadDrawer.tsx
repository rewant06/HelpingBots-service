'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEAD_ACTIVITIES } from '@/lib/crm/data';
import type { ActivityType, Lead } from '@/lib/crm/types';
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
} from '@/lib/crm/lead-meta';
import type { LucideIcon } from 'lucide-react';

// ─── Activity icon map — drawer-specific, not shared globally ─────────────────
const ACTIVITY_ICON: Partial<Record<ActivityType, LucideIcon>> = {
  note_added:        MessageSquare,
  status_change:     CheckCircle2,
  task_created:      Clock,
  task_completed:    CheckCircle2,
  call_made:         Phone,
  email_sent:        Mail,
  payment_update:    CheckCircle2,
  assignment_change: User,
  document_uploaded: Clock,
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface LeadDrawerProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function LeadDrawer({ lead, onClose, onUpdate }: LeadDrawerProps) {
  const { can } = useCRMRole();

  const leadActivities = useMemo(
    () =>
      LEAD_ACTIVITIES.filter((a) => a.leadId === lead.id).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [lead.id],
  );

  const canEditLead = can('leads.edit_own') || can('leads.edit_all');

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Close lead drawer"
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />

      {/* ── Drawer panel ───────────────────────────────────────────────────── */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-md">

        {/* Sticky header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">{lead.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.program}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-4 sm:p-6">

          {/* ── Status + Priority ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              {/* FIX: was {lead.status} — raw enum text like "follow_up" */}
              <span
                className={cn(
                  'mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-medium',
                  STATUS_BADGE[lead.status],
                )}
              >
                {STATUS_LABEL[lead.status]}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Priority
              </p>
              {/* FIX: was {lead.priority} — raw enum text like "medium" */}
              <span
                className={cn(
                  'mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-medium',
                  PRIORITY_BADGE[lead.priority],
                )}
              >
                {PRIORITY_LABEL[lead.priority]}
              </span>
            </div>
          </div>

          {/* ── Contact ───────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-primary hover:underline"
              >
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a
                href={`tel:${lead.mobile}`}
                className="text-sm text-primary hover:underline"
              >
                {lead.mobile}
              </a>
            </div>
          </div>

          {/* ── Lead details ──────────────────────────────────────────────── */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Source</span>
              <span className="font-medium capitalize text-foreground">
                {lead.source.replaceAll('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Assigned To</span>
              <span className="font-medium text-foreground">{lead.assignedToName}</span>
            </div>

            {/* ADD: Generated By — visible when lead was sourced by marketing */}
            {lead.generatedByName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generated By</span>
                <span className="font-medium text-foreground">{lead.generatedByName}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium text-foreground">
                {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  '2-digit',
                })}
              </span>
            </div>

            {lead.college && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">College</span>
                <span className="max-w-[55%] text-right font-medium text-foreground">
                  {lead.college}
                </span>
              </div>
            )}
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-2">
            {canEditLead && (
              <button
                type="button"
                onClick={() => onUpdate(lead)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Edit Lead
              </button>
            )}
            {can('tasks.create') && (
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Task
              </button>
            )}
          </div>

          {/* ── Activity timeline ─────────────────────────────────────────── */}
          <div>
            <h4 className="mb-3 font-semibold text-foreground">Activity Timeline</h4>

            <div className="space-y-3">
              {leadActivities.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No activities yet
                </p>
              ) : (
                leadActivities.map((activity) => {
                  const Icon = ACTIVITY_ICON[activity.type] ?? MessageSquare;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.description ?? activity.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('en-IN', {
                            day:    'numeric',
                            month:  'short',
                            year:   '2-digit',
                            hour:   '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}