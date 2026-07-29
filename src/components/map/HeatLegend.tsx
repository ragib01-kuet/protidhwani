import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

import type { HeatMode } from "@/types/safety";
import { toBnNumber } from "@/utils/bn";

/** Segmented switch options — Bangla dominant, English secondary. */
const MODES: { id: HeatMode; bn: string; en: string }[] = [
  { id: "incident", bn: "ঘটনা", en: "Incident" },
  { id: "ambient", bn: "পটভূমি", en: "Ambient" },
  { id: "both", bn: "উভয়", en: "Both" },
];

export interface HeatLegendProps {
  /** Active heat source selection. */
  mode: HeatMode;
  onModeChange: (mode: HeatMode) => void;
  /** Heat opacity multiplier, 0 → 1. */
  opacity: number;
  onOpacityChange: (value: number) => void;
  /** All-areas overlay opacity multiplier, 0 → 1. */
  areaOpacity: number;
  onAreaOpacityChange: (value: number) => void;
  /** Active category/layer filter, shown so the heat is self-explanatory. */
  layer?: { bn: string; en: string };
  /** Active time window, shown alongside the layer. */
  timeWindow?: { bn: string; en: string };
}

/**
 * Floating heat legend.
 *
 * Collapsed it is the compact gradient card from the reference UI. Expanded it
 * explains the two distinct heat sources the map renders, so users can tell
 * reported incidents apart from the ambient street-level baseline:
 *
 *  1. Incident heat  — density of actual reports in the selected time window.
 *  2. Ambient heat   — baseline risk derived from street/para safety scores.
 *
 * The segmented switch shows either source alone, or both at once.
 */
