"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { applicationStatuses, getProgramShortCode, studyPrograms, statusesWithMessage } from "@/lib/applications/config";
import { permanentDeleteApplications, restoreApplications } from "@/lib/admin/actions";
import { bulkUpdateApplicationStatus, softDeleteApplication, bulkSoftDeleteApplications } from "@/lib/applications/actions";
import { createEnrollmentToken, sendEnrollmentInvite } from "@/lib/enrollments/actions";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/admin/admin.module.css";

function StatusChip({ status }) {
  const config = applicationStatuses[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
}

const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski].filter((p, i, self) => i === self.findIndex((x) => x.value === p.value));

// Statusi dostupni za bulk promjenu — isključujemo "accepted" (treba JMBAG po prijavi)
const bulkStatusOptions = Object.entries(applicationStatuses).filter(([key]) => key !== "accepted");

export default function ApplicationsTable({
  applications = [],
  mode = "active", // "active" | "trash"
  showAccess = false, // za sve-prijave — greyed out redovi
  isSuperAdmin = false,
  linkPrefix = "/admin/prijave",
  intake = null, // cijeli intake objekt za kontekst
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Bulk enrollment link
  const [bulkEnrollmentLoading, setBulkEnrollmentLoading] = useState(false);
  const [bulkEnrollmentResult, setBulkEnrollmentResult] = useState(null);
  const [upisIntakes, setUpisIntakes] = useState([]);
  const [selectedUpisIntakeId, setSelectedUpisIntakeId] = useState("");
  const [bulkEnrollmentModal, setBulkEnrollmentModal] = useState(false);

  // Dohvati upis_d intakee jednom
  useState(() => {
    const supabase = createClient();
    supabase
      .from("intakes")
      .select("id, title, academic_year")
      .eq("form_type", "upis_d")
      .eq("is_visible", true)
      .then(({ data }) => {
        setUpisIntakes(data || []);
        if (data?.length === 1) setSelectedUpisIntakeId(data[0].id);
      });
  });

  // Bulk status promjena (active mode)
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  // Brisanje (active mode)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);

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
  // U active modu, biraju se samo prijave do kojih admin ima pristup
  const selectableApps = filtered.filter((a) => !showAccess || a.canAccess !== false);
  const selectableIds = selectableApps.map((a) => a.id);
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

  // ─── Bulk status change (active mode) ──────────────────
  const handleBulkStatusClick = () => {
    setBulkStatus("");
    setBulkMessage("");
    setBulkResult(null);
    setBulkStatusModal(true);
  };

  const handleBulkStatusApply = async () => {
    if (!bulkStatus) return;
    setLoading("bulkStatus");
    setError(null);
    setBulkResult(null);

    const message = statusesWithMessage.includes(bulkStatus) ? bulkMessage : null;
    const result = await bulkUpdateApplicationStatus(selected, bulkStatus, message);

    setBulkResult(result);
    setLoading(null);

    if (result.failed === 0) {
      setSelected([]);
      router.refresh();
    }
  };

  const handleCloseBulkModal = () => {
    setBulkStatusModal(false);
    setBulkStatus("");
    setBulkMessage("");
    setBulkResult(null);
    if (!error) router.refresh();
  };

  const handleBulkEnrollment = async () => {
    if (!selectedUpisIntakeId) return;
    setBulkEnrollmentLoading(true);
    setBulkEnrollmentResult(null);
    let success = 0,
      failed = 0;

    for (const id of selected) {
      const app = filtered.find((a) => a.id === id);
      if (!app) continue;
      const tokenResult = await createEnrollmentToken(id, selectedUpisIntakeId);
      if (tokenResult.error) {
        failed++;
        continue;
      }
      try {
        await sendEnrollmentInvite({
          token: tokenResult.token,
          email: app.email,
          firstName: app.first_name,
          lastName: app.last_name,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setBulkEnrollmentResult({ success, failed });
    setBulkEnrollmentLoading(false);
    if (failed === 0) {
      setSelected([]);
      router.refresh();
    }
  };

  const handleDeleteClick = (ids) => {
    setDeleteTargetIds(ids);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setLoading("softDelete");
    setError(null);

    const result = deleteTargetIds.length === 1 ? await softDeleteApplication(deleteTargetIds[0]) : await bulkSoftDeleteApplications(deleteTargetIds);

    if (result.error) {
      setError(result.error);
    } else {
      setSelected((prev) => prev.filter((id) => !deleteTargetIds.includes(id)));
      setDeleteConfirmOpen(false);
      setDeleteTargetIds([]);
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

      {/* ─── Bulk action bar — trash ───────────────────── */}
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

      {/* ─── Bulk action bar — active (promjena statusa) ── */}
      {!isTrash && someSelected && (
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
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--blue-dark)", flex: 1 }}>
            {selected.length} {selected.length === 1 ? "prijava odabrana" : "prijava odabrano"}
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleBulkStatusClick}
            disabled={loading !== null}
            sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
          >
            Promijeni status
          </Button>
          {intake?.form_type === "prijava_d" &&
            selected.every((id) => {
              const app = filtered.find((a) => a.id === id);
              return app?.status === "accepted";
            }) &&
            selected.length > 0 && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={bulkEnrollmentLoading ? <CircularProgress size={14} /> : <LinkIcon />}
                onClick={() => setBulkEnrollmentModal(true)}
                disabled={loading !== null || bulkEnrollmentLoading}
                sx={{ borderRadius: "100px" }}
              >
                Pošalji linkove za upis
              </Button>
            )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => handleDeleteClick(selected)}
            disabled={loading !== null}
            sx={{ borderRadius: "100px" }}
          >
            Premjesti u otpad
          </Button>
          <Button size="small" onClick={() => setSelected([])} disabled={loading !== null}>
            Poništi odabir
          </Button>
        </Box>
      )}

      {/* ─── Tablica ──────────────────────────────────── */}
      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {(isTrash || !isTrash) && (
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={allSelected} indeterminate={someSelected && !allSelected} onChange={handleSelectAll} disabled={selectableIds.length === 0} />
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
                  <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={isSelected} onChange={() => handleSelect(app.id)} disabled={!canAccess} />
                      </TableCell>
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
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button href={`${linkPrefix}/${app.id}?from=${encodeURIComponent(pathname)}`} size="small" variant="outlined" sx={{ borderRadius: "100px", fontSize: "0.75rem" }}>
                              Pregled
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteClick([app.id])}
                              disabled={loading !== null}
                              sx={{ borderRadius: "100px", fontSize: "0.75rem", minWidth: 0, px: 1 }}
                            >
                              <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                            </Button>
                          </Box>
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

      {/* ─── Bulk enrollment modal ──────────────────────── */}
      <Dialog
        open={bulkEnrollmentModal}
        onClose={() => {
          setBulkEnrollmentModal(false);
          setBulkEnrollmentResult(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Pošalji linkove za upis — {selected.length} prijava</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Svim odabranim kandidatima bit će poslan email s magic linkom za popunjavanje upisa na diplomski studij.
          </Typography>
          {upisIntakes.length > 1 && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Upis na diplomski</InputLabel>
              <Select value={selectedUpisIntakeId} label="Upis na diplomski" onChange={(e) => setSelectedUpisIntakeId(e.target.value)}>
                {upisIntakes.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.title} · {i.academic_year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {upisIntakes.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Nema kreiranog "Upis (diplomski)" intakea. Kreirajte ga u Upravljanje upisima.
            </Alert>
          )}
          {bulkEnrollmentResult && (
            <Alert severity={bulkEnrollmentResult.failed === 0 ? "success" : "warning"}>
              Poslano: {bulkEnrollmentResult.success} · Neuspjelo: {bulkEnrollmentResult.failed}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setBulkEnrollmentModal(false);
              setBulkEnrollmentResult(null);
            }}
            disabled={bulkEnrollmentLoading}
          >
            {bulkEnrollmentResult ? "Zatvori" : "Odustani"}
          </Button>
          {!bulkEnrollmentResult && (
            <Button
              onClick={handleBulkEnrollment}
              variant="contained"
              color="success"
              disabled={bulkEnrollmentLoading || !selectedUpisIntakeId}
              startIcon={bulkEnrollmentLoading ? <CircularProgress size={16} /> : <LinkIcon />}
              sx={{ borderRadius: "100px" }}
            >
              Pošalji svima
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── Confirm soft delete (active) ─────────────── */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>Premjesti u otpad</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Jeste li sigurni da želite premjestiti <strong>{deleteTargetIds.length}</strong> {deleteTargetIds.length === 1 ? "prijavu" : "prijava"} u otpad?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Prijave se mogu vratiti iz otpada kasnije.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={loading !== null}>
            Odustani
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading !== null}
            startIcon={loading === "softDelete" ? <CircularProgress size={16} /> : <DeleteOutlinedIcon />}
          >
            Premjesti u otpad
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Bulk status change modal ─────────────────── */}
      <Dialog open={bulkStatusModal} onClose={handleCloseBulkModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "var(--blue-dark)" }}>
          Promjena statusa — {selected.length} {selected.length === 1 ? "prijava" : "prijava"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Odaberite novi status koji će se primijeniti na sve odabrane prijave.
            {statusesWithMessage.length > 0 && ' Za status "Potrebne izmjene" poruka je obavezna i ista za sve odabrane.'}
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Novi status</InputLabel>
            <Select value={bulkStatus} label="Novi status" onChange={(e) => setBulkStatus(e.target.value)}>
              {bulkStatusOptions.map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mb: 2 }}>
            Status "Upisan" nije dostupan za bulk promjenu jer zahtijeva unos JMBAG-a po prijavi. Koristite pojedinačni pregled prijave.
          </Alert>

          {statusesWithMessage.includes(bulkStatus) && (
            <TextField
              label="Poruka kandidatima"
              multiline
              rows={4}
              fullWidth
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="Ova poruka će biti poslana svim odabranim kandidatima zajedno s linkom za izmjenu prijave."
            />
          )}

          {bulkResult && (
            <Alert severity={bulkResult.failed === 0 ? "success" : "warning"} sx={{ mt: 2 }}>
              Uspješno ažurirano: {bulkResult.success}
              {bulkResult.failed > 0 && ` · Neuspjelo: ${bulkResult.failed}`}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseBulkModal} disabled={loading !== null}>
            {bulkResult ? "Zatvori" : "Odustani"}
          </Button>
          {!bulkResult && (
            <Button
              onClick={handleBulkStatusApply}
              variant="contained"
              disabled={loading !== null || !bulkStatus || (statusesWithMessage.includes(bulkStatus) && !bulkMessage.trim())}
              startIcon={loading === "bulkStatus" ? <CircularProgress size={16} /> : null}
              sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
            >
              Primijeni
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
