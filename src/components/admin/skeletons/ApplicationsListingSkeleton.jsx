import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";

/**
 * Skeleton koji imitira layout listing stranica (naslov + toolbar filtera + tablica).
 * Koristi se u pojedinačnim loading.jsx datotekama.
 */
export default function ApplicationsListingSkeleton({ rows = 8, showChip = false }) {
  return (
    <>
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
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, md: 3 } }}>
        {/* Header: naslov + podnaslov (+ opcionalno chip za "Otvoreno") */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
            <Skeleton variant="text" width={280} height={38} sx={{ fontSize: "1.5rem" }} />
            {showChip && <Skeleton variant="rounded" width={90} height={26} />}
          </Box>
          <Skeleton variant="text" width={160} height={20} />
        </Box>

        {/* Toolbar: search + 2 filtera */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Skeleton variant="rounded" height={40} sx={{ width: { xs: "100%", sm: 280 }, minWidth: { xs: "100%", sm: 280 } }} />
          <Skeleton variant="rounded" width={200} height={40} />
          <Skeleton variant="rounded" width={160} height={40} />
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
          <Skeleton variant="text" width={40} height={20} />
        </Box>

        {/* Table skeleton */}
        <Box sx={{ background: "white", borderRadius: 2, border: "1px solid var(--gray-100)", overflow: "hidden" }}>
          {/* Header red */}
          <Box sx={{ display: "flex", gap: 2, px: 2, py: 1.25, borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50, #fafafa)" }}>
            <Skeleton variant="text" width={30} sx={{ display: { xs: "none", md: "block" } }} />
            <Skeleton variant="text" width={100} sx={{ display: { xs: "none", sm: "block" } }} />
            <Skeleton variant="text" width={140} sx={{ flex: 1 }} />
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={80} />
            <Skeleton variant="text" width={80} sx={{ display: { xs: "none", sm: "block" } }} />
            <Skeleton variant="text" width={70} />
          </Box>
          {/* Data redovi */}
          {[...Array(rows)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center", px: 2, py: 1.5, borderBottom: i === rows - 1 ? "none" : "1px solid var(--gray-100)" }}>
              <Skeleton variant="text" width={30} sx={{ display: { xs: "none", md: "block" } }} />
              <Skeleton variant="text" width={100} sx={{ display: { xs: "none", sm: "block" } }} />
              <Skeleton variant="text" width={`${40 + ((i * 13) % 30)}%`} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" width={40} height={22} />
              <Skeleton variant="rounded" width={80} height={22} />
              <Skeleton variant="text" width={80} sx={{ display: { xs: "none", sm: "block" } }} />
              <Skeleton variant="rounded" width={70} height={28} />
            </Box>
          ))}
        </Box>
      </Container>
    </>
  );
}
