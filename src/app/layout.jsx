import "./globals.css";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { Inter, Merriweather } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Upisi — Pomorski fakultet Split",
  description: "Sustav prijava za upis na Pomorski fakultet u Splitu",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hr" className={`${inter.variable} ${merriweather.variable}`}>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
