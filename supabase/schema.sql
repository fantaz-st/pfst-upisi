-- ============================================================
-- PFST Upisi — Supabase Schema
-- Run this in Supabase SQL editor
-- ============================================================

-- INTAKES
create table if not exists intakes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  academic_year text not null,
  is_visible boolean not null default true,
  is_open boolean not null default false,
  opens_at timestamptz,
  closes_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- APPLICATIONS
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references intakes(id) on delete restrict,
  application_number text unique,
  status text not null default 'submitted',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  oib text,
  birth_date date,
  citizenship text,
  address text,
  city text,
  postal_code text,
  previous_institution text,
  previous_program text,
  previous_completion_year text,
  notes text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz
);

-- APPLICATION DOCUMENTS
create table if not exists application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  document_type text not null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);

-- APPLICATION NOTES
create table if not exists application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  admin_id uuid references auth.users(id),
  note text not null,
  created_at timestamptz not null default now()
);

-- APPLICATION EVENTS (audit)
create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  event_type text not null,
  old_value text,
  new_value text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ADMIN PROFILES
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into intakes (slug, title, short_description, academic_year, is_visible, is_open, sort_order)
values
  ('prijediplomski', 'Prijediplomski studij', 'Prijava za upis na prijediplomski studij.', '2026./2027.', true, true, 1),
  ('diplomski', 'Diplomski studij', 'Prijava za upis na diplomski studij.', '2026./2027.', true, false, 2)
on conflict (slug) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table intakes enable row level security;
alter table applications enable row level security;
alter table application_documents enable row level security;
alter table application_notes enable row level security;
alter table application_events enable row level security;
alter table admin_profiles enable row level security;

-- INTAKES: Public can read visible intakes
create policy "Public read visible intakes"
  on intakes for select
  using (is_visible = true);

-- INTAKES: Admins can do everything
create policy "Admins full access intakes"
  on intakes for all
  using (auth.role() = 'authenticated');

-- APPLICATIONS: Public insert (handled server-side via service role)
-- For server actions use service role key; this allows authenticated admins to read all
create policy "Admins read all applications"
  on applications for select
  using (auth.role() = 'authenticated');

create policy "Admins update applications"
  on applications for update
  using (auth.role() = 'authenticated');

-- Allow server-side inserts (use service role in server actions)
create policy "Service role insert applications"
  on applications for insert
  with check (true);

-- APPLICATION DOCUMENTS
create policy "Admins read documents"
  on application_documents for select
  using (auth.role() = 'authenticated');

create policy "Service role insert documents"
  on application_documents for insert
  with check (true);

-- APPLICATION NOTES
create policy "Admins manage notes"
  on application_notes for all
  using (auth.role() = 'authenticated');

-- APPLICATION EVENTS
create policy "Admins manage events"
  on application_events for all
  using (auth.role() = 'authenticated');

-- ADMIN PROFILES
create policy "Admins read profiles"
  on admin_profiles for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET
-- Create manually in Supabase dashboard or via CLI:
-- Bucket name: application-documents
-- Public: false (private)
-- ============================================================
