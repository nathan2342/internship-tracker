-- =====================================================================
--  Internship Tracker - Migrasjon v2
--  Legger til:
--    * Flere internships (du kan opprette og bytte mellom dem)
--    * Utvidet "projects" (status, omfang, beskrivelse, skills)
--    * Arbeidsoppforinger per uke, koblet til prosjekt
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Den er trygg a kjore flere ganger.
-- =====================================================================

-- 1) INTERNSHIPS -------------------------------------------------------
create table if not exists public.internships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  start_date  date,
  created_at  timestamptz not null default now()
);

alter table public.internships enable row level security;
drop policy if exists "internships_select" on public.internships;
drop policy if exists "internships_insert" on public.internships;
drop policy if exists "internships_update" on public.internships;
drop policy if exists "internships_delete" on public.internships;
create policy "internships_select" on public.internships for select using (auth.uid() = user_id);
create policy "internships_insert" on public.internships for insert with check (auth.uid() = user_id);
create policy "internships_update" on public.internships for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "internships_delete" on public.internships for delete using (auth.uid() = user_id);

-- Lag ett standard-internship for brukere som allerede har data.
insert into public.internships (user_id, name)
select distinct user_id, 'Mitt internship'
from (
  select user_id from public.weekly_summaries
  union select user_id from public.learnings
  union select user_id from public.daily_logs
  union select user_id from public.future_projects
  union select user_id from public.plan_items
) u
where not exists (select 1 from public.internships i where i.user_id = u.user_id);

-- 2) PROSJEKTER (gjor om future_projects -> projects) ------------------
do $$
begin
  if to_regclass('public.future_projects') is not null
     and to_regclass('public.projects') is null then
    alter table public.future_projects rename to projects;
  end if;
end $$;

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'Idé',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects add column if not exists scope text;                 -- Liten / Middels / Stor
alter table public.projects add column if not exists skills text[] not null default '{}';
alter table public.projects alter column status set default 'Idé';

-- Map gamle status-verdier til nye.
update public.projects set status = case status
  when 'idé'      then 'Idé'
  when 'planlagt' then 'Ikke begynt'
  when 'pågår'    then 'Pågår'
  when 'ferdig'   then 'Ferdig'
  else status
end;

alter table public.projects enable row level security;
drop policy if exists "projects_select" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;
create policy "projects_select" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete" on public.projects for delete using (auth.uid() = user_id);

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 3) internship_id pa alle eksisterende tabeller -----------------------
alter table public.weekly_summaries add column if not exists internship_id uuid references public.internships (id) on delete cascade;
alter table public.learnings        add column if not exists internship_id uuid references public.internships (id) on delete cascade;
alter table public.daily_logs       add column if not exists internship_id uuid references public.internships (id) on delete cascade;
alter table public.projects         add column if not exists internship_id uuid references public.internships (id) on delete cascade;
alter table public.plan_items       add column if not exists internship_id uuid references public.internships (id) on delete cascade;

-- Backfill: knytt eksisterende rader til brukerens forste internship.
update public.weekly_summaries t set internship_id = (select i.id from public.internships i where i.user_id = t.user_id order by i.created_at limit 1) where t.internship_id is null;
update public.learnings        t set internship_id = (select i.id from public.internships i where i.user_id = t.user_id order by i.created_at limit 1) where t.internship_id is null;
update public.daily_logs       t set internship_id = (select i.id from public.internships i where i.user_id = t.user_id order by i.created_at limit 1) where t.internship_id is null;
update public.projects         t set internship_id = (select i.id from public.internships i where i.user_id = t.user_id order by i.created_at limit 1) where t.internship_id is null;
update public.plan_items       t set internship_id = (select i.id from public.internships i where i.user_id = t.user_id order by i.created_at limit 1) where t.internship_id is null;

-- 4) ARBEIDSOPPFORINGER PER UKE (knyttet til prosjekt) -----------------
create table if not exists public.week_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  internship_id uuid references public.internships (id) on delete cascade,
  week_id       uuid not null references public.weekly_summaries (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete set null,
  description   text not null,
  created_at    timestamptz not null default now()
);

alter table public.week_entries enable row level security;
drop policy if exists "week_entries_select" on public.week_entries;
drop policy if exists "week_entries_insert" on public.week_entries;
drop policy if exists "week_entries_update" on public.week_entries;
drop policy if exists "week_entries_delete" on public.week_entries;
create policy "week_entries_select" on public.week_entries for select using (auth.uid() = user_id);
create policy "week_entries_insert" on public.week_entries for insert with check (auth.uid() = user_id);
create policy "week_entries_update" on public.week_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "week_entries_delete" on public.week_entries for delete using (auth.uid() = user_id);

-- Ferdig. Appen er na klar for flere internships, prosjekter og arbeid per uke.
