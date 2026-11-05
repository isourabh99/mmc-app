"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";
import {
  GalleryItem,
  GalleryMediaItem,
  getGalleryForCategory,
  MMC_SERVICE_CATEGORIES,
} from "@/lib/service/gallery.api";

interface ServiceOurWorkShowcaseProps {
  categoryId?: string;
  categoryName?: string;
  serviceTitle?: string;
  customSubtitle?: string;
  viewAllUrl?: string;
  layout?: "auto" | "stacked";
}

export default function ServiceOurWorkShowcase({
  categoryId = "f14c244c-352b-4395-9bfd-384dfa1d8ea8",
  categoryName = "Vehicle Modifications & Tuning",
  serviceTitle,
  customSubtitle,
  viewAllUrl = "/services/our-work",
  layout = "auto",
}: ServiceOurWorkShowcaseProps) {
  const [projects, setProjects] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active preview state: null = BeforeAfterSlider, or GalleryMediaItem
  const [activeMedia, setActiveMedia] = useState<GalleryMediaItem | null>(null);

  // Video lightbox modal
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getGalleryForCategory(categoryId, categoryName)
      .then((items) => {
        if (!isMounted) return;
        setProjects(items);
        setCurrentIndex(0);
        setActiveMedia(null);
      })
      .catch((err) => {
        console.error("Failed to load category gallery:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId, categoryName]);

  const currentProject = projects[currentIndex] || null;

  // Derive counts
  const videoCount = useMemo(() => {
    if (!currentProject) return 0;
    return (
      currentProject.videos?.length ||
      currentProject.media.filter((m) => m.media_type === "video").length ||
      (currentProject.media.length > 0 ? 1 : 0)
    );
  }, [currentProject]);

  const imageCount = useMemo(() => {
    if (!currentProject) return 0;
    const fromMedia =
      currentProject.images?.length ||
      currentProject.media.filter((m) => m.media_type === "image").length;
    return fromMedia > 0 ? fromMedia : (currentProject.before_image ? 2 : 1);
  }, [currentProject]);

  // Combine media items into thumbnails
  const thumbnails = useMemo(() => {
    if (!currentProject) return [];
    const list: Array<{
      id: string;
      label: string;
      type: "slider" | "video" | "image";
      thumbnail: string;
      media?: GalleryMediaItem;
    }> = [];

    // Thumbnail 1 & 2: Videos if available
    const vids = currentProject.media.filter((m) => m.media_type === "video");
    vids.slice(0, 2).forEach((v, idx) => {
      list.push({
        id: v.id || `vid-${idx}`,
        label: v.label || `Video Clip ${idx + 1}`,
        type: "video",
        thumbnail:
          v.thumbnail_full_path ||
          currentProject.after_image ||
          currentProject.before_image ||
          "/images/bodywork/hero_bodywork_car.jpg",
        media: v,
      });
    });

    // Thumbnail 3: Before
    if (currentProject.before_image) {
      list.push({
        id: "thumb-before",
        label: "Before",
        type: "slider",
        thumbnail: currentProject.before_image,
      });
    }

    // Thumbnail 4: After
    if (currentProject.after_image) {
      list.push({
        id: "thumb-after",
        label: "After",
        type: "slider",
        thumbnail: currentProject.after_image,
      });
    }

    // Thumbnail 5: Remaining images
    const imgs = currentProject.media.filter((m) => m.media_type === "image");
    imgs.slice(0, 3).forEach((img, idx) => {
      if (list.length >= 5) return;
      list.push({
        id: img.id || `img-${idx}`,
        label: img.label || `Detail ${idx + 1}`,
        type: "image",
        thumbnail: img.media_file_full_path,
        media: img,
      });
    });

    return list.slice(0, 5);
  }, [currentProject]);

  const handlePrev = () => {
    setActiveMedia(null);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
  };

  const handleNext = () => {
    setActiveMedia(null);
    setCurrentIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
  };

  // Compute category definition at the top level BEFORE any conditional return
  const matchedCategoryDef = useMemo(() => {
    const cleanId = String(categoryId || "").toLowerCase().trim();
    const cleanName = String(categoryName || "").toLowerCase().trim();
    return MMC_SERVICE_CATEGORIES.find(
      (c) =>
        c.id === cleanId ||
        c.name.toLowerCase() === cleanName ||
        c.label.toLowerCase() === cleanName ||
        c.aliases.some((a) => cleanName.includes(a) || cleanId === a)
    );
  }, [categoryId, categoryName]);

  const targetTabLabel = matchedCategoryDef?.label || categoryName;
  const targetTabId = matchedCategoryDef?.id || categoryId;
  const targetGalleryUrl = `${viewAllUrl}?category=${encodeURIComponent(targetTabLabel)}&category_id=${encodeURIComponent(targetTabId)}&service=${encodeURIComponent(categoryName)}`;

  const effectiveSubtitle =
    customSubtitle ||
    `Explore a selection of our latest ${categoryName.toLowerCase()}, from subtle upgrades to full custom builds.`;

  if (loading && projects.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-zinc-800/80 bg-[#121316]/90 p-8 text-center animate-pulse">
        <div className="h-6 w-36 bg-zinc-800 rounded-full mx-auto mb-4" />
        <div className="h-8 w-64 bg-zinc-800 rounded-lg mx-auto mb-3" />
        <div className="h-64 w-full bg-zinc-900 rounded-2xl" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="w-full mt-6 space-y-4">
        {/* 1. Header Row (Matching Image 2) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/30 text-[#E8AF66] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
              <span className="text-xs">&diams;</span>
              <span>OUR WORK</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Real Transformations. Proven Results.
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 max-w-lg mt-0.5 font-normal leading-relaxed">
              {effectiveSubtitle}
            </p>
          </div>

          <Link
            href={targetGalleryUrl}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FAD293] hover:text-[#fff] px-3.5 py-1.5 rounded-xl border border-[#FAD293]/30 hover:border-[#FAD293] bg-[#161310] transition-all hover:brightness-110 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2. Empty State Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-[#121316]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#E8AF66]/10 border border-[#E8AF66]/30 flex items-center justify-center mx-auto text-[#FAD293]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">
            {targetTabLabel} Showcase Coming Soon
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            New transformations and projects for this category are being documented. Explore our full gallery to view completed work across all services.
          </p>
          <div className="pt-2">
            <Link
              href={targetGalleryUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-md cursor-pointer"
            >
              <span>Explore Full Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-4">
      {/* 1. Header Row (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          {/* Gold Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/30 text-[#E8AF66] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
            <span className="text-xs">&diams;</span>
            <span>OUR WORK</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Real Transformations. Proven Results.
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 max-w-lg mt-0.5 font-normal leading-relaxed">
            {effectiveSubtitle}
          </p>
        </div>

        <Link
          href={targetGalleryUrl}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FAD293] hover:text-[#fff] px-3.5 py-1.5 rounded-xl border border-[#FAD293]/30 hover:border-[#FAD293] bg-[#161310] transition-all hover:brightness-110 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <span>View All Gallery</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Main Interactive Showcase Card */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-[#121316]/95 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous project"
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/80 hover:bg-[#FAD293] text-white hover:text-black border border-white/20 hover:border-[#FAD293] flex items-center justify-center transition-all shadow-xl cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next project"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/80 hover:bg-[#FAD293] text-white hover:text-black border border-white/20 hover:border-[#FAD293] flex items-center justify-center transition-all shadow-xl cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Content: Media Viewer + Project Details */}
        <div
          className={
            layout === "stacked"
              ? "flex flex-col gap-4"
              : "grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
          }
        >
          {/* Media Area: Before/After Slider or Active Video / Photo */}
          <div
            className={
              layout === "stacked" ? "w-full relative" : "md:col-span-7 relative"
            }
          >
            {activeMedia && activeMedia.media_type === "video" ? (
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl flex items-center justify-center group">
                <video
                  src={activeMedia.media_file_full_path}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setVideoModalUrl(activeMedia.media_file_full_path)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 hover:bg-[#FAD293] text-white hover:text-black border border-white/20 transition cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : activeMedia && activeMedia.media_type === "image" ? (
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
                <img
                  src={activeMedia.media_file_full_path}
                  alt={activeMedia.label || currentProject.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/75 border border-white/20 text-white">
                  {activeMedia.label || "PREVIEW"}
                </div>
              </div>
            ) : (
              <BeforeAfterSlider
                beforeImage={
                  currentProject.before_image ||
                  currentProject.media[0]?.media_file_full_path ||
                  "/images/bodywork/bodywork_before.jpg"
                }
                afterImage={
                  currentProject.after_image ||
                  currentProject.media[1]?.media_file_full_path ||
                  currentProject.media[0]?.media_file_full_path ||
                  "/images/bodywork/bodywork_after.jpg"
                }
                alt={currentProject.title}
                aspectRatio="aspect-[16/9.5]"
              />
            )}
          </div>

          {/* Info Area: Title, Description, Media Badges */}
          <div
            className={
              layout === "stacked"
                ? "w-full flex flex-col justify-center space-y-3"
                : "md:col-span-5 flex flex-col justify-center space-y-3 pl-0 md:pl-2"
            }
          >
            <div>
              <span className="text-[10px] font-bold text-[#E8AF66] uppercase tracking-wider block mb-1">
                {currentProject.category_name || categoryName}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white leading-snug tracking-tight">
                {currentProject.title}
              </h4>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-normal line-clamp-2">
              {currentProject.description}
            </p>

            {/* Badges: Videos & Images */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {videoCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300">
                  <Film className="w-3 h-3 text-[#FAD293]" />
                  <span>
                    {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                  </span>
                </span>
              )}

              {imageCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300">
                  <ImageIcon className="w-3 h-3 text-[#FAD293]" />
                  <span>
                    {imageCount} {imageCount === 1 ? "Image" : "Images"}
                  </span>
                </span>
              )}

              {currentProject.tags && currentProject.tags[0] && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/30 text-[10px] font-bold text-[#E8AF66]">
                  {currentProject.tags[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Thumbnails Row (5 items) */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {thumbnails.map((t, idx) => {
              const isSelected =
                (t.type === "slider" && activeMedia === null) ||
                (t.media && activeMedia?.id === t.media.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (t.type === "slider") {
                      setActiveMedia(null);
                    } else if (t.media) {
                      setActiveMedia(t.media);
                    }
                  }}
                  className={`group relative rounded-xl overflow-hidden aspect-[16/10] border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "border-[#FAD293] ring-1 ring-[#FAD293]/60 shadow-[0_0_12px_rgba(250,210,147,0.3)]"
                      : "border-zinc-800/80 hover:border-zinc-600 bg-black/60"
                  }`}
                >
                  <img
                    src={t.thumbnail}
                    alt={t.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Play icon overlay for videos */}
                  {t.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/75 border border-[#FAD293] flex items-center justify-center text-[#FAD293] group-hover:scale-110 transition-transform">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Label on bottom */}
                  <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] sm:text-[10px] font-bold text-white truncate block">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Dot Pagination */}
        {projects.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
            {projects.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveMedia(null);
                  setCurrentIndex(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === i
                    ? "w-6 bg-gradient-to-r from-[#FAD293] to-[#CEA46B]"
                    : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Modal Lightbox */}
      {videoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setVideoModalUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-[#141518] border border-zinc-800 p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-[#FAD293] uppercase tracking-wider">
                {currentProject.title}
              </span>
              <button
                type="button"
                onClick={() => setVideoModalUrl(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <video
                src={videoModalUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
