"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Navigation,
  MessageSquare,
  Phone,
  Receipt,
  Check,
  Loader2,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  Truck,
  ArrowRight,
} from "lucide-react";
import { TyreAssistanceBooking } from "@/lib/data/tyre-assistance.data";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface ProviderQuoteStepProps {
  booking: TyreAssistanceBooking;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export const ProviderQuoteStep: React.FC<ProviderQuoteStepProps> = ({
  booking,
  onConfirm,
  onBack,
}) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: "user" | "provider"; text: string; time: string }[]
  >([
    {
      sender: "provider",
      text: `Hello! This is ${booking.provider.name} dispatch team. We have received your assistance request for ${booking.vehicleMakeModel} (${booking.vehicleRegistration}) and have your tyre in stock.`,
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Confirmation error:", err);
      setIsConfirming(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: "user" as const,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "provider",
          text: "Understood! Once you confirm the quote, our technician will be immediately dispatched.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader title="Provider Details" onBack={onBack} />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block space-y-1.5 pb-2 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Matched Certified Provider & Official Quote
        </h2>
        <p className="text-xs text-white/60">
          Review the assigned service provider details, guarantees, and itemized transparent quote before confirming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left / Provider & Capabilities Card (Desktop col-span-7) */}
        <div className="md:col-span-7 space-y-4">
          {/* Provider Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#141210] border border-white/10 relative shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border border-white/10 overflow-hidden flex-shrink-0 relative shadow-md">
                  <Image
                    src={booking.provider.image}
                    alt={booking.provider.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {booking.provider.name}
                  </h3>

                  <div className="flex items-center space-x-1.5">
                    <Star size={14} className="fill-[#FAD293] text-[#FAD293]" />
                    <span className="text-xs text-white/80 font-medium">
                      {booking.provider.rating || 0}{" "}
                      <span className="text-white/40">
                        ({booking.provider.reviewCount} Reviews)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-start space-x-1.5 text-white/60 pt-1">
                    <MapPin size={13} className="text-[#FAD293] flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-snug">
                      {booking.provider.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance Pill */}
              <div className="px-3 py-1 rounded-full border border-[#FAD293]/40 bg-[#FAD293]/10 text-[#FAD293] text-xs font-semibold flex items-center space-x-1 flex-shrink-0">
                <Navigation size={11} className="rotate-45" />
                <span>{booking.provider.distanceMiles} Miles</span>
              </div>
            </div>

            {/* Quick Contact Icons */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-white/50">Direct Dispatcher Hotline:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowChatModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#FAD293]/40 text-[#FAD293] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <MessageSquare size={14} />
                  <span>Chat</span>
                </button>

                <a
                  href={`tel:${booking.provider.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#FAD293]/40 text-[#FAD293] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Capabilities Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#181410] to-[#120f0d] border border-white/10 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Verified Capabilities
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#FAD293] flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-white/90">
                  Tyre Is In Stock & Reserved for Your Booking
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#FAD293] flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-white/90">
                  {booking.assistanceType === "recovery_truck"
                    ? "Offers Recovery Truck Service & Workshop Bay"
                    : "Offers Mobile Tyre Fitting Vans At Your Location"}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-[#FAD293] flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-white/90">
                  Can Come To Your Current Location ({booking.locationAddress})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Quote Summary Card (Desktop col-span-5) */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#141210] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
              <Receipt size={18} className="text-[#FAD293]" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Quote Summary
              </h3>
            </div>

            <div className="space-y-3">
              {/* Tyre Line */}
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-white/60">
                  Tyre{" "}
                  <span className="text-white font-medium">
                    ({booking.quote.tyreDescription})
                  </span>
                </span>
                <span className="text-[#FAD293] font-bold">
                  £{booking.quote.tyrePrice}
                </span>
              </div>

              {/* Labour Line */}
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-white/60">
                  Labour{" "}
                  <span className="text-white font-medium">
                    (Tyre Removal, Fitting)
                  </span>
                </span>
                <span className="text-[#FAD293] font-bold">
                  £{booking.quote.labourPrice}
                </span>
              </div>

              {/* Call-Out Fee */}
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-white/60">Call-Out Fee</span>
                <span className="text-[#FAD293] font-bold">
                  £{booking.quote.callOutFee}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-3" />

              {/* Fare Amount */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-[#FAD293]">
                  Fare Amount
                </span>
                <span className="text-2xl font-black text-[#FAD293]">
                  £{booking.quote.fareAmount}
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full py-4 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
                }}
              >
                {isConfirming ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Confirming & Assigning...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Request Assistance</span>
                    <ArrowRight size={16} className="stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#16120e] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-black border border-white/10 overflow-hidden relative">
                  <Image
                    src={booking.provider.image}
                    alt={booking.provider.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {booking.provider.name}
                  </h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online Dispatcher
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[220px]">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${m.sender === "user"
                        ? "bg-[#FAD293] text-black font-medium rounded-br-none"
                        : "bg-black/60 text-white/90 border border-white/10 rounded-bl-none"
                      }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-white/35 mt-1 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-black/40 border-t border-white/10 flex items-center space-x-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FAD293]"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[#FAD293] text-black flex items-center justify-center font-bold"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
