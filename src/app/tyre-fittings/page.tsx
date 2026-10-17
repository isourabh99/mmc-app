"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
  Clock,
  Sparkles,
  ChevronRight,
  Disc,
  Receipt,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import {
  TyreCategory,
  AssistanceType,
  ServiceLocationType,
  TyreAssistanceBooking,
  calculateQuote,
} from "@/lib/data/tyre-assistance.data";
import {
  createAssistanceRequest,
  confirmQuoteAndAssignTechnician,
  assignTechnicianToBooking,
  getActiveBooking,
  setActiveBookingId,
  cancelBooking,
  getZoneIdFromCoordinates,
  TYRE_CATEGORY_ID,
  TYRE_EMERGENCY_SERVICE_ID,
  TYRE_REPLACEMENT_SERVICE_ID,
  DEFAULT_PROVIDER_ID,
  DEFAULT_ZONE_ID,
  isUuid,
  BackendTyreItem,
  addTyreToCart,
  sendBookingRequestToBackend,
  formatValidServiceSchedule,
  getEffectiveCustomerAddressId,
} from "@/lib/service/tyre-assistance.api";
import { getBackendRootUrl } from "@/lib/http/apiClient";
import { triggerDevicePushNotification } from "@/lib/firebase";
import { TyreCategoryStep } from "@/components/tyre-assistance/TyreCategoryStep";
import { TyreReplacementSelectionStep } from "@/components/tyre-assistance/TyreReplacementSelectionStep";
import { EmergencyProviderSelectionStep } from "@/components/tyre-assistance/EmergencyProviderSelectionStep";
import { ScheduleLocationStep } from "@/components/tyre-assistance/ScheduleLocationStep";
import { ProviderQuoteStep } from "@/components/tyre-assistance/ProviderQuoteStep";
import { TechnicianAssigningStep } from "@/components/tyre-assistance/TechnicianAssigningStep";
import { BookingConfirmedStep } from "@/components/tyre-assistance/BookingConfirmedStep";
import { TyreBookingDetailsModal } from "@/components/tyre-assistance/TyreBookingDetailsModal";
import { isAuthenticated } from "@/lib/auth.api";
import { useToast } from "@/components/ToastProvider";
import { saveBookingMeta, saveConfirmedBooking } from "@/lib/service/bookings.api";

type WorkflowStep =
  | "category"
  | "emergency_flow"
  | "replacement_tyres"
  | "schedule_location"
  | "provider_quote"
  | "technician_assigning"
  | "booking_confirmed";

const STEP_LABELS: { key: WorkflowStep; label: string; stepNumber: number }[] = [
  { key: "category", label: "Category", stepNumber: 1 },
  { key: "emergency_flow", label: "Emergency Assist", stepNumber: 2 },
  { key: "replacement_tyres", label: "Tyre Selection", stepNumber: 2 },
  { key: "schedule_location", label: "Schedule & Location", stepNumber: 3 },
  { key: "provider_quote", label: "Provider & Quote", stepNumber: 4 },
  { key: "technician_assigning", label: "Dispatching", stepNumber: 5 },
  { key: "booking_confirmed", label: "Confirmed", stepNumber: 6 },
];

