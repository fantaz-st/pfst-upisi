"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { updateAdmin } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/client";

export default function EditAdminModal({ open, onClose, admin, loadingPerms }) {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !admin) return;
    setRole(admin.role);
    setPassword("");
    setError(null);
    setLoading(false);
  }, [open, admin]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const result = await updateAdmin({ userId: admin.user_id, role, password: password || null });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>
        Uredi administratora
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          {admin?.email}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingPerms ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Razina pristupa</InputLabel>
              <Select value={role} label="Razina pristupa" onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="super_admin">Super Administrator</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Nova lozinka"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              helperText="Ostavite prazno ako ne želite mijenjati lozinku"
              sx={{ mb: 3 }}
            />

            {role === "admin" && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: "var(--gray-500)", fontSize: "0.82rem" }}>
                  Pristup prijavama dodjeljuje se po upisnom roku u sekciji <strong>Upravljanje upisima</strong>.
                </Typography>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Odustani
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || loadingPerms}
          sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
        >
          {loading ? <CircularProgress size={20} /> : "Spremi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
