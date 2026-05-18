"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import { checkApplicationStatus } from "@/lib/applications/actions";
import { applicationStatuses, getProgramLabel, studyTypes } from "@/lib/applications/config";
import styles from "./StatusCheckForm.module.css";

export default function StatusCheckForm() {
  const [applicationNumber, setApplicationNumber] = useState("");
  const [oib, setOib] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const data = await checkApplicationStatus(applicationNumber.trim(), oib.trim());
    if (data.error) setError(data.error);
    else setResult(data);
    setLoading(false);
  };

  const statusConfig = result ? (applicationStatuses[result.status] ?? { label: result.status, color: "default" }) : null;
  const programLabel = result ? getProgramLabel(result.program) : null;
  const studyTypeLabel = result ? studyTypes.find((t) => t.value === result.study_type)?.label : null;

  return (
    <>
      <div className={styles.formCard}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Broj prijave"
            placeholder="npr. PFST-2026-001"
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="OIB"
            placeholder="11 znamenki"
            value={oib}
            onChange={(e) => setOib(e.target.value)}
            fullWidth
            required
            slotProps={{ input: { maxLength: 11 } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !applicationNumber || !oib}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            sx={{
              background: "var(--blue-main)",
              borderRadius: "100px",
              py: 1.5,
              fontWeight: 700,
              mt: 1,
              "&:hover": { background: "var(--blue-dark)" },
            }}
          >
            {loading ? "Provjera..." : "Provjeri status"}
          </Button>
        </Box>
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <WarningAmberIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>Vaša prijava</span>
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ fontWeight: 700 }} />
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Broj prijave</span>
            <span className={styles.resultValueMono}>{result.application_number}</span>
          </div>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Studij</span>
            <span className={styles.resultValue}>{programLabel}</span>
          </div>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Vrsta studiranja</span>
            <span className={styles.resultValue}>{studyTypeLabel}</span>
          </div>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Datum prijave</span>
            <span className={styles.resultValue}>{new Date(result.created_at).toLocaleDateString("hr-HR")}</span>
          </div>

          {result.status === "needs_update" && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              <WarningAmberIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <span>Vaša prijava zahtijeva izmjene. Provjerite email za link i uputu administratora.</span>
            </div>
          )}
          {result.status === "accepted" && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <CheckCircleIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <span>Čestitamo! Vaša prijava je prihvaćena. Za daljnje informacije obratite se referadi.</span>
            </div>
          )}
          {result.status === "rejected" && (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <InfoIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <span>Vaša prijava nije prihvaćena. Za informacije obratite se referadi fakulteta.</span>
            </div>
          )}
          {result.status === "submitted" && (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <InfoIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <span>Vaša prijava je zaprimljena i čeka obradu.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
