/**
 * Seeded demo vehicle registry. Used as the offline/demo source when the
 * optional Supabase `vehicles` table is not provisioned (see supabase/vehicles.sql).
 */

export interface VehicleReportRecord {
  id: string;
  kind: "reckless" | "harassment" | "fake_plate" | "accident" | "other";
  noteBn: string;
  noteEn: string;
  createdAtISO: string;
  verified: boolean;
}

export interface VehicleRecord {
  plate: string;
  ownerVerified: boolean;
  registered: boolean;
  typeBn: string;
  typeEn: string;
  modelBn: string;
  modelEn: string;
  registrationExpiry: string; // YYYY
  fitnessValid: boolean;
  taxTokenValid: boolean;
  reports: VehicleReportRecord[];
}

const BN_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

/**
 * Normalises a plate so Bangla/English digits, dashes, and spacing all match:
 * "ঢাকা মেট্রো-গ ১১-২৩৪৫" → "ঢাকামেট্রোগ112345".
 */
export function normalizePlate(input: string): string {
  return input
    .trim()
    .replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d)
    .replace(/[\s\-–—_.]/g, "")
    .toLowerCase();
}

export const DEMO_VEHICLES: VehicleRecord[] = [
  {
    plate: "ঢাকা মেট্রো-গ ১১-২৩৪৫",
    ownerVerified: true,
    registered: true,
    typeBn: "প্রাইভেট কার",
    typeEn: "Private car",
    modelBn: "টয়োটা এক্সিও ২০১৬",
    modelEn: "Toyota Axio 2016",
    registrationExpiry: "2027",
    fitnessValid: true,
    taxTokenValid: true,
    reports: [
      {
        id: "d1",
        kind: "reckless",
        noteBn: "বেপরোয়া চালনার অভিযোগ",
        noteEn: "Reckless driving report",
        createdAtISO: "2026-04-10T09:00:00Z",
        verified: true,
      },
      {
        id: "d2",
        kind: "other",
        noteBn: "মালিকানা হস্তান্তর",
        noteEn: "Ownership transfer",
        createdAtISO: "2026-01-02T09:00:00Z",
        verified: true,
      },
    ],
  },
  {
    plate: "ঢাকা মেট্রো-খ ১৯-৭৭০২",
    ownerVerified: false,
    registered: true,
    typeBn: "সিএনজি অটোরিকশা",
    typeEn: "CNG auto-rickshaw",
    modelBn: "বাজাজ ২০১৯",
    modelEn: "Bajaj 2019",
    registrationExpiry: "2026",
    fitnessValid: false,
    taxTokenValid: true,
    reports: [
      {
        id: "d3",
        kind: "harassment",
        noteBn: "অতিরিক্ত ভাড়া ও দুর্ব্যবহার",
        noteEn: "Overcharging and misbehaviour",
        createdAtISO: "2026-06-21T14:30:00Z",
        verified: false,
      },
    ],
  },
  {
    plate: "চট্ট মেট্রো-ল ১৩-০৪৫৬",
    ownerVerified: true,
    registered: false,
    typeBn: "পিকআপ ভ্যান",
    typeEn: "Pickup van",
    modelBn: "মাহিন্দ্রা ২০১৪",
    modelEn: "Mahindra 2014",
    registrationExpiry: "2023",
    fitnessValid: false,
    taxTokenValid: false,
    reports: [
      {
        id: "d4",
        kind: "fake_plate",
        noteBn: "ভুয়া নম্বরপ্লেট সন্দেহ",
        noteEn: "Suspected fake plate",
        createdAtISO: "2026-05-02T08:10:00Z",
        verified: true,
      },
    ],
  },
];

export function findDemoVehicle(query: string): VehicleRecord | null {
  const q = normalizePlate(query);
  if (!q) return null;
  return DEMO_VEHICLES.find((v) => normalizePlate(v.plate) === q) ?? null;
}

export const REPORT_KINDS = [
  { value: "reckless", bn: "বেপরোয়া চালনা", en: "Reckless driving" },
  { value: "harassment", bn: "হয়রানি / অতিরিক্ত ভাড়া", en: "Harassment / overcharging" },
  { value: "fake_plate", bn: "ভুয়া নম্বরপ্লেট", en: "Fake plate" },
  { value: "accident", bn: "দুর্ঘটনা", en: "Accident" },
  { value: "other", bn: "অন্যান্য", en: "Other" },
] as const;
