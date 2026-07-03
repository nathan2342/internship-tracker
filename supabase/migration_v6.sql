-- =====================================================================
--  Internship Tracker - Migrasjon v6
--  Legger til: storrelse (bredde/hoyde) pa notat-lapper, sa de kan
--  dras ut til onsket storrelse.
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Trygg a kjore flere ganger.
-- =====================================================================

alter table public.notes add column if not exists width  integer not null default 260;
alter table public.notes add column if not exists height integer not null default 220;

-- Ferdig. Lappene kan na endre storrelse.
