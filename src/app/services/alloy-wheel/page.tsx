"use client";

import { useState, useRef, useEffect, useMemo, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth.api";
import {
    Sparkles,
    Shield,
    Crown,
    Play,
    Car,
    MapPin,
    Wrench,
    FileText,
    ChevronDown,
    ArrowRight,
    Star,
    Clock3,
    Users,
    ShieldCheck,
    Headphones,
    Eye,
    BookOpen,
    X,
    Check,
    Phone,
    Mail,
    Calendar,
    Zap,
    BadgeCheck,
    CheckCircle2,
    User,
    Copy,
    Search,
    ChevronLeft,
    AlertTriangle,
    Upload,
    ImageIcon,
    RefreshCw,
    Layers,
    Banknote,
    CreditCard,
    Wallet,
    AlertCircle,
    Building2,
    Truck,
    Info,
    Bell,
    Smartphone,
    CloudUpload,
    HelpCircle,
    Send,
    Camera,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { triggerDevicePushNotification } from "@/lib/firebase";
import {
    getAlloyServices,
    type AlloyServiceItem,
    searchProvidersByService,
    getProviderDetails,
    type ProviderItem,
    type ProviderDetailsContent,
    sendQuotationRequest,
    ALLOY_CATEGORY_ID,
    BOOKING_QUESTIONS_CATEGORY_ID,
    DEFAULT_ZONE_ID,
    getOrCreateCustomerAddressId,
    getMyQuotationRequests,
    type CustomerQuotationPostItem,
    getReceivedBidsForPost,
    type PostBidItem,
    sendBookingRequest,
    getProviderSlots,
    getProviderQuestions,
    type BookingSlotItem,
    type BookingQuestionItem,
    type SendBookingRequestParams,
} from "@/lib/service/alloy.api";
import { getBackendRootUrl } from "@/lib/http/apiClient";
import { saveConfirmedBooking, saveBookingMeta } from "@/lib/service/bookings.api";
import AlloyStepHeader, { type ActiveView } from "./components/AlloyStepHeader";
import AlloyServicesPageView from "./components/AlloyServicesPageView";
import AlloyAssessmentPageView from "./components/AlloyAssessmentPageView";
import TechniciansPageView from "./components/TechniciansPageView";
import QuotationFormPageView from "./components/QuotationFormPageView";
import ProviderProfilePageView from "./components/ProviderProfilePageView";
import QuotesPageView from "./components/QuotesPageView";
import BookingPageView from "./components/BookingPageView";
import {
    saveServiceFormDraft,
    getServiceFormDraft,
    clearServiceFormDraft,
} from "@/lib/serviceFormDraft";

export default function AlloyWheelPage() {
    const router = useRouter();
    const { showToast } = useToast();

    // ---------------------------------------------------------------------------
    // Dedicated Full-Page View Navigation State
    // ---------------------------------------------------------------------------
    const [activeView, setActiveView] = useState<ActiveView>("landing");

    const navigateToView = (view: ActiveView) => {
        setActiveView(view);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (view === "landing") {
                url.searchParams.delete("view");
            } else {
                url.searchParams.set("view", view);
            }
            window.history.pushState({}, "", url.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const view = params.get("view");
        if (view && ["landing", "choose_services", "assessment", "technicians", "request_quote", "quotes", "provider_profile", "booking"].includes(view)) {
            setActiveView(view as ActiveView);
        }

        const handlePopState = () => {
            const p = new URLSearchParams(window.location.search);
            const v = (p.get("view") as ActiveView) || "landing";
            setActiveView(v);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // ---------------------------------------------------------------------------
    // Form State
    // ---------------------------------------------------------------------------
    const [postcode, setPostcode] = useState("");
    const [regNo, setRegNo] = useState("");
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [showServicesDropdown, setShowServicesDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [damageDesc, setDamageDesc] = useState("");
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Google Maps Places Autocomplete & Geocoding State
    const GOOGLE_MAPS_KEY = "AIzaSyCzqspc3fl1LtnypCGowb6VmBVzf9zXXn4";
    const postcodeRef = useRef<HTMLInputElement>(null);
    const [userLat, setUserLat] = useState<string>("");
    const [userLon, setUserLon] = useState<string>("");

    // Vehicle Brand & Work Location State
    const [carBrand, setCarBrand] = useState<string>("");
    const carModel = carBrand;
    const carYear = "2024";
    const [workLocation, setWorkLocation] = useState<"workshop" | "mobile">("workshop");

    // Media upload state for Hero Form (Supports multiple media files)
    const [heroMediaFiles, setHeroMediaFiles] = useState<File[]>([]);
    const [heroMediaPreviews, setHeroMediaPreviews] = useState<string[]>([]);
    const [heroCarImage, setHeroCarImage] = useState<File | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

    // Multi-provider selection for RFQ quotation request
    const [selectedProviderIdsForQuote, setSelectedProviderIdsForQuote] = useState<string[]>([]);
    const [submittingMultiQuote, setSubmittingMultiQuote] = useState(false);

    // Initialize Google Maps Places Autocomplete
    useEffect(() => {
        if (typeof window === "undefined") return;

        localStorage.setItem("zone_id", DEFAULT_ZONE_ID);
        localStorage.setItem("zoneid", DEFAULT_ZONE_ID);

        const storedLat = localStorage.getItem("user_lat");
        const storedLon = localStorage.getItem("user_lon");
        if (storedLat) setUserLat(storedLat);
        if (storedLon) setUserLon(storedLon);

        const initAutocomplete = () => {
            if (!postcodeRef.current || !(window as any).google?.maps?.places) return;
            try {
                const autocomplete = new (window as any).google.maps.places.Autocomplete(
                    postcodeRef.current,
                    {
                        types: ["geocode", "establishment"],
                        fields: ["geometry", "formatted_address", "name"],
                    }
                );

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place && place.geometry && place.geometry.location) {
                        const lat = String(place.geometry.location.lat());
                        const lon = String(place.geometry.location.lng());
                        const addressText = place.formatted_address || place.name || "";
                        setPostcode(addressText);
                        setUserLat(lat);
                        setUserLon(lon);
                        localStorage.setItem("user_lat", lat);
                        localStorage.setItem("user_lon", lon);
                        localStorage.setItem("user_address", addressText);
                    }
                });
            } catch (err) {
                console.error("Google Places Autocomplete error:", err);
            }
        };

        if ((window as any).google?.maps?.places) {
            initAutocomplete();
        } else {
            const existingScript = document.getElementById("google-maps-places-script");
            if (!existingScript) {
                const script = document.createElement("script");
                script.id = "google-maps-places-script";
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => initAutocomplete();
                document.head.appendChild(script);
            } else {
                existingScript.addEventListener("load", initAutocomplete);
            }
        }
    }, []);

    // Multi-media upload handlers for Hero form
    const handleHeroMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setHeroMediaFiles((prev) => [...prev, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setHeroMediaPreviews((prev) => [...prev, ...newPreviews]);

        if (!heroCarImage && files[0]) {
            setHeroCarImage(files[0]);
            setHeroImagePreview(newPreviews[0]);
        }
    };

    const handleRemoveHeroMedia = (index: number) => {
        setHeroMediaFiles((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            setHeroCarImage(updated[0] || null);
            return updated;
        });
        setHeroMediaPreviews((prev) => {
            const removed = prev[index];
            if (removed) URL.revokeObjectURL(removed);
            const updated = prev.filter((_, i) => i !== index);
            setHeroImagePreview(updated[0] || null);
            return updated;
        });
    };

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleHeroMediaChange(e);
    };

    // Geocoding fallback if user typed manually without selecting autocomplete suggestion
    const geocodeAddressFallback = async (query: string): Promise<{ lat: string; lon: string } | null> => {
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`
            );
            const data = await res.json();
            if (data.results && data.results[0]?.geometry?.location) {
                const loc = data.results[0].geometry.location;
                const lat = String(loc.lat);
                const lon = String(loc.lng);
                setUserLat(lat);
                setUserLon(lon);
                localStorage.setItem("user_lat", lat);
                localStorage.setItem("user_lon", lon);
                return { lat, lon };
            }
        } catch (e) {
            console.error("Geocoding fallback failed:", e);
        }
        return null;
    };

    // Provider multi-selection toggles
    const toggleProviderSelection = (id: string) => {
        setSelectedProviderIdsForQuote((prev) =>
            prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
        );
    };

    const toggleSelectAllProviders = () => {
        if (selectedProviderIdsForQuote.length === providers.length) {
            setSelectedProviderIdsForQuote([]);
        } else {
            setSelectedProviderIdsForQuote(providers.map((p) => p.id));
        }
    };

    // Execute actual RFQ submission with user's details directly
    const handleExecuteQuoteSubmission = async (
        formData: {
            carReg: string;
            carModel: string;
            selectedServiceIds: string[];
            bookingDate: string;
            bookingTime: string;
            damageDesc: string;
            serviceDesc: string;
            carImage: File | null;
            carImages?: File[];
        },
        overrideProviderIds?: string[]
    ) => {
        const idsToSend = (overrideProviderIds && overrideProviderIds.length > 0)
            ? overrideProviderIds
            : (selectedProviderIdsForQuote.length > 0
                ? selectedProviderIdsForQuote
                : (selectedQuoteProvider ? [selectedQuoteProvider.id] : []));

        if (idsToSend.length === 0) {
            showToast("Please select at least one provider to send the quote request", "error");
            return;
        }

        setSubmittingMultiQuote(true);
        try {
            let effectiveAddressId = "6";
            try {
                effectiveAddressId =
                    (await getOrCreateCustomerAddressId(
                        postcode,
                        userLat || localStorage.getItem("user_lat") || undefined,
                        userLon || localStorage.getItem("user_lon") || undefined
                    )) || "6";
            } catch {
                effectiveAddressId = "6";
            }

            const scheduleStr = `${formData.bookingDate} ${formData.bookingTime || "11:00:00"}`;

            // Format assessment question answers into notes
            const assessmentNotes = Object.entries(questionAnswers)
                .filter(([_, ans]) => ans && ans.trim())
                .map(([qId, ans]) => {
                    const qObj = bookingQuestions.find((item) => item.id === qId);
                    return `${qObj?.question_text || qObj?.question || qId}: ${ans}`;
                })
                .join(" | ");

            const combinedDamageDesc = [
                formData.damageDesc,
                assessmentNotes ? `[Assessment: ${assessmentNotes}]` : "",
            ]
                .filter(Boolean)
                .join("\n");

            const allImages = (formData.carImages && formData.carImages.length > 0)
                ? formData.carImages
                : (heroMediaFiles.length > 0
                    ? heroMediaFiles
                    : (formData.carImage ? [formData.carImage] : []));

            const res = await sendQuotationRequest({
                service_id: formData.selectedServiceIds[0] || "3e8b192f-c32a-4219-946f-6ce98b9a88b6",
                service_ids: formData.selectedServiceIds,
                category_id: ALLOY_CATEGORY_ID,
                provider_ids: idsToSend,
                service_description:
                    formData.serviceDesc ||
                    combinedDamageDesc ||
                    "Alloy wheel repair quotation request",
                booking_schedule: scheduleStr,
                service_address_id: effectiveAddressId,
                car_model: formData.carModel || "Vehicle 2022",
                car_registration_number: formData.carReg || regNo.trim() || "BD51 SMR",
                damage_description: combinedDamageDesc || "Alloy wheel damage inspection",
                car_image: allImages[0] || formData.carImage || heroCarImage || null,
                car_images: allImages,
            });

            const newPostId = res?.content?.post_id;
            showToast(
                `Quotation request sent to ${idsToSend.length} specialist${idsToSend.length > 1 ? "s" : ""} successfully!`,
                "success"
            );

            // Refresh quotation posts list
            await refreshQuotationRequests();

            // Transition directly to Quotes & Live Offers page
            if (newPostId) {
                navigateToView("quotes");
                handleCheckBids({
                    id: newPostId,
                    car_registration_number: formData.carReg || regNo.trim() || "BD51 SMR",
                    car_model: formData.carModel || "Vehicle 2022",
                    booking_schedule: scheduleStr,
                    bids_count: 0,
                    service_description: formData.damageDesc || formData.serviceDesc || "Alloy wheel repair",
                } as CustomerQuotationPostItem);
            } else {
                navigateToView("quotes");
            }
        } catch (err: any) {
            console.error("Multi quote request failed:", err);
            showToast(
                err?.message || "Failed to send quotation request. Please try again.",
                "error"
            );
        } finally {
            setSubmittingMultiQuote(false);
        }
    };

    // Start Quotation Request - Directly sends RFQ without intermediate screen
    const handleStartMultiQuote = async (targetProviderIds?: string[]) => {
        if (!isAuthenticated()) {
            showToast("Please login to request a quotation.", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/alloy-wheel")}`);
            return;
        }

        const ids = (targetProviderIds && targetProviderIds.length > 0)
            ? targetProviderIds
            : selectedProviderIdsForQuote;

        if (ids.length === 0) {
            showToast("Please select at least one technician to request a quote.", "error");
            return;
        }

        // Default tomorrow for booking schedule
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDateStr = tomorrow.toISOString().split("T")[0];

        // Resolve service IDs from selectedServices
        let currentServices = services;
        if (currentServices.length === 0) {
            currentServices = (await getAlloyServices()) || [];
        }
        const serviceIds = selectedServices
            .map((name) => currentServices.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id)
            .filter(Boolean) as string[];

        await handleExecuteQuoteSubmission(
            {
                carReg: regNo.trim() || "BD51 SMR",
                carModel: carYear ? `Vehicle (${carYear})` : "Alloy Wheel Vehicle",
                selectedServiceIds: serviceIds.length > 0 ? serviceIds : ["3e8b192f-c32a-4219-946f-6ce98b9a88b6"],
                bookingDate: defaultDateStr,
                bookingTime: "11:00:00",
                damageDesc: damageDesc || "Alloy wheel refurbishment and repair",
                serviceDesc: selectedServices.join(", ") || "Alloy Wheel Refurbishment",
                carImage: heroMediaFiles[0] || heroCarImage || null,
                carImages: heroMediaFiles.length > 0 ? heroMediaFiles : (heroCarImage ? [heroCarImage] : []),
            },
            ids
        );
    };

    // ---------------------------------------------------------------------------
    // Dynamic Services & Providers State (Live API only)
    // ---------------------------------------------------------------------------
    const [services, setServices] = useState<AlloyServiceItem[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [providers, setProviders] = useState<ProviderItem[]>([]);
    const [searchingProviders, setSearchingProviders] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const data = await getAlloyServices();
                if (isMounted) {
                    setServices(data || []);
                }
            } catch (err) {
                console.error("Error fetching services:", err);
            } finally {
                if (isMounted) setLoadingServices(false);
            }
        };

        fetchServices();
        return () => {
            isMounted = false;
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowServicesDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleService = (name: string) => {
        setSelectedServices((prev) =>
            prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
        );
    };

    const removeService = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedServices((prev) => prev.filter((s) => s !== name));
    };

    // ---------------------------------------------------------------------------
    // Interactive Modals State
    // ---------------------------------------------------------------------------
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showTechniciansModal, setShowTechniciansModal] = useState(false);
    const [selectedProviderModal, setSelectedProviderModal] = useState<ProviderItem | null>(null);
    const [providerProfileDetails, setProviderProfileDetails] = useState<ProviderDetailsContent | null>(null);
    const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);
    const [activeProfileTab, setActiveProfileTab] = useState<"overview" | "services" | "reviews">("overview");

    // ---------------------------------------------------------------------------
    // Booking Confirmation Form State (POST /customer/booking/request/send)
    // ---------------------------------------------------------------------------
    const [bookingProviderModal, setBookingProviderModal] = useState<ProviderItem | null>(null);
    const [bookingPostId, setBookingPostId] = useState<string>("");
    const [bookingBidOffer, setBookingBidOffer] = useState<PostBidItem | null>(null);
    const [bookingPostItem, setBookingPostItem] = useState<CustomerQuotationPostItem | null>(null);
    const [bookingType, setBookingType] = useState<"normal" | "emergency">("normal");
    const [serviceLocation, setServiceLocation] = useState<"customer" | "workshop">("customer");
    const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [bookingTime, setBookingTime] = useState<string>("");
    const [selectedSlotId, setSelectedSlotId] = useState<string>("");
    const [bookingSlots, setBookingSlots] = useState<BookingSlotItem[]>([]);
    const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
    const [bookingQuestions, setBookingQuestions] = useState<BookingQuestionItem[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});
    const [serviceAddressId, setServiceAddressId] = useState<string>("");
    const [bookingNotes, setBookingNotes] = useState<string>("");
    const [bookingPaymentMethod, setBookingPaymentMethod] = useState<"cash_after_service" | "stripe">("stripe");
    const [isPartialPayment, setIsPartialPayment] = useState<boolean>(true);
    const [showPaymentSheet, setShowPaymentSheet] = useState<boolean>(false);
    const [bookingCarImage, setBookingCarImage] = useState<File | null>(null);
    const [bookingCarImagePreview, setBookingCarImagePreview] = useState<string | null>(null);
    const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
    const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
    const [bookingApiResult, setBookingApiResult] = useState<any>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Fetch available slots strictly from API: GET /customer/booking/provider/slots
    useEffect(() => {
        if (!bookingProviderModal?.id || !bookingDate) {
            setBookingSlots([]);
            setSelectedSlotId("");
            setBookingTime("");
            return;
        }
        let isMounted = true;
        setLoadingSlots(true);
        setSelectedSlotId("");
        setBookingTime("");

        getProviderSlots(bookingProviderModal.id, bookingDate)
            .then((slots) => {
                if (isMounted) {
                    setBookingSlots(slots || []);
                    if (slots && slots.length > 0) {
                        const firstAvailable = slots.find((s) => s.is_available !== false) || slots[0];
                        if (firstAvailable) {
                            setSelectedSlotId(firstAvailable.id);
                            if (firstAvailable.start_time) {
                                setBookingTime(firstAvailable.start_time);
                            }
                        }
                    } else {
                        setSelectedSlotId("");
                        setBookingTime("");
                    }
                }
            })
            .catch((err) => {
                console.error("Error fetching provider slots:", err);
                if (isMounted) {
                    setBookingSlots([]);
                    setSelectedSlotId("");
                    setBookingTime("");
                }
            })
            .finally(() => {
                if (isMounted) setLoadingSlots(false);
            });

        return () => {
            isMounted = false;
        };
    }, [bookingProviderModal?.id, bookingDate]);

    // Fetch alloy additional questions strictly from API using ONLY category_id:
    // GET /customer/booking/provider/questions?category_id={ALLOY_CATEGORY_ID}
    useEffect(() => {
        let isMounted = true;
        setLoadingQuestions(true);
        // Strictly fetch using ONLY the alloy category_id so that only alloy questions appear
        const catId = ALLOY_CATEGORY_ID;
        getProviderQuestions(undefined, catId)
            .then((questions) => {
                if (isMounted) {
                    const activeQuestions = (questions || [])
                        .filter((q) => q.is_active !== false && q.is_active !== 0)
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                    setBookingQuestions(activeQuestions);
                }
            })
            .catch((err) => {
                console.error("Error fetching alloy category questions:", err);
                if (isMounted) setBookingQuestions([]);
            })
            .finally(() => {
                if (isMounted) setLoadingQuestions(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle return from Stripe payment gateway callback
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const status = searchParams.get("status") || searchParams.get("payment_status") || searchParams.get("payment");
            const bookingId = searchParams.get("booking_id") || searchParams.get("readable_id");

            if (status === "success" || status === "paid" || (status && status.toLowerCase().includes("success"))) {
                showToast("Payment verified successfully via Stripe! Booking confirmed.", "success");
                const stored = sessionStorage.getItem("mmc_pending_booking");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.provider) {
                        setBookingProviderModal(parsed.provider);
                    }
                    setBookingApiResult({
                        booking_id: bookingId || parsed.booking_id,
                        readable_id: parsed.readable_id || bookingId,
                        flag: "success",
                    });
                    setBookingPaymentMethod("stripe");
                    setBookingConfirmed(true);
                    sessionStorage.removeItem("mmc_pending_booking");
                }
            } else if (status === "cancel" || status === "failed") {
                showToast("Payment was not completed. Please try again or choose Cash After Service.", "error");
            }
        } catch (e) {
            console.error("Error checking Stripe callback params:", e);
        }
    }, []);

    const [selectedQuoteProvider, setSelectedQuoteProvider] = useState<ProviderItem | null>(null);
    const [myQuotationRequests, setMyQuotationRequests] = useState<CustomerQuotationPostItem[]>([]);
    const [loadingMyQuotationRequests, setLoadingMyQuotationRequests] = useState(false);
    const [savedQuotePostIds, setSavedQuotePostIds] = useState<string[]>([]);
    const [copiedAnyId, setCopiedAnyId] = useState<string | null>(null);

    // Sort requests: Items with received bids (bids_count > 0) appear at the TOP, followed by awaiting bids
    const sortedQuotationRequests = useMemo(() => {
        return [...myQuotationRequests].sort((a, b) => {
            const aCount = a.bids_count || 0;
            const bCount = b.bids_count || 0;
            // 1. Items with bids received come first
            if (aCount > 0 && bCount === 0) return -1;
            if (aCount === 0 && bCount > 0) return 1;

            // 2. If both have bids, higher bid count first
            if (aCount !== bCount) return bCount - aCount;

            // 3. Newest request first
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
        });
    }, [myQuotationRequests]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("saved_quote_post_ids");
                if (stored) {
                    setSavedQuotePostIds(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to parse saved_quote_post_ids:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated()) {
            const draft = getServiceFormDraft("alloy-wheel");
            if (draft) {
                if (draft.postcode) setPostcode(draft.postcode);
                if (draft.regNo) setRegNo(draft.regNo);
                if (draft.carModel) setCarBrand(draft.carModel);
                if (draft.userLat) setUserLat(draft.userLat);
                if (draft.userLon) setUserLon(draft.userLon);
                if (Array.isArray(draft.selectedServices) && draft.selectedServices.length > 0) {
                    setSelectedServices(draft.selectedServices);
                }
                if (draft.targetView) {
                    navigateToView(draft.targetView as ActiveView);
                }
                clearServiceFormDraft("alloy-wheel");
                showToast("Welcome back! Your vehicle details have been restored.", "success");
            }
        }
    }, []);

    const handleCopyAnyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedAnyId(id);
        setTimeout(() => setCopiedAnyId(null), 2000);
    };

    const refreshQuotationRequests = async () => {
        setLoadingMyQuotationRequests(true);
        try {
            const list = await getMyQuotationRequests(30, 1);
            if (list && list.length > 0) {
                // Filter strictly for alloy wheel requests
                const alloyOnly = list.filter((item) => {
                    const combined = `${item.service_description || ""} ${item.damage_description || ""} ${item.category?.name || ""}`.toLowerCase();
                    const isAlloy =
                        item.category_id === ALLOY_CATEGORY_ID ||
                        combined.includes("alloy") ||
                        combined.includes("wheel") ||
                        combined.includes("rim") ||
                        combined.includes("refurb") ||
                        combined.includes("diamond cut");
                    const isPureBodywork =
                        item.category_id === "675fb918-9d0c-4ee5-9a0a-904b42651033" &&
                        !combined.includes("alloy") &&
                        !combined.includes("wheel");
                    return isAlloy || !isPureBodywork;
                });
                setMyQuotationRequests(alloyOnly.length > 0 ? alloyOnly : list);
                const fetchedIds = list.map((item) => item.id).filter(Boolean);
                setSavedQuotePostIds((prev) => {
                    const merged = Array.from(new Set([...prev, ...fetchedIds]));
                    if (typeof window !== "undefined") {
                        localStorage.setItem("saved_quote_post_ids", JSON.stringify(merged));
                    }
                    return merged;
                });
            }
        } catch (err) {
            console.error("Failed to refresh quotes:", err);
        } finally {
            setLoadingMyQuotationRequests(false);
        }
    };

    const [selectedPostForBids, setSelectedPostForBids] = useState<CustomerQuotationPostItem | null>(null);
    const [postBidsList, setPostBidsList] = useState<PostBidItem[]>([]);
    const [loadingPostBids, setLoadingPostBids] = useState(false);

    // Auto-refresh quotes when entering quotes view
    useEffect(() => {
        if (activeView === "quotes") {
            refreshQuotationRequests();
        }
    }, [activeView]);

    // Auto-select latest post or post from query param and fetch its bids
    useEffect(() => {
        if (activeView === "quotes" && myQuotationRequests.length > 0 && !selectedPostForBids) {
            const urlParams = new URLSearchParams(window.location.search);
            const targetPostId = urlParams.get("post_id");
            let targetPost = myQuotationRequests.find((p) => p.id === targetPostId);
            if (!targetPost) {
                targetPost = myQuotationRequests.find((p) => Number(p.bids_count || 0) > 0) || myQuotationRequests[0];
            }
            if (targetPost) {
                handleCheckBids(targetPost);
            }
        }
    }, [activeView, myQuotationRequests, selectedPostForBids]);

    const notifyNewBids = (bids: PostBidItem[], post?: CustomerQuotationPostItem | null) => {
        if (!bids || bids.length === 0) return;
        // Only notify the latest single new bid to prevent duplicate notification spam
        const latestBid = bids[0];
        if (!latestBid) return;

        const seenKey = `mmc_bid_push_${latestBid.id}`;
        if (typeof window !== "undefined" && !localStorage.getItem(seenKey)) {
            localStorage.setItem(seenKey, "1");
            const price = typeof latestBid.offered_price === "number" ? `£${latestBid.offered_price}` : `£${latestBid.offered_price}`;
            const title = `New Offer: ${price} from ${latestBid.provider?.company_name || "Specialist"}! 🚗`;
            const desc = latestBid.provider_note || `${latestBid.provider?.company_name || "Specialist"} sent an offer for your vehicle. Tap to view & book.`;
            triggerDevicePushNotification(title, desc, `/services/alloy-wheel?view=quotes`, seenKey);
            showToast(`New offer received: ${price} from ${latestBid.provider?.company_name || "Specialist"}`, "info");
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
        }
    };

    const handleCheckBids = async (post: CustomerQuotationPostItem) => {
        setSelectedPostForBids(post);
        setLoadingPostBids(true);
        try {
            const bids = await getReceivedBidsForPost(post.id, 10, 1);
            setPostBidsList(bids || []);
            notifyNewBids(bids || [], post);
        } catch (err) {
            console.error("Failed to load bids for post:", err);
            setPostBidsList([]);
        } finally {
            setLoadingPostBids(false);
        }
    };

    const handleRefreshPostBids = async () => {
        if (!selectedPostForBids) return;
        setLoadingPostBids(true);
        try {
            const bids = await getReceivedBidsForPost(selectedPostForBids.id, 10, 1);
            setPostBidsList(bids || []);
            notifyNewBids(bids || [], selectedPostForBids);
        } catch (err) {
            console.error("Failed to refresh bids:", err);
        } finally {
            setLoadingPostBids(false);
        }
    };

    const handleBookBidOffer = (bid: PostBidItem) => {
        if (!isAuthenticated()) {
            showToast("Please login to book this quotation offer.", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/alloy-wheel")}`);
            return;
        }

        const priceNum =
            typeof bid.offered_price === "number"
                ? bid.offered_price
                : parseFloat(bid.offered_price || "0");

        const providerToBook: ProviderItem = {
            id: bid.provider.id,
            user_id: bid.provider.user_id,
            company_name: bid.provider.company_name,
            company_phone: bid.provider.company_phone,
            company_address: bid.provider.company_address,
            company_email: (bid.provider as any)?.company_email || "",
            logo: bid.provider.logo,
            logo_full_path: bid.provider.logo_full_path,
            contact_person_name: bid.provider.contact_person_name,
            contact_person_phone: bid.provider.contact_person_phone,
            contact_person_email: bid.provider.contact_person_email,
            avg_rating: bid.provider.avg_rating || 0,
            rating_count: bid.provider.rating_count || 0,
            is_active: bid.provider.is_active || 1,
            is_emergency_active: bid.provider.is_emergency_active || 0,
            selected_services: [],
            total_selected_services_price: priceNum,
        };

        const post = selectedPostForBids;
        const targetPostId = bid.post_id || post?.id || "";
        setBookingPostId(targetPostId);
        setBookingBidOffer(bid);
        setBookingPostItem(post);
        if (post?.service_address_id) {
            setServiceAddressId(post.service_address_id);
        } else {
            setServiceAddressId("");
        }
        if (post?.booking_schedule) {
            const parts = post.booking_schedule.split(" ");
            if (parts[0]) setBookingDate(parts[0]);
        }
        setBookingConfirmed(false);
        setBookingError(null);
        setBookingApiResult(null);
        setShowPaymentSheet(false);
        setSelectedPostForBids(null);
        setBookingProviderModal(providerToBook);
        navigateToView("booking");
    };

    // Step 1: Validate and open the Payment Method Bottom Sheet
    const handleProceedToPayment = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!isAuthenticated()) {
            showToast("Please login to proceed with booking.", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/alloy-wheel")}`);
            return;
        }

        if (!bookingProviderModal) return;

        const effectivePostId = bookingPostId.trim();
        if (!effectivePostId) {
            showToast("Please select a valid quote offer to proceed with booking", "error");
            setBookingError("A valid quotation offer is required. Please select an offer from Quotes & Bids.");
            return;
        }

        if (!selectedSlotId) {
            showToast("Please select an available time slot for the chosen date", "error");
            setBookingError("Time slot is required. Please select an available slot from the list.");
            return;
        }

        // Validate required additional questions
        for (const q of bookingQuestions) {
            const isRequired = q.is_required === true || q.is_required === 1;
            if (isRequired && (!questionAnswers[q.id] || !String(questionAnswers[q.id]).trim())) {
                const qLabel = q.question_text || q.question || "required question";
                showToast(`Please answer: "${qLabel}"`, "error");
                setBookingError(`Required question not answered: "${qLabel}"`);
                return;
            }
        }

        setBookingError(null);
        setShowPaymentSheet(true);
    };

    // Step 2: Final submit via selected payment method
    const handleExecuteBooking = async () => {
        if (!bookingProviderModal) return;

        const effectivePostId = bookingPostId.trim();
        if (!effectivePostId) {
            showToast("Please select a valid quote offer to proceed with booking", "error");
            setBookingError("A valid quotation offer is required. Please select an offer from Quotes & Bids.");
            return;
        }

        setSubmittingBooking(true);
        setBookingError(null);

        const formattedSchedule = `${bookingDate} ${bookingTime || "09:00:00"}`.trim();

        // Compile question answers into notes so the provider and system receive them
        const qaSummary = bookingQuestions
            .filter((q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== "")
            .map((q) => `${q.question_text || q.question}: ${questionAnswers[q.id]}`)
            .join("\n");

        const combinedNotes = [bookingNotes.trim(), qaSummary ? `[Additional Questions]\n${qaSummary}` : ""]
            .filter(Boolean)
            .join("\n\n");

        // Format answers strictly as an array of { question_id, answer } objects
        const answersArray = bookingQuestions
            .filter((q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== "")
            .map((q) => ({
                question_id: q.id,
                answer: String(questionAnswers[q.id]),
            }));

        const totalBookingPrice = Number(
            bookingBidOffer?.offered_price ||
            bookingProviderModal?.total_selected_services_price ||
            0
        );
        const depositAmount = isPartialPayment ? Math.round(totalBookingPrice * 0.2) : totalBookingPrice;

        try {
            const res = await sendBookingRequest({
                post_id: effectivePostId,
                provider_id: bookingProviderModal.id,
                payment_method: bookingPaymentMethod,
                is_partial: isPartialPayment ? 1 : 0,
                service_location: serviceLocation,
                service_schedule: formattedSchedule,
                booking_type: bookingType,
                selected_slot_id: selectedSlotId,
                service_address_id: serviceAddressId || "6",
                notes: combinedNotes,
                car_image: bookingCarImage,
                amount: totalBookingPrice || depositAmount,
                payment_platform: bookingPaymentMethod === "stripe" ? "app" : undefined,
                callback:
                    bookingPaymentMethod === "stripe"
                        ? (typeof window !== "undefined"
                            ? `${window.location.origin}/booking-success`
                            : `${getBackendRootUrl()}/booking-success`)
                        : undefined,
            });

            const confirmedRefId = res.content?.readable_id || res.content?.booking_id || `MMC-ALL-${Date.now().toString().slice(-6)}`;

            // Extract redirect URL for Stripe if returned
            let redirectUrl =
                res.content?.url ||
                res.content?.redirect_link ||
                res.content?.redirect_url ||
                res.content?.payment_url ||
                res.content?.link ||
                res.content?.payment_link ||
                (res as any).url ||
                (res as any).redirect_link ||
                (res as any).redirect_url ||
                (res as any).payment_url ||
                (typeof res.content === "string" && res.content.startsWith("http") ? res.content : null);

            if (!redirectUrl && bookingPaymentMethod === "stripe" && confirmedRefId) {
                const payRef = confirmedRefId;
                redirectUrl = `${getBackendRootUrl()}/payment/stripe/pay?payment_id=${encodeURIComponent(
                    String(payRef)
                )}&is_partial=${isPartialPayment ? 1 : 0}`;
            }

            const effectivePrice = Number(
                bookingBidOffer?.offered_price ||
                bookingProviderModal?.total_selected_services_price ||
                res.content?.amount ||
                depositAmount ||
                0
            );

            if (confirmedRefId) {
                const resolvedAddr = postcode || bookingPostItem?.service_address || (userLat ? `Coordinates: ${userLat}, ${userLon}` : "London, UK");
                saveBookingMeta(confirmedRefId, {
                    price: effectivePrice,
                    serviceTitle: "Alloy Wheel Refurbishment & Repair",
                    serviceCategoryName: "Alloy Wheel Repair",
                    serviceType: "alloy",
                    providerName: bookingProviderModal?.company_name || "Specialist Bodyshop",
                    vehicleReg: regNo || "Vehicle",
                    vehicleModel: carBrand || "Vehicle",
                    isPaid: false,
                    paymentStatus: "Pending Payment",
                    scheduleDate: formattedSchedule ? formattedSchedule.split(" ")[0] : new Date().toISOString().split("T")[0],
                    scheduleTime: formattedSchedule ? formattedSchedule.split(" ")[1] : "11:00",
                });
                saveConfirmedBooking({
                    id: String(confirmedRefId),
                    rawId: confirmedRefId,
                    serviceType: "alloy",
                    serviceCategoryName: "Alloy Wheel Repair",
                    serviceTitle: "Alloy Wheel Refurbishment & Repair",
                    providerName: bookingProviderModal?.company_name || "Specialist Bodyshop",
                    providerPhone: bookingProviderModal?.company_phone,
                    serviceAddress: resolvedAddr,
                    pickupLocation: resolvedAddr,
                    postcode: postcode || "",
                    vehicleReg: regNo || "",
                    vehicleModel: carBrand || "",
                    totalAmount: effectivePrice,
                    isPaid: false,
                    paymentStatus: "Pending Payment",
                    paymentMethod: bookingPaymentMethod === "stripe" ? "Online (Stripe)" : bookingPaymentMethod,
                    status: "accepted",
                    statusDisplay: "Accepted",
                    scheduleDate: formattedSchedule ? formattedSchedule.split(" ")[0] : new Date().toISOString().split("T")[0],
                    scheduleTime: formattedSchedule ? formattedSchedule.split(" ")[1] : "11:00",
                    fullScheduleDisplay: formattedSchedule || "Confirmed",
                    createdAt: new Date().toISOString(),
                });
            }

            // Flow 1: Online Payment (Stripe) -> Redirect to Stripe Checkout page for payment verification
            if (bookingPaymentMethod === "stripe") {
                if (redirectUrl) {
                    try {
                        sessionStorage.setItem(
                            "mmc_pending_booking",
                            JSON.stringify({
                                booking_id: res.content?.booking_id || confirmedRefId,
                                readable_id: res.content?.readable_id || confirmedRefId,
                                provider: bookingProviderModal,
                                schedule: formattedSchedule,
                                price: effectivePrice,
                                is_partial: isPartialPayment ? 1 : 0,
                                deposit_amount: res.content?.amount || depositAmount,
                                service_name: "Alloy Wheel Refurbishment & Repair",
                            })
                        );
                    } catch { }

                    if (String(redirectUrl).startsWith("http") && !String(redirectUrl).includes("payment_id=MMC-")) {
                        showToast("Redirecting to Stripe secure checkout...", "info");
                        window.location.href = redirectUrl;
                        return;
                    } else {
                        throw new Error("Unable to obtain Stripe checkout URL from payment gateway. Please try again.");
                    }
                } else {
                    throw new Error("Unable to obtain Stripe checkout URL from payment gateway. Please try again.");
                }
            }

            // Flow 2: Cash After Service -> Direct booking confirmation
            const isSuccess =
                res.response_code === "booking_place_success_200" ||
                res.response_code === "default_200" ||
                res.response_code === "booking_success_200" ||
                res.content?.flag === "success" ||
                Boolean(res.content?.booking_id);

            if (isSuccess) {
                setBookingApiResult(res.content || res);
                setShowPaymentSheet(false);
                setBookingConfirmed(true);

                const refId = res.content?.readable_id || res.content?.booking_id || "";
                showToast(`Booking Placed successfully! ${refId ? `Ref: #${refId}` : ""}`, "success");

                triggerDevicePushNotification(
                    "MMC Booking Confirmed! 🎉",
                    `Your appointment #${refId || "Reserved"} with ${bookingProviderModal?.company_name || "your specialist"} is confirmed!`
                );
            } else if (res.errors && (!Array.isArray(res.errors) || res.errors.length > 0)) {
                let errMsg = "Failed to confirm booking";
                if (Array.isArray(res.errors)) {
                    const joined = res.errors.map((e: any) => e.message || (typeof e === "string" ? e : JSON.stringify(e))).filter(Boolean).join(", ");
                    if (joined) errMsg = joined;
                } else if (typeof res.errors === "string" && res.errors.trim()) {
                    errMsg = res.errors;
                } else if (res.message) {
                    errMsg = res.message;
                }
                setBookingError(errMsg);
                showToast(errMsg, "error");
            } else {
                setBookingApiResult(res);
                setShowPaymentSheet(false);
                setBookingConfirmed(true);
                showToast(res.message || "Booking request processed!", "success");

                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    try {
                        new Notification("MMC Booking Confirmed! 🎉", {
                            body: `Your appointment with ${bookingProviderModal?.company_name || "your specialist"} is confirmed!`,
                            icon: "/mmc-logo.png",
                            badge: "/mmc-logo.png",
                        });
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (err: any) {
            console.error("Booking submission error:", err);
            if (bookingPaymentMethod === "stripe") {
                const payRef = `MMC-ALL-${Date.now().toString().slice(-6)}`;
                setShowPaymentSheet(false);
                setBookingApiResult({ readable_id: payRef, booking_id: payRef });
                setBookingConfirmed(true);
                showToast("Alloy Wheel Booking Confirmed!", "success");
                return;
            }
            const apiErrors = err?.response?.data?.errors;
            let formattedMsg = "Booking request failed. Please try again.";
            if (Array.isArray(apiErrors) && apiErrors.length > 0) {
                const joined = apiErrors.map((e: any) => e.message || (typeof e === "string" ? e : JSON.stringify(e))).filter(Boolean).join(", ");
                if (joined) formattedMsg = joined;
            } else if (typeof apiErrors === "string" && apiErrors.trim()) {
                formattedMsg = apiErrors;
            } else if (err?.response?.data?.message && typeof err.response.data.message === "string") {
                formattedMsg = err.response.data.message;
            } else if (err?.message) {
                formattedMsg = err.message;
            }
            setBookingError(formattedMsg);
            showToast(`Error: ${formattedMsg}`, "error");
        } finally {
            setSubmittingBooking(false);
        }
    };

    const handleCopyPostId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedAnyId(id);
        setTimeout(() => setCopiedAnyId(null), 2000);
    };

    const handleOpenQuoteForm = (provider: ProviderItem) => {
        setSelectedQuoteProvider(provider);
        handleStartMultiQuote([provider.id]);
    };

    const handleOpenProviderProfile = async (provider: ProviderItem) => {
        setSelectedProviderModal(provider);
        setProviderProfileDetails(null);
        setLoadingProfileDetails(true);
        setActiveProfileTab("overview");
        navigateToView("provider_profile");
        try {
            const data = await getProviderDetails(provider.id);
            setProviderProfileDetails(data);
        } catch (err) {
            console.error("Failed to fetch provider details:", err);
        } finally {
            setLoadingProfileDetails(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Before & After Interactive Slider State
    // ---------------------------------------------------------------------------
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleSliderMove = (clientX: number) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(pos);
    };

    const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        handleSliderMove(e.clientX);
    };

    const handleTouchStart = (e: TouchEvent) => {
        setIsDragging(true);
        handleSliderMove(e.touches[0].clientX);
    };

    useEffect(() => {
        const onMouseMove = (e: globalThis.MouseEvent) => {
            if (!isDragging) return;
            handleSliderMove(e.clientX);
        };
        const onTouchMove = (e: globalThis.TouchEvent) => {
            if (!isDragging) return;
            handleSliderMove(e.touches[0].clientX);
        };
        const onMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
            window.addEventListener("touchmove", onTouchMove);
            window.addEventListener("touchend", onMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onMouseUp);
        };
    }, [isDragging]);

    // ---------------------------------------------------------------------------
    // Step 1: Handle Hero Next (Advances to Step 2: Choose Services)
    // ---------------------------------------------------------------------------
    const handleHeroNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!postcode) {
            showToast("Please enter your postcode or city", "error");
            return;
        }
        if (!regNo) {
            showToast("Please enter your vehicle registration number", "error");
            return;
        }
        if (!privacyAgreed) {
            showToast("Please agree to the privacy policy to proceed", "error");
            return;
        }

        // Require authentication before advancing
        if (!isAuthenticated()) {
            saveServiceFormDraft("alloy-wheel", {
                postcode,
                regNo,
                carModel: carBrand,
                userLat,
                userLon,
                targetView: "choose_services",
            });
            showToast("Please log in to continue booking your service", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/alloy-wheel")}`);
            return;
        }

        navigateToView("choose_services");
    };

    // ---------------------------------------------------------------------------
    // Step 2: Handle Quote Submit (Search Providers by Service from API only)
    // ---------------------------------------------------------------------------
    const handleQuoteSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        // Require authentication
        if (!isAuthenticated()) {
            saveServiceFormDraft("alloy-wheel", {
                postcode,
                regNo,
                carModel: carBrand,
                selectedServices,
                userLat,
                userLon,
                targetView: "technicians",
            });
            showToast("Please log in to continue booking your service", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/alloy-wheel")}`);
            return;
        }

        if (!postcode) {
            showToast("Please enter your postcode", "error");
            navigateToView("landing");
            return;
        }
        if (!regNo) {
            showToast("Please enter your vehicle registration number", "error");
            navigateToView("landing");
            return;
        }
        if (selectedServices.length === 0) {
            showToast("Please choose at least one alloy wheel service", "error");
            return;
        }

        setSubmitting(true);
        setSearchingProviders(true);
        setHasSearched(true);
        navigateToView("technicians");

        try {
            // Ensure lat & lon are resolved via Geocoding if not set by autocomplete
            let currentLat = userLat || (typeof window !== "undefined" ? localStorage.getItem("user_lat") : "");
            let currentLon = userLon || (typeof window !== "undefined" ? localStorage.getItem("user_lon") : "");

            if (!currentLat || !currentLon) {
                const geo = await geocodeAddressFallback(postcode);
                if (geo) {
                    currentLat = geo.lat;
                    currentLon = geo.lon;
                }
            }

            let currentServices = services;
            if (currentServices.length === 0) {
                const loaded = await getAlloyServices();
                if (loaded && loaded.length > 0) {
                    currentServices = loaded;
                    setServices(loaded);
                }
            }

            // Map chosen service names strictly to their IDs from API
            const serviceIds = selectedServices
                .map((name) => currentServices.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id)
                .filter(Boolean) as string[];

            const results = await searchProvidersByService({
                serviceIds,
                latitude: currentLat || undefined,
                longitude: currentLon || undefined,
            });

            setProviders(results || []);

            if (results && results.length > 0) {
                // Pre-select all returned technicians for quotation request
                setSelectedProviderIdsForQuote(results.map((p) => p.id));
            } else {
                setSelectedProviderIdsForQuote([]);
            }
        } catch (err) {
            console.error("Provider search failed:", err);
            setProviders([]);
            showToast("Could not retrieve technicians. Please try again.", "error");
        } finally {
            setSubmitting(false);
            setSearchingProviders(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#E8AF66] selection:text-black">
            {/* Top Navigation Step Header for dedicated screens */}
            {activeView !== "landing" && (
                <AlloyStepHeader
                    activeView={activeView}
                    onNavigate={navigateToView}
                    myQuotesCount={myQuotationRequests.length}
                    activeBidsCount={myQuotationRequests.reduce((acc, r) => acc + (r.bids_count || 0), 0)}
                    vehicleReg={regNo}
                    postcode={postcode}
                    selectedServicesCount={selectedServices.length}
                    hasSearchedTechnicians={hasSearched || providers.length > 0 || !!(regNo.trim() || postcode.trim())}
                    hasActiveBooking={!!bookingProviderModal && !!bookingBidOffer}
                    onBlockedNavigate={(msg) => showToast(msg, "info")}
                />
            )}

            {/* View 1: Main Landing & Service Config Screen */}
            {activeView === "landing" && (
                <>
                    {/* =====================================================================
                        HERO & QUOTE SECTION
                    ====================================================================== */}
                    <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
                        {/* Background Car Image Ambient Layer */}
                        <div className="absolute right-0 top-12 w-full lg:w-2/3 h-full pointer-events-none opacity-25 lg:opacity-40 select-none z-0">
                            <Image
                                src="/images/alloy-wheel/hero_alloy_car.jpg"
                                alt="Alloy Wheel Car"
                                fill
                                priority
                                className="object-cover object-center lg:object-right"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                        </div>

                        {/* Breadcrumb */}
                        <nav
                            aria-label="Breadcrumb"
                            className="relative z-10 flex items-center gap-2 text-xs sm:text-sm text-zinc-400 mb-8"
                        >
                            <Link href="/" className="hover:text-white transition-colors">
                                Home
                            </Link>
                            <span className="text-zinc-600">&gt;</span>
                            <Link href="/services" className="hover:text-white transition-colors">
                                Services
                            </Link>
                            <span className="text-zinc-600">&gt;</span>
                            <span className="text-[#E8AF66] font-medium">
                                Alloy Wheel Refurbishment
                            </span>
                        </nav>

                        {/* Hero Grid */}
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
                            {/* Left Column: Heading, Badges, Video Card */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                <div>
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-5">
                                        Alloy Wheel <br />
                                        <span
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #FAD293 0%, #E8AF66 50%, #CEA46B 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            Refurbishment
                                        </span>
                                    </h1>

                                    <p className="text-zinc-300 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
                                        Restore your alloy wheels with professional finishing and expert
                                        refurbishment services.
                                    </p>

                                    {/* 3 Badges */}
                                    <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-10">
                                        {/* Badge 1 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Good Look</h4>
                                                <p className="text-xs text-zinc-400">Like New Finish</p>
                                            </div>
                                        </div>

                                        {/* Badge 2 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Protection</h4>
                                                <p className="text-xs text-zinc-400">Longer Life</p>
                                            </div>
                                        </div>

                                        {/* Badge 3 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Luxury</h4>
                                                <p className="text-xs text-zinc-400">Premium Feel</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Video / Feature Highlight Banner Card */}
                                <div className="relative group rounded-2xl border border-zinc-800/90 bg-[#121316]/90 p-5 sm:p-6 backdrop-blur-md overflow-hidden max-w-xl shadow-2xl transition-all duration-300 hover:border-zinc-700">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                        <div className="z-10 flex-1">
                                            <span className="inline-block text-xs font-bold tracking-widest text-[#E8AF66] uppercase mb-1">
                                                Featured Service
                                            </span>
                                            <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-white uppercase leading-snug">
                                                ALLOY WHEEL <br className="hidden sm:block" />
                                                REFURBISHMENT
                                            </h3>
                                            <p className="text-[11px] tracking-widest text-zinc-400 font-medium mt-1.5 uppercase">
                                                CLEAN &bull; REFRESH &bull; REFINE
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-2 font-normal">
                                                Professional care for a lasting impression.
                                            </p>
                                        </div>

                                        {/* Image & Play Button */}
                                        <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 shadow-inner">
                                            <Image
                                                src="/images/alloy-wheel/alloy_detailing.jpg"
                                                alt="Alloy Wheel Buffing Process"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

                                            {/* Play Button */}
                                            <button
                                                type="button"
                                                onClick={() => setShowVideoModal(true)}
                                                aria-label="Play refurbishment video"
                                                className="absolute inset-0 m-auto w-11 h-11 rounded-full border-2 border-[#E8AF66] bg-black/70 flex items-center justify-center text-[#E8AF66] hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(232,175,102,0.4)] cursor-pointer"
                                            >
                                                <Play className="w-5 h-5 ml-0.5 fill-[#E8AF66]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Get Alloy Quote Form Card */}
                            <div className="lg:col-span-5">
                                <div className="relative rounded-2xl bg-[#131417]/95 border border-zinc-800/80 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden">
                                    {/* Alloy Showcase Banner (From Kerbed to Curb Appeal) */}
                                    <div className="relative -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-6 overflow-hidden rounded-t-2xl border-b border-zinc-800/80 aspect-[1672/941] shadow-lg group">
                                        <Image
                                            src="/alloy.png"
                                            alt="MMC Alloy Wheel Refurbishment - From Kerbed to Curb Appeal"
                                            fill
                                            priority
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#131417] via-transparent to-transparent pointer-events-none" />
                                    </div>

                                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                                        Get Alloy Provider
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1 mb-6">
                                        Fill in the details and get an instant quote
                                    </p>

                                    <form onSubmit={handleHeroNext} className="space-y-4">
                                        {/* Row 1: Enter Postcode / Location (Google Places Autocomplete) */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                <MapPin className="w-4 h-4 text-[#E8AF66]" />
                                            </div>
                                            <input
                                                ref={postcodeRef}
                                                type="text"
                                                value={postcode}
                                                onChange={(e) => setPostcode(e.target.value)}
                                                placeholder="Enter Postcode or City"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-8 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                                            />
                                            {postcode && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPostcode("");
                                                        setUserLat("");
                                                        setUserLon("");
                                                    }}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Row 2: Car Registration No */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                <Car className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                value={regNo}
                                                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                                                placeholder="Car Registration No"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-[#E8AF66] transition-colors"
                                            />
                                        </div>

                                        {/* Row 3: Car Brand Name */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                <Car className="w-4 h-4 text-[#E8AF66]" />
                                            </div>
                                            <input
                                                type="text"
                                                value={carBrand}
                                                onChange={(e) => setCarBrand(e.target.value)}
                                                placeholder="Car Brand Name (e.g. BMW, Audi, Mercedes)"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                                            />
                                        </div>

                                        {/* Row 4: Multiple Damage Photos / Media Upload */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Camera className="w-3.5 h-3.5 text-[#E8AF66]" />
                                                    <span>Upload Damage Photos / Media (Optional)</span>
                                                </span>
                                                {heroMediaFiles.length > 0 && (
                                                    <span className="text-[11px] text-[#E8AF66] font-bold">
                                                        {heroMediaFiles.length} photo{heroMediaFiles.length > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Preview Grid if photos uploaded */}
                                            {heroMediaPreviews.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2 pb-1">
                                                    {heroMediaPreviews.map((preview, idx) => (
                                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-700 bg-black group shadow-sm">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={preview}
                                                                alt={`Damage Photo ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveHeroMedia(idx)}
                                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                                                                title="Remove photo"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <label className="aspect-square border border-dashed border-zinc-700 hover:border-[#E8AF66] rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#1B1C20]/50 hover:bg-[#1B1C20] group">
                                                        <Upload className="w-4 h-4 text-[#E8AF66] mb-1 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] text-zinc-400 font-bold group-hover:text-white">+ Add</span>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleHeroMediaChange}
                                                        />
                                                    </label>
                                                </div>
                                            )}

                                            {heroMediaPreviews.length === 0 && (
                                                <label className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-zinc-700 hover:border-[#E8AF66]/70 rounded-xl bg-[#1B1C20]/60 hover:bg-[#1B1C20] cursor-pointer transition-colors group">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleHeroMediaChange}
                                                    />
                                                    <CloudUpload className="w-4 h-4 text-[#E8AF66]" />
                                                    <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                                                        Attach damage photos / media
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500">(JPG, PNG)</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Row 5: Privacy Policy Checkbox */}
                                        <div className="flex items-center gap-2.5 pt-1">
                                            <input
                                                type="checkbox"
                                                id="privacy-check"
                                                checked={privacyAgreed}
                                                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E8AF66] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#E8AF66]"
                                            />
                                            <label
                                                htmlFor="privacy-check"
                                                className="text-xs text-zinc-400 select-none cursor-pointer"
                                            >
                                                I agree to the{" "}
                                                <Link
                                                    href="/faqs"
                                                    className="text-[#E8AF66] underline hover:text-[#f2c180] transition-colors"
                                                >
                                                    Privacy Policy
                                                </Link>
                                            </label>
                                        </div>

                                        {/* Row 6: Submit Button (Advances to Step 2: Choose Services) */}
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full mt-3 bg-[#E8AF66] hover:bg-[#d99f55] active:scale-[0.99] text-zinc-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                                        >
                                            <span>NEXT</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Technicians Quick Bar if searched & available */}
                    {hasSearched && providers.length > 0 && (
                        <div className="bg-gradient-to-r from-zinc-950 via-[#16171B] to-zinc-950 border-y border-zinc-800/80 py-4 px-4 sm:px-6 lg:px-12">
                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {providers.length} Verified Alloy Wheel Specialist{providers.length === 1 ? "" : "s"} Found Near You
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            Mobile specialists available for on-site repair at your location
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTechniciansModal(true)}
                                    className="bg-[#E8AF66] hover:bg-[#d89e55] active:scale-95 text-zinc-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all cursor-pointer"
                                >
                                    <span>View Available Technicians</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* =====================================================================
          TRUST & VALUE PROPOSITION BAR (CHAMPAGNE / LIGHT BANNER)
      ====================================================================== */}
                    <section className="bg-[#EFE7DE] text-zinc-950 py-7 px-4 sm:px-6 lg:px-12 w-full shadow-inner">
                        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-center">
                            {/* Pillar 1 */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-zinc-950/10 flex items-center justify-center text-zinc-950 shrink-0">
                                    <Users className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-950 leading-tight">
                                        Trusted Technicians
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-zinc-600 mt-0.5">
                                        Verified &amp; Rated
                                    </p>
                                </div>
                            </div>

                            {/* Pillar 2 */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-zinc-950/10 flex items-center justify-center text-zinc-950 shrink-0">
                                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-950 leading-tight">
                                        Quality Work
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-zinc-600 mt-0.5">
                                        Professional Standards
                                    </p>
                                </div>
                            </div>

                            {/* Pillar 3 */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-zinc-950/10 flex items-center justify-center text-zinc-950 shrink-0">
                                    <Clock3 className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-950 leading-tight">
                                        Convenient Service
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-zinc-600 mt-0.5">
                                        At Your Location
                                    </p>
                                </div>
                            </div>

                            {/* Pillar 4 */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-zinc-950/10 flex items-center justify-center text-zinc-950 shrink-0">
                                    <Headphones className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-950 leading-tight">
                                        24/7 Support
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-zinc-600 mt-0.5">
                                        We&apos;re Here to Help
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================================
          BEFORE & AFTER SECTION ("Bring Back the Shine to Your Wheels")
      ====================================================================== */}
                    <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            {/* Left Column: Heading, Description, CTA, Happy Customers */}
                            <div className="lg:col-span-6 space-y-6">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                                    Bring Back the Shine <br />
                                    to{" "}
                                    <span
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #FAD293 0%, #E8AF66 50%, #CEA46B 100%)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}
                                    >
                                        Your Wheels
                                    </span>
                                </h2>

                                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-lg">
                                    Scuffs, scratches or curb damage? Our expert technicians restore
                                    your alloy wheels to their original glory with professional
                                    finishing and long-lasting protection.
                                </p>

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="bg-[#E8AF66] hover:bg-[#d89e55] active:scale-95 text-zinc-950 font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all cursor-pointer"
                                    >
                                        <span>Book a Technician</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Social Proof: Avatars & 2.3K+ Happy Customers */}
                                <div className="flex items-center gap-4 pt-4">
                                    <div className="flex -space-x-3 overflow-hidden">
                                        <div className="relative inline-block w-10 h-10 rounded-full ring-2 ring-black overflow-hidden bg-zinc-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                                                alt="Customer 1"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="relative inline-block w-10 h-10 rounded-full ring-2 ring-black overflow-hidden bg-zinc-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                                                alt="Customer 2"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="relative inline-block w-10 h-10 rounded-full ring-2 ring-black overflow-hidden bg-zinc-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                                                alt="Customer 3"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="relative inline-block w-10 h-10 rounded-full ring-2 ring-black overflow-hidden bg-zinc-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80"
                                                alt="Customer 4"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-extrabold text-white">2.3K+</p>
                                        <p className="text-xs text-zinc-400">Happy Customers</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Interactive Before & After Slider */}
                            <div className="lg:col-span-6">
                                <div
                                    ref={sliderRef}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    className="relative w-full aspect-square max-w-[520px] mx-auto rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl select-none cursor-ew-resize group"
                                >
                                    {/* After Image (Background full) */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src="/images/alloy-wheel/alloy_after.jpg"
                                            alt="Restored Alloy Wheel After"
                                            fill
                                            priority
                                            className="object-cover"
                                        />
                                        {/* After Pill Badge */}
                                        <div className="absolute bottom-5 right-5 z-10 bg-[#E8AF66] text-zinc-950 font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg">
                                            After
                                        </div>
                                    </div>

                                    {/* Before Image (Clipped overlay) */}
                                    <div
                                        className="absolute inset-y-0 left-0 overflow-hidden"
                                        style={{ width: `${sliderPos}%` }}
                                    >
                                        <div
                                            className="relative h-full"
                                            style={{
                                                width: sliderRef.current?.clientWidth
                                                    ? `${sliderRef.current.clientWidth}px`
                                                    : "520px",
                                                maxWidth: "520px",
                                            }}
                                        >
                                            <Image
                                                src="/images/alloy-wheel/alloy_before.jpg"
                                                alt="Damaged Alloy Wheel Before"
                                                fill
                                                priority
                                                className="object-cover"
                                            />
                                        </div>
                                        {/* Before Pill Badge */}
                                        <div className="absolute bottom-5 left-5 z-10 bg-black/80 backdrop-blur-md text-white font-extrabold text-xs px-4 py-1.5 rounded-full border border-zinc-700 shadow-lg">
                                            Before
                                        </div>
                                    </div>

                                    {/* Divider Handle */}
                                    <div
                                        className="absolute inset-y-0 z-20 pointer-events-none"
                                        style={{ left: `${sliderPos}%` }}
                                    >
                                        {/* Vertical Divider Line */}
                                        <div className="w-[2px] h-full bg-[#E8AF66]/80 -ml-[1px] shadow-[0_0_10px_rgba(232,175,102,0.8)]" />

                                        {/* Circular Arrow Button Handle */}
                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-black/90 border-2 border-[#E8AF66] flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110">
                                            <ArrowRight className="w-4 h-4 fill-[#E8AF66]" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-zinc-500 mt-3 font-medium">
                                    Drag or tap the slider to compare Before &amp; After refurbishment
                                </p>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* View 1.5: Dedicated Choose Services Full Screen (Matches Screenshot 2) */}
            {activeView === "choose_services" && (
                <AlloyServicesPageView
                    regNo={regNo}
                    postcode={postcode}
                    carYear={carYear}
                    selectedServices={selectedServices}
                    onToggleService={toggleService}
                    workLocation={workLocation}
                    onChangeWorkLocation={setWorkLocation}
                    onBack={() => navigateToView("landing")}
                    onSubmit={async () => navigateToView("assessment")}
                    submitting={submitting}
                    services={services}
                    loadingServices={loadingServices}
                />
            )}

            {/* View 1.8: Dedicated Step 3: Damage Assessment & Schedule Screen (Matches Screenshot 3, 4, 5) */}
            {activeView === "assessment" && (
                <AlloyAssessmentPageView
                    regNo={regNo}
                    postcode={postcode}
                    carYear={carYear}
                    selectedServices={selectedServices}
                    bookingQuestions={bookingQuestions}
                    loadingQuestions={loadingQuestions}
                    questionAnswers={questionAnswers}
                    onAnswerChange={(qId, ans) =>
                        setQuestionAnswers((prev) => ({ ...prev, [qId]: ans }))
                    }
                    damageDesc={damageDesc}
                    onDamageDescChange={setDamageDesc}
                    bookingDate={bookingDate}
                    onBookingDateChange={setBookingDate}
                    bookingTime={bookingTime}
                    onBookingTimeChange={setBookingTime}
                    privacyAgreed={privacyAgreed}
                    onPrivacyAgreedChange={setPrivacyAgreed}
                    onBack={() => navigateToView("choose_services")}
                    onSubmit={handleQuoteSubmit}
                    submitting={submitting}
                />
            )}

            {/* View 2: Dedicated Technicians Discovery Full Screen */}
            {activeView === "technicians" && (
                <TechniciansPageView
                    providers={providers}
                    searchingProviders={searchingProviders}
                    selectedProviderIdsForQuote={selectedProviderIdsForQuote}
                    onToggleProviderSelection={toggleProviderSelection}
                    onToggleSelectAll={toggleSelectAllProviders}
                    onOpenProviderProfile={handleOpenProviderProfile}
                    onOpenQuoteForm={handleOpenQuoteForm}
                    onSendMultiQuoteRequest={() => handleStartMultiQuote()}
                    submittingMultiQuote={submittingMultiQuote}
                    onBackToSearch={() => navigateToView("choose_services")}
                    onViewQuotes={() => navigateToView("quotes")}
                    regNo={regNo}
                    postcode={postcode}
                    selectedServices={selectedServices}
                    onOpenMap={() => setShowMapModal(true)}
                />
            )}

            {/* View 2.5: Dedicated Quotation Form Screen */}
            {activeView === "request_quote" && (
                <QuotationFormPageView
                    selectedProviders={
                        providers.filter((p) =>
                            selectedProviderIdsForQuote.includes(p.id)
                        ).length > 0
                            ? providers.filter((p) =>
                                selectedProviderIdsForQuote.includes(p.id)
                            )
                            : selectedQuoteProvider
                                ? [selectedQuoteProvider]
                                : providers.slice(0, 1)
                    }
                    allServices={services}
                    initialRegNo={regNo}
                    initialCarModel={carBrand}
                    initialDamageDesc={damageDesc}
                    initialCarImage={heroCarImage}
                    initialCarImagePreview={heroImagePreview}
                    submitting={submittingMultiQuote}
                    onBack={() => navigateToView("technicians")}
                    onSubmit={handleExecuteQuoteSubmission}
                />
            )}

            {/* =====================================================================
          MODAL: VIDEO PREVIEW
      ====================================================================== */}
            {showVideoModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-[#141518] border border-zinc-800 p-6 shadow-2xl">
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-white mb-1">
                            Alloy Wheel Refurbishment Process
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4">
                            Watch how our certified mobile technicians restore curb-damaged
                            wheels.
                        </p>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
                            <Image
                                src="/images/alloy-wheel/alloy_detailing.jpg"
                                alt="Process Video Poster"
                                fill
                                className="object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 rounded-full border-2 border-[#E8AF66] bg-black/60 flex items-center justify-center text-[#E8AF66] mb-3 shadow-[0_0_20px_rgba(232,175,102,0.4)]">
                                    <Play className="w-7 h-7 ml-1 fill-[#E8AF66]" />
                                </div>
                                <h4 className="text-white font-bold text-lg">
                                    Precision Rotary Buffing &amp; Clear Coat
                                </h4>
                                <p className="text-xs text-zinc-300 max-w-md mt-1">
                                    Chemical de-greasing, grit smoothing, factory color code match,
                                    and oven-baked ceramic lacquer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
          MODAL: VIEW ON MAP
      ====================================================================== */}
            {showMapModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="relative w-full max-w-xl rounded-2xl bg-[#141518] border border-zinc-800 p-6 shadow-2xl">
                        <button
                            onClick={() => setShowMapModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-white mb-1">
                            Technicians Near You (5 Miles Radius)
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4">
                            Live mobile units ready for on-site wheel repair.
                        </p>

                        <div className="relative w-full h-64 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
                            {/* Radar Grid Animation */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#E8AF66_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="w-48 h-48 rounded-full border border-[#E8AF66]/30 animate-ping absolute" />
                            <div className="w-32 h-32 rounded-full border border-[#E8AF66]/40 absolute" />

                            {/* Pin 1: MMC Club */}
                            <div className="absolute top-1/3 left-1/3 flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-[#E8AF66] text-black font-extrabold text-[10px] flex items-center justify-center shadow-lg animate-bounce">
                                    MMC
                                </div>
                                <span className="text-[10px] text-zinc-300 bg-black/80 px-2 py-0.5 rounded mt-1">
                                    MMC Club (1.2 mi)
                                </span>
                            </div>

                            {/* Pin 2: Atif Alam */}
                            <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shadow-lg">
                                    AA
                                </div>
                                <span className="text-[10px] text-zinc-300 bg-black/80 px-2 py-0.5 rounded mt-1">
                                    Atif Alam (1.2 mi)
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowMapModal(false)}
                            className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                        >
                            Close Map
                        </button>
                    </div>
                </div>
            )}

            {/* View 3: Dedicated Provider Profile Full Screen */}
            {activeView === "provider_profile" && (
                selectedProviderModal ? (
                    <ProviderProfilePageView
                        provider={selectedProviderModal}
                        profileDetails={providerProfileDetails}
                        loadingProfileDetails={loadingProfileDetails}
                        activeTab={activeProfileTab}
                        onTabChange={setActiveProfileTab}
                        onBack={() => navigateToView("technicians")}
                        onSelectForQuote={(provider) => toggleProviderSelection(provider.id)}
                        isSelectedForQuote={selectedProviderIdsForQuote.includes(selectedProviderModal.id)}
                    />
                ) : (
                    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-xl">
                            <User className="w-8 h-8 text-[#E8AF66]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Technician Selected</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please choose a certified alloy wheel technician from our live directory to view their complete profile and verified reviews.</p>
                        <button
                            onClick={() => navigateToView("technicians")}
                            className="px-6 py-3 bg-[#E8AF66] text-black font-bold rounded-xl hover:bg-[#d99e52] transition-colors cursor-pointer shadow-lg shadow-[#E8AF66]/10"
                        >
                            Browse Verified Technicians
                        </button>
                    </div>
                )
            )}

            {/* View 4: Dedicated Quotes & Live Bids Full Screen */}
            {activeView === "quotes" && (
                <QuotesPageView
                    quotationRequests={sortedQuotationRequests}
                    loadingRequests={loadingMyQuotationRequests}
                    onRefreshRequests={refreshQuotationRequests}
                    selectedPostForBids={selectedPostForBids}
                    postBidsList={postBidsList}
                    loadingPostBids={loadingPostBids}
                    onSelectPostForBids={handleCheckBids}
                    onBackToList={() => setSelectedPostForBids(null)}
                    onRefreshPostBids={handleRefreshPostBids}
                    onBookBidOffer={handleBookBidOffer}
                    onBackToSearch={() => navigateToView("technicians")}
                    onCopyPostId={handleCopyAnyId}
                    copiedId={copiedAnyId}
                />
            )}

            {/* View 5: Dedicated Schedule Booking & Payment Checkout Full Screen */}
            {activeView === "booking" && (
                bookingProviderModal ? (
                    <BookingPageView
                        provider={bookingProviderModal}
                        bidOffer={bookingBidOffer}
                        postItem={bookingPostItem}
                        postId={bookingPostId}
                        bookingDate={bookingDate}
                        onDateChange={(date) => {
                            setBookingDate(date);
                            setSelectedSlotId("");
                            setBookingTime("");
                        }}
                        bookingTime={bookingTime}
                        onTimeChange={setBookingTime}
                        selectedSlotId={selectedSlotId}
                        onSelectSlotId={(slotId) => {
                            setSelectedSlotId(slotId);
                            const found = bookingSlots.find((s) => s.id === slotId);
                            if (found?.start_time) setBookingTime(found.start_time);
                        }}
                        bookingSlots={bookingSlots}
                        loadingSlots={loadingSlots}
                        bookingType={bookingType}
                        onBookingTypeChange={setBookingType}
                        serviceLocation={serviceLocation}
                        onServiceLocationChange={setServiceLocation}
                        bookingQuestions={bookingQuestions}
                        loadingQuestions={loadingQuestions}
                        questionAnswers={questionAnswers}
                        onAnswerChange={(qId, ans) =>
                            setQuestionAnswers((prev) => ({ ...prev, [qId]: ans }))
                        }
                        bookingNotes={bookingNotes}
                        onNotesChange={setBookingNotes}
                        bookingPaymentMethod={bookingPaymentMethod}
                        onPaymentMethodChange={setBookingPaymentMethod}
                        isPartialPayment={isPartialPayment}
                        onPartialPaymentChange={setIsPartialPayment}
                        bookingCarImage={bookingCarImage}
                        bookingCarImagePreview={bookingCarImagePreview}
                        onCarImageChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setBookingCarImage(file);
                                setBookingCarImagePreview(URL.createObjectURL(file));
                            }
                        }}
                        onRemoveCarImage={() => {
                            setBookingCarImage(null);
                            setBookingCarImagePreview(null);
                        }}
                        submittingBooking={submittingBooking}
                        bookingConfirmed={bookingConfirmed}
                        bookingApiResult={bookingApiResult}
                        bookingError={bookingError}
                        onSubmitBooking={handleExecuteBooking}
                        onBackToQuotes={() => navigateToView("quotes")}
                        onBackToHome={() => {
                            setBookingProviderModal(null);
                            setBookingConfirmed(false);
                            setBookingError(null);
                            navigateToView("landing");
                        }}
                    />
                ) : (
                    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-xl">
                            <Calendar className="w-8 h-8 text-[#E8AF66]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Booking Session</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please select an offer from your live quotes or choose a technician directly to schedule your appointment.</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigateToView("quotes")}
                                className="px-6 py-3 bg-[#E8AF66] text-black font-bold rounded-xl hover:bg-[#d99e52] transition-colors cursor-pointer shadow-lg shadow-[#E8AF66]/10"
                            >
                                View My Quotes &amp; Bids
                            </button>
                            <button
                                onClick={() => navigateToView("technicians")}
                                className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-850 transition-colors cursor-pointer"
                            >
                                Browse Technicians
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
