"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Coins,
  ShieldCheck,
  CreditCard,
  Gift,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  X,
  ExternalLink,
  Loader2,
  DollarSign,
  TrendingUp,
  Receipt,
  Tag,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import {
  getCustomerConfig,
  getCustomerWalletInfo,
  getWalletTransactions,
  getLoyaltyPointTransactions,
  transferLoyaltyPointsToWallet,
  getAddFundBonusList,
  buildAddFundPaymentUrl,
  WalletTransactionItem,
  LoyaltyPointTransactionItem,
  BonusItem,
  CustomerConfigContent,
  CustomerWalletInfo,
} from "@/lib/service/wallet.api";
import { useToast } from "@/components/ToastProvider";

interface WalletTabProps {
  user?: any;
  onProfileUpdated?: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ user: initialUser, onProfileUpdated }) => {
  const { showToast } = useToast();

  // Balances & Config
  const [walletInfo, setWalletInfo] = useState<CustomerWalletInfo | null>(null);
  const [config, setConfig] = useState<CustomerConfigContent | null>(null);
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active View: "wallet" or "loyalty"
  const [activeView, setActiveView] = useState<"wallet" | "loyalty">("wallet");

  // Wallet Transactions State
  const [walletTxFilter, setWalletTxFilter] = useState<string>("all");
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionItem[]>([]);
  const [loadingWalletTx, setLoadingWalletTx] = useState(true);

  // Loyalty Transactions State
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyPointTransactionItem[]>([]);
  const [loyaltyRate, setLoyaltyRate] = useState<number>(0);
  const [minTransferPoints, setMinTransferPoints] = useState<number>(0);
  const [loadingLoyaltyTx, setLoadingLoyaltyTx] = useState(false);

  // Bonus list for top-up
  const [bonuses, setBonuses] = useState<BonusItem[]>([]);

  // Modals
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState<number>(100);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("stripe");

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertPoints, setConvertPoints] = useState<number>(50);
  const [converting, setConverting] = useState(false);

  // 1. Fetch Balances & Config
  const loadHeaderData = useCallback(async () => {
    try {
      setLoadingHeader(true);
      const [infoRes, configRes, bonusRes, loyaltyRes] = await Promise.all([
        getCustomerWalletInfo(),
        getCustomerConfig(),
        getAddFundBonusList({ limit: 5 }),
        getLoyaltyPointTransactions({ limit: 1, offset: 1 }).catch(() => null),
      ]);
      if (infoRes) setWalletInfo(infoRes);
      if (configRes) {
        setConfig(configRes);
        const rateFromConfig = Number(
          configRes.loyalty_point_value_per_currency_unit ||
          configRes.loyalty_point_exchange_rate ||
          0
        );
        if (rateFromConfig > 0) setLoyaltyRate(rateFromConfig);

        const minFromConfig = Number(
          configRes.min_loyalty_point_to_transfer ||
          configRes.min_point_to_transfer ||
          0
        );
        if (minFromConfig > 0) setMinTransferPoints(minFromConfig);
      }
      if (bonusRes) setBonuses(bonusRes);
      if (loyaltyRes) {
        if (loyaltyRes.loyalty_point_value_per_currency_unit) {
          setLoyaltyRate(loyaltyRes.loyalty_point_value_per_currency_unit);
        }
        if (loyaltyRes.min_loyalty_point_to_transfer) {
          setMinTransferPoints(loyaltyRes.min_loyalty_point_to_transfer);
        }
        if (loyaltyRes.loyalty_point !== undefined && loyaltyRes.loyalty_point > 0) {
          setWalletInfo((prev) => (prev ? { ...prev, loyalty_point: loyaltyRes.loyalty_point } : prev));
        }
      }
    } catch (err) {
      console.warn("Error loading wallet header:", err);
    } finally {
      setLoadingHeader(false);
    }
  }, []);

  // 2. Fetch Wallet Transactions with Filter
  const loadWalletTransactions = useCallback(async (typeFilter: string) => {
    try {
      setLoadingWalletTx(true);
      const res = await getWalletTransactions({
        limit: 25,
        offset: 1,
        type: typeFilter === "all" ? "" : typeFilter,
      });
      setWalletTransactions(res.transactions || []);
      if (res.wallet_balance !== undefined) {
        setWalletInfo((prev) => (prev ? { ...prev, wallet_balance: res.wallet_balance } : prev));
      }
    } catch (err) {
      console.warn("Error loading wallet transactions:", err);
    } finally {
      setLoadingWalletTx(false);
    }
  }, []);

  // 3. Fetch Loyalty Transactions
  const loadLoyaltyTransactions = useCallback(async () => {
    try {
      setLoadingLoyaltyTx(true);
      const res = await getLoyaltyPointTransactions({ limit: 25, offset: 1 });
      setLoyaltyTransactions(res.transactions || []);
      if (res.loyalty_point_value_per_currency_unit) {
        setLoyaltyRate(res.loyalty_point_value_per_currency_unit);
      }
      if (res.min_loyalty_point_to_transfer) {
        setMinTransferPoints(res.min_loyalty_point_to_transfer);
      }
      if (res.loyalty_point !== undefined) {
        setWalletInfo((prev) => (prev ? { ...prev, loyalty_point: res.loyalty_point } : prev));
      }
    } catch (err) {
      console.warn("Error loading loyalty transactions:", err);
    } finally {
      setLoadingLoyaltyTx(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  // Load transactions based on active view and filter
  useEffect(() => {
    if (activeView === "wallet") {
      loadWalletTransactions(walletTxFilter);
    } else {
      loadLoyaltyTransactions();
    }
  }, [activeView, walletTxFilter, loadWalletTransactions, loadLoyaltyTransactions]);

  // Refresh All
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHeaderData();
    if (activeView === "wallet") {
      await loadWalletTransactions(walletTxFilter);
    } else {
      await loadLoyaltyTransactions();
    }
    if (onProfileUpdated) onProfileUpdated();
    setRefreshing(false);
    showToast("Wallet and transactions updated.", "info");
  };

  // Check for return from payment gateway (callback status)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("flag");
    const status = params.get("status");
    const amt = params.get("amount");
    if (flag === "success" || status === "success") {
      showToast(
        amt
          ? `£${amt} added to your wallet successfully!`
          : "Wallet top-up completed successfully!",
        "success"
      );
      loadHeaderData();
      loadWalletTransactions("all");
      if (onProfileUpdated) onProfileUpdated();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + "?tab=wallet"
      );
    } else if (flag === "fail" || status === "fail" || status === "canceled") {
      showToast("Wallet top-up was canceled or could not be processed.", "error");
      window.history.replaceState(
        {},
        "",
        window.location.pathname + "?tab=wallet"
      );
    }
  }, [loadHeaderData, loadWalletTransactions, onProfileUpdated, showToast]);

  // Convert Loyalty Points Handler
  const handleConvertPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsNum = Number(convertPoints);
    if (!pointsNum || pointsNum <= 0) {
      showToast("Please enter a valid points amount.", "error");
      return;
    }
    const currentPoints = Number(walletInfo?.loyalty_point || initialUser?.loyalty_point || 0);
    if (pointsNum > currentPoints) {
      showToast("You do not have enough loyalty points to convert.", "error");
      return;
    }
    if (minTransferPoints > 0 && pointsNum < minTransferPoints) {
      showToast(`Minimum required points to transfer is ${minTransferPoints} points.`, "error");
      return;
    }

    try {
      setConverting(true);
      const res = await transferLoyaltyPointsToWallet(pointsNum);
      if (res.success) {
        showToast(res.message || "Points converted to wallet balance successfully!", "success");
        setShowConvertModal(false);
        handleRefresh();
      } else {
        showToast(res.message || "Failed to convert points.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error converting points.", "error");
    } finally {
      setConverting(false);
    }
  };

  // Add Money / Payment Redirection Handler (Stripe Web Checkout)
  const handleProceedAddMoney = () => {
    const amt = Number(addAmount);
    if (!amt || amt < 5) {
      showToast("Minimum top-up amount is £5.00", "error");
      return;
    }
    const customerId = walletInfo?.id || initialUser?.id;
    const payUrl = buildAddFundPaymentUrl(amt, customerId);
    window.location.href = payUrl;
  };

  // Current values
  const currentWalletBalance = Number(
    walletInfo?.wallet_balance !== undefined
      ? walletInfo.wallet_balance
      : initialUser?.wallet_balance || 0
  );

  const currentLoyaltyPoints = Number(
    walletInfo?.loyalty_point !== undefined
      ? walletInfo.loyalty_point
      : initialUser?.loyalty_point || 0
  );

  // Effective exchange rate (fallback to 100 points = £1.00 if 0)
  const effectiveExchangeRate = loyaltyRate > 0 ? loyaltyRate : 100;
  const estimatedPointsValue = (currentLoyaltyPoints / effectiveExchangeRate).toFixed(2);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ─── Header Action Bar ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1409] via-[#161009] to-[#120d07] border border-[#3a2a17] p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-36 bg-[#f2cb87]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-px inset-x-12 h-px bg-gradient-to-r from-transparent via-[#f2cb87]/40 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#f2cb87] bg-[#f2cb87]/10 px-3 py-1 rounded-full border border-[#f2cb87]/25 uppercase tracking-widest">
                <Sparkles size={11} />
                MMC Pay & Rewards
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Balance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Customer Wallet &amp; Loyalty Rewards
            </h2>
            <p className="text-xs text-white/50">
              Prepaid instant checkout, reward point conversion, and complete transaction auditing
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition cursor-pointer disabled:opacity-40"
              title="Refresh wallet balances"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#f2cb87]" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddMoneyModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] px-4 py-2.5 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/20 cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add Funds</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Top Balances Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. DIGITAL WALLET CARD */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#3d2b17] bg-gradient-to-br from-[#24190c] via-[#1a1208] to-[#120c05] p-6 shadow-2xl transition-all duration-300 hover:border-[#f2cb87]/50 hover:shadow-[0_12px_40px_rgba(242,203,135,0.12)]">
          {/* Card background ambient graphics */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#f2cb87]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#d09a50]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#f2cb87]/15 border border-[#f2cb87]/30 flex items-center justify-center text-[#f2cb87] shadow-inner">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#f2cb87] tracking-widest uppercase">
                    MMC Digital Wallet
                  </p>
                  <p className="text-xs text-white/50">Instant Booking Checkout</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>

            {/* Balance Amount */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Available Wallet Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  £{currentWalletBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-white/40">GBP</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddMoneyModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-zinc-950 font-black text-xs transition hover:brightness-110 active:scale-[0.98] shadow-md shadow-[#d09a50]/20 cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Top-Up Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView("wallet");
                  setWalletTxFilter("all");
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs transition cursor-pointer"
              >
                View History
              </button>
            </div>
          </div>
        </div>

        {/* 2. LOYALTY REWARDS CARD */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#3d2b17] bg-gradient-to-br from-[#1f170e] via-[#171009] to-[#0e0904] p-6 shadow-2xl transition-all duration-300 hover:border-[#f2cb87]/50 hover:shadow-[0_12px_40px_rgba(242,203,135,0.12)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-inner">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-400 tracking-widest uppercase">
                    MMC Loyalty Rewards
                  </p>
                  <p className="text-xs text-white/50">Earned From Services</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <Sparkles size={10} />
                Points
              </span>
            </div>

            {/* Points Balance */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Total Reward Points
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {currentLoyaltyPoints}
                </span>
                <span className="text-xs font-bold text-amber-400/80">PTS</span>
                <span className="text-xs text-white/40">
                  (≈ £{estimatedPointsValue} Wallet Credit)
                </span>
              </div>
              <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold">
                  Admin Rate: 100 PTS = £{((100 / effectiveExchangeRate)).toFixed(2)}
                </span>
                {minTransferPoints > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70 font-semibold">
                    Min Transfer: {minTransferPoints} PTS
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const initialPts = minTransferPoints > 0
                    ? Math.min(currentLoyaltyPoints, minTransferPoints)
                    : (currentLoyaltyPoints >= 100 ? 100 : currentLoyaltyPoints);
                  setConvertPoints(initialPts > 0 ? initialPts : 100);
                  setShowConvertModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Convert to Wallet Balance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("loyalty")}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs transition cursor-pointer"
              >
                Points Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Active Top-Up Bonuses Banner (If available from /customer/bonus-list) ─── */}
      {bonuses && bonuses.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#f2cb87]/15 to-transparent border border-[#f2cb87]/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f2cb87]/20 border border-[#f2cb87]/30 flex items-center justify-center text-[#f2cb87] shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-[#f2cb87] uppercase tracking-wide">
                Special Recharge Promotion
              </p>
              <p className="text-xs text-white/80 font-semibold mt-0.5">
                {bonuses[0].bonus_title || "Get bonus credits when you top up your wallet!"}
              </p>
              {bonuses[0].min_add_money_amount > 0 && (
                <p className="text-[11px] text-white/50">
                  Minimum top-up: £{bonuses[0].min_add_money_amount} • Bonus: £{bonuses[0].bonus_amount}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (bonuses[0].min_add_money_amount) {
                setAddAmount(bonuses[0].min_add_money_amount);
              }
              setShowAddMoneyModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#f2cb87] hover:bg-[#e8b86d] text-zinc-950 font-bold text-xs transition shrink-0 self-start sm:self-center"
          >
            Claim Bonus
          </button>
        </div>
      )}

      {/* ─── Transactions Hub ─── */}
      <div className="space-y-4">
        {/* View Switcher: Wallet Transactions vs Loyalty Points */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("wallet")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeView === "wallet"
                  ? "bg-[#f2cb87] text-zinc-950 shadow-md shadow-[#f2cb87]/20"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Wallet size={14} />
              <span>Wallet Transactions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("loyalty")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeView === "loyalty"
                  ? "bg-[#f2cb87] text-zinc-950 shadow-md shadow-[#f2cb87]/20"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Coins size={14} />
              <span>Loyalty Point History</span>
            </button>
          </div>

          <p className="text-xs text-white/40">
            {activeView === "wallet" ? "Complete credit & debit log" : "Rewards earned & redeemed"}
          </p>
        </div>

        {/* ─── Filter Pills for Wallet Transactions (with Single/Short Names) ─── */}
        {activeView === "wallet" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "wallet_payment", label: "Payments" },
              { id: "add_fund", label: "Top-Up" },
          
              { id: "loyalty_point_earning", label: "Loyalty" },
              
             
              { id: "fund_by_admin", label: "Admin" },
            ].map((f) => {
              const isSelected = walletTxFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWalletTxFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? "bg-[#f2cb87]/15 text-[#f2cb87] border-[#f2cb87]/40 shadow-sm shadow-[#f2cb87]/10"
                      : "bg-white/4 text-white/60 border-white/8 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Transactions List ─── */}
        <div className="space-y-3">
          {activeView === "wallet" ? (
            /* Wallet Transactions */
            loadingWalletTx ? (
              <div className="p-12 text-center rounded-3xl border border-[#33271d] bg-[#14100c]/60">
                <Loader2 size={24} className="animate-spin text-[#f2cb87] mx-auto mb-3" />
                <p className="text-xs text-white/60">Loading wallet transactions...</p>
              </div>
            ) : walletTransactions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-[#33271d] bg-[#14100c] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                  <Receipt size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">No transactions found</p>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                    Transactions appear here when you add funds, convert loyalty points, or pay for bookings with your wallet balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f2cb87] text-zinc-950 font-bold text-xs hover:brightness-110 transition"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Top-Up Wallet Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {walletTransactions.map((tx) => {
                  const isCredit = Number(tx.credit || 0) > 0;
                  const amount = isCredit ? Number(tx.credit) : Number(tx.debit || 0);

                  let badgeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                  let typeLabel = "Wallet Payment";
                  let icon = <ArrowUpRight size={16} className="text-rose-400" />;

                  if (tx.trx_type === "wallet_payment") {
                    typeLabel = "Booking Payment";
                    badgeColor = "bg-rose-500/15 text-rose-400 border-rose-500/30";
                    icon = <ArrowUpRight size={16} className="text-rose-400" />;
                  } else if (tx.trx_type === "loyalty_point_earning") {
                    typeLabel = "Loyalty Converted";
                    badgeColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";
                    icon = <Sparkles size={16} className="text-amber-300" />;
                  } else if (tx.trx_type === "add_fund") {
                    typeLabel = "Wallet Top-Up";
                    badgeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                    icon = <ArrowDownLeft size={16} className="text-emerald-400" />;
                  } else if (tx.trx_type === "add_fund_bonus") {
                    typeLabel = "Add Fund Bonus";
                    badgeColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
                    icon = <Gift size={16} className="text-purple-300" />;
                  } else if (tx.trx_type === "booking_refund") {
                    typeLabel = "Booking Refund";
                    badgeColor = "bg-blue-500/15 text-blue-300 border-blue-500/30";
                    icon = <RotateCcw size={16} className="text-blue-300" />;
                  } else if (tx.trx_type === "referral_earning") {
                    typeLabel = "Referral Earning";
                    badgeColor = "bg-teal-500/15 text-teal-300 border-teal-500/30";
                    icon = <UserPlus size={16} className="text-teal-300" />;
                  } else if (tx.trx_type === "fund_by_admin") {
                    typeLabel = "Admin Credit";
                    badgeColor = "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
                    icon = <ShieldCheck size={16} className="text-cyan-300" />;
                  }

                  const formattedDate = tx.created_at
                    ? new Date(tx.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <div
                      key={tx.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#2e2014] bg-gradient-to-r from-[#17110a] to-[#110c07] hover:border-[#f2cb87]/40 p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      {/* Left: Icon + Type & Meta */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          {icon}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white group-hover:text-[#f2cb87] transition-colors truncate">
                              {typeLabel}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {tx.trx_type}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock size={11} />
                              {formattedDate}
                            </span>

                            {tx.booking?.readable_id && (
                              <Link
                                href={`/account?tab=bookings&bookingId=${tx.booking.readable_id}`}
                                className="text-[11px] font-bold text-[#f2cb87] hover:underline"
                              >
                                Booking #{tx.booking.readable_id}
                              </Link>
                            )}

                            {tx.reference_note && (
                              <span className="text-[11px] text-white/40 italic truncate">
                                "{tx.reference_note}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Balance */}
                      <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <div
                          className={`text-base sm:text-lg font-black ${
                            isCredit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isCredit ? "+" : "-"}£{amount.toFixed(2)}
                        </div>
                        <p className="text-[10px] text-white/40">
                          Balance: £{Number(tx.balance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Loyalty Transactions */
            loadingLoyaltyTx ? (
              <div className="p-12 text-center rounded-3xl border border-[#33271d] bg-[#14100c]/60">
                <Loader2 size={24} className="animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-xs text-white/60">Loading loyalty points log...</p>
              </div>
            ) : loyaltyTransactions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-[#33271d] bg-[#14100c] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Coins size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">No loyalty transactions yet</p>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                    You earn loyalty points every time you complete automotive services and bookings on Motor Market Club!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {loyaltyTransactions.map((tx) => {
                  const credit = Number(tx.credit || 0);
                  const debit = Number(tx.debit || 0);
                  const isCredit = credit > 0;
                  const isDebit = debit > 0;

                  let points = 0;
                  let isEarning = true;

                  if (isCredit) {
                    points = credit;
                    isEarning = true;
                  } else if (isDebit) {
                    points = debit;
                    isEarning = false;
                  } else {
                    const fallback = Number(
                      tx.point !== undefined && tx.point !== null
                        ? tx.point
                        : tx.points !== undefined && tx.points !== null
                        ? tx.points
                        : tx.amount || 0
                    );
                    points = Math.abs(fallback);
                    isEarning = fallback >= 0;
                  }

                  const rawType = (
                    tx.transaction_type ||
                    tx.point_type ||
                    tx.trx_type ||
                    ""
                  ).toLowerCase();

                  let typeTitle = isEarning ? "Points Credited" : "Points Converted";
                  if (
                    rawType.includes("wallet") ||
                    rawType.includes("transfer") ||
                    rawType.includes("convert")
                  ) {
                    typeTitle = "Converted to Wallet Balance";
                  } else if (
                    rawType.includes("order") ||
                    rawType.includes("booking")
                  ) {
                    typeTitle = "Earned from Service Booking";
                  } else if (
                    rawType.includes("bonus") ||
                    rawType.includes("reward")
                  ) {
                    typeTitle = "Bonus Reward Points";
                  } else if (rawType.includes("referral")) {
                    typeTitle = "Referral Reward Points";
                  } else if (tx.transaction_type) {
                    typeTitle = tx.transaction_type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  }

                  const refNote =
                    tx.reference || tx.reference_note || tx.detail || "";

                  const formattedDate = tx.created_at
                    ? new Date(tx.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <div
                      key={tx.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#2e2014] bg-gradient-to-r from-[#17110a] to-[#110c07] hover:border-amber-400/40 p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                            isEarning
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}
                        >
                          {isEarning ? <Sparkles size={18} /> : <Coins size={18} />}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                              {typeTitle}
                            </h4>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                isEarning
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              }`}
                            >
                              {isEarning ? "Credited" : "Converted"}
                            </span>
                          </div>

                          <p className="text-xs text-white/50 flex items-center gap-2">
                            <Clock size={11} />
                            <span>{formattedDate}</span>
                            {refNote && <span>• {refNote}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div
                          className={`text-base font-black ${
                            isEarning ? "text-amber-300" : "text-rose-400"
                          }`}
                        >
                          {isEarning ? "+" : "-"}
                          {points} PTS
                        </div>
                        {tx.balance !== undefined && (
                          <p className="text-[10px] text-white/40">
                            Balance: {Number(tx.balance || 0).toFixed(2)} PTS
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* ─── MODAL 1: ADD FUNDS / RECHARGE WALLET ─── */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#3a2a17] bg-gradient-to-br from-[#1c1409] via-[#161009] to-[#120d07] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f2cb87]/15 border border-[#f2cb87]/30 flex items-center justify-center text-[#f2cb87]">
                  <Wallet size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Top-Up Digital Wallet</h3>
                  <p className="text-[11px] text-white/50">Add funds for fast, 1-click booking checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMoneyModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 block">Select Top-Up Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-black transition border cursor-pointer ${
                      addAmount === amt
                        ? "bg-[#f2cb87] text-zinc-950 border-[#f2cb87] shadow-md shadow-[#f2cb87]/20"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    £{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 block">Or Custom Amount (£)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">
                  £
                </span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={addAmount}
                  onChange={(e) => setAddAmount(Number(e.target.value))}
                  placeholder="Enter amount (min £5)"
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-white placeholder-white/30 focus:border-[#f2cb87] focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-white/40">Min. £5.00 • Funds never expire</p>
            </div>

            {/* Payment Method - Dedicated Stripe Web Gateway */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 block">Payment Method</label>
              <div className="p-3.5 rounded-2xl border border-[#f2cb87]/40 bg-gradient-to-r from-[#f2cb87]/15 via-[#f2cb87]/5 to-transparent flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#635BFF]/20 border border-[#635BFF]/40 flex items-center justify-center text-[#9b87f5] shadow-sm flex-shrink-0">
                    <CreditCard size={20} className="text-[#a594fd]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-black text-white">Stripe Payment Gateway</p>
                      <span className="text-[9px] font-black text-[#f2cb87] bg-[#f2cb87]/15 px-2 py-0.5 rounded-full border border-[#f2cb87]/30 uppercase tracking-wider">
                        Web
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50">Official 256-bit encrypted checkout via Stripe</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f2cb87] flex items-center justify-center text-zinc-950 flex-shrink-0">
                  <CheckCircle2 size={13} className="stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedAddMoney}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] text-zinc-950 font-black text-xs sm:text-sm tracking-wide transition hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#d09a50]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Add £{addAmount || 0}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CONVERT LOYALTY POINTS ─── */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleConvertPoints}
            className="relative w-full max-w-md rounded-3xl border border-[#3a2a17] bg-gradient-to-br from-[#1c1409] via-[#161009] to-[#120d07] p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Coins size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Convert Loyalty Points</h3>
                  <p className="text-[11px] text-white/50">Transfer reward points directly into your wallet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance Overview */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/50 font-semibold uppercase">Current Points</p>
                <p className="text-lg font-black text-white">{currentLoyaltyPoints} PTS</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 font-semibold uppercase">Est. Value</p>
                <p className="text-lg font-black text-emerald-400">≈ £{estimatedPointsValue}</p>
              </div>
            </div>

            {/* Official Admin Conversion Rate & Exchange Rule */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#2a1d0f] via-[#21160b] to-[#170e06] p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#f2cb87] flex items-center gap-1.5">
                  <Coins size={14} className="text-[#f2cb87]" />
                  Admin Official Exchange Policy
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Rate
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-white/50 uppercase font-bold block">100 Loyalty Points</span>
                  <span className="text-base font-black text-[#f2cb87] block">
                    = £{((100 / effectiveExchangeRate)).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-medium block">
                    Wallet Credit
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-white/50 uppercase font-bold block">Rate Formula</span>
                  <span className="text-sm font-black text-white block">
                    {effectiveExchangeRate} PTS = £1.00
                  </span>
                  <span className="text-[10px] text-white/40 font-medium block">
                    (1 PT = £{(1 / effectiveExchangeRate).toFixed(4)})
                  </span>
                </div>
              </div>

              {minTransferPoints > 0 && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10 text-white/70">
                  <span className="flex items-center gap-1">
                    <span>🛡️</span> Min. Points to Transfer:
                  </span>
                  <span className="font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {minTransferPoints} PTS
                  </span>
                </div>
              )}
            </div>

            {/* Input Points to Convert */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white/70">Points to Transfer</label>
                <button
                  type="button"
                  onClick={() => setConvertPoints(currentLoyaltyPoints)}
                  className="text-[11px] font-bold text-[#f2cb87] hover:underline cursor-pointer"
                >
                  Use All ({currentLoyaltyPoints})
                </button>
              </div>

              <input
                type="number"
                min={minTransferPoints > 0 ? minTransferPoints : 1}
                max={currentLoyaltyPoints}
                value={convertPoints || ""}
                onChange={(e) => setConvertPoints(Number(e.target.value))}
                placeholder={minTransferPoints > 0 ? `Min ${minTransferPoints} points` : "Enter points (e.g. 100)"}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 focus:border-[#f2cb87] focus:outline-none transition"
              />

              {/* Quick Select Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {[
                  ...(minTransferPoints > 0 && minTransferPoints <= currentLoyaltyPoints ? [{ label: `Min (${minTransferPoints})`, val: minTransferPoints }] : []),
                  ...(currentLoyaltyPoints >= 100 ? [{ label: "100 PTS", val: 100 }] : []),
                  ...(currentLoyaltyPoints >= 500 ? [{ label: "500 PTS", val: 500 }] : []),
                  ...(currentLoyaltyPoints >= 1000 ? [{ label: "1,000 PTS", val: 1000 }] : []),
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConvertPoints(p.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                      convertPoints === p.val
                        ? "bg-[#f2cb87] text-zinc-950 border-[#f2cb87]"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Alert */}
            {minTransferPoints > 0 && Number(convertPoints || 0) > 0 && Number(convertPoints || 0) < minTransferPoints && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-center">
                ⚠️ Minimum required points set by admin is {minTransferPoints} PTS. Please enter at least {minTransferPoints} points.
              </p>
            )}

            {/* Live Calculation Output */}
            <div className="p-3.5 rounded-xl bg-[#f2cb87]/10 border border-[#f2cb87]/25 text-center space-y-1">
              <p className="text-xs text-white/80">
                You will receive{" "}
                <span className="font-black text-[#f2cb87] text-base">
                  £{(Number(convertPoints || 0) / effectiveExchangeRate).toFixed(2)}
                </span>{" "}
                instantly into your wallet.
              </p>
              <p className="text-[10px] text-white/50">
                Based on admin exchange rate: 100 PTS = £{((100 / effectiveExchangeRate)).toFixed(2)} ({effectiveExchangeRate} Points = £1.00)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  converting ||
                  currentLoyaltyPoints <= 0 ||
                  Number(convertPoints || 0) <= 0 ||
                  (minTransferPoints > 0 && Number(convertPoints || 0) < minTransferPoints) ||
                  Number(convertPoints || 0) > currentLoyaltyPoints
                }
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] text-zinc-950 font-black text-xs transition hover:brightness-110 active:scale-[0.98] shadow-md shadow-[#d09a50]/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {converting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <span>Confirm Transfer</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
