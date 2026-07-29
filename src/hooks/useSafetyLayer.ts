import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AREAS,
  INCIDENTS_BY_WINDOW,
  MICRO_AREAS,
  MICRO_AREA_KIND_LABELS,
  SAFETY_LAYERS,
  SERVICES,
} from "@/data/safety-data";
import type {
  Incident,
  SafetyLayerId,
  SearchEntry,
  TimeWindow,
} from "@/types/safety";

const RECENT_SEARCH_KEY = "protidhwani.safety-map.recent-searches";
const RECENT_LIMIT = 5;

/**
 * Central state for the safety map: active layer, time window, and the
 * user-submitted (session-only) incidents. Kept in one hook so the map,
 * the chips, the slider and the report flow never drift apart.
 */
export function useSafetyLayer() {
  const [layerId, setLayerId] = useState<SafetyLayerId>("community");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("week");
  /** Reports created during this session — never written back to seed data. */
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);

  const layer = useMemo(
    () => SAFETY_LAYERS.find((l) => l.id === layerId) ?? SAFETY_LAYERS[0],
    [layerId],
  );

  const seeded = INCIDENTS_BY_WINDOW[timeWindow] ?? [];

  /** Incidents visible for the current layer + window (user reports always shown). */
  const visibleIncidents = useMemo(() => {
    const all = [...seeded, ...userIncidents];
    if (layer.categories.length === 0) return all;
    const allowed = new Set<string>(layer.categories);
    return all.filter((i) => allowed.has(i.category));
  }, [seeded, userIncidents, layer]);

  const addIncident = useCallback((incident: Incident) => {
    setUserIncidents((prev) => [...prev, incident]);
  }, []);

  return {
    layerId,
    setLayerId,
    layer,
    timeWindow,
    setTimeWindow,
    visibleIncidents,
    userIncidents,
    addIncident,
  };
}

/**
 * Flat, memoised search index over areas, their street/para micro units, and
 * service points — ordered area → street → service so broad matches surface
 * first and precise ones sit right beneath their parent.
 */
export function useSearchIndex(): SearchEntry[] {
  return useMemo(() => {
    const areaNameBn = new Map(AREAS.map((a) => [a.id, a.nameBn]));
    const areaNameEn = new Map(AREAS.map((a) => [a.id, a.nameEn]));

    return [
      ...AREAS.map<SearchEntry>((a) => ({
        id: `area-${a.id}`,
        kind: "area",
        areaId: a.id,
        nameBn: a.nameBn,
        nameEn: a.nameEn,
        subtitleBn: a.level === "division" ? "বিভাগ" : "এলাকা",
        subtitleEn: a.level === "division" ? "Division" : "Area",
        lng: a.center[0],
        lat: a.center[1],
      })),
      ...MICRO_AREAS.map<SearchEntry>((m) => ({
        id: `micro-${m.id}`,
        kind: "street",
        areaId: m.areaId,
        nameBn: m.nameBn,
        nameEn: m.nameEn,
        subtitleBn: `${MICRO_AREA_KIND_LABELS[m.kind].bn} · ${areaNameBn.get(m.areaId) ?? ""}`,
        subtitleEn: `${MICRO_AREA_KIND_LABELS[m.kind].en} · ${areaNameEn.get(m.areaId) ?? ""}`,
        lng: m.lng,
        lat: m.lat,
      })),
      ...SERVICES.map<SearchEntry>((s) => ({
        id: `svc-${s.id}`,
        kind: "service",
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        subtitleBn: "সেবা কেন্দ্র",
        subtitleEn: "Service point",
        lng: s.lng,
        lat: s.lat,
      })),
    ];
  }, []);
}


/** localStorage-backed recent searches; degrades silently when storage is blocked. */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_LIMIT));
        }
      }
    } catch {
      // Private mode / disabled storage — recents are a nicety, not a requirement.
    }
  }, []);

  const pushRecent = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecent((prev) => {
      const next = [clean, ...prev.filter((t) => t !== clean)].slice(0, RECENT_LIMIT);
      try {
        window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota / privacy errors.
      }
      return next;
    });
  }, []);

  return { recent, pushRecent };
}

/** Ordering weight so results group as area → street/para → service. */
const KIND_WEIGHT: Record<SearchEntry["kind"], number> = {
  area: 0,
  street: 1,
  service: 2,
};

/**
 * Case-insensitive substring match across both languages. Results are sorted
 * by kind first (area, then street/para, then service) and by match position
 * inside each group, so a query returns broad → precise matches.
 */
export function searchEntries(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .map((entry) => {
      const hay = `${entry.nameBn} ${entry.nameEn}`.toLowerCase();
      return { entry, rank: hay.indexOf(q) };
    })
    .filter((r) => r.rank >= 0)
    .sort(
      (a, b) =>
        KIND_WEIGHT[a.entry.kind] - KIND_WEIGHT[b.entry.kind] || a.rank - b.rank,
    )
    .slice(0, limit)
    .map((r) => r.entry);
}

