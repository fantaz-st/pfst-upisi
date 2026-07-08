"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ElectiveCoursesEditor from "@/components/admin/ElectiveCoursesEditor";
import { createIntake, updateIntake, getElectiveCourses, getElectiveRequirements } from "@/lib/intakes/actions";
import { defaultElectiveCourses, defaultElectiveRequirements } from "@/config/electiveCoursesDefault";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

function getNextAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  // Ako je trenutno nakon kolovoza, nova a.g. počinje ove godine
  const startYear = now.getMonth() >= 7 ? year : year - 1;
  return `${startYear + 1}./${startYear + 2}.`;
}

function generateSlug(title, year) {
  const titleSlug = title
    .toLowerCase()
    .replace(/š/g, "s")
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const yearSlug = year.replace(/[^0-9]/g, "-").replace(/^-|-$/g, "");
  return `${titleSlug}-${yearSlug}`;
}

export default function IntakeFormModal({ open, onClose, intake = null }) {
  const router = useRouter();
  const isEdit = !!intake;

  const [form, setForm] = useState({
    title: "",
    academic_year: "",
    slug: "",
    study_level: "prijediplomski",
    form_type: "upis_pd",
    short_description: "",
    sort_order: 0,
    diplomski_period_from: "",
    diplomski_period_to: "",
  });
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState(null);
  const [slugManual, setSlugManual] = useState(false);

  // Izborni predmeti
  const [courses, setCourses] = useState([]);
  const [requirements, setRequirements] = useState([]);
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSlugManual(false);

    if (isEdit) {
      setForm({
        title: intake.title || "",
        academic_year: intake.academic_year || "",
        slug: intake.slug || "",
        study_level: intake.study_level || "prijediplomski",
        form_type: intake.form_type || (intake.study_level === "diplomski" ? "prijava_d" : "upis_pd"),
        short_description: intake.short_description || "",
        sort_order: intake.sort_order || 0,
        diplomski_period_from: intake.diplomski_period_from || "",
        diplomski_period_to: intake.diplomski_period_to || "",
      });

      if (intake.form_type === "upis_d") {
        Promise.all([getElectiveCourses(intake.id), getElectiveRequirements(intake.id)]).then(([c, r]) => {
          setCourses(c);
          setRequirements(r);
        });
      }
    } else {
      setForm({
        title: "",
        academic_year: getNextAcademicYear(),
        slug: "",
        study_level: "prijediplomski",
        form_type: "upis_pd",
        short_description: "",
        sort_order: 0,
        diplomski_period_from: "",
        diplomski_period_to: "",
      });
      setSelectedAdmins([]);
      setCourses([]);
      setRequirements([]);
    }

    async function loadAdmins() {
      setLoadingAdmins(true);
      const supabase = createClient();
      const { data: adminRoles } = await supabase.from("admin_roles").select("user_id, email, role").eq("role", "admin").order("email");
      const adminsWithPrograms = await Promise.all(
        (adminRoles || []).map(async (admin) => {
          const { data: perms } = await supabase.from("admin_program_permissions").select("program, study_level").eq("user_id", admin.user_id);
          return { ...admin, programs: perms?.map((p) => `${p.program.toUpperCase()} (${p.study_level === "diplomski" ? "D" : "PD"})`) || [] };
        }),
      );
      setAdmins(adminsWithPrograms);
      if (isEdit) {
        const { data: intakeAdmins } = await supabase.from("intake_admins").select("user_id").eq("intake_id", intake.id);
        setSelectedAdmins(intakeAdmins?.map((a) => a.user_id) || []);
      }
      setLoadingAdmins(false);
    }
    loadAdmins();
  }, [open, intake]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (!slugManual && (field === "title" || field === "academic_year")) {
        next.slug = generateSlug(field === "title" ? value : prev.title, field === "academic_year" ? value : prev.academic_year);
      }
      // Auto-set form_type when study_level changes
      if (field === "study_level") {
        if (value === "prijediplomski") next.form_type = "upis_pd";
        else if (prev.form_type === "upis_pd") next.form_type = "prijava_d";
      }
      return next;
    });
  };

  // ── Izborni predmeti helpers ──────────────────────────
  const handleXlsImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const imported = [];
        const importedReqs = [];

        rows.forEach((row, idx) => {
          // Prihvati stupce: Program, Semestar, Naziv predmeta, Nositelj, Bodovi
          const program = (row["Program"] || row["program"] || "").toString().toLowerCase().trim();
          const semRaw = (row["Semestar"] || row["semestar"] || "1").toString().replace(/[^0-9]/g, "");
          const semester = parseInt(semRaw) || 1;
          const name = (row["Naziv predmeta"] || row["naziv_predmeta"] || row["Naziv"] || "").toString().trim();
          const instructor = (row["Nositelj"] || row["nositelj"] || row["Predavač"] || "").toString().trim();
          const credits = parseInt(row["Bodovi"] || row["bodovi"] || row["ECTS"] || 0);

          if (!name || !program) return; // Preskoči prazne i separator redove

          imported.push({ program, semester, name, instructor, credits, sort_order: idx });
        });

        // Pokušaj učitati min bodove iz drugog sheeta ako postoji
        if (wb.SheetNames.length > 1) {
          const ws2 = wb.Sheets[wb.SheetNames[1]];
          const rows2 = XLSX.utils.sheet_to_json(ws2, { defval: 0 });
          rows2.forEach((row) => {
            const progRaw = (row["Program"] || "").toString();
            // Izvuci kraticu programa npr. "Pomorska nautika (PN)" → "pn"
            const match = progRaw.match(/\(([a-zA-Z]+)\)/);
            const program = match ? match[1].toLowerCase() : progRaw.toLowerCase().trim();
            const s1 = parseInt(row["1. semestar (min)"] || row["semestar_1"] || 0);
            const s2 = parseInt(row["2. semestar (min)"] || row["semestar_2"] || 0);
            if (program) {
              importedReqs.push({ program, semester: 1, min_credits: s1 });
              importedReqs.push({ program, semester: 2, min_credits: s2 });
            }
          });
        }

        if (imported.length === 0) {
          alert("Nije pronađen nijedan predmet. Provjeri nazive stupaca: Program, Semestar, Naziv predmeta, Nositelj, Bodovi");
          return;
        }

        setCourses(imported);
        if (importedReqs.length > 0) setRequirements(importedReqs);
        alert(`Uvezeno ${imported.length} predmeta${importedReqs.length > 0 ? " i minimalni bodovi" : ""}.`);
      } catch (err) {
        alert("Greška pri čitanju datoteke: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      ...form,
      adminIds: selectedAdmins,
      elective_courses: form.form_type === "upis_d" ? courses : [],
      elective_requirements: form.form_type === "upis_d" ? requirements : [],
    };
    const result = isEdit ? await updateIntake({ id: intake.id, ...payload }) : await createIntake(payload);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  const isUpisD = form.form_type === "upis_d";
  const isDiplomski = form.study_level === "diplomski";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>{isEdit ? "Uredi upis" : "Novi upis"}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              label="Naziv *"
              value={form.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              fullWidth
              size="small"
              placeholder="npr. Prijediplomski studij"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              label="Akademska godina *"
              value={form.academic_year}
              onChange={(e) => handleFieldChange("academic_year", e.target.value)}
              fullWidth
              size="small"
              placeholder="npr. 2026./2027."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              label="Slug *"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              fullWidth
              size="small"
              helperText="Automatski generiran"
              slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: "0.85rem" } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Razina studija *</InputLabel>
              <Select value={form.study_level} label="Razina studija *" onChange={(e) => handleFieldChange("study_level", e.target.value)}>
                <MenuItem value="prijediplomski">Prijediplomski</MenuItem>
                <MenuItem value="diplomski">Diplomski</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tip forme */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tip obrasca *</InputLabel>
              <Select value={form.form_type} label="Tip obrasca *" onChange={(e) => handleFieldChange("form_type", e.target.value)}>
                {form.study_level === "prijediplomski" && <MenuItem value="upis_pd">Upis (prijediplomski)</MenuItem>}
                {form.study_level === "diplomski" && <MenuItem value="prijava_d">Prijava (diplomski)</MenuItem>}
                {form.study_level === "diplomski" && <MenuItem value="upis_d">Upis (diplomski)</MenuItem>}
              </Select>
            </FormControl>
          </Grid>

          {/* Diplomski period — samo za prijava_d */}
          {isDiplomski && form.form_type === "prijava_d" && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Datumi za opciju "na PFST od ... do ..." — daje ih referada.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Datum od"
                  value={form.diplomski_period_from}
                  onChange={(e) => handleFieldChange("diplomski_period_from", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="npr. 01.01.2026."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Datum do"
                  value={form.diplomski_period_to}
                  onChange={(e) => handleFieldChange("diplomski_period_to", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="npr. 22.09.2026."
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Kratki opis"
              value={form.short_description}
              onChange={(e) => handleFieldChange("short_description", e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Prikazuje se na landing stranici"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Redoslijed"
              type="number"
              value={form.sort_order}
              onChange={(e) => handleFieldChange("sort_order", parseInt(e.target.value) || 0)}
              fullWidth
              size="small"
              helperText="Manji broj = prikazuje se prvi"
            />
          </Grid>
        </Grid>

        {/* ── Izborni predmeti — samo za upis_d ────────────────── */}
        {isUpisD && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 0.5 }}>
              Izborni predmeti
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Definirajte predmete i minimalne bodove po programu i semestru. Kliknite na ćeliju za uređivanje.
            </Typography>
            <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              {courses.length === 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setCourses([...defaultElectiveCourses]);
                    setRequirements([...defaultElectiveRequirements]);
                  }}
                  sx={{ borderRadius: "100px", fontSize: "0.78rem" }}
                >
                  Učitaj predmete iz prošle godine
                </Button>
              )}
              <Button size="small" variant="outlined" component="label" sx={{ borderRadius: "100px", fontSize: "0.78rem" }}>
                Uvezi iz Excel (.xlsx/.xls)
                <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleXlsImport} />
              </Button>
              {courses.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  ili dodajte predmete ručno u tablici ispod
                </Typography>
              )}
              {courses.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  sx={{ fontSize: "0.78rem", ml: "auto" }}
                  onClick={() => {
                    if (confirm("Obrisati sve predmete?")) {
                      setCourses([]);
                      setRequirements([]);
                    }
                  }}
                >
                  Obriši sve
                </Button>
              )}
            </Box>
            <ElectiveCoursesEditor courses={courses} requirements={requirements} onChange={setCourses} onRequirementsChange={setRequirements} />
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Admini */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 0.5 }}>
          Dodjela administratora
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.82rem" }}>
          Odabrani administratori će vidjeti ovaj upis u "Moje prijave".
        </Typography>

        {loadingAdmins ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : admins.length === 0 ? (
          <Alert severity="info">Nema dostupnih administratora.</Alert>
        ) : (
          <FormGroup>
            {admins.map((admin) => (
              <FormControlLabel
                key={admin.user_id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedAdmins.includes(admin.user_id)}
                    onChange={() => setSelectedAdmins((prev) => (prev.includes(admin.user_id) ? prev.filter((id) => id !== admin.user_id) : [...prev, admin.user_id]))}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {admin.email}
                    </Typography>
                    {admin.programs.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        ({admin.programs.join(", ")})
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Odustani
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !form.title || !form.slug || !form.academic_year}
          sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
        >
          {loading ? <CircularProgress size={20} /> : isEdit ? "Spremi" : "Kreiraj"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
