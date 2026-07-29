import { TIME_WINDOWS } from "@/data/safety-data";
import type { TimeWindow } from "@/types/safety";
import { cn } from "@/lib/utils";

export interface TimeWindowChipsProps {
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}

/**
 * Segmented timeline control rendered as one floating pill, as in the
 * reference UI. Bangla labels are dominant; the active segment fills green.
 */
export function TimeWindowChips({ value, onChange }: TimeWindowChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="সময়সীমা / Time window"
      className="flex flex-wrap items-center gap-1 rounded-3xl border border-border bg-card p-1 shadow-card"
    >

      {TIME_WINDOWS.map((w) => {
        const active = w.id === value;
        return (
          <button
            key={w.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(w.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200 active:scale-[0.97]",
              active
                ? "bg-primary text-primary-foreground shadow-card"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <span lang="bn">{w.bn}</span>
          </button>
        );
      })}
    </div>
  );
}
