import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Locate,
  Plus,
  Minus,
  Layers,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  ShieldCheck,
  Home,
  Newspaper,
  MapPinned,
  Siren,
  User,
  Camera,
  FileText,
  UserX,
  Route as RouteIcon,
  Hospital,
  Building2,
  Lightbulb,
  Users,
  ArrowRight,
  X,
  Check,
  ChevronLeft,
  WifiOff,
  Flag,
  Car,
  Loader2,
  PhoneCall,
} from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "অপরাধ মানচিত্র · Crime Heat Map — Protidhwani" },
      {
        name: "description",
        content:
          "A community-powered crime heat map of Bangladesh. Understand local safety, verified incidents, and safer routes in real time.",
      },
      { property: "og:title", content: "Crime Heat Map · অপরাধ মানচিত্র — Protidhwani" },
      {
        property: "og:description",
        content:
          "Historical, community-reported safety patterns across Bangladesh — beautifully visualized.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapScreen,
});

/* -------------------------------- Data --------------------------------- */

const CATEGORIES = [
  { id: "all", bn: "সব", en: "All", icon: "◎" },
  { id: "harassment", bn: "হয়রানি", en: "Harassment", icon: "👩" },
  { id: "robbery", bn: "ছিনতাই", en: "Robbery", icon: "🚨" },
  { id: "violence", bn: "সহিংসতা", en: "Violence", icon: "⚔" },
  { id: "missing", bn: "নিখোঁজ", en: "Missing", icon: "🔎" },
  { id: "accident", bn: "দুর্ঘটনা", en: "Accident", icon: "🚦" },
  { id: "unrest", bn: "অস্থিরতা", en: "Unrest", icon: "🪧" },
  { id: "flood", bn: "বন্যা", en: "Flood", icon: "🌊" },
  { id: "fire", bn: "অগ্নিকাণ্ড", en: "Fire", icon: "🔥" },
  { id: "medical", bn: "চিকিৎসা", en: "Medical", icon: "🏥" },
] as const;

const TIMELINES = [
  { id: "24h", bn: "২৪ ঘণ্টা", en: "24h" },
  { id: "7d", bn: "৭ দিন", en: "Week" },
  { id: "30d", bn: "৩০ দিন", en: "Month" },
  { id: "1y", bn: "১ বছর", en: "Year" },
  { id: "all", bn: "সর্বকালীন", en: "All" },
] as const;

// Heat blobs positioned relative to the map viewport (percent).
// severity: 0 safe -> 1 critical
const HEAT_BLOBS = [
  { cx: 44, cy: 46, r: 22, s: 0.95, label: "Dhaka" }, // Dhaka
  { cx: 38, cy: 52, r: 14, s: 0.55, label: "Manikganj" },
  { cx: 55, cy: 40, r: 12, s: 0.7, label: "Narsingdi" },
  { cx: 66, cy: 32, r: 16, s: 0.75, label: "Sylhet" },
  { cx: 30, cy: 68, r: 18, s: 0.6, label: "Khulna" },
  { cx: 22, cy: 82, r: 12, s: 0.4, label: "Sundarbans" },
  { cx: 60, cy: 72, r: 14, s: 0.85, label: "Chattogram" },
  { cx: 70, cy: 88, r: 10, s: 0.65, label: "Cox's Bazar" },
  { cx: 18, cy: 30, r: 12, s: 0.35, label: "Rajshahi" },
  { cx: 30, cy: 18, r: 10, s: 0.3, label: "Rangpur" },
  { cx: 50, cy: 60, r: 8, s: 0.5, label: "Munshiganj" },
];

const INSIGHTS = [
  { icon: Users, bn: "দিনে ব্যস্ত এলাকা", en: "Busy during daytime", tone: "verified" },
  { icon: AlertTriangle, bn: "মধ্যরাতের পর এড়িয়ে চলুন", en: "Avoid after midnight", tone: "warning" },
  { icon: ShieldCheck, bn: "কাছেই পুলিশ টহল", en: "Police patrol nearby", tone: "primary" },
  { icon: Lightbulb, bn: "রাস্তায় আলো আছে", en: "Street lighting available", tone: "primary" },
];

const NEARBY = [
  { icon: ShieldCheck, bn: "নিরাপদ অঞ্চল", en: "Safe zone", dist: "৪২০ মি" },
  { icon: Building2, bn: "শাহবাগ থানা", en: "Police station", dist: "৭০০ মি" },
  { icon: Hospital, bn: "বিএসএমএমইউ", en: "Hospital", dist: "১.১ কিমি" },
  { icon: Siren, bn: "জরুরি আশ্রয়", en: "Emergency shelter", dist: "১.৮ কিমি" },
];

