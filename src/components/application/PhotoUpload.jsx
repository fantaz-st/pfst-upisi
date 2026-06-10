"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Slider from "@mui/material/Slider";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB input
const OUTPUT_SIZE = 300; // 300x300px output

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function PhotoUpload({ onPhotoChange }) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const imgRef = useRef(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Molimo odaberite sliku (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Slika je prevelika (max 5MB).");
      return;
    }

    setError(null);
    setRotation(0);
    setScale(1);

    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result);
      setOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  };

  const getCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current) return null;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-OUTPUT_SIZE / 2, -OUTPUT_SIZE / 2);

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "slika-pristupnika.jpg", { type: "image/jpeg" });
        resolve({ file, dataUrl: canvas.toDataURL("image/jpeg", 0.92) });
      }, "image/jpeg", 0.92);
    });
  }, [completedCrop, rotation, scale]);

  const handleConfirm = async () => {
    const result = await getCroppedImage();
    if (!result) return;
    setPreview(result.dataUrl);
    onPhotoChange(result.file);
    setOpen(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoChange(null);
    setImgSrc("");
  };

  return (
    <>
      <Box sx={{
        border: "1px solid",
        borderColor: preview ? "success.main" : "divider",
        borderRadius: 2,
        p: 2,
        background: preview ? "rgba(46,125,50,0.04)" : "#FAFBFC",
        transition: "all 0.15s",
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Fotografija pristupnika <span style={{ color: "var(--mui-palette-error-main)" }}>*</span>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Jasna fotografija lica (300×300px) — koristit će se za izradu studentske iskaznice
        </Typography>

        {preview ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 1.5, overflow: "hidden",
              border: "2px solid", borderColor: "success.main", flexShrink: 0,
            }}>
              <img src={preview} alt="Fotografija" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
                <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                  Fotografija dodana (300×300px)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="outlined" color="success" onClick={() => inputRef.current?.click()}>
                Zamijeni
              </Button>
              <IconButton size="small" onClick={handleRemove} sx={{ color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => inputRef.current?.click()}
            sx={{ background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
          >
            Dodaj fotografiju
          </Button>
        )}

        {error && <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}
      </Box>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

      {/* Crop Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Prilagodba fotografije
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.25 }}>
            Odaberite i prilagodite dio slike za iskaznicu (1:1)
          </Typography>
        </DialogTitle>

        <DialogContent>
          {imgSrc && (
            <>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2, background: "#f5f5f5", borderRadius: 2, p: 1, minHeight: 300, alignItems: "center" }}>
                <ReactCrop
                  crop={crop}
                  onChange={(_, pct) => setCrop(pct)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                  minWidth={50}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop"
                    onLoad={onImageLoad}
                    style={{
                      maxHeight: 420,
                      maxWidth: "100%",
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transition: "transform 0.2s",
                    }}
                  />
                </ReactCrop>
              </Box>

              {/* Controls */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>Rotacija</Typography>
                <IconButton size="small" onClick={() => setRotation(r => r - 90)}>
                  <RotateLeftIcon />
                </IconButton>
                <Slider
                  value={rotation}
                  onChange={(_, v) => setRotation(v)}
                  min={-180}
                  max={180}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" onClick={() => setRotation(r => r + 90)}>
                  <RotateRightIcon />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: 36, textAlign: "right" }}>
                  {rotation}°
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>Zoom</Typography>
                <Slider
                  value={scale}
                  onChange={(_, v) => setScale(v)}
                  min={0.5}
                  max={3}
                  step={0.05}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" sx={{ minWidth: 36, textAlign: "right" }}>
                  {Math.round(scale * 100)}%
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Odustani</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!completedCrop}
            sx={{ borderRadius: "100px", background: "var(--blue-main)", "&:hover": { background: "var(--blue-dark)" } }}
          >
            Potvrdi fotografiju
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
