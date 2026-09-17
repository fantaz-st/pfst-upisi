# PFST Upisi — Production Database Schema

**Source of truth for the `public` schema.** Generated from `information_schema.columns`
and `pg_policies` on 2026-09-17.

> **Agents: read this file, not `supabase/schema.sql`.** That file is a stale snapshot
> from early development and is missing most tables and columns listed here.

**Not captured below:** foreign keys, primary keys, unique constraints, indexes,
triggers and functions. Do not assume a constraint exists. In particular, uniqueness
of `applications.oib` per intake is enforced **in application code only**, not by the
database.

---

## intakes

An "upisni rok" — one admissions round. `form_type` drives all flow branching.

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| slug | text | NO | |
| title | text | NO | |
| short_description | text | YES | |
| academic_year | text | NO | |
| is_visible | boolean | NO | true |
| is_open | boolean | NO | false |
| opens_at | timestamptz | YES | |
| closes_at | timestamptz | YES | |
| sort_order | integer | NO | 0 |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | YES | |
| study_level | text | YES | |
| diplomski_period_from | text | YES | |
| diplomski_period_to | text | YES | |
| form_type | text | YES | 'upis_pd' |

`form_type` is one of `upis_pd`, `prijava_d`, `upis_d` (see `src/lib/applications/config.js`).
`study_level` is the older two-way split (`prijediplomski` / `diplomski`) and is being
phased out — **branch on `form_type`, not `study_level`**.

## applications

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| intake_id | uuid | NO | |
| application_number | text | YES | |
| status | text | NO | 'submitted' |
| first_name | text | NO | |
| last_name | text | NO | |
| email | text | NO | |
| phone | text | YES | |
| oib | text | YES | |
| birth_date | date | YES | |
| citizenship | text | YES | |
| address | text | YES | |
| city | text | YES | |
| postal_code | text | YES | |
| previous_institution | text | YES | |
| previous_program | text | YES | |
| previous_completion_year | text | YES | |
| previous_study_institution | text | YES | |
| notes | text | YES | |
| program | text | YES | |
| study_type | text | YES | |
| enrollment_type | smallint | YES | |
| birth_place | text | YES | |
| gender | text | YES | |
| marital_status | text | YES | |
| father_name | text | YES | |
| father_occupation | text | YES | |
| father_address | text | YES | |
| mother_name | text | YES | |
| mother_occupation | text | YES | |
| mother_address | text | YES | |
| other_education | text | YES | |
| ranking_score | text | YES | |
| jmbag | text | YES | |
| deleted_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |
| submitted_at | timestamptz | NO | now() |
| updated_at | timestamptz | YES | |

**There is no `country` column.** Nationality lives in `citizenship`.
Deletes are soft — always filter `.is("deleted_at", null)` on candidate-facing reads.

## application_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | NO | |
| document_type | text | NO | |
| file_path | text | NO | |
| file_name | text | NO | |
| mime_type | text | YES | |
| size_bytes | bigint | YES | |
| uploaded_at | timestamptz | NO | now() |

Files live in the Storage bucket `application-documents` (hardcoded in the app; the
`SUPABASE_BUCKET` env var is unused and should be deleted).

## application_edit_tokens

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | YES | |
| token | text | NO | encode(gen_random_bytes(32), 'hex') |
| message | text | YES | |
| expires_at | timestamptz | NO | |
| used_at | timestamptz | YES | |
| created_at | timestamptz | YES | now() |

## application_notes

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | NO | |
| admin_id | uuid | YES | |
| note | text | NO | |
| created_at | timestamptz | NO | now() |

## application_events

Audit trail.

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | NO | |
| event_type | text | NO | |
| old_value | text | YES | |
| new_value | text | YES | |
| message | text | YES | |
| created_by | uuid | YES | |
| created_at | timestamptz | NO | now() |

## enrollments

The `upis_d` flow. One row per accepted application; accessed publicly by `token`.

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | YES | |
| intake_id | uuid | NO | |
| token | text | NO | encode(gen_random_bytes(32), 'hex') |
| token_expires_at | timestamptz | YES | |
| token_used_at | timestamptz | YES | |
| enrollment_type | smallint | YES | |
| selected_courses_s1 | jsonb | YES | '[]' |
| selected_courses_s2 | jsonb | YES | '[]' |
| jmbag | text | YES | |
| gender | text | YES | |
| birth_place | text | YES | |
| marital_status | text | YES | |
| father_name | text | YES | |
| father_occupation | text | YES | |
| father_address | text | YES | |
| mother_name | text | YES | |
| mother_occupation | text | YES | |
| mother_address | text | YES | |
| status | text | NO | 'pending' |
| submitted_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |

