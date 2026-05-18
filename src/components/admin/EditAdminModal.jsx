"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { studyPrograms } from "@/lib/applications/config";
import { updateAdmin } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/client";

export default function EditAdminModal({ open, onClose, admin }) {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [error, setError] = useState(null);

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski]
    .filter((prog, index, self) => index === self.findIndex(p => p.value === prog.value));

  useEffect(() => {
    if (!open || !admin) return;
    setRole(admin.role);
    setError(null);

    async function loadPermissions() {
      setLoadingPerms(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("admin_program_permissions")
        .select("program")
        .eq("user_id", admin.user_id);
      setPrograms(data?.map(p => p.program) || []);
      setLoadingPerms(false);
    }
    loadPermissions();
  }, [open, admin]);

  const handleProgramToggle = (value) => {
    setPrograms(prev => prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const result = await updateAdmin({ userId: admin.user_id, role, programs });
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
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loadingPerms ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 3, mt: 1 }}>
              <InputLabel>Razina pristupa</InputLabel>
              <Select value={role} label="Razina pristupa" onChange={e => setRole(e.target.value)}>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="super_admin">Super Administrator</MenuItem>
              </Select>
            </FormControl>

            {role === "admin" && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
                  Dozvoljeni studiji:
                </Typography>
                <FormGroup>
                  {allPrograms.map(prog => (
                    <FormControlLabel
                      key={prog.value}
                      control={<Checkbox size="small" checked={programs.includes(prog.value)} onChange={() => handleProgramToggle(prog.value)} />}
                      label={<Typography variant="body2">{prog.label}</Typography>}
                    />
                  ))}
                </FormGroup>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Odustani</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || loadingPerms}
          sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}>
          {loading ? <CircularProgress size={20} /> : "Spremi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
