"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Receipt,
  CheckCircle2,
  BadgeCheck,
  Clock,
  Car,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowRight,
  Sparkles,
  Loader2,
  Copy,
  Printer,
  ChevronLeft,
  AlertCircle,
  CalendarDays,
  Star,
  User,
  Image as ImageIcon,
  Tag,
  X,
} from "lucide-react";
import {
  getEstimateDetails,
  acceptCustomerEstimate,
  normalizeEstimateImageUrl,
  EstimateItem,
} from "@/lib/service/estimate.api";
import { useToast } from "@/components/ToastProvider";

function EstimateDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [estimate, setEstimate] = useState<EstimateItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Image for Lightbox Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Accept Flow
  const [paymentMethod, setPaymentMethod] = useState<string>("cash_after_service");
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Robust token extractor
  const getToken = useCallback((): string => {
    if (params?.token && params.token !== "[token]") return params.token as string;
    if (params?.id && params.id !== "[id]") return params.id as string;
    const qToken = searchParams?.get("token") || searchParams?.get("id");
    if (qToken) return qToken;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && !["details", "provider-estimates", "estimate", "estimates"].includes(last)) {
        return last;
      }
    }
    return "";
  }, [params, searchParams]);

  const tokenParam = getToken();

  const fetchDetail = useCallback(async () => {
    const activeToken = getToken();
    if (!activeToken || activeToken === "[token]" || activeToken === "[id]") {
      setLoading(false);
      return;
    }

    // 1. Instant cache check from sessionStorage
    let cachedFound = false;
    if (typeof window !== "undefined") {
      try {
        const selectedStr = sessionStorage.getItem("mmc_selected_estimate");
        if (selectedStr) {
          const item: EstimateItem = JSON.parse(selectedStr);
          const link = String(item.link_token || "").toLowerCase();
          const id = String(item.id || "").toLowerCase();
          const readId = String(item.readable_id || "").toLowerCase();
          const target = activeToken.toLowerCase();
          if (link === target || id === target || readId === target || target.includes(link) || link.includes(target)) {
            setEstimate(item);
            cachedFound = true;
            setLoading(false);
            if ((item.status || "").toLowerCase() === "accepted") {
              setAcceptedSuccess(true);
            }
          }
        }
      } catch {}
    }

    try {
      if (!cachedFound) {
        setLoading(true);
      }
      setError(null);
      const data = await getEstimateDetails(activeToken);
      if (data) {
        setEstimate(data);
        if ((data.status || "").toLowerCase() === "accepted") {
          setAcceptedSuccess(true);
        }
      } else if (!cachedFound) {
        setError("Estimate or Quotation not found. The link may have expired or is invalid.");
      }
    } catch (err: any) {
      console.error("[EstimateDetailClient] Error:", err);
      if (!cachedFound) {
        setError(err?.response?.data?.message || err?.message || "Failed to load estimate.");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) {
      const activeToken = getToken();
      const returnPath = activeToken && activeToken !== "[token]" && activeToken !== "[id]"
        ? `/estimate/${activeToken}`
        : "/estimate";
      router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    fetchDetail();
  }, [fetchDetail, getToken, router]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      const token = estimate?.link_token || estimate?.id || getToken();
      const shareUrl = token
        ? `${window.location.origin}/estimate/${token}`
        : `${window.location.origin}/estimate`;
      navigator.clipboard.writeText(shareUrl);
      showToast("Estimate link copied to clipboard!", "success");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleAccept = async () => {
    const tokenToAccept = estimate?.link_token || estimate?.id || tokenParam;
    if (!tokenToAccept) return;
    try {
      setAccepting(true);
      const res = await acceptCustomerEstimate(tokenToAccept, paymentMethod);
      setAcceptedSuccess(true);
      setEstimate((prev) => (prev ? { ...prev, status: "accepted", payment_method: paymentMethod } : null));
      showToast(res.message || "Quotation accepted successfully!", "success");

      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      }
    } catch (err: any) {
      showToast(err.message || "Failed to accept estimate", "error");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090706] flex flex-col items-center justify-center text-white px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center mb-4">
          <Loader2 size={28} className="text-[#f2cb87] animate-spin" />
        </div>
        <h2 className="text-lg font-bold">Loading Quotation & Estimate...</h2>
        <p className="text-xs text-white/50 mt-1">Retrieving official repair breakdown from MMC Garage Network</p>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-[#090706] text-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-3xl border border-[#3a2a17] bg-[#14100c] p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Estimate Not Found</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              {error || "We couldn't locate this estimate. It may have expired or the link is incorrect."}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/estimate"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/20"
            >
              Go to Provider Estimates
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/70 hover:text-white"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const grandTotal = Number(
    estimate.total_amount ??
    estimate.grand_total ??
    estimate.price ??
    estimate.total_cost ??
    0
  );
  const basePrice = Number(estimate.price ?? estimate.subtotal ?? grandTotal);
  const taxAmount = Number(estimate.tax_amount ?? estimate.vat_amount ?? 0);
  const discountAmount = Number(estimate.discount_amount ?? 0);
  const isAccepted = acceptedSuccess || (estimate.status || "").toLowerCase() === "accepted";

  const carImages = estimate.car_images_full_path || (estimate.car_image_full_path ? [estimate.car_image_full_path] : []);

  const serviceName =
    estimate.category?.name ||
    estimate.service_description ||
    "Specialist Repair & Quotation Service";

  const estimateRef =
    estimate.readable_id ? `EST-${estimate.readable_id}` :
      estimate.estimate_number ? estimate.estimate_number :
        `EST-${(estimate.id || "").slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#090706] text-white py-8 sm:py-12 font-sans selection:bg-[#f2cb87] selection:text-black">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/estimate"
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-[#f2cb87] transition group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>All Estimates</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#14100c] hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/80 transition cursor-pointer"
              title="Copy share link"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">Share Link</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#14100c] hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/80 transition cursor-pointer"
              title="Print estimate"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Main Estimate Sheet */}
        <div className="relative overflow-hidden rounded-3xl border border-[#3a2a17] bg-[#14100c] shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Top Edge Glow */}
          <div className="absolute -top-1 inset-x-16 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/40 to-transparent pointer-events-none" />

          {/* Header Row: MMC Logo + Estimate Reference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <Image
                src="/mmc-logo.jpg"
                alt="Motor Market Connect"
                width={160}
                height={60}
                className="h-10 w-auto object-contain rounded-lg"
              />
              <div className="h-8 w-[1px] bg-white/10" />
              <div>
                <span className="text-[10px] font-black text-[#f2cb87] uppercase tracking-widest block">
                  Official Provider Estimate
                </span>
                <span className="text-xs text-white/50">Motor Market Connect UK</span>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">
                  {estimateRef}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isAccepted
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                >
                  {isAccepted ? "ACCEPTED" : (estimate.status || "PENDING").toUpperCase()}
                </span>
              </div>
              {estimate.created_at && (
                <p className="text-xs text-white/40 flex items-center sm:justify-end gap-1">
                  <CalendarDays size={12} />
                  Issued: {new Date(estimate.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              {estimate.expired_at && (
                <p className="text-[11px] text-amber-400/80 flex items-center sm:justify-end gap-1">
                  <Clock size={11} />
                  Valid Until: {new Date(estimate.expired_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* 2-Column Info: Provider Details vs Customer/Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            {/* Workshop / Provider */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">
                Provider & Workshop Details
              </span>
              <div className="flex items-center gap-2.5">
                {estimate.provider?.logo_full_path ? (
                  <img
                    src={normalizeEstimateImageUrl(estimate.provider.logo_full_path)}
                    alt={estimate.provider?.company_name || "Provider"}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center text-[#f2cb87] font-bold text-xs shrink-0">
                    {estimate.provider?.company_name?.[0] || "P"}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <BadgeCheck size={14} className="text-[#f2cb87]" />
                    {estimate.provider?.company_name || "MMC Verified Specialist"}
                  </h4>
                  {estimate.provider?.avg_rating !== undefined && (
                    <div className="flex items-center gap-1 text-[11px] text-[#f2cb87]">
                      <Star size={11} className="fill-[#f2cb87]" />
                      <span className="font-bold">{estimate.provider.avg_rating} / 5</span>
                      {estimate.provider?.rating_count ? (
                        <span className="text-white/40 text-[10px]">({estimate.provider.rating_count} reviews)</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {estimate.provider?.contact_person_name && (
                <p className="text-xs text-white/70 flex items-center gap-1.5">
                  <User size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>Contact: {estimate.provider.contact_person_name}</span>
                </p>
              )}
              {estimate.provider?.company_address && (
                <p className="text-xs text-white/60 flex items-start gap-1.5">
                  <MapPin size={13} className="text-[#f2cb87]/70 shrink-0 mt-0.5" />
                  <span>{estimate.provider.company_address}</span>
                </p>
              )}
              {estimate.provider?.company_phone && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <a href={`tel:${estimate.provider.company_phone}`} className="hover:text-[#f2cb87] transition">
                    {estimate.provider.company_phone}
                  </a>
                </p>
              )}
              {estimate.provider?.company_email && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <Mail size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>{estimate.provider.company_email}</span>
                </p>
              )}
            </div>

            {/* Customer & Vehicle */}
            <div className="space-y-2.5 md:border-l md:border-white/10 md:pl-6">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">
                Vehicle & Client Information
              </span>
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <Car size={14} className="text-[#f2cb87]" />
                {estimate.car_model || estimate.car?.model || "Registered Vehicle"}
              </h4>
              {estimate.car_registration_number && (
                <p className="text-xs text-white/80 font-mono font-bold">
                  Registration: <span className="text-[#f2cb87] bg-white/5 px-2 py-0.5 rounded border border-white/10">{estimate.car_registration_number}</span>
                </p>
              )}
              {(estimate.customer_name || estimate.customer?.name) && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <User size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>Client: {estimate.customer_name || estimate.customer?.name}</span>
                </p>
              )}
              {(estimate.customer_phone || estimate.customer?.phone) && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>{estimate.customer_phone || estimate.customer?.phone}</span>
                </p>
              )}
              {(estimate.customer_address || estimate.customer_email) && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>{estimate.customer_address || estimate.customer_email}</span>
                </p>
              )}
              {estimate.service_schedule && (
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-[#f2cb87]/70 shrink-0" />
                  <span>
                    Schedule: {new Date(estimate.service_schedule).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Service Scope & Damage Description */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-[#f2cb87]" />
                <span className="text-sm font-bold text-[#f2cb87] tracking-wide">
                  {serviceName}
                </span>
              </div>
              {estimate.category?.description && (
                <span className="text-xs text-white/40">{estimate.category.description}</span>
              )}
            </div>

            {estimate.damage_description && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Issue / Damage Description
                </span>
                <p className="text-xs text-white/80 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  {estimate.damage_description}
                </p>
              </div>
            )}

            {/* Vehicle Photos Gallery */}
            {carImages.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <ImageIcon size={11} className="text-[#f2cb87]" />
                  Uploaded Vehicle Photos ({carImages.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {carImages.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewImage(normalizeEstimateImageUrl(imgUrl))}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:border-[#f2cb87]/50 transition-all cursor-pointer"
                    >
                      <img
                        src={normalizeEstimateImageUrl(imgUrl)}
                        alt={`Vehicle photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quotation Cost Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Itemized Quotation Breakdown
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-white/50 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Service & Component</th>
                    <th className="py-3 px-4 font-bold text-center">Qty</th>
                    <th className="py-3 px-4 font-bold text-right">Unit Price</th>
                    <th className="py-3 px-4 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {estimate.line_items && estimate.line_items.length > 0 ? (
                    estimate.line_items.map((item, idx) => (
                      <tr key={idx} className="text-white/80">
                        <td className="py-3.5 px-4 font-medium text-white">{item.description}</td>
                        <td className="py-3.5 px-4 text-center text-white/60">{item.quantity || 1}</td>
                        <td className="py-3.5 px-4 text-right text-white/60">
                          £{Number(item.unit_price || item.total_price || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#f2cb87]">
                          £{Number(item.total_price || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="text-white/80">
                      <td className="py-4 px-4 font-medium text-white">
                        {serviceName} - Comprehensive Repair & Labor
                      </td>
                      <td className="py-4 px-4 text-center text-white/60">1</td>
                      <td className="py-4 px-4 text-right text-white/60">£{basePrice.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-bold text-[#f2cb87]">
                        £{basePrice.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Totals Box */}
          <div className="flex flex-col items-end space-y-2 pt-2">
            <div className="flex justify-between w-full max-w-xs text-xs text-white/60">
              <span>Service Estimate Subtotal:</span>
              <span className="text-white font-medium">£{basePrice.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between w-full max-w-xs text-xs text-white/60">
                <span>Tax / VAT:</span>
                <span className="text-white font-medium">£{taxAmount.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between w-full max-w-xs text-xs text-emerald-400">
                <span>Special Discount:</span>
                <span>-£{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-lg font-black text-white pt-3 border-t border-white/10">
              <span className="text-[#f2cb87]">Grand Total:</span>
              <span className="text-emerald-400">£{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes & Terms */}
          {estimate.notes && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Workshop Notes & Guarantee Terms
              </span>
              <p className="text-white/70 italic leading-relaxed">&ldquo;{estimate.notes}&rdquo;</p>
            </div>
          )}

          {/* Accept / Action Section */}
          <div className="border-t border-white/10 pt-6 space-y-4">
            {isAccepted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-white">Quotation Accepted & Confirmed</h3>
                <p className="text-xs text-white/60 max-w-md mx-auto">
                  The workshop has been notified of your acceptance. You can track this work directly from your Account Dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    href="/estimate"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-black text-zinc-950 transition hover:brightness-110"
                  >
                    <span>View in Provider Estimates</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Ready to proceed?</h4>
                    <p className="text-xs text-white/50">Select your preferred payment method to authorize this estimate</p>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash_after_service")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${paymentMethod === "cash_after_service"
                          ? "border-[#f2cb87] bg-[#f2cb87]/15 text-[#f2cb87]"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                    >
                      <Banknote size={14} />
                      <span>Pay After Service</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("stripe")}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${paymentMethod === "stripe"
                          ? "border-[#f2cb87] bg-[#f2cb87]/15 text-[#f2cb87]"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                    >
                      <CreditCard size={14} />
                      <span>Pay by Card / Stripe</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <ShieldCheck size={16} className="text-[#f2cb87]" />
                    <span>Protected by MMC Certified Workshop Guarantee</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] px-8 py-3.5 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-xl shadow-[#d09a50]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {accepting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>{accepting ? "Authorizing Estimate..." : "Accept & Authorize Estimate"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Vehicle Photo */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition"
          >
            <X size={22} />
          </button>
          <img
            src={previewImage}
            alt="Vehicle damage preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl border border-white/10 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default function EstimateDetailClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090706] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
        </div>
      }
    >
      <EstimateDetailInner />
    </Suspense>
  );
}
