"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { ProviderItem, AlloyServiceItem } from "@/lib/service/alloy.api";
import { isAuthenticated } from "@/lib/auth.api";

interface QuotationFormPageViewProps {
    selectedProviders: ProviderItem[];
    allServices: AlloyServiceItem[];
    initialRegNo?: string;
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

export default function QuotationFormPageView({
    selectedProviders,
    allServices,
    initialRegNo = "",
    initialDamageDesc = "",
    initialCarImage = null,
    initialCarImagePreview = null,
    submitting,
    onBack,
    onSubmit,
}: QuotationFormPageViewProps) {
    const router = useRouter();

    const [carReg, setCarReg] = useState(initialRegNo || "BD51 SMR");
    const [carModel, setCarModel] = useState("Hyundai Creta 2022");
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

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.length > 1
                    ? prev.filter((id) => id !== serviceId)
                    : prev
                : [...prev, serviceId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!isAuthenticated()) {
            setErrorMsg("Please login to submit a quotation request.");
            router.push("/login");
            return;
        }

        if (!carReg.trim()) {
            setErrorMsg("Please enter your vehicle registration number.");
            return;
        }

        if (selectedServiceIds.length === 0) {
            setErrorMsg("Please select at least one alloy wheel service.");
            return;
        }

        if (selectedProviders.length === 0) {
            setErrorMsg("No technicians selected. Please select at least one technician.");
            return;
        }

        try {
            await onSubmit({
                carReg: carReg.trim().toUpperCase(),
                carModel: carModel.trim(),
                selectedServiceIds,
                bookingDate,
                bookingTime,
                damageDesc: damageDesc.trim(),
                serviceDesc: serviceDesc.trim(),
                carImage,
            });
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to submit quotation. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-24">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4 pb-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#E8AF66] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-[#E8AF66]" />
                    <span>Back to Technicians</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
                        {selectedProviders.length} Technician{selectedProviders.length > 1 ? "s" : ""} Selected
                    </span>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                        Multi-Provider RFQ Dispatch
                    </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Request Quotation from Specialists
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
                    Fill in your vehicle details and damage description below. Your request will be sent directly to the selected verified specialists who will respond with competitive, real-time bids.
                </p>

                {/* Selected Technicians Chips */}
                <div className="pt-3 border-t border-zinc-800/80 mt-4">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#E8AF66]" />
                        <span>Sending to:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedProviders.map((p) => (
                            <div
                                key={p.id}
                                className="inline-flex items-center gap-2 bg-[#191A1E] border border-zinc-800 px-3 py-1.5 rounded-xl text-xs"
                            >
                                <div className="w-5 h-5 rounded-full bg-[#E8AF66]/20 border border-[#E8AF66]/40 flex items-center justify-center text-[10px] font-bold text-[#E8AF66]">
                                    {p.company_name?.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="text-white font-semibold truncate max-w-[150px]">
                                    {p.company_name}
                                </span>
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Main Quotation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Vehicle Information */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                        <Car className="w-4 h-4 text-[#E8AF66]" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                            1. Vehicle Details
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Registration Number */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Vehicle Registration <span className="text-[#E8AF66]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={carReg}
                                    onChange={(e) => setCarReg(e.target.value.toUpperCase())}
                                    placeholder="e.g. BD51 SMR"
                                    required
                                    className="w-full bg-[#191A1E] border border-zinc-800 focus:border-[#E8AF66] rounded-2xl px-4 py-3 text-white font-mono font-black text-sm uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none transition-colors"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-[#E8AF66]/10 text-[#E8AF66] px-2 py-0.5 rounded border border-[#E8AF66]/20">
                                    UK REG
                                </span>
                            </div>
                        </div>

                        {/* Car Model */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Car Make &amp; Model
                            </label>
                            <input
                                type="text"
                                value={carModel}
                                onChange={(e) => setCarModel(e.target.value)}
                                placeholder="e.g. Hyundai Creta 2022"
                                className="w-full bg-[#191A1E] border border-zinc-800 focus:border-[#E8AF66] rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none transition-colors font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Alloy Wheel Services */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-[#E8AF66]" />
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                                2. Select Alloy Services
                            </h3>
                        </div>
                        <span className="text-xs text-zinc-400">
                            {selectedServiceIds.length} selected
                        </span>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs text-zinc-400">
                            Select the treatments and repair types you need quotes for:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allServices.map((svc) => {
                                const isSelected = selectedServiceIds.includes(svc.id);
                                return (
                                    <div
                                        key={svc.id}
                                        onClick={() => toggleService(svc.id)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                ? "bg-[#1E1C18] border-[#E8AF66] text-white shadow-md shadow-[#E8AF66]/5"
                                                : "bg-[#191A1E] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-bold text-xs sm:text-sm truncate">
                                                {svc.name}
                                            </div>
                                            {svc.short_description && (
                                                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                                                    {svc.short_description}
                                                </p>
                                            )}
                                        </div>

                                        <div
                                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                    ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                                    : "border-zinc-700 bg-black/40"
                                                }`}
                                        >
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Section 3: Preferred Schedule */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                        <Calendar className="w-4 h-4 text-[#E8AF66]" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                            3. Preferred Schedule
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Booking Date */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Preferred Date <span className="text-[#E8AF66]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={bookingDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    required
                                    className="w-full bg-[#191A1E] border border-zinc-800 focus:border-[#E8AF66] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Booking Time */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Preferred Time Slot
                            </label>
                            <div className="relative">
                                <select
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="w-full bg-[#191A1E] border border-zinc-800 focus:border-[#E8AF66] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="09:00:00">09:00 AM (Morning)</option>
                                    <option value="11:00:00">11:00 AM (Late Morning)</option>
                                    <option value="13:00:00">01:00 PM (Afternoon)</option>
                                    <option value="15:00:00">03:00 PM (Late Afternoon)</option>
                                    <option value="17:00:00">05:00 PM (Evening)</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Damage Description & Photo */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                        <FileText className="w-4 h-4 text-[#E8AF66]" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                            4. Damage Notes &amp; Photo
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Damage Description */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Damage Details / Special Instructions
                            </label>
                            <textarea
                                value={damageDesc}
                                onChange={(e) => setDamageDesc(e.target.value)}
                                rows={3}
                                placeholder="Describe the wheel damage (e.g. curb rash on front-left wheel, deep gouge on outer rim, diamond cut face flaking)..."
                                className="w-full bg-[#191A1E] border border-zinc-800 focus:border-[#E8AF66] rounded-2xl p-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Damage Photo Upload */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Wheel Damage Photo (Optional, helps accurate bids)
                            </label>

                            {imagePreview ? (
                                <div className="relative w-full max-w-sm h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                                    <Image
                                        src={imagePreview}
                                        alt="Wheel Damage Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-[#E8AF66]/60 rounded-2xl cursor-pointer bg-[#191A1E]/50 hover:bg-[#191A1E] transition-all group">
                                    <Upload className="w-8 h-8 text-zinc-500 group-hover:text-[#E8AF66] transition-colors mb-2" />
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
                                        Upload Wheel Damage Image
                                    </span>
                                    <span className="text-[10px] text-zinc-500 mt-1">
                                        PNG, JPG, or WEBP up to 10MB
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Action Button */}
                <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No upfront payment required to request bids. Specialists will respond directly.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || selectedProviders.length === 0}
                        className="w-full sm:w-auto bg-gradient-to-r from-[#D89B4C] via-[#E8AF66] to-[#C78736] hover:brightness-110 active:scale-95 text-zinc-950 font-black text-xs sm:text-sm px-8 py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-wider shadow-lg shadow-[#E8AF66]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Sending RFQ to {selectedProviders.length} Specialists...</span>
                            </>
                        ) : (
                            <>
                                <span>Submit Quotation Request ({selectedProviders.length})</span>
                                <Send className="w-4 h-4 text-zinc-950" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
