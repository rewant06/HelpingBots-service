'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, UserCheck, ChevronDown, X } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADS, TEAM_MEMBERS } from '@/lib/crm/data';
import type { Lead, LeadPriority, LeadSource, LeadStatus } from '@/lib/crm/types';
import { LeadDrawer }      from './LeadDrawer';
import { LeadTableRow }    from './LeadTableRow';
import { LeadCard }        from './LeadCard';
import { CreateLeadModal } from './CreateLeadModal';
import {
  FilterDropdown,
  FilterOption,
  SortDropdown,
} from '@/components/crm/shared/FilterDropdown';
import { FilterSheet } from '@/components/crm/shared/FilterSheet';

// ─── Filter + sort option lists ───────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new',                    label: 'New'                  },
  { value: 'contacted',              label: 'Contacted'            },
  { value: 'interested',             label: 'Interested'           },
  { value: 'follow_up',              label: 'Follow-up'            },
  { value: 'application_started',    label: 'Application Started'  },
  { value: 'application_submitted',  label: 'Application Submitted'},
  { value: 'admission_confirmed',    label: 'Admission Confirmed'  },
  { value: 'enrolled',               label: 'Enrolled'             },
  { value: 'lost',                   label: 'Lost'                 },
  { value: 'on_hold',                label: 'On Hold'              },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'website',        label: 'Website'       },
  { value: 'google_ads',     label: 'Google Ads'    },
  { value: 'referral',       label: 'Referral'      },
  { value: 'whatsapp',       label: 'WhatsApp'      },
  { value: 'social_media',   label: 'Social Media'  },
  { value: 'walk_in',        label: 'Walk-in'       },
  { value: 'event',          label: 'Event'         },
];

const SORT_OPTIONS: { value: 'updated' | 'created' | 'name'; label: string }[] = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'name',    label: 'Name (A–Z)'       },
];

const SALES_MEMBERS = TEAM_MEMBERS.filter((m) =>
  ['sales_executive', 'support_agent', 'team_lead'].includes(m.role),
);

// ─── Label lookups for active filter chips ────────────────────────────────────

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  follow_up: 'Follow-up', application_started: 'App Started',
  application_submitted: 'Submitted', admission_confirmed: 'Confirmed',
  enrolled: 'Enrolled', lost: 'Lost', on_hold: 'On Hold',
};

