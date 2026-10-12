import CmsPageRenderer from "@/components/common/CmsPageRenderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Motor Market Club",
  description: "Learn how Motor Market Club collects, uses, and safeguards your vehicle and personal data.",
};

const defaultPrivacyPolicyHtml = `
<h2>1. Introduction & Overview</h2>
<p>At Motor Market Club ("MMC", "we", "our", or "us"), we are dedicated to safeguarding the privacy and security of your personal information. This Privacy Policy explains how we collect, store, process, and protect your information when you access our platform, use our mobile application, or book automotive services through our network of certified providers across the UK.</p>

<h2>2. Information We Collect</h2>
<p>To provide high-quality, verified automotive care, we collect the following categories of information:</p>
<ul>
  <li><strong>Personal Identification Data:</strong> Full name, email address, contact phone number, and physical billing/service address.</li>
  <li><strong>Vehicle Information:</strong> Registration number (VRN), vehicle make, model, year, trim, mileage, and specific modification or repair history.</li>
  <li><strong>Booking & Location Details:</strong> Scheduled appointment times, delivery addresses, breakdown or emergency dispatch coordinates, and custom service requests.</li>
  <li><strong>Payment Data:</strong> Transaction references, partial deposit logs, and payment method tokens (handled securely through encrypted, PCI-DSS compliant payment gateways).</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We process your data strictly to facilitate your automotive care experience, including:</p>
<ul>
  <li>Connecting your service requests with vetted, certified workshops, mobile technicians, and chauffeur specialists.</li>
  <li>Generating accurate automated estimates and instant competitive bids from local providers.</li>
  <li>Sending real-time booking updates, invoice summaries, and digital dispatch notifications via SMS or email.</li>
  <li>Ensuring fraud prevention, account security, and compliance with applicable UK regulatory obligations.</li>
</ul>

<h2>4. Data Sharing & Third-Party Disclosure</h2>
<p>We do not sell, rent, or lease your personal data. We share necessary details solely with:</p>
<ul>
  <li><strong>Authorized Service Providers:</strong> Only the specific vehicle and contact details required to fulfill your confirmed booking or estimate request.</li>
  <li><strong>Payment Processors:</strong> Encrypted token exchanges to securely process payments and refund transactions.</li>
  <li><strong>Legal & Regulatory Authorities:</strong> When required by law or in response to valid legal requests under English law.</li>
</ul>

<h2>5. Security & Data Retention</h2>
<p>We implement bank-grade SSL/TLS encryption, restricted access protocols, and regular vulnerability audits to ensure your data remains safe. Personal information is retained only as long as necessary to manage your active account, fulfill bookings, or comply with statutory accounting requirements.</p>

<h2>6. Your Legal Rights</h2>
<p>Under the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018, you have the right to request access to your personal data, request correction of inaccurate details, request erasure ("right to be forgotten"), or restrict data processing. To exercise any of these rights, please contact our Data Protection Team at <a href="mailto:support@motormatesclub.co.uk">support@motormatesclub.co.uk</a>.</p>
`;

export default function PrivacyPolicyPage() {
  return (
    <CmsPageRenderer
      pageKey="privacy-policy"
      fallbackTitle="Privacy Policy"
      badgeLabel="Data Protection & Privacy"
      defaultHtmlContent={defaultPrivacyPolicyHtml}
      showTrustSection={true}
    />
  );
}
