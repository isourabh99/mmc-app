import EstimateDetailClient from "./EstimateDetailClient";

export function generateStaticParams() {
  const tokens = ["[token]", "view", "details", ...Array.from({ length: 50 }, (_, i) => String(i + 1))];
  return tokens.map((token) => ({ token }));
}

export default function EstimateDetailPage() {
  return <EstimateDetailClient />;
}
