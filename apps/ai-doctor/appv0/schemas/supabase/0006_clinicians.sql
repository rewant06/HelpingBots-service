begin;

create table drreach.clinicians (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  iam_user_id text unique not null,

  full_name text not null,
  specialization text not null,

  reg_no text not null,
  reg_council text,
  institution_name text,

  status text not null check (status in ('active','inactive','suspended')) default 'active',
  verification_status text not null check (verification_status in ('unverified','pending','verified','rejected')) default 'pending',
  verified_at timestamptz,
  verified_by_iam_user_id text,

  created_at timestamptz default now()
);

create unique index idx_clinicians_reg on drreach.clinicians(reg_no, reg_council);
create index idx_clinicians_tenant on drreach.clinicians(tenant_id);

-- Composite unique for tenant-safe referencing if needed later
alter table drreach.clinicians
  add constraint uq_clinicians_tenant_id unique (tenant_id, id);

-- Add FK to grants (same tenant as granted_to_tenant_id)
alter table drreach.patient_access_grants
  add constraint fk_grant_clinician
  foreign key (granted_to_tenant_id, granted_to_clinician_id)
  references drreach.clinicians(tenant_id, id);

commit;
