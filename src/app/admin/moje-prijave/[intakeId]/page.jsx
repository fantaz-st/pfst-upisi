import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions, canAccessIntake } from "@/lib/admin/permissions";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import styles from "../../admin.module.css";

export const metadata = { title: "Moje prijave — Admin" };

export default async function MyIntakePage({ params }) {
  const { intakeId } = await params;
  const supabase = await createClient();

  const hasAccess = await canAccessIntake(intakeId);
  if (!hasAccess) redirect("/admin/sve-prijave");

  const { data: intake } = await supabase
    .from("intakes")
    .select("id, title, academic_year, study_level, form_type, is_open")
    .eq("id", intakeId)
    .single();

  if (!intake) notFound();

  const permissions = await getAdminPermissions();
  const allowedPrograms = permissions === "all" ? null : permissions.programs;

  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year )`)
    .eq("intake_id", intakeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (allowedPrograms) query = query.in("program", allowedPrograms);

  const { data: applications } = await query;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <div className={styles.pageTitle}>{intake.title}</div>
            <Chip label={intake.academic_year} size="small" sx={{ fontWeight: 600, background: "var(--blue-pale)", color: "var(--blue-dark)" }} />
            {intake.is_open && <Chip label="Otvoreno" size="small" color="success" sx={{ fontWeight: 600 }} />}
          </Box>
          <div className={styles.pageSubtitle}>{applications?.length ?? 0} ukupno prijava</div>
        </div>
      </div>

      <ApplicationsTable applications={applications ?? []} mode="active" intake={intake} />
    </Container>
  );
}
