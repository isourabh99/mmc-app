"use client";

import { useEffect } from "react";
import {
  getAddressFromCoordinates,
  saveCustomerAddress,
} from "@/app/services/api/profile.api";

export default function LocationPermission() {
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const googleData = await getAddressFromCoordinates(
            latitude,
            longitude
          );

          const address = googleData?.address;
          if (address) {
            localStorage.setItem("user_address", address);
            localStorage.setItem("user_lat", String(latitude));
            localStorage.setItem("user_lon", String(longitude));
          }

          const token = localStorage.getItem("token");
          if (token && address) {
            const storedUser = localStorage.getItem("user");
            const user = storedUser ? JSON.parse(storedUser) : null;

            await saveCustomerAddress({
              lat: String(latitude),
              lon: String(longitude),
              address: address,
              address_type: "service",
              contact_person_name: user
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : "",
              contact_person_number: user?.phone || "",
              address_label: "Home",
            });
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
        // Location permission dismissed or timed out
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