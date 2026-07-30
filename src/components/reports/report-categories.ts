import {
  AlertTriangle,
  Car,
  Droplets,
  Flame,
  Lightbulb,
  ShieldAlert,
  Trash2,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";

export interface ReportCategory {
  key: string;
  bn: string;
  en: string;
  icon: LucideIcon;
  /** Matched (case-insensitive, substring) against `categories.name_en` in the database. */
  match: string[];
}

/**
 * Fallback category set for the incident report wizard. When the `categories`
 * table has rows, each card is matched to a real category id so reports stay
 * queryable; otherwise the label is carried in the report body.
 */
export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    key: "crime",
    bn: "অপরাধ ও নিরাপত্তা",
    en: "Crime & safety",
    icon: ShieldAlert,
    match: ["crime", "safety", "security"],
  },
  {
    key: "accident",
    bn: "সড়ক দুর্ঘটনা",
    en: "Road accident",
    icon: Car,
    match: ["accident", "road"],
  },
  {
    key: "traffic",
    bn: "যানজট ও রাস্তা",
    en: "Traffic & roads",
    icon: TrafficCone,
    match: ["traffic", "transport"],
  },
  {
    key: "flood",
    bn: "জলাবদ্ধতা",
    en: "Waterlogging & flood",
    icon: Droplets,
    match: ["flood", "water"],
  },
  {
    key: "fire",
    bn: "অগ্নিকাণ্ড",
    en: "Fire hazard",
    icon: Flame,
    match: ["fire"],
  },
  {
    key: "power",
    bn: "বিদ্যুৎ বিভ্রাট",
    en: "Power outage",
    icon: Lightbulb,
    match: ["power", "electric"],
  },
  {
    key: "waste",
    bn: "বর্জ্য ও পরিচ্ছন্নতা",
    en: "Waste & sanitation",
    icon: Trash2,
    match: ["waste", "garbage", "sanitation", "clean"],
  },
  {
    key: "other",
    bn: "অন্যান্য",
    en: "Other incident",
    icon: AlertTriangle,
    match: ["other", "general"],
  },
];

/** Best-effort mapping from a wizard card to a real `categories.id`. */
export function matchCategoryId(
  category: ReportCategory,
  rows: { id: string; name_en: string | null }[],
): string | null {
  const hit = rows.find((row) => {
    const name = (row.name_en ?? "").toLowerCase();
    return category.match.some((token) => name.includes(token));
  });
  return hit?.id ?? null;
}
