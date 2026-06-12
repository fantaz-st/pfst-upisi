"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const DRAWER_WIDTH = 270;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [myIntakes, setMyIntakes] = useState([]);
  const [myPrijaveOpen, setMyPrijaveOpen] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email);

      const { data: roleData } = await supabase.from("admin_roles").select("role").eq("user_id", user.id).single();

      const superAdmin = roleData?.role === "super_admin";
      setIsSuperAdmin(superAdmin);

      if (!superAdmin) {
        // Dohvati intakes za ovog admina
        const { data: intakeData } = await supabase.from("intake_admins").select("intake_id, intakes ( id, title, academic_year, slug, is_open )").eq("user_id", user.id);

        setMyIntakes(intakeData?.map((d) => d.intakes).filter(Boolean) || []);
      }
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const navItemSx = (active) => ({
    mb: 0.25,
    borderRadius: "10px",
    py: 1.1,
    px: 1.5,
    backgroundColor: active ? "rgba(5,140,196,0.15)" : "transparent",
    "&:hover": { backgroundColor: active ? "rgba(5,140,196,0.2)" : "rgba(255,255,255,0.06)" },
    transition: "background-color 0.15s",
  });

  const iconSx = (active) => ({
    fontSize: 18,
    color: active ? "#4aaed9" : "rgba(255,255,255,0.45)",
    transition: "color 0.15s",
  });

  const textSx = (active) => ({
    fontSize: "0.875rem",
    fontWeight: active ? 600 : 400,
    color: active ? "#fff" : "rgba(255,255,255,0.65)",
  });

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
        <Image src="/logo.svg" alt="Pomorski fakultet" width={160} height={75} style={{ filter: "brightness(0) invert(1)" }} loading="eager" />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {/* Početna */}
        {(() => {
          const active = isActive("/admin/pocetna");
          return (
            <ListItemButton component={Link} href="/admin/pocetna" sx={navItemSx(active)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DashboardIcon sx={iconSx(active)} />
              </ListItemIcon>
              <ListItemText primary="Početna" slotProps={{ primary: { sx: textSx(active) } }} />
              {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, background: "#058cc4" }} />}
            </ListItemButton>
          );
        })()}

        {/* Moje prijave — dropdown za regular admin */}
        {!isSuperAdmin && (
          <>
            <ListItemButton onClick={() => setMyPrijaveOpen((p) => !p)} sx={navItemSx(pathname.startsWith("/admin/moje-prijave"))}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AssignmentIcon sx={iconSx(pathname.startsWith("/admin/moje-prijave"))} />
              </ListItemIcon>
              <ListItemText primary="Moje prijave" slotProps={{ primary: { sx: textSx(pathname.startsWith("/admin/moje-prijave")) } }} />
              {myPrijaveOpen ? <ExpandLessIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />}
            </ListItemButton>

            <Collapse in={myPrijaveOpen} timeout="auto">
              <List disablePadding sx={{ pl: 1 }}>
                {myIntakes.length === 0 ? (
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Nije dodijeljen upis</Typography>
                  </Box>
                ) : (
                  myIntakes.map((intake) => {
                    const href = `/admin/moje-prijave/${intake.id}`;
                    const active = pathname === href;
                    return (
                      <ListItemButton
                        key={intake.id}
                        component={Link}
                        href={href}
                        sx={{
                          ...navItemSx(active),
                          py: 0.9,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 7, color: active ? "#4aaed9" : "rgba(255,255,255,0.3)" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${intake.title} · ${intake.academic_year}`}
                          slotProps={{
                            primary: {
                              sx: {
                                fontSize: "0.8rem",
                                fontWeight: active ? 600 : 400,
                                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                                lineHeight: 1.3,
                              },
                            },
                          }}
                        />
                        {intake.is_open && (
                          <Chip label="●" size="small" sx={{ height: 14, width: 14, minWidth: 14, background: "#10b981", "& .MuiChip-label": { p: 0, fontSize: 8 } }} />
                        )}
                      </ListItemButton>
                    );
                  })
                )}
              </List>
            </Collapse>
          </>
        )}

        {/* Sve prijave */}
        {(() => {
          const active = isActive("/admin/sve-prijave");
          return (
            <ListItemButton component={Link} href="/admin/sve-prijave" sx={navItemSx(active)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ListIcon sx={iconSx(active)} />
              </ListItemIcon>
              <ListItemText primary="Sve prijave" slotProps={{ primary: { sx: textSx(active) } }} />
              {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, background: "#058cc4" }} />}
            </ListItemButton>
          );
        })()}

        {/* Upravljanje upisima */}
        {(() => {
          const active = isActive("/admin/upisi");
          return (
            <ListItemButton component={Link} href="/admin/upisi" sx={navItemSx(active)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SchoolIcon sx={iconSx(active)} />
              </ListItemIcon>
              <ListItemText primary="Upravljanje upisima" slotProps={{ primary: { sx: textSx(active) } }} />
              {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, background: "#058cc4" }} />}
            </ListItemButton>
          );
        })()}

        {/* Super admin only */}
        {isSuperAdmin && (
          <>
            {(() => {
              const active = isActive("/admin/korisnici");
              return (
                <ListItemButton component={Link} href="/admin/korisnici" sx={navItemSx(active)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PeopleIcon sx={iconSx(active)} />
                  </ListItemIcon>
                  <ListItemText primary="Korisnici" slotProps={{ primary: { sx: textSx(active) } }} />
                  {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, background: "#058cc4" }} />}
                </ListItemButton>
              );
            })()}
            {(() => {
              const active = isActive("/admin/otpad");
              return (
                <ListItemButton component={Link} href="/admin/otpad" sx={navItemSx(active)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DeleteIcon sx={iconSx(active)} />
                  </ListItemIcon>
                  <ListItemText primary="Obrisane prijave" slotProps={{ primary: { sx: textSx(active) } }} />
                  {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, background: "#058cc4" }} />}
                </ListItemButton>
              );
            })()}
          </>
        )}
      </List>

      {/* User + Logout */}
      <Box sx={{ p: 2 }}>
        {userEmail && (
          <Box sx={{ px: 2, py: 1.5, mb: 1, borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", mb: 0.25, letterSpacing: "0.05em", textTransform: "uppercase" }}>Prijavljen kao</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, wordBreak: "break-all" }}>{userEmail}</Typography>
          </Box>
        )}
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: "10px", py: 1.1, px: 1.5, "&:hover": { background: "rgba(255,255,255,0.06)" } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }} />
          </ListItemIcon>
          <ListItemText primary="Odjava" slotProps={{ primary: { sx: { fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" } } }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
