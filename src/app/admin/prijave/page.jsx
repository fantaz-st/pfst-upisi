import { createClient } from "@/lib/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { applicationStatuses, getProgramShortCode } from "@/lib/applications/config";
import ApplicationFilters from "@/components/admin/ApplicationFilters";

export const metadata = {
  title: "Prijave — Admin",
};

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: "0.72rem" }}
    />
  );
}

export default async function AdminApplicationsPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const statusFilter = params?.status ?? "";
  const programFilter = params?.program ?? "";

  let query = supabase
    .from("applications")
    .select(`
      id, application_number, first_name, last_name, email, oib, status, created_at, program, study_type,
      intakes ( title, academic_year, slug )
    `)
    .is("deleted_at", null) // Exclude soft-deleted
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (programFilter) query = query.eq("program", programFilter);

  const { data: applications, error } = await query;

  if (error) {
    return <Box sx={{ p: 4 }}><Typography color="error">Greška pri učitavanju.</Typography></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700 }}>
            Prijave
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {applications?.length ?? 0} ukupno prijava
          </Typography>
        </Box>

        <ApplicationFilters />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>#</TableCell>
              <TableCell>Broj prijave</TableCell>
              <TableCell>Ime i prezime</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Studij</TableCell>
              <TableCell>Vrsta upisa</TableCell>
              <TableCell>Ak. godina</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Datum prijave</TableCell>
              <TableCell align="right">Akcija</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!applications?.length ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Nema prijava.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app, index) => (
                <TableRow key={app.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main", fontSize: "0.8rem" }}
                    >
                      {app.application_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {app.first_name} {app.last_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {app.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getProgramShortCode(app.program)} 
                      size="small" 
                      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.intakes?.title ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {app.intakes?.academic_year ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={app.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(app.created_at).toLocaleDateString("hr-HR")}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button href={`/admin/prijave/${app.id}`} size="small" variant="outlined">
                      Pregled
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
