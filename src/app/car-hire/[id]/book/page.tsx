import CarHireBookingClient from "./CarHireBookingClient";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default function CarHireBookingPage() {
  return <CarHireBookingClient />;
}
