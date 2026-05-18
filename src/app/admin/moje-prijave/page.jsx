import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { applicationStatuses, getProgramShortCode } from "@/lib/applications/config";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import styles from "../admin.module.css";

export const metadata = { title: "Moje prijave — Admin" };

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
}

export default async function MyApplicationsPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const permissions = await getAdminPermissions();

  if (permissions === "all") redirect("/admin/sve-prijave");

  if (!permissions.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <div className={styles.pageHeader}>
          <div><div className={styles.pageTitle}>Moje prijave</div></div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>Nemate dodijeljene studije. Kontaktirajte super administratora.</div>
        </div>
      </Container>
    );
  }

  const statusFilter = params?.status ?? "";
  const programFilter = params?.program ?? "";

  // Dohvati aplikacije zajedno s intake study_level
  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year, slug, study_level )`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (programFilter) query = query.eq("program", programFilter);

  const { data: allApplications } = await query;

  // Filtriraj prema permissions (program + study_level)
  const applications = (allApplications || []).filter(app => {
    return permissions.some(p => {
      if (p.program !== app.program) return false;
      if (p.study_level === "sve") return true;
      return p.study_level === app.intakes?.study_level;
    });
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Moje prijave</div>
          <div className={styles.pageSubtitle}>{applications.length} ukupno prijava</div>
        </div>
        <ApplicationFilters />
      </div>

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>Broj prijave</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Studij</TableCell>
                <TableCell>Vrsta upisa</TableCell>
                <TableCell>Ak. godina</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell align="right">Akcija</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!applications.length ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>Nema prijava.</TableCell>
                </TableRow>
              ) : (
                applications.map((app, index) => (
                  <TableRow key={app.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{index + 1}</TableCell>
                    <TableCell><span className={styles.appNumber}>{app.application_number}</span></TableCell>
                    <TableCell><span className={styles.nameCell}>{app.first_name} {app.last_name}</span></TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app.oib}</TableCell>
                    <TableCell><span className={styles.secondaryText}>{app.email}</span></TableCell>
                    <TableCell><Chip label={getProgramShortCode(app.program)} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }} /></TableCell>
                    <TableCell><span className={styles.secondaryText}>{app.intakes?.title ?? "—"}</span></TableCell>
                    <TableCell><span className={styles.secondaryText}>{app.intakes?.academic_year ?? "—"}</span></TableCell>
                    <TableCell><StatusChip status={app.status} /></TableCell>
                    <TableCell><span className={styles.secondaryText}>{new Date(app.created_at).toLocaleDateString("hr-HR")}</span></TableCell>
                    <TableCell align="right">
                      <Button href={`/admin/prijave/${app.id}`} size="small" variant="outlined" sx={{ borderRadius: "100px", fontSize: "0.75rem" }}>Pregled</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}
