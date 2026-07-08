"use client";

import Button from "@mui/material/Button";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LockIcon from "@mui/icons-material/Lock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getFormTypeConfig } from "@/lib/applications/config";
import styles from "./IntakeCard.module.css";

export default function IntakeCard({ intake }) {
  const isOpen = intake.is_open;
  const formConfig = getFormTypeConfig(intake.form_type || (intake.study_level === "diplomski" ? "prijava_d" : "upis_pd"));
  const isPrijava = intake.form_type === "prijava_d";
  const route = `${formConfig.route}/${intake.slug}`;
  const openLabel = isPrijava ? "Prijave otvorene" : "Upis otvoren";
  const closedLabel = isPrijava ? "Prijave zatvorene" : "Upis zatvoren";
  const StatusIcon = isPrijava ? AssignmentIcon : SchoolIcon;

  return (
    <div className={`${styles.card} ${isOpen ? styles.open : styles.closed}`}>
      <div className={isOpen ? styles.topAccent : styles.topAccentClosed} />
      <div className={`${styles.decorative} ${isOpen ? styles.open : styles.closed}`} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${isOpen ? styles.open : styles.closed}`}>
            <StatusIcon sx={{ fontSize: 22 }} />
          </div>
          <div className={`${styles.statusBadge} ${isOpen ? styles.open : styles.closed}`}>
            <span className={`${styles.statusDot} ${isOpen ? styles.open : styles.closed}`} />
            {isOpen ? openLabel : closedLabel}
          </div>
        </div>

        <h3 className={styles.title}>{intake.title}</h3>

        {intake.short_description && <p className={styles.description}>{intake.short_description}</p>}

        <div className={styles.academicYear}>
          <span className={styles.academicYearDot} />
          Ak. godina {intake.academic_year}
        </div>
      </div>

      <div className={styles.actions}>
        {isOpen ? (
          <Button
            href={route}
            variant="contained"
            fullWidth
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: "var(--blue-main)",
              borderRadius: "100px",
              py: 1.5,
              fontWeight: 700,
              "&:hover": { background: "var(--blue-dark)" },
            }}
          >
            {formConfig.btnLabel}
          </Button>
        ) : (
          <Button variant="outlined" fullWidth disabled startIcon={<LockIcon />} sx={{ borderRadius: "100px", py: 1.5, borderStyle: "dashed" }}>
            Zatvoreno
          </Button>
        )}
      </div>
    </div>
  );
}
