"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Loader2,
  Sparkles,
  FileText,
  Building,
  Car,
  User,
  Phone,
  Zap,
  Wrench,
  Compass,
} from "lucide-react";
import {
  TyreItem,
  UKVehicleLookup,
  TyreBookingPayload,
  TyreBookingResponse,
} from "@/lib/data/tyres.data";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";
import { useToast } from "@/components/ToastProvider";

interface TyreBookingModalProps {
  tyre: TyreItem | null;
  initialQuantity: number;
  initialVehicle?: UKVehicleLookup | null;
  initialServiceMode: "customer" | "provider";
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TyreBookingModal: React.FC<TyreBookingModalProps> = ({
  tyre,
  initialQuantity,
  initialVehicle,
  initialServiceMode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];

  const [quantity, setQuantity] = useState(initialQuantity || 2);
  const [serviceMode, setServiceMode] = useState<"customer" | "provider">(
    initialServiceMode || "customer"
  );
  const [bookingType, setBookingType] = useState<"normal" | "emergency">("normal");

  // Vehicle Details
  const [regNumber, setRegNumber] = useState(initialVehicle?.registration || "UK22 ABC");
  const [carModel, setCarModel] = useState(
    initialVehicle ? `${initialVehicle.make} ${initialVehicle.model}` : "Toyota Corolla"
  );
  const [carYear, setCarYear] = useState(initialVehicle?.year || "2022");
  const [carColor, setCarColor] = useState(initialVehicle?.color || "White");

  // Schedule
  const [scheduleDate, setScheduleDate] = useState(todayStr);
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState("10:00 - 12:00");

  // Address & Contacts
  const [address, setAddress] = useState("Flat 4B, Baker Street, London");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 51.5074,
    longitude: -0.1278,
  });
  const [contactName, setContactName] = useState("John Doe");
  const [contactPhone, setContactPhone] = useState("+44 7123 456789");

  // Payment & Notes
  const [paymentMethod, setPaymentMethod] = useState<"cash_after_service" | "stripe" | "offline">(
    "cash_after_service"
  );
  const [notes, setNotes] = useState("Please bring both tyres for rear axle mobile fitting.");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<TyreBookingResponse | null>(null);

  // Sync props when opened
  useEffect(() => {
    if (isOpen && tyre) {
      setQuantity(initialQuantity || 2);
      setServiceMode(initialServiceMode || "customer");
      if (initialVehicle) {
        setRegNumber(initialVehicle.registration);
        setCarModel(`${initialVehicle.make} ${initialVehicle.model}`);
        setCarYear(initialVehicle.year);
        setCarColor(initialVehicle.color);
      }
      setIsSuccess(false);
      setBookingResponse(null);
      setAgreeTerms(false);
    }
  }, [isOpen, tyre, initialQuantity, initialVehicle, initialServiceMode]);

  if (!isOpen || !tyre) return null;

  // Price calculations
  const tyreSubtotal = tyre.unit_price * quantity;
  const fittingSubtotal = tyre.fitting_fee * quantity;
  const emergencyFee = bookingType === "emergency" ? 45.0 : 0.0;
  const mobileCalloutFee = serviceMode === "customer" ? 0.0 : 0.0; // Free mobile callout included
  const totalAmount = tyreSubtotal + fittingSubtotal + emergencyFee + mobileCalloutFee;

  const formatGBP = (val: number) =>
    `£${val.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleLocationChange = (
    newAddress: string,
    newCoords?: { latitude: number; longitude: number }
  ) => {
    setAddress(newAddress);
    if (newCoords) setCoords(newCoords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      showToast("Please agree to the tyre fitting and warranty terms before proceeding.", "error");
      return;
    }

    if (!address.trim()) {
      showToast("Please provide a valid fitting location address.", "error");
      return;
    }

    if (!regNumber.trim() || !contactPhone.trim()) {
      showToast("Vehicle registration and contact number are required.", "error");
      return;
    }

    setSubmitting(true);

    // Simulate instant local dispatch
    setTimeout(() => {
      const generatedRef = `MMC-TYRE-${Math.floor(100000 + Math.random() * 900000)}`;

      const responseObj: TyreBookingResponse = {
        response_code: "booking_place_success_200",
        message: "Tyre fitting reservation requested successfully!",
        booking_reference: generatedRef,
        total_amount: totalAmount,
        service_schedule: `${scheduleDate} ${scheduleTimeSlot}`,
        service_location: serviceMode === "customer" ? "Mobile Van at Customer Location" : "Certified Garage Station",
        car_registration_number: regNumber.toUpperCase(),
        car_model: carModel,
        tyre: tyre,
        quantity: quantity,
        created_at: new Date().toISOString(),
      };

      setBookingResponse(responseObj);
      setIsSuccess(true);
      setSubmitting(false);
      showToast("Tyre Fitting Booking Placed successfully!", "success");

      // Trigger native notification pop-up on user device
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("MMC Tyre Fitting Confirmed! 🛞", {
            body: `Booking Ref #${generatedRef} confirmed for ${quantity}x ${tyre.brand} ${tyre.model}!`,
            icon: "/mmc-logo.png",
            badge: "/mmc-logo.png",
          });
        } catch (notifErr) {
          console.warn("Tyre notification error:", notifErr);
        }
      }

      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#110e0c] shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] shrink-0">
              <Truck size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {isSuccess ? "Fitting Request Confirmed" : "Tyre Fitting & Mobile Dispatch"}
              </h2>
              <p className="text-xs text-white/50 truncate">
                Zone: London Central (a1614dbe) • {tyre.brand} {tyre.model}
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

        {/* Modal Body: Success Screen vs Form */}
        {isSuccess && bookingResponse ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                Fitting Appointment Scheduled
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Fitting Booking Placed Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto">
                Your order for <strong className="text-white">{quantity}x {tyre.brand} {tyre.model}</strong> has been registered. The mobile van technician will arrive during your designated window.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2.5 max-w-md mx-auto text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50">Booking Reference:</span>
                <span className="font-mono font-bold text-[#FAD293]">
                  {bookingResponse.booking_reference}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Vehicle:</span>
                <span className="text-white font-medium">
                  {bookingResponse.car_model} ({bookingResponse.car_registration_number})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Tyres:</span>
                <span className="text-white font-medium">
                  {quantity}x {tyre.size_string}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Appointment Slot:</span>
                <span className="text-white font-medium">
                  {bookingResponse.service_schedule}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Fitting Mode:</span>
                <span className="text-white font-medium">
                  {bookingResponse.service_location}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Location:</span>
                <span className="text-white font-medium truncate max-w-[200px]">
                  {address}
                </span>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white/70">Total Fitted Price:</span>
                <span className="text-[#FAD293]">
                  {formatGBP(bookingResponse.total_amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-black text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-98 transition"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                Browse More Tyres
              </button>
              <Link
                href="/account?tab=bookings"
                onClick={onClose}
                className="px-5 py-3 rounded-xl font-semibold text-white/90 bg-white/5 border border-white/15 text-xs sm:text-sm hover:bg-white/10 transition"
              >
                View In Bookings
              </Link>
            </div>
          </div>
        ) : (
          /* Main Interactive Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto no-scrollbar">
            {/* 1. Tyre Selection Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <img
                src={tyre.image_url}
                alt={tyre.model}
                className="w-16 h-16 object-contain rounded-lg shrink-0 bg-neutral-900/60 p-1"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#FAD293] uppercase tracking-wider">
                  {tyre.brand}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {tyre.model}
                </h4>
                <div className="font-mono text-[11px] text-white/70 mt-0.5">
                  {tyre.size_string}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-extrabold text-[#FAD293]">
                  {formatGBP(tyre.unit_price + tyre.fitting_fee)}
                </div>
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">
                  each fully fitted
                </span>
              </div>
            </div>

            {/* 2. Service Location Mode Selector & Booking Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">
                  Fitting Method (<code className="text-[#FAD293] text-[10px]">service_location</code>)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceMode("customer")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      serviceMode === "customer"
                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Truck size={13} />
                    <span>Mobile Van</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceMode("provider")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      serviceMode === "provider"
                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Building size={13} />
                    <span>Garage Station</span>
                  </button>
                </div>
              </div>

              {/* Booking Type: Normal vs Emergency 24/7 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">
                  Priority / Speed (<code className="text-[#FAD293] text-[10px]">booking_type</code>)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingType("normal")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      bookingType === "normal"
                        ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Calendar size={13} />
                    <span>Standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingType("emergency")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      bookingType === "emergency"
                        ? "border-red-500 bg-red-950/60 text-red-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Zap size={13} className="text-red-400" />
                    <span>Rapid Callout (+£45)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Location Search & GPS Autocomplete */}
            <div className="space-y-1">
              <LocationSearchInput
                label={
                  serviceMode === "customer"
                    ? "Service Destination Address"
                    : "Fitting Garage Point / Address"
                }
                placeholder="Type street, postcode or tap GPS detect..."
                value={address}
                coordinates={coords}
                onChange={handleLocationChange}
                required
                type="pickup"
              />
            </div>

            {/* 4. Vehicle Details Grid (Matching API Request) */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Car size={14} className="text-[#FAD293]" />
                <span>Vehicle Identification (<code className="text-[#FAD293] text-[10px]">car_registration_number</code>)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60">Reg Plate</label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-white uppercase focus:border-[#FAD293] outline-none"
                    placeholder="UK22 ABC"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60">Car Model</label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
                    placeholder="Toyota Corolla"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60">Year</label>
                  <input
                    type="text"
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none font-mono"
                    placeholder="2022"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-white/60">Color</label>
                  <input
                    type="text"
                    value={carColor}
                    onChange={(e) => setCarColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
                    placeholder="White"
                  />
                </div>
              </div>
            </div>

            {/* 5. Schedule & Appointment Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FAD293]" />
                  <span>Fitting Date (<code className="text-[#FAD293] text-[10px]">service_schedule</code>)</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <Clock size={12} className="text-[#FAD293]" />
                  <span>Arrival Window Slot</span>
                </label>
                <select
                  value={scheduleTimeSlot}
                  onChange={(e) => setScheduleTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                >
                  <option value="08:00 - 10:00" className="bg-neutral-900">08:00 AM - 10:00 AM (Early Morning)</option>
                  <option value="10:00 - 12:00" className="bg-neutral-900">10:00 AM - 12:00 PM (Morning Window)</option>
                  <option value="12:00 - 14:00" className="bg-neutral-900">12:00 PM - 02:00 PM (Midday Window)</option>
                  <option value="14:00 - 16:00" className="bg-neutral-900">02:00 PM - 04:00 PM (Afternoon Window)</option>
                  <option value="16:00 - 18:00" className="bg-neutral-900">04:00 PM - 06:00 PM (Late Afternoon)</option>
                </select>
              </div>
            </div>

            {/* 6. Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <User size={12} className="text-[#FAD293]" />
                  <span>Contact Person Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  <Phone size={12} className="text-[#FAD293]" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FAD293]"
                  placeholder="+44 7123 456789"
                />
              </div>
            </div>

            {/* 7. Special Instructions Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                <FileText size={12} className="text-[#FAD293]" />
                <span>Fitting Instructions / Notes (<code className="text-[#FAD293] text-[10px]">notes</code>)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please bring both tyres for rear axle mobile fitting"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
              />
            </div>

            {/* 8. Payment Method */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                <CreditCard size={12} className="text-[#FAD293]" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
              >
                <option value="cash_after_service" className="bg-neutral-900">
                  Cash After Service / Pay Upon Fitting Completion
                </option>
                <option value="stripe" className="bg-neutral-900">
                  Online Card Payment (Stripe)
                </option>
                <option value="offline" className="bg-neutral-900">
                  Offline Bank Transfer / Invoice
                </option>
              </select>
            </div>

            {/* 9. Live Pricing Breakdown */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Tyre Cost ({quantity}x {tyre.model}):</span>
                <span className="text-white font-medium">{formatGBP(tyreSubtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Valves, Electronic Balancing & Eco Disposal:</span>
                <span className="text-white font-medium">{formatGBP(fittingSubtotal)}</span>
              </div>
              {emergencyFee > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Emergency Rapid Van Dispatch:</span>
                  <span className="font-bold">{formatGBP(emergencyFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/60">
                <span>Mobile Van Dispatch Callout:</span>
                <span className="text-emerald-400 font-medium">FREE (Included)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                <span className="text-white">Estimated Total:</span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {formatGBP(totalAmount)}
                </span>
              </div>
            </div>

            {/* 10. Terms Agreement */}
            <label className="flex items-start gap-2 text-[11px] text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/10 text-[#CEA46B] focus:ring-[#FAD293]"
              />
              <span>
                I agree to the tyre fitting terms, wheel nut torque verification, and manufacturer warranty policy.
              </span>
            </label>

            {/* 11. Submit Button */}
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
                  <span>Dispatching Request...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Confirm Tyre Fitting Appointment</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
