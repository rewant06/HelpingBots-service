

import type {
  DashboardPeriod,
  LeadStatus,
  MetricFormat,
  TaskPriority,
  TaskType,
} from '@/lib/crm/types';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  FileText,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';

// ─── Anchor date ──────────────────────────────────────────────────────────────
// Fixed so period filters produce consistent results in the demo.

export const DEMO_NOW = new Date('2026-06-08T12:00:00Z');

// ─── Period config ────────────────────────────────────────────────────────────

export const PRIMARY_PERIODS: DashboardPeriod[] = ['today', 'week', 'month'];
export const MORE_PERIODS: DashboardPeriod[]    = ['quarter', 'year'];

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today:   'Today',
  week:    'This Week',
  month:   'This Month',
  quarter: 'This Quarter',
  year:    'This Year',
};

export const PERIOD_TARGETS: Record<
  DashboardPeriod,
  { marketing: number; sales: number; revenue: number }
> = {
  today:   { marketing: 5,   sales: 1,   revenue: 500_000    },
  week:    { marketing: 20,  sales: 5,   revenue: 2_000_000  },
  month:   { marketing: 80,  sales: 20,  revenue: 8_000_000  },
  quarter: { marketing: 240, sales: 60,  revenue: 24_000_000 },
  year:    { marketing: 960, sales: 240, revenue: 96_000_000 },
};

// ─── Lead source config ───────────────────────────────────────────────────────

export const MARKETING_SOURCES = new Set([
  'google_ads',
  'social_media',
  'email_campaign',
  'event',
]);

export const SOURCE_META: Record<string, { label: string; emoji: string }> = {
  google_ads:     { label: 'Google Ads',     emoji: '🔍' },
  social_media:   { label: 'Social Media',   emoji: '📱' },
  referral:       { label: 'Referral',        emoji: '🤝' },
  event:          { label: 'Events / Expos', emoji: '📅' },
  website:        { label: 'Website',         emoji: '🌐' },
  email_campaign: { label: 'Email Campaign', emoji: '📧' },
  whatsapp:       { label: 'WhatsApp',        emoji: '💬' },
  walk_in:        { label: 'Walk-in',         emoji: '🚶' },
};

// ─── Status display config ────────────────────────────────────────────────────

export const STATUS_BADGE: Record<LeadStatus, string> = {
  new:                   'bg-slate-100    text-slate-700  dark:bg-slate-800/60    dark:text-slate-300',
  contacted:             'bg-blue-100     text-blue-700   dark:bg-blue-900/40     dark:text-blue-300',
  interested:            'bg-amber-100    text-amber-700  dark:bg-amber-900/40    dark:text-amber-300',
  follow_up:             'bg-orange-100   text-orange-700 dark:bg-orange-900/40   dark:text-orange-300',
  application_started:   'bg-violet-100   text-violet-700 dark:bg-violet-900/40   dark:text-violet-300',
  application_submitted: 'bg-indigo-100   text-indigo-700 dark:bg-indigo-900/40   dark:text-indigo-300',
  admission_confirmed:   'bg-teal-100     text-teal-700   dark:bg-teal-900/40     dark:text-teal-300',
  enrolled:              'bg-emerald-100  text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost:                  'bg-red-100      text-red-700    dark:bg-red-900/40      dark:text-red-300',
  on_hold:               'bg-gray-100     text-gray-600   dark:bg-gray-800/60     dark:text-gray-400',
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new:                   'New',
  contacted:             'Contacted',
  interested:            'Interested',
  follow_up:             'Follow-up',
  application_started:   'App Started',
  application_submitted: 'Submitted',
  admission_confirmed:   'Confirmed',
  enrolled:              'Enrolled',
  lost:                  'Lost',
  on_hold:               'On Hold',
};

// ─── Task display config ──────────────────────────────────────────────────────

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

export const TASK_ICON: Partial<Record<TaskType, LucideIcon>> = {
  call:     Phone,
  email:    Mail,
  whatsapp: MessageCircle,
  meeting:  CalendarDays,
  document: FileText,
};

// ─── Pure functions ───────────────────────────────────────────────────────────

export function fmtValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
      if (value >= 1_000)     return `₹${(value / 1_000).toFixed(0)}K`;
      return `₹${value}`;
    case 'percentage': return `${value}%`;
    case 'duration':   return `${value}h`;
    default:           return value.toLocaleString('en-IN');
  }
}

export function fmtCurrency(n: number): string {
  if (n === 0)       return '₹0';
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${(n / 1_000).toFixed(0)}K`;
}

export function fmtDue(isoStr: string): { label: string; late: boolean } {
  const diffMs = new Date(isoStr).getTime() - Date.now();
  const days   = Math.floor(Math.abs(diffMs) / 86_400_000);
  if (diffMs < 0) return { label: `${days + 1}d overdue`, late: true  };
  if (days === 0) return { label: 'Due today',            late: false };
  if (days === 1) return { label: 'Due tomorrow',         late: false };
  return              { label: `Due in ${days}d`,         late: false };
}

export function getStartDate(period: DashboardPeriod): Date {
  const d = new Date(DEMO_NOW);
  switch (period) {
    case 'today':
      d.setUTCHours(0, 0, 0, 0);
      break;
    case 'week':
      d.setDate(DEMO_NOW.getDate() - 7);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setUTCDate(1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case 'quarter': {
      const qm = Math.floor(DEMO_NOW.getUTCMonth() / 3) * 3;
      d.setUTCMonth(qm, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    }
    case 'year':
      d.setUTCMonth(0, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
  }
  return d;
}

export function filterByPeriod<T extends { createdAt: string }>(
  items: T[],
  period: DashboardPeriod,
): T[] {
  const start = getStartDate(period);
  return items.filter((item) => new Date(item.createdAt) >= start);
}