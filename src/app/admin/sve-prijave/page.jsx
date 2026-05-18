import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
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

export const metadata = { title: "Sve prijave — Admin" };

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
}

export default async function AllApplicationsPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const permissions = await getAdminPermissions();

  const statusFilter = params?.status ?? "";
  const programFilter = params?.program ?? "";

  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year, slug )`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (programFilter) query = query.eq("program", programFilter);

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
              {!appsWithAccess.length ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>Nema prijava.</TableCell>
                </TableRow>
              ) : (
                appsWithAccess.map((app, index) => (
                  <TableRow
                    key={app.id}
                    hover={app.canAccess}
                    sx={{
                      "&:last-child td": { border: 0 },
                      opacity: app.canAccess ? 1 : 0.35,
                    }}
                  >
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
                      {app.canAccess ? (
                        <Button href={`/admin/prijave/${app.id}`} size="small" variant="outlined" sx={{ borderRadius: "100px", fontSize: "0.75rem" }}>Pregled</Button>
                      ) : (
                        <Chip label="Nema pristup" size="small" disabled sx={{ fontSize: "0.7rem" }} />
                      )}
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
