"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Pogrešan email ili lozinka.");
      setLoading(false);
      return;
    }

    router.push("/admin/moje-prijave");
    router.refresh();
  };

  return (
    <Box component="form" onSubmit={handleLogin} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required sx={{ mb: 2 }} size="medium" />
      <TextField label="Lozinka" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required sx={{ mb: 3 }} size="medium" />
      <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
        {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Prijavi se"}
      </Button>
    </Box>
  );
}
