"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  X,
  Check,
  Compass,
} from "lucide-react";
import {
  searchPlaces,
  getCurrentBrowserLocation,
  type LocationSuggestion,
} from "@/lib/service/location.service";

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationSearchInputProps {
  label: string;
  placeholder?: string;
  value: string;
  coordinates?: LocationCoordinates;
  onChange: (address: string, coords?: LocationCoordinates) => void;
  required?: boolean;
  type?: "pickup" | "drop";
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder = "Search location or address...",
  value,
  coordinates,
  onChange,
  required = false,
  type = "pickup",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value with query state
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle autocomplete search with debounce
  const handleQueryChange = (text: string) => {
    setQuery(text);
    setLocationError("");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(
          text,
          coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : undefined
        );
        setSuggestions(results);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Select place from suggestions
  const handleSelectSuggestion = (item: LocationSuggestion) => {
    const fullAddress = item.address
      ? `${item.name}, ${item.address}`
      : item.name;
    setQuery(fullAddress);
    onChange(fullAddress, {
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setIsOpen(false);
    setSuggestions([]);
  };

  // Detect current browser location (like Blinkit "Detect my location")
  const handleDetectLocation = async () => {
    try {
      setLocating(true);
      setLocationError("");
      const location = await getCurrentBrowserLocation();
      const detectedText = location.address || location.name;
      setQuery(detectedText);
      onChange(detectedText, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setIsOpen(false);
      setSuggestions([]);
    } catch (err: any) {
      console.error("Location detection error:", err);
      setLocationError(err.message || "Failed to detect current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange("", undefined);
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const isPickup = type === "pickup";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label and GPS Status Header */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isPickup ? "bg-[#10b981] ring-2 ring-[#10b981]/20" : "bg-[#ef4444] ring-2 ring-[#ef4444]/20"
            }`}
          />
          {label} {required && <span className="text-[#e7bd78]">*</span>}
        </label>

        {coordinates ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-medium text-[#10b981]">
            <Check size={10} />
            {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
          </span>
        ) : (
          <span className="text-[10px] text-white/40">Select on search</span>
        )}
      </div>

      {/* Main Visible Input */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }}
        className={`group relative flex h-11 w-full cursor-pointer items-center rounded-xl border bg-[#16120e] px-3 transition-all ${
          isOpen
            ? "border-[#d9a85f] ring-2 ring-[#d9a85f]/20 shadow-lg shadow-black/40"
            : "border-[#33271d] hover:border-[#4a3a2c]"
        }`}
      >
        <div className="mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#221a13] text-[#e7bd78]">
          {isPickup ? <Navigation size={14} className="text-[#10b981]" /> : <MapPin size={14} className="text-[#ef4444]" />}
        </div>

        <input
          type="text"
          value={query}
          readOnly
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-white placeholder:text-white/40 outline-none cursor-pointer truncate"
        />

        <div className="flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-white/40 hover:text-white transition"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDetectLocation();
            }}
            disabled={locating}
            title="Detect Current Location"
            className="flex items-center gap-1 rounded-lg border border-[#3a2d21] bg-[#221a13] px-2 py-1 text-[10px] font-medium text-[#e7bd78] transition hover:bg-[#2e2319] hover:text-white disabled:opacity-60"
          >
            {locating ? (
              <Loader2 size={12} className="animate-spin text-[#10b981]" />
            ) : (
              <Compass size={12} className="text-[#10b981]" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Dropdown / Location Picker Modal (Blinkit style) */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-[#d9a85f]/40 bg-[#17130f] p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 no-scrollbar">
          {/* Header & Detect Location Action matching reference UI */}
          <div className="flex flex-col gap-2.5 pb-2.5 border-b border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold text-white/90">
              <span className="flex items-center gap-1.5">
                <Search size={13} className="text-[#e7bd78]" />
                Select {label}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition p-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Detect Button + OR + Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60 shrink-0 active:scale-[0.98]"
              >
                {locating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} className="fill-white" />
                )}
                <span>Detect my location</span>
              </button>

              <div className="hidden sm:flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border border-white/10 bg-[#100d0a] text-[9px] font-bold uppercase text-white/40 flex items-center justify-center">
                  OR
                </span>
              </div>

              {/* Search input inside modal */}
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Type area, landmark, or city..."
                  className="h-9 w-full rounded-xl border border-[#33271d] bg-[#100d0a] pl-8 pr-7 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#e7bd78] transition"
                />
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Location Error if any */}
          {locationError && (
            <div className="mt-2 rounded-xl bg-red-950/40 border border-red-500/30 p-2 text-[11px] text-red-300">
              {locationError}
            </div>
          )}

          {/* Suggestions List */}
          <div className="mt-2 max-h-56 overflow-y-auto space-y-1 no-scrollbar">
            {searching && (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-white/50">
                <Loader2 size={14} className="animate-spin text-[#e7bd78]" />
                <span>Searching nearby places...</span>
              </div>
            )}

            {!searching && suggestions.length === 0 && query.trim().length >= 2 && (
              <div className="py-4 text-center text-xs text-white/40">
                No matching locations found. Try a different query or use "Detect my location".
              </div>
            )}

            {!searching && suggestions.length === 0 && query.trim().length < 2 && (
              <div className="py-3 text-center text-[11px] text-white/40">
                Type at least 2 characters to see place suggestions
              </div>
            )}

            {!searching &&
              suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#251e18] group"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#3a2d21] bg-[#1a1410] text-[#e7bd78] group-hover:border-[#e7bd78]/60 group-hover:bg-[#2b2118]">
                    <MapPin size={14} className="text-[#e7bd78]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-[#e7bd78] transition truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {item.address}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
