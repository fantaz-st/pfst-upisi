import { createClient } from "@/lib/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { getProgramShortCode } from "@/lib/applications/config";
import { getAdminPermissions } from "@/lib/admin/permissions";
import EnrollmentsTable from "@/components/admin/EnrollmentsTable";
import styles from "../admin.module.css";

export const metadata = { title: "Upisi diplomski — Admin" };

const enrollmentStatusConfig = {
  pending:   { label: "Čeka upis",   color: "warning" },
  submitted: { label: "Upisano",     color: "success" },
  confirmed: { label: "Potvrđeno",   color: "info" },
};

export default async function UpisIDiplomskiPage() {
  const supabase = await createClient();

  const { data: allEnrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status, submitted_at, created_at, token_expires_at, token_used_at,
      applications ( id, intake_id, first_name, last_name, oib, email, program, study_type ),
      intakes ( title, academic_year )
    `)
    .order("created_at", { ascending: false });

  // Filtriraj po dodijeljenom intakeu (prijava kandidata mora biti u intakeu admina)
  const permissions = await getAdminPermissions();
  const allowedIntakeIds = permissions === "all" ? null : new Set(permissions.intakes.map((i) => i.id));
  const enrollments =
    permissions === "all"
      ? allEnrollments
      : (allEnrollments || []).filter((e) => allowedIntakeIds.has(e.applications?.intake_id));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upisi na diplomski</div>
          <div className={styles.pageSubtitle}>{enrollments?.length ?? 0} upisa</div>
        </div>
      </div>

      <EnrollmentsTable enrollments={enrollments} showIntake />
    </Container>
  );
}
