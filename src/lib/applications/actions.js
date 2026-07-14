"use server";

import { createClient } from "@/lib/supabase/server";
import { generateApplicationNumber } from "./applicationNumber";
import { fullApplicationSchema, personalInfoSchema } from "./validation";
import { sendEmail } from "@/lib/email/send";
import { emailPotvrda, emailPotrebneIzmjene, emailPrihvaceno, emailOdbijeno, emailUObradi } from "@/lib/email/templates";
import { getProgramLabel, applicationStatuses, isCandidateLocked } from "@/lib/applications/config";
import { revalidatePath } from "next/cache";

export async function submitApplication(formData, slug, force = false) {
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
    enrollment_type,
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

  // Prazan string ("") pretvori u null da ne puknu CHECK/nullability constraint-i
  const nz = (v) => (v === "" || v === undefined ? null : v);

  // Provjera prava upisa preko liste kvalificiranih kandidata (razredbeni postupak).
  // Semantika: ako intake ima IKAKVU listu, provjera je aktivna i OIB mora biti na
  // konkretnoj listi za (program, study_type). Ako intake nema ni jedan red u
  // intake_eligible_candidates, feature je isključen za taj intake i sve prijave prolaze.
  const { data: eligibleRows } = await supabase
    .from("intake_eligible_candidates")
    .select("program, study_type")
    .eq("intake_id", intake.id)
    .eq("oib", oib);

  const { count: totalListCount } = await supabase
    .from("intake_eligible_candidates")
    .select("*", { count: "exact", head: true })
    .eq("intake_id", intake.id);

  if (totalListCount && totalListCount > 0) {
    const matches = (eligibleRows || []).some((r) => r.program === program && r.study_type === study_type);
    if (!matches) {
      const otherEnrollments = eligibleRows || [];
      if (otherEnrollments.length > 0) {
        // OIB je registriran za neki drugi program/vrstu — pomogni korisniku porukom
        const other = otherEnrollments
          .map((r) => `${getProgramLabel(r.program)} (${r.study_type})`)
          .join(", ");
        return {
          error:
            `Vaš OIB nije na listi za odabrani studij i vrstu studiranja. ` +
            `Prema podacima referade, imate pravo upisa na: ${other}. ` +
            `Odaberite odgovarajući studij ili se javite referadi.`,
        };
      }
      return {
        error:
          "Vaš OIB nije na listi kvalificiranih kandidata za ovaj upis. " +
          "Ako smatrate da je došlo do greške, javite se referadi.",
      };
    }
  }

  // Provjera duplikata: isti OIB + intake + program.
  // Isti OIB smije podnijeti prijave za više različitih studija u istom intakeu
  // (ako je na listi za svaki), ali ne dvije za isti studij.
  // Ako je force=true, preskačemo provjeru (koristi se za "Pošalji svejedno").
  const { data: existing } = force
    ? { data: null }
    : await supabase
        .from("applications")
        .select("id, status, application_number, program")
        .eq("intake_id", intake.id)
        .eq("program", program)
        .eq("oib", oib)
        .is("deleted_at", null)
        .maybeSingle();

  if (existing) {
    return {
      duplicate: true,
      duplicateType: "same_program",
      canEdit: !isCandidateLocked(existing.status),
      existingApplication: {
        id: existing.id,
        application_number: existing.application_number,
        program: existing.program,
        status: existing.status,
      },
    };
  }

  const application_number = generateApplicationNumber();

  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      intake_id: intake.id,
      application_number,
      first_name,
      last_name,
      email,
      phone: nz(phone),
      oib,
      birth_date,
      birth_place: nz(birth_place),
      gender: nz(gender),
      marital_status: nz(marital_status),
      citizenship,
      address,
      city,
      postal_code,
      program,
      study_type,
      enrollment_type: enrollment_type ?? null,
      father_name: nz(father_name),
      father_occupation: nz(father_occupation),
      father_address: nz(father_address),
      mother_name: nz(mother_name),
      mother_occupation: nz(mother_occupation),
      mother_address: nz(mother_address),
      previous_institution,
      previous_program,
      previous_completion_year,
      other_education: nz(other_education),
      ranking_score: nz(ranking_score),
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

  const { data: application } = await supabase.from("applications").select("*, intakes ( title, academic_year, study_level )").eq("id", applicationId).single();

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

  let emailWarning = null;
  try {
    if (newStatus === "needs_update" && adminMessage) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: tokenData } = await supabase
        .from("application_edit_tokens")
        .insert({
          application_id: applicationId,
          message: adminMessage,
          expires_at: expiresAt.toISOString(),
        })
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
        studyLevel: application.intakes?.study_level,
      });
      await sendEmail({ to: application.email, ...template });
    } else if (newStatus === "in_review") {
      const template = emailUObradi({
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
    // Status je već ažuriran u DB-u, ali email nije otišao — vratimo warning
    // da admin zna, ne samo tihi console log.
    emailWarning = `Status je spremljen, ali email nije poslan: ${emailError.message}`;
  }

  revalidatePath(`/admin/prijave/${applicationId}`);
  return emailWarning ? { success: true, emailWarning } : { success: true };
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

  // Ako je referada u međuvremenu preuzela obradu, ne dopuštamo izmjene
  // ni s valjanim tokenom.
  if (isCandidateLocked(application.status)) {
    return { error: "Prijava je u obradi kod referade i više se ne može uređivati." };
  }

  const parsed = personalInfoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Podaci nisu valjani.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      ...parsed.data,
      oib: application.oib,
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
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

  // Prazan string ("") iz Select/TextField polja pretvori u null —
  // inače puca na CHECK constraintima (npr. gender, previous_study_institution)
  // koji dopuštaju null, ali ne i prazan string.
  const sanitized = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [key, value === "" ? null : value])
  );

  const { error } = await supabase
    .from("applications")
    .update({ ...sanitized, updated_at: new Date().toISOString() })
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
    .select("application_number, status, program, study_type, created_at, intakes ( study_level )")
    .eq("application_number", applicationNumber)
    .eq("oib", oib)
    .is("deleted_at", null)
    .single();
  if (error || !data) {
    return { error: "Prijava nije pronađena. Provjerite broj prijave i OIB." };
  }
  return { ...data, study_level: data.intakes?.study_level };
}

