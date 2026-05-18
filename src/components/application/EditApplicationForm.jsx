"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { personalInfoSchema } from "@/lib/applications/validation";
import { updateApplicationViaToken } from "@/lib/applications/actions";
import { studyPrograms, studyTypes } from "@/lib/applications/config";
import styles from "./EditApplicationForm.module.css";

export default function EditApplicationForm({ application, token }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
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
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    const result = await updateApplicationViaToken(token, data);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <CheckCircleIcon sx={{ fontSize: 36, color: "#059669" }} />
        </div>
        <h2 className={styles.successTitle}>Izmjena zaprimljena ✓</h2>
        <p className={styles.successText}>
          Vaša izmjena je uspješno zaprimljena. Administratori će pregledati vašu prijavu.
        </p>
      </div>
    );
  }

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski]
    .filter((p, i, self) => i === self.findIndex((x) => x.value === p.value));

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Osobni podaci */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Osobni podaci</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="first_name" control={control} render={({ field }) => (
              <TextField {...field} label="Ime" fullWidth error={!!errors.first_name} helperText={errors.first_name?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="last_name" control={control} render={({ field }) => (
              <TextField {...field} label="Prezime" fullWidth error={!!errors.last_name} helperText={errors.last_name?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="phone" control={control} render={({ field }) => (
              <TextField {...field} label="Mobitel" fullWidth error={!!errors.phone} helperText={errors.phone?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="oib" control={control} render={({ field }) => (
              <TextField {...field} label="OIB" fullWidth disabled helperText="OIB se ne može mijenjati" />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="birth_date" control={control} render={({ field }) => (
              <TextField {...field} label="Datum rođenja" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} error={!!errors.birth_date} helperText={errors.birth_date?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="citizenship" control={control} render={({ field }) => (
              <TextField {...field} label="Državljanstvo" fullWidth error={!!errors.citizenship} helperText={errors.citizenship?.message} />
            )} />
          </Grid>
        </Grid>
      </div>

      {/* Adresa */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Adresa</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller name="address" control={control} render={({ field }) => (
              <TextField {...field} label="Adresa" fullWidth error={!!errors.address} helperText={errors.address?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller name="city" control={control} render={({ field }) => (
              <TextField {...field} label="Grad" fullWidth error={!!errors.city} helperText={errors.city?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="postal_code" control={control} render={({ field }) => (
              <TextField {...field} label="Poštanski broj" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />
            )} />
          </Grid>
        </Grid>
      </div>

      {/* Studij */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Podaci o studiju</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="program" control={control} render={({ field }) => (
              <TextField {...field} select label="Studij" fullWidth error={!!errors.program} helperText={errors.program?.message}>
                {allPrograms.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="study_type" control={control} render={({ field }) => (
              <TextField {...field} select label="Vrsta studiranja" fullWidth error={!!errors.study_type} helperText={errors.study_type?.message}>
                {studyTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            )} />
          </Grid>
        </Grid>
      </div>

      {/* Prethodno obrazovanje */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Prethodno obrazovanje</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller name="previous_institution" control={control} render={({ field }) => (
              <TextField {...field} label="Ustanova" fullWidth error={!!errors.previous_institution} helperText={errors.previous_institution?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller name="previous_program" control={control} render={({ field }) => (
              <TextField {...field} label="Program / smjer" fullWidth error={!!errors.previous_program} helperText={errors.previous_program?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="previous_completion_year" control={control} render={({ field }) => (
              <TextField {...field} label="Godina završetka" fullWidth error={!!errors.previous_completion_year} helperText={errors.previous_completion_year?.message} />
            )} />
          </Grid>
        </Grid>
      </div>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        sx={{
          background: "var(--blue-main)",
          borderRadius: "100px",
          py: 1.75,
          fontWeight: 700,
          "&:hover": { background: "var(--blue-dark)" },
        }}
      >
        {loading ? "Slanje..." : "Pošalji izmjenu"}
      </Button>
    </Box>
  );
}
