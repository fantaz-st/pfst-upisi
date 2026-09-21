"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import { createEnrollmentToken, sendEnrollmentInvite, resolveUpisDIntake } from "@/lib/enrollments/actions";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export default function EnrollmentLinkButton({
  applicationId,
  applicationEmail,
  firstName,
  lastName,
  intakeId = null,
  academicYear = null,
  initialToken = null,
  initialTokenExpiresAt = null,
  initialTokenUsedAt = null,
  initialSentAt = null,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrollmentUrl, setEnrollmentUrl] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(initialTokenExpiresAt);
  const [tokenUsedAt, setTokenUsedAt] = useState(initialTokenUsedAt);
  const [sentAt, setSentAt] = useState(initialSentAt);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [resolving, setResolving] = useState(!intakeId);
  const [resolvedIntakeId, setResolvedIntakeId] = useState(null);
  const [candidateIntakes, setCandidateIntakes] = useState([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");

  // Kad je intakeId zadan (npr. sa stranice upisa, za već postojeći upis),
  // taj intake je već poznat i ispravan — ne treba ga ponovno razrješavati.
  // Inače automatski nađi jedini otvoreni upis_d intake za akademsku godinu
  // prijave; birač se prikazuje samo ako to razrješavanje nije jednoznačno.
  useEffect(() => {
    if (intakeId) return;
    let cancelled = false;
    setResolving(true);
    resolveUpisDIntake(academicYear).then((result) => {
      if (cancelled) return;
      if (result.intake) {
        setResolvedIntakeId(result.intake.id);
      } else {
        setCandidateIntakes(result.candidates || []);
        setError(result.error || null);
      }
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [intakeId, academicYear]);

  // Postojeći token (npr. već generiran link) — pre-popuni odmah, bez
  // prisiljavanja na klik "Generiraj" prije nego kopiranje/slanje rade.
  useEffect(() => {
    if (initialToken) {
      setEnrollmentUrl(`${window.location.origin}/upis-diplomski/${initialToken}`);
    }
  }, [initialToken]);

  const isExpired = tokenExpiresAt && new Date(tokenExpiresAt) < new Date();

  const handleGenerate = async () => {
    const targetIntakeId = intakeId || resolvedIntakeId || selectedIntakeId;
    if (!targetIntakeId) { setError("Odaberite upis na koji se kandidat upisuje."); return; }
    setLoading(true);
    setError(null);
    const result = await createEnrollmentToken(applicationId, targetIntakeId);
    if (result.error) {
      setError(result.error);
    } else {
      setEnrollmentUrl(`${window.location.origin}/upis-diplomski/${result.token}`);
      setTokenExpiresAt(result.tokenExpiresAt);
      setTokenUsedAt(result.tokenUsedAt);
      router.refresh();
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(enrollmentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    setLoading(true);
    const token = enrollmentUrl.split("/").pop();
    const result = await sendEnrollmentInvite({ token, email: applicationEmail, firstName, lastName });
    if (result?.error) {
      setError(result.error);
    } else {
      setEmailSent(true);
      setSentAt(result.sentAt);
      router.refresh();
    }
    setLoading(false);
  };

  const needsPicker = !intakeId && !resolvedIntakeId && candidateIntakes.length > 1;
  const unresolvable = !intakeId && !resolvedIntakeId && candidateIntakes.length === 0 && !resolving;
  const canGenerate = !resolving && (intakeId || resolvedIntakeId || selectedIntakeId);

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      {!enrollmentUrl ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {needsPicker && (
            <FormControl fullWidth size="small">
              <InputLabel>Upis na diplomski</InputLabel>
              <Select value={selectedIntakeId} label="Upis na diplomski" onChange={e => setSelectedIntakeId(e.target.value)}>
                {candidateIntakes.map(i => (
                  <MenuItem key={i.id} value={i.id}>{i.title} · {i.academic_year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {unresolvable && !error && (
            <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
              Nema kreiranog "Upis (diplomski)" intakea. Kreirajte ga u Upravljanje upisima.
            </Alert>
          )}
          <Button
            variant="outlined"
            color="success"
            startIcon={loading || resolving ? <CircularProgress size={16} /> : <LinkIcon />}
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            fullWidth
            sx={{ borderRadius: "100px" }}
          >
            Generiraj link za upis
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 1.5, background: "rgba(46,125,50,0.06)", border: "1px solid rgba(46,125,50,0.3)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "success.dark", display: "block", mb: 0.75 }}>
            Link za upis:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, background: "white", borderRadius: 1, px: 1, py: 0.5, border: "1px solid var(--gray-200)", mb: 1 }}>
            <Typography variant="caption" sx={{ flex: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--blue-main)" }}>
              {enrollmentUrl}
            </Typography>
            <Tooltip title={copied ? "Kopirano!" : "Kopiraj"}>
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopyIcon sx={{ fontSize: 14, color: copied ? "success.main" : "text.secondary" }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              color={isExpired ? "error" : "default"}
              label={isExpired ? "Istekao" : `Ističe ${formatDateTime(tokenExpiresAt)}`}
              sx={{ fontSize: "0.7rem" }}
            />
            <Chip
              size="small"
              variant="outlined"
              color={tokenUsedAt ? "success" : "default"}
              label={tokenUsedAt ? `Iskorišten ${formatDateTime(tokenUsedAt)}` : "Nije iskorišten"}
              sx={{ fontSize: "0.7rem" }}
            />
            <Chip
              size="small"
              variant="outlined"
              color={sentAt ? "info" : "default"}
              label={sentAt ? `Poslan ${formatDateTime(sentAt)}` : "Nije poslan"}
              sx={{ fontSize: "0.7rem" }}
            />
          </Box>

          {isExpired && (
            <Alert severity="warning" sx={{ mb: 1, fontSize: "0.78rem" }}>
              Link je istekao. Kliknite "Obnovi" za novi rok valjanosti.
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" color="success"
              startIcon={loading ? <CircularProgress size={14} /> : <SendIcon />}
              onClick={handleSendEmail} disabled={loading || emailSent || isExpired}
              sx={{ borderRadius: "100px", flex: 1 }}
            >
              {emailSent ? "Poslano ✓" : `Pošalji na ${applicationEmail}`}
            </Button>
            <Button size="small" onClick={() => { setEnrollmentUrl(null); setEmailSent(false); }} disabled={loading} sx={{ borderRadius: "100px" }}>
              Obnovi
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
