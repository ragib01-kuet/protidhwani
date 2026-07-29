import { MapPin } from "lucide-react";

import { SAFETY_LAYERS } from "@/data/safety-data";
import type { SafetyLayerId } from "@/types/safety";
import { cn } from "@/lib/utils";

export interface SafetyLayerToggleProps {
  value: SafetyLayerId;
  onChange: (id: SafetyLayerId) => void;
}

/**
 * Horizontal pill row of map layers. The active pill inverts to a solid dark
 * chip (reference UI) so the selection reads instantly over any basemap.
 */
export function SafetyLayerToggle({ value, onChange }: SafetyLayerToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="মানচিত্রের স্তর / Map layers"
      className="scrollbar-none -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-x-visible"
    >
      {SAFETY_LAYERS.map((layer) => {
        const active = layer.id === value;
        return (
          <button
            key={layer.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(layer.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 transition-all duration-200 active:scale-[0.97]",
              active
                ? "border-foreground bg-foreground text-background shadow-lift"
                : "border-border bg-card/95 text-foreground shadow-card backdrop-blur hover:border-primary/40 hover:bg-brand-soft",
            )}
          >
            <MapPin
              className={cn("size-4 shrink-0", active ? "opacity-90" : "text-primary")}
              aria-hidden
            />
            <span lang="bn" className="text-[13px] font-bold leading-none">
              {layer.bn}
            </span>
            <span
              lang="en"
              className={cn(
                "text-[12px] leading-none",
                active ? "opacity-70" : "text-muted-foreground",
              )}
            >
              {layer.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}
