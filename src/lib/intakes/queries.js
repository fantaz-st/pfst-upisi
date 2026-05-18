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
