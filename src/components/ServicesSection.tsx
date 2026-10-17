"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
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
    name: "Bodywork repairs",
    tagline: "Flawless finish. Precision repair.",
    description: "Expert dent, scratch, and paint repair to manufacturer standards.",
    image: "/Bodyworkcategory.png",
    href: "/services/bodywork",
    matchPatterns: ["bodywork", "body work", "smart repair", "repair", "dent", "paint"],
  },
  {
    key: "alloy",
    name: "Alloy refurbishment",
    tagline: "Restore. Refine. Rejuvenate.",
    description: "Precision diamond-cut, powder coating, and scuff repair for immaculate wheels.",
    image: "/AlloyCategory.png",
    href: "/services/alloy-wheel",
    matchPatterns: ["alloy", "wheel", "refurbishment"],
  },
  {
    key: "valet",
    name: "Valet & detailing",
    tagline: "Showroom shine. Ultimate care.",
    description: "Deep exterior decontamination, ceramic protection, and interior rejuvenation.",
    image: "/valet cateory.png",
    href: "/services/valet-wash",
    matchPatterns: ["valet", "detailing", "wash"],
  },
  {
    key: "tyre",
    name: "Tyre fitting",
    tagline: "Mobile fitting. Premium brands.",
    description: "Mobile tyre fitting, puncture repairs, and seasonal replacements at your doorstep.",
    image: "/tyre-categry.png",
    href: "/tyre-fittings",
    matchPatterns: ["tyre", "tire", "fitting"],
  },
  {
    key: "mechanic",
    name: "Mechanic",
    tagline: "Expert care for peak performance.",
    description: "Comprehensive diagnostics, engine maintenance, brake overhauls, and servicing.",
    image: "/mechnical-category.png",
    href: "/services/mechanical",
    matchPatterns: ["mechanic", "mechanical"],
  },
  {
    key: "modification",
    name: "Modifications",
    tagline: "Custom styling. Pure performance.",
    description: "Performance enhancements, bespoke aesthetics, ambient lighting, and custom retrofits.",
    image: "/modifcation-categury.png",
    href: "/services/modification",
    matchPatterns: ["modifi", "tuning", "custom"],
  },
  {
    key: "chauffer",
    name: "Chauffeur",
    tagline: "Professional. Discreet. Reliable.",
    description: "Executive travel, airport transfers, and VIP chauffeured journeys in luxury fleet vehicles.",
    image: "/chauffercategory.png",
    href: "/services/Chauffeur",
    matchPatterns: ["chauffeur", "chauffer", "driver"],
  },
  {
    key: "carhire",
    name: "Car hire",
    tagline: "Premium vehicles. Your way.",
    description: "Prestige, performance, and everyday vehicle rentals tailored to your exact schedule.",
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
    };
  });

  return (
    <section
      id="services"
      className="py-4 sm:py-8 lg:py-12 bg-black relative overflow-hidden"
    >
      {/* Background ambient gold accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] relative z-10">
        {/* Section Header: Matches Screenshot — Gold bar followed by Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-6 sm:w-10 h-[2.5px] sm:h-1 bg-gradient-to-r from-[#FAD293] to-[#CEA46B] rounded-full shrink-0" />
            <h2 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              What does your car need?
            </h2>
          </div>

          <Link
            href="/services"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FAD293] hover:text-white transition-colors"
          >
            <span>View all services</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 8 Category Cards Grid: 
            - Desktop: 4 columns x 2 rows (4 4 service)
            - Mobile: 2 columns x 4 rows (1 row me 2 service) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-4 lg:gap-5">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              id={`service-card-${service.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-[#CEA46B]/60 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(206,164,107,0.2)] transition-all duration-300 cursor-pointer h-28 xs:h-32 sm:h-36 lg:h-44 xl:h-48 flex flex-col justify-end bg-[#0e0d0c]"
            >
              {/* Background Photography */}
              <Image
                src={service.image}
                alt={service.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                priority
              />

              {/* Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent group-hover:via-black/30 transition-colors duration-300" />

              {/* Card Footer Content: Title on left, Chevron > on right */}
              <div className="relative z-10 flex items-center justify-between w-full p-2.5 xs:p-3 sm:p-4">
                <span className="text-xs xs:text-sm sm:text-base font-bold text-white group-hover:text-[#FAD293] transition-colors leading-tight drop-shadow-md">
                  {service.name}
                </span>

                <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
                  <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-[#FAD293]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}