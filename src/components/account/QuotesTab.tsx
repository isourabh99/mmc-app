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
  CheckCircle2,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import {
  getMyQuotationRequests,
  getReceivedBidsForPost,
  CustomerQuotationPostItem,
  PostBidItem,
} from "@/lib/service/bodywork.api";

export const QuotesTab: React.FC = () => {
  const [quotes, setQuotes] = useState<CustomerQuotationPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CustomerQuotationPostItem | null>(null);
  const [bids, setBids] = useState<PostBidItem[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

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

  const totalBids = quotes.reduce((acc, q) => acc + Number(q.bids_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quotation Requests Showcase Banner */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-[#33271d] aspect-[1672/941] shadow-xl group">
        <Image
          src="/qoutes.png"
          alt="MMC Quotation Requests & Specialist Offers"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 900px"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14100c]/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1409] via-[#17110a] to-[#120d07] border border-[#3a2a17] shadow-2xl p-5 sm:p-6">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-[#f2cb87]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-1 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/40 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#f2cb87] bg-[#f2cb87]/10 px-3 py-1 rounded-full border border-[#f2cb87]/25 uppercase tracking-widest">
                <Sparkles size={10} />
                Quotation Hub
              </span>
              {totalBids > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 uppercase tracking-widest animate-pulse">
                  <TrendingUp size={10} />
                  {totalBids} Live Bid{totalBids > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">My Quotation Requests</h2>
            <p className="text-xs text-white/50">Track specialist bids, compare repair estimates, and accept workshop offers</p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <FileText size={12} className="text-[#f2cb87]" />
                <span><span className="font-bold text-white">{quotes.length}</span> Requests</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <BadgeCheck size={12} className="text-emerald-400" />
                <span><span className="font-bold text-white">{totalBids}</span> Bids Received</span>
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
              href="/services/bodywork"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] px-4 py-2.5 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/25"
            >
              <Sparkles size={12} />
              <span>+ New Quote</span>
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
          <p className="text-sm font-semibold text-white">Loading Quotes...</p>
          <p className="text-xs text-white/40 mt-1">Fetching your quotation requests</p>
        </div>

      ) : selectedPost ? (
        /* ─── Bids Detail View ─── */
        <div className="space-y-5 animate-fade-in">
          {/* Back + Post Info */}
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
                  <span className="text-[10px] font-black text-[#f2cb87]/70 uppercase tracking-widest bg-[#f2cb87]/10 px-2.5 py-1 rounded-lg border border-[#f2cb87]/15">
                    REF #{selectedPost.id.slice(0, 8).toUpperCase()}
                  </span>
                  {selectedPost.created_at && (
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <CalendarDays size={11} />
                      {new Date(selectedPost.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                  {selectedPost.service_description || selectedPost.damage_description || "Repair Request"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Car size={13} className="text-[#f2cb87]" />
                  <span>{selectedPost.car_model || "Vehicle"} {selectedPost.car_registration_number ? `· ${selectedPost.car_registration_number}` : ""}</span>
                </div>
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
                  return (
                    <div
                      key={bid.id}
                      className="relative overflow-hidden rounded-2xl border border-[#3a2a17] bg-gradient-to-br from-[#1c1409] to-[#130e08] hover:border-[#f2cb87]/50 transition-all duration-300 shadow-xl group/bid"
                    >
                      <div className="absolute -top-px inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/25 to-transparent" />
                      <div className="p-4 space-y-4">
                        {/* Provider Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <BadgeCheck size={13} className="text-[#f2cb87] shrink-0" />
                              <h5 className="text-sm font-black text-white truncate">
                                {bid.provider?.company_name || "Specialist Garage"}
                              </h5>
                            </div>
                            {bid.provider?.company_address && (
                              <p className="flex items-center gap-1 text-[11px] text-white/45">
                                <MapPin size={10} className="text-[#f2cb87]/60 shrink-0" />
                                {bid.provider.company_address}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xl font-black text-emerald-400">
                              £{typeof bid.offered_price === "number" ? bid.offered_price.toFixed(2) : bid.offered_price}
                            </div>
                            <p className="text-[10px] text-white/35 uppercase tracking-wider">Offered Price</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {bid.notes && (
                          <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                            <p className="text-xs text-white/65 italic leading-relaxed">"{bid.notes}"</p>
                          </div>
                        )}

                        {/* Accept Button */}
                        <Link
                          href={`${targetPath}?view=quotes&post_id=${selectedPost.id}&bid_id=${bid.id}`}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] py-2.5 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-md shadow-[#d09a50]/20"
                        >
                          <CheckCircle2 size={13} />
                          <span>Accept & Book This Offer</span>
                          <ArrowRight size={13} />
                        </Link>
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
        /* ─── Quotes List ─── */
        <div className="space-y-3">
          {quotes.map((q) => {
            const bidsCount = Number(q.bids_count || 0);
            const hasBids = bidsCount > 0;
            return (
              <div
                key={q.id}
                onClick={() => handleSelectPost(q)}
                className="group relative overflow-hidden rounded-2xl border border-[#2e2012] bg-gradient-to-br from-[#1a1208] via-[#161009] to-[#100c06] hover:border-[#f2cb87]/45 hover:shadow-[0_8px_30px_rgba(242,203,135,0.08)] transition-all duration-300 cursor-pointer"
              >
                {/* Gold top edge glow on hover */}
                <div className="absolute -top-px inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#f2cb87]/0 group-hover:via-[#f2cb87]/30 to-transparent transition-all duration-300" />

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${hasBids ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-[#f2cb87]/10 border border-[#f2cb87]/20"}`}>
                      {hasBids ? (
                        <TrendingUp size={16} className="text-emerald-400" />
                      ) : (
                        <Wrench size={16} className="text-[#f2cb87]" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      {/* Ref + Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-[#f2cb87]/80 uppercase tracking-widest bg-[#f2cb87]/8 px-2 py-0.5 rounded-md border border-[#f2cb87]/12">
                          REF #{q.id.slice(0, 8).toUpperCase()}
                        </span>
                        {q.created_at && (
                          <span className="flex items-center gap-1 text-[11px] text-white/35">
                            <CalendarDays size={10} />
                            {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white group-hover:text-[#f2cb87] transition-colors truncate max-w-xs sm:max-w-none">
                        {q.service_description || q.damage_description || "Repair Quotation Request"}
                      </h3>

                      {/* Vehicle */}
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Car size={12} className="text-[#f2cb87]/70 shrink-0" />
                        <span className="truncate">
                          {q.car_model || "Vehicle"}
                          {q.car_registration_number ? ` · ${q.car_registration_number}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-13 sm:pl-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border whitespace-nowrap ${
                      hasBids
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-[#f2cb87]/8 text-[#f2cb87]/70 border-[#f2cb87]/15"
                    }`}>
                      {hasBids ? (
                        <>
                          <CheckCircle2 size={11} />
                          {bidsCount} Bid{bidsCount > 1 ? "s" : ""} Received
                        </>
                      ) : (
                        <>
                          <AlertCircle size={11} />
                          Awaiting Bids
                        </>
                      )}
                    </span>

                    <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-[#f2cb87]/15 border border-white/8 group-hover:border-[#f2cb87]/30 flex items-center justify-center transition-all">
                      <ChevronRight size={14} className="text-white/30 group-hover:text-[#f2cb87] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
