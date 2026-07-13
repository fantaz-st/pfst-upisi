import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
import Container from "@mui/material/Container";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import styles from "../admin.module.css";

export const metadata = { title: "Prijave na diplomski — Admin" };

export default async function PrijaveDiplomskiPage() {
  const supabase = await createClient();
  const permissions = await getAdminPermissions();
  const isSuperAdmin = permissions === "all";

  const { data: applications } = await supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes!inner ( id, title, academic_year, slug, study_level, form_type )`)
    .eq("intakes.form_type", "prijava_d")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const allowedIntakeIds = isSuperAdmin ? null : new Set(permissions.intakes.map((i) => i.id));
  const visible = isSuperAdmin
    ? applications
    : (applications || []).filter((a) => allowedIntakeIds.has(a.intakes?.id));

  // Za bulk slanje linkova treba intake kontekst — ako su sve iste, proslijedi ga
  const uniqueIntakes = [...new Set((visible || []).map((a) => a.intakes?.id))];
  const singleIntake = uniqueIntakes.length === 1 ? visible[0]?.intakes : null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Prijave na diplomski</div>
          <div className={styles.pageSubtitle}>{visible?.length ?? 0} ukupno</div>
        </div>
      </div>
      <ApplicationsTable applications={visible ?? []} mode="active" intake={singleIntake} />
    </Container>
  );
}
