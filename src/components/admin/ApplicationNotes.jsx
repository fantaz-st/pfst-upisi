"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useRouter } from "next/navigation";
import { addApplicationNote } from "@/lib/applications/actions";

export default function ApplicationNotes({ notes, applicationId, userId }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAdd = async () => {
    if (!note.trim()) return;
    setSaving(true);
    setError(null);
    const result = await addApplicationNote(applicationId, note.trim(), userId);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setNote("");
      router.refresh();
    }
  };

  return (
    <Box>
      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Nema bilješki.
        </Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          {notes.map((n) => (
            <Box
              key={n.id}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                backgroundColor: "#F8FAFB",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {n.note}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {new Date(n.created_at).toLocaleString("hr-HR")}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        value={note}
        onChange={(e) => setNote(e.target.value)}
        multiline
        rows={3}
        fullWidth
        placeholder="Dodajte internu bilješku..."
        sx={{ mb: 1 }}
        size="small"
      />
      <Button
        variant="outlined"
        fullWidth
        onClick={handleAdd}
        disabled={saving || !note.trim()}
        size="small"
      >
        {saving ? "Sprema..." : "Dodaj bilješku"}
      </Button>
    </Box>
  );
}
