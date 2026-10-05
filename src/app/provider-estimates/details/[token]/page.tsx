import ProviderEstimateDetailClient from "./ProviderEstimateDetailClient";

export function generateStaticParams() {
  const tokens = [
    "[token]",
    "view",
    "EST-10001",
    "27e34a790685ae2a9d791265199b8f059983b739ea299a84",
    "cfd49c1bb9ff06fb723ea9d79ec854aba76880571237ca8c",
    "e0b55bed-3460-40c9-ac3f-7c0437894eed",
    ...Array.from({ length: 50 }, (_, i) => String(i + 1)),
  ];
  return tokens.map((token) => ({ token }));
}

export default function ProviderEstimateDetailsPage() {
  return <ProviderEstimateDetailClient />;
}
