"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategories, Category } from "@/lib/service/categories.api";

interface ServiceConfig {
  key: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  href: string;
  matchPatterns: string[];
}

const ORDERED_SERVICES: ServiceConfig[] = [
  {
    key: "bodywork",
    name: "Smart repair & bodywork",
    tagline: "Flawless finish. Precision repair.",
    description:
      "Expert dent, and paint repair standard.",
    image: "/Bodyworkcategory.png",
    href: "/services/bodywork",
    matchPatterns: [
      "bodywork",
      "body work",
      "body",
      "smart repair",
      "repair",
      "dent",
      "paint",
    ],
  },
  {
    key: "alloy",
    name: "Alloy refurbishment",
    tagline: "Restore. Refine. Rejuvenate.",
    description:
      "Precision diamond-cut, powder coating, and scuff repair for immaculate wheels.",
    image: "/AlloyCategory.png",
    href: "/services/alloy-wheel",
    matchPatterns: ["alloy", "wheel", "refurbishment"],
  },
  {
    key: "valet",
    name: "Valet & detailing",
    tagline: "Showroom shine. Ultimate care.",
    description:
      "Deep exterior decontamination, ceramic protection, and interior rejuvenation.",
    image: "/valet cateory.png",
    href: "/services/valet-wash",
    matchPatterns: ["valet", "detailing", "wash"],
  },
  {
    key: "modification",
    name: "Modification",
    tagline: "Custom styling. Pure performance.",
    description:
      "Performance enhancements, bespoke aesthetics, ambient lighting, and custom retrofits.",
    image: "/modifcation-categury.png",
    href: "/services/modification",
    matchPatterns: ["modifi", "tuning", "custom"],
  },
  {
    key: "tyre",
    name: "Tyre fitting",
    tagline: "Mobile fitting. Premium brands.",
    description:
      "Mobile tyre fitting, puncture repairs, and seasonal replacements at your doorstep.",
    image: "/tyre-categry.png",
    href: "/tyre-fittings",
    matchPatterns: ["tyre", "tire", "fitting"],
  },
  {
    key: "mechanic",
    name: "Mechanic",
    tagline: "Expert care for peak performance",
    description:
      "Comprehensive diagnostics, engine maintenance, brake overhauls, and servicing.",
    image: "/mechnical-category.png",
    href: "/services/mechanical",
    matchPatterns: ["mechanic", "mechanical"],
  },
  {
    key: "chauffer",
    name: "Chauffer",
    tagline: "Professional. Discreet. Reliable.",
    description:
      "Executive travel, airport transfers, and VIP chauffeured journeys in luxury fleet vehicles.",
    image: "/chauffercategory.png",
    href: "/services/Chauffeur",
    matchPatterns: ["chauffeur", "chauffer", "driver"],
  },
  {
    key: "carhire",
    name: "Car hire",
    tagline: "Premium vehicles. Your way.",
    description:
      "Prestige, performance, and everyday vehicle rentals tailored to your exact schedule.",
    image: "/carcategiory.png",
    href: "/car-hire",
    matchPatterns: ["hire", "rental", "car hire"],
  },
];

export default function ServicesSection() {
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories(50, 1);

        if (response?.content?.data) {
          const activeCategories = response.content.data
            .filter((category) => category.is_active === 1)
            .filter(
              (category) =>
                !category.name.toLowerCase().includes("emergency")
            );

          setApiCategories(activeCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const displayServices = ORDERED_SERVICES.map((config) => {
    const matchedApiCat = apiCategories.find((cat) => {
      const catNameLower = cat.name.toLowerCase();
      return config.matchPatterns.some((pattern) =>
        catNameLower.includes(pattern)
      );
    });

    return {
      id: matchedApiCat?.id || config.key,
      name: config.name,
      tagline: config.tagline,
      description: matchedApiCat?.description || config.description,
      image: config.image,
      href: config.href,
      is_featured: matchedApiCat?.is_featured === 1,
    };
  });

  return (
    <section
      id="services"
      className="py-14 sm:py-20 bg-black relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, transparent, #FAD293)",
              }}
            />

            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Our Services
            </span>

            <div
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #CEA46B, transparent)",
              }}
            />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Every Automotive Service,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              One Platform
            </span>
          </h2>

          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
            From a quick scratch repair to a complete vehicle transformation —
            browse our curated service categories and get matched with the best
            providers near you.
          </p>
        </div>

        {/* Services Grid (Mobile: 1 col list like mockup, Desktop: 4 col grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              id={`service-card-${service.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-[#FAD293]/40 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(206,164,107,0.18)] transition-all duration-500 cursor-pointer h-44 sm:h-72 lg:h-80 flex flex-col justify-end bg-zinc-950"
            >
              {/* Background Image */}
              <Image
                src={service.image}
                alt={service.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />

              {/* Gradient Overlay for high readability - dark at bottom, clear at top */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent sm:via-black/60 sm:to-black/20 group-hover:via-black/50 transition-colors duration-500" />

              {/* Desktop Featured Badge */}
              {service.is_featured && (
                <div className="hidden sm:block absolute top-4 right-4 z-20">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-black shadow-md"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    Featured
                  </span>
                </div>
              )}

              {/* Mobile Card Content (< sm) aligned to bottom */}
              <div className="flex sm:hidden items-end justify-between w-full px-5 pb-5 pt-12 relative z-10">
                <div className="pr-3">
                  <h3 className="text-xl font-serif font-bold text-white tracking-wide group-hover:text-[#FAD293] transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 font-sans tracking-normal mt-1 line-clamp-1">
                    {service.tagline}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border border-[#CEA46B] flex items-center justify-center text-[#FAD293] shrink-0 bg-black/60 backdrop-blur-sm group-hover:bg-[#CEA46B] group-hover:text-black group-hover:border-[#CEA46B] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.6)] mb-0.5">
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </div>

              {/* Desktop Card Content (>= sm) anchored to bottom */}
              <div className="hidden sm:flex flex-col justify-end w-full p-6 relative z-10">
                <h3 className="text-xl lg:text-2xl font-serif font-bold text-white group-hover:text-[#FAD293] transition-colors duration-300">
                  {service.name}
                </h3>
                <p className="text-xs lg:text-sm text-[#FAD293]/90 font-medium tracking-wide mt-1">
                  {service.tagline}
                </p>
                <p className="text-xs text-white/60 line-clamp-2 mt-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#FAD293] flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                    Explore
                  </span>
                  <div className="w-8 h-8 rounded-full border border-[#CEA46B] flex items-center justify-center text-[#FAD293] bg-black/50 backdrop-blur-sm group-hover:bg-[#CEA46B] group-hover:text-black group-hover:border-[#CEA46B] group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom border accent on hover */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #FAD293, transparent)",
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}