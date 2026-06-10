"use server";

import { createClient } from "@/lib/supabase/server";
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

export async function createIntake({ title, academic_year, slug, study_level, short_description, sort_order, adminIds }) {
  const supabase = await createClient();

  const { data: intake, error } = await supabase
    .from("intakes")
    .insert({
      title, academic_year, slug, study_level,
      short_description,
      sort_order: sort_order || 0,
      is_visible: false,
      is_open: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase
      .from("intake_admins")
      .insert(adminIds.map(user_id => ({ intake_id: intake.id, user_id })));
    if (adminError) return { error: adminError.message };
  }

  revalidatePath("/admin/upisi");
  return { success: true, intake };
}

export async function updateIntake({ id, title, academic_year, slug, study_level, short_description, sort_order, adminIds }) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("intakes")
    .update({ title, academic_year, slug, study_level, short_description, sort_order })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("intake_admins").delete().eq("intake_id", id);

  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase
      .from("intake_admins")
      .insert(adminIds.map(user_id => ({ intake_id: id, user_id })));
    if (adminError) return { error: adminError.message };
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

// ─── Lista kandidata ───────────────────────────────────────

export async function uploadCandidateList({ intakeId, program, study_type, candidates }) {
  const supabase = await createClient();

  // Obriši postojeću listu za ovaj intake+program+study_type
  await supabase
    .from("intake_eligible_candidates")
    .delete()
    .eq("intake_id", intakeId)
    .eq("program", program)
    .eq("study_type", study_type);

  if (!candidates?.length) return { success: true, count: 0 };

  // Insert novi
  const rows = candidates.map(c => ({
    intake_id: intakeId,
    program,
    study_type,
    oib: c.oib,
    first_name: c.first_name || null,
    last_name: c.last_name || null,
    email: c.email || null,
  }));

  const { error } = await supabase.from("intake_eligible_candidates").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/upisi");
  return { success: true, count: rows.length };
}

export async function deleteCandidateList({ intakeId, program, study_type }) {
  const supabase = await createClient();

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

export async function getCandidateLists(intakeId) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("intake_eligible_candidates")
    .select("program, study_type")
    .eq("intake_id", intakeId);

  if (error) return [];

  // Grupiraj po program+study_type i vrati count
  const groups = {};
  for (const row of data || []) {
    const key = `${row.program}__${row.study_type}`;
    groups[key] = (groups[key] || 0) + 1;
  }

  return Object.entries(groups).map(([key, count]) => {
    const [program, study_type] = key.split("__");
    return { program, study_type, count };
  });
}
