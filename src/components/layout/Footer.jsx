import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        py: 4,
        backgroundColor: "#0D2B52",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "0.8rem" }} align="center">
          © {new Date().getFullYear()} Pomorski fakultet Split · Sveučilište u Splitu
        </Typography>
        <Typography variant="caption" display="block" align="center" sx={{ color: "rgba(255,255,255,0.4)", mt: 0.5, fontSize: "0.7rem" }}>
          Ruđera Boškovića 37, 21 000 Split · Tel: +385 21 619 490
        </Typography>
      </Container>
    </Box>
  );
}
