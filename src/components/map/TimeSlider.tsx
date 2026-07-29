import { TIME_WINDOWS } from "@/data/safety-data";
import type { TimeWindow } from "@/types/safety";
import { cn } from "@/lib/utils";

export interface TimeSliderProps {
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}

/**
 * Stepped time slider. Implemented as a segmented control backed by a real
 * range input so keyboard and screen-reader users get native semantics.
 */
export function TimeSlider({ value, onChange }: TimeSliderProps) {
  const index = Math.max(
    0,
    TIME_WINDOWS.findIndex((w) => w.id === value),
  );

  return (
    <div className="rounded-2xl border border-border bg-card/90 p-3 backdrop-blur">
      <div className="flex items-baseline justify-between">
        <span lang="bn" className="text-xs font-bold">
          সময়সীমা
        </span>
        <span lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Time window
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={TIME_WINDOWS.length - 1}
        step={1}
        value={index}
        aria-label="সময়সীমা নির্বাচন / Select time window"
        onChange={(e) => onChange(TIME_WINDOWS[Number(e.target.value)].id)}
        className="mt-2 h-11 w-full cursor-pointer accent-[var(--color-primary)]"
      />

      <div className="mt-1 flex justify-between gap-1">
        {TIME_WINDOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => onChange(w.id)}
            aria-pressed={w.id === value}
            className={cn(
              "flex-1 rounded-lg px-1 py-1 text-center transition-colors",
              w.id === value ? "bg-brand-soft text-primary" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <span lang="bn" className="block text-[11px] font-bold leading-none">
              {w.bn}
            </span>
            <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-70">
              {w.en}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