export async function submitApplicationD(formData, slug, filesToUpload = []) {
  const supabase = await createClient();

  // Dohvati intake
  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("id, is_open, is_visible, academic_year, title")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (intakeError || !intake) return { error: "Vrsta upisa nije pronađena." };
  if (!intake.is_open) return { error: "Prijave za ovaj studij trenutno nisu otvorene." };

  // Validiraj
  const { diplomskiApplicationSchema } = await import("./validation");
  const parsed = diplomskiApplicationSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("Diplomski validation errors:", parsed.error.flatten().fieldErrors);
    return { error: "Podaci nisu valjani.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    oib,
    birth_date,
    citizenship,
    address,
    city,
    postal_code,
    program,
    study_type,
    previous_study_institution,
    previous_completion_year,
    father_name,
  } = parsed.data;

  // Provjeri duplikat OIB
  const { data: existing } = await supabase.from("applications").select("id").eq("oib", oib).eq("intake_id", intake.id).is("deleted_at", null).maybeSingle();

  if (existing) return { error: "Prijava s ovim OIB-om već postoji za ovaj upisni rok." };

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
      citizenship,
      address,
      city,
      postal_code,
      program,
      study_type,
      father_name: father_name || null,
      previous_study_institution,
      previous_completion_year,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id, application_number")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: "Greška pri slanju prijave. Pokušajte ponovo." };
  }

  // Upload dokumenata
  if (filesToUpload.length > 0) {
    await uploadDocuments(application.id, filesToUpload);
  }

  // Pošalji email potvrde
  try {
    const { emailPotvrda } = await import("@/lib/email/templates");
    const { sendEmail } = await import("@/lib/email/send");
    const emailContent = emailPotvrda({
      ime: first_name,
      prezime: last_name,
      brojPrijave: application_number,
      studij: getProgramLabel(program),
      akademskaGodina: intake.academic_year,
    });
    await sendEmail({ to: email, ...emailContent });
  } catch (e) {
    console.error("Email error:", e);
  }

  return { success: true, applicationNumber: application_number };
}

