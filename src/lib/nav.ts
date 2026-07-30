/**
 * Single source of truth for app navigation. Every surface (bottom tab bar,
 * desktop side rail, composer shortcuts, quick actions) reads from here so the
 * app always links to routes that actually exist.
 */

export interface NavItem {
  to: string;
  bn: string;
  en: string;
}

/** Primary tabs — mirrored in the mobile bottom bar and desktop rail. */
export const PRIMARY_NAV = [
  { to: "/dashboard", bn: "হোম", en: "Home" },
  { to: "/explore", bn: "অন্বেষণ", en: "Explore" },
  { to: "/map", bn: "মানচিত্র", en: "Map" },
  { to: "/community", bn: "কমিউনিটি", en: "Community" },
  { to: "/profile", bn: "প্রোফাইল", en: "Profile" },
] as const satisfies readonly NavItem[];

/** Secondary civic tools — desktop rail plus the mobile "More" sheet. */
export const TOOLS_NAV = [
  { to: "/emergency", bn: "জরুরি সহায়তা", en: "Emergency" },
  { to: "/rights", bn: "অধিকার", en: "Rights" },
  { to: "/protest", bn: "প্রতিবাদ মোড", en: "Protest Mode" },
  { to: "/vehicle", bn: "যানবাহন যাচাই", en: "Verify Vehicle" },
  { to: "/complaints", bn: "অভিযোগ", en: "Complaints" },
  { to: "/account", bn: "অ্যাকাউন্ট", en: "Account" },
] as const satisfies readonly NavItem[];

/** Composer shortcuts → the route that actually handles each civic action. */
export const COMPOSER_ROUTES: Record<string, string> = {
  Report: "/complaints",
  Ask: "/community",
  Discuss: "/community",
  Emergency: "/emergency",
  Rights: "/rights",
  Missing: "/community",
  Traffic: "/map",
  Protest: "/protest",
  Media: "/community",
};

/** Treats `/community/abc` as active for the `/community` tab. */
export function isActivePath(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
