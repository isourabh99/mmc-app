"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CarItem,
  getCarDetails,
  getCarList,
} from "@/lib/service/car.api";
import { CarDetailsView } from "@/components/car-hire/CarDetailsView";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.id as string;

  const [car, setCar] = useState<CarItem | null>(null);
  const [relatedCars, setRelatedCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!carId) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        setError("");

        const details = await getCarDetails(carId);

        if (details) {
          setCar(details);

          // Fetch related cars in same category if category_id exists
          if (details.category_id) {
            try {
              const list = await getCarList(details.category_id);
              // Filter out the current car
              setRelatedCars(list.filter((c) => String(c.id) !== String(details.id)));
            } catch {
              setRelatedCars([]);
            }
          }
        } else {
          setError("The requested vehicle could not be found or has been removed.");
        }
      } catch (err) {
        console.error("Failed to load car details:", err);
        setError("Failed to load vehicle details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={36} className="text-[#FAD293] animate-spin" />
        <p className="text-xs text-white/50 tracking-wider uppercase">
          Loading Vehicle Details...
        </p>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white">Vehicle Not Found</h2>
          <p className="text-xs text-white/60">
            {error || "The vehicle you are looking for is currently unavailable."}
          </p>
        </div>
        <Link
          href="/car-hire"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-black text-xs transition hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
          }}
        >
          <ArrowLeft size={14} />
          <span>Browse All Vehicles</span>
        </Link>
      </div>
    );
  }

  return <CarDetailsView car={car} relatedCars={relatedCars} />;
}
