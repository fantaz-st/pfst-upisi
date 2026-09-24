"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import ListItemText from "@mui/material/ListItemText";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import { getProgramShortCode, enrollmentStatuses, studyPrograms, studyTypes, getStudyTypeLabel } from "@/lib/applications/config";
import { bulkConfirmEnrollments, deleteEnrollment, restoreEnrollment } from "@/lib/enrollments/actions";
import styles from "@/app/admin/admin.module.css";

// Enrollments postoje isključivo za upis_d (diplomski) — nema ptjm tu, za
// razliku od ApplicationsTable-ovog kombiniranog popisa svih studija.
const diplomskiPrograms = studyPrograms.diplomski;

export default function EnrollmentsTable({ enrollments = [], showIntake = false, mode = "active", filterable = false }) {
  const router = useRouter();
  const isTrash = mode === "trash";
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // enrollment id za brisanje
  const [restoring, setRestoring] = useState(null); // enrollment id koji se trenutno vraća

  // Filteri — samo kad je filterable (upis_d intake stranica). Klijentski,
  // preko već učitanih redaka, isti obrazac kao ApplicationsTable.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState([]);
  const [studyTypeFilter, setStudyTypeFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filterable) return enrollments;
    const q = search.toLowerCase().trim();
    return enrollments.filter((e) => {
      const app = e.applications;
      if (statusFilter && e.status !== statusFilter) return false;
      if (programFilter.length > 0 && !programFilter.includes(app?.program)) return false;
      if (studyTypeFilter && app?.study_type !== studyTypeFilter) return false;
      if (q) {
        const haystack = [app?.first_name, app?.last_name, app?.oib].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [enrollments, filterable, search, statusFilter, programFilter, studyTypeFilter]);

  // Broj vidljivih stupaca — za "Nema rezultata" red kad filter ne pogodi ništa.
  const columnCount = (isTrash ? 0 : 1) + 5 + (showIntake ? 1 : 0) + (isTrash ? 1 : 2) + 1;

  // Referada odlučuje iz kojeg statusa potvrđuje — bez ograničenja na "submitted",
  // isto kao pojedinačna kontrola statusa (EnrollmentStatusControl).
  const selectableIds = useMemo(() => filtered.map((e) => e.id), [filtered]);
  const confirmableSelected = selected;
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length;
  const someSelected = selected.length > 0;

  const toggleAll = () => setSelected(allSelected ? [] : selectableIds);
  const toggle = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleConfirm = async () => {
    if (confirmableSelected.length === 0) return;
    setLoading(true);
    const result = await bulkConfirmEnrollments(confirmableSelected);
    setLoading(false);
    if (!result.error) {
      setSelected([]);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const ids = deleteTarget === "__bulk__" ? selected : [deleteTarget];
    for (const id of ids) {
      await deleteEnrollment(id);
    }
    setLoading(false);
    setDeleteTarget(null);
    setSelected([]);
    router.refresh();
  };

  const handleRestore = async (id) => {
    setRestoring(id);
    await restoreEnrollment(id);
    setRestoring(null);
    router.refresh();
  };

  if (!enrollments.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center", color: "text.secondary", fontSize: "0.9rem" }}>
        {isTrash
          ? "Nema obrisanih upisa."
          : "Još nema upisa. Pojavljuju se kad prihvaćeni kandidati (nakon razredbenog) ispune obrazac putem magic linka."}
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter bar — isti izgled kao ApplicationsTable */}
      {filterable && (
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Pretraži po imenu ili OIB-u..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 260 }, background: "white", borderRadius: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "var(--gray-400)" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: "48%", sm: 220 }, maxWidth: { sm: 320 }, flex: { xs: 1, sm: "unset" } }}>
            <InputLabel shrink>Studij</InputLabel>
            <Select
              multiple
              value={programFilter}
              onChange={(e) => setProgramFilter(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
              input={<OutlinedInput notched label="Studij" />}
              displayEmpty
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <span style={{ color: "var(--gray-400)" }}>Svi studiji</span>;
                }
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((v) => {
                      const p = diplomskiPrograms.find((x) => x.value === v);
                      return (
                        <Chip key={v} label={p ? p.label : v} size="small" sx={{ height: 22, fontSize: "0.72rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }} />
                      );
                    })}
                  </Box>
                );
              }}
              sx={{ borderRadius: 2, background: "white" }}
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
            >
              {diplomskiPrograms.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  <Checkbox size="small" checked={programFilter.includes(p.value)} />
                  <ListItemText primary={p.label} />
                </MenuItem>
              ))}
              {programFilter.length > 0 && (
                <MenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setProgramFilter([]);
                  }}
                  sx={{ color: "error.main", borderTop: "1px solid var(--gray-100)", mt: 0.5 }}
                >
                  Očisti odabir
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "48%", sm: 160 }, flex: { xs: 1, sm: "unset" } }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2, background: "white" }}>
              <MenuItem value="">Svi statusi</MenuItem>
              {Object.entries(enrollmentStatuses).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "48%", sm: 160 }, flex: { xs: 1, sm: "unset" } }}>
            <InputLabel>Vrsta studiranja</InputLabel>
            <Select value={studyTypeFilter} label="Vrsta studiranja" onChange={(e) => setStudyTypeFilter(e.target.value)} sx={{ borderRadius: 2, background: "white" }}>
              <MenuItem value="">Sve</MenuItem>
              {studyTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />

          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {filtered.length} / {enrollments.length}
          </Typography>
        </Box>
      )}

      {/* Bulk action bar */}
      {!isTrash && someSelected && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, p: 1.5, background: "var(--blue-pale)", borderRadius: 2, border: "1px solid rgba(5,140,196,0.2)" }}>
          <Box sx={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--blue-dark)" }}>{selected.length} odabrano</Box>
          {confirmableSelected.length > 0 && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={loading ? <CircularProgress size={14} /> : <CheckCircleIcon />}
              onClick={handleConfirm}
              disabled={loading}
              sx={{ borderRadius: "100px" }}
            >
              Potvrdi upis ({confirmableSelected.length})
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineOutlinedIcon />}
            onClick={() => setDeleteTarget("__bulk__")}
            disabled={loading}
            sx={{ borderRadius: "100px" }}
          >
            Obriši ({selected.length})
          </Button>
          <Button size="small" onClick={() => setSelected([])} sx={{ borderRadius: "100px", ml: "auto" }}>
            Poništi odabir
          </Button>
        </Box>
      )}

      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {!isTrash && (
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} disabled={selectableIds.length === 0} />
                  </TableCell>
                )}
                <TableCell>#</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Studij</TableCell>
                {showIntake && <TableCell>Upis</TableCell>}
                <TableCell>Status</TableCell>
                {isTrash ? (
                  <TableCell>Obrisano</TableCell>
                ) : (
                  <>
                    <TableCell>Istječe</TableCell>
                    <TableCell>Poslano</TableCell>
                  </>
                )}
                <TableCell align="right">Prijava</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterable && !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Nema rezultata za odabrane filtere.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e, i) => {
                const app = e.applications;
                const cfg = enrollmentStatuses[e.status] ?? { label: e.status, color: "default" };
                const isExpired = e.token_expires_at && new Date(e.token_expires_at) < new Date() && !e.token_used_at;
                const isSelected = selected.includes(e.id);

                return (
                  <TableRow key={e.id} hover selected={isSelected} sx={{ "&:last-child td": { border: 0 } }}>
                    {!isTrash && (
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={isSelected} onChange={() => toggle(e.id)} />
                      </TableCell>
                    )}
                    <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</TableCell>
                    <TableCell>
                      <span className={styles.nameCell}>
                        {app?.first_name} {app?.last_name}
                      </span>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app?.oib}</TableCell>
                    <TableCell>
                      <Chip
                        label={getProgramShortCode(app?.program)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }}
                      />
                      {app?.study_type && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {getStudyTypeLabel(app.study_type)}
                        </Typography>
                      )}
                    </TableCell>
                    {showIntake && (
                      <TableCell>
                        <span className={styles.secondaryText}>
                          {e.intakes?.title} · {e.intakes?.academic_year}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      {isExpired ? (
                        <Chip label="Isteklo" size="small" color="error" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      ) : (
                        <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      )}
                    </TableCell>
                    {isTrash ? (
                      <TableCell>
                        <span className={styles.secondaryText}>{e.deleted_at ? new Date(e.deleted_at).toLocaleDateString("hr-HR") : "—"}</span>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          <span className={styles.secondaryText}>{e.token_expires_at ? new Date(e.token_expires_at).toLocaleDateString("hr-HR") : "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className={styles.secondaryText}>{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString("hr-HR") : "—"}</span>
                        </TableCell>
                      </>
                    )}
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5 }}>
                        {isTrash ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={restoring === e.id ? <CircularProgress size={14} /> : <RestoreIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleRestore(e.id)}
                            disabled={restoring !== null}
                            sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                          >
                            Vrati
                          </Button>
                        ) : (
                          <Button
                            href={`/admin/upis/${e.id}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                          >
                            Pregled
                          </Button>
                        )}
                        {app?.id && (
                          <Link href={`/admin/prijave/${app.id}`} style={{ fontSize: "0.75rem", color: "var(--blue-main)", fontWeight: 600 }}>
                            Prijava →
                          </Link>
                        )}
                        {!isTrash && (
                          <Tooltip title="Obriši upis">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(e.id)} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Confirm delete modal */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Obrisati upis?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteTarget === "__bulk__"
              ? `${selected.length} upisa bit će premješteno u otpad — mogu se vratiti kasnije. Prijave kandidata ostaju netaknute.`
              : "Ovaj upis će biti premješten u otpad — može se vratiti kasnije. Prijava kandidata ostaje netaknuta."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={loading}>
            Odustani
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteOutlineOutlinedIcon />}
            sx={{ borderRadius: "100px" }}
          >
            Obriši
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
