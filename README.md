# PFST Upisi — Sustav prijava

Sustav prijava za upis na Pomorski fakultet Split.

## Tech stack

- Next.js 14 (App Router)
- MUI v6
- Supabase (Auth, Postgres, Storage)
- React Hook Form + Zod

## Postavljanje

### 1. Kloniraj i instaliraj

```bash
npm install
```

### 2. Supabase projekt

1. Kreiraj novi projekt na [supabase.com](https://supabase.com)
2. U SQL editoru pokreni `supabase/schema.sql`
3. U Storage kreiraj privatni bucket pod nazivom `application-documents`
4. Kreiraj admin korisnika u Authentication → Users

### 3. Environment varijable

Kopiraj `.env.local.example` u `.env.local` i popuni:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Pokretanje

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000)

---

## Rute

| Ruta | Opis |
|------|------|
| `/` | Naslovnica s karticama upisa |
| `/prijava/prijediplomski` | Obrazac za prijediplomski |
| `/prijava/diplomski` | Obrazac za diplomski |
| `/prijava/uspjesno` | Stranica uspjeha |
| `/admin` | Admin prijava |
| `/admin/prijave` | Lista prijava |
| `/admin/prijave/[id]` | Detalji prijave |
| `/admin/upisi` | Upravljanje upisima |

## Upravljanje upisima

Admin može otvarati/zatvarati prijave na `/admin/upisi` bez ikakvog mijenjanja koda — samo Toggle prekidači u tablici.

## Dodavanje novog upisa

1. U Supabase dodaj redak u tablicu `intakes`
2. U `src/lib/applications/config.js` dodaj konfiguraciju za novi slug
3. Sve ostalo funkcionira automatski

## Struktura projekta

```
src/
  app/                    # Next.js App Router stranice
  components/
    landing/              # Kartice upisa
    application/          # Obrazac prijave, upload dokumenata
    admin/                # Admin komponente
    layout/               # Header, Footer
  lib/
    supabase/             # Client/server helperi
    intakes/              # Queries i actions za upise
    applications/         # Config, validacija, actions
  theme/                  # MUI tema
```
