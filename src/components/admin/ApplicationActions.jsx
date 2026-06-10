"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditApplicationModal from "./EditApplicationModal";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

export default function ApplicationActions({ application, intakeSlug, intakeStudyLevel }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handlePrint = () => {
    window.open(`/admin/prijave/${application.id}/print`, "_blank");
  };

  const handleDownloadPDF = () => {
    window.open(`/api/applications/${application.id}/pdf`, "_blank");
  };

  return (
    <>
      <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} size="small">
        PDF
      </Button>
      <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)} size="small">
        Uredi
      </Button>
      <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} size="small">
        Obriši
      </Button>

      <EditApplicationModal open={editOpen} onClose={() => setEditOpen(false)} application={application} intakeSlug={intakeSlug} intakeStudyLevel={intakeStudyLevel} />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        applicationId={application.id}
        applicationNumber={application.application_number}
        applicantName={`${application.first_name} ${application.last_name}`}
      />
    </>
  );
}
