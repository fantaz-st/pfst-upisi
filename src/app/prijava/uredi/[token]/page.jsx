import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Image from "next/image";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockClockIcon from "@mui/icons-material/LockClock";
import EditApplicationForm from "@/components/application/EditApplicationForm";
import styles from "./page.module.css";

export default async function EditApplicationPage({ params }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: tokenData } = await supabase
    .from("application_edit_tokens")
    .select(`*, applications ( *, intakes ( title, academic_year, slug ) )`)
    .eq("token", token)
    .single();

  if (!tokenData) notFound();

  const isExpired = new Date(tokenData.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Container maxWidth="lg">
            <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={160} height={36} className={styles.topBarLogo} />
          </Container>
        </div>
        <div className={styles.main}>
          <Container maxWidth="md">
            <div className={styles.expiredCard}>
              <LockClockIcon sx={{ fontSize: 48, color: "var(--gray-300)", mb: 2 }} />
              <h2 className={styles.expiredTitle}>Link je istekao</h2>
              <p className={styles.expiredText}>
                Ovaj link za izmjenu prijave više nije aktivan. Molimo kontaktirajte referadu fakulteta.
              </p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  const application = tokenData.applications;

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Container maxWidth="lg">
          <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={160} height={36} className={styles.topBarLogo} />
        </Container>
      </div>

      <div className={styles.main}>
        <Container maxWidth="md">
          <div className={styles.pageHeader}>
            <span className={styles.eyebrow}>
              {application.intakes?.title} · {application.intakes?.academic_year}
            </span>
            <h1 className={styles.title}>Izmjena prijave</h1>
            <span className={styles.appNumber}>{application.application_number}</span>
          </div>

          {/* Admin message */}
          <div className={styles.adminMessage}>
            <WarningAmberIcon className={styles.adminMessageIcon} sx={{ fontSize: 20 }} />
            <div>
              <div className={styles.adminMessageLabel}>Poruka administratora</div>
              <div className={styles.adminMessageText}>{tokenData.message}</div>
            </div>
          </div>

          <EditApplicationForm application={application} token={token} />
        </Container>
      </div>
    </div>
  );
}
