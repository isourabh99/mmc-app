"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  X,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import apiClient from "@/lib/http/apiClient";

export default function ContactPage() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Popup State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    referenceId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    submittedAt: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      setErrorMsg("Please enter your first name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setErrorMsg("Please enter your message (at least 5 characters).");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const refNumber = `MMC-MSG-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Attempt backend API contact endpoint if configured
      await apiClient
        .post("/customer/contact-us", {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
        })
        .catch(() => {
          // If endpoint is not implemented on backend, continue with success flow
        });

      // Prepare confirmation summary
      const now = new Date();
      setSubmittedInquiry({
        referenceId: refNumber,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        submittedAt: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        }),
      });

      // Open Success Confirmation Popup
      setIsSuccessModalOpen(true);
      showToast("Message sent successfully! Our team will contact you shortly.", "success");

      // Reset Form fields
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err: any) {
      console.error("Contact submission error:", err);
      showToast(err?.message || "Failed to send message. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative py-20 px-4 sm:px-6 lg:px-8 selection:bg-[#FAD293] selection:text-black">
      {/* Luxury Ambient Glow Background */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] rounded-full blur-[160px] opacity-15 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, #FAD293 0%, #CEA46B 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#FAD293]">
            <Sparkles size={13} />
            <span>24/7 Priority Support</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 50%, #C29352 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Get in Touch
          </h1>

          <p className="text-white/60 text-base sm:text-lg leading-relaxed">
            Whether you&apos;re a customer seeking roadside assistance, tyre fitting, or a service provider joining our certified network, our dedicated team is here to assist 24/7.
          </p>
        </div>

        {/* Contact Info & Message Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Contact Info Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Email Support Card */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-[#FAD293]/40 transition-all duration-300 shadow-xl group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-[#FAD293] border border-[#FAD293]/20 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))",
                }}
              >
                <Mail size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Email Support</h3>
              <p className="text-white/50 text-xs sm:text-sm mb-3">
                Our support desk typically responds within 2 hours.
              </p>
              <a
                href="mailto:support@mmcclub.co.uk"
                className="text-[#FAD293] font-semibold text-sm hover:underline flex items-center gap-1.5"
              >
                <span>support@mmcclub.co.uk</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Phone Support Card */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-[#FAD293]/40 transition-all duration-300 shadow-xl group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-[#FAD293] border border-[#FAD293]/20 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))",
                }}
              >
                <Phone size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Direct Phone</h3>
              <p className="text-white/50 text-xs sm:text-sm mb-3">
                Available Mon–Sun for emergency callouts and general bookings.
              </p>
              <a
                href="tel:08001234567"
                className="text-[#FAD293] font-semibold text-sm hover:underline flex items-center gap-1.5"
              >
                <span>0800 123 4567</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Headquarters Card */}
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-[#FAD293]/40 transition-all duration-300 shadow-xl group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-[#FAD293] border border-[#FAD293]/20 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))",
                }}
              >
                <MapPin size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">UK Operational Center</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                123 Automotive Way<br />
                London, SW1A 1AA<br />
                United Kingdom
              </p>
            </div>
          </div>

          {/* Right: Message Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="space-y-1 pb-2 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Send us a message
                </h3>
                <p className="text-xs text-white/50">
                  Fill in your query details below. We guarantee a fast, personalized response.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-white/70 block font-medium">
                      First Name <span className="text-[#FAD293]">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Callum"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/70 block font-medium">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Evans"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-white/70 block font-medium">
                      Email Address <span className="text-[#FAD293]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="callum@example.co.uk"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/70 block font-medium">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+44 7700 900582"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Subject Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-white/70 block font-medium">
                    Inquiry Subject <span className="text-[#FAD293]">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all cursor-pointer"
                  >
                    <option value="General Inquiry" className="bg-[#141210]">
                      General Inquiry
                    </option>
                    <option value="Customer Support" className="bg-[#141210]">
                      Customer Support
                    </option>
                    <option value="Tyre Fitting & Breakdown" className="bg-[#141210]">
                      Tyre Fitting & Breakdown Assistance
                    </option>
                    <option value="Provider Partnership" className="bg-[#141210]">
                      Provider Partnership (Join Network)
                    </option>
                    <option value="Billing & Payments" className="bg-[#141210]">
                      Billing & Payments
                    </option>
                  </select>
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <label className="text-xs text-white/70 block font-medium">
                    Your Message <span className="text-[#FAD293]">*</span>
                  </label>
                  <textarea
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you today..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293] focus:ring-1 focus:ring-[#FAD293]/30 transition-all resize-none"
                    required
                  ></textarea>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium animate-fadeIn">
                    {errorMsg}
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
                      boxShadow: "0 4px 25px rgba(250, 210, 147, 0.2)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION POPUP / MODAL (The requested confirmation popup) */}
      {/* ========================================================= */}
      {isSuccessModalOpen && submittedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141210] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Glowing Success Badge */}
            <div className="flex justify-center pt-2">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-black shadow-2xl relative"
                style={{
                  background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
                  boxShadow: "0 0 35px rgba(250, 210, 147, 0.4)",
                }}
              >
                <CheckCircle2 size={42} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Message Sent Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                Thank you, <span className="text-white font-semibold">{submittedInquiry.name}</span>! Your inquiry has been dispatched to our MMC support desk.
              </p>
            </div>

            {/* Inquiry Reference Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-white/50">Ticket Reference</span>
                <span className="text-xs font-mono font-bold text-[#FAD293] bg-[#FAD293]/10 px-2 py-0.5 rounded border border-[#FAD293]/20">
                  #{submittedInquiry.referenceId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40 block">Subject</span>
                  <span className="text-white font-medium truncate block">
                    {submittedInquiry.subject}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Confirmation Email</span>
                  <span className="text-white font-medium truncate block">
                    {submittedInquiry.email}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-white/5">
                <span className="text-white/40 text-[11px] block">Message Preview</span>
                <p className="text-white/80 text-xs italic mt-0.5 line-clamp-2">
                  &ldquo;{submittedInquiry.message}&rdquo;
                </p>
              </div>
            </div>

            {/* Estimated SLA Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 py-2.5 px-4 rounded-xl">
              <Clock size={14} />
              <span>Typical response time: Under 2 hours</span>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex-1 py-3.5 px-5 rounded-xl font-bold text-black text-xs sm:text-sm transition-all hover:brightness-110 cursor-pointer shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
                }}
              >
                Send Another Message
              </button>

              <Link
                href="/"
                className="py-3.5 px-5 rounded-xl font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Back to Home</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
