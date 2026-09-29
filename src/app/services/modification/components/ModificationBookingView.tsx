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
    Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
    isPartialPayment?: boolean;
    onPartialPaymentChange?: (isPartial: boolean) => void;
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
    isPartialPayment = false,
    onPartialPaymentChange,
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
    const router = useRouter();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [stepValidationErr, setStepValidationErr] = useState<string | null>(null);

    const rawTotal = bidOffer?.offered_price || provider.total_selected_services_price || 0;
    const totalNum = typeof rawTotal === "number" ? rawTotal : parseFloat(String(rawTotal).replace(/[^0-9.]/g, "")) || 0;
    const totalAmountFormatted = totalNum.toFixed(2);
    const depositAmount = (totalNum * 0.25).toFixed(2);
    const remainingAmount = (totalNum * 0.75).toFixed(2);

    // Question image upload previews cache for question_type === "image"
    const [questionImagePreviews, setQuestionImagePreviews] = useState<Record<string, string>>({});

    // Check if question is required by admin (strictly check API values)
    const checkIsRequired = (q: BookingQuestionItem): boolean => {
        return Boolean(
            q.is_required === 1 ||
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

    // Step 1 Validation -> Open Payment Modal
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

        for (const q of bookingQuestions) {
            const isReq = checkIsRequired(q);
            if (isReq && (!questionAnswers[q.id] || !String(questionAnswers[q.id]).trim())) {
                const qLabel = q.question_text || q.question || "Required inquiry";
                setStepValidationErr(`Please answer required inquiry: "${qLabel}"`);
                return;
            }
        }

        onPaymentMethodChange("stripe");
        setShowPaymentModal(true);
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
                            onClick={() => router.push("/account?tab=bookings")}
                            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                            View My Bookings
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="w-full sm:w-auto bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-[#D5A054]/20 transition-all cursor-pointer uppercase tracking-wider"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // View 2: Schedule & Checkout Form (Matches Screenshot 2 & 3)
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

                {/* Total Quote Amount & Confirm Button (Matches Screenshot 2) */}
                <div className="bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                                Total Quote Amount
                            </span>
                            <div className="text-3xl sm:text-4xl font-black text-white">
                                £{totalAmountFormatted}
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8AF66]/15 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-bold self-start sm:self-auto">
                            <span className="w-2 h-2 rounded-full bg-[#E8AF66] animate-pulse" />
                            <span>25% Deposit Eligible</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <span>CONFIRM &amp; BOOK NOW</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </form>

            {/* Modal: Select Payment Method (Matches Screenshot 3) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-lg bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up">
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Select Payment Method
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">
                                Choose how you want to pay for this service
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Option 1: Deposit 25% Advance */}
                            <div
                                onClick={() => {
                                    onPaymentMethodChange("stripe");
                                    if (onPartialPaymentChange) onPartialPaymentChange(true);
                                }}
                                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                                    isPartialPayment
                                        ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                                        : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-2xl bg-[#E8AF66] text-zinc-950 flex items-center justify-center font-bold shrink-0">
                                            <Banknote className="w-5 h-5 text-zinc-950" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm sm:text-base font-bold text-white">Deposit</span>
                                                <span className="bg-[#E8AF66]/20 text-[#E8AF66] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#E8AF66]/30 uppercase tracking-wider">
                                                    25% ADVANCE
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                Pay 25% deposit now to confirm booking
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                            isPartialPayment
                                                ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                                                : "border-zinc-700 bg-zinc-900"
                                        }`}
                                    >
                                        {isPartialPayment && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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

                            {/* Option 2: Online Payment Full 100% */}
                            <div
                                onClick={() => {
                                    onPaymentMethodChange("stripe");
                                    if (onPartialPaymentChange) onPartialPaymentChange(false);
                                }}
                                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                                    !isPartialPayment
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
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                            !isPartialPayment
                                                ? "bg-[#D5A054] border-[#D5A054] text-zinc-950"
                                                : "border-zinc-700 bg-zinc-900"
                                        }`}
                                    >
                                        {!isPartialPayment && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                </div>

                                <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold">
                                    <span className="text-zinc-300">Amount Due Now:</span>
                                    <span className="text-sm font-extrabold text-white">£{totalAmountFormatted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    await onSubmitBooking();
                                }}
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
                                                ? `Pay Deposit (£${depositAmount})`
                                                : `Pay Full Amount (£${totalAmountFormatted})`}
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
