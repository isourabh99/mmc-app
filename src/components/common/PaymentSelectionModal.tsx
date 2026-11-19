"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Wallet,
  CreditCard,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { getCustomerWalletInfo, buildAddFundPaymentUrl } from "@/lib/service/wallet.api";
import { useToast } from "@/components/ToastProvider";

export type PaymentMethodType = "stripe" | "wallet_payment";

export interface PaymentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  isPartial: boolean;
  onPartialChange: (isPartial: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  serviceTitle?: string;
  depositPercentage?: number; // default 25
  allowCash?: boolean; // deprecated - cash removed per business rule
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  selectedMethod,
  onMethodChange,
  isPartial,
  onPartialChange,
  onConfirm,
  loading = false,
  serviceTitle = "Service",
  depositPercentage = 25,
}) => {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [customTopUpAmount, setCustomTopUpAmount] = useState<string>("");
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirmClick = async () => {
    if (loading || internalLoading || hasInsufficientWalletBalance || isTopUpLoading) {
      console.warn("[PaymentSelectionModal] Blocked click:", { loading, internalLoading, hasInsufficientWalletBalance, isTopUpLoading });
      return;
    }
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (err: any) {
      console.error("[PaymentSelectionModal] Confirm error:", err);
      showToast(err?.message || "Failed to process payment. Please try again.", "error");
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync wallet balance from localStorage and live backend API
  const fetchWalletBalance = () => {
    setLoadingWallet(true);
    getCustomerWalletInfo()
      .then((info) => {
        if (info && info.wallet_balance !== undefined) {
          setWalletBalance(Number(info.wallet_balance));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch customer wallet balance:", err);
      })
      .finally(() => {
        setLoadingWallet(false);
      });
  };

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.wallet_balance !== undefined) {
            setWalletBalance(Number(u.wallet_balance));
          }
        }
      } catch { }
    }

    fetchWalletBalance();
  }, [isOpen]);

  // Check if returning from a direct wallet top-up callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const href = window.location.href;
      const searchParams = new URLSearchParams(window.location.search);
      const isTopUp = href.includes("wallet_topup=success") || searchParams.get("wallet_topup") === "success";

      if (isTopUp) {
        fetchWalletBalance();
        onMethodChange("wallet_payment");

        const amt = searchParams.get("topup_amount") || searchParams.get("amount");
        if (href.includes("flag=fail") || searchParams.get("flag") === "fail") {
          showToast("Wallet top-up was cancelled or failed. Please try again.", "error");
        } else {
          showToast(`£${amt || ""} added to your MMC Digital Wallet! Balance refreshed.`, "success");
        }

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("wallet_topup");
        cleanUrl.searchParams.delete("topup_amount");
        cleanUrl.searchParams.delete("open_payment");
        cleanUrl.searchParams.delete("reopen_payment");
        cleanUrl.searchParams.delete("status");
        cleanUrl.searchParams.delete("payment_status");
        cleanUrl.searchParams.delete("flag");
        cleanUrl.searchParams.delete("amount");
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    } catch { }
  }, []);

  const validTotal = Math.max(0, Number(totalAmount) || 0);
  const depositRate = Math.min(100, Math.max(1, depositPercentage)) / 100;
  const depositAmount = Number((validTotal * depositRate).toFixed(2));
  const remainingAmount = Number((validTotal - depositAmount).toFixed(2));
  const dueNow = isPartial ? depositAmount : validTotal;
  const deficit = Math.max(0, dueNow - walletBalance);

  // Initialize suggested top up amount when deficit changes
  useEffect(() => {
    if (deficit > 0) {
      const rounded = Math.max(5, Math.ceil(deficit));
      setCustomTopUpAmount(String(rounded));
    } else {
      setCustomTopUpAmount("25");
    }
  }, [deficit]);

  const hasInsufficientWalletBalance =
    selectedMethod === "wallet_payment" && walletBalance < dueNow;

  const suggestedAmounts = useMemo(() => {
    const list: number[] = [];
    const minNeeded = Math.max(5, Math.ceil(deficit));
    if (minNeeded > 0) list.push(minNeeded);
    [25, 50, 100, 250].forEach((amt) => {
      if (!list.includes(amt) && amt >= minNeeded) {
        list.push(amt);
      }
    });
    return list.slice(0, 4);
  }, [deficit]);

  // Direct In-Modal Top Up Handler - Returns right back to this exact booking page!
  const handleDirectTopUp = () => {
    const num = parseFloat(customTopUpAmount);
    if (isNaN(num) || num < 5) {
      showToast("Minimum top-up amount is £5.00", "error");
      return;
    }

    setIsTopUpLoading(true);
    try {
      // Build callback URL to return to this EXACT page with query params
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("status");
      currentUrl.searchParams.delete("payment_status");
      currentUrl.searchParams.delete("flag");
      currentUrl.searchParams.set("wallet_topup", "success");
      currentUrl.searchParams.set("topup_amount", String(num));
      currentUrl.searchParams.set("open_payment", "1");

      const topUpUrl = buildAddFundPaymentUrl(num, undefined, currentUrl.toString());

      showToast(`Initiating £${num.toFixed(2)} Wallet Top-Up via Stripe...`, "info");
      window.location.href = topUpUrl;
    } catch (err: any) {
      console.error("Top-up redirection error:", err);
      showToast(err?.message || "Failed to initialize wallet top-up.", "error");
      setIsTopUpLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141518] border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl animate-scale-up max-h-[92vh] overflow-y-auto scrollbar-thin my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading || isTopUpLoading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#E8AF66] bg-[#E8AF66]/10 px-2.5 py-0.5 rounded-full border border-[#E8AF66]/25 uppercase tracking-widest">
              Checkout &amp; Payment
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Select Payment Method
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Choose how you want to pay for {serviceTitle}
          </p>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1 (TOP): PAYMENT PLAN (25% DEPOSIT VS 100% FULL) */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
            1. Choose Payment Plan
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan A: 25% Deposit */}
            <div
              onClick={() => onPartialChange(true)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${isPartial
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#D5A054]/20 text-[#E8AF66] border border-[#D5A054]/30 mb-1">
                    {depositPercentage}% Advance Deposit
                  </span>
                  <p className="text-xs font-bold text-white">Pay Deposit Now</p>
                  <p className="text-lg font-black text-[#E8AF66] mt-0.5">
                    £{depositAmount.toFixed(2)}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isPartial
                      ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                      : "border-zinc-700 bg-transparent"
                    }`}
                >
                  {isPartial && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 flex justify-between items-center">
                <span>Due after service:</span>
                <span className="font-bold text-zinc-300">£{remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Plan B: 100% Full Payment */}
            <div
              onClick={() => onPartialChange(false)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${!isPartial
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                    100% Full Payment
                  </span>
                  <p className="text-xs font-bold text-white">Full Total Upfront</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    £{validTotal.toFixed(2)}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${!isPartial
                      ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                      : "border-zinc-700 bg-transparent"
                    }`}
                >
                  {!isPartial && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 flex justify-between items-center">
                <span>Balance remaining:</span>
                <span className="font-bold text-emerald-400">£0.00 (Paid in Full)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2 (BOTTOM): PAYMENT GATEWAY / SOURCE            */}
        {/* (Both Wallet and Stripe available for Partial & Full)    */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
            2. Select Payment Method
          </label>

          <div className="space-y-2.5">
            {/* Method 1: MMC Digital Wallet */}
            <div
              onClick={() => onMethodChange("wallet_payment")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${selectedMethod === "wallet_payment"
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${selectedMethod === "wallet_payment"
                      ? "bg-gradient-to-tr from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                    }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-white">MMC Digital Wallet</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E8AF66]/15 text-[#E8AF66] border border-[#E8AF66]/30">
                      Instant 1-Click
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                    <span>Available Balance:</span>
                    <span
                      className={`font-mono font-bold ${walletBalance >= dueNow ? "text-emerald-400" : "text-amber-400"
                        }`}
                    >
                      {loadingWallet ? "..." : `£${walletBalance.toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      • {isPartial ? `Deduct £${depositAmount.toFixed(2)}` : `Deduct £${validTotal.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === "wallet_payment"
                    ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                    : "border-zinc-700 bg-transparent"
                  }`}
              >
                {selectedMethod === "wallet_payment" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Method 2: Online Card Payment via Stripe (Available for BOTH Partial & Full Payment) */}
            <div
              onClick={() => onMethodChange("stripe")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${selectedMethod === "stripe"
                  ? "bg-[#1C1A16] border-[#D5A054] shadow-lg shadow-[#D5A054]/10 ring-1 ring-[#D5A054]/40"
                  : "bg-[#18181B] border-zinc-800 hover:border-zinc-700"
                }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${selectedMethod === "stripe"
                      ? "bg-gradient-to-tr from-[#F6D089] to-[#D5A054] text-zinc-950 font-bold"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                    }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-white">Online Card Payment</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Stripe
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {isPartial
                      ? `Pay 25% deposit (£${depositAmount.toFixed(2)}) `
                      : `Pay full 100% total (£${validTotal.toFixed(2)}) `}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === "stripe"
                    ? "border-[#D5A054] bg-[#D5A054] text-zinc-950"
                    : "border-zinc-700 bg-transparent"
                  }`}
              >
                {selectedMethod === "stripe" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DIRECT IN-MODAL WALLET TOP-UP WHEN BALANCE IS DEFICIENT */}
        {/* ======================================================== */}
        {hasInsufficientWalletBalance && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-950/20 to-black/40 space-y-3 animate-fade-in shadow-xl">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-extrabold text-xs uppercase tracking-wide">
                  Insufficient Wallet Balance
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                Need +£{deficit.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Your wallet has <strong className="text-amber-300">£{walletBalance.toFixed(2)}</strong>, but <strong className="text-white">£{dueNow.toFixed(2)}</strong> is due now. Add funds below to complete booking instantly on this page.
            </p>

            {/* Quick Amount Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                Select Top-Up Amount
              </div>
              <div className="grid grid-cols-4 gap-2">
                {suggestedAmounts.map((amt) => {
                  const isSelected = Number(customTopUpAmount) === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomTopUpAmount(String(amt))}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition border cursor-pointer ${isSelected
                          ? "bg-[#D5A054] text-black border-[#D5A054] shadow-md shadow-[#D5A054]/20"
                          : "bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:border-[#D5A054]"
                        }`}
                    >
                      £{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input & Instant Top Up CTA */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                  £
                </span>
                <input
                  type="number"
                  min={Math.max(5, Math.ceil(deficit))}
                  value={customTopUpAmount}
                  onChange={(e) => setCustomTopUpAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white font-bold focus:outline-none focus:border-[#D5A054]"
                  placeholder="Custom amount"
                />
              </div>

              <button
                type="button"
                onClick={handleDirectTopUp}
                disabled={isTopUpLoading || Number(customTopUpAmount) < 5}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#D5A054]/20 shrink-0"
              >
                {isTopUpLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Top-Up £{Number(customTopUpAmount || 0).toFixed(0)}</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => onMethodChange("stripe")}
                className="text-[11px] text-[#E8AF66] hover:underline cursor-pointer font-semibold"
              >
                Or pay directly with Card via Stripe ({isPartial ? `£${depositAmount.toFixed(2)} deposit` : `£${validTotal.toFixed(2)} full`}) &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Breakdown Box */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Total Agreed Price:</span>
            <span className="font-bold text-white">£{validTotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span>Selected Payment:</span>
            <span className="font-bold text-white">
              {selectedMethod === "wallet_payment"
                ? "MMC Digital Wallet"
                : "Stripe Online Card Payment"}
            </span>
          </div>

          <div className="flex items-center justify-between font-black text-sm pt-2 border-t border-zinc-800 text-white">
            <span className="text-[#E8AF66]">
              Payable Today ({isPartial ? `${depositPercentage}% Deposit` : "Full 100%"}):
            </span>
            <span className="text-base text-[#E8AF66]">£{dueNow.toFixed(2)}</span>
          </div>
        </div>

        {/* Confirm / Pay Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={loading || internalLoading || hasInsufficientWalletBalance || isTopUpLoading}
            className="w-full bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-[#D5A054]/25 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {(loading || internalLoading) ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-950" />
                <span>
                  {selectedMethod === "wallet_payment"
                    ? "Deducting from Wallet & Confirming..."
                    : "Redirecting to Payment Gateway..."}
                </span>
              </>
            ) : hasInsufficientWalletBalance ? (
              <span>Top-Up Wallet Above to Confirm Booking</span>
            ) : (
              <>
                <span>
                  {selectedMethod === "wallet_payment"
                    ? isPartial
                      ? `Pay Deposit from Wallet (£${depositAmount.toFixed(2)})`
                      : `Pay Full Amount from Wallet (£${validTotal.toFixed(2)})`
                    : isPartial
                      ? `Pay Deposit with Stripe (£${depositAmount.toFixed(2)})`
                      : `Pay Full Amount with Stripe (£${validTotal.toFixed(2)})`}
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-950" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PaymentSelectionModal;
