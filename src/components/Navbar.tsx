"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // =====================================================
  // CHECK LOGIN STATUS
  // =====================================================

  useEffect(() => {
    const checkLoginStatus = () => {
      // Change "token" if your localStorage key is different
      const token = localStorage.getItem("token");

      setIsLoggedIn(!!token);
    };

    checkLoginStatus();

    // Listen for login/logout changes from other tabs
    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener(
        "storage",
        checkLoginStatus
      );
    };
  }, []);

  // =====================================================
  // SCROLL
  // =====================================================

  useEffect(() => {
    const onScroll = () =>
      setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", onScroll);

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-3 ${
        scrolled
          ? "bg-black/90 backdrop-blur-xl"
          : "bg-black/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto px-6 flex items-center justify-between">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div>

            <span
              className="text-xl font-bold tracking-wider"
              style={{
                background:
                  "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MMC
            </span>

            <p className="text-[10px] text-white/40 tracking-widest uppercase -mt-1">
              Motor Market Connect
            </p>

          </div>
        </Link>

        {/* =================================================
            DESKTOP NAV
        ================================================= */}

        <div className="hidden lg:flex items-center gap-8">

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 tracking-wide relative group"
            >
              {link.label}

              <span
                className="
                  absolute
                  -bottom-0.5
                  left-0
                  w-0
                  h-px
                  bg-gradient-to-r
                  from-[#FAD293]
                  to-[#CEA46B]
                  group-hover:w-full
                  transition-all
                  duration-300
                "
              />
            </Link>
          ))}

        </div>

        {/* =================================================
            DESKTOP RIGHT SIDE
        ================================================= */}

        <div className="hidden lg:flex items-center gap-3">

          {!isLoggedIn ? (
            <>
              {/* LOGIN */}
              <Link
                href="/login"
                className="
                  text-sm
                  text-white/70
                  hover:text-white
                  px-5
                  py-2
                  rounded-full
                  border
                  border-white/10
                  hover:border-[#FAD293]/40
                  transition-all
                  duration-300
                "
              >
                Login
              </Link>

              {/* GET STARTED */}
              <Link
                href="/get-started"
                className="
                  text-sm
                  font-semibold
                  px-5
                  py-2
                  rounded-full
                  transition-all
                  duration-300
                  hover:shadow-[0_0_24px_rgba(250,210,147,0.3)]
                  hover:scale-105
                "
                style={{
                  background:
                    "linear-gradient(135deg, #FAD293, #CEA46B)",
                  color: "#000",
                }}
              >
                Get Started
              </Link>
            </>
          ) : (
            /* =================================================
               PROFILE ICON
            ================================================= */

            <Link
              href="/profile"
              aria-label="Profile"
              className="
                w-10
                h-10
                rounded-full
                border
                border-white/10
                bg-white/[0.04]
                flex
                items-center
                justify-center
                text-[#FAD293]
                hover:border-[#FAD293]/50
                hover:bg-[#FAD293]/10
                transition-all
                duration-300
              "
            >
              <UserRound
                size={19}
                strokeWidth={1.6}
              />
            </Link>
          )}

        </div>

        {/* =================================================
            MOBILE HAMBURGER
        ================================================= */}

        <button
          id="mobile-menu-btn"
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen
                ? "rotate-45 translate-y-2"
                : ""
            }`}
          />

          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen
                ? "opacity-0"
                : ""
            }`}
          />

          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen
                ? "-rotate-45 -translate-y-2"
                : ""
            }`}
          />
        </button>

      </div>

      {/* =================================================
          MOBILE MENU
      ================================================= */}

      <div
        className={`lg:hidden transition-all duration-500 overflow-hidden ${
          menuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >

        <div className="bg-black/95 backdrop-blur-xl border-t border-[#FAD293]/10 px-6 py-6 flex flex-col gap-4">

          {/* NAV LINKS */}

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="
                text-white/70
                hover:text-white
                py-2
                border-b
                border-white/5
                transition-colors
              "
              onClick={() =>
                setMenuOpen(false)
              }
            >
              {link.label}
            </Link>
          ))}

          {/* =================================================
              MOBILE AUTH
          ================================================= */}

          {!isLoggedIn ? (
            <div className="flex gap-3 pt-2">

              {/* LOGIN */}

              <Link
                href="/login"
                className="
                  flex-1
                  text-center
                  text-sm
                  py-2.5
                  rounded-full
                  border
                  border-white/20
                  text-white/70
                "
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Login
              </Link>

              {/* GET STARTED */}

              <Link
                href="/get-started"
                className="
                  flex-1
                  text-center
                  text-sm
                  font-semibold
                  py-2.5
                  rounded-full
                "
                style={{
                  background:
                    "linear-gradient(135deg, #FAD293, #CEA46B)",
                  color: "#000",
                }}
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Get Started
              </Link>

            </div>
          ) : (
            /* =================================================
               MOBILE PROFILE
            ================================================= */

            <Link
              href="/profile"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                w-full
                py-2.5
                rounded-full
                border
                border-[#FAD293]/30
                bg-[#FAD293]/10
                text-[#FAD293]
                text-sm
                font-medium
              "
            >
              <UserRound
                size={17}
                strokeWidth={1.7}
              />

              Profile
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}