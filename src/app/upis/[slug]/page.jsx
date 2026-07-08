import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Image from "next/image";
import Link from "next/link";
import { getIntakeBySlug } from "@/lib/intakes/queries";
import { applicationConfigs } from "@/lib/applications/config";
import ApplicationForm from "@/components/application/ApplicationForm";
import ApplicationFormD from "@/components/application/ApplicationFormD";
import styles from "./page.module.css";

export async function generateMetadata() {
  return { title: "Upis — Pomorski fakultet Split" };
}

export default async function ApplicationPage({ params }) {
  const { slug } = await params;
  const intake = await getIntakeBySlug(slug);

  if (!intake) notFound();

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Container maxWidth="lg">
          <div className={styles.topBarInner}>
            <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={160} height={36} className={styles.topBarLogo} />
            <Link href="/" className={styles.topBarBack}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Povratak
            </Link>
          </div>
        </Container>
      </div>

      <div className={styles.main}>
        <Container maxWidth="md">
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Naslovnica
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{intake.title}</span>
          </div>

          <div className={styles.pageHeader}>
            <span className={styles.pageEyebrow}>Akademska godina {intake.academic_year}</span>
            <h1 className={styles.pageTitle}>{applicationConfigs[slug]?.title ?? intake.title}</h1>
          </div>

          {!intake.is_open ? (
            <div className={styles.closedCard}>
              <div className={styles.closedIconWrap}>
                <LockIcon sx={{ fontSize: 28, color: "var(--gray-400)" }} />
              </div>
              <h2 className={styles.closedTitle}>Upis nije otvoren</h2>
              <p className={styles.closedText}>
                Upis na <strong>{intake.title}</strong> trenutno nije otvoren. Pratite našu web stranicu za informacije o rokovima upisa.
              </p>
              <Button href="/" variant="outlined" sx={{ borderRadius: "100px", px: 4 }}>
                Povratak na naslovnicu
              </Button>
            </div>
          ) : intake.form_type === "prijava_d" ? (
            <ApplicationFormD intake={intake} />
          ) : (
            <ApplicationForm intake={intake} />
          )}
        </Container>
      </div>
    </div>
  );
}
