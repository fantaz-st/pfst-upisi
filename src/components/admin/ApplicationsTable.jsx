"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { applicationStatuses, getProgramShortCode, studyPrograms } from "@/lib/applications/config";
import { permanentDeleteApplications, restoreApplications } from "@/lib/admin/actions";
import styles from "@/app/admin/admin.module.css";

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
}

const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski].filter((p, i, self) => i === self.findIndex((x) => x.value === p.value));

export default function ApplicationsTable({
  applications = [],
  mode = "active", // "active" | "trash"
  showAccess = false, // za sve-prijave — greyed out redovi
  isSuperAdmin = false,
  linkPrefix = "/admin/prijave",
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── Filter & Search ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return applications.filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      if (programFilter && app.program !== programFilter) return false;
      if (q) {
        const haystack = [app.first_name, app.last_name, app.oib, app.email, app.application_number].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [applications, search, statusFilter, programFilter]);

  // ─── Bulk selection ────────────────────────────────────
  const selectableIds = filtered.map((a) => a.id);
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length;
  const someSelected = selected.length > 0;

  const handleSelectAll = () => setSelected(allSelected ? [] : selectableIds);
  const handleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  // ─── Trash actions ─────────────────────────────────────
  const handleRestore = async (ids = selected) => {
    setLoading("restore");
    setError(null);
    const result = await restoreApplications(ids);
    if (result.error) setError(result.error);
    else {
      setSelected([]);
      router.refresh();
    }
    setLoading(null);
  };

  const handlePermanentDelete = async () => {
    setLoading("delete");
    setError(null);
    const result = await permanentDeleteApplications(selected);
    if (result.error) setError(result.error);
    else {
      setSelected([]);
      setConfirmOpen(false);
      router.refresh();
    }
    setLoading(null);
  };

  const isTrash = mode === "trash";

  return (
    <>
      {/* ─── Toolbar ──────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        {/* Pretraga */}
        <TextField
          size="small"
          placeholder="Pretraži po imenu, OIB-u, broju prijave, emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, background: "white", borderRadius: 2 }}
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

        {/* Filter po studiju */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Studij</InputLabel>
          <Select value={programFilter} label="Studij" onChange={(e) => setProgramFilter(e.target.value)} sx={{ borderRadius: 2, background: "white" }}>
            <MenuItem value="">Svi studiji</MenuItem>
            {allPrograms.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filter po statusu (samo active mode) */}
        {!isTrash && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2, background: "white" }}>
              <MenuItem value="">Svi statusi</MenuItem>
              {Object.entries(applicationStatuses).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Rezultat */}
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {filtered.length} / {applications.length}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ─── Bulk action bar ──────────────────────────── */}
      {isTrash && someSelected && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            px: 2.5,
            py: 1.5,
            background: "var(--blue-pale)",
            border: "1px solid var(--blue-main)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--blue-dark)", flex: 1 }}>
            {selected.length} {selected.length === 1 ? "prijava odabrana" : "prijava odabrano"}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading === "restore" ? <CircularProgress size={14} /> : <RestoreIcon />}
            onClick={() => handleRestore()}
            disabled={loading !== null}
            sx={{ borderRadius: "100px" }}
          >
            Vrati sve odabrane
          </Button>
          {isSuperAdmin && (
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setConfirmOpen(true)}
              disabled={loading !== null}
              sx={{ borderRadius: "100px" }}
            >
              Trajno obriši odabrane
            </Button>
          )}
        </Box>
      )}

      {/* ─── Tablica ──────────────────────────────────── */}
      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {isTrash && (
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={allSelected} indeterminate={someSelected && !allSelected} onChange={handleSelectAll} />
                  </TableCell>
                )}
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>Broj prijave</TableCell>
                <TableCell>Ime i prezime</TableCell>
                <TableCell>OIB</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Studij</TableCell>
                <TableCell>Vrsta upisa</TableCell>
                <TableCell>Ak. godina</TableCell>
                {!isTrash && <TableCell>Status</TableCell>}
                <TableCell>{isTrash ? "Obrisano" : "Datum"}</TableCell>
                <TableCell align="right">Akcija</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={isTrash ? 11 : 11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    {search || statusFilter || programFilter ? "Nema rezultata za odabrane filtere." : "Nema prijava."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((app, index) => {
                  const canAccess = !showAccess || app.canAccess !== false;
                  const isSelected = selected.includes(app.id);
                  const dateVal = isTrash ? app.deleted_at : app.created_at;

                  return (
                    <TableRow key={app.id} hover={canAccess} selected={isSelected} sx={{ "&:last-child td": { border: 0 }, opacity: canAccess ? 1 : 0.35 }}>
                      {isTrash && (
                        <TableCell padding="checkbox">
                          <Checkbox size="small" checked={isSelected} onChange={() => handleSelect(app.id)} />
                        </TableCell>
                      )}
                      <TableCell sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.8rem" }}>{index + 1}</TableCell>
                      <TableCell>
                        <span className={styles.appNumber}>{app.application_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className={styles.nameCell}>
                          {app.first_name} {app.last_name}
                        </span>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{app.oib}</TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>{app.email}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getProgramShortCode(app.program)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: "0.7rem", background: "var(--blue-pale)", color: "var(--blue-dark)" }}
                        />
                      </TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>{app.intakes?.title ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className={styles.secondaryText}>{app.intakes?.academic_year ?? "—"}</span>
                      </TableCell>
                      {!isTrash && (
                        <TableCell>
                          <StatusChip status={app.status} />
                        </TableCell>
                      )}
                      <TableCell>
                        <span className={styles.secondaryText}>{dateVal ? new Date(dateVal).toLocaleDateString("hr-HR") : "—"}</span>
                      </TableCell>
                      <TableCell align="right">
                        {isTrash ? (
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RestoreIcon />}
                              onClick={() => handleRestore([app.id])}
                              disabled={loading !== null}
                              sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                            >
                              Vrati
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteForeverIcon />}
                                onClick={() => {
                                  setSelected([app.id]);
                                  setConfirmOpen(true);
                                }}
                                disabled={loading !== null}
                                sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                              >
                                Obriši
                              </Button>
                            )}
                          </Box>
                        ) : canAccess ? (
                          <Button href={`${linkPrefix}/${app.id}`} size="small" variant="outlined" sx={{ borderRadius: "100px", fontSize: "0.75rem" }}>
                            Pregled
                          </Button>
                        ) : (
                          <Chip label="Nema pristup" size="small" disabled sx={{ fontSize: "0.7rem" }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* ─── Confirm permanent delete ─────────────────── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Trajno brisanje</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Ova akcija je nepovratna! Podaci će biti trajno izgubljeni.
          </Alert>
          <Typography variant="body1">
            Jeste li sigurni da želite trajno obrisati <strong>{selected.length}</strong> {selected.length === 1 ? "prijavu" : "prijava"}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading !== null}>
            Odustani
          </Button>
          <Button
            onClick={handlePermanentDelete}
            variant="contained"
            color="error"
            disabled={loading !== null}
            startIcon={loading === "delete" ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
          >
            Trajno obriši
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
