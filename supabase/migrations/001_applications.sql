-- 001_applications.sql
-- Creates the applications table described in CLAUDE.md, locked down with Row-Level Security.

-- Status enum
create type public.application_status as enum (
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected'
);

-- Table
create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  company      text,
  role_title   text,
  location     text,
  salary_text  text,
  deadline     date,
  status       public.application_status not null default 'saved',
  job_url      text,
  visa_notes   text,
  requirements text[],
  notes        text,
  advert_text  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for "my applications, ordered by deadline" queries
create index applications_user_id_deadline_idx
  on public.applications (user_id, deadline);

-- Keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

-- Row-Level Security
alter table public.applications enable row level security;

-- Signed-in users only; anonymous visitors get no access at all
revoke all on public.applications from anon;
grant select, insert, update, delete on public.applications to authenticated;

create policy "Users can view their own applications"
  on public.applications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own applications"
  on public.applications
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own applications"
  on public.applications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own applications"
  on public.applications
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Defence in depth: enforce the advert size limit in the database too
alter table public.applications
  add constraint advert_text_max_length check (char_length(advert_text) <= 20000);