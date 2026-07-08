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

  // Refresh izborni predmeti (samo za upis_d)
  if (form_type === "upis_d") {
    await supabase.from("elective_courses").delete().eq("intake_id", id);
    await supabase.from("elective_requirements").delete().eq("intake_id", id);

    if (elective_courses?.length > 0) {
      await supabase.from("elective_courses")
        .insert(elective_courses.map(c => ({ ...c, intake_id: id })));
    }
    if (elective_requirements?.length > 0) {
      await supabase.from("elective_requirements")
        .insert(elective_requirements.map(r => ({ ...r, intake_id: id })));
    }
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

export async function getElectiveCourses(intakeId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("elective_courses")
    .select("*")
    .eq("intake_id", intakeId)
    .order("program")
    .order("semester")
    .order("sort_order");
  return data || [];
}

export async function getElectiveRequirements(intakeId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("elective_requirements")
    .select("*")
    .eq("intake_id", intakeId);
  return data || [];
}
