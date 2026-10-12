import ProviderEstimateDetailClient from "./ProviderEstimateDetailClient";

export function generateStaticParams() {
  const tokens = ["[token]", "view", "details", ...Array.from({ length: 50 }, (_, i) => String(i + 1))];
  return tokens.map((token) => ({ token }));
}

export default function ProviderEstimateDetailsPage() {
  return <ProviderEstimateDetailClient />;
}
