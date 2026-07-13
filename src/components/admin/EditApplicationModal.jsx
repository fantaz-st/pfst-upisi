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
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import { studyPrograms, studyTypes, enrollmentTypeOptions, documentTypeLabels, applicationConfigs, enrollmentTypeRequiresTuition, getDiplomskiRequiredDocuments } from "@/lib/applications/config";
import { updateApplication, uploadDocuments } from "@/lib/applications/actions";
import PhotoUpload from "@/components/application/PhotoUpload";
import DocumentUpload from "@/components/application/DocumentUpload";

const genderOptions = [
  { value: "muški", label: "Muški" },
  { value: "ženski", label: "Ženski" },
  { value: "ostalo", label: "Ostalo" },
];

const maritalOptions = ["Neoženjen / Neudana", "Oženjen / Udana", "Razveden/a", "Udovac / Udovica"];

export default function EditApplicationModal({ open, onClose, application, intakeSlug, intakeStudyLevel, intakeFormType }) {
  const router = useRouter();
  // Dvostupanjska prijava na diplomski (prijava_d) prikuplja samo osnovne
  // podatke potrebne za prijavu. JMBAG, državljanstvo, mjesto rođenja, spol,
  // bračno stanje, podaci o roditeljima (osim imena oca), plasman/izjava o upisu,
  // podaci o srednjoj školi i drugom obrazovanju — sve to se prikuplja tek u
  // upisu (enrollments), pa se ovdje ne prikazuje za taj form_type.
  const showEnrollmentPersonalFields = intakeFormType !== "prijava_d";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [combinedMode, setCombinedMode] = useState(false);
  const [combinedFile, setCombinedFile] = useState(null);

  const existingDocs = application.application_documents || [];
  const existingPhoto = existingDocs.find((d) => d.document_type === "photo");
  const config = applicationConfigs[intakeStudyLevel] ?? applicationConfigs[intakeSlug] ?? { requiredDocuments: [] };
  const [formData, setFormData] = useState({
    jmbag: application.jmbag || "",
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
    enrollment_type: application.enrollment_type || null,
  });

  const allPrograms = studyPrograms[intakeStudyLevel] || studyPrograms[intakeSlug] || [...studyPrograms.prijediplomski, ...studyPrograms.diplomski];

  const needsTuitionPayment = formData.study_type === "izvanredni" || (formData.study_type === "redoviti" && enrollmentTypeRequiresTuition(formData.enrollment_type));
  const needsOccupationalMedicine = formData.program !== "pm";

  // Obavezni dokumenti se razlikuju po form_type:
  // - prijava_d (dvostupanjska prijava na diplomski): računaju se preko previous_study_institution
  //   (ApplicationFormD koristi getDiplomskiRequiredDocuments)
  // - upis_pd (izravni upis): dokumenti iz applicationConfigs + uvjetno školarina i medicina rada
  const dynamicRequiredDocuments = intakeFormType === "prijava_d"
    ? getDiplomskiRequiredDocuments(application.previous_study_institution)
    : [
        ...config.requiredDocuments,
        ...(needsTuitionPayment ? ["tuition_payment_confirmation"] : []),
        ...(needsOccupationalMedicine ? ["occupational_medicine_certificate"] : []),
      ];

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

    const filesToUpload = [
      ...(newPhoto ? [{ documentType: "photo", file: newPhoto }] : []),
      ...(combinedMode && combinedFile
        ? [{ documentType: "combined_documents", file: combinedFile }]
        : Object.entries(uploadedFiles).map(([documentType, file]) => ({ documentType, file }))),
    ];

    if (filesToUpload.length > 0) {
      await uploadDocuments(application.id, filesToUpload);
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

        {/* Identifikacija */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5, mt: 0.5 }}>
          Identifikacija
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {showEnrollmentPersonalFields && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="JMBAG" value={formData.jmbag} onChange={(e) => handleChange("jmbag", e.target.value)} fullWidth size="small" />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: showEnrollmentPersonalFields ? 4 : 6 }}>
            <TextField label="Ime" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: showEnrollmentPersonalFields ? 4 : 6 }}>
            <TextField label="Prezime" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} fullWidth size="small" />
          </Grid>
        </Grid>

        {/* Osobni podaci */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Osobni podaci
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
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
          {showEnrollmentPersonalFields && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Mjesto rođenja" value={formData.birth_place} onChange={(e) => handleChange("birth_place", e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spol</InputLabel>
                  <Select value={formData.gender} label="Spol" onChange={(e) => handleChange("gender", e.target.value)}>
                    {genderOptions.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bračno stanje</InputLabel>
                  <Select value={formData.marital_status} label="Bračno stanje" onChange={(e) => handleChange("marital_status", e.target.value)}>
                    {maritalOptions.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          {showEnrollmentPersonalFields && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Državljanstvo" value={formData.citizenship} onChange={(e) => handleChange("citizenship", e.target.value)} fullWidth size="small" />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: showEnrollmentPersonalFields ? 5 : 9 }}>
            <TextField label="Adresa" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Poštanski broj" value={formData.postal_code} onChange={(e) => handleChange("postal_code", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Grad" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} fullWidth size="small" />
          </Grid>
        </Grid>

        {/* Roditelji */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Podaci o roditeljima
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--gray-600)" }}>
              Otac
            </Typography>
          </Grid>
          {/* Ime oca se prikuplja i kod prijava_d, ostalo (zanimanje/adresa oca, svi podaci o majci)
              tek kod upisa (enrollments), pa se ne prikazuju za taj form_type. */}
          <Grid size={{ xs: 12, sm: showEnrollmentPersonalFields ? 4 : 12 }}>
            <TextField label="Ime oca" value={formData.father_name} onChange={(e) => handleChange("father_name", e.target.value)} fullWidth size="small" />
          </Grid>
          {showEnrollmentPersonalFields && (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Zanimanje oca" value={formData.father_occupation} onChange={(e) => handleChange("father_occupation", e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Adresa oca" value={formData.father_address} onChange={(e) => handleChange("father_address", e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--gray-600)" }}>
                  Majka
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Ime majke" value={formData.mother_name} onChange={(e) => handleChange("mother_name", e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Zanimanje majke" value={formData.mother_occupation} onChange={(e) => handleChange("mother_occupation", e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Adresa majke" value={formData.mother_address} onChange={(e) => handleChange("mother_address", e.target.value)} fullWidth size="small" />
              </Grid>
            </>
          )}
        </Grid>

        {/* Studij */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Podaci o studiju
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Studij</InputLabel>
              <Select value={formData.program} label="Studij" onChange={(e) => handleChange("program", e.target.value)}>
                {allPrograms.map((prog) => (
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
          {showEnrollmentPersonalFields && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Plasman na rang listi" value={formData.ranking_score} onChange={(e) => handleChange("ranking_score", e.target.value)} fullWidth size="small" />
            </Grid>
          )}

          {showEnrollmentPersonalFields && formData.study_type === "redoviti" && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--gray-600)", display: "block", mb: 0.5 }}>
                Izjava o upisu
              </Typography>
              <RadioGroup value={formData.enrollment_type ?? ""} onChange={(e) => handleChange("enrollment_type", Number(e.target.value))}>
                {enrollmentTypeOptions.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                        {opt.label}
                      </Typography>
                    }
                    sx={{ alignItems: "flex-start", mb: 0.25, "& .MuiRadio-root": { mt: -0.5, py: 0.25 } }}
                  />
                ))}
              </RadioGroup>
            </Grid>
          )}
        </Grid>

        {/* Obrazovanje */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Prethodno obrazovanje
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {showEnrollmentPersonalFields && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Završena srednja škola"
                  value={formData.previous_institution}
                  onChange={(e) => handleChange("previous_institution", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField label="Program / smjer" value={formData.previous_program} onChange={(e) => handleChange("previous_program", e.target.value)} fullWidth size="small" />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, sm: showEnrollmentPersonalFields ? 4 : 12 }}>
            <TextField
              label="Godina završetka"
              value={formData.previous_completion_year}
              onChange={(e) => handleChange("previous_completion_year", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          {showEnrollmentPersonalFields && (
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Drugi fakultet / viša škola"
                value={formData.other_education}
                onChange={(e) => handleChange("other_education", e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          )}
        </Grid>

        {/* Fotografija */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Fotografija pristupnika
        </Typography>
        {existingPhoto && !newPhoto && (
          <Alert severity="info" sx={{ mb: 1 }}>
            Fotografija je već učitana ({existingPhoto.file_name}). Učitajte novu samo ako želite zamijeniti.
          </Alert>
        )}
        <PhotoUpload onPhotoChange={setNewPhoto} />

        {/* Dokumenti */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 1.5 }}>
          Dokumenti
        </Typography>
        <Stack spacing={2}>
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
            <Box>
              {(() => {
                const existingCombined = existingDocs.find((d) => d.document_type === "combined_documents");
                return (
                  existingCombined &&
                  !combinedFile && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Datoteka sa svim dokumentima je već učitana ({existingCombined.file_name}). Učitajte novu samo ako želite zamijeniti.
                    </Alert>
                  )
                );
              })()}
              <DocumentUpload documentType="combined_documents" label="Svi dokumenti (jedna datoteka)" required={false} onFileChange={setCombinedFile} />
            </Box>
          ) : (
            [
              ...new Set([
                ...existingDocs.filter((d) => d.document_type !== "photo" && d.document_type !== "combined_documents").map((d) => d.document_type),
                ...dynamicRequiredDocuments,
              ]),
            ].map((docType) => {
              const existingDoc = existingDocs.find((d) => d.document_type === docType);
              const label = documentTypeLabels[docType] || docType;
              return (
                <Box key={docType}>
                  {existingDoc && !uploadedFiles[docType] && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      {label} je već učitan ({existingDoc.file_name}). Učitajte novi samo ako želite zamijeniti.
                    </Alert>
                  )}
                  <DocumentUpload documentType={docType} label={label} required={false} onFileChange={(file) => setUploadedFiles((prev) => ({ ...prev, [docType]: file }))} />
                </Box>
              );
            })
          )}
        </Stack>
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
