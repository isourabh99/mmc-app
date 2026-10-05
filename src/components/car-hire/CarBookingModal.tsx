"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth.api";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Car,
  Shield,
  ShieldCheck,
  Loader2,
  Sparkles,
  FileText,
  Navigation,
  Building,
  Banknote,
  Check,
  Info,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  CarItem,
  formatCurrency,
  getCarPrimaryImage,
  bookCar,
  formatTimeTo12Hour,
  getDigitalPaymentCallbackUrl,
  CarBookingPayload,
} from "@/lib/service/car.api";
import apiClient, { getBackendRootUrl } from "@/lib/http/apiClient";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";
import { useToast } from "@/components/ToastProvider";

interface CarBookingModalProps {
  car: CarItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CarBookingModal: React.FC<CarBookingModalProps> = ({
  car,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

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
  const [pricingType, setPricingType] = useState<"daily" | "hourly">("daily");
  const [hoursCount, setHoursCount] = useState<number>(4);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 51.5074,
    longitude: -0.1278,
  });

  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [description, setDescription] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Payment Selection Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (car && isOpen) {
      const carDaily = parseFloat(car.daily_rate || "0");
      const carHourly = parseFloat(car.hourly_rate || "0");
      if (car.pricing_type === "hourly" || (carHourly > 0 && carDaily === 0)) {
        setPricingType("hourly");
      } else {
        setPricingType("daily");
      }

      const initialAddress =
        car.address ||
        (car.postcode ? `${car.postcode}, London` : "55 Fordington House, London");
      setDeliveryAddress(initialAddress);

      if (car.provider?.coordinates) {
        setDeliveryCoords({
          latitude: parseFloat(car.provider.coordinates.latitude) || 51.5074,
          longitude: parseFloat(car.provider.coordinates.longitude) || -0.1278,
        });
      }

      setIsSuccess(false);
      setShowPaymentModal(false);
      setBookingDetails(null);
      setAgreeTerms(false);
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const primaryImage = getCarPrimaryImage(car);
  const dailyRate = parseFloat(car.daily_rate || "0");
  const hourlyRate = parseFloat(car.hourly_rate || "0");
  const deposit = parseFloat(car.security_deposit || "0");

  const effectiveDailyRate = dailyRate > 0 ? dailyRate : hourlyRate > 0 ? hourlyRate * 8 : 100;
  const effectiveHourlyRate = hourlyRate > 0 ? hourlyRate : dailyRate > 0 ? dailyRate / 8 : 15;

  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const rawDeliveryFee = parseFloat(car?.delivery_fee || "0");
  const deliveryFee = pickupType === "delivery" ? rawDeliveryFee : 0;

  const basePrice =
    pricingType === "hourly"
      ? effectiveHourlyRate * hoursCount
      : effectiveDailyRate * diffDays;
  const estimatedTotal = basePrice + deposit + deliveryFee;

  // Deposit & Total computations
  const numericPrice = estimatedTotal > 0 ? estimatedTotal : basePrice > 0 ? basePrice : 150;
  const depositAmount = (numericPrice * 0.25).toFixed(2);
  const remainingAmount = (numericPrice * 0.75).toFixed(2);
  const totalAmountFormatted = numericPrice.toFixed(2);

  const handleLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setDeliveryAddress(address);
    if (coords) {
      setDeliveryCoords(coords);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      showToast("Please login to book a vehicle.", "info");
      onClose();
      router.push("/login");
      return;
    }

    if (!agreeTerms) {
      showToast(
        "Please agree to the vehicle hire terms & deposit conditions before continuing.",
        "error"
      );
      return;
    }

    if (pickupType === "delivery" && !deliveryAddress.trim()) {
      showToast("Please enter or select a valid delivery address.", "error");
      return;
    }

    setShowPaymentModal(true);
  };

