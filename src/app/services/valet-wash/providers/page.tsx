"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Car,
  Pencil,
  Eye,
  Star,
  Clock,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Building,
  Phone,
  Mail,
  ArrowRight,
  Filter,
  Check,
  Award,
  Zap,
  Navigation,
  Lock,
  Warehouse,
  Bell,
  CalendarDays,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  searchProvidersByService,
  ValetProvider,
  getWashTypes,
  WashTypeItem,
  DEFAULT_VALET_PACKAGES,
  sendValetBookingRequest,
  extractDisplayPrice,
  DEFAULT_ZONE_ID,
  getValetProviderSlots,
  ValetSlotItem,
} from "@/lib/service/valet.api";
import { getBackendRootUrl } from "@/lib/http/apiClient";
import { saveBookingMeta, saveConfirmedBooking } from "@/lib/service/bookings.api";
import { useToast } from "@/components/ToastProvider";
import { isAuthenticated } from "@/lib/auth.api";
import { triggerDevicePushNotification } from "@/lib/firebase";
import ServiceOurWorkShowcase from "@/components/gallery/ServiceOurWorkShowcase";

interface PackageVariationOption {
  key: string;
  name: string;
  description: string;
  price: number;
}

interface ProviderServiceGroup {
  serviceId: string;
  serviceName: string;
  variations: PackageVariationOption[];
}

function ChooseDetailersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // URL / Initial State Params
  const paramServiceId =
    searchParams.get("service_id") || DEFAULT_VALET_PACKAGES[0].id;
  const paramServiceIds = searchParams.get("service_ids")
    ? searchParams.get("service_ids")!.split(",").filter(Boolean)
    : [paramServiceId];
  const paramServiceName =
    searchParams.get("service_name") || DEFAULT_VALET_PACKAGES[0].name;
  const paramLocation = searchParams.get("location") || "";
  const paramReg = searchParams.get("reg") || "";

  // Data State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(paramServiceIds);
  const [washTypes, setWashTypes] = useState<WashTypeItem[]>(DEFAULT_VALET_PACKAGES);
  const [providers, setProviders] = useState<ValetProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Questionnaire / Request Data restored from SessionStorage
  const [requestData, setRequestData] = useState<any>(null);

  // Filter State
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [sortBy, setSortBy] = useState<"best" | "price_low" | "price_high" | "distance" | "rating">("best");

  // Selected Provider (Controls Main Page View: null = Detailers List, non-null = Dedicated Booking Screen)
  const [selectedProvider, setSelectedProvider] = useState<ValetProvider | null>(null);
  const [selectedProviderForGallery, setSelectedProviderForGallery] = useState<ValetProvider | null>(null);

  // ─── Booking Form State ───
  const dateInputRef = useRef<HTMLInputElement>(null);
  // Store variation selection per service: { [serviceId]: variantKey }
  const [selectedServiceVariations, setSelectedServiceVariations] = useState<Record<string, string>>({});
  const todayStr = new Date().toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTime, setBookingTime] = useState("10:00");

  // Formatted date label for current selection
  const selectedDateLabel = useMemo(() => {
    if (!bookingDate) return "";
    try {
      const [y, m, d] = bookingDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return bookingDate;
    }
  }, [bookingDate]);
  
  // Dynamic Slots from API State
  const [providerSlots, setProviderSlots] = useState<ValetSlotItem[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedSlotTitle, setSelectedSlotTitle] = useState<string>("");

  const [serviceLocationType, setServiceLocationType] = useState<"mobile" | "workshop">("workshop");
  const [carBrandModel, setCarBrandModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [specialConditionsText, setSpecialConditionsText] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Payment State
  const [isPartialPayment, setIsPartialPayment] = useState(true);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState("");

  // Restore Request Data from SessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("mmc_valet_request");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRequestData(parsed);
          if (Array.isArray(parsed.selectedServiceIds) && parsed.selectedServiceIds.length > 0) {
            setSelectedServiceIds(parsed.selectedServiceIds);
          } else if (parsed.selectedServiceId) {
            setSelectedServiceIds([parsed.selectedServiceId]);
          }
          if (parsed.carModel) setCarBrandModel(parsed.carModel);
          if (parsed.carColor) setCarColor(parsed.carColor);

          // Build summary for special conditions
          const condParts: string[] = [];
          if (parsed.lastCleaned) condParts.push(parsed.lastCleaned);
          if (parsed.exteriorCondition) condParts.push(parsed.exteriorCondition);
          if (Array.isArray(parsed.interiorConditions) && parsed.interiorConditions.length > 0) {
            condParts.push(...parsed.interiorConditions);
          }
          if (Array.isArray(parsed.selectedAddons) && parsed.selectedAddons.length > 0) {
            condParts.push(...parsed.selectedAddons);
          }
          if (parsed.preferredOutcome) condParts.push(parsed.preferredOutcome);
          if (condParts.length > 0) {
            setSpecialConditionsText(condParts.join(", "));
          }
          if (parsed.notes) setAdditionalNotes(parsed.notes);
        } catch (e) {
          console.warn("Could not parse valet request draft:", e);
        }
      }
    }
  }, []);

  // Fetch Providers and Wash Types from API
  useEffect(() => {
    let isMounted = true;
    const loadProviders = async () => {
      try {
        setLoading(true);
        const [types, providerList] = await Promise.all([
          getWashTypes(20, 1),
          searchProvidersByService(
            selectedServiceIds,
            20,
            1,
            DEFAULT_ZONE_ID,
            requestData?.latitude,
            requestData?.longitude
          ),
        ]);

        if (isMounted) {
          if (types && types.length > 0) setWashTypes(types);
          if (providerList && providerList.length > 0) {
            setProviders(providerList);
          } else {
            // High quality fallback matching screen 2
            setProviders([
              {
                id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
                user_id: "u-101",
                company_name: "motor market connect club",
                company_phone: "+44 20 7946 0912",
                company_address: "Silbury House, Sydenham Hill, London",
                company_email: "valet@motormarketconnect.com",
                avg_rating: 4.9,
                rating_count: 38,
                order_count: 142,
                service_capacity_per_day: 8,
                is_active: 1,
                distance: "4.2",
                selected_services: [
                  {
                    service_id: "4ddde005-4ec2-442c-9e21-d05b4165d545",
                    service_name: "Full Exterior Valet",
                    min_price: 0,
                    variations: [
                      { variant_key: "basic", variant: "basic", price: 70, admin_price: 70, is_custom: 1 },
                      { variant_key: "perium", variant: "perium", price: 0, admin_price: 0, is_custom: 1 },
                    ],
                    service_types: ["mobile", "workshop"],
                  },
                ],
              } as ValetProvider,
              {
                id: "a3108c4e-1b84-48d6-95df-32ef2d75a89f",
                user_id: "u-102",
                company_name: "fantasticcarcrafts",
                company_phone: "+44 77 1234 5678",
                company_address: "Ss142rr 11 Beeleigh east, Essex",
                company_email: "info@fantasticcarcrafts.co.uk",
                avg_rating: 4.7,
                rating_count: 24,
                order_count: 89,
                service_capacity_per_day: 6,
                is_active: 1,
                distance: "8.7",
                selected_services: [
                  {
                    service_id: "4ddde005-4ec2-442c-9e21-d05b4165d545",
                    service_name: "Full Exterior Valet",
                    min_price: 0,
                    variations: [
                      { variant_key: "basic", variant: "basic", price: 65, admin_price: 65, is_custom: 1 },
                      { variant_key: "perium", variant: "perium", price: 0, admin_price: 0, is_custom: 1 },
                    ],
                    service_types: ["mobile", "workshop"],
                  },
                ],
              } as ValetProvider,
              {
                id: "b218d84a-71a2-4a92-93cb-33d99432d184",
                user_id: "u-103",
                company_name: "TATA ROHIT",
                company_phone: "+44 77 0090 0123",
                company_address: "Indore Road Specialist Hub",
                company_email: "rohit@detailhub.com",
                avg_rating: 5.0,
                rating_count: 2,
                order_count: 19,
                service_capacity_per_day: 5,
                is_active: 1,
                distance: "12.0",
                selected_services: [
                  {
                    service_id: "16c0655b-38ca-412f-94d1-1db5463cf70c",
                    service_name: "Full Exterior Valet",
                    min_price: 120,
                    variations: [
                      { variant_key: "basic", variant: "basic", price: 120, admin_price: 120, is_custom: 1 },
                      { variant_key: "perium", variant: "perium", price: 130, admin_price: 130, is_custom: 1 },
                    ],
                    service_types: ["workshop"],
                  },
                ],
              } as ValetProvider,
              {
                id: "d931a74e-53c8-472d-9831-27cb99842a15",
                user_id: "u-104",
                company_name: "Prestige Mobile Valeting",
                company_phone: "+44 20 8999 1234",
                company_address: "High Street, Kensington, London",
                company_email: "bookings@prestigevaleting.com",
                avg_rating: 4.8,
                rating_count: 19,
                order_count: 64,
                service_capacity_per_day: 6,
                is_active: 1,
                distance: "15.4",
              } as ValetProvider,
            ]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch valet providers:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProviders();
    return () => {
      isMounted = false;
    };
  }, [selectedServiceIds, requestData?.latitude, requestData?.longitude]);

  // Dynamic Slots Fetching when provider or date changes
  useEffect(() => {
    if (!selectedProvider) return;

    let isCurrent = true;
    const fetchSlots = async () => {
      try {
        setIsSlotsLoading(true);
        const slots = await getValetProviderSlots(selectedProvider.id, bookingDate);
        if (!isCurrent) return;

        if (slots && slots.length > 0) {
          setProviderSlots(slots);
          const firstAvailable = slots.find((s) => s.is_available) || slots[0];
          setSelectedSlotId(firstAvailable.id);
          setSelectedSlotTitle(firstAvailable.title);
          if (firstAvailable.start_time) {
            setBookingTime(firstAvailable.start_time);
          }
        } else {
          setProviderSlots([]);
          setSelectedSlotId("");
          setSelectedSlotTitle("");
        }
      } catch (err) {
        console.warn("Failed to load provider slots from API:", err);
      } finally {
        if (isCurrent) setIsSlotsLoading(false);
      }
    };

    fetchSlots();
    return () => {
      isCurrent = false;
    };
  }, [selectedProvider, bookingDate]);

  // Selected Services Details
  const matchedServices = useMemo(() => {
    return washTypes.filter((w) => selectedServiceIds.includes(w.id));
  }, [washTypes, selectedServiceIds]);

  const combinedServicesTitle = useMemo(() => {
    if (matchedServices.length > 0) {
      return matchedServices.map((s) => s.name).join(" + ");
    }
    return requestData?.selectedServiceName || paramServiceName || "Vehicle Valet Wash";
  }, [matchedServices, requestData, paramServiceName]);

  // Calculate lowest starting price for each provider
  const getProviderLowestPrice = (provider: ValetProvider): number => {
    const prices: number[] = [];

    if (Array.isArray(provider.selected_services)) {
      provider.selected_services.forEach((s) => {
        if (Array.isArray(s.variations)) {
          s.variations.forEach((v) => {
            const p = Number(v.price ?? v.admin_price);
            if (!isNaN(p)) prices.push(p);
          });
        }
        if (s.min_price !== undefined && s.min_price !== null) {
          const mp = Number(s.min_price);
          if (!isNaN(mp)) prices.push(mp);
        }
      });
    }

    if (provider.total_selected_services_price !== undefined) {
      const tp = Number(provider.total_selected_services_price);
      if (!isNaN(tp)) prices.push(tp);
    }

    if (prices.length > 0) {
      return Math.min(...prices);
    }

    return 0;
  };

  // Provider's Wash Packages Grouped per Service
  const servicesWithVariations = useMemo<ProviderServiceGroup[]>(() => {
    if (!selectedProvider) return [];

    const groups: ProviderServiceGroup[] = [];

    if (
      Array.isArray(selectedProvider.selected_services) &&
      selectedProvider.selected_services.length > 0
    ) {
      selectedProvider.selected_services.forEach((s, idx) => {
        if (Array.isArray(s.variations) && s.variations.length > 0) {
          const variations: PackageVariationOption[] = s.variations.map((v) => {
            const vKey = (v.variant_key || v.variant || "basic").toLowerCase();
            const vName = v.variant || v.variant_key || "basic";
            const isBasic = vKey.includes("basic");
            const price = Number(v.price ?? v.admin_price ?? 0);

            return {
              key: vKey,
              name: vName.toLowerCase(),
              description: isBasic
                ? "Quick rinse and shine to keep your car clean."
                : "Professional car wash service for your vehicle.",
              price: price,
            };
          });

          if (variations.length > 0) {
            groups.push({
              serviceId: String(s.service_id || `srv-${idx}`),
              serviceName: s.service_name || s.name || `Valet Service ${idx + 1}`,
              variations,
            });
          }
        }
      });
    }

    if (groups.length > 0) {
      return groups;
    }

    // Default package variations
    return [
      {
        serviceId: "default-valet",
        serviceName: "Vehicle Valet Wash",
        variations: [
          {
            key: "basic",
            name: "basic",
            description: "Quick rinse and shine to keep your car clean.",
            price: 70,
          },
          {
            key: "perium",
            name: "perium",
            description: "Professional car wash service for your vehicle.",
            price: 0,
          },
        ],
      },
    ];
  }, [selectedProvider]);

  // Handle variation selection per service
  const handleSelectVariation = (serviceId: string, variantKey: string) => {
    setSelectedServiceVariations((prev) => ({
      ...prev,
      [serviceId]: variantKey,
    }));
  };

  // Flattened variations for fallback compatibility
  const availableProviderPackages = useMemo<PackageVariationOption[]>(() => {
    return servicesWithVariations.flatMap((srv) => srv.variations);
  }, [servicesWithVariations]);

  // Dynamic Selected Package (First service or chosen)
  const currentSelectedPackage = useMemo(() => {
    const firstService = servicesWithVariations[0];
    if (!firstService || firstService.variations.length === 0) {
      return {
        key: "basic",
        name: "basic",
        description: "Quick rinse and shine to keep your car clean.",
        price: 70,
      };
    }
    const selKey =
      selectedServiceVariations[firstService.serviceId] ||
      firstService.variations[0].key;
    return (
      firstService.variations.find((v) => v.key === selKey) ||
      firstService.variations[0]
    );
  }, [servicesWithVariations, selectedServiceVariations]);

  // Selected package key helper
  const selectedPackageKey = currentSelectedPackage.key;

  // Accurate Dynamic Price Calculation (Sum of selected variation across all services)
  const activePackagePrice = useMemo(() => {
    let total = 0;
    servicesWithVariations.forEach((srv) => {
      const selKey =
        selectedServiceVariations[srv.serviceId] || srv.variations[0]?.key;
      const matched =
        srv.variations.find((v) => v.key === selKey) ||
        srv.variations.find((v) =>
          v.key.toLowerCase().includes((selKey || "").toLowerCase())
        ) ||
        srv.variations[0];
      if (matched) {
        total += Number(matched.price) || 0;
      }
    });
    return total;
  }, [servicesWithVariations, selectedServiceVariations]);

  const depositAmount = (activePackagePrice * 0.25).toFixed(2);
  const remainingAmount = (activePackagePrice * 0.75).toFixed(2);
  const payableAmount = isPartialPayment ? depositAmount : activePackagePrice.toFixed(2);

  // Filtered & Sorted Providers List
  const filteredProviders = useMemo(() => {
    let list = [...providers];

    if (onlyNearby) {
      list = list.filter((p) => {
        const dist = parseFloat(String(p.distance_miles || p.distance || "10"));
        return !isNaN(dist) && dist <= searchRadius;
      });
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => getProviderLowestPrice(a) - getProviderLowestPrice(b));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => getProviderLowestPrice(b) - getProviderLowestPrice(a));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sortBy === "distance") {
      list.sort(
        (a, b) =>
          parseFloat(String(a.distance_miles || a.distance || "999")) -
          parseFloat(String(b.distance_miles || b.distance || "999"))
      );
    }

    return list;
  }, [providers, onlyNearby, searchRadius, sortBy]);

  // Transition to dedicated screen view
  const handleSelectProviderForBooking = (provider: ValetProvider) => {
    setSelectedProvider(provider);
    setIsBookingSuccess(false);

    // Initialize variation selection for each service of this provider
    const initialMap: Record<string, string> = {};
    if (Array.isArray(provider.selected_services)) {
      provider.selected_services.forEach((s, idx) => {
        const sId = String(s.service_id || `srv-${idx}`);
        const firstVar = s.variations?.[0];
        if (firstVar) {
          initialMap[sId] = (firstVar.variant_key || firstVar.variant || "basic").toLowerCase();
        } else {
          initialMap[sId] = "basic";
        }
      });
    }
    setSelectedServiceVariations(initialMap);

    // Default service location
    const pTypes = provider.service_types || ["mobile", "workshop"];
    if (pTypes.includes("workshop")) {
      setServiceLocationType("workshop");
    } else {
      setServiceLocationType("mobile");
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit Booking & Redirect to Stripe Online Payment
  const handleConfirmAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    if (!isAuthenticated()) {
      showToast("Please log in to finalize your booking", "info");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (providerSlots.length === 0 || !selectedSlotId) {
      showToast("No slots available on this date. Please select another date.", "error");
      return;
    }

    setIsBookingSubmitting(true);

    try {
      const scheduleTime =
        bookingTime.includes(":") && bookingTime.split(":").length === 2
          ? `${bookingTime}:00`
          : bookingTime;
      const formattedSchedule = `${bookingDate} ${scheduleTime}`;

      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : `${getBackendRootUrl()}/booking-success`;

      // Add each selected service with its chosen variation to cart
      for (const srv of servicesWithVariations) {
        const selKey =
          selectedServiceVariations[srv.serviceId] || srv.variations[0]?.key;
        if (selKey) {
          try {
            await addValetToCart({
              service_id: srv.serviceId,
              provider_id: selectedProvider.id,
              variant_key: selKey,
              quantity: 1,
              zone_id: DEFAULT_ZONE_ID,
            });
          } catch (err) {
            console.warn("Could not add variation to cart:", srv.serviceId, err);
          }
        }
      }

      const summaryPackages = servicesWithVariations
        .map((srv) => {
          const selKey =
            selectedServiceVariations[srv.serviceId] || srv.variations[0]?.key;
          const match =
            srv.variations.find((v) => v.key === selKey) || srv.variations[0];
          return `${srv.serviceName}: ${match?.name || selKey} (£${match?.price || 0})`;
        })
        .join(" + ");

      const primaryServiceId =
        servicesWithVariations[0]?.serviceId ||
        selectedServiceIds[0] ||
        DEFAULT_VALET_PACKAGES[0].id;
      const primaryVariantKey =
        selectedServiceVariations[servicesWithVariations[0]?.serviceId] ||
        currentSelectedPackage.key;

      const bookingRes = await sendValetBookingRequest({
        service_id: primaryServiceId,
        provider_id: selectedProvider.id,
        variant_key: primaryVariantKey,
        payment_method: "stripe",
        is_partial: isPartialPayment ? 1 : 0,
        zone_id: DEFAULT_ZONE_ID,
        service_schedule: formattedSchedule,
        service_address_id: requestData?.serviceAddressId || "2",
        service_location: serviceLocationType === "workshop" ? "provider" : "customer",
        service_address: requestData?.locationAddress || paramLocation || "Customer Address",
        selected_slot_id: selectedSlotId || "00dc5d50-fa91-4c49-b74a-1326fc8a1fdf",
        car_registration_number: requestData?.carReg || paramReg || "MMC VEHICLE",
        car_model: carBrandModel.trim() || requestData?.carModel || "Vehicle",
        car_color: carColor.trim() || requestData?.carColor || "Standard",
        special_conditions: specialConditionsText.trim() || "Standard vehicle condition",
        notes: additionalNotes.trim()
          ? `${additionalNotes.trim()} [Packages: ${summaryPackages}]`
          : `Packages: ${summaryPackages} | Slot: ${selectedSlotTitle}`,
        answers: requestData?.answers || {},
        callback: callbackUrl,
      });

      const content = bookingRes?.content;
      const ref =
        content?.readable_id ||
        content?.id ||
        (Array.isArray(content?.booking_id) ? content.booking_id[0] : content?.booking_id) ||
        bookingRes?.booking_reference;

      const confirmedId = String(ref || `MMC-VAL-${Date.now().toString().slice(-6)}`);
      setConfirmedBookingRef(confirmedId);

      // Direct Stripe URL Redirection
      const redirectLink =
        content?.redirect_link ||
        content?.url ||
        content?.redirect_url ||
        content?.payment_url ||
        bookingRes?.redirect_link ||
        bookingRes?.url;

      if (
        redirectLink &&
        typeof redirectLink === "string" &&
        redirectLink.startsWith("http")
      ) {
        // Save pending booking draft to sessionStorage so that when Stripe redirects back to /booking-success, it has all details
        try {
          sessionStorage.setItem(
            "mmc_pending_booking",
            JSON.stringify({
              booking_id: confirmedId,
              readable_id: confirmedId,
              provider: selectedProvider,
              serviceTitle: `Valet: ${summaryPackages}`,
              service_name: summaryPackages,
              price: activePackagePrice,
              is_partial: isPartialPayment ? 1 : 0,
              deposit_amount: depositAmount,
              schedule: formattedSchedule,
              car_reg: requestData?.carReg || paramReg || "MMC",
              car_model: carBrandModel.trim() || requestData?.carModel || "Vehicle",
              payment_method: "stripe",
            })
          );
        } catch {
          // Ignore storage issues
        }

        // Save booking meta for booking-success retrieval
        saveBookingMeta(confirmedId, {
          serviceTitle: `Valet: ${summaryPackages}`,
          serviceCategoryName: "Valet & Detailing",
          serviceType: "valet",
          vehicleModel: carBrandModel.trim() || requestData?.carModel || "Vehicle",
          vehicleReg: requestData?.carReg || paramReg || "MMC",
          providerName: selectedProvider.company_name,
          price: activePackagePrice,
        });

        showToast("Redirecting to Stripe secure checkout...", "info");
        window.location.href = redirectLink;
        return;
      }

      // If we reach here, Stripe checkout URL was not generated - payment is NOT completed!
      const errorMsg =
        bookingRes?.message ||
        (Array.isArray(bookingRes?.errors) && bookingRes.errors[0]?.message) ||
        "Payment checkout could not be initiated. Please ensure your booking details are valid and try again.";
      showToast(errorMsg, "error");
    } catch (err: any) {
      console.error("Booking error:", err);
      showToast(
        err?.response?.data?.message || err?.message || "Failed to initiate payment. Please try again.",
        "error"
      );
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white pb-24 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div
        className="absolute top-0 right-1/4 w-[700px] h-[450px] rounded-full blur-[160px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B, transparent)",
        }}
      />
      <div
        className="absolute top-1/2 left-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #CEA46B, transparent)",
        }}
      />

      {/* ─── Top Header ─── */}
      <header className="border-b border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent pt-4 pb-5 relative z-20">
        <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedProvider ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider(null);
                  setIsBookingSuccess(false);
                }}
                className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10 text-white hover:text-[#FAD293] flex items-center justify-center transition cursor-pointer"
                title="Back to Detailers List"
              >
                <ChevronLeft size={20} />
              </button>
            ) : (
              <Link
                href="/services/valet-wash"
                className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10 text-white hover:text-[#FAD293] flex items-center justify-center transition cursor-pointer"
                title="Back to Questionnaire"
              >
                <ChevronLeft size={20} />
              </Link>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {selectedProvider ? "Schedule & Confirm Booking" : "Choose Detailers."}
              </h1>
              <p className="text-xs text-white/50">
                {selectedProvider
                  ? `Booking with ${selectedProvider.company_name} • Step 3 of 3`
                  : "Select from verified mobile valet professionals matched to your vehicle."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Professionals Available</span>
            </div>

            {selectedProvider && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider(null);
                  setIsBookingSuccess(false);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Switch Provider</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEW (Seamless Page Switch) ─── */}
      {selectedProvider ? (
        /* ========================================================================= */
        /* ─── DEDICATED FULL-SCREEN BOOKING VIEW (No Squeezed Popup!) ─── */
        /* ========================================================================= */
        <main className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] py-8 relative z-10 animate-in fade-in duration-300">
          
          {/* Breadcrumb Steps Header */}
          <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 border-b border-white/8 text-xs font-semibold">
            <Link
              href="/services/valet-wash"
              className="text-white/50 hover:text-white transition flex items-center gap-1.5 shrink-0"
            >
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>1. Request Details</span>
            </Link>
            <span className="text-white/20">/</span>
            <button
              type="button"
              onClick={() => setSelectedProvider(null)}
              className="text-white/50 hover:text-white transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>2. Choose Detailer ({selectedProvider.company_name})</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-[#FAD293] flex items-center gap-1.5 shrink-0 font-bold">
              <Sparkles size={14} className="text-[#FAD293]" />
              <span>3. Schedule, Package & Payment</span>
            </span>
          </div>

          {isBookingSuccess ? (
            /* Success View on Screen */
            <div className="max-w-2xl mx-auto py-12 px-6 rounded-3xl border border-emerald-500/30 bg-[#14100c] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Valet Booking Confirmed!
                </h2>
                <p className="text-sm text-white/60">
                  Your appointment has been registered with {selectedProvider.company_name}.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-left text-sm max-w-md mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-white/50">Booking Reference:</span>
                  <span className="font-mono font-bold text-[#FAD293] text-base">
                    #{confirmedBookingRef}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Detailer:</span>
                  <span className="font-semibold text-white">
                    {selectedProvider.company_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Selected Package:</span>
                  <span className="font-bold text-[#FAD293] capitalize">
                    {currentSelectedPackage.name} (£{activePackagePrice})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Date & Slot:</span>
                  <span className="font-semibold text-white">
                    {bookingDate} • {selectedSlotTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Location:</span>
                  <span className="font-semibold text-white capitalize">
                    {serviceLocationType} Wash
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/account?tab=bookings&bookingId=${confirmedBookingRef}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] text-black font-black text-xs uppercase tracking-wider text-center shadow-lg hover:brightness-110 transition"
                >
                  View in My Bookings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider(null);
                    setIsBookingSuccess(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer transition"
                >
                  Book Another Valet
                </button>
              </div>
            </div>
          ) : (
            /* Dedicated Ultra-Premium Desktop Form */
            <form onSubmit={handleConfirmAndPay} className="space-y-8">
              
              {/* Top Detailer Card Summary Banner */}
              <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] font-black text-xl shrink-0 shadow-inner">
                    {selectedProvider.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white capitalize">
                        {selectedProvider.company_name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FAD293] text-black text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                        <Award size={11} strokeWidth={3} />
                        Verified Specialist
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/60">
                      <div className="flex items-center gap-1 text-white">
                        <Star size={13} className="text-[#FAD293] fill-[#FAD293]" />
                        <span className="font-bold">
                          {(selectedProvider.avg_rating || 5.0).toFixed(1)}
                        </span>
                        <span className="text-white/40">
                          ({selectedProvider.rating_count || 12} reviews)
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-white/40" />
                        <span>{selectedProvider.company_address || "London, UK"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForGallery(selectedProvider)}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye size={13} className="text-[#FAD293]" />
                    <span>View Work Showcase</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Change Detailer</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Luxury Desktop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ══════════════════════════════════════════════════════════ */}
                {/* LEFT COLUMN: Package Selection + Dynamic Slots + Location */}
                {/* ══════════════════════════════════════════════════════════ */}
                <div className="lg:col-span-7 space-y-7">
                  
                  {/* 1. Pick a Wash Package (Grouped with each Service) */}
                  <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#FAD293]/20 border border-[#FAD293]/40 text-[#FAD293] flex items-center justify-center text-xs font-black">
                          1
                        </span>
                        <Sparkles size={15} className="text-[#FAD293]" />
                        <span>Pick Wash Packages</span>
                      </label>
                      <span className="text-xs text-[#FAD293] font-semibold">
                        Select variation for each service
                      </span>
                    </div>

                    <div className="space-y-4">
                      {servicesWithVariations.map((serviceGroup, sIdx) => {
                        const selectedVariantKey =
                          selectedServiceVariations[serviceGroup.serviceId] ||
                          serviceGroup.variations[0]?.key;

                        return (
                          <div
                            key={serviceGroup.serviceId}
                            className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 shadow-md"
                          >
                            {/* Service Header with Badge */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#FAD293] shrink-0 shadow-[0_0_8px_rgba(250,210,147,0.6)]" />
                                <h3 className="text-sm font-extrabold text-white tracking-wide truncate">
                                  {serviceGroup.serviceName}
                                </h3>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/15 px-2.5 py-0.5 rounded-full border border-[#FAD293]/30 shrink-0">
                                Service {sIdx + 1}
                              </span>
                            </div>

                            {/* Variations Options strictly bound to this service */}
                            <div className="space-y-2.5">
                              {serviceGroup.variations.map((pkg) => {
                                const isSelected = selectedVariantKey === pkg.key;

                                return (
                                  <div
                                    key={pkg.key}
                                    onClick={() => handleSelectVariation(serviceGroup.serviceId, pkg.key)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer relative flex items-start gap-3.5 ${
                                      isSelected
                                        ? "border-[#FAD293] bg-[#FAD293]/10 shadow-[0_0_20px_rgba(250,210,147,0.15)] ring-1 ring-[#FAD293]/60"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                                        isSelected
                                          ? "border-[#FAD293] bg-[#FAD293]/20"
                                          : "border-white/40 bg-transparent"
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FAD293]" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4
                                          className={`text-sm font-extrabold capitalize ${
                                            isSelected ? "text-[#FAD293]" : "text-white"
                                          }`}
                                        >
                                          {pkg.name}
                                        </h4>
                                        <span className="text-sm font-black text-[#FAD293] shrink-0">
                                          From £{pkg.price}
                                        </span>
                                      </div>
                                      <p className="text-xs text-white/60 leading-relaxed mt-0.5">
                                        {pkg.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Date and Time with Clean Dynamic Slots */}
                  <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] space-y-5">
                    
                    {/* Header & Date Picker Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#FAD293]/20 border border-[#FAD293]/40 text-[#FAD293] flex items-center justify-center text-xs font-black">
                          2
                        </span>
                        <CalendarDays size={15} className="text-[#FAD293]" />
                        <span>Date and Time</span>
                      </label>

                      {/* Clean Clickable Date Picker Card with Visible Calendar Icon */}
                      <div
                        onClick={() => {
                          if (dateInputRef.current) {
                            try {
                              dateInputRef.current.showPicker();
                            } catch {
                              dateInputRef.current.focus();
                            }
                          }
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#14100c] border border-[#FAD293]/40 hover:border-[#FAD293] transition flex items-center gap-3 cursor-pointer shadow-md group"
                      >
                        <Calendar size={17} className="text-[#FAD293] shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white/70">Date:</span>
                        <input
                          ref={dateInputRef}
                          type="date"
                          min={todayStr}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          required
                          className="bg-transparent text-xs text-white font-black tracking-wide focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[85%] [&::-webkit-calendar-picker-indicator]:sepia-[40%] [&::-webkit-calendar-picker-indicator]:saturate-[600%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[5deg] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:scale-125"
                        />
                      </div>
                    </div>

                    {/* Dynamic Slots Grid strictly from API (Zero Static Data) */}
                    <div className="space-y-3 pt-3 border-t border-white/8">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-white/60 uppercase font-bold tracking-wider">
                          Available slots for <span className="text-white font-black">{selectedDateLabel}</span>
                        </div>
                        {isSlotsLoading && (
                          <div className="flex items-center gap-1.5 text-xs text-[#FAD293]">
                            <Loader2 size={13} className="animate-spin" />
                            <span>Fetching live slots from API...</span>
                          </div>
                        )}
                      </div>

                      {isSlotsLoading ? (
                        <div className="grid grid-cols-2 gap-3 py-2">
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className="h-12 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse"
                            />
                          ))}
                        </div>
                      ) : providerSlots.length === 0 ? (
                        /* ZERO STATIC SLOTS - If API has no slots, show this informative state! */
                        <div className="py-7 px-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                            <Clock size={18} />
                          </div>
                          <div className="text-xs font-bold text-amber-400">
                            No slots available for {selectedDateLabel}
                          </div>
                          <p className="text-[11px] text-white/50 max-w-sm mx-auto">
                            The provider has no open slots on this date. Please pick a different date from the calendar.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {providerSlots.map((slot) => {
                            const isSelected = selectedSlotId === slot.id || selectedSlotTitle === slot.title;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSlotId(slot.id);
                                  setSelectedSlotTitle(slot.title);
                                  if (slot.start_time) setBookingTime(slot.start_time);
                                }}
                                className={`py-3.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                                  isSelected
                                    ? "bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] text-black border-transparent shadow-[0_0_20px_rgba(250,210,147,0.3)] font-black"
                                    : "border-white/10 bg-white/[0.02] text-white/80 hover:border-white/25 hover:bg-white/[0.04]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className={isSelected ? "text-black" : "text-[#FAD293]"} />
                                  <span className="truncate">{slot.title}</span>
                                </div>
                                {isSelected && (
                                  <Check size={14} strokeWidth={3} className="shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Service Location Selection */}
                  <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#FAD293]/20 border border-[#FAD293]/40 text-[#FAD293] flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <MapPin size={15} className="text-[#FAD293]" />
                      <span>Service Location</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setServiceLocationType("mobile")}
                        className={`py-4 px-5 rounded-2xl border text-xs font-bold transition flex flex-col gap-1 cursor-pointer text-left ${
                          serviceLocationType === "mobile"
                            ? "bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black border-transparent shadow-[0_0_20px_rgba(250,210,147,0.25)] font-black"
                            : "border-white/15 bg-white/[0.02] text-white/70 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm font-extrabold">Mobile Wash</span>
                        </div>
                        <p className={`text-[11px] ${serviceLocationType === "mobile" ? "text-black/80" : "text-white/40"}`}>
                          The detailer travels with van, water & power to your address.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setServiceLocationType("workshop")}
                        className={`py-4 px-5 rounded-2xl border text-xs font-bold transition flex flex-col gap-1 cursor-pointer text-left ${
                          serviceLocationType === "workshop"
                            ? "bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black border-transparent shadow-[0_0_20px_rgba(250,210,147,0.25)] font-black"
                            : "border-white/15 bg-white/[0.02] text-white/70 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Warehouse size={16} />
                          <span className="text-sm font-extrabold">Workshop</span>
                        </div>
                        <p className={`text-[11px] ${serviceLocationType === "workshop" ? "text-black/80" : "text-white/40"}`}>
                          Drop your vehicle off at {selectedProvider.company_name}&apos;s facility.
                        </p>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/60 flex items-center gap-2">
                      <MapPin size={14} className="text-[#FAD293] shrink-0" />
                      <span className="truncate">
                        {serviceLocationType === "mobile"
                          ? `Service Address: ${requestData?.locationAddress || paramLocation || "Your registered address"}`
                          : `Workshop Address: ${selectedProvider.company_address || "London Specialist Facility"}`}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* RIGHT COLUMN: Vehicle Info + Notes + Dynamic Stripe Card */}
                {/* ══════════════════════════════════════════════════════════ */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                  
                  {/* Vehicle Info Card */}
                  <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                        <Car size={15} className="text-[#FAD293]" />
                        <span>Vehicle Info</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono font-bold text-xs text-[#FAD293]">
                        {requestData?.carReg || paramReg || "MH-12-AB-1234"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-white/50 uppercase font-semibold">
                          Car Brand/Model
                        </label>
                        <input
                          type="text"
                          value={carBrandModel}
                          onChange={(e) => setCarBrandModel(e.target.value)}
                          placeholder='e.g. Buggati Buggati Chiron or Mercedes C-Class'
                          className="w-full h-11 px-3.5 mt-1 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-white/50 uppercase font-semibold">
                          Color (Optional)
                        </label>
                        <input
                          type="text"
                          value={carColor}
                          onChange={(e) => setCarColor(e.target.value)}
                          placeholder='Eg "Black" or "Silver"'
                          className="w-full h-11 px-3.5 mt-1 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition"
                        />
                      </div>
                    </div>

                    {/* Special Conditions */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold flex items-center gap-1.5">
                        <FileText size={12} className="text-[#FAD293]" />
                        <span>Special Conditions</span>
                      </label>
                      <textarea
                        rows={2}
                        value={specialConditionsText}
                        onChange={(e) => setSpecialConditionsText(e.target.value)}
                        placeholder="Over 3 months ago, Heavy dirt, General dirt, Stains, Machine polish..."
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition resize-none"
                      />
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">
                        Additional Notes / Gate Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Gate code is 9876. Focus on wheels and interior leather."
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FAD293] transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Dynamic Stripe Card Payment Card */}
                  <div className="p-6 rounded-3xl border border-[#FAD293]/40 bg-gradient-to-b from-[#FAD293]/10 to-[#FAD293]/5 space-y-5 shadow-2xl relative">
                    <div className="flex items-center justify-between pb-3 border-b border-[#FAD293]/20">
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-[#FAD293]" />
                        <span className="text-sm font-black text-white">Stripe Card Payment</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Lock size={12} /> SSL Secure
                      </span>
                    </div>

                    {/* Package Pricing Breakdown (Dynamic per service & variation) */}
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 text-xs">
                      <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                        Selected Packages Breakdown
                      </div>
                      <div className="space-y-1.5 border-b border-white/10 pb-2.5">
                        {servicesWithVariations.map((srv) => {
                          const selKey =
                            selectedServiceVariations[srv.serviceId] ||
                            srv.variations[0]?.key;
                          const match =
                            srv.variations.find((v) => v.key === selKey) ||
                            srv.variations[0];
                          return (
                            <div
                              key={srv.serviceId}
                              className="flex justify-between items-center text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-white/80 font-bold truncate block">
                                  {srv.serviceName}
                                </span>
                                <span className="text-[11px] text-[#FAD293] capitalize">
                                  {match?.name || "Standard"}
                                </span>
                              </div>
                              <span className="font-extrabold text-white shrink-0">
                                £{Number(match?.price || 0).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-white/60 font-semibold">Total Price:</span>
                        <span className="font-black text-[#FAD293] text-sm">
                          £{activePackagePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Deposit vs Full Payment Option */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPartialPayment(true)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isPartialPayment
                            ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] shadow-md ring-1 ring-[#FAD293]/60"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                        }`}
                      >
                        <div className="text-xs font-black">25% Deposit Now</div>
                        <div className="text-[11px] text-white/50 mt-0.5">£{depositAmount} today</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPartialPayment(false)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          !isPartialPayment
                            ? "border-[#FAD293] bg-[#FAD293]/20 text-[#FAD293] shadow-md ring-1 ring-[#FAD293]/60"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                        }`}
                      >
                        <div className="text-xs font-black">Full Payment</div>
                        <div className="text-[11px] text-white/50 mt-0.5">£{activePackagePrice.toFixed(2)} now</div>
                      </button>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                      {isPartialPayment && (
                        <div className="flex justify-between text-white/50">
                          <span>Balance on completion:</span>
                          <span className="font-semibold text-white">£{remainingAmount}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="font-bold text-white">Payable Today:</span>
                        <span className="text-xl font-black text-[#FAD293]">
                          £{payableAmount}
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      type="submit"
                      disabled={isBookingSubmitting || providerSlots.length === 0 || !selectedSlotId}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(250,210,147,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isBookingSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing & Launching Stripe...</span>
                        </>
                      ) : providerSlots.length === 0 || !selectedSlotId ? (
                        <>
                          <Clock size={15} />
                          <span>No Slot Available (Pick Another Date)</span>
                        </>
                      ) : (
                        <>
                          <Lock size={15} />
                          <span>Pay £{payableAmount} & Book via Stripe</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <div className="text-center text-[10px] text-white/40">
                      Guaranteed booking • 100% Secure via Stripe Payments
                    </div>
                  </div>

                </div>

              </div>

            </form>
          )}

        </main>
      ) : (
        /* ========================================================================= */
        /* ─── PROVIDERS LIST VIEW (Screen 2: Choose Detailers) ─── */
        /* ========================================================================= */
        <main className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px] py-8 relative z-10">
          
          {/* Top Banner: Selected Service & Request Summary */}
          <div className="mb-8 p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] shrink-0">
                <Car size={28} />
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FAD293]">
                  SELECTED SERVICE
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white capitalize">
                  {combinedServicesTitle}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 pt-1">
                  {requestData?.carReg && (
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-[#FAD293]">
                      {requestData.carReg}
                    </span>
                  )}
                  {requestData?.locationAddress && (
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <MapPin size={12} className="text-[#FAD293] shrink-0" />
                      <span className="truncate">{requestData.locationAddress}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/services/valet-wash"
              className="px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5 hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10 text-white/80 hover:text-[#FAD293] text-xs font-semibold flex items-center justify-center gap-2 transition self-start md:self-auto cursor-pointer"
            >
              <Pencil size={13} />
              <span>Edit Details</span>
            </Link>
          </div>

          {/* Subheader: Provider Count & Sort/Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{filteredProviders.length} providers available</span>
              {loading && <Loader2 size={16} className="animate-spin text-[#FAD293]" />}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setOnlyNearby(!onlyNearby)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  onlyNearby
                    ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                }`}
              >
                <Navigation size={12} />
                <span>Nearby</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-white/70">
                <Filter size={12} className="text-[#FAD293]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="best" className="bg-[#120e0b]">Best Match</option>
                  <option value="price_low" className="bg-[#120e0b]">Price: Low to High</option>
                  <option value="price_high" className="bg-[#120e0b]">Price: High to Low</option>
                  <option value="rating" className="bg-[#120e0b]">Highest Rated</option>
                  <option value="distance" className="bg-[#120e0b]">Distance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Providers Grid matching Screenshot 2 */}
          {loading ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 size={36} className="animate-spin text-[#FAD293] mx-auto" />
              <p className="text-sm text-white/60">Searching verified detailers near you...</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-base text-white/70 font-semibold">
                No detailers match your current filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOnlyNearby(false);
                  setSortBy("best");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-6">
              {filteredProviders.map((provider, idx) => {
                const lowPrice = getProviderLowestPrice(provider);
                const ratingVal = provider.avg_rating || 0;
                const reviewsVal = provider.rating_count || 0;
                const distanceMiles = provider.distance_miles || provider.distance || "4.5";

                return (
                  <div
                    key={provider.id}
                    className="p-6 rounded-3xl border border-white/10 bg-[#14100c]/80 hover:border-[#FAD293]/40 hover:bg-[#18130e] transition-all duration-300 shadow-xl flex flex-col justify-between gap-5 group"
                  >
                    <div className="space-y-4">
                      {/* Provider Header: Logo + Name + Best Value Badge */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-black border border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative shadow-md">
                          {provider.logo_full_path || provider.logo ? (
                            <Image
                              src={provider.logo_full_path || provider.logo || ""}
                              alt={provider.company_name}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-base font-black text-[#FAD293]">
                              {provider.company_name.slice(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-black text-white truncate capitalize group-hover:text-[#FAD293] transition-colors">
                              {provider.company_name}
                            </h3>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FAD293] text-black text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                                <Award size={11} strokeWidth={3} />
                                Best Value
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1.5 text-xs text-white/70">
                            <Star size={13} className="text-[#FAD293] fill-[#FAD293]" />
                            <span className="font-bold text-white">
                              {ratingVal.toFixed(1)}
                            </span>
                            <span className="text-white/40">({reviewsVal} Reviews)</span>
                          </div>

                          {/* Address & My Work */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <div className="flex items-center gap-1 text-[11px] text-white/60 truncate max-w-[200px]">
                              <MapPin size={12} className="shrink-0 text-white/40" />
                              <span className="truncate">
                                {provider.company_address || "London, United Kingdom"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedProviderForGallery(provider)}
                              className="px-2.5 py-1 rounded-xl border border-white/15 bg-white/5 hover:border-[#FAD293]/40 hover:bg-[#FAD293]/10 text-white/80 hover:text-[#FAD293] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>My work</span>
                              <Eye size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-3 py-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/70 flex items-center gap-1.5">
                          <Navigation size={12} className="text-[#FAD293]" />
                          <span>{distanceMiles} Miles</span>
                        </span>

                        <span className="px-3 py-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/70 flex items-center gap-1.5">
                          <Smartphone size={12} className="text-[#FAD293]" />
                          <span>Mobile & Workshop</span>
                        </span>

                        <span className="px-3 py-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1.5">
                          <Zap size={12} />
                          <span>Self-Powered</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Price (Showing Lowest Price!) & Book Now Button */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] text-white/50 uppercase font-semibold">
                          Starting from
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-white">
                          £{lowPrice}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectProviderForBooking(provider)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FAD293] via-[#CEA46B] to-[#FAD293] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(250,210,147,0.25)] flex items-center gap-2 group/btn cursor-pointer"
                      >
                        <span>Book Now</span>
                        <ArrowRight
                          size={15}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ─── Provider Gallery / My Work Modal ─── */}
      {selectedProviderForGallery && (
        <ServiceOurWorkShowcase
          providerId={selectedProviderForGallery.id}
          providerName={selectedProviderForGallery.company_name}
          onClose={() => setSelectedProviderForGallery(null)}
        />
      )}
    </div>
  );
}

export default function ChooseDetailersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#FAD293]" />
        </div>
      }
    >
      <ChooseDetailersContent />
    </Suspense>
  );
}
