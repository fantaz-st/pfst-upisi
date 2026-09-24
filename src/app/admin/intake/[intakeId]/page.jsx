import { createClient } from "@/lib/supabase/server";
import { canAccessIntake } from "@/lib/admin/permissions";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import EnrollmentsTable from "@/components/admin/EnrollmentsTable";
import styles from "../../admin.module.css";

export const metadata = { title: "Prijave po upisu — Admin" };

export default async function IntakePage({ params }) {
  const { intakeId } = await params;
  const supabase = await createClient();

  const hasAccess = await canAccessIntake(intakeId);
  if (!hasAccess) redirect("/admin/sve-prijave");

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("id, title, academic_year, study_level, form_type, is_open")
    .eq("id", intakeId)
    .maybeSingle();

  if (intakeError) {
    console.error("[admin/intake] Supabase error loading intake", intakeId, intakeError);
    throw new Error(`Neuspješno učitavanje upisa: ${intakeError.message}`);
  }
  if (!intake) {
    console.error("[admin/intake] Intake not found — id:", intakeId,
      "(hasAccess was true, but SELECT returned no row — vjerojatno RLS)");
    notFound();
  }

  const isUpisD = intake.form_type === "upis_d";

  let applications = [];
  let enrollments = [];

  if (isUpisD) {
    // upis_d — enrollments su vezani direktno preko enrollments.intake_id,
    // ne preko applications (nijedna prijava nema intake_id na ovaj upis)
    const { data: enr } = await supabase
      .from("enrollments")
      .select(`
        id, status, submitted_at, created_at, token_expires_at, token_used_at,
        applications ( id, first_name, last_name, oib, email, program, study_type )
      `)
      .eq("intake_id", intakeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    enrollments = enr ?? [];
  } else {
    // Pristup je već provjeren s canAccessIntake — admin vidi sve prijave ovog intakea
    const { data: apps } = await supabase
      .from("applications")
      .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year, study_level )`)
      .eq("intake_id", intakeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    applications = apps ?? [];
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <div className={styles.pageTitle}>{intake.title}</div>
            <Chip label={intake.academic_year} size="small" sx={{ fontWeight: 600, background: "var(--blue-pale)", color: "var(--blue-dark)" }} />
            {intake.is_open && <Chip label="Otvoreno" size="small" color="success" sx={{ fontWeight: 600 }} />}
          </Box>
          <div className={styles.pageSubtitle}>
            {isUpisD ? `${enrollments.length} upisa` : `${applications.length} ukupno prijava`}
          </div>
        </div>
      </div>

      {isUpisD ? (
        <EnrollmentsTable enrollments={enrollments} filterable />
      ) : (
        <ApplicationsTable applications={applications} mode="active" intake={intake} />
      )}
    </Container>
  );
}
