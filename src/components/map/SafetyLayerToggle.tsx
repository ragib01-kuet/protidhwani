import { SAFETY_LAYERS } from "@/data/safety-data";
import type { SafetyLayerId } from "@/types/safety";
import { cn } from "@/lib/utils";

export interface SafetyLayerToggleProps {
  value: SafetyLayerId;
  onChange: (id: SafetyLayerId) => void;
}

/** Horizontal chip row — easier to hit on mobile than a dropdown. */
export function SafetyLayerToggle({ value, onChange }: SafetyLayerToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="মানচিত্রের স্তর / Map layers"
      className="scrollbar-none flex gap-2 overflow-x-auto pb-1"
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
              "min-h-11 shrink-0 rounded-full border px-4 py-1.5 text-left transition-all duration-200 active:scale-[0.97]",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-lift"
                : "border-border bg-card/90 text-foreground hover:border-primary/40 hover:bg-brand-soft",
            )}
          >
            <span lang="bn" className="block text-[13px] font-bold leading-tight">
              {layer.bn}
            </span>
            <span
              lang="en"
              className={cn(
                "block text-[9px] uppercase tracking-wider",
                active ? "opacity-80" : "text-muted-foreground",
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
