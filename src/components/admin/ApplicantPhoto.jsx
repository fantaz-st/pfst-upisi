"use client";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import { getSignedDocumentUrl } from "@/lib/applications/actions";

export default function ApplicantPhoto({ documents, firstName, lastName }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [filePath, setFilePath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const photoDoc = documents?.find((d) => d.document_type === "photo");
    if (!photoDoc) {
      setLoading(false);
      return;
    }
    setFilePath(photoDoc.file_path);
    getSignedDocumentUrl(photoDoc.file_path).then((result) => {
      if (result.url) setPhotoUrl(result.url);
      setLoading(false);
    });
  }, [documents]);

  const handleDownload = async () => {
    if (!photoUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();

      const extension = filePath?.split(".").pop() || "jpg";
      const filename = `${firstName || ""} ${lastName || ""} - slika`.trim().replace(/\s+/g, " ") + `.${extension}`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: { xs: 160, sm: 200 } }}>
      <Box
        sx={{
          width: { xs: 160, sm: 200 },
          height: { xs: 160, sm: 200 },
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
      {!loading && photoUrl && (
        <Button
          onClick={handleDownload}
          variant="outlined"
          size="small"
          startIcon={downloading ? <CircularProgress size={14} /> : <DownloadIcon />}
          disabled={downloading}
          fullWidth
          sx={{ borderRadius: "100px" }}
        >
          Skini fotografiju
        </Button>
      )}
    </Box>
  );
}
