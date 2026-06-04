'use client';

import { useMemo } from 'react';
import { X, MapPin, Mail, Phone, Calendar, User, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEAD_ACTIVITIES } from '@/lib/crm/data';
import type { Lead } from '@/lib/crm/types';

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-amber-100 text-amber-700',
  follow_up: 'bg-orange-100 text-orange-700',
  application_started: 'bg-violet-100 text-violet-700',
  application_submitted: 'bg-indigo-100 text-indigo-700',
  admission_confirmed: 'bg-teal-100 text-teal-700',
  enrolled: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  on_hold: 'bg-gray-100 text-gray-600',
};

const ACTIVITY_ICON: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  status_change: CheckCircle2,
  activity: Clock,
};

interface LeadDrawerProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

export function LeadDrawer({ lead, onClose, onUpdate }: LeadDrawerProps) {
  const { can } = useCRMRole();

  const leadActivities = useMemo(
    () => LEAD_ACTIVITIES.filter((a) => a.leadId === lead.id).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [lead.id],
  );

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

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl animate-slide-in-right sm:max-w-md">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{lead.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{lead.program}</p>
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
        <div className="p-4 sm:p-6 space-y-6">

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
              <p className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[lead.status]}`}>
                {lead.status}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</p>
              <p className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                lead.priority === 'high' ? 'bg-red-100 text-red-700' :
                lead.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {lead.priority}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <a href={`mailto:${lead.email}`} className="text-sm text-primary hover:underline">
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <a href={`tel:${lead.phone}`} className="text-sm text-primary hover:underline">
                {lead.phone}
              </a>
            </div>
            {lead.city && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-foreground">{lead.city}, {lead.state}</span>
              </div>
            )}
          </div>

          {/* Key Info Grid */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Source</span>
              <span className="font-medium text-foreground capitalize">{lead.source.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Assigned To</span>
              <span className="font-medium text-foreground">{lead.assignedToName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium text-foreground">
                {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {can('leads.edit') && (
              <button className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Edit Lead
              </button>
            )}
            {can('tasks.create') && (
              <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Create Task
              </button>
            )}
          </div>

          {/* Activities */}
          <div>
            <h4 className="mb-3 font-semibold text-foreground">Activity Timeline</h4>
            <div className="space-y-3">
              {leadActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
              ) : (
                leadActivities.map((activity) => {
                  const Icon = ACTIVITY_ICON[activity.type] || MessageSquare;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
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