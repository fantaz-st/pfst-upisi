"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { fullApplicationSchema } from "@/lib/applications/validation";
import { submitApplication } from "@/lib/applications/actions";
import DocumentUpload from "./DocumentUpload";
import { applicationConfigs, documentTypeLabels, studyPrograms, studyTypes } from "@/lib/applications/config";
import styles from "./ApplicationForm.module.css";

export default function ApplicationForm({ intake }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const config = applicationConfigs[intake.slug] ?? {
    title: `Prijava za ${intake.title}`,
    requiredDocuments: [],
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(fullApplicationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      oib: "",
      birth_date: "",
      citizenship: "hrvatsko",
      address: "",
      city: "",
      postal_code: "",
      program: "",
      study_type: "",
      previous_institution: "",
      previous_program: "",
      previous_completion_year: "",
      consent: false,
    },
  });

  const fillTestData = () => {
    setValue("first_name", "Čedomir");
    setValue("last_name", "Babić");
    setValue("email", "cbabic@pfst.hr");
    setValue("phone", "+385997973959");
    setValue("oib", "71233233747");
    setValue("birth_date", "1988-06-02");
    setValue("citizenship", "hrvatsko");
    setValue("address", "Vinkovačka 45");
    setValue("city", "Split");
    setValue("postal_code", "21000");
    setValue("program", "peit");
    setValue("study_type", "redoviti");
    setValue("previous_institution", "PFST");
    setValue("previous_program", "PEIT");
    setValue("previous_completion_year", "2006");
    setValue("consent", true);
  };

  const onSubmit = async (data) => {
    const missingDocs = config.requiredDocuments.filter((docType) => !uploadedFiles[docType]);
    if (missingDocs.length > 0) {
      setServerError(`Nedostaju obavezni dokumenti: ${missingDocs.map((d) => documentTypeLabels[d]).join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await submitApplication(data, intake.slug);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.applicationId && Object.keys(uploadedFiles).length > 0) {
        const { uploadDocuments } = await import("@/lib/applications/actions");
        const filesToUpload = Object.entries(uploadedFiles).map(([documentType, file]) => ({ documentType, file }));
        await uploadDocuments(result.applicationId, filesToUpload);
      }

      router.push(`/prijava/uspjesno?broj=${result.applicationNumber}`);
    } catch (err) {
      setServerError("Greška pri slanju prijave. Pokušajte ponovo.");
      setIsSubmitting(false);
    }
  };

  const SectionHeader = ({ icon, title }) => (
    <Box className={styles.sectionHeader}>
      <Box className={styles.sectionIcon}>{icon}</Box>
      <Typography className={styles.sectionTitle}>{title}</Typography>
    </Box>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {process.env.NODE_ENV === "development" && (
        <Alert severity="info" className={styles.testAlert}>
          <Box className={styles.testAlertContent}>
            <Typography variant="body2">Testni način</Typography>
            <Button onClick={fillTestData} variant="outlined" size="small" sx={{ ml: 2 }}>
              Popuni test podatke
            </Button>
          </Box>
        </Alert>
      )}

      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {serverError}
        </Alert>
      )}

      {/* Odabir studija */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<SchoolIcon sx={{ fontSize: 18 }} />} title="Podaci o studiju" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="program"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.program}>
                  <InputLabel>Odabir studija *</InputLabel>
                  <Select {...field} label="Odabir studija *">
                    {studyPrograms[intake.slug]?.map((prog) => (
                      <MenuItem key={prog.value} value={prog.value}>
                        {prog.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.program && <FormHelperText>{errors.program.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="study_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.study_type}>
                  <InputLabel>Vrsta studiranja *</InputLabel>
                  <Select {...field} label="Vrsta studiranja *">
                    {studyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.study_type && <FormHelperText>{errors.study_type.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Osobni podaci */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<PersonIcon sx={{ fontSize: 18 }} />} title="Osobni podaci" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Ime *" fullWidth error={!!errors.first_name} helperText={errors.first_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Prezime *" fullWidth error={!!errors.last_name} helperText={errors.last_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <TextField {...field} label="Email adresa *" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Broj mobitela" type="tel" fullWidth error={!!errors.phone} helperText={errors.phone?.message} placeholder="+385 91 234 5678" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="oib"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="OIB *" fullWidth error={!!errors.oib} helperText={errors.oib?.message} slotProps={{ input: { maxLength: 11 } }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="birth_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Datum rođenja *"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.birth_date}
                  helperText={errors.birth_date?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="citizenship"
              control={control}
              render={({ field }) => <TextField {...field} label="Državljanstvo *" fullWidth error={!!errors.citizenship} helperText={errors.citizenship?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => <TextField {...field} label="Adresa *" fullWidth error={!!errors.address} helperText={errors.address?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="postal_code"
              control={control}
              render={({ field }) => <TextField {...field} label="Poštanski broj *" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => <TextField {...field} label="Grad *" fullWidth error={!!errors.city} helperText={errors.city?.message} />}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Prethodno obrazovanje */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<SchoolIcon sx={{ fontSize: 18 }} />} title="Prethodno obrazovanje" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="previous_institution"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Prethodna obrazovna ustanova *"
                  fullWidth
                  error={!!errors.previous_institution}
                  helperText={errors.previous_institution?.message}
                  placeholder="npr. Srednja pomorska škola Split"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller
              name="previous_program"
              control={control}
              render={({ field }) => <TextField {...field} label="Program / smjer *" fullWidth error={!!errors.previous_program} helperText={errors.previous_program?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="previous_completion_year"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Godina završetka *"
                  fullWidth
                  error={!!errors.previous_completion_year}
                  helperText={errors.previous_completion_year?.message}
                  placeholder="2024"
                  slotProps={{ input: { maxLength: 4 } }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Dokumenti */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<UploadFileIcon sx={{ fontSize: 18 }} />} title="Dokumenti" />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Učitajte skenove ili fotografije svih traženih dokumenata (PDF, JPG, PNG — max 10MB po datoteci).
        </Typography>
        <Stack spacing={2}>
          {config.requiredDocuments.map((docType) => (
            <DocumentUpload
              key={docType}
              documentType={docType}
              label={documentTypeLabels[docType]}
              required
              onFileChange={(file) => setUploadedFiles((prev) => ({ ...prev, [docType]: file }))}
            />
          ))}
        </Stack>
      </Paper>

      {/* Suglasnost */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <Controller
          name="consent"
          control={control}
          render={({ field }) => (
            <Box>
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} color="primary" />}
                label={
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    Potvrđujem da su svi uneseni podaci točni i da su priloženi dokumenti autentični. Suglasan/na sam s obradom osobnih podataka u svrhu upisa na Pomorski fakultet
                    Split, sukladno Uredbi (EU) 2016/679 (GDPR).
                  </Typography>
                }
              />
              {errors.consent && <FormHelperText error>{errors.consent.message}</FormHelperText>}
            </Box>
          )}
        />
      </Paper>

      {/* Submit */}
      <Box className={styles.submitContainer}>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />
              Slanje...
            </>
          ) : (
            "Pošalji prijavu"
          )}
        </Button>
      </Box>
    </Box>
  );
}
