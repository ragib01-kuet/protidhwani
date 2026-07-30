import { useCallback, useEffect, useState } from "react";

import {
  DISTRICT_TREE,
  resolveNearestArea,
  type AreaScope,
} from "@/data/bd-areas";

const STORAGE_KEY = "protidhwani:area-scope";

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

function readStored(): AreaScope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AreaScope;
    if (!parsed?.district || !DISTRICT_TREE.some((d) => d.en === parsed.district)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Area scope for the community feed: জেলা → উপজেলা → ইউনিয়ন/এলাকা.
 * Resolved from browser geolocation when permitted, otherwise chosen manually.
 * The choice is persisted so the reader lands in their own area next time.
 */
export function useAreaScope() {
  const [scope, setScope] = useState<AreaScope | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [accuracyKm, setAccuracyKm] = useState<number | null>(null);

  useEffect(() => {
    setScope(readStored());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AreaScope | null) => {
    setScope(next);
    if (typeof window === "undefined") return;
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setManual = useCallback(
    (district: string, upazila: string | null, union: string | null) => {
      setStatus("idle");
      setAccuracyKm(null);
      persist({ district, upazila, union, source: "manual" });
    },
    [persist],
  );

  const clear = useCallback(() => persist(null), [persist]);

  /** Ask the browser for a fix and snap to the nearest seeded union. */
  const detect = useCallback(
    () =>
      new Promise<AreaScope | null>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setStatus("unavailable");
          resolve(null);
          return;
        }
        setStatus("locating");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const match = resolveNearestArea(position.coords.latitude, position.coords.longitude);
            if (!match) {
              setStatus("unavailable");
              resolve(null);
              return;
            }
            const next: AreaScope = {
              district: match.district.en,
              upazila: match.upazila.en,
              union: match.union.en,
              source: "gps",
            };
            setStatus("granted");
            setAccuracyKm(Math.round(match.distanceKm * 10) / 10);
            persist(next);
            resolve(next);
          },
          (error) => {
            setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5 * 60_000 },
        );
      }),
    [persist],
  );

  return { scope, hydrated, status, accuracyKm, detect, setManual, clear };
}
