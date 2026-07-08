// Predmeti iz akademske godine 2025./2026.
// Koristite ovo kao početnu točku — ažurirajte prema potrebi svake godine u admin modalu.

export const defaultElectiveCourses = [
  // ─── POMORSKA NAUTIKA (PN) ──────────────────────────────
  // 1. semestar — min 25 bodova
  { program: "pn", semester: 1, name: "Upravljanje ljudskim potencijalima",   instructor: "Dr. sc. A. Russo",    credits: 5, sort_order: 0 },
  { program: "pn", semester: 1, name: "Pomorski strategijski menadžment",     instructor: "Dr. sc. E. Marušić",  credits: 6, sort_order: 1 },
  { program: "pn", semester: 1, name: "Hidrografsko inženjerstvo",            instructor: "Dr. sc. I. Pavić",    credits: 6, sort_order: 2 },
  // 2. semestar — min 17 bodova
  { program: "pn", semester: 2, name: "Transportno osiguranje",               instructor: "Dr. sc. R. Petrinović", credits: 5, sort_order: 0 },
  { program: "pn", semester: 2, name: "Planiranje i projektiranje luka i terminala", instructor: "Dr. sc. T. Kekez", credits: 5, sort_order: 1 },
  { program: "pn", semester: 2, name: "Operacijska istraživanja",             instructor: "Dr. sc. T. Stanivuk", credits: 5, sort_order: 2 },
  { program: "pn", semester: 2, name: "Tehnologija uklanjanja onečišćenja",   instructor: "Dr. sc. M. Slišković", credits: 5, sort_order: 3 },
  { program: "pn", semester: 2, name: "Ergonomija navigacijskih podsustava",  instructor: "Dr. sc. R. Bošnjak, Dr. sc. D. Medić", credits: 5, sort_order: 4 },
  { program: "pn", semester: 2, name: "Upravljanje tehničkim sustavima",      instructor: "Dr. sc. D. Sumić",    credits: 5, sort_order: 5 },

  // ─── BRODOSTROJARSTVO (BS) ──────────────────────────────
  // 1. semestar — min 13 bodova
  { program: "bs", semester: 1, name: "Brodski rashladni i klimatizacijski uređaji", instructor: "Dr. sc. Z. Jurić", credits: 4, sort_order: 0 },
  { program: "bs", semester: 1, name: "Materijali za primjenu u pomorstvu",   instructor: "Dr. sc. L. Roldo",    credits: 4, sort_order: 1 },
  { program: "bs", semester: 1, name: "Metodologija znanstvenoistraživačkog rada", instructor: "Dr. sc. M. Slišković", credits: 4, sort_order: 2 },
  // 2. semestar — min 5 bodova
  { program: "bs", semester: 2, name: "Operacijska istraživanja",             instructor: "Dr. sc. T. Stanivuk", credits: 5, sort_order: 0 },
  { program: "bs", semester: 2, name: "Tehnologija uklanjanja onečišćenja",   instructor: "Dr. sc. M. Slišković", credits: 4, sort_order: 1 },
  { program: "bs", semester: 2, name: "Daljinsko istraživanje u funkciji održivog razvoja u pomorstvu", instructor: "Dr. sc. M. Krčum, Dr. sc. A. Gudelj, Dr. sc. M. Slišković, Dr. sc. I. Vujović, Dr. sc. Z. Jurić", credits: 4, sort_order: 2 },

  // ─── POMORSKI MENADŽMENT (PM) ──────────────────────────
  // 1. semestar — min 9 bodova
  { program: "pm", semester: 1, name: "Upravljanje kvalitetom u pomorstvu",   instructor: "Dr. sc. M. Krčum",    credits: 5, sort_order: 0 },
  { program: "pm", semester: 1, name: "Hidrografsko inženjerstvo",            instructor: "Dr. sc. I. Pavić",    credits: 6, sort_order: 1 },
  // 2. semestar — min 15 bodova
  { program: "pm", semester: 2, name: "Zelene tehnologije u pomorstvu",       instructor: "Dr. sc. G. Jelić Mrčelić", credits: 5, sort_order: 0 },
  { program: "pm", semester: 2, name: "Pomorski nautički inženjering",        instructor: "Dr. sc. N. Leder",    credits: 6, sort_order: 1 },
  { program: "pm", semester: 2, name: "Daljinsko istraživanje u funkciji održivog razvoja u pomorstvu", instructor: "Dr. sc. M. Krčum, Dr. sc. A. Gudelj, Dr. sc. M. Slišković, Dr. sc. I. Vujović, Dr. sc. Z. Jurić", credits: 4, sort_order: 2 },

  // ─── PEIT ───────────────────────────────────────────────
  // 1. semestar — min 0 bodova (PEIT nema predmete u 1. semestru)
  // 2. semestar — min 8 bodova
  { program: "peit", semester: 2, name: "Zelene tehnologije u pomorstvu",     instructor: "Dr. sc. G. Jelić Mrčelić", credits: 5, sort_order: 0 },
  { program: "peit", semester: 2, name: "Održavanje i pouzdanost brodskih strojnih sustava", instructor: "Dr. sc. T. Perić", credits: 4, sort_order: 1 },
  { program: "peit", semester: 2, name: "Daljinsko istraživanje u funkciji održivog razvoja u pomorstvu", instructor: "Dr. sc. M. Krčum, Dr. sc. A. Gudelj, Dr. sc. M. Slišković, Dr. sc. I. Vujović, Dr. sc. Z. Jurić", credits: 4, sort_order: 2 },
];

export const defaultElectiveRequirements = [
  { program: "pn",   semester: 1, min_credits: 25 },
  { program: "pn",   semester: 2, min_credits: 17 },
  { program: "bs",   semester: 1, min_credits: 13 },
  { program: "bs",   semester: 2, min_credits: 5  },
  { program: "pm",   semester: 1, min_credits: 9  },
  { program: "pm",   semester: 2, min_credits: 15 },
  { program: "peit", semester: 1, min_credits: 0  },
  { program: "peit", semester: 2, min_credits: 8  },
];
