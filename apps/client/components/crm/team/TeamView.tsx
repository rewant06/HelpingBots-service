'use client';

import { useMemo, useState } from 'react';
import { Users, Mail, Phone, Award } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { TEAM_MEMBERS, LEADS, TASKS, PAYMENTS } from '@/lib/crm/data';
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/crm/permissions';
import type { Role } from '@/lib/crm/types';

const ROLE_DOT: Record<Role, string> = {
  super_admin: 'bg-purple-600',
  admin: 'bg-blue-600',
  team_lead: 'bg-emerald-600',
  sales_executive: 'bg-amber-600',
  support_agent: 'bg-pink-600',
  student: 'bg-slate-600',
};

export function TeamView() {
  const { can } = useCRMRole();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // ─── Data aggregation ───────────────────────────────────────────────────

  const teamWithStats = useMemo(() => {
    return TEAM_MEMBERS.map((member) => {
      const assignedLeads = LEADS.filter((l) => l.assignedTo === member.id);
      const assignedTasks = TASKS.filter((t) => t.assignedTo === member.id);
      const assignedPayments = PAYMENTS.filter((p) => {
        const lead = LEADS.find((l) => l.id === p.leadId);
        return lead?.assignedTo === member.id;
      });

      const completedTasks = assignedTasks.filter(
        (t) => t.status === 'completed',
      ).length;
      const totalPaymentAmount = assignedPayments.reduce(
        (sum, p) => sum + p.totalAmount,
        0,
      );
      const paidPaymentAmount = assignedPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const enrolledLeads = assignedLeads.filter(
        (l) => l.status === 'enrolled',
      ).length;

      return {
        ...member,
        stats: {
          leads: assignedLeads.length,
          enrolledLeads,
          tasks: assignedTasks.length,
          completedTasks,
          totalPayments: totalPaymentAmount,
          paidPayments: paidPaymentAmount,
          taskCompletionRate:
            assignedTasks.length > 0
              ? Math.round((completedTasks / assignedTasks.length) * 100)
              : 0,
        },
      };
    });
  }, []);

  const filteredMembers = useMemo(() => {
    let filtered = teamWithStats;
    if (selectedRole) {
      filtered = filtered.filter((m) => m.role === selectedRole);
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [teamWithStats, selectedRole]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredMembers.length} team member{filteredMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Role filters ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedRole(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedRole === null
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-background hover:bg-muted'
          }`}
        >
          All Roles ({teamWithStats.length})
        </button>
        {ROLE_ORDER.filter((r) => r !== 'student').map((role) => {
          const count = teamWithStats.filter((m) => m.role === role).length;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedRole === role
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background hover:bg-muted'
              }`}
            >
              {ROLE_LABELS[role]} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Team member grid ────────────────────────────────────────────────── */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-base font-medium text-foreground">
            No team members found
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
            >
              {/* Header: Avatar + Name + Role */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {member.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className={`h-2 w-2 rounded-full ${ROLE_DOT[member.role]}`}
                      aria-hidden="true"
                    />
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[member.role]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1 mb-3 pb-3 border-b border-border text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <a href={`mailto:${member.email}`} className="truncate">
                    {member.email}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <a href={`tel:${member.phone}`} className="truncate">
                    {member.phone}
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads</span>
                  <span className="font-semibold text-foreground">
                    {member.stats.leads}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrolled</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {member.stats.enrolledLeads}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasks Done</span>
                  <span className="font-semibold text-foreground">
                    {member.stats.completedTasks}/{member.stats.tasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-semibold text-primary">
                    ₹{(member.stats.paidPayments / 100_000).toFixed(1)}L
                  </span>
                </div>
              </div>

              {/* Completion rate bar */}
              {member.stats.tasks > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Task Completion
                    </p>
                    <span className="text-xs font-semibold text-foreground">
                      {member.stats.taskCompletionRate}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${member.stats.taskCompletionRate}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}