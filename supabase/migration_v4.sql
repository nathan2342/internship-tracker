-- =====================================================================
--  Internship Tracker - Migrasjon v4
--  Legger til: under-gjoremal (parent_id pa project_todos).
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Trygg a kjore flere ganger.
-- =====================================================================

alter table public.project_todos
  add column if not exists parent_id uuid
  references public.project_todos (id) on delete cascade;

-- Ferdig. Et gjoremal kan na ha under-gjoremal.
