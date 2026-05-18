"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { applicationStatuses, studyPrograms } from "@/lib/applications/config";

export default function ApplicationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") ?? "";
  const programFilter = searchParams.get("program") ?? "";

  const allPrograms = [...studyPrograms.prijediplomski, ...studyPrograms.diplomski];
  const uniquePrograms = allPrograms.filter((prog, index, self) =>
    index === self.findIndex((p) => p.value === prog.value)
  );

  const handleProgramChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("program", value);
    else params.delete("program");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("status", value);
    else params.delete("status");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Studij</InputLabel>
        <Select value={programFilter} label="Studij" onChange={(e) => handleProgramChange(e.target.value)}
          sx={{ borderRadius: 2, background: "white" }}>
          <MenuItem value="">Svi studiji</MenuItem>
          {uniquePrograms.map((prog) => (
            <MenuItem key={prog.value} value={prog.value}>{prog.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select value={statusFilter} label="Status" onChange={(e) => handleStatusChange(e.target.value)}
          sx={{ borderRadius: 2, background: "white" }}>
          <MenuItem value="">Svi statusi</MenuItem>
          {Object.entries(applicationStatuses).map(([key, config]) => (
            <MenuItem key={key} value={key}>{config.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
