"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { enrollmentStatuses, enrollmentStatusesWithMessage } from "@/lib/applications/config";
import { confirmEnrollmentWithJmbag, rejectEnrollment, markEnrollmentInReview, requestEnrollmentUpdate } from "@/lib/enrollments/actions";

// pending i submitted su sustavska stanja koja postavlja tok prijave/upisa, ne
// referada — nemaju gumb. Ova četiri su jedine akcije koje referada bira ručno.
// "confirmed" nema unos u actionsByStatus — uvijek ide kroz JMBAG modal (handleClick).
const actionableStatuses = ["in_review", "needs_update", "rejected", "confirmed"];

const actionsByStatus = {
  in_review: markEnrollmentInReview,
  rejected: rejectEnrollment,
};

export default function EnrollmentStatusControl({ enrollmentId, currentStatus, currentJmbag }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [messageModal, setMessageModal] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [jmbagModal, setJmbagModal] = useState(false);
  const [jmbagInput, setJmbagInput] = useState(currentJmbag || "");

  const available = actionableStatuses.filter((key) => key !== currentStatus);

  const runAction = async (statusKey, action, ...args) => {
    setLoading(statusKey);
    setError(null);
    setSuccess(null);
    const result = await action(enrollmentId, ...args);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Status uspješno promijenjen.");
      router.refresh();
    }
    setLoading(null);
  };

  const handleClick = (statusKey) => {
    setError(null);
    setSuccess(null);
    if (statusKey === "confirmed") {
      setJmbagInput(currentJmbag || "");
      setJmbagModal(true);
      return;
    }
    if (enrollmentStatusesWithMessage.includes(statusKey)) {
      setAdminMessage("");
      setMessageModal(true);
      return;
    }
    runAction(statusKey, actionsByStatus[statusKey]);
  };

  const handleSendUpdate = () => {
    setMessageModal(false);
    runAction("needs_update", requestEnrollmentUpdate, adminMessage);
  };

  const handleConfirmWithJmbag = () => {
    setJmbagModal(false);
    runAction("confirmed", confirmEnrollmentWithJmbag, jmbagInput.trim());
  };

  if (available.length === 0) return null;

  return (
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
      {available.map((key) => {
        const cfg = enrollmentStatuses[key];
        return (
          <Button
            key={key}
            variant="outlined"
            color={cfg.color === "default" ? "inherit" : cfg.color}
            onClick={() => handleClick(key)}
            disabled={loading !== null}
            startIcon={loading === key ? <CircularProgress size={16} /> : null}
            sx={{ justifyContent: "flex-start" }}
          >
            {cfg.label}
          </Button>
        );
      })}

      <Dialog open={messageModal} onClose={() => setMessageModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700 }}>Poruka kandidatu</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ova poruka će biti poslana kandidatu emailom zajedno s linkom za dovršetak upisa.
          </Typography>
          <TextField
            label="Poruka"
            multiline
            rows={5}
            fullWidth
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
            placeholder="npr. Molimo dostavite presliku dokumenta jer priložena kopija nije čitljiva."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMessageModal(false)}>Odustani</Button>
          <Button
            variant="contained"
            disabled={!adminMessage.trim() || loading !== null}
            onClick={handleSendUpdate}
            startIcon={loading === "needs_update" ? <CircularProgress size={16} /> : null}
          >
            Pošalji obavijest
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={jmbagModal} onClose={() => setJmbagModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Source Serif 4", serif', fontWeight: 700 }}>Potvrda upisa</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Možete unijeti JMBAG kandidata prije potvrde upisa. Ako ga još nemate, možete ga unijeti i kasnije kroz uređivanje upisa.
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
            onClick={handleConfirmWithJmbag}
            startIcon={loading === "confirmed" ? <CircularProgress size={16} /> : null}
          >
            Potvrdi upis
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
