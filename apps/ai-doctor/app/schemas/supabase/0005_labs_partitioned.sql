begin;

create table drreach.patient_labs (
  id uuid default gen_random_uuid(),
  tenant_id text not null,

  profile_id uuid not null,

  test_name text not null,
  loinc_code text,
  specimen_source text check (specimen_source in ('blood','serum','urine','csf','stool','saliva')),

  attachment_object_key text,
  attachment_content_type text,
  attachment_sha256 text,

  reported_value float,
  reported_unit text,
  conversion_factor float,

  normalized_value float,
  normalized_unit text,

  ref_low float,
  ref_high float,

  patient_age_at_test int,
  patient_sex_at_test text,

  is_abnormal boolean generated always as (
    (normalized_value is not null) and (
      (ref_low is not null and normalized_value < ref_low) or
      (ref_high is not null and normalized_value > ref_high)
    )
  ) stored,

  provenance text not null check (provenance in ('self_reported','clinician_verified','imported_record','system_inferred'))
    default 'imported_record',
  verification_status text not null check (verification_status in ('unconfirmed','verified','rejected'))
    default 'unconfirmed',

  measured_at timestamptz not null default now(),

  primary key (id, measured_at),

  constraint fk_labs_profile_tenant
    foreign key (tenant_id, profile_id)
    references drreach.profiles(tenant_id, id)
    on delete cascade
) partition by range (measured_at);

create index idx_labs_profile_date on drreach.patient_labs(profile_id, measured_at desc);
create index idx_labs_abnormal on drreach.patient_labs(profile_id, is_abnormal) where is_abnormal = true;

create table drreach.patient_labs_default partition of drreach.patient_labs default;

create table drreach.patient_labs_2025 partition of drreach.patient_labs
  for values from ('2025-01-01') to ('2026-01-01');

create table drreach.patient_labs_2026 partition of drreach.patient_labs
  for values from ('2026-01-01') to ('2027-01-01');

commit;
