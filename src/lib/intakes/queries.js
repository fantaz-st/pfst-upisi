import { createClient } from "@/lib/supabase/server";

export async function getVisibleIntakes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getIntakeBySlug(slug) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (error) return null;
  return data;
}

export async function getAllIntakesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getIntakeAdmins(intakeId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("intake_admins")
    .select("user_id")
    .eq("intake_id", intakeId);
  return data?.map(d => d.user_id) || [];
}

export async function getAdminIntakes(userId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("intake_admins")
    .select("intake_id, intakes ( id, title, academic_year, slug, study_level, is_open, is_visible )")
    .eq("user_id", userId);
  return data?.map(d => d.intakes).filter(Boolean) || [];
}
