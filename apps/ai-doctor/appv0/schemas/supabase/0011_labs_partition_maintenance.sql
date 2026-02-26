begin;

create extension if not exists pg_cron;

create or replace function drreach.ensure_patient_labs_year_partition()
returns void
language plpgsql
as $$
declare
  y int;
  start_date date;
  end_date date;
  part_name text;
begin
  y := extract(year from (current_date + interval '1 year'))::int;
  start_date := make_date(y, 1, 1);
  end_date   := make_date(y + 1, 1, 1);
  part_name := format('patient_labs_%s', y);

  if to_regclass(format('drreach.%I', part_name)) is null then
    execute format(
      'create table drreach.%I partition of drreach.patient_labs for values from (%L) to (%L);',
      part_name,
      start_date::text,
      end_date::text
    );
  end if;
end;
$$;

-- Minimal scheduling: run daily at 03:00
select cron.schedule(
  'drreach_labs_partition_ensure',
  '0 3 * * *',
  $$select drreach.ensure_patient_labs_year_partition();$$
);

commit;
