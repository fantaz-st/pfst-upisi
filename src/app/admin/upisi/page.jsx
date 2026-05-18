import { getAllIntakesAdmin } from "@/lib/intakes/queries";
import Container from "@mui/material/Container";
import IntakesManager from "@/components/admin/IntakesManager";
import styles from "../admin.module.css";

export const metadata = { title: "Upravljanje upisima — Admin" };

export default async function AdminIntakesPage() {
  const intakes = await getAllIntakesAdmin();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upravljanje upisima</div>
          <div className={styles.pageSubtitle}>Kreirajte, uredite i upravljajte upisima.</div>
        </div>
      </div>

      <IntakesManager intakes={intakes} />
    </Container>
  );
}
