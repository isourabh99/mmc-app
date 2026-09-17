import TrustSection from "@/components/TrustSection";

export default function AboutPage() {
  return (
    <>
      <div className="py-12 px-6 max-w-8xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-white/60">Built on Trust & Excellence.</p>
      </div>
      <TrustSection />
    </>
  );
}
