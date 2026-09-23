"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { saveCustomerAddress } from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";

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

  const [address, setAddress] = useState({
    lat: user?.lat || "",
    lon: user?.lon || "",
    address: user?.address || "",
    address_type: user?.address_type || "service",
    contact_person_name:
      user?.contact_person_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    contact_person_number: user?.contact_person_number || user?.phone || "",
    address_label: user?.address_label || "Home",
  });

  useEffect(() => {
    if (user) {
      setAddress({
        lat: user.lat || "",
        lon: user.lon || "",
        address: user.address || "",
        address_type: user.address_type || "service",
        contact_person_name:
          user.contact_person_name ||
          `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        contact_person_number: user.contact_person_number || user.phone || "",
        address_label: user.address_label || "Home",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
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
              Your default location & contact person for vehicle pickup
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293]">
            <MapPin size={16} />
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Full Address
              </label>
              <input
                type="text"
                name="address"
                value={address.address}
                onChange={handleChange}
                placeholder="123, Vijay Nagar, Indore"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

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

            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_person_number"
                value={address.contact_person_number}
                onChange={handleChange}
                placeholder="Phone number"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="text"
                name="lat"
                value={address.lat}
                onChange={handleChange}
                placeholder="e.g. 22.7196"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="text"
                name="lon"
                value={address.lon}
                onChange={handleChange}
                placeholder="e.g. 75.8577"
                className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
              />
            </div>
          </div>

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
    </div>
  );
};
