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
    HelpCircle,
    ArrowLeft,
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
import { triggerDevicePushNotification } from "@/lib/firebase";
import {
    getBodyworkServices,
    type BodyworkServiceItem,
    searchBodyworkProviders,
    FALLBACK_BODYWORK_PROVIDERS,
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
import { saveConfirmedBooking, saveBookingMeta } from "@/lib/service/bookings.api";
import BodyworkStepHeader, { type ActiveView } from "./components/BodyworkStepHeader";
import BodyworkTechniciansView from "./components/BodyworkTechniciansView";
import BodyworkProviderProfileView from "./components/BodyworkProviderProfileView";
import BodyworkQuotesView from "./components/BodyworkQuotesView";
import BodyworkBookingView from "./components/BodyworkBookingView";
import { searchPlaces, type LocationSuggestion } from "@/lib/service/location.service";
import {
    saveServiceFormDraft,
    getServiceFormDraft,
    clearServiceFormDraft,
} from "@/lib/serviceFormDraft";

export default function BodyworkPage() {
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
        if (view && ["landing", "technicians", "quotes", "provider_profile", "booking"].includes(view)) {
            setActiveView(view as ActiveView);
        } else if (view === "request_quote") {
            setActiveView("technicians");
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
    const [carModel, setCarModel] = useState("");
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [showServicesDropdown, setShowServicesDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [damageDesc, setDamageDesc] = useState("");
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Google Maps Places Autocomplete & Geocoding State
    const GOOGLE_MAPS_KEY = "AIzaSyCzqspc3fl1LtnypCGowb6VmBVzf9zXXn4";
    const postcodeRef = useRef<HTMLInputElement>(null);
    const locationContainerRef = useRef<HTMLDivElement>(null);
    const locationDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [userLat, setUserLat] = useState<string>("");
    const [userLon, setUserLon] = useState<string>("");
    const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    // Multiple Media upload state for Hero Form
    const [heroCarImages, setHeroCarImages] = useState<File[]>([]);
    const [heroImagePreviews, setHeroImagePreviews] = useState<string[]>([]);

    // Step 1 vs Step 2 Damage Assessment State
    const [heroStep, setHeroStep] = useState<1 | 2>(1);
    const [assessmentQuestions, setAssessmentQuestions] = useState<BookingQuestionItem[]>([]);
    const [loadingAssessmentQuestions, setLoadingAssessmentQuestions] = useState(false);
    const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
    const [step2DamageDesc, setStep2DamageDesc] = useState("");
    const [assessmentScheduleDate, setAssessmentScheduleDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [assessmentScheduleTime, setAssessmentScheduleTime] = useState("17:45");

    const formattedSchedulePreview = useMemo(() => {
        try {
            if (!assessmentScheduleDate) return "28 Sep 2026, 05:45 PM";
            const [year, month, day] = assessmentScheduleDate.split("-").map(Number);
            const d = new Date(year, month - 1, day);
            const dayStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            if (assessmentScheduleTime) {
                const [h, m] = assessmentScheduleTime.split(":");
                const hour = parseInt(h, 10);
                const ampm = hour >= 12 ? "PM" : "AM";
                const h12 = hour % 12 || 12;
                const timeStr = `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
                return `${dayStr}, ${timeStr}`;
            }
            return dayStr;
        } catch {
            return `${assessmentScheduleDate} ${assessmentScheduleTime || ""}`;
        }
    }, [assessmentScheduleDate, assessmentScheduleTime]);

    // Load Dynamic Assessment Questions from backend API:
    // GET /customer/booking/provider/questions?category_id=dbafef35-cfa4-4757-90f4-ddbf568d5d83
    useEffect(() => {
        setLoadingAssessmentQuestions(true);
        getProviderQuestions(undefined, DEFAULT_BODYWORK_CATEGORY_ID)
            .then((res) => {
                if (res && res.length > 0) {
                    setAssessmentQuestions(res);
                }
            })
            .catch((err) => console.warn("Failed to load bodywork questions:", err))
            .finally(() => setLoadingAssessmentQuestions(false));
    }, []);

    const toggleMultiAnswer = (questionId: string, option: string) => {
        setAssessmentAnswers((prev) => {
            const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            const nextList = currentList.includes(option)
                ? currentList.filter((item) => item !== option)
                : [...currentList, option];
            return { ...prev, [questionId]: nextList };
        });
    };

    const setSingleAnswer = (questionId: string, option: string) => {
        setAssessmentAnswers((prev) => ({
            ...prev,
            [questionId]: prev[questionId] === option ? "" : option,
        }));
    };

    // Multi-provider selection for RFQ quotation request
    const [selectedProviderIdsForQuote, setSelectedProviderIdsForQuote] = useState<string[]>([]);
    const [submittingMultiQuote, setSubmittingMultiQuote] = useState(false);

    // Initialize zone configuration & click outside for location search
    useEffect(() => {
        if (typeof window === "undefined") return;

        localStorage.setItem("zone_id", DEFAULT_ZONE_ID);
        localStorage.setItem("zoneid", DEFAULT_ZONE_ID);

        const handleClickOutsideLocation = (e: globalThis.MouseEvent) => {
            if (locationContainerRef.current && !locationContainerRef.current.contains(e.target as Node)) {
                setShowLocationDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutsideLocation);
        return () => document.removeEventListener("mousedown", handleClickOutsideLocation);
    }, []);

    const handleLocationChange = (text: string) => {
        setPostcode(text);
        if (locationDebounceTimer.current) {
            clearTimeout(locationDebounceTimer.current);
        }
        if (text.trim().length < 2) {
            setLocationSuggestions([]);
            setShowLocationDropdown(false);
            setSearchingLocation(false);
            return;
        }

        setSearchingLocation(true);
        setShowLocationDropdown(true);
        locationDebounceTimer.current = setTimeout(async () => {
            try {
                const results = await searchPlaces(text);
                setLocationSuggestions(results || []);
            } catch (err) {
                console.error("Location search error:", err);
            } finally {
                setSearchingLocation(false);
            }
        }, 200);
    };

    const handleSelectLocation = (s: LocationSuggestion) => {
        const fullAddress = s.address && s.address !== s.name ? `${s.name}, ${s.address}` : (s.address || s.name);
        setPostcode(fullAddress);
        setUserLat(String(s.latitude));
        setUserLon(String(s.longitude));
        setShowLocationDropdown(false);
        setLocationSuggestions([]);
        if (typeof window !== "undefined") {
            localStorage.setItem("user_lat", String(s.latitude));
            localStorage.setItem("user_lon", String(s.longitude));
            localStorage.setItem("user_address", fullAddress);
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            setHeroCarImages((prev) => [...prev, ...files]);
            const newPreviews = files.map((file) => URL.createObjectURL(file));
            setHeroImagePreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = "";
    };

    const removeHeroImage = (index: number) => {
        setHeroCarImages((prev) => prev.filter((_, i) => i !== index));
        setHeroImagePreviews((prev) => {
            const toRemove = prev[index];
            if (toRemove) URL.revokeObjectURL(toRemove);
            return prev.filter((_, i) => i !== index);
        });
    };

    const clearAllHeroImages = () => {
        heroImagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setHeroCarImages([]);
        setHeroImagePreviews([]);
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
    const [isPartialPayment, setIsPartialPayment] = useState<boolean>(true);
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
        const catId = bookingPostItem?.category_id || DEFAULT_BODYWORK_CATEGORY_ID;
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
            // Strictly filter out Alloy Wheel and Modification requests from Bodywork
            const filtered = (res || []).filter((item) => {
                const combined = `${item.service_description || ""} ${item.damage_description || ""} ${item.category?.name || ""}`.toLowerCase();
                const isAlloy =
                    item.category_id === "e1fb2dae-c233-4b45-852b-8253373e06d7" ||
                    combined.includes("alloy") ||
                    combined.includes("wheel") ||
                    combined.includes("rim") ||
                    combined.includes("refurb");
                const isMod =
                    item.category_id === "5d98d5c9-509e-4ab7-859d-806174384e27" ||
                    combined.includes("modification") ||
                    combined.includes("tuning");
                return !isAlloy && !isMod;
            });
            setMyQuotationRequests(filtered);
        } catch (err) {
            console.error("Failed to load quotation requests:", err);
        } finally {
            setLoadingMyQuotationRequests(false);
        }
    };

    useEffect(() => {
        refreshQuotationRequests();
    }, []);

    useEffect(() => {
        if (isAuthenticated()) {
            const draft = getServiceFormDraft("bodywork");
            if (draft) {
                if (draft.postcode) setPostcode(draft.postcode);
                if (draft.regNo) setRegNo(draft.regNo);
                if (draft.carModel) setCarModel(draft.carModel);
                if (Array.isArray(draft.selectedServices) && draft.selectedServices.length > 0) {
                    setSelectedServices(draft.selectedServices);
                }
                if (draft.userLat) setUserLat(draft.userLat);
                if (draft.userLon) setUserLon(draft.userLon);
                if (draft.step) {
                    setHeroStep(draft.step);
                }
                clearServiceFormDraft("bodywork");
                showToast("Welcome back! Your vehicle details have been restored.", "success");
            }
        }
    }, []);

    const handleCopyAnyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedAnyId(id);
        setTimeout(() => setCopiedAnyId(null), 2000);
    };

    const notifyNewBids = (bids: PostBidItem[], post?: CustomerQuotationPostItem | null) => {
        if (!bids || bids.length === 0) return;
        // Only notify the latest single new bid to avoid multiple notification spam
        const latestBid = bids[0];
        if (!latestBid) return;

        const seenKey = `mmc_bid_push_${latestBid.id}`;
        if (typeof window !== "undefined" && !localStorage.getItem(seenKey)) {
            localStorage.setItem(seenKey, "1");
            const price = typeof latestBid.offered_price === "number" ? `£${latestBid.offered_price}` : `£${latestBid.offered_price}`;
            const title = `New Offer: ${price} from ${latestBid.provider?.company_name || "Specialist"}! 🚗`;
            const desc = latestBid.notes || `${latestBid.provider?.company_name || "Specialist"} sent an offer for your vehicle repair.`;
            triggerDevicePushNotification(title, desc, `/services/bodywork?view=quotes`, seenKey);
            showToast(`New offer received: ${price} from ${latestBid.provider?.company_name || "Specialist"}`, "info");
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
        }
    };

    const handleCheckBids = async (post: CustomerQuotationPostItem) => {
        const combined = `${post.service_description || ""} ${post.damage_description || ""} ${post.category?.name || ""}`.toLowerCase();
        const isAlloy =
            post.category_id === "e1fb2dae-c233-4b45-852b-8253373e06d7" ||
            combined.includes("alloy") ||
            combined.includes("wheel") ||
            combined.includes("rim") ||
            combined.includes("refurb");
        if (isAlloy) {
            router.push(`/services/alloy-wheel?view=quotes&post_id=${post.id}`);
            return;
        }

        setSelectedPostForBids(post);
        setLoadingPostBids(true);
        setPostBidsList([]);
        try {
            const bids = await getReceivedBidsForPost(post.id, 10, 1);
            setPostBidsList(bids || []);
            notifyNewBids(bids || [], post);
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
            notifyNewBids(bids || [], selectedPostForBids);
        } catch (err) {
            console.error("Failed to refresh bids:", err);
        } finally {
            setLoadingPostBids(false);
        }
    };

    const handleBookBidOffer = (bid: PostBidItem) => {
        if (!isAuthenticated()) {
            showToast("Please login to proceed with booking", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/bodywork")}`);
            return;
        }

        const post = selectedPostForBids;
        const combined = `${post?.service_description || ""} ${post?.damage_description || ""} ${post?.category?.name || ""}`.toLowerCase();
        if (
            post?.category_id === "e1fb2dae-c233-4b45-852b-8253373e06d7" ||
            combined.includes("alloy") ||
            combined.includes("wheel")
        ) {
            router.push(`/services/alloy-wheel?view=quotes&post_id=${post?.id}`);
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
        if (!isAuthenticated()) {
            showToast("Please login to complete your booking", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/bodywork")}`);
            return;
        }

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

        const isStripe = bookingPaymentMethod === "stripe" || bookingPaymentMethod === "online";
        const effectiveIsPartial = isStripe ? (isPartialPayment ? 1 : 0) : 0;
        const totalBookingPrice = Number(
            bookingBidOffer?.offered_price ||
            bookingProviderModal?.total_selected_services_price ||
            0
        );
        const depositAmount = effectiveIsPartial ? Math.round(totalBookingPrice * 0.2) : totalBookingPrice;

        try {
            const res = await sendBookingRequest({
                post_id: effectivePostId,
                provider_id: bookingProviderModal.id,
                payment_method: isStripe ? "stripe" : bookingPaymentMethod,
                is_partial: effectiveIsPartial,
                service_location: serviceLocation,
                service_schedule: formattedSchedule,
                booking_type: bookingType,
                selected_slot_id: selectedSlotId,
                service_address_id: serviceAddressId || "6",
                notes: combinedNotes,
                car_image: bookingCarImage,
                amount: totalBookingPrice || depositAmount,
                payment_platform: "app",
                callback:
                    typeof window !== "undefined"
                        ? `${window.location.origin}/booking-success`
                        : "https://mmcclub.co.uk/backend/booking-success",
            });

            const responseContent: any = res.content || {};
            let redirectUrl =
                responseContent.url ||
                responseContent.redirect_link ||
                responseContent.redirect_url ||
                responseContent.payment_url ||
                responseContent.link ||
                responseContent.payment_link ||
                (res as any)?.url ||
                (res as any)?.redirect_link ||
                (res as any)?.redirect_url ||
                (typeof res?.content === "string" && (res.content as string).startsWith("http") ? (res.content as string) : null);

            const rawBookingId = responseContent.booking_id;
            const bookingUuid =
                (Array.isArray(rawBookingId) && rawBookingId.length > 0 ? rawBookingId[0] : null) ||
                (typeof rawBookingId === "string" ? rawBookingId : null) ||
                responseContent.id ||
                responseContent.payment_id ||
                (res as any)?.booking_id ||
                responseContent.readable_id ||
                effectivePostId ||
                bookingBidOffer?.id ||
                bookingProviderModal?.id;

            if (!redirectUrl && isStripe && bookingUuid) {
                redirectUrl = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(
                    String(bookingUuid)
                )}&is_partial=${effectiveIsPartial}`;
            }

            const confirmedRefId = responseContent.readable_id || responseContent.booking_id || bookingUuid;
            const effectivePrice = Number(
                bookingBidOffer?.offered_price ||
                bookingProviderModal?.total_selected_services_price ||
                responseContent?.amount ||
                depositAmount ||
                0
            );

            if (confirmedRefId) {
                saveBookingMeta(confirmedRefId, {
                    price: effectivePrice,
                    serviceTitle: "Bodywork & Paint Repair",
                    serviceCategoryName: "Bodywork & Paint",
                    serviceType: "bodywork",
                    providerName: bookingProviderModal?.company_name || "Specialist Bodyshop",
                    isPaid: false,
                    paymentStatus: "Pending Payment",
                    scheduleDate: formattedSchedule ? formattedSchedule.split(" ")[0] : new Date().toISOString().split("T")[0],
                    scheduleTime: formattedSchedule ? formattedSchedule.split(" ")[1] : "11:00",
                });
                saveConfirmedBooking({
                    id: String(confirmedRefId),
                    rawId: confirmedRefId,
                    serviceType: "bodywork",
                    serviceCategoryName: "Bodywork & Paint Repair",
                    serviceTitle: "Bodywork & Paint Repair",
                    providerName: bookingProviderModal?.company_name || "Specialist Bodyshop",
                    providerPhone: bookingProviderModal?.company_phone,
                    totalAmount: effectivePrice,
                    isPaid: false,
                    paymentStatus: "Pending Payment",
                    paymentMethod: isStripe ? "Online (Stripe)" : bookingPaymentMethod,
                    status: "accepted",
                    statusDisplay: "Accepted",
                    scheduleDate: formattedSchedule ? formattedSchedule.split(" ")[0] : new Date().toISOString().split("T")[0],
                    scheduleTime: formattedSchedule ? formattedSchedule.split(" ")[1] : "11:00",
                    fullScheduleDisplay: formattedSchedule || "Confirmed",
                    createdAt: new Date().toISOString(),
                });
            }

            if (isStripe) {
                if (redirectUrl && String(redirectUrl).startsWith("http")) {
                    try {
                        sessionStorage.setItem(
                            "mmc_pending_booking",
                            JSON.stringify({
                                booking_id: responseContent.booking_id || confirmedRefId,
                                readable_id: responseContent.readable_id || confirmedRefId,
                                provider: bookingProviderModal,
                                schedule: formattedSchedule,
                                price: effectivePrice,
                                is_partial: effectiveIsPartial,
                                deposit_amount: responseContent.amount || depositAmount,
                                service_name: "Bodywork & Paint Repair",
                            })
                        );
                    } catch { }

                    showToast("Redirecting to Stripe secure checkout...", "info");
                    window.location.href = redirectUrl;
                    return;
                } else {
                    throw new Error("Unable to obtain Stripe checkout URL from payment gateway. Please try again.");
                }
            }

            setBookingApiResult(res.content || res);
            setBookingConfirmed(true);
            const refId = responseContent.readable_id || responseContent.booking_id || confirmedRefId;
            showToast(`Booking Placed successfully! ${refId ? `Ref: #${refId}` : ""}`, "success");

            triggerDevicePushNotification(
                "MMC Booking Confirmed! 🎉",
                `Your appointment #${refId || "Reserved"} with ${bookingProviderModal?.company_name || "your specialist"} is confirmed!`
            );
        } catch (err: any) {
            console.error("Bodywork booking error:", err);
            const apiMsg = err?.response?.data?.errors || err?.response?.data?.message || err?.message || "Booking request failed";
            const formattedMsg = typeof apiMsg === "string" ? apiMsg : JSON.stringify(apiMsg);
            setBookingError(formattedMsg);
            showToast(`Error: ${formattedMsg}`, "error");
        } finally {
            setSubmittingBooking(false);
        }
    };

    const handleOpenQuoteForm = async (provider: ProviderItem) => {
        setSelectedQuoteProvider(provider);
        setSelectedProviderIdsForQuote([provider.id]);
        await handleSendQuoteForProviders([provider.id]);
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
    // Direct Quote Submission Handler (Single or Multi-Provider, No Intermediate Form)
    // ---------------------------------------------------------------------------
    const handleSendQuoteForProviders = async (targetProviderIds: string[]) => {
        if (!isAuthenticated()) {
            showToast("Please login to submit a quote request.", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/bodywork")}`);
            return;
        }

        const idsToSend = targetProviderIds.length > 0
            ? targetProviderIds
            : selectedProviderIdsForQuote;

        if (idsToSend.length === 0) {
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
                    addrId = "295";
                }
                if (addrId) setServiceAddressId(addrId);
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const scheduleDate = assessmentScheduleDate
                ? `${assessmentScheduleDate} ${assessmentScheduleTime || "10:00:00"}`
                : tomorrow.toISOString().split("T")[0] + " 10:00:00";

            let serviceIds = selectedServices
                .map((name) => services.find((s) => s.name === name)?.id)
                .filter(Boolean) as string[];

            if (serviceIds.length === 0 && services.length > 0) {
                serviceIds = [services[0].id];
            }

            if (serviceIds.length === 0) {
                serviceIds = ["f473637e-cd69-4796-8d4a-b8eed2f7efca", "7fabbb6f-ed89-41bf-8443-b3bc75b963f6"];
            }

            const selectedNames = selectedServices.length > 0 ? selectedServices.join(", ") : "Bodywork & Paint Repair";

            await sendQuotationRequest({
                service_ids: serviceIds,
                category_id: DEFAULT_BODYWORK_CATEGORY_ID,
                provider_ids: idsToSend,
                car_model: carModel.trim() || "Vehicle",
                car_registration_number: regNo.trim().toUpperCase() || "BD51 SMR",
                service_description: damageDesc.trim() || `Requesting quotes for: ${selectedNames}`,
                damage_description: step2DamageDesc.trim() || damageDesc.trim() || `Requesting quotes for: ${selectedNames}`,
                booking_schedule: scheduleDate,
                service_address_id: addrId || "295",
                car_images: heroCarImages,
                car_image: heroCarImages[0] || null,
                answers: assessmentAnswers,
                additional_instructions: step2DamageDesc.trim() ? [step2DamageDesc.trim()] : undefined,
            });

            showToast(
                idsToSend.length === 1
                    ? "Quotation request sent to specialist successfully!"
                    : `Quotation request sent to ${idsToSend.length} bodyshops!`,
                "success"
            );
            await refreshQuotationRequests();
            navigateToView("quotes");
        } catch (err: any) {
            console.error("Quotation submission error:", err);
            const apiMsg = err?.response?.data?.message || err?.message || "Could not send quotation request. Please try again.";
            const formattedMsg = typeof apiMsg === "string" ? apiMsg : JSON.stringify(apiMsg);
            showToast(formattedMsg, "error");
        } finally {
            setSubmittingMultiQuote(false);
        }
    };

    const handleSendMultiQuoteRequest = async () => {
        await handleSendQuoteForProviders(selectedProviderIdsForQuote);
    };

    // ---------------------------------------------------------------------------
    // Step 1: Validate Vehicle & Service Details, then advance to Damage Assessment
    // ---------------------------------------------------------------------------
    const handleStep1Next = (e: React.FormEvent) => {
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

        // Require user authentication before advancing
        if (!isAuthenticated()) {
            saveServiceFormDraft("bodywork", {
                postcode,
                regNo,
                carModel,
                selectedServices,
                userLat,
                userLon,
                step: 2,
            });
            showToast("Please log in to continue booking your service", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/bodywork")}`);
            return;
        }

        setHeroStep(2);
        if (typeof window !== "undefined") {
            const card = document.getElementById("bodywork-hero-card");
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };

    // ---------------------------------------------------------------------------
    // Step 2: Final Assessment Quote Submission -> Search Providers & Open Screen
    // ---------------------------------------------------------------------------
    const handleFinalAssessmentSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!isAuthenticated()) {
            saveServiceFormDraft("bodywork", {
                postcode,
                regNo,
                carModel,
                selectedServices,
                userLat,
                userLon,
                step: 2,
            });
            showToast("Please log in to continue booking your service", "info");
            router.push(`/login?redirect=${encodeURIComponent("/services/bodywork")}`);
            return;
        }

        if (!privacyAgreed) {
            showToast("Please agree to the privacy policy to proceed", "error");
            return;
        }

        // Compile Q&A summary from dynamic assessment questions
        const qaSummaryList: string[] = [];
        assessmentQuestions.forEach((q) => {
            const ans = assessmentAnswers[q.id];
            if (ans) {
                const ansStr = Array.isArray(ans) ? ans.join(", ") : String(ans);
                if (ansStr.trim()) {
                    qaSummaryList.push(`${q.question_text}: ${ansStr}`);
                }
            }
        });

        const compiledParts: string[] = [];
        if (step2DamageDesc.trim()) {
            compiledParts.push(step2DamageDesc.trim());
        }
        if (qaSummaryList.length > 0) {
            compiledParts.push(`Damage Assessment:\n${qaSummaryList.map((item) => `• ${item}`).join("\n")}`);
        }
        if (carModel.trim()) {
            compiledParts.push(`Vehicle Model: ${carModel.trim()}`);
        }
        if (assessmentScheduleDate) {
            compiledParts.push(`Preferred Schedule: ${assessmentScheduleDate} ${assessmentScheduleTime || ""}`.trim());
            setBookingDate(assessmentScheduleDate);
            if (assessmentScheduleTime) setBookingTime(assessmentScheduleTime);
        }

        if (compiledParts.length > 0) {
            setDamageDesc(compiledParts.join("\n\n"));
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

            const finalProviders = results && results.length > 0 ? results : FALLBACK_BODYWORK_PROVIDERS;
            setProviders(finalProviders);

            if (finalProviders && finalProviders.length > 0) {
                setSelectedProviderIdsForQuote(finalProviders.map((p) => p.id));
            } else {
                setSelectedProviderIdsForQuote([]);
            }
        } catch (err) {
            console.error("Provider search failed:", err);
            setProviders(FALLBACK_BODYWORK_PROVIDERS);
            setSelectedProviderIdsForQuote(FALLBACK_BODYWORK_PROVIDERS.map((p) => p.id));
        } finally {
            setSubmitting(false);
            setSearchingProviders(false);
        }
    };

    // Auto-recovery: If user arrives on technicians view and providers list is empty, immediately populate
    useEffect(() => {
        if (activeView === "technicians" && providers.length === 0 && !searchingProviders) {
            setSearchingProviders(true);
            searchBodyworkProviders({
                serviceIds: selectedServices.length > 0
                    ? selectedServices.map((name) => services.find((s) => s.name === name)?.id).filter(Boolean) as string[]
                    : [],
                latitude: userLat || undefined,
                longitude: userLon || undefined,
            })
                .then((res) => {
                    const finalProviders = res && res.length > 0 ? res : FALLBACK_BODYWORK_PROVIDERS;
                    setProviders(finalProviders);
                    setSelectedProviderIdsForQuote(finalProviders.map((p) => p.id));
                })
                .catch(() => {
                    setProviders(FALLBACK_BODYWORK_PROVIDERS);
                    setSelectedProviderIdsForQuote(FALLBACK_BODYWORK_PROVIDERS.map((p) => p.id));
                })
                .finally(() => {
                    setSearchingProviders(false);
                });
        }
    }, [activeView, providers.length, searchingProviders, selectedServices, services, userLat, userLon]);

    const handleSearchSubmit = handleStep1Next;

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white selection:bg-[#FAD293] selection:text-black relative overflow-x-hidden">
            {/* Top Atmospheric Warm Gold Ambient Lighting */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(232,175,102,0.16),rgba(10,11,14,0))] z-0" />
            <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#E8AF66]/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-[#CEA46B]/8 blur-[100px] pointer-events-none z-0" />

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
                    <section className="relative pt-6 pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-visible z-10">
                        {/* Background Ambient Car Image & Rich Automotive Spotlight */}
                        <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full pointer-events-none opacity-55 lg:opacity-75 select-none z-0">
                            <Image
                                src="/images/bodywork/hero_bodywork_car.jpg"
                                alt="Bodywork Spray Booth"
                                fill
                                priority
                                className="object-cover object-center lg:object-right mix-blend-luminosity brightness-90 contrast-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-transparent to-transparent" />
                            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#E8AF66]/25 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#CEA46B]/20 blur-3xl pointer-events-none" />
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
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
                                        <div className="bg-gradient-to-br from-[#1C1814]/95 via-[#15120F]/90 to-[#0F0D0B]/90 border border-[#CEA46B]/35 hover:border-[#CEA46B] hover:shadow-[0_10px_25px_rgba(206,164,107,0.2)] rounded-2xl p-4.5 backdrop-blur-md transition-all duration-300 group hover:-translate-y-1">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] mb-3 group-hover:scale-110 transition-transform shadow-inner">
                                                <ShieldCheck className="w-5 h-5 text-[#FAD293]" />
                                            </div>
                                            <div className="text-xs font-black text-white group-hover:text-[#FAD293] transition-colors">Showroom Finish</div>
                                            <div className="text-[11px] text-zinc-300 mt-1 leading-snug">OEM digital color matching</div>
                                        </div>

                                        <div className="bg-gradient-to-br from-[#1C1814]/95 via-[#15120F]/90 to-[#0F0D0B]/90 border border-[#CEA46B]/35 hover:border-[#CEA46B] hover:shadow-[0_10px_25px_rgba(206,164,107,0.2)] rounded-2xl p-4.5 backdrop-blur-md transition-all duration-300 group hover:-translate-y-1">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] mb-3 group-hover:scale-110 transition-transform shadow-inner">
                                                <Crown className="w-5 h-5 text-[#FAD293]" />
                                            </div>
                                            <div className="text-xs font-black text-white group-hover:text-[#FAD293] transition-colors">Guaranteed Quality</div>
                                            <div className="text-[11px] text-zinc-300 mt-1 leading-snug">Lifetime anti-peel warranty</div>
                                        </div>

                                        <div className="bg-gradient-to-br from-[#1C1814]/95 via-[#15120F]/90 to-[#0F0D0B]/90 border border-[#CEA46B]/35 hover:border-[#CEA46B] hover:shadow-[0_10px_25px_rgba(206,164,107,0.2)] rounded-2xl p-4.5 backdrop-blur-md transition-all duration-300 group hover:-translate-y-1">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAD293]/15 border border-[#FAD293]/35 flex items-center justify-center text-[#FAD293] mb-3 group-hover:scale-110 transition-transform shadow-inner">
                                                <Zap className="w-5 h-5 text-[#FAD293]" />
                                            </div>
                                            <div className="text-xs font-black text-white group-hover:text-[#FAD293] transition-colors">Fast Transparent Bids</div>
                                            <div className="text-[11px] text-zinc-300 mt-1 leading-snug">No-obligation quote comparison</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Get Bodywork Provider Form Card */}
                            <div className="lg:col-span-5">
                                <div
                                    id="bodywork-hero-card"
                                    className="relative rounded-2xl bg-[#131417]/95 border border-zinc-800/80 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                                >

                                    {heroStep === 1 ? (
                                        <>
                                            {/* Bodywork Showcase Banner */}
                                            <div className="relative -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-6 overflow-hidden rounded-t-2xl border-b border-zinc-800/80 aspect-[1672/941] shadow-lg group">
                                                <Image
                                                    src="/bodywork.png"
                                                    alt="MMC Bodywork Repairs & Restorations"
                                                    fill
                                                    priority
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#131417] via-transparent to-transparent pointer-events-none" />
                                            </div>

                                            <div className="mb-6">
                                                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                                                    Get Bodywork Provider
                                                </h2>
                                                <p className="text-xs text-zinc-400 mt-1 mb-0">
                                                    Fill in the details and get an instant quote
                                                </p>
                                            </div>

                                            <form onSubmit={handleStep1Next} className="space-y-4">
                                                {/* Row 1: Enter Postcode / Location with Instant Type-Ahead Dropdown */}
                                                <div className="relative z-40" ref={locationContainerRef}>
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FAD293]">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        ref={postcodeRef}
                                                        type="text"
                                                        value={postcode}
                                                        onChange={(e) => handleLocationChange(e.target.value)}
                                                        onFocus={() => {
                                                            if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                                                        }}
                                                        placeholder="Enter Postcode or City"
                                                        className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                                                        autoComplete="off"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                                                        {searchingLocation && (
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#CEA46B]" />
                                                        )}
                                                        {postcode && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPostcode("");
                                                                    setUserLat("");
                                                                    setUserLon("");
                                                                    setLocationSuggestions([]);
                                                                    setShowLocationDropdown(false);
                                                                }}
                                                                className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-0.5"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Location Suggestions Dropdown */}
                                                    {showLocationDropdown && locationSuggestions.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#131417] border border-zinc-700 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto backdrop-blur-xl animate-fade-in space-y-1">
                                                            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-800">
                                                                Select Location or Postcode
                                                            </div>
                                                            {locationSuggestions.map((suggestion) => (
                                                                <button
                                                                    key={suggestion.id}
                                                                    type="button"
                                                                    onClick={() => handleSelectLocation(suggestion)}
                                                                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-[#E8AF66] transition-colors flex items-start gap-2.5 cursor-pointer group"
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5 text-[#E8AF66] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold text-white truncate">{suggestion.name}</div>
                                                                        {suggestion.address && suggestion.address !== suggestion.name && (
                                                                            <div className="text-[11px] text-zinc-400 truncate">{suggestion.address}</div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Row 2: Car Registration No */}
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FAD293]">
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

                                                {/* Row 3: Car Brand / Model (Optional) */}
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FAD293]">
                                                        <Car className="w-4 h-4 text-[#E8AF66]" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={carModel}
                                                        onChange={(e) => setCarModel(e.target.value)}
                                                        placeholder="Car Model (e.g. Audi A4, BMW 3 Series)"
                                                        className="w-full bg-[#1B1C20] border border-zinc-800/90 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8AF66] transition-colors"
                                                    />
                                                </div>

                                                {/* Row 4: Multi-Select Bodywork Services */}
                                                <div className="relative z-30" ref={dropdownRef}>
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
                                                        className={`w-full bg-[#1B1C20] border rounded-xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white cursor-pointer transition-all flex items-center justify-between min-h-[44px] ${showServicesDropdown
                                                            ? "border-[#E8AF66]"
                                                            : "border-zinc-800/90 hover:border-zinc-700"
                                                            }`}
                                                    >
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                                            <Wrench className="w-4 h-4 text-[#E8AF66]" />
                                                        </div>

                                                        <div className="flex-1 pr-2">
                                                            {selectedServices.length === 0 ? (
                                                                <span className="text-zinc-500 select-none">
                                                                    {loadingServices
                                                                        ? "Loading services..."
                                                                        : "Select Bodywork Services"}
                                                                </span>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-1.5 py-0.5">
                                                                    {selectedServices.map((name) => (
                                                                        <span
                                                                            key={name}
                                                                            className="inline-flex items-center gap-1 bg-[#E8AF66]/15 border border-[#E8AF66]/40 text-[#E8AF66] text-xs px-2.5 py-1 rounded-lg font-semibold shadow-sm"
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

                                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#FAD293]">
                                                            <ChevronDown
                                                                className={`w-4 h-4 transition-transform duration-200 ${showServicesDropdown ? "rotate-180 text-[#CEA46B]" : ""
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Dropdown Menu Popover */}
                                                    {showServicesDropdown && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#131417] border border-zinc-700 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-2.5 max-h-72 overflow-y-auto backdrop-blur-xl animate-fade-in space-y-1">
                                                            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400">
                                                                <span className="font-semibold">
                                                                    {selectedServices.length === 0
                                                                        ? "Select one or more services"
                                                                        : `${selectedServices.length} selected`}
                                                                </span>
                                                                {selectedServices.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedServices([])}
                                                                        className="text-[#E8AF66] hover:underline font-bold cursor-pointer"
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
                                                                        className="text-xs text-[#E8AF66] underline hover:text-white font-semibold cursor-pointer"
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
                                                                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all text-xs sm:text-sm select-none ${isSelected
                                                                                ? "bg-[#E8AF66]/15 text-[#E8AF66] font-bold border border-[#E8AF66]/50"
                                                                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white border border-transparent"
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div
                                                                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${isSelected
                                                                                        ? "bg-[#E8AF66] border-[#E8AF66] text-black"
                                                                                        : "border-zinc-700 bg-zinc-900"
                                                                                        }`}
                                                                                >
                                                                                    {isSelected && (
                                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                                    )}
                                                                                </div>
                                                                                <span>{item.name}</span>
                                                                            </div>

                                                                            {isSelected && (
                                                                                <span className="text-[10px] text-[#E8AF66] font-bold uppercase tracking-wider bg-[#E8AF66]/10 px-2 py-0.5 rounded-full border border-[#E8AF66]/30">
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

                                                {/* Row 5: Upload Damage Photos / Media (Optional, Multiple Images Supported) */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                                        <span className="flex items-center gap-1.5 font-medium">
                                                            <Camera className="w-3.5 h-3.5 text-[#E8AF66]" />
                                                            <span>Upload Damage Photos (Optional)</span>
                                                        </span>
                                                        {heroCarImages.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] text-[#E8AF66] font-bold">
                                                                    {heroCarImages.length} photo{heroCarImages.length > 1 ? "s" : ""}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={clearAllHeroImages}
                                                                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                                                                >
                                                                    Clear All
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {heroCarImages.length > 0 ? (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {heroImagePreviews.map((preview, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="relative group rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-square shadow-sm"
                                                                >
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        src={preview}
                                                                        alt={`Damage photo ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeHeroImage(index)}
                                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                                                                        title="Remove photo"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                                                                        #{index + 1}
                                                                    </span>
                                                                </div>
                                                            ))}

                                                            {/* Add More Photos Tile */}
                                                            <label className="flex flex-col items-center justify-center p-2 border border-dashed border-[#4A3B2B] hover:border-[#CEA46B] rounded-2xl bg-[#1A140F]/60 hover:bg-[#231B14] cursor-pointer transition-colors group aspect-square">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    className="hidden"
                                                                    onChange={handleHeroImagesChange}
                                                                />
                                                                <CloudUpload className="w-5 h-5 text-[#FAD293] mb-1 group-hover:scale-110 transition-transform" />
                                                                <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white text-center">
                                                                    + Add More
                                                                </span>
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-zinc-700 hover:border-[#E8AF66]/70 rounded-xl bg-[#1B1C20]/60 hover:bg-[#1B1C20] cursor-pointer transition-colors group">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                onChange={handleHeroImagesChange}
                                                            />
                                                            <CloudUpload className="w-4 h-4 text-[#E8AF66]" />
                                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                                                                Attach damage photos / media
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500">(JPG, PNG)</span>
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Row 6: Next Button */}
                                                <button
                                                    type="submit"
                                                    className="w-full mt-3 bg-[#E8AF66] hover:bg-[#d99f55] active:scale-[0.99] text-zinc-950 font-extrabold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E8AF66]/20 transition-all duration-300 uppercase tracking-wider cursor-pointer"
                                                >
                                                    <span>NEXT</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        /* --------------------------------------------------------------- */
                                        /* STEP 2: DAMAGE ASSESSMENT FORM (LUXURY AUTOMOTIVE REDESIGN)    */
                                        /* --------------------------------------------------------------- */
                                        <div className="space-y-4 animate-fade-in">
                                            {/* Step 2 Header */}
                                            <div className="flex items-center justify-between pb-3 border-b border-[#CEA46B]/30">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setHeroStep(1)}
                                                        className="p-1.5 -ml-1 rounded-xl bg-[#2D2218] hover:bg-[#3D2E20] text-[#FAD293] hover:text-white transition-all cursor-pointer border border-[#CEA46B]/30 hover:border-[#CEA46B]"
                                                        title="Back to Step 1"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#3D2C19] to-[#2B1F13] border border-[#CEA46B]/60 text-[11px] sm:text-xs font-bold text-[#FAD293] shadow-inner tracking-wide">
                                                        Step 2 of 2
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-[#CEA46B] tracking-wider uppercase flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-[#FAD293]" />
                                                    Damage Details
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-3 pt-1">
                                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#CEA46B]/30 to-[#FAD293]/15 border border-[#CEA46B]/50 flex items-center justify-center text-[#FAD293] shrink-0 mt-0.5 shadow-md">
                                                    <HelpCircle className="w-5 h-5 text-[#FAD293]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                                        Damage Assessment
                                                    </h2>
                                                    <p className="text-xs text-[#D8C7B5] mt-1 leading-relaxed">
                                                        Help repairers provide more accurate estimates by answering a few quick questions.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Dynamic Questions List from API */}
                                            {loadingAssessmentQuestions ? (
                                                <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
                                                    <RefreshCw className="w-8 h-8 animate-spin text-[#CEA46B]" />
                                                    <span className="text-xs text-[#FAD293] font-semibold">Loading damage assessment questions...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#CEA46B]/60 scrollbar-track-[#17120C] hover:scrollbar-thumb-[#FAD293]">
                                                    {assessmentQuestions.map((q, qIndex) => {
                                                        const isMulti =
                                                            q.question_text?.toLowerCase().includes("select all") ||
                                                            q.question_text?.toLowerCase().includes("apply") ||
                                                            q.question_type === "multi_select" ||
                                                            q.question_type === "checkbox";

                                                        const optionsList: string[] = Array.isArray(q.options)
                                                            ? q.options
                                                            : typeof q.options === "string"
                                                                ? (q.options as string).split(",").map((s) => s.trim()).filter(Boolean)
                                                                : [];

                                                        return (
                                                            <div
                                                                key={q.id || qIndex}
                                                                className="p-4 rounded-2xl bg-gradient-to-br from-[#261E16] via-[#1E1711] to-[#17120D] border border-[#523E2E] hover:border-[#CEA46B]/70 transition-all duration-200 shadow-[0_4px_18px_rgba(0,0,0,0.5)] space-y-3 group"
                                                            >
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="w-5 h-5 rounded-full bg-[#CEA46B]/25 border border-[#CEA46B]/60 flex items-center justify-center text-[#FAD293] text-[11px] font-extrabold shrink-0 mt-0.5 shadow-sm">
                                                                        ?
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="text-xs sm:text-sm font-bold text-white leading-snug group-hover:text-[#FAD293] transition-colors">
                                                                            {q.question_text}
                                                                        </span>
                                                                        {isMulti && (
                                                                            <p className="text-[11px] text-[#CEA46B] font-semibold mt-0.5">
                                                                                Select all that apply
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Render based on field/question type */}
                                                                {q.question_type === "text" ? (
                                                                    <input
                                                                        type="text"
                                                                        value={assessmentAnswers[q.id] || ""}
                                                                        onChange={(e) =>
                                                                            setAssessmentAnswers((prev) => ({
                                                                                ...prev,
                                                                                [q.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                        placeholder="Type your answer..."
                                                                        className="w-full bg-[#18120D] border border-[#523E2E] focus:border-[#CEA46B] focus:ring-1 focus:ring-[#CEA46B]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-[#8A7A6B] transition-all shadow-inner"
                                                                    />
                                                                ) : q.question_type === "textarea" ? (
                                                                    <textarea
                                                                        rows={2}
                                                                        value={assessmentAnswers[q.id] || ""}
                                                                        onChange={(e) =>
                                                                            setAssessmentAnswers((prev) => ({
                                                                                ...prev,
                                                                                [q.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                        placeholder="Type your answer..."
                                                                        className="w-full bg-[#18120D] border border-[#523E2E] focus:border-[#CEA46B] focus:ring-1 focus:ring-[#CEA46B]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-[#8A7A6B] transition-all resize-none shadow-inner"
                                                                    />
                                                                ) : q.question_type === "dropdown" ? (
                                                                    <select
                                                                        value={assessmentAnswers[q.id] || ""}
                                                                        onChange={(e) =>
                                                                            setAssessmentAnswers((prev) => ({
                                                                                ...prev,
                                                                                [q.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                        className="w-full bg-[#18120D] border border-[#523E2E] focus:border-[#CEA46B] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100"
                                                                    >
                                                                        <option value="">Select an option</option>
                                                                        {optionsList.map((opt, oIdx) => (
                                                                            <option key={oIdx} value={opt} className="bg-[#18120D] text-white">
                                                                                {opt}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    /* Option Pills (Multi-Select or Single-Select) */
                                                                    <div className="flex flex-wrap gap-2 pt-0.5">
                                                                        {optionsList.map((opt, oIdx) => {
                                                                            const isSelected = isMulti
                                                                                ? Array.isArray(assessmentAnswers[q.id]) &&
                                                                                assessmentAnswers[q.id].includes(opt)
                                                                                : assessmentAnswers[q.id] === opt;

                                                                            return (
                                                                                <button
                                                                                    key={oIdx}
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        isMulti
                                                                                            ? toggleMultiAnswer(q.id, opt)
                                                                                            : setSingleAnswer(q.id, opt)
                                                                                    }
                                                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${isSelected
                                                                                            ? "bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] text-zinc-950 font-black shadow-[0_4px_18px_rgba(232,175,102,0.45)] border border-[#FFF2D6] scale-[1.02]"
                                                                                            : "bg-[#251C15] text-[#D8C7B5] hover:text-white border border-[#4E3A2A] hover:border-[#CEA46B]/70 hover:bg-[#32251B] shadow-sm"
                                                                                        }`}
                                                                                >
                                                                                    {isSelected && (
                                                                                        <Check className="w-3.5 h-3.5 stroke-[3] text-zinc-950" />
                                                                                    )}
                                                                                    <span>{opt}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Damage Description (Optional) */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-[#FAD293] uppercase tracking-wider flex items-center justify-between">
                                                    <span>Damage Description</span>
                                                    <span className="text-[10px] text-[#A89886] font-normal lowercase">(optional)</span>
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={step2DamageDesc}
                                                    onChange={(e) => setStep2DamageDesc(e.target.value)}
                                                    placeholder="Describe the damage in detail (e.g. scratch depth, dent size, panel location)..."
                                                    className="w-full bg-[#18120D] border border-[#523E2E] focus:border-[#CEA46B] focus:ring-1 focus:ring-[#CEA46B]/40 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder-[#8A7A6B] transition-all resize-none shadow-inner"
                                                />
                                            </div>

                                            {/* Preferred Schedule (Exact match with Reference Screenshot) */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-[#FAD293] uppercase tracking-wider flex items-center justify-between">
                                                    <span>Preferred Schedule</span>
                                                    <span className="text-[10px] text-[#CEA46B] font-semibold">Select your preferred date &amp; time</span>
                                                </label>
                                                <div className="relative rounded-2xl border border-[#523E2E] bg-gradient-to-r from-[#201812] to-[#17120D] p-3 hover:border-[#CEA46B]/70 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#CEA46B]/25 to-[#FAD293]/15 border border-[#CEA46B]/40 flex items-center justify-center text-[#FAD293] shadow-sm">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-bold text-white">
                                                            {formattedSchedulePreview}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="date"
                                                            value={assessmentScheduleDate}
                                                            min={new Date().toISOString().split("T")[0]}
                                                            onChange={(e) => setAssessmentScheduleDate(e.target.value)}
                                                            className="bg-[#291F17] border border-[#523E2E] hover:border-[#CEA46B]/70 rounded-xl px-3 py-1.5 text-xs text-[#FAD293] font-semibold focus:outline-none focus:border-[#CEA46B] [color-scheme:dark] cursor-pointer shadow-inner"
                                                        />
                                                        <input
                                                            type="time"
                                                            value={assessmentScheduleTime}
                                                            onChange={(e) => setAssessmentScheduleTime(e.target.value)}
                                                            className="bg-[#291F17] border border-[#523E2E] hover:border-[#CEA46B]/70 rounded-xl px-3 py-1.5 text-xs text-[#FAD293] font-semibold focus:outline-none focus:border-[#CEA46B] [color-scheme:dark] cursor-pointer shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Privacy Policy Agreement */}
                                            <label className="flex items-center gap-3 pt-1 cursor-pointer select-none group">
                                                <input
                                                    type="checkbox"
                                                    id="privacy-check-step2"
                                                    checked={privacyAgreed}
                                                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                                                    className="w-4 h-4 rounded border-[#523E2E] bg-[#18120D] text-[#CEA46B] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#CEA46B]"
                                                />
                                                <span className="text-xs text-[#C5B39F] group-hover:text-white transition-colors">
                                                    I agree to the{" "}
                                                    <Link
                                                        href="/faqs"
                                                        className="text-[#FAD293] underline hover:text-white font-semibold"
                                                    >
                                                        Privacy Policy
                                                    </Link>
                                                </span>
                                            </label>

                                            {/* Bottom Navigation Buttons: Back + GET REPAIR QUOTE */}
                                            <div className="flex items-center gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setHeroStep(1)}
                                                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-[#523E2E] bg-[#241C15] hover:bg-[#32261C] text-[#FAD293] hover:text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer active:scale-95 hover:border-[#CEA46B]"
                                                    title="Back to Step 1"
                                                >
                                                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={submitting}
                                                    onClick={handleFinalAssessmentSubmit}
                                                    className="flex-1 h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] hover:brightness-110 active:scale-[0.99] text-zinc-950 font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_12px_35px_rgba(232,175,102,0.45)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {submitting ? (
                                                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <span className="drop-shadow-sm">GET REPAIR QUOTE</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
