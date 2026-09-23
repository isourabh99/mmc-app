"use client";

import React from "react";
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
    ArrowLeft,
    Clock3,
    ShieldCheck,
    Calendar,
    Zap,
    Truck,
} from "lucide-react";
import type { ProviderItem, ProviderDetailsContent } from "@/lib/service/alloy.api";

interface ProviderProfilePageViewProps {
    provider: ProviderItem;
    profileDetails: ProviderDetailsContent | null;
    loadingProfileDetails: boolean;
    activeTab: "overview" | "services" | "reviews";
    onTabChange: (tab: "overview" | "services" | "reviews") => void;
    onBack: () => void;
    onBookDirect?: (provider: ProviderItem) => void;
    onSelectForQuote: (provider: ProviderItem) => void;
    isSelectedForQuote: boolean;
}

export default function ProviderProfilePageView({
    provider,
    profileDetails,
    loadingProfileDetails,
    activeTab,
    onTabChange,
    onBack,
    onBookDirect,
    onSelectForQuote,
    isSelectedForQuote,
}: ProviderProfilePageViewProps) {
    const fullProvider = profileDetails?.provider || provider;
    const phone = fullProvider.contact_person_phone || fullProvider.company_phone;
    const email = fullProvider.contact_person_email || fullProvider.company_email;
    const subCats = profileDetails?.sub_categories || [];
    const totalServices = subCats.reduce((acc, c) => acc + (c.services?.length || 0), 0);
    const isMMC =
        fullProvider.company_name?.toLowerCase().includes("motor market") ||
        fullProvider.company_name?.toLowerCase().includes("mmc");

    return (
        <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-4 pb-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back to Technicians List</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectForQuote(provider)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelectedForQuote
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 border-[#D5A054] shadow-md shadow-[#D5A054]/20"
                                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white"
                        }`}
                    >
                        {isSelectedForQuote ? "✓ Selected for Quote" : "+ Add to Quote Request"}
                    </button>
                </div>
            </div>

            {/* Provider Hero Card */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Logo */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black border border-zinc-800 p-2 flex items-center justify-center shrink-0 shadow-inner">
                            {fullProvider.logo_full_path ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={fullProvider.logo_full_path}
                                    alt={fullProvider.company_name}
                                    className="w-full h-full object-contain"
                                />
                            ) : isMMC ? (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <span
                                        className="text-xl font-black tracking-wider leading-none"
                                        style={{
                                            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}
                                    >
                                        MMC
                                    </span>
                                    <span className="text-[8px] text-zinc-400 tracking-tighter uppercase mt-0.5">
                                        Connect
                                    </span>
                                </div>
                            ) : (
                                <span className="text-2xl font-bold text-[#E8AF66]">
                                    {fullProvider.company_name?.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                    Verified MMC Partner
                                </span>
                                {fullProvider.owner?.identification_type && (
                                    <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700 uppercase">
                                        ID: {fullProvider.owner.identification_type}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-white capitalize leading-tight">
                                {fullProvider.company_name}
                            </h2>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
                                <User className="w-3.5 h-3.5 text-[#E8AF66] shrink-0" />
                                <span>{fullProvider.contact_person_name || "Primary Specialist"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-white font-bold">
                                    <Star className="w-4 h-4 fill-[#E8AF66] text-[#E8AF66]" />
                                    <span>
                                        {fullProvider.avg_rating > 0
                                            ? Number(fullProvider.avg_rating).toFixed(1)
                                            : "4.9"}
                                    </span>
                                </div>
                                <span className="text-zinc-500">
                                    ({fullProvider.rating_count > 0 ? `${fullProvider.rating_count} Reviews` : "Verified Partner"})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Add to Quote Action */}
                    <div className="shrink-0 flex flex-col sm:items-end gap-2">
                        <button
                            type="button"
                            onClick={() => onSelectForQuote(provider)}
                            className={`font-black text-xs sm:text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                                isSelectedForQuote
                                    ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-[#D5A054]/20"
                                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-[#E8AF66]"
                            }`}
                        >
                            <span>{isSelectedForQuote ? "✓ Selected for Quote" : "+ Request Quotation"}</span>
                        </button>
                    </div>
                </div>

                {/* Contact Bar */}
                <div className="bg-[#191A1E] rounded-2xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="w-4 h-4 text-[#E8AF66] shrink-0" />
                        <span>{fullProvider.company_address || "Workshop & Mobile Coverage on Request"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {phone && (
                            <a
                                href={`tel:${phone}`}
                                className="inline-flex items-center gap-1.5 bg-black/40 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl hover:text-[#E8AF66] transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5 text-[#E8AF66]" />
                                <span>{phone}</span>
                            </a>
                        )}
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center gap-1.5 bg-black/40 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl hover:text-[#E8AF66] transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5 text-[#E8AF66]" />
                                <span>{email}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <button
                    type="button"
                    onClick={() => onTabChange("overview")}
                    className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === "overview"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20"
                            : "text-zinc-400 hover:text-white bg-zinc-900/60"
                    }`}
                >
                    Overview &amp; Credentials
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange("services")}
                    className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "services"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20"
                            : "text-zinc-400 hover:text-white bg-zinc-900/60"
                    }`}
                >
                    <span>Services Offered</span>
                    {totalServices > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "services" ? "bg-black/30 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                            {totalServices}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange("reviews")}
                    className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === "reviews"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20"
                            : "text-zinc-400 hover:text-white bg-zinc-900/60"
                    }`}
                >
                    Refurbishment Gallery &amp; Reviews
                </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <div className="space-y-3">
                        <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                            About This Specialist
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            {fullProvider.about_us ||
                                `${fullProvider.company_name} is a certified alloy wheel refurbishment and mobile cosmetic repair specialist. Fully equipped with CNC diamond cutting mobile tooling, hydraulic straightening rigs, and factory powder coating facilities.`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                            <Clock3 className="w-5 h-5 text-[#E8AF66] mx-auto mb-1" />
                            <div className="text-[11px] text-zinc-400 uppercase font-bold">Turnaround</div>
                            <div className="text-xs sm:text-sm font-extrabold text-white">2 - 3 Hours</div>
                        </div>
                        <div className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                            <div className="text-[11px] text-zinc-400 uppercase font-bold">Warranty</div>
                            <div className="text-xs sm:text-sm font-extrabold text-white">12 Months</div>
                        </div>
                        <div className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                            <Truck className="w-5 h-5 text-[#E8AF66] mx-auto mb-1" />
                            <div className="text-[11px] text-zinc-400 uppercase font-bold">Service Mode</div>
                            <div className="text-xs sm:text-sm font-extrabold text-white">Mobile Van</div>
                        </div>
                        <div className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                            <BadgeCheck className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <div className="text-[11px] text-zinc-400 uppercase font-bold">Vetted Partner</div>
                            <div className="text-xs sm:text-sm font-extrabold text-white">100% Insured</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Services Offered */}
            {activeTab === "services" && (
                <div className="space-y-4">
                    {subCats.length > 0 ? (
                        subCats.map((cat) => (
                            <div key={cat.id} className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                                    <h4 className="text-sm font-bold text-[#E8AF66] uppercase tracking-wider flex items-center gap-2">
                                        <Wrench className="w-4 h-4" />
                                        <span>{cat.name}</span>
                                    </h4>
                                    <span className="text-xs text-zinc-400">{cat.services?.length || 0} services</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cat.services?.map((svc) => (
                                        <div key={svc.id} className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-bold text-white text-xs sm:text-sm truncate">{svc.name}</div>
                                                {svc.short_description && (
                                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{svc.short_description}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs">
                                                    Available
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400 space-y-2">
                            <Wrench className="w-8 h-8 text-[#E8AF66] mx-auto mb-2" />
                            <p className="text-xs sm:text-sm">Standard alloy wheel services are active and covered by this provider.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Reviews & Past Work */}
            {activeTab === "reviews" && (
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                        Recent Refurbishment Work
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 aspect-video relative">
                            <Image src="/images/alloy-wheel/alloy_before.jpg" alt="Before" fill className="object-cover" />
                            <span className="absolute bottom-3 left-3 text-[11px] bg-black/85 text-white font-extrabold px-3 py-1 rounded-full border border-zinc-700">
                                Scuffed Wheel (Before)
                            </span>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 aspect-video relative">
                            <Image src="/images/alloy-wheel/alloy_after.jpg" alt="After" fill className="object-cover" />
                            <span className="absolute bottom-3 left-3 text-[11px] bg-[#E8AF66] text-black font-extrabold px-3 py-1 rounded-full shadow-lg">
                                Factory Finished (After)
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
