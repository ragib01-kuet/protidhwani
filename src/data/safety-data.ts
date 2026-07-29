import type {
  AreaProperties,
  Incident,
  InsightItem,
  SafetyLayerDef,
  ServicePoint,
  MicroArea,
  DemoRouteSet,
  District,
  TimeWindow,
} from "@/types/safety";
import type { FeatureCollection, Point, Polygon } from "geojson";

/**
 * Seeded demo data. Deliberately small (8 areas, ~30 incidents) and fully
 * static: no geocoding, no routing API, no backend.
 */

/** Builds a soft rectangular boundary around a centre point. */
function boxAround(
  [lng, lat]: [number, number],
  halfWidth: number,
  halfHeight = halfWidth,
): [number, number][][] {
  return [
    [
      [lng - halfWidth, lat - halfHeight],
      [lng + halfWidth, lat - halfHeight],
      [lng + halfWidth, lat + halfHeight],
      [lng - halfWidth, lat + halfHeight],
      [lng - halfWidth, lat - halfHeight],
    ],
  ];
}

export const AREAS: AreaProperties[] = [
  {
    id: "mirpur-10",
    nameEn: "Mirpur 10",
    nameBn: "মিরপুর ১০",
    level: "neighbourhood",
    safetyScore: 46,
    trend: "worsening",
    verifiedReports: 128,
    policeCount: 3,
    hospitalCount: 4,
    shelterCount: 2,
    volunteerCount: 61,
    center: [90.3654, 23.8069],
    topCategories: [
      { category: "phone_snatching", percent: 34 },
      { category: "harassment", percent: 26 },
      { category: "road_accident", percent: 18 },
      { category: "infrastructure", percent: 12 },
    ],
  },
  {
    id: "gulshan-2",
    nameEn: "Gulshan 2",
    nameBn: "গুলশান ২",
    level: "neighbourhood",
    safetyScore: 86,
    trend: "improving",
    verifiedReports: 42,
    policeCount: 5,
    hospitalCount: 6,
    shelterCount: 1,
    volunteerCount: 38,
    center: [90.4152, 23.7925],
    topCategories: [
      { category: "road_accident", percent: 38 },
      { category: "infrastructure", percent: 24 },
      { category: "power_outage", percent: 20 },
    ],
  },
  {
    id: "dhanmondi",
    nameEn: "Dhanmondi",
    nameBn: "ধানমন্ডি",
    level: "neighbourhood",
    safetyScore: 72,
    trend: "stable",
    verifiedReports: 76,
    policeCount: 4,
    hospitalCount: 7,
    shelterCount: 2,
    volunteerCount: 54,
    center: [90.3742, 23.7461],
    topCategories: [
      { category: "harassment", percent: 30 },
      { category: "road_accident", percent: 28 },
      { category: "medical", percent: 16 },
    ],
  },
  {
    id: "motijheel",
    nameEn: "Motijheel",
    nameBn: "মতিঝিল",
    level: "neighbourhood",
    safetyScore: 58,
    trend: "stable",
    verifiedReports: 94,
    policeCount: 4,
    hospitalCount: 3,
    shelterCount: 1,
    volunteerCount: 29,
    center: [90.4172, 23.733],
    topCategories: [
      { category: "political_unrest", percent: 32 },
      { category: "phone_snatching", percent: 27 },
      { category: "road_accident", percent: 21 },
    ],
  },
  {
    id: "uttara",
    nameEn: "Uttara Sector 7",
    nameBn: "উত্তরা সেক্টর ৭",
    level: "neighbourhood",
    safetyScore: 81,
    trend: "improving",
    verifiedReports: 37,
    policeCount: 3,
    hospitalCount: 5,
    shelterCount: 2,
    volunteerCount: 44,
    center: [90.3983, 23.8759],
    topCategories: [
      { category: "road_accident", percent: 41 },
      { category: "infrastructure", percent: 22 },
      { category: "power_outage", percent: 15 },
    ],
  },
  {
    id: "lalbagh",
    nameEn: "Lalbagh, Old Dhaka",
    nameBn: "লালবাগ, পুরান ঢাকা",
    level: "neighbourhood",
    safetyScore: 34,
    trend: "worsening",
    verifiedReports: 163,
    policeCount: 2,
    hospitalCount: 2,
    shelterCount: 1,
    volunteerCount: 71,
    center: [90.388, 23.719],
    topCategories: [
      { category: "fire", percent: 33 },
      { category: "infrastructure", percent: 25 },
      { category: "harassment", percent: 22 },
      { category: "phone_snatching", percent: 14 },
    ],
  },
  {
    id: "chattogram",
    nameEn: "Chattogram Division",
    nameBn: "চট্টগ্রাম বিভাগ",
    level: "division",
    safetyScore: 63,
    trend: "stable",
    verifiedReports: 402,
    policeCount: 46,
    hospitalCount: 58,
    shelterCount: 24,
    volunteerCount: 512,
    center: [91.7832, 22.3569],
    topCategories: [
      { category: "flood", percent: 36 },
      { category: "road_accident", percent: 24 },
      { category: "infrastructure", percent: 19 },
    ],
  },
  {
    id: "rajshahi",
    nameEn: "Rajshahi Division",
    nameBn: "রাজশাহী বিভাগ",
    level: "division",
    safetyScore: 88,
    trend: "improving",
    verifiedReports: 187,
    policeCount: 38,
    hospitalCount: 41,
    shelterCount: 18,
    volunteerCount: 349,
    center: [88.6042, 24.3745],
    topCategories: [
      { category: "road_accident", percent: 34 },
      { category: "power_outage", percent: 26 },
      { category: "medical", percent: 17 },
    ],
  },
];