export default function TyreAssistancePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Workflow State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("category");
  const [selectedCategory, setSelectedCategory] =
    useState<TyreCategory>("emergency");
  const [selectedAssistanceType, setSelectedAssistanceType] =
    useState<AssistanceType>("mobile_tyre");
  const [selectedTyre, setSelectedTyre] = useState<BackendTyreItem | null>(null);

  // Zone ID state from GPS
  const [activeZoneId, setActiveZoneId] = useState<string>("");

  // Active Booking
  const [currentBooking, setCurrentBooking] =
    useState<TyreAssistanceBooking | null>(null);

  // In-app Floating Notification Popup
  const [bookingNotificationPopup, setBookingNotificationPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Booking Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Auto-dismiss in-app notification popup
  useEffect(() => {
    if (bookingNotificationPopup.isOpen) {
      const timer = setTimeout(() => {
        setBookingNotificationPopup((prev) => ({ ...prev, isOpen: false }));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [bookingNotificationPopup.isOpen]);

  // 1. Initial Zone GPS Detection & Booking Restore
  useEffect(() => {
    // Detect Zone ID from browser GPS or default London coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getZoneIdFromCoordinates(pos.coords.latitude, pos.coords.longitude).then(
            (id) => setActiveZoneId(id)
          );
        },
        () => {
          getZoneIdFromCoordinates(51.5074, -0.1278).then((id) =>
            setActiveZoneId(id)
          );
        }
      );
    } else {
      getZoneIdFromCoordinates(51.5074, -0.1278).then((id) =>
        setActiveZoneId(id)
      );
    }

    // Check if user explicitly came with resume query (?resume=true or ?booking_id=...)
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const shouldResume =
      urlParams?.get("resume") === "true" ||
      Boolean(urlParams?.get("booking_id"));

    if (shouldResume) {
      const existing = getActiveBooking();
      if (
        existing &&
        existing.status !== "confirmed" &&
        existing.status !== "cancelled"
      ) {
        setCurrentBooking(existing);
        setSelectedCategory(existing.category);
        setSelectedAssistanceType(existing.assistanceType);

        if (existing.status === "assigning_technician") {
          setCurrentStep("technician_assigning");
        } else if (existing.status === "quote_ready") {
          setCurrentStep("provider_quote");
        }
        return;
      }
    }

    // Default: Always start clean and fresh from Step 1 (Category selection)
    setActiveBookingId(null);
    setCurrentBooking(null);
    setCurrentStep("category");
    setMaxStepReached(1);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mmc_active_tyre_booking_id");
    }
  }, []);

  // Compute live quote preview for right sidebar
  const liveQuotePreview = React.useMemo(() => {
    if (currentBooking?.quote && typeof currentBooking.quote.fareAmount === "number") {
      return currentBooking.quote;
    }
    if (selectedCategory === "emergency") {
      const callOut = selectedAssistanceType === "recovery_truck" ? 45 : 10;
      const fareAmount = 50 + callOut;
      return {
        tyreDescription: "Tyre Emergency Service (Roadside Rescue)",
        tyrePrice: 50,
        labourPrice: 0,
        callOutFee: callOut,
        discount: 0,
        vatAmount: Math.round(fareAmount * 0.2),
        fareAmount,
      };
    }
    return (
      calculateQuote(
        selectedCategory,
        selectedAssistanceType,
        "mobile_repair",
        "205/55 R16",
        "Michelin Primacy",
        1
      ) || {
        tyreDescription: "Tyre Service",
        tyrePrice: 50,
        labourPrice: 20,
        callOutFee: 10,
        discount: 0,
        vatAmount: 16,
        fareAmount: 80,
      }
    );
  }, [currentBooking, selectedCategory, selectedAssistanceType]);

  // Current step index
  const currentStepObj =
    STEP_LABELS.find((s) => s.key === currentStep) || STEP_LABELS[0];

  // Track highest step reached so user can freely click back to any completed step (e.g. Step 1)
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  useEffect(() => {
    if (currentStepObj.stepNumber > maxStepReached) {
      setMaxStepReached(currentStepObj.stepNumber);
    }
  }, [currentStepObj.stepNumber, maxStepReached]);

  // 1. Step 1: Category Selection Handler
  const handleSelectCategory = (category: TyreCategory) => {
    setSelectedCategory(category);
    if (category === "emergency") {
      setCurrentStep("emergency_flow");
    } else if (category === "replacement") {
      setCurrentStep("replacement_tyres");
    } else {
      setCurrentStep("schedule_location");
    }
  };

  // Step 2 (Replacement): Tyre Selection Handler
  const handleSelectTyre = (tyre: BackendTyreItem) => {
    setSelectedTyre(tyre);
    setCurrentStep("schedule_location");
  };

  // 2. Step 3: Submit Assistance Request Handler
  const handleSubmitScheduleAndLocation = async (details: {
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
    isPartial?: number;
  }) => {
    if (!isAuthenticated()) {
      showToast("Please login to submit tyre assistance request.", "info");
      router.push("/login");
      return;
    }

    const booking = await createAssistanceRequest({
      category: selectedCategory,
      assistanceType: selectedAssistanceType,
      serviceLocationType: details.serviceLocationType,
      scheduledDate: details.scheduledDate,
      scheduledTimeSlot: details.scheduledTimeSlot,
      selectedSlotId: details.selectedSlotId,
      locationAddress: details.locationAddress,
      locationPostcode: details.locationPostcode,
      latitude: details.latitude,
      longitude: details.longitude,
      vehicleMakeModel: details.vehicleMakeModel,
      vehicleRegistration: details.vehicleRegistration,
      variantKey: details.variantKey,
      serviceId: details.serviceId,
      tyreSize: details.tyreSize,
      tyreQuantity: details.tyreQuantity,
      selectedTyreId: details.selectedTyreId || selectedTyre?.id,
      selectedTyrePrice: details.selectedTyrePrice || selectedTyre?.price,
      situation: details.situation,
      notes: details.notes,
      acceptedPrivacy: details.acceptedPrivacy,
      providerId: details.providerId || selectedTyre?.provider_id || DEFAULT_PROVIDER_ID,
    });

    setCurrentBooking(booking);

    // Direct Stripe Checkout Flow (1 for Deposit, 0 for Online Full)
    try {
      const isPartialNum = details.isPartial !== undefined ? details.isPartial : 0;
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/booking-success";

      const numericFare = Number(booking.quote?.fareAmount || 0);
      const depositVal = isPartialNum === 1 ? (numericFare * 0.25).toFixed(2) : numericFare.toFixed(2);
      const dueVal = isPartialNum === 1 ? (numericFare * 0.75).toFixed(2) : "0.00";

      const updated = await confirmQuoteAndAssignTechnician(booking.id, {
        is_partial: isPartialNum,
        payment_method: "stripe",
        payment_platform: "app",
        callback: callbackUrl,
      });

      const confirmedRefId =
        updated?.referenceNumber ||
        updated?.id ||
        (updated as any)?.content?.booking_id ||
        (updated as any)?.content?.id ||
        booking.referenceNumber ||
        booking.id;

      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: confirmedRefId,
            readable_id: confirmedRefId,
            provider: {
              company_name: booking.provider?.name || "Mobile Tyre Specialist",
              company_phone: "+44 20 7946 0912",
            },
            schedule: `${booking.scheduledDate || "Today"} ${booking.scheduledTimeSlot || "ASAP"}`,
            price: numericFare,
            is_partial: isPartialNum,
            deposit_amount: depositVal,
            service_name: `Tyre Fitting: ${booking.vehicleMakeModel || "Vehicle"} (${booking.category === "emergency" ? "Emergency" : "Replacement"})`,
          })
        );
      } catch { }

      saveBookingMeta(confirmedRefId, {
        serviceTitle: `Tyre Fitting: ${booking.vehicleMakeModel || "Vehicle"}`,
        serviceCategoryName: "Tyre Assistance",
        serviceType: "tyre",
        vehicleModel: booking.vehicleMakeModel,
        vehicleReg: booking.vehicleRegistration,
        providerName: booking.provider?.name,
        price: numericFare,
        isPaid: isPartialNum === 0,
        isPartiallyPaid: isPartialNum === 1,
        paidAmount: Number(depositVal),
        dueAmount: Number(dueVal),
      });

      let targetPaymentUrl =
        updated?.redirect_link ||
        (updated as any)?.content?.redirect_link ||
        (updated as any)?.content?.url ||
        (updated as any)?.content?.redirect_url ||
        (updated as any)?.content?.payment_url;

      if (typeof targetPaymentUrl === "string") {
        targetPaymentUrl = targetPaymentUrl.replace(/\\\//g, "/");
      }


      if (targetPaymentUrl && typeof targetPaymentUrl === "string") {
        targetPaymentUrl = targetPaymentUrl.replace(/\\\//g, "/");
        if (!targetPaymentUrl.startsWith("http")) {
          targetPaymentUrl = `${getBackendRootUrl()}${targetPaymentUrl.startsWith("/") ? "" : "/"}${targetPaymentUrl}`;
        }
        if (!targetPaymentUrl.includes("callback=")) {
          const sep = targetPaymentUrl.includes("?") ? "&" : "?";
          targetPaymentUrl = `${targetPaymentUrl}${sep}callback=${encodeURIComponent(callbackUrl)}`;
        }
        if (!targetPaymentUrl.includes("is_partial=")) {
          targetPaymentUrl = `${targetPaymentUrl}&is_partial=${isPartialNum}`;
        }

        console.log("[StripeRedirect] Navigating to Stripe Payment:", targetPaymentUrl);
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = targetPaymentUrl;
        return;
      }

      showToast("Booking confirmed! Dispatching nearest technician...", "success");
      setCurrentBooking(updated || booking);
      setCurrentStep("technician_assigning");
    } catch (paymentErr: any) {
      console.warn("Direct stripe redirect error:", paymentErr);
      showToast(paymentErr?.message || "Failed to initiate payment. Please try again.", "error");
    }
  };

  // 4. Step 4: Confirm Quote & Start Technician Assignment with Stripe Payment
  const handleConfirmQuote = async (options?: { isPartial?: boolean }) => {
    if (!currentBooking) return;
    try {
      const isPartialParam = options?.isPartial === false ? false : true;
      const isPartialNum = isPartialParam ? 1 : 0;
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/booking-success";

      const numericFare = Number(currentBooking.quote?.fareAmount || 0);
      const depositVal = isPartialNum === 1 ? (numericFare * 0.25).toFixed(2) : numericFare.toFixed(2);

      const updated = await confirmQuoteAndAssignTechnician(currentBooking.id, {
        is_partial: isPartialNum,
        payment_method: "stripe",
        payment_platform: "app",
        callback: callbackUrl,
      });

      const confirmedRefId =
        updated?.referenceNumber ||
        updated?.id ||
        currentBooking.referenceNumber ||
        currentBooking.id;

      // Save pending booking to sessionStorage so booking-success receives it
      try {
        sessionStorage.setItem(
          "mmc_pending_booking",
          JSON.stringify({
            booking_id: confirmedRefId,
            readable_id: confirmedRefId,
            provider: {
              company_name: currentBooking.provider?.name || "Mobile Tyre Specialist",
              company_phone: "+44 20 7946 0912",
            },
            schedule: `${currentBooking.scheduledDate || "Today"} ${currentBooking.scheduledTimeSlot || "ASAP"}`,
            price: numericFare,
            is_partial: isPartialNum,
            deposit_amount: depositVal,
            service_name: `Tyre Fitting: ${currentBooking.vehicleMakeModel || "Vehicle"} (${currentBooking.category === "emergency" ? "Emergency" : "Replacement"})`,
          })
        );
      } catch { }

      saveBookingMeta(confirmedRefId, {
        serviceTitle: `Tyre Fitting: ${currentBooking.vehicleMakeModel || "Vehicle"}`,
        serviceCategoryName: "Tyre Assistance",
        serviceType: "tyre",
        vehicleModel: currentBooking.vehicleMakeModel,
        vehicleReg: currentBooking.vehicleRegistration,
        providerName: currentBooking.provider?.name,
        price: numericFare,
      });

      saveConfirmedBooking({
        id: confirmedRefId,
        rawId: confirmedRefId,
        readableId: confirmedRefId,
        serviceType: "tyre",
        serviceTitle: `Tyre Fitting: ${currentBooking.vehicleMakeModel || "Vehicle"} (${currentBooking.category === "emergency" ? "Emergency" : "Replacement"})`,
        serviceCategoryName: "Tyre Assistance",
        providerName: currentBooking.provider?.name || "Motor Market Club Tyre Specialist",
        providerPhone: currentBooking.provider?.phone,
        totalAmount: numericFare,
        isPaid: false,
        paymentStatus: isPartialNum === 1 ? "Partial Deposit" : "Full Online Payment",
        paymentMethod: "Stripe (Online)",
        status: "accepted",
        statusDisplay: "Accepted",
        scheduleDate: currentBooking.scheduledDate || new Date().toISOString().split("T")[0],
        scheduleTime: currentBooking.scheduledTimeSlot || "ASAP",
        fullScheduleDisplay: `${currentBooking.scheduledDate || "Today"} ${currentBooking.scheduledTimeSlot || "ASAP"}`,
        vehicleModel: currentBooking.vehicleMakeModel,
        vehicleReg: currentBooking.vehicleRegistration,
        createdAt: new Date().toISOString(),
      });

      let targetPaymentUrl =
        updated?.redirect_link ||
        (updated as any)?.content?.redirect_link ||
        (updated as any)?.content?.url ||
        (updated as any)?.content?.redirect_url ||
        (updated as any)?.content?.payment_url;


      if (
        targetPaymentUrl &&
        typeof targetPaymentUrl === "string" &&
        !targetPaymentUrl.includes("payment_id=MMC-")
      ) {
        if (!targetPaymentUrl.startsWith("http")) {
          targetPaymentUrl = `${getBackendRootUrl()}${targetPaymentUrl.startsWith("/") ? "" : "/"}${targetPaymentUrl}`;
        }
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = targetPaymentUrl;
        return;
      }

      showToast("Booking confirmed! Dispatching nearest technician...", "success");
      setCurrentBooking(updated || currentBooking);
      setCurrentStep("technician_assigning");
    } catch (err: any) {
      console.warn("Tyre booking error:", err);
      showToast(err?.message || "Payment initialization failed. Please try again.", "error");
    }
  };


  // 5. Step 5: Technician Auto-Assignment Complete Callback
  const handleTechnicianAssigned = useCallback(async () => {
    if (!currentBooking) return;
    try {
      const assigned = await assignTechnicianToBooking(currentBooking.id);
      setCurrentBooking(assigned);
      setCurrentStep("booking_confirmed");

      // Trigger Push Notification & In-App Notification Toast
      const rawRef = assigned.referenceNumber || assigned.id;
      const refNum = (typeof window !== "undefined" && rawRef.startsWith("MMC-TYR-") && localStorage.getItem("last_tyre_booking_id"))
        ? localStorage.getItem("last_tyre_booking_id")
        : rawRef.replace(/^#/, "");
      const isEmergency = assigned.category === "emergency";
      const notifTitle = isEmergency
        ? "Motor Market Club Emergency Tyre Dispatched! 🚨"
        : "Motor Market Club Tyre Booking Confirmed! 🛞";
      const notifBody = `Booking #${refNum} (${isEmergency ? "Emergency Service" : "Tyre Replacement"}) is confirmed! Technician assigned.`;

      triggerDevicePushNotification(notifTitle, notifBody);

      setBookingNotificationPopup({
        isOpen: true,
        title: notifTitle,
        message: notifBody,
      });
    } catch (err) {
      console.error("Assignment error:", err);
      setCurrentStep("booking_confirmed");
    }
  }, [currentBooking]);

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    const cancelled = await cancelBooking(bookingId, "Cancelled by user");
    setCurrentBooking(cancelled);
    setActiveBookingId(null);
  };

  // Reset flow to start fresh
  const handleStartFresh = () => {
    setActiveBookingId(null);
    setCurrentBooking(null);
    setSelectedCategory("emergency");
    setSelectedAssistanceType("mobile_tyre");
    setMaxStepReached(1);
    setCurrentStep("category");
    if (typeof window !== "undefined") {
      localStorage.removeItem("mmc_active_tyre_booking_id");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#FAD293] selection:text-black relative overflow-x-hidden pb-16">
      {/* Luxury Ambient Glow Background */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[160px] opacity-15 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, #FAD293 0%, #CEA46B 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] pt-4 sm:pt-6 space-y-6">
        {/* Desktop Top Navigation & Zone Detection Banner */}
        <div className="hidden lg:flex items-center justify-between pb-4 border-b border-white/10">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/services" className="hover:text-white transition">
              Services
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#FAD293] font-semibold">Tyre Assistance</span>
          </div>

          {/* Center Title / Branding */}
          <div className="flex items-center space-x-3">
            <span
              className="text-xl font-black tracking-widest leading-none"
              style={{
                background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Motor Market Club
            </span>
            <span className="text-xs text-white/70 font-medium">
              Roadside Tyre Assistance & Mobile Fitting
            </span>
          </div>

          {/* Right Actions & Helpline */}
          <div className="flex items-center space-x-2.5">
            {currentStep !== "category" && (
              <button
                type="button"
                onClick={() => {
                  setActiveBookingId(null);
                  setCurrentBooking(null);
                  setCurrentStep("category");
                  setMaxStepReached(1);
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("mmc_active_tyre_booking_id");
                  }
                }}
                className="text-xs text-[#FAD293] hover:text-white bg-[#FAD293]/10 hover:bg-[#FAD293]/20 border border-[#FAD293]/30 px-3 py-1 rounded-full flex items-center gap-1.5 transition cursor-pointer font-bold"
              >
                <span>↺ Start Over</span>
              </button>
            )}
            <a
              href="tel:+448001234567"
              className="text-xs text-white/80 hover:text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 transition"
            >
              <Phone size={12} className="text-[#FAD293]" />
              <span>24/7 Helpline</span>
            </a>
          </div>
        </div>

        {/* Main Content Responsive Grid (Desktop 2-Column Layout, Immersive Full Width for Flows) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Active Step Column */}
          <div
            className={`w-full mx-auto ${currentStep === "emergency_flow" ||
                currentStep === "replacement_tyres" ||
                currentStep === "schedule_location"
                ? "lg:col-span-12"
                : "lg:col-span-8 max-w-2xl lg:max-w-none"
              }`}
          >
            {currentStep === "category" && (
              <TyreCategoryStep
                onSelectCategory={handleSelectCategory}
                onBack={() => router.push("/services")}
              />
            )}

            {currentStep === "emergency_flow" && (
              <EmergencyProviderSelectionStep
                onBack={() => setCurrentStep("category")}
                onBookingComplete={(booking) => {
                  if (booking) {
                    const normalized: TyreAssistanceBooking = {
                      id: booking.id || String((booking as any).content?.booking_id?.[0] || (booking as any).booking_id || `MMC-EMG-${Date.now()}`),
                      referenceNumber: booking.referenceNumber || String((booking as any).content?.readable_id || (booking as any).readable_id || (booking as any).content?.booking_id?.[0] || `MMC-EMG-${Date.now()}`),
                      category: "emergency",
                      categoryLabel: "Tyre Emergency",
                      assistanceType: booking.assistanceType || selectedAssistanceType,
                      assistanceLabel: booking.assistanceLabel || "Mobile Tyre Fitting",
                      serviceLocationType: "mobile_repair",
                      serviceLocationLabel: "Mobile Repair (At Location)",
                      scheduledDate: booking.scheduledDate || "Today",
                      scheduledTimeSlot: booking.scheduledTimeSlot || "Immediate Dispatch",
                      formattedDateTime: booking.formattedDateTime || "Today, Immediate Dispatch",
                      locationAddress: booking.locationAddress || "London, UK",
                      vehicleMakeModel: booking.vehicleMakeModel || "Vehicle",
                      vehicleRegistration: booking.vehicleRegistration || "UK22-XYZ-9999",
                      tyreSize: booking.tyreSize || "Standard",
                      tyreQuantity: booking.tyreQuantity || 1,
                      provider: booking.provider || {
                        id: DEFAULT_PROVIDER_ID,
                        name: "Motor Market Club Mobile Tyres London",
                        companyName: "Motor Market Club Mobile Tyres London",
                        rating: 4.9,
                        reviewCount: 38,
                        distanceMiles: 0,
                        address: "London, UK",
                        city: "London",
                        phone: "+44 20 7946 0912",
                        email: "dispatch@mmcclub.co.uk",
                        image: "",
                        capabilities: { inStock: true, offersRecoveryTruck: true, canComeToLocation: true },
                      },
                      quote: booking.quote || {
                        tyreDescription: "Tyre Emergency Service",
                        tyrePrice: 50,
                        labourPrice: 0,
                        callOutFee: 10,
                        discount: 0,
                        vatAmount: 12,
                        fareAmount: 60,
                      },
                      status: "confirmed",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    setCurrentBooking(normalized);
                  }
                  setCurrentStep("booking_confirmed");
                }}
              />
            )}

            {currentStep === "replacement_tyres" && (
              <TyreReplacementSelectionStep
                onSelectTyre={handleSelectTyre}
                onBack={() => setCurrentStep("category")}
              />
            )}

            {currentStep === "schedule_location" && (
              <ScheduleLocationStep
                category={selectedCategory}
                assistanceType={selectedAssistanceType}
                selectedTyre={selectedTyre}
                onSubmit={handleSubmitScheduleAndLocation}
                onBack={() => {
                  if (selectedCategory === "replacement") {
                    setCurrentStep("replacement_tyres");
                  } else {
                    setCurrentStep("category");
                  }
                }}
              />
            )}

            {currentStep === "provider_quote" && currentBooking && (
              <ProviderQuoteStep
                booking={currentBooking}
                onConfirm={handleConfirmQuote}
                onBack={() => setCurrentStep("schedule_location")}
              />
            )}

            {currentStep === "technician_assigning" && currentBooking && (
              <TechnicianAssigningStep
                booking={currentBooking}
                onAssigned={handleTechnicianAssigned}
                onBackToHome={() => router.push("/")}
                onViewBooking={() => setIsDetailsModalOpen(true)}
              />
            )}

            {currentStep === "booking_confirmed" && currentBooking && (
              <BookingConfirmedStep
                booking={currentBooking}
                onViewBooking={() => setIsDetailsModalOpen(true)}
                onBack={handleStartFresh}
              />
            )}
          </div>

          {/* Right Column (Desktop Live Order Summary & Assistance Hub for Standard Steps) */}
          {currentStep !== "emergency_flow" &&
            currentStep !== "replacement_tyres" &&
            currentStep !== "schedule_location" && (
              <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
                {/* Live Assistance Summary Card */}
                <div className="p-6 rounded-3xl bg-[#141210] border border-white/10 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Receipt size={16} className="text-[#FAD293]" />
                      Assistance Overview
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-2.5 py-0.5 rounded-full">
                      Live Status
                    </span>
                  </div>

                  {/* Service & Mode Highlights */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-white/70">
                      <span>Selected Category:</span>
                      <span className="font-bold text-white capitalize">
                        {selectedCategory === "emergency" ? "Tyre Emergency" : "Tyre Replacement"}
                      </span>
                    </div>

                    {currentBooking && (
                      <>
                        <div className="flex justify-between items-center text-white/70">
                          <span>Vehicle Reg:</span>
                          <span className="font-mono font-bold bg-[#f6be00] text-black px-1.5 py-0.5 rounded text-[10px]">
                            {currentBooking.vehicleRegistration}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-white/70">
                          <span>Location:</span>
                          <span className="font-medium text-white max-w-[160px] truncate">
                            {currentBooking.locationAddress}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quote Breakdown Preview */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Tyre Unit Price</span>
                      <span>£{Number(liveQuotePreview?.tyrePrice ?? 50).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Labour & Fitting</span>
                      <span>£{Number(liveQuotePreview?.labourPrice ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Call-Out Fee</span>
                      <span>£{Number(liveQuotePreview?.callOutFee ?? 10).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 my-1 pt-1.5 flex justify-between font-bold text-sm text-[#FAD293]">
                      <span>Total Estimated Fare</span>
                      <span>£{Number(liveQuotePreview?.fareAmount ?? 60).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Matched Certified Provider Preview */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative flex-shrink-0">
                      {currentBooking?.provider?.image ? (
                        <Image
                          src={currentBooking.provider.image}
                          alt="Provider"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-[#FAD293]">
                          <Sparkles size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {currentBooking?.provider?.name || "Motor Market Club Certified Provider"}
                      </h4>
                      <p className="text-[10px] text-white/50 truncate">
                        {currentBooking?.provider?.address || "Mobile Service at Location"}
                      </p>
                      <span className="text-[10px] text-[#FAD293] font-semibold">
                        ⭐ {currentBooking?.provider?.rating || "4.9"} Verified Partner
                      </span>
                    </div>
                  </div>

                  {/* Trust Guarantees */}
                  <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] text-white/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#FAD293]" />
                      <span>100% Genuine Certified Tyres & Warranty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#FAD293]" />
                      <span>30-45 Mins Rapid Roadside Arrival</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-[#FAD293]" />
                      <span>Fully Equipped High-Spec Mobile Vans</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Full Booking Details Modal / Drawer */}
      {currentBooking && (
        <TyreBookingDetailsModal
          booking={currentBooking}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onCancelBooking={handleCancelBooking}
        />
      )}

      {/* Floating Push & In-App Notification Toast */}
      {bookingNotificationPopup.isOpen && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#181410] border border-[#FAD293]/70 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAD293]/20 border border-[#FAD293]/40 flex items-center justify-center text-[#FAD293] flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide">
                {bookingNotificationPopup.title}
              </h4>
              <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">
                {bookingNotificationPopup.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setBookingNotificationPopup((prev) => ({ ...prev, isOpen: false }))
              }
              className="text-white/40 hover:text-white transition p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
