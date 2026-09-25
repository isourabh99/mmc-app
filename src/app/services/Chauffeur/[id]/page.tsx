"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Chauffeur, searchChauffeurs } from "@/lib/service/chauffeur.api";
import { getCarDetails } from "@/lib/service/car.api";
import { ChauffeurDetailsView } from "@/components/chauffeur/ChauffeurDetailsView";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ChauffeurDetailPage() {
  const params = useParams();
  const chauffeurId = params?.id as string;

  const [chauffeur, setChauffeur] = useState<Chauffeur | null>(null);
  const [relatedChauffeurs, setRelatedChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chauffeurId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch single chauffeur / car details
        const details = await getCarDetails(chauffeurId);

        if (details) {
          setChauffeur(details as unknown as Chauffeur);

          // 2. Fetch related chauffeurs if car_type_id exists
          if (details.car_type_id) {
            try {
              const todayStr = new Date().toISOString().split("T")[0];
              const result = await searchChauffeurs({
                car_type_id: details.car_type_id,
                date: todayStr,
                limit: 4,
                offset: 0,
              });

              if (result && result.data) {
                setRelatedChauffeurs(
                  result.data.filter((c) => String(c.id) !== String(details.id))
                );
              }
            } catch {
              setRelatedChauffeurs([]);
            }
          }
        } else {
          setError("The requested chauffeur record could not be found or is unavailable.");
        }
      } catch (err) {
        console.error("Failed to load chauffeur details:", err);
        setError("Failed to load chauffeur details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [chauffeurId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-[#090706] text-white">
        <Loader2 size={36} className="text-[#FAD293] animate-spin" />
        <p className="text-xs text-white/50 tracking-wider uppercase">
          Loading Chauffeur Details...
        </p>
      </div>
    );
  }

  if (error || !chauffeur) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 bg-[#090706] text-white">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white">Chauffeur Not Found</h2>
          <p className="text-xs text-white/60">
            {error || "The chauffeur vehicle you are looking for is currently unavailable."}
          </p>
        </div>
        <Link
          href="/services/Chauffeur"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-black text-xs transition hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
          }}
        >
          <ArrowLeft size={14} />
          <span>Browse All Chauffeurs</span>
        </Link>
      </div>
    );
  }

  return (
    <ChauffeurDetailsView
      chauffeur={chauffeur}
      relatedChauffeurs={relatedChauffeurs}
    />
  );
}
