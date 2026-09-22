import ServicesSection from "@/components/ServicesSection";
import MatchingSection from "@/components/MatchingSection";

export default function ServicesPage() {
  return (
    <>
      {/* <div className="py-12 px-6 max-w-8xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-white/60">Everything you need, in one place.</p>
      </div> */}
      <ServicesSection />
      <MatchingSection />
    </>
  );
}
