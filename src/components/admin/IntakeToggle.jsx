"use client";

import { useState, useTransition } from "react";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { toggleIntakeOpen, toggleIntakeVisible } from "@/lib/intakes/actions";

export default function IntakeToggle({ id, field, value, label, color }) {
  const [checked, setChecked] = useState(value);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const newValue = e.target.checked;
    setChecked(newValue);
    startTransition(async () => {
      try {
        if (field === "open") {
          await toggleIntakeOpen(id, newValue);
        } else {
          await toggleIntakeVisible(id, newValue);
        }
      } catch {
        // Revert on error
        setChecked(!newValue);
      }
    });
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
      {isPending ? (
        <CircularProgress size={20} />
      ) : (
        <>
          <Switch
            checked={checked}
            onChange={handleChange}
            size="small"
            color={color === "success" ? "success" : "primary"}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: checked ? (color === "success" ? "success.main" : "primary.main") : "text.disabled",
              minWidth: 60,
            }}
          >
            {checked ? label : (field === "open" ? "Zatvoreno" : "Skriveno")}
          </Typography>
        </>
      )}
    </Box>
  );
}
