import { createClient } from "@/lib/supabase/server";
import { getAdminPermissions } from "@/lib/admin/permissions";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import IntakeSelector from "@/components/admin/IntakeSelector";
import ApplicationsTrendChart from "@/components/admin/ApplicationsTrendChart";
import ApplicationsByProgramChart from "@/components/admin/ApplicationsByProgramChart";
import { applicationStatuses, getProgramShortCode } from "@/lib/applications/config";
import styles from "../admin.module.css";
import Link from "next/link";

export const metadata = { title: "Početna — Admin" };

export default async function AdminHomePage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const permissions = await getAdminPermissions();

  const { data: intakes } = await supabase
    .from("intakes")
    .select("id, title, academic_year, slug, study_level, is_open")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  const intakeFilter = params?.intake ?? "";

  let query = supabase
    .from("applications")
    .select(`id, application_number, first_name, last_name, email, status, created_at, program, study_type, intakes ( id, title, academic_year, slug )`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (intakeFilter) query = query.eq("intake_id", intakeFilter);

  const { data: applications } = await query;

  const allApps = applications || [];
  const visibleApps = permissions === "all" ? allApps : allApps.filter((app) => permissions.includes(app.program));

  // ─── Statistike po statusu ──────────────────────────────
  const statusCounts = {};
  for (const key of Object.keys(applicationStatuses)) statusCounts[key] = 0;
  visibleApps.forEach((app) => {
    if (statusCounts[app.status] !== undefined) statusCounts[app.status]++;
  });

  // ─── Statistike po programu ─────────────────────────────
  const programCounts = {};
  visibleApps.forEach((app) => {
    const code = getProgramShortCode(app.program);
    programCounts[code] = (programCounts[code] || 0) + 1;
  });
  const programData = Object.entries(programCounts)
    .map(([program, count]) => ({ program, count }))
    .sort((a, b) => b.count - a.count);

  // ─── Trend kroz vrijeme (po danu, zadnjih 30 dana) ──────
  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const dayCounts = {};
  days.forEach((d) => (dayCounts[d] = 0));
  visibleApps.forEach((app) => {
    const day = app.created_at?.slice(0, 10);
    if (day in dayCounts) dayCounts[day]++;
  });
  const trendData = days.map((d) => ({
    label: new Date(d).toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit" }),
    count: dayCounts[d],
  }));

  // ─── Zadnje prijave ──────────────────────────────────────
  const recentApps = visibleApps.slice(0, 8);

  const total = visibleApps.length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Početna</div>
          <div className={styles.pageSubtitle}>Pregled prijava{intakeFilter ? "" : " — svi upisni rokovi"}</div>
        </div>
        <IntakeSelector intakes={intakes ?? []} selected={intakeFilter} />
      </div>

      {/* ─── Stat kartice ─────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ukupno prijava</div>
          <div className={styles.statValue}>{total}</div>
        </div>
        {Object.entries(applicationStatuses).map(([key, config]) => (
          <div className={styles.statCard} key={key}>
            <div className={styles.statLabel}>{config.label}</div>
            <div className={styles.statValue}>{statusCounts[key]}</div>
          </div>
        ))}
      </div>

      {/* ─── Grafovi ──────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Trend prijava — zadnjih 30 dana</span>
            </div>
            <Box sx={{ p: 2 }}>
              {trendData.some((d) => d.count > 0) ? <ApplicationsTrendChart data={trendData} /> : <div className={styles.emptyState}>Nema podataka za prikaz.</div>}
            </Box>
          </div>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Prijave po studiju</span>
            </div>
            <Box sx={{ p: 2 }}>
              {programData.length > 0 ? <ApplicationsByProgramChart data={programData} /> : <div className={styles.emptyState}>Nema podataka za prikaz.</div>}
            </Box>
          </div>
        </Grid>
      </Grid>

      {/* ─── Zadnje prijave ───────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Zadnje prijave</span>
          <Link
            href={`/admin/sve-prijave${intakeFilter ? `?intake=${intakeFilter}` : ""}`}
            style={{ fontSize: "0.8rem", color: "var(--blue-main)", fontWeight: 600, textDecoration: "none" }}
          >
            Sve prijave →
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <div className={styles.emptyState}>Nema prijava.</div>
        ) : (
          <Box>
            {recentApps.map((app, index) => {
              const statusConfig = applicationStatuses[app.status] ?? {
                label: app.status,
                color: "default",
              };

              return (
                <Link
                  key={app.id}
                  href={`/admin/prijave/${app.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: 2.5,
                      py: 1.5,
                      borderBottom: index === recentApps.length - 1 ? "none" : "1px solid var(--gray-100)",
                      "&:hover": {
                        background: "var(--gray-50)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        minWidth: 0,
                      }}
                    >
                      <span className={styles.appNumber}>{app.application_number}</span>

                      <span className={styles.nameCell}>
                        {app.first_name} {app.last_name}
                      </span>

                      <Chip
                        label={getProgramShortCode(app.program)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          background: "var(--blue-pale)",
                          color: "var(--blue-dark)",
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="caption" className={styles.secondaryText}>
                        {app.created_at ? new Date(app.created_at).toLocaleDateString("hr-HR") : "—"}
                      </Typography>

                      <Chip
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                        }}
                      />
                    </Box>
                  </Box>
                </Link>
              );
            })}
          </Box>
        )}
      </div>
    </Container>
  );
}
