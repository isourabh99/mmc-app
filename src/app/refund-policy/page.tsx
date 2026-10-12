import CmsPageRenderer from "@/components/common/CmsPageRenderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Motor Market Club",
  description: "Learn about refund eligibility, timelines, and claim processes for Motor Market Club.",
};

const defaultRefundHtml = `
<h2>1. Refund Guarantee</h2>
<p>At Motor Market Club, customer satisfaction and high-quality workmanship are our primary objectives. We stand behind our verified network of garages, technicians, and automotive specialists. If a service does not meet agreed quality standards, you are protected by our clear refund framework.</p>

<h2>2. Eligibility for Refunds</h2>
<p>You may be entitled to a full or partial refund under the following conditions:</p>
<ul>
  <li><strong>Timely Cancellations:</strong> Any eligible cancellation initiated in accordance with our <a href="/cancellation-policy">Cancellation Policy</a>.</li>
  <li><strong>Provider Inability to Fulfill:</strong> When an assigned workshop or technician fails to attend or perform the scheduled work.</li>
  <li><strong>Defective Workmanship or Incorrect Parts:</strong> In the event of confirmed substandard execution or incorrect part installation that cannot be remedied by the provider.</li>
  <li><strong>Overcharging / Billing Discrepancies:</strong> Any duplicate payment or unauthorized surcharge verified against the agreed estimate.</li>
</ul>

<h2>3. Refund Processing Timelines</h2>
<p>Once an authorized refund is approved by our resolution team:</p>
<ul>
  <li>Refunds are automatically routed to the original payment method (Credit/Debit Card, Apple Pay, Google Pay).</li>
  <li>Card issuers and banks typically reflect the credited funds within <strong>3 to 5 business days</strong>.</li>
  <li>You will receive a confirmation receipt and reference ID via email immediately upon processing.</li>
</ul>

<h2>4. Non-Refundable Items</h2>
<p>The following charges are non-refundable:</p>
<ul>
  <li>Completed emergency roadside dispatch where technician arrived on scene.</li>
  <li>Custom-fabricated vehicle modification parts ordered with customer sign-off.</li>
  <li>Diagnostic inspection fees where diagnostics were accurately completed and reported to the vehicle owner.</li>
</ul>

<h2>5. Raising a Refund Claim</h2>
<p>If you have questions regarding a charge or wish to submit a refund claim, please contact us at <a href="mailto:support@motormatesclub.co.uk">support@motormatesclub.co.uk</a> with your Booking Reference ID, photographs (if applicable), and a concise summary of the issue. Our resolution team will respond within 24 hours.</p>
`;

export default function RefundPolicyPage() {
  return (
    <CmsPageRenderer
      pageKey="refund-policy"
      fallbackTitle="Refund Policy"
      badgeLabel="Refund Guarantee"
      defaultHtmlContent={defaultRefundHtml}
      showTrustSection={true}
    />
  );
}
