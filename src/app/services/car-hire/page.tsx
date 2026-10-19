"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServicesCarHirePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/car-hire");
  }, [router]);

  return null;
}
