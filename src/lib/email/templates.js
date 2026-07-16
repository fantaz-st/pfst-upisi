// ─────────────────────────────────────────────────────────────
// Konfiguracija — mijenjati po potrebi svake akademske godine
// ─────────────────────────────────────────────────────────────

// Rok do kada upisani studenti mogu tražiti potvrde o upisu.
// Koristi se u emailPrihvaceno (prijediplomski). Ažuriraj svake godine.
const POTVRDA_ROK = "četvrtka, 23. srpnja 2026. godine";

export function emailPotvrda({ ime, prezime, brojPrijave, studij, akademskaGodina }) {
  return {
    subject: `Potvrda prijave — ${brojPrijave}`,
    html: `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#0D2B52" style="background:linear-gradient(135deg,#0D2B52,#1B6CA8);padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Prijava zaprimljena</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Vaša prijava za upis na <strong>${studij}</strong> za akademsku godinu <strong>${akademskaGodina}</strong> je uspješno zaprimljena.
              </p>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Broj prijave</p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#0D2B52;font-family:monospace;">${brojPrijave}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Sačuvajte ovaj broj prijave — trebat će vam za provjeru statusa prijave.
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
                O statusu vaše prijave bit ćete obaviješteni putem e-pošte.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
              <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function emailPotrebneIzmjene({ ime, prezime, brojPrijave, poruka, magicLink }) {
  return {
    subject: `Potrebne izmjene prijave — ${brojPrijave}`,
    html: `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#0D2B52" style="background:linear-gradient(135deg,#0D2B52,#1B6CA8);padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Potrebne izmjene</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Vaša prijava <strong style="font-family:monospace;">${brojPrijave}</strong> zahtijeva izmjene. 
                Molimo pročitajte poruku ispod i izmijenite prijavu klikom na link.
              </p>

              <!-- Message box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #1B6CA8;background:#F0F7FF;border-radius:0 6px 6px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#1B6CA8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Poruka administratora</p>
                    <p style="margin:0;font-size:15px;color:#333;line-height:1.6;">${poruka}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td bgcolor="#0D2B52" style="border-radius:6px;">
                  <a href="${magicLink}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Izmijeni prijavu →</a>
                </td></tr></table>
                <p style="margin:16px 0 0;font-size:12px;color:#888;text-align:center;">Ako gumb ne radi, otvorite ovaj link:<br><a href="${magicLink}" style="color:#1B6CA8;word-break:break-all;">${magicLink}</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center;">
                Link je aktivan 7 dana. Nakon isteka kontaktirajte referadu.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
              <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function emailPrihvaceno({ ime, prezime, brojPrijave, studij, akademskaGodina, studyLevel }) {
  const isDiplomski = studyLevel === "diplomski";

  const subjectLine = isDiplomski ? `Prijava prihvaćena — ${brojPrijave}` : `Upis potvrđen — ${brojPrijave}`;
  const headline = isDiplomski ? "Prijava prihvaćena ✓" : "Upisani ste ✓";

  const bodyBlock = isDiplomski
    ? `
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                S radošću Vam javljamo da je Vaša prijava za upis na <strong>${studij}</strong> za akademsku godinu <strong>${akademskaGodina}</strong> <strong style="color:#2E7D32;">prihvaćena</strong>.
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
                Broj prijave: <strong style="font-family:monospace;">${brojPrijave}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Vaša prijava sada ulazi u <strong>razredbeni postupak</strong>. Nakon objave rang-liste obavijestit ćemo Vas o daljnjim koracima. Ako ostvarite pravo na upis, zaprimit ćete zaseban e-mail s poveznicom za online upis.
              </p>
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                Za dodatne informacije obratite se referadi na
                <a href="mailto:referada.diplomski@pfst.hr" style="color:#1B6CA8;">referada.diplomski@pfst.hr</a>.
              </p>`
    : `
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Obavještavamo Vas da je studentska referada pregledala vašu prijavu i potvrdila upis.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Službeno ste upisani na <strong style="color:#2E7D32;">${studij}</strong> u akademskoj godini <strong>${akademskaGodina}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;font-weight:600;">
                Dobrodošli na Pomorski fakultet u Splitu!
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                O datumu početka nastave i terminima preuzimanja studentskih iskaznica (X-ica) obavijestit ćemo Vas naknadno putem web stranice Fakulteta
                (<a href="https://www.pfst.unist.hr" style="color:#1B6CA8;">www.pfst.unist.hr</a>).
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Ukoliko su Vam potrebne potvrde o upisu, iste možete zatražiti putem maila
                <a href="mailto:upisi@pfst.hr" style="color:#1B6CA8;">upisi@pfst.hr</a> do ${POTVRDA_ROK}.
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5;border-top:1px solid #E0E0E0;padding-top:12px;">
                Broj prijave: <strong style="font-family:monospace;">${brojPrijave}</strong>
              </p>`;

  return {
    subject: subjectLine,
    html: `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B5E20,#2E7D32);padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">${headline}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
              <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function emailOdbijeno({ ime, prezime, brojPrijave, studij, akademskaGodina }) {
  return {
    subject: `Obavijest o statusu prijave — ${brojPrijave}`,
    html: `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#37474F,#546E7A);padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Obavijest o prijavi</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Obavještavamo Vas da Vaša prijava za upis na <strong>${studij}</strong> za akademsku godinu <strong>${akademskaGodina}</strong> nije prihvaćena.
              </p>
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                Za dodatne informacije obratite se referadi fakulteta.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
              <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export function emailUObradi({ ime, prezime, brojPrijave, studij, akademskaGodina }) {
  return {
    subject: `Prijava u obradi — ${brojPrijave}`,
    html: `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#E65100,#FB8C00);padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pomorski fakultet u Splitu</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Prijava u obradi</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Obavještavamo Vas da je Vaša prijava za upis na <strong>${studij}</strong> za akademsku godinu <strong>${akademskaGodina}</strong> trenutno u obradi.
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
                Broj prijave: <strong style="font-family:monospace;">${brojPrijave}</strong>
              </p>
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                O ishodu obrade bit ćete obaviješteni putem e-pošte.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:24px 40px;border-top:1px solid #E0E0E0;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Pomorski fakultet u Splitu</p>
              <p style="margin:0;font-size:13px;color:#888;">Ruđera Boškovića 37, 21000 Split</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}
