"use client";

import React from "react";
import CmsPageRenderer from "@/components/common/CmsPageRenderer";

export default function AboutPage() {
  return (
    <CmsPageRenderer
      pageKey="about-us"
      fallbackTitle="About Motor Market Club"
      badgeLabel="Who We Are"
      defaultHtmlContent="<p>At Motor Market Club we are committed to providing reliable, affordable, and high-quality car care services that keep your vehicle running at its best. Whether it's routine maintenance, diagnostics, or major repairs, our team of experienced technicians is dedicated to delivering exceptional service with honesty and transparency.</p><p>We understand that your car is an essential part of your daily life, which is why we focus on quick turnaround times, genuine spare parts, and customer satisfaction.</p>"
      showTrustSection={true}
    />
  );
}
