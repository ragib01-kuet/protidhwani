import { createElement, useCallback, useMemo, useState } from "react";
import Map, {
  Layer as MapLibreLayer,
  Marker,
  Source as MapLibreSource,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  AREAS,
  AREAS_GEOJSON,
  MICRO_AREAS,
  MICRO_HEAT_GEOJSON,
} from "@/data/safety-data";
import type { DemoRoute, Incident, SafetyLayerDef } from "@/types/safety";
import { safetyColor } from "@/utils/safetyColor";
import { toBnNumber } from "@/utils/bn";

/**
 * Key-less raster basemap (OpenStreetMap). Swap in a vector style URL from a
 * tile provider when an API key becomes available.
 */
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "\u00a9 OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.35 } },
  ],
};


/**
 * The dev-only JSX source transform injects a `data-tsd-source` prop into every
 * element. react-map-gl forwards unknown props straight into the MapLibre style
 * spec, which then rejects the source/layer. These thin wrappers strip dev-only
 * `data-*` props and use `createElement` so the transform cannot re-add them.
 */
function stripDevProps<T extends object>(props: T): T {
  const source = props as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (!key.startsWith("data-")) clean[key] = source[key];
  }
  return clean as T;
}

const Source = (props: React.ComponentProps<typeof MapLibreSource>) =>
  createElement(MapLibreSource, stripDevProps(props) as never);

const Layer = (props: React.ComponentProps<typeof MapLibreLayer>) =>
  createElement(MapLibreLayer, stripDevProps(props) as never);

export const BANGLADESH_CENTER = { longitude: 90.3563, latitude: 23.685, zoom: 6 };

const ROUTE_COLORS: Record<DemoRoute["id"], string> = {
  safest: "#16A34A",
  balanced: "#CA8A04",
  fastest: "#94A3B8",
};

