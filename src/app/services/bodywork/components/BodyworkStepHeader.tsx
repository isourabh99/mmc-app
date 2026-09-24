"use client";

import React from "react";
import { ArrowLeft, ChevronRight, FileText, Lock } from "lucide-react";

export type ActiveView = "landing" | "technicians" | "request_quote" | "quotes" | "provider_profile" | "booking";

interface BodyworkStepHeaderProps {
    activeView: ActiveView;
    onNavigate: (view: ActiveView) => void;
    myQuotesCount: number;
    activeBidsCount: number;
    vehicleReg?: string;
    postcode?: string;
    selectedServicesCount?: number;
    hasSearchedTechnicians?: boolean;
    hasActiveBooking?: boolean;
    onBlockedNavigate?: (message: string) => void;
}

export default function BodyworkStepHeader({
    activeView,
    onNavigate,
    myQuotesCount,
    activeBidsCount,
    vehicleReg,
    postcode,
    selectedServicesCount = 0,
    hasSearchedTechnicians = true,
    hasActiveBooking = false,
    onBlockedNavigate,
}: BodyworkStepHeaderProps) {
    const handleBack = () => {
        if (activeView === "request_quote") {
            onNavigate("technicians");
        } else if (activeView === "provider_profile") {
            onNavigate("technicians");
        } else if (activeView === "booking") {
            onNavigate("quotes");
        } else if (activeView === "quotes") {
            onNavigate("technicians");
        } else {
            onNavigate("landing");
        }
    };

    const getViewTitle = () => {
        switch (activeView) {
            case "technicians":
                return "Certified Bodyshops & Specialists";
            case "provider_profile":
                return "Bodyshop Portfolio & Bio";
            case "request_quote":
                return "Quotation Request Form";
            case "quotes":
                return "My Repair Quotes & Live Offers";
            case "booking":
                return "Schedule & Confirm Repair";
            default:
                return "Car Bodywork & Paint Repair";
        }
    };

    const handleStepClick = (target: ActiveView) => {
        if (target === "landing") {
            onNavigate("landing");
            return;
        }

        if (target === "technicians") {
            if (!hasSearchedTechnicians) {
                onBlockedNavigate?.("Please complete Step 1 (enter vehicle details & postcode) to view available repair specialists.");
                return;
            }
            onNavigate("technicians");
            return;
        }

        if (target === "quotes") {
            if (myQuotesCount === 0) {
                onBlockedNavigate?.("Please select bodyshops and request a quote first before viewing quotes.");
                return;
            }
            onNavigate("quotes");
            return;
        }

        if (target === "booking") {
            if (!hasActiveBooking) {
                onBlockedNavigate?.("Direct booking is not available. Please view your live quotes and click 'Book Offer' on a bodyshop's bid to schedule.");
                return;
            }
            onNavigate("booking");
            return;
        }
    };

    const canAccessStep2 = hasSearchedTechnicians;
    const canAccessStep3 = myQuotesCount > 0;
    const canAccessStep4 = hasActiveBooking;

    return (
        <header className="sticky top-0 z-40 bg-[#0E0F12]/95 backdrop-blur-xl border-b border-zinc-800/90 px-4 sm:px-6 lg:px-12 py-3.5 shadow-2xl transition-all">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                {/* Left: Back button & Title */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm group active:scale-95 shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#E8AF66] group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back</span>
                    </button>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider text-[#E8AF66] font-extrabold block">
                                Bodywork &amp; Paint
                            </span>
                            {vehicleReg && (
                                <span className="bg-zinc-800/90 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700 uppercase">
                                    {vehicleReg}
                                </span>
                            )}
                            {postcode && (
                                <span className="text-zinc-500 text-[11px] truncate max-w-[150px] hidden sm:inline">
                                    • {postcode}
                                </span>
                            )}
                        </div>
                        <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-tight truncate">
                            {getViewTitle()}
                        </h1>
                    </div>
                </div>

                {/* Center: Step indicators with strict step enforcement */}
                <nav aria-label="Booking flow steps" className="flex items-center gap-1 sm:gap-1.5 text-[11px] font-bold overflow-x-auto py-1 no-scrollbar shrink-0">
                    {/* Step 1: Details (Always accessible) */}
                    <button
                        type="button"
                        onClick={() => handleStepClick("landing")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                            activeView === "landing"
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/20"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                        }`}
                    >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${activeView === "landing" ? "bg-black/30 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                            1
                        </span>
                        <span>Damage Details</span>
                    </button>

                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Step 2: Specialists */}
                    <button
                        type="button"
                        onClick={() => handleStepClick("technicians")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                            activeView === "technicians" || activeView === "provider_profile" || activeView === "request_quote"
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/20 cursor-pointer"
                                : canAccessStep2
                                    ? "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer"
                                    : "text-zinc-600 opacity-40 cursor-not-allowed border border-transparent"
                        }`}
                        title={!canAccessStep2 ? "Enter registration and postcode in Step 1 to unlock" : undefined}
                    >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${activeView === "technicians" || activeView === "provider_profile" || activeView === "request_quote" ? "bg-black/30 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
                            2
                        </span>
                        <span>Bodyshops</span>
                        {!canAccessStep2 && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    </button>

                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Step 3: Quotes & Bids */}
                    <button
                        type="button"
                        onClick={() => handleStepClick("quotes")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                            activeView === "quotes"
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/20 cursor-pointer"
                                : canAccessStep3
                                    ? "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer"
                                    : "text-zinc-600 opacity-40 cursor-not-allowed border border-transparent"
                        }`}
                        title={!canAccessStep3 ? "Send quotation to bodyshops first to unlock" : undefined}
                    >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${activeView === "quotes" ? "bg-black/30 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
                            3
                        </span>
                        <span>Quotes &amp; Bids</span>
                        {activeBidsCount > 0 ? (
                            <span className="bg-emerald-500 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black animate-pulse">
                                {activeBidsCount} offer{activeBidsCount > 1 ? "s" : ""}
                            </span>
                        ) : myQuotesCount > 0 ? (
                            <span className="bg-[#E8AF66]/20 text-[#E8AF66] px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                                {myQuotesCount}
                            </span>
                        ) : !canAccessStep3 ? (
                            <Lock className="w-2.5 h-2.5 text-zinc-500" />
                        ) : null}
                    </button>

                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Step 4: Booking */}
                    <button
                        type="button"
                        onClick={() => handleStepClick("booking")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                            activeView === "booking"
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/20 cursor-pointer"
                                : canAccessStep4
                                    ? "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer"
                                    : "text-zinc-600 opacity-40 cursor-not-allowed border border-transparent"
                        }`}
                        title={!canAccessStep4 ? "Accept an offer in Quotes & Bids to book" : undefined}
                    >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${activeView === "booking" ? "bg-black/30 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
                            4
                        </span>
                        <span>Booking</span>
                        {!canAccessStep4 && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    </button>
                </nav>

                {/* Right: Quick Quotation Hub button */}
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleStepClick("quotes")}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                            canAccessStep3
                                ? "bg-zinc-900 border-zinc-700/80 hover:border-[#E8AF66] text-zinc-200 hover:text-white cursor-pointer"
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 text-[#E8AF66]" />
                        <span>My Quotes</span>
                        {myQuotesCount > 0 && (
                            <span className="bg-[#E8AF66] text-zinc-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                                {myQuotesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
