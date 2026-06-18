

import { memo } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/crm/types';
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
} from '@/lib/crm/lead-meta';

// ─── Source display ────────────────────────────────────────────────────────────
// Kept local — only LeadCard needs this mapping.
const SOURCE_EMOJI: Partial<Record<string, string>> = {
  google_ads:     '🔍',
  social_media:   '📱',
  referral:       '🤝',
  website:        '🌐',
  email_campaign: '📧',
  whatsapp:       '💬',
  walk_in:        '🚶',
  event:          '📅',
  phone:          '📞',
  other:          '📋',
};

// ─── Avatar colour — deterministic, based on first char ─────────────────────
const AVATAR_COLOURS = [
  'bg-blue-100    text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  'bg-violet-100  text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100   text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  'bg-rose-100    text-rose-700   dark:bg-rose-900/40   dark:text-rose-300',
  'bg-teal-100    text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
] as const;

function avatarColour(name: string): string {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLOURS.length;
  return AVATAR_COLOURS[idx];
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const LeadCard = memo(function LeadCard({
  lead,
  onClick,
  showCheckbox = false,
  selected = false,
  onSelect,
}: LeadCardProps) {
  const initials = lead.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const phoneHref = lead.mobile ? `tel:${lead.mobile}` : undefined;
  const sourceEmoji = SOURCE_EMOJI[lead.source] ?? '📋';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open lead ${lead.name}`}
      className={cn(
        'flex cursor-pointer flex-col gap-3 border-b border-border px-4 py-3.5',
        'transition-colors active:bg-primary/5',
        selected ? 'bg-primary/5' : 'bg-background hover:bg-muted/40',
      )}
    >
      {/* ── Row 1: checkbox + avatar + name + status ─────────────────────────── */}
      <div className="flex items-center gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onSelect?.(); }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 shrink-0 cursor-pointer rounded"
            aria-label={`Select ${lead.name}`}
          />
        )}

        {/* Avatar */}
        <div
          aria-hidden="true"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            avatarColour(lead.name),
          )}
        >
          {initials}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
        </div>

        {/* Status badge — ALWAYS visible (was hidden until lg: in table) */}
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
            STATUS_BADGE[lead.status],
          )}
        >
          {STATUS_LABEL[lead.status]}
        </span>
      </div>

      {/* ── Row 2: program ───────────────────────────────────────────────────── */}
      <p className="truncate text-sm text-muted-foreground">{lead.program}</p>

      {/* ── Row 3: assigned rep + phone ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Assigned rep — ALWAYS visible (was hidden until xl: in table) */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground"
          >
            {lead.assignedToName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <p className="truncate text-xs text-muted-foreground">{lead.assignedToName}</p>
        </div>

        {/* Phone — tappable, stops propagation so card doesn't open drawer */}
        {phoneHref && (
          <a
            href={phoneHref}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${lead.name}`}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-primary transition-colors active:bg-primary/10"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            {lead.mobile}
          </a>
        )}
      </div>

      {/* ── Row 4: source + priority ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {sourceEmoji}{' '}
          {lead.source.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>

        <span className="text-muted-foreground">·</span>

        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            PRIORITY_BADGE[lead.priority],
          )}
        >
          {PRIORITY_LABEL[lead.priority]}
        </span>

        {lead.generatedByName && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="truncate text-[10px] text-muted-foreground">
              via {lead.generatedByName}
            </span>
          </>
        )}
      </div>
    </div>
  );
});