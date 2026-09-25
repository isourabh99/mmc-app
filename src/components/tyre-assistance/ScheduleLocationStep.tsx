"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Wrench,
  Navigation,
  FileText,
  ShieldCheck,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  Building2,
  Truck,
  ArrowRight,
  Disc,
  AlertTriangle,
} from "lucide-react";
import {
  TyreCategory,
  AssistanceType,
  ServiceLocationType,
} from "@/lib/data/tyre-assistance.data";
import {
  getZoneIdFromCoordinates,
  getCustomerAddresses,
  fetchDynamicTyres,
  fetchProviderQuestions,
  CustomerAddress,
  BackendTyreItem,
  ProviderQuestion,
  TYRE_EMERGENCY_SERVICE_ID,
  TYRE_REPLACEMENT_SERVICE_ID,
  TYRE_EMERGENCY_VARIATIONS,
} from "@/lib/service/tyre-assistance.api";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface ScheduleLocationStepProps {
  category: TyreCategory;
  assistanceType: AssistanceType;
  onSubmit: (details: {
    serviceLocationType: ServiceLocationType;
    scheduledDate: string;
    scheduledTimeSlot: string;
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
  }) => Promise<void>;
  onBack: () => void;
}

export const ScheduleLocationStep: React.FC<ScheduleLocationStepProps> = ({
  category,
  assistanceType,
  onSubmit,
  onBack,
}) => {
  // Service location mode
  const [serviceLocationType, setServiceLocationType] =
    useState<ServiceLocationType>("mobile_repair");

  // Dynamic Backend State
  const [dynamicTyres, setDynamicTyres] = useState<BackendTyreItem[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<ProviderQuestion[]>([]);
  const [isLoadingBackendData, setIsLoadingBackendData] = useState<boolean>(true);

  // Emergency Variation Selection ("puncture" (£50) or "burst-tyre" (£100))
  const [selectedEmergencyVariantKey, setSelectedEmergencyVariantKey] =
    useState<string>("puncture");

  // Schedule
  const [scheduledDate, setScheduledDate] = useState<string>("Today");
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(
    category === "emergency" ? "Immediate (ASAP)" : "Morning (08:00 - 12:00)"
  );

  // Location
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [locationPostcode, setLocationPostcode] = useState<string>("");
  const [latitude, setLatitude] = useState<number>(51.5074);
  const [longitude, setLongitude] = useState<number>(-0.1278);
  const [detectedZoneId, setDetectedZoneId] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);

  // Vehicle & Tyre Specs
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>("");
  const [vehicleRegistration, setVehicleRegistration] = useState<string>("");
  const [tyreSize, setTyreSize] = useState<string>("");
  const [tyreQuantity, setTyreQuantity] = useState<number>(1);
  const [situation, setSituation] = useState<string>("Puncture");
  const [selectedTyreId, setSelectedTyreId] = useState<string>("");

  // Notes & Privacy
  const [notes, setNotes] = useState<string>("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load live data on mount
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoadingBackendData(true);
      try {
        // 1. Zone ID
        const zone = await getZoneIdFromCoordinates(latitude, longitude);
        if (mounted) setDetectedZoneId(zone);

        // 2. Dynamic Tyres from Backend
        const tyres = await fetchDynamicTyres(20, 1);
        if (mounted && tyres.length > 0) {
          setDynamicTyres(tyres);
          setSelectedTyreId(tyres[0].id);
        }

        // 3. Dynamic Questions from Backend
        const questions = await fetchProviderQuestions();
        if (mounted && questions.length > 0) {
          setDynamicQuestions(questions);
        }

        // 4. Saved addresses
        const addrs = await getCustomerAddresses();
        if (mounted && addrs.length > 0) {
          setSavedAddresses(addrs);
        }
      } catch (err) {
        console.warn("Error loading backend tyre data:", err);
      } finally {
        if (mounted) setIsLoadingBackendData(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  // GPS Location Detection with backend Zone ID sync
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        const zoneId = await getZoneIdFromCoordinates(lat, lng);
        setDetectedZoneId(zoneId);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setLocationAddress(data.display_name);
            if (data.address?.postcode) {
              setLocationPostcode(data.address.postcode);
            }
          } else {
            setLocationAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        } catch {
          setLocationAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setErrorMsg("Unable to retrieve your location. Please enter manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedPrivacy) {
      setErrorMsg("Please accept the Privacy Policy to proceed.");
      return;
    }
    if (!vehicleRegistration.trim()) {
      setErrorMsg("Please enter your vehicle registration number.");
      return;
    }
    if (!locationAddress.trim()) {
      setErrorMsg("Please provide your breakdown or fitting address.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const isEmergency = category === "emergency";
    const chosenTyre = !isEmergency ? dynamicTyres.find((t) => t.id === selectedTyreId) : undefined;
    const chosenEmergencyVar = isEmergency
      ? TYRE_EMERGENCY_VARIATIONS.find((v) => v.variant_key === selectedEmergencyVariantKey)
      : undefined;

    try {
      await onSubmit({
        serviceLocationType,
        scheduledDate,
        scheduledTimeSlot,
        locationAddress,
        locationPostcode,
        latitude,
        longitude,
        vehicleMakeModel,
        vehicleRegistration: vehicleRegistration.toUpperCase(),
        variantKey: isEmergency ? selectedEmergencyVariantKey : undefined,
        serviceId: isEmergency ? TYRE_EMERGENCY_SERVICE_ID : TYRE_REPLACEMENT_SERVICE_ID,
        tyreSize,
        tyreQuantity: isEmergency ? 1 : tyreQuantity,
        selectedTyreId: !isEmergency ? selectedTyreId : undefined,
        selectedTyrePrice: isEmergency ? chosenEmergencyVar?.price : chosenTyre?.price,
        situation: isEmergency
          ? chosenEmergencyVar?.variant || "Puncture"
          : situation,
        notes,
        acceptedPrivacy,
      });
    } catch (err) {
      setErrorMsg("Failed to find providers. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader title="Schedule & Details" onBack={onBack} />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block space-y-1.5 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Schedule, Location & Vehicle Details
            </h2>
            <p className="text-xs text-white/60">
              Provide your location and vehicle specs so our dispatch system matches the nearest certified technician.
            </p>
          </div>
          {detectedZoneId && (
            <div className="text-[11px] text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-mono">
              <MapPin size={12} />
              <span>Zone ID: {detectedZoneId.slice(0, 8)}...</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Repair Location Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Repair Location
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setServiceLocationType("mobile_repair")}
              className={`p-4 rounded-2xl sm:rounded-3xl border text-left flex items-center space-x-3.5 transition-all cursor-pointer ${
                serviceLocationType === "mobile_repair"
                  ? "bg-[#181410] border-[#FAD293] text-white shadow-[0_0_20px_rgba(250,210,147,0.12)] ring-1 ring-[#FAD293]/30"
                  : "bg-[#141210] border-white/10 text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  serviceLocationType === "mobile_repair"
                    ? "bg-[#FAD293]/15 text-[#FAD293]"
                    : "bg-white/5 text-white/40"
                }`}
              >
                <Truck size={18} />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">Mobile Repair</div>
                <div className="text-xs text-white/50">At your home, work, or roadside</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setServiceLocationType("workshop")}
              className={`p-4 rounded-2xl sm:rounded-3xl border text-left flex items-center space-x-3.5 transition-all cursor-pointer ${
                serviceLocationType === "workshop"
                  ? "bg-[#181410] border-[#FAD293] text-white shadow-[0_0_20px_rgba(250,210,147,0.12)] ring-1 ring-[#FAD293]/30"
                  : "bg-[#141210] border-white/10 text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  serviceLocationType === "workshop"
                    ? "bg-[#FAD293]/15 text-[#FAD293]"
                    : "bg-white/5 text-white/40"
                }`}
              >
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">Partner Workshop</div>
                <div className="text-xs text-white/50">At certified partner tyre garage</div>
              </div>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Form Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#141210] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#FAD293]" />
                Date & Time Slot
              </span>
              <span className="text-[10px] text-[#FAD293] font-medium bg-[#FAD293]/10 px-2.5 py-0.5 rounded-full border border-[#FAD293]/20">
                {category === "emergency" ? "Emergency Priority" : "Scheduled"}
              </span>
            </div>

            {/* Quick Date Buttons & Custom Date Picker */}
            <div className="grid grid-cols-3 gap-2">
              {["Today", "Tomorrow"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setScheduledDate(d)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition cursor-pointer ${
                    scheduledDate === d
                      ? "bg-[#FAD293] border-[#FAD293] text-black font-bold shadow-sm"
                      : "bg-black/40 border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={
                    scheduledDate !== "Today" && scheduledDate !== "Tomorrow"
                      ? scheduledDate
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) setScheduledDate(e.target.value);
                  }}
                  className={`w-full py-1.5 px-2 text-[11px] font-medium rounded-xl border text-center transition cursor-pointer ${
                    scheduledDate !== "Today" && scheduledDate !== "Tomorrow"
                      ? "bg-[#FAD293] border-[#FAD293] text-black font-bold shadow-sm"
                      : "bg-black/40 border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                />
              </div>
            </div>

            {/* Time Slot Selector */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                "Immediate (ASAP)",
                "Morning (08:00 - 12:00)",
                "Afternoon (12:00 - 16:00)",
                "Evening (16:00 - 20:00)",
              ].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setScheduledTimeSlot(slot)}
                  className={`py-2 px-2.5 text-[11px] font-medium rounded-xl border text-left truncate transition cursor-pointer ${
                    scheduledTimeSlot === slot
                      ? "bg-[#FAD293]/15 border-[#FAD293] text-[#FAD293] font-semibold"
                      : "bg-black/30 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Location Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#141210] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-[#FAD293]" />
                Location & GPS
              </span>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="text-[11px] text-[#FAD293] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    Detecting GPS...
                  </>
                ) : (
                  <>
                    <Navigation size={11} />
                    Detect Current GPS
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter street address, landmark or postcode..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
              />

              {savedAddresses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-white/40 self-center">Saved:</span>
                  {savedAddresses.slice(0, 2).map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setLocationAddress(addr.address);
                        if (addr.lat) setLatitude(Number(addr.lat));
                        if (addr.lon) setLongitude(Number(addr.lon));
                      }}
                      className="text-[10px] text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg hover:border-[#FAD293] hover:text-[#FAD293] transition"
                    >
                      {addr.address_label || addr.city || "Home"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Vehicle & Service Details */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#141210] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Car size={14} className="text-[#FAD293]" />
              Vehicle Details
            </span>
            <span className="text-[10px] text-white/40">
              UK Registration & Model
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/60 block mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={vehicleRegistration}
                onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                placeholder="UK22-ABC-1234"
                className="w-full bg-[#f6be00] text-black font-extrabold uppercase tracking-widest text-center text-xs py-2.5 px-3 rounded-xl border border-black/30 font-mono shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/60 block mb-1">
                Vehicle Model & Year
              </label>
              <input
                type="text"
                value={vehicleMakeModel}
                onChange={(e) => setVehicleMakeModel(e.target.value)}
                placeholder="e.g. Toyota Corolla / BMW 5 Series"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
              />
            </div>
          </div>

          {/* Conditional: Emergency Variation vs Replacement Live Tyres */}
          {category === "emergency" ? (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-red-400" />
                    Tyre Emergency Service (Roadside Rescue)
                  </h4>
                  <p className="text-[11px] text-white/50">
                    Select your emergency scenario. Dispatched immediately to your location.
                  </p>
                </div>
                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  ID: 1e5455a9...
                </span>
              </div>

              {/* Two Emergency Variations Cards: Puncture (£50) & Burst Tyre (£100) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {TYRE_EMERGENCY_VARIATIONS.map((v) => {
                  const isSelected = selectedEmergencyVariantKey === v.variant_key;
                  const isBurst = v.variant_key === "burst-tyre";
                  return (
                    <button
                      key={v.variant_key}
                      type="button"
                      onClick={() => {
                        setSelectedEmergencyVariantKey(v.variant_key);
                        setSituation(v.variant);
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden min-h-[110px] ${
                        isSelected
                          ? "bg-[#1f1412] border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500/50"
                          : "bg-black/40 border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-red-500/20 text-red-400"
                              : "bg-white/5 text-white/40"
                          }`}
                        >
                          {isBurst ? <AlertTriangle size={18} /> : <Disc size={18} />}
                        </div>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                            isSelected
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-white/10 text-white/80"
                          }`}
                        >
                          £{v.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-2 space-y-0.5">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{v.variant}</span>
                          {isSelected && (
                            <CheckCircle2 size={14} className="text-red-400 fill-red-400/20" />
                          )}
                        </div>
                        <p className="text-[10px] text-white/50 leading-snug">
                          {v.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Tyre Size for emergency info */}
              <div className="pt-2">
                <label className="text-[11px] text-white/60 block mb-1">
                  Tyre Size on Vehicle <span className="text-white/30">(Optional / if known)</span>
                </label>
                <input
                  type="text"
                  value={tyreSize}
                  onChange={(e) => setTyreSize(e.target.value)}
                  placeholder="e.g. 205/55 R16"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                />
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Disc size={13} className="text-[#FAD293]" />
                    Tyre Replacement Service (Live Catalog)
                  </h4>
                  <p className="text-[11px] text-white/50">
                    Select tyre from verified inventory. Fitting and wheel balancing included.
                  </p>
                </div>
                <span className="text-[10px] text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-2.5 py-0.5 rounded-full font-mono">
                  ID: 9913c6e3...
                </span>
              </div>

              {/* Live Tyres Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {dynamicTyres.map((t) => {
                  const isSelected = selectedTyreId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTyreId(t.id);
                        if (t.size) setTyreSize(t.size);
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-[#181410] border-[#FAD293] text-white shadow-[0_0_20px_rgba(250,210,147,0.15)] ring-1 ring-[#FAD293]/40"
                          : "bg-black/40 border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 px-2 py-0.5 rounded-md">
                            {t.brand}
                          </span>
                          <h5 className="text-xs font-bold text-white pt-1">{t.model}</h5>
                        </div>
                        <span className="text-xs font-extrabold text-[#FAD293] bg-black/60 px-2 py-0.5 rounded-lg border border-white/5">
                          £{t.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-2 text-[11px] text-white/60 space-y-0.5">
                        <div>
                          Size: <span className="font-semibold text-white">{t.size}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                          <span>Stock: {t.stock} in stock</span>
                          <span className="text-emerald-400 font-medium">Certified New</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Exact Tyre Dimensions & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">
                    Tyre Dimension Specification
                  </label>
                  <input
                    type="text"
                    value={tyreSize}
                    onChange={(e) => setTyreSize(e.target.value)}
                    placeholder="e.g. 205/55 R16"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-white/60 block mb-1">
                    Number of Tyres to Fit
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setTyreQuantity(qty)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl transition cursor-pointer border text-center ${
                          tyreQuantity === qty
                            ? "bg-[#FAD293] text-black border-[#FAD293] shadow-sm font-bold"
                            : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {qty} {qty === 1 ? "Tyre" : "Tyres"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Notes & Privacy */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1.5">
              Special Instructions for Technician <span className="text-white/30 normal-case">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mobile tyre fitting required at home address..."
              className="w-full bg-[#141210] border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
            />
          </div>

          <div className="flex items-start space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="privacy-policy"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-0.5 rounded bg-black/60 border-white/20 text-[#FAD293] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#FAD293]"
            />
            <label
              htmlFor="privacy-policy"
              className="text-xs text-white/65 leading-relaxed cursor-pointer select-none"
            >
              I accept the{" "}
              <span className="text-[#FAD293] underline hover:text-[#FFF0D4]">
                Privacy Policy
              </span>{" "}
              and agree to roadside tyre assistance terms and conditions.
            </label>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Action Button Container */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="hidden lg:inline-flex px-6 py-3 rounded-2xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:w-auto lg:min-w-[280px] py-4 px-8 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching Nearest Providers...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Find Nearest Provider & Quote</span>
                <ArrowRight size={16} className="stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
