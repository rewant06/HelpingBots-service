begin;

create table drreach.patient_tenant_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  profile_id uuid not null,

  relationship text not null check (relationship in ('primary_provider','lab_partner')),
  created_at timestamptz default now(),

  unique (tenant_id, profile_id, relationship),

  constraint fk_ptl_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
);

create index idx_ptl_profile on drreach.patient_tenant_links(profile_id);
create index idx_ptl_tenant on drreach.patient_tenant_links(tenant_id);

create table drreach.patient_access_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  profile_tenant_id text not null, -- explicit to enforce correct FK

  granted_to_tenant_id text not null,
  granted_to_clinician_id uuid, -- FK added after clinicians

  reason text not null check (reason in ('appointment','referral','patient_share')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,

  created_by_iam_user_id text,
  created_at timestamptz default now(),

  constraint fk_grant_profile_tenant
    foreign key (profile_tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade,

  check (ends_at > starts_at)
);

create index idx_grants_profile on drreach.patient_access_grants(profile_id, starts_at desc);
create index idx_grants_tenant on drreach.patient_access_grants(granted_to_tenant_id, starts_at desc);

commit;
