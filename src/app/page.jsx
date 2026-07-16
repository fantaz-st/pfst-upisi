import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import { getVisibleIntakes } from "@/lib/intakes/queries";
import IntakeCards from "@/components/landing/IntakeCards";
import Header from "@/components/landing/Header";
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
        <Header />
        <div className={styles.heroDiagonal} />
        <div className={styles.heroDiagonal2} />
        <div className={styles.heroShapeLight} />
        <div className={styles.heroShape} />

        <Container maxWidth="lg" className={styles.heroContent}>
          <div className={styles.heroTextWrap}>
            <Typography variant="h2" className={styles.heroTitle}>
              Upisi na
              <br />
              Pomorski fakultet
            </Typography>

            <div className={styles.heroDash} />

            <p className={styles.heroSubtitle}>
              Odaberite jednu od ponuđenih prijava ili upisa i ispunite je. <br className={styles.subBreak} />
              Priložite tražene dokumente i pratite status vaše prijave.
            </p>

            <div className={styles.heroActions}>
              <a href="#upisi" className={styles.heroCta}>
                <AssignmentIcon sx={{ fontSize: 19 }} />
                Upisi i prijave
                <span className={styles.heroCtaArrow}>→</span>
              </a>
              <a href="/status" className={styles.heroCtaOutline}>
                <TrackChangesIcon sx={{ fontSize: 19 }} />
                Provjeri status
              </a>
            </div>
          </div>
        </Container>
      </Box>

      {/* Intakes */}
      <Box id="upisi" className={styles.intakesSection}>
        <Container maxWidth="lg">
          {/* <span className={styles.sectionEyebrow}>Dostupne prijave i upisi</span> */}
          <Typography variant="h2" className={styles.sectionTitle}>
            Otvorene prijave i upisi
          </Typography>
          {/* <Typography className={styles.sectionSubtitle}>Odaberite jednu od otvorenih prijava i ispunite obrazac za upis.</Typography> */}
          <IntakeCards intakes={intakes} />
        </Container>
      </Box>

      {/* Status strip */}
      <Box className={styles.statusStrip}>
        <Container maxWidth="lg">
          <Box className={styles.statusStripInner}>
            <Box className={styles.statusStripLeft}>
              <span className={styles.statusStripDot} />
              <Box>
                <div className={styles.statusStripText}>Već ste predali podatke za prijavu ili upis?</div>
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

      {/* How it works */}
      <Box className={styles.howSection}>
        <Container maxWidth="lg">
          {/* <span className={styles.sectionEyebrow}></span> */}
          <Typography variant="h2" className={styles.sectionTitle}>
            Kako funkcionira proces upisa?
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
                  <a href="mailto:upisi@pfst.hr" className={styles.contactLink}>
                    upisi@pfst.hr
                  </a>{" "}
                  ili na{" "}
                  <a href="tel:+38521380762" className={styles.contactLink}>
                    +385 21 380 762
                  </a>
                </div>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
