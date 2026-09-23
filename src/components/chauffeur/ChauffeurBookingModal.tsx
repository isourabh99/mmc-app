"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  X,
  Star,
  MapPin,
  Car,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  CreditCard,
  ShieldCheck,
  Fuel,
  Users,
  Gauge,
  Info,
  ExternalLink,
  Lock,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  bookChauffeur,
  type Chauffeur,
  type ChauffeurBookingCoordinates,
} from "@/lib/service/chauffeur.api";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";

interface ChauffeurBookingModalProps {
  bookingChauffeur: Chauffeur | null;
  detailsChauffeur: Chauffeur | null;
  onCloseBooking: () => void;
  onCloseDetails: () => void;
  onProceedFromDetailsToBooking: (chauffeur: Chauffeur) => void;
}

export const ChauffeurBookingModal: React.FC<ChauffeurBookingModalProps> = ({
  bookingChauffeur,
  detailsChauffeur,
  onCloseBooking,
  onCloseDetails,
  onProceedFromDetailsToBooking,
}) => {
  const router = useRouter();

  // Booking Form Inputs
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState<ChauffeurBookingCoordinates | undefined>(undefined);

  const [dropLocation, setDropLocation] = useState("");
  const [dropCoordinates, setDropCoordinates] = useState<ChauffeurBookingCoordinates | undefined>(undefined);

  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [pickupTime, setPickupTime] = useState("10:00 AM");
  const [dropTime, setDropTime] = useState("10:00 PM");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "digital" | "cash">("stripe");
  const [bookingNote, setBookingNote] = useState("");
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // Success Modal State
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{
    open: boolean;
    reference: string;
    message: string;
    redirectLink?: string;
    totalAmount?: number;
    carName?: string;
  }>({
    open: false,
    reference: "",
    message: "",
  });

  // Failed Modal State
  const [bookingFailedModal, setBookingFailedModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "Booking Failed",
    message: "",
  });

  // Sync default pickup location from chauffeur when modal opens
  useEffect(() => {
    if (bookingChauffeur) {
      const defaultAddr =
        bookingChauffeur.address ||
        bookingChauffeur.preferred_areas?.split(",")?.[0]?.trim() ||
        bookingChauffeur.provider?.company_address ||
        "";
      
      setPickupLocation(defaultAddr);

      if (bookingChauffeur.provider?.coordinates) {
        const lat = parseFloat(bookingChauffeur.provider.coordinates.latitude);
        const lon = parseFloat(bookingChauffeur.provider.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          setPickupCoordinates({ latitude: lat, longitude: lon });
        }
      } else if (bookingChauffeur.coordinates) {
        const lat = parseFloat(bookingChauffeur.coordinates.latitude);
        const lon = parseFloat(bookingChauffeur.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          setPickupCoordinates({ latitude: lat, longitude: lon });
        }
      }
      
      setDropLocation("");
      setDropCoordinates(undefined);
      setBookingError("");
    }
  }, [bookingChauffeur]);

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return "£0.00";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return String(price);
    return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Confirm Ride Submission
  const handleConfirmRide = async () => {
    if (!bookingChauffeur) return;
    if (!pickupLocation.trim()) {
      setBookingError("Please specify a pickup location.");
      return;
    }
    if (!dropLocation.trim()) {
      setBookingError("Please specify a drop location.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      // Fallback coordinates if user did not pick from map/search
      const finalPickupCoords: ChauffeurBookingCoordinates = pickupCoordinates || {
        latitude: bookingChauffeur.provider?.coordinates
          ? parseFloat(bookingChauffeur.provider.coordinates.latitude) || 22.7195687
          : 22.7195687,
        longitude: bookingChauffeur.provider?.coordinates
          ? parseFloat(bookingChauffeur.provider.coordinates.longitude) || 75.8577258
          : 75.8577258,
      };

      const finalDropCoords: ChauffeurBookingCoordinates = dropCoordinates || {
        latitude: 22.721755,
        longitude: 75.801235,
      };

      const callbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}/services/Chauffeur`
        : "https://mmcclub.co.uk/services/Chauffeur";

      const payload = {
        car_id: bookingChauffeur.id,
        start_date: startDate,
        end_date: endDate,
        pickup_time: pickupTime,
        drop_time: dropTime,
        pickup_type: "chauffeur",
        pickup_location: pickupLocation,
        pickup_coordinates: finalPickupCoords,
        drop_location: dropLocation,
        drop_coordinates: finalDropCoords,
        payment_method: paymentMethod,
        callback: callbackUrl,
        note: bookingNote,
      };

      console.log("Submitting Chauffeur Booking Payload:", payload);

      const res = await bookChauffeur(payload);
      console.log("Booking Response from server:", res);

      const redirectLink = res.content?.redirect_link || res.content?.redirect_url;
      const bookingObj = res.content?.booking;
      const bookingRef = String(
        bookingObj?.booking_id ||
        res.content?.booking_id ||
        bookingObj?.id ||
        "MMC-VIP-" + Math.floor(100000 + Math.random() * 900000)
      );
      const totalAmount = bookingObj?.total_amount;

      setBookingSuccessModal({
        open: true,
        reference: bookingRef,
        message: res.message || "Your chauffeur reservation has been placed successfully.",
        redirectLink: redirectLink || undefined,
        totalAmount: totalAmount || undefined,
        carName: `${bookingChauffeur.brand} ${bookingChauffeur.model}`,
      });

    } catch (err: any) {
      console.error("Booking API error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to complete reservation. Please verify your details or connection.";
      
      setBookingError(errorMsg);
      setBookingFailedModal({
        open: true,
        title: "Booking Failed",
        message: errorMsg,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayNow = (link: string) => {
    if (typeof window !== "undefined") {
      window.location.href = link;
    }
  };

  const handleGoToMyBookings = () => {
    setBookingSuccessModal({ open: false, reference: "", message: "" });
    setBookingFailedModal({ open: false, title: "", message: "" });
    onCloseBooking();
    router.push("/account?tab=bookings");
  };

  return (
    <>
      {/* =========================================================================
          1. PROFESSIONAL LUXURY BOOKING DETAILS MODAL
      ========================================================================== */}
      {bookingChauffeur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#d9a85f]/40 bg-[#14100c] text-white shadow-2xl shadow-black/80 no-scrollbar">
            
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#14100c]/95 px-5 py-4 backdrop-blur-md">
              <button
                type="button"
                onClick={onCloseBooking}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#33271d] bg-[#1a1410] text-white/70 transition hover:border-[#d9a85f]/50 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-center">
                <h3 className="text-sm font-bold tracking-wide text-white uppercase">Chauffeur Reservation</h3>
                <p className="text-[10px] text-[#e7bd78]">VIP Executive Fleet</p>
              </div>

              <button
                type="button"
                onClick={onCloseBooking}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#33271d] bg-[#1a1410] text-white/70 transition hover:border-[#d9a85f]/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              
              {/* Vehicle & Provider Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[#33271d] bg-gradient-to-br from-[#1d1611] to-[#120e0a] p-4 shadow-inner">
                <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-[#3a2d21] bg-black">
                    <img
                      src={
                        bookingChauffeur.image_full_paths?.[0] ||
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={bookingChauffeur.brand}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-[#e7bd78]/30 bg-[#e7bd78]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e7bd78]">
                        {bookingChauffeur.type?.name || "Luxury Class"}
                      </span>
                      {bookingChauffeur.provider?.avg_rating && (
                        <div className="flex items-center gap-1 text-[11px] text-white/80">
                          <Star size={11} className="fill-[#f59e0b] text-[#f59e0b]" />
                          <span className="font-semibold">{bookingChauffeur.provider.avg_rating}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mt-1 truncate">
                      {bookingChauffeur.brand} {bookingChauffeur.model}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50 mt-1">
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-[#e7bd78]" />
                        {bookingChauffeur.seating_capacity || 4} Seats
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge size={11} className="text-[#e7bd78]" />
                        {bookingChauffeur.transmission_type || bookingChauffeur.transmission || "Auto"}
                      </span>
                      {bookingChauffeur.provider?.company_name && (
                        <span className="flex items-center gap-1 truncate text-white/70">
                          <ShieldCheck size={11} className="text-[#10b981]" />
                          {bookingChauffeur.provider.company_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: ROUTE & LOCATION SEARCH */}
              <div className="rounded-2xl border border-[#33271d] bg-[#100d0a] p-4 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1.5">
                    <MapPin size={13} />
                    Trip Itinerary
                  </span>
                  <span className="text-[10px] text-white/40">GPS Coordinates Enabled</span>
                </div>

                {/* Pickup Location with Autocomplete & Current Location */}
                <LocationSearchInput
                  label="Pickup Location"
                  placeholder="Enter pickup address, hotel or airport"
                  value={pickupLocation}
                  coordinates={pickupCoordinates}
                  onChange={(address, coords) => {
                    setPickupLocation(address);
                    setPickupCoordinates(coords);
                  }}
                  required
                  type="pickup"
                />

                {/* Drop Location with Autocomplete */}
                <LocationSearchInput
                  label="Drop Location"
                  placeholder="Enter destination, terminal or landmark"
                  value={dropLocation}
                  coordinates={dropCoordinates}
                  onChange={(address, coords) => {
                    setDropLocation(address);
                    setDropCoordinates(coords);
                  }}
                  required
                  type="drop"
                />
              </div>

              {/* SECTION 2: SCHEDULE (DATES & TIMES) */}
              <div className="rounded-2xl border border-[#33271d] bg-[#100d0a] p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1.5">
                    <Calendar size={13} />
                    Date & Timing
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-white/50 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#16120e] px-3 text-xs text-white outline-none focus:border-[#e7bd78] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-white/50 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#16120e] px-3 text-xs text-white outline-none focus:border-[#e7bd78] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-white/50 mb-1 flex items-center gap-1">
                      <Clock size={10} className="text-[#10b981]" />
                      Pickup Time
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#16120e] px-3 text-xs text-white outline-none focus:border-[#e7bd78] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-white/50 mb-1 flex items-center gap-1">
                      <Clock size={10} className="text-[#ef4444]" />
                      Drop Time
                    </label>
                    <input
                      type="text"
                      value={dropTime}
                      onChange={(e) => setDropTime(e.target.value)}
                      placeholder="10:00 PM"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#16120e] px-3 text-xs text-white outline-none focus:border-[#e7bd78] transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PAYMENT METHOD */}
              <div className="rounded-2xl border border-[#33271d] bg-[#100d0a] p-4 space-y-2.5 shadow-md">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#e7bd78] pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <CreditCard size={13} />
                  Payment Method
                </span>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: "stripe", label: "Stripe Checkout", icon: CreditCard },
                    { id: "digital", label: "Digital Pay", icon: ShieldCheck },
                    { id: "cash", label: "Pay On Trip", icon: Star },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                          isSelected
                            ? "border-[#d9a85f] bg-[#221810] text-[#e7bd78] ring-1 ring-[#d9a85f]/30"
                            : "border-[#33271d] bg-[#16120e] text-white/60 hover:border-[#4a3a2c] hover:text-white"
                        }`}
                      >
                        <Icon size={14} className={isSelected ? "text-[#e7bd78]" : "text-white/40"} />
                        <span className="text-[11px] font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: BOOKING NOTE */}
              <div>
                <label className="block text-[10px] font-semibold uppercase text-white/50 mb-1">
                  Special Notes / Luggage Instructions
                </label>
                <textarea
                  rows={2}
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="Flight number, child seat requirement, or chauffeur preferences..."
                  className="w-full rounded-xl border border-[#33271d] bg-[#100d0a] p-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#e7bd78] transition resize-none"
                />
              </div>

              {/* Error Alert Box */}
              {bookingError && (
                <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
                  <Info size={14} className="text-red-400 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Summary Fare & Confirm CTA */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-xs text-white/60 block">Estimated Luxury Fare</span>
                    <span className="text-[10px] text-white/40">Includes chauffeur, fuel & taxes</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#e7bd78]">
                      {formatPrice(bookingChauffeur.hourly_rate || bookingChauffeur.daily_rate)}
                    </span>
                    <span className="text-[10px] text-white/50 block">/ standard slot</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmRide}
                  disabled={bookingLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e7bd78] to-[#d09a50] text-sm font-bold text-[#140e0a] shadow-lg shadow-[#d09a50]/20 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Confirming Chauffeur...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Confirm & Book Chauffeur</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. LUXURY VEHICLE DETAILS MODAL
      ========================================================================== */}
      {detailsChauffeur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#d9a85f]/50 bg-[#14100c] p-5 sm:p-6 text-white shadow-2xl shadow-black/80 no-scrollbar">
            
            <button
              type="button"
              onClick={onCloseDetails}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#100d0a]/80 text-white/70 backdrop-blur-sm transition hover:border-[#d9a85f] hover:text-white"
            >
              <X size={15} />
            </button>

            {/* Vehicle Hero Image */}
            <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-black border border-[#2c2219] mb-4">
              <img
                src={
                  detailsChauffeur.image_full_paths?.[0] ||
                  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80"
                }
                alt={detailsChauffeur.brand}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-transparent to-transparent" />
              
              <span className="absolute bottom-3 left-3 rounded-lg border border-[#e7bd78]/40 bg-[#14100c]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e7bd78] backdrop-blur-md">
                {detailsChauffeur.type?.name || "VIP Fleet"}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">
              {detailsChauffeur.brand} {detailsChauffeur.model}
            </h3>
            
            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
              {detailsChauffeur.description ||
                "Executive chauffeured luxury transport tailored for seamless airport transfers, business travel, and private VIP events."}
            </p>

            {/* Specifications Grid */}
            <div className="my-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-[#33271d] bg-[#100d0a] p-3.5 text-center text-xs">
              <div className="flex flex-col items-center justify-center p-1">
                <Gauge size={14} className="text-[#e7bd78] mb-1" />
                <span className="text-white/40 text-[10px]">Gearbox</span>
                <span className="font-semibold text-white mt-0.5">
                  {detailsChauffeur.transmission_type || detailsChauffeur.transmission || "Automatic"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1 border-x border-white/10">
                <Users size={14} className="text-[#e7bd78] mb-1" />
                <span className="text-white/40 text-[10px]">Capacity</span>
                <span className="font-semibold text-white mt-0.5">
                  {detailsChauffeur.seating_capacity || 4} Guests
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <Fuel size={14} className="text-[#e7bd78] mb-1" />
                <span className="text-white/40 text-[10px]">Fuel / Engine</span>
                <span className="font-semibold text-white mt-0.5">
                  {detailsChauffeur.fuel_type || "Hybrid/Petrol"}
                </span>
              </div>
            </div>

            {/* Provider & Coverage Info */}
            <div className="rounded-2xl border border-[#33271d] bg-[#100d0a] p-4 text-xs space-y-2.5 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Official Provider:</span>
                <span className="font-bold text-white">
                  {detailsChauffeur.provider?.company_name || "MMC Certified Chauffeur"}
                </span>
              </div>
              {detailsChauffeur.provider?.contact_person_name && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Lead Chauffeur / Concierge:</span>
                  <span className="text-white font-medium">
                    {detailsChauffeur.provider.contact_person_name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-white/50">Coverage Area:</span>
                <span className="text-white/80 truncate max-w-[200px]">
                  {detailsChauffeur.preferred_areas ||
                    detailsChauffeur.provider?.company_address ||
                    "Citywide & International Airports"}
                </span>
              </div>
              {detailsChauffeur.registration_number && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Vehicle Reg:</span>
                  <span className="text-[#e7bd78] font-mono font-semibold">
                    {detailsChauffeur.registration_number}
                  </span>
                </div>
              )}
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase text-white/50 block">Pricing</span>
                <span className="text-xl font-bold text-[#e7bd78]">
                  {formatPrice(detailsChauffeur.hourly_rate || detailsChauffeur.daily_rate)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = detailsChauffeur;
                  onProceedFromDetailsToBooking(target);
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-bold text-[#140e0a] shadow-lg transition hover:brightness-105"
              >
                Proceed to Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. VIP BOOKING SUCCESS MODAL (With View Bookings & Back Buttons)
      ========================================================================== */}
      {bookingSuccessModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-[#d9a85f]/70 bg-[#16120e] p-6 text-center text-white shadow-2xl shadow-black">
            
            {/* Header Icon */}
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981]/30 to-[#059669]/10 text-[#10b981] ring-4 ring-[#10b981]/20">
              <CheckCircle2 size={34} />
            </div>

            <h3 className="font-bold text-xl text-white">
              Booking Placed Successfully!
            </h3>
            
            <p className="mt-1 text-xs text-white/70 leading-relaxed">
              {bookingSuccessModal.message}
            </p>

            {/* Booking Details Card */}
            <div className="my-4 rounded-2xl border border-[#33271d] bg-[#100d0a] p-4 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-white/40 text-[10px] uppercase tracking-wider">Booking ID</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-[#e7bd78] font-mono text-xs tracking-wider">
                    {bookingSuccessModal.reference}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(bookingSuccessModal.reference)}
                    className="text-white/40 hover:text-white transition p-0.5"
                    title="Copy ID"
                  >
                    {copiedId ? (
                      <Check size={12} className="text-[#10b981]" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              {bookingSuccessModal.carName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-[11px]">Vehicle:</span>
                  <span className="font-semibold text-white">
                    {bookingSuccessModal.carName}
                  </span>
                </div>
              )}

              {bookingSuccessModal.totalAmount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-[11px]">Total Fare:</span>
                  <span className="text-base font-bold text-[#e7bd78]">
                    {formatPrice(bookingSuccessModal.totalAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-[#10b981] pt-1">
                <ShieldCheck size={12} />
                <span>Reservation recorded in your account</span>
              </div>
            </div>

            {/* If Stripe Payment is required */}
            {bookingSuccessModal.redirectLink && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => handlePayNow(bookingSuccessModal.redirectLink!)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#635BFF] via-[#7a73ff] to-[#635BFF] text-xs font-bold text-white shadow-lg shadow-[#635BFF]/30 transition hover:brightness-110 active:scale-95"
                >
                  <CreditCard size={15} />
                  <span>Pay Now via Stripe Checkout</span>
                  <ExternalLink size={13} className="opacity-70" />
                </button>
              </div>
            )}

            {/* The 2 Primary Action Buttons requested by user */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Button 1: View My Bookings (/account?tab=bookings) */}
              <button
                type="button"
                onClick={handleGoToMyBookings}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-bold text-[#140e0a] shadow-md transition hover:brightness-105 active:scale-95"
              >
                <Calendar size={14} />
                <span>View My Bookings</span>
              </button>

              {/* Button 2: Back to Fleet / Done */}
              <button
                type="button"
                onClick={() => {
                  setBookingSuccessModal({ open: false, reference: "", message: "" });
                  onCloseBooking();
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#17120e] text-xs font-semibold text-white/80 transition hover:bg-[#251e18] hover:text-white active:scale-95"
              >
                <span>Back to Fleet</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          4. VIP BOOKING FAILED / ERROR MODAL (With Try Again & My Account Buttons)
      ========================================================================== */}
      {bookingFailedModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-red-500/50 bg-[#16120e] p-6 text-center text-white shadow-2xl shadow-black">
            
            {/* Error Icon */}
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/40 text-red-400 ring-4 ring-red-500/20">
              <XCircle size={34} />
            </div>

            <h3 className="font-bold text-xl text-white">
              {bookingFailedModal.title}
            </h3>
            
            <p className="mt-1 text-xs text-white/60 leading-relaxed">
              We were unable to process your chauffeur reservation.
            </p>

            {/* Error Message Card */}
            <div className="my-4 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-left space-y-1.5">
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <AlertTriangle size={14} />
                <span>Error Reason:</span>
              </div>
              <p className="text-red-300 text-[11px] leading-relaxed break-words">
                {bookingFailedModal.message}
              </p>
            </div>

            {/* Action Buttons for Failure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Button 1: Try Again / Review Details */}
              <button
                type="button"
                onClick={() => {
                  setBookingFailedModal({ open: false, title: "", message: "" });
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-bold text-[#140e0a] shadow-md transition hover:brightness-105 active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Try Again</span>
              </button>

              {/* Button 2: View My Account */}
              <button
                type="button"
                onClick={handleGoToMyBookings}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#17120e] text-xs font-semibold text-white/80 transition hover:bg-[#251e18] hover:text-white active:scale-95"
              >
                <span>My Bookings</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
