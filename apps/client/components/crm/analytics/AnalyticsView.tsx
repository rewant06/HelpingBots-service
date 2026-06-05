'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Clock,
  ShieldOff,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { ANALYTICS } from '@/lib/crm/data';
import { TrendChart } from '@/app/crm/dashboard/TrendChart';

// ─── Label Maps ────────────────────────────────────────────────────────────────
// Must match the LeadStatus and LeadSource union types exactly.

const STATUS_BAR_COLOR: Record<string, string> = {
  new:                   'bg-slate-400',
  contacted:             'bg-blue-400',
  interested:            'bg-amber-400',
  follow_up:             'bg-orange-400',
  application_started:   'bg-violet-400',
  application_submitted: 'bg-indigo-400',
  admission_confirmed:   'bg-teal-400',
  enrolled:              'bg-emerald-500',
  lost:                  'bg-red-400',
  on_hold:               'bg-gray-400',
};

const STATUS_LABEL: Record<string, string> = {
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

const SOURCE_LABEL: Record<string, string> = {
  website:        'Website',
  google_ads:     'Google Ads',
  referral:       'Referral',
  social_media:   'Social Media',
  whatsapp:       'WhatsApp',
  walk_in:        'Walk-in',
  event:          'Event',
  phone:          'Phone',
  email_campaign: 'Email Campaign',
  other:          'Other',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  change: number;
  Icon: LucideIcon;
}

function KpiCard({ label, value, sub, change, Icon }: KpiCardProps) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <div className="flex items-center gap-1.5">
        <div
          className={
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ' +
            (isPositive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400')
          }
        >
          <TrendIcon className="h-2.5 w-2.5" aria-hidden="true" />
          {isPositive ? '+' : ''}{change}%
        </div>
        <span className="truncate text-[10px] text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsView() {
  const router = useRouter();
  const { can } = useCRMRole();

  // Guard: only super_admin and admin have analytics.view
  useEffect(() => {
    if (!can('analytics.view')) {
      router.replace('/crm/dashboard');
    }
  }, [can, router]);

  if (!can('analytics.view')) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
        <p className="text-base font-medium text-foreground">Access Restricted</p>
        <p className="text-sm text-muted-foreground">
          Analytics is available to admins only.
        </p>
      </div>
    );
  }

  const d = ANALYTICS;

  // Derived values
  const maxSourceCount = Math.max(...d.topSources.map((s) => s.count), 1);
  const maxProgramCount = Math.max(...d.topPrograms.map((p) => p.count), 1);
  const totalStatusCount = d.statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1;

  const enrolledCount = d.statusDistribution.find((s) => s.status === 'enrolled')?.count ?? 0;
  const lostCount = d.statusDistribution.find((s) => s.status === 'lost')?.count ?? 0;
  const activeCount = d.totalLeads - enrolledCount - lostCount;

  const funnelSteps = [
    {
      label: 'Total Leads',
      value: d.totalLeads,
      pct: 100,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Pipeline',
      value: activeCount,
      pct: Math.round((activeCount / d.totalLeads) * 100),
      color: 'bg-amber-500',
    },
    {
      label: 'Enrolled',
      value: enrolledCount,
      pct: Math.round((enrolledCount / d.totalLeads) * 100),
      color: 'bg-emerald-500',
    },
    {
      label: 'Lost',
      value: lostCount,
      pct: Math.round((lostCount / d.totalLeads) * 100),
      color: 'bg-red-400',
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Analytics
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.period} · {d.totalLeads} leads · {d.conversionRate}% conversion rate
          </p>
        </div>
        <span className="self-start rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary sm:self-auto">
          {d.period}
        </span>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <KpiCard
          label="Total Leads"
          value={d.totalLeads.toString()}
          sub={d.newLeads + ' new this period'}
          change={12}
          Icon={Users}
        />
        <KpiCard
          label="Enrolled"
          value={d.converted.toString()}
          sub={'Rate: ' + d.conversionRate + '%'}
          change={33}
          Icon={Target}
        />
        <KpiCard
          label="Conversion Rate"
          value={d.conversionRate + '%'}
          sub="vs 13.9% last month"
          change={2.1}
          Icon={BarChart3}
        />
        <KpiCard
          label="Revenue Collected"
          value={'₹' + (d.revenueCollected / 100_000).toFixed(1) + 'L'}
          sub="Fully cleared fees"
          change={18}
          Icon={DollarSign}
        />
        <KpiCard
          label="Revenue Pending"
          value={'₹' + (d.revenuePending / 100_000).toFixed(1) + 'L'}
          sub="Across active accounts"
          change={-5}
          Icon={DollarSign}
        />
        <KpiCard
          label="Avg Response Time"
          value={d.avgResponseTimeHours + 'h'}
          sub="Lead-to-first-contact"
          change={-16}
          Icon={Clock}
        />
      </div>

      {/* ── Lead Funnel ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-4 font-semibold text-foreground">Lead Conversion Funnel</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {funnelSteps.map((step, idx) => (
            <div key={step.label} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2">
              <div
                className={'flex flex-1 flex-col items-center justify-center rounded-xl p-4 text-white sm:w-full ' + step.color}
              >
                <p className="text-2xl font-bold">{step.value}</p>
                <p className="mt-0.5 text-[11px] font-medium opacity-90">
                  {step.pct}% of total
                </p>
              </div>
              <p className="shrink-0 text-xs font-medium text-muted-foreground sm:text-center">
                {step.label}
              </p>
              {idx < funnelSteps.length - 1 && (
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/40 sm:hidden"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly Trend Chart ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">7-Week Enrollment Trend</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Weekly lead acquisition vs enrollment conversion
          </p>
        </div>
        <TrendChart data={d.trend} />
      </div>

      {/* ── Sources + Pipeline ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Lead Sources */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 font-semibold text-foreground">Lead Sources</h3>
          <div className="space-y-3">
            {d.topSources.map((src) => {
              const pct = Math.round((src.count / maxSourceCount) * 100);
              return (
                <div key={src.source}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {SOURCE_LABEL[src.source] ?? src.source}
                    </span>
                    <span className="tabular-nums text-xs font-semibold text-foreground">
                      {src.count} leads
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: pct + '%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 font-semibold text-foreground">Pipeline Distribution</h3>
          <div className="space-y-2.5">
            {d.statusDistribution.map((s) => {
              const pct = Math.round((s.count / totalStatusCount) * 100);
              const barColor = STATUS_BAR_COLOR[s.status] ?? 'bg-gray-400';
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div
                    className={'h-2.5 w-2.5 shrink-0 rounded-sm ' + barColor}
                    aria-hidden="true"
                  />
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={'h-full transition-all ' + barColor}
                      style={{ width: pct + '%' }}
                    />
                  </div>
                  <div className="flex w-14 shrink-0 items-center justify-end gap-1">
                    <span className="tabular-nums text-xs font-semibold text-foreground">
                      {s.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top Programs ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-4 font-semibold text-foreground">
          Top Programs by Lead Volume
        </h3>
        <div className="space-y-3">
          {d.topPrograms.map((prog, idx) => {
            const pct = Math.round((prog.count / maxProgramCount) * 100);
            return (
              <div key={prog.program} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="w-52 shrink-0 truncate text-sm text-foreground">
                  {prog.program}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary/70 transition-all"
                    style={{ width: pct + '%' }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-xs font-semibold text-foreground">
                  {prog.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Performance Summary ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{d.newLeads}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">New Leads</p>
          <p className="text-xs text-muted-foreground">acquired this period</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {d.lost}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">Leads Lost</p>
          <p className="text-xs text-muted-foreground">
            {Math.round((d.lost / d.totalLeads) * 100)}% drop-off rate
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">
            {d.avgResponseTimeHours}h
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Avg Response Time
          </p>
          <p className="text-xs text-muted-foreground">lead-to-first-contact</p>
        </div>
      </div>

    </div>
  );
}