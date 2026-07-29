import { X, TriangleAlert } from "lucide-react";

import { DistrictSelector } from "@/components/map/DistrictSelector";
import { SafetyLayerToggle } from "@/components/map/SafetyLayerToggle";
import { TimeWindowChips } from "@/components/map/TimeWindowChips";
import type { District, HeatMode, SafetyLayerId, TimeWindow } from "@/types/safety";
import { toBnNumber } from "@/utils/bn";

const MODES: { id: HeatMode; bn: string; en: string }[] = [
  { id: "incident", bn: "ঘটনা", en: "Incident" },
  { id: "ambient", bn: "পটভূমি", en: "Ambient" },
  { id: "both", bn: "উভয়", en: "Both" },
];

export interface MapMenuProps {
  open: boolean;
  onClose: () => void;
  districtId: string;
  onDistrictChange: (district: District) => void;
  districtCovered: boolean;
  districtName: { bn: string; en: string };
  layerId: SafetyLayerId;
  onLayerChange: (id: SafetyLayerId) => void;
  timeWindow: TimeWindow;
  onTimeWindowChange: (id: TimeWindow) => void;
  heatMode: HeatMode;
  onHeatModeChange: (mode: HeatMode) => void;
  heatOpacity: number;
  onHeatOpacityChange: (value: number) => void;
  areaOpacity: number;
  onAreaOpacityChange: (value: number) => void;
}

function Section({ bn, en, children }: { bn: string; en: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline gap-1.5">
        <span lang="bn" className="text-[13px] font-bold leading-none">
          {bn}
        </span>
        <span lang="en" className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {en}
        </span>
      </h3>
      {children}
    </section>
  );
}

function Slider({
  id,
  bn,
  en,
  value,
  onChange,
}: {
  id: string;
  bn: string;
  en: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} lang="bn" className="text-[12px] font-bold leading-none">
          {bn}{" "}
          <span lang="en" className="font-medium text-muted-foreground">
            {en}
          </span>
        </label>
        <span lang="bn" className="text-[11px] font-bold tabular-nums text-primary">
          {toBnNumber(Math.round(value * 100))}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
    </div>
  );
}

/**
 * Single control surface for the map. Everything that used to float over the
 * map — district, layers, time window, heat sources and opacity — now lives
 * here, so the map itself stays clean and readable.
 */
export function MapMenu({
  open,
  onClose,
  districtId,
  onDistrictChange,
  districtCovered,
  districtName,
  layerId,
  onLayerChange,
  timeWindow,
  onTimeWindowChange,
  heatMode,
  onHeatModeChange,
  heatOpacity,
  onHeatOpacityChange,
  areaOpacity,
  onAreaOpacityChange,
}: MapMenuProps) {
  if (!open) return null;

  return (
    <div className="pointer-events-auto w-full overflow-y-auto rounded-3xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200 max-h-[min(70dvh,34rem)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="min-w-0">
          <span lang="bn" className="block truncate text-[15px] font-bold leading-tight">
            মানচিত্র নিয়ন্ত্রণ
          </span>
          <span lang="en" className="block text-[11px] leading-tight text-muted-foreground">
            Map controls
          </span>
        </p>
        <button
          onClick={onClose}
          aria-label="বন্ধ করুন / Close menu"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-4">
        <Section bn="জেলা" en="District">
          <DistrictSelector value={districtId} onChange={onDistrictChange} />
          {!districtCovered && (
            <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning-soft px-3 py-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <p className="min-w-0">
                <span lang="bn" className="block text-[12px] font-bold leading-snug">
                  {districtName.bn}-এ সড়ক/পাড়া তাপ এখনো নেই।
                </span>
                <span lang="en" className="block text-[10px] leading-snug text-muted-foreground">
                  No street-level heat for {districtName.en} yet.
                </span>
              </p>
            </div>
          )}
        </Section>

        <Section bn="স্তর" en="Layer">
          <SafetyLayerToggle value={layerId} onChange={onLayerChange} />
        </Section>

        <Section bn="সময়" en="Time window">
          <TimeWindowChips value={timeWindow} onChange={onTimeWindowChange} />
        </Section>

        <Section bn="তাপের উৎস" en="Heat source">
          <div
            role="group"
            aria-label="তাপের উৎস / Heat source"
            className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1"
          >
            {MODES.map((m) => {
              const active = m.id === heatMode;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onHeatModeChange(m.id)}
                  className={`rounded-full px-1.5 py-1.5 text-center leading-none transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-card"
                  }`}
                >
                  <span lang="bn" className="block text-[12px] font-bold">
                    {m.bn}
                  </span>
                  <span lang="en" className="block text-[9px] opacity-80">
                    {m.en}
                  </span>
                </button>
              );
            })}
          </div>
          <p lang="bn" className="text-[11px] leading-snug text-muted-foreground">
            ঘটনার তাপ = জমা পড়া রিপোর্টের ঘনত্ব; পটভূমি তাপ = এলাকার সাধারণ ঝুঁকি।
            <span lang="en" className="block">
              Incident heat = reported density. Ambient heat = baseline area risk.
            </span>
          </p>
        </Section>

        <Section bn="স্বচ্ছতা" en="Opacity">
          <Slider
            id="heat-opacity"
            bn="তাপ"
            en="Heat"
            value={heatOpacity}
            onChange={onHeatOpacityChange}
          />
          <Slider
            id="area-opacity"
            bn="এলাকা স্তর"
            en="Area layer"
            value={areaOpacity}
            onChange={onAreaOpacityChange}
          />
        </Section>
      </div>
    </div>
  );
}
