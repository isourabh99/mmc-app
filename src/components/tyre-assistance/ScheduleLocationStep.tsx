"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  Home,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Star,
  Banknote,
  CreditCard,
  Check,
  X,
  Info,
  Car,
  ShieldCheck,
  Sparkles,
  Navigation,
  Disc,
} from "lucide-react";
import {
  fetchProviderSlots,
  fetchDynamicTyres,
  fetchTyreDetails,
  ProviderSlot,
  BackendTyreItem,
  DEFAULT_PROVIDER_ID,
  TYRE_REPLACEMENT_SERVICE_ID,
  TYRE_EMERGENCY_SERVICE_ID,
  getZoneIdFromCoordinates,
} from "@/lib/service/tyre-assistance.api";

export type ServiceLocationType = "mobile_repair" | "workshop";

interface EmergencyVariation {
  variant_key: string;
  variant: string;
  price: number;
}

interface ScheduleLocationStepProps {
  category: "emergency" | "replacement" | "puncture" | "upgrades" | string;
  assistanceType?: "mobile_tyre" | "recovery_truck";
  selectedTyre?: BackendTyreItem | null;
  onSubmit: (details: {
    serviceLocationType: ServiceLocationType;
    scheduledDate: string;
    scheduledTimeSlot: string;
    selectedSlotId?: string;
    locationAddress: string;
    locationPostcode: string;
    latitude: number;
    longitude: number;
    vehicleMakeModel: string;
    vehicleRegistration: string;
    variantKey?: string;
    serviceId?: string;
    tyreSize: string;
    tyreQuantity: number;
    selectedTyreId?: string;
    selectedTyrePrice?: number;
    situation?: string;
    notes: string;
    acceptedPrivacy: boolean;
    providerId?: string;
    isPartial?: number; // 1 for Deposit, 0 for Full
  }) => Promise<void>;
  onBack: () => void;
}

