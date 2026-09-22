"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Car,
  ChevronDown,
  Clock3,
  MapPin,
  Check,
  ArrowRight,
  Loader2,
  Users,
  Star,
  Fuel,
  Settings2,
} from "lucide-react";

import {
  getCarTypes,
  searchChauffeurs,
  type CarType,
  type Chauffeur,
  type ChauffeurSearchContent,
} from "@/lib/service/chauffeur.api";

const features = [
  {
    icon: "✦",
    title: "Luxury",
    text: "Premium vehicles",
  },
  {
    icon: "◷",
    title: "On Time",
    text: "Reliable pickups",
  },
  {
    icon: "♧",
    title: "24/7",
    text: "Always available",
  },
];

export default function ChauffeurService() {
  const [postcode, setPostcode] = useState("");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [time, setTime] = useState("09:00");

  // Selected car type ID
  const [carTypeId, setCarTypeId] = useState<number | null>(null);

  // Selected car type name for UI
  const [carTypeName, setCarTypeName] = useState("");

  const [showCars, setShowCars] = useState(false);

  const [privacy, setPrivacy] = useState(false);

  // Car types API states
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadingCarTypes, setLoadingCarTypes] = useState(true);
  const [carTypeError, setCarTypeError] = useState("");

  // Search states
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);

  // Pagination
  const [searchMeta, setSearchMeta] =
    useState<ChauffeurSearchContent | null>(null);

  /**
   * -----------------------------------------
   * FETCH CAR TYPES
   * -----------------------------------------
   */
  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        setLoadingCarTypes(true);
        setCarTypeError("");

        const data = await getCarTypes();

        setCarTypes(data);

        // Optional:
        // Automatically select first active car type
        const firstActiveType = data.find((type) => type.status === 1);

        if (firstActiveType) {
          setCarTypeId(firstActiveType.id);
          setCarTypeName(firstActiveType.name);
        }
      } catch (error) {
        console.error("Failed to fetch car types:", error);
        setCarTypeError("Unable to load car types.");
      } finally {
        setLoadingCarTypes(false);
      }
    };

    fetchCarTypes();
  }, []);

  /**
   * -----------------------------------------
   * SELECT CAR TYPE
   * -----------------------------------------
   */
  const handleCarTypeSelect = (carType: CarType) => {
    setCarTypeId(carType.id);
    setCarTypeName(carType.name);
    setShowCars(false);

    // Clear previous search
    setSearched(false);
    setChauffeurs([]);
    setSearchMeta(null);
    setSearchError("");
  };

  /**
   * -----------------------------------------
   * SEARCH CHAUFFEURS
   * -----------------------------------------
   */
  const handleSearch = async () => {
    setSearchError("");
    setSearched(false);

   

    if (!date) {
      setSearchError("Please select a date.");
      return;
    }

    if (!time) {
      setSearchError("Please select a time.");
      return;
    }

    if (!carTypeId) {
      setSearchError("Please select a car type.");
      return;
    }

    if (!privacy) {
      setSearchError(
        "Please accept the Privacy Policy to continue."
      );
      return;
    }

    try {
      setSearchLoading(true);

      const result = await searchChauffeurs({
        car_type_id: carTypeId,
        date,
        limit: 10,
        offset: 0,
      });

      setSearchMeta(result);
      setChauffeurs(result.data || []);
      setSearched(true);

      // Scroll to results
      setTimeout(() => {
        document
          .getElementById("chauffeur-results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (error) {
      console.error("Failed to search chauffeurs:", error);

      setSearchError(
        "Unable to find chauffeurs right now. Please try again."
      );

      setChauffeurs([]);
      setSearchMeta(null);
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * -----------------------------------------
   * FORMAT PRICE
   * -----------------------------------------
   */
  const formatPrice = (price: string | null | undefined) => {
    if (!price) return "Price on request";

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return price;
    }

    return `£${numericPrice.toLocaleString("en-GB")}`;
  };

  return (
    <section className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HERO
        ====================================================== */}

        <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.1fr]">

          {/* LEFT CONTENT */}
          <div className="order-2 lg:order-1">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d9a85f]/40 bg-[#e7bd78]/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e7bd78]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e7bd78]">
                Premium Travel
              </span>
            </div>

            <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-[52px]">
              Chauffeur
              <br />
              <span className="text-[#e7bd78]">
                Service
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/55 sm:text-base">
              Rides with professional chauffeurs.
              Travel in comfort, style & class.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#booking"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-3.5 text-sm font-bold text-[#17100b] transition hover:brightness-105"
              >
                BOOK YOUR RIDE
                <ArrowRight size={17} />
              </a>

              <div className="flex items-center rounded-xl border border-[#d9a85f]/40 px-4 py-3 text-xs text-white/50">
                Professional Chauffeurs
              </div>
            </div>

          </div>

          {/* RIGHT IMAGE */}
          <div className="order-1 lg:order-2">

            <div className="relative overflow-hidden rounded-[26px] border border-[#d9a85f]/70 bg-black">

              <div className="h-[280px] sm:h-[350px] lg:h-[360px]">
                <img
                  src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1400&q=85"
                  alt="Professional chauffeur"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 p-5 sm:p-7">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#e7bd78]">
                  Premium Experience
                </p>

                <h2 className="font-serif text-2xl sm:text-3xl">
                  Arrive in style with
                  <br />
                  professional chauffeurs
                </h2>
              </div>

            </div>

          </div>
        </div>

        {/* =====================================================
            FEATURES
        ====================================================== */}

        <div className="mt-6 grid grid-cols-3 gap-3">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 rounded-2xl border border-[#d9a85f]/40 bg-[#19130e] p-4 sm:p-5"
            >

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7bd78]/10 text-xl text-[#e7bd78] sm:h-11 sm:w-11">
                {feature.icon}
              </div>

              <div>
                <h3 className="text-sm font-semibold sm:text-base">
                  {feature.title}
                </h3>

                <p className="mt-0.5 hidden text-xs text-white/40 sm:block">
                  {feature.text}
                </p>
              </div>

            </div>
          ))}

        </div>

        {/* =====================================================
            BOOKING SECTION
        ====================================================== */}

        <div
          id="booking"
          className="mt-6 overflow-visible rounded-[26px] border border-[#d9a85f]/60 bg-[#17120e]"
        >

          {/* BOOKING HEADER */}

          <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6 md:flex-row md:items-end md:justify-between">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e7bd78]">
                Easy Booking
              </p>

              <h2 className="mt-1 font-serif text-3xl text-[#e7bd78] sm:text-4xl">
                Book Your Chauffeur
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-5 text-white/40 md:text-right">
              Complete your journey details and select your preferred vehicle.
            </p>

          </div>

          {/* FORM */}

          <div className="p-5 sm:p-7">

            <div className="grid gap-4 lg:grid-cols-12">

              {/* POSTCODE */}

              <div className="lg:col-span-4">

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Pickup Postcode (Optional)
                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e7bd78]"
                  />

                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) =>
                      setPostcode(e.target.value)
                    }
                    placeholder="ENTER POSTCODE"
                    className="h-14 w-full rounded-xl border border-[#d9a85f]/55 bg-[#24211e] pl-11 pr-4 text-sm tracking-wide text-white outline-none placeholder:text-white/35 focus:border-[#e7bd78]"
                  />

                </div>

              </div>

              {/* DATE */}

              <div className="lg:col-span-3">

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e7bd78]"
                  />

                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="h-14 w-full rounded-xl border border-[#d9a85f]/55 bg-[#24211e] pl-11 pr-3 text-sm text-white outline-none focus:border-[#e7bd78]"
                  />

                </div>

              </div>

              {/* TIME */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Time
                </label>

                <div className="relative">

                  <Clock3
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e7bd78]"
                  />

                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTime(e.target.value)
                    }
                    className="h-14 w-full rounded-xl border border-[#d9a85f]/55 bg-[#24211e] pl-11 pr-3 text-sm text-white outline-none focus:border-[#e7bd78]"
                  />

                </div>

              </div>

              {/* CAR TYPE */}

              <div className="relative lg:col-span-3">

                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Car Type
                </label>

                <button
                  type="button"
                  disabled={loadingCarTypes}
                  onClick={() =>
                    setShowCars(!showCars)
                  }
                  className="flex h-14 w-full items-center justify-between rounded-xl border border-[#d9a85f]/55 bg-[#24211e] px-4 text-left transition hover:border-[#e7bd78] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span className="flex items-center gap-3">

                    {loadingCarTypes ? (
                      <Loader2
                        size={19}
                        className="animate-spin text-[#e7bd78]"
                      />
                    ) : (
                      <Car
                        size={19}
                        className="text-[#e7bd78]"
                      />
                    )}

                    <span
                      className={
                        carTypeName
                          ? "text-sm text-white"
                          : "text-sm text-white/35"
                      }
                    >
                      {loadingCarTypes
                        ? "LOADING..."
                        : carTypeName ||
                          "SELECT CAR TYPE"}
                    </span>

                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-white/50 transition ${
                      showCars ? "rotate-180" : ""
                    }`}
                  />

                </button>

                {/* DROPDOWN */}

                {showCars && !loadingCarTypes && (
                  <div className="absolute left-0 right-0 top-[79px] z-50 max-h-64 overflow-y-auto rounded-xl border border-[#d9a85f]/60 bg-[#211a14] shadow-2xl">

                    {carTypes.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-white/40">
                        No car types available.
                      </div>
                    ) : (
                      carTypes
                        .filter(
                          (car) => car.status === 1
                        )
                        .map((car) => (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() =>
                              handleCarTypeSelect(car)
                            }
                            className={`flex w-full items-center gap-3 border-b border-white/10 px-4 py-3.5 text-left text-sm transition last:border-0 hover:bg-[#e7bd78]/10 ${
                              carTypeId === car.id
                                ? "bg-[#e7bd78]/10 text-[#e7bd78]"
                                : "text-white"
                            }`}
                          >

                            <Car
                              size={17}
                              className="text-[#e7bd78]"
                            />

                            <span className="flex-1">
                              {car.name}
                            </span>

                            {carTypeId === car.id && (
                              <Check
                                size={16}
                                className="text-[#e7bd78]"
                              />
                            )}

                          </button>
                        ))
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* BOTTOM ROW */}

            <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">

              {/* PRIVACY */}

              <button
                type="button"
                onClick={() =>
                  setPrivacy(!privacy)
                }
                className="flex items-start gap-3 text-left"
              >

                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                    privacy
                      ? "border-[#e7bd78] bg-[#e7bd78] text-[#17100b]"
                      : "border-white/30"
                  }`}
                >
                  {privacy && (
                    <Check
                      size={13}
                      strokeWidth={3}
                    />
                  )}
                </span>

                <span className="text-sm text-white/50">
                  I agree to the{" "}
                  <span className="font-semibold text-[#e7bd78]">
                    Privacy Policy
                  </span>
                </span>

              </button>

              {/* SEARCH BUTTON */}

              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-8 text-sm font-bold tracking-wide text-[#17100b] shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 md:min-w-[220px]"
              >

                {searchLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    SEARCHING...
                  </>
                ) : (
                  <>
                    Search CHAUFFEUR RIDE
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </div>

            {/* CAR TYPE ERROR */}

            {carTypeError && (
              <p className="mt-3 text-xs text-red-400">
                {carTypeError}
              </p>
            )}

            {/* SEARCH ERROR */}

            {searchError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {searchError}
              </div>
            )}

          </div>

        </div>

        {/* =====================================================
            CHAUFFEUR RESULTS
        ====================================================== */}

        {searched && (
          <section
            id="chauffeur-results"
            className="mt-8 scroll-mt-8"
          >

            {/* RESULTS HEADER */}

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e7bd78]">
                  Available Vehicles
                </p>

                <h2 className="mt-1 font-serif text-3xl text-[#e7bd78] sm:text-4xl">
                  Choose Your Chauffeur
                </h2>
              </div>

              {searchMeta && (
                <p className="text-sm text-white/40">
                  {searchMeta.total} vehicle
                  {searchMeta.total !== 1 ? "s" : ""} found
                </p>
              )}

            </div>

            {/* EMPTY RESULT */}

            {chauffeurs.length === 0 ? (
              <div className="rounded-[26px] border border-[#d9a85f]/30 bg-[#17120e] px-6 py-12 text-center">

                <Car
                  size={42}
                  className="mx-auto text-[#e7bd78]/60"
                />

                <h3 className="mt-4 font-serif text-2xl text-white">
                  No Chauffeurs Found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                  We couldn't find an available chauffeur
                  for your selected car type and date.
                  Try another car type or date.
                </p>

              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">

                {chauffeurs.map((chauffeur) => {

                  const image =
                    chauffeur.image_full_paths?.[0] ||
                    chauffeur.images?.[0] ||
                    "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80";

                  return (
                    <div
                      key={chauffeur.id}
                      className="overflow-hidden rounded-[24px] border border-[#d9a85f]/40 bg-[#17120e] transition hover:border-[#e7bd78]/70"
                    >

                      {/* IMAGE */}

                      <div className="relative h-[230px] overflow-hidden">

                        <img
                          src={image}
                          alt={`${chauffeur.brand} ${chauffeur.model}`}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                        {/* CAR TYPE */}

                        <div className="absolute left-4 top-4 rounded-full border border-[#e7bd78]/40 bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#e7bd78] backdrop-blur">
                          {chauffeur.type?.name ||
                            chauffeur.service_category ||
                            "Chauffeur"}
                        </div>

                        {/* PRICE */}

                        <div className="absolute bottom-4 left-4">

                          <p className="text-xs text-white/50">
                            From
                          </p>

                          <p className="text-xl font-bold text-white">
                            {formatPrice(
                              chauffeur.hourly_rate
                            )}
                            <span className="ml-1 text-xs font-normal text-white/50">
                              / hour
                            </span>
                          </p>

                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <h3 className="font-serif text-2xl text-[#e7bd78]">
                              {chauffeur.brand}{" "}
                              {chauffeur.model}
                            </h3>

                            {chauffeur.registration_number && (
                              <p className="mt-1 text-xs uppercase tracking-wider text-white/35">
                                {chauffeur.registration_number}
                              </p>
                            )}
                          </div>

                          {chauffeur.provider?.avg_rating ? (
                            <div className="flex items-center gap-1 rounded-lg bg-[#e7bd78]/10 px-2.5 py-1.5 text-sm text-[#e7bd78]">
                              <Star
                                size={14}
                                fill="currentColor"
                              />
                              {Number(
                                chauffeur.provider.avg_rating
                              ).toFixed(1)}
                            </div>
                          ) : null}

                        </div>

                        {/* SPECS */}

                        <div className="mt-5 grid grid-cols-2 gap-2">

                          {chauffeur.seating_capacity && (
                            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3">

                              <Users
                                size={16}
                                className="text-[#e7bd78]"
                              />

                              <div>
                                <p className="text-[10px] text-white/35">
                                  Seats
                                </p>
                                <p className="text-xs text-white/70">
                                  {chauffeur.seating_capacity}
                                </p>
                              </div>

                            </div>
                          )}

                          {chauffeur.fuel_type && (
                            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3">

                              <Fuel
                                size={16}
                                className="text-[#e7bd78]"
                              />

                              <div>
                                <p className="text-[10px] text-white/35">
                                  Fuel
                                </p>
                                <p className="text-xs capitalize text-white/70">
                                  {chauffeur.fuel_type}
                                </p>
                              </div>

                            </div>
                          )}

                          {chauffeur.transmission_type && (
                            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3">

                              <Settings2
                                size={16}
                                className="text-[#e7bd78]"
                              />

                              <div>
                                <p className="text-[10px] text-white/35">
                                  Transmission
                                </p>
                                <p className="text-xs capitalize text-white/70">
                                  {chauffeur.transmission_type}
                                </p>
                              </div>

                            </div>
                          )}

                          {chauffeur.manufacture_year && (
                            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3">

                              <CalendarDays
                                size={16}
                                className="text-[#e7bd78]"
                              />

                              <div>
                                <p className="text-[10px] text-white/35">
                                  Year
                                </p>
                                <p className="text-xs text-white/70">
                                  {chauffeur.manufacture_year}
                                </p>
                              </div>

                            </div>
                          )}

                        </div>

                        {/* PROVIDER */}

                        {chauffeur.provider?.company_name && (
                          <div className="mt-4 border-t border-white/10 pt-4">

                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Provided by
                            </p>

                            <p className="mt-1 text-sm text-white/70">
                              {chauffeur.provider.company_name}
                            </p>

                          </div>
                        )}

                        {/* BOOK BUTTON */}

                        <button
                          type="button"
                          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-sm font-bold text-[#17100b] transition hover:brightness-105"
                        >
                          SELECT THIS VEHICLE
                          <ArrowRight size={16} />
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}

      </div>
    </section>
  );
}