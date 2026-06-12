export const documentTypeLabels = {
  identity_card: "Osobna iskaznica (prednja i stražnja strana)",
  birth_certificate: "Rodni list",
  citizenship_certificate: "Domovnica",
  previous_education_certificate: "Svjedodžba / diploma prethodnog obrazovanja",
  grade_transcript: "Prijepis ocjena",
  payment_confirmation: "Uplatnica upisnine",
  tuition_payment_confirmation: "Uplatnica školarine",
  occupational_medicine_certificate: "Uvjerenje medicine rada",
  combined_documents: "Svi dokumenti (jedna datoteka)",
  other: "Ostalo",
};

export const enrollmentTypeOptions = [
  { value: 1, label: "PRVI put upisujem I. godinu studija kao student u redovitom statusu" },
  { value: 2, label: "DRUGI put upisujem I. godinu studija kao student u redovitom statusu" },
  { value: 3, label: "Upisujem I. godinu studija kao student u redovitom statusu, ali sam već studirao/la na dva ili više drugih studijskih programa iste razine kao student u redovitom statusu" },
  { value: 4, label: "Upisujem I. godinu studija kao student u redovitom statusu, ali sam završio/la studij iste razine kao student u redovitom statusu" },
];

export function enrollmentTypeRequiresTuition(enrollmentType) {
  return enrollmentType === 2 || enrollmentType === 3 || enrollmentType === 4;
}

export const applicationConfigs = {
  prijediplomski: {
    title: "Prijava za prijediplomski studij",
    requiredDocuments: [
      "birth_certificate",
      "identity_card",
      "payment_confirmation",
      // tuition_payment_confirmation se dodaje uvjetno (enrollment_type 2/3/4 ili izvanredni)
      // occupational_medicine_certificate se dodaje uvjetno (osim za pm)
    ],
  },
  diplomski: {
    title: "Prijava za diplomski studij",
    requiredDocuments: [
      "birth_certificate",
      "identity_card",
      "payment_confirmation",
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
export const statusesWithMessage = ["needs_update"];
export const statusesWithEmail = ["in_review", "accepted", "rejected"];

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
