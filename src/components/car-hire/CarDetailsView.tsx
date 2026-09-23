"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Users,
  Fuel,
  Gauge,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Shield,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  Share2,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Sparkles,
  Info,
  CreditCard,
  Building,
} from "lucide-react";
import {
  CarItem,
  formatCurrency,
  parseTermsAndConditions,
} from "@/lib/service/car.api";
import { CarBookingModal } from "@/components/car-hire/CarBookingModal";

interface CarDetailsViewProps {
  car: CarItem;
  relatedCars?: CarItem[];
}

export const CarDetailsView: React.FC<CarDetailsViewProps> = ({
  car,
  relatedCars = [],
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const images =
    car.image_full_paths && car.image_full_paths.length > 0
      ? car.image_full_paths
      : [
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      ];

  const currentImage = images[selectedImageIndex] || images[0];

  const terms = parseTermsAndConditions(car.terms_conditions);
  const hourlyRate = parseFloat(car.hourly_rate || "0");
  const dailyRate = parseFloat(car.daily_rate || "0");
  const deposit = parseFloat(car.security_deposit || "0");

  const handleShare = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* 1. Breadcrumbs & Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/car-hire" className="hover:text-white transition">
              Car Hire
            </Link>
            {car.category?.name && (
              <>
                <span>/</span>
                <span className="text-white/70">{car.category.name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-[#FAD293] truncate max-w-[160px] sm:max-w-none">
              {car.brand}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <Share2 size={13} />
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Gallery, Specs, Terms (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery Card */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-3 sm:p-5 overflow-hidden">
              {/* Main Image Stage */}
              <div className="relative h-[280px] sm:h-[420px] md:h-[480px] w-full rounded-2xl overflow-hidden bg-neutral-900 group">
                <img
                  src={currentImage}
                  alt={car.brand}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #FAD293, #CEA46B)",
                      color: "#000",
                    }}
                  >
                    {car.type?.name || car.category?.name || "Hire Vehicle"}
                  </span>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {car.status === 1 ? "Available for Hire" : "Reserved"}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition backdrop-blur-md"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition backdrop-blur-md"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs text-white/80 backdrop-blur-md font-mono">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails Bar */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${selectedImageIndex === idx
                          ? "border-[#FAD293] scale-105 shadow-md shadow-[#FAD293]/20"
                          : "border-white/10 opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`thumbnail-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Overview & Key Highlights */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-widest text-[#FAD293] font-semibold">
                    Vehicle Overview
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  {car.brand}
                </h1>
                {car.model && (
                  <p className="text-base text-white/60">{car.model}</p>
                )}
              </div>

              {/* Specifications Matrix Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Year */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Calendar size={16} />
                    <span className="text-xs text-white/50">Year</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {car.manufacture_year || car.year || "2024 / 2025"}
                  </p>
                </div>

                {/* Seating */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Users size={16} />
                    <span className="text-xs text-white/50">Capacity</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {car.seating_capacity ? `${car.seating_capacity} Passengers` : "4-5 Seats"}
                  </p>
                </div>

                {/* Transmission */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Gauge size={16} />
                    <span className="text-xs text-white/50">Transmission</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {car.transmission_type || car.transmission || "Automatic"}
                  </p>
                </div>

                {/* Registration */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <CreditCard size={16} />
                    <span className="text-xs text-white/50">Registration</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">
                    {car.registration_number || "Verified UK"}
                  </p>
                </div>

                {/* Air Conditioning */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Snowflake size={16} />
                    <span className="text-xs text-white/50">Climate Control</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {car.air_conditioning === 1 ? "Dual AC" : "Standard AC"}
                  </p>
                </div>

                {/* Operating Hours */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-2 text-[#FAD293] mb-1">
                    <Clock size={16} />
                    <span className="text-xs text-white/50">Pickup Schedule</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {car.available_hours_start && car.available_hours_end
                      ? `${car.available_hours_start.slice(0, 5)} - ${car.available_hours_end.slice(0, 5)}`
                      : "09:00 - 18:00"}
                  </p>
                </div>
              </div>

              {/* Location & Preferred Areas */}
              {(car.address || car.postcode || car.preferred_areas) && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/8 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAD293]/10 text-[#FAD293] shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Service & Collection Location
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {car.address || ""} {car.postcode ? `(${car.postcode})` : ""}{" "}
                      {car.preferred_areas
                        ? `• Preferred Coverage: ${car.preferred_areas}`
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions Section */}
            {terms.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-[#FAD293]" />
                  <h3 className="text-lg font-bold text-white">
                    Hire Terms & Policies
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {terms.map((term, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-white/80 leading-relaxed"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-[#FAD293] shrink-0 mt-0.5"
                      />
                      <span>{term}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Pricing Card, Provider Info, Booking Action (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sticky Pricing Card */}
            <div className="sticky top-24 rounded-3xl border border-white/15 bg-[#110e0c] p-6 sm:p-7 shadow-2xl space-y-6">
              {/* Price Banner */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  Hire Pricing
                </span>

                {hourlyRate > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/70">Hourly Rate:</span>
                    <span className="text-2xl font-extrabold text-[#FAD293]">
                      {formatCurrency(hourlyRate)}{" "}
                      <span className="text-xs text-white/40 font-normal">
                        / hr
                      </span>
                    </span>
                  </div>
                )}

                {dailyRate > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/70">Daily Rate:</span>
                    <span className="text-2xl font-extrabold text-[#FAD293]">
                      {formatCurrency(dailyRate)}{" "}
                      <span className="text-xs text-white/40 font-normal">
                        / day
                      </span>
                    </span>
                  </div>
                )}

                {deposit > 0 && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/60">Refundable Deposit:</span>
                    <span className="font-semibold text-white font-mono">
                      {formatCurrency(deposit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Primary Booking CTA */}
              <button
                type="button"
                id="book-car-primary-btn"
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-4 rounded-2xl font-extrabold text-black text-sm transition-all duration-300 shadow-xl shadow-[#FAD293]/15 hover:brightness-110 active:scale-98 flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                <Sparkles size={16} />
                <span>Book This Vehicle</span>
              </button>

              {/* Peace of Mind Features */}
              <div className="space-y-3 pt-2 text-xs text-white/70">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>100% Certified Provider & Vehicle</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Cleaned, Inspected & Sanitized</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[#FAD293] shrink-0" />
                  <span>Instant Booking Request Confirmation</span>
                </div>
              </div>

              {/* Provider Card */}
              {car.provider && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 font-semibold">
                    <Building size={14} className="text-[#FAD293]" />
                    <span>Vehicle Provider</span>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-neutral-800 shrink-0">
                      <img
                        src={
                          car.provider.logo_full_path ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={car.provider.company_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {car.provider.company_name}
                      </h4>
                      {car.provider.contact_person_name && (
                        <p className="text-xs text-white/50 truncate">
                          Contact: {car.provider.contact_person_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-white/60 mt-0.5">
                        <Star
                          size={11}
                          className="fill-[#FAD293] text-[#FAD293]"
                        />
                        <span>
                          {car.provider.avg_rating || 5.0} (
                          {car.provider.rating_count || 1} verified reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider Address / Contacts */}
                  <div className="space-y-2 text-xs text-white/70">
                    {car.provider.company_address && (
                      <div className="flex items-start gap-2">
                        <MapPin
                          size={13}
                          className="text-[#FAD293] shrink-0 mt-0.5"
                        />
                        <span className="text-white/60 leading-tight">
                          {car.provider.company_address}
                        </span>
                      </div>
                    )}
                    {car.provider.company_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[#FAD293] shrink-0" />
                        <span className="text-white/80 font-mono">
                          {car.provider.company_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Related Vehicles Section */}
        {relatedCars.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#FAD293] font-semibold">
                  Explore More
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Similar Vehicles in this Category
                </h3>
              </div>
              <Link
                href="/car-hire"
                className="text-xs font-semibold text-[#FAD293] hover:underline"
              >
                View All Cars &rsaquo;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCars.slice(0, 3).map((rCar) => (
                <Link
                  key={rCar.id}
                  href={`/car-hire/${rCar.id}`}
                  className="group rounded-2xl border border-white/10 bg-[#0d0d0d] p-4 transition-all duration-300 hover:border-[#FAD293]/40 hover:-translate-y-1"
                >
                  <div className="relative h-40 rounded-xl overflow-hidden bg-neutral-900 mb-3">
                    <img
                      src={
                        rCar.image_full_paths?.[0] ||
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={rCar.brand}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-[#FAD293] font-semibold backdrop-blur-md">
                      {formatCurrency(rCar.hourly_rate || rCar.daily_rate)}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#FAD293] transition line-clamp-1">
                    {rCar.brand}
                  </h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    {rCar.type?.name || "Hire Vehicle"} • {rCar.transmission_type || "Automatic"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <CarBookingModal
        car={car}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};
