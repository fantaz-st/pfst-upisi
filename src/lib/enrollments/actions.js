"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const enrollmentSchema = z.object({
  enrollment_type: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional()
    .nullable(),
  gender: z.enum(["muški", "ženski", "ostalo"]),
  birth_place: z.string().min(1, "Obavezno"),
  marital_status: z.string().min(1, "Obavezno"),
  father_name: z.string().optional(),
  father_occupation: z.string().optional(),
  father_address: z.string().optional(),
  mother_name: z.string().optional(),
  mother_occupation: z.string().optional(),
  mother_address: z.string().optional(),
  selected_courses_s1: z.array(z.object({ id: z.string(), name: z.string(), credits: z.number() })),
  selected_courses_s2: z.array(z.object({ id: z.string(), name: z.string(), credits: z.number() })),
  consent: z.literal(true, { errorMap: () => ({ message: "Morate prihvatiti uvjete" }) }),
});

export async function getEnrollmentByToken(token) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      applications ( first_name, last_name, email, oib, program, study_type, birth_date, address, city, postal_code, citizenship ),
      intakes ( title, academic_year, study_level, diplomski_period_from, diplomski_period_to )
    `,
    )
    .eq("token", token)
    .single();

  if (error || !data) return null;
  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) return { expired: true };
  if (data.token_used_at) return { used: true, data };
  return data;
}

export async function submitEnrollment(token, formData, photo = null) {
  const supabase = createAdminClient();

  // Dohvati enrollment po tokenu
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("*, intakes ( id ), applications ( program )")
    .eq("token", token)
    .is("token_used_at", null)
    .single();

  if (enrollmentError || !enrollment) return { error: "Nevažeći ili istekli link." };
  if (enrollment.token_expires_at && new Date(enrollment.token_expires_at) < new Date()) {
    return { error: "Link za upis je istekao. Kontaktirajte referadu." };
  }

  // Validacija
  const parsed = enrollmentSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("Enrollment validation errors:", parsed.error.flatten().fieldErrors);
    return { error: "Podaci nisu valjani.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Provjeri minimalne bodove
  const { data: requirements } = await supabase.from("elective_requirements").select("*").eq("intake_id", enrollment.intakes.id).eq("program", enrollment.applications.program);

  for (const req of requirements || []) {
    const courses = req.semester === 1 ? parsed.data.selected_courses_s1 : parsed.data.selected_courses_s2;
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    if (totalCredits < req.min_credits) {
      return {
        error: `Nedovoljno bodova za ${req.semester}. semestar. Potrebno minimalno ${req.min_credits}, odabrano ${totalCredits}.`,
      };
    }
  }

  const { consent, ...updateData } = parsed.data;

  const { error: updateError } = await supabase
    .from("enrollments")
    .update({
      ...updateData,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      token_used_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id);

  if (updateError) return { error: updateError.message };

  // Upload fotografije
  if (photo && enrollment.application_id) {
    const { uploadDocuments } = await import("@/lib/applications/actions");
    await uploadDocuments(enrollment.application_id, [{ documentType: "photo", file: photo }]);
  }

  revalidatePath("/admin/prijave");
  return { success: true };
}

export async function createEnrollmentToken(applicationId, enrollmentIntakeId) {
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 dana

  const { data: existing } = await supabase.from("enrollments").select("id, token").eq("application_id", applicationId).maybeSingle();

  let token;
  if (existing) {
    // Obnovi token
    const { data, error } = await supabase
      .from("enrollments")
      .update({ token_expires_at: expiresAt, token_used_at: null, status: "pending" })
      .eq("id", existing.id)
      .select("token")
      .single();
    if (error) return { error: error.message };
    token = data.token;
  } else {
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        application_id: applicationId,
        intake_id: enrollmentIntakeId,
        token_expires_at: expiresAt,
        status: "pending",
      })
      .select("token")
      .single();
    if (error) return { error: error.message };
    token = data.token;
  }

  return { success: true, token };
}

export async function sendEnrollmentInvite({ token, email, firstName, lastName }) {
  const { sendEmail } = await import("@/lib/email/send");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const enrollmentUrl = `${siteUrl}/upis-diplomski/${token}`;

  await sendEmail({
    to: email,
    subject: "Poziv na upis na diplomski studij — PFST",
    html: `
<!DOCTYPE html>
<html lang="hr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td bgcolor="#2E7D32" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);padding:40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Prijava prihvaćena ✓</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${firstName} ${lastName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
              Vaša prijava za upis na diplomski studij je <strong style="color:#2E7D32;">prihvaćena</strong>. Molimo ispunite obrazac za upis klikom na gumb ispod.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td bgcolor="#2E7D32" style="border-radius:6px;">
                  <a href="${enrollmentUrl}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Nastavi s upisom &rarr;</a>
                </td></tr></table>
                <p style="margin:16px 0 0;font-size:12px;color:#888;text-align:center;">Ako gumb ne radi, otvorite ovaj link:<br><a href="${enrollmentUrl}" style="color:#2E7D32;word-break:break-all;">${enrollmentUrl}</a></p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#999;text-align:center;">Link je aktivan 14 dana.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
            <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
            <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

export async function bulkConfirmEnrollments(enrollmentIds) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status: "confirmed" })
    .in("id", enrollmentIds)
    .eq("status", "submitted"); // samo submitane možemo potvrditi
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  return { success: true, count: enrollmentIds.length };
}

export async function deleteEnrollment(enrollmentId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  return { success: true };
}
