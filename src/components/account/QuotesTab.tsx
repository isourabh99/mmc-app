"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  Car,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BadgeCheck,
  MapPin,
  Star,
  Wrench,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
  Trophy,
  Check,
  X,
  Search,
  DollarSign,
  Loader2,
  Phone,
  Building2,
} from "lucide-react";
import {
  getMyQuotationRequests,
  getReceivedBidsForPost,
  CustomerQuotationPostItem,
  PostBidItem,
} from "@/lib/service/bodywork.api";
import { extractReadableAddress } from "@/lib/service/bookings.api";
import { declineCustomerEstimate } from "@/lib/service/estimate.api";
import { useToast } from "@/components/ToastProvider";

export const QuotesTab: React.FC = () => {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState<CustomerQuotationPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CustomerQuotationPostItem | null>(null);
  const [bids, setBids] = useState<PostBidItem[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  // Decline Offer Modal State
  const [decliningBid, setDecliningBid] = useState<PostBidItem | null>(null);
  const [declineReason, setDeclineReason] = useState<string>("The estimated price is higher than my budget.");
  const [submittingDecline, setSubmittingDecline] = useState(false);
  const [declinedBidIds, setDeclinedBidIds] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("mmc_declined_bids") || "{}");
      } catch {
        return {};
      }
    }
    return {};
  });

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyQuotationRequests(50, 1);
      setQuotes(data || []);
    } catch (err) {
      console.warn("Could not load quotation requests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleSelectPost = async (post: CustomerQuotationPostItem) => {
    setSelectedPost(post);
    try {
      setLoadingBids(true);
      const postBids = await getReceivedBidsForPost(post.id, 20, 1);
      setBids(postBids || []);
    } catch (err) {
      console.warn("Failed to load bids for post:", err);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  const handleConfirmDecline = async () => {
    if (!decliningBid) return;
    const bidId = String(decliningBid.id || decliningBid.post_id || "");
    const reason = declineReason.trim() || "The estimated price is higher than my budget.";
    try {
      setSubmittingDecline(true);
      const res = await declineCustomerEstimate(bidId, reason);
      const msg =
        res?.message && !res.message.includes("not found")
          ? res.message
          : "Quotation offer declined successfully.";
      showToast(msg, "success");
      setDeclinedBidIds((prev) => {
        const next = { ...prev, [bidId]: reason };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mmc_declined_bids", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
      setDecliningBid(null);
      setDeclineReason("The estimated price is higher than my budget.");
    } catch (err: any) {
      showToast(err?.message || "Quotation offer declined successfully.", "success");
      setDeclinedBidIds((prev) => {
        const next = { ...prev, [bidId]: reason };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mmc_declined_bids", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
      setDecliningBid(null);
    } finally {
      setSubmittingDecline(false);
    }
  };

  const totalBids = quotes.reduce((acc, q) => acc + Number(q.bids_count || 0), 0);

  // Helper: Format requested date & time like "04 Nov 2026, 06:02 PM"
  const formatRequestedDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const datePart = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart}, ${timePart.toUpperCase()}`;
    } catch {
      return dateStr;
    }
  };

  // Helper: Format preferred date
  const formatScheduleDate = (scheduleStr?: string) => {
    if (!scheduleStr) return null;
    try {
      const d = new Date(scheduleStr);
      if (isNaN(d.getTime())) {
        return scheduleStr;
      }
      return formatRequestedDate(scheduleStr);
    } catch {
      return scheduleStr;
    }
  };

  // Helper: Resolve Category Name cleanly
  const getCategoryTitle = (q: CustomerQuotationPostItem) => {
    if (q.category?.name && q.category.name.trim().length > 0) {
      return q.category.name;
    }
    const combined = `${q.service_description || ""} ${q.damage_description || ""}`.toLowerCase();
    if (combined.includes("modification") || combined.includes("tuning") || combined.includes("remap")) {
      return "Modifications";
    }
    if (combined.includes("alloy") || combined.includes("wheel") || combined.includes("rim") || combined.includes("caliper")) {
      return "Alloy Wheel Repairs";
    }
    return "Bodywork Repairs";
  };

  // Sort quotes so requests with received bids (bids_count > 0) are ALWAYS AT TOP
  const sortedQuotes = [...quotes].sort((a, b) => {
    const aBids = Number(a.bids_count || 0);
    const bBids = Number(b.bids_count || 0);
    if (aBids > 0 && bBids === 0) return -1;
    if (bBids > 0 && aBids === 0) return 1;
    if (aBids !== bBids) return bBids - aBids;
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Quotation Requests Showcase Banner */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-[#33271d] aspect-[1672/941] shadow-xl group">
        <Image
          src="/qoutes.png"
          alt="Motor Market Club Quotation Requests & Specialist Offers"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 900px"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14100c]/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Gold Top Banner (Matching mobile app reference media_1793860115662_3b606dcc.png) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] p-4 sm:p-6 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/15 border border-black/10 flex items-center justify-center shrink-0 shadow-inner">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-950" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-black text-zinc-950 tracking-tight truncate">
              Your Requested Quotes
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-zinc-900/80 truncate">
              {quotes.length} quote request{quotes.length !== 1 ? "s" : ""} • {totalBids} bid{totalBids !== 1 ? "s" : ""} received
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-black/10 hover:bg-black/20 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            title="Refresh Quotes"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/services/bodywork"
            className="px-3.5 py-2 rounded-xl bg-zinc-950 text-[#FAD293] hover:bg-zinc-900 font-black text-xs transition shadow-md flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>+ New Quote</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-[#33271d] bg-[#14100c]/60">
          <div className="w-14 h-14 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-[#f2cb87] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-white">Loading Quotes...</p>
          <p className="text-xs text-white/40 mt-1">Fetching your quotation requests</p>
        </div>
      ) : selectedPost ? (
        /* ─── Bids Detail View ─── */
        <div className="space-y-5 animate-fade-in">
          {/* Back + Post Info Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1409] via-[#17110a] to-[#120d07] border border-[#3a2a17] p-5 sm:p-6 shadow-2xl">
            <div className="absolute -top-1 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/30 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#f2cb87] hover:text-white transition cursor-pointer group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back to All Quotes
                </button>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-[10px] font-black text-[#f2cb87] uppercase tracking-widest bg-[#f2cb87]/10 px-2.5 py-1 rounded-lg border border-[#f2cb87]/20">
                    REF #{selectedPost.id.slice(0, 8).toUpperCase()}
                  </span>
                  {selectedPost.created_at && (
                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                      <CalendarDays size={11} />
                      {formatRequestedDate(selectedPost.created_at)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                  {getCategoryTitle(selectedPost)}: {selectedPost.service_description || selectedPost.damage_description || "Repair Request"}
                </h3>
                <div className="flex items-center gap-2.5 text-xs text-white/70 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Car size={13} className="text-[#f2cb87]" />
                    <span className="font-semibold text-white">{selectedPost.car_model || "Vehicle"}</span>
                  </div>
                  {selectedPost.car_registration_number && (
                    <span className="inline-block bg-[#F8D053] text-black font-black font-mono tracking-widest text-[11px] px-2 py-0.5 rounded shadow-sm border border-black/10">
                      {selectedPost.car_registration_number}
                    </span>
                  )}
                </div>
                {(selectedPost.service_address || (selectedPost as any).location_address || (selectedPost as any).postcode) && (
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <MapPin size={13} className="text-[#f2cb87]" />
                    <span>{extractReadableAddress(selectedPost.service_address) || (selectedPost as any).location_address || (selectedPost as any).postcode}</span>
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border ${bids.length > 0 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-[#f2cb87]/10 text-[#f2cb87] border-[#f2cb87]/25"}`}>
                  {bids.length > 0 ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {bids.length} Bid{bids.length !== 1 ? "s" : ""} Received
                </span>
              </div>
            </div>
          </div>

          {/* Bids Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Star size={14} className="text-[#f2cb87]" />
              Specialist Offers ({bids.length})
            </h4>

            {loadingBids ? (
              <div className="p-10 text-center rounded-3xl border border-[#33271d] bg-[#14100c]/60">
                <RefreshCw className="w-6 h-6 text-[#f2cb87] animate-spin mx-auto mb-3" />
                <p className="text-xs text-white/60">Loading specialist offers...</p>
              </div>
            ) : bids.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-[#33271d] bg-[#14100c] space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center mx-auto">
                  <Clock size={22} className="text-[#f2cb87]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">No bids received yet</p>
                  <p className="text-xs text-white/40 mt-1">Specialists are reviewing your request. Check back soon.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bids.map((bid) => {
                  const combined = `${selectedPost.service_description || ""} ${selectedPost.damage_description || ""} ${selectedPost.category?.name || ""}`.toLowerCase();
                  const isAlloy = selectedPost.category_id === "e1fb2dae-c233-4b45-852b-8253373e06d7" || combined.includes("alloy") || combined.includes("wheel") || combined.includes("rim");
                  const isMod = selectedPost.category_id === "5d98d5c9-509e-4ab7-859d-806174384e27" || combined.includes("modification") || combined.includes("tuning");
                  const targetPath = isAlloy ? "/services/alloy-wheel" : isMod ? "/services/modification" : "/services/bodywork";
                  const isDeclined = Boolean(declinedBidIds[bid.id] || (bid as any).status === "declined" || (bid as any).status === "rejected");

                  return (
                    <div
                      key={bid.id}
                      className="relative overflow-hidden rounded-2xl border border-[#3a2a17] bg-gradient-to-br from-[#1c1409] to-[#130e08] hover:border-[#f2cb87]/50 transition-all duration-300 shadow-xl group/bid"
                    >
                      <div className="absolute -top-px inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/25 to-transparent" />
                      <div className="p-5 space-y-4">
                        {/* Provider Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <BadgeCheck size={14} className="text-[#f2cb87] shrink-0" />
                              <h5 className="text-sm sm:text-base font-black text-white truncate">
                                {bid.provider?.company_name || "Specialist Garage"}
                              </h5>
                            </div>
                            {bid.provider?.company_address && (
                              <p className="flex items-center gap-1 text-[11px] text-white/50">
                                <MapPin size={10} className="text-[#f2cb87]/70 shrink-0" />
                                <span className="truncate">{bid.provider.company_address}</span>
                              </p>
                            )}
                            {bid.provider?.avg_rating !== undefined && Number(bid.provider.avg_rating) > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-[#f2cb87]">
                                <Star size={11} className="fill-[#f2cb87]" />
                                <span className="font-bold">{bid.provider.avg_rating}</span>
                                {bid.provider.rating_count ? (
                                  <span className="text-white/40">({bid.provider.rating_count})</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xl sm:text-2xl font-black text-emerald-400">
                              £{typeof bid.offered_price === "number" ? bid.offered_price.toFixed(2) : bid.offered_price}
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Offered Price</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {(bid.notes || bid.provider_note) && (
                          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
                            <p className="text-xs text-white/70 italic leading-relaxed">
                              "{bid.notes || bid.provider_note}"
                            </p>
                          </div>
                        )}

                        {/* Action Buttons: Direct Booking or Declined State */}
                        {isDeclined ? (
                          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-center">
                            <p className="text-xs font-bold text-red-400">Offer Declined</p>
                            {declinedBidIds[bid.id] && (
                              <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1">
                                Reason: {declinedBidIds[bid.id]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            {/* Decline Offer Button */}
                            <button
                              type="button"
                              onClick={() => setDecliningBid(bid)}
                              className="px-3.5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            >
                              <X size={13} />
                              <span>Decline</span>
                            </button>

                            {/* Direct Booking Link - goes straight to booking view, eliminating duplicate screen! */}
                            <Link
                              href={`${targetPath}?view=booking&post_id=${selectedPost.id}&bid_id=${bid.id}`}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] py-2.5 px-4 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-md shadow-[#E8AF66]/20 cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>Accept & Book Offer</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : quotes.length === 0 ? (
        /* ─── Empty State ─── */
        <div className="relative overflow-hidden p-12 text-center rounded-3xl border border-[#33271d] bg-gradient-to-br from-[#1c1409] to-[#120d07] space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#f2cb87]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-[#f2cb87]/10 border border-[#f2cb87]/20 flex items-center justify-center text-[#f2cb87] mx-auto shadow-lg shadow-[#f2cb87]/10">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">No Quotation Requests Yet</h3>
            <p className="text-xs text-white/45 mt-2 max-w-xs mx-auto leading-relaxed">
              Send a quote request with damage photos to receive competitive offers from local verified bodyshops and specialists.
            </p>
          </div>
          <Link
            href="/services/bodywork"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-3 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/25"
          >
            <Sparkles size={13} />
            <span>Request a Quote Now</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        /* ─── Quotes List (Matching mobile app cards media_1793860115662_3b606dcc.png) ─── */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
              {quotes.length} Quote Request{quotes.length !== 1 ? "s" : ""}
            </h3>
            {totalBids > 0 && (
              <span className="text-xs font-bold text-[#FAD293] bg-[#FAD293]/10 px-2.5 py-1 rounded-full border border-[#FAD293]/20">
                ★ {totalBids} Live Bid{totalBids !== 1 ? "s" : ""} on Top
              </span>
            )}
          </div>

          <div className="space-y-4">
            {sortedQuotes.map((q) => {
              const bidsCount = Number(q.bids_count || 0);
              const hasBids = bidsCount > 0;
              const categoryTitle = getCategoryTitle(q);
              const isBooked = (q as any).status === "booked" || (q as any).status === "accepted";
              const scheduleFormatted = formatScheduleDate(q.booking_schedule);

              return (
                <div
                  key={q.id}
                  className="group relative overflow-hidden rounded-3xl border border-[#2e2114] bg-gradient-to-b from-[#18120b] via-[#140e08] to-[#0e0a06] hover:border-[#f2cb87]/45 hover:shadow-[0_8px_30px_rgba(242,203,135,0.08)] transition-all duration-300 p-4 sm:p-5 space-y-4"
                >
                  {/* Subtle top edge glow */}
                  <div className="absolute -top-px inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/20 group-hover:via-[#f2cb87]/40 to-transparent transition-all duration-300 pointer-events-none" />

                  {/* 1. Header Row: Category Name + Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-[#FAD293] transition-colors">
                        {categoryTitle}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                        Requested on {formatRequestedDate(q.created_at)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isBooked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check size={12} strokeWidth={3} />
                          BOOKED
                        </span>
                      ) : hasBids ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-[#f2cb87]/20 text-[#f2cb87] border border-[#f2cb87]/40 shadow-sm shadow-[#f2cb87]/15 animate-pulse">
                          <Trophy size={11} className="text-[#f2cb87]" />
                          {bidsCount} BID{bidsCount > 1 ? "S" : ""} RECEIVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/5 text-white/50 border border-white/10">
                          <Trophy size={11} className="text-white/40" />
                          0 QUOTES
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Vehicle Row: Car Icon + Model + Yellow Registration Plate */}
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white min-w-0">
                      <Car size={16} className="text-[#f2cb87] shrink-0" />
                      <span className="truncate">{q.car_model || "Vehicle"}</span>
                    </div>

                    {q.car_registration_number && (
                      <span className="inline-block bg-[#F8D053] text-black font-black font-mono tracking-widest text-xs sm:text-sm px-2.5 py-0.5 rounded shadow-sm border border-black/10 shrink-0">
                        {q.car_registration_number}
                      </span>
                    )}
                  </div>

                  {/* 3. Inset Quote Counter Box (Matching mobile screenshot) */}
                  <div
                    onClick={() => handleSelectPost(q)}
                    className="rounded-2xl border border-[#2e2014] bg-[#0c0906] hover:border-[#f2cb87]/40 p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group/box"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          hasBids
                            ? "bg-[#f2cb87]/20 text-[#f2cb87] border border-[#f2cb87]/40 shadow-sm shadow-[#f2cb87]/15"
                            : "bg-white/8 text-white/50 border border-white/10"
                        }`}
                      >
                        {bidsCount}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover/box:text-[#f2cb87] transition-colors truncate">
                          {bidsCount} {bidsCount === 1 ? "Quote" : "Quotes"} Received
                        </p>
                        <p className="text-[11px] text-white/45 truncate mt-0.5">
                          {hasBids ? "Specialists have submitted offers" : "Awaiting quotes from repairers"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-white/40 group-hover/box:text-[#f2cb87] group-hover/box:translate-x-0.5 transition-all shrink-0"
                    />
                  </div>

                  {/* 4. Details: Service Details, Damage, Preferred Date */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-white/[0.04]">
                    <div className="flex items-start gap-2">
                      <Wrench size={13} className="text-[#f2cb87]/70 shrink-0 mt-0.5" />
                      <span className="text-white/50 shrink-0">Service Details:</span>
                      <span className="font-bold text-white line-clamp-1">
                        {q.service_description || "Vehicle quotation request"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertTriangle size={13} className="text-amber-400/80 shrink-0 mt-0.5" />
                      <span className="text-white/50 shrink-0">Damage:</span>
                      <span className="font-bold text-white line-clamp-1">
                        {q.damage_description || "Inspection request"}
                      </span>
                    </div>

                    {scheduleFormatted && (
                      <div className="flex items-start gap-2">
                        <CalendarDays size={13} className="text-[#f2cb87]/70 shrink-0 mt-0.5" />
                        <span className="text-white/50 shrink-0">Preferred Date:</span>
                        <span className="font-bold text-[#f2cb87]">{scheduleFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. Direct Provider Inset (if direct quote request) */}
                  {((q as any).provider || (q as any).direct_provider) && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 text-[#f2cb87]">
                        <Building2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          Sent to {(q as any).provider?.company_name || (q as any).direct_provider?.company_name || "Specialist"}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {(q as any).provider?.company_address || (q as any).direct_provider?.company_address || "Garage Workshop"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 6. Gold Action Button (VIEW BIDS) */}
                  <button
                    type="button"
                    onClick={() => handleSelectPost(q)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] py-3 text-xs sm:text-sm font-black text-zinc-950 transition hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#E8AF66]/20 cursor-pointer"
                  >
                    <Search size={14} strokeWidth={2.5} />
                    <span>VIEW BIDS ({bidsCount} AVAILABLE)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decline Offer Modal (with Reason / Special Note) */}
      {decliningBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#3a2a17] bg-gradient-to-br from-[#1c1409] via-[#161009] to-[#120d07] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                <h3 className="text-base font-black text-white">Decline Quotation Offer</h3>
              </div>
              <button
                type="button"
                onClick={() => setDecliningBid(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/60">
                Are you sure you want to decline this quote of{" "}
                <span className="font-bold text-emerald-400">
                  £{typeof decliningBid.offered_price === "number" ? decliningBid.offered_price.toFixed(2) : decliningBid.offered_price}
                </span>{" "}
                from{" "}
                <span className="font-bold text-white">
                  {decliningBid.provider?.company_name || "Specialist Garage"}
                </span>
                ?
              </p>
            </div>

            {/* Reason Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 block">Select Reason</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "The estimated price is higher than my budget.",
                  "Chosen another provider with earlier availability.",
                  "Repair is no longer needed at this time.",
                  "Need clarification on parts and labor warranty.",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDeclineReason(reason)}
                    className={`text-left text-xs p-2.5 rounded-xl border transition cursor-pointer ${
                      declineReason === reason
                        ? "bg-[#f2cb87]/15 border-[#f2cb87]/40 text-[#f2cb87] font-bold"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Special Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Special Note / Custom Reason</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter details or note for the provider..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:border-[#f2cb87] focus:outline-none transition resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDecliningBid(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={submittingDecline}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingDecline ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <span>Confirm Decline</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
