import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import EmergencyCTA from "@/components/EmergencyCTA";
import MatchingSection from "@/components/MatchingSection";
import QuoteSection from "@/components/QuoteSection";
import TrustSection from "@/components/TrustSection";
import ProviderCTA from "@/components/ProviderCTA";
import FAQSection from "@/components/FAQSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <EmergencyCTA />
      <HowItWorksSection />
      <MatchingSection />
      <QuoteSection />
      <TrustSection />
      <ProviderCTA />
      <FAQSection />
    </>
  );
}