/** GeoJSON FeatureCollection consumed by the MapLibre fill layer. */
export const AREAS_GEOJSON: FeatureCollection<Polygon, AreaProperties> = {
  type: "FeatureCollection",
  features: AREAS.map((area) => ({
    type: "Feature",
    id: area.id,
    properties: area,
    geometry: {
      type: "Polygon",
      coordinates: boxAround(area.center, area.level === "division" ? 0.45 : 0.016),
    },
  })),
};

/**
 * Area centres as weighted points. Rendered as a smooth temperature surface so
 * the map never shows hard rectangular "boxes" — the polygons above are kept
 * purely as invisible click targets.
 */
export const AREA_HEAT_GEOJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: AREAS.map((area) => ({
    type: "Feature",
    id: `heat-${area.id}`,
    properties: {
      // Lower safety score -> hotter, normalised to a 1–5 scale.
      weight: Math.max(1, Math.min(5, Math.round((100 - area.safetyScore) / 20) + 1)),
    },
    geometry: { type: "Point", coordinates: area.center },
  })),
};



export const SERVICES: ServicePoint[] = [
  { id: "svc-1", type: "police", nameEn: "Mirpur Model Police Station", nameBn: "মিরপুর মডেল থানা", lng: 90.3671, lat: 23.8042 },
  { id: "svc-2", type: "hospital", nameEn: "Delta Medical Centre", nameBn: "ডেল্টা মেডিকেল সেন্টার", lng: 90.3688, lat: 23.8098 },
  { id: "svc-3", type: "womens_help_center", nameEn: "Women's Support Desk, Mirpur", nameBn: "নারী সহায়তা কেন্দ্র, মিরপুর", lng: 90.3629, lat: 23.8085 },
  { id: "svc-4", type: "police", nameEn: "Gulshan Police Station", nameBn: "গুলশান থানা", lng: 90.4141, lat: 23.7908 },
  { id: "svc-5", type: "hospital", nameEn: "United Hospital", nameBn: "ইউনাইটেড হাসপাতাল", lng: 90.4185, lat: 23.7952 },
  { id: "svc-6", type: "shelter", nameEn: "Dhanmondi Community Shelter", nameBn: "ধানমন্ডি কমিউনিটি আশ্রয়কেন্দ্র", lng: 90.3729, lat: 23.7484 },
  { id: "svc-7", type: "legal_aid", nameEn: "Citizen Legal Aid Desk", nameBn: "নাগরিক আইন সহায়তা ডেস্ক", lng: 90.3755, lat: 23.7442 },
  { id: "svc-8", type: "blood_donation", nameEn: "Sandhani Blood Bank", nameBn: "সন্ধানী রক্তদান কেন্দ্র", lng: 90.4159, lat: 23.7318 },
  { id: "svc-9", type: "ngo", nameEn: "Uttara Volunteer Hub", nameBn: "উত্তরা স্বেচ্ছাসেবক কেন্দ্র", lng: 90.3971, lat: 23.8774 },
  { id: "svc-10", type: "hospital", nameEn: "Lalbagh General Hospital", nameBn: "লালবাগ জেনারেল হাসপাতাল", lng: 90.3894, lat: 23.7205 },
  { id: "svc-11", type: "charging_station", nameEn: "Motijheel Charging Point", nameBn: "মতিঝিল চার্জিং পয়েন্ট", lng: 90.4188, lat: 23.7341 },
  { id: "svc-12", type: "public_toilet", nameEn: "Gulshan Public Toilet", nameBn: "গুলশান পাবলিক টয়লেট", lng: 90.4123, lat: 23.7937 },
];

