import { createClient } from "@/lib/supabase/server";
import { canAccessIntake } from "@/lib/admin/permissions";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import IntakeTabs from "@/components/admin/IntakeTabs";
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

  // Pristup je već provjeren s canAccessIntake — admin vidi sve prijave ovog intakea
  const { data: applications } = await supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year, study_level )`)
    .eq("intake_id", intakeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Za prijava_d intakee — dohvati i enrollmente (upise) vezane uz aplikacije ovog intakea
  let enrollments = [];
  if (intake.form_type === "prijava_d") {
    const appIds = (applications ?? []).map((a) => a.id);
    if (appIds.length > 0) {
      const { data: enr } = await supabase
        .from("enrollments")
        .select(`
          id, status, submitted_at, created_at, token_expires_at, token_used_at,
          applications ( id, first_name, last_name, oib, email, program, study_type )
        `)
        .in("application_id", appIds)
        .order("created_at", { ascending: false });
      enrollments = enr ?? [];
    }
  }

  const isPrijavaD = intake.form_type === "prijava_d";

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
            {applications?.length ?? 0} ukupno prijava
            {isPrijavaD && ` · ${enrollments.length} upisa`}
          </div>
        </div>
      </div>

      {isPrijavaD ? (
        <IntakeTabs applications={applications ?? []} enrollments={enrollments} intake={intake} />
      ) : (
        <ApplicationsTable applications={applications ?? []} mode="active" intake={intake} />
      )}
    </Container>
  );
}
