import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/crm/types';
import { STATUS_BADGE, STATUS_LABEL } from '../helpers';

interface LeadRowProps {
  lead: Lead;
}

export const LeadRow = memo(function LeadRow({ lead }: LeadRowProps) {
  const initials = lead.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
        <p className="truncate text-xs text-muted-foreground">{lead.program}</p>
      </div>

      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
          STATUS_BADGE[lead.status],
        )}
      >
        {STATUS_LABEL[lead.status]}
      </span>
    </div>
  );
});