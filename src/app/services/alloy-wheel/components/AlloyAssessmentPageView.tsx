"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    ChevronDown,
    ChevronRight,
    Check,
    RefreshCw,
    X,
    AlertCircle,
    Info,
} from "lucide-react";
import type { BookingQuestionItem } from "@/lib/service/alloy.api";

export const DEFAULT_ALLOY_ASSESSMENT_QUESTIONS: BookingQuestionItem[] = [
    {
        id: "q-num-wheels",
        question_text: "Number of wheels",
        question_type: "select",
        options: ["1", "2", "3", "4"],
        is_required: true,
    },
    {
        id: "q-wheel-size",
        question_text: "Wheel size",
        question_type: "select",
        options: ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "26", "28", "30", "32"],
        is_required: true,
    },
    {
        id: "q-wheel-finish",
        question_text: "Wheel finish",
        question_type: "select",
        options: ["Painted", "Diamond Cut", "Polished", "Powder Coated", "Chrome / Shadow Chrome", "Not sure"],
        is_required: true,
    },
    {
        id: "q-current-colour",
        question_text: "Current colour",
        question_type: "select",
        options: [
            "Silver",
            "Gloss black",
            "Satin black",
            "Matte black",
            "Hyper silver",
            "Gunmetal grey",
            "Anthracite",
            "Bronze",
            "Gold",
            "Diamond Cut Lip",
            "Factory Original",
        ],
        is_required: true,
    },
    {
        id: "q-change-colour",
        question_text: "Change Colour",
        question_type: "select",
        options: [
            "Keep Same Colour",
            "Gloss black",
            "Satin black",
            "Matte black",
            "Silver",
            "Hyper silver",
            "Gunmetal grey",
            "Anthracite",
            "Bronze",
            "Gold",
            "Custom shade",
        ],
        is_required: true,
    },
];

interface AlloyAssessmentPageViewProps {
    regNo: string;
    postcode: string;
    carYear?: string;
    selectedServices: string[];
    bookingQuestions: BookingQuestionItem[];
    loadingQuestions: boolean;
    questionAnswers: Record<string, string>;
    onAnswerChange: (questionId: string, answer: string) => void;
    damageDesc: string;
    onDamageDescChange: (desc: string) => void;
    bookingDate: string;
    onBookingDateChange: (date: string) => void;
    bookingTime: string;
    onBookingTimeChange: (time: string) => void;
    privacyAgreed: boolean;
    onPrivacyAgreedChange: (agreed: boolean) => void;
    onBack: () => void;
    onSubmit: () => Promise<void>;
    submitting: boolean;
}

