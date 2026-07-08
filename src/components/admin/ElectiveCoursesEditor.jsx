"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { studyPrograms } from "@/lib/applications/config";

const PROGRAMS_D = studyPrograms.diplomski;

function EditableCell({ value, onChange, type = "text", width, placeholder }) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      size="small"
      type={type}
      placeholder={placeholder}
      variant="standard"
      slotProps={{
        input: {
          disableUnderline: false,
          sx: { fontSize: "0.82rem" },
        },
      }}
      sx={{ width: width || "100%" }}
    />
  );
}

export default function ElectiveCoursesEditor({ courses, requirements, onChange, onRequirementsChange }) {
  const [activeTab, setActiveTab] = useState(PROGRAMS_D[0].value);

  const programCourses = courses.filter((c) => c.program === activeTab);
  const globalIndexOf = (program, localIdx) => {
    let count = 0;
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].program === program) {
        if (count === localIdx) return i;
        count++;
      }
    }
    return -1;
  };

  const addRow = () => {
    onChange([
      ...courses,
      {
        program: activeTab,
        semester: 1,
        name: "",
        instructor: "",
        credits: 0,
        sort_order: programCourses.length,
      },
    ]);
  };

  const updateRow = (localIdx, field, value) => {
    const globalIdx = globalIndexOf(activeTab, localIdx);
    const updated = [...courses];
    updated[globalIdx] = { ...updated[globalIdx], [field]: value };
    onChange(updated);
  };

  const removeRow = (localIdx) => {
    const globalIdx = globalIndexOf(activeTab, localIdx);
    onChange(courses.filter((_, i) => i !== globalIdx));
  };

  const duplicateRow = (localIdx) => {
    const globalIdx = globalIndexOf(activeTab, localIdx);
    const copy = { ...courses[globalIdx], name: courses[globalIdx].name + " (kopija)" };
    const updated = [...courses];
    updated.splice(globalIdx + 1, 0, copy);
    onChange(updated);
  };

  const getReq = (semester) => requirements.find((r) => r.program === activeTab && r.semester === semester)?.min_credits || 0;

  const setReq = (semester, value) => {
    const updated = requirements.filter((r) => !(r.program === activeTab && r.semester === semester));
    onRequirementsChange([...updated, { program: activeTab, semester, min_credits: Number(value) }]);
  };

  const s1Count = programCourses.filter((c) => c.semester === 1).length;
  const s2Count = programCourses.filter((c) => c.semester === 2).length;

  return (
    <Box>
      {/* Program tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 0, borderBottom: "1px solid var(--gray-200)" }}>
        {PROGRAMS_D.map((p) => {
          const count = courses.filter((c) => c.program === p.value).length;
          return (
            <Tab
              key={p.value}
              value={p.value}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span>{p.value.toUpperCase()}</span>
                  {count > 0 && <Chip label={count} size="small" sx={{ height: 16, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.75 } }} />}
                </Box>
              }
              sx={{ minHeight: 40, py: 1 }}
            />
          );
        })}
      </Tabs>

      {/* Min bodovi */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", px: 1, py: 1.5, background: "var(--blue-pale)", borderRadius: "0 0 8px 8px", mb: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--blue-dark)", mr: 1, whiteSpace: "nowrap" }}>
          Min. bodova:
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            1. sem.
          </Typography>
          <TextField
            value={getReq(1)}
            onChange={(e) => setReq(1, e.target.value)}
            type="number"
            size="small"
            variant="outlined"
            sx={{ width: 72 }}
            slotProps={{ input: { sx: { fontSize: "0.82rem", py: 0.4 } } }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            2. sem.
          </Typography>
          <TextField
            value={getReq(2)}
            onChange={(e) => setReq(2, e.target.value)}
            type="number"
            size="small"
            variant="outlined"
            sx={{ width: 72 }}
            slotProps={{ input: { sx: { fontSize: "0.82rem", py: 0.4 } } }}
          />
        </Box>
        <Box sx={{ ml: "auto", display: "flex", gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {s1Count} predmeta u 1. sem. · {s2Count} u 2. sem.
          </Typography>
        </Box>
      </Box>

      {/* Tablica */}
      <Box sx={{ border: "1px solid var(--gray-200)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        <Table size="small" sx={{ "& td, & th": { py: 0.75, px: 1.25 } }}>
          <TableHead>
            <TableRow sx={{ background: "var(--gray-50)" }}>
              <TableCell sx={{ width: 90, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-500)" }}>Semestar</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-500)" }}>Naziv predmeta</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-500)" }}>Nositelj</TableCell>
              <TableCell sx={{ width: 80, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-500)", textAlign: "center" }}>Bodovi</TableCell>
              <TableCell sx={{ width: 72 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {programCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary", fontSize: "0.82rem" }}>
                  Nema predmeta. Dodajte ih gumbom ispod.
                </TableCell>
              </TableRow>
            ) : (
              programCourses.map((course, localIdx) => (
                <TableRow
                  key={localIdx}
                  sx={{
                    "&:hover": { background: "var(--blue-pale)" },
                    background: course.semester === 1 ? "transparent" : "rgba(5,140,196,0.02)",
                    borderLeft: `3px solid ${course.semester === 1 ? "var(--blue-main)" : "var(--blue-light)"}`,
                  }}
                >
                  <TableCell>
                    <Select
                      value={course.semester}
                      onChange={(e) => updateRow(localIdx, "semester", Number(e.target.value))}
                      size="small"
                      variant="standard"
                      disableUnderline={false}
                      sx={{ fontSize: "0.82rem", minWidth: 70 }}
                    >
                      <MenuItem value={1}>1. sem.</MenuItem>
                      <MenuItem value={2}>2. sem.</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <EditableCell value={course.name} onChange={(v) => updateRow(localIdx, "name", v)} placeholder="Naziv predmeta" />
                  </TableCell>
                  <TableCell>
                    <EditableCell value={course.instructor || ""} onChange={(v) => updateRow(localIdx, "instructor", v)} placeholder="Nositelj" />
                  </TableCell>
                  <TableCell align="center">
                    <EditableCell value={course.credits} onChange={(v) => updateRow(localIdx, "credits", v)} type="number" width={56} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex" }}>
                      <Tooltip title="Dupliciraj">
                        <IconButton size="small" onClick={() => duplicateRow(localIdx)} sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Obriši">
                        <IconButton size="small" color="error" onClick={() => removeRow(localIdx)} sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid var(--gray-100)" }}>
          <Button startIcon={<AddIcon />} onClick={addRow} size="small" sx={{ fontSize: "0.78rem", color: "var(--blue-main)", fontWeight: 600 }}>
            Dodaj predmet ({activeTab.toUpperCase()})
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
