begin;

create table drreach.treatment_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  title text not null,
  specialization text not null,

  content_type text not null check (content_type in ('protocol','care_plan','education')),
  status text not null check (status in ('draft','pending','approved','rejected','deprecated')) default 'draft',

  created_by_clinician_id uuid,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (tenant_id, id),

  constraint fk_templates_creator_tenant
    foreign key (tenant_id, created_by_clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_templates_tenant on drreach.treatment_templates(tenant_id, status);

create table drreach.treatment_template_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  template_id uuid not null,
  version int not null,

  source_type text not null check (source_type in ('original','copied_external','copied_book','imported')),
  source_citation text,

  content jsonb not null,

  created_by_clinician_id uuid,
  created_at timestamptz default now(),

  unique (tenant_id, template_id, version),

  constraint fk_template_versions_template_tenant
    foreign key (tenant_id, template_id)
    references drreach.treatment_templates(tenant_id, id)
    on delete cascade,

  constraint fk_template_versions_creator_tenant
    foreign key (tenant_id, created_by_clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create table drreach.treatment_template_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  template_version_id uuid not null,
  reviewer_clinician_id uuid not null,

  decision text not null check (decision in ('approved','rejected')),
  note text,

  created_at timestamptz default now(),

  constraint fk_tta_version_tenant
    foreign key (tenant_id, template_version_id)
    references drreach.treatment_template_versions(tenant_id, id)
    on delete cascade,

  constraint fk_tta_reviewer_tenant
    foreign key (tenant_id, reviewer_clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_template_approvals_tenant on drreach.treatment_template_approvals(tenant_id, created_at desc);

create table drreach.template_change_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  template_id uuid not null,
  from_version int not null,

  proposed_content jsonb not null,
  proposed_by_clinician_id uuid not null,

  status text not null check (status in ('draft','pending','approved','rejected')) default 'draft',

  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by_clinician_id uuid,
  decision_note text,

  constraint fk_tcr_template_tenant
    foreign key (tenant_id, template_id)
    references drreach.treatment_templates(tenant_id, id)
    on delete cascade,

  constraint fk_tcr_proposer_tenant
    foreign key (tenant_id, proposed_by_clinician_id)
    references drreach.clinicians(tenant_id, id),

  constraint fk_tcr_decider_tenant
    foreign key (tenant_id, decided_by_clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_tcr_status on drreach.template_change_requests(tenant_id, status, submitted_at);

commit;
