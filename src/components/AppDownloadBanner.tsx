"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode, Smartphone, X } from "lucide-react";

export default function AppDownloadBanner() {
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<"apple" | "google" | null>(null);

  // App URLs
  const APP_STORE_URL = "https://apps.apple.com/us/app/mmc-motor/id6794230851";
  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mmc.app";

  const handleStoreClick = (store: "apple" | "google", e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedStore(store);
    setShowQrModal(true);
  };

  return (
    <>
      <section
        id="app-download-promo"
        aria-label="Download MMC App — 25% Off"
        className="relative w-full bg-black py-4 sm:py-6 lg:py-8 overflow-hidden"
      >
        {/* Dynamic ambient gold glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[1000px] h-[200px] sm:h-[350px] rounded-full blur-[100px] sm:blur-[160px] pointer-events-none opacity-25"
          style={{
            background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Card Frame with Gold Sheen Border */}
          <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 bg-[#0a0705] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden group">
            {/* Top gold sheen line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20" />

            {/* Desktop Banner (Web view) */}
            <div className="hidden md:block relative w-full aspect-[1920/640] overflow-hidden">
              <Image
                src="/offer bnner-web.png"
                alt="Download the MMC App Today — 25% OFF Smart Repair Services"
                fill
                priority
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />

              {/* Interactive SVG Click Areas on Desktop (Right Section Overlay) */}
              <div className="absolute right-[3.5%] lg:right-[4.5%] top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-2.5">
                {/* Official App Store & Google Play Badges */}
                <div className="flex flex-col gap-2">
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleStoreClick("apple", e)}
                    className="group/btn relative flex items-center gap-2.5 px-3.5 py-1.5 min-w-[152px] h-[48px] rounded-[10px] bg-black border-[1.5px] border-[#A6A6A6] text-white transition-all duration-200 hover:border-white hover:bg-[#0c0c0c] active:scale-95 shadow-lg select-none"
                    aria-label="Download on the Apple App Store"
                  >
                    {/* Apple Logo SVG */}
                    <svg className="w-[22px] h-[26px] fill-white text-white shrink-0" viewBox="0 0 170 170">
                      <path fill="currentColor" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-5.77-8.8-10.22-19.11-13.34-30.93-3.13-11.83-4.7-23.01-4.7-33.56 0-14.63 3.63-26.65 10.89-36.07 7.26-9.42 16.48-14.28 27.65-14.59 4.35 0 9.27 1.15 14.77 3.44 5.5 2.29 9.17 3.49 11.02 3.59 1.63 0 5.43-1.25 11.41-3.76 5.98-2.5 10.99-3.65 15.02-3.44 14.63.76 25.86 6.3 33.69 16.63-12.98 7.84-19.34 18.66-19.1 32.48.24 10.74 4.22 19.82 11.95 27.24 3.82 3.69 8.24 6.44 13.26 8.26-2.61 7.64-5.83 15.03-9.66 22.17zM119.22 31.02c0-7.29 2.65-14.15 7.95-20.58 5.3-6.43 11.75-10.24 19.36-11.44.22 1.41.33 2.72.33 3.92 0 7.39-2.73 14.37-8.19 20.93-5.46 6.56-11.99 10.37-19.59 11.44-.22-1.3-.33-2.61-.33-3.92z" />
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[9.5px] font-normal text-white tracking-[-0.01em] leading-none mb-0.5">Download on the</span>
                      <span className="text-[17px] font-semibold text-white tracking-[-0.03em] leading-none">App Store</span>
                    </div>
                  </a>

                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleStoreClick("google", e)}
                    className="group/btn relative flex items-center gap-2.5 px-3.5 py-1.5 min-w-[152px] h-[48px] rounded-[10px] bg-black border-[1.5px] border-[#A6A6A6] text-white transition-all duration-200 hover:border-white hover:bg-[#0c0c0c] active:scale-95 shadow-lg select-none"
                    aria-label="Get it on Google Play"
                  >
                    {/* Google Play Color SVG */}
                    <svg className="w-[22px] h-[24px] shrink-0" viewBox="0 0 512 512">
                      <path fill="#00E676" d="M260.6 242.4 67.4 435.6c5.8 6.2 14.1 9.8 23.3 9.8 5.7 0 11.2-1.4 16.1-4l246.3-141.5-92.5-57.5z"/>
                      <path fill="#FF3333" d="m353.1 161.7-246.3-141.5c-4.9-2.6-10.4-4-16.1-4-9.2 0-17.5 3.6-23.3 9.8l193.2 193.2 92.5-57.5z"/>
                      <path fill="#FFD400" d="M441.5 233.5l-63.8-36.6-34.9 35.5 34.9 35.5 63.8-36.6c11.9-6.9 19.3-19.4 19.3-33.9s-7.4-27-19.3-33.9z"/>
                      <path fill="#0086F8" d="M67.4 76.4C63.6 82.3 61.4 89.4 61.4 97v318c0 7.6 2.2 14.7 6 20.6l193.2-193.2L67.4 76.4z"/>
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8.5px] font-medium text-white tracking-[0.08em] uppercase leading-none mb-0.5">GET IT ON</span>
                      <span className="text-[16px] font-semibold text-white tracking-[-0.02em] leading-none">Google Play</span>
                    </div>
                  </a>
                </div>

                {/* Text CTA Link */}
                <button
                  onClick={(e) => handleStoreClick("apple", e)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FAD293] hover:text-white underline underline-offset-4 decoration-[#FAD293]/60 hover:decoration-white transition-all pt-1 cursor-pointer"
                >
                  <span>Download the app</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Mobile Banner (Phone view) */}
            <div className="block md:hidden relative w-full aspect-[600/380] overflow-hidden">
              <Image
                src="/offer bnner-mobile.png"
                alt="Download the MMC App Today — 25% OFF Smart Repair Services"
                fill
                priority
                className="w-full h-full object-cover"
                sizes="100vw"
              />

              {/* Mobile SVG Interactive Click Bar */}
              <div className="absolute inset-x-0 bottom-3 z-30 flex flex-col items-center gap-2 px-3">
                <div className="grid grid-cols-2 gap-2 w-full max-w-[340px]">
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleStoreClick("apple", e)}
                    className="flex items-center justify-center gap-2 py-1.5 px-2.5 h-[42px] rounded-[9px] bg-black border-[1.5px] border-[#A6A6A6] text-white shadow-lg active:scale-95 select-none"
                    aria-label="Download on the Apple App Store"
                  >
                    <svg className="w-4 h-5 fill-white text-white shrink-0" viewBox="0 0 170 170">
                      <path fill="currentColor" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-5.77-8.8-10.22-19.11-13.34-30.93-3.13-11.83-4.7-23.01-4.7-33.56 0-14.63 3.63-26.65 10.89-36.07 7.26-9.42 16.48-14.28 27.65-14.59 4.35 0 9.27 1.15 14.77 3.44 5.5 2.29 9.17 3.49 11.02 3.59 1.63 0 5.43-1.25 11.41-3.76 5.98-2.5 10.99-3.65 15.02-3.44 14.63.76 25.86 6.3 33.69 16.63-12.98 7.84-19.34 18.66-19.1 32.48.24 10.74 4.22 19.82 11.95 27.24 3.82 3.69 8.24 6.44 13.26 8.26-2.61 7.64-5.83 15.03-9.66 22.17zM119.22 31.02c0-7.29 2.65-14.15 7.95-20.58 5.3-6.43 11.75-10.24 19.36-11.44.22 1.41.33 2.72.33 3.92 0 7.39-2.73 14.37-8.19 20.93-5.46 6.56-11.99 10.37-19.59 11.44-.22-1.3-.33-2.61-.33-3.92z" />
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[7.5px] font-normal text-white/90 leading-none mb-0.5">Download on the</span>
                      <span className="text-[13px] font-semibold text-white tracking-tight leading-none">App Store</span>
                    </div>
                  </a>

                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleStoreClick("google", e)}
                    className="flex items-center justify-center gap-2 py-1.5 px-2.5 h-[42px] rounded-[9px] bg-black border-[1.5px] border-[#A6A6A6] text-white shadow-lg active:scale-95 select-none"
                    aria-label="Get it on Google Play"
                  >
                    <svg className="w-4 h-4.5 shrink-0" viewBox="0 0 512 512">
                      <path fill="#00E676" d="M260.6 242.4 67.4 435.6c5.8 6.2 14.1 9.8 23.3 9.8 5.7 0 11.2-1.4 16.1-4l246.3-141.5-92.5-57.5z"/>
                      <path fill="#FF3333" d="m353.1 161.7-246.3-141.5c-4.9-2.6-10.4-4-16.1-4-9.2 0-17.5 3.6-23.3 9.8l193.2 193.2 92.5-57.5z"/>
                      <path fill="#FFD400" d="M441.5 233.5l-63.8-36.6-34.9 35.5 34.9 35.5 63.8-36.6c11.9-6.9 19.3-19.4 19.3-33.9s-7.4-27-19.3-33.9z"/>
                      <path fill="#0086F8" d="M67.4 76.4C63.6 82.3 61.4 89.4 61.4 97v318c0 7.6 2.2 14.7 6 20.6l193.2-193.2L67.4 76.4z"/>
                    </svg>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[7px] font-medium text-white/90 tracking-wider uppercase leading-none mb-0.5">GET IT ON</span>
                      <span className="text-[12.5px] font-semibold text-white tracking-tight leading-none">Google Play</span>
                    </div>
                  </a>
                </div>

                <button
                  onClick={(e) => handleStoreClick("apple", e)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FAD293] underline cursor-pointer"
                >
                  <span>Download the app</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {/* Bottom gold sheen line */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20" />
          </div>
        </div>
      </section>

      {/* Interactive App Download Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-[#CEA46B]/40 bg-gradient-to-b from-[#140e0a] to-[#0a0705] p-6 text-white shadow-2xl space-y-5">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#FAD293] to-[#CEA46B] text-black flex items-center justify-center shadow-lg shadow-[#FAD293]/20">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">
                Download the MMC App
              </h3>
              <p className="text-xs text-white/70">
                Claim your <span className="text-[#FAD293] font-bold">25% OFF</span> on Smart Repairs & Luxury Services on mobile.
              </p>
            </div>

            {/* Official Store Badges in Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-[12px] bg-black border-[1.5px] border-[#A6A6A6] hover:border-white transition-all text-white shadow-xl active:scale-95 select-none"
              >
                <svg className="w-[24px] h-[28px] fill-white text-white shrink-0" viewBox="0 0 170 170">
                  <path fill="currentColor" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-5.77-8.8-10.22-19.11-13.34-30.93-3.13-11.83-4.7-23.01-4.7-33.56 0-14.63 3.63-26.65 10.89-36.07 7.26-9.42 16.48-14.28 27.65-14.59 4.35 0 9.27 1.15 14.77 3.44 5.5 2.29 9.17 3.49 11.02 3.59 1.63 0 5.43-1.25 11.41-3.76 5.98-2.5 10.99-3.65 15.02-3.44 14.63.76 25.86 6.3 33.69 16.63-12.98 7.84-19.34 18.66-19.1 32.48.24 10.74 4.22 19.82 11.95 27.24 3.82 3.69 8.24 6.44 13.26 8.26-2.61 7.64-5.83 15.03-9.66 22.17zM119.22 31.02c0-7.29 2.65-14.15 7.95-20.58 5.3-6.43 11.75-10.24 19.36-11.44.22 1.41.33 2.72.33 3.92 0 7.39-2.73 14.37-8.19 20.93-5.46 6.56-11.99 10.37-19.59 11.44-.22-1.3-.33-2.61-.33-3.92z" />
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-normal text-white/90 leading-none mb-0.5">Download on the</span>
                  <span className="text-[18px] font-semibold text-white tracking-tight leading-none">App Store</span>
                </div>
              </a>

              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-[12px] bg-black border-[1.5px] border-[#A6A6A6] hover:border-white transition-all text-white shadow-xl active:scale-95 select-none"
              >
                <svg className="w-[24px] h-[26px] shrink-0" viewBox="0 0 512 512">
                  <path fill="#00E676" d="M260.6 242.4 67.4 435.6c5.8 6.2 14.1 9.8 23.3 9.8 5.7 0 11.2-1.4 16.1-4l246.3-141.5-92.5-57.5z"/>
                  <path fill="#FF3333" d="m353.1 161.7-246.3-141.5c-4.9-2.6-10.4-4-16.1-4-9.2 0-17.5 3.6-23.3 9.8l193.2 193.2 92.5-57.5z"/>
                  <path fill="#FFD400" d="M441.5 233.5l-63.8-36.6-34.9 35.5 34.9 35.5 63.8-36.6c11.9-6.9 19.3-19.4 19.3-33.9s-7.4-27-19.3-33.9z"/>
                  <path fill="#0086F8" d="M67.4 76.4C63.6 82.3 61.4 89.4 61.4 97v318c0 7.6 2.2 14.7 6 20.6l193.2-193.2L67.4 76.4z"/>
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] font-medium text-white/90 tracking-wider uppercase leading-none mb-0.5">GET IT ON</span>
                  <span className="text-[17px] font-semibold text-white tracking-tight leading-none">Google Play</span>
                </div>
              </a>
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#FAD293]" />
                <span>Instant dispatch & certified specialists across the UK</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
