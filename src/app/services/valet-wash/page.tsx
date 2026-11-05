"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Car,
  Sparkles,
  MapPin,
  Camera,
  Upload,
  X,
  ShieldCheck,
  Zap,
  Clock,
  Droplets,
  AlertTriangle,
  Check,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Info,
  CheckSquare,
  Square,
  Flame,
  Layers,
  Wind,
  Footprints,
  Brush,
  Wrench,
  Lightbulb,
  Heart,
  Baby,
  Map as MapIcon,
  HelpCircle,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  getWashTypes,
  WashTypeItem,
  DEFAULT_VALET_PACKAGES,
  extractDisplayPrice,
  getValetQuestions,
  ValetQuestionItem,
  VALET_CATEGORY_ID,
  getValetServiceImageUrl,
} from "@/lib/service/valet.api";
import { LocationPickerModal } from "@/components/common/LocationPickerModal";
import { type SelectedLocationData } from "@/lib/service/address.helper";
import { useToast } from "@/components/ToastProvider";
import ServiceOurWorkShowcase from "@/components/gallery/ServiceOurWorkShowcase";
import {
  saveServiceFormDraft,
  getServiceFormDraft,
} from "@/lib/serviceFormDraft";

export default function VehicleWashValetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Location Picker Modal State (Map in Pop-up) ───
  const [showLocationModal, setShowLocationModal] = useState(false);

  // ─── Core Services (Multi-Select Support) ───
  const [washTypes, setWashTypes] = useState<WashTypeItem[]>(DEFAULT_VALET_PACKAGES);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [packageViewMode, setPackageViewMode] = useState<"list" | "grid">("list");

  // ─── Dynamic Questions from Backend API ───
  const [questions, setQuestions] = useState<ValetQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});

  // ─── Vehicle Details (Empty by default with clean placeholders) ───
  const [carReg, setCarReg] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");

  // ─── Location & Address (Empty by default) ───
  const [locationAddress, setLocationAddress] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [serviceAddressId, setServiceAddressId] = useState("");

  // ─── Optional Photos Upload ───
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { file?: File; preview: string; name: string }[]
  >([]);

  // ─── Notes & Special Conditions (Empty by default) ───
  const [specialConditions, setSpecialConditions] = useState("");
  const [notes, setNotes] = useState("");

  // ─── Privacy Policy Agreement ───
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  // ─── Load Dynamic Wash Types & Dynamic Questions from API ───
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        setLoadingServices(true);
        setLoadingQuestions(true);

        const [types, fetchedQuestions] = await Promise.all([
          getWashTypes(20, 1),
          getValetQuestions(VALET_CATEGORY_ID),
        ]);

        if (!isMounted) return;

        if (types && types.length > 0) {
          setWashTypes(types);
        }

        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
        }

        // Restore vehicle & location details from draft if saved previously in this session
        // Note: selectedServiceIds is intentionally not auto-selected so default is strictly 0 selected
        if (typeof window !== "undefined") {
          const savedRequest = sessionStorage.getItem("mmc_valet_request");
          if (savedRequest) {
            try {
              const parsed = JSON.parse(savedRequest);
              if (parsed.carReg) setCarReg(parsed.carReg);
              if (parsed.carModel) setCarModel(parsed.carModel);
              if (parsed.carColor) setCarColor(parsed.carColor);
              if (parsed.vehicleSize) setVehicleSize(parsed.vehicleSize);
              if (parsed.locationAddress) setLocationAddress(parsed.locationAddress);
              if (parsed.street) setStreet(parsed.street);
              if (parsed.city) setCity(parsed.city);
              if (parsed.postcode) setPostcode(parsed.postcode);
              if (parsed.specialConditions) setSpecialConditions(parsed.specialConditions);
              if (parsed.notes) setNotes(parsed.notes);
              if (parsed.answers && typeof parsed.answers === "object") {
                setDynamicAnswers(parsed.answers);
              }
            } catch (e) {
              console.warn("Could not parse saved valet request:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error initializing valet data:", err);
      } finally {
        if (isMounted) {
          setLoadingServices(false);
          setLoadingQuestions(false);
        }
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Multi-Service Selection Handler (Allows 0 or multiple selected) ───
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // ─── Selected Services Memos ───
  const selectedServices = useMemo(() => {
    return washTypes.filter((w) => selectedServiceIds.includes(w.id));
  }, [washTypes, selectedServiceIds]);

  const totalStartingPrice = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    return selectedServices.reduce((sum, item) => {
      const price = extractDisplayPrice(item);
      return sum + (price > 0 ? price : 45);
    }, 0);
  }, [selectedServices]);

  // ─── Dynamic Answer Updaters ───
  const setQuestionSingleAnswer = (questionId: string, answer: string) => {
    setDynamicAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === answer ? "" : answer,
    }));
  };

  const toggleQuestionMultiAnswer = (questionId: string, option: string) => {
    setDynamicAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const updated = current.includes(option)
        ? current.filter((x: string) => x !== option)
        : [...current, option];
      return {
        ...prev,
        [questionId]: updated,
      };
    });
  };

  const setQuestionSubAnswer = (
    questionId: string,
    subKey: string,
    val: "Yes" | "No"
  ) => {
    setDynamicAnswers((prev) => {
      const current =
        typeof prev[questionId] === "object" && !Array.isArray(prev[questionId])
          ? prev[questionId]
          : {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          [subKey]: val,
        },
      };
    });
  };

  // ─── Image Upload Handler ───
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    showToast(`${files.length} photo(s) added successfully`, "success");
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Location Selection from Pop-up Modal ───
  const handleLocationSelected = (data: SelectedLocationData) => {
    setLocationAddress(data.address);
    if (data.postcode) setPostcode(data.postcode);
    if (data.street) setStreet(data.street);
    if (data.city) setCity(data.city);
    if (data.latitude) setLatitude(Number(data.latitude));
    if (data.longitude) setLongitude(Number(data.longitude));
    if (data.backendAddressId) setServiceAddressId(String(data.backendAddressId));
    setShowLocationModal(false);
    showToast("Location updated successfully", "success");
  };

  // ─── Review Request & Navigate to Providers (Screen 2) ───
  const handleReviewRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationAddress) {
      showToast("Please select your doorstep location on the map", "error");
      setShowLocationModal(true);
      return;
    }

    if (!carReg.trim()) {
      showToast("Please enter your vehicle registration number", "error");
      return;
    }

    if (!privacyAgreed) {
      showToast("Please accept the Privacy Policy to proceed", "error");
      return;
    }

    const primaryService = selectedServices[0] || washTypes[0];

    const requestSummary = {
      selectedServiceIds,
      selectedServiceId: primaryService ? primaryService.id : "",
      selectedServiceName:
        selectedServices.length > 0
          ? selectedServices.map((s) => s.name).join(" + ")
          : "Vehicle Valet Wash",
      selectedServiceNames: selectedServices.map((s) => s.name),
      carReg: carReg.trim().toUpperCase(),
      carModel: carModel.trim() || "Vehicle",
      carColor: carColor.trim() || "Standard",
      vehicleSize: vehicleSize || "Medium SUV",
      locationAddress,
      street,
      city,
      postcode,
      latitude,
      longitude,
      serviceAddressId: serviceAddressId || "2",
      specialConditions,
      notes,
      answers: dynamicAnswers,
      totalStartingPrice,
      hasUploadedPhotos: uploadedPhotos.length > 0,
    };

    // Store in sessionStorage for Screen 2 (Choose Detailers)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("mmc_valet_request", JSON.stringify(requestSummary));
      saveServiceFormDraft("valet", requestSummary);
    }

    showToast("Request created. Searching matched detailers...", "success");

    // Navigate to Screen 2 ("Choose Detailers")
    const query = new URLSearchParams({
      service_id: primaryService?.id || "",
      service_ids: selectedServiceIds.join(","),
      service_name: selectedServices.length > 0
        ? selectedServices.map((s) => s.name).join(" + ")
        : primaryService?.name || "Vehicle Valet Wash",
      location: locationAddress,
      reg: carReg.trim().toUpperCase(),
    }).toString();

    router.push(`/services/valet-wash/providers?${query}`);
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white pb-24 relative overflow-x-hidden">
      {/* Background Ambient Gold Glows */}
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] lg:w-[1200px] h-[500px] rounded-full blur-[160px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B, transparent)",
        }}
      />
      <div
        className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #CEA46B, transparent)",
        }}
      />

      {/* ─── Breadcrumb & Hero Header Section ─── */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent pt-3 sm:pt-4 pb-6 relative z-20">
        <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-[#FAD293] hover:border-[#FAD293]/40 transition"
              >
                <ChevronLeft size={14} />
                <span>All Services</span>
              </Link>
              <span>/</span>
              <Link href="/services" className="hover:text-white transition">
                Services
              </Link>
              <span>/</span>
              <span className="text-[#FAD293] font-semibold">
                Vehicle Wash & Valet
              </span>
            </div>

            {/* Live Doorstep Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mobile Detailing Units Active</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FAD293]/30 bg-[#FAD293]/10 text-[#FAD293] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Premium Vehicle Cleaning & Mobile Valet</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
                Vehicle Wash &{" "}
                <span className="bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] bg-clip-text text-transparent">
                  Valet
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
                Choose one or multiple services below, complete your vehicle condition details, and get instant quotes from verified detailers.
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
              <div className="px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#FAD293]/15 text-[#FAD293] flex items-center justify-center shrink-0">
                  <Car size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Clean</div>
                  <div className="text-[10px] text-white/50">Exterior & Interior</div>
                </div>
              </div>

              <div className="px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#FAD293]/15 text-[#FAD293] flex items-center justify-center shrink-0">
                  <Sparkles size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Detailing</div>
                  <div className="text-[10px] text-white/50">Paint & Polish</div>
                </div>
              </div>

              <div className="px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#FAD293]/15 text-[#FAD293] flex items-center justify-center shrink-0">
                  <Clock size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">24/7</div>
                  <div className="text-[10px] text-white/50">Doorstep Visits</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Grid (Left Multi-Select Packages + Right Dynamic Questionnaire Form) ─── */}
      <main className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] pt-6 sm:pt-8 relative z-10">
        <form onSubmit={handleReviewRequest}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ========================================================= */}
            {/* LEFT COLUMN: MULTI-SELECT WASH PACKAGES & VEHICLE PROFILE */}
            {/* ========================================================= */}
            <aside className="lg:col-span-5 space-y-6">
              
              {/* Wash Package Picker (Multi-Select Support) */}
              <div className="rounded-3xl border border-[#FAD293]/30 bg-[#120e0b]/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                      <Droplets size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Choose Wash Packages</h2>
                      <p className="text-[11px] text-white/50">
                        Select one or multiple services
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Switcher: List vs 2-Col Grid */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setPackageViewMode("list")}
                        className={`p-1 rounded-md transition-all ${
                          packageViewMode === "list"
                            ? "bg-[#FAD293] text-black shadow-sm"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="List View with Photo"
                      >
                        <List size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackageViewMode("grid")}
                        className={`p-1 rounded-md transition-all ${
                          packageViewMode === "grid"
                            ? "bg-[#FAD293] text-black shadow-sm"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="2 Cards per row"
                      >
                        <LayoutGrid size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAD293]/15 text-[#FAD293] font-bold border border-[#FAD293]/30 shrink-0">
                      {selectedServiceIds.length} Selected
                    </span>
                  </div>
                </div>

                {loadingServices ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#FAD293]" />
                    <span className="text-xs text-white/50">Loading services...</span>
                  </div>
                ) : packageViewMode === "grid" ? (
                  /* ─── 2-COLUMN GRID VIEW (1 row me 2 cards) ─── */
                  <div className="grid grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {washTypes.map((item) => {
                      const isSelected = selectedServiceIds.includes(item.id);
                      const startingPrice = extractDisplayPrice(item);
                      const imgUrl = getValetServiceImageUrl(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleServiceSelection(item.id)}
                          className={`group relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 select-none overflow-hidden ${
                            isSelected
                              ? "border-[#FAD293] bg-[#FAD293]/15 ring-1 ring-[#FAD293] shadow-[0_0_20px_rgba(250,210,147,0.2)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          {/* Card Image Banner */}
                          <div className="relative w-full aspect-[16/11] bg-zinc-900 overflow-hidden border-b border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={item.name}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== "/valet.png") target.src = "/valet.png";
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                            {/* Checkbox badge in top-right */}
                            <div
                              className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[#FAD293] text-black shadow-md font-bold"
                                  : "bg-black/60 backdrop-blur-sm border border-white/30 text-transparent"
                              }`}
                            >
                              <Check size={12} strokeWidth={3} className={isSelected ? "opacity-100" : "opacity-0"} />
                            </div>

                            {/* Price badge floating at bottom right */}
                            <span className="absolute bottom-1.5 right-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[#FAD293] border border-[#FAD293]/30 shadow-sm">
                              From £{startingPrice > 0 ? startingPrice : 45}
                            </span>
                          </div>

                          {/* Card Info */}
                          <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                            <h3
                              className={`text-xs font-bold leading-snug line-clamp-1 transition-colors ${
                                isSelected ? "text-[#FAD293]" : "text-white"
                              }`}
                            >
                              {item.name}
                            </h3>
                            <p className="text-[10px] text-white/50 line-clamp-2 mt-1 leading-relaxed">
                              {item.short_description || item.description || "Professional vehicle care package"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ─── LIST VIEW WITH PHOTO (Horizontal cards) ─── */
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {washTypes.map((item) => {
                      const isSelected = selectedServiceIds.includes(item.id);
                      const startingPrice = extractDisplayPrice(item);
                      const imgUrl = getValetServiceImageUrl(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleServiceSelection(item.id)}
                          className={`group p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer text-left relative flex items-center gap-3 select-none ${
                            isSelected
                              ? "border-[#FAD293] bg-[#FAD293]/10 shadow-[0_0_20px_rgba(250,210,147,0.18)] ring-1 ring-[#FAD293]/50"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          {/* Left: Service Image Thumbnail */}
                          <div className="relative w-20 h-20 sm:w-22 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={item.name}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== "/valet.png") target.src = "/valet.png";
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                            {/* Checkbox badge overlay */}
                            <div
                              className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border border-[#FAD293] bg-[#FAD293] text-black shadow-sm font-bold"
                                  : "border border-white/30 bg-black/60 backdrop-blur-sm text-transparent"
                              }`}
                            >
                              <Check size={12} strokeWidth={3} className={isSelected ? "opacity-100" : "opacity-0"} />
                            </div>
                          </div>

                          {/* Right: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3
                                className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                                  isSelected ? "text-[#FAD293]" : "text-white group-hover:text-[#FAD293]"
                                }`}
                              >
                                {item.name}
                              </h3>
                              <span className="text-xs font-extrabold text-[#FAD293] shrink-0">
                                From £{startingPrice > 0 ? startingPrice : 45}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/60 line-clamp-2 mt-1 leading-relaxed">
                              {item.short_description || item.description || "Professional vehicle care package"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Combined Package Total */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60">Combined Starting Total:</span>
                  <span className="text-sm font-extrabold text-[#FAD293]">
                    From £{totalStartingPrice}
                  </span>
                </div>
              </div>

              {/* Vehicle Profile Summary Box */}
              <div className="rounded-3xl border border-white/10 bg-[#120e0b]/80 backdrop-blur-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Car size={16} className="text-[#FAD293]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Vehicle Profile
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAD293]/15 border border-[#FAD293]/30 text-[#FAD293] font-semibold">
                    Live Preview
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div>
                      <div className="text-[10px] text-white/50 uppercase font-semibold">
                        Make & Model
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {carModel.trim() ? carModel : <span className="text-white/30 italic">Enter model on right</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/50 uppercase font-semibold">
                        Color
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {carColor.trim() ? carColor : <span className="text-white/30 italic">Enter color</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAD293]/5 border border-[#FAD293]/20">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-[#F8D053] text-black font-black text-xs tracking-wider border border-black/20 shadow-sm">
                        {carReg.trim() ? carReg : "REG NO"}
                      </div>
                      <div>
                        <div className="text-[10px] text-white/50">Vehicle Size</div>
                        <div className="text-xs font-bold text-[#FAD293]">
                          {vehicleSize || <span className="text-white/30 italic">Not chosen yet</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Guarantee Cards */}
                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 rounded-xl border border-white/8 bg-white/[0.02] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#FAD293] shrink-0" />
                    <span className="text-white/70">100% Vetted Detailers</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-white/8 bg-white/[0.02] flex items-center gap-2">
                    <Zap size={14} className="text-[#FAD293] shrink-0" />
                    <span className="text-white/70">Mobile Water & Power</span>
                  </div>
                </div>
              </div>

              {/* ─── Real Work & Transformation Gallery Section (Fills Left Side) ─── */}
              <div className="pt-2">
                <ServiceOurWorkShowcase
                  categoryId={VALET_CATEGORY_ID}
                  categoryName="Valet & Detailing"
                  serviceTitle="Valet & Detailing Transformations"
                  customSubtitle="Real customer vehicles detailed, protected, and restored by our verified specialist network."
                  viewAllUrl="/services/our-work"
                  layout="stacked"
                />
              </div>
            </aside>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: "Get Instant Quote" Dynamic Questionnaire  */}
            {/* ========================================================= */}
            <section className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-[#FAD293]/35 bg-[#120e0b]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative space-y-6">
                
                {/* Header of Form */}
                <div className="space-y-1.5 pb-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FAD293]">
                      <Sparkles size={14} />
                      <span>Step 2 of 3 • Customise Your Request</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span className="w-5 h-5 rounded-full bg-[#FAD293] text-black flex items-center justify-center text-[10px] font-black">2</span>
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-bold">3</span>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Get Instant Quote
                  </h2>
                  <p className="text-xs sm:text-sm text-white/60">
                    Fill the details below to receive your wash and valet quotation from verified detailers.
                  </p>
                </div>

                {/* ─── 1. Location & Vehicle Inputs ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location Picker Pop-up Button */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#FAD293]" />
                        <span>Select Location (Map in Pop-up)</span>
                      </span>
                      <span className="text-[10px] text-[#FAD293] font-normal">
                        Click below to open interactive map
                      </span>
                    </label>

                    <div
                      onClick={() => setShowLocationModal(true)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 hover:border-[#FAD293]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin size={16} className="text-[#FAD293] shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`text-xs truncate ${locationAddress ? "text-white font-medium" : "text-white/40"}`}>
                          {locationAddress || "Click to choose doorstep address on map..."}
                        </span>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-[#FAD293]/15 text-[#FAD293] text-[11px] font-bold flex items-center gap-1 shrink-0 group-hover:bg-[#FAD293] group-hover:text-black transition">
                        <MapIcon size={12} />
                        <span>Open Map</span>
                      </div>
                    </div>
                  </div>

                  {/* Car Registration Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                      <Car size={13} className="text-[#FAD293]" />
                      <span>Car Registration No</span>
                    </label>
                    <input
                      type="text"
                      value={carReg}
                      onChange={(e) => setCarReg(e.target.value.toUpperCase())}
                      placeholder="e.g. MH-12-AB-1234 or AB24 MMC"
                      required
                      className="w-full h-11 px-4 rounded-2xl bg-black/40 border border-white/15 text-xs font-mono font-bold tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition uppercase"
                    />
                  </div>

                  {/* Vehicle Model & Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                      <Car size={13} className="text-[#FAD293]" />
                      <span>Car Model & Color</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="e.g. Mercedes C-Class"
                        className="w-full h-11 px-3 rounded-2xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                      />
                      <input
                        type="text"
                        value={carColor}
                        onChange={(e) => setCarColor(e.target.value)}
                        placeholder="e.g. Silver"
                        className="w-full h-11 px-3 rounded-2xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── 2. Vehicle Photos (Optional) ─── */}
                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera size={14} className="text-[#FAD293]" />
                        <span>Vehicle Photos (Optional)</span>
                      </div>
                      <p className="text-[11px] text-white/50">
                        Upload photos of the vehicle & any specific areas requiring attention.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-[#FAD293]/40 bg-[#FAD293]/10 hover:bg-[#FAD293]/20 text-[#FAD293] text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Upload size={13} />
                      <span>Upload pictures</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photos Preview Grid */}
                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                      {uploadedPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-xl overflow-hidden border border-white/15 group"
                        >
                          <img
                            src={photo.preview}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── 3. Dynamic Condition Questionnaire from Backend API ─── */}
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#FAD293]" />
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Tell us about the condition
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                      Live Questions API
                    </span>
                  </div>

                  {/* Vehicle Size Picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Vehicle size
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Compact / Hatchback", "Saloon / Estate", "Medium SUV", "Large 4x4 / Van"].map(
                        (sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setVehicleSize(sz)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                              vehicleSize === sz
                                ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_12px_rgba(250,210,147,0.2)]"
                                : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                            }`}
                          >
                            {sz}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {loadingQuestions ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-[#FAD293]" />
                      <span className="text-xs text-white/50">Fetching questionnaire...</span>
                    </div>
                  ) : (
                    /* Render Dynamic Questions Returned from Backend API */
                    questions.map((q) => {
                      const qTextLower = q.question_text.toLowerCase();
                      const currentVal = dynamicAnswers[q.id];

                      // 1. Last Professionally Cleaned
                      if (qTextLower.includes("cleaned") || qTextLower.includes("wash")) {
                        return (
                          <div key={q.id} className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                              {q.question_text}
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                              {q.options.map((opt) => {
                                const isSelected = currentVal === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setQuestionSingleAnswer(q.id, opt)}
                                    className={`py-3 px-2 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                      isSelected
                                        ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.2)] ring-1 ring-[#FAD293]/40"
                                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isSelected && <Check size={13} strokeWidth={3} />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 2. Exterior Condition
                      if (qTextLower.includes("exterior")) {
                        return (
                          <div key={q.id} className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                              {q.question_text}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {q.options.map((opt, idx) => {
                                const isSelected = currentVal === opt;
                                const icons = [Sparkles, ShieldCheck, Droplets, Flame];
                                const Icon = icons[idx % icons.length];
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setQuestionSingleAnswer(q.id, opt)}
                                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition ${
                                      isSelected
                                        ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.2)] ring-1 ring-[#FAD293]/50"
                                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                                    }`}
                                  >
                                    <Icon size={18} />
                                    <span className="text-[11px] font-bold leading-tight">
                                      {opt}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 3. Interior Condition (Multi-Select)
                      if (qTextLower.includes("interior")) {
                        const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                        const hasBiohazard = selectedList.some((s) =>
                          s.toLowerCase().includes("mould") || s.toLowerCase().includes("biohazard")
                        );

                        return (
                          <div key={q.id} className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center justify-between">
                              <span>{q.question_text} (select all that apply)</span>
                              <span className="text-[10px] text-white/40 normal-case">
                                {selectedList.length} selected
                              </span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {q.options.map((opt, idx) => {
                                const isSelected = selectedList.includes(opt);
                                const isWarning =
                                  opt.toLowerCase().includes("mould") ||
                                  opt.toLowerCase().includes("biohazard");
                                const icons = [Sparkles, Droplets, Heart, Wind, Layers, AlertTriangle];
                                const Icon = isWarning ? AlertTriangle : icons[idx % icons.length];

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggleQuestionMultiAnswer(q.id, opt)}
                                    className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition ${
                                      isSelected
                                        ? isWarning
                                          ? "border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                                          : "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] ring-1 ring-[#FAD293]/50 shadow-[0_0_15px_rgba(250,210,147,0.15)]"
                                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? isWarning
                                            ? "border-amber-400 bg-amber-400 text-black"
                                            : "border-[#FAD293] bg-[#FAD293] text-black"
                                          : "border-white/30"
                                      }`}
                                    >
                                      {isSelected && <Check size={11} strokeWidth={3} />}
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Icon size={14} className="shrink-0" />
                                      <span className="text-xs font-semibold truncate">
                                        {opt}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Mould / Biohazard Alert Box */}
                            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2.5">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <p className="leading-relaxed">
                                Mould / Biohazard requires a specialist assessment and must not be included in a normal fixed package.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      // 4. Add-ons
                      if (qTextLower.includes("add-on") || qTextLower.includes("addon")) {
                        const selectedAddons: string[] = Array.isArray(currentVal) ? currentVal : [];
                        return (
                          <div key={q.id} className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                              {q.question_text}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {q.options.map((addon) => {
                                const isSelected = selectedAddons.includes(addon);
                                return (
                                  <div
                                    key={addon}
                                    onClick={() => toggleQuestionMultiAnswer(q.id, addon)}
                                    className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition ${
                                      isSelected
                                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                                        : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? "border-[#FAD293] bg-[#FAD293] text-black"
                                          : "border-white/30"
                                      }`}
                                    >
                                      {isSelected && <Check size={11} strokeWidth={3} />}
                                    </div>
                                    <span className="text-xs font-semibold">{addon}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 5. Access & Requirements (Water, Power, Off road parking)
                      if (qTextLower.includes("access") || qTextLower.includes("requirement")) {
                        const subAnswers: Record<string, "Yes" | "No"> =
                          typeof currentVal === "object" && !Array.isArray(currentVal)
                            ? currentVal
                            : {};

                        return (
                          <div key={q.id} className="space-y-3 pt-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                              {q.question_text}
                            </label>
                            <div className="space-y-2">
                              {q.options.map((item) => {
                                const chosen = subAnswers[item] || "";
                                const isWater = item.toLowerCase().includes("water");
                                const isPower = item.toLowerCase().includes("power");
                                const Icon = isWater ? Droplets : isPower ? Zap : Car;

                                return (
                                  <div
                                    key={item}
                                    className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Icon size={16} className="text-[#FAD293]" />
                                      <span className="text-xs font-bold text-white">{item}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {(["Yes", "No"] as const).map((opt) => (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => setQuestionSubAnswer(q.id, item, opt)}
                                          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                            chosen === opt
                                              ? "bg-[#FAD293] text-black shadow-md"
                                              : "bg-white/5 text-white/50 hover:bg-white/10"
                                          }`}
                                        >
                                          {opt}
                                          {chosen === opt && <Check size={12} />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 6. Preferred Outcome
                      if (qTextLower.includes("outcome") || qTextLower.includes("finish")) {
                        return (
                          <div key={q.id} className="space-y-2 pt-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                              {q.question_text}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {q.options.map((outcome) => {
                                const isSelected = currentVal === outcome;
                                return (
                                  <button
                                    key={outcome}
                                    type="button"
                                    onClick={() => setQuestionSingleAnswer(q.id, outcome)}
                                    className={`p-3 rounded-2xl border text-xs font-bold text-center transition ${
                                      isSelected
                                        ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] ring-1 ring-[#FAD293]/50 shadow-[0_0_15px_rgba(250,210,147,0.15)]"
                                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                                    }`}
                                  >
                                    {outcome}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[11px] text-white/40 italic">
                              * Final duration depends on vehicle condition and selected packages.
                            </div>
                          </div>
                        );
                      }

                      // Generic Select Question Fallback
                      return (
                        <div key={q.id} className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                            {q.question_text}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setQuestionSingleAnswer(q.id, opt)}
                                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                                  currentVal === opt
                                    ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293]"
                                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Special Instructions or Notes */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Special instructions or notes for valet
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Gate code is 9876, key with concierge, water tap located on left side..."
                      className="w-full p-4 rounded-2xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition resize-none"
                    />
                  </div>

                  {/* Privacy Policy Agreement */}
                  <div
                    onClick={() => setPrivacyAgreed(!privacyAgreed)}
                    className="flex items-center gap-3 pt-2 cursor-pointer select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                        privacyAgreed
                          ? "border-[#FAD293] bg-[#FAD293] text-black"
                          : "border-white/30 bg-transparent"
                      }`}
                    >
                      {privacyAgreed && <Check size={13} strokeWidth={3} />}
                    </div>
                    <span className="text-xs text-white/80">
                      I agree to the{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-[#FAD293] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>{" "}
                      and terms of valet service.
                    </span>
                  </div>

                  {/* Submit CTA Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] hover:brightness-110 text-black font-black text-sm tracking-wider uppercase transition shadow-[0_0_30px_rgba(250,210,147,0.3)] flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>
                        Review Request{" "}
                        {selectedServiceIds.length > 0
                          ? `(${selectedServiceIds.length} Packages)`
                          : ""}
                      </span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1.5 transition-transform"
                      />
                    </button>
                  </div>
                </div>

              </div>
            </section>
          </div>
        </form>
      </main>

      {/* ─── Interactive Google Map Pop-up Modal ─── */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialAddress={locationAddress || postcode}
        initialPostcode={postcode}
        initialLat={latitude}
        initialLon={longitude}
        initialStreet={street}
        initialCity={city}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
}
