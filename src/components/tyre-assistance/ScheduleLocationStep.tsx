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

  // Schedule
  const [scheduledDate, setScheduledDate] = useState<string>("Today");
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(
    category === "emergency" ? "Immediate (ASAP)" : "Morning (08:00 - 12:00)"
  );

  // Location
  const [locationAddress, setLocationAddress] = useState<string>(
    "Flat 4B, Baker Street, London"
  );
  const [locationPostcode, setLocationPostcode] = useState<string>("NW1 6XE");
  const [latitude, setLatitude] = useState<number>(51.5074);
  const [longitude, setLongitude] = useState<number>(-0.1278);
  const [detectedZoneId, setDetectedZoneId] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);

  // Vehicle & Tyre Specs
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>("BMW 5 Series");
  const [vehicleRegistration, setVehicleRegistration] =
    useState<string>("UK22-ABC-1234");
  const [tyreSize, setTyreSize] = useState<string>("205/56 R16");
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
          if (tyres[0].size) {
            setTyreSize(tyres[0].size);
          }
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
    if (!locationAddress.trim()) {
      setErrorMsg("Please provide your breakdown or fitting address.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const chosenTyre = dynamicTyres.find((t) => t.id === selectedTyreId);

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
        tyreSize,
        tyreQuantity,
        selectedTyreId,
        selectedTyrePrice: chosenTyre?.price,
        situation,
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

            {/* Quick Date Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {["Today", "Tomorrow", "Pick Date"].map((d) => (
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

        {/* 3. Vehicle & Dynamic Tyre Information */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#141210] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Car size={14} className="text-[#FAD293]" />
              Vehicle Details & Dynamic Backend Tyres
            </span>
            {dynamicTyres.length > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {dynamicTyres.length} Backend Tyres Loaded
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            {/* Dynamic Situation Question */}
            <div>
              <label className="text-[11px] text-white/60 block mb-1">
                Current Situation
              </label>
              <select
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAD293] transition"
              >
                <option value="Puncture" className="bg-[#181410] text-white">
                  Puncture
                </option>
                <option value="Burst Tyre" className="bg-[#181410] text-white">
                  Burst Tyre
                </option>
                <option value="New Tyre" className="bg-[#181410] text-white">
                  New Tyre Fitting
                </option>
              </select>
            </div>
          </div>

          {/* Dynamic Tyre Catalog Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="text-[11px] text-white/60 block mb-1">
                Select Tyre from Backend Catalog
              </label>
              <select
                value={selectedTyreId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedTyreId(id);
                  const found = dynamicTyres.find((t) => t.id === id);
                  if (found?.size) setTyreSize(found.size);
                }}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAD293] transition"
              >
                {dynamicTyres.length > 0 ? (
                  dynamicTyres.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#181410] text-white">
                      {t.brand} {t.model} - Size: {t.size} (Stock: {t.stock})
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-[#181410] text-white">
                    Standard 195/65 R15 Bridgestone
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-white/60 block mb-1">
                Exact Tyre Dimensions
              </label>
              <input
                type="text"
                value={tyreSize}
                onChange={(e) => setTyreSize(e.target.value)}
                placeholder="e.g. 205/55 R16 or 195/65 R15"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
              />
            </div>
          </div>

          {/* Number of Tyres */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-white/70">Number of Tyres:</span>
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden">
              {[1, 2, 4].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setTyreQuantity(qty)}
                  className={`px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    tyreQuantity === qty
                      ? "bg-[#FAD293] text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {qty} {qty === 1 ? "Tyre" : "Tyres"}
                </button>
              ))}
            </div>
          </div>
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
