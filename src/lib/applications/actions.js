"use server";

import { createClient } from "@/lib/supabase/server";
import { generateApplicationNumber } from "./applicationNumber";
import { fullApplicationSchema } from "./validation";
import { sendEmail } from "@/lib/email/send";
import { emailPotvrda, emailPotrebneIzmjene, emailPrihvaceno, emailOdbijeno } from "@/lib/email/templates";
import { getProgramLabel } from "@/lib/applications/config";
import { revalidatePath } from "next/cache";

export async function submitApplication(formData, slug) {
  const supabase = await createClient();

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("id, is_open, is_visible, academic_year, title")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (intakeError || !intake) return { error: "Vrsta upisa nije pronađena." };
  if (!intake.is_open) return { error: "Prijave za ovaj studij trenutno nisu otvorene." };

  const parsed = fullApplicationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Podaci nisu valjani.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    oib,
    birth_date,
    birth_place,
    gender,
    marital_status,
    citizenship,
    address,
    city,
    postal_code,
    program,
    study_type,
    father_name,
    father_occupation,
    father_address,
    mother_name,
    mother_occupation,
    mother_address,
    previous_institution,
    previous_program,
    previous_completion_year,
    other_education,
    ranking_score,
  } = parsed.data;

  // ─── Provjera liste kandidata ───────────────────────────
  const { count: listCount } = await supabase
    .from("intake_eligible_candidates")
    .select("id", { count: "exact", head: true })
    .eq("intake_id", intake.id)
    .eq("program", program)
    .eq("study_type", study_type);

  if (listCount > 0) {
    // Lista postoji — provjeri je li OIB na njoj
    const { data: candidate } = await supabase
      .from("intake_eligible_candidates")
      .select("id")
      .eq("intake_id", intake.id)
      .eq("program", program)
      .eq("study_type", study_type)
      .eq("oib", oib)
      .single();

    if (!candidate) {
      return {
        error: "Vaš OIB nije pronađen na listi kvalificiranih kandidata za odabrani studij i vrstu studiranja. Ako smatrate da je došlo do greške, obratite se referadi fakulteta.",
      };
    }
  }
  // Ako lista ne postoji (listCount === 0) — upis otvoren svima

  const application_number = generateApplicationNumber();

  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      intake_id: intake.id,
      application_number,
      first_name,
      last_name,
      email,
      phone: phone || null,
      oib,
      birth_date,
      birth_place: birth_place || null,
      gender: gender || null,
      marital_status: marital_status || null,
      citizenship,
      address,
      city,
      postal_code,
      program,
      study_type,
      father_name: father_name || null,
      father_occupation: father_occupation || null,
      father_address: father_address || null,
      mother_name: mother_name || null,
      mother_occupation: mother_occupation || null,
      mother_address: mother_address || null,
      previous_institution,
      previous_program,
      previous_completion_year,
      other_education: other_education || null,
      ranking_score: ranking_score || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id, application_number")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: "Greška pri slanju prijave. Pokušajte ponovo." };
  }

  try {
    const template = emailPotvrda({
      ime: first_name,
      prezime: last_name,
      brojPrijave: application.application_number,
      studij: getProgramLabel(program),
      akademskaGodina: intake.academic_year,
    });
    await sendEmail({ to: email, ...template });
  } catch (emailError) {
    console.error("Email error:", emailError);
  }

  return {
    success: true,
    applicationId: application.id,
    applicationNumber: application.application_number,
  };
}

