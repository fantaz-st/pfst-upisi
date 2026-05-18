"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createAdmin({ email, password, role, programs, studyLevel }) {
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: "Greška pri kreiranju korisnika: " + authError.message };
  }

  const userId = authData.user.id;
  const supabase = await createClient();

  // Add role with email
  const { error: roleError } = await supabase.from("admin_roles").insert({
    user_id: userId,
    role,
    email,
  });

  if (roleError) {
    return { error: "Greška pri dodjeljivanju role: " + roleError.message };
  }

  // Add program permissions with study_level
  if (role === "admin" && programs.length > 0) {
    const permissions = programs.map((program) => ({
      user_id: userId,
      program,
      study_level: studyLevel || "sve",
    }));

    const { error: permError } = await supabase
      .from("admin_program_permissions")
      .insert(permissions);

    if (permError) {
      return { error: "Greška pri dodjeljivanju dozvola: " + permError.message };
    }
  }

  revalidatePath("/admin/korisnici");
  return { success: true };
}

export async function deleteAdmin(userId) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return { error: "Greška pri brisanju korisnika: " + error.message };
  }
  revalidatePath("/admin/korisnici");
  return { success: true };
}
