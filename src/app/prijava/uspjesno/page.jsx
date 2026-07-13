import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata = {
  title: "Prijava zaprimljena — Pomorski fakultet Split",
};

export default async function SuccessPage({ searchParams }) {
  const params = await searchParams;
  const applicationNumber = params?.broj;

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Container maxWidth="lg">
          <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={160} height={36} className={styles.topBarLogo} />
        </Container>
      </div>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <CheckCircleIcon sx={{ fontSize: 40, color: "#059669" }} />
          </div>

          <h1 className={styles.title}>Prijava zaprimljena</h1>
          <p className={styles.subtitle}>Vaša prijava je uspješno zaprimljena. Studentska referada će pregledati vašu dokumentaciju i kontaktirati vas putem email adrese.</p>

          {applicationNumber && (
            <>
              <div className={styles.divider} />
              <div className={styles.numberBox}>
                <span className={styles.numberLabel}>Broj prijave</span>
                <div className={styles.numberValue}>{applicationNumber}</div>
              </div>
              <p className={styles.hint}>Sačuvajte ovaj broj — potreban je za provjeru statusa prijave.</p>
            </>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              href="/status"
              variant="contained"
              startIcon={<TrackChangesIcon />}
              fullWidth
              sx={{
                background: "var(--blue-main)",
                borderRadius: "100px",
                py: 1.5,
                fontWeight: 700,
                "&:hover": { background: "var(--blue-mid)" },
              }}
            >
              Provjeri status prijave
            </Button>
            <Button
              href="/"
              variant="outlined"
              startIcon={<HomeIcon />}
              fullWidth
              sx={{
                borderRadius: "100px",
                py: 1.5,
                fontWeight: 600,
                borderColor: "var(--gray-200)",
                color: "var(--gray-600)",
                "&:hover": { borderColor: "var(--blue-main)", color: "var(--blue-main)" },
              }}
            >
              Povratak na naslovnicu
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
}
