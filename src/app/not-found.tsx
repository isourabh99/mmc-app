import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-black text-white">
      
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DFAF5B]/5 blur-[120px]" />

        <div className="absolute right-[-100px] top-[20%] h-[300px] w-[300px] rounded-full bg-[#DFAF5B]/5 blur-[100px]" />
      </div>

      {/* Decorative Lines */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20">
        <div className="absolute left-[10%] top-[15%] h-px w-40 bg-gradient-to-r from-transparent via-[#DFAF5B] to-transparent" />

        <div className="absolute right-[8%] bottom-[20%] h-px w-52 bg-gradient-to-r from-transparent via-[#DFAF5B] to-transparent" />

        <div className="absolute left-[15%] bottom-[15%] h-32 w-px bg-gradient-to-b from-transparent via-[#DFAF5B] to-transparent" />
      </div>

      {/* Main Content */}
      <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl text-center">

          {/* Small Label */}
          <div className="mb-7 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[#DFAF5B]" />

            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#DFAF5B]">
              Premium Automotive Marketplace
            </span>

            <span className="h-px w-12 bg-[#DFAF5B]" />
          </div>

          {/* 404 */}
          <div className="relative mb-2">
            <h1 className="select-none text-[100px] font-bold leading-none tracking-[-0.06em] text-white sm:text-[150px] md:text-[190px]">
              404
            </h1>

            {/* Gold highlight */}
            <div className="absolute left-1/2 top-1/2 h-20 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DFAF5B]/10 blur-[70px]" />
          </div>

          {/* Heading */}
          <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            App Under Maintenance
          </h2>

          {/* Gold line */}
          <div className="mx-auto mt-5 h-[2px] w-16 bg-[#DFAF5B]" />

          {/* Description */}
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
            We’re currently working on our APIs and business logic to make
            your experience faster, more reliable, and better.
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
            Our team is working behind the scenes. We’ll be back online soon.
          </p>

          {/* Status Card */}
          <div className="mx-auto mt-9 flex w-full max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left backdrop-blur-sm">

            {/* Status Indicator */}
            <div className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DFAF5B] opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#DFAF5B]" />
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                System maintenance in progress
              </p>

              <p className="mt-1 text-xs text-gray-500">
                APIs & business logic are being updated
              </p>
            </div>
          </div>

          {/* Button */}
          <div className="mt-9">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-lg bg-[#E8BC6B] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#F2CC82] hover:shadow-[0_0_30px_rgba(232,188,107,0.15)]"
            >
              Back to Home

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14m-6-6 6 6-6 6"
                />
              </svg>
            </Link>
          </div>

          {/* Bottom Message */}
          <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-gray-600">
            Thank you for your patience
          </p>

        </div>
      </section>
    </main>
  );
}