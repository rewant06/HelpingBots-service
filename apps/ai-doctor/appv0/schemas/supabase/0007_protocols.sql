begin;

create table drreach.protocols (
  id bigserial primary key,
  tenant_id text not null,

  title text not null,
  specialization text not null,

  lethality_score int default 1,
  precedence_level int default 5,

  status text not null check (status in ('draft','pending','approved','deprecated')) default 'draft',

  author_iam_user_id text,
  reviewer_iam_user_id text,
  approvals_count int default 0,

  created_at timestamptz default now(),

  unique (tenant_id, id)
);

create index idx_protocols_tenant on drreach.protocols(tenant_id, status);

create table drreach.protocol_versions (
  id bigserial primary key,
  tenant_id text not null,

  protocol_id bigint not null,
  version int not null,

  logic_graph jsonb not null,
  status text not null check (status in ('draft','pending','approved','deprecated')) default 'draft',

  created_at timestamptz default now(),
  created_by_iam_user_id text,

  unique (tenant_id, protocol_id, version),

  constraint fk_protocol_versions_protocol_tenant
    foreign key (tenant_id, protocol_id)
    references drreach.protocols(tenant_id, id)
    on delete cascade
);

create index idx_protocol_versions_status on drreach.protocol_versions(tenant_id, protocol_id, status);

create table drreach.protocol_triggers (
  tenant_id text not null,
  protocol_id bigint not null,
  symptom_id uuid not null references drreach.symptoms(id),

  primary key (tenant_id, protocol_id, symptom_id),

  constraint fk_triggers_protocol_tenant
    foreign key (tenant_id, protocol_id)
    references drreach.protocols(tenant_id, id)
    on delete cascade
);

create index idx_protocol_trigger_symptom on drreach.protocol_triggers(symptom_id);

commit;
