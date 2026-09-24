"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServicesTyreFittingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tyre-fittings");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs text-white/50">
      Redirecting to Tyre Fitting services...
    </div>
  );
}
