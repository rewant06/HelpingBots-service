begin;

create schema if not exists drreach;

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_cron;

commit;
