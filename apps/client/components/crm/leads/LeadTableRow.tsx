import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/crm/types';
import { STATUS_BADGE, STATUS_LABEL } from '@/lib/crm/lead-meta';

interface LeadTableRowProps {
  lead: Lead;
  onClick: () => void;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const LeadTableRow = memo(function LeadTableRow({
  lead,
  onClick,
  showCheckbox = false,
  selected = false,
  onSelect,
}: LeadTableRowProps) {
  const initials =
    lead.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const phoneHref = lead.mobile ? `tel:${lead.mobile}` : '#';

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/40',
        selected && 'bg-primary/5',
      )}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open lead ${lead.name}`}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <td className="w-10 px-4 py-3 sm:px-5">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onSelect?.(); }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer rounded"
            aria-label={`Select ${lead.name}`}
          />
        </td>
      )}

      {/* Name + email — always visible */}
      <td className="px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{lead.name}</p>
            <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
          </div>
        </div>
      </td>

      {/* Program — visible from sm: (640px+) */}
      <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell sm:px-5">
        <span className="truncate">{lead.program}</span>
      </td>

      {/* Status — was hidden until lg: (1024px). Now visible in the table
          from the moment the table renders (md: / 768px). The card already
          shows status on narrower screens, so nothing is lost. */}
      <td className="px-4 py-3 sm:px-5">
        <span
          className={cn(
            'inline-block rounded-full px-2.5 py-1 text-xs font-medium',
            STATUS_BADGE[lead.status],
          )}
        >
          {STATUS_LABEL[lead.status]}
        </span>
      </td>

      {/* Assigned To — was hidden until xl: (1280px). Now lg: (1024px). */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell lg:px-5">
        {lead.assignedToName}
      </td>

      {/* Phone — always visible */}
      <td className="px-4 py-3 sm:px-5">
        <a
          href={phoneHref}
          className="truncate text-xs font-medium text-primary hover:underline sm:text-sm"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Call ${lead.name}`}
        >
          {lead.mobile}
        </a>
      </td>
    </tr>
  );
});