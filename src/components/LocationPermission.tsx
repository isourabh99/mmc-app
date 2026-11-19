"use client";

import { useEffect } from "react";

export default function LocationPermission() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Clean up duplicate zone keys and temporary location items from localStorage
      const junkKeys = [
        "zoneid",
        "zoneId",
        "zone-id",
        "user_lat",
        "user_lon",
        "user_postcode",
        "user_street",
        "user_address",
        "street",
        "city",
        "house",
        "floor",
        "zone_last_fetched",
        "zone_name",
      ];
      junkKeys.forEach((key) => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
        }
      });

      // 2. Ensure only single standardized zone_id exists with correct live zone
      const currentZone = localStorage.getItem("zone_id");
      if (
        !currentZone ||
        currentZone === "undefined" ||
        currentZone === "null" ||
        currentZone === "a1614dbe-4732-11ee-9702-dee6e8d77be4"
      ) {
        localStorage.setItem("zone_id", "c5b64f38-90ac-49f3-858c-d8dae5c0a53f");
      }
    } catch {}
  }, []);

  return null;
}
