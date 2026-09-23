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

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        try {
          const googleData = await getAddressFromCoordinates(
            latitude,
            longitude
          );

          const address = googleData.address;

          console.log("Google Address:", address);
          localStorage.setItem("user_address", address);
          localStorage.setItem("user_lat", String(latitude));
          localStorage.setItem("user_lon", String(longitude));

          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (token) {
            const storedUser = localStorage.getItem("user");
            const user = storedUser ? JSON.parse(storedUser) : null;

            const response = await saveCustomerAddress({
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

            if (
              response?.status >= 200 &&
              response?.status < 300
            ) {
              console.log(
                "Address saved successfully:",
                response.status
              );
            }
          }
        } catch (error: any) {
          // Graceful handling without spamming console
          if (error?.response?.status !== 400) {
            console.warn(
              "Location/address sync:",
              error?.response?.status || error?.message
            );
          }
        }
      },
      (error) => {
        console.error(
          "Location permission/error:",
          error
        );
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