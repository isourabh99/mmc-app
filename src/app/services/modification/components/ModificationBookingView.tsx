"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
    Calendar,
    Clock3,
    Smartphone,
    Building2,
    Banknote,
    CreditCard,
    Check,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Wrench,
    ArrowLeft,
    ArrowRight,
    Camera,
    Upload,
    X,
    User,
    Phone,
    ShieldCheck,
    Lock,
    HelpCircle,
    ChevronRight,
} from "lucide-react";
import type {
    ProviderItem,
    PostBidItem,
    BookingSlotItem,
    BookingQuestionItem,
    CustomerQuotationPostItem,
    ModificationServiceItem,
} from "@/lib/service/modification.api";

interface ModificationBookingViewProps {
    provider: ProviderItem;
    bidOffer: PostBidItem | null;
    postItem: CustomerQuotationPostItem | null;
    postId: string;
    services?: ModificationServiceItem[];
    bookingDate: string;
    onDateChange: (date: string) => void;
    bookingTime: string;
    onTimeChange: (time: string) => void;
    selectedSlotId: string;
    onSelectSlotId: (slotId: string) => void;
    bookingSlots: BookingSlotItem[];
    loadingSlots: boolean;
    bookingType: "normal" | "emergency";
    onBookingTypeChange: (type: "normal" | "emergency") => void;
    serviceLocation: "customer" | "workshop";
    onServiceLocationChange: (loc: "customer" | "workshop") => void;
    bookingQuestions: BookingQuestionItem[];
    loadingQuestions: boolean;
    questionAnswers: Record<string, any>;
    onAnswerChange: (questionId: string, answer: any) => void;
    bookingNotes: string;
    onNotesChange: (notes: string) => void;
    bookingPaymentMethod: "cash_after_service" | "stripe";
    onPaymentMethodChange: (method: "cash_after_service" | "stripe") => void;
    bookingCarImage: File | null;
    bookingCarImagePreview: string | null;
    onCarImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveCarImage: () => void;
    submittingBooking: boolean;
    bookingConfirmed: boolean;
    bookingApiResult: any;
    bookingError: string | null;
    onSubmitBooking: () => Promise<void>;
    onBackToQuotes: () => void;
    onBackToHome: () => void;
}

