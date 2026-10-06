"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  RefreshCw,
  Car,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BadgeCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  CreditCard,
  Banknote,
  Copy,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
  Star,
  User,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  getCustomerEstimates,
  getEstimateDetails,
  acceptCustomerEstimate,
  normalizeEstimateImageUrl,
  EstimateItem,
} from "@/lib/service/estimate.api";
import { useToast } from "@/components/ToastProvider";

export const EstimatesTab: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Estimate Detail Modal / View
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Accept Modal State
  const [acceptingItem, setAcceptingItem] = useState<EstimateItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash_after_service");
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);

  const fetchEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerEstimates(50, 1);
      setEstimates(data || []);
      if (data && typeof window !== "undefined") {
        try {
          sessionStorage.setItem("mmc_customer_estimates", JSON.stringify(data));
        } catch {}
      }
    } catch (err) {
      console.warn("Could not load customer estimates:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEstimates();
  };

  const handleOpenDetail = (item: EstimateItem) => {
    const token = item.link_token || item.id || String(item.readable_id);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("mmc_selected_estimate", JSON.stringify(item));
      } catch {}
    }
    if (token) {
      router.push(`/estimate/${token}`);
    }
  };

  const handleCopyLink = (item: EstimateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const token = item.link_token || item.id || String(item.readable_id);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mmcclub.co.uk";
    const shareUrl = `${origin}/estimate/${token}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Estimate link copied to clipboard!", "success");
    } else {
      showToast(shareUrl, "info");
    }
  };

  const handleConfirmAccept = async () => {
    if (!acceptingItem) return;
    const token = acceptingItem.link_token || acceptingItem.id || String(acceptingItem.readable_id);
    try {
      setAcceptSubmitting(true);
      const res = await acceptCustomerEstimate(token, paymentMethod);
      showToast(res.message || "Estimate accepted successfully!", "success");

      // Update state locally
      setEstimates((prev) =>
        prev.map((est) =>
          (est.link_token === token || est.id === token || String(est.readable_id) === token)
            ? { ...est, status: "accepted", payment_method: paymentMethod }
            : est
        )
      );

      if (selectedEstimate && (selectedEstimate.link_token === token || selectedEstimate.id === token)) {
        setSelectedEstimate((prev) => (prev ? { ...prev, status: "accepted", payment_method: paymentMethod } : null));
      }

      setAcceptingItem(null);

      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      }
    } catch (err: any) {
      showToast(err.message || "Failed to accept estimate", "error");
    } finally {
      setAcceptSubmitting(false);
    }
  };

  const pendingCount = estimates.filter((e) => (e.status || "pending").toLowerCase() === "pending").length;
  const acceptedCount = estimates.filter((e) => (e.status || "").toLowerCase() === "accepted").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1409] via-[#17110a] to-[#120d07] border border-[#3a2a17] shadow-2xl p-5 sm:p-6">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-[#f2cb87]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-1 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/40 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#f2cb87] bg-[#f2cb87]/10 px-3 py-1 rounded-full border border-[#f2cb87]/25 uppercase tracking-widest">
                <Receipt size={11} />
                Provider Estimates
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25 uppercase tracking-widest animate-pulse">
                  <Clock size={10} />
                  {pendingCount} Awaiting Your Approval
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Workshop & Provider Estimates
            </h2>
            <p className="text-xs text-white/50">
              Review official workshop repair estimates, parts pricing, and approve jobs with 1-click
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Receipt size={12} className="text-[#f2cb87]" />
                <span>
                  <span className="font-bold text-white">{estimates.length}</span> Total Estimates
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>
                  <span className="font-bold text-white">{acceptedCount}</span> Accepted
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/account?tab=quotes"
              className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#f2cb87]/40 px-4 py-2.5 text-xs font-bold text-white/90 transition hover:text-[#f2cb87]"
            >
              <Sparkles size={12} className="text-[#f2cb87]" />
              <span>My Quotes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-[#33271d] bg-[#14100c]/60">
          <div className="w-14 h-14 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-[#f2cb87] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-white">Loading Estimates...</p>
          <p className="text-xs text-white/40 mt-1">Retrieving official workshop quotes</p>
        </div>
      ) : selectedEstimate ? (
        /* ─── Estimate Detail View ─── */
        <div className="space-y-5 animate-fade-in">
          {/* Back Button & Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1409] via-[#17110a] to-[#120d07] border border-[#3a2a17] p-5 sm:p-6 shadow-2xl">
            <div className="absolute -top-1 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/30 to-transparent pointer-events-none" />

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedEstimate(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#f2cb87] hover:text-white transition cursor-pointer group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back to All Estimates
                </button>

                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-[10px] font-black text-[#f2cb87] uppercase tracking-widest bg-[#f2cb87]/10 px-2.5 py-1 rounded-lg border border-[#f2cb87]/20">
                    {selectedEstimate.readable_id ? `EST-${selectedEstimate.readable_id}` : (selectedEstimate.estimate_number || `EST-${String(selectedEstimate.id || "").slice(0, 8)}`)}
                  </span>
                  {selectedEstimate.created_at && (
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <CalendarDays size={11} />
                      {new Date(selectedEstimate.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      (selectedEstimate.status || "pending").toLowerCase() === "accepted"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {(selectedEstimate.status || "pending").toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                  {selectedEstimate.category?.name || selectedEstimate.service_description || "Specialist Repair & Service Estimate"}
                </h3>

                <div className="flex items-center gap-4 text-xs text-white/60 flex-wrap">
                  {(selectedEstimate.car_model || selectedEstimate.car?.model) && (
                    <div className="flex items-center gap-1.5">
                      <Car size={13} className="text-[#f2cb87]" />
                      <span>{selectedEstimate.car_model || selectedEstimate.car?.model}</span>
                    </div>
                  )}
                  {selectedEstimate.provider?.company_name && (
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck size={13} className="text-emerald-400" />
                      <span>{selectedEstimate.provider.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedEstimate)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition cursor-pointer"
                  title="Copy direct link"
                >
                  <Copy size={13} />
                  <span>Share Link</span>
                </button>

                <Link
                  href={`/estimate/${selectedEstimate.link_token || selectedEstimate.id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition"
                  title="Open full public page"
                >
                  <ExternalLink size={13} />
                  <span>Full View</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Line Items & Summary Card */}
          <div className="rounded-3xl border border-[#3a2a17] bg-[#14100c] p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Receipt size={15} className="text-[#f2cb87]" />
                Estimate Details & Cost Breakdown
              </h4>
              {selectedEstimate.provider?.company_phone && (
                <a
                  href={`tel:${selectedEstimate.provider.company_phone}`}
                  className="text-xs text-[#f2cb87] flex items-center gap-1 hover:underline"
                >
                  <Phone size={12} />
                  <span>{selectedEstimate.provider.company_phone}</span>
                </a>
              )}
            </div>

            {/* Provider Details Card */}
            {selectedEstimate.provider && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-[#3a2a17] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#f2cb87] uppercase tracking-widest flex items-center gap-1.5">
                    <BadgeCheck size={13} className="text-emerald-400" />
                    Verified Service Provider
                  </span>
                  {selectedEstimate.provider.avg_rating !== undefined && (
                    <div className="flex items-center gap-1 bg-[#f2cb87]/10 px-2 py-0.5 rounded-full border border-[#f2cb87]/20 text-[11px] font-bold text-[#f2cb87]">
                      <Star size={11} className="fill-[#f2cb87]" />
                      <span>{Number(selectedEstimate.provider.avg_rating).toFixed(1)} / 5.0</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {selectedEstimate.provider.logo_full_path ? (
                    <img
                      src={normalizeEstimateImageUrl(selectedEstimate.provider.logo_full_path)}
                      alt={selectedEstimate.provider.company_name}
                      className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-white/10 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center font-bold text-base text-[#f2cb87]">
                      {(selectedEstimate.provider.company_name || "MMC")[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {selectedEstimate.provider.company_name || "Specialist Garage"}
                    </h4>
                    {selectedEstimate.provider.contact_person_name && (
                      <p className="text-xs text-white/50">
                        Contact: {selectedEstimate.provider.contact_person_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs text-white/70">
                  {selectedEstimate.provider.company_phone && (
                    <a
                      href={`tel:${selectedEstimate.provider.company_phone}`}
                      className="flex items-center gap-2 hover:text-[#f2cb87] transition"
                    >
                      <Phone size={12} className="text-[#f2cb87]" />
                      <span>{selectedEstimate.provider.company_phone}</span>
                    </a>
                  )}
                  {selectedEstimate.provider.company_email && (
                    <a
                      href={`mailto:${selectedEstimate.provider.company_email}`}
                      className="flex items-center gap-2 hover:text-[#f2cb87] transition truncate"
                    >
                      <Mail size={12} className="text-[#f2cb87]" />
                      <span className="truncate">{selectedEstimate.provider.company_email}</span>
                    </a>
                  )}
                  {selectedEstimate.provider.company_address && (
                    <div className="flex items-center gap-2 col-span-full text-white/50 text-[11px]">
                      <MapPin size={12} className="text-[#f2cb87] shrink-0" />
                      <span>{selectedEstimate.provider.company_address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Provider & Damage Notes */}
            {selectedEstimate.damage_description && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Issue Description
                </span>
                <p className="text-xs text-white/80 leading-relaxed">{selectedEstimate.damage_description}</p>
              </div>
            )}

            {/* Damage Images with Lightbox */}
            {selectedEstimate.car_images_full_path && selectedEstimate.car_images_full_path.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <ImageIcon size={11} className="text-[#f2cb87]" />
                  Uploaded Vehicle Photos (Click to Zoom)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedEstimate.car_images_full_path.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewImage(normalizeEstimateImageUrl(img))}
                      className="aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-[#f2cb87]/60 transition cursor-zoom-in group/img relative"
                    >
                      <img
                        src={normalizeEstimateImageUrl(img)}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Click to Zoom
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals Summary */}
            <div className="border-t border-white/10 pt-4 flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full max-w-xs text-xs text-white/60">
                <span>Service Price:</span>
                <span className="text-white font-medium">
                  £{Number(selectedEstimate.price ?? selectedEstimate.total_amount ?? 0).toFixed(2)}
                </span>
              </div>
              {selectedEstimate.tax_amount !== undefined && selectedEstimate.tax_amount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-xs text-white/60">
                  <span>Tax / VAT:</span>
                  <span className="text-white font-medium">£{Number(selectedEstimate.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {selectedEstimate.discount_amount !== undefined && selectedEstimate.discount_amount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-xs text-emerald-400">
                  <span>Discount:</span>
                  <span>-£{Number(selectedEstimate.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-xs text-base font-black text-white pt-2 border-t border-white/10">
                <span className="text-[#f2cb87]">Total Payable:</span>
                <span className="text-emerald-400">
                  £
                  {Number(
                    selectedEstimate.total_amount ??
                    selectedEstimate.grand_total ??
                    selectedEstimate.price ??
                    0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Provider Notes */}
            {selectedEstimate.notes && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Specialist Notes
                </span>
                <p className="text-xs text-white/70 italic">&ldquo;{selectedEstimate.notes}&rdquo;</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <ShieldCheck size={16} className="text-[#f2cb87]" />
                <span>MMC Certified Quote Guarantee included</span>
              </div>

              {(selectedEstimate.status || "pending").toLowerCase() === "pending" ? (
                <button
                  type="button"
                  onClick={() => setAcceptingItem(selectedEstimate)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] px-6 py-3 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/20 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Accept & Confirm Estimate</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 size={14} />
                  <span>Estimate Accepted & Confirmed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : estimates.length === 0 ? (
        /* ─── Empty State ─── */
        <div className="relative overflow-hidden p-12 text-center rounded-3xl border border-[#33271d] bg-gradient-to-br from-[#1c1409] to-[#120d07] space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#f2cb87]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center text-[#f2cb87] mx-auto shadow-lg shadow-[#f2cb87]/10">
            <Receipt size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">No Provider Estimates Yet</h3>
            <p className="text-xs text-white/45 mt-2 max-w-sm mx-auto leading-relaxed">
              When a verified workshop or technician prepares an itemized quotation for your vehicle, it will appear here for your review and one-click acceptance.
            </p>
          </div>
          <Link
            href="/services/bodywork"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-3 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/25"
          >
            <Sparkles size={13} />
            <span>Request Repair Quotation</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        /* ─── Estimates List ─── */
        <div className="space-y-3">
          {estimates.map((item) => {
            const isPending = (item.status || "pending").toLowerCase() === "pending";
            const isAccepted = (item.status || "").toLowerCase() === "accepted";
            const grandTotal = Number(
              item.total_amount ??
              item.grand_total ??
              item.price ??
              item.total_cost ??
              0
            );

            return (
              <div
                key={item.id || item.link_token || item.readable_id}
                onClick={() => handleOpenDetail(item)}
                className="group relative overflow-hidden rounded-2xl border border-[#2e2012] bg-gradient-to-br from-[#1a1208] via-[#161009] to-[#100c06] hover:border-[#f2cb87]/45 hover:shadow-[0_8px_30px_rgba(242,203,135,0.08)] transition-all duration-300 cursor-pointer"
              >
                {/* Gold top edge glow on hover */}
                <div className="absolute -top-px inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/0 group-hover:via-[#f2cb87]/30 to-transparent transition-all duration-300" />

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isAccepted
                          ? "bg-emerald-500/15 border border-emerald-500/25"
                          : "bg-[#f2cb87]/10 border border-[#f2cb87]/20"
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <Receipt size={16} className="text-[#f2cb87]" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      {/* Ref + Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-[#f2cb87]/80 uppercase tracking-widest bg-[#f2cb87]/8 px-2 py-0.5 rounded-md border border-[#f2cb87]/12">
                          {item.readable_id ? `EST-${item.readable_id}` : (item.estimate_number || `EST-${String(item.id || "").slice(0, 8)}`)}
                        </span>
                        {item.created_at && (
                          <span className="flex items-center gap-1 text-[11px] text-white/35">
                            <CalendarDays size={10} />
                            {new Date(item.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white group-hover:text-[#f2cb87] transition-colors truncate max-w-xs sm:max-w-none">
                        {item.category?.name || item.service_description || "Repair & Service Estimate"}
                      </h3>

                      {/* Vehicle & Garage */}
                      <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                        {(item.car_model || item.car?.model) && (
                          <div className="flex items-center gap-1.5">
                            <Car size={12} className="text-[#f2cb87]/70 shrink-0" />
                            <span className="truncate">{item.car_model || item.car?.model}</span>
                          </div>
                        )}
                        {item.provider?.company_name && (
                          <div className="flex items-center gap-1 text-white/60">
                            <BadgeCheck size={11} className="text-emerald-400 shrink-0" />
                            <span className="truncate">{item.provider.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Amount */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-13 sm:pl-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-emerald-400">
                        £{grandTotal.toFixed(2)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                          isAccepted ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {isAccepted ? "Accepted" : "Pending Action"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAcceptingItem(item);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-[11px] font-black text-zinc-950 transition hover:brightness-110 shadow-sm cursor-pointer"
                        >
                          Accept
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(item, e)}
                        title="Copy Share Link"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-[#f2cb87]/20 border border-white/8 hover:border-[#f2cb87]/40 flex items-center justify-center text-white/60 hover:text-[#f2cb87] transition cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-[#f2cb87]/15 border border-white/8 group-hover:border-[#f2cb87]/30 flex items-center justify-center transition-all">
                        <ChevronRight
                          size={14}
                          className="text-white/30 group-hover:text-[#f2cb87] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ACCEPT ESTIMATE MODAL ─── */}
      {acceptingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#3a2a17] bg-[#14100c] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="text-base font-black text-white">Accept Provider Estimate</h3>
              </div>
              <button
                type="button"
                onClick={() => setAcceptingItem(null)}
                className="text-white/40 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Estimate Ref:</span>
                <span className="font-bold text-white">
                  {acceptingItem.readable_id ? `EST-${acceptingItem.readable_id}` : (acceptingItem.estimate_number || `EST-${String(acceptingItem.id || "").slice(0, 8)}`)}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Total Amount:</span>
                <span className="font-black text-emerald-400 text-sm">
                  £
                  {Number(
                    acceptingItem.total_amount ??
                    acceptingItem.grand_total ??
                    acceptingItem.price ??
                    0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80">Choose Payment Method:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash_after_service")}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    paymentMethod === "cash_after_service"
                      ? "border-[#f2cb87] bg-[#f2cb87]/15 text-[#f2cb87]"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Banknote size={18} />
                  <span>Pay After Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    paymentMethod === "stripe"
                      ? "border-[#f2cb87] bg-[#f2cb87]/15 text-[#f2cb87]"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Online / Card</span>
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAcceptingItem(null)}
                disabled={acceptSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={acceptSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {acceptSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{acceptSubmitting ? "Accepting..." : "Confirm & Accept"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Damage Photos */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition cursor-pointer"
          >
            <X size={22} />
          </button>
          <img
            src={previewImage}
            alt="Damage photo preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl border border-white/10 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
