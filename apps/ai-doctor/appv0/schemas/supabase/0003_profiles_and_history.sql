begin;

create table drreach.profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,    -- IAM Tenant.id (cuid)
  iam_user_id text not null,  -- IAM User.id (cuid)

  dob date not null,
  sex text check (sex in ('male','female','intersex')),
  weight_kg float,
  height_cm float,
  blood_type text check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  timezone text default 'UTC',
  preference_mode text default 'integrated',

  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- Uniqueness for active users
create unique index idx_profiles_user_active
  on drreach.profiles(iam_user_id)
  where deleted_at is null;

-- Tenant boundary support
create index idx_profiles_tenant on drreach.profiles(tenant_id);

-- Allows composite FK references (tenant_id, id)
alter table drreach.profiles
  add constraint uq_profiles_tenant_id unique (tenant_id, id);

create table drreach.relationship_types (
  id int generated always as identity primary key,
  name text unique not null,
  genetic_share_percentage float
);

create table drreach.family_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,
  condition_id uuid references drreach.conditions(id),
  relationship_type_id int references drreach.relationship_types(id),

  age_at_onset int,
  is_cause_of_death boolean default false,
  age_at_death int,

  note text,

  provenance text not null check (provenance in ('self_reported','clinician_verified','imported_record','system_inferred'))
    default 'self_reported',
  verification_status text not null check (verification_status in ('unconfirmed','verified','rejected'))
    default 'unconfirmed',

  deleted_at timestamptz,

  constraint fk_family_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
);

create index idx_family_profile on drreach.family_history(profile_id);
create index idx_family_condition on drreach.family_history(condition_id);
create index idx_family_tenant_profile on drreach.family_history(tenant_id, profile_id);

create table drreach.non_drug_allergens (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text check (category in ('food','environment','biologic','material')),
  snomed_code text
);

create table drreach.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,

  drug_class_id uuid references drreach.drug_classes(id),
  specific_ingredient_id uuid references drreach.ingredients(id),
  non_drug_allergen_id uuid references drreach.non_drug_allergens(id),

  severity text check (severity in ('mild','moderate','severe','life_threatening')),
  reaction text,

  provenance text not null check (provenance in ('self_reported','clinician_verified','imported_record','system_inferred'))
    default 'self_reported',
  verification_status text not null check (verification_status in ('unconfirmed','verified','rejected'))
    default 'unconfirmed',
  status text check (status in ('active','resolved','inactive')) default 'active',

  deleted_at timestamptz,

  check (
    (drug_class_id is not null)::int +
    (specific_ingredient_id is not null)::int +
    (non_drug_allergen_id is not null)::int = 1
  ),

  constraint fk_allergy_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
);

create index idx_allergy_profile on drreach.patient_allergies(profile_id);
create index idx_allergy_profile_active on drreach.patient_allergies(tenant_id, profile_id) where status='active' and deleted_at is null;
create index idx_allergy_drug_class on drreach.patient_allergies(drug_class_id);
create index idx_allergy_ingredient on drreach.patient_allergies(specific_ingredient_id);

create table drreach.patient_medications (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,
  drug_id uuid references drreach.drugs(id),

  dose_value float not null,
  dose_unit text not null,

  frequency_type text check (frequency_type in ('daily','weekly','monthly','prn','hourly')),
  frequency_interval int,

  timing_instruction text,
  route text not null,

  status text check (status in ('active','on_hold','discontinued')) default 'active',
  start_date date default current_date,
  end_date date,
  prescribed_by text,

  provenance text not null check (provenance in ('self_reported','clinician_verified','imported_record','system_inferred'))
    default 'self_reported',
  verification_status text not null check (verification_status in ('unconfirmed','verified','rejected'))
    default 'unconfirmed',

  constraint fk_meds_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
);

create index idx_meds_profile_status on drreach.patient_medications(profile_id, status);
create index idx_meds_profile_active on drreach.patient_medications(tenant_id, profile_id) where status='active';
create index idx_meds_drug on drreach.patient_medications(drug_id);

create table drreach.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,
  condition_id uuid not null references drreach.conditions(id),

  icd10_code text,
  status text not null check (status in ('active','resolved','inactive')) default 'active',
  start_date date,
  end_date date,

  risk_tier text not null check (risk_tier in ('low','moderate','high','critical')) default 'moderate',

  provenance text not null check (provenance in ('self_reported','clinician_verified','imported_record','system_inferred'))
    default 'self_reported',
  verification_status text not null check (verification_status in ('unconfirmed','verified','rejected'))
    default 'unconfirmed',

  note text,
  created_at timestamptz default now(),
  deleted_at timestamptz,

  constraint fk_conditions_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
);

create index idx_patient_conditions_profile_active
  on drreach.patient_conditions(tenant_id, profile_id)
  where deleted_at is null and status='active';

create index idx_patient_conditions_condition on drreach.patient_conditions(condition_id);
create index idx_patient_conditions_icd10 on drreach.patient_conditions(icd10_code);

commit;
