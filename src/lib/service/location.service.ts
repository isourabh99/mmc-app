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

export interface DetailedGeocodeResult {
  address: string;
  name: string;
  street: string;
  house: string;
  city: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Reverse geocode coordinates to human readable address with breakdown
 */
export const reverseGeocodeDetailed = async (
  latitude: number,
  longitude: number
): Promise<DetailedGeocodeResult> => {
  // 1. Try Nominatim for granular address breakdown
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MMC-App-LocationService" },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const roadName = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || "";
      const suburbName = addr.suburb || addr.neighbourhood || addr.residential || "";
      const house = addr.house_number || addr.housenumber || "";
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "London";

      let street = roadName;
      if (!street) {
        street = suburbName;
      } else if (
        suburbName &&
        !street.toLowerCase().includes(suburbName.toLowerCase()) &&
        suburbName.toLowerCase() !== city.toLowerCase()
      ) {
        street = `${street}, ${suburbName}`;
      }

      const zip_code = addr.postcode || "";
      const country = addr.country || "";
      const name = roadName || suburbName || addr.city || "Current Location";

      const addressParts = [
        house ? `${house} ${street}`.trim() : street,
        suburbName && !street.includes(suburbName) ? suburbName : null,
        city,
        zip_code,
        country,
      ].filter(Boolean);

      const address = addressParts.length > 0 ? addressParts.join(", ") : (data.display_name || "London, UK");

      return {
        address,
        name,
        street,
        house,
        city,
        zip_code,
        country,
        latitude,
        longitude,
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode detailed fallback:", err);
  }

  // 2. Fallback to BigDataCloud
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || "";
      const localityPart = data.localityInfo?.administrative?.[3]?.name || data.locality || data.subLocality || "";
      const street =
        localityPart && localityPart.toLowerCase() !== city.toLowerCase()
          ? localityPart
          : data.localityInfo?.administrative?.[4]?.name || "";
      const zip_code = data.postcode || "";
      const country = data.countryName || "";
      const name = data.locality || data.city || "Current Location";

      const parts = [
        data.locality || data.subLocality,
        city,
        data.principalSubdivision,
        country,
      ].filter(Boolean);

      return {
        address: parts.join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        name,
        street,
        house: "",
        city,
        zip_code,
        country,
        latitude,
        longitude,
      };
    }
  } catch (err) {
    console.warn("BigDataCloud geocode fallback:", err);
  }

  return {
    address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    name: "Detected Location",
    street: "",
    house: "",
    city: "",
    zip_code: "",
    country: "",
    latitude,
    longitude,
  };
};

/**
 * Reverse geocode coordinates to human readable address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{ address: string; name: string }> => {
  const result = await reverseGeocodeDetailed(latitude, longitude);
  return { address: result.address, name: result.name };
};

/**
 * Approximate location by IP address as fallback when GPS/browser permission fails
 */
export const getIpLocationFallback = async (): Promise<GeolocationResult | null> => {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
        const lat = data.latitude;
        const lon = data.longitude;
        const city = data.city || "";
        const country = data.country_name || "";
        const postal = data.postal || "";
        return {
          latitude: lat,
          longitude: lon,
          address: [city, postal, country].filter(Boolean).join(", ") || `${city}, ${country}`,
          name: city || "Detected Region",
        };
      }
    }
  } catch (err) {
    console.warn("IP location fallback failed:", err);
  }
  return null;
};

/**
 * Get user's device geolocation and resolve address
 */
export const getCurrentBrowserLocation = (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      getIpLocationFallback().then((ipLoc) => {
        if (ipLoc) resolve(ipLoc);
        else reject(new Error("Geolocation is not supported by your browser."));
      });
      return;
    }

    const tryGetPosition = (highAccuracy: boolean) => {
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
        async (err) => {
          if (highAccuracy && (err.code === 3 || err.code === 2)) {
            // Retry with low accuracy (WiFi/Cell positioning is often much faster and more reliable on desktop)
            tryGetPosition(false);
            return;
          }

          // If browser geolocation fails or is denied, attempt IP fallback
          const ipLoc = await getIpLocationFallback();
          if (ipLoc) {
            resolve(ipLoc);
            return;
          }

          let msg = "Unable to retrieve your location.";
          if (err.code === 1) msg = "Location permission was denied. Please allow location access in your browser settings or search manually.";
          else if (err.code === 2) msg = "Position unavailable. Please search your postcode or address manually.";
          else if (err.code === 3) msg = "Location request timed out. Please try again or search manually.";
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 12000,
          maximumAge: 60000,
        }
      );
    };

    tryGetPosition(true);
  });
};

