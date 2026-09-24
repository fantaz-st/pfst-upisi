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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getProgramLabel, studyTypes, enrollmentTypeOptions, enrollmentStatuses } from "@/lib/applications/config";
import ApplicantPhoto from "@/components/admin/ApplicantPhoto";
import EnrollmentStatusControl from "@/components/admin/EnrollmentStatusControl";
import EnrollmentLinkButton from "@/components/admin/EnrollmentLinkButton";
import EnrollmentNotes from "@/components/admin/EnrollmentNotes";
import EnrollmentDeleteButton from "@/components/admin/EnrollmentDeleteButton";
import { canAccessIntake } from "@/lib/admin/permissions";
import styles from "../../admin.module.css";

export default async function EnrollmentDetailPage({ params }) {
  const { enrollmentId } = await params;
  const supabase = await createClient();

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select(
      `*,
      applications ( id, first_name, last_name, email, phone, oib, application_number, program, study_type, application_documents ( * ) ),
      intakes ( id, title, academic_year, slug, form_type ),
      enrollment_notes ( * )`,
    )
    .eq("id", enrollmentId)
    .is("deleted_at", null)
    .single();

  if (error || !enrollment) notFound();

  const hasAccess = await canAccessIntake(enrollment.intake_id);
  if (!hasAccess) redirect("/admin/sve-prijave");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const application = enrollment.applications;
  const intake = enrollment.intakes;
  const backHref = intake?.id ? `/admin/intake/${intake.id}` : "/admin/pocetna";

  const statusInfo = enrollmentStatuses[enrollment.status] ?? { label: enrollment.status, color: "default" };
  const isExpired = enrollment.token_expires_at && new Date(enrollment.token_expires_at) < new Date() && !enrollment.token_used_at;
  const programLabel = getProgramLabel(application?.program);
  const studyTypeLabel = studyTypes.find((t) => t.value === application?.study_type)?.label || application?.study_type;

  const coursesS1 = enrollment.selected_courses_s1 ?? [];
  const coursesS2 = enrollment.selected_courses_s2 ?? [];
  const totalS1 = coursesS1.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const totalS2 = coursesS2.reduce((sum, c) => sum + (c.credits ?? 0), 0);

  const InfoRow = ({ label, value }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value}</span>
      </div>
    );
  };

  const SectionDivider = ({ label }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );

  const CourseList = ({ title, courses, total }) => (
    <Box sx={{ mb: 2 }}>
      <SectionDivider label={title} />
      {courses.length === 0 ? (
        <Box sx={{ color: "text.secondary", fontSize: "0.85rem", py: 1 }}>Nema odabranih predmeta.</Box>
      ) : (
        <>
          {courses.map((c) => (
            <div key={c.id} className={styles.infoRow}>
              <span className={styles.infoLabel}>{c.name}</span>
              <span className={styles.infoValue}>{c.credits} ECTS</span>
            </div>
          ))}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel} style={{ fontWeight: 700 }}>
              Ukupno
            </span>
            <span className={styles.infoValue} style={{ fontWeight: 700 }}>
              {total} ECTS
            </span>
          </div>
        </>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, md: 3 }, overflowX: "hidden" }}>
      <Button href={backHref} startIcon={<ArrowBackIcon />} sx={{ mb: 3, borderRadius: "100px" }} size="small">
        Nazad
      </Button>

      {/* Header */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 4, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Box sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--blue-main)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {intake?.title} · {intake?.academic_year}
            </Box>
            <Chip
              label={isExpired ? "Isteklo" : statusInfo.label}
              color={isExpired ? "error" : statusInfo.color}
              size="small"
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                fontWeight: 700,
                height: 20,
                fontSize: "0.68rem",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Box>
          <Box sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" }, fontWeight: 700, color: "var(--blue-dark)", letterSpacing: "-0.02em", wordBreak: "break-word" }}>
            {application?.first_name} {application?.last_name}
          </Box>
          <Box sx={{ fontSize: "0.82rem", fontFamily: "monospace", color: "var(--gray-400)", mt: 0.25 }}>{application?.application_number}</Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
          <Chip
            label={isExpired ? "Isteklo" : statusInfo.label}
            color={isExpired ? "error" : statusInfo.color}
            sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 700 }}
          />
          <Button
            href={`/api/enrollments/${enrollment.id}/pdf`}
            target="_blank"
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfIcon />}
            sx={{ borderRadius: "100px", flex: { xs: 1, sm: "unset" }, minWidth: 0 }}
          >
            Preuzmi upisni list
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Left */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Osobni podaci upisa */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Osobni podaci upisa</div>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2.5, mb: 2, alignItems: { xs: "center", sm: "flex-start" } }}>
              <ApplicantPhoto documents={application?.application_documents} firstName={application?.first_name} lastName={application?.last_name} />
              <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                <InfoRow label="JMBAG" value={enrollment.jmbag} />
                <InfoRow label="OIB" value={application?.oib} />
                <InfoRow label="Email" value={application?.email} />
                <InfoRow label="Mobitel" value={application?.phone} />
                <InfoRow label="Mjesto rođenja" value={enrollment.birth_place} />
                <InfoRow label="Spol" value={enrollment.gender} />
                <InfoRow label="Bračno stanje" value={enrollment.marital_status} />
                <InfoRow label="Izjava o upisu" value={enrollment.enrollment_type ? enrollmentTypeOptions.find((o) => o.value === enrollment.enrollment_type)?.label : null} />
              </Box>
            </Box>
          </div>

          {/* Podaci o studiju */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Podaci o studiju</div>
            <InfoRow label="Studij" value={programLabel} />
            <InfoRow label="Vrsta studiranja" value={studyTypeLabel} />
          </div>

          {/* Roditelji — samo ako postoje podaci */}
          {(enrollment.father_name || enrollment.mother_name) && (
            <div className={styles.sectionPaper}>
              <div className={styles.sectionTitle}>Podaci o roditeljima</div>
              {enrollment.father_name && (
                <>
                  <SectionDivider label="Otac" />
                  <InfoRow label="Ime" value={enrollment.father_name} />
                  <InfoRow label="Zvanje i zanimanje" value={enrollment.father_occupation} />
                  <InfoRow label="Adresa" value={enrollment.father_address} />
                </>
              )}
              {enrollment.mother_name && (
                <>
                  <SectionDivider label="Majka" />
                  <InfoRow label="Ime" value={enrollment.mother_name} />
                  <InfoRow label="Zvanje i zanimanje" value={enrollment.mother_occupation} />
                  <InfoRow label="Adresa" value={enrollment.mother_address} />
                </>
              )}
            </div>
          )}

          {/* Izborni predmeti */}
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Odabrani izborni predmeti</div>
            <CourseList title="1. semestar" courses={coursesS1} total={totalS1} />
            <CourseList title="2. semestar" courses={coursesS2} total={totalS2} />
          </div>
        </Grid>

        {/* Right */}
        <Grid size={{ xs: 12, md: 4 }}>
          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Promjena statusa</div>
            <EnrollmentStatusControl enrollmentId={enrollment.id} currentStatus={enrollment.status} currentJmbag={enrollment.jmbag} />
          </div>

          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Status upisa</div>
            <InfoRow label="Status" value={isExpired ? "Isteklo" : statusInfo.label} />
            <InfoRow label="Poslano" value={enrollment.submitted_at ? new Date(enrollment.submitted_at).toLocaleString("hr-HR") : null} />
            <InfoRow label="Link istječe" value={enrollment.token_expires_at ? new Date(enrollment.token_expires_at).toLocaleString("hr-HR") : null} />
            <InfoRow label="Link iskorišten" value={enrollment.token_used_at ? new Date(enrollment.token_used_at).toLocaleString("hr-HR") : null} />
          </div>

          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Link za upis</div>
            {application?.id && (
              <EnrollmentLinkButton
                applicationId={application.id}
                applicationEmail={application.email}
                firstName={application.first_name}
                lastName={application.last_name}
                intakeId={enrollment.intake_id}
                initialToken={enrollment.token}
              />
            )}
          </div>

          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Prijava</div>
            {application?.id ? (
              <Button href={`/admin/prijave/${application.id}`} variant="outlined" fullWidth sx={{ borderRadius: "100px" }}>
                Pregled prijave →
              </Button>
            ) : (
              <Box sx={{ color: "text.secondary", fontSize: "0.85rem" }}>Prijava nije pronađena.</Box>
            )}
          </div>

          <div className={styles.sectionPaper}>
            <div className={styles.sectionTitle}>Interne bilješke</div>
            <EnrollmentNotes notes={enrollment.enrollment_notes ?? []} enrollmentId={enrollment.id} userId={user?.id} />
          </div>

          <div className={styles.sectionPaper}>
            <EnrollmentDeleteButton
              enrollmentId={enrollment.id}
              candidateName={`${application?.first_name ?? ""} ${application?.last_name ?? ""}`.trim()}
              redirectTo={backHref}
            />
          </div>
        </Grid>
      </Grid>
    </Container>
  );
}
