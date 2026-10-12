"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Clock, FileText, Loader2, RefreshCw } from "lucide-react";
import { getPageByKey, PageItem } from "@/lib/service/pages.api";
import TrustSection from "@/components/TrustSection";

interface CmsPageRendererProps {
  pageKey: string;
  fallbackTitle: string;
  badgeLabel?: string;
  defaultHtmlContent?: string;
  showTrustSection?: boolean;
}

export default function CmsPageRenderer({
  pageKey,
  fallbackTitle,
  badgeLabel = "Official Policy",
  defaultHtmlContent = "",
  showTrustSection = true,
}: CmsPageRendererProps) {
  const [pageData, setPageData] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const item = await getPageByKey(pageKey);
        if (mounted && item) {
          setPageData(item);
        }
      } catch (err) {
        console.warn("[CmsPageRenderer] error loading page:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [pageKey]);

  const rawHtml = pageData?.content || pageData?.value || defaultHtmlContent;
  const title = pageData?.title || fallbackTitle;
  const sanitizedHtml = typeof rawHtml === "string" ? rawHtml.replace(/\bMMC\b/g, "Motor Market Club") : "";

  return (
    <div className="min-h-screen bg-[#090706] text-white pt-24 sm:pt-28 pb-20 selection:bg-[#FAD293] selection:text-black">
      {/* Background ambient gold glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f2cb87]/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] space-y-6 sm:space-y-8 animate-fade-in">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-white/50">
          <Link href="/" className="hover:text-[#f2cb87] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-white/30" />
          <span className="text-[#f2cb87] font-medium capitalize">{title}</span>
        </nav>

        {/* Page Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[#3a2c1e]/70 bg-gradient-to-br from-[#1c1409] via-[#161009] to-[#100c06] p-6 sm:p-10 shadow-2xl space-y-4">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#f2cb87]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293]/60 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f2cb87]/10 border border-[#f2cb87]/30 text-xs font-bold text-[#f2cb87]">
              <ShieldCheck size={14} />
              <span>{badgeLabel}</span>
            </div>

            {pageData?.updated_at && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock size={13} className="text-[#f2cb87]" />
                <span>
                  Last Updated:{" "}
                  {new Date(pageData.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white capitalize tracking-tight relative z-10">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed relative z-10">
            Please review the details below regarding our official service standards, operational guidelines, and customer commitments.
          </p>
        </div>

        {/* TinyMCE Rich Content Body Card */}
        <div className="relative rounded-3xl border border-[#3a2c1e]/60 bg-[#120d08]/90 backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f2cb87]/30 to-transparent pointer-events-none" />

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-[#f2cb87]" />
              <p className="text-xs text-white/60 tracking-wide font-medium">Loading page content...</p>
            </div>
          ) : sanitizedHtml ? (
            <div
              className="tinymce-content max-w-none text-left"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <div className="py-20 text-center space-y-3">
              <FileText size={36} className="text-white/20 mx-auto" />
              <h3 className="text-base font-bold text-white">Content Unavailable</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                This page content is currently being updated. Please check back shortly or reach out to support.
              </p>
            </div>
          )}
        </div>

        {/* Bottom CTA / Support */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white">Have questions about this policy?</h4>
            <p className="text-xs text-white/50">Our dedicated support team is available 24/7 to assist you.</p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#f2cb87] via-[#e8b86d] to-[#d09a50] text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-[#d09a50]/20 shrink-0 cursor-pointer"
          >
            Contact Support
          </Link>
        </div>

        {showTrustSection && (
          <div className="pt-6">
            <TrustSection />
          </div>
        )}
      </div>
    </div>
  );
}
