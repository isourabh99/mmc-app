"use client";

import React from "react";
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
    Bell,
} from "lucide-react";
import type {
    ProviderItem,
    PostBidItem,
    BookingSlotItem,
    BookingQuestionItem,
    CustomerQuotationPostItem,
} from "@/lib/service/bodywork.api";

interface BodyworkBookingViewProps {
    provider: ProviderItem;
    bidOffer: PostBidItem | null;
    postItem: CustomerQuotationPostItem | null;
    postId: string;
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
    bookingPaymentMethod: any;
    onPaymentMethodChange: (method: any) => void;
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

export default function BodyworkBookingView({
    provider,
    bidOffer,
    postItem,
    postId,
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
}: BodyworkBookingViewProps) {
    const priceFormatted = bidOffer?.offered_price
        ? typeof bidOffer.offered_price === "number"
            ? `£${bidOffer.offered_price.toFixed(2)}`
            : String(bidOffer.offered_price).startsWith("£")
                ? bidOffer.offered_price
                : `£${bidOffer.offered_price}`
        : provider.total_selected_services_price > 0
            ? `£${provider.total_selected_services_price}`
            : "Free Quote";

    // -------------------------------------------------------------------------
    // View 1: Booking Confirmed Receipt Screen
    // -------------------------------------------------------------------------
    if (bookingConfirmed) {
        const refId =
            bookingApiResult?.readable_id ||
            bookingApiResult?.booking_id ||
            bookingApiResult?.id ||
            "CONFIRMED";

        return (
            <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fade-in space-y-6 relative">
                {/* Floating Top In-App Notification Popup */}
                <div className="fixed top-24 right-4 sm:right-8 z-[110] animate-bounce max-w-sm w-full bg-[#181512] border-2 border-[#E8AF66] p-4 rounded-2xl shadow-[0_10px_35px_rgba(232,175,102,0.4)] flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E8AF66]/20 border border-[#E8AF66] flex items-center justify-center text-[#E8AF66] shrink-0">
                        <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#E8AF66]">
                                Booking Notification
                            </span>
                            <span className="text-[9px] text-zinc-400">Just now</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">Booking #{refId} Reserved!</p>
                        <p className="text-[11px] text-zinc-300 truncate">Bodyshop: {provider.company_name}</p>
                    </div>
                </div>

                <div className="bg-[#141518] border-2 border-[#E8AF66] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8AF66]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-black flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                        <Check className="w-10 h-10 stroke-[3]" />
                    </div>

                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                            Booking Confirmed
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                            Your Repair Appointment is Reserved!
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                            The bodyshop has received your repair booking details and will be prepared for your scheduled appointment.
                        </p>
                    </div>

                    {/* Booking Summary Box */}
                    <div className="bg-[#191A1E] border border-zinc-800 rounded-2xl p-5 text-left space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                            <span className="text-zinc-400 uppercase font-bold text-[10px]">Reference Number</span>
                            <span className="font-mono font-bold text-base text-[#E8AF66]">#{refId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Bodyshop Specialist:</span>
                            <span className="font-bold text-white capitalize">{provider.company_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Scheduled Date:</span>
                            <span className="font-bold text-white">{bookingDate} at {bookingTime || "11:00 AM"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Service Mode:</span>
                            <span className="font-bold text-white capitalize">{serviceLocation === "customer" ? "Mobile SMART Unit" : "Bodyshop Workshop Drop-Off"}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                            <span className="text-zinc-400">Agreed Price:</span>
                            <span className="text-base font-extrabold text-[#E8AF66]">{priceFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Payment Option:</span>
                            <span className="font-bold text-white uppercase">{bookingPaymentMethod === "stripe" ? "Online (Stripe)" : "Cash After Service"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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
    // View 2: Schedule & Checkout Form
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
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Agreed Total</span>
                    <span className="text-xl sm:text-2xl font-black text-[#E8AF66]">{priceFormatted}</span>
                </div>
            </div>

            {/* Specialist & Quote Card */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1.5 shadow-inner">
                        {provider.logo_full_path || (provider as any)?.logo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={provider.logo_full_path || (provider as any)?.logo}
                                alt={provider.company_name}
                                className="w-full h-full object-contain rounded-2xl"
                            />
                        ) : (
                            <span className="text-lg font-bold text-[#E8AF66]">
                                {provider.company_name?.slice(0, 2).toUpperCase() || "BW"}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-[11px] font-bold text-[#E8AF66] uppercase tracking-wider">
                            Booking Bodyshop
                        </div>
                        <h3 className="text-lg font-extrabold text-white capitalize leading-tight">
                            {provider.company_name}
                        </h3>
                        <div className="text-xs text-zinc-400 mt-0.5">
                            {provider.contact_person_name || "Head Repair Technician"} • {provider.company_phone}
                        </div>
                    </div>
                </div>

                <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800 text-xs sm:text-right space-y-0.5 shrink-0">
                    <div className="text-emerald-400 uppercase font-bold text-[10px]">Verified Offer</div>
                    <div className="text-zinc-200 text-xs font-semibold">{bidOffer ? "Repair Bid Accepted" : "Accredited Bodyshop"}</div>
                </div>
            </div>

            {/* Error banner if any */}
            {bookingError && (
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                </div>
            )}

            {/* Main Form Fields */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7">
                {/* 1. Date & Time Slot Selection */}
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
                                onChange={(e) => onDateChange(e.target.value)}
                                className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>

                        {/* Slots Selection Pills */}
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] text-zinc-400 mb-1 block">
                                Available Time Slots ({bookingSlots.length})
                            </label>

                            {loadingSlots ? (
                                <div className="py-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                                    <RefreshCw className="w-4 h-4 animate-spin text-[#E8AF66]" />
                                    <span>Fetching live slots for {bookingDate}...</span>
                                </div>
                            ) : bookingSlots.length === 0 ? (
                                <div className="p-3 bg-[#18181B] border border-zinc-800 rounded-2xl text-xs text-zinc-400 text-center">
                                    No designated slot returned for this date. Default morning slot (11:00 AM) will be scheduled.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                                    {bookingSlots.map((slot) => {
                                        const isSelected = selectedSlotId === slot.id;
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => {
                                                    onSelectSlotId(slot.id);
                                                    if (slot.start_time) onTimeChange(slot.start_time);
                                                }}
                                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
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
                                onClick={() => onBookingTypeChange("normal")}
                                className={`py-3 px-3 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer ${
                                    bookingType === "normal"
                                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                                }`}
                            >
                                Standard / Flexible
                            </button>
                            <button
                                type="button"
                                onClick={() => onBookingTypeChange("emergency")}
                                className={`py-3 px-3 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer ${
                                    bookingType === "emergency"
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
                                onClick={() => onServiceLocationChange("customer")}
                                className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                                    serviceLocation === "customer"
                                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                                }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>Mobile Van / SMART</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onServiceLocationChange("workshop")}
                                className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                                    serviceLocation === "workshop"
                                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                                        : "bg-[#18181B] border border-zinc-700 text-white hover:border-zinc-600"
                                }`}
                            >
                                <Building2 className="w-4 h-4" />
                                <span>Bodyshop Drop-Off</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Additional Provider Questions if any */}
                {bookingQuestions.length > 0 && (
                    <div className="space-y-4 pt-2 border-t border-zinc-800">
                        <label className="text-xs font-bold text-white uppercase tracking-wider block">
                            4. Specialist Questions ({bookingQuestions.length})
                        </label>
                        <div className="space-y-3">
                            {bookingQuestions.map((q) => {
                                const qText = q.question_text || q.question || "Question";
                                const isRequired = q.is_required === true || q.is_required === 1;

                                return (
                                    <div key={q.id} className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                                        <div className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                                            <span>{qText}</span>
                                            {isRequired && <span className="text-[10px] text-amber-400 font-bold uppercase">Required</span>}
                                        </div>

                                        {q.question_type === "yes_no" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onAnswerChange(q.id, "Yes")}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        questionAnswers[q.id] === "Yes"
                                                            ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md"
                                                            : "bg-zinc-900 border border-zinc-700 text-zinc-300"
                                                    }`}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onAnswerChange(q.id, "No")}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        questionAnswers[q.id] === "No"
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
                                                value={questionAnswers[q.id] || ""}
                                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
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

                {/* 4. Notes & Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                    <div>
                        <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">
                            5. Instructions for Bodyshop (Optional)
                        </label>
                        <textarea
                            value={bookingNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="e.g. Paint code if known, access notes, specific panel focus..."
                            rows={3}
                            className="w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">
                            Damage Photo (Optional)
                        </label>
                        {bookingCarImagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-700 h-24 aspect-video flex items-center justify-center bg-black">
                                <Image src={bookingCarImagePreview} alt="Preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={onRemoveCarImage}
                                    className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full hover:bg-black"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-2xl h-24 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-colors bg-[#18181B]">
                                <Camera className="w-5 h-5 text-[#E8AF66] mb-1" />
                                <span className="text-xs text-zinc-300 font-medium">Attach damage photo</span>
                                <input type="file" accept="image/*" onChange={onCarImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 5. Payment Method Selection (Dedicated Full-Page UI - NO POPUP) */}
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                    <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider block">
                        6. Choose Payment Method
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option A: Cash After Service */}
                        <div
                            onClick={() => onPaymentMethodChange("cash_after_service")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                bookingPaymentMethod === "cash_after_service"
                                    ? "bg-[#1C1A16] border-[#D5A054] shadow-md shadow-[#D5A054]/15 ring-1 ring-[#D5A054]"
                                    : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                        bookingPaymentMethod === "cash_after_service"
                                            ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                                    }`}
                                >
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs sm:text-sm font-bold text-white">Cash After Repair</div>
                                    <div className="text-[11px] text-zinc-400">Pay the technician once job is complete.</div>
                                </div>
                            </div>

                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                    bookingPaymentMethod === "cash_after_service"
                                        ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                                        : "border-zinc-700"
                                }`}
                            >
                                {bookingPaymentMethod === "cash_after_service" && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                        </div>

                        {/* Option B: Online Payment Stripe */}
                        <div
                            onClick={() => onPaymentMethodChange("stripe")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                bookingPaymentMethod === "stripe"
                                    ? "bg-[#1C1A16] border-[#D5A054] shadow-md shadow-[#D5A054]/15 ring-1 ring-[#D5A054]"
                                    : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                        bookingPaymentMethod === "stripe"
                                            ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs sm:text-sm font-bold text-white">Online Payment (Stripe)</div>
                                    <div className="text-[11px] text-zinc-400">Card, Apple Pay, Google Pay secure checkout.</div>
                                </div>
                            </div>

                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                    bookingPaymentMethod === "stripe"
                                        ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                                        : "border-zinc-700"
                                }`}
                            >
                                {bookingPaymentMethod === "stripe" && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Submit Button */}
                <div className="pt-4 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onSubmitBooking}
                        disabled={submittingBooking}
                        className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                        {submittingBooking ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                                <span>
                                    {bookingPaymentMethod === "stripe"
                                        ? "Redirecting to Stripe Gateway..."
                                        : "Submitting Repair Booking Request..."}
                                </span>
                            </>
                        ) : (
                            <>
                                <span>
                                    {bookingPaymentMethod === "stripe"
                                        ? `Pay & Confirm via Stripe (${priceFormatted})`
                                        : `Confirm Booking with Cash (${priceFormatted})`}
                                </span>
                                <ArrowRight className="w-5 h-5 text-zinc-950" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
