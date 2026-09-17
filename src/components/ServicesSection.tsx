"use client";

const services = [
  {
    id: "smart-repair",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    label: "Smart Repair",
    desc: "Paintless dent removal, scratch repairs, and minor cosmetic fixes without full resprays.",
    tag: "Most Popular",
  },
  {
    id: "denting-painting",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: "Denting & Painting",
    desc: "Full body resprays, panel beating, and professional colour-matching for any vehicle.",
    tag: null,
  },
  {
    id: "modifications",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    label: "Modifications",
    desc: "Performance tuning, body kits, exhaust systems, and interior customisations.",
    tag: null,
  },
  {
    id: "tyres",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
    label: "Tyres",
    desc: "Supply & fitting, balancing, wheel alignment and seasonal tyre changes.",
    tag: null,
  },
  {
    id: "car-wash",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    label: "Car Wash",
    desc: "Hand wash, machine wash, full valet, detailing, and ceramic coating packages.",
    tag: null,
  },
  {
    id: "chauffeur",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: "Chauffeur",
    desc: "Executive airport transfers, corporate travel, weddings, and special events.",
    tag: "Premium",
  },
  {
    id: "car-rental",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    label: "Car Rental",
    desc: "Daily, weekly and long-term vehicle hire from economy to luxury supercars.",
    tag: null,
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-6 bg-black relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
      />

      <div className="max-w-8xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
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
              Our Services
            </span>
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, #CEA46B, transparent)" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Every Automotive Service,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              One Platform
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From a quick scratch repair to a complete vehicle transformation — browse our curated service categories and get matched with the best providers near you.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {services.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              id={`service-card-${service.id}`}
              className="group relative p-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm transition-all duration-400 hover:border-[#FAD293]/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(206,164,107,0.1)] cursor-pointer"
            >
              {/* Tag */}
              {service.tag && (
                <span
                  className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-black"
                  style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                >
                  {service.tag}
                </span>
              )}

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(250,210,147,0.2)]"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.1), rgba(206,164,107,0.05))",
                  border: "1px solid rgba(250,210,147,0.2)",
                  color: "#FAD293",
                }}
              >
                {service.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-[#FAD293] transition-colors duration-300">
                {service.label}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">{service.desc}</p>

              {/* Arrow */}
              <div className="flex items-center gap-1 mt-4 text-xs font-medium text-[#FAD293] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                Explore
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Bottom border accent */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: "linear-gradient(90deg, transparent, #FAD293, transparent)" }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
