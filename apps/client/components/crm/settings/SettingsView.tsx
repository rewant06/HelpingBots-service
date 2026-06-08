'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings2,
  GitBranch,
  Users2,
  Bell,
  ClipboardList,
  Save,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { AUDIT_LOGS, LEADS, TEAM_MEMBERS } from '@/lib/crm/data';
import { ROLE_LABELS } from '@/lib/crm/permissions';
import type { LeadStatus, Role } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'general' | 'pipeline' | 'team' | 'notifications' | 'audit';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'General',       icon: Settings2 },
  { id: 'pipeline',      label: 'Pipeline',       icon: GitBranch },
  { id: 'team',          label: 'Team',           icon: Users2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'audit',         label: 'Audit Log',      icon: ClipboardList },
];

// ─── Pipeline stage config ────────────────────────────────────────────────────

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string; hint: string }[] = [
  { status: 'new',                   label: 'New',              color: 'bg-slate-400',    hint: 'Lead just entered the system' },
  { status: 'contacted',             label: 'Contacted',        color: 'bg-blue-400',     hint: 'First contact made' },
  { status: 'interested',            label: 'Interested',       color: 'bg-amber-400',    hint: 'Expressed genuine interest' },
  { status: 'follow_up',             label: 'Follow-up',        color: 'bg-orange-400',   hint: 'Needs a scheduled follow-up' },
  { status: 'application_started',   label: 'App Started',      color: 'bg-violet-400',   hint: 'Application form begun' },
  { status: 'application_submitted', label: 'App Submitted',    color: 'bg-indigo-400',   hint: 'Application fully submitted' },
  { status: 'admission_confirmed',   label: 'Confirmed',        color: 'bg-teal-400',     hint: 'Admission letter issued' },
  { status: 'enrolled',              label: 'Enrolled',         color: 'bg-emerald-500',  hint: 'Fees paid, fully enrolled' },
  { status: 'lost',                  label: 'Lost',             color: 'bg-red-400',      hint: 'Did not proceed' },
  { status: 'on_hold',               label: 'On Hold',          color: 'bg-gray-400',     hint: 'Paused — revisit later' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneralConfig {
  crmName:      string;
  timezone:     string;
  currency:     string;
  coldLeadDays: number;
  followUpDays: number;
}

interface NotifConfig {
  newLeadEmail:     boolean;
  newLeadWhatsapp:  boolean;
  taskOverdueEmail: boolean;
  taskOverdueWA:    boolean;
  paymentDueEmail:  boolean;
  paymentDueWA:     boolean;
  importReadyEmail: boolean;
  weeklyDigest:     boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-border last:border-0">
      <div className="min-w-0 sm:flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0 sm:w-56">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const Icon = checked ? ToggleRight : ToggleLeft;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 text-sm font-medium transition-colors',
        checked ? 'text-primary' : 'text-muted-foreground',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
      {checked ? 'On' : 'Off'}
    </button>
  );
}

// ─── Audit Log helper ─────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  lead_created:       'Lead Created',
  lead_updated:       'Lead Updated',
  lead_status_changed:'Status Changed',
  lead_assigned:      'Lead Assigned',
  task_created:       'Task Created',
  task_completed:     'Task Completed',
  payment_updated:    'Payment Updated',
  import_uploaded:    'Import Uploaded',
  import_approved:    'Import Approved',
  import_rejected:    'Import Rejected',
  user_created:       'User Created',
  user_role_changed:  'Role Changed',
  settings_changed:   'Settings Changed',
};