export interface MapViewProps {
  layer: SafetyLayerDef;
  incidents: Incident[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
  /** Routes rendered as coloured lines; empty array hides them. */
  routes: DemoRoute[];
  /** Simulated "you are here" marker. */
  userLocation: { lng: number; lat: number } | null;
  /** Most recent user-submitted report, animated in. */
  latestReport: Incident | null;
  onMapReady: (map: MapRef) => void;
}

export default function MapView({
  layer,
  incidents,
  selectedAreaId,
  onSelectArea,
  routes,
  userLocation,
  latestReport,
  onMapReady,
}: MapViewProps) {
  /** The community layer emphasises the choropleth; others emphasise heat. */
  const areaFocused = layer.categories.length === 0;
  /** Live zoom drives micro (street/para) precision. */
  const [zoom, setZoom] = useState(BANGLADESH_CENTER.zoom);
  const showMicro = zoom >= 11.5;

  /** Incident points fed to the MapLibre heatmap layer. */
  const incidentGeoJSON = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: incidents.map((i) => ({
        type: "Feature",
        id: i.id,
        properties: { severity: i.severity, category: i.category, verified: i.verified },
        geometry: { type: "Point", coordinates: [i.lng, i.lat] },
      })),
    }),
    [incidents],
  );

  /** Report counts per area — rendered as the badge pills on the reference UI. */
  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of incidents) counts.set(i.areaId, (counts.get(i.areaId) ?? 0) + 1);
    return AREAS.filter((a) => counts.has(a.id)).map((a) => ({
      area: a,
      count: counts.get(a.id) as number,
    }));
  }, [incidents]);

  const routeGeoJSON = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: "FeatureCollection",
      features: routes.map((r) => ({
        type: "Feature",
        id: r.id,
        properties: { color: ROUTE_COLORS[r.id], kind: r.id },
        geometry: { type: "LineString", coordinates: r.path },
      })),
    }),
    [routes],
  );


  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      // Nested properties are flattened by MapLibre, so only the id is reliable.
      const areaId = feature?.properties?.id;
      if (typeof areaId === "string") onSelectArea(areaId);
    },
    [onSelectArea],
  );

  return (
    <Map
      initialViewState={BANGLADESH_CENTER}
      mapStyle={MAP_STYLE}
      style={{ position: "absolute", inset: 0 }}
      interactiveLayerIds={["areas-fill"]}
      onClick={handleClick}
      onMove={(e) => setZoom(e.viewState.zoom)}
      onLoad={(e) => {
        const map = e.target as unknown as MapRef;
        // Dev-only handle so automated checks can inspect live source data.
        if (import.meta.env.DEV) {
          (window as unknown as { __safetyMap?: unknown }).__safetyMap = map;
        }
        onMapReady(map);
      }}
      cursor="pointer"
      attributionControl={false}
      reuseMaps
    >

      {/* Community safety choropleth — opacity is animated so layer swaps crossfade. */}
      <Source id="areas" type="geojson" data={AREAS_GEOJSON}>
        <Layer
          id="areas-fill"
          type="fill"
          paint={{
            "fill-color": [
              "step",
              ["get", "safetyScore"],
              safetyColor(0),
              20,
              safetyColor(20),
              40,
              safetyColor(40),
              60,
              safetyColor(60),
              80,
              safetyColor(80),
            ],
            "fill-opacity": areaFocused ? 0.5 : 0.22,
            "fill-opacity-transition": { duration: 300, delay: 0 },
            "fill-outline-color": "rgba(255,255,255,0.35)",
          }}
        />
        <Layer
          id="areas-outline"
          type="line"
          paint={{
            "line-color": "rgba(15,118,110,0.55)",
            "line-width": 1.2,
          }}
        />
        <Layer
          id="areas-selected"
          type="line"
          filter={["==", ["get", "id"], selectedAreaId ?? "__none__"]}
          paint={{
            "line-color": "#0F766E",
            "line-width": 2.5,
            "line-opacity": 0.9,
            "line-opacity-transition": { duration: 300, delay: 0 },
          }}
        />
      </Source>

      {/* Ambient street-level heat so the overlay covers every area. */}
      <Source id="micro-heat" type="geojson" data={MICRO_HEAT_GEOJSON}>
        <Layer
          id="micro-heat-layer"
          type="heatmap"
          paint={{
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 1, 0.2, 5, 0.9],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 14, 2.4],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 26, 14, 70],
            "heatmap-opacity": 0.45,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(74,222,128,0)",
              0.3,
              "rgba(163,230,53,0.45)",
              0.55,
              "rgba(250,204,21,0.6)",
              0.75,
              "rgba(251,146,60,0.7)",
              1,
              "rgba(239,68,68,0.8)",
            ],
          }}
        />
      </Source>

      {/* Incident heatmap — always visible, weighted by severity. */}
      <Source id="incidents" type="geojson" data={incidentGeoJSON}>
        <Layer
          id="incidents-heat"
          type="heatmap"
          paint={{
            "heatmap-weight": ["interpolate", ["linear"], ["get", "severity"], 1, 0.25, 5, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 1, 14, 3],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 18, 14, 48],
            "heatmap-opacity": areaFocused ? 0.55 : 0.85,
            "heatmap-opacity-transition": { duration: 300, delay: 0 },
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(22,163,74,0)",
              0.25,
              "rgba(22,163,74,0.55)",
              0.5,
              "rgba(202,138,4,0.7)",
              0.75,
              "rgba(234,88,12,0.8)",
              1,
              "rgba(220,38,38,0.9)",
            ],
          }}
        />
      </Source>

      {/* Route comparison lines. */}
      <Source id="routes" type="geojson" data={routeGeoJSON}>
        <Layer
          id="routes-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 5,
            "line-opacity": routes.length ? 0.9 : 0,
            "line-opacity-transition": { duration: 300, delay: 0 },
          }}
        />
      </Source>

      {/* Per-area report count badges (Bangla numerals), as in the reference UI. */}
      {areaCounts.map(({ area, count }) => (
        <Marker
          key={area.id}
          longitude={area.center[0]}
          latitude={area.center[1]}
          anchor="center"
          onClick={() => onSelectArea(area.id)}
        >
          <button
            aria-label={`${area.nameBn} — ${count} রিপোর্ট`}
            className="grid min-w-9 place-items-center rounded-full border-2 border-white bg-warning px-2 py-1 text-[12px] font-bold tabular-nums text-white shadow-lift transition-transform hover:scale-110"
          >
            <span lang="bn">{toBnNumber(count)}</span>
          </button>
        </Marker>
      ))}

      {/* Street / para precision markers appear once the user zooms in. */}
      {showMicro &&
        MICRO_AREAS.map((m) => (
          <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="center">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-2 py-1 shadow-card backdrop-blur">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: safetyColor(m.safetyScore) }}
              />
              <span lang="bn" className="text-[11px] font-bold leading-none">
                {m.nameBn}
              </span>
              <span lang="bn" className="text-[10px] leading-none text-muted-foreground">
                {toBnNumber(m.reportCount)}
              </span>
            </span>
          </Marker>
        ))}

      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <span className="relative block size-4">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
            <span className="absolute inset-0 rounded-full border-2 border-white bg-primary shadow-lg" />
          </span>
        </Marker>
      )}

      {latestReport && (
        <Marker longitude={latestReport.lng} latitude={latestReport.lat} anchor="bottom">
          <span className="relative block size-5 animate-in zoom-in duration-500">
            <span className="absolute inset-0 animate-ping rounded-full bg-emergency/60" />
            <span className="absolute inset-0 rounded-full border-2 border-white bg-emergency shadow-lg" />
          </span>
        </Marker>
      )}
    </Map>
  );
}
