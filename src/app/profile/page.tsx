"use client";

import { useEffect, useState } from "react";

import {
  getCustomerProfile,
  updateCustomerProfile,
  saveCustomerAddress,
} from "@/app/services/api/profile.api";

import { useToast } from "@/components/ToastProvider";


interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  profile_image_full_path: string;

  car_brand: string;
  car_model: string;
  manufacture_year: string;
  registration_number: string;

  car_image_full_path: string;
}

interface AddressData {
  lat: string;
  lon: string;
  address: string;
  address_type: string;
  contact_person_name: string;
  contact_person_number: string;
  address_label: string;
}


export default function ProfilePage() {
  const { showToast } = useToast();



  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);

  const [savingAddress, setSavingAddress] = useState(false);


  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [carImage, setCarImage] = useState<File | null>(null);

  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [carImagePreview, setCarImagePreview] = useState("");


  const [profile, setProfile] = useState<ProfileData>({
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

 

  const [address, setAddress] = useState<AddressData>({
    lat: "",
    lon: "",
    address: "",
    address_type: "service",
    contact_person_name: "",
    contact_person_number: "",
    address_label: "Home",
  });



  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileImage);

    setProfileImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileImage]);

  

  useEffect(() => {
    if (!carImage) {
      setCarImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(carImage);

    setCarImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [carImage]);



  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const response = await getCustomerProfile();

        console.log("Profile Response:", response);

    

        if (response?.response_code !== "default_200") {
          showToast(response?.message || "Failed to load profile", "error");

          return;
        }

        const data = response?.content;

        if (!data) {
          showToast("Profile data not found.", "error");

          return;
        }

      

        setProfile({
          first_name: data.first_name || "",

          last_name: data.last_name || "",

          email: data.email || "",

          phone: data.phone || "",

        
          profile_image_full_path: data.profile_image_full_path || "",


          car_brand: data.car?.brand || "",

          car_model: data.car?.model || "",

          manufacture_year: data.car?.manufacture_year
            ? String(data.car.manufacture_year)
            : "",

          registration_number: data.car?.registration_number || "",

     
          car_image_full_path: data.car?.car_image_full_path || "",
        });

        

        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        setAddress({
          lat: data.lat || "",

          lon: data.lon || "",

          address: data.address || "",

          address_type: data.address_type || "service",

          contact_person_name:
            data.contact_person_name ||
            (user
              ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
              : ""),

          contact_person_number:
            data.contact_person_number || user?.phone || "",

          address_label: data.address_label || "Home",
        });
      } catch (error: any) {
        console.error("Profile Error:", error);

        console.error("Backend Response:", error?.response?.data);

        showToast(
          error?.response?.data?.message || "Failed to load profile",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



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
          "error",
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
          String(Number(profile.manufacture_year)),
        );
      }

      formData.append("registration_number", profile.registration_number);


      if (profileImage) {
        formData.append("profile_image", profileImage);
      }



      if (carImage) {
        formData.append("car_image", carImage);
      }

 

      console.log("Updating profile...");

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      

      const response = await updateCustomerProfile(formData);

      console.log("Update Profile Response:", response);

   

      if (response?.response_code !== "default_update_200") {
        showToast(response?.message || "Failed to update profile", "error");

        return;
      }



      showToast(response?.message || "Profile updated successfully", "success");

  
      setCarImage(null);
      setProfileImage(null);

   
    } catch (error: any) {
      console.error("Update Profile Error:", error);

      console.error("Backend Response:", error?.response?.data);

    

      const errors = error?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        const firstError = errors[0];

        showToast(firstError?.message || "Validation failed.", "error");
      } else {
        showToast(
          error?.response?.data?.message || "Failed to update profile.",
          "error",
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };


  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSavingAddress(true);

    try {
      const response = await saveCustomerAddress(address);

      console.log("Address Response:", response);

 

      if (response?.response_code !== "default_200") {
        showToast(response?.message || "Failed to save address", "error");

        return;
      }

     

      showToast(response?.message || "Address saved successfully", "success");
    } catch (error: any) {
      console.error("Address Error:", error);

      console.error("Backend Response:", error?.response?.data);

      const errors = error?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        showToast(errors[0]?.message || "Address validation failed.", "error");
      } else {
        showToast(
          error?.response?.data?.message || "Failed to save address.",
          "error",
        );
      }
    } finally {
      setSavingAddress(false);
    }
  };



  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FAD293]/20 border-t-[#FAD293] rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-white/40">Loading profile...</p>
        </div>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-[#050505] text-white px-4 sm:px-6 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto">
        

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My Profile
            </h1>

            <p className="text-white/40 text-xs sm:text-sm mt-1">
              Manage your personal, vehicle and address information.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#FAD293]" />

            <span className="text-xs text-white/50">Account Active</span>
          </div>
        </div>


        <form id="profile-form" onSubmit={handleProfileSubmit}>
          <div className="grid lg:grid-cols-2 gap-4">
       

            <section className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden">
              {/* CARD HEADER */}

              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">
                    Personal Information
                  </h2>

                  <p className="text-[11px] text-white/30 mt-0.5">
                    Your basic account details
                  </p>
                </div>

                <div className="w-8 h-8 rounded-lg bg-[#FAD293]/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[#FAD293]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>

              <div className="p-5">
                {/* PROFILE HEADER */}

                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FAD293] to-[#CEA46B] p-[2px]">
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
                            alt={`${profile.first_name} ${profile.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-[#FAD293]">
                            {profile.first_name?.charAt(0)}
                            {profile.last_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {profile.first_name || "User"} {profile.last_name}
                    </h3>

                    <p className="text-xs text-white/35 truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>

             

                <div className="grid grid-cols-2 gap-3">
                  

                  <div>
                    <label className="field-label">First Name</label>

                    <input
                      name="first_name"
                      value={profile.first_name}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="First name"
                    />
                  </div>

                

                  <div>
                    <label className="field-label">Last Name</label>

                    <input
                      name="last_name"
                      value={profile.last_name}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="Last name"
                    />
                  </div>

                 

                  <div>
                    <label className="field-label">Email</label>

                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      readOnly
                      className="profile-input opacity-60 cursor-not-allowed"
                    />
                  </div>

                  

                  <div>
                    <label className="field-label">Phone</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="phone"
                      value={profile.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");

                        setProfile((prev) => ({
                          ...prev,
                          phone: value,
                        }));
                      }}
                      className="profile-input"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

              

                <div className="mt-3">
                  <label className="field-label">Profile Photo</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProfileImage(e.target.files?.[0] || null)
                    }
                    className="file-input"
                  />
                </div>
              </div>
            </section>

            

            <section className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden">
            

              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Vehicle Information</h2>

                  <p className="text-[11px] text-white/30 mt-0.5">
                    Your registered vehicle
                  </p>
                </div>

                <div className="w-8 h-8 rounded-lg bg-[#FAD293]/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[#FAD293]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 17h14l-1.5-6h-11L5 17zm0 0v2h2m12-2v2h-2M7 11l1.5-4h7L17 11M8 17h.01M16 17h.01"
                    />
                  </svg>
                </div>
              </div>

              <div className="p-5">
                

                <div className="grid grid-cols-2 gap-3">
                

                  <div>
                    <label className="field-label">Car Brand</label>

                    <input
                      name="car_brand"
                      value={profile.car_brand}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="Toyota"
                    />
                  </div>

                

                  <div>
                    <label className="field-label">Car Model</label>

                    <input
                      name="car_model"
                      value={profile.car_model}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="Camry"
                    />
                  </div>

                

                  <div>
                    <label className="field-label">Manufacture Year</label>

                    <input
                      type="number"
                      name="manufacture_year"
                      value={profile.manufacture_year}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="2022"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                 

                  <div>
                    <label className="field-label">Registration Number</label>

                    <input
                      name="registration_number"
                      value={profile.registration_number}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>


                <div className="mt-3">
                  <label className="field-label">Vehicle Image</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCarImage(e.target.files?.[0] || null)}
                    className="file-input"
                  />
                </div>

                

                <div className="mt-3 h-24 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden">
                  {carImagePreview ? (
                    <img
                      src={carImagePreview}
                      alt="New vehicle preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile.car_image_full_path ? (
                    <img
                      src={profile.car_image_full_path}
                      alt="Vehicle"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <svg
                        className="w-7 h-7 mx-auto text-white/15 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M5 17h14l-1.5-6h-11L5 17z"
                        />
                      </svg>

                      <p className="text-[11px] text-white/25">
                        No vehicle image
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            

            <section className="lg:col-span-2 bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden">
              {/* HEADER */}

              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Address</h2>

                  <p className="text-[11px] text-white/30 mt-0.5">
                    Your saved service address
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <svg
                      className="w-3.5 h-3.5 text-[#FAD293]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 21a2 2 0 01-2.828 0l-4.243-4.343a8 8 0 1111.314 0z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>

                    <span className="text-[10px] text-white/40">
                      Service Location
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                

                <div className="grid md:grid-cols-4 gap-3">
                

                  <div className="md:col-span-2">
                    <label className="field-label">Address</label>

                    <input
                      name="address"
                      value={address.address}
                      onChange={handleAddressChange}
                      placeholder="123, Vijay Nagar, Indore"
                      className="profile-input"
                    />
                  </div>

              

                  <div>
                    <label className="field-label">Label</label>

                    <select
                      name="address_label"
                      value={address.address_label}
                      onChange={handleAddressChange}
                      className="profile-input"
                    >
                      <option value="Home">Home</option>

                      <option value="Work">Work</option>

                      <option value="Other">Other</option>
                    </select>
                  </div>


                  <div>
                    <label className="field-label">Type</label>

                    <select
                      name="address_type"
                      value={address.address_type}
                      onChange={handleAddressChange}
                      className="profile-input"
                    >
                      <option value="service">Service</option>

                      <option value="home">Home</option>

                      <option value="work">Work</option>
                    </select>
                  </div>

                 

                  <div>
                    <label className="field-label">Contact Name</label>

                    <input
                      name="contact_person_name"
                      value={address.contact_person_name}
                      onChange={handleAddressChange}
                      placeholder="Rohit Gannote"
                      className="profile-input"
                    />
                  </div>

                 

                  <div>
                    <label className="field-label">Contact Number</label>

                    <input
                      name="contact_person_number"
                      value={address.contact_person_number}
                      onChange={handleAddressChange}
                      placeholder="9009775909"
                      className="profile-input"
                    />
                  </div>

                 
                  <div>
                    <label className="field-label">Latitude</label>

                    <input
                      name="lat"
                      value={address.lat}
                      onChange={handleAddressChange}
                      placeholder="22.7196"
                      className="profile-input"
                    />
                  </div>

                 

                  <div>
                    <label className="field-label">Longitude</label>

                    <input
                      name="lon"
                      value={address.lon}
                      onChange={handleAddressChange}
                      placeholder="75.8577"
                      className="profile-input"
                    />
                  </div>
                </div>


                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={handleAddressSubmit}
                    disabled={savingAddress}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black disabled:opacity-50 transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg,#FAD293,#CEA46B)",
                    }}
                  >
                    {savingAddress ? "Saving Address..." : "Save Address"}
                  </button>
                </div>
              </div>
            </section>
          </div>

    

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-black disabled:opacity-50 transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#FAD293,#CEA46B)",
              }}
            >
              {savingProfile ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 5px;
        }

        .profile-input {
          width: 100%;
          height: 38px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9px;
          padding: 0 11px;
          color: white;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
        }

        .profile-input:focus {
          border-color: rgba(250, 210, 147, 0.5);
          box-shadow: 0 0 0 2px rgba(250, 210, 147, 0.05);
        }

        .profile-input::placeholder {
          color: rgba(255, 255, 255, 0.18);
        }

        .profile-input:read-only {
          cursor: not-allowed;
        }

        .file-input {
          width: 100%;
          height: 38px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9px;
          padding: 7px 9px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
        }

        .file-input::file-selector-button {
          background: rgba(250, 210, 147, 0.12);
          color: #fad293;
          border: 0;
          border-radius: 6px;
          padding: 5px 8px;
          margin-right: 7px;
          cursor: pointer;
          font-size: 10px;
        }

        select option {
          background: #111;
          color: white;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.4;
        }
      `}</style>
    </main>
  );
}