const ROUTES = [
  { id: "safe", bn: "সবচেয়ে নিরাপদ পথ", en: "Safest route", score: 96, time: "২৮ মি", tone: "primary" },
  { id: "balanced", bn: "ভারসাম্যপূর্ণ পথ", en: "Balanced route", score: 84, time: "২২ মি", tone: "warning" },
  { id: "fast", bn: "সবচেয়ে দ্রুত পথ", en: "Fastest route", score: 68, time: "১৭ মি", tone: "emergency" },
] as const;

type FeedItem = {
  bn: string;
  en: string;
  time: string;
  dist: string;
  sev: number;
  verified: boolean;
  ev: number;
  supp: number;
};

const SEED_REPORTS: FeedItem[] = [
  { bn: "মোবাইল ছিনতাই", en: "Phone snatching near TSC", time: "২ ঘণ্টা আগে", dist: "৩২০ মি", sev: 0.75, verified: true, ev: 3, supp: 42 },
  { bn: "রাস্তায় হয়রানি", en: "Street harassment report", time: "৫ ঘণ্টা আগে", dist: "৬১০ মি", sev: 0.55, verified: true, ev: 1, supp: 27 },
  { bn: "রিকশা দুর্ঘটনা", en: "Rickshaw accident, minor injury", time: "গতকাল", dist: "৯০০ মি", sev: 0.4, verified: false, ev: 0, supp: 12 },
];

const AREA_INDEX: Record<string, { cx: number; cy: number }> = {
  Dhaka: { cx: 44, cy: 46 },
  Sylhet: { cx: 66, cy: 32 },
  Chattogram: { cx: 60, cy: 72 },
  Khulna: { cx: 30, cy: 68 },
  Rajshahi: { cx: 18, cy: 30 },
  Rangpur: { cx: 30, cy: 18 },
  Manikganj: { cx: 38, cy: 52 },
  Narsingdi: { cx: 55, cy: 40 },
  Sundarbans: { cx: 22, cy: 82 },
  "Cox's Bazar": { cx: 70, cy: 88 },
  Munshiganj: { cx: 50, cy: 60 },
};

/* ------------------------------- Screen -------------------------------- */

