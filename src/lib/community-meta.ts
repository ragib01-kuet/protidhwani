import type { CommunityPostKind, CommunityPostStatus } from "@/integrations/supabase/database.types";

export const POST_KINDS: {
  kind: CommunityPostKind;
  icon: string;
  bn: string;
  en: string;
  tone: "brand" | "emergency" | "verified" | "warning";
}[] = [
  { kind: "report", icon: "📢", bn: "অভিযোগ", en: "Report", tone: "brand" },
  { kind: "emergency", icon: "🚨", bn: "জরুরি", en: "Emergency", tone: "emergency" },
  { kind: "discussion", icon: "💬", bn: "আলোচনা", en: "Discussion", tone: "brand" },
  { kind: "verified", icon: "✅", bn: "যাচাইকৃত তথ্য", en: "Verified Info", tone: "verified" },
  { kind: "rights", icon: "🛡️", bn: "অধিকার", en: "Rights", tone: "verified" },
  { kind: "missing", icon: "👤", bn: "নিখোঁজ", en: "Missing Person", tone: "warning" },
  { kind: "poll", icon: "🗳️", bn: "জনমত", en: "Poll", tone: "brand" },
  { kind: "event", icon: "📅", bn: "কর্মসূচি", en: "Event", tone: "warning" },
];

export const KIND_MAP = Object.fromEntries(POST_KINDS.map((k) => [k.kind, k])) as Record<
  CommunityPostKind,
  (typeof POST_KINDS)[number]
>;

export const TONE_CLASS = {
  brand: "bg-brand-soft text-primary",
  emergency: "bg-emergency-soft text-emergency",
  verified: "bg-verified-soft text-verified",
  warning: "bg-warning-soft text-warning",
} as const;

export const STATUS_LABEL: Record<CommunityPostStatus, { bn: string; en: string; cls: string }> = {
  verified: { bn: "যাচাইকৃত", en: "Verified", cls: "bg-verified-soft text-verified" },
  pending: { bn: "যাচাই চলছে", en: "Under review", cls: "bg-warning-soft text-warning" },
  disputed: { bn: "বিতর্কিত", en: "Disputed", cls: "bg-emergency-soft text-emergency" },
};

export const LEVEL_LABEL = {
  critical: { bn: "অতি জরুরি", en: "Critical" },
  high: { bn: "উচ্চ", en: "High" },
  moderate: { bn: "মাঝারি", en: "Moderate" },
} as const;

export const DISTRICTS = [
  { bn: "ঢাকা", en: "Dhaka" },
  { bn: "চট্টগ্রাম", en: "Chattogram" },
  { bn: "রাজশাহী", en: "Rajshahi" },
  { bn: "খুলনা", en: "Khulna" },
  { bn: "সিলেট", en: "Sylhet" },
  { bn: "বরিশাল", en: "Barishal" },
  { bn: "রংপুর", en: "Rangpur" },
  { bn: "ময়মনসিংহ", en: "Mymensingh" },
] as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 1234 → ১,২৩৪ */
export function toBnNumber(value: number): string {
  return value
    .toLocaleString("en-US")
    .replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Bilingual relative time for an ISO timestamp. */
export function relativeTime(iso: string): { bn: string; en: string } {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { bn: "এইমাত্র", en: "just now" };
  if (mins < 60) return { bn: `${toBnNumber(mins)} মিনিট আগে`, en: `${mins} minutes ago` };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { bn: `${toBnNumber(hours)} ঘন্টা আগে`, en: `${hours} hours ago` };
  const days = Math.floor(hours / 24);
  if (days < 30) return { bn: `${toBnNumber(days)} দিন আগে`, en: `${days} days ago` };
  const months = Math.floor(days / 30);
  return { bn: `${toBnNumber(months)} মাস আগে`, en: `${months} months ago` };
}

/** Two-character avatar initials, preferring the Bangla name. */
export function initialsFor(nameBn: string | null, nameEn: string | null): string {
  const source = (nameBn || nameEn || "নাগরিক").trim();
  return source.slice(0, 2);
}
