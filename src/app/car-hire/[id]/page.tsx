import CarDetailClient from "./CarDetailClient";

export function generateStaticParams() {
  const ids = ["[id]", "view", ...Array.from({ length: 100 }, (_, i) => String(i + 1))];
  return ids.map((id) => ({ id }));
}

export default function CarDetailPage() {
  return <CarDetailClient />;
}
