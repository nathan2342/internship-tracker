-- =====================================================================
--  Internship Tracker - databaseoppsett for Supabase
--  Kjør hele filen i Supabase: SQL Editor -> New query -> lim inn -> Run.
--  Trygg å kjøre flere ganger (bruker "if not exists" / "drop policy if exists").
-- =====================================================================

-- Felles funksjon som holder updated_at oppdatert ved endringer.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) UKESOPPSUMMERINGER
-- ---------------------------------------------------------------------
create table if not exists public.weekly_summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_label  text not null,
  week_date   date,
  what_i_did  text,
  highlights  text,
  challenges  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) TING JEG HAR LÆRT
-- ---------------------------------------------------------------------
create table if not exists public.learnings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null default 'Annet',
  learned_date  date,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) DAGLIG / LØPENDE LOGG
-- ---------------------------------------------------------------------
create table if not exists public.daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date    date not null default current_date,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) FREMTIDIGE PROSJEKTER
-- ---------------------------------------------------------------------
create table if not exists public.future_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'idé',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5) PLAN FREMOVER (mål / oppgaver)
-- ---------------------------------------------------------------------
create table if not exists public.plan_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  due_date    date,
  is_done     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at-triggere
-- ---------------------------------------------------------------------
drop trigger if exists trg_weekly_updated on public.weekly_summaries;
create trigger trg_weekly_updated
  before update on public.weekly_summaries
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated on public.future_projects;
create trigger trg_projects_updated
  before update on public.future_projects
  for each row execute function public.set_updated_at();

-- =====================================================================
--  ROW LEVEL SECURITY
--  Hver bruker ser/endrer KUN sine egne rader (user_id = auth.uid()).
-- =====================================================================
alter table public.weekly_summaries enable row level security;
alter table public.learnings        enable row level security;
alter table public.daily_logs       enable row level security;
alter table public.future_projects  enable row level security;
alter table public.plan_items        enable row level security;

-- Hjelpe-uttrykk gjentas per tabell. Én policy per operasjon.

-- weekly_summaries
drop policy if exists "weekly_select" on public.weekly_summaries;
drop policy if exists "weekly_insert" on public.weekly_summaries;
drop policy if exists "weekly_update" on public.weekly_summaries;
drop policy if exists "weekly_delete" on public.weekly_summaries;
create policy "weekly_select" on public.weekly_summaries for select using (auth.uid() = user_id);
create policy "weekly_insert" on public.weekly_summaries for insert with check (auth.uid() = user_id);
create policy "weekly_update" on public.weekly_summaries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_delete" on public.weekly_summaries for delete using (auth.uid() = user_id);

-- learnings
drop policy if exists "learnings_select" on public.learnings;
drop policy if exists "learnings_insert" on public.learnings;
drop policy if exists "learnings_update" on public.learnings;
drop policy if exists "learnings_delete" on public.learnings;
create policy "learnings_select" on public.learnings for select using (auth.uid() = user_id);
create policy "learnings_insert" on public.learnings for insert with check (auth.uid() = user_id);
create policy "learnings_update" on public.learnings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learnings_delete" on public.learnings for delete using (auth.uid() = user_id);

-- daily_logs
drop policy if exists "daily_select" on public.daily_logs;
drop policy if exists "daily_insert" on public.daily_logs;
drop policy if exists "daily_update" on public.daily_logs;
drop policy if exists "daily_delete" on public.daily_logs;
create policy "daily_select" on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily_insert" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_update" on public.daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_delete" on public.daily_logs for delete using (auth.uid() = user_id);

-- future_projects
drop policy if exists "projects_select" on public.future_projects;
drop policy if exists "projects_insert" on public.future_projects;
drop policy if exists "projects_update" on public.future_projects;
drop policy if exists "projects_delete" on public.future_projects;
create policy "projects_select" on public.future_projects for select using (auth.uid() = user_id);
create policy "projects_insert" on public.future_projects for insert with check (auth.uid() = user_id);
create policy "projects_update" on public.future_projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete" on public.future_projects for delete using (auth.uid() = user_id);

-- plan_items
drop policy if exists "plan_select" on public.plan_items;
drop policy if exists "plan_insert" on public.plan_items;
drop policy if exists "plan_update" on public.plan_items;
drop policy if exists "plan_delete" on public.plan_items;
create policy "plan_select" on public.plan_items for select using (auth.uid() = user_id);
create policy "plan_insert" on public.plan_items for insert with check (auth.uid() = user_id);
create policy "plan_update" on public.plan_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plan_delete" on public.plan_items for delete using (auth.uid() = user_id);

-- Ferdig. Tabellene er klare og sikret med RLS.
