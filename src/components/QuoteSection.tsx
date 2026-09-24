"use client";

export default function QuoteSection() {
  return (
    <section
      id="get-quote"
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050400, #000)" }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(250,210,147,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250,210,147,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, #FAD293, transparent)" }} />
              <span
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Instant Quotes
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Get Competitive Quotes{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                in Minutes
              </span>
            </h2>
            <p className="text-white/55 text-lg mb-8 leading-relaxed">
              Stop overpaying for automotive services. MMC&apos;s quote system brings multiple certified providers competing for your business — giving you the best price every time.
            </p>

            {/* Process pills */}
            <div className="flex flex-col gap-4">
              {[
                { step: "01", label: "Submit your service request for free" },
                { step: "02", label: "Receive quotes from verified providers" },
                { step: "03", label: "Choose your preferred provider & book" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                    style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                  >
                    {item.step}
                  </div>
                  <span className="text-white/65 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quote form card */}
          <div
            className="rounded-3xl p-8 backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(250,210,147,0.15)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            <h3 className="text-xl font-bold mb-6">
              Request a{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Free Quote
              </span>
            </h3>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">First Name</label>
                  <input
                    id="quote-first-name"
                    type="text"
                    placeholder="John"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Last Name</label>
                  <input
                    id="quote-last-name"
                    type="text"
                    placeholder="Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Service Type</label>
                <select
                  id="quote-service-type"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 outline-none focus:border-[#FAD293]/40 transition-colors duration-200 appearance-none"
                >
                  <option value="" className="bg-black">Select a service</option>
                  <option value="smart-repair" className="bg-black">Smart Repair</option>
                  <option value="denting-painting" className="bg-black">Denting & Painting</option>
                  <option value="modifications" className="bg-black">Modifications</option>
                  <option value="tyres" className="bg-black">Tyres</option>
                  <option value="car-wash" className="bg-black">Car Wash</option>
                  <option value="chauffeur" className="bg-black">Chauffeur</option>
                  <option value="car-rental" className="bg-black">Car Rental</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Vehicle (Make & Model)</label>
                <input
                  id="quote-vehicle"
                  type="text"
                  placeholder="e.g. BMW 3 Series 2021"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Postcode</label>
                <input
                  id="quote-postcode"
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Describe Your Needs</label>
                <textarea
                  id="quote-description"
                  rows={3}
                  placeholder="Tell us what you need done..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200 resize-none"
                />
              </div>

              <button
                id="quote-submit-btn"
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,210,147,0.35)] hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
              >
                Get My Free Quotes →
              </button>

              <p className="text-center text-xs text-white/30">
                Free & no obligation • Results in under 60 seconds
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
