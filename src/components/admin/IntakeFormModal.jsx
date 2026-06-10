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
import { createIntake, updateIntake } from "@/lib/intakes/actions";
import { createClient } from "@/lib/supabase/client";
import CandidateListManager from "./CandidateListManager";

function generateSlug(title, year) {
  const titleSlug = title
    .toLowerCase()
    .replace(/š/g, "s").replace(/č/g, "c").replace(/ć/g, "c")
    .replace(/ž/g, "z").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const yearSlug = year.replace(/[^0-9]/g, "-").replace(/^-|-$/g, "");
  return `${titleSlug}-${yearSlug}`;
}

export default function IntakeFormModal({ open, onClose, intake = null }) {
  const router = useRouter();
  const isEdit = !!intake;

  const [form, setForm] = useState({
    title: "", academic_year: "", slug: "",
    study_level: "prijediplomski", short_description: "", sort_order: 0,
  });
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState(null);
  const [slugManual, setSlugManual] = useState(false);
  const [savedIntakeId, setSavedIntakeId] = useState(null); // za CandidateListManager

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSlugManual(false);
    setSavedIntakeId(isEdit ? intake.id : null);

    if (isEdit) {
      setForm({
        title: intake.title || "", academic_year: intake.academic_year || "",
        slug: intake.slug || "", study_level: intake.study_level || "prijediplomski",
        short_description: intake.short_description || "", sort_order: intake.sort_order || 0,
      });
    } else {
      setForm({ title: "", academic_year: "", slug: "", study_level: "prijediplomski", short_description: "", sort_order: 0 });
      setSelectedAdmins([]);
    }

    async function loadData() {
      setLoadingAdmins(true);
      const supabase = createClient();

      const { data: adminRoles } = await supabase
        .from("admin_roles").select("user_id, email, role")
        .eq("role", "admin").order("email");

      const adminsWithPrograms = await Promise.all(
        (adminRoles || []).map(async (admin) => {
          const { data: perms } = await supabase
            .from("admin_program_permissions").select("program").eq("user_id", admin.user_id);
          return { ...admin, programs: perms?.map(p => p.program) || [] };
        })
      );

      setAdmins(adminsWithPrograms);

      if (isEdit) {
        const { data: intakeAdmins } = await supabase
          .from("intake_admins").select("user_id").eq("intake_id", intake.id);
        setSelectedAdmins(intakeAdmins?.map(a => a.user_id) || []);
      }

      setLoadingAdmins(false);
    }

    loadData();
  }, [open, intake]);

  const handleFieldChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (!slugManual && (field === "title" || field === "academic_year")) {
        next.slug = generateSlug(
          field === "title" ? value : prev.title,
          field === "academic_year" ? value : prev.academic_year
        );
      }
      return next;
    });
  };

  const handleSlugChange = (value) => {
    setSlugManual(true);
    setForm(prev => ({ ...prev, slug: value }));
  };

  const handleAdminToggle = (userId) => {
    setSelectedAdmins(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload = { ...form, adminIds: selectedAdmins };
    const result = isEdit
      ? await updateIntake({ id: intake.id, ...payload })
      : await createIntake(payload);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Za novi upis — otvori CandidateListManager
      if (!isEdit && result.intake?.id) {
        setSavedIntakeId(result.intake.id);
      } else {
        router.refresh();
        onClose();
      }
    }
  };

  const handleClose = () => {
    router.refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>
        {isEdit ? "Uredi upis" : savedIntakeId ? "Lista kandidata" : "Novi upis"}
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Ako je novi upis upravo spremnjen — prikaži samo CandidateListManager */}
        {savedIntakeId && !isEdit ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Upis je kreiran! Sada možete uploadati liste kandidata ili zatvoriti.
            </Alert>
            <CandidateListManager intakeId={savedIntakeId} />
          </>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField label="Naziv *" value={form.title}
                  onChange={e => handleFieldChange("title", e.target.value)}
                  fullWidth size="small" placeholder="npr. Prijediplomski studij" />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField label="Akademska godina *" value={form.academic_year}
                  onChange={e => handleFieldChange("academic_year", e.target.value)}
                  fullWidth size="small" placeholder="npr. 2026./2027." />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField label="Slug *" value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  fullWidth size="small"
                  helperText="Automatski generiran — promijenite samo ako je potrebno"
                  slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: "0.85rem" } } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Razina studija *</InputLabel>
                  <Select value={form.study_level} label="Razina studija *"
                    onChange={e => handleFieldChange("study_level", e.target.value)}>
                    <MenuItem value="prijediplomski">Prijediplomski</MenuItem>
                    <MenuItem value="diplomski">Diplomski</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Kratki opis" value={form.short_description}
                  onChange={e => handleFieldChange("short_description", e.target.value)}
                  fullWidth size="small" multiline rows={2}
                  placeholder="Prikazuje se na landing stranici ispod naslova" />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField label="Redoslijed" type="number" value={form.sort_order}
                  onChange={e => handleFieldChange("sort_order", parseInt(e.target.value) || 0)}
                  fullWidth size="small" helperText="Manji broj = prikazuje se prvi" />
              </Grid>
            </Grid>

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
              <Alert severity="info">Nema dostupnih administratora. Prvo kreirajte admine na stranici Korisnici.</Alert>
            ) : (
              <FormGroup>
                {admins.map(admin => (
                  <FormControlLabel
                    key={admin.user_id}
                    control={
                      <Checkbox size="small"
                        checked={selectedAdmins.includes(admin.user_id)}
                        onChange={() => handleAdminToggle(admin.user_id)} />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{admin.email}</Typography>
                        {admin.programs.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({admin.programs.map(p => p.toUpperCase()).join(", ")})
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            )}

            {/* Lista kandidata — samo za edit */}
            {isEdit && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--blue-dark)", mb: 0.5 }}>
                  Liste kandidata
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.82rem" }}>
                  Uploadajte liste kvalificiranih kandidata po studiju i vrsti studiranja.
                  Ako lista ne postoji za određenu kombinaciju, prijava je otvorena svima.
                </Typography>
                <CandidateListManager intakeId={intake.id} />
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>
          {savedIntakeId && !isEdit ? "Zatvori" : "Odustani"}
        </Button>
        {!(savedIntakeId && !isEdit) && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !form.title || !form.slug || !form.academic_year}
            sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
          >
            {loading ? <CircularProgress size={20} /> : isEdit ? "Spremi" : "Kreiraj upis"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
