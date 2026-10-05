"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EstimateDetailClient from "@/app/estimate/[token]/EstimateDetailClient";
import { Loader2 } from "lucide-react";

function ProviderEstimateQueryDetails() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("id") || "";

  return <EstimateDetailClient />;
}

export default function ProviderEstimateDetailsQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090706] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
        </div>
      }
    >
      <ProviderEstimateQueryDetails />
    </Suspense>
  );
}