function MapScreen() {
  const [category, setCategory] = useState<string>("all");
  const [timeline, setTimeline] = useState<string>("7d");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedArea, setSelectedArea] = useState<string>("Shahbag");
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<"heat" | "clusters" | "safe">("heat");
  const [offline, setOffline] = useState(false);
  const [modal, setModal] = useState<null | "report" | "sos" | "vehicle" | "flag" | "photo" | "anon">(null);
  const [toast, setToast] = useState<{ bn: string; en: string; tone?: string } | null>(null);
  const [route, setRoute] = useState<string>("safe");
  const [feed, setFeed] = useState(SEED_REPORTS);

  useEffect(() => {
    const t = setTimeout(() => setAlertShown(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Filtered severities based on timeline (fewer for 24h, more for all-time)
  const timelineScale =
    timeline === "24h" ? 0.55 : timeline === "7d" ? 0.8 : timeline === "30d" ? 1 : timeline === "1y" ? 1.1 : 1.2;

  const pushToast = (bn: string, en: string, tone?: string) => setToast({ bn, en, tone });

  const submitReport = (kind: string, anonymous = false) => {
    const item = {
      bn: kind === "emergency" ? "জরুরি রিপোর্ট" : "নতুন রিপোর্ট",
      en: (anonymous ? "Anonymous · " : "") + `${kind[0].toUpperCase()}${kind.slice(1)} reported`,
      time: "এইমাত্র",
      dist: "১২০ মি",
      sev: kind === "emergency" ? 0.9 : 0.6,
      verified: false,
      ev: 0,
      supp: 1,
    };
    setFeed((f) => [item, ...f]);
    setModal(null);
    setFabOpen(false);
    pushToast("রিপোর্ট জমা হয়েছে", "Report submitted · pending verification", "verified");
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-surface text-foreground">
      <MapCanvas
        zoom={zoom}
        onSelectArea={setSelectedArea}
        category={category}
        timelineScale={timelineScale}
        layer={layer}
        query={query}
      />

      <TopOverlay
        category={category}
        setCategory={setCategory}
        timeline={timeline}
        setTimeline={setTimeline}
        query={query}
        setQuery={setQuery}
        onSelectArea={(a) => {
          setSelectedArea(a);
          setSheetOpen(true);
        }}
        offline={offline}
        setOffline={setOffline}
      />

      <LiveAlert visible={alertShown} onClose={() => setAlertShown(false)} onSOS={() => setModal("sos")} />

      <MapControls zoom={zoom} setZoom={setZoom} layer={layer} setLayer={setLayer} />

      <Legend />

      <ReportFab
        open={fabOpen}
        setOpen={setFabOpen}
        onAction={(k) => setModal(k)}
      />

      <AreaSheet
        open={sheetOpen}
        expanded={sheetExpanded}
        onToggleExpand={() => setSheetExpanded((s) => !s)}
        onClose={() => setSheetOpen(false)}
        area={selectedArea}
        route={route}
        setRoute={setRoute}
        feed={feed}
        onFlag={() => setModal("flag")}
        onVehicle={() => setModal("vehicle")}
      />

      <BottomNav onSOS={() => setModal("sos")} />

      {modal === "report" && <ReportModal onClose={() => setModal(null)} onSubmit={() => submitReport("incident")} />}
      {modal === "photo" && <ReportModal photo onClose={() => setModal(null)} onSubmit={() => submitReport("incident")} />}
      {modal === "anon" && <ReportModal anonymous onClose={() => setModal(null)} onSubmit={() => submitReport("incident", true)} />}
      {modal === "sos" && <SOSModal onClose={() => setModal(null)} onConfirm={() => { submitReport("emergency"); }} />}
      {modal === "vehicle" && <VehicleModal onClose={() => setModal(null)} onDone={(msg) => { setModal(null); pushToast(msg.bn, msg.en, msg.tone); }} />}
      {modal === "flag" && <FlagModal onClose={() => setModal(null)} onDone={() => { setModal(null); pushToast("তথ্য যাচাই অনুরোধ পাঠানো হয়েছে", "Misinformation flag sent for review", "warning"); }} />}

      {offline && <OfflineBanner />}
      {toast && <Toast toast={toast} />}
    </div>
  );
}


/* ------------------------------- Map SVG ------------------------------- */

function MapCanvas({
  zoom,
  onSelectArea,
  category,
  timelineScale,
  layer,
  query,
}: {
  zoom: number;
  onSelectArea: (a: string) => void;
  category: string;
  timelineScale: number;
  layer: "heat" | "clusters" | "safe";
  query: string;
}) {
  const q = query.trim().toLowerCase();
  const matched = q
    ? HEAT_BLOBS.find((b) => b.label.toLowerCase().includes(q))
    : null;
  const catMod = category === "all" ? 1 : category === "harassment" || category === "robbery" ? 1.05 : 0.85;
  // A stylized Bangladesh silhouette (approximate outline in a 100x100 viewBox).
  const bd =
    "M28 12 L36 8 L44 12 L52 10 L58 16 L64 14 L70 18 L74 24 L72 30 L66 30 L64 36 L70 40 L68 46 L74 50 L72 58 L68 60 L70 66 L66 72 L62 72 L64 78 L60 84 L58 90 L54 92 L52 88 L48 86 L44 88 L40 84 L34 82 L30 78 L26 72 L28 66 L24 62 L22 56 L26 50 L22 44 L18 40 L20 34 L24 28 L22 22 L26 16 Z";

  return (
    <div className="absolute inset-0">
      {/* Ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 900px at 50% 40%, oklch(0.98 0.01 190), oklch(0.96 0.005 250) 60%, oklch(0.94 0.005 250) 100%)",
        }}
      />
      {/* Very subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.9 0.005 250 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.9 0.005 250 / 0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 50%, transparent 90%)",
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          {HEAT_BLOBS.map((b, i) => (
            <radialGradient key={i} id={`heat-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={heatColor(b.s)} stopOpacity="0.85" />
              <stop offset="55%" stopColor={heatColor(b.s)} stopOpacity="0.35" />
              <stop offset="100%" stopColor={heatColor(b.s)} stopOpacity="0" />
            </radialGradient>
          ))}
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.97 0.02 175)" />
            <stop offset="100%" stopColor="oklch(0.93 0.03 178)" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#0f766e" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Country shape */}
        <path
          d={bd}
          fill="url(#land)"
          stroke="oklch(0.52 0.09 178 / 0.55)"
          strokeWidth="0.35"
          filter="url(#softShadow)"
        />

        {/* Division lines - subtle */}
        <g stroke="oklch(0.52 0.09 178 / 0.18)" strokeWidth="0.25" fill="none">
          <path d="M30 30 Q50 40 70 32" />
          <path d="M26 55 Q50 55 74 55" />
          <path d="M40 70 Q55 78 66 75" />
        </g>

        {/* Heat blobs */}
        {layer !== "clusters" &&
          HEAT_BLOBS.map((b, i) => {
            const s = Math.min(1, b.s * timelineScale * catMod);
            const opacity = layer === "safe" ? 0.35 : 1;
            return (
              <circle
                key={`h-${i}`}
                cx={b.cx}
                cy={b.cy}
                r={b.r * (0.85 + s * 0.35)}
                fill={`url(#heat-${i})`}
                className="mix-blend-multiply transition-all duration-500"
                style={{ opacity }}
              />
            );
          })}

        {/* Safe overlay */}
        {layer === "safe" &&
          HEAT_BLOBS.filter((b) => b.s < 0.5).map((b, i) => (
            <circle
              key={`safe-${i}`}
              cx={b.cx}
              cy={b.cy}
              r={b.r * 0.8}
              fill="oklch(0.78 0.15 150 / 0.35)"
              className="mix-blend-multiply"
            />
          ))}

        {/* Report clusters */}
        {HEAT_BLOBS.filter((b) => b.s * timelineScale * catMod > 0.55).map((b, i) => {
          const s = Math.min(1, b.s * timelineScale * catMod);
          const highlighted = matched?.label === b.label;
          return (
            <g
              key={`c-${i}`}
              className="cursor-pointer"
              onClick={() => onSelectArea(b.label)}
            >
              {highlighted && (
                <circle cx={b.cx} cy={b.cy} r="5" fill="none" stroke="oklch(0.55 0.2 262)" strokeWidth="0.6" className="animate-ping" />
              )}
              <circle cx={b.cx} cy={b.cy} r={highlighted ? 3.2 : 2.6} fill="white" stroke={heatColor(s)} strokeWidth={highlighted ? 1.1 : 0.8} />
              <text
                x={b.cx}
                y={b.cy + 0.9}
                textAnchor="middle"
                fontSize="2.2"
                fontWeight="700"
                fill="oklch(0.25 0.05 180)"
              >
                {clusterCount(s)}
              </text>
            </g>
          );
        })}

        {/* You are here */}
        <g>
          <circle cx="44" cy="46" r="1.4" fill="oklch(0.55 0.2 262)" />
          <circle
            cx="44"
            cy="46"
            r="3.5"
            fill="oklch(0.55 0.2 262 / 0.25)"
            className="animate-ping"
            style={{ transformOrigin: "44px 46px" }}
          />
        </g>
      </svg>
    </div>
  );
}

function heatColor(s: number): string {
  // safe -> critical: green -> yellow -> orange -> red -> dark red
  if (s < 0.25) return "oklch(0.78 0.15 150)"; // green
  if (s < 0.45) return "oklch(0.85 0.16 95)"; // yellow
  if (s < 0.65) return "oklch(0.75 0.17 60)"; // orange
  if (s < 0.85) return "oklch(0.62 0.22 27)"; // red
  return "oklch(0.42 0.18 22)"; // dark red
}

function clusterCount(s: number): string {
  const n = Math.round(s * 40) + 6;
  return toBn(n);
}

const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBn(n: number): string {
  return String(n)
    .split("")
    .map((d) => (/[0-9]/.test(d) ? bnDigits[Number(d)] : d))
    .join("");
}

/* ----------------------------- Top overlay ----------------------------- */

function TopOverlay({
  category,
  setCategory,
  timeline,
  setTimeline,
  query,
  setQuery,
  onSelectArea,
  offline,
  setOffline,
}: {
  category: string;
  setCategory: (v: string) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  query: string;
  setQuery: (v: string) => void;
  onSelectArea: (a: string) => void;
  offline: boolean;
  setOffline: (b: boolean) => void;
}) {
  const [focus, setFocus] = useState(false);
  const q = query.trim().toLowerCase();
  const suggestions = q
    ? Object.keys(AREA_INDEX).filter((k) => k.toLowerCase().includes(q)).slice(0, 5)
    : [];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="pointer-events-auto mx-3 flex items-center gap-2">
        <Link
          to="/"
          className="tap grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-background/80 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="relative flex-1">
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="জেলা, এলাকা, থানা…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              className="bn min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/80"
            />
            {query && (
              <button onClick={() => setQuery("")} className="tap grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setOffline(!offline)}
              className={[
                "tap grid h-7 w-7 place-items-center rounded-lg transition-colors",
                offline ? "bg-warning/15 text-warning-foreground" : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
              aria-label="Toggle offline mode"
              title="Offline mode"
            >
              {offline ? <WifiOff className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            </button>
          </div>
          {focus && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-lg backdrop-blur-xl animate-fade-in">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(s);
                    onSelectArea(s);
                    setFocus(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-muted"
                >
                  <MapPinned className="h-3.5 w-3.5 text-primary" />
                  <span className="bn font-semibold">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Title chip */}
      <div className="pointer-events-auto mx-3 mt-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur-xl">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
          <MapPinned className="h-3 w-3" />
        </span>
        <span className="bn text-[13px] font-semibold leading-none">অপরাধ মানচিত্র</span>
        <span className="text-[11px] font-medium leading-none text-muted-foreground">
          Crime Heat Map
        </span>
      </div>

      {/* Category chips */}
      <div className="pointer-events-auto mt-3">
        <div className="scrollbar-none flex gap-2 overflow-x-auto px-3 pb-1">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={[
                  "tap flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] backdrop-blur-xl transition-all",
                  active
                    ? "border-transparent bg-foreground text-background shadow-[0_6px_16px_-8px_rgba(0,0,0,0.4)]"
                    : "border-border/70 bg-background/80 text-foreground/80 hover:bg-background",
                ].join(" ")}
              >
                <span className="text-[13px] leading-none">{c.icon}</span>
                <span className="bn font-semibold leading-none">{c.bn}</span>
                <span className="leading-none opacity-60">{c.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline chips */}
      <div className="pointer-events-auto mt-2 px-3">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-background/80 p-0.5 shadow-sm backdrop-blur-xl">
          {TIMELINES.map((t) => {
            const active = timeline === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTimeline(t.id)}
                className={[
                  "tap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="bn">{t.bn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Live alert ------------------------------ */

function LiveAlert({ visible, onClose, onSOS }: { visible: boolean; onClose: () => void; onSOS: () => void }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 z-40 flex justify-center px-3 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0",
      ].join(" ")}
      style={{ top: "calc(env(safe-area-inset-top,0px) + 178px)" }}
    >
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-emergency/25 bg-background/90 shadow-[0_20px_40px_-16px_rgba(220,38,38,0.35)] backdrop-blur-xl">
        <div className="flex items-start gap-3 p-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emergency/10 text-emergency">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="bn text-[13px] font-bold text-emergency">⚠ সতর্কতা</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                High-risk area
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-foreground/85">
              You're entering an area with a high number of community-reported incidents.
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emergency" /> Risk: High
              </span>
              <span>·</span>
              <span className="bn">২৪ ঘণ্টায় ৩টি যাচাইকৃত ঘটনা</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tap -mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t border-border/70 bg-surface/40 p-1.5">
          {[
            { l: "Continue", tone: "" },
            { l: "Details", tone: "" },
            { l: "Share loc", tone: "" },
            { l: "SOS", tone: "emergency" },
          ].map((b) => (
            <button
              key={b.l}
              onClick={b.tone === "emergency" ? onSOS : onClose}
              className={[
                "tap rounded-lg py-1.5 text-[11.5px] font-semibold transition-transform active:scale-[0.97]",
                b.tone === "emergency"
                  ? "bg-emergency text-emergency-foreground"
                  : "bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {b.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Map controls ------------------------------ */

function MapControls({ zoom, setZoom, layer, setLayer }: { zoom: number; setZoom: (n: number) => void; layer: "heat" | "clusters" | "safe"; setLayer: (l: "heat" | "clusters" | "safe") => void }) {
  const cycle = () => setLayer(layer === "heat" ? "clusters" : layer === "clusters" ? "safe" : "heat");
  return (
    <div className="absolute right-3 top-[220px] z-20 flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/85 shadow-lg backdrop-blur-xl">
        <button
          onClick={() => setZoom(Math.min(2.5, +(zoom + 0.2).toFixed(2)))}
          className="tap grid h-10 w-10 place-items-center hover:bg-muted"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-border/70" />
        <button
          onClick={() => setZoom(Math.max(0.7, +(zoom - 0.2).toFixed(2)))}
          className="tap grid h-10 w-10 place-items-center hover:bg-muted"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={cycle}
        className={[
          "tap grid h-10 w-10 place-items-center rounded-2xl border shadow-lg backdrop-blur-xl transition-colors",
          layer === "heat" && "border-border/70 bg-background/85",
          layer === "clusters" && "border-verified/40 bg-verified/10 text-verified",
          layer === "safe" && "border-primary/40 bg-primary/10 text-primary",
        ].filter(Boolean).join(" ")}
        aria-label={`Layer: ${layer}`}
        title={`Layer: ${layer}`}
      >
        <Layers className="h-4 w-4" />
      </button>
      <button
        className="tap grid h-10 w-10 place-items-center rounded-2xl border border-primary/30 bg-primary text-primary-foreground shadow-lg"
        aria-label="Locate me"
      >
        <Locate className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------- Legend ------------------------------- */

function Legend() {
  const stops = [
    { c: "oklch(0.78 0.15 150)", bn: "নিরাপদ", en: "Safe" },
    { c: "oklch(0.85 0.16 95)", bn: "মাঝারি", en: "Moderate" },
    { c: "oklch(0.75 0.17 60)", bn: "সতর্ক", en: "Concern" },
    { c: "oklch(0.62 0.22 27)", bn: "উচ্চ ঝুঁকি", en: "High" },
    { c: "oklch(0.42 0.18 22)", bn: "সংকট", en: "Critical" },
  ];
  return (
    <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom,0px)+320px)] left-3 z-20 rounded-2xl border border-border/70 bg-background/85 p-2 shadow-lg backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between">
        <span className="bn text-[10px] font-semibold">তাপমাত্রা</span>
        <span className="text-[10px] font-medium text-muted-foreground">Heat</span>
      </div>
      <div className="flex h-2 w-32 overflow-hidden rounded-full">
        {stops.map((s) => (
          <div key={s.en} className="flex-1" style={{ background: s.c }} />
        ))}
      </div>
      <div className="mt-1 flex w-32 justify-between">
        <span className="bn text-[9px] text-muted-foreground">{stops[0].bn}</span>
        <span className="bn text-[9px] text-muted-foreground">{stops[stops.length - 1].bn}</span>
      </div>
    </div>
  );
}

/* ---------------------------------- FAB -------------------------------- */

function ReportFab({ open, setOpen, onAction }: { open: boolean; setOpen: (b: boolean) => void; onAction: (k: "photo" | "quick" | "emergency" | "anonymous") => void }) {
  const actions = [
    { icon: Camera, bn: "ছবি তুলুন", en: "Take photo", tone: "primary" },
    { icon: FileText, bn: "দ্রুত রিপোর্ট", en: "Quick report", tone: "verified" },
    { icon: Siren, bn: "জরুরি", en: "Emergency", tone: "emergency" },
    { icon: UserX, bn: "নাম প্রকাশ ছাড়া", en: "Anonymous", tone: "warning" },
  ] as const;

  return (
    <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+310px)] right-3 z-30 flex flex-col items-end gap-2">
      {actions.map((a, i) => (
        <div
          key={a.en}
          className={[
            "pointer-events-auto flex items-center gap-2 transition-all duration-300",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0",
          ].join(" ")}
          style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 shadow-md backdrop-blur-xl">
            <span className="bn text-[11px] font-semibold">{a.bn}</span>
            <span className="text-[10px] text-muted-foreground">{a.en}</span>
          </div>
          <button
            className={[
              "tap grid h-10 w-10 place-items-center rounded-full shadow-lg",
              a.tone === "emergency" && "bg-emergency text-emergency-foreground",
              a.tone === "primary" && "bg-primary text-primary-foreground",
              a.tone === "verified" && "bg-verified text-verified-foreground",
              a.tone === "warning" && "bg-warning text-warning-foreground",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <a.icon className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        onClick={() => setOpen(!open)}
        className={[
          "pointer-events-auto tap grid h-14 w-14 place-items-center rounded-full text-primary-foreground shadow-[0_16px_36px_-10px_rgba(15,118,110,0.65)] transition-transform duration-300",
          "bg-primary",
          open && "rotate-45",
        ].join(" ")}
        aria-label="Report incident"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

/* ---------------------------- Bottom sheet ----------------------------- */

function AreaSheet({
  open,
  expanded,
  onToggleExpand,
  onClose,
  area,
}: {
  open: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  area: string;
}) {
  const info = useMemo(
    () => ({
      bn: "ঢাকা • শাহবাগ",
      en: `${area}, Dhaka`,
      index: 72,
      risk: "High",
      reports: "১,২৮৪",
      verified: "৯৩২",
      last: "আজ",
    }),
    [area],
  );

  return (
    <div
      className={[
        "absolute inset-x-0 bottom-0 z-30 transition-transform duration-500 ease-out",
        open ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 72px)" }}
    >
      <div
        className={[
          "mx-2 overflow-hidden rounded-t-[28px] border border-b-0 border-border/70 bg-background/95 shadow-[0_-20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur-2xl transition-[max-height] duration-500 ease-out",
          expanded ? "max-h-[68vh]" : "max-h-[280px]",
        ].join(" ")}
      >
        {/* Handle */}
        <button
          onClick={onToggleExpand}
          className="mx-auto flex w-full flex-col items-center pt-2"
          aria-label="Expand sheet"
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </button>

        <div className="scrollbar-none max-h-[68vh] overflow-y-auto px-4 pb-4 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="bn text-[20px] font-bold leading-tight tracking-tight">
                {info.bn}
              </div>
              <div className="text-[12px] font-medium text-muted-foreground">{info.en}</div>
            </div>
            <button
              onClick={onClose}
              className="tap grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Metric cards */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetricCard
              bn="নিরাপত্তা সূচক"
              en="Safety Index"
              value={`${toBn(info.index)}`}
              suffix="/১০০"
              tone="warning"
              accent
            />
            <MetricCard
              bn="ঝুঁকির মাত্রা"
              en="Risk Level"
              value={info.risk}
              tone="emergency"
              pill
            />
            <MetricCard bn="মোট রিপোর্ট" en="Reports" value={info.reports} tone="foreground" />
            <MetricCard
              bn="যাচাইকৃত"
              en="Verified"
              value={info.verified}
              tone="verified"
              icon={<Check className="h-3 w-3" />}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-2xl border border-border/70 bg-surface p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="bn text-[11px] font-semibold text-muted-foreground">
                    সর্বশেষ রিপোর্ট
                  </div>
                  <div className="text-[10px] text-muted-foreground">Last report</div>
                </div>
                <div className="bn text-[14px] font-bold">{info.last}</div>
              </div>
            </div>
            <button
              onClick={onToggleExpand}
              className="tap grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-surface"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>

          {/* Expanded content */}
          <div
            className={[
              "grid gap-4 overflow-hidden transition-all duration-500",
              expanded ? "mt-4 max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            {/* Insights */}
            <Section bn="নিরাপত্তা বিশ্লেষণ" en="Safety insights">
              <div className="grid grid-cols-2 gap-2">
                {INSIGHTS.map((i) => (
                  <div
                    key={i.en}
                    className="flex items-start gap-2 rounded-2xl border border-border/70 bg-surface p-2.5"
                  >
                    <span
                      className={[
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        toneBg(i.tone),
                      ].join(" ")}
                    >
                      <i.icon className={`h-3.5 w-3.5 ${toneText(i.tone)}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="bn text-[12.5px] font-semibold leading-tight">{i.bn}</div>
                      <div className="text-[10.5px] text-muted-foreground">{i.en}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Nearby */}
            <Section bn="নিকটবর্তী" en="Nearby">
              <div className="grid grid-cols-2 gap-2">
                {NEARBY.map((n) => (
                  <div
                    key={n.en}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <n.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="bn text-[12.5px] font-semibold leading-tight">{n.bn}</div>
                      <div className="text-[10.5px] text-muted-foreground">{n.en}</div>
                    </div>
                    <div className="bn text-[11px] font-semibold text-foreground/70">
                      {n.dist}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Route awareness */}
            <Section
              bn="পথ সচেতনতা"
              en="Route awareness"
              action={
                <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Plan <ArrowRight className="h-3 w-3" />
                </button>
              }
            >
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2.5">
                <RouteIcon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="bn text-[12px] font-semibold leading-tight">
                    বর্তমান অবস্থান → গন্তব্য
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    Current location → Destination
                  </div>
                </div>
              </div>
              <div className="mt-2 grid gap-2">
                {ROUTES.map((r) => (
                  <div
                    key={r.id}
                    className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="grid place-items-center">
                      <RadialScore score={r.score} tone={r.tone} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="bn text-[13px] font-bold leading-tight">{r.bn}</div>
                      <div className="text-[11px] text-muted-foreground">{r.en}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span
                          className={[
                            "rounded-full px-1.5 py-0.5 font-semibold",
                            toneBg(r.tone),
                            toneText(r.tone),
                          ].join(" ")}
                        >
                          {r.score}% safe
                        </span>
                        <span className="bn text-muted-foreground">· {r.time}</span>
                      </div>
                    </div>
                    <ChevronUp className="h-4 w-4 rotate-90 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </Section>

            {/* Community reports cluster */}
            <Section bn="কমিউনিটি রিপোর্ট" en="Community reports">
              <div className="grid gap-2">
                {[
                  {
                    bn: "মোবাইল ছিনতাই",
                    en: "Phone snatching near TSC",
                    time: "২ ঘণ্টা আগে",
                    dist: "৩২০ মি",
                    sev: 0.75,
                    verified: true,
                    ev: 3,
                    supp: 42,
                  },
                  {
                    bn: "রাস্তায় হয়রানি",
                    en: "Street harassment report",
                    time: "৫ ঘণ্টা আগে",
                    dist: "৬১০ মি",
                    sev: 0.55,
                    verified: true,
                    ev: 1,
                    supp: 27,
                  },
                  {
                    bn: "রিকশা দুর্ঘটনা",
                    en: "Rickshaw accident, minor injury",
                    time: "গতকাল",
                    dist: "৯০০ মি",
                    sev: 0.4,
                    verified: false,
                    ev: 0,
                    supp: 12,
                  },
                ].map((r) => (
                  <div
                    key={r.en}
                    className="rounded-2xl border border-border/70 bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="bn text-[13px] font-bold leading-tight">{r.bn}</div>
                        <div className="text-[11px] text-muted-foreground">{r.en}</div>
                      </div>
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-background"
                        style={{ background: heatColor(r.sev) }}
                        title="Severity"
                      >
                        !
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="bn">{r.time}</span>
                      <span>·</span>
                      <span className="bn">{r.dist}</span>
                      <span>·</span>
                      {r.verified ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-verified/10 px-1.5 py-0.5 font-semibold text-verified">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
                          Pending
                        </span>
                      )}
                      <span className="ml-auto">
                        {r.ev} evidence · {r.supp} support
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  bn,
  en,
  action,
  children,
}: {
  bn: string;
  en: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="bn text-[14px] font-bold leading-tight">{bn}</div>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            {en}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  bn,
  en,
  value,
  suffix,
  tone = "foreground",
  accent,
  pill,
  icon,
}: {
  bn: string;
  en: string;
  value: string | number;
  suffix?: string;
  tone?: string;
  accent?: boolean;
  pill?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-3",
        accent && "ring-1 ring-inset ring-warning/25",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="bn text-[11px] font-semibold text-muted-foreground">{bn}</div>
          <div className="text-[10px] text-muted-foreground">{en}</div>
        </div>
        {icon && (
          <span className={`grid h-5 w-5 place-items-center rounded-full ${toneBg(tone)} ${toneText(tone)}`}>
            {icon}
          </span>
        )}
      </div>
      {pill ? (
        <div className="mt-2">
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-bold",
              toneBg(tone),
              toneText(tone),
            ].join(" ")}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
            {value}
          </span>
        </div>
      ) : (
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`bn text-[22px] font-bold leading-none ${toneText(tone)}`}>
            {value}
          </span>
          {suffix && (
            <span className="bn text-[11px] font-semibold text-muted-foreground">{suffix}</span>
          )}
        </div>
      )}
    </div>
  );
}

function RadialScore({ score, tone }: { score: number; tone: string }) {
  const R = 16;
  const C = 2 * Math.PI * R;
  const off = C - (score / 100) * C;
  const stroke =
    tone === "primary"
      ? "var(--color-primary)"
      : tone === "warning"
        ? "var(--color-warning)"
        : "var(--color-emergency)";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={R} fill="none" stroke="var(--color-border)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={off}
        transform="rotate(-90 20 20)"
        style={{ transition: "stroke-dashoffset 600ms ease" }}
      />
      <text
        x="20"
        y="22.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="var(--color-foreground)"
      >
        {score}
      </text>
    </svg>
  );
}

function toneBg(tone: string) {
  switch (tone) {
    case "primary":
      return "bg-primary/10";
    case "warning":
      return "bg-warning/15";
    case "emergency":
      return "bg-emergency/10";
    case "verified":
      return "bg-verified/10";
    default:
      return "bg-muted";
  }
}
function toneText(tone: string) {
  switch (tone) {
    case "primary":
      return "text-primary";
    case "warning":
      return "text-warning-foreground";
    case "emergency":
      return "text-emergency";
    case "verified":
      return "text-verified";
    default:
      return "text-foreground";
  }
}

/* ---------------------------- Bottom nav ------------------------------- */

function BottomNav() {
  const items = [
    { id: "home", icon: Home, bn: "হোম", en: "Home", to: "/" },
    { id: "feed", icon: Newspaper, bn: "ফিড", en: "Feed", to: "/" },
    { id: "map", icon: MapPinned, bn: "মানচিত্র", en: "Map", to: "/map", active: true },
    { id: "sos", icon: Siren, bn: "জরুরি", en: "SOS", to: "/" },
    { id: "me", icon: User, bn: "প্রোফাইল", en: "Profile", to: "/" },
  ];
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = "active" in it && it.active;
          return (
            <Link
              key={it.id}
              to={it.to}
              className={[
                "tap flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-8 w-8 place-items-center rounded-xl transition-colors",
                  active ? "bg-primary/10" : "",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`bn text-[10px] font-semibold leading-none ${active ? "text-primary" : ""}`}>
                {it.bn}
              </span>
              <span className="text-[9px] leading-none opacity-60">{it.en}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
