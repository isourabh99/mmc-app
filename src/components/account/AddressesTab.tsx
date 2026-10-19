"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Loader2, Check, Sparkles, Navigation } from "lucide-react";
import { saveCustomerAddress } from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";
import { LocationPickerModal } from "@/components/common/LocationPickerModal";
import type { SelectedLocationData } from "@/lib/service/address.helper";

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

  const [address, setAddress] = useState({
    lat: user?.lat || "",
    lon: user?.lon || "",
    address: user?.address || "",
    city: user?.city || "",
    street: user?.street || "",
    zip_code: user?.zip_code || "",
    country: user?.country || "",
    address_type: user?.address_type || "service",
    contact_person_name:
      user?.contact_person_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    contact_person_number: user?.contact_person_number || user?.phone || "",
    address_label: user?.address_label || "Home",
    house: user?.house || "",
    floor: user?.floor || "",
  });

  useEffect(() => {
    if (user) {
      setAddress({
        lat: user.lat || "",
        lon: user.lon || "",
        address: user.address || "",
        city: user.city || "",
        street: user.street || "",
        zip_code: user.zip_code || "",
        country: user.country || "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectMapLocation = (data: SelectedLocationData) => {
    setAddress((prev) => ({
      ...prev,
      lat: data.lat,
      lon: data.lon,
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
      localStorage.setItem("user_lat", data.lat);
      localStorage.setItem("user_lon", data.lon);
      localStorage.setItem("service_address", data.service_address_json);
      localStorage.setItem("service_address_id", data.address_id);
    }
    showToast("Location updated from Map!", "info");
  };

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#33271d] bg-[#14100c] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h3 className="font-semibold text-sm text-white">Saved Address</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Your default location & contact person for vehicle pickup and mobile services
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#d09a50]/20 hover:bg-[#d09a50]/30 border border-[#d09a50]/40 text-[#f2cb87] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <MapPin size={13} />
            <span>Pick on Map</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Full Address */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Full Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={address.address}
                  onChange={handleChange}
                  placeholder="221B Baker Street, London"
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

            {/* Latitude */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="text"
                name="lat"
                value={address.lat}
                onChange={handleChange}
                placeholder="51.5074"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="text"
                name="lon"
                value={address.lon}
                onChange={handleChange}
                placeholder="-0.1278"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-white/40">
              * Any fields not detected by the map can be entered manually above.
            </p>
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

      {/* Interactive Map Location Picker Modal */}
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
