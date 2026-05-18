"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IntakeFormModal from "./IntakeFormModal";
import IntakeToggle from "./IntakeToggle";
import { deleteIntake } from "@/lib/intakes/actions";
import styles from "@/app/admin/admin.module.css";

export default function IntakesManager({ intakes }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editIntake, setEditIntake] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteIntake(deleteTarget.id);
    if (result.error) {
      setError(result.error);
    } else {
      setDeleteTarget(null);
      router.refresh();
    }
    setDeleting(false);
  };

  return (
    <>
      {/* New intake button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
        >
          Novi upis
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Intakes list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {!intakes?.length ? (
          <div className={styles.tableCard}>
            <div className={styles.emptyState}>Nema kreiranih upisa.</div>
          </div>
        ) : (
          intakes.map(intake => (
            <div key={intake.id} className={styles.sectionPaper} style={{ marginBottom: 0 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color: "var(--blue-dark)", fontSize: "0.95rem" }}>
                      {intake.title}
                    </Typography>
                    <Chip
                      label={intake.study_level === "prijediplomski" ? "Prijediplomski" : "Diplomski"}
                      size="small"
                      sx={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--blue-pale)", color: "var(--blue-dark)" }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", mb: 0.5 }}>
                    {intake.academic_year}
                    {intake.short_description && ` · ${intake.short_description}`}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: "var(--gray-400)" }}>
                    /{intake.slug}
                  </Typography>
                </Box>

                {/* Toggles */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Vidljivo
                    </Typography>
                    <IntakeToggle id={intake.id} field="visible" value={intake.is_visible} label={intake.is_visible ? "Da" : "Ne"} />
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Otvoreno
                    </Typography>
                    <IntakeToggle id={intake.id} field="open" value={intake.is_open} label={intake.is_open ? "Da" : "Ne"} color="success" />
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditIntake(intake)}
                    sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                  >
                    Uredi
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteTarget(intake)}
                    sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                  >
                    Obriši
                  </Button>
                </Box>
              </Box>
            </div>
          ))
        )}
      </Box>

      {/* Create modal */}
      <IntakeFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit modal */}
      {editIntake && (
        <IntakeFormModal
          open={!!editIntake}
          onClose={() => setEditIntake(null)}
          intake={editIntake}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Brisanje upisa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Brisanjem upisa ne brišu se prijave — one ostaju u bazi.
          </Alert>
          <Typography variant="body1">
            Jeste li sigurni da želite obrisati upis <strong>"{deleteTarget?.title} {deleteTarget?.academic_year}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Odustani</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : "Obriši"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
