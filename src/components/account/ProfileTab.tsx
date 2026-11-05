"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Car,
  MapPin,
  Camera,
  Upload,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";
import { VehiclesTab } from "@/components/account/VehiclesTab";
import { DocumentsTab } from "@/components/account/DocumentsTab";
import { FileCheck, Sparkles, Clock, ChevronRight } from "lucide-react";

interface ProfileTabProps {
  initialUser?: any;
  onProfileUpdated?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  initialUser,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<"vehicles" | "documents" | "details">("vehicles");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  // Files & Previews
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [carImage, setCarImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [carImagePreview, setCarImagePreview] = useState("");

  // Profile Form State
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profile_image_full_path: "",
    car_brand: "",
    car_model: "",
    manufacture_year: "",
    registration_number: "",
    car_image_full_path: "",
  });



  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getCustomerProfile();
      const data = res?.content || res?.data || res;

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          profile_image_full_path: data.profile_image_full_path || "",
          car_brand: data.car?.brand || data.car_brand || "",
          car_model: data.car?.model || data.car_model || "",
          manufacture_year: data.car?.manufacture_year
            ? String(data.car.manufacture_year)
            : data.manufacture_year || "",
          registration_number:
            data.car?.registration_number || data.registration_number || "",
          car_image_full_path:
            data.car?.car_image_full_path || data.car_image_full_path || "",
        });

      }
    } catch (err: any) {
      console.error("Profile load error:", err);
      // Fallback from localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const userObj = JSON.parse(stored);
          setProfile((prev) => ({
            ...prev,
            first_name: userObj.first_name || "",
            last_name: userObj.last_name || "",
            email: userObj.email || "",
            phone: userObj.phone || "",
            profile_image_full_path: userObj.profile_image_full_path || "",
            car_brand: userObj.car?.brand || userObj.car_brand || "",
            car_model: userObj.car?.model || userObj.car_model || "",
            manufacture_year: userObj.car?.manufacture_year
              ? String(userObj.car.manufacture_year)
              : "",
            registration_number:
              userObj.car?.registration_number ||
              userObj.registration_number ||
              "",
            car_image_full_path:
              userObj.car?.car_image_full_path ||
              userObj.car_image_full_path ||
              "",
          }));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Sync profileImage file to preview
  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(profileImage);
    setProfileImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  // Sync carImage file to preview
  useEffect(() => {
    if (!carImage) {
      setCarImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(carImage);
    setCarImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [carImage]);

  // Handle Profile inputs
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  // Profile Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile.manufacture_year) {
      const year = Number(profile.manufacture_year);
      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        showToast(
          `Please enter a valid manufacture year between 1900 and ${new Date().getFullYear()}.`,
          "error"
        );
        return;
      }
    }

    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("first_name", profile.first_name);
      formData.append("last_name", profile.last_name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("car_brand", profile.car_brand);
      formData.append("car_model", profile.car_model);

      if (profile.manufacture_year) {
        formData.append(
          "manufacture_year",
          String(Number(profile.manufacture_year))
        );
      }

      formData.append("registration_number", profile.registration_number);

      if (profileImage) {
        formData.append("profile_image", profileImage);
      }
      if (carImage) {
        formData.append("car_image", carImage);
      }

      const response = await updateCustomerProfile(formData);

      if (
        response?.response_code &&
        response?.response_code !== "default_update_200" &&
        response?.response_code !== "default_200"
      ) {
        showToast(response?.message || "Failed to update profile", "error");
        return;
      }

      showToast(response?.message || "Profile updated successfully!", "success");
      setProfileImage(null);
      setCarImage(null);
      await loadProfile();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      console.error("Update Profile Error:", err);
      const errors = err?.response?.data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        showToast(errors[0]?.message || "Validation failed.", "error");
      } else {
        showToast(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to update profile.",
          "error"
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };



  if (loading) {
    return (
      <div className="rounded-3xl border border-[#33271d] bg-[#14100c] p-12 text-center shadow-2xl">
        <Loader2 className="w-8 h-8 border-2 border-[#FAD293] animate-spin mx-auto mb-3 text-[#FAD293]" />
        <p className="text-xs text-white/50">Loading profile details...</p>
      </div>
    );
  }

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User Profile";
  const userInitials =
    (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "") || "U";

  return (
    <div className="space-y-6">
{/* Welcome Greeting Header matching mobile app */}
      <div className="bg-gradient-to-br from-[#1b1510] via-[#14100c] to-[#0d0a08] border border-[#33271d] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAD293] to-[#CEA46B] p-[2px] shadow-lg shadow-black/60 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#111] flex items-center justify-center overflow-hidden">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : profile.profile_image_full_path ? (
                  <img src={profile.profile_image_full_path} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#FAD293]">{userInitials}</span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {`${getGreeting()}, ${profile.first_name || "Member"}`}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Let's keep your car ready for tomorrow.
              </p>
            </div>
          </div>

          {/* Quick Reminders Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MOT: Valid</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-[#FAD293]/30 text-[#FAD293] text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Garage Active</span>
            </div>
          </div>
        </div>

        {/* Profile Section Navigation Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setProfileSubTab("vehicles")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              profileSubTab === "vehicles"
                ? "bg-[#FAD293] text-black shadow-lg shadow-[#FAD293]/20"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Your Vehicles</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileSubTab("documents")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              profileSubTab === "documents"
                ? "bg-[#FAD293] text-black shadow-lg shadow-[#FAD293]/20"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>My Documents</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileSubTab("details")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              profileSubTab === "details"
                ? "bg-[#FAD293] text-black shadow-lg shadow-[#FAD293]/20"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Info &amp; Address</span>
          </button>
        </div>
      </div>

      {/* SubTab Views */}
      {profileSubTab === "vehicles" && <VehiclesTab />}

      {profileSubTab === "documents" && <DocumentsTab />}

      {profileSubTab === "details" && (
        <div className="space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* 2-Column Grid: Personal Info & Vehicle Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Personal Information */}
          <div className="rounded-2xl border border-[#33271d] bg-[#14100c] overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    Personal Information
                  </h3>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Your basic account details
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293]">
                  <User size={16} />
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* User Avatar + Name Row */}
                <div className="flex items-center gap-4 pb-3 border-b border-white/5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FAD293] to-[#CEA46B] p-[2px] shadow-lg shadow-black/60">
                      <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden">
                        {profileImagePreview ? (
                          <img
                            src={profileImagePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : profile.profile_image_full_path ? (
                          <img
                            src={profile.profile_image_full_path}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-bold text-[#FAD293]">
                            {userInitials}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-white truncate">
                      {fullName}
                    </h4>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {profile.email || "No email linked"}
                    </p>
                  </div>
                </div>

                {/* Form Fields: First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={profile.first_name}
                      onChange={handleProfileChange}
                      placeholder="e.g. Alexander"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={profile.last_name}
                      onChange={handleProfileChange}
                      placeholder="e.g. Sterling"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Form Fields: Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                      <span>Email</span>
                      <span className="text-[10px] text-white/30 lowercase flex items-center gap-1">
                        <Lock size={10} /> locked
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      readOnly
                      className="h-10 w-full rounded-xl border border-[#33271d]/60 bg-[#0a0806]/80 px-3 text-xs text-white/60 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="phone"
                      value={profile.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setProfile((prev) => ({ ...prev, phone: val }));
                      }}
                      placeholder="e.g. 9876543210"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Profile Photo File Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    Profile Photo
                  </label>
                  <label className="flex items-center gap-2.5 h-10 w-full rounded-xl border border-dashed border-[#d9a85f]/40 bg-[#0c0a08] px-3 cursor-pointer hover:border-[#FAD293] hover:bg-[#18130e] transition group">
                    <Camera size={14} className="text-[#FAD293]" />
                    <span className="text-xs text-[#FAD293] font-medium">
                      {profileImage ? profileImage.name : "Choose File"}
                    </span>
                    {!profileImage && (
                      <span className="text-[11px] text-white/30 truncate ml-auto">
                        No file chosen
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProfileImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Vehicle Information */}
          <div className="rounded-2xl border border-[#33271d] bg-[#14100c] overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    Vehicle Information
                  </h3>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Your registered vehicle
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293]">
                  <Car size={16} />
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Form Fields: Brand & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Car Brand
                    </label>
                    <input
                      type="text"
                      name="car_brand"
                      value={profile.car_brand}
                      onChange={handleProfileChange}
                      placeholder="e.g. Toyota / Mercedes"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Car Model
                    </label>
                    <input
                      type="text"
                      name="car_model"
                      value={profile.car_model}
                      onChange={handleProfileChange}
                      placeholder="e.g. Camry / S-Class"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Form Fields: Manufacture Year & Registration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Manufacture Year
                    </label>
                    <input
                      type="number"
                      name="manufacture_year"
                      value={profile.manufacture_year}
                      onChange={handleProfileChange}
                      placeholder="2022"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={profile.registration_number}
                      onChange={handleProfileChange}
                      placeholder="e.g. ABb-222"
                      className="h-10 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] px-3 text-xs text-white outline-none focus:border-[#FAD293] transition placeholder:text-white/20 uppercase"
                    />
                  </div>
                </div>

                {/* Vehicle Image Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    Vehicle Image
                  </label>
                  <label className="flex items-center gap-2.5 h-10 w-full rounded-xl border border-dashed border-[#d9a85f]/40 bg-[#0c0a08] px-3 cursor-pointer hover:border-[#FAD293] hover:bg-[#18130e] transition group">
                    <Upload size={14} className="text-[#FAD293]" />
                    <span className="text-xs text-[#FAD293] font-medium">
                      {carImage ? carImage.name : "Choose File"}
                    </span>
                    {!carImage && (
                      <span className="text-[11px] text-white/30 truncate ml-auto">
                        No file chosen
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCarImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Vehicle Image Preview Container */}
                <div className="h-24 w-full rounded-xl border border-[#33271d] bg-[#0c0a08] flex items-center justify-center overflow-hidden relative">
                  {carImagePreview ? (
                    <img
                      src={carImagePreview}
                      alt="Selected vehicle preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile.car_image_full_path ? (
                    <img
                      src={profile.car_image_full_path}
                      alt="Registered Vehicle"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/20 gap-1">
                      <Car size={24} />
                      <span className="text-[11px]">No vehicle image uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Profile Changes Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-7 py-3 text-xs font-bold text-[#140e0a] shadow-lg shadow-[#d09a50]/20 transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
          >
            {savingProfile ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

        </div>
      )}
    </div>
  );
};
