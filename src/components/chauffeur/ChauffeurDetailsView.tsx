"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Users,
  Fuel,
  Gauge,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Shield,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Snowflake,
  Sparkles,
  CreditCard,
  Building,
  Briefcase,
  UserCheck,
  Truck,
  Layers,
  Award,
  Loader2,
  Navigation,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Chauffeur,
  bookChauffeur,
  getChauffeurGalleryImages,
  ChauffeurBookingCoordinates,
} from "@/lib/service/chauffeur.api";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";
import { useToast } from "@/components/ToastProvider";

interface ChauffeurDetailsViewProps {
  chauffeur: Chauffeur;
  relatedChauffeurs?: Chauffeur[];
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80";

export const ChauffeurDetailsView: React.FC<ChauffeurDetailsViewProps> = ({
  chauffeur,
  relatedChauffeurs = [],
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Booking Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState("10:00 AM");
  const [dropTime, setDropTime] = useState("06:00 PM");
  const [pickupType, setPickupType] = useState("hourly");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<ChauffeurBookingCoordinates | undefined>(undefined);
  const [dropLocation, setDropLocation] = useState("");
  const [dropCoords, setDropCoords] = useState<ChauffeurBookingCoordinates | undefined>(undefined);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_after_service");

  // Booking Execution State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<any | null>(null);

  const images = useMemo(() => getChauffeurGalleryImages(chauffeur), [chauffeur]);
  const currentImage = images[selectedImageIndex] || images[0] || FALLBACK_IMAGE;

  const hourlyRate = parseFloat(chauffeur.hourly_rate || "0");
  const dailyRate = parseFloat(chauffeur.daily_rate || "0");
  const deposit = parseFloat(chauffeur.security_deposit || "0");

  const formatPrice = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === "") return "£0.00";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "£0.00";
    return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const parseTerms = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => l.replace(/^[\*\-\•]\s*/, ""));
  };

  const terms = parseTerms(chauffeur.terms_conditions);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleScrollToTerms = () => {
    setIsTermsOpen(true);
    const el = document.getElementById("chauffeur-terms-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Estimated Total Computation
  const calculatedEstimatedTotal = useMemo(() => {
    if (dailyRate > 0 && pickupType === "daily") {
      return dailyRate;
    }
    if (hourlyRate > 0) {
      return hourlyRate;
    }
    return dailyRate || 0;
  }, [hourlyRate, dailyRate, pickupType]);

  // Handle Form Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("Please login to book your chauffeur ride.", "error");
      router.push("/login");
      return;
    }

    if (!pickupLocation.trim()) {
      showToast("Please enter a pickup address.", "error");
      return;
    }

    if (!dropLocation.trim()) {
      showToast("Please enter a destination address.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        car_id: chauffeur.id,
        start_date: startDate,
        end_date: endDate,
        pickup_time: pickupTime,
        drop_time: dropTime,
        pickup_type: pickupType,
        pickup_location: pickupLocation,
        pickup_coordinates: pickupCoords,
        drop_location: dropLocation,
        drop_coordinates: dropCoords,
        payment_method: "cash_after_service",
        note: note.trim() || undefined,
      };

      const res = await bookChauffeur(payload);

      if (res?.response_code === "default_200" || res?.content?.booking) {
        showToast("Chauffeur ride booked successfully!", "success");
        setBookingSuccessModal({
          bookingId: res.content.booking?.booking_id || `MMC-CHF-${Date.now().toString().slice(-6)}`,
          vehicle: `${chauffeur.brand} ${chauffeur.model || ""}`.trim(),
          pickupDate: startDate,
          pickupTime: pickupTime,
          pickupLocation: pickupLocation,
          dropLocation: dropLocation,
          amount: res.content.booking?.total_amount || calculatedEstimatedTotal,
        });
      } else {
        showToast(res?.message || "Booking request completed.", "success");
        setBookingSuccessModal({
          bookingId: `MMC-CHF-${Date.now().toString().slice(-6)}`,
          vehicle: `${chauffeur.brand} ${chauffeur.model || ""}`.trim(),
          pickupDate: startDate,
          pickupTime: pickupTime,
          pickupLocation: pickupLocation,
          dropLocation: dropLocation,
          amount: calculatedEstimatedTotal,
        });
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      showToast(
        err?.response?.data?.message || err?.message || "Failed to book chauffeur ride. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090706] text-white pb-24 selection:bg-[#FAD293] selection:text-black">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] rounded-full blur-[140px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B, transparent)",
        }}
      />

      {/* Main Content Grid */}
      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================================
              LEFT COLUMN: Gallery, Specs, Terms, Description (8 cols)
          ========================================================== */}
          <div className="lg:col-span-8 space-y-8 min-w-0">
            {/* Gallery Card */}
            <div className="rounded-3xl border border-white/10 bg-[#0e0b08] p-3 sm:p-5 overflow-hidden shadow-2xl">
              {/* Main Image Stage */}
              <div className="relative h-[280px] sm:h-[420px] md:h-[480px] w-full rounded-2xl overflow-hidden bg-neutral-950 group">
                <img
                  src={currentImage}
                  alt={chauffeur.brand || "Chauffeur Vehicle"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                      color: "#17100b",
                    }}
                  >
                    {chauffeur.type?.name || chauffeur.category?.name || "VIP Chauffeur"}
                  </span>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {chauffeur.status === 1 ? "Available for Booking" : "Busy / Reserved"}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous Image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition backdrop-blur-md"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next Image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition backdrop-blur-md"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs text-white/80 backdrop-blur-md font-mono">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails Bar */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-neutral-900 ${
                        selectedImageIndex === idx
                          ? "border-[#FAD293] scale-105 shadow-md shadow-[#FAD293]/20"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Chauffeur view ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Overview & Key Highlights */}
            <div className="rounded-3xl border border-white/10 bg-[#0e0b08] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-widest text-[#FAD293] font-semibold">
                    Vehicle &amp; Chauffeur Overview
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {chauffeur.brand}
                </h1>
                {chauffeur.model && (
                  <p className="text-sm sm:text-base text-white/60">{chauffeur.model}</p>
                )}
              </div>

              {/* Specifications Matrix Grid - Direct Real Backend Data */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Year */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Calendar size={16} />
                    <span className="text-xs text-white/50">Year</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.manufacture_year || chauffeur.year || "-"}
                  </p>
                </div>

                {/* Seating */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Users size={16} />
                    <span className="text-xs text-white/50">Seating</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.seating_capacity ? `${chauffeur.seating_capacity} Passengers` : "-"}
                  </p>
                </div>

                {/* Transmission */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Gauge size={16} />
                    <span className="text-xs text-white/50">Transmission</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.transmission_type || chauffeur.transmission || "-"}
                  </p>
                </div>

                {/* Registration Number */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <CreditCard size={16} />
                    <span className="text-xs text-white/50">Registration</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">
                    {chauffeur.registration_number || "-"}
                  </p>
                </div>

                {/* Air Conditioning */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Snowflake size={16} />
                    <span className="text-xs text-white/50">Climate Control</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.air_conditioning === 1 ? "Air Conditioned" : "No AC"}
                  </p>
                </div>

                {/* Fuel Policy */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Fuel size={16} />
                    <span className="text-xs text-white/50">Fuel Policy</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.fuel_policy || chauffeur.fuel_type || "-"}
                  </p>
                </div>

                {/* Mileage Limit */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Gauge size={16} />
                    <span className="text-xs text-white/50">Mileage Limit</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.mileage_limit || "-"}
                  </p>
                </div>

                {/* Luggage Capacity */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Briefcase size={16} />
                    <span className="text-xs text-white/50">Luggage</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.luggage_capacity ? `${chauffeur.luggage_capacity} Bags` : "-"}
                  </p>
                </div>

                {/* Minimum Driver Age */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <UserCheck size={16} />
                    <span className="text-xs text-white/50">Min Driver Age</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.min_driver_age ? `${chauffeur.min_driver_age}+ Years` : "-"}
                  </p>
                </div>

                {/* Operating Hours */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Clock size={16} />
                    <span className="text-xs text-white/50">Operating Hours</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.available_hours_start && chauffeur.available_hours_end
                      ? `${chauffeur.available_hours_start.slice(0, 5)} - ${chauffeur.available_hours_end.slice(0, 5)}`
                      : "-"}
                  </p>
                </div>

                {/* Chauffeur Tier */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Award size={16} />
                    <span className="text-xs text-white/50">Service Class</span>
                  </div>
                  <p className="text-sm font-bold text-white capitalize">
                    {chauffeur.chauffeur_tier
                      ? chauffeur.chauffeur_tier.replace(/_/g, " ")
                      : chauffeur.type?.name || "-"}
                  </p>
                </div>

                {/* Delivery / Callout Fee */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Truck size={16} />
                    <span className="text-xs text-white/50">Delivery Fee</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {chauffeur.delivery_fee && parseFloat(chauffeur.delivery_fee) > 0
                      ? formatPrice(chauffeur.delivery_fee)
                      : "0.00"}
                  </p>
                </div>
              </div>

              {/* Preferred Coverage Areas & Location */}
              {(chauffeur.preferred_areas || chauffeur.address || chauffeur.postcode) && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/8 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAD293]/10 text-[#FAD293] shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Coverage &amp; Base Location
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {chauffeur.preferred_areas
                        ? `Areas Served: ${chauffeur.preferred_areas}`
                        : ""}
                      {chauffeur.address ? ` • Base: ${chauffeur.address}` : ""}
                      {chauffeur.postcode ? ` (${chauffeur.postcode})` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Optional Description (rendered only when provided by backend) */}
              {chauffeur.description && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/8 space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-[#FAD293] font-semibold">
                    Description
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">
                    {chauffeur.description}
                  </p>
                </div>
              )}
            </div>

            {/* Terms & Conditions Section (Collapsible) */}
            {terms.length > 0 && (
              <div
                id="chauffeur-terms-section"
                className="rounded-3xl border border-white/10 bg-[#0e0b08] overflow-hidden transition-all duration-300 shadow-2xl"
              >
                <button
                  type="button"
                  id="toggle-chauffeur-terms-btn"
                  onClick={() => setIsTermsOpen((prev) => !prev)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-[#FAD293]/10 text-[#FAD293] shrink-0 border border-[#FAD293]/20">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Chauffeur Terms &amp; Conditions
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAD293]/10 text-[#FAD293] border border-[#FAD293]/25">
                          {terms.length} Policies
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        {isTermsOpen
                          ? "Click to hide chauffeur rules and passenger guidelines"
                          : "Click to review driver safety, waiting time and cancellation policies"}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-[#FAD293] shrink-0 hover:bg-[#FAD293]/10 transition">
                    <span>{isTermsOpen ? "Hide Terms" : "View Terms"}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${
                        isTermsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isTermsOpen && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-white/8 space-y-2.5 animate-in fade-in duration-300">
                    {terms.map((term, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/85 leading-relaxed"
                      >
                        <CheckCircle2
                          size={15}
                          className="text-[#FAD293] shrink-0 mt-0.5"
                        />
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================
              RIGHT COLUMN: Sticky Pricing Card & Integrated Booking Form
          ========================================================== */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl border border-white/15 bg-[#120e0b] p-6 sm:p-7 shadow-2xl space-y-6">
              {/* Price Banner */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  Chauffeur Tariff
                </span>

                {hourlyRate > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/70">Hourly Rate:</span>
                    <span className="text-2xl font-extrabold text-[#FAD293]">
                      {formatPrice(hourlyRate)}{" "}
                      <span className="text-xs text-white/40 font-normal">
                        / hr
                      </span>
                    </span>
                  </div>
                )}

                {dailyRate > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/70">Daily Rate:</span>
                    <span className="text-2xl font-extrabold text-[#FAD293]">
                      {formatPrice(dailyRate)}{" "}
                      <span className="text-xs text-white/40 font-normal">
                        / day
                      </span>
                    </span>
                  </div>
                )}

                {deposit > 0 && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/60">Deposit:</span>
                    <span className="font-semibold text-white font-mono">
                      {formatPrice(deposit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Integrated Booking Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
                {/* Trip Type Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                    Booking Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupType("hourly")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        pickupType === "hourly"
                          ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      Hourly Chauffeur
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupType("daily")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        pickupType === "daily"
                          ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      Full Day Trip
                    </button>
                  </div>
                </div>

                {/* Dates & Times */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">Pickup Date</label>
                    <input
                      type="date"
                      value={startDate}
                      min={todayStr}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                      }}
                      className="w-full h-10 rounded-xl bg-black/60 border border-white/10 px-3 text-xs text-white outline-none focus:border-[#FAD293]/60 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">Pickup Time</label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full h-10 rounded-xl bg-black/60 border border-white/10 px-3 text-xs text-white outline-none focus:border-[#FAD293]/60 transition"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const h = i % 12 === 0 ? 12 : i % 12;
                        const ampm = i < 12 ? "AM" : "PM";
                        const timeStr = `${h < 10 ? "0" + h : h}:00 ${ampm}`;
                        return (
                          <option key={timeStr} value={timeStr} className="bg-black text-white">
                            {timeStr}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Pickup Location Search Input */}
                <div>
                  <LocationSearchInput
                    label="Pickup Location"
                    value={pickupLocation}
                    coordinates={pickupCoords}
                    onChange={(address, coords) => {
                      setPickupLocation(address);
                      setPickupCoords(coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined);
                    }}
                    placeholder="Enter pickup address / airport"
                    type="pickup"
                    required
                  />
                </div>

                {/* Dropoff Location Search Input */}
                <div>
                  <LocationSearchInput
                    label="Destination Address"
                    value={dropLocation}
                    coordinates={dropCoords}
                    onChange={(address, coords) => {
                      setDropLocation(address);
                      setDropCoords(coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined);
                    }}
                    placeholder="Enter destination location"
                    type="drop"
                    required
                  />
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">
                    Special Requests / Flight Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Flight BA123, child seat required"
                    className="w-full h-10 rounded-xl bg-black/60 border border-white/10 px-3 text-xs text-white outline-none focus:border-[#FAD293]/60 transition"
                  />
                </div>

                {/* Submit Booking CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-extrabold text-black text-sm transition-all duration-300 shadow-xl shadow-[#FAD293]/15 hover:brightness-110 active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Book Chauffeur Now</span>
                    </>
                  )}
                </button>
              </form>

              {/* Peace of Mind Features & Terms Link */}
              <div className="space-y-3 pt-2 text-xs text-white/70">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>100% Vetted Professional Chauffeur</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Complimentary VIP Luggage Handling</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[#FAD293] shrink-0" />
                  <span>Punctual &amp; Discreet Guaranteed Service</span>
                </div>

                {/* View Terms and Conditions Action Link */}
                {terms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleScrollToTerms}
                    className="w-full mt-2 flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#FAD293]/40 hover:bg-[#FAD293]/5 text-xs text-[#FAD293] font-semibold transition group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      <span>View Chauffeur Terms &amp; Policies</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition"
                    />
                  </button>
                )}
              </div>

              {/* Provider Card (Using Exact Backend Data) */}
              {chauffeur.provider && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 font-semibold">
                    <Building size={14} className="text-[#FAD293]" />
                    <span>Chauffeur Partner</span>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 shrink-0">
                      <img
                        src={chauffeur.provider.logo_full_path || FALLBACK_IMAGE}
                        alt={chauffeur.provider.company_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {chauffeur.provider.company_name}
                      </h4>
                      {chauffeur.provider.contact_person_name && (
                        <p className="text-xs text-white/50 truncate">
                          Contact: {chauffeur.provider.contact_person_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-white/60 mt-0.5">
                        <Star
                          size={11}
                          className="fill-[#FAD293] text-[#FAD293]"
                        />
                        <span>
                          {chauffeur.provider.avg_rating && chauffeur.provider.avg_rating > 0
                            ? `${chauffeur.provider.avg_rating} (${chauffeur.provider.rating_count || 0} reviews)`
                            : "Verified Partner"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider Address / Contacts */}
                  <div className="space-y-2 text-xs text-white/70">
                    {chauffeur.provider.company_address && (
                      <div className="flex items-start gap-2">
                        <MapPin
                          size={13}
                          className="text-[#FAD293] shrink-0 mt-0.5"
                        />
                        <span className="text-white/60 leading-tight">
                          {chauffeur.provider.company_address}
                        </span>
                      </div>
                    )}
                    {chauffeur.provider.company_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[#FAD293] shrink-0" />
                        <span className="text-white/80 font-mono">
                          {chauffeur.provider.company_phone}
                        </span>
                      </div>
                    )}
                    {chauffeur.provider.company_email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-[#FAD293] shrink-0" />
                        <span className="text-white/80 truncate">
                          {chauffeur.provider.company_email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Chauffeurs Section */}
        {relatedChauffeurs.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#FAD293] font-semibold">
                  Explore More
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Other Chauffeurs in this Category
                </h3>
              </div>
              <Link
                href="/services/Chauffeur"
                className="text-xs font-semibold text-[#FAD293] hover:underline"
              >
                View All Chauffeurs &rsaquo;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedChauffeurs.slice(0, 3).map((rCar) => (
                <Link
                  key={rCar.id}
                  href={`/services/Chauffeur/${rCar.id}`}
                  className="group rounded-2xl border border-white/10 bg-[#0e0b08] p-4 transition-all duration-300 hover:border-[#FAD293]/40 hover:-translate-y-1 shadow-xl"
                >
                  <div className="relative h-40 rounded-xl overflow-hidden bg-neutral-900 mb-3">
                    <img
                      src={rCar.image_full_paths?.[0] || FALLBACK_IMAGE}
                      alt={rCar.brand}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-[#FAD293] font-semibold backdrop-blur-md">
                      {formatPrice(rCar.hourly_rate || rCar.daily_rate)}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#FAD293] transition line-clamp-1">
                    {rCar.brand}
                  </h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    {rCar.type?.name || "VIP Chauffeur"} • {rCar.transmission_type || "-"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          BOOKING CONFIRMATION SUCCESS MODAL
      ========================================================== */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#FAD293]/40 bg-[#14100c] p-6 sm:p-8 text-white shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Check size={32} strokeWidth={3} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Reservation Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Booking Successful!
              </h2>
              <p className="text-xs sm:text-sm text-white/65">
                Your chauffeur trip has been registered. The assigned chauffeur team will be prepared for your journey.
              </p>
            </div>

            {/* Trip Details Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50">Booking Ref:</span>
                <span className="font-mono font-bold text-[#FAD293]">
                  {bookingSuccessModal.bookingId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Vehicle:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {bookingSuccessModal.vehicle}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Date &amp; Time:</span>
                <span className="text-white/90">
                  {bookingSuccessModal.pickupDate} at {bookingSuccessModal.pickupTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Pickup:</span>
                <span className="text-white/90 truncate max-w-[200px]">
                  {bookingSuccessModal.pickupLocation}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Destination:</span>
                <span className="text-white/90 truncate max-w-[200px]">
                  {bookingSuccessModal.dropLocation}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/account?tab=bookings"
                className="py-3 px-4 rounded-xl font-bold text-black text-xs transition hover:brightness-110 flex items-center justify-center gap-1.5"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                <Calendar size={14} />
                <span>View in My Bookings</span>
              </Link>
              <button
                type="button"
                onClick={() => setBookingSuccessModal(null)}
                className="py-3 px-4 rounded-xl font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
