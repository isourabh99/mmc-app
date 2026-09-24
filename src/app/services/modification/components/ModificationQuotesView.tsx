"use client";

import React from "react";
import Image from "next/image";
import {
    FileText,
    RefreshCw,
    Wrench,
    Clock3,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Search,
    ChevronLeft,
    Car,
    MapPin,
    AlertCircle,
    Copy,
    Check,
    Star,
    DollarSign,
    Flame,
    Zap,
} from "lucide-react";
import type { CustomerQuotationPostItem, PostBidItem } from "@/lib/service/modification.api";

interface ModificationQuotesViewProps {
    quotationRequests: CustomerQuotationPostItem[];
    loadingRequests: boolean;
    onRefreshRequests: () => Promise<void>;
    selectedPostForBids: CustomerQuotationPostItem | null;
    postBidsList: PostBidItem[];
    loadingPostBids: boolean;
    onSelectPostForBids: (post: CustomerQuotationPostItem) => void;
    onBackToList: () => void;
    onRefreshPostBids: () => Promise<void>;
    onBookBidOffer: (bid: PostBidItem) => void;
    onBackToSearch: () => void;
    onCopyPostId?: (id: string) => void;
    copiedId?: string | null;
}

export default function ModificationQuotesView({
    quotationRequests,
    loadingRequests,
    onRefreshRequests,
    selectedPostForBids,
    postBidsList,
    loadingPostBids,
    onSelectPostForBids,
    onBackToList,
    onRefreshPostBids,
    onBookBidOffer,
    onBackToSearch,
    onCopyPostId,
    copiedId,
}: ModificationQuotesViewProps) {
    // Sort so items with bids_count > 0 appear first
    const sortedRequests = [...quotationRequests].sort((a, b) => {
        const aCount = a.bids_count || 0;
        const bCount = b.bids_count || 0;
        if (aCount > 0 && bCount === 0) return -1;
        if (aCount === 0 && bCount > 0) return 1;
        if (aCount !== bCount) return bCount - aCount;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
    });

    const totalBidsCount = sortedRequests.reduce((acc, r) => acc + (r.bids_count || 0), 0);

    return (
        <div className="max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6 pb-20">
            {/* Top Bar */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
                            Modification Quotes &amp; Bids Hub
                        </span>
                        {totalBidsCount > 0 && (
                            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                                {totalBidsCount} Live Bid{totalBidsCount > 1 ? "s" : ""} Received
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedPostForBids ? "Specialist Offers for Build" : "My Modification Quotes"}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400">
                        {selectedPostForBids
                            ? "Compare custom prices and notes sent by verified tuning & customization garages."
                            : "Track real-time bids from certified modification workshops and book the best offer."}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {selectedPostForBids ? (
                        <>
                            <button
                                type="button"
                                onClick={onBackToList}
                                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-[#E8AF66]" />
                                <span>Back to All Quotes</span>
                            </button>
                            <button
                                type="button"
                                onClick={onRefreshPostBids}
                                disabled={loadingPostBids}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-[#E8AF66] ${loadingPostBids ? "animate-spin" : ""}`} />
                                <span>Refresh Bids</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onRefreshRequests}
                                disabled={loadingRequests}
                                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-[#E8AF66] ${loadingRequests ? "animate-spin" : ""}`} />
                                <span>Refresh Live Bids</span>
                            </button>
                            <button
                                type="button"
                                onClick={onBackToSearch}
                                className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#D5A054]/20 cursor-pointer active:scale-95 uppercase tracking-wider"
                            >
                                <span>+ New Quote Request</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* View A: Detail of Bids for Selected Request */}
            {selectedPostForBids ? (
                <div className="space-y-6">
                    {/* Selected Post Summary Header Card */}
                    <div className="bg-[#16171B] border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-2.5 py-0.5 rounded border border-[#E8AF66]/20">
                                    {selectedPostForBids.car_registration_number || "REG: UNKNOWN"}
                                </span>
                                <span className="text-zinc-400 font-medium">
                                    {selectedPostForBids.car_model || "Vehicle Modification"}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-300">
                                Preferred Date: <strong className="text-white">{selectedPostForBids.booking_schedule || "Flexible"}</strong>
                            </div>
                            {selectedPostForBids.service_description && (
                                <p className="text-xs text-zinc-400 italic">
                                    &ldquo;{selectedPostForBids.service_description}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bids List */}
                    {loadingPostBids ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-16 text-center space-y-3 shadow-2xl">
                            <div className="w-10 h-10 border-2 border-[#E8AF66] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-zinc-400">Loading received offers from customization workshops...</p>
                        </div>
                    ) : postBidsList.length === 0 ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-12 sm:p-16 text-center space-y-3 shadow-2xl">
                            <Clock3 className="w-12 h-12 text-[#E8AF66] mx-auto opacity-80" />
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                Awaiting Workshop Quotes
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                                Modification quotes usually arrive within 15 to 45 minutes as engineers review part compatibility and labor estimates.
                                Click &quot;Refresh Bids&quot; above to check for incoming offers.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {postBidsList.map((bid) => {
                                const priceFormatted =
                                    typeof bid.offered_price === "number"
                                        ? `£${bid.offered_price.toFixed(2)}`
                                        : String(bid.offered_price).startsWith("£")
                                        ? bid.offered_price
                                        : `£${bid.offered_price}`;

                                return (
                                    <div
                                        key={bid.id}
                                        className="bg-[#141518] border border-zinc-800 hover:border-[#E8AF66]/60 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shrink-0 p-1">
                                                    {bid.provider?.logo_full_path ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={bid.provider.logo_full_path}
                                                            alt={bid.provider.company_name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-base font-extrabold text-[#E8AF66]">
                                                            {bid.provider?.company_name?.slice(0, 2).toUpperCase() || "MP"}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-base font-extrabold text-white capitalize">
                                                        {bid.provider?.company_name || "Modification Specialist"}
                                                    </h4>
                                                    <div className="text-xs text-zinc-400 mt-0.5">
                                                        Contact: <strong className="text-zinc-200">{bid.provider?.contact_person_name || "Lead Engineer"}</strong> • {bid.provider?.company_phone}
                                                    </div>
                                                    {bid.provider?.company_address && (
                                                        <div className="text-[11px] text-zinc-500 truncate max-w-sm mt-0.5">
                                                            {bid.provider.company_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price Tag */}
                                            <div className="text-right shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                                                    Offered Fixed Estimate
                                                </span>
                                                <div className="text-2xl sm:text-3xl font-black text-[#E8AF66]">
                                                    {priceFormatted}
                                                </div>
                                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase">
                                                    {bid.status || "Offer Active"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Specialist Note */}
                                        {bid.provider_note && (
                                            <div className="bg-[#191A1E] border border-zinc-800/80 rounded-2xl p-4 text-xs text-zinc-300 space-y-1">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                                    Engineer&apos;s Build Proposal &amp; Notes:
                                                </span>
                                                <p className="italic text-zinc-200 font-medium">
                                                    &ldquo;{bid.provider_note}&rdquo;
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Button: Accept & Schedule Booking */}
                                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Price confirmed by workshop • Select slot on next screen</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onBookBidOffer(bid)}
                                                className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] hover:from-[#eec477] hover:to-[#c69145] text-zinc-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D5A054]/25 cursor-pointer uppercase tracking-wider active:scale-95"
                                            >
                                                <span>Accept &amp; Schedule Booking</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* View B: List of all Quotation Requests */
                <div className="space-y-4">
                    {loadingRequests ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-16 text-center space-y-3 shadow-2xl">
                            <div className="w-10 h-10 border-2 border-[#E8AF66] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-zinc-400">Loading your modification requests...</p>
                        </div>
                    ) : sortedRequests.length === 0 ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                                <FileText className="w-8 h-8 text-[#E8AF66]" />
                            </div>
                            <h3 className="text-lg font-bold text-white">No Quotation Requests Yet</h3>
                            <p className="text-xs text-zinc-400 max-w-md mx-auto">
                                You haven&apos;t sent any modification quote requests yet. Choose specialists from our directory to receive competitive quotes.
                            </p>
                            <button
                                type="button"
                                onClick={onBackToSearch}
                                className="px-6 py-2.5 bg-[#E8AF66] text-black text-xs font-black rounded-xl hover:bg-[#d89e55] transition-colors cursor-pointer uppercase tracking-wider shadow-lg shadow-[#E8AF66]/10"
                            >
                                Browse Modification Specialists
                            </button>
                        </div>
                    ) : (
                        sortedRequests.map((post) => {
                            const bidsCount = post.bids_count || 0;
                            const hasBids = bidsCount > 0;

                            return (
                                <div
                                    key={post.id}
                                    onClick={() => onSelectPostForBids(post)}
                                    className={`bg-[#141518] border rounded-3xl p-5 sm:p-6 shadow-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                                        hasBids
                                            ? "border-[#E8AF66]/60 hover:border-[#E8AF66] hover:bg-[#18191E]"
                                            : "border-zinc-800 hover:border-zinc-700"
                                    }`}
                                >
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap text-xs">
                                            <span className="font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 tracking-wider">
                                                {post.car_registration_number || "REG: CUSTOM"}
                                            </span>
                                            {post.car_model && (
                                                <span className="font-semibold text-zinc-200 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                                    {post.car_model}
                                                </span>
                                            )}
                                            {hasBids ? (
                                                <span className="font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider text-[11px] animate-pulse">
                                                    {bidsCount} Live Bid{bidsCount > 1 ? "s" : ""} Available
                                                </span>
                                            ) : (
                                                <span className="font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 text-[11px]">
                                                    Awaiting Bids
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-2">
                                            {post.service_description || "Vehicle modification and tuning specification"}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                                            {post.booking_schedule && (
                                                <span>Schedule: <strong className="text-zinc-400">{post.booking_schedule}</strong></span>
                                            )}
                                            {post.created_at && (
                                                <span>Requested: {new Date(post.created_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectPostForBids(post);
                                            }}
                                            className={`text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer uppercase tracking-wider ${
                                                hasBids
                                                    ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/20"
                                                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                                            }`}
                                        >
                                            <span>{hasBids ? `View ${bidsCount} Bid${bidsCount > 1 ? "s" : ""}` : "Check Status"}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