/** Incidents seeded per time window (cumulative, pre-computed — not derived at runtime). */
const LAST_24H: Incident[] = [
  { id: "i1", category: "phone_snatching", lng: 90.3661, lat: 23.8081, severity: 3, verified: true, timestampISO: "2026-07-29T04:20:00Z", areaId: "mirpur-10" },
  { id: "i2", category: "harassment", lng: 90.3639, lat: 23.8052, severity: 4, verified: true, timestampISO: "2026-07-29T01:05:00Z", areaId: "mirpur-10" },
  { id: "i3", category: "road_accident", lng: 90.4161, lat: 23.7911, severity: 2, verified: true, timestampISO: "2026-07-28T21:40:00Z", areaId: "gulshan-2" },
  { id: "i4", category: "fire", lng: 90.3872, lat: 23.7181, severity: 5, verified: true, timestampISO: "2026-07-28T19:12:00Z", areaId: "lalbagh" },
  { id: "i5", category: "infrastructure", lng: 90.3901, lat: 23.7204, severity: 2, verified: false, timestampISO: "2026-07-28T17:55:00Z", areaId: "lalbagh" },
  { id: "i6", category: "medical", lng: 90.3748, lat: 23.7452, severity: 3, verified: true, timestampISO: "2026-07-28T16:30:00Z", areaId: "dhanmondi" },
  { id: "i7", category: "political_unrest", lng: 90.4166, lat: 23.7335, severity: 4, verified: false, timestampISO: "2026-07-28T14:10:00Z", areaId: "motijheel" },
  { id: "i8", category: "power_outage", lng: 90.3991, lat: 23.8765, severity: 1, verified: true, timestampISO: "2026-07-28T11:00:00Z", areaId: "uttara" },
];

const WEEK_EXTRA: Incident[] = [
  { id: "i9", category: "phone_snatching", lng: 90.3648, lat: 23.8095, severity: 3, verified: true, timestampISO: "2026-07-26T20:00:00Z", areaId: "mirpur-10" },
  { id: "i10", category: "harassment", lng: 90.3721, lat: 23.7472, severity: 4, verified: true, timestampISO: "2026-07-25T18:20:00Z", areaId: "dhanmondi" },
  { id: "i11", category: "road_accident", lng: 90.3969, lat: 23.8741, severity: 3, verified: true, timestampISO: "2026-07-25T08:45:00Z", areaId: "uttara" },
  { id: "i12", category: "suspicious_activity", lng: 90.4179, lat: 23.7322, severity: 2, verified: false, timestampISO: "2026-07-24T23:30:00Z", areaId: "motijheel" },
  { id: "i13", category: "flood", lng: 91.7811, lat: 22.3552, severity: 4, verified: true, timestampISO: "2026-07-24T06:10:00Z", areaId: "chattogram" },
  { id: "i14", category: "fire", lng: 90.3888, lat: 23.7169, severity: 4, verified: true, timestampISO: "2026-07-23T22:05:00Z", areaId: "lalbagh" },
  { id: "i15", category: "missing_person", lng: 90.3665, lat: 23.8031, severity: 5, verified: false, timestampISO: "2026-07-23T15:25:00Z", areaId: "mirpur-10" },
  { id: "i16", category: "infrastructure", lng: 90.4144, lat: 23.7939, severity: 1, verified: true, timestampISO: "2026-07-23T09:40:00Z", areaId: "gulshan-2" },
  { id: "i17", category: "road_accident", lng: 88.6021, lat: 24.3731, severity: 3, verified: true, timestampISO: "2026-07-23T07:15:00Z", areaId: "rajshahi" },
  { id: "i18", category: "harassment", lng: 90.4158, lat: 23.7344, severity: 3, verified: true, timestampISO: "2026-07-23T05:50:00Z", areaId: "motijheel" },
];

