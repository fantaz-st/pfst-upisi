"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import { getProgramShortCode } from "@/lib/applications/config";
import { bulkConfirmEnrollments, deleteEnrollment } from "@/lib/enrollments/actions";
import styles from "@/app/admin/admin.module.css";

const statusConfig = {
  pending: { label: "Čeka upis", color: "warning" },
  submitted: { label: "Upisano", color: "success" },
  confirmed: { label: "Potvrđeno", color: "info" },
};

export default function EnrollmentsTable({ enrollments = [], showIntake = false }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // enrollment id za brisanje

  // Sve se može selektirati (za brisanje); potvrda vrijedi samo za submitted
  const selectableIds = useMemo(() => enrollments.map((e) => e.id), [enrollments]);
  const confirmableSelected = useMemo(() => selected.filter((id) => enrollments.find((e) => e.id === id)?.status === "submitted"), [selected, enrollments]);
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length;
  const someSelected = selected.length > 0;

  const toggleAll = () => setSelected(allSelected ? [] : selectableIds);
  const toggle = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleConfirm = async () => {
    if (confirmableSelected.length === 0) return;
    setLoading(true);
    const result = await bulkConfirmEnrollments(confirmableSelected);
    setLoading(false);
    if (!result.error) {
      setSelected([]);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const ids = deleteTarget === "__bulk__" ? selected : [deleteTarget];
    for (const id of ids) {
      await deleteEnrollment(id);
    }
    setLoading(false);
    setDeleteTarget(null);
    setSelected([]);
    router.refresh();
  };

  if (!enrollments.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center", color: "text.secondary", fontSize: "0.9rem" }}>
        Još nema upisa. Pojavljuju se kad prihvaćeni kandidati (nakon razredbenog) ispune obrazac putem magic linka.
      </Box>
    );
  }

  return (
    <Box>
      {/* Bulk action bar */}
      {someSelected && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, p: 1.5, background: "var(--blue-pale)", borderRadius: 2, border: "1px solid rgba(5,140,196,0.2)" }}>
          <Box sx={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--blue-dark)" }}>{selected.length} odabrano</Box>
          {confirmableSelected.length > 0 && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={loading ? <CircularProgress size={14} /> : <CheckCircleIcon />}
              onClick={handleConfirm}
              disabled={loading}
              sx={{ borderRadius: "100px" }}
            >
              Potvrdi upis ({confirmableSelected.length})
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setDeleteTarget("__bulk__")}
            disabled={loading}
            sx={{ borderRadius: "100px" }}
          >
            Obriši ({selected.length})
          </Button>
          <Button size="small" onClick={() => setSelected([])} sx={{ borderRadius: "100px", ml: "auto" }}>
            Poništi odabir
          </Button>
        </Box>
      )}

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} disabled={selectableIds.length === 0} />
                </TableCell>
                <TableCell>#</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Studij</TableCell>
                {showIntake && <TableCell>Upis</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell>Istječe</TableCell>
                <TableCell>Poslano</TableCell>
                <TableCell align="right">Prijava</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((e, i) => {
                const app = e.applications;
                const cfg = statusConfig[e.status] ?? { label: e.status, color: "default" };
                const isExpired = e.token_expires_at && new Date(e.token_expires_at) < new Date() && !e.token_used_at;
                const isSelectable = e.status === "submitted";
                const isSelected = selected.includes(e.id);

                return (
                  <TableRow key={e.id} hover selected={isSelected} sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={isSelected} onChange={() => toggle(e.id)} disabled={!isSelectable} />
                    </TableCell>
                    <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</TableCell>
                    <TableCell>
                      <span className={styles.nameCell}>
                        {app?.first_name} {app?.last_name}
                      </span>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app?.oib}</TableCell>
                    <TableCell>
                      <Chip
                        label={getProgramShortCode(app?.program)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }}
                      />
                    </TableCell>
                    {showIntake && (
                      <TableCell>
                        <span className={styles.secondaryText}>
                          {e.intakes?.title} · {e.intakes?.academic_year}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      {isExpired ? (
                        <Chip label="Isteklo" size="small" color="error" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      ) : (
                        <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{e.token_expires_at ? new Date(e.token_expires_at).toLocaleDateString("hr-HR") : "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString("hr-HR") : "—"}</span>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        {app?.id && (
                          <Link href={`/admin/prijave/${app.id}`} style={{ fontSize: "0.75rem", color: "var(--blue-main)", fontWeight: 600 }}>
                            Prijava →
                          </Link>
                        )}
                        <Tooltip title="Obriši upis">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(e.id)} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Confirm delete modal */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Obrisati upis?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteTarget === "__bulk__"
              ? `Trajno će biti obrisano ${selected.length} upisa. Prijave kandidata ostaju netaknute.`
              : "Ovaj upis će biti trajno obrisan. Prijava kandidata ostaje netaknuta."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={loading}>
            Odustani
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteOutlineOutlinedIcon />}
            sx={{ borderRadius: "100px" }}
          >
            Obriši
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
