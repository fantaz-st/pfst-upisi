"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import { studyPrograms, studyTypes, getProgramLabel } from "@/lib/applications/config";
import { uploadCandidateList, deleteCandidateList, getCandidateLists, getCandidateListDetails } from "@/lib/intakes/actions";
import { createClient } from "@/lib/supabase/client";

// Normaliziraj tekst za lako uspoređivanje header ćelija
const norm = (s) => String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

// Pronađi index kolone čiji header sadrži bilo koji od keyword-a
function findCol(headerRow, keywords) {
  for (let i = 0; i < headerRow.length; i++) {
    const cell = norm(headerRow[i]);
    if (!cell) continue;
    for (const kw of keywords) {
      if (cell === norm(kw) || cell.includes(norm(kw))) return i;
    }
  }
  return -1;
}

// OIB: točno 11 znamenki. Excel često skine vodeću nulu i pretvori u broj —
// ako imamo 10 znamenki, dodajemo vodeću nulu.
function normalizeOib(v) {
  const digits = String(v ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11) return digits;
  if (digits.length === 10) return "0" + digits;
  return "";
}

// "Prezime, Ime" → { first_name, last_name }. Podržava i "Ime Prezime" fallback.
function splitKandidat(v) {
  const s = String(v ?? "").trim();
  if (!s) return { first_name: "", last_name: "" };
  if (s.includes(",")) {
    const [ln, fn] = s.split(",", 2).map((x) => x.trim());
    return { first_name: fn || "", last_name: ln || "" };
  }
  // Nema zareza — pretpostavljamo "Ime Prezime" (npr. ručno unesen slučaj)
  const parts = s.split(/\s+/);
  return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") };
}

