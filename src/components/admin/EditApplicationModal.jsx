"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { studyPrograms, studyTypes } from "@/lib/applications/config";
import { updateApplication } from "@/lib/applications/actions";
import PhotoUpload from "@/components/application/PhotoUpload";
import { uploadDocuments } from "@/lib/applications/actions";

export default function EditApplicationModal({ open, onClose, application, intakeSlug, intakeStudyLevel }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [formData, setFormData] = useState({
    first_name: application.first_name || "",
    last_name: application.last_name || "",
    email: application.email || "",
    phone: application.phone || "",
    oib: application.oib || "",
    birth_date: application.birth_date || "",
    citizenship: application.citizenship || "",
    address: application.address || "",
    city: application.city || "",
    postal_code: application.postal_code || "",
    program: application.program || "",
    study_type: application.study_type || "",
    previous_institution: application.previous_institution || "",
    previous_program: application.previous_program || "",
    previous_completion_year: application.previous_completion_year || "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const result = await updateApplication(application.id, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Upload nove fotografije ako je odabrana
    if (newPhoto) {
      await uploadDocuments(application.id, [{ documentType: "photo", file: newPhoto }]);
    }

    router.refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Uređivanje prijave</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Ime" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Prezime" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Mobitel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="OIB" value={formData.oib} onChange={(e) => handleChange("oib", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Datum rođenja"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange("birth_date", e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Studij</InputLabel>
              <Select value={formData.program} label="Studij" onChange={(e) => handleChange("program", e.target.value)}>
                {(studyPrograms[intakeStudyLevel] || studyPrograms[intakeSlug])?.map((prog) => (
                  <MenuItem key={prog.value} value={prog.value}>
                    {prog.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Vrsta studija</InputLabel>
              <Select value={formData.study_type} label="Vrsta studija" onChange={(e) => handleChange("study_type", e.target.value)}>
                {studyTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Državljanstvo" value={formData.citizenship} onChange={(e) => handleChange("citizenship", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField label="Adresa" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Poštanski broj" value={formData.postal_code} onChange={(e) => handleChange("postal_code", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Grad" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Prethodna ustanova"
              value={formData.previous_institution}
              onChange={(e) => handleChange("previous_institution", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField label="Program / smjer" value={formData.previous_program} onChange={(e) => handleChange("previous_program", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Godina završetka"
              value={formData.previous_completion_year}
              onChange={(e) => handleChange("previous_completion_year", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {/* Fotografija */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Fotografija pristupnika
        </Typography>
        <PhotoUpload onPhotoChange={setNewPhoto} />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Odustani
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Spremi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
