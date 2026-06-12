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
            <td style="background:linear-gradient(135deg,#0D2B52,#1B6CA8);padding:40px;text-align:center;">
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
            <td style="background:linear-gradient(135deg,#0D2B52,#1B6CA8);padding:40px;text-align:center;">
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
                    <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#0D2B52,#1B6CA8);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
                      Izmijeni prijavu →
                    </a>
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

export function emailPrihvaceno({ ime, prezime, brojPrijave, studij, akademskaGodina }) {
  return {
    subject: `Prijava prihvaćena — ${brojPrijave}`,
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
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Prijava prihvaćena ✓</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                S radošću Vam javljamo da je Vaša prijava za upis na <strong>${studij}</strong> za akademsku godinu <strong>${akademskaGodina}</strong> <strong style="color:#2E7D32;">prihvaćena</strong>.
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
                Broj prijave: <strong style="font-family:monospace;">${brojPrijave}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Za daljnje informacije o upisu obratite se referadi fakulteta.
              </p>
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                Ukoliko Vam treba potvrda o upisu možete je zatražiti na mail
                <a href="mailto:referada.prijediplomski@pfst.hr" style="color:#1B6CA8;">referada.prijediplomski@pfst.hr</a>.
                Naznačite svrhu potvrde.
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
