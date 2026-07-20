import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";

export default function AdminLoading() {
  return (
    <Box sx={{ minHeight: "60vh", position: "relative" }}>
      <LinearProgress
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: 3,
          "& .MuiLinearProgress-bar": { background: "var(--blue-main)" },
          background: "rgba(5,140,196,0.15)",
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={40} sx={{ color: "var(--blue-main)" }} />
      </Box>
    </Box>
  );
}
