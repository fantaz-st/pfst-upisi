"use client";

import Button from "@mui/material/Button";
import SchoolIcon from "@mui/icons-material/School";
import LockIcon from "@mui/icons-material/Lock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./IntakeCard.module.css";

export default function IntakeCard({ intake }) {
  const isOpen = intake.is_open;

  return (
    <div className={`${styles.card} ${isOpen ? styles.open : styles.closed}`}>
      <div className={isOpen ? styles.topAccent : styles.topAccentClosed} />
      <div className={`${styles.decorative} ${isOpen ? styles.open : styles.closed}`} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${isOpen ? styles.open : styles.closed}`}>
            <SchoolIcon sx={{ fontSize: 22 }} />
          </div>
          <div className={`${styles.statusBadge} ${isOpen ? styles.open : styles.closed}`}>
            <span className={`${styles.statusDot} ${isOpen ? styles.open : styles.closed}`} />
            {isOpen ? "Prijave otvorene" : "Prijave zatvorene"}
          </div>
        </div>

        <h3 className={styles.title}>{intake.title}</h3>

        {intake.short_description && (
          <p className={styles.description}>{intake.short_description}</p>
        )}

        <div className={styles.academicYear}>
          <span className={styles.academicYearDot} />
          Ak. godina {intake.academic_year}
        </div>
      </div>

      <div className={styles.actions}>
        {isOpen ? (
          <Button
            href={`/prijava/${intake.slug}`}
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
            Prijavi se
          </Button>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            disabled
            startIcon={<LockIcon />}
            sx={{
              borderRadius: "100px",
              py: 1.5,
              borderStyle: "dashed",
            }}
          >
            Zatvoreno
          </Button>
        )}
      </div>
    </div>
  );
}
