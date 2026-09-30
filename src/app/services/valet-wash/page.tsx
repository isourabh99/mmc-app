"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Bell,
  Car,
  Pencil,
  Eye,
  Star,
  Compass,
  Clock,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Building,
  Phone,
  Mail,
  ArrowRight,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Award,
  Zap,
  ChevronRight,
  RotateCcw,
  Banknote,
  Info,
} from "lucide-react";
import {
  searchProvidersByService,
  ValetProvider,
  getWashTypes,
  WashTypeItem,
  addValetToCart,
  sendValetBookingRequest,
} from "@/lib/service/valet.api";
import { saveBookingMeta } from "@/lib/service/bookings.api";
import { LocationSearchInput } from "@/components/chauffeur/LocationSearchInput";
import { useToast } from "@/components/ToastProvider";

export default function VehicleWashValetPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Search & Filter Form State (Sidebar)
  const [selectedServiceId, setSelectedServiceId] = useState("16c0655b-38ca-412f-94d1-1db5463cf70c");
  const [currentServiceName, setCurrentServiceName] = useState("Full Exterior Valet");
  const [locationAddress, setLocationAddress] = useState("55 Fordington House, London");
  const [registrationNo, setRegistrationNo] = useState("AB24 MMC");
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"all" | "Mobile" | "Station">("all");
  const [sortBy, setSortBy] = useState<"best" | "price_low" | "price_high" | "distance" | "rating">("best");

  // Data State
  const [washTypes, setWashTypes] = useState<WashTypeItem[]>([]);
  const [providers, setProviders] = useState<ValetProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [selectedProviderForBooking, setSelectedProviderForBooking] =
    useState<ValetProvider | null>(null);
  const [selectedProviderForGallery, setSelectedProviderForGallery] =
    useState<ValetProvider | null>(null);

  // Selected Variation State
  const [selectedVariationKey, setSelectedVariationKey] = useState<string>("");

  // Booking Modal State
  const todayStr = new Date().toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTime, setBookingTime] = useState("11:00");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("cash_after_service");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState("");
  const [bookingLocationType, setBookingLocationType] = useState<"customer" | "provider">("customer");
  const [bookingVehicleModel, setBookingVehicleModel] = useState<string>("Audi A4");
  const [bookingVehicleColor, setBookingVehicleColor] = useState<string>("Black");
  const [bookingSpecialConditions, setBookingSpecialConditions] = useState<string>("");
  const [bookingAdditionalNotes, setBookingAdditionalNotes] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("11:00 AM - 01:00 PM");

  // Active Service and Variation Memos
  const activeServiceItem = useMemo(() => {
    return washTypes.find((w) => w.id === selectedServiceId) || washTypes[0];
  }, [washTypes, selectedServiceId]);

  const availableVariations = useMemo(() => {
    // 1. If a provider is selected for booking, use that provider's custom variation prices
    if (
      selectedProviderForBooking?.selected_services &&
      selectedProviderForBooking.selected_services.length > 0
    ) {
      const matchedService =
        selectedProviderForBooking.selected_services.find(
          (s) => s.service_id === selectedServiceId
        ) || selectedProviderForBooking.selected_services[0];

      if (matchedService?.variations && matchedService.variations.length > 0) {
        return matchedService.variations.map((v) => ({
          variant: v.variant || v.variant_key,
          variant_key: v.variant_key,
          price: Number(v.price) || Number(v.admin_price) || 0,
          admin_price: Number(v.admin_price) || 0,
          is_custom: v.is_custom,
        }));
      }
    }

    // 2. Fallback to category API variations
    return activeServiceItem?.variations || [];
  }, [selectedProviderForBooking, selectedServiceId, activeServiceItem]);

  const activeVariation = useMemo(() => {
    if (!availableVariations.length) return null;
    return (
      availableVariations.find((v) => v.variant_key === selectedVariationKey) ||
      availableVariations[0]
    );
  }, [availableVariations, selectedVariationKey]);

  const dynamicBookingPrice = useMemo(() => {
    if (activeVariation && typeof activeVariation.price === "number" && activeVariation.price > 0) {
      return activeVariation.price;
    }
    if (
      selectedProviderForBooking?.total_selected_services_price &&
      selectedProviderForBooking.total_selected_services_price > 0
    ) {
      return selectedProviderForBooking.total_selected_services_price;
    }
    if (activeServiceItem && activeServiceItem.price > 0) {
      return activeServiceItem.price;
    }
    return 0;
  }, [activeVariation, selectedProviderForBooking, activeServiceItem]);

  // Payment Modal State (Matches Bodywork / Chauffeur / Mechanical / Car Hire)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(true);

  const numericPrice = dynamicBookingPrice > 0 ? dynamicBookingPrice : 45;
  const depositAmount = (numericPrice * 0.25).toFixed(2);
  const remainingAmount = (numericPrice * 0.75).toFixed(2);
  const totalAmountFormatted = numericPrice.toFixed(2);

  const handleOpenBookingModal = (provider: ValetProvider) => {
    setSelectedProviderForBooking(provider);
    setIsBookingSuccess(false);

    // Prioritize provider's specific variation key
    const provService =
      provider.selected_services?.find(
        (s) => s.service_id === selectedServiceId
      ) || provider.selected_services?.[0];

    if (provService?.variations && provService.variations.length > 0) {
      setSelectedVariationKey(provService.variations[0].variant_key);
    } else {
      const currentService =
        washTypes.find((w) => w.id === selectedServiceId) || washTypes[0];
      if (currentService?.variations && currentService.variations.length > 0) {
        setSelectedVariationKey(currentService.variations[0].variant_key);
      } else {
        setSelectedVariationKey("basic");
      }
    }
  };

  // 1. Initial Load: Fetch Wash Types and Providers from API
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const types = await getWashTypes(10, 1);

        if (types && types.length > 0) {
          setWashTypes(types);
          const found = types.find((t) => t.id === selectedServiceId) || types[0];
          setSelectedServiceId(found.id);
          setCurrentServiceName(found.name);

          const providerList = await searchProvidersByService(found.id, 10, 1);
          setProviders(providerList || []);
        } else {
          setWashTypes([]);
          setProviders([]);
        }
      } catch (err) {
        console.error("Error during valet page initialization:", err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Handle Service Package Dropdown Selection
  const handleServiceSelect = async (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const chosen = washTypes.find((w) => w.id === serviceId);
    if (chosen) {
      setCurrentServiceName(chosen.name);
    }
    try {
      setIsSearching(true);
      const freshProviders = await searchProvidersByService(serviceId, 10, 1);
      setProviders(freshProviders || []);
    } catch (err) {
      console.error("Failed to load providers for service:", err);
      setProviders([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Search Form Submit
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!locationAddress.trim()) {
      showToast("Please enter a service location.", "error");
      return;
    }

    if (!registrationNo.trim()) {
      showToast("Please enter your vehicle registration.", "error");
      return;
    }

    try {
      setIsSearching(true);
      const chosenService = washTypes.find((w) => w.id === selectedServiceId);
      if (chosenService) {
        setCurrentServiceName(chosenService.name);
      }

      showToast("Fetching available valet specialists...", "info");

      // Fetch fresh providers from API
      const freshProviders = await searchProvidersByService(selectedServiceId, 10, 1);
      setProviders(freshProviders || []);

      if (freshProviders && freshProviders.length > 0) {
        showToast(`Found ${freshProviders.length} specialist(s).`, "success");
      } else {
        showToast("No specialists found for this service.", "info");
      }
    } catch (err) {
      console.error("Failed to update providers:", err);
      setProviders([]);
      showToast("Could not load specialists. Please try again.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    const firstType = washTypes[0];
    if (firstType) {
      setSelectedServiceId(firstType.id);
      setCurrentServiceName(firstType.name);
    }
    setLocationAddress("55 Fordington House, London");
    setRegistrationNo("AB24 MMC");
    setSearchRadius(5);
    setServiceTypeFilter("all");
    setSortBy("best");
    showToast("Filters reset to default.", "info");
  };

  // Filter & Sort Providers
  const filteredAndSortedProviders = useMemo(() => {
    let list = [...providers];

    // Filter by Service Type
    if (serviceTypeFilter !== "all") {
      list = list.filter((p) => {
        const type = p.service_type || "Mobile";
        return type.toLowerCase().includes(serviceTypeFilter.toLowerCase());
      });
    }

    // Filter by distance radius
    list = list.filter((p) => {
      const dist = Number(p.distance_miles) || 1.2;
      return dist <= searchRadius;
    });

    // Sort
    if (sortBy === "price_low") {
      list.sort(
        (a, b) =>
          (a.total_selected_services_price || 0) -
          (b.total_selected_services_price || 0)
      );
    } else if (sortBy === "price_high") {
      list.sort(
        (a, b) =>
          (b.total_selected_services_price || 0) -
          (a.total_selected_services_price || 0)
      );
    } else if (sortBy === "distance") {
      list.sort(
        (a, b) => (Number(a.distance_miles) || 1.2) - (Number(b.distance_miles) || 1.2)
      );
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }

    return list;
  }, [providers, serviceTypeFilter, searchRadius, sortBy]);

  // Opens Select Payment Method Modal
  const handleOpenPaymentModal = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedProviderForBooking) return;
    setShowPaymentModal(true);
  };

  const handleConfirmBooking = (e?: React.FormEvent | React.MouseEvent) => {
    handleOpenPaymentModal(e);
  };

  // Final Booking Dispatch to API with Stripe Payment
  const executeValetBooking = async () => {
    if (!selectedProviderForBooking) return;

    try {
      setIsBookingSubmitting(true);

      const chosenVarKey =
        activeVariation?.variant_key ||
        selectedVariationKey ||
        availableVariations[0]?.variant_key ||
        "basic";

      const chosenVarName = activeVariation?.variant || chosenVarKey;

      const scheduleTime =
        bookingTime.includes(":") && bookingTime.split(":").length === 2
          ? `${bookingTime}:00`
          : bookingTime;
      const formattedSchedule = `${bookingDate} ${scheduleTime}`;

      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/booking-success";

      const bookingRes = await sendValetBookingRequest({
        service_id: selectedServiceId,
        provider_id: selectedProviderForBooking.id,
        variant_key: chosenVarKey,
        payment_method: "stripe",
        is_partial: isPartialPayment ? 1 : 0,
        payment_platform: "app",
        callback: callbackUrl,
        service_schedule: formattedSchedule,
        service_address_id: "2",
        service_location: bookingLocationType,
        service_address: locationAddress,
        selected_slot_id: "00dc5d50-fa91-4c49-b74a-1326fc8a1fdf",
        car_registration_number: registrationNo || "AB24 MMC",
        car_model: bookingVehicleModel.trim() || "Audi A4",
        car_color: bookingVehicleColor.trim() || "Black",
        special_conditions: bookingSpecialConditions.trim()
          ? `[Valet: ${currentServiceName} (${chosenVarName})] ${bookingSpecialConditions.trim()}`
          : `[Valet: ${currentServiceName} (${chosenVarName})] Doorstep vehicle valet service`,
        notes: `[Valet: ${currentServiceName} (${chosenVarName})] ${bookingAdditionalNotes.trim() || `Location: ${locationAddress}. Slot: ${selectedSlot}`}`,
      });

      let redirectLink =
        (bookingRes as any)?.content?.url ||
        (bookingRes as any)?.content?.redirect_link ||
        (bookingRes as any)?.content?.redirect_url ||
        (bookingRes as any)?.content?.payment_url ||
        (bookingRes as any)?.url ||
        (bookingRes as any)?.redirect_link ||
        (bookingRes as any)?.redirect_url;

      const ref =
        bookingRes?.content?.readable_id ||
        bookingRes?.content?.id ||
        bookingRes?.booking_reference ||
        bookingRes?.content?.booking_id;

      const confirmedId = String(ref || `MMC-VAL-${Date.now().toString().slice(-6)}`);
      setConfirmedBookingRef(confirmedId);

      const isUuidStr = (val: any): boolean =>
        typeof val === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

      const content = bookingRes?.content;
      const possibleUuid =
        (content && isUuidStr(content.payment_id) ? content.payment_id : null) ||
        (content && isUuidStr(content.id) ? content.id : null) ||
        (content && Array.isArray(content.booking_id) && isUuidStr(content.booking_id[0]) ? content.booking_id[0] : null) ||
        (content && isUuidStr(content.booking_id) ? content.booking_id : null) ||
        (isUuidStr(confirmedId) ? confirmedId : null);

      if (!redirectLink && possibleUuid) {
        redirectLink = `https://mmcclub.co.uk/payment/stripe/pay?payment_id=${encodeURIComponent(
          String(possibleUuid)
        )}`;
      }

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: confirmedId,
            readable_id: confirmedId,
            provider: selectedProviderForBooking,
            schedule: formattedSchedule,
            price: numericPrice,
            is_partial: isPartialPayment ? 1 : 0,
            deposit_amount: depositAmount,
            service_name: `Valet: ${currentServiceName} (${chosenVarName})`,
          })
        );
      } catch { }

      saveBookingMeta(confirmedId, {
        serviceTitle: `${currentServiceName} (${chosenVarName})`,
        serviceCategoryName: "Valet & Detailing",
        serviceType: "valet",
        variant: chosenVarName,
        vehicleModel: bookingVehicleModel.trim() || "Audi A4",
        vehicleReg: registrationNo || "AB24 MMC",
        providerName: selectedProviderForBooking.company_name,
        price: numericPrice,
      });

      // ONLY redirect if we have a valid URL and it does NOT use MMC-VAL-...
      if (
        redirectLink &&
        typeof redirectLink === "string" &&
        redirectLink.startsWith("http") &&
        !redirectLink.includes("payment_id=MMC-")
      ) {
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = redirectLink;
        return;
      }

      setShowPaymentModal(false);
      setIsBookingSuccess(true);
      showToast("Valet Booking Confirmed Successfully!", "success");

      // Trigger native notification pop-up on user device
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("MMC Valet Wash Confirmed! 🧼", {
            body: `Booking Ref #${confirmedId} for ${currentServiceName} has been confirmed!`,
            icon: "/mmc-logo.png",
            badge: "/mmc-logo.png",
          });
        } catch (notifErr) {
          console.warn("Valet notification error:", notifErr);
        }
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to confirm booking. Please try again.", "error");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white pb-24 relative overflow-x-hidden">
      {/* Background Ambient Gold Glows */}
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] lg:w-[1200px] h-[500px] rounded-full blur-[160px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B, transparent)",
        }}
      />
      <div
        className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #CEA46B, transparent)",
        }}
      />

      {/* 1. Desktop Breadcrumb & Hero Header Section */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent pt-6 pb-8 relative z-20">
        <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-[#FAD293] hover:border-[#FAD293]/40 transition"
              >
                <ChevronLeft size={14} />
                <span>All Services</span>
              </Link>
              <span>/</span>
              <Link href="/services" className="hover:text-white transition">Services</Link>
              <span>/</span>
              <span className="text-[#FAD293] font-semibold">Car Wash & Valet</span>
            </div>

            {/* Live Service Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Doorstep Mobile Units Active</span>
            </div>
          </div>

          {/* Main Title & Value Proposition */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FAD293]/30 bg-[#FAD293]/10 text-[#FAD293] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Professional Vehicle Care & Detailing</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Vehicle Wash & <span className="bg-gradient-to-r from-[#FAD293] to-[#CEA46B] bg-clip-text text-transparent">Mobile Valet Specialists</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
                Compare verified local mobile valet providers, customize your vehicle wash package, and book guaranteed doorstep cleaning at your preferred date and time.
              </p>
            </div>

            {/* Trust Highlights Badges */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAD293]/15 text-[#FAD293] flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">100% Certified</div>
                  <div className="text-[10px] text-white/50">Vetted Specialists</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAD293]/15 text-[#FAD293] flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Self-Powered</div>
                  <div className="text-[10px] text-white/50">Mobile Water & Power</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Valet Banner Image ─── */}
      <div className="relative w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 z-10">
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#FAD293]/20 group">
          <Image
            src="/valet.png"
            alt="MMC Premium Valet & Detailing Services"
            width={1920}
            height={700}
            className="w-full h-auto object-cover"
            priority
          />
          {/* Subtle bottom gradient overlay so content below feels connected */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/60 via-transparent to-transparent pointer-events-none" />
          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          {/* Live badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-[#FAD293]/30 text-[11px] font-bold text-[#FAD293]">
            <span className="w-2 h-2 rounded-full bg-[#FAD293] animate-pulse" />
            Now Booking
          </div>
        </div>
      </div>

      {/* 2. Main Desktop Layout (Sidebar + Results Grid) */}
      <main className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ========================================================= */}
          {/* LEFT COLUMN: Interactive Edit & Filter Sidebar (4 cols)   */}
          {/* ========================================================= */}
          <aside id="sidebar-valet-form" className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            {/* Sidebar Edit Card */}
            <div className="rounded-3xl border border-[#FAD293]/30 bg-[#120e0b]/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Select Your Valet</h2>
                    <p className="text-[11px] text-white/50">Edit details & get instant quote</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] text-white/50 hover:text-[#FAD293] transition"
                  title="Reset to default"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* 1. Location Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#FAD293]" />
                    <span>Service Location</span>
                  </label>
                  <LocationSearchInput
                    label="Service Location"
                    placeholder="Enter city, postcode or address..."
                    value={locationAddress}
                    onChange={(addr) => setLocationAddress(addr)}
                  />
                </div>

                {/* 2. Car Registration */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Car size={12} className="text-[#FAD293]" />
                    <span>Car Registration No</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value.toUpperCase())}
                      placeholder="e.g. AB24 MMC"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-wider text-white uppercase focus:outline-none focus:border-[#FAD293] transition pl-12"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-black text-white">
                      GB
                    </div>
                  </div>
                </div>

                {/* 3. Wash Service Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#FAD293]" />
                    <span>Valet Service Package</span>
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293] transition"
                  >
                    {washTypes.length === 0 ? (
                      <option value="" disabled className="bg-neutral-900 text-white/50">
                        {loading ? "Loading packages..." : "No packages found"}
                      </option>
                    ) : (
                      washTypes.map((w) => (
                        <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                          {w.name} {w.price > 0 ? `(From £${w.price})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 4. Distance Radius Filter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Compass size={12} className="text-[#FAD293]" />
                      <span>Search Radius</span>
                    </span>
                    <span className="text-[#FAD293] font-bold font-mono">
                      Within {searchRadius} Miles
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[5, 10, 20, 50].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => setSearchRadius(rad)}
                        className={`py-1.5 rounded-xl text-xs font-semibold border transition ${searchRadius === rad
                          ? "bg-[#FAD293] text-black border-[#FAD293] shadow-md"
                          : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                          }`}
                      >
                        {rad} mi
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Service Type Filter (Mobile / Station) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Smartphone size={12} className="text-[#FAD293]" />
                    <span>Service Type</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "All Types" },
                      { id: "Mobile", label: "Mobile Valet" },
                      { id: "Station", label: "Station/Garage" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setServiceTypeFilter(st.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center truncate transition ${serviceTypeFilter === st.id
                          ? "bg-[#FAD293]/20 text-[#FAD293] border-[#FAD293]"
                          : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                          }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Get Instant Quote / Update Button */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-3.5 rounded-2xl font-extrabold text-black text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 shadow-xl shadow-[#FAD293]/15 mt-4 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-black" />
                      <span>Finding Specialists...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-black" />
                      <span>Get Instant Quote</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar Trust & Guarantee Card */}
            <div className="rounded-3xl border border-white/10 bg-[#120e0b]/70 p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-[#FAD293] font-bold">
                <ShieldCheck size={16} />
                <span>The MMC Valet Guarantee</span>
              </div>
              <ul className="space-y-2 text-white/70 text-[11px]">
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#FAD293] shrink-0 mt-0.5" />
                  <span>Vetted & certified vehicle detailing professionals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#FAD293] shrink-0 mt-0.5" />
                  <span>100% self-contained mobile water & power units</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#FAD293] shrink-0 mt-0.5" />
                  <span>Pay securely online or in cash upon completion</span>
                </li>
              </ul>
            </div>


          </aside>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Results Header & Vendor Cards Grid (8 cols) */}
          {/* ========================================================= */}
          <section className="lg:col-span-8 space-y-6">

            {/* Top Results Banner & Stats */}
            <div className="rounded-3xl border border-[#FAD293]/20 bg-[#120e0b]/80 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Available
                    </span>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs text-white/60">
                      Instant Booking Confirmed
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    {filteredAndSortedProviders.length} vendors found within {searchRadius} miles radius
                  </h2>

                  <p className="text-xs text-white/60 flex items-center gap-1.5 mt-1">
                    <MapPin size={13} className="text-[#FAD293] shrink-0" />
                    <span className="truncate max-w-sm sm:max-w-md">
                      Service location: {locationAddress}
                    </span>
                    <span className="text-white/30">|</span>
                    <span className="text-[#FAD293] font-mono font-bold">{registrationNo}</span>
                  </p>
                </div>

                {/* Sort Filter Selector */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-white/50 text-xs hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293] transition"
                  >
                    <option value="best" className="bg-neutral-900">Best Match</option>
                    <option value="price_low" className="bg-neutral-900">Price: Low to High</option>
                    <option value="price_high" className="bg-neutral-900">Price: High to Low</option>
                    <option value="distance" className="bg-neutral-900">Nearest First</option>
                    <option value="rating" className="bg-neutral-900">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/8 text-[11px]">
                <span className="text-white/40">Active Filters:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 flex items-center gap-1">
                  <span>Service: {currentServiceName}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 flex items-center gap-1">
                  <span>Radius: ≤ {searchRadius} mi</span>
                </span>
                {serviceTypeFilter !== "all" && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#FAD293] flex items-center gap-1">
                    <span>Type: {serviceTypeFilter}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Provider Cards List */}
            {loading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#120e0b] animate-pulse space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-3 sm:h-4 w-20 sm:w-36 bg-white/10 rounded" />
                        <div className="h-2.5 sm:h-3 w-12 sm:w-20 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2 py-2 sm:py-3 border-y border-white/5">
                      <div className="h-2.5 sm:h-3 w-full bg-white/5 rounded" />
                      <div className="h-2.5 sm:h-3 w-3/4 bg-white/5 rounded" />
                    </div>
                    <div className="h-8 sm:h-10 bg-white/10 rounded-xl sm:rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedProviders.length === 0 ? (
              /* Empty State */
              <div className="rounded-3xl border border-white/10 bg-[#120e0b] p-8 sm:p-10 text-center space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mx-auto">
                  <Filter size={24} className="sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white">No specialists found in this radius</h3>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Try expanding your search radius to 20 or 50 miles in the left sidebar to discover more detailing specialists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchRadius(50)}
                  className="px-5 py-2.5 rounded-xl bg-[#FAD293] text-black font-bold text-xs hover:brightness-110 transition shadow-lg"
                >
                  Expand Radius to 50 Miles
                </button>
              </div>
            ) : (
              /* Providers Grid (2 columns on mobile and desktop) */
              <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch">
                {filteredAndSortedProviders.map((provider, index) => {
                  const isBestValue = index === 0;
                  const price = provider.total_selected_services_price ?? 0;
                  const distance = provider.distance_miles || (1.2 + index * 0.6).toFixed(1);
                  const timeEstimate = provider.estimated_time || "1 hours";
                  const serviceType = provider.service_type || "Mobile";

                  return (
                    <div
                      key={provider.id}
                      className="relative rounded-2xl sm:rounded-3xl border border-[#FAD293]/35 bg-[#120e0b] p-3 sm:p-5 lg:p-6 shadow-2xl transition-all duration-300 hover:border-[#FAD293]/70 hover:shadow-[#FAD293]/10 hover:-translate-y-1 flex flex-col justify-between space-y-3 sm:space-y-4"
                    >
                      {/* Top Right "Best value" Badge */}
                      {isBestValue && (
                        <div className="absolute -top-2.5 sm:-top-3 right-2 sm:right-6">
                          <span
                            className="px-2 sm:px-3.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #FAD293, #CEA46B)",
                            }}
                          >
                            Best value
                          </span>
                        </div>
                      )}

                      <div className="space-y-2.5 sm:space-y-4">
                        {/* Provider Header: Logo + Name + My work link + Rating */}
                        <div className="flex items-start justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                            <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-white shrink-0 flex items-center justify-center p-0.5 sm:p-1 shadow-md">
                              <img
                                src={
                                  provider.logo_full_path ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                                }
                                alt={provider.company_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                                <h3 className="text-xs sm:text-base font-bold text-white truncate max-w-full" title={provider.company_name}>
                                  {provider.company_name}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProviderForGallery(provider)}
                                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-semibold text-[#FAD293] hover:underline shrink-0"
                                >
                                  <span className="hidden xs:inline">My work</span>
                                  <Eye size={11} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/50 mt-0.5">
                                <Star size={10} className="sm:w-3 sm:h-3 fill-[#FAD293] text-[#FAD293] shrink-0" />
                                <span className="font-bold text-white">
                                  {provider.avg_rating || 0}
                                </span>
                                <span className="truncate">({provider.rating_count || 0})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Details Matrix: Service radius | Estimated time | Service type */}
                        <div className="space-y-1.5 sm:space-y-2.5 py-2 sm:py-3 border-y border-white/8 text-[11px] sm:text-sm">
                          {/* Service radius */}
                          <div className="flex items-center justify-between text-white/80 gap-1">
                            <span className="text-white/60 text-[10px] sm:text-xs">Radius</span>
                            <div className="flex items-center gap-1 text-[#FAD293] font-semibold font-mono text-[10px] sm:text-xs">
                              <Compass size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span>{distance} mi</span>
                            </div>
                          </div>

                          {/* Estimated time */}
                          <div className="flex items-center justify-between text-white/80 gap-1">
                            <span className="text-white/60 text-[10px] sm:text-xs">Est. Time</span>
                            <div className="flex items-center gap-1 text-[#FAD293] font-semibold font-mono text-[10px] sm:text-xs">
                              <Clock size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span>{timeEstimate}</span>
                            </div>
                          </div>

                          {/* Service type */}
                          <div className="flex items-center justify-between text-white/80 gap-1">
                            <span className="text-white/60 text-[10px] sm:text-xs">Type</span>
                            <div className="flex items-center gap-1 text-[#FAD293] font-semibold text-[10px] sm:text-xs">
                              <Smartphone size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span>{serviceType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Price + Book Now Button */}
                      <div className="flex items-center justify-between pt-1.5 sm:pt-2 gap-2 sm:gap-4">
                        <div className="text-left">
                          <span className="text-base sm:text-3xl font-black text-white">
                            £{price}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBookingModal(provider)}
                          className="flex-1 max-w-[90px] sm:max-w-[170px] py-1.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-extrabold text-black text-[11px] sm:text-sm shadow-xl shadow-[#FAD293]/10 hover:brightness-110 active:scale-98 transition text-center flex items-center justify-center gap-1"
                          style={{
                            background:
                              "linear-gradient(135deg, #FAD293, #CEA46B)",
                          }}
                        >
                          <span>Book</span>
                          <span className="hidden sm:inline">Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. Booking Schedule Modal Popup                           */}
      {/* ========================================================= */}
      {selectedProviderForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#FAD293]/40 bg-[#120e0b] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedProviderForBooking(null);
                setIsBookingSuccess(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
            >
              <X size={15} />
            </button>

            {isBookingSuccess ? (
              /* Success Confirmation */
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#FAD293] px-3 py-1 rounded-full bg-[#FAD293]/15 border border-[#FAD293]/30">
                    Booking Confirmed
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    Valet Service Scheduled!
                  </h3>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    <strong className="text-white">{selectedProviderForBooking.company_name}</strong> will arrive at your destination with mobile equipment.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-white/50">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#FAD293]">
                      {confirmedBookingRef}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Service:</span>
                    <span className="text-white font-medium">{currentServiceName}</span>
                  </div>
                  {activeVariation && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Package Variation:</span>
                      <span className="text-[#FAD293] font-semibold capitalize">
                        {activeVariation.variant || activeVariation.variant_key}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/50">Date & Time:</span>
                    <span className="text-white font-medium">
                      {bookingDate} at {bookingTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Vehicle Reg:</span>
                    <span className="text-white font-mono font-bold">{registrationNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Location:</span>
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {locationAddress}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                    <span className="text-white/70">Total Amount:</span>
                    <span className="text-[#FAD293]">
                      £{dynamicBookingPrice}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href="/account?tab=bookings"
                    className="px-5 py-2.5 rounded-xl font-bold text-black text-xs shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    View My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProviderForBooking(null);
                      setIsBookingSuccess(false);
                    }}
                    className="px-5 py-2.5 rounded-xl font-semibold text-white/90 bg-white/5 border border-white/15 text-xs hover:bg-white/10 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Schedule Form */
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-white/10 shrink-0 p-1">
                    <img
                      src={
                        selectedProviderForBooking.logo_full_path ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={selectedProviderForBooking.company_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedProviderForBooking.company_name}
                    </h3>
                    <p className="text-xs text-[#FAD293] font-medium">
                      {currentServiceName}
                    </p>
                  </div>
                </div>

                {/* 1. Interactive Variation Selection */}
                {availableVariations.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#FAD293]" />
                        <span>Select Package Variation</span>
                      </label>
                      <span className="text-[10px] font-semibold text-[#FAD293]">
                        {availableVariations.length} option(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableVariations.map((v) => {
                        const isSelected =
                          (activeVariation?.variant_key || availableVariations[0]?.variant_key) ===
                          v.variant_key;
                        const varPrice =
                          v.price > 0
                            ? v.price
                            : activeServiceItem?.price > 0
                              ? activeServiceItem.price
                              : 0;

                        return (
                          <button
                            key={v.variant_key}
                            type="button"
                            onClick={() => setSelectedVariationKey(v.variant_key)}
                            className={`p-3 rounded-2xl border text-left transition relative flex items-center justify-between gap-2 ${isSelected
                              ? "bg-[#FAD293]/15 border-[#FAD293] shadow-md shadow-[#FAD293]/10 ring-1 ring-[#FAD293]"
                              : "bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/[0.08]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${isSelected
                                  ? "border-[#FAD293] bg-[#FAD293]"
                                  : "border-white/30 bg-transparent"
                                  }`}
                              >
                                {isSelected && (
                                  <Check size={10} className="text-black font-bold stroke-[3]" />
                                )}
                              </div>
                              <span className="text-xs font-bold text-white truncate capitalize">
                                {v.variant || v.variant_key}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-[#FAD293] shrink-0">
                              {varPrice > 0 ? `£${varPrice}` : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/70">Selected Service:</span>
                    <span className="text-white font-bold">{currentServiceName}</span>
                  </div>
                )}

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#FAD293]" />
                      <span>Preferred Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Clock size={12} className="text-[#FAD293]" />
                      <span>Arrival Time</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>
                </div>

                {/* Available Slots */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Clock size={12} className="text-[#FAD293]" />
                    <span>Available Slots</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { slot: "11:00 AM - 01:00 PM", time: "11:00" },
                      { slot: "02:48 PM - 03:48 PM", time: "14:48" },
                    ].map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(s.slot);
                          setBookingTime(s.time);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-center ${selectedSlot === s.slot
                          ? "bg-[#FAD293]/15 border-[#FAD293] text-[#FAD293] ring-1 ring-[#FAD293]"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Location Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#FAD293]" />
                    <span>Service Location</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingLocationType("customer")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${bookingLocationType === "customer"
                        ? "bg-[#FAD293] text-black shadow-md font-extrabold"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                    >
                      <Smartphone size={13} />
                      <span>Mobile Wash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingLocationType("provider")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${bookingLocationType === "provider"
                        ? "bg-[#FAD293] text-black shadow-md font-extrabold"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                    >
                      <Building size={13} />
                      <span>Workshop</span>
                    </button>
                  </div>
                </div>

                {/* Add Vehicle Details */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FAD293]">
                    <Car size={13} />
                    <span>Add Vehicle Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/50 block">Car Brand / Model</label>
                      <input
                        type="text"
                        value={bookingVehicleModel}
                        onChange={(e) => setBookingVehicleModel(e.target.value)}
                        placeholder="Eg Audi A4"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/50 block">Color (Optional)</label>
                      <input
                        type="text"
                        value={bookingVehicleColor}
                        onChange={(e) => setBookingVehicleColor(e.target.value)}
                        placeholder="Eg Black"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/50 block">Special Conditions</label>
                    <input
                      type="text"
                      value={bookingSpecialConditions}
                      onChange={(e) => setBookingSpecialConditions(e.target.value)}
                      placeholder='Eg "Bird Droppings, Pet Hair"'
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/50 block">Additional Notes</label>
                    <textarea
                      rows={2}
                      value={bookingAdditionalNotes}
                      onChange={(e) => setBookingAdditionalNotes(e.target.value)}
                      placeholder='Eg "Focus on dashboard and windows, remove pet hair, polish rims..."'
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] resize-none"
                    />
                  </div>
                </div>

                {/* Location & Reg Info summary */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Destination:</span>
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {locationAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Car Reg:</span>
                    <span className="text-white font-mono font-bold">{registrationNo}</span>
                  </div>
                  {activeVariation && (
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span className="text-white/50">Chosen Variation:</span>
                      <span className="text-[#FAD293] font-semibold capitalize">
                        {activeVariation.variant || activeVariation.variant_key}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <CreditCard size={12} className="text-[#FAD293]" />
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

                {/* Total Quote Amount & 25% Deposit Eligible Badge */}
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

                <button
                  type="button"
                  onClick={handleOpenPaymentModal}
                  disabled={isBookingSubmitting}
                  className="w-full py-3.5 rounded-xl font-bold text-black text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 disabled:opacity-50 shadow-xl shadow-[#FAD293]/10 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  <Sparkles size={16} className="text-black" />
                  <span>Confirm Valet Booking</span>
                  <ArrowRight size={16} className="text-black" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. "My work" Gallery Showcase Modal                       */}
      {/* ========================================================= */}
      {selectedProviderForGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#FAD293]/40 bg-[#120e0b] p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedProviderForGallery(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
            >
              <X size={15} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FAD293]">
                Work Showcase & Portfolio
              </span>
              <h3 className="text-lg font-bold text-white">
                {selectedProviderForGallery.company_name}
              </h3>
              <p className="text-xs text-white/50">
                {selectedProviderForGallery.company_address || "Certified London Valet Station"}
              </p>
            </div>

            {/* Gallery Images Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                <img
                  src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=600&q=80"
                  alt="Work 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                <img
                  src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80"
                  alt="Work 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"
                  alt="Work 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                <img
                  src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80"
                  alt="Work 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const prov = selectedProviderForGallery;
                setSelectedProviderForGallery(null);
                handleOpenBookingModal(prov);
              }}
              className="w-full py-3 rounded-xl font-bold text-black text-xs shadow-lg mt-2"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Book with {selectedProviderForGallery.company_name}
            </button>
          </div>
        </div>
      )}

      {/* Select Payment Method Modal / Bottom Sheet (Matches Bodywork/Chauffeur/Mechanical/Car Hire UI) */}
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
                  Choose how you want to pay for this valet wash service
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
                        Pay 25% deposit now to secure valet appointment
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
                    <span>Due on service completion (75%):</span>
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
                    ? "You must pay a 25% deposit upfront to confirm your booking. The remaining 75% will be paid once the valet wash service is completed."
                    : "You will pay the full amount upfront securely via Stripe. Instant booking confirmation."}
                </p>
              </div>
            </div>

            {/* Pay Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={executeValetBooking}
                disabled={isBookingSubmitting}
                className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isBookingSubmitting ? (
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
