"use client";

import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";

const RANGES = {
  "24h": { label: "Zadnja 24 sata", hours: 24, bucket: "hour" },
  "48h": { label: "Zadnjih 48 sati", hours: 48, bucket: "hour" },
  "7d":  { label: "Zadnjih 7 dana",  hours: 24 * 7,  bucket: "day" },
  "30d": { label: "Zadnjih 30 dana", hours: 24 * 30, bucket: "day" },
};

function buildBuckets(timestamps, rangeKey) {
  const { hours, bucket } = RANGES[rangeKey];
  const now = new Date();
  const buckets = [];

  if (bucket === "hour") {
    // Satni bucketi — od punog sata
    const end = new Date(now);
    end.setMinutes(0, 0, 0);
    for (let i = hours - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 3600_000);
      buckets.push({
        key: d.getTime(),
        label: d.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }),
        count: 0,
      });
    }
    const startMs = buckets[0].key;
    for (const ts of timestamps) {
      const t = new Date(ts).getTime();
      if (t < startMs) continue;
      const idx = Math.floor((t - startMs) / 3600_000);
      if (idx >= 0 && idx < buckets.length) buckets[idx].count++;
    }
  } else {
    // Dnevni bucketi
    const days = hours / 24;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit" }),
        count: 0,
      });
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    for (const ts of timestamps) {
      const day = ts?.slice(0, 10);
      if (byKey[day]) byKey[day].count++;
    }
  }

  return buckets;
}

export default function ApplicationsTrendChart({ timestamps = [] }) {
  const [range, setRange] = useState("30d");

  const data = useMemo(() => buildBuckets(timestamps, range), [timestamps, range]);
  const hasData = data.some((d) => d.count > 0);

  // Na satnim prikazima prorijedi labele (svaki 3./6. sat)
  const tickInterval = range === "24h" ? 2 : range === "48h" ? 5 : "preserveStartEnd";

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          size="small"
          sx={{ fontSize: "0.78rem", height: 32, "& .MuiSelect-select": { py: 0.5 } }}
        >
          {Object.entries(RANGES).map(([key, cfg]) => (
            <MenuItem key={key} value={key} sx={{ fontSize: "0.82rem" }}>
              {cfg.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#058cc4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#058cc4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E5E9EF", fontSize: 12 }}
              labelStyle={{ fontWeight: 600, color: "#0f385c" }}
            />
            <Area type="monotone" dataKey="count" name="Prijave" stroke="#058cc4" strokeWidth={2} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary", fontSize: "0.85rem" }}>
          Nema prijava u odabranom razdoblju.
        </Box>
      )}
    </Box>
  );
}
