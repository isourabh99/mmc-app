"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Siren,
  MapPin,
  Car,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  Compass,
  Phone,
  Clock,
  ChevronDown,
  Info,
  Search,
  Check,
  X,
  Wrench,
  Disc,
  BatteryCharging,
  Truck,
  Fuel,
  Key,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  Zap,
  Navigation,
  ArrowRight,
  ChevronRight,
  Star,
  Sparkles,
  Award,
  CreditCard,
  Building,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Images,
  Layers,
} from "lucide-react";
import {
  getEmergencyServices,
  submitEmergencyRequest,
  searchEmergencyProviders,
  bookEmergencyProvider,
  EmergencyServiceItem,
  EmergencyProviderItem,
  FALLBACK_EMERGENCY_SERVICES,
  EMERGENCY_CATEGORY_ID,
} from "@/lib/service/emergency.api";
import { getCustomerProfile } from "@/app/services/api/profile.api";
import { searchPlaces, LocationSuggestion } from "@/lib/service/location.service";
import { isAuthenticated } from "@/lib/auth.api";
import { useToast } from "@/components/ToastProvider";

export default function EmergencyAssistancePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Dynamic Emergency Services fetched from backend API:
  // GET /customer/service/category/860791e7-ed6d-46ca-992c-1348dd4c42ad
  const [services, setServices] = useState<EmergencyServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

  // Form State
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);

  const [carReg, setCarReg] = useState("");
  const [carModel, setCarModel] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [situationDescription, setSituationDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived selected services
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const selectedServiceObj = selectedServices[0] || null;
  const selectedServiceId = selectedServiceIds[0] || "";

  // Multi-select toggle handler
  const handleToggleService = (svcId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(svcId)) {
        if (prev.length === 1) {
          showToast("Please keep at least one emergency service selected.", "info");
          return prev;
        }
        return prev.filter((id) => id !== svcId);
      } else {
        return [...prev, svcId];
      }
    });
  };

  const handleSelectAllServices = () => {
    setSelectedServiceIds(services.map((s) => s.id));
    showToast(`Selected all ${services.length} emergency categories.`, "info");
  };

  const handleResetServices = () => {
    if (services.length > 0) {
      setSelectedServiceIds([services[0].id]);
    }
  };

  // Custom Emergency Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredServices = useMemo(() => {
    if (!dropdownSearch.trim()) return services;
    const q = dropdownSearch.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.short_description && s.short_description.toLowerCase().includes(q))
    );
  }, [services, dropdownSearch]);

  // Location / GPS Detection
  const [detectingGps, setDetectingGps] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat?: number; lon?: number }>({
    lat: 22.66215,
    lon: 75.9035,
  });

  // User Profile data for Existing Vehicle
  const [existingVehicles, setExistingVehicles] = useState<{ reg: string; model: string }[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Provider Search Results State
  const [providers, setProviders] = useState<EmergencyProviderItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showProvidersView, setShowProvidersView] = useState(false);
  const [selectedProviderForBooking, setSelectedProviderForBooking] = useState<EmergencyProviderItem | null>(null);
  const [selectedProviderForGallery, setSelectedProviderForGallery] = useState<EmergencyProviderItem | null>(null);

  // Booking Modal State
  const [bookingLocationType, setBookingLocationType] = useState<"customer" | "workshop">("customer");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("cash_after_service");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Submission Confirmed State
  const [submittedRequest, setSubmittedRequest] = useState<{
    reference: string;
    serviceName: string;
    location: string;
    carReg: string;
    estimatedArrival: string;
    providerName?: string;
    providerPhone?: string;
  } | null>(null);

  // 1. Fetch Dynamic Emergency Services from API
  useEffect(() => {
    let isMounted = true;
    const loadEmergencyServices = async () => {
      try {
        setLoadingServices(true);
        const data = await getEmergencyServices(EMERGENCY_CATEGORY_ID, 100, 1);
        if (isMounted && data && data.length > 0) {
          setServices(data);
          setSelectedServiceIds((prev) => (prev.length > 0 ? prev : [data[0].id]));
        } else if (isMounted) {
          setServices([]);
        }
      } catch (err) {
        console.error("Failed to load emergency services list:", err);
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    };

    loadEmergencyServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch User Profile to get saved vehicle & contact details
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated()) return;
      try {
        setLoadingProfile(true);
        const res = await getCustomerProfile();
        const data = res?.content || res?.data;
        if (data) {
          if (data.phone) setContactPhone(data.phone);
          const vehicles: { reg: string; model: string }[] = [];
          if (data.registration_number) {
            vehicles.push({
              reg: data.registration_number,
              model: `${data.car_brand || ""} ${data.car_model || ""}`.trim() || "Saved Vehicle",
            });
          }
          setExistingVehicles(vehicles);
        }
      } catch (e) {
        console.warn("Could not prefetch profile vehicle:", e);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, []);

  // 3. Location Search Autocomplete with debounce
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        const results = await searchPlaces(
          locationQuery,
          detectedCoords.lat && detectedCoords.lon
            ? { latitude: detectedCoords.lat, longitude: detectedCoords.lon }
            : undefined
        );
        setLocationSuggestions(results);
      } catch (err) {
        console.error("Location search error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locationQuery, detectedCoords]);

  // Click outside listeners for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler: "Add Existing Vehicle"
  const handleAddExistingVehicle = async () => {
    if (!isAuthenticated()) {
      showToast("Please login to select your registered vehicle.", "info");
      router.push("/login");
      return;
    }

    if (existingVehicles.length > 0) {
      const primary = existingVehicles[0];
      setCarReg(primary.reg.toUpperCase());
      if (primary.model) setCarModel(primary.model);
      showToast(`Selected saved vehicle: ${primary.reg.toUpperCase()}`, "success");
    } else {
      showToast("No saved vehicle found in your profile. Please enter your vehicle registration number.", "info");
    }
  };

  // Handler: GPS Auto-Detect Location
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setDetectedCoords({ lat: latitude, lon: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await res.json();
          const pcode =
            geoData?.display_name ||
            geoData?.address?.postcode ||
            geoData?.address?.road ||
            geoData?.address?.city ||
            `Live GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setLocationQuery(pcode);
          setShowLocationDropdown(false);
          showToast("Live current location detected successfully!", "success");
        } catch (e) {
          setLocationQuery(`Live GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          showToast("Live GPS coordinates recorded.", "success");
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        showToast("Unable to detect GPS. Please search or type your location manually.", "error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handler: Select Location Suggestion
  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setLocationQuery(suggestion.address || suggestion.name);
    setDetectedCoords({ lat: suggestion.latitude, lon: suggestion.longitude });
    setShowLocationDropdown(false);
  };

  // Helper: Get icon for emergency category
  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("windscreen") || lower.includes("glass") || lower.includes("window")) {
      return <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (lower.includes("tyre") || lower.includes("wheel") || lower.includes("puncture")) {
      return <Disc className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (lower.includes("battery") || lower.includes("jump") || lower.includes("charge")) {
      return <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (
      lower.includes("alternator") ||
      lower.includes("starter") ||
      lower.includes("fuse") ||
      lower.includes("relay")
    ) {
      return <Zap className="w-4 h-4 text-yellow-300 shrink-0" />;
    }
    if (
      lower.includes("recovery") ||
      lower.includes("tow") ||
      lower.includes("transport") ||
      lower.includes("flood")
    ) {
      return <Truck className="w-4 h-4 text-red-400 shrink-0" />;
    }
    if (lower.includes("fuel") || lower.includes("petrol") || lower.includes("diesel")) {
      return <Fuel className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (lower.includes("lock") || lower.includes("key") || lower.includes("fob")) {
      return <Key className="w-4 h-4 text-amber-300 shrink-0" />;
    }
    return <Wrench className="w-4 h-4 text-[#FAD293] shrink-0" />;
  };

  // =========================================================================
  // HANDLER: CLICK "REQUEST IMMEDIATE HELP" -> SEARCH PROVIDERS VIA API
  // POST /customer/provider/search-by-service
  // =========================================================================
  const handleRequestImmediateHelp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!locationQuery.trim()) {
      showToast("Please enter or detect your current location.", "error");
      return;
    }

    if (!carReg.trim()) {
      showToast("Please enter your vehicle registration number.", "error");
      return;
    }

    if (selectedServiceIds.length === 0) {
      showToast("Please select at least one emergency category from the dropdown.", "error");
      return;
    }

    if (!agreePrivacy) {
      showToast("Please agree to the Privacy Policy to proceed.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const foundProviders = await searchEmergencyProviders({
        serviceIds: selectedServiceIds,
        latitude: detectedCoords.lat || "22.66215",
        longitude: detectedCoords.lon || "75.9035",
      });

      setProviders(foundProviders);
      setHasSearched(true);
      setShowProvidersView(true);

      if (foundProviders.length > 0) {
        showToast(
          `Found ${foundProviders.length} certified emergency units ready for dispatch!`,
          "success"
        );
      } else {
        showToast(
          "No specific provider active in this exact grid. Central dispatch standby units ready.",
          "info"
        );
      }

      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      console.error("Emergency provider search error:", err);
      showToast("Unable to search emergency units right now. Showing dispatch standby.", "error");
      setShowProvidersView(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLER: BOOK A SPECIFIC PROVIDER
  // =========================================================================
  const handleConfirmProviderBooking = async () => {
    if (!selectedProviderForBooking) return;

    if (!isAuthenticated()) {
      showToast("Please login to confirm emergency dispatch.", "info");
      router.push("/login");
      return;
    }

    try {
      setIsBookingSubmitting(true);

      const matchedServiceNames = selectedServices.map((s) => s.name).join(", ");
      const primaryServiceName = selectedServices[0]?.name || "Emergency Roadside Assistance";

      const res = await bookEmergencyProvider({
        provider: selectedProviderForBooking,
        car_registration_number: carReg.trim().toUpperCase(),
        car_model: carModel.trim(),
        emergency_service_id: selectedServiceId,
        emergency_service_ids: selectedServiceIds,
        emergency_service_name: matchedServiceNames || primaryServiceName,
        situation_description: situationDescription.trim(),
        contact_phone: contactPhone.trim(),
        service_address: locationQuery.trim(),
        service_location: bookingLocationType,
        payment_method: bookingPaymentMethod,
        latitude: detectedCoords.lat,
        longitude: detectedCoords.lon,
      });

      setSubmittedRequest({
        reference: res.reference,
        serviceName: matchedServiceNames || primaryServiceName,
        location: locationQuery.trim(),
        carReg: carReg.trim().toUpperCase(),
        estimatedArrival:
          selectedProviderForBooking.estimated_time ||
          (selectedProviderForBooking.emergency_response_time
            ? `${selectedProviderForBooking.emergency_response_time} mins`
            : "20 - 35 Minutes"),
        providerName: selectedProviderForBooking.company_name,
        providerPhone:
          selectedProviderForBooking.company_phone ||
          selectedProviderForBooking.contact_person_phone ||
          "0800 123 4567",
      });

      setSelectedProviderForBooking(null);
      setShowProvidersView(false);
      showToast("Emergency Assistance unit dispatched successfully!", "success");
      window.scrollTo({ top: 50, behavior: "smooth" });
    } catch (err: any) {
      console.error("Booking error:", err);
      showToast(err?.message || "Failed to dispatch booking. Please try again.", "error");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Reusable Emergency Form Component (Sidebar or Main)
  const renderEmergencyForm = (isSidebarMode = false) => (
    <div
      className={`relative rounded-3xl border border-[#FAD293]/40 bg-gradient-to-b from-[#18130e] via-[#100c09] to-black shadow-2xl backdrop-blur-2xl ${
        isSidebarMode ? "p-4 sm:p-5 space-y-3.5" : "p-6 sm:p-8 md:p-9 space-y-5"
      }`}
    >
      {/* Form Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            {isSidebarMode ? (
              <button
                type="button"
                onClick={() => setShowProvidersView(false)}
                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#FAD293] hover:text-white transition group cursor-pointer pb-0.5"
              >
                <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition duration-200 text-[#FAD293]" />
                <span>Back to Overview</span>
              </button>
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FAD293]/80">
                MOTOR MARKET CONNECT
              </span>
            )}
            <h2
              className={`font-bold text-[#FAD293] tracking-wide ${
                isSidebarMode ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"
              }`}
            >
              {isSidebarMode ? "Modify Emergency Request" : "Emergency Assistance"}
            </h2>
          </div>

          <div
            className={`rounded-full bg-[#FAD293]/10 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] shadow-[0_0_15px_rgba(250,210,147,0.15)] ${
              isSidebarMode ? "w-8 h-8" : "w-10 h-10"
            }`}
          >
            <Siren className={`${isSidebarMode ? "w-4 h-4" : "w-5 h-5"} text-red-500 animate-pulse`} />
          </div>
        </div>

        {/* Quick action buttons: Add Vehicle + Use Location */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleAddExistingVehicle}
            disabled={loadingProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FAD293]/50 bg-[#FAD293]/10 hover:bg-[#FAD293]/20 text-[#FAD293] text-[11px] font-bold shadow-sm transition hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loadingProfile ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Car className="w-3 h-3 text-[#FAD293]" />
            )}
            <span>Saved Vehicle</span>
          </button>

          <button
            type="button"
            onClick={handleDetectLiveLocation}
            disabled={detectingGps}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-300 hover:text-[#FAD293] transition cursor-pointer"
          >
            {detectingGps ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#FAD293]" />
            ) : (
              <Compass className="w-3 h-3 text-[#FAD293]" />
            )}
            <span>{detectingGps ? "Detecting..." : "Live GPS"}</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleRequestImmediateHelp} className="space-y-3 pt-0.5">
        {/* Field 1: LOCATION SEARCH INPUT */}
        <div className="space-y-1 relative" ref={locationInputRef}>
          <div className="relative rounded-xl border border-zinc-700/80 bg-black/50 focus-within:border-[#FAD293] focus-within:ring-1 focus-within:ring-[#FAD293] transition flex items-center px-3.5 py-2.5 shadow-inner">
            <div className="text-[#FAD293] mr-2.5 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => {
                if (locationSuggestions.length > 0) setShowLocationDropdown(true);
              }}
              placeholder="ENTER LOCATION OR POSTCODE"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 font-semibold focus:outline-none tracking-wide"
            />

            <div className="flex items-center gap-1 ml-1.5">
              {isSearchingLocation && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              )}
              {locationQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationQuery("");
                    setLocationSuggestions([]);
                  }}
                  className="p-1 hover:text-white text-zinc-500 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showLocationDropdown && locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#14100c] border border-[#FAD293]/40 rounded-2xl p-2 shadow-2xl z-50 max-h-56 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-0.5 block">
                Matching Locations
              </span>
              {locationSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSelectLocation(suggestion)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FAD293]/15 transition flex items-start gap-2 text-xs text-white group"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FAD293] shrink-0 mt-0.5" />
                  <div className="flex-1 truncate">
                    <span className="font-bold text-white group-hover:text-[#FAD293] block truncate text-xs">
                      {suggestion.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {suggestion.address}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 2: CAR REGISTRATION NO */}
        <div className="space-y-1">
          <div className="relative rounded-xl border border-zinc-700/80 bg-black/50 focus-within:border-[#FAD293] focus-within:ring-1 focus-within:ring-[#FAD293] transition flex items-center px-3.5 py-2.5 shadow-inner">
            <div className="text-[#FAD293] mr-2.5 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={carReg}
              onChange={(e) => setCarReg(e.target.value.toUpperCase())}
              placeholder="CAR REGISTRATION (e.g. AB12 CDE)"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 uppercase font-bold focus:outline-none tracking-wider"
            />
          </div>
        </div>

        {/* Field 3: MULTI-SELECT CATEGORIES DROPDOWN */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`relative rounded-xl border cursor-pointer bg-black/50 transition flex items-center justify-between px-3.5 py-2.5 shadow-inner ${
              isDropdownOpen
                ? "border-[#FAD293] ring-1 ring-[#FAD293]"
                : "border-zinc-700/80 hover:border-zinc-500"
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-1">
              <div className="text-red-500 shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div className="truncate flex-1">
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FAD293]" />
                    <span>Loading live categories...</span>
                  </div>
                ) : selectedServices.length > 0 ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs text-white font-bold truncate">
                      {selectedServices[0].name}
                    </span>
                    {selectedServices.length > 1 && (
                      <span className="text-[9px] text-[#FAD293] font-extrabold bg-[#FAD293]/20 border border-[#FAD293]/40 px-1.5 py-0.5 rounded-full shrink-0">
                        +{selectedServices.length - 1} ({selectedServices.length})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 font-semibold">
                    Select Emergency Categories
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-400 shrink-0">
              {selectedServices.length > 0 && (
                <span className="text-[9px] font-bold text-[#FAD293] bg-[#FAD293]/10 px-1.5 py-0.5 rounded">
                  {selectedServices.length} sel
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition duration-200 ${
                  isDropdownOpen ? "rotate-180 text-[#FAD293]" : ""
                }`}
              />
            </div>
          </div>

          {/* Selected Category Dismissable Badges / Chips (Compact View) */}
          {selectedServices.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5 px-0.5">
              {selectedServices.slice(0, 2).map((svc) => (
                <span
                  key={svc.id}
                  className="inline-flex items-center gap-1 bg-[#FAD293]/15 border border-[#FAD293]/35 text-[#FAD293] text-[10px] font-medium px-2 py-0.5 rounded-lg backdrop-blur-sm transition hover:bg-[#FAD293]/25 group"
                >
                  <span className="text-[#FAD293] text-[10px]">●</span>
                  <span className="text-white font-semibold truncate max-w-[120px]">
                    {svc.name}
                  </span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleService(svc.id);
                      }}
                      className="text-zinc-400 hover:text-red-400 p-0.5 transition cursor-pointer"
                      title="Remove category"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {selectedServices.length > 2 && (
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(true)}
                  className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#FAD293] text-[10px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer"
                >
                  +{selectedServices.length - 2} more
                </button>
              )}
            </div>
          )}

          {/* Custom Popover Multi-Select Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#140f0b]/98 border border-[#FAD293]/40 rounded-2xl p-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] z-50 max-h-72 flex flex-col space-y-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              {/* Dropdown Quick Control Bar */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-[10px] font-bold text-[#FAD293] uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>{selectedServiceIds.length}/{services.length} Selected</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllServices}
                    className="text-[10px] font-bold text-[#FAD293] hover:text-white transition underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={handleResetServices}
                    className="text-[10px] font-semibold text-zinc-400 hover:text-white transition underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Search input inside dropdown */}
              <div className="relative flex items-center border border-zinc-700/80 focus-within:border-[#FAD293] bg-black/70 rounded-xl px-2.5 py-1.5 text-xs text-white transition">
                <Search className="w-3 h-3 text-zinc-400 mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                  autoFocus
                />
                {dropdownSearch && (
                  <button
                    type="button"
                    onClick={() => setDropdownSearch("")}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* List of Emergency Categories */}
              <div className="overflow-y-auto space-y-1 max-h-48 pr-1 custom-scrollbar">
                {loadingServices ? (
                  <div className="py-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FAD293]" />
                    <span>Loading...</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    No matching categories found
                  </div>
                ) : (
                  filteredServices.map((svc) => {
                    const isSelected = selectedServiceIds.includes(svc.id);
                    return (
                      <div
                        key={svc.id}
                        role="button"
                        onClick={() => handleToggleService(svc.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between gap-2 text-xs group cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#FAD293]/15 border border-[#FAD293]/50 text-white font-bold"
                            : "hover:bg-white/5 border border-transparent text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? "bg-[#FAD293] border-[#FAD293] text-black shadow-sm"
                                : "border-zinc-600 bg-black/40 group-hover:border-[#FAD293]/60"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                            )}
                          </div>

                          <div className="p-1 rounded bg-black/40 border border-white/5 shrink-0">
                            {getServiceIcon(svc.name)}
                          </div>
                          <span className="block truncate font-semibold text-xs">
                            {svc.name}
                          </span>
                        </div>

                        {svc.price ? (
                          <span className="text-[9px] font-extrabold text-[#FAD293] bg-[#FAD293]/10 px-1.5 py-0.5 rounded-full shrink-0">
                            £{svc.price}
                          </span>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Apply / Close Button */}
              <div className="pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setDropdownSearch("");
                  }}
                  className="w-full py-2 rounded-xl font-bold text-[11px] text-[#120d09] uppercase tracking-wider transition hover:brightness-110 active:scale-98 shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #FAD293 0%, #E8AF66 40%, #D49A4C 100%)",
                  }}
                >
                  Apply ({selectedServiceIds.length} Selected)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Field 4: Situation Description */}
        <div className="space-y-1">
          <div className="relative rounded-xl border border-zinc-700/80 bg-black/50 focus-within:border-[#FAD293] focus-within:ring-1 focus-within:ring-[#FAD293] transition p-2.5 shadow-inner">
            <textarea
              rows={isSidebarMode ? 2 : 3}
              value={situationDescription}
              onChange={(e) => setSituationDescription(e.target.value)}
              placeholder="Describe situation (e.g. tyre flat, key locked)..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Optional Contact Phone Input */}
        <div className="space-y-1">
          <div className="relative rounded-xl border border-zinc-800 bg-black/40 focus-within:border-[#FAD293] transition flex items-center px-3.5 py-2 text-xs text-white">
            <Phone className="w-3.5 h-3.5 text-[#FAD293] mr-2.5 shrink-0" />
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Contact Phone (optional)"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Privacy check only in main mode */}
        {!isSidebarMode && (
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="privacy-check"
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-700 bg-black text-[#FAD293] focus:ring-[#FAD293] focus:ring-offset-0 cursor-pointer accent-[#FAD293]"
            />
            <label htmlFor="privacy-check" className="text-[11px] text-zinc-400 cursor-pointer select-none">
              I agree to the{" "}
              <Link href="/faqs" className="text-[#FAD293] hover:underline font-semibold">
                Privacy Policy
              </Link>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#120d09] flex items-center justify-center gap-2 transition duration-200 hover:brightness-105 active:scale-98 disabled:opacity-50 mt-2 cursor-pointer shadow-xl shadow-red-600/20"
          style={{
            background: "linear-gradient(135deg, #FAD293 0%, #E8AF66 40%, #D49A4C 100%)",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#120d09]" />
              <span>{isSidebarMode ? "Updating Units..." : "Searching Units..."}</span>
            </>
          ) : (
            <>
              {isSidebarMode ? (
                <Search className="w-4 h-4 text-[#120d09]" />
              ) : (
                <Siren className="w-4 h-4 text-red-600" />
              )}
              <span>{isSidebarMode ? "UPDATE SEARCH" : "REQUEST IMMEDIATE HELP"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070605] text-white relative overflow-x-hidden py-8 sm:py-14">
      {/* Luxury Atmospheric Background Glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full blur-[170px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293 0%, #dc2626 40%, transparent 80%)",
        }}
      />
      <div
        className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ef4444, transparent 70%)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================================= */}
        {/* 1. SUCCESS / CONFIRMED DISPATCH SCREEN                                    */}
        {/* ========================================================================= */}
        {submittedRequest ? (
          <div className="max-w-xl mx-auto rounded-3xl border border-[#FAD293]/40 bg-gradient-to-b from-[#18130e] via-[#100c09] to-black p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                Emergency Dispatched
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Technician Is En Route!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                Your emergency request has been confirmed. The assigned mobile unit is traveling to your location.
              </p>
            </div>

            {/* Dispatch Details Card */}
            <div className="bg-black/60 border border-zinc-800 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-zinc-400">Booking Reference:</span>
                <span className="text-sm font-extrabold text-[#FAD293]">
                  #{submittedRequest.reference}
                </span>
              </div>
              {submittedRequest.providerName && (
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs text-zinc-400">Assigned Provider:</span>
                  <span className="text-xs font-bold text-white uppercase">
                    {submittedRequest.providerName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-zinc-400">Emergency Type:</span>
                <span className="text-xs font-bold text-white">
                  {submittedRequest.serviceName}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-zinc-400">Vehicle Reg:</span>
                <span className="text-xs font-bold text-yellow-400 tracking-wider">
                  {submittedRequest.carReg}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-zinc-400">Location:</span>
                <span className="text-xs font-bold text-white truncate max-w-[220px]">
                  {submittedRequest.location}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-xs text-zinc-400">Estimated Arrival:</span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {submittedRequest.estimatedArrival}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href={`tel:${submittedRequest.providerPhone || "08001234567"}`}
                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Technician / Dispatch</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setSubmittedRequest(null);
                  setShowProvidersView(false);
                  setSituationDescription("");
                }}
                className="px-6 py-3.5 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition"
              >
                New Request
              </button>
            </div>
          </div>
        ) : showProvidersView ? (
          /* ========================================================================= */
          /* 2. PROVIDERS SEARCH RESULTS: SIDEBAR EDIT FORM (LEFT) + 4 CARDS (RIGHT)   */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 animate-in fade-in zoom-in-95 duration-200">
            {/* LEFT SIDEBAR: Sticky Emergency Form with Live Modification */}
            <aside className="w-full lg:w-[380px] xl:w-[410px] shrink-0 lg:sticky lg:top-24">
              {renderEmergencyForm(true)}
            </aside>

            {/* RIGHT COLUMN: Clean Structured Control Header + Compact 2x2 Providers Grid */}
            <main className="flex-1 min-w-0 space-y-5">
              {/* Structured Luxury Control Header */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#18130e]/90 via-[#100c09]/90 to-black/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        Available Emergency Response Units
                      </h2>
                      <span className="text-[10px] font-extrabold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Live GPS
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Found <span className="text-[#FAD293] font-bold">{providers.length} certified units</span> ready for immediate roadside dispatch.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Response Grid</span>
                  </div>
                </div>

                {/* Structured Search Summary Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs flex items-center gap-1.5 text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-[#FAD293] shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{locationQuery}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs flex items-center gap-1.5 text-yellow-400 font-bold tracking-wider">
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span>{carReg}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/30 text-xs flex items-center gap-1.5 text-[#FAD293] font-semibold">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedServices.length} {selectedServices.length === 1 ? "Category" : "Categories"}</span>
                  </div>
                </div>
              </div>

              {/* Providers Grid / Cards */}
              {providers.length === 0 ? (
                <div className="text-center py-16 px-6 rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-[#16120e] via-[#100c09] to-black shadow-2xl space-y-5 max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                    <Siren className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FAD293]">
                      STANDBY DISPATCH ACTIVE
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Central Priority Fleet Ready</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed pt-1">
                      Independent mobile units are completing active road tasks. Our centralized 24/7 priority fleet is available for immediate emergency deployment.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fallbackProvider: EmergencyProviderItem = {
                          id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
                          company_name: "Motor Market Connect Emergency Fleet",
                          company_phone: "+448001234567",
                          company_address: locationQuery || "United Kingdom",
                          company_email: "dispatch@mmcclub.co.uk",
                          logo: "default.png",
                          avg_rating: 4.9,
                          rating_count: 58,
                          is_emergency_active: 1,
                          after_hours_available: 1,
                          weekend_emergency_available: 1,
                          total_selected_services_price: selectedServices.reduce((acc, s) => acc + (s.price || 3000), 0),
                        };
                        setSelectedProviderForBooking(fallbackProvider);
                      }}
                      className="px-8 py-3.5 rounded-xl font-bold text-xs text-[#120d09] tracking-wider uppercase transition hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/20"
                      style={{
                        background: "linear-gradient(135deg, #FAD293 0%, #E8AF66 40%, #D49A4C 100%)",
                      }}
                    >
                      Dispatch Central Fleet Unit
                    </button>
                  </div>
                </div>
              ) : (
                /* Compact 2x2 Grid (4 cards fit clearly on screen) */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {providers.map((provider) => {
                    const matchedServices =
                      selectedServices.length > 0
                        ? provider.selected_services?.filter((s) =>
                            selectedServiceIds.includes(s.service_id)
                          ) || []
                        : provider.selected_services || [];

                    const price =
                      provider.total_selected_services_price ??
                      (matchedServices.length > 0
                        ? matchedServices.reduce(
                            (acc, s) => acc + (s.service_price || s.min_price || 0),
                            0
                          )
                        : selectedServices.reduce((acc, s) => acc + (s.price || 3000), 0));

                    const eta =
                      provider.estimated_time ||
                      (provider.emergency_response_time
                        ? `${provider.emergency_response_time} mins`
                        : "20 - 35 mins");

                    const logoUrl =
                      provider.logo_full_path ||
                      (provider.logo && provider.logo !== "default.png"
                        ? `https://mmcclub.co.uk/storage/app/public/provider/logo/${provider.logo}`
                        : null);

                    const images =
                      provider.completed_service_images ||
                      provider.selected_services?.[0]?.completed_service_images ||
                      [];

                    return (
                      <div
                        key={provider.id}
                        className="relative rounded-2xl border border-[#FAD293]/20 hover:border-[#FAD293]/60 bg-gradient-to-b from-[#17120d] via-[#110d0a] to-black p-4 sm:p-4.5 shadow-xl transition-all duration-200 hover:shadow-[0_8px_30px_rgba(250,210,147,0.12)] flex flex-col justify-between space-y-3.5 group"
                      >
                        {/* Top Glowing Ambient Line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FAD293]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="space-y-3">
                          {/* Header: Logo, Name, Location & ETA Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-black/80 border border-zinc-700/80 flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner group-hover:border-[#FAD293]/60 transition">
                                {logoUrl ? (
                                  <Image
                                    src={logoUrl}
                                    alt={provider.company_name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Building className="w-6 h-6 text-[#FAD293]" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#FAD293] transition truncate">
                                    {provider.company_name}
                                  </h3>
                                  <span title="Verified Road-Ready"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /></span>
                                </div>

                                <p className="text-[11px] text-zinc-400 flex items-center gap-1 truncate mt-0.5">
                                  <MapPin className="w-3 h-3 text-[#FAD293] shrink-0" />
                                  <span className="truncate">{provider.company_address || "Service Area UK"}</span>
                                </p>

                                {provider.contact_person_name && (
                                  <p className="text-[10px] text-zinc-500 truncate">
                                    Lead: <span className="text-zinc-300 font-medium">{provider.contact_person_name}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Live ETA Badge */}
                            <div className="shrink-0">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold">
                                <Zap className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                                <span className="whitespace-nowrap">{eta}</span>
                              </div>
                            </div>
                          </div>

                          {/* Selected Services Match Coverage (Clean Compact Single-Row) */}
                          <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-xs">
                            {selectedServices.length === 1 ? (
                              <>
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  <span className="text-[#FAD293] text-xs">●</span>
                                  <span className="text-zinc-200 font-semibold text-xs truncate">
                                    {selectedServices[0]?.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                                  Verified
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 min-w-0 truncate">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-zinc-200 font-semibold text-xs truncate">
                                    {selectedServices.length} Requested Categories Covered
                                  </span>
                                </div>
                                <span className="text-[10px] font-extrabold text-[#FAD293] bg-[#FAD293]/15 border border-[#FAD293]/30 px-2 py-0.5 rounded shrink-0">
                                  Full Match
                                </span>
                              </>
                            )}
                          </div>

                          {/* Capabilities & Evidence row */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="flex flex-wrap gap-1">
                              {provider.is_emergency_active === 1 && (
                                <span className="text-[9px] font-bold uppercase bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Siren className="w-2.5 h-2.5" /> 24/7
                                </span>
                              )}
                              {provider.after_hours_available === 1 && (
                                <span className="text-[9px] font-bold uppercase bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
                                  🌙 After-Hours
                                </span>
                              )}
                              {provider.weekend_emergency_available === 1 && (
                                <span className="text-[9px] font-bold uppercase bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                                  🗓️ Weekend
                                </span>
                              )}
                            </div>

                            {images.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedProviderForGallery(provider)}
                                className="text-[10px] text-[#FAD293] hover:text-white flex items-center gap-1 shrink-0 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition cursor-pointer"
                              >
                                <Images className="w-3 h-3" />
                                <span>{images.length} Photos</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Footer: Price & CTA */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Service Estimate
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-[#FAD293]">£{price}</span>
                              <span className="text-[10px] text-zinc-500 font-medium">• Flat Rate</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(provider.company_phone || provider.contact_person_phone) && (
                              <a
                                href={`tel:${provider.company_phone || provider.contact_person_phone}`}
                                className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white transition hover:text-[#FAD293] shadow-sm"
                                title="Direct Driver Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedProviderForBooking(provider)}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#120d09] uppercase tracking-wider flex items-center gap-1.5 transition hover:brightness-110 active:scale-98 shadow-md shadow-amber-500/20 cursor-pointer"
                              style={{
                                background: "linear-gradient(135deg, #FAD293 0%, #E8AF66 40%, #D49A4C 100%)",
                              }}
                            >
                              <span>Book Unit</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        ) : (
          /* ========================================================================= */
          /* 3. DESKTOP SPLIT LAYOUT: LEFT INFO + RIGHT FORM (INITIAL SCREEN)          */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Emergency Response Overview & Status */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>24/7 Rapid Priority Dispatch</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  Instant Roadside <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAD293] via-amber-400 to-[#E8AF66]">
                    Emergency Response
                  </span>
                </h1>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  Fast, on-demand emergency assistance across the United Kingdom. Direct GPS dispatch routes the nearest certified technician directly to your exact spot.
                </p>
              </div>

              {/* Emergency Hotline Card */}
              <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-black to-[#18110b] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                    <PhoneCall className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                      Emergency Hotline (24/7)
                    </span>
                    <a
                      href="tel:+448001234567"
                      className="text-base sm:text-lg font-black text-white hover:text-red-400 transition"
                    >
                      0800 123 4567
                    </a>
                  </div>
                </div>

                <a
                  href="tel:+448001234567"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
                >
                  Call Now
                </a>
              </div>

              {/* Core Emergency Guarantees */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">20 - 35 Minute Average ETA</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Dynamic geo-routing finds the closest mobile unit for immediate roadside deployment.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Certified Technicians & Vans</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Onboard mobile tyre changers, battery boosters, diagnostic tools, and key recovery kits.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Nationwide UK Coverage</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Full coverage across motorways (M-roads), A-roads, town centers, driveways & car parks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active fleet live status tag */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active mobile response units on standby</span>
              </div>
            </div>

            {/* RIGHT COLUMN: THE ENHANCED EMERGENCY FORM */}
            <div className="lg:col-span-7">
              {renderEmergencyForm(false)}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. EMERGENCY BOOKING MODAL                                                */}
      {/* ========================================================================= */}
      {selectedProviderForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#FAD293]/40 bg-gradient-to-b from-[#1c1611] via-[#120e0b] to-black p-6 sm:p-8 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#FAD293] uppercase tracking-widest block">
                  Direct Dispatch Confirmation
                </span>
                <h3 className="text-xl font-bold text-white">
                  Confirm Emergency Technician
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProviderForBooking(null)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider & Service Summary Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Assigned Provider:</span>
                <span className="font-bold text-white uppercase">
                  {selectedProviderForBooking.company_name}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">Emergency Categories:</span>
                <div className="text-right flex flex-col items-end gap-1">
                  {selectedServices.map((svc) => (
                    <span key={svc.id} className="font-semibold text-[#FAD293] text-xs">
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Vehicle Registration:</span>
                <span className="font-bold text-yellow-400 tracking-wider">
                  {carReg}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Location:</span>
                <span className="font-medium text-zinc-200 truncate max-w-[200px]">
                  {locationQuery}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/10">
                <span className="text-zinc-400">Estimated Response Time:</span>
                <span className="font-bold text-emerald-400">
                  {selectedProviderForBooking.estimated_time ||
                    (selectedProviderForBooking.emergency_response_time
                      ? `${selectedProviderForBooking.emergency_response_time} mins`
                      : "20 - 35 mins")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/10">
                <span className="text-zinc-400">Total Service Estimate:</span>
                <span className="font-extrabold text-[#FAD293] text-sm">
                  £
                  {(() => {
                    if (selectedProviderForBooking.total_selected_services_price) {
                      return selectedProviderForBooking.total_selected_services_price;
                    }
                    const matched =
                      selectedProviderForBooking.selected_services?.filter((s) =>
                        selectedServiceIds.includes(s.service_id)
                      ) || [];
                    if (matched.length > 0) {
                      return matched.reduce(
                        (acc, s) => acc + (s.service_price || s.min_price || 0),
                        0
                      );
                    }
                    return selectedServices.reduce((acc, s) => acc + (s.price || 3000), 0);
                  })()}
                </span>
              </div>
            </div>

            {/* Service Location Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Dispatch Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingLocationType("customer")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    bookingLocationType === "customer"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-white"
                      : "border-zinc-800 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#FAD293]" />
                  <span>Mobile Van Dispatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingLocationType("workshop")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    bookingLocationType === "workshop"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-white"
                      : "border-zinc-800 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Building className="w-4 h-4 text-[#FAD293]" />
                  <span>Workshop / Tow Bay</span>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingPaymentMethod("cash_after_service")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    bookingPaymentMethod === "cash_after_service"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-white"
                      : "border-zinc-800 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pay on Completion</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingPaymentMethod("stripe")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    bookingPaymentMethod === "stripe"
                      ? "border-[#FAD293] bg-[#FAD293]/15 text-white"
                      : "border-zinc-800 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#FAD293]" />
                  <span>Online Card (Stripe)</span>
                </button>
              </div>
            </div>

            {/* Submit Booking Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedProviderForBooking(null)}
                className="w-1/3 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBookingSubmitting}
                onClick={handleConfirmProviderBooking}
                className="w-2/3 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#120d09] flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #FAD293 0%, #E8AF66 40%, #D49A4C 100%)",
                }}
              >
                {isBookingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#120d09]" />
                    <span>Confirming Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-4 h-4 text-red-600" />
                    <span>Confirm & Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WORK GALLERY MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedProviderForGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[#120e0b] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedProviderForGallery.company_name} - Field Work
                </h3>
                <p className="text-xs text-zinc-400">
                  Certified technician roadside equipment & completed service evidence.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProviderForGallery(null)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {(
                selectedProviderForGallery.completed_service_images ||
                selectedProviderForGallery.selected_services?.[0]?.completed_service_images ||
                []
              ).map((imgUrl, i) => (
                <div
                  key={i}
                  className="relative h-44 rounded-2xl overflow-hidden border border-zinc-800 bg-black/60"
                >
                  <Image
                    src={imgUrl}
                    alt={`Field Evidence ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}