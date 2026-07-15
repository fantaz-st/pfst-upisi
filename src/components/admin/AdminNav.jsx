"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import MenuIcon from "@mui/icons-material/Menu";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const DRAWER_WIDTH = 270;

// Tri grupe (foldera) u sidebaru — svaka grupira intake-ove po form_type.
const INTAKE_GROUPS = [
  {
    key: "upis_pd",
    label: "Upisi prijediplomski",
    icon: SchoolIcon,
    aggregateHref: "/admin/upisi-prijediplomski",
  },
  {
    key: "prijava_d",
    label: "Prijave diplomski",
    icon: AssignmentIcon,
    aggregateHref: "/admin/prijave-diplomski",
  },
  {
    key: "upis_d",
    label: "Upisi diplomski",
    icon: SchoolIcon,
    aggregateHref: "/admin/upisi-diplomski",
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [intakes, setIntakes] = useState([]);
  // ID (form_type key) grupe koja je trenutno otvorena; null ako je sve zatvoreno
  const [openGroup, setOpenGroup] = useState(null);
  // Mobile drawer toggle
  const [mobileOpen, setMobileOpen] = useState(false);

  // Zatvori mobile drawer nakon navigacije
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

      if (superAdmin) {
        // Super admin vidi sve intake-e (uključujući zatvorene i nevidljive)
        const { data } = await supabase
          .from("intakes")
          .select("id, title, academic_year, slug, is_open, form_type")
          .order("academic_year", { ascending: false })
          .order("sort_order", { ascending: true });
        setIntakes(data || []);
      } else {
        // Regular admin vidi samo intake-e na koje ima permission preko intake_admins
        const { data } = await supabase
          .from("intake_admins")
          .select("intakes ( id, title, academic_year, slug, is_open, form_type )")
          .eq("user_id", user.id);
        const flat = (data || []).map((d) => d.intakes).filter(Boolean);
        // Sortiraj isto: newest academic year first, pa sort_order
        flat.sort((a, b) => {
          if (b.academic_year !== a.academic_year) return b.academic_year.localeCompare(a.academic_year);
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
        setIntakes(flat);
      }
    }
    loadData();
  }, []);

  // Grupirano po form_type — {upis_pd: [...], prijava_d: [...], upis_d: [...]}
  const grouped = useMemo(() => {
    const g = { upis_pd: [], prijava_d: [], upis_d: [] };
    for (const intake of intakes) {
      if (g[intake.form_type]) g[intake.form_type].push(intake);
    }
    return g;
  }, [intakes]);

  // Auto-otvori grupu koja sadrži aktivan intake (ili čiji aggregate view je otvoren)
  useEffect(() => {
    for (const group of INTAKE_GROUPS) {
      if (pathname.startsWith(group.aggregateHref)) {
        setOpenGroup(group.key);
        return;
      }
      if (pathname.startsWith("/admin/intake/")) {
        const intakeId = pathname.split("/")[3];
        const found = grouped[group.key]?.find((i) => i.id === intakeId);
        if (found) {
          setOpenGroup(group.key);
          return;
        }
      }
    }
  }, [pathname, grouped]);

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

  // Renderiraj jedan intake-folder blok (header + child links)
  const renderIntakeGroup = (group) => {
    const Icon = group.icon;
    const items = grouped[group.key] || [];
    // "Active" znači: aggregate view otvoren, ILI aktivan intake unutar grupe
    const isAggregateActive = isActive(group.aggregateHref);
    const activeIntakeIdInGroup =
      pathname.startsWith("/admin/intake/") &&
      items.some((i) => i.id === pathname.split("/")[3]);
    const groupHighlighted = isAggregateActive || activeIntakeIdInGroup;
    const isOpen = openGroup === group.key;

    return (
      <Box key={group.key}>
        <ListItemButton onClick={() => setOpenGroup(isOpen ? null : group.key)} sx={navItemSx(groupHighlighted)}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Icon sx={iconSx(groupHighlighted)} />
          </ListItemIcon>
          <ListItemText primary={group.label} slotProps={{ primary: { sx: textSx(groupHighlighted) } }} />
          {isOpen ? <ExpandLessIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />}
        </ListItemButton>

        <Collapse in={isOpen} timeout="auto">
          <List disablePadding sx={{ pl: 1 }}>
            {items.length === 0 ? (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Nema upisa</Typography>
              </Box>
            ) : (
              items.map((intake) => {
                const href = `/admin/intake/${intake.id}`;
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <ListItemButton
                    key={intake.id}
                    component={Link}
                    href={href}
                    sx={{ ...navItemSx(active), py: 0.9 }}
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
      </Box>
    );
  };

  const drawerContent = (
    <>
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

        {/* Tri intake grupe */}
        {INTAKE_GROUPS.map(renderIntakeGroup)}

        {/* Upravljanje upisima */}
        {(() => {
          const active = isActive("/admin/upisi");
          return (
            <ListItemButton component={Link} href="/admin/upisi" sx={navItemSx(active)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsIcon sx={iconSx(active)} />
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
          </>
        )}
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
    </>
  );

  const drawerPaperSx = {
    width: DRAWER_WIDTH,
    boxSizing: "border-box",
    background: "#0f385c",
    borderRight: "none",
    boxShadow: "4px 0 24px rgba(15,56,92,0.15)",
  };

  return (
    <>
      {/* Mobile AppBar — samo na xs/sm ekranima; sadrži hamburger + logo */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: "flex", md: "none" },
          background: "#0f385c",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56, px: 2 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            aria-label="Otvori navigaciju"
            sx={{ color: "#fff", mr: 1.5 }}
          >
            <MenuIcon />
          </IconButton>
          <Image
            src="/logo.svg"
            alt="Pomorski fakultet"
            width={110}
            height={40}
            style={{ filter: "brightness(0) invert(1)" }}
            loading="eager"
          />
        </Toolbar>
      </AppBar>

      {/* Temporary drawer — mobile (klizi s lijeva, close na overlay klik) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Permanent drawer — desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
