"use client";

import { useState, useRef, useEffect, useMemo, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Sparkles,
    Shield,
    Crown,
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
    AlertCircle,
    Building2,
    Truck,
    Info,
    Smartphone,
    Send,
    Camera,
    CloudUpload,
    X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import {
    getBodyworkServices,
    type BodyworkServiceItem,
    searchBodyworkProviders,
    getProviderDetails,
    type ProviderItem,
    type ProviderDetailsContent,
    sendQuotationRequest,
    DEFAULT_BODYWORK_CATEGORY_ID,
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
} from "@/lib/service/bodywork.api";
import BodyworkStepHeader, { type ActiveView } from "./components/BodyworkStepHeader";
import BodyworkTechniciansView from "./components/BodyworkTechniciansView";
import BodyworkQuoteFormView from "./components/BodyworkQuoteFormView";
import BodyworkProviderProfileView from "./components/BodyworkProviderProfileView";
import BodyworkQuotesView from "./components/BodyworkQuotesView";
import BodyworkBookingView from "./components/BodyworkBookingView";

export default function BodyworkPage() {
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
    // Form & Provider State
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

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeroCarImage(file);
            setHeroImagePreview(URL.createObjectURL(file));
        }
    };

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

    const toggleProviderSelection = (id: string) => {
        setSelectedProviderIdsForQuote((prev) =>
            prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
        );
    };

    const toggleSelectAllProviders = () => {
        if (providers.length === 0) return;
        if (selectedProviderIdsForQuote.length === providers.length) {
            setSelectedProviderIdsForQuote([]);
        } else {
            setSelectedProviderIdsForQuote(providers.map((p) => p.id));
        }
    };

    // Close dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowServicesDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---------------------------------------------------------------------------
    // Fetch Bodywork Services from Backend API
    // ---------------------------------------------------------------------------
    const [services, setServices] = useState<BodyworkServiceItem[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getBodyworkServices()
            .then((data) => {
                if (isMounted) {
                    setServices(data || []);
                }
            })
            .catch((err) => {
                console.error("Failed to load services:", err);
            })
            .finally(() => {
                if (isMounted) setLoadingServices(false);
            });

        return () => {
            isMounted = false;
        };
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

    // Providers Search List State
    const [providers, setProviders] = useState<ProviderItem[]>([]);
    const [searchingProviders, setSearchingProviders] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Selected Provider Profile View State
    const [selectedProviderModal, setSelectedProviderModal] = useState<ProviderItem | null>(null);
    const [providerProfileDetails, setProviderProfileDetails] = useState<ProviderDetailsContent | null>(null);
    const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);
    const [activeProfileTab, setActiveProfileTab] = useState<"overview" | "services" | "reviews">("overview");

    // Interactive Map state
    const [showMapModal, setShowMapModal] = useState(false);

    // Booking state
    const [bookingProviderModal, setBookingProviderModal] = useState<ProviderItem | null>(null);
    const [bookingBidOffer, setBookingBidOffer] = useState<PostBidItem | null>(null);
    const [bookingPostItem, setBookingPostItem] = useState<CustomerQuotationPostItem | null>(null);
    const [bookingPostId, setBookingPostId] = useState("");
    const [bookingDate, setBookingDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    });
    const [bookingTime, setBookingTime] = useState("10:00:00");
    const [selectedSlotId, setSelectedSlotId] = useState("");
    const [bookingSlots, setBookingSlots] = useState<BookingSlotItem[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingType, setBookingType] = useState<"normal" | "emergency">("normal");
    const [serviceLocation, setServiceLocation] = useState<"customer" | "workshop">("customer");
    const [bookingNotes, setBookingNotes] = useState("");
    const [bookingPaymentMethod, setBookingPaymentMethod] = useState("stripe");
    const [bookingCarImage, setBookingCarImage] = useState<File | null>(null);
    const [bookingCarImagePreview, setBookingCarImagePreview] = useState<string | null>(null);
    const [submittingBooking, setSubmittingBooking] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingApiResult, setBookingApiResult] = useState<any>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [serviceAddressId, setServiceAddressId] = useState("");

    // Provider Questions
    const [bookingQuestions, setBookingQuestions] = useState<BookingQuestionItem[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

    // Fetch provider slots
    useEffect(() => {
        if (!bookingProviderModal?.id) {
            setBookingSlots([]);
            return;
        }
        let isMounted = true;
        setLoadingSlots(true);
        getProviderSlots(bookingProviderModal.id, bookingDate)
            .then((slots) => {
                if (isMounted) {
                    setBookingSlots(slots);
                    const firstAvail = slots.find((s) => s.is_available);
                    if (firstAvail) {
                        setSelectedSlotId(firstAvail.id);
                        if (firstAvail.start_time) setBookingTime(firstAvail.start_time);
                    }
                }
            })
            .catch((err) => {
                console.error("Error fetching provider slots:", err);
            })
            .finally(() => {
                if (isMounted) setLoadingSlots(false);
            });

        return () => {
            isMounted = false;
        };
    }, [bookingProviderModal?.id, bookingDate]);

    // Fetch provider questions
    useEffect(() => {
        if (!bookingProviderModal?.id) {
            setBookingQuestions([]);
            return;
        }
        let isMounted = true;
        setLoadingQuestions(true);
        const catId = bookingPostItem?.category_id || BOOKING_QUESTIONS_CATEGORY_ID;
        getProviderQuestions(bookingProviderModal.id, catId)
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
                showToast("Payment was not completed. Please try again or choose Payment on Completion.", "error");
            }
        } catch (e) {
            console.error("Error checking Stripe callback params:", e);
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Quotes & Bids Management
    // ---------------------------------------------------------------------------
    const [selectedQuoteProvider, setSelectedQuoteProvider] = useState<ProviderItem | null>(null);
    const [myQuotationRequests, setMyQuotationRequests] = useState<CustomerQuotationPostItem[]>([]);
    const [loadingMyQuotationRequests, setLoadingMyQuotationRequests] = useState(false);
    const [selectedPostForBids, setSelectedPostForBids] = useState<CustomerQuotationPostItem | null>(null);
    const [postBidsList, setPostBidsList] = useState<PostBidItem[]>([]);
    const [loadingPostBids, setLoadingPostBids] = useState(false);
    const [copiedAnyId, setCopiedAnyId] = useState<string | null>(null);

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
            const res = await getMyQuotationRequests(30, 1);
            setMyQuotationRequests(res || []);
        } catch (err) {
            console.error("Failed to load quotation requests:", err);
        } finally {
            setLoadingMyQuotationRequests(false);
        }
    };

    useEffect(() => {
        refreshQuotationRequests();
    }, []);

    const handleCopyAnyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedAnyId(id);
        setTimeout(() => setCopiedAnyId(null), 2000);
    };

    const handleCheckBids = async (post: CustomerQuotationPostItem) => {
        setSelectedPostForBids(post);
        setLoadingPostBids(true);
        setPostBidsList([]);
        try {
            const bids = await getReceivedBidsForPost(post.id, 10, 1);
            setPostBidsList(bids || []);
        } catch (err) {
            console.error("Failed to load bids for post:", err);
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
        } catch (err) {
            console.error("Failed to refresh bids:", err);
        } finally {
            setLoadingPostBids(false);
        }
    };

    const handleBookBidOffer = (bid: PostBidItem) => {
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
        setSelectedPostForBids(null);
        setBookingProviderModal(providerToBook);
        navigateToView("booking");
    };

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

        const qaSummary = bookingQuestions
            .filter((q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== "")
            .map((q) => `${q.question_text || q.question}: ${questionAnswers[q.id]}`)
            .join("\n");

        const combinedNotes = [bookingNotes.trim(), qaSummary ? `[Specialist Questions]\n${qaSummary}` : ""]
            .filter(Boolean)
            .join("\n\n");

        try {
            const res = await sendBookingRequest({
                post_id: effectivePostId,
                provider_id: bookingProviderModal.id,
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

            const redirectUrl =
                res.content?.redirect_url ||
                res.content?.payment_url ||
                res.content?.url ||
                (typeof res.content === "string" && res.content.startsWith("http") ? res.content : null);

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
                }
            }

            setBookingApiResult(res.content || res);
            setBookingConfirmed(true);
            const refId = res.content?.readable_id || res.content?.booking_id || "";
            showToast(`Booking Placed successfully! ${refId ? `Ref: #${refId}` : ""}`, "success");
        } catch (err: any) {
            const apiMsg = err?.response?.data?.errors || err?.response?.data?.message || err?.message || "Booking request failed";
            const formattedMsg = typeof apiMsg === "string" ? apiMsg : JSON.stringify(apiMsg);
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
        const handleMouseMove = (e: globalThis.MouseEvent) => {
            if (!isDragging) return;
            handleSliderMove(e.clientX);
        };
        const handleTouchMove = (e: globalThis.TouchEvent) => {
            if (!isDragging) return;
            handleSliderMove(e.touches[0].clientX);
        };
        const handleStop = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleStop);
            window.addEventListener("touchmove", handleTouchMove);
            window.addEventListener("touchend", handleStop);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleStop);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleStop);
        };
    }, [isDragging]);

    // ---------------------------------------------------------------------------
    // Multi-Provider Batch Quote Submission Handler
    // ---------------------------------------------------------------------------
    const handleSendMultiQuoteRequest = async () => {
        if (selectedProviderIdsForQuote.length === 0) {
            showToast("Please select at least one specialist from the list", "error");
            return;
        }

        setSubmittingMultiQuote(true);
        try {
            let addrId = serviceAddressId;
            if (!addrId) {
                try {
                    addrId = await getOrCreateCustomerAddressId(
                        postcode || "London, UK",
                        userLat || "51.5074",
                        userLon || "-0.1278"
                    );
                } catch {
                    addrId = "6";
                }
                if (addrId) setServiceAddressId(addrId);
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const scheduleDate = tomorrow.toISOString().split("T")[0] + " 10:00:00";

            let serviceIds = selectedServices
                .map((name) => services.find((s) => s.name === name)?.id)
                .filter(Boolean) as string[];

            if (serviceIds.length === 0 && services.length > 0) {
                serviceIds = [services[0].id];
            }

            const primaryServiceId =
                serviceIds[0] ||
                services[0]?.id ||
                "e1fb2dae-c233-4b45-852b-8253373e06d7";

            const selectedNames = selectedServices.length > 0 ? selectedServices.join(", ") : "Bodywork & Paint Repair";

            const res = await sendQuotationRequest({
                service_id: primaryServiceId,
                service_ids: serviceIds.length > 0 ? serviceIds : [primaryServiceId],
                category_id: DEFAULT_BODYWORK_CATEGORY_ID,
                provider_ids: selectedProviderIdsForQuote,
                car_model: "Vehicle",
                car_registration_number: regNo.trim().toUpperCase() || "BD51 SMR",
                service_description: damageDesc.trim() || `Requesting quotes for: ${selectedNames}`,
                damage_description: damageDesc.trim() || `Requesting quotes for: ${selectedNames}`,
                booking_schedule: scheduleDate,
                service_address_id: addrId || "6",
                car_image: heroCarImage,
            });

            showToast(`Quotation request sent to ${selectedProviderIdsForQuote.length} bodyshops!`, "success");
            await refreshQuotationRequests();
            navigateToView("quotes");
        } catch (err: any) {
            console.error("Multi quote error:", err);
            showToast("Opening quotation review form...", "info");
            navigateToView("request_quote");
        } finally {
            setSubmittingMultiQuote(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Primary Search Handler from Hero
    // ---------------------------------------------------------------------------
    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!postcode.trim()) {
            showToast("Please enter your postcode or city", "error");
            return;
        }

        if (!regNo.trim()) {
            showToast("Please enter your vehicle registration number", "error");
            return;
        }

        if (selectedServices.length === 0) {
            showToast("Please choose at least one bodywork repair service", "error");
            return;
        }

        if (!privacyAgreed) {
            showToast("Please agree to the privacy policy to proceed", "error");
            return;
        }

        setSubmitting(true);
        setSearchingProviders(true);
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

            const results = await searchBodyworkProviders({
                serviceIds: serviceIds,
                latitude: currentLat || undefined,
                longitude: currentLon || undefined,
            });

            setProviders(results || []);

            if (results && results.length > 0) {
                setSelectedProviderIdsForQuote(results.map((p) => p.id));
            } else {
                setSelectedProviderIdsForQuote([]);
            }
        } catch (err) {
            console.error("Provider search failed:", err);
            setProviders([]);
            showToast("Could not retrieve specialists. Please try again.", "error");
        } finally {
            setSubmitting(false);
            setSearchingProviders(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FAD293] selection:text-black">
            {/* Top Navigation Step Header for dedicated views */}
            {activeView !== "landing" && (
                <BodyworkStepHeader
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
                    {/* Hero Section */}
                    <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
                        {/* Background Ambient Car Image */}
                        <div className="absolute right-0 top-10 w-full lg:w-2/3 h-full pointer-events-none opacity-25 lg:opacity-40 select-none z-0">
                            <Image
                                src="/images/bodywork/hero_bodywork_car.jpg"
                                alt="Bodywork Spray Booth"
                                fill
                                priority
                                className="object-cover object-center lg:object-right"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                        </div>

                        {/* Breadcrumbs */}
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
                            <span className="text-[#FAD293] font-medium">
                                Bodywork &amp; Paint Repair
                            </span>
                        </nav>

                        {/* Hero Grid */}
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
                            {/* Left Column: Heading, Value Props */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAD293]/10 border border-[#FAD293]/30 text-[#FAD293] text-xs font-bold mb-4">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Certified Automotive Coachworks &amp; SMART Repair
                                    </div>

                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-5">
                                        Bodywork &amp; Paint <br />
                                        <span
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #FAD293 0%, #E8AF66 50%, #CEA46B 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            Repair Specialists
                                        </span>
                                    </h1>

                                    <p className="text-base sm:text-lg text-zinc-300 max-w-xl font-normal leading-relaxed mb-8">
                                        Precision panel beating, scratch removal, dent pulling (PDR), and factory color-matched oven spray painting. Compare competitive bids from accredited local bodyshops and mobile SMART repairers.
                                    </p>

                                    {/* 3 Value Pillars */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-[#121318]/90 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] mb-2.5">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs font-bold text-white">Showroom Finish</div>
                                            <div className="text-[11px] text-zinc-400 mt-0.5">OEM digital color matching</div>
                                        </div>

                                        <div className="bg-[#121318]/90 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] mb-2.5">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs font-bold text-white">Guaranteed Quality</div>
                                            <div className="text-[11px] text-zinc-400 mt-0.5">Lifetime anti-peel warranty</div>
                                        </div>

                                        <div className="bg-[#121318]/90 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] mb-2.5">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs font-bold text-white">Fast Transparent Bids</div>
                                            <div className="text-[11px] text-zinc-400 mt-0.5">No-obligation quote comparison</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Get Bodywork Provider Form Card */}
                            <div className="lg:col-span-5">
                                <div className="relative rounded-2xl bg-[#131417]/95 border border-zinc-800/80 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                                        Get Bodywork Provider
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1 mb-6">
                                        Fill in the details and get an instant quote
                                    </p>

                                    <form onSubmit={handleSearchSubmit} className="space-y-4">
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
                                                placeholder="CAR REGISTRATION NO"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-[#E8AF66] transition-colors"
                                            />
                                        </div>

                                        {/* Row 3: Multi-Select Bodywork Services */}
                                        <div className="relative" ref={dropdownRef}>
                                            <div
                                                onClick={() => {
                                                    setShowServicesDropdown((prev) => !prev);
                                                    if (services.length === 0) {
                                                        setLoadingServices(true);
                                                        getBodyworkServices().then((data) => {
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
                                                                : "Select Bodywork Services"}
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
                                                                        <X className="w-3.5 h-3.5" />
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
                                                                ? "Select one or more services"
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
                                                            <span className="text-xs">Loading services from MMC...</span>
                                                        </div>
                                                    ) : services.length === 0 ? (
                                                        <div className="py-6 text-center text-zinc-400 space-y-2">
                                                            <p className="text-xs">No services loaded.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setLoadingServices(true);
                                                                    getBodyworkServices().then((res) => {
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

                                                                    {isSelected && (
                                                                        <span className="text-[10px] text-[#E8AF66] font-bold uppercase tracking-wider">
                                                                            Selected
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 4: Describe the bodywork damage (Optional) */}
                                        <div className="relative">
                                            <div className="absolute top-3.5 left-3.5 pointer-events-none text-zinc-400">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={damageDesc}
                                                onChange={(e) => setDamageDesc(e.target.value)}
                                                placeholder="Describe the bodywork damage (Optional)"
                                                className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors resize-none"
                                            />
                                        </div>

                                        {/* Row 5: Upload Damage Photo / Media (Optional) */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Camera className="w-3.5 h-3.5 text-[#E8AF66]" />
                                                    <span>Upload Damage Photo (Optional)</span>
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
                                                            alt="Damage Preview"
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
                                                        Attach damage photo / media
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500">(JPG, PNG)</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Row 6: Privacy Policy Checkbox */}
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
                                                    <span>GET BODYWORK QUOTE</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Interactive Before & After Comparison Slider */}
                    <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 px-3 py-1 rounded-full border border-[#FAD293]/20">
                                Flawless Transformations
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-2">
                                Before &amp; After Bodywork Restoration
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Drag the interactive slider to see how our accredited technicians restore deep panel dents, scrapes, and clear coat damage back to showroom condition.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <div
                                ref={sliderRef}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                                className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden select-none cursor-ew-resize border border-zinc-800 shadow-2xl shadow-[#FAD293]/5"
                            >
                                {/* AFTER IMAGE (Underneath, full width) */}
                                <div className="absolute inset-0">
                                    <Image
                                        src="/images/bodywork/bodywork_after.jpg"
                                        alt="Repaired Showroom Paint Finish"
                                        fill
                                        className="object-cover pointer-events-none"
                                    />
                                    <div className="absolute bottom-5 right-5 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-zinc-700/80 text-[11px] font-extrabold text-emerald-400 tracking-wide flex items-center gap-1.5">
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        AFTER: Factory Showroom Mirror Finish
                                    </div>
                                </div>

                                {/* BEFORE IMAGE (Clipped on top by sliderPos) */}
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: `${sliderPos}%` }}
                                >
                                    <div className="relative w-full h-full" style={{ width: sliderRef.current?.offsetWidth || "100%" }}>
                                        <Image
                                            src="/images/bodywork/bodywork_before.jpg"
                                            alt="Damaged Car Bodywork Before"
                                            fill
                                            className="object-cover pointer-events-none"
                                        />
                                    </div>
                                    <div className="absolute bottom-5 left-5 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-zinc-700/80 text-[11px] font-extrabold text-amber-400 tracking-wide flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        BEFORE: Deep Scuffs &amp; Dent Damage
                                    </div>
                                </div>

                                {/* Drag Line Divider & Handle */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                                    style={{ left: `${sliderPos}%` }}
                                >
                                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FAD293] text-black shadow-xl flex items-center justify-center border-2 border-white">
                                        <div className="flex items-center gap-0.5 text-xs font-black">
                                            <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
                                            <ChevronDown className="w-3.5 h-3.5 -rotate-90 -ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Service Catalogue Grid */}
                    <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-zinc-900">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 px-3 py-1 rounded-full border border-[#FAD293]/20">
                                Comprehensive Capabilities
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-2">
                                Complete Bodywork &amp; Paint Solutions
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                From fast mobile SMART repairs to full insurance-approved bodyshop rebuilds.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    title: "Paintless Dent Removal (PDR)",
                                    desc: "Erase door dings, creases, and minor hail indentations using specialized micro-picks without repainting the panel.",
                                    price: "From £65",
                                    icon: Wrench,
                                },
                                {
                                    title: "Bumper Scuff & Scratch Repair",
                                    desc: "Invisible color-matched blend repair for parking gouges, corner scuffs, and curb impact damage in under 3 hours.",
                                    price: "From £95",
                                    icon: Sparkles,
                                },
                                {
                                    title: "Panel Beating & Dent Respray",
                                    desc: "Professional metal reshaping, body filler skimming, anti-corrosion primer, and multi-stage clear coat baking.",
                                    price: "From £180",
                                    icon: ShieldCheck,
                                },
                                {
                                    title: "Full Panel Factory Spray Painting",
                                    desc: "Oven-baked high solid clear coat painting using spectrophotometer digital formula scanning for 100% color match.",
                                    price: "From £220",
                                    icon: Layers,
                                },
                                {
                                    title: "Stone Chip & Key Scratch Restoration",
                                    desc: "Micro-touch precision paint leveling that eliminates bonnet road rash and key vandalism without repainting entire car.",
                                    price: "From £85",
                                    icon: Star,
                                },
                                {
                                    title: "Accident Structural & Collision Repair",
                                    desc: "Jig chassis realignment, OEM replacement panel fitting, welded seams, and insurance-approved certified workmanship.",
                                    price: "From £350",
                                    icon: Shield,
                                },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-6 rounded-3xl bg-[#121318] border border-zinc-800 hover:border-[#FAD293]/40 transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center text-[#FAD293] mb-4 group-hover:scale-105 transition-transform">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-base font-extrabold text-white mb-2 group-hover:text-[#FAD293] transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                                        <span className="text-xs font-black text-[#FAD293]">{item.price}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedServices([item.title]);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                                        >
                                            <span>Get Quotes</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-[#FAD293]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* How It Works - 4 Steps */}
                    <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-zinc-900">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 px-3 py-1 rounded-full border border-[#FAD293]/20">
                                Simple 4-Step Process
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-2">
                                How MotorMates Club Works
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Receive competitive fixed bids without driving to different workshops.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { step: "01", title: "Enter Vehicle & Damage", desc: "Input your reg number and upload a quick photo of the panel scratch or dent." },
                                { step: "02", title: "Receive Bodyshop Bids", desc: "Local accredited bodyshops review your damage and submit transparent fixed offers." },
                                { step: "03", title: "Choose Your Specialist", desc: "Compare verified customer reviews, mobile van vs workshop location, and prices." },
                                { step: "04", title: "Showroom Quality Repair", desc: "Enjoy factory-standard repair backed by our Lifetime Workmanship Warranty." },
                            ].map((item, idx) => (
                                <div key={idx} className="p-6 rounded-3xl bg-[#121318] border border-zinc-800 relative">
                                    <div className="text-3xl font-black text-[#FAD293]/30 mb-3">{item.step}</div>
                                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQs */}
                    <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto border-t border-zinc-900">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Everything you need to know about certified automotive bodywork.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: "Will the new paint match my car's existing color perfectly?",
                                    a: "Yes. All our accredited body shops use OEM manufacturer paint codes and digital spectrophotometer scanning to guarantee an exact color, metallic flake, and texture match.",
                                },
                                {
                                    q: "Can repairs be done at my home or must my car go to a workshop?",
                                    a: "Minor scratches, scuffs, and small dents can often be repaired by our mobile SMART repair units at your home or workplace. Extensive bodywork or oven baking will be carried out at an accredited local body shop.",
                                },
                                {
                                    q: "What is Paintless Dent Removal (PDR)?",
                                    a: "PDR is an advanced technique where technicians massage dents out from behind the panel using precision tools without disturbing the vehicle's original factory paintwork.",
                                },
                                {
                                    q: "What warranty do you offer on bodywork repairs?",
                                    a: "All bodywork repairs booked through MotorMates Club come with a Lifetime Workmanship Warranty against peeling, blistering, or flaking.",
                                },
                            ].map((faq, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-[#121318] border border-zinc-800">
                                    <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* View 2: Dedicated Technicians / Specialists Directory */}
            {activeView === "technicians" && (
                <BodyworkTechniciansView
                    providers={providers}
                    searchingProviders={searchingProviders}
                    selectedProviderIdsForQuote={selectedProviderIdsForQuote}
                    onToggleProviderSelection={toggleProviderSelection}
                    onToggleSelectAll={toggleSelectAllProviders}
                    onOpenProviderProfile={handleOpenProviderProfile}
                    onOpenQuoteForm={handleOpenQuoteForm}
                    onSendMultiQuoteRequest={handleSendMultiQuoteRequest}
                    submittingMultiQuote={submittingMultiQuote}
                    onBackToSearch={() => navigateToView("landing")}
                    onViewQuotes={() => navigateToView("quotes")}
                    regNo={regNo}
                    postcode={postcode}
                    selectedServices={selectedServices}
                    onOpenMap={() => setShowMapModal(true)}
                />
            )}

            {/* View 3: Dedicated Quotation Request Form */}
            {activeView === "request_quote" && (
                <BodyworkQuoteFormView
                    selectedProviders={
                        selectedQuoteProvider
                            ? [selectedQuoteProvider]
                            : providers.filter((p) => selectedProviderIdsForQuote.includes(p.id))
                    }
                    allServices={services}
                    initialRegNo={regNo}
                    initialDamageDesc={damageDesc}
                    initialCarImage={heroCarImage}
                    initialCarImagePreview={heroImagePreview}
                    submitting={submittingMultiQuote}
                    onBack={() => navigateToView("technicians")}
                    onSubmit={async (formData) => {
                        setSubmittingMultiQuote(true);
                        try {
                            let addrId = serviceAddressId;
                            if (!addrId) {
                                try {
                                    addrId = await getOrCreateCustomerAddressId(
                                        postcode || "London, UK",
                                        userLat || "51.5074",
                                        userLon || "-0.1278"
                                    );
                                } catch {
                                    addrId = "6";
                                }
                                if (addrId) setServiceAddressId(addrId);
                            }

                            const schedule = `${formData.bookingDate} ${formData.bookingTime || "10:00:00"}`;
                            const targetProviders = selectedQuoteProvider
                                ? [selectedQuoteProvider.id]
                                : selectedProviderIdsForQuote.length > 0
                                    ? selectedProviderIdsForQuote
                                    : providers.slice(0, 3).map((p) => p.id);

                            let serviceIds = formData.selectedServiceIds;
                            if (serviceIds.length === 0 && services.length > 0) {
                                serviceIds = [services[0].id];
                            }
                            const primaryServiceId =
                                serviceIds[0] ||
                                services[0]?.id ||
                                "e1fb2dae-c233-4b45-852b-8253373e06d7";

                            const res = await sendQuotationRequest({
                                service_id: primaryServiceId,
                                service_ids: serviceIds.length > 0 ? serviceIds : [primaryServiceId],
                                category_id: DEFAULT_BODYWORK_CATEGORY_ID,
                                provider_ids: targetProviders,
                                car_registration_number: formData.carReg || regNo || "BD51 SMR",
                                car_model: formData.carModel || "Vehicle",
                                damage_description: formData.damageDesc || formData.serviceDesc || "Bodywork damage repair",
                                service_description: formData.serviceDesc || formData.damageDesc || "Bodywork repair request",
                                booking_schedule: schedule,
                                service_address_id: addrId || "6",
                                car_image: formData.carImage,
                            });

                            showToast("Quotation request submitted to bodyshops successfully!", "success");
                            await refreshQuotationRequests();
                            navigateToView("quotes");
                        } catch (err: any) {
                            console.error("Quote form submit failed:", err);
                            showToast(err?.message || "Could not submit quote request. Please try again.", "error");
                        } finally {
                            setSubmittingMultiQuote(false);
                        }
                    }}
                />
            )}

            {/* View 4: Dedicated Provider Profile Full Screen */}
            {activeView === "provider_profile" && (
                selectedProviderModal ? (
                    <BodyworkProviderProfileView
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
                            <User className="w-8 h-8 text-[#FAD293]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Specialist Selected</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please choose an accredited bodyshop from our directory to view their complete profile.</p>
                        <button
                            onClick={() => navigateToView("technicians")}
                            className="px-6 py-3 bg-[#FAD293] text-black font-bold rounded-xl hover:brightness-105 transition cursor-pointer"
                        >
                            Browse Verified Bodyshops
                        </button>
                    </div>
                )
            )}

            {/* View 5: Dedicated Quotes & Live Bids Full Screen */}
            {activeView === "quotes" && (
                <BodyworkQuotesView
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

            {/* View 6: Dedicated Schedule Booking & Payment Checkout Full Screen */}
            {activeView === "booking" && (
                bookingProviderModal ? (
                    <BodyworkBookingView
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
                            <Calendar className="w-8 h-8 text-[#FAD293]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Booking Session</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Please select an offer from your live quotes to schedule your repair appointment.</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigateToView("quotes")}
                                className="px-6 py-3 bg-[#FAD293] text-black font-bold rounded-xl hover:brightness-105 transition cursor-pointer"
                            >
                                View My Quotes &amp; Bids
                            </button>
                            <button
                                onClick={() => navigateToView("technicians")}
                                className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-800 transition cursor-pointer"
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