`status` observed in code: `pending`, `submitted`, `confirmed`.
The 64-char hex `token` is the **only** access control on this row — there is no login
on the enrollment form.

## elective_courses

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| intake_id | uuid | NO | |
| program | text | NO | |
| semester | smallint | NO | |
| name | text | NO | |
| instructor | text | YES | |
| credits | integer | NO | 0 |
| sort_order | integer | NO | 0 |
| created_at | timestamptz | NO | now() |

## elective_requirements

Minimum ECTS per (intake, program, semester).

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| intake_id | uuid | NO | |
| program | text | NO | |
| semester | smallint | NO | |
| min_credits | integer | NO | 0 |

## intake_eligible_candidates

Razredbeni list. If an intake has **any** row here, the gate is active and an OIB must
match on `(program, study_type)` to apply. No rows = gate disabled for that intake.

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| intake_id | uuid | YES | |
| program | text | NO | |
| study_type | text | NO | |
| oib | text | NO | |
| first_name | text | YES | |
| last_name | text | YES | |
| email | text | YES | |
| created_at | timestamptz | YES | now() |

## intake_admins

Join table — which admin may access which intake.

| column | type | null | default |
|---|---|---|---|
| intake_id | uuid | NO | |
| user_id | uuid | NO | |

## admin_roles

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | |
| role | text | NO | |
| email | text | YES | |
| created_at | timestamptz | YES | now() |

`role` is `super_admin` or anything else (treated as scoped admin). See
`src/lib/admin/permissions.js`.

## admin_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | |
| full_name | text | NO | |
| role | text | NO | 'admin' |
| created_at | timestamptz | NO | now() |

Appears to predate `admin_roles`. Verify before relying on it.

---

## Row Level Security — current state

**RLS ENABLED:** `intakes`, `applications_events`*, `application_notes`,
`admin_profiles`
(*table name is `application_events`)

**RLS DISABLED — readable and writable by anyone holding the public anon key:**
`applications`, `application_documents`, `application_edit_tokens`, `enrollments`,
`elective_courses`, `elective_requirements`, `intake_eligible_candidates`,
`intake_admins`, `admin_roles`

### Existing policies

| table | policy | cmd | using / with check |
|---|---|---|---|
| intakes | Public can read visible intakes | SELECT | `is_visible = true` |
| intakes | Public read visible intakes | SELECT | `is_visible = true` (duplicate) |
| intakes | Admins full access intakes | ALL | `auth.role() = 'authenticated'` |
| applications | Admins read all applications | SELECT | `auth.role() = 'authenticated'` |
| applications | Admins update applications | UPDATE | `auth.role() = 'authenticated'` |
| applications | Service role insert applications | INSERT | `with check (true)` |
| application_documents | Admins read documents | SELECT | `auth.role() = 'authenticated'` |
| application_documents | Service role insert documents | INSERT | `with check (true)` |
| application_notes | Admins manage notes | ALL | `auth.role() = 'authenticated'` |
| application_events | Admins manage events | ALL | `auth.role() = 'authenticated'` |
| admin_profiles | Admins read profiles | SELECT | `auth.role() = 'authenticated'` |

All policies are granted to the `public` role, which **includes `anon`**. The two
`with check (true)` INSERT policies would therefore allow anonymous inserts the moment
RLS is switched on for those tables. They must be dropped, not left in place.

`intakes` has a duplicated public-read policy — harmless, but one should be dropped.

---

## Client usage (why RLS is currently off)

- `createClient()` — `src/lib/supabase/server.js`, **anon key**, respects RLS
- `createAdminClient()` — `src/lib/supabase/admin.js`, **service role key**, bypasses RLS

Every public, unauthenticated path currently uses `createClient()`:
`submitApplication`, `submitDiplomskiApplication`, `uploadDocuments` and the
`application_edit_tokens` flows in `src/lib/applications/actions.js`; the direct
token query in `src/app/prijava/uredi/[token]/page.jsx`; and `getElectiveCourses` /
`getElectiveRequirements` in `src/lib/intakes/actions.js`.

Those must move to `createAdminClient()` before RLS is enabled, or the public forms
break. `src/lib/enrollments/actions.js` already follows the correct pattern.

`src/lib/admin/permissions.js` must **stay** on `createClient()` — it depends on the
logged-in session.

Note: document upload in `ApplicationForm.jsx` / `ApplicationFormD.jsx` happens
**client-side in the browser** against Storage. Storage policies are separate from
table RLS and are not covered here.
