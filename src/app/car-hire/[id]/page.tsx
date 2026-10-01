import CarDetailClient from "./CarDetailClient";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default function CarDetailPage() {
  return <CarDetailClient />;
}
