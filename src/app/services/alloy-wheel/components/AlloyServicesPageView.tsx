"use client";

import React, { useState, useMemo } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Car,
    MapPin,
    Check,
    Disc,
    RefreshCw,
    X,
} from "lucide-react";
import type { AlloyServiceItem } from "@/lib/service/alloy.api";

export interface AlloyServiceOption {
    id: string;
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string | null;
}

export const ALLOY_SERVICE_OPTIONS: AlloyServiceOption[] = [
    {
        id: "cosmetic_refurbishment",
        title: "Cosmetic refurbishment",
        description: "Repair kerb rash, corrosion and surface damage",
    },
    {
        id: "diamond_cut_refurbishment",
        title: "Diamond-cut refurbishment",
        description: "Restore diamond-cut finish and protect",
    },
    {
        id: "colour_change",
        title: "Colour change",
        description: "Change the colour of your alloy wheels",
    },
    {
        id: "crack_repair",
        title: "Crack repair",
        description: "Weld and repair cracks and damage",
    },
    {
        id: "buckled_wheel_repair",
        title: "Buckled wheel repair",
        description: "Straighten buckled or vibrating wheels",
    },
    {
        id: "wheel_replacement",
        title: "Wheel replacement",
        description: "Supply and fit quality replacement wheels",
    },
];

interface AlloyServicesPageViewProps {
    regNo: string;
    postcode: string;
    carYear?: string;
    selectedServices: string[];
    onToggleService: (serviceName: string) => void;
    workLocation: "workshop" | "mobile";
    onChangeWorkLocation: (loc: "workshop" | "mobile") => void;
    onBack: () => void;
    onSubmit: () => Promise<void>;
    submitting: boolean;
    services?: AlloyServiceItem[];
    loadingServices?: boolean;
}

export default function AlloyServicesPageView({
    regNo,
    postcode,
    carYear,
    selectedServices,
    onToggleService,
    workLocation,
    onChangeWorkLocation,
    onBack,
    onSubmit,
    submitting,
    services = [],
    loadingServices = false,
}: AlloyServicesPageViewProps) {
    const [errorMsg, setErrorMsg] = useState("");

    // Resolve service items to display with images from the API
    const displayServices = useMemo(() => {
        if (services && services.length > 0) {
            return services.map((s) => {
                const matchedStatic = ALLOY_SERVICE_OPTIONS.find(
                    (opt) => opt.title.toLowerCase() === (s.name || "").toLowerCase()
                );
                const rawImg =
                    s.thumbnail_full_path ||
                    s.cover_image_full_path ||
                    s.image_full_path ||
                    s.thumbnail ||
                    s.cover_image ||
                    s.image ||
                    null;

                return {
                    id: s.id,
                    title: s.name,
                    description:
                        s.short_description ||
                        s.description ||
                        matchedStatic?.description ||
                        "Alloy wheel refurbishment and repair",
                    imageUrl: rawImg,
                };
            });
        }

        // Fallback to static options if services not yet loaded
        return ALLOY_SERVICE_OPTIONS.map((opt) => ({
            id: opt.id,
            title: opt.title,
            description: opt.description,
            imageUrl: null,
        }));
    }, [services]);

    const handleContinue = async () => {
        if (selectedServices.length === 0) {
            setErrorMsg("Please select at least one alloy wheel service.");
            return;
        }
        setErrorMsg("");
        await onSubmit();
    };

    return (
        <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-fade-in space-y-6 pb-24">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141518] border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back</span>
                </button>

                {/* Progress Pill Indicator */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                    <span className="w-6 h-6 rounded-full bg-[#E8AF66] text-zinc-950 flex items-center justify-center text-xs">
                        2
                    </span>
                    <span className="text-zinc-400">Step 2 of 3</span>
                </div>
            </div>

            {/* Vehicle Header Card (Reference Screenshot 2) */}
            <div className="rounded-2xl border border-zinc-800/90 bg-[#141518] p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 p-2 text-[#E8AF66]">
                        <Car className="w-8 h-8 text-[#E8AF66]" />
                    </div>

                    <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-[#E8AF66] font-bold">
                            Alloy Wheel Refurbishment
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white truncate">
                            {regNo ? `Vehicle ${regNo}` : "Custom Vehicle"} {carYear ? `(${carYear})` : ""}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                            {regNo && (
                                <span className="bg-zinc-800 text-zinc-200 text-[10px] font-extrabold px-2 py-0.5 rounded border border-zinc-700 uppercase">
                                    {regNo}
                                </span>
                            )}
                            {postcode && (
                                <span className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                                    <MapPin size={11} className="text-[#E8AF66]" />
                                    <span>{postcode}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Section 1: Choose Your Service (Reference Screenshot 2) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Choose your service
                    </h2>
                    <span className="text-xs text-zinc-400">
                        {selectedServices.length} selected
                    </span>
                </div>

                <div className="space-y-2.5">
                    {displayServices.map((svc) => {
                        const isSelected =
                            selectedServices.includes(svc.title) ||
                            selectedServices.includes(svc.id) ||
                            selectedServices.some(
                                (s) => s.toLowerCase() === svc.title.toLowerCase()
                            );
                        return (
                            <div
                                key={svc.id}
                                onClick={() => onToggleService(svc.title)}
                                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isSelected
                                        ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                                        : "bg-[#141518] border-zinc-800/90 hover:border-zinc-700 hover:bg-[#18191D]"
                                }`}
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Service Image / Icon */}
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all overflow-hidden relative ${
                                            isSelected
                                                ? "bg-[#D5A054]/15 border-[#D5A054]/50 text-[#D5A054] shadow-md shadow-[#D5A054]/10"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                                        }`}
                                    >
                                        {svc.imageUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={svc.imageUrl}
                                                alt={svc.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    // Fallback to icon if image fails
                                                    (e.currentTarget as HTMLElement).style.display = "none";
                                                    const parent = e.currentTarget.parentElement;
                                                    const icon = parent?.querySelector(".fallback-disc");
                                                    if (icon) (icon as HTMLElement).style.display = "flex";
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`fallback-disc w-full h-full items-center justify-center ${
                                                svc.imageUrl ? "hidden" : "flex"
                                            }`}
                                        >
                                            <Disc className="w-6 h-6 stroke-[1.8]" />
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-white group-hover:text-[#E8AF66] transition-colors leading-snug">
                                            {svc.title}
                                        </h4>
                                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                            {svc.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Radio / Check Indicator */}
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                        isSelected
                                            ? "bg-[#D5A054] border-[#D5A054] text-zinc-950 font-bold"
                                            : "border-zinc-700 bg-zinc-900/60"
                                    }`}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Action Button (Matches Screenshot 2: Back button + NEXT ->) */}
            <div className="pt-2 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-4 rounded-2xl bg-[#141518] border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#E8AF66] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5 text-[#E8AF66]" />
                </button>

                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                    <span>NEXT</span>
                    <ArrowRight className="w-5 h-5 text-zinc-950" />
                </button>
            </div>
        </div>
    );
}
