import ServiceSlugClient from "./ServiceSlugClient";

export function generateStaticParams() {
  return [
    { slug: "valet-wash" },
    { slug: "tyre-fittings" },
    { slug: "car-hire" },
    { slug: "Chauffeur" },
    { slug: "emergency-assistance" },
    { slug: "modification" },
    { slug: "alloy-wheel" },
    { slug: "mechanical" },
    { slug: "bodywork" },
  ];
}

export default function ServiceCategorySlugPage() {
  return <ServiceSlugClient />;
}
