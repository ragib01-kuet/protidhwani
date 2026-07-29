const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Renders a latin number using Bangla numerals (Bangla-dominant UI rule). */
export function toBnNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}
