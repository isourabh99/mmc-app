"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-3 ${
        scrolled
          ? "bg-black/90 backdrop-blur-xl bg-transparent  "
          : "bg-black/90 backdrop-blur-md "
      }`}
    >
      <div className=" mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div>
            <span
              className="text-xl font-bold tracking-wider"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
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

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 tracking-wide relative group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-[#FAD293] to-[#CEA46B] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white px-5 py-2 rounded-full border border-white/10 hover:border-[#FAD293]/40 transition-all duration-300"
          >
            Login
          </Link>
          <Link
            href="/get-started"
            className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 hover:shadow-[0_0_24px_rgba(250,210,147,0.3)] hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              color: "#000",
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          id="mobile-menu-btn"
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-500 overflow-hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-black/95 backdrop-blur-xl border-t border-[#FAD293]/10 px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/70 hover:text-white py-2 border-b border-white/5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              href="/login"
              className="flex-1 text-center text-sm py-2.5 rounded-full border border-white/20 text-white/70"
            >
              Login
            </Link>
            <Link
              href="/get-started"
              className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                color: "#000",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}