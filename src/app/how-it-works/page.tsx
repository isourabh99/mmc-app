import HowItWorksSection from "@/components/HowItWorksSection";

export default function HowItWorksPage() {
  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">How MMC Works</h1>
        <p className="text-white/60">Four simple steps to perfect service.</p>
      </div>
      <HowItWorksSection />
    </>
  );
}
