import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { applicationStatuses, getProgramLabel, studyTypes } from "@/lib/applications/config";
import "./print.css";

export default async function ApplicationPrintPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .select(`
      *,
      intakes ( title, academic_year, slug )
    `)
    .eq("id", id)
    .single();

  if (error || !application) notFound();

  const statusConfig = applicationStatuses[application.status] ?? { label: application.status };
  const programLabel = getProgramLabel(application.program);
  const studyTypeLabel = studyTypes.find(t => t.value === application.study_type)?.label || application.study_type;

  return (
    <html lang="hr">
      <head>
        <meta charSet="utf-8" />
        <title>Upisni list - {application.application_number}</title>
      </head>
      <body>
        <div className="print-container">
          {/* Header */}
          <div className="print-header">
            <div className="logo-section">
              <h1>POMORSKI FAKULTET U SPLITU</h1>
              <p>Sveučilište u Splitu</p>
            </div>
            <div className="doc-type">
              <h2>UPISNI LIST</h2>
            </div>
          </div>

          {/* Application Info */}
          <div className="app-info-bar">
            <div className="info-item">
              <span className="label">Broj prijave:</span>
              <span className="value">{application.application_number}</span>
            </div>
            <div className="info-item">
              <span className="label">Datum prijave:</span>
              <span className="value">{new Date(application.created_at).toLocaleDateString("hr-HR")}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value status">{statusConfig.label}</span>
            </div>
          </div>

          {/* Applicant Details */}
          <div className="section">
            <h3>PODACI O KANDIDATU</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <td className="label-cell">Ime i prezime:</td>
                  <td className="value-cell"><strong>{application.first_name} {application.last_name}</strong></td>
                </tr>
                <tr>
                  <td className="label-cell">OIB:</td>
                  <td className="value-cell">{application.oib}</td>
                </tr>
                <tr>
                  <td className="label-cell">Datum rođenja:</td>
                  <td className="value-cell">{application.birth_date ? new Date(application.birth_date).toLocaleDateString("hr-HR") : "—"}</td>
                </tr>
                <tr>
                  <td className="label-cell">Državljanstvo:</td>
                  <td className="value-cell">{application.citizenship}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Contact Info */}
          <div className="section">
            <h3>KONTAKT PODACI</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <td className="label-cell">Email adresa:</td>
                  <td className="value-cell">{application.email}</td>
                </tr>
                <tr>
                  <td className="label-cell">Mobitel:</td>
                  <td className="value-cell">{application.phone || "—"}</td>
                </tr>
                <tr>
                  <td className="label-cell">Adresa:</td>
                  <td className="value-cell">{application.address}</td>
                </tr>
                <tr>
                  <td className="label-cell">Grad:</td>
                  <td className="value-cell">{application.postal_code} {application.city}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Study Info */}
          <div className="section">
            <h3>PODACI O UPISU</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <td className="label-cell">Vrsta upisa:</td>
                  <td className="value-cell"><strong>{application.intakes?.title}</strong></td>
                </tr>
                <tr>
                  <td className="label-cell">Akademska godina:</td>
                  <td className="value-cell">{application.intakes?.academic_year}</td>
                </tr>
                <tr>
                  <td className="label-cell">Studij:</td>
                  <td className="value-cell"><strong>{programLabel}</strong></td>
                </tr>
                <tr>
                  <td className="label-cell">Vrsta studiranja:</td>
                  <td className="value-cell">{studyTypeLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Previous Education */}
          <div className="section">
            <h3>PRETHODNO OBRAZOVANJE</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <td className="label-cell">Ustanova:</td>
                  <td className="value-cell">{application.previous_institution || "—"}</td>
                </tr>
                <tr>
                  <td className="label-cell">Program / smjer:</td>
                  <td className="value-cell">{application.previous_program || "—"}</td>
                </tr>
                <tr>
                  <td className="label-cell">Godina završetka:</td>
                  <td className="value-cell">{application.previous_completion_year || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="print-footer">
            <div className="signature-section">
              <div className="signature-line">
                <span>Datum ispisa: {new Date().toLocaleDateString("hr-HR")}</span>
              </div>
            </div>
            <div className="page-number">
              Stranica 1 od 1
            </div>
          </div>

          {/* Auto-print script */}
          <script dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
            `
          }} />
        </div>
      </body>
    </html>
  );
}