export async function bulkUpdateApplicationStatus(applicationIds, newStatus, adminMessage = null) {
  const results = { success: 0, failed: 0, errors: [] };
  for (const id of applicationIds) {
    const result = await updateApplicationStatus(id, newStatus, adminMessage);
    if (result.error) {
      results.failed++;
      results.errors.push(result.error);
    } else {
      results.success++;
    }
  }
  return results;
}

export async function bulkSoftDeleteApplications(applicationIds) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ deleted_at: new Date().toISOString() }).in("id", applicationIds);
  if (error) return { error: error.message };
  return { success: true, count: applicationIds.length };
}

export async function uploadDocumentsViaToken(token, files) {
  const supabase = await createClient();

  // Validiraj token (isti pattern kao updateApplicationViaToken)
  const { data: tokenData } = await supabase.from("application_edit_tokens").select("expires_at, applications ( id )").eq("token", token).single();

  if (!tokenData?.applications?.id) return { error: "Nevažeći link." };
  if (new Date(tokenData.expires_at) < new Date()) return { error: "Link je istekao." };

  const applicationId = tokenData.applications.id;

  // Kandidat mijenja dokumente — obriši postojeće istog tipa prije uploada novih
  const types = [...new Set(files.map((f) => f.documentType))];
  for (const documentType of types) {
    const { data: existing } = await supabase.from("application_documents").select("id, file_path").eq("application_id", applicationId).eq("document_type", documentType);

    if (existing?.length) {
      await supabase.storage.from("application-documents").remove(existing.map((d) => d.file_path));
      await supabase.from("application_documents").delete().eq("application_id", applicationId).eq("document_type", documentType);
    }
  }

  return uploadDocuments(applicationId, files);
}

/**
 * Traženje edit linka za već postojeću prijavu (self-service).
 * Poziva se kad pristupnik pri submitu naiđe na duplikat i klikne
 * "Pošalji mi link za uređivanje".
 *
 * Sigurnost:
 * - Email link uvijek ide na adresu iz postojeće prijave, nikad na email
 *   koji je pristupnik utipkao u formu (inače bi netko mogao "oteti" tuđu
 *   prijavu utipkavši tuđi applicationId).
 * - Reuse-a postojeći nekorišten, neistekli token ako postoji.
 * - Ne otkrivamo email adresu u response-u (vraća generic success).
 */
export async function requestEditLinkForExisting(applicationId) {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, email, first_name, last_name, application_number")
    .eq("id", applicationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!application) return { error: "Prijava nije pronađena." };
  if (isCandidateLocked(application.status)) {
    return { error: "Prijava je već u obradi i ne može se više uređivati. Kontaktirajte referadu." };
  }

  // Reuse nekorišten neistekli token ako postoji
  const now = new Date().toISOString();
  const { data: reusable } = await supabase
    .from("application_edit_tokens")
    .select("token, expires_at")
    .eq("application_id", application.id)
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let token = reusable?.token;
  if (!token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { data: fresh, error: tokenError } = await supabase
      .from("application_edit_tokens")
      .insert({
        application_id: application.id,
        message: "Traženje linka za uređivanje prijave (duplikat pri ponovnoj prijavi).",
        expires_at: expiresAt.toISOString(),
      })
      .select("token")
      .single();
    if (tokenError) return { error: "Greška pri kreiranju linka. Pokušajte ponovo." };
    token = fresh.token;
  }

  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/prijava/uredi/${token}`;
  const template = emailPotrebneIzmjene({
    ime: application.first_name,
    prezime: application.last_name,
    brojPrijave: application.application_number,
    poruka:
      "Zatražili ste link za uređivanje već poslane prijave. Kliknite gumb ispod za nastavak. " +
      "Ako niste vi tražili ovaj link, slobodno zanemarite ovaj email.",
    magicLink,
  });

  try {
    await sendEmail({ to: application.email, ...template });
  } catch (emailError) {
    console.error("Email error (edit link request):", emailError);
    return { error: "Greška pri slanju emaila. Pokušajte ponovo." };
  }

  return { success: true };
}
