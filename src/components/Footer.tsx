"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategories, Category } from "@/lib/service/categories.api";

const mapCategoryToHref = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("valet") || lower.includes("wash") || lower.includes("detailing")) {
    return "/services/valet-wash";
  }
  if (lower.includes("tyre") || lower.includes("tire")) {
    return "/tyre-fittings";
  }
  if (lower.includes("chauffeur")) {
    return "/services/Chauffeur";
  }
  if (lower.includes("hire") || lower.includes("rental")) {
    return "/car-hire";
  }
  if (lower.includes("alloy")) {
    return "/services/alloy-wheel";
  }
  if (lower.includes("modifi")) {
    return "/services/modification";
  }
  if (lower.includes("mechanic") || lower.includes("mechanical")) {
    return "/services/mechanical";
  }
  if (lower.includes("body") || lower.includes("repair") || lower.includes("paint") || lower.includes("dent")) {
    return "/services/bodywork";
  }
  return `/services/${encodeURIComponent(name)}`;
};

const defaultServices = [
  { label: "Smart Repair", href: "/services/bodywork" },
  { label: "Mechanical Repair", href: "/services/mechanical" },
  { label: "Modifications", href: "/services/modification" },
  { label: "Tyre Assistance", href: "/tyre-fittings" },
  { label: "Valet & Detailing", href: "/services/valet-wash" },
  { label: "Chauffeur Service", href: "/services/Chauffeur" },
  { label: "Alloy Wheel Refurbishment", href: "/services/alloy-wheel" },
  { label: "Car Rental", href: "/car-hire" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Careers", href: "/about" },
  { label: "Press", href: "/about" },
  { label: "Blog", href: "/how-it-works" },
];

const supportLinks = [
  { label: "Help Centre", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
  { label: "Dispute Resolution", href: "/contact" },
  { label: "Safety Policy", href: "/faqs" },
  { label: "Provider Support", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/faqs" },
  { label: "Terms of Service", href: "/faqs" },
  { label: "Cookie Policy", href: "/faqs" },
  { label: "Accessibility", href: "/faqs" },
];

const socials = [
  {
    name: "Twitter",
    href: "#twitter",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#instagram",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "#linkedin",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#facebook",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [services, setServices] = useState<{ label: string; href: string }[]>(defaultServices);

  useEffect(() => {
    let isMounted = true;
    getCategories(20, 1)
      .then((res) => {
        if (!isMounted) return;
        const apiCats = res?.content?.data
          ?.filter((c) => c.is_active === 1 && !c.name.toLowerCase().includes("emergency"))
          ?.map((c) => ({
            label: c.name,
            href: mapCategoryToHref(c.name),
          }));

        if (apiCats && apiCats.length > 0) {
          setServices(apiCats);
        }
      })
      .catch((err) => {
        console.warn("Footer: Could not load categories from backend", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const footerSections = [
    { title: "Services", links: services },
    { title: "Company", links: companyLinks },
    { title: "Support", links: supportLinks },
    { title: "Legal", links: legalLinks },
  ];

  return (
    <footer
      id="contact"
      className="border-t border-white/10 pt-16 pb-8 relative overflow-hidden text-white"
      style={{ background: "#030200" }}
    >
      {/* Top subtle glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(250,210,147,0.4), transparent)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Layout Fixed: Using 6 columns on lg screens so Brand takes 2 cols and the 4 link columns take 1 col each */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8 mb-14">
          
          {/* Brand Column (Spans 2 columns on large screens) */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/mmc-logo.jpg"
                  alt="Motor Market Connect"
                  width={360}
                  height={160}
                  className="h-16 w-auto object-contain object-left"
                />
              </div>

              <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-sm">
                The UK&apos;s premium automotive marketplace connecting customers
                with certified service providers. Quality service, transparent
                pricing, every time.
              </p>

              {/* Newsletter Subscription */}
              <div className="mb-6 max-w-sm">
                <p className="text-xs text-white/60 mb-2.5 tracking-wide font-medium">
                  Stay updated with MMC news
                </p>
                <div className="flex gap-2">
                  <input
                    id="footer-email"
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#FAD293]/60 transition-all shadow-inner"
                  />
                  <button
                    id="footer-subscribe-btn"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black shrink-0 hover:shadow-[0_0_20px_rgba(250,210,147,0.4)] transition-all cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-2">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  id={`footer-social-${social.name.toLowerCase()}`}
                  aria-label={social.name}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-[#FAD293] border border-white/10 hover:border-[#FAD293]/40 transition-all duration-300 hover:bg-white/5 shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Categories (Each takes exactly 1 column out of 6 on lg screens) */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4
                className="text-xs font-bold mb-4 tracking-widest uppercase"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-[#FAD293] transition-colors duration-200 block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          }}
        />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2025 Motor Market Connect Club Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <span
              className="font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ♥
            </span>
            <span>in the UK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}