const MONTH_EXTRA: Incident[] = [
  { id: "i19", category: "flood", lng: 91.7869, lat: 22.3591, severity: 5, verified: true, timestampISO: "2026-07-12T04:00:00Z", areaId: "chattogram" },
  { id: "i20", category: "flood", lng: 91.7788, lat: 22.3608, severity: 3, verified: true, timestampISO: "2026-07-11T12:30:00Z", areaId: "chattogram" },
  { id: "i21", category: "phone_snatching", lng: 90.3677, lat: 23.8058, severity: 2, verified: true, timestampISO: "2026-07-09T21:10:00Z", areaId: "mirpur-10" },
  { id: "i22", category: "power_outage", lng: 88.6068, lat: 24.3762, severity: 2, verified: true, timestampISO: "2026-07-08T18:00:00Z", areaId: "rajshahi" },
  { id: "i23", category: "road_accident", lng: 90.3733, lat: 23.7439, severity: 4, verified: true, timestampISO: "2026-07-06T10:20:00Z", areaId: "dhanmondi" },
  { id: "i24", category: "infrastructure", lng: 90.3859, lat: 23.7212, severity: 3, verified: false, timestampISO: "2026-07-05T13:35:00Z", areaId: "lalbagh" },
  { id: "i25", category: "medical", lng: 90.4132, lat: 23.7918, severity: 2, verified: true, timestampISO: "2026-07-04T08:05:00Z", areaId: "gulshan-2" },
  { id: "i26", category: "political_unrest", lng: 90.4181, lat: 23.7351, severity: 5, verified: true, timestampISO: "2026-07-02T16:45:00Z", areaId: "motijheel" },
];

const OLDER: Incident[] = [
  { id: "i27", category: "fire", lng: 90.3866, lat: 23.7223, severity: 4, verified: true, timestampISO: "2026-03-18T11:00:00Z", areaId: "lalbagh" },
  { id: "i28", category: "flood", lng: 91.7845, lat: 22.3524, severity: 5, verified: true, timestampISO: "2025-09-14T05:30:00Z", areaId: "chattogram" },
  { id: "i29", category: "harassment", lng: 90.3701, lat: 23.7495, severity: 3, verified: true, timestampISO: "2025-11-02T19:15:00Z", areaId: "dhanmondi" },
  { id: "i30", category: "missing_person", lng: 88.6009, lat: 24.3778, severity: 4, verified: false, timestampISO: "2025-12-21T14:00:00Z", areaId: "rajshahi" },
];

export const INCIDENTS_BY_WINDOW: Record<TimeWindow, Incident[]> = {
  "24h": LAST_24H,
  week: [...LAST_24H, ...WEEK_EXTRA],
  month: [...LAST_24H, ...WEEK_EXTRA, ...MONTH_EXTRA],
  year: [...LAST_24H, ...WEEK_EXTRA, ...MONTH_EXTRA, ...OLDER],
  all: [...LAST_24H, ...WEEK_EXTRA, ...MONTH_EXTRA, ...OLDER],
};

export const TIME_WINDOWS: { id: TimeWindow; bn: string; en: string }[] = [
  { id: "24h", bn: "২৪ ঘণ্টা", en: "24h" },
  { id: "week", bn: "সপ্তাহ", en: "Week" },
  { id: "month", bn: "মাস", en: "Month" },
  { id: "year", bn: "বছর", en: "Year" },
  { id: "all", bn: "সব সময়", en: "All time" },
];

export const SAFETY_LAYERS: SafetyLayerDef[] = [
  { id: "community", bn: "কমিউনিটি নিরাপত্তা", en: "Community Safety", categories: [] },
  { id: "crime", bn: "অপরাধ রিপোর্ট", en: "Crime Reports", categories: ["phone_snatching", "suspicious_activity", "political_unrest"] },
  { id: "womens_safety", bn: "নারী নিরাপত্তা", en: "Women's Safety", categories: ["harassment", "missing_person"] },
  { id: "road", bn: "সড়ক দুর্ঘটনা", en: "Road Accidents", categories: ["road_accident"] },
  { id: "flood", bn: "বন্যা ঝুঁকি", en: "Flood Risk", categories: ["flood"] },
  { id: "fire", bn: "অগ্নিকাণ্ড", en: "Fire", categories: ["fire"] },
  { id: "infrastructure", bn: "অবকাঠামো", en: "Infrastructure", categories: ["infrastructure", "power_outage"] },
];

