import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly, createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, MapPin } from "lucide-react";
import type { MapRef } from "react-map-gl/maplibre";

import { AdvisoryToast, type Advisory } from "@/components/alerts/AdvisoryToast";
import { BottomNav } from "@/components/BottomNav";
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
import { DistrictSelector } from "@/components/map/DistrictSelector";
import {
  AREAS,
  DEMO_ROUTES,
  DHAKA_FALLBACK,
  DISTRICTS,
  hasMicroCoverage,
} from "@/data/safety-data";
import { useSafetyLayer } from "@/hooks/useSafetyLayer";
import type { DemoRoute, District, HeatMode, Incident, SearchEntry } from "@/types/safety";


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

  const router = useRouter();
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
  /** Which heat surfaces the map paints — controlled from the legend. */
  const [heatMode, setHeatMode] = useState<HeatMode>("both");
  /** Heat opacity multiplier (0–1) so users can keep polygons/streets legible. */
  const [heatOpacity, setHeatOpacity] = useState(1);

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

  /** Transient search highlight; cleared automatically after the pulse. */
  const [highlight, setHighlight] = useState<
    { id: number; lng: number; lat: number; areaId: string | null } | null
  >(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Triggers a ~1.8s highlight pulse, replacing any pulse already running. */
  const pulse = useCallback((target: { lng: number; lat: number; areaId: string | null }) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setHighlight({ id: Date.now(), ...target });
    pulseTimer.current = setTimeout(() => setHighlight(null), 1800);
  }, []);

  // Avoid a state update after unmount if the user navigates mid-pulse.
  useEffect(() => () => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom = 12.5) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
  }, []);

  /** District the camera is currently framing. Defaults to Dhaka (seeded). */
  const [districtId, setDistrictId] = useState<string>(DISTRICTS[0].id);
  const district = useMemo(
    () => DISTRICTS.find((d) => d.id === districtId) ?? DISTRICTS[0],
    [districtId],
  );
  /** False for districts with no seeded street/para units → no micro heat. */
  const districtCovered = hasMicroCoverage(district.id);

  /**
   * Moves the camera to a district and tells the user, once, when street-level
   * heat is unavailable there (the ambient surface simply has no points).
   */
  const handleSelectDistrict = useCallback(
    (next: District) => {
      setDistrictId(next.id);
      // Clear any area sheet from the previous district to avoid stale context.
      setSheetOpen(false);
      flyTo(next.center[0], next.center[1], next.zoom);
      pulse({ lng: next.center[0], lat: next.center[1], areaId: null });
      setAdvisory(
        hasMicroCoverage(next.id)
          ? {
              id: Date.now(),
              tone: "success",
              bn: `${next.nameBn} — এলাকা ও মাইক্রো তাপ দেখানো হচ্ছে।`,
              en: `${next.nameEn} — area and micro heat available.`,
            }
          : {
              id: Date.now(),
              tone: "caution",
              bn: `${next.nameBn}-এ এখনো সড়ক/পাড়া পর্যায়ের তাপ ডেটা নেই।`,
              en: `No street/para level heat data yet for ${next.nameEn}.`,
            },
      );
    },
    [flyTo, pulse],
  );


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
      // Auto-pan: micro (street/para/service) hits deserve a tighter zoom.
      flyTo(entry.lng, entry.lat, entry.kind === "area" ? 12.5 : 14);
      if (entry.areaId) {
        setSelectedAreaId(entry.areaId);
        setSheetOpen(true);
      }
      // Brief highlight pulse on the matching polygon + marker.
      pulse({ lng: entry.lng, lat: entry.lat, areaId: entry.areaId ?? null });
    },
    [flyTo, pulse],
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
            heatMode={heatMode}
            heatOpacity={heatOpacity}
            highlight={highlight}

            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </Suspense>
      </ClientOnly>

      {/* Top overlay: back + search, then (optional) filter chips.
          On desktop it becomes the top of a single left-hand control column. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4 lg:right-auto lg:w-[24rem]">
        <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2.5 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
            <button
              onClick={() => router.history.back()}
              aria-label="পেছনে যান / Go back"
              className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lift backdrop-blur transition-transform active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
            <SearchBar
              onSelect={handleSearchSelect}
              onFilter={() => setPanelsOpen((v) => !v)}
            />
          </div>

          {/* District switcher + honest coverage state for unseeded districts. */}
          <DistrictSelector value={districtId} onChange={handleSelectDistrict} />

          {!districtCovered && (
            <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning-soft px-3 py-2 shadow-card animate-fade-in">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <p className="min-w-0">
                <span lang="bn" className="block text-[13px] font-bold leading-snug text-foreground">
                  {district.nameBn}-এ মাইক্রো তাপ এখনো নেই — শুধু সাধারণ মানচিত্র দেখা যাবে।
                </span>
                <span lang="en" className="block text-[11px] leading-snug text-muted-foreground">
                  Micro heat unavailable for {district.nameEn} — base map only until data is seeded.
                </span>
              </p>
            </div>
          )}



          {panelsOpen ? (
            /* On desktop the filters sit inside one panel so the wrapped pills
               read as a grouped sidebar instead of floating chips. */
            <div className="space-y-2.5 animate-fade-in lg:rounded-3xl lg:border lg:border-border lg:bg-card/90 lg:p-3 lg:shadow-lift lg:backdrop-blur">
              <SafetyLayerToggle value={layerId} onChange={setLayerId} />
              <TimeWindowChips value={timeWindow} onChange={setTimeWindow} />
            </div>
          ) : (
            /* Collapsed state keeps the active layer visible as a single chip. */
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/95 py-1.5 pl-1.5 pr-3.5 shadow-card backdrop-blur animate-fade-in">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-primary">
                <MapPin className="size-4" aria-hidden />
              </span>
              <span lang="bn" className="text-[14px] font-bold leading-none">
                {layer.bn}
              </span>
              <span lang="en" className="text-[12px] leading-none text-muted-foreground">
                {layer.en}
              </span>
            </div>
          )}

          <AdvisoryToast advisory={advisory} onDismiss={() => setAdvisory(null)} />
        </div>
      </div>

      {/* Right rail: zoom, locate, layers. */}
      <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-4">
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn({ duration: 300 })}
          onZoomOut={() => mapRef.current?.zoomOut({ duration: 300 })}
          onLocate={locateMe}
          onToggleLayers={() => setPanelsOpen((v) => !v)}
          layersOpen={panelsOpen}
        />
      </div>

      {/* Primary report action, anchored bottom-right above the legend row. */}
      <div className="pointer-events-none absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-30 sm:right-4 lg:bottom-4">
        <ReportFAB onClick={() => setReportOpen(true)} />
      </div>

      {/* Bottom overlay: one column — routes, insights, then the heat legend.
          Mobile: centered column above the bottom nav, clear of the FAB.
          Desktop: bottom of the same left-hand control column. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 max-h-[52dvh] overflow-y-auto p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pr-24 sm:p-4 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pr-24 lg:right-auto lg:max-h-[45dvh] lg:w-[24rem] lg:pb-4 lg:pr-4">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-2.5 lg:mx-0 lg:max-w-none">
          <RouteComparisonPanel
            routeSet={routeSet}
            emptyFor={routeEmptyFor}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            onClose={closeRoutes}
          />
          {/* Insights are dropped on short desktop windows so the left column
              never collides with the filter panel above it. */}
          {panelsOpen && (
            <div className="lg:[@media(max-height:820px)]:hidden">
              <InsightCard />
            </div>
          )}
          <HeatLegend
            mode={heatMode}
            onModeChange={setHeatMode}
            opacity={heatOpacity}
            onOpacityChange={setHeatOpacity}
          />
        </div>
      </div>



      <AreaInfoSheet
        area={selectedArea}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDirections={handleDirections}
      />

      <BottomNav />

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
