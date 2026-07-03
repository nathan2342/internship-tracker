-- =====================================================================
--  Internship Tracker - Migrasjon v5
--  Legger til: Tavle med flyttbare notat-lapper (farge, etiketter, bilder).
--  Inkluderer ogsa oppsett av bildelagring (Supabase Storage).
--  KJOR HELE denne filen i Supabase: SQL Editor -> New query -> Run.
--  Trygg a kjore flere ganger.
-- =====================================================================

-- 1) NOTES (lapper pa tavla) -------------------------------------------
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  internship_id uuid references public.internships (id) on delete cascade,
  content       text default '',
  color         text not null default 'yellow',
  tags          text[] not null default '{}',
  x             integer not null default 40,
  y             integer not null default 40,
  z             integer not null default 0,
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.notes enable row level security;
drop policy if exists "notes_select" on public.notes;
drop policy if exists "notes_insert" on public.notes;
drop policy if exists "notes_update" on public.notes;
drop policy if exists "notes_delete" on public.notes;
create policy "notes_select" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete" on public.notes for delete using (auth.uid() = user_id);

drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated
  before update on public.notes
  for each row execute function public.set_updated_at();

-- 2) BILDELAGRING (Supabase Storage) -----------------------------------
-- Lager et offentlig lesbart lagringsomrade for bilder pa tavla.
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

-- Kun innlogget bruker kan laste opp/endre/slette i SIN egen mappe
-- (mappenavn = bruker-id). Lesing er offentlig fordi bucketen er public.
drop policy if exists "note_images_insert" on storage.objects;
drop policy if exists "note_images_update" on storage.objects;
drop policy if exists "note_images_delete" on storage.objects;
create policy "note_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "note_images_update" on storage.objects for update to authenticated
  using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "note_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Ferdig. Tavla er klar, og bilder kan lastes opp.