export const CATEGORY_LABELS: Record<string, { bn: string; en: string }> = {
  harassment: { bn: "হয়রানি", en: "Harassment" },
  road_accident: { bn: "সড়ক দুর্ঘটনা", en: "Road accident" },
  phone_snatching: { bn: "ছিনতাই", en: "Snatching" },
  flood: { bn: "বন্যা", en: "Flood" },
  fire: { bn: "অগ্নিকাণ্ড", en: "Fire" },
  medical: { bn: "চিকিৎসা", en: "Medical" },
  missing_person: { bn: "নিখোঁজ", en: "Missing person" },
  infrastructure: { bn: "অবকাঠামো", en: "Infrastructure" },
  power_outage: { bn: "বিদ্যুৎ বিভ্রাট", en: "Power outage" },
  political_unrest: { bn: "রাজনৈতিক অস্থিরতা", en: "Unrest" },
  suspicious_activity: { bn: "সন্দেহজনক তৎপরতা", en: "Suspicious activity" },
};

export const SERVICE_LABELS: Record<string, { bn: string; en: string }> = {
  police: { bn: "থানা", en: "Police" },
  hospital: { bn: "হাসপাতাল", en: "Hospital" },
  shelter: { bn: "আশ্রয়কেন্দ্র", en: "Shelter" },
  ngo: { bn: "এনজিও", en: "NGO" },
  charging_station: { bn: "চার্জিং স্টেশন", en: "Charging" },
  public_toilet: { bn: "পাবলিক টয়লেট", en: "Public toilet" },
  blood_donation: { bn: "রক্তদান", en: "Blood donation" },
  legal_aid: { bn: "আইনি সহায়তা", en: "Legal aid" },
  womens_help_center: { bn: "নারী সহায়তা", en: "Women's help" },
};

/** Pre-seeded origin/destination pairs — stands in for a routing API. */
export const DEMO_ROUTES: DemoRouteSet[] = [
  {
    id: "mirpur-gulshan",
    originId: "mirpur-10",
    destinationId: "gulshan-2",
    routes: [
      {
        id: "safest",
        travelTimeMin: 38,
        safetyScore: 84,
        incidentDensity: "low",
        lightingAvailable: true,
        policeCoverage: "high",
        path: [
          [90.3654, 23.8069],
          [90.3812, 23.8121],
          [90.4021, 23.8034],
          [90.4152, 23.7925],
        ],
      },
      {
        id: "balanced",
        travelTimeMin: 31,
        safetyScore: 66,
        incidentDensity: "medium",
        lightingAvailable: true,
        policeCoverage: "medium",
        path: [
          [90.3654, 23.8069],
          [90.3798, 23.7995],
          [90.3995, 23.7951],
          [90.4152, 23.7925],
        ],
      },
      {
        id: "fastest",
        travelTimeMin: 24,
        safetyScore: 45,
        incidentDensity: "high",
        lightingAvailable: false,
        policeCoverage: "low",
        path: [
          [90.3654, 23.8069],
          [90.3771, 23.7902],
          [90.3988, 23.7869],
          [90.4152, 23.7925],
        ],
      },
    ],
  },
  {
    id: "dhanmondi-motijheel",
    originId: "dhanmondi",
    destinationId: "motijheel",
    routes: [
      {
        id: "safest",
        travelTimeMin: 34,
        safetyScore: 79,
        incidentDensity: "low",
        lightingAvailable: true,
        policeCoverage: "high",
        path: [
          [90.3742, 23.7461],
          [90.3901, 23.7521],
          [90.4079, 23.7432],
          [90.4172, 23.733],
        ],
      },
      {
        id: "balanced",
        travelTimeMin: 28,
        safetyScore: 61,
        incidentDensity: "medium",
        lightingAvailable: true,
        policeCoverage: "medium",
        path: [
          [90.3742, 23.7461],
          [90.3888, 23.7415],
          [90.4041, 23.7378],
          [90.4172, 23.733],
        ],
      },
      {
        id: "fastest",
        travelTimeMin: 21,
        safetyScore: 42,
        incidentDensity: "high",
        lightingAvailable: false,
        policeCoverage: "low",
        path: [
          [90.3742, 23.7461],
          [90.3869, 23.7301],
          [90.4032, 23.7268],
          [90.4172, 23.733],
        ],
      },
    ],
  },
  {
    id: "lalbagh-uttara",
    originId: "lalbagh",
    destinationId: "uttara",
    routes: [
      {
        id: "safest",
        travelTimeMin: 71,
        safetyScore: 76,
        incidentDensity: "low",
        lightingAvailable: true,
        policeCoverage: "high",
        path: [
          [90.388, 23.719],
          [90.3801, 23.7688],
          [90.3872, 23.8271],
          [90.3983, 23.8759],
        ],
      },
      {
        id: "balanced",
        travelTimeMin: 62,
        safetyScore: 58,
        incidentDensity: "medium",
        lightingAvailable: true,
        policeCoverage: "medium",
        path: [
          [90.388, 23.719],
          [90.3752, 23.7719],
          [90.3762, 23.8302],
          [90.3983, 23.8759],
        ],
      },
      {
        id: "fastest",
        travelTimeMin: 49,
        safetyScore: 39,
        incidentDensity: "high",
        lightingAvailable: false,
        policeCoverage: "low",
        path: [
          [90.388, 23.719],
          [90.3651, 23.7801],
          [90.3639, 23.8388],
          [90.3983, 23.8759],
        ],
      },
    ],
  },
];

