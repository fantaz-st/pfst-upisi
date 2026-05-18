import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import ApplicationPDF from '@/components/admin/ApplicationPDF';
import { applicationStatuses, getProgramLabel, studyTypes } from '@/lib/applications/config';

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch application data
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      intakes ( title, academic_year, slug )
    `)
    .eq('id', id)
    .single();

  if (error || !application) {
    return new NextResponse('Application not found', { status: 404 });
  }

  // Get labels
  const statusLabel = applicationStatuses[application.status]?.label || application.status;
  const programLabel = getProgramLabel(application.program);
  const studyTypeLabel = studyTypes.find(t => t.value === application.study_type)?.label || application.study_type;

  // Generate PDF
  const stream = await renderToStream(
    <ApplicationPDF 
      application={application}
      programLabel={programLabel}
      studyTypeLabel={studyTypeLabel}
      statusLabel={statusLabel}
    />
  );

  // Return PDF as download
  const fileName = `Upisni_list_${application.application_number}.pdf`;
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