export const ScheduleLocationStep: React.FC<ScheduleLocationStepProps> = ({
  category,
  assistanceType = "mobile_tyre",
  selectedTyre = null,
  onSubmit,
  onBack,
}) => {
  // Form fields
  const [serviceLocationType, setServiceLocationType] =
    useState<ServiceLocationType>("mobile_repair");
  const [scheduledDate, setScheduledDate] = useState<string>("Today");
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>("03:27:00");
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>("slot-0327");
  const [locationAddress, setLocationAddress] = useState<string>("London, United Kingdom");
  const [locationPostcode, setLocationPostcode] = useState<string>("SW1A 1AA");
  const [latitude, setLatitude] = useState<number>(51.5074);
  const [longitude, setLongitude] = useState<number>(-0.1278);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>("Honda Civic");
  const [vehicleRegistration, setVehicleRegistration] = useState<string>("UK22-XYZ-9999");
  const [tyreSize, setTyreSize] = useState<string>(selectedTyre?.size || "205/55 R16 91V");
  const [tyreQuantity, setTyreQuantity] = useState<number>(1);
  const [situation, setSituation] = useState<string>("Puncture");
  const [notes, setNotes] = useState<string>("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(true);

  // Live Slots
  const [slots, setSlots] = useState<ProviderSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Selected Tyre data
  const [activeTyre, setActiveTyre] = useState<BackendTyreItem | null>(selectedTyre);
  const [selectedTyreId, setSelectedTyreId] = useState<string>(selectedTyre?.id || "2c4b2b2e-b974-4405-bf67-06ef5f8a94eb");

  // Emergency variations
  const [emergencyVariations, setEmergencyVariations] = useState<EmergencyVariation[]>([
    { variant_key: "puncture", variant: "Puncture Repair", price: 50 },
    { variant_key: "burst-tyre", variant: "Burst Tyre Replacement", price: 100 },
  ]);
  const [selectedEmergencyVariantKey, setSelectedEmergencyVariantKey] = useState<string>("puncture");

  // Submission & modal states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment Selection Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(true); // true => 1 (25% Deposit), false => 0 (Full)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);
  const [thumbError, setThumbError] = useState<boolean>(false);

  // Auto-detect GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => { }
      );
    }
  }, []);

  // Compute 7 calendar days
  const calendarDays = useMemo(() => {
    const days: { label: string; dayNum: string; dayInitial: string; isoDate: string }[] = [];
    const now = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const iso = d.toISOString().split("T")[0];
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dayInitial = dayNames[d.getDay()];
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${dayInitial} ${dayNum}`;
      days.push({ label, dayNum, dayInitial, isoDate: iso });
    }
    return days;
  }, []);

  // Fetch tyre details if needed
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (category === "replacement" && !activeTyre && selectedTyreId) {
        try {
          const detail = await fetchTyreDetails(selectedTyreId);
          if (mounted && detail) {
            setActiveTyre(detail);
            setTyreSize(detail.size || "205/55 R16 91V");
          }
        } catch { }
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [category, activeTyre, selectedTyreId]);

  // Fetch live provider slots dynamically
  useEffect(() => {
    let active = true;
    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        let effectiveDate = scheduledDate;
        if (scheduledDate === "Today") {
          effectiveDate = new Date().toISOString().split("T")[0];
        } else if (scheduledDate === "Tomorrow") {
          const tom = new Date(Date.now() + 86400000);
          effectiveDate = tom.toISOString().split("T")[0];
        }

        const provId =
          activeTyre?.provider_id ||
          (activeTyre?.provider as any)?.id ||
          DEFAULT_PROVIDER_ID;

        const liveSlots = await fetchProviderSlots(provId, effectiveDate);
        if (!active) return;

        if (liveSlots && liveSlots.length > 0) {
          setSlots(liveSlots);
          const firstAvailable = liveSlots.find((s) => s.is_available) || liveSlots[0];
          setSelectedSlotId(firstAvailable.id);
          const slotLabel =
            firstAvailable.start_time.length > 5
              ? firstAvailable.start_time
              : `${firstAvailable.start_time}:00`;
          setScheduledTimeSlot(slotLabel);
        } else {
          const fallbackSlots: ProviderSlot[] = [
            {
              id: "slot-0900",
              provider_id: provId,
              start_time: "09:00:00",
              end_time: "10:00:00",
              is_available: true,
            },
            {
              id: "slot-1100",
              provider_id: provId,
              start_time: "11:00:00",
              end_time: "12:00:00",
              is_available: true,
            },
            {
              id: "slot-1400",
              provider_id: provId,
              start_time: "14:00:00",
              end_time: "15:00:00",
              is_available: true,
            },
            {
              id: "slot-1630",
              provider_id: provId,
              start_time: "16:30:00",
              end_time: "17:30:00",
              is_available: true,
            },
          ];
          setSlots(fallbackSlots);
          setSelectedSlotId(fallbackSlots[0].id);
          setScheduledTimeSlot("09:00:00");
        }
      } catch {
        // Fallback
        const fallbackSlots: ProviderSlot[] = [
          {
            id: "slot-0900",
            provider_id: DEFAULT_PROVIDER_ID,
            start_time: "09:00:00",
            end_time: "10:00:00",
            is_available: true,
          },
          {
            id: "slot-1400",
            provider_id: DEFAULT_PROVIDER_ID,
            start_time: "14:00:00",
            end_time: "15:00:00",
            is_available: true,
          },
        ];
        if (active) {
          setSlots(fallbackSlots);
          setSelectedSlotId(fallbackSlots[0].id);
          setScheduledTimeSlot("09:00:00");
        }
      } finally {
        if (active) setIsLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [scheduledDate, activeTyre]);

  // Fare calculations
  const unitPrice =
    category === "emergency"
      ? (emergencyVariations.find((v) => v.variant_key === selectedEmergencyVariantKey)?.price || 50)
      : Number(activeTyre?.price || 85);

  const numericFare = unitPrice * tyreQuantity;
  const depositAmount = (numericFare * 0.25).toFixed(2);
  const remainingAmount = (numericFare * 0.75).toFixed(2);

  // Open Payment Modal
  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedPrivacy) {
      setErrorMsg("Please accept the Privacy Policy to proceed.");
      return;
    }
    setErrorMsg(null);
    setShowPaymentModal(true);
  };

  // Final Submit to Stripe Checkout
  const handleConfirmAndPay = async () => {
    setIsConfirmingPayment(true);
    setIsSubmitting(true);
    setErrorMsg(null);

    const isEmergency = category === "emergency";
    const chosenTyre = activeTyre;
    const chosenEmergencyVar = isEmergency
      ? emergencyVariations.find((v) => v.variant_key === selectedEmergencyVariantKey)
      : undefined;

    try {
      await onSubmit({
        serviceLocationType,
        scheduledDate: scheduledDate || "Today",
        scheduledTimeSlot,
        selectedSlotId: selectedSlotId || (slots.length > 0 ? slots[0].id : undefined),
        locationAddress: locationAddress || "London, UK",
        locationPostcode: locationPostcode || "SW1A 1AA",
        latitude,
        longitude,
        vehicleMakeModel: vehicleMakeModel || (chosenTyre ? `${chosenTyre.brand} ${chosenTyre.model}` : "Honda Civic"),
        vehicleRegistration: (vehicleRegistration || "UK22-XYZ-9999").toUpperCase(),
        variantKey: isEmergency ? selectedEmergencyVariantKey : undefined,
        serviceId: isEmergency ? TYRE_EMERGENCY_SERVICE_ID : TYRE_REPLACEMENT_SERVICE_ID,
        tyreSize: tyreSize || chosenTyre?.size || "205/55 R16 91V",
        tyreQuantity: isEmergency ? 1 : tyreQuantity,
        selectedTyreId: !isEmergency ? (chosenTyre?.id || selectedTyreId) : undefined,
        selectedTyrePrice: numericFare,
        situation: isEmergency
          ? chosenEmergencyVar?.variant || "Puncture"
          : situation,
        notes: notes || "Tyre replacement service requested via mobile app",
        acceptedPrivacy,
        providerId: chosenTyre?.provider_id || (chosenTyre?.provider as any)?.id || DEFAULT_PROVIDER_ID,
        isPartial: isPartialPayment ? 1 : 0, // 1 for Deposit (25%), 0 for Online Payment (Full)
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit booking request. Please try again.");
      setIsSubmitting(false);
      setIsConfirmingPayment(false);
    }
  };

  const renderTyreThumbnail = (tyre: BackendTyreItem | null) => {
    const rawImg =
      (tyre?.image_full_paths && tyre.image_full_paths[0]) ||
      (tyre?.images && tyre.images[0] && tyre.images[0].startsWith("http")
        ? tyre.images[0]
        : tyre?.images && tyre.images[0]
        ? `https://mmcclub.co.uk/backend/storage/app/public/tyre/${tyre.images[0]}`
        : "");

    if (rawImg && !thumbError) {
      return (
        <div className="relative w-24 h-20 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rawImg}
            alt={tyre?.model || "Tyre"}
            onError={() => setThumbError(true)}
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
      );
    }

    return (
      <div className="relative w-24 h-20 flex items-center justify-center p-1">
        <svg
          viewBox="0 0 200 130"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="45" cy="85" r="28" fill="#111" stroke="#333" strokeWidth="6" />
          <circle cx="45" cy="85" r="16" fill="#0A0A0A" stroke="#2563EB" strokeWidth="4" />
          <circle cx="155" cy="85" r="28" fill="#111" stroke="#333" strokeWidth="6" />
          <circle cx="155" cy="85" r="16" fill="#0A0A0A" stroke="#2563EB" strokeWidth="4" />
          <path d="M 45 85 L 85 70 L 115 50 L 155 85" stroke="#4B5563" strokeWidth="5" />
          <path d="M 85 70 L 100 85 L 140 85" stroke="#374151" strokeWidth="4" />
          <rect x="75" y="65" width="35" height="22" rx="4" fill="#1F2937" />
          <path
            d="M 65 52 C 75 42, 100 40, 115 45 C 130 50, 145 35, 150 48 C 145 60, 130 65, 115 65 C 95 65, 80 62, 65 52 Z"
            fill="#1D4ED8"
          />
          <path d="M 125 38 C 132 28, 142 30, 145 42 Z" fill="#E0F2FE" fillOpacity="0.8" />
        </svg>
      </div>
    );
  };

  const displayTitle = activeTyre
    ? `${activeTyre.brand} ${activeTyre.model}`
    : "Continental PremiumContact 6";
  const displaySize = activeTyre?.size || "205/55 R16 91V";

  return (
    <div className="w-full space-y-7 animate-fade-in text-white pb-16">
      {/* 1. Top Header Banner */}
      <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FAD293]/15 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Tyre Selection</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Calendar size={12} />
              Appointment Scheduling
            </span>
          </div>
        </div>

        <div className="space-y-1 relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Schedule Your Fitting & Location
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Choose your preferred date, time slot, and location for certified doorstep fitting.
          </p>
        </div>
      </div>

      {/* 2. Main 2-Column Responsive Form Grid */}
      <form onSubmit={handleOpenPaymentModal}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Schedule, Location & Vehicle Details (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Date and Time Section */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-[#FAD293]" />
                  <span className="text-sm font-bold text-white">Select Appointment Date & Time</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  Live Slots
                </span>
              </div>

              {/* Day Selector Pills */}
              <div className="space-y-2">
                <span className="text-xs text-white/50 font-medium block">Available Dates:</span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const isSelected =
                      scheduledDate === day.isoDate ||
                      (scheduledDate === "Today" && day.label === "Today");

                    return (
                      <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => setScheduledDate(day.isoDate)}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#FAD293] border-[#FAD293] text-black shadow-lg ring-2 ring-[#FAD293]/30"
                            : "bg-[#1C1A17] border-white/5 text-white/70 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${isSelected ? "text-black" : "text-white/50"}`}>
                          {day.dayInitial}
                        </span>
                        <span className={`text-sm font-black ${isSelected ? "text-black" : "text-white"}`}>
                          {day.dayNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2 pt-2">
                <span className="text-xs text-white/50 font-medium block">Select Time Slot:</span>
                {isLoadingSlots ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-white/50">
                    <Loader2 size={16} className="animate-spin text-[#FAD293]" />
                    <span>Loading available provider slots...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {slots.map((slot) => {
                      const timeStr = slot.start_time.length > 5 ? slot.start_time : `${slot.start_time}:00`;
                      const isSelected = selectedSlotId === slot.id || scheduledTimeSlot === timeStr;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setScheduledTimeSlot(timeStr);
                          }}
                          className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            isSelected
                              ? "bg-[#1E1D1B] border-[#FAD293] text-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-md"
                              : "bg-[#1C1A17] border-white/5 text-white/80 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Choose Service Location Type & Address */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <MapPin size={18} className="text-[#FAD293]" />
                <span className="text-sm font-bold text-white">Service Location & Fitting Address</span>
              </div>

              {/* Location Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setServiceLocationType("mobile_repair")}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    serviceLocationType === "mobile_repair"
                      ? "bg-[#1C1A17] border-[#FAD293] text-white shadow-md ring-1 ring-[#FAD293]/30"
                      : "bg-[#181614] border-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-[#FAD293]" />
                    <div>
                      <span className="text-sm font-bold text-white block">Mobile Doorstep Fitting</span>
                      <span className="text-[11px] text-white/50 block">At your home, office or roadside</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      serviceLocationType === "mobile_repair" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                    }`}
                  >
                    {serviceLocationType === "mobile_repair" && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceLocationType("workshop")}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    serviceLocationType === "workshop"
                      ? "bg-[#1C1A17] border-[#FAD293] text-white shadow-md ring-1 ring-[#FAD293]/30"
                      : "bg-[#181614] border-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home size={20} className="text-[#FAD293]" />
                    <div>
                      <span className="text-sm font-bold text-white block">Specialist Workshop</span>
                      <span className="text-[11px] text-white/50 block">Drive into certified fitting center</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      serviceLocationType === "workshop" ? "border-[#FAD293] bg-[#FAD293]" : "border-white/30"
                    }`}
                  >
                    {serviceLocationType === "workshop" && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              </div>

              {/* Address & Postcode Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs text-white/60 font-medium block">
                    {serviceLocationType === "mobile_repair" ? "Fitting Address / Landmark" : "Workshop Center"}
                  </label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="e.g. 10 Downing Street, Westminster, London"
                    className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs text-white/60 font-medium block">Postcode</label>
                  <input
                    type="text"
                    value={locationPostcode}
                    onChange={(e) => setLocationPostcode(e.target.value.toUpperCase())}
                    placeholder="e.g. SW1A 1AA"
                    className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none transition uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Vehicle Information & Notes */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <Car size={18} className="text-[#FAD293]" />
                <span className="text-sm font-bold text-white">Vehicle Information & Instructions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium block">Vehicle Registration</label>
                  <input
                    type="text"
                    value={vehicleRegistration}
                    onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                    placeholder="UK22-XYZ-9999"
                    className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono font-extrabold text-[#FAD293] tracking-wider focus:outline-none transition uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium block">Vehicle Model / Make</label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    placeholder="e.g. Honda Civic 2022"
                    className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-white/60 font-medium block">Special Instructions / Parking Access</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter parking access code, lock nut key location, or special instructions for the mobile technician..."
                  className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl p-4 text-xs text-white placeholder-white/30 focus:outline-none transition"
                />
              </div>

              {/* Privacy consent checkbox */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="privacy-agree-replacement"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/60 border-white/30 text-[#FAD293] focus:ring-0 cursor-pointer accent-[#FAD293]"
                />
                <label
                  htmlFor="privacy-agree-replacement"
                  className="text-xs text-white/70 leading-tight cursor-pointer select-none"
                >
                  I agree to the MMC Terms of Service and accredited technician dispatch policy.
                </label>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Order Summary & Payment Button (5 cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-5">
            {/* Selected Tyre Card */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Disc size={16} className="text-[#FAD293]" />
                  Selected Tyre
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  100% Genuine
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-24 shrink-0 bg-[#0E0D0C] rounded-2xl p-2 border border-white/5 flex items-center justify-center">
                  {renderTyreThumbnail(activeTyre)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-base font-black text-white leading-snug truncate">
                    {displayTitle}
                  </h3>
                  <p className="text-xs font-mono font-bold text-white/60">
                    {displaySize}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs pt-1">
                    <Star size={11} className="text-[#FAD293] fill-[#FAD293]" />
                    <span className="font-bold text-white text-[11px]">5.0</span>
                    <span className="text-white/40 text-[10px]">(Certified Specialist)</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="bg-[#1C1A17] rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 4].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTyreQuantity(qty)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                        tyreQuantity === qty
                          ? "bg-[#FAD293] text-black shadow-md shadow-[#FAD293]/20"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between items-center text-white/70">
                  <span>Unit Price per Tyre:</span>
                  <span className="font-semibold text-white">£{unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Tyres Subtotal ({tyreQuantity}x):</span>
                  <span className="font-semibold text-white">£{numericFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Mobile Fitting & Disposal:</span>
                  <span className="font-bold">FREE (Included)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm">
                  <span className="font-bold text-white">Total Service Price:</span>
                  <span className="text-xl font-black text-[#FAD293]">£{numericFare.toFixed(2)}</span>
                </div>
              </div>

              {/* Deposit Eligible Badge */}
              <div className="p-3 rounded-2xl bg-[#2A2015] border border-[#FAD293]/30 flex items-center justify-between text-xs">
                <span className="text-[#FAD293] font-bold">25% Deposit Option:</span>
                <span className="font-extrabold text-[#FAD293]">£{depositAmount} now</span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#FAD293]/15 cursor-pointer hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, #FAD293 0%, #E5B874 50%, #D9A35F 100%)",
                }}
              >
                <span>Confirm & Choose Payment Method</span>
                <ArrowRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 3. Payment Method Modal (25% Deposit vs Full Online) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg bg-[#141210] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-white my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Select Payment Method
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Choose how you want to pay for your tyre appointment
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

            {/* Payment Options */}
            <div className="space-y-3.5">
              {/* Option 1: Deposit (25% Advance) -> is_partial: 1 */}
              <div
                onClick={() => setIsPartialPayment(true)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isPartialPayment
                    ? "bg-[#1C1A17] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-lg"
                    : "bg-[#181614] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAD293] text-black flex items-center justify-center shrink-0">
                      <Banknote size={20} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">25% Advance Deposit</span>
                        <span className="text-[10px] font-bold text-[#FAD293] bg-[#FAD293]/15 border border-[#FAD293]/30 px-2 py-0.5 rounded-full uppercase">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        Secure technician appointment with a 25% deposit
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isPartialPayment
                        ? "bg-[#FAD293] border-[#FAD293] text-black"
                        : "border-white/30 bg-transparent"
                    }`}
                  >
                    {isPartialPayment && <Check size={14} className="stroke-[3]" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 font-semibold">Deposit Due Now (25%):</span>
                    <span className="text-sm font-bold text-[#FAD293]">£{depositAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/40 text-[11px]">
                    <span>Remaining Due on Completion (75%):</span>
                    <span>£{remainingAmount}</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Online Payment (Full) -> is_partial: 0 */}
              <div
                onClick={() => setIsPartialPayment(false)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  !isPartialPayment
                    ? "bg-[#1C1A17] border-[#FAD293] ring-1 ring-[#FAD293]/40 shadow-lg"
                    : "bg-[#181614] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#221F1B] border border-white/10 text-[#FAD293] flex items-center justify-center shrink-0">
                      <CreditCard size={20} className="stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        Full Online Payment
                      </span>
                      <p className="text-xs text-white/50 mt-0.5">
                        Pay full service amount now with Stripe
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      !isPartialPayment
                        ? "bg-[#FAD293] border-[#FAD293] text-black"
                        : "border-white/30 bg-transparent"
                    }`}
                  >
                    {!isPartialPayment && <Check size={14} className="stroke-[3]" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-white/80 font-semibold">Total Amount Due Now:</span>
                  <span className="text-sm font-bold text-[#FAD293]">£{numericFare.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Info Notice */}
            <div className="p-3.5 rounded-2xl bg-[#1D1811] border border-[#FAD293]/20 flex items-start gap-2.5">
              <Info size={16} className="text-[#FAD293] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-[#FAD293] block">
                  {isPartialPayment ? "25% Advance Booking Guarantee" : "Full Online Payment"}
                </span>
                <p className="text-white/60 leading-relaxed text-[11px]">
                  {isPartialPayment
                    ? "Pay 25% now to confirm technician dispatch. The rest is collected after satisfactory completion."
                    : "Pay 100% upfront via secure Stripe online checkout."}
                </p>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={isConfirmingPayment}
              className="w-full py-4 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #FAD293 0%, #E5B874 50%, #D9A35F 100%)",
              }}
            >
              {isConfirmingPayment ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>Connecting to Stripe Secure Checkout...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-wider">
                    {isPartialPayment
                      ? `Pay Deposit (£${depositAmount})`
                      : `Pay Full Amount (£${numericFare.toFixed(2)})`}
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
