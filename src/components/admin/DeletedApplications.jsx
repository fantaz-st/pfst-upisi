"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { getProgramShortCode } from "@/lib/applications/config";
import { permanentDeleteApplications, restoreApplications } from "@/lib/admin/actions";
import styles from "@/app/admin/admin.module.css";

export default function DeletedApplications({ applications, isSuperAdmin }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allSelected = applications.length > 0 && selected.length === applications.length;
  const someSelected = selected.length > 0;

  const handleSelectAll = () => setSelected(allSelected ? [] : applications.map((a) => a.id));
  const handleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleRestore = async (ids = selected) => {
    setLoading("restore");
    setError(null);
    const result = await restoreApplications(ids);
    if (result.error) setError(result.error);
    else {
      setSelected([]);
      router.refresh();
    }
    setLoading(null);
  };

  const handlePermanentDelete = async () => {
    setLoading("delete");
    setError(null);
    const result = await permanentDeleteApplications(selected);
    if (result.error) {
      setError(result.error);
    } else {
      setSelected([]);
      setConfirmOpen(false);
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            px: 2.5,
            py: 1.5,
            background: "var(--blue-pale)",
            border: "1px solid var(--blue-main)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--blue-dark)", flex: 1 }}>
            {selected.length} {selected.length === 1 ? "prijava odabrana" : "prijava odabrano"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={loading === "restore" ? <CircularProgress size={14} /> : <RestoreIcon />}
            onClick={() => handleRestore()}
            disabled={loading !== null}
            sx={{ borderRadius: "100px" }}
          >
            Vrati sve odabrane
          </Button>
          {isSuperAdmin && (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setConfirmOpen(true)}
              disabled={loading !== null}
              sx={{ borderRadius: "100px" }}
            >
              Trajno obriši odabrane
            </Button>
          )}
        </Box>
      )}

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={allSelected} indeterminate={someSelected && !allSelected} onChange={handleSelectAll} />
                </TableCell>
                <TableCell>Broj prijave</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Studij</TableCell>
                <TableCell>Vrsta upisa</TableCell>
                <TableCell>Ak. godina</TableCell>
                <TableCell>Obrisano</TableCell>
                <TableCell align="right">Akcija</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!applications.length ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Nema obrisanih prijava.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} hover selected={selected.includes(app.id)} sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.includes(app.id)} onChange={() => handleSelect(app.id)} />
                    </TableCell>
                    <TableCell>
                      <span className={styles.appNumber}>{app.application_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className={styles.nameCell}>
                        {app.first_name} {app.last_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{app.email}</span>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app.oib}</TableCell>
                    <TableCell>
                      <Chip
                        label={getProgramShortCode(app.program)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{app.intakes?.title ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{app.intakes?.academic_year ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{new Date(app.deleted_at).toLocaleDateString("hr-HR")}</span>
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RestoreIcon />}
                          onClick={() => handleRestore([app.id])}
                          disabled={loading !== null}
                          sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                        >
                          Vrati
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => {
                              setSelected([app.id]);
                              setConfirmOpen(true);
                            }}
                            disabled={loading !== null}
                            sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                          >
                            Obriši
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Confirm permanent delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Trajno brisanje</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Ova akcija je nepovratna! Podaci će biti trajno izgubljeni.
          </Alert>
          <Typography variant="body1">
            Jeste li sigurni da želite trajno obrisati <strong>{selected.length}</strong> {selected.length === 1 ? "prijavu" : "prijava"}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading !== null}>
            Odustani
          </Button>
          <Button
            onClick={handlePermanentDelete}
            variant="contained"
            color="error"
            disabled={loading !== null}
            startIcon={loading === "delete" ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
          >
            Trajno obriši
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
