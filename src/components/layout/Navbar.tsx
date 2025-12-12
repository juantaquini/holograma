"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { FiMenu, FiX } from "react-icons/fi";

const isMobile = () => window.innerWidth <= 1000;

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { theme, changeTheme } = useColorTheme();
  const pathname = usePathname();

  const isCalm = pathname?.includes("calm");

  const cycleTheme = () => {
    const next =
      theme === "whitesmokeAzul"
        ? "azulMagenta"
        : theme === "azulMagenta"
        ? "marronCeleste"
        : "whitesmokeAzul";
    changeTheme(next);
  };

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobile();
      setIsMobileView(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleMobileLinkClick = () => setMobileMenuOpen(false);

  return (
    <>
      {isMobileView && (
        <div className={styles["navbar-mobile-row"]}>
          <Link
            className={`${styles["navbar-logo-mobile"]} ${
              isCalm ? styles["calm-mode"] : ""
            }`}
            href="/"
          >
            HOLOGRAMA
          </Link>

          <button
            className={`${styles["navbar-hamburger"]} ${
              isCalm ? styles["calm-mode"] : ""
            }`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <FiX size={32} /> : <FiMenu size={28} />}
          </button>
        </div>
      )}

      {!isMobileView && (
        <nav
          className={`${styles["navbar-horizontal-links"]} ${
            isCalm ? styles["calm-mode"] : ""
          }`}
        >
          <Link
            className={`${styles["navbar-logo-text"]} ${
              isCalm ? styles["calm-mode"] : ""
            }`}
            href="/"
          >
            HOLOGRAMA
          </Link>

          <div
            className={`${styles["navbar-links"]} ${
              isCalm ? styles["calm-mode"] : ""
            }`}
          >
            <Link href="/explore">EXPLORE</Link>
            <Link href="/interactives">INTERACTIVES</Link>
            <Link href="/magazine">MAGAZINE</Link>
            <button onClick={cycleTheme}>CHANGE SKIN</button>
            <Link href="/login">LOGIN</Link>
          </div>
        </nav>
      )}

      {isMobileView && mobileMenuOpen && (
        <div
          className={`${styles["navbar-mobile-menu"]} ${
            isCalm ? styles["calm-mode"] : ""
          }`}
        >
          <div className={styles["navbar-mobile-header"]}></div>
          <div className={styles["navbar-mobile-column-links"]}>
            <Link href="/explore" onClick={handleMobileLinkClick}>
              EXPLORE
            </Link>
            <Link href="/interactives" onClick={handleMobileLinkClick}>
              INTERACTIVES
            </Link>
            <Link href="/magazine" onClick={handleMobileLinkClick}>
              MAGAZINE
            </Link>
            <button
              onClick={() => {
                cycleTheme();
                handleMobileLinkClick();
              }}
            >
              CHANGE SKIN
            </button>
            <Link href="/login" onClick={handleMobileLinkClick}>
              LOGIN
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
