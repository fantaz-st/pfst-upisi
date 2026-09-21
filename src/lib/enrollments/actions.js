"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { emailPotrebneIzmjeneUpis } from "@/lib/email/templates";

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

// Pronađi upis (diplomski) intake za zadanu akademsku godinu. Ne smije se
// pogađati program/smjer — upis_d intake nije vezan uz program, samo uz
// godinu. Vraća { intake } samo kad postoji točno jedan, inače { error } i,
// za slučaj više pogodaka, { candidates } da referada može ručno odabrati.
export async function resolveUpisDIntake(academicYear) {
  if (!academicYear) {
    return { error: "Nedostaje akademska godina prijave." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("id, title, academic_year")
    .eq("form_type", "upis_d")
    .eq("is_open", true)
    .eq("academic_year", academicYear);

  if (error) return { error: error.message };

  const intakes = data || [];
  if (intakes.length === 1) return { intake: intakes[0] };
  if (intakes.length === 0) {
    return {
      error: `Nema otvorenog upisa na diplomski studij za akademsku godinu ${academicYear}. Kreirajte ga u Upravljanje upisima.`,
    };
  }
  return {
    error: `Pronađeno je više upisa na diplomski studij za akademsku godinu ${academicYear} — odaberite jedan.`,
    candidates: intakes,
  };
}

// Application ids (iz zadanog popisa) koji imaju enrollment s poslanim linkom —
// jedan upit za cijelu tablicu, ne po retku. Koristi se za StatusChip override i
// za rang lista filter u ApplicationsTable.
export async function getSentEnrollmentApplicationIds(applicationIds) {
  if (!applicationIds || applicationIds.length === 0) return { applicationIds: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("application_id")
    .in("application_id", applicationIds)
    .not("sent_at", "is", null);

  if (error) return { error: error.message, applicationIds: [] };
  return { applicationIds: (data || []).map((r) => r.application_id) };
}

export async function createEnrollmentToken(applicationId, enrollmentIntakeId) {
  const supabase = await createClient();

  // Zadnja linija obrane: bez obzira odakle je enrollmentIntakeId stigao,
  // upis se smije voditi isključivo na upis_d intakeu. Vidi bug gdje je
  // pozivatelj slao id prijava_d intakea i upis je postao nevidljiv u adminu.
  const { data: targetIntake, error: intakeError } = await supabase
    .from("intakes")
    .select("id, form_type")
    .eq("id", enrollmentIntakeId)
    .maybeSingle();

  if (intakeError) return { error: intakeError.message };
  if (!targetIntake) return { error: "Odabrani upis ne postoji." };
  if (targetIntake.form_type !== "upis_d") {
    return { error: "Odabrani upis nije upis na diplomski studij." };
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 dana

  const { data: existing } = await supabase.from("enrollments").select("id, token, status").eq("application_id", applicationId).maybeSingle();

  if (existing) {
    // Obnovi token — produljuje rok, ali ne dira status/token_used_at ako je
    // kandidat već predao upis (submitted/confirmed/rejected). Ponovno otvaranje
    // predanog upisa ide isključivo kroz revertEnrollmentToPending — eksplicitnu
    // akciju referade, ne kao nuspojava ponovnog slanja istog linka. sent_at se
    // ovdje ne dira — isti link, samo produljen rok.
    const updateData = { token_expires_at: expiresAt };
    if (existing.status === "pending") {
      updateData.token_used_at = null;
    }
    const { data, error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("id", existing.id)
      .select("token, token_expires_at, token_used_at")
      .single();
    if (error) return { error: error.message };
    return { success: true, token: data.token, tokenExpiresAt: data.token_expires_at, tokenUsedAt: data.token_used_at };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      application_id: applicationId,
      intake_id: enrollmentIntakeId,
      token_expires_at: expiresAt,
      status: "pending",
    })
    .select("token, token_expires_at, token_used_at")
    .single();
  if (error) return { error: error.message };

  return { success: true, token: data.token, tokenExpiresAt: data.token_expires_at, tokenUsedAt: data.token_used_at };
}

// Generiranje linka i slanje emaila su dvije odvojene radnje — sent_at bilježi
// isključivo uspješno slanje, ne generiranje. Dok je null, "Poslan link za upis"
// se ne prikazuje nigdje (vidi getApplicationStatusConfig) — link koji je
// generiran ali nije (uspješno) poslan mora ostati nevidljiv u tom pogledu.
export async function sendEnrollmentInvite({ token, email, firstName, lastName }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const enrollmentUrl = `${siteUrl}/upis-diplomski/${token}`;

  try {
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
  } catch (emailError) {
    console.error("Email error:", emailError);
    return { error: "Greška pri slanju emaila. Pokušajte ponovo." };
  }

  const sentAt = new Date().toISOString();
  const supabase = await createClient();
  const { error: updateError } = await supabase.from("enrollments").update({ sent_at: sentAt }).eq("token", token);
  if (updateError) {
    // Email je otišao — ne javljamo grešku adminu jer bi to bilo netočno.
    // sent_at ostaje nezabilježen do sljedećeg uspješnog slanja.
    console.error("sent_at update error:", updateError);
  }

  return { success: true, sentAt };
}

export async function bulkConfirmEnrollments(enrollmentIds) {
  const supabase = await createClient();
  // Referada odlučuje iz kojeg statusa potvrđuje — bez ograničenja na "submitted".
  const { error } = await supabase
    .from("enrollments")
    .update({ status: "confirmed" })
    .in("id", enrollmentIds);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  return { success: true, count: enrollmentIds.length };
}

export async function confirmEnrollment(enrollmentId) {
  const supabase = await createClient();
  // Referada odlučuje iz kojeg statusa potvrđuje — bez ograničenja na "submitted".
  const { error } = await supabase.from("enrollments").update({ status: "confirmed" }).eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  revalidatePath(`/admin/upis/${enrollmentId}`);
  return { success: true };
}

export async function rejectEnrollment(enrollmentId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").update({ status: "rejected" }).eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  revalidatePath(`/admin/upis/${enrollmentId}`);
  return { success: true };
}

export async function markEnrollmentInReview(enrollmentId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").update({ status: "in_review" }).eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  revalidatePath(`/admin/upis/${enrollmentId}`);
  return { success: true };
}

// "Potrebne izmjene" mora stvarno ponovno otvoriti obrazac kandidatu — briše
// token_used_at i produljuje token_expires_at (isti 14-dnevni rok kao
// createEnrollmentToken), tako da postojeći magic link opet radi. submitEnrollment
// i EnrollmentPage gate isključivo na tim poljima, ne na statusu, pa je ovo dovoljno.
export async function requestEnrollmentUpdate(enrollmentId, adminMessage) {
  const supabase = await createClient();

  const { data: enrollment, error: fetchError } = await supabase
    .from("enrollments")
    .select("token, applications ( first_name, last_name, email )")
    .eq("id", enrollmentId)
    .single();

  if (fetchError || !enrollment) return { error: "Upis nije pronađen." };

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 dana

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "needs_update", token_used_at: null, token_expires_at: expiresAt })
    .eq("id", enrollmentId);

  if (error) return { error: error.message };

  let emailWarning = null;
  if (adminMessage && enrollment.applications?.email) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      const magicLink = `${siteUrl}/upis-diplomski/${enrollment.token}`;
      const template = emailPotrebneIzmjeneUpis({
        ime: enrollment.applications.first_name,
        prezime: enrollment.applications.last_name,
        poruka: adminMessage,
        magicLink,
      });
      await sendEmail({ to: enrollment.applications.email, ...template });
    } catch (emailError) {
      console.error("Email error:", emailError);
      emailWarning = `Status je spremljen, ali email nije poslan: ${emailError.message}`;
    }
  }

  revalidatePath("/admin/upisi-diplomski");
  revalidatePath(`/admin/upis/${enrollmentId}`);
  return emailWarning ? { success: true, emailWarning } : { success: true };
}

export async function revertEnrollmentToPending(enrollmentId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").update({ status: "pending" }).eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  revalidatePath(`/admin/upis/${enrollmentId}`);
  return { success: true };
}

export async function addEnrollmentNote(enrollmentId, note, adminId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollment_notes").insert({
    enrollment_id: enrollmentId,
    note,
    admin_id: adminId,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteEnrollment(enrollmentId) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/upisi-diplomski");
  return { success: true };
}
