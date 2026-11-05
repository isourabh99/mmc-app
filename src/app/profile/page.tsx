"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090706] flex items-center justify-center text-white">
      <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
    </div>
  );
}
