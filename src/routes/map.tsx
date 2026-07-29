import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly, createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, SlidersHorizontal, X } from "lucide-react";
import type { MapRef } from "react-map-gl/maplibre";

import { AdvisoryToast, type Advisory } from "@/components/alerts/AdvisoryToast";
import { BottomNav } from "@/components/BottomNav";
import { MapMenu } from "@/components/map/MapMenu";
import { TemperatureScale } from "@/components/map/TemperatureScale";
import { MapControls } from "@/components/map/MapControls";
import { RouteComparisonPanel } from "@/components/navigation/RouteComparisonPanel";
import { SearchBar } from "@/components/navigation/SearchBar";
import { ReportFAB } from "@/components/reports/ReportFAB";
import { ReportModal } from "@/components/reports/ReportModal";
import { AreaInfoSheet } from "@/components/safety/AreaInfoSheet";
import {
  AREAS,
  buildRouteSet,
  DEMO_ROUTES,
  DHAKA_FALLBACK,
  DISTRICTS,
  hasMicroCoverage,
  nearestAreaId,
  TIME_WINDOWS,
} from "@/data/safety-data";
import { useSafetyLayer } from "@/hooks/useSafetyLayer";
import type {
  DemoRoute,
  DemoRouteSet,
  District,
  HeatMode,
  Incident,
  SearchEntry,
} from "@/types/safety";



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
  const [routeSet, setRouteSet] = useState<DemoRouteSet | null>(null);
  /** Destination that has no route pair at all — drives the empty state. */
  const [routeEmptyFor, setRouteEmptyFor] = useState<{ bn: string; en: string } | null>(null);


  const [selectedRouteId, setSelectedRouteId] = useState<DemoRoute["id"]>("safest");
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [latestReport, setLatestReport] = useState<Incident | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  /** Single menubar panel holding every map control. */
  const [menuOpen, setMenuOpen] = useState(false);
  /** Which heat surfaces the map paints — controlled from the legend. */
  const [heatMode, setHeatMode] = useState<HeatMode>("both");
  /** Heat opacity multiplier (0–1) so users can keep polygons/streets legible. */
  const [heatOpacity, setHeatOpacity] = useState(1);
  /** How visible the always-on all-areas overlay stays under category layers. */
  const [areaOpacity, setAreaOpacity] = useState(1);

  const selectedArea = useMemo(
    () => AREAS.find((a) => a.id === selectedAreaId) ?? null,
    [selectedAreaId],
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
      // Prefer a hand-seeded pair; otherwise derive a comparison from the
      // nearest seeded area so every destination can be compared.
      const seeded = DEMO_ROUTES.find((r) => r.destinationId === areaId) ?? null;
      const originId = nearestAreaId(areaId);
      const set = seeded ?? (originId ? buildRouteSet(originId, areaId) : null);
      setSheetOpen(false);
      if (!set) {
        setRouteSet(null);
        setRouteEmptyFor(area ? { bn: area.nameBn, en: area.nameEn } : { bn: "এই এলাকা", en: "this area" });
        return;
      }
      setRouteEmptyFor(null);
      setRouteSet(set);
      setSelectedRouteId("safest");
      const first = set.routes[0]?.path[0];
      if (first) flyTo(first[0], first[1], 12.5);
    },
    [flyTo],
  );

  const closeRoutes = useCallback(() => {
    setRouteSet(null);

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

  const activeWindow = useMemo(
    () => TIME_WINDOWS.find((t) => t.id === timeWindow),
    [timeWindow],
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
            areaOpacity={areaOpacity}
            highlight={highlight}

            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </Suspense>
      </ClientOnly>

      {/* Menubar: one row (back · search · menu) plus the single control panel.
          Nothing else floats over the map, so it stays readable on any screen. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2.5 lg:mx-0 lg:w-[23rem] lg:max-w-none">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <button
              onClick={() => router.history.back()}
              aria-label="পেছনে যান / Go back"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lift backdrop-blur transition-transform active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
            <SearchBar onSelect={handleSearchSelect} />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="মানচিত্র নিয়ন্ত্রণ / Map controls"
              className={`grid size-11 shrink-0 place-items-center rounded-full border shadow-lift backdrop-blur transition-transform active:scale-95 ${
                menuOpen
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/95 text-foreground"
              }`}
            >
              {menuOpen ? <X className="size-5" /> : <SlidersHorizontal className="size-5" />}
            </button>
          </div>

          {/* Compact summary of what the heat currently represents. */}
          {!menuOpen && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-baseline gap-1 rounded-full border border-border bg-card/95 px-2.5 py-1 shadow-card backdrop-blur">
                <span lang="bn" className="text-[12px] font-bold leading-none">
                  {layer.bn}
                </span>
                <span lang="en" className="text-[10px] leading-none text-muted-foreground">
                  {layer.en}
                </span>
              </span>
              <span className="inline-flex items-baseline gap-1 rounded-full border border-border bg-card/95 px-2.5 py-1 shadow-card backdrop-blur">
                <span lang="bn" className="text-[12px] font-bold leading-none">
                  {activeWindow?.bn}
                </span>
                <span lang="en" className="text-[10px] leading-none text-muted-foreground">
                  {activeWindow?.en}
                </span>
              </span>
              <span className="inline-flex items-baseline gap-1 rounded-full border border-border bg-card/95 px-2.5 py-1 shadow-card backdrop-blur">
                <span lang="bn" className="text-[12px] font-bold leading-none">
                  {district.nameBn}
                </span>
              </span>
            </div>
          )}

          <MapMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            districtId={districtId}
            onDistrictChange={handleSelectDistrict}
            districtCovered={districtCovered}
            districtName={{ bn: district.nameBn, en: district.nameEn }}
            layerId={layerId}
            onLayerChange={setLayerId}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
            heatMode={heatMode}
            onHeatModeChange={setHeatMode}
            heatOpacity={heatOpacity}
            onHeatOpacityChange={setHeatOpacity}
            areaOpacity={areaOpacity}
            onAreaOpacityChange={setAreaOpacity}
          />
        </div>
      </div>

      {/* Advisories live in their own layer so a tall controls panel can never
          push them off-screen or behind the bottom navigation. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 sm:px-4 lg:bottom-4">
        <div className="pointer-events-auto w-full max-w-md">
          <AdvisoryToast advisory={advisory} onDismiss={() => setAdvisory(null)} />
        </div>
      </div>


      {/* Right rail: zoom + locate. */}
      <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-4">
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn({ duration: 300 })}
          onZoomOut={() => mapRef.current?.zoomOut({ duration: 300 })}
          onLocate={locateMe}
        />
      </div>

      {/* Primary report action — hidden while the controls menu is open so it
          never sits on top of the panel. */}
      {!menuOpen && (
        <div className="pointer-events-none absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-30 sm:right-4 lg:bottom-4">
          <ReportFAB onClick={() => setReportOpen(true)} />
        </div>
      )}


      {/* Bottom-left: route comparison (when active) + the temperature scale. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex max-h-[calc(100dvh-10.5rem)] flex-col justify-end gap-2.5 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pr-24 sm:p-4 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pr-24 lg:right-auto lg:w-[23rem] lg:pb-4">
        <div className="pointer-events-auto mx-auto w-full max-w-md overflow-y-auto lg:mx-0 lg:max-w-none">

          <RouteComparisonPanel
            routeSet={routeSet}
            emptyFor={routeEmptyFor}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            onClose={closeRoutes}
          />
        </div>
        <TemperatureScale />
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
