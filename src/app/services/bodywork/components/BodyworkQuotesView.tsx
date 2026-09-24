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
    Sparkles,
} from "lucide-react";
import type { CustomerQuotationPostItem, PostBidItem } from "@/lib/service/bodywork.api";

interface BodyworkQuotesViewProps {
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

export default function BodyworkQuotesView({
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
}: BodyworkQuotesViewProps) {
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
        <div className="max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6">
            {/* Top Bar */}
            <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
                            Quotation &amp; Bids Hub
                        </span>
                        {totalBidsCount > 0 && (
                            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                                {totalBidsCount} Live Bid{totalBidsCount > 1 ? "s" : ""} Received
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedPostForBids ? "Bodyshop Offers for Request" : "My Bodywork Quotation Requests"}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400">
                        {selectedPostForBids
                            ? "Compare custom prices and notes sent by verified bodywork & paint specialists."
                            : "Track real-time bids from accredited bodyshops and book the best repair offer."}
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
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="font-extrabold text-[#E8AF66] bg-[#E8AF66]/10 px-2.5 py-0.5 rounded border border-[#E8AF66]/20">
                                    {selectedPostForBids.car_registration_number || "REG: UNKNOWN"}
                                </span>
                                <span className="text-zinc-400 font-medium">
                                    {selectedPostForBids.car_model || "Vehicle Repair"}
                                </span>
                                {onCopyPostId && (
                                    <button
                                        type="button"
                                        onClick={() => onCopyPostId(selectedPostForBids.id)}
                                        className="text-[11px] text-zinc-500 hover:text-zinc-300 ml-2 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedId === selectedPostForBids.id ? (
                                            <span className="text-emerald-400 font-bold">✓ Copied</span>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Ref #{selectedPostForBids.id.slice(0, 8)}</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-zinc-300">
                                Schedule: <strong className="text-white">{selectedPostForBids.booking_schedule || "Flexible"}</strong>
                            </div>
                            {(selectedPostForBids.damage_description || selectedPostForBids.service_description) && (
                                <p className="text-xs text-zinc-400 italic">
                                    &ldquo;{selectedPostForBids.damage_description || selectedPostForBids.service_description}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bids List */}
                    {loadingPostBids ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-16 text-center space-y-3 shadow-2xl">
                            <div className="w-10 h-10 border-2 border-[#E8AF66] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-zinc-400">Loading received repair offers from accredited bodyshops...</p>
                        </div>
                    ) : postBidsList.length === 0 ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-12 sm:p-16 text-center space-y-3 shadow-2xl">
                            <Clock3 className="w-12 h-12 text-[#E8AF66] mx-auto opacity-80" />
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                Awaiting Bodyshop Bids
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                                Quotations usually arrive within 10 to 30 minutes from accredited local bodyshops and mobile paint units.
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
                                                    {bid.provider?.logo_full_path || (bid.provider as any)?.logo ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={bid.provider?.logo_full_path || (bid.provider as any)?.logo}
                                                            alt={bid.provider?.company_name || "Provider"}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-base font-extrabold text-[#E8AF66]">
                                                            {bid.provider?.company_name?.slice(0, 2).toUpperCase() || "BW"}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-base font-extrabold text-white capitalize">
                                                        {bid.provider?.company_name || "Bodywork Specialist"}
                                                    </h4>
                                                    <div className="text-xs text-zinc-400 mt-0.5">
                                                        Contact: <strong className="text-zinc-200">{bid.provider?.contact_person_name || "Specialist"}</strong> • {bid.provider?.company_phone}
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
                                                    Offered Repair Price
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
                                                    Bodyshop Assessment Note:
                                                </span>
                                                <p className="italic text-zinc-200 font-medium">
                                                    &ldquo;{bid.provider_note}&rdquo;
                                                </p>
                                            </div>
                                        )}

                                        {/* CTA: Book this offer */}
                                        <div className="flex items-center justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => onBookBidOffer(bid)}
                                                className="w-full sm:w-auto bg-gradient-to-r from-[#F6D089] to-[#D5A054] hover:brightness-105 active:scale-95 text-zinc-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-[#D5A054]/20 cursor-pointer"
                                            >
                                                <span>Book This Repair Offer ({priceFormatted})</span>
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
                /* View B: List of All Customer Requests */
                <div className="space-y-4">
                    {loadingRequests && sortedRequests.length === 0 ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-16 text-center space-y-3 shadow-2xl">
                            <div className="w-10 h-10 border-2 border-[#E8AF66] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-zinc-400">Loading your bodywork quotation requests...</p>
                        </div>
                    ) : sortedRequests.length === 0 ? (
                        <div className="bg-[#141518] border border-zinc-800 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xl">
                            <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                    No Repair Quotation Requests Yet
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                                    You have not sent any bodywork quotation requests yet. Search bodyshops with your vehicle reg to request competitive repair quotes.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onBackToSearch}
                                className="bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer active:scale-95 uppercase tracking-wider"
                            >
                                Start Bodywork Quote Search
                            </button>
                        </div>
                    ) : (
                        sortedRequests.map((item, idx) => {
                            const hasBids = (item.bids_count ?? 0) > 0;
                            const createdDate = item.created_at
                                ? new Date(item.created_at).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                  })
                                : "Recent Request";

                            return (
                                <div
                                    key={item.id || idx}
                                    className={`bg-[#141518] rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-4 ${
                                        hasBids
                                            ? "border-2 border-[#E8AF66] bg-gradient-to-b from-[#1b1915] to-[#141518] shadow-[0_0_25px_rgba(232,175,102,0.12)]"
                                            : "border border-zinc-800 hover:border-zinc-700"
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="font-extrabold text-xs text-[#E8AF66] bg-[#E8AF66]/10 px-3 py-1 rounded-full border border-[#E8AF66]/20 uppercase tracking-wider">
                                                {item.car_registration_number || "REG: N/A"}
                                            </span>
                                            <span className="font-bold text-xs text-white">
                                                {item.car_model || "Vehicle Repair"}
                                            </span>
                                            <span className="text-[11px] text-zinc-500">
                                                • Requested on {createdDate}
                                            </span>
                                        </div>

                                        <div>
                                            {hasBids ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-950 bg-gradient-to-r from-[#F6D089] to-[#D5A054] px-3.5 py-1 rounded-full shadow-md shadow-[#D5A054]/25 uppercase tracking-wider animate-pulse">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>{item.bids_count} Offer{item.bids_count === 1 ? "" : "s"} Received</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">
                                                    <Clock3 className="w-3.5 h-3.5" />
                                                    <span>Awaiting Bids</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle info */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800/80 space-y-0.5">
                                            <div className="text-zinc-500 uppercase font-bold text-[10px]">Service Request</div>
                                            <div className="text-zinc-200 font-semibold truncate">
                                                {item.service_description || item.damage_description || "Bodywork & Paint Repair"}
                                            </div>
                                        </div>
                                        <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800/80 space-y-0.5">
                                            <div className="text-zinc-500 uppercase font-bold text-[10px]">Preferred Date</div>
                                            <div className="text-zinc-200 font-semibold">
                                                {item.booking_schedule || "Flexible"}
                                            </div>
                                        </div>
                                        <div className="bg-[#191A1E] rounded-2xl p-3 border border-zinc-800/80 space-y-0.5">
                                            <div className="text-zinc-500 uppercase font-bold text-[10px]">Bodyshop Offers</div>
                                            <div className="text-xs font-semibold">
                                                {hasBids ? (
                                                    <span className="text-emerald-400 font-bold">
                                                        {item.bids_count} Received Offer{item.bids_count === 1 ? "" : "s"}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-400 font-medium">
                                                        Awaiting Specialist Quotes
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="flex items-center justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => onSelectPostForBids(item)}
                                            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer ${
                                                hasBids
                                                    ? "bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 shadow-md shadow-[#D5A054]/25 hover:brightness-105 active:scale-95"
                                                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                                            }`}
                                        >
                                            <Search className="w-4 h-4" />
                                            <span>
                                                {hasBids
                                                    ? `Review ${item.bids_count} Received Offer${item.bids_count === 1 ? "" : "s"}`
                                                    : "Check Live Status"}
                                            </span>
                                            <ArrowRight className="w-4 h-4" />
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
