"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, Sparkles } from "lucide-react";

export default function ServiceCategorySlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent((params?.slug as string) || "");

  useEffect(() => {
    const lower = slug.toLowerCase();
    if (
      lower.includes("valet") ||
      lower.includes("detailing") ||
      lower.includes("wash")
    ) {
      router.replace("/services/valet-wash");
    } else if (lower.includes("tyre") || lower.includes("tire")) {
      router.replace("/tyre-fittings");
    } else if (lower.includes("hire") || lower.includes("rental")) {
      router.replace("/car-hire");
    } else if (lower.includes("chauffeur")) {
      router.replace("/services/Chauffeur");
    } else if (
      lower.includes("emergency") ||
      lower.includes("recovery") ||
      lower.includes("breakdown")
    ) {
      router.replace("/emergency-assistance");
    } else if (lower.includes("modifi")) {
      router.replace("/services/modification");
    } else if (lower.includes("alloy")) {
      router.replace("/services/alloy-wheel");
    } else if (lower.includes("mechanic") || lower.includes("mechanical")) {
      router.replace("/services/mechanical");
    } else if (lower.includes("body")) {
      router.replace("/services/bodywork");
    }
  }, [slug, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#FAD293]/10 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
        <Car size={32} />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold text-white">{slug || "Service Category"}</h1>
        <p className="text-sm text-white/60">
          Explore our available fleet and certified automotive providers.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/car-hire"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-black transition hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
          }}
        >
          Explore Car Hire Fleet
        </Link>
        <Link
          href="/services"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/5 transition"
        >
          All Services
        </Link>
      </div>
    </div>
  );
}
