import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Image from "next/image";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getEnrollmentByToken } from "@/lib/enrollments/actions";
import { getElectiveCourses, getElectiveRequirements } from "@/lib/intakes/actions";
import EnrollmentFormD from "@/components/application/EnrollmentFormD";
import styles from "@/app/prijava/[slug]/page.module.css";

export async function generateMetadata() {
  return { title: "Upis na diplomski — Pomorski fakultet Split" };
}

export default async function EnrollmentPage({ params }) {
  const { token } = await params;
  const enrollment = await getEnrollmentByToken(token);

  if (!enrollment) notFound();

  const intake = enrollment.intakes;
  const application = enrollment.applications;

  let courses = [];
  let requirements = [];
  if (enrollment.intake_id) {
    [courses, requirements] = await Promise.all([
      getElectiveCourses(enrollment.intake_id),
      getElectiveRequirements(enrollment.intake_id),
    ]);
  }

  return (
    <div className={styles.page}>
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
          <div className={styles.pageHeader}>
            <span className={styles.pageEyebrow}>Akademska godina {intake?.academic_year}</span>
            <h1 className={styles.pageTitle}>Upis na diplomski studij</h1>
          </div>

          {enrollment.expired ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              Link za upis je istekao. Kontaktirajte referadu na <a href="mailto:upisi@pfst.hr">upisi@pfst.hr</a>.
            </Alert>
          ) : enrollment.used && enrollment.data?.status === "submitted" ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Vaš upis je već uspješno poslan. Primit ćete potvrdu emailom.
            </Alert>
          ) : (
            <EnrollmentFormD
              token={token}
              enrollment={enrollment}
              application={application}
              intake={intake}
              courses={courses}
              requirements={requirements}
            />
          )}
        </Container>
      </div>
    </div>
  );
}
