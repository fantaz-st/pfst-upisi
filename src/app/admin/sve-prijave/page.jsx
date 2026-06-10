import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import IntakeSelector from "@/components/admin/IntakeSelector";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import styles from "../admin.module.css";

export const metadata = { title: "Sve prijave — Admin" };

export default async function AllApplicationsPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const permissions = await getAdminPermissions();

  const { data: intakes } = await supabase
    .from("intakes")
    .select("id, title, academic_year, slug, study_level, is_open")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  const intakeFilter = params?.intake ?? "";

  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( id, title, academic_year, slug )`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (intakeFilter) query = query.eq("intake_id", intakeFilter);

  const { data: applications } = await query;

  const appsWithAccess = applications?.map(app => ({
    ...app,
    canAccess: permissions === "all" || permissions.includes(app.program),
  })) || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Sve prijave</div>
          <div className={styles.pageSubtitle}>{applications?.length ?? 0} ukupno prijava</div>
        </div>
        <IntakeSelector intakes={intakes ?? []} selected={intakeFilter} />
      </div>

      <ApplicationsTable applications={appsWithAccess} mode="active" showAccess />
    </Container>
  );
}
