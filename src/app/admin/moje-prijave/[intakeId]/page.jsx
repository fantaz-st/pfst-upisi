import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions, canAccessIntake } from "@/lib/admin/permissions";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { applicationStatuses, getProgramShortCode } from "@/lib/applications/config";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import styles from "../../admin.module.css";

export const metadata = { title: "Moje prijave — Admin" };

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
}

export default async function MyIntakePage({ params, searchParams }) {
  const { intakeId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  // Provjeri pristup
  const hasAccess = await canAccessIntake(intakeId);
  if (!hasAccess) redirect("/admin/sve-prijave");

  // Dohvati intake info
  const { data: intake } = await supabase
    .from("intakes")
    .select("id, title, academic_year, study_level, is_open")
    .eq("id", intakeId)
    .single();

  if (!intake) notFound();

  // Dohvati permissions za filtriranje programa
  const permissions = await getAdminPermissions();
  const allowedPrograms = permissions === "all" ? null : permissions.programs;

  const statusFilter = sp?.status ?? "";
  const programFilter = sp?.program ?? "";

  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type, intakes ( title, academic_year )`)
    .eq("intake_id", intakeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (allowedPrograms) query = query.in("program", allowedPrograms);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (programFilter) query = query.eq("program", programFilter);

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
                <TableCell>Status</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell align="right">Akcija</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!applications?.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>Nema prijava.</TableCell>
                </TableRow>
              ) : (
                applications.map((app, index) => (
                  <TableRow key={app.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{index + 1}</TableCell>
                    <TableCell><span className={styles.appNumber}>{app.application_number}</span></TableCell>
                    <TableCell><span className={styles.nameCell}>{app.first_name} {app.last_name}</span></TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app.oib}</TableCell>
                    <TableCell><span className={styles.secondaryText}>{app.email}</span></TableCell>
                    <TableCell>
                      <Chip label={getProgramShortCode(app.program)} size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }} />
                    </TableCell>
                    <TableCell><StatusChip status={app.status} /></TableCell>
                    <TableCell><span className={styles.secondaryText}>{new Date(app.created_at).toLocaleDateString("hr-HR")}</span></TableCell>
                    <TableCell align="right">
                      <Button href={`/admin/prijave/${app.id}`} size="small" variant="outlined"
                        sx={{ borderRadius: "100px", fontSize: "0.75rem" }}>Pregled</Button>
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
