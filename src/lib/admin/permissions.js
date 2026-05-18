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
  if (!user) return [];

  const role = await getCurrentAdminRole();
  if (role === "super_admin") return "all";

  // Vrati program + study_level
  const { data: permissions } = await supabase
    .from("admin_program_permissions")
    .select("program, study_level")
    .eq("user_id", user.id);

  return permissions || [];
}

export async function canAccessProgram(program) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;
  return permissions.some((p) => p.program === program);
}

// Provjeri može li admin vidjeti prijavu za određeni intake (program + study_level)
export async function canAccessApplication(program, intakeStudyLevel) {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return true;

  return permissions.some((p) => {
    if (p.program !== program) return false;
    if (p.study_level === "sve") return true;
    return p.study_level === intakeStudyLevel;
  });
}

// Vrati filtere za query — array of { program, study_level }
export async function getPermissionFilters() {
  const permissions = await getAdminPermissions();
  if (permissions === "all") return "all";
  return permissions;
}
