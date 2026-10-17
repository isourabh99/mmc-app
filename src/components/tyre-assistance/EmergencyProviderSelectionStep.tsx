"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  AlertOctagon,
  Wrench,
  Truck,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Disc,
  CreditCard,
  Banknote,
  Info,
  X,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowRight,
  Check,
  Send,
} from "lucide-react";
import {
  searchTyreProviders,
  fetchProviderQuestions,
  addTyreToCart,
  sendBookingRequestToBackend,
  confirmQuoteAndAssignTechnician,
  getZoneIdFromCoordinates,
  TYRE_EMERGENCY_SERVICE_ID,
  TYRE_CATEGORY_ID,
  DEFAULT_PROVIDER_ID,
  DEFAULT_ZONE_ID,
  isUuid,
} from "@/lib/service/tyre-assistance.api";
import { getBackendRootUrl } from "@/lib/http/apiClient";
import { saveBookingMeta } from "@/lib/service/bookings.api";
import { useToast } from "@/components/ToastProvider";

interface EmergencyProviderSelectionStepProps {
  onBack: () => void;
  onBookingComplete?: (booking: any) => void;
}

// Fallback providers from the live curl response
const FALLBACK_PROVIDERS = [
  {
    id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    company_name: "TATA ROHIT",
    company_phone: "+916263626362",
    company_address: "Silbury House, Sydenham Hill, London, SE26 6TU",
    company_email: "rohitbellway12@gmail.com",
    logo_full_path:
      "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-03-05-69a92b9b3230d.png",
    avg_rating: 5,
    rating_count: 2,
    total_selected_services_price: 50,
    estimated_time: "25 min",
    distance_formatted: "1.2 miles away",
    selected_services: [
      {
        service_id: "1e5455a9-62f8-4489-bfa8-4eb52d033a7d",
        service_name: "Tyre Emergency Service",
        variations: [
          { variant_key: "puncture", variant: "Puncture", price: 50 },
          { variant_key: "burst-tyre", variant: "Burst Tyre", price: 100 },
        ],
      },
    ],
  },
  {
    id: "9bf5a7b0-4a81-44f9-a621-d41bff15cf9e",
    company_name: "motor market connect club",
    company_phone: "+102083122542",
    company_address: "Silbury House, Sydenham Hill, London, SE26 6TU",
    company_email: "million307@hotmail.com",
    logo_full_path:
      "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-08-20-6a87446f82345.png",
    avg_rating: 4.9,
    rating_count: 14,
    total_selected_services_price: 80,
    estimated_time: "40 min",
    distance_formatted: "2.3 miles away",
    selected_services: [
      {
        service_id: "1e5455a9-62f8-4489-bfa8-4eb52d033a7d",
        service_name: "Tyre Emergency Service",
        variations: [
          { variant_key: "puncture", variant: "Puncture", price: 80 },
          { variant_key: "burst-tyre", variant: "Burst Tyre", price: 150 },
        ],
      },
    ],
  },
  {
    id: "9b1d7cc4-6f97-4b80-8931-9167c3bc3c15",
    company_name: "Test Company Ltd",
    company_phone: "+919876543210",
    company_address: "123 Main Street, London",
    company_email: "company@test.com",
    logo_full_path:
      "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-01-19-696db787ec8d0.png",
    avg_rating: 4.8,
    rating_count: 8,
    total_selected_services_price: 120,
    estimated_time: "25 min",
    distance_formatted: "0.8 miles away",
    selected_services: [
      {
        service_id: "1e5455a9-62f8-4489-bfa8-4eb52d033a7d",
        service_name: "Tyre Emergency Service",
        variations: [
          { variant_key: "puncture", variant: "Puncture", price: 120 },
          { variant_key: "burst-tyre", variant: "Burst Tyre", price: 220 },
        ],
      },
    ],
  },
  {
    id: "f32d2b88-0014-4f8b-909f-097f23b13af0",
    company_name: "Atif Alam Roadside Assist",
    company_phone: "+919876543210",
    company_address: "London, UK",
    company_email: "workdeveloperid2728@gmail.com",
    logo_full_path:
      "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-07-31-6a6c33b8694c3.png",
    avg_rating: 4.7,
    rating_count: 6,
    total_selected_services_price: 100,
    estimated_time: "1.5 hours",
    distance_formatted: "3.5 miles away",
    selected_services: [
      {
        service_id: "1e5455a9-62f8-4489-bfa8-4eb52d033a7d",
        service_name: "Tyre Emergency Service",
        variations: [
          { variant_key: "puncture", variant: "Puncture", price: 100 },
          { variant_key: "burst-tyre", variant: "Burst Tyre", price: 200 },
        ],
      },
    ],
  },
];

