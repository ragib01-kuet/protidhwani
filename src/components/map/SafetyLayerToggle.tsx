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
      // Wraps instead of scrolling horizontally so every layer stays reachable
      // inside the narrow menu panel.
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
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
              "flex min-h-11 w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all duration-200 active:scale-[0.97]",
              active
                ? "border-foreground bg-foreground text-background shadow-lift"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-brand-soft",
            )}
          >
            <MapPin
              className={cn("size-4 shrink-0", active ? "opacity-90" : "text-primary")}
              aria-hidden
            />
            <span className="min-w-0">
              <span lang="bn" className="block truncate text-[13px] font-bold leading-tight">
                {layer.bn}
              </span>
              <span
                lang="en"
                className={cn(
                  "block truncate text-[11px] leading-tight",
                  active ? "opacity-70" : "text-muted-foreground",
                )}
              >
                {layer.en}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

