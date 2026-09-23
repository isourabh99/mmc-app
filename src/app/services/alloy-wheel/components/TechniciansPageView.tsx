"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    Wrench,
    MapPin,
    Star,
    User,
    Check,
    Phone,
    Mail,
    BadgeCheck,
    ArrowRight,
    Eye,
    Send,
    RefreshCw,
    Search,
    BookOpen,
    Filter,
} from "lucide-react";
import type { ProviderItem } from "@/lib/service/alloy.api";

interface TechniciansPageViewProps {
    providers: ProviderItem[];
    searchingProviders: boolean;
    selectedProviderIdsForQuote: string[];
    onToggleProviderSelection: (id: string) => void;
    onToggleSelectAll: () => void;
    onOpenProviderProfile: (provider: ProviderItem) => void;
    onOpenQuoteForm: (provider: ProviderItem) => void;
    onSendMultiQuoteRequest: () => Promise<void>;
    submittingMultiQuote: boolean;
    onBackToSearch: () => void;
    onViewQuotes: () => void;
    regNo: string;
    postcode: string;
    selectedServices: string[];
    onOpenMap?: () => void;
}

export default function TechniciansPageView({
    providers,
    searchingProviders,
    selectedProviderIdsForQuote,
    onToggleProviderSelection,
    onToggleSelectAll,
    onOpenProviderProfile,
    onOpenQuoteForm,
    onSendMultiQuoteRequest,
    submittingMultiQuote,
    onBackToSearch,
    onViewQuotes,
    regNo,
    postcode,
    selectedServices,
    onOpenMap,
}: TechniciansPageViewProps) {
    const [filterQuery, setFilterQuery] = useState("");

    const filteredProviders = providers.filter((p) => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase();
        return (
            p.company_name?.toLowerCase().includes(q) ||
            p.contact_person_name?.toLowerCase().includes(q) ||
            p.company_address?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-12 animate-fade-in space-y-6 pb-28">
            {/* Top Search Context Banner */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider text-[11px]">
                            <Wrench className="w-3.5 h-3.5 text-[#E8AF66]" />
                            <span>Live Specialist Discovery</span>
                        </span>
                        {regNo && (
                            <span className="font-extrabold text-white bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 uppercase tracking-wider text-[11px]">
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
                            ? `Found ${providers.length} verified specialist${providers.length > 1 ? "s" : ""} ready to service your alloy wheels. Select technicians to send request for quote.`
                            : "Searching mobile alloy wheel specialists in your selected area..."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {onOpenMap && (
                        <button
                            type="button"
                            onClick={onOpenMap}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                            <BookOpen className="w-4 h-4 text-[#E8AF66]" />
                            <span>View Radar Map</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onBackToSearch}
                        className="bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                        Modify Search
                    </button>
                </div>
            </div>

            {/* State 1: Searching Animation */}
            {searchingProviders && (
                <div className="rounded-3xl bg-[#141518] border border-zinc-800/90 p-16 text-center flex flex-col items-center justify-center my-6 shadow-2xl">
                    <div className="w-14 h-14 border-4 border-[#E8AF66] border-t-transparent rounded-full animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-white mb-1">
                        Searching Nearby Technicians...
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
                        Connecting to live network and finding top rated mobile alloy wheel specialists in your area...
                    </p>
                </div>
            )}

            {/* State 2: No Technicians Found */}
            {!searchingProviders && providers.length === 0 && (
                <div className="rounded-3xl bg-[#141518] border border-zinc-800/90 p-12 sm:p-16 text-center flex flex-col items-center justify-center my-6 shadow-2xl space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                        <MapPin className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div className="space-y-1 max-w-md">
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                            No Technicians Found Nearby
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400">
                            No active mobile specialists were found for the selected services in this specific area.
                            Try choosing additional service types or adjusting your postcode.
                        </p>
                    </div>
                    <div className="pt-2 flex items-center gap-3 flex-wrap justify-center">
                        <button
                            type="button"
                            onClick={onBackToSearch}
                            className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-[#D5A054]/20 cursor-pointer active:scale-95"
                        >
                            Modify Search Details
                        </button>
                        <button
                            type="button"
                            onClick={onViewQuotes}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all cursor-pointer"
                        >
                            View Past Quotations
                        </button>
                    </div>
                </div>
            )}

            {/* State 3: Technicians List */}
            {!searchingProviders && providers.length > 0 && (
                <div className="space-y-6">
                    {/* Multi-Provider Selection Toolbar */}
                    <div className="bg-[#16171B] border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onToggleSelectAll}
                                className="flex items-center gap-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-700 transition-colors cursor-pointer select-none active:scale-95"
                            >
                                <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        selectedProviderIdsForQuote.length === providers.length && providers.length > 0
                                            ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                            : "border-zinc-500 bg-zinc-950"
                                    }`}
                                >
                                    {selectedProviderIdsForQuote.length === providers.length && providers.length > 0 && (
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    )}
                                </div>
                                <span>
                                    {selectedProviderIdsForQuote.length === providers.length
                                        ? "Deselect All"
                                        : "Select All Providers"}
                                </span>
                            </button>

                            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                                (<strong className="text-[#E8AF66]">{selectedProviderIdsForQuote.length}</strong> of {providers.length} selected for quotation)
                            </span>
                        </div>

                        {/* Search Filter Inside List */}
                        <div className="relative min-w-[200px]">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                placeholder="Filter technician name..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>
                    </div>

                    {/* Providers Grid */}
                    <div
                        className={`grid grid-cols-1 ${
                            filteredProviders.length === 1
                                ? "max-w-2xl mx-auto"
                                : filteredProviders.length === 2
                                ? "md:grid-cols-2"
                                : "md:grid-cols-2 lg:grid-cols-3"
                        } gap-5 sm:gap-6`}
                    >
                        {filteredProviders.map((provider) => {
                            const isSelectedForQuote = selectedProviderIdsForQuote.includes(provider.id);
                            const phone = provider.contact_person_phone || provider.company_phone;
                            const email = provider.contact_person_email || provider.company_email;
                            const contactPerson = provider.contact_person_name || provider.company_name;
                            const isMMC =
                                provider.company_name.toLowerCase().includes("motor market") ||
                                provider.company_name.toLowerCase().includes("mmc");

                            return (
                                <div
                                    key={provider.id}
                                    className={`group relative rounded-3xl bg-[#141518] border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-xl ${
                                        isSelectedForQuote
                                            ? "border-[#E8AF66] ring-2 ring-[#E8AF66]/60 shadow-[0_0_25px_rgba(232,175,102,0.18)] bg-[#17181D]"
                                            : "border-zinc-800/90 hover:border-zinc-700"
                                    }`}
                                >
                                    <div>
                                        {/* Top Badges & Select Checkbox */}
                                        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800/70">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Active Live
                                                </span>
                                                {isMMC && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-2 py-0.5 rounded-full border border-[#E8AF66]/30 uppercase tracking-wider">
                                                        Official Partner
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selection Checkbox Pill */}
                                            <button
                                                type="button"
                                                onClick={() => onToggleProviderSelection(provider.id)}
                                                className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                                    isSelectedForQuote
                                                        ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 border-[#D5A054] shadow-sm shadow-[#D5A054]/25"
                                                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                                                }`}
                                            >
                                                <div
                                                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                                        isSelectedForQuote
                                                            ? "bg-black border-black text-[#D5A054]"
                                                            : "border-zinc-500 bg-zinc-950"
                                                    }`}
                                                >
                                                    {isSelectedForQuote && (
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    )}
                                                </div>
                                                <span>{isSelectedForQuote ? "Selected" : "Select"}</span>
                                            </button>
                                        </div>

                                        {/* Provider Header: Logo, Name, Rating, Portfolio Button */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Logo Avatar */}
                                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-zinc-800 shrink-0 bg-black flex items-center justify-center p-1.5 shadow-inner">
                                                    {provider.logo_full_path ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={provider.logo_full_path}
                                                            alt={provider.company_name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : isMMC ? (
                                                        <div className="flex flex-col items-center justify-center text-center">
                                                            <span
                                                                className="text-base font-extrabold tracking-wider leading-none"
                                                                style={{
                                                                    background:
                                                                        "linear-gradient(135deg, #FAD293, #CEA46B)",
                                                                    WebkitBackgroundClip: "text",
                                                                    WebkitTextFillColor: "transparent",
                                                                }}
                                                            >
                                                                MMC
                                                            </span>
                                                            <span className="text-[7px] text-zinc-400 tracking-tighter uppercase mt-0.5">
                                                                Connect
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-base font-bold text-[#E8AF66]">
                                                            {provider.company_name.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight capitalize truncate group-hover:text-[#E8AF66] transition-colors">
                                                        {provider.company_name}
                                                    </h3>

                                                    {/* Contact Person */}
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-1 truncate">
                                                        <User className="w-3.5 h-3.5 text-[#E8AF66] shrink-0" />
                                                        <span className="truncate font-medium">{contactPerson}</span>
                                                    </div>

                                                    {/* Rating */}
                                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                                        <div className="flex items-center gap-1 text-white font-bold">
                                                            <Star className="w-3.5 h-3.5 fill-[#E8AF66] text-[#E8AF66]" />
                                                            <span>
                                                                {provider.avg_rating > 0
                                                                    ? Number(provider.avg_rating).toFixed(1)
                                                                    : "4.9"}
                                                            </span>
                                                        </div>
                                                        <span className="text-zinc-500 text-[11px]">
                                                            (
                                                            {provider.rating_count > 0
                                                                ? `${provider.rating_count} Reviews`
                                                                : "Verified Partner"}
                                                            )
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* My work button */}
                                            <button
                                                type="button"
                                                onClick={() => onOpenProviderProfile(provider)}
                                                className="bg-[#E8AF66] hover:bg-[#d89e55] active:scale-95 text-zinc-950 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 shadow-md shadow-[#E8AF66]/20 cursor-pointer"
                                            >
                                                <span>My work</span>
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Address & Contact Info */}
                                        <div className="bg-[#191A1E] rounded-2xl p-3.5 border border-zinc-800/80 mb-4 space-y-2 text-xs">
                                            <div className="flex items-start gap-2 text-zinc-200">
                                                <MapPin className="w-4 h-4 text-[#E8AF66] shrink-0 mt-0.5" />
                                                <span className="font-medium leading-relaxed">
                                                    {provider.company_address || "Location on Request"}
                                                    {provider.postcode
                                                        ? ` (${provider.postcode.toUpperCase()})`
                                                        : ""}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 flex-wrap">
                                                {phone && (
                                                    <a
                                                        href={`tel:${phone}`}
                                                        className="inline-flex items-center gap-1.5 bg-black/40 hover:bg-zinc-800/80 border border-zinc-800 px-2.5 py-1 rounded-lg hover:text-[#E8AF66] transition-colors"
                                                    >
                                                        <Phone className="w-3 h-3 text-[#E8AF66]" />
                                                        <span>{phone}</span>
                                                    </a>
                                                )}
                                                {email && (
                                                    <a
                                                        href={`mailto:${email}`}
                                                        className="inline-flex items-center gap-1.5 bg-black/40 hover:bg-zinc-800/80 border border-zinc-800 px-2.5 py-1 rounded-lg hover:text-[#E8AF66] transition-colors truncate max-w-[200px]"
                                                    >
                                                        <Mail className="w-3 h-3 text-[#E8AF66]" />
                                                        <span className="truncate">{email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Services Breakdown */}
                                        {provider.selected_services && provider.selected_services.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between px-0.5">
                                                    <span>Services Included</span>
                                                    <span>Base Rate</span>
                                                </div>
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                    {provider.selected_services.map((svc, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between text-xs bg-black/40 px-3 py-2 rounded-xl border border-zinc-800/70"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                                <Wrench className="w-3.5 h-3.5 text-[#E8AF66] shrink-0" />
                                                                <span className="text-zinc-200 font-medium truncate">
                                                                    {svc.service_name}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0 text-[11px]">
                                                                Available
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ID Verification & Turnaround */}
                                        {provider.owner && (
                                            <div className="flex items-center justify-between text-xs text-zinc-400 py-2 px-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 mb-2">
                                                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                                                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                                                    <span>
                                                        ID:{" "}
                                                        {provider.owner.identification_type
                                                            ? provider.owner.identification_type.toUpperCase()
                                                            : "VERIFIED"}
                                                    </span>
                                                </span>
                                                <span className="text-zinc-400 text-[11px]">
                                                    Turnaround: 2-3 hours
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price & Action Button Footer */}
                                    <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-zinc-800/80 bg-[#121316] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl">
                                        <button
                                            type="button"
                                            onClick={() => onOpenQuoteForm(provider)}
                                            className="w-full bg-[#E8AF66] hover:bg-[#d89e55] active:scale-95 text-zinc-950 font-black text-xs sm:text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#E8AF66]/20 cursor-pointer uppercase tracking-wider"
                                        >
                                            <span>Request Direct Quote</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Sticky Action Bar for Multi-Quote Selection */}
                    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#141518]/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                <button
                                    type="button"
                                    onClick={onToggleSelectAll}
                                    className="text-xs text-zinc-400 hover:text-white font-semibold underline cursor-pointer"
                                >
                                    {selectedProviderIdsForQuote.length === providers.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </button>
                                <span className="text-xs text-zinc-300 font-medium">
                                    <strong className="text-[#E8AF66]">{selectedProviderIdsForQuote.length}</strong> of {providers.length} technicians selected
                                </span>
                            </div>

                            <button
                                type="button"
                                disabled={selectedProviderIdsForQuote.length === 0 || submittingMultiQuote}
                                onClick={onSendMultiQuoteRequest}
                                className="w-full sm:w-auto bg-gradient-to-r from-[#D89B4C] via-[#E8AF66] to-[#C78736] hover:brightness-110 active:scale-[0.99] text-zinc-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 uppercase tracking-wider shadow-lg shadow-[#E8AF66]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                {submittingMultiQuote ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                                        <span>Sending Quotation Requests...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Quotation to {selectedProviderIdsForQuote.length} Selected</span>
                                        <Send className="w-4 h-4 text-zinc-950" />
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
