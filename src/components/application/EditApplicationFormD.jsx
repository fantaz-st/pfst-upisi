"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import { diplomskiApplicationSchema } from "@/lib/applications/validation";
import { updateApplicationViaToken, uploadDocumentsViaToken } from "@/lib/applications/actions";
import {
  studyPrograms,
  studyTypes,
  documentTypeLabels,
  getDiplomskiPreviousStudyOptions,
  getDiplomskiRequiredDocuments,
  applicationConfigs,
} from "@/lib/applications/config";
import DocumentUpload from "./DocumentUpload";
import styles from "./EditApplicationForm.module.css";

// Izmjena prijave za diplomski (prijava_d) — polja i raspored prate
// ApplicationFormD (izvorni obrazac prijave), ne EditApplicationForm (upis_pd).
// Nema fotografije jer je diplomski obrazac nikad nije prikupljao.
export default function EditApplicationFormD({ application, token }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [combinedMode, setCombinedMode] = useState(false);
  const [combinedFile, setCombinedFile] = useState(null);

  const intake = application.intakes;
  const existingDocs = application.application_documents || [];

  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(diplomskiApplicationSchema),
    defaultValues: {
      program: application.program || "",
      study_type: application.study_type || "",
      previous_study_institution: application.previous_study_institution || undefined,
      first_name: application.first_name || "",
      last_name: application.last_name || "",
      oib: application.oib || "",
      phone: application.phone || "",
      email: application.email || "",
      birth_date: application.birth_date || "",
      father_name: application.father_name || "",
      address: application.address || "",
      city: application.city || "",
      postal_code: application.postal_code || "",
      citizenship: application.citizenship || "",
      previous_completion_year: application.previous_completion_year || "",
      consent: true, // već je dao suglasnost pri prvoj prijavi
    },
  });

  const watchedPreviousStudy = watch("previous_study_institution");
  const previousStudyOptions = getDiplomskiPreviousStudyOptions(intake);
  const requiredDocuments = watchedPreviousStudy ? getDiplomskiRequiredDocuments(watchedPreviousStudy) : [];

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    const result = await updateApplicationViaToken(token, data);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const filesToUpload = combinedMode && combinedFile
      ? [{ documentType: "combined_documents", file: combinedFile }]
      : Object.entries(uploadedFiles).map(([documentType, file]) => ({ documentType, file }));

    if (filesToUpload.length > 0) {
      const uploadResult = await uploadDocumentsViaToken(token, filesToUpload);
      if (uploadResult.error) {
        setError(uploadResult.error);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
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

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Podaci o studiju */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Podaci o studiju</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
              Studij
            </Typography>
            <Controller name="program" control={control} render={({ field }) => (
              <RadioGroup row value={field.value} onChange={e => field.onChange(e.target.value)}>
                {studyPrograms.diplomski.map(p => (
                  <FormControlLabel key={p.value} value={p.value} control={<Radio size="small" />}
                    label={<Typography variant="body2">{p.label}</Typography>}
                    sx={{ mr: 3 }}
                  />
                ))}
              </RadioGroup>
            )} />
            {errors.program && <Typography variant="caption" color="error">{errors.program.message}</Typography>}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
              Status
            </Typography>
            <Controller name="study_type" control={control} render={({ field }) => (
              <RadioGroup row value={field.value} onChange={e => field.onChange(e.target.value)}>
                {studyTypes.map(t => (
                  <FormControlLabel key={t.value} value={t.value} control={<Radio size="small" />}
                    label={<Typography variant="body2">{t.label} student</Typography>}
                    sx={{ mr: 3 }}
                  />
                ))}
              </RadioGroup>
            )} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
              Prijediplomski studij završen
            </Typography>
            {errors.previous_study_institution && (
              <Typography variant="caption" color="error" sx={{ display: "block", mb: 0.5 }}>
                {errors.previous_study_institution.message}
              </Typography>
            )}
            <Controller name="previous_study_institution" control={control} render={({ field }) => (
              <RadioGroup value={field.value ?? ""} onChange={e => field.onChange(e.target.value)}>
                {previousStudyOptions.map(opt => (
                  <FormControlLabel key={opt.value} value={opt.value}
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{opt.label}</Typography>}
                    sx={{ mb: 0.25 }}
                  />
                ))}
              </RadioGroup>
            )} />
          </Grid>
        </Grid>
      </div>

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
            <Controller name="oib" control={control} render={({ field }) => (
              <TextField {...field} label="OIB" fullWidth disabled helperText="OIB se ne može mijenjati" />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="phone" control={control} render={({ field }) => (
              <TextField {...field} label="Mobitel" fullWidth error={!!errors.phone} helperText={errors.phone?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} label="Email adresa" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="birth_date" control={control} render={({ field }) => (
              <TextField {...field} label="Datum rođenja" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} error={!!errors.birth_date} helperText={errors.birth_date?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="father_name" control={control} render={({ field }) => (
              <TextField {...field} label="Ime oca" fullWidth />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="previous_completion_year" control={control} render={({ field }) => (
              <TextField {...field} label="Godina diplomiranja" fullWidth error={!!errors.previous_completion_year} helperText={errors.previous_completion_year?.message} placeholder="npr. 2025" />
            )} />
          </Grid>
        </Grid>
      </div>

      {/* Adresa */}
      <div className={styles.sectionPaper}>
        <h3 className={styles.sectionTitle}>Adresa boravka</h3>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller name="address" control={control} render={({ field }) => (
              <TextField {...field} label="Adresa i kućni broj" fullWidth error={!!errors.address} helperText={errors.address?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller name="city" control={control} render={({ field }) => (
              <TextField {...field} label="Mjesto" fullWidth error={!!errors.city} helperText={errors.city?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller name="postal_code" control={control} render={({ field }) => (
              <TextField {...field} label="Poštanski broj" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="citizenship" control={control} render={({ field }) => (
              <TextField {...field} label="Država" fullWidth error={!!errors.citizenship} helperText={errors.citizenship?.message} />
            )} />
          </Grid>
        </Grid>
      </div>

      {/* Dokumenti */}
      {watchedPreviousStudy && (
        <div className={styles.sectionPaper}>
          <h3 className={styles.sectionTitle}>Dokumenti</h3>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ako želite zamijeniti neki dokument, učitajte novu datoteku. Ako ne učitate ništa, postojeća datoteka ostaje nepromijenjena.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={combinedMode}
                  onChange={e => { setCombinedMode(e.target.checked); setUploadedFiles({}); setCombinedFile(null); }}
                />
              }
              label={<Typography variant="body2">Svi dokumenti su skenirani u jednu datoteku</Typography>}
            />

            {combinedMode ? (
              <Box>
                {(() => {
                  const existingCombined = existingDocs.find(d => d.document_type === "combined_documents");
                  return existingCombined && !combinedFile && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Datoteka sa svim dokumentima je već učitana ({existingCombined.file_name}). Učitajte novu samo ako želite zamijeniti.
                    </Alert>
                  );
                })()}
                <DocumentUpload documentType="combined_documents" label="Svi dokumenti (jedna datoteka)" required={false} onFileChange={setCombinedFile} />
              </Box>
            ) : (
              [...new Set([
                ...existingDocs.filter(d => d.document_type !== "combined_documents").map(d => d.document_type),
                ...requiredDocuments,
                ...(applicationConfigs.diplomski.optionalDocuments || []),
              ])].map(docType => {
                const existingDoc = existingDocs.find(d => d.document_type === docType);
                const isOptional = (applicationConfigs.diplomski.optionalDocuments || []).includes(docType) && !requiredDocuments.includes(docType);
                const label = (documentTypeLabels[docType] || docType) + (isOptional ? " (neobavezno)" : "");
                return (
                  <Box key={docType}>
                    {existingDoc && !uploadedFiles[docType] && (
                      <Alert severity="info" sx={{ mb: 1 }}>
                        {label} je već učitan ({existingDoc.file_name}). Učitajte novi samo ako želite zamijeniti.
                      </Alert>
                    )}
                    <DocumentUpload
                      documentType={docType}
                      label={label}
                      required={false}
                      onFileChange={file => setUploadedFiles(prev => ({ ...prev, [docType]: file }))}
                    />
                  </Box>
                );
              })
            )}
          </Stack>
        </div>
      )}

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
