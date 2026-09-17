"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { deleteEnrollment } from "@/lib/enrollments/actions";

export default function EnrollmentDeleteButton({ enrollmentId, candidateName, redirectTo }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    const result = await deleteEnrollment(enrollmentId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = redirectTo;
    }
  };

  return (
    <>
      <Button variant="outlined" color="error" fullWidth startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: "100px" }}>
        Obriši upis
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Obrisati upis?</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Upis kandidata {candidateName} bit će trajno obrisan. Prijava kandidata ostaje netaknuta.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={loading}>
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
    </>
  );
}
