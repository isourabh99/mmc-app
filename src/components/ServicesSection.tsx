"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCategories,
  Category,
} from "@/lib/service/categories.api";

// Icons based on category name
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();

  if (name.includes("mechanic")) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.5 6.5a5 5 0 007 7l-2.5 2.5-7-7 2.5-2.5zM5 19l4-4m-2-2l-2 2"
        />
      </svg>
    );
  }

  if (
    name.includes("bodywork") ||
    name.includes("repair") ||
    name.includes("alloy")
  ) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    );
  }

  if (name.includes("tyre")) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        <path
          strokeLinecap="round"
          strokeWidth={1.5}
          d="M12 2v4M12 18v4M2 12h4M18 12h4"
        />
      </svg>
    );
  }

  if (
    name.includes("valet") ||
    name.includes("detailing") ||
    name.includes("wash")
  ) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    );
  }

  if (name.includes("chauffeur")) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    );
  }

  if (
    name.includes("hire") ||
    name.includes("rental")
  ) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      </svg>
    );
  }

  if (name.includes("modification")) {
    return (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    );
  }

  // Default icon
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6v12m-6-6h12"
      />
    </svg>
  );
};

export default function ServicesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCategories(10, 1);

        console.log("Categories API response:", response);

        if (response?.content?.data) {
          // Only show active categories
          const activeCategories = response.content.data.filter(
            (category) => category.is_active === 1
          );

          setCategories(activeCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setError("Unable to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section
      id="services"
      className="py-10 px-6 bg-black relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, #FAD293, #CEA46B)",
        }}
      />

      <div className="max-w-8xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">

            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #FAD293)",
              }}
            />

            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                background:
                  "linear-gradient(135deg, #FAD293, #CEA46B)",
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
                background:
                  "linear-gradient(90deg, #CEA46B, transparent)",
              }}
            />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Every Automotive Service,{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              One Platform
            </span>
          </h2>

          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From a quick scratch repair to a complete vehicle transformation
            — browse our curated service categories and get matched with the
            best providers near you.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-white/8 bg-white/3 animate-pulse"
              >
                <div className="w-14 h-14 rounded-xl bg-white/10 mb-5" />

                <div className="h-5 w-32 bg-white/10 rounded mb-3" />

                <div className="h-4 w-full bg-white/5 rounded mb-2" />
                <div className="h-4 w-4/5 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex justify-center">
            <div className="text-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
              <p className="text-red-400 mb-4">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-lg border border-[#FAD293]/30 text-[#FAD293] hover:bg-[#FAD293]/10 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center text-white/50 py-10">
            No services available.
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/services/${category.name}`}
                id={`service-card-${category.id}`}
                className="group relative p-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm transition-all duration-400 hover:border-[#FAD293]/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(206,164,107,0.1)] cursor-pointer"
              >

                {/* Featured Tag */}
                {category.is_featured === 1 && (
                  <span
                    className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-black"
                    style={{
                      background:
                        "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    Featured
                  </span>
                )}

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(250,210,147,0.2)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(250,210,147,0.1), rgba(206,164,107,0.05))",
                    border:
                      "1px solid rgba(250,210,147,0.2)",
                    color: "#FAD293",
                  }}
                >
                  {getCategoryIcon(category.name)}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#FAD293] transition-colors duration-300">
                  {category.name}
                </h3>

                <p className="text-sm text-white/45 leading-relaxed">
                  {category.description ||
                    `Explore ${category.name} services and find the right provider for your vehicle.`}
                </p>

                {/* Arrow */}
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-[#FAD293] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                  Explore

                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Bottom border accent */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #FAD293, transparent)",
                  }}
                />
              </Link>
            ))}

          </div>
        )}
      </div>
    </section>
  );
}