export const INSIGHTS: InsightItem[] = [
  { id: "in-1", bn: "এই মাসে নারীর নিরাপত্তা ১২% উন্নত হয়েছে", en: "Women's safety improved 12% this month", delta: "+১২%", tone: "positive" },
  { id: "in-2", bn: "রাতের সড়কবাতি কভারেজ বেড়েছে ৮%", en: "Night street-lighting coverage up 8%", delta: "+৮%", tone: "positive" },
  { id: "in-3", bn: "পুরান ঢাকায় অগ্নিঝুঁকি রিপোর্ট বেড়েছে", en: "Fire-risk reports rising in Old Dhaka", delta: "+১৯%", tone: "caution" },
  { id: "in-4", bn: "যাচাইকৃত রিপোর্টের গড় সময় ৪১ মিনিট", en: "Average verification time is 41 minutes", delta: "৪১ মি", tone: "neutral" },
];

/** Fallback used when Geolocation is unavailable or denied. */
export const DHAKA_FALLBACK: { lng: number; lat: number } = { lng: 90.4125, lat: 23.8103 };

/**
 * Street / para level units. These drive precise search results and the
 * micro heat points that make the overlay readable at high zoom.
 */
export const MICRO_AREAS: MicroArea[] = [
  // Mirpur 10
  { id: "m-mirpur-1", areaId: "mirpur-10", nameBn: "মিরপুর ১০ গোলচত্বর", nameEn: "Mirpur 10 Roundabout", kind: "spot", safetyScore: 38, reportCount: 41, lng: 90.3688, lat: 23.8073 },
  { id: "m-mirpur-2", areaId: "mirpur-10", nameBn: "শাহ আলী মার্কেট রোড", nameEn: "Shah Ali Market Road", kind: "street", safetyScore: 44, reportCount: 27, lng: 90.3611, lat: 23.8102 },
  { id: "m-mirpur-3", areaId: "mirpur-10", nameBn: "সেনপাড়া পর্বতা", nameEn: "Senpara Parbata", kind: "para", safetyScore: 52, reportCount: 19, lng: 90.3721, lat: 23.8035 },
  { id: "m-mirpur-4", areaId: "mirpur-10", nameBn: "কাজীপাড়া গলি", nameEn: "Kazipara Lane", kind: "street", safetyScore: 41, reportCount: 23, lng: 90.3702, lat: 23.7961 },

  // Gulshan 2
  { id: "m-gulshan-1", areaId: "gulshan-2", nameBn: "গুলশান ২ চত্বর", nameEn: "Gulshan 2 Circle", kind: "spot", safetyScore: 88, reportCount: 9, lng: 90.4151, lat: 23.7936 },
  { id: "m-gulshan-2", areaId: "gulshan-2", nameBn: "রোড ১১, গুলশান", nameEn: "Road 11, Gulshan", kind: "street", safetyScore: 84, reportCount: 12, lng: 90.4106, lat: 23.7891 },
  { id: "m-gulshan-3", areaId: "gulshan-2", nameBn: "নিকেতন আবাসিক", nameEn: "Niketan Residential", kind: "para", safetyScore: 79, reportCount: 14, lng: 90.4189, lat: 23.7842 },

  // Dhanmondi
  { id: "m-dhanmondi-1", areaId: "dhanmondi", nameBn: "সাত মসজিদ রোড", nameEn: "Satmasjid Road", kind: "street", safetyScore: 68, reportCount: 26, lng: 90.3702, lat: 23.7488 },
  { id: "m-dhanmondi-2", areaId: "dhanmondi", nameBn: "ধানমন্ডি ২৭ নম্বর", nameEn: "Dhanmondi 27", kind: "spot", safetyScore: 61, reportCount: 31, lng: 90.3766, lat: 23.7541 },
  { id: "m-dhanmondi-3", areaId: "dhanmondi", nameBn: "রায়েরবাজার", nameEn: "Rayer Bazar", kind: "para", safetyScore: 54, reportCount: 22, lng: 90.3629, lat: 23.7452 },

  // Motijheel
  { id: "m-motijheel-1", areaId: "motijheel", nameBn: "শাপলা চত্বর", nameEn: "Shapla Chattar", kind: "spot", safetyScore: 49, reportCount: 38, lng: 90.4189, lat: 23.7331 },
  { id: "m-motijheel-2", areaId: "motijheel", nameBn: "দিলকুশা বাণিজ্যিক এলাকা", nameEn: "Dilkusha Commercial Area", kind: "para", safetyScore: 57, reportCount: 21, lng: 90.4152, lat: 23.7288 },
  { id: "m-motijheel-3", areaId: "motijheel", nameBn: "টয়েনবি সার্কুলার রোড", nameEn: "Toynbee Circular Road", kind: "street", safetyScore: 62, reportCount: 16, lng: 90.4211, lat: 23.7362 },

  // Uttara
  { id: "m-uttara-1", areaId: "uttara", nameBn: "রাজলক্ষ্মী মোড়", nameEn: "Rajlakkhi Crossing", kind: "spot", safetyScore: 74, reportCount: 18, lng: 90.4004, lat: 23.8721 },
  { id: "m-uttara-2", areaId: "uttara", nameBn: "সোনারগাঁও জনপথ", nameEn: "Sonargaon Janapath", kind: "street", safetyScore: 82, reportCount: 11, lng: 90.3948, lat: 23.8789 },

  // Lalbagh
  { id: "m-lalbagh-1", areaId: "lalbagh", nameBn: "লালবাগ কেল্লা এলাকা", nameEn: "Lalbagh Fort Area", kind: "spot", safetyScore: 36, reportCount: 44, lng: 90.3881, lat: 23.7192 },
  { id: "m-lalbagh-2", areaId: "lalbagh", nameBn: "চকবাজার গলি", nameEn: "Chawkbazar Lane", kind: "street", safetyScore: 29, reportCount: 57, lng: 90.3934, lat: 23.7168 },
  { id: "m-lalbagh-3", areaId: "lalbagh", nameBn: "আজিমপুর ছাপরা মসজিদ", nameEn: "Azimpur Chapra Mosque", kind: "para", safetyScore: 43, reportCount: 25, lng: 90.3838, lat: 23.7258 },

  // Divisions — coarse anchors so the overlay covers the whole country.
  { id: "m-ctg-1", areaId: "chattogram", nameBn: "আগ্রাবাদ", nameEn: "Agrabad", kind: "para", safetyScore: 59, reportCount: 34, lng: 91.8121, lat: 22.3269 },
  { id: "m-ctg-2", areaId: "chattogram", nameBn: "জিইসি মোড়", nameEn: "GEC Circle", kind: "spot", safetyScore: 64, reportCount: 28, lng: 91.8211, lat: 22.3591 },
  { id: "m-raj-1", areaId: "rajshahi", nameBn: "সাহেব বাজার", nameEn: "Shaheb Bazar", kind: "spot", safetyScore: 83, reportCount: 15, lng: 88.6011, lat: 24.3688 },
  { id: "m-raj-2", areaId: "rajshahi", nameBn: "কাজলা গেট", nameEn: "Kazla Gate", kind: "street", safetyScore: 87, reportCount: 8, lng: 88.6382, lat: 24.3652 },
];

