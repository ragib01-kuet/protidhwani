import { createElement, useCallback, useMemo } from "react";
import Map, {
  Layer as MapLibreLayer,
  Marker,
  NavigationControl,
  Source as MapLibreSource,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { AREAS_GEOJSON } from "@/data/safety-data";
import type { DemoRoute, Incident, SafetyLayerDef } from "@/types/safety";
import { safetyColor } from "@/utils/safetyColor";

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
  const showAreas = layer.categories.length === 0;

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
      interactiveLayerIds={showAreas ? ["areas-fill"] : []}
      onClick={handleClick}
      onLoad={(e) => onMapReady(e.target as unknown as MapRef)}
      cursor={showAreas ? "pointer" : "grab"}
      attributionControl={false}
      reuseMaps
    >
      <NavigationControl position="bottom-right" showCompass={false} />

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
            "fill-opacity": showAreas ? 0.55 : 0,
            "fill-opacity-transition": { duration: 300, delay: 0 },
            "fill-outline-color": "rgba(255,255,255,0.35)",
          }}
        />
        <Layer
          id="areas-selected"
          type="line"
          filter={["==", ["get", "id"], selectedAreaId ?? "__none__"]}
          paint={{
            "line-color": "#0F766E",
            "line-width": 2.5,
            "line-opacity": showAreas ? 0.9 : 0,
            "line-opacity-transition": { duration: 300, delay: 0 },
          }}
        />
      </Source>

      {/* Incident heatmap for every non-community layer. */}
      <Source id="incidents" type="geojson" data={incidentGeoJSON}>
        <Layer
          id="incidents-heat"
          type="heatmap"
          paint={{
            "heatmap-weight": ["interpolate", ["linear"], ["get", "severity"], 1, 0.25, 5, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 1, 14, 3],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 18, 14, 48],
            "heatmap-opacity": showAreas ? 0 : 0.75,
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
