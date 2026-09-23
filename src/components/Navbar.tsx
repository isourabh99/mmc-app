"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  UserRound,
  Siren,
  Calendar,
  MapPin,
  LogOut,
  ChevronDown,
  Car,
  Shield,
  Sparkles,
} from "lucide-react";
import { getCustomerProfile } from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Car Hire", href: "/car-hire" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // CHECK LOGIN STATUS & USER INFO
  // =====================================================

  const checkLoginStatus = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        // Attempt to fetch profile if not cached yet
        try {
          const res = await getCustomerProfile();
          if (res?.content) {
            setUser(res.content);
            localStorage.setItem("user", JSON.stringify(res.content));
          }
        } catch (e) {
          console.warn("Navbar could not fetch profile:", e);
        }
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();

    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("auth-change", checkLoginStatus);
    window.addEventListener("focus", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("auth-change", checkLoginStatus);
      window.removeEventListener("focus", checkLoginStatus);
    };
  }, [checkLoginStatus, pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("is_active");
    setIsLoggedIn(false);
    setUser(null);
    setUserDropdownOpen(false);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("auth-change"));
    showToast("Logged out successfully.", "info");
    router.push("/login");
  };

  // =====================================================
  // SCROLL
  // =====================================================

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed px-2 top-0 left-0 right-0 z-50 transition-all duration-500 py-3 lg:px-10 ${
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

          {/* =================================================
              EMERGENCY ASSISTANCE
          ================================================= */}

          <Link
            href="/emergency-assistance"
            title="Emergency Vehicle Assistance"
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              bg-red-600
              text-white
              text-sm
              font-semibold
              shadow-[0_0_18px_rgba(220,38,38,0.25)]
              hover:bg-red-700
              hover:shadow-[0_0_25px_rgba(220,38,38,0.45)]
              hover:scale-105
              transition-all
              duration-300
            "
          >
            <Siren size={17} strokeWidth={2.2} />
            <span>Emergency</span>
          </Link>

          {/* =================================================
              LOGIN / GET STARTED / PROFILE
          ================================================= */}

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
            /* USER PROFILE ICON & DROPDOWN */
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="Account Menu"
                className={`
                  flex items-center gap-2.5
                  pl-2 pr-3 py-1.5
                  rounded-full
                  border
                  text-[#FAD293]
                  transition-all
                  duration-300
                  ${
                    userDropdownOpen
                      ? "border-[#FAD293] bg-[#FAD293]/15 ring-2 ring-[#FAD293]/30"
                      : "border-white/10 bg-white/[0.04] hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10"
                  }
                `}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FAD293] to-[#CEA46B] p-[1.5px] shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden">
                    {user?.profile_image_full_path ? (
                      <img
                        src={user.profile_image_full_path}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-bold text-[#FAD293]">
                        {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "U"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white max-w-[90px] truncate leading-tight">
                    {user?.first_name || "Account"}
                  </span>
                  <span className="text-[9px] text-[#FAD293] leading-none uppercase font-semibold">
                    VIP
                  </span>
                </div>
                <ChevronDown size={13} className={`text-white/50 transition-transform duration-200 ${userDropdownOpen ? "rotate-180 text-[#FAD293]" : ""}`} />
              </button>

              {/* DROPDOWN MENU */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border border-[#d9a85f]/40 bg-[#16120e] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* User Info Header */}
                  <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e7bd78]">
                        ✦ VIP Client
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate mt-0.5">
                      {user?.first_name || user?.last_name
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                        : "My Account"}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {user?.phone || user?.email || "Signed In"}
                    </p>
                  </div>

                  {/* Links */}
                  <div className="space-y-0.5">
                    <Link
                      href="/account?tab=bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-[#251d16] hover:text-[#e7bd78]"
                    >
                      <Calendar size={14} className="text-[#e7bd78]" />
                      <span>My Bookings</span>
                    </Link>

                    <Link
                      href="/account?tab=profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-[#251d16] hover:text-[#e7bd78]"
                    >
                      <UserRound size={14} className="text-[#e7bd78]" />
                      <span>Personal Profile</span>
                    </Link>

                    <Link
                      href="/account?tab=addresses"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-[#251d16] hover:text-[#e7bd78]"
                    >
                      <MapPin size={14} className="text-[#e7bd78]" />
                      <span>Saved Addresses</span>
                    </Link>

                    <Link
                      href="/account?tab=security"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-[#251d16] hover:text-[#e7bd78]"
                    >
                      <Shield size={14} className="text-[#e7bd78]" />
                      <span>Security & Privacy</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="pt-1.5 border-t border-white/10 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          id="mobile-menu-btn"
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />

          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />

          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
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
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-black/95 backdrop-blur-xl border-t border-[#FAD293]/10 px-6 py-6 flex flex-col gap-4">

          {/* =================================================
              EMERGENCY ASSISTANCE - MOBILE
          ================================================= */}

          <Link
            href="/emergency-assistance"
            title="Emergency Vehicle Assistance"
            className="
              flex
              items-center
              justify-center
              gap-2
              w-full
              py-3
              rounded-xl
              bg-red-600
              text-white
              font-semibold
              shadow-[0_0_20px_rgba(220,38,38,0.25)]
              hover:bg-red-700
              transition-all
              duration-300
            "
            onClick={() => setMenuOpen(false)}
          >
            <Siren size={19} strokeWidth={2.2} />
            Emergency Assistance
          </Link>

          {/* =================================================
              NAV LINKS
          ================================================= */}

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
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* =================================================
              LOGIN / GET STARTED / PROFILE
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
                onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>

            </div>
          ) : (
            /* MOBILE PROFILE & ACCOUNT LINKS */
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-xs text-white/50">
                Signed in as <strong className="text-white">{user?.first_name || user?.phone || "VIP Member"}</strong>
              </div>

              <Link
                href="/account?tab=bookings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 w-full py-2.5 px-4 rounded-xl border border-[#FAD293]/30 bg-[#FAD293]/10 text-[#FAD293] text-sm font-semibold"
              >
                <Calendar size={17} />
                <span>My Bookings</span>
              </Link>

              <Link
                href="/account?tab=profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 text-sm font-medium hover:text-white"
              >
                <UserRound size={17} />
                <span>Personal Profile</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 w-full py-2 px-4 text-xs font-semibold text-red-400 hover:text-red-300"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}