'use client';

import type { Lead } from '@/lib/crm/types';

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interested: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  follow_up: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  application_started: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  application_submitted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  admission_confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  enrolled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  on_hold: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  follow_up: 'Follow-up',
  application_started: 'App Started',
  application_submitted: 'Submitted',
  admission_confirmed: 'Confirmed',
  enrolled: 'Enrolled',
  lost: 'Lost',
  on_hold: 'On Hold',
};

interface LeadTableRowProps {
  lead: Lead;
  onClick: () => void;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function LeadTableRow({
  lead,
  onClick,
  showCheckbox = false,
  selected = false,
  onSelect,
}: LeadTableRowProps) {
  const initials =
    lead.name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  // ✅ Fixed: use lead.mobile (not lead.phone) — matches your Lead type
  const phoneLink = lead.mobile ? `tel:${lead.mobile}` : '#';
  const statusBadge = STATUS_BADGE[lead.status] ?? STATUS_BADGE.new;
  const statusLabel = STATUS_LABEL[lead.status] ?? lead.status;

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-muted/40${selected ? ' bg-primary/5' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open lead ${lead.name}`}
    >
      {showCheckbox && (
        <td className="w-10 px-4 py-3 sm:px-5">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded cursor-pointer"
            aria-label={`Select lead ${lead.name}`}
          />
        </td>
      )}

      <td className="px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{lead.name}</p>
            <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
          </div>
        </div>
      </td>

      <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell sm:px-5">
        <span className="truncate">{lead.program}</span>
      </td>

      <td className="hidden px-4 py-3 lg:table-cell lg:px-5">
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge}`}>
          {statusLabel}
        </span>
      </td>

      <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell xl:px-5">
        {lead.assignedToName}
      </td>

      <td className="px-4 py-3 sm:px-5">
        <a
          href={phoneLink}
          className="truncate text-xs font-medium text-primary hover:underline sm:text-sm"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Call ${lead.name}`}
        >
          {lead.mobile}
        </a>
      </td>
    </tr>
  );
}