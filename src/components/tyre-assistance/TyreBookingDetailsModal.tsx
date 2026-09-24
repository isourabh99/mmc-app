"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  Car,
  Wrench,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Navigation,
  Sparkles,
} from "lucide-react";
import { TyreAssistanceBooking } from "@/lib/data/tyre-assistance.data";

interface TyreBookingDetailsModalProps {
  booking: TyreAssistanceBooking;
  isOpen: boolean;
  onClose: () => void;
  onCancelBooking?: (bookingId: string) => Promise<void>;
}

export const TyreBookingDetailsModal: React.FC<TyreBookingDetailsModalProps> = ({
  booking,
  isOpen,
  onClose,
  onCancelBooking,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!onCancelBooking) return;
    setIsCancelling(true);
    try {
      await onCancelBooking(booking.id);
      setShowCancelConfirm(false);
      onClose();
    } catch (err) {
      console.error("Cancel booking error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-[#141210] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-black/60 border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Booking Reference
              </span>
              <span className="text-xs font-mono font-bold text-[#FAD293] bg-[#FAD293]/10 px-2 py-0.5 rounded-md border border-[#FAD293]/20">
                {booking.referenceNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-white/40 hover:text-white transition cursor-pointer"
                title="Copy reference number"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-white/50">
              Created {new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                  {booking.status === "cancelled"
                    ? "Booking Cancelled"
                    : "Booking Confirmed & Dispatched"}
                </h4>
                <p className="text-[11px] text-emerald-200/70">
                  {booking.status === "cancelled"
                    ? "This assistance request has been terminated."
                    : "Certified technician is preparing to arrive."}
                </p>
              </div>
            </div>

            {booking.status !== "cancelled" && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-pulse">
                Active
              </span>
            )}
          </div>

          {/* 2. Assigned Technician Card */}
          {booking.technician && (
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Assigned Roadside Technician
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 overflow-hidden relative">
                    <Image
                      src={booking.technician.avatar}
                      alt={booking.technician.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {booking.technician.name}
                    </h4>
                    <p className="text-[11px] text-[#FAD293]">
                      {booking.technician.role}
                    </p>
                    <p className="text-[10px] text-white/45">
                      ⭐ {booking.technician.rating} ({booking.technician.completedJobs} jobs completed)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/40 block">ETA</span>
                  <span className="text-sm font-extrabold text-[#FAD293]">
                    ~{booking.technician.etaMinutes} mins
                  </span>
                </div>
              </div>

              {/* Vehicle specs */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/60">{booking.technician.vehicleModel}</span>
                <span className="bg-[#f6be00] text-black font-bold font-mono px-2 py-0.5 rounded text-[10px]">
                  {booking.technician.vehiclePlate}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${booking.technician.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Phone size={14} className="text-[#FAD293]" />
                  <span>Call Driver</span>
                </a>
                <a
                  href={`sms:${booking.technician.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare size={14} className="text-[#FAD293]" />
                  <span>Send SMS</span>
                </a>
              </div>
            </div>
          )}

          {/* 3. Live Step Progress Tracker */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Live Progress
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { label: "Request Submitted", done: true },
                { label: "Provider Matched & Quote Accepted", done: true },
                { label: "Technician Assigned", done: true },
                { label: "Dispatched & En Route", done: true, active: true },
                { label: "Tyre Service Completed", done: false },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.done
                        ? "bg-[#FAD293] text-black"
                        : "bg-white/10 text-white/40"
                    } ${step.active ? "ring-2 ring-[#FAD293] animate-pulse" : ""}`}
                  >
                    {step.done ? <Check size={11} className="stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`${
                      step.active
                        ? "text-[#FAD293] font-bold"
                        : step.done
                        ? "text-white/90"
                        : "text-white/40"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Booking Summary Details */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Assistance Details
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/45 block text-[10px]">Service Type</span>
                <span className="font-semibold text-white">
                  {booking.assistanceLabel}
                </span>
              </div>
              <div>
                <span className="text-white/45 block text-[10px]">Category</span>
                <span className="font-semibold text-white">
                  {booking.categoryLabel}
                </span>
              </div>
              <div>
                <span className="text-white/45 block text-[10px]">Date & Time</span>
                <span className="font-semibold text-white">
                  {booking.formattedDateTime}
                </span>
              </div>
              <div>
                <span className="text-white/45 block text-[10px]">Location Mode</span>
                <span className="font-semibold text-white">
                  {booking.serviceLocationLabel}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1">
              <span className="text-white/45 block text-[10px]">Address</span>
              <span className="text-xs font-semibold text-white block">
                {booking.locationAddress}
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-white/45 block text-[10px]">Vehicle</span>
                <span className="font-semibold text-white">
                  {booking.vehicleMakeModel}
                </span>
              </div>
              <div>
                <span className="text-white/45 block text-[10px]">Reg Plate</span>
                <span className="font-bold text-[#FAD293]">
                  {booking.vehicleRegistration}
                </span>
              </div>
              <div>
                <span className="text-white/45 block text-[10px]">Tyre Size</span>
                <span className="font-semibold text-white">
                  {booking.tyreSize} (x{booking.tyreQuantity})
                </span>
              </div>
            </div>

            {booking.notes && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-white/45 block text-[10px]">Customer Notes</span>
                <p className="text-xs text-white/70 italic">&ldquo;{booking.notes}&rdquo;</p>
              </div>
            )}
          </div>

          {/* 5. Itemized Quote & Payment Breakdown */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
            <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center justify-between">
              <span>Itemized Invoice</span>
              <span className="text-white/60 normal-case">VAT Included</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Tyre ({booking.quote.tyreDescription})</span>
                <span>£{booking.quote.tyrePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Labour & Fitting</span>
                <span>£{booking.quote.labourPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Call-Out Fee</span>
                <span>£{booking.quote.callOutFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 my-1 pt-1 flex justify-between font-bold text-sm text-[#FAD293]">
                <span>Total Fare Paid</span>
                <span>£{booking.quote.fareAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={handlePrintInvoice}
            className="py-3 px-4 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} />
            <span>Print Invoice</span>
          </button>

          {booking.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="py-3 px-4 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition cursor-pointer"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#181410] border border-red-500/30 rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Cancel Assistance?</h3>
            <p className="text-xs text-white/60">
              Are you sure you want to cancel your roadside tyre assistance request?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="py-3 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="py-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
