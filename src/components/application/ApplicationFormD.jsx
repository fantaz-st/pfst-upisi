"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import FolderIcon from "@mui/icons-material/Folder";
import { studyPrograms, studyTypes, documentTypeLabels, getDiplomskiPreviousStudyOptions, getDiplomskiRequiredDocuments } from "@/lib/applications/config";
import { submitApplicationD, attachDocumentsMeta } from "@/lib/applications/actions";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import DocumentUpload from "@/components/application/DocumentUpload";
import styles from "./ApplicationForm.module.css";

function validateOib(oib) {
  if (!/^\d{11}$/.test(oib)) return false;
  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = (a + parseInt(oib[i])) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  const check = 11 - a === 10 ? 0 : 11 - a;
  return check === parseInt(oib[10]);
}

const schema = z.object({
  program: z.string().min(1, "Odaberite studij"),
  study_type: z.string().min(1, "Odaberite vrstu studija"),
  previous_study_institution: z.enum(["pfst_current", "pfst_previous", "other"], {
    errorMap: () => ({ message: "Odaberite gdje ste završili prijediplomski studij" }),
  }),
  first_name: z.string().min(1, "Obavezno polje"),
  last_name: z.string().min(1, "Obavezno polje"),
  oib: z.string().length(11, "OIB mora imati 11 znamenki").refine(validateOib, { message: "OIB nije valjan" }),
  phone: z.string().min(1, "Obavezno polje"),
  email: z.string().email("Unesite ispravnu email adresu"),
  birth_date: z.string().min(1, "Obavezno polje"),
  father_name: z.string().optional(),
  address: z.string().min(1, "Obavezno polje"),
  city: z.string().min(1, "Obavezno polje"),
  postal_code: z.string().min(1, "Obavezno polje"),
  country: z.string().min(1, "Obavezno polje"),
  previous_completion_year: z.string().regex(/^\d{4}$/, "Unesite valjanu godinu"),
  consent: z.literal(true, { errorMap: () => ({ message: "Morate prihvatiti uvjete" }) }),
});

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid var(--gray-100)" }}>
      <Box sx={{ color: "var(--blue-main)", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>{title}</Typography>
    </Box>
  );
}

