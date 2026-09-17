"use client";
import { useState } from "react";

const faqs = [
  {
    id: "faq-1",
    q: "How does MMC match me with service providers?",
    a: "Our intelligent matching algorithm analyses your service requirements, vehicle type, location, and budget to instantly surface the most relevant certified providers near you. You'll receive multiple competitive quotes to compare.",
  },
  {
    id: "faq-2",
    q: "Are all providers on MMC vetted and insured?",
    a: "Yes. Every provider undergoes a rigorous verification process including identity checks, trade certification verification, insurance confirmation, and a quality audit before being approved to list on MMC.",
  },
  {
    id: "faq-3",
    q: "How quickly can I receive a quote?",
    a: "Most customers receive their first quote within 60 seconds of submitting their request. Depending on your location and service type, you may receive multiple quotes within minutes.",
  },
  {
    id: "faq-4",
    q: "What payment methods does MMC accept?",
    a: "We accept all major credit and debit cards, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our encrypted payment gateway.",
  },
  {
    id: "faq-5",
    q: "Can I become a service provider on MMC?",
    a: "Absolutely. If you're an automotive business or independent trader, you can apply to join the MMC provider network. Complete our verification process and start receiving job requests from thousands of customers.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<string | null>("faq-1");

  return (
    <section id="faqs" className="py-24 px-6 bg-black relative overflow-hidden">
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-8 pointer-events-none"
        style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
      />

      <div className="max-w-8xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, #FAD293)" }} />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FAQs
            </span>
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, #CEA46B, transparent)" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Questions
            </span>
          </h2>
          <p className="text-white/50">
            Everything you need to know about MMC. Can&apos;t find your answer?{" "}
            <a href="#contact" className="text-[#FAD293] hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-2xl border overflow-hidden transition-all duration-300"
              style={{
                borderColor:
                  open === faq.id
                    ? "rgba(250,210,147,0.3)"
                    : "rgba(255,255,255,0.08)",
                background:
                  open === faq.id
                    ? "rgba(250,210,147,0.04)"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <button
                id={faq.id}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
              >
                <span
                  className={`text-base font-semibold transition-colors duration-300 ${
                    open === faq.id ? "" : "text-white/80"
                  }`}
                  style={
                    open === faq.id
                      ? {
                          background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }
                      : {}
                  }
                >
                  {faq.q}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                  style={
                    open === faq.id
                      ? { background: "linear-gradient(135deg, #FAD293, #CEA46B)" }
                      : { border: "1px solid rgba(255,255,255,0.15)" }
                  }
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      open === faq.id ? "rotate-45 text-black" : "text-white/50"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ${
                  open === faq.id ? "max-h-48" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-white/50 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#contact"
            id="faq-contact-link"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#FAD293] transition-colors duration-300"
          >
            Still have questions? Get in touch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