export default function ModificationBookingView({
    provider,
    bidOffer,
    postItem,
    postId,
    services = [],
    bookingDate,
    onDateChange,
    bookingTime,
    onTimeChange,
    selectedSlotId,
    onSelectSlotId,
    bookingSlots,
    loadingSlots,
    bookingType,
    onBookingTypeChange,
    serviceLocation,
    onServiceLocationChange,
    bookingQuestions,
    loadingQuestions,
    questionAnswers,
    onAnswerChange,
    bookingNotes,
    onNotesChange,
    bookingPaymentMethod,
    onPaymentMethodChange,
    bookingCarImage,
    bookingCarImagePreview,
    onCarImageChange,
    onRemoveCarImage,
    submittingBooking,
    bookingConfirmed,
    bookingApiResult,
    bookingError,
    onSubmitBooking,
    onBackToQuotes,
    onBackToHome,
}: ModificationBookingViewProps) {
    // Two-step booking flow: 'schedule' (Date, Time, Location, Inquiries) -> 'payment' (Dedicated Checkout Screen)
    const [bookingSubStep, setBookingSubStep] = useState<"schedule" | "payment">("schedule");
    const [stepValidationErr, setStepValidationErr] = useState<string | null>(null);

    // Question image upload previews cache for question_type === "image"
    const [questionImagePreviews, setQuestionImagePreviews] = useState<Record<string, string>>({});

    // Check if question is required by admin (strictly check API values)
    const checkIsRequired = (q: BookingQuestionItem): boolean => {
        return Boolean(
            q.is_required === 1 ||
            q.is_required === "1" ||
            q.is_required === true ||
            String(q.is_required).toLowerCase() === "true" ||
            (q as any).required === 1 ||
            (q as any).required === "1" ||
            (q as any).required === true ||
            String((q as any).required).toLowerCase() === "true"
        );
    };

    // Determine available service location options based on backend API data:
    // e.g. "mobile" / "customer" -> only Mobile Van Service
    //      "workshop" -> only Workshop Bay
    //      "both" / "all" -> both
    const availableLocations = useMemo<Array<"workshop" | "customer">>(() => {
        const rawLocations: string[] = [];

        // 1. Check provider properties
        const p = provider as any;
        if (p?.delivery_type) rawLocations.push(String(p.delivery_type));
        if (p?.service_location) rawLocations.push(String(p.service_location));
        if (p?.location_type) rawLocations.push(String(p.location_type));
        if (p?.location) rawLocations.push(String(p.location));
        if (p?.service_type) rawLocations.push(String(p.service_type));
        if (Array.isArray(p?.delivery_types)) p.delivery_types.forEach((l: any) => rawLocations.push(String(l)));
        if (Array.isArray(p?.service_locations)) p.service_locations.forEach((l: any) => rawLocations.push(String(l)));

        // 2. Check provider.selected_services
        if (Array.isArray(p?.selected_services)) {
            p.selected_services.forEach((s: any) => {
                if (s?.delivery_type) rawLocations.push(String(s.delivery_type));
                if (s?.service_location) rawLocations.push(String(s.service_location));
                if (s?.location_type) rawLocations.push(String(s.location_type));
                if (s?.location) rawLocations.push(String(s.location));
            });
        }

        // 3. Check postItem properties
        const pi = postItem as any;
        if (pi?.delivery_type) rawLocations.push(String(pi.delivery_type));
        if (pi?.service_location) rawLocations.push(String(pi.service_location));
        if (pi?.location_type) rawLocations.push(String(pi.location_type));
        if (pi?.location) rawLocations.push(String(pi.location));

        // 4. Check bidOffer properties
        const bo = bidOffer as any;
        if (bo?.delivery_type) rawLocations.push(String(bo.delivery_type));
        if (bo?.service_location) rawLocations.push(String(bo.service_location));
        if (bo?.location) rawLocations.push(String(bo.location));

        // 5. Check if passed services prop has matching service
        if (Array.isArray(services)) {
            const matched = services.find(
                (s) =>
                    s.id === pi?.service_id ||
                    s.name === pi?.service_description ||
                    s.id === p?.selected_services?.[0]?.service_id ||
                    s.name === p?.selected_services?.[0]?.service_name
            ) as any;
            if (matched) {
                if (matched.delivery_type) rawLocations.push(String(matched.delivery_type));
                if (matched.service_location) rawLocations.push(String(matched.service_location));
                if (matched.location_type) rawLocations.push(String(matched.location_type));
                if (matched.location) rawLocations.push(String(matched.location));
            }
        }

        const normalized = rawLocations.map((l) => l.toLowerCase().trim()).filter(Boolean);

        const hasMobile = normalized.some(
            (l) =>
                l === "mobile" ||
                l.includes("mobile") ||
                l === "customer" ||
                l.includes("customer") ||
                l.includes("doorstep") ||
                l.includes("van") ||
                l.includes("home") ||
                l === "both" ||
                l === "all"
        );
        const hasWorkshop = normalized.some(
            (l) =>
                l === "workshop" ||
                l.includes("workshop") ||
                l.includes("garage") ||
                l.includes("bay") ||
                l.includes("store") ||
                l.includes("centre") ||
                l === "both" ||
                l === "all"
        );

        if (hasMobile && !hasWorkshop) {
            return ["customer"];
        }
        if (hasWorkshop && !hasMobile) {
            return ["workshop"];
        }
        if (hasMobile && hasWorkshop) {
            return ["customer", "workshop"];
        }

        // If no explicit location found from API, default to both with customer first
        return ["customer", "workshop"];
    }, [provider, postItem, bidOffer, services]);

    // Keep serviceLocation aligned with availableLocations from API
    useEffect(() => {
        if (availableLocations.length === 1) {
            if (serviceLocation !== availableLocations[0]) {
                onServiceLocationChange(availableLocations[0]);
            }
        } else if (availableLocations.length > 0 && !availableLocations.includes(serviceLocation)) {
            onServiceLocationChange(availableLocations[0]);
        }
    }, [availableLocations, serviceLocation, onServiceLocationChange]);

    const priceFormatted = bidOffer?.offered_price
        ? typeof bidOffer.offered_price === "number"
            ? `£${bidOffer.offered_price.toFixed(2)}`
            : String(bidOffer.offered_price).startsWith("£")
            ? bidOffer.offered_price
            : `£${bidOffer.offered_price}`
        : provider.total_selected_services_price
        ? `£${provider.total_selected_services_price.toFixed(2)}`
        : "Quote Accepted";

    // Parse options list from API if provided in any format (array, JSON string, or comma-separated)
    const getOptionsList = (options: any): string[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options
                .map((opt) => {
                    if (typeof opt === "string") return opt;
                    if (typeof opt === "object" && opt !== null) {
                        return opt.label || opt.name || opt.title || opt.value || opt.text || "";
                    }
                    return String(opt);
                })
                .filter(Boolean);
        }
        if (typeof options === "string") {
            try {
                const parsed = JSON.parse(options);
                if (Array.isArray(parsed)) {
                    return getOptionsList(parsed);
                }
            } catch {
                if (options.includes(",")) {
                    return options.split(",").map((s) => s.trim()).filter(Boolean);
                }
                if (options.trim()) {
                    return [options.trim()];
                }
            }
        }
        return [];
    };

    // Detect 4 question types strictly from API fields: 'yes_no', 'image', 'options', 'text'
    const detectQuestionType = (q: BookingQuestionItem): "yes_no" | "image" | "options" | "text" => {
        const rawType = String(
            q.question_type ||
            (q as any).type ||
            (q as any).input_type ||
            ""
        ).toLowerCase().trim();

        // 1. Yes / No boolean
        if (
            rawType === "yes_no" ||
            rawType === "yesno" ||
            rawType === "boolean" ||
            rawType === "bool" ||
            rawType === "radio_yes_no"
        ) {
            return "yes_no";
        }

        // 2. Image / Photo upload
        if (
            rawType === "image" ||
            rawType === "photo" ||
            rawType === "file" ||
            rawType === "attachment" ||
            rawType === "upload" ||
            rawType === "picture"
        ) {
            return "image";
        }

        // 3. Multiple Choice / Options
        if (
            rawType === "choice" ||
            rawType === "options" ||
            rawType === "select" ||
            rawType === "dropdown" ||
            rawType === "radio" ||
            rawType === "multi_choice" ||
            (Array.isArray(q.options) && q.options.length > 0)
        ) {
            return "options";
        }

        // 4. Default: Text / Textarea
        return "text";
    };

    const handleQuestionImageUpload = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setQuestionImagePreviews((prev) => ({ ...prev, [qId]: url }));
            onAnswerChange(qId, file.name);
        }
    };

    const handleRemoveQuestionImage = (qId: string) => {
        setQuestionImagePreviews((prev) => {
            const updated = { ...prev };
            delete updated[qId];
            return updated;
        });
        onAnswerChange(qId, "");
    };

    // Step 1 Validation -> Proceed to Payment Screen
    const handleProceedToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setStepValidationErr(null);

        if (!bookingDate) {
            setStepValidationErr("Please select an appointment date.");
            return;
        }

        if (!selectedSlotId && !bookingTime) {
            setStepValidationErr("Please select an available time slot for your appointment.");
            return;
        }

        // Advance to Dedicated Payment Step
        setBookingSubStep("payment");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Step 2 Submission -> Final Submit to API
    const handleFinalConfirmBooking = async () => {
        setStepValidationErr(null);
        await onSubmitBooking();
    };

    // -------------------------------------------------------------------------
    // View 1: Confirmed State
    // -------------------------------------------------------------------------
    if (bookingConfirmed) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fade-in text-center space-y-6">
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            Booking Scheduled Successfully
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                            Your Modification Appointment is Confirmed!
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                            The workshop has received your booking details and agreed quote. They will prepare your parts and slot accordingly.
                        </p>
                    </div>

                    {bookingApiResult?.readable_id && (
                        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 inline-block">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Booking Reference</span>
                            <span className="text-sm font-extrabold text-[#E8AF66]">
                                #{bookingApiResult.readable_id}
                            </span>
                        </div>
                    )}

                    <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 text-left text-xs space-y-2.5 max-w-md mx-auto">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Workshop</span>
                            <span className="font-bold text-white capitalize">{provider.company_name}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Agreed Price</span>
                            <span className="font-extrabold text-[#E8AF66] text-sm">{priceFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Date &amp; Time</span>
                            <span className="font-bold text-white">{bookingDate} • {bookingTime || "Confirmed Slot"}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Service Location</span>
                            <span className="font-bold text-white capitalize">
                                {serviceLocation === "workshop" ? "Workshop Bay" : "Mobile Van Service"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Payment Option</span>
                            <span className="font-bold text-emerald-400 capitalize">
                                {bookingPaymentMethod === "cash_after_service" ? "Pay After Work Completed" : "Paid Online (Stripe)"}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={onBackToQuotes}
                            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                            View All My Quotes &amp; Bookings
                        </button>
                        <button
                            type="button"
                            onClick={onBackToHome}
                            className="w-full sm:w-auto bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-[#D5A054]/20 transition-all cursor-pointer uppercase tracking-wider"
                        >
                            Return to Services
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // View 2: Step 2 - Dedicated Payment Page / Screen (As requested: "payment ka new page pr jye")
    // -------------------------------------------------------------------------
    if (bookingSubStep === "payment") {
        return (
            <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-20">
                {/* Step Indicator Header */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => setBookingSubStep("schedule")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                        <span>Back to Appointment Details</span>
                    </button>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setBookingSubStep("schedule")}
                            className="flex items-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer"
                        >
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                                <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <span className="hidden sm:inline">1. Details</span>
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                        <div className="flex items-center gap-1.5 text-[#E8AF66]">
                            <span className="w-5 h-5 rounded-full bg-[#E8AF66] text-zinc-950 flex items-center justify-center text-[10px] font-black">
                                2
                            </span>
                            <span className="font-extrabold">Payment &amp; Confirmation</span>
                        </div>
                    </div>
                </div>

                {/* Booking Review Summary Card */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1.5 shadow-inner">
                                {provider.logo_full_path ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={provider.logo_full_path}
                                        alt={provider.company_name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-base font-bold text-[#E8AF66]">
                                        {provider.company_name?.slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8AF66]">Selected Workshop</span>
                                <h3 className="text-lg font-black text-white capitalize">{provider.company_name}</h3>
                                <div className="text-xs text-zinc-400 mt-0.5">
                                    {provider.company_address || provider.company_city || "Indore"}
                                </div>
                            </div>
                        </div>

                        <div className="sm:text-right">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Total Payable</span>
                            <span className="text-2xl sm:text-3xl font-black text-[#E8AF66]">{priceFormatted}</span>
                        </div>
                    </div>

                    {/* Schedule Snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 border border-zinc-800/80 rounded-2xl p-4 text-xs">
                        <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Appointment Date</span>
                            <span className="font-bold text-white text-sm mt-0.5 block">{bookingDate}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Time Slot</span>
                            <span className="font-bold text-white text-sm mt-0.5 block">{bookingTime || "Scheduled Time"}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Service Location</span>
                            <span className="font-bold text-white text-sm mt-0.5 block capitalize">
                                {serviceLocation === "workshop" ? "Workshop Bay" : "Mobile Van Service"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Selection Card */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-[#E8AF66]" />
                            <span>Select Payment Method</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                            Choose how you would like to settle the payment for this modification service.
                        </p>
                    </div>

                    {(bookingError || stepValidationErr) && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{stepValidationErr || bookingError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Cash After Service */}
                        <div
                            onClick={() => onPaymentMethodChange("cash_after_service")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                bookingPaymentMethod === "cash_after_service"
                                    ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]"
                                    : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            bookingPaymentMethod === "cash_after_service"
                                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                        }`}
                                    >
                                        <Banknote className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white">Pay After Service</div>
                                        <div className="text-[11px] text-zinc-400">Cash or Card on completion</div>
                                    </div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                        bookingPaymentMethod === "cash_after_service"
                                            ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                                            : "border-zinc-600 bg-transparent"
                                    }`}
                                >
                                    {bookingPaymentMethod === "cash_after_service" && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                                Pay the technician directly after your vehicle modifications are completed, tested, and inspected to your satisfaction.
                            </p>
                        </div>

                        {/* Option 2: Online Payment (Stripe) */}
                        <div
                            onClick={() => onPaymentMethodChange("stripe")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                bookingPaymentMethod === "stripe"
                                    ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]"
                                    : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            bookingPaymentMethod === "stripe"
                                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                        }`}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white">Online Card Payment</div>
                                        <div className="text-[11px] text-zinc-400">Instant &amp; secure via Stripe</div>
                                    </div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                        bookingPaymentMethod === "stripe"
                                            ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                                            : "border-zinc-600 bg-transparent"
                                    }`}
                                >
                                    {bookingPaymentMethod === "stripe" && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                                Secure checkout with Debit/Credit Card, Apple Pay or Google Pay powered by Stripe encrypted checkout.
                            </p>
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <span>256-Bit SSL End-to-End Encryption</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#E8AF66]" />
                            <span>MMC Verified Workshop Guarantee</span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setBookingSubStep("schedule")}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                        >
                            &larr; Back to Details
                        </button>

                        <button
                            type="button"
                            onClick={handleFinalConfirmBooking}
                            disabled={submittingBooking}
                            className="w-full sm:w-auto bg-gradient-to-r from-[#F6D089] to-[#D5A054] hover:from-[#eec477] hover:to-[#c69145] text-zinc-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D5A054]/25 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {submittingBooking ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Processing Booking...</span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        {bookingPaymentMethod === "stripe" ? "Proceed to Stripe Checkout" : "Confirm Appointment"} ({priceFormatted})
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // View 3: Step 1 - Appointment Details & Workshop Inquiries Form
    // (Payment removed from this step as requested: "uss form me ni chaiye payment me next usme aye esha")
    // -------------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-20">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBackToQuotes}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back to Quotes</span>
                </button>

                <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Agreed Quote</span>
                    <span className="text-xl sm:text-2xl font-black text-[#E8AF66]">{priceFormatted}</span>
                </div>
            </div>

            {/* Specialist & Quote Card */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1.5 shadow-inner">
                        {provider.logo_full_path ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={provider.logo_full_path}
                                alt={provider.company_name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-lg font-bold text-[#E8AF66]">
                                {provider.company_name?.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-[11px] font-bold text-[#E8AF66] uppercase tracking-wider">
                            Booking with Workshop
                        </div>
                        <h3 className="text-lg font-black text-white capitalize">
                            {provider.company_name}
                        </h3>
                        <div className="text-xs text-zinc-400 mt-0.5">
                            Contact: {provider.contact_person_name || "Specialist"} • {provider.company_phone}
                        </div>
                    </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">Accepted Offer</span>
                    <div className="text-2xl font-black text-white">{priceFormatted}</div>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Fixed Quote
                    </span>
                </div>
            </div>

            {/* Main Booking Form */}
            <form onSubmit={handleProceedToPayment} className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                {(bookingError || stepValidationErr) && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{stepValidationErr || bookingError}</span>
                    </div>
                )}

                {/* 1. Date & Slot Selection */}
                <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#E8AF66]" />
                        <span>1. Choose Appointment Date &amp; Time Slot</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={bookingDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => onDateChange(e.target.value)}
                                required
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Available Time Slots
                            </label>
                            {loadingSlots ? (
                                <div className="h-[48px] bg-black/40 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-xs text-zinc-400">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E8AF66]" />
                                    <span>Loading workshop slots...</span>
                                </div>
                            ) : bookingSlots.length === 0 ? (
                                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                                    <Clock3 className="w-4 h-4 text-amber-500/80 shrink-0" />
                                    <span>No slots available for this date. Please select another date.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {bookingSlots.map((slot) => {
                                        const isSelected = selectedSlotId === slot.id;
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => {
                                                    onSelectSlotId(slot.id);
                                                    if (slot.start_time) {
                                                        onTimeChange(slot.start_time);
                                                    }
                                                }}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#E8AF66] text-black border-[#E8AF66] shadow-md shadow-[#E8AF66]/20 font-black"
                                                        : "bg-black/60 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                                }`}
                                            >
                                                {slot.start_time || "Available"}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Service Location (Driven strictly by API) */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#E8AF66]" />
                            <span>2. Service Location</span>
                        </h3>
                        {availableLocations.length === 1 && (
                            <span className="text-[10px] text-[#E8AF66] font-bold uppercase tracking-wider bg-[#E8AF66]/10 px-2.5 py-0.5 rounded-full border border-[#E8AF66]/20">
                                {availableLocations[0] === "customer" ? "Mobile Van Service Only" : "Workshop Bay Only"}
                            </span>
                        )}
                    </div>

                    <div className={`grid gap-3 ${availableLocations.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                        {availableLocations.includes("workshop") && (
                            <div
                                onClick={() => onServiceLocationChange("workshop")}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                    serviceLocation === "workshop"
                                        ? "bg-[#E8AF66]/10 border-[#E8AF66] shadow-md shadow-[#E8AF66]/10"
                                        : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-white">Workshop Bay</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${serviceLocation === "workshop" ? "border-[#E8AF66] bg-[#E8AF66]" : "border-zinc-600"}`}>
                                        {serviceLocation === "workshop" && <Check className="w-2.5 h-2.5 text-black" />}
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-400">Bring vehicle to specialist garage with full tools and diagnostic bays.</p>
                            </div>
                        )}

                        {availableLocations.includes("customer") && (
                            <div
                                onClick={() => onServiceLocationChange("customer")}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                    serviceLocation === "customer"
                                        ? "bg-[#E8AF66]/10 border-[#E8AF66] shadow-md shadow-[#E8AF66]/10"
                                        : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-white">Mobile Van Service</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${serviceLocation === "customer" ? "border-[#E8AF66] bg-[#E8AF66]" : "border-zinc-600"}`}>
                                        {serviceLocation === "customer" && <Check className="w-2.5 h-2.5 text-black" />}
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-400">Mobile technician travels to your home or office for on-site install.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Workshop Specific Inquiries (Dynamic 4 Question Types: yes_no, image, options, text) */}
                {bookingQuestions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-[#E8AF66]" />
                                <span>3. Workshop Specific Inquiries ({bookingQuestions.length})</span>
                            </h3>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                                Specialist preparation
                            </span>
                        </div>

                        <div className="space-y-4">
                            {bookingQuestions.map((q) => {
                                const qText = q.question_text || q.question || "Inquiry";
                                const isRequired = checkIsRequired(q);
                                const qType = detectQuestionType(q);
                                const currentAnswer = questionAnswers[q.id];

                                return (
                                    <div
                                        key={q.id}
                                        className="bg-black/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3 transition-colors hover:border-zinc-700"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <label className="text-xs sm:text-sm font-bold text-zinc-200 block leading-snug">
                                                {qText}
                                            </label>
                                        </div>

                                        {/* TYPE 1: YES / NO (Buttons / Pills) */}
                                        {qType === "yes_no" && (
                                            <div className="flex items-center gap-3 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onAnswerChange(q.id, "Yes")}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                                        currentAnswer === "Yes"
                                                            ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-lg shadow-[#D5A054]/20 scale-105"
                                                            : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                                                    }`}
                                                >
                                                    {currentAnswer === "Yes" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    <span>Yes</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onAnswerChange(q.id, "No")}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                                        currentAnswer === "No"
                                                            ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-lg shadow-[#D5A054]/20 scale-105"
                                                            : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                                                    }`}
                                                >
                                                    {currentAnswer === "No" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    <span>No</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* TYPE 2: IMAGE / PHOTO UPLOAD */}
                                        {qType === "image" && (
                                            <div className="pt-1">
                                                {questionImagePreviews[q.id] ? (
                                                    <div className="relative rounded-2xl overflow-hidden border border-zinc-700 h-28 w-44 flex items-center justify-center bg-black">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={questionImagePreviews[q.id]}
                                                            alt="Uploaded file"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveQuestionImage(q.id)}
                                                            className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="border-2 border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center cursor-pointer transition-colors bg-black/40">
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-[#E8AF66]">
                                                            <Camera className="w-5 h-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-xs text-white font-bold">Attach photo or image</div>
                                                            <div className="text-[10px] text-zinc-400">PNG, JPG, WEBP up to 10MB</div>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleQuestionImageUpload(q.id, e)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        {/* TYPE 3: MULTIPLE CHOICE / OPTIONS PILLS */}
                                        {qType === "options" && (() => {
                                            const optionsList = getOptionsList(q.options);
                                            if (optionsList.length === 0) {
                                                return (
                                                    <input
                                                        type="text"
                                                        value={currentAnswer || ""}
                                                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                        placeholder="Your answer..."
                                                        className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                                                    />
                                                );
                                            }
                                            return (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {optionsList.map((val) => {
                                                        const isOptSelected = currentAnswer === val;
                                                        return (
                                                            <button
                                                                key={val}
                                                                type="button"
                                                                onClick={() => onAnswerChange(q.id, val)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                                    isOptSelected
                                                                        ? "bg-[#E8AF66] text-black border-[#E8AF66] font-black shadow-md shadow-[#E8AF66]/20"
                                                                        : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                                                }`}
                                                            >
                                                                {val}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* TYPE 4: TEXT / TEXTAREA FREEFORM */}
                                        {qType === "text" && (
                                            <input
                                                type="text"
                                                value={currentAnswer || ""}
                                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                placeholder="Your answer..."
                                                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. Notes & Photo Attachments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Additional Instructions for Engineer (Optional)
                        </label>
                        <textarea
                            value={bookingNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            rows={3}
                            placeholder="e.g. Please bring extra clamps, gate code is 1234, or let me know if dyno time requires extra prep."
                            className="w-full bg-black/60 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Vehicle / Part Photo (Optional)
                        </label>
                        {bookingCarImagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-700 h-[88px] flex items-center justify-center bg-black">
                                <Image src={bookingCarImagePreview} alt="Preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={onRemoveCarImage}
                                    className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1 rounded-full cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-2xl h-[88px] flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-colors bg-black/40">
                                <Camera className="w-5 h-5 text-[#E8AF66] mb-1" />
                                <span className="text-xs text-zinc-300 font-medium">Attach photo</span>
                                <input type="file" accept="image/*" onChange={onCarImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Submit Action: Moves to Payment Screen */}
                <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Zero cancellation fee up to 24h before appointment</span>
                    </div>

                    <button
                        type="submit"
                        className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] hover:from-[#eec477] hover:to-[#c69145] text-zinc-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D5A054]/25 cursor-pointer uppercase tracking-wider active:scale-95"
                    >
                        <span>Proceed to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
