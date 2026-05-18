"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { deleteAdmin } from "@/lib/admin/actions";
import EditAdminModal from "./EditAdminModal";
import styles from "@/app/admin/admin.module.css";

export default function AdminList({ admins }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setEditOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError(null);
    const result = await deleteAdmin(selectedAdmin.user_id);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setDeleteOpen(false);
      setLoading(false);
      router.refresh();
    }
  };

  const getRoleLabel = (role) => role === "super_admin" ? "Super Administrator" : "Administrator";
  const getRoleColor = (role) => role === "super_admin" ? "error" : "primary";

  return (
    <>
      <div className={styles.tableCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Razina pristupa</TableCell>
                <TableCell>Datum kreiranja</TableCell>
                <TableCell align="right">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!admins?.length ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Nema administratora.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <span className={styles.nameCell}>{admin.email || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Chip label={getRoleLabel(admin.role)} color={getRoleColor(admin.role)} size="small" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <span className={styles.secondaryText}>{new Date(admin.created_at).toLocaleDateString("hr-HR")}</span>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClick(admin)}
                          sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                        >
                          Uredi
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(admin)}
                          sx={{ borderRadius: "100px", fontSize: "0.75rem" }}
                        >
                          Obriši
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Edit Modal */}
      {selectedAdmin && (
        <EditAdminModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          admin={selectedAdmin}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Brisanje administratora</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body1" sx={{ mb: 2 }}>Jeste li sigurni da želite obrisati administratora?</Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {selectedAdmin?.email || "—"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={loading}>Odustani</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Obriši"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
