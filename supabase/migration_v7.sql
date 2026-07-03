-- =====================================================================
--  Internship Tracker - Migrasjon v7
--  Legger til: sortering (position) pa gjoremal, sa de kan flyttes
--  og gjores om til undergjoremal ved dra-og-slipp.
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Trygg a kjore flere ganger.
-- =====================================================================

alter table public.project_todos
  add column if not exists position integer not null default 0;

-- Ferdig. Gjoremal kan na sorteres og flyttes.
