import TrustSection from "@/components/TrustSection";

export default function AboutPage() {
  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-white/60">Built on Trust & Excellence.</p>
      </div>
      <TrustSection />
    </>
  );
}
