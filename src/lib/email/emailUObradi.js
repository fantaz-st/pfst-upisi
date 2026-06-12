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
