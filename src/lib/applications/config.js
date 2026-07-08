export const documentTypeLabels = {
  identity_card: "Osobna iskaznica",
  birth_certificate: "Rodni list",
  citizenship_certificate: "Domovnica",
  previous_education_certificate: "Svjedodžba / diploma prethodnog obrazovanja",
  grade_transcript: "Prijepis ocjena",
  payment_confirmation: "Potvrda o uplati",
  other: "Ostalo",
};

export const applicationConfigs = {
  prijediplomski: {
    title: "Prijava za prijediplomski studij",
    requiredDocuments: [
      "identity_card",
      // Ostali dokumenti komentirani za testiranje
      // "birth_certificate",
      // "citizenship_certificate",
      // "previous_education_certificate",
      // "grade_transcript",
      // "payment_confirmation",
    ],
  },
  diplomski: {
    title: "Prijava za diplomski studij",
    requiredDocuments: [
      "identity_card",
      // "citizenship_certificate",
      // "previous_education_certificate",
      // "grade_transcript",
      // "payment_confirmation",
    ],
  },
};

export const applicationStatuses = {
  submitted: { label: "Zaprimljeno", color: "info", candidateCanEdit: true },
  in_review: { label: "U obradi", color: "warning", candidateCanEdit: false },
  needs_update: { label: "Potrebne izmjene", color: "error", candidateCanEdit: true },
  accepted: { label: "Prihvaćeno", color: "success", candidateCanEdit: false },
  rejected: { label: "Odbijeno", color: "default", candidateCanEdit: false },
  cancelled: { label: "Otkazano", color: "default", candidateCanEdit: false },
};

// Statuses where admin message modal is shown (sending email to candidate)
export const statusesWithMessage = ["needs_update"];

// Statuses where email is sent to candidate (no message)
export const statusesWithEmail = ["accepted", "rejected"];

export const studyPrograms = {
  prijediplomski: [
    { value: "bs", label: "Brodostrojarstvo" },
    { value: "pn", label: "Pomorska nautika" },
    { value: "peit", label: "Pomorske elektrotehničke i informatičke tehnologije" },
    { value: "pm", label: "Pomorski Menadžment" },
    { value: "ptjm", label: "Pomorske tehnologije jahta i marina" },
  ],
  diplomski: [
    { value: "bs", label: "Brodostrojarstvo" },
    { value: "pn", label: "Pomorska nautika" },
    { value: "peit", label: "Pomorske elektrotehničke i informatičke tehnologije" },
    { value: "pm", label: "Pomorski Menadžment" },
  ],
};

export const studyTypes = [
  { value: "redoviti", label: "Redoviti" },
  { value: "izvanredni", label: "Izvanredni" },
];

export function getProgramLabel(value) {
  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski];
  const program = allPrograms.find((p) => p.value === value);
  return program?.label || value?.toUpperCase() || "—";
}

export function getProgramShortCode(value) {
  return value?.toUpperCase() || "—";
}

// ─── Diplomski — gdje je završen prijediplomski ──────────
// Labels se grade dinamički iz intake podataka (diplomski_period_from/to)
export function getDiplomskiPreviousStudyOptions(intake) {
  const from = intake?.diplomski_period_from || "??";
  const to = intake?.diplomski_period_to || "??";
  return [
    { value: "pfst_current", label: `na PFST od ${from} do ${to}` },
    { value: "pfst_previous", label: "na PFST (stariji upisi)" },
    { value: "other", label: "na drugom fakultetu" },
  ];
}

// Dokumenti ovisno o tome gdje je završen prijediplomski
// pfst_current → 3 docs (potvrda o uplati, potvrda o završenom PD, osobna)
// pfst_previous + other → 5 docs
export function getDiplomskiRequiredDocuments(previousStudyInstitution) {
  const base = ["payment_confirmation", "identity_card"];
  if (previousStudyInstitution === "pfst_current") {
    return [...base, "previous_education_certificate"];
  }
  // pfst_previous i other
  return [...base, "previous_education_certificate", "grade_transcript", "citizenship_certificate", "birth_certificate"];
}

// ─── Enrollment type (Izjava o upisu) — samo prijediplomski ─
export const enrollmentTypeOptions = [
  { value: 1, label: "PRVI put upisujem I. godinu studija kao student u redovitom statusu" },
  { value: 2, label: "DRUGI put upisujem I. godinu studija kao student u redovitom statusu" },
  { value: 3, label: "Upisujem I. godinu studija kao student u redovitom statusu, ali sam već studirao/la na dva ili više drugih studijskih programa iste razine kao student u redovitom statusu" },
  { value: 4, label: "Upisujem I. godinu studija kao student u redovitom statusu, ali sam završio/la studij iste razine kao student u redovitom statusu" },
];

export function enrollmentTypeRequiresTuition(enrollmentType) {
  return enrollmentType === 2 || enrollmentType === 3 || enrollmentType === 4;
}

// ─── Form types ──────────────────────────────────────────
export const formTypes = {
  upis_pd:    { label: "Upis na prijediplomski",  route: "/upis",            btnLabel: "Upiši se",    shortLabel: "Upis PD" },
  prijava_d:  { label: "Prijava na diplomski",     route: "/prijava",         btnLabel: "Prijavi se",  shortLabel: "Prijava D" },
  upis_d:     { label: "Upis na diplomski",        route: "/upis-diplomski",  btnLabel: "Upiši se",    shortLabel: "Upis D" },
};

export function getFormTypeConfig(formType) {
  return formTypes[formType] ?? formTypes.upis_pd;
}
