export interface EUTyreLabel {
  fuel_efficiency: "A" | "B" | "C" | "D" | "E";
  wet_grip: "A" | "B" | "C" | "D" | "E";
  noise_db: number;
  noise_class: "A" | "B" | "C";
}

export interface TyreProvider {
  id: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  rating: number;
  reviews_count: number;
  mobile_fitting_available: boolean;
  garage_fitting_available: boolean;
  emergency_24_7: boolean;
  logo: string;
}

export interface TyreItem {
  id: string;
  service_id: string;
  brand: string;
  model: string;
  width: number;       // e.g. 205
  profile: number;     // e.g. 55
  rim_size: number;    // e.g. 16
  load_index: number;  // e.g. 91
  speed_rating: string;// e.g. "V"
  size_string: string; // e.g. "205/55 R16 91V"
  season: "summer" | "all_season" | "winter";
  vehicle_type: "passenger" | "suv_4x4" | "ev" | "commercial";
  is_runflat: boolean;
  is_reinforced: boolean; // XL
  is_ev_compatible: boolean;
  unit_price: number;
  fitting_fee: number;
  image_url: string;
  in_stock: number;
  description: string;
  eu_label: EUTyreLabel;
  provider: TyreProvider;
  features: string[];
}

export interface UKVehicleLookup {
  registration: string;
  make: string;
  model: string;
  year: string;
  color: string;
  recommended_front_size: string;
  recommended_rear_size: string;
}

export interface TyreBookingPayload {
  payment_method: "cash_after_service" | "stripe" | "offline";
  zone_id: string;
  service_schedule: string;
  service_address: string;
  service_latitude?: number;
  service_longitude?: number;
  service_location: "customer" | "provider"; // "customer" = Mobile Fitting, "provider" = Garage
  booking_type: "normal" | "emergency";
  car_registration_number: string;
  car_model: string;
  car_manufacture_year?: string;
  car_color?: string;
  tyre_id: string;
  quantity: number;
  notes?: string;
  contact_name: string;
  contact_phone: string;
}

export interface TyreBookingResponse {
  response_code: string;
  message: string;
  booking_reference: string;
  total_amount: number;
  service_schedule: string;
  service_location: string;
  car_registration_number: string;
  car_model: string;
  tyre: TyreItem;
  quantity: number;
  created_at: string;
}

// ==========================================
// STATIC PROVIDERS
// ==========================================
export const TYRE_PROVIDERS: TyreProvider[] = [
  {
    id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    company_name: "MMC Rapid Mobile Tyres London",
    company_phone: "+44 20 7946 0912",
    company_address: "Silbury House, Sydenham Hill, London, SE26 6TU",
    rating: 4.9,
    reviews_count: 328,
    mobile_fitting_available: true,
    garage_fitting_available: true,
    emergency_24_7: true,
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "a812be44-7711-4bc1-90a1-771a4f0288cd",
    company_name: "Apex Mobile Tyre Pros & Alignment",
    company_phone: "+44 20 8123 4567",
    company_address: "Park Royal Business Park, London, NW10 7HQ",
    rating: 4.8,
    reviews_count: 215,
    mobile_fitting_available: true,
    garage_fitting_available: true,
    emergency_24_7: false,
    logo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "b450fe99-231a-45c2-871f-998811dd22aa",
    company_name: "Central London Wheel & Tyre Station",
    company_phone: "+44 20 7111 8899",
    company_address: "Battersea Business Quarter, London, SW8 4BW",
    rating: 4.9,
    reviews_count: 412,
    mobile_fitting_available: true,
    garage_fitting_available: true,
    emergency_24_7: true,
    logo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
  },
];

// ==========================================
// UK REGISTRATION PRESETS FOR INSTANT SEARCH
// ==========================================
export const UK_VEHICLE_DATABASE: Record<string, UKVehicleLookup> = {
  "UK22ABC": {
    registration: "UK22 ABC",
    make: "Toyota",
    model: "Corolla Touring Sports",
    year: "2022",
    color: "Pure White",
    recommended_front_size: "205/55 R16",
    recommended_rear_size: "205/55 R16",
  },
  "UK22XYZ": {
    registration: "UK22 XYZ",
    make: "Honda",
    model: "Civic VTEC Turbo",
    year: "2022",
    color: "Sonic Grey Pearl",
    recommended_front_size: "225/45 R17",
    recommended_rear_size: "225/45 R17",
  },
  "LN73VHD": {
    registration: "LN73 VHD",
    make: "Mercedes-Benz",
    model: "G-Class G63 AMG",
    year: "2023",
    color: "Obsidian Black Metallic",
    recommended_front_size: "275/45 R21",
    recommended_rear_size: "275/45 R21",
  },
  "EV24TES": {
    registration: "EV24 TES",
    make: "Tesla",
    model: "Model 3 Long Range AWD",
    year: "2024",
    color: "Solid Black",
    recommended_front_size: "235/40 R19",
    recommended_rear_size: "235/40 R19",
  },
  "BM71BMW": {
    registration: "BM71 BMW",
    make: "BMW",
    model: "3 Series 330e M Sport",
    year: "2021",
    color: "Portimao Blue",
    recommended_front_size: "225/45 R18",
    recommended_rear_size: "255/40 R18",
  },
  "AU23RS6": {
    registration: "AU23 RS6",
    make: "Audi",
    model: "RS6 Avant V8 Biturbo",
    year: "2023",
    color: "Nardo Grey",
    recommended_front_size: "275/35 R21",
    recommended_rear_size: "275/35 R21",
  },
};

