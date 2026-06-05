'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, Plus, UserCheck, X } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '@/lib/crm/types';
import { LeadDrawer } from './LeadDrawer';
import { LeadTableRow } from './LeadTableRow';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'application_started', label: 'Application Started' },
  { value: 'application_submitted', label: 'Application Submitted' },
  { value: 'admission_confirmed', label: 'Admission Confirmed' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'event', label: 'Event' },
];

const SALES_MEMBERS = TEAM_MEMBERS.filter((member) =>
  ['sales_executive', 'support_agent'].includes(member.role),
);

export function LeadsView() {
  const { activeRole, currentUserId, can } = useCRMRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<LeadPriority[]>([]);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const canBulkAssign = can('leads.bulk_assign');

  const filteredLeads = useMemo(() => {
    let base = can('leads.view_all')
      ? LEADS
      : activeRole === 'support_agent'
      ? LEADS.filter((lead) => lead.status === 'enrolled' && lead.assignedTo === currentUserId)
      : LEADS.filter((lead) => lead.assignedTo === currentUserId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.mobile.toLowerCase().includes(q) ||
          lead.program.toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length > 0) {
      base = base.filter((lead) => selectedStatuses.includes(lead.status));
    }

    if (selectedPriorities.length > 0) {
      base = base.filter((lead) => selectedPriorities.includes(lead.priority));
    }

    if (selectedSources.length > 0) {
      base = base.filter((lead) => selectedSources.includes(lead.source));
    }

    if (selectedAssignee) {
      base = base.filter((lead) => lead.assignedTo === selectedAssignee);
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [
    activeRole,
    currentUserId,
    can,
    searchQuery,
    selectedStatuses,
    selectedPriorities,
    selectedSources,
    selectedAssignee,
    sortBy,
  ]);

  const allFilteredIds = filteredLeads.map((lead) => lead.id);
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(allFilteredIds));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkAssign(memberId: string) {
    void memberId;
    setSelectedIds(new Set());
    setShowBulkAssign(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
          </p>
        </div>

        {can('leads.create') && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Lead
          </button>
        )}
      </div>

      {canBulkAssign && selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <p className="text-sm font-medium text-primary">
            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
          </p>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkAssign((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Assign To
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>

              {showBulkAssign && (
                <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="p-1">
                    {SALES_MEMBERS.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleBulkAssign(member.id)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {member.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                        </div>
                        <span className="truncate">{member.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border p-1">
                    <button
                      type="button"
                      onClick={() => setShowBulkAssign(false)}
                      className="w-full rounded px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute left-0 top-full z-10 mt-1 hidden min-w-48 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses((prev) => [...prev, opt.value]);
                      } else {
                        setSelectedStatuses((prev) => prev.filter((s) => s !== opt.value));
                      }
                    }}
                    className="h-4 w-4 cursor-pointer rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              Priority {selectedPriorities.length > 0 && `(${selectedPriorities.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute left-0 top-full z-10 mt-1 hidden min-w-40 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
              {PRIORITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedPriorities.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriorities((prev) => [...prev, opt.value]);
                      } else {
                        setSelectedPriorities((prev) => prev.filter((p) => p !== opt.value));
                      }
                    }}
                    className="h-4 w-4 cursor-pointer rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              Source {selectedSources.length > 0 && `(${selectedSources.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute left-0 top-full z-10 mt-1 hidden max-h-72 min-w-40 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
              {SOURCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources((prev) => [...prev, opt.value]);
                      } else {
                        setSelectedSources((prev) => prev.filter((s) => s !== opt.value));
                      }
                    }}
                    className="h-4 w-4 cursor-pointer rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {can('leads.view_all') && (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Assignee {selectedAssignee && '(1)'}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              <div className="absolute left-0 top-full z-10 mt-1 hidden max-h-72 min-w-48 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selectedAssignee === null}
                    onChange={() => setSelectedAssignee(null)}
                    className="h-4 w-4 cursor-pointer rounded"
                  />
                  All
                </label>

                {TEAM_MEMBERS.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignee === member.id}
                      onChange={() =>
                        setSelectedAssignee((prev) => (prev === member.id ? null : member.id))
                      }
                      className="h-4 w-4 cursor-pointer rounded"
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="relative group ml-auto">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              Sort: {sortBy === 'name' ? 'Name' : sortBy === 'created' ? 'Created' : 'Updated'}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-40 rounded-lg border border-border bg-popover p-1 shadow-lg group-hover:block">
              {[
                { value: 'updated' as const, label: 'Most Recently Updated' },
                { value: 'created' as const, label: 'Recently Created' },
                { value: 'name' as const, label: 'Name (A-Z)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <p className="text-base font-medium text-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {canBulkAssign && (
                    <th className="w-10 px-4 py-3 sm:px-5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 cursor-pointer rounded"
                        aria-label="Select all leads"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                    Program
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground xl:table-cell xl:px-5">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Contact
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <LeadTableRow
                    key={lead.id}
                    lead={lead}
                    selected={selectedIds.has(lead.id)}
                    showCheckbox={canBulkAssign}
                    onSelect={() => toggleOne(lead.id)}
                    onClick={() => setSelectedLead(lead)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updatedLead) => setSelectedLead(updatedLead)}
        />
      )}
    </div>
  );
}