export function HeatLegend({
  mode,
  onModeChange,
  opacity,
  onOpacityChange,
  areaOpacity,
  onAreaOpacityChange,
  layer,
  timeWindow,
}: HeatLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto w-56 rounded-2xl border border-border bg-card/95 p-3 shadow-lift backdrop-blur lg:w-full">

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="তাপ মানচিত্রের ব্যাখ্যা / Heat map legend"
        className="flex w-full items-baseline justify-between gap-2 text-left"
      >
        <span lang="bn" className="flex items-center gap-1.5 text-[13px] font-bold leading-none">
          <Info className="size-3.5 shrink-0 text-primary" aria-hidden />
          তাপমাত্রা
        </span>
        <span className="flex items-center gap-1">
          <span lang="bn" className="text-[10px] font-semibold text-primary">
            {open ? "ব্যাখ্যা লুকান" : "তাপ মানে কী?"}
          </span>
          <ChevronDown
            aria-hidden
            className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>

      </button>

      <div
        aria-hidden
        className="mt-2 h-2 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg,#4ade80 0%,#a3e635 22%,#facc15 44%,#fb923c 64%,#ef4444 82%,#b91c1c 100%)",
        }}
      />

      <div className="mt-1.5 flex items-center justify-between">
        <span lang="bn" className="text-[11px] font-semibold text-muted-foreground">
          নিরাপদ
        </span>
        <span lang="bn" className="text-[11px] font-semibold text-emergency">
          সংকট
        </span>
      </div>

      {/* What the heat currently represents: active filter + time window. */}
      {(layer || timeWindow) && (
        <div className="mt-2.5 rounded-xl bg-secondary/70 p-2">
          <p lang="bn" className="text-[10px] font-semibold leading-none text-muted-foreground">
            এখন দেখাচ্ছে{" "}
            <span lang="en" className="font-medium">
              Showing now
            </span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {layer && (
              <span className="inline-flex items-baseline gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                <span lang="bn" className="text-[11px] font-bold leading-tight">
                  {layer.bn}
                </span>
                <span lang="en" className="text-[9px] opacity-80">
                  {layer.en}
                </span>
              </span>
            )}
            {timeWindow && (
              <span className="inline-flex items-baseline gap-1 rounded-full bg-card px-2 py-0.5 text-foreground">
                <span lang="bn" className="text-[11px] font-bold leading-tight">
                  {timeWindow.bn}
                </span>
                <span lang="en" className="text-[9px] text-muted-foreground">
                  {timeWindow.en}
                </span>
              </span>
            )}
          </div>
        </div>
      )}



      {/* Heat source switch: incident only / ambient only / both. */}
      <div
        role="group"
        aria-label="তাপের উৎস / Heat source"
        className="mt-2.5 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1"
      >
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => onModeChange(m.id)}
              className={`rounded-full px-1.5 py-1 text-center leading-none transition-all duration-200 active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:bg-card"
              }`}
            >
              <span lang="bn" className="block text-[11px] font-bold">
                {m.bn}
              </span>
              <span lang="en" className="block text-[9px] opacity-80">
                {m.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Heat opacity: lets the user fade heat so area polygons and street
          labels underneath stay readable. */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor="heat-opacity"
            lang="bn"
            className="text-[11px] font-bold leading-none"
          >
            স্বচ্ছতা{" "}
            <span lang="en" className="font-medium text-muted-foreground">
              Opacity
            </span>
          </label>
          <span lang="bn" className="text-[11px] font-bold tabular-nums text-primary">
            {toBnNumber(Math.round(opacity * 100))}%
          </span>
        </div>
        <input
          id="heat-opacity"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          aria-label="তাপের স্বচ্ছতা / Heat opacity"
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        />
      </div>

      {/* All-areas overlay opacity: controls how dimmed the polygons get when
          a category layer takes focus over the choropleth. */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="area-opacity" lang="bn" className="text-[11px] font-bold leading-none">
            এলাকা স্তর{" "}
            <span lang="en" className="font-medium text-muted-foreground">
              Area overlay
            </span>
          </label>
          <span lang="bn" className="text-[11px] font-bold tabular-nums text-primary">
            {toBnNumber(Math.round(areaOpacity * 100))}%
          </span>
        </div>
        <input
          id="area-opacity"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(areaOpacity * 100)}
          onChange={(e) => onAreaOpacityChange(Number(e.target.value) / 100)}
          aria-label="এলাকা স্তরের স্বচ্ছতা / Area overlay opacity"
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        />
      </div>




      {open && (
        <dl className="mt-3 space-y-2.5 border-t border-border pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-2">
            <span
              aria-hidden
              className="mt-0.5 size-3 shrink-0 rounded-full"
              style={{ background: "radial-gradient(circle,#ef4444 0%,rgba(239,68,68,0.15) 70%)" }}
            />
            <div className="min-w-0">
              <dt lang="bn" className="text-[12px] font-bold leading-tight">
                ঘটনার তাপ{" "}
                <span lang="en" className="font-medium text-muted-foreground">
                  Incident heat
                </span>
              </dt>
              <dd lang="bn" className="text-[11px] leading-snug text-muted-foreground">
                নির্বাচিত সময়ে জমা পড়া রিপোর্টের ঘনত্ব
                <span lang="en" className="block">
                  Density of reports in the selected time window
                </span>
              </dd>
            </div>
          </div>

          <div className="flex gap-2">
            <span
              aria-hidden
              className="mt-0.5 size-3 shrink-0 rounded-full"
              style={{ background: "radial-gradient(circle,#facc15 0%,rgba(250,204,21,0.15) 70%)" }}
            />
            <div className="min-w-0">
              <dt lang="bn" className="text-[12px] font-bold leading-tight">
                পটভূমি তাপ{" "}
                <span lang="en" className="font-medium text-muted-foreground">
                  Ambient heat
                </span>
              </dt>
              <dd lang="bn" className="text-[11px] leading-snug text-muted-foreground">
                সড়ক ও পাড়ার নিরাপত্তা স্কোর থেকে তৈরি স্থায়ী ঝুঁকি স্তর
                <span lang="en" className="block">
                  Baseline risk from street & para safety scores
                </span>
              </dd>
            </div>
          </div>
        </dl>
      )}
    </div>
  );
}
