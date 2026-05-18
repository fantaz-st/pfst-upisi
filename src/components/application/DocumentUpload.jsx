"use client";

import { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export default function DocumentUpload({ documentType, label, required, onFileChange }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Dopušteni formati: PDF, JPG, PNG");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("Datoteka je prevelika (max 10MB)");
      return;
    }

    setError(null);
    setFile(selected);
    onFileChange(selected);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    setFile(null);
    onFileChange(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: error ? "error.main" : file ? "success.main" : "divider",
        borderRadius: 2,
        p: 2,
        backgroundColor: file
          ? "rgba(46, 125, 50, 0.04)"
          : error
          ? "rgba(198, 40, 40, 0.04)"
          : "#FAFBFC",
        transition: "all 0.15s",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "text.primary", mb: 0.25 }}
          >
            {label}
            {required && (
              <Typography component="span" sx={{ color: "error.main", ml: 0.25 }}>
                {" "}*
              </Typography>
            )}
          </Typography>
          {file ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
              <Typography
                variant="caption"
                sx={{
                  color: "success.main",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </Typography>
              <Chip
                label={formatFileSize(file.size)}
                size="small"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            </Box>
          ) : error ? (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {error}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              PDF, JPG ili PNG (max 10MB)
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {file && (
            <IconButton size="small" onClick={handleRemove} sx={{ color: "text.secondary" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <Button
            variant={file ? "outlined" : "contained"}
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={() => inputRef.current?.click()}
            color={file ? "success" : "primary"}
            sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}
          >
            {file ? "Zamijeni" : "Učitaj"}
          </Button>
        </Box>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </Box>
  );
}
