"use server";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  return role?.role || null;
}

export async function isSuperAdmin() {
  const role = await getCurrentAdminRole();
  return role === "super_admin";
}

export async function getAdminPermissions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { intakes: [] };

  const role = await getCurrentAdminRole();
  if (role === "super_admin") return "all";

  // Pristup je isključivo po dodijeljenom intakeu
  const { data: intakeData } = await supabase
    .from("intake_admins")
    .select("intake_id, intakes ( id, title, academic_year, slug, study_level, form_type, is_open, is_visible )")
    .eq("user_id", user.id);

  return {
    intakes: intakeData?.map(d => d.intakes).filter(Boolean) || [],
  };
}

export async function canAccessIntake(intakeId) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.intakes.some(i => i.id === intakeId);
}

export async function canAccessApplication(program, intakeId) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.intakes.some(i => i.id === intakeId);
}
