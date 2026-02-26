begin;

create table drreach.audit_logs (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  tenant_id text not null,

  actor_iam_user_id text,
  actor_roles text[] default '{}',
  actor_snapshot jsonb,

  event_type text not null,
  entity_type text not null,
  entity_id uuid,

  correlation_id uuid,
  evidence jsonb
);

create index idx_audit_entity on drreach.audit_logs(entity_type, entity_id);
create index idx_audit_actor on drreach.audit_logs(actor_iam_user_id, occurred_at desc);

create table drreach.access_logs (
  id bigserial primary key,
  tenant_id text not null,
  actor_iam_user_id text,
  resource_type text,
  resource_id uuid,
  action text,
  timestamp timestamptz default now(),
  ip_address text
);

create index idx_access_tenant_time on drreach.access_logs(tenant_id, timestamp desc);

commit;
