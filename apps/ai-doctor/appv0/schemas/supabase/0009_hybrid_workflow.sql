begin;

create table drreach.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,
  snapshot_id uuid not null,

  protocol_id bigint,
  protocol_version int not null default 1,

  status text not null check (status in
    ('draft_created','pending_review','accepted','edited','safety_failed','approved','published','revoked')
  ) default 'draft_created',

  patient_preview_redacted text,

  ai_payload jsonb not null,
  safety_gate_payload jsonb not null,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (tenant_id, id),

  constraint fk_suggestion_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade,

  constraint fk_suggestion_protocol_tenant
    foreign key (tenant_id, protocol_id)
    references drreach.protocols(tenant_id, id)
);

create index idx_ai_suggestions_profile on drreach.ai_suggestions(profile_id, created_at desc);
create index idx_ai_suggestions_status on drreach.ai_suggestions(tenant_id, status, created_at);

create table drreach.review_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  suggestion_id uuid not null,

  status text not null check (status in ('open','accepted','completed','canceled','expired')) default 'open',

  accepted_by_clinician_id uuid,
  accepted_at timestamptz,
  accept_expires_at timestamptz,

  sla_due_at timestamptz not null,
  breach_at timestamptz not null,

  priority int not null default 5,
  routing jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (tenant_id, suggestion_id),

  constraint fk_task_suggestion_tenant
    foreign key (tenant_id, suggestion_id)
    references drreach.ai_suggestions(tenant_id, id)
    on delete cascade,

  constraint fk_task_assignee_tenant
    foreign key (tenant_id, accepted_by_clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_review_tasks_open on drreach.review_tasks(tenant_id, status, sla_due_at);
create index idx_review_tasks_assignee on drreach.review_tasks(tenant_id, accepted_by_clinician_id, status);

create table drreach.clinician_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  suggestion_id uuid not null,
  clinician_id uuid not null,

  decision text not null check (decision in ('approved','rejected','needs_more_info')),
  edit_diff jsonb,
  clinician_note text,

  safety_recheck_payload jsonb,
  created_at timestamptz default now(),

  constraint fk_review_suggestion_tenant
    foreign key (tenant_id, suggestion_id)
    references drreach.ai_suggestions(tenant_id, id)
    on delete cascade,

  constraint fk_review_clinician_tenant
    foreign key (tenant_id, clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_reviews_suggestion on drreach.clinician_reviews(suggestion_id, created_at desc);

create table drreach.recommendation_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  suggestion_id uuid not null,
  profile_id uuid not null,
  clinician_id uuid not null,

  publishable_payload jsonb not null,

  published_at timestamptz default now(),
  revoked_at timestamptz,
  revoke_reason text,

  unique (tenant_id, suggestion_id),

  constraint fk_pub_suggestion_tenant
    foreign key (tenant_id, suggestion_id)
    references drreach.ai_suggestions(tenant_id, id)
    on delete restrict,

  constraint fk_pub_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade,

  constraint fk_pub_clinician_tenant
    foreign key (tenant_id, clinician_id)
    references drreach.clinicians(tenant_id, id)
);

create index idx_pub_profile on drreach.recommendation_publications(profile_id, published_at desc);

create table drreach.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid,
  publication_id uuid,

  rating int check (rating between 1 and 5),
  free_text text,

  created_at timestamptz default now(),
  created_by_iam_user_id text,

  constraint fk_feedback_pub_tenant
    foreign key (tenant_id, publication_id)
    references drreach.recommendation_publications(tenant_id, id)
    on delete cascade
);

create index idx_feedback_pub on drreach.recommendation_feedback(publication_id, created_at desc);

commit;
