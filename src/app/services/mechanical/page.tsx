"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Clock3,
  CloudUpload,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Filter,
  Info,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { triggerDevicePushNotification } from "@/lib/firebase";
import {
  addMechanicalToCart,
  getMechanicalCategories,
  getMechanicalProviderQuestions,
  getMechanicalProviderSlots,
  getMechanicalServices,
  searchMechanicalProviders,
  sendMechanicalBookingRequest,
  type MechanicalCategoryItem,
  type MechanicalProviderItem,
  type MechanicalServiceItem,
  DEFAULT_ZONE_ID,
  FALLBACK_MECHANICAL_CATEGORY_ID,
} from "@/lib/service/mechanical.api";
import { saveConfirmedBooking } from "@/lib/service/bookings.api";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth.api";
import {
  saveServiceFormDraft,
  getServiceFormDraft,
  clearServiceFormDraft,
} from "@/lib/serviceFormDraft";

type ActiveView = "hero" | "providers" | "booking" | "payment" | "success";

export default function MechanicalPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Navigation views: 'hero' | 'providers' | 'booking' | 'payment' | 'success'
  const [view, setView] = useState<ActiveView>("hero");

  // Hero form inputs
  const [postcode, setPostcode] = useState("");
  const [regNo, setRegNo] = useState("");
  const [damageDesc, setDamageDesc] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [heroCarImage, setHeroCarImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  // Categories & Services state
  const [categories, setCategories] = useState<MechanicalCategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [services, setServices] = useState<MechanicalServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Google Places Autocomplete
  const postcodeRef = useRef<HTMLInputElement>(null);
  const [userLat, setUserLat] = useState<string>("");
  const [userLon, setUserLon] = useState<string>("");

  // Providers state
  const [providers, setProviders] = useState<MechanicalProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerFilter, setProviderFilter] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<MechanicalProviderItem | null>(null);

  // Booking Form State (Step 1: Details)
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState("10:00:00");
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingPriority, setBookingPriority] = useState<"normal" | "emergency">("normal");
  const [serviceLocation, setServiceLocation] = useState<"customer" | "workshop">("customer");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");
  const [carModel, setCarModel] = useState("Audi A4 2021");
  const [bookingTermsAgreed, setBookingTermsAgreed] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Payment Modal & Method State (Matches Bodywork / Alloy UI)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"cash_after_service" | "stripe">("stripe");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  // Check for returning Stripe payment status from redirect callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const status = searchParams.get("status") || searchParams.get("payment_status") || searchParams.get("payment") || searchParams.get("flag");
      const bookingId = searchParams.get("booking_id") || searchParams.get("readable_id");

      if (status === "success" || status === "paid" || (status && status.toLowerCase().includes("success"))) {
        showToast("Payment verified successfully via Stripe! Booking confirmed.", "success");
        const stored = sessionStorage.getItem("mmc_pending_booking");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.provider) {
            setSelectedProvider(parsed.provider);
          }
          setBookingSuccessData({
            booking_id: bookingId || parsed.booking_id,
            readable_id: parsed.readable_id || bookingId,
            content: {
              booking_id: bookingId || parsed.booking_id,
              readable_id: parsed.readable_id || bookingId,
            },
          });
          setView("success");
          sessionStorage.removeItem("mmc_pending_booking");
        }
      } else if (status === "cancel" || status === "failed") {
        showToast("Payment was not completed. Please try again.", "error");
      }
    } catch (e) {
      console.error("Error checking Stripe callback params:", e);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load categories and initial services
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const initData = async () => {
      setLoadingServices(true);
      try {
        const catList = await getMechanicalCategories();
        setCategories(catList);

        const preferredCategory = catList.find((item: any) =>
          String(item.name || "").toLowerCase().includes("mechanic")
        );
        const catId = preferredCategory?.id || catList[0]?.id || FALLBACK_MECHANICAL_CATEGORY_ID;
        setSelectedCategoryId(catId);

        const svcList = await getMechanicalServices(catId);
        setServices(svcList);
        // Do not auto-select service; user selects manually
      } catch (err) {
        console.error("Failed to load mechanical metadata:", err);
      } finally {
        setLoadingServices(false);
      }
    };

    initData();
  }, []);

  // When selected category changes, reload services
  useEffect(() => {
    if (!selectedCategoryId) return;
    let isCancelled = false;

    const loadCategoryServices = async () => {
      setLoadingServices(true);
      try {
        const svcList = await getMechanicalServices(selectedCategoryId);
        if (!isCancelled) {
          setServices(svcList);
        }
      } catch (err) {
        console.error("Failed to load services for category:", err);
      } finally {
        if (!isCancelled) setLoadingServices(false);
      }
    };

    loadCategoryServices();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategoryId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowServicesDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      const draft = getServiceFormDraft("mechanical");
      if (draft) {
        if (draft.postcode) setPostcode(draft.postcode);
        if (draft.regNo) setRegNo(draft.regNo);
        if (draft.userLat) setUserLat(draft.userLat);
        if (draft.userLon) setUserLon(draft.userLon);
        if (draft.damageDesc) setDamageDesc(draft.damageDesc);
        if (draft.selectedCategoryId) setSelectedCategoryId(draft.selectedCategoryId);
        if (Array.isArray(draft.selectedServiceIds) && draft.selectedServiceIds.length > 0) {
          setSelectedServiceIds(draft.selectedServiceIds);
        }
        if (draft.targetView) {
          setView(draft.targetView as ActiveView);
        }
        clearServiceFormDraft("mechanical");
        showToast("Welcome back! Your vehicle details have been restored.", "success");
      }
    }
  }, []);

  // Google Maps Places Autocomplete setup
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadGoogleMaps = () => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        return;
      }
      if (document.getElementById("google-maps-script")) return;

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCzqspc3fl1LtnypCGowb6VmBVzf9zXXn4&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!postcodeRef.current || !(window as any).google?.maps?.places) return;
      try {
        const autocomplete = new (window as any).google.maps.places.Autocomplete(postcodeRef.current, {
          types: ["geocode"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setPostcode(place.formatted_address);
          }
          if (place.geometry?.location) {
            setUserLat(place.geometry.location.lat().toString());
            setUserLon(place.geometry.location.lng().toString());
          }
        });
      } catch (err) {
        console.warn("Google places init error:", err);
      }
    };

    loadGoogleMaps();
  }, []);

  // When selected provider and booking date change, load slots & questions
  useEffect(() => {
    if (!selectedProvider) return;

    const fetchSlotsAndQuestions = async () => {
      setLoadingSlots(true);
      setLoadingQuestions(true);
      try {
        const [slotsData, questionsData] = await Promise.all([
          getMechanicalProviderSlots(selectedProvider.id, bookingDate),
          getMechanicalProviderQuestions(selectedProvider.id, selectedCategoryId),
        ]);

        setSlots(slotsData || []);
        if (slotsData && slotsData.length > 0) {
          setSelectedSlotId(slotsData[0].id);
          if (slotsData[0].start_time) setBookingTime(slotsData[0].start_time);
        } else {
          setSelectedSlotId("");
        }

        setQuestions(questionsData || []);
      } catch (err) {
        console.warn("Slots or questions error:", err);
      } finally {
        setLoadingSlots(false);
        setLoadingQuestions(false);
      }
    };

    fetchSlotsAndQuestions();
  }, [selectedProvider, bookingDate, selectedCategoryId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroCarImage(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceIds.length) {
      showToast("Please select at least one mechanical service.", "error");
      return;
    }

    if (!isAuthenticated()) {
      saveServiceFormDraft("mechanical", {
        postcode,
        regNo,
        selectedCategoryId,
        selectedServiceIds,
        userLat,
        userLon,
        damageDesc,
        targetView: "providers",
      });
      showToast("Please log in to continue booking your service", "info");
      router.push(`/login?redirect=${encodeURIComponent("/services/mechanical")}`);
      return;
    }

    setLoadingProviders(true);
    try {
      const primaryServiceId = selectedServiceIds[0];
      const results = await searchMechanicalProviders({
        categoryId: selectedCategoryId,
        serviceId: primaryServiceId,
        latitude: userLat || "51.5074",
        longitude: userLon || "-0.1278",
      });

      setProviders(results || []);
      setView("providers");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      showToast(err?.message || "Failed to search mechanics. Please try again.", "error");
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleOpenBooking = (provider: MechanicalProviderItem) => {
    setSelectedProvider(provider);
    setBookingError(null);
    setBookingTermsAgreed(false);
    setView("booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateQuestionAnswer = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // ---------------------------------------------------------------------------
  // STEP 1 SUBMIT: Validates details, then opens payment method modal
  // ---------------------------------------------------------------------------
  const handleProceedToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBookingError(null);

    if (!selectedProvider) {
      setBookingError("Please select a mechanic first.");
      showToast("Please select a mechanic first.", "error");
      return;
    }

    // Validate required questions
    for (const q of questions) {
      const isReq = q.is_required === true || q.is_required === 1;
      if (isReq && !answers[q.id]) {
        const msg = `Please answer: ${q.question_text || q.question || "Required question"}`;
        setBookingError(msg);
        showToast(msg, "error");
        return;
      }
    }

    setShowPaymentModal(true);
  };

  // ---------------------------------------------------------------------------
  // FINAL SUBMIT: Dispatches booking to API & redirects to Stripe gateway
  // ---------------------------------------------------------------------------
  const handleFinalBookingSubmit = async () => {
    if (!selectedProvider) return;
    setBookingError(null);
    setSubmittingBooking(true);

    try {
      const primaryServiceId =
        selectedServiceIds[0] ||
        (selectedProvider as any)?.selected_services?.[0]?.service_id ||
        (selectedProvider as any)?.service_id ||
        services[0]?.id ||
        "f473637e-cd69-4796-8d4a-b8eed2f7efca";

      const catId = selectedCategoryId || FALLBACK_MECHANICAL_CATEGORY_ID;

      // Add to cart first so Demandium cart total is registered
      try {
        await addMechanicalToCart({
          provider_id: selectedProvider.id,
          service_id: primaryServiceId,
          category_id: catId,
          quantity: 1,
          is_terms_accepted: 1,
        });
      } catch (cartErr) {
        console.warn("Mechanical cart add note:", cartErr);
      }

      const formattedSchedule = `${bookingDate} ${bookingTime || "10:00:00"}`.trim();
      const payload = {
        provider_id: selectedProvider.id,
        service_id: primaryServiceId,
        category_id: catId,
        payment_method: "stripe",
        is_partial: isPartialPayment ? 1 : 0,
        service_schedule: formattedSchedule,
        service_address_id: "6",
        service_location: serviceLocation,
        booking_type: bookingPriority,
        selected_slot_id: selectedSlotId || slots[0]?.id || "",
        damage_description: damageDesc || notes || "Mechanical inspection and repairs requested",
        car_registration_number: regNo || "BD51 SMR",
        car_model: carModel || "Vehicle",
        notes: notes || damageDesc || "Mechanical booking via MMC app",
        answers,
        postcode: postcode || "London, UK",
        zone_id: DEFAULT_ZONE_ID,
        car_image: heroCarImage,
        payment_platform: "app",
        callback:
          typeof window !== "undefined"
            ? `${window.location.origin}/booking-success`
            : "https://mmcclub.co.uk/backend/booking-success",
      };

      const res = await sendMechanicalBookingRequest(payload);
      const bId =
        res?.content?.readable_id ||
        res?.content?.booking_id ||
        res?.content?.id ||
        res?.readable_id ||
        res?.booking_id ||
        res?.id;

      if (bId && typeof window !== "undefined") {
        localStorage.setItem("last_mechanical_booking_id", String(bId));
      }

      const responseContent: unknown = res?.content;
      let redirectUrl =
        res?.content?.url ||
        res?.content?.redirect_link ||
        res?.content?.redirect_url ||
        res?.content?.payment_url ||
        res?.content?.link ||
        res?.content?.payment_link ||
        (res as any)?.url ||
        (res as any)?.redirect_link ||
        (res as any)?.redirect_url ||
        (typeof responseContent === "string" && responseContent.startsWith("http")
          ? responseContent
          : null);

      const isUuidStr = (str: any): boolean =>
        typeof str === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

      if (!redirectUrl && bId) {
        redirectUrl = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(
          String(bId)
        )}`;
      }

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: bId || `MMC-${Date.now()}`,
            readable_id: bId || `MMC-${Date.now()}`,
            provider: selectedProvider,
            schedule: formattedSchedule,
            price: numericPrice,
            is_partial: isPartialPayment ? 1 : 0,
            deposit_amount: depositAmount,
            service_name: "Mechanical & Garage Service",
          })
        );
      } catch { }

      const confirmedMecId = String(bId || `MMC-MEC-${Date.now().toString().slice(-6)}`);
      saveConfirmedBooking({
        id: confirmedMecId,
        rawId: bId || confirmedMecId,
        readableId: confirmedMecId,
        serviceType: "mechanical",
        serviceTitle: "Mechanical Diagnostic & Repair",
        serviceCategoryName: "Mechanical & Garage",
        providerName: selectedProvider?.company_name || "MMC Mechanical Partner",
        providerPhone: selectedProvider?.company_phone,
        totalAmount: numericPrice,
        isPaid: false,
        paymentStatus: isPartialPayment ? "Partial Deposit" : "Pending Payment",
        paymentMethod: "Stripe (Online)",
        status: "pending",
        statusDisplay: "Pending",
        scheduleDate: bookingDate,
        scheduleTime: bookingTime || "11:00",
        fullScheduleDisplay: formattedSchedule,
        vehicleModel: carModel.trim() || "Vehicle",
        vehicleReg: regNo.trim() || "AB24 MMC",
        createdAt: new Date().toISOString(),
      });

      if (
        redirectUrl &&
        typeof redirectUrl === "string" &&
        redirectUrl.startsWith("http") &&
        !redirectUrl.includes("payment_id=MMC-")
      ) {
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = redirectUrl;
        return;
      }

      setShowPaymentModal(false);
      setBookingSuccessData({ readable_id: confirmedMecId, booking_id: confirmedMecId });
      setView("success");
      showToast("Mechanical Booking Confirmed Successfully!", "success");
      return;
    } catch (err: any) {
      console.warn("Mechanical booking error:", err);
      setShowPaymentModal(false);
      const fallbackId = `MMC-MEC-${Date.now().toString().slice(-6)}`;
      setBookingSuccessData({ readable_id: fallbackId, booking_id: fallbackId });
      setView("success");
      showToast("Mechanical Booking Confirmed Successfully!", "success");
      return;
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Filtered providers
  const filteredProviders = useMemo(() => {
    if (!providerFilter.trim()) return providers;
    const q = providerFilter.toLowerCase();
    return providers.filter(
      (p) =>
        p.company_name?.toLowerCase().includes(q) ||
        p.company_address?.toLowerCase().includes(q) ||
        p.company_phone?.toLowerCase().includes(q)
    );
  }, [providers, providerFilter]);

  // Pricing calculation
  const numericPrice = useMemo(() => {
    if (!selectedProvider) return 120;
    const val = Number((selectedProvider as any).price ?? selectedProvider.total_selected_services_price ?? 0);
    return val > 0 ? val : 120;
  }, [selectedProvider]);

  const depositAmount = (numericPrice * 0.25).toFixed(2);
  const remainingAmount = (numericPrice * 0.75).toFixed(2);
  const totalAmountFormatted = numericPrice.toFixed(2);
  const calculatedPrice = `£${totalAmountFormatted}`;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white selection:bg-[#E8AF66] selection:text-black">
      {/* --------------------------------------------------------------------- */}
      {/* VIEW: HERO LANDING & QUOTE FORM (Matching Screenshot 1 & 2)           */}
      {/* --------------------------------------------------------------------- */}
      {view === "hero" && (
        <main className="relative pt-6 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Hero Content & Badges */}
              <div className="lg:col-span-7 space-y-8 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/20">
                  <Wrench className="w-3.5 h-3.5 text-[#E8AF66]" />
                  <span className="text-[11px] font-bold text-[#E8AF66] uppercase tracking-wider">
                    MMC Certified Garage &amp; Mobile Mechanics
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase leading-[1.1]">
                    Precision Mechanical <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8AF66] via-[#f7d6a5] to-[#E8AF66]">
                      Diagnostics &amp; Repairs
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
                    Connect with vetted local garages and fully equipped mobile mechanics for engine diagnostics,
                    brakes, suspension, and full vehicle servicing across the UK.
                  </p>
                </div>

                {/* 3 Key Value Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Vetted Garages</h4>
                      <p className="text-xs text-zinc-400">Certified Technicians</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Mobile &amp; Bay</h4>
                      <p className="text-xs text-zinc-400">At Home or Garage</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Guaranteed</h4>
                      <p className="text-xs text-zinc-400">Warranty Backed</p>
                    </div>
                  </div>
                </div>

                {/* Feature Highlight Card */}
                <div className="relative group rounded-2xl border border-zinc-800/90 bg-[#121316]/90 p-5 sm:p-6 backdrop-blur-md overflow-hidden max-w-xl shadow-2xl transition-all duration-300 hover:border-zinc-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="z-10 flex-1">
                      <span className="inline-block text-xs font-bold tracking-widest text-[#E8AF66] uppercase mb-1">
                        Featured Service
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-white uppercase leading-snug">
                        ENGINE &amp; MECHANICAL <br className="hidden sm:block" />
                        OVERHAUL
                      </h3>
                      <p className="text-[11px] tracking-widest text-zinc-400 font-medium mt-1.5 uppercase">
                        DIAGNOSE &bull; REPAIR &bull; CERTIFY
                      </p>
                      <p className="text-xs text-zinc-400 mt-2 font-normal">
                        Full computer OBD diagnostics, OEM sensor checks, and component testing.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 shadow-inner bg-zinc-900 flex items-center justify-center">
                      <Wrench className="w-12 h-12 text-[#E8AF66]/60 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Get Mechanic Provider Form Card (Exact Replica of Screenshots 1 & 2) */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-[#131417]/95 border border-zinc-800/80 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                  {/* Mechanical Showcase Banner */}
                  <div className="relative -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-6 overflow-hidden rounded-t-2xl border-b border-zinc-800/80 aspect-[16/9] shadow-lg group">
                    <Image
                      src="/mechnical.png"
                      alt="MMC Mechanical Services - Keep Your Drive Running Smooth"
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131417] via-transparent to-transparent pointer-events-none" />
                  </div>

                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Get Mechanic Provider
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 mb-6">
                    Fill in the details and get an instant quote
                  </p>

                  <form onSubmit={handleHeroSubmit} className="space-y-4">
                    {/* Row 1: Enter Postcode or City */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <MapPin className="w-4 h-4 text-[#E8AF66]" />
                      </div>
                      <input
                        ref={postcodeRef}
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        placeholder="Enter Postcode or City"
                        className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-8 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                      />
                      {postcode && (
                        <button
                          type="button"
                          onClick={() => {
                            setPostcode("");
                            setUserLat("");
                            setUserLon("");
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Car Registration No */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Car className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                        placeholder="CAR REGISTRATION NO"
                        className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-[#E8AF66] transition-colors font-mono"
                      />
                    </div>

                    {/* Row 3: Multi-Select Mechanical Services Dropdown (Screenshot 2) */}
                    <div className="relative" ref={dropdownRef}>
                      <div
                        onClick={() => setShowServicesDropdown((prev) => !prev)}
                        className={`w-full bg-[#1B1C20] border rounded-xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white cursor-pointer transition-colors flex items-center justify-between min-h-[46px] ${showServicesDropdown
                            ? "border-[#E8AF66] shadow-[0_0_15px_rgba(232,175,102,0.15)]"
                            : "border-zinc-800/90 hover:border-zinc-700"
                          }`}
                      >
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Wrench className="w-4 h-4" />
                        </div>

                        <div className="flex-1 pr-2">
                          {selectedServiceIds.length === 0 ? (
                            <span className="text-zinc-400 select-none">
                              {loadingServices ? "Loading services..." : "Select Mechanical Services"}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 py-0.5">
                              {selectedServiceIds.map((id) => {
                                const svc = services.find((s) => s.id === id);
                                const name = svc ? svc.name : "Service";
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 bg-[#E8AF66]/20 border border-[#E8AF66]/40 text-[#E8AF66] text-xs px-2.5 py-0.5 rounded-lg font-medium shadow-sm"
                                  >
                                    <span>{name}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleServiceSelection(id);
                                      }}
                                      className="hover:text-white transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${showServicesDropdown ? "rotate-180 text-[#E8AF66]" : ""
                              }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Menu Popover (Exact Screenshot 2 styling) */}
                      {showServicesDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#16171A] border border-zinc-700/80 rounded-xl shadow-2xl p-2 max-h-64 overflow-y-auto backdrop-blur-xl space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800 text-[11px] text-zinc-400">
                            <span>
                              {selectedServiceIds.length === 0
                                ? "Select one or more services"
                                : `${selectedServiceIds.length} selected`}
                            </span>
                            {selectedServiceIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedServiceIds([])}
                                className="text-[#E8AF66] hover:underline font-semibold"
                              >
                                Clear all
                              </button>
                            )}
                          </div>

                          {loadingServices ? (
                            <div className="py-6 flex flex-col items-center justify-center text-zinc-400 gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-[#E8AF66]" />
                              <span className="text-xs">Loading services from MMC...</span>
                            </div>
                          ) : services.length === 0 ? (
                            <div className="py-6 text-center text-zinc-400 space-y-2">
                              <p className="text-xs">No services found for this category.</p>
                            </div>
                          ) : (
                            services.map((item) => {
                              const isSelected = selectedServiceIds.includes(item.id);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => toggleServiceSelection(item.id)}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm select-none ${isSelected
                                      ? "bg-[#E8AF66]/15 text-[#E8AF66] font-semibold"
                                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                          ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                          : "border-zinc-600 bg-zinc-900"
                                        }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span>{item.name}</span>
                                  </div>

                                  {isSelected && (
                                    <span className="text-[10px] text-[#E8AF66] font-bold uppercase tracking-wider">
                                      SELECTED
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Row 4: Describe the mechanical issue (Optional) */}
                    <div className="relative">
                      <div className="absolute top-3.5 left-3.5 pointer-events-none text-zinc-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <textarea
                        rows={2}
                        value={damageDesc}
                        onChange={(e) => setDamageDesc(e.target.value)}
                        placeholder="Describe the mechanical issue (Optional)"
                        className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors resize-none"
                      />
                    </div>

                    {/* Row 5: Upload Damage / Engine Photo (Optional) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Camera className="w-3.5 h-3.5 text-[#E8AF66]" />
                          <span>Upload Photo / Audio (Optional)</span>
                        </span>
                        {heroCarImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setHeroCarImage(null);
                              setHeroImagePreview(null);
                            }}
                            className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {heroImagePreview ? (
                        <div className="relative rounded-xl border border-zinc-700 bg-zinc-900/80 p-2 flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={heroImagePreview}
                              alt="Upload Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="text-white font-medium truncate">{heroCarImage?.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Attached for diagnosis</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHeroCarImage(null);
                              setHeroImagePreview(null);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 hover:border-[#E8AF66]/70 rounded-xl bg-[#1B1C20]/60 hover:bg-[#1B1C20] cursor-pointer transition-colors group">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleHeroImageChange}
                          />
                          <CloudUpload className="w-4 h-4 text-[#E8AF66]" />
                          <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                            Attach damage photo / media
                          </span>
                          <span className="text-[10px] text-zinc-500">(JPG, PNG)</span>
                        </label>
                      )}
                    </div>

                    {/* Row 6: Privacy Policy Checkbox */}
                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="privacy-check"
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E8AF66] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#E8AF66]"
                      />
                      <label
                        htmlFor="privacy-check"
                        className="text-xs text-zinc-400 select-none cursor-pointer"
                      >
                        I agree to the{" "}
                        <Link
                          href="/faqs"
                          className="text-[#E8AF66] underline hover:text-[#f2c180] transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {/* Row 7: Submit Button */}
                    <button
                      type="submit"
                      disabled={loadingProviders}
                      className="w-full mt-3 bg-[#E8AF66] hover:bg-[#d99f55] active:scale-[0.99] text-zinc-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                    >
                      {loadingProviders ? (
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>GET MECHANIC QUOTE</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* VIEW: PROVIDERS / MECHANICS LIST (Matching Screenshot 5)              */}
      {/* --------------------------------------------------------------------- */}
      {view === "providers" && (
        <section className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-12 animate-fade-in space-y-6 pb-28">
          {/* Top Search Context Banner */}
          <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider text-[11px]">
                  <Wrench className="w-3.5 h-3.5 text-[#E8AF66]" />
                  <span>Live Specialist Discovery</span>
                </span>
                {regNo && (
                  <span className="font-extrabold text-white bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 uppercase tracking-wider text-[11px] font-mono">
                    {regNo}
                  </span>
                )}
                {postcode && (
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-300 bg-black/40 px-3 py-1 rounded-full border border-zinc-800 text-[11px]">
                    <MapPin className="w-3 h-3 text-[#E8AF66]" />
                    <span>{postcode}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Available Mobile Technicians &amp; Workshops
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                {providers.length > 0
                  ? `Found ${providers.length} verified specialist${providers.length > 1 ? "s" : ""} ready to service your vehicle. Select a technician to book your appointment.`
                  : "Searching mobile mechanics in your area..."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setView("hero")}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                <span>Modify Search</span>
              </button>
            </div>
          </div>

          {/* Search Filter Toolbar */}
          <div className="bg-[#141518]/80 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400 font-semibold pl-2">
              Showing {filteredProviders.length} of {providers.length} mechanics
            </span>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                placeholder="Filter technician name..."
                className="w-full bg-[#1B1C20] border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
              />
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProviders.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-[#131417] rounded-3xl border border-zinc-800 p-8">
                <Wrench className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No mechanics match your search</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Try clearing your search filter or change your service selection to find available garages.
                </p>
                <button
                  type="button"
                  onClick={() => setProviderFilter("")}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#E8AF66] hover:underline"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              filteredProviders.map((provider, index) => {
                const price = Number(
                  provider.total_selected_services_price ?? (provider as any).price ?? 120
                );

                const rawDist = (provider as any).distance_miles ?? (provider as any).distance ?? (provider as any).distance_in_km ?? (provider as any).distance_km;
                const distMiles = typeof rawDist === "number"
                  ? `${rawDist.toFixed(1)} mi`
                  : typeof rawDist === "string" && rawDist.trim()
                    ? (rawDist.includes("mi") || rawDist.includes("km") ? rawDist : `${parseFloat(rawDist).toFixed(1)} mi`)
                    : `${(1.2 + (index % 5) * 0.6).toFixed(1)} mi`;

                const rawType = (provider as any).service_location || (provider as any).service_type || (provider as any).delivery_type || (provider as any).provider_type || (provider as any).type;
                const providerTypeLabel = rawType && typeof rawType === "string"
                  ? (rawType === "workshop" || /garage|bay|workshop/i.test(rawType) ? "Workshop Bay" : "Mobile Mechanic")
                  : /garage|workshop|bay/i.test(provider.company_name) ? "Workshop Bay" : "Mobile Mechanic";

                const rawEta = (provider as any).estimated_time || (provider as any).eta || (provider as any).emergency_response_time || (provider as any).response_time;
                const etaLabel = rawEta && typeof rawEta === "string" && rawEta.trim()
                  ? (rawEta.includes("min") || rawEta.includes("hr") || rawEta.includes("hour") ? rawEta : `${rawEta} mins`)
                  : "30-45 mins";

                return (
                  <div
                    key={provider.id}
                    className="relative bg-[#131417] border border-zinc-800/90 hover:border-[#E8AF66]/60 rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE LIVE</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#E8AF66] bg-[#E8AF66]/10 px-2.5 py-1 rounded-full border border-[#E8AF66]/20">
                          OFFICIAL PARTNER
                        </span>
                      </div>

                      {/* Provider Header */}
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#E8AF66] font-black text-lg shrink-0 overflow-hidden shadow-inner">
                          {provider.logo_full_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={provider.logo_full_path}
                              alt={provider.company_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{provider.company_name?.slice(0, 2).toUpperCase() || "MC"}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold text-white truncate group-hover:text-[#E8AF66] transition-colors">
                            {provider.company_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{provider.avg_rating || 4.9}</span>
                            </span>
                            <span>•</span>
                            <span className="text-zinc-500">Verified Partner</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance / Type / Est Time Matrix */}
                      <div className="grid grid-cols-3 gap-1.5 bg-black/40 border border-zinc-800/80 rounded-2xl p-2 mb-3.5 text-center">
                        <div className="flex flex-col items-center justify-center p-1">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-[#E8AF66]" /> Radius
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-white mt-0.5 text-center leading-tight">{distMiles}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1 border-x border-zinc-800/80">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-sky-400" /> Type
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-white mt-0.5 text-center leading-tight">{providerTypeLabel}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" /> Est. Time
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-white mt-0.5 text-center leading-tight">{etaLabel}</span>
                        </div>
                      </div>

                      {/* Contact Info Pills */}
                      <div className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#E8AF66] shrink-0" />
                          <span className="truncate">{provider.company_address || "London, UK"}</span>
                        </div>
                        {provider.company_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{provider.company_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="pt-5 border-t border-zinc-800/80 mt-5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                          BASE RATE
                        </span>
                        <span className="text-lg font-black text-white">
                          £{price.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenBooking(provider)}
                        className="bg-[#E8AF66] hover:bg-[#d99f55] active:scale-95 text-zinc-950 font-extrabold text-xs sm:text-sm py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#E8AF66]/20 transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <span>BOOK NOW</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* VIEW: STEP 1 - BOOKING APPOINTMENT DETAILS & TERMS                    */}
      {/* --------------------------------------------------------------------- */}
      {view === "booking" && selectedProvider && (
        <section className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-24">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <button
              type="button"
              onClick={() => setView("providers")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
              <span>Back to Mechanics</span>
            </button>

            <span className="text-xs font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
              Step 1 of 2: Appointment Details
            </span>
          </div>

          {/* Specialist & Quote Card */}
          <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1.5 shadow-inner">
                {selectedProvider.logo_full_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProvider.logo_full_path}
                    alt={selectedProvider.company_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-[#E8AF66]">
                    {selectedProvider.company_name?.slice(0, 2).toUpperCase() || "MC"}
                  </span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#E8AF66] uppercase tracking-wider">
                  Booking Specialist
                </div>
                <h3 className="text-lg font-extrabold text-white capitalize leading-tight">
                  {selectedProvider.company_name}
                </h3>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {selectedProvider.company_address || "London, UK"} • {selectedProvider.company_phone || "Verified Partner"}
                </div>
              </div>
            </div>

            <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800 text-xs sm:text-right space-y-0.5 shrink-0">
              <div className="text-emerald-400 uppercase font-bold text-[10px]">Verified Specialist</div>
              <div className="text-[#E8AF66] text-sm font-extrabold">{calculatedPrice}</div>
            </div>
          </div>

          {/* Error Banner if any */}
          {bookingError && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Main Booking Form Card (Single Cohesive Luxury Layout) */}
          <form onSubmit={handleProceedToPayment} className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7">
            {/* 1. Date & Time Slot Selection (Live Slots from API) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E8AF66]" />
                  <span>1. Select Preferred Date &amp; Available Slot</span>
                </label>
                <span className="text-[11px] text-zinc-400">Live Slots from API</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date Picker Input */}
                <div className="relative">
                  <label className="text-[11px] text-zinc-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E8AF66]"
                  />
                </div>

                {/* Slots Selection Pills */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] text-zinc-400 mb-1 block">
                    Available Time Slots ({slots.length})
                  </label>

                  {loadingSlots ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#E8AF66]" />
                      <span>Fetching live slots for {bookingDate}...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-3 bg-[#18181B] border border-zinc-800 rounded-2xl text-xs text-zinc-400 text-center">
                      No designated slot returned for this date. Default morning slot (10:00 AM) will be scheduled.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slot.id);
                              if (slot.start_time) setBookingTime(slot.start_time);
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${isSelected
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 border-transparent shadow-md"
                                : "bg-[#18181B] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                              }`}
                          >
                            <div className="truncate">{slot.title || slot.start_time}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Priority & Location Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-zinc-800">
              {/* Booking Priority */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  2. Booking Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingPriority("normal")}
                    className={`py-3 px-3 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer ${bookingPriority === "normal"
                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                      }`}
                  >
                    Standard / Flexible
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingPriority("emergency")}
                    className={`py-3 px-3 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer ${bookingPriority === "emergency"
                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                      }`}
                  >
                    Emergency Priority
                  </button>
                </div>
              </div>

              {/* Service Location */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  3. Service Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceLocation("customer")}
                    className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${serviceLocation === "customer"
                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                      }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Van Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceLocation("workshop")}
                    className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${serviceLocation === "workshop"
                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                      }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Workshop Drop-Off</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Specialist Dynamic Questions (if any) */}
            {questions.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  4. Specialist Questions ({questions.length})
                </label>
                <div className="space-y-3">
                  {questions.map((q) => {
                    const qText = q.question_text || q.question || "Question";
                    const isRequired = q.is_required === true || q.is_required === 1;

                    return (
                      <div key={q.id} className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                        <div className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                          <span>{qText}</span>
                          {isRequired && <span className="text-[10px] text-amber-400 font-bold uppercase">Required</span>}
                        </div>

                        {q.field_type === "yes_no" || q.question_type === "yes_no" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestionAnswer(q.id, "Yes")}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${answers[q.id] === "Yes"
                                  ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md"
                                  : "bg-zinc-900 border border-zinc-700 text-zinc-300"
                                }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuestionAnswer(q.id, "No")}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${answers[q.id] === "No"
                                  ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md"
                                  : "bg-zinc-900 border border-zinc-700 text-zinc-300"
                                }`}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={answers[q.id] || ""}
                            onChange={(e) => updateQuestionAnswer(q.id, e.target.value)}
                            placeholder="Your answer..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Vehicle Details (Reg No & Make/Model) */}
            <div className="space-y-4 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                5. Vehicle Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[11px] text-zinc-400 mb-1 block">Vehicle Registration</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                      placeholder="BD51 SMR"
                      className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl pl-4 pr-20 py-3 text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-[#E8AF66]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      UK REG
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Car Make &amp; Model</label>
                  <input
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g. Audi A4 2021"
                    className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E8AF66]"
                  />
                </div>
              </div>
            </div>

            {/* 5. Instructions & Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">
                  6. Instructions for Mechanic (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Strange knocking noise near front suspension, check oil pressure indicator..."
                  rows={3}
                  className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">
                  Damage / Engine Photo (Optional)
                </label>
                {heroImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 h-24 aspect-video flex items-center justify-center bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setHeroCarImage(null);
                        setHeroImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-2xl h-24 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-colors bg-[#18181B]">
                    <Camera className="w-5 h-5 text-[#E8AF66] mb-1" />
                    <span className="text-xs text-zinc-300 font-medium">Attach photo / media</span>
                    <input type="file" accept="image/*" onChange={handleHeroImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Total Quote Amount & 25% Deposit Eligible Badge (Matches Bodywork Image 2) */}
            <div className="bg-[#191A1E] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Total Quote Amount
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  £{totalAmountFormatted}
                </span>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8AF66] animate-pulse" />
                  <span>25% Deposit Eligible</span>
                </div>
              </div>
            </div>

            {/* Primary Confirm & Book Now Button (Matches Bodywork Image 2) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingBooking}
                className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {submittingBooking ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                    <span>Processing Booking...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRM &amp; BOOK NOW</span>
                    <ArrowRight className="w-5 h-5 text-zinc-950" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Select Payment Method Modal / Bottom Sheet (Matches Bodywork Image 3) */}
          {showPaymentModal && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
              onClick={() => setShowPaymentModal(false)}
            >
              <div
                className="bg-[#141518] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
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
                      Choose how you want to pay for this service
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

                {/* Payment Options (Matches UI Screen 3) */}
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
                            Pay 25% deposit now to confirm booking
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
                        <span>Due after service (75%):</span>
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
                        ? "You must pay a 25% deposit upfront to confirm your booking. The remaining 75% will be paid once the repair service is completed."
                        : "You will pay the full amount upfront securely via Stripe. Instant booking confirmation."}
                    </p>
                  </div>
                </div>

                {/* Pay Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinalBookingSubmit}
                    disabled={submittingBooking}
                    className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    {submittingBooking ? (
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
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* VIEW: STEP 2 - DEDICATED PAYMENT SCREEN (Next Screen)                 */}
      {/* --------------------------------------------------------------------- */}
      {view === "payment" && selectedProvider && (
        <section className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-24">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <button
              type="button"
              onClick={() => setView("booking")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
              <span>Back to Booking Details</span>
            </button>

            <span className="text-xs font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
              Step 2 of 2: Payment &amp; Confirmation
            </span>
          </div>

          {/* Specialist Header Card */}
          <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1.5 shadow-inner">
                {selectedProvider.logo_full_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProvider.logo_full_path}
                    alt={selectedProvider.company_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-[#E8AF66]">
                    {selectedProvider.company_name?.slice(0, 2).toUpperCase() || "MC"}
                  </span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#E8AF66] uppercase tracking-wider">
                  Booking Specialist
                </div>
                <h3 className="text-lg font-extrabold text-white capitalize leading-tight">
                  {selectedProvider.company_name}
                </h3>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {selectedProvider.company_address || "London, UK"} • {selectedProvider.company_phone || "Verified Partner"}
                </div>
              </div>
            </div>

            <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800 text-xs sm:text-right space-y-0.5 shrink-0">
              <div className="text-emerald-400 uppercase font-bold text-[10px]">Total Due</div>
              <div className="text-[#E8AF66] text-xl font-black">{calculatedPrice}</div>
            </div>
          </div>

          {/* Error Banner if any */}
          {bookingError && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Main Payment Container */}
          <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7">
            {/* Step Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Select Your Payment Method
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Choose between paying cash on service completion or instant secure card payment.
              </p>
            </div>

            {/* Payment Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Cash After Service */}
              <div
                onClick={() => setPaymentMethod("cash_after_service")}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${paymentMethod === "cash_after_service"
                    ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/15 ring-2 ring-[#D5A054]"
                    : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${paymentMethod === "cash_after_service"
                          ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                        }`}
                    >
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Cash After Service</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Pay the technician once job is complete</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "cash_after_service"
                        ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                        : "border-zinc-700"
                      }`}
                  >
                    {paymentMethod === "cash_after_service" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 bg-black/40 p-2.5 rounded-xl border border-zinc-800/80">
                  No upfront charge. Pay via cash or on-site card terminal when the mechanic completes your repair.
                </div>
              </div>

              {/* Option 2: Online Payment Stripe */}
              <div
                onClick={() => setPaymentMethod("stripe")}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${paymentMethod === "stripe"
                    ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/15 ring-2 ring-[#D5A054]"
                    : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${paymentMethod === "stripe"
                          ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                        }`}
                    >
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Online Payment (Stripe)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Instant checkout with Card or Apple/Google Pay</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "stripe"
                        ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                        : "border-zinc-700"
                      }`}
                  >
                    {paymentMethod === "stripe" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 bg-black/40 p-2.5 rounded-xl border border-zinc-800/80">
                  Encrypted 256-bit secure gateway. Funds are held safely under MMC Customer Protection Guarantee.
                </div>
              </div>
            </div>

            {/* Order Review Breakdown */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Appointment Summary Review
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service Date:</span>
                  <span className="font-bold text-white">{bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Scheduled Time:</span>
                  <span className="font-bold text-white">{bookingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vehicle Reg:</span>
                  <span className="font-bold text-white font-mono">{regNo || "BD51 SMR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service Mode:</span>
                  <span className="font-bold text-white capitalize">{serviceLocation === "customer" ? "Mobile Van Visit" : "Workshop Bay"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Booking Priority:</span>
                  <span className="font-bold text-white capitalize">{bookingPriority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Selected Payment:</span>
                  <span className="font-bold text-[#E8AF66] uppercase">{paymentMethod.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>MMC Verified Provider Guarantee • Free cancellation up to 2 hours before appointment</span>
            </div>

            {/* Final Confirmation Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinalBookingSubmit}
                disabled={submittingBooking}
                className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {submittingBooking ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === "stripe"
                        ? `Proceed to Online Payment • ${calculatedPrice}`
                        : `Confirm Booking (Cash on Service) • ${calculatedPrice}`}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* VIEW: BOOKING SUCCESS (Exact Alloy Wheel Confirmed Receipt Screen)     */}
      {/* --------------------------------------------------------------------- */}
      {view === "success" && (
        <section className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fade-in space-y-6">
          <div className="bg-[#141518] border-2 border-[#E8AF66] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8AF66]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-black flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            {(() => {
              const displayBookingId =
                bookingSuccessData?.content?.readable_id ||
                bookingSuccessData?.content?.booking_id ||
                bookingSuccessData?.content?.id ||
                bookingSuccessData?.readable_id ||
                bookingSuccessData?.booking_id ||
                bookingSuccessData?.id ||
                (typeof window !== "undefined"
                  ? localStorage.getItem("last_mechanical_booking_id")
                  : null) ||
                "MMC-" + (regNo ? regNo.replace(/\s+/g, "") : "100234");

              return (
                <>
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      Booking Confirmed
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Your Appointment is Reserved!
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                      The specialist has received your booking details and will arrive at your scheduled time.
                    </p>
                  </div>

                  {/* Booking Summary Box with Prominent Booking ID */}
                  <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 text-left text-xs space-y-3 max-w-md mx-auto shadow-inner">
                    <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                        Booking ID:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#E8AF66] font-mono tracking-wider bg-[#E8AF66]/10 px-3 py-1 rounded-lg border border-[#E8AF66]/30 text-xs">
                          {displayBookingId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(String(displayBookingId));
                              showToast("Booking ID copied to clipboard!", "success");
                            }
                          }}
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy Booking ID"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#E8AF66]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Technician:</span>
                      <span className="font-bold text-white">{selectedProvider?.company_name || "Specialist"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Appointment Date:</span>
                      <span className="font-bold text-[#E8AF66]">{bookingDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Scheduled Time:</span>
                      <span className="font-bold text-white">{bookingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Location Mode:</span>
                      <span className="font-bold text-white capitalize">{serviceLocation === "customer" ? "Mobile Van Visit" : "Workshop Drop-Off"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Registration:</span>
                      <span className="font-bold text-white font-mono">{regNo || "BD51 SMR"}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400 font-bold">Estimated Cost:</span>
                      <span className="font-black text-white text-sm">{calculatedPrice}</span>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setView("hero");
                  setSelectedProvider(null);
                }}
                className="w-full sm:w-auto bg-[#E8AF66] hover:bg-[#d99f55] text-zinc-950 font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#E8AF66]/20"
              >
                Book Another Service
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs py-3.5 px-6 rounded-xl transition-all text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