  const executeCarBooking = async () => {
    if (!isAuthenticated()) {
      showToast("Please login to book a vehicle.", "info");
      onClose();
      router.push("/login");
      return;
    }

    try {
      setSubmitting(true);

      const callbackUrl = getDigitalPaymentCallbackUrl();

      const payload: CarBookingPayload = {
        car_id: car.id,
        pricing_type: pricingType,
        hours: pricingType === "hourly" ? hoursCount : undefined,
        rent_amount: basePrice,
        total_amount: numericPrice,
        start_date: startDate,
        end_date: pricingType === "hourly" ? startDate : endDate,
        pickup_time: formatTimeTo12Hour(pickupTime), // e.g. "10:00 AM"
        drop_time: formatTimeTo12Hour(dropTime), // e.g. "02:00 PM"
        pickup_type: pickupType, // "delivery" | "self"
        ...(pickupType === "delivery"
          ? {
              delivery_address: deliveryAddress.trim(),
              delivery_latitude: deliveryCoords.latitude,
              delivery_longitude: deliveryCoords.longitude,
              pickup_location: deliveryAddress.trim(),
              drop_location: deliveryAddress.trim(),
            }
          : {}),
        payment_method: "stripe",
        is_partial: isPartialPayment ? 1 : 0,
        payment_platform: "app",
        callback: callbackUrl,
        description: description.trim() || undefined,
      };

      const res = await bookCar(payload);

      const bookingObj = res?.content?.booking;
      const bookingRef = String(
        bookingObj?.booking_id ||
        bookingObj?.booking?.id ||
        bookingObj?.booking?.readable_id ||
        bookingObj?.id ||
        res?.content?.booking_id ||
        res?.content?.id ||
        `MMC-CAR-${Date.now().toString().slice(-6)}`
      );

      let redirectLink =
        (res as any)?.content?.url ||
        (res as any)?.content?.redirect_link ||
        (res as any)?.content?.redirect_url ||
        (res as any)?.content?.payment_url ||
        (res as any)?.content?.link ||
        (res as any)?.url ||
        (res as any)?.redirect_link ||
        (res as any)?.redirect_url;

      // If backend didn't return URL directly, call /customer/booking/switch-payment-method to obtain Stripe gateway URL
      if (!redirectLink && bookingRef) {
        try {
          const switchRes = await apiClient.post("/customer/booking/switch-payment-method", {
            booking_id: bookingRef,
            payment_method: "stripe",
            is_partial: isPartialPayment ? 1 : 0,
            payment_platform: "app",
            callback: callbackUrl,
          });
          const sContent = switchRes.data?.content;
          const sRaw = (typeof sContent === "object" && sContent !== null) ? sContent : switchRes.data || {};
          if (typeof sContent === "string" && sContent.startsWith("http")) {
            redirectLink = sContent;
          } else {
            redirectLink =
              sRaw?.redirect_url ||
              sRaw?.redirect_link ||
              sRaw?.payment_url ||
              sRaw?.url ||
              sRaw?.link ||
              sRaw?.stripe_url ||
              sRaw?.data?.redirect_url ||
              sRaw?.data?.url;
          }
        } catch (switchErr) {
          console.warn("[CarBookingModal] switch-payment-method notice:", switchErr);
        }
      }

      const isUuidStr = (str: any): boolean =>
        typeof str === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

      if (!redirectLink && isUuidStr(bookingRef)) {
        redirectLink = `${getBackendRootUrl()}/payment/stripe/pay?payment_id=${encodeURIComponent(
          String(bookingRef)
        )}&is_partial=${isPartialPayment ? 1 : 0}`;
      }

      const respDepositAmount = (res as any)?.content?.amount ? parseFloat((res as any).content.amount) : (isPartialPayment ? parseFloat(depositAmount) : numericPrice);
      const respTotalAmount = (res as any)?.content?.booking?.total_amount ? parseFloat((res as any).content.booking.total_amount) : numericPrice;

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: bookingRef,
            readable_id: (res as any)?.content?.booking?.booking?.readable_id ? String((res as any).content.booking.booking.readable_id) : bookingRef,
            provider: car?.provider,
            schedule: `${startDate} ${formatTimeTo12Hour(pickupTime)}`,
            price: respTotalAmount,
            is_partial: isPartialPayment ? 1 : 0,
            deposit_amount: respDepositAmount,
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
              body: `Your hire request for ${car.brand} (Ref: ${res?.content?.booking_id || res?.content?.id || "Confirmed"}) has been placed!`,
              icon: "/mmc-logo.png",
              badge: "/mmc-logo.png",
            });
          } catch (notifErr) {
            console.warn("Local booking notification error:", notifErr);
          }
        }

        if (onSuccess) onSuccess();
      } else {
        showToast(
          res?.message || "Unable to complete booking. Please try again.",
          "error"
        );
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        "Booking submission failed. Please ensure you are logged in.";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#110e0c] shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] shrink-0">
              <Car size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {isSuccess ? "Reservation Confirmed" : "Vehicle Reservation"}
              </h2>
              <p className="text-xs text-white/50 truncate">
                {car.brand} {car.model ? `• ${car.model}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body: Success Screen OR Booking Form */}
        {isSuccess ? (
          /* Confirmation / Success Screen inside Modal */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                Reservation Confirmed
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Booking Placed Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto">
                Your hire request for <strong className="text-white">{car.brand}</strong> has been registered. The provider will verify vehicle preparation and delivery.
              </p>
            </div>

            {bookingDetails && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2.5 max-w-md mx-auto text-xs">
                {(bookingDetails?.booking?.booking_id || bookingDetails?.booking_id || bookingDetails?.booking?.id) && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-white/50">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#FAD293] truncate max-w-[200px]">
                      {bookingDetails?.booking?.booking_id || bookingDetails?.booking_id || bookingDetails?.booking?.id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">Hire Dates:</span>
                  <span className="text-white font-medium">
                    {startDate} to {endDate} ({diffDays} {diffDays === 1 ? "day" : "days"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Schedule:</span>
                  <span className="text-white font-medium">
                    {formatTimeTo12Hour(pickupTime)} - {formatTimeTo12Hour(dropTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Collection Mode:</span>
                  <span className="text-white font-medium capitalize">
                    {pickupType === "delivery" ? "Doorstep Delivery" : "Self Collection"}
                  </span>
                </div>
                {pickupType === "delivery" && deliveryAddress && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Delivery Address:</span>
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {deliveryAddress}
                    </span>
                  </div>
                )}
                {pickupType === "self" && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Collection Hub:</span>
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {car.address || (car.postcode ? `${car.postcode}, London` : "Dealership HQ / Hub")}
                    </span>
                  </div>
                )}
                {bookingDetails?.amount ? (
                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-sm">
                    <span className="text-white/70">Partial Deposit (25%):</span>
                    <span className="text-emerald-400">
                      {formatCurrency(bookingDetails.amount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span className="text-white/70">Total Hire Amount:</span>
                  <span className="text-[#FAD293]">
                    {formatCurrency(bookingDetails?.booking?.total_amount || bookingDetails?.total_amount || estimatedTotal)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-black text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-98 transition"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                Browse More Vehicles
              </button>
              <Link
                href="/account?tab=bookings"
                onClick={onClose}
                className="px-5 py-3 rounded-xl font-semibold text-white/90 bg-white/5 border border-white/15 text-xs sm:text-sm hover:bg-white/10 transition"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        ) : (
          /* Main Booking Form inside Modal */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
            {/* 1. Mini Vehicle Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <img
                src={primaryImage}
                alt={car.brand}
                className="w-20 h-14 object-cover rounded-lg shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-[#FAD293] uppercase tracking-wider">
                  {car.type?.name || "Hire Fleet"}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {car.brand}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                  <span>{car.seating_capacity || 5} Seats</span>
                  <span>•</span>
                  <span>{car.transmission_type || "Automatic"}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-extrabold text-[#FAD293]">
                  {formatCurrency(dailyRate > 0 ? dailyRate : hourlyRate)}
                </div>
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">
                  per {dailyRate > 0 ? "day" : "hour"}
                </span>
              </div>
            </div>

            {/* 2. Hire Pricing Option (Daily vs Hourly) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/80">
                  Hire Pricing Option (<code className="text-[#FAD293] text-[10px]">pricing_type</code>)
                </label>
                <span className="text-[9px] font-bold text-[#FAD293] bg-[#FAD293]/10 px-2 py-0.5 rounded-full border border-[#FAD293]/20 capitalize">
                  {pricingType}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPricingType("daily")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 ${
                    pricingType === "daily"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.1)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calendar size={13} />
                    <span>Daily Rate</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/80">
                    {formatCurrency(effectiveDailyRate)} / day
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingType("hourly")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 ${
                    pricingType === "hourly"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.1)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock size={13} />
                    <span>Hourly Rate</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/80">
                    {formatCurrency(effectiveHourlyRate)} / hr
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Collection Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">
                Collection Mode (<code className="text-[#FAD293] text-[10px]">pickup_type</code>)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPickupType("delivery")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    pickupType === "delivery"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.1)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <Navigation size={13} />
                  <span>Doorstep Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPickupType("self")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    pickupType === "self"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.1)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <Building size={13} />
                  <span>Self Collection</span>
                </button>
              </div>
            </div>

            {/* 4. Interactive Location Search vs Dealership Hub Card */}
            {pickupType === "delivery" ? (
              <div className="space-y-1 animate-in fade-in duration-200">
                <LocationSearchInput
                  label="Pickup Point / Delivery Destination"
                  placeholder="Type location, postcode or tap GPS detect..."
                  value={deliveryAddress}
                  coordinates={deliveryCoords}
                  onChange={handleLocationChange}
                  required
                  type="pickup"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/5 border border-[#FAD293]/20 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building size={13} className="text-[#FAD293]" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Collection Hub / Dealership HQ
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Self Pickup • Free
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium">
                  {car.address || (car.postcode ? `${car.postcode}, London` : "Silbury House, Sydenham Hill, London, SE26 6TU")}
                </p>
                <p className="text-[10px] text-white/40">
                  Collect the vehicle in-person during your scheduled time slot with your ID &amp; booking reference.
                </p>
              </div>
            )}

            {/* 5. Dates & Times Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FAD293]" />
                  <span>{pricingType === "hourly" ? "Booking Date" : "Start Date"}</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                />
              </div>

              {pricingType === "daily" ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#FAD293]" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                    <Clock size={12} className="text-[#FAD293]" />
                    <span>Duration</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#FAD293] font-bold">
                    <span>{hoursCount} Hours Package</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#FAD293]" />
                    <span>Pickup Time</span>
                  </span>
                  <span className="text-[#FAD293] font-mono text-[10px]">
                    {formatTimeTo12Hour(pickupTime)}
                  </span>
                </label>
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#FAD293]" />
                    <span>Drop Time</span>
                  </span>
                  <span className="text-[#FAD293] font-mono text-[10px]">
                    {formatTimeTo12Hour(dropTime)}
                  </span>
                </label>
                <input
                  type="time"
                  required
                  value={dropTime}
                  onChange={(e) => setDropTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                />
              </div>
            </div>

            {/* 5. Instructions / Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                <FileText size={12} className="text-[#FAD293]" />
                <span>Instructions / Description (Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Please deliver near the main gate"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
              />
            </div>

            {/* 6. Payment Method */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                <CreditCard size={12} className="text-[#FAD293]" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
              >
                <option value="cash_after_service" className="bg-neutral-900">
                  Cash After Service / Upon Collection
                </option>
                <option value="stripe" className="bg-neutral-900">
                  Credit / Debit Card (Stripe)
                </option>
                <option value="offline" className="bg-neutral-900">
                  Offline Bank Transfer
                </option>
              </select>
            </div>

            {/* 7. Pricing Breakdown */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Collection Mode:</span>
                <span className="text-[#FAD293] font-semibold">
                  {pickupType === "delivery" ? "Doorstep Delivery" : "Self Collection (HQ)"}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>
                  Hire Rate ({diffDays} {diffDays === 1 ? "day" : "days"}):
                </span>
                <span className="text-white font-medium">
                  {formatCurrency(basePrice)}
                </span>
              </div>
              {deposit > 0 && (
                <div className="flex justify-between text-white/60">
                  <span>Refundable Security Deposit:</span>
                  <span className="text-white font-medium font-mono">
                    {formatCurrency(deposit)}
                  </span>
                </div>
              )}
              {pickupType === "delivery" && rawDeliveryFee > 0 && (
                <div className="flex justify-between text-white/60">
                  <span>Doorstep Delivery Fee:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(rawDeliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                <span className="text-white">Estimated Total:</span>
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

            {/* 8. Terms Checkbox */}
            <label className="flex items-start gap-2 text-[11px] text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/10 text-[#CEA46B] focus:ring-[#FAD293]"
              />
              <span>
                I agree to the car hire terms, driving licence verification, and deposit terms.
              </span>
            </label>

            {/* 9. Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-black text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 disabled:opacity-50 shadow-xl shadow-[#FAD293]/10 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Placing Booking...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Confirm Hire Booking</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Select Payment Method Modal (25% Deposit vs 100% Full Payment via Stripe) */}
      {showPaymentModal && car && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-[#141518] border border-[#FAD293]/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Select Payment Method
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Choose how you want to pay for {car.brand}
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

            {/* Payment Options (Deposit 25% vs Full 100%) */}
            <div className="space-y-3.5 pt-1">
              {/* Option 1: Deposit (25% Advance) */}
              <div
                onClick={() => setIsPartialPayment(true)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                  isPartialPayment
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
                        Pay 25% deposit now to confirm vehicle reservation
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isPartialPayment
                        ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                        : "border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    {isPartialPayment && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-zinc-300">Deposit Due Now (25%):</span>
                    <span className="text-sm font-extrabold text-[#E8AF66]">£{depositAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Due after vehicle return (75%):</span>
                    <span className="font-semibold text-zinc-300">£{remainingAmount}</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Online Payment (Full 100%) */}
              <div
                onClick={() => setIsPartialPayment(false)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                  !isPartialPayment
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
                        Pay full hire amount now securely via Stripe
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      !isPartialPayment
                        ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                        : "border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    {!isPartialPayment && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
                  {isPartialPayment ? "25% Advance Deposit Required" : "100% Online Secure Payment"}
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isPartialPayment
                    ? "Pay 25% deposit now to secure your reservation. The remaining 75% will be settled when the vehicle hire ends."
                    : "Pay the full amount upfront securely via Stripe for instant vehicle confirmation."}
                </p>
              </div>
            </div>

            {/* Pay CTA */}
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
                    <span>Redirecting to Stripe Gateway...</span>
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
};
