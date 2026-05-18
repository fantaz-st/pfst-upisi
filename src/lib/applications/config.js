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
    { value: "pn", label: "Nautika" },
    { value: "peit", label: "Pomorske elektrotehničke i informatičke tehnologije" },
    { value: "pm", label: "Pomorski Menadžment" },
    { value: "ptjm", label: "Pomorske tehnologije jahta i marina" },
  ],
  diplomski: [
    { value: "bs", label: "Brodostrojarstvo" },
    { value: "pn", label: "Nautika" },
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
