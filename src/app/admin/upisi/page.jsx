import { getAllIntakesAdmin } from "@/lib/intakes/queries";
import Container from "@mui/material/Container";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import IntakeToggle from "@/components/admin/IntakeToggle";
import styles from "../admin.module.css";

export const metadata = { title: "Upravljanje upisima — Admin" };

export default async function AdminIntakesPage() {
  const intakes = await getAllIntakesAdmin();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Upravljanje upisima</div>
          <div className={styles.pageSubtitle}>Otvorite ili zatvorite prijave, promijenite vidljivost upisa.</div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Naziv</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Akademska godina</TableCell>
                <TableCell align="center">Vidljivo</TableCell>
                <TableCell align="center">Otvoreno</TableCell>
                <TableCell>Redoslijed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {intakes.map((intake) => (
                <TableRow key={intake.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <span className={styles.nameCell}>{intake.title}</span>
                    {intake.short_description && (
                      <div className={styles.secondaryText}>{intake.short_description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "text.secondary" }}>
                      {intake.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{intake.academic_year}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IntakeToggle id={intake.id} field="visible" value={intake.is_visible} label={intake.is_visible ? "Da" : "Ne"} />
                  </TableCell>
                  <TableCell align="center">
                    <IntakeToggle id={intake.id} field="open" value={intake.is_open} label={intake.is_open ? "Otvoreno" : "Zatvoreno"} color={intake.is_open ? "success" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{intake.sort_order}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}
