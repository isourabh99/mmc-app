import ChauffeurDetailClient from "./ChauffeurDetailClient";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default function ChauffeurDetailPage() {
  return <ChauffeurDetailClient />;
}
