"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

const navLinks = [
  { href: "#upisi", label: "Upisi i prijave" },
  { href: "/status", label: "Provjera statusa" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoLink} aria-label="Pomorski fakultet — naslovna">
          <Image src="/logo.svg" alt="Pomorski fakultet, Sveučilište u Splitu" width={300} height={80} className={styles.logo} priority />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger (mobile) */}
        <button
          className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Zatvori izbornik" : "Otvori izbornik"}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
