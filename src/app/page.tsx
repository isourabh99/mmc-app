import HeroSection from "@/components/HeroSection";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import HomePromoBanner from "@/components/HomePromoBanner";
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
      <AppDownloadBanner />
      <HomePromoBanner />
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
