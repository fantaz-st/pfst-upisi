import { createClient } from "@/lib/supabase/server";
import Container from "@mui/material/Container";
import DeletedApplications from "@/components/admin/DeletedApplications";
import { isSuperAdmin } from "@/lib/admin/permissions";
import styles from "../admin.module.css";

export const metadata = { title: "Obrisane prijave — Admin" };

export default async function TrashPage() {
  const supabase = await createClient();
  const superAdmin = await isSuperAdmin();

  const { data: applications } = await supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, program, deleted_at, intakes ( title, academic_year )`)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Obrisane prijave</div>
          <div className={styles.pageSubtitle}>
            {applications?.length ?? 0} obrisanih prijava — možete ih vratiti ili trajno izbrisati
          </div>
        </div>
      </div>
      <DeletedApplications applications={applications ?? []} isSuperAdmin={superAdmin} />
    </Container>
  );
}
