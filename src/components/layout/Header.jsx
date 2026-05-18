import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "next/link";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";

export default function Header() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #071829 0%, #0D2B52 100%)",
        borderBottom: "1px solid rgba(46,168,204,0.2)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1, px: "0 !important" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
            <DirectionsBoatIcon sx={{ fontSize: 28, color: "#2EA8CC" }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Source Serif 4", serif',
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                Pomorski fakultet
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: '"IBM Plex Sans", sans-serif',
                }}
              >
                Sveučilište u Splitu
              </Typography>
            </Box>
          </Link>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
