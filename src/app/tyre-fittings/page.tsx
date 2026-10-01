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
  TYRE_EMERGENCY_SERVICE_ID,
  TYRE_REPLACEMENT_SERVICE_ID,
  DEFAULT_PROVIDER_ID,
} from "@/lib/service/tyre-assistance.api";
import { triggerDevicePushNotification } from "@/lib/firebase";
import { TyreCategoryStep } from "@/components/tyre-assistance/TyreCategoryStep";
import { AssistanceTypeStep } from "@/components/tyre-assistance/AssistanceTypeStep";
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
  | "assistance_type"
  | "schedule_location"
  | "provider_quote"
  | "technician_assigning"
  | "booking_confirmed";

const STEP_LABELS: { key: WorkflowStep; label: string; stepNumber: number }[] = [
  { key: "category", label: "Category", stepNumber: 1 },
  { key: "assistance_type", label: "Assistance Type", stepNumber: 2 },
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

    // Restore active booking from localStorage if in-progress
    const existing = getActiveBooking();
    if (existing) {
      if (existing.status === "confirmed" || existing.status === "cancelled") {
        // Order completed, start clean and fresh
        setActiveBookingId(null);
        setCurrentBooking(null);
        setCurrentStep("category");
        if (typeof window !== "undefined") {
          localStorage.removeItem("mmc_active_tyre_booking_id");
        }
      } else {
        setCurrentBooking(existing);
        setSelectedCategory(existing.category);
        setSelectedAssistanceType(existing.assistanceType);

        if (existing.status === "assigning_technician") {
          setCurrentStep("technician_assigning");
        } else if (existing.status === "quote_ready") {
          setCurrentStep("provider_quote");
        }
      }
    }
  }, []);

  // Compute live quote preview for right sidebar
  const liveQuotePreview = React.useMemo(() => {
    if (currentBooking) return currentBooking.quote;
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
    return calculateQuote(
      selectedCategory,
      selectedAssistanceType,
      "mobile_repair",
      "205/55 R16",
      "Michelin Primacy",
      1
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
    setCurrentStep("assistance_type");
  };

  // 2. Step 2: Assistance Type Continue Handler
  const handleContinueAssistanceType = () => {
    setCurrentStep("schedule_location");
  };

  // 3. Step 3: Submit Assistance Request Handler
  const handleSubmitScheduleAndLocation = async (details: {
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
      selectedTyreId: details.selectedTyreId,
      selectedTyrePrice: details.selectedTyrePrice,
      situation: details.situation,
      notes: details.notes,
      acceptedPrivacy: details.acceptedPrivacy,
      providerId: (details as any).providerId || DEFAULT_PROVIDER_ID,
    });

    setCurrentBooking(booking);
    setCurrentStep("provider_quote");
  };

  // 4. Step 4: Confirm Quote & Start Technician Assignment with Stripe Payment
  const handleConfirmQuote = async (options?: { isPartial?: boolean }) => {
    if (!currentBooking) return;
    try {
      const isPartial = options?.isPartial ?? true;
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/backend/booking-success";

      const numericFare = Number(currentBooking.quote?.fareAmount || 0);
      const depositVal = (numericFare * 0.25).toFixed(2);

      const updated = await confirmQuoteAndAssignTechnician(currentBooking.id, {
        is_partial: isPartial ? 1 : 0,
        payment_method: "stripe",
        payment_platform: "app",
        callback: "https://mmcclub.co.uk/backend/api/v1/digital-payment-booking-response",
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
            is_partial: isPartial ? 1 : 0,
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
        providerName: currentBooking.provider?.name || "MMC Tyre Specialist",
        providerPhone: currentBooking.provider?.phone,
        totalAmount: numericFare,
        isPaid: false,
        paymentStatus: isPartial ? "Partial Deposit" : "Pending Payment",
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

      const isUuidStr = (str: any): boolean =>
        typeof str === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

      let targetPaymentUrl =
        updated?.redirect_link ||
        (updated as any)?.content?.url ||
        (updated as any)?.content?.redirect_link ||
        (updated as any)?.content?.redirect_url ||
        (updated as any)?.content?.payment_url;

      const content = (updated as any)?.content;
      const possibleUuid =
        (content && isUuidStr(content.payment_id) ? content.payment_id : null) ||
        (content && Array.isArray(content.booking_id) && isUuidStr(content.booking_id[0]) ? content.booking_id[0] : null) ||
        (content && isUuidStr(content.booking_id) ? content.booking_id : null) ||
        (content && isUuidStr(content.id) ? content.id : null) ||
        (isUuidStr(updated?.id) ? updated.id : null);

      if (!targetPaymentUrl && possibleUuid) {
        targetPaymentUrl = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(
          String(possibleUuid)
        )}&is_partial=${isPartial ? 1 : 0}`;
      }

      // ONLY redirect if we have a valid Stripe URL and it does NOT contain MMC-TYR-
      if (
        typeof targetPaymentUrl === "string" &&
        targetPaymentUrl.startsWith("http") &&
        !targetPaymentUrl.includes("payment_id=MMC-")
      ) {
        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = targetPaymentUrl;
        return;
      }

      // If no valid Stripe UUID or redirect link, NEVER send MMC-TYR-xxx to Demandium Stripe gateway!
      // Proceed directly to technician assignment / confirmation in the app!
      console.warn("No Stripe redirect URL returned, proceeding with booking confirmation");
      await handleTechnicianAssigned();
      return;
    } catch (err: any) {
      console.warn("Tyre booking error:", err);
      // NEVER redirect to payment/stripe/pay with MMC-TYR-...
      await handleTechnicianAssigned();
      return;
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
        ? "MMC Emergency Tyre Dispatched! 🚨"
        : "MMC Tyre Booking Confirmed! 🛞";
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

      <div className="relative z-10 max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
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
              MMC
            </span>
            <span className="text-xs text-white/70 font-medium">
              Roadside Tyre Assistance & Mobile Fitting
            </span>
          </div>

          {/* Right Helpline */}
          <div className="flex items-center space-x-3">
            <a
              href="tel:+448001234567"
              className="text-xs text-white/80 hover:text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 transition"
            >
              <Phone size={12} className="text-[#FAD293]" />
              <span>24/7 Helpline</span>
            </a>
          </div>
        </div>

        {/* Desktop Multi-Step Progress Stepper */}
        <div className="hidden lg:block p-4 rounded-3xl bg-[#141210] border border-white/10 shadow-lg">
          <div className="grid grid-cols-6 gap-2">
            {STEP_LABELS.map((step) => {
              const isDone = currentStepObj.stepNumber > step.stepNumber;
              const isCurrent = currentStepObj.stepNumber === step.stepNumber;
              const isAccessible = step.stepNumber <= maxStepReached;

              return (
                <button
                  type="button"
                  key={step.key}
                  disabled={!isAccessible}
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.key);
                    }
                  }}
                  className={`p-2.5 rounded-2xl flex items-center space-x-2.5 transition-all text-left w-full ${isCurrent
                    ? "bg-[#FAD293]/15 border border-[#FAD293] text-[#FAD293]"
                    : isAccessible
                      ? "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-[#FAD293]/50 cursor-pointer"
                      : "text-white/30 border border-transparent cursor-not-allowed"
                    }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCurrent
                      ? "bg-[#FAD293] text-black"
                      : isDone
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/40"
                      }`}
                  >
                    {isDone ? "✓" : step.stepNumber}
                  </div>
                  <span className="text-xs font-semibold truncate">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Multi-Step Progress Stepper */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STEP_LABELS.map((step) => {
            const isDone = currentStepObj.stepNumber > step.stepNumber;
            const isCurrent = currentStepObj.stepNumber === step.stepNumber;
            const isAccessible = step.stepNumber <= maxStepReached;

            return (
              <button
                type="button"
                key={step.key}
                disabled={!isAccessible}
                onClick={() => isAccessible && setCurrentStep(step.key)}
                className={`px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition ${
                  isCurrent
                    ? "bg-[#FAD293] text-black font-bold"
                    : isAccessible
                    ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <span>{isDone ? "✓" : step.stepNumber}</span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Responsive Grid (Desktop 2-Column Layout, Mobile Focused View) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Main Active Step) */}
          <div className="lg:col-span-8 w-full max-w-2xl lg:max-w-none mx-auto">
            {currentStep === "category" && (
              <TyreCategoryStep
                onSelectCategory={handleSelectCategory}
                onBack={() => router.push("/services")}
              />
            )}

            {currentStep === "assistance_type" && (
              <AssistanceTypeStep
                selectedType={selectedAssistanceType}
                onSelectType={setSelectedAssistanceType}
                onContinue={handleContinueAssistanceType}
                onBack={() => setCurrentStep("category")}
              />
            )}

            {currentStep === "schedule_location" && (
              <ScheduleLocationStep
                category={selectedCategory}
                assistanceType={selectedAssistanceType}
                onSubmit={handleSubmitScheduleAndLocation}
                onBack={() => setCurrentStep("assistance_type")}
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

          {/* Right Column (Desktop Live Order Summary & Assistance Hub) */}
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
                    {selectedCategory}
                  </span>
                </div>

                <div className="flex justify-between items-center text-white/70">
                  <span>Assistance Type:</span>
                  <span className="font-bold text-[#FAD293] capitalize">
                    {selectedAssistanceType === "recovery_truck"
                      ? "Recovery Truck"
                      : "Mobile Tyre Fitting"}
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
                  <span>£{liveQuotePreview.tyrePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Labour & Fitting</span>
                  <span>£{liveQuotePreview.labourPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Call-Out Fee</span>
                  <span>£{liveQuotePreview.callOutFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 my-1 pt-1.5 flex justify-between font-bold text-sm text-[#FAD293]">
                  <span>Total Estimated Fare</span>
                  <span>£{liveQuotePreview.fareAmount.toFixed(2)}</span>
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
                    {currentBooking?.provider?.name || "MMC Certified Provider"}
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
