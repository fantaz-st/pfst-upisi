import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { applicationStatuses, getProgramLabel, studyTypes, enrollmentTypeOptions } from "@/lib/applications/config";
import ApplicationStatusControl from "@/components/admin/ApplicationStatusControl";
import ApplicationNotes from "@/components/admin/ApplicationNotes";
import DocumentsList from "@/components/admin/DocumentsList";
import ApplicationActions from "@/components/admin/ApplicationActions";
import ApplicantPhoto from "@/components/admin/ApplicantPhoto";
import { canAccessApplication } from "@/lib/admin/permissions";
import styles from "../../admin.module.css";

export default async function ApplicationDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .select(`*, intakes ( title, academic_year, slug, study_level ), application_documents ( * ), application_notes ( *, admin_id )`)
    .eq("id", id)
    .single();

  if (error || !application) notFound();

  const hasAccess = await canAccessApplication(application.program, application.intake_id);
  if (!hasAccess) redirect("/admin/moje-prijave");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const statusConfig = applicationStatuses[application.status] ?? { label: application.status, color: "default" };
  const programLabel = getProgramLabel(application.program);
  const studyTypeLabel = studyTypes.find((t) => t.value === application.study_type)?.label || application.study_type;
  const otherDocs = application.application_documents?.filter((d) => d.document_type !== "photo") ?? [];

  const InfoRow = ({ label, value }) => (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value ?? "—"}</span>
    </div>
  );

  const SectionDivider = ({ label }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button href="/admin/moje-prijave" startIcon={<ArrowBackIcon />} sx={{ mb: 3, borderRadius: "100px" }} size="small">
        Nazad
      </Button>

      {/* Header */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 4, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--blue-main)", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>
            {application.intakes?.title} · {application.intakes?.academic_year}
          </Box>
          <Box sx={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--blue-dark)", letterSpacing: "-0.02em" }}>
            {application.first_name} {application.last_name}
          </Box>
          <Box sx={{ fontSize: "0.82rem", fontFamily: "monospace", color: "var(--gray-400)", mt: 0.25 }}>{application.application_number}</Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Chip label={statusConfig.label} color={statusConfig.color} sx={{ fontWeight: 700 }} />
          <ApplicationActions application={application} intakeSlug={application.intakes?.slug} intakeStudyLevel={application.intakes?.study_level} />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Left */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Osobni podaci */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Osobni podaci</div>
            <Box sx={{ display: "flex", gap: 2.5, mb: 2 }}>
              <ApplicantPhoto documents={application.application_documents} />
              <Box sx={{ flex: 1 }}>
                <InfoRow label="JMBAG" value={application.jmbag} />
                <InfoRow label="Email" value={application.email} />
                <InfoRow label="Mobitel" value={application.phone} />
                <InfoRow label="OIB" value={application.oib} />
                <InfoRow label="Datum rođenja" value={application.birth_date ? new Date(application.birth_date).toLocaleDateString("hr-HR") : null} />
                <InfoRow label="Mjesto rođenja" value={application.birth_place} />
                <InfoRow label="Spol" value={application.gender} />
                <InfoRow label="Bračno stanje" value={application.marital_status} />
                <InfoRow label="Državljanstvo" value={application.citizenship} />
                <InfoRow label="Adresa" value={application.address} />
                <InfoRow label="Grad" value={`${application.postal_code ?? ""} ${application.city ?? ""}`.trim()} />
              </Box>
            </Box>
          </div>

          {/* Podaci o studiju */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Podaci o studiju</div>
            <InfoRow label="Studij" value={programLabel} />
            <InfoRow label="Vrsta studiranja" value={studyTypeLabel} />
            <InfoRow label="Plasman na rang listi" value={application.ranking_score} />
            <InfoRow label="Izjava o upisu" value={application.enrollment_type ? enrollmentTypeOptions.find((o) => o.value === application.enrollment_type)?.label : null} />
          </div>

          {/* Roditelji */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Podaci o roditeljima</div>
            <SectionDivider label="Otac" />
            <InfoRow label="Ime" value={application.father_name} />
            <InfoRow label="Zvanje i zanimanje" value={application.father_occupation} />
            <InfoRow label="Adresa" value={application.father_address} />
            <SectionDivider label="Majka" />
            <InfoRow label="Ime" value={application.mother_name} />
            <InfoRow label="Zvanje i zanimanje" value={application.mother_occupation} />
            <InfoRow label="Adresa" value={application.mother_address} />
          </div>

          {/* Obrazovanje */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Prethodno obrazovanje</div>
            <InfoRow label="Završena srednja škola" value={application.previous_institution} />
            <InfoRow label="Program / smjer" value={application.previous_program} />
            <InfoRow label="Godina završetka" value={application.previous_completion_year} />
            <InfoRow label="Drugi fakultet / viša škola" value={application.other_education} />
          </div>

          {/* Dokumenti */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Dokumenti</div>
            <DocumentsList documents={otherDocs} />
          </div>
        </Grid>

        {/* Right */}
        <Grid size={{ xs: 12, md: 4 }}>
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Promjena statusa</div>
            <ApplicationStatusControl applicationId={application.id} currentStatus={application.status} currentJmbag={application.jmbag} userId={user?.id} />
          </div>
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Interne bilješke</div>
            <ApplicationNotes notes={application.application_notes ?? []} applicationId={application.id} userId={user?.id} />
          </div>
        </Grid>
      </Grid>
    </Container>
  );
}
