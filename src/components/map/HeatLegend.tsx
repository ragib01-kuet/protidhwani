/**
 * Floating heat legend — mirrors the reference UI's bottom-left card.
 * Purely presentational; the gradient matches the safety score bands.
 */
export function HeatLegend() {
  return (
    <div className="pointer-events-auto w-48 rounded-2xl border border-border bg-card/95 p-3 shadow-lift backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <span lang="bn" className="text-[13px] font-bold leading-none">
          তাপমাত্রা
        </span>
        <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Heat
        </span>
      </div>

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
    </div>
  );
}
