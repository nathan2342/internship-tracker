-- =====================================================================
--  Internship Tracker - Migrasjon v3
--  Legger til: gjoremal (to-do's) knyttet til hvert prosjekt.
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Trygg a kjore flere ganger.
-- =====================================================================

create table if not exists public.project_todos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  internship_id uuid references public.internships (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  title         text not null,
  is_done       boolean not null default false,
  due_date      date,
  created_at    timestamptz not null default now()
);

alter table public.project_todos enable row level security;
drop policy if exists "project_todos_select" on public.project_todos;
drop policy if exists "project_todos_insert" on public.project_todos;
drop policy if exists "project_todos_update" on public.project_todos;
drop policy if exists "project_todos_delete" on public.project_todos;
create policy "project_todos_select" on public.project_todos for select using (auth.uid() = user_id);
create policy "project_todos_insert" on public.project_todos for insert with check (auth.uid() = user_id);
create policy "project_todos_update" on public.project_todos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "project_todos_delete" on public.project_todos for delete using (auth.uid() = user_id);

-- Ferdig. Prosjekter kan na ha gjoremal, og du kan se alle samlet i appen.
