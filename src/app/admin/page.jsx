import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Image from "next/image";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin/moje-prijave");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f385c 0%, #1a5276 50%, #058cc4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Image
            src="/logo.svg"
            alt="Pomorski fakultet u Splitu"
            width={200}
            height={50}
            style={{ filter: "brightness(0) invert(1)", width: "auto", height: 44, margin: "0 auto" }}
          />
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", mt: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Administratorski pristup
          </Typography>
        </Box>

        {/* Card */}
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, textAlign: "center", fontWeight: 700, color: "var(--blue-dark)" }}>
            Prijava
          </Typography>
          <AdminLoginForm />
        </Paper>
      </Container>
    </Box>
  );
}
