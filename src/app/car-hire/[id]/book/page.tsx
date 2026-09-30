"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  Loader2,
  Sparkles,
  FileText,
  ArrowLeft,
  Users,
  Gauge,
  Building,
  Navigation,
  Banknote,
  Check,
  Info,
  X,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  CarItem,
  getCarDetails,
  formatCurrency,
  getCarPrimaryImage,
  bookCar,
  formatTimeTo12Hour,
  CarBookingPayload,
} from "@/lib/service/car.api";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";
import { useToast } from "@/components/ToastProvider";

export default function CarHireBookingPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.id as string;
  const { showToast } = useToast();

  const [car, setCar] = useState<CarItem | null>(null);
  const [loadingCar, setLoadingCar] = useState(true);
  const [carError, setCarError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropTime, setDropTime] = useState("14:00");
  const [pickupType, setPickupType] = useState<"delivery" | "self">(
    "delivery"
  );

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 51.5074,
    longitude: -0.1278,
  });

  const [paymentMethod, setPaymentMethod] = useState("cash_after_service");
  const [description, setDescription] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Payment Modal State (Matches Bodywork / Chauffeur / Mechanical)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Check login authentication immediately
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("Please login to proceed with your booking.", "error");
      router.push("/login");
    }
  }, [router, showToast]);

  // 1. Fetch Vehicle Details
  useEffect(() => {
    if (!carId) return;

    const fetchCar = async () => {
      try {
        setLoadingCar(true);
        setCarError("");
        const details = await getCarDetails(carId);

        if (details) {
          setCar(details);

          // Default initial address
          const initialAddress =
            details.address ||
            (details.postcode
              ? `${details.postcode}, London`
              : "Silbury House, Sydenham Hill, London, SE26 6TU");
          setDeliveryAddress(initialAddress);

          // Default initial coordinates from provider if available
          if (details.provider?.coordinates) {
            setDeliveryCoords({
              latitude: parseFloat(details.provider.coordinates.latitude) || 51.5074,
              longitude: parseFloat(details.provider.coordinates.longitude) || -0.1278,
            });
          }
        } else {
          setCarError("Vehicle details could not be found.");
        }
      } catch (err) {
        console.error("Failed to fetch car for booking:", err);
        setCarError("Unable to load vehicle details. Please try again.");
      } finally {
        setLoadingCar(false);
      }
    };

    fetchCar();
  }, [carId]);


  // Pricing calculation
  const dailyRate = parseFloat(car?.daily_rate || "0");
  const hourlyRate = parseFloat(car?.hourly_rate || "0");
  const deposit = parseFloat(car?.security_deposit || "0");

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePrice =
    dailyRate > 0 ? dailyRate * diffDays : hourlyRate > 0 ? hourlyRate * 4 * diffDays : 0;
  const estimatedTotal = basePrice + deposit;

  // Deposit & Total computations
  const numericPrice = estimatedTotal > 0 ? estimatedTotal : basePrice > 0 ? basePrice : 150;
  const depositAmount = (numericPrice * 0.25).toFixed(2);
  const remainingAmount = (numericPrice * 0.75).toFixed(2);
  const totalAmountFormatted = numericPrice.toFixed(2);

  // Handle Location Autocomplete / GPS Select
  const handleLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setDeliveryAddress(address);
    if (coords) {
      setDeliveryCoords(coords);
    }
  };

  // Submit Booking Form - Opens Select Payment Method Modal
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!agreeTerms) {
      showToast(
        "Please agree to the vehicle hire terms & conditions to proceed.",
        "error"
      );
      return;
    }

    if (!deliveryAddress.trim()) {
      showToast("Please enter or select a valid delivery address.", "error");
      return;
    }

    setShowPaymentModal(true);
  };

  // Final Booking Dispatch to API with Stripe Payment
  const executeCarBooking = async () => {
    try {
      setSubmitting(true);

      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/booking-success";

      const payload: CarBookingPayload = {
        car_id: car!.id,
        start_date: startDate,
        end_date: endDate,
        pickup_time: formatTimeTo12Hour(pickupTime), // e.g. "10:00 AM"
        drop_time: formatTimeTo12Hour(dropTime), // e.g. "02:00 PM"
        pickup_type: pickupType, // "delivery" | "self"
        delivery_address: deliveryAddress.trim(),
        delivery_latitude: deliveryCoords.latitude,
        delivery_longitude: deliveryCoords.longitude,
        pickup_location: deliveryAddress.trim(),
        drop_location: deliveryAddress.trim(),
        payment_method: "stripe",
        is_partial: isPartialPayment ? 1 : 0,
        payment_platform: "app",
        callback: callbackUrl,
        description: description.trim() || undefined,
      };

      const res = await bookCar(payload);

      let redirectLink =
        (res as any)?.content?.url ||
        (res as any)?.content?.redirect_link ||
        (res as any)?.content?.redirect_url ||
        (res as any)?.content?.payment_url ||
        (res as any)?.url ||
        (res as any)?.redirect_link ||
        (res as any)?.redirect_url;

      const bookingRef = String(
        res?.content?.booking_id ||
        res?.content?.id ||
        `MMC-CAR-${Date.now().toString().slice(-6)}`
      );

      const isUuidStr = (str: any): boolean =>
        typeof str === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

      if (!redirectLink && isUuidStr(bookingRef)) {
        redirectLink = `https://mmcclub.co.uk/payment/stripe/pay?payment_id=${encodeURIComponent(
          String(bookingRef)
        )}`;
      }

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: bookingRef,
            readable_id: bookingRef,
            provider: car?.provider,
            schedule: `${startDate} ${pickupTime}`,
            price: numericPrice,
            is_partial: isPartialPayment ? 1 : 0,
            deposit_amount: depositAmount,
            service_name: `Car Hire: ${car?.brand || "Vehicle"} ${car?.model || ""}`.trim(),
          })
        );
      } catch { }

      if (redirectLink && redirectLink.startsWith("http") && !redirectLink.includes("payment_id=MMC-")) {
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = redirectLink;
        return;
      }

      setShowPaymentModal(false);
      if (
        res?.response_code === "booking_place_success_200" ||
        res?.response_code === "default_200" ||
        res?.content?.id ||
        res?.content?.booking_id
      ) {
        setIsSuccess(true);
        setBookingDetails(res.content);
        showToast("Booking Placed successfully!", "success");

        // Trigger native notification pop-up on user device
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("MMC Reservation Confirmed! 🚗", {
              body: `Your hire request for ${car?.brand || "your vehicle"} (Ref: ${res?.content?.booking_id || res?.content?.id || "Confirmed"}) has been placed!`,
              icon: "/mmc-logo.png",
              badge: "/mmc-logo.png",
            });
          } catch (notifErr) {
            console.warn("Local booking notification error:", notifErr);
          }
        }
      } else {
        showToast(
          res?.message || "Unable to place booking. Please try again.",
          "error"
        );
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        "Booking submission failed. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCar) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 size={36} className="text-[#FAD293] animate-spin" />
        <p className="text-xs text-white/50 tracking-wider uppercase">
          Preparing Vehicle Reservation Page...
        </p>
      </div>
    );
  }

  if (carError || !car) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-6 text-white">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold">Vehicle Not Available</h2>
          <p className="text-xs text-white/60">
            {carError || "The requested vehicle could not be loaded for booking."}
          </p>
        </div>
        <Link
          href="/car-hire"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-black text-xs"
          style={{
            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
          }}
        >
          <ArrowLeft size={14} />
          <span>Browse Available Fleet</span>
        </Link>
      </div>
    );
  }

  const primaryImage = getCarPrimaryImage(car);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B)",
        }}
      />

      {/* 1. Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 pt-4 pb-2 relative z-10">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/car-hire" className="hover:text-white transition">
            Car Hire
          </Link>
          <span>/</span>
          <Link href={`/car-hire/${car.id}`} className="hover:text-white transition truncate max-w-[150px]">
            {car.brand}
          </Link>
          <span>/</span>
          <span className="text-[#FAD293]">Reservation</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 relative z-10">
        {/* Main Booking Form Page Layout */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/car-hire/${car.id}`}
                  className="inline-flex items-center gap-1 text-xs text-[#FAD293] hover:underline"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Vehicle Details</span>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Vehicle Reservation
              </h1>
              <p className="text-xs text-white/50">
                Fill in your itinerary and preferred collection destination.
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-medium self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Available for Immediate Booking</span>
            </div>
          </div>

          {/* 2-Column Grid: Form on Left (7 cols) + Sticky Summary on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Itinerary, Location Search, Dates, Payment */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Vehicle Mini Summary Card */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#0d0d0d] border border-white/10">
                <img
                  src={primaryImage}
                  alt={car.brand}
                  className="w-24 h-16 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-[#FAD293] uppercase tracking-wider">
                    {car.type?.name || "Hire Fleet"}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {car.brand}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                    <span>{car.seating_capacity || 5} Seats</span>
                    <span>•</span>
                    <span>{car.transmission_type || "Automatic"}</span>
                    {car.manufacture_year && (
                      <>
                        <span>•</span>
                        <span>{car.manufacture_year}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-[#FAD293]">
                    {formatCurrency(dailyRate > 0 ? dailyRate : hourlyRate)}
                  </div>
                  <span className="text-[10px] text-white/40 block">
                    per {dailyRate > 0 ? "day" : "hour"}
                  </span>
                </div>
              </div>

              {/* 2. Collection Mode & Location Search Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#FAD293]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                      Collection & Delivery Details
                    </h3>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">
                    GPS Coordinates Enabled
                  </span>
                </div>

                {/* Mode Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">
                    Collection Preference (<code className="text-[#FAD293] text-[10px]">pickup_type</code>)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPickupType("delivery")}
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${pickupType === "delivery"
                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.15)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                        }`}
                    >
                      <Navigation size={13} />
                      <span>Doorstep Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPickupType("self")}
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${pickupType === "self"
                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.15)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                        }`}
                    >
                      <Building size={13} />
                      <span>Self Collection (HQ)</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Location Search Input with GPS Autocomplete */}
                <div className="space-y-1.5">
                  <LocationSearchInput
                    label={
                      pickupType === "delivery"
                        ? "Delivery Destination Address"
                        : "Collection Point / HQ Address"
                    }
                    placeholder="Type location, postcode or tap GPS detect..."
                    value={deliveryAddress}
                    coordinates={deliveryCoords}
                    onChange={handleLocationChange}
                    required
                    type="pickup"
                  />
                  <div className="flex items-center justify-between text-[11px] text-white/40 px-1 pt-1">
                    <span>Coordinates: Lat {deliveryCoords.latitude.toFixed(4)}, Lng {deliveryCoords.longitude.toFixed(4)}</span>
                    <span className="text-[#FAD293]/80">Search & GPS supported</span>
                  </div>
                </div>
              </div>

              {/* 3. Dates & Schedule Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#FAD293]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Hire Schedule
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#FAD293]" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#FAD293]" />
                      <span>End Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#FAD293]" />
                        <span>Pickup Time</span>
                      </span>
                      <span className="text-[#FAD293] font-mono text-[11px]">
                        {formatTimeTo12Hour(pickupTime)}
                      </span>
                    </label>
                    <input
                      type="time"
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#FAD293]" />
                        <span>Return / Drop Time</span>
                      </span>
                      <span className="text-[#FAD293] font-mono text-[11px]">
                        {formatTimeTo12Hour(dropTime)}
                      </span>
                    </label>
                    <input
                      type="time"
                      required
                      value={dropTime}
                      onChange={(e) => setDropTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Instructions & Payment Method */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#FAD293]" />
                    <span>Delivery Instructions / Description (Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Please deliver near the main gate or call upon arrival..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#FAD293]" />
                    <span>Payment Method</span>
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white">
                        Deposit (25% Advance) &amp; Full Online via Stripe
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#FAD293] bg-[#FAD293]/10 px-2 py-0.5 rounded-full border border-[#FAD293]/20">
                      Selectable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Reservation Summary & Submit CTA (5 cols) */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-white/15 bg-[#110e0c] p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs uppercase tracking-widest text-white/50 font-semibold">
                  <Sparkles size={14} className="text-[#FAD293]" />
                  <span>Hire Price Summary</span>
                </div>

                {/* Price Calculation Breakdown */}
                <div className="space-y-2.5 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-semibold text-white truncate max-w-[180px]">
                      {car.brand}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Rental Duration:</span>
                    <span className="text-white font-medium">
                      {diffDays} {diffDays === 1 ? "day" : "days"} ({startDate} to {endDate})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Hire Rate:</span>
                    <span className="text-white font-medium">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>

                  {deposit > 0 && (
                    <div className="flex justify-between">
                      <span>Refundable Security Deposit:</span>
                      <span className="font-semibold text-white font-mono">
                        {formatCurrency(deposit)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-white/10 text-base font-bold text-white">
                    <span>Estimated Total:</span>
                    <span
                      style={{
                        background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>

                {/* Total Quote Amount & 25% Deposit Eligible Badge (Matches UI) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                      Total Quote Amount
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      £{totalAmountFormatted}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAD293]/10 border border-[#FAD293]/30 text-[#FAD293] text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FAD293] animate-pulse" />
                      <span>25% Deposit Eligible</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Agreement Checkbox */}
                <label className="flex items-start gap-2.5 text-xs text-white/70 cursor-pointer select-none pt-2 border-t border-white/10">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-white/10 text-[#CEA46B] focus:ring-[#FAD293]"
                  />
                  <span>
                    I accept the hire terms, deposit policies, and confirm holding a valid driving license.
                  </span>
                </label>

                {/* Primary Submit Button */}
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e)}
                  disabled={submitting}
                  className="w-full py-4 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 disabled:opacity-50 shadow-xl shadow-[#FAD293]/10 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Reservation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Confirm Hire Booking</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="space-y-2 pt-2 text-[11px] text-white/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span>100% Certified Provider & Vehicle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Refundable Deposit Protected</span>
                  </div>
                </div>
              </div>

              {/* Provider Card */}
              {car.provider && (
                <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-neutral-800 shrink-0">
                    <img
                      src={
                        car.provider.logo_full_path ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={car.provider.company_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {car.provider.company_name}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {car.provider.company_address || "London"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* =========================================================
            BOOKING CONFIRMATION SUCCESS MODAL
        ========================================================== */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#FAD293]/40 bg-[#14100c] p-6 sm:p-8 text-white shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Reservation Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Booking Placed Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-white/65">
                Your hire request for <strong className="text-white">{car.brand}</strong> has been registered. The provider will verify vehicle preparation and delivery.
              </p>
            </div>

            {/* Booking Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-2.5 text-xs">
              {bookingDetails?.booking_id && (
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-white/50">Booking Reference:</span>
                  <span className="font-mono font-bold text-[#FAD293] truncate max-w-[200px]">
                    {bookingDetails.booking_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-white/50">Vehicle:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {car.brand}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Hire Dates:</span>
                <span className="text-white/90">
                  {startDate} to {endDate} ({diffDays} {diffDays === 1 ? "day" : "days"})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Schedule:</span>
                <span className="text-white/90">
                  {formatTimeTo12Hour(pickupTime)} - {formatTimeTo12Hour(dropTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Collection Mode:</span>
                <span className="text-white/90 capitalize">
                  {pickupType === "delivery" ? "Doorstep Delivery" : "Self Collection"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Delivery Address:</span>
                <span className="text-white/90 truncate max-w-[200px]">
                  {deliveryAddress}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white/70">Estimated Total:</span>
                <span className="text-[#FAD293]">
                  {formatCurrency(bookingDetails?.total_amount || estimatedTotal)}
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
                <span>View My Bookings</span>
              </Link>
              <Link
                href="/car-hire"
                className="py-3 px-4 rounded-xl font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 text-xs transition flex items-center justify-center gap-1.5"
              >
                <Car size={14} />
                <span>Browse More Cars</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Select Payment Method Modal / Bottom Sheet (Matches Bodywork/Chauffeur UI) */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-[#141518] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle for Mobile */}
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-1 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Select Payment Method
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Choose how you want to pay for this car hire reservation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Options */}
            <div className="space-y-3.5 pt-1">
              {/* Option 1: Deposit (25% Advance) */}
              <div
                onClick={() => setIsPartialPayment(true)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${isPartialPayment
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F6D089] to-[#D5A054] text-zinc-950 flex items-center justify-center shrink-0 shadow-md">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white">Deposit</span>
                        <span className="bg-[#D5A054]/25 text-[#E8AF66] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#D5A054]/40 uppercase tracking-wider">
                          25% ADVANCE
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Pay 25% deposit now to secure reservation
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${isPartialPayment
                      ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                      : "border-zinc-700 bg-zinc-900"
                      }`}
                  >
                    {isPartialPayment && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-zinc-300">Deposit Due Now (25%):</span>
                    <span className="text-sm font-extrabold text-[#E8AF66]">£{depositAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Due on vehicle arrival (75%):</span>
                    <span className="font-semibold text-zinc-300">£{remainingAmount}</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Online Payment (Full 100%) */}
              <div
                onClick={() => setIsPartialPayment(false)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${!isPartialPayment
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-[#E8AF66]" />
                    </div>
                    <div>
                      <span className="text-sm sm:text-base font-bold text-white block">Online Payment</span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Pay full amount now online
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${!isPartialPayment
                      ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                      : "border-zinc-700 bg-zinc-900"
                      }`}
                  >
                    {!isPartialPayment && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300">Amount Due Now:</span>
                  <span className="text-sm font-extrabold text-white">£{totalAmountFormatted}</span>
                </div>
              </div>
            </div>

            {/* Informational Callout Box */}
            <div className="bg-[#1C1A16]/90 border border-[#D5A054]/30 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#E8AF66] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#E8AF66] block">
                  {isPartialPayment
                    ? "25% Advance Payment Required"
                    : "100% Online Secure Payment"}
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isPartialPayment
                    ? "You must pay a 25% deposit upfront to confirm your reservation. The remaining 75% will be paid once the vehicle is delivered or handed over."
                    : "You will pay the full amount upfront securely via Stripe. Instant booking confirmation."}
                </p>
              </div>
            </div>

            {/* Pay Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={executeCarBooking}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                    <span>Redirecting to Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isPartialPayment
                        ? `PAY DEPOSIT (£${depositAmount})`
                        : `PAY FULL AMOUNT (£${totalAmountFormatted})`}
                    </span>
                    <ArrowRight className="w-5 h-5 text-zinc-950" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
