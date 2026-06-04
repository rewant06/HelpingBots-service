'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  CalendarDays,
  FileText,
  ChevronRight,
  Clock,
  Users,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import {
  ANALYTICS,
  DASHBOARD_METRICS,
  LEADS,
  LEADERBOARD,
  TASKS,
} from '@/lib/crm/data';
import { ROLE_LABELS } from '@/lib/crm/permissions';
import type {
  DashboardMetric,
  Lead,
  LeadStatus,
  MetricFormat,
  Task,
  TaskPriority,
  TaskType,
} from '@/lib/crm/types';
import { TrendChart } from '../../../app/crm/dashboard/TrendChart';

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      if (value >= 10_00_000)
        return `₹${(value / 10_00_000).toFixed(1)}L`;
      if (value >= 1_000)
        return `₹${(value / 1_000).toFixed(0)}K`;
      return `₹${value}`;
    case 'percentage':
      return `${value}%`;
    case 'duration':
      return `${value}h`;
    default:
      return value.toLocaleString('en-IN');
  }
}

function fmtDue(isoStr: string): { label: string; late: boolean } {
  const diffMs = new Date(isoStr).getTime() - Date.now();
  const days = Math.floor(Math.abs(diffMs) / 86_400_000);
  if (diffMs < 0)
    return { label: `${days + 1}d overdue`, late: true };
  if (days === 0) return { label: 'Due today', late: false };
  if (days === 1) return { label: 'Due tomorrow', late: false };
  return { label: `Due in ${days}d`, late: false };
}

// ─── Colour / label maps ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<LeadStatus, string> = {
  new:                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  contacted:              'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interested:             'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  follow_up:              'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  application_started:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  application_submitted:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  admission_confirmed:    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  enrolled:               'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost:                   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  on_hold:                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  follow_up: 'Follow-up', application_started: 'App Started',
  application_submitted: 'Submitted', admission_confirmed: 'Confirmed',
  enrolled: 'Enrolled', lost: 'Lost', on_hold: 'On Hold',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
};

const TASK_ICON: Partial<Record<TaskType, LucideIcon>> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: CalendarDays,
  document: FileText,
};

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const { label, value, change, format } = metric;
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium leading-none text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight text-foreground">
        {fmtValue(value, format)}
      </p>
      {change !== 0 && (
        <div
          className={[
            'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
          ].join(' ')}
        >
          {isUp ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          )}
          <span>
            {isUp ? '+' : ''}
            {change}%
          </span>
          <span className="hidden font-normal text-muted-foreground sm:inline">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
}

// ─── LeadRow ─────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: Lead }) {
  const initials = lead.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {lead.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.program}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[lead.status]}`}
      >
        {STATUS_LABEL[lead.status]}
      </span>
    </div>
  );
}

// ─── TaskRow ─────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const Icon = TASK_ICON[task.type] ?? FileText;
  const due = fmtDue(task.dueDate);
  const isLate = due.late || task.status === 'overdue';

  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-background ${PRIORITY_DOT[task.priority]}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground">
          {task.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {task.leadName}
        </p>
      </div>
      <span
        className={`shrink-0 whitespace-nowrap text-xs font-medium ${
          isLate
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground'
        }`}
      >
        {due.label}
      </span>
    </div>
  );
}

// ─── DashboardView ────────────────────────────────────────────────────────────

export function DashboardView() {
  const { activeRole, currentUserId, currentUserName, can, isStudent } =
    useCRMRole();
  const router = useRouter();

  // Students have a dedicated portal — redirect immediately
  useEffect(() => {
    if (isStudent) router.replace('/crm/portal');
  }, [isStudent, router]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const metrics = useMemo(
    () => DASHBOARD_METRICS.filter((m) => m.allowedRoles.includes(activeRole)),
    [activeRole],
  );

  const recentLeads = useMemo(() => {
    const base = can('leads.view_all')
      ? LEADS
      : LEADS.filter((l) => l.assignedTo === currentUserId);

    // Support agents care about their enrolled students
    // All other roles care about the active pipeline
    const relevant =
      activeRole === 'support_agent'
        ? base.filter((l) => l.status === 'enrolled')
        : base.filter((l) =>
            !['enrolled', 'lost', 'on_hold'].includes(l.status),
          );

    return relevant
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 6);
  }, [activeRole, currentUserId, can]);

  const urgentTasks = useMemo(() => {
    const base = can('tasks.view_all')
      ? TASKS
      : TASKS.filter((t) => t.assignedTo === currentUserId);

    return base
      .filter(
        (t) =>
          t.status === 'overdue' ||
          (t.status === 'pending' &&
            new Date(t.dueDate) <= new Date()),
      )
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [activeRole, currentUserId, can]);

  const overdueCount = urgentTasks.filter((t) => t.status === 'overdue').length;

  const showTrendChart = can('analytics.view');

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (isStudent) return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting},{' '}
            <span className="text-primary">
              {currentUserName.split(' ')[0]}
            </span>{' '}
            👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ROLE_LABELS[activeRole]} ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {overdueCount > 0 && (
          <Link
            href="/crm/tasks"
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {overdueCount} task{overdueCount > 1 ? 's' : ''} overdue
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* ── Metric cards ────────────────────────────────────────────────────── */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </div>
      )}

      {/* ── Main content row ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left panel (2/3) */}
        <div className="lg:col-span-2">
          {showTrendChart ? (
            /* Admin+ → Trend chart */
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
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <TrendChart data={ANALYTICS.trend} />
            </div>
          ) : (
            /* Others → Recent leads */
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
                  <ChevronRight className="h-3 w-3" />
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

        {/* Right panel (1/3) — Tasks */}
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
              <ChevronRight className="h-3 w-3" />
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

      {/* ── Leaderboard preview (super_admin only) ───────────────────────────── */}
      {can('leaderboard.view') && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Trophy
                className="h-4 w-4 text-amber-500"
                aria-hidden="true"
              />
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
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {LEADERBOARD.slice(0, 3).map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                {/* Rank badge */}
                <span
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    entry.rank === 1
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : entry.rank === 2
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
                  ].join(' ')}
                >
                  {entry.rank}
                </span>

                {/* Name + stats */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.enrollments} enrolled ·{' '}
                    ₹{(entry.revenue / 100_000).toFixed(1)}L
                  </p>
                </div>

                {/* Target % */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.targetAchieved}%
                  </p>
                  <p className="text-xs text-muted-foreground">of target</p>
                </div>

                {/* Rank delta */}
                <span
                  className={[
                    'w-6 shrink-0 text-right text-xs font-semibold',
                    entry.delta > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : entry.delta < 0
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {entry.delta > 0
                    ? `↑${entry.delta}`
                    : entry.delta < 0
                    ? `↓${Math.abs(entry.delta)}`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}