// Parser za XLS/XLSX/CSV
// Vraća { candidates, skipped: { noRight, invalidOib } } — za feedback korisniku
async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (!rows.length) return resolve({ candidates: [], skipped: { noRight: 0, invalidOib: 0 } });

        // Pronađi prvi red koji izgleda kao header (sadrži "oib" ili "kandidat" ili "prezime")
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const joined = rows[i].map(norm).join("|");
          if (joined.includes("oib") || joined.includes("kandidat") || joined.includes("prezime")) {
            headerRowIdx = i;
            break;
          }
        }

        const hasHeader = headerRowIdx >= 0;
        const headerRow = hasHeader ? rows[headerRowIdx] : [];
        const dataRows = hasHeader ? rows.slice(headerRowIdx + 1) : rows;

        // Detektiraj kolone po imenu — podržava razne varijante formata
        const oibCol = findCol(headerRow, ["oib"]);
        const kandidatCol = findCol(headerRow, ["kandidat"]);
        const lastNameCol = findCol(headerRow, ["prezime"]);
        const firstNameCol = findCol(headerRow, ["ime"]);
        const emailCol = findCol(headerRow, ["email", "e-mail", "e mail"]);
        const pravoUpisaCol = findCol(headerRow, ["pravo upisa"]);

        const candidates = [];
        let skippedNoRight = 0;
        let skippedInvalidOib = 0;
        const seenOib = new Set();

        for (const row of dataRows) {
          if (!row.length || row.every((c) => String(c ?? "").trim() === "")) continue;

          // Filter: preskoči kandidate bez prava upisa
          if (pravoUpisaCol >= 0) {
            const pravo = norm(row[pravoUpisaCol]);
            if (pravo && pravo !== "da") {
              skippedNoRight++;
              continue;
            }
          }

          // OIB — bilo iz nazvanog stupca, bilo prvi cell koji izgleda kao 10/11 znamenki
          let oib = "";
          if (oibCol >= 0) {
            oib = normalizeOib(row[oibCol]);
          } else {
            for (const cell of row) {
              const candidate = normalizeOib(cell);
              if (candidate) { oib = candidate; break; }
            }
          }
          if (!oib) {
            skippedInvalidOib++;
            continue;
          }
          if (seenOib.has(oib)) continue;
          seenOib.add(oib);

          // Ime + prezime
          let first_name = "", last_name = "";
          if (kandidatCol >= 0) {
            ({ first_name, last_name } = splitKandidat(row[kandidatCol]));
          } else {
            if (firstNameCol >= 0) first_name = String(row[firstNameCol] ?? "").trim();
            if (lastNameCol >= 0) last_name = String(row[lastNameCol] ?? "").trim();
          }

          const email = emailCol >= 0 ? String(row[emailCol] ?? "").trim() : "";

          candidates.push({ oib, first_name, last_name, email });
        }

        resolve({ candidates, skipped: { noRight: skippedNoRight, invalidOib: skippedInvalidOib } });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function CandidateListManager({ intakeId }) {
  const [lists, setLists] = useState([]); // [{ program, study_type, count }]
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Upload form state
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedStudyType, setSelectedStudyType] = useState("");
  const [parsedCandidates, setParsedCandidates] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [manualOib, setManualOib] = useState("");

  // Detalji liste (expand-on-click)
  const [expandedKey, setExpandedKey] = useState(null);
  const [detailsByKey, setDetailsByKey] = useState({}); // { key: [{oib, first_name, last_name, email}] }
  const [detailsLoadingKey, setDetailsLoadingKey] = useState(null);
  const [detailsSearch, setDetailsSearch] = useState("");

  const fileInputRef = useRef(null);

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski]
    .filter((p, i, self) => i === self.findIndex(x => x.value === p.value));

  useEffect(() => {
    if (!intakeId) return;
    loadLists();
  }, [intakeId]);

  async function loadLists() {
    setLoading(true);
    const data = await getCandidateLists(intakeId);
    setLists(data);
    setLoading(false);
  }

  // Dodatna info nakon parse-a (npr. koliko preskočeno zbog 'Pravo upisa = Ne')
  const [parseInfo, setParseInfo] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setParseError(null);
    setParseInfo(null);
    setParsedCandidates(null);

    try {
      const { candidates, skipped } = await parseFile(file);
      if (!candidates.length) {
        if (skipped.noRight > 0 || skipped.invalidOib > 0) {
          setParseError(
            `Nije pronađen nijedan valjani kandidat. ` +
            `Preskočeno: ${skipped.noRight} bez prava upisa, ${skipped.invalidOib} bez valjanog OIB-a.`
          );
        } else {
          setParseError("Nije pronađen nijedan OIB u datoteci. Provjerite da tablica sadrži stupac 'OIB' i 'Kandidat' (ili 'Prezime, Ime').");
        }
        return;
      }
      setParsedCandidates(candidates);
      if (skipped.noRight > 0 || skipped.invalidOib > 0) {
        const parts = [];
        if (skipped.noRight > 0) parts.push(`${skipped.noRight} bez prava upisa`);
        if (skipped.invalidOib > 0) parts.push(`${skipped.invalidOib} bez valjanog OIB-a`);
        setParseInfo(`Prepoznat ${candidates.length} kandidata. Preskočeno: ${parts.join(", ")}.`);
      } else {
        setParseInfo(`Prepoznat ${candidates.length} kandidata.`);
      }
    } catch (err) {
      setParseError("Greška pri čitanju datoteke. Provjerite format (podržan: XLS, XLSX, CSV).");
    }
  };

  const handleAddManualOib = () => {
    const oib = manualOib.trim().replace(/\D/g, "");
    if (oib.length !== 11) {
      setParseError("OIB mora imati točno 11 znamenki.");
      return;
    }
    setParseError(null);
    setParsedCandidates(prev => {
      const existing = prev || [];
      if (existing.some(c => c.oib === oib)) return existing;
      return [...existing, { oib, first_name: "", last_name: "", email: "" }];
    });
    setManualOib("");
  };

  const handleRemoveCandidate = (oib) => {
    setParsedCandidates(prev => prev.filter(c => c.oib !== oib));
  };

  const handleUpload = async () => {
    if (!selectedProgram || !selectedStudyType || !parsedCandidates?.length) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    const result = await uploadCandidateList({
      intakeId,
      program: selectedProgram,
      study_type: selectedStudyType,
      candidates: parsedCandidates,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Lista uspješno uploadana — ${result.count} kandidata.`);
      setParsedCandidates(null);
      setSelectedProgram("");
      setSelectedStudyType("");
      await loadLists();
    }
    setUploading(false);
  };

  const handleDelete = async (program, study_type) => {
    const key = `${program}__${study_type}`;
    setDeleting(key);
    const result = await deleteCandidateList({ intakeId, program, study_type });
    if (result.error) setError(result.error);
    else {
      // ako brišemo trenutno expanded, zatvori
      if (expandedKey === key) setExpandedKey(null);
      setDetailsByKey((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      await loadLists();
    }
    setDeleting(null);
  };

  const handleToggleExpand = async (program, study_type) => {
    const key = `${program}__${study_type}`;
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    setDetailsSearch("");
    if (!detailsByKey[key]) {
      setDetailsLoadingKey(key);
      const result = await getCandidateListDetails({ intakeId, program, study_type });
      if (result.candidates) {
        setDetailsByKey((prev) => ({ ...prev, [key]: result.candidates }));
      } else if (result.error) {
        setError(result.error);
      }
      setDetailsLoadingKey(null);
    }
  };

  const getStudyTypeLabel = (v) => studyTypes.find(t => t.value === v)?.label || v;

  if (!intakeId) return null;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Postojeće liste */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : lists.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: "var(--blue-dark)" }}>
            Uploadane liste:
          </Typography>
          {lists.map(({ program, study_type, count }) => {
            const key = `${program}__${study_type}`;
            const isExpanded = expandedKey === key;
            const isLoadingDetails = detailsLoadingKey === key;
            const candidates = detailsByKey[key] || [];
            const q = detailsSearch.trim().toLowerCase();
            const filteredCandidates = q
              ? candidates.filter(
                  (c) =>
                    c.oib?.includes(q) ||
                    c.first_name?.toLowerCase().includes(q) ||
                    c.last_name?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
                )
              : candidates;
            return (
              <Box key={key} sx={{ borderBottom: "1px solid var(--gray-100)" }}>
                <Box
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5, py: 1,
                    cursor: "pointer",
                    "&:hover": { background: "rgba(0,0,0,0.02)" },
                  }}
                  onClick={() => handleToggleExpand(program, study_type)}
                >
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    <strong>{getProgramLabel(program)}</strong> · {getStudyTypeLabel(study_type)}
                  </Typography>
                  <Chip
                    label={`${count} kandidata`}
                    size="small"
                    sx={{ background: "var(--blue-pale)", color: "var(--blue-dark)", fontWeight: 600 }}
                  />
                  <Button
                    size="small"
                    color="error"
                    startIcon={deleting === key ? <CircularProgress size={12} /> : <DeleteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(program, study_type);
                    }}
                    disabled={deleting !== null}
                    sx={{ fontSize: "0.72rem", minWidth: 0, px: 1 }}
                  >
                    Obriši
                  </Button>
                </Box>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, pr: 1, pb: 2, pt: 0.5 }}>
                    {isLoadingDetails ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                        <CircularProgress size={18} />
                      </Box>
                    ) : (
                      <>
                        <TextField
                          size="small"
                          placeholder="Pretraži po OIB-u, imenu, prezimenu ili emailu"
                          value={detailsSearch}
                          onChange={(e) => setDetailsSearch(e.target.value)}
                          fullWidth
                          sx={{ mb: 1.5 }}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon fontSize="small" sx={{ color: "var(--gray-400)" }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <TableContainer sx={{ maxHeight: 320, border: "1px solid var(--gray-100)", borderRadius: 1 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>OIB</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Prezime</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Ime</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Email</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredCandidates.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} sx={{ textAlign: "center", color: "var(--gray-500)", fontSize: "0.8rem", py: 2 }}>
                                    {q ? "Nema rezultata za pretragu." : "Lista je prazna."}
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredCandidates.map((c) => (
                                  <TableRow key={c.oib} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{c.oib}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem" }}>{c.last_name || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem" }}>{c.first_name || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: "0.78rem", color: "var(--gray-600)" }}>{c.email || "—"}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {q && (
                          <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--gray-500)" }}>
                            Prikazano {filteredCandidates.length} od {candidates.length}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nema uploadanih lista. Upis je otvoren svim pristupnicima dok ne uploadate listu.
        </Alert>
      )}

      <Divider sx={{ mb: 2.5 }} />

      {/* Upload nova lista */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: "var(--blue-dark)" }}>
        Dodaj novu listu kandidata:
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Studij *</InputLabel>
          <Select value={selectedProgram} label="Studij *" onChange={e => setSelectedProgram(e.target.value)}>
            {allPrograms.map(p => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Vrsta studiranja *</InputLabel>
          <Select value={selectedStudyType} label="Vrsta studiranja *" onChange={e => setSelectedStudyType(e.target.value)}>
            {studyTypes.map(t => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Upload XLS */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedProgram || !selectedStudyType}
          sx={{ borderRadius: "100px" }}
        >
          Učitaj XLS / XLSX / CSV
        </Button>
        <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv" onChange={handleFileSelect} style={{ display: "none" }} />

        <Typography variant="body2" color="text.secondary">ili</Typography>

        {/* Ručni unos OIB-a */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Unesite OIB ručno"
            value={manualOib}
            onChange={e => setManualOib(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddManualOib()}
            disabled={!selectedProgram || !selectedStudyType}
            sx={{ width: 200 }}
            slotProps={{ input: { maxLength: 11, sx: { fontFamily: "monospace" } } }}
          />
          <Button size="small" variant="outlined" startIcon={<AddIcon />}
            onClick={handleAddManualOib}
            disabled={!selectedProgram || !selectedStudyType || manualOib.trim().length !== 11}
            sx={{ borderRadius: "100px" }}>
            Dodaj
          </Button>
        </Box>
      </Box>

      {parseError && <Alert severity="error" sx={{ mb: 1.5 }}>{parseError}</Alert>}
      {parseInfo && !parseError && <Alert severity="info" sx={{ mb: 1.5 }}>{parseInfo}</Alert>}

      {/* Preview */}
      {parsedCandidates?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Preview — {parsedCandidates.length} kandidata:
            </Typography>
            <Button size="small" color="error" onClick={() => setParsedCandidates(null)}
              sx={{ fontSize: "0.72rem" }}>
              Poništi
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 220, border: "1px solid var(--gray-200)", borderRadius: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>OIB</TableCell>
                  <TableCell>Prezime</TableCell>
                  <TableCell>Ime</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedCandidates.map(c => (
                  <TableRow key={c.oib}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{c.oib}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{c.last_name || "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{c.first_name || "—"}</TableCell>
                    <TableCell padding="checkbox">
                      <Button size="small" color="error" onClick={() => handleRemoveCandidate(c.oib)}
                        sx={{ minWidth: 0, p: 0.5, fontSize: "0.7rem" }}>✕</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            size="small"
            onClick={handleUpload}
            disabled={uploading || !selectedProgram || !selectedStudyType}
            startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
            sx={{ mt: 1.5, borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
          >
            {uploading ? "Sprema..." : `Spremi listu (${parsedCandidates.length} kandidata)`}
          </Button>
        </Box>
      )}
    </Box>
  );
}