export const MICRO_AREA_KIND_LABELS: Record<MicroArea["kind"], { bn: string; en: string }> = {
  street: { bn: "সড়ক", en: "Street" },
  para: { bn: "পাড়া", en: "Para" },
  spot: { bn: "মোড়", en: "Spot" },
};

/**
 * Ambient heat points derived from micro areas. They keep the heat overlay
 * continuous across every area instead of only where incidents exist.
 */
export const MICRO_HEAT_GEOJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: MICRO_AREAS.map((m) => ({
    type: "Feature",
    id: m.id,
    properties: {
      // Lower safety score -> hotter. Normalised to the 1–5 severity scale.
      weight: Math.max(1, Math.min(5, Math.round((100 - m.safetyScore) / 20) + 1)),
    },
    geometry: { type: "Point", coordinates: [m.lng, m.lat] },
  })),
};

/**
 * Selectable districts. Only a few are seeded with areas / micro data — the
 * rest are intentionally present so the UI can state, honestly, that
 * street-level (micro) heat is not yet available there.
 */
export const DISTRICTS: District[] = [
  { id: "dhaka", nameBn: "ঢাকা", nameEn: "Dhaka", divisionBn: "ঢাকা বিভাগ", divisionEn: "Dhaka Division", center: [90.4045, 23.7808], zoom: 11.6, areaIds: ["mirpur-10", "gulshan-2", "dhanmondi", "motijheel", "uttara", "lalbagh"] },
  { id: "chattogram", nameBn: "চট্টগ্রাম", nameEn: "Chattogram", divisionBn: "চট্টগ্রাম বিভাগ", divisionEn: "Chattogram Division", center: [91.8123, 22.3419], zoom: 11.6, areaIds: ["chattogram"] },
  { id: "rajshahi", nameBn: "রাজশাহী", nameEn: "Rajshahi", divisionBn: "রাজশাহী বিভাগ", divisionEn: "Rajshahi Division", center: [88.6042, 24.3745], zoom: 11.6, areaIds: ["rajshahi"] },
  { id: "khulna", nameBn: "খুলনা", nameEn: "Khulna", divisionBn: "খুলনা বিভাগ", divisionEn: "Khulna Division", center: [89.5644, 22.8456], zoom: 11.2, areaIds: [] },
  { id: "sylhet", nameBn: "সিলেট", nameEn: "Sylhet", divisionBn: "সিলেট বিভাগ", divisionEn: "Sylhet Division", center: [91.8687, 24.8949], zoom: 11.2, areaIds: [] },
  { id: "barishal", nameBn: "বরিশাল", nameEn: "Barishal", divisionBn: "বরিশাল বিভাগ", divisionEn: "Barishal Division", center: [90.3535, 22.701], zoom: 11.2, areaIds: [] },
  { id: "rangpur", nameBn: "রংপুর", nameEn: "Rangpur", divisionBn: "রংপুর বিভাগ", divisionEn: "Rangpur Division", center: [89.2447, 25.7439], zoom: 11.2, areaIds: [] },
  { id: "mymensingh", nameBn: "ময়মনসিংহ", nameEn: "Mymensingh", divisionBn: "ময়মনসিংহ বিভাগ", divisionEn: "Mymensingh Division", center: [90.4203, 24.7471], zoom: 11.2, areaIds: [] },
  { id: "cumilla", nameBn: "কুমিল্লা", nameEn: "Cumilla", divisionBn: "চট্টগ্রাম বিভাগ", divisionEn: "Chattogram Division", center: [91.1809, 23.4607], zoom: 11.2, areaIds: [] },
  { id: "coxs-bazar", nameBn: "কক্সবাজার", nameEn: "Cox's Bazar", divisionBn: "চট্টগ্রাম বিভাগ", divisionEn: "Chattogram Division", center: [91.9847, 21.4272], zoom: 11.2, areaIds: [] },
];

/** Districts keyed by id for O(1) lookup. */
const DISTRICT_MICRO_COUNTS: Record<string, number> = DISTRICTS.reduce<Record<string, number>>(
  (acc, d) => {
    acc[d.id] = MICRO_AREAS.filter((m) => d.areaIds.includes(m.areaId)).length;
    return acc;
  },
  {},
);

/** How many street/para (micro) units are seeded for a district. */
export function microCoverageCount(districtId: string): number {
  return DISTRICT_MICRO_COUNTS[districtId] ?? 0;
}

/** True when the district can render street-level ambient micro heat. */
export function hasMicroCoverage(districtId: string): boolean {
  return microCoverageCount(districtId) > 0;
}
