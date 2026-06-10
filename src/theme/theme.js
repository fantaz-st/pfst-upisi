import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#058cc4",
      light: "#4aaed9",
      dark: "#0f385c",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1a5276",
      light: "#2e7da8",
      dark: "#0f385c",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
    },
    error: {
      main: "#ef4444",
    },
    info: {
      main: "#058cc4",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
    h1: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
    },
    h6: {
      fontFamily: "var(--font-display), Merriweather, Georgia, serif",
      fontWeight: 700,
    },
    body1: {
      fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      fontSize: "1rem",
      lineHeight: 1.65,
    },
    body2: {
      fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      fontSize: "0.875rem",
      lineHeight: 1.55,
    },
    button: {
      fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      fontWeight: 600,
      letterSpacing: "0.01em",
      textTransform: "none",
      fontSize: "0.9rem",
    },
    caption: {
      fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      fontSize: "0.75rem",
    },
    overline: {
      fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      fontWeight: 700,
      letterSpacing: "0.1em",
      fontSize: "0.7rem",
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    // U temi — UKLONI outlined override:
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "100px",
          fontWeight: 700,
          textTransform: "none",
          padding: "12px 32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          transition: "all 0.25s ease",
        },
        contained: {
          background: "linear-gradient(135deg, #0B3C5D 0%, #145DA0 100%)",
          color: "#fff",
          "&:hover": {
            background: "linear-gradient(135deg, #082c45 0%, #114c85 100%)",
            boxShadow: "0 8px 28px rgba(11,60,93,0.35)",
            transform: "translateY(-1px)",
          },
        },
        // ← OBRIŠI cijeli outlined blok
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            background: "white",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#058cc4",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#058cc4",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#058cc4",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        outlined: {
          borderColor: "#e2e8f0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
          borderRadius: 6,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            backgroundColor: "#f8fafc",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#f1f5f9",
          padding: "14px 16px",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
  },
});

export default theme;
