"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleIntakeOpen(id, isOpen) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("intakes")
    .update({ is_open: isOpen, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/upisi");
  revalidatePath("/");
}

export async function toggleIntakeVisible(id, isVisible) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("intakes")
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/upisi");
  revalidatePath("/");
}

export async function updateIntakeDetails(id, { academic_year, short_description }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("intakes")
    .update({ academic_year, short_description, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/upisi");
  revalidatePath("/");
}
