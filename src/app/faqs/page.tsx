import FAQSection from "@/components/FAQSection";

export default function FAQsPage() {
  return (
    <>
      <div className="py-12 px-6 max-w-8xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">FAQs</h1>
        <p className="text-white/60">Got questions? We have answers.</p>
      </div>
      <FAQSection />
    </>
  );
}
