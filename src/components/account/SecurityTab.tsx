"use client";

import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

export const SecurityTab: React.FC = () => {
  return (
    <div className="rounded-3xl border border-[#33271d] bg-[#14100c] p-5 sm:p-7 shadow-2xl space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-bold text-white">Account Privacy & Security</h2>
        <p className="text-xs text-white/50 mt-0.5">
          Your session is protected with 256-bit SSL encryption and token authorization
        </p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between rounded-xl border border-[#33271d] bg-[#100d0a] p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-[#10b981]" />
            <div>
              <span className="font-semibold text-white block">
                Bearer Authorization Active
              </span>
              <span className="text-[11px] text-white/50">
                Your session token is active and authenticated
              </span>
            </div>
          </div>
          <span className="rounded-full bg-[#10b981]/20 border border-[#10b981]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#10b981]">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#33271d] bg-[#100d0a] p-4">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-[#e7bd78]" />
            <div>
              <span className="font-semibold text-white block">
                End-to-End Payment Tokenization
              </span>
              <span className="text-[11px] text-white/50">
                Stripe encrypted payment security
              </span>
            </div>
          </div>
          <span className="rounded-full bg-[#e7bd78]/20 border border-[#e7bd78]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#e7bd78]">
            Secured
          </span>
        </div>
      </div>
    </div>
  );
};
