"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { applicationStatuses, statusesWithMessage } from "@/lib/applications/config";
import { updateApplicationStatus, updateApplication } from "@/lib/applications/actions";

export default function ApplicationStatusControl({ applicationId, currentStatus, currentJmbag, applicationEmail, applicationFirstName, applicationLastName, studyLevel, enrollmentIntakeId }) {
  const [loading, setLoading] = useState(null);
  const [messageModal, setMessageModal] = useState(false);
  const [jmbagModal, setJmbagModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [jmbagInput, setJmbagInput] = useState(currentJmbag || "");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const statuses = Object.entries(applicationStatuses).filter(([key]) => key !== currentStatus && key !== "submitted");

  const handleStatusClick = (statusKey) => {
    setError(null);
    setSuccess(null);

    if (statusKey === "accepted") {
      setPendingStatus(statusKey);
      setJmbagInput(currentJmbag || "");
      setJmbagModal(true);
    } else if (statusesWithMessage.includes(statusKey)) {
      setPendingStatus(statusKey);
      setMessageModal(true);
    } else {
      handleStatusChange(statusKey);
    }
  };

  const handleStatusChange = async (statusKey, message = null) => {
    setLoading(statusKey);
    setError(null);

    const result = await updateApplicationStatus(applicationId, statusKey, message);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(statusesWithMessage.includes(statusKey) ? "Status promijenjen i email s uputama poslan kandidatu." : "Status uspješno promijenjen.");
    }

    setLoading(null);
    setMessageModal(false);
    setJmbagModal(false);
    setAdminMessage("");
    setPendingStatus(null);
  };

  const handleAcceptWithJmbag = async () => {
    setLoading("accepted");
    setError(null);

    // Spremi JMBAG ako je unesen
    if (jmbagInput.trim()) {
      const jmbagResult = await updateApplication(applicationId, { jmbag: jmbagInput.trim() });
      if (jmbagResult.error) {
        setError(jmbagResult.error);
        setLoading(null);
        return;
      }
    }

    // NAPOMENA: magic link za upis se NE šalje ovdje.
    // Prihvaćanje = obavijest kandidatu da čeka razredbeni postupak.
    // Tek nakon razredbenog admin ručno generira i šalje link
    // (gumb "Generiraj link za upis" na stranici prijave).

    await handleStatusChange("accepted");
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 1 }}>
            {success}
          </Alert>
        )}

        {statuses.map(([key, config]) => (
          <Button
            key={key}
            variant="outlined"
            color={config.color === "default" ? "inherit" : config.color}
            onClick={() => handleStatusClick(key)}
            disabled={loading !== null}
            startIcon={loading === key ? <CircularProgress size={16} /> : null}
            sx={{ justifyContent: "flex-start" }}
          >
            {config.label}
          </Button>
        ))}
      </Box>

      {/* Message Modal for needs_update */}
      <Dialog open={messageModal} onClose={() => setMessageModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700 }}>Poruka kandidatu</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ova poruka će biti poslana kandidatu emailom zajedno s linkom za izmjenu prijave.
          </Typography>
          <TextField
            label="Poruka"
            multiline
            rows={5}
            fullWidth
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
            placeholder="npr. Molimo dostavite presliku domovnice jer priložena kopija nije čitljiva."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMessageModal(false)}>Odustani</Button>
          <Button
            variant="contained"
            disabled={!adminMessage.trim() || loading !== null}
            onClick={() => handleStatusChange(pendingStatus, adminMessage)}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Pošalji obavijest
          </Button>
        </DialogActions>
      </Dialog>

      {/* JMBAG Modal for accepted */}
      <Dialog open={jmbagModal} onClose={() => setJmbagModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700 }}>Prihvaćanje prijave</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Možete unijeti JMBAG kandidata prije prihvaćanja prijave. Ako ga još nemate, možete ga unijeti i kasnije kroz uređivanje prijave.
          </Typography>
          <TextField
            label="JMBAG"
            fullWidth
            value={jmbagInput}
            onChange={(e) => setJmbagInput(e.target.value)}
            placeholder="npr. 0191234567"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setJmbagModal(false)}>Odustani</Button>
          <Button
            variant="contained"
            disabled={loading !== null}
            onClick={handleAcceptWithJmbag}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Prihvati prijavu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
