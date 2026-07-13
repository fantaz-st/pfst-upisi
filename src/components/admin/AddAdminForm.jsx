"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { createAdmin } from "@/lib/admin/actions";
import styles from "@/app/admin/admin.module.css";

export default function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await createAdmin({ email, password, role });

    if (result.error) {
      setError(result.error);
    } else {
      setEmail("");
      setPassword("");
      setRole("admin");
      setPrograms([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
    setLoading(false);
  };

  return (
    <div className={styles.sectionPaper} style={{ marginBottom: 24 }}>
      <div className={styles.sectionTitle}>Dodaj novog administratora</div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Administrator uspješno kreiran!</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth required size="small" />
          <TextField label="Lozinka" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth required size="small" />
        </Box>

        <FormControl size="small" sx={{ mb: 3, minWidth: 240 }}>
          <InputLabel>Razina pristupa</InputLabel>
          <Select value={role} label="Razina pristupa" onChange={e => setRole(e.target.value)}>
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="super_admin">Super Administrator</MenuItem>
          </Select>
        </FormControl>

        {role === "admin" && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ color: "var(--gray-500)", fontSize: "0.82rem", mb: 1 }}>
              Nakon kreiranja, administratora dodijelite upisnom roku u sekciji <strong>Upravljanje upisima</strong>.
            </Typography>
          </>
        )}

        <Button type="submit" variant="contained" disabled={loading}
          sx={{ borderRadius: "100px", px: 3, background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}>
          {loading ? "Kreiranje..." : "Dodaj administratora"}
        </Button>
      </Box>
    </div>
  );
}
