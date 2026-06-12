import { z } from "zod";

const oibRegex = /^\d{11}$/;

function validateOib(oib) {
  if (!oibRegex.test(oib)) return false;
  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = (a + parseInt(oib[i])) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  const check = 11 - a === 10 ? 0 : 11 - a;
  return check === parseInt(oib[10]);
}

export const enrollmentSchema = z.object({
  enrollment_type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()]).optional(),
});

export const personalInfoSchema = z.object({
  first_name: z.string().min(2, "Ime mora imati najmanje 2 znaka"),
  last_name: z.string().min(2, "Prezime mora imati najmanje 2 znaka"),
  email: z.string().email("Unesite valjanu email adresu"),
  phone: z.string().min(9, "Unesite valjani broj mobitela").optional().or(z.literal("")),
  oib: z.string().length(11, "OIB mora imati točno 11 znamenki").refine(validateOib, { message: "OIB nije valjan" }),
  birth_date: z.string().min(1, "Datum rođenja je obavezan"),
  birth_place: z.string().min(2, "Mjesto rođenja je obavezno"),
  gender: z.enum(["muški", "ženski", "ostalo"], { errorMap: () => ({ message: "Odaberite spol" }) }),
  marital_status: z.string().min(1, "Bračno stanje je obavezno"),
  citizenship: z.string().min(2, "Državljanstvo je obavezno"),
  address: z.string().min(5, "Adresa je obavezna"),
  city: z.string().min(2, "Grad je obavezan"),
  postal_code: z.string().min(5, "Poštanski broj je obavezan"),
  program: z.string().min(1, "Odabir studija je obavezan"),
  study_type: z.enum(["redoviti", "izvanredni"], { errorMap: () => ({ message: "Odaberite vrstu studiranja" }) }),
});

export const parentsSchema = z.object({
  father_name: z.string().optional().or(z.literal("")),
  father_occupation: z.string().optional().or(z.literal("")),
  father_address: z.string().optional().or(z.literal("")),
  mother_name: z.string().optional().or(z.literal("")),
  mother_occupation: z.string().optional().or(z.literal("")),
  mother_address: z.string().optional().or(z.literal("")),
});

export const educationSchema = z.object({
  previous_institution: z.string().min(3, "Naziv ustanove je obavezan"),
  previous_program: z.string().min(2, "Program/smjer je obavezan"),
  previous_completion_year: z.string().regex(/^\d{4}$/, "Unesite valjanu godinu (npr. 2024)"),
  other_education: z.string().optional().or(z.literal("")),
  ranking_score: z.string().optional().or(z.literal("")),
});

export const consentSchema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: "Morate prihvatiti uvjete za nastavak" }) }),
});

export const fullApplicationSchema = personalInfoSchema
  .merge(parentsSchema)
  .merge(educationSchema)
  .merge(enrollmentSchema)
  .merge(consentSchema);