export async function uploadDocuments(applicationId, files) {
  const supabase = await createClient();
  const results = [];

  for (const { documentType, file } of files) {
    // Ako je fotografija — obriši staru prije uploada nove
    if (documentType === "photo") {
      const { data: existing } = await supabase.from("application_documents").select("id, file_path").eq("application_id", applicationId).eq("document_type", "photo");

      if (existing?.length) {
        await supabase.storage.from("application-documents").remove(existing.map((d) => d.file_path));
        await supabase.from("application_documents").delete().eq("application_id", applicationId).eq("document_type", "photo");
      }
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `applications/${applicationId}/${documentType}/${timestamp}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage.from("application-documents").upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { error: metaError } = await supabase.from("application_documents").insert({
      application_id: applicationId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (!metaError) results.push(documentType);
  }

  return { uploaded: results };
}

export async function updateApplicationStatus(applicationId, newStatus, adminMessage = null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase.from("applications").select("*, intakes ( title, academic_year )").eq("id", applicationId).single();

  if (!application) return { error: "Prijava nije pronađena." };

  const { error } = await supabase.from("applications").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", applicationId);

  if (error) return { error: error.message };

  await supabase.from("application_events").insert({
    application_id: applicationId,
    event_type: "status_change",
    old_value: application.status,
    new_value: newStatus,
    created_by: user?.id,
    message: adminMessage,
  });

  const programLabel = getProgramLabel(application.program);
  const akademskaGodina = application.intakes?.academic_year;

  try {
    if (newStatus === "needs_update" && adminMessage) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: tokenData } = await supabase
        .from("application_edit_tokens")
        .insert({ application_id: applicationId, message: adminMessage, expires_at: expiresAt.toISOString() })
        .select()
        .single();

      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/prijava/uredi/${tokenData.token}`;
      const template = emailPotrebneIzmjene({
        ime: application.first_name,
        prezime: application.last_name,
        brojPrijave: application.application_number,
        poruka: adminMessage,
        magicLink,
      });
      await sendEmail({ to: application.email, ...template });
    } else if (newStatus === "accepted") {
      const template = emailPrihvaceno({
        ime: application.first_name,
        prezime: application.last_name,
        brojPrijave: application.application_number,
        studij: programLabel,
        akademskaGodina,
      });
      await sendEmail({ to: application.email, ...template });
    } else if (newStatus === "rejected") {
      const template = emailOdbijeno({
        ime: application.first_name,
        prezime: application.last_name,
        brojPrijave: application.application_number,
        studij: programLabel,
        akademskaGodina,
      });
      await sendEmail({ to: application.email, ...template });
    }
  } catch (emailError) {
    console.error("Email error:", emailError);
  }

  revalidatePath(`/admin/prijave/${applicationId}`);
  return { success: true };
}

export async function updateApplicationViaToken(token, data) {
  const supabase = await createClient();

  const { data: tokenData } = await supabase
    .from("application_edit_tokens")
    .select("*, applications ( id, oib, status, email, first_name, last_name, application_number, intakes ( academic_year ) )")
    .eq("token", token)
    .single();

  if (!tokenData) return { error: "Nevažeći link." };

  const isExpired = new Date(tokenData.expires_at) < new Date();
  if (isExpired) return { error: "Link je istekao." };

  const application = tokenData.applications;
  const parsed = fullApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Podaci nisu valjani.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Makni consent iz podataka — nije DB kolona
  const { consent, ...updateData } = parsed.data;

  const { error: updateError } = await supabase
    .from("applications")
    .update({ ...updateData, oib: application.oib, status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", application.id);

  if (updateError) return { error: updateError.message };

  await supabase.from("application_events").insert({
    application_id: application.id,
    event_type: "candidate_update",
    old_value: application.status,
    new_value: "submitted",
    created_by: null,
    message: "Kandidat izmijenio prijavu putem magic linka",
  });

  try {
    const template = emailPotvrda({
      ime: parsed.data.first_name,
      prezime: parsed.data.last_name,
      brojPrijave: application.application_number,
      studij: getProgramLabel(parsed.data.program),
      akademskaGodina: application.intakes?.academic_year,
    });
    await sendEmail({ to: parsed.data.email || application.email, ...template });
  } catch (emailError) {
    console.error("Email error:", emailError);
  }

  return { success: true };
}

export async function addApplicationNote(applicationId, note, adminId) {
  const supabase = await createClient();
  const { error } = await supabase.from("application_notes").insert({
    application_id: applicationId,
    note,
    admin_id: adminId,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function getSignedDocumentUrl(filePath) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(filePath, 60 * 10);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function updateApplication(applicationId, formData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function softDeleteApplication(applicationId) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ deleted_at: new Date().toISOString() }).eq("id", applicationId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function checkApplicationStatus(applicationNumber, oib) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("application_number, status, program, study_type, created_at")
    .eq("application_number", applicationNumber)
    .eq("oib", oib)
    .is("deleted_at", null)
    .single();
  if (error || !data) {
    return { error: "Prijava nije pronađena. Provjerite broj prijave i OIB." };
  }
  return data;
}