const ENTITY_BADGE: Record<string, string> = {
  lead:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  task:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  payment:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  import:   'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  user:     'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  settings: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsView() {
  const router  = useRouter();
  const { can } = useCRMRole();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [saved,     setSaved]     = useState(false);

  // General config
  const [general, setGeneral] = useState<GeneralConfig>({
    crmName:      'HelpingBots EdTech CRM',
    timezone:     'Asia/Kolkata',
    currency:     'INR',
    coldLeadDays: 21,
    followUpDays: 3,
  });

  // Notifications
  const [notif, setNotif] = useState<NotifConfig>({
    newLeadEmail:     true,
    newLeadWhatsapp:  false,
    taskOverdueEmail: true,
    taskOverdueWA:    true,
    paymentDueEmail:  true,
    paymentDueWA:     true,
    importReadyEmail: true,
    weeklyDigest:     true,
  });

  const canManage = can('settings.manage');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Per-stage lead counts for Pipeline tab
  const stageCounts = useMemo(() => {
    const counts: Partial<Record<LeadStatus, number>> = {};
    for (const lead of LEADS) {
      counts[lead.status] = (counts[lead.status] ?? 0) + 1;
    }
    return counts;
  }, []);

  if (!can('settings.view')) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
        <p className="text-base font-medium text-foreground">Access Restricted</p>
        <p className="text-sm text-muted-foreground">
          Settings is available to admins only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your CRM, pipeline stages, team, and notifications.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: GENERAL                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <SectionCard title="CRM Identity">
            <FieldRow label="CRM Name" hint="Shown in the top bar and emails">
              <input
                type="text"
                value={general.crmName}
                disabled={!canManage}
                onChange={(e) => setGeneral((g) => ({ ...g, crmName: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </FieldRow>
            <FieldRow label="Timezone" hint="Used for due-date calculations and reports">
              <select
                value={general.timezone}
                disabled={!canManage}
                onChange={(e) => setGeneral((g) => ({ ...g, timezone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="Asia/Kolkata">Asia / Kolkata (IST +5:30)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia / Dubai (GST +4)</option>
                <option value="America/New_York">America / New York (ET)</option>
              </select>
            </FieldRow>
            <FieldRow label="Currency" hint="Display currency for payment totals">
              <select
                value={general.currency}
                disabled={!canManage}
                onChange={(e) => setGeneral((g) => ({ ...g, currency: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="AED">AED UAE Dirham</option>
              </select>
            </FieldRow>
          </SectionCard>

          <SectionCard title="Lead Lifecycle">
            <FieldRow
              label="Cold Lead Threshold"
              hint="Days of inactivity before a lead is flagged as 'cold'"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={general.coldLeadDays}
                  disabled={!canManage}
                  onChange={(e) => setGeneral((g) => ({ ...g, coldLeadDays: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </FieldRow>
            <FieldRow
              label="Default Follow-up Interval"
              hint="Auto-set nextFollowUp when status changes"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={general.followUpDays}
                  disabled={!canManage}
                  onChange={(e) => setGeneral((g) => ({ ...g, followUpDays: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </FieldRow>
          </SectionCard>

          <SectionCard title="Demo Data">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Leads',        value: LEADS.length },
                { label: 'Team Members', value: TEAM_MEMBERS.length },
                { label: 'Enrolled',     value: LEADS.filter((l) => l.status === 'enrolled').length },
                { label: 'Audit Logs',   value: AUDIT_LOGS.length },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: PIPELINE                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <SectionCard title="Lead Pipeline Stages">
            <p className="mb-4 text-sm text-muted-foreground">
              {PIPELINE_STAGES.length} stages · {LEADS.length} total leads
            </p>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = stageCounts[stage.status] ?? 0;
                const pct   = LEADS.length > 0 ? (count / LEADS.length) * 100 : 0;
                return (
                  <div
                    key={stage.status}
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div
                      className={cn('h-3 w-3 shrink-0 rounded-sm', stage.color)}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{stage.label}</p>
                        <span className="text-xs font-semibold text-foreground">{count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.hint}</p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full transition-all', stage.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: TEAM                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <SectionCard title="Team Members">
            <div className="divide-y divide-border">
              {TEAM_MEMBERS.map((member) => {
                const isStudent = member.role === 'student';
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {member.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="shrink-0">
                      {canManage && !isStudent ? (
                        <select
                          defaultValue={member.role}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                          aria-label={`Role for ${member.name}`}
                        >
                          {(['super_admin','admin','team_lead','marketing','sales_executive','support_agent'] as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
                        )}
                        aria-label={member.status}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: NOTIFICATIONS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <SectionCard title="Lead Alerts">
            <FieldRow label="New lead assigned" hint="When a lead is assigned to you">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Email</span>
                  <Toggle
                    checked={notif.newLeadEmail}
                    onChange={(v) => setNotif((n) => ({ ...n, newLeadEmail: v }))}
                    disabled={!canManage}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>WA</span>
                  <Toggle
                    checked={notif.newLeadWhatsapp}
                    onChange={(v) => setNotif((n) => ({ ...n, newLeadWhatsapp: v }))}
                    disabled={!canManage}
                  />
                </div>
              </div>
            </FieldRow>
          </SectionCard>

          <SectionCard title="Task Alerts">
            <FieldRow label="Task overdue" hint="When a task passes its due date unpompleted">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Email</span>
                  <Toggle
                    checked={notif.taskOverdueEmail}
                    onChange={(v) => setNotif((n) => ({ ...n, taskOverdueEmail: v }))}
                    disabled={!canManage}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>WA</span>
                  <Toggle
                    checked={notif.taskOverdueWA}
                    onChange={(v) => setNotif((n) => ({ ...n, taskOverdueWA: v }))}
                    disabled={!canManage}
                  />
                </div>
              </div>
            </FieldRow>
          </SectionCard>

          <SectionCard title="Payment Alerts">
            <FieldRow label="Fee due in 3 days" hint="Reminder before payment deadline">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Email</span>
                  <Toggle
                    checked={notif.paymentDueEmail}
                    onChange={(v) => setNotif((n) => ({ ...n, paymentDueEmail: v }))}
                    disabled={!canManage}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>WA</span>
                  <Toggle
                    checked={notif.paymentDueWA}
                    onChange={(v) => setNotif((n) => ({ ...n, paymentDueWA: v }))}
                    disabled={!canManage}
                  />
                </div>
              </div>
            </FieldRow>
          </SectionCard>

          <SectionCard title="System Alerts">
            <FieldRow label="Import ready for approval" hint="When a CSV import is uploaded">
              <Toggle
                checked={notif.importReadyEmail}
                onChange={(v) => setNotif((n) => ({ ...n, importReadyEmail: v }))}
                disabled={!canManage}
              />
            </FieldRow>
            <FieldRow label="Weekly performance digest" hint="Summary of enrollments and revenue every Monday">
              <Toggle
                checked={notif.weeklyDigest}
                onChange={(v) => setNotif((n) => ({ ...n, weeklyDigest: v }))}
                disabled={!canManage}
              />
            </FieldRow>
          </SectionCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: AUDIT LOG                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-muted/50 px-4 py-3 sm:px-5">
            <h3 className="font-semibold text-foreground">Audit Log</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recent system actions · {AUDIT_LOGS.length} records
            </p>
          </div>
          <div className="divide-y divide-border bg-card">
            {[...AUDIT_LOGS]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-4 py-3 sm:px-5"
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      ENTITY_BADGE[log.entityType] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {log.entityType}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {log.actorName}
                    </p>
                    {log.afterJson && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                        {JSON.stringify(log.afterJson)}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={log.timestamp}
                    className="shrink-0 text-[10px] text-muted-foreground"
                  >
                    {new Date(log.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}