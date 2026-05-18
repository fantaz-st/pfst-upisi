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
  if (!user) return { programs: [], intakes: [] };

  const role = await getCurrentAdminRole();
  if (role === "super_admin") return "all";

  // Dohvati programe
  const { data: permData } = await supabase
    .from("admin_program_permissions")
    .select("program")
    .eq("user_id", user.id);

  // Dohvati intakes
  const { data: intakeData } = await supabase
    .from("intake_admins")
    .select("intake_id, intakes ( id, title, academic_year, slug, study_level, is_open, is_visible )")
    .eq("user_id", user.id);

  return {
    programs: permData?.map(p => p.program) || [],
    intakes: intakeData?.map(d => d.intakes).filter(Boolean) || [],
  };
}

export async function canAccessProgram(program) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.programs.includes(program);
}

export async function canAccessIntake(intakeId) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.intakes.some(i => i.id === intakeId);
}

export async function canAccessApplication(program, intakeId) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.programs.includes(program) &&
    permissions.intakes.some(i => i.id === intakeId);
}
