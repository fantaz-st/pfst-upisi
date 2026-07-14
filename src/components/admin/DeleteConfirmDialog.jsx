"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { softDeleteApplication } from "@/lib/applications/actions";

export default function DeleteConfirmDialog({ open, onClose, applicationId, applicationNumber, applicantName, redirectTo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const result = await softDeleteApplication(applicationId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Close modal first
      onClose();
      // Then redirect
      router.push("/admin/prijave");
      router.refresh();
    }
  }; */

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const result = await softDeleteApplication(applicationId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Force navigate away immediately
      window.location.href = redirectTo || "/admin/pocetna";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700, color: "error.main" }}>Brisanje prijave</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Jeste li sigurni da želite obrisati prijavu?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Broj prijave:</strong> {applicationNumber}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>Podnositelj:</strong> {applicantName}
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Prijava će biti premještena u recycle bin. Moći ćete je vratiti kasnije ako je potrebno.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Odustani
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Obriši"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
