"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createAdmin({ email, password, role, programs }) {
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: "Greška pri kreiranju korisnika: " + authError.message };

  const userId = authData.user.id;
  const supabase = await createClient();

  const { error: roleError } = await supabase.from("admin_roles").insert({ user_id: userId, role, email });
  if (roleError) return { error: "Greška pri dodjeljivanju role: " + roleError.message };

  if (role === "admin" && programs.length > 0) {
    const uniqueKeys = [...new Set(programs)];
    const { error: permError } = await supabase.from("admin_program_permissions").insert(
      uniqueKeys.map((key) => {
        const [program, study_level] = key.split(":");
        return { user_id: userId, program, study_level: study_level || "prijediplomski" };
      }),
    );
    if (permError) return { error: "Greška pri dodjeljivanju dozvola: " + permError.message };
  }

  revalidatePath("/admin/korisnici");
  return { success: true };
}

export async function updateAdmin({ userId, role, programs, password }) {
  const supabase = await createClient();

  // Promjena lozinke ako je unesena
  if (password) {
    const adminClient = createAdminClient();
    const { error: passError } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (passError) return { error: "Greška pri promjeni lozinke: " + passError.message };
  }

  const { error: roleError } = await supabase.from("admin_roles").update({ role }).eq("user_id", userId);
  if (roleError) return { error: "Greška pri ažuriranju role: " + roleError.message };

  await supabase.from("admin_program_permissions").delete().eq("user_id", userId);

  if (role === "admin" && programs.length > 0) {
    const uniqueKeys = [...new Set(programs)];
    const { error: permError } = await supabase.from("admin_program_permissions").insert(
      uniqueKeys.map((key) => {
        const [program, study_level] = key.split(":");
        return { user_id: userId, program, study_level: study_level || "prijediplomski" };
      }),
    );
    if (permError) return { error: "Greška pri ažuriranju dozvola: " + permError.message };
  }

  revalidatePath("/admin/korisnici");
  return { success: true };
}

export async function deleteAdmin(userId) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { error: "Greška pri brisanju korisnika: " + error.message };
  revalidatePath("/admin/korisnici");
  return { success: true };
}

export async function permanentDeleteApplications(ids) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/admin/otpad");
  return { success: true };
}

export async function restoreApplications(ids) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ deleted_at: null }).in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/admin/otpad");
  return { success: true };
}
