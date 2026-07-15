import { createClient } from "@/lib/supabase/server";
import Box from "@mui/material/Box";
import ThemeRegistry from "@/theme/ThemeRegistry";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Admin — Pomorski fakultet",
};

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, render just the children (login page)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F7FA" }}>
      <AdminNav user={user} />
      <Box component="main" sx={{ flex: 1, overflow: "auto", pt: { xs: "56px", md: 0 }, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
