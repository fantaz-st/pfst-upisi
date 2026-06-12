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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import { fullApplicationSchema } from "@/lib/applications/validation";
import { submitApplication, requestEditLinkForExisting } from "@/lib/applications/actions";
import DocumentUpload from "./DocumentUpload";
import PhotoUpload from "./PhotoUpload";
import { applicationConfigs, documentTypeLabels, studyPrograms, studyTypes, enrollmentTypeOptions, enrollmentTypeRequiresTuition } from "@/lib/applications/config";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import styles from "./ApplicationForm.module.css";

const genderOptions = [
  { value: "muški", label: "Muški" },
  { value: "ženski", label: "Ženski" },
  { value: "ostalo", label: "Ostalo" },
];

const maritalOptions = ["Neoženjen / Neudana", "Oženjen / Udana", "Razveden/a", "Udovac / Udovica"];

export default function ApplicationForm({ intake }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [photo, setPhoto] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null); // { duplicateType, existingApplication }
  const [pendingFormData, setPendingFormData] = useState(null);
  const [linkSent, setLinkSent] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [combinedMode, setCombinedMode] = useState(false);
  const [combinedFile, setCombinedFile] = useState(null);

  const config = applicationConfigs[intake.study_level] ??
    applicationConfigs[intake.slug] ?? {
      title: `Prijava za ${intake.title}`,
      requiredDocuments: [],
    };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(fullApplicationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      oib: "",
      birth_date: "",
      birth_place: "",
      gender: "",
      marital_status: "",
      citizenship: "hrvatsko",
      address: "",
      city: "",
      postal_code: "",
      program: "",
      study_type: "",
      father_name: "",
      father_occupation: "",
      father_address: "",
      mother_name: "",
      mother_occupation: "",
      mother_address: "",
      previous_institution: "",
      previous_program: "",
      previous_completion_year: "",
      other_education: "",
      ranking_score: "",
      enrollment_type: null,
      consent: false,
    },
  });

  const watchedStudyType = watch("study_type");
  const watchedProgram = watch("program");
  const watchedEnrollmentType = watch("enrollment_type");

  const showEnrollmentDeclaration = watchedStudyType === "redoviti";
  const needsTuitionPayment = watchedStudyType === "izvanredni" || (watchedStudyType === "redoviti" && enrollmentTypeRequiresTuition(watchedEnrollmentType));
  const needsOccupationalMedicine = watchedProgram !== "pm";

  // Dinamička lista obaveznih dokumenata
  const dynamicRequiredDocuments = [
    ...config.requiredDocuments,
    ...(needsTuitionPayment ? ["tuition_payment_confirmation"] : []),
    ...(needsOccupationalMedicine ? ["occupational_medicine_certificate"] : []),
  ];

  const doSubmit = async (data, force = false) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await submitApplication(data, intake.slug, force);

      if (result.duplicate) {
        setPendingFormData(data);
        setDuplicateInfo(result);
        setIsSubmitting(false);
        return;
      }

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.applicationId) {
        const { uploadDocuments } = await import("@/lib/applications/actions");
        const filesToUpload = combinedMode
          ? [
              { documentType: "photo", file: photo },
              { documentType: "combined_documents", file: combinedFile },
            ]
          : [{ documentType: "photo", file: photo }, ...Object.entries(uploadedFiles).map(([documentType, file]) => ({ documentType, file }))];
        await uploadDocuments(result.applicationId, filesToUpload);
      }

      router.push(`/prijava/uspjesno?broj=${result.applicationNumber}`);
    } catch (err) {
      setServerError("Greška pri slanju prijave. Pokušajte ponovo.");
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    if (!photo) {
      setServerError("Molimo dodajte fotografiju pristupnika.");
      return;
    }

    if (showEnrollmentDeclaration && !data.enrollment_type) {
      setServerError("Molimo odaberite izjavu o upisu.");
      return;
    }

    if (combinedMode) {
      if (!combinedFile) {
        setServerError("Molimo učitajte datoteku sa svim dokumentima.");
        return;
      }
    } else {
      const missingDocs = dynamicRequiredDocuments.filter((docType) => !uploadedFiles[docType]);
      if (missingDocs.length > 0) {
        setServerError(`Nedostaju obavezni dokumenti: ${missingDocs.map((d) => documentTypeLabels[d]).join(", ")}`);
        return;
      }
    }

    await doSubmit(data, false);
  };

  const handleSendEditLink = async () => {
    if (!duplicateInfo?.existingApplication?.id) return;
    setSendingLink(true);
    const result = await requestEditLinkForExisting(duplicateInfo.existingApplication.id);
    setSendingLink(false);
    if (result.success) {
      setLinkSent(true);
    } else {
      setServerError(result.error || "Greška pri slanju emaila.");
      setDuplicateInfo(null);
    }
  };

  const handleSendAnyway = async () => {
    setDuplicateInfo(null);
    if (pendingFormData) {
      await doSubmit(pendingFormData, true);
    }
  };

  const handleCloseDuplicateModal = () => {
    setDuplicateInfo(null);
    setPendingFormData(null);
    setLinkSent(false);
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
            <Button
              onClick={async () => {
                const { default: fillTestData } = await import("./fillTestData");
                fillTestData(setValue, intake);
              }}
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
            >
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
                    {(studyPrograms[intake.study_level] || studyPrograms[intake.slug])?.map((prog) => (
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="ranking_score"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Plasman na rang listi" fullWidth error={!!errors.ranking_score} helperText={errors.ranking_score?.message} placeholder="npr. 85.50" />
              )}
            />
          </Grid>

          {showEnrollmentDeclaration && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)", mb: 1 }}>
                Izjava o upisu *
              </Typography>

              <Controller
                name="enrollment_type"
                control={control}
                render={({ field }) => (
                  <RadioGroup value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.value))}>
                    {enrollmentTypeOptions.map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio size="small" />}
                        label={
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {opt.label}
                          </Typography>
                        }
                        sx={{ alignItems: "flex-start", mb: 0.5, "& .MuiRadio-root": { mt: -0.5 } }}
                      />
                    ))}
                  </RadioGroup>
                )}
              />
            </Grid>
          )}
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="birth_place"
              control={control}
              render={({ field }) => <TextField {...field} label="Mjesto rođenja *" fullWidth error={!!errors.birth_place} helperText={errors.birth_place?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel>Spol *</InputLabel>
                  <Select {...field} label="Spol *">
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
                  <InputLabel>Bračno stanje *</InputLabel>
                  <Select {...field} label="Bračno stanje *">
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
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => <TextField {...field} label="Grad *" fullWidth error={!!errors.city} helperText={errors.city?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="postal_code"
              control={control}
              render={({ field }) => <TextField {...field} label="Poštanski broj *" fullWidth error={!!errors.postal_code} helperText={errors.postal_code?.message} />}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Podaci o roditeljima */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<FamilyRestroomIcon sx={{ fontSize: 18 }} />} title="Podaci o roditeljima" />
        <Grid container spacing={2}>
          {/* Otac */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-600)", mb: 1 }}>
              Otac
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="father_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Ime oca" fullWidth error={!!errors.father_name} helperText={errors.father_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="father_occupation"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Zvanje i zanimanje oca" fullWidth error={!!errors.father_occupation} helperText={errors.father_occupation?.message} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="father_address"
              control={control}
              render={({ field }) => <TextField {...field} label="Adresa oca" fullWidth error={!!errors.father_address} helperText={errors.father_address?.message} />}
            />
          </Grid>
          {/* Majka */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-600)", mb: 1, mt: 1 }}>
              Majka
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="mother_name"
              control={control}
              render={({ field }) => <TextField {...field} label="Ime majke" fullWidth error={!!errors.mother_name} helperText={errors.mother_name?.message} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="mother_occupation"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Zvanje i zanimanje majke" fullWidth error={!!errors.mother_occupation} helperText={errors.mother_occupation?.message} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="mother_address"
              control={control}
              render={({ field }) => <TextField {...field} label="Adresa majke" fullWidth error={!!errors.mother_address} helperText={errors.mother_address?.message} />}
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
                  label="Završena srednja škola *"
                  fullWidth
                  error={!!errors.previous_institution}
                  helperText={errors.previous_institution?.message}
                  placeholder="npr. Pomorska škola Split"
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
                  error={!!errors.other_education}
                  helperText={errors.other_education?.message}
                  placeholder="Unesite naziv i razlog prekida studija, ili ostavite prazno"
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Fotografija + Dokumenti */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<UploadFileIcon sx={{ fontSize: 18 }} />} title="Fotografija i dokumenti" />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Učitajte fotografiju i skenove ili fotografije svih traženih dokumenata (PDF, JPG, PNG — max 10MB po datoteci).
        </Typography>
        <Stack spacing={2}>
          <PhotoUpload onPhotoChange={setPhoto} />

          <FormControlLabel
            control={
              <Checkbox
                checked={combinedMode}
                onChange={(e) => {
                  setCombinedMode(e.target.checked);
                  setUploadedFiles({});
                  setCombinedFile(null);
                }}
              />
            }
            label={<Typography variant="body2">Svi dokumenti su skenirani u jednu datoteku</Typography>}
          />

          {combinedMode ? (
            <DocumentUpload documentType="combined_documents" label="Svi dokumenti (jedna datoteka)" required onFileChange={setCombinedFile} />
          ) : (
            dynamicRequiredDocuments.map((docType) => (
              <DocumentUpload
                key={docType}
                documentType={docType}
                label={documentTypeLabels[docType]}
                required
                onFileChange={(file) => setUploadedFiles((prev) => ({ ...prev, [docType]: file }))}
              />
            ))
          )}
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
                  <Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1.5 }}>
                      Na temelju točke 32. Opće uredbe o zaštiti podataka, EC 2016/679 i odredbi Zakona o provedbi Opće uredbe o zaštiti osobnih podataka ("Narodne novine" broj
                      42/18), svojim potpisom dajem <strong>PRIVOLU</strong> Pomorskom fakultetu u Splitu da u svrhu ostvarivanja mojih prava iz studentskog standarda i službene
                      komunikacije tijekom studiranja koristi moje osobne podatke.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Napomena:
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: "var(--gray-600)" }}>
                      Navedeni osobni podaci koristit će se isključivo u gore navedenu svrhu u skladu s odredbama Opće uredbe o zaštiti podataka EC 2016/679, te se u druge svrhe ne
                      smiju koristiti bez pisane privole osobe na koju se odnose. Daljnja obrada osobnih podataka u povijesne, statističke ili znanstvene svrhe neće se smatrati
                      nepodudarnom, pod uvjetom da se poduzmu odgovarajuće zaštitne mjere. Student ima pravo u svako doba odustati od dane privole i zatražiti prestanak daljnje
                      obrade, na način da ispuni za to propisani obrazac te ga dostavi voditelju obrade osobnih podataka.
                    </Typography>
                  </Box>
                }
              />
              {errors.consent && <FormHelperText error>{errors.consent.message}</FormHelperText>}
            </Box>
          )}
        />
      </Paper>

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

      {/* Modal — duplikat OIB-a */}
      <Dialog open={!!duplicateInfo} onClose={handleCloseDuplicateModal} maxWidth="sm" fullWidth>
        {linkSent ? (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Link je poslan ✓</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                Poslali smo vam email s poveznicom za izmjenu vaše postojeće prijave ({duplicateInfo?.existingApplication?.application_number}). Provjerite svoj email i kliknite na
                poveznicu za nastavak.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={handleCloseDuplicateModal}
                variant="contained"
                sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
              >
                Zatvori
              </Button>
            </DialogActions>
          </>
        ) : duplicateInfo?.duplicateType === "same_program" ? (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Već imate prijavu</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1.5 }}>
                Pronašli smo postojeću prijavu s istim OIB-om za isti studij i vrstu studiranja (broj prijave:{" "}
                <strong>{duplicateInfo?.existingApplication?.application_number}</strong>).
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                Ako želite ispraviti podatke u toj prijavi, poslat ćemo vam poveznicu za izmjenu na email.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={handleCloseDuplicateModal} disabled={sendingLink}>
                Odustani
              </Button>
              <Button
                onClick={handleSendEditLink}
                variant="contained"
                disabled={sendingLink}
                startIcon={sendingLink ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
                sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
              >
                {sendingLink ? "Slanje..." : "Pošalji link za izmjenu"}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Već imate prijavu za drugi studij</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1.5 }}>
                Pronašli smo postojeću prijavu s istim OIB-om za drugi studij (broj prijave: <strong>{duplicateInfo?.existingApplication?.application_number}</strong>).
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                Ako je ovo namjerno (prijavljujete se na dva studija), možete poslati ovu novu prijavu. Ako je riječ o pogrešci, možemo vam poslati poveznicu za izmjenu postojeće
                prijave.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
              <Button onClick={handleSendEditLink} disabled={sendingLink} startIcon={sendingLink ? <CircularProgress size={16} /> : null}>
                {sendingLink ? "Slanje..." : "Pošalji link za izmjenu postojeće"}
              </Button>
              <Button
                onClick={handleSendAnyway}
                variant="contained"
                disabled={sendingLink || isSubmitting}
                sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
              >
                Ipak pošalji ovu prijavu
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
