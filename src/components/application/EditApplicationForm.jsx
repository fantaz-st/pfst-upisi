"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { fullApplicationSchema } from "@/lib/applications/validation";
import { updateApplicationViaToken } from "@/lib/applications/actions";
import { studyPrograms, studyTypes } from "@/lib/applications/config";
import styles from "./EditApplicationForm.module.css";

const genderOptions = [
  { value: "muški", label: "Muški" },
  { value: "ženski", label: "Ženski" },
  { value: "ostalo", label: "Ostalo" },
];

const maritalOptions = ["Neoženjen / Neudana", "Oženjen / Udana", "Razveden/a", "Udovac / Udovica"];

export default function EditApplicationForm({ application, token }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski].filter((p, i, self) => i === self.findIndex((x) => x.value === p.value));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fullApplicationSchema),
    defaultValues: {
      first_name: application.first_name || "",
      last_name: application.last_name || "",
      email: application.email || "",
      phone: application.phone || "",
      oib: application.oib || "",
      birth_date: application.birth_date || "",
      birth_place: application.birth_place || "",
      gender: application.gender || "",
      marital_status: application.marital_status || "",
      citizenship: application.citizenship || "",
      address: application.address || "",
      city: application.city || "",
      postal_code: application.postal_code || "",
      program: application.program || "",
      study_type: application.study_type || "",
      father_name: application.father_name || "",
      father_occupation: application.father_occupation || "",
      father_address: application.father_address || "",
      mother_name: application.mother_name || "",
      mother_occupation: application.mother_occupation || "",
      mother_address: application.mother_address || "",
      previous_institution: application.previous_institution || "",
      previous_program: application.previous_program || "",
      previous_completion_year: application.previous_completion_year || "",
      other_education: application.other_education || "",
      ranking_score: application.ranking_score || "",
      consent: true, // već je dao suglasnost pri prvoj prijavi
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
        <p className={styles.successText}>Vaša izmjena je uspješno zaprimljena. Administratori će pregledati vašu prijavu.</p>
      </div>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Osobni podaci */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Osobni podaci</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Ime" fullWidth error={!!errors.first_name} helperText={errors.first_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Prezime" fullWidth error={!!errors.last_name} helperText={errors.last_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => <TextField {...field} label="Mobitel" fullWidth error={!!errors.phone} helperText={errors.phone?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="oib" control={control} render={({ field }) => <TextField {...field} label="OIB" fullWidth disabled helperText="OIB se ne može mijenjati" />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="birth_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Datum rođenja"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.birth_date}
                  helperText={errors.birth_date?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="birth_place"
              control={control}
              render={({ field }) => <TextField {...field} label="Mjesto rođenja" fullWidth error={!!errors.birth_place} helperText={errors.birth_place?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel>Spol</InputLabel>
                  <Select {...field} label="Spol">
                    {genderOptions.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="marital_status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.marital_status}>
                  <InputLabel>Bračno stanje</InputLabel>
                  <Select {...field} label="Bračno stanje">
                    {maritalOptions.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.marital_status && <FormHelperText>{errors.marital_status.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="citizenship"
              control={control}
              render={({ field }) => <TextField {...field} label="Državljanstvo" fullWidth error={!!errors.citizenship} helperText={errors.citizenship?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => <TextField {...field} label="Adresa" fullWidth error={!!errors.address} helperText={errors.address?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => <TextField {...field} label="Grad" fullWidth error={!!errors.city} helperText={errors.city?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="postal_code"
              control={control}
              render={({ field }) => <TextField {...field} label="Poštanski broj" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />}
            />
          </Grid>
        </Grid>
      </div>

      {/* Roditelji */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Podaci o roditeljima</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-600)", mb: 1 }}>
              Otac
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="father_name" control={control} render={({ field }) => <TextField {...field} label="Ime oca" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="father_occupation" control={control} render={({ field }) => <TextField {...field} label="Zvanje i zanimanje oca" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="father_address" control={control} render={({ field }) => <TextField {...field} label="Adresa oca" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-600)", mb: 1, mt: 1 }}>
              Majka
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="mother_name" control={control} render={({ field }) => <TextField {...field} label="Ime majke" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="mother_occupation" control={control} render={({ field }) => <TextField {...field} label="Zvanje i zanimanje majke" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="mother_address" control={control} render={({ field }) => <TextField {...field} label="Adresa majke" fullWidth />} />
          </Grid>
        </Grid>
      </div>

      {/* Studij */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Podaci o studiju</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="program"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Studij" fullWidth error={!!errors.program} helperText={errors.program?.message}>
                  {allPrograms.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="study_type"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Vrsta studiranja" fullWidth error={!!errors.study_type} helperText={errors.study_type?.message}>
                  {studyTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="ranking_score" control={control} render={({ field }) => <TextField {...field} label="Plasman na rang listi" fullWidth placeholder="npr. 85.50" />} />
          </Grid>
        </Grid>
      </div>

      {/* Prethodno obrazovanje */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Prethodno obrazovanje</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="previous_institution"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Završena srednja škola" fullWidth error={!!errors.previous_institution} helperText={errors.previous_institution?.message} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller
              name="previous_program"
              control={control}
              render={({ field }) => <TextField {...field} label="Program / smjer" fullWidth error={!!errors.previous_program} helperText={errors.previous_program?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="previous_completion_year"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Godina završetka" fullWidth error={!!errors.previous_completion_year} helperText={errors.previous_completion_year?.message} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="other_education"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Je li završio/la ili polazio/la drugi fakultet ili višu školu?"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Unesite naziv i razlog prekida studija, ili ostavite prazno"
                />
              )}
            />
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
