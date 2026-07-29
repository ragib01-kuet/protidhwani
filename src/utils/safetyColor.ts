/**
 * Single source of truth for score → colour. Never hardcode these hex values
 * in components; import this instead so the scale stays consistent.
 */
export function safetyColor(score: number): string {
  if (score >= 80) return "#16A34A"; // Green — Very Safe
  if (score >= 60) return "#CA8A04"; // Yellow — Moderate
  if (score >= 40) return "#EA580C"; // Orange — Needs Attention
  if (score >= 20) return "#DC2626"; // Red — High Risk
  return "#7F1D1D"; // Dark Red — Critical
}

export interface SafetyBand {
  bn: string;
  en: string;
  color: string;
}

export function safetyBand(score: number): SafetyBand {
  if (score >= 80) return { bn: "খুব নিরাপদ", en: "Very Safe", color: safetyColor(score) };
  if (score >= 60) return { bn: "মাঝারি", en: "Moderate", color: safetyColor(score) };
  if (score >= 40) return { bn: "নজর প্রয়োজন", en: "Needs Attention", color: safetyColor(score) };
  if (score >= 20) return { bn: "উচ্চ ঝুঁকি", en: "High Risk", color: safetyColor(score) };
  return { bn: "সংকটাপন্ন", en: "Critical", color: safetyColor(score) };
}

/** Bangla numerals — the UI is Bangla-dominant, so numbers follow suit. */
export function toBnNumber(value: number): string {
  return value.toLocaleString("bn-BD");
}
