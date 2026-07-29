import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { ClientOnly, createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, MapPin } from "lucide-react";
import type { MapRef } from "react-map-gl/maplibre";

import { AdvisoryToast, type Advisory } from "@/components/alerts/AdvisoryToast";
import { HeatLegend } from "@/components/map/HeatLegend";
import { MapControls } from "@/components/map/MapControls";
import { SafetyLayerToggle } from "@/components/map/SafetyLayerToggle";
import { TimeWindowChips } from "@/components/map/TimeWindowChips";
import { RouteComparisonPanel } from "@/components/navigation/RouteComparisonPanel";
import { SearchBar } from "@/components/navigation/SearchBar";
import { ReportFAB } from "@/components/reports/ReportFAB";
import { ReportModal } from "@/components/reports/ReportModal";
import { AreaInfoSheet } from "@/components/safety/AreaInfoSheet";
import { InsightCard } from "@/components/safety/InsightCard";
import { AREAS, DEMO_ROUTES, DHAKA_FALLBACK } from "@/data/safety-data";
import { useSafetyLayer } from "@/hooks/useSafetyLayer";
import type { DemoRoute, Incident, SearchEntry } from "@/types/safety";

// MapLibre touches `window` at import time, so it must never load during SSR.
const MapView = lazy(() => import("@/components/map/MapView"));


