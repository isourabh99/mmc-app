"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Loader2,
  Check,
  Sparkles,
  Navigation,
  Crosshair,
  Search,
  CheckCircle2,
  Compass,
  X,
} from "lucide-react";
import { saveCustomerAddress } from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";
import { LocationPickerModal } from "@/components/common/LocationPickerModal";
import {
  searchPlaces,
  reverseGeocodeDetailed,
  getCurrentBrowserLocation,
  type LocationSuggestion,
} from "@/lib/service/location.service";
import {
  extractPostcode,
  type SelectedLocationData,
} from "@/lib/service/address.helper";

interface AddressesTabProps {
  user: any;
  onAddressUpdated?: () => void;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
  user,
  onAddressUpdated,
}) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Address Form State
  const [address, setAddress] = useState({
    lat: user?.lat || "",
    lon: user?.lon || "",
    address: user?.address || "",
    city: user?.city || "",
    street: user?.street || "",
    zip_code: user?.zip_code || "",
    country: user?.country || "United Kingdom",
    address_type: user?.address_type || "service",
    contact_person_name:
      user?.contact_person_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    contact_person_number: user?.contact_person_number || user?.phone || "",
    address_label: user?.address_label || "Home",
    house: user?.house || "",
    floor: user?.floor || "",
  });

  // Places Autocomplete State
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setAddress({
        lat: user.lat || "",
        lon: user.lon || "",
        address: user.address || "",
        city: user.city || "",
        street: user.street || "",
        zip_code: user.zip_code || "",
        country: user.country || "United Kingdom",
        address_type: user.address_type || "service",
        contact_person_name:
          user.contact_person_name ||
          `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        contact_person_number: user.contact_person_number || user.phone || "",
        address_label: user.address_label || "Home",
        house: user.house || "",
        floor: user.floor || "",
      });
    }
  }, [user]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Full Address Input typing with debounced places search
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress((prev) => ({ ...prev, address: val }));

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const userCoords =
          address.lat && address.lon
            ? {
                latitude: Number(address.lat),
                longitude: Number(address.lon),
              }
            : undefined;
        const results = await searchPlaces(val, userCoords);
        setSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
      } catch (err) {
        console.error("Place search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Select place suggestion -> Auto-fill lat, lon, city, street, postcode
  const handleSelectSuggestion = async (s: LocationSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);

    const newLat = String(s.latitude);
    const newLon = String(s.longitude);

    setAddress((prev) => ({
      ...prev,
      lat: newLat,
      lon: newLon,
      address: s.address ? `${s.name}, ${s.address}` : s.name,
      city: s.city || prev.city,
      country: s.country || prev.country || "United Kingdom",
    }));

    showToast("Coordinates (Lat/Lon) auto-filled from map!", "success");

    // Fetch detailed reverse geocode for street, house number, postcode
    try {
      const details = await reverseGeocodeDetailed(s.latitude, s.longitude);
      if (details) {
        setAddress((prev) => ({
          ...prev,
          lat: newLat,
          lon: newLon,
          address: details.formattedAddress || prev.address,
          street: details.street || prev.street,
          city: details.city || prev.city,
          zip_code: details.postcode || prev.zip_code,
          country: details.country || prev.country,
          house: details.houseNumber || prev.house,
        }));
      }
    } catch (err) {
      console.warn("Detailed reverse geocode fallback:", err);
    }
  };

  // Auto-Detect Current GPS Location
  const handleDetectCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const coords = await getCurrentBrowserLocation();
      const newLat = String(coords.latitude);
      const newLon = String(coords.longitude);

      setAddress((prev) => ({
        ...prev,
        lat: newLat,
        lon: newLon,
      }));

      const details = await reverseGeocodeDetailed(coords.latitude, coords.longitude);
      if (details) {
        setAddress((prev) => ({
          ...prev,
          lat: newLat,
          lon: newLon,
          address: details.formattedAddress || prev.address,
          city: details.city || prev.city,
          street: details.street || prev.street,
          zip_code: details.postcode || prev.zip_code,
          country: details.country || prev.country,
          house: details.houseNumber || prev.house,
        }));
      }
      showToast("Current GPS location & coordinates auto-filled!", "success");
    } catch (err: any) {
      showToast(err.message || "Could not retrieve GPS location", "error");
    } finally {
      setIsLocating(false);
    }
  };

  // Location Selected from Map Modal
  const handleSelectMapLocation = (data: SelectedLocationData) => {
    setShowLocationModal(false); // Closes modal
    setAddress((prev) => ({
      ...prev,
      lat: String(data.lat),
      lon: String(data.lon),
      address: data.formattedAddress,
      city: data.city || prev.city,
      street: data.street || prev.street,
      zip_code: data.postcode || prev.zip_code,
      country: data.country || prev.country,
      house: data.house || prev.house,
      floor: data.floor || prev.floor,
      contact_person_name: data.contact_person_name || prev.contact_person_name,
      contact_person_number: data.contact_person_number || prev.contact_person_number,
      address_label: data.address_label || prev.address_label,
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem("user_address", data.formattedAddress);
      localStorage.setItem("user_postcode", data.postcode);
      localStorage.setItem("user_lat", String(data.lat));
      localStorage.setItem("user_lon", String(data.lon));
      localStorage.setItem("service_address", data.service_address_json);
      localStorage.setItem("service_address_id", data.address_id);
    }
    showToast("Map location & coordinates auto-filled!", "success");
  };

  // Save Address Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await saveCustomerAddress(address);
      if (
        response?.response_code &&
        response?.response_code !== "default_200" &&
        response?.response_code !== "default_update_200"
      ) {
        showToast(response?.message || "Failed to save address", "error");
        return;
      }
      showToast(response?.message || "Address saved successfully!", "success");
      if (onAddressUpdated) onAddressUpdated();
    } catch (err: any) {
      console.error("Address Error:", err);
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save address.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const hasValidCoords = Boolean(
    address.lat &&
      address.lon &&
      !isNaN(Number(address.lat)) &&
      !isNaN(Number(address.lon))
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#33271d] bg-[#14100c] overflow-hidden shadow-xl">
        {/* Card Header with Map & GPS Quick-Actions */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
          <div>
            <h3 className="font-semibold text-sm text-white">Saved Address</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Your default location &amp; contact person for vehicle pickup and mobile services
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Detect GPS Button */}
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 size={13} className="animate-spin text-[#FAD293]" />
              ) : (
                <Compass size={13} className="text-[#FAD293]" />
              )}
              <span>{isLocating ? "Locating..." : "Auto-Detect GPS"}</span>
            </button>

            {/* Pick on Map Button */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#d09a50]/20 hover:bg-[#d09a50]/30 border border-[#d09a50]/40 text-[#f2cb87] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <MapPin size={13} />
              <span>Pick on Map</span>
            </button>
          </div>
        </div>

        {/* Address Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Full Address with Live Place Autocomplete */}
            <div className="md:col-span-3 relative" ref={addressContainerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                  Full Address
                </label>
                {isSearching && (
                  <span className="text-[10px] text-[#FAD293] flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    <span>Searching places...</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={address.address}
                  onChange={handleAddressInputChange}
                  placeholder="Type address or postcode to auto-fetch lat/lon..."
                  className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] pl-3 pr-20 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                />

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="absolute inset-y-1 right-1.5 px-2.5 rounded-lg bg-[#d09a50]/20 hover:bg-[#d09a50]/30 border border-[#d09a50]/30 text-[#f2cb87] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <MapPin size={11} />
                  <span>Map</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#16120e] border border-[#d09a50]/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <span>Select Address to Auto-fill Coordinates</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSuggestion(item)}
                      className="px-3.5 py-2.5 hover:bg-[#E8AF66]/15 cursor-pointer border-b border-white/5 last:border-b-0 transition flex items-start gap-2.5"
                    >
                      <MapPin size={14} className="text-[#E8AF66] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {item.address}
                        </p>
                        <span className="text-[9px] text-[#E8AF66] font-mono">
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Postcode / Zip */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Postcode / Zip
              </label>
              <input
                type="text"
                name="zip_code"
                value={address.zip_code}
                onChange={handleChange}
                placeholder="NW1 6XE"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20 uppercase"
              />
            </div>

            {/* House / Flat */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                House / Flat / Unit
              </label>
              <input
                type="text"
                name="house"
                value={address.house}
                onChange={handleChange}
                placeholder="221B"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Floor */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Floor
              </label>
              <input
                type="text"
                name="floor"
                value={address.floor}
                onChange={handleChange}
                placeholder="2nd Floor"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Street */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Street
              </label>
              <input
                type="text"
                name="street"
                value={address.street}
                onChange={handleChange}
                placeholder="Baker St"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                City
              </label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleChange}
                placeholder="London"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={address.country}
                onChange={handleChange}
                placeholder="United Kingdom"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Address Label */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Label
              </label>
              <select
                name="address_label"
                value={address.address_label}
                onChange={handleChange}
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition"
              >
                <option value="Home" className="bg-[#14100c] text-white">
                  Home
                </option>
                <option value="Work" className="bg-[#14100c] text-white">
                  Work
                </option>
                <option value="Other" className="bg-[#14100c] text-white">
                  Other
                </option>
              </select>
            </div>

            {/* Address Type */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <select
                name="address_type"
                value={address.address_type}
                onChange={handleChange}
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition"
              >
                <option value="service" className="bg-[#14100c] text-white">
                  Service
                </option>
                <option value="home" className="bg-[#14100c] text-white">
                  Home
                </option>
                <option value="work" className="bg-[#14100c] text-white">
                  Work
                </option>
              </select>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person_name"
                value={address.contact_person_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_person_number"
                value={address.contact_person_number}
                onChange={handleChange}
                placeholder="+447123456789"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Latitude with Auto-fill Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                  Latitude
                </label>
                {hasValidCoords && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={10} /> GPS Synced
                  </span>
                )}
              </div>
              <input
                type="text"
                name="lat"
                value={address.lat}
                onChange={handleChange}
                placeholder="51.5074"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20 font-mono"
              />
            </div>

            {/* Longitude with Auto-fill Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                  Longitude
                </label>
                {hasValidCoords && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={10} /> GPS Synced
                  </span>
                )}
              </div>
              <input
                type="text"
                name="lon"
                value={address.lon}
                onChange={handleChange}
                placeholder="-0.1278"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20 font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            * Coordinates (Latitude &amp; Longitude) auto-fill from map selection, place search, or Auto-Detect GPS.
          </p>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-6 py-2.5 text-xs font-bold text-[#140e0a] shadow-md transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Address...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialAddress={address.address}
        initialPostcode={address.zip_code}
        initialLat={address.lat || "51.5074"}
        initialLon={address.lon || "-0.1278"}
        onSelectLocation={handleSelectMapLocation}
      />
    </div>
  );
};
