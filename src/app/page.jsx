import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import Image from "next/image";
import { getVisibleIntakes } from "@/lib/intakes/queries";
import IntakeCards from "@/components/landing/IntakeCards";
import styles from "./page.module.css";

export const revalidate = 60;

export default async function HomePage() {
  const intakes = await getVisibleIntakes();

  const steps = [
    {
      num: "01",
      icon: <AssignmentIcon sx={{ fontSize: 22 }} />,
      title: "Ispunite obrazac",
      desc: "Unesite osobne podatke, podatke o prethodnom obrazovanju i ostale tražene informacije.",
    },
    {
      num: "02",
      icon: <CloudUploadIcon sx={{ fontSize: 22 }} />,
      title: "Priložite dokumente",
      desc: "Učitajte skenove ili fotografije svih traženih dokumenata — osobna iskaznica, domovnica, svjedodžbe.",
    },
    {
      num: "03",
      icon: <CheckCircleIcon sx={{ fontSize: 22 }} />,
      title: "Pošaljite prijavu",
      desc: "Nakon slanja primit ćete potvrdu s brojem vaše prijave na email. Pratite status online.",
    },
  ];

  return (
    <Box>
      {/* Hero */}
      <Box className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className={styles.heroGrid} />

        <Container maxWidth="lg" className={styles.heroContent}>
          <Box className={styles.heroLogo}>
            <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={220} height={52} className={styles.heroLogoImg} />
          </Box>

          <Box className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowDot} />
            <span className={styles.heroEyebrowText}>Akademska godina 2026./2027.</span>
          </Box>

          <Typography variant="h1" className={styles.heroTitle}>
            Upisi na<br />
            <span className={styles.heroTitleAccent}>Pomorski fakultet</span>
          </Typography>

          <Typography className={styles.heroSubtitle}>
            Odaberite vrstu studija i ispunite online prijavu za upis. Priložite tražene dokumente i pratite status vaše prijave.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              href="#upisi"
              variant="contained"
              size="large"
              sx={{
                background: "white",
                color: "var(--blue-dark)",
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: "100px",
                "&:hover": { background: "rgba(255,255,255,0.9)" },
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              Pogledaj studije
            </Button>
            <Button
              href="/status"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: "100px",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.6)",
                  background: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Provjeri status
            </Button>
          </Box>
        </Container>

        <Box className={styles.scrollIndicator}>
          <span className={styles.scrollText}>scroll</span>
          <div className={styles.scrollLine} />
        </Box>
      </Box>

      {/* Status strip */}
      <Box className={styles.statusStrip}>
        <Container maxWidth="lg">
          <Box className={styles.statusStripInner}>
            <Box className={styles.statusStripLeft}>
              <span className={styles.statusStripDot} />
              <Box>
                <div className={styles.statusStripText}>Već ste podnijeli prijavu?</div>
                <div className={styles.statusStripSub}>Provjerite status unosom broja prijave i OIB-a</div>
              </Box>
            </Box>
            <Button
              href="/status"
              variant="contained"
              startIcon={<TrackChangesIcon />}
              size="small"
              sx={{
                background: "var(--blue-main)",
                borderRadius: "100px",
                px: 3,
                fontWeight: 600,
                "&:hover": { background: "var(--blue-mid)" },
              }}
            >
              Provjeri status
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Intakes */}
      <Box id="upisi" className={styles.intakesSection}>
        <Container maxWidth="lg">
          <span className={styles.sectionEyebrow}>Dostupni programi</span>
          <Typography variant="h2" className={styles.sectionTitle}>
            Vrste studija
          </Typography>
          <Typography className={styles.sectionSubtitle}>
            Odaberite vrstu studija za koji se želite prijaviti i ispunite obrazac za upis.
          </Typography>
          <IntakeCards intakes={intakes} />
        </Container>
      </Box>

      {/* How it works */}
      <Box className={styles.howSection}>
        <Container maxWidth="lg">
          <span className={styles.sectionEyebrow}>Proces prijave</span>
          <Typography variant="h2" className={styles.sectionTitle}>
            Kako funkcionira?
          </Typography>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepIconWrap}>{step.icon}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </Box>

      {/* Contact */}
      <Box className={styles.contactSection}>
        <Container maxWidth="lg">
          <Box className={styles.contactInner}>
            <Box className={styles.contactLeft}>
              <div className={styles.contactIconWrap}>
                <InfoOutlinedIcon sx={{ fontSize: 20 }} />
              </div>
              <Box>
                <div className={styles.contactTitle}>Trebate pomoć?</div>
                <div className={styles.contactText}>
                  Kontaktirajte nas na{" "}
                  <a href="mailto:upisi@pfst.hr" className={styles.contactLink}>upisi@pfst.hr</a>
                  {" "}ili na{" "}
                  <a href="tel:+38521380762" className={styles.contactLink}>+385 21 380 762</a>
                </div>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
