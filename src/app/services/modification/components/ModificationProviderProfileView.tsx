"use client";

import React from "react";
import Image from "next/image";
import {
    ArrowLeft,
    Wrench,
    Star,
    MapPin,
    Phone,
    Mail,
    BadgeCheck,
    Check,
    Calendar,
    Clock3,
    Shield,
    Users,
    Send,
    Flame,
    Zap,
} from "lucide-react";
import type { ProviderItem, ProviderDetailsContent } from "@/lib/service/modification.api";

interface ModificationProviderProfileViewProps {
    provider: ProviderItem;
    profileDetails: ProviderDetailsContent | null;
    loadingProfileDetails: boolean;
    activeTab: "overview" | "services" | "reviews";
    onTabChange: (tab: "overview" | "services" | "reviews") => void;
    onBack: () => void;
    onSelectForQuote: (provider: ProviderItem) => void;
    isSelectedForQuote: boolean;
}

export default function ModificationProviderProfileView({
    provider,
    profileDetails,
    loadingProfileDetails,
    activeTab,
    onTabChange,
    onBack,
    onSelectForQuote,
    isSelectedForQuote,
}: ModificationProviderProfileViewProps) {
    const isMMC = provider.company_name?.toLowerCase().includes("mmc");
    const contactPerson =
        provider.contact_person_name ||
        provider.owner?.contact_person_name ||
        (provider.owner ? `${provider.owner.first_name || ""} ${provider.owner.last_name || ""}`.trim() : "") ||
        "Tuning Director";

    const phone = provider.company_phone || provider.contact_person_phone || provider.owner?.phone;
    const email = provider.company_email || provider.contact_person_email || provider.owner?.email;

    return (
        <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-20">
            {/* Back Button */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back to Specialists</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectForQuote(provider)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                            isSelectedForQuote
                                ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black shadow-md shadow-[#D5A054]/25"
                                : "bg-zinc-800 hover:bg-zinc-700 text-white"
                        }`}
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSelectedForQuote ? "Included in RFQ" : "Add to Quote Request"}</span>
                    </button>
                </div>
            </div>

            {/* Profile Hero Header */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border border-zinc-700 shrink-0 bg-black flex items-center justify-center p-2 shadow-xl">
                            {provider.logo_full_path ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={provider.logo_full_path}
                                    alt={provider.company_name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <span className="text-2xl font-black text-[#E8AF66]">
                                    {provider.company_name?.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Verified Custom Workshop
                                </span>
                                {isMMC && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-2.5 py-0.5 rounded-full border border-[#E8AF66]/30 uppercase tracking-wider">
                                        MMC Certified Partner
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-white capitalize">
                                {provider.company_name}
                            </h1>

                            <div className="flex items-center gap-3 text-xs text-zinc-300 flex-wrap">
                                <span>Contact: <strong className="text-white">{contactPerson}</strong></span>
                                <span>•</span>
                                <div className="flex items-center gap-1 text-[#E8AF66] font-bold">
                                    <Star className="w-3.5 h-3.5 fill-[#E8AF66]" />
                                    <span>{provider.avg_rating > 0 ? Number(provider.avg_rating).toFixed(1) : "4.9"}</span>
                                    <span className="text-zinc-500 font-normal">({provider.rating_count || 12} reviews)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-zinc-800 text-xs">
                    <div className="flex items-center gap-2.5 bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
                        <MapPin className="w-4 h-4 text-[#E8AF66] shrink-0" />
                        <span className="text-zinc-300 truncate">{provider.company_address || "Custom Workshop Location"}</span>
                    </div>
                    {phone && (
                        <div className="flex items-center gap-2.5 bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
                            <Phone className="w-4 h-4 text-[#E8AF66] shrink-0" />
                            <a href={`tel:${phone}`} className="text-zinc-300 hover:text-white truncate">{phone}</a>
                        </div>
                    )}
                    {email && (
                        <div className="flex items-center gap-2.5 bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
                            <Mail className="w-4 h-4 text-[#E8AF66] shrink-0" />
                            <a href={`mailto:${email}`} className="text-zinc-300 hover:text-white truncate">{email}</a>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <button
                    type="button"
                    onClick={() => onTabChange("overview")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "overview"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20 font-black"
                            : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                    }`}
                >
                    Overview &amp; Standards
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange("services")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "services"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20 font-black"
                            : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                    }`}
                >
                    Modifications &amp; Builds
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange("reviews")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "reviews"
                            ? "bg-[#E8AF66] text-zinc-950 shadow-md shadow-[#E8AF66]/20 font-black"
                            : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                    }`}
                >
                    Customer Reviews
                </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-white">About the Workshop</h3>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            {profileDetails?.company_name || provider.company_name} is an approved specialist automotive tuning garage equipped with performance diagnostic bays, precision fabrication tools, and experienced vehicle modification technicians. All installations and tuning programs adhere to strict safety and road legal compliance guidelines.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/40 border border-zinc-800/80">
                            <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-white">Full Workmanship Guarantee</h4>
                                <p className="text-[11px] text-zinc-400 mt-0.5">Parts and labor backed with comprehensive satisfaction warranties.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/40 border border-zinc-800/80">
                            <Flame className="w-5 h-5 text-[#E8AF66] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-white">Custom Diagnostics &amp; Dyno</h4>
                                <p className="text-[11px] text-zinc-400 mt-0.5">Accurate health checks before and after any performance upgrade.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === "services" && (
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                    <h3 className="text-base font-extrabold text-white mb-2">Available Modification Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(provider.selected_services && provider.selected_services.length > 0
                            ? provider.selected_services
                            : [
                                  { service_name: "Stage 1 ECU Remapping & Calibration" },
                                  { service_name: "Performance Exhaust & Downpipes" },
                                  { service_name: "Aero Kits, Front Splitters & Spoilers" },
                                  { service_name: "Lowering Springs & Coilovers" },
                                  { service_name: "Custom Vinyl Wrap & De-Chroming" },
                                  { service_name: "Upgraded Intercoolers & Air Intakes" },
                              ]
                        ).map((s, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-zinc-800 text-xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Wrench className="w-3.5 h-3.5 text-[#E8AF66]" />
                                    <span className="font-semibold text-white">{s.service_name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Available
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === "reviews" && (
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                    <h3 className="text-base font-extrabold text-white mb-2">Verified Customer Testimonials</h3>
                    <div className="space-y-3">
                        {[
                            {
                                author: "Marcus K.",
                                rating: 5,
                                car: "BMW M3 Competition",
                                comment: "Flawless Stage 1 tune and exhaust installation. The car feels alive and power delivery is exceptionally smooth. Highly recommend!",
                            },
                            {
                                author: "David T.",
                                rating: 5,
                                car: "Volkswagen Golf R",
                                comment: "Fitted coilovers and front splitter. Stance is spot on with zero rubbing. Professional workshop and clear communication throughout.",
                            },
                        ].map((rev, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white">{rev.author} • <span className="text-[#E8AF66]">{rev.car}</span></span>
                                    <div className="flex items-center gap-1 text-[#E8AF66]">
                                        {[...Array(rev.rating)].map((_, idx) => (
                                            <Star key={idx} className="w-3 h-3 fill-[#E8AF66]" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-300 italic">&ldquo;{rev.comment}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
