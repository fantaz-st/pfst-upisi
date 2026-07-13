"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import EnrollmentsTable from "@/components/admin/EnrollmentsTable";
import styles from "@/app/admin/admin.module.css";

export default function IntakeTabs({ applications, enrollments, intake }) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: "1px solid var(--gray-200)" }}>
        <Tab label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            Prijave
            <Chip label={applications.length} size="small" sx={{ height: 18, fontSize: "0.68rem" }} />
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            Upisi
            <Chip label={enrollments.length} size="small" sx={{ height: 18, fontSize: "0.68rem" }} />
          </Box>
        } />
      </Tabs>

      {tab === 0 && <ApplicationsTable applications={applications} mode="active" intake={intake} />}
      {tab === 1 && <EnrollmentsTable enrollments={enrollments} />}
    </Box>
  );
}
