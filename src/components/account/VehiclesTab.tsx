"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Upload,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Sparkles,
} from "lucide-react";
import {
  fetchCustomerCars,
  createCustomerCar,
  updateCustomerCar,
  deleteCustomerCar,
  CustomerCarItem,
} from "@/lib/service/customer-vehicle-document.api";
import { useToast } from "@/components/ToastProvider";

interface VehiclesTabProps {
  onVehicleSelected?: (car: CustomerCarItem) => void;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({ onVehicleSelected }) => {
  const { showToast } = useToast();

  const [cars, setCars] = useState<CustomerCarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CustomerCarItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Delete confirmation
  const [deletingCarId, setDeletingCarId] = useState<string | number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cars from API
  const loadCars = async () => {
    try {
      setLoading(true);
      const list = await fetchCustomerCars();
      setCars(list);
    } catch (err: any) {
      console.error("Could not load vehicles:", err);
      // Fallback check in local storage if offline
      const storedCar = localStorage.getItem("user_vehicle");
      if (storedCar) {
        try {
          const parsed = JSON.parse(storedCar);
          setCars(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCar(null);
    setCarBrand("");
    setCarModel("");
    setManufactureYear(String(new Date().getFullYear()));
    setRegistrationNumber("");
    setSelectedImages([]);
    setImagePreviews([]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (car: CustomerCarItem) => {
    setEditingCar(car);
    setCarBrand(car.car_brand || car.brand || "");
    setCarModel(car.car_model || car.model || "");
    setManufactureYear(String(car.manufacture_year || car.year || ""));
    setRegistrationNumber(car.registration_number || car.reg_no || "");
    setSelectedImages([]);
    setImagePreviews([]);
    setIsModalOpen(true);
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit Add or Edit
  const handleSubmitCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carBrand.trim() || !carModel.trim() || !registrationNumber.trim()) {
      showToast("Please enter Brand, Model, and Registration Number", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingCar) {
        await updateCustomerCar(editingCar.id, {
          car_brand: carBrand,
          car_model: carModel,
          manufacture_year: manufactureYear,
          registration_number: registrationNumber,
          car_images: selectedImages,
        });
        showToast("Vehicle updated successfully!", "success");
      } else {
        await createCustomerCar({
          car_brand: carBrand,
          car_model: carModel,
          manufacture_year: manufactureYear,
          registration_number: registrationNumber,
          car_images: selectedImages,
        });
        showToast("New vehicle registered successfully!", "success");
      }
      setIsModalOpen(false);
      loadCars();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save vehicle";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Car Handler
  const handleDeleteCar = async (carId: string | number) => {
    try {
      setDeletingCarId(carId);
      await deleteCustomerCar(carId);
      showToast("Vehicle removed successfully", "success");
      setCars((prev) => prev.filter((c) => c.id !== carId));
      if (activeCarIndex >= cars.length - 1) {
        setActiveCarIndex(Math.max(0, cars.length - 2));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete vehicle", "error");
    } finally {
      setDeletingCarId(null);
    }
  };

  // Helper to extract image URL for vehicle
  const getCarImageUrl = (car: CustomerCarItem): string => {
    if (car.car_images_full_path) {
      if (Array.isArray(car.car_images_full_path) && car.car_images_full_path.length > 0) {
        return car.car_images_full_path[0];
      }
      if (typeof car.car_images_full_path === "string" && car.car_images_full_path.startsWith("http")) {
        return car.car_images_full_path;
      }
    }
    if (car.image_full_path && car.image_full_path.startsWith("http")) {
      return car.image_full_path;
    }
    if (car.car_images) {
      if (Array.isArray(car.car_images) && car.car_images.length > 0) {
        const first = car.car_images[0];
        return typeof first === "string" && first.startsWith("http")
          ? first
          : `https://mmcclub.co.uk/backend/storage/app/public/car/${first}`;
      }
      if (typeof car.car_images === "string") {
        return car.car_images.startsWith("http")
          ? car.car_images
          : `https://mmcclub.co.uk/backend/storage/app/public/car/${car.car_images}`;
      }
    }
    return "/images/alloy-wheel/hero_alloy_car.jpg";
  };

  const getCarImagesCount = (car: CustomerCarItem): number => {
    if (Array.isArray(car.car_images_full_path)) return car.car_images_full_path.length;
    if (Array.isArray(car.car_images)) return car.car_images.length;
    return car.image || car.image_full_path ? 1 : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14100c] border border-[#33271d] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8AF66]/15 border border-[#E8AF66]/30 flex items-center justify-center text-[#E8AF66] shrink-0 shadow-[0_0_20px_rgba(232,175,102,0.15)]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                Your Vehicles
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8AF66]/20 text-[#E8AF66] border border-[#E8AF66]/30">
                {cars.length} {cars.length === 1 ? "Vehicle" : "Vehicles"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage your registered cars, photos, and maintenance records
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-[#FFF0D4] via-[#FAD293] to-[#CEA46B] shadow-lg shadow-[#FAD293]/15 hover:shadow-[#FAD293]/35 hover:scale-102 active:scale-98 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#14100c] border border-[#33271d] rounded-3xl">
          <Loader2 className="w-8 h-8 text-[#E8AF66] animate-spin" />
          <p className="text-xs text-zinc-400">Loading your garage...</p>
        </div>
      ) : cars.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#14100c] border border-[#33271d] rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
            <Car className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No vehicles added yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Add your car to receive instant maintenance quotes, MOT due reminders, and fast booking without re-entering vehicle details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-black bg-[#FAD293] hover:bg-[#ffe0a8] shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Your First Vehicle</span>
          </button>
        </div>
      ) : (
        /* Vehicles Grid / Carousel Display */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cars.map((car, idx) => {
            const isDeleting = deletingCarId === car.id;
            const imgCount = getCarImagesCount(car);
            const brand = car.car_brand || car.brand || "Vehicle";
            const model = car.car_model || car.model || "";
            const year = car.manufacture_year || car.year || "";
            const reg = (car.registration_number || car.reg_no || "ABC-1234").toUpperCase();

            return (
              <div
                key={car.id || idx}
                className="group relative flex flex-col bg-[#16120e] border border-[#33271d] hover:border-[#E8AF66]/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/60"
              >
                {/* Vehicle Banner Image */}
                <div className="relative w-full aspect-[16/10] bg-zinc-950 overflow-hidden">
                  <img
                    src={getCarImageUrl(car)}
                    alt={`${brand} ${model}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/images/alloy-wheel/hero_alloy_car.jpg";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-black/30 to-transparent pointer-events-none" />

                  {/* Daily Drive Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-400 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>My daily drive</span>
                  </div>

                  {/* Photo count badge */}
                  {imgCount > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-zinc-300 shadow-md">
                      <ImageIcon className="w-3 h-3 text-[#E8AF66]" />
                      <span>{imgCount} photo{imgCount > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {/* UK Reg Plate floating on image */}
                  <div className="absolute bottom-3 left-3">
                    <div className="inline-flex items-center bg-[#fbc02d] text-black font-black text-xs sm:text-sm px-3 py-1 rounded-md border-2 border-amber-600 shadow-2xl tracking-wider select-none font-mono">
                      <span>{reg}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                        {brand} {model}
                      </h3>
                      {year && (
                        <span className="text-xs font-semibold text-zinc-400 shrink-0">
                          {year}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Registered in your MMC Garage
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(car)}
                        title="Edit Vehicle Details"
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#E8AF66]/40 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCar(car.id)}
                        disabled={isDeleting}
                        title="Remove Vehicle"
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <Link
                      href={`/services/valet-wash?reg=${encodeURIComponent(reg)}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#E8AF66]/15 hover:bg-[#E8AF66]/25 border border-[#E8AF66]/30 text-[#E8AF66] text-xs font-bold transition cursor-pointer"
                    >
                      <span>Book Care</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#14100c] border border-[#33271d] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8AF66]/15 border border-[#E8AF66]/30 flex items-center justify-center text-[#E8AF66]">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {editingCar ? "Edit Vehicle" : "Add Vehicle to Garage"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Enter your vehicle specifications and photos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCar} className="space-y-4">
              {/* Row 1: Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Car Brand <span className="text-[#E8AF66]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    placeholder="e.g. Toyota, BMW, Audi"
                    className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Car Model <span className="text-[#E8AF66]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g. Camry, 3 Series, C-Class"
                    className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Row 2: Manufacture Year & Reg Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Manufacture Year
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    value={manufactureYear}
                    onChange={(e) => setManufactureYear(e.target.value)}
                    placeholder="e.g. 2022"
                    className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Registration Number <span className="text-[#E8AF66]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. ABC-1234 or LK71 ABC"
                    className="w-full bg-[#1b1510] border border-zinc-800 focus:border-[#E8AF66] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase font-mono tracking-wider focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Row 3: Photo Uploads */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Vehicle Photos (Optional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-[#E8AF66]/60 rounded-2xl p-5 text-center cursor-pointer transition bg-[#1b1510]/50 space-y-1.5"
                >
                  <Upload className="w-6 h-6 text-[#E8AF66] mx-auto" />
                  <p className="text-xs font-medium text-white">
                    Click to upload vehicle pictures
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    PNG, JPG, WEBP up to 10MB each
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {imagePreviews.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 group"
                      >
                        <img src={url} alt="Car preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(i);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-[#FFF0D4] via-[#FAD293] to-[#CEA46B] shadow-lg shadow-[#FAD293]/15 hover:shadow-[#FAD293]/35 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCar ? "Save Changes" : "Register Vehicle"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
