import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import AddAdminForm from "@/components/admin/AddAdminForm";
import AdminList from "@/components/admin/AdminList";
import styles from "../admin.module.css";

export const metadata = { title: "Korisnici — Admin" };

export default async function AdminUsersPage() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) redirect("/admin/sve-prijave");

  const supabase = await createClient();
  const { data: admins } = await supabase.from("admin_roles").select("*").order("created_at", { ascending: false });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upravljanje administratorima</div>
          <div className={styles.pageSubtitle}>Dodajte ili uklonite administratore i dodijelite im studije.</div>
        </div>
      </div>

      <AddAdminForm />
      <AdminList admins={admins} />
    </Container>
  );
}
