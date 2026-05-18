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

export const metadata = { title: "Izbrisane prijave — Admin" };

export default async function DeletedApplicationsPage() {
  const supabase = await createClient();
  const permissions = await getAdminPermissions();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      application_number,
      first_name,
      last_name,
      email,
      oib,
      status,
      created_at,
      deleted_at,
      program,
      intakes (
        title,
        academic_year
      )
    `,
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const appsWithAccess =
    applications?.map((app) => ({
      ...app,
      canAccess: permissions === "all" || permissions.includes(app.program),
    })) || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <h1>Izbrisane prijave</h1>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Broj prijave</TableCell>
              <TableCell>Ime i prezime</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Obrisano</TableCell>
              <TableCell align="right">Akcija</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!appsWithAccess.length ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nema izbrisanih prijava.
                </TableCell>
              </TableRow>
            ) : (
              appsWithAccess.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.application_number}</TableCell>

                  <TableCell>
                    {app.first_name} {app.last_name}
                  </TableCell>

                  <TableCell>{app.email}</TableCell>

                  <TableCell>{new Date(app.deleted_at).toLocaleDateString("hr-HR")}</TableCell>

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
