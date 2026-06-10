"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import PersonIcon from "@mui/icons-material/Person";
import { getSignedDocumentUrl } from "@/lib/applications/actions";

export default function ApplicantPhoto({ documents }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const photoDoc = documents?.find((d) => d.document_type === "photo");
    if (!photoDoc) {
      setLoading(false);
      return;
    }

    getSignedDocumentUrl(photoDoc.file_path).then((result) => {
      if (result.url) setPhotoUrl(result.url);
      setLoading(false);
    });
  }, [documents]);

  return (
    <Box
      sx={{
        width: 200,
        height: 200,
        borderRadius: 2,
        overflow: "hidden",
        border: "2px solid",
        borderColor: "divider",
        flexShrink: 0,
        background: "var(--gray-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : photoUrl ? (
        <img src={photoUrl} alt="Fotografija pristupnika" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <PersonIcon sx={{ fontSize: 40, color: "var(--gray-300)" }} />
      )}
    </Box>
  );
}
