"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  alt?: string;
  className?: string;
  aspectRatio?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  alt = "Before and after comparison",
  className = "",
  aspectRatio = "aspect-[16/10]",
  beforeLabel = "BEFORE",
  afterLabel = "AFTER",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    if (width <= 0) return;
    let position = (x / width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-zinc-800/90 bg-black cursor-ew-resize group shadow-2xl ${aspectRatio} ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* After Image (Full Background) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {afterImage.startsWith("/") ? (
          <Image
            src={afterImage}
            alt={`${alt} After`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover object-center"
            priority
          />
        ) : (
          <img
            src={afterImage}
            alt={`${alt} After`}
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
          />
        )}
      </div>

      {/* Before Image (Clipped to sliderPosition %) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {beforeImage.startsWith("/") ? (
          <Image
            src={beforeImage}
            alt={`${alt} Before`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover object-center"
            priority
          />
        ) : (
          <img
            src={beforeImage}
            alt={`${alt} Before`}
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
          />
        )}
      </div>

      {/* BEFORE Pill Tag */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-lg">
          {beforeLabel}
        </span>
      </div>

      {/* AFTER Pill Tag */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FAD293]/90 text-black border border-[#FAD293] shadow-lg font-mono">
          {afterLabel}
        </span>
      </div>

      {/* Vertical Divider Line with Central Handle */}
      <div
        className="absolute top-0 bottom-0 z-30 pointer-events-none transition-transform duration-75"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        {/* Glow Line */}
        <div className="w-[2px] h-full bg-gradient-to-b from-[#FAD293] via-[#E8AF66] to-[#CEA46B] shadow-[0_0_12px_rgba(250,210,147,0.8)]" />

        {/* Central Circular Drag Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#181614] border-2 border-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.6)] flex items-center justify-center text-[#FAD293] pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
          <div className="flex items-center gap-0.5 text-[10px] font-black">
            <span>&lang;</span>
            <span className="w-0.5 h-3 bg-[#FAD293]/80 rounded-full" />
            <span>&rang;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