export default function ApplicationFormD({ intake }) {
  const [serverError, setServerError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [combinedMode, setCombinedMode] = useState(false);
  const [combinedFile, setCombinedFile] = useState(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      program: studyPrograms.diplomski[0]?.value || "bs",
      study_type: "redoviti",
      previous_study_institution: undefined,
      first_name: "", last_name: "",
      oib: "", phone: "", email: "",
      birth_date: "", father_name: "",
      address: "", city: "", postal_code: "", country: "Hrvatska",
      previous_completion_year: "",
      consent: false,
    },
  });

  const watchedPreviousStudy = watch("previous_study_institution");
  const previousStudyOptions = getDiplomskiPreviousStudyOptions(intake);
  const requiredDocuments = watchedPreviousStudy ? getDiplomskiRequiredDocuments(watchedPreviousStudy) : [];

  const onSubmit = async (data) => {
    setServerError(null);

    if (combinedMode) {
      if (!combinedFile) { setServerError("Molimo učitajte datoteku sa svim dokumentima."); return; }
    } else if (watchedPreviousStudy) {
      const missing = requiredDocuments.filter(d => !uploadedFiles[d]);
      if (missing.length > 0) {
        setServerError(`Nedostaju dokumenti: ${missing.map(d => documentTypeLabels[d]).join(", ")}`);
        return;
      }
    }

    const filesToUpload = combinedMode && combinedFile
      ? [{ documentType: "combined_documents", file: combinedFile }]
      : Object.entries(uploadedFiles).map(([documentType, file]) => ({ documentType, file }));

    // Mapiramo country → citizenship jer actions.js to koristi
    // Prijave submitamo BEZ datoteka — file upload ide direktno iz browsera
    // u Supabase Storage nakon što dobijemo applicationId (izbjegavamo Vercel timeout).
    const result = await submitApplicationD(
      { ...data, citizenship: data.country },
      intake.slug,
      [] // datoteke se šalju kasnije, klijent-side
    );

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    if (result?.applicationId && filesToUpload.length > 0) {
      const supabase = createBrowserSupabase();
      const uploadResults = await Promise.allSettled(
        filesToUpload
          .filter((f) => f.file)
          .map(async ({ documentType, file }) => {
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const filePath = `applications/${result.applicationId}/${documentType}/${timestamp}-${sanitizedName}`;
            const { error } = await supabase.storage
              .from("application-documents")
              .upload(filePath, file, { contentType: file.type, upsert: false });
            if (error) throw new Error(error.message);
            return {
              documentType,
              filePath,
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
            };
          })
      );

      const uploaded = uploadResults.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failedCount = uploadResults.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        setServerError(
          `Prijava je zaprimljena (broj ${result.applicationNumber}), ali nisu se prenijeli svi dokumenti (${failedCount} od ${filesToUpload.length}). ` +
            "Pokušajte poslati prijavu ponovo — postojeći zapis će biti prepoznat."
        );
        return;
      }

      if (uploaded.length > 0) {
        const metaResult = await attachDocumentsMeta(result.applicationId, uploaded);
        if (metaResult?.error) {
          setServerError(
            `Prijava je zaprimljena, dokumenti preneseni, ali evidencija dokumenata nije spremljena. Javite se referadi s brojem ${result.applicationNumber}.`
          );
          return;
        }
      }
    }

    if (result?.success) window.location.href = "/prijava/uspjesno?broj=" + result.applicationNumber;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Studij */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<SchoolIcon sx={{ fontSize: 18 }} />} title="Podaci o studiju" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
              Prijavljujem se za upis u I. godinu na diplomski sveučilišni studij — studij: *
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
              Status: *
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
              Prijediplomski studij završen: *
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
      </Paper>

      {/* Osobni podaci */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<PersonIcon sx={{ fontSize: 18 }} />} title="Osobni podaci" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="first_name" control={control} render={({ field }) => (
              <TextField {...field} label="Ime *" fullWidth error={!!errors.first_name} helperText={errors.first_name?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="last_name" control={control} render={({ field }) => (
              <TextField {...field} label="Prezime *" fullWidth error={!!errors.last_name} helperText={errors.last_name?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="oib" control={control} render={({ field }) => (
              <TextField {...field} label="OIB *" fullWidth error={!!errors.oib} helperText={errors.oib?.message} slotProps={{ htmlInput: { maxLength: 11 } }} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="phone" control={control} render={({ field }) => (
              <TextField {...field} label="Mobitel *" fullWidth error={!!errors.phone} helperText={errors.phone?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} label="Email adresa *" type="email" fullWidth error={!!errors.email}
                helperText={errors.email?.message || "Koristite email koji redovito provjeravate — na njega ćemo slati sve obavijesti."} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="birth_date" control={control} render={({ field }) => (
              <TextField {...field} label="Datum rođenja *" type="date" fullWidth error={!!errors.birth_date}
                helperText={errors.birth_date?.message} slotProps={{ inputLabel: { shrink: true } }} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="father_name" control={control} render={({ field }) => (
              <TextField {...field} label="Ime oca" fullWidth />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="previous_completion_year" control={control} render={({ field }) => (
              <TextField {...field} label="Godina diplomiranja *" fullWidth error={!!errors.previous_completion_year} helperText={errors.previous_completion_year?.message} placeholder="npr. 2025" />
            )} />
          </Grid>
        </Grid>
      </Paper>

      {/* Adresa */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<HomeIcon sx={{ fontSize: 18 }} />} title="Adresa boravka" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller name="address" control={control} render={({ field }) => (
              <TextField {...field} label="Adresa i kućni broj *" fullWidth error={!!errors.address} helperText={errors.address?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller name="city" control={control} render={({ field }) => (
              <TextField {...field} label="Mjesto *" fullWidth error={!!errors.city} helperText={errors.city?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller name="postal_code" control={control} render={({ field }) => (
              <TextField {...field} label="Poštanski broj *" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />
            )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="country" control={control} render={({ field }) => (
              <TextField {...field} label="Država *" fullWidth error={!!errors.country} helperText={errors.country?.message} />
            )} />
          </Grid>
        </Grid>
      </Paper>

      {/* Dokumenti */}
      {watchedPreviousStudy && (
        <Paper variant="outlined" className={styles.sectionPaper}>
          <SectionHeader icon={<FolderIcon sx={{ fontSize: 18 }} />} title="Dokumenti" />

          <FormControlLabel
            control={
              <Checkbox
                checked={combinedMode}
                onChange={e => { setCombinedMode(e.target.checked); setUploadedFiles({}); setCombinedFile(null); }}
              />
            }
            label={<Typography variant="body2">Svi dokumenti su skenirani u jednu datoteku</Typography>}
            sx={{ mb: 2 }}
          />

          {combinedMode ? (
            <DocumentUpload documentType="combined_documents" label="Svi dokumenti (jedna datoteka)" required onFileChange={setCombinedFile} />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {requiredDocuments.map(docType => (
                <DocumentUpload
                  key={docType}
                  documentType={docType}
                  label={documentTypeLabels[docType] || docType}
                  required
                  onFileChange={file => setUploadedFiles(prev => ({ ...prev, [docType]: file }))}
                />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Privola */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <Controller name="consent" control={control} render={({ field }) => (
          <FormControlLabel
            control={<Checkbox checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />}
            label={<Typography variant="body2">Suglasan/na sam s uvjetima prikupljanja i obrade osobnih podataka *</Typography>}
          />
        )} />
        {errors.consent && <Typography variant="caption" color="error" sx={{ display: "block" }}>{errors.consent.message}</Typography>}
      </Paper>

      {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

      <Box className={styles.submitContainer}>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? <><CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />Slanje...</> : "Pošalji prijavu"}
        </Button>
      </Box>
    </form>
  );
}
