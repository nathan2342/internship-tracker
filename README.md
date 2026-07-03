# Internship Tracker (PWA)

En Progressive Web App for å holde oversikt over internshipet ditt. Fungerer på
mobil og PC, kan installeres på hjemskjerm, og synkroniserer data mellom enheter
via Supabase.

**Teknologi:** React + Vite · Tailwind CSS · Supabase (database + auth) ·
vite-plugin-pwa · klar for Vercel.

**Seksjoner:** Dashboard · Ukesoppsummeringer · Ting jeg har lært · Daglig logg ·
Fremtidige prosjekter · Plan fremover. Lys/mørk modus inkludert.

---

## 1. Forutsetninger

- Node.js 18 eller nyere
- En Supabase-konto (gratis): https://supabase.com

## 2. Sett opp Supabase

1. Gå til https://supabase.com og lag et nytt prosjekt. Velg et passord for
   databasen og en region nær deg.
2. Vent til prosjektet er ferdig opprettet (ca. 1–2 min).
3. **Lag tabellene:** Åpne **SQL Editor** → **New query**, lim inn hele
   innholdet fra [`supabase/schema.sql`](supabase/schema.sql) og trykk **Run**.
   Dette oppretter alle tabeller og slår på Row Level Security slik at hver
   bruker kun ser sin egen data.
   - **Oppgradering (v2):** Har du allerede kjørt `schema.sql` fra før, kjør i
     tillegg [`supabase/migration_v2.sql`](supabase/migration_v2.sql). Den legger
     til flere internships, utvidede prosjekter (status/omfang/skills) og
     arbeidsoppføringer per uke. Trygg å kjøre flere ganger.
4. **Slå på e-post-innlogging:** Gå til **Authentication → Sign In / Providers**
   og bekreft at **Email** er aktivert (det er det som standard). Appen bruker
   passordløs innlogging (magic link), så ingen ekstra oppsett trengs.
5. **Sett tillatte URL-er:** Gå til **Authentication → URL Configuration**.
   - Sett **Site URL** til `http://localhost:5173` mens du utvikler.
   - Legg til både `http://localhost:5173` og (senere) Vercel-URL-en din under
     **Redirect URLs**.

## 3. Hent API-nøklene dine

Gå til **Project Settings → API** og kopier:

- **Project URL** (ser ut som `https://xxxx.supabase.co`)
- **anon / public** nøkkelen

Lag deretter en `.env`-fil i prosjektmappen (kopier fra `.env.example`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-public-key
```

> `.env` er allerede i `.gitignore` og blir aldri sjekket inn. anon-nøkkelen er
> ment å brukes i nettleseren – sikkerheten ligger i Row Level Security.

## 4. Kjør appen lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:5173. Skriv inn e-posten din, trykk «Send
innloggingslenke», og åpne lenken du får på e-post **på samme enhet**. Du er nå
logget inn, og samme bruker ser samme data på alle enheter.

## 5. Installer som app (PWA)

- **Mobil (Chrome/Safari):** Åpne siden → del-/menyknapp → «Legg til på
  Hjem-skjerm».
- **PC (Chrome/Edge):** Installer-ikonet i adresselinjen.

PWA-en fungerer best på en bygget versjon. Test gjerne med:

```bash
npm run build
npm run preview
```

## 6. Deploy til Vercel

1. Push prosjektet til et Git-repo (GitHub/GitLab/Bitbucket).
2. Gå til https://vercel.com → **Add New… → Project** → importer repoet.
3. Vercel oppdager Vite automatisk:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Under **Environment Variables**, legg til de samme to nøklene:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Trykk **Deploy**.
6. Etter deploy: kopier Vercel-URL-en og legg den til i Supabase under
   **Authentication → URL Configuration** (både som Site URL og Redirect URL),
   slik at innloggingslenkene peker til riktig sted i produksjon.

`vercel.json` sørger allerede for at klient-routing (SPA) fungerer.

---

## Prosjektstruktur

```
src/
  components/   Layout, Login, ikoner, gjenbrukbare UI-komponenter
  context/      Auth- og tema-context (lys/mørk)
  hooks/        useCollection – generisk CRUD mot Supabase
  lib/          supabase-klient + dato-hjelpere
  pages/        Dashboard, Uker, Lært, Logg, Prosjekter, Plan
supabase/
  schema.sql    Tabeller + Row Level Security
```