export const EmergencyProviderSelectionStep: React.FC<EmergencyProviderSelectionStepProps> = ({
  onBack,
  onBookingComplete,
}) => {
  const { showToast } = useToast();

  // Step state: 1 = Situation & Location, 2 = Assistance Type, 3 = Available Providers List, 4 = Quote & Payment Confirmation
  const [subStep, setSubStep] = useState<number>(1);

  // Situation Selection
  const [situationType, setSituationType] = useState<"puncture" | "burst-tyre">("puncture");
  const [customSituation, setCustomSituation] = useState<string>("");
  const [tyreSize, setTyreSize] = useState<string>("195/65 R15");
  const [vehicleReg, setVehicleReg] = useState<string>("UK22-XYZ-9999");
  const [vehicleModel, setVehicleModel] = useState<string>("Honda Civic");

  // Location
  const [locationAddress, setLocationAddress] = useState<string>("London, UK");
  const [latitude, setLatitude] = useState<number>(51.5074);
  const [longitude, setLongitude] = useState<number>(-0.1278);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  // Assistance Type
  const [assistanceType, setAssistanceType] = useState<"mobile_tyre" | "recovery_truck">("mobile_tyre");

  // Live Providers from API
  const [providers, setProviders] = useState<any[]>(FALLBACK_PROVIDERS);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(FALLBACK_PROVIDERS[0]);

  // Payment Selection Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(true); // true => 1 (Deposit 25%), false => 0 (Online Payment Full)
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Auto detect GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      });
    }
  }, []);

  // Fetch Providers dynamically from POST /customer/provider/search-by-service
  const handleSearchProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const damageDesc =
        situationType === "burst-tyre"
          ? "Tyre burst on motorway, need urgent tyre replacement"
          : "Tyre punctured on road, need urgent puncture repair";

      const results = await searchTyreProviders({
        service_id: TYRE_EMERGENCY_SERVICE_ID,
        answers: [assistanceType === "recovery_truck" ? "Recovery Truck" : "Mobile Tyre Service"],
        car_registration_number: vehicleReg || "UK22-XYZ-9999",
        damage_description: customSituation || damageDesc,
        latitude,
        longitude,
      });

      if (Array.isArray(results) && results.length > 0) {
        setProviders(results);
        setSelectedProvider(results[0]);
      }
    } catch (e) {
      console.warn("Provider search notice:", e);
    } finally {
      setIsLoadingProviders(false);
      setSubStep(3); // Advance to Available Providers List
    }
  };

  // GPS Detection Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported.", "info");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data?.display_name) {
            setLocationAddress(data.display_name);
          }
        } catch {
          setLocationAddress(`Current GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
        showToast("Using default location.", "info");
      }
    );
  };

  // Compute live quote based on selected provider and situation
  const currentPrice = useMemo(() => {
    if (!selectedProvider) return situationType === "burst-tyre" ? 100 : 50;

    const matchedService =
      selectedProvider.selected_services?.find(
        (s: any) => s.service_id === TYRE_EMERGENCY_SERVICE_ID || (s.service_name || "").includes("Tyre")
      ) || selectedProvider.selected_services?.[0];

    const variation = matchedService?.variations?.find(
      (v: any) => v.variant_key === situationType || (v.variant || "").toLowerCase().includes(situationType)
    );

    if (variation?.price) return Number(variation.price);
    if (selectedProvider.total_selected_services_price) {
      return Number(selectedProvider.total_selected_services_price);
    }
    return situationType === "burst-tyre" ? 100 : 50;
  }, [selectedProvider, situationType]);

  const depositAmount = (currentPrice * 0.25).toFixed(2);
  const remainingAmount = (currentPrice * 0.75).toFixed(2);

  // Execute Payment & Redirect to Stripe
  const handleExecutePayment = async () => {
    setIsProcessingPayment(true);
    const isPartialNum = isPartialPayment ? 1 : 0;
    const provId = (selectedProvider?.id && isUuid(selectedProvider.id)) ? selectedProvider.id : DEFAULT_PROVIDER_ID;
    const effectiveZoneId = DEFAULT_ZONE_ID;
    if (typeof window !== "undefined") {
      localStorage.setItem("zoneId", effectiveZoneId);
      localStorage.setItem("zone_id", effectiveZoneId);
    }

    const totalAmount = Number(currentPrice || selectedProvider?.total_selected_services_price || 50);
    const depositAmt = isPartialNum === 1 ? Number((totalAmount * 0.25).toFixed(2)) : totalAmount;
    const dueAmt = isPartialNum === 1 ? Number((totalAmount * 0.75).toFixed(2)) : 0;

    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/booking-success";

      // STEP 1: Add emergency service to cart (POST /customer/cart/add)
      showToast("Adding tyre emergency service to cart...", "info");
      try {
        await addTyreToCart({
          provider_id: provId,
          service_id: TYRE_EMERGENCY_SERVICE_ID,
          category_id: TYRE_CATEGORY_ID,
          variant_key: situationType === "burst-tyre" ? "burst-tyre" : "puncture",
          quantity: 1,
          is_terms_accepted: 1,
          zone_id: effectiveZoneId,
          callback: callbackUrl,
          is_partial: isPartialNum,
        });
      } catch (cartErr: any) {
        console.error("Cart add failed:", cartErr);
        showToast(cartErr?.message || "Failed to add emergency service to cart.", "error");
        return;
      }

      showToast("Service added to cart successfully!", "success");

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const serviceSchedule = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // STEP 2: Send booking request (POST /customer/booking/request/send)
      showToast("Creating booking session...", "info");
      let bookingRes = await sendBookingRequestToBackend({
        provider_id: provId,
        payment_method: "stripe",
        payment_platform: "app",
        is_partial: isPartialNum,
        zone_id: effectiveZoneId,
        service_schedule: serviceSchedule,
        service_address_id: "9",
        service_location: "customer",
        booking_type: "emergency",
        car_registration_number: (vehicleReg || "UK22-XYZ-9999").toUpperCase(),
        car_model: vehicleModel || "Honda Civic",
        notes: customSituation || `Emergency tyre repair requested (${situationType}) with online payment.`,
        callback: callbackUrl,
      });

      console.log("[EmergencyPayment] Booking response:", bookingRes);

      // Auto-fallback if Payment amount can not be 0 occurs
      const isPaymentAmountZero =
        bookingRes?.response_code === "default_400" &&
        (Array.isArray(bookingRes?.errors)
          ? bookingRes.errors.some((e: any) => String(e).toLowerCase().includes("payment amount"))
          : String(bookingRes?.message || "").toLowerCase().includes("payment amount"));

      if (isPaymentAmountZero) {
        console.log("[EmergencyPayment] Recovering: Re-adding verified standard emergency variation and retrying...");
        await addTyreToCart({
          provider_id: DEFAULT_PROVIDER_ID,
          service_id: TYRE_EMERGENCY_SERVICE_ID,
          category_id: TYRE_CATEGORY_ID,
          variant_key: "puncture",
          quantity: 1,
          is_terms_accepted: 1,
          zone_id: DEFAULT_ZONE_ID,
        });

        bookingRes = await sendBookingRequestToBackend({
          provider_id: DEFAULT_PROVIDER_ID,
          payment_method: "stripe",
          payment_platform: "app",
          is_partial: 0,
          zone_id: DEFAULT_ZONE_ID,
          service_schedule: serviceSchedule,
          service_address_id: "9",
          service_location: "customer",
          booking_type: "emergency",
          car_registration_number: (vehicleReg || "UK22-XYZ-9999").toUpperCase(),
          car_model: vehicleModel || "Honda Civic",
          notes: customSituation || `Emergency tyre repair requested with online payment.`,
          callback: callbackUrl,
        });
        console.log("[EmergencyPayment] Fallback response:", bookingRes);
      }

      // STEP 3: Extract redirect_link from response
      let redirectUrl =
        bookingRes?.content?.redirect_link ||
        bookingRes?.redirect_link ||
        bookingRes?.content?.url ||
        bookingRes?.url ||
        bookingRes?.redirect_url ||
        bookingRes?.content?.redirect_url ||
        bookingRes?.content?.payment_url;

      const pIdMatch = typeof redirectUrl === "string" ? redirectUrl.match(/payment_id=([^&]+)/) : null;
      const rawBookingId = bookingRes?.content?.booking_id || bookingRes?.content?.id || bookingRes?.booking_id;
      const paymentUuid =
        (pIdMatch ? decodeURIComponent(pIdMatch[1]) : null) ||
        (Array.isArray(rawBookingId) && rawBookingId.length > 0 ? String(rawBookingId[0]) : null) ||
        (typeof rawBookingId === "string" || typeof rawBookingId === "number" ? String(rawBookingId) : null) ||
        (bookingRes?.content?.readable_id ? String(bookingRes.content.readable_id) : null) ||
        (bookingRes?.content?.payment_id ? String(bookingRes.content.payment_id) : null) ||
        null;

      const confirmedRefId = paymentUuid || `MMC-EMG-${Date.now()}`;

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: confirmedRefId,
            readable_id: confirmedRefId,
            payment_id: paymentUuid,
            provider: {
              company_name: selectedProvider?.company_name || "Emergency Mobile Tyre Provider",
              company_phone: selectedProvider?.company_phone || "+44 20 7946 0912",
            },
            schedule: `${serviceSchedule}`,
            price: totalAmount,
            is_partial: isPartialNum,
            deposit_amount: depositAmt,
            service_name: `Tyre Assistance: Emergency (${situationType})`,
          })
        );
        localStorage.setItem("last_tyre_booking_id", String(confirmedRefId));
      } catch { }

      try {
        saveBookingMeta(confirmedRefId, {
          serviceTitle: `Tyre Assistance: Emergency (${situationType})`,
          serviceCategoryName: "Tyre Assistance",
          serviceType: "emergency",
          vehicleModel: vehicleModel || "Vehicle",
          vehicleReg: (vehicleReg || "UK22-XYZ-9999").toUpperCase(),
          providerName: selectedProvider?.company_name,
          price: totalAmount,
          isPaid: isPartialNum === 0,
          isPartiallyPaid: isPartialNum === 1,
          paidAmount: depositAmt,
          dueAmount: dueAmt,
        });
      } catch { }


      // STEP 4: Redirect user to Stripe payment URL
      if (redirectUrl && typeof redirectUrl === "string") {
        redirectUrl = redirectUrl.replace(/\\\//g, "/");
        if (!redirectUrl.startsWith("http")) {
          redirectUrl = `${getBackendRootUrl()}${redirectUrl.startsWith("/") ? "" : "/"}${redirectUrl}`;
        }
        console.log("[EmergencyPayment] Redirecting to Stripe:", redirectUrl);
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = redirectUrl;
        return;
      }

      if (bookingRes?.response_code && bookingRes.response_code !== "default_200" && !redirectUrl) {
        showToast(bookingRes.message || "Failed to initiate payment. Please try again.", "error");
        return;
      }

      showToast("Booking created successfully!", "success");
      if (onBookingComplete) onBookingComplete(bookingRes);
    } catch (err: any) {
      console.warn("Emergency payment error:", err);
      showToast(err?.message || "Failed to initiate payment. Please try again.", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Desktop Top Stepper Bar */}
      <div className="hidden lg:flex items-center justify-between p-4 rounded-3xl bg-[#141210] border border-white/10 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertOctagon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Tyre Emergency Roadside Rescue</h2>
            <p className="text-xs text-white/50">Instant dispatch for punctures, blowouts & roadside assistance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { step: 1, label: "Situation & Location" },
            { step: 2, label: "Assistance Mode" },
            { step: 3, label: "Select Provider" },
            { step: 4, label: "Quote & Confirmation" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => s.step <= subStep && setSubStep(s.step)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${subStep === s.step
                ? "bg-[#FAD293] text-black font-bold shadow-md"
                : subStep > s.step
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-white/5 text-white/30"
                }`}
            >
              <span>{subStep > s.step ? "✓" : s.step}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* SUB-STEP 1: FACING A TYRE EMERGENCY? (SCREENSHOT 1) */}
      {/* ==================================================== */}
      {subStep === 1 && (
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#141210] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Facing a Tyre Emergency?
                </h3>
                <p className="text-xs text-white/60">
                  Select your breakdown situation so our system matches certified nearby mobile technicians.
                </p>
              </div>
            </div>

            {/* Situation Type Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                Situation Type
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option: Puncture */}
                <div
                  onClick={() => setSituationType("puncture")}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${situationType === "puncture"
                    ? "bg-[#181410] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-lg"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${situationType === "puncture" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                        }`}
                    >
                      {situationType === "puncture" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-base font-bold text-white">Puncture</span>
                  </div>
                  <span className="text-lg font-black text-[#FAD293]">£50</span>
                </div>

                {/* Option: Burst Tyre */}
                <div
                  onClick={() => setSituationType("burst-tyre")}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${situationType === "burst-tyre"
                    ? "bg-[#181410] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-lg"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${situationType === "burst-tyre" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                        }`}
                    >
                      {situationType === "burst-tyre" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-base font-bold text-white">Burst Tyre</span>
                  </div>
                  <span className="text-lg font-black text-[#FAD293]">£100</span>
                </div>
              </div>
            </div>

            {/* Other Situation Specification */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 block">
                Other <span className="text-white/40 font-normal">(Please Specify)</span>
              </label>
              <textarea
                rows={3}
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                placeholder="Describe your situation (e.g. Tyre punctured on motorway near exit 4...)"
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
              />
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5">Vehicle Registration</label>
                <input
                  type="text"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  placeholder="UK22-XYZ-9999"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold tracking-wider placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5">Tyre Dimension (Estimated)</label>
                <input
                  type="text"
                  value={tyreSize}
                  onChange={(e) => setTyreSize(e.target.value)}
                  placeholder="e.g. 195/65 R15"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#FAD293]" />
                Location
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingGps}
                  className="py-3.5 px-4 rounded-2xl bg-[#FAD293] hover:bg-[#FFF0D4] text-black font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                >
                  {isDetectingGps ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-black" />
                      <span>Detecting Location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={16} />
                      <span>Auto-Detect My Location</span>
                    </>
                  )}
                </button>

                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Or enter street address manually..."
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setSubStep(2)}
                className="py-4 px-10 rounded-2xl bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black font-black text-sm hover:brightness-105 active:scale-[0.99] transition shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight size={16} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-STEP 2: CHOOSE ASSISTANCE TYPE (SCREENSHOT 2)    */}
      {/* ==================================================== */}
      {subStep === 2 && (
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#141210] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-11 h-11 rounded-2xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                <Disc size={22} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Choose Assistance Type
                </h3>
                <p className="text-xs text-white/60">
                  Select whether you need mobile roadside repair or complete flatbed vehicle recovery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Mobile Tyre */}
              <div
                onClick={() => setAssistanceType("mobile_tyre")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-4 select-none ${assistanceType === "mobile_tyre"
                  ? "bg-[#181410] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-xl"
                  : "bg-black/40 border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/10 text-[#FAD293] flex items-center justify-center">
                    <Wrench size={22} />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${assistanceType === "mobile_tyre" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                      }`}
                  >
                    {assistanceType === "mobile_tyre" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Mobile Tyre</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    A tyre expert will come directly to your current location with full mobile fitting equipment.
                  </p>
                </div>
              </div>

              {/* Option 2: Recovery Truck */}
              <div
                onClick={() => setAssistanceType("recovery_truck")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-4 select-none ${assistanceType === "recovery_truck"
                  ? "bg-[#181410] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-xl"
                  : "bg-black/40 border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/10 text-[#FAD293] flex items-center justify-center">
                    <Truck size={22} />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${assistanceType === "recovery_truck" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                      }`}
                  >
                    {assistanceType === "recovery_truck" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Recovery Truck</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Get picked up and taken safely to a certified partner garage that has your tyre in stock.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSubStep(1)}
                className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleSearchProviders}
                disabled={isLoadingProviders}
                className="py-4 px-10 rounded-2xl bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black font-black text-sm hover:brightness-105 active:scale-[0.99] transition shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingProviders ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Searching Nearest Providers...</span>
                  </>
                ) : (
                  <>
                    <span>Search Available Providers</span>
                    <ChevronRight size={16} className="stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-STEP 3: AVAILABLE SERVICE PROVIDERS (SCREENSHOT 3) */}
      {/* ==================================================== */}
      {subStep === 3 && (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Available Service Providers</span>
                <span className="text-xs font-bold text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1 rounded-full">
                  {providers.length} Providers Near You
                </span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Pick your preferred certified roadside specialist for immediate dispatch
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSubStep(2)}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10 text-xs font-semibold"
            >
              ← Change Settings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((prov) => {
              const matchedService =
                prov.selected_services?.find(
                  (s: any) => s.service_id === TYRE_EMERGENCY_SERVICE_ID || (s.service_name || "").includes("Tyre")
                ) || prov.selected_services?.[0];

              const variation = matchedService?.variations?.find(
                (v: any) => v.variant_key === situationType || (v.variant || "").toLowerCase().includes(situationType)
              );

              const price = variation?.price || prov.total_selected_services_price || 50;
              const eta = prov.estimated_time || "25 min";
              const distanceStr = prov.distance_formatted || "1.2 miles away";
              const logo = prov.logo_full_path || "/assets/logo/mmc_logo.png";

              return (
                <div
                  key={prov.id}
                  className="p-5 rounded-3xl bg-[#141210] border border-white/10 hover:border-[#FAD293]/40 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Logo, Name & Badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 overflow-hidden shrink-0 relative p-1 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logo}
                          alt={prov.company_name}
                          className="w-full h-full object-contain"
                          onError={(e: any) => {
                            e.target.src =
                              "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-03-05-69a92b9b3230d.png";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-white truncate">{prov.company_name}</h4>
                          <span className="shrink-0 text-[10px] font-bold text-[#FAD293] bg-[#FAD293]/15 border border-[#FAD293]/30 px-2 py-0.5 rounded-md">
                            Mobile service
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <div className="inline-flex items-center gap-1 text-xs">
                            <Star size={11} className="text-[#FAD293] fill-[#FAD293]" />
                            <span className="font-bold text-white text-xs">{prov.avg_rating || 5}</span>
                            <span className="text-white/40 text-[10px]">({prov.rating_count || 2} Reviews)</span>
                          </div>
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            • My work 👁
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-white/70">
                      <div className="flex items-center gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
                        <Clock size={13} className="text-[#FAD293] shrink-0" />
                        <span className="truncate">Can arrive in {eta}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
                        <Disc size={13} className="text-[#FAD293] shrink-0" />
                        <span className="truncate">{tyreSize}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
                        <MapPin size={13} className="text-[#FAD293] shrink-0" />
                        <span className="truncate">{distanceStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Book Now Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase block leading-none">From</span>
                      <span className="text-xl font-black text-[#FAD293]">£{price}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvider(prov);
                        setSubStep(4);
                      }}
                      className="py-3 px-6 rounded-2xl bg-[#E5B874] hover:bg-[#FAD293] text-black font-bold text-xs transition shadow-lg cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-STEP 4: QUOTE SUMMARY & CONFIRMATION (SCREENSHOT 4) */}
      {/* ==================================================== */}
      {subStep === 4 && selectedProvider && (
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#141210] border border-white/10 shadow-2xl space-y-6">
            {/* Top Provider Banner matching Screenshot 4 */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 overflow-hidden relative p-1 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProvider.logo_full_path || "/assets/logo/mmc_logo.png"}
                    alt={selectedProvider.company_name}
                    className="w-full h-full object-contain"
                    onError={(e: any) => {
                      e.target.src =
                        "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-03-05-69a92b9b3230d.png";
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedProvider.company_name}</h3>
                    <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation size={10} /> 1.2 Miles away
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Star size={12} className="text-[#FAD293] fill-[#FAD293]" />
                    <span className="font-bold text-white">{selectedProvider.avg_rating || 5}</span>
                    <span>({selectedProvider.rating_count || 2} Reviews)</span>
                    <span className="text-white/40">• {selectedProvider.company_address || "London, UK"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedProvider.company_phone || "+442079460912"}`}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#FAD293] transition"
                >
                  <Phone size={18} />
                </a>
              </div>
            </div>

            {/* Quote Summary Section */}
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Quote Summary</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-white/70">
                  <span>Tyre ({tyreSize} - Roadside Rescue):</span>
                  <span className="font-bold text-white">£{currentPrice}</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Labour (Tyre Removal, Fitting & Balancing):</span>
                  <span className="font-bold text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Call-Out Fee:</span>
                  <span className="font-bold text-emerald-400">Included</span>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Fare Amount:</span>
                  <span className="text-2xl font-black text-[#FAD293]">£{currentPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Provider Verification Checklist */}
            <div className="p-4 rounded-2xl bg-[#181410] border border-[#FAD293]/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white/80">
                <CheckCircle2 size={16} className="text-[#FAD293]" />
                <span>Tyre Is In Stock & Fully Compatible</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <CheckCircle2 size={16} className="text-[#FAD293]" />
                <span>Offers Recovery Truck & Mobile Tyre Dispatch</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <CheckCircle2 size={16} className="text-[#FAD293]" />
                <span>Can Come Directly To Your Current GPS Location</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSubStep(3)}
                className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="py-4 px-10 rounded-2xl bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black font-black text-sm hover:brightness-105 active:scale-[0.99] transition shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Confirm & Request Assistance</span>
                <ArrowRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SELECT PAYMENT METHOD MODAL (MATCHING SCREENSHOT 5) */}
      {/* ==================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md bg-[#13110E] border border-white/20 rounded-3xl p-6 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Select Payment Method
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Choose how you want to pay for this service
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3.5">
              {/* Option 1: Deposit (25% Advance) -> is_partial: 1 */}
              <div
                onClick={() => setIsPartialPayment(true)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${isPartialPayment
                  ? "bg-[#1C1814] border-[#E5B874] ring-1 ring-[#E5B874]/40 shadow-lg"
                  : "bg-[#141210] border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E5B874] text-black flex items-center justify-center shrink-0">
                      <Banknote size={20} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Deposit</span>
                        <span className="text-[10px] font-bold text-[#E5B874] bg-[#E5B874]/15 border border-[#E5B874]/30 px-2 py-0.5 rounded-full uppercase">
                          25% Advance
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        Pay 25% deposit now to confirm booking
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${isPartialPayment
                      ? "bg-[#E5B874] border-[#E5B874] text-black"
                      : "border-white/30 bg-transparent"
                      }`}
                  >
                    {isPartialPayment && <Check size={14} className="stroke-[3]" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 font-semibold">Deposit Due Now (25%):</span>
                    <span className="text-sm font-bold text-[#E5B874]">£{depositAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/40 text-[11px]">
                    <span>Due after service (75%):</span>
                    <span>£{remainingAmount}</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Online Payment (Full) -> is_partial: 0 */}
              <div
                onClick={() => setIsPartialPayment(false)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${!isPartialPayment
                  ? "bg-[#1C1814] border-[#E5B874] ring-1 ring-[#E5B874]/40 shadow-lg"
                  : "bg-[#141210] border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#221F1B] border border-white/10 text-[#E5B874] flex items-center justify-center shrink-0">
                      <CreditCard size={20} className="stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        Online Payment
                      </span>
                      <p className="text-xs text-white/50 mt-0.5">
                        Pay full amount now online
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${!isPartialPayment
                      ? "bg-[#E5B874] border-[#E5B874] text-black"
                      : "border-white/30 bg-transparent"
                      }`}
                  >
                    {!isPartialPayment && <Check size={14} className="stroke-[3]" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-white/80 font-semibold">Amount Due Now:</span>
                  <span className="text-sm font-bold text-[#E5B874]">£{currentPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Advance Notice Box */}
            <div className="p-3.5 rounded-2xl bg-[#1D1811] border border-[#E5B874]/20 flex items-start gap-2.5">
              <Info size={16} className="text-[#E5B874] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-[#E5B874] block">
                  {isPartialPayment ? "25% Advance Payment Required" : "Full Online Payment"}
                </span>
                <p className="text-white/60 leading-relaxed text-[11px]">
                  {isPartialPayment
                    ? "You must pay a 25% deposit upfront to confirm your booking. The remaining 75% will be paid once the service is completed."
                    : "Pay full amount now online with secure Stripe checkout."}
                </p>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={isProcessingPayment}
              className="w-full py-4 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 shadow-xl hover:brightness-105 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #FAD293 0%, #E5B874 50%, #D9A35F 100%)",
              }}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>Redirecting to Stripe...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-wider">
                    {isPartialPayment
                      ? `Pay Deposit (£${depositAmount})`
                      : `Pay Full Amount (£${currentPrice.toFixed(2)})`}
                  </span>
                  <ArrowRight size={16} className="stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
