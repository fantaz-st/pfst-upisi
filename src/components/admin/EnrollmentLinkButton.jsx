"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
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
import { createClient } from "@/lib/supabase/client";
import { createEnrollmentToken, sendEnrollmentInvite } from "@/lib/enrollments/actions";

export default function EnrollmentLinkButton({ applicationId, applicationEmail, firstName, lastName }) {
  const [loading, setLoading] = useState(false);
  const [enrollmentUrl, setEnrollmentUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [upisIntakes, setUpisIntakes] = useState([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("intakes")
      .select("id, title, academic_year")
      .eq("form_type", "upis_d")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUpisIntakes(data || []);
        if (data?.length === 1) setSelectedIntakeId(data[0].id);
      });
  }, []);

  const handleGenerate = async () => {
    if (!selectedIntakeId) { setError("Odaberite upis na koji se kandidat upisuje."); return; }
    setLoading(true);
    setError(null);
    const result = await createEnrollmentToken(applicationId, selectedIntakeId);
    if (result.error) {
      setError(result.error);
    } else {
      setEnrollmentUrl(`${window.location.origin}/upis-diplomski/${result.token}`);
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
    if (result?.error) setError(result.error);
    else setEmailSent(true);
    setLoading(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      {!enrollmentUrl ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {upisIntakes.length > 1 && (
            <FormControl fullWidth size="small">
              <InputLabel>Upis na diplomski</InputLabel>
              <Select value={selectedIntakeId} label="Upis na diplomski" onChange={e => setSelectedIntakeId(e.target.value)}>
                {upisIntakes.map(i => (
                  <MenuItem key={i.id} value={i.id}>{i.title} · {i.academic_year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {upisIntakes.length === 0 && (
            <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
              Nema kreiranog "Upis (diplomski)" intakea. Kreirajte ga u Upravljanje upisima.
            </Alert>
          )}
          <Button
            variant="outlined"
            color="success"
            startIcon={loading ? <CircularProgress size={16} /> : <LinkIcon />}
            onClick={handleGenerate}
            disabled={loading || !selectedIntakeId}
            fullWidth
            sx={{ borderRadius: "100px" }}
          >
            Generiraj link za upis
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 1.5, background: "rgba(46,125,50,0.06)", border: "1px solid rgba(46,125,50,0.3)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "success.dark", display: "block", mb: 0.75 }}>
            Link za upis (aktivan 14 dana):
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" color="success"
              startIcon={loading ? <CircularProgress size={14} /> : <SendIcon />}
              onClick={handleSendEmail} disabled={loading || emailSent}
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
