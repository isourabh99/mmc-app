"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  Crosshair,
  MapPin,
  Loader2,
  Check,
  Building,
  User,
  Phone,
  Home,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import {
  searchPlaces,
  reverseGeocodeDetailed,
  getCurrentBrowserLocation,
  type LocationSuggestion,
  type DetailedGeocodeResult,
} from "@/lib/service/location.service";
import {
  saveCustomerAddressToBackend,
  formatServiceAddressJson,
  extractPostcode,
  type SelectedLocationData,
} from "@/lib/service/address.helper";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: SelectedLocationData) => void;
  initialAddress?: string;
  initialPostcode?: string;
  initialLat?: number | string;
  initialLon?: number | string;
  initialHouse?: string;
  initialFloor?: string;
  initialStreet?: string;
  initialCity?: string;
  initialContactName?: string;
  initialContactPhone?: string;
}

const GOOGLE_MAPS_KEY = "AIzaSyCzqspc3fl1LtnypCGowb6VmBVzf9zXXn4";

// Safe SVG icon avoiding window.Navigation browser collision
const NavigationIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialAddress,
  initialPostcode,
  initialLat,
  initialLon,
  initialHouse,
  initialFloor,
  initialStreet,
  initialCity,
  initialContactName,
  initialContactPhone,
}) => {
  // Center coordinates (Default: London Trafalgar Square / Westminster)
  const [lat, setLat] = useState<number>(() => {
    const parsed = Number(initialLat);
    return !isNaN(parsed) && parsed !== 0 ? parsed : 51.5074;
  });
  const [lon, setLon] = useState<number>(() => {
    const parsed = Number(initialLon);
    return !isNaN(parsed) && parsed !== 0 ? parsed : -0.1278;
  });

  const [zoom, setZoom] = useState<number>(16);

  // Address details state
  const [fullAddress, setFullAddress] = useState<string>(initialAddress || "London, United Kingdom");
  const [city, setCity] = useState<string>(() => {
    if (initialCity) return initialCity;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_city") || localStorage.getItem("city");
      if (stored) return stored;
    }
    return "London";
  });
  const [street, setStreet] = useState<string>(() => {
    if (initialStreet && initialStreet !== "Baker St") return initialStreet;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_street") || localStorage.getItem("street");
      if (stored && stored !== "Baker St") return stored;
    }
    return "";
  });
  const [postcode, setPostcode] = useState<string>(initialPostcode || "NW1 6XE");
  const [country, setCountry] = useState<string>("United Kingdom");
  const [house, setHouse] = useState<string>(() => (initialHouse && initialHouse !== "221B" ? initialHouse : ""));
  const [floor, setFloor] = useState<string>(() => (initialFloor && initialFloor !== "2nd" ? initialFloor : ""));
  const [contactName, setContactName] = useState<string>(() => {
    if (initialContactName) return initialContactName;
    if (typeof window !== "undefined") {
      try {
        const savedCustom = localStorage.getItem("user_contact_name") || localStorage.getItem("contact_person_name");
        if (savedCustom) return savedCustom;
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || "";
        }
      } catch {}
    }
    return "";
  });
  const [contactPhone, setContactPhone] = useState<string>(() => {
    if (initialContactPhone) return initialContactPhone;
    if (typeof window !== "undefined") {
      try {
        const savedCustomPh = localStorage.getItem("user_contact_phone") || localStorage.getItem("contact_person_number");
        if (savedCustomPh) return savedCustomPh;
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          return u.phone || u.contact_person_number || "";
        }
      } catch {}
    }
    return "";
  });
  const [addressLabel, setAddressLabel] = useState<string>("Home");
  const hasUserEditedContactRef = useRef<boolean>(false);

  // Step in location picker: 'map' (pick location pin) -> 'details' (enter required house/flat & floor)
  const [modalStep, setModalStep] = useState<"map" | "details">("map");
  const [detailsError, setDetailsError] = useState<string>("");

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [mapEngine, setMapEngine] = useState<"google" | "osm">("google");

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const geocodeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      setModalStep("map");
      setDetailsError("");
      if (initialHouse && initialHouse !== "221B") {
        setHouse(initialHouse);
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : "";
        setHouse(stored && stored !== "221B" ? stored : "");
      }
      if (initialFloor && initialFloor !== "2nd") {
        setFloor(initialFloor);
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : "";
        setFloor(stored && stored !== "2nd" ? stored : "");
      }
      if (initialStreet && initialStreet !== "Baker St") {
        setStreet(initialStreet);
      } else {
        const storedS = typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : "";
        setStreet(storedS && storedS !== "Baker St" ? storedS : "");
      }
      if (initialCity) {
        setCity(initialCity);
      } else {
        const storedC = typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : "";
        if (storedC) setCity(storedC);
      }
      if (initialContactName) {
        setContactName(initialContactName);
      } else {
        const storedCN = typeof window !== "undefined" ? localStorage.getItem("user_contact_name") || localStorage.getItem("contact_person_name") : "";
        if (storedCN) setContactName(storedCN);
      }
      if (initialContactPhone) {
        setContactPhone(initialContactPhone);
      } else {
        const storedCP = typeof window !== "undefined" ? localStorage.getItem("user_contact_phone") || localStorage.getItem("contact_person_number") : "";
        if (storedCP) setContactPhone(storedCP);
      }
    }
  }, [isOpen, initialHouse, initialFloor, initialStreet, initialCity, initialContactName, initialContactPhone]);

  // Track last geocoded coordinates to prevent redundant duplicate API calls
  const lastGeocodedCoordsRef = useRef<{ lat: number; lon: number }>({ lat: 0, lon: 0 });

  // Core geocoding function that runs on click, detect, or confirm
  const performGeocode = useCallback(async (targetLat: number, targetLon: number, force = false) => {
    // If coordinates haven't meaningfully changed (< 15 meters) and not forced, skip
    if (
      !force &&
      Math.abs(targetLat - lastGeocodedCoordsRef.current.lat) < 0.00015 &&
      Math.abs(targetLon - lastGeocodedCoordsRef.current.lon) < 0.00015
    ) {
      return;
    }

    lastGeocodedCoordsRef.current = { lat: targetLat, lon: targetLon };
    setIsGeocoding(true);

    try {
      // 1. Client-side Google Maps Geocoder (sub-50ms)
      if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          const gRes: any = await new Promise((resolve) => {
            geocoder.geocode({ location: { lat: targetLat, lng: targetLon } }, (results: any, status: any) => {
              if (status === "OK" && results && results[0]) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            });
          });

          if (gRes) {
            let streetNumber = "";
            let route = "";
            let sublocality = "";
            let cityLocality = "";
            let adminArea2 = "";
            let postalCode = "";
            let countryName = "";

            for (const comp of gRes.address_components || []) {
              const types = comp.types || [];
              if (types.includes("street_number")) {
                streetNumber = comp.long_name;
              }
              if (types.includes("route")) {
                route = comp.long_name;
              }
              if (
                types.includes("sublocality_level_1") ||
                types.includes("sublocality") ||
                types.includes("neighborhood") ||
                types.includes("sublocality_level_2")
              ) {
                if (!sublocality) sublocality = comp.long_name;
              }
              if (
                types.includes("locality") ||
                types.includes("postal_town")
              ) {
                if (!cityLocality) cityLocality = comp.long_name;
              }
              if (types.includes("administrative_area_level_2")) {
                if (!adminArea2) adminArea2 = comp.long_name;
              }
              if (types.includes("postal_code")) {
                postalCode = comp.long_name;
              }
              if (types.includes("country")) {
                countryName = comp.long_name;
              }
            }

            // Real city: strictly prefer locality/postal_town (e.g. "Indore"), then district (e.g. "Indore"), then sublocality
            const resolvedCity = cityLocality || adminArea2 || sublocality || "";

            // Street / Road Name: combine street_number + route, or use sublocality/neighborhood (e.g. "Krishi Nagar")
            const streetParts = [streetNumber, route].filter(Boolean).join(" ");
            let gStreet = "";
            if (streetParts) {
              if (
                sublocality &&
                !streetParts.toLowerCase().includes(sublocality.toLowerCase()) &&
                sublocality.toLowerCase() !== resolvedCity.toLowerCase()
              ) {
                gStreet = `${streetParts}, ${sublocality}`;
              } else {
                gStreet = streetParts;
              }
            } else {
              gStreet = sublocality;
            }

            setFullAddress(gRes.formatted_address || "Detected Location");

            // If street is still empty, extract first valid part (skipping plus codes, country, and city)
            if (!gStreet && gRes.formatted_address) {
              const isPlusCode = (s: string) => /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i.test(s.trim());
              const parts = gRes.formatted_address.split(",").map((p: string) => p.trim()).filter(Boolean);
              const validPart = parts.find(
                (p: string) =>
                  !isPlusCode(p) &&
                  p.toLowerCase() !== countryName.toLowerCase() &&
                  p.toLowerCase() !== resolvedCity.toLowerCase()
              );
              gStreet = validPart || parts[0] || "";
            }

            setStreet(gStreet || "");
            if (resolvedCity) setCity(resolvedCity);
            if (postalCode) setPostcode(postalCode);
            else {
              const extracted = extractPostcode(gRes.formatted_address);
              if (extracted) setPostcode(extracted);
            }
            if (countryName) setCountry(countryName);
            setIsGeocoding(false);
            return;
          }
        } catch (gErr) {
          console.warn("Google Geocoder fallback to OSM:", gErr);
        }
      }

      // 2. Fallback: reverseGeocodeDetailed
      const res: DetailedGeocodeResult = await reverseGeocodeDetailed(targetLat, targetLon);
      if (res) {
        setFullAddress(res.address || "Detected Location");
        if (res.city) setCity(res.city);
        const resolvedFallbackStreet =
          res.street || (res.address ? res.address.split(",")[0]?.trim() : "");
        setStreet(resolvedFallbackStreet || "");
        if (res.zip_code) setPostcode(res.zip_code);
        else {
          const extracted = extractPostcode(res.address);
          if (extracted) setPostcode(extracted);
        }
        if (res.country) setCountry(res.country);
      }
    } catch (err) {
      console.warn("Geocoding failed for coords:", targetLat, targetLon, err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Update coordinates smoothly without blocking the UI
  const handleCoordsChange = useCallback((newLat: number, newLon: number, skipGeocode = false) => {
    setLat(newLat);
    setLon(newLon);

    if (skipGeocode) return;

    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    geocodeDebounceRef.current = setTimeout(() => {
      performGeocode(newLat, newLon);
    }, 900);
  }, [performGeocode]);

  // Coordinate ref to prevent stale closures when maps initialize or live position updates
  const coordsRef = useRef<{ lat: number; lon: number }>({ lat, lon });
  coordsRef.current = { lat, lon };

  // Live Location Fetcher (Browser Geolocation + Center Map)
  const handleDetectLiveLocation = useCallback(async (silent = false) => {
    try {
      setIsLocating(true);
      const loc = await getCurrentBrowserLocation();
      const nLat = loc.latitude;
      const nLon = loc.longitude;
      coordsRef.current = { lat: nLat, lon: nLon };
      setLat(nLat);
      setLon(nLon);

      if (googleMapRef.current) {
        googleMapRef.current.setCenter({ lat: nLat, lng: nLon });
        googleMapRef.current.panTo({ lat: nLat, lng: nLon });
        googleMapRef.current.setZoom(17);
      }

      await performGeocode(nLat, nLon, true);
    } catch (err: any) {
      console.warn("Live location fetch error:", err);
      if (!silent) {
        alert(err.message || "Could not retrieve live location. Please ensure location access is enabled in your browser.");
      }
    } finally {
      setIsLocating(false);
    }
  }, [performGeocode]);

  // Ref to track if modal has already initialized for current open session
  const hasInitializedOpenRef = useRef(false);

  // Sync initial props & auto-fetch user's live position on map open (runs ONCE per open session)
  useEffect(() => {
    if (!isOpen) {
      hasInitializedOpenRef.current = false;
      return;
    }

    if (hasInitializedOpenRef.current) return;
    hasInitializedOpenRef.current = true;

    setModalStep("map");
    setDetailsError("");
    if (initialHouse !== undefined && initialHouse !== "") {
      setHouse(initialHouse);
    } else if (typeof window !== "undefined") {
      const storedH = localStorage.getItem("user_house") || localStorage.getItem("house");
      if (storedH) setHouse(storedH);
    }
    if (initialFloor !== undefined && initialFloor !== "") {
      setFloor(initialFloor);
    } else if (typeof window !== "undefined") {
      const storedF = localStorage.getItem("user_floor") || localStorage.getItem("floor");
      if (storedF) setFloor(storedF);
    }

    const hasSpecificCoords = initialLat && !isNaN(Number(initialLat)) && Number(initialLat) !== 51.5074;
    if (hasSpecificCoords) {
      const pLat = Number(initialLat);
      const pLon = Number(initialLon) || -0.1278;
      coordsRef.current = { lat: pLat, lon: pLon };
      setLat(pLat);
      setLon(pLon);
      if (googleMapRef.current) {
        googleMapRef.current.setCenter({ lat: pLat, lng: pLon });
        googleMapRef.current.panTo({ lat: pLat, lng: pLon });
        googleMapRef.current.setZoom(17);
      }
      if (initialAddress) setFullAddress(initialAddress);
      if (initialPostcode) setPostcode(initialPostcode);
      performGeocode(pLat, pLon, true);
    } else {
      // Auto-fetch real live location ONCE when map is opened!
      handleDetectLiveLocation(true);
    }
  }, [isOpen, performGeocode, handleDetectLiveLocation]);

  // Initialize Map (Google Maps if available, or OSM fallback)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initGoogleMap = () => {
      if (!mapContainerRef.current || !(window as any).google?.maps) return;
      if (googleMapRef.current) {
        // Reuse existing map instance to prevent GPU canvas leaks and heavy lag
        const currentCenter = { lat: coordsRef.current.lat, lng: coordsRef.current.lon };
        googleMapRef.current.panTo(currentCenter);
        return;
      }
      try {
        const currentCenter = { lat: coordsRef.current.lat, lng: coordsRef.current.lon };
        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: currentCenter,
          zoom: 17,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false, // Prevents laggy POI popups and touch blocking
          keyboardShortcuts: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ],
        });

        googleMapRef.current = map;
        setMapEngine("google");

        // Map drag listener: when dragging ends, debounce coordinate updates to avoid lag
        let idleTimer: NodeJS.Timeout | null = null;
        map.addListener("idle", () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            const newCenter = map.getCenter();
            if (newCenter) {
              const newLat = newCenter.lat();
              const newLng = newCenter.lng();
              coordsRef.current = { lat: newLat, lon: newLng };
              handleCoordsChange(newLat, newLng);
            }
          }, 350);
        });

        // Click to place: immediately geocode on user click
        map.addListener("click", (e: any) => {
          if (e.latLng) {
            const cLat = e.latLng.lat();
            const cLng = e.latLng.lng();
            coordsRef.current = { lat: cLat, lon: cLng };
            setLat(cLat);
            setLon(cLng);
            map.panTo({ lat: cLat, lng: cLng });
            performGeocode(cLat, cLng, true);
          }
        });
      } catch (err) {
        console.warn("Google Maps init warning, fallback to OSM:", err);
        setMapEngine("osm");
      }
    };

    if ((window as any).google?.maps) {
      initGoogleMap();
    } else {
      const existingScript = document.getElementById("google-maps-location-picker-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-maps-location-picker-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initGoogleMap();
        };
        script.onerror = () => {
          if (isMounted) setMapEngine("osm");
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", initGoogleMap);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, handleCoordsChange]);

  // Autocomplete search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(text, { latitude: lat, longitude: lon });
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error("Place search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Select place from suggestions
  const handleSelectSuggestion = (item: LocationSuggestion) => {
    setSearchQuery(item.name || item.address);
    setShowSuggestions(false);
    setSuggestions([]);

    const newLat = item.latitude;
    const newLon = item.longitude;
    setLat(newLat);
    setLon(newLon);
    coordsRef.current = { lat: newLat, lon: newLon };

    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: newLat, lng: newLon });
      googleMapRef.current.setZoom(17);
    }

    if (item.address) {
      setFullAddress(item.address);
      if (item.city) setCity(item.city);
      const isPlusCode = (s: string) => /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i.test(s.trim());
      const parts = item.address.split(",").map((p) => p.trim()).filter(Boolean);
      const validPart = parts.find((p) => !isPlusCode(p) && p.toLowerCase() !== item.city?.toLowerCase());
      if (validPart || item.name) setStreet(validPart || item.name);
      lastGeocodedCoordsRef.current = { lat: newLat, lon: newLon };
      performGeocode(newLat, newLon, true);
    } else {
      performGeocode(newLat, newLon, true);
    }
  };

  // Step 1: User confirms the map location and proceeds to enter Flat & Floor details
  const handleProceedToDetails = async () => {
    setDetailsError("");
    const curLat = coordsRef.current.lat;
    const curLon = coordsRef.current.lon;
    if (
      Math.abs(curLat - lastGeocodedCoordsRef.current.lat) > 0.0001 ||
      Math.abs(curLon - lastGeocodedCoordsRef.current.lon) > 0.0001
    ) {
      try {
        await performGeocode(curLat, curLon, true);
      } catch (err) {
        console.warn("Geocode on proceed warning:", err);
      }
    }
    setModalStep("details");
  };

  // Step 2: Validate required House/Flat & Floor, save to backend and complete selection
  const handleSaveAndConfirmLocation = async () => {
    if (!house.trim()) {
      setDetailsError("Flat / House / Building Number is required.");
      return;
    }
    if (!floor.trim()) {
      setDetailsError("Floor / Level / Unit is required.");
      return;
    }
    setDetailsError("");
    setIsConfirming(true);

    try {
      const effectivePostcode = postcode.trim() || extractPostcode(fullAddress);
      const effectiveHouse = house.trim();
      const effectiveFloor = floor.trim();
      const effectiveContactName = contactName.trim() || "Customer";
      const effectiveContactPhone = contactPhone.trim() || "";
      const effectiveCity =
        city.trim() || (typeof window !== "undefined" ? localStorage.getItem("user_city") || "" : "");
      const effectiveStreet =
        street.trim() || (fullAddress ? fullAddress.split(",")[0].trim() : "");
      const cleanAddress = fullAddress.trim();

      // 1. Build stringified JSON for service_address
      const serviceAddressJson = formatServiceAddressJson({
        lat: String(lat),
        lon: String(lon),
        address: cleanAddress,
        city: effectiveCity,
        street: effectiveStreet,
        zip_code: effectivePostcode,
        country: country.trim(),
        contact_person_name: effectiveContactName,
        contact_person_number: effectiveContactPhone,
        address_label: addressLabel,
        house: effectiveHouse,
        floor: effectiveFloor,
      });

      // 2. Persist to backend /customer/address
      const saveRes = await saveCustomerAddressToBackend({
        lat: String(lat),
        lon: String(lon),
        address: cleanAddress,
        city: effectiveCity,
        street: effectiveStreet,
        zip_code: effectivePostcode,
        country: country.trim(),
        address_type: "service",
        contact_person_name: effectiveContactName,
        contact_person_number: effectiveContactPhone,
        address_label: addressLabel,
        house: effectiveHouse,
        floor: effectiveFloor,
      });

      const finalAddressId = saveRes.address_id || "9";
      const labelParts: string[] = [];
      if (effectiveHouse) labelParts.push(effectiveHouse);
      if (effectiveFloor) labelParts.push(effectiveFloor.toLowerCase().includes("floor") ? effectiveFloor : `Floor ${effectiveFloor}`);
      if (effectiveStreet && !cleanAddress.toLowerCase().includes(effectiveStreet.toLowerCase())) {
        labelParts.push(effectiveStreet);
      }
      labelParts.push(cleanAddress);
      const formattedLabel = labelParts.join(", ");

      if (typeof window !== "undefined") {
        localStorage.setItem("service_address", serviceAddressJson);
        localStorage.setItem("service_address_json", serviceAddressJson);
        localStorage.setItem("customer_service_address", serviceAddressJson);
        localStorage.setItem("postcode", effectivePostcode);
        localStorage.setItem("user_postcode", effectivePostcode);
        localStorage.setItem("user_address", formattedLabel);
        localStorage.setItem("user_lat", String(lat));
        localStorage.setItem("user_lon", String(lon));
        localStorage.setItem("user_house", effectiveHouse);
        localStorage.setItem("house", effectiveHouse);
        localStorage.setItem("user_floor", effectiveFloor);
        localStorage.setItem("floor", effectiveFloor);
        localStorage.setItem("user_street", effectiveStreet);
        localStorage.setItem("street", effectiveStreet);
        localStorage.setItem("user_city", effectiveCity);
        localStorage.setItem("city", effectiveCity);
        localStorage.setItem("user_contact_name", effectiveContactName);
        localStorage.setItem("contact_person_name", effectiveContactName);
        localStorage.setItem("user_contact_phone", effectiveContactPhone);
        localStorage.setItem("contact_person_number", effectiveContactPhone);
      }

      // 3. Return full structured location data
      onSelectLocation({
        formattedAddress: formattedLabel,
        address: fullAddress,
        street: effectiveStreet,
        house: effectiveHouse,
        floor: effectiveFloor,
        city: effectiveCity,
        postcode: effectivePostcode,
        country,
        lat: String(lat),
        lon: String(lon),
        contact_person_name: effectiveContactName,
        contact_person_number: effectiveContactPhone,
        address_label: addressLabel,
        service_address_json: serviceAddressJson,
        address_id: finalAddressId,
      });

      setModalStep("map");
      onClose();
    } catch (err: any) {
      console.error("Confirm location error:", err);
      const fallbackPostcode = postcode.trim() || extractPostcode(fullAddress);
      const fbParts: string[] = [];
      if (house.trim()) fbParts.push(house.trim());
      if (floor.trim()) fbParts.push(floor.trim().toLowerCase().includes("floor") ? floor.trim() : `Floor ${floor.trim()}`);
      if (street.trim() && !fullAddress.toLowerCase().includes(street.trim().toLowerCase())) {
        fbParts.push(street.trim());
      }
      fbParts.push(fullAddress);
      const fallbackFormatted = fbParts.join(", ");
      onSelectLocation({
        formattedAddress: fallbackFormatted,
        address: fullAddress,
        street,
        house: house.trim(),
        floor: floor.trim(),
        city,
        postcode: fallbackPostcode,
        country,
        lat: String(lat),
        lon: String(lon),
        contact_person_name: contactName || "Customer",
        contact_person_number: contactPhone || "+447123456789",
        address_label: addressLabel,
        service_address_json: formatServiceAddressJson({
          lat: String(lat),
          lon: String(lon),
          address: fullAddress,
          city,
          street,
          zip_code: fallbackPostcode,
          country,
          contact_person_name: contactName,
          contact_person_number: contactPhone,
          address_label: addressLabel,
          house: house.trim(),
          floor: floor.trim(),
        }),
        address_id: "9",
      });
      setModalStep("map");
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-[#0c0a08] overflow-hidden text-white font-sans animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & SEARCH BAR (Matches media_1792233554157.jpg)   */}
      {/* ============================================================ */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-5 pointer-events-none">
        <div className="max-w-xl mx-auto space-y-2 pointer-events-auto">
          {/* Top Pill Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-black/90 backdrop-blur-xl border border-white/15 rounded-full px-4 py-2.5 shadow-2xl">
              <Search className="w-4 h-4 text-[#FAD293]/80 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search location..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FAD293]" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="p-1 hover:text-white text-white/40 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDetectLiveLocation(false)}
                  title="Detect and center live location"
                  className="p-1 rounded-full hover:bg-white/10 text-[#FAD293] transition cursor-pointer shrink-0"
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FAD293]" />
                  ) : (
                    <NavigationIcon className="w-4 h-4 text-[#FAD293] rotate-45" />
                  )}
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#14100c]/98 border border-[#33271d] rounded-2xl overflow-hidden shadow-2xl z-40 max-h-64 overflow-y-auto">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 flex items-start gap-3 transition"
                  >
                    <MapPin className="w-4 h-4 text-[#FAD293] shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-white/50 truncate">{item.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Row: Back Button (Left) & CONFIRM LOCATION Button (Right) */}
          <div className="flex items-center justify-between pt-1">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/90 border border-white/15 flex items-center justify-center text-white hover:bg-white/10 transition shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Confirm Location Button */}
            <button
              type="button"
              disabled={isConfirming}
              onClick={handleProceedToDetails}
              className="px-6 py-2.5 rounded-full bg-[#d09a50] hover:bg-[#e0aa5e] text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(208,154,80,0.4)] transition hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              <span>CONFIRM LOCATION</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAP VIEW & CENTRAL PIN                                     */}
      {/* ============================================================ */}
      <div className="relative flex-1 w-full h-full bg-[#141210]">
        {/* Google Maps Container or OSM Tile Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* OSM Fallback Map (if Google Maps key not active) */}
        {mapEngine === "osm" && (
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
            {/* Static Leaflet / OpenStreetMap Styled Tile Canvas */}
            <iframe
              title="OpenStreetMap Location"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.008}%2C${lat - 0.005}%2C${lon + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lon}`}
              className="w-full h-full border-0 pointer-events-auto"
            />
          </div>
        )}

        {/* Center Golden Pin (Teardrop Marker matching media_1792233554157.jpg) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center">
          <div className="relative drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]">
            <svg
              width="44"
              height="54"
              viewBox="0 0 44 54"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 0C9.84974 0 0 9.84974 0 22C0 36 22 54 22 54C22 54 44 36 44 22C44 9.84974 34.1503 0 22 0Z"
                fill="#d09a50"
              />
              <circle cx="22" cy="21" r="9" fill="#14100c" />
              <circle cx="22" cy="21" r="5" fill="#f2cb87" />
            </svg>
          </div>
          {/* Ground Contact Pulse Shadow */}
          <div className="w-4 h-1.5 bg-black/60 rounded-full blur-[1px] -mt-1" />
        </div>

        {/* Floating Zoom Controls (Left) */}
        <div className="absolute bottom-28 left-4 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (googleMapRef.current) {
                googleMapRef.current.setZoom(googleMapRef.current.getZoom() + 1);
              } else {
                setZoom((z) => Math.min(19, z + 1));
              }
            }}
            className="w-9 h-9 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/10 shadow-lg cursor-pointer"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (googleMapRef.current) {
                googleMapRef.current.setZoom(googleMapRef.current.getZoom() - 1);
              } else {
                setZoom((z) => Math.max(12, z - 1));
              }
            }}
            className="w-9 h-9 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/10 shadow-lg cursor-pointer"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Floating Live Location Target Button (Bottom Right) */}
        <button
          type="button"
          onClick={() => handleDetectLiveLocation(false)}
          disabled={isLocating}
          title="Fetch My Live Location"
          className="absolute bottom-28 right-4 z-20 w-12 h-12 rounded-2xl bg-black/90 backdrop-blur-md border border-[#d09a50]/40 flex items-center justify-center text-[#d09a50] shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer group"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#d09a50]" />
          ) : (
            <NavigationIcon className="w-5 h-5 text-[#d09a50] group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM CARD: SELECTED ADDRESS & DETAILED INPUTS            */}
      {/* ============================================================ */}
      <div className="relative z-30 bg-[#0c0a08]/98 backdrop-blur-xl border-t border-[#33271d] p-4 sm:p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] max-h-[50vh] overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-3">
          {/* Header row: "Selected Address" & expand drawer button */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <span>Selected Address</span>
              {isGeocoding && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-normal normal-case text-[#f2cb87]">
                  <Loader2 className="w-3 h-3 animate-spin text-[#d09a50]" />
                  <span>Updating...</span>
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              className="text-[11px] font-semibold text-[#f2cb87] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showExtraDetails ? "Hide Details" : "Edit / Add House / Flat"}</span>
              {showExtraDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Main Selected Address Box (Always Editable, Never Blocked by Spinner) */}
          <div className="bg-black/60 border border-white/15 focus-within:border-[#d09a50] rounded-2xl p-3.5 shadow-inner transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#d09a50]/15 border border-[#d09a50]/30 flex items-center justify-center text-[#d09a50] shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Click to edit detected address..."
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-white leading-snug outline-none border-b border-white/10 focus:border-[#d09a50] pb-0.5 transition"
                />
                <p className="text-[11px] text-[#f2cb87] font-semibold mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {street ? <span><span className="text-white/60 font-normal">Street:</span> {street}</span> : null}
                  {street && (postcode || city) ? <span className="text-white/40">•</span> : null}
                  {postcode ? <span><span className="text-white/60 font-normal">Postcode:</span> {postcode}</span> : null}
                  {postcode && city ? <span className="text-white/40">•</span> : null}
                  {city ? <span><span className="text-white/60 font-normal">City:</span> {city}</span> : null}
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Manual Details Drawer (For house/flat, floor, contact person) */}
          {showExtraDetails && (
            <div className="space-y-3 pt-2 border-t border-white/10 animate-in slide-in-from-bottom duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* House / Flat No */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    House / Flat *
                  </label>
                  <input
                    type="text"
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder="e.g. Flat 4B"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. 2nd Floor"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Street / Road */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Street / Road
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. High Street"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Postcode */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Postcode"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none uppercase font-bold text-[#f2cb87]"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Contact Person Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContactName(val);
                      hasUserEditedContactRef.current = true;
                      if (typeof window !== "undefined") {
                        localStorage.setItem("user_contact_name", val);
                        localStorage.setItem("contact_person_name", val);
                      }
                    }}
                    placeholder="Full Name"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContactPhone(val);
                      hasUserEditedContactRef.current = true;
                      if (typeof window !== "undefined") {
                        localStorage.setItem("user_contact_phone", val);
                        localStorage.setItem("contact_person_number", val);
                      }
                    }}
                    placeholder="+44 7123 456789"
                    className="w-full h-9 bg-black/50 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Address Label: Home / Work / Other */}
              <div>
                <label className="block text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-wider">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressLabel(lbl)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        addressLabel === lbl
                          ? "bg-[#d09a50]/20 border-[#d09a50] text-[#f2cb87]"
                          : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button inside bottom card for easy tap on mobile */}
          <button
            type="button"
            disabled={isConfirming}
            onClick={handleProceedToDetails}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#f2cb87] via-[#e0aa5e] to-[#d09a50] hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>CONFIRM LOCATION &amp; ENTER DETAILS</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STEP 2 MODAL OVERLAY: HOUSE & FLOOR REQUIRED FORM            */}
      {/* ============================================================ */}
      {modalStep === "details" && (
        <div className="absolute inset-0 z-50 bg-[#0c0a08]/98 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-lg w-full mx-auto my-auto space-y-4">
            {/* Top Bar with Back to Map & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setModalStep("map")}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#f2cb87] hover:underline cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back to Map</span>
              </button>

              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                Step 2 of 2: Building Details
              </span>

              <button
                type="button"
                onClick={onClose}
                className="text-white/40 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Location Card (Fully Editable Address) */}
            <div className="bg-black/60 border border-[#d09a50]/40 focus-within:border-[#d09a50] focus-within:ring-1 focus-within:ring-[#d09a50]/40 rounded-2xl p-3.5 shadow-xl transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#d09a50]/20 border border-[#d09a50]/40 flex items-center justify-center text-[#d09a50] shrink-0 mt-1">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#f2cb87]">
                      Detected Location / Main Address (Editable)
                    </label>
                    <span className="text-[10px] text-white/50">Edit text if not accurate</span>
                  </div>
                  <input
                    type="text"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Enter or edit full address..."
                    className="w-full bg-[#16120e] border border-white/20 focus:border-[#d09a50] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white outline-none transition"
                  />
                  <p className="text-[11px] text-[#f2cb87] font-semibold mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {street ? <span><span className="text-white/60 font-normal">Street:</span> {street}</span> : null}
                    {street && (postcode || city) ? <span className="text-white/40">•</span> : null}
                    {postcode ? <span><span className="text-white/60 font-normal">Postcode:</span> {postcode || extractPostcode(fullAddress)}</span> : null}
                    {postcode && city ? <span className="text-white/40">•</span> : null}
                    {city ? <span><span className="text-white/60 font-normal">City:</span> {city}</span> : null}
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Error Banner */}
            {detailsError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-in shake duration-200">
                <AlertCircle size={15} className="shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            {/* Required House & Floor Card */}
            <div className="bg-[#14110e] border border-[#d09a50]/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Complete Address Information
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Please enter your flat/house and floor numbers (both required) so the service provider can locate you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* House / Flat No (Required) */}
                <div>
                  <label className="block text-[11px] font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    Flat / House No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={house}
                    onChange={(e) => {
                      setHouse(e.target.value);
                      if (detailsError) setDetailsError("");
                    }}
                    placeholder="e.g. Flat 4B or House 12"
                    className={`w-full h-11 bg-black/60 border rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none font-medium transition ${
                      !house.trim() && detailsError
                        ? "border-red-500 ring-1 ring-red-500/50"
                        : "border-white/20 focus:border-[#d09a50] focus:ring-1 focus:ring-[#d09a50]"
                    }`}
                  />
                  {!house.trim() && detailsError && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">
                      Required field
                    </p>
                  )}
                </div>

                {/* Floor / Level (Required) */}
                <div>
                  <label className="block text-[11px] font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    Floor / Level <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={floor}
                    onChange={(e) => {
                      setFloor(e.target.value);
                      if (detailsError) setDetailsError("");
                    }}
                    placeholder="e.g. Ground Floor, 2nd Floor"
                    className={`w-full h-11 bg-black/60 border rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none font-medium transition ${
                      !floor.trim() && detailsError
                        ? "border-red-500 ring-1 ring-red-500/50"
                        : "border-white/20 focus:border-[#d09a50] focus:ring-1 focus:ring-[#d09a50]"
                    }`}
                  />
                  {!floor.trim() && detailsError && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">
                      Required field
                    </p>
                  )}
                </div>
              </div>

              {/* Street / Road Name */}
              <div>
                <label className="block text-[11px] font-black text-white/90 mb-1.5 uppercase tracking-wider">
                  Street / Road Name
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Baker Street, MG Road, High Street"
                  className="w-full h-11 bg-black/60 border border-white/20 focus:border-[#d09a50] focus:ring-1 focus:ring-[#d09a50] rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none font-medium transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Postcode */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Postcode"
                    className="w-full h-10 bg-black/40 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-[#f2cb87] font-bold uppercase outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full h-10 bg-black/40 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Contact Person Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      hasUserEditedContactRef.current = true;
                    }}
                    placeholder="Full Name"
                    className="w-full h-10 bg-black/40 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      hasUserEditedContactRef.current = true;
                    }}
                    placeholder="+44 7123 456789"
                    className="w-full h-10 bg-black/40 border border-white/15 focus:border-[#d09a50] rounded-xl px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Address Label: Home / Work / Other */}
              <div>
                <label className="block text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-wider">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressLabel(lbl)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        addressLabel === lbl
                          ? "bg-[#d09a50]/20 border-[#d09a50] text-[#f2cb87]"
                          : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={isConfirming}
                onClick={handleSaveAndConfirmLocation}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#f2cb87] via-[#e0aa5e] to-[#d09a50] hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-[0_4px_25px_rgba(208,154,80,0.35)] transition active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>SAVING ADDRESS...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>SAVE &amp; CONFIRM ADDRESS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LocationPickerModal;