// ==========================================
// COMPREHENSIVE STATIC TYRE CATALOGUE
// ==========================================
export const TYRES_CATALOGUE: TyreItem[] = [
  {
    id: "c8821943-7f8a-495d-9da5-f938f2197e41",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Michelin",
    model: "Pilot Sport 5",
    width: 225,
    profile: 45,
    rim_size: 17,
    load_index: 94,
    speed_rating: "Y",
    size_string: "225/45 R17 94Y XL",
    season: "summer",
    vehicle_type: "passenger",
    is_runflat: false,
    is_reinforced: true,
    is_ev_compatible: true,
    unit_price: 118.5,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80",
    in_stock: 14,
    description: "Ultra-high performance sports tyre engineered for superior longevity, steering precision, and outstanding wet and dry braking.",
    eu_label: {
      fuel_efficiency: "C",
      wet_grip: "A",
      noise_db: 71,
      noise_class: "B",
    },
    provider: TYRE_PROVIDERS[0],
    features: [
      "MaxTouch Construction for long tread life",
      "Dual Sport Tread Design for wet/dry mastery",
      "Premium Touch Velvet sidewall finish",
      "Dynamic Response Technology",
    ],
  },
  {
    id: "a1239841-55bb-4aa1-9311-8899aabbcc11",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Continental",
    model: "PremiumContact 7",
    width: 205,
    profile: 55,
    rim_size: 16,
    load_index: 91,
    speed_rating: "V",
    size_string: "205/55 R16 91V",
    season: "summer",
    vehicle_type: "passenger",
    is_runflat: false,
    is_reinforced: false,
    is_ev_compatible: true,
    unit_price: 89.0,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    in_stock: 22,
    description: "Benchmark touring tyre providing exceptional ride comfort, ultra-low rolling noise, and class-leading wet braking distances.",
    eu_label: {
      fuel_efficiency: "B",
      wet_grip: "A",
      noise_db: 69,
      noise_class: "A",
    },
    provider: TYRE_PROVIDERS[0],
    features: [
      "Adaptive Pattern Design for all road states",
      "RedChili Compound for instant cold grip",
      "Quiet Tread Ribs for acoustic calm",
      "EV-Ready Certified badge",
    ],
  },
  {
    id: "b7766112-99cc-4331-88aa-112233445566",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Pirelli",
    model: "P Zero PZ4 Luxury",
    width: 245,
    profile: 40,
    rim_size: 18,
    load_index: 97,
    speed_rating: "Y",
    size_string: "245/40 R18 97Y XL",
    season: "summer",
    vehicle_type: "passenger",
    is_runflat: true,
    is_reinforced: true,
    is_ev_compatible: false,
    unit_price: 145.0,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80",
    in_stock: 8,
    description: "Original equipment choice for the world's most prestigious sports saloons, combining extreme high-speed stability and run-flat security.",
    eu_label: {
      fuel_efficiency: "C",
      wet_grip: "A",
      noise_db: 70,
      noise_class: "B",
    },
    provider: TYRE_PROVIDERS[1],
    features: [
      "Self-Supporting Run-Flat sidewalls",
      "Customized inner tread for acoustic comfort",
      "High silica compound for wet responsiveness",
      "Approved for high performance executive cars",
    ],
  },
  {
    id: "d9911223-11aa-4bb2-99ee-778899001122",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Michelin",
    model: "CrossClimate 2 (All-Season)",
    width: 225,
    profile: 45,
    rim_size: 17,
    load_index: 94,
    speed_rating: "Y",
    size_string: "225/45 R17 94Y XL 3PMSF",
    season: "all_season",
    vehicle_type: "passenger",
    is_runflat: false,
    is_reinforced: true,
    is_ev_compatible: true,
    unit_price: 129.0,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
    in_stock: 18,
    description: "The UK's best-selling all-season tyre with full 3PMSF severe snow certification, delivering year-round safety in rain, frost, heat, and snow.",
    eu_label: {
      fuel_efficiency: "B",
      wet_grip: "B",
      noise_db: 70,
      noise_class: "B",
    },
    provider: TYRE_PROVIDERS[0],
    features: [
      "Thermal Adaptive Compound for all temperatures",
      "V-Ramp chamfers on block edges for dry grip",
      "MaxTouch Construction for long wear",
      "3 Peak Mountain Snowflake (3PMSF) rated",
    ],
  },
  {
    id: "e4455667-8899-4aa3-bbcc-334455667788",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Goodyear",
    model: "Eagle F1 Asymmetric 6",
    width: 235,
    profile: 40,
    rim_size: 19,
    load_index: 96,
    speed_rating: "Y",
    size_string: "235/40 R19 96Y XL",
    season: "summer",
    vehicle_type: "passenger",
    is_runflat: false,
    is_reinforced: true,
    is_ev_compatible: true,
    unit_price: 159.0,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80",
    in_stock: 12,
    description: "Award-winning ultra-high performance tyre tailored for sports sedans, electric vehicles, and coupes with EV-Ready low rolling resistance.",
    eu_label: {
      fuel_efficiency: "B",
      wet_grip: "A",
      noise_db: 69,
      noise_class: "A",
    },
    provider: TYRE_PROVIDERS[2],
    features: [
      "Dry Contact Plus Technology adapts to driving style",
      "WetBraking Pro Technology for torrential rain safety",
      "Noise cancelling block pattern for EV whisper quietness",
      "Auto Express Tyre of the Year Winner",
    ],
  },
  {
    id: "f1122334-5566-4778-8990-aabbccddeeff",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Pirelli",
    model: "Scorpion Verde All Season",
    width: 275,
    profile: 45,
    rim_size: 21,
    load_index: 110,
    speed_rating: "W",
    size_string: "275/45 R21 110W XL",
    season: "all_season",
    vehicle_type: "suv_4x4",
    is_runflat: false,
    is_reinforced: true,
    is_ev_compatible: false,
    unit_price: 245.0,
    fitting_fee: 20.0,
    image_url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80",
    in_stock: 6,
    description: "Green Performance SUV tyre specifically engineered for crossover and luxury 4x4 vehicles (Range Rover, Mercedes G-Wagon, Porsche Cayenne).",
    eu_label: {
      fuel_efficiency: "B",
      wet_grip: "B",
      noise_db: 71,
      noise_class: "B",
    },
    provider: TYRE_PROVIDERS[0],
    features: [
      "Reinforced heavy-duty SUV casing",
      "Optimal longitudinal siping for lateral stability",
      "High silica tread reduces fuel consumption",
      "Mud & Snow (M+S) verified",
    ],
  },
  {
    id: "g7788990-1122-4334-5566-778899aabbcc",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Bridgestone",
    model: "Turanza 6 Enliten",
    width: 205,
    profile: 55,
    rim_size: 16,
    load_index: 91,
    speed_rating: "H",
    size_string: "205/55 R16 91H",
    season: "summer",
    vehicle_type: "passenger",
    is_runflat: false,
    is_reinforced: false,
    is_ev_compatible: true,
    unit_price: 84.5,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
    in_stock: 25,
    description: "Next-generation touring tyre engineered with ENLITEN lightweight technology for electric, hybrid, and combustion engines.",
    eu_label: {
      fuel_efficiency: "A",
      wet_grip: "A",
      noise_db: 68,
      noise_class: "A",
    },
    provider: TYRE_PROVIDERS[1],
    features: [
      "ENLITEN technology lowers weight & fuel burn",
      "Best-in-class EU Label Double-A rating",
      "High mileage compound with 22% extended lifespan",
      "EV-Ready for instant electric torque",
    ],
  },
  {
    id: "h9900112-2233-4455-6677-8899aabbccdd",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Hankook",
    model: "Ventus S1 evo3 EV (iON)",
    width: 235,
    profile: 40,
    rim_size: 19,
    load_index: 96,
    speed_rating: "Y",
    size_string: "235/40 R19 96Y SoundAbsorber",
    season: "summer",
    vehicle_type: "ev",
    is_runflat: false,
    is_reinforced: true,
    is_ev_compatible: true,
    unit_price: 139.0,
    fitting_fee: 15.0,
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    in_stock: 15,
    description: "Tailored specifically for modern electric vehicles with internal polyurethane SoundAbsorber foam and ultra-low rolling drag.",
    eu_label: {
      fuel_efficiency: "A",
      wet_grip: "A",
      noise_db: 67,
      noise_class: "A",
    },
    provider: TYRE_PROVIDERS[2],
    features: [
      "SoundAbsorber foam reduces cabin resonance by 5dB",
      "Aramid hybrid reinforcement resists battery weight flex",
      "Optimized battery range extension compound",
      "Tesla, Polestar & Porsche Taycan fitment",
    ],
  },
];

// ==========================================
// TYRE FILTER DIMENSIONS PRESETS
// ==========================================
export const TYRE_WIDTHS = [195, 205, 215, 225, 235, 245, 255, 275, 285, 295];
export const TYRE_PROFILES = [35, 40, 45, 50, 55, 60, 65];
export const TYRE_RIMS = [15, 16, 17, 18, 19, 20, 21, 22];
export const TYRE_BRANDS = [
  "All Brands",
  "Michelin",
  "Continental",
  "Pirelli",
  "Goodyear",
  "Bridgestone",
  "Hankook",
];
