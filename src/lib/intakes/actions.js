"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleIntakeOpen(id, value) {
  const supabase = await createClient();
  const { error } = await supabase.from("intakes").update({ is_open: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi");
  return { success: true };
}

export async function toggleIntakeVisible(id, value) {
  const supabase = await createClient();
  const { error } = await supabase.from("intakes").update({ is_visible: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi");
  return { success: true };
}

export async function createIntake({
  title, academic_year, slug, study_level, form_type,
  short_description, sort_order, adminIds,
  diplomski_period_from, diplomski_period_to,
  elective_courses, elective_requirements,
}) {
  const supabase = await createClient();

  const { data: intake, error } = await supabase
    .from("intakes")
    .insert({
      title, academic_year, slug, study_level,
      form_type: form_type || (study_level === "diplomski" ? "prijava_d" : "upis_pd"),
      short_description,
      sort_order: sort_order || 0,
      is_visible: false,
      is_open: false,
      ...(study_level === "diplomski" ? { diplomski_period_from, diplomski_period_to } : {}),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Dodaj admine
  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase
      .from("intake_admins")
      .insert(adminIds.map(user_id => ({ intake_id: intake.id, user_id })));
    if (adminError) return { error: adminError.message };
  }

  // Dodaj izborne predmete (samo za upis_d)
  if (form_type === "upis_d" && elective_courses?.length > 0) {
    const { error: courseError } = await supabase
      .from("elective_courses")
      .insert(elective_courses.map(c => ({ ...c, intake_id: intake.id })));
    if (courseError) return { error: courseError.message };
  }

  // Dodaj minimalne bodove (samo za upis_d)
  if (form_type === "upis_d" && elective_requirements?.length > 0) {
    const { error: reqError } = await supabase
      .from("elective_requirements")
      .insert(elective_requirements.map(r => ({ ...r, intake_id: intake.id })));
    if (reqError) return { error: reqError.message };
  }

  revalidatePath("/admin/upisi");
  return { success: true, intake };
}

/**
 * Zamijeni sve redove tablice `table` za dani intake novim setom `rows`.
 *
 * `rows === undefined || rows === null` znači "pozivatelj nije poslao ove
 * podatke" (npr. modal ih još nije učitao) — tablica se uopće ne dira, stari
 * redovi ostaju netaknuti. Prazan niz `[]` je i dalje tretiran kao namjerna
 * naredba "obriši sve", ali je poziv na pozivatelju da tu razliku pravi.
 *
 * Redoslijed je bitan: prvo se snimi id-jevi postojećih (starih) redova, pa
 * se umetnu novi, pa se tek onda obrišu stari — po njihovim snimljenim
 * id-jevima, ne po intake_id-u (novi redovi dijele isti intake_id, pa brisanje
 * po intake_id-u nakon inserta bi obrisalo i njih). Ako insert ne uspije, stari
 * redovi ostaju netaknuti umjesto da tablica ostane prazna.
 */
async function replaceElectiveRows(supabase, table, intakeId, rows) {
  if (rows === undefined || rows === null) return { error: null };

  const { data: existing, error: selectError } = await supabase
    .from(table)
    .select("id")
    .eq("intake_id", intakeId);
  if (selectError) return { error: selectError };
  const oldIds = (existing || []).map((r) => r.id);

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from(table)
      .insert(rows.map((r) => ({ ...r, intake_id: intakeId })));
    if (insertError) return { error: insertError };
  }

  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", oldIds);
    if (deleteError) return { error: deleteError };
  }

  return { error: null };
}

export async function updateIntake({
  id, title, academic_year, slug, study_level, form_type,
  short_description, sort_order, adminIds,
  diplomski_period_from, diplomski_period_to,
  elective_courses, elective_requirements,
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("intakes").update({
    title, academic_year, slug, study_level, form_type,
    short_description, sort_order,
    ...(study_level === "diplomski" ? { diplomski_period_from, diplomski_period_to } : {}),
  }).eq("id", id);

  if (error) return { error: error.message };

  // Refresh admins
  await supabase.from("intake_admins").delete().eq("intake_id", id);
  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase
      .from("intake_admins")
      .insert(adminIds.map(user_id => ({ intake_id: id, user_id })));
    if (adminError) return { error: adminError.message };
  }

  // Refresh izborni predmeti (samo za upis_d). elective_courses i
  // elective_requirements se diraju neovisno jedno o drugom, i samo ako ih je
  // pozivatelj stvarno poslao — vidi replaceElectiveRows.
  if (form_type === "upis_d") {
    const coursesResult = await replaceElectiveRows(supabase, "elective_courses", id, elective_courses);
    if (coursesResult.error) return { error: coursesResult.error.message };

    const requirementsResult = await replaceElectiveRows(supabase, "elective_requirements", id, elective_requirements);
    if (requirementsResult.error) return { error: requirementsResult.error.message };
  }

  revalidatePath("/admin/upisi");
  return { success: true };
}

export async function deleteIntake(id) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("intake_id", id);

  if (count > 0) {
    return { error: `Ne možete obrisati upis koji ima ${count} prijava. Prvo obrišite sve prijave.` };
  }

  const { error } = await supabase.from("intakes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi");
  return { success: true };
}

// Vraćaju { data, error } — pozivatelji koji podatke koriste samo za prikaz
// mogu se osloniti na `data || []`, ali IntakeFormModal mora znati kad je
// učitavanje stvarno propalo (da spremanje ne pošalje "prazno" kao da je to
// namjerna vrijednost — vidi replaceElectiveRows u updateIntake).
export async function getElectiveCourses(intakeId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elective_courses")
    .select("*")
    .eq("intake_id", intakeId)
    .order("program")
    .order("semester")
    .order("sort_order");
  return { data: data || [], error };
}

export async function getElectiveRequirements(intakeId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elective_requirements")
    .select("*")
    .eq("intake_id", intakeId);
  return { data: data || [], error };
}

/* ─────────────────────────────────────────────────────────────
   Liste kvalificiranih kandidata (razredbeni postupak / e-Škola)
   Koristi se za upis_pd — referada uploada listu OIB-a koji smiju
   podnijeti prijavu za pojedini program × vrstu studiranja.
   ─────────────────────────────────────────────────────────────── */

async function assertCanManageIntake(supabase, intakeId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { data: role } = await supabase.from("admin_roles").select("role").eq("user_id", user.id).single();
  if (role?.role === "super_admin") return { ok: true };

  const { data: assignment } = await supabase
    .from("intake_admins")
    .select("intake_id")
    .eq("user_id", user.id)
    .eq("intake_id", intakeId)
    .maybeSingle();
  if (!assignment) return { error: "Nemate pristup ovom upisu." };
  return { ok: true };
}

/**
 * Zamijeni listu OIB-a za točan (intake, program, study_type).
 * Prije umetanja obriše sve postojeće redove za taj trojac —
 * upload ponovno je overwrite, ne append.
 */
export async function uploadCandidateList({ intakeId, program, study_type, candidates }) {
  const supabase = await createClient();
  const auth = await assertCanManageIntake(supabase, intakeId);
  if (auth.error) return { error: auth.error };

  if (!intakeId || !program || !study_type) {
    return { error: "Nedostaju obvezni podaci (intake, studij, vrsta studiranja)." };
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { error: "Lista kandidata je prazna." };
  }

  // Normalizacija i deduplication OIB-a u dolaznom setu
  const seen = new Set();
  const rows = [];
  for (const c of candidates) {
    const oib = String(c.oib || "").replace(/\D/g, "");
    if (oib.length !== 11 || seen.has(oib)) continue;
    seen.add(oib);
    rows.push({
      intake_id: intakeId,
      program,
      study_type,
      oib,
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      email: c.email || null,
    });
  }
  if (rows.length === 0) return { error: "Nije pronađen nijedan valjani OIB (11 znamenki)." };

  // Overwrite: prvo obriši postojeći set za točan trojac
  const { error: delError } = await supabase
    .from("intake_eligible_candidates")
    .delete()
    .eq("intake_id", intakeId)
    .eq("program", program)
    .eq("study_type", study_type);
  if (delError) return { error: delError.message };

  const { error: insError } = await supabase.from("intake_eligible_candidates").insert(rows);
  if (insError) return { error: insError.message };

  revalidatePath("/admin/upisi");
  return { success: true, count: rows.length };
}

export async function deleteCandidateList({ intakeId, program, study_type }) {
  const supabase = await createClient();
  const auth = await assertCanManageIntake(supabase, intakeId);
  if (auth.error) return { error: auth.error };

  const { error } = await supabase
    .from("intake_eligible_candidates")
    .delete()
    .eq("intake_id", intakeId)
    .eq("program", program)
    .eq("study_type", study_type);
  if (error) return { error: error.message };

  revalidatePath("/admin/upisi");
  return { success: true };
}

/**
 * Vraća sažetak listi za intake — po jedan red za svaku (program, study_type)
 * kombinaciju s brojem uploadanih OIB-a.
 * Oblik: [{ program, study_type, count }]
 */
export async function getCandidateLists(intakeId) {
  const supabase = await createClient();
  const auth = await assertCanManageIntake(supabase, intakeId);
  if (auth.error) return [];

  const { data, error } = await supabase
    .from("intake_eligible_candidates")
    .select("program, study_type")
    .eq("intake_id", intakeId);
  if (error) return [];

  // Grupiranje na strani servera (Supabase ne podržava group by count u REST-u)
  const map = new Map();
  for (const row of data || []) {
    const key = `${row.program}__${row.study_type}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [program, study_type] = key.split("__");
    return { program, study_type, count };
  });
}

/**
 * Vraća pune redove (OIB, ime, prezime, email) za točan (intake, program, study_type) trojac,
 * sortirano po prezimenu pa imenu.
 */
export async function getCandidateListDetails({ intakeId, program, study_type }) {
  const supabase = await createClient();
  const auth = await assertCanManageIntake(supabase, intakeId);
  if (auth.error) return { error: auth.error };

  const { data, error } = await supabase
    .from("intake_eligible_candidates")
    .select("oib, first_name, last_name, email")
    .eq("intake_id", intakeId)
    .eq("program", program)
    .eq("study_type", study_type)
    .order("last_name", { ascending: true, nullsFirst: false })
    .order("first_name", { ascending: true, nullsFirst: false });
  if (error) return { error: error.message };
  return { candidates: data || [] };
}
