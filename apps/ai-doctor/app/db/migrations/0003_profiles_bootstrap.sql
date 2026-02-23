begin;

create table if not exists drreach.profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,    -- IAM Tenant.id (cuid)
  iam_user_id text not null,  -- IAM User.id (cuid)

  -- Optional for now (bootstrap); make required later via enhancement ENH-012
  dob date,
  sex text check (sex in ('male','female','intersex')),
  weight_kg float,
  height_cm float,
  blood_type text check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  timezone text default 'UTC',
  preference_mode text default 'integrated',

  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- Uniqueness for active users (tenant-scoped)
create unique index if not exists idx_profiles_tenant_user_active
  on drreach.profiles(tenant_id, iam_user_id)
  where deleted_at is null;

create index if not exists idx_profiles_tenant on drreach.profiles(tenant_id);

-- Allows composite FK references later if you need them
alter table drreach.profiles
  add constraint uq_profiles_tenant_id unique (tenant_id, id);

commit;
