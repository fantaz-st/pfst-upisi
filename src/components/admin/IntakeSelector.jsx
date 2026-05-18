"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";

export default function IntakeSelector({ intakes, selected }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("intake", value);
    else params.delete("intake");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel>Upis</InputLabel>
      <Select
        value={selected}
        label="Upis"
        onChange={e => handleChange(e.target.value)}
        sx={{ borderRadius: 2, background: "white" }}
        renderValue={(val) => {
          if (!val) return "Svi upisi";
          const intake = intakes.find(i => i.id === val);
          if (!intake) return "Svi upisi";
          return (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {intake.title} · {intake.academic_year}
              {intake.is_open && (
                <Chip label="Otvoreno" size="small" color="success"
                  sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
              )}
            </span>
          );
        }}
      >
        <MenuItem value="">Svi upisi</MenuItem>
        {intakes.map(intake => (
          <MenuItem key={intake.id} value={intake.id}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <span style={{ flex: 1 }}>{intake.title} · {intake.academic_year}</span>
              {intake.is_open && (
                <Chip label="Otvoreno" size="small" color="success"
                  sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
              )}
            </span>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
