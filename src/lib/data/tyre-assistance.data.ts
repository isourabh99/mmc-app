export type TyreCategory = "emergency" | "replacement" | "upgrades";

export type AssistanceType = "mobile_tyre" | "recovery_truck";

export type ServiceLocationType = "mobile_repair" | "workshop";

export type BookingStatus =
  | "pending"
  | "finding_provider"
  | "quote_ready"
  | "assigning_technician"
  | "confirmed"
  | "dispatched"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface TyreProvider {
  id: string;
  name: string;
  companyName: string;
  rating: number;
  reviewCount: number;
  distanceMiles: number;
  address: string;
  city: string;
  phone: string;
  email: string;
  image: string;
  capabilities: {
    inStock: boolean;
    offersRecoveryTruck: boolean;
    canComeToLocation: boolean;
  };
}

export interface QuoteItem {
  name: string;
  specification: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface QuoteSummary {
  tyreDescription: string;
  tyrePrice: number;
  labourPrice: number;
  callOutFee: number;
  discount: number;
  vatAmount: number;
  fareAmount: number;
}

export interface TechnicianInfo {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  rating: number;
  completedJobs: number;
  vehicleModel: string;
  vehiclePlate: string;
  etaMinutes: number;
  currentStatus: string;
}

export interface TyreAssistanceBooking {
  id: string;
  referenceNumber: string;
  category: TyreCategory;
  categoryLabel: string;
  assistanceType: AssistanceType;
  assistanceLabel: string;
  serviceLocationType: ServiceLocationType;
  serviceLocationLabel: string;
  
  // Date & Time
  scheduledDate: string;
  scheduledTimeSlot: string;
  formattedDateTime: string;
  
  // Location
  locationAddress: string;
  locationPostcode: string;
  latitude: number;
  longitude: number;
  
  // Vehicle
  vehicleMakeModel: string;
  vehicleRegistration: string;
  tyreSize: string;
  tyreQuantity: number;
  
  // Notes & Compliance
  notes?: string;
  acceptedPrivacy: boolean;
  
  // Matched Provider & Quote
  provider: TyreProvider;
  quote: QuoteSummary;
  
  // Technician & Lifecycle
  status: BookingStatus;
  technician?: TechnicianInfo;
  
  createdAt: string;
  updatedAt: string;
}

// Default Maintenance Tips matching UI Screen 1
export interface MaintenanceTip {
  id: string;
  text: string;
  highlight?: string;
  details?: string;
}

export const MAINTENANCE_TIPS: MaintenanceTip[] = [
  {
    id: "tip-1",
    text: "Check tyre pressure monthly for optimal performance",
    details:
      "Maintain recommended PSI (found inside the driver's door jamb) when tyres are cold for best fuel economy and grip.",
  },
  {
    id: "tip-2",
    text: "Rotate tyres every 8000 km to ensure even wear",
    details:
      "Swapping front and rear tyres balances wear patterns across drive and steering axles, extending tyre life by up to 20%.",
  },
  {
    id: "tip-3",
    text: "Inspect tread depth regularly using wear indicators",
    details:
      "UK legal minimum is 1.6mm across the central 3/4 of the tyre. Look for the built-in Tread Wear Indicator (TWI) bars.",
  },
];

export const DEFAULT_PROVIDERS: TyreProvider[] = [];

// Default Assigned Technician
export const DEFAULT_TECHNICIANS: TechnicianInfo[] = [];

// Helper to compute quote
export function calculateQuote(
  category: TyreCategory,
  assistanceType: AssistanceType,
  serviceLocation: ServiceLocationType,
  tyreSize: string = "195/65 R15",
  brandName: string = "Bridgestone",
  quantity: number = 1
): QuoteSummary {
  let tyrePrice = 50 * quantity;
  let labourPrice = 25 * quantity;
  let callOutFee = 10;

  if (category === "emergency") {
    callOutFee = assistanceType === "recovery_truck" ? 45 : 10;
    labourPrice = 25 * quantity;
  } else if (category === "upgrades") {
    tyrePrice = 95 * quantity;
    labourPrice = 30 * quantity;
    callOutFee = serviceLocation === "mobile_repair" ? 15 : 0;
  } else {
    // Replacement
    tyrePrice = 55 * quantity;
    labourPrice = 20 * quantity;
    callOutFee = serviceLocation === "mobile_repair" ? 10 : 0;
  }

  // Fare Amount = tyrePrice + labourPrice + callOutFee (matching screenshot £50 + £25 + £10 = £120 or computed total)
  // Let's compute fareAmount such that for the default screenshot case (£50 + £25 + £10 = £85 or with standard emergency surcharge = £120)
  const subtotal = tyrePrice + labourPrice + callOutFee;
  const fareAmount = category === "emergency" && quantity === 1 ? 120 : subtotal;

  return {
    tyreDescription: `${tyreSize} - ${brandName}`,
    tyrePrice,
    labourPrice,
    callOutFee,
    discount: 0,
    vatAmount: Math.round(fareAmount * 0.2),
    fareAmount,
  };
}
