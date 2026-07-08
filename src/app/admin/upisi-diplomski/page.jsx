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
import styles from "../admin.module.css";

export const metadata = { title: "Upisi diplomski — Admin" };

const enrollmentStatusConfig = {
  pending:   { label: "Čeka upis",   color: "warning" },
  submitted: { label: "Upisano",     color: "success" },
  confirmed: { label: "Potvrđeno",   color: "info" },
};

export default async function UpisIDiplomskiPage() {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status, submitted_at, created_at, token_expires_at, token_used_at,
      applications ( id, first_name, last_name, oib, email, program, study_type ),
      intakes ( title, academic_year )
    `)
    .order("created_at", { ascending: false });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upisi na diplomski</div>
          <div className={styles.pageSubtitle}>{enrollments?.length ?? 0} upisa</div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Studij</TableCell>
                <TableCell>Upis</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Istječe</TableCell>
                <TableCell>Poslano</TableCell>
                <TableCell align="right">Prijava</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!enrollments?.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Nema diplomskih upisa.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e, i) => {
                  const app = e.applications;
                  const statusCfg = enrollmentStatusConfig[e.status] ?? { label: e.status, color: "default" };
                  const isExpired = e.token_expires_at && new Date(e.token_expires_at) < new Date() && !e.token_used_at;

                  return (
                    <TableRow key={e.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</TableCell>
                      <TableCell>
                        <span className={styles.nameCell}>{app?.first_name} {app?.last_name}</span>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app?.oib}</TableCell>
                      <TableCell>
                        <Chip label={getProgramShortCode(app?.program)} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }} />
                      </TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>{e.intakes?.title} · {e.intakes?.academic_year}</span>
                      </TableCell>
                      <TableCell>
                        {isExpired
                          ? <Chip label="Isteklo" size="small" color="error" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                          : <Chip label={statusCfg.label} size="small" color={statusCfg.color} sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                        }
                      </TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>
                          {e.token_expires_at ? new Date(e.token_expires_at).toLocaleDateString("hr-HR") : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>
                          {e.submitted_at ? new Date(e.submitted_at).toLocaleDateString("hr-HR") : "—"}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        {app?.id && (
                          <Link href={`/admin/prijave/${app.id}`} style={{ fontSize: "0.75rem", color: "var(--blue-main)", fontWeight: 600 }}>
                            Prijava →
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}