export default function AlloyAssessmentPageView({
    regNo,
    postcode,
    carYear,
    selectedServices,
    bookingQuestions,
    loadingQuestions,
    questionAnswers,
    onAnswerChange,
    damageDesc,
    onDamageDescChange,
    bookingDate,
    onBookingDateChange,
    bookingTime,
    onBookingTimeChange,
    privacyAgreed,
    onPrivacyAgreedChange,
    onBack,
    onSubmit,
    submitting,
}: AlloyAssessmentPageViewProps) {
    const [errorMsg, setErrorMsg] = useState("");
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    // Merge API questions with defaults to guarantee ONLY the desired alloy wheel assessment questions exist
    const effectiveQuestions = React.useMemo(() => {
        const unwantedKeywords = [
            "fitted to the vehicle",
            "locking wheel nut",
            "structural damage",
            "immediately after repair",
        ];

        const isUnwanted = (txt: string) => {
            const lower = (txt || "").toLowerCase();
            return unwantedKeywords.some((kw) => lower.includes(kw));
        };

        if (!bookingQuestions || bookingQuestions.length === 0) {
            return DEFAULT_ALLOY_ASSESSMENT_QUESTIONS;
        }

        const map = new Map<string, BookingQuestionItem>();
        // Add defaults first
        DEFAULT_ALLOY_ASSESSMENT_QUESTIONS.forEach((q) => {
            const key = (q.question_text || "").toLowerCase().trim();
            map.set(key, q);
        });

        // Overlay API questions (ignoring unwanted questions)
        bookingQuestions.forEach((q) => {
            const qTitle = q.question_text || q.question || "";
            if (isUnwanted(qTitle)) return;
            const key = qTitle.toLowerCase().trim();
            map.set(key, {
                ...q,
                question_text: qTitle,
                options: q.options && q.options.length > 0 ? q.options : (q.question_type === "yes_no" ? ["Yes", "No"] : []),
            });
        });

        return Array.from(map.values()).filter((q) => !isUnwanted(q.question_text || ""));
    }, [bookingQuestions]);

    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        // Check required questions
        for (const q of effectiveQuestions) {
            const isReq = q.is_required === true || q.is_required === 1;
            if (isReq && !questionAnswers[q.id]?.trim()) {
                setErrorMsg(`Please answer "${q.question_text || q.question || "the question"}" to continue.`);
                return;
            }
        }

        if (!privacyAgreed) {
            setErrorMsg("Please agree to the Privacy Policy to request an alloy quote.");
            return;
        }

        setErrorMsg("");
        await onSubmit();
    };

    // Format schedule display
    const formattedSchedule = React.useMemo(() => {
        try {
            if (!bookingDate) return "Tomorrow, 11:00 AM";
            const dateObj = new Date(`${bookingDate}T${bookingTime || "11:00:00"}`);
            const dateFormatted = dateObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            const timeFormatted = dateObj.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            return `${dateFormatted}, ${timeFormatted}`;
        } catch {
            return `${bookingDate}, ${bookingTime}`;
        }
    }, [bookingDate, bookingTime]);

    return (
        <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-fade-in space-y-6 pb-28">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141518] border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back</span>
                </button>

                {/* Step Indicator */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                    <span className="w-6 h-6 rounded-full bg-[#E8AF66] text-zinc-950 flex items-center justify-center text-xs">
                        3
                    </span>
                    <span className="text-zinc-400">Step 3 of 3</span>
                </div>
            </div>

            {/* Page Header (Matches Screenshot 3) */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Alloy Wheel Refurbishment
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400">
                    Restore your alloy wheels with finishing and expert refurbishment services.
                </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Main Card (Matches Screenshot 3 & 4) */}
            <div className="rounded-3xl border border-zinc-800/90 bg-[#141518] p-5 sm:p-7 shadow-2xl space-y-6">
                {/* Card Step Badge Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="px-3 py-1 rounded-full bg-[#E8AF66]/15 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-bold">
                        Step 3 of 3
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                        Assessment &amp; Schedule
                    </span>
                </div>

                {/* Section Header */}
                <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Damage Assessment
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Help repairers provide more accurate estimates by answering a few questions.
                    </p>
                </div>

                {/* Dynamic Questions List */}
                {loadingQuestions ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#E8AF66]" />
                        <span>Loading assessment questions...</span>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {effectiveQuestions.map((q) => {
                            const qText = q.question_text || q.question || "Question";
                            const isRequired = q.is_required === true || q.is_required === 1;
                            const opts =
                                q.options && q.options.length > 0
                                    ? q.options
                                    : q.question_type === "yes_no"
                                    ? ["Yes", "No"]
                                    : [];

                            return (
                                <div
                                    key={q.id}
                                    className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-xs sm:text-sm font-bold text-zinc-200">
                                            {qText} {isRequired && <span className="text-amber-400">*</span>}
                                        </label>
                                        {isRequired && (
                                            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                                REQUIRED
                                            </span>
                                        )}
                                    </div>

                                    {opts.length > 6 ? (
                                        /* Dropdown for > 6 options (Image 3: Wheel size, Current colour, Change colour) */
                                        <div className="relative">
                                            <select
                                                value={questionAnswers[q.id] || ""}
                                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                                className="w-full bg-[#141518] border border-zinc-700/80 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-white appearance-none focus:outline-none focus:border-[#E8AF66] cursor-pointer"
                                            >
                                                <option value="" disabled className="bg-[#141518] text-zinc-500">
                                                    Select {qText.toLowerCase()}...
                                                </option>
                                                {opts.map((opt: string) => (
                                                    <option key={opt} value={opt} className="bg-[#141518] text-white">
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    ) : opts.length > 0 ? (
                                        /* Selectable pill buttons for <= 6 options (Image 3 & 4: Number of wheels [1,2,3,4], Wheel finish) */
                                        <div className="flex flex-wrap gap-2.5">
                                            {opts.map((opt: string) => {
                                                const isSelected = questionAnswers[q.id] === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => onAnswerChange(q.id, opt)}
                                                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            isSelected
                                                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/20 scale-[1.02]"
                                                                : "bg-[#141518] border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                        <span>{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Free text input */
                                        <input
                                            type="text"
                                            value={questionAnswers[q.id] || ""}
                                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                            placeholder="Your answer..."
                                            className="w-full bg-[#141518] border border-zinc-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Damage Description (Matches Screenshot 3) */}
                <div className="space-y-2 pt-2">
                    <label className="text-xs sm:text-sm font-bold text-zinc-200 block">
                        Damage Description
                    </label>
                    <textarea
                        value={damageDesc}
                        onChange={(e) => onDamageDescChange(e.target.value)}
                        placeholder="Describe the alloy damage in detail (optional)"
                        rows={3}
                        className="w-full bg-[#18181B] border border-zinc-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] resize-none"
                    />
                </div>

                {/* Preferred Schedule (Matches Screenshot 3) */}
                <div className="space-y-2 pt-2">
                    <label className="text-xs sm:text-sm font-bold text-zinc-200 block">
                        Preferred Schedule
                    </label>

                    <div
                        onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                        className="w-full bg-[#18181B] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#E8AF66]">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white">
                                {formattedSchedule}
                            </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>

                    {showSchedulePicker && (
                        <div className="p-4 bg-[#18181B] border border-zinc-800 rounded-2xl space-y-3 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-zinc-400 block mb-1">
                                        Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={bookingDate}
                                        onChange={(e) => onBookingDateChange(e.target.value)}
                                        className="w-full bg-[#141518] border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8AF66]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-zinc-400 block mb-1">
                                        Preferred Time
                                    </label>
                                    <input
                                        type="time"
                                        value={bookingTime}
                                        onChange={(e) => onBookingTimeChange(e.target.value)}
                                        className="w-full bg-[#141518] border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8AF66]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Privacy Policy Checkbox (Matches Screenshot 3) */}
                <div className="flex items-center gap-2.5 pt-2">
                    <input
                        type="checkbox"
                        id="assessment-privacy-check"
                        checked={privacyAgreed}
                        onChange={(e) => onPrivacyAgreedChange(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E8AF66] focus:ring-0 cursor-pointer accent-[#E8AF66]"
                    />
                    <label
                        htmlFor="assessment-privacy-check"
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
            </div>

            {/* Bottom Action Bar (Matches Screenshot 3) */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-4 rounded-2xl bg-[#141518] border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#E8AF66] transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5 text-[#E8AF66]" />
                </button>

                <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                            <span>Requesting Quotes from Specialists...</span>
                        </>
                    ) : (
                        <span>GET ALLOY QUOTE</span>
                    )}
                </button>
            </div>
        </div>
    );
}
