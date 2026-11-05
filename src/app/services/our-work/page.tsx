"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Search,
  Play,
  Film,
  Camera,
  ArrowRight,
  ChevronDown,
  Wrench,
  X,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Maximize2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Grid,
} from "lucide-react";
import BeforeAfterSlider from "@/components/gallery/BeforeAfterSlider";
import {
  GalleryItem,
  GalleryMediaItem,
  getAllGalleryProjects,
  matchCategory,
  MMC_SERVICE_CATEGORIES,
} from "@/lib/service/gallery.api";

type MediaViewFilter = "all" | "videos" | "photos" | "before-after";

function OurWorkGalleryContent() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const paramCategory = searchParams.get("category");
  const paramCategoryId = searchParams.get("category_id");
  const paramService = searchParams.get("service");

  // Helper to resolve canonical category from raw parameters
  const resolveCategoryFromParams = (
    catName?: string | null,
    catId?: string | null,
    srv?: string | null
  ) => {
    const rawCat = catName || srv;
    const rawCatId = catId;

    if (rawCatId && rawCatId !== "all") {
      const match = MMC_SERVICE_CATEGORIES.find(
        (c) => c.id === rawCatId || c.aliases.includes(rawCatId)
      );
      if (match) return { label: match.label, id: match.id, name: match.name };
    }

    if (rawCat && rawCat !== "All") {
      const clean = rawCat.toLowerCase().trim();
      const match = MMC_SERVICE_CATEGORIES.find(
        (c) =>
          c.name.toLowerCase() === clean ||
          c.label.toLowerCase() === clean ||
          c.aliases.some((a) => clean.includes(a) || a.includes(clean))
      );
      if (match) return { label: match.label, id: match.id, name: match.name };
      return { label: rawCat, id: null, name: rawCat };
    }

    return { label: "All", id: null, name: "All" };
  };

  const initialCat = resolveCategoryFromParams(
    paramCategory,
    paramCategoryId,
    paramService
  );

  const [projects, setProjects] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat.label);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCat.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaView, setMediaView] = useState<MediaViewFilter>("all");

  // Modal detail state
  const [selectedProjectForModal, setSelectedProjectForModal] =
    useState<GalleryItem | null>(null);
  const [modalActiveMedia, setModalActiveMedia] =
    useState<GalleryMediaItem | null>(null);

  // Direct video lightbox state (for 1-click video playback)
  const [activeVideoModal, setActiveVideoModal] = useState<{
    url: string;
    title: string;
    projectTitle?: string;
  } | null>(null);

  // Direct photo lightbox state
  const [activePhotoModal, setActivePhotoModal] = useState<{
    url: string;
    label: string;
    projectTitle?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAllGalleryProjects()
      .then((items) => {
        if (!isMounted) return;
        setProjects(items);
      })
      .catch((err) => {
        console.error("Failed to load gallery projects:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync category from URL query parameters
  useEffect(() => {
    const resolved = resolveCategoryFromParams(
      paramCategory,
      paramCategoryId,
      paramService
    );
    setSelectedCategory(resolved.label);
    setSelectedCategoryId(resolved.id);
  }, [paramCategory, paramCategoryId, paramService]);

  // Category tabs directly matching canonical MMC services
  const categoryTabs = useMemo(() => {
    return MMC_SERVICE_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.label,
    }));
  }, []);

  // Filtered projects based on selectedCategory and searchQuery (100% dynamic)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Category Filter using matchCategory
      if (selectedCategory !== "All") {
        const matches = matchCategory(
          p,
          selectedCategory,
          selectedCategoryId || paramCategoryId || undefined
        );
        if (!matches) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const textToSearch = [
          p.title,
          p.description,
          p.category_name,
          ...(p.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return textToSearch.includes(query);
      }

      return true;
    });
  }, [projects, selectedCategory, selectedCategoryId, paramCategoryId, searchQuery]);

  // Extract ALL individual videos in filtered projects
  const allCategoryVideos = useMemo(() => {
    const list: Array<{
      id: string;
      project: GalleryItem;
      media: GalleryMediaItem;
    }> = [];

    filteredProjects.forEach((p) => {
      p.media
        .filter((m) => m.media_type === "video")
        .forEach((m, idx) => {
          list.push({
            id: m.id || `${p.id}-v-${idx}`,
            project: p,
            media: m,
          });
        });
    });

    return list;
  }, [filteredProjects]);

  // Extract ALL individual photos in filtered projects
  const allCategoryPhotos = useMemo(() => {
    const list: Array<{
      id: string;
      project: GalleryItem;
      media: GalleryMediaItem;
    }> = [];

    filteredProjects.forEach((p) => {
      p.media
        .filter((m) => m.media_type === "image")
        .forEach((m, idx) => {
          list.push({
            id: m.id || `${p.id}-i-${idx}`,
            project: p,
            media: m,
          });
        });

      // Also include before and after images if not in media
      if (p.before_image && !p.media.some((m) => m.media_file_full_path === p.before_image)) {
        list.push({
          id: `${p.id}-before`,
          project: p,
          media: {
            id: `${p.id}-before`,
            media_type: "image",
            media_file_full_path: p.before_image,
            label: "Before Transformation",
          },
        });
      }
      if (p.after_image && !p.media.some((m) => m.media_file_full_path === p.after_image)) {
        list.push({
          id: `${p.id}-after`,
          project: p,
          media: {
            id: `${p.id}-after`,
            media_type: "image",
            media_file_full_path: p.after_image,
            label: "After Transformation",
          },
        });
      }
    });

    return list;
  }, [filteredProjects]);

  // Extract all Before & After projects
  const allBeforeAfterProjects = useMemo(() => {
    return filteredProjects.filter(
      (p) => Boolean(p.before_image && p.after_image)
    );
  }, [filteredProjects]);

  const handleOpenModal = (project: GalleryItem) => {
    setSelectedProjectForModal(project);
    const firstVid = project.media.find((m) => m.media_type === "video");
    if (firstVid && project.title.toLowerCase().includes("video")) {
      setModalActiveMedia(firstVid);
    } else {
      setModalActiveMedia(null);
    }
  };

  const handleModalNext = () => {
    if (!selectedProjectForModal) return;
    const currentIdx = filteredProjects.findIndex(
      (p) => p.id === selectedProjectForModal.id
    );
    const nextIdx = currentIdx < filteredProjects.length - 1 ? currentIdx + 1 : 0;
    handleOpenModal(filteredProjects[nextIdx]);
  };

  const handleModalPrev = () => {
    if (!selectedProjectForModal) return;
    const currentIdx = filteredProjects.findIndex(
      (p) => p.id === selectedProjectForModal.id
    );
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : filteredProjects.length - 1;
    handleOpenModal(filteredProjects[prevIdx]);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white selection:bg-[#FAD293] selection:text-black relative overflow-x-hidden pb-20">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(232,175,102,0.16),rgba(10,11,14,0))] z-0" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#E8AF66]/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-[#CEA46B]/8 blur-[110px] pointer-events-none z-0" />

      {/* Top Hero Section (Matching Image 3) */}
      <div className="relative pt-6 sm:pt-10 pb-10 px-4 sm:px-8 lg:px-[50px] max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto z-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 mb-6"
        >
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-zinc-600">&gt;</span>
          <Link href="/services" className="hover:text-white transition-colors">
            Services
          </Link>
          <span className="text-zinc-600">&gt;</span>
          <span className="text-[#FAD293] font-medium">Our Work</span>
        </nav>

        {/* Hero Header Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-[#121316]/90 p-8 sm:p-12 lg:p-14 shadow-2xl mb-8">
          {/* Background Ambient Car Image */}
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-2/3 pointer-events-none opacity-40 select-none z-0">
            <Image
              src="/images/bodywork/hero_bodywork_car.jpg"
              alt="MMC Showcase Fleet"
              fill
              priority
              className="object-cover object-center lg:object-right mix-blend-luminosity brightness-90 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121316] via-[#121316]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-black uppercase tracking-wider mb-4">
                <span>&diams;</span>
                <span>OUR WORK</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
                Our Work <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #FAD293 0%, #E8AF66 50%, #CEA46B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Gallery
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-xl">
                Explore our complete range of transformations, from performance
                upgrades to aesthetic enhancements. Real projects. Real results.
              </p>
            </div>

            {/* Script Slogan on the Right (Matching Image 3) */}
            <div className="hidden lg:block text-right self-center">
              <div
                className="text-3xl xl:text-4xl font-serif italic font-light tracking-wide text-transparent bg-clip-text select-none"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #FAD293 0%, #E8AF66 60%, #CEA46B 100%)",
                  filter: "drop-shadow(0 4px 12px rgba(250,210,147,0.25))",
                }}
              >
                Same Car.
                <br />
                Bigger Dreams.
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Category Tabs + Search Input (Matching Image 3) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoryTabs.map((tab) => {
              const isActive =
                (tab.label === "All" && selectedCategory === "All") ||
                (selectedCategory !== "All" &&
                  (selectedCategory.toLowerCase() === tab.label.toLowerCase() ||
                    selectedCategory.toLowerCase() === tab.name.toLowerCase() ||
                    (selectedCategoryId && selectedCategoryId === tab.id)));
  return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.label);
                    setSelectedCategoryId(tab.id === "all" ? null : tab.id);
                    setMediaView("all");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black shadow-lg shadow-[#d09a50]/20"
                      : "bg-[#141518] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, cars, upgrades..."
              className="w-full bg-[#141518] border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FAD293] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Information & Media View Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141518]/90 border border-zinc-800/80 mb-8 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FAD293] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white">
              {selectedCategory === "All" ? "All Categories" : selectedCategory}
            </span>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              ({filteredProjects.length} {filteredProjects.length === 1 ? "Project" : "Projects"} &bull; {allCategoryVideos.length} Videos &bull; {allCategoryPhotos.length} Photos)
            </span>
          </div>

          {/* Sub-Tabs: Switch between All Projects, All Videos, All Photos, Before & After */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setMediaView("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mediaView === "all"
                  ? "bg-[#FAD293] text-black"
                  : "bg-black/50 text-zinc-300 hover:text-white border border-white/5"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Projects ({filteredProjects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMediaView("videos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mediaView === "videos"
                  ? "bg-[#FAD293] text-black"
                  : "bg-black/50 text-zinc-300 hover:text-white border border-white/5"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos ({allCategoryVideos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMediaView("photos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mediaView === "photos"
                  ? "bg-[#FAD293] text-black"
                  : "bg-black/50 text-zinc-300 hover:text-white border border-white/5"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({allCategoryPhotos.length})</span>
            </button>

            {allBeforeAfterProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setMediaView("before-after")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mediaView === "before-after"
                    ? "bg-[#FAD293] text-black"
                    : "bg-black/50 text-zinc-300 hover:text-white border border-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Before/After ({allBeforeAfterProjects.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PROJECTS GRID (Matching Image 3 12-Card Grid)                     */}
        {/* ========================================================================= */}
        {mediaView === "all" && (
          filteredProjects.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-3xl bg-[#121316]/90 border border-zinc-800/80 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[#E8AF66]/10 border border-[#E8AF66]/30 flex items-center justify-center mx-auto mb-4 text-[#FAD293]">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Gallery Items Uploaded Yet
              </h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
                We haven&apos;t uploaded showcase projects for{" "}
                <span className="text-[#FAD293] font-semibold">{selectedCategory}</span> yet.
                Once added in the admin panel, they will appear here automatically.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedCategoryId(null);
                    setMediaView("all");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition cursor-pointer"
                >
                  View All Categories
                </button>
                <Link
                  href="/contact"
                  className="px-5 py-2.5 rounded-xl bg-[#1c1d22] border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition"
                >
                  Request A Quote
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProjects.map((project) => {
                const isVideoOnly =
                  project.media.some((m) => m.media_type === "video") &&
                  project.title.toLowerCase().includes("video");

                const isBeforeAfter =
                  Boolean(project.before_image && project.after_image) &&
                  !isVideoOnly;

                const videoDuration =
                  project.media.find((m) => m.media_type === "video")?.duration ||
                  "02:48";

                const photosCount =
                  project.media.filter((m) => m.media_type === "image").length ||
                  (project.before_image ? 2 : 1);

                const videosCount = project.media.filter(
                  (m) => m.media_type === "video"
                ).length;

                return (
                  <div
                    key={project.id}
                    className="group rounded-2xl border border-zinc-800/90 bg-[#121316] hover:border-[#FAD293]/50 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleOpenModal(project)}
                  >
                    {/* Media Preview Area */}
                    <div className="relative aspect-[16/10] w-full bg-black overflow-hidden">
                      {isVideoOnly ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={
                              project.after_image ||
                              project.media[0]?.thumbnail_full_path ||
                              project.media[0]?.media_file_full_path ||
                              project.before_image ||
                              "/images/bodywork/hero_bodywork_car.jpg"
                            }
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                          {/* Video Tag */}
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 border border-white/20 text-white">
                            Video
                          </span>

                          {/* Play Button */}
                          <div className="w-11 h-11 rounded-full bg-black/75 border-2 border-[#FAD293] flex items-center justify-center text-[#FAD293] shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>

                          {/* Duration */}
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-zinc-300">
                            {videoDuration}
                          </span>
                        </div>
                      ) : isBeforeAfter ? (
                        <div className="relative w-full h-full">
                          <div className="absolute inset-0 grid grid-cols-2">
                            <div className="relative h-full overflow-hidden border-r border-[#FAD293]/60">
                              <img
                                src={project.before_image}
                                alt={`${project.title} Before`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/80 text-white">
                                BEFORE
                              </span>
                            </div>
                            <div className="relative h-full overflow-hidden">
                              <img
                                src={project.after_image}
                                alt={`${project.title} After`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FAD293] text-black">
                                AFTER
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={
                              project.after_image ||
                              project.media[0]?.media_file_full_path ||
                              project.before_image ||
                              "/images/bodywork/hero_bodywork_car.jpg"
                            }
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {project.category_name && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 border border-white/20 text-[#FAD293]">
                              {project.category_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#E8AF66] uppercase tracking-wider block mb-1">
                          {project.category_name}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#FAD293] transition-colors leading-snug">
                          {project.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {/* Card Bottom: Badges & View Details */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          {photosCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera className="w-3 h-3 text-[#FAD293]" />
                              <span>{photosCount} Photos</span>
                            </span>
                          )}

                          {videosCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Film className="w-3 h-3 text-[#FAD293]" />
                              <span>{videosCount} Video</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="text-[#FAD293] group-hover:text-white font-bold flex items-center gap-1 transition-colors text-xs"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Card CTA: Have a Custom Project in Mind? (Matching Image 3) */}
              <div className="rounded-2xl border border-[#FAD293]/30 bg-gradient-to-br from-[#1A1612] via-[#14120F] to-[#0E0C0A] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] group-hover:scale-110 transition-transform shadow-inner">
                    <Wrench className="w-5 h-5 text-[#FAD293]" />
                  </div>

                  <h3 className="text-lg font-black text-white leading-snug">
                    Have a Custom Project in Mind?
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Let&apos;s bring your vision to life. Get in touch with our team
                    for a personalized consultation.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black font-black text-xs uppercase tracking-wider text-center transition hover:brightness-105 active:scale-95 shadow-lg shadow-[#d09a50]/20 flex items-center justify-center gap-1.5"
                >
                  <span>Contact Us</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        )}
        {/* ========================================================================= */}
        {/* VIEW 2: ALL VIDEOS IN CATEGORY (Direct 1-Click Playback)                  */}
        {/* ========================================================================= */}
        {mediaView === "videos" && (
          <div className="space-y-4">
            {allCategoryVideos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#141518] border border-zinc-800">
                <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">
                  No video clips found for this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {allCategoryVideos.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-zinc-800/90 bg-[#121316] hover:border-[#FAD293] p-4 space-y-3 shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                    onClick={() =>
                      setActiveVideoModal({
                        url: item.media.media_file_full_path,
                        title: item.media.label || "Exhaust & Dyno Sound Clip",
                        projectTitle: item.project.title,
                      })
                    }
                  >
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={
                          item.media.thumbnail_full_path ||
                          item.media.media_file_full_path ||
                          item.project.after_image ||
                          item.project.before_image ||
                          "/images/bodywork/hero_bodywork_car.jpg"
                        }
                        alt={item.media.label || item.project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                      {/* Play Button */}
                      <div className="w-12 h-12 rounded-full bg-black/80 border-2 border-[#FAD293] flex items-center justify-center text-[#FAD293] shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>

                      {/* Duration */}
                      {item.media.duration && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-zinc-300">
                          {item.media.duration}
                        </span>
                      )}

                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/75 border border-white/20 text-[#FAD293]">
                        {item.project.category_name}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FAD293] transition-colors leading-snug">
                        {item.media.label || "Action Clip"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {item.project.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ALL PHOTOS IN CATEGORY (Direct High-Res Gallery)                  */}
        {/* ========================================================================= */}
        {mediaView === "photos" && (
          <div className="space-y-4">
            {allCategoryPhotos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#141518] border border-zinc-800">
                <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">
                  No photos found for this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allCategoryPhotos.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-800 bg-[#121316] hover:border-[#FAD293] transition-all cursor-pointer shadow-xl hover:-translate-y-1"
                    onClick={() =>
                      setActivePhotoModal({
                        url: item.media.media_file_full_path,
                        label: item.media.label || item.project.title,
                        projectTitle: item.project.title,
                      })
                    }
                  >
                    <img
                      src={item.media.media_file_full_path}
                      alt={item.media.label || item.project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="text-[10px] text-[#FAD293] uppercase font-mono block truncate">
                        {item.project.category_name}
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {item.media.label || item.project.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: BEFORE & AFTER GRID                                               */}
        {/* ========================================================================= */}
        {mediaView === "before-after" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allBeforeAfterProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-3xl border border-zinc-800/90 bg-[#121316] p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#E8AF66] uppercase tracking-wider block">
                      {project.category_name}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {project.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(project)}
                    className="text-xs font-bold text-[#FAD293] hover:underline"
                  >
                    Full Details &rarr;
                  </button>
                </div>

                <BeforeAfterSlider
                  beforeImage={project.before_image!}
                  afterImage={project.after_image!}
                  alt={project.title}
                  aspectRatio="aspect-[16/10]"
                />

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Bottom "SCROLL TO EXPLORE MORE" (Matching Image 3) */}
        <div className="flex flex-col items-center justify-center gap-1.5 mt-16 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          <span>SCROLL TO EXPLORE MORE</span>
          <div className="w-7 h-7 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 animate-bounce">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1-CLICK DIRECT VIDEO PLAYER LIGHTBOX                                      */}
      {/* ========================================================================= */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-[#141518] border border-zinc-800 p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-[#FAD293] uppercase tracking-wider block">
                  {activeVideoModal.projectTitle || "Video Clip"}
                </span>
                <h3 className="text-base font-bold text-white">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <video
                src={activeVideoModal.url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-CLICK DIRECT PHOTO LIGHTBOX                                             */}
      {/* ========================================================================= */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-[#141518] border border-zinc-800 p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-[#FAD293] uppercase tracking-wider block">
                  {activePhotoModal.projectTitle || "Photo Gallery"}
                </span>
                <h3 className="text-base font-bold text-white">
                  {activePhotoModal.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <img
                src={activePhotoModal.url}
                alt={activePhotoModal.label}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE PROJECT DETAILS MODAL WITH ALL PHOTOS & VIDEOS              */}
      {/* ========================================================================= */}
      {selectedProjectForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-5 md:p-8 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedProjectForModal(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-[#141518] border border-[#FAD293]/30 p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-left my-auto space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Prev/Next Project Navigation */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-[#E8AF66] uppercase tracking-wider block mb-1">
                  {selectedProjectForModal.category_name}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedProjectForModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleModalPrev}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
                  title="Previous Project in Category"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleModalNext}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
                  title="Next Project in Category"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProjectForModal(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Area: Slider or Active Video / Image */}
            <div className="relative">
              {modalActiveMedia && modalActiveMedia.media_type === "video" ? (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
                  <video
                    src={modalActiveMedia.media_file_full_path}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : modalActiveMedia && modalActiveMedia.media_type === "image" ? (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
                  <img
                    src={modalActiveMedia.media_file_full_path}
                    alt={modalActiveMedia.label || selectedProjectForModal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : selectedProjectForModal.before_image &&
                selectedProjectForModal.after_image ? (
                <BeforeAfterSlider
                  beforeImage={selectedProjectForModal.before_image}
                  afterImage={selectedProjectForModal.after_image}
                  alt={selectedProjectForModal.title}
                  aspectRatio="aspect-[16/9]"
                />
              ) : (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800">
                  <img
                    src={
                      selectedProjectForModal.after_image ||
                      selectedProjectForModal.media[0]?.media_file_full_path ||
                      selectedProjectForModal.before_image ||
                      "/images/bodywork/hero_bodywork_car.jpg"
                    }
                    alt={selectedProjectForModal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Thumbnails to Switch Media inside Modal */}
            {selectedProjectForModal.media.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {selectedProjectForModal.before_image &&
                  selectedProjectForModal.after_image && (
                    <button
                      type="button"
                      onClick={() => setModalActiveMedia(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        modalActiveMedia === null
                          ? "bg-[#FAD293] text-black"
                          : "bg-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Before / After Slider</span>
                    </button>
                  )}

                {selectedProjectForModal.media.map((m, idx) => (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setModalActiveMedia(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      modalActiveMedia?.id === m.id
                        ? "bg-[#FAD293] text-black"
                        : "bg-zinc-800 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {m.media_type === "video" ? (
                      <Film className="w-3.5 h-3.5 text-[#FAD293]" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>{m.label || `Media ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Project Details & Specifications */}
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedProjectForModal.description}
              </p>

              {/* Specs Grid */}
              {selectedProjectForModal.specs &&
                selectedProjectForModal.specs.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/50 border border-zinc-800/80">
                    {selectedProjectForModal.specs.map((s, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          {s.label}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              {/* Tags */}
              {selectedProjectForModal.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedProjectForModal.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Verified work completed by accredited MMC specialists.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={
                    selectedProjectForModal.category_name?.toLowerCase().includes("body")
                      ? "/services/bodywork"
                      : selectedProjectForModal.category_name?.toLowerCase().includes("alloy")
                      ? "/services/alloy-wheel"
                      : "/services/modification"
                  }
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black font-black text-xs uppercase tracking-wider text-center transition hover:brightness-105 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Book This Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedProjectForModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OurWorkGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#FAD293] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OurWorkGalleryContent />
    </Suspense>
  );
}