const PRIORITY_LABEL: Record<LeadPriority, string> = {
  high: 'High', medium: 'Medium', low: 'Low',
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  website: 'Website', google_ads: 'Google Ads', referral: 'Referral',
  whatsapp: 'WhatsApp', social_media: 'Social Media',
  walk_in: 'Walk-in', event: 'Event', email_campaign: 'Email Campaign',
  phone: 'Phone', other: 'Other',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadsView() {
  const { activeRole, currentUserId, can } = useCRMRole();

  const [createdLeads,       setCreatedLeads]       = useState<Lead[]>([]);
  const [searchQuery,        setSearchQuery]         = useState('');
  const [selectedStatuses,   setSelectedStatuses]   = useState<LeadStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<LeadPriority[]>([]);
  const [selectedSources,    setSelectedSources]    = useState<LeadSource[]>([]);
  const [selectedAssignee,   setSelectedAssignee]   = useState<string | null>(null);
  const [sortBy,             setSortBy]             = useState<'updated' | 'created' | 'name'>('updated');
  const [selectedIds,        setSelectedIds]        = useState<Set<string>>(new Set());
  const [showBulkMenu,       setShowBulkMenu]       = useState(false);
  const [selectedLead,       setSelectedLead]       = useState<Lead | null>(null);
  const [showCreateModal,    setShowCreateModal]     = useState(false);

  const canBulkAssign = can('leads.bulk_assign');

  const activeFilterCount =
    selectedStatuses.length +
    selectedPriorities.length +
    selectedSources.length +
    (selectedAssignee ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // ── Filtered + sorted leads ───────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const allLeads = [...createdLeads, ...LEADS];
    let base = can('leads.view_all')
      ? allLeads
      : activeRole === 'support_agent'
      ? allLeads.filter((l) => l.status === 'enrolled' && l.assignedTo === currentUserId)
      : allLeads.filter((l) => l.assignedTo === currentUserId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (l) =>
          l.name.toLowerCase().includes(q)   ||
          l.email.toLowerCase().includes(q)  ||
          l.mobile.toLowerCase().includes(q) ||
          l.program.toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length   > 0) base = base.filter((l) => selectedStatuses.includes(l.status));
    if (selectedPriorities.length > 0) base = base.filter((l) => selectedPriorities.includes(l.priority));
    if (selectedSources.length    > 0) base = base.filter((l) => selectedSources.includes(l.source));
    if (selectedAssignee)              base = base.filter((l) => l.assignedTo === selectedAssignee);

    return [...base].sort((a, b) => {
      if (sortBy === 'name')    return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [createdLeads, activeRole, currentUserId, can, searchQuery,
      selectedStatuses, selectedPriorities, selectedSources, selectedAssignee, sortBy]);

  const allFilteredIds = filteredLeads.map((l) => l.id);
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleStatus   = (v: LeadStatus)   => setSelectedStatuses((p)   => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const togglePriority = (v: LeadPriority) => setSelectedPriorities((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleSource   = (v: LeadSource)   => setSelectedSources((p)    => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleAssignee = (id: string)      => setSelectedAssignee((p)   => p === id ? null : id);
  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedSources([]);
    setSelectedAssignee(null);
  };

  const toggleAll = () => {
    if (allSelected) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(allFilteredIds));
  };
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkAssign = (memberId: string) => {
    void memberId;
    setSelectedIds(new Set());
    setShowBulkMenu(false);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Lead
          </button>
        )}
      </div>

      {/* ── Sticky bulk-assign bar ───────────────────────────────────────── */}
      {canBulkAssign && selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 backdrop-blur-sm">
          <p className="text-sm font-medium text-primary">
            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Assign To
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="p-1">
                    {SALES_MEMBERS.map((m) => (
                      <button key={m.id} type="button"
                        onClick={() => handleBulkAssign(m.id)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {m.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => setSelectedIds(new Set())}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Clear selection">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">

        {/* Search — always visible */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, email, mobile, program…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* ── Mobile: FilterSheet button + sort ─────────────────────────── */}
        <div className="flex items-center gap-2 md:hidden">
          <FilterSheet activeCount={activeFilterCount} onClear={clearAllFilters}>

            <FilterSheet.Section title="Status">
              {STATUS_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedStatuses.includes(opt.value)}
                  onChange={() => toggleStatus(opt.value)} />
              ))}
            </FilterSheet.Section>

            <FilterSheet.Section title="Priority">
              {PRIORITY_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedPriorities.includes(opt.value)}
                  onChange={() => togglePriority(opt.value)} />
              ))}
            </FilterSheet.Section>

            <FilterSheet.Section title="Source">
              {SOURCE_OPTIONS.map((opt) => (
                <FilterSheet.Option key={opt.value} label={opt.label}
                  checked={selectedSources.includes(opt.value)}
                  onChange={() => toggleSource(opt.value)} />
              ))}
            </FilterSheet.Section>

            {can('leads.view_all') && (
              <FilterSheet.Section title="Assignee">
                {TEAM_MEMBERS.filter((m) => m.role !== 'student').map((m) => (
                  <FilterSheet.Option key={m.id} label={m.name}
                    checked={selectedAssignee === m.id}
                    onChange={() => toggleAssignee(m.id)} />
                ))}
              </FilterSheet.Section>
            )}

          </FilterSheet>

          <SortDropdown value={sortBy} options={SORT_OPTIONS}
            onChange={setSortBy} className="ml-auto" />
        </div>

        {/* ── Desktop: inline filter row (unchanged) ────────────────────── */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <FilterDropdown label="Status" count={selectedStatuses.length}>
            {STATUS_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedStatuses.includes(opt.value)}
                onChange={() => toggleStatus(opt.value)} />
            ))}
          </FilterDropdown>

          <FilterDropdown label="Priority" count={selectedPriorities.length}>
            {PRIORITY_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedPriorities.includes(opt.value)}
                onChange={() => togglePriority(opt.value)} />
            ))}
          </FilterDropdown>

          <FilterDropdown label="Source" count={selectedSources.length}>
            {SOURCE_OPTIONS.map((opt) => (
              <FilterOption key={opt.value} label={opt.label}
                checked={selectedSources.includes(opt.value)}
                onChange={() => toggleSource(opt.value)} />
            ))}
          </FilterDropdown>

          {can('leads.view_all') && (
            <FilterDropdown label="Assignee" count={selectedAssignee ? 1 : 0}>
              <FilterOption label="All" checked={selectedAssignee === null}
                onChange={() => setSelectedAssignee(null)} />
              {TEAM_MEMBERS.filter((m) => m.role !== 'student').map((m) => (
                <FilterOption key={m.id} label={m.name}
                  checked={selectedAssignee === m.id}
                  onChange={() => toggleAssignee(m.id)} />
              ))}
            </FilterDropdown>
          )}

          <SortDropdown value={sortBy} options={SORT_OPTIONS}
            onChange={setSortBy} className="ml-auto" />
        </div>

        {/* Active filter chips — proper labels */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {selectedStatuses.map((s) => (
              <button key={s} type="button" onClick={() => toggleStatus(s)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {STATUS_LABEL[s]} ×
              </button>
            ))}
            {selectedPriorities.map((p) => (
              <button key={p} type="button" onClick={() => togglePriority(p)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {PRIORITY_LABEL[p]} ×
              </button>
            ))}
            {selectedSources.map((s) => (
              <button key={s} type="button" onClick={() => toggleSource(s)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {SOURCE_LABEL[s] ?? s} ×
              </button>
            ))}
            {selectedAssignee && (
              <button type="button" onClick={() => setSelectedAssignee(null)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                {TEAM_MEMBERS.find((m) => m.id === selectedAssignee)?.name} ×
              </button>
            )}
            <button type="button" onClick={clearAllFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Lead list ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-base font-medium text-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground">
              {can('leads.create')
                ? 'Add your first lead with the button above.'
                : 'Try adjusting your filters or search query.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card list (< md) */}
            <div className="divide-y divide-border md:hidden">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead}
                  selected={selectedIds.has(lead.id)}
                  showCheckbox={canBulkAssign}
                  onSelect={() => toggleOne(lead.id)}
                  onClick={() => setSelectedLead(lead)} />
              ))}
            </div>

            {/* Desktop: table (≥ md) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {canBulkAssign && (
                      <th className="w-10 px-4 py-3 sm:px-5">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll}
                          className="h-4 w-4 cursor-pointer rounded"
                          aria-label="Select all leads" />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">Name</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">Program</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">Status</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">Assigned To</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.map((lead) => (
                    <LeadTableRow key={lead.id} lead={lead}
                      selected={selectedIds.has(lead.id)}
                      showCheckbox={canBulkAssign}
                      onSelect={() => toggleOne(lead.id)}
                      onClick={() => setSelectedLead(lead)} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Drawer / Modal ───────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => setSelectedLead(updated)} />
      )}
      <CreateLeadModal open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(lead) => { setCreatedLeads((prev) => [lead, ...prev]); setShowCreateModal(false); }} />
    </div>
  );
}