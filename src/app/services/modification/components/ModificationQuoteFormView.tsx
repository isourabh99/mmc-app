"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft,
    Send,
    Wrench,
    Calendar,
    Clock3,
    Car,
    FileText,
    Upload,
    ImageIcon,
    X,
    CheckCircle2,
    Users,
    BadgeCheck,
    AlertCircle,
    ChevronDown,
    ShieldCheck,
    Flame,
    Zap,
} from "lucide-react";
import type { ProviderItem, ModificationServiceItem } from "@/lib/service/modification.api";

interface ModificationQuoteFormViewProps {
    selectedProviders: ProviderItem[];
    allServices: ModificationServiceItem[];
    initialRegNo?: string;
    initialCarYear?: string;
    initialDamageDesc?: string;
    initialCarImage?: File | null;
    initialCarImagePreview?: string | null;
    submitting: boolean;
    onBack: () => void;
    onSubmit: (formData: {
        carReg: string;
        carModel: string;
        selectedServiceIds: string[];
        bookingDate: string;
        bookingTime: string;
        damageDesc: string;
        serviceDesc: string;
        carImage: File | null;
    }) => Promise<void>;
}

export default function ModificationQuoteFormView({
    selectedProviders,
    allServices,
    initialRegNo = "",
    initialCarYear = "",
    initialDamageDesc = "",
    initialCarImage = null,
    initialCarImagePreview = null,
    submitting,
    onBack,
    onSubmit,
}: ModificationQuoteFormViewProps) {
    const [carReg, setCarReg] = useState(initialRegNo || "BD51 SMR");
    const [carModel, setCarModel] = useState("BMW M4 Competition");
    const [carYear, setCarYear] = useState(initialCarYear || "2022");
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
        return allServices.length > 0 ? [allServices[0].id] : [];
    });
    const [showServicesDropdown, setShowServicesDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Default to tomorrow's date
    const [bookingDate, setBookingDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    });
    const [bookingTime, setBookingTime] = useState("11:00:00");
    const [damageDesc, setDamageDesc] = useState(initialDamageDesc || "");
    const [serviceDesc, setServiceDesc] = useState("");
    const [carImage, setCarImage] = useState<File | null>(initialCarImage);
    const [imagePreview, setImagePreview] = useState<string | null>(initialCarImagePreview);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Sync if allServices loads after mount
    useEffect(() => {
        if (selectedServiceIds.length === 0 && allServices.length > 0) {
            setSelectedServiceIds([allServices[0].id]);
        }
    }, [allServices, selectedServiceIds.length]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowServicesDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCarImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setCarImage(null);
        setImagePreview(null);
    };

    const toggleServiceSelection = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!carReg.trim()) {
            setErrorMsg("Please enter your vehicle registration number");
            return;
        }

        if (selectedServiceIds.length === 0) {
            setErrorMsg("Please select at least one modification service");
            return;
        }

        if (!bookingDate) {
            setErrorMsg("Please select a preferred date");
            return;
        }

        try {
            await onSubmit({
                carReg: carReg.trim().toUpperCase(),
                carModel: carYear.trim() ? `${carModel.trim()} (${carYear.trim()})` : (carModel.trim() || "Vehicle"),
                selectedServiceIds,
                bookingDate,
                bookingTime: bookingTime || "11:00:00",
                damageDesc: damageDesc.trim() || "Vehicle modification inspection",
                serviceDesc: serviceDesc.trim() || damageDesc.trim() || "Vehicle customization quote request",
                carImage,
            });
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to submit quotation request. Please try again.");
        }
    };

    const selectedServiceObjects = allServices.filter((s) => selectedServiceIds.includes(s.id));

    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-20">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back to Specialists</span>
                </button>

                <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Selected Specialists</span>
                    <span className="text-xs sm:text-sm font-black text-[#E8AF66]">
                        {selectedProviders.length} Workshop{selectedProviders.length > 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Recipient Workshops Summary Card */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#E8AF66]" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                            Quotes Requested From ({selectedProviders.length})
                        </h3>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                        Workshops will send you tailored price estimates directly
                    </span>
                </div>

                <div className="pt-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {selectedProviders.map((provider) => (
                        <div
                            key={provider.id}
                            className="bg-black/60 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 shrink-0 max-w-[240px]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 p-1">
                                {provider.logo_full_path ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={provider.logo_full_path}
                                        alt={provider.company_name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-xs font-black text-[#E8AF66]">
                                        {provider.company_name?.slice(0, 2).toUpperCase() || "MP"}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                    {provider.company_name}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate">
                                    {provider.contact_person_name || "Specialist"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quotation Request Form */}
            <form onSubmit={handleSubmit} className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#E8AF66] uppercase tracking-wider bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20">
                        <Flame className="w-3.5 h-3.5 text-[#E8AF66]" />
                        <span>Vehicle Modification Quotation</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                        Tell us about your build &amp; requirements
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Provide your vehicle details and required modifications. Verified custom workshops will send you competitive bids.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* 1. Vehicle Registration, Model & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Vehicle Registration <span className="text-[#E8AF66]">*</span>
                        </label>
                        <div className="relative">
                            <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8AF66]" />
                            <input
                                type="text"
                                value={carReg}
                                onChange={(e) => setCarReg(e.target.value.toUpperCase())}
                                placeholder="e.g. BD51 SMR"
                                required
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm font-extrabold text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] tracking-wider"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Make &amp; Model
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={carModel}
                                onChange={(e) => setCarModel(e.target.value)}
                                placeholder="e.g. BMW M4 / Audi RS3"
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Vehicle Year
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8AF66]" />
                            <input
                                type="text"
                                value={carYear}
                                onChange={(e) => setCarYear(e.target.value)}
                                placeholder="e.g. 2022"
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Modification Services Selection */}
                <div ref={dropdownRef} className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Select Desired Modifications <span className="text-[#E8AF66]">*</span>
                    </label>

                    {/* Chips Display & Dropdown Trigger */}
                    <div
                        onClick={() => setShowServicesDropdown((prev) => !prev)}
                        className="min-h-[50px] bg-black/60 border border-zinc-700 rounded-xl p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:border-zinc-500 transition-colors"
                    >
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            {selectedServiceObjects.length > 0 ? (
                                selectedServiceObjects.map((s) => (
                                    <span
                                        key={s.id}
                                        className="inline-flex items-center gap-1 bg-[#E8AF66]/15 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-bold px-2.5 py-1 rounded-lg"
                                    >
                                        <Wrench className="w-3 h-3" />
                                        <span>{s.name}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleServiceSelection(s.id);
                                            }}
                                            className="hover:text-white ml-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-zinc-500 pl-2">Select modification services...</span>
                            )}
                        </div>

                        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${showServicesDropdown ? "rotate-180" : ""}`} />
                    </div>

                    {/* Dropdown Options */}
                    {showServicesDropdown && (
                        <div className="bg-[#18191E] border border-zinc-700 rounded-2xl p-3 shadow-2xl max-h-60 overflow-y-auto space-y-1.5 z-20">
                            {allServices.length === 0 ? (
                                <div className="p-3 text-center text-xs text-zinc-400">
                                    Loading modification services...
                                </div>
                            ) : (
                                allServices.map((service) => {
                                    const isSelected = selectedServiceIds.includes(service.id);
                                    return (
                                        <div
                                            key={service.id}
                                            onClick={() => toggleServiceSelection(service.id)}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${isSelected
                                                    ? "bg-[#E8AF66]/15 border-[#E8AF66]/40 text-white font-bold"
                                                    : "bg-black/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected
                                                            ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                                            : "border-zinc-600 bg-zinc-900"
                                                        }`}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </div>
                                                <span>{service.name}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Preferred Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Preferred Date <span className="text-[#E8AF66]">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8AF66]" />
                            <input
                                type="date"
                                value={bookingDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setBookingDate(e.target.value)}
                                required
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#E8AF66]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Preferred Time
                        </label>
                        <div className="relative">
                            <Clock3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8AF66]" />
                            <select
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#E8AF66] appearance-none"
                            >
                                <option value="09:00:00" className="bg-zinc-900">09:00 AM (Morning)</option>
                                <option value="11:00:00" className="bg-zinc-900">11:00 AM (Mid-day)</option>
                                <option value="14:00:00" className="bg-zinc-900">02:00 PM (Afternoon)</option>
                                <option value="16:00:00" className="bg-zinc-900">04:00 PM (Late Afternoon)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Project Details & Specification */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Project Scope &amp; Parts Specification
                    </label>
                    <textarea
                        value={damageDesc}
                        onChange={(e) => setDamageDesc(e.target.value)}
                        rows={3}
                        placeholder="e.g. Stage 1 Remap + cat-back exhaust installation. Already have parts or need specialist to supply. Looking for dyno graph if available."
                        className="w-full bg-black/60 border border-zinc-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66]"
                    />
                </div>

                {/* 5. Car Photo Upload */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Upload Vehicle / Parts Photos (Optional)
                    </label>
                    {imagePreview ? (
                        <div className="relative w-full max-w-xs h-36 rounded-2xl overflow-hidden border border-zinc-700 group">
                            <Image
                                src={imagePreview}
                                alt="Vehicle Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition-colors">
                            <Upload className="w-7 h-7 text-zinc-400 mb-2" />
                            <span className="text-xs font-bold text-white">Click to upload vehicle photo</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG up to 10MB</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No upfront payment required • Free custom quotes</span>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] hover:from-[#eec477] hover:to-[#c69145] text-zinc-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D5A054]/25 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Sending Request...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Send Request for Quotes</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
