"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, HelpCircle, Loader2 } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import { getPageByKey, PageItem } from "@/lib/service/pages.api";

export default function FAQsPage() {
  const [pageData, setPageData] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const item = await getPageByKey("faqs");
        if (mounted && item) {
          setPageData(item);
        }
      } catch (err) {
        console.warn("[FAQsPage] error loading faqs cms:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cmsContent = pageData?.content || pageData?.value;

  return (
    <div className="min-h-screen bg-black text-white">
      <FAQSection isStandalone />
    </div>
  );
}
