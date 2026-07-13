import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
import Container from "@mui/material/Container";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import styles from "../admin.module.css";

export const metadata = { title: "Upisi na prijediplomski — Admin" };

export default async function UpisiPrijediplomskiPage() {
  const supabase = await createClient();
  const permissions = await getAdminPermissions();
  const isSuperAdmin = permissions === "all";

  const { data: applications } = await supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes!inner ( id, title, academic_year, slug, study_level, form_type )`)
    .eq("intakes.form_type", "upis_pd")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Filtriraj po dozvolama
  const allowedIntakeIds = isSuperAdmin ? null : new Set(permissions.intakes.map((i) => i.id));
  const visible = isSuperAdmin
    ? applications
    : (applications || []).filter((a) => allowedIntakeIds.has(a.intakes?.id));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upisi na prijediplomski</div>
          <div className={styles.pageSubtitle}>{visible?.length ?? 0} ukupno</div>
        </div>
      </div>
      <ApplicationsTable applications={visible ?? []} mode="active" />
    </Container>
  );
}
