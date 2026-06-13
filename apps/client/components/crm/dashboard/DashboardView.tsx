'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import {
  ANALYTICS,
  DASHBOARD_METRICS,
  LEADS,
  LEADERBOARD,
  PAYMENTS,
  TASKS,
  TEAM_MEMBERS,
} from '@/lib/crm/data';
import { ROLE_LABELS } from '@/lib/crm/permissions';
import { cn } from '@/lib/utils';
import type {
  DashboardMetric,
  DashboardPeriod,
  Lead,
  LeadStatus,
  MetricFormat,
  Task,
  TaskPriority,
  TaskType,
} from '@/lib/crm/types';
import { TrendChart } from '../../../app/crm/dashboard/TrendChart';

// ─── Module-level constants ───────────────────────────────────────────────────
// Declared outside the component so they are never recreated on re-render.

const DEMO_NOW = new Date('2026-06-08T12:00:00Z');

const PRIMARY_PERIODS: DashboardPeriod[] = ['today', 'week', 'month'];
const MORE_PERIODS: DashboardPeriod[] = ['quarter', 'year'];

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today:   'Today',
  week:    'This Week',
  month:   'This Month',
  quarter: 'This Quarter',
  year:    'This Year',
};

const PERIOD_TARGETS: Record<
  DashboardPeriod,
  { marketing: number; sales: number; revenue: number }
> = {
  today:   { marketing: 5,   sales: 1,   revenue: 500_000    },
  week:    { marketing: 20,  sales: 5,   revenue: 2_000_000  },
  month:   { marketing: 80,  sales: 20,  revenue: 8_000_000  },
  quarter: { marketing: 240, sales: 60,  revenue: 24_000_000 },
  year:    { marketing: 960, sales: 240, revenue: 96_000_000 },
};

const MARKETING_SOURCES = new Set([
  'google_ads',
  'social_media',
  'email_campaign',
  'event',
]);

const SOURCE_META: Record<string, { label: string; emoji: string }> = {
  google_ads:     { label: 'Google Ads',     emoji: '🔍' },
  social_media:   { label: 'Social Media',   emoji: '📱' },
  referral:       { label: 'Referral',        emoji: '🤝' },
  event:          { label: 'Events / Expos', emoji: '📅' },
  website:        { label: 'Website',         emoji: '🌐' },
  email_campaign: { label: 'Email Campaign', emoji: '📧' },
  whatsapp:       { label: 'WhatsApp',        emoji: '💬' },
  walk_in:        { label: 'Walk-in',         emoji: '🚶' },
};

