import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import EnrollmentPDF from "@/components/admin/EnrollmentPDF";
import { getProgramLabel, studyTypes } from "@/lib/applications/config";
import { canAccessIntake } from "@/lib/admin/permissions";

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select(
      `*,
      applications ( id, first_name, last_name, oib, email, phone, application_number, program, study_type, application_documents ( * ) ),
      intakes ( title, academic_year )`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !enrollment) {
    return new NextResponse("Enrollment not found", { status: 404 });
  }

  const hasAccess = await canAccessIntake(enrollment.intake_id);
  if (!hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const application = enrollment.applications;
  const programLabel = getProgramLabel(application?.program);
  const studyTypeLabel = studyTypes.find((t) => t.value === application?.study_type)?.label || application?.study_type;

  // Dohvati signed URL za fotografiju — fotografija je vezana uz aplikaciju,
  // ne uz upis (isti pattern kao u /api/applications/[id]/pdf/route.js).
  let photoUrl = null;
  const photoDoc = application?.application_documents?.find((d) => d.document_type === "photo");
  if (photoDoc) {
    const { data: signedData } = await supabase.storage.from("application-documents").createSignedUrl(photoDoc.file_path, 60); // 60 sekundi — dovoljno za generiranje PDF-a
    photoUrl = signedData?.signedUrl || null;
  }

  const stream = await renderToStream(<EnrollmentPDF enrollment={enrollment} programLabel={programLabel} studyTypeLabel={studyTypeLabel} photoUrl={photoUrl} />);

  const fileName = `Upisni_list_${application?.application_number}.pdf`;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
