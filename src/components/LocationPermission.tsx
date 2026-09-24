"use client";

import { useEffect } from "react";

import {
  getAddressFromCoordinates,
  saveCustomerAddress,
} from "@/app/services/api/profile.api";

export default function LocationPermission() {
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const googleData = await getAddressFromCoordinates(latitude, longitude);
          const address = googleData.address;

          const storedUser = localStorage.getItem("user");
          const user = storedUser ? JSON.parse(storedUser) : null;
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

          localStorage.setItem("user_lat", String(latitude));
          localStorage.setItem("user_lon", String(longitude));
          localStorage.setItem("user_address", address);

          if (token && user) {
            const response = await saveCustomerAddress({
              lat: String(latitude),
              lon: String(longitude),
              address,
              address_type: "service",
              contact_person_name: user?.first_name || user?.name || "Customer",
              contact_person_number: user?.phone || "",
              address_label: "Home",
            });

            const savedId =
              response?.content?.id ||
              response?.id ||
              response?.content?.data?.id ||
              response?.data?.id ||
              response?.data?.content?.id;

            if (savedId) {
              localStorage.setItem("service_address_id", String(savedId));
            }
          }
        } catch (error: any) {
          if (error?.response?.status !== 400) {
            console.warn(
              "Location/address sync:",
              error?.response?.status || error?.message
            );
          }
        }
      },
      (error) => {
        console.error("Location permission/error:", error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  }, []);

  return null;
}