import Container from "@mui/material/Container";
import Image from "next/image";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import StatusCheckForm from "@/components/status/StatusCheckForm";
import styles from "./page.module.css";

export const metadata = {
  title: "Provjera statusa prijave — Pomorski fakultet Split",
};

export default function StatusPage() {
  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Container maxWidth="lg">
          <div className={styles.topBarInner}>
            <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={180} height={50} className={styles.topBarLogo} />
            <Link href="/" className={styles.topBarBack}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Povratak
            </Link>
          </div>
        </Container>
      </div>

      {/* Main */}
      <div className={styles.main}>
        <Container maxWidth="sm">
          <div className={styles.header}>
            <div className={styles.iconWrap}>
              <TrackChangesIcon sx={{ fontSize: 28, color: "var(--blue-main)" }} />
            </div>
            <h1 className={styles.title}>Provjera statusa prijave</h1>
            <p className={styles.subtitle}>Unesite broj prijave i OIB za provjeru statusa.</p>
          </div>

          <StatusCheckForm styles={styles} />
        </Container>
      </div>
    </div>
  );
}
