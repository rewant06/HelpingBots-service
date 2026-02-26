begin;

create schema if not exists drreach;

-- Needed for gen_random_uuid() default
create extension if not exists pgcrypto;

commit;
