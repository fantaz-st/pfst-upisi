"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { enrollmentTypeOptions } from "@/lib/applications/config";
import { submitEnrollment } from "@/lib/enrollments/actions";
import PhotoUpload from "@/components/application/PhotoUpload";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import styles from "./ApplicationForm.module.css";

const genderOptions = [
  { value: "muški", label: "Muški" },
  { value: "ženski", label: "Ženski" },
  { value: "ostalo", label: "Ostalo" },
];

const maritalOptions = ["Neoženjen / Neudana", "Oženjen / Udana", "Razveden/a", "Udovac / Udovica"];

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid var(--gray-100)" }}>
      <Box sx={{ color: "var(--blue-main)", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>{title}</Typography>
    </Box>
  );
}

export default function EnrollmentFormD({ token, enrollment, application, intake, courses, requirements }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState(null);

  const [formData, setFormData] = useState({
    gender: "",
    birth_place: "",
    marital_status: "",
    enrollment_type: null,
    zavrseni_studij: "",
    father_name: enrollment?.father_name || "",
    father_occupation: enrollment?.father_occupation || "",
    father_address: enrollment?.father_address || "",
    mother_name: enrollment?.mother_name || "",
    mother_occupation: enrollment?.mother_occupation || "",
    mother_address: enrollment?.mother_address || "",
  });

  const [selectedS1, setSelectedS1] = useState([]);
  const [selectedS2, setSelectedS2] = useState([]);

  const program = application?.program;
  const isRedoviti = application?.study_type === "redoviti";

  const coursesS1 = useMemo(() => courses.filter(c => c.program === program && c.semester === 1), [courses, program]);
  const coursesS2 = useMemo(() => courses.filter(c => c.program === program && c.semester === 2), [courses, program]);

  const reqS1 = requirements.find(r => r.program === program && r.semester === 1)?.min_credits || 0;
  const reqS2 = requirements.find(r => r.program === program && r.semester === 2)?.min_credits || 0;

  const totalS1 = selectedS1.reduce((s, c) => s + c.credits, 0);
  const totalS2 = selectedS2.reduce((s, c) => s + c.credits, 0);

  const toggleCourse = (course, semester) => {
    const setter = semester === 1 ? setSelectedS1 : setSelectedS2;
    setter(prev => {
      const exists = prev.find(c => c.id === course.id);
      return exists ? prev.filter(c => c.id !== course.id) : [...prev, { id: course.id, name: course.name, credits: course.credits }];
    });
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!photo) { setError("Molimo dodajte fotografiju."); return; }
    if (!formData.gender) { setError("Odaberite spol."); return; }
    if (!formData.birth_place) { setError("Unesite mjesto rođenja."); return; }
    if (!formData.marital_status) { setError("Unesite bračno stanje."); return; }
    if (isRedoviti && !formData.enrollment_type) { setError("Odaberite izjavu o upisu."); return; }
    if (reqS1 > 0 && totalS1 < reqS1) { setError(`Nedovoljno bodova za 1. semestar. Potrebno ${reqS1}, odabrano ${totalS1}.`); return; }
    if (reqS2 > 0 && totalS2 < reqS2) { setError(`Nedovoljno bodova za 2. semestar. Potrebno ${reqS2}, odabrano ${totalS2}.`); return; }
    if (!consent) { setError("Morate prihvatiti privolu."); return; }

    setLoading(true);
    setError(null);

    const result = await submitEnrollment(token, {
      ...formData,
      selected_courses_s1: selectedS1,
      selected_courses_s2: selectedS2,
      consent: true,
    }, photo);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/prijava/uspjesno?tip=upis");
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Fotografija */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<CameraAltIcon sx={{ fontSize: 18 }} />} title="Fotografija" />
        <PhotoUpload onPhotoChange={setPhoto} />
      </Paper>

      {/* Info box */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Upisujete se kao <strong>{application?.first_name} {application?.last_name}</strong> (OIB: {application?.oib}) na studij <strong>{program?.toUpperCase()}</strong> — {application?.study_type}.
      </Alert>

      {/* Osobni podaci */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<PersonIcon sx={{ fontSize: 18 }} />} title="Osobni podaci" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Završen prijediplomski studij temeljem kojeg se upisuje *"
              value={formData.zavrseni_studij}
              onChange={e => handleChange("zavrseni_studij", e.target.value)}
              fullWidth size="small"
              placeholder="npr. Prijediplomski studij brodostrojarstva, PFST Split"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Spol *</InputLabel>
              <Select value={formData.gender} label="Spol *" onChange={e => handleChange("gender", e.target.value)}>
                {genderOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Mjesto rođenja *" value={formData.birth_place} onChange={e => handleChange("birth_place", e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Bračno stanje *</InputLabel>
              <Select value={formData.marital_status} label="Bračno stanje *" onChange={e => handleChange("marital_status", e.target.value)}>
                {maritalOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Roditelji */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <SectionHeader icon={<FamilyRestroomIcon sx={{ fontSize: 18 }} />} title="Podaci o roditeljima" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--gray-600)" }}>Otac</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Ime oca" value={formData.father_name} onChange={e => handleChange("father_name", e.target.value)} fullWidth size="small" /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Zanimanje oca" value={formData.father_occupation} onChange={e => handleChange("father_occupation", e.target.value)} fullWidth size="small" /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Adresa oca" value={formData.father_address} onChange={e => handleChange("father_address", e.target.value)} fullWidth size="small" /></Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--gray-600)" }}>Majka</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Ime majke" value={formData.mother_name} onChange={e => handleChange("mother_name", e.target.value)} fullWidth size="small" /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Zanimanje majke" value={formData.mother_occupation} onChange={e => handleChange("mother_occupation", e.target.value)} fullWidth size="small" /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Adresa majke" value={formData.mother_address} onChange={e => handleChange("mother_address", e.target.value)} fullWidth size="small" /></Grid>
        </Grid>
      </Paper>

      {/* Izborni predmeti */}
      {(coursesS1.length > 0 || coursesS2.length > 0) && (
        <Paper variant="outlined" className={styles.sectionPaper}>
          <SectionHeader icon={<MenuBookIcon sx={{ fontSize: 18 }} />} title="Izborni predmeti" />

          {coursesS1.length > 0 && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)" }}>1. semestar</Typography>
                <Chip
                  label={`${totalS1} / min. ${reqS1} bodova`}
                  size="small"
                  color={totalS1 >= reqS1 ? "success" : "default"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              {coursesS1.map(course => (
                <FormControlLabel
                  key={course.id}
                  control={<Checkbox size="small" checked={!!selectedS1.find(c => c.id === course.id)} onChange={() => toggleCourse(course, 1)} />}
                  label={
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Typography variant="body2">{course.name}</Typography>
                      {course.instructor && <Typography variant="caption" color="text.secondary">— {course.instructor}</Typography>}
                      <Chip label={`${course.credits} ECTS`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                    </Box>
                  }
                  sx={{ display: "flex", mb: 0.5 }}
                />
              ))}
            </>
          )}

          {coursesS1.length > 0 && coursesS2.length > 0 && <Divider sx={{ my: 2 }} />}

          {coursesS2.length > 0 && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--gray-700)" }}>2. semestar</Typography>
                <Chip
                  label={`${totalS2} / min. ${reqS2} bodova`}
                  size="small"
                  color={totalS2 >= reqS2 ? "success" : "default"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              {coursesS2.map(course => (
                <FormControlLabel
                  key={course.id}
                  control={<Checkbox size="small" checked={!!selectedS2.find(c => c.id === course.id)} onChange={() => toggleCourse(course, 2)} />}
                  label={
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Typography variant="body2">{course.name}</Typography>
                      {course.instructor && <Typography variant="caption" color="text.secondary">— {course.instructor}</Typography>}
                      <Chip label={`${course.credits} ECTS`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                    </Box>
                  }
                  sx={{ display: "flex", mb: 0.5 }}
                />
              ))}
            </>
          )}
        </Paper>
      )}

      {/* Izjava o upisu — samo redoviti */}
      {isRedoviti && (
        <Paper variant="outlined" className={styles.sectionPaper}>
          <SectionHeader icon={<SchoolIcon sx={{ fontSize: 18 }} />} title="Izjava o upisu" />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Izvanredni studenti mogu preskočiti ovaj korak.
          </Typography>
          <RadioGroup value={formData.enrollment_type ?? ""} onChange={e => handleChange("enrollment_type", Number(e.target.value))}>
            {enrollmentTypeOptions.map(opt => (
              <FormControlLabel
                key={opt.value} value={opt.value}
                control={<Radio size="small" />}
                label={<Typography variant="body2" sx={{ lineHeight: 1.5 }}>{opt.label}</Typography>}
                sx={{ alignItems: "flex-start", mb: 0.5, "& .MuiRadio-root": { mt: -0.5 } }}
              />
            ))}
          </RadioGroup>
        </Paper>
      )}

      {/* Privola */}
      <Paper variant="outlined" className={styles.sectionPaper}>
        <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1.5 }}>
          Na temelju točke 32. Opće uredbe o zaštiti podataka, EC 2016/679 i odredbi Zakona o provedbi Opće uredbe o zaštiti osobnih podataka ("Narodne novine" broj 42/18), svojim potpisom dajem <strong>PRIVOLU</strong> Pomorskom fakultetu u Splitu da u svrhu ostvarivanja mojih prava iz studentskog standarda i službene komunikacije tijekom studiranja koristi moje osobne podatke.
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={consent} onChange={e => setConsent(e.target.checked)} />}
          label={<Typography variant="body2">Prihvaćam privolu Pomorskog fakulteta Sveučilišta u Splitu *</Typography>}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box className={styles.submitContainer}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? <><CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />Slanje...</> : "Pošalji upis"}
        </Button>
      </Box>
    </Box>
  );
}
