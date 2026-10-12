import CmsPageRenderer from "@/components/common/CmsPageRenderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Motor Market Club",
  description: "Official terms, conditions, and customer service agreements for Motor Market Club.",
};

const defaultTermsHtml = `
<h2>1. Agreement to Terms</h2>
<p>By registering, booking, or using the services provided by Motor Market Club ("MMC", "we", "our", or "us"), you agree to be bound by these Terms and Conditions. If you do not accept these terms in full, you must discontinue using our platform and associated automotive services.</p>

<h2>2. Our Platform Role</h2>
<p>Motor Market Club operates as an automotive marketplace and technology platform connecting registered customers with vetted independent garages, detailing centres, tyre specialists, emergency recovery units, and chauffeur service providers. While we carefully verify credentials and workshop standards, individual contracted services are executed directly by the assigned service provider.</p>

<h2>3. Bookings, Estimates & Quotes</h2>
<ul>
  <li><strong>Instant Estimates:</strong> Pricing estimates provided through our smart calculator or provider bidding system are based on customer-provided vehicle details and typical labour times.</li>
  <li><strong>Deposit & Partial Payments:</strong> For selected services (such as Bodywork, Alloy Refurbishment, and Custom Modifications), a deposit (typically 25%) may be required upon booking confirmation to secure the service slot and parts allocation. The remaining balance is payable upon successful service completion.</li>
  <li><strong>Additional Work:</strong> If on-site inspection identifies unforeseen structural, mechanical, or safety defects, the service provider will submit a revised quotation for your explicit approval before commencing extra work.</li>
</ul>

<h2>4. Customer Responsibilities</h2>
<p>Customers must ensure that:</p>
<ul>
  <li>The vehicle registration number (VRN) and vehicle condition are accurately represented.</li>
  <li>The vehicle is made accessible at the agreed time and designated service location (for mobile fitting/valet) or delivered to the selected workshop address promptly.</li>
  <li>Valuables and personal belongings are removed from the vehicle prior to drop-off or mobile technician arrival.</li>
</ul>

<h2>5. Service Provider Standards & Warranty</h2>
<p>All service providers on the Motor Market Club network are required to use OE-matching or manufacturer-approved parts and maintain valid commercial liability insurance. Standard replacement parts and workmanship are backed by our network warranty guidelines.</p>

<h2>6. Limitation of Liability</h2>
<p>Motor Market Club shall not be liable for indirect, incidental, or consequential damages resulting from platform downtime or third-party vehicle wear. Nothing in these terms limits liability for death, personal injury, or statutory consumer rights guaranteed under the Consumer Rights Act 2015.</p>

<h2>7. Governing Law</h2>
<p>These terms and conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the English courts.</p>
`;

export default function TermsAndConditionsPage() {
  return (
    <CmsPageRenderer
      pageKey="terms-and-conditions"
      fallbackTitle="Terms & Conditions"
      badgeLabel="Legal Agreement"
      defaultHtmlContent={defaultTermsHtml}
      showTrustSection={true}
    />
  );
}
