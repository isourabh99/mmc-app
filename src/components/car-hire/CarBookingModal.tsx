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
} from "lucide-react";
import {
  CarItem,
  formatCurrency,
  getCarPrimaryImage,
  bookCar,
  formatTimeTo12Hour,
  CarBookingPayload,
} from "@/lib/service/car.api";
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

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (car && isOpen) {
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
      setBookingDetails(null);
      setAgreeTerms(false);
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const primaryImage = getCarPrimaryImage(car);
  const dailyRate = parseFloat(car.daily_rate || "0");
  const hourlyRate = parseFloat(car.hourly_rate || "0");
  const deposit = parseFloat(car.security_deposit || "0");

  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePrice =
    dailyRate > 0 ? dailyRate * diffDays : hourlyRate > 0 ? hourlyRate * 4 * diffDays : 0;
  const estimatedTotal = basePrice + deposit;

  const handleLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setDeliveryAddress(address);
    if (coords) {
      setDeliveryCoords(coords);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!deliveryAddress.trim()) {
      showToast("Please enter or select a valid delivery address.", "error");
      return;
    }

    try {
      setSubmitting(true);

      const payload: CarBookingPayload = {
        car_id: car.id,
        start_date: startDate,
        end_date: endDate,
        pickup_time: formatTimeTo12Hour(pickupTime), // e.g. "10:00 AM"
        drop_time: formatTimeTo12Hour(dropTime), // e.g. "02:00 PM"
        pickup_type: pickupType, // "delivery" | "self"
        delivery_address: deliveryAddress.trim(),
        delivery_latitude: deliveryCoords.latitude,
        payment_method: "cash_after_service",
        description: description.trim() || undefined,
      };

      const res = await bookCar(payload);

      if (
        res?.response_code === "booking_place_success_200" ||
        res?.response_code === "default_200" ||
        res?.content?.id ||
        res?.content?.booking_id
      ) {
        setIsSuccess(true);
        setBookingDetails(res.content);
        showToast("Booking Placed successfully!", "success");
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
                {bookingDetails.booking_id && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-white/50">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#FAD293] truncate max-w-[200px]">
                      {bookingDetails.booking_id}
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
                <div className="flex justify-between">
                  <span className="text-white/50">Delivery Address:</span>
                  <span className="text-white font-medium truncate max-w-[180px]">
                    {deliveryAddress}
                  </span>
                </div>
                {bookingDetails.total_amount && (
                  <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                    <span className="text-white/70">Estimated Total:</span>
                    <span className="text-[#FAD293]">
                      {formatCurrency(bookingDetails.total_amount)}
                    </span>
                  </div>
                )}
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

            {/* 2. Collection Mode Selection */}
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

            {/* 3. Interactive Location Search with GPS Detect & Search Dropdown */}
            <div className="space-y-1">
              <LocationSearchInput
                label={
                  pickupType === "delivery"
                    ? "Pickup Point / Address"
                    : "Collection Point / HQ Address"
                }
                placeholder="Type location, postcode or tap GPS detect..."
                value={deliveryAddress}
                coordinates={deliveryCoords}
                onChange={handleLocationChange}
                required
                type="pickup"
              />
            </div>

            {/* 4. Dates & Times Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FAD293]" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                />
              </div>

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
              className="w-full py-3.5 rounded-xl font-bold text-black text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 disabled:opacity-50 shadow-xl shadow-[#FAD293]/10"
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
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
