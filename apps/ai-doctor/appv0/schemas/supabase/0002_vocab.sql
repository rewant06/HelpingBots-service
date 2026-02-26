begin;

create table drreach.drug_classes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table drreach.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  drug_class_id uuid references drreach.drug_classes(id),
  atc_code text,
  snomed_code text
);

create index idx_ingredients_class on drreach.ingredients(drug_class_id);

create table drreach.drugs (
  id uuid primary key default gen_random_uuid(),
  brand_name text,
  generic_name_id uuid not null references drreach.ingredients(id),
  form text not null,
  route text not null,
  strength_value float not null,
  strength_unit text not null,
  is_controlled boolean default false,
  unique (brand_name, generic_name_id, form, route, strength_value, strength_unit)
);

create index idx_drugs_generic on drreach.drugs(generic_name_id);

create table drreach.drug_interactions (
  id uuid primary key default gen_random_uuid(),
  drug_a_id uuid not null references drreach.ingredients(id),
  drug_b_id uuid not null references drreach.ingredients(id),
  severity text not null check (severity in ('mild','moderate','severe','contraindicated')),
  description text not null,
  check (drug_a_id <> drug_b_id)
);

create unique index uq_interactions_pair
  on drreach.drug_interactions(least(drug_a_id, drug_b_id), greatest(drug_a_id, drug_b_id));

create table drreach.conditions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  icd_10_code text unique,
  parent_id uuid references drreach.conditions(id),
  embedding vector(768)
);

create index idx_condition_hnsw on drreach.conditions using hnsw (embedding vector_cosine_ops);

create table drreach.disease_contraindications (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references drreach.ingredients(id),
  condition_icd10_prefix text not null,
  severity text not null check (severity in ('caution','contraindicated')),
  reason text
);

create index idx_contra_ingredient on drreach.disease_contraindications(ingredient_id);
create index idx_contra_icd_prefix on drreach.disease_contraindications(condition_icd10_prefix);

create table drreach.symptoms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  body_part text,
  system text,
  synonyms text[],
  embedding vector(768)
);

create index idx_symptom_hnsw on drreach.symptoms using hnsw (embedding vector_cosine_ops);

commit;
