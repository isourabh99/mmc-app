export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  address: string;
  name: string;
}

/**
 * Search places by query text using high-performance place autocompletion
 */
export const searchPlaces = async (
  query: string,
  userCoords?: { latitude: number; longitude: number }
): Promise<LocationSuggestion[]> => {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // Try Photon (OSM search engine optimized for fast type-ahead)
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=6`;
    if (userCoords) {
      url += `&lat=${userCoords.latitude}&lon=${userCoords.longitude}`;
    }

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map((feature: any, index: number) => {
          const props = feature.properties || {};
          const [lon, lat] = feature.geometry?.coordinates || [0, 0];

          const name = props.name || props.street || cleanQuery;
          const addressParts = [
            props.street && props.street !== name ? props.street : null,
            props.district || props.suburb || props.locality,
            props.city || props.town || props.village,
            props.state,
            props.country,
          ].filter(Boolean);

          const address = addressParts.length > 0 ? addressParts.join(", ") : (props.country || "Nearby Location");

          return {
            id: `photon-${props.osm_id || index}-${lat}-${lon}`,
            name,
            address,
            latitude: Number(lat),
            longitude: Number(lon),
            city: props.city || props.town || props.village,
            country: props.country,
          };
        });
      }
    }
  } catch (error) {
    console.warn("Photon search fallback triggered:", error);
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&addressdetails=1&limit=6`;

    const res = await fetch(nominatimUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MMC-Chauffeur-App",
      },
    });

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        return list.map((item: any, index: number) => {
          const addr = item.address || {};
          const name =
            item.name ||
            addr.road ||
            addr.suburb ||
            addr.city ||
            cleanQuery;

          const addressParts = [
            addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.county,
            addr.state,
            addr.country,
          ].filter(Boolean);

          const address =
            addressParts.length > 0
              ? addressParts.join(", ")
              : item.display_name?.split(",").slice(1, 4).join(",").trim() || item.display_name;

          return {
            id: `osm-${item.place_id || index}`,
            name,
            address,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            city: addr.city || addr.town,
            country: addr.country,
          };
        });
      }
    }
  } catch (error) {
    console.error("Nominatim search error:", error);
  }

  return [];
};

/**
 * Reverse geocode coordinates to human readable address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{ address: string; name: string }> => {
  // 1. Try BigDataCloud reverse geocode client
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality || data.subLocality,
        data.city || data.district,
        data.principalSubdivision,
        data.countryName,
      ].filter(Boolean);

      const name = data.locality || data.city || "Current Location";
      const address = parts.length > 0 ? parts.join(", ") : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      return { address, name };
    }
  } catch (err) {
    console.warn("BigDataCloud geocode fallback:", err);
  }

  // 2. Fallback to Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MMC-Chauffeur-App" },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name = addr.road || addr.suburb || addr.city || "Current Location";
      const parts = [
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.county,
        addr.state,
        addr.country,
      ].filter(Boolean);
      const address = parts.join(", ") || data.display_name || "Current Location";
      return { address, name };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode fallback:", err);
  }

  return {
    address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    name: "Detected Location",
  };
};

/**
 * Get user's device geolocation and resolve address
 */
export const getCurrentBrowserLocation = (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const { address, name } = await reverseGeocode(lat, lon);
          resolve({
            latitude: lat,
            longitude: lon,
            address,
            name,
          });
        } catch (e) {
          resolve({
            latitude: lat,
            longitude: lon,
            address: `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
            name: "Current Location",
          });
        }
      },
      (err) => {
        let msg = "Unable to retrieve your location.";
        if (err.code === 1) msg = "Location permission was denied.";
        else if (err.code === 2) msg = "Position unavailable. Please search manually.";
        else if (err.code === 3) msg = "Location request timed out.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};
