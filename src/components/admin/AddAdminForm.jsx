"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Divider from "@mui/material/Divider";
import { studyPrograms } from "@/lib/applications/config";
import { createAdmin } from "@/lib/admin/actions";
import styles from "@/app/admin/admin.module.css";

export default function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [programs, setPrograms] = useState([]);
  const [studyLevel, setStudyLevel] = useState("sve");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski]
    .filter((prog, index, self) => index === self.findIndex((p) => p.value === prog.value));

  // Filtriraj programe prema odabranoj razini
  const availablePrograms = studyLevel === "prijediplomski"
    ? studyPrograms.prijediplomski
    : studyLevel === "diplomski"
    ? studyPrograms.diplomski
    : allPrograms;

  const handleProgramToggle = (value) => {
    setPrograms((prev) => prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]);
  };

  const handleStudyLevelChange = (value) => {
    setStudyLevel(value);
    // Reset programs kad se promijeni razina jer neki možda ne postoje
    setPrograms([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await createAdmin({ email, password, role, programs, studyLevel });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setEmail("");
      setPassword("");
      setRole("admin");
      setPrograms([]);
      setStudyLevel("sve");
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className={styles.sectionPaper} style={{ marginBottom: 24 }}>
      <div className={styles.sectionTitle}>Dodaj novog administratora</div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Administrator uspješno kreiran!</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Email + lozinka */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required size="small" />
          <TextField label="Lozinka" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required size="small" />
        </Box>

        {/* Razina pristupa */}
        <FormControl size="small" sx={{ mb: 3, minWidth: 240 }}>
          <InputLabel>Razina pristupa</InputLabel>
          <Select value={role} label="Razina pristupa" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="super_admin">Super Administrator</MenuItem>
          </Select>
        </FormControl>

        {role === "admin" && (
          <>
            <Divider sx={{ mb: 2.5 }} />

            {/* Razina studija */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
                Razina studija:
              </Typography>
              <RadioGroup
                row
                value={studyLevel}
                onChange={(e) => handleStudyLevelChange(e.target.value)}
              >
                <FormControlLabel value="sve" control={<Radio size="small" />} label={<Typography variant="body2">Prijediplomski i diplomski</Typography>} />
                <FormControlLabel value="prijediplomski" control={<Radio size="small" />} label={<Typography variant="body2">Samo prijediplomski</Typography>} />
                <FormControlLabel value="diplomski" control={<Radio size="small" />} label={<Typography variant="body2">Samo diplomski</Typography>} />
              </RadioGroup>
            </Box>

            {/* Dozvoljeni studiji */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
                Dozvoljeni studiji:
              </Typography>
              <FormGroup row>
                {availablePrograms.map((prog) => (
                  <FormControlLabel
                    key={prog.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={programs.includes(prog.value)}
                        onChange={() => handleProgramToggle(prog.value)}
                      />
                    }
                    label={<Typography variant="body2">{prog.label}</Typography>}
                    sx={{ mr: 3, mb: 0.5 }}
                  />
                ))}
              </FormGroup>
            </Box>
          </>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: "100px", px: 3, background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
        >
          {loading ? "Kreiranje..." : "Dodaj administratora"}
        </Button>
      </Box>
    </div>
  );
}