const STATUS_BADGE: Record<LeadStatus, string> = {
  new:                   'bg-slate-100    text-slate-700  dark:bg-slate-800/60       dark:text-slate-300',
  contacted:             'bg-blue-100     text-blue-700   dark:bg-blue-900/40        dark:text-blue-300',
  interested:            'bg-amber-100    text-amber-700  dark:bg-amber-900/40       dark:text-amber-300',
  follow_up:             'bg-orange-100   text-orange-700 dark:bg-orange-900/40      dark:text-orange-300',
  application_started:   'bg-violet-100   text-violet-700 dark:bg-violet-900/40      dark:text-violet-300',
  application_submitted: 'bg-indigo-100   text-indigo-700 dark:bg-indigo-900/40      dark:text-indigo-300',
  admission_confirmed:   'bg-teal-100     text-teal-700   dark:bg-teal-900/40        dark:text-teal-300',
  enrolled:              'bg-emerald-100  text-emerald-700 dark:bg-emerald-900/40    dark:text-emerald-300',
  lost:                  'bg-red-100      text-red-700    dark:bg-red-900/40         dark:text-red-300',
  on_hold:               'bg-gray-100     text-gray-600   dark:bg-gray-800/60        dark:text-gray-400',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
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

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

const TASK_ICON: Partial<Record<TaskType, LucideIcon>> = {
  call:     Phone,
  email:    Mail,
  whatsapp: MessageCircle,
  meeting:  CalendarDays,
  document: FileText,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function fmtValue(value: number, format: MetricFormat): string {
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

function fmtCurrency(n: number): string {
  if (n === 0)       return '₹0';
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${(n / 1_000).toFixed(0)}K`;
}

function fmtDue(isoStr: string): { label: string; late: boolean } {
  const diffMs = new Date(isoStr).getTime() - Date.now();
  const days   = Math.floor(Math.abs(diffMs) / 86_400_000);
  if (diffMs < 0) return { label: `${days + 1}d overdue`, late: true };
  if (days === 0) return { label: 'Due today',            late: false };
  if (days === 1) return { label: 'Due tomorrow',         late: false };
  return              { label: `Due in ${days}d`,         late: false };
}

function getStartDate(period: DashboardPeriod): Date {
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

function filterByPeriod<T extends { createdAt: string }>(
  items: T[],
  period: DashboardPeriod,
): T[] {
  const start = getStartDate(period);
  return items.filter((item) => new Date(item.createdAt) >= start);
}

// ─── Sub-components (React.memo) ─────────────────────────────────────────────
// Each sub-component is memoized — it only re-renders when its own props change,
// not when period, moreOpen, or any other parent state changes.

interface MetricCardProps {
  metric: DashboardMetric;
}

const MetricCard = memo(function MetricCard({ metric }: MetricCardProps) {
  const { label, value, change, format } = metric;
  const isUp = change > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-foreground">
        {fmtValue(value, format)}
      </p>
      {change !== 0 && (
        <div
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
          )}
        >
          {isUp
            ? <TrendingUp  className="h-3 w-3" aria-hidden="true" />
            : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
          <span>{isUp ? '+' : ''}{change}%</span>
          <span className="hidden font-normal text-muted-foreground sm:inline">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

interface LeadRowProps {
  lead: Lead;
}

const LeadRow = memo(function LeadRow({ lead }: LeadRowProps) {
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

// ─────────────────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
}

const TaskRow = memo(function TaskRow({ task }: TaskRowProps) {
  const Icon  = TASK_ICON[task.type] ?? FileText;
  const due   = fmtDue(task.dueDate);
  const isLate = due.late || task.status === 'overdue';

  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-background',
            PRIORITY_DOT[task.priority],
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">{task.leadName}</p>
      </div>
      <span
        className={cn(
          'shrink-0 whitespace-nowrap text-xs font-medium',
          isLate ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
        )}
      >
        {due.label}
      </span>
    </div>
  );
});

// ─── DashboardView ────────────────────────────────────────────────────────────

export function DashboardView() {
  const {
    activeRole,
    currentUserId,
    currentUserName,
    can,
    isStudent,
  } = useCRMRole();
  const router = useRouter();

  // Period selector state — declared unconditionally (used only when team_lead)
  const [period,   setPeriod]   = useState<DashboardPeriod>('week');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Redirect students to their portal
  useEffect(() => {
    if (isStudent) router.replace('/crm/portal');
  }, [isStudent, router]);

  // Close the "More periods" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    function close(e: MouseEvent | TouchEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [moreOpen]);

  // ── Rendering flags ────────────────────────────────────────────────────────
  // Option A: only team_lead sees team boards
  const isTeamLead          = activeRole === 'team_lead';
  const showTrendChart      = can('analytics.view');        // admin + super_admin
  const showLeaderboardPreview = can('leaderboard.view');   // super_admin only

  // ── Derived data (all useMemo calls before any return) ────────────────────

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  // KPI metrics filtered by role
  const metrics = useMemo(
    () => DASHBOARD_METRICS.filter((m) => m.allowedRoles.includes(activeRole)),
    [activeRole],
  );

  // Team member grouping (used only for team_lead boards, computed unconditionally)
  const { marketingMembers, teamIds } = useMemo(() => {
    const marketing = TEAM_MEMBERS.filter((m) => m.role === 'marketing');
    const sales     = TEAM_MEMBERS.filter((m) =>
      ['sales_executive', 'support_agent'].includes(m.role),
    );
    return {
      marketingMembers: marketing,
      teamIds: new Set([...marketing, ...sales].map((m) => m.id)),
    };
  }, []);

  // Leads filtered by the selected period (team_lead only)
  const periodLeads = useMemo(
    () => (isTeamLead ? filterByPeriod(LEADS, period) : []),
    [isTeamLead, period],
  );

  // Team revenue aggregated from payments
  const teamRevenue = useMemo(() => {
    if (!isTeamLead) return { collected: 0, pending: 0 };
    return PAYMENTS.reduce(
      (acc, p) => {
        const lead = LEADS.find((l) => l.id === p.leadId);
        if (lead && teamIds.has(lead.assignedTo)) {
          return {
            collected: acc.collected + p.paidAmount,
            pending:   acc.pending   + (p.totalAmount - p.paidAmount),
          };
        }
        return acc;
      },
      { collected: 0, pending: 0 },
    );
  }, [isTeamLead, teamIds]);

  // Active pipeline leads (not enrolled/lost/on_hold) assigned to team
  const activeLeads = useMemo(
    () =>
      isTeamLead
        ? LEADS.filter(
            (l) =>
              !['enrolled', 'lost', 'on_hold'].includes(l.status) &&
              teamIds.has(l.assignedTo),
          ).length
        : 0,
    [isTeamLead, teamIds],
  );

  // Marketing member performance ranked by leads generated in selected period
  const marketingPerf = useMemo(() => {
    if (!isTeamLead) return [];
    return marketingMembers
      .map((member) => {
        // Use typed generatedBy field first; fall back to source attribution
        const byField  = LEADS.filter((l) => l.generatedBy === member.id);
        const bySource = LEADS.filter(
          (l) => !l.generatedBy && MARKETING_SOURCES.has(l.source),
        );
        const all       = byField.length > 0 ? byField : bySource;
        const inPeriod  = filterByPeriod(all, period);
        const enrolled  = all.filter((l) => l.status === 'enrolled').length;
        const convRate  = all.length > 0
          ? Math.round((enrolled / all.length) * 100) : 0;
        return { member, periodCount: inPeriod.length, totalCount: all.length, enrolled, convRate };
      })
      .sort((a, b) => b.periodCount - a.periodCount);
  }, [isTeamLead, period, marketingMembers]);

  // Map period to the closest leaderboard period available in data
  const lbPeriod: 'week' | 'month' =
    period === 'month' || period === 'quarter' || period === 'year'
      ? 'month'
      : 'week';

  // Sales leaderboard entries for the mapped period
  const salesPerf = useMemo(
    () =>
      isTeamLead
        ? LEADERBOARD.filter((e) => e.period === lbPeriod).sort(
            (a, b) => b.enrollments - a.enrollments,
          )
        : [],
    [isTeamLead, lbPeriod],
  );

  // Lead quality by source (all-time, team_lead only)
  const sourceQuality = useMemo(() => {
    if (!isTeamLead) return [];
    return Object.keys(SOURCE_META)
      .map((src) => {
        const srcLeads = LEADS.filter((l) => l.source === src);
        const enrolled = srcLeads.filter((l) => l.status === 'enrolled').length;
        const convRate = srcLeads.length > 0
          ? Math.round((enrolled / srcLeads.length) * 100) : 0;
        return { src, count: srcLeads.length, enrolled, convRate };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.convRate - a.convRate);
  }, [isTeamLead]);

  // Recent leads for standard view (sales/support/marketing/admin)
  const recentLeads = useMemo(() => {
    if (isTeamLead) return [];
    const base = can('leads.view_all')
      ? LEADS
      : LEADS.filter((l) => l.assignedTo === currentUserId);
    const filtered =
      activeRole === 'support_agent'
        ? base.filter((l) => l.status === 'enrolled')
        : base.filter((l) => !['enrolled', 'lost', 'on_hold'].includes(l.status));
    return filtered
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [isTeamLead, activeRole, currentUserId, can]);

  // Urgent tasks for standard view
  const urgentTasks = useMemo(() => {
    if (isTeamLead) return [];
    const base = can('tasks.view_all')
      ? TASKS
      : TASKS.filter((t) => t.assignedTo === currentUserId);
    return base
      .filter(
        (t) =>
          t.status === 'overdue' ||
          (t.status === 'pending' && new Date(t.dueDate) <= new Date()),
      )
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return  1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [isTeamLead, activeRole, currentUserId, can]);

  // Overdue task count for the header alert badge
  const overdueCount = useMemo(() => {
    if (isTeamLead) {
      return TASKS.filter(
        (t) => t.status === 'overdue' && teamIds.has(t.assignedTo),
      ).length;
    }
    return urgentTasks.filter((t) => t.status === 'overdue').length;
  }, [isTeamLead, teamIds, urgentTasks]);

  // ── Stable callbacks ───────────────────────────────────────────────────────

  const handleSetPeriod = useCallback((p: DashboardPeriod) => {
    setPeriod(p);
    setMoreOpen(false);
  }, []);

  const toggleMoreOpen = useCallback(() => setMoreOpen((v) => !v), []);

  // ── Guard: render nothing while student redirect fires ─────────────────────
  // This is the ONLY conditional return — placed after ALL hooks above.
  if (isStudent) return null;

  // ── Team board aggregates ──────────────────────────────────────────────────
  const targets         = PERIOD_TARGETS[period];
  const marketingActual = marketingPerf.reduce((s, m) => s + m.periodCount, 0);
  const salesActual     = salesPerf.reduce((s, e) => s + e.enrollments, 0);
  const bestSales       = salesPerf[0];
  const worstSales      = salesPerf.at(-1);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {greeting},{' '}
            <span className="text-primary">
              {currentUserName.split(' ')[0]}
            </span>{' '}
            👋
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ROLE_LABELS[activeRole]} ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day:     'numeric',
              month:   'long',
              year:    'numeric',
            })}
          </p>
        </div>

        {overdueCount > 0 && (
          <Link
            href="/crm/tasks"
            className="self-start inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {overdueCount} overdue task{overdueCount > 1 ? 's' : ''}
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TEAM LEAD VIEW
      ════════════════════════════════════════════════════════════════════════ */}
      {isTeamLead && (
        <>
          {/* ── Period selector ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Select period">
            {PRIMARY_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSetPeriod(p)}
                aria-pressed={period === p}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-background hover:bg-muted',
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}

            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={toggleMoreOpen}
                aria-haspopup="listbox"
                aria-expanded={moreOpen}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  MORE_PERIODS.includes(period)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-background hover:bg-muted',
                )}
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {MORE_PERIODS.includes(period) ? PERIOD_LABELS[period] : 'More'}
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform',
                    moreOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {moreOpen && (
                <div
                  role="listbox"
                  aria-label="More periods"
                  className="absolute left-0 top-full z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl"
                >
                  {MORE_PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="option"
                      aria-selected={period === p}
                      onClick={() => handleSetPeriod(p)}
                      className={cn(
                        'block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        period === p
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Team KPI cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              {
                label: 'Leads Generated',
                value: String(periodLeads.length),
                sub:   PERIOD_LABELS[period],
                icon:  Users,
                color: 'text-blue-500',
                vColor: 'text-foreground',
              },
              {
                label: 'Active Pipeline',
                value: String(activeLeads),
                sub:   'in progress',
                icon:  Target,
                color: 'text-amber-500',
                vColor: 'text-foreground',
              },
              {
                label: 'Revenue Collected',
                value: fmtCurrency(teamRevenue.collected),
                sub:   'all-time team',
                icon:  DollarSign,
                color: 'text-primary',
                vColor: 'text-primary',
              },
              {
                label: 'Revenue Pending',
                value: fmtCurrency(teamRevenue.pending),
                sub:   'needs follow-up',
                icon:  TrendingUp,
                color: 'text-amber-500',
                vColor: 'text-amber-600 dark:text-amber-400',
              },
            ] as const).map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-card p-3 sm:p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium leading-tight text-muted-foreground">
                      {card.label}
                    </p>
                    <Icon className={cn('h-4 w-4 shrink-0', card.color)} aria-hidden="true" />
                  </div>
                  <p className={cn('text-xl font-bold sm:text-2xl', card.vColor)}>
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* ── Team Target Progress ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Team Targets — {PERIOD_LABELS[period]}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Progress vs. targets for your team
                </p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                Set Target
              </button>
            </div>

            <div className="space-y-4">
              {([
                {
                  label:     '📣 Marketing — Lead Generation',
                  current:   marketingActual,
                  target:    targets.marketing,
                  bar:       'bg-amber-400',
                  unit:      'leads',
                  isRevenue: false,
                },
                {
                  label:     '🏆 Sales — Enrollments',
                  current:   salesActual,
                  target:    targets.sales,
                  bar:       'bg-primary',
                  unit:      'deals',
                  isRevenue: false,
                },
                {
                  label:     '💰 Revenue Collection',
                  current:   teamRevenue.collected,
                  target:    targets.revenue,
                  bar:       'bg-emerald-500',
                  unit:      '',
                  isRevenue: true,
                },
              ] as const).map((row) => {
                const pct = Math.min(
                  100,
                  row.target > 0
                    ? Math.round((row.current / row.target) * 100)
                    : 0,
                );
                return (
                  <div key={row.label}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {row.label}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-foreground">
                        {row.isRevenue
                          ? `${fmtCurrency(row.current)} / ${fmtCurrency(row.target)}`
                          : `${row.current} / ${row.target} ${row.unit}`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full transition-all duration-500', row.bar)}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {pct}% achieved
                      {pct >= 100 && ' 🎉 Target met!'}
                      {pct >= 80 && pct < 100 && ' — Almost there!'}
                      {pct > 0 && pct < 50 && ' — Needs attention'}
                      {pct === 0 && ' — Not started'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Marketing Board + Sales Leaderboard ─────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* Marketing Board */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">📣 Marketing Board</h3>
                  <p className="text-xs text-muted-foreground">
                    Lead generation · {PERIOD_LABELS[period]}
                  </p>
                </div>
                <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
              </div>

              {marketingPerf.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No marketing members in your team.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {marketingPerf.map((stat, idx) => {
                      const max = Math.max(
                        ...marketingPerf.map((s) => s.periodCount),
                        1,
                      );
                      const pct = (stat.periodCount / max) * 100;
                      return (
                        <li key={stat.member.id} className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="w-6 shrink-0 text-center text-sm"
                          >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-baseline justify-between">
                              <p className="truncate text-sm font-medium text-foreground">
                                {stat.member.name}
                              </p>
                              <span className="ml-2 shrink-0 text-sm font-bold text-foreground">
                                {stat.periodCount} leads
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-amber-400 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              Total: {stat.totalCount} · Conv: {stat.convRate}%
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {marketingPerf.length > 1 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                      <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          ⭐ Best Generator
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {marketingPerf[0].member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {marketingPerf[0].periodCount} leads this period
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2.5 dark:bg-red-950/30">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                          ⚠️ Needs Push
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {marketingPerf.at(-1)?.member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {marketingPerf.at(-1)?.periodCount} leads this period
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sales Leaderboard */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">🏆 Sales Leaderboard</h3>
                  <p className="text-xs text-muted-foreground">
                    Conversions ·{' '}
                    {lbPeriod === 'week' ? 'This Week' : 'This Month'}
                  </p>
                </div>
                <Award className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>

              {salesPerf.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No leaderboard data available.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {salesPerf.slice(0, 5).map((entry, idx) => {
                      const max = Math.max(
                        ...salesPerf.map((e) => e.enrollments),
                        1,
                      );
                      const pct = (entry.enrollments / max) * 100;
                      return (
                        <li key={entry.userId} className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="w-6 shrink-0 text-center text-sm"
                          >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-baseline justify-between">
                              <p className="truncate text-sm font-medium text-foreground">
                                {entry.name}
                              </p>
                              <div className="ml-2 flex shrink-0 items-baseline gap-1.5">
                                <span
                                  className={cn(
                                    'text-xs font-semibold',
                                    entry.delta > 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : entry.delta < 0
                                      ? 'text-red-500 dark:text-red-400'
                                      : 'text-muted-foreground',
                                  )}
                                >
                                  {entry.delta > 0
                                    ? `↑${entry.delta}`
                                    : entry.delta < 0
                                    ? `↓${Math.abs(entry.delta)}`
                                    : '–'}
                                </span>
                                <span className="text-sm font-bold">
                                  {entry.enrollments} closed
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {entry.targetAchieved}% of target ·{' '}
                              {fmtCurrency(entry.revenue)} revenue
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {salesPerf.length > 1 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                      <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          ⭐ Top Closer
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {bestSales?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bestSales?.enrollments} enrolled ·{' '}
                          {fmtCurrency(bestSales?.revenue ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2.5 dark:bg-red-950/30">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                          ⚠️ Needs Support
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {worstSales?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {worstSales?.enrollments} enrolled ·{' '}
                          {fmtCurrency(worstSales?.revenue ?? 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Lead Quality by Source ───────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Lead Quality by Source
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Conversion rate per channel — all-time
                </p>
              </div>
              <Link
                href="/crm/leads"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                All leads
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <ul className="space-y-2">
              {sourceQuality.map(({ src, count, enrolled, convRate }) => {
                const meta = SOURCE_META[src];
                if (!meta) return null;
                return (
                  <li
                    key={src}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
                  >
                    <span className="shrink-0 text-base" aria-hidden="true">
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} leads · {enrolled} enrolled
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          'text-sm font-bold',
                          convRate >= 20
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : convRate >= 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-500 dark:text-red-400',
                        )}
                      >
                        {convRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        conv. rate
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 text-[11px] text-muted-foreground">
              💡 High conversion = quality sourcing. Use this to award bonuses.
            </p>
          </div>

          {/* ── Generator Attribution ────────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">
                Generator Attribution
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Marketing → Sales lead handoff tracking
              </p>
            </div>

            <ul className="space-y-2">
              {marketingMembers.map((member) => {
                const byField  = LEADS.filter((l) => l.generatedBy === member.id);
                const bySource = LEADS.filter(
                  (l) => !l.generatedBy && MARKETING_SOURCES.has(l.source),
                );
                const generated = byField.length > 0 ? byField : bySource;
                const enrolled  = generated.filter(
                  (l) => l.status === 'enrolled',
                ).length;
                const salesMap  = new Map<string, number>();
                generated.forEach((lead) => {
                  salesMap.set(
                    lead.assignedToName,
                    (salesMap.get(lead.assignedToName) ?? 0) + 1,
                  );
                });
                const convRate =
                  generated.length > 0
                    ? Math.round((enrolled / generated.length) * 100)
                    : 0;

                return (
                  <li
                    key={member.id}
                    className="rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      >
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {generated.length} generated · {enrolled} enrolled ·{' '}
                          {convRate}% conversion
                        </p>
                      </div>
                    </div>

                    {salesMap.size > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          Assigned to:
                        </span>
                       {Array.from(salesMap.entries()).map(([name, count]) => (
                          <span
                            key={name}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                          >
                            {name} ({count})
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Quick Actions ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              { href: '/crm/leads',    Icon: Users,       label: 'All Leads',   color: 'text-blue-500'    },
              { href: '/crm/tasks',    Icon: CheckSquare, label: 'Assign Task', color: 'text-amber-500'   },
              { href: '/crm/team',     Icon: BarChart3,   label: 'Team View',   color: 'text-emerald-500' },
              { href: '/crm/payments', Icon: DollarSign,  label: 'Payments',    color: 'text-primary'     },
            ] as const).map(({ href, Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                <Icon className={cn('h-5 w-5', color)} aria-hidden="true" />
                <span className="text-center text-xs font-medium text-foreground">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STANDARD VIEW — admin / super_admin / sales / support / marketing
      ════════════════════════════════════════════════════════════════════════ */}
      {!isTeamLead && (
        <>
          {/* KPI cards */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {metrics.map((m) => (
                <MetricCard key={m.id} metric={m} />
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">

            {/* Left panel (2/3 on desktop) */}
            <div className="lg:col-span-2">
              {showTrendChart ? (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Weekly Enrollment Trend
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Leads vs Enrollments · last 7 weeks
                      </p>
                    </div>
                    <Link
                      href="/crm/analytics"
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      Full analytics
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <TrendChart data={ANALYTICS.trend} />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {activeRole === 'support_agent'
                          ? 'My Students'
                          : can('leads.view_all')
                          ? 'Recent Leads'
                          : 'My Leads'}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activeRole === 'support_agent'
                          ? 'Enrolled · sorted by last activity'
                          : 'Active pipeline · latest first'}
                      </p>
                    </div>
                    <Link
                      href="/crm/leads"
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      View all
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="divide-y divide-border">
                    {recentLeads.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <Users
                          className="h-8 w-8 text-muted-foreground/30"
                          aria-hidden="true"
                        />
                        <p className="text-sm text-muted-foreground">
                          No active leads to show
                        </p>
                      </div>
                    ) : (
                      recentLeads.map((lead) => (
                        <LeadRow key={lead.id} lead={lead} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel — Tasks (1/3 on desktop) */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div>
                  <h3 className="font-semibold text-foreground">Tasks</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Overdue + due soon
                  </p>
                </div>
                <Link
                  href="/crm/tasks"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  View all
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {urgentTasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Clock
                      className="h-8 w-8 text-muted-foreground/30"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-muted-foreground">
                      All caught up!
                    </p>
                  </div>
                ) : (
                  urgentTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard preview — super_admin only */}
          {showLeaderboardPreview && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Leaderboard · This Month
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Top 3 performers
                    </p>
                  </div>
                </div>
                <Link
                  href="/crm/leaderboard"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Full board
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>

              <ul className="divide-y divide-border">
                {LEADERBOARD.filter((e) => e.period === 'month')
                  .slice(0, 3)
                  .map((entry) => (
                    <li
                      key={entry.userId}
                      className="flex items-center gap-3 px-4 py-3 sm:px-5"
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          entry.rank === 1
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            : entry.rank === 2
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
                        )}
                      >
                        {entry.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.enrollments} enrolled ·{' '}
                          {fmtCurrency(entry.revenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {entry.targetAchieved}%
                        </p>
                        <p className="text-xs text-muted-foreground">of target</p>
                      </div>
                      <span
                        className={cn(
                          'w-6 shrink-0 text-right text-xs font-semibold',
                          entry.delta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : entry.delta < 0
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-muted-foreground',
                        )}
                      >
                        {entry.delta > 0
                          ? `↑${entry.delta}`
                          : entry.delta < 0
                          ? `↓${Math.abs(entry.delta)}`
                          : '—'}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

    </div>
  );
}