import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import ApplicationPDF from "@/components/admin/ApplicationPDF";
import { getProgramLabel, studyTypes } from "@/lib/applications/config";

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .select(`*, intakes ( title, academic_year, slug, form_type, diplomski_period_from, diplomski_period_to ), application_documents ( * )`)
    .eq("id", id)
    .single();

  if (error || !application) {
    return new NextResponse("Application not found", { status: 404 });
  }

  const isPrijavaD = application.intakes?.form_type === "prijava_d";
  const programLabel = getProgramLabel(application.program);
  const studyTypeLabel = studyTypes.find((t) => t.value === application.study_type)?.label || application.study_type;

  // Dohvati signed URL za fotografiju — diplomski (prijava_d) obrazac ne prikuplja fotografiju
  let photoUrl = null;
  if (!isPrijavaD) {
    const photoDoc = application.application_documents?.find((d) => d.document_type === "photo");
    if (photoDoc) {
      const { data: signedData } = await supabase.storage.from("application-documents").createSignedUrl(photoDoc.file_path, 60); // 60 sekundi — dovoljno za generiranje PDF-a
      photoUrl = signedData?.signedUrl || null;
    }
  }

  const stream = await renderToStream(
    <ApplicationPDF application={application} programLabel={programLabel} studyTypeLabel={studyTypeLabel} photoUrl={photoUrl} />,
  );

  const fileName = isPrijavaD ? `Prijava_${application.application_number}.pdf` : `Upisni_list_${application.application_number}.pdf`;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
