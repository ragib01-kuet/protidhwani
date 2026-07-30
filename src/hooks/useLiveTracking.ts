import { useCallback, useEffect, useRef, useState } from "react";

export interface LiveFix {
  lat: number;
  lng: number;
  accuracy: number | null;
  at: string;
}

export type TrackStatus = "idle" | "locating" | "tracking" | "denied" | "unavailable";

/**
 * Live location tracking for an active SOS — `watchPosition` keeps pushing new
 * fixes so responders can follow the sender in real time.
 */
export function useLiveTracking(onFix?: (fix: LiveFix) => void) {
  const [fix, setFix] = useState<LiveFix | null>(null);
  const [status, setStatus] = useState<TrackStatus>("idle");
  const watchId = useRef<number | null>(null);
  const cb = useRef(onFix);
  cb.current = onFix;

  const stop = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
    setStatus((s) => (s === "tracking" || s === "locating" ? "idle" : s));
  }, []);

  /** One-shot fix — used before the alert is created. */
  const locateOnce = useCallback(
    () =>
      new Promise<LiveFix | null>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setStatus("unavailable");
          resolve(null);
          return;
        }
        setStatus("locating");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const next: LiveFix = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
              at: new Date().toISOString(),
            };
            setFix(next);
            setStatus("tracking");
            resolve(next);
          },
          (err) => {
            setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 8_000, maximumAge: 15_000 },
        );
      }),
    [],
  );

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    if (watchId.current !== null) return;
    setStatus((s) => (s === "tracking" ? s : "locating"));
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next: LiveFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          at: new Date().toISOString(),
        };
        setFix(next);
        setStatus("tracking");
        cb.current?.(next);
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    );
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { fix, status, start, stop, locateOnce, setFix };
}
