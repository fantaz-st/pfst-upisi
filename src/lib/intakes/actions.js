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
      title,
      academic_year,
      slug,
      study_level,
      short_description,
      sort_order: sort_order || 0,
      is_visible: false,
      is_open: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Dodaj admine
  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase.from("intake_admins").insert(adminIds.map((user_id) => ({ intake_id: intake.id, user_id })));
    if (adminError) return { error: adminError.message };
  }

  revalidatePath("/admin/upisi");
  return { success: true, intake };
}

export async function updateIntake({ id, title, academic_year, slug, study_level, short_description, sort_order, adminIds }) {
  const supabase = await createClient();

  const { error } = await supabase.from("intakes").update({ title, academic_year, slug, study_level, short_description, sort_order }).eq("id", id);

  if (error) return { error: error.message };

  // Refresh admins
  await supabase.from("intake_admins").delete().eq("intake_id", id);

  if (adminIds?.length > 0) {
    const { error: adminError } = await supabase.from("intake_admins").insert(adminIds.map((user_id) => ({ intake_id: id, user_id })));
    if (adminError) return { error: adminError.message };
  }

  revalidatePath("/admin/upisi");
  return { success: true };
}

/* export async function deleteIntake(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("intakes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi");
  return { success: true };
}
 */

export async function deleteIntake(id) {
  const supabase = await createClient();

  // Provjeri ima li prijava
  const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("intake_id", id);

  if (count > 0) {
    return { error: `Ne možete obrisati upis koji ima ${count} prijava. Prvo obrišite sve prijave.` };
  }

  const { error } = await supabase.from("intakes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi");
  return { success: true };
}