export const Route = createFileRoute("/map")({
  ssr: false,
  component: SafetyMapPage,
  head: () => ({
    meta: [
      { title: "কমিউনিটি নিরাপত্তা মানচিত্র · Community Safety Map | Protidhwani" },
      {
        name: "description",
        content:
          "Explore Bangladesh's community safety intelligence map — area safety scores, live layers, safer route comparison and citizen reports in Bangla and English.",
      },
      { property: "og:title", content: "কমিউনিটি নিরাপত্তা মানচিত্র · Community Safety Map" },
      {
        property: "og:description",
        content:
          "Area safety scores, women's safety and infrastructure layers, safer routes and citizen reports across Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MapFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-secondary">
      <span className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span lang="bn" className="text-sm font-bold">
          মানচিত্র লোড হচ্ছে…
        </span>
        <span lang="en" className="text-[10px] uppercase tracking-wider">
          Loading map
        </span>
      </span>
    </div>
  );
}

function SafetyMapPage() {
  const { layerId, setLayerId, layer, timeWindow, setTimeWindow, visibleIncidents, addIncident } =
    useSafetyLayer();

  const mapRef = useRef<MapRef | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [routeSetId, setRouteSetId] = useState<string | null>(null);
  /** Destination that has no seeded route pair — drives the empty state. */
  const [routeEmptyFor, setRouteEmptyFor] = useState<{ bn: string; en: string } | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<DemoRoute["id"]>("safest");
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [latestReport, setLatestReport] = useState<Incident | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [panelsOpen, setPanelsOpen] = useState(true);

  const selectedArea = useMemo(
    () => AREAS.find((a) => a.id === selectedAreaId) ?? null,
    [selectedAreaId],
  );

  const routeSet = useMemo(
    () => DEMO_ROUTES.find((r) => r.id === routeSetId) ?? null,
    [routeSetId],
  );

  const activeRoutes = useMemo(
    () => (routeSet ? routeSet.routes : []),
    [routeSet],
  );

  const flyTo = useCallback((lng: number, lat: number, zoom = 12.5) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
  }, []);

  const handleSelectArea = useCallback(
    (areaId: string) => {
      const area = AREAS.find((a) => a.id === areaId);
      if (!area) return;
      setSelectedAreaId(areaId);
      setSheetOpen(true);
      flyTo(area.center[0], area.center[1]);
    },
    [flyTo],
  );

  const handleSearchSelect = useCallback(
    (entry: SearchEntry) => {
      flyTo(entry.lng, entry.lat, entry.kind === "area" ? 12.5 : 14);
      if (entry.areaId) {
        setSelectedAreaId(entry.areaId);
        setSheetOpen(true);
      }
    },
    [flyTo],
  );

  const handleDirections = useCallback(
    (areaId: string) => {
      const area = AREAS.find((a) => a.id === areaId) ?? null;
      // Only an exact seeded origin→destination pair may render routes. Falling
      // back to "the first demo set" would show a route to the wrong place.
      const set = DEMO_ROUTES.find((r) => r.destinationId === areaId) ?? null;
      setSheetOpen(false);
      if (!set) {
        setRouteSetId(null);
        setRouteEmptyFor(area ? { bn: area.nameBn, en: area.nameEn } : { bn: "এই এলাকা", en: "this area" });
        return;
      }
      setRouteEmptyFor(null);
      setRouteSetId(set.id);
      setSelectedRouteId("safest");
      const first = set.routes[0]?.path[0];
      if (first) flyTo(first[0], first[1], 12.5);
    },
    [flyTo],
  );

  const closeRoutes = useCallback(() => {
    setRouteSetId(null);
    setRouteEmptyFor(null);
  }, []);

  /**
   * Resolves the browser location, falling back to central Dhaka when the
   * permission is denied, unavailable, or times out. Never rejects.
   */
  const requestLocation = useCallback(
    () =>
      new Promise<{ lng: number; lat: number; fallback: boolean }>((resolve) => {
        const fallback = { lng: DHAKA_FALLBACK.lng, lat: DHAKA_FALLBACK.lat, fallback: true };
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
          resolve(fallback);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude, fallback: false }),
          () => resolve(fallback),
          { timeout: 6000 },
        );
      }),
    [],
  );

  /** Uses the browser location when granted; falls back to central Dhaka. */
  const locateMe = useCallback(async () => {
    const { lng, lat, fallback } = await requestLocation();
    setUserLocation({ lng, lat });
    flyTo(lng, lat, 13.5);
    if (fallback) {
      setAdvisory({
        id: Date.now(),
        tone: "caution",
        bn: "অবস্থান পাওয়া যায়নি — ঢাকা কেন্দ্র দেখানো হচ্ছে।",
        en: "Location unavailable — showing central Dhaka instead.",
      });
    }
  }, [flyTo, requestLocation]);

  /** Called from the report modal's "use my location" control. */
  const handleReportLocation = useCallback(async () => {
    const result = await requestLocation();
    setUserLocation({ lng: result.lng, lat: result.lat });
    return result;
  }, [requestLocation]);

  const handleReportSubmit = useCallback(
    (incident: Incident) => {
      addIncident(incident);
      setLatestReport(incident);
      setAdvisory({
        id: Date.now(),
        tone: "success",
        bn: "ধন্যবাদ! আপনার রিপোর্ট মানচিত্রে যুক্ত হয়েছে।",
        en: "Thank you — your report is now on the map.",
      });
    },
    [addIncident],
  );

  const reportLocation = userLocation ?? DHAKA_FALLBACK;


  return (
    <main className="relative h-dvh w-full overflow-hidden bg-secondary">
      <h1 className="sr-only">কমিউনিটি নিরাপত্তা মানচিত্র · Community Safety Intelligence Map</h1>

      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <MapView
            layer={layer}
            incidents={visibleIncidents}
            selectedAreaId={selectedAreaId}
            onSelectArea={handleSelectArea}
            routes={activeRoutes}
            userLocation={userLocation}
            latestReport={latestReport}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </Suspense>
      </ClientOnly>

      {/* Top overlay: search, layers, advisories. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 space-y-3 p-4">
        <div className="pointer-events-auto mx-auto max-w-xl space-y-3">
          <SearchBar onSelect={handleSearchSelect} />
          {panelsOpen && <SafetyLayerToggle value={layerId} onChange={setLayerId} />}
          <AdvisoryToast advisory={advisory} onDismiss={() => setAdvisory(null)} />
        </div>
      </div>

      {/* Right controls. */}
      <div className="absolute right-4 top-[38%] z-30 flex -translate-y-1/2 flex-col gap-2">
        <button
          onClick={locateMe}
          aria-label="আমার অবস্থান / My location"
          className="grid size-11 place-items-center rounded-full border border-border bg-card/95 text-primary shadow-card backdrop-blur transition-transform active:scale-95"
        >
          <Crosshair className="size-5" />
        </button>
        <button
          onClick={() => setPanelsOpen((v) => !v)}
          aria-pressed={panelsOpen}
          aria-label="প্যানেল দেখান বা লুকান / Toggle panels"
          className="grid size-11 place-items-center rounded-full border border-border bg-card/95 text-primary shadow-card backdrop-blur transition-transform active:scale-95"
        >
          <Layers className="size-5" />
        </button>
      </div>

      {/* Bottom overlay: insights, time slider, routes, FAB. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 max-h-[62dvh] space-y-3 overflow-y-auto p-4">
        <div className="pointer-events-auto mx-auto max-w-xl space-y-3">
          {panelsOpen && (
            <>
              <RouteComparisonPanel
                routeSet={routeSet}
                emptyFor={routeEmptyFor}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                onClose={closeRoutes}
              />

              <InsightCard />
              <TimeSlider value={timeWindow} onChange={setTimeWindow} />
            </>
          )}
          <div className="flex justify-end">
            <ReportFAB onClick={() => setReportOpen(true)} />
          </div>
        </div>
      </div>

      <AreaInfoSheet
        area={selectedArea}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDirections={handleDirections}
      />

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        location={reportLocation}
        areaId={selectedAreaId ?? "dhaka-motijheel"}
        onSubmit={handleReportSubmit}
        onRequestLocation={handleReportLocation}
      />
    </main>
  );
}
