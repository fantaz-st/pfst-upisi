"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { documentTypeLabels } from "@/lib/applications/config";
import { getSignedDocumentUrl } from "@/lib/applications/actions";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsList({ documents }) {
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (doc) => {
    setDownloading((prev) => ({ ...prev, [doc.id]: true }));
    const result = await getSignedDocumentUrl(doc.file_path);
    setDownloading((prev) => ({ ...prev, [doc.id]: false }));
    if (result.url) {
      window.open(result.url, "_blank");
    }
  };

  if (!documents.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nema priloženih dokumenata.
      </Typography>
    );
  }

  return (
    <Box>
      {documents.map((doc) => (
        <Box
          key={doc.id}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "#FAFBFC",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
            <InsertDriveFileIcon sx={{ color: "secondary.main", fontSize: 20, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                {documentTypeLabels[doc.document_type] ?? doc.document_type}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
              >
                {doc.file_name} {doc.size_bytes ? `· ${formatBytes(doc.size_bytes)}` : ""}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              downloading[doc.id] ? (
                <CircularProgress size={12} />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={() => handleDownload(doc)}
            disabled={downloading[doc.id]}
            sx={{ flexShrink: 0, fontSize: "0.75rem" }}
          >
            Preuzmi
          </Button>
        </Box>
      ))}
    </Box>
  );
}
