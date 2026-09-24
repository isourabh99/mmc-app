"use client";

import { useState, useRef, useEffect, useMemo, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
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
    Flame,
    Gauge,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import {
    getModificationServices,
    type ModificationServiceItem,
    searchModificationProviders,
    FALLBACK_MODIFICATION_PROVIDERS,
    getModificationProviderDetails,
    type ProviderItem,
    type ProviderDetailsContent,
    sendModificationQuotationRequest,
    DEFAULT_MODIFICATION_CATEGORY_ID,
    getModificationCategoryId,
    BOOKING_QUESTIONS_CATEGORY_ID,
    DEFAULT_ZONE_ID,
    getOrCreateCustomerAddressId,
    getMyModificationQuotationRequests,
    type CustomerQuotationPostItem,
    getModificationPostBids,
    type PostBidItem,
    sendModificationBookingRequest,
    getModificationProviderSlots,
    getModificationProviderQuestions,
    type BookingSlotItem,
    type BookingQuestionItem,
} from "@/lib/service/modification.api";
import ModificationStepHeader, { type ActiveView } from "./components/ModificationStepHeader";
import ModificationTechniciansView from "./components/ModificationTechniciansView";
import ModificationQuoteFormView from "./components/ModificationQuoteFormView";
import ModificationProviderProfileView from "./components/ModificationProviderProfileView";
import ModificationQuotesView from "./components/ModificationQuotesView";
import ModificationBookingView from "./components/ModificationBookingView";

export default function ModificationPage() {
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
        if (view && ["landing", "technicians", "request_quote", "quotes", "provider_profile", "booking"].includes(view)) {
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
    // Form & Location State
    // ---------------------------------------------------------------------------
    const [postcode, setPostcode] = useState("");
    const [regNo, setRegNo] = useState("");
    const [carYear, setCarYear] = useState("");
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

    // Media upload state for Hero Form
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

    // Media upload handler for Hero form
    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeroCarImage(file);
            setHeroImagePreview(URL.createObjectURL(file));
        }
    };

    // Geocoding fallback if user typed manually without selecting autocomplete suggestion
    const geocodeAddressFallback = async (query: string): Promise<{ lat: string; lon: string } | null> => {
        if (!query || !query.trim()) return null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
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
            console.warn("Geocoding fallback failed or timed out:", e);
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

    // Start Quotation Request - Opens the Quotation Form for user to review & fill details
    const handleStartMultiQuote = (targetProviderIds?: string[]) => {
        const ids = (targetProviderIds && targetProviderIds.length > 0)
            ? targetProviderIds
            : selectedProviderIdsForQuote;

        if (ids.length === 0) {
            showToast("Please select at least one workshop to request a quote.", "error");
            return;
        }

        if (targetProviderIds && targetProviderIds.length > 0) {
            setSelectedProviderIdsForQuote(targetProviderIds);
        }
        navigateToView("request_quote");
    };

    // Execute actual RFQ submission with user's form data
    const handleExecuteQuoteSubmission = async (formData: {
        carReg: string;
        carModel: string;
        selectedServiceIds: string[];
        bookingDate: string;
        bookingTime: string;
        damageDesc: string;
        serviceDesc: string;
        carImage: File | null;
    }) => {
        const idsToSend = selectedProviderIdsForQuote.length > 0
            ? selectedProviderIdsForQuote
            : (selectedQuoteProvider ? [selectedQuoteProvider.id] : []);

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
            const activeCategoryId = await getModificationCategoryId();

            const res = await sendModificationQuotationRequest({
                service_id: formData.selectedServiceIds[0] || (services[0]?.id || "default-service-id"),
                service_ids: formData.selectedServiceIds,
                category_id: activeCategoryId,
                provider_ids: idsToSend,
                service_description:
                    formData.serviceDesc ||
                    formData.damageDesc ||
                    "Vehicle modification quotation request",
                booking_schedule: scheduleStr,
                service_address_id: effectiveAddressId,
                car_model: formData.carModel || "Custom Vehicle",
                car_registration_number: formData.carReg || regNo.trim() || "BD51 SMR",
                damage_description: formData.damageDesc || "Vehicle modification specification",
                car_image: formData.carImage,
            });

            const newPostId = res?.content?.post_id;
            showToast(
                `Quotation request sent to ${idsToSend.length} workshop${idsToSend.length > 1 ? "s" : ""} successfully!`,
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
                    car_model: formData.carModel || "Custom Vehicle",
                    booking_schedule: scheduleStr,
                    bids_count: 0,
                    service_description: formData.damageDesc || formData.serviceDesc || "Vehicle modification quote",
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
            throw err;
        } finally {
            setSubmittingMultiQuote(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Dynamic Services & Providers State (Live API only)
    // ---------------------------------------------------------------------------
    const [services, setServices] = useState<ModificationServiceItem[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [providers, setProviders] = useState<ProviderItem[]>([]);
    const [searchingProviders, setSearchingProviders] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const data = await getModificationServices();
                if (isMounted) {
                    setServices(data || []);
                }
            } catch (err) {
                console.error("Error fetching modification services:", err);
            } finally {
                if (isMounted) setLoadingServices(false);
            }
        };

        fetchServices();
        return () => {
            isMounted = false;
        };
    }, []);

    // Auto-fetch providers once when in technicians view or after services load
    const hasAutoFetchedProvidersRef = useRef(false);
    useEffect(() => {
        if (activeView === "technicians" && !hasAutoFetchedProvidersRef.current && !searchingProviders) {
            hasAutoFetchedProvidersRef.current = true;
            setSearchingProviders(true);
            const effectiveLat = userLat || (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) || "51.5074";
            const effectiveLon = userLon || (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) || "-0.1278";

            const serviceIds = selectedServices
                .map((name) => services.find((s) => s.name === name)?.id)
                .filter(Boolean) as string[];

            searchModificationProviders({
                serviceIds: serviceIds.length > 0 ? serviceIds : (services.length > 0 ? [services[0].id] : []),
                latitude: effectiveLat,
                longitude: effectiveLon,
            })
                .then((results) => {
                    const list = results && results.length > 0 ? results : FALLBACK_MODIFICATION_PROVIDERS;
                    setProviders(list);
                    if (list.length > 0) {
                        setSelectedProviderIdsForQuote(list.map((p) => p.id));
                    }
                })
                .catch((err) => {
                    console.error("Auto load providers error:", err);
                    setProviders(FALLBACK_MODIFICATION_PROVIDERS);
                    setSelectedProviderIdsForQuote(FALLBACK_MODIFICATION_PROVIDERS.map((p) => p.id));
                })
                .finally(() => {
                    setSearchingProviders(false);
                });
        }
    }, [activeView, searchingProviders, services, selectedServices, userLat, userLon]);

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
    const [bookingPaymentMethod, setBookingPaymentMethod] = useState<"cash_after_service" | "stripe">("cash_after_service");
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

        getModificationProviderSlots(bookingProviderModal.id, bookingDate)
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

    // Fetch provider additional questions strictly from API: GET /customer/booking/provider/questions
    useEffect(() => {
        if (!bookingProviderModal?.id) {
            setBookingQuestions([]);
            return;
        }
        let isMounted = true;
        setLoadingQuestions(true);
        const catId = bookingPostItem?.category_id || BOOKING_QUESTIONS_CATEGORY_ID;
        getModificationProviderQuestions(bookingProviderModal.id, catId)
            .then((questions) => {
                if (isMounted) {
                    const activeQuestions = (questions || [])
                        .filter((q) => q.is_active !== false && q.is_active !== 0)
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                    setBookingQuestions(activeQuestions);
                }
            })
            .catch((err) => {
                console.error("Error fetching provider questions:", err);
                if (isMounted) setBookingQuestions([]);
            })
            .finally(() => {
                if (isMounted) setLoadingQuestions(false);
            });

        return () => {
            isMounted = false;
        };
    }, [bookingProviderModal?.id, bookingPostItem?.category_id]);

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

    // Sort requests: Items with received bids (bids_count > 0) appear at the TOP
    const sortedQuotationRequests = useMemo(() => {
        return [...myQuotationRequests].sort((a, b) => {
            const aCount = a.bids_count || 0;
            const bCount = b.bids_count || 0;
            if (aCount > 0 && bCount === 0) return -1;
            if (aCount === 0 && bCount > 0) return 1;
            if (aCount !== bCount) return bCount - aCount;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
        });
    }, [myQuotationRequests]);

    const refreshQuotationRequests = async () => {
        setLoadingMyQuotationRequests(true);
        try {
            const list = await getMyModificationQuotationRequests(10, 1);
            if (list && list.length > 0) {
                setMyQuotationRequests(list);
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

    const handleCheckBids = async (post: CustomerQuotationPostItem) => {
        setSelectedPostForBids(post);
        setLoadingPostBids(true);
        try {
            const bids = await getModificationPostBids(post.id, 10, 1);
            setPostBidsList(bids || []);
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
            const bids = await getModificationPostBids(selectedPostForBids.id, 10, 1);
            setPostBidsList(bids || []);
        } catch (err) {
            console.error("Failed to refresh bids:", err);
        } finally {
            setLoadingPostBids(false);
        }
    };

    const handleBookBidOffer = (bid: PostBidItem) => {
        const post = selectedPostForBids;
        const targetPostId = bid.post_id || post?.id || "";

        const priceNum =
            typeof bid.offered_price === "number"
                ? bid.offered_price
                : parseFloat(bid.offered_price || "0");

        const matchedService = services.find(
            (s) => s.id === post?.service_id || s.name === post?.service_description
        );

        const providerToBook: ProviderItem = {
            ...(bid.provider as any),
            id: bid.provider.id,
            user_id: bid.provider.user_id,
            company_name: bid.provider.company_name,
            company_phone: bid.provider.company_phone,
            company_address: bid.provider.company_address,
            company_email: bid.provider.company_email,
            logo: bid.provider.logo,
            logo_full_path: bid.provider.logo_full_path,
            contact_person_name: bid.provider.contact_person_name,
            contact_person_phone: bid.provider.contact_person_phone,
            contact_person_email: bid.provider.contact_person_email,
            avg_rating: bid.provider.avg_rating || 0,
            rating_count: bid.provider.rating_count || 0,
            is_active: bid.provider.is_active || 1,
            is_emergency_active: bid.provider.is_emergency_active || 0,
            selected_services: bid.provider.selected_services || (bid as any).services || (matchedService ? [matchedService as any] : []),
            total_selected_services_price: priceNum,
            ...((bid.provider as any)?.delivery_type ? { delivery_type: (bid.provider as any).delivery_type } : {}),
            ...((bid.provider as any)?.service_location ? { service_location: (bid.provider as any).service_location } : {}),
            ...((matchedService as any)?.delivery_type ? { delivery_type: (matchedService as any).delivery_type } : {}),
            ...((matchedService as any)?.service_location ? { service_location: (matchedService as any).service_location } : {}),
        };

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
        setSelectedPostForBids(null);
        setBookingProviderModal(providerToBook);
        navigateToView("booking");
    };

    // Final submit via selected payment method
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

        const formattedSchedule = `${bookingDate} ${bookingTime || "10:00:00"}`.trim();

        // Compile question answers into notes
        const qaSummary = bookingQuestions
            .filter((q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== "")
            .map((q) => `${q.question_text || q.question}: ${questionAnswers[q.id]}`)
            .join("\n");

        const combinedNotes = [bookingNotes.trim(), qaSummary ? `[Additional Questions]\n${qaSummary}` : ""]
            .filter(Boolean)
            .join("\n\n");

        try {
            const res = await sendModificationBookingRequest({
                post_id: effectivePostId,
                provider_id: bookingProviderModal.id,
                date: bookingDate,
                payment_method: bookingPaymentMethod,
                service_location: serviceLocation,
                service_schedule: formattedSchedule,
                booking_type: bookingType,
                selected_slot_id: selectedSlotId,
                service_address_id: serviceAddressId || "6",
                notes: combinedNotes,
                car_image: bookingCarImage,
                payment_platform: bookingPaymentMethod === "stripe" ? "web" : undefined,
                callback:
                    bookingPaymentMethod === "stripe"
                        ? "https://mmcclub.co.uk/api/v1/digital-payment-booking-response"
                        : undefined,
            });

            // Extract redirect URL for Stripe if returned
            const redirectUrl =
                res.content?.redirect_url ||
                res.content?.payment_url ||
                res.content?.url ||
                res.content?.link ||
                res.content?.payment_link ||
                (res as any).redirect_url ||
                (res as any).payment_url ||
                (res as any).url ||
                (typeof res.content === "string" && res.content.startsWith("http") ? res.content : null);

            // Online Payment (Stripe) -> Redirect to Stripe Checkout page
            if (bookingPaymentMethod === "stripe") {
                if (redirectUrl) {
                    try {
                        sessionStorage.setItem(
                            "mmc_pending_booking",
                            JSON.stringify({
                                booking_id: res.content?.booking_id,
                                readable_id: res.content?.readable_id,
                                provider: bookingProviderModal,
                                schedule: formattedSchedule,
                                price: bookingBidOffer?.offered_price || bookingProviderModal.total_selected_services_price,
                            })
                        );
                    } catch { }

                    showToast("Redirecting to Stripe secure checkout...", "info");
                    window.location.href = redirectUrl;
                    return;
                } else if (res.errors) {
                    let errMsg = "Stripe checkout could not be initiated";
                    if (Array.isArray(res.errors)) {
                        errMsg = res.errors.map((e: any) => e.message || JSON.stringify(e)).join(", ");
                    } else if (typeof res.errors === "string") {
                        errMsg = res.errors;
                    } else if (res.message) {
                        errMsg = res.message;
                    }
                    setBookingError(errMsg);
                    showToast(errMsg, "error");
                    return;
                } else {
                    const errMsg = res.message || "Stripe payment link not received. Please try again or select Cash After Service.";
                    setBookingError(errMsg);
                    showToast(errMsg, "error");
                    return;
                }
            }

            // Cash After Service -> Direct booking confirmation
            const isSuccess =
                res.response_code === "booking_place_success_200" ||
                res.response_code === "default_200" ||
                res.response_code === "booking_success_200" ||
                res.content?.flag === "success" ||
                Boolean(res.content?.booking_id);

            if (isSuccess) {
                setBookingApiResult(res.content || res);
                setBookingConfirmed(true);
                const refId = res.content?.readable_id || res.content?.booking_id || "";
                showToast(`Modification Appointment Placed! ${refId ? `Ref: #${refId}` : ""}`, "success");
            } else if (res.errors) {
                let errMsg = "Failed to confirm booking";
                if (Array.isArray(res.errors)) {
                    errMsg = res.errors.map((e: any) => e.message || JSON.stringify(e)).join(", ");
                } else if (typeof res.errors === "string") {
                    errMsg = res.errors;
                } else if (res.message) {
                    errMsg = res.message;
                }
                setBookingError(errMsg);
                showToast(errMsg, "error");
            } else {
                setBookingApiResult(res);
                setBookingConfirmed(true);
                showToast(res.message || "Booking request processed!", "success");
            }
        } catch (err: any) {
            const apiMsg = err?.response?.data?.errors || err?.response?.data?.message || err?.message || "Booking request failed";
            const formattedMsg = Array.isArray(apiMsg)
                ? apiMsg.map((e: any) => e.message || JSON.stringify(e)).join(", ")
                : typeof apiMsg === "string"
                    ? apiMsg
                    : JSON.stringify(apiMsg);
            setBookingError(formattedMsg);
            showToast(`Error: ${formattedMsg}`, "error");
        } finally {
            setSubmittingBooking(false);
        }
    };

    const handleOpenQuoteForm = (provider: ProviderItem) => {
        setSelectedQuoteProvider(provider);
        setSelectedProviderIdsForQuote((prev) =>
            prev.includes(provider.id) ? prev : [...prev, provider.id]
        );
        navigateToView("request_quote");
    };

    const handleOpenProviderProfile = async (provider: ProviderItem) => {
        setSelectedProviderModal(provider);
        setProviderProfileDetails(null);
        setLoadingProfileDetails(true);
        setActiveProfileTab("overview");
        navigateToView("provider_profile");
        try {
            const data = await getModificationProviderDetails(provider.id);
            setProviderProfileDetails(data);
        } catch (err) {
            console.error("Failed to fetch provider details:", err);
        } finally {
            setLoadingProfileDetails(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Handle Quote Submit (Search Providers by Service from API only)
    // ---------------------------------------------------------------------------
    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postcode) {
            showToast("Please enter your postcode or location", "error");
            return;
        }
        if (!regNo) {
            showToast("Please enter your vehicle registration number", "error");
            return;
        }
        if (selectedServices.length === 0) {
            showToast("Please choose at least one modification service", "error");
            return;
        }
        if (!privacyAgreed) {
            showToast("Please agree to the privacy policy to proceed", "error");
            return;
        }

        setSubmitting(true);
        setSearchingProviders(true);
        hasAutoFetchedProvidersRef.current = true;
        setHasSearched(true);
        navigateToView("technicians");

        try {
            let currentLat = userLat || (typeof window !== "undefined" ? localStorage.getItem("user_lat") : "");
            let currentLon = userLon || (typeof window !== "undefined" ? localStorage.getItem("user_lon") : "");

            if (!currentLat || !currentLon) {
                const geo = await geocodeAddressFallback(postcode);
                if (geo) {
                    currentLat = geo.lat;
                    currentLon = geo.lon;
                }
            }

            const serviceIds = selectedServices
                .map((name) => services.find((s) => s.name === name)?.id)
                .filter(Boolean) as string[];

            const results = await searchModificationProviders({
                serviceIds: serviceIds.length > 0 ? serviceIds : (services.length > 0 ? [services[0].id] : ["919cdcb9-4100-45d9-b12f-a84f7cad0a55"]),
                latitude: currentLat || "51.5074",
                longitude: currentLon || "-0.1278",
            });

            const list = results && results.length > 0 ? results : FALLBACK_MODIFICATION_PROVIDERS;
            setProviders(list);

            if (list.length > 0) {
                setSelectedProviderIdsForQuote(list.map((p) => p.id));
            } else {
                setSelectedProviderIdsForQuote([]);
            }
        } catch (err) {
            console.error("Provider search failed:", err);
            setProviders(FALLBACK_MODIFICATION_PROVIDERS);
            setSelectedProviderIdsForQuote(FALLBACK_MODIFICATION_PROVIDERS.map((p) => p.id));
        } finally {
            setSubmitting(false);
            setSearchingProviders(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#E8AF66] selection:text-black">
            {/* Top Navigation Step Header for dedicated screens */}
            {activeView !== "landing" && (
                <ModificationStepHeader
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
                        {/* Background Ambient Glow Layer */}
                        <div className="absolute right-0 top-12 w-full lg:w-2/3 h-full pointer-events-none opacity-20 select-none z-0">
                            <div className="w-full h-full bg-[radial-gradient(#E8AF66_1px,transparent_1px)] [background-size:24px_24px]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
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
                                Vehicle Modifications &amp; Tuning
                            </span>
                        </nav>

                        {/* Hero Grid */}
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
                            {/* Left Column: Heading, Badges, Video Card */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8AF66]/10 border border-[#E8AF66]/20 text-[#E8AF66] text-xs font-bold uppercase tracking-wider mb-4">
                                        <Flame className="w-3.5 h-3.5 text-[#E8AF66]" />
                                        <span>Bespoke Engineering &amp; Customization</span>
                                    </div>

                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-5">
                                        Vehicle <br />
                                        <span
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #FAD293 0%, #E8AF66 50%, #CEA46B 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            Modifications &amp; Tuning
                                        </span>
                                    </h1>

                                    <p className="text-zinc-300 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
                                        Transform your vehicle with verified performance remapping, custom exhaust systems, aerodynamic styling kits, and precision bespoke upgrades.
                                    </p>

                                    {/* 3 Badges */}
                                    <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-10">
                                        {/* Badge 1 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Gauge className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Power &amp; Torque</h4>
                                                <p className="text-xs text-zinc-400">ECU Stage 1 &amp; 2</p>
                                            </div>
                                        </div>

                                        {/* Badge 2 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Road Legal</h4>
                                                <p className="text-xs text-zinc-400">Certified Workshops</p>
                                            </div>
                                        </div>

                                        {/* Badge 3 */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-[#E8AF66] shadow-[0_0_20px_rgba(232,175,102,0.15)]">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Bespoke Styling</h4>
                                                <p className="text-xs text-zinc-400">Aero &amp; Bodykits</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Highlight Card */}
                                <div className="relative group rounded-2xl border border-zinc-800/90 bg-[#121316]/90 p-5 sm:p-6 backdrop-blur-md overflow-hidden max-w-xl shadow-2xl transition-all duration-300 hover:border-zinc-700">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                        <div className="z-10 flex-1">
                                            <span className="inline-block text-xs font-bold tracking-widest text-[#E8AF66] uppercase mb-1">
                                                Custom Category
                                            </span>
                                            <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-white uppercase leading-snug">
                                                PERFORMANCE &amp; <br className="hidden sm:block" />
                                                AESTHETIC UPGRADES
                                            </h3>
                                            <p className="text-[11px] tracking-widest text-zinc-400 font-medium mt-1.5 uppercase">
                                                POWER &bull; SOUND &bull; STANCE &bull; STYLE
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-2 font-normal">
                                                Direct quotes from verified garages with dyno facilities and fabrication bays.
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/60 border border-zinc-800 text-center shrink-0">
                                            <Wrench className="w-8 h-8 text-[#E8AF66] mb-1" />
                                            <span className="text-xs font-black text-white">Full Build</span>
                                            <span className="text-[10px] text-zinc-400">Support</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Hero Quote Calculator Form */}
                            <div className="lg:col-span-5">
                                <div className="rounded-3xl bg-[#141518] border border-zinc-800/90 p-6 sm:p-8 shadow-2xl relative">
                                    <h3 className="text-xl sm:text-2xl font-black text-white">
                                        Request Modification Quotes
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1 mb-6">
                                        Select your required upgrades and receive competitive offers
                                    </p>

                                    <form onSubmit={handleQuoteSubmit} className="space-y-4">
                                        {/* Row 1: Enter Postcode / Location */}
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

                                        {/* Row 2: Car Registration No & Year */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                    <Car className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={regNo}
                                                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                                                    placeholder="Registration No"
                                                    className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-[#E8AF66] transition-colors"
                                                />
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                    <Calendar className="w-4 h-4 text-[#E8AF66]" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={carYear}
                                                    onChange={(e) => setCarYear(e.target.value)}
                                                    placeholder="Year (e.g. 2022)"
                                                    className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Multi-Select Modification Services */}
                                        <div className="relative" ref={dropdownRef}>
                                            <div
                                                onClick={() => {
                                                    setShowServicesDropdown((prev) => !prev);
                                                    if (services.length === 0) {
                                                        setLoadingServices(true);
                                                        getModificationServices().then((data) => {
                                                            if (data && data.length > 0) setServices(data);
                                                            setLoadingServices(false);
                                                        });
                                                    }
                                                }}
                                                className={`w-full bg-[#1B1C20] border rounded-xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white cursor-pointer transition-colors flex items-center justify-between min-h-[46px] ${showServicesDropdown
                                                        ? "border-[#E8AF66] shadow-[0_0_15px_rgba(232,175,102,0.15)]"
                                                        : "border-zinc-800/90 hover:border-zinc-700"
                                                    }`}
                                            >
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                    <Wrench className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 pr-2">
                                                    {selectedServices.length === 0 ? (
                                                        <span className="text-zinc-400 select-none">
                                                            {loadingServices
                                                                ? "Loading services..."
                                                                : "Select Modification Services"}
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5 py-0.5">
                                                            {selectedServices.map((name) => (
                                                                <span
                                                                    key={name}
                                                                    className="inline-flex items-center gap-1 bg-[#E8AF66]/20 border border-[#E8AF66]/40 text-[#E8AF66] text-xs px-2.5 py-0.5 rounded-lg font-medium shadow-sm"
                                                                >
                                                                    <span>{name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => removeService(name, e)}
                                                                        className="hover:text-white transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                                                    <ChevronDown
                                                        className={`w-4 h-4 transition-transform duration-200 ${showServicesDropdown ? "rotate-180 text-[#E8AF66]" : ""
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Dropdown Menu Popover */}
                                            {showServicesDropdown && (
                                                <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#16171A] border border-zinc-700/80 rounded-xl shadow-2xl p-2 max-h-64 overflow-y-auto backdrop-blur-xl animate-fade-in space-y-1">
                                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800 text-[11px] text-zinc-400">
                                                        <span>
                                                            {selectedServices.length === 0
                                                                ? "Select one or more modifications"
                                                                : `${selectedServices.length} selected`}
                                                        </span>
                                                        {selectedServices.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedServices([])}
                                                                className="text-[#E8AF66] hover:underline font-semibold"
                                                            >
                                                                Clear all
                                                            </button>
                                                        )}
                                                    </div>

                                                    {loadingServices ? (
                                                        <div className="py-6 flex flex-col items-center justify-center text-zinc-400 gap-2">
                                                            <RefreshCw className="w-5 h-5 animate-spin text-[#E8AF66]" />
                                                            <span className="text-xs">Loading modification services...</span>
                                                        </div>
                                                    ) : services.length === 0 ? (
                                                        <div className="py-6 text-center text-zinc-400 space-y-2">
                                                            <p className="text-xs">No services loaded.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setLoadingServices(true);
                                                                    getModificationServices().then((res) => {
                                                                        setServices(res || []);
                                                                        setLoadingServices(false);
                                                                    });
                                                                }}
                                                                className="text-xs text-[#E8AF66] underline hover:text-[#f3c68a] font-semibold"
                                                            >
                                                                Retry Loading
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        services.map((item) => {
                                                            const isSelected = selectedServices.includes(item.name);
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => toggleService(item.name)}
                                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm select-none ${isSelected
                                                                            ? "bg-[#E8AF66]/15 text-[#E8AF66] font-semibold"
                                                                            : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div
                                                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                                                                    ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                                                                    : "border-zinc-600 bg-zinc-900"
                                                                                }`}
                                                                        >
                                                                            {isSelected && (
                                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                                            )}
                                                                        </div>
                                                                        <span>{item.name}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 4: Describe modification requirements */}
                                        <div className="relative">
                                            <div className="absolute top-3.5 left-3.5 pointer-events-none text-zinc-400">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={damageDesc}
                                                onChange={(e) => setDamageDesc(e.target.value)}
                                                placeholder="Build scope (e.g. Stage 1 Remap, Exhaust, Aero Splitter)"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors resize-none"
                                            />
                                        </div>

                                        {/* Row 5: Upload Vehicle Photo */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Camera className="w-3.5 h-3.5 text-[#E8AF66]" />
                                                    <span>Upload Vehicle / Build Photo (Optional)</span>
                                                </span>
                                                {heroCarImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setHeroCarImage(null);
                                                            setHeroImagePreview(null);
                                                        }}
                                                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {heroImagePreview ? (
                                                <div className="relative rounded-xl border border-zinc-700 bg-zinc-900/80 p-2 flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={heroImagePreview}
                                                            alt="Vehicle Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-xs">
                                                        <p className="text-white font-medium truncate">{heroCarImage?.name}</p>
                                                        <p className="text-[10px] text-zinc-400 mt-0.5">
                                                            {heroCarImage ? (heroCarImage.size / 1024).toFixed(0) + " KB" : ""} • Attached for quote
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setHeroCarImage(null);
                                                            setHeroImagePreview(null);
                                                        }}
                                                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 hover:border-[#E8AF66]/70 rounded-xl bg-[#1B1C20]/60 hover:bg-[#1B1C20] cursor-pointer transition-colors group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleHeroImageChange}
                                                    />
                                                    <CloudUpload className="w-4 h-4 text-[#E8AF66]" />
                                                    <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                                                        Attach vehicle / part photo
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500">(JPG, PNG)</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Row 6: Privacy Policy Checkbox */}
                                        <div className="flex items-center gap-2.5 pt-1">
                                            <input
                                                type="checkbox"
                                                id="mod-privacy-check"
                                                checked={privacyAgreed}
                                                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E8AF66] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#E8AF66]"
                                            />
                                            <label
                                                htmlFor="mod-privacy-check"
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

                                        {/* Row 7: Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full mt-3 bg-[#E8AF66] hover:bg-[#d99f55] active:scale-[0.99] text-zinc-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                                        >
                                            {submitting ? (
                                                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>GET MODIFICATION QUOTES</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* View 2: Dedicated Technicians Discovery Full Screen */}
            {activeView === "technicians" && (
                <ModificationTechniciansView
                    providers={providers}
                    searchingProviders={searchingProviders}
                    selectedProviderIdsForQuote={selectedProviderIdsForQuote}
                    onToggleProviderSelection={toggleProviderSelection}
                    onToggleSelectAll={toggleSelectAllProviders}
                    onOpenProviderProfile={handleOpenProviderProfile}
                    onOpenQuoteForm={handleOpenQuoteForm}
                    onSendMultiQuoteRequest={() => handleStartMultiQuote()}
                    submittingMultiQuote={submittingMultiQuote}
                    onBackToSearch={() => navigateToView("landing")}
                    onViewQuotes={() => navigateToView("quotes")}
                    regNo={regNo}
                    postcode={postcode}
                    selectedServices={selectedServices}
                />
            )}

            {/* View 2.5: Dedicated Quotation Form Screen */}
            {activeView === "request_quote" && (
                <ModificationQuoteFormView
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
                    initialCarYear={carYear}
                    initialDamageDesc={damageDesc}
                    initialCarImage={heroCarImage}
                    initialCarImagePreview={heroImagePreview}
                    submitting={submittingMultiQuote}
                    onBack={() => navigateToView("technicians")}
                    onSubmit={handleExecuteQuoteSubmission}
                />
            )}

            {/* View 3: Dedicated Provider Profile Full Screen */}
            {activeView === "provider_profile" && (
                selectedProviderModal ? (
                    <ModificationProviderProfileView
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
                        <h3 className="text-xl font-bold text-white mb-2">No Workshop Selected</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please choose a verified vehicle modification workshop to inspect credentials and portfolios.</p>
                        <button
                            onClick={() => navigateToView("technicians")}
                            className="px-6 py-3 bg-[#E8AF66] text-black font-bold rounded-xl hover:bg-[#d99e52] transition-colors cursor-pointer shadow-lg shadow-[#E8AF66]/10"
                        >
                            Browse Certified Workshops
                        </button>
                    </div>
                )
            )}

            {/* View 4: Dedicated Quotes & Live Bids Full Screen */}
            {activeView === "quotes" && (
                <ModificationQuotesView
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
                />
            )}

            {/* View 5: Dedicated Schedule Booking & Payment Checkout Full Screen */}
            {activeView === "booking" && (
                bookingProviderModal ? (
                    <ModificationBookingView
                        provider={bookingProviderModal}
                        bidOffer={bookingBidOffer}
                        postItem={bookingPostItem}
                        postId={bookingPostId}
                        services={services}
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
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please accept a quote offer from your live quotes dashboard to schedule your appointment.</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigateToView("quotes")}
                                className="px-6 py-3 bg-[#E8AF66] text-black font-bold rounded-xl hover:bg-[#d99e52] transition-colors cursor-pointer shadow-lg shadow-[#E8AF66]/10"
                            >
                                View My Quotes &amp; Offers
                            </button>
                            <button
                                onClick={() => navigateToView("technicians")}
                                className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-850 transition-colors cursor-pointer"
                            >
                                Browse Specialists
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
