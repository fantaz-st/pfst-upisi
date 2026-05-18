"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ListIcon from "@mui/icons-material/List";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DRAWER_WIDTH = 260;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data } = await supabase.from("admin_roles").select("role").eq("user_id", user.id).single();
        setIsSuperAdmin(data?.role === "super_admin");
      }
    }
    checkRole();
  }, []);

  const allMenuItems = [
    { label: "Moje prijave", href: "/admin/moje-prijave", icon: AssignmentIcon, hideForSuper: true },
    { label: "Sve prijave", href: "/admin/sve-prijave", icon: ListIcon },
    { label: "Izbrisane prijave", href: "/admin/izbrisane-prijave", icon: ListIcon },
    { label: "Upravljanje upisima", href: "/admin/upisi", icon: SchoolIcon },
    { label: "Korisnici", href: "/admin/korisnici", icon: PeopleIcon, superAdminOnly: true },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.hideForSuper && isSuperAdmin) return false;
    return true;
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          background: "#0f385c",
          borderRight: "none",
          boxShadow: "4px 0 24px rgba(15,56,92,0.15)",
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Image src="/logo.svg" alt="Pomorski fakultet u Splitu" width={160} height={40} style={{ filter: "brightness(0) invert(1)", width: "auto", height: 38 }} />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

      {/* Menu */}
      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                mb: 0.5,
                borderRadius: "10px",
                py: 1.25,
                px: 1.5,
                backgroundColor: isActive ? "rgba(5,140,196,0.15)" : "transparent",
                "&:hover": {
                  backgroundColor: isActive ? "rgba(5,140,196,0.2)" : "rgba(255,255,255,0.06)",
                },
                transition: "background-color 0.15s",
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon
                  sx={{
                    fontSize: 18,
                    color: isActive ? "#4aaed9" : "rgba(255,255,255,0.45)",
                    transition: "color 0.15s",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                      transition: "color 0.15s",
                    },
                  },
                }}
              />
              {isActive && (
                <Box
                  sx={{
                    width: 3,
                    height: 20,
                    borderRadius: 2,
                    background: "#058cc4",
                    flexShrink: 0,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* User + Logout */}
      <Box sx={{ p: 2 }}>
        {userEmail && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              mb: 1,
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", mb: 0.25, letterSpacing: "0.05em", textTransform: "uppercase" }}>Prijavljen kao</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, wordBreak: "break-all" }}>{userEmail}</Typography>
          </Box>
        )}

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "10px",
            py: 1.25,
            px: 1.5,
            "&:hover": { background: "rgba(255,255,255,0.06)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }} />
          </ListItemIcon>
          <ListItemText
            primary="Odjava"
            slotProps={{
              primary: {
                sx: { fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
