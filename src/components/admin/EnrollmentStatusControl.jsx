"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { enrollmentStatuses } from "@/lib/applications/config";
import { confirmEnrollment, rejectEnrollment, revertEnrollmentToPending } from "@/lib/enrollments/actions";

const transitions = {
  pending: ["rejected"],
  submitted: ["confirmed", "rejected", "pending"],
  confirmed: ["pending", "rejected"],
  rejected: ["pending"],
};

const actionsByStatus = {
  confirmed: confirmEnrollment,
  rejected: rejectEnrollment,
  pending: revertEnrollmentToPending,
};

export default function EnrollmentStatusControl({ enrollmentId, currentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const available = transitions[currentStatus] ?? [];

  const handleClick = async (statusKey) => {
    setLoading(statusKey);
    setError(null);
    setSuccess(null);
    const result = await actionsByStatus[statusKey](enrollmentId);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Status uspješno promijenjen.");
      router.refresh();
    }
    setLoading(null);
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
    </Box>
  );
}
