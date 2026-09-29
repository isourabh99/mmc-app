"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePromoBanner() {
  return (
    <section className="relative w-full bg-black py-6 sm:py-10 lg:py-14 overflow-hidden">
      {/* Ambient background gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[900px] h-[250px] sm:h-[400px] rounded-full blur-[100px] sm:blur-[140px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <Link
          href="/services"
          className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#CEA46B]/25 hover:border-[#FAD293]/60 bg-[#120E0B] shadow-[0_15px_45px_rgba(0,0,0,0.85)] hover:shadow-[0_20px_60px_rgba(206,164,107,0.22)] transition-all duration-300 transform active:scale-[0.99]"
        >
          {/* Subtle top gold sheen highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FAD293]/60 to-transparent z-10" />

          {/* Banner Image */}
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/home page.png"
              alt="MMC - Every Car Service. One Connected Place. Book. Compare. Connect."
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1440px"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>

          {/* Subtle gradient vignette at bottom on mobile */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </Link>
      </div>
    </section>
  );
}
