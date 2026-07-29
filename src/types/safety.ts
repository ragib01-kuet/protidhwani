/**
 * Shared domain types for the Community Safety Intelligence Map.
 * Everything here is demo/frontend-only — no backend contracts depend on it.
 */

export type AreaLevel = "division" | "district" | "upazila" | "neighbourhood";

export interface AreaProperties {
  id: string;
  nameEn: string;
  nameBn: string;
  level: AreaLevel;
  /** 0–100, higher is safer. */
  safetyScore: number;
  trend: "improving" | "stable" | "worsening";
  verifiedReports: number;
  policeCount: number;
  hospitalCount: number;
  shelterCount: number;
  volunteerCount: number;
  /** Pre-seeded (not computed) breakdown shown in the area sheet. */
  topCategories: { category: IncidentCategory; percent: number }[];
  /** Sheet-anchor point, also used by search fly-to. */
  center: [number, number]; // [lng, lat]
}

export type IncidentCategory =
  | "harassment"
  | "road_accident"
  | "phone_snatching"
  | "flood"
  | "fire"
  | "medical"
  | "missing_person"
  | "infrastructure"
  | "power_outage"
  | "political_unrest"
  | "suspicious_activity";

export interface Incident {
  id: string;
  category: IncidentCategory;
  lat: number;
  lng: number;
  severity: 1 | 2 | 3 | 4 | 5;
  verified: boolean;
  timestampISO: string;
  areaId: string;
}

export type ServiceType =
  | "police"
  | "hospital"
  | "shelter"
  | "ngo"
  | "charging_station"
  | "public_toilet"
  | "blood_donation"
  | "legal_aid"
  | "womens_help_center";

export interface ServicePoint {
  id: string;
  type: ServiceType;
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
}

export interface DemoRoute {
  id: "safest" | "balanced" | "fastest";
  travelTimeMin: number;
  safetyScore: number;
  incidentDensity: "low" | "medium" | "high";
  lightingAvailable: boolean;
  policeCoverage: "low" | "medium" | "high";
  /** [lng, lat] pairs. */
  path: [number, number][];
}

export interface DemoRouteSet {
  id: string;
  originId: string;
  destinationId: string;
  routes: DemoRoute[];
}

/** Map layers offered by the chip row. */
export type SafetyLayerId =
  | "community"
  | "crime"
  | "womens_safety"
  | "road"
  | "flood"
  | "fire"
  | "infrastructure";

export interface SafetyLayerDef {
  id: SafetyLayerId;
  bn: string;
  en: string;
  /** Empty for the "community" area-fill layer. */
  categories: IncidentCategory[];
}

/** Time windows for the incident slider. */
export type TimeWindow = "24h" | "week" | "month" | "year" | "all";

export interface InsightItem {
  id: string;
  bn: string;
  en: string;
  delta: string;
  tone: "positive" | "neutral" | "caution";
}

/** Unified entry used by the local (non-geocoding) search index. */
export interface SearchEntry {
  id: string;
  kind: "area" | "service";
  nameBn: string;
  nameEn: string;
  subtitleBn: string;
  subtitleEn: string;
  lng: number;
  lat: number;
  /** Present when kind === "area". */
  areaId?: string;
}
