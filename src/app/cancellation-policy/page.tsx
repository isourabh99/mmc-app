import CmsPageRenderer from "@/components/common/CmsPageRenderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy | Motor Market Club",
  description: "Official cancellation, rescheduling, and refund terms for Motor Market Club services.",
};

const defaultCancellationHtml = `
<h2>1. Cancellation Overview</h2>
<p>We understand that automotive maintenance and travel schedules can change. Motor Market Club offers transparent, flexible cancellation policies designed to protect both our valued customers and service partners.</p>

<h2>2. Cancellation Windows & Fees</h2>
<ul>
  <li><strong>Standard Services (Valet, Mechanical, Tyres):</strong> Free cancellation up to <strong>24 hours</strong> before the scheduled appointment. Cancellations made within 24 hours of the appointment time may be subject to a £15 cancellation/admin fee to cover slot reservation costs.</li>
  <li><strong>Specialist Services (Bodywork, Alloy Refurbishment, Modifications):</strong> Free cancellation up to <strong>48 hours</strong> before the booked date. If custom materials or bespoke paint mixes have already been ordered by the provider, the direct material cost may be deducted from the deposit refund.</li>
  <li><strong>Car Hire & Chauffeur:</strong> Free cancellation up to <strong>48 hours</strong> prior to vehicle dispatch or pickup time. Cancellations within 24 hours incur a 50% hire fee.</li>
  <li><strong>Emergency Assistance:</strong> Once an emergency recovery vehicle or mobile emergency technician has been dispatched to your GPS location, emergency callout fees become non-refundable.</li>
</ul>

<h2>3. Rescheduling Your Appointment</h2>
<p>You can easily reschedule your booking free of charge up to <strong>12 hours</strong> prior to your scheduled time directly through your <a href="/account">Account Dashboard</a> or by contacting our 24/7 customer support line.</p>

<h2>4. Cancellations by Service Provider</h2>
<p>In the rare event that an authorized provider is unable to fulfill your booking due to severe weather, equipment breakdown, or emergency circumstances, Motor Market Club will:</p>
<ul>
  <li>Instantly re-assign your job to an alternative verified workshop or provider in your area with zero extra charge, OR</li>
  <li>Issue an immediate <strong>100% full refund</strong> back to your original payment method.</li>
</ul>

<h2>5. How to Request Cancellation</h2>
<p>To cancel an active booking, navigate to <a href="/account">My Bookings</a>, select the booking reference, and click <em>"Cancel Booking"</em>, or email <a href="mailto:support@motormatesclub.co.uk">support@motormatesclub.co.uk</a> with your Booking ID.</p>
`;

export default function CancellationPolicyPage() {
  return (
    <CmsPageRenderer
      pageKey="cancellation-policy"
      fallbackTitle="Cancellation Policy"
      badgeLabel="Cancellation Guidelines"
      defaultHtmlContent={defaultCancellationHtml}
      showTrustSection={true}
    />
  );
}
